/**
 * Memory Cache Provider - Redis Implementation
 * High-performance caching layer for AI agent memory
 */

import { createClient, RedisClientType } from 'redis';
import {
  MemoryContext,
  MemoryCacheProvider,
  MemoryError
} from './types';

export class RedisMemoryCache implements MemoryCacheProvider {
  private client: RedisClientType;
  private connected: boolean = false;
  private defaultTTL: number = 3600; // 1 hour default TTL

  constructor(
    connectionString?: string,
    defaultTTL: number = 3600
  ) {
    const redisUrl = connectionString || 
      process.env.REDIS_URL || 
      'redis://localhost:6379';
    
    this.client = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 500)
      }
    });

    this.defaultTTL = defaultTTL;
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.client.on('connect', () => {
      console.log('Redis client connected');
      this.connected = true;
    });

    this.client.on('error', (error) => {
      console.error('Redis client error:', error);
      this.connected = false;
    });

    this.client.on('end', () => {
      console.log('Redis client disconnected');
      this.connected = false;
    });
  }

  private async ensureConnection(): Promise<void> {
    if (!this.connected) {
      try {
        await this.client.connect();
        this.connected = true;
      } catch (error) {
        throw new MemoryError(`Failed to connect to Redis: ${error}`, 'CACHE_CONNECTION_ERROR');
      }
    }
  }

  async get(key: string): Promise<MemoryContext | null> {
    try {
      await this.ensureConnection();
      
      const cached = await this.client.get(this.formatKey(key));
      if (!cached) {
        return null;
      }

      const context = JSON.parse(cached);
      
      // Convert date strings back to Date objects
      context.createdAt = new Date(context.createdAt);
      context.updatedAt = new Date(context.updatedAt);
      if (context.expiresAt) {
        context.expiresAt = new Date(context.expiresAt);
      }

      // Update access metadata
      context.metadata.accessCount = (context.metadata.accessCount || 0) + 1;
      context.metadata.lastAccessed = new Date();

      return context;
    } catch (error) {
      console.error('Cache get error:', error);
      return null; // Graceful degradation - don't fail if cache is unavailable
    }
  }

  async set(key: string, context: MemoryContext, ttl?: number): Promise<void> {
    try {
      await this.ensureConnection();
      
      const serialized = JSON.stringify(context);
      const effectiveTTL = ttl || this.defaultTTL;
      
      await this.client.setEx(this.formatKey(key), effectiveTTL, serialized);
      
      // Also set reverse lookup keys for efficient querying
      await this.setReverseLookups(context, effectiveTTL);
    } catch (error) {
      console.error('Cache set error:', error);
      // Don't throw - cache failures shouldn't break the application
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.ensureConnection();
      await this.client.del(this.formatKey(key));
    } catch (error) {
      console.error('Cache delete error:', error);
      // Don't throw - cache failures shouldn't break the application
    }
  }

  async clear(pattern: string): Promise<number> {
    try {
      await this.ensureConnection();
      
      const keys = await this.client.keys(this.formatKey(pattern));
      if (keys.length === 0) {
        return 0;
      }

      await this.client.del(keys);
      return keys.length;
    } catch (error) {
      console.error('Cache clear error:', error);
      return 0;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.ensureConnection();
      const result = await this.client.exists(this.formatKey(key));
      return result === 1;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }

  // Advanced cache operations
  async getByTenant(tenantId: string, limit: number = 100): Promise<MemoryContext[]> {
    try {
      await this.ensureConnection();
      
      const pattern = this.formatKey(`tenant:${tenantId}:*`);
      const keys = await this.client.keys(pattern);
      
      if (keys.length === 0) {
        return [];
      }

      // Limit the number of keys to process
      const limitedKeys = keys.slice(0, limit);
      const values = await this.client.mGet(limitedKeys);
      
      const contexts: MemoryContext[] = [];
      for (const value of values) {
        if (value) {
          try {
            const context = JSON.parse(value);
            context.createdAt = new Date(context.createdAt);
            context.updatedAt = new Date(context.updatedAt);
            if (context.expiresAt) {
              context.expiresAt = new Date(context.expiresAt);
            }
            contexts.push(context);
          } catch (parseError) {
            console.error('Failed to parse cached context:', parseError);
          }
        }
      }

      // Sort by relevance score and creation date
      return contexts.sort((a, b) => {
        if (a.relevanceScore !== b.relevanceScore) {
          return b.relevanceScore - a.relevanceScore;
        }
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
    } catch (error) {
      console.error('Cache getByTenant error:', error);
      return [];
    }
  }

  async getByUser(tenantId: string, userId: string, limit: number = 50): Promise<MemoryContext[]> {
    try {
      await this.ensureConnection();
      
      const pattern = this.formatKey(`tenant:${tenantId}:user:${userId}:*`);
      const keys = await this.client.keys(pattern);
      
      if (keys.length === 0) {
        return [];
      }

      const limitedKeys = keys.slice(0, limit);
      const values = await this.client.mGet(limitedKeys);
      
      const contexts: MemoryContext[] = [];
      for (const value of values) {
        if (value) {
          try {
            const context = JSON.parse(value);
            context.createdAt = new Date(context.createdAt);
            context.updatedAt = new Date(context.updatedAt);
            if (context.expiresAt) {
              context.expiresAt = new Date(context.expiresAt);
            }
            contexts.push(context);
          } catch (parseError) {
            console.error('Failed to parse cached context:', parseError);
          }
        }
      }

      return contexts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      console.error('Cache getByUser error:', error);
      return [];
    }
  }

  async updateRelevanceScore(key: string, newScore: number): Promise<void> {
    try {
      await this.ensureConnection();
      
      const context = await this.get(key);
      if (context) {
        context.relevanceScore = newScore;
        context.updatedAt = new Date();
        await this.set(key, context);
      }
    } catch (error) {
      console.error('Cache updateRelevanceScore error:', error);
    }
  }

  async getCacheStats(): Promise<{
    totalKeys: number;
    memoryUsage: string;
    hitRate?: number;
  }> {
    try {
      await this.ensureConnection();
      
      const info = await this.client.info('memory');
      const keyspace = await this.client.info('keyspace');
      
      // Parse memory usage
      const memoryMatch = info.match(/used_memory_human:([^\r\n]+)/);
      const memoryUsage = memoryMatch ? memoryMatch[1].trim() : 'unknown';
      
      // Count total keys with our prefix
      const keys = await this.client.keys(this.formatKey('*'));
      
      return {
        totalKeys: keys.length,
        memoryUsage
      };
    } catch (error) {
      console.error('Cache stats error:', error);
      return {
        totalKeys: 0,
        memoryUsage: 'unknown'
      };
    }
  }

  private formatKey(key: string): string {
    return `ai-memory:${key}`;
  }

  private async setReverseLookups(context: MemoryContext, ttl: number): Promise<void> {
    try {
      // Set tenant lookup
      const tenantKey = this.formatKey(`tenant:${context.tenantId}:${context.id}`);
      await this.client.setEx(tenantKey, ttl, context.id);
      
      // Set user lookup
      const userKey = this.formatKey(`tenant:${context.tenantId}:user:${context.userId}:${context.id}`);
      await this.client.setEx(userKey, ttl, context.id);
      
      // Set session lookup
      const sessionKey = this.formatKey(`tenant:${context.tenantId}:session:${context.sessionId}:${context.id}`);
      await this.client.setEx(sessionKey, ttl, context.id);
      
      // Set context type lookup
      const typeKey = this.formatKey(`tenant:${context.tenantId}:type:${context.contextType}:${context.id}`);
      await this.client.setEx(typeKey, ttl, context.id);
    } catch (error) {
      console.error('Failed to set reverse lookups:', error);
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.connected) {
        await this.client.quit();
        this.connected = false;
      }
    } catch (error) {
      console.error('Error disconnecting from Redis:', error);
    }
  }
}