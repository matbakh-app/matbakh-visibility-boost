/**
 * Active Optimization System
 *
 * Integrates Evidently experiments with bandit optimization to create
 * an active, self-optimizing AI model routing system.
 *
 * Features:
 * - Automatic experiment lifecycle management
 * - Real-time bandit optimization
 * - Performance monitoring and alerting
 * - Auto-scaling based on traffic patterns
 */

import { Arm, ThompsonBandit } from "./bandit-controller";
import { BanditOptimizer } from "./bandit-optimizer";
import {
  AI_EXPERIMENTS,
  EvidentlyExperimentManager,
  ExperimentContext,
} from "./evidently-experiments";

export interface OptimizationSystemConfig {
  projectName: string;
  region: string;
  autoExperimentEnabled: boolean;
  experimentDuration: number; // days
  minTrafficForExperiment: number; // requests per day
  significanceThreshold: number; // 0-1
  autoStopEnabled: boolean;
  autoTrafficAllocationEnabled: boolean; // NEW: Enable automatic traffic allocation
  trafficAllocationInterval: number; // minutes between traffic allocation updates
  performanceThresholds: {
    minWinRate: number;
    maxLatency: number; // ms
    maxCost: number; // euro
  };
}

export interface SystemMetrics {
  totalRequests: number;
  experimentsActive: number;
  banditPerformance: {
    bestArm: Arm;
    confidence: number;
    winRate: number;
  };
  systemHealth: "healthy" | "warning" | "error";
  lastOptimization: Date;
  lastTrafficAllocation: Date; // NEW: Track last traffic allocation update
  currentTrafficAllocation: Record<Arm, number>; // NEW: Current traffic percentages
  recommendations: string[];
}

export interface OptimizationEvent {
  timestamp: Date;
  type:
    | "experiment_started"
    | "experiment_stopped"
    | "bandit_updated"
    | "performance_alert"
    | "auto_optimization"
    | "traffic_allocation_updated"; // NEW: Traffic allocation events
  details: Record<string, any>;
  impact: "low" | "medium" | "high";
}

export class ActiveOptimizationSystem {
  private experimentManager: EvidentlyExperimentManager;
  private banditOptimizer: BanditOptimizer;
  private config: OptimizationSystemConfig;
  private metrics: SystemMetrics;
  private eventHistory: OptimizationEvent[] = [];
  private isRunning: boolean = false;
  private optimizationInterval?: NodeJS.Timeout;
  private trafficAllocationInterval?: NodeJS.Timeout; // NEW: Traffic allocation timer

  constructor(config: Partial<OptimizationSystemConfig> = {}) {
    this.config = {
      projectName: "matbakh-ai-optimization",
      region: "eu-central-1",
      autoExperimentEnabled: true,
      experimentDuration: 14, // 2 weeks
      minTrafficForExperiment: 100, // 100 requests per day
      significanceThreshold: 0.95,
      autoStopEnabled: true,
      autoTrafficAllocationEnabled: true, // NEW: Enable automatic traffic allocation
      trafficAllocationInterval: 15, // NEW: Update traffic allocation every 15 minutes
      performanceThresholds: {
        minWinRate: 0.7,
        maxLatency: 2000,
        maxCost: 0.1,
      },
      ...config,
    };

    // Initialize components
    const bandit = new ThompsonBandit();
    this.experimentManager = new EvidentlyExperimentManager(
      this.config.projectName,
      this.config.region,
      bandit
    );
    this.banditOptimizer = new BanditOptimizer(bandit, this.experimentManager, {
      autoOptimizationEnabled: true,
      explorationRate: 0.15,
      minTrialsForConfidence: 30,
      optimizationInterval: 60, // 1 hour
    });

    this.metrics = {
      totalRequests: 0,
      experimentsActive: 0,
      banditPerformance: {
        bestArm: "bedrock",
        confidence: 0.5,
        winRate: 0.5,
      },
      systemHealth: "healthy",
      lastOptimization: new Date(),
      lastTrafficAllocation: new Date(), // NEW: Initialize traffic allocation timestamp
      currentTrafficAllocation: {
        // NEW: Initialize equal traffic allocation
        bedrock: 0.33,
        google: 0.33,
        meta: 0.34,
      },
      recommendations: [],
    };
  }

  /**
   * Start the active optimization system
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.warn("Optimization system is already running");
      return;
    }

    try {
      // Initialize Evidently project
      await this.experimentManager.initializeProject();

      // Start initial experiments if enabled
      if (this.config.autoExperimentEnabled) {
        await this.startInitialExperiments();
      }

      // Start optimization loop
      this.startOptimizationLoop();

      // Start automatic traffic allocation if enabled
      if (this.config.autoTrafficAllocationEnabled) {
        this.startTrafficAllocationLoop();
      }

      this.isRunning = true;
      this.logEvent({
        type: "auto_optimization",
        details: { action: "system_started", config: this.config },
        impact: "high",
      });

      console.log("Active Optimization System started successfully");
    } catch (error) {
      console.error("Failed to start optimization system:", error);
      throw error;
    }
  }

  /**
   * Stop the active optimization system
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    // Stop optimization loop
    if (this.optimizationInterval) {
      clearInterval(this.optimizationInterval);
      this.optimizationInterval = undefined;
    }

    // Stop traffic allocation loop
    if (this.trafficAllocationInterval) {
      clearInterval(this.trafficAllocationInterval);
      this.trafficAllocationInterval = undefined;
    }

    // Stop active experiments if auto-stop is enabled
    if (this.config.autoStopEnabled) {
      const activeExperiments =
        await this.experimentManager.listActiveExperiments();
      for (const experimentName of activeExperiments) {
        await this.experimentManager.stopExperiment(
          experimentName,
          "System shutdown"
        );
      }
    }

    this.isRunning = false;
    this.logEvent({
      type: "auto_optimization",
      details: { action: "system_stopped" },
      impact: "high",
    });

    console.log("Active Optimization System stopped");
  }

  /**
   * Get optimal model provider for a request
   */
  async getOptimalProvider(context: ExperimentContext): Promise<{
    provider: Arm;
    source: "experiment" | "bandit" | "traffic_allocation" | "default";
    confidence: number;
    experimentName?: string;
    allocationProbability?: number;
  }> {
    try {
      // Use the new traffic allocation method
      const result = await this.getOptimalProviderWithTrafficAllocation(
        context
      );

      // Update metrics
      this.metrics.totalRequests++;

      return result;
    } catch (error) {
      console.error("Failed to get optimal provider:", error);

      // Fallback to default
      return {
        provider: "bedrock",
        source: "default",
        confidence: 0.5,
      };
    }
  }

  /**
   * Record outcome and trigger optimization
   */
  async recordOutcome(
    context: ExperimentContext,
    provider: Arm,
    metrics: {
      success: boolean;
      latencyMs: number;
      costEuro: number;
      qualityScore?: number;
      userSatisfaction?: number;
    }
  ): Promise<void> {
    try {
      // Record in optimizer
      await this.banditOptimizer.recordOutcome(
        context,
        provider,
        metrics.success,
        metrics.latencyMs,
        metrics.costEuro,
        metrics.qualityScore
      );

      // Check for performance alerts
      await this.checkPerformanceAlerts(provider, metrics);

      // Update system metrics
      await this.updateSystemMetrics();
    } catch (error) {
      console.error("Failed to record outcome:", error);
    }
  }

  /**
   * Get current system metrics
   */
  getMetrics(): SystemMetrics {
    return { ...this.metrics };
  }

  /**
   * Get optimization event history
   */
  getEventHistory(limit: number = 100): OptimizationEvent[] {
    return this.eventHistory.slice(-limit);
  }

  /**
   * Force optimization cycle
   */
  async forceOptimization(): Promise<void> {
    await this.runOptimizationCycle();
  }

  /**
   * Get system health status
   */
  async getHealthStatus(): Promise<{
    system: "healthy" | "warning" | "error";
    components: {
      experiments: "healthy" | "warning" | "error";
      bandit: "healthy" | "warning" | "error";
      optimization: "healthy" | "warning" | "error";
    };
    details: Record<string, any>;
  }> {
    try {
      const [experimentHealth, banditHealth] = await Promise.all([
        this.experimentManager.healthCheck(),
        Promise.resolve(this.banditOptimizer.healthCheck()),
      ]);

      const components = {
        experiments: experimentHealth.connected
          ? ("healthy" as const)
          : ("error" as const),
        bandit: banditHealth.status,
        optimization: this.isRunning
          ? ("healthy" as const)
          : ("warning" as const),
      };

      const systemHealth = Object.values(components).includes("error")
        ? "error"
        : Object.values(components).includes("warning")
        ? "warning"
        : "healthy";

      return {
        system: systemHealth,
        components,
        details: {
          experimentHealth,
          banditHealth,
          isRunning: this.isRunning,
          totalRequests: this.metrics.totalRequests,
          lastOptimization: this.metrics.lastOptimization,
        },
      };
    } catch (error) {
      return {
        system: "error",
        components: {
          experiments: "error",
          bandit: "error",
          optimization: "error",
        },
        details: { error: error.message },
      };
    }
  }

  /**
   * Start initial experiments
   */
  private async startInitialExperiments(): Promise<void> {
    try {
      // Start model routing optimization experiment
      const routingExperiment = AI_EXPERIMENTS.MODEL_ROUTING_OPTIMIZATION;
      await this.experimentManager.createAIExperiment(routingExperiment);
      await this.experimentManager.startExperiment(routingExperiment.name);

      this.logEvent({
        type: "experiment_started",
        details: {
          experimentName: routingExperiment.name,
          type: "model_routing",
        },
        impact: "medium",
      });

      // Start domain-specific routing experiment
      const domainExperiment = AI_EXPERIMENTS.DOMAIN_SPECIFIC_ROUTING;
      await this.experimentManager.createAIExperiment(domainExperiment);
      await this.experimentManager.startExperiment(domainExperiment.name);

      this.logEvent({
        type: "experiment_started",
        details: {
          experimentName: domainExperiment.name,
          type: "domain_specific",
        },
        impact: "medium",
      });

      console.log("Initial experiments started successfully");
    } catch (error) {
      console.error("Failed to start initial experiments:", error);
    }
  }

  /**
   * Start optimization loop
   */
  private startOptimizationLoop(): void {
    this.optimizationInterval = setInterval(async () => {
      await this.runOptimizationCycle();
    }, 30 * 60 * 1000); // Every 30 minutes
  }

  /**
   * Start automatic traffic allocation loop
   */
  private startTrafficAllocationLoop(): void {
    this.trafficAllocationInterval = setInterval(async () => {
      await this.updateTrafficAllocation();
    }, this.config.trafficAllocationInterval * 60 * 1000); // Convert minutes to ms
  }

  /**
   * Run a single optimization cycle
   */
  private async runOptimizationCycle(): Promise<void> {
    try {
      console.log("Running optimization cycle...");

      // Update system metrics
      await this.updateSystemMetrics();

      // Check for experiment completion
      await this.checkExperimentCompletion();

      // Get optimization recommendations
      const recommendations =
        this.banditOptimizer.getOptimizationRecommendations();
      this.metrics.recommendations = recommendations.map((r) => r.description);

      // Apply automatic optimizations
      await this.applyAutoOptimizations(recommendations);

      // Check if new experiments should be started
      if (this.config.autoExperimentEnabled) {
        await this.checkForNewExperiments();
      }

      this.metrics.lastOptimization = new Date();

      this.logEvent({
        type: "auto_optimization",
        details: {
          recommendations: recommendations.length,
          systemHealth: this.metrics.systemHealth,
        },
        impact: "low",
      });
    } catch (error) {
      console.error("Error in optimization cycle:", error);
      this.metrics.systemHealth = "error";
    }
  }

  /**
   * Update system metrics
   */
  private async updateSystemMetrics(): Promise<void> {
    try {
      // Get active experiments count
      const activeExperiments =
        await this.experimentManager.listActiveExperiments();
      this.metrics.experimentsActive = activeExperiments.length;

      // Get bandit performance
      const banditStats = this.banditOptimizer.getBanditStats();
      const bestArm = Object.entries(banditStats).reduce(
        (best, [arm, stats]) => {
          return stats.winRate > best.stats.winRate
            ? { arm: arm as Arm, stats }
            : best;
        },
        { arm: "bedrock" as Arm, stats: banditStats.bedrock }
      );

      this.metrics.banditPerformance = {
        bestArm: bestArm.arm,
        confidence:
          bestArm.stats.trials > 30
            ? Math.min(0.95, bestArm.stats.winRate + 0.1)
            : 0.5,
        winRate: bestArm.stats.winRate,
      };

      // Update system health
      const health = await this.getHealthStatus();
      this.metrics.systemHealth = health.system;
    } catch (error) {
      console.error("Failed to update system metrics:", error);
      this.metrics.systemHealth = "error";
    }
  }

  /**
   * Check for performance alerts
   */
  private async checkPerformanceAlerts(
    provider: Arm,
    metrics: {
      success: boolean;
      latencyMs: number;
      costEuro: number;
      qualityScore?: number;
    }
  ): Promise<void> {
    const { performanceThresholds } = this.config;
    const alerts = [];

    // Check latency
    if (metrics.latencyMs > performanceThresholds.maxLatency) {
      alerts.push(
        `High latency: ${metrics.latencyMs}ms > ${performanceThresholds.maxLatency}ms`
      );
    }

    // Check cost
    if (metrics.costEuro > performanceThresholds.maxCost) {
      alerts.push(
        `High cost: €${metrics.costEuro} > €${performanceThresholds.maxCost}`
      );
    }

    // Check success rate (approximate)
    const banditStats = this.banditOptimizer.getBanditStats();
    const providerStats = banditStats[provider];
    if (
      providerStats.winRate < performanceThresholds.minWinRate &&
      providerStats.trials > 10
    ) {
      alerts.push(
        `Low win rate: ${(providerStats.winRate * 100).toFixed(1)}% < ${(
          performanceThresholds.minWinRate * 100
        ).toFixed(1)}%`
      );
    }

    // Log alerts
    if (alerts.length > 0) {
      this.logEvent({
        type: "performance_alert",
        details: { provider, alerts, metrics },
        impact: "medium",
      });

      console.warn(`Performance alerts for ${provider}:`, alerts);
    }
  }

  /**
   * Check for experiment completion
   */
  private async checkExperimentCompletion(): Promise<void> {
    try {
      const activeExperiments =
        await this.experimentManager.listActiveExperiments();

      for (const experimentName of activeExperiments) {
        const result = await this.experimentManager.analyzeExperimentResults(
          experimentName
        );

        if (
          result?.recommendation &&
          result.recommendation.confidence > this.config.significanceThreshold
        ) {
          // High confidence result found
          if (this.config.autoStopEnabled) {
            await this.experimentManager.stopExperiment(
              experimentName,
              `Auto-stop: High confidence winner (${result.recommendation.confidence})`
            );

            this.logEvent({
              type: "experiment_stopped",
              details: {
                experimentName,
                winner: result.recommendation.winningTreatment,
                confidence: result.recommendation.confidence,
                reason: "auto_stop_high_confidence",
              },
              impact: "high",
            });
          }
        }
      }
    } catch (error) {
      console.error("Failed to check experiment completion:", error);
    }
  }

  /**
   * Apply automatic optimizations
   */
  private async applyAutoOptimizations(
    recommendations: ReturnType<
      BanditOptimizer["getOptimizationRecommendations"]
    >
  ): Promise<void> {
    const highPriorityRecs = recommendations.filter(
      (r) => r.priority === "high"
    );

    for (const rec of highPriorityRecs) {
      try {
        if (rec.type === "exploration") {
          // Increase exploration temporarily
          const currentConfig = this.banditOptimizer.getConfig();
          this.banditOptimizer.updateConfig({
            explorationRate: Math.min(0.3, currentConfig.explorationRate * 1.5),
          });

          this.logEvent({
            type: "auto_optimization",
            details: {
              action: "increased_exploration",
              newRate: this.banditOptimizer.getConfig().explorationRate,
            },
            impact: "medium",
          });

          // Reset after 2 hours
          setTimeout(() => {
            this.banditOptimizer.updateConfig({
              explorationRate: Math.max(0.05, currentConfig.explorationRate),
            });
          }, 2 * 60 * 60 * 1000);
        }
      } catch (error) {
        console.error(`Failed to apply optimization: ${rec.type}`, error);
      }
    }
  }

  /**
   * Check if new experiments should be started
   */
  private async checkForNewExperiments(): Promise<void> {
    try {
      // Only start new experiments if traffic is sufficient
      if (this.metrics.totalRequests < this.config.minTrafficForExperiment) {
        return;
      }

      const activeExperiments =
        await this.experimentManager.listActiveExperiments();

      // Don't start too many experiments at once
      if (activeExperiments.length >= 2) {
        return;
      }

      // Check if we should start context-specific experiments
      const contextualPerformance =
        this.banditOptimizer.analyzeContextualPerformance();
      const promisingContexts = contextualPerformance.filter(
        (ctx) =>
          ctx.improvement > 0.2 && ctx.armPerformance[ctx.bestArm].trials > 50
      );

      if (promisingContexts.length > 0) {
        // Could implement context-specific experiment creation here
        console.log(
          "Promising contexts found for new experiments:",
          promisingContexts.map((c) => c.context)
        );
      }
    } catch (error) {
      console.error("Failed to check for new experiments:", error);
    }
  }

  /**
   * Log optimization event
   */
  private logEvent(event: Omit<OptimizationEvent, "timestamp">): void {
    const fullEvent: OptimizationEvent = {
      timestamp: new Date(),
      ...event,
    };

    this.eventHistory.push(fullEvent);

    // Keep only last 1000 events
    if (this.eventHistory.length > 1000) {
      this.eventHistory = this.eventHistory.slice(-1000);
    }

    // Log high impact events
    if (event.impact === "high") {
      console.log(`[OPTIMIZATION] ${event.type}:`, event.details);
    }
  }

  /**
   * Get configuration
   */
  getConfig(): OptimizationSystemConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<OptimizationSystemConfig>): void {
    this.config = { ...this.config, ...updates };

    this.logEvent({
      type: "auto_optimization",
      details: { action: "config_updated", updates },
      impact: "medium",
    });
  }

  /**
   * Update traffic allocation automatically based on performance
   */
  private async updateTrafficAllocation(): Promise<void> {
    try {
      console.log("Updating automatic traffic allocation...");

      const banditStats = this.banditOptimizer.getBanditStats();
      const contextualPerformance =
        this.banditOptimizer.analyzeContextualPerformance();

      // Calculate performance scores for each arm
      const armScores = this.calculateArmPerformanceScores(banditStats);

      // Calculate new traffic allocation based on performance
      const newAllocation = this.calculateOptimalTrafficAllocation(
        armScores,
        banditStats
      );

      // Apply smoothing to prevent dramatic changes
      const smoothedAllocation = this.smoothTrafficAllocation(
        this.metrics.currentTrafficAllocation,
        newAllocation
      );

      // Update traffic allocation
      const previousAllocation = { ...this.metrics.currentTrafficAllocation };
      this.metrics.currentTrafficAllocation = smoothedAllocation;
      this.metrics.lastTrafficAllocation = new Date();

      // Log the change
      this.logEvent({
        type: "traffic_allocation_updated",
        details: {
          previousAllocation,
          newAllocation: smoothedAllocation,
          armScores,
          reason: "automatic_performance_optimization",
        },
        impact: "medium",
      });

      console.log("Traffic allocation updated:", {
        previous: previousAllocation,
        new: smoothedAllocation,
        scores: armScores,
      });
    } catch (error) {
      console.error("Failed to update traffic allocation:", error);

      this.logEvent({
        type: "traffic_allocation_updated",
        details: {
          error: error.message,
          reason: "allocation_update_failed",
        },
        impact: "high",
      });
    }
  }

  /**
   * Calculate performance scores for each arm
   */
  private calculateArmPerformanceScores(
    banditStats: Record<Arm, any>
  ): Record<Arm, number> {
    const scores: Record<Arm, number> = {} as any;

    (Object.keys(banditStats) as Arm[]).forEach((arm) => {
      const stats = banditStats[arm];

      if (stats.trials === 0) {
        // No data yet, give neutral score
        scores[arm] = 0.5;
        return;
      }

      // Composite score based on multiple factors
      const winRateScore = stats.winRate; // 0-1
      const latencyScore = Math.max(0, 1 - stats.avgLatency / 3000); // Normalize to 0-1, 3s = 0
      const costScore = Math.max(0, 1 - stats.avgCost / 0.2); // Normalize to 0-1, €0.2 = 0
      const confidenceScore = Math.min(1, stats.trials / 50); // More trials = higher confidence

      // Weighted composite score
      scores[arm] =
        winRateScore * 0.4 + // 40% win rate
        latencyScore * 0.3 + // 30% latency
        costScore * 0.2 + // 20% cost
        confidenceScore * 0.1; // 10% confidence
    });

    return scores;
  }

  /**
   * Calculate optimal traffic allocation based on performance scores
   */
  private calculateOptimalTrafficAllocation(
    armScores: Record<Arm, number>,
    banditStats: Record<Arm, any>
  ): Record<Arm, number> {
    const arms: Arm[] = ["bedrock", "google", "meta"];
    const allocation: Record<Arm, number> = {} as any;

    // Get total score
    const totalScore = arms.reduce((sum, arm) => sum + armScores[arm], 0);

    if (totalScore === 0) {
      // No performance data, use equal allocation
      arms.forEach((arm) => {
        allocation[arm] = 1 / arms.length;
      });
      return allocation;
    }

    // Calculate base allocation based on performance scores
    arms.forEach((arm) => {
      allocation[arm] = armScores[arm] / totalScore;
    });

    // Apply exploration bonus for under-explored arms
    const minTrials = Math.min(...arms.map((arm) => banditStats[arm].trials));
    const maxTrials = Math.max(...arms.map((arm) => banditStats[arm].trials));

    if (maxTrials > 0) {
      arms.forEach((arm) => {
        const trials = banditStats[arm].trials;
        const explorationBonus = (maxTrials - trials) / (maxTrials * 10); // Small bonus for under-explored arms
        allocation[arm] += explorationBonus;
      });
    }

    // Ensure minimum allocation for each arm (at least 5%)
    const minAllocation = 0.05;
    arms.forEach((arm) => {
      allocation[arm] = Math.max(minAllocation, allocation[arm]);
    });

    // Normalize to ensure sum = 1
    const sum = arms.reduce((total, arm) => total + allocation[arm], 0);
    arms.forEach((arm) => {
      allocation[arm] = allocation[arm] / sum;
    });

    return allocation;
  }

  /**
   * Apply smoothing to prevent dramatic traffic allocation changes
   */
  private smoothTrafficAllocation(
    currentAllocation: Record<Arm, number>,
    targetAllocation: Record<Arm, number>,
    smoothingFactor: number = 0.3 // How much to move toward target (0-1)
  ): Record<Arm, number> {
    const smoothedAllocation: Record<Arm, number> = {} as any;

    (Object.keys(currentAllocation) as Arm[]).forEach((arm) => {
      const current = currentAllocation[arm];
      const target = targetAllocation[arm];

      // Move toward target by smoothingFactor
      smoothedAllocation[arm] = current + (target - current) * smoothingFactor;
    });

    // Normalize to ensure sum = 1
    const sum = Object.values(smoothedAllocation).reduce(
      (total, val) => total + val,
      0
    );
    (Object.keys(smoothedAllocation) as Arm[]).forEach((arm) => {
      smoothedAllocation[arm] = smoothedAllocation[arm] / sum;
    });

    return smoothedAllocation;
  }

  /**
   * Get optimal provider with automatic traffic allocation
   */
  async getOptimalProviderWithTrafficAllocation(
    context: ExperimentContext
  ): Promise<{
    provider: Arm;
    source: "experiment" | "bandit" | "traffic_allocation" | "default";
    confidence: number;
    experimentName?: string;
    allocationProbability?: number;
  }> {
    try {
      // First check for active experiments
      if (this.experimentManager) {
        try {
          const experimentResult =
            await this.experimentManager.getOptimalProvider(context);
          if (experimentResult.source === "experiment") {
            return {
              provider: experimentResult.provider,
              source: "experiment",
              confidence: experimentResult.confidence,
              experimentName: experimentResult.experimentName,
            };
          }
        } catch (error) {
          console.warn(
            "Failed to get experiment assignment, falling back to traffic allocation:",
            error
          );
        }
      }

      // Use automatic traffic allocation if enabled
      if (this.config.autoTrafficAllocationEnabled) {
        const selectedArm = this.selectArmByTrafficAllocation();
        const allocationProbability =
          this.metrics.currentTrafficAllocation[selectedArm];

        return {
          provider: selectedArm,
          source: "traffic_allocation",
          confidence: Math.min(0.95, allocationProbability + 0.2), // Higher allocation = higher confidence
          allocationProbability,
        };
      }

      // Fall back to bandit optimization
      const result = await this.banditOptimizer.getOptimalArm(context);
      return {
        provider: result.recommendedArm,
        source: "bandit",
        confidence: result.confidence,
      };
    } catch (error) {
      console.error("Failed to get optimal provider:", error);
      return {
        provider: "bedrock",
        source: "default",
        confidence: 0.5,
      };
    }
  }

  /**
   * Select arm based on current traffic allocation probabilities
   */
  private selectArmByTrafficAllocation(): Arm {
    const random = Math.random();
    let cumulativeProbability = 0;

    const arms: Arm[] = ["bedrock", "google", "meta"];

    for (const arm of arms) {
      cumulativeProbability += this.metrics.currentTrafficAllocation[arm];
      if (random <= cumulativeProbability) {
        return arm;
      }
    }

    // Fallback (should not happen with proper normalization)
    return "bedrock";
  }

  /**
   * Force traffic allocation update
   */
  async forceTrafficAllocationUpdate(): Promise<void> {
    await this.updateTrafficAllocation();
  }

  /**
   * Get current traffic allocation
   */
  getCurrentTrafficAllocation(): Record<Arm, number> {
    return { ...this.metrics.currentTrafficAllocation };
  }

  /**
   * Export system state for persistence
   */
  exportState(): {
    config: OptimizationSystemConfig;
    metrics: SystemMetrics;
    banditState: ReturnType<BanditOptimizer["exportState"]>;
    eventHistory: OptimizationEvent[];
  } {
    return {
      config: this.config,
      metrics: this.metrics,
      banditState: this.banditOptimizer.exportState(),
      eventHistory: this.eventHistory,
    };
  }
}

// Singleton instance for global use
let globalOptimizationSystem: ActiveOptimizationSystem | null = null;

/**
 * Get or create the global optimization system
 */
export function getOptimizationSystem(
  config?: Partial<OptimizationSystemConfig>
): ActiveOptimizationSystem {
  if (!globalOptimizationSystem) {
    globalOptimizationSystem = new ActiveOptimizationSystem(config);
  }
  return globalOptimizationSystem;
}

/**
 * Initialize and start the global optimization system
 */
export async function initializeOptimizationSystem(
  config?: Partial<OptimizationSystemConfig>
): Promise<ActiveOptimizationSystem> {
  const system = getOptimizationSystem(config);

  if (!system["isRunning"]) {
    await system.start();
  }

  return system;
}

/**
 * Shutdown the global optimization system
 */
export async function shutdownOptimizationSystem(): Promise<void> {
  if (globalOptimizationSystem) {
    await globalOptimizationSystem.stop();
    globalOptimizationSystem = null;
  }
}
