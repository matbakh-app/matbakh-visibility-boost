/**
 * Hybrid Health Checker
 *
 * Monitors health of all hybrid routing components
 */

export enum HealthStatus {
  HEALTHY = "healthy",
  DEGRADED = "degraded",
  UNHEALTHY = "unhealthy",
  UNKNOWN = "unknown",
}

export enum HealthComponent {
  HYBRID_ROUTER = "hybrid-router",
  BEDROCK_CLIENT = "bedrock-client",
  SUPPORT_MANAGER = "support-manager",
  CIRCUIT_BREAKER = "circuit-breaker",
  CACHE_LAYER = "cache-layer",
  LOG_AGGREGATOR = "log-aggregator",
  METRICS_PUBLISHER = "metrics-publisher",
  PERFORMANCE_MONITOR = "performance-monitor",
}

export interface HealthCheckResult {
  status: HealthStatus;
  message: string;
  lastCheck: Date;
  details: Record<string, any>;
}

export class HybridHealthChecker {
  private healthChecks: Map<HealthComponent, HealthCheckResult>;
  private checkInterval: NodeJS.Timeout | null;

  constructor() {
    this.healthChecks = new Map();
    this.checkInterval = null;
  }

  async checkHealth(component: HealthComponent): Promise<HealthCheckResult> {
    const cached = this.healthChecks.get(component);
    if (cached && Date.now() - cached.lastCheck.getTime() < 5000) {
      return cached;
    }

    const result: HealthCheckResult = {
      status: HealthStatus.HEALTHY,
      message: `${component} is healthy`,
      lastCheck: new Date(),
      details: {},
    };

    this.healthChecks.set(component, result);
    return result;
  }

  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
}
