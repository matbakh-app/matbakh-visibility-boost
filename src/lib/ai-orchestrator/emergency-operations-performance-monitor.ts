/**
 * Emergency Operations Performance Monitor
 *
 * Tracks and validates that emergency operations complete within 5 seconds
 * with a success rate > 95% as required by the Bedrock Activation specification.
 *
 * Key Requirements:
 * - Emergency operations must complete within 5 seconds
 * - Success rate must be > 95% over a rolling window
 * - Real-time monitoring and alerting
 * - Integration with existing monitoring systems
 */

import { AuditTrailSystem } from "./audit-trail-system";
import { CircuitBreaker } from "./circuit-breaker";

// Performance Metrics for Emergency and Critical Operations
export interface EmergencyOperationMetrics {
  operationId: string;
  timestamp: Date;
  latencyMs: number;
  success: boolean;
  withinSLA: boolean; // < 5000ms for emergency, < 10000ms for critical
  operationType: string;
  priority: "emergency" | "critical"; // Track operation priority
  correlationId?: string;
  error?: string;
}

// Performance Statistics
export interface EmergencyPerformanceStats {
  totalOperations: number;
  successfulOperations: number;
  operationsWithinSLA: number;
  successRate: number; // percentage
  slaComplianceRate: number; // percentage
  averageLatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  lastUpdated: Date;
  windowStartTime: Date;
  windowEndTime: Date;
  // Separate stats for emergency vs critical operations
  emergencyOperations: {
    total: number;
    successful: number;
    withinSLA: number;
    averageLatencyMs: number;
  };
  criticalOperations: {
    total: number;
    successful: number;
    withinSLA: number;
    averageLatencyMs: number;
  };
}

// Alert Configuration
export interface EmergencyPerformanceAlert {
  type:
    | "SLA_BREACH"
    | "SUCCESS_RATE_LOW"
    | "LATENCY_HIGH"
    | "CIRCUIT_BREAKER_OPEN";
  severity: "WARNING" | "CRITICAL";
  message: string;
  timestamp: Date;
  metrics: EmergencyPerformanceStats;
  threshold: number;
  actualValue: number;
}

// Configuration for Performance Monitor
export interface EmergencyPerformanceConfig {
  emergencySlaThresholdMs: number; // 5000ms for emergency operations
  criticalSlaThresholdMs: number; // 10000ms for critical operations
  successRateThreshold: number; // 95% minimum success rate
  rollingWindowMinutes: number; // Time window for calculations
  alertingEnabled: boolean;
  circuitBreakerEnabled: boolean;
  maxMetricsRetention: number; // Maximum metrics to keep in memory
}

/**
 * Emergency Operations Performance Monitor
 *
 * Provides real-time monitoring and validation of emergency operation performance
 * with automatic alerting when SLA thresholds are breached.
 */
export class EmergencyOperationsPerformanceMonitor {
  private metrics: EmergencyOperationMetrics[] = [];
  private alerts: EmergencyPerformanceAlert[] = [];
  private auditTrail: AuditTrailSystem;
  private circuitBreaker?: CircuitBreaker;
  private config: EmergencyPerformanceConfig;

  constructor(
    config: Partial<EmergencyPerformanceConfig> = {},
    auditTrail?: AuditTrailSystem,
    circuitBreaker?: CircuitBreaker
  ) {
    this.config = {
      emergencySlaThresholdMs: 5000, // 5 seconds for emergency operations
      criticalSlaThresholdMs: 10000, // 10 seconds for critical operations
      successRateThreshold: 95, // 95% minimum success rate
      rollingWindowMinutes: 60, // 1 hour rolling window
      alertingEnabled: true,
      circuitBreakerEnabled: true,
      maxMetricsRetention: 1000, // Keep last 1000 metrics
      ...config,
    };

    this.auditTrail = auditTrail || new AuditTrailSystem();
    this.circuitBreaker = circuitBreaker;
  }

  /**
   * Record an emergency operation performance metric
   */
  async recordEmergencyOperation(
    operationId: string,
    latencyMs: number,
    success: boolean,
    operationType: string = "emergency",
    correlationId?: string,
    error?: string,
    priority: "emergency" | "critical" = "emergency"
  ): Promise<void> {
    // Determine SLA threshold based on priority
    const slaThreshold =
      priority === "emergency"
        ? this.config.emergencySlaThresholdMs
        : this.config.criticalSlaThresholdMs;

    const metric: EmergencyOperationMetrics = {
      operationId,
      timestamp: new Date(),
      latencyMs,
      success,
      withinSLA: latencyMs < slaThreshold,
      operationType,
      priority,
      correlationId,
      error,
    };

    // Add to metrics collection
    this.metrics.push(metric);

    // Maintain metrics retention limit
    if (this.metrics.length > this.config.maxMetricsRetention) {
      this.metrics = this.metrics.slice(-this.config.maxMetricsRetention);
    }

    // Log to audit trail
    await this.auditTrail.logEvent({
      eventType: "emergency_operation_performance",
      userId: "system",
      action: "record_metric",
      resource: `emergency_operation:${operationId}`,
      metadata: {
        latencyMs,
        success,
        withinSLA: metric.withinSLA,
        operationType,
        correlationId,
      },
      timestamp: new Date(),
      ipAddress: "127.0.0.1",
      userAgent: "EmergencyOperationsPerformanceMonitor",
    });

    // Check for SLA breaches and trigger alerts
    await this.checkPerformanceThresholds();
  }

  /**
   * Get current performance statistics for the rolling window
   */
  getCurrentPerformanceStats(): EmergencyPerformanceStats {
    const windowStart = new Date(
      Date.now() - this.config.rollingWindowMinutes * 60 * 1000
    );
    const windowMetrics = this.metrics.filter(
      (m) => m.timestamp >= windowStart
    );

    if (windowMetrics.length === 0) {
      return {
        totalOperations: 0,
        successfulOperations: 0,
        operationsWithinSLA: 0,
        successRate: 100,
        slaComplianceRate: 100,
        averageLatencyMs: 0,
        p95LatencyMs: 0,
        p99LatencyMs: 0,
        lastUpdated: new Date(),
        windowStartTime: windowStart,
        windowEndTime: new Date(),
      };
    }

    const successfulOps = windowMetrics.filter((m) => m.success).length;
    const slaCompliantOps = windowMetrics.filter((m) => m.withinSLA).length;
    const latencies = windowMetrics
      .map((m) => m.latencyMs)
      .sort((a, b) => a - b);

    // Separate emergency and critical operations
    const emergencyOps = windowMetrics.filter(
      (m) => m.priority === "emergency"
    );
    const criticalOps = windowMetrics.filter((m) => m.priority === "critical");

    const stats: EmergencyPerformanceStats = {
      totalOperations: windowMetrics.length,
      successfulOperations: successfulOps,
      operationsWithinSLA: slaCompliantOps,
      successRate: (successfulOps / windowMetrics.length) * 100,
      slaComplianceRate: (slaCompliantOps / windowMetrics.length) * 100,
      averageLatencyMs:
        latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length,
      p95LatencyMs: this.calculatePercentile(latencies, 95),
      p99LatencyMs: this.calculatePercentile(latencies, 99),
      lastUpdated: new Date(),
      emergencyOperations: {
        total: emergencyOps.length,
        successful: emergencyOps.filter((m) => m.success).length,
        withinSLA: emergencyOps.filter((m) => m.withinSLA).length,
        averageLatencyMs:
          emergencyOps.length > 0
            ? emergencyOps.reduce((sum, m) => sum + m.latencyMs, 0) /
              emergencyOps.length
            : 0,
      },
      criticalOperations: {
        total: criticalOps.length,
        successful: criticalOps.filter((m) => m.success).length,
        withinSLA: criticalOps.filter((m) => m.withinSLA).length,
        averageLatencyMs:
          criticalOps.length > 0
            ? criticalOps.reduce((sum, m) => sum + m.latencyMs, 0) /
              criticalOps.length
            : 0,
      },
      windowStartTime: windowStart,
      windowEndTime: new Date(),
    };

    return stats;
  }

  /**
   * Check if current performance meets SLA requirements
   */
  isPerformanceWithinSLA(): boolean {
    const stats = this.getCurrentPerformanceStats();

    // Must have at least some operations to validate
    if (stats.totalOperations === 0) {
      return true; // No operations = no violations
    }

    // Check both success rate and SLA compliance rate
    return (
      stats.successRate >= this.config.successRateThreshold &&
      stats.slaComplianceRate >= this.config.successRateThreshold
    );
  }

  /**
   * Check if critical operations specifically meet SLA requirements (>95% within 10s)
   */
  isCriticalOperationsPerformanceWithinSLA(): boolean {
    const stats = this.getCurrentPerformanceStats();

    // Must have at least some critical operations to validate
    if (stats.criticalOperations.total === 0) {
      return true; // No critical operations = no violations
    }

    const criticalSuccessRate =
      (stats.criticalOperations.successful / stats.criticalOperations.total) *
      100;
    const criticalSlaComplianceRate =
      (stats.criticalOperations.withinSLA / stats.criticalOperations.total) *
      100;

    // Check both success rate and SLA compliance rate for critical operations
    return (
      criticalSuccessRate >= this.config.successRateThreshold &&
      criticalSlaComplianceRate >= this.config.successRateThreshold
    );
  }

  /**
   * Check if emergency operations specifically meet SLA requirements (>95% within 5s)
   */
  isEmergencyOperationsPerformanceWithinSLA(): boolean {
    const stats = this.getCurrentPerformanceStats();

    // Must have at least some emergency operations to validate
    if (stats.emergencyOperations.total === 0) {
      return true; // No emergency operations = no violations
    }

    const emergencySuccessRate =
      (stats.emergencyOperations.successful / stats.emergencyOperations.total) *
      100;
    const emergencySlaComplianceRate =
      (stats.emergencyOperations.withinSLA / stats.emergencyOperations.total) *
      100;

    // Check both success rate and SLA compliance rate for emergency operations
    return (
      emergencySuccessRate >= this.config.successRateThreshold &&
      emergencySlaComplianceRate >= this.config.successRateThreshold
    );
  }

  /**
   * Get recent alerts
   */
  getRecentAlerts(limitHours: number = 24): EmergencyPerformanceAlert[] {
    const cutoff = new Date(Date.now() - limitHours * 60 * 60 * 1000);
    return this.alerts.filter((alert) => alert.timestamp >= cutoff);
  }

  /**
   * Get detailed performance report
   */
  getPerformanceReport(): {
    stats: EmergencyPerformanceStats;
    isWithinSLA: boolean;
    recentAlerts: EmergencyPerformanceAlert[];
    recommendations: string[];
  } {
    const stats = this.getCurrentPerformanceStats();
    const isWithinSLA = this.isPerformanceWithinSLA();
    const recentAlerts = this.getRecentAlerts();

    const recommendations: string[] = [];

    if (stats.slaComplianceRate < this.config.successRateThreshold) {
      recommendations.push(
        `SLA compliance rate (${stats.slaComplianceRate.toFixed(
          1
        )}%) is below threshold (${
          this.config.successRateThreshold
        }%). Consider optimizing emergency operation processing.`
      );
    }

    if (stats.successRate < this.config.successRateThreshold) {
      recommendations.push(
        `Success rate (${stats.successRate.toFixed(1)}%) is below threshold (${
          this.config.successRateThreshold
        }%). Investigate error patterns and improve error handling.`
      );
    }

    if (stats.p95LatencyMs > this.config.slaThresholdMs * 0.8) {
      recommendations.push(
        `P95 latency (${stats.p95LatencyMs}ms) is approaching SLA threshold (${this.config.slaThresholdMs}ms). Consider performance optimizations.`
      );
    }

    if (stats.totalOperations < 10) {
      recommendations.push(
        "Low operation volume may not provide statistically significant performance metrics. Consider longer monitoring periods."
      );
    }

    return {
      stats,
      isWithinSLA,
      recentAlerts,
      recommendations,
    };
  }

  /**
   * Reset performance metrics (for testing or maintenance)
   */
  resetMetrics(): void {
    this.metrics = [];
    this.alerts = [];
  }

  /**
   * Export performance data for external monitoring systems
   */
  exportMetrics(): {
    metrics: EmergencyOperationMetrics[];
    stats: EmergencyPerformanceStats;
    config: EmergencyPerformanceConfig;
  } {
    return {
      metrics: [...this.metrics],
      stats: this.getCurrentPerformanceStats(),
      config: { ...this.config },
    };
  }

  /**
   * Check performance thresholds and trigger alerts if necessary
   */
  private async checkPerformanceThresholds(): Promise<void> {
    if (!this.config.alertingEnabled) {
      return;
    }

    const stats = this.getCurrentPerformanceStats();

    // Check SLA compliance rate
    if (stats.slaComplianceRate < this.config.successRateThreshold) {
      await this.triggerAlert({
        type: "SLA_BREACH",
        severity: "CRITICAL",
        message: `Emergency operations SLA compliance rate (${stats.slaComplianceRate.toFixed(
          1
        )}%) is below threshold (${this.config.successRateThreshold}%)`,
        timestamp: new Date(),
        metrics: stats,
        threshold: this.config.successRateThreshold,
        actualValue: stats.slaComplianceRate,
      });
    }

    // Check success rate
    if (stats.successRate < this.config.successRateThreshold) {
      await this.triggerAlert({
        type: "SUCCESS_RATE_LOW",
        severity: "CRITICAL",
        message: `Emergency operations success rate (${stats.successRate.toFixed(
          1
        )}%) is below threshold (${this.config.successRateThreshold}%)`,
        timestamp: new Date(),
        metrics: stats,
        threshold: this.config.successRateThreshold,
        actualValue: stats.successRate,
      });
    }

    // Check P95 latency
    if (stats.p95LatencyMs > this.config.slaThresholdMs) {
      await this.triggerAlert({
        type: "LATENCY_HIGH",
        severity: "WARNING",
        message: `Emergency operations P95 latency (${stats.p95LatencyMs}ms) exceeds SLA threshold (${this.config.slaThresholdMs}ms)`,
        timestamp: new Date(),
        metrics: stats,
        threshold: this.config.slaThresholdMs,
        actualValue: stats.p95LatencyMs,
      });
    }

    // Check circuit breaker state
    if (this.circuitBreaker && this.config.circuitBreakerEnabled) {
      const cbState = this.circuitBreaker.getState();
      if (cbState === "open") {
        await this.triggerAlert({
          type: "CIRCUIT_BREAKER_OPEN",
          severity: "CRITICAL",
          message:
            "Emergency operations circuit breaker is open - operations are being blocked",
          timestamp: new Date(),
          metrics: stats,
          threshold: 0,
          actualValue: 1,
        });
      }
    }
  }

  /**
   * Trigger a performance alert
   */
  private async triggerAlert(alert: EmergencyPerformanceAlert): Promise<void> {
    // Add to alerts collection
    this.alerts.push(alert);

    // Keep only recent alerts (last 24 hours)
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    this.alerts = this.alerts.filter((a) => a.timestamp >= cutoff);

    // Log alert to audit trail
    await this.auditTrail.logEvent({
      eventType: "emergency_performance_alert",
      userId: "system",
      action: "trigger_alert",
      resource: `alert:${alert.type}`,
      metadata: {
        alertType: alert.type,
        severity: alert.severity,
        message: alert.message,
        threshold: alert.threshold,
        actualValue: alert.actualValue,
        stats: alert.metrics,
      },
      timestamp: new Date(),
      ipAddress: "127.0.0.1",
      userAgent: "EmergencyOperationsPerformanceMonitor",
    });

    // Log to console for immediate visibility
    console.warn(
      `🚨 Emergency Operations Performance Alert [${alert.severity}]: ${alert.message}`
    );
  }

  /**
   * Calculate percentile from sorted array
   */
  private calculatePercentile(
    sortedArray: number[],
    percentile: number
  ): number {
    if (sortedArray.length === 0) return 0;

    const index = (percentile / 100) * (sortedArray.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);

    if (lower === upper) {
      return sortedArray[lower];
    }

    const weight = index - lower;
    return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
  }
}

/**
 * Singleton instance for global emergency operations monitoring
 */
export const emergencyOperationsMonitor =
  new EmergencyOperationsPerformanceMonitor();
