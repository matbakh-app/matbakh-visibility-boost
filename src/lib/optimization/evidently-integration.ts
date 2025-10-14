/**
 * CloudWatch Evidently Integration for System Optimization
 *
 * Implements:
 * - A/B testing for performance optimizations
 * - Feature flags for gradual rollouts
 * - Experiment management and analysis
 * - Integration with performance monitoring
 */

import {
  BatchEvaluateFeatureCommand,
  CloudWatchEvidentlyClient,
  CreateExperimentCommand,
  CreateFeatureCommand,
  CreateProjectCommand,
  EvaluateFeatureCommand,
  GetExperimentCommand,
  ListExperimentsCommand,
  ListFeaturesCommand,
  PutProjectEventsCommand,
  StartExperimentCommand,
  StopExperimentCommand,
  UpdateFeatureCommand,
} from "@aws-sdk/client-evidently";
import { randomUUID } from "crypto";

export interface OptimizationExperiment {
  name: string;
  description: string;
  feature: string;
  treatments: ExperimentTreatment[];
  metricGoals: MetricGoal[];
  trafficAllocation: number; // Percentage of traffic to include
  duration?: number; // Duration in days
}

export interface ExperimentTreatment {
  name: string;
  description: string;
  feature: string;
  variation: string;
  weight: number; // Traffic percentage for this treatment
}

export interface MetricGoal {
  metricName: string;
  desiredChange: "INCREASE" | "DECREASE";
  valueKey?: string;
}

export interface FeatureVariation {
  name: string;
  value: any;
  description?: string;
}

export interface OptimizationFeature {
  name: string;
  description: string;
  variations: FeatureVariation[];
  defaultVariation: string;
  evaluationStrategy?: "ALL_RULES" | "DEFAULT_VARIATION";
}

export interface ExperimentResult {
  experimentName: string;
  status: "CREATED" | "UPDATING" | "RUNNING" | "COMPLETED" | "CANCELLED";
  results?: {
    treatment: string;
    metricResults: Array<{
      metricName: string;
      value: number;
      confidenceInterval?: {
        lower: number;
        upper: number;
      };
      statisticalSignificance?: boolean;
    }>;
  }[];
}

export interface UserContext {
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  ipAddress?: string;
  customAttributes?: Record<string, string>;
}

export class EvidentlyOptimizationService {
  private client: CloudWatchEvidentlyClient;
  private projectName: string;
  private region: string;

  constructor(
    projectName: string = "matbakh-system-optimization",
    region: string = "eu-central-1"
  ) {
    this.client = new CloudWatchEvidentlyClient({ region });
    this.projectName = projectName;
    this.region = region;
  }

  /**
   * Initialize the Evidently project for system optimization
   */
  async initializeProject(): Promise<void> {
    try {
      await this.client.send(
        new CreateProjectCommand({
          name: this.projectName,
          description: "System optimization A/B testing and feature flags",
          tags: {
            Environment: process.env.NODE_ENV || "development",
            Purpose: "SystemOptimization",
            Team: "Engineering",
          },
        })
      );
    } catch (error: any) {
      if (error.name !== "ResourceAlreadyExistsException") {
        throw error;
      }
      // Project already exists, continue
    }
  }

  /**
   * Create a feature flag for system optimization
   */
  async createOptimizationFeature(feature: OptimizationFeature): Promise<void> {
    const variations = feature.variations.map((variation) => ({
      name: variation.name,
      value: this.serializeValue(variation.value),
    }));

    await this.client.send(
      new CreateFeatureCommand({
        project: this.projectName,
        name: feature.name,
        description: feature.description,
        variations,
        defaultVariation: feature.defaultVariation,
        evaluationStrategy: feature.evaluationStrategy || "ALL_RULES",
        tags: {
          Type: "SystemOptimization",
          CreatedAt: new Date().toISOString(),
        },
      })
    );
  }

  /**
   * Create an A/B test experiment for optimization
   */
  async createOptimizationExperiment(
    experiment: OptimizationExperiment
  ): Promise<void> {
    const treatments = experiment.treatments.map((treatment) => ({
      name: treatment.name,
      description: treatment.description,
      feature: treatment.feature,
      variation: treatment.variation,
    }));

    const metricGoals = experiment.metricGoals.map((goal) => ({
      metricName: goal.metricName,
      desiredChange: goal.desiredChange,
      valueKey: goal.valueKey,
    }));

    await this.client.send(
      new CreateExperimentCommand({
        project: this.projectName,
        name: experiment.name,
        description: experiment.description,
        treatments,
        metricGoals,
        randomizationSalt: randomUUID(),
        samplingRate: experiment.trafficAllocation * 1000, // Convert percentage to per-mille
        tags: {
          Type: "SystemOptimization",
          Duration: experiment.duration?.toString() || "indefinite",
          CreatedAt: new Date().toISOString(),
        },
      })
    );
  }

  /**
   * Evaluate a feature flag for a user
   */
  async evaluateFeature(
    featureName: string,
    userContext: UserContext,
    defaultValue?: any
  ): Promise<any> {
    try {
      const response = await this.client.send(
        new EvaluateFeatureCommand({
          project: this.projectName,
          feature: featureName,
          entityId: userContext.userId || userContext.sessionId || randomUUID(),
          evaluationContext: JSON.stringify({
            userAgent: userContext.userAgent,
            ipAddress: userContext.ipAddress,
            ...userContext.customAttributes,
          }),
        })
      );

      return this.deserializeValue(response.variation || "", response.value);
    } catch (error) {
      console.warn(`Failed to evaluate feature ${featureName}:`, error);
      return defaultValue;
    }
  }

  /**
   * Evaluate multiple features at once for efficiency
   */
  async evaluateMultipleFeatures(
    features: string[],
    userContext: UserContext
  ): Promise<Record<string, any>> {
    try {
      const requests = features.map((feature) => ({
        feature,
        entityId: userContext.userId || userContext.sessionId || randomUUID(),
        evaluationContext: JSON.stringify({
          userAgent: userContext.userAgent,
          ipAddress: userContext.ipAddress,
          ...userContext.customAttributes,
        }),
      }));

      const response = await this.client.send(
        new BatchEvaluateFeatureCommand({
          project: this.projectName,
          requests,
        })
      );

      const results: Record<string, any> = {};
      response.results?.forEach((result, index) => {
        const featureName = features[index];
        results[featureName] = this.deserializeValue(
          result.variation || "",
          result.value
        );
      });

      return results;
    } catch (error) {
      console.warn("Failed to evaluate multiple features:", error);
      return {};
    }
  }

  /**
   * Record custom metrics for experiments
   */
  async recordMetric(
    metricName: string,
    value: number,
    userContext: UserContext,
    experimentName?: string
  ): Promise<void> {
    try {
      const event = {
        timestamp: new Date(),
        type: "aws.evidently.custom" as const,
        data: {
          details: JSON.stringify({
            metricName,
            value,
            experimentName,
            userId: userContext.userId,
            sessionId: userContext.sessionId,
            userAgent: userContext.userAgent,
            customAttributes: userContext.customAttributes,
          }),
        },
      };

      await this.client.send(
        new PutProjectEventsCommand({
          project: this.projectName,
          events: [event],
        })
      );
    } catch (error) {
      console.error(`Failed to record metric ${metricName}:`, error);
    }
  }

  /**
   * Record performance metrics for optimization experiments
   */
  async recordPerformanceMetrics(
    metrics: {
      loadTime?: number;
      renderTime?: number;
      interactionTime?: number;
      bundleSize?: number;
      cacheHitRate?: number;
      errorRate?: number;
    },
    userContext: UserContext,
    experimentName?: string
  ): Promise<void> {
    const promises = Object.entries(metrics)
      .map(([metricName, value]) => {
        if (value !== undefined) {
          return this.recordMetric(
            metricName,
            value,
            userContext,
            experimentName
          );
        }
      })
      .filter(Boolean);

    await Promise.all(promises);
  }

  /**
   * Start an experiment
   */
  async startExperiment(experimentName: string): Promise<void> {
    await this.client.send(
      new StartExperimentCommand({
        project: this.projectName,
        experiment: experimentName,
      })
    );
  }

  /**
   * Stop an experiment
   */
  async stopExperiment(experimentName: string, reason?: string): Promise<void> {
    await this.client.send(
      new StopExperimentCommand({
        project: this.projectName,
        experiment: experimentName,
        reason,
      })
    );
  }

  /**
   * Get experiment results
   */
  async getExperimentResults(
    experimentName: string
  ): Promise<ExperimentResult> {
    const response = await this.client.send(
      new GetExperimentCommand({
        project: this.projectName,
        experiment: experimentName,
      })
    );

    return {
      experimentName,
      status: response.experiment?.status as any,
      results: response.experiment?.treatments?.map((treatment) => ({
        treatment: treatment.name || "",
        metricResults: [], // Would need to parse from response
      })),
    };
  }

  /**
   * List all active experiments
   */
  async listActiveExperiments(): Promise<string[]> {
    const response = await this.client.send(
      new ListExperimentsCommand({
        project: this.projectName,
        status: "RUNNING",
      })
    );

    return response.experiments?.map((exp) => exp.name || "") || [];
  }

  /**
   * List all features
   */
  async listFeatures(): Promise<string[]> {
    const response = await this.client.send(
      new ListFeaturesCommand({
        project: this.projectName,
      })
    );

    return response.features?.map((feature) => feature.name || "") || [];
  }

  /**
   * Update feature flag configuration
   */
  async updateFeature(
    featureName: string,
    updates: {
      description?: string;
      defaultVariation?: string;
      evaluationStrategy?: "ALL_RULES" | "DEFAULT_VARIATION";
    }
  ): Promise<void> {
    await this.client.send(
      new UpdateFeatureCommand({
        project: this.projectName,
        feature: featureName,
        ...updates,
      })
    );
  }

  /**
   * Helper method to serialize values for Evidently
   */
  private serializeValue(value: any): {
    boolValue?: boolean;
    doubleValue?: number;
    longValue?: number;
    stringValue?: string;
  } {
    if (typeof value === "boolean") {
      return { boolValue: value };
    } else if (typeof value === "number") {
      return Number.isInteger(value)
        ? { longValue: value }
        : { doubleValue: value };
    } else {
      return { stringValue: String(value) };
    }
  }

  /**
   * Helper method to deserialize values from Evidently
   */
  private deserializeValue(variation: string, value: any): any {
    if (value?.boolValue !== undefined) return value.boolValue;
    if (value?.doubleValue !== undefined) return value.doubleValue;
    if (value?.longValue !== undefined) return value.longValue;
    if (value?.stringValue !== undefined) return value.stringValue;
    return null;
  }

  /**
   * Health check for Evidently service
   */
  async healthCheck(): Promise<{
    connected: boolean;
    projectExists: boolean;
    featuresCount: number;
    experimentsCount: number;
  }> {
    try {
      const [features, experiments] = await Promise.all([
        this.listFeatures(),
        this.listActiveExperiments(),
      ]);

      return {
        connected: true,
        projectExists: true,
        featuresCount: features.length,
        experimentsCount: experiments.length,
      };
    } catch (error) {
      return {
        connected: false,
        projectExists: false,
        featuresCount: 0,
        experimentsCount: 0,
      };
    }
  }
}

// Predefined optimization features for common use cases
export const OPTIMIZATION_FEATURES = {
  BUNDLE_OPTIMIZATION: {
    name: "bundle-optimization",
    description: "Enable advanced bundle optimization techniques",
    variations: [
      { name: "disabled", value: false, description: "No optimization" },
      { name: "basic", value: "basic", description: "Basic code splitting" },
      {
        name: "advanced",
        value: "advanced",
        description: "Advanced optimization with tree shaking",
      },
    ],
    defaultVariation: "disabled",
  },
  CACHING_STRATEGY: {
    name: "caching-strategy",
    description: "Select caching strategy for performance optimization",
    variations: [
      { name: "none", value: "none", description: "No caching" },
      {
        name: "memory",
        value: "memory",
        description: "In-memory caching only",
      },
      { name: "redis", value: "redis", description: "Redis-based caching" },
      { name: "hybrid", value: "hybrid", description: "Memory + Redis hybrid" },
    ],
    defaultVariation: "memory",
  },
  LAZY_LOADING: {
    name: "lazy-loading",
    description: "Enable lazy loading for components and routes",
    variations: [
      { name: "disabled", value: false, description: "No lazy loading" },
      { name: "routes", value: "routes", description: "Lazy load routes only" },
      {
        name: "components",
        value: "components",
        description: "Lazy load components only",
      },
      { name: "all", value: "all", description: "Lazy load everything" },
    ],
    defaultVariation: "routes",
  },
  DATABASE_OPTIMIZATION: {
    name: "database-optimization",
    description: "Enable database query optimization features",
    variations: [
      { name: "disabled", value: false, description: "No optimization" },
      {
        name: "indexing",
        value: "indexing",
        description: "Automatic indexing",
      },
      { name: "pooling", value: "pooling", description: "Connection pooling" },
      { name: "full", value: "full", description: "Full optimization suite" },
    ],
    defaultVariation: "pooling",
  },
} as const;

// Predefined experiments for common optimization scenarios
export const OPTIMIZATION_EXPERIMENTS = {
  BUNDLE_SIZE_OPTIMIZATION: {
    name: "bundle-size-optimization",
    description: "Test different bundle optimization strategies",
    feature: "bundle-optimization",
    treatments: [
      {
        name: "control",
        description: "No optimization",
        feature: "bundle-optimization",
        variation: "disabled",
        weight: 50,
      },
      {
        name: "treatment",
        description: "Advanced optimization",
        feature: "bundle-optimization",
        variation: "advanced",
        weight: 50,
      },
    ],
    metricGoals: [
      {
        metricName: "bundleSize",
        desiredChange: "DECREASE" as const,
      },
      {
        metricName: "loadTime",
        desiredChange: "DECREASE" as const,
      },
    ],
    trafficAllocation: 20, // 20% of users
    duration: 14, // 2 weeks
  },
  CACHING_PERFORMANCE: {
    name: "caching-performance-test",
    description: "Compare caching strategies for performance impact",
    feature: "caching-strategy",
    treatments: [
      {
        name: "memory-only",
        description: "Memory caching only",
        feature: "caching-strategy",
        variation: "memory",
        weight: 33,
      },
      {
        name: "redis-only",
        description: "Redis caching only",
        feature: "caching-strategy",
        variation: "redis",
        weight: 33,
      },
      {
        name: "hybrid",
        description: "Hybrid caching strategy",
        feature: "caching-strategy",
        variation: "hybrid",
        weight: 34,
      },
    ],
    metricGoals: [
      {
        metricName: "cacheHitRate",
        desiredChange: "INCREASE" as const,
      },
      {
        metricName: "renderTime",
        desiredChange: "DECREASE" as const,
      },
    ],
    trafficAllocation: 30,
    duration: 21, // 3 weeks
  },
} as const;
