/**
 * MCP Fallback Reliability System
 *
 * Ensures >99% success rate when direct Bedrock is unavailable by implementing
 * advanced retry mechanisms, circuit breaker patterns, and health monitoring.
 *
 * Key Features:
 * - Advanced retry logic with exponential backoff
 * - Circuit breaker protection
 * - Real-time performance monitoring
 * - Health-based recovery mechanisms
 * - Comprehensive metrics and reporting
 */

import { AuditTrailSystem } from "./audit-trail-system";
import { MCPRouter } from "./mcp-router";

export interface MCPFallbackConfig {
  maxRetries: number;
  baseRetryDelay: number;
  maxRetryDelay: number;
  exponentialBackoffMultiplier: number;
  circuitBreakerThreshold: number;
  circuitBreakerTimeout: number;
  healthCheckInterval: number;
  successRateTarget: number;
  performanceThresholds: {
    maxLatency: number;
    maxErrorRate: number;
    minSuccessRate: number;
  };
}

export interface MCPFallbackMetrics {
  totalFallbackAttempts: number;
  successfulFallbacks: number;
  failedFallbacks: number;
  successRate: number;
  averageLatency: number;
  retryCount: number;
  circuitBreakerTrips: number;
  lastHealthCheck: Date;
  performanceGrade: "A" | "B" | "C" | "D" | "F";
  recommendations: string[];
}

export interface MCPFallbackResult {
  success: boolean;
  response?: any;
  error?: Error;
  latency: number;
  retryCount: number;
  routeUsed: "mcp" | "fallback";
  correlationId: string;
}

export interface MCPHealthStatus {
  isHealthy: boolean;
  lastCheck: Date;
  consecutiveFailures: number;
  averageLatency: number;
  successRate: number;
  queueSize: number;
  pendingOperations: number;
}

export interface ReliabilityValidation {
  meetsTarget: boolean;
  currentSuccessRate: number;
  targetSuccessRate: number;
  totalOperations: number;
  recommendations: string[];
  lastValidation: Date;
}

export interface HealthCheckResult {
  healthImproved: boolean;
  previousHealth: MCPHealthStatus;
  currentHealth: MCPHealthStatus;
  actions: string[];
  timestamp: Date;
}

export interface ConfigOptimization {
  optimizations: string[];
  newConfig: Partial<MCPFallbackConfig>;
  expectedImprovement: number;
  riskLevel: "low" | "medium" | "high";
}

export class MCPFallbackReliabilitySystem {
  private mcpRouter: MCPRouter;
  private auditTrail: AuditTrailSystem;
  private config: MCPFallbackConfig;
  private metrics: MCPFallbackMetrics;
  private healthStatus: MCPHealthStatus;
  private circuitBreakerOpen: boolean = false;
  private circuitBreakerOpenTime?: Date;
  private healthCheckTimer?: NodeJS.Timeout;
  private operationHistory: Array<{
    timestamp: Date;
    success: boolean;
    latency: number;
    error?: string;
  }> = [];

  constructor(
    mcpRouter: MCPRouter,
    auditTrail?: AuditTrailSystem,
    config?: Partial<MCPFallbackConfig>
  ) {
    this.mcpRouter = mcpRouter;
    this.auditTrail = auditTrail || new AuditTrailSystem();

    // Default production configuration optimized for >99% success rate
    this.config = {
      maxRetries: 5,
      baseRetryDelay: 1000, // 1 second
      maxRetryDelay: 30000, // 30 seconds
      exponentialBackoffMultiplier: 2,
      circuitBreakerThreshold: 5,
      circuitBreakerTimeout: 60000, // 1 minute
      healthCheckInterval: 30000, // 30 seconds
      successRateTarget: 0.99, // 99%
      performanceThresholds: {
        maxLatency: 15000, // 15 seconds
        maxErrorRate: 0.01, // 1%
        minSuccessRate: 0.99, // 99%
      },
      ...config,
    };

    this.initializeMetrics();
    this.initializeHealthStatus();
    this.startHealthMonitoring();
  }

  private initializeMetrics(): void {
    this.metrics = {
      totalFallbackAttempts: 0,
      successfulFallbacks: 0,
      failedFallbacks: 0,
      successRate: 1.0,
      averageLatency: 0,
      retryCount: 0,
      circuitBreakerTrips: 0,
      lastHealthCheck: new Date(),
      performanceGrade: "A",
      recommendations: [],
    };
  }

  private initializeHealthStatus(): void {
    this.healthStatus = {
      isHealthy: true,
      lastCheck: new Date(),
      consecutiveFailures: 0,
      averageLatency: 0,
      successRate: 1.0,
      queueSize: 0,
      pendingOperations: 0,
    };
  }

  private startHealthMonitoring(): void {
    this.healthCheckTimer = setInterval(
      () => this.performHealthCheck(),
      this.config.healthCheckInterval
    );
  }

  /**
   * Execute MCP fallback operation with reliability guarantees
   */
  async executeFallbackOperation(
    request: any,
    correlationId: string,
    reason: string = "Direct Bedrock unavailable"
  ): Promise<MCPFallbackResult> {
    const startTime = Date.now();
    let retryCount = 0;
    let lastError: Error | undefined;

    // Log fallback initiation
    await this.auditTrail.logEvent({
      eventType: "mcp_fallback_initiation",
      correlationId,
      metadata: {
        reason,
        config: this.config,
        healthStatus: this.healthStatus,
      },
    });

    // Check circuit breaker
    if (this.isCircuitBreakerOpen()) {
      const error = new Error("MCP fallback circuit breaker is open");
      await this.recordFailure(startTime, error, correlationId);
      return {
        success: false,
        error,
        latency: Math.max(Date.now() - startTime, 1), // Ensure minimum 1ms latency
        retryCount: 0,
        routeUsed: "fallback",
        correlationId,
      };
    }

    // Execute with retry logic
    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        // Add jitter to prevent thundering herd
        if (attempt > 0) {
          const delay = this.calculateRetryDelay(attempt);
          await this.sleep(delay);
          retryCount++;
        }

        // Check health before retry
        if (attempt > 0 && !this.healthStatus.isHealthy) {
          await this.performHealthCheck();
        }

        // Execute MCP operation
        const response = await this.mcpRouter.routeRequest(request, {
          timeout: this.config.performanceThresholds.maxLatency,
          priority: "high",
          correlationId,
        });

        // Success - record and return
        const latency = Math.max(Date.now() - startTime, 1); // Ensure minimum 1ms latency
        await this.recordSuccess(latency, correlationId);

        return {
          success: true,
          response,
          latency,
          retryCount,
          routeUsed: "mcp",
          correlationId,
        };
      } catch (error) {
        lastError = error as Error;

        // Check if we should retry
        if (
          attempt < this.config.maxRetries &&
          this.shouldRetry(error as Error)
        ) {
          continue;
        }

        // Final failure
        break;
      }
    }

    // All retries exhausted - record failure
    const latency = Math.max(Date.now() - startTime, 1); // Ensure minimum 1ms latency
    await this.recordFailure(latency, lastError!, correlationId);

    return {
      success: false,
      error: lastError,
      latency,
      retryCount,
      routeUsed: "fallback",
      correlationId,
    };
  }

  private calculateRetryDelay(attempt: number): number {
    const baseDelay =
      this.config.baseRetryDelay *
      Math.pow(this.config.exponentialBackoffMultiplier, attempt - 1);

    // Add jitter (±25%)
    const jitter = baseDelay * 0.25 * (Math.random() - 0.5);
    const delay = Math.min(baseDelay + jitter, this.config.maxRetryDelay);

    return Math.max(delay, 0);
  }

  private shouldRetry(error: Error): boolean {
    // Don't retry on certain error types
    const nonRetryableErrors = [
      "ValidationError",
      "AuthenticationError",
      "AuthorizationError",
      "InvalidInputError",
    ];

    // Check both constructor name and error name property
    return (
      !nonRetryableErrors.includes(error.constructor.name) &&
      !nonRetryableErrors.includes(error.name)
    );
  }

  private isCircuitBreakerOpen(): boolean {
    if (!this.circuitBreakerOpen) {
      return false;
    }

    // Check if timeout has passed
    if (this.circuitBreakerOpenTime) {
      const timeOpen = Date.now() - this.circuitBreakerOpenTime.getTime();
      if (timeOpen >= this.config.circuitBreakerTimeout) {
        this.circuitBreakerOpen = false;
        this.circuitBreakerOpenTime = undefined;
        return false;
      }
    }

    return true;
  }

  private async recordSuccess(
    latency: number,
    correlationId: string
  ): Promise<void> {
    this.metrics.totalFallbackAttempts++;
    this.metrics.successfulFallbacks++;
    this.updateMetrics(latency, true);

    // Reset circuit breaker on success
    if (this.circuitBreakerOpen) {
      this.circuitBreakerOpen = false;
      this.circuitBreakerOpenTime = undefined;
    }

    // Reset consecutive failures
    this.healthStatus.consecutiveFailures = 0;

    // Record in operation history
    this.operationHistory.push({
      timestamp: new Date(),
      success: true,
      latency,
    });

    // Trim history to last 1000 operations
    if (this.operationHistory.length > 1000) {
      this.operationHistory = this.operationHistory.slice(-1000);
    }

    // Log success
    await this.auditTrail.logEvent({
      eventType: "mcp_fallback_completion",
      correlationId,
      metadata: {
        success: true,
        latency,
        metrics: this.metrics,
      },
    });
  }

  private async recordFailure(
    latency: number,
    error: Error,
    correlationId: string
  ): Promise<void> {
    this.metrics.totalFallbackAttempts++;
    this.metrics.failedFallbacks++;
    this.updateMetrics(latency, false);

    // Update health status
    this.healthStatus.consecutiveFailures++;

    // Check circuit breaker threshold
    if (
      this.healthStatus.consecutiveFailures >=
      this.config.circuitBreakerThreshold
    ) {
      this.circuitBreakerOpen = true;
      this.circuitBreakerOpenTime = new Date();
      this.metrics.circuitBreakerTrips++;
    }

    // Record in operation history
    this.operationHistory.push({
      timestamp: new Date(),
      success: false,
      latency,
      error: error.message,
    });

    // Trim history
    if (this.operationHistory.length > 1000) {
      this.operationHistory = this.operationHistory.slice(-1000);
    }

    // Log failure
    await this.auditTrail.logEvent({
      eventType: "mcp_fallback_completion",
      correlationId,
      metadata: {
        success: false,
        error: error.message,
        latency,
        metrics: this.metrics,
      },
    });

    // Log reliability issue if success rate drops below target
    if (this.metrics.successRate < this.config.successRateTarget) {
      await this.auditTrail.logEvent({
        eventType: "mcp_fallback_reliability_issue",
        correlationId,
        metadata: {
          currentSuccessRate: this.metrics.successRate,
          targetSuccessRate: this.config.successRateTarget,
          consecutiveFailures: this.healthStatus.consecutiveFailures,
          recommendations: this.generateRecommendations(),
        },
      });
    }
  }

  private updateMetrics(latency: number, success: boolean): void {
    // Update success rate
    this.metrics.successRate =
      this.metrics.totalFallbackAttempts > 0
        ? this.metrics.successfulFallbacks / this.metrics.totalFallbackAttempts
        : 1.0;

    // Update average latency
    const totalLatency =
      this.metrics.averageLatency * (this.metrics.totalFallbackAttempts - 1) +
      latency;
    this.metrics.averageLatency =
      totalLatency / this.metrics.totalFallbackAttempts;

    // Update performance grade
    this.metrics.performanceGrade = this.calculatePerformanceGrade();

    // Update recommendations
    this.metrics.recommendations = this.generateRecommendations();
  }

  private calculatePerformanceGrade(): "A" | "B" | "C" | "D" | "F" {
    const successRate = this.metrics.successRate;
    const avgLatency = this.metrics.averageLatency;

    if (successRate >= 0.99 && avgLatency <= 5000) return "A";
    if (successRate >= 0.98 && avgLatency <= 10000) return "B";
    if (successRate >= 0.95 && avgLatency <= 15000) return "C";
    if (successRate >= 0.9 && avgLatency <= 30000) return "D";
    return "F";
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.metrics.successRate < this.config.successRateTarget) {
      recommendations.push(
        "Success rate below target - consider increasing retry count or improving MCP health"
      );
    }

    if (
      this.metrics.averageLatency > this.config.performanceThresholds.maxLatency
    ) {
      recommendations.push(
        "Average latency too high - consider optimizing MCP operations or reducing timeout"
      );
    }

    if (this.metrics.circuitBreakerTrips > 0) {
      recommendations.push(
        "Circuit breaker has tripped - investigate MCP connectivity issues"
      );
    }

    if (this.healthStatus.consecutiveFailures > 2) {
      recommendations.push(
        "Multiple consecutive failures detected - perform health check and recovery"
      );
    }

    if (recommendations.length === 0) {
      recommendations.push("System performing within acceptable parameters");
    }

    return recommendations;
  }

  private async performHealthCheck(): Promise<void> {
    try {
      // Check MCP router health
      const mcpHealth = await this.mcpRouter.getHealthStatus();

      // Update health status
      this.healthStatus = {
        isHealthy: mcpHealth.isHealthy,
        lastCheck: new Date(),
        consecutiveFailures: this.healthStatus.consecutiveFailures,
        averageLatency: this.metrics.averageLatency,
        successRate: this.metrics.successRate,
        queueSize: mcpHealth.queueSize || 0,
        pendingOperations: mcpHealth.pendingOperations || 0,
      };

      this.metrics.lastHealthCheck = new Date();

      // Trigger recovery if needed
      if (
        !this.healthStatus.isHealthy &&
        this.healthStatus.consecutiveFailures > 3
      ) {
        await this.triggerRecovery();
      }
    } catch (error) {
      this.healthStatus.isHealthy = false;
      this.healthStatus.lastCheck = new Date();
    }
  }

  private async triggerRecovery(): Promise<void> {
    try {
      // Attempt to recover MCP connection
      await this.mcpRouter.reconnect?.();

      // Reset some metrics to give system a fresh start
      this.healthStatus.consecutiveFailures = Math.max(
        0,
        this.healthStatus.consecutiveFailures - 2
      );

      // Log recovery attempt
      await this.auditTrail.logEvent({
        eventType: "mcp_fallback_recovery_attempt",
        correlationId: `recovery-${Date.now()}`,
        metadata: {
          healthStatus: this.healthStatus,
          metrics: this.metrics,
        },
      });
    } catch (error) {
      // Recovery failed - log it
      await this.auditTrail.logEvent({
        eventType: "mcp_fallback_recovery_failed",
        correlationId: `recovery-failed-${Date.now()}`,
        metadata: {
          error: (error as Error).message,
          healthStatus: this.healthStatus,
        },
      });
    }
  }

  /**
   * Get current fallback metrics
   */
  getFallbackMetrics(): MCPFallbackMetrics {
    return { ...this.metrics };
  }

  /**
   * Get current health status
   */
  getHealthStatus(): MCPHealthStatus {
    return { ...this.healthStatus };
  }

  /**
   * Validate if system meets reliability targets
   */
  async validateReliabilityTargets(): Promise<ReliabilityValidation> {
    const meetsTarget =
      this.metrics.successRate >= this.config.successRateTarget;

    return {
      meetsTarget,
      currentSuccessRate: this.metrics.successRate,
      targetSuccessRate: this.config.successRateTarget,
      totalOperations: this.metrics.totalFallbackAttempts,
      recommendations: this.generateRecommendations(),
      lastValidation: new Date(),
    };
  }

  /**
   * Force health check and recovery
   */
  async forceHealthCheckAndRecovery(): Promise<HealthCheckResult> {
    const previousHealth = { ...this.healthStatus };

    await this.performHealthCheck();

    if (!this.healthStatus.isHealthy) {
      await this.triggerRecovery();
      await this.performHealthCheck(); // Check again after recovery
    }

    const actions: string[] = [];
    if (!previousHealth.isHealthy && this.healthStatus.isHealthy) {
      actions.push("Health recovered successfully");
    } else if (!this.healthStatus.isHealthy) {
      actions.push("Recovery attempted but health still degraded");
    } else {
      actions.push("System was already healthy");
    }

    return {
      healthImproved: !previousHealth.isHealthy && this.healthStatus.isHealthy,
      previousHealth,
      currentHealth: { ...this.healthStatus },
      actions,
      timestamp: new Date(),
    };
  }

  /**
   * Optimize fallback configuration based on performance data
   */
  async optimizeFallbackConfiguration(): Promise<ConfigOptimization> {
    const optimizations: string[] = [];
    const newConfig: Partial<MCPFallbackConfig> = {};
    let expectedImprovement = 0;
    let riskLevel: "low" | "medium" | "high" = "low";

    // Analyze recent performance
    const recentOps = this.operationHistory.slice(-100);
    const recentSuccessRate =
      recentOps.filter((op) => op.success).length / recentOps.length;
    const recentAvgLatency =
      recentOps.reduce((sum, op) => sum + op.latency, 0) / recentOps.length;

    // Optimize retry configuration
    if (recentSuccessRate < 0.95 && this.config.maxRetries < 8) {
      optimizations.push("Increase max retries to improve success rate");
      newConfig.maxRetries = Math.min(this.config.maxRetries + 2, 8);
      expectedImprovement += 5;
      riskLevel = "medium";
    }

    // Optimize timeout configuration
    if (recentAvgLatency > this.config.performanceThresholds.maxLatency * 0.8) {
      optimizations.push(
        "Increase timeout threshold to reduce timeout failures"
      );
      newConfig.performanceThresholds = {
        ...this.config.performanceThresholds,
        maxLatency: Math.min(
          this.config.performanceThresholds.maxLatency * 1.2,
          30000
        ),
      };
      expectedImprovement += 3;
    }

    // Optimize circuit breaker
    if (this.metrics.circuitBreakerTrips > 2) {
      optimizations.push(
        "Adjust circuit breaker threshold to reduce false positives"
      );
      newConfig.circuitBreakerThreshold = Math.min(
        this.config.circuitBreakerThreshold + 1,
        10
      );
      expectedImprovement += 2;
      riskLevel = "medium";
    }

    if (optimizations.length === 0) {
      optimizations.push(
        "Configuration is already optimized for current conditions"
      );
    }

    return {
      optimizations,
      newConfig,
      expectedImprovement,
      riskLevel,
    };
  }

  /**
   * Get operation history for analysis
   */
  getOperationHistory(limit: number = 100): Array<{
    timestamp: Date;
    success: boolean;
    latency: number;
    error?: string;
  }> {
    return this.operationHistory.slice(-limit);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Safe audit logging that doesn't throw errors
   */
  private async safeAuditLog(event: any): Promise<void> {
    try {
      await this.auditTrail.logEvent(event);
    } catch (error) {
      // Audit failures should not affect main operation
      console.warn("Audit logging failed:", error);
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = undefined;
    }
  }
}
