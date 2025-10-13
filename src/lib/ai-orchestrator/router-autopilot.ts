/**
 * Router Autopilot System
 *
 * Automatically adjusts routing when P95 latency drifts outside SLO:
 * - Reduces routing weight for slow providers
 * - Falls back to faster models
 * - Implements context shortening and tool deactivation
 * - Stale-while-revalidate for cache misses
 */

import { streamingPercentileEstimator } from "./streaming-percentile-estimator";

export interface ProviderWeight {
  provider: string;
  weight: number; // 0.0 to 1.0
  lastAdjustment: number;
  reason?: string;
}

export interface AutopilotAction {
  id: string;
  timestamp: number;
  trigger: "p95_drift" | "burn_rate_alert" | "circuit_breaker";
  action:
    | "reduce_weight"
    | "fallback_model"
    | "shorten_context"
    | "disable_tools"
    | "enable_stale_cache";
  provider: string;
  route: string;
  details: {
    oldValue?: any;
    newValue?: any;
    p95Latency?: number;
    threshold?: number;
    burnRate?: number;
  };
}

export interface AutopilotConfig {
  p95DriftThreshold: number; // Seconds outside SLO before action
  weightReductionFactor: number; // How much to reduce weight (0.5 = 50%)
  minWeight: number; // Minimum weight before complete disable
  recoveryDelayMs: number; // How long to wait before recovery
  contextShorteningRatio: number; // Reduce context by this ratio
  staleWhileRevalidateTTL: number; // TTL for stale cache responses
}

/**
 * Router Autopilot for automatic P95 drift mitigation
 */
export class RouterAutopilot {
  private providerWeights = new Map<string, ProviderWeight>();
  private actions: AutopilotAction[] = [];
  private readonly config: AutopilotConfig;
  private monitoringTimer?: NodeJS.Timeout;

  constructor(config?: Partial<AutopilotConfig>) {
    this.config = {
      p95DriftThreshold: 3 * 60, // 3 minutes
      weightReductionFactor: 0.5,
      minWeight: 0.1,
      recoveryDelayMs: 15 * 60 * 1000, // 15 minutes
      contextShorteningRatio: 0.7,
      staleWhileRevalidateTTL: 5 * 60 * 1000, // 5 minutes
      ...config,
    };

    this.initializeProviderWeights();
    this.startMonitoring();
  }

  /**
   * Get current provider weights for routing
   */
  getProviderWeights(): Map<string, number> {
    const weights = new Map<string, number>();
    for (const [provider, config] of this.providerWeights) {
      weights.set(provider, config.weight);
    }
    return weights;
  }

  /**
   * Get provider weight for specific provider and route
   */
  getProviderWeight(provider: string, route: string): number {
    const key = `${provider}:${route}`;
    const config = this.providerWeights.get(key);
    return config?.weight || 1.0;
  }

  /**
   * Check for P95 drift and take corrective actions
   */
  checkP95Drift(): void {
    const routes = ["generation", "rag", "cached"];
    const providers = ["bedrock", "google", "meta"];

    for (const route of routes) {
      for (const provider of providers) {
        this.checkProviderP95(provider, route);
      }
    }
  }

  /**
   * Check P95 for specific provider and route
   */
  private checkProviderP95(provider: string, route: string): void {
    const bucket = { route, provider, intent: "all" };
    const percentiles = streamingPercentileEstimator.getPercentiles(bucket);

    if (percentiles.count < 10) {
      return; // Not enough data
    }

    const threshold = this.getP95Threshold(route);
    const isViolating = percentiles.p95 > threshold;
    const key = `${provider}:${route}`;

    if (isViolating) {
      this.handleP95Violation(provider, route, percentiles.p95, threshold);
    } else {
      this.handleP95Recovery(provider, route, percentiles.p95, threshold);
    }
  }

  /**
   * Handle P95 SLO violation
   */
  private handleP95Violation(
    provider: string,
    route: string,
    p95Latency: number,
    threshold: number
  ): void {
    const key = `${provider}:${route}`;
    const config = this.providerWeights.get(key);

    if (!config) {
      this.initializeProviderWeight(provider, route);
      return;
    }

    const timeSinceLastAdjustment = Date.now() - config.lastAdjustment;
    if (timeSinceLastAdjustment < this.config.p95DriftThreshold * 1000) {
      return; // Too soon since last adjustment
    }

    // Reduce provider weight
    const oldWeight = config.weight;
    const newWeight = Math.max(
      config.weight * this.config.weightReductionFactor,
      this.config.minWeight
    );

    config.weight = newWeight;
    config.lastAdjustment = Date.now();
    config.reason = `P95 ${p95Latency.toFixed(0)}ms > ${threshold}ms`;

    this.recordAction({
      trigger: "p95_drift",
      action: "reduce_weight",
      provider,
      route,
      details: {
        oldValue: oldWeight,
        newValue: newWeight,
        p95Latency,
        threshold,
      },
    });

    // If weight is at minimum, try additional mitigations
    if (newWeight <= this.config.minWeight) {
      this.applyAdditionalMitigations(provider, route, p95Latency, threshold);
    }

    console.warn(
      `🔧 Autopilot: Reduced ${provider} weight for ${route} from ${oldWeight.toFixed(
        2
      )} to ${newWeight.toFixed(2)} (P95: ${p95Latency}ms > ${threshold}ms)`
    );
  }

  /**
   * Handle P95 recovery (back within SLO)
   */
  private handleP95Recovery(
    provider: string,
    route: string,
    p95Latency: number,
    threshold: number
  ): void {
    const key = `${provider}:${route}`;
    const config = this.providerWeights.get(key);

    if (!config || config.weight >= 1.0) {
      return; // Already at full weight
    }

    const timeSinceLastAdjustment = Date.now() - config.lastAdjustment;
    if (timeSinceLastAdjustment < this.config.recoveryDelayMs) {
      return; // Wait for recovery delay
    }

    // Gradually increase weight
    const oldWeight = config.weight;
    const newWeight = Math.min(config.weight * 1.2, 1.0); // 20% increase

    config.weight = newWeight;
    config.lastAdjustment = Date.now();
    config.reason = `P95 recovered: ${p95Latency.toFixed(
      0
    )}ms < ${threshold}ms`;

    this.recordAction({
      trigger: "p95_drift",
      action: "reduce_weight", // Recovery is still weight adjustment
      provider,
      route,
      details: {
        oldValue: oldWeight,
        newValue: newWeight,
        p95Latency,
        threshold,
      },
    });

    console.info(
      `✅ Autopilot: Increased ${provider} weight for ${route} from ${oldWeight.toFixed(
        2
      )} to ${newWeight.toFixed(2)} (P95 recovered: ${p95Latency}ms)`
    );
  }

  /**
   * Apply additional mitigations when weight reduction isn't enough
   */
  private applyAdditionalMitigations(
    provider: string,
    route: string,
    p95Latency: number,
    threshold: number
  ): void {
    // 1. Enable context shortening
    this.recordAction({
      trigger: "p95_drift",
      action: "shorten_context",
      provider,
      route,
      details: {
        oldValue: 1.0,
        newValue: this.config.contextShorteningRatio,
        p95Latency,
        threshold,
      },
    });

    // 2. Disable non-essential tools
    this.recordAction({
      trigger: "p95_drift",
      action: "disable_tools",
      provider,
      route,
      details: {
        p95Latency,
        threshold,
      },
    });

    // 3. Enable stale-while-revalidate for cache misses
    if (route === "rag" || route === "cached") {
      this.recordAction({
        trigger: "p95_drift",
        action: "enable_stale_cache",
        provider,
        route,
        details: {
          oldValue: 0,
          newValue: this.config.staleWhileRevalidateTTL,
          p95Latency,
          threshold,
        },
      });
    }

    console.warn(
      `🚨 Autopilot: Applied additional mitigations for ${provider}:${route} (P95: ${p95Latency}ms)`
    );
  }

  /**
   * Get context shortening ratio for provider/route
   */
  getContextShorteningRatio(provider: string, route: string): number {
    const recentActions = this.actions.filter(
      (a) =>
        a.provider === provider &&
        a.route === route &&
        a.action === "shorten_context" &&
        Date.now() - a.timestamp < this.config.recoveryDelayMs
    );

    if (recentActions.length > 0) {
      const latestAction = recentActions[recentActions.length - 1];
      return (
        latestAction.details.newValue || this.config.contextShorteningRatio
      );
    }

    return 1.0; // No shortening
  }

  /**
   * Check if tools should be disabled for provider/route
   */
  shouldDisableTools(provider: string, route: string): boolean {
    const recentActions = this.actions.filter(
      (a) =>
        a.provider === provider &&
        a.route === route &&
        a.action === "disable_tools" &&
        Date.now() - a.timestamp < this.config.recoveryDelayMs
    );

    return recentActions.length > 0;
  }

  /**
   * Get stale-while-revalidate TTL for provider/route
   */
  getStaleWhileRevalidateTTL(provider: string, route: string): number {
    const recentActions = this.actions.filter(
      (a) =>
        a.provider === provider &&
        a.route === route &&
        a.action === "enable_stale_cache" &&
        Date.now() - a.timestamp < this.config.recoveryDelayMs
    );

    if (recentActions.length > 0) {
      const latestAction = recentActions[recentActions.length - 1];
      return (
        latestAction.details.newValue || this.config.staleWhileRevalidateTTL
      );
    }

    return 0; // No stale cache
  }

  /**
   * Get autopilot status summary
   */
  getAutopilotStatus(): {
    activeWeightAdjustments: number;
    activeMitigations: number;
    recentActions: AutopilotAction[];
    providerStatus: Array<{
      provider: string;
      route: string;
      weight: number;
      status: "healthy" | "degraded" | "critical";
      mitigations: string[];
    }>;
  } {
    const recentActions = this.actions.filter(
      (a) => Date.now() - a.timestamp < 60 * 60 * 1000 // Last hour
    );

    const activeWeightAdjustments = Array.from(
      this.providerWeights.values()
    ).filter((w) => w.weight < 1.0).length;

    const activeMitigations = recentActions.filter(
      (a) =>
        a.action !== "reduce_weight" &&
        Date.now() - a.timestamp < this.config.recoveryDelayMs
    ).length;

    const providerStatus = [];
    const routes = ["generation", "rag", "cached"];
    const providers = ["bedrock", "google", "meta"];

    for (const provider of providers) {
      for (const route of routes) {
        const weight = this.getProviderWeight(provider, route);
        const mitigations = [];

        if (this.getContextShorteningRatio(provider, route) < 1.0) {
          mitigations.push("context_shortening");
        }
        if (this.shouldDisableTools(provider, route)) {
          mitigations.push("tools_disabled");
        }
        if (this.getStaleWhileRevalidateTTL(provider, route) > 0) {
          mitigations.push("stale_cache");
        }

        let status: "healthy" | "degraded" | "critical" = "healthy";
        if (weight < 0.5) status = "critical";
        else if (weight < 0.8) status = "degraded";

        providerStatus.push({
          provider,
          route,
          weight,
          status,
          mitigations,
        });
      }
    }

    return {
      activeWeightAdjustments,
      activeMitigations,
      recentActions: recentActions.slice(-10), // Last 10 actions
      providerStatus,
    };
  }

  /**
   * Initialize provider weights
   */
  private initializeProviderWeights(): void {
    const routes = ["generation", "rag", "cached"];
    const providers = ["bedrock", "google", "meta"];

    for (const provider of providers) {
      for (const route of routes) {
        this.initializeProviderWeight(provider, route);
      }
    }
  }

  /**
   * Initialize weight for specific provider/route
   */
  private initializeProviderWeight(provider: string, route: string): void {
    const key = `${provider}:${route}`;
    this.providerWeights.set(key, {
      provider,
      weight: 1.0,
      lastAdjustment: 0,
      reason: "initialized",
    });
  }

  /**
   * Get P95 threshold for route
   */
  private getP95Threshold(route: string): number {
    switch (route) {
      case "generation":
        return 1500; // 1.5s
      case "rag":
        return 300; // 300ms
      case "cached":
        return 300; // 300ms
      default:
        return 1000; // 1s default
    }
  }

  /**
   * Record autopilot action
   */
  private recordAction(
    actionData: Omit<AutopilotAction, "id" | "timestamp">
  ): void {
    const action: AutopilotAction = {
      id: `autopilot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      ...actionData,
    };

    this.actions.push(action);

    // Keep only recent actions
    const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24 hours
    this.actions = this.actions.filter((a) => a.timestamp > cutoff);
  }

  /**
   * Start monitoring for P95 drift
   */
  private startMonitoring(): void {
    this.monitoringTimer = setInterval(() => {
      this.checkP95Drift();
    }, 60 * 1000); // Check every minute
  }

  /**
   * Stop monitoring and cleanup
   */
  destroy(): void {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = undefined;
    }
  }
}

// Singleton instance
export const routerAutopilot = new RouterAutopilot();
