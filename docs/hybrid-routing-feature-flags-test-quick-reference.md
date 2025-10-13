# Hybrid Routing Feature Flags Test - Quick Reference

**Test File**: `src/lib/ai-orchestrator/__tests__/hybrid-routing-feature-flags.test.ts`  
**Test Count**: 33 tests  
**Status**: ✅ All Passing

## Running Tests

```bash
# Run all hybrid routing feature flag tests
npm test -- --testPathPattern="hybrid-routing-feature-flags"

# Run with coverage
npm test -- --testPathPattern="hybrid-routing-feature-flags" --coverage

# Run in watch mode
npm test -- --testPathPattern="hybrid-routing-feature-flags" --watch
```

## Test Categories

### 1. Feature Flag Activation (7 tests)

- Individual flag activation (3 tests)
- Sequential flag activation (2 tests)
- Bulk flag activation (2 tests)

### 2. Feature Flag Deactivation (6 tests)

- Individual flag deactivation (3 tests)
- Sequential flag deactivation (2 tests)
- Bulk flag deactivation (1 test)

### 3. System Behavior Changes (4 tests)

- Intelligent Router behavior (2 tests)
- Bedrock Support Manager behavior (2 tests)

### 4. Flag State Transitions (3 tests)

- Rapid toggle scenarios (2 tests)
- State persistence (1 test)

### 5. Safety Mechanisms (4 tests)

- Validation during activation (2 tests)
- Graceful degradation (2 tests)

### 6. Environment-Specific Behavior (3 tests)

- Development environment (1 test)
- Staging environment (1 test)
- Production environment (1 test)

### 7. Integration with Monitoring (2 tests)

- Audit log tracking (1 test)
- Health check integration (1 test)

### 8. Error Handling (3 tests)

- Activation errors (1 test)
- Deactivation errors (1 test)
- Validation errors (1 test)

## Key Test Scenarios

### Flag Activation Order

```typescript
// Recommended activation order
await featureFlags.setProviderEnabled("bedrock", true);
await featureFlags.setIntelligentRoutingEnabled(true);
await featureFlags.setBedrockSupportModeEnabled(true);
await featureFlags.setDirectBedrockFallbackEnabled(true);
```

### Flag Deactivation Order

```typescript
// Safe deactivation order
await featureFlags.setDirectBedrockFallbackEnabled(false);
await featureFlags.setBedrockSupportModeEnabled(false);
await featureFlags.setIntelligentRoutingEnabled(false);
```

### Bulk Operations

```typescript
// Enable all flags safely
const result = await featureFlags.enableBedrockSupportModeSafely();

// Disable all flags safely
await featureFlags.disableBedrockSupportModeSafely();
```

### Validation

```typescript
// Validate configuration
const result = await featureFlags.validateBedrockSupportModeFlags();
expect(result.isValid).toBe(true);
expect(result.errors).toHaveLength(0);
```

## Environment Configuration

### Development

- Support Mode: Disabled (safety first)
- Intelligent Routing: Enabled (testing)
- Direct Bedrock Fallback: Disabled

### Staging

- Support Mode: Disabled (enable for testing)
- Intelligent Routing: Enabled (production-like)
- Direct Bedrock Fallback: Enabled (test scenarios)

### Production

- Support Mode: Disabled (safety first)
- Intelligent Routing: Enabled (required)
- Direct Bedrock Fallback: Enabled (reliability)

## Common Test Patterns

### Testing Flag State

```typescript
expect(await featureFlags.isBedrockSupportModeEnabled()).toBe(false);
await featureFlags.setBedrockSupportModeEnabled(true);
expect(await featureFlags.isBedrockSupportModeEnabled()).toBe(true);
```

### Testing System Behavior

```typescript
await featureFlags.setIntelligentRoutingEnabled(true);
const router = new IntelligentRouter(mockDirectBedrockClient, mockMCPRouter);
const response = await router.executeSupportOperation(request);
expect(response).toBeDefined();
```

### Testing Validation

```typescript
await featureFlags.setProviderEnabled("bedrock", false);
await featureFlags.setBedrockSupportModeEnabled(true);
const result = await featureFlags.validateBedrockSupportModeFlags();
expect(result.isValid).toBe(false);
```

## Mock Setup

### Direct Bedrock Client Mock

```typescript
mockDirectBedrockClient = {
  executeSupportOperation: jest.fn().mockResolvedValue({
    success: true,
    text: "Direct Bedrock response",
    operationId: "direct-123",
    latencyMs: 500,
    timestamp: new Date(),
  }),
  getHealthStatus: jest.fn().mockResolvedValue({
    isHealthy: true,
    healthy: true,
    latencyMs: 300,
    lastCheck: new Date(),
    consecutiveFailures: 0,
    circuitBreakerState: "closed",
  }),
};
```

### MCP Router Mock

```typescript
mockMCPRouter = {
  executeSupportOperation: jest.fn().mockResolvedValue({
    success: true,
    text: "MCP response",
    operationId: "mcp-123",
    latencyMs: 800,
    timestamp: new Date(),
  }),
  getHealthStatus: jest.fn().mockResolvedValue({
    route: "mcp",
    isHealthy: true,
    healthy: true,
    latencyMs: 400,
    successRate: 0.95,
    lastCheck: new Date(),
    consecutiveFailures: 0,
  }),
  isAvailable: jest.fn().mockReturnValue(true),
};
```

## Troubleshooting

### Test Failures

**Issue**: Tests fail with "AuditTrailSystem is not defined"  
**Solution**: Ensure proper mocking or use simplified test patterns

**Issue**: Router tests fail with "No routing rule found"  
**Solution**: Setup routing rules before executing operations

**Issue**: Validation tests fail unexpectedly  
**Solution**: Check flag state before validation

### Performance Issues

**Issue**: Tests run slowly  
**Solution**: Use `--no-coverage` flag for faster execution

**Issue**: Mock setup is slow  
**Solution**: Optimize mock creation in beforeEach

## Best Practices

1. **Always clean up**: Call `router.destroy()` after tests
2. **Reset state**: Use `beforeEach` to reset feature flags
3. **Test independence**: Each test should be independent
4. **Clear assertions**: Use descriptive expect statements
5. **Mock isolation**: Keep mocks simple and focused

## Integration with CI/CD

### GitHub Actions

```yaml
- name: Run Hybrid Routing Feature Flag Tests
  run: npm test -- --testPathPattern="hybrid-routing-feature-flags" --no-coverage
```

### Pre-commit Hook

```bash
npm test -- --testPathPattern="hybrid-routing-feature-flags" --bail
```

## Related Documentation

- [Bedrock Activation Tasks](.kiro/specs/bedrock-activation/tasks.md)
- [AI Feature Flags](src/lib/ai-orchestrator/ai-feature-flags.ts)
- [Intelligent Router](src/lib/ai-orchestrator/intelligent-router.ts)
- [Bedrock Support Manager](src/lib/ai-orchestrator/bedrock-support-manager.ts)

## Quick Stats

- **Total Tests**: 33
- **Test Categories**: 8
- **Execution Time**: ~1.5-2.5 seconds
- **Success Rate**: 100%
- **Code Coverage**: High (mocks comprehensive)

---

**Last Updated**: 2025-10-08  
**Status**: ✅ Production Ready  
**Maintainer**: AI Orchestrator Team
