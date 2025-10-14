/**
 * AI Orchestrator Feature Flags Service
 *
 * Simple feature flags implementation for the unified AI API
 */

import { getBedrockConfig } from "./bedrock-config-loader";
import { Provider } from "./types";

export interface AiFeatureFlagsOptions {
  project?: string;
  enableEvidently?: boolean;
}

export interface FeatureFlagValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface BedrockSupportModeConfig {
  supportModeEnabled: boolean;
  intelligentRoutingEnabled: boolean;
  directBedrockFallbackEnabled: boolean;
  environment: "development" | "staging" | "production";
}

export interface EnvironmentSpecificConfig {
  development: {
    supportModeEnabled: boolean;
    intelligentRoutingEnabled: boolean;
    directBedrockFallbackEnabled: boolean;
    auditInterval: number;
    monitoringLevel: "basic" | "detailed" | "comprehensive";
    autoResolutionEnabled: boolean;
  };
  staging: {
    supportModeEnabled: boolean;
    intelligentRoutingEnabled: boolean;
    directBedrockFallbackEnabled: boolean;
    auditInterval: number;
    monitoringLevel: "basic" | "detailed" | "comprehensive";
    autoResolutionEnabled: boolean;
  };
  production: {
    supportModeEnabled: boolean;
    intelligentRoutingEnabled: boolean;
    directBedrockFallbackEnabled: boolean;
    auditInterval: number;
    monitoringLevel: "basic" | "detailed" | "comprehensive";
    autoResolutionEnabled: boolean;
  };
}

/**
 * Simple feature flags service for AI orchestrator
 */
export class AiFeatureFlags {
  private flags: Map<string, boolean> = new Map();
  private environmentConfig: EnvironmentSpecificConfig;

  constructor(private options: AiFeatureFlagsOptions = {}) {
    // Initialize environment-specific configuration
    this.environmentConfig = this.getDefaultEnvironmentConfig();

    // Initialize default flags
    this.flags.set("ai.provider.bedrock.enabled", true);
    this.flags.set("ai.provider.google.enabled", true);
    this.flags.set("ai.provider.meta.enabled", true);
    this.flags.set("ai.caching.enabled", true);
    this.flags.set("ai.monitoring.enabled", true);

    // 🚀 HYBRID-ASSISTANT-MODUS AKTIVIERT
    // Bedrock unterstützt Kiro bei Planung und Qualitätsprüfung
    // Du behältst volle Kontrolle über alle Entscheidungen
    this.flags.set("HYBRID_ASSISTANT_MODE", true);
    this.flags.set("BEDROCK_ADVISORY_MODE", true);
    this.flags.set("KIRO_PRIMARY_CONTROL", true);

    // Load environment-specific configuration and apply defaults
    this.loadEnvironmentConfiguration();
  }

  /**
   * Check if a provider is enabled
   */
  async isProviderEnabled(provider: Provider): Promise<boolean> {
    return this.flags.get(`ai.provider.${provider}.enabled`) ?? false;
  }

  /**
   * Enable or disable a provider
   */
  async setProviderEnabled(
    provider: Provider,
    enabled: boolean
  ): Promise<void> {
    this.flags.set(`ai.provider.${provider}.enabled`, enabled);
  }

  /**
   * Check if caching is enabled
   */
  async isCachingEnabled(): Promise<boolean> {
    return this.flags.get("ai.caching.enabled") ?? true;
  }

  /**
   * Check if monitoring is enabled
   */
  async isMonitoringEnabled(): Promise<boolean> {
    return this.flags.get("ai.monitoring.enabled") ?? true;
  }

  /**
   * Get all flags
   */
  getAllFlags(): Record<string, boolean> {
    return Object.fromEntries(this.flags.entries());
  }

  /**
   * Set a flag value
   */
  setFlag(key: string, value: boolean): void {
    this.flags.set(key, value);
  }

  /**
   * Get a flag value
   */
  getFlag(key: string, defaultValue: boolean = false): boolean {
    return this.flags.get(key) ?? defaultValue;
  }

  /**
   * Check if a feature flag is enabled (alias for getFlag)
   */
  isEnabled(key: string, defaultValue: boolean = false): boolean {
    return this.getFlag(key, defaultValue);
  }

  /**
   * 🚀 HYBRID-ASSISTANT-MODUS: Check if Hybrid Assistant Mode is active
   */
  isHybridAssistantModeEnabled(): boolean {
    return this.flags.get("HYBRID_ASSISTANT_MODE") ?? false;
  }

  /**
   * 🤖 BEDROCK ADVISORY: Check if Bedrock Advisory Mode is active
   */
  isBedrockAdvisoryModeEnabled(): boolean {
    return this.flags.get("BEDROCK_ADVISORY_MODE") ?? false;
  }

  /**
   * 👤 KIRO CONTROL: Check if Kiro maintains primary control
   */
  isKiroPrimaryControlEnabled(): boolean {
    return this.flags.get("KIRO_PRIMARY_CONTROL") ?? true;
  }

  /**
   * Check if Bedrock Support Mode is enabled
   */
  async isBedrockSupportModeEnabled(): Promise<boolean> {
    return this.flags.get("ENABLE_BEDROCK_SUPPORT_MODE") ?? false;
  }

  /**
   * Enable or disable Bedrock Support Mode
   */
  async setBedrockSupportModeEnabled(enabled: boolean): Promise<void> {
    this.flags.set("ENABLE_BEDROCK_SUPPORT_MODE", enabled);
  }

  /**
   * Check if Intelligent Routing is enabled
   */
  async isIntelligentRoutingEnabled(): Promise<boolean> {
    return this.flags.get("ENABLE_INTELLIGENT_ROUTING") ?? false;
  }

  /**
   * Enable or disable Intelligent Routing
   */
  async setIntelligentRoutingEnabled(enabled: boolean): Promise<void> {
    this.flags.set("ENABLE_INTELLIGENT_ROUTING", enabled);
  }

  /**
   * Check if Direct Bedrock Fallback is enabled
   */
  async isDirectBedrockFallbackEnabled(): Promise<boolean> {
    return this.flags.get("ENABLE_DIRECT_BEDROCK_FALLBACK") ?? false;
  }

  /**
   * Enable or disable Direct Bedrock Fallback
   */
  async setDirectBedrockFallbackEnabled(enabled: boolean): Promise<void> {
    this.flags.set("ENABLE_DIRECT_BEDROCK_FALLBACK", enabled);
  }

  /**
   * Validate feature flag configuration for Bedrock Support Mode
   */
  async validateBedrockSupportModeFlags(): Promise<FeatureFlagValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    const supportModeEnabled = await this.isBedrockSupportModeEnabled();
    const intelligentRoutingEnabled = await this.isIntelligentRoutingEnabled();
    const directBedrockFallbackEnabled =
      await this.isDirectBedrockFallbackEnabled();
    const bedrockProviderEnabled = await this.isProviderEnabled("bedrock");

    // Critical validation: Bedrock provider must be enabled if support mode is enabled
    if (supportModeEnabled && !bedrockProviderEnabled) {
      errors.push(
        "Bedrock Support Mode requires Bedrock provider to be enabled"
      );
    }

    // Logical validation: Intelligent routing should be enabled if support mode is enabled
    if (supportModeEnabled && !intelligentRoutingEnabled) {
      warnings.push(
        "Bedrock Support Mode works best with Intelligent Routing enabled"
      );
    }

    // Safety validation: Direct fallback should only be enabled with support mode
    if (directBedrockFallbackEnabled && !supportModeEnabled) {
      warnings.push(
        "Direct Bedrock Fallback is enabled but Support Mode is disabled"
      );
    }

    // Environment-specific validation
    const environment = this.getEnvironment();
    if (environment === "production" && supportModeEnabled) {
      if (!intelligentRoutingEnabled) {
        errors.push(
          "Production environment requires Intelligent Routing when Support Mode is enabled"
        );
      }
      if (!directBedrockFallbackEnabled) {
        warnings.push(
          "Production environment should consider enabling Direct Bedrock Fallback for reliability"
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate all feature flags for consistency and safety
   */
  async validateAllFlags(): Promise<FeatureFlagValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate Bedrock Support Mode configuration
    const bedrockValidation = await this.validateBedrockSupportModeFlags();
    errors.push(...bedrockValidation.errors);
    warnings.push(...bedrockValidation.warnings);

    // Validate provider configuration
    const enabledProviders = [];
    for (const provider of ["bedrock", "google", "meta"] as Provider[]) {
      if (await this.isProviderEnabled(provider)) {
        enabledProviders.push(provider);
      }
    }

    if (enabledProviders.length === 0) {
      errors.push("At least one AI provider must be enabled");
    }

    // Validate monitoring and caching
    const monitoringEnabled = await this.isMonitoringEnabled();
    const cachingEnabled = await this.isCachingEnabled();

    if (!monitoringEnabled) {
      warnings.push("Monitoring is disabled - this may impact observability");
    }

    if (!cachingEnabled) {
      warnings.push("Caching is disabled - this may impact performance");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Get current environment (defaults to development)
   */
  private getEnvironment(): "development" | "staging" | "production" {
    if (typeof process !== "undefined" && process.env) {
      const env = process.env.NODE_ENV || process.env.ENVIRONMENT;
      if (env === "production" || env === "staging") {
        return env as "production" | "staging";
      }
    }
    return "development";
  }

  /**
   * Get Bedrock Support Mode configuration
   */
  async getBedrockSupportModeConfig(): Promise<BedrockSupportModeConfig> {
    return {
      supportModeEnabled: await this.isBedrockSupportModeEnabled(),
      intelligentRoutingEnabled: await this.isIntelligentRoutingEnabled(),
      directBedrockFallbackEnabled: await this.isDirectBedrockFallbackEnabled(),
      environment: this.getEnvironment(),
    };
  }

  /**
   * Get default environment-specific configuration
   */
  private getDefaultEnvironmentConfig(): EnvironmentSpecificConfig {
    return {
      development: {
        supportModeEnabled: false, // Default off for safety
        intelligentRoutingEnabled: true, // Enable for testing
        directBedrockFallbackEnabled: false, // Not needed in dev
        auditInterval: 300000, // 5 minutes - more frequent for debugging
        monitoringLevel: "comprehensive", // Full monitoring for debugging
        autoResolutionEnabled: true, // Allow experimentation
      },
      staging: {
        supportModeEnabled: false, // Default off, enable for testing
        intelligentRoutingEnabled: true, // Production-like
        directBedrockFallbackEnabled: true, // Test fallback scenarios
        auditInterval: 600000, // 10 minutes - balanced
        monitoringLevel: "detailed", // Detailed monitoring for validation
        autoResolutionEnabled: true, // Test auto-resolution
      },
      production: {
        supportModeEnabled: false, // Default off for safety
        intelligentRoutingEnabled: true, // Required for production
        directBedrockFallbackEnabled: true, // Required for reliability
        auditInterval: 1800000, // 30 minutes - less frequent
        monitoringLevel: "basic", // Basic monitoring to reduce overhead
        autoResolutionEnabled: false, // Conservative approach
      },
    };
  }

  /**
   * Load environment-specific configuration from config loader
   */
  private loadEnvironmentConfiguration(): void {
    // Skip loading environment configuration in test environment
    if (this.isTestEnvironment()) {
      this.applyTestDefaults();
      return;
    }

    try {
      const currentEnv = this.getEnvironment();
      const bedrockConfig = getBedrockConfig();

      // Apply configuration from environment files
      this.flags.set(
        "ENABLE_BEDROCK_SUPPORT_MODE",
        bedrockConfig.supportModeEnabled
      );
      this.flags.set(
        "ENABLE_INTELLIGENT_ROUTING",
        bedrockConfig.intelligentRoutingEnabled
      );
      this.flags.set(
        "ENABLE_DIRECT_BEDROCK_FALLBACK",
        bedrockConfig.directBedrockFallbackEnabled
      );

      // Update internal environment config to match loaded config
      this.environmentConfig[currentEnv] = {
        supportModeEnabled: bedrockConfig.supportModeEnabled,
        intelligentRoutingEnabled: bedrockConfig.intelligentRoutingEnabled,
        directBedrockFallbackEnabled:
          bedrockConfig.directBedrockFallbackEnabled,
        auditInterval: bedrockConfig.auditInterval,
        monitoringLevel: bedrockConfig.monitoringLevel,
        autoResolutionEnabled: bedrockConfig.autoResolutionEnabled,
      };
    } catch (error) {
      // Fallback to default configuration if loading fails
      console.warn(
        "Failed to load Bedrock environment configuration, using defaults:",
        error
      );
      this.applyEnvironmentDefaults(this.getEnvironment());
    }
  }

  /**
   * Check if running in test environment
   */
  protected isTestEnvironment(): boolean {
    return (
      typeof process !== "undefined" &&
      process.env &&
      (process.env.NODE_ENV === "test" ||
        process.env.JEST_WORKER_ID !== undefined)
    );
  }

  /**
   * Apply test-specific defaults (all flags false for safety)
   */
  private applyTestDefaults(): void {
    this.flags.set("ENABLE_BEDROCK_SUPPORT_MODE", false);
    this.flags.set("ENABLE_INTELLIGENT_ROUTING", false);
    this.flags.set("ENABLE_DIRECT_BEDROCK_FALLBACK", false);
  }

  /**
   * Apply environment-specific defaults during initialization
   */
  private applyEnvironmentDefaults(
    environment: "development" | "staging" | "production"
  ): void {
    const config = this.environmentConfig[environment];

    this.flags.set("ENABLE_BEDROCK_SUPPORT_MODE", config.supportModeEnabled);
    this.flags.set(
      "ENABLE_INTELLIGENT_ROUTING",
      config.intelligentRoutingEnabled
    );
    this.flags.set(
      "ENABLE_DIRECT_BEDROCK_FALLBACK",
      config.directBedrockFallbackEnabled
    );
  }

  /**
   * Apply environment-specific configuration for Bedrock Support Mode
   */
  async applyEnvironmentConfiguration(
    environment: "development" | "staging" | "production"
  ): Promise<void> {
    const config = this.environmentConfig[environment];

    this.flags.set("ENABLE_BEDROCK_SUPPORT_MODE", config.supportModeEnabled);
    this.flags.set(
      "ENABLE_INTELLIGENT_ROUTING",
      config.intelligentRoutingEnabled
    );
    this.flags.set(
      "ENABLE_DIRECT_BEDROCK_FALLBACK",
      config.directBedrockFallbackEnabled
    );
  }

  /**
   * Get environment-specific configuration
   */
  getEnvironmentConfig(
    environment?: "development" | "staging" | "production"
  ): EnvironmentSpecificConfig[keyof EnvironmentSpecificConfig] {
    const env = environment || this.getEnvironment();
    return this.environmentConfig[env];
  }

  /**
   * Update environment-specific configuration
   */
  updateEnvironmentConfig(
    environment: "development" | "staging" | "production",
    config: Partial<EnvironmentSpecificConfig[keyof EnvironmentSpecificConfig]>
  ): void {
    this.environmentConfig[environment] = {
      ...this.environmentConfig[environment],
      ...config,
    };
  }

  /**
   * Get audit interval for current environment
   */
  getAuditInterval(): number {
    const currentEnv = this.getEnvironment();
    return this.environmentConfig[currentEnv].auditInterval;
  }

  /**
   * Get monitoring level for current environment
   */
  getMonitoringLevel(): "basic" | "detailed" | "comprehensive" {
    const currentEnv = this.getEnvironment();
    return this.environmentConfig[currentEnv].monitoringLevel;
  }

  /**
   * Check if auto-resolution is enabled for current environment
   */
  isAutoResolutionEnabled(): boolean {
    const currentEnv = this.getEnvironment();
    return this.environmentConfig[currentEnv].autoResolutionEnabled;
  }

  /**
   * Safely enable Bedrock Support Mode with validation
   */
  async enableBedrockSupportModeSafely(): Promise<FeatureFlagValidationResult> {
    // Check if bedrock provider is enabled first
    const bedrockEnabled = await this.isProviderEnabled("bedrock");

    if (!bedrockEnabled) {
      return {
        isValid: false,
        errors: [
          "Cannot enable Bedrock Support Mode: Bedrock provider is not enabled",
        ],
        warnings: [],
      };
    }

    // Enable prerequisites
    await this.setIntelligentRoutingEnabled(true);

    // Enable support mode
    await this.setBedrockSupportModeEnabled(true);

    // Validate the configuration
    const validation = await this.validateBedrockSupportModeFlags();

    // If validation fails, rollback
    if (!validation.isValid) {
      await this.setBedrockSupportModeEnabled(false);
      validation.errors.unshift(
        "Bedrock Support Mode activation failed validation and was rolled back"
      );
    }

    return validation;
  }

  /**
   * Safely disable Bedrock Support Mode
   */
  async disableBedrockSupportModeSafely(): Promise<void> {
    // Disable all related flags
    await this.setBedrockSupportModeEnabled(false);
    await this.setDirectBedrockFallbackEnabled(false);
    // Note: We keep intelligent routing enabled as it may be used by other features
  }
}
