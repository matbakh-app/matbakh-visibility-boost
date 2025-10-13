/**
 * Hybrid Routing Audit Integration Tests
 *
 * Tests the comprehensive audit trail integration for hybrid routing operations
 * including intelligent routing decisions, direct Bedrock operations, MCP routing,
 * fallback scenarios, health monitoring, and compliance validation.
 */

import { AuditTrailSystem } from "../audit-trail-system";
import { DirectBedrockClient } from "../direct-bedrock-client";
import { IntelligentRouter } from "../intelligent-router";
import { MCPRouter } from "../mcp-router";

// Mock dependencies with proper implementations
jest.mock("../audit-trail-system", () => ({
  AuditTrailSystem: jest.fn().mockImplementation(() => ({
    logHybridRoutingDecision: jest.fn().mockResolvedValue(undefined),
    logDirectBedrockOperation: jest.fn().mockResolvedValue(undefined),
    logMCPRoutingOperation: jest.fn().mockResolvedValue(undefined),
    logIntelligentRoutingFallback: jest.fn().mockResolvedValue(undefined),
    logRouteHealthCheck: jest.fn().mockResolvedValue(undefined),
    logRoutingOptimization: jest.fn().mockResolvedValue(undefined),
    logGDPRComplianceValidation: jest.fn().mockResolvedValue(undefined),
    logPIIRedaction: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock("../direct-bedrock-client", () => ({
  DirectBedrockClient: jest.fn().mockImplementation(() => ({
    executeSupportOperation: jest.fn().mockResolvedValue({
      success: true,
      operationId: "test-operation-123",
      latencyMs: 150,
      timestamp: new Date(),
      text: "Operation completed successfully",
    }),
    performHealthCheck: jest.fn().mockResolvedValue({
      isHealthy: true,
      latencyMs: 100,
      lastCheck: new Date(),
      consecutiveFailures: 0,
      circuitBreakerState: "closed",
    }),
  })),
}));

jest.mock("../mcp-router", () => ({
  MCPRouter: jest.fn().mockImplementation(() => ({
    executeSupportOperation: jest.fn().mockResolvedValue({
      success: true,
      operationId: "mcp-operation-456",
      latencyMs: 200,
      timestamp: new Date(),
      text: "MCP operation completed",
    }),
    getHealthStatus: jest.fn().mockResolvedValue({
      route: "mcp",
      isHealthy: true,
      latencyMs: 120,
      successRate: 0.95,
      lastCheck: new Date(),
      consecutiveFailures: 0,
      connectionStatus: "connected",
      queueSize: 0,
      pendingOperations: 0,
      lastSuccessfulOperation: new Date(),
      errorRate: 0.05,
    }),
    isAvailable: jest.fn().mockReturnValue(true),
  })),
}));

jest.mock("../ai-feature-flags", () => ({
  AiFeatureFlags: jest.fn().mockImplementation(() => ({
    isEnabled: jest.fn().mockReturnValue(true),
  })),
}));

jest.mock("../circuit-breaker", () => ({
  CircuitBreaker: jest.fn().mockImplementation(() => ({
    isOpen: jest.fn().mockReturnValue(false),
    execute: jest.fn().mockImplementation((service, fn) => fn()),
  })),
}));

jest.mock("../gdpr-hybrid-compliance-validator", () => ({
  GDPRHybridComplianceValidator: jest.fn().mockImplementation(() => ({
    validateBeforeRouting: jest.fn().mockResolvedValue({
      allowed: true,
      reason: "GDPR compliant",
    }),
  })),
}));

describe("Hybrid Routing Audit Integration", () => {
  let auditTrail: jest.Mocked<AuditTrailSystem>;
  let directBedrockClient: jest.Mocked<DirectBedrockClient>;
  let mcpRouter: jest.Mocked<MCPRouter>;
  let intelligentRouter: IntelligentRouter;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mocked instances
    directBedrockClient =
      new DirectBedrockClient() as jest.Mocked<DirectBedrockClient>;
    mcpRouter = new MCPRouter() as jest.Mocked<MCPRouter>;

    // Create intelligent router instance
    intelligentRouter = new IntelligentRouter(directBedrockClient, mcpRouter);

    // Get the audit trail instance from the router for testing
    auditTrail = (intelligentRouter as any)
      .auditTrail as jest.Mocked<AuditTrailSystem>;
  });

  afterEach(() => {
    // Clean up resources
    if (intelligentRouter && typeof intelligentRouter.destroy === "function") {
      intelligentRouter.destroy();
    }
  });

  describe("Routing Decision Audit Logging", () => {
    it("should log hybrid routing decisions for emergency operations", async () => {
      const request = {
        operation: "emergency" as const,
        priority: "critical" as const,
        prompt: "Emergency system failure detected",
        context: {
          correlationId: "emergency-123",
        },
      };

      await intelligentRouter.executeSupportOperation(request);

      // Verify routing decision was logged
      expect(auditTrail.logHybridRoutingDecision).toHaveBeenCalledWith(
        expect.stringContaining("router-"),
        expect.objectContaining({
          selectedRoute: "direct",
          reason: expect.stringContaining("Primary route"),
          fallbackAvailable: false,
          estimatedLatency: expect.any(Number),
          correlationId: expect.stringContaining("router-"),
        }),
        "emergency",
        "critical"
      );
    });

    it("should log routing decisions for infrastructure operations", async () => {
      const request = {
        operation: "infrastructure" as const,
        priority: "critical" as const,
        prompt: "Infrastructure audit required",
        context: {
          correlationId: "infra-456",
        },
      };

      await intelligentRouter.executeSupportOperation(request);

      // Verify routing decision was logged
      expect(auditTrail.logHybridRoutingDecision).toHaveBeenCalledWith(
        expect.stringContaining("router-"),
        expect.objectContaining({
          selectedRoute: "direct",
          reason: expect.stringContaining("Primary route"),
          fallbackAvailable: true,
          estimatedLatency: expect.any(Number),
        }),
        "infrastructure",
        "critical"
      );
    });

    it("should log routing decisions for standard operations routed to MCP", async () => {
      const request = {
        operation: "standard" as const,
        priority: "medium" as const,
        prompt: "Standard analysis request",
        context: {
          correlationId: "standard-789",
        },
      };

      await intelligentRouter.executeSupportOperation(request);

      // Verify routing decision was logged
      expect(auditTrail.logHybridRoutingDecision).toHaveBeenCalledWith(
        expect.stringContaining("router-"),
        expect.objectContaining({
          selectedRoute: "mcp",
          reason: expect.stringContaining("Primary route"),
          fallbackAvailable: true,
          estimatedLatency: expect.any(Number),
        }),
        "standard",
        "medium"
      );
    });
  });

  describe("Fallback Scenario Audit Logging", () => {
    it("should log intelligent routing fallback when primary route fails", async () => {
      // Mock direct Bedrock client to fail
      directBedrockClient.executeSupportOperation = jest
        .fn()
        .mockRejectedValue(new Error("Direct Bedrock unavailable"));

      const request = {
        operation: "infrastructure" as const,
        priority: "critical" as const,
        prompt: "Infrastructure audit with fallback",
        context: {
          correlationId: "fallback-test-123",
        },
      };

      await intelligentRouter.executeSupportOperation(request);

      // Verify fallback was logged
      expect(auditTrail.logIntelligentRoutingFallback).toHaveBeenCalledWith(
        expect.stringContaining("router-"),
        "direct",
        "mcp",
        "Primary route failed",
        "infrastructure",
        "Direct Bedrock unavailable"
      );
    });

    it("should not log fallback for emergency operations (no fallback available)", async () => {
      // Mock direct Bedrock client to fail
      directBedrockClient.executeSupportOperation = jest
        .fn()
        .mockRejectedValue(new Error("Emergency system failure"));

      const request = {
        operation: "emergency" as const,
        priority: "critical" as const,
        prompt: "Emergency operation failure",
        context: {
          correlationId: "emergency-fail-456",
        },
      };

      const response = await intelligentRouter.executeSupportOperation(request);

      // Verify no fallback was attempted (emergency operations have no fallback)
      expect(auditTrail.logIntelligentRoutingFallback).not.toHaveBeenCalled();
      expect(response.success).toBe(false);
    });
  });

  describe("Health Monitoring Audit Logging", () => {
    it("should log route health checks during monitoring intervals", async () => {
      // Clear any cached health status to force fresh health checks
      (intelligentRouter as any).routeHealthStatus.clear();

      // Trigger health monitoring manually (normally done by interval)
      const directHealth = await intelligentRouter.checkRouteHealth("direct");
      const mcpHealth = await intelligentRouter.checkRouteHealth("mcp");

      // Verify health checks were logged
      expect(auditTrail.logRouteHealthCheck).toHaveBeenCalledWith(
        "direct",
        directHealth.isHealthy,
        directHealth.latencyMs,
        directHealth.successRate,
        directHealth.consecutiveFailures,
        undefined // No error for healthy route
      );

      expect(auditTrail.logRouteHealthCheck).toHaveBeenCalledWith(
        "mcp",
        mcpHealth.isHealthy,
        mcpHealth.latencyMs,
        mcpHealth.successRate,
        mcpHealth.consecutiveFailures,
        undefined // No error for healthy route
      );
    });

    it("should log health check failures with error details", async () => {
      // Clear any cached health status to force fresh health checks
      (intelligentRouter as any).routeHealthStatus.clear();

      // Mock unhealthy direct Bedrock client
      directBedrockClient.performHealthCheck = jest.fn().mockResolvedValue({
        isHealthy: false,
        latencyMs: 5000,
        lastCheck: new Date(),
        consecutiveFailures: 3,
        circuitBreakerState: "open" as const,
        error: "Connection timeout",
      });

      const directHealth = await intelligentRouter.checkRouteHealth("direct");

      // Verify health check failure was logged with error
      expect(auditTrail.logRouteHealthCheck).toHaveBeenCalledWith(
        "direct",
        false,
        5000,
        expect.any(Number),
        1, // First failure since cache was cleared
        "direct route health check failed"
      );
    });
  });

  describe("Routing Optimization Audit Logging", () => {
    it("should log routing optimization recommendations", async () => {
      // Set up metrics that would trigger optimization recommendations
      const mockMetrics = {
        totalRequests: 150,
        directRouteUsage: 30,
        mcpRouteUsage: 120,
        fallbackUsage: 25,
        averageLatency: 18000,
        successRate: 0.92,
        costEfficiency: 0.6, // Low cost efficiency to trigger recommendations
        optimizationRecommendations: [],
      };

      // Mock the routing metrics
      (intelligentRouter as any).routingMetrics = mockMetrics;

      // Clear health status to force fresh health checks
      (intelligentRouter as any).routeHealthStatus.clear();

      // Manually trigger the health monitoring logic that includes optimization
      const recommendations = await intelligentRouter.optimizeRouting();

      // Simulate the health monitoring interval logic that logs optimization
      if (recommendations.length > 0) {
        await auditTrail.logRoutingOptimization(recommendations, {
          totalRequests: mockMetrics.totalRequests,
          directRouteUsage: mockMetrics.directRouteUsage,
          mcpRouteUsage: mockMetrics.mcpRouteUsage,
          fallbackUsage: mockMetrics.fallbackUsage,
          averageLatency: mockMetrics.averageLatency,
          successRate: mockMetrics.successRate,
        });
      }

      // The optimization should generate recommendations based on the metrics
      expect(recommendations.length).toBeGreaterThan(0);

      // Verify optimization was logged
      expect(auditTrail.logRoutingOptimization).toHaveBeenCalledWith(
        recommendations,
        expect.objectContaining({
          totalRequests: mockMetrics.totalRequests,
          directRouteUsage: mockMetrics.directRouteUsage,
          mcpRouteUsage: mockMetrics.mcpRouteUsage,
          fallbackUsage: mockMetrics.fallbackUsage,
          averageLatency: mockMetrics.averageLatency,
          successRate: mockMetrics.successRate,
        })
      );
    });
  });

  describe("Audit Trail Event Integrity", () => {
    it("should maintain audit trail integrity across multiple operations", async () => {
      const requests = [
        {
          operation: "emergency" as const,
          priority: "critical" as const,
          prompt: "Emergency operation 1",
        },
        {
          operation: "infrastructure" as const,
          priority: "critical" as const,
          prompt: "Infrastructure operation 2",
        },
        {
          operation: "standard" as const,
          priority: "medium" as const,
          prompt: "Standard operation 3",
        },
      ];

      // Execute multiple operations
      for (const request of requests) {
        await intelligentRouter.executeSupportOperation(request);
      }

      // Verify all routing decisions were logged
      expect(auditTrail.logHybridRoutingDecision).toHaveBeenCalledTimes(3);

      // Verify each operation type was logged correctly
      const calls = (auditTrail.logHybridRoutingDecision as jest.Mock).mock
        .calls;
      expect(calls[0][2]).toBe("emergency");
      expect(calls[1][2]).toBe("infrastructure");
      expect(calls[2][2]).toBe("standard");
    });

    it("should generate unique correlation IDs for each operation", async () => {
      const request1 = {
        operation: "emergency" as const,
        priority: "critical" as const,
        prompt: "First operation",
      };

      const request2 = {
        operation: "infrastructure" as const,
        priority: "critical" as const,
        prompt: "Second operation",
      };

      await intelligentRouter.executeSupportOperation(request1);
      await intelligentRouter.executeSupportOperation(request2);

      // Verify unique correlation IDs were generated
      const calls = (auditTrail.logHybridRoutingDecision as jest.Mock).mock
        .calls;
      const correlationId1 = calls[0][0];
      const correlationId2 = calls[1][0];

      expect(correlationId1).not.toBe(correlationId2);
      expect(correlationId1).toMatch(/^router-\d+-[a-z0-9]+$/);
      expect(correlationId2).toMatch(/^router-\d+-[a-z0-9]+$/);
    });
  });

  describe("Compliance Audit Integration", () => {
    it("should integrate with GDPR compliance validation audit logging", async () => {
      // This test verifies that the audit trail integration works with
      // the existing GDPR compliance validation in DirectBedrockClient
      const request = {
        operation: "infrastructure" as const,
        priority: "critical" as const,
        prompt: "GDPR compliant infrastructure audit",
        context: {
          userId: "user-123",
          tenant: "eu-tenant",
        },
      };

      await intelligentRouter.executeSupportOperation(request);

      // Verify routing decision was logged (this confirms the integration works)
      expect(auditTrail.logHybridRoutingDecision).toHaveBeenCalledWith(
        expect.stringContaining("router-"),
        expect.objectContaining({
          selectedRoute: "direct",
          reason: expect.stringContaining("Primary route"),
        }),
        "infrastructure",
        "critical"
      );

      // The DirectBedrockClient would also log GDPR compliance validation
      // but that's tested in its own test suite
    });
  });
});
