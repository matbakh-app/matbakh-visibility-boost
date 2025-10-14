/**
 * Win-Rate Tracker for A/B Testing
 *
 * Implements:
 * - Automated win-rate calculation
 * - Statistical significance testing
 * - Experiment performance tracking
 * - Rollback trigger detection
 * - Business metrics correlation
 */

import { AiRequest, AiResponse, Provider } from "./types";

export interface ExperimentResult {
  experimentId: string;
  variant: "control" | "treatment";
  provider: Provider;
  modelId: string;
  request: AiRequest;
  response: AiResponse;
  userFeedback?: number; // 1-5 rating
  businessMetric?: number; // Conversion, revenue, etc.
  timestamp: Date;
}

export interface WinRateMetrics {
  experimentId: string;
  controlWinRate: number;
  treatmentWinRate: number;
  totalComparisons: number;
  statisticalSignificance: number;
  confidenceInterval: [number, number];
  recommendedAction: "continue" | "promote" | "rollback";
  businessImpact: {
    conversionLift: number;
    revenueLift: number;
    costImpact: number;
  };
}

export interface ComparisonResult {
  winner: "control" | "treatment" | "tie";
  confidence: number;
  metrics: {
    quality: number;
    latency: number;
    cost: number;
    userSatisfaction: number;
  };
}

export interface AutomatedReport {
  reportId: string;
  experimentId: string;
  generatedAt: Date;
  reportType: "daily" | "weekly" | "monthly" | "experiment-complete";
  summary: {
    totalExperiments: number;
    activeExperiments: number;
    completedExperiments: number;
    promotedExperiments: number;
    rolledBackExperiments: number;
  };
  topPerformers: {
    experimentId: string;
    winRate: number;
    businessImpact: number;
    recommendation: string;
  }[];
  alerts: {
    type:
      | "performance-degradation"
      | "statistical-significance"
      | "business-impact";
    experimentId: string;
    message: string;
    severity: "low" | "medium" | "high" | "critical";
    actionRequired: boolean;
  }[];
  recommendations: {
    experimentId: string;
    action: "continue" | "promote" | "rollback" | "investigate";
    reason: string;
    confidence: number;
    expectedImpact: string;
  }[];
  trends: {
    winRateOverTime: { date: Date; winRate: number }[];
    businessImpactOverTime: { date: Date; impact: number }[];
    costEfficiencyOverTime: { date: Date; efficiency: number }[];
  };
}

export interface ReportingConfig {
  enableDailyReports: boolean;
  enableWeeklyReports: boolean;
  enableMonthlyReports: boolean;
  enableRealTimeAlerts: boolean;
  alertThresholds: {
    winRateDropThreshold: number;
    businessImpactThreshold: number;
    costIncreaseThreshold: number;
  };
  reportRecipients: string[];
  reportFormat: "json" | "html" | "pdf";
}

/**
 * Win-Rate Tracker for A/B Testing
 */
export class WinRateTracker {
  private experiments: Map<string, ExperimentResult[]> = new Map();
  private comparisons: Map<string, ComparisonResult[]> = new Map();
  private reports: Map<string, AutomatedReport> = new Map();
  private winRateThreshold: number = 0.85; // 85% win rate target
  private significanceThreshold: number = 0.95; // 95% confidence
  private minSampleSize: number = 100;
  private reportingConfig: ReportingConfig;

  constructor(config?: {
    winRateThreshold?: number;
    significanceThreshold?: number;
    minSampleSize?: number;
    reportingConfig?: ReportingConfig;
  }) {
    if (config) {
      this.winRateThreshold = config.winRateThreshold || this.winRateThreshold;
      this.significanceThreshold =
        config.significanceThreshold || this.significanceThreshold;
      this.minSampleSize = config.minSampleSize || this.minSampleSize;
    }

    // Default reporting configuration
    this.reportingConfig = config?.reportingConfig || {
      enableDailyReports: true,
      enableWeeklyReports: true,
      enableMonthlyReports: true,
      enableRealTimeAlerts: true,
      alertThresholds: {
        winRateDropThreshold: 0.1, // 10% drop
        businessImpactThreshold: -0.05, // -5% business impact
        costIncreaseThreshold: 0.2, // 20% cost increase
      },
      reportRecipients: [],
      reportFormat: "json",
    };
  }

  /**
   * Record experiment result
   */
  recordResult(result: ExperimentResult): void {
    const { experimentId } = result;

    if (!this.experiments.has(experimentId)) {
      this.experiments.set(experimentId, []);
    }

    this.experiments.get(experimentId)!.push(result);

    // Trigger comparison if we have enough data
    this.maybeRunComparison(experimentId);
  }

  /**
   * Compare two responses and determine winner
   */
  compareResponses(
    experimentId: string,
    controlResponse: AiResponse,
    treatmentResponse: AiResponse,
    userFeedback?: { control: number; treatment: number }
  ): ComparisonResult {
    const comparison = this.performComparison(
      controlResponse,
      treatmentResponse,
      userFeedback
    );

    // Store comparison result
    if (!this.comparisons.has(experimentId)) {
      this.comparisons.set(experimentId, []);
    }

    this.comparisons.get(experimentId)!.push(comparison);

    return comparison;
  }

  /**
   * Get win-rate metrics for experiment
   */
  getWinRateMetrics(experimentId: string): WinRateMetrics | null {
    const comparisons = this.comparisons.get(experimentId);

    if (!comparisons || comparisons.length < this.minSampleSize) {
      return null;
    }

    const controlWins = comparisons.filter(
      (c) => c.winner === "control"
    ).length;
    const treatmentWins = comparisons.filter(
      (c) => c.winner === "treatment"
    ).length;
    const ties = comparisons.filter((c) => c.winner === "tie").length;

    const totalComparisons = comparisons.length;
    const controlWinRate = controlWins / (totalComparisons - ties);
    const treatmentWinRate = treatmentWins / (totalComparisons - ties);

    const statisticalSignificance = this.calculateStatisticalSignificance(
      controlWins,
      treatmentWins,
      totalComparisons - ties
    );

    const confidenceInterval = this.calculateConfidenceInterval(
      treatmentWinRate,
      totalComparisons - ties
    );

    const businessImpact = this.calculateBusinessImpact(experimentId);

    const recommendedAction = this.getRecommendedAction(
      treatmentWinRate,
      statisticalSignificance,
      businessImpact
    );

    return {
      experimentId,
      controlWinRate,
      treatmentWinRate,
      totalComparisons,
      statisticalSignificance,
      confidenceInterval,
      recommendedAction,
      businessImpact,
    };
  }

  /**
   * Check if experiment should be rolled back
   */
  shouldRollback(experimentId: string): boolean {
    const metrics = this.getWinRateMetrics(experimentId);

    if (!metrics) {
      return false;
    }

    // Rollback if treatment is significantly worse
    return (
      metrics.treatmentWinRate < 0.5 && // Treatment losing
      metrics.statisticalSignificance > this.significanceThreshold && // Statistically significant
      metrics.businessImpact.revenueLift < -0.05 // Revenue impact > -5%
    );
  }

  /**
   * Check if experiment should be promoted
   */
  shouldPromote(experimentId: string): boolean {
    const metrics = this.getWinRateMetrics(experimentId);

    if (!metrics) {
      return false;
    }

    // Promote if treatment is significantly better
    return (
      metrics.treatmentWinRate > this.winRateThreshold && // High win rate
      metrics.statisticalSignificance > this.significanceThreshold && // Statistically significant
      metrics.businessImpact.revenueLift > 0.02 // Revenue lift > 2%
    );
  }

  /**
   * Get all active experiments
   */
  getActiveExperiments(): string[] {
    return Array.from(this.experiments.keys());
  }

  /**
   * Generate automated report
   */
  generateAutomatedReport(
    reportType: "daily" | "weekly" | "monthly" | "experiment-complete",
    experimentId?: string
  ): AutomatedReport {
    const reportId = `report-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const generatedAt = new Date();

    const activeExperiments = this.getActiveExperiments();
    const summary = this.generateReportSummary(activeExperiments);
    const topPerformers = this.getTopPerformers(activeExperiments);
    const alerts = this.generateAlerts(activeExperiments);
    const recommendations = this.generateRecommendations(activeExperiments);
    const trends = this.generateTrends(activeExperiments);

    const report: AutomatedReport = {
      reportId,
      experimentId: experimentId || "all",
      generatedAt,
      reportType,
      summary,
      topPerformers,
      alerts,
      recommendations,
      trends,
    };

    this.reports.set(reportId, report);

    // Trigger real-time alerts if enabled
    if (this.reportingConfig.enableRealTimeAlerts) {
      this.processRealTimeAlerts(alerts);
    }

    return report;
  }

  /**
   * Get all generated reports
   */
  getReports(): AutomatedReport[] {
    return Array.from(this.reports.values()).sort(
      (a, b) => b.generatedAt.getTime() - a.generatedAt.getTime()
    );
  }

  /**
   * Get specific report by ID
   */
  getReport(reportId: string): AutomatedReport | null {
    return this.reports.get(reportId) || null;
  }

  /**
   * Schedule automated reporting
   */
  scheduleAutomatedReporting(): void {
    if (this.reportingConfig.enableDailyReports) {
      // In a real implementation, this would use a scheduler like node-cron
      console.log("Daily reporting scheduled");
    }

    if (this.reportingConfig.enableWeeklyReports) {
      console.log("Weekly reporting scheduled");
    }

    if (this.reportingConfig.enableMonthlyReports) {
      console.log("Monthly reporting scheduled");
    }
  }

  /**
   * Update reporting configuration
   */
  updateReportingConfig(config: Partial<ReportingConfig>): void {
    this.reportingConfig = { ...this.reportingConfig, ...config };
  }

  /**
   * Export report in specified format
   */
  exportReport(reportId: string, format?: "json" | "html" | "pdf"): string {
    const report = this.getReport(reportId);
    if (!report) {
      throw new Error(`Report ${reportId} not found`);
    }

    const exportFormat = format || this.reportingConfig.reportFormat;

    switch (exportFormat) {
      case "json":
        return JSON.stringify(report, null, 2);
      case "html":
        return this.generateHtmlReport(report);
      case "pdf":
        return this.generatePdfReport(report);
      default:
        return JSON.stringify(report, null, 2);
    }
  }

  /**
   * Get experiment summary
   */
  getExperimentSummary(experimentId: string): {
    totalResults: number;
    controlResults: number;
    treatmentResults: number;
    averageLatency: { control: number; treatment: number };
    averageCost: { control: number; treatment: number };
    winRateMetrics: WinRateMetrics | null;
  } | null {
    const results = this.experiments.get(experimentId);

    if (!results) {
      return null;
    }

    const controlResults = results.filter((r) => r.variant === "control");
    const treatmentResults = results.filter((r) => r.variant === "treatment");

    const avgControlLatency =
      controlResults.length > 0
        ? controlResults.reduce((sum, r) => sum + r.response.latencyMs, 0) /
          controlResults.length
        : 0;

    const avgTreatmentLatency =
      treatmentResults.length > 0
        ? treatmentResults.reduce((sum, r) => sum + r.response.latencyMs, 0) /
          treatmentResults.length
        : 0;

    const avgControlCost =
      controlResults.length > 0
        ? controlResults.reduce((sum, r) => sum + r.response.costEuro, 0) /
          controlResults.length
        : 0;

    const avgTreatmentCost =
      treatmentResults.length > 0
        ? treatmentResults.reduce((sum, r) => sum + r.response.costEuro, 0) /
          treatmentResults.length
        : 0;

    return {
      totalResults: results.length,
      controlResults: controlResults.length,
      treatmentResults: treatmentResults.length,
      averageLatency: {
        control: avgControlLatency,
        treatment: avgTreatmentLatency,
      },
      averageCost: {
        control: avgControlCost,
        treatment: avgTreatmentCost,
      },
      winRateMetrics: this.getWinRateMetrics(experimentId),
    };
  }

  /**
   * Perform comparison between responses
   */
  private performComparison(
    controlResponse: AiResponse,
    treatmentResponse: AiResponse,
    userFeedback?: { control: number; treatment: number }
  ): ComparisonResult {
    const metrics = {
      quality: this.compareQuality(
        controlResponse,
        treatmentResponse,
        userFeedback
      ),
      latency: this.compareLatency(controlResponse, treatmentResponse),
      cost: this.compareCost(controlResponse, treatmentResponse),
      userSatisfaction: this.compareUserSatisfaction(userFeedback),
    };

    // Weighted scoring
    const weights = {
      quality: 0.4,
      latency: 0.2,
      cost: 0.2,
      userSatisfaction: 0.2,
    };

    // Calculate composite score
    // All metrics now follow the same convention: positive = treatment better, negative = control better
    const compositeScore =
      metrics.quality * weights.quality +
      metrics.latency * weights.latency +
      metrics.cost * weights.cost +
      metrics.userSatisfaction * weights.userSatisfaction;

    let winner: "control" | "treatment" | "tie";
    let confidence: number;

    // Epsilon for "nearly equal" to avoid flapping
    const EPS = 1e-3;

    if (Math.abs(compositeScore) <= EPS) {
      winner = "tie";
      confidence = 0.5;
    } else if (compositeScore > 0) {
      winner = "treatment";
      confidence = Math.min(0.95, 0.5 + Math.abs(compositeScore));
    } else {
      winner = "control";
      confidence = Math.min(0.95, 0.5 + Math.abs(compositeScore));
    }

    return {
      winner,
      confidence,
      metrics,
    };
  }

  /**
   * Compare quality between responses
   */
  private compareQuality(
    controlResponse: AiResponse,
    treatmentResponse: AiResponse,
    userFeedback?: { control: number; treatment: number }
  ): number {
    // If we have user feedback, use that
    if (userFeedback) {
      // Higher feedback is better - positive means treatment is better
      return this.improvementHigherIsBetter(
        userFeedback.control,
        userFeedback.treatment
      );
    }

    // Otherwise, use heuristics
    const controlLength = controlResponse.text?.length || 0;
    const treatmentLength = treatmentResponse.text?.length || 0;

    // Prefer responses that are not too short or too long
    const optimalLength = 500;
    const controlLengthScore =
      1 - Math.abs(controlLength - optimalLength) / optimalLength;
    const treatmentLengthScore =
      1 - Math.abs(treatmentLength - optimalLength) / optimalLength;

    // Higher quality score is better - positive means treatment is better
    return this.improvementHigherIsBetter(
      controlLengthScore,
      treatmentLengthScore
    );
  }

  /**
   * Helper: robust normalization function
   */
  private safeNorm(n: number, d: number): number {
    if (!isFinite(n) || !isFinite(d) || d === 0) return 0;
    // clamp to [-1, 1] just in case
    const v = n / d;
    return Math.max(-1, Math.min(1, v));
  }

  /**
   * For metrics where LOWER is better (latency, cost):
   * positive => treatment better; negative => control better
   */
  private improvementLowerIsBetter(control: number, treatment: number): number {
    const denom = Math.max(Math.abs(control), Math.abs(treatment), 1e-9);
    return this.safeNorm(control - treatment, denom);
  }

  /**
   * For metrics where HIGHER is better (quality, feedback, win rate):
   * positive => treatment better; negative => control better
   */
  private improvementHigherIsBetter(
    control: number,
    treatment: number
  ): number {
    const denom = Math.max(Math.abs(control), Math.abs(treatment), 1e-9);
    return this.safeNorm(treatment - control, denom);
  }

  /**
   * Compare latency between responses
   */
  private compareLatency(
    controlResponse: AiResponse,
    treatmentResponse: AiResponse
  ): number {
    const controlLatency = controlResponse.latencyMs;
    const treatmentLatency = treatmentResponse.latencyMs;

    // Lower latency is better - positive means treatment is faster
    return this.improvementLowerIsBetter(controlLatency, treatmentLatency);
  }

  /**
   * Compare cost between responses
   */
  private compareCost(
    controlResponse: AiResponse,
    treatmentResponse: AiResponse
  ): number {
    const controlCost = controlResponse.costEuro;
    const treatmentCost = treatmentResponse.costEuro;

    // Lower cost is better - positive means treatment is cheaper
    return this.improvementLowerIsBetter(controlCost, treatmentCost);
  }

  /**
   * Compare user satisfaction
   */
  private compareUserSatisfaction(userFeedback?: {
    control: number;
    treatment: number;
  }): number {
    if (!userFeedback) {
      return 0;
    }

    // Higher satisfaction is better - positive means treatment is better
    return this.improvementHigherIsBetter(
      userFeedback.control,
      userFeedback.treatment
    );
  }

  /**
   * Maybe run comparison if we have enough data
   */
  private maybeRunComparison(experimentId: string): void {
    const results = this.experiments.get(experimentId)!;

    // Check if we have paired results to compare
    const controlResults = results.filter((r) => r.variant === "control");
    const treatmentResults = results.filter((r) => r.variant === "treatment");

    if (controlResults.length > 0 && treatmentResults.length > 0) {
      // Find matching requests for comparison
      for (const control of controlResults) {
        const matchingTreatment = treatmentResults.find((t) =>
          this.requestsMatch(control.request, t.request)
        );

        if (matchingTreatment) {
          this.compareResponses(
            experimentId,
            control.response,
            matchingTreatment.response,
            {
              control: control.userFeedback || 3,
              treatment: matchingTreatment.userFeedback || 3,
            }
          );
        }
      }
    }
  }

  /**
   * Check if two requests match for comparison
   */
  private requestsMatch(req1: AiRequest, req2: AiRequest): boolean {
    return (
      req1.prompt === req2.prompt &&
      req1.context.domain === req2.context.domain &&
      req1.context.locale === req2.context.locale
    );
  }

  /**
   * Calculate statistical significance
   */
  private calculateStatisticalSignificance(
    controlWins: number,
    treatmentWins: number,
    totalComparisons: number
  ): number {
    // Simple z-test for proportions
    const p1 = controlWins / totalComparisons;
    const p2 = treatmentWins / totalComparisons;
    const pooledP = (controlWins + treatmentWins) / totalComparisons;

    const se = Math.sqrt(pooledP * (1 - pooledP) * (2 / totalComparisons));
    const z = Math.abs(p1 - p2) / se;

    // Convert z-score to confidence level (approximation)
    return Math.min(0.99, 1 - Math.exp((-z * z) / 2));
  }

  /**
   * Calculate confidence interval
   */
  private calculateConfidenceInterval(
    winRate: number,
    sampleSize: number
  ): [number, number] {
    const z = 1.96; // 95% confidence
    const se = Math.sqrt((winRate * (1 - winRate)) / sampleSize);

    return [Math.max(0, winRate - z * se), Math.min(1, winRate + z * se)];
  }

  /**
   * Calculate business impact
   */
  private calculateBusinessImpact(experimentId: string): {
    conversionLift: number;
    revenueLift: number;
    costImpact: number;
  } {
    const results = this.experiments.get(experimentId) || [];

    const controlResults = results.filter((r) => r.variant === "control");
    const treatmentResults = results.filter((r) => r.variant === "treatment");

    const controlConversion =
      controlResults.filter((r) => r.businessMetric && r.businessMetric > 0)
        .length / controlResults.length;
    const treatmentConversion =
      treatmentResults.filter((r) => r.businessMetric && r.businessMetric > 0)
        .length / treatmentResults.length;

    const controlRevenue =
      controlResults.reduce((sum, r) => sum + (r.businessMetric || 0), 0) /
      controlResults.length;
    const treatmentRevenue =
      treatmentResults.reduce((sum, r) => sum + (r.businessMetric || 0), 0) /
      treatmentResults.length;

    const controlCost =
      controlResults.reduce((sum, r) => sum + r.response.costEuro, 0) /
      controlResults.length;
    const treatmentCost =
      treatmentResults.reduce((sum, r) => sum + r.response.costEuro, 0) /
      treatmentResults.length;

    return {
      conversionLift:
        controlConversion > 0
          ? (treatmentConversion - controlConversion) / controlConversion
          : 0,
      revenueLift:
        controlRevenue > 0
          ? (treatmentRevenue - controlRevenue) / controlRevenue
          : 0,
      costImpact:
        controlCost > 0 ? (treatmentCost - controlCost) / controlCost : 0,
    };
  }

  /**
   * Get recommended action
   */
  private getRecommendedAction(
    treatmentWinRate: number,
    significance: number,
    businessImpact: {
      conversionLift: number;
      revenueLift: number;
      costImpact: number;
    }
  ): "continue" | "promote" | "rollback" {
    if (significance < this.significanceThreshold) {
      return "continue"; // Not enough data yet
    }

    if (
      treatmentWinRate > this.winRateThreshold &&
      businessImpact.revenueLift > 0.02
    ) {
      return "promote";
    }

    if (treatmentWinRate < 0.5 && businessImpact.revenueLift < -0.05) {
      return "rollback";
    }

    return "continue";
  }

  /**
   * Generate report summary
   */
  private generateReportSummary(activeExperiments: string[]): {
    totalExperiments: number;
    activeExperiments: number;
    completedExperiments: number;
    promotedExperiments: number;
    rolledBackExperiments: number;
  } {
    let completedExperiments = 0;
    let promotedExperiments = 0;
    let rolledBackExperiments = 0;

    for (const experimentId of activeExperiments) {
      const metrics = this.getWinRateMetrics(experimentId);
      if (metrics) {
        if (metrics.recommendedAction === "promote") {
          promotedExperiments++;
          completedExperiments++;
        } else if (metrics.recommendedAction === "rollback") {
          rolledBackExperiments++;
          completedExperiments++;
        }
      }
    }

    return {
      totalExperiments: activeExperiments.length,
      activeExperiments: activeExperiments.length - completedExperiments,
      completedExperiments,
      promotedExperiments,
      rolledBackExperiments,
    };
  }

  /**
   * Get top performing experiments
   */
  private getTopPerformers(activeExperiments: string[]): {
    experimentId: string;
    winRate: number;
    businessImpact: number;
    recommendation: string;
  }[] {
    const performers = activeExperiments
      .map((experimentId) => {
        const metrics = this.getWinRateMetrics(experimentId);
        if (!metrics) return null;

        return {
          experimentId,
          winRate: metrics.treatmentWinRate,
          businessImpact: metrics.businessImpact.revenueLift,
          recommendation: metrics.recommendedAction,
        };
      })
      .filter((p) => p !== null)
      .sort((a, b) => b!.winRate - a!.winRate)
      .slice(0, 5);

    return performers as {
      experimentId: string;
      winRate: number;
      businessImpact: number;
      recommendation: string;
    }[];
  }

  /**
   * Generate alerts for experiments
   */
  private generateAlerts(activeExperiments: string[]): {
    type:
      | "performance-degradation"
      | "statistical-significance"
      | "business-impact";
    experimentId: string;
    message: string;
    severity: "low" | "medium" | "high" | "critical";
    actionRequired: boolean;
  }[] {
    const alerts: {
      type:
        | "performance-degradation"
        | "statistical-significance"
        | "business-impact";
      experimentId: string;
      message: string;
      severity: "low" | "medium" | "high" | "critical";
      actionRequired: boolean;
    }[] = [];

    for (const experimentId of activeExperiments) {
      const metrics = this.getWinRateMetrics(experimentId);
      if (!metrics) continue;

      // Performance degradation alert
      if (
        metrics.treatmentWinRate < 0.5 &&
        metrics.statisticalSignificance > 0.8
      ) {
        alerts.push({
          type: "performance-degradation",
          experimentId,
          message: `Treatment performing significantly worse than control (${(
            metrics.treatmentWinRate * 100
          ).toFixed(1)}% win rate)`,
          severity: "high",
          actionRequired: true,
        });
      }

      // Statistical significance alert
      if (metrics.statisticalSignificance > this.significanceThreshold) {
        alerts.push({
          type: "statistical-significance",
          experimentId,
          message: `Experiment has reached statistical significance (${(
            metrics.statisticalSignificance * 100
          ).toFixed(1)}%)`,
          severity: "medium",
          actionRequired: true,
        });
      }

      // Business impact alert
      if (
        metrics.businessImpact.revenueLift <
        this.reportingConfig.alertThresholds.businessImpactThreshold
      ) {
        alerts.push({
          type: "business-impact",
          experimentId,
          message: `Negative business impact detected (${(
            metrics.businessImpact.revenueLift * 100
          ).toFixed(1)}% revenue impact)`,
          severity: "critical",
          actionRequired: true,
        });
      }
    }

    return alerts;
  }

  /**
   * Generate recommendations for experiments
   */
  private generateRecommendations(activeExperiments: string[]): {
    experimentId: string;
    action: "continue" | "promote" | "rollback" | "investigate";
    reason: string;
    confidence: number;
    expectedImpact: string;
  }[] {
    return activeExperiments
      .map((experimentId) => {
        const metrics = this.getWinRateMetrics(experimentId);
        if (!metrics) return null;

        let reason = "";
        let expectedImpact = "";
        let action: "continue" | "promote" | "rollback" | "investigate" =
          metrics.recommendedAction;

        switch (metrics.recommendedAction) {
          case "promote":
            reason = `High win rate (${(metrics.treatmentWinRate * 100).toFixed(
              1
            )}%) with positive business impact`;
            expectedImpact = `+${(
              metrics.businessImpact.revenueLift * 100
            ).toFixed(1)}% revenue lift`;
            break;
          case "rollback":
            reason = `Poor performance with negative business impact`;
            expectedImpact = `${(
              metrics.businessImpact.revenueLift * 100
            ).toFixed(1)}% revenue impact`;
            break;
          case "continue":
            if (metrics.statisticalSignificance < this.significanceThreshold) {
              reason = "Insufficient data for decision";
              expectedImpact = "Continue collecting data";
            } else {
              reason = "Marginal improvement, continue monitoring";
              expectedImpact = `${(
                metrics.businessImpact.revenueLift * 100
              ).toFixed(1)}% revenue impact`;
            }
            break;
        }

        // Add investigate action for anomalies
        if (
          metrics.treatmentWinRate > 0.9 &&
          metrics.businessImpact.revenueLift < 0
        ) {
          action = "investigate";
          reason =
            "High win rate but negative business impact - investigate metrics";
          expectedImpact = "Potential measurement issue";
        }

        return {
          experimentId,
          action,
          reason,
          confidence: metrics.statisticalSignificance,
          expectedImpact,
        };
      })
      .filter((r) => r !== null) as {
      experimentId: string;
      action: "continue" | "promote" | "rollback" | "investigate";
      reason: string;
      confidence: number;
      expectedImpact: string;
    }[];
  }

  /**
   * Generate trends data
   */
  private generateTrends(activeExperiments: string[]): {
    winRateOverTime: { date: Date; winRate: number }[];
    businessImpactOverTime: { date: Date; impact: number }[];
    costEfficiencyOverTime: { date: Date; efficiency: number }[];
  } {
    // In a real implementation, this would analyze historical data
    // For now, we'll generate sample trend data
    const now = new Date();
    const trends = {
      winRateOverTime: [] as { date: Date; winRate: number }[],
      businessImpactOverTime: [] as { date: Date; impact: number }[],
      costEfficiencyOverTime: [] as { date: Date; efficiency: number }[],
    };

    // Generate last 30 days of trend data
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);

      // Calculate average metrics for active experiments
      let totalWinRate = 0;
      let totalBusinessImpact = 0;
      let totalCostEfficiency = 0;
      let validExperiments = 0;

      for (const experimentId of activeExperiments) {
        const metrics = this.getWinRateMetrics(experimentId);
        if (metrics) {
          totalWinRate += metrics.treatmentWinRate;
          totalBusinessImpact += metrics.businessImpact.revenueLift;
          totalCostEfficiency += 1 - metrics.businessImpact.costImpact;
          validExperiments++;
        }
      }

      if (validExperiments > 0) {
        trends.winRateOverTime.push({
          date,
          winRate: totalWinRate / validExperiments,
        });
        trends.businessImpactOverTime.push({
          date,
          impact: totalBusinessImpact / validExperiments,
        });
        trends.costEfficiencyOverTime.push({
          date,
          efficiency: totalCostEfficiency / validExperiments,
        });
      }
    }

    return trends;
  }

  /**
   * Process real-time alerts
   */
  private processRealTimeAlerts(
    alerts: {
      type:
        | "performance-degradation"
        | "statistical-significance"
        | "business-impact";
      experimentId: string;
      message: string;
      severity: "low" | "medium" | "high" | "critical";
      actionRequired: boolean;
    }[]
  ): void {
    // In a real implementation, this would send notifications
    // via email, Slack, PagerDuty, etc.
    const criticalAlerts = alerts.filter(
      (alert) => alert.severity === "critical"
    );
    const highAlerts = alerts.filter((alert) => alert.severity === "high");

    if (criticalAlerts.length > 0) {
      console.warn(
        `🚨 ${criticalAlerts.length} critical alerts detected:`,
        criticalAlerts
      );
    }

    if (highAlerts.length > 0) {
      console.warn(
        `⚠️ ${highAlerts.length} high-priority alerts detected:`,
        highAlerts
      );
    }
  }

  /**
   * Generate HTML report
   */
  private generateHtmlReport(report: AutomatedReport): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Win-Rate Tracking Report - ${report.reportId}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; }
        .section { margin: 20px 0; }
        .alert { padding: 10px; margin: 5px 0; border-radius: 3px; }
        .alert.critical { background: #ffebee; border-left: 4px solid #f44336; }
        .alert.high { background: #fff3e0; border-left: 4px solid #ff9800; }
        .alert.medium { background: #e8f5e8; border-left: 4px solid #4caf50; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Win-Rate Tracking Report</h1>
        <p><strong>Report ID:</strong> ${report.reportId}</p>
        <p><strong>Generated:</strong> ${report.generatedAt.toISOString()}</p>
        <p><strong>Type:</strong> ${report.reportType}</p>
    </div>

    <div class="section">
        <h2>Summary</h2>
        <ul>
            <li>Total Experiments: ${report.summary.totalExperiments}</li>
            <li>Active Experiments: ${report.summary.activeExperiments}</li>
            <li>Completed Experiments: ${
              report.summary.completedExperiments
            }</li>
            <li>Promoted Experiments: ${report.summary.promotedExperiments}</li>
            <li>Rolled Back Experiments: ${
              report.summary.rolledBackExperiments
            }</li>
        </ul>
    </div>

    <div class="section">
        <h2>Alerts</h2>
        ${report.alerts
          .map(
            (alert) => `
            <div class="alert ${alert.severity}">
                <strong>${alert.type.toUpperCase()}:</strong> ${alert.message}
                <br><small>Experiment: ${
                  alert.experimentId
                } | Action Required: ${
              alert.actionRequired ? "Yes" : "No"
            }</small>
            </div>
        `
          )
          .join("")}
    </div>

    <div class="section">
        <h2>Top Performers</h2>
        <table>
            <tr>
                <th>Experiment ID</th>
                <th>Win Rate</th>
                <th>Business Impact</th>
                <th>Recommendation</th>
            </tr>
            ${report.topPerformers
              .map(
                (performer) => `
                <tr>
                    <td>${performer.experimentId}</td>
                    <td>${(performer.winRate * 100).toFixed(1)}%</td>
                    <td>${(performer.businessImpact * 100).toFixed(1)}%</td>
                    <td>${performer.recommendation}</td>
                </tr>
            `
              )
              .join("")}
        </table>
    </div>

    <div class="section">
        <h2>Recommendations</h2>
        <table>
            <tr>
                <th>Experiment ID</th>
                <th>Action</th>
                <th>Reason</th>
                <th>Confidence</th>
                <th>Expected Impact</th>
            </tr>
            ${report.recommendations
              .map(
                (rec) => `
                <tr>
                    <td>${rec.experimentId}</td>
                    <td>${rec.action}</td>
                    <td>${rec.reason}</td>
                    <td>${(rec.confidence * 100).toFixed(1)}%</td>
                    <td>${rec.expectedImpact}</td>
                </tr>
            `
              )
              .join("")}
        </table>
    </div>
</body>
</html>
    `;
  }

  /**
   * Generate PDF report (placeholder)
   */
  private generatePdfReport(report: AutomatedReport): string {
    // In a real implementation, this would use a library like puppeteer or jsPDF
    return `PDF Report for ${
      report.reportId
    } - Generated at ${report.generatedAt.toISOString()}`;
  }
}

/**
 * Factory function for creating win-rate tracker
 */
export const createWinRateTracker = (config?: {
  winRateThreshold?: number;
  significanceThreshold?: number;
  minSampleSize?: number;
  reportingConfig?: ReportingConfig;
}): WinRateTracker => {
  return new WinRateTracker(config);
};
