# Intelligent Provider Routing Architecture

## Overview

This document describes the intelligent AI provider routing architecture that optimizes task distribution based on provider strengths and specializations while maintaining P95 latency targets.

## Provider Architecture

### Provider Specialization Strategy

| Provider    | Role                 | Priority | Use Cases                                                                 |
| ----------- | -------------------- | -------- | ------------------------------------------------------------------------- |
| **Bedrock** | Orchestrator/Manager | 1        | System tasks, AI orchestration, agent creation, infrastructure management |
| **Google**  | User Task Worker     | 2        | User-facing tasks, personas, restaurant analysis, visibility checks       |
| **Meta**    | Audience Specialist  | 3        | Target audience analysis, demographics, market segments, reach analysis   |

### Routing Logic

```typescript
// 1. Bedrock for System/Orchestration tasks (Priority 1)
if (isSystemTask) return ["bedrock", "google", "meta"];

// 2. Meta for Audience Analysis tasks (Priority 3)
if (isAudienceAnalysis) return ["meta", "google", "bedrock"];

// 3. Google for all other User tasks (Priority 2)
if (isUserTask) return ["google", "meta", "bedrock"];
```

## Implementation Details

### Task Classification

#### System Task Detection

```typescript
private isSystemTask(prompt: string, ctx: RouterInputContext, tools?: ToolSpec[]): boolean {
  const systemKeywords = [
    'orchestrate', 'manage', 'coordinate', 'delegate', 'system',
    'infrastructure', 'deployment', 'monitoring', 'scaling',
    'create agent', 'new agent', 'agent creation', 'workflow'
  ];

  const promptLower = prompt.toLowerCase();
  const hasSystemKeywords = systemKeywords.some(keyword =>
    promptLower.includes(keyword)
  );

  const isSystemDomain = ctx.domain === 'system' || ctx.domain === 'infrastructure';
  const hasOrchestrationTools = tools?.some(tool =>
    ['orchestrate', 'manage', 'coordinate', 'system'].some(keyword =>
      tool.name.toLowerCase().includes(keyword)
    )
  );

  return hasSystemKeywords || isSystemDomain || !!hasOrchestrationTools;
}
```

#### Audience Analysis Detection

```typescript
private isAudienceAnalysisTask(prompt: string, ctx: RouterInputContext): boolean {
  const audienceKeywords = [
    'audience', 'target group', 'demographics', 'market segment',
    'customer persona', 'user persona', 'reach analysis',
    'zielgruppe', 'reichweite', 'demografie', 'marktsegment'
  ];

  const promptLower = prompt.toLowerCase();
  const hasAudienceKeywords = audienceKeywords.some(keyword =>
    promptLower.includes(keyword)
  );

  const isAudienceDomain = ['marketing', 'analytics', 'research'].includes(ctx.domain || '');
  return hasAudienceKeywords || isAudienceDomain;
}
```

### Provider Priority Integration

The routing engine integrates provider priority with existing scoring mechanisms:

```typescript
decide(input: RouterInputContext, tools?: ToolSpec[], providerPriority?: string[]): RouteDecision {
  // 1. Filter by constraints
  let candidates = this.filterByConstraints(input, tools);

  // 2. Apply provider priority
  if (providerPriority) {
    candidates = this.sortByPriority(candidates, providerPriority);
  }

  // 3. Multi-criteria scoring with priority bonus
  const score = (m: ModelSpec) => {
    const baseScore = this.calculateBaseScore(m, input);
    const priorityBonus = this.calculatePriorityBonus(m, providerPriority);
    return baseScore + priorityBonus;
  };

  return this.selectBestCandidate(candidates, score);
}
```

## Use Case Examples

### 1. System Orchestration → Bedrock

```typescript
const request: AiRequest = {
  prompt: "Orchestrate a new AI agent for customer service automation",
  context: {
    domain: "system",
    userId: "admin-1",
    sessionId: "session-1",
  },
};

// Routes to: Bedrock (Priority 1)
// Fallback: Google → Meta
```

### 2. User Restaurant Analysis → Google

```typescript
const request: AiRequest = {
  prompt: "Analyze the visibility of my restaurant online",
  context: {
    domain: "culinary",
    userId: "user-1",
    sessionId: "session-1",
  },
};

// Routes to: Google (Priority 2)
// Fallback: Meta → Bedrock
```

### 3. Audience Demographics → Meta

```typescript
const request: AiRequest = {
  prompt: "Analyze target audience demographics for our restaurant chain",
  context: {
    domain: "marketing",
    userId: "user-1",
    sessionId: "session-1",
  },
};

// Routes to: Meta (Priority 3)
// Fallback: Google → Bedrock
```

## P95 Latency Integration

### Provider-Specific Latency Targets

Each provider maintains the same P95 latency targets but optimized for their specialization:

| Provider | Generation P95 | RAG P95 | Cached P95 | Specialization Bonus       |
| -------- | -------------- | ------- | ---------- | -------------------------- |
| Bedrock  | ≤ 1.5s         | ≤ 300ms | ≤ 300ms    | System tasks: +0.3 score   |
| Google   | ≤ 1.5s         | ≤ 300ms | ≤ 300ms    | User tasks: +0.2 score     |
| Meta     | ≤ 1.5s         | ≤ 300ms | ≤ 300ms    | Audience tasks: +0.4 score |

### Latency-Aware Routing

```typescript
private determineOperationType(request: AiRequest): "generation" | "rag" | "cached" {
  // Enhanced operation detection considering provider specialization
  const ragKeywords = ['search', 'find', 'lookup', 'retrieve', 'what is', 'how to'];
  const promptLower = request.prompt.toLowerCase();
  const hasRagKeywords = ragKeywords.some(keyword => promptLower.includes(keyword));

  if (hasRagKeywords || request.context.domain === 'support') {
    return "rag";
  }

  if (request.prompt.length < 100 && !request.tools?.length && hasRagKeywords) {
    return "cached";
  }

  return "generation";
}
```

## Performance Benefits

### 1. Specialized Routing

- **System Tasks**: Bedrock's orchestration capabilities reduce complexity
- **User Tasks**: Google's user-facing optimization improves response quality
- **Audience Tasks**: Meta's demographic analysis provides deeper insights

### 2. Fallback Resilience

```typescript
// Automatic fallback maintains service availability
if (primaryProvider.unavailable) {
  route_to(secondaryProvider);
}
```

### 3. Load Distribution

- **Bedrock**: Handles complex orchestration (lower volume, higher complexity)
- **Google**: Handles majority of user requests (high volume, moderate complexity)
- **Meta**: Handles specialized analysis (moderate volume, high specialization)

## Monitoring & Analytics

### Provider Performance Tracking

```typescript
interface ProviderMetrics {
  provider: string;
  taskType: "system" | "user" | "audience";
  p95Latency: number;
  successRate: number;
  specialization_score: number;
  fallback_rate: number;
}
```

### Dashboard Integration

The P95 Latency Dashboard includes provider-specific metrics:

- **Provider Comparison**: Performance across different task types
- **Routing Efficiency**: Success rate of primary provider selection
- **Fallback Analysis**: Frequency and reasons for provider fallbacks
- **Specialization Metrics**: Task-specific performance indicators

## Configuration

### Environment Variables

```bash
# Provider routing configuration
PROVIDER_ROUTING_ENABLED=true
BEDROCK_SYSTEM_PRIORITY=1
GOOGLE_USER_PRIORITY=2
META_AUDIENCE_PRIORITY=3

# Fallback configuration
ENABLE_PROVIDER_FALLBACK=true
FALLBACK_TIMEOUT_MS=5000
MAX_FALLBACK_ATTEMPTS=2
```

### Feature Flags

```typescript
// Enable/disable intelligent routing
const INTELLIGENT_ROUTING_ENABLED =
  process.env.INTELLIGENT_ROUTING_ENABLED === "true";

// Provider-specific feature flags
const BEDROCK_SYSTEM_ROUTING = process.env.BEDROCK_SYSTEM_ROUTING === "true";
const GOOGLE_USER_ROUTING = process.env.GOOGLE_USER_ROUTING === "true";
const META_AUDIENCE_ROUTING = process.env.META_AUDIENCE_ROUTING === "true";
```

## Testing Strategy

### Unit Tests

```typescript
describe("Intelligent Provider Routing", () => {
  it("should route system tasks to Bedrock first", () => {
    const request = createSystemTask();
    const { decision } = gateway.route(request.prompt, request.context);
    expect(decision.provider).toBe("bedrock");
  });

  it("should route user tasks to Google first", () => {
    const request = createUserTask();
    const { decision } = gateway.route(request.prompt, request.context);
    expect(decision.provider).toBe("google");
  });

  it("should route audience tasks to Meta first", () => {
    const request = createAudienceTask();
    const { decision } = gateway.route(request.prompt, request.context);
    expect(decision.provider).toBe("meta");
  });
});
```

### Integration Tests

```typescript
describe("Provider Routing Integration", () => {
  it("should maintain P95 targets across all providers", async () => {
    const mixedWorkload = generateMixedWorkload();
    const results = await processWorkload(mixedWorkload);

    expect(results.p95Latencies.bedrock).toBeLessThanOrEqual(1500);
    expect(results.p95Latencies.google).toBeLessThanOrEqual(1500);
    expect(results.p95Latencies.meta).toBeLessThanOrEqual(1500);
  });
});
```

## Future Enhancements

### 1. Machine Learning Optimization

- **Dynamic Priority Adjustment**: ML-based provider priority optimization
- **Performance Prediction**: Predict optimal provider based on historical data
- **Adaptive Routing**: Real-time routing adjustments based on performance

### 2. Advanced Specialization

- **Domain-Specific Models**: Provider-specific model fine-tuning
- **Context-Aware Routing**: Enhanced context understanding for better routing
- **Multi-Provider Orchestration**: Combine multiple providers for complex tasks

### 3. Cost Optimization

- **Cost-Aware Routing**: Balance performance with cost considerations
- **Budget-Based Fallbacks**: Route to cost-effective providers when budget is tight
- **Usage Analytics**: Detailed cost analysis per provider and task type

## Conclusion

The intelligent provider routing architecture optimizes AI task distribution while maintaining P95 latency targets. Key benefits include:

- **Specialized Performance**: Each provider handles tasks they're optimized for
- **Improved Reliability**: Automatic fallback ensures high availability
- **Better Resource Utilization**: Load distribution based on provider strengths
- **Maintained SLAs**: P95 latency targets met across all providers

This architecture provides a solid foundation for scalable, efficient AI orchestration while ensuring optimal user experience across different task types.
