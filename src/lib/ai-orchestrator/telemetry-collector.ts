/**
 * Telemetry Collector with Low-Cardinality Dimensions
 *
 * Ensures telemetry dimensions remain low-cardinality for efficient storage and querying
 * Prevents high-cardinality data from causing performance issues
 */
export interface TelemetryDimensions {
  provider: string;
  intent: "generation" | "rag_cached";
  role: "orchestrator" | "user-worker" | "audience-specialist";
  region: string;
  tools_used: boolean;
  cache_eligible: boolean;
  model_family: string; // e.g., 'claude-3', 'gemini-pro', 'llama-2'
}

export interface TelemetryMetric {
  name: string;
  value: number;
  dimensions: TelemetryDimensions;
  timestamp: number;
  unit: "ms" | "count" | "bytes" | "tokens" | "euro";
}

export interface TokenCounts {
  prompt: number;
  output: number;
  total: number;
}

export class TelemetryCollector {
  private metrics: TelemetryMetric[] = [];
  private readonly maxMetrics = 10000;
  private readonly allowedDimensions = new Set([
    "provider",
    "intent",
    "role",
    "region",
    "tools_used",
    "cache_eligible",
    "model_family",
  ]);

  // Cardinality limits to prevent explosion
  private readonly cardinalityLimits = {
    provider: new Set(["bedrock", "google", "meta", "unknown"]),
    intent: new Set(["generation", "rag_cached"]),
    role: new Set(["orchestrator", "user-worker", "audience-specialist"]),
    region: new Set(["us-east-1", "us-west-2", "eu-west-1", "ap-southeast-1"]),
    model_family: new Set(["claude-3", "gemini-pro", "llama-2", "unknown"]),
  };

  recordLatency(
    provider: string,
    latency: number,
    context: {
      operation: "generation" | "rag" | "cached";
      role: "orchestrator" | "user-worker" | "audience-specialist";
      requestId: string;
      modelId?: string;
      toolsUsed?: boolean;
      cacheEligible?: boolean;
      tokenCounts?: TokenCounts;
      region?: string;
    }
  ): void {
    const dimensions = this.sanitizeDimensions({
      provider: this.sanitizeProvider(provider),
      intent: context.operation === "cached" ? "rag_cached" : context.operation,
      role: context.role,
      region: context.region || "us-east-1",
      tools_used: context.toolsUsed || false,
      cache_eligible: context.cacheEligible || false,
      model_family: this.extractModelFamily(context.modelId || "unknown"),
    });

    this.addMetric("ai.latency", latency, dimensions, "ms");

    // Record token counts if available
    if (context.tokenCounts) {
      this.addMetric(
        "ai.tokens.prompt",
        context.tokenCounts.prompt,
        dimensions,
        "tokens"
      );
      this.addMetric(
        "ai.tokens.output",
        context.tokenCounts.output,
        dimensions,
        "tokens"
      );
      this.addMetric(
        "ai.tokens.total",
        context.tokenCounts.total,
        dimensions,
        "tokens"
      );
    }
  }

  recordCost(
    provider: string,
    cost: number,
    context: {
      operation: "generation" | "rag" | "cached";
      role: "orchestrator" | "user-worker" | "audience-specialist";
      modelId?: string;
      tokenCounts?: TokenCounts;
      region?: string;
    }
  ): void {
    const dimensions = this.sanitizeDimensions({
      provider: this.sanitizeProvider(provider),
      intent: context.operation === "cached" ? "rag_cached" : context.operation,
      role: context.role,
      region: context.region || "us-east-1",
      tools_used: false, // Cost doesn't depend on tools
      cache_eligible: false, // Cost doesn't depend on cache eligibility
      model_family: this.extractModelFamily(context.modelId || "unknown"),
    });

    this.addMetric("ai.cost", cost, dimensions, "euro");
  }

  recordCacheHit(
    provider: string,
    hit: boolean,
    context: {
      operation: "generation" | "rag" | "cached";
      role: "orchestrator" | "user-worker" | "audience-specialist";
      region?: string;
    }
  ): void {
    const dimensions = this.sanitizeDimensions({
      provider: this.sanitizeProvider(provider),
      intent: context.operation === "cached" ? "rag_cached" : context.operation,
      role: context.role,
      region: context.region || "us-east-1",
      tools_used: false,
      cache_eligible: true, // Only eligible requests are recorded
      model_family: "unknown", // Cache hits don't depend on model
    });

    this.addMetric("ai.cache.hit", hit ? 1 : 0, dimensions, "count");
  }

  recordError(
    provider: string,
    errorType: string,
    context: {
      operation: "generation" | "rag" | "cached";
      role: "orchestrator" | "user-worker" | "audience-specialist";
      region?: string;
    }
  ): void {
    const dimensions = this.sanitizeDimensions({
      provider: this.sanitizeProvider(provider),
      intent: context.operation === "cached" ? "rag_cached" : context.operation,
      role: context.role,
      region: context.region || "us-east-1",
      tools_used: false,
      cache_eligible: false,
      model_family: "unknown",
    });

    this.addMetric("ai.errors", 1, dimensions, "count");
  }

  private addMetric(
    name: string,
    value: number,
    dimensions: TelemetryDimensions,
    unit: "ms" | "count" | "bytes" | "tokens" | "euro"
  ): void {
    const metric: TelemetryMetric = {
      name,
      value,
      dimensions,
      timestamp: Date.now(),
      unit,
    };

    this.metrics.push(metric);

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  private sanitizeDimensions(dimensions: any): TelemetryDimensions {
    return {
      provider: this.cardinalityLimits.provider.has(dimensions.provider)
        ? dimensions.provider
        : "unknown",
      intent: this.cardinalityLimits.intent.has(dimensions.intent)
        ? dimensions.intent
        : "generation",
      role: this.cardinalityLimits.role.has(dimensions.role)
        ? dimensions.role
        : "user-worker",
      region: this.cardinalityLimits.region.has(dimensions.region)
        ? dimensions.region
        : "us-east-1",
      tools_used: Boolean(dimensions.tools_used),
      cache_eligible: Boolean(dimensions.cache_eligible),
      model_family: this.cardinalityLimits.model_family.has(
        dimensions.model_family
      )
        ? dimensions.model_family
        : "unknown",
    };
  }

  private sanitizeProvider(provider: string): string {
    const normalized = provider.toLowerCase();
    if (this.cardinalityLimits.provider.has(normalized)) {
      return normalized;
    }
    return "unknown";
  }

  private extractModelFamily(modelId: string): string {
    const normalized = modelId.toLowerCase();

    if (normalized.includes("claude")) return "claude-3";
    if (normalized.includes("gemini")) return "gemini-pro";
    if (normalized.includes("llama")) return "llama-2";

    return "unknown";
  }

  getMetrics(windowMs = 60 * 60 * 1000): TelemetryMetric[] {
    const cutoff = Date.now() - windowMs;
    return this.metrics.filter((m) => m.timestamp > cutoff);
  }

  getMetricsByDimension(
    metricName: string,
    dimension: keyof TelemetryDimensions,
    windowMs = 60 * 60 * 1000
  ): Record<string, TelemetryMetric[]> {
    const recentMetrics = this.getMetrics(windowMs).filter(
      (m) => m.name === metricName
    );

    const grouped: Record<string, TelemetryMetric[]> = {};
    recentMetrics.forEach((metric) => {
      const key = String(metric.dimensions[dimension]);
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(metric);
    });

    return grouped;
  }

  getAggregatedMetrics(
    metricName: string,
    aggregation: "sum" | "avg" | "p95" | "p99",
    windowMs = 60 * 60 * 1000
  ): Record<string, number> {
    const grouped = this.getMetricsByDimension(
      metricName,
      "provider",
      windowMs
    );
    const result: Record<string, number> = {};

    Object.entries(grouped).forEach(([provider, metrics]) => {
      const values = metrics.map((m) => m.value).sort((a, b) => a - b);

      switch (aggregation) {
        case "sum":
          result[provider] = values.reduce((sum, val) => sum + val, 0);
          break;
        case "avg":
          result[provider] =
            values.reduce((sum, val) => sum + val, 0) / values.length;
          break;
        case "p95":
          const p95Index = Math.floor(values.length * 0.95);
          result[provider] = values[p95Index] || 0;
          break;
        case "p99":
          const p99Index = Math.floor(values.length * 0.99);
          result[provider] = values[p99Index] || 0;
          break;
      }
    });

    return result;
  }

  exportForCloudWatch(): Array<{
    MetricName: string;
    Value: number;
    Unit: string;
    Dimensions: Array<{ Name: string; Value: string }>;
    Timestamp: Date;
  }> {
    return this.getMetrics(5 * 60 * 1000).map((metric) => ({
      MetricName: metric.name,
      Value: metric.value,
      Unit:
        metric.unit === "ms"
          ? "Milliseconds"
          : metric.unit === "euro"
          ? "None"
          : metric.unit === "tokens"
          ? "Count"
          : "Count",
      Dimensions: Object.entries(metric.dimensions).map(([name, value]) => ({
        Name: name,
        Value: String(value),
      })),
      Timestamp: new Date(metric.timestamp),
    }));
  }

  getCardinalityReport(): Record<string, number> {
    const report: Record<string, number> = {};
    const recentMetrics = this.getMetrics();

    Object.keys(this.cardinalityLimits).forEach((dimension) => {
      const uniqueValues = new Set();
      recentMetrics.forEach((metric) => {
        uniqueValues.add(
          metric.dimensions[dimension as keyof TelemetryDimensions]
        );
      });
      report[dimension] = uniqueValues.size;
    });

    return report;
  }

  reset(): void {
    this.metrics = [];
  }
}

export const telemetryCollector = new TelemetryCollector();
