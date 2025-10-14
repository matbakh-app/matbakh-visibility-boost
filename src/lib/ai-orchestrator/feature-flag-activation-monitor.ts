/**
 * Feature Flag Activation Monitor
 *
 * Monitors and tracks the success rate of feature flag activation/deactivation operations
 * to ensure > 99% success rate as required by the Bedrock Activation specification.
 */

export interface FeatureFlagOperation {
  id: string;
  flagName: string;
  operation: "activate" | "deactivate" | "validate" | "get" | "set";
  timestamp: Date;
  success: boolean;
  duration: number; // milliseconds
  error?: string;
  environment: "development" | "staging" | "production" | "test";
  correlationId?: string;
}

export interface ActivationMetrics {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  successRate: number; // percentage
  averageDuration: number; // milliseconds
  p95Duration: number; // milliseconds
  p99Duration: number; // milliseconds
  lastFailure?: FeatureFlagOperation;
  timeWindow: string; // e.g., "24h", "7d", "30d"
}

export interface ActivationAlert {
  id: string;
  timestamp: Date;
  severity: "warning" | "critical";
  message: string;
  currentSuccessRate: number;
  threshold: number;
  affectedFlags: string[];
  recommendedActions: string[];
}

export interface ActivationMonitorConfig {
  successRateThreshold: number; // Default: 99.0
  warningThreshold: number; // Default: 95.0
  maxOperationDuration: number; // Default: 5000ms
  alertingEnabled: boolean;
  metricsRetentionDays: number; // Default: 30
  batchSize: number; // Default: 100
}

/**
 * Feature Flag Activation Monitor
 *
 * Tracks and monitors feature flag operations to ensure high success rates
 */
export class FeatureFlagActivationMonitor {
  private operations: FeatureFlagOperation[] = [];
  private alerts: ActivationAlert[] = [];
  private config: ActivationMonitorConfig;

  constructor(config: Partial<ActivationMonitorConfig> = {}) {
    this.config = {
      successRateThreshold: 99.0,
      warningThreshold: 95.0,
      maxOperationDuration: 5000,
      alertingEnabled: true,
      metricsRetentionDays: 30,
      batchSize: 100,
      ...config,
    };
  }

  /**
   * Record a feature flag operation
   */
  async recordOperation(
    operation: Omit<FeatureFlagOperation, "id" | "timestamp">
  ): Promise<void> {
    const fullOperation: FeatureFlagOperation = {
      id: this.generateOperationId(),
      timestamp: new Date(),
      ...operation,
    };

    this.operations.push(fullOperation);

    // Clean up old operations
    await this.cleanupOldOperations();

    // Check success rate and generate alerts if needed
    if (this.config.alertingEnabled) {
      await this.checkSuccessRateAndAlert();
    }

    // Log operation for audit trail
    this.logOperation(fullOperation);
  }

  /**
   * Record a successful feature flag activation
   */
  async recordSuccessfulActivation(
    flagName: string,
    duration: number,
    environment: string = "development",
    correlationId?: string
  ): Promise<void> {
    await this.recordOperation({
      flagName,
      operation: "activate",
      success: true,
      duration,
      environment: environment as any,
      correlationId,
    });
  }

  /**
   * Record a failed feature flag activation
   */
  async recordFailedActivation(
    flagName: string,
    duration: number,
    error: string,
    environment: string = "development",
    correlationId?: string
  ): Promise<void> {
    await this.recordOperation({
      flagName,
      operation: "activate",
      success: false,
      duration,
      error,
      environment: environment as any,
      correlationId,
    });
  }

  /**
   * Record a successful feature flag deactivation
   */
  async recordSuccessfulDeactivation(
    flagName: string,
    duration: number,
    environment: string = "development",
    correlationId?: string
  ): Promise<void> {
    await this.recordOperation({
      flagName,
      operation: "deactivate",
      success: true,
      duration,
      environment: environment as any,
      correlationId,
    });
  }

  /**
   * Record a failed feature flag deactivation
   */
  async recordFailedDeactivation(
    flagName: string,
    duration: number,
    error: string,
    environment: string = "development",
    correlationId?: string
  ): Promise<void> {
    await this.recordOperation({
      flagName,
      operation: "deactivate",
      success: false,
      duration,
      error,
      environment: environment as any,
      correlationId,
    });
  }

  /**
   * Get activation metrics for a specific time window
   */
  async getActivationMetrics(
    timeWindow: string = "24h"
  ): Promise<ActivationMetrics> {
    const windowStart = this.getTimeWindowStart(timeWindow);
    const relevantOperations = this.operations.filter(
      (op) => op.timestamp >= windowStart
    );

    const totalOperations = relevantOperations.length;
    const successfulOperations = relevantOperations.filter(
      (op) => op.success
    ).length;
    const failedOperations = totalOperations - successfulOperations;
    const successRate =
      totalOperations > 0
        ? (successfulOperations / totalOperations) * 100
        : 100;

    const durations = relevantOperations
      .map((op) => op.duration)
      .sort((a, b) => a - b);
    const averageDuration =
      durations.length > 0
        ? durations.reduce((sum, d) => sum + d, 0) / durations.length
        : 0;

    const p95Index = Math.floor(durations.length * 0.95);
    const p99Index = Math.floor(durations.length * 0.99);
    const p95Duration =
      durations.length > 0
        ? durations[p95Index] || durations[durations.length - 1]
        : 0;
    const p99Duration =
      durations.length > 0
        ? durations[p99Index] || durations[durations.length - 1]
        : 0;

    const lastFailure = relevantOperations
      .filter((op) => !op.success)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];

    return {
      totalOperations,
      successfulOperations,
      failedOperations,
      successRate,
      averageDuration,
      p95Duration,
      p99Duration,
      lastFailure,
      timeWindow,
    };
  }

  /**
   * Get activation metrics by flag name
   */
  async getActivationMetricsByFlag(
    flagName: string,
    timeWindow: string = "24h"
  ): Promise<ActivationMetrics> {
    const windowStart = this.getTimeWindowStart(timeWindow);
    const relevantOperations = this.operations.filter(
      (op) => op.timestamp >= windowStart && op.flagName === flagName
    );

    const totalOperations = relevantOperations.length;
    const successfulOperations = relevantOperations.filter(
      (op) => op.success
    ).length;
    const failedOperations = totalOperations - successfulOperations;
    const successRate =
      totalOperations > 0
        ? (successfulOperations / totalOperations) * 100
        : 100;

    const durations = relevantOperations
      .map((op) => op.duration)
      .sort((a, b) => a - b);
    const averageDuration =
      durations.length > 0
        ? durations.reduce((sum, d) => sum + d, 0) / durations.length
        : 0;

    const p95Index = Math.floor(durations.length * 0.95);
    const p99Index = Math.floor(durations.length * 0.99);
    const p95Duration =
      durations.length > 0
        ? durations[p95Index] || durations[durations.length - 1]
        : 0;
    const p99Duration =
      durations.length > 0
        ? durations[p99Index] || durations[durations.length - 1]
        : 0;

    const lastFailure = relevantOperations
      .filter((op) => !op.success)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];

    return {
      totalOperations,
      successfulOperations,
      failedOperations,
      successRate,
      averageDuration,
      p95Duration,
      p99Duration,
      lastFailure,
      timeWindow,
    };
  }

  /**
   * Get activation metrics by environment
   */
  async getActivationMetricsByEnvironment(
    environment: "development" | "staging" | "production" | "test",
    timeWindow: string = "24h"
  ): Promise<ActivationMetrics> {
    const windowStart = this.getTimeWindowStart(timeWindow);
    const relevantOperations = this.operations.filter(
      (op) => op.timestamp >= windowStart && op.environment === environment
    );

    const totalOperations = relevantOperations.length;
    const successfulOperations = relevantOperations.filter(
      (op) => op.success
    ).length;
    const failedOperations = totalOperations - successfulOperations;
    const successRate =
      totalOperations > 0
        ? (successfulOperations / totalOperations) * 100
        : 100;

    const durations = relevantOperations
      .map((op) => op.duration)
      .sort((a, b) => a - b);
    const averageDuration =
      durations.length > 0
        ? durations.reduce((sum, d) => sum + d, 0) / durations.length
        : 0;

    const p95Index = Math.floor(durations.length * 0.95);
    const p99Index = Math.floor(durations.length * 0.99);
    const p95Duration =
      durations.length > 0
        ? durations[p95Index] || durations[durations.length - 1]
        : 0;
    const p99Duration =
      durations.length > 0
        ? durations[p99Index] || durations[durations.length - 1]
        : 0;

    const lastFailure = relevantOperations
      .filter((op) => !op.success)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];

    return {
      totalOperations,
      successfulOperations,
      failedOperations,
      successRate,
      averageDuration,
      p95Duration,
      p99Duration,
      lastFailure,
      timeWindow,
    };
  }

  /**
   * Check if current success rate meets the threshold (> 99%)
   */
  async isSuccessRateAcceptable(timeWindow: string = "24h"): Promise<boolean> {
    const metrics = await this.getActivationMetrics(timeWindow);
    return metrics.successRate >= this.config.successRateThreshold;
  }

  /**
   * Get current success rate
   */
  async getCurrentSuccessRate(timeWindow: string = "24h"): Promise<number> {
    const metrics = await this.getActivationMetrics(timeWindow);
    return metrics.successRate;
  }

  /**
   * Get all active alerts
   */
  getActiveAlerts(): ActivationAlert[] {
    // Return alerts from the last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return this.alerts.filter((alert) => alert.timestamp >= oneDayAgo);
  }

  /**
   * Get alerts by severity
   */
  getAlertsBySeverity(severity: "warning" | "critical"): ActivationAlert[] {
    return this.getActiveAlerts().filter(
      (alert) => alert.severity === severity
    );
  }

  /**
   * Clear all alerts (for testing or manual resolution)
   */
  clearAlerts(): void {
    this.alerts = [];
  }

  /**
   * Get configuration
   */
  getConfig(): ActivationMonitorConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<ActivationMonitorConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get operation history
   */
  getOperationHistory(limit: number = 100): FeatureFlagOperation[] {
    return this.operations
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get failed operations
   */
  getFailedOperations(timeWindow: string = "24h"): FeatureFlagOperation[] {
    const windowStart = this.getTimeWindowStart(timeWindow);
    return this.operations
      .filter((op) => op.timestamp >= windowStart && !op.success)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get slow operations (above P95 threshold)
   */
  getSlowOperations(timeWindow: string = "24h"): FeatureFlagOperation[] {
    const windowStart = this.getTimeWindowStart(timeWindow);
    const relevantOperations = this.operations.filter(
      (op) => op.timestamp >= windowStart
    );

    if (relevantOperations.length === 0) return [];

    const durations = relevantOperations
      .map((op) => op.duration)
      .sort((a, b) => a - b);
    const p95Index = Math.floor(durations.length * 0.95);
    const p95Threshold = durations[p95Index] || durations[durations.length - 1];

    return relevantOperations
      .filter((op) => op.duration >= p95Threshold)
      .sort((a, b) => b.duration - a.duration);
  }

  /**
   * Export metrics for external monitoring systems
   */
  async exportMetrics(timeWindow: string = "24h"): Promise<{
    overall: ActivationMetrics;
    byFlag: Record<string, ActivationMetrics>;
    byEnvironment: Record<string, ActivationMetrics>;
    alerts: ActivationAlert[];
  }> {
    const overall = await this.getActivationMetrics(timeWindow);

    // Get unique flag names
    const windowStart = this.getTimeWindowStart(timeWindow);
    const relevantOperations = this.operations.filter(
      (op) => op.timestamp >= windowStart
    );

    const uniqueFlags = [
      ...new Set(relevantOperations.map((op) => op.flagName)),
    ];
    const uniqueEnvironments = [
      ...new Set(relevantOperations.map((op) => op.environment)),
    ];

    const byFlag: Record<string, ActivationMetrics> = {};
    for (const flagName of uniqueFlags) {
      byFlag[flagName] = await this.getActivationMetricsByFlag(
        flagName,
        timeWindow
      );
    }

    const byEnvironment: Record<string, ActivationMetrics> = {};
    for (const environment of uniqueEnvironments) {
      byEnvironment[environment] = await this.getActivationMetricsByEnvironment(
        environment as any,
        timeWindow
      );
    }

    return {
      overall,
      byFlag,
      byEnvironment,
      alerts: this.getActiveAlerts(),
    };
  }

  /**
   * Generate operation ID
   */
  private generateOperationId(): string {
    return `flag-op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get time window start date
   */
  private getTimeWindowStart(timeWindow: string): Date {
    const now = new Date();

    if (timeWindow.endsWith("h")) {
      const hours = parseInt(timeWindow.slice(0, -1));
      return new Date(now.getTime() - hours * 60 * 60 * 1000);
    } else if (timeWindow.endsWith("d")) {
      const days = parseInt(timeWindow.slice(0, -1));
      return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    } else if (timeWindow.endsWith("m")) {
      const minutes = parseInt(timeWindow.slice(0, -1));
      return new Date(now.getTime() - minutes * 60 * 1000);
    }

    // Default to 24 hours
    return new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }

  /**
   * Clean up old operations based on retention policy
   */
  private async cleanupOldOperations(): Promise<void> {
    const cutoffDate = new Date(
      Date.now() - this.config.metricsRetentionDays * 24 * 60 * 60 * 1000
    );

    this.operations = this.operations.filter(
      (op) => op.timestamp >= cutoffDate
    );
  }

  /**
   * Check success rate and generate alerts if needed
   */
  private async checkSuccessRateAndAlert(): Promise<void> {
    const metrics = await this.getActivationMetrics("1h"); // Check last hour

    if (metrics.totalOperations < 5) {
      // Not enough data to make a reliable assessment
      return;
    }

    if (metrics.successRate < this.config.successRateThreshold) {
      // Critical alert - below 99% threshold
      const alert: ActivationAlert = {
        id: this.generateAlertId(),
        timestamp: new Date(),
        severity: "critical",
        message: `Feature flag activation success rate (${metrics.successRate.toFixed(
          2
        )}%) is below critical threshold (${
          this.config.successRateThreshold
        }%)`,
        currentSuccessRate: metrics.successRate,
        threshold: this.config.successRateThreshold,
        affectedFlags: this.getRecentlyFailedFlags(),
        recommendedActions: [
          "Check system health and resource availability",
          "Review recent failed operations for patterns",
          "Consider temporarily disabling non-critical feature flags",
          "Escalate to on-call engineer if issue persists",
        ],
      };

      this.alerts.push(alert);
    } else if (metrics.successRate < this.config.warningThreshold) {
      // Warning alert - below 95% threshold
      const alert: ActivationAlert = {
        id: this.generateAlertId(),
        timestamp: new Date(),
        severity: "warning",
        message: `Feature flag activation success rate (${metrics.successRate.toFixed(
          2
        )}%) is below warning threshold (${this.config.warningThreshold}%)`,
        currentSuccessRate: metrics.successRate,
        threshold: this.config.warningThreshold,
        affectedFlags: this.getRecentlyFailedFlags(),
        recommendedActions: [
          "Monitor system closely for degradation",
          "Review recent failed operations",
          "Check system resource utilization",
          "Prepare for potential escalation",
        ],
      };

      this.alerts.push(alert);
    }
  }

  /**
   * Get recently failed flag names
   */
  private getRecentlyFailedFlags(): string[] {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentFailures = this.operations.filter(
      (op) => op.timestamp >= oneHourAgo && !op.success
    );

    return [...new Set(recentFailures.map((op) => op.flagName))];
  }

  /**
   * Generate alert ID
   */
  private generateAlertId(): string {
    return `flag-alert-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;
  }

  /**
   * Log operation for audit trail
   */
  private logOperation(operation: FeatureFlagOperation): void {
    const logLevel = operation.success ? "info" : "error";
    const message = `Feature flag ${operation.operation} ${
      operation.success ? "succeeded" : "failed"
    }: ${operation.flagName} (${operation.duration}ms)`;

    if (typeof console !== "undefined") {
      if (logLevel === "error") {
        console.error(`[FeatureFlagActivationMonitor] ${message}`, {
          operation,
          error: operation.error,
        });
      } else {
        console.log(`[FeatureFlagActivationMonitor] ${message}`, {
          operationId: operation.id,
          correlationId: operation.correlationId,
        });
      }
    }
  }
}

/**
 * Global instance for easy access
 */
export const featureFlagActivationMonitor = new FeatureFlagActivationMonitor();
