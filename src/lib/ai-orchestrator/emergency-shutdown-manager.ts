/**
 * Emergency Shutdown Manager for Hybrid Routing
 *
 * Provides emergency shutdown capabilities for the Bedrock Support Mode
 * hybrid routing system. Enables rapid response to security incidents,
 * system failures, or compliance violations.
 */

import { AiFeatureFlags } from "./ai-feature-flags";
import { AuditTrailSystem } from "./audit-trail-system";
import { CircuitBreaker } from "./circuit-breaker";

// Emergency Shutdown Reasons
export type EmergencyShutdownReason =
  | "security_incident"
  | "compliance_violation"
  | "system_failure"
  | "performance_degradation"
  | "cost_overrun"
  | "manual_intervention"
  | "circuit_breaker_triggered"
  | "health_check_failure";

// Emergency Shutdown Scope
export type EmergencyShutdownScope =
  | "all" // Shutdown entire hybrid routing system
  | "direct_bedrock" // Shutdown only direct Bedrock path
  | "mcp" // Shutdown only MCP path
  | "intelligent_router" // Shutdown intelligent routing (fallback to MCP only)
  | "support_mode"; // Shutdown entire support mode

// Emergency Shutdown Configuration
export interface EmergencyShutdownConfig {
  enableAutoShutdown: boolean; // Enable automatic shutdown on critical events
  shutdownThresholds: {
    errorRate: number; // Error rate threshold (e.g., 0.1 = 10%)
    latencyMs: number; // Latency threshold in milliseconds
    costEuroPerHour: number; // Cost threshold per hour
    consecutiveFailures: number; // Consecutive failures before shutdown
  };
  notificationChannels: {
    slack?: string; // Slack webhook URL
    email?: string[]; // Email addresses
    pagerduty?: string; // PagerDuty integration key
  };
  recoveryConfig: {
    autoRecoveryEnabled: boolean; // Enable automatic recovery
    recoveryDelayMs: number; // Delay before attempting recovery
    healthCheckIntervalMs: number; // Health check interval during recovery
    maxRecoveryAttempts: number; // Maximum recovery attempts
  };
}

// Emergency Shutdown Status
export interface EmergencyShutdownStatus {
  isShutdown: boolean;
  scope: EmergencyShutdownScope | null;
  reason: EmergencyShutdownReason | null;
  timestamp: Date | null;
  triggeredBy: "automatic" | "manual" | null;
  affectedComponents: string[];
  recoveryStatus: {
    inProgress: boolean;
    attempts: number;
    lastAttempt: Date | null;
    nextAttempt: Date | null;
  };
}

// Emergency Shutdown Event
export interface EmergencyShutdownEvent {
  eventId: string;
  scope: EmergencyShutdownScope;
  reason: EmergencyShutdownReason;
  triggeredBy: "automatic" | "manual";
  timestamp: Date;
  metadata: {
    errorRate?: number;
    latencyMs?: number;
    costEuro?: number;
    consecutiveFailures?: number;
    additionalInfo?: Record<string, any>;
  };
  affectedComponents: string[];
  notificationsSent: boolean;
}

/**
 * Emergency Shutdown Manager
 *
 * Manages emergency shutdown procedures for the hybrid routing system.
 * Provides rapid response capabilities for critical incidents.
 */
export class EmergencyShutdownManager {
  private config: EmergencyShutdownConfig;
  private status: EmergencyShutdownStatus;
  private featureFlags: AiFeatureFlags;
  private auditTrail: AuditTrailSystem;
  private circuitBreaker: CircuitBreaker;
  private shutdownHistory: EmergencyShutdownEvent[] = [];
  private recoveryInterval?: NodeJS.Timeout;

  // Monitoring metrics
  private metrics = {
    errorRate: 0,
    latencyMs: 0,
    costEuroPerHour: 0,
    consecutiveFailures: 0,
    lastHealthCheck: new Date(),
  };

  constructor(
    config: Partial<EmergencyShutdownConfig> = {},
    auditTrail?: AuditTrailSystem
  ) {
    this.config = {
      enableAutoShutdown: true,
      shutdownThresholds: {
        errorRate: 0.1, // 10% error rate
        latencyMs: 5000, // 5 seconds
        costEuroPerHour: 100, // €100 per hour
        consecutiveFailures: 5, // 5 consecutive failures
      },
      notificationChannels: {},
      recoveryConfig: {
        autoRecoveryEnabled: true,
        recoveryDelayMs: 300000, // 5 minutes
        healthCheckIntervalMs: 30000, // 30 seconds
        maxRecoveryAttempts: 3,
      },
      ...config,
    };

    this.status = {
      isShutdown: false,
      scope: null,
      reason: null,
      timestamp: null,
      triggeredBy: null,
      affectedComponents: [],
      recoveryStatus: {
        inProgress: false,
        attempts: 0,
        lastAttempt: null,
        nextAttempt: null,
      },
    };

    this.featureFlags = new AiFeatureFlags();
    this.auditTrail =
      auditTrail ||
      new AuditTrailSystem({
        complianceMode: "strict",
        enableIntegrityChecking: true,
        retentionDays: 2555,
      });
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 5,
      recoveryTimeout: 60000,
      halfOpenMaxCalls: 2,
    });
  }

  /**
   * Trigger emergency shutdown
   */
  async triggerShutdown(
    scope: EmergencyShutdownScope,
    reason: EmergencyShutdownReason,
    triggeredBy: "automatic" | "manual" = "manual",
    metadata?: Record<string, any>
  ): Promise<EmergencyShutdownEvent> {
    const eventId = this.generateEventId();

    // Create shutdown event
    const event: EmergencyShutdownEvent = {
      eventId,
      scope,
      reason,
      triggeredBy,
      timestamp: new Date(),
      metadata: {
        errorRate: this.metrics.errorRate,
        latencyMs: this.metrics.latencyMs,
        costEuro: this.metrics.costEuroPerHour,
        consecutiveFailures: this.metrics.consecutiveFailures,
        additionalInfo: metadata,
      },
      affectedComponents: this.getAffectedComponents(scope),
      notificationsSent: false,
    };

    // Update status
    this.status = {
      isShutdown: true,
      scope,
      reason,
      timestamp: new Date(),
      triggeredBy,
      affectedComponents: event.affectedComponents,
      recoveryStatus: {
        inProgress: false,
        attempts: 0,
        lastAttempt: null,
        nextAttempt: this.config.recoveryConfig.autoRecoveryEnabled
          ? new Date(Date.now() + this.config.recoveryConfig.recoveryDelayMs)
          : null,
      },
    };

    // Execute shutdown procedures
    await this.executeShutdownProcedures(scope);

    // Send notifications
    await this.sendNotifications(event);
    event.notificationsSent = true;

    // Log to audit trail
    await this.auditTrail.logEvent({
      eventType: "emergency_shutdown",
      requestId: eventId,
      provider: "bedrock",
      complianceStatus: "compliant",
      metadata: {
        scope,
        reason,
        triggeredBy,
        affectedComponents: event.affectedComponents,
      },
    });

    // Add to history
    this.shutdownHistory.push(event);

    // Start recovery process if enabled
    if (this.config.recoveryConfig.autoRecoveryEnabled) {
      this.startRecoveryProcess();
    }

    return event;
  }

  /**
   * Execute shutdown procedures for specified scope
   */
  private async executeShutdownProcedures(
    scope: EmergencyShutdownScope
  ): Promise<void> {
    switch (scope) {
      case "all":
        await this.shutdownAll();
        break;
      case "direct_bedrock":
        await this.shutdownDirectBedrock();
        break;
      case "mcp":
        await this.shutdownMCP();
        break;
      case "intelligent_router":
        await this.shutdownIntelligentRouter();
        break;
      case "support_mode":
        await this.shutdownSupportMode();
        break;
    }
  }

  /**
   * Shutdown all hybrid routing components
   */
  private async shutdownAll(): Promise<void> {
    // Disable all feature flags
    await this.disableFeatureFlag("ENABLE_BEDROCK_SUPPORT_MODE");
    await this.disableFeatureFlag("ENABLE_INTELLIGENT_ROUTING");
    await this.disableFeatureFlag("ENABLE_DIRECT_BEDROCK_FALLBACK");

    // Open circuit breakers
    this.circuitBreaker.forceOpen("bedrock");
    this.circuitBreaker.forceOpen("mcp");
  }

  /**
   * Shutdown direct Bedrock path only
   */
  private async shutdownDirectBedrock(): Promise<void> {
    await this.disableFeatureFlag("ENABLE_DIRECT_BEDROCK_FALLBACK");
    this.circuitBreaker.forceOpen("bedrock");
  }

  /**
   * Shutdown MCP path only
   */
  private async shutdownMCP(): Promise<void> {
    this.circuitBreaker.forceOpen("mcp");
  }

  /**
   * Shutdown intelligent routing (fallback to MCP only)
   */
  private async shutdownIntelligentRouter(): Promise<void> {
    await this.disableFeatureFlag("ENABLE_INTELLIGENT_ROUTING");
  }

  /**
   * Shutdown entire support mode
   */
  private async shutdownSupportMode(): Promise<void> {
    await this.disableFeatureFlag("ENABLE_BEDROCK_SUPPORT_MODE");
    this.circuitBreaker.forceOpen("bedrock");
  }

  /**
   * Disable feature flag
   */
  private async disableFeatureFlag(flag: string): Promise<void> {
    // In production, this would update the feature flag service
    // For now, we just log the action
    await this.auditTrail.logEvent({
      eventType: "feature_flag_disabled",
      requestId: this.generateEventId(),
      provider: "bedrock",
      complianceStatus: "compliant",
      metadata: {
        flag,
        reason: "emergency_shutdown",
      },
    });
  }

  /**
   * Send notifications about emergency shutdown
   */
  private async sendNotifications(
    event: EmergencyShutdownEvent
  ): Promise<void> {
    const message = this.formatNotificationMessage(event);

    // Send to configured channels
    if (this.config.notificationChannels.slack) {
      await this.sendSlackNotification(
        this.config.notificationChannels.slack,
        message
      );
    }

    if (this.config.notificationChannels.email) {
      await this.sendEmailNotification(
        this.config.notificationChannels.email,
        message
      );
    }

    if (this.config.notificationChannels.pagerduty) {
      await this.sendPagerDutyNotification(
        this.config.notificationChannels.pagerduty,
        message
      );
    }
  }

  /**
   * Format notification message
   */
  private formatNotificationMessage(event: EmergencyShutdownEvent): string {
    return `
🚨 EMERGENCY SHUTDOWN TRIGGERED 🚨

Event ID: ${event.eventId}
Scope: ${event.scope}
Reason: ${event.reason}
Triggered By: ${event.triggeredBy}
Timestamp: ${event.timestamp.toISOString()}

Affected Components:
${event.affectedComponents.map((c) => `- ${c}`).join("\n")}

Metrics:
- Error Rate: ${(event.metadata.errorRate || 0) * 100}%
- Latency: ${event.metadata.latencyMs || 0}ms
- Cost: €${event.metadata.costEuro || 0}/hour
- Consecutive Failures: ${event.metadata.consecutiveFailures || 0}

Recovery Status:
${
  this.config.recoveryConfig.autoRecoveryEnabled
    ? `Auto-recovery enabled. Next attempt: ${
        this.status.recoveryStatus.nextAttempt?.toISOString() || "N/A"
      }`
    : "Auto-recovery disabled. Manual intervention required."
}

Action Required:
${this.getActionRequiredMessage(event)}
    `.trim();
  }

  /**
   * Get action required message based on event
   */
  private getActionRequiredMessage(event: EmergencyShutdownEvent): string {
    switch (event.reason) {
      case "security_incident":
        return "Immediate security review required. Do not restart until incident is resolved.";
      case "compliance_violation":
        return "Compliance review required. Verify GDPR and data residency requirements.";
      case "system_failure":
        return "System diagnostics required. Check logs and health status.";
      case "performance_degradation":
        return "Performance analysis required. Review metrics and optimize if needed.";
      case "cost_overrun":
        return "Cost analysis required. Review usage patterns and adjust budgets.";
      case "manual_intervention":
        return "Manual shutdown triggered. Review reason and restart when ready.";
      case "circuit_breaker_triggered":
        return "Circuit breaker triggered. System will attempt auto-recovery.";
      case "health_check_failure":
        return "Health check failed. Verify system components and dependencies.";
      default:
        return "Review system status and restart when safe.";
    }
  }

  /**
   * Send Slack notification
   */
  private async sendSlackNotification(
    webhookUrl: string,
    message: string
  ): Promise<void> {
    // In production, this would send to Slack
    console.log(`[Slack Notification] ${message}`);
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(
    emails: string[],
    message: string
  ): Promise<void> {
    // In production, this would send emails
    console.log(`[Email Notification to ${emails.join(", ")}] ${message}`);
  }

  /**
   * Send PagerDuty notification
   */
  private async sendPagerDutyNotification(
    integrationKey: string,
    message: string
  ): Promise<void> {
    // In production, this would send to PagerDuty
    console.log(`[PagerDuty Notification] ${message}`);
  }

  /**
   * Start recovery process
   */
  private startRecoveryProcess(): void {
    if (this.recoveryInterval) {
      clearInterval(this.recoveryInterval);
    }

    // Schedule first recovery attempt
    setTimeout(() => {
      this.attemptRecovery();

      // Start periodic health checks
      this.recoveryInterval = setInterval(() => {
        if (this.status.recoveryStatus.inProgress) {
          this.performRecoveryHealthCheck();
        }
      }, this.config.recoveryConfig.healthCheckIntervalMs);
    }, this.config.recoveryConfig.recoveryDelayMs);
  }

  /**
   * Attempt recovery from shutdown
   */
  private async attemptRecovery(): Promise<void> {
    if (
      this.status.recoveryStatus.attempts >=
      this.config.recoveryConfig.maxRecoveryAttempts
    ) {
      console.log(
        "Max recovery attempts reached. Manual intervention required."
      );
      return;
    }

    this.status.recoveryStatus.inProgress = true;
    this.status.recoveryStatus.attempts++;
    this.status.recoveryStatus.lastAttempt = new Date();

    // Perform health checks
    const isHealthy = await this.performRecoveryHealthCheck();

    if (isHealthy) {
      await this.executeRecovery();
    } else {
      // Schedule next attempt
      this.status.recoveryStatus.nextAttempt = new Date(
        Date.now() + this.config.recoveryConfig.recoveryDelayMs
      );
      setTimeout(
        () => this.attemptRecovery(),
        this.config.recoveryConfig.recoveryDelayMs
      );
    }
  }

  /**
   * Perform health check during recovery
   */
  private async performRecoveryHealthCheck(): Promise<boolean> {
    // Check if conditions that triggered shutdown have been resolved
    const metricsHealthy =
      this.metrics.errorRate < this.config.shutdownThresholds.errorRate &&
      this.metrics.latencyMs < this.config.shutdownThresholds.latencyMs &&
      this.metrics.costEuroPerHour <
        this.config.shutdownThresholds.costEuroPerHour &&
      this.metrics.consecutiveFailures <
        this.config.shutdownThresholds.consecutiveFailures;

    return metricsHealthy;
  }

  /**
   * Execute recovery procedures
   */
  private async executeRecovery(): Promise<void> {
    // Re-enable feature flags based on shutdown scope
    if (this.status.scope) {
      await this.enableComponentsForScope(this.status.scope);
    }

    // Reset circuit breakers
    this.circuitBreaker.reset("bedrock");
    this.circuitBreaker.reset("mcp");

    // Update status
    this.status.isShutdown = false;
    this.status.recoveryStatus.inProgress = false;

    // Log recovery
    await this.auditTrail.logEvent({
      eventType: "emergency_recovery",
      requestId: this.generateEventId(),
      provider: "bedrock",
      complianceStatus: "compliant",
      metadata: {
        scope: this.status.scope,
        attempts: this.status.recoveryStatus.attempts,
      },
    });

    // Clear recovery interval
    if (this.recoveryInterval) {
      clearInterval(this.recoveryInterval);
      this.recoveryInterval = undefined;
    }
  }

  /**
   * Enable components for recovery scope
   */
  private async enableComponentsForScope(
    scope: EmergencyShutdownScope
  ): Promise<void> {
    switch (scope) {
      case "all":
      case "support_mode":
        await this.enableFeatureFlag("ENABLE_BEDROCK_SUPPORT_MODE");
        await this.enableFeatureFlag("ENABLE_INTELLIGENT_ROUTING");
        await this.enableFeatureFlag("ENABLE_DIRECT_BEDROCK_FALLBACK");
        break;
      case "direct_bedrock":
        await this.enableFeatureFlag("ENABLE_DIRECT_BEDROCK_FALLBACK");
        break;
      case "intelligent_router":
        await this.enableFeatureFlag("ENABLE_INTELLIGENT_ROUTING");
        break;
      case "mcp":
        // MCP recovery handled by circuit breaker reset
        break;
    }
  }

  /**
   * Enable feature flag
   */
  private async enableFeatureFlag(flag: string): Promise<void> {
    await this.auditTrail.logEvent({
      eventType: "feature_flag_enabled",
      requestId: this.generateEventId(),
      provider: "bedrock",
      complianceStatus: "compliant",
      metadata: {
        flag,
        reason: "emergency_recovery",
      },
    });
  }

  /**
   * Update metrics for automatic shutdown monitoring
   */
  updateMetrics(metrics: Partial<typeof this.metrics>): void {
    this.metrics = { ...this.metrics, ...metrics };

    // Check if automatic shutdown should be triggered
    if (this.config.enableAutoShutdown && !this.status.isShutdown) {
      this.checkAutomaticShutdownConditions();
    }
  }

  /**
   * Check if automatic shutdown conditions are met
   */
  private checkAutomaticShutdownConditions(): void {
    const thresholds = this.config.shutdownThresholds;

    if (this.metrics.errorRate >= thresholds.errorRate) {
      this.triggerShutdown("all", "performance_degradation", "automatic", {
        trigger: "error_rate_threshold",
        value: this.metrics.errorRate,
        threshold: thresholds.errorRate,
      });
    } else if (this.metrics.latencyMs >= thresholds.latencyMs) {
      this.triggerShutdown("all", "performance_degradation", "automatic", {
        trigger: "latency_threshold",
        value: this.metrics.latencyMs,
        threshold: thresholds.latencyMs,
      });
    } else if (this.metrics.costEuroPerHour >= thresholds.costEuroPerHour) {
      this.triggerShutdown("all", "cost_overrun", "automatic", {
        trigger: "cost_threshold",
        value: this.metrics.costEuroPerHour,
        threshold: thresholds.costEuroPerHour,
      });
    } else if (
      this.metrics.consecutiveFailures >= thresholds.consecutiveFailures
    ) {
      this.triggerShutdown("all", "system_failure", "automatic", {
        trigger: "consecutive_failures",
        value: this.metrics.consecutiveFailures,
        threshold: thresholds.consecutiveFailures,
      });
    }
  }

  /**
   * Get current shutdown status
   */
  getStatus(): EmergencyShutdownStatus {
    return { ...this.status };
  }

  /**
   * Get shutdown history
   */
  getHistory(): EmergencyShutdownEvent[] {
    return [...this.shutdownHistory];
  }

  /**
   * Get affected components for scope
   */
  private getAffectedComponents(scope: EmergencyShutdownScope): string[] {
    const components: Record<EmergencyShutdownScope, string[]> = {
      all: [
        "Direct Bedrock Client",
        "MCP Router",
        "Intelligent Router",
        "Support Mode",
      ],
      direct_bedrock: ["Direct Bedrock Client"],
      mcp: ["MCP Router"],
      intelligent_router: ["Intelligent Router"],
      support_mode: [
        "Direct Bedrock Client",
        "MCP Router",
        "Intelligent Router",
        "Support Mode",
      ],
    };

    return components[scope] || [];
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `emergency-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 11)}`;
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.recoveryInterval) {
      clearInterval(this.recoveryInterval);
      this.recoveryInterval = undefined;
    }
  }
}
