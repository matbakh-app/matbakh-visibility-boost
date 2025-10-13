# Enhanced Tool-Call Adapter System

## Overview

The Enhanced Tool-Call Adapter provides a unified interface for tool calling across multiple AI providers (Bedrock, Google, Meta) with OpenAI-compatible schemas. This system implements the requirements from Task 1.2 of the System Optimization Enhancement specification.

## Key Features

### 🔄 Unified Schema Support

- **OpenAI-compatible format**: All providers use the same tool specification format
- **Cross-provider compatibility**: Tools defined once work across all providers
- **Automatic conversion**: Seamless mapping between unified and provider-specific formats

### 🛡️ Fallback & Degradation

- **Circuit breaker pattern**: Automatic provider failure detection
- **Intelligent fallbacks**: Smart selection of alternative providers
- **Graceful degradation**: Fast answers when all providers fail

### ⚡ Enhanced Capabilities

- **Feature detection**: Automatic detection of provider-specific capabilities
- **Performance optimization**: Cost and latency-aware routing
- **Robust error handling**: Comprehensive error recovery mechanisms

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Tool-Call Adapter System                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │ Unified Schema  │    │ Capability      │                │
│  │ (OpenAI-like)   │    │ Matrix          │                │
│  └─────────────────┘    └─────────────────┘                │
│           │                       │                        │
│           ▼                       ▼                        │
│  ┌─────────────────────────────────────────────────────────┤
│  │              Provider Adapters                          │
│  ├─────────────────┬─────────────────┬─────────────────────┤
│  │ BedrockAdapter  │ GoogleAdapter   │ MetaAdapter         │
│  │ • Tool Use API  │ • Function Call │ • Prompt Embedding │
│  │ • Streaming     │ • Parallel Call │ • Limited Support  │
│  │ • JSON Mode     │ • Safety Filter │ • Text-based       │
│  └─────────────────┴─────────────────┴─────────────────────┤
│                           │                                │
│                           ▼                                │
│  ┌─────────────────────────────────────────────────────────┤
│  │              Fallback Manager                           │
│  │ • Circuit Breaker  • Retry Logic  • Degradation        │
│  └─────────────────────────────────────────────────────────┘
└─────────────────────────────────────────────────────────────┘
```

## Usage Examples

### Basic Tool Definition

```typescript
import { UnifiedToolSpec } from "./tool-call-adapter";

const weatherTool: UnifiedToolSpec = {
  type: "function",
  function: {
    name: "get_weather",
    description: "Get current weather for a location",
    parameters: {
      type: "object",
      properties: {
        location: { type: "string", description: "City name" },
        units: { type: "string", enum: ["celsius", "fahrenheit"] },
      },
      required: ["location"],
      additionalProperties: false,
    },
  },
};
```

### Provider-Specific Usage

```typescript
import { BedrockAdapter, GoogleAdapter, MetaAdapter } from "./adapters";

const bedrock = new BedrockAdapter();
const google = new GoogleAdapter();
const meta = new MetaAdapter();

// Convert to provider-specific format
const bedrockTools = bedrock.fromUnifiedSchema([weatherTool]);
const googleTools = google.fromUnifiedSchema([weatherTool]);
const metaTools = meta.fromUnifiedSchema([weatherTool]);

// Build requests with tools
const bedrockRequest = bedrock.buildRequest({
  prompt: "What is the weather in Berlin?",
  decision: routeDecision,
  tools: [weatherTool],
});
```

### Fallback Handling

```typescript
import { FallbackManager } from "./fallback-manager";

const fallbackManager = new FallbackManager({
  maxRetries: 3,
  retryDelayMs: 1000,
  circuitBreakerThreshold: 5,
  degradationMode: "fast_answer",
});

const result = await fallbackManager.executeWithFallback(
  {
    originalRequest: aiRequest,
    originalDecision: routeDecision,
    attemptCount: 0,
    fallbackReason: "timeout",
  },
  async (decision) => {
    // Execute AI request with fallback support
    return await executeAIRequest(decision);
  }
);
```

## Provider Capabilities

### Bedrock (Claude)

- ✅ **Parallel tool calls**: Multiple tools in one request
- ✅ **Streaming with tools**: Real-time tool execution
- ✅ **JSON schema validation**: Strict parameter validation
- ✅ **Complex types**: Nested objects and arrays
- ✅ **Vision support**: Image analysis with tools

### Google (Gemini)

- ✅ **Parallel tool calls**: Multiple tools in one request
- ❌ **Streaming with tools**: Not supported yet
- ✅ **JSON schema validation**: Parameter validation
- ✅ **Complex types**: Nested objects and arrays
- ✅ **Vision support**: Image analysis with tools

### Meta (Llama)

- ❌ **Parallel tool calls**: No structured tool support
- ❌ **Streaming with tools**: No tool support
- ❌ **JSON schema validation**: Limited JSON support
- ❌ **Complex types**: Basic types only
- ❌ **Vision support**: Text-only models

## Error Handling

The system provides comprehensive error handling at multiple levels:

### 1. Validation Errors

```typescript
const isValid = adapter.validateToolSpec(toolSpec);
if (!isValid) {
  throw new Error("Invalid tool specification");
}
```

### 2. Provider Errors

```typescript
try {
  const result = await adapter.parseResponse(response);
} catch (error) {
  // Automatic fallback to alternative provider
  console.warn(`Provider error: ${error.message}`);
}
```

### 3. Circuit Breaker

```typescript
// Automatic circuit breaker prevents cascade failures
const status = fallbackManager.getCircuitBreakerStatus();
console.log("Provider health:", status);
```

## Performance Optimization

### Cost-Aware Routing

```typescript
import { CapabilityMatrix } from "./capability-matrix";

// Find cheapest model that supports tools
const cheapestModel = CapabilityMatrix.getCheapestModel({
  supportsTools: true,
  maxLatencyMs: 2000,
});

// Estimate costs before execution
const estimatedCost = CapabilityMatrix.estimateCost(
  "anthropic.claude-3-5-sonnet",
  1000, // input tokens
  500 // output tokens
);
```

### Latency Optimization

```typescript
// Find fastest model for time-critical requests
const fastestModel = CapabilityMatrix.getFastestModel({
  supportsTools: true,
  supportsJson: true,
});
```

## Testing

The system includes comprehensive test coverage:

```bash
# Run tool-call adapter tests
npm test -- --testPathPattern=tool-call-adapter.test.ts

# Run integration tests
npm test -- --testPathPattern=tool-call-integration.test.ts
```

### Test Coverage

- ✅ **Unit tests**: Individual adapter functionality
- ✅ **Integration tests**: Cross-provider compatibility
- ✅ **Error handling**: Graceful failure scenarios
- ✅ **Performance tests**: Cost and latency validation
- ✅ **Fallback tests**: Circuit breaker and degradation

## Configuration

### Environment Variables

```bash
# Provider-specific settings
BEDROCK_REGION=eu-central-1
GOOGLE_API_KEY=your-api-key
META_ENDPOINT=your-endpoint

# Fallback settings
FALLBACK_MAX_RETRIES=3
FALLBACK_RETRY_DELAY_MS=1000
CIRCUIT_BREAKER_THRESHOLD=5
```

### Runtime Configuration

```typescript
const adapter = new BedrockAdapter();
const config = adapter.getProviderConfig();

console.log("Provider capabilities:", {
  maxContextTokens: config.maxContextTokens,
  supportsTools: config.supportsTools,
  supportsStreaming: config.supportsStreaming,
  fallbackProvider: config.fallbackProvider,
});
```

## Monitoring and Observability

### Circuit Breaker Status

```typescript
const status = fallbackManager.getCircuitBreakerStatus();
// Returns: { bedrock: { failures: 0, isOpen: false }, ... }
```

### Performance Metrics

```typescript
const metrics = {
  latency: response.latencyMs,
  cost: response.costEuro,
  tokensUsed: response.tokensUsed,
  provider: response.provider,
};
```

## Migration Guide

### From Legacy Tool System

1. **Update tool definitions** to use UnifiedToolSpec format
2. **Replace direct provider calls** with adapter pattern
3. **Add fallback handling** for improved reliability
4. **Update tests** to use new adapter interfaces

### Breaking Changes

- Tool specifications must use OpenAI-compatible format
- Provider-specific tool formats are deprecated
- Direct provider instantiation should be replaced with adapters

## Best Practices

### 1. Tool Design

- Use descriptive function names and descriptions
- Define clear parameter schemas with validation
- Include examples in tool descriptions
- Keep parameter lists concise

### 2. Error Handling

- Always validate tool specifications before use
- Implement graceful degradation for critical paths
- Monitor circuit breaker status in production
- Log tool execution failures for debugging

### 3. Performance

- Cache tool definitions to avoid repeated parsing
- Use cost-aware routing for budget-conscious applications
- Prefer faster models for time-critical operations
- Monitor token usage and costs

### 4. Testing

- Test tools with all supported providers
- Validate error handling scenarios
- Include performance benchmarks
- Test fallback mechanisms regularly

## Contributing

When adding new providers or enhancing existing adapters:

1. Implement the `ToolCallAdapter` interface
2. Add comprehensive test coverage
3. Update the capability matrix
4. Document provider-specific limitations
5. Add integration tests for cross-provider compatibility

## Troubleshooting

### Common Issues

**Tool calls not working**

- Verify tool specification format
- Check provider capability support
- Validate parameter schemas

**High latency**

- Check circuit breaker status
- Consider using faster models
- Optimize tool parameter validation

**Cost overruns**

- Monitor token usage patterns
- Use cost-aware routing
- Implement budget guards

**Provider failures**

- Check circuit breaker logs
- Verify API credentials
- Test fallback mechanisms
