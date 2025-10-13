/**
 * Performance Rollback System - Example Usage
 *
 * Demonstrates how to integrate and use the performance rollback system
 * in a production AI orchestrator environment.
 */

import { AiFeatureFlags } from "../ai-feature-flags";
import { CircuitBreaker } from "../circuit-breaker";
import { PerformanceMonitor } from "../performance-monitor";
import {
  DEFAULT_INTEGRATION_CONFIG,
  PerformanceRollbackIntegration,
} from "../performance-rollback-integration";
import {
  DEFAULT_ROLLBACK_CONFIG,
  PerformanceRollbackManager,
  RollbackConfiguration,
} from "../performance-rollback-manager";

/**
 * Example 1: Basic Rollback Manager Setup
 */
export function setupBasicRollbackManager(): PerformanceRollbackManager {
  // Create custom configuration
  const config: RollbackConfiguration = {
    ...DEFAULT_ROLLBACK_CONFIG,
    // Customize thresholds for your environment
    emergencyThresholds: {
      errorRate: 0.15, // 15% error rate triggers emergency rollback
      latencyP95: 3000, // 3 seconds P95 latency
      costPerRequest: 0.05, // $0.05 per request
    },
    // Enable gradual rollback with custom steps
    gradualRollback: {
      enabled: true,
      trafficReductionSteps: [90, 70, 50, 30, 10], // More granular steps
      stepDurationMs: 90 * 1000, // 90 seconds per step
    },
    // Reduce cooldown for faster response in development
    rollbackCooldownMs: 2 * 60 * 1000, // 2 minutes
  };

  const rollbackManager = new PerformanceRollbackManager(config);

  console.log("✅ Performance Rollback Manager initialized");
  return rollbackManager;
}

/**
 * Example 2: Full Integration Setup
 */
export function setupFullRollbackIntegration(): PerformanceRollbackIntegration {
  // Initialize dependencies (these would be your actual service instances)
  const performanceMonitor = new PerformanceMonitor();
  const circuitBreaker = new CircuitBreaker();
  const featureFlags = new AiFeatureFlags();

  // Create integration configuration
  const integrationConfig = {
    ...DEFAULT_INTEGRATION_CONFIG,
    monitoringIntervalMs: 15 * 1000, // Check every 15 seconds
    alertingEnabled: true,
    notificationWebhook: "https://hooks.slack.com/services/YOUR/WEBHOOK/URL",
    slackChannel: "#ai-alerts",
    emergencyContacts: ["admin@matbakh.app", "devops@matbakh.app"],
  };

  const integration = new PerformanceRollbackIntegration(
    performanceMonitor,
    circuitBreaker,
    featureFlags,
    integrationConfig
  );

  // Start monitoring
  integration.startMonitoring();

  console.log("✅ Performance Rollback Integration started");
  return integration;
}

/**
 * Example 3: Monitoring Performance and Triggering Rollbacks
 */
export async function demonstratePerformanceMonitoring(): Promise<void> {
  const rollbackManager = setupBasicRollbackManager();

  // Simulate performance metrics that would trigger different rollback scenarios

  // Scenario 1: Normal performance - no rollback
  console.log("\n📊 Scenario 1: Normal Performance");
  const normalMetrics = {
    requestCount: 1000,
    successCount: 980,
    errorCount: 20,
    totalLatency: 50000,
    totalCost: 1.0,
    p95Latency: 800, // Good latency
    p99Latency: 1200,
    averageLatency: 500,
    errorRate: 0.02, // 2% error rate - normal
    costPerRequest: 0.001,
    throughputRPS: 20,
    lastUpdated: new Date(),
  };

  let rollback = await rollbackManager.monitorAndRollback(
    normalMetrics,
    [],
    []
  );
  console.log(
    "Normal metrics result:",
    rollback ? "Rollback triggered" : "No rollback needed ✅"
  );

  // Scenario 2: High error rate - emergency rollback
  console.log("\n🚨 Scenario 2: Emergency - High Error Rate");
  const emergencyMetrics = {
    ...normalMetrics,
    errorRate: 0.2, // 20% error rate - emergency!
    successCount: 800,
    errorCount: 200,
  };

  rollback = await rollbackManager.monitorAndRollback(emergencyMetrics, [], []);
  if (rollback) {
    console.log("🚨 Emergency rollback triggered!");
    console.log("Rollback ID:", rollback.id);
    console.log("Severity:", rollback.severity);
    console.log("Reason:", rollback.reason);
    console.log("Steps:", rollback.rollbackSteps.map((s) => s.type).join(", "));
  }

  // Scenario 3: High latency - gradual rollback
  console.log("\n⚠️ Scenario 3: High Latency - Gradual Rollback");
  const highLatencyMetrics = {
    ...normalMetrics,
    p95Latency: 6000, // 6 seconds - emergency threshold
    averageLatency: 3000,
  };

  rollback = await rollbackManager.monitorAndRollback(
    highLatencyMetrics,
    [],
    []
  );
  if (rollback) {
    console.log("⚠️ Latency rollback triggered!");
    console.log("Rollback will execute gradual traffic reduction");
  }

  // Scenario 4: Cost spike - emergency rollback
  console.log("\n💰 Scenario 4: Cost Spike - Emergency Rollback");
  const costSpikeMetrics = {
    ...normalMetrics,
    costPerRequest: 0.08, // $0.08 per request - above emergency threshold
    totalCost: 80,
  };

  rollback = await rollbackManager.monitorAndRollback(costSpikeMetrics, [], []);
  if (rollback) {
    console.log("💰 Cost spike rollback triggered!");
    console.log("Emergency stop to prevent further cost escalation");
  }
}

/**
 * Example 4: SLO Violation Rollback
 */
export async function demonstrateSLOViolationRollback(): Promise<void> {
  const rollbackManager = setupBasicRollbackManager();

  // Create mock SLO violation alerts
  const sloViolationAlert = {
    id: "slo-violation-1",
    slo: {
      name: "Response Time SLO",
      metric: "p95Latency" as const,
      threshold: 1500,
      operator: "lt" as const,
      severity: "critical" as const,
    },
    currentValue: 2500,
    threshold: 1500,
    severity: "critical" as const,
    timestamp: new Date(),
    message: "P95 latency exceeds SLO threshold",
  };

  const metrics = {
    requestCount: 1000,
    successCount: 950,
    errorCount: 50,
    totalLatency: 100000,
    totalCost: 1.0,
    p95Latency: 2500, // Above SLO threshold
    p99Latency: 3000,
    averageLatency: 1000,
    errorRate: 0.05,
    costPerRequest: 0.001,
    throughputRPS: 20,
    lastUpdated: new Date(),
  };

  console.log("\n📈 Demonstrating SLO Violation Rollback");
  console.log("SLO Threshold: 1500ms, Current P95: 2500ms");

  // First violation - should not trigger rollback
  let rollback = await rollbackManager.monitorAndRollback(
    metrics,
    [],
    [sloViolationAlert]
  );
  console.log(
    "Violation 1:",
    rollback ? "Rollback triggered" : "No rollback (1/3)"
  );

  // Second violation - should not trigger rollback
  rollback = await rollbackManager.monitorAndRollback(
    metrics,
    [],
    [sloViolationAlert]
  );
  console.log(
    "Violation 2:",
    rollback ? "Rollback triggered" : "No rollback (2/3)"
  );

  // Third violation - should trigger rollback
  rollback = await rollbackManager.monitorAndRollback(
    metrics,
    [],
    [sloViolationAlert]
  );
  console.log(
    "Violation 3:",
    rollback ? "🔄 Rollback triggered! (3/3)" : "No rollback"
  );

  if (rollback) {
    console.log("Rollback details:");
    console.log("- Type: SLO Violation");
    console.log("- Steps:", rollback.rollbackSteps.length);
    console.log("- Expected recovery time: 2-5 minutes");
  }
}

/**
 * Example 5: Manual Rollback and Recovery
 */
export async function demonstrateManualRollback(): Promise<void> {
  const integration = setupFullRollbackIntegration();

  console.log("\n🔧 Demonstrating Manual Rollback");

  try {
    // Trigger manual rollback
    const rollback = await integration.triggerManualRollback(
      "Manual rollback for maintenance window"
    );

    console.log("✅ Manual rollback initiated");
    console.log("Rollback ID:", rollback.id);
    console.log("Status:", rollback.status);

    // Monitor rollback progress
    let currentRollback = integration.getCurrentRollback();
    while (currentRollback && currentRollback.status === "in_progress") {
      console.log("⏳ Rollback in progress...");
      await new Promise((resolve) => setTimeout(resolve, 1000));
      currentRollback = integration.getCurrentRollback();
    }

    if (currentRollback?.status === "completed") {
      console.log("✅ Manual rollback completed successfully");
    } else if (currentRollback?.status === "failed") {
      console.log("❌ Manual rollback failed");
    }
  } catch (error) {
    console.error("❌ Failed to trigger manual rollback:", error);
  }

  // Stop monitoring when done
  integration.stopMonitoring();
}

/**
 * Example 6: Configuration Management
 */
export function demonstrateConfigurationManagement(): void {
  const rollbackManager = setupBasicRollbackManager();

  console.log("\n⚙️ Demonstrating Configuration Management");

  // Update configuration for different environments
  const productionConfig = {
    enabled: true,
    sloViolationThreshold: 5, // More conservative in production
    rollbackCooldownMs: 10 * 60 * 1000, // 10 minutes cooldown
    emergencyThresholds: {
      errorRate: 0.05, // 5% error rate
      latencyP95: 2000, // 2 seconds
      costPerRequest: 0.02, // $0.02
    },
  };

  rollbackManager.updateConfiguration(productionConfig);
  console.log("✅ Updated to production configuration");

  const developmentConfig = {
    enabled: true,
    sloViolationThreshold: 2, // More aggressive in development
    rollbackCooldownMs: 1 * 60 * 1000, // 1 minute cooldown
    emergencyThresholds: {
      errorRate: 0.1, // 10% error rate
      latencyP95: 5000, // 5 seconds
      costPerRequest: 0.1, // $0.10
    },
  };

  rollbackManager.updateConfiguration(developmentConfig);
  console.log("✅ Updated to development configuration");
}

/**
 * Example 7: Rollback History Analysis
 */
export function demonstrateRollbackHistoryAnalysis(): void {
  const rollbackManager = setupBasicRollbackManager();

  // Simulate some rollback history
  const mockHistory = [
    {
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      severity: "critical",
      reason: "P95 latency exceeded threshold",
      status: "completed",
    },
    {
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
      severity: "emergency",
      reason: "Error rate spike",
      status: "completed",
    },
    {
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
      severity: "warning",
      reason: "Manual rollback for deployment",
      status: "completed",
    },
  ];

  console.log("\n📊 Rollback History Analysis");
  console.log("Recent rollbacks (last 24 hours):");

  mockHistory.forEach((rollback, index) => {
    const hoursAgo = Math.round(
      (Date.now() - rollback.timestamp.getTime()) / (60 * 60 * 1000)
    );
    console.log(
      `${index + 1}. ${rollback.severity.toUpperCase()} - ${rollback.reason}`
    );
    console.log(`   ${hoursAgo} hours ago, Status: ${rollback.status}`);
  });

  // Analysis
  const emergencyCount = mockHistory.filter(
    (r) => r.severity === "emergency"
  ).length;
  const criticalCount = mockHistory.filter(
    (r) => r.severity === "critical"
  ).length;
  const successRate =
    mockHistory.filter((r) => r.status === "completed").length /
    mockHistory.length;

  console.log("\n📈 Analysis:");
  console.log(`- Emergency rollbacks: ${emergencyCount}`);
  console.log(`- Critical rollbacks: ${criticalCount}`);
  console.log(`- Success rate: ${(successRate * 100).toFixed(1)}%`);

  if (emergencyCount > 1) {
    console.log(
      "⚠️ Recommendation: Review system stability - multiple emergency rollbacks detected"
    );
  }
}

/**
 * Main example runner
 */
export async function runAllExamples(): Promise<void> {
  console.log("🚀 Performance Rollback System Examples\n");

  try {
    // Run all examples
    setupBasicRollbackManager();
    setupFullRollbackIntegration();

    await demonstratePerformanceMonitoring();
    await demonstrateSLOViolationRollback();
    await demonstrateManualRollback();

    demonstrateConfigurationManagement();
    demonstrateRollbackHistoryAnalysis();

    console.log("\n✅ All examples completed successfully!");
  } catch (error) {
    console.error("❌ Example execution failed:", error);
  }
}

// Export for use in other modules
export {
  DEFAULT_INTEGRATION_CONFIG,
  DEFAULT_ROLLBACK_CONFIG,
  PerformanceRollbackIntegration,
  PerformanceRollbackManager,
};
