/**
 * Hybrid Routing Performance Monitor
 *
 * Monitors P95 latency and routing efficiency for the hybrid architecture.
 * Provides real-time performance metrics and alerting for routing decisions.
 *
 * @module hybrid-routing-performance-monitor
 */

import { AiFeatureFlags } from "./ai-feature-flags";
import { HybridHealthMonitor } from "./hybrid-health-monitor";
import { IntelligentRouter, RoutingPath } from "./intelligent-router";

/**
 * Performance metric for a specific routing path
 */
export interface RoutingPathMetrics {
  path: RoutingPath;
  requestCount: number;
  successCount: number;
  failureCount: number;
  totalLatencyMs: number;
  latencies: number[];
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  averageLatencyMs: number;
  successRate: number;
  lastUpdated: Date;
}

/**
 * Performance alert severity levels
 */
export type AlertSeverity = "info" | "warning" | "critical";

/**
 * Performance alert
 */
export interface PerformanceAlert {
  id: string;
  severity: AlertSeverity;
  type: "latency" | "success_rate" | "routing_efficiency" | "cost";
  message: string;
  path?: RoutingPath;
  metrics: Record<string, number>;
  timestamp: Date;
  acknowledged: boolean;
}

/**
 * Routing efficiency metrics
 */
export interface RoutingEfficiencyMetrics {
  overallEfficiency: number;
  directBedrockEfficiency: number;
  mcpEfficiency: number;
  fallbackRate: number;
  optimalRoutingRate: number;
  suboptimalRoutingRate: number;
  recommendations: string[];
}

/**
 * Performance monitoring configuration
 */
export interface PerformanceMonitorConfig {
  // Latency thresholds (ms)
  p95LatencyWarningThreshold: number;
  p95LatencyCriticalThreshold: number;

  // Success rate thresholds (%)
  successRateWarningThreshold: number;
  successRateCriticalThreshold: number;

  // Routing efficiency thresholds (%)
  routingEfficiencyWarningThreshold: number;
  routingEfficiencyCriticalThreshold: number;

  // Monitoring intervals
  metricsCollectionIntervalMs: number;
  alertCheckIntervalMs: number;
  metricsRetentionMs: number;

  // Alert configuration
  enableAlerts: boolean;
  alertCooldownMs: number;
}

/**
 * Default performance monitoring configuration
 */
const DEFAULT_CONFIG: PerformanceMonitorConfig = {
  p95LatencyWarningThreshold: 10000, // 10s
  p95LatencyCriticalThreshold: 15000, // 15s
  successRateWarningThreshold: 95,
  successRateCriticalThreshold: 90,
  routingEfficiencyWarningThreshold: 80,
  routingEfficiencyCriticalThreshold: 70,
  metricsCollectionIntervalMs: 60000, // 1 minute
  alertCheckIntervalMs: 30000, // 30 seconds
  metricsRetentionMs: 3600000, // 1 hour
  enableAlerts: true,
  alertCooldownMs: 300000, // 5 minutes
};

/**
 * Hybrid Routing Performance Monitor
 *
 * Monitors P95 latency and routing efficiency for hybrid architecture.
 */
export class HybridRoutingPerformanceMonitor {
  private config: PerformanceMonitorConfig;
  private pathMetrics: Map<RoutingPath, RoutingPathMetrics>;
  private alerts: PerformanceAlert[];
  private lastAlertTime: Map<string, Date>;
  private metricsCollectionTimer?: NodeJS.Timeout;
  private alertCheckTimer?: NodeJS.Timeout;
  private isMonitoring: boolean;

  constructor(
    private router: IntelligentRouter,
    private healthMonitor: HybridHealthMonitor,
    private featureFlags: AiFeatureFlags,
    config?: Partial<PerformanceMonitorConfig>
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.pathMetrics = new Map();
    this.alerts = [];
    this.lastAlertTime = new Map();
    this.isMonitoring = false;

    // Initialize metrics for all routing paths
    this.initializePathMetrics();
  }

  /**
   * Initialize metrics for all routing paths
   */
  private initializePathMetrics(): void {
    const paths: RoutingPath[] = [
      "direct_bedrock",
      "mcp",
      "fallback",
      "hybrid",
    ];

    for (const path of paths) {
      this.pathMetrics.set(path, {
        path,
        requestCount: 0,
        successCount: 0,
        failureCount: 0,
        totalLatencyMs: 0,
        latencies: [],
        p50LatencyMs: 0,
        p95LatencyMs: 0,
        p99LatencyMs: 0,
        averageLatencyMs: 0,
        successRate: 100,
        lastUpdated: new Date(),
      });
    }
  }

  /**
   * Start performance monitoring
   */
  public startMonitoring(): void {
    if (this.isMonitoring) {
      console.log("[HybridRoutingPerformanceMonitor] Already monitoring");
      return;
    }

    console.log(
      "[HybridRoutingPerformanceMonitor] Starting performance monitoring"
    );
    this.isMonitoring = true;

    // Start metrics collection
    this.metricsCollectionTimer = setInterval(
      () => this.collectMetrics(),
      this.config.metricsCollectionIntervalMs
    );

    // Start alert checking
    if (this.config.enableAlerts) {
      this.alertCheckTimer = setInterval(
        () => this.checkAlerts(),
        this.config.alertCheckIntervalMs
      );
    }
  }

  /**
   * Stop performance monitoring
   */
  public stopMonitoring(): void {
    if (!this.isMonitoring) {
      return;
    }

    console.log(
      "[HybridRoutingPerformanceMonitor] Stopping performance monitoring"
    );
    this.isMonitoring = false;

    if (this.metricsCollectionTimer) {
      clearInterval(this.metricsCollectionTimer);
      this.metricsCollectionTimer = undefined;
    }

    if (this.alertCheckTimer) {
      clearInterval(this.alertCheckTimer);
      this.alertCheckTimer = undefined;
    }
  }

  /**
   * Record a routing operation
   */
  public recordOperation(
    path: RoutingPath,
    latencyMs: number,
    success: boolean
  ): void {
    const metrics = this.pathMetrics.get(path);
    if (!metrics) {
      console.warn(`[HybridRoutingPerformanceMonitor] Unknown path: ${path}`);
      return;
    }

    // Update counters
    metrics.requestCount++;
    if (success) {
      metrics.successCount++;
    } else {
      metrics.failureCount++;
    }

    // Update latency metrics
    metrics.totalLatencyMs += latencyMs;
    metrics.latencies.push(latencyMs);
    metrics.lastUpdated = new Date();

    // Trim old latencies to prevent memory issues
    const maxLatencies = 1000;
    if (metrics.latencies.length > maxLatencies) {
      metrics.latencies = metrics.latencies.slice(-maxLatencies);
    }

    // Recalculate percentiles
    this.calculatePercentiles(metrics);
  }

  /**
   * Calculate percentile latencies
   */
  private calculatePercentiles(metrics: RoutingPathMetrics): void {
    if (metrics.latencies.length === 0) {
      return;
    }

    const sorted = [...metrics.latencies].sort((a, b) => a - b);
    const count = sorted.length;

    metrics.p50LatencyMs = sorted[Math.floor(count * 0.5)];
    metrics.p95LatencyMs = sorted[Math.floor(count * 0.95)];
    metrics.p99LatencyMs = sorted[Math.floor(count * 0.99)];
    metrics.averageLatencyMs = metrics.totalLatencyMs / metrics.requestCount;
    metrics.successRate = (metrics.successCount / metrics.requestCount) * 100;
  }

  /**
   * Collect current metrics
   */
  private async collectMetrics(): Promise<void> {
    try {
      // Clean up old latency data
      const now = Date.now();
      const retentionCutoff = now - this.config.metricsRetentionMs;

      for (const metrics of this.pathMetrics.values()) {
        // Remove latencies older than retention period
        // (In production, you'd want to store timestamps with each latency)
        if (metrics.lastUpdated.getTime() < retentionCutoff) {
          metrics.latencies = [];
          metrics.requestCount = 0;
          metrics.successCount = 0;
          metrics.failureCount = 0;
          metrics.totalLatencyMs = 0;
        }
      }

      console.log("[HybridRoutingPerformanceMonitor] Metrics collected");
    } catch (error) {
      console.error(
        "[HybridRoutingPerformanceMonitor] Error collecting metrics:",
        error
      );
    }
  }

  /**
   * Check for performance alerts
   */
  private async checkAlerts(): Promise<void> {
    try {
      const now = new Date();

      // Check P95 latency alerts
      for (const [path, metrics] of this.pathMetrics.entries()) {
        if (metrics.requestCount === 0) continue;

        // P95 latency check
        if (metrics.p95LatencyMs > this.config.p95LatencyCriticalThreshold) {
          this.createAlert({
            severity: "critical",
            type: "latency",
            message: `Critical P95 latency on ${path}: ${metrics.p95LatencyMs}ms`,
            path,
            metrics: {
              p95: metrics.p95LatencyMs,
              threshold: this.config.p95LatencyCriticalThreshold,
            },
          });
        } else if (
          metrics.p95LatencyMs > this.config.p95LatencyWarningThreshold
        ) {
          this.createAlert({
            severity: "warning",
            type: "latency",
            message: `Warning P95 latency on ${path}: ${metrics.p95LatencyMs}ms`,
            path,
            metrics: {
              p95: metrics.p95LatencyMs,
              threshold: this.config.p95LatencyWarningThreshold,
            },
          });
        }

        // Success rate check
        if (metrics.successRate < this.config.successRateCriticalThreshold) {
          this.createAlert({
            severity: "critical",
            type: "success_rate",
            message: `Critical success rate on ${path}: ${metrics.successRate.toFixed(
              2
            )}%`,
            path,
            metrics: {
              successRate: metrics.successRate,
              threshold: this.config.successRateCriticalThreshold,
            },
          });
        } else if (
          metrics.successRate < this.config.successRateWarningThreshold
        ) {
          this.createAlert({
            severity: "warning",
            type: "success_rate",
            message: `Warning success rate on ${path}: ${metrics.successRate.toFixed(
              2
            )}%`,
            path,
            metrics: {
              successRate: metrics.successRate,
              threshold: this.config.successRateWarningThreshold,
            },
          });
        }
      }

      // Check routing efficiency
      const efficiency = await this.calculateRoutingEfficiency();
      if (
        efficiency.overallEfficiency <
        this.config.routingEfficiencyCriticalThreshold
      ) {
        this.createAlert({
          severity: "critical",
          type: "routing_efficiency",
          message: `Critical routing efficiency: ${efficiency.overallEfficiency.toFixed(
            2
          )}%`,
          metrics: {
            efficiency: efficiency.overallEfficiency,
            threshold: this.config.routingEfficiencyCriticalThreshold,
          },
        });
      } else if (
        efficiency.overallEfficiency <
        this.config.routingEfficiencyWarningThreshold
      ) {
        this.createAlert({
          severity: "warning",
          type: "routing_efficiency",
          message: `Warning routing efficiency: ${efficiency.overallEfficiency.toFixed(
            2
          )}%`,
          metrics: {
            efficiency: efficiency.overallEfficiency,
            threshold: this.config.routingEfficiencyWarningThreshold,
          },
        });
      }

      console.log("[HybridRoutingPerformanceMonitor] Alert check completed");
    } catch (error) {
      console.error(
        "[HybridRoutingPerformanceMonitor] Error checking alerts:",
        error
      );
    }
  }

  /**
   * Create a performance alert
   */
  private createAlert(
    alertData: Omit<PerformanceAlert, "id" | "timestamp" | "acknowledged">
  ): void {
    const alertKey = `${alertData.type}_${alertData.path || "global"}`;
    const lastAlert = this.lastAlertTime.get(alertKey);
    const now = new Date();

    // Check cooldown period
    if (
      lastAlert &&
      now.getTime() - lastAlert.getTime() < this.config.alertCooldownMs
    ) {
      return;
    }

    const alert: PerformanceAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...alertData,
      timestamp: now,
      acknowledged: false,
    };

    this.alerts.push(alert);
    this.lastAlertTime.set(alertKey, now);

    console.log(
      `[HybridRoutingPerformanceMonitor] Alert created: ${alert.severity} - ${alert.message}`
    );
  }

  /**
   * Calculate routing efficiency metrics
   */
  public async calculateRoutingEfficiency(): Promise<RoutingEfficiencyMetrics> {
    const directMetrics = this.pathMetrics.get("direct_bedrock");
    const mcpMetrics = this.pathMetrics.get("mcp");
    const fallbackMetrics = this.pathMetrics.get("fallback");

    if (!directMetrics || !mcpMetrics || !fallbackMetrics) {
      throw new Error("Missing routing path metrics");
    }

    const totalRequests =
      directMetrics.requestCount +
      mcpMetrics.requestCount +
      fallbackMetrics.requestCount;

    if (totalRequests === 0) {
      return {
        overallEfficiency: 100,
        directBedrockEfficiency: 100,
        mcpEfficiency: 100,
        fallbackRate: 0,
        optimalRoutingRate: 100,
        suboptimalRoutingRate: 0,
        recommendations: [],
      };
    }

    // Calculate efficiency scores
    const directEfficiency = directMetrics.successRate;
    const mcpEfficiency = mcpMetrics.successRate;
    const fallbackRate = (fallbackMetrics.requestCount / totalRequests) * 100;

    // Overall efficiency is weighted by request count
    const overallEfficiency =
      ((directMetrics.successCount +
        mcpMetrics.successCount +
        fallbackMetrics.successCount) /
        totalRequests) *
      100;

    // Optimal routing rate (requests that went to the best path)
    const optimalRoutingRate = 100 - fallbackRate; // Simplified assumption
    const suboptimalRoutingRate = fallbackRate;

    // Generate recommendations
    const recommendations: string[] = [];

    if (fallbackRate > 10) {
      recommendations.push(
        `High fallback rate (${fallbackRate.toFixed(
          2
        )}%) - investigate primary path health`
      );
    }

    if (directEfficiency < 95) {
      recommendations.push(
        `Direct Bedrock efficiency low (${directEfficiency.toFixed(
          2
        )}%) - check AWS Bedrock health`
      );
    }

    if (mcpEfficiency < 95) {
      recommendations.push(
        `MCP efficiency low (${mcpEfficiency.toFixed(
          2
        )}%) - check MCP router health`
      );
    }

    return {
      overallEfficiency,
      directBedrockEfficiency: directEfficiency,
      mcpEfficiency,
      fallbackRate,
      optimalRoutingRate,
      suboptimalRoutingRate,
      recommendations,
    };
  }

  /**
   * Get metrics for a specific routing path
   */
  public getPathMetrics(path: RoutingPath): RoutingPathMetrics | undefined {
    return this.pathMetrics.get(path);
  }

  /**
   * Get all routing path metrics
   */
  public getAllPathMetrics(): Map<RoutingPath, RoutingPathMetrics> {
    return new Map(this.pathMetrics);
  }

  /**
   * Get all active alerts
   */
  public getActiveAlerts(): PerformanceAlert[] {
    return this.alerts.filter((alert) => !alert.acknowledged);
  }

  /**
   * Get all alerts
   */
  public getAllAlerts(): PerformanceAlert[] {
    return [...this.alerts];
  }

  /**
   * Acknowledge an alert
   */
  public acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      console.log(
        `[HybridRoutingPerformanceMonitor] Alert acknowledged: ${alertId}`
      );
      return true;
    }
    return false;
  }

  /**
   * Clear all acknowledged alerts
   */
  public clearAcknowledgedAlerts(): number {
    const initialCount = this.alerts.length;
    this.alerts = this.alerts.filter((alert) => !alert.acknowledged);
    const clearedCount = initialCount - this.alerts.length;

    if (clearedCount > 0) {
      console.log(
        `[HybridRoutingPerformanceMonitor] Cleared ${clearedCount} acknowledged alerts`
      );
    }

    return clearedCount;
  }

  /**
   * Get performance summary
   */
  public async getPerformanceSummary(): Promise<{
    pathMetrics: Map<RoutingPath, RoutingPathMetrics>;
    routingEfficiency: RoutingEfficiencyMetrics;
    activeAlerts: PerformanceAlert[];
    isMonitoring: boolean;
  }> {
    const routingEfficiency = await this.calculateRoutingEfficiency();

    return {
      pathMetrics: this.getAllPathMetrics(),
      routingEfficiency,
      activeAlerts: this.getActiveAlerts(),
      isMonitoring: this.isMonitoring,
    };
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<PerformanceMonitorConfig>): void {
    this.config = { ...this.config, ...config };
    console.log("[HybridRoutingPerformanceMonitor] Configuration updated");
  }

  /**
   * Reset all metrics
   */
  public resetMetrics(): void {
    this.initializePathMetrics();
    this.alerts = [];
    this.lastAlertTime.clear();
    console.log("[HybridRoutingPerformanceMonitor] Metrics reset");
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    this.stopMonitoring();
    this.resetMetrics();
    console.log("[HybridRoutingPerformanceMonitor] Cleanup completed");
  }
}
