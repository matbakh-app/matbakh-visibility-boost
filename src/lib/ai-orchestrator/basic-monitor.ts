/**
 * Basic Monitor for AI Orchestrator
 *
 * Implements basic monitoring capabilities:
 * - Request tracking
 * - Performance metrics
 * - Health checks
 * - Simple alerting
 */

import { BasicLogger, LogContext } from "./basic-logger";
import { AiRequest, AiResponse, Provider } from "./types";

export interface MonitoringMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageLatency: number;
  totalCost: number;
  requestsPerMinute: number;
  errorRate: number;
  lastRequestTime: Date | null;
  uptime: number;
}

export interface ProviderHealth {
  provider: Provider;
  isHealthy: boolean;
  lastSuccessTime: Date | null;
  lastFailureTime: Date | null;
  consecutiveFailures: number;
  averageLatency: number;
  requestCount: number;
  errorRate: number;
}

export interface HealthStatus {
  overall: "healthy" | "degraded" | "unhealthy";
  timestamp: Date;
  metrics: MonitoringMetrics;
  providers: ProviderHealth[];
  alerts: Alert[];
}

export interface Alert {
  id: string;
  type: "performance" | "error" | "availability";
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  timestamp: Date;
  resolved: boolean;
  context?: LogContext;
}

/**
 * Basic Monitor implementation
 */
export class BasicMonitor {
  private logger: BasicLogger;
  private metrics: MonitoringMetrics;
  private providerHealth: Map<Provider, ProviderHealth>;
  private alerts: Alert[];
  private startTime: Date;
  private requestTimes: number[];
  private maxRequestHistory: number = 1000;

  constructor(logger?: BasicLogger) {
    this.logger = logger || new BasicLogger("ai-monitor");
    this.startTime = new Date();
    this.alerts = [];
    this.requestTimes = [];

    this.initializeMetrics();
    this.initializeProviderHealth();

    // Start periodic health checks
    this.startHealthChecks();
  }

  /**
   * Record request start
   */
  recordRequestStart(request: AiRequest): string {
    const requestId = `req-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    this.logger.logRequestStart(requestId, {
      provider: request.provider,
      modelId: request.modelId,
      userId: request.context?.userId,
    });

    return requestId;
  }

  /**
   * Record request completion
   */
  recordRequestComplete(
    requestId: string,
    request: AiRequest,
    response: AiResponse,
    startTime: number
  ): void {
    const duration = Date.now() - startTime;
    const success = response.success;

    // Update global metrics
    this.updateGlobalMetrics(duration, success, response.costEuro || 0);

    // Update provider health
    this.updateProviderHealth(response.provider, success, duration);

    // Log completion
    this.logger.logRequestComplete(requestId, {
      provider: response.provider,
      modelId: response.modelId,
      duration,
      cost: response.costEuro,
      success,
    });

    // Log performance metrics
    this.logger.logPerformanceMetrics(requestId, {
      duration,
      provider: response.provider,
      modelId: response.modelId || "unknown",
      cost: response.costEuro,
      tokensUsed: response.tokensUsed,
    });

    // Check for alerts
    this.checkAlerts();
  }

  /**
   * Record request error
   */
  recordRequestError(
    requestId: string,
    request: AiRequest,
    error: Error,
    startTime: number
  ): void {
    const duration = Date.now() - startTime;

    // Update global metrics
    this.updateGlobalMetrics(duration, false, 0);

    // Update provider health
    this.updateProviderHealth(request.provider, false, duration);

    // Log error
    this.logger.logRequestError(requestId, error, {
      provider: request.provider,
      modelId: request.modelId,
      duration,
    });

    // Check for alerts
    this.checkAlerts();
  }

  /**
   * Get current health status
   */
  getHealthStatus(): HealthStatus {
    const overallHealth = this.calculateOverallHealth();

    return {
      overall: overallHealth,
      timestamp: new Date(),
      metrics: { ...this.metrics },
      providers: Array.from(this.providerHealth.values()),
      alerts: this.getActiveAlerts(),
    };
  }

  /**
   * Get monitoring metrics
   */
  getMetrics(): MonitoringMetrics {
    return { ...this.metrics };
  }

  /**
   * Get provider health
   */
  getProviderHealth(provider?: Provider): ProviderHealth[] {
    if (provider) {
      const health = this.providerHealth.get(provider);
      return health ? [health] : [];
    }

    return Array.from(this.providerHealth.values());
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): Alert[] {
    return this.alerts.filter((alert) => !alert.resolved);
  }

  /**
   * Resolve alert
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      this.logger.info("Alert resolved", { alertId, alertType: alert.type });
      return true;
    }
    return false;
  }

  /**
   * Check if system is healthy
   */
  isHealthy(): boolean {
    return this.calculateOverallHealth() === "healthy";
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.initializeMetrics();
    this.initializeProviderHealth();
    this.alerts = [];
    this.requestTimes = [];
    this.startTime = new Date();
  }

  /**
   * Initialize metrics
   */
  private initializeMetrics(): void {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageLatency: 0,
      totalCost: 0,
      requestsPerMinute: 0,
      errorRate: 0,
      lastRequestTime: null,
      uptime: 0,
    };
  }

  /**
   * Initialize provider health
   */
  private initializeProviderHealth(): void {
    this.providerHealth = new Map();

    const providers: Provider[] = ["bedrock", "google", "meta"];

    for (const provider of providers) {
      this.providerHealth.set(provider, {
        provider,
        isHealthy: true,
        lastSuccessTime: null,
        lastFailureTime: null,
        consecutiveFailures: 0,
        averageLatency: 0,
        requestCount: 0,
        errorRate: 0,
      });
    }
  }

  /**
   * Update global metrics
   */
  private updateGlobalMetrics(
    duration: number,
    success: boolean,
    cost: number
  ): void {
    this.metrics.totalRequests++;
    this.metrics.totalCost += cost;
    this.metrics.lastRequestTime = new Date();

    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
    }

    // Update request times for latency calculation
    this.requestTimes.push(duration);
    if (this.requestTimes.length > this.maxRequestHistory) {
      this.requestTimes = this.requestTimes.slice(-this.maxRequestHistory);
    }

    // Calculate average latency
    this.metrics.averageLatency =
      this.requestTimes.reduce((sum, time) => sum + time, 0) /
      this.requestTimes.length;

    // Calculate error rate
    this.metrics.errorRate =
      this.metrics.failedRequests / this.metrics.totalRequests;

    // Calculate requests per minute
    const uptimeMinutes = (Date.now() - this.startTime.getTime()) / (1000 * 60);
    this.metrics.requestsPerMinute =
      this.metrics.totalRequests / Math.max(uptimeMinutes, 1);

    // Update uptime
    this.metrics.uptime = Date.now() - this.startTime.getTime();
  }

  /**
   * Update provider health
   */
  private updateProviderHealth(
    provider: Provider,
    success: boolean,
    duration: number
  ): void {
    const health = this.providerHealth.get(provider);
    if (!health) return;

    health.requestCount++;

    if (success) {
      health.lastSuccessTime = new Date();
      health.consecutiveFailures = 0;
    } else {
      health.lastFailureTime = new Date();
      health.consecutiveFailures++;
    }

    // Update average latency
    health.averageLatency =
      (health.averageLatency * (health.requestCount - 1) + duration) /
      health.requestCount;

    // Update error rate
    const previousFailedRequests = Math.round(
      health.errorRate * (health.requestCount - 1)
    );
    const currentFailedRequests = previousFailedRequests + (success ? 0 : 1);
    health.errorRate = currentFailedRequests / health.requestCount;

    // Update health status
    // Provider is healthy if consecutive failures < 3 AND (error rate < 10% OR total requests < 5)
    health.isHealthy =
      health.consecutiveFailures < 3 &&
      (health.errorRate < 0.1 || health.requestCount < 5);
  }

  /**
   * Check for alerts
   */
  private checkAlerts(): void {
    // Check error rate alert
    if (this.metrics.errorRate > 0.05) {
      // 5% error rate
      this.createAlert(
        "error",
        "high",
        `High error rate: ${(this.metrics.errorRate * 100).toFixed(2)}%`
      );
    }

    // Check latency alert
    if (this.metrics.averageLatency > 2000) {
      // 2 seconds
      this.createAlert(
        "performance",
        "medium",
        `High average latency: ${this.metrics.averageLatency.toFixed(0)}ms`
      );
    }

    // Check provider health alerts
    for (const [provider, health] of this.providerHealth) {
      if (!health.isHealthy) {
        this.createAlert(
          "availability",
          "high",
          `Provider ${provider} is unhealthy`,
          {
            provider,
            consecutiveFailures: health.consecutiveFailures,
            errorRate: health.errorRate,
          }
        );
      }
    }
  }

  /**
   * Create alert
   */
  private createAlert(
    type: Alert["type"],
    severity: Alert["severity"],
    message: string,
    context?: LogContext
  ): void {
    const alertId = `alert-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Check if similar alert already exists
    const existingAlert = this.alerts.find(
      (alert) =>
        !alert.resolved && alert.type === type && alert.message === message
    );

    if (existingAlert) {
      return; // Don't create duplicate alerts
    }

    const alert: Alert = {
      id: alertId,
      type,
      severity,
      message,
      timestamp: new Date(),
      resolved: false,
      context,
    };

    this.alerts.push(alert);

    this.logger.warn(`Alert created: ${message}`, {
      alertId,
      alertType: type,
      severity,
      ...context,
    });
  }

  /**
   * Calculate overall health
   */
  private calculateOverallHealth(): "healthy" | "degraded" | "unhealthy" {
    const activeAlerts = this.getActiveAlerts();
    const criticalAlerts = activeAlerts.filter(
      (a) => a.severity === "critical"
    );
    const highAlerts = activeAlerts.filter((a) => a.severity === "high");

    if (criticalAlerts.length > 0) {
      return "unhealthy";
    }

    if (highAlerts.length > 0 || this.metrics.errorRate > 0.1) {
      return "degraded";
    }

    return "healthy";
  }

  /**
   * Start periodic health checks
   */
  private startHealthChecks(): void {
    // Run health checks every 30 seconds
    setInterval(() => {
      this.performHealthCheck();
    }, 30000);
  }

  /**
   * Perform health check
   */
  private performHealthCheck(): void {
    const status = this.getHealthStatus();

    this.logger.debug("Health check completed", {
      overall: status.overall,
      totalRequests: status.metrics.totalRequests,
      errorRate: status.metrics.errorRate,
      averageLatency: status.metrics.averageLatency,
      activeAlerts: status.alerts.length,
    });

    // Log health status if not healthy
    if (status.overall !== "healthy") {
      this.logger.warn(`System health: ${status.overall}`, {
        activeAlerts: status.alerts.length,
        errorRate: status.metrics.errorRate,
        averageLatency: status.metrics.averageLatency,
      });
    }
  }
}

/**
 * Default monitor instance
 */
export const monitor = new BasicMonitor();

/**
 * Create monitor with custom logger
 */
export const createMonitor = (logger?: BasicLogger): BasicMonitor => {
  return new BasicMonitor(logger);
};
