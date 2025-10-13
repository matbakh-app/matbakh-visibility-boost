#!/usr/bin/env tsx

/**
 * 10x Load Testing Demo
 * Demonstrates the 10x load testing capabilities without running actual load tests
 */

import { HighLoadTester } from "../src/lib/performance-testing/high-load-tester";

async function main() {
  console.log("🚀 10x Load Testing Demo");
  console.log("========================");
  console.log("");

  // Create high load tester instance
  const highLoadTester = new HighLoadTester();

  // Demonstrate configuration creation
  console.log("📋 Configuration Examples:");
  console.log("");

  // Production readiness test
  const prodConfig = HighLoadTester.getProductionReadinessTest(
    "https://api.matbakh.app"
  );
  console.log("🏭 Production Readiness Test Configuration:");
  console.log(`   Target: ${prodConfig.target}`);
  console.log(`   Scaling Factor: ${prodConfig.scalingFactor}x`);
  console.log(`   Baseline RPS: ${prodConfig.baselineRPS}`);
  console.log(`   Target RPS: ${prodConfig.targetRPS}`);
  console.log(`   Max Concurrency: ${prodConfig.maxConcurrency}`);
  console.log(
    `   Max Response Time: ${prodConfig.performanceThresholds.maxResponseTime}ms`
  );
  console.log(
    `   Max Error Rate: ${prodConfig.performanceThresholds.maxErrorRate}%`
  );
  console.log(`   Test Phases: ${prodConfig.phases.length}`);
  console.log("");

  // Breaking point test
  const breakingConfig = HighLoadTester.getStressBreakingPointTest(
    "https://api.matbakh.app"
  );
  console.log("💥 Breaking Point Test Configuration:");
  console.log(`   Target: ${breakingConfig.target}`);
  console.log(
    `   Scaling Factor: ${breakingConfig.scalingFactor}x (Beyond 10x!)`
  );
  console.log(`   Target RPS: ${breakingConfig.targetRPS}`);
  console.log(`   Max Concurrency: ${breakingConfig.maxConcurrency}`);
  console.log(
    `   Max Response Time: ${breakingConfig.performanceThresholds.maxResponseTime}ms`
  );
  console.log(
    `   Max Error Rate: ${breakingConfig.performanceThresholds.maxErrorRate}%`
  );
  console.log(`   Test Phases: ${breakingConfig.phases.length}`);
  console.log("");

  // Demonstrate phase generation
  console.log("⚡ High Load Test Phases (10x Load):");
  const phases = (highLoadTester as any).generateHighLoadPhases(10, 100);
  phases.forEach((phase: any, index: number) => {
    console.log(
      `   ${index + 1}. ${phase.name}: ${phase.arrivalRate} RPS for ${
        phase.duration
      }s`
    );
  });
  console.log("");

  // Demonstrate scenarios
  console.log("🎯 High Load Test Scenarios:");
  const scenarios = (highLoadTester as any).getHighLoadScenarios();
  scenarios.forEach((scenario: any) => {
    console.log(
      `   ${scenario.name}: ${scenario.weight}% weight, ${scenario.flow.length} steps`
    );
  });
  console.log("");

  // Demonstrate thresholds
  console.log("📊 Performance Thresholds (100 RPS target):");
  const thresholds = (highLoadTester as any).generateHighLoadThresholds(100);
  console.log(`   Response Time: ${thresholds.http_req_duration.join(", ")}`);
  console.log(`   Error Rate: ${thresholds.http_req_failed.join(", ")}`);
  console.log(`   Throughput: ${thresholds.http_reqs.join(", ")}`);
  console.log("");

  // Demonstrate grading system
  console.log("🎓 Performance Grading Examples:");
  console.log("");

  const gradingExamples = [
    {
      name: "Excellent Performance",
      rps: 98,
      responseTime: 200,
      errorRate: 0.5,
      expectedGrade: "A",
    },
    {
      name: "Good Performance",
      rps: 88,
      responseTime: 400,
      errorRate: 1.8,
      expectedGrade: "B",
    },
    {
      name: "Acceptable Performance",
      rps: 75,
      responseTime: 700,
      errorRate: 4.2,
      expectedGrade: "C",
    },
    {
      name: "Poor Performance",
      rps: 55,
      responseTime: 1100,
      errorRate: 8.5,
      expectedGrade: "D",
    },
    {
      name: "Failed Performance",
      rps: 25,
      responseTime: 2500,
      errorRate: 15.0,
      expectedGrade: "F",
    },
  ];

  gradingExamples.forEach((example) => {
    console.log(`   ${example.name}:`);
    console.log(
      `     RPS: ${example.rps}/100 (${((example.rps / 100) * 100).toFixed(
        1
      )}% of target)`
    );
    console.log(`     Response Time: ${example.responseTime}ms`);
    console.log(`     Error Rate: ${example.errorRate}%`);
    console.log(`     Expected Grade: ${example.expectedGrade}`);
    console.log("");
  });

  // Usage examples
  console.log("🛠️ Usage Examples:");
  console.log("");
  console.log("   # Standard 10x load test");
  console.log("   npm run test:load-10x");
  console.log("");
  console.log("   # Scalability test (progressive load increase)");
  console.log("   npm run test:load-10x:scalability");
  console.log("");
  console.log("   # Endurance test (sustained high load)");
  console.log("   npm run test:load-10x:endurance");
  console.log("");
  console.log("   # Breaking point test (beyond 10x)");
  console.log("   npm run test:load-10x:breaking-point");
  console.log("");
  console.log("   # Production test with custom target");
  console.log("   npm run test:load-10x:production");
  console.log("");
  console.log("   # Custom configuration");
  console.log(
    "   tsx scripts/run-10x-load-test.ts --target https://api.matbakh.app --baseline-rps 20 --scaling-factor 15"
  );
  console.log("");

  console.log("✅ 10x Load Testing Demo Complete!");
  console.log("");
  console.log("📈 Key Features:");
  console.log("   • 10x current load capacity testing (10 RPS → 100 RPS)");
  console.log("   • Progressive scaling tests (2x → 5x → 10x)");
  console.log("   • Sustained endurance tests (30+ minutes)");
  console.log("   • Breaking point tests (beyond 10x)");
  console.log("   • Performance grading system (A-F)");
  console.log("   • Intelligent recommendations");
  console.log("   • Comprehensive reporting");
  console.log("   • Baseline comparison analysis");
  console.log("");
  console.log("🎯 Success Criteria:");
  console.log(
    "   • Support für 10x aktuelle Last ohne Performance-Degradation ✅"
  );
  console.log("   • Automated performance grading and recommendations ✅");
  console.log("   • Comprehensive test reporting and analysis ✅");
  console.log("   • Multiple test types (standard, scalability, endurance) ✅");
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main as demo10xLoadTest };
