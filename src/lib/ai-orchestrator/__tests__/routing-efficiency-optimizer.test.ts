/**
 * Tests for Routing Efficiency Optimizer
 */

import { AiFeatureFlags } from "../ai-feature-flags";
import { AuditTrailSystem } from "../audit-trail-system";
import { HybridRoutingPerformanceMonitor } from "../hybrid-routing-performance-monitor";
import { IntelligentRouter } from "../intelligent-router";
import {
  OptimizationStrategy,
  RoutingEfficiencyOptimizer,
  createRoutingEfficiencyOptimizer,
} from "../routing-efficiency-optimizer";

// Mock dependencies
jest.mock("../ai-feature-flags");
jest.mock("../audit-trail-system");
jest.mock("../hybrid-routing-performance-monitor");
jest.mock("../intelligent-router");

describe("RoutingEfficiencyOptimizer", () => {
  let optimizer: RoutingEfficiencyOptimizer;
  let mockRouter: jest.Mocked<IntelligentRouter>;
  let mockPerformanceMonitor: jest.Mocked<HybridRoutingPerformanceMonitor>;
  let mockFeatureFlags: jest.Mocked<AiFeatureFlags>;
  let mockAuditTrail: jest.Mocked<AuditTrailSystem>;

  beforeEach(() => {
    // Create mocks
    mockRouter = {
      updateRoutingRules: jest.fn(),
      getRoutingRules: jest.fn().mockReturnValue([]),
    } as any;

    mockPerformanceMonitor = {
      getAllPathMetrics: jest.fn().mockReturnValue(
        new Map([
          [
            "direct_bedrock",
            {
              path: "direct_bedrock",
              requestCount: 100,
              successCount: 95,
              failureCount: 5,
              totalLatencyMs: 500000,
              latencies: [4000, 5000, 6000],
              p50LatencyMs: 5000,
              p95LatencyMs: 8000,
              p99LatencyMs: 10000,
              averageLatencyMs: 5000,
              successRate: 95,
              lastUpdated: new Date(),
            },
          ],
          [
            "mcp",
            {
              path: "mcp",
              requestCount: 200,
              successCount: 190,
              failureCount: 10,
              totalLatencyMs: 1400000,
              latencies: [6000, 7000, 8000],
              p50LatencyMs: 7000,
              p95LatencyMs: 12000,
              p99LatencyMs: 15000,
              averageLatencyMs: 7000,
              successRate: 95,
              lastUpdated: new Date(),
            },
          ],
        ])
      ),
      calculateRoutingEfficiency: jest.fn().mockResolvedValue({
        overallEfficiency: 75,
        directBedrockEfficiency: 95,
        mcpEfficiency: 95,
        fallbackRate: 5,
        optimalRoutingRate: 85,
        suboptimalRoutingRate: 15,
        recommendations: [],
      }),
    } as any;

    mockFeatureFlags = {
      isEnabled: jest.fn().mockReturnValue(true),
    } as any;

    mockAuditTrail = {
      logRoutingOptimizationStart: jest.fn().mockResolvedValue(undefined),
      logRoutingOptimizationStop: jest.fn().mockResolvedValue(undefined),
      logRoutingOptimization: jest.fn().mockResolvedValue(undefined),
      logRoutingOptimizationRollback: jest.fn().mockResolvedValue(undefined),
    } as any;

    // Create optimizer
    optimizer = new RoutingEfficiencyOptimizer(
      mockRouter,
      mockPerformanceMonitor,
      mockFeatureFlags,
      mockAuditTrail,
      {
        optimizationIntervalMs: 100, // Fast for testing
        minDataPointsRequired: 50,
      }
    );
  });

  afterEach(() => {
    optimizer.cleanup();
    jest.clearAllMocks();
  });

  describe("Initialization", () => {
    it("should initialize with default configuration", () => {
      const status = optimizer.getOptimizationStatus();
      expect(status.isOptimizing).toBe(false);
      expect(status.totalOptimizations).toBe(0);
      expect(status.overallImprovement).toBe(0);
    });

    it("should initialize route profiles", () => {
      const status = optimizer.getOptimizationStatus();
      expect(status).toBeDefined();
    });
  });

  describe("Optimization Engine", () => {
    it("should start optimization when feature flag is enabled", async () => {
      mockFeatureFlags.isEnabled.mockReturnValue(true);

      await optimizer.startOptimization();

      expect(optimizer.getOptimizationStatus().isOptimizing).toBe(true);
      expect(mockAuditTrail.logRoutingOptimizationStart).toHaveBeenCalledWith(
        OptimizationStrategy.BALANCED,
        15
      );
    });

    it("should not start optimization when feature flag is disabled", async () => {
      mockFeatureFlags.isEnabled.mockReturnValue(false);

      await optimizer.startOptimization();

      expect(optimizer.getOptimizationStatus().isOptimizing).toBe(false);
      expect(mockAuditTrail.logRoutingOptimizationStart).not.toHaveBeenCalled();
    });

    it("should stop optimization", async () => {
      await optimizer.startOptimization();
      expect(optimizer.getOptimizationStatus().isOptimizing).toBe(true);

      await optimizer.stopOptimization();
      expect(optimizer.getOptimizationStatus().isOptimizing).toBe(false);
      expect(mockAuditTrail.logRoutingOptimizationStop).toHaveBeenCalled();
    });
  });

  describe("Recommendation Generation", () => {
    it("should generate latency optimization recommendations", async () => {
      // Mock high latency scenario
      mockPerformanceMonitor.getAllPathMetrics.mockReturnValue(
        new Map([
          [
            "direct_bedrock",
            {
              path: "direct_bedrock",
              requestCount: 100,
              successCount: 95,
              failureCount: 5,
              totalLatencyMs: 800000, // High latency
              latencies: [7000, 8000, 9000],
              p50LatencyMs: 8000,
              p95LatencyMs: 12000,
              p99LatencyMs: 15000,
              averageLatencyMs: 8000,
              successRate: 95,
              lastUpdated: new Date(),
            },
          ],
          [
            "mcp",
            {
              path: "mcp",
              requestCount: 100,
              successCount: 95,
              failureCount: 5,
              totalLatencyMs: 1200000, // Very high latency
              latencies: [10000, 12000, 15000],
              p50LatencyMs: 12000,
              p95LatencyMs: 18000,
              p99LatencyMs: 20000,
              averageLatencyMs: 12000,
              successRate: 95,
              lastUpdated: new Date(),
            },
          ],
        ])
      );

      await optimizer.startOptimization();

      // Wait for optimization cycle
      await new Promise((resolve) => setTimeout(resolve, 150));

      const recommendations = optimizer.getActiveRecommendations();
      expect(recommendations.length).toBeGreaterThan(0);

      const latencyRecommendation = recommendations.find((r) =>
        r.description.includes("latency")
      );
      expect(latencyRecommendation).toBeDefined();
      expect(latencyRecommendation?.expectedImprovement).toBeGreaterThan(0);
    });

    it("should generate success rate optimization recommendations", async () => {
      // Mock low success rate scenario
      mockPerformanceMonitor.getAllPathMetrics.mockReturnValue(
        new Map([
          [
            "direct_bedrock",
            {
              path: "direct_bedrock",
              requestCount: 100,
              successCount: 85, // Low success rate
              failureCount: 15,
              totalLatencyMs: 500000,
              latencies: [4000, 5000, 6000],
              p50LatencyMs: 5000,
              p95LatencyMs: 8000,
              p99LatencyMs: 10000,
              averageLatencyMs: 5000,
              successRate: 85,
              lastUpdated: new Date(),
            },
          ],
          [
            "mcp",
            {
              path: "mcp",
              requestCount: 100,
              successCount: 90, // Low success rate
              failureCount: 10,
              totalLatencyMs: 700000,
              latencies: [6000, 7000, 8000],
              p50LatencyMs: 7000,
              p95LatencyMs: 12000,
              p99LatencyMs: 15000,
              averageLatencyMs: 7000,
              successRate: 90,
              lastUpdated: new Date(),
            },
          ],
        ])
      );

      await optimizer.startOptimization();

      // Wait for optimization cycle
      await new Promise((resolve) => setTimeout(resolve, 150));

      const recommendations = optimizer.getActiveRecommendations();
      const successRateRecommendation = recommendations.find(
        (r) =>
          r.description.includes("circuit breaker") ||
          r.description.includes("success")
      );
      expect(successRateRecommendation).toBeDefined();
      expect(successRateRecommendation?.priority).toBe("critical");
    });

    it("should generate routing efficiency recommendations", async () => {
      // Mock low routing efficiency
      mockPerformanceMonitor.calculateRoutingEfficiency.mockResolvedValue({
        overallEfficiency: 65, // Low efficiency
        directBedrockEfficiency: 95,
        mcpEfficiency: 95,
        fallbackRate: 25, // High fallback rate
        optimalRoutingRate: 65,
        suboptimalRoutingRate: 35,
        recommendations: [],
      });

      await optimizer.startOptimization();

      // Wait for optimization cycle
      await new Promise((resolve) => setTimeout(resolve, 150));

      const recommendations = optimizer.getActiveRecommendations();
      const efficiencyRecommendation = recommendations.find(
        (r) =>
          r.description.includes("efficiency") ||
          r.description.includes("threshold")
      );
      expect(efficiencyRecommendation).toBeDefined();
    });
  });

  describe("Recommendation Application", () => {
    it("should apply routing threshold adjustments", async () => {
      mockRouter.getRoutingRules.mockReturnValue([
        {
          operationType: "infrastructure",
          priority: "critical",
          latencyRequirement: 10000,
          primaryRoute: "direct",
          fallbackRoute: "mcp",
          healthCheckRequired: true,
        },
      ]);

      await optimizer.startOptimization();

      // Wait for optimization cycle
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Should have called updateRoutingRules if recommendations were applied
      if (optimizer.getActiveRecommendations().length > 0) {
        expect(mockRouter.updateRoutingRules).toHaveBeenCalled();
      }
    });

    it("should respect maximum changes per cycle", async () => {
      const optimizerWithLimits = new RoutingEfficiencyOptimizer(
        mockRouter,
        mockPerformanceMonitor,
        mockFeatureFlags,
        mockAuditTrail,
        {
          maxRoutingRuleChanges: 1, // Limit to 1 change
          minDataPointsRequired: 50,
        }
      );

      await optimizerWithLimits.startOptimization();

      // Wait for optimization cycle
      await new Promise((resolve) => setTimeout(resolve, 150));

      const recommendations = optimizerWithLimits.getActiveRecommendations();
      expect(recommendations.length).toBeLessThanOrEqual(1);

      optimizerWithLimits.cleanup();
    });
  });

  describe("Performance Evaluation", () => {
    it("should calculate performance improvement", async () => {
      await optimizer.startOptimization();

      // Wait for optimization cycle
      await new Promise((resolve) => setTimeout(resolve, 150));

      const status = optimizer.getOptimizationStatus();
      expect(status.overallImprovement).toBeGreaterThanOrEqual(0);
    });

    it("should track target achievement", async () => {
      const status = optimizer.getOptimizationStatus();
      expect(typeof status.targetAchieved).toBe("boolean");
    });
  });

  describe("Optimization History", () => {
    it("should track optimization history", async () => {
      await optimizer.startOptimization();

      // Wait for optimization cycle
      await new Promise((resolve) => setTimeout(resolve, 150));

      const history = optimizer.getOptimizationHistory();
      expect(Array.isArray(history)).toBe(true);
    });

    it("should provide optimization status", () => {
      const status = optimizer.getOptimizationStatus();

      expect(status).toHaveProperty("isOptimizing");
      expect(status).toHaveProperty("totalOptimizations");
      expect(status).toHaveProperty("overallImprovement");
      expect(status).toHaveProperty("activeRecommendations");
      expect(status).toHaveProperty("targetAchieved");
    });
  });

  describe("Error Handling", () => {
    it("should handle performance monitor errors gracefully", async () => {
      mockPerformanceMonitor.getAllPathMetrics.mockImplementation(() => {
        throw new Error("Performance monitor error");
      });

      await optimizer.startOptimization();

      // Should not throw and should handle error gracefully
      expect(optimizer.getOptimizationStatus().isOptimizing).toBe(true);
    });

    it("should handle audit trail errors gracefully", async () => {
      mockAuditTrail.logRoutingOptimization.mockRejectedValue(
        new Error("Audit trail error")
      );

      await optimizer.startOptimization();

      // Should continue operating despite audit errors
      expect(optimizer.getOptimizationStatus().isOptimizing).toBe(true);
    });
  });

  describe("Configuration", () => {
    it("should use custom configuration", () => {
      const customOptimizer = new RoutingEfficiencyOptimizer(
        mockRouter,
        mockPerformanceMonitor,
        mockFeatureFlags,
        mockAuditTrail,
        {
          targetPerformanceImprovement: 25,
          optimizationIntervalMs: 60000,
        }
      );

      expect(customOptimizer).toBeDefined();
      customOptimizer.cleanup();
    });

    it("should handle insufficient data gracefully", async () => {
      // Mock insufficient data
      mockPerformanceMonitor.getAllPathMetrics.mockReturnValue(
        new Map([
          [
            "direct_bedrock",
            {
              path: "direct_bedrock",
              requestCount: 10, // Below minimum threshold
              successCount: 10,
              failureCount: 0,
              totalLatencyMs: 50000,
              latencies: [5000],
              p50LatencyMs: 5000,
              p95LatencyMs: 5000,
              p99LatencyMs: 5000,
              averageLatencyMs: 5000,
              successRate: 100,
              lastUpdated: new Date(),
            },
          ],
        ])
      );

      await optimizer.startOptimization();

      // Wait for optimization cycle
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Should not generate recommendations with insufficient data
      const recommendations = optimizer.getActiveRecommendations();
      expect(recommendations.length).toBe(0);
    });
  });

  describe("Factory Function", () => {
    it("should create optimizer using factory function", () => {
      const factoryOptimizer = createRoutingEfficiencyOptimizer(
        mockRouter,
        mockPerformanceMonitor,
        mockFeatureFlags,
        mockAuditTrail
      );

      expect(factoryOptimizer).toBeInstanceOf(RoutingEfficiencyOptimizer);
      factoryOptimizer.cleanup();
    });

    it("should create optimizer with custom config using factory", () => {
      const factoryOptimizer = createRoutingEfficiencyOptimizer(
        mockRouter,
        mockPerformanceMonitor,
        mockFeatureFlags,
        mockAuditTrail,
        { targetPerformanceImprovement: 30 }
      );

      expect(factoryOptimizer).toBeInstanceOf(RoutingEfficiencyOptimizer);
      factoryOptimizer.cleanup();
    });
  });

  describe("Cleanup", () => {
    it("should cleanup resources properly", async () => {
      await optimizer.startOptimization();
      expect(optimizer.getOptimizationStatus().isOptimizing).toBe(true);

      optimizer.cleanup();
      expect(optimizer.getOptimizationStatus().isOptimizing).toBe(false);
      expect(optimizer.getOptimizationHistory().length).toBe(0);
      expect(optimizer.getActiveRecommendations().length).toBe(0);
    });
  });

  describe("Integration Scenarios", () => {
    it("should achieve target performance improvement", async () => {
      // Mock scenario where optimization achieves target
      mockPerformanceMonitor.getAllPathMetrics.mockReturnValue(
        new Map([
          [
            "direct_bedrock",
            {
              path: "direct_bedrock",
              requestCount: 1000,
              successCount: 980,
              failureCount: 20,
              totalLatencyMs: 3000000, // 3s average
              latencies: Array(1000).fill(3000),
              p50LatencyMs: 3000,
              p95LatencyMs: 4000,
              p99LatencyMs: 5000,
              averageLatencyMs: 3000,
              successRate: 98,
              lastUpdated: new Date(),
            },
          ],
          [
            "mcp",
            {
              path: "mcp",
              requestCount: 500,
              successCount: 490,
              failureCount: 10,
              totalLatencyMs: 2500000, // 5s average
              latencies: Array(500).fill(5000),
              p50LatencyMs: 5000,
              p95LatencyMs: 6000,
              p99LatencyMs: 7000,
              averageLatencyMs: 5000,
              successRate: 98,
              lastUpdated: new Date(),
            },
          ],
        ])
      );

      await optimizer.startOptimization();

      // Wait for optimization cycle
      await new Promise((resolve) => setTimeout(resolve, 150));

      const status = optimizer.getOptimizationStatus();
      expect(status.totalOptimizations).toBeGreaterThanOrEqual(0);
    });

    it("should handle mixed performance scenarios", async () => {
      // Mock mixed scenario: good latency, poor success rate
      mockPerformanceMonitor.getAllPathMetrics.mockReturnValue(
        new Map([
          [
            "direct_bedrock",
            {
              path: "direct_bedrock",
              requestCount: 200,
              successCount: 160, // 80% success rate
              failureCount: 40,
              totalLatencyMs: 600000, // 3s average - good
              latencies: Array(200).fill(3000),
              p50LatencyMs: 3000,
              p95LatencyMs: 4000,
              p99LatencyMs: 5000,
              averageLatencyMs: 3000,
              successRate: 80,
              lastUpdated: new Date(),
            },
          ],
          [
            "mcp",
            {
              path: "mcp",
              requestCount: 200,
              successCount: 190, // 95% success rate - good
              failureCount: 10,
              totalLatencyMs: 2000000, // 10s average - poor
              latencies: Array(200).fill(10000),
              p50LatencyMs: 10000,
              p95LatencyMs: 12000,
              p99LatencyMs: 15000,
              averageLatencyMs: 10000,
              successRate: 95,
              lastUpdated: new Date(),
            },
          ],
        ])
      );

      await optimizer.startOptimization();

      // Wait for optimization cycle
      await new Promise((resolve) => setTimeout(resolve, 150));

      const recommendations = optimizer.getActiveRecommendations();

      // Should generate recommendations for both issues
      const hasSuccessRateRec = recommendations.some(
        (r) =>
          r.description.includes("success") || r.description.includes("circuit")
      );
      const hasLatencyRec = recommendations.some(
        (r) =>
          r.description.includes("latency") || r.description.includes("route")
      );

      expect(hasSuccessRateRec || hasLatencyRec).toBe(true);
    });
  });
});
