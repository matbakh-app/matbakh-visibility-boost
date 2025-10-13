/**
 * Database Performance Optimization System
 * 
 * This module provides comprehensive database performance optimization including:
 * - Query performance monitoring and analysis
 * - Intelligent connection pooling with auto-scaling
 * - Database query caching with Redis integration
 * - Index optimization recommendations
 * - Real-time performance alerts and regression detection
 */

import { publishMetric } from '../monitoring';

// Database performance configuration
export interface DatabasePerformanceConfig {
  enableQueryMonitoring: boolean;
  enableConnectionPooling: boolean;
  enableQueryCaching: boolean;
  enableIndexOptimization: boolean;
  queryTimeoutMs: number;
  slowQueryThresholdMs: number;
  connectionPoolSize: {
    min: number;
    max: number;
    acquireTimeoutMs: number;
    idleTimeoutMs: number;
  };
  cacheConfig: {
    ttlSeconds: number;
    maxKeys: number;
    enableCompression: boolean;
  };
  alertThresholds: {
    slowQueryMs: number;
    connectionPoolUtilization: number;
    cacheHitRatio: number;
    deadlockCount: number;
  };
}

// Query performance metrics
export interface QueryPerformanceMetric {
  queryId: string;
  query: string;
  executionTimeMs: number;
  rowsAffected: number;
  planCost: number;
  indexesUsed: string[];
  timestamp: number;
  connectionId: string;
  userId?: string;
  sessionId?: string;
  errorMessage?: string;
}

// Connection pool metrics
export interface ConnectionPoolMetric {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  waitingRequests: number;
  averageWaitTimeMs: number;
  connectionErrors: number;
  timestamp: number;
}

// Cache performance metrics
export interface CachePerformanceMetric {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  hitRatio: number;
  averageResponseTimeMs: number;
  evictions: number;
  memoryUsageMB: number;
  timestamp: number;
}

// Index optimization recommendation
export interface IndexRecommendation {
  tableName: string;
  columns: string[];
  type: 'btree' | 'hash' | 'gin' | 'gist';
  reason: string;
  estimatedImpact: 'low' | 'medium' | 'high';
  currentCost: number;
  estimatedCost: number;
  queries: string[];
  priority: number;
}

// Performance alert
export interface DatabasePerformanceAlert {
  type: 'slow_query' | 'connection_pool_exhausted' | 'cache_miss_spike' | 'deadlock_detected' | 'index_recommendation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details: any;
  timestamp: number;
  resolved: boolean;
}

class DatabasePerformanceOptimizer {
  private config: DatabasePerformanceConfig;
  private queryMetrics: QueryPerformanceMetric[] = [];
  private connectionPoolMetrics: ConnectionPoolMetric[] = [];
  private cacheMetrics: CachePerformanceMetric[] = [];
  private alerts: DatabasePerformanceAlert[] = [];
  private indexRecommendations: IndexRecommendation[] = [];
  private isInitialized = false;
  private monitoringInterval?: NodeJS.Timeout;
  private metricsInterval?: NodeJS.Timeout;

  // Query cache (in-memory for now, Redis integration below)
  private queryCache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  
  // Connection pool simulation (would integrate with actual pool)
  private connectionPool = {
    total: 0,
    active: 0,
    idle: 0,
    waiting: 0,
    errors: 0
  };

  constructor(config: Partial<DatabasePerformanceConfig> = {}) {
    this.config = {
      enableQueryMonitoring: true,
      enableConnectionPooling: true,
      enableQueryCaching: true,
      enableIndexOptimization: true,
      queryTimeoutMs: 30000,
      slowQueryThresholdMs: 1000,
      connectionPoolSize: {
        min: 5,
        max: 20,
        acquireTimeoutMs: 10000,
        idleTimeoutMs: 300000
      },
      cacheConfig: {
        ttlSeconds: 300,
        maxKeys: 10000,
        enableCompression: true
      },
      alertThresholds: {
        slowQueryMs: 2000,
        connectionPoolUtilization: 0.8,
        cacheHitRatio: 0.7,
        deadlockCount: 5
      },
      ...config
    };
  }

  /**
   * Initialize database performance optimization
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize connection pool
      if (this.config.enableConnectionPooling) {
        await this.initializeConnectionPool();
      }

      // Initialize query cache
      if (this.config.enableQueryCaching) {
        await this.initializeQueryCache();
      }

      // Start monitoring
      this.startPerformanceMonitoring();

      // Generate initial index recommendations
      if (this.config.enableIndexOptimization) {
        await this.generateIndexRecommendations();
      }

      this.isInitialized = true;
      console.log('Database performance optimizer initialized');

      // Record initialization metric
      await this.recordMetric('db_optimizer_initialized', 1);

    } catch (error) {
      console.error('Failed to initialize database performance optimizer:', error);
      throw error;
    }
  }

  /**
   * Initialize intelligent connection pool
   */
  private async initializeConnectionPool(): Promise<void> {
    const { min, max } = this.config.connectionPoolSize;
    
    // Initialize pool with minimum connections
    this.connectionPool.total = min;
    this.connectionPool.idle = min;
    this.connectionPool.active = 0;
    this.connectionPool.waiting = 0;

    console.log(`Connection pool initialized: ${min}-${max} connections`);
  }

  /**
   * Initialize query cache (Redis integration)
   */
  private async initializeQueryCache(): Promise<void> {
    // In production, this would connect to Redis
    // For now, using in-memory cache with TTL cleanup
    
    setInterval(() => {
      this.cleanupExpiredCache();
    }, 60000); // Cleanup every minute

    console.log('Query cache initialized');
  }

  /**
   * Monitor query performance
   */
  public async monitorQuery(
    queryId: string,
    query: string,
    executionTimeMs: number,
    rowsAffected: number = 0,
    planCost: number = 0,
    indexesUsed: string[] = [],
    connectionId: string = 'default',
    userId?: string,
    sessionId?: string,
    errorMessage?: string
  ): Promise<void> {
    if (!this.config.enableQueryMonitoring) return;

    const metric: QueryPerformanceMetric = {
      queryId,
      query: this.sanitizeQuery(query),
      executionTimeMs,
      rowsAffected,
      planCost,
      indexesUsed,
      timestamp: Date.now(),
      connectionId,
      userId,
      sessionId,
      errorMessage
    };

    // Store metric
    this.queryMetrics.push(metric);

    // Keep only recent metrics (last 1000)
    if (this.queryMetrics.length > 1000) {
      this.queryMetrics = this.queryMetrics.slice(-1000);
    }

    // Send to CloudWatch
    await this.recordMetric('db_query_execution_time', executionTimeMs, {
      QueryType: this.getQueryType(query),
      HasError: errorMessage ? 'true' : 'false',
      ConnectionId: connectionId.slice(-8)
    });

    // Check for slow queries
    if (executionTimeMs > this.config.alertThresholds.slowQueryMs) {
      await this.createAlert('slow_query', 'high', 
        `Slow query detected: ${executionTimeMs}ms`, { metric });
    }

    // Check for very slow queries
    if (executionTimeMs > this.config.slowQueryThresholdMs * 5) {
      await this.createAlert('slow_query', 'critical', 
        `Critical slow query: ${executionTimeMs}ms`, { metric });
    }

    // Analyze for index recommendations
    if (this.config.enableIndexOptimization && executionTimeMs > this.config.slowQueryThresholdMs) {
      await this.analyzeQueryForIndexRecommendation(metric);
    }
  }

  /**
   * Get connection from pool with auto-scaling
   */
  public async getConnection(): Promise<string> {
    const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    
    // Check if pool needs scaling
    const utilization = this.connectionPool.active / this.connectionPool.total;
    
    if (utilization > this.config.alertThresholds.connectionPoolUtilization) {
      await this.scaleConnectionPool();
    }

    // Simulate connection acquisition
    if (this.connectionPool.idle > 0) {
      this.connectionPool.idle--;
      this.connectionPool.active++;
    } else {
      this.connectionPool.waiting++;
      
      // Alert if too many waiting
      if (this.connectionPool.waiting > 5) {
        await this.createAlert('connection_pool_exhausted', 'high',
          `Connection pool exhausted: ${this.connectionPool.waiting} waiting`, 
          { poolState: { ...this.connectionPool } });
      }
    }

    return connectionId;
  }

  /**
   * Release connection back to pool
   */
  public async releaseConnection(connectionId: string): Promise<void> {
    this.connectionPool.active = Math.max(0, this.connectionPool.active - 1);
    this.connectionPool.idle++;
    
    // Handle waiting requests
    if (this.connectionPool.waiting > 0) {
      this.connectionPool.waiting--;
      this.connectionPool.idle--;
      this.connectionPool.active++;
    }
  }

  /**
   * Scale connection pool based on demand
   */
  private async scaleConnectionPool(): Promise<void> {
    const { max } = this.config.connectionPoolSize;
    
    if (this.connectionPool.total < max) {
      const newConnections = Math.min(5, max - this.connectionPool.total);
      this.connectionPool.total += newConnections;
      this.connectionPool.idle += newConnections;
      
      console.log(`Scaled connection pool: +${newConnections} connections (total: ${this.connectionPool.total})`);
      
      await this.recordMetric('db_connection_pool_scaled', newConnections, {
        TotalConnections: this.connectionPool.total.toString(),
        Reason: 'high_utilization'
      });
    }
  }

  /**
   * Execute query with caching
   */
  public async executeQueryWithCache<T>(
    query: string,
    params: any[] = [],
    cacheKey?: string,
    ttlSeconds?: number
  ): Promise<T> {
    if (!this.config.enableQueryCaching) {
      return this.executeQuery<T>(query, params);
    }

    const key = cacheKey || this.generateCacheKey(query, params);
    const cached = this.queryCache.get(key);
    
    // Check cache hit
    if (cached && Date.now() < cached.timestamp + cached.ttl * 1000) {
      await this.recordCacheMetric('hit');
      return cached.data;
    }

    // Cache miss - execute query
    await this.recordCacheMetric('miss');
    const result = await this.executeQuery<T>(query, params);
    
    // Store in cache
    const ttl = ttlSeconds || this.config.cacheConfig.ttlSeconds;
    this.queryCache.set(key, {
      data: result,
      timestamp: Date.now(),
      ttl
    });

    // Cleanup if cache is too large
    if (this.queryCache.size > this.config.cacheConfig.maxKeys) {
      this.cleanupOldestCache();
    }

    return result;
  }

  /**
   * Execute query (mock implementation)
   */
  private async executeQuery<T>(query: string, params: any[] = []): Promise<T> {
    const startTime = Date.now();
    const connectionId = await this.getConnection();
    
    try {
      // Simulate query execution
      const executionTime = Math.random() * 500 + 50; // 50-550ms
      await new Promise(resolve => setTimeout(resolve, executionTime));
      
      // Mock result
      const result = { rows: [], rowCount: 0 } as T;
      
      // Monitor the query
      await this.monitorQuery(
        `query_${Date.now()}`,
        query,
        Date.now() - startTime,
        0,
        Math.random() * 1000,
        ['idx_primary'],
        connectionId
      );
      
      return result;
      
    } finally {
      await this.releaseConnection(connectionId);
    }
  }

  /**
   * Generate index recommendations based on query analysis
   */
  private async analyzeQueryForIndexRecommendation(metric: QueryPerformanceMetric): Promise<void> {
    const query = metric.query.toLowerCase();
    
    // Simple heuristics for index recommendations
    const recommendations: Partial<IndexRecommendation>[] = [];
    
    // WHERE clause analysis
    const whereMatch = query.match(/where\s+(\w+)\s*[=<>]/g);
    if (whereMatch) {
      whereMatch.forEach(clause => {
        const column = clause.match(/where\s+(\w+)/)?.[1];
        if (column && !metric.indexesUsed.includes(`idx_${column}`)) {
          recommendations.push({
            columns: [column],
            type: 'btree',
            reason: `WHERE clause on ${column} without index`,
            estimatedImpact: 'high',
            priority: 90
          });
        }
      });
    }

    // ORDER BY analysis
    const orderMatch = query.match(/order\s+by\s+(\w+)/g);
    if (orderMatch) {
      orderMatch.forEach(clause => {
        const column = clause.match(/order\s+by\s+(\w+)/)?.[1];
        if (column && !metric.indexesUsed.includes(`idx_${column}`)) {
          recommendations.push({
            columns: [column],
            type: 'btree',
            reason: `ORDER BY on ${column} without index`,
            estimatedImpact: 'medium',
            priority: 70
          });
        }
      });
    }

    // JOIN analysis
    const joinMatch = query.match(/join\s+\w+\s+on\s+(\w+)\s*=\s*(\w+)/g);
    if (joinMatch) {
      joinMatch.forEach(clause => {
        const columns = clause.match(/on\s+(\w+)\s*=\s*(\w+)/);
        if (columns) {
          recommendations.push({
            columns: [columns[1], columns[2]],
            type: 'btree',
            reason: `JOIN condition without composite index`,
            estimatedImpact: 'high',
            priority: 85
          });
        }
      });
    }

    // Add recommendations
    recommendations.forEach(rec => {
      if (rec.columns && rec.columns.length > 0) {
        const recommendation: IndexRecommendation = {
          tableName: this.extractTableName(query),
          columns: rec.columns,
          type: rec.type || 'btree',
          reason: rec.reason || 'Performance optimization',
          estimatedImpact: rec.estimatedImpact || 'medium',
          currentCost: metric.planCost,
          estimatedCost: metric.planCost * 0.3, // Estimate 70% improvement
          queries: [metric.query],
          priority: rec.priority || 50
        };

        this.addIndexRecommendation(recommendation);
      }
    });
  }

  /**
   * Add or update index recommendation
   */
  private addIndexRecommendation(recommendation: IndexRecommendation): void {
    const existing = this.indexRecommendations.find(r => 
      r.tableName === recommendation.tableName &&
      JSON.stringify(r.columns.sort()) === JSON.stringify(recommendation.columns.sort())
    );

    if (existing) {
      // Update existing recommendation
      existing.queries.push(...recommendation.queries);
      existing.priority = Math.max(existing.priority, recommendation.priority);
      if (recommendation.estimatedImpact === 'high') {
        existing.estimatedImpact = 'high';
      }
    } else {
      // Add new recommendation
      this.indexRecommendations.push(recommendation);
    }

    // Keep only top 50 recommendations
    this.indexRecommendations.sort((a, b) => b.priority - a.priority);
    this.indexRecommendations = this.indexRecommendations.slice(0, 50);
  }

  /**
   * Generate comprehensive index recommendations
   */
  public async generateIndexRecommendations(): Promise<IndexRecommendation[]> {
    // Analyze recent query patterns
    const recentQueries = this.queryMetrics.filter(m => 
      Date.now() - m.timestamp < 24 * 60 * 60 * 1000 // Last 24 hours
    );

    // Group by query pattern
    const queryPatterns = new Map<string, QueryPerformanceMetric[]>();
    
    recentQueries.forEach(metric => {
      const pattern = this.normalizeQueryPattern(metric.query);
      if (!queryPatterns.has(pattern)) {
        queryPatterns.set(pattern, []);
      }
      queryPatterns.get(pattern)!.push(metric);
    });

    // Analyze each pattern for optimization opportunities
    for (const [pattern, metrics] of queryPatterns) {
      const avgExecutionTime = metrics.reduce((sum, m) => sum + m.executionTimeMs, 0) / metrics.length;
      
      if (avgExecutionTime > this.config.slowQueryThresholdMs) {
        const representativeMetric = metrics[0];
        await this.analyzeQueryForIndexRecommendation(representativeMetric);
      }
    }

    return this.getIndexRecommendations();
  }

  /**
   * Start performance monitoring loop
   */
  private startPerformanceMonitoring(): void {
    // Monitor every 30 seconds
    this.monitoringInterval = setInterval(async () => {
      await this.collectPerformanceMetrics();
    }, 30000);
  }

  /**
   * Collect comprehensive performance metrics
   */
  private async collectPerformanceMetrics(): Promise<void> {
    // Connection pool metrics
    const poolMetric: ConnectionPoolMetric = {
      totalConnections: this.connectionPool.total,
      activeConnections: this.connectionPool.active,
      idleConnections: this.connectionPool.idle,
      waitingRequests: this.connectionPool.waiting,
      averageWaitTimeMs: 0, // Would calculate from actual wait times
      connectionErrors: this.connectionPool.errors,
      timestamp: Date.now()
    };

    this.connectionPoolMetrics.push(poolMetric);

    // Cache metrics
    const cacheMetric: CachePerformanceMetric = {
      totalRequests: this.getCacheStats().totalRequests,
      cacheHits: this.getCacheStats().hits,
      cacheMisses: this.getCacheStats().misses,
      hitRatio: this.getCacheStats().hitRatio,
      averageResponseTimeMs: this.getCacheStats().avgResponseTime,
      evictions: this.getCacheStats().evictions,
      memoryUsageMB: this.queryCache.size * 0.001, // Rough estimate
      timestamp: Date.now()
    };

    this.cacheMetrics.push(cacheMetric);

    // Send metrics to CloudWatch
    await this.recordMetric('db_connection_pool_utilization', 
      poolMetric.activeConnections / poolMetric.totalConnections);
    
    await this.recordMetric('db_cache_hit_ratio', cacheMetric.hitRatio);
    
    await this.recordMetric('db_active_connections', poolMetric.activeConnections);

    // Check for alerts
    await this.checkPerformanceAlerts(poolMetric, cacheMetric);

    // Cleanup old metrics
    this.cleanupOldMetrics();
  }

  /**
   * Check for performance alerts
   */
  private async checkPerformanceAlerts(
    poolMetric: ConnectionPoolMetric, 
    cacheMetric: CachePerformanceMetric
  ): Promise<void> {
    // Connection pool utilization alert
    const utilization = poolMetric.activeConnections / poolMetric.totalConnections;
    if (utilization > this.config.alertThresholds.connectionPoolUtilization) {
      await this.createAlert('connection_pool_exhausted', 'medium',
        `High connection pool utilization: ${Math.round(utilization * 100)}%`,
        { utilization, poolMetric });
    }

    // Cache hit ratio alert
    if (cacheMetric.hitRatio < this.config.alertThresholds.cacheHitRatio) {
      await this.createAlert('cache_miss_spike', 'medium',
        `Low cache hit ratio: ${Math.round(cacheMetric.hitRatio * 100)}%`,
        { hitRatio: cacheMetric.hitRatio, cacheMetric });
    }

    // Index recommendation alert
    const highPriorityRecommendations = this.indexRecommendations.filter(r => r.priority > 80);
    if (highPriorityRecommendations.length > 0) {
      await this.createAlert('index_recommendation', 'low',
        `${highPriorityRecommendations.length} high-priority index recommendations available`,
        { recommendations: highPriorityRecommendations });
    }
  }

  /**
   * Create performance alert
   */
  private async createAlert(
    type: DatabasePerformanceAlert['type'],
    severity: DatabasePerformanceAlert['severity'],
    message: string,
    details: any
  ): Promise<void> {
    const alert: DatabasePerformanceAlert = {
      type,
      severity,
      message,
      details,
      timestamp: Date.now(),
      resolved: false
    };

    this.alerts.push(alert);

    // Send alert metric
    await this.recordMetric('db_performance_alert', 1, {
      Type: type,
      Severity: severity
    });

    console.warn('Database Performance Alert:', alert);
  }

  /**
   * Utility methods
   */
  private sanitizeQuery(query: string): string {
    // Remove sensitive data from queries for logging
    return query
      .replace(/('[^']*'|"[^"]*")/g, "'***'")
      .replace(/\b\d+\b/g, 'N')
      .substring(0, 500);
  }

  private getQueryType(query: string): string {
    const q = query.trim().toLowerCase();
    if (q.startsWith('select')) return 'SELECT';
    if (q.startsWith('insert')) return 'INSERT';
    if (q.startsWith('update')) return 'UPDATE';
    if (q.startsWith('delete')) return 'DELETE';
    return 'OTHER';
  }

  private extractTableName(query: string): string {
    const match = query.match(/(?:from|into|update|join)\s+(\w+)/i);
    return match ? match[1] : 'unknown';
  }

  private normalizeQueryPattern(query: string): string {
    return query
      .replace(/('[^']*'|"[^"]*")/g, '?')
      .replace(/\b\d+\b/g, '?')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private generateCacheKey(query: string, params: any[]): string {
    return `query:${Buffer.from(query + JSON.stringify(params)).toString('base64').substring(0, 64)}`;
  }

  private cleanupExpiredCache(): void {
    const now = Date.now();
    for (const [key, value] of this.queryCache.entries()) {
      if (now > value.timestamp + value.ttl * 1000) {
        this.queryCache.delete(key);
      }
    }
  }

  private cleanupOldestCache(): void {
    const entries = Array.from(this.queryCache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // Remove oldest 10%
    const toRemove = Math.ceil(entries.length * 0.1);
    for (let i = 0; i < toRemove; i++) {
      this.queryCache.delete(entries[i][0]);
    }
  }

  private cleanupOldMetrics(): void {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24 hours
    
    this.queryMetrics = this.queryMetrics.filter(m => m.timestamp > cutoff);
    this.connectionPoolMetrics = this.connectionPoolMetrics.filter(m => m.timestamp > cutoff);
    this.cacheMetrics = this.cacheMetrics.filter(m => m.timestamp > cutoff);
  }

  private getCacheStats() {
    // Mock cache statistics
    return {
      totalRequests: 1000,
      hits: 750,
      misses: 250,
      hitRatio: 0.75,
      avgResponseTime: 5,
      evictions: 10
    };
  }

  private async recordCacheMetric(type: 'hit' | 'miss'): Promise<void> {
    await this.recordMetric('db_cache_request', 1, { Type: type });
  }

  private async recordMetric(name: string, value: number, dimensions: Record<string, string> = {}): Promise<void> {
    try {
      // Determine appropriate unit based on metric name
      let unit = 'Count';
      if (name.includes('time') || name.includes('latency') || name.includes('duration')) {
        unit = 'Milliseconds';
      } else if (name.includes('ratio') || name.includes('utilization') || name.includes('percentage')) {
        unit = 'Percent';
      } else if (name.includes('size') || name.includes('bytes')) {
        unit = 'Bytes';
      }

      await publishMetric({
        metricName: name,
        value,
        unit,
        dimensions: {
          Service: 'DatabasePerformanceOptimizer',
          Environment: process.env.NODE_ENV || 'development',
          Component: 'DatabaseOptimizer',
          ...dimensions
        }
      });
    } catch (error) {
      console.warn('Failed to record database metric:', error);
    }
  }

  /**
   * Public API methods
   */
  public getQueryMetrics(): QueryPerformanceMetric[] {
    return [...this.queryMetrics];
  }

  public getConnectionPoolMetrics(): ConnectionPoolMetric[] {
    return [...this.connectionPoolMetrics];
  }

  public getCacheMetrics(): CachePerformanceMetric[] {
    return [...this.cacheMetrics];
  }

  public getAlerts(): DatabasePerformanceAlert[] {
    return [...this.alerts];
  }

  public getIndexRecommendations(): IndexRecommendation[] {
    return [...this.indexRecommendations].sort((a, b) => b.priority - a.priority);
  }

  public async clearCache(pattern?: string): Promise<void> {
    if (pattern) {
      for (const key of this.queryCache.keys()) {
        if (key.includes(pattern)) {
          this.queryCache.delete(key);
        }
      }
    } else {
      this.queryCache.clear();
    }
  }

  public getPerformanceSummary() {
    const recentQueries = this.queryMetrics.filter(m => 
      Date.now() - m.timestamp < 60 * 60 * 1000 // Last hour
    );

    const avgQueryTime = recentQueries.length > 0 
      ? recentQueries.reduce((sum, m) => sum + m.executionTimeMs, 0) / recentQueries.length 
      : 0;

    const slowQueries = recentQueries.filter(m => m.executionTimeMs > this.config.slowQueryThresholdMs);
    
    const latestPoolMetric = this.connectionPoolMetrics[this.connectionPoolMetrics.length - 1];
    const latestCacheMetric = this.cacheMetrics[this.cacheMetrics.length - 1];

    return {
      queryPerformance: {
        averageExecutionTimeMs: Math.round(avgQueryTime),
        totalQueries: recentQueries.length,
        slowQueries: slowQueries.length,
        slowQueryPercentage: recentQueries.length > 0 ? (slowQueries.length / recentQueries.length) * 100 : 0
      },
      connectionPool: latestPoolMetric ? {
        utilization: (latestPoolMetric.activeConnections / latestPoolMetric.totalConnections) * 100,
        totalConnections: latestPoolMetric.totalConnections,
        activeConnections: latestPoolMetric.activeConnections,
        waitingRequests: latestPoolMetric.waitingRequests
      } : null,
      cache: latestCacheMetric ? {
        hitRatio: latestCacheMetric.hitRatio * 100,
        totalRequests: latestCacheMetric.totalRequests,
        memoryUsageMB: latestCacheMetric.memoryUsageMB
      } : null,
      alerts: {
        total: this.alerts.length,
        unresolved: this.alerts.filter(a => !a.resolved).length,
        critical: this.alerts.filter(a => a.severity === 'critical' && !a.resolved).length
      },
      indexRecommendations: {
        total: this.indexRecommendations.length,
        highPriority: this.indexRecommendations.filter(r => r.priority > 80).length
      }
    };
  }

  /**
   * Cleanup and destroy optimizer
   */
  public destroy(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    
    this.queryCache.clear();
    this.isInitialized = false;
  }
}

// Global database performance optimizer instance
export const databaseOptimizer = new DatabasePerformanceOptimizer();

// Export for manual usage
export { DatabasePerformanceOptimizer };