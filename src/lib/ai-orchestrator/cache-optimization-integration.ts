/**
 * Cache Optimization Integration
 *
 * Integrates cache hit rate optimization into the AI orchestrator system:
 * - Automatic optimization scheduling
 * - Performance monitoring integration
 * - Real-time hit rate tracking
 * - Optimization alerts and notifications
 */

import { CacheHitRateAnalyzer } from "./cache-hit-rate-analyzer";
import { CacheHitRateOptimizer } from "./cache-hit-rate-optimizer";
import { CachingLayer } from "./caching-layer";
import { PerformanceMonitor } from "./performance-monitor";
import { AiRequest, AiResponse } from "./types";

export interface CacheOptimizationConfig {
  enabled: boolean;
  optimizationIntervalMs: number;
  hitRateThreshold: number;
  alertingEnabled: boolean;
  autoWarmupEnabled: boolean;
  performanceIntegration: boolean;
}

export interface CacheOptimizationStatus {
  enabled: boolean;
  lastOptimization: Date;
  currentHitRate: number;
  targetHitRate: number;
  frequentQueries: number;
  optimizationHealth: "healthy" | "warning" | "critical";
  nextOptimization: Date;
}

export interface CacheOptimizationAlert {
  id: string;
  type:
    | "hit_rate_low"
    | "optimization_failed"
    | "cache_full"
    | "performance_degraded";
  severity: "info" | "warning" | "critical";
  message: string;
  timestamp: Date;
  resolved: boolean;
  metrics?: any;
}

/**
 * Cache Optimization Integration Manager
 */
export class CacheOptimizationIntegration {
  private config: CacheOptimizationConfig;
  private optimizer: CacheHitRateOptimizer;
  private cachingLayer: CachingLayer;
  private analyzer: CacheHitRateAnalyzer;
  private performanceMonitor?: PerformanceMonitor;
  private optimizationTimer?: NodeJS.Timeout;
  private alerts: CacheOptimizationAlert[] = [];
  private isOptimizing = false;

  constructor(
    optimizer: CacheHitRateOptimizer,
    cachingLayer: CachingLayer,
    analyzer: CacheHitRateAnalyzer,
    config: Partial<CacheOptimizationConfig> = {}
  ) {
    this.optimizer = optimizer;
    this.cachingLayer = cachingLayer;
    this.analyzer = analyzer;

    this.config = {
      enabled: true,
      optimizationIntervalMs: 30 * 60 * 1000, // 30 minutes
      hitRateThreshold: 80, // 80%
      alertingEnabled: true,
      autoWarmupEnabled: true,
      performanceIntegration: true,
      ...config,
    };

    if (this.config.enabled) {
      this.startOptimizationScheduler();
    }
  }

  /**
   * Set performance monitor for integration
   */
  setPerformanceMonitor(monitor: PerformanceMonitor): void {
    this.performanceMonitor = monitor;
  }

  /**
   * Process AI request with cache optimization tracking
   */
  async processRequest(
    request: AiRequest,
    response: AiResponse
  ): Promise<void> {
    if (!this.config.enabled) return;

    // Track query pattern
    this.optimizer.analyzeQuery(request, response);

    // Record cache attempt for analyzer
    const cacheRequest = {
      requestId: response.requestId,
      prompt: request.prompt,
      context: {
        domain: request.context.domain,
        intent: request.context.intent,
        userId: request.context.userId,
        sessionId: request.context.sessionId,
      },
      tools: request.tools,
      timestamp: Date.now(),
    };

    const hit = response.cached || false;
    const latency = response.latencyMs || 0;

    this.analyzer.recordCacheAttempt(cacheRequest, hit, latency);

    // Check if immediate optimization is needed
    await this.checkImmediateOptimization();
  }

  /**
   * Check if immediate optimization is needed
   */
  private async checkImmediateOptimization(): Promise<void> {
    if (this.isOptimizing) return;

    const currentHitRate =
      await this.optimizer.calculateFrequentQueriesHitRate();

    // Trigger immediate optimization if hit rate is critically low
    if (currentHitRate < this.config.hitRateThreshold * 0.6) {
      // 60% of target
      console.log(
        `Critical hit rate detected (${currentHitRate.toFixed(
          1
        )}%), triggering immediate optimization`
      );
      await this.runOptimization();
    }
  }

  /**
   * Run cache optimization
   */
  async runOptimization(): Promise<void> {
    if (this.isOptimizing) {
      console.log("Optimization already in progress, skipping");
      return;
    }

    this.isOptimizing = true;
    const startTime = Date.now();

    try {
      console.log("Starting cache optimization...");

      const beforeMetrics = this.optimizer.getMetrics();
      const optimizationResult = await this.optimizer.optimize();
      const afterMetrics = optimizationResult;

      const duration = Date.now() - startTime;

      console.log(`Cache optimization completed in ${duration}ms`, {
        hitRateBefore: beforeMetrics.frequentQueriesHitRate.toFixed(1) + "%",
        hitRateAfter: afterMetrics.frequentQueriesHitRate.toFixed(1) + "%",
        warmupOps:
          afterMetrics.warmupOperations - beforeMetrics.warmupOperations,
        refreshOps:
          afterMetrics.refreshOperations - beforeMetrics.refreshOperations,
      });

      // Check if optimization was successful
      if (afterMetrics.frequentQueriesHitRate >= this.config.hitRateThreshold) {
        this.resolveAlert("hit_rate_low");
      } else {
        this.generateAlert({
          type: "hit_rate_low",
          severity: "warning",
          message: `Cache hit rate (${afterMetrics.frequentQueriesHitRate.toFixed(
            1
          )}%) still below target (${
            this.config.hitRateThreshold
          }%) after optimization`,
          metrics: afterMetrics,
        });
      }

      // Integrate with performance monitor
      if (this.performanceMonitor && this.config.performanceIntegration) {
        this.updatePerformanceMonitor(afterMetrics);
      }
    } catch (error) {
      console.error("Cache optimization failed:", error);

      this.generateAlert({
        type: "optimization_failed",
        severity: "critical",
        message: `Cache optimization failed: ${error}`,
        metrics: { error: String(error) },
      });
    } finally {
      this.isOptimizing = false;
    }
  }

  /**
   * Update performance monitor with cache metrics
   */
  private updatePerformanceMonitor(metrics: any): void {
    if (!this.performanceMonitor) return;

    // Add cache-specific performance data
    const cacheStats = this.cachingLayer.getStats();

    console.log("Updating performance monitor with cache metrics", {
      hitRate: metrics.frequentQueriesHitRate,
      cacheSize: cacheStats.cacheSize,
      averageLatency: cacheStats.averageLatency,
    });
  }

  /**
   * Get current optimization status
   */
  getOptimizationStatus(): CacheOptimizationStatus {
    const metrics = this.optimizer.getMetrics();
    const nextOptimization = new Date(
      Date.now() + this.config.optimizationIntervalMs
    );

    let health: "healthy" | "warning" | "critical" = "healthy";

    if (metrics.frequentQueriesHitRate < this.config.hitRateThreshold * 0.6) {
      health = "critical";
    } else if (metrics.frequentQueriesHitRate < this.config.hitRateThreshold) {
      health = "warning";
    }

    return {
      enabled: this.config.enabled,
      lastOptimization: metrics.lastOptimization,
      currentHitRate: metrics.frequentQueriesHitRate,
      targetHitRate: this.config.hitRateThreshold,
      frequentQueries: metrics.frequentQueries,
      optimizationHealth: health,
      nextOptimization,
    };
  }

  /**
   * Get optimization recommendations
   */
  getRecommendations(): Array<{
    type: "action" | "warning" | "info";
    message: string;
    priority: "high" | "medium" | "low";
    action?: () => Promise<void>;
  }> {
    const baseRecommendations = this.optimizer.getOptimizationRecommendations();

    // Add integration-specific recommendations
    const integrationRecommendations = [];

    // Check if performance integration is beneficial
    if (!this.performanceMonitor && this.config.performanceIntegration) {
      integrationRecommendations.push({
        type: "info" as const,
        message:
          "Performance monitor integration is enabled but no monitor is set. Consider setting a performance monitor for better insights.",
        priority: "low" as const,
      });
    }

    // Check optimization frequency
    const timeSinceLastOptimization =
      Date.now() - this.optimizer.getMetrics().lastOptimization.getTime();
    if (timeSinceLastOptimization > this.config.optimizationIntervalMs * 2) {
      integrationRecommendations.push({
        type: "action" as const,
        message:
          "Cache optimization is overdue. Consider running optimization now.",
        priority: "medium" as const,
        action: async () => await this.runOptimization(),
      });
    }

    // Check for active alerts
    const activeAlerts = this.getActiveAlerts();
    if (activeAlerts.length > 0) {
      integrationRecommendations.push({
        type: "warning" as const,
        message: `${activeAlerts.length} active cache optimization alerts require attention.`,
        priority: "high" as const,
      });
    }

    return [...baseRecommendations, ...integrationRecommendations];
  }

  /**
   * Generate optimization alert
   */
  private generateAlert(
    alert: Omit<CacheOptimizationAlert, "id" | "timestamp" | "resolved">
  ): void {
    if (!this.config.alertingEnabled) return;

    const newAlert: CacheOptimizationAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      resolved: false,
      ...alert,
    };

    this.alerts.push(newAlert);

    console.warn(
      `Cache Optimization Alert [${alert.severity.toUpperCase()}]: ${
        alert.message
      }`,
      alert.metrics
    );

    // Keep only recent alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }
  }

  /**
   * Resolve alert by type
   */
  private resolveAlert(type: CacheOptimizationAlert["type"]): void {
    const activeAlerts = this.alerts.filter(
      (a) => a.type === type && !a.resolved
    );

    for (const alert of activeAlerts) {
      alert.resolved = true;
      console.log(`Resolved cache optimization alert: ${alert.message}`);
    }
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): CacheOptimizationAlert[] {
    return this.alerts.filter((alert) => !alert.resolved);
  }

  /**
   * Get all alerts
   */
  getAllAlerts(): CacheOptimizationAlert[] {
    return [...this.alerts];
  }

  /**
   * Resolve specific alert
   */
  resolveAlertById(alertId: string): boolean {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      return true;
    }
    return false;
  }

  /**
   * Start optimization scheduler
   */
  private startOptimizationScheduler(): void {
    if (this.optimizationTimer) {
      clearInterval(this.optimizationTimer);
    }

    this.optimizationTimer = setInterval(async () => {
      await this.runOptimization();
    }, this.config.optimizationIntervalMs);

    console.log(
      `Cache optimization scheduler started (interval: ${
        this.config.optimizationIntervalMs / 1000
      }s)`
    );
  }

  /**
   * Stop optimization scheduler
   */
  stopOptimizationScheduler(): void {
    if (this.optimizationTimer) {
      clearInterval(this.optimizationTimer);
      this.optimizationTimer = undefined;
      console.log("Cache optimization scheduler stopped");
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<CacheOptimizationConfig>): void {
    const oldEnabled = this.config.enabled;
    const oldInterval = this.config.optimizationIntervalMs;

    this.config = { ...this.config, ...newConfig };

    // Restart scheduler if interval changed or enabled status changed
    if (
      this.config.enabled !== oldEnabled ||
      this.config.optimizationIntervalMs !== oldInterval
    ) {
      if (this.config.enabled) {
        this.startOptimizationScheduler();
      } else {
        this.stopOptimizationScheduler();
      }
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): CacheOptimizationConfig {
    return { ...this.config };
  }

  /**
   * Force immediate optimization
   */
  async forceOptimization(): Promise<void> {
    await this.runOptimization();
  }

  /**
   * Get comprehensive optimization report
   */
  getOptimizationReport(): {
    status: CacheOptimizationStatus;
    metrics: any;
    recommendations: any[];
    alerts: CacheOptimizationAlert[];
    cacheStats: any;
    analytics: any;
  } {
    return {
      status: this.getOptimizationStatus(),
      metrics: this.optimizer.getMetrics(),
      recommendations: this.getRecommendations(),
      alerts: this.getActiveAlerts(),
      cacheStats: this.cachingLayer.getStats(),
      analytics: this.analyzer.getCacheAnalytics(),
    };
  }

  /**
   * Health check for cache optimization system
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    issues: string[];
    metrics: any;
  }> {
    const issues: string[] = [];
    const status = this.getOptimizationStatus();
    const activeAlerts = this.getActiveAlerts();

    // Check if optimization is healthy
    if (status.optimizationHealth === "critical") {
      issues.push(
        `Critical cache hit rate: ${status.currentHitRate.toFixed(1)}%`
      );
    }

    // Check for critical alerts
    const criticalAlerts = activeAlerts.filter(
      (a) => a.severity === "critical"
    );
    if (criticalAlerts.length > 0) {
      issues.push(
        `${criticalAlerts.length} critical cache optimization alerts`
      );
    }

    // Check if optimization is stuck
    const timeSinceLastOptimization =
      Date.now() - status.lastOptimization.getTime();
    if (timeSinceLastOptimization > this.config.optimizationIntervalMs * 3) {
      issues.push("Cache optimization appears to be stuck or disabled");
    }

    // Check cache system health
    const cacheHealth = await this.cachingLayer.healthCheck();
    if (!cacheHealth.healthy) {
      issues.push(`Cache system unhealthy: ${cacheHealth.errors.join(", ")}`);
    }

    return {
      healthy: issues.length === 0,
      issues,
      metrics: {
        status,
        cacheHealth,
        activeAlerts: activeAlerts.length,
        criticalAlerts: criticalAlerts.length,
      },
    };
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    this.stopOptimizationScheduler();
    this.optimizer.dispose();
    this.alerts = [];
  }
}

/**
 * Factory function for creating cache optimization integration
 */
export const createCacheOptimizationIntegration = (
  optimizer: CacheHitRateOptimizer,
  cachingLayer: CachingLayer,
  analyzer: CacheHitRateAnalyzer,
  config?: Partial<CacheOptimizationConfig>
): CacheOptimizationIntegration => {
  return new CacheOptimizationIntegration(
    optimizer,
    cachingLayer,
    analyzer,
    config
  );
};
