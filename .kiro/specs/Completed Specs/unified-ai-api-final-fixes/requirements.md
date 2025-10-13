# Requirements Document - Unified AI API Final Test Fixes

## Introduction

This spec addresses the final 7 test failures in the Unified AI API test suite to achieve 100% test success rate (51/51 tests passing) for Green Core Validation (GCV) eligibility.

## Requirements

### Requirement 1: Deterministic Provider Selection Control

**User Story:** As a test developer, I want to control which provider is selected for specific test scenarios, so that I can verify provider-specific functionality deterministically.

#### Acceptance Criteria

1. WHEN a test specifies `provider: "bedrock"` in the request THEN the system SHALL use bedrock first in the provider ordering
2. WHEN a test specifies `provider: "google"` in the request THEN the system SHALL use google first in the provider ordering
3. WHEN a test specifies `context.preferredProvider: "meta"` THEN the system SHALL use meta first in the provider ordering
4. WHEN no preferred provider is specified THEN the system SHALL use the default strategy ordering (cost-optimized, latency-optimized, round-robin)
5. WHEN preferred provider is available in availableProviders THEN it SHALL be moved to first position, followed by strategy-ordered remaining providers
6. WHEN preferred provider is not available THEN the system SHALL fall back to normal strategy ordering

### Requirement 2: Health Status Calculation Accuracy

**User Story:** As a system administrator, I want accurate health status calculations based on provider metrics, so that I can monitor system health effectively.

#### Acceptance Criteria

1. WHEN a provider has error rate < 0.05 AND average latency <= 800ms THEN the system SHALL return status "healthy"
2. WHEN a provider has error rate < 0.35 AND average latency <= 3500ms THEN the system SHALL return status "degraded"
3. WHEN a provider exceeds degraded thresholds THEN the system SHALL return status "unhealthy"
4. WHEN a provider has latencies [3000, 3000, 3000] and 1 error out of 3 requests THEN the system SHALL return status "degraded" (error rate = 0.33, avg latency = 3000)
5. WHEN a provider has latencies [6000, 6000] and 2 errors out of 2 requests THEN the system SHALL return status "unhealthy" (error rate = 1.0, avg latency = 6000)
6. WHEN calculating error rates THEN the system SHALL use (errors / total_requests) formula
7. WHEN recordProviderStats is called THEN it SHALL update both latencies array and error count for the provider
8. WHEN provider stats don't exist THEN the system SHALL initialize them with empty latencies array and zero errors

### Requirement 3: Error Message Consistency

**User Story:** As a developer, I want consistent error messages when all providers fail, so that I can handle errors appropriately.

#### Acceptance Criteria

1. WHEN all providers fail after retries THEN executeWithFallback SHALL throw new Error("All providers failed")
2. WHEN generateResponse catches the error THEN it SHALL preserve the original error message in the response
3. WHEN error instanceof Error THEN the system SHALL use error.message, otherwise default to "All providers failed"
4. WHEN tests expect "All providers failed" substring THEN the error response SHALL contain this exact text

### Requirement 4: Null-Safe Latency and Monitoring Integration

**User Story:** As a system operator, I want monitoring calls to be made during successful requests with null-safe latency handling, so that I can track system performance reliably.

#### Acceptance Criteria

1. WHEN a request succeeds THEN the system SHALL call (this.monitor as any)?.recordLatency?.(provider, latency, { modelId, requestId })
2. WHEN raw.latencyMs is null or undefined THEN the system SHALL use (Date.now() - opStart) as fallback
3. WHEN raw.modelId is missing THEN the system SHALL default to "unknown"
4. WHEN circuit breaker recordSuccess is available THEN it SHALL be called with provider and latency
5. WHEN recordProviderStats is called THEN it SHALL update provider statistics for health monitoring
6. WHEN monitor is mocked in tests THEN the mock SHALL be called with appropriate parameters

### Requirement 5: Provider Connectivity Testing

**User Story:** As a system administrator, I want to test provider connectivity with the exact expected prompt, so that connectivity tests work reliably.

#### Acceptance Criteria

1. WHEN testProvider is called THEN it SHALL use prompt "Test connectivity" exactly
2. WHEN testProvider is called THEN it SHALL use context { domain: "healthcheck", locale: "en-US" }
3. WHEN the provider responds successfully THEN testProvider SHALL return true
4. WHEN the provider fails or throws an error THEN testProvider SHALL return false
5. WHEN an error occurs THEN it SHALL be logged with console.error for debugging

### Requirement 6: Complete API Surface

**User Story:** As a test developer, I want all API methods to be available with correct signatures, so that tests can call them without errors.

#### Acceptance Criteria

1. WHEN getProviderModels is called THEN it SHALL return the models array for the specified provider
2. WHEN setProviderEnabled is called THEN it SHALL update the provider enabled state and call feature flags if available
3. WHEN getProviderHealth is called THEN it SHALL return health status for all providers using determineHealthStatus
4. WHEN shutdown is called THEN it SHALL reset circuit breakers, clear cache, and shutdown monitor
5. WHEN any method encounters missing dependencies THEN it SHALL handle them gracefully with optional chaining
6. WHEN providerEnabled property doesn't exist THEN setProviderEnabled SHALL initialize it with default values
