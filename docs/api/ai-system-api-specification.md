# AI System API Specification

**Version:** 1.0  
**Last Updated:** 2025-01-14  
**API Version:** v1

## 📋 Overview

This document provides comprehensive API documentation for the AI System, including all endpoints, request/response schemas, authentication methods, and integration examples.

## 🔗 Base URLs

- **Production**: `https://api.matbakh.app/v1`
- **Staging**: `https://staging-api.matbakh.app/v1`
- **Development**: `http://localhost:3000/v1`

## 🔐 Authentication

### API Key Authentication

```http
Authorization: Bearer <your-api-key>
Content-Type: application/json
```

### JWT Token Authentication

```http
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

### Request Signing (Enterprise)

```http
Authorization: AWS4-HMAC-SHA256 Credential=<credentials>
X-Amz-Date: <timestamp>
X-Amz-Signature: <signature>
```

## 🚀 Core API Endpoints

### 1. **AI Processing Endpoints**

#### POST /ai/process

Process AI requests through the orchestrator.

**Request Schema:**

```typescript
interface AIProcessRequest {
  prompt: string;
  provider?: "bedrock" | "google" | "meta" | "auto";
  model?: string;
  parameters?: {
    max_tokens?: number;
    temperature?: number;
    top_p?: number;
    stop_sequences?: string[];
  };
  context?: {
    user_id?: string;
    session_id?: string;
    metadata?: Record<string, any>;
  };
  options?: {
    cache_enabled?: boolean;
    quality_check?: boolean;
    timeout?: number;
  };
}
```

**Response Schema:**

```typescript
interface AIProcessResponse {
  id: string;
  response: string;
  provider: string;
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  performance: {
    latency_ms: number;
    cache_hit: boolean;
    quality_score?: number;
  };
  metadata: {
    request_id: string;
    timestamp: string;
    version: string;
  };
}
```

**Example Request:**

```bash
curl -X POST https://api.matbakh.app/v1/ai/process \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Analyze the visibility of a restaurant in Munich",
    "provider": "auto",
    "parameters": {
      "max_tokens": 1000,
      "temperature": 0.7
    },
    "options": {
      "cache_enabled": true,
      "quality_check": true
    }
  }'
```

**Example Response:**

```json
{
  "id": "req_123456789",
  "response": "I'll analyze the restaurant's online visibility across multiple platforms...",
  "provider": "bedrock",
  "model": "claude-3-5-sonnet-v2",
  "usage": {
    "prompt_tokens": 45,
    "completion_tokens": 256,
    "total_tokens": 301
  },
  "performance": {
    "latency_ms": 1250,
    "cache_hit": false,
    "quality_score": 0.95
  },
  "metadata": {
    "request_id": "req_123456789",
    "timestamp": "2025-01-14T10:30:00Z",
    "version": "1.0"
  }
}
```

#### POST /ai/batch

Process multiple AI requests in batch.

**Request Schema:**

```typescript
interface AIBatchRequest {
  requests: AIProcessRequest[];
  options?: {
    parallel_processing?: boolean;
    max_concurrency?: number;
    timeout?: number;
  };
}
```

**Response Schema:**

```typescript
interface AIBatchResponse {
  batch_id: string;
  results: (AIProcessResponse | { error: string })[];
  summary: {
    total_requests: number;
    successful_requests: number;
    failed_requests: number;
    total_latency_ms: number;
    average_latency_ms: number;
  };
}
```

### 2. **Quality Gates Endpoints**

#### POST /quality/evaluate

Run quality evaluation on AI models.

**Request Schema:**

```typescript
interface QualityEvaluateRequest {
  model_id: string;
  evaluation_type: "offline" | "canary" | "performance" | "comprehensive";
  dataset?: string;
  config?: {
    sample_size?: number;
    duration_minutes?: number;
    thresholds?: {
      accuracy?: number;
      latency?: number;
      error_rate?: number;
    };
  };
}
```

**Response Schema:**

```typescript
interface QualityEvaluateResponse {
  evaluation_id: string;
  status: "running" | "completed" | "failed";
  results?: {
    overall_status: "PASSED" | "FAILED" | "PARTIAL";
    metrics: {
      accuracy?: number;
      latency?: number;
      error_rate?: number;
      quality_score?: number;
    };
    recommendation: "APPROVE" | "REJECT" | "CONDITIONAL";
  };
  progress?: {
    current_step: string;
    completion_percentage: number;
    estimated_completion: string;
  };
}
```

#### GET /quality/status/{evaluation_id}

Get quality evaluation status.

**Response Schema:**

```typescript
interface QualityStatusResponse {
  evaluation_id: string;
  status: "running" | "completed" | "failed";
  created_at: string;
  updated_at: string;
  results?: QualityEvaluateResponse["results"];
  logs?: string[];
}
```

### 3. **Monitoring Endpoints**

#### GET /monitoring/health

Get system health status.

**Response Schema:**

```typescript
interface HealthResponse {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  services: {
    ai_orchestrator: ServiceHealth;
    providers: {
      bedrock: ProviderHealth;
      google: ProviderHealth;
      meta: ProviderHealth;
    };
    cache: ServiceHealth;
    database: ServiceHealth;
  };
  metrics: {
    requests_per_minute: number;
    average_latency_ms: number;
    error_rate_percentage: number;
    cache_hit_rate_percentage: number;
  };
}

interface ServiceHealth {
  status: "healthy" | "degraded" | "unhealthy";
  latency_ms?: number;
  error_rate?: number;
  last_check: string;
}

interface ProviderHealth extends ServiceHealth {
  quota_utilization?: number;
  available_models?: string[];
}
```

#### GET /monitoring/metrics

Get system metrics.

**Query Parameters:**

- `period`: Time period (1h, 24h, 7d, 30d)
- `metrics`: Comma-separated list of metrics
- `provider`: Filter by provider
- `model`: Filter by model

**Response Schema:**

```typescript
interface MetricsResponse {
  period: string;
  metrics: {
    [metric_name: string]: {
      values: Array<{
        timestamp: string;
        value: number;
      }>;
      summary: {
        min: number;
        max: number;
        average: number;
        p95: number;
      };
    };
  };
}
```

### 4. **Configuration Endpoints**

#### GET /config/providers

Get provider configuration.

**Response Schema:**

```typescript
interface ProvidersConfigResponse {
  providers: {
    [provider_name: string]: {
      enabled: boolean;
      models: string[];
      quota_limits: {
        requests_per_minute: number;
        tokens_per_minute: number;
      };
      health_status: "healthy" | "degraded" | "unhealthy";
    };
  };
  routing: {
    strategy: "round-robin" | "least-utilized" | "quota-aware";
    weights: Record<string, number>;
  };
}
```

#### PUT /config/routing

Update routing configuration.

**Request Schema:**

```typescript
interface RoutingConfigRequest {
  strategy: "round-robin" | "least-utilized" | "quota-aware";
  weights?: Record<string, number>;
  failover_enabled?: boolean;
  health_check_interval?: number;
}
```

### 5. **Analytics Endpoints**

#### GET /analytics/usage

Get usage analytics.

**Query Parameters:**

- `start_date`: Start date (ISO 8601)
- `end_date`: End date (ISO 8601)
- `granularity`: hour, day, week, month
- `group_by`: provider, model, user

**Response Schema:**

```typescript
interface UsageAnalyticsResponse {
  period: {
    start: string;
    end: string;
    granularity: string;
  };
  usage: Array<{
    timestamp: string;
    provider?: string;
    model?: string;
    user_id?: string;
    metrics: {
      request_count: number;
      token_count: number;
      latency_ms: number;
      error_count: number;
      cost_usd: number;
    };
  }>;
  summary: {
    total_requests: number;
    total_tokens: number;
    average_latency_ms: number;
    total_cost_usd: number;
    error_rate_percentage: number;
  };
}
```

## 🔧 Tool Schemas

### 1. **Quality Gates CLI Tool Schema**

```yaml
name: quality-gates-cli
version: 1.0.0
description: AI Quality Gates Command Line Interface

commands:
  pipeline:
    description: Run complete quality pipeline
    usage: pipeline [dev|staging|prod|custom] [options]
    options:
      - name: model-id
        type: string
        description: Model ID to test
      - name: skip-offline
        type: boolean
        description: Skip offline evaluation
      - name: monitoring
        type: number
        description: Monitoring duration in minutes

  offline:
    description: Run offline evaluation
    usage: offline --model-id <id> [options]
    required:
      - model-id
    options:
      - name: dataset
        type: string
        description: Path to evaluation dataset

  canary:
    description: Run canary evaluation
    usage: canary --model-id <id> [options]
    required:
      - model-id
    options:
      - name: traffic
        type: number
        description: Traffic percentage (1-100)
      - name: duration
        type: number
        description: Duration in minutes

  monitor:
    description: Start quality monitoring
    usage: monitor --model-id <id> [options]
    required:
      - model-id
    options:
      - name: duration
        type: number
        description: Monitoring duration in minutes
      - name: continuous
        type: boolean
        description: Enable continuous monitoring

  status:
    description: Show system status
    usage: status [options]
    options:
      - name: provider
        type: string
        description: Filter by provider
      - name: comprehensive
        type: boolean
        description: Show detailed status
```

### 2. **AI Orchestrator Configuration Schema**

```yaml
name: ai-orchestrator-config
version: 1.0.0
description: AI Orchestrator Configuration Schema

schema:
  type: object
  properties:
    providers:
      type: object
      properties:
        bedrock:
          $ref: "#/definitions/BedrockConfig"
        google:
          $ref: "#/definitions/GoogleConfig"
        meta:
          $ref: "#/definitions/MetaConfig"

    routing:
      type: object
      properties:
        strategy:
          type: string
          enum: [round-robin, least-utilized, quota-aware]
        weights:
          type: object
          additionalProperties:
            type: number
            minimum: 0
            maximum: 1
        failover_enabled:
          type: boolean
          default: true

    quality_gates:
      type: object
      properties:
        offline_evaluation:
          $ref: "#/definitions/OfflineEvalConfig"
        canary_evaluation:
          $ref: "#/definitions/CanaryEvalConfig"
        performance_gates:
          $ref: "#/definitions/PerformanceGatesConfig"

    monitoring:
      type: object
      properties:
        metrics_enabled:
          type: boolean
          default: true
        alert_thresholds:
          $ref: "#/definitions/AlertThresholds"

definitions:
  BedrockConfig:
    type: object
    properties:
      region:
        type: string
        default: us-east-1
      model_id:
        type: string
        default: anthropic.claude-3-5-sonnet-20241022-v2:0
      max_tokens:
        type: number
        default: 4096
      temperature:
        type: number
        minimum: 0
        maximum: 1
        default: 0.7

  GoogleConfig:
    type: object
    properties:
      project_id:
        type: string
      location:
        type: string
        default: us-central1
      model_name:
        type: string
        default: gemini-pro
      api_key:
        type: string

  MetaConfig:
    type: object
    properties:
      api_endpoint:
        type: string
      model_name:
        type: string
        default: llama-2-70b
      api_key:
        type: string

  OfflineEvalConfig:
    type: object
    properties:
      enabled:
        type: boolean
        default: true
      dataset_path:
        type: string
      thresholds:
        type: object
        properties:
          accuracy:
            type: number
            minimum: 0
            maximum: 1
            default: 0.95
          latency_ms:
            type: number
            default: 2000

  CanaryEvalConfig:
    type: object
    properties:
      enabled:
        type: boolean
        default: true
      traffic_percentage:
        type: number
        minimum: 1
        maximum: 100
        default: 5
      duration_minutes:
        type: number
        default: 10
      thresholds:
        type: object
        properties:
          success_rate:
            type: number
            minimum: 0
            maximum: 1
            default: 0.98
          p95_latency_ms:
            type: number
            default: 1500

  PerformanceGatesConfig:
    type: object
    properties:
      enabled:
        type: boolean
        default: true
      duration_minutes:
        type: number
        default: 5
      thresholds:
        type: object
        properties:
          p95_latency_ms:
            type: number
            default: 1500
          throughput_rps:
            type: number
            default: 20
          error_rate:
            type: number
            minimum: 0
            maximum: 1
            default: 0.02

  AlertThresholds:
    type: object
    properties:
      error_rate:
        type: object
        properties:
          warning:
            type: number
            default: 0.02
          critical:
            type: number
            default: 0.05
      latency_ms:
        type: object
        properties:
          warning:
            type: number
            default: 1500
          critical:
            type: number
            default: 3000
      quota_utilization:
        type: object
        properties:
          warning:
            type: number
            default: 0.8
          critical:
            type: number
            default: 0.95
```

### 3. **Pipeline Configuration Schema**

```yaml
name: quality-pipeline-config
version: 1.0.0
description: Quality Pipeline Configuration Schema

schema:
  type: object
  required: [model_id, environment]
  properties:
    model_id:
      type: string
      description: AI model identifier
      examples: [claude-3-5-sonnet-v2, gemini-pro, llama-2-70b]

    previous_model_id:
      type: string
      description: Previous model for rollback

    environment:
      type: string
      enum: [development, staging, production]
      description: Target environment

    skip_offline:
      type: boolean
      default: false
      description: Skip offline evaluation

    skip_canary:
      type: boolean
      default: false
      description: Skip canary evaluation

    skip_performance:
      type: boolean
      default: false
      description: Skip performance gates

    auto_rollback:
      type: boolean
      default: true
      description: Enable automatic rollback

    monitoring_duration:
      type: number
      minimum: 0
      default: 0
      description: Monitoring duration in minutes (0 = continuous)

    output_dir:
      type: string
      default: ./test/ai-quality-gates/results
      description: Output directory for reports

    thresholds:
      type: object
      properties:
        accuracy:
          type: number
          minimum: 0
          maximum: 1
        latency_ms:
          type: number
          minimum: 0
        error_rate:
          type: number
          minimum: 0
          maximum: 1
        success_rate:
          type: number
          minimum: 0
          maximum: 1

examples:
  development:
    model_id: claude-3-5-sonnet-v2
    environment: development
    skip_canary: true
    auto_rollback: false
    monitoring_duration: 5

  staging:
    model_id: gemini-pro
    environment: staging
    skip_offline: false
    skip_canary: false
    auto_rollback: true
    monitoring_duration: 15

  production:
    model_id: claude-3-5-sonnet-v2
    environment: production
    skip_offline: false
    skip_canary: false
    skip_performance: false
    auto_rollback: true
    monitoring_duration: 30
```

## 📊 Error Handling

### Error Response Schema

```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
    request_id: string;
    timestamp: string;
  };
}
```

### Common Error Codes

- `INVALID_REQUEST`: Malformed request
- `AUTHENTICATION_FAILED`: Invalid credentials
- `AUTHORIZATION_DENIED`: Insufficient permissions
- `PROVIDER_UNAVAILABLE`: AI provider is down
- `QUOTA_EXCEEDED`: Rate limit or quota exceeded
- `QUALITY_GATE_FAILED`: Quality validation failed
- `TIMEOUT`: Request timeout
- `INTERNAL_ERROR`: Server error

### Example Error Response

```json
{
  "error": {
    "code": "PROVIDER_UNAVAILABLE",
    "message": "The requested AI provider is currently unavailable",
    "details": {
      "provider": "bedrock",
      "retry_after": 30
    },
    "request_id": "req_123456789",
    "timestamp": "2025-01-14T10:30:00Z"
  }
}
```

## 🔄 Rate Limiting

### Rate Limit Headers

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642176000
X-RateLimit-Window: 3600
```

### Rate Limit Tiers

- **Free Tier**: 100 requests/hour
- **Basic Tier**: 1,000 requests/hour
- **Pro Tier**: 10,000 requests/hour
- **Enterprise Tier**: Custom limits

## 📝 SDK Examples

### TypeScript/JavaScript SDK

```typescript
import { AISystemClient } from "@matbakh/ai-system-sdk";

const client = new AISystemClient({
  apiKey: "your-api-key",
  baseUrl: "https://api.matbakh.app/v1",
});

// Process AI request
const response = await client.ai.process({
  prompt: "Analyze restaurant visibility",
  provider: "auto",
  options: { cache_enabled: true },
});

// Run quality evaluation
const evaluation = await client.quality.evaluate({
  model_id: "claude-3-5-sonnet-v2",
  evaluation_type: "comprehensive",
});

// Monitor system health
const health = await client.monitoring.health();
```

### Python SDK

```python
from matbakh_ai_system import AISystemClient

client = AISystemClient(
    api_key='your-api-key',
    base_url='https://api.matbakh.app/v1'
)

# Process AI request
response = client.ai.process(
    prompt='Analyze restaurant visibility',
    provider='auto',
    options={'cache_enabled': True}
)

# Run quality evaluation
evaluation = client.quality.evaluate(
    model_id='claude-3-5-sonnet-v2',
    evaluation_type='comprehensive'
)
```

### cURL Examples

```bash
# Process AI request
curl -X POST https://api.matbakh.app/v1/ai/process \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Analyze restaurant visibility", "provider": "auto"}'

# Get system health
curl -X GET https://api.matbakh.app/v1/monitoring/health \
  -H "Authorization: Bearer your-api-key"

# Run quality evaluation
curl -X POST https://api.matbakh.app/v1/quality/evaluate \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"model_id": "claude-3-5-sonnet-v2", "evaluation_type": "offline"}'
```

## 🔗 Related Resources

- [AI System Developer Guide](../onboarding/ai-system-developer-guide.md)
- [Quality Gates Documentation](../quality-gates-documentation.md)
- [Monitoring Guide](../performance-monitoring-guide.md)
- [Runbooks](../runbooks/)

---

_For API support, contact the AI team or create an issue in the GitHub repository._

_Last updated: 2025-01-14 by AI Team_
