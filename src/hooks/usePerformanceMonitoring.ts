/**
 * React Hook for Performance Monitoring Integration
 * 
 * Provides easy integration of performance monitoring into React components
 * with automatic lifecycle management and real-time updates.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  performanceMonitoring, 
  PerformanceMetric, 
  PerformanceAlert,
  PerformanceMetricName 
} from '@/lib/performance-monitoring';

interface UsePerformanceMonitoringOptions {
  autoStart?: boolean;
  userId?: string;
  enableRealTimeUpdates?: boolean;
  updateInterval?: number;
  onAlert?: (alert: PerformanceAlert) => void;
  onMetric?: (metric: PerformanceMetric) => void;
}

interface PerformanceMonitoringState {
  metrics: PerformanceMetric[];
  alerts: PerformanceAlert[];
  summary: {
    metrics: Record<PerformanceMetricName, { value: number; rating: string }>;
    alerts: number;
    score: number;
  };
  isInitialized: boolean;
  isLoading: boolean;
  lastUpdate: Date | null;
}

export const usePerformanceMonitoring = (options: UsePerformanceMonitoringOptions = {}) => {
  const {
    autoStart = true,
    userId,
    enableRealTimeUpdates = true,
    updateInterval = 5000, // 5 seconds
    onAlert,
    onMetric
  } = options;

  const [state, setState] = useState<PerformanceMonitoringState>({
    metrics: [],
    alerts: [],
    summary: { metrics: {}, alerts: 0, score: 0 },
    isInitialized: false,
    isLoading: false,
    lastUpdate: null
  });

  const intervalRef = useRef<NodeJS.Timeout>();
  const previousAlertsRef = useRef<PerformanceAlert[]>([]);
  const previousMetricsRef = useRef<PerformanceMetric[]>([]);

  // Initialize performance monitoring
  const initialize = useCallback(async (userIdOverride?: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      await performanceMonitoring.initialize(userIdOverride || userId);
      
      setState(prev => ({ 
        ...prev, 
        isInitialized: true, 
        isLoading: false,
        lastUpdate: new Date()
      }));
      
      console.log('Performance monitoring initialized via hook');
    } catch (error) {
      console.error('Failed to initialize performance monitoring:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [userId]);

  // Update state with current data
  const updateState = useCallback(() => {
    try {
      const metrics = performanceMonitoring.getMetrics();
      const alerts = performanceMonitoring.getAlerts();
      const summary = performanceMonitoring.getPerformanceSummary();

      setState(prev => ({
        ...prev,
        metrics,
        alerts,
        summary,
        lastUpdate: new Date()
      }));

      // Check for new alerts
      if (onAlert) {
        const newAlerts = alerts.filter(alert => 
          !previousAlertsRef.current.some(prev => 
            prev.timestamp === alert.timestamp && prev.metric === alert.metric
          )
        );
        newAlerts.forEach(onAlert);
      }

      // Check for new metrics
      if (onMetric) {
        const newMetrics = metrics.filter(metric => 
          !previousMetricsRef.current.some(prev => 
            prev.timestamp === metric.timestamp && prev.name === metric.name
          )
        );
        newMetrics.forEach(onMetric);
      }

      previousAlertsRef.current = alerts;
      previousMetricsRef.current = metrics;

    } catch (error) {
      console.error('Failed to update performance monitoring state:', error);
    }
  }, [onAlert, onMetric]);

  // Record custom metric
  const recordMetric = useCallback(async (
    name: string, 
    value: number, 
    rating: 'good' | 'needs-improvement' | 'poor' = 'good'
  ) => {
    try {
      await performanceMonitoring.recordCustomMetric(name, value, rating);
      updateState(); // Refresh state after recording
    } catch (error) {
      console.error('Failed to record custom metric:', error);
    }
  }, [updateState]);

  // Get specific metric history
  const getMetricHistory = useCallback((metricName: PerformanceMetricName, limit = 50) => {
    return state.metrics
      .filter(metric => metric.name === metricName)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }, [state.metrics]);

  // Get alerts by severity
  const getAlertsBySeverity = useCallback((severity?: 'low' | 'medium' | 'high' | 'critical') => {
    if (!severity) return state.alerts;
    return state.alerts.filter(alert => alert.severity === severity);
  }, [state.alerts]);

  // Get performance trends
  const getPerformanceTrends = useCallback((metricName: PerformanceMetricName, timeWindow = 3600000) => {
    const now = Date.now();
    const windowStart = now - timeWindow;
    
    const recentMetrics = state.metrics
      .filter(metric => 
        metric.name === metricName && 
        metric.timestamp >= windowStart
      )
      .sort((a, b) => a.timestamp - b.timestamp);

    if (recentMetrics.length < 2) {
      return { trend: 'stable', change: 0, direction: 'none' as const };
    }

    const firstHalf = recentMetrics.slice(0, Math.floor(recentMetrics.length / 2));
    const secondHalf = recentMetrics.slice(Math.floor(recentMetrics.length / 2));

    const firstAvg = firstHalf.reduce((sum, m) => sum + m.value, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, m) => sum + m.value, 0) / secondHalf.length;

    const change = ((secondAvg - firstAvg) / firstAvg) * 100;
    
    let trend: 'improving' | 'degrading' | 'stable';
    let direction: 'up' | 'down' | 'none';

    if (Math.abs(change) < 5) {
      trend = 'stable';
      direction = 'none';
    } else if (change > 0) {
      trend = 'degrading'; // Higher values are usually worse for performance
      direction = 'up';
    } else {
      trend = 'improving';
      direction = 'down';
    }

    return { trend, change: Math.abs(change), direction };
  }, [state.metrics]);

  // Check if performance is healthy
  const isPerformanceHealthy = useCallback(() => {
    const criticalAlerts = getAlertsBySeverity('critical');
    const highAlerts = getAlertsBySeverity('high');
    
    return {
      healthy: criticalAlerts.length === 0 && highAlerts.length < 3,
      score: state.summary.score,
      criticalIssues: criticalAlerts.length,
      highIssues: highAlerts.length,
      totalAlerts: state.alerts.length
    };
  }, [state.alerts, state.summary.score, getAlertsBySeverity]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    performanceMonitoring.destroy();
    setState({
      metrics: [],
      alerts: [],
      summary: { metrics: {}, alerts: 0, score: 0 },
      isInitialized: false,
      isLoading: false,
      lastUpdate: null
    });
  }, []);

  // Auto-initialize effect
  useEffect(() => {
    if (autoStart) {
      initialize();
    }

    return cleanup;
  }, [autoStart, initialize, cleanup]);

  // Real-time updates effect
  useEffect(() => {
    if (enableRealTimeUpdates && state.isInitialized) {
      // Skip timer in test environment to prevent Jest open handles
      if (typeof process !== 'undefined' && process.env.JEST_WORKER_ID) return;
      
      intervalRef.current = setInterval(updateState, updateInterval);
      
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [enableRealTimeUpdates, state.isInitialized, updateInterval, updateState]);

  // Page visibility effect - pause/resume monitoring
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && state.isInitialized) {
        updateState(); // Refresh when page becomes visible
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [state.isInitialized, updateState]);

  return {
    // State
    ...state,
    
    // Actions
    initialize,
    recordMetric,
    updateState,
    cleanup,
    
    // Computed values
    getMetricHistory,
    getAlertsBySeverity,
    getPerformanceTrends,
    isPerformanceHealthy,
    
    // Utilities
    refresh: updateState,
    isHealthy: isPerformanceHealthy().healthy,
    healthScore: state.summary.score
  };
};

export default usePerformanceMonitoring;