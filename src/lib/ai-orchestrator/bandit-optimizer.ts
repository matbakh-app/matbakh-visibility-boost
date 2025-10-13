/**
 * Bandit Optimizer for AI Model Selection
 *
 * Implements:
 * - UCB (Upper Confidence Bound) algorithm
 * - Thompson Sampling with Beta distribution
 * - Contextual bandits for persona-based routing
 * - Integration with Evidently experiments
 * - Automated optimization and learning
 */

import {
  Arm,
  ArmStats,
  BanditContext,
  ThompsonBandit,
} from "./bandit-controller";
import {
  EvidentlyExperimentManager,
  ExperimentContext,
} from "./evidently-experiments";

export interface UCBStats extends ArmStats {
  ucbScore: number;
  confidenceRadius: number;
}

export interface OptimizationConfig {
  explorationRate: number; // 0-1, higher = more exploration
  confidenceLevel: number; // 0-1, for UCB confidence intervals
  minTrialsForConfidence: number; // Minimum trials before trusting results
  autoOptimizationEnabled: boolean;
  optimizationInterval: number; // Minutes between optimization runs
}

export interface OptimizationResult {
  recommendedArm: Arm;
  confidence: number;
  expectedReward: number;
  explorationNeeded: boolean;
  reasoning: string;
}

export interface ContextualPerformance {
  context: string;
  armPerformance: Record<
    Arm,
    {
      winRate: number;
      avgLatency: number;
      avgCost: number;
      trials: number;
      confidence: number;
    }
  >;
  bestArm: Arm;
  improvement: number;
}

export class BanditOptimizer {
  private bandit: ThompsonBandit;
  private experimentManager?: EvidentlyExperimentManager;
  private config: OptimizationConfig;
  private optimizationHistory: Array<{
    timestamp: Date;
    context?: BanditContext;
    result: OptimizationResult;
    actualOutcome?: boolean;
  }> = [];

  constructor(
    bandit?: ThompsonBandit,
    experimentManager?: EvidentlyExperimentManager,
    config?: Partial<OptimizationConfig>
  ) {
    this.bandit = bandit || new ThompsonBandit();
    this.experimentManager = experimentManager;
    this.config = {
      explorationRate: 0.1,
      confidenceLevel: 0.95,
      minTrialsForConfidence: 20,
      autoOptimizationEnabled: true,
      optimizationInterval: 60, // 1 hour
      ...config,
    };

    if (this.config.autoOptimizationEnabled) {
      this.startAutoOptimization();
    }
  }

  /**
   * UCB (Upper Confidence Bound) algorithm for arm selection
   */
  selectArmUCB(context?: BanditContext): OptimizationResult {
    const stats = this.bandit.getStats(context);
    const totalTrials = Object.values(stats).reduce(
      (sum, stat) => sum + stat.trials,
      0
    );

    if (totalTrials === 0) {
      // No data yet, return random arm
      const arms: Arm[] = ["bedrock", "google", "meta"];
      const randomArm = arms[Math.floor(Math.random() * arms.length)];
      return {
        recommendedArm: randomArm,
        confidence: 0.33,
        expectedReward: 0.5,
        explorationNeeded: true,
        reasoning: "No historical data available, exploring randomly",
      };
    }

    let bestArm: Arm = "bedrock";
    let bestUCB = -1;
    const ucbStats: Record<Arm, UCBStats> = {} as any;

    // Calculate UCB for each arm
    (Object.keys(stats) as Arm[]).forEach((arm) => {
      const armStats = stats[arm];

      if (armStats.trials === 0) {
        // Unplayed arm gets infinite UCB
        ucbStats[arm] = {
          ...armStats,
          ucbScore: Infinity,
          confidenceRadius: Infinity,
        };
        bestArm = arm;
        bestUCB = Infinity;
        return;
      }

      // UCB formula: mean + confidence_radius
      const mean = armStats.winRate;
      const confidenceRadius =
        Math.sqrt((2 * Math.log(totalTrials)) / armStats.trials) *
        this.config.explorationRate;

      const ucbScore = mean + confidenceRadius;

      ucbStats[arm] = {
        ...armStats,
        ucbScore,
        confidenceRadius,
      };

      if (ucbScore > bestUCB) {
        bestUCB = ucbScore;
        bestArm = arm;
      }
    });

    const bestStats = ucbStats[bestArm];
    const confidence =
      bestStats.trials >= this.config.minTrialsForConfidence
        ? Math.min(0.95, bestStats.winRate + 0.1)
        : Math.max(0.3, bestStats.winRate);

    const explorationNeeded =
      bestStats.confidenceRadius > 0.1 ||
      bestStats.trials < this.config.minTrialsForConfidence;

    return {
      recommendedArm: bestArm,
      confidence,
      expectedReward: bestStats.winRate,
      explorationNeeded,
      reasoning: explorationNeeded
        ? `Exploration needed: ${
            bestStats.trials
          } trials, confidence radius ${bestStats.confidenceRadius.toFixed(3)}`
        : `Exploitation: High confidence in ${bestArm} (${
            bestStats.trials
          } trials, ${(bestStats.winRate * 100).toFixed(1)}% win rate)`,
    };
  }

  /**
   * Thompson Sampling with contextual information
   */
  selectArmThompson(context?: BanditContext): OptimizationResult {
    const chosenArm = this.bandit.choose(context);
    const stats = this.bandit.getStats(context);
    const armStats = stats[chosenArm];

    const confidence =
      armStats.trials >= this.config.minTrialsForConfidence
        ? Math.min(0.95, armStats.winRate + 0.1)
        : Math.max(0.3, armStats.winRate);

    const explorationNeeded =
      armStats.trials < this.config.minTrialsForConfidence;

    return {
      recommendedArm: chosenArm,
      confidence,
      expectedReward: armStats.winRate,
      explorationNeeded,
      reasoning: `Thompson Sampling selected ${chosenArm} based on Beta(${
        1 + armStats.wins
      }, ${1 + armStats.trials - armStats.wins}) distribution`,
    };
  }

  /**
   * Hybrid approach: UCB for exploration, Thompson for exploitation
   */
  selectArmHybrid(context?: BanditContext): OptimizationResult {
    const stats = this.bandit.getStats(context);
    const totalTrials = Object.values(stats).reduce(
      (sum, stat) => sum + stat.trials,
      0
    );

    // Use UCB for early exploration
    if (totalTrials < this.config.minTrialsForConfidence * 3) {
      return this.selectArmUCB(context);
    }

    // Use Thompson Sampling for exploitation
    return this.selectArmThompson(context);
  }

  /**
   * Get optimal arm with experiment integration
   */
  async getOptimalArm(context: ExperimentContext): Promise<OptimizationResult> {
    // Check if experiment manager is available and has active experiments
    if (this.experimentManager) {
      try {
        const experimentResult =
          await this.experimentManager.getOptimalProvider(context);

        if (experimentResult.source === "experiment") {
          return {
            recommendedArm: experimentResult.provider,
            confidence: experimentResult.confidence,
            expectedReward: 0.8, // Assume experiments are well-designed
            explorationNeeded: false,
            reasoning: `Experiment assignment: ${experimentResult.experimentName}`,
          };
        }
      } catch (error) {
        console.warn(
          "Failed to get experiment assignment, falling back to bandit:",
          error
        );
      }
    }

    // Fall back to bandit optimization
    return this.selectArmHybrid(context);
  }

  /**
   * Record outcome and update optimization
   */
  async recordOutcome(
    context: ExperimentContext,
    arm: Arm,
    success: boolean,
    latencyMs: number,
    costEuro: number,
    qualityScore?: number
  ): Promise<void> {
    // Record in bandit
    this.bandit.record(arm, success, costEuro, latencyMs, context);

    // Record in experiment manager if available
    if (this.experimentManager) {
      try {
        await this.experimentManager.recordExperimentOutcome(context, arm, {
          success,
          latencyMs,
          costEuro,
          qualityScore,
        });
      } catch (error) {
        console.warn("Failed to record experiment outcome:", error);
        // Continue execution - bandit recording is more important
      }
    }

    // Update optimization history
    const lastOptimization =
      this.optimizationHistory[this.optimizationHistory.length - 1];
    if (lastOptimization && !lastOptimization.actualOutcome) {
      lastOptimization.actualOutcome = success;
    }
  }

  /**
   * Analyze contextual performance across different contexts
   */
  analyzeContextualPerformance(): ContextualPerformance[] {
    const contexts = this.getUniqueContexts();

    return contexts.map((contextKey) => {
      const context = this.parseContextKey(contextKey);
      const stats = this.bandit.getStats(context);

      const armPerformance: Record<Arm, any> = {} as any;
      let bestArm: Arm = "bedrock";
      let bestScore = -1;

      (Object.keys(stats) as Arm[]).forEach((arm) => {
        const armStats = stats[arm];
        const confidence =
          armStats.trials >= this.config.minTrialsForConfidence
            ? Math.min(0.95, armStats.winRate + 0.1)
            : Math.max(0.3, armStats.winRate);

        // Composite score: win rate (50%) + latency (30%) + cost (20%)
        const score =
          armStats.winRate * 0.5 +
          (1 / (armStats.avgLatency + 1)) * 0.3 +
          (1 / (armStats.avgCost + 0.01)) * 0.2;

        armPerformance[arm] = {
          winRate: armStats.winRate,
          avgLatency: armStats.avgLatency,
          avgCost: armStats.avgCost,
          trials: armStats.trials,
          confidence,
        };

        if (score > bestScore) {
          bestScore = score;
          bestArm = arm;
        }
      });

      // Calculate improvement over random baseline (33% win rate)
      const improvement = (armPerformance[bestArm].winRate - 0.33) / 0.33;

      return {
        context: contextKey,
        armPerformance,
        bestArm,
        improvement,
      };
    });
  }

  /**
   * Get optimization recommendations based on current performance
   */
  getOptimizationRecommendations(): Array<{
    type: "exploration" | "exploitation" | "context_specific" | "experiment";
    priority: "high" | "medium" | "low";
    description: string;
    action: string;
  }> {
    const recommendations = [];
    const contextualPerformance = this.analyzeContextualPerformance();
    const globalStats = this.bandit.getStats();

    // Check for under-explored arms
    const underExploredArms = (Object.keys(globalStats) as Arm[]).filter(
      (arm) => globalStats[arm].trials < this.config.minTrialsForConfidence
    );

    if (underExploredArms.length > 0) {
      recommendations.push({
        type: "exploration" as const,
        priority: "high" as const,
        description: `Arms ${underExploredArms.join(
          ", "
        )} need more exploration`,
        action: `Increase exploration rate or force exploration of ${underExploredArms.join(
          ", "
        )}`,
      });
    }

    // Check for contexts with poor performance
    const poorPerformingContexts = contextualPerformance.filter(
      (ctx) => ctx.improvement < 0.1 // Less than 10% improvement over random
    );

    if (poorPerformingContexts.length > 0) {
      recommendations.push({
        type: "context_specific" as const,
        priority: "medium" as const,
        description: `Poor performance in contexts: ${poorPerformingContexts
          .map((c) => c.context)
          .join(", ")}`,
        action: "Consider context-specific optimization or feature engineering",
      });
    }

    // Check for high-confidence winners
    const highConfidenceContexts = contextualPerformance.filter(
      (ctx) =>
        ctx.armPerformance[ctx.bestArm].confidence > 0.9 &&
        ctx.armPerformance[ctx.bestArm].trials > 50
    );

    if (highConfidenceContexts.length > 0) {
      recommendations.push({
        type: "exploitation" as const,
        priority: "low" as const,
        description: `High confidence winners found in ${highConfidenceContexts.length} contexts`,
        action: "Consider reducing exploration rate for these contexts",
      });
    }

    // Suggest experiments for promising contexts
    const promisingContexts = contextualPerformance.filter(
      (ctx) =>
        ctx.improvement > 0.2 && ctx.armPerformance[ctx.bestArm].trials > 30
    );

    if (promisingContexts.length > 0 && this.experimentManager) {
      recommendations.push({
        type: "experiment" as const,
        priority: "medium" as const,
        description: `Promising contexts found: ${promisingContexts
          .map((c) => c.context)
          .join(", ")}`,
        action: "Consider running formal A/B experiments to validate findings",
      });
    }

    return recommendations;
  }

  /**
   * Start automatic optimization process
   */
  private startAutoOptimization(): void {
    setInterval(() => {
      this.runOptimizationCycle();
    }, this.config.optimizationInterval * 60 * 1000); // Convert minutes to ms
  }

  /**
   * Run a single optimization cycle
   */
  private async runOptimizationCycle(): Promise<void> {
    try {
      const recommendations = this.getOptimizationRecommendations();

      // Log recommendations
      if (recommendations.length > 0) {
        console.log("Bandit Optimization Recommendations:", recommendations);
      }

      // Auto-apply low-risk optimizations
      const highPriorityRecs = recommendations.filter(
        (r) => r.priority === "high"
      );

      for (const rec of highPriorityRecs) {
        if (rec.type === "exploration") {
          // Temporarily increase exploration rate
          this.config.explorationRate = Math.min(
            0.3,
            this.config.explorationRate * 1.2
          );
          console.log(
            `Auto-optimization: Increased exploration rate to ${this.config.explorationRate}`
          );
        }
      }

      // Reset exploration rate after some time
      setTimeout(() => {
        this.config.explorationRate = Math.max(
          0.05,
          this.config.explorationRate * 0.9
        );
      }, 30 * 60 * 1000); // 30 minutes
    } catch (error) {
      console.error("Error in optimization cycle:", error);
    }
  }

  /**
   * Get unique contexts from bandit history
   */
  private getUniqueContexts(): string[] {
    // This would need to be implemented based on how contexts are stored
    // For now, return some common contexts
    return [
      "general|standard|no-tools",
      "legal|premium|tools",
      "culinary|standard|no-tools",
      "medical|premium|tools",
    ];
  }

  /**
   * Parse context key back to BanditContext
   */
  private parseContextKey(contextKey: string): BanditContext {
    const [domain, budgetTier, tools] = contextKey.split("|");
    return {
      domain: domain === "general" ? undefined : domain,
      budgetTier: budgetTier === "standard" ? undefined : budgetTier,
      requireTools: tools === "tools",
    };
  }

  /**
   * Get current configuration
   */
  getConfig(): OptimizationConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<OptimizationConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  /**
   * Get optimization history
   */
  getOptimizationHistory(): typeof this.optimizationHistory {
    return [...this.optimizationHistory];
  }

  /**
   * Reset bandit and optimization history
   */
  reset(): void {
    this.bandit = new ThompsonBandit();
    this.optimizationHistory = [];
  }

  /**
   * Export bandit state for persistence
   */
  exportState(): {
    banditStats: ReturnType<ThompsonBandit["getStats"]>;
    config: OptimizationConfig;
    optimizationHistory: typeof this.optimizationHistory;
  } {
    return {
      banditStats: this.bandit.getStats(),
      config: this.config,
      optimizationHistory: this.optimizationHistory,
    };
  }

  /**
   * Get bandit statistics
   */
  getBanditStats(): ReturnType<ThompsonBandit["getStats"]> {
    return this.bandit.getStats();
  }

  /**
   * Health check for the optimizer
   */
  healthCheck(): {
    status: "healthy" | "warning" | "error";
    totalTrials: number;
    activeContexts: number;
    autoOptimizationEnabled: boolean;
    lastOptimization?: Date;
    recommendations: number;
  } {
    const globalStats = this.bandit.getStats();
    const totalTrials = Object.values(globalStats).reduce(
      (sum, stat) => sum + stat.trials,
      0
    );
    const recommendations = this.getOptimizationRecommendations();

    let status: "healthy" | "warning" | "error" = "healthy";

    if (totalTrials < 10) {
      status = "warning"; // Not enough data
    }

    const highPriorityIssues = recommendations.filter(
      (r) => r.priority === "high"
    );
    if (highPriorityIssues.length > 0) {
      status = "warning";
    }

    return {
      status,
      totalTrials,
      activeContexts: this.getUniqueContexts().length,
      autoOptimizationEnabled: this.config.autoOptimizationEnabled,
      lastOptimization:
        this.optimizationHistory[this.optimizationHistory.length - 1]
          ?.timestamp,
      recommendations: recommendations.length,
    };
  }
}

// Utility functions for bandit optimization
export const BanditUtils = {
  /**
   * Calculate statistical significance between two arms
   */
  calculateSignificance(
    arm1: { wins: number; trials: number },
    arm2: { wins: number; trials: number }
  ): {
    significant: boolean;
    pValue: number;
    confidenceInterval: [number, number];
  } {
    if (arm1.trials === 0 || arm2.trials === 0) {
      return { significant: false, pValue: 1, confidenceInterval: [0, 1] };
    }

    const p1 = arm1.wins / arm1.trials;
    const p2 = arm2.wins / arm2.trials;
    const diff = p1 - p2;

    // Simple z-test approximation
    const se = Math.sqrt(
      (p1 * (1 - p1)) / arm1.trials + (p2 * (1 - p2)) / arm2.trials
    );

    const z = Math.abs(diff) / se;
    const pValue = 2 * (1 - this.normalCDF(z)); // Two-tailed test

    const margin = 1.96 * se; // 95% confidence interval
    const confidenceInterval: [number, number] = [diff - margin, diff + margin];

    return {
      significant: pValue < 0.05,
      pValue,
      confidenceInterval,
    };
  },

  /**
   * Normal CDF approximation
   */
  normalCDF(x: number): number {
    return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
  },

  /**
   * Error function approximation
   */
  erf(x: number): number {
    // Abramowitz and Stegun approximation
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const y =
      1.0 -
      ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  },

  /**
   * Calculate expected regret for an arm selection strategy
   */
  calculateRegret(
    trueRewards: Record<Arm, number>,
    selections: Array<{ arm: Arm; reward: number }>
  ): number {
    const optimalReward = Math.max(...Object.values(trueRewards));
    let totalRegret = 0;

    selections.forEach((selection) => {
      const regret = optimalReward - trueRewards[selection.arm];
      totalRegret += regret;
    });

    return totalRegret / selections.length; // Average regret
  },
};
