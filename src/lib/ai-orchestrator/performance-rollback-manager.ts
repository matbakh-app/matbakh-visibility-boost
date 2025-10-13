/**
 * Performance Rollback Manager
 *
 * Implements automatic rollback mechanisms for performance degradation:
 * - Real-time performance monitoring with SLO violations
 * - Automatic rollback to previous stable configuration
 * - Circuit breaker integration for immediate protection
 * - Gradual rollback with validation checkpoints
 * - Emergency rollback procedures
 * - Performance baseline restoration
 */

import {
  PerformanceAlert,
  PerformanceMetrics,
  ProviderMetrics,
} from "./performance-monitor";
import { Provider } from "./types";

export interface RollbackConfiguration {
  enabled: boolean;
  sloViolationThreshold: number; // Number of consecutive violations before rollback
  rollbackCooldownMs: number; // Minimum time between rollbacks
  validationTimeoutMs: number; // Time to wait for validation after rollback
  emergencyThresholds: {
    errorRate: number; // Emergency rollback if error rate exceeds this
    latencyP95: number; // Emergency rollback if P95 latency exceeds this (ms)
    costPerRequest: number; // Emergency rollback if cost per request exceeds this
  };
  gradualRollback: {
    enabled: boolean;
    trafficReductionSteps: number[]; // Percentage steps for gradual rollback
    stepDurationMs: number; // Duration of each step
  };
}

export interface RollbackState {
  id: string;
  timestamp: Date;
  reason: string;
  severity: "warning" | "critical" | "emergency";
  previousConfiguration: ConfigurationSnapshot;
  currentConfiguration: ConfigurationSnapshot;
  rollbackSteps: RollbackStep[];
  status: "initiated" | "in_progress" | "completed" | "failed" | "cancelled";
  validationResults: ValidationResult[];
}

export interface ConfigurationSnapshot {
  timestamp: Date;
  providerWeights: Record<Provider, number>;
  modelConfigurations: Record<string, any>;
  featureFlags: Record<string, boolean>;
  routingRules: any[];
  performanceBaseline: PerformanceMetrics;
  checksum: string;
}

export interface RollbackStep {
  id: string;
  type:
    | "traffic_reduction"
    | "provider_switch"
    | "model_rollback"
    | "feature_disable"
    | "emergency_stop";
  description: string;
  targetConfiguration: Partial<ConfigurationSnapshot>;
  status: "pending" | "executing" | "completed" | "failed";
  startTime?: Date;
  endTime?: Date;
  validationRequired: boolean;
}

export interface ValidationResult {
  step: string;
  metric: string;
  expectedValue: number;
  actualValue: number;
  passed: boolean;
  timestamp: Date;
}

export class PerformanceRollbackManager {
  private config: RollbackConfiguration;
  private rollbackHistory: RollbackState[] = [];
  private lastRollbackTime: Date | null = null;
  private configurationHistory: ConfigurationSnapshot[] = [];
  private sloViolationCount: number = 0;
  private currentRollback: RollbackState | null = null;

  constructor(config: RollbackConfiguration) {
    this.config = config;
  }

  /**
   * Monitor performance metrics and trigger rollback if needed
   */
  async monitorAndRollback(
    currentMetrics: PerformanceMetrics,
    providerMetrics: ProviderMetrics[],
    alerts: PerformanceAlert[]
  ): Promise<RollbackState | null> {
    if (!this.config.enabled) {
      return null;
    }

    // Check if we're in cooldown period
    if (this.isInCooldown()) {
      return null;
    }

    // Check for emergency conditions
    const emergencyRollback = await this.checkEmergencyConditions(
      currentMetrics
    );
    if (emergencyRollback) {
      return emergencyRollback;
    }

    // Check for SLO violations
    const sloViolations = this.detectSLOViolations(alerts);
    if (sloViolations.length > 0) {
      this.sloViolationCount++;

      if (this.sloViolationCount >= this.config.sloViolationThreshold) {
        return await this.initiateRollback("slo_violation", sloViolations);
      }
    } else {
      // Reset violation count if no violations
      this.sloViolationCount = 0;
    }

    return null;
  }

  /**
   * Check for emergency conditions that require immediate rollback
   */
  private async checkEmergencyConditions(
    metrics: PerformanceMetrics
  ): Promise<RollbackState | null> {
    const { emergencyThresholds } = this.config;

    // Check error rate
    if (metrics.errorRate > emergencyThresholds.errorRate) {
      return await this.initiateEmergencyRollback(
        `Error rate ${metrics.errorRate} exceeds emergency threshold ${emergencyThresholds.errorRate}`
      );
    }

    // Check P95 latency
    if (metrics.p95Latency > emergencyThresholds.latencyP95) {
      return await this.initiateEmergencyRollback(
        `P95 latency ${metrics.p95Latency}ms exceeds emergency threshold ${emergencyThresholds.latencyP95}ms`
      );
    }

    // Check cost per request
    if (metrics.costPerRequest > emergencyThresholds.costPerRequest) {
      return await this.initiateEmergencyRollback(
        `Cost per request ${metrics.costPerRequest} exceeds emergency threshold ${emergencyThresholds.costPerRequest}`
      );
    }

    return null;
  }

  /**
   * Detect SLO violations from alerts
   */
  private detectSLOViolations(alerts: PerformanceAlert[]): PerformanceAlert[] {
    return alerts.filter((alert) => alert.severity === "critical");
  }

  /**
   * Check if we're in cooldown period
   */
  private isInCooldown(): boolean {
    if (!this.lastRollbackTime) {
      return false;
    }

    const timeSinceLastRollback = Date.now() - this.lastRollbackTime.getTime();
    return timeSinceLastRollback < this.config.rollbackCooldownMs;
  }

  /**
   * Initiate emergency rollback
   */
  private async initiateEmergencyRollback(
    reason: string
  ): Promise<RollbackState> {
    const rollbackState: RollbackState = {
      id: this.generateRollbackId(),
      timestamp: new Date(),
      reason,
      severity: "emergency",
      previousConfiguration: this.getCurrentConfiguration(),
      currentConfiguration: this.getLastStableConfiguration(),
      rollbackSteps: this.createEmergencyRollbackSteps(),
      status: "initiated",
      validationResults: [],
    };

    this.currentRollback = rollbackState;
    this.rollbackHistory.push(rollbackState);
    this.lastRollbackTime = new Date();

    // Execute emergency rollback immediately
    await this.executeRollback(rollbackState);

    return rollbackState;
  }

  /**
   * Initiate gradual rollback for SLO violations
   */
  private async initiateRollback(
    type: string,
    violations: PerformanceAlert[]
  ): Promise<RollbackState> {
    const reason = `SLO violations: ${violations
      .map((v) => v.slo.name)
      .join(", ")}`;

    const rollbackState: RollbackState = {
      id: this.generateRollbackId(),
      timestamp: new Date(),
      reason,
      severity: "critical",
      previousConfiguration: this.getCurrentConfiguration(),
      currentConfiguration: this.getLastStableConfiguration(),
      rollbackSteps: this.createGradualRollbackSteps(),
      status: "initiated",
      validationResults: [],
    };

    this.currentRollback = rollbackState;
    this.rollbackHistory.push(rollbackState);
    this.lastRollbackTime = new Date();

    // Execute gradual rollback
    if (this.config.gradualRollback.enabled) {
      await this.executeGradualRollback(rollbackState);
    } else {
      await this.executeRollback(rollbackState);
    }

    return rollbackState;
  }

  /**
   * Execute immediate rollback
   */
  private async executeRollback(rollbackState: RollbackState): Promise<void> {
    rollbackState.status = "in_progress";

    try {
      for (const step of rollbackState.rollbackSteps) {
        await this.executeRollbackStep(step, rollbackState);

        if (step.validationRequired) {
          const validationResult = await this.validateRollbackStep(step);
          rollbackState.validationResults.push(validationResult);

          if (!validationResult.passed) {
            throw new Error(
              `Rollback step validation failed: ${step.description}`
            );
          }
        }
      }

      rollbackState.status = "completed";
      this.currentRollback = null;
    } catch (error) {
      rollbackState.status = "failed";
      console.error("Rollback execution failed:", error);
      throw error;
    }
  }

  /**
   * Execute gradual rollback with traffic reduction steps
   */
  private async executeGradualRollback(
    rollbackState: RollbackState
  ): Promise<void> {
    rollbackState.status = "in_progress";

    try {
      const { trafficReductionSteps, stepDurationMs } =
        this.config.gradualRollback;

      for (const trafficPercentage of trafficReductionSteps) {
        // Create traffic reduction step
        const step: RollbackStep = {
          id: `traffic_reduction_${trafficPercentage}`,
          type: "traffic_reduction",
          description: `Reduce traffic to ${trafficPercentage}%`,
          targetConfiguration: {
            providerWeights:
              this.calculateReducedTrafficWeights(trafficPercentage),
          },
          status: "pending",
          validationRequired: true,
        };

        await this.executeRollbackStep(step, rollbackState);

        // Wait for step duration
        await this.sleep(stepDurationMs);

        // Validate step
        const validationResult = await this.validateRollbackStep(step);
        rollbackState.validationResults.push(validationResult);

        if (validationResult.passed) {
          // If this step resolved the issue, we can stop here
          break;
        }
      }

      // If gradual rollback didn't work, execute full rollback
      if (!this.isPerformanceStable()) {
        for (const step of rollbackState.rollbackSteps) {
          if (step.type !== "traffic_reduction") {
            await this.executeRollbackStep(step, rollbackState);
          }
        }
      }

      rollbackState.status = "completed";
      this.currentRollback = null;
    } catch (error) {
      rollbackState.status = "failed";
      console.error("Gradual rollback execution failed:", error);
      throw error;
    }
  }

  /**
   * Execute a single rollback step
   */
  private async executeRollbackStep(
    step: RollbackStep,
    rollbackState: RollbackState
  ): Promise<void> {
    step.status = "executing";
    step.startTime = new Date();

    try {
      switch (step.type) {
        case "traffic_reduction":
          await this.executeTrafficReduction(step);
          break;
        case "provider_switch":
          await this.executeProviderSwitch(step);
          break;
        case "model_rollback":
          await this.executeModelRollback(step);
          break;
        case "feature_disable":
          await this.executeFeatureDisable(step);
          break;
        case "emergency_stop":
          await this.executeEmergencyStop(step);
          break;
        default:
          throw new Error(`Unknown rollback step type: ${step.type}`);
      }

      step.status = "completed";
      step.endTime = new Date();
    } catch (error) {
      step.status = "failed";
      step.endTime = new Date();
      throw error;
    }
  }

  /**
   * Validate rollback step effectiveness
   */
  private async validateRollbackStep(
    step: RollbackStep
  ): Promise<ValidationResult> {
    // Wait for metrics to stabilize
    await this.sleep(this.config.validationTimeoutMs);

    // Get current metrics
    const currentMetrics = await this.getCurrentMetrics();

    // Define validation criteria based on step type
    let expectedValue: number;
    let actualValue: number;
    let metric: string;

    switch (step.type) {
      case "traffic_reduction":
        metric = "errorRate";
        expectedValue = 0.01; // 1% error rate threshold
        actualValue = currentMetrics.errorRate;
        break;
      case "provider_switch":
        metric = "p95Latency";
        expectedValue = 1500; // 1.5s P95 latency threshold
        actualValue = currentMetrics.p95Latency;
        break;
      default:
        metric = "errorRate";
        expectedValue = 0.05; // 5% error rate threshold
        actualValue = currentMetrics.errorRate;
    }

    const passed = actualValue <= expectedValue;

    return {
      step: step.id,
      metric,
      expectedValue,
      actualValue,
      passed,
      timestamp: new Date(),
    };
  }

  /**
   * Create emergency rollback steps
   */
  private createEmergencyRollbackSteps(): RollbackStep[] {
    return [
      {
        id: "emergency_stop",
        type: "emergency_stop",
        description: "Emergency stop - disable all AI processing",
        targetConfiguration: {},
        status: "pending",
        validationRequired: false,
      },
    ];
  }

  /**
   * Create gradual rollback steps
   */
  private createGradualRollbackSteps(): RollbackStep[] {
    const lastStableConfig = this.getLastStableConfiguration();

    return [
      {
        id: "provider_switch",
        type: "provider_switch",
        description: "Switch to last stable provider configuration",
        targetConfiguration: {
          providerWeights: lastStableConfig.providerWeights,
        },
        status: "pending",
        validationRequired: true,
      },
      {
        id: "model_rollback",
        type: "model_rollback",
        description: "Rollback to last stable model configuration",
        targetConfiguration: {
          modelConfigurations: lastStableConfig.modelConfigurations,
        },
        status: "pending",
        validationRequired: true,
      },
      {
        id: "feature_disable",
        type: "feature_disable",
        description: "Disable experimental features",
        targetConfiguration: {
          featureFlags: this.getConservativeFeatureFlags(),
        },
        status: "pending",
        validationRequired: true,
      },
    ];
  }

  /**
   * Execute traffic reduction
   */
  private async executeTrafficReduction(step: RollbackStep): Promise<void> {
    // Implementation would integrate with traffic routing system
    console.log(`Executing traffic reduction: ${step.description}`);
    // This would call the actual traffic routing system
  }

  /**
   * Execute provider switch
   */
  private async executeProviderSwitch(step: RollbackStep): Promise<void> {
    // Implementation would integrate with provider routing system
    console.log(`Executing provider switch: ${step.description}`);
    // This would call the actual provider routing system
  }

  /**
   * Execute model rollback
   */
  private async executeModelRollback(step: RollbackStep): Promise<void> {
    // Implementation would integrate with model configuration system
    console.log(`Executing model rollback: ${step.description}`);
    // This would call the actual model configuration system
  }

  /**
   * Execute feature disable
   */
  private async executeFeatureDisable(step: RollbackStep): Promise<void> {
    // Implementation would integrate with feature flag system
    console.log(`Executing feature disable: ${step.description}`);
    // This would call the actual feature flag system
  }

  /**
   * Execute emergency stop
   */
  private async executeEmergencyStop(step: RollbackStep): Promise<void> {
    // Implementation would integrate with circuit breaker system
    console.log(`Executing emergency stop: ${step.description}`);
    // This would trigger the circuit breaker to stop all AI processing
  }

  /**
   * Helper methods
   */
  private generateRollbackId(): string {
    return `rollback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getCurrentConfiguration(): ConfigurationSnapshot {
    // This would get the current system configuration
    return {
      timestamp: new Date(),
      providerWeights: { bedrock: 0.4, google: 0.4, meta: 0.2 },
      modelConfigurations: {},
      featureFlags: {},
      routingRules: [],
      performanceBaseline: this.getDefaultPerformanceBaseline(),
      checksum: "current",
    };
  }

  private getLastStableConfiguration(): ConfigurationSnapshot {
    // This would get the last known stable configuration
    const lastStable = this.configurationHistory
      .filter((config) => this.isConfigurationStable(config))
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];

    return lastStable || this.getDefaultConfiguration();
  }

  private getDefaultConfiguration(): ConfigurationSnapshot {
    return {
      timestamp: new Date(),
      providerWeights: { bedrock: 0.5, google: 0.3, meta: 0.2 },
      modelConfigurations: {},
      featureFlags: {},
      routingRules: [],
      performanceBaseline: this.getDefaultPerformanceBaseline(),
      checksum: "default",
    };
  }

  private getDefaultPerformanceBaseline(): PerformanceMetrics {
    return {
      requestCount: 0,
      successCount: 0,
      errorCount: 0,
      totalLatency: 0,
      totalCost: 0,
      p95Latency: 1000,
      p99Latency: 2000,
      averageLatency: 500,
      errorRate: 0.01,
      costPerRequest: 0.001,
      throughputRPS: 10,
      lastUpdated: new Date(),
    };
  }

  private isConfigurationStable(config: ConfigurationSnapshot): boolean {
    // This would check if a configuration is considered stable
    // based on historical performance data
    return (
      config.performanceBaseline.errorRate < 0.05 &&
      config.performanceBaseline.p95Latency < 2000
    );
  }

  private calculateReducedTrafficWeights(
    percentage: number
  ): Record<Provider, number> {
    const currentWeights = this.getCurrentConfiguration().providerWeights;
    const reductionFactor = percentage / 100;

    const reducedWeights: Record<Provider, number> = {} as any;
    for (const [provider, weight] of Object.entries(currentWeights)) {
      reducedWeights[provider as Provider] = weight * reductionFactor;
    }

    return reducedWeights;
  }

  private getConservativeFeatureFlags(): Record<string, boolean> {
    // Return conservative feature flag settings
    return {
      experimentalFeatures: false,
      advancedRouting: false,
      aggressiveCaching: false,
    };
  }

  private async getCurrentMetrics(): Promise<PerformanceMetrics> {
    // This would get current performance metrics from the monitoring system
    return this.getDefaultPerformanceBaseline();
  }

  private isPerformanceStable(): boolean {
    // This would check if current performance is stable
    return true; // Placeholder
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Public API methods
   */

  /**
   * Get current rollback status
   */
  getCurrentRollback(): RollbackState | null {
    return this.currentRollback;
  }

  /**
   * Get rollback history
   */
  getRollbackHistory(): RollbackState[] {
    return [...this.rollbackHistory];
  }

  /**
   * Cancel current rollback
   */
  async cancelRollback(): Promise<boolean> {
    if (!this.currentRollback) {
      return false;
    }

    this.currentRollback.status = "cancelled";
    this.currentRollback = null;
    return true;
  }

  /**
   * Save configuration snapshot
   */
  saveConfigurationSnapshot(config: ConfigurationSnapshot): void {
    this.configurationHistory.push(config);

    // Keep only last 50 snapshots
    if (this.configurationHistory.length > 50) {
      this.configurationHistory = this.configurationHistory.slice(-50);
    }
  }

  /**
   * Update rollback configuration
   */
  updateConfiguration(config: Partial<RollbackConfiguration>): void {
    this.config = { ...this.config, ...config };
  }
}

/**
 * Default rollback configuration
 */
export const DEFAULT_ROLLBACK_CONFIG: RollbackConfiguration = {
  enabled: true,
  sloViolationThreshold: 3,
  rollbackCooldownMs: 5 * 60 * 1000, // 5 minutes
  validationTimeoutMs: 30 * 1000, // 30 seconds
  emergencyThresholds: {
    errorRate: 0.1, // 10%
    latencyP95: 5000, // 5 seconds
    costPerRequest: 0.1, // $0.10
  },
  gradualRollback: {
    enabled: true,
    trafficReductionSteps: [80, 60, 40, 20], // Reduce traffic in steps
    stepDurationMs: 2 * 60 * 1000, // 2 minutes per step
  },
};
