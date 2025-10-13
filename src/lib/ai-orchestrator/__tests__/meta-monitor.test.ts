/**
 * Meta Monitor Tests
 *
 * Comprehensive test suite for Meta Monitor implementation covering
 * execution analysis, pattern detection, feedback generation, and health monitoring.
 */

import { DirectBedrockClient } from "../direct-bedrock-client";
import { IntelligentRouter } from "../intelligent-router";
import {
  ExecutionFeedback,
  FailurePattern,
  KiroExecutionData,
  MetaMonitor,
  MetaMonitorConfig,
} from "../meta-monitor";

// Mock dependencies
jest.mock("../ai-feature-flags");
jest.mock("../direct-bedrock-client");
jest.mock("../intelligent-router");

describe("MetaMonitor", () => {
  let metaMonitor: MetaMonitor;
  let mockDirectBedrockClient: jest.Mocked<DirectBedrockClient>;
  let mockIntelligentRouter: jest.Mocked<IntelligentRouter>;
  let mockConfig: MetaMonitorConfig;

  beforeEach(() => {
    // Create mocks
    mockDirectBedrockClient = {
      executeSupportOperation: jest.fn(),
      getHealthStatus: jest.fn(),
      isAvailable: jest.fn(),
      destroy: jest.fn(),
    } as any;

    mockIntelligentRouter = {
      executeSupportOperation: jest.fn(),
      makeRoutingDecision: jest.fn(),
      checkRouteHealth: jest.fn(),
      destroy: jest.fn(),
    } as any;

    mockConfig = {
      analysisInterval: 1000, // 1 second for testing
      failureThreshold: 2,
      performanceThreshold: 1000,
      retentionPeriod: 60000, // 1 minute for testing
      enableRealTimeAnalysis: true,
      enablePredictiveAnalysis: true,
      maxAnalysisLatency: 5000,
    };

    // Mock feature flags to be enabled
    const mockFeatureFlags = require("../ai-feature-flags").AiFeatureFlags;
    mockFeatureFlags.prototype.isEnabled = jest.fn().mockReturnValue(true);

    metaMonitor = new MetaMonitor(
      mockDirectBedrockClient,
      mockIntelligentRouter,
      mockConfig
    );
  });

  afterEach(() => {
    metaMonitor.destroy();
    jest.clearAllMocks();
  });

  describe("Constructor", () => {
    it("should initialize with default configuration", () => {
      const defaultMonitor = new MetaMonitor(
        mockDirectBedrockClient,
        mockIntelligentRouter
      );

      expect(defaultMonitor).toBeDefined();
      expect(defaultMonitor.getMetrics().totalAnalyses).toBe(0);

      defaultMonitor.destroy();
    });

    it("should merge custom configuration with defaults", () => {
      const customConfig = { analysisInterval: 5000 };
      const customMonitor = new MetaMonitor(
        mockDirectBedrockClient,
        mockIntelligentRouter,
        customConfig
      );

      expect(customMonitor).toBeDefined();
      customMonitor.destroy();
    });
  });

  describe("analyzeKiroExecution", () => {
    const mockExecutionData: KiroExecutionData = {
      executionId: "exec-123",
      timestamp: new Date(),
      operation: "test-operation",
      status: "success",
      latencyMs: 500,
      context: {
        userId: "user-123",
        taskType: "analysis",
        complexity: "medium",
      },
      performance: {
        memoryUsage: 100,
        cpuUsage: 50,
      },
      correlationId: "corr-123",
    };

    it("should analyze successful execution", async () => {
      const mockFeedback: ExecutionFeedback[] = [
        {
          feedbackId: "feedback-123",
          executionId: "exec-123",
          timestamp: new Date(),
          type: "optimization",
          priority: "medium",
          message: "Execution completed successfully",
          actionable: true,
          correlationId: "corr-123",
        },
      ];

      mockIntelligentRouter.executeSupportOperation.mockResolvedValue({
        success: true,
        text: JSON.stringify({
          feedback: [
            {
              type: "optimization",
              priority: "medium",
              message: "Execution completed successfully",
              actionable: true,
            },
          ],
        }),
        operationId: "op-123",
        latencyMs: 100,
        timestamp: new Date(),
      });

      const result = await metaMonitor.analyzeKiroExecution(mockExecutionData);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe("optimization");
      expect(result[0].message).toBe("Execution completed successfully");
      expect(mockIntelligentRouter.executeSupportOperation).toHaveBeenCalled();
    });

    it("should analyze failed execution", async () => {
      const failedExecution: KiroExecutionData = {
        ...mockExecutionData,
        status: "failure",
        error: {
          type: "ValidationError",
          message: "Invalid input parameters",
        },
      };

      mockIntelligentRouter.executeSupportOperation.mockResolvedValue({
        success: true,
        text: JSON.stringify({
          feedback: [
            {
              type: "error_prevention",
              priority: "high",
              message: "Add input validation",
              actionable: true,
              suggestedFix: {
                description: "Implement parameter validation",
                estimatedImpact: "Prevent similar errors",
              },
            },
          ],
        }),
        operationId: "op-123",
        latencyMs: 150,
        timestamp: new Date(),
      });

      const result = await metaMonitor.analyzeKiroExecution(failedExecution);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe("error_prevention");
      expect(result[0].priority).toBe("high");
      expect(result[0].suggestedFix).toBeDefined();
    });

    it("should handle analysis errors gracefully", async () => {
      mockIntelligentRouter.executeSupportOperation.mockRejectedValue(
        new Error("Analysis failed")
      );

      const result = await metaMonitor.analyzeKiroExecution(mockExecutionData);

      expect(result).toEqual([]);
      expect(metaMonitor.getMetrics().failedAnalyses).toBe(1);
    });

    it("should skip analysis when meta monitor is disabled", async () => {
      const mockFeatureFlags = require("../ai-feature-flags").AiFeatureFlags;
      mockFeatureFlags.prototype.isEnabled = jest.fn().mockReturnValue(false);

      const disabledMonitor = new MetaMonitor(
        mockDirectBedrockClient,
        mockIntelligentRouter,
        mockConfig
      );

      const result = await disabledMonitor.analyzeKiroExecution(
        mockExecutionData
      );

      expect(result).toEqual([]);
      expect(
        mockIntelligentRouter.executeSupportOperation
      ).not.toHaveBeenCalled();

      disabledMonitor.destroy();
    });
  });

  describe("detectFailurePatterns", () => {
    beforeEach(() => {
      // Add some failure executions to history
      const failures: KiroExecutionData[] = [
        {
          executionId: "fail-1",
          timestamp: new Date(),
          operation: "data-processing",
          status: "failure",
          latencyMs: 2000,
          context: { taskType: "analysis" },
          error: { type: "TimeoutError", message: "Operation timed out" },
          performance: {},
          correlationId: "corr-1",
        },
        {
          executionId: "fail-2",
          timestamp: new Date(),
          operation: "data-processing",
          status: "failure",
          latencyMs: 2100,
          context: { taskType: "analysis" },
          error: { type: "TimeoutError", message: "Operation timed out" },
          performance: {},
          correlationId: "corr-2",
        },
        {
          executionId: "fail-3",
          timestamp: new Date(),
          operation: "data-processing",
          status: "error",
          latencyMs: 1900,
          context: { taskType: "analysis" },
          error: { type: "TimeoutError", message: "Operation timed out" },
          performance: {},
          correlationId: "corr-3",
        },
      ];

      // Simulate storing failures
      failures.forEach((failure) => {
        metaMonitor.analyzeKiroExecution(failure);
      });
    });

    it("should detect recurring error patterns", async () => {
      mockIntelligentRouter.executeSupportOperation.mockResolvedValue({
        success: true,
        text: JSON.stringify({
          patterns: [
            {
              type: "recurring_error",
              severity: "high",
              description: "Recurring timeout errors in data processing",
              affectedOperations: ["data-processing"],
              commonFactors: { errorType: "TimeoutError" },
              suggestedActions: [
                "Increase timeout limits",
                "Optimize processing",
              ],
              confidence: 0.9,
            },
          ],
        }),
        operationId: "pattern-analysis",
        latencyMs: 200,
        timestamp: new Date(),
      });

      const patterns = await metaMonitor.detectFailurePatterns();

      expect(patterns).toHaveLength(1);
      expect(patterns[0].type).toBe("recurring_error");
      expect(patterns[0].severity).toBe("high");
      expect(patterns[0].confidence).toBe(0.9);
      expect(patterns[0].affectedOperations).toContain("data-processing");
    });

    it("should return empty array when insufficient failures", async () => {
      // Create monitor with higher failure threshold
      const highThresholdConfig = { ...mockConfig, failureThreshold: 10 };
      const highThresholdMonitor = new MetaMonitor(
        mockDirectBedrockClient,
        mockIntelligentRouter,
        highThresholdConfig
      );

      const patterns = await highThresholdMonitor.detectFailurePatterns();

      expect(patterns).toEqual([]);
      expect(
        mockIntelligentRouter.executeSupportOperation
      ).not.toHaveBeenCalled();

      highThresholdMonitor.destroy();
    });

    it("should handle pattern detection errors", async () => {
      mockIntelligentRouter.executeSupportOperation.mockRejectedValue(
        new Error("Pattern detection failed")
      );

      const patterns = await metaMonitor.detectFailurePatterns();

      expect(patterns).toEqual([]);
    });
  });

  describe("generateExecutionFeedback", () => {
    const mockExecutionData: KiroExecutionData = {
      executionId: "exec-feedback",
      timestamp: new Date(),
      operation: "test-operation",
      status: "failure",
      latencyMs: 3000,
      context: { taskType: "processing" },
      error: { type: "ProcessingError", message: "Processing failed" },
      performance: { memoryUsage: 200 },
      correlationId: "corr-feedback",
    };

    const mockPatterns: FailurePattern[] = [
      {
        patternId: "pattern-1",
        type: "performance_degradation",
        severity: "medium",
        frequency: 5,
        firstOccurrence: new Date(),
        lastOccurrence: new Date(),
        affectedOperations: ["test-operation"],
        commonFactors: { highLatency: true },
        suggestedActions: ["Optimize performance"],
        confidence: 0.8,
      },
    ];

    it("should generate actionable feedback", async () => {
      mockIntelligentRouter.executeSupportOperation.mockResolvedValue({
        success: true,
        text: JSON.stringify({
          feedback: [
            {
              type: "performance_improvement",
              priority: "high",
              message: "Optimize processing algorithm",
              actionable: true,
              suggestedFix: {
                description: "Implement caching mechanism",
                estimatedImpact: "50% latency reduction",
              },
            },
          ],
        }),
        operationId: "feedback-gen",
        latencyMs: 120,
        timestamp: new Date(),
      });

      const feedback = await metaMonitor.generateExecutionFeedback(
        mockExecutionData,
        mockPatterns
      );

      expect(feedback).toHaveLength(1);
      expect(feedback[0].type).toBe("performance_improvement");
      expect(feedback[0].priority).toBe("high");
      expect(feedback[0].actionable).toBe(true);
      expect(feedback[0].suggestedFix).toBeDefined();
    });

    it("should handle feedback generation errors", async () => {
      mockIntelligentRouter.executeSupportOperation.mockRejectedValue(
        new Error("Feedback generation failed")
      );

      const feedback = await metaMonitor.generateExecutionFeedback(
        mockExecutionData,
        mockPatterns
      );

      expect(feedback).toEqual([]);
    });
  });

  describe("performComprehensiveAnalysis", () => {
    beforeEach(() => {
      // Mock successful responses for all analysis steps
      mockIntelligentRouter.executeSupportOperation
        .mockResolvedValueOnce({
          // Pattern detection response
          success: true,
          text: JSON.stringify({
            patterns: [
              {
                type: "performance_degradation",
                severity: "medium",
                description: "Latency increasing over time",
                affectedOperations: ["test-op"],
                commonFactors: {},
                suggestedActions: ["Optimize queries"],
                confidence: 0.7,
              },
            ],
          }),
          operationId: "pattern-1",
          latencyMs: 100,
          timestamp: new Date(),
        })
        .mockResolvedValueOnce({
          // Feedback generation response
          success: true,
          text: JSON.stringify({
            feedback: [
              {
                type: "optimization",
                priority: "medium",
                message: "Consider optimization",
                actionable: true,
              },
            ],
          }),
          operationId: "feedback-1",
          latencyMs: 80,
          timestamp: new Date(),
        })
        .mockResolvedValueOnce({
          // Recommendations response
          success: true,
          text: JSON.stringify({
            immediate: ["Check system resources"],
            shortTerm: ["Implement caching"],
            longTerm: ["Redesign architecture"],
          }),
          operationId: "recommendations-1",
          latencyMs: 150,
          timestamp: new Date(),
        });
    });

    it("should perform comprehensive analysis", async () => {
      const result = await metaMonitor.performComprehensiveAnalysis();

      expect(result).toBeDefined();
      expect(result.analysisId).toBeDefined();
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.healthScore).toBeGreaterThanOrEqual(0);
      expect(result.healthScore).toBeLessThanOrEqual(100);
      expect(result.recommendations).toBeDefined();
      expect(result.recommendations.immediate).toContain(
        "Check system resources"
      );
    });

    it("should handle analysis errors gracefully", async () => {
      mockIntelligentRouter.executeSupportOperation.mockRejectedValue(
        new Error("Analysis failed")
      );

      const result = await metaMonitor.performComprehensiveAnalysis();

      expect(result).toBeDefined();
      expect(result.healthScore).toBe(0);
      expect(result.detectedPatterns).toEqual([]);
      expect(result.generatedFeedback).toEqual([]);
    });
  });

  describe("Health Status and Metrics", () => {
    it("should return health status", () => {
      const health = metaMonitor.getHealthStatus();

      expect(health).toBeDefined();
      expect(health.isHealthy).toBeDefined();
      expect(health.executionCount).toBeDefined();
      expect(health.successRate).toBeDefined();
      expect(health.metrics).toBeDefined();
    });

    it("should return metrics", () => {
      const metrics = metaMonitor.getMetrics();

      expect(metrics).toBeDefined();
      expect(metrics.totalAnalyses).toBeDefined();
      expect(metrics.patternsDetected).toBeDefined();
      expect(metrics.feedbackGenerated).toBeDefined();
      expect(metrics.executionHistorySize).toBeDefined();
    });

    it("should update metrics on successful analysis", async () => {
      mockIntelligentRouter.executeSupportOperation.mockResolvedValue({
        success: true,
        text: JSON.stringify({ feedback: [] }),
        operationId: "test",
        latencyMs: 100,
        timestamp: new Date(),
      });

      const mockExecution: KiroExecutionData = {
        executionId: "test-exec",
        timestamp: new Date(),
        operation: "test",
        status: "success",
        latencyMs: 100,
        context: {},
        performance: {},
        correlationId: "test-corr",
      };

      await metaMonitor.analyzeKiroExecution(mockExecution);

      const metrics = metaMonitor.getMetrics();
      expect(metrics.totalAnalyses).toBe(1);
      expect(metrics.successfulAnalyses).toBe(1);
    });
  });

  describe("Resource Management", () => {
    it("should cleanup resources on destroy", () => {
      const metrics = metaMonitor.getMetrics();
      expect(metrics.executionHistorySize).toBeGreaterThanOrEqual(0);

      metaMonitor.destroy();

      // After destroy, metrics should show empty state
      const postDestroyMetrics = metaMonitor.getMetrics();
      expect(postDestroyMetrics.executionHistorySize).toBe(0);
    });

    it("should handle multiple destroy calls safely", () => {
      expect(() => {
        metaMonitor.destroy();
        metaMonitor.destroy();
      }).not.toThrow();
    });
  });

  describe("Configuration Validation", () => {
    it("should work with minimal configuration", () => {
      const minimalMonitor = new MetaMonitor(
        mockDirectBedrockClient,
        mockIntelligentRouter,
        { analysisInterval: 1000 }
      );

      expect(minimalMonitor).toBeDefined();
      expect(minimalMonitor.getHealthStatus()).toBeDefined();

      minimalMonitor.destroy();
    });

    it("should handle invalid configuration gracefully", () => {
      const invalidConfig = {
        analysisInterval: -1000,
        failureThreshold: -1,
      } as any;

      expect(() => {
        const invalidMonitor = new MetaMonitor(
          mockDirectBedrockClient,
          mockIntelligentRouter,
          invalidConfig
        );
        invalidMonitor.destroy();
      }).not.toThrow();
    });
  });
});
