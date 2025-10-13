/**
 * Experiment Win Rate Service
 *
 * Service for tracking experiment performance, win rates, and cost impact
 */

export interface ExperimentData {
  id: string;
  name: string;
  description: string;
  status: "draft" | "running" | "paused" | "completed" | "failed";
  type: "ab_test" | "multivariate" | "feature_flag" | "bandit";
  createdAt: Date;
  startedAt?: Date;
  endedAt?: Date;
  variants: ExperimentVariant[];
  trafficSplit: Record<string, number>;
  participants: number;
  targetMetric: string;
  successCriteria: {
    metric: string;
    operator: "gt" | "lt" | "gte" | "lte" | "eq";
    value: number;
    confidenceLevel: number;
  };
  metadata: Record<string, any>;
  tags: string[];
}

export interface ExperimentVariant {
  id: string;
  name: string;
  description: string;
  traffic: number;
  config: Record<string, any>;
  isControl: boolean;
}

export interface WinRateData {
  experimentId: string;
  variantId: string;
  rate: number;
  confidence: number;
  sampleSize: number;
  conversions: number;
  timestamp: Date;
  trend: "improving" | "stable" | "degrading";
  statisticalSignificance: boolean;
  pValue: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
}

export interface CostImpactData {
  experimentId: string;
  variantId: string;
  impact: number; // in euros
  costPerConversion: number;
  totalCost: number;
  costSavings: number;
  roi: number;
  timestamp: Date;
  breakdown: {
    infrastructure: number;
    aiProviders: number;
    storage: number;
    networking: number;
    other: number;
  };
}

export interface ExperimentMetrics {
  experimentId: string;
  metrics: {
    [metricName: string]: {
      value: number;
      variance: number;
      sampleSize: number;
      timestamp: Date;
    };
  };
  aggregatedMetrics: {
    totalParticipants: number;
    conversionRate: number;
    averageOrderValue: number;
    revenue: number;
    cost: number;
    roi: number;
  };
}

export interface ExperimentReport {
  experimentId: string;
  experiment: ExperimentData;
  period: {
    start: Date;
    end: Date;
  };
  summary: {
    status: string;
    duration: number; // in days
    participants: number;
    winningVariant: string | null;
    liftPercentage: number;
    statisticalSignificance: boolean;
    confidenceLevel: number;
  };
  variants: Array<{
    variantId: string;
    name: string;
    traffic: number;
    participants: number;
    winRate: number;
    costImpact: number;
    metrics: Record<string, number>;
  }>;
  recommendations: string[];
  nextSteps: string[];
}

class ExperimentWinRateService {
  private experiments: Map<string, ExperimentData> = new Map();
  private winRates: Map<string, WinRateData[]> = new Map();
  private costImpacts: Map<string, CostImpactData[]> = new Map();
  private metrics: Map<string, ExperimentMetrics> = new Map();
  private eventListeners: Map<string, Function[]> = new Map();

  constructor() {
    this.initializeMockData();
  }

  /**
   * Initialize with mock data for development
   */
  private initializeMockData() {
    // Mock experiments
    const mockExperiments: ExperimentData[] = [
      {
        id: "exp-001",
        name: "AI Provider Routing Optimization",
        description:
          "A/B test comparing different AI provider routing strategies",
        status: "running",
        type: "ab_test",
        createdAt: new Date("2024-01-15"),
        startedAt: new Date("2024-01-20"),
        variants: [
          {
            id: "control",
            name: "Current Routing",
            description: "Existing provider routing logic",
            traffic: 50,
            config: { strategy: "round_robin" },
            isControl: true,
          },
          {
            id: "optimized",
            name: "Optimized Routing",
            description: "ML-based provider routing",
            traffic: 50,
            config: { strategy: "ml_optimized" },
            isControl: false,
          },
        ],
        trafficSplit: { control: 50, optimized: 50 },
        participants: 1250,
        targetMetric: "response_time",
        successCriteria: {
          metric: "response_time",
          operator: "lt",
          value: 1000,
          confidenceLevel: 95,
        },
        metadata: { team: "ai-platform", priority: "high" },
        tags: ["ai", "performance", "routing"],
      },
      {
        id: "exp-002",
        name: "Cache Hit Rate Optimization",
        description:
          "Testing different caching strategies for improved hit rates",
        status: "running",
        type: "multivariate",
        createdAt: new Date("2024-01-10"),
        startedAt: new Date("2024-01-15"),
        variants: [
          {
            id: "control",
            name: "Standard Cache",
            description: "Current caching implementation",
            traffic: 33,
            config: { strategy: "lru", ttl: 3600 },
            isControl: true,
          },
          {
            id: "adaptive",
            name: "Adaptive Cache",
            description: "Adaptive TTL based on usage patterns",
            traffic: 33,
            config: { strategy: "adaptive", ttl: "dynamic" },
            isControl: false,
          },
          {
            id: "predictive",
            name: "Predictive Cache",
            description: "ML-based cache preloading",
            traffic: 34,
            config: { strategy: "predictive", preload: true },
            isControl: false,
          },
        ],
        trafficSplit: { control: 33, adaptive: 33, predictive: 34 },
        participants: 890,
        targetMetric: "cache_hit_rate",
        successCriteria: {
          metric: "cache_hit_rate",
          operator: "gt",
          value: 0.8,
          confidenceLevel: 95,
        },
        metadata: { team: "performance", priority: "medium" },
        tags: ["cache", "performance", "optimization"],
      },
      {
        id: "exp-003",
        name: "Cost Optimization Bandit",
        description: "Multi-armed bandit for cost-performance optimization",
        status: "running",
        type: "bandit",
        createdAt: new Date("2024-01-05"),
        startedAt: new Date("2024-01-08"),
        variants: [
          {
            id: "cost_optimized",
            name: "Cost Optimized",
            description: "Prioritize cost savings",
            traffic: 25,
            config: { weight_cost: 0.7, weight_performance: 0.3 },
            isControl: false,
          },
          {
            id: "performance_optimized",
            name: "Performance Optimized",
            description: "Prioritize performance",
            traffic: 25,
            config: { weight_cost: 0.3, weight_performance: 0.7 },
            isControl: false,
          },
          {
            id: "balanced",
            name: "Balanced",
            description: "Balance cost and performance",
            traffic: 25,
            config: { weight_cost: 0.5, weight_performance: 0.5 },
            isControl: true,
          },
          {
            id: "adaptive_bandit",
            name: "Adaptive Bandit",
            description: "Thompson sampling optimization",
            traffic: 25,
            config: { strategy: "thompson_sampling" },
            isControl: false,
          },
        ],
        trafficSplit: {
          cost_optimized: 25,
          performance_optimized: 25,
          balanced: 25,
          adaptive_bandit: 25,
        },
        participants: 2100,
        targetMetric: "cost_per_request",
        successCriteria: {
          metric: "cost_per_request",
          operator: "lt",
          value: 0.05,
          confidenceLevel: 90,
        },
        metadata: { team: "cost-optimization", priority: "high" },
        tags: ["cost", "bandit", "optimization"],
      },
    ];

    // Store mock experiments
    mockExperiments.forEach((exp) => this.experiments.set(exp.id, exp));

    // Mock win rates
    this.generateMockWinRates();
    this.generateMockCostImpacts();
  }

  /**
   * Generate mock win rate data
   */
  private generateMockWinRates() {
    const experiments = Array.from(this.experiments.values());

    experiments.forEach((experiment) => {
      const winRates: WinRateData[] = experiment.variants.map((variant) => ({
        experimentId: experiment.id,
        variantId: variant.id,
        rate: this.generateWinRate(variant.isControl),
        confidence: Math.random() * 20 + 80, // 80-100%
        sampleSize: Math.floor(
          experiment.participants * (variant.traffic / 100)
        ),
        conversions: Math.floor(
          experiment.participants *
            (variant.traffic / 100) *
            Math.random() *
            0.3
        ),
        timestamp: new Date(),
        trend: ["improving", "stable", "degrading"][
          Math.floor(Math.random() * 3)
        ] as any,
        statisticalSignificance: Math.random() > 0.3,
        pValue: Math.random() * 0.1,
        confidenceInterval: {
          lower: Math.random() * 10 + 40,
          upper: Math.random() * 10 + 60,
        },
      }));

      this.winRates.set(experiment.id, winRates);
    });
  }

  /**
   * Generate mock cost impact data
   */
  private generateMockCostImpacts() {
    const experiments = Array.from(this.experiments.values());

    experiments.forEach((experiment) => {
      const costImpacts: CostImpactData[] = experiment.variants.map(
        (variant) => {
          const baseCost = Math.random() * 100 + 50; // 50-150€
          const impact = variant.isControl ? 0 : (Math.random() - 0.5) * 50; // -25 to +25€

          return {
            experimentId: experiment.id,
            variantId: variant.id,
            impact,
            costPerConversion: baseCost / Math.max(1, Math.random() * 10),
            totalCost: baseCost + impact,
            costSavings: -impact,
            roi: (Math.random() - 0.5) * 200, // -100% to +100%
            timestamp: new Date(),
            breakdown: {
              infrastructure: (baseCost + impact) * 0.4,
              aiProviders: (baseCost + impact) * 0.3,
              storage: (baseCost + impact) * 0.1,
              networking: (baseCost + impact) * 0.1,
              other: (baseCost + impact) * 0.1,
            },
          };
        }
      );

      this.costImpacts.set(experiment.id, costImpacts);
    });
  }

  /**
   * Generate realistic win rate based on variant type
   */
  private generateWinRate(isControl: boolean): number {
    if (isControl) {
      return Math.random() * 20 + 40; // 40-60% for control
    } else {
      return Math.random() * 30 + 45; // 45-75% for variants (potentially better)
    }
  }

  /**
   * Get all experiments
   */
  getAllExperiments(): ExperimentData[] {
    return Array.from(this.experiments.values());
  }

  /**
   * Get experiments by IDs
   */
  getExperimentsByIds(experimentIds: string[]): ExperimentData[] {
    return experimentIds
      .map((id) => this.experiments.get(id))
      .filter((exp): exp is ExperimentData => exp !== undefined);
  }

  /**
   * Get experiment by ID
   */
  getExperiment(experimentId: string): ExperimentData | undefined {
    return this.experiments.get(experimentId);
  }

  /**
   * Get win rates for experiments
   */
  getWinRates(experimentIds?: string[]): WinRateData[] {
    const ids = experimentIds ?? Array.from(this.experiments.keys());
    const allWinRates: WinRateData[] = [];

    ids.forEach((id) => {
      const winRates = this.winRates.get(id);
      if (winRates) {
        allWinRates.push(...winRates);
      }
    });

    return allWinRates;
  }

  /**
   * Get cost impact for experiments
   */
  getCostImpact(experimentIds?: string[]): CostImpactData[] {
    const ids = experimentIds ?? Array.from(this.experiments.keys());
    const allCostImpacts: CostImpactData[] = [];

    ids.forEach((id) => {
      const costImpacts = this.costImpacts.get(id);
      if (costImpacts) {
        allCostImpacts.push(...costImpacts);
      }
    });

    return allCostImpacts;
  }

  /**
   * Start an experiment
   */
  startExperiment(experimentId: string): boolean {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) return false;

    experiment.status = "running";
    experiment.startedAt = new Date();

    this.emit("experiment:updated", { experimentId, status: "running" });
    return true;
  }

  /**
   * Stop an experiment
   */
  stopExperiment(experimentId: string): boolean {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) return false;

    experiment.status = "completed";
    experiment.endedAt = new Date();

    this.emit("experiment:updated", { experimentId, status: "completed" });
    return true;
  }

  /**
   * Update traffic split for an experiment
   */
  updateTrafficSplit(
    experimentId: string,
    trafficSplit: Record<string, number>
  ): boolean {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) return false;

    // Validate traffic split sums to 100
    const totalTraffic = Object.values(trafficSplit).reduce(
      (sum, traffic) => sum + traffic,
      0
    );
    if (Math.abs(totalTraffic - 100) > 0.01) return false;

    experiment.trafficSplit = trafficSplit;

    // Update variant traffic
    experiment.variants.forEach((variant) => {
      if (trafficSplit[variant.id] !== undefined) {
        variant.traffic = trafficSplit[variant.id];
      }
    });

    this.emit("experiment:updated", { experimentId, trafficSplit });
    return true;
  }

  /**
   * Generate experiment report
   */
  generateReport(
    experimentId: string,
    startDate?: Date,
    endDate?: Date
  ): ExperimentReport | null {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) return null;

    const winRates = this.winRates.get(experimentId) || [];
    const costImpacts = this.costImpacts.get(experimentId) || [];

    // Find winning variant (highest win rate)
    const sortedWinRates = [...winRates].sort((a, b) => b.rate - a.rate);
    const winningVariant = sortedWinRates[0];
    const controlVariant = winRates.find(
      (wr) => experiment.variants.find((v) => v.id === wr.variantId)?.isControl
    );

    const liftPercentage =
      controlVariant && winningVariant
        ? ((winningVariant.rate - controlVariant.rate) / controlVariant.rate) *
          100
        : 0;

    return {
      experimentId,
      experiment,
      period: {
        start: startDate || experiment.startedAt || experiment.createdAt,
        end: endDate || experiment.endedAt || new Date(),
      },
      summary: {
        status: experiment.status,
        duration: experiment.startedAt
          ? Math.ceil(
              (new Date().getTime() - experiment.startedAt.getTime()) /
                (1000 * 60 * 60 * 24)
            )
          : 0,
        participants: experiment.participants,
        winningVariant: winningVariant?.variantId || null,
        liftPercentage,
        statisticalSignificance:
          winningVariant?.statisticalSignificance || false,
        confidenceLevel: winningVariant?.confidence || 0,
      },
      variants: experiment.variants.map((variant) => {
        const winRate = winRates.find((wr) => wr.variantId === variant.id);
        const costImpact = costImpacts.find(
          (ci) => ci.variantId === variant.id
        );

        return {
          variantId: variant.id,
          name: variant.name,
          traffic: variant.traffic,
          participants: Math.floor(
            experiment.participants * (variant.traffic / 100)
          ),
          winRate: winRate?.rate || 0,
          costImpact: costImpact?.impact || 0,
          metrics: {
            conversions: winRate?.conversions || 0,
            cost_per_conversion: costImpact?.costPerConversion || 0,
            roi: costImpact?.roi || 0,
          },
        };
      }),
      recommendations: this.generateRecommendations(
        experiment,
        winRates,
        costImpacts
      ),
      nextSteps: this.generateNextSteps(experiment, winRates, costImpacts),
    };
  }

  /**
   * Generate recommendations based on experiment results
   */
  private generateRecommendations(
    experiment: ExperimentData,
    winRates: WinRateData[],
    costImpacts: CostImpactData[]
  ): string[] {
    const recommendations: string[] = [];

    // Find best performing variant
    const sortedWinRates = [...winRates].sort((a, b) => b.rate - a.rate);
    const bestVariant = sortedWinRates[0];
    const controlVariant = winRates.find(
      (wr) => experiment.variants.find((v) => v.id === wr.variantId)?.isControl
    );

    if (bestVariant && controlVariant) {
      const improvement =
        ((bestVariant.rate - controlVariant.rate) / controlVariant.rate) * 100;

      if (improvement > 10 && bestVariant.statisticalSignificance) {
        recommendations.push(
          `Roll out variant "${
            bestVariant.variantId
          }" - shows ${improvement.toFixed(
            1
          )}% improvement with statistical significance`
        );
      } else if (improvement < -5) {
        recommendations.push(
          `Consider stopping the experiment - performance is degrading`
        );
      } else {
        recommendations.push(
          `Continue running the experiment - results are not yet conclusive`
        );
      }
    }

    // Cost recommendations
    const costImpact = costImpacts.reduce((sum, ci) => sum + ci.impact, 0);
    if (costImpact > 50) {
      recommendations.push(
        `High cost impact detected (+${costImpact.toFixed(
          2
        )}€) - consider cost optimization`
      );
    } else if (costImpact < -20) {
      recommendations.push(
        `Significant cost savings achieved (-${Math.abs(costImpact).toFixed(
          2
        )}€) - consider scaling`
      );
    }

    return recommendations;
  }

  /**
   * Generate next steps based on experiment results
   */
  private generateNextSteps(
    experiment: ExperimentData,
    winRates: WinRateData[],
    costImpacts: CostImpactData[]
  ): string[] {
    const nextSteps: string[] = [];

    if (experiment.status === "running") {
      nextSteps.push("Monitor experiment for statistical significance");
      nextSteps.push("Collect additional data points for confidence");
    } else if (experiment.status === "completed") {
      nextSteps.push("Analyze final results and prepare rollout plan");
      nextSteps.push("Document learnings and update best practices");
    }

    // Sample size recommendations
    const totalSampleSize = winRates.reduce(
      (sum, wr) => sum + wr.sampleSize,
      0
    );
    if (totalSampleSize < 1000) {
      nextSteps.push("Increase sample size for better statistical power");
    }

    return nextSteps;
  }

  /**
   * Event emitter functionality
   */
  on(event: string, callback: Function) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
    // wichtig: Unsubscribe zurückgeben
    return () => this.off(event, callback);
  }

  off(event: string, callback: Function) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => callback(data));
    }
  }
}

// Export singleton instance
export const experimentWinRateService = new ExperimentWinRateService();

export default experimentWinRateService;
