/**
 * Comprehensive SLO Monitoring Service
 *
 * Integrates all monitoring systems and provides unified SLO tracking,
 * alerting, and reporting capabilities.
 */

import { p95LatencyMonitor } from "@/lib/ai-orchestrator/p95-latency-monitor";
import { performanceMonitoring } from "@/lib/performance-monitoring";
import { EventEmitter } from "events";

export interface SLODefinition {
  id: string;
  name: string;
  description: string;
  category: "performance" | "availability" | "quality" | "cost" | "security";
  metric: string;
  target: number;
  unit: string;
  operator: "lt" | "lte" | "gt" | "gte" | "eq";
  errorBudget: number; // percentage (0-100)
  alertThresholds: {
    warning: number;
    critical: number;
  };
  burnRateThresholds: {
    warning: { short: number; long: number };
    critical: { short: number; long: number };
  };
  enabled: boolean;
  tags: string[];
}

export interface SLOStatus {
  sloId: string;
  currentValue: number;
  targetValue: number;
  compliance: number; // percentage (0-100)
  status: "healthy" | "warning" | "critical" | "unknown";
  errorBudgetRemaining: number; // percentage (0-100)
  burnRate: {
    short: number; // 5-minute window
    long: number; // 1-hour window
  };
  trend: "improving" | "stable" | "degrading";
  lastViolation?: Date;
  violationCount24h: number;
  uptime: number; // percentage (0-100)
  timestamp: Date;
}

export interface SLOAlert {
  id: string;
  sloId: string;
  type: "violation" | "burn_rate" | "error_budget" | "trend";
  severity: "info" | "warning" | "critical";
  title: string;
  description: string;
  currentValue: number;
  threshold: number;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  metadata: Record<string, any>;
}

export interface SLOReport {
  period: {
    start: Date;
    end: Date;
  };
  summary: {
    totalSLOs: number;
    healthySLOs: number;
    warningSLOs: number;
    criticalSLOs: number;
    overallCompliance: number;
    averageErrorBudgetRemaining: number;
  };
  sloStatuses: SLOStatus[];
  alerts: SLOAlert[];
  trends: {
    complianceHistory: Array<{ timestamp: Date; compliance: number }>;
    categoryBreakdown: Record<string, number>;
    topViolators: Array<{ sloId: string; violationCount: number }>;
  };
}

export class SLOMonitoringService extends EventEmitter {
  private sloDefinitions: Map<string, SLODefinition> = new Map();
  private sloStatuses: Map<string, SLOStatus> = new Map();
  private alerts: SLOAlert[] = [];
  private metrics: Map<string, Array<{ timestamp: Date; value: number }>> =
    new Map();
  private readonly maxMetricsHistory = 10000;
  private readonly maxAlertsHistory = 1000;
  private monitoringInterval?: NodeJS.Timeout;

  constructor() {
    super();
    this.initializeDefaultSLOs();
    this.startMonitoring();
  }

  /**
   * Initialize default SLO definitions
   */
  private initializeDefaultSLOs(): void {
    const defaultSLOs: SLODefinition[] = [
      // Performance SLOs
      {
        id: "p95-generation-latency",
        name: "Generation P95 Latency",
        description:
          "AI generation requests must complete within 1.5 seconds for 95% of requests",
        category: "performance",
        metric: "p95_latency_generation",
        target: 1500,
        unit: "ms",
        operator: "lte",
        errorBudget: 5,
        alertThresholds: { warning: 1800, critical: 2500 },
        burnRateThresholds: {
          warning: { short: 6, long: 3 },
          critical: { short: 14.4, long: 6 },
        },
        enabled: true,
        tags: ["ai", "latency", "generation"],
      },
      {
        id: "p95-rag-latency",
        name: "RAG P95 Latency",
        description:
          "RAG queries must complete within 300ms for 95% of requests",
        category: "performance",
        metric: "p95_latency_rag",
        target: 300,
        unit: "ms",
        operator: "lte",
        errorBudget: 5,
        alertThresholds: { warning: 400, critical: 600 },
        burnRateThresholds: {
          warning: { short: 6, long: 3 },
          critical: { short: 14.4, long: 6 },
        },
        enabled: true,
        tags: ["ai", "latency", "rag"],
      },
      {
        id: "p95-cached-latency",
        name: "Cached Response P95 Latency",
        description:
          "Cached responses must be served within 300ms for 95% of requests",
        category: "performance",
        metric: "p95_latency_cached",
        target: 300,
        unit: "ms",
        operator: "lte",
        errorBudget: 2,
        alertThresholds: { warning: 400, critical: 600 },
        burnRateThresholds: {
          warning: { short: 6, long: 3 },
          critical: { short: 14.4, long: 6 },
        },
        enabled: true,
        tags: ["cache", "latency", "performance"],
      },
      {
        id: "cache-hit-rate",
        name: "Cache Hit Rate",
        description: "Cache hit rate must be above 80% for optimal performance",
        category: "performance",
        metric: "cache_hit_rate",
        target: 80,
        unit: "%",
        operator: "gte",
        errorBudget: 10,
        alertThresholds: { warning: 75, critical: 65 },
        burnRateThresholds: {
          warning: { short: 3, long: 1.5 },
          critical: { short: 6, long: 3 },
        },
        enabled: true,
        tags: ["cache", "performance"],
      },
      // Availability SLOs
      {
        id: "system-availability",
        name: "System Availability",
        description: "System must maintain 99.9% uptime",
        category: "availability",
        metric: "system_uptime",
        target: 99.9,
        unit: "%",
        operator: "gte",
        errorBudget: 0.1,
        alertThresholds: { warning: 99.5, critical: 99.0 },
        burnRateThresholds: {
          warning: { short: 6, long: 3 },
          critical: { short: 14.4, long: 6 },
        },
        enabled: true,
        tags: ["availability", "uptime"],
      },
      // Quality SLOs
      {
        id: "api-error-rate",
        name: "API Error Rate",
        description: "API error rate must stay below 1%",
        category: "quality",
        metric: "api_error_rate",
        target: 1.0,
        unit: "%",
        operator: "lte",
        errorBudget: 1,
        alertThresholds: { warning: 1.5, critical: 3.0 },
        burnRateThresholds: {
          warning: { short: 3, long: 1.5 },
          critical: { short: 6, long: 3 },
        },
        enabled: true,
        tags: ["quality", "errors", "api"],
      },
      {
        id: "performance-score",
        name: "Performance Score",
        description: "Overall performance score must be above 85",
        category: "quality",
        metric: "performance_score",
        target: 85,
        unit: "score",
        operator: "gte",
        errorBudget: 10,
        alertThresholds: { warning: 80, critical: 70 },
        burnRateThresholds: {
          warning: { short: 3, long: 1.5 },
          critical: { short: 6, long: 3 },
        },
        enabled: true,
        tags: ["quality", "performance", "score"],
      },
      // Cost SLOs
      {
        id: "ai-cost-per-request",
        name: "AI Cost per Request",
        description: "AI processing cost must stay below €0.05 per request",
        category: "cost",
        metric: "ai_cost_per_request",
        target: 0.05,
        unit: "€",
        operator: "lte",
        errorBudget: 5,
        alertThresholds: { warning: 0.06, critical: 0.08 },
        burnRateThresholds: {
          warning: { short: 3, long: 1.5 },
          critical: { short: 6, long: 3 },
        },
        enabled: true,
        tags: ["cost", "ai", "budget"],
      },
    ];

    defaultSLOs.forEach((slo) => this.sloDefinitions.set(slo.id, slo));
  }

  /**
   * Start monitoring all SLOs
   */
  private startMonitoring(): void {
    // Monitor every 30 seconds
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
      this.evaluateSLOs();
      this.checkAlerts();
      this.cleanupOldData();
    }, 30000);

    // Initial evaluation
    this.collectMetrics();
    this.evaluateSLOs();
  }

  /**
   * Stop monitoring
   */
  public stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
  }

  /**
   * Collect metrics from all monitoring systems
   */
  private async collectMetrics(): Promise<void> {
    try {
      // Get P95 latency metrics
      const p95Status = p95LatencyMonitor.getPerformanceStatus();
      this.recordMetric(
        "p95_latency_generation",
        p95Status.p95Latencies.generation
      );
      this.recordMetric("p95_latency_rag", p95Status.p95Latencies.rag);
      this.recordMetric("p95_latency_cached", p95Status.p95Latencies.cached);
      this.recordMetric("cache_hit_rate", p95Status.cacheHitRate);

      // Get performance monitoring metrics
      const perfSummary = performanceMonitoring.getPerformanceSummary();
      this.recordMetric("performance_score", perfSummary.score);

      // Mock additional metrics (in production, these would come from real sources)
      this.recordMetric("system_uptime", 99.95);
      this.recordMetric("api_error_rate", 0.3);
      this.recordMetric("ai_cost_per_request", 0.025);
    } catch (error) {
      console.error("Failed to collect SLO metrics:", error);
    }
  }

  /**
   * Record a metric value
   */
  private recordMetric(metric: string, value: number): void {
    if (!this.metrics.has(metric)) {
      this.metrics.set(metric, []);
    }

    const metricHistory = this.metrics.get(metric)!;
    metricHistory.push({ timestamp: new Date(), value });

    // Keep only recent history
    if (metricHistory.length > this.maxMetricsHistory) {
      metricHistory.splice(0, metricHistory.length - this.maxMetricsHistory);
    }
  }

  /**
   * Evaluate all SLOs against current metrics
   */
  private evaluateSLOs(): void {
    for (const [sloId, slo] of this.sloDefinitions) {
      if (!slo.enabled) continue;

      const status = this.evaluateSLO(slo);
      this.sloStatuses.set(sloId, status);

      // Emit status change events
      const previousStatus = this.sloStatuses.get(sloId);
      if (!previousStatus || previousStatus.status !== status.status) {
        this.emit("sloStatusChange", {
          sloId,
          previousStatus,
          currentStatus: status,
        });
      }
    }
  }

  /**
   * Evaluate a single SLO
   */
  private evaluateSLO(slo: SLODefinition): SLOStatus {
    const metricHistory = this.metrics.get(slo.metric) || [];
    const currentValue =
      metricHistory.length > 0
        ? metricHistory[metricHistory.length - 1].value
        : 0;

    // Calculate compliance
    let compliance = 0;
    if (metricHistory.length > 0) {
      const recentMetrics = metricHistory.slice(-100); // Last 100 data points
      const compliantCount = recentMetrics.filter((m) =>
        this.isCompliant(m.value, slo)
      ).length;
      compliance = (compliantCount / recentMetrics.length) * 100;
    }

    // Calculate status
    let status: "healthy" | "warning" | "critical" | "unknown" = "unknown";
    if (metricHistory.length > 0) {
      if (
        currentValue >= slo.alertThresholds.critical ||
        (slo.operator === "lte" &&
          currentValue >= slo.alertThresholds.critical) ||
        (slo.operator === "gte" && currentValue <= slo.alertThresholds.critical)
      ) {
        status = "critical";
      } else if (
        currentValue >= slo.alertThresholds.warning ||
        (slo.operator === "lte" &&
          currentValue >= slo.alertThresholds.warning) ||
        (slo.operator === "gte" && currentValue <= slo.alertThresholds.warning)
      ) {
        status = "warning";
      } else {
        status = "healthy";
      }
    }

    // Calculate error budget remaining
    const errorBudgetRemaining = Math.max(
      0,
      slo.errorBudget - (100 - compliance)
    );

    // Calculate burn rates
    const burnRate = this.calculateBurnRate(slo, metricHistory);

    // Calculate trend
    const trend = this.calculateTrend(metricHistory);

    // Count violations in last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const violationCount24h = metricHistory.filter(
      (m) => m.timestamp > oneDayAgo && !this.isCompliant(m.value, slo)
    ).length;

    return {
      sloId: slo.id,
      currentValue,
      targetValue: slo.target,
      compliance,
      status,
      errorBudgetRemaining,
      burnRate,
      trend,
      violationCount24h,
      uptime: compliance,
      timestamp: new Date(),
    };
  }

  /**
   * Check if a value is compliant with SLO
   */
  private isCompliant(value: number, slo: SLODefinition): boolean {
    switch (slo.operator) {
      case "lt":
        return value < slo.target;
      case "lte":
        return value <= slo.target;
      case "gt":
        return value > slo.target;
      case "gte":
        return value >= slo.target;
      case "eq":
        return value === slo.target;
      default:
        return false;
    }
  }

  /**
   * Calculate burn rate for SLO
   */
  private calculateBurnRate(
    slo: SLODefinition,
    metricHistory: Array<{ timestamp: Date; value: number }>
  ): { short: number; long: number } {
    const now = new Date();
    const shortWindow = 5 * 60 * 1000; // 5 minutes
    const longWindow = 60 * 60 * 1000; // 1 hour

    const shortWindowMetrics = metricHistory.filter(
      (m) => now.getTime() - m.timestamp.getTime() <= shortWindow
    );
    const longWindowMetrics = metricHistory.filter(
      (m) => now.getTime() - m.timestamp.getTime() <= longWindow
    );

    const calculateWindowBurnRate = (metrics: typeof metricHistory) => {
      if (metrics.length === 0) return 0;
      const compliantCount = metrics.filter((m) =>
        this.isCompliant(m.value, slo)
      ).length;
      const goodRatio = compliantCount / metrics.length;
      return (1 - goodRatio) / (slo.errorBudget / 100);
    };

    return {
      short: calculateWindowBurnRate(shortWindowMetrics),
      long: calculateWindowBurnRate(longWindowMetrics),
    };
  }

  /**
   * Calculate trend for metrics
   */
  private calculateTrend(
    metricHistory: Array<{ timestamp: Date; value: number }>
  ): "improving" | "stable" | "degrading" {
    if (metricHistory.length < 10) return "stable";

    const recent = metricHistory.slice(-10);
    const older = metricHistory.slice(-20, -10);

    if (older.length === 0) return "stable";

    const recentAvg =
      recent.reduce((sum, m) => sum + m.value, 0) / recent.length;
    const olderAvg = older.reduce((sum, m) => sum + m.value, 0) / older.length;

    const changePercent = Math.abs((recentAvg - olderAvg) / olderAvg) * 100;

    if (changePercent < 5) return "stable";
    return recentAvg < olderAvg ? "improving" : "degrading";
  }

  /**
   * Check for alert conditions
   */
  private checkAlerts(): void {
    for (const [sloId, status] of this.sloStatuses) {
      const slo = this.sloDefinitions.get(sloId);
      if (!slo) continue;

      // Check for SLO violations
      if (status.status === "critical" || status.status === "warning") {
        this.createAlert({
          sloId,
          type: "violation",
          severity: status.status === "critical" ? "critical" : "warning",
          title: `SLO Violation: ${slo.name}`,
          description: `${slo.name} is ${status.status}. Current value: ${status.currentValue}${slo.unit}, Target: ${status.targetValue}${slo.unit}`,
          currentValue: status.currentValue,
          threshold:
            status.status === "critical"
              ? slo.alertThresholds.critical
              : slo.alertThresholds.warning,
          metadata: { slo, status },
        });
      }

      // Check for burn rate alerts
      if (
        status.burnRate.short > slo.burnRateThresholds.critical.short &&
        status.burnRate.long > slo.burnRateThresholds.critical.long
      ) {
        this.createAlert({
          sloId,
          type: "burn_rate",
          severity: "critical",
          title: `Critical Burn Rate: ${slo.name}`,
          description: `Error budget will be exhausted in ~2 hours at current rate. Burn rate: ${status.burnRate.short.toFixed(
            1
          )}x`,
          currentValue: status.burnRate.short,
          threshold: slo.burnRateThresholds.critical.short,
          metadata: { slo, status, burnRate: status.burnRate },
        });
      } else if (
        status.burnRate.short > slo.burnRateThresholds.warning.short &&
        status.burnRate.long > slo.burnRateThresholds.warning.long
      ) {
        this.createAlert({
          sloId,
          type: "burn_rate",
          severity: "warning",
          title: `Warning Burn Rate: ${slo.name}`,
          description: `Error budget consumption rate is elevated. Burn rate: ${status.burnRate.short.toFixed(
            1
          )}x`,
          currentValue: status.burnRate.short,
          threshold: slo.burnRateThresholds.warning.short,
          metadata: { slo, status, burnRate: status.burnRate },
        });
      }

      // Check for error budget depletion
      if (status.errorBudgetRemaining <= 10) {
        this.createAlert({
          sloId,
          type: "error_budget",
          severity: status.errorBudgetRemaining <= 5 ? "critical" : "warning",
          title: `Low Error Budget: ${slo.name}`,
          description: `Only ${status.errorBudgetRemaining.toFixed(
            1
          )}% error budget remaining`,
          currentValue: status.errorBudgetRemaining,
          threshold: 10,
          metadata: { slo, status },
        });
      }
    }
  }

  /**
   * Create an alert
   */
  private createAlert(
    alertData: Omit<SLOAlert, "id" | "timestamp" | "resolved">
  ): void {
    // Check for duplicate alerts (same SLO, type, and severity within last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const existingAlert = this.alerts.find(
      (alert) =>
        !alert.resolved &&
        alert.sloId === alertData.sloId &&
        alert.type === alertData.type &&
        alert.severity === alertData.severity &&
        alert.timestamp > fiveMinutesAgo
    );

    if (existingAlert) return; // Don't create duplicate alerts

    const alert: SLOAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      timestamp: new Date(),
      resolved: false,
      ...alertData,
    };

    this.alerts.push(alert);

    // Keep only recent alerts
    if (this.alerts.length > this.maxAlertsHistory) {
      this.alerts = this.alerts.slice(-this.maxAlertsHistory);
    }

    // Emit alert event
    this.emit("alert", alert);

    console.warn(
      `SLO Alert [${alert.severity.toUpperCase()}]: ${alert.title}`,
      {
        sloId: alert.sloId,
        currentValue: alert.currentValue,
        threshold: alert.threshold,
        description: alert.description,
      }
    );
  }

  /**
   * Clean up old data
   */
  private cleanupOldData(): void {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // Keep 24 hours

    // Clean old metrics
    for (const [metric, history] of this.metrics) {
      const filteredHistory = history.filter((m) => m.timestamp > cutoff);
      this.metrics.set(metric, filteredHistory);
    }

    // Clean old resolved alerts
    const alertCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Keep 7 days
    this.alerts = this.alerts.filter(
      (alert) => !alert.resolved || alert.timestamp > alertCutoff
    );
  }

  /**
   * Get all SLO definitions
   */
  public getSLODefinitions(): SLODefinition[] {
    return Array.from(this.sloDefinitions.values());
  }

  /**
   * Get SLO definition by ID
   */
  public getSLODefinition(sloId: string): SLODefinition | undefined {
    return this.sloDefinitions.get(sloId);
  }

  /**
   * Get all SLO statuses
   */
  public getSLOStatuses(): SLOStatus[] {
    return Array.from(this.sloStatuses.values());
  }

  /**
   * Get SLO status by ID
   */
  public getSLOStatus(sloId: string): SLOStatus | undefined {
    return this.sloStatuses.get(sloId);
  }

  /**
   * Get active alerts
   */
  public getActiveAlerts(): SLOAlert[] {
    return this.alerts.filter((alert) => !alert.resolved);
  }

  /**
   * Get all alerts
   */
  public getAllAlerts(): SLOAlert[] {
    return [...this.alerts];
  }

  /**
   * Resolve an alert
   */
  public resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      alert.resolvedAt = new Date();
      this.emit("alertResolved", alert);
      return true;
    }
    return false;
  }

  /**
   * Generate comprehensive SLO report
   */
  public generateReport(startDate?: Date, endDate?: Date): SLOReport {
    const end = endDate || new Date();
    const start = startDate || new Date(end.getTime() - 24 * 60 * 60 * 1000); // Default: last 24 hours

    const sloStatuses = this.getSLOStatuses();
    const alerts = this.alerts.filter(
      (alert) => alert.timestamp >= start && alert.timestamp <= end
    );

    const healthySLOs = sloStatuses.filter(
      (s) => s.status === "healthy"
    ).length;
    const warningSLOs = sloStatuses.filter(
      (s) => s.status === "warning"
    ).length;
    const criticalSLOs = sloStatuses.filter(
      (s) => s.status === "critical"
    ).length;

    const overallCompliance =
      sloStatuses.length > 0
        ? sloStatuses.reduce((sum, s) => sum + s.compliance, 0) /
          sloStatuses.length
        : 0;

    const averageErrorBudgetRemaining =
      sloStatuses.length > 0
        ? sloStatuses.reduce((sum, s) => sum + s.errorBudgetRemaining, 0) /
          sloStatuses.length
        : 0;

    // Generate compliance history (mock data for now)
    const complianceHistory = Array.from({ length: 24 }, (_, i) => ({
      timestamp: new Date(start.getTime() + i * 60 * 60 * 1000),
      compliance: overallCompliance + (Math.random() - 0.5) * 5,
    }));

    // Category breakdown
    const categoryBreakdown: Record<string, number> = {};
    for (const slo of this.getSLODefinitions()) {
      categoryBreakdown[slo.category] =
        (categoryBreakdown[slo.category] || 0) + 1;
    }

    // Top violators
    const topViolators = sloStatuses
      .filter((s) => s.violationCount24h > 0)
      .sort((a, b) => b.violationCount24h - a.violationCount24h)
      .slice(0, 5)
      .map((s) => ({ sloId: s.sloId, violationCount: s.violationCount24h }));

    return {
      period: { start, end },
      summary: {
        totalSLOs: sloStatuses.length,
        healthySLOs,
        warningSLOs,
        criticalSLOs,
        overallCompliance,
        averageErrorBudgetRemaining,
      },
      sloStatuses,
      alerts,
      trends: {
        complianceHistory,
        categoryBreakdown,
        topViolators,
      },
    };
  }

  /**
   * Add or update SLO definition
   */
  public setSLODefinition(slo: SLODefinition): void {
    this.sloDefinitions.set(slo.id, slo);
  }

  /**
   * Remove SLO definition
   */
  public removeSLODefinition(sloId: string): boolean {
    const removed = this.sloDefinitions.delete(sloId);
    if (removed) {
      this.sloStatuses.delete(sloId);
    }
    return removed;
  }

  /**
   * Get system health summary
   */
  public getSystemHealthSummary(): {
    overall: "healthy" | "degraded" | "critical";
    sloCompliance: number;
    activeAlerts: number;
    criticalAlerts: number;
    services: Array<{
      name: string;
      status: "up" | "down" | "degraded";
      uptime: number;
    }>;
  } {
    const sloStatuses = this.getSLOStatuses();
    const activeAlerts = this.getActiveAlerts();
    const criticalAlerts = activeAlerts.filter(
      (a) => a.severity === "critical"
    );

    const sloCompliance =
      sloStatuses.length > 0
        ? sloStatuses.reduce((sum, s) => sum + s.compliance, 0) /
          sloStatuses.length
        : 100;

    let overall: "healthy" | "degraded" | "critical" = "healthy";
    if (criticalAlerts.length > 0 || sloCompliance < 95) {
      overall = "critical";
    } else if (activeAlerts.length > 0 || sloCompliance < 98) {
      overall = "degraded";
    }

    // Mock service data (in production, this would come from service discovery)
    const services = [
      { name: "AI Orchestrator", status: "up" as const, uptime: 99.98 },
      { name: "Database", status: "up" as const, uptime: 99.99 },
      { name: "Cache Layer", status: "up" as const, uptime: 99.95 },
      { name: "CDN", status: "up" as const, uptime: 99.99 },
      { name: "Load Balancer", status: "up" as const, uptime: 100 },
    ];

    return {
      overall,
      sloCompliance,
      activeAlerts: activeAlerts.length,
      criticalAlerts: criticalAlerts.length,
      services,
    };
  }
}

// Singleton instance
export const sloMonitoringService = new SLOMonitoringService();

// Export types for external use
export type { SLOAlert, SLODefinition, SLOReport, SLOStatus };
