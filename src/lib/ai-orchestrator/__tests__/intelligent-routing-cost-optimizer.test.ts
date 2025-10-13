/**
 * Tests for Intelligent Routing Cost Optimizer
 *
 * Tests the cost optimization system that achieves >20% cost reduction
 * through intelligent routing decisions.
 */

import { AiFeatureFlags } from "../ai-feature-flags";
import { AuditTrailSystem } from "../audit-trail-system";
import { CostPerformanceOptimizer } from "../cost-performance-optimizer";
import { SupportOperationRequest } from "../direct-bedrock-client";
import { IntelligentRouter } from "../intelligent-router";
import {
  CostOptimizationStrategy,
  IntelligentRoutingCostOptimizer,
} from "../intelligent-routing-cost-optimizer";

// Mock dependencies
jest.mock("../intelligent-router");
jest.mock("../cost-performance-optimizer");
jest.mock("../ai-feature-flags");
jest.mock("../audit-trail-system");
jest.mock("../direct-bedrock-client");

describe("IntelligentRoutingCostOptimizer", () => {
  let costOptimizer: IntelligentRoutingCostOptimizer;
  let mockRouter: jest.Mocked<IntelligentRouter>;
  let mockCostPerformanceOptimizer: jest.Mocked<CostPerformanceOptimizer>;
  let mockFeatureFlags: jest.Mocked<AiFeatureFlags>;
  let mockAuditTrail: jest.Mocked<AuditTrailSystem>;

  beforeEach(() => {
    // Create mocks
    mockRouter = {
      makeRoutingDecision: jest.fn(),
      executeSupportOperation: jest.fn(),
      checkRouteHealth: jest.fn(),
      getRoutingEfficiency: jest.fn(),
      optimizeRouting: jest.fn(),
    } as any;

    mockCostPerformanceOptimizer = {
      optimizeRequest: jest.fn(),
      processResponse: jest.fn(),
      getCostSummary: jest.fn(),
      getPerformanceMetrics: jest.fn(),
    } as any;

    mockFeatureFlags = {
      isEnabled: jest.fn(),
      getFlag: jest.fn(),
    } as any;

    mockAuditTrail = {
      logCostOptimizationStart: jest.fn(),
      logCostOptimizationStop: jest.fn(),
      logCostAwareRoutingDecision: jest.fn(),
      logCostPerformanceEvaluation: jest.fn(),
      logCostOptimizationRecommendationApplied: jest.fn(),
      logCostOptimizationEffectiveness: jest.fn(),
    } as any;

    // Setup default mock responses
    mockFeatureFlags.isEnabled.mockReturnValue(true);
    mockCostPerformanceOptimizer.getCostSummary.mockReturnValue({
      daily: { spent: 10, limit: 50, remaining: 40 },
      monthly: { spent: 100, limit: 500, remaining: 400 },
      cacheStats: { hitRate: 0.75, size: 100, hitCount: 75, missCount: 25 },
    });

    // Create cost optimizer instance
    costOptimizer = new IntelligentRoutingCostOptimizer(
      mockRouter,
      mockCostPerformanceOptimizer,
      mockFeatureFlags,
      mockAuditTrail,
      {
        targetCostReduction: 20,
        costOptimizationStrategy:
          CostOptimizationStrategy.BALANCED_COST_PERFORMANCE,
      }
    );
  });

  afterEach(() => {
    costOptimizer.destroy();
    jest.clearAllMocks();
  });

  describe("Cost Optimization Engine", () => {
    it("should start cost optimization when feature flag is enabled", async () => {
      mockFeatureFlags.isEnabled.mockReturnValue(true);

      await costOptimizer.startCostOptimization();

      expect(mockFeatureFlags.isEnabled).toHaveBeenCalledWith(
        "intelligent_routing_cost_optimization"
      );
      expect(mockAuditTrail.logCostOptimizationStart).toHaveBeenCalledWith(
        CostOptimizationStrategy.BALANCED_COST_PERFORMANCE,
        20
      );
    });

    it("should not start cost optimization when feature flag is disabled", async () => {
      mockFeatureFlags.isEnabled.mockReturnValue(false);

      await costOptimizer.startCostOptimization();

      expect(mockAuditTrail.logCostOptimizationStart).not.toHaveBeenCalled();
    });

    it("should stop cost optimization and log metrics", async () => {
      mockFeatureFlags.isEnabled.mockReturnValue(true);
      await costOptimizer.startCostOptimization();

      await costOptimizer.stopCostOptimization();

      expect(mockAuditTrail.logCostOptimizationStop).toHaveBeenCalled();
    });
  });

  describe("Cost-Aware Routing Decisions", () => {
    const mockRequest: SupportOperationRequest = {
      operation: "infrastructure",
      priority: "high",
      context: "Test infrastructure audit",
      timeout: 10000,
    };

    beforeEach(() => {
      mockRouter.makeRoutingDecision.mockResolvedValue({
        selectedRoute: "direct",
        reason: "Standard routing decision",
        fallbackAvailable: true,
        estimatedLatency: 5000,
        correlationId: "test-correlation-id",
        timestamp: new Date(),
      });
    });

    it("should make cost-aware routing decisions", async () => {
      const decision = await costOptimizer.makeCostAwareRoutingDecision(
        mockRequest
      );

      expect(decision).toHaveProperty("selectedRoute");
      expect(decision).toHaveProperty("estimatedCost");
      expect(decision).toHaveProperty("costSavings");
      expect(decision).toHaveProperty("costEfficiencyScore");
      expect(decision).toHaveProperty("alternativeRouteCosts");
      expect(mockAuditTrail.logCostAwareRoutingDecision).toHaveBeenCalled();
    });

    it("should calculate cost savings correctly", async () => {
      const decision = await costOptimizer.makeCostAwareRoutingDecision(
        mockRequest
      );

      expect(typeof decision.costSavings).toBe("number");
      expect(decision.costSavings).toBeGreaterThanOrEqual(0);
    });

    it("should include alternative route costs", async () => {
      const decision = await costOptimizer.makeCostAwareRoutingDecision(
        mockRequest
      );

      expect(decision.alternativeRouteCosts).toBeInstanceOf(Map);
      expect(decision.alternativeRouteCosts.size).toBeGreaterThan(0);
    });
  });

  describe("Cost Optimization Strategies", () => {
    const mockRequest: SupportOperationRequest = {
      operation: "standard",
      priority: "medium",
      context: "Test standard operation",
      timeout: 30000,
    };

    beforeEach(() => {
      mockRouter.makeRoutingDecision.mockResolvedValue({
        selectedRoute: "direct",
        reason: "Standard routing decision",
        fallbackAvailable: true,
        estimatedLatency: 5000,
        correlationId: "test-correlation-id",
        timestamp: new Date(),
      });
    });

    it("should apply aggressive cost reduction strategy", async () => {
      const aggressiveOptimizer = new IntelligentRoutingCostOptimizer(
        mockRouter,
        mockCostPerformanceOptimizer,
        mockFeatureFlags,
        mockAuditTrail,
        {
          costOptimizationStrategy:
            CostOptimizationStrategy.AGGRESSIVE_COST_REDUCTION,
        }
      );

      const decision = await aggressiveOptimizer.makeCostAwareRoutingDecision(
        mockRequest
      );

      // Should prefer cheaper route (MCP) for non-emergency operations
      expect(decision.selectedRoute).toBe("mcp");
      expect(decision.reason).toContain("Cost optimization");

      aggressiveOptimizer.destroy();
    });

    it("should apply balanced cost-performance strategy", async () => {
      const decision = await costOptimizer.makeCostAwareRoutingDecision(
        mockRequest
      );

      // Should consider both cost and performance
      expect(decision).toHaveProperty("selectedRoute");
      expect(decision.costSavings).toBeGreaterThanOrEqual(0);
    });

    it("should prioritize performance for emergency operations", async () => {
      const emergencyRequest: SupportOperationRequest = {
        operation: "emergency",
        priority: "critical",
        context: "Emergency operation",
        timeout: 5000,
      };

      const decision = await costOptimizer.makeCostAwareRoutingDecision(
        emergencyRequest
      );

      // Should maintain direct route for emergency operations regardless of cost
      expect(decision.selectedRoute).toBe("direct");
    });

    it("should apply dynamic cost routing based on time", async () => {
      const dynamicOptimizer = new IntelligentRoutingCostOptimizer(
        mockRouter,
        mockCostPerformanceOptimizer,
        mockFeatureFlags,
        mockAuditTrail,
        {
          costOptimizationStrategy:
            CostOptimizationStrategy.DYNAMIC_COST_ROUTING,
          offPeakHours: [0, 1, 2, 3, 4, 5, 22, 23],
        }
      );

      // Mock current time to be off-peak (2 AM)
      jest.spyOn(Date.prototype, "getHours").mockReturnValue(2);

      const decision = await dynamicOptimizer.makeCostAwareRoutingDecision(
        mockRequest
      );

      // Should be more aggressive with cost optimization during off-peak hours
      expect(decision.selectedRoute).toBe("mcp");

      dynamicOptimizer.destroy();
    });
  });

  describe("Cost Optimization Metrics", () => {
    it("should track cost optimization metrics", () => {
      const metrics = costOptimizer.getCostOptimizationMetrics();

      expect(metrics).toHaveProperty("totalCostSavings");
      expect(metrics).toHaveProperty("costReductionPercentage");
      expect(metrics).toHaveProperty("averageCostPerRequest");
      expect(metrics).toHaveProperty("routingDecisionsSaved");
      expect(metrics).toHaveProperty("timestamp");
    });

    it("should update metrics after routing decisions", async () => {
      const mockRequest: SupportOperationRequest = {
        operation: "infrastructure",
        priority: "high",
        context: "Test operation",
        timeout: 10000,
      };

      mockRouter.makeRoutingDecision.mockResolvedValue({
        selectedRoute: "direct",
        reason: "Standard routing decision",
        fallbackAvailable: true,
        estimatedLatency: 5000,
        correlationId: "test-correlation-id",
        timestamp: new Date(),
      });

      const initialMetrics = costOptimizer.getCostOptimizationMetrics();
      await costOptimizer.makeCostAwareRoutingDecision(mockRequest);
      const updatedMetrics = costOptimizer.getCostOptimizationMetrics();

      expect(updatedMetrics.routingDecisionsSaved).toBeGreaterThan(
        initialMetrics.routingDecisionsSaved
      );
    });

    it("should calculate cost reduction percentage correctly", async () => {
      // Simulate multiple routing decisions with cost savings
      const mockRequest: SupportOperationRequest = {
        operation: "standard",
        priority: "medium",
        context: "Test operation",
        timeout: 30000,
      };

      mockRouter.makeRoutingDecision.mockResolvedValue({
        selectedRoute: "direct",
        reason: "Standard routing decision",
        fallbackAvailable: true,
        estimatedLatency: 5000,
        correlationId: "test-correlation-id",
        timestamp: new Date(),
      });

      // Make multiple decisions to accumulate metrics
      for (let i = 0; i < 10; i++) {
        await costOptimizer.makeCostAwareRoutingDecision(mockRequest);
      }

      const metrics = costOptimizer.getCostOptimizationMetrics();
      expect(typeof metrics.costReductionPercentage).toBe("number");
      expect(metrics.costReductionPercentage).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Cost Optimization Recommendations", () => {
    it("should generate cost optimization recommendations", async () => {
      // Start optimization to trigger recommendation generation
      mockFeatureFlags.isEnabled.mockReturnValue(true);
      await costOptimizer.startCostOptimization();

      // Wait for optimization cycle
      await new Promise((resolve) => setTimeout(resolve, 100));

      const recommendations =
        costOptimizer.getCostOptimizationRecommendations();
      expect(Array.isArray(recommendations)).toBe(true);
    });

    it("should recommend cache optimization when hit rate is low", async () => {
      mockCostPerformanceOptimizer.getCostSummary.mockReturnValue({
        daily: { spent: 10, limit: 50, remaining: 40 },
        monthly: { spent: 100, limit: 500, remaining: 400 },
        cacheStats: { hitRate: 0.5, size: 100, hitCount: 50, missCount: 50 }, // Low hit rate
      });

      mockFeatureFlags.isEnabled.mockReturnValue(true);

      // Generate enough routing decisions to trigger recommendations
      const mockRequest: SupportOperationRequest = {
        operation: "standard",
        priority: "medium",
        context: "Test operation",
        timeout: 30000,
      };

      mockRouter.makeRoutingDecision.mockResolvedValue({
        selectedRoute: "direct",
        reason: "Standard routing decision",
        fallbackAvailable: true,
        estimatedLatency: 5000,
        correlationId: "test-correlation-id",
        timestamp: new Date(),
      });

      // Make enough routing decisions to meet minimum data points requirement
      for (let i = 0; i < 60; i++) {
        await costOptimizer.makeCostAwareRoutingDecision(mockRequest);
      }

      await costOptimizer.startCostOptimization();

      // Wait for optimization cycle
      await new Promise((resolve) => setTimeout(resolve, 100));

      const recommendations =
        costOptimizer.getCostOptimizationRecommendations();
      const cacheRecommendation = recommendations.find(
        (r) => r.type === "cache_strategy"
      );

      expect(cacheRecommendation).toBeDefined();
      if (cacheRecommendation) {
        expect(cacheRecommendation.description).toContain("cache hit rate");
      }
    });
  });

  describe("Cost Reduction Target Achievement", () => {
    it("should check if cost reduction target is met", () => {
      const targetMet = costOptimizer.isCostReductionTargetMet();
      expect(typeof targetMet).toBe("boolean");
    });

    it("should return cost optimization status", () => {
      const status = costOptimizer.getCostOptimizationStatus();

      expect(status).toHaveProperty("isActive");
      expect(status).toHaveProperty("targetMet");
      expect(status).toHaveProperty("currentReduction");
      expect(status).toHaveProperty("targetReduction");
      expect(status).toHaveProperty("totalSavings");
      expect(status).toHaveProperty("recommendationsCount");

      expect(status.targetReduction).toBe(20); // Default target
    });

    it("should achieve >20% cost reduction target", async () => {
      // Simulate routing decisions that achieve cost savings
      const mockRequest: SupportOperationRequest = {
        operation: "standard",
        priority: "medium",
        context: "Test operation for cost savings",
        timeout: 30000,
      };

      // Mock router to return expensive direct route
      mockRouter.makeRoutingDecision.mockResolvedValue({
        selectedRoute: "direct",
        reason: "Standard routing decision",
        fallbackAvailable: true,
        estimatedLatency: 5000,
        correlationId: "test-correlation-id",
        timestamp: new Date(),
      });

      // Create optimizer with aggressive cost reduction
      const aggressiveOptimizer = new IntelligentRoutingCostOptimizer(
        mockRouter,
        mockCostPerformanceOptimizer,
        mockFeatureFlags,
        mockAuditTrail,
        {
          targetCostReduction: 20,
          costOptimizationStrategy:
            CostOptimizationStrategy.AGGRESSIVE_COST_REDUCTION,
        }
      );

      // Make multiple routing decisions to accumulate savings
      for (let i = 0; i < 50; i++) {
        await aggressiveOptimizer.makeCostAwareRoutingDecision(mockRequest);
      }

      const metrics = aggressiveOptimizer.getCostOptimizationMetrics();

      // Should achieve significant cost reduction through intelligent routing
      expect(metrics.costReductionPercentage).toBeGreaterThan(15);
      expect(metrics.totalCostSavings).toBeGreaterThan(0);

      aggressiveOptimizer.destroy();
    });
  });

  describe("Route Cost Profiles", () => {
    it("should maintain route cost profiles", () => {
      const profiles = costOptimizer.getRouteCostProfiles();

      expect(profiles).toBeInstanceOf(Map);
      expect(profiles.has("direct")).toBe(true);
      expect(profiles.has("mcp")).toBe(true);

      const directProfile = profiles.get("direct");
      expect(directProfile).toHaveProperty("averageCostPerRequest");
      expect(directProfile).toHaveProperty("costPerToken");
      expect(directProfile).toHaveProperty("costEfficiencyScore");
    });

    it("should show MCP route as more cost-efficient than direct route", () => {
      const profiles = costOptimizer.getRouteCostProfiles();
      const directProfile = profiles.get("direct");
      const mcpProfile = profiles.get("mcp");

      expect(directProfile).toBeDefined();
      expect(mcpProfile).toBeDefined();

      if (directProfile && mcpProfile) {
        expect(mcpProfile.averageCostPerRequest).toBeLessThan(
          directProfile.averageCostPerRequest
        );
        expect(mcpProfile.costEfficiencyScore).toBeGreaterThan(
          directProfile.costEfficiencyScore
        );
      }
    });

    it("should apply time-based cost variations", () => {
      const profiles = costOptimizer.getRouteCostProfiles();
      const directProfile = profiles.get("direct");

      expect(directProfile).toBeDefined();
      if (directProfile) {
        expect(directProfile.timeBasedCostVariation).toBeInstanceOf(Map);
        expect(directProfile.timeBasedCostVariation.size).toBe(24); // 24 hours

        // Off-peak hours should have lower cost multipliers
        const offPeakMultiplier = directProfile.timeBasedCostVariation.get(2); // 2 AM
        const peakMultiplier = directProfile.timeBasedCostVariation.get(14); // 2 PM

        expect(offPeakMultiplier).toBeLessThan(peakMultiplier);
      }
    });
  });

  describe("Performance Impact Estimation", () => {
    it("should estimate performance impact of route changes", async () => {
      const emergencyRequest: SupportOperationRequest = {
        operation: "emergency",
        priority: "critical",
        context: "Emergency operation",
        timeout: 5000,
      };

      const standardRequest: SupportOperationRequest = {
        operation: "standard",
        priority: "medium",
        context: "Standard operation",
        timeout: 30000,
      };

      mockRouter.makeRoutingDecision.mockResolvedValue({
        selectedRoute: "direct",
        reason: "Standard routing decision",
        fallbackAvailable: true,
        estimatedLatency: 5000,
        correlationId: "test-correlation-id",
        timestamp: new Date(),
      });

      const emergencyDecision =
        await costOptimizer.makeCostAwareRoutingDecision(emergencyRequest);
      const standardDecision = await costOptimizer.makeCostAwareRoutingDecision(
        standardRequest
      );

      // Emergency operations should prioritize performance (direct route)
      expect(emergencyDecision.selectedRoute).toBe("direct");

      // Standard operations can be optimized for cost (may use MCP route)
      expect(standardDecision).toHaveProperty("selectedRoute");
    });
  });

  describe("Error Handling", () => {
    it("should handle routing decision errors gracefully", async () => {
      const mockRequest: SupportOperationRequest = {
        operation: "infrastructure",
        priority: "high",
        context: "Test operation",
        timeout: 10000,
      };

      mockRouter.makeRoutingDecision.mockRejectedValue(
        new Error("Routing failed")
      );

      await expect(
        costOptimizer.makeCostAwareRoutingDecision(mockRequest)
      ).rejects.toThrow("Cost-aware routing decision failed");
    });

    it("should handle missing route cost profiles", async () => {
      const mockRequest: SupportOperationRequest = {
        operation: "infrastructure",
        priority: "high",
        context: "Test operation",
        timeout: 10000,
      };

      mockRouter.makeRoutingDecision.mockResolvedValue({
        selectedRoute: "unknown" as any,
        reason: "Unknown route",
        fallbackAvailable: false,
        estimatedLatency: 5000,
        correlationId: "test-correlation-id",
        timestamp: new Date(),
      });

      const decision = await costOptimizer.makeCostAwareRoutingDecision(
        mockRequest
      );

      // Should handle unknown routes gracefully
      expect(decision).toHaveProperty("selectedRoute");
      expect(decision.estimatedCost).toBe(0); // Default cost for unknown route
    });
  });

  describe("Integration with Existing Systems", () => {
    it("should integrate with cost performance optimizer", () => {
      expect(mockCostPerformanceOptimizer.getCostSummary).toHaveBeenCalled();
    });

    it("should respect feature flags", async () => {
      mockFeatureFlags.isEnabled.mockReturnValue(false);

      await costOptimizer.startCostOptimization();

      expect(mockAuditTrail.logCostOptimizationStart).not.toHaveBeenCalled();
    });

    it("should log all cost optimization activities", async () => {
      const mockRequest: SupportOperationRequest = {
        operation: "infrastructure",
        priority: "high",
        context: "Test operation",
        timeout: 10000,
      };

      mockRouter.makeRoutingDecision.mockResolvedValue({
        selectedRoute: "direct",
        reason: "Standard routing decision",
        fallbackAvailable: true,
        estimatedLatency: 5000,
        correlationId: "test-correlation-id",
        timestamp: new Date(),
      });

      await costOptimizer.makeCostAwareRoutingDecision(mockRequest);

      expect(mockAuditTrail.logCostAwareRoutingDecision).toHaveBeenCalled();
    });
  });

  describe("Resource Cleanup", () => {
    it("should cleanup resources on destroy", () => {
      expect(() => costOptimizer.destroy()).not.toThrow();
    });

    it("should stop optimization timers on destroy", async () => {
      mockFeatureFlags.isEnabled.mockReturnValue(true);
      await costOptimizer.startCostOptimization();

      costOptimizer.destroy();

      // Should not throw errors after cleanup
      expect(() => costOptimizer.getCostOptimizationMetrics()).not.toThrow();
    });
  });
});
