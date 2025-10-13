/**
 * Example: Active Optimization System Usage
 *
 * This example demonstrates how to use the Active Optimization System
 * to automatically optimize AI model routing with Evidently experiments
 * and bandit algorithms.
 */

import {
  initializeOptimizationSystem,
  shutdownOptimizationSystem,
} from "../active-optimization-system";

/**
 * Example 1: Basic Usage
 */
export async function basicOptimizationExample() {
  console.log("🚀 Starting Active Optimization System...");

  // Initialize the system with custom configuration
  const system = await initializeOptimizationSystem({
    projectName: "my-ai-optimization",
    region: "eu-central-1",
    autoExperimentEnabled: true,
    experimentDuration: 14, // 2 weeks
    minTrafficForExperiment: 100, // 100 requests per day
    significanceThreshold: 0.95,
    performanceThresholds: {
      minWinRate: 0.75,
      maxLatency: 1500, // ms
      maxCost: 0.08, // euro
    },
  });

  // Simulate AI requests
  for (let i = 0; i < 50; i++) {
    // Get optimal provider for this request
    const result = await system.getOptimalProvider({
      userId: `user-${i}`,
      domain: i % 3 === 0 ? "legal" : i % 3 === 1 ? "culinary" : "general",
      budgetTier: i % 2 === 0 ? "premium" : "standard",
      requireTools: i % 4 === 0,
    });

    console.log(
      `Request ${i}: Using ${result.provider} (${
        result.source
      }, confidence: ${result.confidence.toFixed(2)})`
    );

    // Simulate processing and record outcome
    const success = Math.random() > 0.2; // 80% success rate
    const latencyMs = 300 + Math.random() * 1000; // 300-1300ms
    const costEuro = 0.02 + Math.random() * 0.06; // €0.02-0.08
    const qualityScore = success
      ? 0.7 + Math.random() * 0.3
      : 0.3 + Math.random() * 0.4;

    await system.recordOutcome(
      {
        userId: `user-${i}`,
        domain: i % 3 === 0 ? "legal" : i % 3 === 1 ? "culinary" : "general",
      },
      result.provider,
      {
        success,
        latencyMs,
        costEuro,
        qualityScore,
      }
    );

    // Small delay to simulate real usage
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Get system metrics
  const metrics = system.getMetrics();
  console.log("\n📊 System Metrics:");
  console.log(`- Total Requests: ${metrics.totalRequests}`);
  console.log(`- Active Experiments: ${metrics.experimentsActive}`);
  console.log(
    `- Best Performing Model: ${metrics.banditPerformance.bestArm} (${(
      metrics.banditPerformance.winRate * 100
    ).toFixed(1)}% win rate)`
  );
  console.log(`- System Health: ${metrics.systemHealth}`);
  console.log(`- Recommendations: ${metrics.recommendations.length}`);

  // Get health status
  const health = await system.getHealthStatus();
  console.log("\n🏥 Health Status:");
  console.log(`- System: ${health.system}`);
  console.log(`- Components: ${JSON.stringify(health.components, null, 2)}`);

  // Get recent events
  const events = system.getEventHistory(5);
  console.log("\n📝 Recent Events:");
  events.forEach((event) => {
    console.log(
      `- ${event.timestamp.toISOString()}: ${event.type} (${event.impact})`
    );
  });

  console.log("\n✅ Example completed successfully!");
}

/**
 * Example 2: Manual Optimization Control
 */
export async function manualOptimizationExample() {
  console.log("🎛️ Manual Optimization Control Example...");

  const system = await initializeOptimizationSystem({
    autoExperimentEnabled: false, // Disable auto experiments
    performanceThresholds: {
      minWinRate: 0.8,
      maxLatency: 1000,
      maxCost: 0.05,
    },
  });

  // Simulate some traffic to build up data
  for (let i = 0; i < 20; i++) {
    const result = await system.getOptimalProvider({
      userId: `manual-user-${i}`,
      domain: "legal",
    });

    await system.recordOutcome(
      { userId: `manual-user-${i}`, domain: "legal" },
      result.provider,
      {
        success: Math.random() > 0.15, // 85% success rate
        latencyMs: 400 + Math.random() * 600,
        costEuro: 0.03 + Math.random() * 0.04,
        qualityScore: 0.8 + Math.random() * 0.2,
      }
    );
  }

  // Force optimization cycle
  console.log("🔄 Running manual optimization cycle...");
  await system.forceOptimization();

  // Update configuration
  console.log("⚙️ Updating system configuration...");
  system.updateConfig({
    experimentDuration: 7, // Shorter experiments
    significanceThreshold: 0.9, // Lower threshold
  });

  // Export system state
  const state = system.exportState();
  console.log("\n💾 System State Export:");
  console.log(`- Config: ${Object.keys(state.config).length} settings`);
  console.log(
    `- Bandit Trials: ${Object.values(state.banditState.banditStats).reduce(
      (sum: number, stats: any) => sum + stats.trials,
      0
    )}`
  );
  console.log(`- Event History: ${state.eventHistory.length} events`);

  console.log("\n✅ Manual optimization example completed!");
}

/**
 * Example 3: Performance Monitoring
 */
export async function performanceMonitoringExample() {
  console.log("📈 Performance Monitoring Example...");

  const system = await initializeOptimizationSystem({
    performanceThresholds: {
      minWinRate: 0.9, // Very high threshold to trigger alerts
      maxLatency: 500, // Low threshold to trigger alerts
      maxCost: 0.03, // Low threshold to trigger alerts
    },
  });

  // Simulate requests with varying performance
  const scenarios = [
    { name: "Good Performance", success: 0.95, latency: 400, cost: 0.02 },
    { name: "High Latency", success: 0.8, latency: 800, cost: 0.025 },
    { name: "High Cost", success: 0.85, latency: 450, cost: 0.06 },
    { name: "Low Success Rate", success: 0.6, latency: 350, cost: 0.02 },
  ];

  for (let i = 0; i < scenarios.length; i++) {
    const scenario = scenarios[i];
    console.log(`\n🎭 Testing scenario: ${scenario.name}`);

    for (let j = 0; j < 5; j++) {
      const result = await system.getOptimalProvider({
        userId: `perf-user-${i}-${j}`,
        domain: "culinary",
      });

      await system.recordOutcome(
        { userId: `perf-user-${i}-${j}`, domain: "culinary" },
        result.provider,
        {
          success: Math.random() < scenario.success,
          latencyMs: scenario.latency + (Math.random() - 0.5) * 100,
          costEuro: scenario.cost + (Math.random() - 0.5) * 0.01,
          qualityScore: scenario.success,
        }
      );
    }

    // Check for performance alerts
    const events = system.getEventHistory(10);
    const alerts = events.filter((e) => e.type === "performance_alert");

    if (alerts.length > 0) {
      console.log(`⚠️ Performance alerts triggered: ${alerts.length}`);
      alerts.forEach((alert) => {
        console.log(`  - ${alert.details.alerts?.join(", ")}`);
      });
    } else {
      console.log("✅ No performance alerts");
    }
  }

  console.log("\n✅ Performance monitoring example completed!");
}

/**
 * Example 4: Cleanup
 */
export async function cleanupExample() {
  console.log("🧹 Cleaning up optimization system...");

  await shutdownOptimizationSystem();

  console.log("✅ Cleanup completed!");
}

/**
 * Run all examples
 */
export async function runAllExamples() {
  try {
    await basicOptimizationExample();
    await new Promise((resolve) => setTimeout(resolve, 1000));

    await manualOptimizationExample();
    await new Promise((resolve) => setTimeout(resolve, 1000));

    await performanceMonitoringExample();
    await new Promise((resolve) => setTimeout(resolve, 1000));

    await cleanupExample();

    console.log("\n🎉 All examples completed successfully!");
  } catch (error) {
    console.error("❌ Example failed:", error);
    await cleanupExample(); // Ensure cleanup even on error
  }
}

// Export for use in other modules
export default {
  basicOptimizationExample,
  manualOptimizationExample,
  performanceMonitoringExample,
  cleanupExample,
  runAllExamples,
};

// Run examples if this file is executed directly
if (require.main === module) {
  runAllExamples().catch(console.error);
}
