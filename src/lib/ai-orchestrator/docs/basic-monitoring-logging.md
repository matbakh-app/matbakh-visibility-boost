# Basic Monitoring and Logging

This document describes the basic monitoring and logging system implemented for the AI Orchestrator as part of Task 1.5.

## Overview

The basic monitoring and logging system provides:

- **Structured Logging**: Consistent log format with different levels and contexts
- **Request Tracking**: Monitor AI requests from start to completion
- **Performance Metrics**: Track latency, success rates, and costs
- **Provider Health**: Monitor individual provider performance
- **Simple Alerting**: Basic alerts for performance and availability issues
- **Health Checks**: Periodic system health validation

## Components

### BasicLogger

Provides structured logging with multiple levels and AI-specific methods.

```typescript
import { BasicLogger } from "@/lib/ai-orchestrator";

const logger = new BasicLogger("my-service", "production");

// Basic logging
logger.debug("Debug message", { key: "value" });
logger.info("Info message", { requestId: "req-123" });
logger.warn("Warning message");
logger.error("Error occurred", error, { context: "data" });

// AI-specific logging
logger.logRequestStart("req-123", { provider: "bedrock", userId: "user-456" });
logger.logRequestComplete("req-123", { duration: 1200, cost: 0.05 });
logger.logProviderFallback("req-123", "bedrock", "google", "timeout");
```

#### Features

- **Log Levels**: debug, info, warn, error, fatal
- **Environment-aware**: Different default levels for dev/staging/production
- **Structured Output**: JSON in production, pretty-print in development
- **Child Loggers**: Create loggers with additional context
- **AI-specific Methods**: Purpose-built methods for AI operations

### BasicMonitor

Tracks system performance and health with simple alerting.

```typescript
import { BasicMonitor } from "@/lib/ai-orchestrator";

const monitor = new BasicMonitor(logger);

// Track requests
const requestId = monitor.recordRequestStart(request);
monitor.recordRequestComplete(requestId, request, response, startTime);
monitor.recordRequestError(requestId, request, error, startTime);

// Get metrics
const metrics = monitor.getMetrics();
const health = monitor.getHealthStatus();
const isHealthy = monitor.isHealthy();
```

#### Features

- **Request Tracking**: Monitor all AI requests with timing and outcomes
- **Provider Health**: Track individual provider performance and availability
- **Performance Metrics**: Latency percentiles, error rates, cost tracking
- **Simple Alerting**: Automatic alerts for performance degradation
- **Health Checks**: Periodic system health validation

## Configuration

### Log Levels

Set the minimum log level via environment variable:

```bash
# Development (default: debug)
LOG_LEVEL=debug

# Production (default: info)
LOG_LEVEL=info

# Only errors and above
LOG_LEVEL=error
```

### Environment Detection

The system automatically detects the environment:

- `NODE_ENV=production`: JSON logging, info level default
- `NODE_ENV=staging`: Pretty logging, debug level default
- `NODE_ENV=development`: Pretty logging, debug level default

## Metrics

### Global Metrics

- `totalRequests`: Total number of requests processed
- `successfulRequests`: Number of successful requests
- `failedRequests`: Number of failed requests
- `averageLatency`: Average response time in milliseconds
- `totalCost`: Total cost in EUR
- `requestsPerMinute`: Current request rate
- `errorRate`: Percentage of failed requests (0-1)
- `uptime`: System uptime in milliseconds

### Provider Metrics

- `provider`: Provider name (bedrock, google, meta)
- `isHealthy`: Current health status
- `consecutiveFailures`: Number of consecutive failures
- `averageLatency`: Average response time for this provider
- `requestCount`: Total requests to this provider
- `errorRate`: Error rate for this provider

## Alerting

### Alert Types

- **Performance**: High latency alerts
- **Error**: High error rate alerts
- **Availability**: Provider health alerts

### Alert Severities

- **Low**: Minor issues, informational
- **Medium**: Performance degradation
- **High**: Service impact
- **Critical**: System failure (triggers automatic actions)

### Default Thresholds

- **Error Rate**: > 5% triggers high severity alert
- **Latency**: > 2000ms average triggers medium severity alert
- **Provider Health**: 3+ consecutive failures triggers high severity alert

## Health Status

The system reports overall health as:

- **Healthy**: No critical issues, normal operation
- **Degraded**: Some issues present but system functional
- **Unhealthy**: Critical issues affecting system operation

## Integration Example

```typescript
import { BasicLogger, BasicMonitor } from "@/lib/ai-orchestrator";

class MyAiService {
  private logger: BasicLogger;
  private monitor: BasicMonitor;

  constructor() {
    this.logger = new BasicLogger("my-ai-service");
    this.monitor = new BasicMonitor(this.logger);
  }

  async processRequest(request: AiRequest): Promise<AiResponse> {
    const requestId = this.monitor.recordRequestStart(request);
    const startTime = Date.now();

    try {
      // Process request
      const response = await this.callAiProvider(request);

      // Record success
      this.monitor.recordRequestComplete(
        requestId,
        request,
        response,
        startTime
      );

      return response;
    } catch (error) {
      // Record error
      this.monitor.recordRequestError(requestId, request, error, startTime);
      throw error;
    }
  }

  getHealthStatus() {
    return this.monitor.getHealthStatus();
  }
}
```

## Production Considerations

### CloudWatch Integration

In production, logs are output as JSON and can be ingested by CloudWatch:

```json
{
  "timestamp": "2025-09-27T12:00:00.000Z",
  "level": "info",
  "message": "AI request completed",
  "context": {
    "service": "ai-orchestrator",
    "environment": "production",
    "requestId": "req-123",
    "provider": "bedrock",
    "duration": 1200,
    "cost": 0.05
  }
}
```

### Performance Impact

- **Minimal Overhead**: Logging and monitoring add < 1ms per request
- **Memory Efficient**: Circular buffers prevent memory leaks
- **Async Operations**: Non-blocking logging operations

### Scaling Considerations

- **Stateless**: Each instance maintains its own metrics
- **Aggregation**: Use external systems (CloudWatch, Grafana) for aggregation
- **Sampling**: Consider sampling for very high-volume scenarios

## Testing

The system includes comprehensive tests:

```bash
# Run logger tests
npm test -- src/lib/ai-orchestrator/__tests__/basic-logger.test.ts

# Run monitor tests
npm test -- src/lib/ai-orchestrator/__tests__/basic-monitor.test.ts
```

## Future Enhancements

This basic system provides the foundation for more advanced monitoring:

- **CloudWatch Metrics**: Direct metric publishing
- **Distributed Tracing**: Request tracing across services
- **Custom Dashboards**: Real-time monitoring dashboards
- **Advanced Alerting**: Integration with PagerDuty, Slack, etc.
- **Anomaly Detection**: ML-based performance anomaly detection

## Phase 2 Integration

This basic monitoring system is designed to integrate with Phase 2 components:

- **CloudWatch Evidently**: A/B testing and feature flags
- **Bandit Optimization**: Multi-armed bandit algorithms
- **Real-time Dashboards**: Live monitoring interfaces
- **Advanced Analytics**: Detailed performance analysis
