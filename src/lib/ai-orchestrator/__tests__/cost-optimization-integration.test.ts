/**
 * Integration Tests for Cost Optimization through Intelligent Routing
 *
 * Tests the complete cost optimization system integration to verify
 * >20% cost reduction through intelligent routing decisions.
 */

import { AiFeatureFlags } from "../ai-feature-flags";
import { AuditTrailSystem } from "../audit-trail-system";
import { CostPerformanceOptimizer } from "../cost-performance-optimizer";
import {
  DirectBedrockClient,
  SupportOperationRequest,
} from "../direct-bedrock-client";
import { IntelligentRouter } from "../intelligent-router";
import {
  CostOptimizationStrategy,
  IntelligentRoutingCostOptimizer,
} from "../intelligent-routing-cost-optimizer";
import { MCPRouter } from "../mcp-router";

// Mock dependencies
jest.mock("../direct-bedrock-client");
jest.mock("../mcp-router");
jest.mock("../ai-feature-flags");
jest.mock("../audit-trail-system");

describe("Cost Optimization Integration", () => {
  let intelligentRouter: IntelligentRouter;
  let costOptimizer: IntelligentRoutingCostOptimizer;
  let costPerformanceOptimizer: CostPerformanceOptimizer;
  let mockDirectBedrockClient: jest.Mocked<DirectBedrockClient>;
  let mockMCPRouter: jest.Mocked<MCPRouter>;
  let mockFeatureFlags: jest.Mocked<AiFeatureFlags>;
  let mockAuditTrail: jest.Mocked<AuditTrailSystem>;

  beforeEach(() => {
    // Create mocks
    mockDirectBedrockClient = {
      executeSupportOperation: jest.fn(),
      performHealthCheck: jest.fn(),
    } as any;

    mockMCPRouter = {
      executeSupportOperation: jest.fn(),
      getHealthStatus: jest.fn(),
      isAvailable: jest.fn(),
    } as any;

    mockFeatureFlags = {
      isEnabled: jest.fn(),
      getFlag: jest.fn(),
    } as any;

    mockAuditTrail = {
      logHybridRoutingDecision: jest.fn(),
      logIntelligentRoutingFallback: jest.fn(),
      logCostOptimizationStart: jest.fn(),
      logCostOptimizationStop: jest.fn(),
      logCostAwareRoutingDecision: jest.fn(),
      logCostPerformanceEvaluation: jest.fn(),
      logCostOptimizationRecommendationApplied: jest.fn(),
      logCostOptimizationEffectiveness: jest.fn(),
    } as any;

    // Setup default mock responses
    mockFeatureFlags.isEnabled.mockImplementation((flag: string) => {
      switch (flag) {
        case "ENABLE_INTELLIGENT_ROUTING":
          return true;
        case "intelligent_routing_cost_optimization":
          return true;
        default:
          return false;
      }
    });

    mockDirectBedrockClient.performHealthCheck.mockResolvedValue({
      isHealthy: true,
      latencyMs: 100,
      timestamp: new Date(),
    });

    mockMCPRouter.getHealthStatus.mockResolvedValue({
      isHealthy: true,
      latencyMs: 150,
      timestamp: new Date(),
    });

    mockMCPRouter.isAvailable.mockReturnValue(true);

    // Mock successful operation responses
    mockDirectBedrockClient.executeSupportOperation.mockResolvedValue({
      success: true,
      operationId: "direct-op-123",
      latencyMs: 100,
      timestamp: new Date(),
    });

    mockMCPRouter.executeSupportOperation.mockResolvedValue({
      success: true,
      operationId: "mcp-op-123",
      latencyMs: 150,
      timestamp: new Date(),
    });

    // Create cost performance optimizer
    costPerformanceOptimizer = new CostPerformanceOptimizer({
      dailyLimit: 50,
      monthlyLimit: 500,
      alertThresholds: [50, 75, 90],
      hardStop: false,
    });

    // Create intelligent router
    intelligentRouter = new IntelligentRouter(
      mockDirectBedrockClient,
      mockMCPRouter
    );

    // Create cost optimizer
    costOptimizer = new IntelligentRoutingCostOptimizer(
      intelligentRouter,
      costPerformanceOptimizer,
      mockFeatureFlags,
      mockAuditTrail,
      {
        targetCostReduction: 20,
        costOptimizationStrategy:
          CostOptimizationStrategy.BALANCED_COST_PERFORMANCE,
      }
    );

    // Integrate cost optimizer with router
    intelligentRouter.setCostOptimizer(costOptimizer);
  });

  afterEach(() => {
    intelligentRouter.destroy();
    costOptimizer.destroy();
    jest.clearAllMocks();
  });

  describe("End-to-End Cost Optimization", () => {
    it("should achieve >20% cost reduction through intelligent routing", async () => {
      // Start cost optimization
      await costOptimizer.startCostOptimization();

      // Simulate multiple routing decisions
      const requests: SupportOperationRequest[] = [
        {
          operation: "standard",
          priority: "medium",
          context: "Standard operation 1",
          timeout: 30000,
        },
        {
          operation: "standard",
          priority: "medium",
          context: "Standard operation 2",
          timeout: 30000,
        },
        {
          operation: "infrastructure",
          priority: "high",
          context: "Infrastructure audit",
          timeout: 10000,
        },
        {
          operation: "implementation",
          priority: "high",
          context: "Implementation support",
          timeout: 15000,
        },
        {
          operation: "standard",
          priority: "low",
          context: "Background task",
          timeout: 60000,
        },
      ];

      // Execute multiple operations to accumulate cost savings
      const responses = [];
      for (let i = 0; i < 20; i++) {
        for (const request of requests) {
          const response = await intelligentRouter.executeSupportOperation(
            request
          );
          responses.push(response);
        }
      }

      // Check cost optimization metrics
      const metrics = costOptimizer.getCostOptimizationMetrics();
      const status = costOptimizer.getCostOptimizationStatus();

      // Verify cost reduction target is achieved
      expect(status.targetMet).toBe(true);
      expect(status.currentReduction).toBeGreaterThanOrEqual(20);
      expect(metrics.totalCostSavings).toBeGreaterThan(0);

      console.log(
        `Cost reduction achieved: ${status.currentReduction.toFixed(2)}%`
      );
      console.log(
        `Total cost savings: $${metrics.totalCostSavings.toFixed(4)}`
      );

      // Verify audit logging
      expect(mockAuditTrail.logCostOptimizationStart).toHaveBeenCalled();
      expect(mockAuditTrail.logCostAwareRoutingDecision).toHaveBeenCalled();
    });

    it("should prioritize performance for emergency operations", async () => {
      await costOptimizer.startCostOptimization();

      const emergencyRequest: SupportOperationRequest = {
        operation: "emergency",
        priority: "critical",
        context: "Emergency system failure",
        timeout: 5000,
      };

      const response = await intelligentRouter.executeSupportOperation(
        emergencyRequest
      );

      // Emergency operations should use direct route for performance
      expect(response.operationId).toContain("direct");
      expect(
        mockDirectBedrockClient.executeSupportOperation
      ).toHaveBeenCalled();
    });

    it("should optimize cost for standard operations", async () => {
      await costOptimizer.startCostOptimization();

      const standardRequest: SupportOperationRequest = {
        operation: "standard",
        priority: "medium",
        context: "Standard analysis task",
        timeout: 30000,
      };

      const response = await intelligentRouter.executeSupportOperation(
        standardRequest
      );

      // Standard operations should be optimized for cost (likely MCP route)
      expect(response.success).toBe(true);

      // Check if cost savings are being tracked
      const metrics = costOptimizer.getCostOptimizationMetrics();
      expect(metrics.routingDecisionsSaved).toBeGreaterThan(0);
    });

    it("should generate cost optimization recommendations", async () => {
      await costOptimizer.startCostOptimization();

      // Simulate some routing decisions
      const request: SupportOperationRequest = {
        operation: "standard",
        priority: "medium",
        context: "Test operation",
        timeout: 30000,
      };

      // Execute multiple operations to trigger recommendation generation
      for (let i = 0; i < 60; i++) {
        await intelligentRouter.executeSupportOperation(request);
      }

      // Wait for optimization cycle
      await new Promise((resolve) => setTimeout(resolve, 100));

      const recommendations =
        costOptimizer.getCostOptimizationRecommendations();
      expect(Array.isArray(recommendations)).toBe(true);

      // Should have recommendations if not meeting target
      const status = costOptimizer.getCostOptimizationStatus();
      if (!status.targetMet) {
        expect(recommendations.length).toBeGreaterThan(0);
      }
    });
  });

  describe("Cost Optimization Strategies", () => {
    it("should apply aggressive cost reduction strategy", async () => {
      const aggressiveOptimizer = new IntelligentRoutingCostOptimizer(
        intelligentRouter,
        costPerformanceOptimizer,
        mockFeatureFlags,
        mockAuditTrail,
        {
          targetCostReduction: 25,
          costOptimizationStrategy:
            CostOptimizationStrategy.AGGRESSIVE_COST_REDUCTION,
        }
      );

      intelligentRouter.setCostOptimizer(aggressiveOptimizer);
      await aggressiveOptimizer.startCostOptimization();

      const request: SupportOperationRequest = {
        operation: "standard",
        priority: "medium",
        context: "Standard operation",
        timeout: 30000,
      };

      const response = await intelligentRouter.executeSupportOperation(request);

      // Aggressive strategy should prefer cheaper MCP route
      expect(response.operationId).toContain("mcp");
      expect(mockMCPRouter.executeSupportOperation).toHaveBeenCalled();

      aggressiveOptimizer.destroy();
    });

    it("should apply dynamic cost routing based on time", async () => {
      const dynamicOptimizer = new IntelligentRoutingCostOptimizer(
        intelligentRouter,
        costPerformanceOptimizer,
        mockFeatureFlags,
        mockAuditTrail,
        {
          targetCostReduction: 20,
          costOptimizationStrategy:
            CostOptimizationStrategy.DYNAMIC_COST_ROUTING,
          offPeakHours: [0, 1, 2, 3, 4, 5, 22, 23],
        }
      );

      intelligentRouter.setCostOptimizer(dynamicOptimizer);
      await dynamicOptimizer.startCostOptimization();

      // Mock current time to be off-peak (2 AM)
      jest.spyOn(Date.prototype, "getHours").mockReturnValue(2);

      const request: SupportOperationRequest = {
        operation: "standard",
        priority: "medium",
        context: "Off-peak operation",
        timeout: 30000,
      };

      const response = await intelligentRouter.executeSupportOperation(request);

      // During off-peak hours, should be more aggressive with cost optimization
      expect(response.operationId).toContain("mcp");

      dynamicOptimizer.destroy();
    });
  });

  describe("Performance vs Cost Trade-offs", () => {
    it("should balance cost and performance appropriately", async () => {
      await costOptimizer.startCostOptimization();

      const requests = [
        {
          operation: "emergency" as const,
          priority: "critical" as const,
          context: "Emergency - performance critical",
          timeout: 5000,
        },
        {
          operation: "standard" as const,
          priority: "low" as const,
          context: "Background task - cost optimizable",
          timeout: 60000,
        },
      ];

      const responses = await Promise.all(
        requests.map((req) => intelligentRouter.executeSupportOperation(req))
      );

      // Emergency should use direct route (performance priority)
      expect(responses[0].operationId).toContain("direct");

      // Background task should use MCP route (cost priority)
      expect(responses[1].operationId).toContain("mcp");
    });

    it("should maintain acceptable performance degradation limits", async () => {
      const performanceAwareOptimizer = new IntelligentRoutingCostOptimizer(
        intelligentRouter,
        costPerformanceOptimizer,
        mockFeatureFlags,
        mockAuditTrail,
        {
          targetCostReduction: 20,
          maxPerformanceDegradation: 10, // Max 10% performance loss
          costOptimizationStrategy:
            CostOptimizationStrategy.PERFORMANCE_AWARE_COST,
        }
      );

      intelligentRouter.setCostOptimizer(performanceAwareOptimizer);
      await performanceAwareOptimizer.startCostOptimization();

      const request: SupportOperationRequest = {
        operation: "infrastructure",
        priority: "high",
        context: "Performance-sensitive infrastructure task",
        timeout: 10000,
      };

      const response = await intelligentRouter.executeSupportOperation(request);

      // Should optimize cost while respecting performance constraints
      expect(response.success).toBe(true);
      expect(response.latencyMs).toBeLessThan(request.timeout);

      performanceAwareOptimizer.destroy();
    });
  });

  describe("Cost Metrics and Reporting", () => {
    it("should track detailed cost metrics", async () => {
      await costOptimizer.startCostOptimization();

      // Execute operations to generate metrics
      const request: SupportOperationRequest = {
        operation: "standard",
        priority: "medium",
        context: "Metrics test operation",
        timeout: 30000,
      };

      for (let i = 0; i < 10; i++) {
        await intelligentRouter.executeSupportOperation(request);
      }

      const metrics = costOptimizer.getCostOptimizationMetrics();

      expect(metrics).toHaveProperty("totalCostSavings");
      expect(metrics).toHaveProperty("costReductionPercentage");
      expect(metrics).toHaveProperty("averageCostPerRequest");
      expect(metrics).toHaveProperty("routingDecisionsSaved");
      expect(metrics.routingDecisionsSaved).toBe(10);
    });

    it("should provide cost optimization status", () => {
      const status = costOptimizer.getCostOptimizationStatus();

      expect(status).toHaveProperty("isActive");
      expect(status).toHaveProperty("targetMet");
      expect(status).toHaveProperty("currentReduction");
      expect(status).toHaveProperty("targetReduction");
      expect(status).toHaveProperty("totalSavings");
      expect(status.targetReduction).toBe(20);
    });

    it("should track route cost profiles", () => {
      const profiles = costOptimizer.getRouteCostProfiles();

      expect(profiles).toBeInstanceOf(Map);
      expect(profiles.has("direct")).toBe(true);
      expect(profiles.has("mcp")).toBe(true);

      const directProfile = profiles.get("direct");
      const mcpProfile = profiles.get("mcp");

      expect(directProfile).toBeDefined();
      expect(mcpProfile).toBeDefined();

      if (directProfile && mcpProfile) {
        // MCP should be more cost-efficient
        expect(mcpProfile.averageCostPerRequest).toBeLessThan(
          directProfile.averageCostPerRequest
        );
        expect(mcpProfile.costEfficiencyScore).toBeGreaterThan(
          directProfile.costEfficiencyScore
        );
      }
    });
  });

  describe("Integration with Existing Systems", () => {
    it("should integrate with audit trail system", async () => {
      await costOptimizer.startCostOptimization();

      const request: SupportOperationRequest = {
        operation: "infrastructure",
        priority: "high",
        context: "Audit integration test",
        timeout: 10000,
      };

      await intelligentRouter.executeSupportOperation(request);

      // Verify audit trail integration
      expect(mockAuditTrail.logCostOptimizationStart).toHaveBeenCalled();
      expect(mockAuditTrail.logCostAwareRoutingDecision).toHaveBeenCalled();
    });

    it("should respect feature flags", async () => {
      // Disable cost optimization
      mockFeatureFlags.isEnabled.mockImplementation((flag: string) => {
        if (flag === "intelligent_routing_cost_optimization") return false;
        return flag === "ENABLE_INTELLIGENT_ROUTING";
      });

      const request: SupportOperationRequest = {
        operation: "standard",
        priority: "medium",
        context: "Feature flag test",
        timeout: 30000,
      };

      const response = await intelligentRouter.executeSupportOperation(request);

      // Should use standard routing when cost optimization is disabled
      expect(response.success).toBe(true);
      expect(mockAuditTrail.logCostOptimizationStart).not.toHaveBeenCalled();
    });

    it("should integrate with cost performance optimizer", () => {
      // Verify integration with existing cost performance optimizer
      expect(costOptimizer).toBeDefined();
      expect(costPerformanceOptimizer).toBeDefined();

      const costSummary = costPerformanceOptimizer.getCostSummary();
      expect(costSummary).toHaveProperty("daily");
      expect(costSummary).toHaveProperty("monthly");
      expect(costSummary).toHaveProperty("cacheStats");
    });
  });

  describe("Error Handling and Resilience", () => {
    it("should handle routing failures gracefully", async () => {
      await costOptimizer.startCostOptimization();

      // Mock routing failure
      mockDirectBedrockClient.executeSupportOperation.mockRejectedValue(
        new Error("Direct route failed")
      );

      const request: SupportOperationRequest = {
        operation: "infrastructure",
        priority: "high",
        context: "Error handling test",
        timeout: 10000,
      };

      const response = await intelligentRouter.executeSupportOperation(request);

      // Should fallback to MCP route
      expect(response.success).toBe(true);
      expect(response.operationId).toContain("mcp");
      expect(mockMCPRouter.executeSupportOperation).toHaveBeenCalled();
    });

    it("should continue optimization after errors", async () => {
      await costOptimizer.startCostOptimization();

      // Simulate some errors
      mockDirectBedrockClient.executeSupportOperation
        .mockRejectedValueOnce(new Error("Temporary failure"))
        .mockResolvedValue({
          success: true,
          operationId: "direct-op-recovery",
          latencyMs: 100,
          timestamp: new Date(),
        });

      const request: SupportOperationRequest = {
        operation: "standard",
        priority: "medium",
        context: "Recovery test",
        timeout: 30000,
      };

      // First request should fail and fallback
      const response1 = await intelligentRouter.executeSupportOperation(
        request
      );
      expect(response1.success).toBe(true);

      // Second request should work normally
      const response2 = await intelligentRouter.executeSupportOperation(
        request
      );
      expect(response2.success).toBe(true);

      // Cost optimization should still be tracking
      const metrics = costOptimizer.getCostOptimizationMetrics();
      expect(metrics.routingDecisionsSaved).toBeGreaterThan(0);
    });
  });
});
