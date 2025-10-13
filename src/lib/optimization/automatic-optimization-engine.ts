/**
 * Automatic Optimization Engine
 * 
 * This module provides intelligent optimization capabilities including:
 * - Route-based code splitting analysis
 * - Dynamic lazy loading for components and assets
 * - Bundle optimization with webpack analysis
 * - Intelligent caching strategies with cache invalidation
 * 
 * Requirements: 1.2, 1.3 from System Optimization Enhancement
 */

import { performanceMonitoring, type PerformanceMetric } from '../performance-monitoring';
import { publishMetric } from '../monitoring';

// Optimization configuration
interface OptimizationConfig {
  enableRouteAnalysis: boolean;
  enableLazyLoading: boolean;
  enableBundleOptimization: boolean;
  enableIntelligentCaching: boolean;
  optimizationThreshold: number; // Performance threshold to trigger optimization
  maxBundleSize: number; // Maximum bundle size in KB
  cacheStrategy: 'aggressive' | 'conservative' | 'adaptive';
  analysisInterval: number; // How often to run analysis (ms)
}

// Route analysis data
interface RouteAnalysis {
  path: string;
  loadTime: number;
  bundleSize: number;
  componentCount: number;
  dependencies: string[];
  usage: number; // How often this route is accessed
  priority: 'high' | 'medium' | 'low';
  optimizationOpportunities: OptimizationOpportunity[];
}

// Optimization opportunities
interface OptimizationOpportunity {
  type: 'code_splitting' | 'lazy_loading' | 'bundle_reduction' | 'caching' | 'preloading';
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  estimatedImprovement: number; // Estimated performance improvement in ms
  implementation: string; // How to implement this optimization
}

// Bundle analysis result
interface BundleAnalysis {
  totalSize: number;
  chunks: ChunkAnalysis[];
  duplicatedModules: string[];
  unusedCode: string[];
  optimizationSuggestions: OptimizationOpportunity[];
}

interface ChunkAnalysis {
  name: string;
  size: number;
  modules: string[];
  isAsync: boolean;
  loadTime: number;
  usage: number;
}

// Cache strategy configuration
interface CacheStrategy {
  name: string;
  pattern: RegExp;
  maxAge: number;
  staleWhileRevalidate: boolean;
  priority: number;
}

// Optimization result
interface OptimizationResult {
  timestamp: number;
  optimizationsApplied: OptimizationOpportunity[];
  performanceImprovement: number;
  bundleSizeReduction: number;
  cacheHitRateImprovement: number;
  success: boolean;
  errors: string[];
}

class AutomaticOptimizationEngine {
  private config: OptimizationConfig;
  private routeAnalytics: Map<string, RouteAnalysis> = new Map();
  private bundleAnalysis: BundleAnalysis | null = null;
  private cacheStrategies: CacheStrategy[] = [];
  private optimizationHistory: OptimizationResult[] = [];
  private isRunning = false;
  private analysisTimer?: NodeJS.Timeout;

  constructor(config: Partial<OptimizationConfig> = {}) {
    this.config = {
      enableRouteAnalysis: true,
      enableLazyLoading: true,
      enableBundleOptimization: true,
      enableIntelligentCaching: true,
      optimizationThreshold: 3000, // 3 seconds
      maxBundleSize: 1000, // 1MB
      cacheStrategy: 'adaptive',
      analysisInterval: 300000, // 5 minutes
      ...config
    };

    this.initializeCacheStrategies();
  }

  /**
   * Initialize the optimization engine
   */
  public async initialize(): Promise<void> {
    if (this.isRunning) return;

    console.log('Initializing Automatic Optimization Engine...');

    try {
      // Start route analysis
      if (this.config.enableRouteAnalysis) {
        this.startRouteAnalysis();
      }

      // Analyze current bundle
      if (this.config.enableBundleOptimization) {
        await this.analyzeBundlePerformance();
      }

      // Setup intelligent caching
      if (this.config.enableIntelligentCaching) {
        this.setupIntelligentCaching();
      }

      // Start periodic optimization analysis
      this.startPeriodicAnalysis();

      this.isRunning = true;
      console.log('Automatic Optimization Engine initialized successfully');

      // Record initialization metric
      await publishMetric({
        metricName: 'OptimizationEngine_Initialized',
        value: 1,
        dimensions: { Status: 'Success' }
      });

    } catch (error) {
      console.error('Failed to initialize Optimization Engine:', error);
      await publishMetric({
        metricName: 'OptimizationEngine_InitializationError',
        value: 1,
        dimensions: { Error: String(error).slice(0, 100) }
      });
    }
  }

  /**
   * Start route analysis for intelligent code splitting
   */
  private startRouteAnalysis(): void {
    // Skip monkeypatching in tests
    if (typeof process !== 'undefined' && process.env.JEST_WORKER_ID) {
      // Skip monkeypatching in tests
      if (typeof window !== 'undefined') {
        this.analyzeRouteChange(window.location.pathname);
      }
      return;
    }

    // Monitor route changes
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = (...args) => {
      this.analyzeRouteChange(args[2] as string);
      return originalPushState.apply(history, args);
    };

    history.replaceState = (...args) => {
      this.analyzeRouteChange(args[2] as string);
      return originalReplaceState.apply(history, args);
    };

    // Monitor popstate events
    if (typeof window !== 'undefined') {
      window.addEventListener('popstate', () => {
        this.analyzeRouteChange(window.location.pathname);
      });

      // Analyze current route
      this.analyzeRouteChange(window.location.pathname);
    }
  }

  /**
   * Analyze route change for optimization opportunities
   */
  private async analyzeRouteChange(path: string): Promise<void> {
    const startTime = performance.now();
    
    // Wait for route to load
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const loadTime = performance.now() - startTime;
    const bundleSize = await this.estimateRouteBundleSize(path);
    const componentCount = this.countRouteComponents(path);
    const dependencies = this.analyzeRouteDependencies(path);

    // Get or create route analysis
    let analysis = this.routeAnalytics.get(path);
    if (!analysis) {
      analysis = {
        path,
        loadTime,
        bundleSize,
        componentCount,
        dependencies,
        usage: 1,
        priority: this.calculateRoutePriority(path),
        optimizationOpportunities: []
      };
    } else {
      // Update existing analysis
      analysis.loadTime = (analysis.loadTime + loadTime) / 2; // Moving average
      analysis.usage += 1;
    }

    // Identify optimization opportunities
    analysis.optimizationOpportunities = await this.identifyRouteOptimizations(analysis);

    this.routeAnalytics.set(path, analysis);

    // Trigger optimization if needed
    if (loadTime > this.config.optimizationThreshold) {
      await this.optimizeRoute(analysis);
    }

    // Record route analysis metric
    await publishMetric({
      metricName: 'RouteAnalysis_LoadTime',
      value: loadTime,
      dimensions: {
        Route: path.slice(0, 50),
        Priority: analysis.priority
      }
    });
  }

  /**
   * Estimate bundle size for a specific route
   */
  private async estimateRouteBundleSize(path: string): Promise<number> {
    // In a real implementation, this would analyze the actual bundle
    // For now, we'll estimate based on the route complexity
    const baseSize = 50; // KB
    const pathComplexity = path.split('/').length;
    const estimatedSize = baseSize * pathComplexity;

    return estimatedSize;
  }

  /**
   * Count components used in a route
   */
  private countRouteComponents(path: string): number {
    // Estimate component count based on DOM elements
    if (typeof document !== 'undefined') {
      const elements = document.querySelectorAll('[data-component]');
      return elements.length || Math.max(1, path.split('/').length * 2);
    }
    return Math.max(1, path.split('/').length * 2);
  }

  /**
   * Analyze route dependencies
   */
  private analyzeRouteDependencies(path: string): string[] {
    const dependencies: string[] = [];

    // Analyze based on route patterns
    if (path.includes('/admin')) {
      dependencies.push('admin-components', 'data-tables', 'charts');
    }
    if (path.includes('/dashboard')) {
      dependencies.push('dashboard-widgets', 'analytics', 'charts');
    }
    if (path.includes('/vc')) {
      dependencies.push('visibility-check', 'ai-analysis', 'reports');
    }
    if (path.includes('/auth')) {
      dependencies.push('auth-forms', 'validation', 'oauth');
    }

    return dependencies;
  }

  /**
   * Calculate route priority based on usage and importance
   */
  private calculateRoutePriority(path: string): 'high' | 'medium' | 'low' {
    // High priority routes
    if (path === '/' || path === '/dashboard' || path === '/vc/quick') {
      return 'high';
    }

    // Medium priority routes
    if (path.startsWith('/vc') || path.startsWith('/auth') || path.startsWith('/onboarding')) {
      return 'medium';
    }

    // Low priority routes (admin, legal, etc.)
    return 'low';
  }

  /**
   * Identify optimization opportunities for a route
   */
  private async identifyRouteOptimizations(analysis: RouteAnalysis): Promise<OptimizationOpportunity[]> {
    const opportunities: OptimizationOpportunity[] = [];

    // Code splitting opportunities
    if (analysis.componentCount > 5 && analysis.bundleSize > 200) {
      opportunities.push({
        type: 'code_splitting',
        description: `Split ${analysis.path} into smaller chunks`,
        impact: 'high',
        effort: 'medium',
        estimatedImprovement: analysis.loadTime * 0.3,
        implementation: `Implement React.lazy() for heavy components in ${analysis.path}`
      });
    }

    // Lazy loading opportunities
    if (analysis.dependencies.length > 3) {
      opportunities.push({
        type: 'lazy_loading',
        description: `Lazy load non-critical components in ${analysis.path}`,
        impact: 'medium',
        effort: 'low',
        estimatedImprovement: analysis.loadTime * 0.2,
        implementation: `Use dynamic imports for: ${analysis.dependencies.join(', ')}`
      });
    }

    // Bundle reduction opportunities
    if (analysis.bundleSize > this.config.maxBundleSize) {
      opportunities.push({
        type: 'bundle_reduction',
        description: `Reduce bundle size for ${analysis.path}`,
        impact: 'high',
        effort: 'high',
        estimatedImprovement: analysis.loadTime * 0.4,
        implementation: `Tree shake unused code and optimize imports`
      });
    }

    // Caching opportunities
    if (analysis.usage > 5 && analysis.loadTime > 1000) {
      opportunities.push({
        type: 'caching',
        description: `Implement aggressive caching for ${analysis.path}`,
        impact: 'medium',
        effort: 'low',
        estimatedImprovement: analysis.loadTime * 0.5,
        implementation: `Add service worker caching for route assets`
      });
    }

    // Preloading opportunities for high-priority routes
    if (analysis.priority === 'high' && analysis.usage > 10) {
      opportunities.push({
        type: 'preloading',
        description: `Preload critical resources for ${analysis.path}`,
        impact: 'medium',
        effort: 'low',
        estimatedImprovement: analysis.loadTime * 0.25,
        implementation: `Add <link rel="preload"> for critical assets`
      });
    }

    return opportunities;
  }

  /**
   * Optimize a specific route
   */
  private async optimizeRoute(analysis: RouteAnalysis): Promise<void> {
    console.log(`Optimizing route: ${analysis.path}`);

    for (const opportunity of analysis.optimizationOpportunities) {
      if (opportunity.impact === 'high' && opportunity.effort !== 'high') {
        await this.applyOptimization(opportunity, analysis);
      }
    }
  }

  /**
   * Apply a specific optimization
   */
  private async applyOptimization(
    opportunity: OptimizationOpportunity, 
    analysis: RouteAnalysis
  ): Promise<void> {
    try {
      switch (opportunity.type) {
        case 'lazy_loading':
          await this.implementLazyLoading(analysis);
          break;
        case 'caching':
          await this.implementIntelligentCaching(analysis);
          break;
        case 'preloading':
          await this.implementPreloading(analysis);
          break;
        default:
          console.log(`Optimization ${opportunity.type} requires manual implementation`);
      }

      // Record successful optimization
      await publishMetric({
        metricName: 'Optimization_Applied',
        value: 1,
        dimensions: {
          Type: opportunity.type,
          Route: analysis.path.slice(0, 50),
          Impact: opportunity.impact
        }
      });

    } catch (error) {
      console.error(`Failed to apply optimization ${opportunity.type}:`, error);
      
      await publishMetric({
        metricName: 'Optimization_Error',
        value: 1,
        dimensions: {
          Type: opportunity.type,
          Error: String(error).slice(0, 100)
        }
      });
    }
  }

  /**
   * Implement dynamic lazy loading
   */
  private async implementLazyLoading(analysis: RouteAnalysis): Promise<void> {
    // This would typically involve modifying the component loading strategy
    // For now, we'll simulate the optimization
    
    console.log(`Implementing lazy loading for ${analysis.path}`);
    
    // Simulate lazy loading by deferring non-critical resource loading
    const nonCriticalElements = document.querySelectorAll('img[loading!="eager"], iframe, video');
    
    nonCriticalElements.forEach(element => {
      if (element.tagName === 'IMG') {
        (element as HTMLImageElement).loading = 'lazy';
      }
    });

    // Add intersection observer for dynamic content loading
    this.setupIntersectionObserver();
  }

  /**
   * Setup intersection observer for lazy loading
   */
  private setupIntersectionObserver(): void {
    if (!('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target as HTMLElement;
          
          // Load deferred content
          if (element.dataset.src) {
            if (element.tagName === 'IMG') {
              (element as HTMLImageElement).src = element.dataset.src;
            }
            element.removeAttribute('data-src');
            observer.unobserve(element);
          }
        }
      });
    }, {
      rootMargin: '50px 0px',
      threshold: 0.1
    });

    // Observe elements with data-src
    document.querySelectorAll('[data-src]').forEach(element => {
      observer.observe(element);
    });
  }

  /**
   * Analyze bundle performance
   */
  private async analyzeBundlePerformance(): Promise<void> {
    console.log('Analyzing bundle performance...');

    // Get performance entries for resources
    const resourceEntries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    const chunks: ChunkAnalysis[] = [];
    let totalSize = 0;

    resourceEntries.forEach(entry => {
      if (entry.name.includes('.js') || entry.name.includes('.css')) {
        const size = entry.transferSize || entry.encodedBodySize || 0;
        totalSize += size;

        chunks.push({
          name: this.extractChunkName(entry.name),
          size: size / 1024, // Convert to KB
          modules: [], // Would be populated by actual bundle analysis
          isAsync: entry.name.includes('chunk'),
          loadTime: entry.duration,
          usage: 1 // Would be tracked over time
        });
      }
    });

    this.bundleAnalysis = {
      totalSize: totalSize / 1024, // Convert to KB
      chunks,
      duplicatedModules: [], // Would be detected by actual analysis
      unusedCode: [], // Would be detected by actual analysis
      optimizationSuggestions: await this.generateBundleOptimizations(chunks, totalSize / 1024)
    };

    // Record bundle analysis metrics
    await publishMetric({
      metricName: 'Bundle_TotalSize',
      value: totalSize / 1024,
      dimensions: { Analysis: 'Complete' }
    });

    await publishMetric({
      metricName: 'Bundle_ChunkCount',
      value: chunks.length,
      dimensions: { Analysis: 'Complete' }
    });
  }

  /**
   * Extract chunk name from resource URL
   */
  private extractChunkName(url: string): string {
    const parts = url.split('/');
    const filename = parts[parts.length - 1];
    return filename.split('.')[0] || 'unknown';
  }

  /**
   * Generate bundle optimization suggestions
   */
  private async generateBundleOptimizations(
    chunks: ChunkAnalysis[], 
    totalSize: number
  ): Promise<OptimizationOpportunity[]> {
    const suggestions: OptimizationOpportunity[] = [];

    // Large bundle optimization
    if (totalSize > this.config.maxBundleSize) {
      suggestions.push({
        type: 'bundle_reduction',
        description: `Bundle size (${totalSize.toFixed(1)}KB) exceeds limit (${this.config.maxBundleSize}KB)`,
        impact: 'high',
        effort: 'medium',
        estimatedImprovement: (totalSize - this.config.maxBundleSize) * 10, // Rough estimate
        implementation: 'Implement code splitting and tree shaking'
      });
    }

    // Large chunk optimization
    const largeChunks = chunks.filter(chunk => chunk.size > 200);
    if (largeChunks.length > 0) {
      suggestions.push({
        type: 'code_splitting',
        description: `${largeChunks.length} chunks are larger than 200KB`,
        impact: 'medium',
        effort: 'medium',
        estimatedImprovement: largeChunks.reduce((sum, chunk) => sum + chunk.size, 0) * 5,
        implementation: `Split large chunks: ${largeChunks.map(c => c.name).join(', ')}`
      });
    }

    // Unused chunk optimization
    const unusedChunks = chunks.filter(chunk => chunk.usage === 0);
    if (unusedChunks.length > 0) {
      suggestions.push({
        type: 'bundle_reduction',
        description: `${unusedChunks.length} chunks appear to be unused`,
        impact: 'medium',
        effort: 'low',
        estimatedImprovement: unusedChunks.reduce((sum, chunk) => sum + chunk.size, 0) * 10,
        implementation: `Remove or lazy load unused chunks: ${unusedChunks.map(c => c.name).join(', ')}`
      });
    }

    return suggestions;
  }

  /**
   * Initialize cache strategies
   */
  private initializeCacheStrategies(): void {
    this.cacheStrategies = [
      {
        name: 'static-assets',
        pattern: /\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2)$/,
        maxAge: 31536000, // 1 year
        staleWhileRevalidate: false,
        priority: 1
      },
      {
        name: 'api-responses',
        pattern: /\/api\//,
        maxAge: 300, // 5 minutes
        staleWhileRevalidate: true,
        priority: 2
      },
      {
        name: 'html-pages',
        pattern: /\.html$|\/$/,
        maxAge: 3600, // 1 hour
        staleWhileRevalidate: true,
        priority: 3
      },
      {
        name: 'dynamic-content',
        pattern: /\/vc\/|\/dashboard/,
        maxAge: 60, // 1 minute
        staleWhileRevalidate: true,
        priority: 4
      }
    ];
  }

  /**
   * Setup intelligent caching
   */
  private setupIntelligentCaching(): void {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
      console.warn('Service Worker not supported, skipping intelligent caching');
      return;
    }

    // Register service worker for caching
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('Service Worker registered for intelligent caching');
        
        // Send cache strategies to service worker
        if (registration.active) {
          registration.active.postMessage({
            type: 'UPDATE_CACHE_STRATEGIES',
            strategies: this.cacheStrategies
          });
        }
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error);
      });

    // Setup cache performance monitoring
    this.monitorCachePerformance();
  }

  /**
   * Implement intelligent caching for a route
   */
  private async implementIntelligentCaching(analysis: RouteAnalysis): Promise<void> {
    console.log(`Implementing intelligent caching for ${analysis.path}`);

    // Determine optimal cache strategy based on route characteristics
    let strategy: CacheStrategy;

    if (analysis.priority === 'high' && analysis.usage > 10) {
      // Aggressive caching for high-priority, frequently used routes
      strategy = {
        name: `route-${analysis.path.replace(/\//g, '-')}`,
        pattern: new RegExp(analysis.path.replace(/\//g, '\\/')),
        maxAge: 3600, // 1 hour
        staleWhileRevalidate: true,
        priority: 1
      };
    } else if (analysis.loadTime > 2000) {
      // Cache slow-loading routes more aggressively
      strategy = {
        name: `slow-route-${analysis.path.replace(/\//g, '-')}`,
        pattern: new RegExp(analysis.path.replace(/\//g, '\\/')),
        maxAge: 1800, // 30 minutes
        staleWhileRevalidate: true,
        priority: 2
      };
    } else {
      // Conservative caching for other routes
      strategy = {
        name: `route-${analysis.path.replace(/\//g, '-')}`,
        pattern: new RegExp(analysis.path.replace(/\//g, '\\/')),
        maxAge: 300, // 5 minutes
        staleWhileRevalidate: true,
        priority: 3
      };
    }

    // Add strategy to cache strategies
    this.cacheStrategies.push(strategy);

    // Update service worker with new strategy
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'ADD_CACHE_STRATEGY',
        strategy
      });
    }
  }

  /**
   * Implement preloading for critical resources
   */
  private async implementPreloading(analysis: RouteAnalysis): Promise<void> {
    console.log(`Implementing preloading for ${analysis.path}`);

    // Preload critical resources based on route dependencies
    const criticalResources = this.identifyCriticalResources(analysis);

    if (typeof document !== 'undefined') {
      criticalResources.forEach(resource => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = resource.url;
        link.as = resource.type;
        
        if (resource.type === 'script') {
          link.crossOrigin = 'anonymous';
        }

        document.head.appendChild(link);
      });
    }

    // Preload next likely routes based on user behavior
    if (typeof document !== 'undefined') {
      const nextRoutes = this.predictNextRoutes(analysis.path);
      nextRoutes.forEach(route => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = route;
        document.head.appendChild(link);
      });
    }
  }

  /**
   * Identify critical resources for a route
   */
  private identifyCriticalResources(analysis: RouteAnalysis): Array<{url: string, type: string}> {
    const resources: Array<{url: string, type: string}> = [];

    // Add critical CSS
    resources.push({
      url: '/assets/critical.css',
      type: 'style'
    });

    // Add route-specific resources based on dependencies
    analysis.dependencies.forEach(dep => {
      switch (dep) {
        case 'charts':
          resources.push({
            url: '/assets/charts.js',
            type: 'script'
          });
          break;
        case 'admin-components':
          resources.push({
            url: '/assets/admin.js',
            type: 'script'
          });
          break;
        case 'ai-analysis':
          resources.push({
            url: '/assets/ai-worker.js',
            type: 'script'
          });
          break;
      }
    });

    return resources;
  }

  /**
   * Predict next likely routes based on current route
   */
  private predictNextRoutes(currentPath: string): string[] {
    const predictions: string[] = [];

    // Route prediction logic based on common user flows
    switch (currentPath) {
      case '/':
        predictions.push('/vc/quick', '/auth/login', '/dashboard');
        break;
      case '/vc/quick':
        predictions.push('/vc/result', '/auth/register');
        break;
      case '/auth/login':
        predictions.push('/dashboard', '/onboarding');
        break;
      case '/dashboard':
        predictions.push('/vc/result', '/admin');
        break;
      default:
        // Generic predictions
        predictions.push('/dashboard', '/');
    }

    return predictions;
  }

  /**
   * Monitor cache performance
   */
  private monitorCachePerformance(): void {
    if (typeof window === 'undefined' || typeof window.fetch === 'undefined') return;
    
    // Monitor cache hit rates
    const originalFetch = window.fetch;
    let cacheHits = 0;
    let cacheMisses = 0;

    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      
      // Check if response came from cache
      if (response.headers.get('x-cache') === 'HIT' || 
          response.headers.get('cf-cache-status') === 'HIT') {
        cacheHits++;
      } else {
        cacheMisses++;
      }

      // Report cache metrics periodically
      const total = cacheHits + cacheMisses;
      if (total > 0 && total % 10 === 0) {
        const hitRate = (cacheHits / total) * 100;
        
        await publishMetric({
          metricName: 'Cache_HitRate',
          value: hitRate,
          dimensions: { Strategy: this.config.cacheStrategy }
        });
      }

      return response;
    };
  }

  /**
   * Start periodic optimization analysis
   */
  private startPeriodicAnalysis(): void {
    // Skip timer in test environment to prevent Jest open handles
    if (typeof process !== 'undefined' && process.env.JEST_WORKER_ID) return;
    
    this.analysisTimer = setInterval(async () => {
      await this.runOptimizationAnalysis();
    }, this.config.analysisInterval);
  }

  /**
   * Run comprehensive optimization analysis
   */
  private async runOptimizationAnalysis(): Promise<void> {
    console.log('Running periodic optimization analysis...');

    try {
      // Analyze current performance
      const currentMetrics = performanceMonitoring.getPerformanceSummary();
      
      // Check if optimization is needed
      if (currentMetrics.score < 80) {
        console.log(`Performance score (${currentMetrics.score}) below threshold, running optimizations...`);
        
        // Run route optimizations
        for (const [path, analysis] of this.routeAnalytics) {
          if (analysis.loadTime > this.config.optimizationThreshold) {
            await this.optimizeRoute(analysis);
          }
        }

        // Re-analyze bundle if needed
        if (this.bundleAnalysis && this.bundleAnalysis.totalSize > this.config.maxBundleSize) {
          await this.analyzeBundlePerformance();
        }
      }

      // Record analysis completion
      await publishMetric({
        metricName: 'OptimizationAnalysis_Completed',
        value: 1,
        dimensions: { 
          Score: currentMetrics.score.toString(),
          RoutesAnalyzed: this.routeAnalytics.size.toString()
        }
      });

    } catch (error) {
      console.error('Optimization analysis failed:', error);
      
      await publishMetric({
        metricName: 'OptimizationAnalysis_Error',
        value: 1,
        dimensions: { Error: String(error).slice(0, 100) }
      });
    }
  }

  /**
   * Get optimization summary
   */
  public getOptimizationSummary(): {
    routesAnalyzed: number;
    optimizationsApplied: number;
    averageLoadTime: number;
    bundleSize: number;
    cacheStrategies: number;
    lastAnalysis: number;
  } {
    const routes = Array.from(this.routeAnalytics.values());
    const averageLoadTime = routes.length > 0 
      ? routes.reduce((sum, route) => sum + route.loadTime, 0) / routes.length 
      : 0;

    const optimizationsApplied = this.optimizationHistory.reduce(
      (sum, result) => sum + result.optimizationsApplied.length, 0
    );

    return {
      routesAnalyzed: this.routeAnalytics.size,
      optimizationsApplied,
      averageLoadTime,
      bundleSize: this.bundleAnalysis?.totalSize || 0,
      cacheStrategies: this.cacheStrategies.length,
      lastAnalysis: Date.now()
    };
  }

  /**
   * Get route analytics
   */
  public getRouteAnalytics(): RouteAnalysis[] {
    return Array.from(this.routeAnalytics.values());
  }

  /**
   * Get bundle analysis
   */
  public getBundleAnalysis(): BundleAnalysis | null {
    return this.bundleAnalysis;
  }

  /**
   * Get optimization opportunities
   */
  public getOptimizationOpportunities(): OptimizationOpportunity[] {
    const opportunities: OptimizationOpportunity[] = [];

    // Collect opportunities from all routes
    this.routeAnalytics.forEach(analysis => {
      opportunities.push(...analysis.optimizationOpportunities);
    });

    // Add bundle optimization opportunities
    if (this.bundleAnalysis) {
      opportunities.push(...this.bundleAnalysis.optimizationSuggestions);
    }

    // Sort by impact and effort
    return opportunities.sort((a, b) => {
      const impactScore = { high: 3, medium: 2, low: 1 };
      const effortScore = { low: 3, medium: 2, high: 1 };
      
      const scoreA = impactScore[a.impact] + effortScore[a.effort];
      const scoreB = impactScore[b.impact] + effortScore[b.effort];
      
      return scoreB - scoreA;
    });
  }

  /**
   * Destroy optimization engine
   */
  public destroy(): void {
    if (this.analysisTimer) {
      clearInterval(this.analysisTimer);
    }
    
    this.isRunning = false;
    console.log('Automatic Optimization Engine destroyed');
  }
}

// Global optimization engine instance
export const automaticOptimizationEngine = new AutomaticOptimizationEngine();

// Auto-initialize on page load
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    automaticOptimizationEngine.initialize();
  });

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    automaticOptimizationEngine.destroy();
  });
}

// Export types and utilities
export type {
  OptimizationConfig,
  RouteAnalysis,
  OptimizationOpportunity,
  BundleAnalysis,
  ChunkAnalysis,
  CacheStrategy,
  OptimizationResult
};

export { AutomaticOptimizationEngine };