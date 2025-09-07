/**
 * Response Cache System
 * 
 * Implements response caching with 24-hour TTL for AI responses
 * Reduces costs and improves performance for repeated requests
 */

import { DynamoDBClient, PutItemCommand, GetItemCommand, DeleteItemCommand, QueryCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { createHash } from 'crypto';

export interface CacheEntry {
  cacheKey: string;
  operation: string;
  requestHash: string;
  response: any;
  metadata: {
    tokenCount?: number;
    processingTime: number;
    timestamp: number;
    userId?: string;
    personaType?: string;
  };
  ttl: number; // DynamoDB TTL
  hitCount: number;
  lastAccessed: number;
}

export interface CacheConfig {
  defaultTtlHours: number;
  maxCacheSize: number;
  enableCompression: boolean;
  cacheableOperations: string[];
  excludePatterns: string[];
}

export interface CacheStats {
  totalEntries: number;
  hitRate: number;
  totalHits: number;
  totalMisses: number;
  avgResponseTime: number;
  cacheSize: number;
}

export class ResponseCacheSystem {
  private dynamodb: DynamoDBClient;
  private cacheTableName: string;
  private config: CacheConfig;
  private stats: {
    hits: number;
    misses: number;
    totalRequests: number;
  } = { hits: 0, misses: 0, totalRequests: 0 };

  constructor() {
    this.dynamodb = new DynamoDBClient({ 
      region: process.env.AWS_REGION || 'eu-central-1' 
    });
    
    this.cacheTableName = process.env.BEDROCK_CACHE_TABLE || 'bedrock-response-cache';
    
    this.config = {
      defaultTtlHours: 24,
      maxCacheSize: parseInt(process.env.MAX_CACHE_SIZE || '10000'),
      enableCompression: process.env.ENABLE_CACHE_COMPRESSION === 'true',
      cacheableOperations: [
        'vc-analysis',
        'content-generation',
        'business-framework',
        'persona-detection'
      ],
      excludePatterns: [
        'real-time',
        'live-data',
        'current-timestamp'
      ]
    };
  }

  /**
   * Generate cache key from request parameters
   */
  private generateCacheKey(
    operation: string,
    payload: any,
    userId?: string,
    personaType?: string
  ): string {
    // Create a normalized payload for consistent hashing
    const normalizedPayload = this.normalizePayload(payload);
    
    const keyData = {
      operation,
      payload: normalizedPayload,
      userId: userId || 'anonymous',
      personaType: personaType || 'default'
    };

    const hash = createHash('sha256')
      .update(JSON.stringify(keyData))
      .digest('hex');

    return `${operation}:${hash}`;
  }

  /**
   * Normalize payload for consistent caching
   */
  private normalizePayload(payload: any): any {
    if (!payload || typeof payload !== 'object') {
      return payload;
    }

    // Remove timestamp-based fields that would prevent cache hits
    const normalized = { ...payload };
    delete normalized.timestamp;
    delete normalized.requestId;
    delete normalized.sessionId;

    // Sort object keys for consistent hashing
    if (Array.isArray(normalized)) {
      return normalized.map(item => this.normalizePayload(item));
    }

    const sortedKeys = Object.keys(normalized).sort();
    const sortedPayload: any = {};
    
    for (const key of sortedKeys) {
      sortedPayload[key] = this.normalizePayload(normalized[key]);
    }

    return sortedPayload;
  }

  /**
   * Check if operation is cacheable
   */
  private isCacheable(operation: string, payload: any): boolean {
    // Check if operation is in cacheable list
    if (!this.config.cacheableOperations.includes(operation)) {
      return false;
    }

    // Check for exclude patterns
    const payloadString = JSON.stringify(payload).toLowerCase();
    for (const pattern of this.config.excludePatterns) {
      if (payloadString.includes(pattern)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get cached response
   */
  async getCachedResponse(
    operation: string,
    payload: any,
    userId?: string,
    personaType?: string
  ): Promise<{ response: any; metadata: CacheEntry['metadata'] } | null> {
    this.stats.totalRequests++;

    if (!this.isCacheable(operation, payload)) {
      this.stats.misses++;
      return null;
    }

    try {
      const cacheKey = this.generateCacheKey(operation, payload, userId, personaType);
      
      const result = await this.dynamodb.send(new GetItemCommand({
        TableName: this.cacheTableName,
        Key: marshall({ cacheKey })
      }));

      if (!result.Item) {
        this.stats.misses++;
        return null;
      }

      const cacheEntry = unmarshall(result.Item) as CacheEntry;

      // Check if entry is still valid (additional check beyond DynamoDB TTL)
      const now = Date.now();
      if (cacheEntry.ttl * 1000 < now) {
        this.stats.misses++;
        // Clean up expired entry
        await this.deleteCacheEntry(cacheKey);
        return null;
      }

      // Update hit count and last accessed
      await this.updateCacheHit(cacheKey);
      
      this.stats.hits++;
      
      console.log(`Cache hit for ${operation} (key: ${cacheKey.substring(0, 16)}...)`);
      
      return {
        response: cacheEntry.response,
        metadata: {
          ...cacheEntry.metadata,
          fromCache: true,
          cacheHit: true
        }
      };

    } catch (error) {
      console.error('Failed to get cached response:', error);
      this.stats.misses++;
      return null;
    }
  }

  /**
   * Cache response
   */
  async cacheResponse(
    operation: string,
    payload: any,
    response: any,
    metadata: {
      tokenCount?: number;
      processingTime: number;
      userId?: string;
      personaType?: string;
    },
    ttlHours?: number
  ): Promise<void> {
    if (!this.isCacheable(operation, payload)) {
      return;
    }

    try {
      const cacheKey = this.generateCacheKey(operation, payload, metadata.userId, metadata.personaType);
      const requestHash = createHash('md5').update(JSON.stringify(payload)).digest('hex');
      const now = Date.now();
      const ttl = Math.floor((now + (ttlHours || this.config.defaultTtlHours) * 60 * 60 * 1000) / 1000);

      const cacheEntry: CacheEntry = {
        cacheKey,
        operation,
        requestHash,
        response: this.config.enableCompression ? this.compressResponse(response) : response,
        metadata: {
          ...metadata,
          timestamp: now
        },
        ttl,
        hitCount: 0,
        lastAccessed: now
      };

      await this.dynamodb.send(new PutItemCommand({
        TableName: this.cacheTableName,
        Item: marshall(cacheEntry)
      }));

      console.log(`Cached response for ${operation} (TTL: ${ttlHours || this.config.defaultTtlHours}h)`);

    } catch (error) {
      console.error('Failed to cache response:', error);
    }
  }

  /**
   * Update cache hit statistics
   */
  private async updateCacheHit(cacheKey: string): Promise<void> {
    try {
      await this.dynamodb.send(new PutItemCommand({
        TableName: this.cacheTableName,
        Item: marshall({
          cacheKey,
          hitCount: { ':inc': 1 },
          lastAccessed: Date.now()
        }),
        UpdateExpression: 'ADD hitCount :inc SET lastAccessed = :timestamp',
        ExpressionAttributeValues: marshall({
          ':inc': 1,
          ':timestamp': Date.now()
        })
      }));
    } catch (error) {
      console.error('Failed to update cache hit:', error);
    }
  }

  /**
   * Delete cache entry
   */
  private async deleteCacheEntry(cacheKey: string): Promise<void> {
    try {
      await this.dynamodb.send(new DeleteItemCommand({
        TableName: this.cacheTableName,
        Key: marshall({ cacheKey })
      }));
    } catch (error) {
      console.error('Failed to delete cache entry:', error);
    }
  }

  /**
   * Compress response data
   */
  private compressResponse(response: any): any {
    // Simple compression - in production, consider using gzip
    if (typeof response === 'string' && response.length > 1000) {
      return {
        compressed: true,
        data: Buffer.from(response).toString('base64')
      };
    }
    return response;
  }

  /**
   * Decompress response data
   */
  private decompressResponse(response: any): any {
    if (response && response.compressed) {
      return Buffer.from(response.data, 'base64').toString();
    }
    return response;
  }

  /**
   * Invalidate cache for specific operation
   */
  async invalidateCache(operation: string, userId?: string): Promise<void> {
    try {
      // Query all entries for this operation
      const result = await this.dynamodb.send(new QueryCommand({
        TableName: this.cacheTableName,
        IndexName: 'operation-timestamp-index',
        KeyConditionExpression: 'operation = :operation',
        ExpressionAttributeValues: marshall({
          ':operation': operation
        })
      }));

      if (result.Items) {
        // Delete matching entries
        for (const item of result.Items) {
          const entry = unmarshall(item) as CacheEntry;
          if (!userId || entry.metadata.userId === userId) {
            await this.deleteCacheEntry(entry.cacheKey);
          }
        }
      }

      console.log(`Invalidated cache for operation: ${operation}${userId ? ` (user: ${userId})` : ''}`);

    } catch (error) {
      console.error('Failed to invalidate cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): CacheStats & { sessionStats: typeof this.stats } {
    const hitRate = this.stats.totalRequests > 0 
      ? this.stats.hits / this.stats.totalRequests 
      : 0;

    return {
      totalEntries: 0, // Would need to query DynamoDB
      hitRate,
      totalHits: this.stats.hits,
      totalMisses: this.stats.misses,
      avgResponseTime: 0, // Would calculate from metadata
      cacheSize: 0, // Would need to query DynamoDB
      sessionStats: { ...this.stats }
    };
  }

  /**
   * Clean up old cache entries
   */
  async cleanupCache(): Promise<void> {
    try {
      // DynamoDB TTL will handle automatic cleanup
      // This method can be used for additional cleanup logic if needed
      console.log('Cache cleanup completed (handled by DynamoDB TTL)');
    } catch (error) {
      console.error('Failed to cleanup cache:', error);
    }
  }

  /**
   * Warm up cache with common requests
   */
  async warmupCache(commonRequests: Array<{
    operation: string;
    payload: any;
    userId?: string;
    personaType?: string;
  }>): Promise<void> {
    console.log(`Warming up cache with ${commonRequests.length} common requests`);
    
    for (const request of commonRequests) {
      // Check if already cached
      const cached = await this.getCachedResponse(
        request.operation,
        request.payload,
        request.userId,
        request.personaType
      );
      
      if (!cached) {
        console.log(`Cache miss for warmup request: ${request.operation}`);
        // In a real implementation, you would process the request here
      }
    }
  }
}

// Singleton instance
export const responseCache = new ResponseCacheSystem();