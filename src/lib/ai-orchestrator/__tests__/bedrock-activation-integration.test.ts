/**
 * Bedrock Activation Integration Tests
 * Tests the feature flag toggle functionality for Bedrock activation
 */

import { AiFeatureFlags } from "../ai-feature-flags";

describe("Bedrock Activation Feature Flags", () => {
  let featureFlags: AiFeatureFlags;

  beforeEach(() => {
    featureFlags = new AiFeatureFlags();
  });

  describe("Bedrock Support Mode", () => {
    it("should be disabled by default", async () => {
      const isEnabled = await featureFlags.isBedrockSupportModeEnabled();
      expect(isEnabled).toBe(false);
    });

    it("should allow enabling support mode", async () => {
      await featureFlags.setBedrockSupportModeEnabled(true);
      const isEnabled = await featureFlags.isBedrockSupportModeEnabled();
      expect(isEnabled).toBe(true);
    });

    it("should allow disabling support mode", async () => {
      await featureFlags.setBedrockSupportModeEnabled(true);
      await featureFlags.setBedrockSupportModeEnabled(false);
      const isEnabled = await featureFlags.isBedrockSupportModeEnabled();
      expect(isEnabled).toBe(false);
    });
  });

  describe("Intelligent Routing", () => {
    it("should allow enabling intelligent routing", async () => {
      await featureFlags.setIntelligentRoutingEnabled(true);
      const isEnabled = await featureFlags.isIntelligentRoutingEnabled();
      expect(isEnabled).toBe(true);
    });

    it("should allow disabling intelligent routing", async () => {
      await featureFlags.setIntelligentRoutingEnabled(true);
      await featureFlags.setIntelligentRoutingEnabled(false);
      const isEnabled = await featureFlags.isIntelligentRoutingEnabled();
      expect(isEnabled).toBe(false);
    });
  });

  describe("Direct Bedrock Fallback", () => {
    it("should allow enabling direct fallback", async () => {
      await featureFlags.setDirectBedrockFallbackEnabled(true);
      const isEnabled = await featureFlags.isDirectBedrockFallbackEnabled();
      expect(isEnabled).toBe(true);
    });

    it("should allow disabling direct fallback", async () => {
      await featureFlags.setDirectBedrockFallbackEnabled(true);
      await featureFlags.setDirectBedrockFallbackEnabled(false);
      const isEnabled = await featureFlags.isDirectBedrockFallbackEnabled();
      expect(isEnabled).toBe(false);
    });
  });

  describe("Safe Activation", () => {
    it("should safely enable support mode when bedrock provider is enabled", async () => {
      // Enable bedrock provider first
      await featureFlags.setProviderEnabled("bedrock", true);

      const result = await featureFlags.enableBedrockSupportModeSafely();

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);

      const isEnabled = await featureFlags.isBedrockSupportModeEnabled();
      expect(isEnabled).toBe(true);
    });

    it("should fail to enable support mode when bedrock provider is disabled", async () => {
      // Ensure bedrock provider is disabled
      await featureFlags.setProviderEnabled("bedrock", false);

      const result = await featureFlags.enableBedrockSupportModeSafely();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Cannot enable Bedrock Support Mode: Bedrock provider is not enabled"
      );

      const isEnabled = await featureFlags.isBedrockSupportModeEnabled();
      expect(isEnabled).toBe(false);
    });

    it("should safely disable support mode", async () => {
      // First enable it
      await featureFlags.setProviderEnabled("bedrock", true);
      await featureFlags.enableBedrockSupportModeSafely();

      // Then disable it
      await featureFlags.disableBedrockSupportModeSafely();

      const supportModeEnabled =
        await featureFlags.isBedrockSupportModeEnabled();
      const directFallbackEnabled =
        await featureFlags.isDirectBedrockFallbackEnabled();

      expect(supportModeEnabled).toBe(false);
      expect(directFallbackEnabled).toBe(false);
    });
  });

  describe("Configuration Validation", () => {
    it("should validate bedrock support mode flags", async () => {
      // Enable bedrock provider and support mode
      await featureFlags.setProviderEnabled("bedrock", true);
      await featureFlags.setBedrockSupportModeEnabled(true);
      await featureFlags.setIntelligentRoutingEnabled(true);

      const validation = await featureFlags.validateBedrockSupportModeFlags();

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it("should detect invalid configuration", async () => {
      // Enable support mode without bedrock provider
      await featureFlags.setProviderEnabled("bedrock", false);
      await featureFlags.setBedrockSupportModeEnabled(true);

      const validation = await featureFlags.validateBedrockSupportModeFlags();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain(
        "Bedrock Support Mode requires Bedrock provider to be enabled"
      );
    });

    it("should provide warnings for suboptimal configuration", async () => {
      // Enable support mode without intelligent routing
      await featureFlags.setProviderEnabled("bedrock", true);
      await featureFlags.setBedrockSupportModeEnabled(true);
      await featureFlags.setIntelligentRoutingEnabled(false);

      const validation = await featureFlags.validateBedrockSupportModeFlags();

      expect(validation.warnings).toContain(
        "Bedrock Support Mode works best with Intelligent Routing enabled"
      );
    });
  });

  describe("Configuration Retrieval", () => {
    it("should return current bedrock support mode configuration", async () => {
      await featureFlags.setBedrockSupportModeEnabled(true);
      await featureFlags.setIntelligentRoutingEnabled(true);
      await featureFlags.setDirectBedrockFallbackEnabled(true);

      const config = await featureFlags.getBedrockSupportModeConfig();

      expect(config.supportModeEnabled).toBe(true);
      expect(config.intelligentRoutingEnabled).toBe(true);
      expect(config.directBedrockFallbackEnabled).toBe(true);
      expect(config.environment).toBeDefined();
    });
  });

  describe("Environment Configuration", () => {
    it("should provide environment-specific configuration", () => {
      const devConfig = featureFlags.getEnvironmentConfig("development");
      const prodConfig = featureFlags.getEnvironmentConfig("production");

      expect(devConfig.supportModeEnabled).toBe(false); // Safety first
      expect(devConfig.monitoringLevel).toBe("comprehensive");

      expect(prodConfig.supportModeEnabled).toBe(false); // Safety first
      expect(prodConfig.monitoringLevel).toBe("basic");
    });

    it("should allow updating environment configuration", () => {
      featureFlags.updateEnvironmentConfig("development", {
        supportModeEnabled: true,
        auditInterval: 60000,
      });

      const config = featureFlags.getEnvironmentConfig("development");
      expect(config.supportModeEnabled).toBe(true);
      expect(config.auditInterval).toBe(60000);
    });
  });
});
