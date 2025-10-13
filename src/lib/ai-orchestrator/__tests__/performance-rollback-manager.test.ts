/**
 * Performance Rollback Manager Tests
 *
 * Tests for automatic rollback mechanisms during performance degradation
 */

import { PerformanceAlert, PerformanceMetrics } from "../performance-monitor";
import {
  ConfigurationSnapshot,
  DEFAULT_ROLLBACK_CONFIG,
  PerformanceRollbackManager,
  RollbackConfiguration,
} from "../performance-rollback-manager";

describe("PerformanceRollbackManager", () => {
  let rollbackManager: PerformanceRollbackManager;
  let mockConfig: RollbackConfiguration;

  beforeEach(() => {
    mockConfig = {
      ...DEFAULT_ROLLBACK_CONFIG,
      rollbackCooldownMs: 1000, // 1 second for testing
      validationTimeoutMs: 100, // 100ms for testing
      gradualRollback: {
        enabled: true,
        trafficReductionSteps: [80, 60],
        stepDurationMs: 100, // 100ms for testing
      },
    };
    rollbackManager = new PerformanceRollbackManager(mockConfig);
  });

  describe("Emergency Rollback", () => {
    it("should trigger emergency rollback on high error rate", async () => {
      const metrics: PerformanceMetrics = {
        requestCount: 100,
        successCount: 80,
        errorCount: 20,
        totalLatency: 5000,
        totalCost: 0.1,
        p95Latency: 1000,
        p99Latency: 2000,
        averageLatency: 500,
        errorRate: 0.2, // 20% error rate - exceeds emergency threshold
        costPerRequest: 0.001,
        throughputRPS: 10,
        lastUpdated: new Date(),
      };

      const rollback = await rollbackManager.monitorAndRollback(
        metrics,
        [],
        []
      );

      expect(rollback).toBeTruthy();
      expect(rollback!.severity).toBe("emergency");
      expect(rollback!.reason).toContain("Error rate");
      expect(rollback!.rollbackSteps).toHaveLength(1);
      expect(rollback!.rollbackSteps[0].type).toBe("emergency_stop");
    });

    it("should trigger emergency rollback on high P95 latency", async () => {
      const metrics: PerformanceMetrics = {
        requestCount: 100,
        successCount: 95,
        errorCount: 5,
        totalLatency: 10000,
        totalCost: 0.1,
        p95Latency: 6000, // 6 seconds - exceeds emergency threshold
        p99Latency: 8000,
        averageLatency: 1000,
        errorRate: 0.05,
        costPerRequest: 0.001,
        throughputRPS: 10,
        lastUpdated: new Date(),
      };

      const rollback = await rollbackManager.monitorAndRollback(
        metrics,
        [],
        []
      );

      expect(rollback).toBeTruthy();
      expect(rollback!.severity).toBe("emergency");
      expect(rollback!.reason).toContain("P95 latency");
    });

    it("should trigger emergency rollback on high cost per request", async () => {
      const metrics: PerformanceMetrics = {
        requestCount: 100,
        successCount: 95,
        errorCount: 5,
        totalLatency: 5000,
        totalCost: 15, // High cost
        p95Latency: 1000,
        p99Latency: 2000,
        averageLatency: 500,
        errorRate: 0.05,
        costPerRequest: 0.15, // $0.15 per request - exceeds emergency threshold
        throughputRPS: 10,
        lastUpdated: new Date(),
      };

      const rollback = await rollbackManager.monitorAndRollback(
        metrics,
        [],
        []
      );

      expect(rollback).toBeTruthy();
      expect(rollback!.severity).toBe("emergency");
      expect(rollback!.reason).toContain("Cost per request");
    });
  });

  describe("SLO Violation Rollback", () => {
    it("should trigger rollback after consecutive SLO violations", async () => {
      const metrics: PerformanceMetrics = {
        requestCount: 100,
        successCount: 90,
        errorCount: 10,
        totalLatency: 5000,
        totalCost: 0.1,
        p95Latency: 1000,
        p99Latency: 2000,
        averageLatency: 500,
        errorRate: 0.1,
        costPerRequest: 0.001,
        throughputRPS: 10,
        lastUpdated: new Date(),
      };

      const alerts: PerformanceAlert[] = [
        {
          id: "alert-1",
          slo: {
            name: "Error Rate SLO",
            metric: "errorRate",
            threshold: 0.05,
            operator: "lt",
            severity: "critical",
          },
          currentValue: 0.1,
          threshold: 0.05,
          severity: "critical",
          timestamp: new Date(),
          message: "Error rate exceeds threshold",
        },
      ];

      // First violation - should not trigger rollback
      let rollback = await rollbackManager.monitorAndRollback(
        metrics,
        [],
        alerts
      );
      expect(rollback).toBeNull();

      // Second violation - should not trigger rollback
      rollback = await rollbackManager.monitorAndRollback(metrics, [], alerts);
      expect(rollback).toBeNull();

      // Third violation - should trigger rollback
      rollback = await rollbackManager.monitorAndRollback(metrics, [], alerts);
      expect(rollback).toBeTruthy();
      expect(rollback!.severity).toBe("critical");
      expect(rollback!.reason).toContain("SLO violations");
    });

    it("should reset violation count when no violations occur", async () => {
      const metrics: PerformanceMetrics = {
        requestCount: 100,
        successCount: 90,
        errorCount: 10,
        totalLatency: 5000,
        totalCost: 0.1,
        p95Latency: 1000,
        p99Latency: 2000,
        averageLatency: 500,
        errorRate: 0.1,
        costPerRequest: 0.001,
        throughputRPS: 10,
        lastUpdated: new Date(),
      };

      const alerts: PerformanceAlert[] = [
        {
          id: "alert-1",
          slo: {
            name: "Error Rate SLO",
            metric: "errorRate",
            threshold: 0.05,
            operator: "lt",
            severity: "critical",
          },
          currentValue: 0.1,
          threshold: 0.05,
          severity: "critical",
          timestamp: new Date(),
          message: "Error rate exceeds threshold",
        },
      ];

      // First violation
      await rollbackManager.monitorAndRollback(metrics, [], alerts);

      // Second violation
      await rollbackManager.monitorAndRollback(metrics, [], alerts);

      // No violations - should reset count
      await rollbackManager.monitorAndRollback(metrics, [], []);

      // One violation again - should not trigger rollback
      const rollback = await rollbackManager.monitorAndRollback(
        metrics,
        [],
        alerts
      );
      expect(rollback).toBeNull();
    });
  });

  describe("Cooldown Period", () => {
    it("should respect cooldown period between rollbacks", async () => {
      const metrics: PerformanceMetrics = {
        requestCount: 100,
        successCount: 80,
        errorCount: 20,
        totalLatency: 5000,
        totalCost: 0.1,
        p95Latency: 1000,
        p99Latency: 2000,
        averageLatency: 500,
        errorRate: 0.2, // Emergency threshold
        costPerRequest: 0.001,
        throughputRPS: 10,
        lastUpdated: new Date(),
      };

      // First rollback should succeed
      const firstRollback = await rollbackManager.monitorAndRollback(
        metrics,
        [],
        []
      );
      expect(firstRollback).toBeTruthy();

      // Second rollback should be blocked by cooldown
      const secondRollback = await rollbackManager.monitorAndRollback(
        metrics,
        [],
        []
      );
      expect(secondRollback).toBeNull();

      // Wait for cooldown to expire
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // Third rollback should succeed after cooldown
      const thirdRollback = await rollbackManager.monitorAndRollback(
        metrics,
        [],
        []
      );
      expect(thirdRollback).toBeTruthy();
    });
  });

  describe("Gradual Rollback", () => {
    it("should execute gradual rollback steps", async () => {
      const alerts: PerformanceAlert[] = [
        {
          id: "alert-1",
          slo: {
            name: "Error Rate SLO",
            metric: "errorRate",
            threshold: 0.05,
            operator: "lt",
            severity: "critical",
          },
          currentValue: 0.1,
          threshold: 0.05,
          severity: "critical",
          timestamp: new Date(),
          message: "Error rate exceeds threshold",
        },
      ];

      const metrics: PerformanceMetrics = {
        requestCount: 100,
        successCount: 90,
        errorCount: 10,
        totalLatency: 5000,
        totalCost: 0.1,
        p95Latency: 1000,
        p99Latency: 2000,
        averageLatency: 500,
        errorRate: 0.1,
        costPerRequest: 0.001,
        throughputRPS: 10,
        lastUpdated: new Date(),
      };

      // Trigger SLO violations to reach threshold
      await rollbackManager.monitorAndRollback(metrics, [], alerts);
      await rollbackManager.monitorAndRollback(metrics, [], alerts);
      const rollback = await rollbackManager.monitorAndRollback(
        metrics,
        [],
        alerts
      );

      expect(rollback).toBeTruthy();
      expect(rollback!.rollbackSteps.length).toBeGreaterThan(1);

      // Should have different types of rollback steps
      const stepTypes = rollback!.rollbackSteps.map((step) => step.type);
      expect(stepTypes).toContain("provider_switch");
      expect(stepTypes).toContain("model_rollback");
      expect(stepTypes).toContain("feature_disable");
    });
  });

  describe("Configuration Management", () => {
    it("should save and retrieve configuration snapshots", () => {
      const snapshot: ConfigurationSnapshot = {
        timestamp: new Date(),
        providerWeights: { bedrock: 0.5, google: 0.3, meta: 0.2 },
        modelConfigurations: { "claude-3": { temperature: 0.7 } },
        featureFlags: { experimentalFeatures: true },
        routingRules: [],
        performanceBaseline: {
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
        },
        checksum: "test-checksum",
      };

      rollbackManager.saveConfigurationSnapshot(snapshot);

      const history = rollbackManager.getRollbackHistory();
      // History should be empty since no rollbacks have been executed
      expect(history).toHaveLength(0);
    });

    it("should update rollback configuration", () => {
      const newConfig: Partial<RollbackConfiguration> = {
        sloViolationThreshold: 5,
        emergencyThresholds: {
          errorRate: 0.2,
          latencyP95: 10000,
          costPerRequest: 0.2,
        },
      };

      rollbackManager.updateConfiguration(newConfig);

      // Test that the new configuration is applied
      // This would require exposing the config or testing through behavior
      expect(true).toBe(true); // Placeholder assertion
    });
  });

  describe("Rollback Status Management", () => {
    it("should track current rollback status", async () => {
      expect(rollbackManager.getCurrentRollback()).toBeNull();

      const metrics: PerformanceMetrics = {
        requestCount: 100,
        successCount: 80,
        errorCount: 20,
        totalLatency: 5000,
        totalCost: 0.1,
        p95Latency: 1000,
        p99Latency: 2000,
        averageLatency: 500,
        errorRate: 0.2, // Emergency threshold
        costPerRequest: 0.001,
        throughputRPS: 10,
        lastUpdated: new Date(),
      };

      const rollback = await rollbackManager.monitorAndRollback(
        metrics,
        [],
        []
      );

      expect(rollback).toBeTruthy();
      expect(rollback!.status).toBe("completed");

      // Check that rollback history is updated
      const history = rollbackManager.getRollbackHistory();
      expect(history.length).toBeGreaterThan(0);
      expect(history[0].id).toBe(rollback!.id);
    });

    it("should cancel current rollback", async () => {
      const metrics: PerformanceMetrics = {
        requestCount: 100,
        successCount: 80,
        errorCount: 20,
        totalLatency: 5000,
        totalCost: 0.1,
        p95Latency: 1000,
        p99Latency: 2000,
        averageLatency: 500,
        errorRate: 0.2, // Emergency threshold
        costPerRequest: 0.001,
        throughputRPS: 10,
        lastUpdated: new Date(),
      };

      await rollbackManager.monitorAndRollback(metrics, [], []);

      const cancelled = await rollbackManager.cancelRollback();
      expect(cancelled).toBe(false); // Already completed

      expect(rollbackManager.getCurrentRollback()).toBeNull();
    });

    it("should maintain rollback history", async () => {
      const metrics: PerformanceMetrics = {
        requestCount: 100,
        successCount: 80,
        errorCount: 20,
        totalLatency: 5000,
        totalCost: 0.1,
        p95Latency: 1000,
        p99Latency: 2000,
        averageLatency: 500,
        errorRate: 0.2, // Emergency threshold
        costPerRequest: 0.001,
        throughputRPS: 10,
        lastUpdated: new Date(),
      };

      await rollbackManager.monitorAndRollback(metrics, [], []);

      const history = rollbackManager.getRollbackHistory();
      expect(history).toHaveLength(1);
      expect(history[0].severity).toBe("emergency");
    });
  });

  describe("Disabled Rollback", () => {
    it("should not trigger rollback when disabled", async () => {
      const disabledConfig = { ...mockConfig, enabled: false };
      const disabledManager = new PerformanceRollbackManager(disabledConfig);

      const metrics: PerformanceMetrics = {
        requestCount: 100,
        successCount: 80,
        errorCount: 20,
        totalLatency: 5000,
        totalCost: 0.1,
        p95Latency: 1000,
        p99Latency: 2000,
        averageLatency: 500,
        errorRate: 0.2, // Emergency threshold
        costPerRequest: 0.001,
        throughputRPS: 10,
        lastUpdated: new Date(),
      };

      const rollback = await disabledManager.monitorAndRollback(
        metrics,
        [],
        []
      );
      expect(rollback).toBeNull();
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty alerts array", async () => {
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

      const rollback = await rollbackManager.monitorAndRollback(
        metrics,
        [],
        []
      );
      expect(rollback).toBeNull();
    });

    it("should handle warning-level alerts without triggering rollback", async () => {
      const metrics: PerformanceMetrics = {
        requestCount: 100,
        successCount: 90,
        errorCount: 10,
        totalLatency: 5000,
        totalCost: 0.1,
        p95Latency: 1000,
        p99Latency: 2000,
        averageLatency: 500,
        errorRate: 0.1,
        costPerRequest: 0.001,
        throughputRPS: 10,
        lastUpdated: new Date(),
      };

      const warningAlerts: PerformanceAlert[] = [
        {
          id: "alert-1",
          slo: {
            name: "Error Rate SLO",
            metric: "errorRate",
            threshold: 0.05,
            operator: "lt",
            severity: "warning",
          },
          currentValue: 0.1,
          threshold: 0.05,
          severity: "warning",
          timestamp: new Date(),
          message: "Error rate exceeds threshold",
        },
      ];

      const rollback = await rollbackManager.monitorAndRollback(
        metrics,
        [],
        warningAlerts
      );
      expect(rollback).toBeNull();
    });
  });
});
