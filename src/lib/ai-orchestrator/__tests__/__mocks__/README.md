# Hybrid Routing Mock Implementations

Comprehensive mock implementations for testing hybrid routing scenarios in the Bedrock Support Manager system.

## Overview

This directory contains mock factories and utilities for testing all aspects of the hybrid routing architecture, including:

- **Direct Bedrock Client** - Mock for direct AWS Bedrock access
- **MCP Router** - Mock for MCP integration path
- **Intelligent Router** - Mock for routing decision logic
- **Infrastructure Auditor** - Mock for system health checks
- **Meta Monitor** - Mock for execution analysis
- **Implementation Support** - Mock for remediation support
- **Hybrid Health Monitor** - Mock for health monitoring
- **Audit Trail System** - Mock for audit logging
- **Feature Flags** - Mock for feature flag management
- **Circuit Breaker** - Mock for fault tolerance
- **Compliance Integration** - Mock for compliance validation
- **GDPR Validator** - Mock for GDPR compliance
- **Bedrock Adapter** - Mock for Bedrock adapter
- **Kiro Bridge** - Mock for Kiro communication

## Quick Start

### Basic Usage

```typescript
import { QuickMockSetup } from "./__mocks__";

describe("My Test Suite", () => {
  let mockSuite;

  beforeEach(() => {
    // Setup mocks for normal operations
    mockSuite = QuickMockSetup.normalOperations();
  });

  afterEach(() => {
    // Clear mock call history
    mockSuite.clearAllCalls();
  });

  it("should test something", async () => {
    const result = await mockSuite.directBedrock.executeSupportOperation({
      operation: "test",
      priority: "high",
    });

    expect(result.success).toBe(true);
  });
});
```

### Scenario-Based Testing

```typescript
import { QuickMockSetup } from "./__mocks__";

describe("Scenario Tests", () => {
  it("should handle normal operations", () => {
    const mocks = QuickMockSetup.normalOperations();
    // Test normal operations
  });

  it("should handle MCP failure", () => {
    const mocks = QuickMockSetup.mcpFailure();
    // Test MCP failure scenario
  });

  it("should handle high load", () => {
    const mocks = QuickMockSetup.highLoad();
    // Test high load scenario
  });

  it("should handle emergency operations", () => {
    const mocks = QuickMockSetup.emergency();
    // Test emergency operations
  });

  it("should handle system recovery", () => {
    const mocks = QuickMockSetup.recovery();
    // Test system recovery
  });
});
```

### Custom Configuration

```typescript
import { QuickMockSetup } from "./__mocks__";

describe("Custom Scenario", () => {
  it("should handle custom configuration", () => {
    const mocks = QuickMockSetup.custom((suite) => {
      // Configure direct Bedrock for high latency
      suite.directBedrock.configureHighLatency();

      // Configure MCP as unavailable
      suite.mcpRouter.configureUnavailable();

      // Configure feature flags with warnings
      suite.featureFlags.configureWithWarnings([
        "Performance degradation detected",
      ]);

      // Configure audit trail with high volume
      suite.auditTrail.configureHighVolume(5000);
    });

    // Test custom scenario
  });
});
```

## Mock Factories

### Direct Bedrock Client Mock

```typescript
import { MockDirectBedrockClient } from "./__mocks__";

const directBedrock = new MockDirectBedrockClient();

// Configure for high latency
directBedrock.configureHighLatency();

// Configure for failure
directBedrock.configureFailure("Connection timeout");

// Configure for degraded performance
directBedrock.configureDegraded();
```

### MCP Router Mock

```typescript
import { MockMCPRouter } from "./__mocks__";

const mcpRouter = new MockMCPRouter();

// Configure as unavailable
mcpRouter.configureUnavailable();

// Configure for slow responses
mcpRouter.configureSlow();
```

### Intelligent Router Mock

```typescript
import { MockIntelligentRouter } from "./__mocks__";

const intelligentRouter = new MockIntelligentRouter();

// Configure for MCP-preferred routing
intelligentRouter.configureMCPPreferred();

// Configure for emergency routing
intelligentRouter.configureEmergency();

// Configure for fallback scenario
intelligentRouter.configureFallback();
```

### Infrastructure Auditor Mock

```typescript
import { MockInfrastructureAuditor } from "./__mocks__";

const auditor = new MockInfrastructureAuditor();

// Configure with issues
auditor.configureWithIssues();

// Configure for critical state
auditor.configureCritical();
```

### Meta Monitor Mock

```typescript
import { MockMetaMonitor } from "./__mocks__";

const metaMonitor = new MockMetaMonitor();

// Configure with failures
metaMonitor.configureWithFailures();

// Configure with performance issues
metaMonitor.configurePerformanceIssues();
```

### Implementation Support Mock

```typescript
import { MockImplementationSupport } from "./__mocks__";

const implementationSupport = new MockImplementationSupport();

// Configure complex backlog
implementationSupport.configureComplexBacklog();

// Configure auto-resolution failure
implementationSupport.configureAutoResolutionFailure();
```

### Hybrid Health Monitor Mock

```typescript
import { MockHybridHealthMonitor } from "./__mocks__";

const healthMonitor = new MockHybridHealthMonitor();

// Configure MCP degraded
healthMonitor.configureMCPDegraded();

// Configure both paths degraded
healthMonitor.configureBothDegraded();
```

### Audit Trail System Mock

```typescript
import { MockAuditTrailSystem } from "./__mocks__";

const auditTrail = new MockAuditTrailSystem();

// Configure with sample events
auditTrail.configureSampleEvents([
  { eventType: "support_operation", severity: "info" },
  { eventType: "infrastructure_audit", severity: "warning" },
]);

// Configure high volume
auditTrail.configureHighVolume(1000);

// Configure compliance violations
auditTrail.configureComplianceViolations();

// Configure error tracking
auditTrail.configureErrorTracking();
```

### Feature Flags Mock

```typescript
import { MockAiFeatureFlags } from "./__mocks__";

const featureFlags = new MockAiFeatureFlags();

// Configure as disabled
featureFlags.configureDisabled();

// Configure validation failure
featureFlags.configureValidationFailure(["Invalid configuration"]);

// Configure provider disabled
featureFlags.configureProviderDisabled("bedrock");

// Configure with warnings
featureFlags.configureWithWarnings(["Performance warning"]);
```

### Circuit Breaker Mock

```typescript
import { MockCircuitBreaker } from "./__mocks__";

const circuitBreaker = new MockCircuitBreaker();

// Configure as open (unhealthy)
circuitBreaker.configureOpen();

// Configure as half-open (recovering)
circuitBreaker.configureHalfOpen();

// Configure service-specific state
circuitBreaker.configureServiceState("mcp", "open");
```

### Compliance Integration Mock

```typescript
import { MockComplianceIntegration } from "./__mocks__";

const compliance = new MockComplianceIntegration();

// Configure violations
compliance.configureViolations(["GDPR violation", "Data residency issue"]);

// Configure provider non-compliant
compliance.configureProviderNonCompliant("bedrock", ["Region mismatch"]);

// Configure with warnings
compliance.configureWithWarnings(["Approaching threshold"]);
```

### GDPR Validator Mock

```typescript
import { MockGDPRHybridComplianceValidator } from "./__mocks__";

const gdprValidator = new MockGDPRHybridComplianceValidator();

// Configure GDPR violations
gdprValidator.configureGDPRViolations(["Data residency violation"]);

// Configure non-EU region
gdprValidator.configureNonEURegion();

// Configure PII detected
gdprValidator.configurePIIDetected();
```

## Test Data Generators

### Support Operation Request

```typescript
import { TestDataGenerators } from "./__mocks__";

const request = TestDataGenerators.supportOperationRequest({
  operation: "infrastructure_audit",
  priority: "high",
  timeout: 30000,
});
```

### Emergency Operation Request

```typescript
import { TestDataGenerators } from "./__mocks__";

const request = TestDataGenerators.emergencyOperationRequest({
  operation: "emergency_shutdown",
  severity: "critical",
  timeout: 5000,
});
```

### MCP Message

```typescript
import { TestDataGenerators } from "./__mocks__";

const message = TestDataGenerators.mcpMessage({
  type: "support_request",
  source: "bedrock_support",
  payload: { operation: "test" },
});
```

### Routing Decision

```typescript
import { TestDataGenerators } from "./__mocks__";

const decision = TestDataGenerators.routingDecision({
  operationType: "support",
  priority: "high",
  useDirectBedrock: true,
});
```

### Audit Event

```typescript
import { AuditTestDataGenerators } from "./__mocks__";

const event = AuditTestDataGenerators.auditEvent({
  eventType: "support_operation",
  severity: "info",
  action: "infrastructure_audit",
  outcome: "success",
});
```

## Scenario Configurations

### Normal Operations

Both paths healthy, intelligent routing working optimally.

```typescript
const mocks = QuickMockSetup.normalOperations();
```

### MCP Failure with Fallback

MCP unavailable, system falls back to Direct Bedrock.

```typescript
const mocks = QuickMockSetup.mcpFailure();
```

### High Load

System under high load, both paths experiencing latency.

```typescript
const mocks = QuickMockSetup.highLoad();
```

### Emergency Operations

Critical operation requiring immediate Direct Bedrock access.

```typescript
const mocks = QuickMockSetup.emergency();
```

### System Recovery

System recovering from issues, gradual return to normal.

```typescript
const mocks = QuickMockSetup.recovery();
```

## Mock State Management

### Save and Restore State

```typescript
import { MockStateManager } from "./__mocks__";

const stateManager = new MockStateManager();

// Save state
stateManager.saveState(
  "directBedrock",
  mockSuite.directBedrock.executeSupportOperation
);

// Modify mock
mockSuite.directBedrock.executeSupportOperation.mockResolvedValue({
  success: false,
});

// Restore state
stateManager.restoreState(
  "directBedrock",
  mockSuite.directBedrock.executeSupportOperation
);
```

### Reset All Mocks

```typescript
// Reset all mocks to default behavior
mockSuite.resetAll();
```

### Clear All Calls

```typescript
// Clear all mock call history
mockSuite.clearAllCalls();
```

## Complete Mock Suite

### Get All Mocks

```typescript
const allMocks = mockSuite.getAllMocks();

// Access individual mocks
const directBedrock = allMocks.directBedrock;
const mcpRouter = allMocks.mcpRouter;
const intelligentRouter = allMocks.intelligentRouter;
// ... etc
```

## Best Practices

1. **Always clear mock calls after each test**

   ```typescript
   afterEach(() => {
     mockSuite.clearAllCalls();
   });
   ```

2. **Use scenario-based mocks for common patterns**

   ```typescript
   const mocks = QuickMockSetup.normalOperations();
   ```

3. **Configure mocks for specific test needs**

   ```typescript
   mockSuite.directBedrock.configureHighLatency();
   ```

4. **Verify mock interactions**

   ```typescript
   expect(mockSuite.directBedrock.executeSupportOperation).toHaveBeenCalled();
   ```

5. **Use test data generators for consistency**
   ```typescript
   const request = TestDataGenerators.supportOperationRequest();
   ```

## Examples

See `hybrid-routing-scenarios.test.ts` for comprehensive examples of using these mocks in real test scenarios.

## Contributing

When adding new mock implementations:

1. Follow the existing factory pattern
2. Provide default behavior in constructor
3. Add configuration methods for common scenarios
4. Update this README with usage examples
5. Add tests demonstrating the new mocks

## License

MIT
