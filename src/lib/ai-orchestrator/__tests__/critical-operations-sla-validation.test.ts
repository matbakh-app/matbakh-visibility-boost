/**
 * Critical Operations SLA Validation Tests
 *
 * Tests that critical support operations complete within 10 seconds
 * with >95% success rate as required by the Bedrock Activation specification.
 */

import { AuditTrailSystem } from "../audit-trail-system";
import { CircuitBreaker } from "../circuit-breaker";
import { EmergencyOperationsPerformanceMonitor } from "../emergency-operations-performance-monitor";

// Mock dependencies
jest.mock("../audit-trail-system");
jest.mock("../circuit-breaker");

describe("Critical Operations SLA Validation", () => {
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
        emergencySlaThresholdMs: 5000, // 5 seconds for emergency
        criticalSlaThresholdMs: 10000, // 10 seconds for critical
        successRateThreshold: 95, // 95% success rate requirement
        rollingWindowMinutes: 60, // 1 hour rolling window
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

  describe("Critical Operations SLA Requirements", () => {
    it("should validate that critical operations complete within 10 seconds", async () => {
      // Record critical operations within SLA (< 10 seconds)
      await monitor.recordEmergencyOperation(
        "critical-op-1",
        8000, // 8 seconds - within SLA
        true,
        "infrastructure",
        "test-correlation-1",
        undefined,
        "critical"
      );

      await monitor.recordEmergencyOperation(
        "critical-op-2",
        9500, // 9.5 seconds - within SLA
        true,
        "infrastructure",
        "test-correlation-2",
        undefined,
        "critical"
      );

      const stats = monitor.getCurrentPerformanceStats();

      expect(stats.criticalOperations.total).toBe(2);
      expect(stats.criticalOperations.successful).toBe(2);
      expect(stats.criticalOperations.withinSLA).toBe(2);
      expect(monitor.isCriticalOperationsPerformanceWithinSLA()).toBe(true);
    });

    it("should detect SLA violations when critical operations exceed 10 seconds", async () => {
      // Record critical operations that exceed SLA (> 10 seconds)
      await monitor.recordEmergencyOperation(
        "critical-op-slow-1",
        12000, // 12 seconds - exceeds SLA
        true,
        "infrastructure",
        "test-correlation-1",
        undefined,
        "critical"
      );

      await monitor.recordEmergencyOperation(
        "critical-op-slow-2",
        15000, // 15 seconds - exceeds SLA
        true,
        "infrastructure",
        "test-correlation-2",
        undefined,
        "critical"
      );

      const stats = monitor.getCurrentPerformanceStats();

      expect(stats.criticalOperations.total).toBe(2);
      expect(stats.criticalOperations.successful).toBe(2);
      expect(stats.criticalOperations.withinSLA).toBe(0); // Both exceeded SLA
      expect(monitor.isCriticalOperationsPerformanceWithinSLA()).toBe(false);
    });

    it("should validate 95% success rate requirement for critical operations", async () => {
      // Record 20 critical operations with 19 successful (95% success rate)
      for (let i = 1; i <= 19; i++) {
        await monitor.recordEmergencyOperation(
          `critical-op-success-${i}`,
          8000, // Within SLA
          true, // Success
          "infrastructure",
          `test-correlation-${i}`,
          undefined,
          "critical"
        );
      }

      // Record 1 failed operation
      await monitor.recordEmergencyOperation(
        "critical-op-failure-1",
        8000, // Within SLA but failed
        false, // Failure
        "infrastructure",
        "test-correlation-failure",
        "Test failure",
        "critical"
      );

      const stats = monitor.getCurrentPerformanceStats();

      expect(stats.criticalOperations.total).toBe(20);
      expect(stats.criticalOperations.successful).toBe(19);
      expect(stats.criticalOperations.withinSLA).toBe(19);

      const successRate =
        (stats.criticalOperations.successful / stats.criticalOperations.total) *
        100;
      expect(successRate).toBe(95); // Exactly 95%
      expect(monitor.isCriticalOperationsPerformanceWithinSLA()).toBe(true);
    });

    it("should fail SLA validation when success rate drops below 95%", async () => {
      // Record 20 critical operations with 18 successful (90% success rate)
      for (let i = 1; i <= 18; i++) {
        await monitor.recordEmergencyOperation(
          `critical-op-success-${i}`,
          8000, // Within SLA
          true, // Success
          "infrastructure",
          `test-correlation-${i}`,
          undefined,
          "critical"
        );
      }

      // Record 2 failed operations
      for (let i = 1; i <= 2; i++) {
        await monitor.recordEmergencyOperation(
          `critical-op-failure-${i}`,
          8000, // Within SLA but failed
          false, // Failure
          "infrastructure",
          `test-correlation-failure-${i}`,
          "Test failure",
          "critical"
        );
      }

      const stats = monitor.getCurrentPerformanceStats();

      expect(stats.criticalOperations.total).toBe(20);
      expect(stats.criticalOperations.successful).toBe(18);

      const successRate =
        (stats.criticalOperations.successful / stats.criticalOperations.total) *
        100;
      expect(successRate).toBe(90); // Below 95%
      expect(monitor.isCriticalOperationsPerformanceWithinSLA()).toBe(false);
    });

    it("should handle mixed emergency and critical operations correctly", async () => {
      // Record emergency operations (5s SLA)
      await monitor.recordEmergencyOperation(
        "emergency-op-1",
        4000, // Within emergency SLA
        true,
        "emergency",
        "emergency-correlation-1",
        undefined,
        "emergency"
      );

      // Record critical operations (10s SLA)
      await monitor.recordEmergencyOperation(
        "critical-op-1",
        8000, // Within critical SLA
        true,
        "infrastructure",
        "critical-correlation-1",
        undefined,
        "critical"
      );

      const stats = monitor.getCurrentPerformanceStats();

      // Check overall stats
      expect(stats.totalOperations).toBe(2);
      expect(stats.successfulOperations).toBe(2);
      expect(stats.operationsWithinSLA).toBe(2);

      // Check emergency operations stats
      expect(stats.emergencyOperations.total).toBe(1);
      expect(stats.emergencyOperations.successful).toBe(1);
      expect(stats.emergencyOperations.withinSLA).toBe(1);

      // Check critical operations stats
      expect(stats.criticalOperations.total).toBe(1);
      expect(stats.criticalOperations.successful).toBe(1);
      expect(stats.criticalOperations.withinSLA).toBe(1);

      // Both should meet SLA requirements
      expect(monitor.isEmergencyOperationsPerformanceWithinSLA()).toBe(true);
      expect(monitor.isCriticalOperationsPerformanceWithinSLA()).toBe(true);
    });

    it("should calculate average latency correctly for critical operations", async () => {
      const latencies = [7000, 8000, 9000, 6000, 8500]; // Average: 7700ms

      for (let i = 0; i < latencies.length; i++) {
        await monitor.recordEmergencyOperation(
          `critical-op-${i + 1}`,
          latencies[i],
          true,
          "infrastructure",
          `test-correlation-${i + 1}`,
          undefined,
          "critical"
        );
      }

      const stats = monitor.getCurrentPerformanceStats();

      expect(stats.criticalOperations.total).toBe(5);
      expect(stats.criticalOperations.averageLatencyMs).toBe(7700);
      expect(stats.criticalOperations.withinSLA).toBe(5); // All within 10s SLA
    });
  });

  describe("Performance Monitoring Features", () => {
    it("should provide separate performance validation for emergency and critical operations", async () => {
      // Record emergency operation that exceeds its SLA (> 5s) but would be within critical SLA (< 10s)
      await monitor.recordEmergencyOperation(
        "emergency-slow",
        7000, // 7 seconds - exceeds emergency SLA but within critical SLA
        true,
        "emergency",
        "emergency-correlation",
        undefined,
        "emergency"
      );

      // Record critical operation within its SLA
      await monitor.recordEmergencyOperation(
        "critical-ok",
        8000, // 8 seconds - within critical SLA
        true,
        "infrastructure",
        "critical-correlation",
        undefined,
        "critical"
      );

      const stats = monitor.getCurrentPerformanceStats();

      // Emergency operation should be marked as SLA violation
      expect(stats.emergencyOperations.withinSLA).toBe(0);
      expect(monitor.isEmergencyOperationsPerformanceWithinSLA()).toBe(false);

      // Critical operation should be within SLA
      expect(stats.criticalOperations.withinSLA).toBe(1);
      expect(monitor.isCriticalOperationsPerformanceWithinSLA()).toBe(true);
    });
  });
});
