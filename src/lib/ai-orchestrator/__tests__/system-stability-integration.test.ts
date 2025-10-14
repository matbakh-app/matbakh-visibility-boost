/**
 * System Stability Integration Tests
 *
 * Test suite for system stability integration functionality.
 */

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { AiFeatureFlags } from "../ai-feature-flags";
import { AuditTrailSystem } from "../audit-trail-system";
import { BedrockSupportManager } from "../bedrock-support-manager";
import { IntelligentRouter } from "../intelligent-router";
import { SystemResourceMonitor } from "../system-resource-monitor";
import { SystemStabilityIntegration } from "../system-stability-integration";

// Mock dependencies
jest.mock("../ai-feature-flags");
jest.mock("../audit-trail-system");
jest.mock("../system-resource-monitor");
jest.mock("../bedrock-support-manager");
jest.mock("../intelligent-router");

describe("SystemStabilityIntegration", () => {
  let stabilityIntegration: SystemStabilityIntegration;
  let mockFeatureFlags: jest.Mocked<AiFeatureFlags>;
  let mockAuditTrail: jest.Mocked<AuditTrailSystem>;
  let mockResourceMonitor: jest.Mocked<SystemResourceMonitor>;
  let mockBedrockSupport: jest.Mocked<BedrockSupportManager>;
  let mockIntelligentRouter: jest.Mocked<IntelligentRouter>;

  beforeEach(() => {
    // Create mocks
    mockFeatureFlags = new AiFeatureFlags() as jest.Mocked<AiFeatureFlags>;
    mockAuditTrail = new AuditTrailSystem() as jest.Mocked<AuditTrailSystem>;
    mockResourceMonitor = new SystemResourceMonitor(
      mockFeatureFlags,
      mockAuditTrail
    ) as jest.Mocked<SystemResourceMonitor>;
    mockBedrockSupport = new BedrockSupportManager(
      mockFeatureFlags,
      mockAuditTrail
    ) as jest.Mocked<BedrockSupportManager>;
    mockIntelligentRouter = new IntelligentRouter(
      mockFeatureFlags,
      mockAuditTrail
    ) as jest.Mocked<IntelligentRouter>;

    // Setup mock implementations
    mockAuditTrail.logEvent = jest.fn().mockResolvedValue(undefined);
    mockResourceMonitor.getCurrentMetrics = jest.fn().mockResolvedValue({
      timestamp: new Date(),
      cpuUsagePercent: 0.5,
      memoryUsageMB: 25,
      memoryUsagePercent: 2.5,
      totalMemoryMB: 1000,
      processId: 12345,
      uptime: 3600,
    });

    // Create stability integration instance
    stabilityIntegration = new SystemStabilityIntegration(
      mockFeatureFlags,
      mockAuditTrail,
      mockResourceMonitor,
      mockBedrockSupport,
      mockIntelligentRouter
    );
  });

  afterEach(async () => {
    await stabilityIntegration.cleanup();
    jest.clearAllMocks();
  });

  describe("Initialization", () => {
    it("should initialize successfully", async () => {
      await stabilityIntegration.initialize();

      const status = stabilityIntegration.getStatus();
      expect(status.isActive).toBe(true);
      expect(mockAuditTrail.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: "stability_integration_initialized",
        })
      );
    });

    it("should handle initialization with custom config", async () => {
      const customConfig = {
        stabilityThresholds: {
          criticalStabilityScore: 0.7,
          warningStabilityScore: 0.85,
          maxAllowedErrorRate: 0.03,
          minRequiredAvailability: 99.5,
        },
        responseActions: {
          enableAutoRecovery: false,
          enablePerformanceOptimization: true,
          enableRoutingAdjustments: false,
          enableResourceScaling: true,
        },
      };

      const customIntegration = new SystemStabilityIntegration(
        mockFeatureFlags,
        mockAuditTrail,
        mockResourceMonitor,
        mockBedrockSupport,
        mockIntelligentRouter,
        customConfig
      );

      await customIntegration.initialize();

      const status = customIntegration.getStatus();
      expect(status.isActive).toBe(true);
      expect(status.config.stabilityThresholds.criticalStabilityScore).toBe(
        0.7
      );

      await customIntegration.cleanup();
    });

    it("should not initialize when disabled", async () => {
      const disabledIntegration = new SystemStabilityIntegration(
        mockFeatureFlags,
        mockAuditTrail,
        mockResourceMonitor,
        mockBedrockSupport,
        mockIntelligentRouter,
        { enabled: false }
      );

      await disabledIntegration.initialize();

      const status = disabledIntegration.getStatus();
      expect(status.isActive).toBe(false);
    });

    it("should handle initialization errors gracefully", async () => {
      // Mock audit trail to throw error
      mockAuditTrail.logEvent.mockRejectedValueOnce(
        new Error("Audit trail error")
      );

      await expect(stabilityIntegration.initialize()).rejects.toThrow();

      const status = stabilityIntegration.getStatus();
      expect(status.isActive).toBe(false);
    });
  });

  describe("Lifecycle Management", () => {
    beforeEach(async () => {
      await stabilityIntegration.initialize();
    });

    it("should shutdown successfully", async () => {
      await stabilityIntegration.shutdown();

      const status = stabilityIntegration.getStatus();
      expect(status.isActive).toBe(false);
      expect(mockAuditTrail.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: "stability_integration_shutdown",
        })
      );
    });

    it("should handle multiple shutdown calls gracefully", async () => {
      await stabilityIntegration.shutdown();
      await stabilityIntegration.shutdown(); // Second call should not throw

      const status = stabilityIntegration.getStatus();
      expect(status.isActive).toBe(false);
    });

    it("should cleanup resources properly", async () => {
      await stabilityIntegration.cleanup();

      const status = stabilityIntegration.getStatus();
      expect(status.isActive).toBe(false);
      expect(status.responseHistoryCount).toBe(0);
    });
  });

  describe("Stability Monitoring", () => {
    beforeEach(async () => {
      await stabilityIntegration.initialize();
    });

    it("should provide access to stability metrics", () => {
      const stabilityMetrics = stabilityIntegration.getStabilityMetrics();
      expect(stabilityMetrics).toBeDefined();
    });

    it("should force stability check", async () => {
      // Should not throw error
      await expect(
        stabilityIntegration.forceStabilityCheck()
      ).resolves.not.toThrow();
    });

    it("should handle stability check errors gracefully", async () => {
      // Mock resource monitor to throw error
      mockResourceMonitor.getCurrentMetrics.mockRejectedValue(
        new Error("Resource error")
      );

      // Should not throw error
      await expect(
        stabilityIntegration.forceStabilityCheck()
      ).resolves.not.toThrow();
    });
  });

  describe("Response Actions", () => {
    beforeEach(async () => {
      await stabilityIntegration.initialize();
    });

    it("should record response history", async () => {
      // Trigger a stability check that might generate responses
      await stabilityIntegration.forceStabilityCheck();

      const responseHistory = stabilityIntegration.getResponseHistory();
      expect(Array.isArray(responseHistory)).toBe(true);
    });

    it("should limit response history when requested", async () => {
      // Add some mock responses by forcing multiple checks
      for (let i = 0; i < 5; i++) {
        await stabilityIntegration.forceStabilityCheck();
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      const limitedHistory = stabilityIntegration.getResponseHistory(3);
      expect(limitedHistory.length).toBeLessThanOrEqual(3);
    });

    it("should handle auto-recovery when enabled", async () => {
      const integrationWithRecovery = new SystemStabilityIntegration(
        mockFeatureFlags,
        mockAuditTrail,
        mockResourceMonitor,
        mockBedrockSupport,
        mockIntelligentRouter,
        {
          responseActions: {
            enableAutoRecovery: true,
            enablePerformanceOptimization: true,
            enableRoutingAdjustments: true,
            enableResourceScaling: false,
          },
        }
      );

      await integrationWithRecovery.initialize();
      await integrationWithRecovery.forceStabilityCheck();

      const status = integrationWithRecovery.getStatus();
      expect(status.isActive).toBe(true);

      await integrationWithRecovery.cleanup();
    });

    it("should handle disabled response actions", async () => {
      const integrationWithoutActions = new SystemStabilityIntegration(
        mockFeatureFlags,
        mockAuditTrail,
        mockResourceMonitor,
        mockBedrockSupport,
        mockIntelligentRouter,
        {
          responseActions: {
            enableAutoRecovery: false,
            enablePerformanceOptimization: false,
            enableRoutingAdjustments: false,
            enableResourceScaling: false,
          },
        }
      );

      await integrationWithoutActions.initialize();
      await integrationWithoutActions.forceStabilityCheck();

      const status = integrationWithoutActions.getStatus();
      expect(status.isActive).toBe(true);

      await integrationWithoutActions.cleanup();
    });
  });

  describe("Configuration Management", () => {
    beforeEach(async () => {
      await stabilityIntegration.initialize();
    });

    it("should update configuration", () => {
      const newConfig = {
        stabilityThresholds: {
          criticalStabilityScore: 0.75,
          warningStabilityScore: 0.88,
          maxAllowedErrorRate: 0.04,
          minRequiredAvailability: 99.2,
        },
      };

      stabilityIntegration.updateConfig(newConfig);

      const status = stabilityIntegration.getStatus();
      expect(status.config.stabilityThresholds.criticalStabilityScore).toBe(
        0.75
      );
    });

    it("should provide current status", () => {
      const status = stabilityIntegration.getStatus();

      expect(status).toHaveProperty("isActive");
      expect(status).toHaveProperty("lastStabilityCheck");
      expect(status).toHaveProperty("responseHistoryCount");
      expect(status).toHaveProperty("config");
      expect(typeof status.isActive).toBe("boolean");
      expect(typeof status.responseHistoryCount).toBe("number");
    });
  });

  describe("Integration with Components", () => {
    it("should work with minimal components", async () => {
      const minimalIntegration = new SystemStabilityIntegration(
        mockFeatureFlags,
        mockAuditTrail,
        mockResourceMonitor
      );

      await minimalIntegration.initialize();

      const status = minimalIntegration.getStatus();
      expect(status.isActive).toBe(true);

      await minimalIntegration.cleanup();
    });

    it("should work with all components", async () => {
      const fullIntegration = new SystemStabilityIntegration(
        mockFeatureFlags,
        mockAuditTrail,
        mockResourceMonitor,
        mockBedrockSupport,
        mockIntelligentRouter
      );

      await fullIntegration.initialize();

      const status = fullIntegration.getStatus();
      expect(status.isActive).toBe(true);

      await fullIntegration.cleanup();
    });

    it("should handle component failures gracefully", async () => {
      // Mock bedrock support to be undefined
      const integrationWithFailure = new SystemStabilityIntegration(
        mockFeatureFlags,
        mockAuditTrail,
        mockResourceMonitor,
        undefined, // No bedrock support
        mockIntelligentRouter
      );

      await integrationWithFailure.initialize();
      await integrationWithFailure.forceStabilityCheck();

      const status = integrationWithFailure.getStatus();
      expect(status.isActive).toBe(true);

      await integrationWithFailure.cleanup();
    });
  });

  describe("Notification Handling", () => {
    beforeEach(async () => {
      await stabilityIntegration.initialize();
    });

    it("should handle audit logging notifications", async () => {
      const integrationWithNotifications = new SystemStabilityIntegration(
        mockFeatureFlags,
        mockAuditTrail,
        mockResourceMonitor,
        mockBedrockSupport,
        mockIntelligentRouter,
        {
          notifications: {
            enableSlackAlerts: false,
            enableEmailAlerts: false,
            enableAuditLogging: true,
          },
        }
      );

      await integrationWithNotifications.initialize();
      await integrationWithNotifications.forceStabilityCheck();

      // Should have logged events to audit trail
      expect(mockAuditTrail.logEvent).toHaveBeenCalled();

      await integrationWithNotifications.cleanup();
    });

    it("should handle disabled notifications", async () => {
      const integrationWithoutNotifications = new SystemStabilityIntegration(
        mockFeatureFlags,
        mockAuditTrail,
        mockResourceMonitor,
        mockBedrockSupport,
        mockIntelligentRouter,
        {
          notifications: {
            enableSlackAlerts: false,
            enableEmailAlerts: false,
            enableAuditLogging: false,
          },
        }
      );

      await integrationWithoutNotifications.initialize();
      await integrationWithoutNotifications.forceStabilityCheck();

      const status = integrationWithoutNotifications.getStatus();
      expect(status.isActive).toBe(true);

      await integrationWithoutNotifications.cleanup();
    });
  });

  describe("Error Handling", () => {
    it("should handle audit trail errors during initialization", async () => {
      mockAuditTrail.logEvent.mockRejectedValue(new Error("Audit error"));

      await expect(stabilityIntegration.initialize()).rejects.toThrow(
        "Audit error"
      );
    });

    it("should handle resource monitor errors during checks", async () => {
      await stabilityIntegration.initialize();

      mockResourceMonitor.getCurrentMetrics.mockRejectedValue(
        new Error("Resource error")
      );

      // Should not throw error
      await expect(
        stabilityIntegration.forceStabilityCheck()
      ).resolves.not.toThrow();
    });

    it("should handle shutdown errors gracefully", async () => {
      await stabilityIntegration.initialize();

      // Mock audit trail to throw error during shutdown
      mockAuditTrail.logEvent.mockRejectedValueOnce(
        new Error("Shutdown error")
      );

      // Should not throw error
      await expect(stabilityIntegration.shutdown()).resolves.not.toThrow();
    });
  });

  describe("Performance", () => {
    it("should handle multiple concurrent stability checks", async () => {
      await stabilityIntegration.initialize();

      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(stabilityIntegration.forceStabilityCheck());
      }

      // Should complete all checks without errors
      await expect(Promise.all(promises)).resolves.not.toThrow();
    });

    it("should maintain reasonable response times", async () => {
      await stabilityIntegration.initialize();

      const startTime = Date.now();
      await stabilityIntegration.forceStabilityCheck();
      const endTime = Date.now();

      const duration = endTime - startTime;

      // Should complete within reasonable time (less than 5 seconds)
      expect(duration).toBeLessThan(5000);
    });
  });

  describe("Edge Cases", () => {
    it("should handle initialization without auto-start monitoring", async () => {
      const manualIntegration = new SystemStabilityIntegration(
        mockFeatureFlags,
        mockAuditTrail,
        mockResourceMonitor,
        mockBedrockSupport,
        mockIntelligentRouter,
        { autoStartMonitoring: false }
      );

      await manualIntegration.initialize();

      const status = manualIntegration.getStatus();
      expect(status.isActive).toBe(true);

      await manualIntegration.cleanup();
    });

    it("should handle empty response history", () => {
      const responseHistory = stabilityIntegration.getResponseHistory();
      expect(Array.isArray(responseHistory)).toBe(true);
      expect(responseHistory.length).toBe(0);
    });

    it("should handle stability check when not active", async () => {
      // Don't initialize, try to force check
      await expect(
        stabilityIntegration.forceStabilityCheck()
      ).resolves.not.toThrow();
    });
  });
});
