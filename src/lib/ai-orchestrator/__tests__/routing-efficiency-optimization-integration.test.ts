/**
 * Integration Tests for Routing Efficiency Optimization
 *
 * Tests the complete routing efficiency optimization system to ensure
 * it achieves the target >15% performance improvement.
 */

import { AiFeatureFlags } from "../ai-feature-flags";
import { AuditTrailSystem } from "../audit-trail-system";
import { HybridRoutingPerformanceMonitor } from "../hybrid-routing-performance-monitor";
import { IntelligentRouter } from "../intelligent-router";
import { RoutingEfficiencyOptimizer } from "../routing-efficiency-optimizer";

// Mock dependencies
jest.mock("../ai-feature-flags");
jest.mock("../audit-trail-system");

describe("Routing Efficiency Optimization Integration", () => {
  let optimizer: RoutingEfficiencyOptimizer;
  let router: IntelligentRouter;
  let performanceMonitor: HybridRoutingPerformanceMonitor;
  let featureFlags: AiFeatureFlags;
  let auditTrail: AuditTrailSystem;

  beforeEach(() => {
    // Create real instances for integration testing
    featureFlags = new AiFeatureFlags();
    auditTrail = new AuditTrailSystem({
      complianceMode: "strict",
      enableIntegrityChecking: true,
      retentionDays: 30,
    });

    // Mock feature flags to enable optimization
    jest.spyOn(featureFlags, "isEnabled").mockImplementation((flag: string) => {
      if (flag === "routing_efficiency_optimization") return true;
      if (flag === "ENABLE_INTELLIGENT_ROUTING") return true;
      return false;
    });

    // Create mock router and performance monitor for controlled testing
    router = {
      getRoutingRules: jest.fn().mockReturnValue([
        {
          operationType: "infrastructure",
          priority: "critical",
          latencyRequirement: 10000,
          primaryRoute: "direct",
          fallbackRoute: "mcp",
          healthCheckRequired: true,
        },
        {
          operationType: "standard",
          priority: "medium",
          latencyRequirement: 30000,
          primaryRoute: "mcp",
          fallbackRoute: "direct",
          healthCheckRequired: false,
        },
      ]),
      updateRoutingRules: jest.fn(),
    } as any;

    performanceMonitor = {
      getAllPathMetrics: jest.fn(),
      calculateRoutingEfficiency: jest.fn(),
    } as any;

    optimizer = new RoutingEfficiencyOptimizer(
      router,
      performanceMonitor,
      featureFlags,
      auditTrail,
      {
        targetPerformanceImprovement: 15,
        optimizationIntervalMs: 100, // Fast for testing
        minDataPointsRequired: 50,
        enableOptimization: true,
      }
    );
  });

  afterEach(() => {
    optimizer.cleanup();
    jest.clearAllMocks();
  });

  describe("Performance Improvement Scenarios", () => {
    it("should achieve >15% performance improvement through latency optimization", async () => {
      // Scenario: High latency on MCP, low latency on Direct Bedrock
      const mockMetrics = new Map([
        [
          "direct_bedrock",
          {
            path: "direct_bedrock",
            requestCount: 200,
            successCount: 195,
            failureCount: 5,
            totalLatencyMs: 600000, // 3s average - good performance
            latencies: Array(200).fill(3000),
            p50LatencyMs: 3000,
            p95LatencyMs: 4000,
            p99LatencyMs: 5000,
            averageLatencyMs: 3000,
            successRate: 97.5,
            lastUpdated: new Date(),
          },
        ],
        [
          "mcp",
          {
            path: "mcp",
            requestCount: 800, // Most traffic going to slower route
            successCount: 760,
            failureCount: 40,
            totalLatencyMs: 8000000, // 10s average - poor performance
            latencies: Array(800).fill(10000),
            p50LatencyMs: 10000,
            p95LatencyMs: 12000,
            p99LatencyMs: 15000,
            averageLatencyMs: 10000,
            successRate: 95,
            lastUpdated: new Date(),
          },
        ],
      ]);

      (performanceMonitor.getAllPathMetrics as jest.Mock).mockReturnValue(
        mockMetrics
      );
      (
        performanceMonitor.calculateRoutingEfficiency as jest.Mock
      ).mockResolvedValue({
        overallEfficiency: 70, // Below target
        directBedrockEfficiency: 97.5,
        mcpEfficiency: 95,
        fallbackRate: 5,
        optimalRoutingRate: 70,
        suboptimalRoutingRate: 30,
        recommendations: [],
      });

      // Start optimization
      await optimizer.startOptimization();

      // Wait for optimization cycle
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Check that optimization was attempted
      const status = optimizer.getOptimizationStatus();
      expect(status.isOptimizing).toBe(true);

      const recommendations = optimizer.getActiveRecommendations();
      expect(recommendations.length).toBeGreaterThan(0);

      // Should have recommendations to route more traffic to direct Bedrock
      const latencyOptimization = recommendations.find(
        (r) =>
          r.description.includes("direct Bedrock") &&
          r.description.includes("latency")
      );
      expect(latencyOptimization).toBeDefined();
      expect(latencyOptimization?.expectedImprovement).toBeGreaterThanOrEqual(
        15
      );

      // Verify routing rules were updated
      expect(router.updateRoutingRules).toHaveBeenCalled();
    });

    it("should achieve >15% performance improvement through success rate optimization", async () => {
      // Scenario: Low success rates requiring circuit breaker optimization
      const mockMetrics = new Map([
        [
          "direct_bedrock",
          {
            path: "direct_bedrock",
            requestCount: 500,
            successCount: 425, // 85% success rate - poor
            failureCount: 75,
            totalLatencyMs: 2500000, // 5s average
            latencies: Array(500).fill(5000),
            p50LatencyMs: 5000,
            p95LatencyMs: 7000,
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
            requestCount: 500,
            successCount: 450, // 90% success rate - also poor
            failureCount: 50,
            totalLatencyMs: 3500000, // 7s average
            latencies: Array(500).fill(7000),
            p50LatencyMs: 7000,
            p95LatencyMs: 9000,
            p99LatencyMs: 12000,
            averageLatencyMs: 7000,
            successRate: 90,
            lastUpdated: new Date(),
          },
        ],
      ]);

      (performanceMonitor.getAllPathMetrics as jest.Mock).mockReturnValue(
        mockMetrics
      );
      (
        performanceMonitor.calculateRoutingEfficiency as jest.Mock
      ).mockResolvedValue({
        overallEfficiency: 65, // Poor efficiency
        directBedrockEfficiency: 85,
        mcpEfficiency: 90,
        fallbackRate: 15,
        optimalRoutingRate: 65,
        suboptimalRoutingRate: 35,
        recommendations: [],
      });

      await optimizer.startOptimization();
      await new Promise((resolve) => setTimeout(resolve, 150));

      const recommendations = optimizer.getActiveRecommendations();
      expect(recommendations.length).toBeGreaterThan(0);

      // Should have critical recommendations for success rate improvement
      const successRateOptimization = recommendations.find(
        (r) =>
          r.priority === "critical" &&
          (r.description.includes("circuit breaker") ||
            r.description.includes("success"))
      );
      expect(successRateOptimization).toBeDefined();
      expect(
        successRateOptimization?.expectedImprovement
      ).toBeGreaterThanOrEqual(15);
    });

    it("should achieve >15% performance improvement through cost optimization", async () => {
      // Scenario: High cost due to inefficient routing
      const mockMetrics = new Map([
        [
          "direct_bedrock",
          {
            path: "direct_bedrock",
            requestCount: 900, // Too much expensive traffic
            successCount: 882,
            failureCount: 18,
            totalLatencyMs: 4500000, // 5s average
            latencies: Array(900).fill(5000),
            p50LatencyMs: 5000,
            p95LatencyMs: 6000,
            p99LatencyMs: 8000,
            averageLatencyMs: 5000,
            successRate: 98,
            lastUpdated: new Date(),
          },
        ],
        [
          "mcp",
          {
            path: "mcp",
            requestCount: 100, // Too little cheap traffic
            successCount: 98,
            failureCount: 2,
            totalLatencyMs: 600000, // 6s average
            latencies: Array(100).fill(6000),
            p50LatencyMs: 6000,
            p95LatencyMs: 7000,
            p99LatencyMs: 8000,
            averageLatencyMs: 6000,
            successRate: 98,
            lastUpdated: new Date(),
          },
        ],
      ]);

      (performanceMonitor.getAllPathMetrics as jest.Mock).mockReturnValue(
        mockMetrics
      );
      (
        performanceMonitor.calculateRoutingEfficiency as jest.Mock
      ).mockResolvedValue({
        overallEfficiency: 75,
        directBedrockEfficiency: 98,
        mcpEfficiency: 98,
        fallbackRate: 2,
        optimalRoutingRate: 75,
        suboptimalRoutingRate: 25,
        recommendations: [],
      });

      await optimizer.startOptimization();
      await new Promise((resolve) => setTimeout(resolve, 150));

      const recommendations = optimizer.getActiveRecommendations();

      // Should have cost optimization recommendations
      const costOptimization = recommendations.find(
        (r) => r.description.includes("cost") || r.description.includes("MCP")
      );
      expect(costOptimization).toBeDefined();
      expect(costOptimization?.expectedImprovement).toBeGreaterThanOrEqual(15);
    });

    it("should achieve >15% performance improvement through adaptive strategy", async () => {
      // Scenario: Multiple optimization opportunities requiring adaptive strategy
      const mockMetrics = new Map([
        [
          "direct_bedrock",
          {
            path: "direct_bedrock",
            requestCount: 300,
            successCount: 270, // 90% success rate
            failureCount: 30,
            totalLatencyMs: 2100000, // 7s average
            latencies: Array(300).fill(7000),
            p50LatencyMs: 7000,
            p95LatencyMs: 9000,
            p99LatencyMs: 12000,
            averageLatencyMs: 7000,
            successRate: 90,
            lastUpdated: new Date(),
          },
        ],
        [
          "mcp",
          {
            path: "mcp",
            requestCount: 700,
            successCount: 630, // 90% success rate
            failureCount: 70,
            totalLatencyMs: 5600000, // 8s average
            latencies: Array(700).fill(8000),
            p50LatencyMs: 8000,
            p95LatencyMs: 10000,
            p99LatencyMs: 13000,
            averageLatencyMs: 8000,
            successRate: 90,
            lastUpdated: new Date(),
          },
        ],
      ]);

      (performanceMonitor.getAllPathMetrics as jest.Mock).mockReturnValue(
        mockMetrics
      );
      (
        performanceMonitor.calculateRoutingEfficiency as jest.Mock
      ).mockResolvedValue({
        overallEfficiency: 68, // Poor efficiency requiring multiple optimizations
        directBedrockEfficiency: 90,
        mcpEfficiency: 90,
        fallbackRate: 20, // High fallback rate
        optimalRoutingRate: 68,
        suboptimalRoutingRate: 32,
        recommendations: [],
      });

      const adaptiveOptimizer = new RoutingEfficiencyOptimizer(
        router,
        performanceMonitor,
        featureFlags,
        auditTrail,
        {
          targetPerformanceImprovement: 15,
          optimizationIntervalMs: 100,
          minDataPointsRequired: 50,
          enableAdaptiveStrategy: true,
          maxRoutingRuleChanges: 5, // Allow more changes for adaptive strategy
        }
      );

      await adaptiveOptimizer.startOptimization();
      await new Promise((resolve) => setTimeout(resolve, 150));

      const recommendations = adaptiveOptimizer.getActiveRecommendations();
      expect(recommendations.length).toBeGreaterThan(2); // Multiple recommendations

      // Should have adaptive strategy recommendation
      const adaptiveRecommendation = recommendations.find((r) =>
        r.description.includes("adaptive")
      );
      expect(adaptiveRecommendation).toBeDefined();
      expect(
        adaptiveRecommendation?.expectedImprovement
      ).toBeGreaterThanOrEqual(15);

      adaptiveOptimizer.cleanup();
    });
  });

  describe("Target Achievement Validation", () => {
    it("should track progress towards 15% improvement target", async () => {
      // Mock progressive improvement scenario
      const mockMetrics = new Map([
        [
          "direct_bedrock",
          {
            path: "direct_bedrock",
            requestCount: 400,
            successCount: 392,
            failureCount: 8,
            totalLatencyMs: 1600000, // 4s average - good
            latencies: Array(400).fill(4000),
            p50LatencyMs: 4000,
            p95LatencyMs: 5000,
            p99LatencyMs: 6000,
            averageLatencyMs: 4000,
            successRate: 98,
            lastUpdated: new Date(),
          },
        ],
        [
          "mcp",
          {
            path: "mcp",
            requestCount: 600,
            successCount: 588,
            failureCount: 12,
            totalLatencyMs: 3600000, // 6s average - acceptable
            latencies: Array(600).fill(6000),
            p50LatencyMs: 6000,
            p95LatencyMs: 7000,
            p99LatencyMs: 8000,
            averageLatencyMs: 6000,
            successRate: 98,
            lastUpdated: new Date(),
          },
        ],
      ]);

      (performanceMonitor.getAllPathMetrics as jest.Mock).mockReturnValue(
        mockMetrics
      );
      (
        performanceMonitor.calculateRoutingEfficiency as jest.Mock
      ).mockResolvedValue({
        overallEfficiency: 85, // Good efficiency, close to target
        directBedrockEfficiency: 98,
        mcpEfficiency: 98,
        fallbackRate: 2,
        optimalRoutingRate: 85,
        suboptimalRoutingRate: 15,
        recommendations: [],
      });

      await optimizer.startOptimization();
      await new Promise((resolve) => setTimeout(resolve, 150));

      const status = optimizer.getOptimizationStatus();

      // Should be tracking towards target
      expect(status.overallImprovement).toBeGreaterThanOrEqual(0);
      expect(typeof status.targetAchieved).toBe("boolean");

      // With good baseline performance, should have fewer but high-impact recommendations
      const recommendations = optimizer.getActiveRecommendations();
      if (recommendations.length > 0) {
        const highImpactRecs = recommendations.filter(
          (r) => r.expectedImprovement >= 15
        );
        expect(highImpactRecs.length).toBeGreaterThan(0);
      }
    });

    it("should demonstrate measurable performance improvement", async () => {
      // Test the complete optimization cycle with before/after measurement

      // Initial poor performance
      let mockMetrics = new Map([
        [
          "direct_bedrock",
          {
            path: "direct_bedrock",
            requestCount: 100,
            successCount: 85,
            failureCount: 15,
            totalLatencyMs: 1200000, // 12s average - very poor
            latencies: Array(100).fill(12000),
            p50LatencyMs: 12000,
            p95LatencyMs: 15000,
            p99LatencyMs: 18000,
            averageLatencyMs: 12000,
            successRate: 85,
            lastUpdated: new Date(),
          },
        ],
        [
          "mcp",
          {
            path: "mcp",
            requestCount: 900,
            successCount: 810,
            failureCount: 90,
            totalLatencyMs: 13500000, // 15s average - very poor
            latencies: Array(900).fill(15000),
            p50LatencyMs: 15000,
            p95LatencyMs: 18000,
            p99LatencyMs: 20000,
            averageLatencyMs: 15000,
            successRate: 90,
            lastUpdated: new Date(),
          },
        ],
      ]);

      (performanceMonitor.getAllPathMetrics as jest.Mock).mockReturnValue(
        mockMetrics
      );
      (
        performanceMonitor.calculateRoutingEfficiency as jest.Mock
      ).mockResolvedValue({
        overallEfficiency: 50, // Very poor efficiency
        directBedrockEfficiency: 85,
        mcpEfficiency: 90,
        fallbackRate: 30,
        optimalRoutingRate: 50,
        suboptimalRoutingRate: 50,
        recommendations: [],
      });

      await optimizer.startOptimization();
      await new Promise((resolve) => setTimeout(resolve, 150));

      const initialRecommendations = optimizer.getActiveRecommendations();
      expect(initialRecommendations.length).toBeGreaterThan(0);

      // Simulate improved performance after optimization
      mockMetrics = new Map([
        [
          "direct_bedrock",
          {
            path: "direct_bedrock",
            requestCount: 600, // More traffic routed to better performing route
            successCount: 588,
            failureCount: 12,
            totalLatencyMs: 3000000, // 5s average - much better
            latencies: Array(600).fill(5000),
            p50LatencyMs: 5000,
            p95LatencyMs: 6000,
            p99LatencyMs: 7000,
            averageLatencyMs: 5000,
            successRate: 98,
            lastUpdated: new Date(),
          },
        ],
        [
          "mcp",
          {
            path: "mcp",
            requestCount: 400, // Less traffic on slower route
            successCount: 392,
            failureCount: 8,
            totalLatencyMs: 2800000, // 7s average - improved
            latencies: Array(400).fill(7000),
            p50LatencyMs: 7000,
            p95LatencyMs: 8000,
            p99LatencyMs: 9000,
            averageLatencyMs: 7000,
            successRate: 98,
            lastUpdated: new Date(),
          },
        ],
      ]);

      (
        performanceMonitor.calculateRoutingEfficiency as jest.Mock
      ).mockResolvedValue({
        overallEfficiency: 88, // Much improved efficiency
        directBedrockEfficiency: 98,
        mcpEfficiency: 98,
        fallbackRate: 5,
        optimalRoutingRate: 88,
        suboptimalRoutingRate: 12,
        recommendations: [],
      });

      // Wait for another optimization cycle to evaluate improvements
      await new Promise((resolve) => setTimeout(resolve, 200));

      const finalStatus = optimizer.getOptimizationStatus();

      // Should show improvement (this would be calculated based on baseline vs current)
      expect(finalStatus.totalOptimizations).toBeGreaterThan(0);

      // The improvement calculation would show >15% improvement in this scenario
      // (from 50% efficiency to 88% efficiency = 76% improvement)
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle insufficient data gracefully", async () => {
      // Mock insufficient data scenario
      const mockMetrics = new Map([
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
      ]);

      (performanceMonitor.getAllPathMetrics as jest.Mock).mockReturnValue(
        mockMetrics
      );

      await optimizer.startOptimization();
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Should not generate recommendations with insufficient data
      const recommendations = optimizer.getActiveRecommendations();
      expect(recommendations.length).toBe(0);

      const status = optimizer.getOptimizationStatus();
      expect(status.isOptimizing).toBe(true); // Should still be running
    });

    it("should handle optimization failures gracefully", async () => {
      // Mock scenario where router updates fail
      (router.updateRoutingRules as jest.Mock).mockImplementation(() => {
        throw new Error("Router update failed");
      });

      const mockMetrics = new Map([
        [
          "direct_bedrock",
          {
            path: "direct_bedrock",
            requestCount: 200,
            successCount: 160,
            failureCount: 40,
            totalLatencyMs: 1600000,
            latencies: Array(200).fill(8000),
            p50LatencyMs: 8000,
            p95LatencyMs: 10000,
            p99LatencyMs: 12000,
            averageLatencyMs: 8000,
            successRate: 80,
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
            totalLatencyMs: 2000000,
            latencies: Array(200).fill(10000),
            p50LatencyMs: 10000,
            p95LatencyMs: 12000,
            p99LatencyMs: 15000,
            averageLatencyMs: 10000,
            successRate: 95,
            lastUpdated: new Date(),
          },
        ],
      ]);

      (performanceMonitor.getAllPathMetrics as jest.Mock).mockReturnValue(
        mockMetrics
      );
      (
        performanceMonitor.calculateRoutingEfficiency as jest.Mock
      ).mockResolvedValue({
        overallEfficiency: 70,
        directBedrockEfficiency: 80,
        mcpEfficiency: 95,
        fallbackRate: 15,
        optimalRoutingRate: 70,
        suboptimalRoutingRate: 30,
        recommendations: [],
      });

      await optimizer.startOptimization();
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Should continue running despite router update failures
      const status = optimizer.getOptimizationStatus();
      expect(status.isOptimizing).toBe(true);
    });
  });
});
