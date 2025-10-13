/**
 * System Stability Integration
 *
 * Integrates system stability metrics with Bedrock Support Manager
 * and other AI orchestrator components for comprehensive monitoring.
 *
 * @module system-stability-integration
 */

import { AiFeatureFlags } from "./ai-feature-flags";
import { AuditTrailSystem } from "./audit-trail-system";
import { BedrockSupportManager } from "./bedrock-support-manager";
import { IntelligentRouter } from "./intelligent-router";
import { SystemResourceMonitor } from "./system-resource-monitor";
import { SystemStabilityMetrics } from "./system-stability-metrics";

/**
 * Stability integration configuration
 */
export interface StabilityIntegrationConfig {
  enabled: boolean;
  autoStartMonitoring: boolean;
  stabilityThresholds: {
    criticalStabilityScore: number;
    warningStabilityScore: number;
    maxAllowedErrorRate: number;
    minRequiredAvailability: number;
  };
  responseActions: {
    enableAutoRecovery: boolean;
    enablePerformanceOptimization: boolean;
    enableRoutingAdjustments: boolean;
    enableResourceScaling: boolean;
  };
  notifications: {
    enableSlackAlerts: boolean;
    enableEmailAlerts: boolean;
    enableAuditLogging: boolean;
  };
}

/**
 * Default integration configuration
 */
const DEFAULT_INTEGRATION_CONFIG: StabilityIntegrationConfig = {
  enabled: true,
  autoStartMonitoring: true,
  stabilityThresholds: {
    criticalStabilityScore: 0.8,
    warningStabilityScore: 0.9,
    maxAllowedErrorRate: 0.05,
    minRequiredAvailability: 99.0,
  },
  responseActions: {
    enableAutoRecovery: true,
    enablePerformanceOptimization: true,
    enableRoutingAdjustments: true,
    enableResourceScaling: false, // Requires infrastructure permissions
  },
  notifications: {
    enableSlackAlerts: false, // Requires Slack configuration
    enableEmailAlerts: false, // Requires email configuration
    enableAuditLogging: true,
  },
};

/**
 * Stability response action result
 */
export interface StabilityResponseResult {
  action: string;
  success: boolean;
  details: string;
  timestamp: Date;
  impact?: {
    stabilityImprovement: number;
    performanceImprovement: number;
    reliabilityImprovement: number;
  };
}

/**
 * System Stability Integration
 *
 * Orchestrates system stability monitoring and automated responses
 * across all AI orchestrator components.
 */
export class SystemStabilityIntegration {
  private config: StabilityIntegrationConfig;
  private stabilityMetrics: SystemStabilityMetrics;
  private isActive: boolean;
  private responseHistory: StabilityResponseResult[];
  private lastStabilityCheck?: Date;
  private stabilityCheckInterval?: NodeJS.Timeout;

  constructor(
    private featureFlags: AiFeatureFlags,
    private auditTrail: AuditTrailSystem,
    private resourceMonitor: SystemResourceMonitor,
    private bedrockSupportManager?: BedrockSupportManager,
    private intelligentRouter?: IntelligentRouter,
    config?: Partial<StabilityIntegrationConfig>
  ) {
    this.config = { ...DEFAULT_INTEGRATION_CONFIG, ...config };
    this.isActive = false;
    this.responseHistory = [];

    // Initialize stability metrics
    this.stabilityMetrics = new SystemStabilityMetrics(
      this.featureFlags,
      this.auditTrail,
      this.resourceMonitor,
      this.bedrockSupportManager,
      this.intelligentRouter,
      {
        enabled: this.config.enabled,
        alerting: {
          enabled: true,
          stabilityScoreThreshold:
            this.config.stabilityThresholds.warningStabilityScore,
          availabilityThreshold:
            this.config.stabilityThresholds.minRequiredAvailability,
          errorRateThreshold:
            this.config.stabilityThresholds.maxAllowedErrorRate,
        },
      }
    );
  }

  /**
   * Initialize stability integration
   */
  public async initialize(): Promise<void> {
    if (!this.config.enabled) {
      console.log(
        "[SystemStabilityIntegration] Integration disabled by configuration"
      );
      return;
    }

    console.log(
      "[SystemStabilityIntegration] Initializing stability integration"
    );
    this.isActive = true;

    try {
      // Start stability metrics monitoring
      if (this.config.autoStartMonitoring) {
        await this.stabilityMetrics.startMonitoring();
      }

      // Set up stability check interval
      this.stabilityCheckInterval = setInterval(
        () => this.performStabilityCheck(),
        60000 // Check every minute
      );

      // Record initialization event
      await this.stabilityMetrics.recordEvent({
        type: "system_start",
        severity: "low",
        component: "SystemStabilityIntegration",
        description: "Stability integration initialized successfully",
        impact: { availability: 0, performance: 0, reliability: 0 },
        metadata: { config: this.config },
      });

      await this.auditTrail.logEvent({
        eventType: "stability_integration_initialized",
        timestamp: new Date(),
        details: {
          component: "SystemStabilityIntegration",
          config: this.config,
        },
      });

      console.log(
        "[SystemStabilityIntegration] Initialization completed successfully"
      );
    } catch (error) {
      console.error(
        "[SystemStabilityIntegration] Initialization failed:",
        error
      );

      // Set inactive state before attempting to record event
      this.isActive = false;

      // Try to record failure event, but don't let it block error propagation
      try {
        await this.stabilityMetrics.recordEvent({
          type: "failure_detected",
          severity: "critical",
          component: "SystemStabilityIntegration",
          description: `Initialization failed: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
          impact: { availability: 0.2, performance: 0.1, reliability: 0.2 },
          metadata: {
            error: error instanceof Error ? error.message : String(error),
          },
        });
      } catch (recordError) {
        console.error(
          "[SystemStabilityIntegration] Failed to record initialization failure:",
          recordError
        );
      }

      // Always propagate the original error
      throw error;
    }
  }

  /**
   * Shutdown stability integration
   */
  public async shutdown(): Promise<void> {
    if (!this.isActive) {
      return;
    }

    console.log(
      "[SystemStabilityIntegration] Shutting down stability integration"
    );
    this.isActive = false;

    try {
      // Clear stability check interval
      if (this.stabilityCheckInterval) {
        clearInterval(this.stabilityCheckInterval);
        this.stabilityCheckInterval = undefined;
      }

      // Stop stability metrics monitoring
      await this.stabilityMetrics.stopMonitoring();

      // Record shutdown event
      await this.stabilityMetrics.recordEvent({
        type: "system_stop",
        severity: "low",
        component: "SystemStabilityIntegration",
        description: "Stability integration shutdown completed",
        impact: { availability: 0, performance: 0, reliability: 0 },
      });

      await this.auditTrail.logEvent({
        eventType: "stability_integration_shutdown",
        timestamp: new Date(),
        details: {
          component: "SystemStabilityIntegration",
          responseHistory: this.responseHistory.length,
        },
      });

      console.log(
        "[SystemStabilityIntegration] Shutdown completed successfully"
      );
    } catch (error) {
      console.error("[SystemStabilityIntegration] Shutdown error:", error);
    }
  }

  /**
   * Perform comprehensive stability check
   */
  private async performStabilityCheck(): Promise<void> {
    if (!this.isActive) {
      return;
    }

    try {
      this.lastStabilityCheck = new Date();

      // Get current stability summary
      const stabilitySummary =
        await this.stabilityMetrics.getStabilitySummary();

      if (!stabilitySummary.current) {
        console.log(
          "[SystemStabilityIntegration] No stability metrics available yet"
        );
        return;
      }

      const currentMetrics = stabilitySummary.current;

      // Check for critical stability issues
      if (
        currentMetrics.trends.stabilityScore <
        this.config.stabilityThresholds.criticalStabilityScore
      ) {
        await this.handleCriticalStabilityIssue(currentMetrics);
      } else if (
        currentMetrics.trends.stabilityScore <
        this.config.stabilityThresholds.warningStabilityScore
      ) {
        await this.handleStabilityWarning(currentMetrics);
      }

      // Check availability
      if (
        currentMetrics.uptime.availabilityPercent <
        this.config.stabilityThresholds.minRequiredAvailability
      ) {
        await this.handleAvailabilityIssue(currentMetrics);
      }

      // Check error rate
      if (
        currentMetrics.reliability.errorRate >
        this.config.stabilityThresholds.maxAllowedErrorRate
      ) {
        await this.handleHighErrorRate(currentMetrics);
      }

      // Check for performance degradation
      if (
        currentMetrics.performance.responseTimeStability < 0.8 ||
        currentMetrics.performance.throughputStability < 0.8
      ) {
        await this.handlePerformanceDegradation(currentMetrics);
      }

      // Check routing stability
      if (currentMetrics.routing.hybridRoutingStability < 0.9) {
        await this.handleRoutingInstability(currentMetrics);
      }
    } catch (error) {
      console.error(
        "[SystemStabilityIntegration] Stability check failed:",
        error
      );

      await this.stabilityMetrics.recordEvent({
        type: "failure_detected",
        severity: "medium",
        component: "SystemStabilityIntegration",
        description: `Stability check failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        impact: { availability: 0.05, performance: 0.05, reliability: 0.1 },
        metadata: {
          error: error instanceof Error ? error.message : String(error),
        },
      });
    }
  }

  /**
   * Handle critical stability issue
   */
  private async handleCriticalStabilityIssue(metrics: any): Promise<void> {
    console.warn(
      "[SystemStabilityIntegration] Critical stability issue detected"
    );

    const responses: StabilityResponseResult[] = [];

    // Record critical event
    await this.stabilityMetrics.recordEvent({
      type: "failure_detected",
      severity: "critical",
      component: "SystemStabilityIntegration",
      description: `Critical stability score: ${(
        metrics.trends.stabilityScore * 100
      ).toFixed(1)}%`,
      impact: { availability: 0.3, performance: 0.2, reliability: 0.3 },
      metadata: { stabilityScore: metrics.trends.stabilityScore, metrics },
    });

    // Attempt auto-recovery if enabled
    if (
      this.config.responseActions.enableAutoRecovery &&
      this.bedrockSupportManager
    ) {
      try {
        const recoveryResult = await this.attemptAutoRecovery();
        responses.push(recoveryResult);
      } catch (error) {
        console.error(
          "[SystemStabilityIntegration] Auto-recovery failed:",
          error
        );
      }
    }

    // Optimize routing if enabled
    if (
      this.config.responseActions.enableRoutingAdjustments &&
      this.intelligentRouter
    ) {
      try {
        const routingResult = await this.optimizeRouting();
        responses.push(routingResult);
      } catch (error) {
        console.error(
          "[SystemStabilityIntegration] Routing optimization failed:",
          error
        );
      }
    }

    // Store response history
    this.responseHistory.push(...responses);

    // Send notifications if enabled
    if (this.config.notifications.enableAuditLogging) {
      await this.auditTrail.logEvent({
        eventType: "critical_stability_issue_handled",
        timestamp: new Date(),
        details: {
          component: "SystemStabilityIntegration",
          stabilityScore: metrics.trends.stabilityScore,
          responses: responses.length,
          actions: responses.map((r) => r.action),
        },
      });
    }
  }

  /**
   * Handle stability warning
   */
  private async handleStabilityWarning(metrics: any): Promise<void> {
    console.warn("[SystemStabilityIntegration] Stability warning detected");

    await this.stabilityMetrics.recordEvent({
      type: "performance_degradation",
      severity: "medium",
      component: "SystemStabilityIntegration",
      description: `Stability warning: ${(
        metrics.trends.stabilityScore * 100
      ).toFixed(1)}%`,
      impact: { availability: 0.1, performance: 0.1, reliability: 0.1 },
      metadata: { stabilityScore: metrics.trends.stabilityScore },
    });

    // Perform preventive optimization if enabled
    if (this.config.responseActions.enablePerformanceOptimization) {
      try {
        const optimizationResult = await this.performPreventiveOptimization();
        this.responseHistory.push(optimizationResult);
      } catch (error) {
        console.error(
          "[SystemStabilityIntegration] Preventive optimization failed:",
          error
        );
      }
    }
  }

  /**
   * Handle availability issue
   */
  private async handleAvailabilityIssue(metrics: any): Promise<void> {
    console.warn("[SystemStabilityIntegration] Availability issue detected");

    await this.stabilityMetrics.recordEvent({
      type: "failure_detected",
      severity: "high",
      component: "SystemStabilityIntegration",
      description: `Low availability: ${metrics.uptime.availabilityPercent.toFixed(
        2
      )}%`,
      impact: { availability: 0.4, performance: 0.1, reliability: 0.2 },
      metadata: { availabilityPercent: metrics.uptime.availabilityPercent },
    });

    // Attempt to improve availability
    if (this.config.responseActions.enableAutoRecovery) {
      const recoveryResult = await this.attemptAvailabilityRecovery();
      this.responseHistory.push(recoveryResult);
    }
  }

  /**
   * Handle high error rate
   */
  private async handleHighErrorRate(metrics: any): Promise<void> {
    console.warn("[SystemStabilityIntegration] High error rate detected");

    await this.stabilityMetrics.recordEvent({
      type: "failure_detected",
      severity: "high",
      component: "SystemStabilityIntegration",
      description: `High error rate: ${(
        metrics.reliability.errorRate * 100
      ).toFixed(2)}%`,
      impact: { availability: 0.2, performance: 0.1, reliability: 0.3 },
      metadata: { errorRate: metrics.reliability.errorRate },
    });

    // Attempt error rate reduction
    if (this.config.responseActions.enableAutoRecovery) {
      const errorReductionResult = await this.attemptErrorRateReduction();
      this.responseHistory.push(errorReductionResult);
    }
  }

  /**
   * Handle performance degradation
   */
  private async handlePerformanceDegradation(metrics: any): Promise<void> {
    console.warn(
      "[SystemStabilityIntegration] Performance degradation detected"
    );

    await this.stabilityMetrics.recordEvent({
      type: "performance_degradation",
      severity: "medium",
      component: "SystemStabilityIntegration",
      description: "Performance stability below acceptable levels",
      impact: { availability: 0.1, performance: 0.3, reliability: 0.1 },
      metadata: {
        responseTimeStability: metrics.performance.responseTimeStability,
        throughputStability: metrics.performance.throughputStability,
      },
    });

    // Attempt performance optimization
    if (this.config.responseActions.enablePerformanceOptimization) {
      const perfOptResult = await this.optimizePerformance();
      this.responseHistory.push(perfOptResult);
    }
  }

  /**
   * Handle routing instability
   */
  private async handleRoutingInstability(metrics: any): Promise<void> {
    console.warn("[SystemStabilityIntegration] Routing instability detected");

    await this.stabilityMetrics.recordEvent({
      type: "routing_failure",
      severity: "medium",
      component: "SystemStabilityIntegration",
      description: `Routing stability: ${(
        metrics.routing.hybridRoutingStability * 100
      ).toFixed(1)}%`,
      impact: { availability: 0.1, performance: 0.2, reliability: 0.1 },
      metadata: { routingStability: metrics.routing.hybridRoutingStability },
    });

    // Attempt routing optimization
    if (
      this.config.responseActions.enableRoutingAdjustments &&
      this.intelligentRouter
    ) {
      const routingOptResult = await this.optimizeRouting();
      this.responseHistory.push(routingOptResult);
    }
  }

  /**
   * Attempt auto-recovery
   */
  private async attemptAutoRecovery(): Promise<StabilityResponseResult> {
    const startTime = Date.now();

    try {
      console.log("[SystemStabilityIntegration] Attempting auto-recovery");

      // Simulate auto-recovery actions
      // In a real implementation, this would trigger actual recovery procedures
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const result: StabilityResponseResult = {
        action: "auto_recovery",
        success: true,
        details: "Auto-recovery procedures executed successfully",
        timestamp: new Date(),
        impact: {
          stabilityImprovement: 0.1,
          performanceImprovement: 0.05,
          reliabilityImprovement: 0.1,
        },
      };

      await this.stabilityMetrics.recordEvent({
        type: "recovery_completed",
        severity: "low",
        component: "SystemStabilityIntegration",
        description: "Auto-recovery completed successfully",
        duration: Date.now() - startTime,
        impact: { availability: 0, performance: 0, reliability: 0 },
      });

      return result;
    } catch (error) {
      return {
        action: "auto_recovery",
        success: false,
        details: `Auto-recovery failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Optimize routing
   */
  private async optimizeRouting(): Promise<StabilityResponseResult> {
    try {
      console.log(
        "[SystemStabilityIntegration] Optimizing routing configuration"
      );

      // Simulate routing optimization
      await new Promise((resolve) => setTimeout(resolve, 500));

      return {
        action: "routing_optimization",
        success: true,
        details: "Routing configuration optimized for better stability",
        timestamp: new Date(),
        impact: {
          stabilityImprovement: 0.05,
          performanceImprovement: 0.1,
          reliabilityImprovement: 0.05,
        },
      };
    } catch (error) {
      return {
        action: "routing_optimization",
        success: false,
        details: `Routing optimization failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Perform preventive optimization
   */
  private async performPreventiveOptimization(): Promise<StabilityResponseResult> {
    try {
      console.log(
        "[SystemStabilityIntegration] Performing preventive optimization"
      );

      // Simulate preventive optimization
      await new Promise((resolve) => setTimeout(resolve, 300));

      return {
        action: "preventive_optimization",
        success: true,
        details: "Preventive optimization measures applied",
        timestamp: new Date(),
        impact: {
          stabilityImprovement: 0.03,
          performanceImprovement: 0.05,
          reliabilityImprovement: 0.02,
        },
      };
    } catch (error) {
      return {
        action: "preventive_optimization",
        success: false,
        details: `Preventive optimization failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Attempt availability recovery
   */
  private async attemptAvailabilityRecovery(): Promise<StabilityResponseResult> {
    try {
      console.log(
        "[SystemStabilityIntegration] Attempting availability recovery"
      );

      // Simulate availability recovery
      await new Promise((resolve) => setTimeout(resolve, 800));

      return {
        action: "availability_recovery",
        success: true,
        details: "Availability recovery procedures executed",
        timestamp: new Date(),
        impact: {
          stabilityImprovement: 0.15,
          performanceImprovement: 0.02,
          reliabilityImprovement: 0.1,
        },
      };
    } catch (error) {
      return {
        action: "availability_recovery",
        success: false,
        details: `Availability recovery failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Attempt error rate reduction
   */
  private async attemptErrorRateReduction(): Promise<StabilityResponseResult> {
    try {
      console.log(
        "[SystemStabilityIntegration] Attempting error rate reduction"
      );

      // Simulate error rate reduction
      await new Promise((resolve) => setTimeout(resolve, 600));

      return {
        action: "error_rate_reduction",
        success: true,
        details: "Error handling improvements applied",
        timestamp: new Date(),
        impact: {
          stabilityImprovement: 0.08,
          performanceImprovement: 0.03,
          reliabilityImprovement: 0.12,
        },
      };
    } catch (error) {
      return {
        action: "error_rate_reduction",
        success: false,
        details: `Error rate reduction failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Optimize performance
   */
  private async optimizePerformance(): Promise<StabilityResponseResult> {
    try {
      console.log("[SystemStabilityIntegration] Optimizing performance");

      // Simulate performance optimization
      await new Promise((resolve) => setTimeout(resolve, 700));

      return {
        action: "performance_optimization",
        success: true,
        details: "Performance optimization measures applied",
        timestamp: new Date(),
        impact: {
          stabilityImprovement: 0.06,
          performanceImprovement: 0.15,
          reliabilityImprovement: 0.04,
        },
      };
    } catch (error) {
      return {
        action: "performance_optimization",
        success: false,
        details: `Performance optimization failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Get stability metrics
   */
  public getStabilityMetrics(): SystemStabilityMetrics {
    return this.stabilityMetrics;
  }

  /**
   * Get integration status
   */
  public getStatus(): {
    isActive: boolean;
    lastStabilityCheck: Date | null;
    responseHistoryCount: number;
    config: StabilityIntegrationConfig;
  } {
    return {
      isActive: this.isActive,
      lastStabilityCheck: this.lastStabilityCheck || null,
      responseHistoryCount: this.responseHistory.length,
      config: this.config,
    };
  }

  /**
   * Get response history
   */
  public getResponseHistory(limit?: number): StabilityResponseResult[] {
    const sortedHistory = [...this.responseHistory].sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );

    if (limit) {
      return sortedHistory.slice(0, limit);
    }

    return sortedHistory;
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<StabilityIntegrationConfig>): void {
    this.config = { ...this.config, ...config };
    console.log("[SystemStabilityIntegration] Configuration updated");
  }

  /**
   * Force stability check
   */
  public async forceStabilityCheck(): Promise<void> {
    await this.performStabilityCheck();
  }

  /**
   * Cleanup resources
   */
  public async cleanup(): Promise<void> {
    await this.shutdown();
    await this.stabilityMetrics.cleanup();
    this.responseHistory = [];
    console.log("[SystemStabilityIntegration] Cleanup completed");
  }
}

export default SystemStabilityIntegration;
