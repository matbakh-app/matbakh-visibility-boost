/**
 * Health Check System Usage Example
 *
 * Demonstrates how to use the Hybrid Health Checker and Health Endpoints
 * for comprehensive health monitoring of hybrid routing operations.
 */

import express from "express";
import { createHealthRouter } from "../health/health-router";
import {
  HealthComponent,
  HealthStatus,
  HybridHealthChecker,
} from "../health/hybrid-health-checker";

/**
 * Example 1: Basic Health Checker Setup
 */
export function basicHealthCheckerExample() {
  console.log("🏥 Example 1: Basic Health Checker Setup\n");

  // Create health checker instance
  const healthChecker = new HybridHealthChecker();

  // Register custom health check for a component
  healthChecker.registerHealthCheck(HealthComponent.HYBRID_ROUTER, async () => {
    // Perform actual health check logic
    const isHealthy = await checkRouterHealth();

    return {
      status: isHealthy ? HealthStatus.HEALTHY : HealthStatus.UNHEALTHY,
      message: isHealthy ? "Router is operational" : "Router has issues",
      details: {
        activeRoutes: 2,
        fallbackEnabled: true,
        lastRoutingDecision: new Date().toISOString(),
      },
      metrics: {
        uptime: process.uptime(),
        requestCount: 1000,
        errorRate: 0.01,
        averageLatency: 150,
      },
    };
  });

  // Start health monitoring
  healthChecker.start();

  // Listen for health check events
  healthChecker.on("healthCheck", (result) => {
    console.log(`✅ Health check completed for ${result.component}:`, {
      status: result.status,
      responseTime: `${result.responseTime}ms`,
      message: result.message,
    });
  });

  // Listen for alerts
  healthChecker.on("alert", (alert) => {
    console.log(`🚨 Health alert generated:`, {
      component: alert.component,
      severity: alert.severity,
      message: alert.message,
    });
  });

  return healthChecker;
}

/**
 * Example 2: Custom Health Check Configuration
 */
export function customHealthCheckConfigExample() {
  console.log("🏥 Example 2: Custom Health Check Configuration\n");

  const healthChecker = new HybridHealthChecker();

  // Register health check with custom configuration
  healthChecker.registerHealthCheck(
    HealthComponent.BEDROCK_CLIENT,
    async () => {
      const isConnected = await checkBedrockConnection();

      return {
        status: isConnected ? HealthStatus.HEALTHY : HealthStatus.CRITICAL,
        message: isConnected
          ? "Bedrock client connected"
          : "Bedrock client disconnected",
        details: {
          region: "eu-central-1",
          modelsAvailable: isConnected,
          lastApiCall: new Date().toISOString(),
        },
      };
    },
    {
      enabled: true,
      interval: 60000, // Check every 60 seconds
      timeout: 10000, // 10 second timeout
      retries: 3, // Retry 3 times on failure
      thresholds: {
        responseTime: {
          warning: 2000, // Warn if > 2 seconds
          critical: 5000, // Critical if > 5 seconds
        },
        errorRate: {
          warning: 0.05, // Warn if > 5% error rate
          critical: 0.1, // Critical if > 10% error rate
        },
      },
    }
  );

  healthChecker.start();

  return healthChecker;
}

/**
 * Example 3: Manual Health Checks
 */
export async function manualHealthCheckExample() {
  console.log("🏥 Example 3: Manual Health Checks\n");

  const healthChecker = new HybridHealthChecker();

  // Register health checks
  healthChecker.registerHealthCheck(
    HealthComponent.SUPPORT_MANAGER,
    async () => ({
      status: HealthStatus.HEALTHY,
      message: "Support manager operational",
      details: {
        supportMode: "active",
        queueSize: 0,
      },
    })
  );

  // Perform immediate health check
  const result = await healthChecker.checkHealth(
    HealthComponent.SUPPORT_MANAGER
  );

  console.log("Manual health check result:", {
    component: result.component,
    status: result.status,
    responseTime: `${result.responseTime}ms`,
    message: result.message,
    details: result.details,
  });

  // Get system health summary
  const systemHealth = healthChecker.getSystemHealth();

  console.log("\nSystem health summary:", {
    overallStatus: systemHealth.overallStatus,
    uptime: `${Math.floor(systemHealth.uptime / 1000)}s`,
    summary: systemHealth.summary,
    activeAlerts: systemHealth.alerts.length,
  });

  return result;
}

/**
 * Example 4: Express Server with Health Endpoints
 */
export function expressHealthEndpointsExample() {
  console.log("🏥 Example 4: Express Server with Health Endpoints\n");

  const app = express();
  const healthChecker = new HybridHealthChecker();

  // Register health checks for all components
  registerAllHealthChecks(healthChecker);

  // Start health monitoring
  healthChecker.start();

  // Create health router with configuration
  const healthRouter = createHealthRouter(healthChecker, {
    enableRateLimit: true,
    rateLimitWindow: 15, // 15 minutes
    rateLimitMax: 100, // 100 requests per window
    enableAuth: false, // Disable auth for public health checks
    enableCors: true,
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
  });

  // Mount health router
  app.use("/health", healthRouter);

  // Start server
  const port = 3000;
  app.listen(port, () => {
    console.log(`✅ Health check server running on http://localhost:${port}`);
    console.log(`\nAvailable endpoints:`);
    console.log(`  GET  /health              - Basic health check`);
    console.log(`  GET  /health/detailed     - Detailed health information`);
    console.log(`  GET  /health/component/:name - Component-specific health`);
    console.log(`  GET  /health/ready        - Readiness probe`);
    console.log(`  GET  /health/live         - Liveness probe`);
    console.log(`  GET  /health/metrics      - Health metrics`);
    console.log(`  GET  /health/alerts       - Active alerts`);
    console.log(`  POST /health/alerts/:id/resolve - Resolve alert`);
    console.log(`  GET  /health/status       - HTML status page`);
  });

  return { app, healthChecker };
}

/**
 * Example 5: Alert Management
 */
export async function alertManagementExample() {
  console.log("🏥 Example 5: Alert Management\n");

  const healthChecker = new HybridHealthChecker();

  // Register unhealthy component
  healthChecker.registerHealthCheck(HealthComponent.CACHE_LAYER, async () => {
    throw new Error("Cache connection failed");
  });

  // Perform health check to generate alert
  await healthChecker.checkHealth(HealthComponent.CACHE_LAYER);

  // Get active alerts
  const alerts = healthChecker.getActiveAlerts();
  console.log(`Active alerts: ${alerts.length}`);

  if (alerts.length > 0) {
    const alert = alerts[0];
    console.log("\nAlert details:", {
      id: alert.id,
      component: alert.component,
      severity: alert.severity,
      message: alert.message,
      timestamp: alert.timestamp,
    });

    // Resolve alert
    const resolved = healthChecker.resolveAlert(alert.id);
    console.log(`\nAlert resolved: ${resolved}`);

    // Verify alert is resolved
    const remainingAlerts = healthChecker.getActiveAlerts();
    console.log(`Remaining alerts: ${remainingAlerts.length}`);
  }
}

/**
 * Example 6: Dynamic Configuration Updates
 */
export function dynamicConfigurationExample() {
  console.log("🏥 Example 6: Dynamic Configuration Updates\n");

  const healthChecker = new HybridHealthChecker();

  // Register health check
  healthChecker.registerHealthCheck(
    HealthComponent.CIRCUIT_BREAKER,
    async () => ({
      status: HealthStatus.HEALTHY,
      message: "Circuit breaker operational",
    })
  );

  healthChecker.start();

  // Update configuration dynamically
  console.log("Updating health check configuration...");
  healthChecker.updateConfig(HealthComponent.CIRCUIT_BREAKER, {
    interval: 30000, // Change to 30 seconds
    timeout: 3000, // Change to 3 seconds
  });

  // Enable/disable health checks dynamically
  console.log("Disabling health check...");
  healthChecker.setComponentEnabled(HealthComponent.CIRCUIT_BREAKER, false);

  setTimeout(() => {
    console.log("Re-enabling health check...");
    healthChecker.setComponentEnabled(HealthComponent.CIRCUIT_BREAKER, true);
  }, 5000);

  return healthChecker;
}

/**
 * Example 7: Monitoring Multiple Components
 */
export async function multiComponentMonitoringExample() {
  console.log("🏥 Example 7: Monitoring Multiple Components\n");

  const healthChecker = new HybridHealthChecker();

  // Register health checks for multiple components
  const components = [
    HealthComponent.HYBRID_ROUTER,
    HealthComponent.BEDROCK_CLIENT,
    HealthComponent.SUPPORT_MANAGER,
    HealthComponent.CACHE_LAYER,
    HealthComponent.CIRCUIT_BREAKER,
  ];

  components.forEach((component) => {
    healthChecker.registerHealthCheck(component, async () => ({
      status: HealthStatus.HEALTHY,
      message: `${component} is operational`,
      details: {
        component,
        timestamp: new Date().toISOString(),
      },
    }));
  });

  healthChecker.start();

  // Wait for health checks to complete
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Get system health
  const systemHealth = healthChecker.getSystemHealth();

  console.log("System health summary:");
  console.log(`  Overall status: ${systemHealth.overallStatus}`);
  console.log(
    `  Total components: ${Object.keys(systemHealth.components).length}`
  );
  console.log(`  Healthy: ${systemHealth.summary.healthy}`);
  console.log(`  Degraded: ${systemHealth.summary.degraded}`);
  console.log(`  Unhealthy: ${systemHealth.summary.unhealthy}`);
  console.log(`  Critical: ${systemHealth.summary.critical}`);
  console.log(`  Unknown: ${systemHealth.summary.unknown}`);

  // Check individual component health
  components.forEach((component) => {
    const health = healthChecker.getComponentHealth(component);
    if (health) {
      console.log(`\n${component}:`, {
        status: health.status,
        responseTime: `${health.responseTime}ms`,
        message: health.message,
      });
    }
  });

  return systemHealth;
}

// Helper functions

async function checkRouterHealth(): Promise<boolean> {
  // Simulate router health check
  return Promise.resolve(true);
}

async function checkBedrockConnection(): Promise<boolean> {
  // Simulate Bedrock connection check
  return Promise.resolve(true);
}

function registerAllHealthChecks(healthChecker: HybridHealthChecker): void {
  // Register health checks for all components
  Object.values(HealthComponent).forEach((component) => {
    healthChecker.registerHealthCheck(component, async () => ({
      status: HealthStatus.HEALTHY,
      message: `${component} is operational`,
      details: {
        component,
        timestamp: new Date().toISOString(),
      },
    }));
  });
}

// Run examples if executed directly
if (require.main === module) {
  console.log("🏥 Health Check System Examples\n");
  console.log("=".repeat(50) + "\n");

  // Run examples sequentially
  (async () => {
    try {
      // Example 1
      const healthChecker1 = basicHealthCheckerExample();
      await new Promise((resolve) => setTimeout(resolve, 2000));
      healthChecker1.stop();

      console.log("\n" + "=".repeat(50) + "\n");

      // Example 2
      const healthChecker2 = customHealthCheckConfigExample();
      await new Promise((resolve) => setTimeout(resolve, 2000));
      healthChecker2.stop();

      console.log("\n" + "=".repeat(50) + "\n");

      // Example 3
      await manualHealthCheckExample();

      console.log("\n" + "=".repeat(50) + "\n");

      // Example 5
      await alertManagementExample();

      console.log("\n" + "=".repeat(50) + "\n");

      // Example 7
      await multiComponentMonitoringExample();

      console.log("\n" + "=".repeat(50) + "\n");
      console.log("✅ All examples completed successfully!");
    } catch (error) {
      console.error("❌ Error running examples:", error);
      process.exit(1);
    }
  })();
}
