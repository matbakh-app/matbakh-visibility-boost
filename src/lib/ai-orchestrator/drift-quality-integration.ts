/**
 * Drift Detection and Quality Monitoring Integration Service
 *
 * Provides unified drift detection and quality monitoring for AI models:
 * - Integrates SageMaker Model Monitor with quality assessments
 * - Correlates drift patterns with quality degradation
 * - Provides comprehensive monitoring dashboard data
 * - Automated alerting and remediation recommendations
 */

import {
  CloudWatchClient,
  PutMetricDataCommand,
} from "@aws-sdk/client-cloudwatch";
import { SageMakerClient } from "@aws-sdk/client-sagemaker";
import { DriftAlert, DriftMetrics, DriftMonitor } from "./drift-monitor";
import {
  QualityAlert,
  QualityAssessment,
  QualityMonitor,
  QualityTrends,
} from "./quality-monitor";

export interface IntegratedMonitoringMetrics {
  timestamp: Date;
  modelId: string;
  provider: string;

  // Combined drift and quality metrics
  driftMetrics: DriftMetrics;
  qualityAssessment: QualityAssessment;

  // Correlation analysis
  correlationAnalysis: {
    driftQualityCorrelation: number; // -1 to 1
    performanceImpact: number; // 0 to 1
    userSatisfactionImpact: number; // 0 to 1
    riskScore: number; // 0 to 1 (combined risk assessment)
  };

  // Recommendations
  recommendations: {
    priority: "low" | "medium" | "high" | "critical";
    actions: Array<{
      type: "immediate" | "short_term" | "long_term";
      description: string;
      impact: "low" | "medium" | "high";
      effort: "low" | "medium" | "high";
    }>;
  };
}

export interface MonitoringDashboardData {
  modelId: string;
  timeRange: {
    start: Date;
    end: Date;
  };

  // Current status
  currentStatus: {
    overallHealth: "healthy" | "warning" | "critical";
    driftStatus: "stable" | "warning" | "critical";
    qualityStatus: "good" | "warning" | "poor";
    performanceStatus: "optimal" | "degraded" | "poor";
  };

  // Key metrics
  keyMetrics: {
    overallScore: number;
    driftScore: number;
    qualityScore: number;
    performanceScore: number;
    userSatisfactionScore: number;
  };

  // Trends
  trends: {
    drift: Array<{ timestamp: Date; score: number }>;
    quality: Array<{ timestamp: Date; score: number }>;
    performance: Array<{ timestamp: Date; latency: number; accuracy: number }>;
    userSatisfaction: Array<{ timestamp: Date; rating: number }>;
  };

  // Active alerts
  activeAlerts: Array<DriftAlert | QualityAlert>;

  // Recommendations
  topRecommendations: Array<{
    priority: "high" | "medium" | "low";
    category: "drift" | "quality" | "performance" | "user_experience";
    description: string;
    expectedImpact: string;
  }>;
}

export class DriftQualityIntegration {
  private driftMonitor: DriftMonitor;
  private qualityMonitor: QualityMonitor;
  private cloudWatch: CloudWatchClient;
  private monitoringHistory: Map<string, IntegratedMonitoringMetrics[]> =
    new Map();
  private alertCallbacks: Array<
    (alert: DriftAlert | QualityAlert) => Promise<void>
  > = [];

  constructor(cloudWatch?: CloudWatchClient, sageMaker?: SageMakerClient) {
    this.cloudWatch =
      cloudWatch ||
      new CloudWatchClient({
        region: process.env.AWS_REGION || "eu-central-1",
      });

    // Initialize monitors
    this.driftMonitor = new DriftMonitor(this.cloudWatch, sageMaker);
    this.qualityMonitor = new QualityMonitor(
      this.driftMonitor,
      this.cloudWatch
    );

    // Register for alerts from both monitors
    this.driftMonitor.onAlert(this.handleAlert.bind(this));
    this.qualityMonitor.onAlert(this.handleAlert.bind(this));
  }

  /**
   * Initialize monitoring for a model
   */
  async initializeModelMonitoring(
    modelId: string,
    baselineMetrics: DriftMetrics,
    sageMakerConfig?: {
      endpointName: string;
      baselineDataUri: string;
    }
  ): Promise<void> {
    // Set baseline for drift monitoring
    await this.driftMonitor.setBaseline(modelId, baselineMetrics);

    // Setup SageMaker monitoring if configured
    if (sageMakerConfig) {
      await this.driftMonitor.setupSageMakerMonitor(
        modelId,
        sageMakerConfig.endpointName,
        sageMakerConfig.baselineDataUri
      );
    }

    // Initialize monitoring history
    this.monitoringHistory.set(modelId, []);
  }

  /**
   * Monitor AI interaction with integrated drift and quality assessment
   */
  async monitorInteraction(
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
    },
    currentDriftMetrics: DriftMetrics
  ): Promise<IntegratedMonitoringMetrics> {
    // Perform drift monitoring
    const driftAlerts = await this.driftMonitor.monitorDrift(
      currentDriftMetrics
    );

    // Perform quality assessment
    const qualityAssessment = await this.qualityMonitor.assessQuality(
      modelId,
      provider,
      requestId,
      input,
      output,
      metadata
    );

    // Perform correlation analysis
    const correlationAnalysis = this.analyzeCorrelations(
      currentDriftMetrics,
      qualityAssessment
    );

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      currentDriftMetrics,
      qualityAssessment,
      correlationAnalysis,
      driftAlerts
    );

    // Create integrated metrics
    const integratedMetrics: IntegratedMonitoringMetrics = {
      timestamp: new Date(),
      modelId,
      provider,
      driftMetrics: currentDriftMetrics,
      qualityAssessment,
      correlationAnalysis,
      recommendations,
    };

    // Store in history
    const history = this.monitoringHistory.get(modelId) || [];
    history.push(integratedMetrics);

    // Keep only last 500 entries per model
    if (history.length > 500) {
      history.splice(0, history.length - 500);
    }
    this.monitoringHistory.set(modelId, history);

    // Publish integrated metrics
    await this.publishIntegratedMetrics(integratedMetrics);

    return integratedMetrics;
  }

  /**
   * Get dashboard data for monitoring interface
   */
  async getDashboardData(
    modelId: string,
    timeRange: { start: Date; end: Date }
  ): Promise<MonitoringDashboardData> {
    const history = this.monitoringHistory.get(modelId) || [];
    const relevantMetrics = history.filter(
      (m) => m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
    );

    if (relevantMetrics.length === 0) {
      throw new Error(
        `No monitoring data found for model ${modelId} in the specified time range`
      );
    }

    // Calculate current status
    const latestMetrics = relevantMetrics[relevantMetrics.length - 1];
    const currentStatus = this.calculateCurrentStatus(latestMetrics);

    // Calculate key metrics
    const keyMetrics = this.calculateKeyMetrics(relevantMetrics);

    // Extract trends
    const trends = this.extractTrends(relevantMetrics);

    // Get active alerts (last 24 hours)
    const activeAlerts = await this.getActiveAlerts(modelId);

    // Generate top recommendations
    const topRecommendations = this.generateTopRecommendations(relevantMetrics);

    return {
      modelId,
      timeRange,
      currentStatus,
      keyMetrics,
      trends,
      activeAlerts,
      topRecommendations,
    };
  }

  /**
   * Get quality trends with drift correlation
   */
  async getQualityTrendsWithDrift(
    modelId: string,
    timeRange: { start: Date; end: Date }
  ): Promise<QualityTrends & { driftCorrelation: number }> {
    const qualityTrends = await this.qualityMonitor.analyzeQualityTrends(
      modelId,
      timeRange
    );

    const history = this.monitoringHistory.get(modelId) || [];
    const relevantMetrics = history.filter(
      (m) => m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
    );

    // Calculate overall drift-quality correlation
    const driftScores = relevantMetrics.map(
      (m) => m.driftMetrics.dataDrift.score
    );
    const qualityScores = relevantMetrics.map(
      (m) => m.qualityAssessment.overallScore
    );
    const driftCorrelation = this.calculateCorrelation(
      driftScores,
      qualityScores
    );

    return {
      ...qualityTrends,
      driftCorrelation,
    };
  }

  /**
   * Register alert callback
   */
  onAlert(callback: (alert: DriftAlert | QualityAlert) => Promise<void>): void {
    this.alertCallbacks.push(callback);
  }

  /**
   * Analyze correlations between drift and quality metrics
   */
  private analyzeCorrelations(
    driftMetrics: DriftMetrics,
    qualityAssessment: QualityAssessment
  ): IntegratedMonitoringMetrics["correlationAnalysis"] {
    // Calculate drift-quality correlation
    const driftScore =
      (driftMetrics.dataDrift.score +
        driftMetrics.promptDrift.driftScore +
        driftMetrics.performanceRegression.latency.regressionScore) /
      3;

    const qualityScore = qualityAssessment.overallScore;
    const driftQualityCorrelation = -driftScore; // Higher drift typically means lower quality

    // Calculate performance impact
    const performanceImpact = Math.max(
      driftMetrics.performanceRegression.latency.regressionScore,
      driftMetrics.performanceRegression.accuracy.regressionScore,
      driftMetrics.performanceRegression.errorRate.regressionScore
    );

    // Calculate user satisfaction impact
    const userSatisfactionImpact = qualityAssessment.userFeedback
      ? Math.max(0, (5 - qualityAssessment.userFeedback.rating) / 4)
      : 0;

    // Calculate combined risk score
    const riskScore = Math.min(
      1,
      driftScore * 0.3 +
        (1 - qualityScore) * 0.4 +
        performanceImpact * 0.2 +
        userSatisfactionImpact * 0.1
    );

    return {
      driftQualityCorrelation,
      performanceImpact,
      userSatisfactionImpact,
      riskScore,
    };
  }

  /**
   * Generate integrated recommendations
   */
  private generateRecommendations(
    driftMetrics: DriftMetrics,
    qualityAssessment: QualityAssessment,
    correlationAnalysis: IntegratedMonitoringMetrics["correlationAnalysis"],
    driftAlerts: DriftAlert[]
  ): IntegratedMonitoringMetrics["recommendations"] {
    const actions: IntegratedMonitoringMetrics["recommendations"]["actions"] =
      [];

    // Determine priority based on risk score
    let priority: "low" | "medium" | "high" | "critical" = "low";
    if (correlationAnalysis.riskScore >= 0.8) priority = "critical";
    else if (correlationAnalysis.riskScore >= 0.6) priority = "high";
    else if (correlationAnalysis.riskScore >= 0.4) priority = "medium";

    // Data drift recommendations
    if (driftMetrics.dataDrift.score > 0.3) {
      actions.push({
        type: "immediate",
        description: "Review and update training data to address data drift",
        impact: "high",
        effort: "medium",
      });
    }

    // Prompt drift recommendations
    if (driftMetrics.promptDrift.driftScore > 0.2) {
      actions.push({
        type: "short_term",
        description: "Optimize prompt templates based on usage patterns",
        impact: "medium",
        effort: "low",
      });
    }

    // Performance regression recommendations
    if (correlationAnalysis.performanceImpact > 0.3) {
      actions.push({
        type: "immediate",
        description: "Investigate and resolve performance bottlenecks",
        impact: "high",
        effort: "medium",
      });
    }

    // Quality improvement recommendations
    if (qualityAssessment.overallScore < 0.7) {
      actions.push({
        type: "short_term",
        description:
          "Implement quality improvement measures (fine-tuning, RAG)",
        impact: "high",
        effort: "high",
      });
    }

    // User satisfaction recommendations
    if (correlationAnalysis.userSatisfactionImpact > 0.3) {
      actions.push({
        type: "short_term",
        description: "Analyze user feedback and improve response relevance",
        impact: "medium",
        effort: "medium",
      });
    }

    return { priority, actions };
  }

  /**
   * Calculate current status from latest metrics
   */
  private calculateCurrentStatus(
    metrics: IntegratedMonitoringMetrics
  ): MonitoringDashboardData["currentStatus"] {
    const { driftMetrics, qualityAssessment, correlationAnalysis } = metrics;

    // Determine drift status
    let driftStatus: "stable" | "warning" | "critical" = "stable";
    const maxDriftScore = Math.max(
      driftMetrics.dataDrift.score,
      driftMetrics.promptDrift.driftScore
    );
    if (maxDriftScore >= 0.5) driftStatus = "critical";
    else if (maxDriftScore >= 0.3) driftStatus = "warning";

    // Determine quality status
    let qualityStatus: "good" | "warning" | "poor" = "good";
    if (qualityAssessment.overallScore <= 0.6) qualityStatus = "poor";
    else if (qualityAssessment.overallScore <= 0.7) qualityStatus = "warning";

    // Determine performance status
    let performanceStatus: "optimal" | "degraded" | "poor" = "optimal";
    if (correlationAnalysis.performanceImpact >= 0.5)
      performanceStatus = "poor";
    else if (correlationAnalysis.performanceImpact >= 0.3)
      performanceStatus = "degraded";

    // Determine overall health
    let overallHealth: "healthy" | "warning" | "critical" = "healthy";
    if (
      driftStatus === "critical" ||
      qualityStatus === "poor" ||
      performanceStatus === "poor"
    ) {
      overallHealth = "critical";
    } else if (
      driftStatus === "warning" ||
      qualityStatus === "warning" ||
      performanceStatus === "degraded"
    ) {
      overallHealth = "warning";
    }

    return {
      overallHealth,
      driftStatus,
      qualityStatus,
      performanceStatus,
    };
  }

  /**
   * Calculate key metrics from historical data
   */
  private calculateKeyMetrics(
    metrics: IntegratedMonitoringMetrics[]
  ): MonitoringDashboardData["keyMetrics"] {
    const latest = metrics[metrics.length - 1];

    return {
      overallScore: latest.correlationAnalysis.riskScore,
      driftScore:
        (latest.driftMetrics.dataDrift.score +
          latest.driftMetrics.promptDrift.driftScore) /
        2,
      qualityScore: latest.qualityAssessment.overallScore,
      performanceScore: 1 - latest.correlationAnalysis.performanceImpact,
      userSatisfactionScore: latest.qualityAssessment.userFeedback?.rating || 0,
    };
  }

  /**
   * Extract trends from historical metrics
   */
  private extractTrends(
    metrics: IntegratedMonitoringMetrics[]
  ): MonitoringDashboardData["trends"] {
    return {
      drift: metrics.map((m) => ({
        timestamp: m.timestamp,
        score:
          (m.driftMetrics.dataDrift.score +
            m.driftMetrics.promptDrift.driftScore) /
          2,
      })),
      quality: metrics.map((m) => ({
        timestamp: m.timestamp,
        score: m.qualityAssessment.overallScore,
      })),
      performance: metrics.map((m) => ({
        timestamp: m.timestamp,
        latency: m.qualityAssessment.performance.latency,
        accuracy: m.driftMetrics.performanceRegression.accuracy.current,
      })),
      userSatisfaction: metrics
        .filter((m) => m.qualityAssessment.userFeedback)
        .map((m) => ({
          timestamp: m.timestamp,
          rating: m.qualityAssessment.userFeedback!.rating,
        })),
    };
  }

  /**
   * Get active alerts for a model
   */
  private async getActiveAlerts(
    modelId: string
  ): Promise<Array<DriftAlert | QualityAlert>> {
    // In a real implementation, this would query a persistent alert store
    // For now, return empty array as alerts are handled in real-time
    return [];
  }

  /**
   * Generate top recommendations from historical data
   */
  private generateTopRecommendations(
    metrics: IntegratedMonitoringMetrics[]
  ): MonitoringDashboardData["topRecommendations"] {
    const latest = metrics[metrics.length - 1];
    const recommendations: MonitoringDashboardData["topRecommendations"] = [];

    // Analyze trends to generate recommendations
    if (metrics.length >= 5) {
      const recentMetrics = metrics.slice(-5);
      const qualityTrend = this.calculateTrendDirection(
        recentMetrics.map((m) => m.qualityAssessment.overallScore)
      );

      if (qualityTrend === "declining") {
        recommendations.push({
          priority: "high",
          category: "quality",
          description:
            "Quality scores are declining - implement immediate quality improvements",
          expectedImpact:
            "Prevent further quality degradation and improve user satisfaction",
        });
      }
    }

    // Add recommendations based on current state
    if (latest.correlationAnalysis.riskScore > 0.7) {
      recommendations.push({
        priority: "high",
        category: "drift",
        description:
          "High risk score detected - review model performance and data quality",
        expectedImpact: "Reduce system risk and improve overall stability",
      });
    }

    return recommendations;
  }

  /**
   * Calculate trend direction from values
   */
  private calculateTrendDirection(
    values: number[]
  ): "improving" | "stable" | "declining" {
    if (values.length < 2) return "stable";

    const first = values[0];
    const last = values[values.length - 1];
    const change = (last - first) / first;

    if (Math.abs(change) < 0.05) return "stable";
    return change > 0 ? "improving" : "declining";
  }

  /**
   * Calculate correlation coefficient
   */
  private calculateCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0;

    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt(
      (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)
    );

    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * Publish integrated metrics to CloudWatch
   */
  private async publishIntegratedMetrics(
    metrics: IntegratedMonitoringMetrics
  ): Promise<void> {
    const metricData = [
      {
        MetricName: "RiskScore",
        Value: metrics.correlationAnalysis.riskScore,
        Unit: "None",
        Dimensions: [
          { Name: "ModelId", Value: metrics.modelId },
          { Name: "Provider", Value: metrics.provider },
        ],
        Timestamp: metrics.timestamp,
      },
      {
        MetricName: "DriftQualityCorrelation",
        Value: metrics.correlationAnalysis.driftQualityCorrelation,
        Unit: "None",
        Dimensions: [
          { Name: "ModelId", Value: metrics.modelId },
          { Name: "Provider", Value: metrics.provider },
        ],
        Timestamp: metrics.timestamp,
      },
      {
        MetricName: "PerformanceImpact",
        Value: metrics.correlationAnalysis.performanceImpact,
        Unit: "None",
        Dimensions: [
          { Name: "ModelId", Value: metrics.modelId },
          { Name: "Provider", Value: metrics.provider },
        ],
        Timestamp: metrics.timestamp,
      },
    ];

    await this.cloudWatch.send(
      new PutMetricDataCommand({
        Namespace: "AI/Integrated",
        MetricData: metricData,
      })
    );
  }

  /**
   * Handle alerts from drift and quality monitors
   */
  private async handleAlert(alert: DriftAlert | QualityAlert): Promise<void> {
    for (const callback of this.alertCallbacks) {
      try {
        await callback(alert);
      } catch (error) {
        console.error("Failed to handle integrated alert:", error);
      }
    }
  }
}

export default DriftQualityIntegration;
