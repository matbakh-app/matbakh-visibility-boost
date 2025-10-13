# Token Limits - Quick Reference Guide

**Last Updated**: 2025-01-14  
**Status**: Production-Ready

---

## What are Token Limits?

**Token Limits** control how many tokens (text units) can be processed in AI requests to manage costs and ensure system stability.

### Token Basics

- **1 Token ≈ 4 characters** or **0.75 words** (English)
- Example: "Hello World" = ~2-3 tokens
- Code and special characters may use more tokens

---

## Quick Start

### Check if Request is Within Limits

```typescript
import { TokenLimitsManager } from "@/lib/ai-orchestrator/token-limits-manager";

const manager = new TokenLimitsManager();
await manager.initialize();

// Check limits before making request
const check = await manager.checkLimits(
  "user-123", // User ID
  "text_chat", // Operation type
  "claude_3_5_sonnet", // Model
  1000, // Estimated input tokens
  500 // Estimated output tokens
);

if (check.allowed) {
  // Proceed with request
  console.log(`Cost estimate: $${check.costEstimate}`);
} else {
  console.log(`Rejected: ${check.reason}`);
}
```

### Record Actual Usage

```typescript
// After successful request
await manager.recordUsage(
  "user-123",
  "text_chat",
  "aws_bedrock",
  "claude_3_5_sonnet",
  1000, // Actual input tokens
  500, // Actual output tokens
  "request-123"
);
```

---

## User Tiers

### Free Tier

- **Daily Limit**: 50,000 tokens
- **Monthly Limit**: 1,000,000 tokens
- **Requests/Hour**: 20
- **Operations**: Text chat, Content generation

### Premium Tier

- **Daily Limit**: 1,000,000 tokens
- **Monthly Limit**: 25,000,000 tokens
- **Requests/Hour**: 500
- **Operations**: All operations including voice, code generation

### Enterprise Tier

- **Daily Limit**: 5,000,000 tokens
- **Monthly Limit**: 100,000,000 tokens
- **Requests/Hour**: 2,000
- **Operations**: All operations, highest priority

---

## Model Limits

### Claude 3.5 Sonnet (Expensive, High Quality)

- **Input**: 200,000 tokens/request
- **Output**: 8,192 tokens/request
- **Daily**: 10M input, 1M output tokens
- **Cost**: $0.003/1K input, $0.015/1K output

### Claude 3 Haiku (Cheap, Fast)

- **Input**: 200,000 tokens/request
- **Output**: 4,096 tokens/request
- **Daily**: 20M input, 2M output tokens
- **Cost**: $0.00025/1K input, $0.00125/1K output

### Gemini 1.5 Pro (Large Context)

- **Input**: 2,000,000 tokens/request
- **Output**: 8,192 tokens/request
- **Daily**: 15M input, 1.5M output tokens
- **Cost**: $0.00125/1K input, $0.00375/1K output

### Gemini 1.5 Flash (Fastest, Cheapest)

- **Input**: 1,000,000 tokens/request
- **Output**: 8,192 tokens/request
- **Daily**: 30M input, 3M output tokens
- **Cost**: $0.000075/1K input, $0.0003/1K output

---

## System-Wide Limits

- **Total Daily**: 100,000,000 tokens
- **Total Monthly**: 2,500,000,000 tokens
- **Monthly Budget**: $2,000
- **Emergency Shutdown**: At 95% budget

---

## Budget Alerts

### Alert Thresholds

- **50%**: Notification to finance & CTO
- **75%**: Throttle expensive models (Sonnet, Gemini Pro)
- **90%**: Emergency mode - fallback to cheap models only
- **95%**: Shutdown non-critical operations

### Emergency Actions

```typescript
// At 90% budget
- Switch to Claude Haiku and Gemini Flash only
- Enable aggressive caching
- Reduce context windows by 50%

// At 95% budget
- Shutdown all non-critical operations
- Preserve only emergency and critical support
- Notify all stakeholders
```

---

## Common Operations

### Set User Tier

```typescript
await manager.setUserTier("user-123", "premium");
```

### Get Usage Statistics

```typescript
const stats = await manager.getUsageStats("user-123", "daily");
console.log(`Total tokens: ${stats.totalTokens}`);
console.log(`Total cost: $${stats.totalCost}`);
console.log(`Success rate: ${stats.successRate}%`);
```

### Reset Usage Counters

```typescript
// Reset daily usage (automatic at midnight)
await manager.resetUsage("daily");

// Reset monthly usage (automatic on 1st of month)
await manager.resetUsage("monthly");
```

### Update Configuration

```typescript
manager.updateConfig({
  enforceLimits: true,
  alertThresholdPercentage: 85,
});
```

---

## Throttling Actions

### When Limits Exceeded

#### Allow

- Request proceeds normally
- Usage recorded
- Cost tracked

#### Throttle

- Request queued with delay
- Exponential backoff (1s → 30s)
- Retry after wait time

#### Reject

- Request blocked immediately
- User notified of limit
- Remaining tokens shown

#### Fallback

- Suggest cheaper model
- Automatic model switch
- Maintain functionality

---

## Cost Optimization

### Automatic Optimizations

- **Smart Routing**: Prefer cheaper models when possible
- **Response Caching**: 80%+ hit rate for frequent queries
- **Context Compression**: Reduce token usage
- **Batch Requests**: Combine multiple operations

### Manual Optimizations

```typescript
// Use cheaper models for simple tasks
const check = await manager.checkLimits(
  userId,
  "text_chat",
  "claude_3_haiku", // Cheaper than Sonnet
  tokens,
  tokens
);

// Enable compression for large contexts
const cache = new SupportOperationsCache({
  enableCompression: true,
});
```

---

## Monitoring

### Real-Time Metrics

- Token usage per user/operation/model
- Cost tracking per provider
- Success/failure rates
- P95 latency per model

### Dashboards

1. **Token Usage Overview**: Daily/monthly consumption
2. **Cost Tracking**: Budget vs. actual spend
3. **Model Performance**: Latency and success rates
4. **User Analytics**: Tier distribution and usage patterns

---

## Troubleshooting

### "Daily token limit exceeded"

```typescript
// Check remaining tokens
const check = await manager.checkLimits(...);
console.log(`Remaining: ${check.remainingTokens} tokens`);

// Wait until reset (midnight UTC)
// Or upgrade user tier
await manager.setUserTier(userId, 'premium');
```

### "Monthly budget exceeded"

```typescript
// Check current usage
const stats = await manager.getUsageStats(undefined, "monthly");
console.log(`Budget used: ${stats.totalCost}/$2000`);

// Emergency: Disable expensive models
manager.updateConfig({
  enforceLimits: true,
  defaultActionOnLimit: "fallback",
});
```

### "Request exceeds model limit"

```typescript
// Reduce input tokens
const maxInput = 200000; // Claude Sonnet limit
if (inputTokens > maxInput) {
  // Truncate or summarize input
  inputTokens = maxInput;
}

// Or use model with larger context
const check = await manager.checkLimits(
  userId,
  operation,
  "gemini_1_5_pro", // 2M token context
  inputTokens,
  outputTokens
);
```

---

## Configuration Files

### Policy File

- **Location**: `.kiro/policies/token-limits-policy.yaml`
- **Format**: YAML
- **Sections**: Providers, Operations, User Tiers, System Limits

### Environment Variables

```bash
# Token limits configuration
TOKEN_LIMITS_ENFORCE=true
TOKEN_LIMITS_ALERT_THRESHOLD=80
TOKEN_LIMITS_RESET_PERIOD=daily
TOKEN_LIMITS_EMERGENCY_RESERVE=10
```

---

## Best Practices

### For Developers

1. **Always check limits** before making AI requests
2. **Record actual usage** after successful requests
3. **Handle rejections gracefully** with user-friendly messages
4. **Use cheaper models** for simple tasks
5. **Enable caching** for frequent operations

### For Administrators

1. **Monitor budget alerts** and respond promptly
2. **Review usage patterns** weekly
3. **Adjust tier limits** based on actual usage
4. **Test emergency procedures** monthly
5. **Keep policy file** up to date

### For Users

1. **Understand your tier limits** and upgrade if needed
2. **Optimize prompts** to reduce token usage
3. **Use caching** when possible
4. **Monitor your usage** in dashboard
5. **Contact support** if limits are too restrictive

---

## Related Documentation

- [Token Limits Policy](./.kiro/policies/token-limits-policy.yaml)
- [Token Limits Manager](../src/lib/ai-orchestrator/token-limits-manager.ts)
- [Performance Optimization](./bedrock-activation-task-6.1-performance-optimization-final-summary.md)
- [AI Provider Architecture](./ai-provider-architecture.md)

---

**Questions?** Contact the AI Team or check the comprehensive documentation.
