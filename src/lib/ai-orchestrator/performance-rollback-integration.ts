/**
 * Performance Rollback Integration
 *
 * Integrates the performance rollback manager with existing systems:
 * - Performance monitoring system
 * - AI orchestrator
 * - Circuit breaker
 * - Feature flags
 * - Provider routing
 */

import { AiFeatureFlags } from "./ai-feature-flags";
import { CircuitBreaker } from "./circuit-breaker";
import { PerformanceMetrics, PerformanceMonitor } from "./performance-monitor";
import {
  DEFAULT_ROLLBACK_CONFIG,
  PerformanceRollbackManager,
  RollbackState,
} from "./performance-rollback-manager";
import { Provider } from "./types";

export interface RollbackIntegrationConfig {
  monitoringIntervalMs: number;
  alertingEnabled: boolean;
  notificationWebhook?: string;
  slackChannel?: string;
  emergencyContacts: string[];
}

export interface RollbackNotification {
  type:
    | "rollback_initiated"
    | "rollback_completed"
    | "rollback_failed"
    | "emergency_stop";
  rollbackId: string;
  severity: "warning" | "critical" | "emergency";
  message: string;
  timestamp: Date;
  metrics?: PerformanceMetrics;
  rollbackState?: RollbackState;
}

export class PerformanceRollbackIntegration {
  private rollbackManager: PerformanceRollbackManager;
  private performanceMonitor: PerformanceMonitor;
  private circuitBreaker: CircuitBreaker;
  private featureFlags: AiFeatureFlags;
  private config: RollbackIntegrationConfig;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isMonitoring: boolean = false;

  constructor(
    performanceMonitor: PerformanceMonitor,
    circuitBreaker: CircuitBreaker,
    featureFlags: AiFeatureFlags,
    config: RollbackIntegrationConfig
  ) {
    this.performanceMonitor = performanceMonitor;
    this.circuitBreaker = circuitBreaker;
    this.featureFlags = featureFlags;
    this.config = config;
    this.rollbackManager = new PerformanceRollbackManager(
      DEFAULT_ROLLBACK_CONFIG
    );
  }

  /**
   * Start continuous performance monitoring and rollback detection
   */
  startMonitoring(): void {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(
      () => this.performMonitoringCycle(),
      this.config.monitoringIntervalMs
    );

    console.log("Performance rollback monitoring started");
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    console.log("Performance rollback monitoring stopped");
  }

  /**
   * Perform a single monitoring cycle
   */
  private async performMonitoringCycle(): Promise<void> {
    try {
      // Get current performance metrics
      const currentMetrics = await this.performanceMonitor.getCurrentMetrics();
      const providerMetrics =
        await this.performanceMonitor.getProviderMetrics();
      const alerts = await this.performanceMonitor.getActiveAlerts();

      // Check for rollback conditions
      const rollbackState = await this.rollbackManager.monitorAndRollback(
        currentMetrics,
        providerMetrics,
        alerts
      );

      if (rollbackState) {
        await this.handleRollbackInitiated(rollbackState, currentMetrics);
      }

      // Save current configuration snapshot if performance is stable
      if (this.isPerformanceStable(currentMetrics)) {
        const configSnapshot = await this.createConfigurationSnapshot(
          currentMetrics
        );
        this.rollbackManager.saveConfigurationSnapshot(configSnapshot);
      }
    } catch (error) {
      console.error("Error in performance monitoring cycle:", error);

      if (this.config.alertingEnabled) {
        await this.sendNotification({
          type: "rollback_failed",
          rollbackId: "monitoring_error",
          severity: "critical",
          message: `Performance monitoring cycle failed: ${error}`,
          timestamp: new Date(),
        });
      }
    }
  }

  /**
   * Handle rollback initiation
   */
  private async handleRollbackInitiated(
    rollbackState: RollbackState,
    metrics: PerformanceMetrics
  ): Promise<void> {
    console.log(
      `Rollback initiated: ${rollbackState.id} - ${rollbackState.reason}`
    );

    // Send notification
    if (this.config.alertingEnabled) {
      await this.sendNotification({
        type: "rollback_initiated",
        rollbackId: rollbackState.id,
        severity: rollbackState.severity,
        message: rollbackState.reason,
        timestamp: rollbackState.timestamp,
        metrics,
        rollbackState,
      });
    }

    // Execute rollback steps through integration
    await this.executeRollbackIntegration(rollbackState);

    // Monitor rollback completion
    this.monitorRollbackCompletion(rollbackState);
  }

  /**
   * Execute rollback through system integrations
   */
  private async executeRollbackIntegration(
    rollbackState: RollbackState
  ): Promise<void> {
    for (const step of rollbackState.rollbackSteps) {
      try {
        switch (step.type) {
          case "emergency_stop":
            await this.executeEmergencyStop();
            break;
          case "traffic_reduction":
            await this.executeTrafficReduction(step.targetConfiguration);
            break;
          case "provider_switch":
            await this.executeProviderSwitch(step.targetConfiguration);
            break;
          case "model_rollback":
            await this.executeModelRollback(step.targetConfiguration);
            break;
          case "feature_disable":
            await this.executeFeatureDisable(step.targetConfiguration);
            break;
        }
      } catch (error) {
        console.error(`Failed to execute rollback step ${step.id}:`, error);
        step.status = "failed";
      }
    }
  }

  /**
   * Execute emergency stop
   */
  private async executeEmergencyStop(): Promise<void> {
    // Trigger circuit breaker to stop all AI processing
    await this.circuitBreaker.forceOpen("emergency_rollback");

    // Disable all experimental features
    await this.featureFlags.disableAllExperimentalFeatures();

    console.log("Emergency stop executed - all AI processing halted");
  }

  /**
   * Execute traffic reduction
   */
  private async executeTrafficReduction(targetConfig: any): Promise<void> {
    if (targetConfig.providerWeights) {
      // This would integrate with the actual traffic routing system
      console.log("Executing traffic reduction:", targetConfig.providerWeights);

      // Example: Update provider weights in the routing system
      // await this.routingSystem.updateProviderWeights(targetConfig.providerWeights);
    }
  }

  /**
   * Execute provider switch
   */
  private async executeProviderSwitch(targetConfig: any): Promise<void> {
    if (targetConfig.providerWeights) {
      console.log("Executing provider switch:", targetConfig.providerWeights);

      // This would integrate with the provider routing system
      // await this.providerRouter.updateWeights(targetConfig.providerWeights);
    }
  }

  /**
   * Execute model rollback
   */
  private async executeModelRollback(targetConfig: any): Promise<void> {
    if (targetConfig.modelConfigurations) {
      console.log(
        "Executing model rollback:",
        targetConfig.modelConfigurations
      );

      // This would integrate with the model configuration system
      // await this.modelManager.rollbackToConfiguration(targetConfig.modelConfigurations);
    }
  }

  /**
   * Execute feature disable
   */
  private async executeFeatureDisable(targetConfig: any): Promise<void> {
    if (targetConfig.featureFlags) {
      console.log("Executing feature disable:", targetConfig.featureFlags);

      // Update feature flags
      for (const [flag, enabled] of Object.entries(targetConfig.featureFlags)) {
        await this.featureFlags.setFlag(flag, enabled as boolean);
      }
    }
  }

  /**
   * Monitor rollback completion
   */
  private monitorRollbackCompletion(rollbackState: RollbackState): void {
    const checkCompletion = async () => {
      const currentRollback = this.rollbackManager.getCurrentRollback();

      if (!currentRollback || currentRollback.id !== rollbackState.id) {
        return; // Rollback completed or cancelled
      }

      if (currentRollback.status === "completed") {
        await this.handleRollbackCompleted(currentRollback);
      } else if (currentRollback.status === "failed") {
        await this.handleRollbackFailed(currentRollback);
      } else {
        // Still in progress, check again later
        setTimeout(checkCompletion, 5000);
      }
    };

    setTimeout(checkCompletion, 1000);
  }

  /**
   * Handle rollback completion
   */
  private async handleRollbackCompleted(
    rollbackState: RollbackState
  ): Promise<void> {
    console.log(`Rollback completed: ${rollbackState.id}`);

    if (this.config.alertingEnabled) {
      await this.sendNotification({
        type: "rollback_completed",
        rollbackId: rollbackState.id,
        severity: rollbackState.severity,
        message: `Rollback completed successfully: ${rollbackState.reason}`,
        timestamp: new Date(),
        rollbackState,
      });
    }
  }

  /**
   * Handle rollback failure
   */
  private async handleRollbackFailed(
    rollbackState: RollbackState
  ): Promise<void> {
    console.error(`Rollback failed: ${rollbackState.id}`);

    if (this.config.alertingEnabled) {
      await this.sendNotification({
        type: "rollback_failed",
        rollbackId: rollbackState.id,
        severity: "emergency",
        message: `Rollback failed: ${rollbackState.reason}`,
        timestamp: new Date(),
        rollbackState,
      });
    }

    // Escalate to emergency contacts
    await this.escalateToEmergencyContacts(rollbackState);
  }

  /**
   * Send notification
   */
  private async sendNotification(
    notification: RollbackNotification
  ): Promise<void> {
    try {
      // Log notification
      console.log("Rollback notification:", notification);

      // Send to webhook if configured
      if (this.config.notificationWebhook) {
        await this.sendWebhookNotification(notification);
      }

      // Send to Slack if configured
      if (this.config.slackChannel) {
        await this.sendSlackNotification(notification);
      }
    } catch (error) {
      console.error("Failed to send rollback notification:", error);
    }
  }

  /**
   * Send webhook notification
   */
  private async sendWebhookNotification(
    notification: RollbackNotification
  ): Promise<void> {
    if (!this.config.notificationWebhook) {
      return;
    }

    const payload = {
      ...notification,
      source: "matbakh-ai-orchestrator",
      environment: process.env.NODE_ENV || "development",
    };

    // This would make an actual HTTP request to the webhook
    console.log("Webhook notification payload:", payload);
  }

  /**
   * Send Slack notification
   */
  private async sendSlackNotification(
    notification: RollbackNotification
  ): Promise<void> {
    if (!this.config.slackChannel) {
      return;
    }

    const message = this.formatSlackMessage(notification);

    // This would send to Slack API
    console.log("Slack notification:", message);
  }

  /**
   * Format Slack message
   */
  private formatSlackMessage(notification: RollbackNotification): string {
    const emoji =
      notification.severity === "emergency"
        ? "🚨"
        : notification.severity === "critical"
        ? "⚠️"
        : "ℹ️";

    let message = `${emoji} *AI System Rollback ${notification.type
      .replace("_", " ")
      .toUpperCase()}*\n`;
    message += `*Rollback ID:* ${notification.rollbackId}\n`;
    message += `*Severity:* ${notification.severity}\n`;
    message += `*Message:* ${notification.message}\n`;
    message += `*Time:* ${notification.timestamp.toISOString()}\n`;

    if (notification.metrics) {
      message += `\n*Performance Metrics:*\n`;
      message += `• Error Rate: ${(
        notification.metrics.errorRate * 100
      ).toFixed(2)}%\n`;
      message += `• P95 Latency: ${notification.metrics.p95Latency}ms\n`;
      message += `• Cost/Request: $${notification.metrics.costPerRequest.toFixed(
        4
      )}\n`;
    }

    return message;
  }

  /**
   * Escalate to emergency contacts
   */
  private async escalateToEmergencyContacts(
    rollbackState: RollbackState
  ): Promise<void> {
    for (const contact of this.config.emergencyContacts) {
      try {
        // This would send emergency notifications (email, SMS, etc.)
        console.log(`Escalating to emergency contact: ${contact}`);
      } catch (error) {
        console.error(`Failed to escalate to ${contact}:`, error);
      }
    }
  }

  /**
   * Check if performance is stable
   */
  private isPerformanceStable(metrics: PerformanceMetrics): boolean {
    return (
      metrics.errorRate < 0.05 &&
      metrics.p95Latency < 2000 &&
      metrics.costPerRequest < 0.01
    );
  }

  /**
   * Create configuration snapshot
   */
  private async createConfigurationSnapshot(
    metrics: PerformanceMetrics
  ): Promise<any> {
    return {
      timestamp: new Date(),
      providerWeights: await this.getCurrentProviderWeights(),
      modelConfigurations: await this.getCurrentModelConfigurations(),
      featureFlags: await this.getCurrentFeatureFlags(),
      routingRules: await this.getCurrentRoutingRules(),
      performanceBaseline: metrics,
      checksum: this.generateChecksum(metrics),
    };
  }

  /**
   * Get current provider weights
   */
  private async getCurrentProviderWeights(): Promise<Record<Provider, number>> {
    // This would get current weights from the routing system
    return { bedrock: 0.4, google: 0.4, meta: 0.2 };
  }

  /**
   * Get current model configurations
   */
  private async getCurrentModelConfigurations(): Promise<Record<string, any>> {
    // This would get current model configurations
    return {};
  }

  /**
   * Get current feature flags
   */
  private async getCurrentFeatureFlags(): Promise<Record<string, boolean>> {
    return await this.featureFlags.getAllFlags();
  }

  /**
   * Get current routing rules
   */
  private async getCurrentRoutingRules(): Promise<any[]> {
    // This would get current routing rules
    return [];
  }

  /**
   * Generate checksum for configuration
   */
  private generateChecksum(metrics: PerformanceMetrics): string {
    const data = JSON.stringify({
      timestamp: Date.now(),
      errorRate: metrics.errorRate,
      p95Latency: metrics.p95Latency,
      costPerRequest: metrics.costPerRequest,
    });

    // Simple hash function for demonstration
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return hash.toString(36);
  }

  /**
   * Public API methods
   */

  /**
   * Get current rollback status
   */
  getCurrentRollback(): RollbackState | null {
    return this.rollbackManager.getCurrentRollback();
  }

  /**
   * Get rollback history
   */
  getRollbackHistory(): RollbackState[] {
    return this.rollbackManager.getRollbackHistory();
  }

  /**
   * Manually trigger rollback
   */
  async triggerManualRollback(reason: string): Promise<RollbackState> {
    const currentMetrics = await this.performanceMonitor.getCurrentMetrics();

    // Create a critical alert to trigger rollback
    const manualAlert = {
      id: "manual_rollback",
      slo: {
        name: "Manual Rollback",
        metric: "errorRate" as keyof PerformanceMetrics,
        threshold: 0,
        operator: "lt" as const,
        severity: "critical" as const,
      },
      currentValue: 1,
      threshold: 0,
      severity: "critical" as const,
      timestamp: new Date(),
      message: reason,
    };

    return (
      (await this.rollbackManager.monitorAndRollback(
        currentMetrics,
        [],
        [manualAlert]
      )) ||
      (await this.rollbackManager["initiateRollback"]("manual", [manualAlert]))
    );
  }

  /**
   * Cancel current rollback
   */
  async cancelRollback(): Promise<boolean> {
    return await this.rollbackManager.cancelRollback();
  }

  /**
   * Update rollback configuration
   */
  updateRollbackConfiguration(config: any): void {
    this.rollbackManager.updateConfiguration(config);
  }

  /**
   * Update integration configuration
   */
  updateIntegrationConfiguration(
    config: Partial<RollbackIntegrationConfig>
  ): void {
    this.config = { ...this.config, ...config };
  }
}

/**
 * Default integration configuration
 */
export const DEFAULT_INTEGRATION_CONFIG: RollbackIntegrationConfig = {
  monitoringIntervalMs: 30 * 1000, // 30 seconds
  alertingEnabled: true,
  emergencyContacts: [],
};
