/**
 * useOptimization Hook
 * 
 * React hook for interacting with the Automatic Optimization Engine
 * Provides real-time optimization data and control functions.
 */

import { useState, useEffect, useCallback } from 'react';
import { automaticOptimizationEngine } from '@/lib/optimization/automatic-optimization-engine';
import { bundleAnalyzer } from '@/lib/optimization/bundle-analyzer';
import type { 
  RouteAnalysis, 
  OptimizationOpportunity, 
  BundleAnalysisResult 
} from '@/lib/optimization/automatic-optimization-engine';

interface OptimizationState {
  isInitialized: boolean;
  isLoading: boolean;
  summary: {
    routesAnalyzed: number;
    optimizationsApplied: number;
    averageLoadTime: number;
    bundleSize: number;
    cacheStrategies: number;
    lastAnalysis: number;
  } | null;
  routeAnalytics: RouteAnalysis[];
  bundleAnalysis: BundleAnalysisResult | null;
  opportunities: OptimizationOpportunity[];
  error: string | null;
}

interface OptimizationActions {
  refresh: () => Promise<void>;
  analyzeBundleFromStats: (statsData: any) => Promise<BundleAnalysisResult | null>;
  recordCustomMetric: (name: string, value: number, rating?: 'good' | 'needs-improvement' | 'poor') => Promise<void>;
  getOptimizationSummary: () => any;
  clearError: () => void;
}

export function useOptimization(): OptimizationState & OptimizationActions {
  const [state, setState] = useState<OptimizationState>({
    isInitialized: false,
    isLoading: true,
    summary: null,
    routeAnalytics: [],
    bundleAnalysis: null,
    opportunities: [],
    error: null
  });

  // Initialize optimization engine
  useEffect(() => {
    const initializeEngine = async () => {
      try {
        await automaticOptimizationEngine.initialize();
        setState(prev => ({ ...prev, isInitialized: true }));
        
        // Load initial data
        await loadOptimizationData();
      } catch (error) {
        console.error('Failed to initialize optimization engine:', error);
        setState(prev => ({ 
          ...prev, 
          error: `Failed to initialize: ${error}`,
          isLoading: false 
        }));
      }
    };

    initializeEngine();

    // Cleanup on unmount
    return () => {
      automaticOptimizationEngine.destroy();
    };
  }, []);

  // Load optimization data
  const loadOptimizationData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Get optimization engine data
      const summary = automaticOptimizationEngine.getOptimizationSummary();
      const routeAnalytics = automaticOptimizationEngine.getRouteAnalytics();
      const opportunities = automaticOptimizationEngine.getOptimizationOpportunities();

      // Get bundle analysis (with fallback)
      let bundleAnalysis: BundleAnalysisResult | null = null;
      try {
        bundleAnalysis = await bundleAnalyzer.analyzeBundleFromRuntime();
      } catch (error) {
        console.warn('Bundle analysis failed:', error);
        // Don't treat this as a critical error
      }

      setState(prev => ({
        ...prev,
        summary,
        routeAnalytics,
        bundleAnalysis,
        opportunities,
        isLoading: false,
        error: null
      }));

    } catch (error) {
      console.error('Failed to load optimization data:', error);
      setState(prev => ({ 
        ...prev, 
        error: `Failed to load data: ${error}`,
        isLoading: false 
      }));
    }
  }, []);

  // Refresh optimization data
  const refresh = useCallback(async () => {
    await loadOptimizationData();
  }, [loadOptimizationData]);

  // Analyze bundle from build stats
  const analyzeBundleFromStats = useCallback(async (statsData: any): Promise<BundleAnalysisResult | null> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const result = await bundleAnalyzer.analyzeBundleFromStats(statsData);
      
      setState(prev => ({ 
        ...prev, 
        bundleAnalysis: result,
        isLoading: false 
      }));
      
      return result;
    } catch (error) {
      console.error('Bundle analysis from stats failed:', error);
      setState(prev => ({ 
        ...prev, 
        error: `Bundle analysis failed: ${error}`,
        isLoading: false 
      }));
      return null;
    }
  }, []);

  // Record custom performance metric
  const recordCustomMetric = useCallback(async (
    name: string, 
    value: number, 
    rating: 'good' | 'needs-improvement' | 'poor' = 'good'
  ) => {
    try {
      // This would typically be handled by the performance monitoring system
      // For now, we'll just log it
      console.log(`Custom metric recorded: ${name} = ${value} (${rating})`);
      
      // Optionally refresh data to see the impact
      await loadOptimizationData();
    } catch (error) {
      console.error('Failed to record custom metric:', error);
      setState(prev => ({ 
        ...prev, 
        error: `Failed to record metric: ${error}` 
      }));
    }
  }, [loadOptimizationData]);

  // Get optimization summary
  const getOptimizationSummary = useCallback(() => {
    return automaticOptimizationEngine.getOptimizationSummary();
  }, []);

  // Clear error state
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Auto-refresh data periodically
  useEffect(() => {
    if (!state.isInitialized) return;
    
    // Skip timer in test environment to prevent Jest open handles
    if (typeof process !== 'undefined' && process.env.JEST_WORKER_ID) return;

    const interval = setInterval(() => {
      loadOptimizationData();
    }, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, [state.isInitialized, loadOptimizationData]);

  return {
    ...state,
    refresh,
    analyzeBundleFromStats,
    recordCustomMetric,
    getOptimizationSummary,
    clearError
  };
}

// Hook for route-specific optimization data
export function useRouteOptimization(routePath?: string) {
  const { routeAnalytics, opportunities } = useOptimization();
  
  const routeData = routeAnalytics.find(route => route.path === routePath);
  const routeOpportunities = opportunities.filter(opp => 
    opp.implementation.includes(routePath || '')
  );

  return {
    routeData,
    routeOpportunities,
    hasOptimizations: routeOpportunities.length > 0,
    loadTime: routeData?.loadTime || 0,
    bundleSize: routeData?.bundleSize || 0,
    priority: routeData?.priority || 'low'
  };
}

// Hook for bundle optimization data
export function useBundleOptimization() {
  const { bundleAnalysis, isLoading, error } = useOptimization();
  
  const bundleSummary = bundleAnalysis ? {
    score: bundleAnalysis.score,
    totalSize: bundleAnalysis.stats.totalSize,
    chunksCount: bundleAnalysis.stats.chunks.length,
    issuesCount: bundleAnalysis.issues.length,
    recommendationsCount: bundleAnalysis.recommendations.length,
    potentialSavings: bundleAnalysis.recommendations.reduce(
      (sum, rec) => sum + rec.estimatedImprovement, 0
    )
  } : null;

  return {
    bundleAnalysis,
    bundleSummary,
    isLoading,
    error,
    hasIssues: (bundleAnalysis?.issues.length || 0) > 0,
    hasRecommendations: (bundleAnalysis?.recommendations.length || 0) > 0
  };
}

// Hook for optimization opportunities
export function useOptimizationOpportunities(filterBy?: {
  type?: string;
  impact?: string;
  effort?: string;
}) {
  const { opportunities } = useOptimization();
  
  const filteredOpportunities = opportunities.filter(opp => {
    if (filterBy?.type && opp.type !== filterBy.type) return false;
    if (filterBy?.impact && opp.impact !== filterBy.impact) return false;
    if (filterBy?.effort && opp.effort !== filterBy.effort) return false;
    return true;
  });

  const opportunitiesByType = opportunities.reduce((acc, opp) => {
    acc[opp.type] = (acc[opp.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const opportunitiesByImpact = opportunities.reduce((acc, opp) => {
    acc[opp.impact] = (acc[opp.impact] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    opportunities: filteredOpportunities,
    totalOpportunities: opportunities.length,
    opportunitiesByType,
    opportunitiesByImpact,
    highImpactCount: opportunities.filter(opp => opp.impact === 'high').length,
    lowEffortCount: opportunities.filter(opp => opp.effort === 'low').length,
    quickWins: opportunities.filter(opp => 
      opp.impact === 'high' && opp.effort === 'low'
    ).length
  };
}