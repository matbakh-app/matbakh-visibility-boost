/**
 * AI Drift Detection and Quality Monitoring System
 *
 * Implements comprehensive drift detection and quality monitoring for AI models:
 * - SageMaker Model Monitor integration for data drift
 * - Prompt drift detection (score distribution changes)
 * - Performance regression detection
 * - Automated alerting for quality degradation
 */

import {
  CloudWatchClient,
  MetricDatum,
  PutMetricDataCommand,
} from "@aws-sdk/client-cloudwatch";
import {
  CreateModelQualityJobDefinitionCommand,
  DescribeModelQualityJobDefinitionCommand,
  SageMakerClient,
} from "@aws-sdk/client-sagemaker";

export interface DriftMetrics {
  timestamp: Date;
  modelId: string;
  provider: string;

  // Data Drift Metrics
  dataDrift: {
    score: number;
    threshold: number;
    features: Array<{
      name: string;
      driftScore: number;
      baseline: number;
      current: number;
    }>;
  };

  // Prompt Drift Metrics
  promptDrift: {
    scoreDistribution: {
      mean: number;
      std: number;
      p50: number;
      p95: number;
      p99: number;
    };
    baseline: {
      mean: number;
      std: number;
      p50: number;
      p95: number;
      p99: number;
    };
    driftScore: number;
  };

  // Performance Regression
  performanceRegression: {
    latency: {
      current: number;
      baseline: number;
      regressionScore: number;
    };
    accuracy: {
      current: number;
      baseline: number;
      regressionScore: number;
    };
    errorRate: {
      current: number;
      baseline: number;
      regressionScore: number;
    };
  };

  // Quality Metrics
  qualityMetrics: {
    overallScore: number;
    toxicityScore: number;
    coherenceScore: number;
    relevanceScore: number;
    factualityScore: number;
  };
}

export interface DriftAlert {
  id: string;
  timestamp: Date;
  severity: "low" | "medium" | "high" | "critical";
  type:
    | "data_drift"
    | "prompt_drift"
    | "performance_regression"
    | "quality_degradation";
  modelId: string;
  provider: string;
  message: string;
  metrics: Partial<DriftMetrics>;
  recommendations: string[];
}

export interface DriftThresholds {
  dataDrift: {
    warning: number;
    critical: number;
  };
  promptDrift: {
    warning: number;
    critical: number;
  };
  performanceRegression: {
    latency: {
      warning: number;
      critical: number;
    };
    accuracy: {
      warning: number;
      critical: number;
    };
    errorRate: {
      warning: number;
      critical: number;
    };
  };
  qualityDegradation: {
    overall: {
      warning: number;
      critical: number;
    };
    toxicity: {
      warning: number;
      critical: number;
    };
  };
}

export class DriftMonitor {
  private cloudWatch: CloudWatchClient;
  private sageMaker: SageMakerClient;
  private thresholds: DriftThresholds;
  private baselineMetrics: Map<string, DriftMetrics> = new Map();
  private alertCallbacks: Array<(alert: DriftAlert) => Promise<void>> = [];

  constructor(
    cloudWatch?: CloudWatchClient,
    sageMaker?: SageMakerClient,
    thresholds?: Partial<DriftThresholds>
  ) {
    this.cloudWatch =
      cloudWatch ||
      new CloudWatchClient({
        region: process.env.AWS_REGION || "eu-central-1",
      });
    this.sageMaker =
      sageMaker ||
      new SageMakerClient({ region: process.env.AWS_REGION || "eu-central-1" });

    this.thresholds = {
      dataDrift: {
        warning: 0.3,
        critical: 0.5,
      },
      promptDrift: {
        warning: 0.2,
        critical: 0.4,
      },
      performanceRegression: {
        latency: {
          warning: 0.2, // 20% increase
          critical: 0.5, // 50% increase
        },
        accuracy: {
          warning: 0.1, // 10% decrease
          critical: 0.2, // 20% decrease
        },
        errorRate: {
          warning: 0.1, // 10% increase
          critical: 0.2, // 20% increase
        },
      },
      qualityDegradation: {
        overall: {
          warning: 0.8,
          critical: 0.7,
        },
        toxicity: {
          warning: 0.1,
          critical: 0.2,
        },
      },
      ...thresholds,
    };
  }

  /**
   * Set baseline metrics for a model
   */
  async setBaseline(modelId: string, metrics: DriftMetrics): Promise<void> {
    this.baselineMetrics.set(modelId, metrics);

    // Store baseline in CloudWatch for persistence
    await this.publishMetrics("AI/Drift/Baseline", modelId, {
      DataDriftBaseline: metrics.dataDrift.score,
      PromptDriftBaseline: metrics.promptDrift.driftScore,
      LatencyBaseline: metrics.performanceRegression.latency.baseline,
      AccuracyBaseline: metrics.performanceRegression.accuracy.baseline,
      QualityBaseline: metrics.qualityMetrics.overallScore,
    });
  }

  /**
   * Monitor drift for current metrics against baseline
   */
  async monitorDrift(currentMetrics: DriftMetrics): Promise<DriftAlert[]> {
    const alerts: DriftAlert[] = [];
    const baseline = this.baselineMetrics.get(currentMetrics.modelId);

    if (!baseline) {
      throw new Error(`No baseline found for model ${currentMetrics.modelId}`);
    }

    // Check data drift
    const dataDriftAlert = this.checkDataDrift(currentMetrics, baseline);
    if (dataDriftAlert) alerts.push(dataDriftAlert);

    // Check prompt drift
    const promptDriftAlert = this.checkPromptDrift(currentMetrics, baseline);
    if (promptDriftAlert) alerts.push(promptDriftAlert);

    // Check performance regression
    const performanceAlert = this.checkPerformanceRegression(
      currentMetrics,
      baseline
    );
    if (performanceAlert) alerts.push(performanceAlert);

    // Check quality degradation
    const qualityAlert = this.checkQualityDegradation(currentMetrics, baseline);
    if (qualityAlert) alerts.push(qualityAlert);

    // Publish current metrics to CloudWatch
    await this.publishCurrentMetrics(currentMetrics);

    // Send alerts
    for (const alert of alerts) {
      await this.sendAlert(alert);
    }

    return alerts;
  }

  /**
   * Check for data drift
   */
  private checkDataDrift(
    current: DriftMetrics,
    baseline: DriftMetrics
  ): DriftAlert | null {
    const driftScore = current.dataDrift.score;

    if (driftScore >= this.thresholds.dataDrift.critical) {
      return {
        id: `data-drift-${current.modelId}-${Date.now()}`,
        timestamp: new Date(),
        severity: "critical",
        type: "data_drift",
        modelId: current.modelId,
        provider: current.provider,
        message: `Critical data drift detected: score ${driftScore.toFixed(
          3
        )} exceeds threshold ${this.thresholds.dataDrift.critical}`,
        metrics: { dataDrift: current.dataDrift },
        recommendations: [
          "Review input data distribution changes",
          "Consider retraining the model with recent data",
          "Implement data preprocessing adjustments",
          "Monitor feature importance changes",
        ],
      };
    }

    if (driftScore >= this.thresholds.dataDrift.warning) {
      return {
        id: `data-drift-${current.modelId}-${Date.now()}`,
        timestamp: new Date(),
        severity: "medium",
        type: "data_drift",
        modelId: current.modelId,
        provider: current.provider,
        message: `Data drift warning: score ${driftScore.toFixed(
          3
        )} exceeds threshold ${this.thresholds.dataDrift.warning}`,
        metrics: { dataDrift: current.dataDrift },
        recommendations: [
          "Monitor data distribution trends",
          "Prepare for potential model retraining",
          "Review data quality checks",
        ],
      };
    }

    return null;
  }

  /**
   * Check for prompt drift (score distribution changes)
   */
  private checkPromptDrift(
    current: DriftMetrics,
    baseline: DriftMetrics
  ): DriftAlert | null {
    const driftScore = current.promptDrift.driftScore;

    if (driftScore >= this.thresholds.promptDrift.critical) {
      return {
        id: `prompt-drift-${current.modelId}-${Date.now()}`,
        timestamp: new Date(),
        severity: "critical",
        type: "prompt_drift",
        modelId: current.modelId,
        provider: current.provider,
        message: `Critical prompt drift detected: score ${driftScore.toFixed(
          3
        )} exceeds threshold ${this.thresholds.promptDrift.critical}`,
        metrics: { promptDrift: current.promptDrift },
        recommendations: [
          "Review prompt template changes",
          "Analyze user query pattern shifts",
          "Update prompt engineering strategies",
          "Consider A/B testing new prompt variants",
        ],
      };
    }

    if (driftScore >= this.thresholds.promptDrift.warning) {
      return {
        id: `prompt-drift-${current.modelId}-${Date.now()}`,
        timestamp: new Date(),
        severity: "medium",
        type: "prompt_drift",
        modelId: current.modelId,
        provider: current.provider,
        message: `Prompt drift warning: score ${driftScore.toFixed(
          3
        )} exceeds threshold ${this.thresholds.promptDrift.warning}`,
        metrics: { promptDrift: current.promptDrift },
        recommendations: [
          "Monitor prompt performance trends",
          "Review recent prompt modifications",
          "Prepare prompt optimization strategies",
        ],
      };
    }

    return null;
  }

  /**
   * Check for performance regression
   */
  private checkPerformanceRegression(
    current: DriftMetrics,
    baseline: DriftMetrics
  ): DriftAlert | null {
    const latencyRegression =
      current.performanceRegression.latency.regressionScore;
    const accuracyRegression =
      current.performanceRegression.accuracy.regressionScore;
    const errorRateRegression =
      current.performanceRegression.errorRate.regressionScore;

    const criticalRegressions = [];
    const warningRegressions = [];

    // Check latency regression
    if (
      latencyRegression >=
      this.thresholds.performanceRegression.latency.critical
    ) {
      criticalRegressions.push(
        `latency increased by ${(latencyRegression * 100).toFixed(1)}%`
      );
    } else if (
      latencyRegression >= this.thresholds.performanceRegression.latency.warning
    ) {
      warningRegressions.push(
        `latency increased by ${(latencyRegression * 100).toFixed(1)}%`
      );
    }

    // Check accuracy regression
    if (
      accuracyRegression >=
      this.thresholds.performanceRegression.accuracy.critical
    ) {
      criticalRegressions.push(
        `accuracy decreased by ${(accuracyRegression * 100).toFixed(1)}%`
      );
    } else if (
      accuracyRegression >=
      this.thresholds.performanceRegression.accuracy.warning
    ) {
      warningRegressions.push(
        `accuracy decreased by ${(accuracyRegression * 100).toFixed(1)}%`
      );
    }

    // Check error rate regression
    if (
      errorRateRegression >=
      this.thresholds.performanceRegression.errorRate.critical
    ) {
      criticalRegressions.push(
        `error rate increased by ${(errorRateRegression * 100).toFixed(1)}%`
      );
    } else if (
      errorRateRegression >=
      this.thresholds.performanceRegression.errorRate.warning
    ) {
      warningRegressions.push(
        `error rate increased by ${(errorRateRegression * 100).toFixed(1)}%`
      );
    }

    if (criticalRegressions.length > 0) {
      return {
        id: `performance-regression-${current.modelId}-${Date.now()}`,
        timestamp: new Date(),
        severity: "critical",
        type: "performance_regression",
        modelId: current.modelId,
        provider: current.provider,
        message: `Critical performance regression: ${criticalRegressions.join(
          ", "
        )}`,
        metrics: { performanceRegression: current.performanceRegression },
        recommendations: [
          "Investigate recent model or infrastructure changes",
          "Consider rolling back to previous model version",
          "Review system resource allocation",
          "Implement performance optimization strategies",
        ],
      };
    }

    if (warningRegressions.length > 0) {
      return {
        id: `performance-regression-${current.modelId}-${Date.now()}`,
        timestamp: new Date(),
        severity: "medium",
        type: "performance_regression",
        modelId: current.modelId,
        provider: current.provider,
        message: `Performance regression warning: ${warningRegressions.join(
          ", "
        )}`,
        metrics: { performanceRegression: current.performanceRegression },
        recommendations: [
          "Monitor performance trends closely",
          "Review recent changes for impact",
          "Prepare performance optimization plans",
        ],
      };
    }

    return null;
  }

  /**
   * Check for quality degradation
   */
  private checkQualityDegradation(
    current: DriftMetrics,
    baseline: DriftMetrics
  ): DriftAlert | null {
    const overallScore = current.qualityMetrics.overallScore;
    const toxicityScore = current.qualityMetrics.toxicityScore;

    const issues = [];
    let severity: "low" | "medium" | "high" | "critical" = "low";

    // Check overall quality
    if (overallScore <= this.thresholds.qualityDegradation.overall.critical) {
      issues.push(
        `overall quality score ${overallScore.toFixed(
          3
        )} below critical threshold`
      );
      severity = "critical";
    } else if (
      overallScore <= this.thresholds.qualityDegradation.overall.warning
    ) {
      issues.push(
        `overall quality score ${overallScore.toFixed(
          3
        )} below warning threshold`
      );
      severity = "medium";
    }

    // Check toxicity
    if (toxicityScore >= this.thresholds.qualityDegradation.toxicity.critical) {
      issues.push(
        `toxicity score ${toxicityScore.toFixed(3)} above critical threshold`
      );
      severity = "critical";
    } else if (
      toxicityScore >= this.thresholds.qualityDegradation.toxicity.warning
    ) {
      issues.push(
        `toxicity score ${toxicityScore.toFixed(3)} above warning threshold`
      );
      if (severity === "low") severity = "medium";
    }

    if (issues.length > 0) {
      return {
        id: `quality-degradation-${current.modelId}-${Date.now()}`,
        timestamp: new Date(),
        severity,
        type: "quality_degradation",
        modelId: current.modelId,
        provider: current.provider,
        message: `Quality degradation detected: ${issues.join(", ")}`,
        metrics: { qualityMetrics: current.qualityMetrics },
        recommendations: [
          "Review model output quality samples",
          "Implement additional content filtering",
          "Consider fine-tuning or prompt adjustments",
          "Monitor user feedback and satisfaction",
        ],
      };
    }

    return null;
  }

  /**
   * Publish current metrics to CloudWatch
   */
  private async publishCurrentMetrics(metrics: DriftMetrics): Promise<void> {
    await this.publishMetrics("AI/Drift/Current", metrics.modelId, {
      DataDriftScore: metrics.dataDrift.score,
      PromptDriftScore: metrics.promptDrift.driftScore,
      LatencyRegression: metrics.performanceRegression.latency.regressionScore,
      AccuracyRegression:
        metrics.performanceRegression.accuracy.regressionScore,
      ErrorRateRegression:
        metrics.performanceRegression.errorRate.regressionScore,
      OverallQuality: metrics.qualityMetrics.overallScore,
      ToxicityScore: metrics.qualityMetrics.toxicityScore,
      CoherenceScore: metrics.qualityMetrics.coherenceScore,
      RelevanceScore: metrics.qualityMetrics.relevanceScore,
      FactualityScore: metrics.qualityMetrics.factualityScore,
    });
  }

  /**
   * Publish metrics to CloudWatch
   */
  private async publishMetrics(
    namespace: string,
    modelId: string,
    metrics: Record<string, number>
  ): Promise<void> {
    const metricData: MetricDatum[] = Object.entries(metrics).map(
      ([name, value]) => ({
        MetricName: name,
        Value: value,
        Unit: "None",
        Dimensions: [
          {
            Name: "ModelId",
            Value: modelId,
          },
        ],
        Timestamp: new Date(),
      })
    );

    await this.cloudWatch.send(
      new PutMetricDataCommand({
        Namespace: namespace,
        MetricData: metricData,
      })
    );
  }

  /**
   * Send alert through registered callbacks
   */
  private async sendAlert(alert: DriftAlert): Promise<void> {
    for (const callback of this.alertCallbacks) {
      try {
        await callback(alert);
      } catch (error) {
        console.error("Failed to send drift alert:", error);
      }
    }
  }

  /**
   * Register alert callback
   */
  onAlert(callback: (alert: DriftAlert) => Promise<void>): void {
    this.alertCallbacks.push(callback);
  }

  /**
   * Calculate prompt drift score based on distribution changes
   */
  static calculatePromptDriftScore(
    current: DriftMetrics["promptDrift"]["scoreDistribution"],
    baseline: DriftMetrics["promptDrift"]["baseline"]
  ): number {
    // Calculate KL divergence approximation for distribution drift
    const meanDrift = Math.abs(current.mean - baseline.mean) / baseline.mean;
    const stdDrift = Math.abs(current.std - baseline.std) / baseline.std;
    const p95Drift = Math.abs(current.p95 - baseline.p95) / baseline.p95;

    // Weighted combination of distribution changes
    return meanDrift * 0.4 + stdDrift * 0.3 + p95Drift * 0.3;
  }

  /**
   * Calculate performance regression score
   */
  static calculateRegressionScore(
    current: number,
    baseline: number,
    higherIsBetter: boolean = true
  ): number {
    if (baseline === 0) return 0;

    const change = (current - baseline) / baseline;
    return higherIsBetter ? Math.max(0, -change) : Math.max(0, change);
  }

  /**
   * Setup SageMaker Model Monitor for data drift detection
   */
  async setupSageMakerMonitor(
    modelName: string,
    endpointName: string,
    baselineDataUri: string
  ): Promise<string> {
    const jobDefinitionName = `${modelName}-quality-monitor`;

    try {
      // Check if job definition already exists
      await this.sageMaker.send(
        new DescribeModelQualityJobDefinitionCommand({
          JobDefinitionName: jobDefinitionName,
        })
      );

      return jobDefinitionName;
    } catch (error) {
      // Job definition doesn't exist, create it
      await this.sageMaker.send(
        new CreateModelQualityJobDefinitionCommand({
          JobDefinitionName: jobDefinitionName,
          ModelQualityAppSpecification: {
            ImageUri:
              "156813124566.dkr.ecr.eu-central-1.amazonaws.com/sagemaker-model-monitor-analyzer",
          },
          ModelQualityJobInput: {
            EndpointInput: {
              EndpointName: endpointName,
              LocalPath: "/opt/ml/processing/input/endpoint",
            },
            GroundTruthS3Input: {
              S3Uri: baselineDataUri,
            },
          },
          ModelQualityJobOutputConfig: {
            S3Output: {
              S3Uri: `s3://matbakh-ai-monitoring/${modelName}/quality-reports/`,
              LocalPath: "/opt/ml/processing/output",
            },
          },
          JobResources: {
            ClusterConfig: {
              InstanceCount: 1,
              InstanceType: "ml.m5.xlarge",
              VolumeSizeInGB: 20,
            },
          },
          RoleArn: process.env.SAGEMAKER_EXECUTION_ROLE_ARN || "",
        })
      );

      return jobDefinitionName;
    }
  }
}

export default DriftMonitor;
