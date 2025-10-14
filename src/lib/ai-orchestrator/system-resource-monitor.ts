/**
 * System Resource Monitor
 *
 * Monitors CPU and memory usage to ensure Bedrock Support Mode overhead
 * stays under 5% of system resources (< 1% CPU, < 50MB memory).
 *
 * @module system-resource-monitor
 */

import { AiFeatureFlags } from "./ai-feature-flags";
import { AuditTrailSystem } from "./audit-trail-system";

/**
 * System resource metrics
 */
export interface SystemResourceMetrics {
  timestamp: Date;
  cpuUsagePercent: number;
  memoryUsageMB: number;
  memoryUsagePercent: number;
  totalMemoryMB: number;
  processId: number;
  uptime: number;
}

/**
 * Resource usage thresholds
 */
export interface ResourceThresholds {
  cpuWarningPercent: number;
  cpuCriticalPercent: number;
  memoryWarningMB: number;
  memoryCriticalMB: number;
}

/**
 * Resource alert
 */
export interface ResourceAlert {
  id: string;
  type: "cpu" | "memory";
  severity: "warning" | "critical";
  message: string;
  currentValue: number;
  threshold: number;
  timestamp: Date;
  acknowledged: boolean;
}

/**
 * Resource monitoring configuration
 */
export interface ResourceMonitorConfig {
  enabled: boolean;
  monitoringIntervalMs: number;
  alertCheckIntervalMs: number;
  metricsRetentionMs: number;
  thresholds: ResourceThresholds;
  enableAlerts: boolean;
  alertCooldownMs: number;
}

/**
 * Default configuration for Bedrock Support Mode
 * Target: < 1% CPU, < 50MB memory (5% of typical system resources)
 */
const DEFAULT_CONFIG: ResourceMonitorConfig = {
  enabled: true,
  monitoringIntervalMs: 5000, // 5 seconds
  alertCheckIntervalMs: 10000, // 10 seconds
  metricsRetentionMs: 3600000, // 1 hour
  thresholds: {
    cpuWarningPercent: 0.8, // 0.8% CPU warning
    cpuCriticalPercent: 1.0, // 1% CPU critical
    memoryWarningMB: 40, // 40MB memory warning
    memoryCriticalMB: 50, // 50MB memory critical
  },
  enableAlerts: true,
  alertCooldownMs: 300000, // 5 minutes
};

/**
 * System Resource Monitor
 *
 * Tracks CPU and memory usage for Bedrock Support Mode operations.
 */
export class SystemResourceMonitor {
  private config: ResourceMonitorConfig;
  private metrics: SystemResourceMetrics[];
  private alerts: ResourceAlert[];
  private lastAlertTime: Map<string, Date>;
  private monitoringTimer?: NodeJS.Timeout;
  private alertTimer?: NodeJS.Timeout;
  private isMonitoring: boolean;
  private baselineMetrics?: SystemResourceMetrics;

  constructor(
    private featureFlags: AiFeatureFlags,
    private auditTrail: AuditTrailSystem,
    config?: Partial<ResourceMonitorConfig>
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.metrics = [];
    this.alerts = [];
    this.lastAlertTime = new Map();
    this.isMonitoring = false;
  }

  /**
   * Start resource monitoring
   */
  public async startMonitoring(): Promise<void> {
    if (!this.config.enabled) {
      console.log(
        "[SystemResourceMonitor] Monitoring disabled by configuration"
      );
      return;
    }

    if (this.isMonitoring) {
      console.log("[SystemResourceMonitor] Already monitoring");
      return;
    }

    console.log("[SystemResourceMonitor] Starting resource monitoring");
    this.isMonitoring = true;

    // Capture baseline metrics
    this.baselineMetrics = await this.collectCurrentMetrics();

    await this.auditTrail.logEvent({
      eventType: "system_monitoring_started",
      timestamp: new Date(),
      details: {
        component: "SystemResourceMonitor",
        baseline: this.baselineMetrics,
        thresholds: this.config.thresholds,
      },
    });

    // Start monitoring timer
    this.monitoringTimer = setInterval(
      () => this.collectAndStoreMetrics(),
      this.config.monitoringIntervalMs
    );

    // Start alert checking timer
    if (this.config.enableAlerts) {
      this.alertTimer = setInterval(
        () => this.checkResourceAlerts(),
        this.config.alertCheckIntervalMs
      );
    }
  }

  /**
   * Stop resource monitoring
   */
  public async stopMonitoring(): Promise<void> {
    if (!this.isMonitoring) {
      return;
    }

    console.log("[SystemResourceMonitor] Stopping resource monitoring");
    this.isMonitoring = false;

    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = undefined;
    }

    if (this.alertTimer) {
      clearInterval(this.alertTimer);
      this.alertTimer = undefined;
    }

    await this.auditTrail.logEvent({
      eventType: "system_monitoring_stopped",
      timestamp: new Date(),
      details: {
        component: "SystemResourceMonitor",
        finalMetrics: await this.collectCurrentMetrics(),
        totalAlerts: this.alerts.length,
      },
    });
  }

  /**
   * Collect current system metrics
   */
  private async collectCurrentMetrics(): Promise<SystemResourceMetrics> {
    const process = await import("process");
    const os = await import("os");

    // Get memory usage
    const memoryUsage = process.memoryUsage();
    const totalMemory = os.totalmem();
    const memoryUsageMB = memoryUsage.rss / (1024 * 1024); // Convert to MB
    const totalMemoryMB = totalMemory / (1024 * 1024);
    const memoryUsagePercent = (memoryUsageMB / totalMemoryMB) * 100;

    // Get CPU usage (simplified - in production you'd want more accurate measurement)
    const cpuUsage = process.cpuUsage();
    const cpuUsagePercent = this.calculateCpuUsagePercent(cpuUsage);

    return {
      timestamp: new Date(),
      cpuUsagePercent,
      memoryUsageMB,
      memoryUsagePercent,
      totalMemoryMB,
      processId: process.pid,
      uptime: process.uptime(),
    };
  }

  /**
   * Calculate CPU usage percentage
   */
  private calculateCpuUsagePercent(cpuUsage: NodeJS.CpuUsage): number {
    // This is a simplified calculation
    // In production, you'd want to track deltas over time
    const totalCpuTime = cpuUsage.user + cpuUsage.system;
    const totalTime = process.uptime() * 1000000; // Convert to microseconds
    return Math.min((totalCpuTime / totalTime) * 100, 100);
  }

  /**
   * Collect and store metrics
   */
  private async collectAndStoreMetrics(): Promise<void> {
    try {
      const currentMetrics = await this.collectCurrentMetrics();
      this.metrics.push(currentMetrics);

      // Clean up old metrics
      const cutoffTime = Date.now() - this.config.metricsRetentionMs;
      this.metrics = this.metrics.filter(
        (metric) => metric.timestamp.getTime() > cutoffTime
      );

      // Log high resource usage
      if (
        currentMetrics.cpuUsagePercent >
          this.config.thresholds.cpuWarningPercent ||
        currentMetrics.memoryUsageMB > this.config.thresholds.memoryWarningMB
      ) {
        await this.auditTrail.logEvent({
          eventType: "high_resource_usage_detected",
          timestamp: new Date(),
          details: {
            component: "SystemResourceMonitor",
            metrics: currentMetrics,
            thresholds: this.config.thresholds,
          },
        });
      }
    } catch (error) {
      console.error("[SystemResourceMonitor] Error collecting metrics:", error);
    }
  }

  /**
   * Check for resource alerts
   */
  private async checkResourceAlerts(): Promise<void> {
    if (this.metrics.length === 0) {
      return;
    }

    const latestMetrics = this.metrics[this.metrics.length - 1];
    const now = new Date();

    // Check CPU usage
    if (
      latestMetrics.cpuUsagePercent > this.config.thresholds.cpuCriticalPercent
    ) {
      this.createAlert({
        type: "cpu",
        severity: "critical",
        message: `Critical CPU usage: ${latestMetrics.cpuUsagePercent.toFixed(
          2
        )}% (threshold: ${this.config.thresholds.cpuCriticalPercent}%)`,
        currentValue: latestMetrics.cpuUsagePercent,
        threshold: this.config.thresholds.cpuCriticalPercent,
      });
    } else if (
      latestMetrics.cpuUsagePercent > this.config.thresholds.cpuWarningPercent
    ) {
      this.createAlert({
        type: "cpu",
        severity: "warning",
        message: `Warning CPU usage: ${latestMetrics.cpuUsagePercent.toFixed(
          2
        )}% (threshold: ${this.config.thresholds.cpuWarningPercent}%)`,
        currentValue: latestMetrics.cpuUsagePercent,
        threshold: this.config.thresholds.cpuWarningPercent,
      });
    }

    // Check memory usage
    if (latestMetrics.memoryUsageMB > this.config.thresholds.memoryCriticalMB) {
      this.createAlert({
        type: "memory",
        severity: "critical",
        message: `Critical memory usage: ${latestMetrics.memoryUsageMB.toFixed(
          2
        )}MB (threshold: ${this.config.thresholds.memoryCriticalMB}MB)`,
        currentValue: latestMetrics.memoryUsageMB,
        threshold: this.config.thresholds.memoryCriticalMB,
      });
    } else if (
      latestMetrics.memoryUsageMB > this.config.thresholds.memoryWarningMB
    ) {
      this.createAlert({
        type: "memory",
        severity: "warning",
        message: `Warning memory usage: ${latestMetrics.memoryUsageMB.toFixed(
          2
        )}MB (threshold: ${this.config.thresholds.memoryWarningMB}MB)`,
        currentValue: latestMetrics.memoryUsageMB,
        threshold: this.config.thresholds.memoryWarningMB,
      });
    }
  }

  /**
   * Create a resource alert
   */
  private createAlert(
    alertData: Omit<ResourceAlert, "id" | "timestamp" | "acknowledged">
  ): void {
    const alertKey = `${alertData.type}_${alertData.severity}`;
    const lastAlert = this.lastAlertTime.get(alertKey);
    const now = new Date();

    // Check cooldown period
    if (
      lastAlert &&
      now.getTime() - lastAlert.getTime() < this.config.alertCooldownMs
    ) {
      return;
    }

    const alert: ResourceAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...alertData,
      timestamp: now,
      acknowledged: false,
    };

    this.alerts.push(alert);
    this.lastAlertTime.set(alertKey, now);

    console.log(
      `[SystemResourceMonitor] Alert created: ${alert.severity} - ${alert.message}`
    );

    // Log alert to audit trail
    this.auditTrail.logEvent({
      eventType: "resource_alert_created",
      timestamp: now,
      details: {
        component: "SystemResourceMonitor",
        alert,
      },
    });
  }

  /**
   * Get current resource metrics
   */
  public async getCurrentMetrics(): Promise<SystemResourceMetrics> {
    return await this.collectCurrentMetrics();
  }

  /**
   * Get recent metrics
   */
  public getRecentMetrics(
    durationMs: number = 300000
  ): SystemResourceMetrics[] {
    const cutoffTime = Date.now() - durationMs;
    return this.metrics.filter(
      (metric) => metric.timestamp.getTime() > cutoffTime
    );
  }

  /**
   * Get resource usage summary
   */
  public getResourceSummary(): {
    current: SystemResourceMetrics | null;
    baseline: SystemResourceMetrics | null;
    averageCpuUsage: number;
    averageMemoryUsage: number;
    peakCpuUsage: number;
    peakMemoryUsage: number;
    isWithinThresholds: boolean;
    activeAlerts: ResourceAlert[];
  } {
    const current =
      this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;

    if (this.metrics.length === 0) {
      return {
        current: null,
        baseline: this.baselineMetrics || null,
        averageCpuUsage: 0,
        averageMemoryUsage: 0,
        peakCpuUsage: 0,
        peakMemoryUsage: 0,
        isWithinThresholds: true,
        activeAlerts: [],
      };
    }

    const averageCpuUsage =
      this.metrics.reduce((sum, m) => sum + m.cpuUsagePercent, 0) /
      this.metrics.length;
    const averageMemoryUsage =
      this.metrics.reduce((sum, m) => sum + m.memoryUsageMB, 0) /
      this.metrics.length;
    const peakCpuUsage = Math.max(
      ...this.metrics.map((m) => m.cpuUsagePercent)
    );
    const peakMemoryUsage = Math.max(
      ...this.metrics.map((m) => m.memoryUsageMB)
    );

    const isWithinThresholds =
      peakCpuUsage <= this.config.thresholds.cpuCriticalPercent &&
      peakMemoryUsage <= this.config.thresholds.memoryCriticalMB;

    return {
      current,
      baseline: this.baselineMetrics || null,
      averageCpuUsage,
      averageMemoryUsage,
      peakCpuUsage,
      peakMemoryUsage,
      isWithinThresholds,
      activeAlerts: this.getActiveAlerts(),
    };
  }

  /**
   * Check if support mode is within resource thresholds
   */
  public isWithinResourceThresholds(): boolean {
    const summary = this.getResourceSummary();
    return summary.isWithinThresholds;
  }

  /**
   * Get active alerts
   */
  public getActiveAlerts(): ResourceAlert[] {
    return this.alerts.filter((alert) => !alert.acknowledged);
  }

  /**
   * Get all alerts
   */
  public getAllAlerts(): ResourceAlert[] {
    return [...this.alerts];
  }

  /**
   * Acknowledge an alert
   */
  public acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      console.log(`[SystemResourceMonitor] Alert acknowledged: ${alertId}`);
      return true;
    }
    return false;
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<ResourceMonitorConfig>): void {
    this.config = { ...this.config, ...config };
    console.log("[SystemResourceMonitor] Configuration updated");
  }

  /**
   * Reset metrics and alerts
   */
  public reset(): void {
    this.metrics = [];
    this.alerts = [];
    this.lastAlertTime.clear();
    this.baselineMetrics = undefined;
    console.log("[SystemResourceMonitor] Metrics and alerts reset");
  }

  /**
   * Cleanup resources
   */
  public async cleanup(): Promise<void> {
    await this.stopMonitoring();
    this.reset();
    console.log("[SystemResourceMonitor] Cleanup completed");
  }

  /**
   * Get monitoring status
   */
  public getStatus(): {
    isMonitoring: boolean;
    config: ResourceMonitorConfig;
    metricsCount: number;
    alertsCount: number;
    uptime: number;
  } {
    return {
      isMonitoring: this.isMonitoring,
      config: this.config,
      metricsCount: this.metrics.length,
      alertsCount: this.alerts.length,
      uptime: this.baselineMetrics
        ? Date.now() - this.baselineMetrics.timestamp.getTime()
        : 0,
    };
  }
}
