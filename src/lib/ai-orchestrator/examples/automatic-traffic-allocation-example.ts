/**
 * Example: Automatic Traffic Allocation
 *
 * This example demonstrates how the AI orchestration system automatically
 * allocates traffic between different AI providers (Bedrock, Google, Meta)
 * based on their performance without any manual intervention.
 */

import {
  ActiveOptimizationSystem,
  initializeOptimizationSystem,
} from "../active-optimization-system";

async function demonstrateAutomaticTrafficAllocation() {
  console.log("🚀 Starting Automatic Traffic Allocation Demo");

  // Initialize the optimization system with automatic traffic allocation enabled
  const system = await initializeOptimizationSystem({
    projectName: "traffic-allocation-demo",
    region: "eu-central-1",
    autoTrafficAllocationEnabled: true, // Enable automatic traffic allocation
    trafficAllocationInterval: 1, // Update every 1 minute for demo
    autoExperimentEnabled: false, // Disable experiments for this demo
    performanceThresholds: {
      minWinRate: 0.7,
      maxLatency: 1500, // ms
      maxCost: 0.08, // euro
    },
  });

  console.log("✅ System initialized with automatic traffic allocation");

  // Simulate some requests and outcomes to build performance data
  console.log("\n📊 Simulating requests to build performance data...");

  const contexts = [
    { userId: "user-1", domain: "legal" },
    { userId: "user-2", domain: "culinary" },
    { userId: "user-3", domain: "medical" },
    { userId: "user-4", domain: "general" },
  ];

  // Simulate 100 requests with different performance characteristics
  for (let i = 0; i < 100; i++) {
    const context = contexts[i % contexts.length];

    // Get provider recommendation
    const recommendation = await system.getOptimalProvider(context);
    console.log(
      `Request ${i + 1}: ${recommendation.provider} (${
        recommendation.source
      }, confidence: ${recommendation.confidence.toFixed(2)}${
        recommendation.allocationProbability
          ? `, allocation: ${(
              recommendation.allocationProbability * 100
            ).toFixed(1)}%`
          : ""
      })`
    );

    // Simulate different performance characteristics for each provider
    let success: boolean;
    let latencyMs: number;
    let costEuro: number;

    switch (recommendation.provider) {
      case "bedrock":
        // Bedrock: Good performance, moderate cost
        success = Math.random() > 0.15; // 85% success rate
        latencyMs = 400 + Math.random() * 200; // 400-600ms
        costEuro = 0.03 + Math.random() * 0.02; // €0.03-0.05
        break;

      case "google":
        // Google: Fast but expensive
        success = Math.random() > 0.2; // 80% success rate
        latencyMs = 300 + Math.random() * 150; // 300-450ms
        costEuro = 0.06 + Math.random() * 0.03; // €0.06-0.09
        break;

      case "meta":
        // Meta: Cheap but slower and less reliable
        success = Math.random() > 0.3; // 70% success rate
        latencyMs = 600 + Math.random() * 400; // 600-1000ms
        costEuro = 0.02 + Math.random() * 0.02; // €0.02-0.04
        break;

      default:
        success = true;
        latencyMs = 500;
        costEuro = 0.05;
    }

    // Record the outcome
    await system.recordOutcome(context, recommendation.provider, {
      success,
      latencyMs,
      costEuro,
      qualityScore: success
        ? 0.8 + Math.random() * 0.2
        : 0.3 + Math.random() * 0.4,
    });

    // Show traffic allocation every 20 requests
    if ((i + 1) % 20 === 0) {
      const allocation = system.getCurrentTrafficAllocation();
      console.log(`\n📈 Current Traffic Allocation (after ${i + 1} requests):`);
      console.log(`  Bedrock: ${(allocation.bedrock * 100).toFixed(1)}%`);
      console.log(`  Google:  ${(allocation.google * 100).toFixed(1)}%`);
      console.log(`  Meta:    ${(allocation.meta * 100).toFixed(1)}%`);
      console.log("");
    }
  }

  // Force a traffic allocation update to see the final optimization
  console.log("🔄 Forcing traffic allocation update based on performance...");
  await system.forceTrafficAllocationUpdate();

  // Show final results
  const finalAllocation = system.getCurrentTrafficAllocation();
  const metrics = system.getMetrics();

  console.log("\n🎯 Final Automatic Traffic Allocation:");
  console.log(`  Bedrock: ${(finalAllocation.bedrock * 100).toFixed(1)}%`);
  console.log(`  Google:  ${(finalAllocation.google * 100).toFixed(1)}%`);
  console.log(`  Meta:    ${(finalAllocation.meta * 100).toFixed(1)}%`);

  console.log("\n📊 System Performance:");
  console.log(`  Total Requests: ${metrics.totalRequests}`);
  console.log(`  Best Performing Arm: ${metrics.banditPerformance.bestArm}`);
  console.log(
    `  Best Arm Win Rate: ${(metrics.banditPerformance.winRate * 100).toFixed(
      1
    )}%`
  );
  console.log(
    `  Best Arm Confidence: ${(
      metrics.banditPerformance.confidence * 100
    ).toFixed(1)}%`
  );

  // Show recent events
  const events = system.getEventHistory(10);
  const allocationEvents = events.filter(
    (e) => e.type === "traffic_allocation_updated"
  );

  console.log("\n📝 Recent Traffic Allocation Updates:");
  allocationEvents.forEach((event, index) => {
    console.log(`  ${index + 1}. ${event.timestamp.toISOString()}`);
    console.log(`     Reason: ${event.details.reason}`);
    if (event.details.newAllocation) {
      const alloc = event.details.newAllocation;
      console.log(
        `     New Allocation: Bedrock ${(alloc.bedrock * 100).toFixed(
          1
        )}%, Google ${(alloc.google * 100).toFixed(1)}%, Meta ${(
          alloc.meta * 100
        ).toFixed(1)}%`
      );
    }
  });

  // Demonstrate that the system continues to optimize automatically
  console.log(
    "\n⏰ System will continue to automatically optimize traffic allocation every 15 minutes"
  );
  console.log("   No manual intervention required!");

  // Show health status
  const health = await system.getHealthStatus();
  console.log("\n🏥 System Health:");
  console.log(`  Overall: ${health.system}`);
  console.log(`  Experiments: ${health.components.experiments}`);
  console.log(`  Bandit: ${health.components.bandit}`);
  console.log(`  Optimization: ${health.components.optimization}`);

  console.log("\n✅ Automatic Traffic Allocation Demo Complete!");
  console.log(
    "The system will continue to optimize traffic allocation automatically based on real-time performance data."
  );

  return system;
}

// Example of how to monitor traffic allocation changes
async function monitorTrafficAllocation(system: ActiveOptimizationSystem) {
  console.log("\n🔍 Monitoring Traffic Allocation Changes...");

  let previousAllocation = system.getCurrentTrafficAllocation();

  setInterval(() => {
    const currentAllocation = system.getCurrentTrafficAllocation();

    // Check if allocation has changed significantly (>1%)
    const hasChanged = Object.keys(currentAllocation).some((arm) => {
      const diff = Math.abs(
        currentAllocation[arm as keyof typeof currentAllocation] -
          previousAllocation[arm as keyof typeof previousAllocation]
      );
      return diff > 0.01; // 1% threshold
    });

    if (hasChanged) {
      console.log("📊 Traffic Allocation Changed:");
      console.log(
        `  Bedrock: ${(previousAllocation.bedrock * 100).toFixed(1)}% → ${(
          currentAllocation.bedrock * 100
        ).toFixed(1)}%`
      );
      console.log(
        `  Google:  ${(previousAllocation.google * 100).toFixed(1)}% → ${(
          currentAllocation.google * 100
        ).toFixed(1)}%`
      );
      console.log(
        `  Meta:    ${(previousAllocation.meta * 100).toFixed(1)}% → ${(
          currentAllocation.meta * 100
        ).toFixed(1)}%`
      );

      previousAllocation = { ...currentAllocation };
    }
  }, 30000); // Check every 30 seconds
}

// Run the demo if this file is executed directly
if (require.main === module) {
  demonstrateAutomaticTrafficAllocation()
    .then((system) => {
      // Start monitoring
      monitorTrafficAllocation(system);

      // Keep the process running to see automatic updates
      console.log("\nPress Ctrl+C to exit and stop monitoring...");
    })
    .catch((error) => {
      console.error("Demo failed:", error);
      process.exit(1);
    });
}

export { demonstrateAutomaticTrafficAllocation, monitorTrafficAllocation };
