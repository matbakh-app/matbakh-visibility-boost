/**
 * Tests for AI Drift Detection and Quality Monitoring System
 */

import {
  CloudWatchClient,
  PutMetricDataCommand,
} from "@aws-sdk/client-cloudwatch";
import {
  CreateModelQualityJobDefinitionCommand,
  DescribeModelQualityJobDefinitionCommand,
  SageMakerClient,
} from "@aws-sdk/client-sagemaker";
import { mockClient } from "aws-sdk-client-mock";
import { DriftMetrics, DriftMonitor, DriftThresholds } from "../drift-monitor";

// Mock AWS clients
const cloudWatchMock = mockClient(CloudWatchClient);
const sageMakerMock = mockClient(SageMakerClient);

describe("DriftMonitor", () => {
  let driftMonitor: DriftMonitor;
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
        {
          name: "complexity_score",
          driftScore: 0.08,
          baseline: 0.5,
          current: 0.54,
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
        current: 1200,
        baseline: 1000,
        regressionScore: 0.2,
      },
      accuracy: {
        current: 0.85,
        baseline: 0.9,
        regressionScore: 0.056,
      },
      errorRate: {
        current: 0.02,
        baseline: 0.01,
        regressionScore: 1.0,
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

    driftMonitor = new DriftMonitor(mockCloudWatch, mockSageMaker);
  });

  describe("constructor", () => {
    it("should initialize with default thresholds", () => {
      const monitor = new DriftMonitor();
      expect(monitor).toBeInstanceOf(DriftMonitor);
    });

    it("should accept custom thresholds", () => {
      const customThresholds: Partial<DriftThresholds> = {
        dataDrift: {
          warning: 0.2,
          critical: 0.4,
        },
      };

      const monitor = new DriftMonitor(undefined, undefined, customThresholds);
      expect(monitor).toBeInstanceOf(DriftMonitor);
    });
  });

  describe("setBaseline", () => {
    it("should set baseline metrics and publish to CloudWatch", async () => {
      (mockCloudWatch.send as jest.Mock).mockResolvedValue({});

      await driftMonitor.setBaseline("test-model-1", mockBaselineMetrics);

      expect(mockCloudWatch.send).toHaveBeenCalledTimes(1);
      const call = (mockCloudWatch.send as jest.Mock).mock.calls[0][0];
      expect(call.input).toMatchObject({
        Namespace: "AI/Drift/Baseline",
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            MetricName: "DataDriftBaseline",
            Value: 0.1,
            Dimensions: [{ Name: "ModelId", Value: "test-model-1" }],
          }),
        ]),
      });
    });
  });

  describe("monitorDrift", () => {
    beforeEach(async () => {
      (mockCloudWatch.send as jest.Mock).mockResolvedValue({});
      await driftMonitor.setBaseline("test-model-1", mockBaselineMetrics);
    });

    it("should detect no drift when metrics are within thresholds", async () => {
      const currentMetrics: DriftMetrics = {
        ...mockBaselineMetrics,
        timestamp: new Date(),
        dataDrift: {
          ...mockBaselineMetrics.dataDrift,
          score: 0.15, // Below warning threshold (0.3)
        },
        promptDrift: {
          ...mockBaselineMetrics.promptDrift,
          driftScore: 0.1, // Below warning threshold (0.2)
        },
      };

      const alerts = await driftMonitor.monitorDrift(currentMetrics);
      expect(alerts).toHaveLength(0);
    });

    it("should detect data drift warning", async () => {
      const currentMetrics: DriftMetrics = {
        ...mockBaselineMetrics,
        timestamp: new Date(),
        dataDrift: {
          ...mockBaselineMetrics.dataDrift,
          score: 0.35, // Above warning threshold (0.3)
        },
      };

      const alerts = await driftMonitor.monitorDrift(currentMetrics);
      expect(alerts).toHaveLength(1);
      expect(alerts[0]).toMatchObject({
        severity: "medium",
        type: "data_drift",
        modelId: "test-model-1",
        provider: "bedrock",
      });
      expect(alerts[0].message).toContain("Data drift warning");
    });

    it("should detect critical data drift", async () => {
      const currentMetrics: DriftMetrics = {
        ...mockBaselineMetrics,
        timestamp: new Date(),
        dataDrift: {
          ...mockBaselineMetrics.dataDrift,
          score: 0.6, // Above critical threshold (0.5)
        },
      };

      const alerts = await driftMonitor.monitorDrift(currentMetrics);
      expect(alerts).toHaveLength(1);
      expect(alerts[0]).toMatchObject({
        severity: "critical",
        type: "data_drift",
        modelId: "test-model-1",
        provider: "bedrock",
      });
      expect(alerts[0].message).toContain("Critical data drift detected");
    });

    it("should detect prompt drift warning", async () => {
      const currentMetrics: DriftMetrics = {
        ...mockBaselineMetrics,
        timestamp: new Date(),
        promptDrift: {
          ...mockBaselineMetrics.promptDrift,
          driftScore: 0.25, // Above warning threshold (0.2)
        },
      };

      const alerts = await driftMonitor.monitorDrift(currentMetrics);
      expect(alerts).toHaveLength(1);
      expect(alerts[0]).toMatchObject({
        severity: "medium",
        type: "prompt_drift",
        modelId: "test-model-1",
        provider: "bedrock",
      });
      expect(alerts[0].message).toContain("Prompt drift warning");
    });

    it("should detect critical prompt drift", async () => {
      const currentMetrics: DriftMetrics = {
        ...mockBaselineMetrics,
        timestamp: new Date(),
        promptDrift: {
          ...mockBaselineMetrics.promptDrift,
          driftScore: 0.45, // Above critical threshold (0.4)
        },
      };

      const alerts = await driftMonitor.monitorDrift(currentMetrics);
      expect(alerts).toHaveLength(1);
      expect(alerts[0]).toMatchObject({
        severity: "critical",
        type: "prompt_drift",
        modelId: "test-model-1",
        provider: "bedrock",
      });
      expect(alerts[0].message).toContain("Critical prompt drift detected");
    });

    it("should detect performance regression warning", async () => {
      const currentMetrics: DriftMetrics = {
        ...mockBaselineMetrics,
        timestamp: new Date(),
        performanceRegression: {
          latency: {
            current: 1300,
            baseline: 1000,
            regressionScore: 0.3, // Above warning threshold (0.2)
          },
          accuracy: {
            current: 0.85,
            baseline: 0.9,
            regressionScore: 0.056,
          },
          errorRate: {
            current: 0.02,
            baseline: 0.01,
            regressionScore: 1.0,
          },
        },
      };

      const alerts = await driftMonitor.monitorDrift(currentMetrics);
      expect(alerts).toHaveLength(1);
      expect(alerts[0]).toMatchObject({
        severity: "medium",
        type: "performance_regression",
        modelId: "test-model-1",
        provider: "bedrock",
      });
      expect(alerts[0].message).toContain("Performance regression warning");
    });

    it("should detect critical performance regression", async () => {
      const currentMetrics: DriftMetrics = {
        ...mockBaselineMetrics,
        timestamp: new Date(),
        performanceRegression: {
          latency: {
            current: 1600,
            baseline: 1000,
            regressionScore: 0.6, // Above critical threshold (0.5)
          },
          accuracy: {
            current: 0.7,
            baseline: 0.9,
            regressionScore: 0.22, // Above critical threshold (0.2)
          },
          errorRate: {
            current: 0.02,
            baseline: 0.01,
            regressionScore: 1.0,
          },
        },
      };

      const alerts = await driftMonitor.monitorDrift(currentMetrics);
      expect(alerts).toHaveLength(1);
      expect(alerts[0]).toMatchObject({
        severity: "critical",
        type: "performance_regression",
        modelId: "test-model-1",
        provider: "bedrock",
      });
      expect(alerts[0].message).toContain("Critical performance regression");
    });

    it("should detect quality degradation warning", async () => {
      const currentMetrics: DriftMetrics = {
        ...mockBaselineMetrics,
        timestamp: new Date(),
        qualityMetrics: {
          ...mockBaselineMetrics.qualityMetrics,
          overallScore: 0.75, // Below warning threshold (0.8)
        },
      };

      const alerts = await driftMonitor.monitorDrift(currentMetrics);
      expect(alerts).toHaveLength(1);
      expect(alerts[0]).toMatchObject({
        severity: "medium",
        type: "quality_degradation",
        modelId: "test-model-1",
        provider: "bedrock",
      });
      expect(alerts[0].message).toContain("Quality degradation detected");
    });

    it("should detect critical quality degradation", async () => {
      const currentMetrics: DriftMetrics = {
        ...mockBaselineMetrics,
        timestamp: new Date(),
        qualityMetrics: {
          ...mockBaselineMetrics.qualityMetrics,
          overallScore: 0.65, // Below critical threshold (0.7)
          toxicityScore: 0.25, // Above critical threshold (0.2)
        },
      };

      const alerts = await driftMonitor.monitorDrift(currentMetrics);
      expect(alerts).toHaveLength(1);
      expect(alerts[0]).toMatchObject({
        severity: "critical",
        type: "quality_degradation",
        modelId: "test-model-1",
        provider: "bedrock",
      });
      expect(alerts[0].message).toContain("Quality degradation detected");
    });

    it("should detect multiple drift types simultaneously", async () => {
      const currentMetrics: DriftMetrics = {
        ...mockBaselineMetrics,
        timestamp: new Date(),
        dataDrift: {
          ...mockBaselineMetrics.dataDrift,
          score: 0.6, // Critical
        },
        promptDrift: {
          ...mockBaselineMetrics.promptDrift,
          driftScore: 0.25, // Warning
        },
        qualityMetrics: {
          ...mockBaselineMetrics.qualityMetrics,
          overallScore: 0.65, // Critical
        },
      };

      const alerts = await driftMonitor.monitorDrift(currentMetrics);
      expect(alerts).toHaveLength(3);

      const alertTypes = alerts.map((alert) => alert.type);
      expect(alertTypes).toContain("data_drift");
      expect(alertTypes).toContain("prompt_drift");
      expect(alertTypes).toContain("quality_degradation");
    });

    it("should publish current metrics to CloudWatch", async () => {
      const currentMetrics: DriftMetrics = {
        ...mockBaselineMetrics,
        timestamp: new Date(),
      };

      await driftMonitor.monitorDrift(currentMetrics);

      // Should have 2 calls: 1 for baseline (from setup), 1 for current metrics
      expect(cloudWatchMock.calls()).toHaveLength(2);

      const currentMetricsCall = cloudWatchMock
        .calls()
        .find((call) => call.args[0].input.Namespace === "AI/Drift/Current");
      expect(currentMetricsCall).toBeDefined();
    });

    it("should throw error when no baseline is set", async () => {
      const monitor = new DriftMonitor(mockCloudWatch, mockSageMaker);
      const currentMetrics: DriftMetrics = {
        ...mockBaselineMetrics,
        modelId: "unknown-model",
        timestamp: new Date(),
      };

      await expect(monitor.monitorDrift(currentMetrics)).rejects.toThrow(
        "No baseline found for model unknown-model"
      );
    });
  });

  describe("onAlert", () => {
    it("should register and call alert callbacks", async () => {
      const alertCallback = jest.fn().mockResolvedValue(undefined);
      driftMonitor.onAlert(alertCallback);

      cloudWatchMock.on(PutMetricDataCommand).resolves({});
      await driftMonitor.setBaseline("test-model-1", mockBaselineMetrics);

      const currentMetrics: DriftMetrics = {
        ...mockBaselineMetrics,
        timestamp: new Date(),
        dataDrift: {
          ...mockBaselineMetrics.dataDrift,
          score: 0.6, // Critical drift
        },
      };

      await driftMonitor.monitorDrift(currentMetrics);

      expect(alertCallback).toHaveBeenCalledTimes(1);
      expect(alertCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: "critical",
          type: "data_drift",
          modelId: "test-model-1",
        })
      );
    });

    it("should handle alert callback errors gracefully", async () => {
      const failingCallback = jest
        .fn()
        .mockRejectedValue(new Error("Callback failed"));
      const successCallback = jest.fn().mockResolvedValue(undefined);

      driftMonitor.onAlert(failingCallback);
      driftMonitor.onAlert(successCallback);

      cloudWatchMock.on(PutMetricDataCommand).resolves({});
      await driftMonitor.setBaseline("test-model-1", mockBaselineMetrics);

      const currentMetrics: DriftMetrics = {
        ...mockBaselineMetrics,
        timestamp: new Date(),
        dataDrift: {
          ...mockBaselineMetrics.dataDrift,
          score: 0.6, // Critical drift
        },
      };

      // Should not throw despite callback failure
      await expect(
        driftMonitor.monitorDrift(currentMetrics)
      ).resolves.not.toThrow();

      expect(failingCallback).toHaveBeenCalledTimes(1);
      expect(successCallback).toHaveBeenCalledTimes(1);
    });
  });

  describe("setupSageMakerMonitor", () => {
    it("should return existing job definition name if it exists", async () => {
      (mockSageMaker.send as jest.Mock).mockResolvedValue({
        JobDefinitionName: "test-model-quality-monitor",
      });

      const result = await driftMonitor.setupSageMakerMonitor(
        "test-model",
        "test-endpoint",
        "s3://bucket/baseline-data"
      );

      expect(result).toBe("test-model-quality-monitor");
      expect(mockSageMaker.send).toHaveBeenCalledTimes(1);
    });

    it("should create new job definition if it does not exist", async () => {
      sageMakerMock
        .on(DescribeModelQualityJobDefinitionCommand)
        .rejects(new Error("Not found"));
      sageMakerMock.on(CreateModelQualityJobDefinitionCommand).resolves({});

      const result = await driftMonitor.setupSageMakerMonitor(
        "test-model",
        "test-endpoint",
        "s3://bucket/baseline-data"
      );

      expect(result).toBe("test-model-quality-monitor");
      expect(sageMakerMock.calls()).toHaveLength(2);

      const createCall = sageMakerMock
        .calls()
        .find(
          (call) =>
            call.args[0].constructor.name ===
            "CreateModelQualityJobDefinitionCommand"
        );
      expect(createCall?.args[0].input).toMatchObject({
        JobDefinitionName: "test-model-quality-monitor",
        ModelQualityJobInput: {
          EndpointInput: {
            EndpointName: "test-endpoint",
          },
          GroundTruthS3Input: {
            S3Uri: "s3://bucket/baseline-data",
          },
        },
      });
    });
  });

  describe("static utility methods", () => {
    describe("calculatePromptDriftScore", () => {
      it("should calculate drift score based on distribution changes", () => {
        const current = {
          mean: 0.8,
          std: 0.2,
          p50: 0.79,
          p95: 0.98,
          p99: 0.99,
        };

        const baseline = {
          mean: 0.75,
          std: 0.15,
          p50: 0.74,
          p95: 0.95,
          p99: 0.98,
        };

        const driftScore = DriftMonitor.calculatePromptDriftScore(
          current,
          baseline
        );
        expect(driftScore).toBeGreaterThan(0);
        expect(driftScore).toBeLessThan(1);
      });

      it("should return 0 for identical distributions", () => {
        const distribution = {
          mean: 0.75,
          std: 0.15,
          p50: 0.74,
          p95: 0.95,
          p99: 0.98,
        };

        const driftScore = DriftMonitor.calculatePromptDriftScore(
          distribution,
          distribution
        );
        expect(driftScore).toBe(0);
      });
    });

    describe("calculateRegressionScore", () => {
      it("should calculate regression for metrics where higher is better", () => {
        const score = DriftMonitor.calculateRegressionScore(0.8, 0.9, true);
        expect(score).toBeCloseTo(0.111, 3); // (0.9 - 0.8) / 0.9
      });

      it("should calculate regression for metrics where lower is better", () => {
        const score = DriftMonitor.calculateRegressionScore(0.2, 0.1, false);
        expect(score).toBeCloseTo(1.0, 3); // (0.2 - 0.1) / 0.1
      });

      it("should return 0 for zero baseline", () => {
        const score = DriftMonitor.calculateRegressionScore(0.5, 0, true);
        expect(score).toBe(0);
      });

      it("should return 0 for improvements", () => {
        const score = DriftMonitor.calculateRegressionScore(0.95, 0.9, true);
        expect(score).toBe(0); // No regression, it's an improvement
      });
    });
  });

  describe("error handling", () => {
    it("should handle CloudWatch errors gracefully", async () => {
      cloudWatchMock
        .on(PutMetricDataCommand)
        .rejects(new Error("CloudWatch error"));

      await expect(
        driftMonitor.setBaseline("test-model-1", mockBaselineMetrics)
      ).rejects.toThrow("CloudWatch error");
    });

    it("should handle SageMaker errors gracefully", async () => {
      sageMakerMock
        .on(DescribeModelQualityJobDefinitionCommand)
        .rejects(new Error("Not found"));
      sageMakerMock
        .on(CreateModelQualityJobDefinitionCommand)
        .rejects(new Error("SageMaker error"));

      await expect(
        driftMonitor.setupSageMakerMonitor(
          "test-model",
          "test-endpoint",
          "s3://bucket/baseline-data"
        )
      ).rejects.toThrow("SageMaker error");
    });
  });

  describe("integration scenarios", () => {
    it("should handle complete drift monitoring workflow", async () => {
      const alertCallback = jest.fn().mockResolvedValue(undefined);
      driftMonitor.onAlert(alertCallback);

      cloudWatchMock.on(PutMetricDataCommand).resolves({});

      // Set baseline
      await driftMonitor.setBaseline("test-model-1", mockBaselineMetrics);

      // Monitor with various drift levels
      const scenarios = [
        {
          name: "no drift",
          metrics: mockBaselineMetrics,
          expectedAlerts: 0,
        },
        {
          name: "warning drift",
          metrics: {
            ...mockBaselineMetrics,
            dataDrift: { ...mockBaselineMetrics.dataDrift, score: 0.35 },
          },
          expectedAlerts: 1,
        },
        {
          name: "critical drift",
          metrics: {
            ...mockBaselineMetrics,
            dataDrift: { ...mockBaselineMetrics.dataDrift, score: 0.6 },
          },
          expectedAlerts: 1,
        },
      ];

      for (const scenario of scenarios) {
        const alerts = await driftMonitor.monitorDrift({
          ...scenario.metrics,
          timestamp: new Date(),
        });

        expect(alerts).toHaveLength(scenario.expectedAlerts);
      }

      // Verify all alerts were sent to callbacks
      expect(alertCallback).toHaveBeenCalledTimes(2); // warning + critical
    });
  });
});
