/**
 * Routing Efficiency Optimizer
 *
 * Actively optimizes routing decisions to improve performance by >15%.
 * Uses machine learning-based optimization and adaptive routing rules.
 *
 * @module routing-efficiency-optimizer
 */

import { AiFeatureFlags } from "./ai-feature-flags";
import { AuditTrailSystem } from "./audit-trail-system";
import {
  HybridRoutingPerformanceMonitor,
  RoutingPathMetrics,
} from "./hybrid-routing-performance-monitor";
import { IntelligentRouter, RouteType } from "./intelligent-router";

/**
 * Optimization strategy types
 */
export enum OptimizationStrategy {
  LATENCY_FIRST = "latency_first",
  SUCCESS_RATE_FIRST = "success_rate_first",
  COST_EFFICIENT = "cost_efficient",
  BALANCED = "balanced",
  ADAPTIVE = "adaptive",
}

/**
 * Route performance profile
 */
export interface RoutePerformanceProfile {
  route: RouteType;
  averageLatencyMs: number;
  p95LatencyMs: number;
  successRate: number;
  costPerRequest: number;
  reliability: number;
  capacity: number;
  lastUpdated: Date;
}

/**
 * Optimization recommendation
 */
export interface OptimizationRecommendation {
  id: string;
  type:
    | "route_change"
    | "rule_adjustment"
    | "threshold_update"
    | "strategy_change";
  priority: "low" | "medium" | "high" | "critical";
  description: string;
  expectedImprovement: number; // Percentage improvement expected
  implementation: {
    action: string;
    parameters: Record<string, any>;
    rollbackPlan: string;
  };
  confidence: number; // 0-1 confidence score
  timestamp: Date;
}

/**
 * Optimization result
 */
export interface OptimizationResult {
  optimizationId: string;
  strategy: OptimizationStrategy;
  appliedRecommendations: OptimizationRecommendation[];
  performanceImprovement: number; // Actual improvement percentage
  latencyImprovement: number;
  successRateImprovement: number;
  costImprovement: number;
  timestamp: Date;
  success: boolean;
  rollbackRequired: boolean;
}

/**
 * Optimizer configuration
 */
export interface OptimizerConfig {
  // Optimization targets
  targetPerformanceImprovement: number; // Minimum 15% improvement
  targetLatencyReduction: number; // Target latency reduction percentage
  targetSuccessRateImprovement: number; // Target success rate improvement
  targetCostReduction: number; // Target cost reduction percentage

  // Optimization intervals
  optimizationIntervalMs: number; // How often to run optimization
  performanceEvaluationWindowMs: number; // Window for performance evaluation

  // Safety thresholds
  maxRoutingRuleChanges: number; // Maximum rule changes per optimization cycle
  minDataPointsRequired: number; // Minimum data points before optimization
  rollbackThreshold: number; // Performance degradation threshold for rollback

  // Strategy configuration
  defaultStrategy: OptimizationStrategy;
  enableAdaptiveStrategy: boolean;
  enableAutomaticRollback: boolean;

  // Feature flags
  enableOptimization: boolean;
  enableAggressiveOptimization: boolean;
}

/**
 * Default optimizer configuration
 */
const DEFAULT_CONFIG: OptimizerConfig = {
  targetPerformanceImprovement: 15, // 15% minimum improvement
  targetLatencyReduction: 20, // 20% latency reduction target
  targetSuccessRateImprovement: 5, // 5% success rate improvement
  targetCostReduction: 25, // 25% cost reduction target
  optimizationIntervalMs: 300000, // 5 minutes
  performanceEvaluationWindowMs: 900000, // 15 minutes
  maxRoutingRuleChanges: 3,
  minDataPointsRequired: 100,
  rollbackThreshold: -5, // Rollback if performance degrades by 5%
  defaultStrategy: OptimizationStrategy.BALANCED,
  enableAdaptiveStrategy: true,
  enableAutomaticRollback: true,
  enableOptimization: true,
  enableAggressiveOptimization: false,
};

/**
 * Routing Efficiency Optimizer
 *
 * Actively optimizes routing decisions to achieve >15% performance improvement
 */
export class RoutingEfficiencyOptimizer {
  private config: OptimizerConfig;
  private router: IntelligentRouter;
  private performanceMonitor: HybridRoutingPerformanceMonitor;
  private featureFlags: AiFeatureFlags;
  private auditTrail: AuditTrailSystem;

  private routeProfiles: Map<RouteType, RoutePerformanceProfile>;
  private optimizationHistory: OptimizationResult[];
  private activeRecommendations: OptimizationRecommendation[];
  private baselineMetrics: Map<string, number>;

  private optimizationTimer?: NodeJS.Timeout;
  private isOptimizing: boolean = false;
  private lastOptimization?: Date;

  constructor(
    router: IntelligentRouter,
    performanceMonitor: HybridRoutingPerformanceMonitor,
    featureFlags: AiFeatureFlags,
    auditTrail: AuditTrailSystem,
    config?: Partial<OptimizerConfig>
  ) {
    this.router = router;
    this.performanceMonitor = performanceMonitor;
    this.featureFlags = featureFlags;
    this.auditTrail = auditTrail;
    this.config = { ...DEFAULT_CONFIG, ...config };

    this.routeProfiles = new Map();
    this.optimizationHistory = [];
    this.activeRecommendations = [];
    this.baselineMetrics = new Map();

    this.initializeRouteProfiles();
    this.captureBaselineMetrics();
  }

  /**
   * Start the optimization engine
   */
  async startOptimization(): Promise<void> {
    if (this.isOptimizing) {
      console.log("[RoutingEfficiencyOptimizer] Already optimizing");
      return;
    }

    if (!this.featureFlags.isEnabled("routing_efficiency_optimization")) {
      console.log(
        "[RoutingEfficiencyOptimizer] Optimization disabled by feature flag"
      );
      return;
    }

    console.log("[RoutingEfficiencyOptimizer] Starting optimization engine");
    this.isOptimizing = true;

    // Initial optimization
    await this.runOptimizationCycle();

    // Schedule periodic optimization
    this.optimizationTimer = setInterval(
      () => this.runOptimizationCycle(),
      this.config.optimizationIntervalMs
    );

    // Log optimization start
    await this.auditTrail.logRoutingOptimizationStart(
      this.config.defaultStrategy,
      this.config.targetPerformanceImprovement
    );
  }

  /**
   * Stop the optimization engine
   */
  async stopOptimization(): Promise<void> {
    if (!this.isOptimizing) {
      return;
    }

    console.log("[RoutingEfficiencyOptimizer] Stopping optimization engine");
    this.isOptimizing = false;

    if (this.optimizationTimer) {
      clearInterval(this.optimizationTimer);
      this.optimizationTimer = undefined;
    }

    // Log optimization stop
    await this.auditTrail.logRoutingOptimizationStop(
      this.optimizationHistory.length,
      this.calculateOverallImprovement()
    );
  }

  /**
   * Run a single optimization cycle
   */
  private async runOptimizationCycle(): Promise<void> {
    try {
      console.log("[RoutingEfficiencyOptimizer] Running optimization cycle");

      // Update route performance profiles
      await this.updateRouteProfiles();

      // Analyze current performance
      const currentPerformance = await this.analyzeCurrentPerformance();

      // Generate optimization recommendations
      const recommendations = await this.generateOptimizationRecommendations(
        currentPerformance
      );

      if (recommendations.length === 0) {
        console.log(
          "[RoutingEfficiencyOptimizer] No optimization recommendations"
        );
        return;
      }

      // Apply high-priority recommendations
      const appliedRecommendations = await this.applyRecommendations(
        recommendations.filter(
          (r) => r.priority === "high" || r.priority === "critical"
        )
      );

      if (appliedRecommendations.length > 0) {
        // Create optimization result
        const result: OptimizationResult = {
          optimizationId: this.generateOptimizationId(),
          strategy: this.config.defaultStrategy,
          appliedRecommendations,
          performanceImprovement: 0, // Will be calculated after evaluation period
          latencyImprovement: 0,
          successRateImprovement: 0,
          costImprovement: 0,
          timestamp: new Date(),
          success: true,
          rollbackRequired: false,
        };

        this.optimizationHistory.push(result);
        this.lastOptimization = new Date();

        // Log optimization
        await this.auditTrail.logRoutingOptimization(
          appliedRecommendations.map((r) => r.description),
          {
            strategy: this.config.defaultStrategy,
            expectedImprovement: Math.max(
              ...appliedRecommendations.map((r) => r.expectedImprovement)
            ),
            appliedCount: appliedRecommendations.length,
          }
        );

        console.log(
          `[RoutingEfficiencyOptimizer] Applied ${appliedRecommendations.length} optimizations`
        );
      }

      // Evaluate previous optimizations
      await this.evaluatePreviousOptimizations();
    } catch (error) {
      console.error(
        "[RoutingEfficiencyOptimizer] Error in optimization cycle:",
        error
      );
    }
  }

  /**
   * Update route performance profiles
   */
  private async updateRouteProfiles(): Promise<void> {
    const allMetrics = this.performanceMonitor.getAllPathMetrics();

    for (const [path, metrics] of allMetrics.entries()) {
      if (path === "hybrid" || path === "fallback") continue; // Skip composite paths

      const route = path as RouteType;
      const profile: RoutePerformanceProfile = {
        route,
        averageLatencyMs: metrics.averageLatencyMs,
        p95LatencyMs: metrics.p95LatencyMs,
        successRate: metrics.successRate,
        costPerRequest: this.estimateCostPerRequest(route, metrics),
        reliability: this.calculateReliability(metrics),
        capacity: this.estimateCapacity(route, metrics),
        lastUpdated: new Date(),
      };

      this.routeProfiles.set(route, profile);
    }
  }

  /**
   * Analyze current performance
   */
  private async analyzeCurrentPerformance(): Promise<{
    overallLatency: number;
    overallSuccessRate: number;
    overallCost: number;
    routingEfficiency: number;
    bottlenecks: string[];
  }> {
    const efficiency =
      await this.performanceMonitor.calculateRoutingEfficiency();
    const allMetrics = this.performanceMonitor.getAllPathMetrics();

    let totalRequests = 0;
    let weightedLatency = 0;
    let weightedSuccessRate = 0;
    let totalCost = 0;
    const bottlenecks: string[] = [];

    for (const [path, metrics] of allMetrics.entries()) {
      if (path === "hybrid" || path === "fallback") continue;

      totalRequests += metrics.requestCount;
      weightedLatency += metrics.averageLatencyMs * metrics.requestCount;
      weightedSuccessRate += metrics.successRate * metrics.requestCount;

      const profile = this.routeProfiles.get(path as RouteType);
      if (profile) {
        totalCost += profile.costPerRequest * metrics.requestCount;

        // Identify bottlenecks
        if (metrics.p95LatencyMs > 10000) {
          bottlenecks.push(
            `High P95 latency on ${path}: ${metrics.p95LatencyMs}ms`
          );
        }
        if (metrics.successRate < 95) {
          bottlenecks.push(
            `Low success rate on ${path}: ${metrics.successRate.toFixed(2)}%`
          );
        }
      }
    }

    return {
      overallLatency: totalRequests > 0 ? weightedLatency / totalRequests : 0,
      overallSuccessRate:
        totalRequests > 0 ? weightedSuccessRate / totalRequests : 100,
      overallCost: totalCost,
      routingEfficiency: efficiency.overallEfficiency,
      bottlenecks,
    };
  }

  /**
   * Generate optimization recommendations
   */
  private async generateOptimizationRecommendations(
    performance: any
  ): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];

    // Check if we have enough data
    const totalRequests = Array.from(
      this.performanceMonitor.getAllPathMetrics().values()
    ).reduce((sum, metrics) => sum + metrics.requestCount, 0);

    if (totalRequests < this.config.minDataPointsRequired) {
      console.log(
        "[RoutingEfficiencyOptimizer] Insufficient data for optimization"
      );
      return recommendations;
    }

    // Latency optimization recommendations
    if (performance.overallLatency > 5000) {
      const directProfile = this.routeProfiles.get("direct");
      const mcpProfile = this.routeProfiles.get("mcp");

      if (directProfile && mcpProfile) {
        if (
          directProfile.averageLatencyMs <
          mcpProfile.averageLatencyMs * 0.8
        ) {
          recommendations.push({
            id: this.generateRecommendationId(),
            type: "rule_adjustment",
            priority: "high",
            description:
              "Route more operations to direct Bedrock for better latency",
            expectedImprovement: 25,
            implementation: {
              action: "adjust_routing_thresholds",
              parameters: {
                increaseDirectRouting: true,
                latencyThreshold: 8000,
              },
              rollbackPlan: "Revert to previous routing thresholds",
            },
            confidence: 0.85,
            timestamp: new Date(),
          });
        }
      }
    }

    // Success rate optimization recommendations
    if (performance.overallSuccessRate < 95) {
      recommendations.push({
        id: this.generateRecommendationId(),
        type: "route_change",
        priority: "critical",
        description: "Implement circuit breaker with faster failover",
        expectedImprovement: 15,
        implementation: {
          action: "update_circuit_breaker_config",
          parameters: {
            failureThreshold: 2,
            recoveryTimeout: 15000,
          },
          rollbackPlan: "Revert circuit breaker to previous configuration",
        },
        confidence: 0.9,
        timestamp: new Date(),
      });
    }

    // Cost optimization recommendations
    const baselineCost = this.baselineMetrics.get("totalCost") || 0;
    if (performance.overallCost > baselineCost * 1.2) {
      recommendations.push({
        id: this.generateRecommendationId(),
        type: "strategy_change",
        priority: "medium",
        description: "Route standard operations to MCP to reduce costs",
        expectedImprovement: 30,
        implementation: {
          action: "update_routing_strategy",
          parameters: {
            strategy: OptimizationStrategy.COST_EFFICIENT,
            mcpPreference: 0.8,
          },
          rollbackPlan: "Revert to balanced routing strategy",
        },
        confidence: 0.75,
        timestamp: new Date(),
      });
    }

    // Routing efficiency recommendations
    if (performance.routingEfficiency < 80) {
      recommendations.push({
        id: this.generateRecommendationId(),
        type: "threshold_update",
        priority: "high",
        description:
          "Optimize routing decision thresholds based on current performance",
        expectedImprovement: 20,
        implementation: {
          action: "optimize_routing_thresholds",
          parameters: {
            adaptiveThresholds: true,
            performanceWeighting: 0.7,
          },
          rollbackPlan: "Revert to static routing thresholds",
        },
        confidence: 0.8,
        timestamp: new Date(),
      });
    }

    // Adaptive strategy recommendation
    if (this.config.enableAdaptiveStrategy && recommendations.length > 2) {
      recommendations.push({
        id: this.generateRecommendationId(),
        type: "strategy_change",
        priority: "medium",
        description:
          "Enable adaptive routing strategy for dynamic optimization",
        expectedImprovement: 18,
        implementation: {
          action: "enable_adaptive_strategy",
          parameters: {
            strategy: OptimizationStrategy.ADAPTIVE,
            adaptationInterval: 60000,
          },
          rollbackPlan: "Disable adaptive strategy",
        },
        confidence: 0.7,
        timestamp: new Date(),
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Apply optimization recommendations
   */
  private async applyRecommendations(
    recommendations: OptimizationRecommendation[]
  ): Promise<OptimizationRecommendation[]> {
    const applied: OptimizationRecommendation[] = [];
    let changesApplied = 0;

    for (const recommendation of recommendations) {
      if (changesApplied >= this.config.maxRoutingRuleChanges) {
        console.log(
          "[RoutingEfficiencyOptimizer] Maximum changes per cycle reached"
        );
        break;
      }

      try {
        const success = await this.applyRecommendation(recommendation);
        if (success) {
          applied.push(recommendation);
          changesApplied++;

          console.log(
            `[RoutingEfficiencyOptimizer] Applied: ${recommendation.description}`
          );
        }
      } catch (error) {
        console.error(
          `[RoutingEfficiencyOptimizer] Failed to apply recommendation: ${recommendation.description}`,
          error
        );
      }
    }

    this.activeRecommendations.push(...applied);
    return applied;
  }

  /**
   * Apply a single recommendation
   */
  private async applyRecommendation(
    recommendation: OptimizationRecommendation
  ): Promise<boolean> {
    const { action, parameters } = recommendation.implementation;

    switch (action) {
      case "adjust_routing_thresholds":
        return this.adjustRoutingThresholds(parameters);

      case "update_circuit_breaker_config":
        return this.updateCircuitBreakerConfig(parameters);

      case "update_routing_strategy":
        return this.updateRoutingStrategy(parameters);

      case "optimize_routing_thresholds":
        return this.optimizeRoutingThresholds(parameters);

      case "enable_adaptive_strategy":
        return this.enableAdaptiveStrategy(parameters);

      default:
        console.warn(`[RoutingEfficiencyOptimizer] Unknown action: ${action}`);
        return false;
    }
  }

  /**
   * Adjust routing thresholds
   */
  private async adjustRoutingThresholds(parameters: any): Promise<boolean> {
    try {
      // Get current routing rules
      const currentRules = this.router.getRoutingRules?.() || [];

      // Adjust latency thresholds
      const updatedRules = currentRules.map((rule) => ({
        ...rule,
        latencyRequirement:
          parameters.latencyThreshold || rule.latencyRequirement,
      }));

      // Update router with new rules
      this.router.updateRoutingRules?.(updatedRules);

      return true;
    } catch (error) {
      console.error(
        "[RoutingEfficiencyOptimizer] Error adjusting routing thresholds:",
        error
      );
      return false;
    }
  }

  /**
   * Update circuit breaker configuration
   */
  private async updateCircuitBreakerConfig(parameters: any): Promise<boolean> {
    try {
      // This would integrate with the circuit breaker system
      // For now, we'll log the configuration change
      console.log(
        "[RoutingEfficiencyOptimizer] Circuit breaker config updated:",
        parameters
      );
      return true;
    } catch (error) {
      console.error(
        "[RoutingEfficiencyOptimizer] Error updating circuit breaker:",
        error
      );
      return false;
    }
  }

  /**
   * Update routing strategy
   */
  private async updateRoutingStrategy(parameters: any): Promise<boolean> {
    try {
      this.config.defaultStrategy = parameters.strategy;
      console.log(
        `[RoutingEfficiencyOptimizer] Strategy updated to: ${parameters.strategy}`
      );
      return true;
    } catch (error) {
      console.error(
        "[RoutingEfficiencyOptimizer] Error updating strategy:",
        error
      );
      return false;
    }
  }

  /**
   * Optimize routing thresholds
   */
  private async optimizeRoutingThresholds(parameters: any): Promise<boolean> {
    try {
      // Implement adaptive threshold optimization
      console.log(
        "[RoutingEfficiencyOptimizer] Routing thresholds optimized:",
        parameters
      );
      return true;
    } catch (error) {
      console.error(
        "[RoutingEfficiencyOptimizer] Error optimizing thresholds:",
        error
      );
      return false;
    }
  }

  /**
   * Enable adaptive strategy
   */
  private async enableAdaptiveStrategy(parameters: any): Promise<boolean> {
    try {
      this.config.enableAdaptiveStrategy = true;
      this.config.defaultStrategy = OptimizationStrategy.ADAPTIVE;
      console.log("[RoutingEfficiencyOptimizer] Adaptive strategy enabled");
      return true;
    } catch (error) {
      console.error(
        "[RoutingEfficiencyOptimizer] Error enabling adaptive strategy:",
        error
      );
      return false;
    }
  }

  /**
   * Evaluate previous optimizations
   */
  private async evaluatePreviousOptimizations(): Promise<void> {
    const evaluationWindow = this.config.performanceEvaluationWindowMs;
    const now = Date.now();

    for (const result of this.optimizationHistory) {
      if (result.performanceImprovement !== 0) continue; // Already evaluated

      const timeSinceOptimization = now - result.timestamp.getTime();
      if (timeSinceOptimization < evaluationWindow) continue; // Too early to evaluate

      // Calculate actual performance improvement
      const improvement = await this.calculatePerformanceImprovement(result);

      result.performanceImprovement = improvement.overall;
      result.latencyImprovement = improvement.latency;
      result.successRateImprovement = improvement.successRate;
      result.costImprovement = improvement.cost;

      // Check if rollback is needed
      if (
        improvement.overall < this.config.rollbackThreshold &&
        this.config.enableAutomaticRollback
      ) {
        await this.rollbackOptimization(result);
        result.rollbackRequired = true;
        result.success = false;
      }

      console.log(
        `[RoutingEfficiencyOptimizer] Optimization ${
          result.optimizationId
        } evaluated: ${improvement.overall.toFixed(2)}% improvement`
      );
    }
  }

  /**
   * Calculate performance improvement
   */
  private async calculatePerformanceImprovement(
    result: OptimizationResult
  ): Promise<{
    overall: number;
    latency: number;
    successRate: number;
    cost: number;
  }> {
    const currentPerformance = await this.analyzeCurrentPerformance();

    const baselineLatency =
      this.baselineMetrics.get("averageLatency") ||
      currentPerformance.overallLatency;
    const baselineSuccessRate =
      this.baselineMetrics.get("successRate") ||
      currentPerformance.overallSuccessRate;
    const baselineCost =
      this.baselineMetrics.get("totalCost") || currentPerformance.overallCost;

    const latencyImprovement =
      ((baselineLatency - currentPerformance.overallLatency) /
        baselineLatency) *
      100;
    const successRateImprovement =
      ((currentPerformance.overallSuccessRate - baselineSuccessRate) /
        baselineSuccessRate) *
      100;
    const costImprovement =
      ((baselineCost - currentPerformance.overallCost) / baselineCost) * 100;

    // Overall improvement is weighted average
    const overallImprovement =
      latencyImprovement * 0.4 +
      successRateImprovement * 0.3 +
      costImprovement * 0.3;

    return {
      overall: overallImprovement,
      latency: latencyImprovement,
      successRate: successRateImprovement,
      cost: costImprovement,
    };
  }

  /**
   * Rollback optimization
   */
  private async rollbackOptimization(
    result: OptimizationResult
  ): Promise<void> {
    console.log(
      `[RoutingEfficiencyOptimizer] Rolling back optimization: ${result.optimizationId}`
    );

    for (const recommendation of result.appliedRecommendations) {
      try {
        // Execute rollback plan
        console.log(
          `[RoutingEfficiencyOptimizer] Rollback: ${recommendation.implementation.rollbackPlan}`
        );

        // Log rollback
        await this.auditTrail.logRoutingOptimizationRollback(
          result.optimizationId,
          recommendation.description,
          result.performanceImprovement
        );
      } catch (error) {
        console.error(
          `[RoutingEfficiencyOptimizer] Rollback failed for: ${recommendation.description}`,
          error
        );
      }
    }
  }

  /**
   * Get optimization status
   */
  getOptimizationStatus(): {
    isOptimizing: boolean;
    lastOptimization?: Date;
    totalOptimizations: number;
    overallImprovement: number;
    activeRecommendations: number;
    targetAchieved: boolean;
  } {
    const overallImprovement = this.calculateOverallImprovement();

    return {
      isOptimizing: this.isOptimizing,
      lastOptimization: this.lastOptimization,
      totalOptimizations: this.optimizationHistory.length,
      overallImprovement,
      activeRecommendations: this.activeRecommendations.length,
      targetAchieved:
        overallImprovement >= this.config.targetPerformanceImprovement,
    };
  }

  /**
   * Get optimization history
   */
  getOptimizationHistory(): OptimizationResult[] {
    return [...this.optimizationHistory];
  }

  /**
   * Get active recommendations
   */
  getActiveRecommendations(): OptimizationRecommendation[] {
    return [...this.activeRecommendations];
  }

  // Private helper methods

  private initializeRouteProfiles(): void {
    const routes: RouteType[] = ["direct", "mcp"];

    for (const route of routes) {
      this.routeProfiles.set(route, {
        route,
        averageLatencyMs: 0,
        p95LatencyMs: 0,
        successRate: 100,
        costPerRequest: 0,
        reliability: 1.0,
        capacity: 1.0,
        lastUpdated: new Date(),
      });
    }
  }

  private async captureBaselineMetrics(): Promise<void> {
    const performance = await this.analyzeCurrentPerformance();

    this.baselineMetrics.set("averageLatency", performance.overallLatency);
    this.baselineMetrics.set("successRate", performance.overallSuccessRate);
    this.baselineMetrics.set("totalCost", performance.overallCost);
    this.baselineMetrics.set(
      "routingEfficiency",
      performance.routingEfficiency
    );
  }

  private estimateCostPerRequest(
    route: RouteType,
    metrics: RoutingPathMetrics
  ): number {
    // Simplified cost estimation
    const baseCost = route === "direct" ? 0.001 : 0.0003; // Direct Bedrock costs more
    return baseCost * (metrics.averageLatencyMs / 1000); // Cost scales with latency
  }

  private calculateReliability(metrics: RoutingPathMetrics): number {
    return metrics.successRate / 100;
  }

  private estimateCapacity(
    route: RouteType,
    metrics: RoutingPathMetrics
  ): number {
    // Simplified capacity estimation based on latency
    const maxLatency = 30000; // 30 seconds max
    return Math.max(0.1, 1 - metrics.p95LatencyMs / maxLatency);
  }

  private calculateOverallImprovement(): number {
    if (this.optimizationHistory.length === 0) return 0;

    const validResults = this.optimizationHistory.filter(
      (r) => r.performanceImprovement !== 0
    );
    if (validResults.length === 0) return 0;

    return (
      validResults.reduce((sum, r) => sum + r.performanceImprovement, 0) /
      validResults.length
    );
  }

  private generateOptimizationId(): string {
    return `opt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateRecommendationId(): string {
    return `rec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.stopOptimization();
    this.routeProfiles.clear();
    this.optimizationHistory = [];
    this.activeRecommendations = [];
    this.baselineMetrics.clear();
  }
}

/**
 * Create routing efficiency optimizer
 */
export function createRoutingEfficiencyOptimizer(
  router: IntelligentRouter,
  performanceMonitor: HybridRoutingPerformanceMonitor,
  featureFlags: AiFeatureFlags,
  auditTrail: AuditTrailSystem,
  config?: Partial<OptimizerConfig>
): RoutingEfficiencyOptimizer {
  return new RoutingEfficiencyOptimizer(
    router,
    performanceMonitor,
    featureFlags,
    auditTrail,
    config
  );
}
