#!/usr/bin/env tsx

/**
 * Infrastructure Audit Performance Test
 *
 * This script demonstrates the < 30 second infrastructure audit completion time requirement.
 */

import { BedrockAdapter } from "../src/lib/ai-orchestrator/adapters/bedrock-adapter";
import { AiFeatureFlags } from "../src/lib/ai-orchestrator/ai-feature-flags";
import { InfrastructureAuditor } from "../src/lib/ai-orchestrator/infrastructure-auditor";

// Mock implementations for testing
class MockBedrockAdapter extends BedrockAdapter {
  async healthCheck() {
    return {
      success: true,
      message: "Bedrock adapter is healthy",
      timestamp: new Date(),
    };
  }
}

class MockAiFeatureFlags extends AiFeatureFlags {
  isBedrockSupportModeEnabled(): boolean {
    return true;
  }
}

async function testInfrastructureAuditPerformance() {
  console.log("🔍 Infrastructure Audit Performance Test");
  console.log("========================================");

  // Create mock dependencies
  const mockBedrockAdapter = new MockBedrockAdapter();
  const mockFeatureFlags = new MockAiFeatureFlags();

  // Create infrastructure auditor with optimized configuration
  const auditor = new InfrastructureAuditor(
    mockBedrockAdapter,
    mockFeatureFlags,
    {
      healthCheckTimeout: 3000, // 3 seconds
      maxConcurrentChecks: 10, // Increased concurrency
    }
  );

  console.log("\n📊 Testing Standard Audit Performance...");

  // Test standard audit
  const standardStart = Date.now();
  const standardReport = await auditor.generateAuditReport();
  const standardDuration = Date.now() - standardStart;

  console.log(`✅ Standard audit completed in ${standardDuration}ms`);
  console.log(`   - Overall Score: ${standardReport.summary.overallScore}`);
  console.log(`   - Total Issues: ${standardReport.summary.totalIssues}`);
  console.log(`   - Critical Issues: ${standardReport.summary.criticalIssues}`);

  console.log("\n⚡ Testing Fast Audit Performance...");

  // Test fast audit (with < 30 second guarantee)
  const fastStart = Date.now();
  const fastReport = await auditor.generateFastAuditReport();
  const fastDuration = Date.now() - fastStart;

  console.log(`✅ Fast audit completed in ${fastDuration}ms`);
  console.log(`   - Overall Score: ${fastReport.summary.overallScore}`);
  console.log(`   - Total Issues: ${fastReport.summary.totalIssues}`);
  console.log(`   - Critical Issues: ${fastReport.summary.criticalIssues}`);
  console.log(`   - Within SLA: ${fastDuration < 30000 ? "✅ YES" : "❌ NO"}`);

  console.log("\n🎯 Performance Requirements Validation");
  console.log("=====================================");

  const slaRequirement = 30000; // 30 seconds
  const standardMeetsSLA = standardDuration < slaRequirement;
  const fastMeetsSLA = fastDuration < slaRequirement;

  console.log(
    `📋 Requirement: Infrastructure audit completion time < 30 seconds`
  );
  console.log(
    `   - Standard Audit: ${standardDuration}ms ${
      standardMeetsSLA ? "✅" : "❌"
    }`
  );
  console.log(
    `   - Fast Audit: ${fastDuration}ms ${fastMeetsSLA ? "✅" : "❌"}`
  );

  if (fastMeetsSLA) {
    console.log(
      "\n🎉 SUCCESS: Infrastructure audit performance requirement met!"
    );
    console.log(
      `   Fast audit provides ${(
        (slaRequirement - fastDuration) /
        1000
      ).toFixed(1)}s margin under the 30s limit`
    );
  } else {
    console.log(
      "\n❌ FAILURE: Infrastructure audit performance requirement not met!"
    );
  }

  console.log("\n🔧 Performance Optimizations Applied:");
  console.log("   - Reduced health check timeout: 10s → 3s");
  console.log("   - Increased concurrent checks: 5 → 10");
  console.log("   - Parallel execution of audit operations");
  console.log("   - Simplified consistency analysis for speed");
  console.log("   - Cached implementation gap detection");
  console.log("   - Timeout protection with 28s limit");

  console.log("\n📈 Performance Comparison:");
  console.log(
    `   - Speed improvement: ${(
      ((standardDuration - fastDuration) / standardDuration) *
      100
    ).toFixed(1)}% faster`
  );
  console.log(`   - Time saved: ${standardDuration - fastDuration}ms`);

  return {
    standardDuration,
    fastDuration,
    standardMeetsSLA,
    fastMeetsSLA,
    requirement: slaRequirement,
  };
}

// Run the test if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testInfrastructureAuditPerformance()
    .then((results) => {
      process.exit(results.fastMeetsSLA ? 0 : 1);
    })
    .catch((error) => {
      console.error("❌ Performance test failed:", error);
      process.exit(1);
    });
}

export { testInfrastructureAuditPerformance };
