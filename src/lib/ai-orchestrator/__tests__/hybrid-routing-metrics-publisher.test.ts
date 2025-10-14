/**
 * Tests for Hybrid Routing Metrics Publisher
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
import { HybridHealthMonitor } from "../hybrid-health-monitor";
import { HybridRoutingMetricsPublisher } from "../hybrid-routing-metrics-publisher";
import { HybridRoutingPerformanceMonitor } from "../hybrid-routing-performance-monitor";
import { IntelligentRouter } from "../intelligent-router";

describe("HybridRoutingMetricsPublisher", () => {
  let publisher: HybridRoutingMetricsPublisher;
  let performanceMonitor: HybridRoutingPerformanceMonitor;
  let healthMonitor: HybridHealthMonitor;
  let router: IntelligentRouter;
  let featureFlags: AiFeatureFlags;

  beforeEach(() => {
    // Create mock instances
    featureFlags = new AiFeatureFlags();
    router = {} as IntelligentRouter;
    healthMonitor = new HybridHealthMonitor(router, featureFlags);
    performanceMonitor = new HybridRoutingPerformanceMonitor(
      router,
      healthMonitor,
      featureFlags
    );

    publisher = new HybridRoutingMetricsPublisher(
      performanceMonitor,
      healthMonitor,
      {
        enablePublishing: false, // Disable for tests
        publishIntervalMs: 100,
      }
    );
  });

  afterEach(() => {
    publisher.cleanup();
  });

  describe("Configuration", () => {
    it("should initialize with default configuration", () => {
      const config = publisher.getConfig();

      expect(config.namespace).toBe("Matbakh/HybridRouting");
      expect(config.region).toBe("eu-central-1");
      expect(config.batchSize).toBe(20);
    });

    it("should allow configuration updates", () => {
      publisher.updateConfig({
        namespace: "Custom/Namespace",
        batchSize: 50,
      });

      const config = publisher.getConfig();
      expect(config.namespace).toBe("Custom/Namespace");
      expect(config.batchSize).toBe(50);
    });
  });

  describe("Publishing Control", () => {
    it("should start and stop publishing", () => {
      publisher.startPublishing();
      publisher.stopPublishing();

      // Should not throw
      expect(true).toBe(true);
    });

    it("should not start publishing if already publishing", () => {
      // Create a publisher with publishing enabled
      const enabledPublisher = new HybridRoutingMetricsPublisher(
        performanceMonitor,
        healthMonitor,
        {
          enablePublishing: true,
          publishIntervalMs: 100,
        }
      );

      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      enabledPublisher.startPublishing();
      enabledPublisher.startPublishing();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Already publishing")
      );

      enabledPublisher.stopPublishing();
      enabledPublisher.cleanup();
      consoleSpy.mockRestore();
    });

    it("should not start publishing if disabled", () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      publisher.startPublishing();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Publishing disabled")
      );

      consoleSpy.mockRestore();
    });
  });

  describe("Cleanup", () => {
    it("should cleanup resources", () => {
      publisher.cleanup();

      const config = publisher.getConfig();
      expect(config).toBeDefined();
    });
  });

  describe("Support Mode Metrics", () => {
    it("should record support mode operation metrics", () => {
      const metrics = {
        operationType: "infrastructure_audit" as any,
        routePath: "direct" as const,
        latencyMs: 150,
        success: true,
        costUsd: 0.05,
        timestamp: new Date(),
      };

      publisher.recordSupportModeOperation(metrics);

      const summary = publisher.getSupportModeMetricsSummary();
      expect(summary.totalOperations).toBeGreaterThan(0);
    });

    it("should track operations by type", () => {
      const metrics1 = {
        operationType: "infrastructure_audit" as any,
        routePath: "direct" as const,
        latencyMs: 150,
        success: true,
        costUsd: 0.05,
        timestamp: new Date(),
      };

      const metrics2 = {
        operationType: "meta_monitor" as any,
        routePath: "mcp" as const,
        latencyMs: 200,
        success: true,
        costUsd: 0.03,
        timestamp: new Date(),
      };

      publisher.recordSupportModeOperation(metrics1);
      publisher.recordSupportModeOperation(metrics2);

      const summary = publisher.getSupportModeMetricsSummary();
      expect(Object.keys(summary.operationsByType).length).toBeGreaterThan(0);
    });

    it("should track operations by path", () => {
      const metrics1 = {
        operationType: "infrastructure_audit" as any,
        routePath: "direct" as const,
        latencyMs: 150,
        success: true,
        costUsd: 0.05,
        timestamp: new Date(),
      };

      const metrics2 = {
        operationType: "meta_monitor" as any,
        routePath: "mcp" as const,
        latencyMs: 200,
        success: true,
        costUsd: 0.03,
        timestamp: new Date(),
      };

      publisher.recordSupportModeOperation(metrics1);
      publisher.recordSupportModeOperation(metrics2);

      const summary = publisher.getSupportModeMetricsSummary();
      expect(Object.keys(summary.operationsByPath).length).toBeGreaterThan(0);
    });

    it("should calculate average latency", () => {
      const metrics1 = {
        operationType: "infrastructure_audit" as any,
        routePath: "direct" as const,
        latencyMs: 100,
        success: true,
        costUsd: 0.05,
        timestamp: new Date(),
      };

      const metrics2 = {
        operationType: "meta_monitor" as any,
        routePath: "mcp" as const,
        latencyMs: 200,
        success: true,
        costUsd: 0.03,
        timestamp: new Date(),
      };

      publisher.recordSupportModeOperation(metrics1);
      publisher.recordSupportModeOperation(metrics2);

      const summary = publisher.getSupportModeMetricsSummary();
      expect(summary.averageLatencyMs).toBeGreaterThan(0);
    });

    it("should calculate success rate", () => {
      const metrics1 = {
        operationType: "infrastructure_audit" as any,
        routePath: "direct" as const,
        latencyMs: 150,
        success: true,
        costUsd: 0.05,
        timestamp: new Date(),
      };

      const metrics2 = {
        operationType: "meta_monitor" as any,
        routePath: "mcp" as const,
        latencyMs: 200,
        success: false,
        costUsd: 0.03,
        timestamp: new Date(),
      };

      publisher.recordSupportModeOperation(metrics1);
      publisher.recordSupportModeOperation(metrics2);

      const summary = publisher.getSupportModeMetricsSummary();
      expect(summary.successRate).toBeGreaterThanOrEqual(0);
      expect(summary.successRate).toBeLessThanOrEqual(100);
    });

    it("should track total cost", () => {
      const metrics1 = {
        operationType: "infrastructure_audit" as any,
        routePath: "direct" as const,
        latencyMs: 150,
        success: true,
        costUsd: 0.05,
        timestamp: new Date(),
      };

      const metrics2 = {
        operationType: "meta_monitor" as any,
        routePath: "mcp" as const,
        latencyMs: 200,
        success: true,
        costUsd: 0.03,
        timestamp: new Date(),
      };

      publisher.recordSupportModeOperation(metrics1);
      publisher.recordSupportModeOperation(metrics2);

      const summary = publisher.getSupportModeMetricsSummary();
      expect(summary.totalCostUsd).toBeGreaterThan(0);
    });
  });
});
