# AI Orchestrator

Enterprise-grade AI model orchestration system with intelligent routing, multi-provider support, and automated A/B testing.

## 🚀 Features

- **Provider-Agnostic Routing**: Unified interface for AWS Bedrock, Google AI, and Meta AI
- **Intelligent Model Selection**: Multi-criteria scoring based on latency, cost, domain, and capabilities
- **Thompson Sampling Bandit**: Automated A/B testing with contextual learning
- **Tool Calling Support**: Unified tool schema across all providers
- **Production-Ready Infrastructure**: CDK stack with ECS Fargate, VPC endpoints, and auto-scaling
- **Comprehensive Testing**: 34+ test cases with full mocking support

## 📦 Installation

```bash
npm install @aws-sdk/client-bedrock-runtime @aws-sdk/client-evidently
```

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Gateway       │    │  Router Policy   │    │   Provider      │
│   Server        │───▶│     Engine       │───▶│   Adapters      │
│                 │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Bandit        │    │  CloudWatch      │    │   AWS Bedrock   │
│  Controller     │    │   Evidently      │    │   Google AI     │
│                 │    │                  │    │   Meta AI       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Basic Usage

```typescript
import { createAiOrchestrator } from "@/lib/ai-orchestrator";

const orchestrator = createAiOrchestrator({
  enableCaching: true,
  enableMetrics: true,
});

const response = await orchestrator.route({
  prompt: "Analyze this restaurant review",
  domain: "culinary",
  budgetTier: "standard",
  requireTools: false,
});

console.log(response.text);
```

### Advanced Routing

```typescript
import { RouterPolicyEngine, DEFAULT_MODELS } from "@/lib/ai-orchestrator";

const engine = new RouterPolicyEngine({
  models: DEFAULT_MODELS,
  defaultTemperature: 0.2,
});

const decision = engine.decide({
  domain: "legal",
  budgetTier: "premium",
  slaMs: 800,
  requireTools: true,
});

console.log(`Selected: ${decision.provider}/${decision.modelId}`);
console.log(`Reason: ${decision.reason}`);
```

### Bandit Optimization

```typescript
import { ThompsonBandit, BanditLogger } from "@/lib/ai-orchestrator";

const bandit = new ThompsonBandit();
const logger = new BanditLogger({
  project: "matbakh-ai-production",
});

// Choose arm based on context
const arm = bandit.choose({
  domain: "legal",
  budgetTier: "premium",
});

// Record outcome
bandit.record(arm, success, costEuro, latencyMs, context);

// Log to CloudWatch Evidently
await logger.logOutcome({
  userId: "user123",
  arm,
  success,
  latencyMs,
  costEuro,
  domain: "legal",
});
```

## 🔧 Configuration

### Model Specifications

```typescript
const customModels = [
  {
    provider: "bedrock",
    modelId: "anthropic.claude-3-5-sonnet-20241022-v2:0",
    capability: {
      contextTokens: 200000,
      supportsTools: true,
      supportsJson: true,
      supportsVision: true,
      defaultLatencyMs: 600,
      costPer1kInput: 0.003,
      costPer1kOutput: 0.015,
    },
  },
  // ... more models
];
```

### Domain-Specific Routing

The router automatically optimizes model selection based on domain:

- **Legal**: Prefers Claude (90% preference)
- **Medical**: Only uses Claude for safety
- **Culinary**: Prefers Gemini (90% preference)
- **Technical**: Balanced across all providers

### Budget Tiers

- **Low**: Cost-optimized routing
- **Standard**: Balanced cost/performance
- **Premium**: Performance-optimized routing

## 🧪 Testing

```bash
# Run all AI orchestrator tests
npm test -- src/lib/ai-orchestrator

# Run specific test suites
npm test -- src/lib/ai-orchestrator/__tests__/router-policy-engine.test.ts
npm test -- src/lib/ai-orchestrator/__tests__/bandit-controller.test.ts
```

## 🚀 Deployment

### Infrastructure Deployment

```bash
# Deploy to development
npx tsx scripts/deploy-ai-orchestration.ts --env development

# Deploy to production
npx tsx scripts/deploy-ai-orchestration.ts --env production --region eu-central-1
```

### CDK Stack

The infrastructure includes:

- **VPC Endpoints**: Bedrock, Logs, Secrets Manager, STS
- **ECS Fargate Service**: Auto-scaling AI gateway (2-20 tasks)
- **CloudWatch Evidently**: A/B testing and feature flags
- **Security Groups**: Least-privilege networking
- **IAM Roles**: Minimal required permissions

## 📊 Monitoring

### CloudWatch Evidently Integration

- **Project**: `matbakh-ai-{environment}`
- **Features**: `model_route`, `prompt_version`
- **Metrics**: Latency, cost, success rate, user satisfaction

### Key Metrics

- **Latency**: P95 ≤ 1.5s (generation), ≤ 300ms (cached)
- **Availability**: ≥ 99.9% with multi-provider fallback
- **Cost Efficiency**: Automated optimization through bandit learning
- **Throughput**: 1000+ requests/minute per ECS instance

## 🔒 Security

- **Data Residency**: EU-Central-1 primary region
- **Encryption**: KMS encryption for all data at rest and in transit
- **PII Handling**: Pre-filter redaction and audit logging
- **Provider Agreements**: "No training on customer data" compliance
- **Rate Limiting**: Per-tenant and per-provider quotas

## 🔗 Integration

### Task Integration Points

- **Task 9**: Blue-green deployment for AI services
- **Task 10**: Auto-scaling for ECS AI gateway
- **Task 11**: Multi-region AI service deployment
- **Task 12**: AI services as microservices in service mesh

### API Endpoints

- `POST /v1/route` - Route AI requests
- `GET /v1/models` - List available models
- `GET /v1/stats` - Get routing statistics
- `PUT /v1/admin/models` - Update model capabilities
- `POST /v1/admin/bandit/reset` - Reset bandit statistics
- `GET /health` - Health check

## 📚 API Reference

### RouterPolicyEngine

```typescript
class RouterPolicyEngine {
  decide(context: RouterInputContext, tools?: ToolSpec[]): RouteDecision;
  updateModelCapabilities(modelId: string, updates: Partial<Capability>): void;
  getAvailableModels(context: RouterInputContext): ModelSpec[];
}
```

### ThompsonBandit

```typescript
class ThompsonBandit {
  choose(context?: BanditContext): Arm;
  record(
    arm: Arm,
    win: boolean,
    costEuro: number,
    latencyMs: number,
    context?: BanditContext
  ): void;
  getBestArm(context?: BanditContext): { arm: Arm; confidence: number };
  reset(context?: BanditContext): void;
}
```

### ToolCallAdapter

```typescript
interface ToolCallAdapter {
  mapTools(tools?: ToolSpec[]): any | undefined;
  buildRequest(input: BuildRequestInput): any;
  parseResponse(resp: any): ProviderResponse;
  estimateTokens(text: string): { input: number; output: number };
}
```

## 🐛 Troubleshooting

### Common Issues

1. **AWS SDK Not Found**

   ```bash
   npm install @aws-sdk/client-bedrock-runtime @aws-sdk/client-evidently
   ```

2. **Test Failures**

   - Ensure all mocks are properly configured
   - Check AWS SDK version compatibility

3. **Deployment Issues**
   - Verify AWS credentials are configured
   - Check CDK version compatibility
   - Ensure required IAM permissions

### Debug Mode

```typescript
const orchestrator = createAiOrchestrator({
  enableMetrics: true,
  // Add debug logging
});
```

## 📚 Documentation

### 🔐 Compliance & Security

- **[Provider Agreement Compliance](../../../docs/provider-agreement-compliance.md)** - Complete compliance framework
- **[LLM Provider Policy](../../../docs/llm-provider-policy.md)** - Provider policy and "no training" guarantees
- **[LLM Usage Policy](../../../docs/llm-usage-policy.md)** - Developer guidelines and best practices
- **[Data Classification](../../../docs/data-classification.md)** - Data classification for AI processing

### 🏗️ Technical Implementation

- **[AI Provider Architecture](../../../docs/ai-provider-architecture-comprehensive-guide.md)** - Comprehensive architecture guide
- **[Intelligent Provider Routing](../../../docs/intelligent-provider-routing-architecture.md)** - Routing architecture details
- **[P95 Latency Monitoring](../../../docs/p95-latency-ai-provider-integration-summary.md)** - Performance monitoring integration

### 🧪 Testing & Quality

- **[Testing Infrastructure](../../../docs/testing-infrastructure-guide.md)** - Testing framework and best practices
- **[Quality Assurance](../../../docs/quality-assurance-system-overview.md)** - QA system integration

## 📄 License

This module is part of the matbakh.app system and follows the project's licensing terms.

## 🤝 Contributing

1. Run tests: `npm test -- src/lib/ai-orchestrator`
2. Follow TypeScript strict mode
3. Add tests for new features
4. Update documentation
5. Ensure compliance with [LLM Usage Policy](../../../docs/llm-usage-policy.md)

---

**Status**: ✅ Production-Ready  
**Version**: 1.0.0  
**Last Updated**: 2025-01-14
