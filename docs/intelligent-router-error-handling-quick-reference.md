# Intelligent Router Error Handling - Quick Reference

**Version**: 1.0.0  
**Last Updated**: 2025-01-14  
**Test Suite**: `intelligent-router-error-handling.test.ts`  
**Status**: ✅ 27/27 tests passing

## Quick Test Summary

```bash
# Run error handling tests
npm test -- --testPathPattern="intelligent-router-error-handling"

# Run with coverage
npm test -- --testPathPattern="intelligent-router-error-handling" --coverage
```

## Test Categories

### 1. Missing Routing Rules

- **Tests**: 2
- **Coverage**: No matching rules, partial matching
- **Key Behavior**: Returns error response when no rule found

### 2. Route Unavailability

- **Tests**: 3
- **Coverage**: Direct unavailable, MCP unavailable, both unavailable
- **Key Behavior**: Automatic fallback to secondary route

### 3. Emergency Operations

- **Tests**: 2
- **Coverage**: Unhealthy routes, operation failures
- **Key Behavior**: Attempts operation regardless of health

### 4. Health Check Failures

- **Tests**: 4
- **Coverage**: Timeouts, errors, caching, consecutive failures
- **Key Behavior**: Graceful degradation, 30s cache

### 5. MCP Router Initialization

- **Tests**: 2
- **Coverage**: Missing router, late initialization
- **Key Behavior**: Works without MCP, supports late init

### 6. Invalid Request Parameters

- **Tests**: 3
- **Coverage**: Null operations, empty prompts, long prompts
- **Key Behavior**: Validates parameters, handles edge cases

### 7. Concurrent Requests

- **Tests**: 2
- **Coverage**: Multiple requests, concurrent health checks
- **Key Behavior**: Thread-safe, no race conditions

### 8. Routing Metrics

- **Tests**: 3
- **Coverage**: Zero requests, many requests, recommendations
- **Key Behavior**: Correct metrics calculation

### 9. Feature Flags

- **Tests**: 1
- **Coverage**: Intelligent routing flag
- **Key Behavior**: Respects feature flag settings

### 10. Resource Cleanup

- **Tests**: 2
- **Coverage**: Single destroy, multiple destroys
- **Key Behavior**: Safe cleanup, no memory leaks

### 11. Correlation IDs

- **Tests**: 1
- **Coverage**: Unique ID generation
- **Key Behavior**: All operations tracked

### 12. Latency Requirements

- **Tests**: 1
- **Coverage**: Latency tracking
- **Key Behavior**: Respects latency requirements

### 13. Route Type Validation

- **Tests**: 1
- **Coverage**: Invalid route types
- **Key Behavior**: Graceful handling of invalid config

## Common Error Scenarios

### Scenario 1: No Routing Rule Found

```typescript
// Error Response
{
  success: false,
  error: "No routing rule found for operation: unknown_operation",
  operationId: "router-xxx-error",
  latencyMs: 123,
  timestamp: Date
}
```

### Scenario 2: All Routes Unavailable

```typescript
// Both direct and MCP fail
{
  success: false,
  error: "Operation failed",
  operationId: "router-xxx-error",
  latencyMs: 456,
  timestamp: Date
}
```

### Scenario 3: Health Check Failure

```typescript
// Health status returned even on error
{
  route: "direct",
  isHealthy: false,
  latencyMs: 1000,
  successRate: 0.0,
  lastCheck: Date,
  consecutiveFailures: 1
}
```

### Scenario 4: Emergency Operation

```typescript
// Always attempted, regardless of health
{
  success: true/false,
  operationId: "router-xxx-direct",
  latencyMs: 500,
  timestamp: Date
}
```

## Error Handling Patterns

### Pattern 1: Fallback on Primary Failure

```typescript
try {
  return await primaryRoute.execute(request);
} catch (error) {
  if (fallbackRoute) {
    return await fallbackRoute.execute(request);
  }
  throw error;
}
```

### Pattern 2: Health Check Caching

```typescript
// Cache for 30 seconds
if (cached && Date.now() - cached.lastCheck < 30000) {
  return cached;
}
// Perform fresh health check
```

### Pattern 3: Consecutive Failure Tracking

```typescript
// Increment on failure
consecutiveFailures: (cached?.consecutiveFailures || 0) + 1;

// Reset on success
consecutiveFailures: 0;
```

### Pattern 4: Emergency Override

```typescript
if (operation === "emergency") {
  // Force direct route even if unhealthy
  return { selectedRoute: "direct", ... };
}
```

## Validation Checklist

### Before Deployment

- [ ] All 27 tests passing
- [ ] No skipped or TODO tests
- [ ] Error messages clear and actionable
- [ ] Fallback mechanisms working
- [ ] Health checks functioning
- [ ] Metrics collecting correctly
- [ ] Resource cleanup verified
- [ ] Concurrent access safe

### Monitoring Points

- [ ] Fallback usage rate < 20%
- [ ] Health check failures < 5 consecutive
- [ ] Error rate < 5%
- [ ] Correlation IDs present
- [ ] Latency within SLA
- [ ] Memory usage stable

## Troubleshooting

### Issue: Tests Failing

```bash
# Check test output
npm test -- --testPathPattern="intelligent-router-error-handling" --verbose

# Check for mock issues
# Ensure mocks return proper structure with all required fields
```

### Issue: Health Checks Not Caching

```bash
# Verify cache timeout (30s)
# Check Date.now() - cached.lastCheck calculation
```

### Issue: Fallback Not Working

```bash
# Verify routing rules have fallbackRoute configured
# Check primary route is actually failing
# Ensure fallback route is available
```

### Issue: Concurrent Test Failures

```bash
# Check for race conditions
# Verify thread-safe operations
# Ensure proper mock cleanup between tests
```

## Performance Benchmarks

### Test Execution

- **Total Time**: ~4-5 seconds
- **Average per Test**: ~145ms
- **Concurrent Tests**: 82ms for 10 requests
- **Metrics Tests**: 1033ms for 150 requests

### Expected Behavior

- **Health Check**: < 1 second
- **Operation Execution**: < 2 seconds
- **Fallback**: < 3 seconds total
- **Metrics Calculation**: < 100ms

## Integration Points

### Direct Bedrock Client

```typescript
mockDirectBedrockClient = {
  executeSupportOperation: jest.fn(),
  performHealthCheck: jest.fn(),
};
```

### MCP Router

```typescript
mockMCPRouter = {
  executeSupportOperation: jest.fn(),
  getHealthStatus: jest.fn(),
  isAvailable: jest.fn(),
};
```

### Feature Flags

```typescript
// Checked internally by IntelligentRouter
featureFlags.isEnabled("ENABLE_INTELLIGENT_ROUTING");
```

## Best Practices

### Test Writing

1. ✅ Clear test descriptions
2. ✅ Proper mock setup in beforeEach
3. ✅ Cleanup in afterEach
4. ✅ Validate all response fields
5. ✅ Test both success and failure paths

### Error Handling

1. ✅ Always return response (never throw unhandled)
2. ✅ Include error message in response
3. ✅ Track correlation IDs
4. ✅ Log errors for debugging
5. ✅ Provide fallback when possible

### Health Monitoring

1. ✅ Cache health checks (30s)
2. ✅ Track consecutive failures
3. ✅ Graceful degradation
4. ✅ Don't crash on health check errors
5. ✅ Update health status regularly

## Quick Commands

```bash
# Run all error handling tests
npm test -- --testPathPattern="intelligent-router-error-handling"

# Run specific test suite
npm test -- --testPathPattern="intelligent-router-error-handling" -t "Emergency Operations"

# Run with coverage
npm test -- --testPathPattern="intelligent-router-error-handling" --coverage

# Watch mode
npm test -- --testPathPattern="intelligent-router-error-handling" --watch

# Verbose output
npm test -- --testPathPattern="intelligent-router-error-handling" --verbose
```

## Related Documentation

- [Intelligent Router Error Handling Tests Completion Report](./intelligent-router-error-handling-tests-completion-report.md)
- [AI Provider Architecture](./ai-provider-architecture.md)
- [Hybrid Routing Documentation](./hybrid-routing-comprehensive-tests-completion-report.md)
- [Support Documentation](./support.md)

---

**Status**: ✅ Production Ready  
**Test Coverage**: 27/27 tests passing  
**Confidence**: HIGH
