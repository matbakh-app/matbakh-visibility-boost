/**
 * Tests for Drift Detection and Quality Monitoring Integration Service
 */

import {
  CloudWatchClient,
  PutMetricDataCommand,
} from "@aws-sdk/client-cloudwatch";
import { SageMakerClient } from "@aws-sdk/client-sagemaker";
import { mockClient } from "aws-sdk-client-mock";
import { DriftMetrics } from "../drift-monitor";
import { DriftQualityIntegration } from "../drift-quality-integration";

// Mock AWS clients
const cloudWatchMock = mockClient(CloudWatchClient);
const sageMakerMock = mockClient(SageMakerClient);

describe("DriftQualityIntegration", () => {
  let integration: DriftQualityIntegration;
  let mockCloudWatch: CloudWatchClient;
  let mockSageMaker: SageMakerClient;

  const mockBaselineMetrics: DriftMetrics = {
    timestamp: new Date("2025-01-01T00:00:00Z"),
    modelId: "test-model-1",
    provider: "bedrock",
    dataDrift: {
      score: 0.1,
      threshold: 0.3,
      features: [
        {
          name: "input_length",
          driftScore: 0.05,
          baseline: 100,
          current: 105,
        },
      ],
    },
    promptDrift: {
      scoreDistribution: {
        mean: 0.75,
        std: 0.15,
        p50: 0.74,
        p95: 0.95,
        p99: 0.98,
      },
      baseline: {
        mean: 0.75,
        std: 0.15,
        p50: 0.74,
        p95: 0.95,
        p99: 0.98,
      },
      driftScore: 0.05,
    },
    performanceRegression: {
      latency: {
        current: 1000,
        baseline: 1000,
        regressionScore: 0.0,
      },
      accuracy: {
        current: 0.9,
        baseline: 0.9,
        regressionScore: 0.0,
      },
      errorRate: {
        current: 0.01,
        baseline: 0.01,
        regressionScore: 0.0,
      },
    },
    qualityMetrics: {
      overallScore: 0.85,
      toxicityScore: 0.05,
      coherenceScore: 0.9,
      relevanceScore: 0.88,
      factualityScore: 0.82,
    },
  };

  beforeEach(() => {
    cloudWatchMock.reset();
    sageMakerMock.reset();

    // Create mock clients with proper configuration
    mockCloudWatch = {
      send: jest.fn(),
    } as any;

    mockSageMaker = {
      send: jest.fn(),
    } as any;

    integration = new DriftQualityIntegration(mockCloudWatch, mockSageMaker);
  });

  describe("constructor", () => {
    it("should initialize with AWS clients", () => {
      expect(integration).toBeInstanceOf(DriftQualityIntegration);
    });

    it("should initialize with default clients when none provided", () => {
      const defaultIntegration = new DriftQualityIntegration();
      expect(defaultIntegration).toBeInstanceOf(DriftQualityIntegration);
    });
  });

  describe("initializeModelMonitoring", () => {
    beforeEach(() => {
      cloudWatchMock.on(PutMetricDataCommand).resolves({});
    });

    it("should initialize monitoring for a model", async () => {
      await integration.initializeModelMonitoring(
        "test-model-1",
        mockBaselineMetrics
      );

      // Should have published baseline metrics
      expect(cloudWatchMock.calls()).toHaveLength(1);
      const call = cloudWatchMock.call(0);
      expect(call.args[0].input).toMatchObject({
        Namespace: "AI/Drift/Baseline",
      });
    });

    it("should initialize monitoring with SageMaker configuration", async () => {
      const sageMakerConfig = {
        endpointName: "test-endpoint",
        baselineDataUri: "s3://bucket/baseline-data",
      };

      await integration.initializeModelMonitoring(
        "test-model-1",
        mockBaselineMetrics,
        sageMakerConfig
      );

      // Should have set up SageMaker monitoring
      expect(cloudWatchMock.calls()).toHaveLength(1);
    });
  });

  describe("monitorInteraction", () => {
    beforeEach(async () => {
      cloudWatchMock.on(PutMetricDataCommand).resolves({});
      await integration.initializeModelMonitoring(
        "test-model-1",
        mockBaselineMetrics
      );
    });

    it("should monitor AI interaction with integrated analysis", async () => {
      const currentMetrics: DriftMetrics = {
        ...mockBaselineMetrics,
        timestamp: new Date(),
        dataDrift: {
          ...mockBaselineMetrics.dataDrift,
          score: 0.2, // Slight drift
        },
      };

      const result = await integration.monitorInteraction(
        "test-model-1",
        "bedrock",
        "req-123",
        "What is the capital of France?",
        "The capital of France is Paris.",
        {
          latency: 1200,
          tokenCount: 150,
          cost: 0.05,
        },
        currentMetrics
      );

      expect(result).toMatchObject({
        modelId: "test-model-1",
        provider: "bedrock",
        driftMetrics: currentMetrics,
        qualityAssessment: expect.objectContaining({
          modelId: "test-model-1",
          provider: "bedrock",
          requestId: "req-123",
        }),
        correlationAnalysis: expect.objectContaining({
          driftQualityCorrelation: expect.any(Number),
          performanceImpact: expect.any(Number),
          userSatisfactionImpact: expect.any(Number),
          riskScore: expect.any(Number),
        }),
        recommendations: expect.objectContaining({
          priority: expect.stringMatching(/low|medium|high|critical/),
          actions: expect.any(Array),
        }),
      });
    });

    it("should include user feedback in analysis", async () => {
      const currentMetrics: DriftMetrics = {
        ...mockBaselineMetrics,
        timestamp: new Date(),
      };

      const userFeedback = {
        rating: 4,
        helpful: true,
        accurate: true,
        appropriate: true,
      };

      const result = await integration.monitorInteraction(
        "test-model-1",
        "bedrock",
        "req-123",
        "Test input",
        "Test output",
        {
          latency: 1000,
          tokenCount: 100,
          cost: 0.03,
          userFeedback,
        },
        currentMetrics
      );

      expect(result.qualityAssessment.userFeedback).toEqual(userFeedback);
      expect(
        result.correlationAnalysis.userSatisfactionImpact
      ).toBeGreaterThanOrEqual(0);
    });

    it("should generate appropriate recommendations based on risk", async () => {
      const highRiskMetrics: DriftMetrics = {
        ...mockBaselineMetrics,
        timestamp: new Date(),
        dataDrift: {
          ...mockBaselineMetrics.dataDrift,
          score: 0.6, // High drift
        },
        performanceRegression: {
          ...mockBaselineMetrics.performanceRegression,
          latency: {
            current: 2000,
            baseline: 1000,
            regressionScore: 1.0, // 100% regression
          },
        },
      };

      const result = await integration.monitorInteraction(
        "test-model-1",
        "bedrock",
        "req-123",
        "Test input",
        "Test output",
        {
          latency: 2000,
          tokenCount: 100,
          cost: 0.03,
        },
        highRiskMetrics
      );

      expect(result.recommendations.priority).toBe("critical");
      expect(result.recommendations.actions.length).toBeGreaterThan(0);
      expect(
        result.recommendations.actions.some(
          (action) => action.type === "immediate"
        )
      ).toBe(true);
    });

    it("should publish integrated metrics to CloudWatch", async () => {
      const currentMetrics: DriftMetrics = {
        ...mockBaselineMetrics,
        timestamp: new Date(),
      };

      await integration.monitorInteraction(
        "test-model-1",
        "bedrock",
        "req-123",
        "Test input",
        "Test output",
        {
          latency: 1000,
          tokenCount: 100,
          cost: 0.03,
        },
        currentMetrics
      );

      // Should have multiple CloudWatch calls: baseline + current drift + quality + integrated
      const integratedCall = cloudWatchMock
        .calls()
        .find((call) => call.args[0].input.Namespace === "AI/Integrated");
      expect(integratedCall).toBeDefined();
    });

    it("should maintain monitoring history", async () => {
      const currentMetrics: DriftMetrics = {
        ...mockBaselineMetrics,
        timestamp: new Date(),
      };

      // Add multiple interactions
      for (let i = 0; i < 3; i++) {
        await integration.monitorInteraction(
          "test-model-1",
          "bedrock",
          `req-${i}`,
          "Test input",
          "Test output",
          {
            latency: 1000 + i * 100,
            tokenCount: 100,
            cost: 0.03,
          },
          currentMetrics
        );
      }

      // History should be maintained (tested indirectly through dashboard data)
      const dashboardData = await integration.getDashboardData("test-model-1", {
        start: new Date(Date.now() - 60000),
        end: new Date(),
      });

      expect(dashboardData.trends.drift.length).toBe(3);
      expect(dashboardData.trends.quality.length).toBe(3);
    });
  });

  describe("getDashboardData", () => {
    beforeEach(async () => {
      cloudWatchMock.on(PutMetricDataCommand).resolves({});
      await integration.initializeModelMonitoring(
        "test-model-1",
        mockBaselineMetrics
      );
    });

    it("should generate comprehensive dashboard data", async () => {
      const currentMetrics: DriftMetrics = {
        ...mockBaselineMetrics,
        timestamp: new Date(),
      };

      // Add some monitoring data
      await integration.monitorInteraction(
        "test-model-1",
        "bedrock",
        "req-123",
        "Test input",
        "Test output",
        {
          latency: 1000,
          tokenCount: 100,
          cost: 0.03,
        },
        currentMetrics
      );

      const dashboardData = await integration.getDashboardData("test-model-1", {
        start: new Date(Date.now() - 60000),
        end: new Date(),
      });

      expect(dashboardData).toMatchObject({
        modelId: "test-model-1",
        timeRange: expect.objectContaining({
          start: expect.any(Date),
          end: expect.any(Date),
        }),
        currentStatus: expect.objectContaining({
          overallHealth: expect.stringMatching(/healthy|warning|critical/),
          driftStatus: expect.stringMatching(/stable|warning|critical/),
          qualityStatus: expect.stringMatching(/good|warning|poor/),
          performanceStatus: expect.stringMatching(/optimal|degraded|poor/),
        }),
        keyMetrics: expect.objectContaining({
          overallScore: expect.any(Number),
          driftScore: expect.any(Number),
          qualityScore: expect.any(Number),
          performanceScore: expect.any(Number),
          userSatisfactionScore: expect.any(Number),
        }),
        trends: expect.objectContaining({
          drift: expect.any(Array),
          quality: expect.any(Array),
          performance: expect.any(Array),
          userSatisfaction: expect.any(Array),
        }),
        activeAlerts: expect.any(Array),
        topRecommendations: expect.any(Array),
      });
    });

    it("should throw error when no data found", async () => {
      await expect(
        integration.getDashboardData("nonexistent-model", {
          start: new Date(Date.now() - 60000),
          end: new Date(),
        })
      ).rejects.toThrow("No monitoring data found");
    });

    it("should calculate correct status based on metrics", async () => {
      // Add interaction with poor quality and high drift
      const poorMetrics: DriftMetrics = {
        ...mockBaselineMetrics,
        timestamp: new Date(),
        dataDrift: {
          ...mockBaselineMetrics.dataDrift,
          score: 0.6, // Critical drift
        },
      };

      await integration.monitorInteraction(
        "test-model-1",
        "bedrock",
        "req-123",
        "Test input",
        "hate toxic harmful offensive", // Poor quality output
        {
          latency: 3000, // High latency
          tokenCount: 100,
          cost: 0.03,
        },
        poorMetrics
      );

      const dashboardData = await integration.getDashboardData("test-model-1", {
        start: new Date(Date.now() - 60000),
        end: new Date(),
      });

      expect(dashboardData.currentStatus.overallHealth).toBe("critical");
      expect(dashboardData.currentStatus.driftStatus).toBe("critical");
    });
  });

  describe("getQualityTrendsWithDrift", () => {
    beforeEach(async () => {
      cloudWatchMock.on(PutMetricDataCommand).resolves({});
      await integration.initializeModelMonitoring(
        "test-model-1",
        mockBaselineMetrics
      );
    });

    it("should analyze quality trends with drift correlation", async () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // Add interactions with varying drift and quality
      const interactions = [
        { drift: 0.1, quality: "good" },
        { drift: 0.3, quality: "medium" },
        { drift: 0.5, quality: "poor" },
      ];

      for (const [index, { drift }] of interactions.entries()) {
        const metrics: DriftMetrics = {
          ...mockBaselineMetrics,
          timestamp: new Date(oneHourAgo.getTime() + index * 20 * 60 * 1000),
          dataDrift: {
            ...mockBaselineMetrics.dataDrift,
            score: drift,
          },
        };

        await integration.monitorInteraction(
          "test-model-1",
          "bedrock",
          `req-${index}`,
          "Test input",
          "Test output",
          {
            latency: 1000,
            tokenCount: 100,
            cost: 0.03,
          },
          metrics
        );
      }

      const trendsWithDrift = await integration.getQualityTrendsWithDrift(
        "test-model-1",
        {
          start: oneHourAgo,
          end: now,
        }
      );

      expect(trendsWithDrift).toMatchObject({
        modelId: "test-model-1",
        driftCorrelation: expect.any(Number),
        trends: expect.objectContaining({
          overallQuality: expect.objectContaining({
            trend: expect.stringMatching(/improving|stable|degrading/),
          }),
        }),
      });

      // Drift correlation should be negative (higher drift = lower quality)
      expect(trendsWithDrift.driftCorrelation).toBeLessThanOrEqual(0);
    });
  });

  describe("alert handling", () => {
    beforeEach(async () => {
      cloudWatchMock.on(PutMetricDataCommand).resolves({});
      await integration.initializeModelMonitoring(
        "test-model-1",
        mockBaselineMetrics
      );
    });

    it("should register and handle alerts from both monitors", async () => {
      const alertCallback = jest.fn().mockResolvedValue(undefined);
      integration.onAlert(alertCallback);

      // Trigger alerts through poor quality interaction
      const poorMetrics: DriftMetrics = {
        ...mockBaselineMetrics,
        timestamp: new Date(),
        dataDrift: {
          ...mockBaselineMetrics.dataDrift,
          score: 0.6, // Critical drift
        },
      };

      await integration.monitorInteraction(
        "test-model-1",
        "bedrock",
        "req-123",
        "Test input",
        "hate toxic harmful offensive", // Poor quality
        {
          latency: 1000,
          tokenCount: 100,
          cost: 0.03,
        },
        poorMetrics
      );

      expect(alertCallback).toHaveBeenCalled();
    });

    it("should handle alert callback errors gracefully", async () => {
      const failingCallback = jest
        .fn()
        .mockRejectedValue(new Error("Callback failed"));
      integration.onAlert(failingCallback);

      // Should not throw despite callback failure
      const poorMetrics: DriftMetrics = {
        ...mockBaselineMetrics,
        timestamp: new Date(),
        dataDrift: {
          ...mockBaselineMetrics.dataDrift,
          score: 0.6,
        },
      };

      await expect(
        integration.monitorInteraction(
          "test-model-1",
          "bedrock",
          "req-123",
          "Test input",
          "hate toxic",
          {
            latency: 1000,
            tokenCount: 100,
            cost: 0.03,
          },
          poorMetrics
        )
      ).resolves.not.toThrow();
    });
  });

  describe("correlation analysis", () => {
    it("should calculate meaningful correlations", async () => {
      cloudWatchMock.on(PutMetricDataCommand).resolves({});
      await integration.initializeModelMonitoring(
        "test-model-1",
        mockBaselineMetrics
      );

      const highRiskMetrics: DriftMetrics = {
        ...mockBaselineMetrics,
        timestamp: new Date(),
        dataDrift: {
          ...mockBaselineMetrics.dataDrift,
          score: 0.8, // High drift
        },
        performanceRegression: {
          ...mockBaselineMetrics.performanceRegression,
          latency: {
            current: 3000,
            baseline: 1000,
            regressionScore: 2.0, // 200% regression
          },
        },
      };

      const result = await integration.monitorInteraction(
        "test-model-1",
        "bedrock",
        "req-123",
        "Test input",
        "Test output",
        {
          latency: 3000,
          tokenCount: 100,
          cost: 0.03,
          userFeedback: {
            rating: 1, // Poor user rating
            helpful: false,
            accurate: false,
            appropriate: false,
          },
        },
        highRiskMetrics
      );

      expect(result.correlationAnalysis.riskScore).toBeGreaterThan(0.5);
      expect(result.correlationAnalysis.performanceImpact).toBeGreaterThan(0.5);
      expect(result.correlationAnalysis.userSatisfactionImpact).toBeGreaterThan(
        0.5
      );
    });
  });

  describe("recommendation generation", () => {
    beforeEach(async () => {
      cloudWatchMock.on(PutMetricDataCommand).resolves({});
      await integration.initializeModelMonitoring(
        "test-model-1",
        mockBaselineMetrics
      );
    });

    it("should generate appropriate recommendations for different scenarios", async () => {
      const scenarios = [
        {
          name: "high data drift",
          metrics: {
            ...mockBaselineMetrics,
            dataDrift: { ...mockBaselineMetrics.dataDrift, score: 0.6 },
          },
          expectedActions: ["training data"],
        },
        {
          name: "high prompt drift",
          metrics: {
            ...mockBaselineMetrics,
            promptDrift: {
              ...mockBaselineMetrics.promptDrift,
              driftScore: 0.5,
            },
          },
          expectedActions: ["prompt templates"],
        },
        {
          name: "performance regression",
          metrics: {
            ...mockBaselineMetrics,
            performanceRegression: {
              ...mockBaselineMetrics.performanceRegression,
              latency: { current: 2000, baseline: 1000, regressionScore: 1.0 },
            },
          },
          expectedActions: ["performance bottlenecks"],
        },
      ];

      for (const scenario of scenarios) {
        const result = await integration.monitorInteraction(
          "test-model-1",
          "bedrock",
          `req-${scenario.name}`,
          "Test input",
          "Test output",
          {
            latency: 1000,
            tokenCount: 100,
            cost: 0.03,
          },
          { ...scenario.metrics, timestamp: new Date() }
        );

        expect(result.recommendations.actions.length).toBeGreaterThan(0);

        // Check if expected action types are present
        const actionDescriptions = result.recommendations.actions.map((a) =>
          a.description.toLowerCase()
        );
        expect(
          scenario.expectedActions.some((expected) =>
            actionDescriptions.some((desc) => desc.includes(expected))
          )
        ).toBe(true);
      }
    });
  });

  describe("error handling", () => {
    it("should handle CloudWatch errors gracefully", async () => {
      cloudWatchMock
        .on(PutMetricDataCommand)
        .rejects(new Error("CloudWatch error"));

      await expect(
        integration.initializeModelMonitoring(
          "test-model-1",
          mockBaselineMetrics
        )
      ).rejects.toThrow("CloudWatch error");
    });
  });

  describe("integration scenarios", () => {
    beforeEach(async () => {
      cloudWatchMock.on(PutMetricDataCommand).resolves({});
      await integration.initializeModelMonitoring(
        "test-model-1",
        mockBaselineMetrics
      );
    });

    it("should handle complete monitoring workflow", async () => {
      const alertCallback = jest.fn().mockResolvedValue(undefined);
      integration.onAlert(alertCallback);

      // Simulate a series of interactions with degrading quality
      const interactions = [
        {
          drift: 0.1,
          output: "High quality response with good coherence and relevance.",
        },
        { drift: 0.3, output: "Medium quality response with some issues." },
        { drift: 0.6, output: "hate toxic harmful offensive always never" }, // Poor quality
      ];

      for (const [index, { drift, output }] of interactions.entries()) {
        const metrics: DriftMetrics = {
          ...mockBaselineMetrics,
          timestamp: new Date(Date.now() + index * 1000),
          dataDrift: {
            ...mockBaselineMetrics.dataDrift,
            score: drift,
          },
        };

        await integration.monitorInteraction(
          "test-model-1",
          "bedrock",
          `req-${index}`,
          "Test input",
          output,
          {
            latency: 1000 + index * 500,
            tokenCount: 100,
            cost: 0.03,
          },
          metrics
        );
      }

      // Get dashboard data
      const dashboardData = await integration.getDashboardData("test-model-1", {
        start: new Date(Date.now() - 60000),
        end: new Date(),
      });

      expect(dashboardData.currentStatus.overallHealth).toBe("critical");
      expect(dashboardData.trends.drift.length).toBe(3);
      expect(dashboardData.trends.quality.length).toBe(3);
      expect(dashboardData.topRecommendations.length).toBeGreaterThan(0);

      // Should have received alerts
      expect(alertCallback).toHaveBeenCalled();

      // Get quality trends with drift correlation
      const trendsWithDrift = await integration.getQualityTrendsWithDrift(
        "test-model-1",
        {
          start: new Date(Date.now() - 60000),
          end: new Date(),
        }
      );

      expect(trendsWithDrift.driftCorrelation).toBeDefined();
      expect(trendsWithDrift.trends.overallQuality.trend).toBe("degrading");
    });
  });
});
