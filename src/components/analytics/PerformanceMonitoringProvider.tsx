/**
 * Performance Monitoring Provider Component
 * 
 * Provides performance monitoring context and automatic initialization
 * for the entire application. Should be placed high in the component tree.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePerformanceMonitoring } from '@/hooks/usePerformanceMonitoring';
import { PerformanceAlert, PerformanceMetric } from '@/lib/performance-monitoring';
import { toast } from 'sonner';

interface PerformanceMonitoringContextType {
  metrics: PerformanceMetric[];
  alerts: PerformanceAlert[];
  summary: any;
  isInitialized: boolean;
  isLoading: boolean;
  lastUpdate: Date | null;
  recordMetric: (name: string, value: number, rating?: 'good' | 'needs-improvement' | 'poor') => Promise<void>;
  refresh: () => void;
  isHealthy: boolean;
  healthScore: number;
}

const PerformanceMonitoringContext = createContext<PerformanceMonitoringContextType | null>(null);

interface PerformanceMonitoringProviderProps {
  children: React.ReactNode;
  userId?: string;
  enableToastAlerts?: boolean;
  enableConsoleLogging?: boolean;
  sampleRate?: number;
}

export const PerformanceMonitoringProvider: React.FC<PerformanceMonitoringProviderProps> = ({
  children,
  userId,
  enableToastAlerts = true,
  enableConsoleLogging = true,
  sampleRate = 1.0
}) => {
  const [alertsShown, setAlertsShown] = useState<Set<string>>(new Set());

  const performanceData = usePerformanceMonitoring({
    autoStart: true,
    userId,
    enableRealTimeUpdates: true,
    updateInterval: 10000, // 10 seconds for provider
    onAlert: (alert) => {
      const alertKey = `${alert.timestamp}-${alert.metric}-${alert.type}`;
      
      if (enableConsoleLogging) {
        console.warn('Performance Alert:', alert);
      }

      // Show toast for critical alerts (only once per alert)
      if (enableToastAlerts && alert.severity === 'critical' && !alertsShown.has(alertKey)) {
        toast.error(`Performance Alert: ${alert.metric}`, {
          description: alert.message,
          duration: 10000,
        });
        
        setAlertsShown(prev => new Set(prev).add(alertKey));
      }
    },
    onMetric: (metric) => {
      if (enableConsoleLogging && metric.rating === 'poor') {
        console.warn(`Poor performance detected - ${metric.name}: ${metric.value}ms`);
      }
    }
  });

  // Track route changes for performance monitoring
  useEffect(() => {
    const trackRouteChange = () => {
      if (performanceData.isInitialized) {
        performanceData.recordMetric('route_change', performance.now(), 'good');
      }
    };

    // Listen for route changes (works with React Router)
    window.addEventListener('popstate', trackRouteChange);
    
    // Track initial page load
    if (document.readyState === 'complete') {
      trackRouteChange();
    } else {
      window.addEventListener('load', trackRouteChange);
    }

    return () => {
      window.removeEventListener('popstate', trackRouteChange);
      window.removeEventListener('load', trackRouteChange);
    };
  }, [performanceData.isInitialized, performanceData.recordMetric]);

  // Track user interactions
  useEffect(() => {
    if (!performanceData.isInitialized) return;

    const trackInteraction = (event: Event) => {
      const startTime = performance.now();
      
      // Track interaction response time
      requestAnimationFrame(() => {
        const responseTime = performance.now() - startTime;
        performanceData.recordMetric(
          'interaction_response', 
          responseTime,
          responseTime < 16 ? 'good' : responseTime < 50 ? 'needs-improvement' : 'poor'
        );
      });
    };

    // Track clicks and key presses
    document.addEventListener('click', trackInteraction);
    document.addEventListener('keydown', trackInteraction);

    return () => {
      document.removeEventListener('click', trackInteraction);
      document.removeEventListener('keydown', trackInteraction);
    };
  }, [performanceData.isInitialized, performanceData.recordMetric]);

  // Track resource loading errors
  useEffect(() => {
    const trackResourceError = (event: ErrorEvent) => {
      if (performanceData.isInitialized) {
        performanceData.recordMetric('resource_error', 1, 'poor');
      }
    };

    window.addEventListener('error', trackResourceError);
    return () => window.removeEventListener('error', trackResourceError);
  }, [performanceData.isInitialized, performanceData.recordMetric]);

  const contextValue: PerformanceMonitoringContextType = {
    metrics: performanceData.metrics,
    alerts: performanceData.alerts,
    summary: performanceData.summary,
    isInitialized: performanceData.isInitialized,
    isLoading: performanceData.isLoading,
    lastUpdate: performanceData.lastUpdate,
    recordMetric: performanceData.recordMetric,
    refresh: performanceData.refresh,
    isHealthy: performanceData.isHealthy,
    healthScore: performanceData.healthScore
  };

  return (
    <PerformanceMonitoringContext.Provider value={contextValue}>
      {children}
    </PerformanceMonitoringContext.Provider>
  );
};

// Hook to use performance monitoring context
export const usePerformanceMonitoringContext = () => {
  const context = useContext(PerformanceMonitoringContext);
  
  if (!context) {
    throw new Error('usePerformanceMonitoringContext must be used within a PerformanceMonitoringProvider');
  }
  
  return context;
};

// Performance monitoring HOC for components
export const withPerformanceMonitoring = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
) => {
  const WithPerformanceMonitoring = (props: P) => {
    const { recordMetric, isInitialized } = usePerformanceMonitoringContext();
    const [renderTime, setRenderTime] = useState<number>(0);

    useEffect(() => {
      const startTime = performance.now();
      
      return () => {
        if (isInitialized) {
          const endTime = performance.now();
          const duration = endTime - startTime;
          setRenderTime(duration);
          
          recordMetric(
            `component_render_${componentName || WrappedComponent.name || 'unknown'}`,
            duration,
            duration < 16 ? 'good' : duration < 50 ? 'needs-improvement' : 'poor'
          );
        }
      };
    }, [isInitialized, recordMetric]);

    return <WrappedComponent {...props} />;
  };

  WithPerformanceMonitoring.displayName = `withPerformanceMonitoring(${componentName || WrappedComponent.displayName || WrappedComponent.name})`;
  
  return WithPerformanceMonitoring;
};

export default PerformanceMonitoringProvider;