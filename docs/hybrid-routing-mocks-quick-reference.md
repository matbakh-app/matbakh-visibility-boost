# Hybrid Routing Mocks - Quick Reference Guide

**Version**: 1.0.0  
**Last Updated**: 2025-01-14  
**Status**: Production-Ready

## Quick Start

```typescript
import { QuickMockSetup } from "./__mocks__";

// Setup mocks for normal operations
const mocks = QuickMockSetup.normalOperations();

// Use mocks in tests
const result = await mocks.directBedrock.executeSupportOperation({
  operation: "test",
  priority: "high",
});

// Clean up after tests
mocks.clearAllCalls();
```

## Pre-configured Scenarios

| Scenario              | Command                             | Use Case                                    |
| --------------------- | ----------------------------------- | ------------------------------------------- |
| **Normal Operations** | `QuickMockSetup.normalOperations()` | Both paths healthy, optimal routing         |
| **MCP Failure**       | `QuickMockSetup.mcpFailure()`       | MCP unavailable, fallback to Direct Bedrock |
| **High Load**         | `QuickMockSetup.highLoad()`         | System under stress, high latency           |
| **Emergency**         | `QuickMockSetup.emergency()`        | Critical operations, direct access          |
| **Recovery**          | `QuickMockSetup.recovery()`         | System recovering, gradual improvement      |

## Mock Components

### Direct Bedrock Client

```typescript
mocks.directBedrock.executeSupportOperation();
mocks.directBedrock.executeEmergencyOperation();
mocks.directBedrock.getHealthStatus();

// Configurations
mocks.directBedrock.configureHighLatency();
mocks.directBedrock.configureFailure("error message");
mocks.directBedrock.configureDegraded();
```

### MCP Router

```typescript
mocks.mcpRouter.route();
mocks.mcpRouter.sendMessage();
mocks.mcpRouter.getHealthStatus();

// Configurations
mocks.mcpRouter.configureUnavailable();
mocks.mcpRouter.configureSlow();
```

### Intelligent Router

```typescript
mocks.intelligentRouter.decide();
mocks.intelligentRouter.executeSupportOperation();
mocks.intelligentRouter.getRouteHealth();

// Configurations
mocks.intelligentRouter.configureMCPPreferred();
mocks.intelligentRouter.configureEmergency();
mocks.intelligentRouter.configureFallback();
```

### Infrastructure Auditor

```typescript
mocks.infrastructureAuditor.performSystemHealthCheck();
mocks.infrastructureAuditor.detectImplementationGaps();
mocks.infrastructureAuditor.generateAuditReport();

// Configurations
mocks.infrastructureAuditor.configureWithIssues();
mocks.infrastructureAuditor.configureCritical();
```

### Meta Monitor

```typescript
mocks.metaMonitor.analyzeKiroExecution();
mocks.metaMonitor.detectFailurePatterns();
mocks.metaMonitor.identifyPerformanceBottlenecks();

// Configurations
mocks.metaMonitor.configureWithFailures();
mocks.metaMonitor.configurePerformanceIssues();
```

### Implementation Support

```typescript
mocks.implementationSupport.supportIncompleteModule();
mocks.implementationSupport.provideRemediationSuggestions();
mocks.implementationSupport.attemptAutoResolution();

// Configurations
mocks.implementationSupport.configureComplexBacklog();
mocks.implementationSupport.configureAutoResolutionFailure();
```

### Hybrid Health Monitor

```typescript
mocks.hybridHealthMonitor.checkMCPHealth();
mocks.hybridHealthMonitor.checkDirectBedrockHealth();
mocks.hybridHealthMonitor.getOverallHealth();

// Configurations
mocks.hybridHealthMonitor.configureMCPDegraded();
mocks.hybridHealthMonitor.configureBothDegraded();
```

### Audit Trail System

```typescript
mocks.auditTrail.logEvent()
mocks.auditTrail.queryEvents()
mocks.auditTrail.generateReport()

// Configurations
mocks.auditTrail.configureSampleEvents([...])
mocks.auditTrail.configureHighVolume(1000)
mocks.auditTrail.configureComplianceViolations()
```

### Feature Flags

```typescript
mocks.featureFlags.isBedrockSupportModeEnabled();
mocks.featureFlags.validateBedrockSupportModeFlags();
mocks.featureFlags.isProviderEnabled();

// Configurations
mocks.featureFlags.configureDisabled();
mocks.featureFlags.configureValidationFailure(["error"]);
mocks.featureFlags.configureProviderDisabled("bedrock");
```

### Circuit Breaker

```typescript
mocks.circuitBreaker.canExecute();
mocks.circuitBreaker.isOpen();
mocks.circuitBreaker.getState();

// Configurations
mocks.circuitBreaker.configureOpen();
mocks.circuitBreaker.configureHalfOpen();
mocks.circuitBreaker.configureServiceState("mcp", "open");
```

### Compliance Integration

```typescript
mocks.complianceIntegration.validateCompliance();
mocks.complianceIntegration.enforceCompliance();
mocks.complianceIntegration.getComplianceSummary();

// Configurations
mocks.complianceIntegration.configureViolations(["error"]);
mocks.complianceIntegration.configureProviderNonCompliant("bedrock", ["error"]);
```

### GDPR Validator

```typescript
mocks.gdprValidator.validateBeforeRouting();
mocks.gdprValidator.generateHybridComplianceReport();
mocks.gdprValidator.validateEUDataResidency();

// Configurations
mocks.gdprValidator.configureGDPRViolations(["error"]);
mocks.gdprValidator.configureNonEURegion();
mocks.gdprValidator.configurePIIDetected();
```

## Custom Configuration

```typescript
const mocks = QuickMockSetup.custom((suite) => {
  // Configure multiple components
  suite.directBedrock.configureHighLatency();
  suite.mcpRouter.configureUnavailable();
  suite.featureFlags.configureWithWarnings(["warning"]);
  suite.auditTrail.configureHighVolume(5000);
});
```

## State Management

```typescript
// Save mock state
mocks.stateManager.saveState(
  "directBedrock",
  mocks.directBedrock.executeSupportOperation
);

// Restore mock state
mocks.stateManager.restoreState(
  "directBedrock",
  mocks.directBedrock.executeSupportOperation
);

// Reset all mocks
mocks.resetAll();

// Clear all mock calls
mocks.clearAllCalls();
```

## Test Data Generators

```typescript
import { TestDataGenerators, AuditTestDataGenerators } from "./__mocks__";

// Support operation request
const request = TestDataGenerators.supportOperationRequest({
  operation: "infrastructure_audit",
  priority: "high",
});

// Emergency operation request
const emergency = TestDataGenerators.emergencyOperationRequest({
  operation: "emergency_shutdown",
  severity: "critical",
});

// MCP message
const message = TestDataGenerators.mcpMessage({
  type: "support_request",
  source: "bedrock_support",
});

// Routing decision
const decision = TestDataGenerators.routingDecision({
  operationType: "support",
  useDirectBedrock: true,
});

// Audit event
const event = AuditTestDataGenerators.auditEvent({
  eventType: "support_operation",
  severity: "info",
});
```

## Common Test Patterns

### Test Normal Operation

```typescript
it("should execute support operation", async () => {
  const mocks = QuickMockSetup.normalOperations();

  const result = await mocks.directBedrock.executeSupportOperation({
    operation: "test",
    priority: "high",
  });

  expect(result.success).toBe(true);
  expect(result.latency).toBeLessThan(1000);
});
```

### Test Failure Scenario

```typescript
it("should handle MCP failure", async () => {
  const mocks = QuickMockSetup.mcpFailure();

  const health = await mocks.mcpRouter.getHealthStatus();

  expect(health.status).toBe("unhealthy");
  expect(health.errorRate).toBeGreaterThan(0.5);
});
```

### Test Fallback Behavior

```typescript
it("should fallback to direct Bedrock", async () => {
  const mocks = QuickMockSetup.mcpFailure();

  const decision = mocks.intelligentRouter.decide({
    operation: "support_operation",
    priority: "high",
  });

  expect(decision.useDirectBedrock).toBe(true);
  expect(decision.fallbackStrategy).toBe("none");
});
```

### Test Emergency Operations

```typescript
it("should handle emergency operations", async () => {
  const mocks = QuickMockSetup.emergency();

  const response = await mocks.directBedrock.executeEmergencyOperation({
    operation: "emergency_shutdown",
    severity: "critical",
  });

  expect(response.success).toBe(true);
  expect(response.latency).toBeLessThan(500);
});
```

### Test Audit Logging

```typescript
it("should log operations to audit trail", async () => {
  const mocks = QuickMockSetup.normalOperations();

  await mocks.auditTrail.logEvent({
    eventType: "support_operation",
    severity: "info",
    action: "infrastructure_audit",
    outcome: "success",
  });

  expect(mocks.auditTrail.logEvent).toHaveBeenCalled();
});
```

## Best Practices

1. **Always clear mock calls after each test**

   ```typescript
   afterEach(() => {
     mocks.clearAllCalls();
   });
   ```

2. **Use scenario-based mocks for common patterns**

   ```typescript
   const mocks = QuickMockSetup.normalOperations();
   ```

3. **Configure mocks for specific test needs**

   ```typescript
   mocks.directBedrock.configureHighLatency();
   ```

4. **Verify mock interactions**

   ```typescript
   expect(mocks.directBedrock.executeSupportOperation).toHaveBeenCalled();
   ```

5. **Use test data generators for consistency**
   ```typescript
   const request = TestDataGenerators.supportOperationRequest();
   ```

## Troubleshooting

### Mock not defined

```typescript
// Ensure you're using the correct import
import { QuickMockSetup } from "./__mocks__";

// Verify mock suite is initialized
const mocks = QuickMockSetup.normalOperations();
expect(mocks.directBedrock).toBeDefined();
```

### Mock not behaving as expected

```typescript
// Check if mock is configured correctly
mocks.directBedrock.configureHighLatency();

// Verify mock implementation
expect(mocks.directBedrock.executeSupportOperation).toBeDefined();
```

### Mock calls not being tracked

```typescript
// Ensure you're not resetting mocks mid-test
// Clear calls only in afterEach
afterEach(() => {
  mocks.clearAllCalls();
});
```

## Additional Resources

- **Full Documentation**: `src/lib/ai-orchestrator/__tests__/__mocks__/README.md`
- **Test Examples**: `src/lib/ai-orchestrator/__tests__/hybrid-routing-scenarios.test.ts`
- **Completion Report**: `docs/bedrock-activation-task-7.1-mock-implementations-completion-report.md`

## Support

For questions or issues with the mock implementations:

1. Check the full documentation in `__mocks__/README.md`
2. Review test examples in `hybrid-routing-scenarios.test.ts`
3. Consult the completion report for detailed implementation information

---

**Version**: 1.0.0  
**Status**: Production-Ready  
**Test Coverage**: 100% (27/27 tests passing)  
**Last Updated**: 2025-01-14
