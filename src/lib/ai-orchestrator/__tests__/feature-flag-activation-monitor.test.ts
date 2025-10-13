/**
 * Feature Flag Activation Monitor Tests
 */

import { FeatureFlagActivationMonitor } from "../feature-flag-activation-monitor";

describe("FeatureFlagActivationMonitor", () => {
  let monitor: FeatureFlagActivationMonitor;

  beforeEach(() => {
    monitor = new FeatureFlagActivationMonitor({
      successRateThreshold: 99.0,
      warningThreshold: 95.0,
      maxOperationDuration: 5000,
      alertingEnabled: true,
      metricsRetentionDays: 30,
      batchSize: 100,
    });
  });

  describe("Configuration", () => {
    it("should initialize with default configuration", () => {
      const defaultMonitor = new FeatureFlagActivationMonitor();
      const config = defaultMonitor.getConfig();

      expect(config.successRateThreshold).toBe(99.0);
      expect(config.warningThreshold).toBe(95.0);
      expect(config.maxOperationDuration).toBe(5000);
      expect(config.alertingEnabled).toBe(true);
      expect(config.metricsRetentionDays).toBe(30);
      expect(config.batchSize).toBe(100);
    });

    it("should allow configuration override", () => {
      const customMonitor = new FeatureFlagActivationMonitor({
        successRateThreshold: 95.0,
        warningThreshold: 90.0,
        alertingEnabled: false,
      });
      const config = customMonitor.getConfig();

      expect(config.successRateThreshold).toBe(95.0);
      expect(config.warningThreshold).toBe(90.0);
      expect(config.alertingEnabled).toBe(false);
      // Other values should remain default
      expect(config.maxOperationDuration).toBe(5000);
    });

    it("should allow configuration updates", () => {
      monitor.updateConfig({
        successRateThreshold: 98.0,
        alertingEnabled: false,
      });

      const config = monitor.getConfig();
      expect(config.successRateThreshold).toBe(98.0);
      expect(config.alertingEnabled).toBe(false);
      // Other values should remain unchanged
      expect(config.warningThreshold).toBe(95.0);
    });
  });

  describe("Operation Recording", () => {
    it("should record successful activation", async () => {
      await monitor.recordSuccessfulActivation(
        "test-flag",
        100,
        "development",
        "corr-123"
      );

      const metrics = await monitor.getActivationMetrics("1h");
      expect(metrics.totalOperations).toBe(1);
      expect(metrics.successfulOperations).toBe(1);
      expect(metrics.failedOperations).toBe(0);
      expect(metrics.successRate).toBe(100);
    });

    it("should record failed activation", async () => {
      await monitor.recordFailedActivation(
        "test-flag",
        200,
        "Connection timeout",
        "development",
        "corr-456"
      );

      const metrics = await monitor.getActivationMetrics("1h");
      expect(metrics.totalOperations).toBe(1);
      expect(metrics.successfulOperations).toBe(0);
      expect(metrics.failedOperations).toBe(1);
      expect(metrics.successRate).toBe(0);
      expect(metrics.lastFailure).toBeDefined();
      expect(metrics.lastFailure?.error).toBe("Connection timeout");
    });

    it("should record successful deactivation", async () => {
      await monitor.recordSuccessfulDeactivation(
        "test-flag",
        150,
        "production"
      );

      const metrics = await monitor.getActivationMetrics("1h");
      expect(metrics.totalOperations).toBe(1);
      expect(metrics.successfulOperations).toBe(1);
      expect(metrics.successRate).toBe(100);
    });

    it("should record failed deactivation", async () => {
      await monitor.recordFailedDeactivation(
        "test-flag",
        300,
        "Database error",
        "staging"
      );

      const metrics = await monitor.getActivationMetrics("1h");
      expect(metrics.totalOperations).toBe(1);
      expect(metrics.failedOperations).toBe(1);
      expect(metrics.successRate).toBe(0);
    });

    it("should record generic operations", async () => {
      await monitor.recordOperation({
        flagName: "test-flag",
        operation: "validate",
        success: true,
        duration: 50,
        environment: "test",
        correlationId: "test-123",
      });

      const metrics = await monitor.getActivationMetrics("1h");
      expect(metrics.totalOperations).toBe(1);
      expect(metrics.successfulOperations).toBe(1);
    });
  });

  describe("Metrics Calculation", () => {
    beforeEach(async () => {
      // Add test data
      await monitor.recordSuccessfulActivation("flag-1", 100, "development");
      await monitor.recordSuccessfulActivation("flag-1", 150, "development");
      await monitor.recordFailedActivation(
        "flag-1",
        200,
        "Error",
        "development"
      );
      await monitor.recordSuccessfulDeactivation("flag-2", 120, "development");
      await monitor.recordSuccessfulActivation("flag-2", 80, "development");
    });

    it("should calculate overall metrics correctly", async () => {
      const metrics = await monitor.getActivationMetrics("1h");

      expect(metrics.totalOperations).toBe(5);
      expect(metrics.successfulOperations).toBe(4);
      expect(metrics.failedOperations).toBe(1);
      expect(metrics.successRate).toBe(80); // 4/5 * 100
      expect(metrics.averageDuration).toBe(130); // (100+150+200+120+80)/5
    });

    it("should calculate metrics by flag name", async () => {
      const flag1Metrics = await monitor.getActivationMetricsByFlag(
        "flag-1",
        "1h"
      );
      const flag2Metrics = await monitor.getActivationMetricsByFlag(
        "flag-2",
        "1h"
      );

      expect(flag1Metrics.totalOperations).toBe(3);
      expect(flag1Metrics.successfulOperations).toBe(2);
      expect(flag1Metrics.successRate).toBe(66.67); // 2/3 * 100 (rounded)

      expect(flag2Metrics.totalOperations).toBe(2);
      expect(flag2Metrics.successfulOperations).toBe(2);
      expect(flag2Metrics.successRate).toBe(100);
    });

    it("should calculate metrics by environment", async () => {
      const devMetrics = await monitor.getActivationMetricsByEnvironment(
        "development",
        "1h"
      );

      expect(devMetrics.totalOperations).toBe(5);
      expect(devMetrics.successfulOperations).toBe(4);
      expect(devMetrics.successRate).toBe(80);
    });

    it("should calculate percentiles correctly", async () => {
      // Add more data for better percentile calculation
      for (let i = 0; i < 100; i++) {
        await monitor.recordSuccessfulActivation("perf-test", i * 10, "test");
      }

      const metrics = await monitor.getActivationMetrics("1h");
      expect(metrics.p95Duration).toBeGreaterThan(0);
      expect(metrics.p99Duration).toBeGreaterThan(0);
      expect(metrics.p99Duration).toBeGreaterThanOrEqual(metrics.p95Duration);
    });

    it("should handle empty metrics gracefully", async () => {
      const emptyMonitor = new FeatureFlagActivationMonitor();
      const metrics = await emptyMonitor.getActivationMetrics("1h");

      expect(metrics.totalOperations).toBe(0);
      expect(metrics.successfulOperations).toBe(0);
      expect(metrics.failedOperations).toBe(0);
      expect(metrics.successRate).toBe(100); // Default to 100% when no data
      expect(metrics.averageDuration).toBe(0);
      expect(metrics.p95Duration).toBe(0);
      expect(metrics.p99Duration).toBe(0);
      expect(metrics.lastFailure).toBeUndefined();
    });
  });

  describe("Success Rate Validation", () => {
    it("should return true when success rate meets threshold", async () => {
      // Add 100 successful operations
      for (let i = 0; i < 100; i++) {
        await monitor.recordSuccessfulActivation("test-flag", 100, "test");
      }

      const isAcceptable = await monitor.isSuccessRateAcceptable("1h");
      const successRate = await monitor.getCurrentSuccessRate("1h");

      expect(isAcceptable).toBe(true);
      expect(successRate).toBe(100);
    });

    it("should return false when success rate is below threshold", async () => {
      // Add 95 successful and 5 failed operations (95% success rate)
      for (let i = 0; i < 95; i++) {
        await monitor.recordSuccessfulActivation("test-flag", 100, "test");
      }
      for (let i = 0; i < 5; i++) {
        await monitor.recordFailedActivation("test-flag", 100, "Error", "test");
      }

      const isAcceptable = await monitor.isSuccessRateAcceptable("1h");
      const successRate = await monitor.getCurrentSuccessRate("1h");

      expect(isAcceptable).toBe(false);
      expect(successRate).toBe(95);
    });

    it("should handle edge case with no operations", async () => {
      const isAcceptable = await monitor.isSuccessRateAcceptable("1h");
      const successRate = await monitor.getCurrentSuccessRate("1h");

      expect(isAcceptable).toBe(true); // Default to acceptable when no data
      expect(successRate).toBe(100);
    });
  });

  describe("Alerting System", () => {
    beforeEach(() => {
      monitor.clearAlerts();
    });

    it("should generate critical alert when success rate drops below threshold", async () => {
      // Add operations to trigger critical alert (90% success rate)
      for (let i = 0; i < 9; i++) {
        await monitor.recordSuccessfulActivation("test-flag", 100, "test");
      }
      await monitor.recordFailedActivation(
        "test-flag",
        100,
        "Critical error",
        "test"
      );

      const alerts = monitor.getActiveAlerts();
      const criticalAlerts = monitor.getAlertsBySeverity("critical");

      expect(alerts.length).toBeGreaterThan(0);
      expect(criticalAlerts.length).toBeGreaterThan(0);
      expect(criticalAlerts[0].severity).toBe("critical");
      expect(criticalAlerts[0].currentSuccessRate).toBe(90);
      expect(criticalAlerts[0].recommendedActions).toContain(
        "Check system health and resource availability"
      );
    });

    it("should generate warning alert when success rate is between warning and critical thresholds", async () => {
      // Update config to have different thresholds for testing
      monitor.updateConfig({
        successRateThreshold: 99.0,
        warningThreshold: 95.0,
      });

      // Add operations to trigger warning alert (96% success rate)
      for (let i = 0; i < 24; i++) {
        await monitor.recordSuccessfulActivation("test-flag", 100, "test");
      }
      await monitor.recordFailedActivation(
        "test-flag",
        100,
        "Warning error",
        "test"
      );

      const alerts = monitor.getActiveAlerts();
      const warningAlerts = monitor.getAlertsBySeverity("warning");

      expect(alerts.length).toBeGreaterThan(0);
      expect(warningAlerts.length).toBeGreaterThan(0);
      expect(warningAlerts[0].severity).toBe("warning");
      expect(warningAlerts[0].currentSuccessRate).toBe(96);
      expect(warningAlerts[0].recommendedActions).toContain(
        "Monitor system closely for degradation"
      );
    });

    it("should not generate alerts when success rate is acceptable", async () => {
      // Add 100% successful operations
      for (let i = 0; i < 10; i++) {
        await monitor.recordSuccessfulActivation("test-flag", 100, "test");
      }

      const alerts = monitor.getActiveAlerts();
      expect(alerts.length).toBe(0);
    });

    it("should not generate alerts when alerting is disabled", async () => {
      monitor.updateConfig({ alertingEnabled: false });

      // Add operations that would normally trigger an alert
      for (let i = 0; i < 5; i++) {
        await monitor.recordSuccessfulActivation("test-flag", 100, "test");
      }
      for (let i = 0; i < 5; i++) {
        await monitor.recordFailedActivation("test-flag", 100, "Error", "test");
      }

      const alerts = monitor.getActiveAlerts();
      expect(alerts.length).toBe(0);
    });

    it("should not generate alerts with insufficient data", async () => {
      // Add only 3 operations (below minimum threshold of 5)
      await monitor.recordSuccessfulActivation("test-flag", 100, "test");
      await monitor.recordFailedActivation("test-flag", 100, "Error", "test");
      await monitor.recordSuccessfulActivation("test-flag", 100, "test");

      const alerts = monitor.getActiveAlerts();
      expect(alerts.length).toBe(0);
    });
  });

  describe("Time Window Filtering", () => {
    beforeEach(async () => {
      // Mock Date.now to control time
      const baseTime = Date.now();
      let currentTime = baseTime;

      // Add operations at different times
      jest.spyOn(Date, "now").mockImplementation(() => currentTime);

      // Operations 2 hours ago
      currentTime = baseTime - 2 * 60 * 60 * 1000;
      await monitor.recordSuccessfulActivation("old-flag", 100, "test");

      // Operations 30 minutes ago
      currentTime = baseTime - 30 * 60 * 1000;
      await monitor.recordSuccessfulActivation("recent-flag", 100, "test");

      // Operations now
      currentTime = baseTime;
      await monitor.recordSuccessfulActivation("current-flag", 100, "test");
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("should filter operations by 1 hour window", async () => {
      const metrics = await monitor.getActivationMetrics("1h");
      expect(metrics.totalOperations).toBe(2); // recent-flag and current-flag
    });

    it("should filter operations by 3 hour window", async () => {
      const metrics = await monitor.getActivationMetrics("3h");
      expect(metrics.totalOperations).toBe(3); // all operations
    });

    it("should filter operations by 30 minute window", async () => {
      const metrics = await monitor.getActivationMetrics("30m");
      expect(metrics.totalOperations).toBe(1); // only current-flag
    });
  });

  describe("Operation History and Analysis", () => {
    beforeEach(async () => {
      // Add mixed operations for analysis
      await monitor.recordSuccessfulActivation("flag-1", 100, "development");
      await monitor.recordFailedActivation(
        "flag-1",
        500,
        "Timeout error",
        "development"
      );
      await monitor.recordSuccessfulDeactivation("flag-2", 50, "production");
      await monitor.recordFailedDeactivation(
        "flag-2",
        1000,
        "Database error",
        "production"
      );
      await monitor.recordSuccessfulActivation("flag-3", 2000, "staging");
    });

    it("should return operation history", () => {
      const history = monitor.getOperationHistory(10);
      expect(history.length).toBe(5);
      expect(history[0].timestamp.getTime()).toBeGreaterThanOrEqual(
        history[1].timestamp.getTime()
      );
    });

    it("should limit operation history", () => {
      const history = monitor.getOperationHistory(3);
      expect(history.length).toBe(3);
    });

    it("should return failed operations", () => {
      const failedOps = monitor.getFailedOperations("1h");
      expect(failedOps.length).toBe(2);
      expect(failedOps.every((op) => !op.success)).toBe(true);
    });

    it("should return slow operations", () => {
      const slowOps = monitor.getSlowOperations("1h");
      expect(slowOps.length).toBeGreaterThan(0);
      expect(slowOps[0].duration).toBeGreaterThanOrEqual(
        slowOps[slowOps.length - 1]?.duration || 0
      );
    });

    it("should handle empty slow operations", () => {
      const emptyMonitor = new FeatureFlagActivationMonitor();
      const slowOps = emptyMonitor.getSlowOperations("1h");
      expect(slowOps.length).toBe(0);
    });
  });

  describe("Metrics Export", () => {
    beforeEach(async () => {
      // Add test data across different flags and environments
      await monitor.recordSuccessfulActivation("flag-1", 100, "development");
      await monitor.recordFailedActivation(
        "flag-1",
        200,
        "Error",
        "development"
      );
      await monitor.recordSuccessfulActivation("flag-2", 150, "production");
      await monitor.recordSuccessfulDeactivation("flag-2", 120, "staging");
    });

    it("should export comprehensive metrics", async () => {
      const exported = await monitor.exportMetrics("1h");

      expect(exported.overall).toBeDefined();
      expect(exported.overall.totalOperations).toBe(4);

      expect(exported.byFlag).toBeDefined();
      expect(exported.byFlag["flag-1"]).toBeDefined();
      expect(exported.byFlag["flag-2"]).toBeDefined();

      expect(exported.byEnvironment).toBeDefined();
      expect(exported.byEnvironment["development"]).toBeDefined();
      expect(exported.byEnvironment["production"]).toBeDefined();
      expect(exported.byEnvironment["staging"]).toBeDefined();

      expect(exported.alerts).toBeDefined();
      expect(Array.isArray(exported.alerts)).toBe(true);
    });

    it("should handle empty export gracefully", async () => {
      const emptyMonitor = new FeatureFlagActivationMonitor();
      const exported = await emptyMonitor.exportMetrics("1h");

      expect(exported.overall.totalOperations).toBe(0);
      expect(Object.keys(exported.byFlag)).toHaveLength(0);
      expect(Object.keys(exported.byEnvironment)).toHaveLength(0);
      expect(exported.alerts).toHaveLength(0);
    });
  });

  describe("Data Retention and Cleanup", () => {
    it("should clean up old operations based on retention policy", async () => {
      // Mock Date.now to simulate old operations
      const oldTime = Date.now() - 35 * 24 * 60 * 60 * 1000; // 35 days ago
      const currentTime = Date.now();

      jest.spyOn(Date, "now").mockImplementation(() => oldTime);
      await monitor.recordSuccessfulActivation("old-flag", 100, "test");

      jest.spyOn(Date, "now").mockImplementation(() => currentTime);
      await monitor.recordSuccessfulActivation("new-flag", 100, "test");

      // Trigger cleanup by adding another operation
      await monitor.recordSuccessfulActivation("trigger-cleanup", 100, "test");

      const history = monitor.getOperationHistory(100);
      expect(history.length).toBe(2); // old operation should be cleaned up
      expect(history.some((op) => op.flagName === "old-flag")).toBe(false);

      jest.restoreAllMocks();
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle invalid time windows gracefully", async () => {
      await monitor.recordSuccessfulActivation("test-flag", 100, "test");

      const metrics1 = await monitor.getActivationMetrics("invalid");
      const metrics2 = await monitor.getActivationMetrics("24h"); // valid

      expect(metrics1.totalOperations).toBe(metrics2.totalOperations);
    });

    it("should handle concurrent operations safely", async () => {
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          monitor.recordSuccessfulActivation(`flag-${i}`, 100, "test")
        );
      }

      await Promise.all(promises);

      const metrics = await monitor.getActivationMetrics("1h");
      expect(metrics.totalOperations).toBe(10);
      expect(metrics.successRate).toBe(100);
    });

    it("should maintain data integrity with rapid operations", async () => {
      // Rapidly add many operations
      for (let i = 0; i < 1000; i++) {
        await monitor.recordSuccessfulActivation("rapid-flag", i, "test");
      }

      const metrics = await monitor.getActivationMetrics("1h");
      expect(metrics.totalOperations).toBe(1000);
      expect(metrics.successRate).toBe(100);
    });
  });
});
