/**
 * P95 Latency Monitor for AI Orchestration
 *
 * Implements specific P95 latency targets:
 * - Generation: ≤ 1.5s (1500ms)
 * - RAG only/cached: ≤ 300ms
 *
 * Features:
 * - Real-time P95 calculation
 * - Operation-specific targets
 * - Automated alerting
 * - Performance degradation detection
 * - Circuit breaker integration
 */

import { EventEmitter } from "events";

export interface P95LatencyMetric {
  requestId: string;
  operation: "generation" | "rag" | "cached";
  latency: number;
  timestamp: number;
  provider?: string;
  modelId?: string;
  cacheHit?: boolean;
  tokenCount?: number;
  cost?: number;
}

export interface P95Targets {
  generation: number; // 1500ms
  rag: number; // 300ms
  cached: number; // 300ms
}

export interface P95Alert {
  type: "p95_breach" | "latency_spike" | "cache_miss_rate";
  operation: string;
  currentValue: number;
  threshold: number;
  timestamp: number;
  severity: "warning" | "critical";
  provider?: string;
}

export interface P95Status {
  p95Latencies: Record<string, number>;
  cacheHitRate: number;
  activeRequests: number;
  targetsStatus: Record<string, boolean>;
  alertsLast24h: number;
  performanceGrade: "A" | "B" | "C" | "D" | "F";
}

export class P95LatencyMonitor extends EventEmitter {
  private metrics: P95LatencyMetric[] = [];
  private readonly maxMetrics = 10000;
  private readonly timeWindowMs = 300000; // 5 minutes

  private readonly p95Targets: P95Targets = {
    generation: 1500, // 1.5s
    rag: 300, // 300ms
    cached: 300, // 300ms
  };

  private activeRequests = new Map<
    string,
    { startTime: number; operation: string }
  >();
  private alerts: P95Alert[] = [];

  constructor() {
    super();
    this.startPeriodicChecks();
  }

  /**
   * Record the start of a request
   */
  recordRequestStart(
    requestId: string,
    operation: "generation" | "rag" | "cached"
  ): void {
    this.activeRequests.set(requestId, {
      startTime: Date.now(),
      operation,
    });
  }

  /**
   * Record the completion of a request
   */
  recordRequestComplete(
    requestId: string,
    provider?: string,
    modelId?: string,
    cacheHit?: boolean,
    tokenCount?: number,
    cost?: number
  ): void {
    const requestInfo = this.activeRequests.get(requestId);
    if (!requestInfo) {
      console.warn(`No start time found for request ${requestId}`);
      return;
    }

    const latency = Date.now() - requestInfo.startTime;

    const metric: P95LatencyMetric = {
      requestId,
      operation: requestInfo.operation,
      latency,
      timestamp: Date.now(),
      provider,
      modelId,
      cacheHit,
      tokenCount,
      cost,
    };

    this.recordMetric(metric);
    this.activeRequests.delete(requestId);
  }

  /**
   * Record a latency metric
   */
  recordMetric(metric: P95LatencyMetric): void {
    this.metrics.push(metric);

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Check for immediate latency spikes
    this.checkLatencySpike(metric);
  }

  /**
   * Calculate P95 latency for a specific operation
   */
  getP95Latency(
    operation: "generation" | "rag" | "cached",
    timeWindowMs = this.timeWindowMs
  ): number {
    const cutoff = Date.now() - timeWindowMs;
    const relevantMetrics = this.metrics
      .filter((m) => m.operation === operation && m.timestamp > cutoff)
      .map((m) => m.latency)
      .sort((a, b) => a - b);

    if (relevantMetrics.length === 0) return 0;

    const p95Index = Math.ceil(relevantMetrics.length * 0.95) - 1;
    return relevantMetrics[p95Index] || 0;
  }

  /**
   * Calculate cache hit rate
   */
  getCacheHitRate(timeWindowMs = this.timeWindowMs): number {
    const cutoff = Date.now() - timeWindowMs;
    const relevantMetrics = this.metrics.filter((m) => m.timestamp > cutoff);

    if (relevantMetrics.length === 0) return 0;

    const cacheHits = relevantMetrics.filter((m) => m.cacheHit === true).length;
    return (cacheHits / relevantMetrics.length) * 100;
  }

  /**
   * Get comprehensive performance status
   */
  getPerformanceStatus(): P95Status {
    const p95Latencies = {
      generation: this.getP95Latency("generation"),
      rag: this.getP95Latency("rag"),
      cached: this.getP95Latency("cached"),
    };

    const targetsStatus = {
      generation: p95Latencies.generation <= this.p95Targets.generation,
      rag: p95Latencies.rag <= this.p95Targets.rag,
      cached: p95Latencies.cached <= this.p95Targets.cached,
    };

    const cacheHitRate = this.getCacheHitRate();
    const alertsLast24h = this.getAlertsCount(24 * 60 * 60 * 1000);
    const performanceGrade = this.calculatePerformanceGrade(
      targetsStatus,
      cacheHitRate
    );

    return {
      p95Latencies,
      cacheHitRate,
      activeRequests: this.activeRequests.size,
      targetsStatus,
      alertsLast24h,
      performanceGrade,
    };
  }

  /**
   * Get performance report with detailed metrics
   */
  getPerformanceReport(): {
    status: P95Status;
    averageLatencies: Record<string, number>;
    maxLatencies: Record<string, number>;
    requestCounts: Record<string, number>;
    totalCost: number;
    recentAlerts: P95Alert[];
  } {
    const status = this.getPerformanceStatus();
    const cutoff = Date.now() - this.timeWindowMs;
    const recentMetrics = this.metrics.filter((m) => m.timestamp > cutoff);

    const averageLatencies: Record<string, number> = {};
    const maxLatencies: Record<string, number> = {};
    const requestCounts: Record<string, number> = {};

    ["generation", "rag", "cached"].forEach((operation) => {
      const operationMetrics = recentMetrics.filter(
        (m) => m.operation === operation
      );

      if (operationMetrics.length > 0) {
        const latencies = operationMetrics.map((m) => m.latency);
        averageLatencies[operation] =
          latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length;
        maxLatencies[operation] = Math.max(...latencies);
        requestCounts[operation] = operationMetrics.length;
      } else {
        averageLatencies[operation] = 0;
        maxLatencies[operation] = 0;
        requestCounts[operation] = 0;
      }
    });

    const totalCost = recentMetrics
      .filter((m) => m.cost !== undefined)
      .reduce((sum, m) => sum + (m.cost || 0), 0);

    const recentAlerts = this.alerts
      .filter((a) => a.timestamp > cutoff)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10);

    return {
      status,
      averageLatencies,
      maxLatencies,
      requestCounts,
      totalCost,
      recentAlerts,
    };
  }

  /**
   * Check for immediate latency spikes
   */
  private checkLatencySpike(metric: P95LatencyMetric): void {
    const target = this.p95Targets[metric.operation];

    // Alert if latency is 2x the target
    if (metric.latency > target * 2) {
      const alert: P95Alert = {
        type: "latency_spike",
        operation: metric.operation,
        currentValue: metric.latency,
        threshold: target,
        timestamp: Date.now(),
        severity: "critical",
        provider: metric.provider,
      };

      this.addAlert(alert);
    }
  }

  /**
   * Start periodic P95 target checks
   */
  private startPeriodicChecks(): void {
    setInterval(() => {
      this.checkP95Targets();
      this.checkCacheHitRate();
      this.cleanupOldMetrics();
    }, 60000); // Check every minute
  }

  /**
   * Check P95 targets and generate alerts
   */
  private checkP95Targets(): void {
    Object.entries(this.p95Targets).forEach(([operation, target]) => {
      const currentP95 = this.getP95Latency(operation as any);

      if (currentP95 > target) {
        const alert: P95Alert = {
          type: "p95_breach",
          operation,
          currentValue: currentP95,
          threshold: target,
          timestamp: Date.now(),
          severity: currentP95 > target * 1.5 ? "critical" : "warning",
        };

        this.addAlert(alert);
      }
    });
  }

  /**
   * Check cache hit rate
   */
  private checkCacheHitRate(): void {
    const hitRate = this.getCacheHitRate();
    const target = 80; // Target: >80%

    if (hitRate < target) {
      const alert: P95Alert = {
        type: "cache_miss_rate",
        operation: "cache",
        currentValue: hitRate,
        threshold: target,
        timestamp: Date.now(),
        severity: hitRate < 60 ? "critical" : "warning",
      };

      this.addAlert(alert);
    }
  }

  /**
   * Add alert and emit event
   */
  private addAlert(alert: P95Alert): void {
    this.alerts.push(alert);

    // Keep only recent alerts
    const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24 hours
    this.alerts = this.alerts.filter((a) => a.timestamp > cutoff);

    this.emit("alert", alert);

    console.warn(`P95 Latency Alert [${alert.severity.toUpperCase()}]:`, {
      type: alert.type,
      operation: alert.operation,
      currentValue: alert.currentValue,
      threshold: alert.threshold,
      provider: alert.provider,
    });
  }

  /**
   * Get alerts count for a time window
   */
  private getAlertsCount(timeWindowMs: number): number {
    const cutoff = Date.now() - timeWindowMs;
    return this.alerts.filter((a) => a.timestamp > cutoff).length;
  }

  /**
   * Calculate performance grade
   */
  private calculatePerformanceGrade(
    targetsStatus: Record<string, boolean>,
    cacheHitRate: number
  ): "A" | "B" | "C" | "D" | "F" {
    const targetsMet = Object.values(targetsStatus).filter(Boolean).length;
    const totalTargets = Object.keys(targetsStatus).length;
    const targetScore = (targetsMet / totalTargets) * 100;

    const cacheScore = Math.min(cacheHitRate, 100);
    const overallScore = targetScore * 0.7 + cacheScore * 0.3;

    if (overallScore >= 95) return "A";
    if (overallScore >= 85) return "B";
    if (overallScore >= 75) return "C";
    if (overallScore >= 65) return "D";
    return "F";
  }

  /**
   * Clean up old metrics
   */
  private cleanupOldMetrics(): void {
    const cutoff = Date.now() - 60 * 60 * 1000; // Keep 1 hour of metrics
    this.metrics = this.metrics.filter((m) => m.timestamp > cutoff);
  }

  /**
   * Reset all metrics and alerts
   */
  reset(): void {
    this.metrics = [];
    this.alerts = [];
    this.activeRequests.clear();
  }

  /**
   * Get metrics for a specific operation
   */
  getOperationMetrics(
    operation: "generation" | "rag" | "cached",
    timeWindowMs = this.timeWindowMs
  ): P95LatencyMetric[] {
    const cutoff = Date.now() - timeWindowMs;
    return this.metrics.filter(
      (m) => m.operation === operation && m.timestamp > cutoff
    );
  }

  /**
   * Get provider performance comparison
   */
  getProviderComparison(timeWindowMs = this.timeWindowMs): Record<
    string,
    {
      averageLatency: number;
      p95Latency: number;
      requestCount: number;
      errorRate: number;
    }
  > {
    const cutoff = Date.now() - timeWindowMs;
    const recentMetrics = this.metrics.filter(
      (m) => m.timestamp > cutoff && m.provider
    );

    const providerStats: Record<
      string,
      {
        latencies: number[];
        requestCount: number;
        errorCount: number;
      }
    > = {};

    recentMetrics.forEach((metric) => {
      if (!metric.provider) return;

      if (!providerStats[metric.provider]) {
        providerStats[metric.provider] = {
          latencies: [],
          requestCount: 0,
          errorCount: 0,
        };
      }

      providerStats[metric.provider].latencies.push(metric.latency);
      providerStats[metric.provider].requestCount++;
    });

    const result: Record<string, any> = {};

    Object.entries(providerStats).forEach(([provider, stats]) => {
      const sortedLatencies = stats.latencies.sort((a, b) => a - b);
      const p95Index = Math.ceil(sortedLatencies.length * 0.95) - 1;

      result[provider] = {
        averageLatency:
          stats.latencies.reduce((sum, lat) => sum + lat, 0) /
          stats.latencies.length,
        p95Latency: sortedLatencies[p95Index] || 0,
        requestCount: stats.requestCount,
        errorRate: (stats.errorCount / stats.requestCount) * 100,
      };
    });

    return result;
  }
}

// Singleton instance
export const p95LatencyMonitor = new P95LatencyMonitor();
