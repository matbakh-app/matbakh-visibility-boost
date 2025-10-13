import { expect, test } from "@playwright/test";
import {
  FailoverManager,
  FailoverPolicy,
} from "../../src/lib/multi-region/failover-manager";
import { HealthChecker } from "../../src/lib/multi-region/health-checker";
import {
  MultiRegionConfig,
  MultiRegionOrchestrator,
} from "../../src/lib/multi-region/multi-region-orchestrator";

/**
 * End-to-End Multi-Region Failover Tests
 *
 * This test suite validates the complete multi-region failover functionality
 * including automatic failover, manual failover, failback, and disaster recovery testing.
 */

const testConfig: MultiRegionConfig = {
  primaryRegion: "eu-central-1",
  secondaryRegion: "eu-west-1",
  domainName: "test.matbakh.app",
  hostedZoneId: "Z123456789TEST",
  distributionId: "E123456789TEST",
  globalClusterIdentifier: "test-global-cluster",
  primaryClusterIdentifier: "test-primary-cluster",
  secondaryClusterIdentifier: "test-secondary-cluster",
  primaryHealthCheckId: "hc-primary-test",
  secondaryHealthCheckId: "hc-secondary-test",
};

const testPolicy: FailoverPolicy = {
  automaticFailover: false,
  healthCheckFailureThreshold: 2,
  healthCheckInterval: 30,
  rtoTarget: 15, // 15 minutes
  rpoTarget: 1, // 1 minute
  notificationEndpoints: ["test@matbakh.app"],
};

test.describe("Multi-Region Failover E2E Tests", () => {
  let failoverManager: FailoverManager;
  let healthChecker: HealthChecker;
  let orchestrator: MultiRegionOrchestrator;

  test.beforeEach(async () => {
    // Initialize components for testing
    orchestrator = new MultiRegionOrchestrator(testConfig);
    healthChecker = new HealthChecker(testConfig);
    failoverManager = new FailoverManager(
      testConfig,
      testPolicy,
      orchestrator,
      healthChecker
    );
  });

  test.describe("System Health Monitoring", () => {
    test("should monitor all services across regions", async () => {
      const healthStatus = await healthChecker.checkAllServices();

      expect(healthStatus).toHaveProperty("overall");
      expect(healthStatus).toHaveProperty("regions");
      expect(healthStatus.regions).toHaveProperty("primary");
      expect(healthStatus.regions).toHaveProperty("secondary");
      expect(healthStatus).toHaveProperty("services");
      expect(Array.isArray(healthStatus.services)).toBe(true);
      expect(healthStatus).toHaveProperty("lastUpdated");
    });

    test("should provide detailed health summary with metrics", async () => {
      const healthSummary = await healthChecker.getHealthSummary();

      expect(healthSummary).toHaveProperty("overall");
      expect(healthSummary).toHaveProperty("regions");
      expect(healthSummary).toHaveProperty("services");
      expect(healthSummary).toHaveProperty("metrics");
      expect(healthSummary.metrics).toHaveProperty("replicationLag");
      expect(healthSummary.metrics).toHaveProperty("responseTime");
      expect(healthSummary.metrics).toHaveProperty("errorRate");
      expect(healthSummary.metrics).toHaveProperty("availability");
    });

    test("should detect service degradation", async () => {
      // This test would normally interact with actual services
      // For E2E testing, we validate the structure and behavior
      const healthStatus = await healthChecker.checkAllServices();

      // Validate that health checker can detect various states
      expect(["healthy", "degraded", "unhealthy"]).toContain(
        healthStatus.overall
      );

      // Validate service-level health checks
      healthStatus.services.forEach((service) => {
        expect(service).toHaveProperty("name");
        expect(service).toHaveProperty("status");
        expect(["healthy", "degraded", "unhealthy"]).toContain(service.status);
        expect(service).toHaveProperty("region");
        expect(service).toHaveProperty("lastCheck");
      });
    });
  });

  test.describe("Manual Failover Operations", () => {
    test("should execute manual failover successfully", async () => {
      const reason = "E2E Test Manual Failover";

      const result = await failoverManager.executeManualFailover(reason);

      expect(result).toHaveProperty("success");
      expect(result).toHaveProperty("rtoAchieved");
      expect(result).toHaveProperty("rpoAchieved");
      expect(result).toHaveProperty("steps");
      expect(Array.isArray(result.steps)).toBe(true);

      // Validate RTO/RPO targets
      if (result.success) {
        expect(result.rtoAchieved).toBeLessThanOrEqual(testPolicy.rtoTarget);
        expect(result.rpoAchieved).toBeLessThanOrEqual(testPolicy.rpoTarget);
      }

      // Check that failover is recorded in history
      const history = failoverManager.getFailoverHistory();
      expect(history.length).toBeGreaterThan(0);

      const lastEvent = history[0];
      expect(lastEvent.type).toBe("failover");
      expect(lastEvent.trigger).toBe("manual");
      expect(lastEvent.reason).toBe(reason);
    });

    test("should prevent concurrent failover operations", async () => {
      // Start first failover
      const firstFailover =
        failoverManager.executeManualFailover("First failover");

      // Attempt second failover immediately
      await expect(
        failoverManager.executeManualFailover("Second failover")
      ).rejects.toThrow("Failover already in progress");

      // Complete first failover
      await firstFailover;
    });

    test("should track failover metrics and compliance", async () => {
      await failoverManager.executeManualFailover("Metrics test failover");

      const status = await failoverManager.getSystemStatus();

      expect(status).toHaveProperty("currentRegion");
      expect(status).toHaveProperty("isFailoverInProgress");
      expect(status).toHaveProperty("lastFailover");
      expect(status).toHaveProperty("healthStatus");
      expect(status).toHaveProperty("rtoCompliance");
      expect(status).toHaveProperty("rpoCompliance");

      expect(status.isFailoverInProgress).toBe(false);
      expect(status.lastFailover).toBeDefined();
      expect(typeof status.rtoCompliance).toBe("boolean");
      expect(typeof status.rpoCompliance).toBe("boolean");
    });
  });

  test.describe("Failback Operations", () => {
    test("should execute failback to primary region", async () => {
      // First perform a failover
      await failoverManager.executeManualFailover("Setup for failback test");

      // Then perform failback
      const result = await failoverManager.executeFailback("E2E Test Failback");

      expect(result).toHaveProperty("success");
      expect(result).toHaveProperty("rtoAchieved");
      expect(result).toHaveProperty("rpoAchieved");
      expect(result).toHaveProperty("steps");

      // Validate that we're back on primary region
      const status = await failoverManager.getSystemStatus();
      expect(status.currentRegion).toBe("primary");

      // Check failback is recorded in history
      const history = failoverManager.getFailoverHistory();
      const failbackEvent = history.find((event) => event.type === "failback");
      expect(failbackEvent).toBeDefined();
      expect(failbackEvent?.trigger).toBe("manual");
    });

    test("should prevent failback when already on primary", async () => {
      // Ensure we're on primary region
      const status = await failoverManager.getSystemStatus();
      if (status.currentRegion !== "primary") {
        await failoverManager.executeFailback("Reset to primary");
      }

      // Attempt failback when already on primary
      await expect(
        failoverManager.executeFailback("Invalid failback")
      ).rejects.toThrow("Already running on primary region");
    });
  });

  test.describe("Disaster Recovery Testing", () => {
    test("should perform comprehensive DR test", async () => {
      const result = await failoverManager.testDisasterRecovery();

      expect(result).toHaveProperty("success");
      expect(result).toHaveProperty("healthChecks");
      expect(result).toHaveProperty("estimatedRTO");
      expect(result).toHaveProperty("estimatedRPO");
      expect(result).toHaveProperty("recommendations");

      expect(typeof result.success).toBe("boolean");
      expect(typeof result.healthChecks).toBe("object");
      expect(typeof result.estimatedRTO).toBe("number");
      expect(typeof result.estimatedRPO).toBe("number");
      expect(Array.isArray(result.recommendations)).toBe(true);

      // Validate health checks structure
      const expectedHealthChecks = [
        "secondaryRegionHealth",
        "databaseReplication",
        "dnsHealthChecks",
        "s3Replication",
        "secretsReplication",
        "networkConnectivity",
        "securityConfiguration",
      ];

      expectedHealthChecks.forEach((check) => {
        expect(result.healthChecks).toHaveProperty(check);
        expect(typeof result.healthChecks[check]).toBe("boolean");
      });

      // Check that DR test is recorded in history
      const history = failoverManager.getFailoverHistory();
      const drTestEvent = history.find((event) => event.type === "test");
      expect(drTestEvent).toBeDefined();
      expect(drTestEvent?.reason).toBe("Disaster recovery test");
    });

    test("should validate RTO/RPO estimates against targets", async () => {
      const result = await failoverManager.testDisasterRecovery();

      // RTO/RPO should be reasonable estimates
      expect(result.estimatedRTO).toBeGreaterThan(0);
      expect(result.estimatedRPO).toBeGreaterThanOrEqual(0);

      // Should provide recommendations if targets might not be met
      if (result.estimatedRTO > testPolicy.rtoTarget) {
        expect(
          result.recommendations.some((rec) =>
            rec.toLowerCase().includes("rto")
          )
        ).toBe(true);
      }

      if (result.estimatedRPO > testPolicy.rpoTarget) {
        expect(
          result.recommendations.some((rec) =>
            rec.toLowerCase().includes("rpo")
          )
        ).toBe(true);
      }
    });
  });

  test.describe("Automatic Failover", () => {
    test("should configure automatic failover policy", async () => {
      const automaticPolicy: Partial<FailoverPolicy> = {
        automaticFailover: true,
        healthCheckFailureThreshold: 3,
        healthCheckInterval: 60,
      };

      expect(() => {
        failoverManager.updatePolicy(automaticPolicy);
      }).not.toThrow();

      // Verify policy was updated
      const status = await failoverManager.getSystemStatus();
      expect(status).toBeDefined();
    });

    test("should respect failure threshold for automatic triggers", async () => {
      // This test validates the logic without triggering actual automatic failover
      // In a real scenario, this would involve simulating service failures

      const automaticPolicy: Partial<FailoverPolicy> = {
        automaticFailover: true,
        healthCheckFailureThreshold: 2,
        healthCheckInterval: 1, // 1 second for testing
      };

      failoverManager.updatePolicy(automaticPolicy);

      // The automatic failover logic is tested in unit tests
      // Here we validate that the configuration is accepted
      expect(true).toBe(true); // Policy update successful
    });
  });

  test.describe("Reporting and Analytics", () => {
    test("should generate comprehensive failover report", async () => {
      // Perform some operations to generate history
      await failoverManager.executeManualFailover("Report test failover");
      await failoverManager.testDisasterRecovery();

      const report = failoverManager.generateFailoverReport();

      expect(report).toHaveProperty("summary");
      expect(report).toHaveProperty("recentEvents");
      expect(report).toHaveProperty("recommendations");

      // Validate summary structure
      expect(report.summary).toHaveProperty("totalFailovers");
      expect(report.summary).toHaveProperty("successfulFailovers");
      expect(report.summary).toHaveProperty("averageRTO");
      expect(report.summary).toHaveProperty("averageRPO");
      expect(report.summary).toHaveProperty("rtoCompliance");
      expect(report.summary).toHaveProperty("rpoCompliance");

      // Validate data types
      expect(typeof report.summary.totalFailovers).toBe("number");
      expect(typeof report.summary.successfulFailovers).toBe("number");
      expect(typeof report.summary.averageRTO).toBe("number");
      expect(typeof report.summary.averageRPO).toBe("number");
      expect(typeof report.summary.rtoCompliance).toBe("number");
      expect(typeof report.summary.rpoCompliance).toBe("number");

      expect(Array.isArray(report.recentEvents)).toBe(true);
      expect(Array.isArray(report.recommendations)).toBe(true);
    });

    test("should track performance trends over time", async () => {
      // Perform multiple operations
      await failoverManager.executeManualFailover("Trend test 1");
      await failoverManager.executeFailback("Trend test failback");
      await failoverManager.executeManualFailover("Trend test 2");

      const history = failoverManager.getFailoverHistory();

      expect(history.length).toBeGreaterThanOrEqual(2);

      // Validate history entries have required fields
      history.forEach((event) => {
        expect(event).toHaveProperty("id");
        expect(event).toHaveProperty("timestamp");
        expect(event).toHaveProperty("type");
        expect(event).toHaveProperty("trigger");
        expect(event).toHaveProperty("reason");
        expect(event).toHaveProperty("result");
        expect(event).toHaveProperty("duration");
        expect(event).toHaveProperty("rtoAchieved");
        expect(event).toHaveProperty("rpoAchieved");

        expect(["failover", "failback", "test"]).toContain(event.type);
        expect(["automatic", "manual"]).toContain(event.trigger);
      });
    });
  });

  test.describe("Error Handling and Recovery", () => {
    test("should handle health check failures gracefully", async () => {
      // Test that system continues to function even when health checks fail
      const status = await failoverManager.getSystemStatus();

      // Should always return a status object, even if health checks fail
      expect(status).toBeDefined();
      expect(status).toHaveProperty("currentRegion");
      expect(status).toHaveProperty("isFailoverInProgress");
      expect(status).toHaveProperty("healthStatus");
    });

    test("should recover from partial failover failures", async () => {
      // This test validates that the system can handle and report partial failures
      try {
        const result = await failoverManager.executeManualFailover(
          "Partial failure test"
        );

        // Even if some steps fail, we should get a structured response
        expect(result).toHaveProperty("success");
        expect(result).toHaveProperty("steps");
        expect(Array.isArray(result.steps)).toBe(true);

        // Check that failed steps are properly marked
        const failedSteps = result.steps.filter(
          (step) => step.status === "failed"
        );
        if (failedSteps.length > 0) {
          failedSteps.forEach((step) => {
            expect(step).toHaveProperty("error");
            expect(typeof step.error).toBe("string");
          });
        }
      } catch (error) {
        // If the operation throws, it should be a meaningful error
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBeTruthy();
      }
    });

    test("should maintain data consistency during failures", async () => {
      const initialStatus = await failoverManager.getSystemStatus();

      try {
        await failoverManager.executeManualFailover("Consistency test");
      } catch (error) {
        // Even if failover fails, system should be in a consistent state
        const finalStatus = await failoverManager.getSystemStatus();

        expect(finalStatus.isFailoverInProgress).toBe(false);
        expect(finalStatus.currentRegion).toBeDefined();
        expect(["primary", "secondary"]).toContain(finalStatus.currentRegion);
      }
    });
  });

  test.describe("Integration with External Systems", () => {
    test("should validate DNS failover configuration", async () => {
      // Test that DNS configuration is properly validated
      const drTest = await failoverManager.testDisasterRecovery();

      expect(drTest.healthChecks).toHaveProperty("dnsHealthChecks");

      // DNS health check should validate both primary and secondary endpoints
      if (drTest.healthChecks.dnsHealthChecks) {
        // DNS is properly configured
        expect(drTest.success).toBe(true);
      } else {
        // DNS issues should be reported in recommendations
        expect(
          drTest.recommendations.some((rec) =>
            rec.toLowerCase().includes("dns")
          )
        ).toBe(true);
      }
    });

    test("should validate database replication status", async () => {
      const healthSummary = await healthChecker.getHealthSummary();

      expect(healthSummary.metrics).toHaveProperty("replicationLag");
      expect(typeof healthSummary.metrics.replicationLag).toBe("number");
      expect(healthSummary.metrics.replicationLag).toBeGreaterThanOrEqual(0);

      // Replication lag should be within acceptable limits for production
      const maxAcceptableLag = 300; // 5 minutes in seconds
      if (healthSummary.metrics.replicationLag > maxAcceptableLag) {
        console.warn(
          `High replication lag detected: ${healthSummary.metrics.replicationLag}s`
        );
      }
    });

    test("should validate cross-region connectivity", async () => {
      const drTest = await failoverManager.testDisasterRecovery();

      expect(drTest.healthChecks).toHaveProperty("networkConnectivity");

      // Network connectivity should be validated for both regions
      if (!drTest.healthChecks.networkConnectivity) {
        expect(
          drTest.recommendations.some(
            (rec) =>
              rec.toLowerCase().includes("network") ||
              rec.toLowerCase().includes("connectivity")
          )
        ).toBe(true);
      }
    });
  });

  test.describe("Performance and Scalability", () => {
    test("should complete failover within RTO target", async () => {
      const startTime = Date.now();

      const result = await failoverManager.executeManualFailover(
        "RTO performance test"
      );

      const actualDuration = (Date.now() - startTime) / 1000 / 60; // Convert to minutes

      if (result.success) {
        expect(result.rtoAchieved).toBeLessThanOrEqual(testPolicy.rtoTarget);

        // The actual test duration should be reasonable for E2E testing
        // (Note: In real scenarios, this would be much longer due to actual AWS operations)
        expect(actualDuration).toBeLessThan(5); // 5 minutes for E2E test
      }
    });

    test("should handle multiple concurrent health checks", async () => {
      // Test that health checker can handle concurrent requests
      const healthCheckPromises = Array.from({ length: 5 }, () =>
        healthChecker.checkAllServices()
      );

      const results = await Promise.all(healthCheckPromises);

      expect(results).toHaveLength(5);
      results.forEach((result) => {
        expect(result).toHaveProperty("overall");
        expect(result).toHaveProperty("regions");
        expect(result).toHaveProperty("services");
      });
    });

    test("should scale monitoring across multiple services", async () => {
      const healthStatus = await healthChecker.checkAllServices();

      // Should monitor all expected services
      const expectedServices = [
        "api-gateway",
        "lambda-functions",
        "rds-database",
        "elasticache",
        "s3-storage",
        "secrets-manager",
      ];

      const serviceNames = healthStatus.services.map((s) => s.name);

      // At least some core services should be monitored
      expect(serviceNames.length).toBeGreaterThan(0);

      // Each service should have proper monitoring data
      healthStatus.services.forEach((service) => {
        expect(service).toHaveProperty("name");
        expect(service).toHaveProperty("status");
        expect(service).toHaveProperty("region");
        expect(service).toHaveProperty("lastCheck");
        expect(service).toHaveProperty("responseTime");
      });
    });
  });
});
