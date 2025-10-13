#!/usr/bin/env tsx
/**
 * Debug Feature Flag Operations
 */

import { AiFeatureFlags } from "./src/lib/ai-orchestrator/ai-feature-flags";

async function debugFeatureFlags() {
  console.log("🔍 Debugging Feature Flag Operations");

  const featureFlags = new AiFeatureFlags();

  try {
    console.log("1. Testing Bedrock Support Mode...");

    // Test setting and getting Bedrock Support Mode
    console.log("   Setting to true...");
    await featureFlags.setBedrockSupportModeEnabled(true);

    console.log("   Getting value...");
    const value1 = await featureFlags.isBedrockSupportModeEnabled();
    console.log(`   Result: ${value1} (expected: true)`);

    console.log("   Setting to false...");
    await featureFlags.setBedrockSupportModeEnabled(false);

    console.log("   Getting value...");
    const value2 = await featureFlags.isBedrockSupportModeEnabled();
    console.log(`   Result: ${value2} (expected: false)`);

    console.log("2. Testing Provider Operations...");

    console.log("   Setting bedrock provider to true...");
    await featureFlags.setProviderEnabled("bedrock", true);

    console.log("   Getting bedrock provider value...");
    const providerValue1 = await featureFlags.isProviderEnabled("bedrock");
    console.log(`   Result: ${providerValue1} (expected: true)`);

    console.log("   Setting bedrock provider to false...");
    await featureFlags.setProviderEnabled("bedrock", false);

    console.log("   Getting bedrock provider value...");
    const providerValue2 = await featureFlags.isProviderEnabled("bedrock");
    console.log(`   Result: ${providerValue2} (expected: false)`);

    console.log("3. Testing Generic Flags...");

    console.log("   Setting generic flag to true...");
    featureFlags.setFlag("test.flag", true);

    console.log("   Getting generic flag value...");
    const genericValue1 = featureFlags.getFlag("test.flag");
    console.log(`   Result: ${genericValue1} (expected: true)`);

    console.log("   Setting generic flag to false...");
    featureFlags.setFlag("test.flag", false);

    console.log("   Getting generic flag value...");
    const genericValue2 = featureFlags.getFlag("test.flag");
    console.log(`   Result: ${genericValue2} (expected: false)`);

    console.log("✅ All tests completed successfully!");
  } catch (error) {
    console.error("❌ Error during testing:", error);
  }
}

debugFeatureFlags().catch(console.error);
