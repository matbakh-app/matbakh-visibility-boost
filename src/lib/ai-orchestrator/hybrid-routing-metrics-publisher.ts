/**
 * Hybrid Routing Metrics Publisher
 *
 * Publishes hybrid routing metrics to CloudWatch for monitoring and alerting.
 * Integrates with HybridRoutingPerformanceMonitor to collect and publish metrics.
 *
 * @module hybrid-routing-metrics-publisher
 */

import { HybridHealthMonitor } from "./hybrid-health-monitor";
import { HybridRoutingPerformanceMonitor } from "./hybrid-routing-performance-monitor";

/**
 * Routing path types
 */
type RoutingPath = "direct_bedrock" | "mcp" | "fallback" | "hybrid";

/**
 * CloudWatch metric data point
 */
export interface MetricDataPoint {
  metricName: string;
  value: number;
  unit: string;
  timestamp: Date;
  dimensions?: Record<string, string>;
}

/**
 * Support mode operation types for metrics
 */
export enum SupportModeOperationType {
  INFRASTRUCTURE_AUDIT = "infrastructure_audit",
  META_MONITOR = "meta_monitor",
  IMPLEMENTATION_SUPPORT = "implementation_support",
  KIRO_BRIDGE = "kiro_bridge",
  EMERGENCY_OPERATION = "emergency_operation",
}

/**
 * Support mode metrics data
 */
export interface SupportModeMetrics {
  operationType: SupportModeOperationType;
  routePath: "direct" | "mcp" | "fallback";
  latencyMs: number;
  success: boolean;
  costUsd: number;
  timestamp: Date;
}

/**
 * Metrics publisher configuration
 */
export interface MetricsPublisherConfig {
  namespace: string;
  region: string;
  environment: string;
  publishIntervalMs: number;
  batchSize: number;
  enablePublishing: boolean;
}

/**
 * Default metrics publisher configuration
 */
const DEFAULT_CONFIG: MetricsPublisherConfig = {
  namespace: "Matbakh/HybridRouting",
  region: "eu-central-1",
  environment: "development",
  publishIntervalMs: 60000, // 1 minute
  batchSize: 20,
  enablePublishing: true,
};

/**
 * Hybrid Routing Metrics Publisher
 *
 * Publishes metrics to CloudWatch for monitoring and alerting.
 */
export class HybridRoutingMetricsPublisher {
  private config: MetricsPublisherConfig;
  private publishTimer?: NodeJS.Timeout;
  private isPublishing: boolean;
  private metricsQueue: MetricDataPoint[];

  constructor(
    private performanceMonitor: HybridRoutingPerformanceMonitor,
    private healthMonitor: HybridHealthMonitor,
    config?: Partial<MetricsPublisherConfig>
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.isPublishing = false;
    this.metricsQueue = [];
  }

  /**
   * Start publishing metrics to CloudWatch
   */
  public startPublishing(): void {
    if (this.isPublishing) {
      console.log("[HybridRoutingMetricsPublisher] Already publishing");
      return;
    }

    if (!this.config.enablePublishing) {
      console.log("[HybridRoutingMetricsPublisher] Publishing disabled");
      return;
    }

    console.log("[HybridRoutingMetricsPublisher] Starting metrics publishing");
    this.isPublishing = true;

    this.publishTimer = setInterval(
      () => this.publishMetrics(),
      this.config.publishIntervalMs
    );
  }

  /**
   * Stop publishing metrics
   */
  public stopPublishing(): void {
    if (!this.isPublishing) {
      return;
    }

    console.log("[HybridRoutingMetricsPublisher] Stopping metrics publishing");
    this.isPublishing = false;

    if (this.publishTimer) {
      clearInterval(this.publishTimer);
      this.publishTimer = undefined;
    }

    // Publish any remaining metrics
    if (this.metricsQueue.length > 0) {
      this.publishMetrics();
    }
  }

  /**
   * Publish metrics to CloudWatch
   */
  private async publishMetrics(): Promise<void> {
    try {
      // Collect metrics from performance monitor
      await this.collectPerformanceMetrics();

      // Collect metrics from health monitor
      await this.collectHealthMetrics();

      // Publish queued metrics
      await this.publishQueuedMetrics();

      console.log(
        `[HybridRoutingMetricsPublisher] Published ${this.metricsQueue.length} metrics`
      );
    } catch (error) {
      console.error(
        "[HybridRoutingMetricsPublisher] Error publishing metrics:",
        error
      );
    }
  }

  /**
   * Collect performance metrics
   */
  private async collectPerformanceMetrics(): Promise<void> {
    const summary = await this.performanceMonitor.getPerformanceSummary();

    // Publish metrics for each routing path
    for (const [path, metrics] of summary.pathMetrics.entries()) {
      const pathName = this.formatPathName(path);

      // Request count
      this.queueMetric({
        metricName: `${pathName}Requests`,
        value: metrics.requestCount,
        unit: "Count",
        timestamp: new Date(),
      });

      // Success rate
      this.queueMetric({
        metricName: `${pathName}SuccessRate`,
        value: metrics.successRate,
        unit: "Percent",
        timestamp: new Date(),
      });

      // Latency metrics
      this.queueMetric({
        metricName: `${pathName}P50Latency`,
        value: metrics.p50LatencyMs,
        unit: "Milliseconds",
        timestamp: new Date(),
      });

      this.queueMetric({
        metricName: `${pathName}P95Latency`,
        value: metrics.p95LatencyMs,
        unit: "Milliseconds",
        timestamp: new Date(),
      });

      this.queueMetric({
        metricName: `${pathName}P99Latency`,
        value: metrics.p99LatencyMs,
        unit: "Milliseconds",
        timestamp: new Date(),
      });

      this.queueMetric({
        metricName: `${pathName}AvgLatency`,
        value: metrics.averageLatencyMs,
        unit: "Milliseconds",
        timestamp: new Date(),
      });
    }

    // Routing efficiency metrics
    const efficiency = summary.routingEfficiency;

    this.queueMetric({
      metricName: "OverallRoutingEfficiency",
      value: efficiency.overallEfficiency,
      unit: "Percent",
      timestamp: new Date(),
    });

    this.queueMetric({
      metricName: "OptimalRoutingRate",
      value: efficiency.optimalRoutingRate,
      unit: "Percent",
      timestamp: new Date(),
    });

    this.queueMetric({
      metricName: "FallbackRate",
      value: efficiency.fallbackRate,
      unit: "Percent",
      timestamp: new Date(),
    });
  }

  /**
   * Collect health metrics
   */
  private async collectHealthMetrics(): Promise<void> {
    const healthStatus = await this.healthMonitor.getHealthStatus();

    // Direct Bedrock health
    this.queueMetric({
      metricName: "DirectBedrockHealthStatus",
      value: healthStatus.directBedrock.isHealthy ? 1 : 0,
      unit: "None",
      timestamp: new Date(),
    });

    this.queueMetric({
      metricName: "DirectBedrockHealthScore",
      value: healthStatus.directBedrock.healthScore,
      unit: "None",
      timestamp: new Date(),
    });

    // MCP health
    this.queueMetric({
      metricName: "MCPHealthStatus",
      value: healthStatus.mcp.isHealthy ? 1 : 0,
      unit: "None",
      timestamp: new Date(),
    });

    this.queueMetric({
      metricName: "MCPHealthScore",
      value: healthStatus.mcp.healthScore,
      unit: "None",
      timestamp: new Date(),
    });

    // Overall routing efficiency
    this.queueMetric({
      metricName: "RoutingEfficiency",
      value: healthStatus.routingEfficiency,
      unit: "Percent",
      timestamp: new Date(),
    });
  }

  /**
   * Queue a metric for publishing
   */
  private queueMetric(metric: MetricDataPoint): void {
    this.metricsQueue.push(metric);
  }

  /**
   * Publish queued metrics to CloudWatch
   */
  private async publishQueuedMetrics(): Promise<void> {
    if (this.metricsQueue.length === 0) {
      return;
    }

    // In a real implementation, this would use AWS SDK to publish to CloudWatch
    // For now, we'll just log the metrics
    console.log(
      `[HybridRoutingMetricsPublisher] Publishing ${this.metricsQueue.length} metrics to CloudWatch`
    );

    // Batch metrics
    const batches = this.batchMetrics(this.metricsQueue, this.config.batchSize);

    for (const batch of batches) {
      await this.publishBatch(batch);
    }

    // Clear the queue
    this.metricsQueue = [];
  }

  /**
   * Publish a batch of metrics
   */
  private async publishBatch(metrics: MetricDataPoint[]): Promise<void> {
    // In production, this would use AWS CloudWatch SDK:
    // const cloudwatch = new CloudWatchClient({ region: this.config.region });
    // await cloudwatch.send(new PutMetricDataCommand({
    //   Namespace: this.config.namespace,
    //   MetricData: metrics.map(m => ({
    //     MetricName: m.metricName,
    //     Value: m.value,
    //     Unit: m.unit,
    //     Timestamp: m.timestamp,
    //     Dimensions: m.dimensions ? Object.entries(m.dimensions).map(([k, v]) => ({
    //       Name: k,
    //       Value: v
    //     })) : undefined
    //   }))
    // }));

    console.log(
      `[HybridRoutingMetricsPublisher] Would publish batch of ${metrics.length} metrics:`,
      metrics.map((m) => `${m.metricName}=${m.value}${m.unit}`).join(", ")
    );
  }

  /**
   * Batch metrics into groups
   */
  private batchMetrics(
    metrics: MetricDataPoint[],
    batchSize: number
  ): MetricDataPoint[][] {
    const batches: MetricDataPoint[][] = [];

    for (let i = 0; i < metrics.length; i += batchSize) {
      batches.push(metrics.slice(i, i + batchSize));
    }

    return batches;
  }

  /**
   * Format routing path name for metrics
   */
  private formatPathName(path: RoutingPath): string {
    switch (path) {
      case "direct_bedrock":
        return "DirectBedrock";
      case "mcp":
        return "MCP";
      case "fallback":
        return "Fallback";
      case "hybrid":
        return "Hybrid";
      default:
        return "Unknown";
    }
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<MetricsPublisherConfig>): void {
    this.config = { ...this.config, ...config };
    console.log("[HybridRoutingMetricsPublisher] Configuration updated");
  }

  /**
   * Get current configuration
   */
  public getConfig(): MetricsPublisherConfig {
    return { ...this.config };
  }

  /**
   * Record support mode operation metrics
   */
  public recordSupportModeOperation(metrics: SupportModeMetrics): void {
    const { operationType, routePath, latencyMs, success, costUsd, timestamp } =
      metrics;

    // Operation count by type and path
    this.queueMetric({
      metricName: "SupportModeOperationCount",
      value: 1,
      unit: "Count",
      timestamp,
      dimensions: {
        OperationType: operationType,
        RoutePath: routePath,
        Environment: this.config.environment,
      },
    });

    // Operation latency
    this.queueMetric({
      metricName: "SupportModeOperationLatency",
      value: latencyMs,
      unit: "Milliseconds",
      timestamp,
      dimensions: {
        OperationType: operationType,
        RoutePath: routePath,
        Environment: this.config.environment,
      },
    });

    // Operation success rate
    this.queueMetric({
      metricName: "SupportModeOperationSuccess",
      value: success ? 1 : 0,
      unit: "None",
      timestamp,
      dimensions: {
        OperationType: operationType,
        RoutePath: routePath,
        Environment: this.config.environment,
      },
    });

    // Operation cost
    this.queueMetric({
      metricName: "SupportModeOperationCost",
      value: costUsd,
      unit: "None",
      timestamp,
      dimensions: {
        OperationType: operationType,
        RoutePath: routePath,
        Environment: this.config.environment,
      },
    });

    console.log(
      `[HybridRoutingMetricsPublisher] Recorded support mode operation: ${operationType} via ${routePath} (${latencyMs}ms, ${
        success ? "success" : "failure"
      }, $${costUsd})`
    );
  }

  /**
   * Get support mode metrics summary
   */
  public getSupportModeMetricsSummary(): {
    totalOperations: number;
    operationsByType: Record<string, number>;
    operationsByPath: Record<string, number>;
    averageLatencyMs: number;
    successRate: number;
    totalCostUsd: number;
  } {
    const supportModeMetrics = this.metricsQueue.filter((m) =>
      m.metricName.startsWith("SupportMode")
    );

    const operationCounts = supportModeMetrics.filter(
      (m) => m.metricName === "SupportModeOperationCount"
    );

    const totalOperations = operationCounts.reduce(
      (sum, m) => sum + m.value,
      0
    );

    const operationsByType: Record<string, number> = {};
    const operationsByPath: Record<string, number> = {};

    operationCounts.forEach((m) => {
      if (m.dimensions) {
        const type = m.dimensions.OperationType || "unknown";
        const path = m.dimensions.RoutePath || "unknown";

        operationsByType[type] = (operationsByType[type] || 0) + m.value;
        operationsByPath[path] = (operationsByPath[path] || 0) + m.value;
      }
    });

    const latencyMetrics = supportModeMetrics.filter(
      (m) => m.metricName === "SupportModeOperationLatency"
    );
    const averageLatencyMs =
      latencyMetrics.length > 0
        ? latencyMetrics.reduce((sum, m) => sum + m.value, 0) /
          latencyMetrics.length
        : 0;

    const successMetrics = supportModeMetrics.filter(
      (m) => m.metricName === "SupportModeOperationSuccess"
    );
    const successRate =
      successMetrics.length > 0
        ? (successMetrics.filter((m) => m.value === 1).length /
            successMetrics.length) *
          100
        : 0;

    const costMetrics = supportModeMetrics.filter(
      (m) => m.metricName === "SupportModeOperationCost"
    );
    const totalCostUsd = costMetrics.reduce((sum, m) => sum + m.value, 0);

    return {
      totalOperations,
      operationsByType,
      operationsByPath,
      averageLatencyMs,
      successRate,
      totalCostUsd,
    };
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    this.stopPublishing();
    this.metricsQueue = [];
    console.log("[HybridRoutingMetricsPublisher] Cleanup completed");
  }
}
