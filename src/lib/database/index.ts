/**
 * Database Performance Optimization - Main Module
 * 
 * This module provides a unified interface for all database performance optimization features:
 * - Query performance monitoring and optimization
 * - Intelligent connection pooling with auto-scaling
 * - Redis-based query caching
 * - Index optimization recommendations
 * - Real-time performance alerts and regression detection
 */

export { 
  DatabasePerformanceOptimizer,
  databaseOptimizer,
  type DatabasePerformanceConfig,
  type QueryPerformanceMetric,
  type ConnectionPoolMetric,
  type CachePerformanceMetric,
  type IndexRecommendation,
  type DatabasePerformanceAlert
} from './performance-optimizer';

export {
  RedisQueryCache,
  redisCache,
  type RedisCacheConfig,
  type CacheEntry,
  type CacheStats,
  type InvalidationPattern
} from './redis-cache';

export {
  IntelligentConnectionPool,
  connectionPool,
  type ConnectionPoolConfig,
  type DatabaseConnection,
  type ConnectionPoolMetrics,
  type PoolEvent
} from './connection-pool';

export {
  DatabaseIndexOptimizer,
  indexOptimizer,
  type IndexRecommendation as IndexOptimizationRecommendation,
  type QueryAnalysis,
  type IndexUsageStats,
  type SchemaAnalysis,
  type IndexType
} from './index-optimizer';

/**
 * Initialize all database optimization components
 */
export async function initializeDatabaseOptimization(config: {
  enablePerformanceOptimizer?: boolean;
  enableRedisCache?: boolean;
  enableConnectionPool?: boolean;
  enableIndexOptimizer?: boolean;
} = {}): Promise<void> {
  const {
    enablePerformanceOptimizer = true,
    enableRedisCache = true,
    enableConnectionPool = true,
    enableIndexOptimizer = true
  } = config;

  console.log('Initializing database optimization components...');

  try {
    // Initialize components in order
    if (enableConnectionPool) {
      await connectionPool.initialize();
    }

    if (enableRedisCache) {
      await redisCache.initialize();
    }

    if (enablePerformanceOptimizer) {
      await databaseOptimizer.initialize();
    }

    if (enableIndexOptimizer) {
      await indexOptimizer.initialize();
    }

    console.log('Database optimization initialization complete');

  } catch (error) {
    console.error('Failed to initialize database optimization:', error);
    throw error;
  }
}

/**
 * Get comprehensive database performance summary
 */
export function getDatabasePerformanceSummary() {
  const performanceSummary = databaseOptimizer.getPerformanceSummary();
  const optimizationSummary = indexOptimizer.getOptimizationSummary();
  
  return {
    performance: performanceSummary,
    optimization: optimizationSummary,
    connectionPool: connectionPool.getHealthStatus(),
    timestamp: Date.now()
  };
}

/**
 * Execute optimized database query with all optimizations
 */
export async function executeOptimizedQuery<T>(
  query: string,
  params: any[] = [],
  options: {
    useCache?: boolean;
    cacheKey?: string;
    cacheTtlSeconds?: number;
    timeout?: number;
    retries?: number;
    enableMonitoring?: boolean;
  } = {}
): Promise<T> {
  const {
    useCache = true,
    cacheKey,
    cacheTtlSeconds,
    timeout,
    retries,
    enableMonitoring = true
  } = options;

  const startTime = Date.now();
  const queryId = `query_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  try {
    let result: T;

    // Try cache first if enabled
    if (useCache) {
      const key = cacheKey || redisCache.generateQueryKey(query, params);
      const cached = await redisCache.get<T>(key);
      
      if (cached) {
        if (enableMonitoring) {
          const executionTime = Date.now() - startTime;
          await databaseOptimizer.monitorQuery(
            queryId, query, executionTime, 0, 0, ['cache'], 'cache'
          );
        }
        return cached;
      }
    }

    // Execute query through connection pool
    result = await connectionPool.executeQuery<T>(query, params, { timeout, retries });

    // Cache result if enabled
    if (useCache) {
      const key = cacheKey || redisCache.generateQueryKey(query, params);
      await redisCache.set(key, result, cacheTtlSeconds);
    }

    // Monitor query performance
    if (enableMonitoring) {
      const executionTime = Date.now() - startTime;
      await databaseOptimizer.monitorQuery(
        queryId, query, executionTime, 0, 0, [], 'pool'
      );

      // Analyze for index optimization
      await indexOptimizer.analyzeQuery(queryId, query, executionTime);
    }

    return result;

  } catch (error) {
    // Monitor failed query
    if (enableMonitoring) {
      const executionTime = Date.now() - startTime;
      await databaseOptimizer.monitorQuery(
        queryId, query, executionTime, 0, 0, [], 'error', undefined, undefined, String(error)
      );
    }

    throw error;
  }
}

/**
 * Invalidate cache for table operations
 */
export async function invalidateTableCache(
  tableName: string, 
  operation: 'insert' | 'update' | 'delete'
): Promise<void> {
  await redisCache.invalidateTable(tableName, operation);
}

/**
 * Get all performance alerts
 */
export function getAllPerformanceAlerts() {
  return {
    database: databaseOptimizer.getAlerts(),
    connectionPool: connectionPool.getEvents().filter(e => e.type === 'error' || e.type === 'warning'),
    indexOptimizer: indexOptimizer.getRecommendations().filter(r => r.priority > 90)
  };
}

/**
 * Get optimization recommendations
 */
export function getOptimizationRecommendations() {
  return {
    indexes: indexOptimizer.getHighPriorityRecommendations(),
    queries: databaseOptimizer.getQueryMetrics()
      .filter(m => m.executionTimeMs > 1000)
      .sort((a, b) => b.executionTimeMs - a.executionTimeMs)
      .slice(0, 10),
    connectionPool: connectionPool.getHealthStatus()
  };
}

/**
 * Cleanup and shutdown all database optimization components
 */
export async function shutdownDatabaseOptimization(): Promise<void> {
  console.log('Shutting down database optimization components...');

  try {
    await Promise.all([
      connectionPool.shutdown(),
      redisCache.disconnect()
    ]);

    databaseOptimizer.destroy();
    indexOptimizer.destroy();

    console.log('Database optimization shutdown complete');

  } catch (error) {
    console.error('Error during database optimization shutdown:', error);
  }
}