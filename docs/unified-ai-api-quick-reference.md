# Unified AI API - Quick Reference Guide

## 🚀 **Quick Start**

### Basic Usage

```typescript
import { createUnifiedAiApi } from "./lib/ai-orchestrator/unified-ai-api";

// Create API instance
const aiApi = createUnifiedAiApi({
  fallbackStrategy: "cost-optimized",
  enableCaching: true,
  enableMonitoring: true,
});

// Generate response
const response = await aiApi.generateResponse({
  prompt: "Explain quantum computing in German",
  context: {
    domain: "general",
    locale: "de-DE",
    budgetTier: "standard",
  },
});

console.log(response.text);
```

### React Hook Usage

```typescript
import { useUnifiedAi } from "./hooks/useUnifiedAi";

function AIComponent() {
  const { generateResponse, isLoading, response, error } = useUnifiedAi({
    enableAutoRetry: true,
    maxRetries: 3,
  });

  const handleSubmit = async () => {
    await generateResponse({
      prompt: "Generate a pasta recipe",
      context: { domain: "culinary" },
    });
  };

  return (
    <div>
      <button onClick={handleSubmit} disabled={isLoading}>
        {isLoading ? "Generating..." : "Generate Recipe"}
      </button>
      {response && <div>{response.text}</div>}
      {error && <div>Error: {error.message}</div>}
    </div>
  );
}
```

---

## 🔧 **Configuration**

### Environment Variables

```bash
# AWS Bedrock
AWS_REGION=eu-central-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Google AI
GOOGLE_AI_API_KEY=your-google-api-key

# Meta AI
META_API_ENDPOINT=https://api.meta.com/v1
META_API_KEY=your-meta-api-key

# Feature Flags
EVIDENTLY_PROJECT=matbakh-ai-unified-api
```

### API Configuration

```typescript
const config = {
  providers: {
    bedrock: {
      region: "eu-central-1",
      models: ["anthropic.claude-3-5-sonnet-20241022-v2:0"],
    },
    google: {
      apiKey: process.env.GOOGLE_AI_API_KEY,
      models: ["gemini-1.5-pro"],
    },
    meta: {
      apiKey: process.env.META_API_KEY,
      models: ["meta-llama/Llama-3.2-90B-Vision-Instruct"],
    },
  },
  fallbackStrategy: "cost-optimized", // 'latency-optimized' | 'round-robin'
  enableCaching: true,
  enableMonitoring: true,
  maxRetries: 3,
  timeoutMs: 30000,
};
```

---

## 📊 **Provider Comparison**

| Provider    | Cost/1K tokens   | Latency         | Context      | Features                             |
| ----------- | ---------------- | --------------- | ------------ | ------------------------------------ |
| **Meta**    | €0.002 (lowest)  | 800ms           | 128K         | Text, JSON                           |
| **Google**  | €0.0025          | 700ms           | 1M (largest) | Text, JSON, Vision, Tools            |
| **Bedrock** | €0.003 (highest) | 600ms (fastest) | 200K         | Text, JSON, Vision, Tools, Streaming |

### Routing Strategies

- **Cost-Optimized**: Meta → Google → Bedrock (saves 30-50%)
- **Latency-Optimized**: Bedrock → Google → Meta (fastest response)
- **Round-Robin**: Even distribution across all providers

---

## 🛠️ **API Methods**

### Core Methods

```typescript
// Generate AI response
const response = await api.generateResponse(request);

// Test provider connectivity
const isConnected = await api.testProvider("bedrock");

// Get provider health status
const health = await api.getProviderHealth();

// Get API metrics
const metrics = api.getMetrics();

// Reset circuit breaker
api.resetCircuitBreaker("google");

// Enable/disable provider
await api.setProviderEnabled("meta", false);
```

### React Hooks

```typescript
// Main AI hook
const { generateResponse, isLoading, response, error } = useUnifiedAi();

// Provider management
const { testAllProviders, resetAllCircuitBreakers } = useProviderManagement();

// Real-time metrics
const { metrics, health, refreshMetrics } = useAiMetrics();
```

---

## 🏥 **Health Monitoring**

### Health Check Endpoint

```bash
# Check all providers
curl https://your-api-endpoint/providers/health

# Check specific provider
curl https://your-api-endpoint/providers/bedrock/test
```

### Health Status Levels

- **Healthy**: Error rate < 5%, Latency < 2s
- **Degraded**: Error rate 5-10%, Latency 2-5s
- **Unhealthy**: Error rate > 10%, Latency > 5s

### Circuit Breaker States

- **Closed**: Normal operation
- **Open**: Provider disabled due to failures
- **Half-Open**: Testing if provider recovered

---

## 🚨 **Error Handling**

### Common Error Types

```typescript
try {
  const response = await api.generateResponse(request);
} catch (error) {
  if (error.message.includes("timeout")) {
    // Handle timeout
  } else if (error.message.includes("All providers failed")) {
    // Handle complete failure
  } else if (error.message.includes("Circuit breaker open")) {
    // Handle circuit breaker
  }
}
```

### Retry Strategy

```typescript
const { generateResponse } = useUnifiedAi({
  enableAutoRetry: true,
  maxRetries: 3,
  retryDelay: 1000, // 1 second base delay
});
```

---

## 📈 **Performance Optimization**

### Caching

```typescript
// Automatic caching (1 hour TTL)
const response1 = await api.generateResponse(request); // API call
const response2 = await api.generateResponse(request); // Cached (fast)
```

### Request Optimization

```typescript
// Optimize for cost
const request = {
  prompt: "Short, specific prompt",
  context: {
    domain: "specific-domain",
    budgetTier: "low", // Routes to Meta first
  },
};

// Optimize for speed
const request = {
  prompt: "Urgent request",
  context: {
    budgetTier: "premium", // Routes to Bedrock first
  },
};
```

---

## 🔧 **Deployment**

### Development

```bash
# Install dependencies
npm install

# Run tests
npm test -- --testPathPattern=unified-ai-api

# Deploy to development
npx tsx scripts/deploy-unified-ai-api.ts deploy development
```

### Production

```bash
# Deploy to production
npx tsx scripts/deploy-unified-ai-api.ts deploy production

# Verify deployment
aws cloudformation describe-stacks --stack-name UnifiedAiApiStack

# Monitor metrics
aws cloudwatch get-dashboard --dashboard-name UnifiedAI-production
```

### Rollback

```bash
# Emergency rollback
npx tsx scripts/deploy-unified-ai-api.ts rollback production
```

---

## 🐛 **Troubleshooting**

### Common Issues

**Provider Connection Failures:**

```bash
# Test connectivity
npx tsx -e "import { getUnifiedAiApi } from './src/lib/ai-orchestrator/unified-ai-api'; const api = getUnifiedAiApi(); api.testProvider('bedrock').then(console.log);"
```

**High Latency:**

- Check provider health status
- Review circuit breaker states
- Consider switching routing strategy

**Cache Issues:**

- Verify Redis connectivity
- Check cache hit rates in metrics
- Review TTL settings

**Circuit Breaker Tripping:**

```typescript
// Reset circuit breaker
const api = getUnifiedAiApi();
api.resetCircuitBreaker("bedrock");
```

### Debug Mode

```bash
export DEBUG=unified-ai:*
npm start
```

---

## 📊 **Monitoring Dashboard**

### Key Metrics

- **Request Count**: Total API requests
- **Success Rate**: Percentage of successful requests
- **Average Latency**: Response time across providers
- **Cost per Request**: Average cost per API call
- **Cache Hit Rate**: Percentage of cached responses
- **Provider Distribution**: Request distribution

### CloudWatch Dashboards

- **UnifiedAI-development**: Development environment metrics
- **UnifiedAI-production**: Production environment metrics

### Alerts (Production)

- **High Error Rate**: > 5% error rate
- **High Latency**: > 5 seconds response time
- **Provider Failures**: Circuit breaker open
- **Budget Thresholds**: Cost limits exceeded

---

## 🔐 **Security**

### API Key Management

```bash
# Store in AWS Secrets Manager
aws secretsmanager create-secret --name unified-ai/google-api-key --secret-string "your-key"

# Use in environment
export GOOGLE_AI_API_KEY=$(aws secretsmanager get-secret-value --secret-id unified-ai/google-api-key --query SecretString --output text)
```

### Rate Limiting

```typescript
// Built-in rate limiting
const config = {
  maxRetries: 3,
  timeoutMs: 30000,
  // Respects provider-specific rate limits
};
```

---

## 📚 **Additional Resources**

### Documentation

- **Complete API Docs**: `docs/unified-ai-api-documentation.md`
- **Deployment Guide**: `scripts/deploy-unified-ai-api.ts`
- **Test Examples**: `src/lib/ai-orchestrator/__tests__/unified-ai-api.test.ts`

### Support

- **GitHub Issues**: Report bugs and feature requests
- **Team Chat**: #ai-integration channel
- **Documentation**: Internal wiki and guides

---

**Version**: 1.0.0  
**Last Updated**: 2025-01-14  
**Status**: Production Ready ✅
