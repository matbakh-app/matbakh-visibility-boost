/**
 * AI Feature Flags with Monitoring Integration
 *
 * Extends the base AiFeatureFlags class with monitoring capabilities
 */

import {
  AiFeatureFlags,
  FeatureFlagValidationResult,
} from "./ai-feature-flags";
import { FeatureFlagActivationMonitor } from "./feature-flag-activation-monitor";
import { Provider } from "./types";

/**
 * Enhanced AI Feature Flags with monitoring integration
 */
export class AiFeatureFlagsWithMonitoring extends AiFeatureFlags {
  private monitor: FeatureFlagActivationMonitor;

  constructor(options: any = {}) {
    super(options);
    this.monitor = new FeatureFlagActivationMonitor({
      successRateThreshold: 99.0,
      warningThreshold: 95.0,
      maxOperationDuration: 100, // 100ms requirement
      alertingEnabled: true,
      metricsRetentionDays: 30,
      batchSize: 100,
    });
  }

  /**
   * Set a flag value with monitoring
   */
  setFlag(key: string, value: boolean): void {
    const startTime = Date.now();

    try {
      super.setFlag(key, value);

      // Record successful operation
      const duration = Date.now() - startTime;
      this.monitor
        .recordOperation({
          flagName: key,
          operation: "set",
          success: true,
          duration,
          environment: this.getEnvironment(),
        })
        .catch((error: any) => {
          console.warn("Failed to record flag operation:", error);
        });
    } catch (error) {
      // Record failed operation
      const duration = Date.now() - startTime;
      this.monitor
        .recordOperation({
          flagName: key,
          operation: "set",
          success: false,
          duration,
          error: error instanceof Error ? error.message : String(error),
          environment: this.getEnvironment(),
        })
        .catch((recordError: any) => {
          console.warn("Failed to record flag operation:", recordError);
        });

      throw error;
    }
  }

  /**
   * Get a flag value with monitoring
   */
  getFlag(key: string, defaultValue: boolean = false): boolean {
    const startTime = Date.now();

    try {
      const result = super.getFlag(key, defaultValue);

      // Record successful operation
      const duration = Date.now() - startTime;
      this.monitor
        .recordOperation({
          flagName: key,
          operation: "get",
          success: true,
          duration,
          environment: this.getEnvironment(),
        })
        .catch((error: any) => {
          console.warn("Failed to record flag operation:", error);
        });

      return result;
    } catch (error) {
      // Record failed operation
      const duration = Date.now() - startTime;
      this.monitor
        .recordOperation({
          flagName: key,
          operation: "get",
          success: false,
          duration,
          error: error instanceof Error ? error.message : String(error),
          environment: this.getEnvironment(),
        })
        .catch((recordError: any) => {
          console.warn("Failed to record flag operation:", recordError);
        });

      throw error;
    }
  }

  /**
   * Enable or disable Bedrock Support Mode with monitoring
   */
  async setBedrockSupportModeEnabled(enabled: boolean): Promise<void> {
    const startTime = Date.now();
    const operation = enabled ? "activate" : "deactivate";

    try {
      await super.setBedrockSupportModeEnabled(enabled);

      // Record successful operation
      const duration = Date.now() - startTime;
      await this.monitor.recordOperation({
        flagName: "ENABLE_BEDROCK_SUPPORT_MODE",
        operation,
        success: true,
        duration,
        environment: this.getEnvironment(),
      });
    } catch (error) {
      // Record failed operation
      const duration = Date.now() - startTime;
      await this.monitor.recordOperation({
        flagName: "ENABLE_BEDROCK_SUPPORT_MODE",
        operation,
        success: false,
        duration,
        error: error instanceof Error ? error.message : String(error),
        environment: this.getEnvironment(),
      });

      throw error;
    }
  }

  /**
   * Enable or disable Intelligent Routing with monitoring
   */
  async setIntelligentRoutingEnabled(enabled: boolean): Promise<void> {
    const startTime = Date.now();
    const operation = enabled ? "activate" : "deactivate";

    try {
      await super.setIntelligentRoutingEnabled(enabled);

      // Record successful operation
      const duration = Date.now() - startTime;
      await this.monitor.recordOperation({
        flagName: "ENABLE_INTELLIGENT_ROUTING",
        operation,
        success: true,
        duration,
        environment: this.getEnvironment(),
      });
    } catch (error) {
      // Record failed operation
      const duration = Date.now() - startTime;
      await this.monitor.recordOperation({
        flagName: "ENABLE_INTELLIGENT_ROUTING",
        operation,
        success: false,
        duration,
        error: error instanceof Error ? error.message : String(error),
        environment: this.getEnvironment(),
      });

      throw error;
    }
  }

  /**
   * Enable or disable Direct Bedrock Fallback with monitoring
   */
  async setDirectBedrockFallbackEnabled(enabled: boolean): Promise<void> {
    const startTime = Date.now();
    const operation = enabled ? "activate" : "deactivate";

    try {
      await super.setDirectBedrockFallbackEnabled(enabled);

      // Record successful operation
      const duration = Date.now() - startTime;
      await this.monitor.recordOperation({
        flagName: "ENABLE_DIRECT_BEDROCK_FALLBACK",
        operation,
        success: true,
        duration,
        environment: this.getEnvironment(),
      });
    } catch (error) {
      // Record failed operation
      const duration = Date.now() - startTime;
      await this.monitor.recordOperation({
        flagName: "ENABLE_DIRECT_BEDROCK_FALLBACK",
        operation,
        success: false,
        duration,
        error: error instanceof Error ? error.message : String(error),
        environment: this.getEnvironment(),
      });

      throw error;
    }
  }

  /**
   * Enable or disable a provider with monitoring
   */
  async setProviderEnabled(
    provider: Provider,
    enabled: boolean
  ): Promise<void> {
    const startTime = Date.now();
    const operation = enabled ? "activate" : "deactivate";
    const flagName = `ai.provider.${provider}.enabled`;

    try {
      await super.setProviderEnabled(provider, enabled);

      // Record successful operation
      const duration = Date.now() - startTime;
      await this.monitor.recordOperation({
        flagName,
        operation,
        success: true,
        duration,
        environment: this.getEnvironment(),
      });
    } catch (error) {
      // Record failed operation
      const duration = Date.now() - startTime;
      await this.monitor.recordOperation({
        flagName,
        operation,
        success: false,
        duration,
        error: error instanceof Error ? error.message : String(error),
        environment: this.getEnvironment(),
      });

      throw error;
    }
  }

  /**
   * Get feature flag activation success rate
   */
  async getActivationSuccessRate(timeWindow: string = "24h"): Promise<number> {
    return await this.monitor.getCurrentSuccessRate(timeWindow);
  }

  /**
   * Check if activation success rate meets the 99% threshold
   */
  async isActivationSuccessRateAcceptable(
    timeWindow: string = "24h"
  ): Promise<boolean> {
    return await this.monitor.isSuccessRateAcceptable(timeWindow);
  }

  /**
   * Get activation metrics for monitoring
   */
  async getActivationMetrics(timeWindow: string = "24h") {
    return await this.monitor.getActivationMetrics(timeWindow);
  }

  /**
   * Get activation metrics by flag name
   */
  async getActivationMetricsByFlag(
    flagName: string,
    timeWindow: string = "24h"
  ) {
    return await this.monitor.getActivationMetricsByFlag(flagName, timeWindow);
  }

  /**
   * Get activation metrics by environment
   */
  async getActivationMetricsByEnvironment(
    environment: "development" | "staging" | "production" | "test",
    timeWindow: string = "24h"
  ) {
    return await this.monitor.getActivationMetricsByEnvironment(
      environment,
      timeWindow
    );
  }

  /**
   * Get active alerts for feature flag operations
   */
  getActivationAlerts() {
    return this.monitor.getActiveAlerts();
  }

  /**
   * Get failed operations for troubleshooting
   */
  getFailedOperations(timeWindow: string = "24h") {
    return this.monitor.getFailedOperations(timeWindow);
  }

  /**
   * Export all activation metrics for external monitoring
   */
  async exportActivationMetrics(timeWindow: string = "24h") {
    return await this.monitor.exportMetrics(timeWindow);
  }

  /**
   * Get the activation monitor instance for advanced operations
   */
  getActivationMonitor() {
    return this.monitor;
  }

  /**
   * Safely enable Bedrock Support Mode with validation and monitoring
   */
  async enableBedrockSupportModeSafely(): Promise<FeatureFlagValidationResult> {
    const startTime = Date.now();

    try {
      const result = await super.enableBedrockSupportModeSafely();

      // Record the operation
      const duration = Date.now() - startTime;
      await this.monitor.recordOperation({
        flagName: "ENABLE_BEDROCK_SUPPORT_MODE",
        operation: "activate",
        success: result.isValid,
        duration,
        error: result.isValid ? undefined : result.errors.join("; "),
        environment: this.getEnvironment(),
      });

      return result;
    } catch (error) {
      // Record failed operation
      const duration = Date.now() - startTime;
      await this.monitor.recordOperation({
        flagName: "ENABLE_BEDROCK_SUPPORT_MODE",
        operation: "activate",
        success: false,
        duration,
        error: error instanceof Error ? error.message : String(error),
        environment: this.getEnvironment(),
      });

      throw error;
    }
  }

  /**
   * Get current environment (expose for monitoring)
   */
  private getMonitoringEnvironment():
    | "development"
    | "staging"
    | "production"
    | "test" {
    if (typeof process !== "undefined" && process.env) {
      if (
        process.env.NODE_ENV === "test" ||
        process.env.JEST_WORKER_ID !== undefined
      ) {
        return "test";
      }
      const env = process.env.NODE_ENV || process.env.ENVIRONMENT;
      if (env === "production" || env === "staging") {
        return env as "production" | "staging";
      }
    }
    return "development";
  }
}
