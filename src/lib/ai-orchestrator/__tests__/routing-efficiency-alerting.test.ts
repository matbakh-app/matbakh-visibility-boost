/**
 * Tests for Routing Efficiency Alerting System
 */

import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { CloudWatchAlarmManager } from "../alerting/cloudwatch-alarm-manager";
import { PagerDutyIntegration } from "../alerting/pagerduty-integration";
import {
  AlertSeverity,
  RoutingEfficiencyAlertType,
  RoutingEfficiencyAlertingSystem,
  createRoutingEfficiencyAlertingSystem,
} from "../alerting/routing-efficiency-alerting";
import { SNSNotificationManager } from "../alerting/sns-notification-manager";
import { HybridHealthChecker } from "../health/hybrid-health-checker";
import { HybridRoutingPerformanceMonitor } from "../hybrid-routing-performance-monitor";

describe("RoutingEfficiencyAlertingSystem", () => {
  let alertingSystem: RoutingEfficiencyAlertingSystem;
  let mockAlarmManager: jest.Mocked<CloudWatchAlarmManager>;
  let mockNotificationManager: jest.Mocked<SNSNotificationManager>;
  let mockPagerDutyIntegration: jest.Mocked<PagerDutyIntegration>;
  let mockPerformanceMonitor: jest.Mocked<HybridRoutingPerformanceMonitor>;
  let mockHealthChecker: jest.Mocked<HybridHealthChecker>;

  beforeEach(() => {
    // Create mocks
    mockAlarmManager = {
      createAlarm: jest.fn().mockResolvedValue(undefined),
    } as any;

    mockNotificationManager = {
      sendNotification: jest.fn().mockResolvedValue(undefined),
    } as any;

    mockPagerDutyIntegration = {
      triggerIncident: jest.fn().mockResolvedValue(undefined),
    } as any;

    mockPerformanceMonitor = {
      getPerformanceMetrics: jest.fn().mockResolvedValue({
        averageLatency: 500,
        p95Latency: 800,
        successRate: 98,
        directBedrockUsage: 100,
        mcpUsage: 100,
        fallbackUsage: 5,
        totalOperations: 200,
        currentCost: 10,
        baselineCost: 10,
      }),
    } as any;

    mockHealthChecker = {
      checkHealth: jest.fn().mockResolvedValue({
        overallScore: 95,
        components: {
          "hybrid-router": { status: "healthy" },
          "bedrock-client": { status: "healthy" },
        },
      }),
    } as any;

    // Create alerting system
    alertingSystem = createRoutingEfficiencyAlertingSystem(
      mockAlarmManager,
      mockNotificationManager,
      mockPagerDutyIntegration,
      mockPerformanceMonitor,
      mockHealthChecker,
      {
        checkInterval: 100, // Fast interval for testing
      }
    );
  });

  describe("Initialization", () => {
    it("should create alerting system with default configuration", () => {
      expect(alertingSystem).toBeDefined();
      const config = alertingSystem.getConfiguration();
      expect(config.latencyThresholds).toBeDefined();
      expect(config.successRateThresholds).toBeDefined();
    });

    it("should create alerting system with custom configuration", () => {
      const customSystem = createRoutingEfficiencyAlertingSystem(
        mockAlarmManager,
        mockNotificationManager,
        mockPagerDutyIntegration,
        mockPerformanceMonitor,
        mockHealthChecker,
        {
          latencyThresholds: {
            warning: 500,
            error: 1000,
            critical: 2000,
          },
        }
      );

      const config = customSystem.getConfiguration();
      expect(config.latencyThresholds.warning).toBe(500);
    });
  });

  describe("Alert Generation", () => {
    it("should generate high latency alert when threshold exceeded", async () => {
      mockPerformanceMonitor.getPerformanceMetrics.mockResolvedValue({
        averageLatency: 3000,
        p95Latency: 6000, // Exceeds critical threshold (5000)
        successRate: 98,
        directBedrockUsage: 100,
        mcpUsage: 100,
        fallbackUsage: 5,
        totalOperations: 200,
        currentCost: 10,
        baselineCost: 10,
      });

      await alertingSystem.start();
      await new Promise((resolve) => setTimeout(resolve, 150));
      await alertingSystem.stop();

      const alerts = alertingSystem.getAllAlerts();
      expect(alerts.length).toBeGreaterThan(0);

      const latencyAlert = alerts.find(
        (a) => a.type === RoutingEfficiencyAlertType.HIGH_LATENCY
      );
      expect(latencyAlert).toBeDefined();
      expect(latencyAlert?.severity).toBe(AlertSeverity.CRITICAL);
    });

    it("should generate low success rate alert when threshold exceeded", async () => {
      mockPerformanceMonitor.getPerformanceMetrics.mockResolvedValue({
        averageLatency: 500,
        p95Latency: 800,
        successRate: 80, // Below critical threshold (85)
        directBedrockUsage: 100,
        mcpUsage: 100,
        fallbackUsage: 5,
        totalOperations: 200,
        currentCost: 10,
        baselineCost: 10,
      });

      await alertingSystem.start();
      await new Promise((resolve) => setTimeout(resolve, 150));
      await alertingSystem.stop();

      const alerts = alertingSystem.getAllAlerts();
      const successRateAlert = alerts.find(
        (a) => a.type === RoutingEfficiencyAlertType.LOW_SUCCESS_RATE
      );
      expect(successRateAlert).toBeDefined();
      expect(successRateAlert?.severity).toBe(AlertSeverity.CRITICAL);
    });

    it("should generate routing imbalance alert when threshold exceeded", async () => {
      mockPerformanceMonitor.getPerformanceMetrics.mockResolvedValue({
        averageLatency: 500,
        p95Latency: 800,
        successRate: 98,
        directBedrockUsage: 180, // 90% of traffic
        mcpUsage: 20, // 10% of traffic (80% imbalance)
        fallbackUsage: 5,
        totalOperations: 200,
        currentCost: 10,
        baselineCost: 10,
      });

      await alertingSystem.start();
      await new Promise((resolve) => setTimeout(resolve, 150));
      await alertingSystem.stop();

      const alerts = alertingSystem.getAllAlerts();
      const imbalanceAlert = alerts.find(
        (a) => a.type === RoutingEfficiencyAlertType.ROUTING_IMBALANCE
      );
      expect(imbalanceAlert).toBeDefined();
      expect(imbalanceAlert?.severity).toBe(AlertSeverity.CRITICAL);
    });

    it("should generate fallback overuse alert when threshold exceeded", async () => {
      mockPerformanceMonitor.getPerformanceMetrics.mockResolvedValue({
        averageLatency: 500,
        p95Latency: 800,
        successRate: 98,
        directBedrockUsage: 100,
        mcpUsage: 100,
        fallbackUsage: 100, // 50% fallback usage (exceeds critical threshold)
        totalOperations: 200,
        currentCost: 10,
        baselineCost: 10,
      });

      await alertingSystem.start();
      await new Promise((resolve) => setTimeout(resolve, 150));
      await alertingSystem.stop();

      const alerts = alertingSystem.getAllAlerts();
      const fallbackAlert = alerts.find(
        (a) => a.type === RoutingEfficiencyAlertType.FALLBACK_OVERUSE
      );
      expect(fallbackAlert).toBeDefined();
      expect(fallbackAlert?.severity).toBe(AlertSeverity.CRITICAL);
    });

    it("should generate cost anomaly alert when threshold exceeded", async () => {
      mockPerformanceMonitor.getPerformanceMetrics.mockResolvedValue({
        averageLatency: 500,
        p95Latency: 800,
        successRate: 98,
        directBedrockUsage: 100,
        mcpUsage: 100,
        fallbackUsage: 5,
        totalOperations: 200,
        currentCost: 25, // 150% increase
        baselineCost: 10,
      });

      await alertingSystem.start();
      await new Promise((resolve) => setTimeout(resolve, 150));
      await alertingSystem.stop();

      const alerts = alertingSystem.getAllAlerts();
      const costAlert = alerts.find(
        (a) => a.type === RoutingEfficiencyAlertType.COST_ANOMALY
      );
      expect(costAlert).toBeDefined();
      expect(costAlert?.severity).toBe(AlertSeverity.CRITICAL);
    });

    it("should generate health degradation alert when threshold exceeded", async () => {
      mockHealthChecker.checkHealth.mockResolvedValue({
        overallScore: 35, // Below critical threshold (40)
        components: {
          "hybrid-router": { status: "unhealthy" },
          "bedrock-client": { status: "degraded" },
        },
      });

      await alertingSystem.start();
      await new Promise((resolve) => setTimeout(resolve, 150));
      await alertingSystem.stop();

      const alerts = alertingSystem.getAllAlerts();
      const healthAlert = alerts.find(
        (a) => a.type === RoutingEfficiencyAlertType.HEALTH_DEGRADATION
      );
      expect(healthAlert).toBeDefined();
      expect(healthAlert?.severity).toBe(AlertSeverity.CRITICAL);
    });
  });

  describe("Notification Integration", () => {
    it("should send SNS notification for all alerts", async () => {
      mockPerformanceMonitor.getPerformanceMetrics.mockResolvedValue({
        averageLatency: 3000,
        p95Latency: 6000,
        successRate: 98,
        directBedrockUsage: 100,
        mcpUsage: 100,
        fallbackUsage: 5,
        totalOperations: 200,
        currentCost: 10,
        baselineCost: 10,
      });

      await alertingSystem.start();
      await new Promise((resolve) => setTimeout(resolve, 150));
      await alertingSystem.stop();

      expect(mockNotificationManager.sendNotification).toHaveBeenCalled();
    });

    it("should send PagerDuty incident for ERROR and CRITICAL alerts", async () => {
      mockPerformanceMonitor.getPerformanceMetrics.mockResolvedValue({
        averageLatency: 3000,
        p95Latency: 6000,
        successRate: 98,
        directBedrockUsage: 100,
        mcpUsage: 100,
        fallbackUsage: 5,
        totalOperations: 200,
        currentCost: 10,
        baselineCost: 10,
      });

      await alertingSystem.start();
      await new Promise((resolve) => setTimeout(resolve, 150));
      await alertingSystem.stop();

      expect(mockPagerDutyIntegration.triggerIncident).toHaveBeenCalled();
    });

    it("should create CloudWatch alarm for CRITICAL alerts", async () => {
      mockPerformanceMonitor.getPerformanceMetrics.mockResolvedValue({
        averageLatency: 3000,
        p95Latency: 6000,
        successRate: 98,
        directBedrockUsage: 100,
        mcpUsage: 100,
        fallbackUsage: 5,
        totalOperations: 200,
        currentCost: 10,
        baselineCost: 10,
      });

      await alertingSystem.start();
      await new Promise((resolve) => setTimeout(resolve, 150));
      await alertingSystem.stop();

      expect(mockAlarmManager.createAlarm).toHaveBeenCalled();
    });
  });

  describe("Alert Management", () => {
    it("should retrieve alert by ID", async () => {
      mockPerformanceMonitor.getPerformanceMetrics.mockResolvedValue({
        averageLatency: 3000,
        p95Latency: 6000,
        successRate: 98,
        directBedrockUsage: 100,
        mcpUsage: 100,
        fallbackUsage: 5,
        totalOperations: 200,
        currentCost: 10,
        baselineCost: 10,
      });

      await alertingSystem.start();
      await new Promise((resolve) => setTimeout(resolve, 150));
      await alertingSystem.stop();

      const alerts = alertingSystem.getAllAlerts();
      expect(alerts.length).toBeGreaterThan(0);

      const alert = alertingSystem.getAlert(alerts[0].id);
      expect(alert).toBeDefined();
      expect(alert?.id).toBe(alerts[0].id);
    });

    it("should retrieve alerts by type", async () => {
      mockPerformanceMonitor.getPerformanceMetrics.mockResolvedValue({
        averageLatency: 3000,
        p95Latency: 6000,
        successRate: 80,
        directBedrockUsage: 100,
        mcpUsage: 100,
        fallbackUsage: 5,
        totalOperations: 200,
        currentCost: 10,
        baselineCost: 10,
      });

      await alertingSystem.start();
      await new Promise((resolve) => setTimeout(resolve, 150));
      await alertingSystem.stop();

      const latencyAlerts = alertingSystem.getAlertsByType(
        RoutingEfficiencyAlertType.HIGH_LATENCY
      );
      expect(latencyAlerts.length).toBeGreaterThan(0);
    });

    it("should retrieve alerts by severity", async () => {
      mockPerformanceMonitor.getPerformanceMetrics.mockResolvedValue({
        averageLatency: 3000,
        p95Latency: 6000,
        successRate: 98,
        directBedrockUsage: 100,
        mcpUsage: 100,
        fallbackUsage: 5,
        totalOperations: 200,
        currentCost: 10,
        baselineCost: 10,
      });

      await alertingSystem.start();
      await new Promise((resolve) => setTimeout(resolve, 150));
      await alertingSystem.stop();

      const criticalAlerts = alertingSystem.getAlertsBySeverity(
        AlertSeverity.CRITICAL
      );
      expect(criticalAlerts.length).toBeGreaterThan(0);
    });

    it("should clear old alerts", async () => {
      mockPerformanceMonitor.getPerformanceMetrics.mockResolvedValue({
        averageLatency: 3000,
        p95Latency: 6000,
        successRate: 98,
        directBedrockUsage: 100,
        mcpUsage: 100,
        fallbackUsage: 5,
        totalOperations: 200,
        currentCost: 10,
        baselineCost: 10,
      });

      await alertingSystem.start();
      await new Promise((resolve) => setTimeout(resolve, 150));
      await alertingSystem.stop();

      const alertsBefore = alertingSystem.getAllAlerts();
      expect(alertsBefore.length).toBeGreaterThan(0);

      alertingSystem.clearOldAlerts(0); // Clear all alerts

      const alertsAfter = alertingSystem.getAllAlerts();
      expect(alertsAfter.length).toBe(0);
    });
  });

  describe("Statistics", () => {
    it("should track alert statistics", async () => {
      mockPerformanceMonitor.getPerformanceMetrics.mockResolvedValue({
        averageLatency: 3000,
        p95Latency: 6000,
        successRate: 80,
        directBedrockUsage: 100,
        mcpUsage: 100,
        fallbackUsage: 5,
        totalOperations: 200,
        currentCost: 10,
        baselineCost: 10,
      });

      await alertingSystem.start();
      await new Promise((resolve) => setTimeout(resolve, 150));
      await alertingSystem.stop();

      const stats = alertingSystem.getStatistics();
      expect(stats.totalAlerts).toBeGreaterThan(0);
      expect(stats.alertsByType.size).toBeGreaterThan(0);
      expect(stats.alertsBySeverity.size).toBeGreaterThan(0);
      expect(stats.lastAlertTime).toBeDefined();
    });
  });

  describe("Configuration Management", () => {
    it("should update configuration", () => {
      const newConfig = {
        latencyThresholds: {
          warning: 500,
          error: 1000,
          critical: 2000,
        },
      };

      alertingSystem.updateConfiguration(newConfig);

      const config = alertingSystem.getConfiguration();
      expect(config.latencyThresholds.warning).toBe(500);
    });

    it("should get current configuration", () => {
      const config = alertingSystem.getConfiguration();
      expect(config).toBeDefined();
      expect(config.latencyThresholds).toBeDefined();
      expect(config.successRateThresholds).toBeDefined();
      expect(config.routingImbalanceThresholds).toBeDefined();
    });
  });

  describe("Lifecycle Management", () => {
    it("should start and stop alerting system", async () => {
      await alertingSystem.start();
      await new Promise((resolve) => setTimeout(resolve, 50));
      await alertingSystem.stop();

      expect(mockPerformanceMonitor.getPerformanceMetrics).toHaveBeenCalled();
      expect(mockHealthChecker.checkHealth).toHaveBeenCalled();
    });

    it("should not start if already running", async () => {
      await alertingSystem.start();
      await alertingSystem.start(); // Second start should be ignored
      await alertingSystem.stop();

      // Should only call once per interval
      expect(mockPerformanceMonitor.getPerformanceMetrics).toHaveBeenCalled();
    });

    it("should not stop if not running", async () => {
      await alertingSystem.stop(); // Stop without start should be safe
      expect(true).toBe(true); // Should not throw
    });
  });
});
