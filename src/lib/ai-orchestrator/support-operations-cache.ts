/**
 * Support Operations Caching Layer
 *
 * Specialized caching for Bedrock Support Manager operations with:
 * - Infrastructure audit result caching
 * - Meta-monitoring data caching
 * - Implementation gap analysis caching
 * - Compliance validation caching
 * - Intelligent cache invalidation
 * - Performance optimization for support operations
 */

import { createHash } from "crypto";
import {
  ComplianceValidationResult,
  CostAnalysis,
  ExecutionMetadata,
  ImplementationGap,
  InfrastructureAuditResult,
  SecurityAuditResult,
} from "./bedrock-support-manager";

export interface SupportCacheConfig {
  enabled: boolean;
  ttlSeconds: {
    infrastructureAudit: number;
    metaMonitoring: number;
    implementationGaps: number;
    complianceValidation: number;
    securityAudit: number;
    costAnalysis: number;
  };
  maxCacheSize: number;
  compressionEnabled: boolean;
  invalidationStrategy: "ttl" | "event" | "hybrid";
}

export interface SupportCacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  totalRequests: number;
  averageLatency: number;
  cacheSize: number;
  lastUpdated: Date;
  operationStats: {
    infrastructureAudit: OperationCacheStats;
    metaMonitoring: OperationCacheStats;
    implementationGaps: OperationCacheStats;
    complianceValidation: OperationCacheStats;
    securityAudit: OperationCacheStats;
    costAnalysis: OperationCacheStats;
  };
}

export interface OperationCacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  averageLatency: number;
  lastAccess: Date | null;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  compressed: boolean;
  accessCount: number;
  operationType: SupportOperationType;
  metadata: CacheEntryMetadata;
}

export interface CacheEntryMetadata {
  createdAt: Date;
  lastAccessed: Date;
  expiresAt: Date;
  size: number;
  compressionRatio?: number;
}

export type SupportOperationType =
  | "infrastructureAudit"
  | "metaMonitoring"
  | "implementationGaps"
  | "complianceValidation"
  | "securityAudit"
  | "costAnalysis";

/**
 * Support Operations Caching Layer
 */
export class SupportOperationsCache {
  private config: SupportCacheConfig;
  private stats: SupportCacheStats;
  private cache: Map<string, CacheEntry<any>>;
  private invalidationTimers: Map<string, NodeJS.Timeout>;

  constructor(config?: Partial<SupportCacheConfig>) {
    this.config = {
      enabled: true,
      ttlSeconds: {
        infrastructureAudit: 300, // 5 minutes - infrastructure changes frequently
        metaMonitoring: 60, // 1 minute - real-time monitoring
        implementationGaps: 600, // 10 minutes - gaps change less frequently
        complianceValidation: 1800, // 30 minutes - compliance is relatively stable
        securityAudit: 900, // 15 minutes - security needs regular checks
        costAnalysis: 300, // 5 minutes - cost data updates frequently
      },
      maxCacheSize: 1000, // Maximum number of cached entries
      compressionEnabled: true,
      invalidationStrategy: "hybrid", // Use both TTL and event-based invalidation
      ...config,
    };

    this.cache = new Map();
    this.invalidationTimers = new Map();

    this.stats = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      totalRequests: 0,
      averageLatency: 0,
      cacheSize: 0,
      lastUpdated: new Date(),
      operationStats: {
        infrastructureAudit: this.createOperationStats(),
        metaMonitoring: this.createOperationStats(),
        implementationGaps: this.createOperationStats(),
        complianceValidation: this.createOperationStats(),
        securityAudit: this.createOperationStats(),
        costAnalysis: this.createOperationStats(),
      },
    };
  }

  /**
   * Get cached infrastructure audit result
   */
  async getInfrastructureAudit(
    context?: Record<string, any>
  ): Promise<InfrastructureAuditResult | null> {
    return this.get<InfrastructureAuditResult>("infrastructureAudit", context);
  }

  /**
   * Cache infrastructure audit result
   */
  async setInfrastructureAudit(
    result: InfrastructureAuditResult,
    context?: Record<string, any>
  ): Promise<void> {
    return this.set("infrastructureAudit", result, context);
  }

  /**
   * Get cached meta-monitoring data
   */
  async getMetaMonitoring(
    executionId: string
  ): Promise<ExecutionMetadata | null> {
    return this.get<ExecutionMetadata>("metaMonitoring", { executionId });
  }

  /**
   * Cache meta-monitoring data
   */
  async setMetaMonitoring(
    data: ExecutionMetadata,
    executionId: string
  ): Promise<void> {
    return this.set("metaMonitoring", data, { executionId });
  }

  /**
   * Get cached implementation gaps
   */
  async getImplementationGaps(
    module?: string
  ): Promise<ImplementationGap[] | null> {
    return this.get<ImplementationGap[]>("implementationGaps", { module });
  }

  /**
   * Cache implementation gaps
   */
  async setImplementationGaps(
    gaps: ImplementationGap[],
    module?: string
  ): Promise<void> {
    return this.set("implementationGaps", gaps, { module });
  }

  /**
   * Get cached compliance validation result
   */
  async getComplianceValidation(
    scope?: string
  ): Promise<ComplianceValidationResult | null> {
    return this.get<ComplianceValidationResult>("complianceValidation", {
      scope,
    });
  }

  /**
   * Cache compliance validation result
   */
  async setComplianceValidation(
    result: ComplianceValidationResult,
    scope?: string
  ): Promise<void> {
    return this.set("complianceValidation", result, { scope });
  }

  /**
   * Get cached security audit result
   */
  async getSecurityAudit(
    component?: string
  ): Promise<SecurityAuditResult | null> {
    return this.get<SecurityAuditResult>("securityAudit", { component });
  }

  /**
   * Cache security audit result
   */
  async setSecurityAudit(
    result: SecurityAuditResult,
    component?: string
  ): Promise<void> {
    return this.set("securityAudit", result, { component });
  }

  /**
   * Get cached cost analysis
   */
  async getCostAnalysis(timeRange?: string): Promise<CostAnalysis | null> {
    return this.get<CostAnalysis>("costAnalysis", { timeRange });
  }

  /**
   * Cache cost analysis
   */
  async setCostAnalysis(
    analysis: CostAnalysis,
    timeRange?: string
  ): Promise<void> {
    return this.set("costAnalysis", analysis, { timeRange });
  }

  /**
   * Generic get method for any support operation
   */
  private async get<T>(
    operationType: SupportOperationType,
    context?: Record<string, any>
  ): Promise<T | null> {
    if (!this.config.enabled) {
      return null;
    }

    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(operationType, context);

    try {
      const entry = this.cache.get(cacheKey);

      if (entry) {
        // Check if entry has expired
        if (Date.now() > entry.metadata.expiresAt.getTime()) {
          this.cache.delete(cacheKey);
          this.clearInvalidationTimer(cacheKey);
          this.recordMiss(operationType, Date.now() - startTime);
          return null;
        }

        // Update access metadata
        entry.accessCount++;
        entry.metadata.lastAccessed = new Date();

        // Decompress if needed
        let data = entry.data;
        if (entry.compressed && this.config.compressionEnabled) {
          data = await this.decompress(data);
        }

        this.recordHit(operationType, Date.now() - startTime);
        return data as T;
      }

      this.recordMiss(operationType, Date.now() - startTime);
      return null;
    } catch (error) {
      console.error(`Support cache get error for ${operationType}:`, error);
      this.recordMiss(operationType, Date.now() - startTime);
      return null;
    }
  }

  /**
   * Generic set method for any support operation
   */
  private async set<T>(
    operationType: SupportOperationType,
    data: T,
    context?: Record<string, any>
  ): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    // Check cache size limit
    if (this.cache.size >= this.config.maxCacheSize) {
      await this.evictLeastRecentlyUsed();
    }

    const cacheKey = this.generateCacheKey(operationType, context);
    const ttl = this.config.ttlSeconds[operationType];

    try {
      let dataToCache = data;
      let compressed = false;
      let compressionRatio: number | undefined;

      // Compress large data
      const dataSize = JSON.stringify(data).length;
      if (dataSize > 1024 && this.config.compressionEnabled) {
        const originalSize = dataSize;
        dataToCache = await this.compress(data);
        const compressedSize = JSON.stringify(dataToCache).length;
        compressed = true;
        compressionRatio = compressedSize / originalSize;
      }

      const now = new Date();
      const expiresAt = new Date(now.getTime() + ttl * 1000);

      const entry: CacheEntry<T> = {
        data: dataToCache,
        timestamp: Date.now(),
        ttl,
        compressed,
        accessCount: 0,
        operationType,
        metadata: {
          createdAt: now,
          lastAccessed: now,
          expiresAt,
          size: dataSize,
          compressionRatio,
        },
      };

      this.cache.set(cacheKey, entry);
      this.stats.cacheSize = this.cache.size;

      // Set up TTL-based invalidation
      if (this.config.invalidationStrategy !== "event") {
        this.setupInvalidationTimer(cacheKey, ttl);
      }
    } catch (error) {
      console.error(`Support cache set error for ${operationType}:`, error);
    }
  }

  /**
   * Generate cache key from operation type and context
   */
  private generateCacheKey(
    operationType: SupportOperationType,
    context?: Record<string, any>
  ): string {
    const keyData = {
      operationType,
      context: context || {},
    };

    const hash = createHash("sha256")
      .update(JSON.stringify(keyData))
      .digest("hex");

    return `support-cache:${operationType}:${hash}`;
  }

  /**
   * Setup automatic cache invalidation timer
   */
  private setupInvalidationTimer(cacheKey: string, ttlSeconds: number): void {
    // Clear existing timer if any
    this.clearInvalidationTimer(cacheKey);

    // Set new timer
    const timer = setTimeout(() => {
      this.cache.delete(cacheKey);
      this.invalidationTimers.delete(cacheKey);
      this.stats.cacheSize = this.cache.size;
    }, ttlSeconds * 1000);

    this.invalidationTimers.set(cacheKey, timer);
  }

  /**
   * Clear invalidation timer
   */
  private clearInvalidationTimer(cacheKey: string): void {
    const timer = this.invalidationTimers.get(cacheKey);
    if (timer) {
      clearTimeout(timer);
      this.invalidationTimers.delete(cacheKey);
    }
  }

  /**
   * Invalidate cache for specific operation type
   */
  async invalidate(
    operationType: SupportOperationType,
    context?: Record<string, any>
  ): Promise<void> {
    if (context) {
      // Invalidate specific entry
      const cacheKey = this.generateCacheKey(operationType, context);
      this.cache.delete(cacheKey);
      this.clearInvalidationTimer(cacheKey);
    } else {
      // Invalidate all entries of this operation type
      const keysToDelete: string[] = [];

      for (const [key, entry] of this.cache.entries()) {
        if (entry.operationType === operationType) {
          keysToDelete.push(key);
        }
      }

      for (const key of keysToDelete) {
        this.cache.delete(key);
        this.clearInvalidationTimer(key);
      }
    }

    this.stats.cacheSize = this.cache.size;
  }

  /**
   * Invalidate all cache entries
   */
  async invalidateAll(): Promise<void> {
    this.cache.clear();

    // Clear all timers
    for (const timer of this.invalidationTimers.values()) {
      clearTimeout(timer);
    }
    this.invalidationTimers.clear();

    this.stats.cacheSize = 0;
  }

  /**
   * Evict least recently used entry
   */
  private async evictLeastRecentlyUsed(): Promise<void> {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      const lastAccessed = entry.metadata.lastAccessed.getTime();
      if (lastAccessed < oldestTime) {
        oldestTime = lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.clearInvalidationTimer(oldestKey);
      this.stats.cacheSize = this.cache.size;
    }
  }

  /**
   * Compress data
   */
  private async compress<T>(data: T): Promise<T> {
    // Simple compression simulation - in production use zlib
    const jsonString = JSON.stringify(data);
    return JSON.parse(`{"compressed":true,"data":"${jsonString}"}`) as T;
  }

  /**
   * Decompress data
   */
  private async decompress<T>(data: T): Promise<T> {
    // Simple decompression simulation
    const compressed = data as any;
    if (compressed.compressed && compressed.data) {
      return JSON.parse(compressed.data) as T;
    }
    return data;
  }

  /**
   * Record cache hit
   */
  private recordHit(
    operationType: SupportOperationType,
    latency: number
  ): void {
    this.stats.hits++;
    this.stats.totalRequests++;

    const opStats = this.stats.operationStats[operationType];
    opStats.hits++;
    opStats.lastAccess = new Date();
    this.updateOperationStats(opStats, latency);

    this.updateGlobalStats(latency);
  }

  /**
   * Record cache miss
   */
  private recordMiss(
    operationType: SupportOperationType,
    latency: number
  ): void {
    this.stats.misses++;
    this.stats.totalRequests++;

    const opStats = this.stats.operationStats[operationType];
    opStats.misses++;
    opStats.lastAccess = new Date();
    this.updateOperationStats(opStats, latency);

    this.updateGlobalStats(latency);
  }

  /**
   * Update operation-specific statistics
   */
  private updateOperationStats(
    opStats: OperationCacheStats,
    latency: number
  ): void {
    const totalRequests = opStats.hits + opStats.misses;
    opStats.hitRate = totalRequests > 0 ? opStats.hits / totalRequests : 0;
    opStats.averageLatency = (opStats.averageLatency + latency) / 2;
  }

  /**
   * Update global statistics
   */
  private updateGlobalStats(latency: number): void {
    this.stats.hitRate =
      this.stats.totalRequests > 0
        ? this.stats.hits / this.stats.totalRequests
        : 0;

    this.stats.averageLatency = (this.stats.averageLatency + latency) / 2;
    this.stats.lastUpdated = new Date();
  }

  /**
   * Create initial operation statistics
   */
  private createOperationStats(): OperationCacheStats {
    return {
      hits: 0,
      misses: 0,
      hitRate: 0,
      averageLatency: 0,
      lastAccess: null,
    };
  }

  /**
   * Get cache statistics
   */
  getStats(): SupportCacheStats {
    return JSON.parse(JSON.stringify(this.stats));
  }

  /**
   * Get statistics for specific operation type
   */
  getOperationStats(operationType: SupportOperationType): OperationCacheStats {
    return JSON.parse(JSON.stringify(this.stats.operationStats[operationType]));
  }

  /**
   * Check if cache performance meets targets
   */
  isPerformanceTarget(targetHitRate: number = 0.7): boolean {
    return this.stats.hitRate >= targetHitRate;
  }

  /**
   * Get cache configuration
   */
  getConfig(): SupportCacheConfig {
    return JSON.parse(JSON.stringify(this.config));
  }

  /**
   * Update cache configuration
   */
  updateConfig(newConfig: Partial<SupportCacheConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Update TTL for specific operation types if provided
    if (newConfig.ttlSeconds) {
      this.config.ttlSeconds = {
        ...this.config.ttlSeconds,
        ...newConfig.ttlSeconds,
      };
    }
  }

  /**
   * Health check for cache system
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    cacheSize: number;
    hitRate: number;
    averageLatency: number;
    errors: string[];
  }> {
    const errors: string[] = [];

    try {
      // Check cache size
      if (this.cache.size > this.config.maxCacheSize * 0.9) {
        errors.push(
          `Cache size approaching limit: ${this.cache.size}/${this.config.maxCacheSize}`
        );
      }

      // Check hit rate
      if (this.stats.hitRate < 0.5 && this.stats.totalRequests > 10) {
        errors.push(
          `Low cache hit rate: ${(this.stats.hitRate * 100).toFixed(1)}%`
        );
      }

      // Check average latency
      if (this.stats.averageLatency > 100) {
        errors.push(
          `High cache latency: ${this.stats.averageLatency.toFixed(0)}ms`
        );
      }
    } catch (error) {
      errors.push(`Health check error: ${error}`);
    }

    const healthy = errors.length === 0;

    return {
      healthy,
      cacheSize: this.cache.size,
      hitRate: this.stats.hitRate,
      averageLatency: this.stats.averageLatency,
      errors,
    };
  }

  /**
   * Warm up cache with common support operations
   */
  async warmUp(
    operations: Array<{
      type: SupportOperationType;
      data: any;
      context?: Record<string, any>;
    }>
  ): Promise<void> {
    console.log(
      `Warming up support cache with ${operations.length} operations`
    );

    for (const operation of operations) {
      await this.set(operation.type, operation.data, operation.context);
    }

    console.log(
      `Cache warmed up: ${this.cache.size} entries, hit rate: ${(
        this.stats.hitRate * 100
      ).toFixed(1)}%`
    );
  }

  /**
   * Get cache entries for debugging
   */
  getCacheEntries(): Array<{
    key: string;
    operationType: SupportOperationType;
    size: number;
    accessCount: number;
    expiresAt: Date;
  }> {
    const entries: Array<{
      key: string;
      operationType: SupportOperationType;
      size: number;
      accessCount: number;
      expiresAt: Date;
    }> = [];

    for (const [key, entry] of this.cache.entries()) {
      entries.push({
        key,
        operationType: entry.operationType,
        size: entry.metadata.size,
        accessCount: entry.accessCount,
        expiresAt: entry.metadata.expiresAt,
      });
    }

    return entries;
  }
}

/**
 * Factory function for creating support operations cache
 */
export const createSupportOperationsCache = (
  config?: Partial<SupportCacheConfig>
): SupportOperationsCache => {
  return new SupportOperationsCache(config);
};

/**
 * Default cache configurations for different environments
 */
export const SUPPORT_CACHE_CONFIGS = {
  development: {
    enabled: true,
    ttlSeconds: {
      infrastructureAudit: 60, // 1 minute
      metaMonitoring: 30, // 30 seconds
      implementationGaps: 120, // 2 minutes
      complianceValidation: 300, // 5 minutes
      securityAudit: 180, // 3 minutes
      costAnalysis: 60, // 1 minute
    },
    maxCacheSize: 100,
  },
  staging: {
    enabled: true,
    ttlSeconds: {
      infrastructureAudit: 180, // 3 minutes
      metaMonitoring: 45, // 45 seconds
      implementationGaps: 300, // 5 minutes
      complianceValidation: 900, // 15 minutes
      securityAudit: 450, // 7.5 minutes
      costAnalysis: 180, // 3 minutes
    },
    maxCacheSize: 500,
  },
  production: {
    enabled: true,
    ttlSeconds: {
      infrastructureAudit: 300, // 5 minutes
      metaMonitoring: 60, // 1 minute
      implementationGaps: 600, // 10 minutes
      complianceValidation: 1800, // 30 minutes
      securityAudit: 900, // 15 minutes
      costAnalysis: 300, // 5 minutes
    },
    maxCacheSize: 1000,
  },
} as const;
