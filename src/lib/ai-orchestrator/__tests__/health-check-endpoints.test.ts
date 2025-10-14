// ✅ ESM-compatible import for Jest
// Jest imports everything as default object
import HealthCheckEndpointsDefault from "../health-check-endpoints";

// Extract class and function from default export
const HealthCheckEndpoints =
  (HealthCheckEndpointsDefault as any).HealthCheckEndpoints ||
  HealthCheckEndpointsDefault;
const createHealthCheckEndpoints = (HealthCheckEndpointsDefault as any)
  .createHealthCheckEndpoints;

import {
  HealthComponent,
  HealthStatus,
  HybridHealthChecker,
} from "../health/hybrid-health-checker";
import { HybridRoutingPerformanceMonitor } from "../hybrid-routing-performance-monitor";
import { HybridLogAggregator } from "../logging/hybrid-log-aggregator";

describe("HealthCheckEndpoints", () => {
  let healthCheckEndpoints: any;
  let mockHealthChecker: jest.Mocked<HybridHealthChecker>;
  let mockPerformanceMonitor: jest.Mocked<HybridRoutingPerformanceMonitor>;
  let mockLogAggregator: jest.Mocked<HybridLogAggregator>;

  beforeEach(() => {
    mockHealthChecker = {
      checkHealth: jest.fn(),
    } as any;

    mockPerformanceMonitor = {
      getMetrics: jest.fn(),
    } as any;

    mockLogAggregator = {} as any;

    healthCheckEndpoints = new HealthCheckEndpoints(
      mockHealthChecker,
      mockPerformanceMonitor,
      mockLogAggregator,
      "1.0.0"
    );
  });

  describe("getBasicHealth", () => {
    it("should return basic health status", async () => {
      mockHealthChecker.checkHealth.mockResolvedValue({
        status: HealthStatus.HEALTHY,
        message: "Component is healthy",
        lastCheck: new Date(),
        details: {},
      });

      const result = await healthCheckEndpoints.getBasicHealth();

      expect(result.status).toBe("healthy");
      expect(result.version).toBe("1.0.0");
      expect(result.uptime).toBeGreaterThanOrEqual(0);
      expect(result.checks).toBeDefined();
      expect(Object.keys(result.checks).length).toBeGreaterThan(0);
    });

    it("should return degraded status when component is degraded", async () => {
      mockHealthChecker.checkHealth
        .mockResolvedValueOnce({
          status: HealthStatus.HEALTHY,
          message: "Healthy",
          lastCheck: new Date(),
          details: {},
        })
        .mockResolvedValueOnce({
          status: HealthStatus.DEGRADED,
          message: "Degraded",
          lastCheck: new Date(),
          details: {},
        });

      const result = await healthCheckEndpoints.getBasicHealth();

      expect(result.status).toBe("degraded");
    });

    it("should return unhealthy status when component is unhealthy", async () => {
      mockHealthChecker.checkHealth.mockResolvedValue({
        status: HealthStatus.UNHEALTHY,
        message: "Component is unhealthy",
        lastCheck: new Date(),
        details: {},
      });

      const result = await healthCheckEndpoints.getBasicHealth();

      expect(result.status).toBe("unhealthy");
    });

    it("should include response time for each component", async () => {
      mockHealthChecker.checkHealth.mockResolvedValue({
        status: HealthStatus.HEALTHY,
        message: "Healthy",
        lastCheck: new Date(),
        details: {},
      });

      const result = await healthCheckEndpoints.getBasicHealth();

      Object.values(result.checks).forEach((check) => {
        expect(check.responseTime).toBeDefined();
        expect(typeof check.responseTime).toBe("number");
      });
    });
  });

  describe("getDetailedHealth", () => {
    beforeEach(() => {
      mockHealthChecker.checkHealth.mockResolvedValue({
        status: HealthStatus.HEALTHY,
        message: "Healthy",
        lastCheck: new Date(),
        details: {},
      });

      mockPerformanceMonitor.getMetrics.mockResolvedValue({
        responseTime: { p50: 100, p95: 200, p99: 300 },
        throughput: 1000,
        errorRate: 0.01,
      } as any);
    });

    it("should return detailed health with performance metrics", async () => {
      const result = await healthCheckEndpoints.getDetailedHealth();

      expect(result.performance).toBeDefined();
      expect(result.performance.responseTime.p50).toBe(100);
      expect(result.performance.responseTime.p95).toBe(200);
      expect(result.performance.responseTime.p99).toBe(300);
      expect(result.performance.throughput).toBe(1000);
      expect(result.performance.errorRate).toBe(0.01);
    });

    it("should return detailed health with resource utilization", async () => {
      const result = await healthCheckEndpoints.getDetailedHealth();

      expect(result.resources).toBeDefined();
      expect(result.resources.cpu).toBeDefined();
      expect(result.resources.memory).toBeDefined();
      expect(result.resources.connections).toBeDefined();
    });

    it("should return detailed health with dependency status", async () => {
      const result = await healthCheckEndpoints.getDetailedHealth();

      expect(result.dependencies).toBeDefined();
      expect(result.dependencies["bedrock-api"]).toBeDefined();
      expect(result.dependencies["bedrock-api"].status).toBe("healthy");
    });

    it("should respect configuration options", async () => {
      const result = await healthCheckEndpoints.getDetailedHealth({
        includePerformance: false,
        includeResources: false,
        includeDependencies: false,
      });

      expect(result.performance.throughput).toBe(0);
      expect(result.resources.cpu).toBe(0);
      expect(Object.keys(result.dependencies).length).toBe(0);
    });
  });

  describe("getComponentHealth", () => {
    it("should return health for specific component", async () => {
      const mockHealth = {
        status: HealthStatus.HEALTHY,
        message: "Component is healthy",
        lastCheck: new Date(),
        details: { test: "data" },
      };

      mockHealthChecker.checkHealth.mockResolvedValue(mockHealth);

      const result = await healthCheckEndpoints.getComponentHealth(
        HealthComponent.HYBRID_ROUTER
      );

      expect(result.status).toBe("healthy");
      expect(result.message).toBe("Component is healthy");
      expect(result.responseTime).toBeDefined();
      expect(result.details).toEqual({ test: "data" });
    });
  });

  describe("getReadiness", () => {
    it("should return ready when all critical components are healthy", async () => {
      mockHealthChecker.checkHealth.mockResolvedValue({
        status: HealthStatus.HEALTHY,
        message: "Healthy",
        lastCheck: new Date(),
        details: {},
      });

      const result = await healthCheckEndpoints.getReadiness();

      expect(result.ready).toBe(true);
      expect(result.message).toBeUndefined();
    });

    it("should return not ready when critical component is unhealthy", async () => {
      mockHealthChecker.checkHealth.mockResolvedValue({
        status: HealthStatus.UNHEALTHY,
        message: "Component failed",
        lastCheck: new Date(),
        details: {},
      });

      const result = await healthCheckEndpoints.getReadiness();

      expect(result.ready).toBe(false);
      expect(result.message).toContain("unhealthy");
    });

    it("should handle errors gracefully", async () => {
      mockHealthChecker.checkHealth.mockRejectedValue(
        new Error("Check failed")
      );

      const result = await healthCheckEndpoints.getReadiness();

      expect(result.ready).toBe(false);
      expect(result.message).toContain("Readiness check failed");
    });
  });

  describe("getLiveness", () => {
    it("should return alive when system is responding", async () => {
      const result = await healthCheckEndpoints.getLiveness();

      expect(result.alive).toBe(true);
      expect(result.message).toBeUndefined();
    });

    it("should handle errors gracefully", async () => {
      // Mock a slow response by making the check throw
      jest.spyOn(Date, "now").mockImplementation(() => {
        throw new Error("System error");
      });

      const result = await healthCheckEndpoints.getLiveness();

      expect(result.alive).toBe(false);
      expect(result.message).toContain("Liveness check failed");

      jest.restoreAllMocks();
    });
  });

  describe("getStatusPage", () => {
    it("should return operational status when all components are healthy", async () => {
      mockHealthChecker.checkHealth.mockResolvedValue({
        status: HealthStatus.HEALTHY,
        message: "Healthy",
        lastCheck: new Date(),
        details: {},
      });

      const result = await healthCheckEndpoints.getStatusPage();

      expect(result.status).toBe("operational");
      expect(result.components.length).toBeGreaterThan(0);
      expect(result.components.every((c) => c.status === "operational")).toBe(
        true
      );
    });

    it("should return degraded status when component is degraded", async () => {
      mockHealthChecker.checkHealth
        .mockResolvedValueOnce({
          status: HealthStatus.HEALTHY,
          message: "Healthy",
          lastCheck: new Date(),
          details: {},
        })
        .mockResolvedValueOnce({
          status: HealthStatus.DEGRADED,
          message: "Degraded",
          lastCheck: new Date(),
          details: {},
        });

      const result = await healthCheckEndpoints.getStatusPage();

      expect(result.status).toBe("degraded");
    });

    it("should return outage status when component is unhealthy", async () => {
      mockHealthChecker.checkHealth.mockResolvedValue({
        status: HealthStatus.UNHEALTHY,
        message: "Unhealthy",
        lastCheck: new Date(),
        details: {},
      });

      const result = await healthCheckEndpoints.getStatusPage();

      expect(result.status).toBe("outage");
    });

    it("should format component names properly", async () => {
      mockHealthChecker.checkHealth.mockResolvedValue({
        status: HealthStatus.HEALTHY,
        message: "Healthy",
        lastCheck: new Date(),
        details: {},
      });

      const result = await healthCheckEndpoints.getStatusPage();

      result.components.forEach((component) => {
        expect(component.name).toMatch(/^[A-Z]/); // Should start with capital letter
        expect(component.name).not.toContain("-"); // Should not contain hyphens
      });
    });
  });

  describe("createHealthCheckEndpoints", () => {
    it("should create health check endpoints instance", () => {
      const instance = createHealthCheckEndpoints(
        mockHealthChecker,
        mockPerformanceMonitor,
        mockLogAggregator,
        "2.0.0"
      );

      expect(instance).toBeInstanceOf(HealthCheckEndpoints);
    });

    it("should use default version if not provided", () => {
      const instance = createHealthCheckEndpoints(
        mockHealthChecker,
        mockPerformanceMonitor,
        mockLogAggregator
      );

      expect(instance).toBeInstanceOf(HealthCheckEndpoints);
    });
  });
});
