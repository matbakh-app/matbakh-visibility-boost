/**
 * CloudWatch Evidently Experiments Integration for AI Orchestrator
 *
 * Implements:
 * - A/B Testing for AI model routing
 * - Feature flags for gradual AI feature rollouts
 * - Automated experiment lifecycle management
 * - Integration with bandit optimization
 */

import {
  CloudWatchEvidentlyClient,
  CreateExperimentCommand,
  CreateFeatureCommand,
  CreateProjectCommand,
  EvaluateFeatureCommand,
  GetExperimentCommand,
  ListExperimentsCommand,
  PutProjectEventsCommand,
  StartExperimentCommand,
  StopExperimentCommand,
} from "@aws-sdk/client-evidently";
import { randomUUID } from "crypto";
import { Arm, BanditContext, ThompsonBandit } from "./bandit-controller";

export interface AIExperiment {
  name: string;
  description: string;
  feature: string;
  treatments: AITreatment[];
  metricGoals: AIMetricGoal[];
  trafficAllocation: number; // Percentage of traffic to include
  duration?: number; // Duration in days
  autoOptimize?: boolean; // Enable bandit optimization
}

export interface AITreatment {
  name: string;
  description: string;
  modelProvider: Arm;
  weight: number; // Initial traffic percentage
  configuration?: Record<string, any>;
}

export interface AIMetricGoal {
  metricName: string;
  desiredChange: "INCREASE" | "DECREASE";
  threshold?: number;
  priority: "HIGH" | "MEDIUM" | "LOW";
}

export interface ExperimentContext extends BanditContext {
  experimentName?: string;
  treatmentName?: string;
  sessionId?: string;
  requestId?: string;
}

export interface ExperimentResult {
  experimentName: string;
  status: "CREATED" | "UPDATING" | "RUNNING" | "COMPLETED" | "CANCELLED";
  startTime?: Date;
  endTime?: Date;
  results?: {
    treatment: string;
    modelProvider: Arm;
    metrics: {
      [metricName: string]: {
        value: number;
        improvement: number;
        confidence: number;
        statisticalSignificance: boolean;
      };
    };
  }[];
  recommendation?: {
    winningTreatment: string;
    confidence: number;
    expectedImprovement: number;
  };
}

export class EvidentlyExperimentManager {
  private client: CloudWatchEvidentlyClient;
  private projectName: string;
  private bandit: ThompsonBandit;
  private activeExperiments: Map<string, AIExperiment> = new Map();
  private experimentResults: Map<string, ExperimentResult> = new Map();

  constructor(
    projectName: string = "matbakh-ai-orchestrator",
    region: string = "eu-central-1",
    bandit?: ThompsonBandit
  ) {
    this.client = new CloudWatchEvidentlyClient({ region });
    this.projectName = projectName;
    this.bandit = bandit || new ThompsonBandit();
  }

  /**
   * Initialize the Evidently project for AI experiments
   */
  async initializeProject(): Promise<void> {
    try {
      await this.client.send(
        new CreateProjectCommand({
          name: this.projectName,
          description: "AI model routing experiments and optimization",
          tags: {
            Environment: process.env.NODE_ENV || "development",
            Purpose: "AIOptimization",
            Team: "AI",
          },
        })
      );
    } catch (error: any) {
      if (error.name !== "ResourceAlreadyExistsException") {
        throw error;
      }
    }
  }

  /**
   * Create a feature flag for AI model routing
   */
  async createAIFeature(
    featureName: string,
    description: string,
    providers: Arm[]
  ): Promise<void> {
    const variations = providers.map((provider) => ({
      name: provider,
      value: { stringValue: provider },
    }));

    await this.client.send(
      new CreateFeatureCommand({
        project: this.projectName,
        name: featureName,
        description,
        variations,
        defaultVariation: providers[0], // Default to first provider
        evaluationStrategy: "ALL_RULES",
        tags: {
          Type: "AIModelRouting",
          CreatedAt: new Date().toISOString(),
        },
      })
    );
  }

  /**
   * Create an A/B test experiment for AI model comparison
   */
  async createAIExperiment(experiment: AIExperiment): Promise<void> {
    // First create the feature if it doesn't exist
    const providers = experiment.treatments.map((t) => t.modelProvider);
    await this.createAIFeature(
      experiment.feature,
      `Feature for experiment: ${experiment.name}`,
      providers
    );

    // Create treatments for Evidently
    const treatments = experiment.treatments.map((treatment) => ({
      name: treatment.name,
      description: treatment.description,
      feature: experiment.feature,
      variation: treatment.modelProvider,
    }));

    // Create metric goals
    const metricGoals = experiment.metricGoals.map((goal) => ({
      metricName: goal.metricName,
      desiredChange: goal.desiredChange,
      valueKey: goal.metricName,
    }));

    await this.client.send(
      new CreateExperimentCommand({
        project: this.projectName,
        name: experiment.name,
        description: experiment.description,
        treatments,
        metricGoals,
        randomizationSalt: randomUUID(),
        samplingRate: experiment.trafficAllocation * 1000, // Convert to per-mille
        tags: {
          Type: "AIModelComparison",
          AutoOptimize: experiment.autoOptimize?.toString() || "false",
          Duration: experiment.duration?.toString() || "indefinite",
          CreatedAt: new Date().toISOString(),
        },
      })
    );

    // Store experiment for tracking
    this.activeExperiments.set(experiment.name, experiment);
  }

  /**
   * Get the optimal model provider using bandit + experiment data
   */
  async getOptimalProvider(context: ExperimentContext): Promise<{
    provider: Arm;
    source: "bandit" | "experiment" | "default";
    confidence: number;
    experimentName?: string;
  }> {
    // Check if there's an active experiment for this context
    if (context.experimentName) {
      const experiment = this.activeExperiments.get(context.experimentName);
      if (experiment) {
        try {
          // Evaluate the experiment feature
          const response = await this.client.send(
            new EvaluateFeatureCommand({
              project: this.projectName,
              feature: experiment.feature,
              entityId: context.userId || context.sessionId || randomUUID(),
              evaluationContext: JSON.stringify({
                domain: context.domain,
                budgetTier: context.budgetTier,
                requireTools: context.requireTools,
              }),
            })
          );

          if (response.variation && response.value?.stringValue) {
            const provider = response.value.stringValue as Arm;
            return {
              provider,
              source: "experiment",
              confidence: 0.8, // High confidence for experiment assignment
              experimentName: context.experimentName,
            };
          }
        } catch (error) {
          console.warn(`Failed to evaluate experiment feature: ${error}`);
        }
      }
    }

    // Fall back to bandit optimization
    const banditChoice = this.bandit.choose(context);
    const banditStats = this.bandit.getStats(context);
    const confidence =
      banditStats[banditChoice].trials > 10
        ? Math.min(0.95, banditStats[banditChoice].winRate + 0.1)
        : 0.5;

    return {
      provider: banditChoice,
      source: "bandit",
      confidence,
    };
  }

  /**
   * Record experiment outcome and update bandit
   */
  async recordExperimentOutcome(
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
    const { success, latencyMs, costEuro, qualityScore, userSatisfaction } =
      metrics;

    // Record in bandit for continuous learning
    this.bandit.record(provider, success, costEuro, latencyMs, context);

    // Record in Evidently for experiment tracking
    if (context.experimentName) {
      await this.recordExperimentMetrics(context, provider, {
        latency: latencyMs,
        cost: costEuro,
        success: success ? 1 : 0,
        quality: qualityScore || 0,
        satisfaction: userSatisfaction || 0,
      });
    }
  }

  /**
   * Record metrics to Evidently for experiment analysis
   */
  private async recordExperimentMetrics(
    context: ExperimentContext,
    provider: Arm,
    metrics: Record<string, number>
  ): Promise<void> {
    try {
      const events = Object.entries(metrics).map(([metricName, value]) => ({
        timestamp: new Date(),
        type: "aws.evidently.custom" as const,
        data: {
          details: JSON.stringify({
            metricName,
            value,
            provider,
            experimentName: context.experimentName,
            treatmentName: context.treatmentName,
            domain: context.domain,
            budgetTier: context.budgetTier,
            requireTools: context.requireTools,
            requestId: context.requestId,
          }),
        },
      }));

      await this.client.send(
        new PutProjectEventsCommand({
          project: this.projectName,
          events,
        })
      );
    } catch (error) {
      console.error("Failed to record experiment metrics:", error);
    }
  }

  /**
   * Start an experiment and begin auto-optimization
   */
  async startExperiment(experimentName: string): Promise<void> {
    await this.client.send(
      new StartExperimentCommand({
        project: this.projectName,
        experiment: experimentName,
      })
    );

    const experiment = this.activeExperiments.get(experimentName);
    if (experiment?.autoOptimize) {
      // Start auto-optimization process
      this.startAutoOptimization(experimentName);
    }
  }

  /**
   * Stop an experiment and apply winning treatment
   */
  async stopExperiment(
    experimentName: string,
    reason?: string
  ): Promise<ExperimentResult | null> {
    await this.client.send(
      new StopExperimentCommand({
        project: this.projectName,
        experiment: experimentName,
        reason,
      })
    );

    // Analyze results and get recommendation
    const result = await this.analyzeExperimentResults(experimentName);

    if (result?.recommendation) {
      // Apply winning treatment to bandit
      await this.applyWinningTreatment(experimentName, result.recommendation);
    }

    return result;
  }

  /**
   * Analyze experiment results and determine winner
   */
  async analyzeExperimentResults(
    experimentName: string
  ): Promise<ExperimentResult | null> {
    try {
      const response = await this.client.send(
        new GetExperimentCommand({
          project: this.projectName,
          experiment: experimentName,
        })
      );

      const experiment = response.experiment;
      if (!experiment) return null;

      // Get bandit stats for comparison
      const banditStats = this.bandit.getStats();

      // Analyze treatments
      const results =
        experiment.treatments?.map((treatment) => {
          const provider = treatment.variation as Arm;
          const stats = banditStats[provider];

          return {
            treatment: treatment.name || "",
            modelProvider: provider,
            metrics: {
              winRate: {
                value: stats.winRate,
                improvement: 0, // Calculate vs baseline
                confidence: stats.trials > 50 ? 0.95 : 0.7,
                statisticalSignificance: stats.trials > 100,
              },
              avgLatency: {
                value: stats.avgLatency,
                improvement: 0, // Calculate vs baseline
                confidence: stats.trials > 50 ? 0.95 : 0.7,
                statisticalSignificance: stats.trials > 100,
              },
              avgCost: {
                value: stats.avgCost,
                improvement: 0, // Calculate vs baseline
                confidence: stats.trials > 50 ? 0.95 : 0.7,
                statisticalSignificance: stats.trials > 100,
              },
            },
          };
        }) || [];

      // Determine winner based on composite score
      let winningTreatment = results[0];
      let bestScore = -1;

      results.forEach((result) => {
        // Composite score: win rate (60%) + latency improvement (25%) + cost efficiency (15%)
        const score =
          result.metrics.winRate.value * 0.6 +
          (1 / (result.metrics.avgLatency.value + 1)) * 0.25 +
          (1 / (result.metrics.avgCost.value + 0.01)) * 0.15;

        if (score > bestScore) {
          bestScore = score;
          winningTreatment = result;
        }
      });

      const experimentResult: ExperimentResult = {
        experimentName,
        status: experiment.status as any,
        startTime: experiment.createdTime,
        endTime: experiment.lastUpdatedTime,
        results,
        recommendation: {
          winningTreatment: winningTreatment.treatment,
          confidence: winningTreatment.metrics.winRate.confidence,
          expectedImprovement: bestScore,
        },
      };

      this.experimentResults.set(experimentName, experimentResult);
      return experimentResult;
    } catch (error) {
      console.error(`Failed to analyze experiment results: ${error}`);
      return null;
    }
  }

  /**
   * Apply winning treatment to bandit for future optimization
   */
  private async applyWinningTreatment(
    experimentName: string,
    recommendation: ExperimentResult["recommendation"]
  ): Promise<void> {
    if (!recommendation) return;

    const experiment = this.activeExperiments.get(experimentName);
    if (!experiment) return;

    // Find the winning treatment
    const winningTreatment = experiment.treatments.find(
      (t) => t.name === recommendation.winningTreatment
    );

    if (winningTreatment) {
      // Boost the winning provider in bandit
      const provider = winningTreatment.modelProvider;
      const boostAmount = Math.floor(recommendation.expectedImprovement * 10);

      // Add synthetic wins to boost the provider
      for (let i = 0; i < boostAmount; i++) {
        this.bandit.record(provider, true, 0.01, 100); // Low cost, fast response
      }

      console.log(
        `Applied winning treatment: ${winningTreatment.name} (${provider}) ` +
          `with ${boostAmount} synthetic wins`
      );
    }
  }

  /**
   * Start auto-optimization process for an experiment
   */
  private startAutoOptimization(experimentName: string): void {
    const experiment = this.activeExperiments.get(experimentName);
    if (!experiment) return;

    // Check experiment performance every hour
    const optimizationInterval = setInterval(async () => {
      try {
        const result = await this.analyzeExperimentResults(experimentName);

        if (result?.recommendation && result.recommendation.confidence > 0.9) {
          // High confidence winner found, consider early stopping
          console.log(
            `High confidence winner found for ${experimentName}: ` +
              `${result.recommendation.winningTreatment} (${result.recommendation.confidence})`
          );

          // Could implement early stopping logic here
          // await this.stopExperiment(experimentName, 'Auto-optimization: High confidence winner');
          // clearInterval(optimizationInterval);
        }
      } catch (error) {
        console.error(`Auto-optimization error for ${experimentName}:`, error);
      }
    }, 60 * 60 * 1000); // Every hour

    // Stop optimization after experiment duration
    if (experiment.duration) {
      setTimeout(() => {
        clearInterval(optimizationInterval);
      }, experiment.duration * 24 * 60 * 60 * 1000); // Convert days to ms
    }
  }

  /**
   * Get current experiment status and metrics
   */
  async getExperimentStatus(
    experimentName: string
  ): Promise<ExperimentResult | null> {
    return this.experimentResults.get(experimentName) || null;
  }

  /**
   * List all active experiments
   */
  async listActiveExperiments(): Promise<string[]> {
    try {
      const response = await this.client.send(
        new ListExperimentsCommand({
          project: this.projectName,
          status: "RUNNING",
        })
      );

      return response.experiments?.map((exp) => exp.name || "") || [];
    } catch (error) {
      console.error("Failed to list active experiments:", error);
      return [];
    }
  }

  /**
   * Get bandit statistics for monitoring
   */
  getBanditStats(
    context?: BanditContext
  ): ReturnType<ThompsonBandit["getStats"]> {
    return this.bandit.getStats(context);
  }

  /**
   * Health check for the experiment system
   */
  async healthCheck(): Promise<{
    connected: boolean;
    projectExists: boolean;
    activeExperiments: number;
    banditStats: ReturnType<ThompsonBandit["getStats"]>;
  }> {
    try {
      const activeExperiments = await this.listActiveExperiments();
      const banditStats = this.getBanditStats();

      return {
        connected: true,
        projectExists: true,
        activeExperiments: activeExperiments.length,
        banditStats,
      };
    } catch (error) {
      return {
        connected: false,
        projectExists: false,
        activeExperiments: 0,
        banditStats: this.getBanditStats(),
      };
    }
  }
}

// Predefined AI experiments for common scenarios
export const AI_EXPERIMENTS = {
  MODEL_ROUTING_OPTIMIZATION: {
    name: "ai-model-routing-optimization",
    description: "Optimize AI model routing based on performance and cost",
    feature: "ai-model-routing",
    treatments: [
      {
        name: "bedrock-focused",
        description: "Prefer Bedrock Claude for most tasks",
        modelProvider: "bedrock" as Arm,
        weight: 40,
      },
      {
        name: "google-focused",
        description: "Prefer Google Gemini for most tasks",
        modelProvider: "google" as Arm,
        weight: 40,
      },
      {
        name: "meta-focused",
        description: "Prefer Meta Llama for most tasks",
        modelProvider: "meta" as Arm,
        weight: 20,
      },
    ],
    metricGoals: [
      {
        metricName: "winRate",
        desiredChange: "INCREASE" as const,
        threshold: 0.8,
        priority: "HIGH" as const,
      },
      {
        metricName: "avgLatency",
        desiredChange: "DECREASE" as const,
        threshold: 1000,
        priority: "HIGH" as const,
      },
      {
        metricName: "avgCost",
        desiredChange: "DECREASE" as const,
        threshold: 0.05,
        priority: "MEDIUM" as const,
      },
    ],
    trafficAllocation: 30, // 30% of traffic
    duration: 14, // 2 weeks
    autoOptimize: true,
  },
  DOMAIN_SPECIFIC_ROUTING: {
    name: "domain-specific-ai-routing",
    description: "Test domain-specific AI model preferences",
    feature: "domain-ai-routing",
    treatments: [
      {
        name: "legal-bedrock",
        description: "Use Bedrock for legal domain",
        modelProvider: "bedrock" as Arm,
        weight: 50,
      },
      {
        name: "culinary-google",
        description: "Use Google for culinary domain",
        modelProvider: "google" as Arm,
        weight: 50,
      },
    ],
    metricGoals: [
      {
        metricName: "qualityScore",
        desiredChange: "INCREASE" as const,
        threshold: 0.85,
        priority: "HIGH" as const,
      },
      {
        metricName: "userSatisfaction",
        desiredChange: "INCREASE" as const,
        threshold: 0.8,
        priority: "HIGH" as const,
      },
    ],
    trafficAllocation: 25,
    duration: 21, // 3 weeks
    autoOptimize: true,
  },
} as const;
