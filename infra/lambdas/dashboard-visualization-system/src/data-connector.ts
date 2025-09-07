/**
 * Data Connector
 * Handles data retrieval from various sources for dashboard widgets
 */
import { TimestreamQueryClient, QueryCommand } from '@aws-sdk/client-timestream-query';
import { DynamoDBDocumentClient, QueryCommand as DynamoQueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { Pool } from 'pg';
import { createClient, RedisClientType } from 'redis';
import { 
  DataSource, 
  DataQuery, 
  DataSourceConnection,
  CacheConfig,
  DatabaseCredentials 
} from './types';

export class DataConnector {
  private timestreamClient: TimestreamQueryClient;
  private dynamoClient: DynamoDBDocumentClient;
  private s3Client: S3Client;
  private secretsClient: SecretsManagerClient;
  private pgPools: Map<string, Pool> = new Map();
  private redisClients: Map<string, RedisClientType> = new Map();

  constructor(region: string = 'eu-central-1') {
    this.timestreamClient = new TimestreamQueryClient({ region });
    const dynamoClient = new DynamoDBClient({ region });
    this.dynamoClient = DynamoDBDocumentClient.from(dynamoClient);
    this.s3Client = new S3Client({ region });
    this.secretsClient = new SecretsManagerClient({ region });
  }

  /**
   * Execute data query based on data source type
   */
  async executeQuery(dataSource: DataSource): Promise<any[]> {
    const startTime = Date.now();
    
    try {
      // Check cache first if enabled
      if (dataSource.cache.enabled) {
        const cachedData = await this.getCachedData(dataSource);
        if (cachedData) {
          console.log(`Cache hit for data source ${dataSource.id}`);
          return cachedData;
        }
      }

      let data: any[];

      switch (dataSource.type) {
        case 'analytics_api':
          data = await this.queryAnalyticsAPI(dataSource);
          break;
        case 'timestream':
          data = await this.queryTimestream(dataSource);
          break;
        case 'dynamodb':
          data = await this.queryDynamoDB(dataSource);
          break;
        case 'postgresql':
          data = await this.queryPostgreSQL(dataSource);
          break;
        case 'redis':
          data = await this.queryRedis(dataSource);
          break;
        case 's3':
          data = await this.queryS3(dataSource);
          break;
        case 'external_api':
          data = await this.queryExternalAPI(dataSource);
          break;
        case 'static':
          data = await this.getStaticData(dataSource);
          break;
        default:
          throw new Error(`Unsupported data source type: ${dataSource.type}`);
      }

      // Apply post-processing
      data = this.processQueryResults(data, dataSource.query);

      // Cache results if enabled
      if (dataSource.cache.enabled) {
        await this.setCachedData(dataSource, data);
      }

      const executionTime = Date.now() - startTime;
      console.log(`Query executed in ${executionTime}ms for data source ${dataSource.id}`);

      return data;
    } catch (error) {
      console.error(`Query failed for data source ${dataSource.id}:`, error);
      throw error;
    }
  }

  /**
   * Query Analytics API (Real-time Analytics Engine)
   */
  private async queryAnalyticsAPI(dataSource: DataSource): Promise<any[]> {
    const { connection, query } = dataSource;
    
    const requestBody = {
      queryId: `dashboard_${Date.now()}`,
      metrics: query.parameters.metrics || [],
      dimensions: query.parameters.dimensions || [],
      filters: query.parameters.filters || [],
      timeRange: query.timeRange || {
        start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString(),
      },
      granularity: query.parameters.granularity || 'hour',
      limit: query.limit,
    };

    const response = await fetch(`${connection.endpoint}/analytics/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await this.getSecret(connection.credentials!)}`,
        ...connection.headers,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Analytics API query failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data || [];
  }

  /**
   * Query TimeStream
   */
  private async queryTimestream(dataSource: DataSource): Promise<any[]> {
    const { query } = dataSource;
    
    const command = new QueryCommand({
      QueryString: query.query,
    });

    const response = await this.timestreamClient.send(command);
    
    if (!response.Rows || !response.ColumnInfo) {
      return [];
    }

    // Parse TimeStream results
    const results: any[] = [];
    for (const row of response.Rows) {
      const record: any = {};
      for (let i = 0; i < response.ColumnInfo.length; i++) {
        const column = response.ColumnInfo[i];
        const value = row.Data[i].ScalarValue;
        record[column.Name!] = this.parseTimestreamValue(value, column.Type!.ScalarType!);
      }
      results.push(record);
    }

    return results;
  }

  /**
   * Query DynamoDB
   */
  private async queryDynamoDB(dataSource: DataSource): Promise<any[]> {
    const { connection, query } = dataSource;
    
    let command;
    
    if (query.query.startsWith('SCAN')) {
      // Scan operation
      command = new ScanCommand({
        TableName: connection.table!,
        FilterExpression: query.parameters.filterExpression,
        ExpressionAttributeValues: query.parameters.expressionAttributeValues,
        ExpressionAttributeNames: query.parameters.expressionAttributeNames,
        Limit: query.limit,
      });
    } else {
      // Query operation
      command = new DynamoQueryCommand({
        TableName: connection.table!,
        KeyConditionExpression: query.parameters.keyConditionExpression,
        FilterExpression: query.parameters.filterExpression,
        ExpressionAttributeValues: query.parameters.expressionAttributeValues,
        ExpressionAttributeNames: query.parameters.expressionAttributeNames,
        IndexName: query.parameters.indexName,
        ScanIndexForward: query.parameters.scanIndexForward !== false,
        Limit: query.limit,
      });
    }

    const response = await this.dynamoClient.send(command);
    return response.Items || [];
  }

  /**
   * Query PostgreSQL
   */
  private async queryPostgreSQL(dataSource: DataSource): Promise<any[]> {
    const pool = await this.getPostgreSQLPool(dataSource.connection);
    const { query } = dataSource;
    
    const client = await pool.connect();
    try {
      const result = await client.query(query.query, Object.values(query.parameters));
      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Query Redis
   */
  private async queryRedis(dataSource: DataSource): Promise<any[]> {
    const redisClient = await this.getRedisClient(dataSource.connection);
    const { query } = dataSource;
    
    const results: any[] = [];
    
    switch (query.parameters.operation) {
      case 'get':
        const value = await redisClient.get(query.parameters.key);
        if (value) {
          results.push({ key: query.parameters.key, value: JSON.parse(value) });
        }
        break;
        
      case 'mget':
        const values = await redisClient.mGet(query.parameters.keys);
        for (let i = 0; i < query.parameters.keys.length; i++) {
          if (values[i]) {
            results.push({ 
              key: query.parameters.keys[i], 
              value: JSON.parse(values[i]!) 
            });
          }
        }
        break;
        
      case 'keys':
        const keys = await redisClient.keys(query.parameters.pattern);
        for (const key of keys) {
          const value = await redisClient.get(key);
          if (value) {
            results.push({ key, value: JSON.parse(value) });
          }
        }
        break;
        
      case 'hgetall':
        const hash = await redisClient.hGetAll(query.parameters.key);
        results.push(hash);
        break;
        
      default:
        throw new Error(`Unsupported Redis operation: ${query.parameters.operation}`);
    }
    
    return results;
  }

  /**
   * Query S3
   */
  private async queryS3(dataSource: DataSource): Promise<any[]> {
    const { connection, query } = dataSource;
    
    const command = new GetObjectCommand({
      Bucket: connection.database!, // Using database field for bucket name
      Key: query.parameters.key,
    });

    const response = await this.s3Client.send(command);
    
    if (!response.Body) {
      return [];
    }

    const content = await response.Body.transformToString();
    
    // Parse based on file type
    const fileExtension = query.parameters.key.split('.').pop()?.toLowerCase();
    
    switch (fileExtension) {
      case 'json':
        return JSON.parse(content);
      case 'csv':
        return this.parseCSV(content);
      case 'txt':
        return [{ content }];
      default:
        return [{ raw: content }];
    }
  }

  /**
   * Query External API
   */
  private async queryExternalAPI(dataSource: DataSource): Promise<any[]> {
    const { connection, query } = dataSource;
    
    const url = new URL(connection.endpoint!);
    
    // Add query parameters
    for (const [key, value] of Object.entries(query.parameters)) {
      url.searchParams.append(key, String(value));
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...connection.headers,
    };

    // Add authentication if credentials provided
    if (connection.credentials) {
      const credentials = await this.getSecret(connection.credentials);
      headers['Authorization'] = `Bearer ${credentials}`;
    }

    const response = await fetch(url.toString(), {
      method: query.query || 'GET',
      headers,
      body: query.query === 'POST' ? JSON.stringify(query.parameters) : undefined,
    });

    if (!response.ok) {
      throw new Error(`External API query failed: ${response.statusText}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [data];
  }

  /**
   * Get static data
   */
  private async getStaticData(dataSource: DataSource): Promise<any[]> {
    return dataSource.query.parameters.data || [];
  }

  /**
   * Process query results (filtering, sorting, aggregation)
   */
  private processQueryResults(data: any[], query: DataQuery): any[] {
    let processedData = [...data];

    // Apply aggregation if specified
    if (query.aggregation) {
      processedData = this.applyAggregation(processedData, query.aggregation);
    }

    // Apply sorting
    if (query.sorting && query.sorting.length > 0) {
      processedData = this.applySorting(processedData, query.sorting);
    }

    // Apply pagination
    if (query.offset || query.limit) {
      const start = query.offset || 0;
      const end = query.limit ? start + query.limit : undefined;
      processedData = processedData.slice(start, end);
    }

    return processedData;
  }

  /**
   * Apply aggregation to data
   */
  private applyAggregation(data: any[], aggregation: any): any[] {
    const { groupBy, metrics, having } = aggregation;
    
    if (!groupBy || groupBy.length === 0) {
      // No grouping, just calculate metrics
      const result: any = {};
      for (const metric of metrics) {
        result[metric.alias || metric.field] = this.calculateMetric(data, metric);
      }
      return [result];
    }

    // Group data
    const groups = new Map<string, any[]>();
    
    for (const row of data) {
      const groupKey = groupBy.map(field => row[field]).join('|');
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(row);
    }

    // Calculate metrics for each group
    const results: any[] = [];
    
    for (const [groupKey, groupData] of groups) {
      const result: any = {};
      
      // Add group by fields
      const groupValues = groupKey.split('|');
      for (let i = 0; i < groupBy.length; i++) {
        result[groupBy[i]] = groupValues[i];
      }
      
      // Calculate metrics
      for (const metric of metrics) {
        result[metric.alias || metric.field] = this.calculateMetric(groupData, metric);
      }
      
      results.push(result);
    }

    // Apply having filter if specified
    if (having && having.length > 0) {
      return results.filter(row => this.evaluateHavingConditions(row, having));
    }

    return results;
  }

  /**
   * Calculate metric value
   */
  private calculateMetric(data: any[], metric: any): number {
    const values = data.map(row => parseFloat(row[metric.field]) || 0);
    
    switch (metric.function) {
      case 'sum':
        return values.reduce((sum, val) => sum + val, 0);
      case 'avg':
        return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
      case 'min':
        return Math.min(...values);
      case 'max':
        return Math.max(...values);
      case 'count':
        return data.length;
      case 'distinct_count':
        return new Set(values).size;
      case 'percentile':
        return this.calculatePercentile(values, metric.percentile || 50);
      default:
        return 0;
    }
  }

  /**
   * Calculate percentile
   */
  private calculatePercentile(values: number[], percentile: number): number {
    const sorted = values.sort((a, b) => a - b);
    const index = (percentile / 100) * (sorted.length - 1);
    
    if (index === Math.floor(index)) {
      return sorted[index];
    } else {
      const lower = sorted[Math.floor(index)];
      const upper = sorted[Math.ceil(index)];
      return lower + (upper - lower) * (index - Math.floor(index));
    }
  }

  /**
   * Apply sorting to data
   */
  private applySorting(data: any[], sorting: any[]): any[] {
    return data.sort((a, b) => {
      for (const sort of sorting) {
        const aVal = a[sort.field];
        const bVal = b[sort.field];
        
        let comparison = 0;
        if (aVal < bVal) comparison = -1;
        else if (aVal > bVal) comparison = 1;
        
        if (comparison !== 0) {
          return sort.direction === 'desc' ? -comparison : comparison;
        }
      }
      return 0;
    });
  }

  /**
   * Evaluate having conditions
   */
  private evaluateHavingConditions(row: any, conditions: any[]): boolean {
    return conditions.every(condition => {
      const value = row[condition.field];
      switch (condition.operator) {
        case 'equals':
          return value === condition.value;
        case 'greater_than':
          return value > condition.value;
        case 'less_than':
          return value < condition.value;
        default:
          return true;
      }
    });
  }

  /**
   * Cache management
   */
  private async getCachedData(dataSource: DataSource): Promise<any[] | null> {
    try {
      const cacheKey = this.generateCacheKey(dataSource);
      const redisClient = await this.getDefaultRedisClient();
      
      const cached = await redisClient.get(cacheKey);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Cache retrieval failed:', error);
      return null;
    }
  }

  private async setCachedData(dataSource: DataSource, data: any[]): Promise<void> {
    try {
      const cacheKey = this.generateCacheKey(dataSource);
      const redisClient = await this.getDefaultRedisClient();
      
      await redisClient.setEx(
        cacheKey, 
        dataSource.cache.ttl, 
        JSON.stringify(data)
      );
    } catch (error) {
      console.error('Cache storage failed:', error);
    }
  }

  private generateCacheKey(dataSource: DataSource): string {
    const keyData = {
      id: dataSource.id,
      query: dataSource.query,
      timestamp: Math.floor(Date.now() / (dataSource.cache.ttl * 1000)),
    };
    return `dashboard_cache:${Buffer.from(JSON.stringify(keyData)).toString('base64')}`;
  }

  /**
   * Connection management
   */
  private async getPostgreSQLPool(connection: DataSourceConnection): Promise<Pool> {
    const poolKey = `${connection.endpoint}:${connection.database}`;
    
    if (this.pgPools.has(poolKey)) {
      return this.pgPools.get(poolKey)!;
    }

    const credentials = await this.getSecret(connection.credentials!);
    const creds: DatabaseCredentials = JSON.parse(credentials);

    const pool = new Pool({
      host: creds.host,
      user: creds.username,
      password: creds.password,
      database: creds.dbname,
      port: Number(creds.port) || 5432,
      ssl: { rejectUnauthorized: false },
      max: 10,
      min: 2,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: connection.timeout || 10000,
    });

    this.pgPools.set(poolKey, pool);
    return pool;
  }

  private async getRedisClient(connection: DataSourceConnection): Promise<RedisClientType> {
    const clientKey = `${connection.endpoint}:${connection.database}`;
    
    if (this.redisClients.has(clientKey)) {
      return this.redisClients.get(clientKey)!;
    }

    const client = createClient({
      socket: {
        host: connection.endpoint!,
        port: Number(connection.database) || 6379,
      },
      password: connection.credentials ? await this.getSecret(connection.credentials) : undefined,
    });

    await client.connect();
    this.redisClients.set(clientKey, client);
    return client;
  }

  private async getDefaultRedisClient(): Promise<RedisClientType> {
    const defaultConnection: DataSourceConnection = {
      endpoint: process.env.REDIS_HOST || 'localhost',
      database: process.env.REDIS_PORT || '6379',
      credentials: process.env.REDIS_PASSWORD_SECRET,
    };
    
    return await this.getRedisClient(defaultConnection);
  }

  private async getSecret(secretArn: string): Promise<string> {
    const command = new GetSecretValueCommand({ SecretId: secretArn });
    const response = await this.secretsClient.send(command);
    return response.SecretString || '';
  }

  /**
   * Utility methods
   */
  private parseTimestreamValue(value: string, type: string): any {
    switch (type) {
      case 'BIGINT':
        return parseInt(value);
      case 'DOUBLE':
        return parseFloat(value);
      case 'BOOLEAN':
        return value.toLowerCase() === 'true';
      case 'TIMESTAMP':
        return new Date(value);
      default:
        return value;
    }
  }

  private parseCSV(content: string): any[] {
    const lines = content.trim().split('\n');
    if (lines.length === 0) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const results: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row: any = {};
      
      for (let j = 0; j < headers.length; j++) {
        row[headers[j]] = values[j] || '';
      }
      
      results.push(row);
    }

    return results;
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    // Close PostgreSQL pools
    for (const pool of this.pgPools.values()) {
      await pool.end();
    }
    this.pgPools.clear();

    // Close Redis clients
    for (const client of this.redisClients.values()) {
      await client.quit();
    }
    this.redisClients.clear();
  }
}