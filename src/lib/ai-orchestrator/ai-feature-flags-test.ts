/**
 * AI Feature Flags for Testing
 *
 * A version of AiFeatureFlags that doesn't apply test environment restrictions
 */

import { AiFeatureFlags, AiFeatureFlagsOptions } from "./ai-feature-flags";

export class AiFeatureFlagsTest extends AiFeatureFlags {
  constructor(options: AiFeatureFlagsOptions = {}) {
    super(options);

    // Override test defaults to allow normal operation in tests
    this.initializeForTesting();
  }

  /**
   * Initialize flags for testing without test environment restrictions
   */
  private initializeForTesting(): void {
    // Set all flags to their normal defaults, not test defaults
    this.setFlag("ENABLE_BEDROCK_SUPPORT_MODE", false);
    this.setFlag("ENABLE_INTELLIGENT_ROUTING", true);
    this.setFlag("ENABLE_DIRECT_BEDROCK_FALLBACK", false);
    this.setFlag("ai.provider.bedrock.enabled", true);
    this.setFlag("ai.provider.google.enabled", true);
    this.setFlag("ai.provider.meta.enabled", true);
    this.setFlag("ai.caching.enabled", true);
    this.setFlag("ai.monitoring.enabled", true);
    this.setFlag("ai.performance.optimization.enabled", true);
    this.setFlag("ai.security.enhanced.enabled", true);
  }

  /**
   * Override the test environment check to always return false
   */
  protected isTestEnvironment(): boolean {
    return false;
  }
}
