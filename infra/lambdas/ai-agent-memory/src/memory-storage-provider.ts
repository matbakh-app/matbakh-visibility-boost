/**
 * Memory Storage Provider - DynamoDB Implementation
 * Persistent storage layer for AI agent memory with multi-tenant support
 */

import {
  DynamoDBClient,
  PutItemCommand,
  QueryCommand,
  UpdateItemCommand,
  DeleteItemCommand,
  ScanCommand,
  BatchWriteItemCommand
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import {
  MemoryContext,
  MemoryQuery,
  MemoryStats,
  MemoryStorageProvider,
  MemoryOptimizationConfig,
  MemoryError,
  TenantQuotaExceededError,
  MemoryNotFoundError,
  TenantConfig
} from './types';

export class DynamoDBMemoryStorage implements MemoryStorageProvider {
  private client: DynamoDBClient;
  private tableName: string;
  private indexName: string;

  constructor(
    region: string = process.env.AWS_REGION || 'eu-central-1',
    tableName: string = process.env.MEMORY_TABLE_NAME || 'ai-agent-memory',
    client?: DynamoDBClient
  ) {
    this.client = client || new DynamoDBClient({ region });
    this.tableName = tableName;
    this.indexName = 'tenant-timestamp-index';
  }

  async store(context: MemoryContext): Promise<void> {
    try {
      // Check tenant quota before storing
      await this.checkTenantQuota(context.tenantId, context);

      const item = {
        ...context,
        pk: `TENANT#${context.tenantId}`,
        sk: `CONTEXT#${context.id}`,
        gsi1pk: `USER#${context.userId}`,
        gsi1sk: `SESSION#${context.sessionId}`,
        ttl: context.expiresAt ? Math.floor(context.expiresAt.getTime() / 1000) : undefined
      };

      const command = new PutItemCommand({
        TableName: this.tableName,
        Item: marshall(item, { removeUndefinedValues: true }),
        ConditionExpression: 'attribute_not_exists(pk)'
      });

      await this.client.send(command);
    } catch (error) {
      if (error && (error as any).name === 'ConditionalCheckFailedException') {
        throw new MemoryError(`Memory context already exists: ${context.id}`, 'ALREADY_EXISTS', 409);
      }
      throw new MemoryError(`Failed to store memory context: ${error}`, 'STORAGE_ERROR');
    }
  }

  async retrieve(query: MemoryQuery): Promise<MemoryContext[]> {
    try {
      const results: MemoryContext[] = [];

      if (query.userId && query.sessionId) {
        // Query by user and session
        const command = new QueryCommand({
          TableName: this.tableName,
          IndexName: 'user-session-index',
          KeyConditionExpression: 'gsi1pk = :userId AND begins_with(gsi1sk, :sessionPrefix)',
          ExpressionAttributeValues: marshall({
            ':userId': `USER#${query.userId}`,
            ':sessionPrefix': `SESSION#${query.sessionId}`
          }),
          Limit: query.limit || 100
        });

        const response = await this.client.send(command);
        if (response.Items) {
          results.push(...response.Items.map(item => this.unmarshallContext(item)));
        }
      } else {
        // Query by tenant
        const command = new QueryCommand({
          TableName: this.tableName,
          KeyConditionExpression: 'pk = :tenantId',
          ExpressionAttributeValues: marshall({
            ':tenantId': `TENANT#${query.tenantId}`
          }),
          Limit: query.limit || 100
        });

        const response = await this.client.send(command);
        if (response.Items) {
          results.push(...response.Items.map(item => this.unmarshallContext(item)));
        }
      }

      // Apply filters
      return this.applyFilters(results, query);
    } catch (error) {
      throw new MemoryError(`Failed to retrieve memory contexts: ${error}`, 'RETRIEVAL_ERROR');
    }
  }

  async update(contextId: string, updates: Partial<MemoryContext>): Promise<void> {
    try {
      if (!updates.tenantId) {
        throw new MemoryError('TenantId required for update operation', 'INVALID_UPDATE', 400);
      }

      const updateExpressions: string[] = [];
      const expressionAttributeNames: Record<string, string> = {};
      const expressionAttributeValues: Record<string, any> = {};

      Object.entries(updates).forEach(([key, value], index) => {
        if (key !== 'id' && key !== 'tenantId' && value !== undefined) {
          const attrName = `#attr${index}`;
          const attrValue = `:val${index}`;
          updateExpressions.push(`${attrName} = ${attrValue}`);
          expressionAttributeNames[attrName] = key;
          expressionAttributeValues[attrValue] = value;
        }
      });

      if (updateExpressions.length === 0) {
        return; // No updates to apply
      }

      // Always update the updatedAt timestamp
      updateExpressions.push('#updatedAt = :updatedAt');
      expressionAttributeNames['#updatedAt'] = 'updatedAt';
      expressionAttributeValues[':updatedAt'] = new Date();

      const command = new UpdateItemCommand({
        TableName: this.tableName,
        Key: marshall({
          pk: `TENANT#${updates.tenantId}`,
          sk: `CONTEXT#${contextId}`
        }),
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: marshall(expressionAttributeValues),
        ConditionExpression: 'attribute_exists(pk)'
      });

      await this.client.send(command);
    } catch (error) {
      if (error instanceof Error && error.name === 'ConditionalCheckFailedException') {
        throw new MemoryNotFoundError(contextId);
      }
      throw new MemoryError(`Failed to update memory context: ${error}`, 'UPDATE_ERROR');
    }
  }

  async delete(contextId: string, tenantId: string): Promise<void> {
    try {
      const command = new DeleteItemCommand({
        TableName: this.tableName,
        Key: marshall({
          pk: `TENANT#${tenantId}`,
          sk: `CONTEXT#${contextId}`
        }),
        ConditionExpression: 'attribute_exists(pk)'
      });

      await this.client.send(command);
    } catch (error) {
      if (error instanceof Error && error.name === 'ConditionalCheckFailedException') {
        throw new MemoryNotFoundError(contextId);
      }
      throw new MemoryError(`Failed to delete memory context: ${error}`, 'DELETE_ERROR');
    }
  }

  async cleanup(tenantId: string, config: MemoryOptimizationConfig): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - (config.retentionPeriod * 24 * 60 * 60 * 1000));
      let deletedCount = 0;

      // Query all contexts for tenant
      const command = new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: 'pk = :tenantId',
        ExpressionAttributeValues: marshall({
          ':tenantId': `TENANT#${tenantId}`
        })
      });

      const response = await this.client.send(command);
      if (!response.Items) return 0;

      const contextsToDelete: MemoryContext[] = [];
      
      for (const item of response.Items) {
        const context = this.unmarshallContext(item);
        
        // Check if context should be deleted based on age or relevance
        const shouldDelete = 
          context.createdAt < cutoffDate ||
          context.relevanceScore < config.relevanceThreshold;

        if (shouldDelete) {
          contextsToDelete.push(context);
        }
      }

      // Batch delete contexts
      if (contextsToDelete.length > 0) {
        const deleteRequests = contextsToDelete.map(context => ({
          DeleteRequest: {
            Key: marshall({
              pk: `TENANT#${context.tenantId}`,
              sk: `CONTEXT#${context.id}`
            })
          }
        }));

        // Process in batches of 25 (DynamoDB limit)
        for (let i = 0; i < deleteRequests.length; i += 25) {
          const batch = deleteRequests.slice(i, i + 25);
          
          const batchCommand = new BatchWriteItemCommand({
            RequestItems: {
              [this.tableName]: batch
            }
          });

          await this.client.send(batchCommand);
          deletedCount += batch.length;
        }
      }

      return deletedCount;
    } catch (error) {
      throw new MemoryError(`Failed to cleanup memory contexts: ${error}`, 'CLEANUP_ERROR');
    }
  }

  async getStats(tenantId: string): Promise<MemoryStats> {
    try {
      const command = new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: 'pk = :tenantId',
        ExpressionAttributeValues: marshall({
          ':tenantId': `TENANT#${tenantId}`
        })
      });

      const response = await this.client.send(command);
      if (!response.Items || response.Items.length === 0) {
        return {
          totalMemoryUsed: 0,
          memoryByType: {} as any,
          memoryByUser: {},
          averageRelevanceScore: 0,
          oldestEntry: new Date(),
          newestEntry: new Date()
        };
      }

      const contexts = response.Items.map(item => this.unmarshallContext(item));
      
      let totalSize = 0;
      const memoryByType: Record<string, number> = {};
      const memoryByUser: Record<string, number> = {};
      let totalRelevanceScore = 0;
      let oldestEntry = new Date();
      let newestEntry = new Date(0);

      contexts.forEach(context => {
        const contextSize = this.calculateContextSize(context);
        totalSize += contextSize;

        // Group by type
        memoryByType[context.contextType] = (memoryByType[context.contextType] || 0) + contextSize;

        // Group by user
        memoryByUser[context.userId] = (memoryByUser[context.userId] || 0) + contextSize;

        // Relevance score
        totalRelevanceScore += context.relevanceScore;

        // Date tracking
        if (context.createdAt < oldestEntry) {
          oldestEntry = context.createdAt;
        }
        if (context.createdAt > newestEntry) {
          newestEntry = context.createdAt;
        }
      });

      return {
        totalMemoryUsed: totalSize / (1024 * 1024), // Convert to MB
        memoryByType: Object.fromEntries(
          Object.entries(memoryByType).map(([type, size]) => [type, size / (1024 * 1024)])
        ) as any,
        memoryByUser: Object.fromEntries(
          Object.entries(memoryByUser).map(([user, size]) => [user, size / (1024 * 1024)])
        ),
        averageRelevanceScore: totalRelevanceScore / contexts.length,
        oldestEntry,
        newestEntry
      };
    } catch (error) {
      throw new MemoryError(`Failed to get memory stats: ${error}`, 'STATS_ERROR');
    }
  }

  private async checkTenantQuota(tenantId: string, context: MemoryContext): Promise<void> {
    const stats = await this.getStats(tenantId);
    const contextSize = this.calculateContextSize(context) / (1024 * 1024); // MB
    
    // Default quota: 100MB per tenant
    const quota = 100;
    
    if (stats.totalMemoryUsed + contextSize > quota) {
      throw new TenantQuotaExceededError(tenantId, stats.totalMemoryUsed + contextSize, quota);
    }
  }

  private calculateContextSize(context: MemoryContext): number {
    // Rough estimation of context size in bytes
    return JSON.stringify(context).length * 2; // UTF-16 encoding
  }

  private unmarshallContext(item: Record<string, any>): MemoryContext {
    const unmarshalled = unmarshall(item);
    
    // Handle test environment where unmarshall might return the item directly
    const data = unmarshalled || item;
    
    return {
      id: data.id,
      tenantId: data.tenantId,
      userId: data.userId,
      sessionId: data.sessionId,
      agentId: data.agentId,
      contextType: data.contextType,
      content: data.content,
      metadata: data.metadata,
      relevanceScore: data.relevanceScore,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined
    };
  }

  private applyFilters(contexts: MemoryContext[], query: MemoryQuery): MemoryContext[] {
    let filtered = contexts;

    // Filter by context types
    if (query.contextTypes && query.contextTypes.length > 0) {
      filtered = filtered.filter(context => 
        query.contextTypes!.includes(context.contextType)
      );
    }

    // Filter by time range
    if (query.timeRange) {
      filtered = filtered.filter(context =>
        context.createdAt >= query.timeRange!.start &&
        context.createdAt <= query.timeRange!.end
      );
    }

    // Filter by relevance threshold
    if (query.relevanceThreshold !== undefined) {
      filtered = filtered.filter(context =>
        context.relevanceScore >= query.relevanceThreshold!
      );
    }

    // Filter by tags
    if (query.tags && query.tags.length > 0) {
      filtered = filtered.filter(context =>
        query.tags!.some(tag => context.metadata.tags.includes(tag))
      );
    }

    // Sort by relevance score (descending) and creation date (descending)
    filtered.sort((a, b) => {
      if (a.relevanceScore !== b.relevanceScore) {
        return b.relevanceScore - a.relevanceScore;
      }
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    // Apply limit
    if (query.limit && query.limit > 0) {
      filtered = filtered.slice(0, query.limit);
    }

    return filtered;
  }
}