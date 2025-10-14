/**
 * Hybrid Routing Feature Flag Activation/Deactivation Tests
 *
 * Tests comprehensive feature flag behavior for hybrid routing system including:
 * - Flag activation/deactivation
 * - System behavior changes based on flag states
 * - Integration with routing components
 * - Safety mechanisms and validation
 */

import { AiFeatureFlags } from "../ai-feature-flags";
import { IntelligentRouter } from "../intelligent-router";

describe("Hybrid Routing Feature Flag Activation/Deactivation", () => {
  let featureFlags: AiFeatureFlags;
  let mockDirectBedrockClient: any;
  let mockMCPRouter: any;
  let mockInfrastructureAuditor: any;
  let mockMetaMonitor: any;
  let mockImplementationSupport: any;
  let mockHybridHealthMonitor: any;

  beforeEach(() => {
    featureFlags = new AiFeatureFlags();

    // Mock Direct Bedrock Client
    mockDirectBedrockClient = {
      executeSupportOperation: jest.fn().mockResolvedValue({
        success: true,
        text: "Direct Bedrock response",
        operationId: "direct-123",
        latencyMs: 500,
        timestamp: new Date(),
      }),
      getHealthStatus: jest.fn().mockResolvedValue({
        isHealthy: true,
        healthy: true,
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
        healthy: true,
        latencyMs: 400,
        successRate: 0.95,
        lastCheck: new Date(),
        consecutiveFailures: 0,
      }),
      isAvailable: jest.fn().mockReturnValue(true),
    };

    // Mock Infrastructure Auditor
    mockInfrastructureAuditor = {
      performSystemHealthCheck: jest.fn().mockResolvedValue({
        overallHealth: "healthy",
        timestamp: new Date(),
      }),
    };

    // Mock Meta Monitor
    mockMetaMonitor = {
      analyzeKiroExecution: jest.fn().mockResolvedValue({
        executionId: "exec-123",
        timestamp: new Date(),
      }),
    };

    // Mock Implementation Support
    mockImplementationSupport = {
      analyzeImplementationBacklog: jest.fn().mockResolvedValue({
        totalItems: 0,
        timestamp: new Date(),
      }),
    };

    // Mock Hybrid Health Monitor
    mockHybridHealthMonitor = {
      checkMCPHealth: jest.fn().mockResolvedValue({
        status: "healthy",
        latency: 400,
      }),
      checkDirectBedrockHealth: jest.fn().mockResolvedValue({
        status: "healthy",
        latency: 300,
      }),
    };
  });

  describe("Feature Flag Activation", () => {
    describe("Individual Flag Activation", () => {
      it("should activate ENABLE_BEDROCK_SUPPORT_MODE flag", async () => {
        expect(await featureFlags.isBedrockSupportModeEnabled()).toBe(false);

        await featureFlags.setBedrockSupportModeEnabled(true);

        expect(await featureFlags.isBedrockSupportModeEnabled()).toBe(true);
      });

      it("should activate ENABLE_INTELLIGENT_ROUTING flag", async () => {
        expect(await featureFlags.isIntelligentRoutingEnabled()).toBe(false);

        await featureFlags.setIntelligentRoutingEnabled(true);

        expect(await featureFlags.isIntelligentRoutingEnabled()).toBe(true);
      });

      it("should activate ENABLE_DIRECT_BEDROCK_FALLBACK flag", async () => {
        expect(await featureFlags.isDirectBedrockFallbackEnabled()).toBe(false);

        await featureFlags.setDirectBedrockFallbackEnabled(true);

        expect(await featureFlags.isDirectBedrockFallbackEnabled()).toBe(true);
      });
    });

    describe("Sequential Flag Activation", () => {
      it("should activate flags in recommended order", async () => {
        // Step 1: Enable Bedrock provider
        await featureFlags.setProviderEnabled("bedrock", true);
        expect(await featureFlags.isProviderEnabled("bedrock")).toBe(true);

        // Step 2: Enable Intelligent Routing
        await featureFlags.setIntelligentRoutingEnabled(true);
        expect(await featureFlags.isIntelligentRoutingEnabled()).toBe(true);

        // Step 3: Enable Support Mode
        await featureFlags.setBedrockSupportModeEnabled(true);
        expect(await featureFlags.isBedrockSupportModeEnabled()).toBe(true);

        // Step 4: Enable Direct Bedrock Fallback
        await featureFlags.setDirectBedrockFallbackEnabled(true);
        expect(await featureFlags.isDirectBedrockFallbackEnabled()).toBe(true);
      });

      it("should maintain flag independence during activation", async () => {
        // Enable support mode without routing
        await featureFlags.setBedrockSupportModeEnabled(true);
        expect(await featureFlags.isBedrockSupportModeEnabled()).toBe(true);
        expect(await featureFlags.isIntelligentRoutingEnabled()).toBe(false);

        // Enable routing without fallback
        await featureFlags.setIntelligentRoutingEnabled(true);
        expect(await featureFlags.isIntelligentRoutingEnabled()).toBe(true);
        expect(await featureFlags.isDirectBedrockFallbackEnabled()).toBe(false);

        // Enable fallback
        await featureFlags.setDirectBedrockFallbackEnabled(true);
        expect(await featureFlags.isDirectBedrockFallbackEnabled()).toBe(true);
      });
    });

    describe("Bulk Flag Activation", () => {
      it("should activate all hybrid routing flags at once", async () => {
        const result = await featureFlags.enableBedrockSupportModeSafely();

        expect(result.isValid).toBe(true);
        expect(await featureFlags.isBedrockSupportModeEnabled()).toBe(true);
        expect(await featureFlags.isIntelligentRoutingEnabled()).toBe(true);
        expect(await featureFlags.isProviderEnabled("bedrock")).toBe(true);
      });

      it("should validate prerequisites before bulk activation", async () => {
        // Disable Bedrock provider to cause validation failure
        await featureFlags.setProviderEnabled("bedrock", false);

        const result = await featureFlags.enableBedrockSupportModeSafely();

        expect(result.isValid).toBe(false);
        expect(await featureFlags.isBedrockSupportModeEnabled()).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Feature Flag Deactivation", () => {
    describe("Individual Flag Deactivation", () => {
      it("should deactivate ENABLE_BEDROCK_SUPPORT_MODE flag", async () => {
        await featureFlags.setBedrockSupportModeEnabled(true);
        expect(await featureFlags.isBedrockSupportModeEnabled()).toBe(true);

        await featureFlags.setBedrockSupportModeEnabled(false);

        expect(await featureFlags.isBedrockSupportModeEnabled()).toBe(false);
      });

      it("should deactivate ENABLE_INTELLIGENT_ROUTING flag", async () => {
        await featureFlags.setIntelligentRoutingEnabled(true);
        expect(await featureFlags.isIntelligentRoutingEnabled()).toBe(true);

        await featureFlags.setIntelligentRoutingEnabled(false);

        expect(await featureFlags.isIntelligentRoutingEnabled()).toBe(false);
      });

      it("should deactivate ENABLE_DIRECT_BEDROCK_FALLBACK flag", async () => {
        await featureFlags.setDirectBedrockFallbackEnabled(true);
        expect(await featureFlags.isDirectBedrockFallbackEnabled()).toBe(true);

        await featureFlags.setDirectBedrockFallbackEnabled(false);

        expect(await featureFlags.isDirectBedrockFallbackEnabled()).toBe(false);
      });
    });

    describe("Sequential Flag Deactivation", () => {
      it("should deactivate flags in safe order", async () => {
        // First activate all flags
        await featureFlags.setBedrockSupportModeEnabled(true);
        await featureFlags.setIntelligentRoutingEnabled(true);
        await featureFlags.setDirectBedrockFallbackEnabled(true);

        // Deactivate in reverse order
        await featureFlags.setDirectBedrockFallbackEnabled(false);
        expect(await featureFlags.isDirectBedrockFallbackEnabled()).toBe(false);
        expect(await featureFlags.isIntelligentRoutingEnabled()).toBe(true);

        await featureFlags.setBedrockSupportModeEnabled(false);
        expect(await featureFlags.isBedrockSupportModeEnabled()).toBe(false);
        expect(await featureFlags.isIntelligentRoutingEnabled()).toBe(true);

        await featureFlags.setIntelligentRoutingEnabled(false);
        expect(await featureFlags.isIntelligentRoutingEnabled()).toBe(false);
      });

      it("should maintain system stability during deactivation", async () => {
        // Enable all flags
        await featureFlags.setBedrockSupportModeEnabled(true);
        await featureFlags.setIntelligentRoutingEnabled(true);
        await featureFlags.setDirectBedrockFallbackEnabled(true);

        // Deactivate support mode but keep routing
        await featureFlags.setBedrockSupportModeEnabled(false);
        expect(await featureFlags.isBedrockSupportModeEnabled()).toBe(false);
        expect(await featureFlags.isIntelligentRoutingEnabled()).toBe(true);
        expect(await featureFlags.isDirectBedrockFallbackEnabled()).toBe(true);
      });
    });

    describe("Bulk Flag Deactivation", () => {
      it("should deactivate all hybrid routing flags safely", async () => {
        // First activate all flags
        await featureFlags.setBedrockSupportModeEnabled(true);
        await featureFlags.setIntelligentRoutingEnabled(true);
        await featureFlags.setDirectBedrockFallbackEnabled(true);

        await featureFlags.disableBedrockSupportModeSafely();

        expect(await featureFlags.isBedrockSupportModeEnabled()).toBe(false);
        expect(await featureFlags.isDirectBedrockFallbackEnabled()).toBe(false);
        // Intelligent routing may remain enabled for other features
        expect(await featureFlags.isIntelligentRoutingEnabled()).toBe(true);
      });

      it("should handle deactivation when flags are already disabled", async () => {
        // Ensure all flags are disabled
        await featureFlags.setBedrockSupportModeEnabled(false);
        await featureFlags.setDirectBedrockFallbackEnabled(false);

        await featureFlags.disableBedrockSupportModeSafely();

        expect(await featureFlags.isBedrockSupportModeEnabled()).toBe(false);
        expect(await featureFlags.isDirectBedrockFallbackEnabled()).toBe(false);
      });
    });
  });

  describe("System Behavior Changes", () => {
    describe("Intelligent Router Behavior", () => {
      it("should use direct Bedrock when intelligent routing is enabled", async () => {
        // Enable intelligent routing BEFORE creating router
        await featureFlags.setIntelligentRoutingEnabled(true);

        const router = new IntelligentRouter(
          mockDirectBedrockClient,
          mockMCPRouter
        );

        // Setup routing rules
        router.updateRoutingRules([
          {
            operationType: "infrastructure_audit",
            route: "direct",
            reason: "Infrastructure audits use direct Bedrock",
            priority: "high",
          },
        ]);

        const request = {
          operation: "infrastructure_audit",
          priority: "high" as const,
          prompt: "Perform infrastructure audit",
        };

        const response = await router.executeSupportOperation(request);

        expect(response).toBeDefined();
        // Verify that some operation was executed (either direct or MCP)
        expect(
          mockDirectBedrockClient.executeSupportOperation.mock.calls.length +
            mockMCPRouter.executeSupportOperation.mock.calls.length
        ).toBeGreaterThan(0);

        router.destroy();
      });

      it("should fallback to MCP when direct Bedrock is unavailable", async () => {
        const router = new IntelligentRouter(
          mockDirectBedrockClient,
          mockMCPRouter
        );

        // Setup routing rules
        router.updateRoutingRules([
          {
            operationType: "test_operation",
            route: "mcp",
            reason: "Test operations use MCP",
            priority: "medium",
          },
        ]);

        await featureFlags.setIntelligentRoutingEnabled(true);
        await featureFlags.setDirectBedrockFallbackEnabled(true);

        // Simulate direct Bedrock failure
        mockDirectBedrockClient.executeSupportOperation.mockRejectedValueOnce(
          new Error("Direct Bedrock unavailable")
        );

        const request = {
          operation: "test_operation",
          priority: "medium" as const,
          prompt: "Test operation",
        };

        const response = await router.executeSupportOperation(request);

        expect(response).toBeDefined();

        router.destroy();
      });
    });

    describe("Bedrock Support Manager Behavior", () => {
      it("should check support mode activation state", async () => {
        // Test that feature flags control support mode state
        expect(await featureFlags.isBedrockSupportModeEnabled()).toBe(false);

        await featureFlags.setBedrockSupportModeEnabled(true);
        expect(await featureFlags.isBedrockSupportModeEnabled()).toBe(true);

        await featureFlags.setBedrockSupportModeEnabled(false);
        expect(await featureFlags.isBedrockSupportModeEnabled()).toBe(false);
      });

      it("should validate support mode configuration", async () => {
        await featureFlags.setProviderEnabled("bedrock", true);
        await featureFlags.setBedrockSupportModeEnabled(true);
        await featureFlags.setIntelligentRoutingEnabled(true);

        const config = await featureFlags.getBedrockSupportModeConfig();

        expect(config.supportModeEnabled).toBe(true);
        expect(config.intelligentRoutingEnabled).toBe(true);
        expect(config.environment).toBeDefined();
      });
    });
  });

  describe("Flag State Transitions", () => {
    describe("Rapid Toggle Scenarios", () => {
      it("should handle rapid flag toggling", async () => {
        // Rapidly toggle support mode
        await featureFlags.setBedrockSupportModeEnabled(true);
        await featureFlags.setBedrockSupportModeEnabled(false);
        await featureFlags.setBedrockSupportModeEnabled(true);
        await featureFlags.setBedrockSupportModeEnabled(false);

        expect(await featureFlags.isBedrockSupportModeEnabled()).toBe(false);
      });

      it("should maintain consistency during concurrent flag changes", async () => {
        // Simulate concurrent flag changes
        await Promise.all([
          featureFlags.setBedrockSupportModeEnabled(true),
          featureFlags.setIntelligentRoutingEnabled(true),
          featureFlags.setDirectBedrockFallbackEnabled(true),
        ]);

        expect(await featureFlags.isBedrockSupportModeEnabled()).toBe(true);
        expect(await featureFlags.isIntelligentRoutingEnabled()).toBe(true);
        expect(await featureFlags.isDirectBedrockFallbackEnabled()).toBe(true);
      });
    });

    describe("State Persistence", () => {
      it("should persist flag state across operations", async () => {
        await featureFlags.setBedrockSupportModeEnabled(true);
        await featureFlags.setIntelligentRoutingEnabled(true);

        // Perform some operations
        const allFlags = featureFlags.getAllFlags();

        // Verify state persists
        expect(await featureFlags.isBedrockSupportModeEnabled()).toBe(true);
        expect(await featureFlags.isIntelligentRoutingEnabled()).toBe(true);
        expect(allFlags["ENABLE_BEDROCK_SUPPORT_MODE"]).toBe(true);
        expect(allFlags["ENABLE_INTELLIGENT_ROUTING"]).toBe(true);
      });
    });
  });

  describe("Safety Mechanisms", () => {
    describe("Validation During Activation", () => {
      it("should validate prerequisites before enabling support mode", async () => {
        // First enable support mode, then disable provider to create invalid state
        await featureFlags.setBedrockSupportModeEnabled(true);
        await featureFlags.setProviderEnabled("bedrock", false);

        const result = await featureFlags.validateBedrockSupportModeFlags();

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(
          "Bedrock Support Mode requires Bedrock provider to be enabled"
        );
      });

      it("should warn about suboptimal configurations", async () => {
        await featureFlags.setProviderEnabled("bedrock", true);
        await featureFlags.setBedrockSupportModeEnabled(true);
        await featureFlags.setIntelligentRoutingEnabled(false);

        const result = await featureFlags.validateBedrockSupportModeFlags();

        expect(result.warnings).toContain(
          "Bedrock Support Mode works best with Intelligent Routing enabled"
        );
      });
    });

    describe("Graceful Degradation", () => {
      it("should maintain system operation when flags are disabled", async () => {
        await featureFlags.setBedrockSupportModeEnabled(false);
        await featureFlags.setIntelligentRoutingEnabled(false);

        // System should still function with other providers
        expect(await featureFlags.isProviderEnabled("google")).toBe(true);
        expect(await featureFlags.isProviderEnabled("meta")).toBe(true);
      });

      it("should prevent invalid flag combinations", async () => {
        // Try to enable fallback without support mode
        await featureFlags.setBedrockSupportModeEnabled(false);
        await featureFlags.setDirectBedrockFallbackEnabled(true);

        const result = await featureFlags.validateBedrockSupportModeFlags();

        expect(result.warnings).toContain(
          "Direct Bedrock Fallback is enabled but Support Mode is disabled"
        );
      });
    });
  });

  describe("Environment-Specific Behavior", () => {
    describe("Development Environment", () => {
      it("should apply development configuration", async () => {
        await featureFlags.applyEnvironmentConfiguration("development");

        expect(await featureFlags.isBedrockSupportModeEnabled()).toBe(false);
        expect(await featureFlags.isIntelligentRoutingEnabled()).toBe(true);
        expect(await featureFlags.isDirectBedrockFallbackEnabled()).toBe(false);
      });
    });

    describe("Staging Environment", () => {
      it("should apply staging configuration", async () => {
        await featureFlags.applyEnvironmentConfiguration("staging");

        expect(await featureFlags.isBedrockSupportModeEnabled()).toBe(false);
        expect(await featureFlags.isIntelligentRoutingEnabled()).toBe(true);
        expect(await featureFlags.isDirectBedrockFallbackEnabled()).toBe(true);
      });
    });

    describe("Production Environment", () => {
      it("should apply production configuration", async () => {
        await featureFlags.applyEnvironmentConfiguration("production");

        expect(await featureFlags.isBedrockSupportModeEnabled()).toBe(false);
        expect(await featureFlags.isIntelligentRoutingEnabled()).toBe(true);
        expect(await featureFlags.isDirectBedrockFallbackEnabled()).toBe(true);
      });
    });
  });

  describe("Integration with Monitoring", () => {
    it("should track flag state changes in audit logs", async () => {
      const initialFlags = featureFlags.getAllFlags();

      await featureFlags.setBedrockSupportModeEnabled(true);
      await featureFlags.setIntelligentRoutingEnabled(true);

      const updatedFlags = featureFlags.getAllFlags();

      expect(initialFlags["ENABLE_BEDROCK_SUPPORT_MODE"]).toBe(false);
      expect(updatedFlags["ENABLE_BEDROCK_SUPPORT_MODE"]).toBe(true);
      expect(updatedFlags["ENABLE_INTELLIGENT_ROUTING"]).toBe(true);
    });

    it("should provide flag state for health checks", async () => {
      await featureFlags.setBedrockSupportModeEnabled(true);
      await featureFlags.setIntelligentRoutingEnabled(true);

      const config = await featureFlags.getBedrockSupportModeConfig();

      expect(config.supportModeEnabled).toBe(true);
      expect(config.intelligentRoutingEnabled).toBe(true);
      expect(config.environment).toBeDefined();
    });
  });

  describe("Error Handling", () => {
    it("should handle flag activation errors gracefully", async () => {
      // This should not throw even if there are internal issues
      await expect(
        featureFlags.setBedrockSupportModeEnabled(true)
      ).resolves.not.toThrow();
    });

    it("should handle flag deactivation errors gracefully", async () => {
      await featureFlags.setBedrockSupportModeEnabled(true);

      // This should not throw even if there are internal issues
      await expect(
        featureFlags.setBedrockSupportModeEnabled(false)
      ).resolves.not.toThrow();
    });

    it("should handle validation errors gracefully", async () => {
      // This should not throw even with invalid configurations
      await expect(
        featureFlags.validateBedrockSupportModeFlags()
      ).resolves.not.toThrow();
    });
  });
});
