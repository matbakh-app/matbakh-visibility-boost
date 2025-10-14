/**
 * Redis Query Cache Integration
 * 
 * This module provides Redis-based query caching with:
 * - Intelligent cache key generation
 * - Compression for large results
 * - TTL management and cache warming
 * - Cache invalidation strategies
 * - Performance monitoring and metrics
 */

// Redis cache configuration
export interface RedisCacheConfig {
  host: string;
  port: number;
  password?: string;
  database: number;
  keyPrefix: string;
  defaultTtlSeconds: number;
  maxKeyLength: number;
  enableCompression: boolean;
  compressionThreshold: number; // bytes
  connectionTimeout: number;
  retryAttempts: number;
  retryDelay: number;
}

// Cache entry metadata
export interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
  compressed: boolean;
  size: number;
  hits: number;
  lastAccessed: number;
}

// Cache statistics
export interface CacheStats {
  totalKeys: number;
  totalMemoryMB: number;
  hitRate: number;
  missRate: number;
  evictionRate: number;
  averageKeySize: number;
  connectionStatus: 'connected' | 'disconnected' | 'error';
  lastError?: string;
}

// Cache invalidation pattern
export interface InvalidationPattern {
  pattern: string;
  reason: string;
  timestamp: number;
  keysInvalidated: number;
}

class RedisQueryCache {
  private config: RedisCacheConfig;
  private client: any; // Redis client (would be actual Redis client in production)
  private isConnected = false;
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    evictions: 0,
    errors: 0
  };
  private invalidationPatterns: InvalidationPattern[] = [];

  constructor(config: Partial<RedisCacheConfig> = {}) {
    this.config = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      database: parseInt(process.env.REDIS_DB || '0'),
      keyPrefix: 'matbakh:query:',
      defaultTtlSeconds: 300, // 5 minutes
      maxKeyLength: 250,
      enableCompression: true,
      compressionThreshold: 1024, // 1KB
      connectionTimeout: 5000,
      retryAttempts: 3,
      retryDelay: 1000,
      ...config
    };
  }

  /**
   * Initialize Redis connection
   */
  public async initialize(): Promise<void> {
    try {
      // In production, this would create actual Redis connection
      // For now, using mock client
      this.client = this.createMockRedisClient();
      
      await this.connect();
      
      console.log('Redis query cache initialized');
    } catch (error) {
      console.error('Failed to initialize Redis cache:', error);
      throw error;
    }
  }

  /**
   * Connect to Redis with retry logic
   */
  private async connect(): Promise<void> {
    let attempts = 0;
    
    while (attempts < this.config.retryAttempts) {
      try {
        // Mock connection
        await new Promise(resolve => setTimeout(resolve, 100));
        this.isConnected = true;
        console.log(`Connected to Redis at ${this.config.host}:${this.config.port}`);
        return;
      } catch (error) {
        attempts++;
        this.stats.errors++;
        
        if (attempts >= this.config.retryAttempts) {
          throw new Error(`Failed to connect to Redis after ${attempts} attempts: ${error}`);
        }
        
        console.warn(`Redis connection attempt ${attempts} failed, retrying in ${this.config.retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
      }
    }
  }

  /**
   * Get cached query result
   */
  public async get<T>(key: string): Promise<T | null> {
    if (!this.isConnected) {
      this.stats.errors++;
      return null;
    }

    try {
      const fullKey = this.buildKey(key);
      const cached = await this.client.get(fullKey);
      
      if (!cached) {
        this.stats.misses++;
        return null;
      }

      const entry: CacheEntry = JSON.parse(cached);
      
      // Check if expired
      if (Date.now() > entry.timestamp + entry.ttl * 1000) {
        await this.delete(key);
        this.stats.misses++;
        return null;
      }

      // Update access statistics
      entry.hits++;
      entry.lastAccessed = Date.now();
      await this.client.set(fullKey, JSON.stringify(entry), 'EX', entry.ttl);

      this.stats.hits++;
      
      // Decompress if needed
      let data = entry.data;
      if (entry.compressed) {
        data = await this.decompress(data);
      }

      return data;
    } catch (error) {
      console.error('Redis cache get error:', error);
      this.stats.errors++;
      return null;
    }
  }

  /**
   * Set cached query result
   */
  public async set<T>(
    key: string, 
    data: T, 
    ttlSeconds?: number
  ): Promise<void> {
    if (!this.isConnected) {
      this.stats.errors++;
      return;
    }

    try {
      const ttl = ttlSeconds || this.config.defaultTtlSeconds;
      const fullKey = this.buildKey(key);
      
      // Serialize data
      let serializedData = JSON.stringify(data);
      let compressed = false;
      
      // Compress if data is large
      if (this.config.enableCompression && serializedData.length > this.config.compressionThreshold) {
        serializedData = await this.compress(serializedData);
        compressed = true;
      }

      const entry: CacheEntry = {
        data: compressed ? serializedData : data,
        timestamp: Date.now(),
        ttl,
        compressed,
        size: serializedData.length,
        hits: 0,
        lastAccessed: Date.now()
      };

      await this.client.set(fullKey, JSON.stringify(entry), 'EX', ttl);
      this.stats.sets++;
      
    } catch (error) {
      console.error('Redis cache set error:', error);
      this.stats.errors++;
    }
  }

  /**
   * Delete cached entry
   */
  public async delete(key: string): Promise<void> {
    if (!this.isConnected) return;

    try {
      const fullKey = this.buildKey(key);
      await this.client.del(fullKey);
      this.stats.deletes++;
    } catch (error) {
      console.error('Redis cache delete error:', error);
      this.stats.errors++;
    }
  }

  /**
   * Invalidate cache entries by pattern
   */
  public async invalidatePattern(pattern: string, reason: string = 'manual'): Promise<number> {
    if (!this.isConnected) return 0;

    try {
      const searchPattern = this.buildKey(pattern);
      const keys = await this.client.keys(searchPattern);
      
      if (keys.length > 0) {
        await this.client.del(...keys);
        this.stats.deletes += keys.length;
      }

      // Record invalidation
      this.invalidationPatterns.push({
        pattern,
        reason,
        timestamp: Date.now(),
        keysInvalidated: keys.length
      });

      // Keep only recent invalidations
      if (this.invalidationPatterns.length > 100) {
        this.invalidationPatterns = this.invalidationPatterns.slice(-100);
      }

      console.log(`Invalidated ${keys.length} cache entries matching pattern: ${pattern}`);
      return keys.length;
      
    } catch (error) {
      console.error('Redis cache invalidation error:', error);
      this.stats.errors++;
      return 0;
    }
  }

  /**
   * Warm cache with frequently accessed queries
   */
  public async warmCache(queries: Array<{ key: string; query: string; params: any[] }>): Promise<void> {
    console.log(`Warming cache with ${queries.length} queries...`);
    
    const promises = queries.map(async ({ key, query, params }) => {
      try {
        // Check if already cached
        const existing = await this.get(key);
        if (existing) return;

        // Execute query and cache result (mock implementation)
        const result = await this.executeQuery(query, params);
        await this.set(key, result, this.config.defaultTtlSeconds * 2); // Longer TTL for warmed cache
        
      } catch (error) {
        console.warn(`Failed to warm cache for key ${key}:`, error);
      }
    });

    await Promise.all(promises);
    console.log('Cache warming completed');
  }

  /**
   * Get cache statistics
   */
  public async getStats(): Promise<CacheStats> {
    const totalRequests = this.stats.hits + this.stats.misses;
    
    let totalKeys = 0;
    let totalMemory = 0;
    
    if (this.isConnected) {
      try {
        // Get Redis info (mock implementation)
        totalKeys = await this.client.dbsize();
        const info = await this.client.info('memory');
        totalMemory = this.parseMemoryInfo(info);
      } catch (error) {
        console.warn('Failed to get Redis stats:', error);
      }
    }

    return {
      totalKeys,
      totalMemoryMB: totalMemory / 1024 / 1024,
      hitRate: totalRequests > 0 ? this.stats.hits / totalRequests : 0,
      missRate: totalRequests > 0 ? this.stats.misses / totalRequests : 0,
      evictionRate: totalRequests > 0 ? this.stats.evictions / totalRequests : 0,
      averageKeySize: totalKeys > 0 ? totalMemory / totalKeys : 0,
      connectionStatus: this.isConnected ? 'connected' : 'disconnected'
    };
  }

  /**
   * Generate cache key for query
   */
  public generateQueryKey(query: string, params: any[] = [], userId?: string): string {
    // Normalize query
    const normalizedQuery = query
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();

    // Create hash of query + params + user context
    const content = JSON.stringify({
      query: normalizedQuery,
      params,
      userId: userId || 'anonymous'
    });

    // Simple hash function (in production, use crypto.createHash)
    const hash = this.simpleHash(content);
    
    return `query:${hash}`;
  }

  /**
   * Generate cache key for table-based invalidation
   */
  public generateTableKey(tableName: string, operation: 'select' | 'insert' | 'update' | 'delete'): string {
    return `table:${tableName}:${operation}:*`;
  }

  /**
   * Invalidate cache for table operations
   */
  public async invalidateTable(tableName: string, operation: 'insert' | 'update' | 'delete'): Promise<void> {
    // Invalidate all SELECT queries for this table
    await this.invalidatePattern(`table:${tableName}:select:*`, `table_${operation}`);
    
    // For updates/deletes, also invalidate related tables (would need schema knowledge)
    if (operation === 'update' || operation === 'delete') {
      // Example: invalidate related tables
      const relatedTables = this.getRelatedTables(tableName);
      for (const relatedTable of relatedTables) {
        await this.invalidatePattern(`table:${relatedTable}:select:*`, `related_table_${operation}`);
      }
    }
  }

  /**
   * Cleanup expired entries
   */
  public async cleanup(): Promise<number> {
    if (!this.isConnected) return 0;

    try {
      // In Redis, expired keys are automatically cleaned up
      // This method could implement additional cleanup logic
      
      // Clean up old invalidation patterns
      const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24 hours
      this.invalidationPatterns = this.invalidationPatterns.filter(p => p.timestamp > cutoff);
      
      return 0;
    } catch (error) {
      console.error('Cache cleanup error:', error);
      return 0;
    }
  }

  /**
   * Utility methods
   */
  private buildKey(key: string): string {
    const fullKey = `${this.config.keyPrefix}${key}`;
    
    // Ensure key length doesn't exceed Redis limits
    if (fullKey.length > this.config.maxKeyLength) {
      const hash = this.simpleHash(fullKey);
      return `${this.config.keyPrefix}hash:${hash}`;
    }
    
    return fullKey;
  }

  private async compress(data: string): Promise<string> {
    // Mock compression (in production, use zlib or similar)
    return Buffer.from(data).toString('base64');
  }

  private async decompress(data: string): Promise<any> {
    // Mock decompression
    try {
      return JSON.parse(Buffer.from(data, 'base64').toString());
    } catch {
      return data; // Return as-is if not compressed
    }
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private parseMemoryInfo(info: string): number {
    // Mock memory parsing
    return 1024 * 1024; // 1MB
  }

  private getRelatedTables(tableName: string): string[] {
    // Mock related tables (in production, would use schema metadata)
    const relations: Record<string, string[]> = {
      'business_partners': ['business_profiles', 'visibility_check_leads'],
      'visibility_check_leads': ['visibility_check_results'],
      'profiles': ['private_profile', 'business_partners']
    };
    
    return relations[tableName] || [];
  }

  private async executeQuery(query: string, params: any[]): Promise<any> {
    // Mock query execution
    await new Promise(resolve => setTimeout(resolve, 100));
    return { rows: [], rowCount: 0 };
  }

  private createMockRedisClient() {
    const store = new Map<string, string>();
    
    return {
      get: async (key: string) => store.get(key) || null,
      set: async (key: string, value: string, ...args: any[]) => {
        store.set(key, value);
        return 'OK';
      },
      del: async (...keys: string[]) => {
        let deleted = 0;
        keys.forEach(key => {
          if (store.delete(key)) deleted++;
        });
        return deleted;
      },
      keys: async (pattern: string) => {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return Array.from(store.keys()).filter(key => regex.test(key));
      },
      dbsize: async () => store.size,
      info: async (section: string) => `# ${section}\nused_memory:1048576\n`,
      flushdb: async () => {
        store.clear();
        return 'OK';
      }
    };
  }

  /**
   * Disconnect from Redis
   */
  public async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      try {
        // In production: await this.client.quit();
        this.isConnected = false;
        console.log('Disconnected from Redis');
      } catch (error) {
        console.error('Error disconnecting from Redis:', error);
      }
    }
  }

  /**
   * Health check
   */
  public async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; latency?: number; error?: string }> {
    if (!this.isConnected) {
      return { status: 'unhealthy', error: 'Not connected' };
    }

    try {
      const start = Date.now();
      await this.client.ping?.() || Promise.resolve('PONG');
      const latency = Date.now() - start;
      
      return { status: 'healthy', latency };
    } catch (error) {
      return { status: 'unhealthy', error: String(error) };
    }
  }
}

// Global Redis cache instance
export const redisCache = new RedisQueryCache();

// Export for manual usage
export { RedisQueryCache };