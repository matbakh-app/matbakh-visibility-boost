/**
 * Bedrock Configuration Loader Tests
 */

import {
  BedrockConfigLoader,
  getBedrockConfig,
  validateBedrockConfig,
} from "../bedrock-config-loader";

// Mock environment variables
const mockEnv = {
  VITE_ENABLE_BEDROCK_SUPPORT_MODE: "false",
  VITE_ENABLE_INTELLIGENT_ROUTING: "true",
  VITE_ENABLE_DIRECT_BEDROCK_FALLBACK: "false",
  VITE_BEDROCK_AUDIT_INTERVAL: "300000",
  VITE_BEDROCK_MONITORING_LEVEL: "comprehensive",
  VITE_BEDROCK_AUTO_RESOLUTION_ENABLED: "true",
  VITE_BEDROCK_DEBUG_MODE: "true",
  VITE_BEDROCK_VERBOSE_LOGGING: "true",
  VITE_BEDROCK_MOCK_INFRASTRUCTURE_AUDIT: "true",
  VITE_AWS_REGION: "eu-central-1",
  VITE_BEDROCK_MODEL_ID: "anthropic.claude-3-5-sonnet-20241022-v2:0",
  VITE_BEDROCK_RATE_LIMIT_ENABLED: "true",
  VITE_BEDROCK_COST_LIMIT_ENABLED: "true",
  VITE_BEDROCK_MAX_REQUESTS_PER_MINUTE: "10",
  VITE_BEDROCK_NOTIFICATION_CHANNELS: "console,webhook",
  VITE_BEDROCK_WEBHOOK_URL: "http://localhost:3001/bedrock-notifications",
};

// Mock process.env for Node.js environment (Jest)
Object.assign(process.env, mockEnv);

describe("BedrockConfigLoader", () => {
  let loader: BedrockConfigLoader;

  beforeEach(() => {
    // Reset singleton instance
    (BedrockConfigLoader as any).instance = undefined;
    loader = BedrockConfigLoader.getInstance();
  });

  describe("Singleton Pattern", () => {
    it("should return the same instance", () => {
      const loader1 = BedrockConfigLoader.getInstance();
      const loader2 = BedrockConfigLoader.getInstance();
      expect(loader1).toBe(loader2);
    });
  });

  describe("Configuration Loading", () => {
    it("should load development configuration", () => {
      const config = loader.loadConfig("development");

      expect(config.supportModeEnabled).toBe(false);
      expect(config.intelligentRoutingEnabled).toBe(true);
      expect(config.directBedrockFallbackEnabled).toBe(false);
      expect(config.auditInterval).toBe(300000);
      expect(config.monitoringLevel).toBe("comprehensive");
      expect(config.autoResolutionEnabled).toBe(true);
      expect(config.debugMode).toBe(true);
      expect(config.verboseLogging).toBe(true);
      expect(config.mockInfrastructureAudit).toBe(true);
      expect(config.awsRegion).toBe("eu-central-1");
      expect(config.bedrockModelId).toBe(
        "anthropic.claude-3-5-sonnet-20241022-v2:0"
      );
      expect(config.rateLimitEnabled).toBe(true);
      expect(config.costLimitEnabled).toBe(true);
      expect(config.maxRequestsPerMinute).toBe(10);
      expect(config.notificationChannels).toEqual(["console", "webhook"]);
      expect(config.webhookUrl).toBe(
        "http://localhost:3001/bedrock-notifications"
      );
    });

    it("should load staging configuration with different defaults", () => {
      // Mock staging environment variables
      const stagingEnv = {
        ...mockEnv,
        VITE_ENABLE_DIRECT_BEDROCK_FALLBACK: "true",
        VITE_BEDROCK_AUDIT_INTERVAL: "600000",
        VITE_BEDROCK_MONITORING_LEVEL: "detailed",
        VITE_BEDROCK_DEBUG_MODE: "false",
        VITE_BEDROCK_VERBOSE_LOGGING: "false",
        VITE_BEDROCK_MOCK_INFRASTRUCTURE_AUDIT: "false",
        VITE_BEDROCK_MAX_REQUESTS_PER_MINUTE: "30",
        VITE_BEDROCK_NOTIFICATION_CHANNELS: "slack,webhook",
        VITE_BEDROCK_ENABLE_CANARY_TESTING: "true",
        VITE_BEDROCK_CANARY_PERCENTAGE: "10",
      };

      // Update mock environment
      Object.assign(process.env, stagingEnv);

      // Reset and reload
      (BedrockConfigLoader as any).instance = undefined;
      loader = BedrockConfigLoader.getInstance();

      const config = loader.loadConfig("staging");

      expect(config.directBedrockFallbackEnabled).toBe(true);
      expect(config.auditInterval).toBe(600000);
      expect(config.monitoringLevel).toBe("detailed");
      expect(config.debugMode).toBe(false);
      expect(config.verboseLogging).toBe(false);
      expect(config.mockInfrastructureAudit).toBe(false);
      expect(config.maxRequestsPerMinute).toBe(30);
      expect(config.notificationChannels).toEqual(["slack", "webhook"]);
      expect(config.enableCanaryTesting).toBe(true);
      expect(config.canaryPercentage).toBe(10);
    });

    it("should load production configuration with production defaults", () => {
      // Mock production environment variables
      const prodEnv = {
        ...mockEnv,
        VITE_ENABLE_DIRECT_BEDROCK_FALLBACK: "true",
        VITE_BEDROCK_AUDIT_INTERVAL: "1800000",
        VITE_BEDROCK_MONITORING_LEVEL: "basic",
        VITE_BEDROCK_AUTO_RESOLUTION_ENABLED: "false",
        VITE_BEDROCK_DEBUG_MODE: "false",
        VITE_BEDROCK_VERBOSE_LOGGING: "false",
        VITE_BEDROCK_MOCK_INFRASTRUCTURE_AUDIT: "false",
        VITE_BEDROCK_MAX_REQUESTS_PER_MINUTE: "100",
        VITE_BEDROCK_NOTIFICATION_CHANNELS: "slack,pagerduty,webhook",
        VITE_BEDROCK_CIRCUIT_BREAKER_ENABLED: "true",
        VITE_BEDROCK_CIRCUIT_BREAKER_THRESHOLD: "5",
        VITE_BEDROCK_CIRCUIT_BREAKER_TIMEOUT: "60000",
        VITE_BEDROCK_AUDIT_TRAIL_ENABLED: "true",
        VITE_BEDROCK_GDPR_COMPLIANCE_ENABLED: "true",
        VITE_BEDROCK_PII_DETECTION_ENABLED: "true",
      };

      // Update mock environment
      Object.assign(process.env, prodEnv);

      // Reset and reload
      (BedrockConfigLoader as any).instance = undefined;
      loader = BedrockConfigLoader.getInstance();

      const config = loader.loadConfig("production");

      expect(config.directBedrockFallbackEnabled).toBe(true);
      expect(config.auditInterval).toBe(1800000);
      expect(config.monitoringLevel).toBe("basic");
      expect(config.autoResolutionEnabled).toBe(false);
      expect(config.debugMode).toBe(false);
      expect(config.verboseLogging).toBe(false);
      expect(config.mockInfrastructureAudit).toBe(false);
      expect(config.maxRequestsPerMinute).toBe(100);
      expect(config.notificationChannels).toEqual([
        "slack",
        "pagerduty",
        "webhook",
      ]);
      expect(config.circuitBreakerEnabled).toBe(true);
      expect(config.circuitBreakerThreshold).toBe(5);
      expect(config.circuitBreakerTimeout).toBe(60000);
      expect(config.auditTrailEnabled).toBe(true);
      expect(config.gdprComplianceEnabled).toBe(true);
      expect(config.piiDetectionEnabled).toBe(true);
    });

    it("should cache configuration after first load", () => {
      const config1 = loader.loadConfig("development");
      const config2 = loader.getConfig();

      expect(config1).toBe(config2);
    });

    it("should reload configuration when requested", () => {
      const config1 = loader.loadConfig("development");

      // Change environment variables
      process.env.VITE_BEDROCK_AUDIT_INTERVAL = "900000";

      const config2 = loader.reloadConfig("development");

      expect(config1).not.toBe(config2);
      expect(config2.auditInterval).toBe(900000);
    });

    it("should throw error when getting config before loading", () => {
      expect(() => loader.getConfig()).toThrow(
        "Configuration not loaded. Call loadConfig() first."
      );
    });
  });

  describe("Configuration Validation", () => {
    it("should validate valid configuration", () => {
      const config = loader.loadConfig("development");
      const validation = loader.validateConfig(config);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it("should detect invalid audit interval", () => {
      const config = loader.loadConfig("development");
      config.auditInterval = 30000; // Less than 1 minute

      const validation = loader.validateConfig(config);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain(
        "Audit interval must be at least 60 seconds"
      );
    });

    it("should detect invalid rate limit", () => {
      const config = loader.loadConfig("development");
      config.maxRequestsPerMinute = 0;

      const validation = loader.validateConfig(config);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain(
        "Max requests per minute must be at least 1"
      );
    });

    it("should warn about missing notification channels", () => {
      const config = loader.loadConfig("development");
      config.notificationChannels = [];

      const validation = loader.validateConfig(config);

      expect(validation.isValid).toBe(true);
      expect(validation.warnings).toContain(
        "No notification channels configured"
      );
    });

    it("should warn about missing Slack webhook URL", () => {
      const config = loader.loadConfig("development");
      config.notificationChannels = ["slack"];
      config.slackWebhookUrl = undefined;

      const validation = loader.validateConfig(config);

      expect(validation.warnings).toContain(
        "Slack notification channel enabled but no webhook URL configured"
      );
    });

    it("should warn about missing PagerDuty integration key", () => {
      const config = loader.loadConfig("development");
      config.notificationChannels = ["pagerduty"];
      config.pagerdutyIntegrationKey = undefined;

      const validation = loader.validateConfig(config);

      expect(validation.warnings).toContain(
        "PagerDuty notification channel enabled but no integration key configured"
      );
    });

    it("should validate circuit breaker configuration", () => {
      const config = loader.loadConfig("development");
      config.circuitBreakerEnabled = true;
      config.circuitBreakerThreshold = 0;
      config.circuitBreakerTimeout = 500;

      const validation = loader.validateConfig(config);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain(
        "Circuit breaker threshold must be at least 1"
      );
      expect(validation.errors).toContain(
        "Circuit breaker timeout must be at least 1000ms"
      );
    });
  });

  describe("Environment Variable Parsing", () => {
    it("should parse boolean values correctly", () => {
      // Test true values
      process.env.VITE_TEST_BOOL = "true";
      const config = loader.loadConfig("development");
      expect(config.supportModeEnabled).toBe(false); // From mock env

      // Test false values
      process.env.VITE_ENABLE_BEDROCK_SUPPORT_MODE = "false";
      const config2 = loader.reloadConfig("development");
      expect(config2.supportModeEnabled).toBe(false);
    });

    it("should parse number values correctly", () => {
      process.env.VITE_BEDROCK_AUDIT_INTERVAL = "123456";
      const config = loader.reloadConfig("development");
      expect(config.auditInterval).toBe(123456);
    });

    it("should parse array values correctly", () => {
      process.env.VITE_BEDROCK_NOTIFICATION_CHANNELS =
        "slack, webhook, pagerduty";
      const config = loader.reloadConfig("development");
      expect(config.notificationChannels).toEqual([
        "slack",
        "webhook",
        "pagerduty",
      ]);
    });

    it("should handle missing environment variables with defaults", () => {
      // Clear all environment variables
      Object.keys(mockEnv).forEach((key) => {
        delete process.env[key];
      });

      const config = loader.reloadConfig("development");

      // Should use defaults
      expect(config.supportModeEnabled).toBe(false);
      expect(config.intelligentRoutingEnabled).toBe(true);
      expect(config.awsRegion).toBe("eu-central-1");
      expect(config.bedrockModelId).toBe(
        "anthropic.claude-3-5-sonnet-20241022-v2:0"
      );
    });
  });
});

describe("Convenience Functions", () => {
  beforeEach(() => {
    // Reset singleton instance
    (BedrockConfigLoader as any).instance = undefined;
  });

  describe("getBedrockConfig", () => {
    it("should return configuration for current environment", () => {
      const config = getBedrockConfig();

      expect(config).toBeDefined();
      expect(typeof config.supportModeEnabled).toBe("boolean");
      expect(typeof config.intelligentRoutingEnabled).toBe("boolean");
      expect(typeof config.directBedrockFallbackEnabled).toBe("boolean");
      expect(typeof config.auditInterval).toBe("number");
      expect(["basic", "detailed", "comprehensive"]).toContain(
        config.monitoringLevel
      );
    });
  });

  describe("validateBedrockConfig", () => {
    it("should validate current configuration", () => {
      const validation = validateBedrockConfig();

      expect(validation).toBeDefined();
      expect(typeof validation.isValid).toBe("boolean");
      expect(Array.isArray(validation.errors)).toBe(true);
      expect(Array.isArray(validation.warnings)).toBe(true);
    });
  });
});
