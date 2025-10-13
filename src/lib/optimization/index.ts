/**
 * Optimization Module Index
 * 
 * Exports all optimization-related functionality including:
 * - Automatic Optimization Engine
 * - Bundle Analyzer
 * - Types and interfaces
 */

// Main optimization engine
export { 
  automaticOptimizationEngine,
  AutomaticOptimizationEngine 
} from './automatic-optimization-engine';

// Bundle analyzer
export { 
  bundleAnalyzer,
  BundleAnalyzer 
} from './bundle-analyzer';

// Types from automatic optimization engine
export type {
  OptimizationConfig,
  RouteAnalysis,
  OptimizationOpportunity,
  BundleAnalysis,
  ChunkAnalysis,
  CacheStrategy,
  OptimizationResult
} from './automatic-optimization-engine';

// Types from bundle analyzer
export type {
  ModuleInfo,
  ModuleReason,
  ChunkInfo,
  BundleStats,
  AssetInfo,
  EntrypointInfo,
  DuplicatedModule,
  CircularDependency,
  BundleAnalysisResult,
  BundleIssue
} from './bundle-analyzer';

// Re-export React components and hooks
export { default as OptimizationDashboard } from '../../components/optimization/OptimizationDashboard';
export { 
  useOptimization,
  useRouteOptimization,
  useBundleOptimization,
  useOptimizationOpportunities
} from '../../hooks/useOptimization';

// Utility functions
export const optimizationUtils = {
  /**
   * Initialize optimization engine with custom config
   */
  async initializeWithConfig(config: Partial<any>) {
    const engine = new AutomaticOptimizationEngine(config);
    await engine.initialize();
    return engine;
  },

  /**
   * Get optimization recommendations for a specific route
   */
  getRouteRecommendations(routePath: string) {
    const analytics = automaticOptimizationEngine.getRouteAnalytics();
    const route = analytics.find(r => r.path === routePath);
    return route?.optimizationOpportunities || [];
  },

  /**
   * Calculate potential performance improvement
   */
  calculatePotentialImprovement(opportunities: any[]) {
    return opportunities.reduce((sum, opp) => sum + opp.estimatedImprovement, 0);
  },

  /**
   * Get optimization priority score
   */
  getOptimizationPriority(opportunity: any) {
    const impactScore = { high: 3, medium: 2, low: 1 };
    const effortScore = { low: 3, medium: 2, high: 1 };
    
    return (impactScore[opportunity.impact] || 1) + (effortScore[opportunity.effort] || 1);
  },

  /**
   * Format bundle size for display
   */
  formatBundleSize(sizeInKB: number) {
    if (sizeInKB < 1024) {
      return `${sizeInKB.toFixed(1)}KB`;
    }
    return `${(sizeInKB / 1024).toFixed(1)}MB`;
  },

  /**
   * Get performance rating based on metrics
   */
  getPerformanceRating(loadTime: number, bundleSize: number) {
    let score = 100;
    
    // Deduct points for slow load time
    if (loadTime > 3000) score -= 30;
    else if (loadTime > 2000) score -= 20;
    else if (loadTime > 1000) score -= 10;
    
    // Deduct points for large bundle
    if (bundleSize > 1000) score -= 25;
    else if (bundleSize > 500) score -= 15;
    else if (bundleSize > 250) score -= 5;
    
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'fair';
    return 'poor';
  }
};

// Constants
export const OPTIMIZATION_CONSTANTS = {
  // Performance thresholds
  LOAD_TIME_THRESHOLDS: {
    EXCELLENT: 1000,
    GOOD: 2000,
    FAIR: 3000
  },
  
  // Bundle size thresholds (KB)
  BUNDLE_SIZE_THRESHOLDS: {
    SMALL: 250,
    MEDIUM: 500,
    LARGE: 1000
  },
  
  // Cache strategies
  CACHE_STRATEGIES: {
    STATIC_ASSETS: 'static-assets',
    API_RESPONSES: 'api-responses',
    HTML_PAGES: 'html-pages',
    DYNAMIC_CONTENT: 'dynamic-content'
  },
  
  // Optimization types
  OPTIMIZATION_TYPES: {
    CODE_SPLITTING: 'code_splitting',
    LAZY_LOADING: 'lazy_loading',
    BUNDLE_REDUCTION: 'bundle_reduction',
    CACHING: 'caching',
    PRELOADING: 'preloading'
  },
  
  // Impact levels
  IMPACT_LEVELS: {
    HIGH: 'high',
    MEDIUM: 'medium',
    LOW: 'low'
  },
  
  // Effort levels
  EFFORT_LEVELS: {
    HIGH: 'high',
    MEDIUM: 'medium',
    LOW: 'low'
  }
} as const;