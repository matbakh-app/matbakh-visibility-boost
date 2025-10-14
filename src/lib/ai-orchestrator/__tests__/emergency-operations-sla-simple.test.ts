/**
 * Emergency Operations SLA Validation - Simple Tests
 *
 * Validates that emergency operations complete within 5 seconds with >95% success rate
 */

import { EmergencyOperationsPerformanceMonitor } from "../emergency-operations-performance-monitor";

describe("Emergency Operations SLA - Simple Validation", () => {
  let monitor: EmergencyOperationsPerformanceMonitor;

  beforeEach(() => {
    monitor = new EmergencyOperationsPerformanceMonitor({
      slaThresholdMs: 5000,
      successRateThreshold: 95,
      rollingWindowMinutes: 60,
      alertingEnabled: false, // Disable alerts for testing
    });
  });

  afterEach(() => {
    monitor.resetMetrics();
  });

  describe("SLA Requirement: Emergency operations complete within 5 seconds > 95% of the time", () => {
    it("should validate 95% success rate requirement", async () => {
      // Add 100 operations with 96% within SLA (exceeds 95% requirement)
      for (let i = 0; i < 100; i++) {
        const latency = i < 96 ? 4000 : 6000; // 96% within 5s SLA
        await monitor.recordEmergencyOperation(
          `test-op-${i}`,
          latency,
          true, // all successful
          "emergency"
        );
      }

      const stats = monitor.getCurrentPerformanceStats();

      // Validate SLA compliance
      expect(stats.totalOperations).toBe(100);
      expect(stats.successfulOperations).toBe(100);
      expect(stats.operationsWithinSLA).toBe(96);
      expect(stats.successRate).toBe(100);
      expect(stats.slaComplianceRate).toBe(96);

      // Should meet SLA requirement (96% > 95%)
      expect(monitor.isPerformanceWithinSLA()).toBe(true);

      console.log(
        `✅ SLA Validation: ${stats.slaComplianceRate}% operations within 5s (requirement: >95%)`
      );
    });

    it("should detect SLA violations when compliance drops below 95%", async () => {
      // Add 100 operations with only 90% within SLA (below 95% requirement)
      for (let i = 0; i < 100; i++) {
        const latency = i < 90 ? 4000 : 7000; // Only 90% within 5s SLA
        await monitor.recordEmergencyOperation(
          `test-op-${i}`,
          latency,
          true, // all successful
          "emergency"
        );
      }

      const stats = monitor.getCurrentPerformanceStats();

      // Validate SLA violation
      expect(stats.slaComplianceRate).toBe(90);
      expect(monitor.isPerformanceWithinSLA()).toBe(false);

      console.log(
        `⚠️ SLA Violation: ${stats.slaComplianceRate}% operations within 5s (requirement: >95%)`
      );
    });

    it("should track emergency operation latency correctly", async () => {
      const testLatencies = [2000, 3000, 4000, 6000, 8000]; // Mix of within/outside SLA

      for (let i = 0; i < testLatencies.length; i++) {
        await monitor.recordEmergencyOperation(
          `test-op-${i}`,
          testLatencies[i],
          true,
          "emergency"
        );
      }

      const stats = monitor.getCurrentPerformanceStats();

      expect(stats.totalOperations).toBe(5);
      expect(stats.operationsWithinSLA).toBe(3); // 2000, 3000, 4000 are < 5000ms
      expect(stats.slaComplianceRate).toBe(60); // 3/5 = 60%

      // Average should be (2000 + 3000 + 4000 + 6000 + 8000) / 5 = 4600
      expect(stats.averageLatencyMs).toBe(4600);

      console.log(
        `📊 Latency tracking: ${stats.operationsWithinSLA}/${stats.totalOperations} within SLA`
      );
    });

    it("should handle mixed success and failure scenarios", async () => {
      const operations = [
        { latency: 2000, success: true }, // Within SLA, success
        { latency: 3000, success: true }, // Within SLA, success
        { latency: 4000, success: false }, // Within SLA, failure
        { latency: 6000, success: true }, // Outside SLA, success
        { latency: 7000, success: false }, // Outside SLA, failure
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

      const stats = monitor.getCurrentPerformanceStats();

      expect(stats.totalOperations).toBe(5);
      expect(stats.successfulOperations).toBe(3); // 3 successful
      expect(stats.operationsWithinSLA).toBe(3); // 3 within SLA (regardless of success)
      expect(stats.successRate).toBe(60); // 3/5 = 60%
      expect(stats.slaComplianceRate).toBe(60); // 3/5 = 60%

      // Should not meet SLA (both rates below 95%)
      expect(monitor.isPerformanceWithinSLA()).toBe(false);

      console.log(
        `📊 Mixed scenario: ${stats.successRate}% success, ${stats.slaComplianceRate}% within SLA`
      );
    });

    it("should provide performance recommendations when SLA is not met", async () => {
      // Create scenario with poor performance
      for (let i = 0; i < 10; i++) {
        await monitor.recordEmergencyOperation(
          `test-op-${i}`,
          7000, // All exceed SLA
          i < 8, // 80% success rate
          "emergency"
        );
      }

      const report = monitor.getPerformanceReport();

      expect(report.isWithinSLA).toBe(false);
      expect(report.recommendations.length).toBeGreaterThan(0);

      // Should have recommendations for both SLA compliance and success rate
      const hasSLARecommendation = report.recommendations.some(
        (rec) =>
          rec.includes("SLA compliance rate") && rec.includes("below threshold")
      );
      const hasSuccessRecommendation = report.recommendations.some(
        (rec) => rec.includes("Success rate") && rec.includes("below threshold")
      );

      expect(hasSLARecommendation).toBe(true);
      expect(hasSuccessRecommendation).toBe(true);

      console.log(
        `💡 Recommendations generated: ${report.recommendations.length}`
      );
      report.recommendations.forEach((rec, i) => {
        console.log(`   ${i + 1}. ${rec}`);
      });
    });
  });

  describe("Performance Monitoring Features", () => {
    it("should calculate percentiles correctly", async () => {
      const latencies = [
        1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000,
      ];

      for (let i = 0; i < latencies.length; i++) {
        await monitor.recordEmergencyOperation(
          `test-op-${i}`,
          latencies[i],
          true,
          "emergency"
        );
      }

      const stats = monitor.getCurrentPerformanceStats();

      // P95 should be around 9500 (95th percentile of sorted array)
      expect(stats.p95LatencyMs).toBeGreaterThan(9000);
      expect(stats.p95LatencyMs).toBeLessThanOrEqual(10000);

      // P99 should be around 9900 (99th percentile)
      expect(stats.p99LatencyMs).toBeGreaterThan(9500);
      expect(stats.p99LatencyMs).toBeLessThanOrEqual(10000);

      console.log(
        `📈 Percentiles: P95=${stats.p95LatencyMs}ms, P99=${stats.p99LatencyMs}ms`
      );
    });

    it("should export metrics for external monitoring", async () => {
      // Add some test data
      await monitor.recordEmergencyOperation("test-1", 2000, true, "emergency");
      await monitor.recordEmergencyOperation(
        "test-2",
        6000,
        false,
        "emergency"
      );

      const exportedData = monitor.exportMetrics();

      expect(exportedData.metrics).toBeDefined();
      expect(exportedData.metrics.length).toBe(2);
      expect(exportedData.stats).toBeDefined();
      expect(exportedData.config).toBeDefined();

      expect(exportedData.metrics[0].operationId).toBe("test-1");
      expect(exportedData.metrics[1].operationId).toBe("test-2");

      console.log(
        `📤 Exported ${exportedData.metrics.length} metrics for external monitoring`
      );
    });
  });
});
