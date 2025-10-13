/**
 * Tests for AI Quality Monitoring Service
 */

import {
  CloudWatchClient,
  GetMetricStatisticsCommand,
  PutMetricDataCommand,
} from "@aws-sdk/client-cloudwatch";
import { mockClient } from "aws-sdk-client-mock";
import { DriftAlert, DriftMonitor } from "../drift-monitor";
import { QualityAlert, QualityMonitor } from "../quality-monitor";

// Mock AWS clients
const cloudWatchMock = mockClient(CloudWatchClient);

describe("QualityMonitor", () => {
  let qualityMonitor: QualityMonitor;
  let mockDriftMonitor: DriftMonitor;
  let mockCloudWatch: CloudWatchClient;

  beforeEach(() => {
    cloudWatchMock.reset();

    mockCloudWatch = new CloudWatchClient({ region: "eu-central-1" });
    mockDriftMonitor = new DriftMonitor(mockCloudWatch);

    qualityMonitor = new QualityMonitor(mockDriftMonitor, mockCloudWatch);
  });

  describe("constructor", () => {
    it("should initialize with default thresholds", () => {
      expect(qualityMonitor).toBeInstanceOf(QualityMonitor);
    });

    it("should accept custom thresholds", () => {
      const customThresholds = {
        overallScore: {
          warning: 0.8,
          critical: 0.7,
        },
      };

      const monitor = new QualityMonitor(
        mockDriftMonitor,
        mockCloudWatch,
        customThresholds
      );
      expect(monitor).toBeInstanceOf(QualityMonitor);
    });
  });

  describe("assessQuality", () => {
    beforeEach(() => {
      cloudWatchMock.on(PutMetricDataCommand).resolves({});
    });

    it("should assess quality of AI interaction", async () => {
      const assessment = await qualityMonitor.assessQuality(
        "test-model-1",
        "bedrock",
        "req-123",
        "What is the capital of France?",
        "The capital of France is Paris, a beautiful city known for its culture and history.",
        {
          latency: 1200,
          tokenCount: 150,
          cost: 0.05,
        }
      );

      expect(assessment).toMatchObject({
        modelId: "test-model-1",
        provider: "bedrock",
        requestId: "req-123",
        inputQuality: expect.objectContaining({
          clarity: expect.any(Number),
          complexity: expect.any(Number),
          toxicity: expect.any(Number),
          piiRisk: expect.any(Number),
        }),
        outputQuality: expect.objectContaining({
          coherence: expect.any(Number),
          relevance: expect.any(Number),
          factuality: expect.any(Number),
          completeness: expect.any(Number),
          toxicity: expect.any(Number),
          bias: expect.any(Number),
        }),
        performance: {
          latency: 1200,
          tokenCount: 150,
          cost: 0.05,
        },
        overallScore: expect.any(Number),
      });

      expect(assessment.overallScore).toBeGreaterThanOrEqual(0);
      expect(assessment.overallScore).toBeLessThanOrEqual(1);
    });

    it("should include user feedback when provided", async () => {
      const userFeedback = {
        rating: 4,
        helpful: true,
        accurate: true,
        appropriate: true,
      };

      const assessment = await qualityMonitor.assessQuality(
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
        }
      );

      expect(assessment.userFeedback).toEqual(userFeedback);
    });

    it("should publish metrics to CloudWatch", async () => {
      await qualityMonitor.assessQuality(
        "test-model-1",
        "bedrock",
        "req-123",
        "Test input",
        "Test output",
        {
          latency: 1000,
          tokenCount: 100,
          cost: 0.03,
        }
      );

      expect(cloudWatchMock.calls()).toHaveLength(1);
      const call = cloudWatchMock.call(0);
      expect(call.args[0].input).toMatchObject({
        Namespace: "AI/Quality",
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            MetricName: "OverallScore",
            Dimensions: [
              { Name: "ModelId", Value: "test-model-1" },
              { Name: "Provider", Value: "bedrock" },
            ],
          }),
        ]),
      });
    });

    it("should generate quality alerts for poor quality", async () => {
      const alertCallback = jest.fn().mockResolvedValue(undefined);
      qualityMonitor.onAlert(alertCallback);

      // Simulate poor quality output
      await qualityMonitor.assessQuality(
        "test-model-1",
        "bedrock",
        "req-123",
        "What is 2+2?",
        "hate toxic harmful offensive", // High toxicity
        {
          latency: 1000,
          tokenCount: 100,
          cost: 0.03,
        }
      );

      expect(alertCallback).toHaveBeenCalled();
      const alert = alertCallback.mock.calls[0][0] as QualityAlert;
      expect(alert.type).toBe("quality_degradation");
      expect(alert.severity).toBe("critical");
    });

    it("should maintain assessment history", async () => {
      // Add multiple assessments
      for (let i = 0; i < 5; i++) {
        await qualityMonitor.assessQuality(
          "test-model-1",
          "bedrock",
          `req-${i}`,
          "Test input",
          "Test output",
          {
            latency: 1000 + i * 100,
            tokenCount: 100,
            cost: 0.03,
          }
        );
      }

      // History should be maintained (tested indirectly through trends analysis)
      const trends = await qualityMonitor.analyzeQualityTrends("test-model-1", {
        start: new Date(Date.now() - 60000), // 1 minute ago
        end: new Date(),
      });

      expect(trends.statistics.totalAssessments).toBe(5);
    });

    it("should limit assessment history to 1000 entries", async () => {
      // This test would be slow with 1001 assessments, so we'll mock the behavior
      const monitor = new QualityMonitor(mockDriftMonitor, mockCloudWatch);

      // Simulate adding 1001 assessments by directly manipulating the private field
      const assessments = Array.from({ length: 1001 }, (_, i) => ({
        timestamp: new Date(),
        modelId: "test-model-1",
        provider: "bedrock",
        requestId: `req-${i}`,
        inputQuality: {
          clarity: 0.8,
          complexity: 0.5,
          toxicity: 0.1,
          piiRisk: 0.0,
        },
        outputQuality: {
          coherence: 0.8,
          relevance: 0.9,
          factuality: 0.8,
          completeness: 0.7,
          toxicity: 0.1,
          bias: 0.1,
        },
        performance: { latency: 1000, tokenCount: 100, cost: 0.03 },
        overallScore: 0.8,
      }));

      // Access private field for testing
      (monitor as any).assessmentHistory.set("test-model-1", assessments);

      // Add one more assessment
      await monitor.assessQuality(
        "test-model-1",
        "bedrock",
        "req-final",
        "Test input",
        "Test output",
        {
          latency: 1000,
          tokenCount: 100,
          cost: 0.03,
        }
      );

      const history = (monitor as any).assessmentHistory.get("test-model-1");
      expect(history.length).toBe(1000);
    });
  });

  describe("analyzeQualityTrends", () => {
    beforeEach(() => {
      cloudWatchMock.on(PutMetricDataCommand).resolves({});
    });

    it("should analyze quality trends over time", async () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // Add assessments with declining quality over time
      const assessments = [
        {
          score: 0.9,
          timestamp: new Date(oneHourAgo.getTime() + 10 * 60 * 1000),
        },
        {
          score: 0.85,
          timestamp: new Date(oneHourAgo.getTime() + 20 * 60 * 1000),
        },
        {
          score: 0.8,
          timestamp: new Date(oneHourAgo.getTime() + 40 * 60 * 1000),
        },
        {
          score: 0.75,
          timestamp: new Date(oneHourAgo.getTime() + 50 * 60 * 1000),
        },
      ];

      for (const [index, { score, timestamp }] of assessments.entries()) {
        // Mock the timestamp
        jest.spyOn(Date, "now").mockReturnValue(timestamp.getTime());

        await qualityMonitor.assessQuality(
          "test-model-1",
          "bedrock",
          `req-${index}`,
          "Test input",
          "Test output with varying quality",
          {
            latency: 1000,
            tokenCount: 100,
            cost: 0.03,
          }
        );

        jest.restoreAllMocks();
      }

      const trends = await qualityMonitor.analyzeQualityTrends("test-model-1", {
        start: oneHourAgo,
        end: now,
      });

      expect(trends).toMatchObject({
        modelId: "test-model-1",
        timeRange: {
          start: oneHourAgo,
          end: now,
        },
        trends: expect.objectContaining({
          overallQuality: expect.objectContaining({
            current: expect.any(Number),
            previous: expect.any(Number),
            change: expect.any(Number),
            trend: expect.stringMatching(/improving|stable|degrading/),
          }),
        }),
        statistics: expect.objectContaining({
          totalAssessments: 4,
          averageLatency: 1000,
          averageCost: 0.03,
        }),
      });
    });

    it("should throw error when no assessments found", async () => {
      await expect(
        qualityMonitor.analyzeQualityTrends("nonexistent-model", {
          start: new Date(Date.now() - 60000),
          end: new Date(),
        })
      ).rejects.toThrow("No quality assessments found");
    });

    it("should correctly identify improving trends", async () => {
      cloudWatchMock.on(PutMetricDataCommand).resolves({});

      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // Add assessments with improving quality over time
      const assessments = [
        {
          timestamp: new Date(oneHourAgo.getTime() + 10 * 60 * 1000),
          quality: 0.6,
        },
        {
          timestamp: new Date(oneHourAgo.getTime() + 20 * 60 * 1000),
          quality: 0.65,
        },
        {
          timestamp: new Date(oneHourAgo.getTime() + 40 * 60 * 1000),
          quality: 0.8,
        },
        {
          timestamp: new Date(oneHourAgo.getTime() + 50 * 60 * 1000),
          quality: 0.85,
        },
      ];

      for (const [index, { timestamp }] of assessments.entries()) {
        jest.spyOn(Date, "now").mockReturnValue(timestamp.getTime());

        await qualityMonitor.assessQuality(
          "test-model-1",
          "bedrock",
          `req-${index}`,
          "Test input",
          "Test output",
          {
            latency: 1000,
            tokenCount: 100,
            cost: 0.03,
          }
        );

        jest.restoreAllMocks();
      }

      const trends = await qualityMonitor.analyzeQualityTrends("test-model-1", {
        start: oneHourAgo,
        end: now,
      });

      // Should detect improvement (current period better than previous)
      expect(trends.trends.overallQuality.trend).toBe("improving");
    });
  });

  describe("getQualityMetrics", () => {
    it("should retrieve quality metrics from CloudWatch", async () => {
      const mockDatapoints = [
        { Timestamp: new Date("2025-01-01T10:00:00Z"), Average: 0.85 },
        { Timestamp: new Date("2025-01-01T10:05:00Z"), Average: 0.82 },
        { Timestamp: new Date("2025-01-01T10:10:00Z"), Average: 0.88 },
      ];

      cloudWatchMock.on(GetMetricStatisticsCommand).resolves({
        Datapoints: mockDatapoints,
      });

      const metrics = await qualityMonitor.getQualityMetrics(
        "test-model-1",
        "OverallScore",
        {
          start: new Date("2025-01-01T10:00:00Z"),
          end: new Date("2025-01-01T10:15:00Z"),
        }
      );

      expect(metrics).toHaveLength(3);
      expect(metrics[0]).toMatchObject({
        timestamp: new Date("2025-01-01T10:00:00Z"),
        value: 0.85,
      });

      // Should be sorted by timestamp
      expect(metrics[0].timestamp.getTime()).toBeLessThan(
        metrics[1].timestamp.getTime()
      );
    });

    it("should handle empty CloudWatch response", async () => {
      cloudWatchMock.on(GetMetricStatisticsCommand).resolves({
        Datapoints: [],
      });

      const metrics = await qualityMonitor.getQualityMetrics(
        "test-model-1",
        "OverallScore",
        {
          start: new Date("2025-01-01T10:00:00Z"),
          end: new Date("2025-01-01T10:15:00Z"),
        }
      );

      expect(metrics).toHaveLength(0);
    });
  });

  describe("alert handling", () => {
    beforeEach(() => {
      cloudWatchMock.on(PutMetricDataCommand).resolves({});
    });

    it("should register and call alert callbacks", async () => {
      const alertCallback = jest.fn().mockResolvedValue(undefined);
      qualityMonitor.onAlert(alertCallback);

      // Trigger quality alert with poor quality
      await qualityMonitor.assessQuality(
        "test-model-1",
        "bedrock",
        "req-123",
        "Test input",
        "hate toxic harmful offensive always never", // High toxicity and bias
        {
          latency: 1000,
          tokenCount: 100,
          cost: 0.03,
        }
      );

      expect(alertCallback).toHaveBeenCalled();
      const alert = alertCallback.mock.calls[0][0] as QualityAlert;
      expect(alert).toMatchObject({
        type: "quality_degradation",
        modelId: "test-model-1",
        provider: "bedrock",
        severity: "critical",
      });
    });

    it("should handle drift alerts from drift monitor", async () => {
      const alertCallback = jest.fn().mockResolvedValue(undefined);
      qualityMonitor.onAlert(alertCallback);

      // Simulate drift alert
      const driftAlert: DriftAlert = {
        id: "drift-123",
        timestamp: new Date(),
        severity: "critical",
        type: "data_drift",
        modelId: "test-model-1",
        provider: "bedrock",
        message: "Critical data drift detected",
        metrics: {},
        recommendations: ["Review data distribution"],
      };

      // Trigger drift alert through drift monitor
      const driftMonitor = new DriftMonitor();
      const qualityMonitorWithDrift = new QualityMonitor(
        driftMonitor,
        mockCloudWatch
      );
      qualityMonitorWithDrift.onAlert(alertCallback);

      // Manually trigger the drift alert handler
      await (qualityMonitorWithDrift as any).handleDriftAlert(driftAlert);

      expect(alertCallback).toHaveBeenCalled();
      const receivedAlert = alertCallback.mock.calls[0][0] as QualityAlert;
      expect(receivedAlert.id).toContain("drift-quality-");
    });

    it("should handle alert callback errors gracefully", async () => {
      const failingCallback = jest
        .fn()
        .mockRejectedValue(new Error("Callback failed"));
      const successCallback = jest.fn().mockResolvedValue(undefined);

      qualityMonitor.onAlert(failingCallback);
      qualityMonitor.onAlert(successCallback);

      // Should not throw despite callback failure
      await expect(
        qualityMonitor.assessQuality(
          "test-model-1",
          "bedrock",
          "req-123",
          "Test input",
          "hate toxic harmful", // Trigger alert
          {
            latency: 1000,
            tokenCount: 100,
            cost: 0.03,
          }
        )
      ).resolves.not.toThrow();

      expect(failingCallback).toHaveBeenCalled();
      expect(successCallback).toHaveBeenCalled();
    });
  });

  describe("quality assessment methods", () => {
    let monitor: QualityMonitor;

    beforeEach(() => {
      monitor = new QualityMonitor(mockDriftMonitor, mockCloudWatch);
    });

    it("should assess toxicity correctly", () => {
      const toxicText = "This is hate speech with toxic content";
      const cleanText = "This is a normal, helpful response";

      const toxicScore = (monitor as any).assessToxicity(toxicText);
      const cleanScore = (monitor as any).assessToxicity(cleanText);

      expect(toxicScore).toBeGreaterThan(cleanScore);
      expect(toxicScore).toBeGreaterThan(0);
      expect(cleanScore).toBe(0);
    });

    it("should assess PII risk correctly", () => {
      const piiText = "My email is john@example.com and SSN is 123-45-6789";
      const cleanText = "This text contains no personal information";

      const piiScore = (monitor as any).assessPIIRisk(piiText);
      const cleanScore = (monitor as any).assessPIIRisk(cleanText);

      expect(piiScore).toBeGreaterThan(cleanScore);
      expect(piiScore).toBeGreaterThan(0);
      expect(cleanScore).toBe(0);
    });

    it("should assess coherence based on sentence structure", () => {
      const coherentText =
        "This is a well-structured response. It has clear sentences. Each sentence flows logically.";
      const incoherentText =
        "Word. Random text here without structure or meaning fragments incomplete";

      const coherentScore = (monitor as any).assessCoherence(coherentText);
      const incoherentScore = (monitor as any).assessCoherence(incoherentText);

      expect(coherentScore).toBeGreaterThan(incoherentScore);
    });

    it("should assess relevance based on keyword overlap", () => {
      const input = "What is machine learning?";
      const relevantOutput =
        "Machine learning is a subset of artificial intelligence that enables computers to learn";
      const irrelevantOutput =
        "The weather today is sunny and warm with clear skies";

      const relevantScore = (monitor as any).assessRelevance(
        relevantOutput,
        input
      );
      const irrelevantScore = (monitor as any).assessRelevance(
        irrelevantOutput,
        input
      );

      expect(relevantScore).toBeGreaterThan(irrelevantScore);
    });

    it("should assess factuality based on certainty indicators", () => {
      const factualText = "Water is composed of hydrogen and oxygen atoms";
      const uncertainText =
        "Maybe water might possibly contain some elements perhaps";

      const factualScore = (monitor as any).assessFactuality(factualText);
      const uncertainScore = (monitor as any).assessFactuality(uncertainText);

      expect(factualScore).toBeGreaterThan(uncertainScore);
    });

    it("should assess bias based on absolute language", () => {
      const biasedText =
        "All people always behave this way and never do anything else";
      const unbiasedText =
        "Some people often behave this way while others may act differently";

      const biasedScore = (monitor as any).assessBias(biasedText);
      const unbiasedScore = (monitor as any).assessBias(unbiasedText);

      expect(biasedScore).toBeGreaterThan(unbiasedScore);
    });
  });

  describe("error handling", () => {
    it("should handle CloudWatch errors gracefully", async () => {
      cloudWatchMock
        .on(PutMetricDataCommand)
        .rejects(new Error("CloudWatch error"));

      await expect(
        qualityMonitor.assessQuality(
          "test-model-1",
          "bedrock",
          "req-123",
          "Test input",
          "Test output",
          {
            latency: 1000,
            tokenCount: 100,
            cost: 0.03,
          }
        )
      ).rejects.toThrow("CloudWatch error");
    });

    it("should handle GetMetricStatistics errors gracefully", async () => {
      cloudWatchMock
        .on(GetMetricStatisticsCommand)
        .rejects(new Error("Metrics error"));

      await expect(
        qualityMonitor.getQualityMetrics("test-model-1", "OverallScore", {
          start: new Date("2025-01-01T10:00:00Z"),
          end: new Date("2025-01-01T10:15:00Z"),
        })
      ).rejects.toThrow("Metrics error");
    });
  });

  describe("integration scenarios", () => {
    beforeEach(() => {
      cloudWatchMock.on(PutMetricDataCommand).resolves({});
    });

    it("should handle complete quality monitoring workflow", async () => {
      const alertCallback = jest.fn().mockResolvedValue(undefined);
      qualityMonitor.onAlert(alertCallback);

      // Assess various quality levels
      const scenarios = [
        {
          name: "high quality",
          input: "What is the capital of France?",
          output:
            "The capital of France is Paris, a beautiful city known for its rich history and culture.",
          expectedAlerts: 0,
        },
        {
          name: "medium quality",
          input: "Explain quantum physics",
          output:
            "Quantum physics is maybe possibly about small particles that might behave strangely.",
          expectedAlerts: 0, // Should be above warning threshold
        },
        {
          name: "poor quality",
          input: "Help me with my homework",
          output: "hate toxic harmful offensive always never everyone nobody",
          expectedAlerts: 1, // Should trigger toxicity and bias alerts
        },
      ];

      let totalAlerts = 0;
      for (const [index, scenario] of scenarios.entries()) {
        const assessment = await qualityMonitor.assessQuality(
          "test-model-1",
          "bedrock",
          `req-${index}`,
          scenario.input,
          scenario.output,
          {
            latency: 1000 + index * 100,
            tokenCount: 100,
            cost: 0.03,
          }
        );

        expect(assessment.modelId).toBe("test-model-1");
        totalAlerts += scenario.expectedAlerts;
      }

      // Verify alerts were sent
      expect(alertCallback).toHaveBeenCalledTimes(totalAlerts);

      // Analyze trends
      const trends = await qualityMonitor.analyzeQualityTrends("test-model-1", {
        start: new Date(Date.now() - 60000),
        end: new Date(),
      });

      expect(trends.statistics.totalAssessments).toBe(3);
    });
  });
});
