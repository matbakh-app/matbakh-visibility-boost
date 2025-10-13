#!/usr/bin/env tsx
/**
 * Debug Async Flag Operations
 */

import { AiFeatureFlagsTest } from "./src/lib/ai-orchestrator/ai-feature-flags-test.js";

async function debugAsyncFlags() {
  console.log("🔍 Debugging Async Flag Operations");

  const featureFlags = new AiFeatureFlagsTest();

  let successCount = 0;
  let failureCount = 0;

  // Test 100 operations on ENABLE_BEDROCK_SUPPORT_MODE
  for (let i = 0; i < 100; i++) {
    try {
      const shouldEnable = i % 2 === 0;

      // Set the flag
      await featureFlags.setBedrockSupportModeEnabled(shouldEnable);

      // Verify the flag
      const currentValue = await featureFlags.isBedrockSupportModeEnabled();

      if (currentValue === shouldEnable) {
        successCount++;
      } else {
        failureCount++;
        console.log(
          `❌ Operation ${i}: expected ${shouldEnable}, got ${currentValue}`
        );
      }
    } catch (error) {
      failureCount++;
      console.log(`❌ Operation ${i} failed:`, error);
    }
  }

  const successRate = (successCount / 100) * 100;
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

debugAsyncFlags().catch(console.error);
