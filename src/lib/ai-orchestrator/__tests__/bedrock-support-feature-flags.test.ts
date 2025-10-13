/**
 * Bedrock Support Mode Feature Flags Tests
 */

import { AiFeatureFlags } from "../ai-feature-flags";

describe("Bedrock Support Mode Feature Flags", () => {
  let featureFlags: AiFeatureFlags;

  beforeEach(() => {
    featureFlags = new AiFeatureFlags();
  });

  describe("ENABLE_BEDROCK_SUPPORT_MODE", () => {
    it("should default to false for safety", async () => {
      const result = await featureFlags.isBedrockSupportModeEnabled();
      expect(result).toBe(false);
    });

    it("should be able to enable Bedrock Support Mode", async () => {
      await featureFlags.setBedrockSupportModeEnabled(true);
      const result = await featureFlags.isBedrockSupportModeEnabled();
      expect(result).toBe(true);
    });

    it("should be able to disable Bedrock Support Mode", async () => {
      await featureFlags.setBedrockSupportModeEnabled(true);
      await featureFlags.setBedrockSupportModeEnabled(false);
      const result = await featureFlags.isBedrockSupportModeEnabled();
      expect(result).toBe(false);
    });

    it("should be accessible via generic getFlag method", () => {
      const result = featureFlags.getFlag("ENABLE_BEDROCK_SUPPORT_MODE");
      expect(result).toBe(false);
    });
  });

  describe("ENABLE_INTELLIGENT_ROUTING", () => {
    it("should default to false for safety", async () => {
      const result = await featureFlags.isIntelligentRoutingEnabled();
      expect(result).toBe(false);
    });

    it("should be able to enable Intelligent Routing", async () => {
      await featureFlags.setIntelligentRoutingEnabled(true);
      const result = await featureFlags.isIntelligentRoutingEnabled();
      expect(result).toBe(true);
    });

    it("should be able to disable Intelligent Routing", async () => {
      await featureFlags.setIntelligentRoutingEnabled(true);
      await featureFlags.setIntelligentRoutingEnabled(false);
      const result = await featureFlags.isIntelligentRoutingEnabled();
      expect(result).toBe(false);
    });
  });

  describe("ENABLE_DIRECT_BEDROCK_FALLBACK", () => {
    it("should default to false for safety", async () => {
      const result = await featureFlags.isDirectBedrockFallbackEnabled();
      expect(result).toBe(false);
    });

    it("should be able to enable Direct Bedrock Fallback", async () => {
      await featureFlags.setDirectBedrockFallbackEnabled(true);
      const result = await featureFlags.isDirectBedrockFallbackEnabled();
      expect(result).toBe(true);
    });

    it("should be able to disable Direct Bedrock Fallback", async () => {
      await featureFlags.setDirectBedrockFallbackEnabled(true);
      await featureFlags.setDirectBedrockFallbackEnabled(false);
      const result = await featureFlags.isDirectBedrockFallbackEnabled();
      expect(result).toBe(false);
    });
  });

  describe("Feature Flag Independence", () => {
    it("should control routing behavior independently", async () => {
      // Enable support mode but not routing
      await featureFlags.setBedrockSupportModeEnabled(true);
      await featureFlags.setIntelligentRoutingEnabled(false);
      await featureFlags.setDirectBedrockFallbackEnabled(false);

      expect(await featureFlags.isBedrockSupportModeEnabled()).toBe(true);
      expect(await featureFlags.isIntelligentRoutingEnabled()).toBe(false);
      expect(await featureFlags.isDirectBedrockFallbackEnabled()).toBe(false);

      // Enable routing but not fallback
      await featureFlags.setIntelligentRoutingEnabled(true);

      expect(await featureFlags.isBedrockSupportModeEnabled()).toBe(true);
      expect(await featureFlags.isIntelligentRoutingEnabled()).toBe(true);
      expect(await featureFlags.isDirectBedrockFallbackEnabled()).toBe(false);

      // Enable all flags
      await featureFlags.setDirectBedrockFallbackEnabled(true);

      expect(await featureFlags.isBedrockSupportModeEnabled()).toBe(true);
      expect(await featureFlags.isIntelligentRoutingEnabled()).toBe(true);
      expect(await featureFlags.isDirectBedrockFallbackEnabled()).toBe(true);
    });
  });

  describe("Flag State Logging", () => {
    it("should include new flags in getAllFlags output", async () => {
      const allFlags = featureFlags.getAllFlags();

      expect(allFlags).toHaveProperty("ENABLE_BEDROCK_SUPPORT_MODE", false);
      expect(allFlags).toHaveProperty("ENABLE_INTELLIGENT_ROUTING", false);
      expect(allFlags).toHaveProperty("ENABLE_DIRECT_BEDROCK_FALLBACK", false);
    });

    it("should reflect flag changes in getAllFlags output", async () => {
      await featureFlags.setBedrockSupportModeEnabled(true);
      await featureFlags.setIntelligentRoutingEnabled(true);

      const allFlags = featureFlags.getAllFlags();

      expect(allFlags).toHaveProperty("ENABLE_BEDROCK_SUPPORT_MODE", true);
      expect(allFlags).toHaveProperty("ENABLE_INTELLIGENT_ROUTING", true);
      expect(allFlags).toHaveProperty("ENABLE_DIRECT_BEDROCK_FALLBACK", false);
    });
  });

  describe("Safety Defaults", () => {
    it("should maintain safe defaults for all Bedrock support flags", () => {
      const allFlags = featureFlags.getAllFlags();

      // All Bedrock support flags should default to false for safety
      expect(allFlags["ENABLE_BEDROCK_SUPPORT_MODE"]).toBe(false);
      expect(allFlags["ENABLE_INTELLIGENT_ROUTING"]).toBe(false);
      expect(allFlags["ENABLE_DIRECT_BEDROCK_FALLBACK"]).toBe(false);
    });

    it("should not affect existing provider flags", () => {
      const allFlags = featureFlags.getAllFlags();

      // Existing provider flags should remain enabled by default
      expect(allFlags["ai.provider.bedrock.enabled"]).toBe(true);
      expect(allFlags["ai.provider.google.enabled"]).toBe(true);
      expect(allFlags["ai.provider.meta.enabled"]).toBe(true);
      expect(allFlags["ai.caching.enabled"]).toBe(true);
      expect(allFlags["ai.monitoring.enabled"]).toBe(true);
    });
  });

  describe("Feature Flag Validation", () => {
    describe("validateBedrockSupportModeFlags", () => {
      it("should pass validation when all flags are properly configured", async () => {
        // Enable all required flags
        await featureFlags.setProviderEnabled("bedrock", true);
        await featureFlags.setBedrockSupportModeEnabled(true);
        await featureFlags.setIntelligentRoutingEnabled(true);

        const result = await featureFlags.validateBedrockSupportModeFlags();

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it("should fail validation when Bedrock provider is disabled but support mode is enabled", async () => {
        await featureFlags.setProviderEnabled("bedrock", false);
        await featureFlags.setBedrockSupportModeEnabled(true);

        const result = await featureFlags.validateBedrockSupportModeFlags();

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(
          "Bedrock Support Mode requires Bedrock provider to be enabled"
        );
      });

      it("should warn when support mode is enabled without intelligent routing", async () => {
        await featureFlags.setProviderEnabled("bedrock", true);
        await featureFlags.setBedrockSupportModeEnabled(true);
        await featureFlags.setIntelligentRoutingEnabled(false);

        const result = await featureFlags.validateBedrockSupportModeFlags();

        expect(result.isValid).toBe(true);
        expect(result.warnings).toContain(
          "Bedrock Support Mode works best with Intelligent Routing enabled"
        );
      });

      it("should warn when direct fallback is enabled without support mode", async () => {
        await featureFlags.setBedrockSupportModeEnabled(false);
        await featureFlags.setDirectBedrockFallbackEnabled(true);

        const result = await featureFlags.validateBedrockSupportModeFlags();

        expect(result.warnings).toContain(
          "Direct Bedrock Fallback is enabled but Support Mode is disabled"
        );
      });
    });

    describe("validateAllFlags", () => {
      it("should pass validation with default configuration", async () => {
        const result = await featureFlags.validateAllFlags();

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it("should fail validation when no providers are enabled", async () => {
        await featureFlags.setProviderEnabled("bedrock", false);
        await featureFlags.setProviderEnabled("google", false);
        await featureFlags.setProviderEnabled("meta", false);

        const result = await featureFlags.validateAllFlags();

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(
          "At least one AI provider must be enabled"
        );
      });

      it("should warn when monitoring is disabled", async () => {
        featureFlags.setFlag("ai.monitoring.enabled", false);

        const result = await featureFlags.validateAllFlags();

        expect(result.warnings).toContain(
          "Monitoring is disabled - this may impact observability"
        );
      });

      it("should warn when caching is disabled", async () => {
        featureFlags.setFlag("ai.caching.enabled", false);

        const result = await featureFlags.validateAllFlags();

        expect(result.warnings).toContain(
          "Caching is disabled - this may impact performance"
        );
      });
    });
  });

  describe("Environment Configuration", () => {
    describe("getBedrockSupportModeConfig", () => {
      it("should return current configuration", async () => {
        await featureFlags.setBedrockSupportModeEnabled(true);
        await featureFlags.setIntelligentRoutingEnabled(true);
        await featureFlags.setDirectBedrockFallbackEnabled(false);

        const config = await featureFlags.getBedrockSupportModeConfig();

        expect(config.supportModeEnabled).toBe(true);
        expect(config.intelligentRoutingEnabled).toBe(true);
        expect(config.directBedrockFallbackEnabled).toBe(false);
        expect(config.environment).toBe("development"); // Default in test environment
      });
    });

    describe("applyEnvironmentConfiguration", () => {
      it("should apply development configuration", async () => {
        await featureFlags.applyEnvironmentConfiguration("development");

        expect(await featureFlags.isBedrockSupportModeEnabled()).toBe(false);
        expect(await featureFlags.isIntelligentRoutingEnabled()).toBe(true);
        expect(await featureFlags.isDirectBedrockFallbackEnabled()).toBe(false);
      });

      it("should apply staging configuration", async () => {
        await featureFlags.applyEnvironmentConfiguration("staging");

        expect(await featureFlags.isBedrockSupportModeEnabled()).toBe(false);
        expect(await featureFlags.isIntelligentRoutingEnabled()).toBe(true);
        expect(await featureFlags.isDirectBedrockFallbackEnabled()).toBe(true);
      });

      it("should apply production configuration", async () => {
        await featureFlags.applyEnvironmentConfiguration("production");

        expect(await featureFlags.isBedrockSupportModeEnabled()).toBe(false);
        expect(await featureFlags.isIntelligentRoutingEnabled()).toBe(true);
        expect(await featureFlags.isDirectBedrockFallbackEnabled()).toBe(true);
      });
    });

    describe("Environment-specific configuration methods", () => {
      it("should return environment-specific configuration", () => {
        const devConfig = featureFlags.getEnvironmentConfig("development");
        const stagingConfig = featureFlags.getEnvironmentConfig("staging");
        const prodConfig = featureFlags.getEnvironmentConfig("production");

        expect(devConfig.auditInterval).toBe(300000); // 5 minutes
        expect(devConfig.monitoringLevel).toBe("comprehensive");
        expect(devConfig.autoResolutionEnabled).toBe(true);

        expect(stagingConfig.auditInterval).toBe(600000); // 10 minutes
        expect(stagingConfig.monitoringLevel).toBe("detailed");
        expect(stagingConfig.autoResolutionEnabled).toBe(true);

        expect(prodConfig.auditInterval).toBe(1800000); // 30 minutes
        expect(prodConfig.monitoringLevel).toBe("basic");
        expect(prodConfig.autoResolutionEnabled).toBe(false);
      });

      it("should update environment-specific configuration", () => {
        featureFlags.updateEnvironmentConfig("development", {
          auditInterval: 120000, // 2 minutes
          monitoringLevel: "basic",
        });

        const devConfig = featureFlags.getEnvironmentConfig("development");
        expect(devConfig.auditInterval).toBe(120000);
        expect(devConfig.monitoringLevel).toBe("basic");
        // Other properties should remain unchanged
        expect(devConfig.autoResolutionEnabled).toBe(true);
      });

      it("should return audit interval for current environment", () => {
        const auditInterval = featureFlags.getAuditInterval();
        expect(typeof auditInterval).toBe("number");
        expect(auditInterval).toBeGreaterThan(0);
      });

      it("should return monitoring level for current environment", () => {
        const monitoringLevel = featureFlags.getMonitoringLevel();
        expect(["basic", "detailed", "comprehensive"]).toContain(
          monitoringLevel
        );
      });

      it("should return auto-resolution status for current environment", () => {
        const autoResolutionEnabled = featureFlags.isAutoResolutionEnabled();
        expect(typeof autoResolutionEnabled).toBe("boolean");
      });
    });
  });

  describe("Safe Operations", () => {
    describe("enableBedrockSupportModeSafely", () => {
      it("should successfully enable support mode when prerequisites are met", async () => {
        const result = await featureFlags.enableBedrockSupportModeSafely();

        expect(result.isValid).toBe(true);
        expect(await featureFlags.isBedrockSupportModeEnabled()).toBe(true);
        expect(await featureFlags.isProviderEnabled("bedrock")).toBe(true);
        expect(await featureFlags.isIntelligentRoutingEnabled()).toBe(true);
      });

      it("should fail when bedrock provider is disabled", async () => {
        // Disable bedrock provider to cause validation failure
        await featureFlags.setProviderEnabled("bedrock", false);

        const result = await featureFlags.enableBedrockSupportModeSafely();

        expect(result.isValid).toBe(false);
        expect(await featureFlags.isBedrockSupportModeEnabled()).toBe(false);
        expect(result.errors[0]).toContain(
          "Cannot enable Bedrock Support Mode: Bedrock provider is not enabled"
        );
      });
    });

    describe("disableBedrockSupportModeSafely", () => {
      it("should safely disable support mode and related flags", async () => {
        // First enable everything
        await featureFlags.setBedrockSupportModeEnabled(true);
        await featureFlags.setDirectBedrockFallbackEnabled(true);
        await featureFlags.setIntelligentRoutingEnabled(true);

        await featureFlags.disableBedrockSupportModeSafely();

        expect(await featureFlags.isBedrockSupportModeEnabled()).toBe(false);
        expect(await featureFlags.isDirectBedrockFallbackEnabled()).toBe(false);
        // Intelligent routing should remain enabled as it may be used by other features
        expect(await featureFlags.isIntelligentRoutingEnabled()).toBe(true);
      });
    });
  });
});
