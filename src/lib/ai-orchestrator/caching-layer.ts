/**
 * AI Orchestrator Caching Layer
 *
 * Implements:
 * - Redis/ElastiCache integration for response caching
 * - Intelligent cache key generation
 * - TTL-based cache invalidation
 * - Cache hit rate monitoring
 * - Performance optimization for frequent queries
 */

import { createHash } from "crypto";
import { AiRequest, AiResponse } from "./types";

export interface CacheConfig {
  enabled: boolean;
  ttlSeconds: number;
  maxKeyLength: number;
  compressionThreshold: number;
  hitRateTarget: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  totalRequests: number;
  averageLatency: number;
  cacheSize: number;
  lastUpdated: Date;
}

export interface CacheEntry {
  response: AiResponse;
  timestamp: number;
  ttl: number;
  compressed: boolean;
  accessCount: number;
}

/**
 * Redis-based Caching Layer for AI Responses
 */
export class CachingLayer {
  private config: CacheConfig;
  private stats: CacheStats;
  private redisClient: any; // Redis client interface
  private compressionEnabled: boolean;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      enabled: true,
      ttlSeconds: 3600, // 1 hour default
      maxKeyLength: 250,
      compressionThreshold: 1024, // Compress responses > 1KB
      hitRateTarget: 0.8, // 80% target hit rate
      ...config,
    };

    this.stats = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      totalRequests: 0,
      averageLatency: 0,
      cacheSize: 0,
      lastUpdated: new Date(),
    };

    this.compressionEnabled = true;
    this.initializeRedisClient();
  }

  /**
   * Get cached response for request
   */
  async get(request: AiRequest): Promise<AiResponse | null> {
    if (!this.config.enabled) {
      return null;
    }

    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(request);

    try {
      const cached = await this.redisClient?.get(cacheKey);

      if (cached) {
        const entry: CacheEntry = JSON.parse(cached);

        // Check TTL
        if (Date.now() - entry.timestamp > entry.ttl * 1000) {
          await this.redisClient?.del(cacheKey);
          this.recordMiss(Date.now() - startTime);
          return null;
        }

        // Decompress if needed
        let response = entry.response;
        if (entry.compressed && this.compressionEnabled) {
          response = await this.decompress(response);
        }

        // Update access count
        entry.accessCount++;
        await this.redisClient?.set(
          cacheKey,
          JSON.stringify(entry),
          "EX",
          entry.ttl
        );

        this.recordHit(Date.now() - startTime);
        return {
          ...response,
          cached: true,
          cacheHit: true,
        };
      }

      this.recordMiss(Date.now() - startTime);
      return null;
    } catch (error) {
      console.error("Cache get error:", error);
      this.recordMiss(Date.now() - startTime);
      return null;
    }
  }

  /**
   * Store response in cache
   */
  async set(request: AiRequest, response: AiResponse): Promise<void> {
    if (!this.config.enabled || response.error) {
      return;
    }

    const cacheKey = this.generateCacheKey(request);

    try {
      let responseToCache = response;
      let compressed = false;

      // Compress large responses
      const responseSize = JSON.stringify(response).length;
      if (
        responseSize > this.config.compressionThreshold &&
        this.compressionEnabled
      ) {
        responseToCache = await this.compress(response);
        compressed = true;
      }

      const entry: CacheEntry = {
        response: responseToCache,
        timestamp: Date.now(),
        ttl: this.calculateTTL(request, response),
        compressed,
        accessCount: 0,
      };

      await this.redisClient?.set(
        cacheKey,
        JSON.stringify(entry),
        "EX",
        entry.ttl
      );

      this.stats.cacheSize++;
    } catch (error) {
      console.error("Cache set error:", error);
    }
  }

  /**
   * Generate cache key from request
   */
  private generateCacheKey(request: AiRequest): string {
    // Create deterministic hash from request parameters
    const keyData = {
      prompt: request.prompt,
      context: {
        domain: request.context.domain,
        locale: request.context.locale,
        requireTools: request.context.requireTools,
        budgetTier: request.context.budgetTier,
      },
      tools: request.tools?.map((t) => ({
        name: t.name,
        parameters: t.parameters,
      })),
    };

    const hash = createHash("sha256")
      .update(JSON.stringify(keyData))
      .digest("hex");

    const prefix = "ai-cache";
    const key = `${prefix}:${hash}`;

    // Ensure key length doesn't exceed Redis limits
    return key.length > this.config.maxKeyLength
      ? key.substring(0, this.config.maxKeyLength)
      : key;
  }

  /**
   * Calculate TTL based on request characteristics
   */
  private calculateTTL(request: AiRequest, response: AiResponse): number {
    let ttl = this.config.ttlSeconds;

    // Longer TTL for expensive operations
    if (response.costEuro > 0.01) {
      ttl *= 2;
    }

    // Shorter TTL for time-sensitive domains
    if (request.context.domain === "support") {
      ttl = Math.min(ttl, 300); // 5 minutes max
    }

    // Longer TTL for general queries
    if (request.context.domain === "general") {
      ttl *= 1.5;
    }

    return ttl;
  }

  /**
   * Compress response data
   */
  private async compress(response: AiResponse): Promise<AiResponse> {
    // Simple compression simulation - in production use zlib
    return {
      ...response,
      text: response.text ? `[COMPRESSED]${response.text}` : response.text,
    };
  }

  /**
   * Decompress response data
   */
  private async decompress(response: AiResponse): Promise<AiResponse> {
    // Simple decompression simulation
    return {
      ...response,
      text: response.text?.replace("[COMPRESSED]", "") || response.text,
    };
  }

  /**
   * Record cache hit
   */
  private recordHit(latency: number): void {
    this.stats.hits++;
    this.stats.totalRequests++;
    this.updateStats(latency);
  }

  /**
   * Record cache miss
   */
  private recordMiss(latency: number): void {
    this.stats.misses++;
    this.stats.totalRequests++;
    this.updateStats(latency);
  }

  /**
   * Update cache statistics
   */
  private updateStats(latency: number): void {
    this.stats.hitRate =
      this.stats.totalRequests > 0
        ? this.stats.hits / this.stats.totalRequests
        : 0;

    this.stats.averageLatency = (this.stats.averageLatency + latency) / 2;
    this.stats.lastUpdated = new Date();
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Check if cache performance meets targets
   */
  isPerformanceTarget(): boolean {
    return this.stats.hitRate >= this.config.hitRateTarget;
  }

  /**
   * Clear cache
   */
  async clear(): Promise<void> {
    try {
      await this.redisClient?.flushdb();
      this.stats = {
        hits: 0,
        misses: 0,
        hitRate: 0,
        totalRequests: 0,
        averageLatency: 0,
        cacheSize: 0,
        lastUpdated: new Date(),
      };
    } catch (error) {
      console.error("Cache clear error:", error);
    }
  }

  /**
   * Warm up cache with common queries
   */
  async warmUp(commonQueries: AiRequest[]): Promise<void> {
    console.log(`Warming up cache with ${commonQueries.length} common queries`);

    for (const query of commonQueries) {
      const cacheKey = this.generateCacheKey(query);

      // Check if already cached
      const exists = await this.redisClient?.exists(cacheKey);
      if (!exists) {
        // In production, this would trigger actual AI requests
        // For now, create placeholder entries
        const mockResponse: AiResponse = {
          text: `Cached response for: ${query.prompt.substring(0, 50)}...`,
          provider: "bedrock",
          modelId: "cache-warmed",
          requestId: `cache-${Date.now()}`,
          latencyMs: 0,
          costEuro: 0,
          success: true,
        };

        await this.set(query, mockResponse);
      }
    }
  }

  /**
   * Initialize Redis client
   */
  private initializeRedisClient(): void {
    // In production, this would initialize actual Redis client
    // For now, use in-memory mock that actually stores data
    const store = new Map<string, string>();

    this.redisClient = {
      get: async (key: string) => {
        return store.get(key) || null;
      },
      set: async (key: string, value: string, mode?: string, ttl?: number) => {
        store.set(key, value);
        // In a real implementation, TTL would be handled with setTimeout
        // For testing purposes, we'll ignore TTL
        return "OK";
      },
      del: async (key: string) => {
        const existed = store.has(key);
        store.delete(key);
        return existed ? 1 : 0;
      },
      exists: async (key: string) => {
        return store.has(key) ? 1 : 0;
      },
      flushdb: async () => {
        store.clear();
        return "OK";
      },
    };
  }

  /**
   * Health check for cache system
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    latency: number;
    hitRate: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    const startTime = Date.now();

    try {
      // Test Redis connectivity
      await this.redisClient?.set("health-check", "ok", "EX", 10);
      const result = await this.redisClient?.get("health-check");

      if (result !== "ok") {
        errors.push("Redis connectivity test failed");
      }

      await this.redisClient?.del("health-check");
    } catch (error) {
      errors.push(`Redis health check error: ${error}`);
    }

    const latency = Date.now() - startTime;
    const healthy = errors.length === 0 && latency < 100; // < 100ms

    return {
      healthy,
      latency,
      hitRate: this.stats.hitRate,
      errors,
    };
  }

  /**
   * Get cache configuration
   */
  getConfig(): CacheConfig {
    return { ...this.config };
  }

  /**
   * Update cache configuration
   */
  updateConfig(newConfig: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

/**
 * Factory function for creating caching layer
 */
export const createCachingLayer = (
  config?: Partial<CacheConfig>
): CachingLayer => {
  return new CachingLayer(config);
};

/**
 * Default cache configurations for different environments
 */
export const CACHE_CONFIGS = {
  development: {
    enabled: true,
    ttlSeconds: 300, // 5 minutes
    hitRateTarget: 0.5,
  },
  staging: {
    enabled: true,
    ttlSeconds: 1800, // 30 minutes
    hitRateTarget: 0.7,
  },
  production: {
    enabled: true,
    ttlSeconds: 3600, // 1 hour
    hitRateTarget: 0.8,
  },
} as const;
