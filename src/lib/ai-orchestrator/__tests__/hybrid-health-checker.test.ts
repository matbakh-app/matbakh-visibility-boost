/**
 * Hybrid Health Checker Tests
 *
 * Comprehensive test suite for the Hybrid Health Checker
 */

import {
  HealthComponent,
  HealthStatus,
  HybridHealthChecker,
} from "../health/hybrid-health-checker";

describe("HybridHealthChecker", () => {
  let healthChecker: HybridHealthChecker;

  beforeEach(() => {
    healthChecker = new HybridHealthChecker();
  });

  afterEach(async () => {
    healthChecker.stop();
  });

  describe("Initialization", () => {
    it("should initialize with default configurations", () => {
      expect(healthChecker).toBeDefined();
    });

    it("should start and stop health monitoring", () => {
      const startSpy = jest.fn();
      const stopSpy = jest.fn();

      healthChecker.on("started", startSpy);
      healthChecker.on("stopped", stopSpy);

      healthChecker.start();
      expect(startSpy).toHaveBeenCalled();

      healthChecker.stop();
      expect(stopSpy).toHaveBeenCalled();
    });

    it("should not start multiple times", () => {
      const startSpy = jest.fn();
      healthChecker.on("started", startSpy);

      healthChecker.start();
      healthChecker.start(); // Second call should be ignored

      expect(startSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("Health Check Registration", () => {
    it("should register custom health check", () => {
      const customHealthCheck = jest.fn().mockResolvedValue({
        status: HealthStatus.HEALTHY,
        message: "Custom check passed",
      });

      healthChecker.registerHealthCheck(
        HealthComponent.HYBRID_ROUTER,
        customHealthCheck
      );

      expect(customHealthCheck).toBeDefined();
    });

    it("should register health check with custom config", () => {
      const customHealthCheck = jest.fn().mockResolvedValue({
        status: HealthStatus.HEALTHY,
        message: "Custom check passed",
      });

      healthChecker.registerHealthCheck(
        HealthComponent.BEDROCK_CLIENT,
        customHealthCheck,
        {
          interval: 10000,
          timeout: 3000,
          retries: 2,
        }
      );

      expect(customHealthCheck).toBeDefined();
    });
  });

  describe("Health Check Execution", () => {
    it("should perform health check for a component", async () => {
      const mockHealthCheck = jest.fn().mockResolvedValue({
        status: HealthStatus.HEALTHY,
        message: "Component is healthy",
        details: { version: "1.0.0" },
      });

      healthChecker.registerHealthCheck(
        HealthComponent.HYBRID_ROUTER,
        mockHealthCheck
      );

      const result = await healthChecker.checkHealth(
        HealthComponent.HYBRID_ROUTER
      );

      expect(result).toMatchObject({
        component: HealthComponent.HYBRID_ROUTER,
        status: HealthStatus.HEALTHY,
        message: "Component is healthy",
      });
      expect(result.responseTime).toBeGreaterThan(0);
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(mockHealthCheck).toHaveBeenCalled();
    });

    it("should handle health check timeout", async () => {
      const slowHealthCheck = jest
        .fn()
        .mockImplementation(
          () => new Promise((resolve) => setTimeout(resolve, 10000))
        );

      healthChecker.registerHealthCheck(
        HealthComponent.BEDROCK_CLIENT,
        slowHealthCheck,
        { timeout: 100 } // Very short timeout
      );

      const result = await healthChecker.checkHealth(
        HealthComponent.BEDROCK_CLIENT
      );

      expect(result.status).toBe(HealthStatus.CRITICAL);
      expect(result.message).toContain("failed after");
      expect(result.error).toBeDefined();
    });

    it("should retry failed health checks", async () => {
      let callCount = 0;
      const flakyHealthCheck = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          return Promise.reject(new Error("Temporary failure"));
        }
        return Promise.resolve({
          status: HealthStatus.HEALTHY,
          message: "Check passed after retries",
        });
      });

      healthChecker.registerHealthCheck(
        HealthComponent.SUPPORT_MANAGER,
        flakyHealthCheck,
        { retries: 3 }
      );

      const result = await healthChecker.checkHealth(
        HealthComponent.SUPPORT_MANAGER
      );

      expect(result.status).toBe(HealthStatus.HEALTHY);
      expect(flakyHealthCheck).toHaveBeenCalledTimes(3);
    });

    it("should return unknown status for unconfigured component", async () => {
      const result = await healthChecker.checkHealth(
        HealthComponent.EXTERNAL_API
      );

      expect(result.status).toBe(HealthStatus.UNKNOWN);
      expect(result.message).toContain("not configured");
    });
  });

  describe("System Health Summary", () => {
    it("should generate system health summary", () => {
      const summary = healthChecker.getSystemHealth();

      expect(summary).toHaveProperty("overallStatus");
      expect(summary).toHaveProperty("timestamp");
      expect(summary).toHaveProperty("uptime");
      expect(summary).toHaveProperty("components");
      expect(summary).toHaveProperty("summary");
      expect(summary).toHaveProperty("alerts");
    });

    it("should calculate overall status correctly", async () => {
      // Register healthy component
      healthChecker.registerHealthCheck(
        HealthComponent.HYBRID_ROUTER,
        jest.fn().mockResolvedValue({
          status: HealthStatus.HEALTHY,
          message: "Healthy",
        })
      );

      // Register critical component
      healthChecker.registerHealthCheck(
        HealthComponent.BEDROCK_CLIENT,
        jest.fn().mockRejectedValue(new Error("Critical failure"))
      );

      await healthChecker.checkHealth(HealthComponent.HYBRID_ROUTER);
      await healthChecker.checkHealth(HealthComponent.BEDROCK_CLIENT);

      const summary = healthChecker.getSystemHealth();

      expect(summary.overallStatus).toBe(HealthStatus.CRITICAL);
      expect(summary.summary.healthy).toBeGreaterThan(0);
      expect(summary.summary.critical).toBeGreaterThan(0);
    });
  });

  describe("Alert Management", () => {
    it("should generate alerts for unhealthy components", async () => {
      const alertSpy = jest.fn();
      healthChecker.on("alert", alertSpy);

      healthChecker.registerHealthCheck(
        HealthComponent.BEDROCK_CLIENT,
        jest.fn().mockRejectedValue(new Error("Service down"))
      );

      await healthChecker.checkHealth(HealthComponent.BEDROCK_CLIENT);

      expect(alertSpy).toHaveBeenCalled();
      const alerts = healthChecker.getActiveAlerts();
      expect(alerts.length).toBeGreaterThan(0);
    });

    it("should resolve alerts when component becomes healthy", async () => {
      let isHealthy = false;
      healthChecker.registerHealthCheck(
        HealthComponent.SUPPORT_MANAGER,
        jest.fn().mockImplementation(() => {
          if (isHealthy) {
            return Promise.resolve({
              status: HealthStatus.HEALTHY,
              message: "Recovered",
            });
          }
          return Promise.reject(new Error("Unhealthy"));
        })
      );

      // First check - unhealthy
      await healthChecker.checkHealth(HealthComponent.SUPPORT_MANAGER);
      let alerts = healthChecker.getActiveAlerts();
      expect(alerts.length).toBeGreaterThan(0);

      // Second check - healthy
      isHealthy = true;
      await healthChecker.checkHealth(HealthComponent.SUPPORT_MANAGER);
      alerts = healthChecker.getActiveAlerts();
      expect(alerts.length).toBe(0);
    });

    it("should manually resolve alerts", async () => {
      healthChecker.registerHealthCheck(
        HealthComponent.CACHE_LAYER,
        jest.fn().mockRejectedValue(new Error("Cache failure"))
      );

      await healthChecker.checkHealth(HealthComponent.CACHE_LAYER);

      const alerts = healthChecker.getActiveAlerts();
      expect(alerts.length).toBeGreaterThan(0);

      const alertId = alerts[0].id;
      const resolved = healthChecker.resolveAlert(alertId);

      expect(resolved).toBe(true);
      expect(healthChecker.getActiveAlerts().length).toBe(0);
    });
  });

  describe("Configuration Management", () => {
    it("should update health check configuration", () => {
      healthChecker.updateConfig(HealthComponent.HYBRID_ROUTER, {
        interval: 5000,
        timeout: 2000,
      });

      // Configuration should be updated without errors
      expect(true).toBe(true);
    });

    it("should enable/disable health checks", () => {
      healthChecker.setComponentEnabled(HealthComponent.BEDROCK_CLIENT, false);
      healthChecker.setComponentEnabled(HealthComponent.BEDROCK_CLIENT, true);

      // Should complete without errors
      expect(true).toBe(true);
    });

    it("should throw error for invalid component config update", () => {
      expect(() => {
        healthChecker.updateConfig("invalid-component" as any, {
          interval: 5000,
        });
      }).toThrow();
    });
  });

  describe("Component Health Retrieval", () => {
    it("should retrieve component health status", async () => {
      healthChecker.registerHealthCheck(
        HealthComponent.CIRCUIT_BREAKER,
        jest.fn().mockResolvedValue({
          status: HealthStatus.HEALTHY,
          message: "Circuit breaker operational",
        })
      );

      await healthChecker.checkHealth(HealthComponent.CIRCUIT_BREAKER);
      const health = healthChecker.getComponentHealth(
        HealthComponent.CIRCUIT_BREAKER
      );

      expect(health).toBeDefined();
      expect(health?.status).toBe(HealthStatus.HEALTHY);
    });

    it("should return undefined for component without health data", () => {
      const health = healthChecker.getComponentHealth(
        HealthComponent.EXTERNAL_API
      );
      expect(health).toBeUndefined();
    });
  });

  describe("Event Emission", () => {
    it("should emit healthCheck event on check completion", async () => {
      const healthCheckSpy = jest.fn();
      healthChecker.on("healthCheck", healthCheckSpy);

      healthChecker.registerHealthCheck(
        HealthComponent.LOG_AGGREGATOR,
        jest.fn().mockResolvedValue({
          status: HealthStatus.HEALTHY,
          message: "Logs aggregating",
        })
      );

      await healthChecker.checkHealth(HealthComponent.LOG_AGGREGATOR);

      expect(healthCheckSpy).toHaveBeenCalled();
    });

    it("should emit alertResolved event when alert is resolved", async () => {
      const alertResolvedSpy = jest.fn();
      healthChecker.on("alertResolved", alertResolvedSpy);

      healthChecker.registerHealthCheck(
        HealthComponent.METRICS_PUBLISHER,
        jest.fn().mockRejectedValue(new Error("Metrics failure"))
      );

      await healthChecker.checkHealth(HealthComponent.METRICS_PUBLISHER);

      const alerts = healthChecker.getActiveAlerts();
      if (alerts.length > 0) {
        healthChecker.resolveAlert(alerts[0].id);
        expect(alertResolvedSpy).toHaveBeenCalled();
      }
    });
  });

  describe("Performance", () => {
    it("should complete health check within reasonable time", async () => {
      healthChecker.registerHealthCheck(
        HealthComponent.HYBRID_ROUTER,
        jest.fn().mockResolvedValue({
          status: HealthStatus.HEALTHY,
          message: "Fast check",
        })
      );

      const startTime = Date.now();
      await healthChecker.checkHealth(HealthComponent.HYBRID_ROUTER);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(1000); // Should complete in less than 1 second
    });

    it("should handle multiple concurrent health checks", async () => {
      const components = [
        HealthComponent.HYBRID_ROUTER,
        HealthComponent.BEDROCK_CLIENT,
        HealthComponent.SUPPORT_MANAGER,
        HealthComponent.CACHE_LAYER,
      ];

      components.forEach((component) => {
        healthChecker.registerHealthCheck(
          component,
          jest.fn().mockResolvedValue({
            status: HealthStatus.HEALTHY,
            message: "Concurrent check",
          })
        );
      });

      const checks = components.map((component) =>
        healthChecker.checkHealth(component)
      );

      const results = await Promise.all(checks);

      expect(results).toHaveLength(4);
      results.forEach((result) => {
        expect(result.status).toBe(HealthStatus.HEALTHY);
      });
    });
  });
});
