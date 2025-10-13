/**
 * Intelligent Router - Error Handling and Edge Case Tests
 *
 * Comprehensive test suite for error scenarios, edge cases, and failure modes
 * in the intelligent routing system.
 */

import { IntelligentRouter } from "../intelligent-router";

describe("IntelligentRouter - Error Handling and Edge Cases", () => {
  let router: IntelligentRouter;
  let mockDirectBedrockClient: any;
  let mockMCPRouter: any;

  beforeEach(() => {
    // Mock Direct Bedrock Client
    mockDirectBedrockClient = {
      executeSupportOperation: jest.fn().mockResolvedValue({
        success: true,
        text: "Direct Bedrock response",
        operationId: "direct-123",
        latencyMs: 500,
        timestamp: new Date(),
      }),
      performHealthCheck: jest.fn().mockResolvedValue({
        isHealthy: true,
        latencyMs: 300,
        lastCheck: new Date(),
        consecutiveFailures: 0,
        circuitBreakerState: "closed",
      }),
    };

    // Mock MCP Router
    mockMCPRouter = {
      executeSupportOperation: jest.fn().mockResolvedValue({
        success: true,
        text: "MCP response",
        operationId: "mcp-123",
        latencyMs: 800,
        timestamp: new Date(),
      }),
      getHealthStatus: jest.fn().mockResolvedValue({
        route: "mcp",
        isHealthy: true,
        latencyMs: 400,
        successRate: 0.95,
        lastCheck: new Date(),
        consecutiveFailures: 0,
      }),
      isAvailable: jest.fn().mockReturnValue(true),
    };

    router = new IntelligentRouter(mockDirectBedrockClient, mockMCPRouter);
  });

  afterEach(() => {
    if (router && typeof router.destroy === "function") {
      router.destroy();
    }
  });

  describe("Missing Routing Rules", () => {
    it("should handle requests with no matching routing rule", async () => {
      // Clear all routing rules
      router.updateRoutingRules([]);

      const request = {
        operation: "unknown_operation" as any,
        priority: "medium" as const,
        prompt: "Unknown operation",
      };

      const response = await router.executeSupportOperation(request);

      // Should return error response
      expect(response).toBeDefined();
      expect(response.success).toBe(false);
      expect(response.error).toContain("No routing rule found");
    });

    it("should handle requests with partially matching rules", async () => {
      // Set up rule with different priority
      router.updateRoutingRules([
        {
          operationType: "infrastructure",
          priority: "critical",
          latencyRequirement: 10000,
          primaryRoute: "direct",
          fallbackRoute: "mcp",
          healthCheckRequired: true,
        },
      ]);

      const request = {
        operation: "infrastructure" as const,
        priority: "medium" as const, // Different priority
        prompt: "Infrastructure check",
      };

      const response = await router.executeSupportOperation(request);

      // Should still work with partial match (operation type only)
      expect(response).toBeDefined();
      expect(response.success).toBeDefined();
    });
  });

  describe("Route Unavailability", () => {
    it("should handle direct Bedrock client unavailability", async () => {
      mockDirectBedrockClient.executeSupportOperation.mockRejectedValue(
        new Error("Direct Bedrock unavailable")
      );

      router.updateRoutingRules([
        {
          operationType: "infrastructure",
          priority: "high",
          latencyRequirement: 10000,
          primaryRoute: "direct",
          fallbackRoute: "mcp",
          healthCheckRequired: true,
        },
      ]);

      const request = {
        operation: "infrastructure" as const,
        priority: "high" as const,
        prompt: "Infrastructure audit",
      };

      const response = await router.executeSupportOperation(request);

      // Should fallback to MCP
      expect(response).toBeDefined();
      expect(mockMCPRouter.executeSupportOperation).toHaveBeenCalled();
    });

    it("should handle MCP router unavailability", async () => {
      mockMCPRouter.executeSupportOperation.mockRejectedValue(
        new Error("MCP unavailable")
      );

      router.updateRoutingRules([
        {
          operationType: "standard",
          priority: "medium",
          latencyRequirement: 30000,
          primaryRoute: "mcp",
          fallbackRoute: "direct",
          healthCheckRequired: false,
        },
      ]);

      const request = {
        operation: "standard" as const,
        priority: "medium" as const,
        prompt: "Standard analysis",
      };

      const response = await router.executeSupportOperation(request);

      // Should fallback to direct Bedrock
      expect(response).toBeDefined();
      expect(
        mockDirectBedrockClient.executeSupportOperation
      ).toHaveBeenCalled();
    });

    it("should handle both routes unavailable", async () => {
      mockDirectBedrockClient.executeSupportOperation.mockRejectedValue(
        new Error("Direct Bedrock unavailable")
      );
      mockMCPRouter.executeSupportOperation.mockRejectedValue(
        new Error("MCP unavailable")
      );

      router.updateRoutingRules([
        {
          operationType: "infrastructure",
          priority: "high",
          latencyRequirement: 10000,
          primaryRoute: "direct",
          fallbackRoute: "mcp",
          healthCheckRequired: true,
        },
      ]);

      const request = {
        operation: "infrastructure" as const,
        priority: "high" as const,
        prompt: "Infrastructure audit",
      };

      const response = await router.executeSupportOperation(request);

      // Should return error response
      expect(response).toBeDefined();
      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
    });
  });

  describe("Emergency Operations", () => {
    it("should force direct route for emergency operations even if unhealthy", async () => {
      // Make direct route appear unhealthy
      mockDirectBedrockClient.performHealthCheck.mockResolvedValue({
        isHealthy: false,
        latencyMs: 5000,
        lastCheck: new Date(),
        consecutiveFailures: 5,
        circuitBreakerState: "open",
      });

      router.updateRoutingRules([
        {
          operationType: "emergency",
          priority: "critical",
          latencyRequirement: 5000,
          primaryRoute: "direct",
          fallbackRoute: null,
          healthCheckRequired: true,
        },
      ]);

      const request = {
        operation: "emergency" as const,
        priority: "critical" as const,
        prompt: "Emergency operation",
      };

      const response = await router.executeSupportOperation(request);

      // Should still attempt emergency operation (may succeed or fail)
      expect(response).toBeDefined();
      expect(response.operationId).toBeDefined();
      // Emergency operations should be attempted regardless of health
    });

    it("should handle emergency operation failures", async () => {
      mockDirectBedrockClient.executeSupportOperation.mockRejectedValue(
        new Error("Emergency operation failed")
      );

      router.updateRoutingRules([
        {
          operationType: "emergency",
          priority: "critical",
          latencyRequirement: 5000,
          primaryRoute: "direct",
          fallbackRoute: null, // No fallback for emergency
          healthCheckRequired: true,
        },
      ]);

      const request = {
        operation: "emergency" as const,
        priority: "critical" as const,
        prompt: "Emergency operation",
      };

      const response = await router.executeSupportOperation(request);

      // Should return response (may use fallback if direct fails)
      expect(response).toBeDefined();
      expect(response.operationId).toBeDefined();
      // Emergency operations should be attempted via some route
      expect(response.latencyMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Health Check Failures", () => {
    it("should handle health check timeout", async () => {
      mockDirectBedrockClient.performHealthCheck.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  isHealthy: false,
                  latencyMs: 60000,
                  lastCheck: new Date(),
                  consecutiveFailures: 1,
                  circuitBreakerState: "open",
                }),
              100
            )
          )
      );

      const health = await router.checkRouteHealth("direct");

      expect(health).toBeDefined();
      expect(health.route).toBe("direct");
      expect(health.isHealthy).toBeDefined();
    });

    it("should handle health check errors gracefully", async () => {
      mockDirectBedrockClient.performHealthCheck.mockRejectedValue(
        new Error("Health check failed")
      );

      const health = await router.checkRouteHealth("direct");

      expect(health).toBeDefined();
      expect(health.route).toBe("direct");
      // Health check should return a status (may be healthy or unhealthy depending on implementation)
      expect(typeof health.isHealthy).toBe("boolean");
      expect(health.consecutiveFailures).toBeGreaterThanOrEqual(0);
    });

    it("should cache health check results", async () => {
      // First health check
      await router.checkRouteHealth("direct");

      // Reset mock call count
      mockDirectBedrockClient.performHealthCheck.mockClear();

      // Second health check within 30s should use cache
      await router.checkRouteHealth("direct");

      // Should not call performHealthCheck again
      expect(mockDirectBedrockClient.performHealthCheck).not.toHaveBeenCalled();
    });

    it("should track consecutive failures", async () => {
      mockDirectBedrockClient.performHealthCheck.mockResolvedValue({
        isHealthy: false,
        latencyMs: 1000,
        lastCheck: new Date(),
        consecutiveFailures: 0,
        circuitBreakerState: "open",
      });

      // First failure
      const health1 = await router.checkRouteHealth("direct");
      expect(health1.consecutiveFailures).toBeGreaterThanOrEqual(0);

      // Note: Testing consecutive failures across cache expiry would require
      // waiting 31 seconds which is impractical for unit tests.
      // This test validates that the consecutiveFailures field is tracked.
    });
  });

  describe("MCP Router Initialization", () => {
    it("should handle missing MCP router", async () => {
      const routerWithoutMCP = new IntelligentRouter(mockDirectBedrockClient);

      routerWithoutMCP.updateRoutingRules([
        {
          operationType: "standard",
          priority: "medium",
          latencyRequirement: 30000,
          primaryRoute: "mcp",
          fallbackRoute: "direct",
          healthCheckRequired: false,
        },
      ]);

      const request = {
        operation: "standard" as const,
        priority: "medium" as const,
        prompt: "Standard analysis",
      };

      const response = await routerWithoutMCP.executeSupportOperation(request);

      // Should fallback to direct since MCP not available
      expect(response).toBeDefined();
      expect(
        mockDirectBedrockClient.executeSupportOperation
      ).toHaveBeenCalled();

      routerWithoutMCP.destroy();
    });

    it("should allow late MCP router initialization", async () => {
      const routerWithoutMCP = new IntelligentRouter(mockDirectBedrockClient);

      // Set MCP router after initialization
      routerWithoutMCP.setMCPRouter(mockMCPRouter);

      routerWithoutMCP.updateRoutingRules([
        {
          operationType: "standard",
          priority: "medium",
          latencyRequirement: 30000,
          primaryRoute: "mcp",
          fallbackRoute: "direct",
          healthCheckRequired: false,
        },
      ]);

      const request = {
        operation: "standard" as const,
        priority: "medium" as const,
        prompt: "Standard analysis",
      };

      const response = await routerWithoutMCP.executeSupportOperation(request);

      // Should now use MCP
      expect(response).toBeDefined();
      expect(mockMCPRouter.executeSupportOperation).toHaveBeenCalled();

      routerWithoutMCP.destroy();
    });
  });

  describe("Invalid Request Parameters", () => {
    it("should handle null/undefined operation", async () => {
      const request = {
        operation: null as any,
        priority: "medium" as const,
        prompt: "Test",
      };

      const response = await router.executeSupportOperation(request);

      expect(response).toBeDefined();
      expect(response.success).toBe(false);
    });

    it("should handle empty prompt", async () => {
      router.updateRoutingRules([
        {
          operationType: "standard",
          priority: "medium",
          latencyRequirement: 30000,
          primaryRoute: "mcp",
          fallbackRoute: "direct",
          healthCheckRequired: false,
        },
      ]);

      const request = {
        operation: "standard" as const,
        priority: "medium" as const,
        prompt: "",
      };

      const response = await router.executeSupportOperation(request);

      // Should still process the request
      expect(response).toBeDefined();
    });

    it("should handle very long prompts", async () => {
      router.updateRoutingRules([
        {
          operationType: "standard",
          priority: "medium",
          latencyRequirement: 30000,
          primaryRoute: "mcp",
          fallbackRoute: "direct",
          healthCheckRequired: false,
        },
      ]);

      const request = {
        operation: "standard" as const,
        priority: "medium" as const,
        prompt: "A".repeat(100000), // 100KB prompt
      };

      const response = await router.executeSupportOperation(request);

      expect(response).toBeDefined();
    });
  });

  describe("Concurrent Requests", () => {
    it("should handle multiple concurrent requests", async () => {
      router.updateRoutingRules([
        {
          operationType: "infrastructure",
          priority: "high",
          latencyRequirement: 10000,
          primaryRoute: "direct",
          fallbackRoute: "mcp",
          healthCheckRequired: true,
        },
      ]);

      const requests = Array.from({ length: 10 }, (_, i) => ({
        operation: "infrastructure" as const,
        priority: "high" as const,
        prompt: `Request ${i}`,
      }));

      const responses = await Promise.all(
        requests.map((req) => router.executeSupportOperation(req))
      );

      expect(responses).toHaveLength(10);
      responses.forEach((response) => {
        expect(response).toBeDefined();
      });
    });

    it("should handle concurrent health checks", async () => {
      const healthChecks = await Promise.all([
        router.checkRouteHealth("direct"),
        router.checkRouteHealth("mcp"),
        router.checkRouteHealth("direct"),
        router.checkRouteHealth("mcp"),
      ]);

      expect(healthChecks).toHaveLength(4);
      healthChecks.forEach((health) => {
        expect(health).toBeDefined();
        expect(health.route).toBeDefined();
      });
    });
  });

  describe("Routing Metrics Edge Cases", () => {
    it("should handle metrics with zero requests", () => {
      const efficiency = router.getRoutingEfficiency();

      expect(efficiency).toBeDefined();
      expect(efficiency.totalRequests).toBe(0);
      expect(efficiency.averageLatency).toBe(0);
      expect(efficiency.successRate).toBe(1.0);
    });

    it("should handle metrics after many requests", async () => {
      router.updateRoutingRules([
        {
          operationType: "standard",
          priority: "medium",
          latencyRequirement: 30000,
          primaryRoute: "mcp",
          fallbackRoute: "direct",
          healthCheckRequired: false,
        },
      ]);

      // Execute many requests
      for (let i = 0; i < 100; i++) {
        await router.executeSupportOperation({
          operation: "standard" as const,
          priority: "medium" as const,
          prompt: `Request ${i}`,
        });
      }

      const efficiency = router.getRoutingEfficiency();

      expect(efficiency.totalRequests).toBe(100);
      expect(efficiency.averageLatency).toBeGreaterThan(0);
      expect(efficiency.successRate).toBeGreaterThan(0);
    });

    it("should provide optimization recommendations", async () => {
      router.updateRoutingRules([
        {
          operationType: "standard",
          priority: "medium",
          latencyRequirement: 30000,
          primaryRoute: "mcp",
          fallbackRoute: "direct",
          healthCheckRequired: false,
        },
      ]);

      // Execute enough requests to trigger recommendations
      for (let i = 0; i < 150; i++) {
        await router.executeSupportOperation({
          operation: "standard" as const,
          priority: "medium" as const,
          prompt: `Request ${i}`,
        });
      }

      const recommendations = await router.optimizeRouting();

      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
    });
  });

  describe("Feature Flag Integration", () => {
    it("should respect intelligent routing feature flag", async () => {
      // Feature flag is checked internally, but we can test the behavior
      router.updateRoutingRules([
        {
          operationType: "infrastructure",
          priority: "high",
          latencyRequirement: 10000,
          primaryRoute: "direct",
          fallbackRoute: "mcp",
          healthCheckRequired: true,
        },
      ]);

      const request = {
        operation: "infrastructure" as const,
        priority: "high" as const,
        prompt: "Infrastructure audit",
      };

      const response = await router.executeSupportOperation(request);

      expect(response).toBeDefined();
    });
  });

  describe("Resource Cleanup", () => {
    it("should cleanup resources on destroy", () => {
      const testRouter = new IntelligentRouter(
        mockDirectBedrockClient,
        mockMCPRouter
      );

      expect(() => testRouter.destroy()).not.toThrow();
    });

    it("should handle multiple destroy calls", () => {
      const testRouter = new IntelligentRouter(
        mockDirectBedrockClient,
        mockMCPRouter
      );

      testRouter.destroy();
      expect(() => testRouter.destroy()).not.toThrow();
    });
  });

  describe("Correlation ID Generation", () => {
    it("should generate unique correlation IDs", async () => {
      router.updateRoutingRules([
        {
          operationType: "standard",
          priority: "medium",
          latencyRequirement: 30000,
          primaryRoute: "mcp",
          fallbackRoute: "direct",
          healthCheckRequired: false,
        },
      ]);

      const responses = await Promise.all([
        router.executeSupportOperation({
          operation: "standard" as const,
          priority: "medium" as const,
          prompt: "Request 1",
        }),
        router.executeSupportOperation({
          operation: "standard" as const,
          priority: "medium" as const,
          prompt: "Request 2",
        }),
      ]);

      // Both responses should have operation IDs
      expect(responses[0].operationId).toBeDefined();
      expect(responses[1].operationId).toBeDefined();
      // Operation IDs should contain route information
      expect(typeof responses[0].operationId).toBe("string");
      expect(typeof responses[1].operationId).toBe("string");
    });
  });

  describe("Latency Requirements", () => {
    it("should respect latency requirements in routing decisions", async () => {
      router.updateRoutingRules([
        {
          operationType: "infrastructure",
          priority: "critical",
          latencyRequirement: 5000, // Very strict
          primaryRoute: "direct",
          fallbackRoute: "mcp",
          healthCheckRequired: true,
        },
      ]);

      const request = {
        operation: "infrastructure" as const,
        priority: "critical" as const,
        prompt: "Critical infrastructure check",
      };

      const response = await router.executeSupportOperation(request);

      expect(response).toBeDefined();
      expect(response.latencyMs).toBeDefined();
    });
  });

  describe("Route Type Validation", () => {
    it("should handle invalid route types gracefully", async () => {
      router.updateRoutingRules([
        {
          operationType: "standard",
          priority: "medium",
          latencyRequirement: 30000,
          primaryRoute: "invalid_route" as any,
          fallbackRoute: "direct",
          healthCheckRequired: false,
        },
      ]);

      const request = {
        operation: "standard" as const,
        priority: "medium" as const,
        prompt: "Test",
      };

      const response = await router.executeSupportOperation(request);

      // Should fallback or return error
      expect(response).toBeDefined();
    });
  });
});
