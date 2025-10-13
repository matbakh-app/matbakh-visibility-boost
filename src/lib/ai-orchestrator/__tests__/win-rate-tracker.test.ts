/**
 * Tests for Win-Rate Tracker
 */

import { AiRequest, AiResponse, Provider } from "../types";
import { ExperimentResult, WinRateTracker } from "../win-rate-tracker";

describe("WinRateTracker", () => {
  let tracker: WinRateTracker;

  beforeEach(() => {
    tracker = new WinRateTracker({
      winRateThreshold: 0.85,
      significanceThreshold: 0.95,
      minSampleSize: 10, // Lower for testing
    });
  });

  const createMockRequest = (prompt: string): AiRequest => ({
    prompt,
    context: {
      domain: "restaurant",
      locale: "de",
      userId: "test-user",
      sessionId: "test-session",
    },
    options: {
      temperature: 0.7,
      maxTokens: 1000,
    },
  });

  const createMockResponse = (
    text: string,
    latencyMs: number,
    costEuro: number
  ): AiResponse => ({
    text,
    latencyMs,
    costEuro,
    tokensUsed: {
      input: 100,
      output: 200,
      total: 300,
    },
    provider: "bedrock" as Provider,
    modelId: "claude-3-sonnet",
    requestId: "test-request",
    timestamp: new Date(),
  });

  const createExperimentResult = (
    experimentId: string,
    variant: "control" | "treatment",
    prompt: string,
    responseText: string,
    latency: number,
    cost: number,
    userFeedback?: number,
    businessMetric?: number
  ): ExperimentResult => ({
    experimentId,
    variant,
    provider: "bedrock" as Provider,
    modelId: "claude-3-sonnet",
    request: createMockRequest(prompt),
    response: createMockResponse(responseText, latency, cost),
    userFeedback,
    businessMetric,
    timestamp: new Date(),
  });

  describe("recordResult", () => {
    it("should record experiment results", () => {
      const result = createExperimentResult(
        "exp-1",
        "control",
        "Test prompt",
        "Test response",
        1000,
        0.01
      );

      tracker.recordResult(result);

      const experiments = tracker.getActiveExperiments();
      expect(experiments).toContain("exp-1");
    });

    it("should handle multiple results for same experiment", () => {
      const controlResult = createExperimentResult(
        "exp-1",
        "control",
        "Test prompt",
        "Control response",
        1000,
        0.01
      );

      const treatmentResult = createExperimentResult(
        "exp-1",
        "treatment",
        "Test prompt",
        "Treatment response",
        800,
        0.015
      );

      tracker.recordResult(controlResult);
      tracker.recordResult(treatmentResult);

      const summary = tracker.getExperimentSummary("exp-1");
      expect(summary).toBeTruthy();
      expect(summary!.totalResults).toBe(2);
      expect(summary!.controlResults).toBe(1);
      expect(summary!.treatmentResults).toBe(1);
    });
  });

  describe("compareResponses", () => {
    it("should compare responses and determine winner", () => {
      const controlResponse = createMockResponse(
        "Control response",
        1000,
        0.01
      );
      const treatmentResponse = createMockResponse(
        "Treatment response",
        800,
        0.015
      );

      const comparison = tracker.compareResponses(
        "exp-1",
        controlResponse,
        treatmentResponse,
        { control: 3, treatment: 4 }
      );

      expect(comparison.winner).toBeDefined();
      expect(comparison.confidence).toBeGreaterThan(0);
      expect(comparison.metrics).toHaveProperty("quality");
      expect(comparison.metrics).toHaveProperty("latency");
      expect(comparison.metrics).toHaveProperty("cost");
      expect(comparison.metrics).toHaveProperty("userSatisfaction");
    });

    it("should prefer treatment with better user feedback", () => {
      const controlResponse = createMockResponse(
        "Control response",
        1000,
        0.01
      );
      const treatmentResponse = createMockResponse(
        "Treatment response",
        1000,
        0.01
      );

      const comparison = tracker.compareResponses(
        "exp-1",
        controlResponse,
        treatmentResponse,
        { control: 2, treatment: 5 } // Treatment much better
      );

      expect(comparison.winner).toBe("treatment");
      expect(comparison.confidence).toBeGreaterThan(0.5);
    });

    it("should prefer control with better latency and cost", () => {
      const controlResponse = createMockResponse(
        "Control response",
        500,
        0.005
      ); // Faster, cheaper
      const treatmentResponse = createMockResponse(
        "Treatment response",
        1500,
        0.02
      ); // Slower, expensive

      const comparison = tracker.compareResponses(
        "exp-1",
        controlResponse,
        treatmentResponse
      );

      // Control should win due to better latency and cost
      expect(comparison.winner).toBe("control");
    });

    it("should detect ties for similar responses", () => {
      const controlResponse = createMockResponse(
        "Similar response",
        1000,
        0.01
      );
      const treatmentResponse = createMockResponse(
        "Similar response",
        1000,
        0.01
      );

      const comparison = tracker.compareResponses(
        "exp-1",
        controlResponse,
        treatmentResponse,
        { control: 3, treatment: 3 } // Same feedback
      );

      expect(comparison.winner).toBe("tie");
      expect(comparison.confidence).toBe(0.5);
    });
  });

  describe("getWinRateMetrics", () => {
    beforeEach(() => {
      // Add enough comparisons to meet minimum sample size
      for (let i = 0; i < 15; i++) {
        const controlResponse = createMockResponse(`Control ${i}`, 1000, 0.01);
        const treatmentResponse = createMockResponse(
          `Treatment ${i}`,
          800,
          0.015
        );

        tracker.compareResponses(
          "exp-metrics",
          controlResponse,
          treatmentResponse,
          { control: 3, treatment: i < 10 ? 4 : 2 } // Treatment wins first 10, loses last 5
        );
      }
    });

    it("should calculate win-rate metrics", () => {
      const metrics = tracker.getWinRateMetrics("exp-metrics");

      expect(metrics).toBeTruthy();
      expect(metrics!.experimentId).toBe("exp-metrics");
      expect(metrics!.totalComparisons).toBe(15);
      expect(metrics!.treatmentWinRate).toBeGreaterThan(0.5); // Should win more
      expect(metrics!.statisticalSignificance).toBeGreaterThan(0);
      expect(metrics!.confidenceInterval).toHaveLength(2);
      expect(metrics!.recommendedAction).toBeDefined();
    });

    it("should return null for insufficient data", () => {
      const metrics = tracker.getWinRateMetrics("non-existent");
      expect(metrics).toBeNull();
    });

    it("should calculate business impact", () => {
      // Add business metrics
      const controlResult = createExperimentResult(
        "exp-business",
        "control",
        "Business prompt",
        "Control response",
        1000,
        0.01,
        3,
        100 // Revenue
      );

      const treatmentResult = createExperimentResult(
        "exp-business",
        "treatment",
        "Business prompt",
        "Treatment response",
        800,
        0.015,
        4,
        120 // Higher revenue
      );

      tracker.recordResult(controlResult);
      tracker.recordResult(treatmentResult);

      // Add more results to meet minimum sample size
      for (let i = 0; i < 10; i++) {
        tracker.compareResponses(
          "exp-business",
          createMockResponse(`Control ${i}`, 1000, 0.01),
          createMockResponse(`Treatment ${i}`, 800, 0.015),
          { control: 3, treatment: 4 }
        );
      }

      const metrics = tracker.getWinRateMetrics("exp-business");
      expect(metrics).toBeTruthy();
      expect(metrics!.businessImpact).toBeDefined();
      expect(metrics!.businessImpact.revenueLift).toBeGreaterThan(0);
    });
  });

  describe("shouldRollback", () => {
    it("should recommend rollback for poor performing treatment", () => {
      // Create experiment where treatment performs poorly
      for (let i = 0; i < 15; i++) {
        const controlResponse = createMockResponse(`Control ${i}`, 800, 0.01);
        const treatmentResponse = createMockResponse(
          `Treatment ${i}`,
          1200,
          0.02
        );

        tracker.compareResponses(
          "exp-rollback",
          controlResponse,
          treatmentResponse,
          { control: 4, treatment: 2 } // Treatment consistently worse
        );
      }

      // Add business impact data showing revenue loss
      const controlResult = createExperimentResult(
        "exp-rollback",
        "control",
        "Test prompt",
        "Control response",
        800,
        0.01,
        4,
        100
      );

      const treatmentResult = createExperimentResult(
        "exp-rollback",
        "treatment",
        "Test prompt",
        "Treatment response",
        1200,
        0.02,
        2,
        80 // Lower revenue
      );

      tracker.recordResult(controlResult);
      tracker.recordResult(treatmentResult);

      const shouldRollback = tracker.shouldRollback("exp-rollback");
      expect(shouldRollback).toBe(true);
    });

    it("should not recommend rollback for good performing treatment", () => {
      // Create experiment where treatment performs well
      for (let i = 0; i < 15; i++) {
        const controlResponse = createMockResponse(`Control ${i}`, 1000, 0.01);
        const treatmentResponse = createMockResponse(
          `Treatment ${i}`,
          800,
          0.01
        );

        tracker.compareResponses(
          "exp-no-rollback",
          controlResponse,
          treatmentResponse,
          { control: 3, treatment: 4 } // Treatment better
        );
      }

      const shouldRollback = tracker.shouldRollback("exp-no-rollback");
      expect(shouldRollback).toBe(false);
    });
  });

  describe("shouldPromote", () => {
    it("should recommend promotion for high-performing treatment", () => {
      // Create experiment where treatment consistently wins
      for (let i = 0; i < 15; i++) {
        const controlResponse = createMockResponse(`Control ${i}`, 1200, 0.02);
        const treatmentResponse = createMockResponse(
          `Treatment ${i}`,
          600,
          0.005
        );

        tracker.compareResponses(
          "exp-promote",
          controlResponse,
          treatmentResponse,
          { control: 2, treatment: 5 } // Treatment much better
        );
      }

      // Add positive business impact
      const controlResult = createExperimentResult(
        "exp-promote",
        "control",
        "Test prompt",
        "Control response",
        1200,
        0.02,
        2,
        100
      );

      const treatmentResult = createExperimentResult(
        "exp-promote",
        "treatment",
        "Test prompt",
        "Treatment response",
        600,
        0.005,
        5,
        130 // Higher revenue
      );

      tracker.recordResult(controlResult);
      tracker.recordResult(treatmentResult);

      const shouldPromote = tracker.shouldPromote("exp-promote");
      expect(shouldPromote).toBe(true);
    });

    it("should not recommend promotion without sufficient improvement", () => {
      // Create experiment with marginal improvement
      for (let i = 0; i < 15; i++) {
        const controlResponse = createMockResponse(`Control ${i}`, 1000, 0.01);
        const treatmentResponse = createMockResponse(
          `Treatment ${i}`,
          950,
          0.01
        );

        tracker.compareResponses(
          "exp-marginal",
          controlResponse,
          treatmentResponse,
          { control: 3, treatment: 3.2 } // Slight improvement
        );
      }

      const shouldPromote = tracker.shouldPromote("exp-marginal");
      expect(shouldPromote).toBe(false);
    });
  });

  describe("getExperimentSummary", () => {
    it("should provide comprehensive experiment summary", () => {
      const controlResult = createExperimentResult(
        "exp-summary",
        "control",
        "Test prompt",
        "Control response",
        1000,
        0.01,
        3,
        100
      );

      const treatmentResult = createExperimentResult(
        "exp-summary",
        "treatment",
        "Test prompt",
        "Treatment response",
        800,
        0.015,
        4,
        120
      );

      tracker.recordResult(controlResult);
      tracker.recordResult(treatmentResult);

      const summary = tracker.getExperimentSummary("exp-summary");

      expect(summary).toBeTruthy();
      expect(summary!.totalResults).toBe(2);
      expect(summary!.controlResults).toBe(1);
      expect(summary!.treatmentResults).toBe(1);
      expect(summary!.averageLatency.control).toBe(1000);
      expect(summary!.averageLatency.treatment).toBe(800);
      expect(summary!.averageCost.control).toBe(0.01);
      expect(summary!.averageCost.treatment).toBe(0.015);
    });

    it("should return null for non-existent experiment", () => {
      const summary = tracker.getExperimentSummary("non-existent");
      expect(summary).toBeNull();
    });
  });

  describe("getActiveExperiments", () => {
    it("should return list of active experiments", () => {
      const result1 = createExperimentResult(
        "exp-1",
        "control",
        "Prompt 1",
        "Response 1",
        1000,
        0.01
      );
      const result2 = createExperimentResult(
        "exp-2",
        "treatment",
        "Prompt 2",
        "Response 2",
        800,
        0.015
      );

      tracker.recordResult(result1);
      tracker.recordResult(result2);

      const activeExperiments = tracker.getActiveExperiments();
      expect(activeExperiments).toContain("exp-1");
      expect(activeExperiments).toContain("exp-2");
      expect(activeExperiments).toHaveLength(2);
    });

    it("should return empty array when no experiments", () => {
      const activeExperiments = tracker.getActiveExperiments();
      expect(activeExperiments).toHaveLength(0);
    });
  });

  describe("configuration", () => {
    it("should use custom configuration", () => {
      const customTracker = new WinRateTracker({
        winRateThreshold: 0.9,
        significanceThreshold: 0.99,
        minSampleSize: 50,
      });

      // Test that custom configuration is applied
      expect(customTracker).toBeDefined();

      // Add minimal data (less than custom minSampleSize)
      const result = createExperimentResult(
        "exp-config",
        "control",
        "Test",
        "Response",
        1000,
        0.01
      );
      customTracker.recordResult(result);

      // Should return null due to insufficient sample size
      const metrics = customTracker.getWinRateMetrics("exp-config");
      expect(metrics).toBeNull();
    });
  });

  describe("statistical calculations", () => {
    it("should calculate confidence intervals", () => {
      // Add enough data for statistical analysis
      for (let i = 0; i < 20; i++) {
        const controlResponse = createMockResponse(`Control ${i}`, 1000, 0.01);
        const treatmentResponse = createMockResponse(
          `Treatment ${i}`,
          800,
          0.01
        );

        tracker.compareResponses(
          "exp-stats",
          controlResponse,
          treatmentResponse,
          { control: 3, treatment: i < 15 ? 4 : 2 } // 75% win rate for treatment
        );
      }

      const metrics = tracker.getWinRateMetrics("exp-stats");
      expect(metrics).toBeTruthy();
      expect(metrics!.confidenceInterval[0]).toBeGreaterThanOrEqual(0);
      expect(metrics!.confidenceInterval[1]).toBeLessThanOrEqual(1);
      expect(metrics!.confidenceInterval[0]).toBeLessThan(
        metrics!.confidenceInterval[1]
      );
    });

    it("should calculate statistical significance", () => {
      // Add data with clear winner
      for (let i = 0; i < 30; i++) {
        const controlResponse = createMockResponse(`Control ${i}`, 1000, 0.01);
        const treatmentResponse = createMockResponse(
          `Treatment ${i}`,
          600,
          0.005
        );

        tracker.compareResponses(
          "exp-significance",
          controlResponse,
          treatmentResponse,
          { control: 2, treatment: 5 } // Clear treatment advantage
        );
      }

      const metrics = tracker.getWinRateMetrics("exp-significance");
      expect(metrics).toBeTruthy();
      expect(metrics!.statisticalSignificance).toBeGreaterThan(0.8); // High significance
    });
  });

  describe("automated reporting", () => {
    beforeEach(() => {
      // Set up some test experiments
      for (let i = 0; i < 15; i++) {
        const controlResult = createExperimentResult(
          "exp-report-1",
          "control",
          "Test prompt",
          "Control response",
          1000,
          0.01,
          3,
          100
        );

        const treatmentResult = createExperimentResult(
          "exp-report-1",
          "treatment",
          "Test prompt",
          "Treatment response",
          800,
          0.008,
          4,
          120
        );

        tracker.recordResult(controlResult);
        tracker.recordResult(treatmentResult);
      }

      // Add a second experiment
      for (let i = 0; i < 12; i++) {
        const controlResult = createExperimentResult(
          "exp-report-2",
          "control",
          "Test prompt 2",
          "Control response 2",
          1200,
          0.015,
          2,
          80
        );

        const treatmentResult = createExperimentResult(
          "exp-report-2",
          "treatment",
          "Test prompt 2",
          "Treatment response 2",
          1400,
          0.02,
          2,
          70
        );

        tracker.recordResult(controlResult);
        tracker.recordResult(treatmentResult);
      }
    });

    it("should generate automated report", () => {
      const report = tracker.generateAutomatedReport("daily");

      expect(report).toBeTruthy();
      expect(report.reportId).toBeDefined();
      expect(report.reportType).toBe("daily");
      expect(report.generatedAt).toBeInstanceOf(Date);
      expect(report.summary).toBeDefined();
      expect(report.topPerformers).toBeDefined();
      expect(report.alerts).toBeDefined();
      expect(report.recommendations).toBeDefined();
      expect(report.trends).toBeDefined();
    });

    it("should generate report summary", () => {
      const report = tracker.generateAutomatedReport("weekly");

      expect(report.summary.totalExperiments).toBe(2);
      expect(report.summary.activeExperiments).toBeGreaterThanOrEqual(0);
      expect(report.summary.completedExperiments).toBeGreaterThanOrEqual(0);
    });

    it("should identify top performers", () => {
      const report = tracker.generateAutomatedReport("monthly");

      expect(report.topPerformers).toBeInstanceOf(Array);
      expect(report.topPerformers.length).toBeGreaterThan(0);

      const topPerformer = report.topPerformers[0];
      expect(topPerformer).toHaveProperty("experimentId");
      expect(topPerformer).toHaveProperty("winRate");
      expect(topPerformer).toHaveProperty("businessImpact");
      expect(topPerformer).toHaveProperty("recommendation");
    });

    it("should generate alerts", () => {
      const report = tracker.generateAutomatedReport("daily");

      expect(report.alerts).toBeInstanceOf(Array);

      if (report.alerts.length > 0) {
        const alert = report.alerts[0];
        expect(alert).toHaveProperty("type");
        expect(alert).toHaveProperty("experimentId");
        expect(alert).toHaveProperty("message");
        expect(alert).toHaveProperty("severity");
        expect(alert).toHaveProperty("actionRequired");
      }
    });

    it("should generate recommendations", () => {
      const report = tracker.generateAutomatedReport("daily");

      expect(report.recommendations).toBeInstanceOf(Array);
      expect(report.recommendations.length).toBeGreaterThan(0);

      const recommendation = report.recommendations[0];
      expect(recommendation).toHaveProperty("experimentId");
      expect(recommendation).toHaveProperty("action");
      expect(recommendation).toHaveProperty("reason");
      expect(recommendation).toHaveProperty("confidence");
      expect(recommendation).toHaveProperty("expectedImpact");
    });

    it("should generate trends data", () => {
      const report = tracker.generateAutomatedReport("monthly");

      expect(report.trends).toBeDefined();
      expect(report.trends.winRateOverTime).toBeInstanceOf(Array);
      expect(report.trends.businessImpactOverTime).toBeInstanceOf(Array);
      expect(report.trends.costEfficiencyOverTime).toBeInstanceOf(Array);
    });

    it("should store and retrieve reports", () => {
      const report1 = tracker.generateAutomatedReport("daily");
      const report2 = tracker.generateAutomatedReport("weekly");

      const allReports = tracker.getReports();
      expect(allReports).toHaveLength(2);
      expect(allReports[0].generatedAt.getTime()).toBeGreaterThanOrEqual(
        allReports[1].generatedAt.getTime()
      ); // Should be sorted by date desc

      const retrievedReport = tracker.getReport(report1.reportId);
      expect(retrievedReport).toEqual(report1);

      const nonExistentReport = tracker.getReport("non-existent");
      expect(nonExistentReport).toBeNull();
    });

    it("should export reports in different formats", () => {
      const report = tracker.generateAutomatedReport("daily");

      const jsonExport = tracker.exportReport(report.reportId, "json");
      expect(jsonExport).toContain(report.reportId);
      expect(() => JSON.parse(jsonExport)).not.toThrow();

      const htmlExport = tracker.exportReport(report.reportId, "html");
      expect(htmlExport).toContain("<!DOCTYPE html>");
      expect(htmlExport).toContain(report.reportId);

      const pdfExport = tracker.exportReport(report.reportId, "pdf");
      expect(pdfExport).toContain(report.reportId);
    });

    it("should update reporting configuration", () => {
      const newConfig = {
        enableDailyReports: false,
        alertThresholds: {
          winRateDropThreshold: 0.2,
          businessImpactThreshold: -0.1,
          costIncreaseThreshold: 0.3,
        },
      };

      tracker.updateReportingConfig(newConfig);

      // Configuration should be updated (we can't directly test private properties,
      // but we can test the behavior)
      expect(() => tracker.scheduleAutomatedReporting()).not.toThrow();
    });

    it("should handle export errors gracefully", () => {
      expect(() => tracker.exportReport("non-existent", "json")).toThrow(
        "Report non-existent not found"
      );
    });
  });
});
