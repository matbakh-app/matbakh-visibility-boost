/**
 * Bedrock Support Mode Configuration Loader
 *
 * Loads environment-specific configuration for Bedrock support mode
 */

export interface BedrockEnvironmentConfig {
  // Feature Flags
  supportModeEnabled: boolean;
  intelligentRoutingEnabled: boolean;
  directBedrockFallbackEnabled: boolean;

  // Support Mode Configuration
  auditInterval: number;
  monitoringLevel: "basic" | "detailed" | "comprehensive";
  autoResolutionEnabled: boolean;

  // Environment-specific settings
  debugMode: boolean;
  verboseLogging: boolean;
  mockInfrastructureAudit: boolean;

  // AWS Configuration
  awsRegion: string;
  bedrockModelId: string;

  // Safety Settings
  rateLimitEnabled: boolean;
  costLimitEnabled: boolean;
  maxRequestsPerMinute: number;

  // Notification Settings
  notificationChannels: string[];
  slackWebhookUrl?: string;
  pagerdutyIntegrationKey?: string;
  webhookUrl?: string;

  // Additional Production Settings
  circuitBreakerEnabled?: boolean;
  circuitBreakerThreshold?: number;
  circuitBreakerTimeout?: number;
  auditTrailEnabled?: boolean;
  gdprComplianceEnabled?: boolean;
  piiDetectionEnabled?: boolean;

  // Testing Configuration
  enableCanaryTesting?: boolean;
  canaryPercentage?: number;
}

/**
 * Configuration loader for Bedrock support mode
 */
export class BedrockConfigLoader {
  private static instance: BedrockConfigLoader;
  private config: BedrockEnvironmentConfig | null = null;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): BedrockConfigLoader {
    if (!BedrockConfigLoader.instance) {
      BedrockConfigLoader.instance = new BedrockConfigLoader();
    }
    return BedrockConfigLoader.instance;
  }

  /**
   * Load configuration for the specified environment
   */
  loadConfig(
    environment: "development" | "staging" | "production"
  ): BedrockEnvironmentConfig {
    if (this.config) {
      return this.config;
    }

    // Load from environment variables with fallbacks
    this.config = {
      // Feature Flags
      supportModeEnabled: this.getBooleanEnv(
        "VITE_ENABLE_BEDROCK_SUPPORT_MODE",
        false
      ),
      intelligentRoutingEnabled: this.getBooleanEnv(
        "VITE_ENABLE_INTELLIGENT_ROUTING",
        true
      ),
      directBedrockFallbackEnabled: this.getBooleanEnv(
        "VITE_ENABLE_DIRECT_BEDROCK_FALLBACK",
        environment !== "development"
      ),

      // Support Mode Configuration
      auditInterval: this.getNumberEnv(
        "VITE_BEDROCK_AUDIT_INTERVAL",
        this.getDefaultAuditInterval(environment)
      ),
      monitoringLevel: this.getStringEnv(
        "VITE_BEDROCK_MONITORING_LEVEL",
        this.getDefaultMonitoringLevel(environment)
      ) as "basic" | "detailed" | "comprehensive",
      autoResolutionEnabled: this.getBooleanEnv(
        "VITE_BEDROCK_AUTO_RESOLUTION_ENABLED",
        environment !== "production"
      ),

      // Environment-specific settings
      debugMode: this.getBooleanEnv(
        "VITE_BEDROCK_DEBUG_MODE",
        environment === "development"
      ),
      verboseLogging: this.getBooleanEnv(
        "VITE_BEDROCK_VERBOSE_LOGGING",
        environment === "development"
      ),
      mockInfrastructureAudit: this.getBooleanEnv(
        "VITE_BEDROCK_MOCK_INFRASTRUCTURE_AUDIT",
        environment === "development"
      ),

      // AWS Configuration
      awsRegion: this.getStringEnv("VITE_AWS_REGION", "eu-central-1"),
      bedrockModelId: this.getStringEnv(
        "VITE_BEDROCK_MODEL_ID",
        "anthropic.claude-3-5-sonnet-20241022-v2:0"
      ),

      // Safety Settings
      rateLimitEnabled: this.getBooleanEnv(
        "VITE_BEDROCK_RATE_LIMIT_ENABLED",
        true
      ),
      costLimitEnabled: this.getBooleanEnv(
        "VITE_BEDROCK_COST_LIMIT_ENABLED",
        true
      ),
      maxRequestsPerMinute: this.getNumberEnv(
        "VITE_BEDROCK_MAX_REQUESTS_PER_MINUTE",
        this.getDefaultRateLimit(environment)
      ),

      // Notification Settings
      notificationChannels: this.getArrayEnv(
        "VITE_BEDROCK_NOTIFICATION_CHANNELS",
        this.getDefaultNotificationChannels(environment)
      ),
      slackWebhookUrl: this.getStringEnv("VITE_BEDROCK_SLACK_WEBHOOK_URL"),
      pagerdutyIntegrationKey: this.getStringEnv(
        "VITE_BEDROCK_PAGERDUTY_INTEGRATION_KEY"
      ),
      webhookUrl: this.getStringEnv("VITE_BEDROCK_WEBHOOK_URL"),

      // Production-specific settings
      circuitBreakerEnabled: this.getBooleanEnv(
        "VITE_BEDROCK_CIRCUIT_BREAKER_ENABLED",
        environment === "production"
      ),
      circuitBreakerThreshold: this.getNumberEnv(
        "VITE_BEDROCK_CIRCUIT_BREAKER_THRESHOLD",
        5
      ),
      circuitBreakerTimeout: this.getNumberEnv(
        "VITE_BEDROCK_CIRCUIT_BREAKER_TIMEOUT",
        60000
      ),
      auditTrailEnabled: this.getBooleanEnv(
        "VITE_BEDROCK_AUDIT_TRAIL_ENABLED",
        environment === "production"
      ),
      gdprComplianceEnabled: this.getBooleanEnv(
        "VITE_BEDROCK_GDPR_COMPLIANCE_ENABLED",
        environment === "production"
      ),
      piiDetectionEnabled: this.getBooleanEnv(
        "VITE_BEDROCK_PII_DETECTION_ENABLED",
        environment === "production"
      ),

      // Testing Configuration
      enableCanaryTesting: this.getBooleanEnv(
        "VITE_BEDROCK_ENABLE_CANARY_TESTING",
        environment === "staging"
      ),
      canaryPercentage: this.getNumberEnv("VITE_BEDROCK_CANARY_PERCENTAGE", 10),
    };

    return this.config;
  }

  /**
   * Get current configuration (must be loaded first)
   */
  getConfig(): BedrockEnvironmentConfig {
    if (!this.config) {
      throw new Error("Configuration not loaded. Call loadConfig() first.");
    }
    return this.config;
  }

  /**
   * Reload configuration (clears cache)
   */
  reloadConfig(
    environment: "development" | "staging" | "production"
  ): BedrockEnvironmentConfig {
    this.config = null;
    return this.loadConfig(environment);
  }

  /**
   * Validate configuration
   */
  validateConfig(config: BedrockEnvironmentConfig): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate audit interval
    if (config.auditInterval < 60000) {
      // Less than 1 minute
      errors.push("Audit interval must be at least 60 seconds");
    }

    // Validate rate limits
    if (config.maxRequestsPerMinute < 1) {
      errors.push("Max requests per minute must be at least 1");
    }

    // Validate notification channels
    if (config.notificationChannels.length === 0) {
      warnings.push("No notification channels configured");
    }

    // Validate Slack configuration
    if (
      config.notificationChannels.includes("slack") &&
      !config.slackWebhookUrl
    ) {
      warnings.push(
        "Slack notification channel enabled but no webhook URL configured"
      );
    }

    // Validate PagerDuty configuration
    if (
      config.notificationChannels.includes("pagerduty") &&
      !config.pagerdutyIntegrationKey
    ) {
      warnings.push(
        "PagerDuty notification channel enabled but no integration key configured"
      );
    }

    // Validate circuit breaker settings
    if (config.circuitBreakerEnabled) {
      if (
        !config.circuitBreakerThreshold ||
        config.circuitBreakerThreshold < 1
      ) {
        errors.push("Circuit breaker threshold must be at least 1");
      }
      if (
        !config.circuitBreakerTimeout ||
        config.circuitBreakerTimeout < 1000
      ) {
        errors.push("Circuit breaker timeout must be at least 1000ms");
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // Helper methods for environment variable parsing
  private getBooleanEnv(key: string, defaultValue: boolean = false): boolean {
    const value = this.getEnvValue(key);
    if (value === undefined) return defaultValue;
    return value.toLowerCase() === "true";
  }

  private getNumberEnv(key: string, defaultValue: number = 0): number {
    const value = this.getEnvValue(key);
    if (value === undefined) return defaultValue;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  private getStringEnv(key: string, defaultValue?: string): string | undefined {
    return this.getEnvValue(key) || defaultValue;
  }

  private getArrayEnv(key: string, defaultValue: string[] = []): string[] {
    const value = this.getEnvValue(key);
    if (value === undefined) return defaultValue;
    return value
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  private getEnvValue(key: string): string | undefined {
    // In browser/Vite environment, check import.meta.env
    // Use dynamic evaluation to avoid Jest parsing issues
    const importMeta = this.getImportMeta();
    if (importMeta && importMeta.env) {
      return importMeta.env[key];
    }

    // Fallback to process.env for Node.js environments
    if (typeof process !== "undefined" && process.env) {
      return process.env[key];
    }

    return undefined;
  }

  private getImportMeta(): any {
    try {
      // Safe access to import.meta without eval
      if (typeof window !== "undefined" && "import" in globalThis) {
        return (globalThis as any).import?.meta;
      }
      return undefined;
    } catch (error) {
      return undefined;
    }
  }

  // Default value helpers
  private getDefaultAuditInterval(environment: string): number {
    switch (environment) {
      case "development":
        return 300000; // 5 minutes
      case "staging":
        return 600000; // 10 minutes
      case "production":
        return 1800000; // 30 minutes
      default:
        return 600000;
    }
  }

  private getDefaultMonitoringLevel(environment: string): string {
    switch (environment) {
      case "development":
        return "comprehensive";
      case "staging":
        return "detailed";
      case "production":
        return "basic";
      default:
        return "basic";
    }
  }

  private getDefaultRateLimit(environment: string): number {
    switch (environment) {
      case "development":
        return 10;
      case "staging":
        return 30;
      case "production":
        return 100;
      default:
        return 30;
    }
  }

  private getDefaultNotificationChannels(environment: string): string[] {
    switch (environment) {
      case "development":
        return ["console", "webhook"];
      case "staging":
        return ["slack", "webhook"];
      case "production":
        return ["slack", "pagerduty", "webhook"];
      default:
        return ["console"];
    }
  }
}

/**
 * Convenience function to get configuration for current environment
 */
export function getBedrockConfig(): BedrockEnvironmentConfig {
  const loader = BedrockConfigLoader.getInstance();

  // Determine current environment
  let environment: "development" | "staging" | "production" = "development";

  if (typeof process !== "undefined" && process.env) {
    const env = process.env.NODE_ENV || process.env.ENVIRONMENT;
    if (env === "production" || env === "staging") {
      environment = env as "production" | "staging";
    }
  }

  return loader.loadConfig(environment);
}

/**
 * Convenience function to validate current configuration
 */
export function validateBedrockConfig(): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const config = getBedrockConfig();
  const loader = BedrockConfigLoader.getInstance();
  return loader.validateConfig(config);
}
