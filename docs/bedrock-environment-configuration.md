# Bedrock Support Mode - Environment Configuration

This document explains how to configure Bedrock Support Mode for different environments (development, staging, production).

## Overview

The Bedrock Support Mode feature flags system now supports environment-specific configuration through dedicated environment files and a configuration loader system.

## Environment Files

### Development (`.env.bedrock.development`)

- **Support Mode**: Disabled by default for safety
- **Intelligent Routing**: Enabled for testing
- **Direct Bedrock Fallback**: Disabled (not needed in dev)
- **Audit Interval**: 5 minutes (more frequent for debugging)
- **Monitoring Level**: Comprehensive (full monitoring for debugging)
- **Auto Resolution**: Enabled (allow experimentation)
- **Debug Mode**: Enabled
- **Mock Infrastructure Audit**: Enabled

### Staging (`.env.bedrock.staging`)

- **Support Mode**: Disabled by default, enable for testing
- **Intelligent Routing**: Enabled (production-like)
- **Direct Bedrock Fallback**: Enabled (test fallback scenarios)
- **Audit Interval**: 10 minutes (balanced)
- **Monitoring Level**: Detailed (detailed monitoring for validation)
- **Auto Resolution**: Enabled (test auto-resolution)
- **Canary Testing**: Enabled (10% traffic)

### Production (`.env.bedrock.production`)

- **Support Mode**: Disabled by default for safety
- **Intelligent Routing**: Enabled (required for production)
- **Direct Bedrock Fallback**: Enabled (required for reliability)
- **Audit Interval**: 30 minutes (less frequent)
- **Monitoring Level**: Basic (basic monitoring to reduce overhead)
- **Auto Resolution**: Disabled (conservative approach)
- **Circuit Breaker**: Enabled
- **Audit Trail**: Enabled
- **GDPR Compliance**: Enabled
- **PII Detection**: Enabled

## Configuration Variables

### Feature Flags

- `VITE_ENABLE_BEDROCK_SUPPORT_MODE`: Enable/disable support mode
- `VITE_ENABLE_INTELLIGENT_ROUTING`: Enable/disable intelligent routing
- `VITE_ENABLE_DIRECT_BEDROCK_FALLBACK`: Enable/disable direct Bedrock fallback

### Support Mode Configuration

- `VITE_BEDROCK_AUDIT_INTERVAL`: Audit interval in milliseconds
- `VITE_BEDROCK_MONITORING_LEVEL`: Monitoring level (basic/detailed/comprehensive)
- `VITE_BEDROCK_AUTO_RESOLUTION_ENABLED`: Enable/disable auto-resolution

### Environment-specific Settings

- `VITE_BEDROCK_DEBUG_MODE`: Enable/disable debug mode
- `VITE_BEDROCK_VERBOSE_LOGGING`: Enable/disable verbose logging
- `VITE_BEDROCK_MOCK_INFRASTRUCTURE_AUDIT`: Enable/disable mock infrastructure audit

### AWS Configuration

- `VITE_AWS_REGION`: AWS region (default: eu-central-1)
- `VITE_BEDROCK_MODEL_ID`: Bedrock model ID

### Safety Settings

- `VITE_BEDROCK_RATE_LIMIT_ENABLED`: Enable/disable rate limiting
- `VITE_BEDROCK_COST_LIMIT_ENABLED`: Enable/disable cost limiting
- `VITE_BEDROCK_MAX_REQUESTS_PER_MINUTE`: Maximum requests per minute

### Notification Settings

- `VITE_BEDROCK_NOTIFICATION_CHANNELS`: Comma-separated list of channels
- `VITE_BEDROCK_SLACK_WEBHOOK_URL`: Slack webhook URL
- `VITE_BEDROCK_PAGERDUTY_INTEGRATION_KEY`: PagerDuty integration key
- `VITE_BEDROCK_WEBHOOK_URL`: Generic webhook URL

### Production-specific Settings

- `VITE_BEDROCK_CIRCUIT_BREAKER_ENABLED`: Enable/disable circuit breaker
- `VITE_BEDROCK_CIRCUIT_BREAKER_THRESHOLD`: Circuit breaker threshold
- `VITE_BEDROCK_CIRCUIT_BREAKER_TIMEOUT`: Circuit breaker timeout
- `VITE_BEDROCK_AUDIT_TRAIL_ENABLED`: Enable/disable audit trail
- `VITE_BEDROCK_GDPR_COMPLIANCE_ENABLED`: Enable/disable GDPR compliance
- `VITE_BEDROCK_PII_DETECTION_ENABLED`: Enable/disable PII detection

### Testing Configuration (Staging)

- `VITE_BEDROCK_ENABLE_CANARY_TESTING`: Enable/disable canary testing
- `VITE_BEDROCK_CANARY_PERCENTAGE`: Canary testing percentage

## Usage

### Programmatic Access

```typescript
import { AiFeatureFlags } from "@/lib/ai-orchestrator/ai-feature-flags";
import {
  getBedrockConfig,
  validateBedrockConfig,
} from "@/lib/ai-orchestrator/bedrock-config-loader";

// Using feature flags
const featureFlags = new AiFeatureFlags();
const supportModeEnabled = await featureFlags.isBedrockSupportModeEnabled();
const auditInterval = featureFlags.getAuditInterval();
const monitoringLevel = featureFlags.getMonitoringLevel();

// Using configuration loader
const config = getBedrockConfig();
console.log("Support mode enabled:", config.supportModeEnabled);
console.log("Audit interval:", config.auditInterval);
console.log("Monitoring level:", config.monitoringLevel);

// Validate configuration
const validation = validateBedrockConfig();
if (!validation.isValid) {
  console.error("Configuration errors:", validation.errors);
}
if (validation.warnings.length > 0) {
  console.warn("Configuration warnings:", validation.warnings);
}
```

### Environment-specific Configuration

```typescript
// Apply configuration for specific environment
await featureFlags.applyEnvironmentConfiguration("production");

// Get environment-specific configuration
const prodConfig = featureFlags.getEnvironmentConfig("production");
console.log("Production audit interval:", prodConfig.auditInterval);

// Update environment configuration
featureFlags.updateEnvironmentConfig("development", {
  auditInterval: 120000, // 2 minutes
  monitoringLevel: "basic",
});
```

## Validation

The configuration system includes comprehensive validation:

### Error Conditions

- Audit interval less than 60 seconds
- Max requests per minute less than 1
- Circuit breaker threshold less than 1
- Circuit breaker timeout less than 1000ms

### Warning Conditions

- No notification channels configured
- Slack channel enabled but no webhook URL
- PagerDuty channel enabled but no integration key

## Environment Detection

The system automatically detects the current environment based on:

1. `process.env.NODE_ENV`
2. `process.env.ENVIRONMENT`
3. Falls back to 'development' if not specified

## Testing

In test environments, the system:

- Skips loading environment configuration files
- Uses safe defaults (all flags false)
- Allows manual configuration for testing

## Security Considerations

- All sensitive configuration (webhook URLs, API keys) should be stored in environment variables
- Production configuration is conservative by default
- Circuit breakers and rate limiting are enabled in production
- GDPR compliance and PII detection are enabled in production
- Audit trails are enabled for all production operations

## Troubleshooting

### Configuration Not Loading

1. Check that environment variables are properly set
2. Verify environment detection is working correctly
3. Check console for configuration loading warnings

### Validation Errors

1. Review validation error messages
2. Check that all required configuration is provided
3. Verify that numeric values are within acceptable ranges

### Feature Flags Not Working

1. Ensure feature flags are properly initialized
2. Check that environment configuration is applied
3. Verify that the correct environment is detected

## Migration from Legacy Configuration

If you're migrating from a legacy configuration system:

1. Copy existing configuration values to the appropriate environment files
2. Update code to use the new `AiFeatureFlags` class
3. Add validation checks using `validateBedrockConfig()`
4. Test in development environment before deploying to staging/production
