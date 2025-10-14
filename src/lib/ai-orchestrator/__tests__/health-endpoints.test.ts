/**
 * Health Endpoints Tests
 *
 * Comprehensive test suite for Health Check REST API endpoints
 */

import { Request, Response } from "express";
import { HealthEndpoints } from "../health/health-endpoints";
import {
  HealthComponent,
  HealthStatus,
  HybridHealthChecker,
} from "../health/hybrid-health-checker";

describe("HealthEndpoints", () => {
  let healthChecker: HybridHealthChecker;
  let healthEndpoints: HealthEndpoints;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseData: any;
  let responseStatus: number;

  beforeEach(() => {
    healthChecker = new HybridHealthChecker();
    healthEndpoints = new HealthEndpoints(healthChecker, "1.0.0", "test");

    responseData = null;
    responseStatus = 200;

    mockRequest = {
      params: {},
      headers: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockImplementation((data) => {
        responseData = data;
        return mockResponse;
      }),
      setHeader: jest.fn(),
      send: jest.fn().mockImplementation((data) => {
        responseData = data;
        return mockResponse;
      }),
    };

    // Register default healthy component
    healthChecker.registerHealthCheck(
      HealthComponent.HYBRID_ROUTER,
      jest.fn().mockResolvedValue({
        status: HealthStatus.HEALTHY,
        message: "Router operational",
      })
    );
  });

  afterEach(() => {
    healthChecker.stop();
  });

  describe("Basic Health Endpoint", () => {
    it("should return healthy status", async () => {
      await healthEndpoints.basicHealth(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseData).toMatchObject({
        status: expect.any(String),
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        version: "1.0.0",
        environment: "test",
      });
    });

    it("should return 503 for critical status", async () => {
      healthChecker.registerHealthCheck(
        HealthComponent.BEDROCK_CLIENT,
        jest.fn().mockRejectedValue(new Error("Critical failure"))
      );

      await healthChecker.checkHealth(HealthComponent.BEDROCK_CLIENT);

      await healthEndpoints.basicHealth(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(503);
    });

    it("should handle errors gracefully", async () => {
      // Force an error by stopping the health checker
      healthChecker.stop();

      await healthEndpoints.basicHealth(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(503);
      expect(responseData).toHaveProperty("error");
    });
  });

  describe("Detailed Health Endpoint", () => {
    it("should return detailed health information", async () => {
      await healthChecker.checkHealth(HealthComponent.HYBRID_ROUTER);

      await healthEndpoints.detailedHealth(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseData).toMatchObject({
        status: expect.any(String),
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        components: expect.any(Object),
        summary: expect.objectContaining({
          healthy: expect.any(Number),
          degraded: expect.any(Number),
          unhealthy: expect.any(Number),
          critical: expect.any(Number),
          unknown: expect.any(Number),
        }),
        alerts: expect.any(Array),
      });
    });

    it("should include component details", async () => {
      await healthChecker.checkHealth(HealthComponent.HYBRID_ROUTER);

      await healthEndpoints.detailedHealth(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(responseData.components).toHaveProperty(
        HealthComponent.HYBRID_ROUTER
      );
      const routerHealth =
        responseData.components[HealthComponent.HYBRID_ROUTER];
      expect(routerHealth).toMatchObject({
        status: expect.any(String),
        timestamp: expect.any(String),
        responseTime: expect.any(Number),
        message: expect.any(String),
      });
    });
  });

  describe("Component Health Endpoint", () => {
    it("should return health for specific component", async () => {
      mockRequest.params = { componentName: HealthComponent.HYBRID_ROUTER };

      await healthEndpoints.componentHealth(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseData.data).toMatchObject({
        component: HealthComponent.HYBRID_ROUTER,
        responseTime: expect.any(Number),
        message: expect.any(String),
      });
    });

    it("should return 400 for invalid component name", async () => {
      mockRequest.params = { componentName: "invalid-component" };

      await healthEndpoints.componentHealth(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(responseData).toHaveProperty("error");
    });

    it("should perform immediate health check", async () => {
      const mockHealthCheck = jest.fn().mockResolvedValue({
        status: HealthStatus.HEALTHY,
        message: "Immediate check",
      });

      healthChecker.registerHealthCheck(
        HealthComponent.SUPPORT_MANAGER,
        mockHealthCheck
      );

      mockRequest.params = { componentName: HealthComponent.SUPPORT_MANAGER };

      await healthEndpoints.componentHealth(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockHealthCheck).toHaveBeenCalled();
    });
  });

  describe("Readiness Probe", () => {
    it("should return ready when no critical components", async () => {
      await healthEndpoints.readinessProbe(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseData.data.ready).toBe(true);
    });

    it("should return not ready when critical components exist", async () => {
      healthChecker.registerHealthCheck(
        HealthComponent.DATABASE,
        jest.fn().mockRejectedValue(new Error("Database down"))
      );

      await healthChecker.checkHealth(HealthComponent.DATABASE);

      await healthEndpoints.readinessProbe(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(503);
      expect(responseData.data.ready).toBe(false);
    });
  });

  describe("Liveness Probe", () => {
    it("should always return alive", async () => {
      await healthEndpoints.livenessProbe(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseData.data.alive).toBe(true);
      expect(responseData.data).toHaveProperty("pid");
      expect(responseData.data).toHaveProperty("memory");
    });
  });

  describe("Health Metrics Endpoint", () => {
    it("should return health metrics", async () => {
      await healthChecker.checkHealth(HealthComponent.HYBRID_ROUTER);

      await healthEndpoints.healthMetrics(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseData.data).toMatchObject({
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        components: expect.objectContaining({
          total: expect.any(Number),
          healthy: expect.any(Number),
          degraded: expect.any(Number),
          unhealthy: expect.any(Number),
          critical: expect.any(Number),
          unknown: expect.any(Number),
        }),
        alerts: expect.objectContaining({
          active: expect.any(Number),
          critical: expect.any(Number),
          high: expect.any(Number),
          medium: expect.any(Number),
          low: expect.any(Number),
        }),
        performance: expect.objectContaining({
          averageResponseTime: expect.any(Number),
          maxResponseTime: expect.any(Number),
          minResponseTime: expect.any(Number),
        }),
      });
    });
  });

  describe("Health Alerts Endpoint", () => {
    it("should return active alerts", async () => {
      healthChecker.registerHealthCheck(
        HealthComponent.CACHE_LAYER,
        jest.fn().mockRejectedValue(new Error("Cache failure"))
      );

      await healthChecker.checkHealth(HealthComponent.CACHE_LAYER);

      await healthEndpoints.healthAlerts(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseData.data).toHaveProperty("activeAlerts");
      expect(responseData.data).toHaveProperty("alerts");
      expect(Array.isArray(responseData.data.alerts)).toBe(true);
    });

    it("should return empty alerts when all healthy", async () => {
      await healthEndpoints.healthAlerts(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseData.data.activeAlerts).toBe(0);
      expect(responseData.data.alerts).toHaveLength(0);
    });
  });

  describe("Resolve Alert Endpoint", () => {
    it("should resolve alert successfully", async () => {
      healthChecker.registerHealthCheck(
        HealthComponent.CIRCUIT_BREAKER,
        jest.fn().mockRejectedValue(new Error("Circuit open"))
      );

      await healthChecker.checkHealth(HealthComponent.CIRCUIT_BREAKER);

      const alerts = healthChecker.getActiveAlerts();
      expect(alerts.length).toBeGreaterThan(0);

      mockRequest.params = { alertId: alerts[0].id };

      await healthEndpoints.resolveAlert(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseData.data.resolved).toBe(true);
    });

    it("should return 404 for non-existent alert", async () => {
      mockRequest.params = { alertId: "non-existent-alert-id" };

      await healthEndpoints.resolveAlert(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(responseData).toHaveProperty("error");
    });
  });

  describe("HTTP Status Code Mapping", () => {
    it("should return 200 for healthy status", async () => {
      await healthEndpoints.basicHealth(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it("should return 200 for degraded status", async () => {
      healthChecker.registerHealthCheck(
        HealthComponent.METRICS_PUBLISHER,
        jest.fn().mockResolvedValue({
          status: HealthStatus.DEGRADED,
          message: "Slow performance",
        })
      );

      await healthChecker.checkHealth(HealthComponent.METRICS_PUBLISHER);

      await healthEndpoints.basicHealth(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it("should return 503 for unhealthy status", async () => {
      healthChecker.registerHealthCheck(
        HealthComponent.LOG_AGGREGATOR,
        jest.fn().mockResolvedValue({
          status: HealthStatus.UNHEALTHY,
          message: "Service degraded",
        })
      );

      await healthChecker.checkHealth(HealthComponent.LOG_AGGREGATOR);

      await healthEndpoints.basicHealth(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(503);
    });
  });

  describe("Error Handling", () => {
    it("should handle unexpected errors in basic health", async () => {
      // Create a scenario that causes an error
      const brokenHealthChecker = {
        getSystemHealth: jest.fn().mockImplementation(() => {
          throw new Error("Unexpected error");
        }),
      } as any;

      const brokenEndpoints = new HealthEndpoints(brokenHealthChecker);

      await brokenEndpoints.basicHealth(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(503);
      expect(responseData).toHaveProperty("error");
    });

    it("should handle errors in component health check", async () => {
      mockRequest.params = { componentName: HealthComponent.EXTERNAL_API };

      healthChecker.registerHealthCheck(
        HealthComponent.EXTERNAL_API,
        jest.fn().mockImplementation(() => {
          throw new Error("Check failed");
        })
      );

      await healthEndpoints.componentHealth(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(503);
    });
  });

  describe("Response Format", () => {
    it("should include all required fields in basic health response", async () => {
      await healthEndpoints.basicHealth(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(responseData).toHaveProperty("status");
      expect(responseData).toHaveProperty("timestamp");
      expect(responseData).toHaveProperty("uptime");
      expect(responseData).toHaveProperty("version");
      expect(responseData).toHaveProperty("environment");
    });

    it("should format timestamps as ISO strings", async () => {
      await healthEndpoints.basicHealth(
        mockRequest as Request,
        mockResponse as Response
      );

      const timestamp = new Date(responseData.timestamp);
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.toISOString()).toBe(responseData.timestamp);
    });

    it("should include uptime in seconds", async () => {
      await healthEndpoints.basicHealth(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(typeof responseData.uptime).toBe("number");
      expect(responseData.uptime).toBeGreaterThanOrEqual(0);
    });
  });
});
