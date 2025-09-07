import { createClient, RedisClientType } from 'redis';
import { ConsentVerificationResult, CacheEntry } from './types';

/**
 * Redis-based consent verification cache for performance optimization
 */
export class ConsentCache {
  private client: RedisClientType | null = null;
  private isConnected = false;
  private readonly keyPrefix = 'consent:';
  private readonly defaultTtl = 300; // 5 minutes

  constructor(
    private redisUrl?: string,
    private ttlSeconds: number = 300
  ) {}

  /**
   * Initialize Redis connection
   */
  async connect(): Promise<void> {
    if (this.isConnected) return;

    try {
      this.client = createClient({
        url: this.redisUrl || process.env.REDIS_URL || 'redis://localhost:6379'
      });

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('Redis Client Connected');
        this.isConnected = true;
      });

      await this.client.connect();
    } catch (error) {
      console.warn('Failed to connect to Redis, operating without cache:', error);
      this.client = null;
      this.isConnected = false;
    }
  }

  /**
   * Generate cache key for consent verification
   */
  private generateKey(userId?: string, ipAddress?: string, consentTypes: string[] = []): string {
    const identifier = userId || ipAddress || 'anonymous';
    const typesKey = consentTypes.sort().join(',');
    return `${this.keyPrefix}${identifier}:${typesKey}`;
  }

  /**
   * Get cached consent verification result
   */
  async get(
    userId?: string, 
    ipAddress?: string, 
    consentTypes: string[] = []
  ): Promise<ConsentVerificationResult | null> {
    if (!this.client || !this.isConnected) {
      return null;
    }

    try {
      const key = this.generateKey(userId, ipAddress, consentTypes);
      const cached = await this.client.get(key);
      
      if (!cached) {
        return null;
      }

      const entry: CacheEntry = JSON.parse(cached);
      
      // Check if cache entry has expired
      if (Date.now() > entry.expiresAt) {
        await this.client.del(key);
        return null;
      }

      console.log(`Cache hit for consent verification: ${key}`);
      return entry.data;
    } catch (error) {
      console.warn('Error reading from consent cache:', error);
      return null;
    }
  }

  /**
   * Cache consent verification result
   */
  async set(
    result: ConsentVerificationResult,
    userId?: string,
    ipAddress?: string,
    consentTypes: string[] = [],
    customTtl?: number
  ): Promise<void> {
    if (!this.client || !this.isConnected) {
      return;
    }

    try {
      const key = this.generateKey(userId, ipAddress, consentTypes);
      const ttl = customTtl || this.ttlSeconds;
      
      const entry: CacheEntry = {
        data: result,
        expiresAt: Date.now() + (ttl * 1000)
      };

      await this.client.setEx(key, ttl, JSON.stringify(entry));
      console.log(`Cached consent verification result: ${key} (TTL: ${ttl}s)`);
    } catch (error) {
      console.warn('Error writing to consent cache:', error);
    }
  }

  /**
   * Invalidate cache for specific user/IP
   */
  async invalidate(userId?: string, ipAddress?: string): Promise<void> {
    if (!this.client || !this.isConnected) {
      return;
    }

    try {
      const pattern = this.generateKey(userId, ipAddress, ['*']);
      const keys = await this.client.keys(pattern);
      
      if (keys.length > 0) {
        await this.client.del(keys);
        console.log(`Invalidated ${keys.length} cache entries for user/IP`);
      }
    } catch (error) {
      console.warn('Error invalidating consent cache:', error);
    }
  }

  /**
   * Clear all consent cache entries
   */
  async clear(): Promise<void> {
    if (!this.client || !this.isConnected) {
      return;
    }

    try {
      const keys = await this.client.keys(`${this.keyPrefix}*`);
      if (keys.length > 0) {
        await this.client.del(keys);
        console.log(`Cleared ${keys.length} consent cache entries`);
      }
    } catch (error) {
      console.warn('Error clearing consent cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{ totalKeys: number; memoryUsage?: string }> {
    if (!this.client || !this.isConnected) {
      return { totalKeys: 0 };
    }

    try {
      const keys = await this.client.keys(`${this.keyPrefix}*`);
      const info = await this.client.info('memory');
      
      return {
        totalKeys: keys.length,
        memoryUsage: info.split('\n').find(line => line.startsWith('used_memory_human:'))?.split(':')[1]?.trim()
      };
    } catch (error) {
      console.warn('Error getting cache stats:', error);
      return { totalKeys: 0 };
    }
  }

  /**
   * Close Redis connection
   */
  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
      console.log('Redis connection closed');
    }
  }
}