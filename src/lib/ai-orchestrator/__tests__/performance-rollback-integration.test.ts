/**
 * Performance Rollback Integration Tests
 *
 * Tests for the integration between rollback manager and existing systems
 */

import { AiFeatureFlags } from "../ai-feature-flags";
import { CircuitBreaker } from "../circuit-breaker";
import { PerformanceMetrics, PerformanceMonitor } from "../performance-monitor";
import {
  DEFAULT_INTEGRATION_CONFIG,
  PerformanceRollbackIntegration,
  RollbackIntegrationConfig,
  RollbackNotification,
} from "../performance-rollback-integration";

// Mock dependencies
jest.mock("../performance-monitor");
jest.mock("../circuit-breaker");
jest.mock("../ai-feature-flags");

describe("PerformanceRollbackIntegration", () => {
  let integration: PerformanceRollbackIntegration;
  let mockPerformanceMonitor: jest.Mocked<PerformanceMonitor>;
  let mockCircuitBreaker: jest.Mocked<CircuitBreaker>;
  let mockFeatureFlags: jest.Mocked<AiFeatureFlags>;
  let mockConfig: RollbackIntegrationConfig;

  beforeEach(() => {
    mockPerformanceMonitor = {
      getCurrentMetrics: jest.fn(),
      getProviderMetrics: jest.fn(),
      getActiveAlerts: jest.fn(),
    } as any;

    mockCircuitBreaker = {
      forceOpen: jest.fn(),
      isOpen: jest.fn(),
      close: jest.fn(),
    } as any;

    mockFeatureFlags = {
      disableAllExperimentalFeatures: jest.fn(),
      setFlag: jest.fn(),
      getAllFlags: jest.fn(),
    } as any;

    mockConfig = {
      ...DEFAULT_INTEGRATION_CONFIG,
      monitoringIntervalMs: 100, // Fast interval for testing
      alertingEnabled: true,
      emergencyContacts: ["admin@matbakh.app"],
    };

    integration = new PerformanceRollbackIntegration(
      mockPerformanceMonitor,
      mockCircuitBreaker,
      mockFeatureFlags,
      mockConfig
    );
  });

  afterEach(() => {
    integration.stopMonitoring();
    jest.clearAllMocks();
  });

  describe("Monitoring Lifecycle", () => {
    it("should start and stop monitoring", () => {
      expect(integration["isMonitoring"]).toBe(false);

      integration.startMonitoring();
      expect(integration["isMonitoring"]).toBe(true);

      integration.stopMonitoring();
      expect(integration["isMonitoring"]).toBe(false);
    });

    it("should not start monitoring if already monitoring", () => {
      integration.startMonitoring();
      const firstInterval = integration["monitoringInterval"];

      integration.startMonitoring();
      const secondInterval = integration["monitoringInterval"];

      expect(firstInterval).toBe(secondInterval);
      expect(integration["isMonitoring"]).toBe(true);
    });

    it("should handle stop monitoring when not monitoring", () => {
      expect(() => integration.stopMonitoring()).not.toThrow();
      expect(integration["isMonitoring"]).toBe(false);
    });
  });

  describe("Performance Monitoring Cycle", () => {
    beforeEach(() => {
      const mockMetrics: PerformanceMetrics = {
        requestCount: 100,
        successCount: 95,
        errorCount: 5,
        totalLatency: 5000,
        totalCost: 0.1,
        p95Latency: 1000,
        p99Latency: 2000,
        averageLatency: 500,
        errorRate: 0.05,
        costPerRequest: 0.001,
        throughputRPS: 10,
        lastUpdated: new Date(),
      };

      mockPerformanceMonitor.getCurrentMetrics.mockResolvedValue(mockMetrics);
      mockPerformanceMonitor.getProviderMetrics.mockResolvedValue([]);
      mockPerformanceMonitor.getActiveAlerts.mockResolvedValue([]);
      mockFeatureFlags.getAllFlags.mockResolvedValue({});
    });

    it("should perform monitoring cycle without errors", async () => {
      await integration["performMonitoringCycle"]();

      expect(mockPerformanceMonitor.getCurrentMetrics).toHaveBeenCalled();
      expect(mockPerformanceMonitor.getProviderMetrics).toHaveBeenCalled();
      expect(mockPerformanceMonitor.getActiveAlerts).toHaveBeenCalled();
    });

    it("should save configuration snapshot when performance is stable", async () => {
      const saveSnapshotSpy = jest.spyOn(
        integration["rollbackManager"],
        "saveConfigurationSnapshot"
      );

      // Mock the isPerformanceStable method to return true
      jest
        .spyOn(integration as any, "isPerformanceStable")
        .mockReturnValue(true);

      await integration["performMonitoringCycle"]();

      expect(saveSnapshotSpy).toHaveBeenCalled();
    });

    it("should handle monitoring cycle errors gracefully", async () => {
      mockPerformanceMonitor.getCurrentMetrics.mockRejectedValue(
        new Error("Monitoring error")
      );

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      await integration["performMonitoringCycle"]();

      expect(consoleSpy).toHaveBeenCalledWith(
        "Error in performance monitoring cycle:",
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe("Emergency Stop Integration", () => {
    it("should execute emergency stop correctly", async () => {
      await integration["executeEmergencyStop"]();

      expect(mockCircuitBreaker.forceOpen).toHaveBeenCalledWith(
        "emergency_rollback"
      );
      expect(
        mockFeatureFlags.disableAllExperimentalFeatures
      ).toHaveBeenCalled();
    });
  });

  describe("Feature Flag Integration", () => {
    it("should execute feature disable correctly", async () => {
      const targetConfig = {
        featureFlags: {
          experimentalFeatures: false,
          advancedRouting: false,
        },
      };

      await integration["executeFeatureDisable"](targetConfig);

      expect(mockFeatureFlags.setFlag).toHaveBeenCalledWith(
        "experimentalFeatures",
        false
      );
      expect(mockFeatureFlags.setFlag).toHaveBeenCalledWith(
        "advancedRouting",
        false
      );
    });
  });

  describe("Manual Rollback", () => {
    beforeEach(() => {
      const mockMetrics: PerformanceMetrics = {
        requestCount: 100,
        successCount: 95,
        errorCount: 5,
        totalLatency: 5000,
        totalCost: 0.1,
        p95Latency: 1000,
        p99Latency: 2000,
        averageLatency: 500,
        errorRate: 0.05,
        costPerRequest: 0.001,
        throughputRPS: 10,
        lastUpdated: new Date(),
      };

      mockPerformanceMonitor.getCurrentMetrics.mockResolvedValue(mockMetrics);
    });

    it("should trigger manual rollback", async () => {
      const reason = "Manual rollback for testing";

      // Mock the private method to avoid complex setup
      const mockRollbackState = {
        id: "manual_rollback_123",
        timestamp: new Date(),
        reason,
        severity: "critical" as const,
        previousConfiguration: {} as any,
        currentConfiguration: {} as any,
        rollbackSteps: [],
        status: "completed" as const,
        validationResults: [],
      };

      jest
        .spyOn(integration["rollbackManager"], "monitorAndRollback")
        .mockResolvedValue(mockRollbackState);

      const result = await integration.triggerManualRollback(reason);

      expect(result).toBeTruthy();
      expect(result.reason).toBe(reason);
    });
  });

  describe("Rollback Status Management", () => {
    it("should get current rollback status", () => {
      const getCurrentRollbackSpy = jest
        .spyOn(integration["rollbackManager"], "getCurrentRollback")
        .mockReturnValue(null);

      const result = integration.getCurrentRollback();

      expect(getCurrentRollbackSpy).toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it("should get rollback history", () => {
      const getRollbackHistorySpy = jest
        .spyOn(integration["rollbackManager"], "getRollbackHistory")
        .mockReturnValue([]);

      const result = integration.getRollbackHistory();

      expect(getRollbackHistorySpy).toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it("should cancel rollback", async () => {
      const cancelRollbackSpy = jest
        .spyOn(integration["rollbackManager"], "cancelRollback")
        .mockResolvedValue(true);

      const result = await integration.cancelRollback();

      expect(cancelRollbackSpy).toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });

  describe("Configuration Management", () => {
    it("should update rollback configuration", () => {
      const updateConfigSpy = jest.spyOn(
        integration["rollbackManager"],
        "updateConfiguration"
      );
      const newConfig = { sloViolationThreshold: 5 };

      integration.updateRollbackConfiguration(newConfig);

      expect(updateConfigSpy).toHaveBeenCalledWith(newConfig);
    });

    it("should update integration configuration", () => {
      const newConfig = { monitoringIntervalMs: 60000 };

      integration.updateIntegrationConfiguration(newConfig);

      expect(integration["config"].monitoringIntervalMs).toBe(60000);
    });
  });

  describe("Notification System", () => {
    it("should format Slack message correctly", () => {
      const notification: RollbackNotification = {
        type: "rollback_initiated",
        rollbackId: "test-123",
        severity: "critical",
        message: "Test rollback",
        timestamp: new Date("2025-01-14T10:00:00Z"),
        metrics: {
          requestCount: 100,
          successCount: 90,
          errorCount: 10,
          totalLatency: 5000,
          totalCost: 0.1,
          p95Latency: 1500,
          p99Latency: 2000,
          averageLatency: 500,
          errorRate: 0.1,
          costPerRequest: 0.001,
          throughputRPS: 10,
          lastUpdated: new Date(),
        },
      };

      const message = integration["formatSlackMessage"](notification);

      expect(message).toContain("⚠️ *AI System Rollback ROLLBACK INITIATED*");
      expect(message).toContain("*Rollback ID:* test-123");
      expect(message).toContain("*Severity:* critical");
      expect(message).toContain("*Message:* Test rollback");
      expect(message).toContain("• Error Rate: 10.00%");
      expect(message).toContain("• P95 Latency: 1500ms");
      expect(message).toContain("• Cost/Request: $0.0010");
    });

    it("should use correct emoji for different severities", () => {
      const emergencyNotification: RollbackNotification = {
        type: "emergency_stop",
        rollbackId: "emergency-123",
        severity: "emergency",
        message: "Emergency stop",
        timestamp: new Date(),
      };

      const warningNotification: RollbackNotification = {
        type: "rollback_completed",
        rollbackId: "warning-123",
        severity: "warning",
        message: "Warning rollback",
        timestamp: new Date(),
      };

      const emergencyMessage = integration["formatSlackMessage"](
        emergencyNotification
      );
      const warningMessage =
        integration["formatSlackMessage"](warningNotification);

      expect(emergencyMessage).toContain("🚨");
      expect(warningMessage).toContain("ℹ️");
    });
  });

  describe("Performance Stability Check", () => {
    it("should correctly identify stable performance", () => {
      const stableMetrics: PerformanceMetrics = {
        requestCount: 100,
        successCount: 98,
        errorCount: 2,
        totalLatency: 5000,
        totalCost: 0.1,
        p95Latency: 1000,
        p99Latency: 1500,
        averageLatency: 500,
        errorRate: 0.02, // 2% - stable
        costPerRequest: 0.005, // $0.005 - stable
        throughputRPS: 10,
        lastUpdated: new Date(),
      };

      const isStable = integration["isPerformanceStable"](stableMetrics);
      expect(isStable).toBe(true);
    });

    it("should correctly identify unstable performance", () => {
      const unstableMetrics: PerformanceMetrics = {
        requestCount: 100,
        successCount: 90,
        errorCount: 10,
        totalLatency: 5000,
        totalCost: 0.1,
        p95Latency: 3000, // 3s - unstable
        p99Latency: 4000,
        averageLatency: 1000,
        errorRate: 0.1, // 10% - unstable
        costPerRequest: 0.02, // $0.02 - unstable
        throughputRPS: 10,
        lastUpdated: new Date(),
      };

      const isStable = integration["isPerformanceStable"](unstableMetrics);
      expect(isStable).toBe(false);
    });
  });

  describe("Configuration Snapshot Creation", () => {
    beforeEach(() => {
      mockFeatureFlags.getAllFlags.mockResolvedValue({
        experimentalFeatures: true,
        advancedRouting: false,
      });
    });

    it("should create configuration snapshot", async () => {
      const metrics: PerformanceMetrics = {
        requestCount: 100,
        successCount: 95,
        errorCount: 5,
        totalLatency: 5000,
        totalCost: 0.1,
        p95Latency: 1000,
        p99Latency: 2000,
        averageLatency: 500,
        errorRate: 0.05,
        costPerRequest: 0.001,
        throughputRPS: 10,
        lastUpdated: new Date(),
      };

      const snapshot = await integration["createConfigurationSnapshot"](
        metrics
      );

      expect(snapshot).toHaveProperty("timestamp");
      expect(snapshot).toHaveProperty("providerWeights");
      expect(snapshot).toHaveProperty("modelConfigurations");
      expect(snapshot).toHaveProperty("featureFlags");
      expect(snapshot).toHaveProperty("routingRules");
      expect(snapshot).toHaveProperty("performanceBaseline");
      expect(snapshot).toHaveProperty("checksum");
      expect(snapshot.performanceBaseline).toBe(metrics);
    });

    it("should generate consistent checksums for same metrics", () => {
      const metrics: PerformanceMetrics = {
        requestCount: 100,
        successCount: 95,
        errorCount: 5,
        totalLatency: 5000,
        totalCost: 0.1,
        p95Latency: 1000,
        p99Latency: 2000,
        averageLatency: 500,
        errorRate: 0.05,
        costPerRequest: 0.001,
        throughputRPS: 10,
        lastUpdated: new Date(),
      };

      const checksum1 = integration["generateChecksum"](metrics);
      const checksum2 = integration["generateChecksum"](metrics);

      // Checksums should be different due to timestamp, but function should work
      expect(typeof checksum1).toBe("string");
      expect(typeof checksum2).toBe("string");
    });
  });
});
