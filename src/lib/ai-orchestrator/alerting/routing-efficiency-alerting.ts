/**
 * Routing Efficiency Alerting System
 *
 * Proactive alerting for routing efficiency issues in the hybrid architecture.
 * Integrates with CloudWatch Alarm Manager, SNS Notification Manager, and PagerDuty.
 *
 * @module routing-efficiency-alerting
 */

/**
 * Routing efficiency alert types
 */
export enum RoutingEfficiencyAlertType {
  HIGH_LATENCY = "high_latency",
  LOW_SUCCESS_RATE = "low_success_rate",
  ROUTING_IMBALANCE = "routing_imbalance",
  FALLBACK_OVERUSE = "fallback_overuse",
  COST_ANOMALY = "cost_anomaly",
  HEALTH_DEGRADATION = "health_degradation",
}

/**
 * Alert severity levels
 */
export enum AlertSeverity {
  INFO = "info",
  WARNING = "warning",
  ERROR = "error",
  CRITICAL = "critical",
}

/**
 * Routing efficiency alert configuration
 */
export interface RoutingEfficiencyAlertConfig {
  // Latency thresholds (milliseconds)
  latencyThresholds: {
    warning: number;
    error: number;
    critical: number;
  };

  // Success rate thresholds (percentage)
  successRateThresholds: {
    warning: number;
    error: number;
    critical: number;
  };

  // Routing imbalance thresholds (percentage difference)
  routingImbalanceThresholds: {
    warning: number;
    error: number;
    critical: number;
  };

  // Fallback usage thresholds (percentage)
  fallbackUsageThresholds: {
    warning: number;
    error: number;
    critical: number;
  };

  // Cost anomaly thresholds (percentage increase)
  costAnomalyThresholds: {
    warning: number;
    error: number;
    critical: number;
  };

  // Health score thresholds (0-100)
  healthScoreThresholds: {
    warning: number;
    error: number;
    critical: number;
  };

  // Alert check interval (milliseconds)
  checkInterval: number;

  // Enable/disable specific alert types
  enabledAlerts: Set<RoutingEfficiencyAlertType>;
}

/**
 * Routing efficiency alert
 */
export interface RoutingEfficiencyAlert {
  id: string;
  type: RoutingEfficiencyAlertType;
  severity: AlertSeverity;
  timestamp: Date;
  message: string;
  details: Record<string, any>;
  recommendations: string[];
  correlationId?: string;
}

/**
 * Alert statistics
 */
export interface AlertStatistics {
  totalAlerts: number;
  alertsByType: Map<RoutingEfficiencyAlertType, number>;
  alertsBySeverity: Map<AlertSeverity, number>;
  lastAlertTime?: Date;
  averageResolutionTime?: number;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: RoutingEfficiencyAlertConfig = {
  latencyThresholds: {
    warning: 1000, // 1 second
    error: 2000, // 2 seconds
    critical: 5000, // 5 seconds
  },
  successRateThresholds: {
    warning: 95, // 95%
    error: 90, // 90%
    critical: 85, // 85%
  },
  routingImbalanceThresholds: {
    warning: 30, // 30% difference
    error: 50, // 50% difference
    critical: 70, // 70% difference
  },
  fallbackUsageThresholds: {
    warning: 10, // 10% fallback usage
    error: 20, // 20% fallback usage
    critical: 40, // 40% fallback usage
  },
  costAnomalyThresholds: {
    warning: 20, // 20% increase
    error: 50, // 50% increase
    critical: 100, // 100% increase
  },
  healthScoreThresholds: {
    warning: 80, // 80/100
    error: 60, // 60/100
    critical: 40, // 40/100
  },
  checkInterval: 60000, // 1 minute
  enabledAlerts: new Set(Object.values(RoutingEfficiencyAlertType)),
};

/**
 * Routing Efficiency Alerting System
 *
 * Monitors routing efficiency and generates proactive alerts
 */
export class RoutingEfficiencyAlertingSystem {
  private config: RoutingEfficiencyAlertConfig;
  private alarmManager: CloudWatchAlarmManager;
  private notificationManager: SNSNotificationManager;
  private pagerDutyIntegration: PagerDutyIntegration;
  private performanceMonitor: HybridRoutingPerformanceMonitor;
  private healthChecker: HybridHealthChecker;

  private alerts: Map<string, RoutingEfficiencyAlert> = new Map();
  private statistics: AlertStatistics = {
    totalAlerts: 0,
    alertsByType: new Map(),
    alertsBySeverity: new Map(),
  };

  private checkIntervalId?: NodeJS.Timeout;
  private isRunning: boolean = false;

  constructor(
    alarmManager: CloudWatchAlarmManager,
    notificationManager: SNSNotificationManager,
    pagerDutyIntegration: PagerDutyIntegration,
    performanceMonitor: HybridRoutingPerformanceMonitor,
    healthChecker: HybridHealthChecker,
    config: Partial<RoutingEfficiencyAlertConfig> = {}
  ) {
    this.alarmManager = alarmManager;
    this.notificationManager = notificationManager;
    this.pagerDutyIntegration = pagerDutyIntegration;
    this.performanceMonitor = performanceMonitor;
    this.healthChecker = healthChecker;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Start the alerting system
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;

    // Initial check
    await this.checkRoutingEfficiency();

    // Schedule periodic checks
    this.checkIntervalId = setInterval(
      () => this.checkRoutingEfficiency(),
      this.config.checkInterval
    );
  }

  /**
   * Stop the alerting system
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    if (this.checkIntervalId) {
      clearInterval(this.checkIntervalId);
      this.checkIntervalId = undefined;
    }
  }

  /**
   * Check routing efficiency and generate alerts
   */
  private async checkRoutingEfficiency(): Promise<void> {
    try {
      // Get current performance metrics
      const metrics = await this.performanceMonitor.getPerformanceMetrics();

      // Get health status
      const healthStatus = await this.healthChecker.checkHealth();

      // Check each alert type
      if (
        this.config.enabledAlerts.has(RoutingEfficiencyAlertType.HIGH_LATENCY)
      ) {
        await this.checkLatency(metrics);
      }

      if (
        this.config.enabledAlerts.has(
          RoutingEfficiencyAlertType.LOW_SUCCESS_RATE
        )
      ) {
        await this.checkSuccessRate(metrics);
      }

      if (
        this.config.enabledAlerts.has(
          RoutingEfficiencyAlertType.ROUTING_IMBALANCE
        )
      ) {
        await this.checkRoutingImbalance(metrics);
      }

      if (
        this.config.enabledAlerts.has(
          RoutingEfficiencyAlertType.FALLBACK_OVERUSE
        )
      ) {
        await this.checkFallbackUsage(metrics);
      }

      if (
        this.config.enabledAlerts.has(RoutingEfficiencyAlertType.COST_ANOMALY)
      ) {
        await this.checkCostAnomaly(metrics);
      }

      if (
        this.config.enabledAlerts.has(
          RoutingEfficiencyAlertType.HEALTH_DEGRADATION
        )
      ) {
        await this.checkHealthDegradation(healthStatus);
      }
    } catch (error) {
      console.error("Error checking routing efficiency:", error);
    }
  }

  /**
   * Check latency thresholds
   */
  private async checkLatency(metrics: any): Promise<void> {
    const avgLatency = metrics.averageLatency || 0;
    const p95Latency = metrics.p95Latency || 0;

    let severity: AlertSeverity | null = null;

    if (p95Latency >= this.config.latencyThresholds.critical) {
      severity = AlertSeverity.CRITICAL;
    } else if (p95Latency >= this.config.latencyThresholds.error) {
      severity = AlertSeverity.ERROR;
    } else if (p95Latency >= this.config.latencyThresholds.warning) {
      severity = AlertSeverity.WARNING;
    }

    if (severity) {
      await this.createAlert({
        type: RoutingEfficiencyAlertType.HIGH_LATENCY,
        severity,
        message: `High routing latency detected: P95 ${p95Latency}ms, Avg ${avgLatency}ms`,
        details: {
          averageLatency: avgLatency,
          p95Latency: p95Latency,
          threshold: this.config.latencyThresholds[severity],
        },
        recommendations: [
          "Check direct Bedrock client health",
          "Review MCP router performance",
          "Consider scaling infrastructure",
          "Analyze slow operations in logs",
        ],
      });
    }
  }

  /**
   * Check success rate thresholds
   */
  private async checkSuccessRate(metrics: any): Promise<void> {
    const successRate = metrics.successRate || 100;

    let severity: AlertSeverity | null = null;

    if (successRate <= this.config.successRateThresholds.critical) {
      severity = AlertSeverity.CRITICAL;
    } else if (successRate <= this.config.successRateThresholds.error) {
      severity = AlertSeverity.ERROR;
    } else if (successRate <= this.config.successRateThresholds.warning) {
      severity = AlertSeverity.WARNING;
    }

    if (severity) {
      await this.createAlert({
        type: RoutingEfficiencyAlertType.LOW_SUCCESS_RATE,
        severity,
        message: `Low routing success rate detected: ${successRate.toFixed(
          2
        )}%`,
        details: {
          successRate,
          threshold: this.config.successRateThresholds[severity],
          failureCount: metrics.failureCount || 0,
        },
        recommendations: [
          "Check error logs for failure patterns",
          "Verify circuit breaker status",
          "Review fallback mechanism health",
          "Consider temporary traffic reduction",
        ],
      });
    }
  }

  /**
   * Check routing imbalance
   */
  private async checkRoutingImbalance(metrics: any): Promise<void> {
    const directBedrockUsage = metrics.directBedrockUsage || 0;
    const mcpUsage = metrics.mcpUsage || 0;
    const totalUsage = directBedrockUsage + mcpUsage;

    if (totalUsage === 0) {
      return;
    }

    const imbalance = Math.abs(
      (directBedrockUsage / totalUsage) * 100 - (mcpUsage / totalUsage) * 100
    );

    let severity: AlertSeverity | null = null;

    if (imbalance >= this.config.routingImbalanceThresholds.critical) {
      severity = AlertSeverity.CRITICAL;
    } else if (imbalance >= this.config.routingImbalanceThresholds.error) {
      severity = AlertSeverity.ERROR;
    } else if (imbalance >= this.config.routingImbalanceThresholds.warning) {
      severity = AlertSeverity.WARNING;
    }

    if (severity) {
      await this.createAlert({
        type: RoutingEfficiencyAlertType.ROUTING_IMBALANCE,
        severity,
        message: `Routing imbalance detected: ${imbalance.toFixed(
          2
        )}% difference`,
        details: {
          directBedrockUsage,
          mcpUsage,
          imbalance,
          threshold: this.config.routingImbalanceThresholds[severity],
        },
        recommendations: [
          "Review intelligent router configuration",
          "Check health status of both routing paths",
          "Analyze operation type distribution",
          "Consider adjusting routing rules",
        ],
      });
    }
  }

  /**
   * Check fallback usage
   */
  private async checkFallbackUsage(metrics: any): Promise<void> {
    const fallbackUsage = metrics.fallbackUsage || 0;
    const totalOperations = metrics.totalOperations || 0;

    if (totalOperations === 0) {
      return;
    }

    const fallbackPercentage = (fallbackUsage / totalOperations) * 100;

    let severity: AlertSeverity | null = null;

    if (fallbackPercentage >= this.config.fallbackUsageThresholds.critical) {
      severity = AlertSeverity.CRITICAL;
    } else if (
      fallbackPercentage >= this.config.fallbackUsageThresholds.error
    ) {
      severity = AlertSeverity.ERROR;
    } else if (
      fallbackPercentage >= this.config.fallbackUsageThresholds.warning
    ) {
      severity = AlertSeverity.WARNING;
    }

    if (severity) {
      await this.createAlert({
        type: RoutingEfficiencyAlertType.FALLBACK_OVERUSE,
        severity,
        message: `High fallback usage detected: ${fallbackPercentage.toFixed(
          2
        )}%`,
        details: {
          fallbackUsage,
          totalOperations,
          fallbackPercentage,
          threshold: this.config.fallbackUsageThresholds[severity],
        },
        recommendations: [
          "Check primary routing path health",
          "Review circuit breaker status",
          "Analyze fallback trigger patterns",
          "Consider infrastructure scaling",
        ],
      });
    }
  }

  /**
   * Check cost anomalies
   */
  private async checkCostAnomaly(metrics: any): Promise<void> {
    const currentCost = metrics.currentCost || 0;
    const baselineCost = metrics.baselineCost || currentCost;

    if (baselineCost === 0) {
      return;
    }

    const costIncrease = ((currentCost - baselineCost) / baselineCost) * 100;

    let severity: AlertSeverity | null = null;

    if (costIncrease >= this.config.costAnomalyThresholds.critical) {
      severity = AlertSeverity.CRITICAL;
    } else if (costIncrease >= this.config.costAnomalyThresholds.error) {
      severity = AlertSeverity.ERROR;
    } else if (costIncrease >= this.config.costAnomalyThresholds.warning) {
      severity = AlertSeverity.WARNING;
    }

    if (severity) {
      await this.createAlert({
        type: RoutingEfficiencyAlertType.COST_ANOMALY,
        severity,
        message: `Cost anomaly detected: ${costIncrease.toFixed(2)}% increase`,
        details: {
          currentCost,
          baselineCost,
          costIncrease,
          threshold: this.config.costAnomalyThresholds[severity],
        },
        recommendations: [
          "Review operation volume and types",
          "Check for inefficient routing patterns",
          "Analyze token usage per operation",
          "Consider cost optimization strategies",
        ],
      });
    }
  }

  /**
   * Check health degradation
   */
  private async checkHealthDegradation(healthStatus: any): Promise<void> {
    const overallScore = healthStatus.overallScore || 100;

    let severity: AlertSeverity | null = null;

    if (overallScore <= this.config.healthScoreThresholds.critical) {
      severity = AlertSeverity.CRITICAL;
    } else if (overallScore <= this.config.healthScoreThresholds.error) {
      severity = AlertSeverity.ERROR;
    } else if (overallScore <= this.config.healthScoreThresholds.warning) {
      severity = AlertSeverity.WARNING;
    }

    if (severity) {
      const unhealthyComponents = Object.entries(healthStatus.components || {})
        .filter(([_, status]: [string, any]) => status.status !== "healthy")
        .map(([name]) => name);

      await this.createAlert({
        type: RoutingEfficiencyAlertType.HEALTH_DEGRADATION,
        severity,
        message: `Health degradation detected: Score ${overallScore}/100`,
        details: {
          overallScore,
          threshold: this.config.healthScoreThresholds[severity],
          unhealthyComponents,
        },
        recommendations: [
          "Check unhealthy components immediately",
          "Review recent system changes",
          "Analyze error patterns in logs",
          "Consider activating fallback mechanisms",
        ],
      });
    }
  }

  /**
   * Create and send alert
   */
  private async createAlert(
    alertData: Omit<RoutingEfficiencyAlert, "id" | "timestamp">
  ): Promise<void> {
    const alert: RoutingEfficiencyAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...alertData,
    };

    // Store alert
    this.alerts.set(alert.id, alert);

    // Update statistics
    this.updateStatistics(alert);

    // Send notifications based on severity
    await this.sendNotifications(alert);
  }

  /**
   * Send notifications for alert
   */
  private async sendNotifications(
    alert: RoutingEfficiencyAlert
  ): Promise<void> {
    try {
      // Always send SNS notification
      await this.notificationManager.sendNotification({
        subject: `[${alert.severity.toUpperCase()}] Routing Efficiency Alert: ${
          alert.type
        }`,
        message: this.formatAlertMessage(alert),
        attributes: {
          alertId: alert.id,
          alertType: alert.type,
          severity: alert.severity,
          timestamp: alert.timestamp.toISOString(),
        },
      });

      // Send PagerDuty for ERROR and CRITICAL
      if (
        alert.severity === AlertSeverity.ERROR ||
        alert.severity === AlertSeverity.CRITICAL
      ) {
        await this.pagerDutyIntegration.triggerIncident({
          title: `Routing Efficiency Alert: ${alert.type}`,
          description: alert.message,
          severity:
            alert.severity === AlertSeverity.CRITICAL ? "critical" : "error",
          details: alert.details,
          correlationId: alert.correlationId,
        });
      }

      // Create CloudWatch alarm for CRITICAL
      if (alert.severity === AlertSeverity.CRITICAL) {
        await this.alarmManager.createAlarm({
          alarmName: `routing-efficiency-${alert.type}-${Date.now()}`,
          metricName: `RoutingEfficiency${alert.type}`,
          threshold: 1,
          comparisonOperator: "GreaterThanThreshold",
          evaluationPeriods: 1,
          period: 60,
          statistic: "Sum",
          description: alert.message,
        });
      }
    } catch (error) {
      console.error("Error sending alert notifications:", error);
    }
  }

  /**
   * Format alert message
   */
  private formatAlertMessage(alert: RoutingEfficiencyAlert): string {
    let message = `${alert.message}\n\n`;
    message += `Alert ID: ${alert.id}\n`;
    message += `Timestamp: ${alert.timestamp.toISOString()}\n`;
    message += `Type: ${alert.type}\n`;
    message += `Severity: ${alert.severity}\n\n`;

    if (Object.keys(alert.details).length > 0) {
      message += `Details:\n`;
      for (const [key, value] of Object.entries(alert.details)) {
        message += `  ${key}: ${JSON.stringify(value)}\n`;
      }
      message += `\n`;
    }

    if (alert.recommendations.length > 0) {
      message += `Recommendations:\n`;
      for (const recommendation of alert.recommendations) {
        message += `  - ${recommendation}\n`;
      }
    }

    return message;
  }

  /**
   * Update statistics
   */
  private updateStatistics(alert: RoutingEfficiencyAlert): void {
    this.statistics.totalAlerts++;

    // Update by type
    const typeCount = this.statistics.alertsByType.get(alert.type) || 0;
    this.statistics.alertsByType.set(alert.type, typeCount + 1);

    // Update by severity
    const severityCount =
      this.statistics.alertsBySeverity.get(alert.severity) || 0;
    this.statistics.alertsBySeverity.set(alert.severity, severityCount + 1);

    // Update last alert time
    this.statistics.lastAlertTime = alert.timestamp;
  }

  /**
   * Get alert by ID
   */
  getAlert(alertId: string): RoutingEfficiencyAlert | undefined {
    return this.alerts.get(alertId);
  }

  /**
   * Get all alerts
   */
  getAllAlerts(): RoutingEfficiencyAlert[] {
    return Array.from(this.alerts.values());
  }

  /**
   * Get alerts by type
   */
  getAlertsByType(type: RoutingEfficiencyAlertType): RoutingEfficiencyAlert[] {
    return Array.from(this.alerts.values()).filter(
      (alert) => alert.type === type
    );
  }

  /**
   * Get alerts by severity
   */
  getAlertsBySeverity(severity: AlertSeverity): RoutingEfficiencyAlert[] {
    return Array.from(this.alerts.values()).filter(
      (alert) => alert.severity === severity
    );
  }

  /**
   * Get statistics
   */
  getStatistics(): AlertStatistics {
    return { ...this.statistics };
  }

  /**
   * Clear old alerts
   */
  clearOldAlerts(maxAge: number = 24 * 60 * 60 * 1000): void {
    const now = Date.now();
    for (const [id, alert] of this.alerts.entries()) {
      if (now - alert.timestamp.getTime() > maxAge) {
        this.alerts.delete(id);
      }
    }
  }

  /**
   * Update configuration
   */
  updateConfiguration(config: Partial<RoutingEfficiencyAlertConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get configuration
   */
  getConfiguration(): RoutingEfficiencyAlertConfig {
    return { ...this.config };
  }
}

/**
 * Create routing efficiency alerting system
 */
export function createRoutingEfficiencyAlertingSystem(
  alarmManager: CloudWatchAlarmManager,
  notificationManager: SNSNotificationManager,
  pagerDutyIntegration: PagerDutyIntegration,
  performanceMonitor: HybridRoutingPerformanceMonitor,
  healthChecker: HybridHealthChecker,
  config?: Partial<RoutingEfficiencyAlertConfig>
): RoutingEfficiencyAlertingSystem {
  return new RoutingEfficiencyAlertingSystem(
    alarmManager,
    notificationManager,
    pagerDutyIntegration,
    performanceMonitor,
    healthChecker,
    config
  );
}
