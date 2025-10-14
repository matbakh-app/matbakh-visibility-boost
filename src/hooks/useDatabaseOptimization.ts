/**
 * Database Optimization Hook
 * 
 * This hook provides React integration for database optimization features including:
 * - Performance monitoring and metrics
 * - Connection pool status and management
 * - Query cache statistics and control
 * - Index optimization recommendations
 * - Real-time alerts and notifications
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getDatabasePerformanceSummary,
  getAllPerformanceAlerts,
  getOptimizationRecommendations,
  executeOptimizedQuery,
  invalidateTableCache,
  initializeDatabaseOptimization,
  shutdownDatabaseOptimization,
  type DatabasePerformanceAlert,
  type IndexRecommendation
} from '@/lib/database';

// Helper for safe number extraction
const num = (v: any, d = 0) => (typeof v === 'number' && !Number.isNaN(v) ? v : d);

interface DatabaseOptimizationState {
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  lastUpdate: Date | null;

  // Performance data
  performanceSummary: any | null;
  alerts: {
    database: DatabasePerformanceAlert[];
    connectionPool: any[];
    indexOptimizer: IndexRecommendation[];
  } | null;
  recommendations: {
    indexes: IndexRecommendation[];
    queries: any[];
    connectionPool: any;
  } | null;

  // Real-time metrics
  metrics: {
    queryCount: number;
    averageResponseTime: number;
    cacheHitRatio: number;
    connectionPoolUtilization: number;
    activeAlerts: number;
  };
}

interface DatabaseOptimizationOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  enableRealTimeMetrics?: boolean;
  onAlert?: (alert: DatabasePerformanceAlert) => void;
  onRecommendation?: (recommendation: IndexRecommendation) => void;
}

export function useDatabaseOptimization(options: DatabaseOptimizationOptions = {}) {
  const {
    autoRefresh = true,
    refreshInterval = 30000, // 30 seconds
    enableRealTimeMetrics = true,
    onAlert,
    onRecommendation
  } = options;

  const [state, setState] = useState<DatabaseOptimizationState>({
    isInitialized: false,
    isLoading: true,
    error: null,
    lastUpdate: null,
    performanceSummary: null,
    alerts: null,
    recommendations: null,
    metrics: {
      queryCount: 0,
      averageResponseTime: 0,
      cacheHitRatio: 0,
      connectionPoolUtilization: 0,
      activeAlerts: 0
    }
  });

  const refreshIntervalRef = useRef<NodeJS.Timeout>();
  const metricsIntervalRef = useRef<NodeJS.Timeout>();
  const previousAlertsRef = useRef<DatabasePerformanceAlert[]>([]);
  const previousRecommendationsRef = useRef<IndexRecommendation[]>([]);

  // Initialize database optimization
  const initialize = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      await initializeDatabaseOptimization();

      setState(prev => ({
        ...prev,
        isInitialized: true,
        isLoading: false,
        lastUpdate: new Date()
      }));

    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to initialize database optimization'
      }));
    }
  }, []);

  // Load performance data
  const loadPerformanceData = useCallback(async () => {
    if (!state.isInitialized) return;

    try {
      const [perfSummary, alertData, recData] = await Promise.all([
        getDatabasePerformanceSummary(),
        getAllPerformanceAlerts(),
        getOptimizationRecommendations()
      ]);

      // Helper function to safely convert to number
      const num = (val: any) => typeof val === 'number' ? val : 0;

      // be tolerant: accept either { performance: {...} } or a flat object
      const p = (perfSummary && (perfSummary.performance ?? perfSummary)) || {};
      const qp = p.queryPerformance ?? {};
      const cache = p.cache ?? {};
      const pool = p.connectionPool ?? {};

      const unresolvedAlerts =
        (alertData?.database?.filter(a => !a.resolved).length) ?? 0;

      const nextMetrics = {
        queryCount: num(qp.totalQueries),
        averageResponseTime: num(qp.averageExecutionTimeMs),
        cacheHitRatio: num(cache.hitRatio),
        connectionPoolUtilization: num(pool.utilization),
        activeAlerts: unresolvedAlerts
      };

      setState(prev => ({
        ...prev,
        performanceSummary: perfSummary,
        alerts: alertData,
        recommendations: recData,
        metrics: nextMetrics,          // <-- set immediately
        lastUpdate: new Date(),
        error: null
      }));

      // keep your onAlert/onRecommendation callbacks as-is,
      // but ensure you call them with exactly one argument each
      if (onAlert && alertData?.database) {
        const fresh = alertData.database.filter(a =>
          !previousAlertsRef.current.some(p => p.timestamp === a.timestamp)
        );
        fresh.forEach(a => onAlert(a));
        previousAlertsRef.current = alertData.database;
      }

      if (onRecommendation && recData?.indexes) {
        const fresh = recData.indexes.filter(r =>
          !previousRecommendationsRef.current.some(p => p.id === r.id)
        );
        fresh.forEach(r => onRecommendation(r));
        previousRecommendationsRef.current = recData.indexes;
      }

    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load performance data'
      }));
    }
  }, [state.isInitialized, onAlert, onRecommendation]);

  // Update real-time metrics
  const updateMetrics = useCallback(() => {
    if (!state.performanceSummary) return;

    // Helper function to safely convert to number
    const num = (val: any) => typeof val === 'number' ? val : 0;

    const perf = state.performanceSummary.performance ?? state.performanceSummary ?? {};
    const qp = perf.queryPerformance ?? {};
    const cache = perf.cache ?? {};
    const pool = perf.connectionPool ?? {};

    const unresolved =
      state.alerts?.database?.filter(a => !a.resolved).length ?? 0;

    setState(prev => ({
      ...prev,
      metrics: {
        queryCount: num(qp.totalQueries),
        averageResponseTime: num(qp.averageExecutionTimeMs),
        cacheHitRatio: num(cache.hitRatio),
        connectionPoolUtilization: num(pool.utilization),
        activeAlerts: unresolved
      }
    }));
  }, [state.performanceSummary, state.alerts]);

  // Execute optimized query with monitoring
  const executeQuery = useCallback(async <T>(
    query: string,
    params: any[] = [],
    options: {
      useCache?: boolean;
      cacheKey?: string;
      cacheTtlSeconds?: number;
      timeout?: number;
      retries?: number;
    } = {}
  ): Promise<T> => {
    if (!state.isInitialized) {
      throw new Error('Database optimization not initialized');
    }

    return executeOptimizedQuery<T>(query, params, options);
  }, [state.isInitialized]);

  // Invalidate cache for table
  const invalidateCache = useCallback(async (
    tableName: string,
    operation: 'insert' | 'update' | 'delete'
  ) => {
    if (!state.isInitialized) {
      throw new Error('Database optimization not initialized');
    }

    await invalidateTableCache(tableName, operation);
  }, [state.isInitialized]);

  // Refresh data manually
  const refresh = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    await loadPerformanceData();
    setState(prev => ({ ...prev, isLoading: false }));
  }, [loadPerformanceData]);

  // Get performance status
  const getPerformanceStatus = useCallback(() => {
    // Return 'unknown' until first successful load
    if (!state.performanceSummary && !state.lastUpdate) {
      return 'unknown';
    }

    // Helper function to safely convert to number
    const num = (val: any) => typeof val === 'number' ? val : 0;

    // prefer summary if available
    if (state.performanceSummary) {
      const perf = state.performanceSummary.performance ?? state.performanceSummary ?? {};
      const qp = perf.queryPerformance ?? {};
      const cache = perf.cache ?? {};
      const pool = perf.connectionPool ?? {};

      const criticalAlerts = state.alerts?.database?.filter(
        a => a.severity === 'critical' && !a.resolved
      ).length ?? 0;
      if (criticalAlerts > 0) return 'critical';

      const slowPct = num(qp.slowQueryPercentage);
      const hit = num(cache.hitRatio);
      const util = num(pool.utilization);



      if (slowPct > 20 || hit < 50 || util > 90) return 'warning';
      if (slowPct < 5 && hit > 80 && util < 70) return 'excellent';
      return 'good';
    }

    // fallback to current metrics snapshot
    const m = state.metrics;
    if (!m) return 'unknown';
    const { cacheHitRatio: hit, connectionPoolUtilization: util } = m;



    // no slow% in metrics snapshot → assume mid case
    if (hit < 50 || util > 90) return 'warning';
    if (hit > 80 && util < 70) return 'excellent';
    return 'good';
  }, [state.performanceSummary, state.alerts, state.metrics]);

  // Get optimization score
  const getOptimizationScore = useCallback(() => {
    // Helper function to safely convert to number
    const num = (val: any) => typeof val === 'number' ? val : 0;

    const activeAlerts = state.alerts?.database?.filter(a => !a.resolved).length ?? 0;

    if (state.performanceSummary) {
      const perf = state.performanceSummary.performance ?? state.performanceSummary ?? {};
      const qp = perf.queryPerformance ?? {};
      const cache = perf.cache ?? {};
      const pool = perf.connectionPool ?? {};

      let score = 100;
      const slowPct = num(qp.slowQueryPercentage);
      const hit = num(cache.hitRatio);
      const util = num(pool.utilization);

      score -= slowPct * 2;
      if (hit < 80) score -= (80 - hit);
      if (util > 80) score -= (util - 80);
      score -= activeAlerts * 5;

      return Math.max(0, Math.min(100, Math.round(score)));
    }

    // fallback: approximate from metrics only
    const m = state.metrics;
    if (!m) return 0;

    let score = 100;
    const hit = num(m.cacheHitRatio);
    const util = num(m.connectionPoolUtilization);
    if (hit < 80) score -= (80 - hit);
    if (util > 80) score -= (util - 80);
    score -= activeAlerts * 5;

    return Math.max(0, Math.min(100, Math.round(score)));
  }, [state.performanceSummary, state.alerts, state.metrics]);

  // Initialize on mount
  useEffect(() => {
    initialize();

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      if (metricsIntervalRef.current) {
        clearInterval(metricsIntervalRef.current);
      }

      // Cleanup on unmount - defensive shutdown handling
      try {
        if (typeof shutdownDatabaseOptimization === 'function') {
          const maybePromise = shutdownDatabaseOptimization();
          if (maybePromise && typeof (maybePromise as any).catch === "function") {
            (maybePromise as Promise<void>).catch(console.error);
          }
        }
      } catch (error) {
        console.error('Error during database optimization shutdown:', error);
      }
    };
  }, [initialize]);

  // Set up auto-refresh
  useEffect(() => {
    if (!autoRefresh || !state.isInitialized) return;

    refreshIntervalRef.current = setInterval(loadPerformanceData, refreshInterval);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, state.isInitialized, loadPerformanceData]);

  // Set up real-time metrics updates
  useEffect(() => {
    if (!enableRealTimeMetrics) return;

    metricsIntervalRef.current = setInterval(updateMetrics, 5000); // Update every 5 seconds

    return () => {
      if (metricsIntervalRef.current) {
        clearInterval(metricsIntervalRef.current);
      }
    };
  }, [enableRealTimeMetrics, updateMetrics]);

  // Load initial data after initialization
  useEffect(() => {
    if (state.isInitialized && !state.performanceSummary) {
      loadPerformanceData();
    }
  }, [state.isInitialized, state.performanceSummary, loadPerformanceData]);

  return {
    // State
    isInitialized: state.isInitialized,
    isLoading: state.isLoading,
    error: state.error,
    lastUpdate: state.lastUpdate,

    // Data
    performanceSummary: state.performanceSummary,
    alerts: state.alerts,
    recommendations: state.recommendations,
    metrics: state.metrics,

    // Computed values
    performanceStatus: getPerformanceStatus(),
    optimizationScore: getOptimizationScore(),

    // Actions
    initialize,
    refresh,
    executeQuery,
    invalidateCache,

    // Utilities
    formatDuration: (ms: number) => {
      if (ms < 1000) return `${ms}ms`;
      if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
      return `${(ms / 60000).toFixed(1)}m`;
    },

    formatBytes: (bytes: number) => {
      if (bytes < 1024) return `${bytes}B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
    }
  };
}

// Hook for simple database performance monitoring
export function useDatabasePerformance() {
  const [metrics, setMetrics] = useState({
    queryCount: 0,
    averageResponseTime: 0,
    cacheHitRatio: 0,
    connectionPoolUtilization: 0,
    activeAlerts: 0,
    optimizationScore: 0
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const summary = await getDatabasePerformanceSummary();
        const alerts = await getAllPerformanceAlerts();

        // Use the same tolerant extraction as the main hook
        const num = (val: any) => typeof val === 'number' ? val : 0;
        const perf = summary?.performance ?? summary ?? {};
        const qp = perf.queryPerformance ?? {};
        const cache = perf.cache ?? {};
        const pool = perf.connectionPool ?? {};

        const activeAlerts = alerts?.database?.filter((a: DatabasePerformanceAlert) => !a.resolved).length ?? 0;

        let score = 100;
        const slowPct = num(qp.slowQueryPercentage);
        const hit = num(cache.hitRatio);
        const util = num(pool.utilization);

        score -= slowPct * 2;
        if (hit < 80) score -= (80 - hit);
        if (util > 80) score -= (util - 80);
        score -= activeAlerts * 5;

        setMetrics({
          queryCount: num(qp.totalQueries),
          averageResponseTime: num(qp.averageExecutionTimeMs),
          cacheHitRatio: hit,
          connectionPoolUtilization: util,
          activeAlerts,
          optimizationScore: Math.max(0, Math.min(100, Math.round(score)))
        });

      } catch (error) {
        console.error('Failed to load database performance metrics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMetrics();
    const interval = setInterval(loadMetrics, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return { metrics, isLoading };
}