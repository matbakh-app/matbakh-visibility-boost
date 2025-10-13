#!/usr/bin/env tsx
/**
 * Debug Concurrent Flag Operations
 */

import { AiFeatureFlagsTest } from "./src/lib/ai-orchestrator/ai-feature-flags-test.js";

async function debugConcurrentFlags() {
  console.log("🔍 Debugging Concurrent Flag Operations");

  const featureFlags = new AiFeatureFlagsTest();

  let successCount = 0;
  let failureCount = 0;

  // Test 100 operations with concurrency of 5
  const totalOperations = 100;
  const concurrency = 5;
  const batches = Math.ceil(totalOperations / concurrency);

  for (let batch = 0; batch < batches; batch++) {
    const batchPromises = [];
    const batchStart = batch * concurrency;
    const batchEnd = Math.min(batchStart + concurrency, totalOperations);

    for (let i = batchStart; i < batchEnd; i++) {
      batchPromises.push(testSingleOperation(featureFlags, i));
    }

    const batchResults = await Promise.allSettled(batchPromises);

    batchResults.forEach((result, index) => {
      const operationIndex = batchStart + index;
      if (result.status === "fulfilled") {
        if (result.value.success) {
          successCount++;
        } else {
          failureCount++;
          console.log(`❌ Operation ${operationIndex}: ${result.value.error}`);
        }
      } else {
        failureCount++;
        console.log(`❌ Operation ${operationIndex} failed:`, result.reason);
      }
    });
  }

  const successRate = (successCount / totalOperations) * 100;
  console.log(
    `\n📊 Results: ${successCount} success, ${failureCount} failures`
  );
  console.log(`📈 Success Rate: ${successRate}%`);

  if (successRate >= 99) {
    console.log("✅ Success rate meets requirement (≥99%)");
  } else {
    console.log("❌ Success rate below requirement (≥99%)");
  }
}

async function testSingleOperation(
  featureFlags: AiFeatureFlagsTest,
  iteration: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const shouldEnable = iteration % 2 === 0;

    // Set the flag
    await featureFlags.setBedrockSupportModeEnabled(shouldEnable);

    // Verify the flag
    const currentValue = await featureFlags.isBedrockSupportModeEnabled();

    if (currentValue === shouldEnable) {
      return { success: true };
    } else {
      return {
        success: false,
        error: `expected ${shouldEnable}, got ${currentValue}`,
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

debugConcurrentFlags().catch(console.error);
