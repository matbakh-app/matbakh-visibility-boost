/**
 * Tests for SLO Monitoring Service
 */

import { SLODefinition, SLOMonitoringService } from "../slo-monitoring-service";

// Mock the monitoring dependencies
jest.mock("@/lib/ai-orchestrator/p95-latency-monitor", () => ({
  p95LatencyMonitor: {
    getPerformanceStatus: jest.fn(() => ({
      p95Latencies: { generation: 1200, rag: 280, cached: 45 },
      cacheHitRate: 85.5,
      activeRequests: 5,
      targetsStatus: { generation: true, rag: true, cached: true },
      alertsLast24h: 2,
      performanceGrade: "A",
    })),
    getPerformanceReport: jest.fn(() => ({
      status: {
        p95Latencies: { generation: 1200, rag: 280, cached: 45 },
        cacheHitRate: 85.5,
        activeRequests: 5,
        targetsStatus: { generation: true, rag: true, cached: true },
        alertsLast24h: 2,
        performanceGrade: "A",
      },
      averageLatencies: { generation: 800, rag: 150, cached: 25 },
      maxLatencies: { generation: 2000, rag: 500, cached: 100 },
      requestCounts: { generation: 100, rag: 200, cached: 300 },
      totalCost: 12.5,
      recentAlerts: [],
    })),
  },
}));

jest.mock("@/lib/ai-orchestrator/slo-burn-rate-alerts", () => ({
  sloBurnRateAlerts: {
    getSLOStatus: jest.fn(() => [
      {
        slo: { name: "Generation P95", route: "generation" },
        currentGoodRatio: 0.96,
        burnRate: 1.2,
        status: "healthy",
      },
    ]),
    getActiveAlerts: jest.fn(() => []),
  },
}));

jest.mock("@/lib/performance-monitoring", () => ({
  performanceMonitoring: {
    getPerformanceSummary: jest.fn(() => ({
      metrics: {
        LCP: { value: 1200, rating: "good" },
        FID: { value: 45, rating: "good" },
        CLS: { value: 0.05, rating: "good" },
      },
      alerts: 0,
      score: 92,
    })),
    getAlerts: jest.fn(() => []),
  },
}));

describe("SLOMonitoringService", () => {
  let service: SLOMonitoringService;

  beforeEach(() => {
    service = new SLOMonitoringService();
    // Stop monitoring to prevent interference with tests
    service.stopMonitoring();
  });

  afterEach(() => {
    service.stopMonitoring();
  });

  describe("SLO Definitions", () => {
    it("should initialize with default SLO definitions", () => {
      const definitions = service.getSLODefinitions();
      expect(definitions.length).toBeGreaterThan(0);

      // Check for key SLOs
      const generationSLO = definitions.find(
        (slo) => slo.id === "p95-generation-latency"
      );
      expect(generationSLO).toBeDefined();
      expect(generationSLO?.name).toBe("Generation P95 Latency");
      expect(generationSLO?.target).toBe(1500);
      expect(generationSLO?.unit).toBe("ms");
    });

    it("should allow adding custom SLO definitions", () => {
      const customSLO: SLODefinition = {
        id: "custom-test-slo",
        name: "Custom Test SLO",
        description: "Test SLO for unit tests",
        category: "performance",
        metric: "test_metric",
        target: 100,
        unit: "ms",
        operator: "lte",
        errorBudget: 5,
        alertThresholds: { warning: 120, critical: 150 },
        burnRateThresholds: {
          warning: { short: 3, long: 1.5 },
          critical: { short: 6, long: 3 },
        },
        enabled: true,
        tags: ["test"],
      };

      service.setSLODefinition(customSLO);
      const retrieved = service.getSLODefinition("custom-test-slo");
      expect(retrieved).toEqual(customSLO);
    });

    it("should allow removing SLO definitions", () => {
      const customSLO: SLODefinition = {
        id: "removable-slo",
        name: "Removable SLO",
        description: "SLO to be removed",
        category: "performance",
        metric: "removable_metric",
        target: 50,
        unit: "ms",
        operator: "lte",
        errorBudget: 5,
        alertThresholds: { warning: 60, critical: 80 },
        burnRateThresholds: {
          warning: { short: 3, long: 1.5 },
          critical: { short: 6, long: 3 },
        },
        enabled: true,
        tags: ["removable"],
      };

      service.setSLODefinition(customSLO);
      expect(service.getSLODefinition("removable-slo")).toBeDefined();

      const removed = service.removeSLODefinition("removable-slo");
      expect(removed).toBe(true);
      expect(service.getSLODefinition("removable-slo")).toBeUndefined();
    });
  });

  describe("SLO Status Evaluation", () => {
    it("should evaluate SLO compliance correctly", () => {
      // Add a test metric and evaluate
      const testSLO: SLODefinition = {
        id: "test-compliance-slo",
        name: "Test Compliance SLO",
        description: "Test SLO for compliance evaluation",
        category: "performance",
        metric: "test_compliance_metric",
        target: 100,
        unit: "ms",
        operator: "lte",
        errorBudget: 5,
        alertThresholds: { warning: 120, critical: 150 },
        burnRateThresholds: {
          warning: { short: 3, long: 1.5 },
          critical: { short: 6, long: 3 },
        },
        enabled: true,
        tags: ["test"],
      };

      service.setSLODefinition(testSLO);

      // Simulate metric collection by directly calling the private method
      // In a real scenario, this would be done through the monitoring loop
      (service as any).recordMetric("test_compliance_metric", 80); // Good value
      (service as any).recordMetric("test_compliance_metric", 90); // Good value
      (service as any).recordMetric("test_compliance_metric", 130); // Bad value (exceeds target)

      // Trigger evaluation
      (service as any).evaluateSLOs();

      const status = service.getSLOStatus("test-compliance-slo");
      expect(status).toBeDefined();
      expect(status?.sloId).toBe("test-compliance-slo");
      expect(status?.currentValue).toBe(130); // Latest value
      expect(status?.targetValue).toBe(100);
      expect(status?.status).toBe("warning"); // Should be warning due to exceeding warning threshold
    });

    it("should calculate burn rates correctly", () => {
      const testSLO: SLODefinition = {
        id: "burn-rate-test-slo",
        name: "Burn Rate Test SLO",
        description: "Test SLO for burn rate calculation",
        category: "performance",
        metric: "burn_rate_test_metric",
        target: 100,
        unit: "ms",
        operator: "lte",
        errorBudget: 5,
        alertThresholds: { warning: 120, critical: 150 },
        burnRateThresholds: {
          warning: { short: 3, long: 1.5 },
          critical: { short: 6, long: 3 },
        },
        enabled: true,
        tags: ["test"],
      };

      service.setSLODefinition(testSLO);

      // Add multiple metrics to calculate burn rate
      for (let i = 0; i < 10; i++) {
        (service as any).recordMetric(
          "burn_rate_test_metric",
          i < 7 ? 80 : 130
        ); // 70% compliance
      }

      (service as any).evaluateSLOs();

      const status = service.getSLOStatus("burn-rate-test-slo");
      expect(status).toBeDefined();
      expect(status?.burnRate.short).toBeGreaterThan(0);
      expect(status?.burnRate.long).toBeGreaterThan(0);
    });
  });

  describe("Alert Management", () => {
    it("should create alerts for SLO violations", () => {
      const testSLO: SLODefinition = {
        id: "alert-test-slo",
        name: "Alert Test SLO",
        description: "Test SLO for alert generation",
        category: "performance",
        metric: "alert_test_metric",
        target: 100,
        unit: "ms",
        operator: "lte",
        errorBudget: 5,
        alertThresholds: { warning: 120, critical: 150 },
        burnRateThresholds: {
          warning: { short: 3, long: 1.5 },
          critical: { short: 6, long: 3 },
        },
        enabled: true,
        tags: ["test"],
      };

      service.setSLODefinition(testSLO);

      // Record a critical value
      (service as any).recordMetric("alert_test_metric", 160);
      (service as any).evaluateSLOs();
      (service as any).checkAlerts();

      const alerts = service.getActiveAlerts();
      expect(alerts.length).toBeGreaterThan(0);

      const violationAlert = alerts.find(
        (alert) =>
          alert.sloId === "alert-test-slo" && alert.type === "violation"
      );
      expect(violationAlert).toBeDefined();
      expect(violationAlert?.severity).toBe("critical");
    });

    it("should resolve alerts", () => {
      const testSLO: SLODefinition = {
        id: "resolve-test-slo",
        name: "Resolve Test SLO",
        description: "Test SLO for alert resolution",
        category: "performance",
        metric: "resolve_test_metric",
        target: 100,
        unit: "ms",
        operator: "lte",
        errorBudget: 5,
        alertThresholds: { warning: 120, critical: 150 },
        burnRateThresholds: {
          warning: { short: 3, long: 1.5 },
          critical: { short: 6, long: 3 },
        },
        enabled: true,
        tags: ["test"],
      };

      service.setSLODefinition(testSLO);

      // Create an alert
      (service as any).recordMetric("resolve_test_metric", 160);
      (service as any).evaluateSLOs();
      (service as any).checkAlerts();

      const activeAlerts = service.getActiveAlerts();
      expect(activeAlerts.length).toBeGreaterThan(0);

      const alertToResolve = activeAlerts[0];
      const resolved = service.resolveAlert(alertToResolve.id);
      expect(resolved).toBe(true);

      const updatedActiveAlerts = service.getActiveAlerts();
      expect(updatedActiveAlerts.length).toBe(activeAlerts.length - 1);
    });
  });

  describe("Report Generation", () => {
    it("should generate comprehensive SLO reports", () => {
      const report = service.generateReport();

      expect(report).toBeDefined();
      expect(report.period).toBeDefined();
      expect(report.period.start).toBeInstanceOf(Date);
      expect(report.period.end).toBeInstanceOf(Date);

      expect(report.summary).toBeDefined();
      expect(typeof report.summary.totalSLOs).toBe("number");
      expect(typeof report.summary.overallCompliance).toBe("number");

      expect(Array.isArray(report.sloStatuses)).toBe(true);
      expect(Array.isArray(report.alerts)).toBe(true);
      expect(report.trends).toBeDefined();
    });

    it("should generate reports for custom time periods", () => {
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
      const endDate = new Date();

      const report = service.generateReport(startDate, endDate);

      expect(report.period.start).toEqual(startDate);
      expect(report.period.end).toEqual(endDate);
    });
  });

  describe("System Health Summary", () => {
    it("should provide system health summary", () => {
      const healthSummary = service.getSystemHealthSummary();

      expect(healthSummary).toBeDefined();
      expect(["healthy", "degraded", "critical"]).toContain(
        healthSummary.overall
      );
      expect(typeof healthSummary.sloCompliance).toBe("number");
      expect(typeof healthSummary.activeAlerts).toBe("number");
      expect(typeof healthSummary.criticalAlerts).toBe("number");
      expect(Array.isArray(healthSummary.services)).toBe(true);
    });
  });

  describe("Event Emission", () => {
    it("should emit events for SLO status changes", () => {
      const testSLO: SLODefinition = {
        id: "event-test-slo",
        name: "Event Test SLO",
        description: "Test SLO for event emission",
        category: "performance",
        metric: "event_test_metric",
        target: 100,
        unit: "ms",
        operator: "lte",
        errorBudget: 5,
        alertThresholds: { warning: 120, critical: 150 },
        burnRateThresholds: {
          warning: { short: 3, long: 1.5 },
          critical: { short: 6, long: 3 },
        },
        enabled: true,
        tags: ["test"],
      };

      service.setSLODefinition(testSLO);

      let eventEmitted = false;
      service.on("sloStatusChange", (event) => {
        eventEmitted = true;
        expect(event.sloId).toBe("event-test-slo");
        expect(event.currentStatus).toBeDefined();
      });

      // Record a metric to trigger status change
      (service as any).recordMetric("event_test_metric", 80);
      (service as any).evaluateSLOs();

      // The event should be emitted when status changes
      expect(eventEmitted).toBe(true);
    });

    it("should emit events for alerts", () => {
      const testSLO: SLODefinition = {
        id: "alert-event-test-slo",
        name: "Alert Event Test SLO",
        description: "Test SLO for alert event emission",
        category: "performance",
        metric: "alert_event_test_metric",
        target: 100,
        unit: "ms",
        operator: "lte",
        errorBudget: 5,
        alertThresholds: { warning: 120, critical: 150 },
        burnRateThresholds: {
          warning: { short: 3, long: 1.5 },
          critical: { short: 6, long: 3 },
        },
        enabled: true,
        tags: ["test"],
      };

      service.setSLODefinition(testSLO);

      let alertEmitted = false;
      let emittedAlert: any = null;
      service.on("alert", (alert) => {
        if (alert.sloId === "alert-event-test-slo") {
          alertEmitted = true;
          emittedAlert = alert;
        }
      });

      // Record a critical value to trigger alert
      (service as any).recordMetric("alert_event_test_metric", 160);
      (service as any).evaluateSLOs();
      (service as any).checkAlerts();

      // The alert event should be emitted
      expect(alertEmitted).toBe(true);
      expect(emittedAlert).toBeDefined();
      expect(emittedAlert.sloId).toBe("alert-event-test-slo");
      expect(emittedAlert.type).toBe("violation");
      expect(emittedAlert.severity).toBe("critical");
    });
  });
});
