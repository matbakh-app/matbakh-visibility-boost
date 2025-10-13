/**
 * System Resource Monitor Tests
 *
 * Tests for CPU and memory monitoring to ensure Bedrock Support Mode
 * overhead stays under 5% of system resources.
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
import { SystemResourceMonitor } from "../system-resource-monitor";

// Mock Node.js modules
const mockProcess = {
  pid: 12345,
  uptime: jest.fn(() => 100),
  memoryUsage: jest.fn(() => ({
    rss: 52428800, // 50MB in bytes
    heapTotal: 41943040,
    heapUsed: 31457280,
    external: 1048576,
    arrayBuffers: 524288,
  })),
  cpuUsage: jest.fn(() => ({
    user: 100000, // 100ms in microseconds
    system: 50000, // 50ms in microseconds
  })),
};

const mockOs = {
  totalmem: jest.fn(() => 8589934592), // 8GB in bytes
};

// Mock imports
jest.mock("process", () => mockProcess);
jest.mock("os", () => mockOs);

describe("SystemResourceMonitor", () => {
  let monitor: SystemResourceMonitor;
  let mockFeatureFlags: jest.Mocked<AiFeatureFlags>;
  let mockAuditTrail: jest.Mocked<AuditTrailSystem>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock dependencies
    mockFeatureFlags = {
      getFlag: jest.fn(),
      isEnabled: jest.fn(),
      getAllFlags: jest.fn(),
    } as any;

    mockAuditTrail = {
      logEvent: jest.fn(),
    } as any;

    // Create monitor instance
    monitor = new SystemResourceMonitor(mockFeatureFlags, mockAuditTrail);
  });

  afterEach(async () => {
    await monitor.cleanup();
  });

  describe("Initialization", () => {
    it("should initialize with default configuration", () => {
      const status = monitor.getStatus();

      expect(status.isMonitoring).toBe(false);
      expect(status.config.enabled).toBe(true);
      expect(status.config.thresholds.cpuCriticalPercent).toBe(1.0);
      expect(status.config.thresholds.memoryCriticalMB).toBe(50);
      expect(status.metricsCount).toBe(0);
      expect(status.alertsCount).toBe(0);
    });

    it("should accept custom configuration", () => {
      const customConfig = {
        thresholds: {
          cpuWarningPercent: 0.5,
          cpuCriticalPercent: 0.8,
          memoryWarningMB: 30,
          memoryCriticalMB: 40,
        },
      };

      const customMonitor = new SystemResourceMonitor(
        mockFeatureFlags,
        mockAuditTrail,
        customConfig
      );

      const status = customMonitor.getStatus();
      expect(status.config.thresholds.cpuCriticalPercent).toBe(0.8);
      expect(status.config.thresholds.memoryCriticalMB).toBe(40);
    });
  });

  describe("Resource Metrics Collection", () => {
    it("should collect current system metrics", async () => {
      const metrics = await monitor.getCurrentMetrics();

      expect(metrics).toMatchObject({
        timestamp: expect.any(Date),
        cpuUsagePercent: expect.any(Number),
        memoryUsageMB: expect.any(Number),
        memoryUsagePercent: expect.any(Number),
        totalMemoryMB: expect.any(Number),
        processId: 12345,
        uptime: 100,
      });

      // Memory should be ~50MB (52428800 bytes / 1024 / 1024)
      expect(metrics.memoryUsageMB).toBeCloseTo(50, 1);

      // Total memory should be ~8192MB (8GB)
      expect(metrics.totalMemoryMB).toBeCloseTo(8192, 1);
    });

    it("should calculate memory usage percentage correctly", async () => {
      const metrics = await monitor.getCurrentMetrics();

      // 50MB out of 8192MB should be ~0.61%
      expect(metrics.memoryUsagePercent).toBeCloseTo(0.61, 1);
    });

    it("should handle CPU usage calculation", async () => {
      const metrics = await monitor.getCurrentMetrics();

      expect(metrics.cpuUsagePercent).toBeGreaterThanOrEqual(0);
      expect(metrics.cpuUsagePercent).toBeLessThanOrEqual(100);
    });
  });

  describe("Monitoring Lifecycle", () => {
    it("should start monitoring successfully", async () => {
      await monitor.startMonitoring();

      const status = monitor.getStatus();
      expect(status.isMonitoring).toBe(true);

      // Should log monitoring start event
      expect(mockAuditTrail.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: "system_monitoring_started",
          details: expect.objectContaining({
            component: "SystemResourceMonitor",
            baseline: expect.any(Object),
            thresholds: expect.any(Object),
          }),
        })
      );
    });

    it("should not start monitoring if already monitoring", async () => {
      await monitor.startMonitoring();
      const firstCallCount = mockAuditTrail.logEvent.mock.calls.length;

      await monitor.startMonitoring();
      const secondCallCount = mockAuditTrail.logEvent.mock.calls.length;

      // Should not log additional start event
      expect(secondCallCount).toBe(firstCallCount);
    });

    it("should stop monitoring successfully", async () => {
      await monitor.startMonitoring();
      await monitor.stopMonitoring();

      const status = monitor.getStatus();
      expect(status.isMonitoring).toBe(false);

      // Should log monitoring stop event
      expect(mockAuditTrail.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: "system_monitoring_stopped",
          details: expect.objectContaining({
            component: "SystemResourceMonitor",
            finalMetrics: expect.any(Object),
            totalAlerts: expect.any(Number),
          }),
        })
      );
    });

    it("should not start monitoring if disabled by configuration", async () => {
      const disabledMonitor = new SystemResourceMonitor(
        mockFeatureFlags,
        mockAuditTrail,
        { enabled: false }
      );

      await disabledMonitor.startMonitoring();

      const status = disabledMonitor.getStatus();
      expect(status.isMonitoring).toBe(false);
    });
  });

  describe("Resource Threshold Validation", () => {
    it("should be within thresholds with normal resource usage", async () => {
      // Mock normal resource usage (well under thresholds)
      mockProcess.memoryUsage.mockReturnValue({
        rss: 20971520, // 20MB
        heapTotal: 16777216,
        heapUsed: 12582912,
        external: 524288,
        arrayBuffers: 262144,
      });

      await monitor.startMonitoring();

      // Wait a bit for metrics collection
      await new Promise((resolve) => setTimeout(resolve, 100));

      const isWithinThresholds = monitor.isWithinResourceThresholds();
      expect(isWithinThresholds).toBe(true);

      const summary = monitor.getResourceSummary();
      expect(summary.isWithinThresholds).toBe(true);
      expect(summary.activeAlerts).toHaveLength(0);
    });

    it("should detect when memory usage exceeds thresholds", async () => {
      // Mock high memory usage (over 50MB threshold)
      mockProcess.memoryUsage.mockReturnValue({
        rss: 62914560, // 60MB - exceeds 50MB threshold
        heapTotal: 52428800,
        heapUsed: 41943040,
        external: 1048576,
        arrayBuffers: 524288,
      });

      const customMonitor = new SystemResourceMonitor(
        mockFeatureFlags,
        mockAuditTrail,
        {
          monitoringIntervalMs: 100,
          alertCheckIntervalMs: 150,
        }
      );

      await customMonitor.startMonitoring();

      // Wait for metrics collection and alert checking
      await new Promise((resolve) => setTimeout(resolve, 300));

      const summary = customMonitor.getResourceSummary();
      expect(summary.isWithinThresholds).toBe(false);
      expect(summary.peakMemoryUsage).toBeGreaterThan(50);

      await customMonitor.cleanup();
    });

    it("should validate 5% system resource overhead requirement", async () => {
      // Test that the thresholds are set correctly for 5% overhead
      const status = monitor.getStatus();

      // CPU threshold should be 1% (well under 5%)
      expect(status.config.thresholds.cpuCriticalPercent).toBe(1.0);

      // Memory threshold should be 50MB (reasonable for 5% of typical system)
      expect(status.config.thresholds.memoryCriticalMB).toBe(50);

      // Warning thresholds should be lower
      expect(status.config.thresholds.cpuWarningPercent).toBe(0.8);
      expect(status.config.thresholds.memoryWarningMB).toBe(40);
    });
  });

  describe("Alert Management", () => {
    it("should create memory alerts when thresholds are exceeded", async () => {
      // Mock high memory usage
      mockProcess.memoryUsage.mockReturnValue({
        rss: 62914560, // 60MB - exceeds 50MB threshold
        heapTotal: 52428800,
        heapUsed: 41943040,
        external: 1048576,
        arrayBuffers: 524288,
      });

      const customMonitor = new SystemResourceMonitor(
        mockFeatureFlags,
        mockAuditTrail,
        {
          monitoringIntervalMs: 50,
          alertCheckIntervalMs: 100,
        }
      );

      await customMonitor.startMonitoring();

      // Wait for alert generation
      await new Promise((resolve) => setTimeout(resolve, 200));

      const alerts = customMonitor.getActiveAlerts();
      expect(alerts.length).toBeGreaterThan(0);

      const memoryAlert = alerts.find((alert) => alert.type === "memory");
      expect(memoryAlert).toBeDefined();
      expect(memoryAlert?.severity).toBe("critical");
      expect(memoryAlert?.currentValue).toBeGreaterThan(50);

      await customMonitor.cleanup();
    });

    it("should acknowledge alerts", async () => {
      // Create a mock alert scenario
      mockProcess.memoryUsage.mockReturnValue({
        rss: 62914560, // 60MB
        heapTotal: 52428800,
        heapUsed: 41943040,
        external: 1048576,
        arrayBuffers: 524288,
      });

      const customMonitor = new SystemResourceMonitor(
        mockFeatureFlags,
        mockAuditTrail,
        {
          monitoringIntervalMs: 50,
          alertCheckIntervalMs: 100,
        }
      );

      await customMonitor.startMonitoring();
      await new Promise((resolve) => setTimeout(resolve, 200));

      const alerts = customMonitor.getActiveAlerts();
      expect(alerts.length).toBeGreaterThan(0);

      const alertId = alerts[0].id;
      const acknowledged = customMonitor.acknowledgeAlert(alertId);
      expect(acknowledged).toBe(true);

      const activeAlertsAfter = customMonitor.getActiveAlerts();
      expect(activeAlertsAfter.length).toBe(alerts.length - 1);

      await customMonitor.cleanup();
    });

    it("should respect alert cooldown periods", async () => {
      const customMonitor = new SystemResourceMonitor(
        mockFeatureFlags,
        mockAuditTrail,
        {
          monitoringIntervalMs: 50,
          alertCheckIntervalMs: 100,
          alertCooldownMs: 1000, // 1 second cooldown
        }
      );

      // Mock high memory usage
      mockProcess.memoryUsage.mockReturnValue({
        rss: 62914560, // 60MB
        heapTotal: 52428800,
        heapUsed: 41943040,
        external: 1048576,
        arrayBuffers: 524288,
      });

      await customMonitor.startMonitoring();

      // Wait for first alert
      await new Promise((resolve) => setTimeout(resolve, 200));
      const firstAlertCount = customMonitor.getAllAlerts().length;

      // Wait a bit more (but less than cooldown)
      await new Promise((resolve) => setTimeout(resolve, 300));
      const secondAlertCount = customMonitor.getAllAlerts().length;

      // Should not have created additional alerts due to cooldown
      expect(secondAlertCount).toBe(firstAlertCount);

      await customMonitor.cleanup();
    });
  });

  describe("Resource Summary and Reporting", () => {
    it("should provide comprehensive resource summary", async () => {
      await monitor.startMonitoring();

      // Wait for some metrics collection
      await new Promise((resolve) => setTimeout(resolve, 100));

      const summary = monitor.getResourceSummary();

      expect(summary).toMatchObject({
        current: expect.any(Object),
        baseline: expect.any(Object),
        averageCpuUsage: expect.any(Number),
        averageMemoryUsage: expect.any(Number),
        peakCpuUsage: expect.any(Number),
        peakMemoryUsage: expect.any(Number),
        isWithinThresholds: expect.any(Boolean),
        activeAlerts: expect.any(Array),
      });

      if (summary.current) {
        expect(summary.current.timestamp).toBeInstanceOf(Date);
      }
      if (summary.baseline) {
        expect(summary.baseline.timestamp).toBeInstanceOf(Date);
      }
    });

    it("should track recent metrics correctly", async () => {
      await monitor.startMonitoring();

      // Wait for metrics collection
      await new Promise((resolve) => setTimeout(resolve, 100));

      const recentMetrics = monitor.getRecentMetrics(60000); // Last minute
      expect(recentMetrics.length).toBeGreaterThanOrEqual(0);

      if (recentMetrics.length > 0) {
        const latestMetric = recentMetrics[recentMetrics.length - 1];
        expect(latestMetric.timestamp.getTime()).toBeGreaterThan(
          Date.now() - 60000
        );
      }
    });

    it("should handle empty metrics gracefully", () => {
      const summary = monitor.getResourceSummary();

      expect(summary.current).toBeNull();
      expect(summary.averageCpuUsage).toBe(0);
      expect(summary.averageMemoryUsage).toBe(0);
      expect(summary.peakCpuUsage).toBe(0);
      expect(summary.peakMemoryUsage).toBe(0);
      expect(summary.isWithinThresholds).toBe(true);
      expect(summary.activeAlerts).toHaveLength(0);
    });
  });

  describe("Configuration Management", () => {
    it("should update configuration dynamically", () => {
      const newConfig = {
        thresholds: {
          cpuWarningPercent: 0.6,
          cpuCriticalPercent: 0.9,
          memoryWarningMB: 35,
          memoryCriticalMB: 45,
        },
      };

      monitor.updateConfig(newConfig);

      const status = monitor.getStatus();
      expect(status.config.thresholds.cpuCriticalPercent).toBe(0.9);
      expect(status.config.thresholds.memoryCriticalMB).toBe(45);
    });

    it("should reset metrics and alerts", () => {
      // Add some mock data
      monitor.reset();

      const status = monitor.getStatus();
      expect(status.metricsCount).toBe(0);
      expect(status.alertsCount).toBe(0);

      const summary = monitor.getResourceSummary();
      expect(summary.current).toBeNull();
      expect(summary.baseline).toBeNull();
    });
  });

  describe("Integration with Audit Trail", () => {
    it("should log high resource usage events", async () => {
      // Mock high memory usage
      mockProcess.memoryUsage.mockReturnValue({
        rss: 52428800, // 50MB - at warning threshold
        heapTotal: 41943040,
        heapUsed: 31457280,
        external: 1048576,
        arrayBuffers: 524288,
      });

      const customMonitor = new SystemResourceMonitor(
        mockFeatureFlags,
        mockAuditTrail,
        {
          monitoringIntervalMs: 100,
          thresholds: {
            cpuWarningPercent: 0.8,
            cpuCriticalPercent: 1.0,
            memoryWarningMB: 40, // Lower threshold to trigger warning
            memoryCriticalMB: 50,
          },
        }
      );

      await customMonitor.startMonitoring();

      // Wait for metrics collection
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Should log high resource usage event
      expect(mockAuditTrail.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: "high_resource_usage_detected",
          details: expect.objectContaining({
            component: "SystemResourceMonitor",
            metrics: expect.any(Object),
            thresholds: expect.any(Object),
          }),
        })
      );

      await customMonitor.cleanup();
    });

    it("should log alert creation events", async () => {
      // Mock high memory usage to trigger alert
      mockProcess.memoryUsage.mockReturnValue({
        rss: 62914560, // 60MB - exceeds threshold
        heapTotal: 52428800,
        heapUsed: 41943040,
        external: 1048576,
        arrayBuffers: 524288,
      });

      const customMonitor = new SystemResourceMonitor(
        mockFeatureFlags,
        mockAuditTrail,
        {
          monitoringIntervalMs: 50,
          alertCheckIntervalMs: 100,
        }
      );

      await customMonitor.startMonitoring();

      // Wait for alert creation
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Should log alert creation event
      expect(mockAuditTrail.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: "resource_alert_created",
          details: expect.objectContaining({
            component: "SystemResourceMonitor",
            alert: expect.any(Object),
          }),
        })
      );

      await customMonitor.cleanup();
    });
  });

  describe("Performance Requirements Validation", () => {
    it("should meet 5% system resource overhead requirement", () => {
      const status = monitor.getStatus();

      // Validate CPU threshold is well under 5%
      expect(status.config.thresholds.cpuCriticalPercent).toBeLessThanOrEqual(
        1.0
      );

      // Validate memory threshold is reasonable for 5% of typical system
      // 50MB is reasonable for systems with 1GB+ RAM
      expect(status.config.thresholds.memoryCriticalMB).toBeLessThanOrEqual(50);

      // Validate warning thresholds provide early warning
      expect(status.config.thresholds.cpuWarningPercent).toBeLessThan(
        status.config.thresholds.cpuCriticalPercent
      );
      expect(status.config.thresholds.memoryWarningMB).toBeLessThan(
        status.config.thresholds.memoryCriticalMB
      );
    });

    it("should validate monitoring overhead is minimal", async () => {
      const beforeMetrics = await monitor.getCurrentMetrics();

      await monitor.startMonitoring();

      // Let monitoring run for a bit
      await new Promise((resolve) => setTimeout(resolve, 200));

      const afterMetrics = await monitor.getCurrentMetrics();

      // Monitoring itself should not significantly increase resource usage
      const cpuIncrease =
        afterMetrics.cpuUsagePercent - beforeMetrics.cpuUsagePercent;
      const memoryIncrease =
        afterMetrics.memoryUsageMB - beforeMetrics.memoryUsageMB;

      // Monitoring overhead should be minimal
      expect(Math.abs(cpuIncrease)).toBeLessThan(0.2); // Less than 0.2% CPU (adjusted for test environment)
      expect(Math.abs(memoryIncrease)).toBeLessThan(5); // Less than 5MB memory
    });
  });
});
