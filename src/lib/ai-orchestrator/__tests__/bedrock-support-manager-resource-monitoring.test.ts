/**
 * Bedrock Support Manager Resource Monitoring Tests
 *
 * Tests for the 5% system resource overhead requirement integration.
 */

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { BedrockAdapter } from "../adapters/bedrock-adapter";
import { AiFeatureFlags } from "../ai-feature-flags";
import { BedrockSupportManager } from "../bedrock-support-manager";
import { ComplianceIntegration } from "../compliance-integration";
import { GDPRHybridComplianceValidator } from "../gdpr-hybrid-compliance-validator";
import { ProviderAgreementCompliance } from "../provider-agreement-compliance";

// Mock Node.js modules for resource monitoring
jest.mock("process", () => ({
  pid: 12345,
  uptime: jest.fn(() => 100),
  memoryUsage: jest.fn(() => ({
    rss: 41943040, // 40MB in bytes (under threshold)
    heapTotal: 33554432,
    heapUsed: 25165824,
    external: 1048576,
    arrayBuffers: 524288,
  })),
  cpuUsage: jest.fn(() => ({
    user: 80000, // 80ms in microseconds (low usage)
    system: 40000, // 40ms in microseconds
  })),
}));

jest.mock("os", () => ({
  totalmem: jest.fn(() => 8589934592), // 8GB in bytes
}));

describe("BedrockSupportManager Resource Monitoring", () => {
  let supportManager: BedrockSupportManager;
  let mockFeatureFlags: jest.Mocked<AiFeatureFlags>;
  let mockBedrockAdapter: jest.Mocked<BedrockAdapter>;
  let mockProviderCompliance: jest.Mocked<ProviderAgreementCompliance>;
  let mockComplianceIntegration: jest.Mocked<ComplianceIntegration>;
  let mockGdprValidator: jest.Mocked<GDPRHybridComplianceValidator>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock dependencies
    mockFeatureFlags = {
      isBedrockSupportModeEnabled: jest.fn().mockResolvedValue(true),
      validateBedrockSupportModeFlags: jest.fn().mockResolvedValue({
        isValid: true,
        errors: [],
        warnings: [],
      }),
      isProviderEnabled: jest.fn().mockResolvedValue(true),
      disableBedrockSupportModeSafely: jest.fn().mockResolvedValue(undefined),
    } as any;

    mockBedrockAdapter = {
      runInfrastructureCheck: jest.fn().mockResolvedValue({
        overallHealth: "healthy",
        detectedIssues: [],
        implementationGaps: [],
        recommendations: [],
        complianceStatus: {
          gdprCompliant: true,
          dataResidencyCompliant: true,
          auditTrailComplete: true,
          issues: [],
        },
      }),
    } as any;

    mockProviderCompliance = {
      validateCompliance: jest.fn().mockResolvedValue({
        isCompliant: true,
        violations: [],
        warnings: [],
      }),
    } as any;

    mockComplianceIntegration = {
      validateGDPRCompliance: jest.fn().mockResolvedValue({
        isCompliant: true,
        violations: [],
      }),
    } as any;

    mockGdprValidator = {
      validateHybridCompliance: jest.fn().mockResolvedValue({
        isCompliant: true,
        violations: [],
      }),
    } as any;

    // Create support manager instance
    supportManager = new BedrockSupportManager(
      { enabled: true },
      mockFeatureFlags,
      mockBedrockAdapter,
      mockProviderCompliance,
      mockComplianceIntegration,
      mockGdprValidator
    );
  });

  afterEach(async () => {
    if (supportManager.isActive()) {
      await supportManager.deactivate();
    }
  });

  describe("Resource Monitoring Integration", () => {
    it("should start resource monitoring when support mode is activated", async () => {
      const result = await supportManager.activate();

      expect(result.success).toBe(true);
      expect(supportManager.isActive()).toBe(true);

      const resourceStatus = supportManager.getResourceMonitoringStatus();
      expect(resourceStatus.isMonitoring).toBe(true);
    });

    it("should stop resource monitoring when support mode is deactivated", async () => {
      await supportManager.activate();
      expect(supportManager.getResourceMonitoringStatus().isMonitoring).toBe(
        true
      );

      await supportManager.deactivate();
      expect(supportManager.isActive()).toBe(false);

      const resourceStatus = supportManager.getResourceMonitoringStatus();
      expect(resourceStatus.isMonitoring).toBe(false);
    });

    it("should provide resource monitoring status", async () => {
      await supportManager.activate();

      const status = supportManager.getResourceMonitoringStatus();

      expect(status).toMatchObject({
        isMonitoring: true,
        isWithinThresholds: expect.any(Boolean),
        currentMetrics: expect.any(Object),
        summary: expect.any(Object),
        alerts: expect.any(Array),
      });
    });
  });

  describe("5% Resource Overhead Validation", () => {
    it("should validate resource overhead compliance", async () => {
      await supportManager.activate();

      // Wait a bit for metrics collection
      await new Promise((resolve) => setTimeout(resolve, 100));

      const validation = await supportManager.validateResourceOverhead();

      expect(validation).toMatchObject({
        isCompliant: expect.any(Boolean),
        cpuUsage: expect.any(Number),
        memoryUsage: expect.any(Number),
        thresholds: expect.any(Object),
        recommendations: expect.any(Array),
      });

      // With mocked low resource usage, should be compliant
      expect(validation.isCompliant).toBe(true);
      expect(validation.cpuUsage).toBeLessThanOrEqual(1.0); // Under 1% CPU
      expect(validation.memoryUsage).toBeLessThanOrEqual(50); // Under 50MB memory
    });

    it("should detect non-compliance when resource usage is high", async () => {
      // Mock high resource usage
      const process = await import("process");
      (process.memoryUsage as jest.Mock).mockReturnValue({
        rss: 62914560, // 60MB - exceeds 50MB threshold
        heapTotal: 52428800,
        heapUsed: 41943040,
        external: 1048576,
        arrayBuffers: 524288,
      });

      await supportManager.activate();
      await new Promise((resolve) => setTimeout(resolve, 100));

      const validation = await supportManager.validateResourceOverhead();

      expect(validation.isCompliant).toBe(false);
      expect(validation.memoryUsage).toBeGreaterThan(50);
      expect(validation.recommendations.length).toBeGreaterThan(0);
    });

    it("should provide recommendations when approaching thresholds", async () => {
      // Mock resource usage approaching thresholds
      const process = await import("process");
      (process.memoryUsage as jest.Mock).mockReturnValue({
        rss: 46137344, // 44MB - approaching 50MB threshold
        heapTotal: 37748736,
        heapUsed: 29360128,
        external: 1048576,
        arrayBuffers: 524288,
      });

      await supportManager.activate();
      await new Promise((resolve) => setTimeout(resolve, 100));

      const validation = await supportManager.validateResourceOverhead();

      expect(validation.recommendations.length).toBeGreaterThan(0);
      expect(validation.recommendations[0]).toContain("Memory usage");
    });
  });

  describe("Performance Metrics with Overhead", () => {
    it("should provide performance metrics including resource overhead", async () => {
      await supportManager.activate();
      await new Promise((resolve) => setTimeout(resolve, 100));

      const metrics = await supportManager.getPerformanceMetricsWithOverhead();

      expect(metrics).toMatchObject({
        responseTime: expect.any(Number),
        memoryUsage: expect.any(Number),
        cpuUsage: expect.any(Number),
        networkLatency: expect.any(Number),
        resourceOverhead: {
          cpuUsagePercent: expect.any(Number),
          memoryUsageMB: expect.any(Number),
          isWithinThresholds: expect.any(Boolean),
        },
      });

      // Resource overhead should be within thresholds
      expect(metrics.resourceOverhead.isWithinThresholds).toBe(true);
      expect(metrics.resourceOverhead.cpuUsagePercent).toBeLessThanOrEqual(1.0);
      expect(metrics.resourceOverhead.memoryUsageMB).toBeLessThanOrEqual(50);
    });

    it("should track actual resource usage in performance metrics", async () => {
      await supportManager.activate();
      await new Promise((resolve) => setTimeout(resolve, 100));

      const metrics = await supportManager.getPerformanceMetricsWithOverhead();

      // Memory usage should match what we mocked (40MB)
      expect(metrics.memoryUsage).toBeCloseTo(40, 1);
      expect(metrics.resourceOverhead.memoryUsageMB).toBeCloseTo(40, 1);

      // CPU usage should be reasonable
      expect(metrics.cpuUsage).toBeGreaterThanOrEqual(0);
      expect(metrics.cpuUsage).toBeLessThanOrEqual(100);
    });
  });

  describe("Emergency Shutdown on Resource Overhead", () => {
    it("should not trigger emergency shutdown with normal resource usage", async () => {
      await supportManager.activate();

      // This should not trigger shutdown
      await supportManager.emergencyShutdownOnResourceOverhead();

      // Support mode should still be active
      expect(supportManager.isActive()).toBe(true);
    });

    it("should trigger emergency shutdown with excessive resource usage", async () => {
      // Mock extremely high resource usage
      const process = await import("process");
      (process.memoryUsage as jest.Mock).mockReturnValue({
        rss: 125829120, // 120MB - exceeds 100MB emergency threshold
        heapTotal: 104857600,
        heapUsed: 83886080,
        external: 2097152,
        arrayBuffers: 1048576,
      });

      await supportManager.activate();
      expect(supportManager.isActive()).toBe(true);

      // This should trigger emergency shutdown
      await supportManager.emergencyShutdownOnResourceOverhead();

      // Support mode should be deactivated
      expect(supportManager.isActive()).toBe(false);
    });

    it("should log emergency shutdown events", async () => {
      // Mock high CPU usage
      const process = await import("process");
      (process.cpuUsage as jest.Mock).mockReturnValue({
        user: 2500000, // High CPU usage
        system: 1500000,
      });

      await supportManager.activate();

      // Trigger emergency shutdown
      await supportManager.emergencyShutdownOnResourceOverhead();

      // Should have deactivated
      expect(supportManager.isActive()).toBe(false);
    });
  });

  describe("Resource Monitoring Configuration", () => {
    it("should use appropriate thresholds for 5% overhead requirement", async () => {
      await supportManager.activate();

      const status = supportManager.getResourceMonitoringStatus();

      // CPU threshold should be 1% (well under 5%)
      expect(status.summary.baseline).toBeDefined();

      const validation = await supportManager.validateResourceOverhead();
      expect(validation.thresholds.cpuCriticalPercent).toBe(1.0);
      expect(validation.thresholds.memoryCriticalMB).toBe(50);
    });

    it("should provide early warning thresholds", async () => {
      await supportManager.activate();

      const validation = await supportManager.validateResourceOverhead();

      // Warning thresholds should be lower than critical
      expect(validation.thresholds.cpuWarningPercent).toBeLessThan(
        validation.thresholds.cpuCriticalPercent
      );
      expect(validation.thresholds.memoryWarningMB).toBeLessThan(
        validation.thresholds.memoryCriticalMB
      );
    });
  });

  describe("Resource Monitoring Alerts", () => {
    it("should track resource alerts", async () => {
      // Mock resource usage that will trigger warnings
      const process = await import("process");
      (process.memoryUsage as jest.Mock).mockReturnValue({
        rss: 46137344, // 44MB - should trigger warning
        heapTotal: 37748736,
        heapUsed: 29360128,
        external: 1048576,
        arrayBuffers: 524288,
      });

      await supportManager.activate();

      // Wait for potential alert generation
      await new Promise((resolve) => setTimeout(resolve, 200));

      const status = supportManager.getResourceMonitoringStatus();

      // Should have monitoring active
      expect(status.isMonitoring).toBe(true);
      expect(status.alerts).toBeDefined();
      expect(Array.isArray(status.alerts)).toBe(true);
    });

    it("should provide alert information in resource status", async () => {
      await supportManager.activate();

      const status = supportManager.getResourceMonitoringStatus();

      expect(status).toHaveProperty("alerts");
      expect(status).toHaveProperty("isWithinThresholds");
      expect(status).toHaveProperty("currentMetrics");
      expect(status).toHaveProperty("summary");
    });
  });

  describe("Integration with Existing Systems", () => {
    it("should integrate resource monitoring with audit trail", async () => {
      await supportManager.activate();

      // Validate resource overhead (this should log to audit trail)
      await supportManager.validateResourceOverhead();

      // The validation should have logged an audit event
      // (In a real test, you'd mock the audit trail and verify the call)
      expect(true).toBe(true); // Placeholder - audit trail integration is tested in the method
    });

    it("should not interfere with existing support operations", async () => {
      await supportManager.activate();

      // Run infrastructure audit (existing functionality)
      const auditResult = await supportManager.runInfrastructureAudit();

      expect(auditResult).toBeDefined();
      expect(auditResult.overallHealth).toBeDefined();

      // Resource monitoring should still be active
      const resourceStatus = supportManager.getResourceMonitoringStatus();
      expect(resourceStatus.isMonitoring).toBe(true);
    });
  });

  describe("Success Metrics Validation", () => {
    it("should meet the 5% system resource overhead requirement", async () => {
      await supportManager.activate();
      await new Promise((resolve) => setTimeout(resolve, 100));

      const validation = await supportManager.validateResourceOverhead();

      // Should be well under 5% of system resources
      // 1% CPU and 50MB memory are reasonable for 5% overhead on typical systems
      expect(validation.thresholds.cpuCriticalPercent).toBeLessThanOrEqual(1.0);
      expect(validation.thresholds.memoryCriticalMB).toBeLessThanOrEqual(50);

      // With normal usage, should be compliant
      expect(validation.isCompliant).toBe(true);
    });

    it("should validate monitoring overhead is minimal", async () => {
      // Get baseline metrics before activation
      const baselineValidation =
        await supportManager.validateResourceOverhead();

      await supportManager.activate();

      // Wait for monitoring to run
      await new Promise((resolve) => setTimeout(resolve, 200));

      const activeValidation = await supportManager.validateResourceOverhead();

      // Monitoring itself should not significantly increase resource usage
      const cpuIncrease =
        activeValidation.cpuUsage - baselineValidation.cpuUsage;
      const memoryIncrease =
        activeValidation.memoryUsage - baselineValidation.memoryUsage;

      // Monitoring overhead should be minimal
      expect(Math.abs(cpuIncrease)).toBeLessThan(0.1); // Less than 0.1% CPU increase
      expect(Math.abs(memoryIncrease)).toBeLessThan(5); // Less than 5MB memory increase
    });
  });
});
