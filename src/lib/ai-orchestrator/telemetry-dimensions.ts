/**
 * Telemetry Dimensions System
 *
 * Implements low-cardinality telemetry dimensions for production monitoring:
 * - Provider, intent, role, region tracking
 * - Token count and tool usage metrics
 * - Cardinality protection against high-cardinality data
 * - Structured metric emission
 */

export interface TelemetryDimensions {
  // Core dimensions (always included)
  provider: string; // bedrock, google, meta
  intent: string; // generation, rag_cached, system
  role: string; // orchestrator, user-worker, audience-specialist
  region: string; // eu-central-1, eu-west-1

  // Request characteristics
  token_counts: {
    prompt: number;
    output: number;
    total: number;
  };
  tools_used: boolean; // true/false only

  // Performance dimensions
  cache_hit: boolean;
  latency_bucket: string; // <100ms, 100-500ms, 500ms-1s, 1s-2s, >2s

  // Quality dimensions
  success: boolean;
  error_type?: string; // timeout, rate_limit, model_error, network_error
}

export interface MetricEvent {
  timestamp: number;
  metric_name: string;
  value: number;
  dimensions: TelemetryDimensions;
  unit: "count" | "milliseconds" | "bytes" | "percent";
}

export interface CardinalityStats {
  dimension: string;
  uniqueValues: number;
  topValues: Array<{ value: string; count: number }>;
  isHighCardinality: boolean;
}

/**
 * Telemetry Dimensions Manager with cardinality protection
 */
export class TelemetryDimensions {
  private metrics: MetricEvent[] = [];
  private dimensionValues = new Map<string, Map<string, number>>();
  private readonly maxMetrics = 100000;
  private readonly highCardinalityThreshold = 100; // Max unique values per dimension

  /**
   * Record telemetry metric with dimensions
   */
  recordMetric(
    metricName: string,
    value: number,
    dimensions: Partial<TelemetryDimensions>,
    unit: "count" | "milliseconds" | "bytes" | "percent" = "count"
  ): void {
    // Sanitize and normalize dimensions
    const sanitizedDimensions = this.sanitizeDimensions(dimensions);

    // Check cardinality before recording
    if (!this.checkCardinality(sanitizedDimensions)) {
      console.warn("High cardinality detected, dropping metric", {
        metricName,
        dimensions,
      });
      return;
    }

    const event: MetricEvent = {
      timestamp: Date.now(),
      metric_name: metricName,
      value,
      dimensions: sanitizedDimensions,
      unit,
    };

    this.metrics.push(event);
    this.updateDimensionTracking(sanitizedDimensions);

    // Maintain memory limits
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Emit to monitoring system (CloudWatch, etc.)
    this.emitMetric(event);
  }

  /**
   * Record AI request telemetry
   */
  recordAIRequest(
    provider: string,
    intent: string,
    role: string,
    latencyMs: number,
    tokenCounts: { prompt: number; output: number },
    success: boolean,
    options: {
      toolsUsed?: boolean;
      cacheHit?: boolean;
      errorType?: string;
      region?: string;
    } = {}
  ): void {
    const dimensions: TelemetryDimensions = {
      provider: this.normalizeProvider(provider),
      intent: this.normalizeIntent(intent),
      role: this.normalizeRole(role),
      region: options.region || "eu-central-1",
      token_counts: {
        prompt: tokenCounts.prompt,
        output: tokenCounts.output,
        total: tokenCounts.prompt + tokenCounts.output,
      },
      tools_used: options.toolsUsed || false,
      cache_hit: options.cacheHit || false,
      latency_bucket: this.getLatencyBucket(latencyMs),
      success,
      error_type: options.errorType,
    };

    // Record multiple metrics from single request
    this.recordMetric("ai_request_count", 1, dimensions, "count");
    this.recordMetric(
      "ai_request_latency",
      latencyMs,
      dimensions,
      "milliseconds"
    );
    this.recordMetric(
      "ai_request_tokens",
      dimensions.token_counts.total,
      dimensions,
      "count"
    );

    if (!success && options.errorType) {
      this.recordMetric("ai_request_errors", 1, dimensions, "count");
    }
  }

  /**
   * Get cardinality statistics for all dimensions
   */
  getCardinalityStats(): CardinalityStats[] {
    const stats: CardinalityStats[] = [];

    for (const [dimension, valueMap] of this.dimensionValues) {
      const uniqueValues = valueMap.size;
      const topValues = Array.from(valueMap.entries())
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      stats.push({
        dimension,
        uniqueValues,
        topValues,
        isHighCardinality: uniqueValues > this.highCardinalityThreshold,
      });
    }

    return stats.sort((a, b) => b.uniqueValues - a.uniqueValues);
  }

  /**
   * Get metrics summary for time window
   */
  getMetricsSummary(timeWindowMs = 60 * 60 * 1000): {
    totalMetrics: number;
    metricsByName: Map<string, number>;
    dimensionBreakdown: Map<string, Map<string, number>>;
    averageLatency: number;
    errorRate: number;
  } {
    const cutoff = Date.now() - timeWindowMs;
    const recentMetrics = this.metrics.filter((m) => m.timestamp > cutoff);

    const metricsByName = new Map<string, number>();
    const dimensionBreakdown = new Map<string, Map<string, number>>();
    let totalLatency = 0;
    let latencyCount = 0;
    let totalRequests = 0;
    let errorCount = 0;

    for (const metric of recentMetrics) {
      // Count by metric name
      metricsByName.set(
        metric.metric_name,
        (metricsByName.get(metric.metric_name) || 0) + 1
      );

      // Track latency for average calculation
      if (metric.metric_name === "ai_request_latency") {
        totalLatency += metric.value;
        latencyCount++;
      }

      // Track requests and errors
      if (metric.metric_name === "ai_request_count") {
        totalRequests += metric.value;
        if (!metric.dimensions.success) {
          errorCount += metric.value;
        }
      }

      // Dimension breakdown
      for (const [dimName, dimValue] of Object.entries(metric.dimensions)) {
        if (typeof dimValue === "string") {
          if (!dimensionBreakdown.has(dimName)) {
            dimensionBreakdown.set(dimName, new Map());
          }
          const dimMap = dimensionBreakdown.get(dimName)!;
          dimMap.set(dimValue, (dimMap.get(dimValue) || 0) + 1);
        }
      }
    }

    return {
      totalMetrics: recentMetrics.length,
      metricsByName,
      dimensionBreakdown,
      averageLatency: latencyCount > 0 ? totalLatency / latencyCount : 0,
      errorRate: totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0,
    };
  }

  /**
   * Export metrics in CloudWatch format
   */
  exportCloudWatchMetrics(timeWindowMs = 5 * 60 * 1000): Array<{
    MetricName: string;
    Value: number;
    Unit: string;
    Dimensions: Array<{ Name: string; Value: string }>;
    Timestamp: Date;
  }> {
    const cutoff = Date.now() - timeWindowMs;
    const recentMetrics = this.metrics.filter((m) => m.timestamp > cutoff);

    return recentMetrics.map((metric) => ({
      MetricName: metric.metric_name,
      Value: metric.value,
      Unit: this.mapUnitToCloudWatch(metric.unit),
      Dimensions: this.convertDimensionsToCloudWatch(metric.dimensions),
      Timestamp: new Date(metric.timestamp),
    }));
  }

  /**
   * Sanitize dimensions to prevent high cardinality
   */
  private sanitizeDimensions(
    dimensions: Partial<TelemetryDimensions>
  ): TelemetryDimensions {
    return {
      provider: this.normalizeProvider(dimensions.provider || "unknown"),
      intent: this.normalizeIntent(dimensions.intent || "unknown"),
      role: this.normalizeRole(dimensions.role || "unknown"),
      region: this.normalizeRegion(dimensions.region || "eu-central-1"),
      token_counts: dimensions.token_counts || {
        prompt: 0,
        output: 0,
        total: 0,
      },
      tools_used: Boolean(dimensions.tools_used),
      cache_hit: Boolean(dimensions.cache_hit),
      latency_bucket: dimensions.latency_bucket || "unknown",
      success: Boolean(dimensions.success),
      error_type: this.normalizeErrorType(dimensions.error_type),
    };
  }

  /**
   * Normalize provider to known values
   */
  private normalizeProvider(provider: string): string {
    const knownProviders = ["bedrock", "google", "meta"];
    return knownProviders.includes(provider.toLowerCase())
      ? provider.toLowerCase()
      : "other";
  }

  /**
   * Normalize intent to known values
   */
  private normalizeIntent(intent: string): string {
    const knownIntents = ["generation", "rag_cached", "system", "audience"];
    const normalized = intent.toLowerCase().replace(/[^a-z_]/g, "_");
    return knownIntents.includes(normalized) ? normalized : "other";
  }

  /**
   * Normalize role to known values
   */
  private normalizeRole(role: string): string {
    const knownRoles = ["orchestrator", "user-worker", "audience-specialist"];
    return knownRoles.includes(role) ? role : "unknown";
  }

  /**
   * Normalize region to known values
   */
  private normalizeRegion(region: string): string {
    const knownRegions = [
      "eu-central-1",
      "eu-west-1",
      "us-east-1",
      "us-west-2",
    ];
    return knownRegions.includes(region) ? region : "other";
  }

  /**
   * Normalize error type to prevent high cardinality
   */
  private normalizeErrorType(errorType?: string): string | undefined {
    if (!errorType) return undefined;

    const knownErrorTypes = [
      "timeout",
      "rate_limit",
      "model_error",
      "network_error",
      "auth_error",
      "quota_exceeded",
      "invalid_request",
    ];

    const normalized = errorType.toLowerCase().replace(/[^a-z_]/g, "_");
    return (
      knownErrorTypes.find((known) => normalized.includes(known)) || "other"
    );
  }

  /**
   * Get latency bucket for grouping
   */
  private getLatencyBucket(latencyMs: number): string {
    if (latencyMs < 100) return "<100ms";
    if (latencyMs < 500) return "100-500ms";
    if (latencyMs < 1000) return "500ms-1s";
    if (latencyMs < 2000) return "1s-2s";
    if (latencyMs < 5000) return "2s-5s";
    return ">5s";
  }

  /**
   * Check cardinality before recording metric
   */
  private checkCardinality(dimensions: TelemetryDimensions): boolean {
    for (const [key, value] of Object.entries(dimensions)) {
      if (typeof value === "string") {
        const valueMap = this.dimensionValues.get(key);
        if (
          valueMap &&
          valueMap.size >= this.highCardinalityThreshold &&
          !valueMap.has(value)
        ) {
          return false; // Would exceed cardinality limit
        }
      }
    }
    return true;
  }

  /**
   * Update dimension value tracking
   */
  private updateDimensionTracking(dimensions: TelemetryDimensions): void {
    for (const [key, value] of Object.entries(dimensions)) {
      if (typeof value === "string") {
        if (!this.dimensionValues.has(key)) {
          this.dimensionValues.set(key, new Map());
        }
        const valueMap = this.dimensionValues.get(key)!;
        valueMap.set(value, (valueMap.get(value) || 0) + 1);
      }
    }
  }

  /**
   * Emit metric to monitoring system
   */
  private emitMetric(event: MetricEvent): void {
    // In production, this would send to CloudWatch, Datadog, etc.
    console.debug("Telemetry:", {
      metric: event.metric_name,
      value: event.value,
      unit: event.unit,
      provider: event.dimensions.provider,
      intent: event.dimensions.intent,
      role: event.dimensions.role,
      success: event.dimensions.success,
    });
  }

  /**
   * Convert dimensions to CloudWatch format
   */
  private convertDimensionsToCloudWatch(
    dimensions: TelemetryDimensions
  ): Array<{ Name: string; Value: string }> {
    const cwDimensions = [];

    // Core string dimensions
    cwDimensions.push(
      { Name: "Provider", Value: dimensions.provider },
      { Name: "Intent", Value: dimensions.intent },
      { Name: "Role", Value: dimensions.role },
      { Name: "Region", Value: dimensions.region },
      { Name: "LatencyBucket", Value: dimensions.latency_bucket }
    );

    // Boolean dimensions as strings
    cwDimensions.push(
      { Name: "ToolsUsed", Value: dimensions.tools_used.toString() },
      { Name: "CacheHit", Value: dimensions.cache_hit.toString() },
      { Name: "Success", Value: dimensions.success.toString() }
    );

    // Error type if present
    if (dimensions.error_type) {
      cwDimensions.push({ Name: "ErrorType", Value: dimensions.error_type });
    }

    return cwDimensions;
  }

  /**
   * Map internal units to CloudWatch units
   */
  private mapUnitToCloudWatch(unit: string): string {
    switch (unit) {
      case "count":
        return "Count";
      case "milliseconds":
        return "Milliseconds";
      case "bytes":
        return "Bytes";
      case "percent":
        return "Percent";
      default:
        return "None";
    }
  }

  /**
   * Reset all metrics and tracking (for testing)
   */
  reset(): void {
    this.metrics = [];
    this.dimensionValues.clear();
  }
}

// Singleton instance
export const telemetryDimensions = new TelemetryDimensions();
