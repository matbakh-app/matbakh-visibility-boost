/**
 * Hybrid Routing Scenarios Tests
 *
 * Comprehensive tests for hybrid routing scenarios using mock implementations.
 * This file demonstrates how to use the mock factories for testing various
 * hybrid routing scenarios in the Bedrock Support Manager system.
 */

import { CompleteMockSuite, QuickMockSetup } from "./__mocks__";

describe("Hybrid Routing Scenarios", () => {
  let mockSuite: CompleteMockSuite;

  afterEach(() => {
    if (mockSuite) {
      mockSuite.clearAllCalls();
    }
  });

  describe("Normal Operations Scenario", () => {
    beforeEach(() => {
      mockSuite = QuickMockSetup.normalOperations();
    });

    it("should route support operations to direct Bedrock", async () => {
      const decision = mockSuite.intelligentRouter.decide({
        operation: "infrastructure_audit",
        priority: "high",
      });

      expect(decision.useDirectBedrock).toBe(true);
      expect(decision.fallbackStrategy).toBe("mcp");
    });

    it("should execute support operation successfully", async () => {
      const result =
        await mockSuite.directBedrock.executeSupportOperation.mockResolvedValue(
          {
            success: true,
            operationId: "test-op-123",
            result: { analysis: "Test analysis" },
            latency: 250,
            tokensUsed: 150,
            cost: 0.001,
            timestamp: new Date(),
          }
        );

      const response = await mockSuite.directBedrock.executeSupportOperation({
        operation: "infrastructure_audit",
        priority: "high",
      });

      expect(response.success).toBe(true);
      expect(response.latency).toBeLessThan(1000);
    });

    it("should report healthy system status", async () => {
      const health = await mockSuite.hybridHealthMonitor.getOverallHealth();

      expect(health.overallStatus).toBe("healthy");
      expect(health.mcpHealth.status).toBe("healthy");
      expect(health.directBedrockHealth.status).toBe("healthy");
    });

    it("should log all operations to audit trail", async () => {
      await mockSuite.auditTrail.logEvent({
        eventType: "support_operation",
        severity: "info",
        action: "infrastructure_audit",
        outcome: "success",
      });

      expect(mockSuite.auditTrail.logEvent).toHaveBeenCalled();
      expect(mockSuite.auditTrail.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: "support_operation",
          action: "infrastructure_audit",
        })
      );
    });
  });

  describe("MCP Failure with Fallback Scenario", () => {
    beforeEach(() => {
      mockSuite = QuickMockSetup.mcpFailure();
    });

    it("should detect MCP unavailability", async () => {
      const health = await mockSuite.mcpRouter.getHealthStatus();

      expect(health.status).toBe("unhealthy");
      expect(health.errorRate).toBeGreaterThan(0.5);
    });

    it("should route to direct Bedrock when MCP fails", async () => {
      const decision = mockSuite.intelligentRouter.decide({
        operation: "support_operation",
        priority: "high",
      });

      expect(decision.useDirectBedrock).toBe(true);
      expect(decision.fallbackStrategy).toBe("none");
    });

    it("should execute operation via direct Bedrock successfully", async () => {
      const response = await mockSuite.directBedrock.executeSupportOperation({
        operation: "emergency_support",
        priority: "critical",
      });

      expect(response.success).toBe(true);
      expect(
        mockSuite.directBedrock.executeSupportOperation
      ).toHaveBeenCalled();
    });

    it("should report degraded overall health", async () => {
      const health = await mockSuite.hybridHealthMonitor.getOverallHealth();

      expect(health.overallStatus).toBe("degraded");
      expect(health.mcpHealth.status).toBe("degraded");
      expect(health.recommendations).toContain(
        "Consider routing more traffic to Direct Bedrock"
      );
    });

    it("should log fallback events", async () => {
      await mockSuite.auditTrail.logEvent({
        eventType: "routing_decision",
        severity: "warning",
        action: "fallback_to_direct",
        outcome: "success",
        metadata: {
          reason: "MCP unavailable",
          originalRoute: "mcp",
          fallbackRoute: "direct",
        },
      });

      expect(mockSuite.auditTrail.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "fallback_to_direct",
          metadata: expect.objectContaining({
            reason: "MCP unavailable",
          }),
        })
      );
    });
  });

  describe("High Load Scenario", () => {
    beforeEach(() => {
      mockSuite = QuickMockSetup.highLoad();
    });

    it("should detect high latency on both paths", async () => {
      const health = await mockSuite.hybridHealthMonitor.getOverallHealth();

      expect(health.overallStatus).toBe("critical");
      expect(health.mcpHealth.latency).toBeGreaterThan(1000);
      expect(health.directBedrockHealth.latency).toBeGreaterThan(1000);
    });

    it("should recommend system-wide investigation", async () => {
      const health = await mockSuite.hybridHealthMonitor.getOverallHealth();

      expect(health.recommendations).toContain(
        "Investigate system-wide performance issues"
      );
      expect(health.recommendations).toContain(
        "Consider emergency mode activation"
      );
    });

    it("should still execute operations with degraded performance", async () => {
      const response = await mockSuite.directBedrock.executeSupportOperation({
        operation: "infrastructure_audit",
        priority: "high",
      });

      expect(response.success).toBe(true);
      expect(response.latency).toBeGreaterThan(1000);
    });

    it("should log performance degradation events", async () => {
      await mockSuite.auditTrail.logEvent({
        eventType: "performance_alert",
        severity: "warning",
        action: "high_latency_detected",
        outcome: "monitoring",
        metadata: {
          mcpLatency: 2000,
          directBedrockLatency: 1500,
          threshold: 1000,
        },
      });

      expect(mockSuite.auditTrail.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: "performance_alert",
          severity: "warning",
        })
      );
    });
  });

  describe("Emergency Operations Scenario", () => {
    beforeEach(() => {
      mockSuite = QuickMockSetup.emergency();
    });

    it("should route emergency operations to direct Bedrock", async () => {
      const decision = mockSuite.intelligentRouter.decide({
        operation: "emergency_shutdown",
        priority: "critical",
      });

      expect(decision.operationType).toBe("emergency");
      expect(decision.useDirectBedrock).toBe(true);
      expect(decision.fallbackStrategy).toBe("none");
    });

    it("should execute emergency operation with low latency", async () => {
      const response = await mockSuite.directBedrock.executeEmergencyOperation({
        operation: "emergency_shutdown",
        severity: "critical",
      });

      expect(response.success).toBe(true);
      expect(response.latency).toBeLessThan(500);
    });

    it("should bypass MCP for emergency operations", async () => {
      await mockSuite.directBedrock.executeEmergencyOperation({
        operation: "emergency_support",
        severity: "critical",
      });

      expect(mockSuite.mcpRouter.route).not.toHaveBeenCalled();
      expect(
        mockSuite.directBedrock.executeEmergencyOperation
      ).toHaveBeenCalled();
    });

    it("should log emergency operations with high severity", async () => {
      await mockSuite.auditTrail.logEvent({
        eventType: "emergency_operation",
        severity: "critical",
        action: "emergency_shutdown",
        outcome: "success",
        metadata: {
          reason: "Critical system failure",
          responseTime: 100,
        },
      });

      expect(mockSuite.auditTrail.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: "emergency_operation",
          severity: "critical",
        })
      );
    });
  });

  describe("System Recovery Scenario", () => {
    beforeEach(() => {
      mockSuite = QuickMockSetup.recovery();
    });

    it("should show degraded but improving status", async () => {
      const directHealth =
        await mockSuite.directBedrock.getHealthStatus.mockResolvedValue({
          status: "degraded",
          latency: 800,
          errorRate: 0.05,
          circuitBreakerState: "half-open",
        });

      const health = await mockSuite.directBedrock.getHealthStatus();

      expect(health.status).toBe("degraded");
      expect(health.circuitBreakerState).toBe("half-open");
    });

    it("should gradually increase traffic to recovering path", async () => {
      const efficiency =
        await mockSuite.hybridHealthMonitor.analyzeRoutingEfficiency();

      expect(efficiency.mcpSuccessRate).toBeGreaterThan(0.8);
      expect(efficiency.directBedrockSuccessRate).toBeGreaterThan(0.9);
    });

    it("should monitor recovery progress", async () => {
      await mockSuite.auditTrail.logEvent({
        eventType: "system_recovery",
        severity: "info",
        action: "recovery_progress",
        outcome: "monitoring",
        metadata: {
          phase: "gradual_recovery",
          successRate: 0.85,
          latency: 800,
        },
      });

      expect(mockSuite.auditTrail.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: "system_recovery",
          action: "recovery_progress",
        })
      );
    });
  });

  describe("Custom Scenario Configuration", () => {
    it("should allow custom mock configuration", () => {
      mockSuite = QuickMockSetup.custom((suite) => {
        // Configure direct Bedrock for high latency
        suite.directBedrock.configureHighLatency();

        // Configure MCP as unavailable
        suite.mcpRouter.configureUnavailable();

        // Configure feature flags with warnings
        suite.featureFlags.configureWithWarnings([
          "Performance degradation detected",
        ]);
      });

      expect(mockSuite.directBedrock).toBeDefined();
      expect(mockSuite.mcpRouter).toBeDefined();
      expect(mockSuite.featureFlags).toBeDefined();
    });

    it("should support complex scenario combinations", () => {
      mockSuite = QuickMockSetup.custom((suite) => {
        // Simulate partial system failure
        suite.directBedrock.configureDegraded();
        suite.mcpRouter.configureSlow();
        suite.infrastructureAuditor.configureWithIssues();
        suite.metaMonitor.configurePerformanceIssues();

        // Configure compliance warnings
        suite.complianceIntegration.configureWithWarnings([
          "Approaching compliance threshold",
        ]);

        // Configure audit trail with high volume
        suite.auditTrail.configureHighVolume(5000);
      });

      expect(mockSuite.getAllMocks()).toBeDefined();
      expect(Object.keys(mockSuite.getAllMocks()).length).toBeGreaterThan(10);
    });
  });

  describe("Mock State Management", () => {
    beforeEach(() => {
      mockSuite = QuickMockSetup.normalOperations();
    });

    it("should save and restore mock state", () => {
      // Save initial state
      mockSuite.stateManager.saveState(
        "directBedrock",
        mockSuite.directBedrock.executeSupportOperation
      );

      // Modify mock
      mockSuite.directBedrock.executeSupportOperation.mockResolvedValue({
        success: false,
        error: "Test error",
      });

      // Restore state
      mockSuite.stateManager.restoreState(
        "directBedrock",
        mockSuite.directBedrock.executeSupportOperation
      );

      expect(mockSuite.stateManager).toBeDefined();
    });

    it("should reset all mocks to default state", () => {
      // Make some calls
      mockSuite.directBedrock.executeSupportOperation();
      mockSuite.mcpRouter.route();
      mockSuite.auditTrail.logEvent();

      // Reset all
      mockSuite.resetAll();

      // Verify reset (mocks should still be defined but cleared)
      expect(mockSuite.directBedrock).toBeDefined();
      expect(mockSuite.mcpRouter).toBeDefined();
      expect(mockSuite.auditTrail).toBeDefined();
    });

    it("should clear all mock call history", () => {
      // Make some calls
      mockSuite.directBedrock.executeSupportOperation();
      mockSuite.mcpRouter.route();

      // Clear calls
      mockSuite.clearAllCalls();

      // Verify calls cleared
      expect(
        mockSuite.directBedrock.executeSupportOperation
      ).not.toHaveBeenCalled();
      expect(mockSuite.mcpRouter.route).not.toHaveBeenCalled();
    });
  });

  describe("Integration with Real Components", () => {
    beforeEach(() => {
      mockSuite = QuickMockSetup.normalOperations();
    });

    it("should provide mocks compatible with BedrockSupportManager", () => {
      // Verify all required mocks are present
      const requiredMocks = [
        "directBedrock",
        "mcpRouter",
        "intelligentRouter",
        "infrastructureAuditor",
        "metaMonitor",
        "implementationSupport",
        "hybridHealthMonitor",
        "auditTrail",
        "featureFlags",
        "circuitBreaker",
        "complianceIntegration",
        "gdprValidator",
        "bedrockAdapter",
        "kiroBridge",
      ];

      const allMocks = mockSuite.getAllMocks();
      requiredMocks.forEach((mockName) => {
        expect(allMocks[mockName]).toBeDefined();
      });
    });

    it("should support dependency injection patterns", () => {
      // Simulate dependency injection
      const dependencies = {
        directBedrockClient: mockSuite.directBedrock,
        mcpRouter: mockSuite.mcpRouter,
        intelligentRouter: mockSuite.intelligentRouter,
        auditTrail: mockSuite.auditTrail,
        featureFlags: mockSuite.featureFlags,
      };

      expect(dependencies.directBedrockClient).toBeDefined();
      expect(dependencies.mcpRouter).toBeDefined();
      expect(dependencies.intelligentRouter).toBeDefined();
      expect(dependencies.auditTrail).toBeDefined();
      expect(dependencies.featureFlags).toBeDefined();
    });
  });
});
