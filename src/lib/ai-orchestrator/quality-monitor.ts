/**
 * AI Quality Monitoring Service
 *
 * Provides comprehensive quality monitoring for AI models including:
 * - Real-time quality assessment
 * - Quality trend analysis
 * - Automated quality degradation detection
 * - Integration with drift monitoring
 */

import {
  CloudWatchClient,
  GetMetricStatisticsCommand,
  PutMetricDataCommand,
} from "@aws-sdk/client-cloudwatch";
import { DriftAlert, DriftMonitor } from "./drift-monitor";

export interface QualityAssessment {
  timestamp: Date;
  modelId: string;
  provider: string;
  requestId: string;

  // Input quality
  inputQuality: {
    clarity: number;
    complexity: number;
    toxicity: number;
    piiRisk: number;
  };

  // Output quality
  outputQuality: {
    coherence: number;
    relevance: number;
    factuality: number;
    completeness: number;
    toxicity: number;
    bias: number;
  };

  // Performance metrics
  performance: {
    latency: number;
    tokenCount: number;
    cost: number;
  };

  // User feedback (if available)
  userFeedback?: {
    rating: number; // 1-5 scale
    helpful: boolean;
    accurate: boolean;
    appropriate: boolean;
  };

  // Overall quality score
  overallScore: number;
}

export interface QualityTrends {
  modelId: string;
  timeRange: {
    start: Date;
    end: Date;
  };

  // Trend metrics
  trends: {
    overallQuality: {
      current: number;
      previous: number;
      change: number;
      trend: "improving" | "stable" | "degrading";
    };
    coherence: {
      current: number;
      previous: number;
      change: number;
      trend: "improving" | "stable" | "degrading";
    };
    relevance: {
      current: number;
      previous: number;
      change: number;
      trend: "improving" | "stable" | "degrading";
    };
    factuality: {
      current: number;
      previous: number;
      change: number;
      trend: "improving" | "stable" | "degrading";
    };
    toxicity: {
      current: number;
      previous: number;
      change: number;
      trend: "improving" | "stable" | "degrading";
    };
    userSatisfaction: {
      current: number;
      previous: number;
      change: number;
      trend: "improving" | "stable" | "degrading";
    };
  };

  // Statistical analysis
  statistics: {
    totalAssessments: number;
    averageLatency: number;
    averageCost: number;
    errorRate: number;
    userFeedbackRate: number;
  };
}

export interface QualityAlert extends DriftAlert {
  qualityAssessment?: QualityAssessment;
  trends?: QualityTrends;
}

export interface QualityThresholds {
  overallScore: {
    warning: number;
    critical: number;
  };
  coherence: {
    warning: number;
    critical: number;
  };
  relevance: {
    warning: number;
    critical: number;
  };
  factuality: {
    warning: number;
    critical: number;
  };
  toxicity: {
    warning: number;
    critical: number;
  };
  bias: {
    warning: number;
    critical: number;
  };
  userSatisfaction: {
    warning: number;
    critical: number;
  };
}

export class QualityMonitor {
  private cloudWatch: CloudWatchClient;
  private driftMonitor: DriftMonitor;
  private thresholds: QualityThresholds;
  private assessmentHistory: Map<string, QualityAssessment[]> = new Map();
  private alertCallbacks: Array<(alert: QualityAlert) => Promise<void>> = [];

  constructor(
    driftMonitor: DriftMonitor,
    cloudWatch?: CloudWatchClient,
    thresholds?: Partial<QualityThresholds>
  ) {
    this.driftMonitor = driftMonitor;
    this.cloudWatch =
      cloudWatch ||
      new CloudWatchClient({
        region: process.env.AWS_REGION || "eu-central-1",
      });

    this.thresholds = {
      overallScore: {
        warning: 0.7,
        critical: 0.6,
      },
      coherence: {
        warning: 0.7,
        critical: 0.6,
      },
      relevance: {
        warning: 0.7,
        critical: 0.6,
      },
      factuality: {
        warning: 0.7,
        critical: 0.6,
      },
      toxicity: {
        warning: 0.2,
        critical: 0.3,
      },
      bias: {
        warning: 0.2,
        critical: 0.3,
      },
      userSatisfaction: {
        warning: 3.0,
        critical: 2.5,
      },
      ...thresholds,
    };

    // Register with drift monitor for integrated alerts
    this.driftMonitor.onAlert(this.handleDriftAlert.bind(this));
  }

  /**
   * Assess quality of an AI interaction
   */
  async assessQuality(
    modelId: string,
    provider: string,
    requestId: string,
    input: string,
    output: string,
    metadata: {
      latency: number;
      tokenCount: number;
      cost: number;
      userFeedback?: QualityAssessment["userFeedback"];
    }
  ): Promise<QualityAssessment> {
    const assessment: QualityAssessment = {
      timestamp: new Date(),
      modelId,
      provider,
      requestId,
      inputQuality: await this.assessInputQuality(input),
      outputQuality: await this.assessOutputQuality(output, input),
      performance: metadata,
      userFeedback: metadata.userFeedback,
      overallScore: 0, // Will be calculated
    };

    // Calculate overall score
    assessment.overallScore = this.calculateOverallScore(assessment);

    // Store assessment
    if (!this.assessmentHistory.has(modelId)) {
      this.assessmentHistory.set(modelId, []);
    }
    this.assessmentHistory.get(modelId)!.push(assessment);

    // Keep only last 1000 assessments per model
    const history = this.assessmentHistory.get(modelId)!;
    if (history.length > 1000) {
      history.splice(0, history.length - 1000);
    }

    // Publish metrics to CloudWatch
    await this.publishQualityMetrics(assessment);

    // Check for quality alerts
    const alerts = await this.checkQualityAlerts(assessment);
    for (const alert of alerts) {
      await this.sendAlert(alert);
    }

    return assessment;
  }

  /**
   * Analyze quality trends for a model
   */
  async analyzeQualityTrends(
    modelId: string,
    timeRange: { start: Date; end: Date }
  ): Promise<QualityTrends> {
    const history = this.assessmentHistory.get(modelId) || [];
    const relevantAssessments = history.filter(
      (assessment) =>
        assessment.timestamp >= timeRange.start &&
        assessment.timestamp <= timeRange.end
    );

    if (relevantAssessments.length === 0) {
      throw new Error(
        `No quality assessments found for model ${modelId} in the specified time range`
      );
    }

    // Split assessments into current and previous periods
    const midpoint = new Date(
      (timeRange.start.getTime() + timeRange.end.getTime()) / 2
    );
    const previousAssessments = relevantAssessments.filter(
      (a) => a.timestamp < midpoint
    );
    const currentAssessments = relevantAssessments.filter(
      (a) => a.timestamp >= midpoint
    );

    const trends: QualityTrends = {
      modelId,
      timeRange,
      trends: {
        overallQuality: this.calculateTrend(
          currentAssessments.map((a) => a.overallScore),
          previousAssessments.map((a) => a.overallScore)
        ),
        coherence: this.calculateTrend(
          currentAssessments.map((a) => a.outputQuality.coherence),
          previousAssessments.map((a) => a.outputQuality.coherence)
        ),
        relevance: this.calculateTrend(
          currentAssessments.map((a) => a.outputQuality.relevance),
          previousAssessments.map((a) => a.outputQuality.relevance)
        ),
        factuality: this.calculateTrend(
          currentAssessments.map((a) => a.outputQuality.factuality),
          previousAssessments.map((a) => a.outputQuality.factuality)
        ),
        toxicity: this.calculateTrend(
          currentAssessments.map((a) => a.outputQuality.toxicity),
          previousAssessments.map((a) => a.outputQuality.toxicity),
          false // Lower is better for toxicity
        ),
        userSatisfaction: this.calculateTrend(
          currentAssessments
            .filter((a) => a.userFeedback)
            .map((a) => a.userFeedback!.rating),
          previousAssessments
            .filter((a) => a.userFeedback)
            .map((a) => a.userFeedback!.rating)
        ),
      },
      statistics: {
        totalAssessments: relevantAssessments.length,
        averageLatency: this.calculateAverage(
          relevantAssessments.map((a) => a.performance.latency)
        ),
        averageCost: this.calculateAverage(
          relevantAssessments.map((a) => a.performance.cost)
        ),
        errorRate: 0, // Would need error tracking
        userFeedbackRate:
          relevantAssessments.filter((a) => a.userFeedback).length /
          relevantAssessments.length,
      },
    };

    return trends;
  }

  /**
   * Get quality metrics from CloudWatch
   */
  async getQualityMetrics(
    modelId: string,
    metricName: string,
    timeRange: { start: Date; end: Date }
  ): Promise<Array<{ timestamp: Date; value: number }>> {
    const response = await this.cloudWatch.send(
      new GetMetricStatisticsCommand({
        Namespace: "AI/Quality",
        MetricName: metricName,
        Dimensions: [
          {
            Name: "ModelId",
            Value: modelId,
          },
        ],
        StartTime: timeRange.start,
        EndTime: timeRange.end,
        Period: 300, // 5 minutes
        Statistics: ["Average"],
      })
    );

    return (response.Datapoints || [])
      .map((point) => ({
        timestamp: point.Timestamp!,
        value: point.Average!,
      }))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Register alert callback
   */
  onAlert(callback: (alert: QualityAlert) => Promise<void>): void {
    this.alertCallbacks.push(callback);
  }

  /**
   * Assess input quality
   */
  private async assessInputQuality(
    input: string
  ): Promise<QualityAssessment["inputQuality"]> {
    // Simplified quality assessment - in production, use ML models
    const length = input.length;
    const wordCount = input.split(/\s+/).length;

    return {
      clarity: Math.min(
        1.0,
        Math.max(0.0, 1.0 - Math.abs(wordCount - 50) / 100)
      ), // Optimal around 50 words
      complexity: Math.min(1.0, wordCount / 100), // More words = more complex
      toxicity: this.assessToxicity(input),
      piiRisk: this.assessPIIRisk(input),
    };
  }

  /**
   * Assess output quality
   */
  private async assessOutputQuality(
    output: string,
    input: string
  ): Promise<QualityAssessment["outputQuality"]> {
    // Simplified quality assessment - in production, use ML models
    const outputLength = output.length;
    const inputLength = input.length;

    return {
      coherence: this.assessCoherence(output),
      relevance: this.assessRelevance(output, input),
      factuality: this.assessFactuality(output),
      completeness: Math.min(1.0, outputLength / (inputLength * 2)), // Reasonable response length
      toxicity: this.assessToxicity(output),
      bias: this.assessBias(output),
    };
  }

  /**
   * Calculate overall quality score
   */
  private calculateOverallScore(assessment: QualityAssessment): number {
    const weights = {
      coherence: 0.2,
      relevance: 0.25,
      factuality: 0.2,
      completeness: 0.1,
      toxicity: -0.15, // Negative weight (lower toxicity is better)
      bias: -0.1, // Negative weight (lower bias is better)
    };

    return Math.max(
      0,
      Math.min(
        1,
        assessment.outputQuality.coherence * weights.coherence +
          assessment.outputQuality.relevance * weights.relevance +
          assessment.outputQuality.factuality * weights.factuality +
          assessment.outputQuality.completeness * weights.completeness +
          (1 - assessment.outputQuality.toxicity) * Math.abs(weights.toxicity) +
          (1 - assessment.outputQuality.bias) * Math.abs(weights.bias)
      )
    );
  }

  /**
   * Check for quality alerts
   */
  private async checkQualityAlerts(
    assessment: QualityAssessment
  ): Promise<QualityAlert[]> {
    const alerts: QualityAlert[] = [];

    // Check overall score
    if (assessment.overallScore <= this.thresholds.overallScore.critical) {
      alerts.push(
        this.createQualityAlert(
          "critical",
          "quality_degradation",
          assessment,
          `Critical quality degradation: overall score ${assessment.overallScore.toFixed(
            3
          )}`
        )
      );
    } else if (
      assessment.overallScore <= this.thresholds.overallScore.warning
    ) {
      alerts.push(
        this.createQualityAlert(
          "medium",
          "quality_degradation",
          assessment,
          `Quality warning: overall score ${assessment.overallScore.toFixed(3)}`
        )
      );
    }

    // Check individual metrics
    const checks = [
      {
        value: assessment.outputQuality.coherence,
        threshold: this.thresholds.coherence,
        name: "coherence",
      },
      {
        value: assessment.outputQuality.relevance,
        threshold: this.thresholds.relevance,
        name: "relevance",
      },
      {
        value: assessment.outputQuality.factuality,
        threshold: this.thresholds.factuality,
        name: "factuality",
      },
    ];

    for (const check of checks) {
      if (check.value <= check.threshold.critical) {
        alerts.push(
          this.createQualityAlert(
            "high",
            "quality_degradation",
            assessment,
            `Critical ${check.name} issue: score ${check.value.toFixed(3)}`
          )
        );
      } else if (check.value <= check.threshold.warning) {
        alerts.push(
          this.createQualityAlert(
            "medium",
            "quality_degradation",
            assessment,
            `${check.name} warning: score ${check.value.toFixed(3)}`
          )
        );
      }
    }

    // Check toxicity and bias (higher is worse)
    if (
      assessment.outputQuality.toxicity >= this.thresholds.toxicity.critical
    ) {
      alerts.push(
        this.createQualityAlert(
          "critical",
          "quality_degradation",
          assessment,
          `Critical toxicity detected: score ${assessment.outputQuality.toxicity.toFixed(
            3
          )}`
        )
      );
    }

    if (assessment.outputQuality.bias >= this.thresholds.bias.critical) {
      alerts.push(
        this.createQualityAlert(
          "critical",
          "quality_degradation",
          assessment,
          `Critical bias detected: score ${assessment.outputQuality.bias.toFixed(
            3
          )}`
        )
      );
    }

    return alerts;
  }

  /**
   * Create quality alert
   */
  private createQualityAlert(
    severity: QualityAlert["severity"],
    type: QualityAlert["type"],
    assessment: QualityAssessment,
    message: string
  ): QualityAlert {
    return {
      id: `quality-${assessment.modelId}-${Date.now()}`,
      timestamp: new Date(),
      severity,
      type,
      modelId: assessment.modelId,
      provider: assessment.provider,
      message,
      metrics: {},
      recommendations: this.getQualityRecommendations(assessment),
      qualityAssessment: assessment,
    };
  }

  /**
   * Get quality improvement recommendations
   */
  private getQualityRecommendations(assessment: QualityAssessment): string[] {
    const recommendations: string[] = [];

    if (assessment.outputQuality.coherence < 0.7) {
      recommendations.push("Improve prompt clarity and structure");
      recommendations.push("Consider fine-tuning for better coherence");
    }

    if (assessment.outputQuality.relevance < 0.7) {
      recommendations.push("Review prompt engineering for better relevance");
      recommendations.push("Implement context-aware response generation");
    }

    if (assessment.outputQuality.factuality < 0.7) {
      recommendations.push("Implement fact-checking mechanisms");
      recommendations.push("Use retrieval-augmented generation (RAG)");
    }

    if (assessment.outputQuality.toxicity > 0.2) {
      recommendations.push("Implement stronger content filtering");
      recommendations.push("Review training data for toxic content");
    }

    if (assessment.outputQuality.bias > 0.2) {
      recommendations.push("Implement bias detection and mitigation");
      recommendations.push("Review training data for bias patterns");
    }

    return recommendations;
  }

  /**
   * Calculate trend between current and previous values
   */
  private calculateTrend(
    currentValues: number[],
    previousValues: number[],
    higherIsBetter: boolean = true
  ): QualityTrends["trends"]["overallQuality"] {
    const current = this.calculateAverage(currentValues);
    const previous = this.calculateAverage(previousValues);
    const change = current - previous;

    let trend: "improving" | "stable" | "degrading";
    const threshold = 0.05; // 5% change threshold

    if (Math.abs(change) < threshold) {
      trend = "stable";
    } else if (higherIsBetter) {
      trend = change > 0 ? "improving" : "degrading";
    } else {
      trend = change < 0 ? "improving" : "degrading";
    }

    return { current, previous, change, trend };
  }

  /**
   * Calculate average of values
   */
  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  /**
   * Publish quality metrics to CloudWatch
   */
  private async publishQualityMetrics(
    assessment: QualityAssessment
  ): Promise<void> {
    const metrics = {
      OverallScore: assessment.overallScore,
      Coherence: assessment.outputQuality.coherence,
      Relevance: assessment.outputQuality.relevance,
      Factuality: assessment.outputQuality.factuality,
      Completeness: assessment.outputQuality.completeness,
      Toxicity: assessment.outputQuality.toxicity,
      Bias: assessment.outputQuality.bias,
      Latency: assessment.performance.latency,
      TokenCount: assessment.performance.tokenCount,
      Cost: assessment.performance.cost,
    };

    if (assessment.userFeedback) {
      metrics["UserRating"] = assessment.userFeedback.rating;
      metrics["UserHelpful"] = assessment.userFeedback.helpful ? 1 : 0;
      metrics["UserAccurate"] = assessment.userFeedback.accurate ? 1 : 0;
      metrics["UserAppropriate"] = assessment.userFeedback.appropriate ? 1 : 0;
    }

    const metricData = Object.entries(metrics).map(([name, value]) => ({
      MetricName: name,
      Value: value,
      Unit: "None",
      Dimensions: [
        {
          Name: "ModelId",
          Value: assessment.modelId,
        },
        {
          Name: "Provider",
          Value: assessment.provider,
        },
      ],
      Timestamp: assessment.timestamp,
    }));

    await this.cloudWatch.send(
      new PutMetricDataCommand({
        Namespace: "AI/Quality",
        MetricData: metricData,
      })
    );
  }

  /**
   * Send alert through registered callbacks
   */
  private async sendAlert(alert: QualityAlert): Promise<void> {
    for (const callback of this.alertCallbacks) {
      try {
        await callback(alert);
      } catch (error) {
        console.error("Failed to send quality alert:", error);
      }
    }
  }

  /**
   * Handle drift alerts from drift monitor
   */
  private async handleDriftAlert(driftAlert: DriftAlert): Promise<void> {
    // Convert drift alert to quality alert for unified handling
    const qualityAlert: QualityAlert = {
      ...driftAlert,
      id: `drift-quality-${driftAlert.id}`,
    };

    await this.sendAlert(qualityAlert);
  }

  // Simplified quality assessment methods (in production, use ML models)
  private assessToxicity(text: string): number {
    const toxicWords = ["hate", "toxic", "harmful", "offensive"];
    const words = text.toLowerCase().split(/\s+/);
    const toxicCount = words.filter((word) =>
      toxicWords.some((toxic) => word.includes(toxic))
    ).length;
    return Math.min(1.0, (toxicCount / words.length) * 10);
  }

  private assessPIIRisk(text: string): number {
    const piiPatterns = [
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
      /\b\d{3}-\d{3}-\d{4}\b/, // Phone
    ];

    const matches = piiPatterns.filter((pattern) => pattern.test(text)).length;
    return Math.min(1.0, matches / 3);
  }

  private assessCoherence(text: string): number {
    // Simplified coherence assessment
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    if (sentences.length === 0) return 0;

    // Check for reasonable sentence length and structure
    const avgSentenceLength = text.length / sentences.length;
    const coherenceScore = Math.min(
      1.0,
      Math.max(0.0, 1.0 - Math.abs(avgSentenceLength - 100) / 200)
    );

    return coherenceScore;
  }

  private assessRelevance(output: string, input: string): number {
    // Simplified relevance assessment based on keyword overlap
    const inputWords = new Set(input.toLowerCase().split(/\s+/));
    const outputWords = output.toLowerCase().split(/\s+/);

    const relevantWords = outputWords.filter((word) =>
      inputWords.has(word)
    ).length;
    return Math.min(1.0, relevantWords / Math.max(1, outputWords.length / 2));
  }

  private assessFactuality(text: string): number {
    // Simplified factuality assessment
    const uncertaintyWords = ["maybe", "possibly", "might", "could", "perhaps"];
    const factualWords = ["is", "are", "was", "were", "will", "has", "have"];

    const words = text.toLowerCase().split(/\s+/);
    const uncertainCount = words.filter((word) =>
      uncertaintyWords.includes(word)
    ).length;
    const factualCount = words.filter((word) =>
      factualWords.includes(word)
    ).length;

    return Math.min(
      1.0,
      Math.max(0.0, ((factualCount - uncertainCount) / words.length) * 10 + 0.5)
    );
  }

  private assessBias(text: string): number {
    // Simplified bias assessment
    const biasWords = ["always", "never", "all", "none", "everyone", "nobody"];
    const words = text.toLowerCase().split(/\s+/);
    const biasCount = words.filter((word) => biasWords.includes(word)).length;

    return Math.min(1.0, (biasCount / words.length) * 5);
  }
}

export default QualityMonitor;
