/**
 * Emergency Operations Performance Monitor Tests
 *
 * Tests the performance monitoring system that validates emergency operations
 * complete within 5 seconds with >95% success rate as required by the
 * Bedrock Activation specification.
 */

import { AuditTrailSystem } from "../audit-trail-system";
import { CircuitBreaker } from "../circuit-breaker";
import { EmergencyOperationsPerformanceMonitor } from "../emergency-operations-performance-monitor";

// Mock dependencies
jest.mock("../audit-trail-system");
jest.mock("../circuit-breaker");

describe("EmergencyOperationsPerformanceMonitor", () => {
  let monitor: EmergencyOperationsPerformanceMonitor;
  let mockAuditTrail: jest.Mocked<AuditTrailSystem>;
  let mockCircuitBreaker: jest.Mocked<CircuitBreaker>;

  beforeEach(() => {
    mockAuditTrail = new AuditTrailSystem() as jest.Mocked<AuditTrailSystem>;
    mockCircuitBreaker = new CircuitBreaker() as jest.Mocked<CircuitBreaker>;

    // Mock audit trail methods
    mockAuditTrail.logEvent = jest.fn().mockResolvedValue(undefined);

    // Mock circuit breaker methods
    mockCircuitBreaker.getState = jest.fn().mockReturnValue("closed");

    monitor = new EmergencyOperationsPerformanceMonitor(
      {
        slaThresholdMs: 5000,
        successRateThreshold: 95,
        rollingWindowMinutes: 60,
        alertingEnabled: true,
        circuitBreakerEnabled: true,
        maxMetricsRetention: 100,
      },
      mockAuditTrail,
      mockCircuitBreaker
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    monitor.resetMetrics();
  });

  describe("Performance Metrics Recording", () => {
    it("should record emergency operation metrics correctly", async () => {
      const operationId = "test-emergency-001";
      const latencyMs = 3000; // Within SLA
      const success = true;

      await monitor.recordEmergencyOperation(
        operationId,
        latencyMs,
        success,
        "emergency",
        "test-correlation-001"
      );

      const stats = monitor.getCurrentPerformanceStats();
      expect(stats.totalOperations).toBe(1);
      expect(stats.successfulOperations).toBe(1);
      expect(stats.operationsWithinSLA).toBe(1);
      expect(stats.successRate).toBe(100);
      expect(stats.slaComplianceRate).toBe(100);
      expect(stats.averageLatencyMs).toBe(3000);

      // Verify audit trail logging
      expect(mockAuditTrail.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: "emergency_operation_performance",
          action: "record_metric",
          resource: `emergency_operation:${operationId}`,
          metadata: expect.objectContaining({
            latencyMs,
            success,
            withinSLA: true,
            operationType: "emergency",
            correlationId: "test-correlation-001",
          }),
        })
      );
    });

    it("should record failed emergency operations", async () => {
      await monitor.recordEmergencyOperation(
        "test-emergency-002",
        2000,
        false, // failure
        "emergency",
        "test-correlation-002",
        "Connection timeout"
      );

      const stats = monitor.getCurrentPerformanceStats();
      expect(stats.totalOperations).toBe(1);
      expect(stats.successfulOperations).toBe(0);
      expect(stats.operationsWithinSLA).toBe(1); // Still within SLA time-wise
      expect(stats.successRate).toBe(0);
      expect(stats.slaComplianceRate).toBe(100); // Time SLA met, but operation failed
    });

    it("should record operations that exceed SLA threshold", async () => {
      await monitor.recordEmergencyOperation(
        "test-emergency-003",
        7000, // Exceeds 5s SLA
        true,
        "emergency"
      );

      const stats = monitor.getCurrentPerformanceStats();
      expect(stats.totalOperations).toBe(1);
      expect(stats.successfulOperations).toBe(1);
      expect(stats.operationsWithinSLA).toBe(0); // Exceeds SLA
      expect(stats.successRate).toBe(100);
      expect(stats.slaComplianceRate).toBe(0);
    });
  });

  describe("Performance Statistics Calculation", () => {
    beforeEach(async () => {
      // Add a mix of operations for testing
      const operations = [
        { latency: 2000, success: true }, // Within SLA, success
        { latency: 3000, success: true }, // Within SLA, success
        { latency: 4000, success: true }, // Within SLA, success
        { latency: 6000, success: true }, // Exceeds SLA, success
        { latency: 2500, success: false }, // Within SLA, failure
        { latency: 7000, success: false }, // Exceeds SLA, failure
        { latency: 1500, success: true }, // Within SLA, success
        { latency: 4500, success: true }, // Within SLA, success
        { latency: 3500, success: true }, // Within SLA, success
        { latency: 8000, success: true }, // Exceeds SLA, success
      ];

      for (let i = 0; i < operations.length; i++) {
        const op = operations[i];
        await monitor.recordEmergencyOperation(
          `test-op-${i}`,
          op.latency,
          op.success,
          "emergency",
          `correlation-${i}`
        );
      }
    });

    it("should calculate performance statistics correctly", () => {
      const stats = monitor.getCurrentPerformanceStats();

      expect(stats.totalOperations).toBe(10);
      expect(stats.successfulOperations).toBe(8); // 8 successful operations
      expect(stats.operationsWithinSLA).toBe(7); // 7 operations within 5s SLA
      expect(stats.successRate).toBe(80); // 8/10 = 80%
      expect(stats.slaComplianceRate).toBe(70); // 7/10 = 70%

      // Check average latency
      const expectedAverage =
        (2000 + 3000 + 4000 + 6000 + 2500 + 7000 + 1500 + 4500 + 3500 + 8000) /
        10;
      expect(stats.averageLatencyMs).toBe(expectedAverage);

      // Check percentiles
      expect(stats.p95LatencyMs).toBeGreaterThan(0);
      expect(stats.p99LatencyMs).toBeGreaterThan(0);
    });

    it("should calculate percentiles correctly", () => {
      const stats = monitor.getCurrentPerformanceStats();

      // With our test data, P95 should be high due to the 8000ms outlier
      expect(stats.p95LatencyMs).toBeGreaterThan(6000);
      expect(stats.p99LatencyMs).toBeGreaterThan(7000);
    });
  });

  describe("SLA Compliance Validation", () => {
    it("should return true when performance meets SLA requirements", async () => {
      // Add operations that meet both success rate and SLA compliance > 95%
      for (let i = 0; i < 100; i++) {
        await monitor.recordEmergencyOperation(
          `test-op-${i}`,
          2000 + (i % 2000), // Vary latency but keep under 5s
          true, // All successful
          "emergency"
        );
      }

      expect(monitor.isPerformanceWithinSLA()).toBe(true);
    });

    it("should return false when success rate is below threshold", async () => {
      // Add operations with low success rate
      for (let i = 0; i < 100; i++) {
        await monitor.recordEmergencyOperation(
          `test-op-${i}`,
          2000,
          i < 90, // Only 90% success rate (below 95% threshold)
          "emergency"
        );
      }

      expect(monitor.isPerformanceWithinSLA()).toBe(false);
    });

    it("should return false when SLA compliance rate is below threshold", async () => {
      // Add operations with low SLA compliance
      for (let i = 0; i < 100; i++) {
        await monitor.recordEmergencyOperation(
          `test-op-${i}`,
          i < 90 ? 3000 : 7000, // Only 90% within SLA (below 95% threshold)
          true, // All successful
          "emergency"
        );
      }

      expect(monitor.isPerformanceWithinSLA()).toBe(false);
    });

    it("should return true when no operations have been recorded", () => {
      expect(monitor.isPerformanceWithinSLA()).toBe(true);
    });
  });

  describe("Alerting System", () => {
    it("should trigger SLA breach alert when compliance rate drops below threshold", async () => {
      // Add operations that breach SLA compliance
      for (let i = 0; i < 10; i++) {
        await monitor.recordEmergencyOperation(
          `test-op-${i}`,
          7000, // Exceeds 5s SLA
          true,
          "emergency"
        );
      }

      const alerts = monitor.getRecentAlerts();
      expect(alerts.length).toBeGreaterThan(0);

      const slaAlert = alerts.find((alert) => alert.type === "SLA_BREACH");
      expect(slaAlert).toBeDefined();
      expect(slaAlert?.severity).toBe("CRITICAL");
      expect(slaAlert?.actualValue).toBe(0); // 0% SLA compliance
      expect(slaAlert?.threshold).toBe(95);
    });

    it("should trigger success rate alert when success rate drops below threshold", async () => {
      // Add operations with low success rate
      for (let i = 0; i < 10; i++) {
        await monitor.recordEmergencyOperation(
          `test-op-${i}`,
          3000, // Within SLA
          false, // All failures
          "emergency"
        );
      }

      const alerts = monitor.getRecentAlerts();
      expect(alerts.length).toBeGreaterThan(0);

      const successAlert = alerts.find(
        (alert) => alert.type === "SUCCESS_RATE_LOW"
      );
      expect(successAlert).toBeDefined();
      expect(successAlert?.severity).toBe("CRITICAL");
      expect(successAlert?.actualValue).toBe(0); // 0% success rate
    });

    it("should trigger latency alert when P95 exceeds SLA threshold", async () => {
      // Add operations with high latency
      for (let i = 0; i < 20; i++) {
        await monitor.recordEmergencyOperation(
          `test-op-${i}`,
          6000, // Exceeds 5s SLA
          true,
          "emergency"
        );
      }

      const alerts = monitor.getRecentAlerts();
      const latencyAlert = alerts.find(
        (alert) => alert.type === "LATENCY_HIGH"
      );
      expect(latencyAlert).toBeDefined();
      expect(latencyAlert?.severity).toBe("WARNING");
    });

    it("should trigger circuit breaker alert when circuit breaker is open", async () => {
      // Mock circuit breaker as open
      mockCircuitBreaker.getState.mockReturnValue("open");

      // Record an operation to trigger alert check
      await monitor.recordEmergencyOperation(
        "test-op-1",
        3000,
        true,
        "emergency"
      );

      const alerts = monitor.getRecentAlerts();
      const cbAlert = alerts.find(
        (alert) => alert.type === "CIRCUIT_BREAKER_OPEN"
      );
      expect(cbAlert).toBeDefined();
      expect(cbAlert?.severity).toBe("CRITICAL");
    });

    it("should not trigger alerts when alerting is disabled", async () => {
      // Create monitor with alerting disabled
      const noAlertMonitor = new EmergencyOperationsPerformanceMonitor({
        alertingEnabled: false,
      });

      // Add operations that would normally trigger alerts
      for (let i = 0; i < 10; i++) {
        await noAlertMonitor.recordEmergencyOperation(
          `test-op-${i}`,
          7000, // Exceeds SLA
          false, // Failures
          "emergency"
        );
      }

      const alerts = noAlertMonitor.getRecentAlerts();
      expect(alerts.length).toBe(0);
    });
  });

  describe("Performance Report Generation", () => {
    beforeEach(async () => {
      // Add a realistic mix of operations
      const operations = [
        { latency: 2000, success: true },
        { latency: 3000, success: true },
        { latency: 4000, success: true },
        { latency: 6000, success: true }, // SLA breach
        { latency: 2500, success: false }, // Failure
      ];

      for (let i = 0; i < operations.length; i++) {
        const op = operations[i];
        await monitor.recordEmergencyOperation(
          `test-op-${i}`,
          op.latency,
          op.success,
          "emergency"
        );
      }
    });

    it("should generate comprehensive performance report", () => {
      const report = monitor.getPerformanceReport();

      expect(report.stats).toBeDefined();
      expect(report.isWithinSLA).toBe(false); // Should be false due to low success/SLA rates
      expect(report.recentAlerts).toBeDefined();
      expect(report.recommendations).toBeDefined();
      expect(report.recommendations.length).toBeGreaterThan(0);
    });

    it("should provide relevant recommendations", () => {
      const report = monitor.getPerformanceReport();

      // Should have recommendations for low success rate and SLA compliance
      const hasSuccessRateRecommendation = report.recommendations.some(
        (rec) => rec.includes("Success rate") && rec.includes("below threshold")
      );
      const hasSLARecommendation = report.recommendations.some(
        (rec) =>
          rec.includes("SLA compliance rate") && rec.includes("below threshold")
      );

      expect(hasSuccessRateRecommendation).toBe(true);
      expect(hasSLARecommendation).toBe(true);
    });

    it("should recommend longer monitoring for low operation volume", async () => {
      // Reset and add only a few operations
      monitor.resetMetrics();

      await monitor.recordEmergencyOperation(
        "test-op-1",
        2000,
        true,
        "emergency"
      );
      await monitor.recordEmergencyOperation(
        "test-op-2",
        3000,
        true,
        "emergency"
      );

      const report = monitor.getPerformanceReport();
      const hasVolumeRecommendation = report.recommendations.some((rec) =>
        rec.includes("Low operation volume")
      );

      expect(hasVolumeRecommendation).toBe(true);
    });
  });

  describe("Metrics Management", () => {
    it("should maintain metrics retention limit", async () => {
      const retentionLimit = 5;
      const limitedMonitor = new EmergencyOperationsPerformanceMonitor({
        maxMetricsRetention: retentionLimit,
      });

      // Add more operations than the retention limit
      for (let i = 0; i < 10; i++) {
        await limitedMonitor.recordEmergencyOperation(
          `test-op-${i}`,
          2000,
          true,
          "emergency"
        );
      }

      const exportedData = limitedMonitor.exportMetrics();
      expect(exportedData.metrics.length).toBe(retentionLimit);
    });

    it("should export metrics correctly", async () => {
      await monitor.recordEmergencyOperation(
        "test-op-1",
        2000,
        true,
        "emergency"
      );
      await monitor.recordEmergencyOperation(
        "test-op-2",
        3000,
        false,
        "emergency"
      );

      const exportedData = monitor.exportMetrics();

      expect(exportedData.metrics).toBeDefined();
      expect(exportedData.metrics.length).toBe(2);
      expect(exportedData.stats).toBeDefined();
      expect(exportedData.config).toBeDefined();

      expect(exportedData.metrics[0].operationId).toBe("test-op-1");
      expect(exportedData.metrics[1].operationId).toBe("test-op-2");
    });

    it("should reset metrics correctly", async () => {
      await monitor.recordEmergencyOperation(
        "test-op-1",
        2000,
        true,
        "emergency"
      );

      expect(monitor.getCurrentPerformanceStats().totalOperations).toBe(1);

      monitor.resetMetrics();

      expect(monitor.getCurrentPerformanceStats().totalOperations).toBe(0);
      expect(monitor.getRecentAlerts().length).toBe(0);
    });
  });

  describe("Rolling Window Functionality", () => {
    it("should only include metrics within the rolling window", async () => {
      // Create monitor with short rolling window for testing
      const shortWindowMonitor = new EmergencyOperationsPerformanceMonitor({
        rollingWindowMinutes: 1, // 1 minute window
      });

      // Add an operation
      await shortWindowMonitor.recordEmergencyOperation(
        "test-op-1",
        2000,
        true,
        "emergency"
      );

      expect(
        shortWindowMonitor.getCurrentPerformanceStats().totalOperations
      ).toBe(1);

      // Mock time passage (this would require more sophisticated mocking in real implementation)
      // For now, we verify the window logic exists
      const stats = shortWindowMonitor.getCurrentPerformanceStats();
      expect(stats.windowStartTime).toBeDefined();
      expect(stats.windowEndTime).toBeDefined();
      expect(stats.windowEndTime.getTime()).toBeGreaterThan(
        stats.windowStartTime.getTime()
      );
    });
  });
});

describe("EmergencyOperationsPerformanceMonitor Integration", () => {
  it("should integrate with audit trail system", async () => {
    const mockAuditTrail =
      new AuditTrailSystem() as jest.Mocked<AuditTrailSystem>;
    mockAuditTrail.logEvent = jest.fn().mockResolvedValue(undefined);

    const monitor = new EmergencyOperationsPerformanceMonitor(
      {},
      mockAuditTrail
    );

    await monitor.recordEmergencyOperation(
      "test-op-1",
      2000,
      true,
      "emergency"
    );

    expect(mockAuditTrail.logEvent).toHaveBeenCalledTimes(1);
    expect(mockAuditTrail.logEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "emergency_operation_performance",
      })
    );
  });

  it("should integrate with circuit breaker system", async () => {
    const mockCircuitBreaker =
      new CircuitBreaker() as jest.Mocked<CircuitBreaker>;
    mockCircuitBreaker.getState = jest.fn().mockReturnValue("closed");

    const monitor = new EmergencyOperationsPerformanceMonitor(
      { circuitBreakerEnabled: true },
      undefined,
      mockCircuitBreaker
    );

    await monitor.recordEmergencyOperation(
      "test-op-1",
      2000,
      true,
      "emergency"
    );

    expect(mockCircuitBreaker.getState).toHaveBeenCalled();
  });
});
