# Health Check Endpoints - Quick Reference

**Status**: ✅ Production-Ready  
**Version**: 1.0.0  
**Last Updated**: 2025-01-14

## Overview

Comprehensive health monitoring system for hybrid routing operations with REST API endpoints, real-time monitoring, and intelligent alerting.

## Quick Start

```typescript
import { HybridHealthChecker } from "@/lib/ai-orchestrator/health/hybrid-health-checker";
import { createHealthRouter } from "@/lib/ai-orchestrator/health/health-router";

// Create health checker
const healthChecker = new HybridHealthChecker();

// Register custom health check
healthChecker.registerHealthCheck(HealthComponent.HYBRID_ROUTER, async () => ({
  status: HealthStatus.HEALTHY,
  message: "Router operational",
}));

// Start monitoring
healthChecker.start();

// Create Express router
const healthRouter = createHealthRouter(healthChecker);
app.use("/health", healthRouter);
```

## API Endpoints

### Basic Health Check

```http
GET /health
```

**Response**:

```json
{
  "status": "healthy",
  "timestamp": "2025-01-14T10:30:00.000Z",
  "uptime": 3600,
  "version": "1.0.0",
  "environment": "production"
}
```

**Status Codes**:

- `200` - Healthy or Degraded
- `503` - Unhealthy, Critical, or Unknown

### Detailed Health Check

```http
GET /health/detailed
```

**Response**:

```json
{
  "status": "healthy",
  "timestamp": "2025-01-14T10:30:00.000Z",
  "uptime": 3600,
  "components": {
    "hybrid-router": {
      "status": "healthy",
      "responseTime": 150,
      "message": "Router operational"
    }
  },
  "summary": {
    "healthy": 8,
    "degraded": 0,
    "unhealthy": 0,
    "critical": 0,
    "unknown": 2
  },
  "alerts": []
}
```

### Component-Specific Health

```http
GET /health/component/:componentName
```

**Example**:

```http
GET /health/component/hybrid-router
```

**Response**:

```json
{
  "status": "healthy",
  "timestamp": "2025-01-14T10:30:00.000Z",
  "uptime": 3600,
  "data": {
    "component": "hybrid-router",
    "responseTime": 150,
    "message": "Router operational",
    "details": {
      "activeRoutes": 2,
      "fallbackEnabled": true
    }
  }
}
```

### Readiness Probe

```http
GET /health/ready
```

**Response**:

```json
{
  "status": "healthy",
  "timestamp": "2025-01-14T10:30:00.000Z",
  "uptime": 3600,
  "data": {
    "ready": true,
    "criticalComponents": 0,
    "unhealthyComponents": 0
  }
}
```

**Use Case**: Kubernetes readiness probe

### Liveness Probe

```http
GET /health/live
```

**Response**:

```json
{
  "status": "healthy",
  "timestamp": "2025-01-14T10:30:00.000Z",
  "uptime": 3600,
  "data": {
    "alive": true,
    "pid": 12345,
    "memory": {
      "rss": 52428800,
      "heapTotal": 20971520,
      "heapUsed": 15728640
    }
  }
}
```

**Use Case**: Kubernetes liveness probe

### Health Metrics

```http
GET /health/metrics
```

**Response**:

```json
{
  "status": "healthy",
  "timestamp": "2025-01-14T10:30:00.000Z",
  "uptime": 3600,
  "data": {
    "components": {
      "total": 10,
      "healthy": 8,
      "degraded": 0,
      "unhealthy": 0,
      "critical": 0,
      "unknown": 2
    },
    "alerts": {
      "active": 0,
      "critical": 0,
      "high": 0,
      "medium": 0,
      "low": 0
    },
    "performance": {
      "averageResponseTime": 150,
      "maxResponseTime": 300,
      "minResponseTime": 50
    }
  }
}
```

### Active Alerts

```http
GET /health/alerts
```

**Response**:

```json
{
  "status": "degraded",
  "timestamp": "2025-01-14T10:30:00.000Z",
  "uptime": 3600,
  "data": {
    "activeAlerts": 1,
    "alerts": [
      {
        "id": "alert-123",
        "component": "bedrock-client",
        "severity": "high",
        "message": "Bedrock client connection degraded",
        "timestamp": "2025-01-14T10:25:00.000Z",
        "resolved": false
      }
    ]
  }
}
```

### Resolve Alert

```http
POST /health/alerts/:alertId/resolve
```

**Example**:

```http
POST /health/alerts/alert-123/resolve
```

**Response**:

```json
{
  "status": "healthy",
  "timestamp": "2025-01-14T10:30:00.000Z",
  "uptime": 3600,
  "data": {
    "alertId": "alert-123",
    "resolved": true,
    "message": "Alert resolved successfully"
  }
}
```

### HTML Status Page

```http
GET /health/status
```

**Response**: HTML page with visual health status dashboard

## Health Components

### Available Components

```typescript
enum HealthComponent {
  HYBRID_ROUTER = "hybrid-router",
  BEDROCK_CLIENT = "bedrock-client",
  SUPPORT_MANAGER = "support-manager",
  CACHE_LAYER = "cache-layer",
  CIRCUIT_BREAKER = "circuit-breaker",
  LOG_AGGREGATOR = "log-aggregator",
  METRICS_PUBLISHER = "metrics-publisher",
  ALERT_SYSTEM = "alert-system",
  DATABASE = "database",
  EXTERNAL_API = "external-api",
}
```

### Health Status Levels

```typescript
enum HealthStatus {
  HEALTHY = "healthy", // Component fully operational
  DEGRADED = "degraded", // Component operational but slow
  UNHEALTHY = "unhealthy", // Component has issues
  CRITICAL = "critical", // Component down or failing
  UNKNOWN = "unknown", // No health data available
}
```

## Configuration

### Health Check Configuration

```typescript
interface HealthCheckConfig {
  component: HealthComponent;
  enabled: boolean;
  interval: number; // Check interval in milliseconds
  timeout: number; // Timeout in milliseconds
  retries: number; // Number of retries on failure
  thresholds: {
    responseTime: {
      warning: number; // Warning threshold in ms
      critical: number; // Critical threshold in ms
    };
    errorRate: {
      warning: number; // Warning threshold (0-1)
      critical: number; // Critical threshold (0-1)
    };
  };
}
```

### Router Configuration

```typescript
interface HealthRouterConfig {
  enableRateLimit?: boolean;
  rateLimitWindow?: number; // Minutes
  rateLimitMax?: number; // Requests per window
  enableAuth?: boolean;
  authToken?: string;
  enableCors?: boolean;
  version?: string;
  environment?: string;
}
```

## Usage Examples

### Register Custom Health Check

```typescript
healthChecker.registerHealthCheck(
  HealthComponent.BEDROCK_CLIENT,
  async () => {
    const isConnected = await checkBedrockConnection();

    return {
      status: isConnected ? HealthStatus.HEALTHY : HealthStatus.CRITICAL,
      message: isConnected ? "Connected" : "Disconnected",
      details: {
        region: "eu-central-1",
        modelsAvailable: isConnected,
      },
      metrics: {
        uptime: process.uptime(),
        requestCount: 1000,
        errorRate: 0.01,
        averageLatency: 150,
      },
    };
  },
  {
    interval: 60000,
    timeout: 10000,
    retries: 3,
  }
);
```

### Manual Health Check

```typescript
const result = await healthChecker.checkHealth(HealthComponent.HYBRID_ROUTER);

console.log({
  component: result.component,
  status: result.status,
  responseTime: result.responseTime,
  message: result.message,
});
```

### Get System Health

```typescript
const systemHealth = healthChecker.getSystemHealth();

console.log({
  overallStatus: systemHealth.overallStatus,
  uptime: systemHealth.uptime,
  summary: systemHealth.summary,
  activeAlerts: systemHealth.alerts.length,
});
```

### Listen for Events

```typescript
// Health check completed
healthChecker.on("healthCheck", (result) => {
  console.log(`Health check: ${result.component} - ${result.status}`);
});

// Alert generated
healthChecker.on("alert", (alert) => {
  console.log(`Alert: ${alert.component} - ${alert.severity}`);
});

// Alert resolved
healthChecker.on("alertResolved", (alert) => {
  console.log(`Alert resolved: ${alert.id}`);
});

// Monitoring started
healthChecker.on("started", () => {
  console.log("Health monitoring started");
});

// Monitoring stopped
healthChecker.on("stopped", () => {
  console.log("Health monitoring stopped");
});
```

### Update Configuration

```typescript
// Update health check configuration
healthChecker.updateConfig(HealthComponent.CACHE_LAYER, {
  interval: 30000,
  timeout: 5000,
});

// Enable/disable health check
healthChecker.setComponentEnabled(HealthComponent.DATABASE, false);
healthChecker.setComponentEnabled(HealthComponent.DATABASE, true);
```

## Kubernetes Integration

### Deployment Configuration

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hybrid-routing-service
spec:
  template:
    spec:
      containers:
        - name: app
          image: hybrid-routing:latest
          ports:
            - containerPort: 3000
          livenessProbe:
            httpGet:
              path: /health/live
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
            timeoutSeconds: 5
            failureThreshold: 3
          readinessProbe:
            httpGet:
              path: /health/ready
              port: 3000
            initialDelaySeconds: 10
            periodSeconds: 5
            timeoutSeconds: 3
            failureThreshold: 3
```

## Monitoring & Alerting

### CloudWatch Integration

```typescript
// Publish health metrics to CloudWatch
healthChecker.on("healthCheck", async (result) => {
  await cloudWatch.putMetricData({
    Namespace: "HybridRouting/Health",
    MetricData: [
      {
        MetricName: "ComponentHealth",
        Value: result.status === HealthStatus.HEALTHY ? 1 : 0,
        Unit: "None",
        Dimensions: [{ Name: "Component", Value: result.component }],
      },
      {
        MetricName: "ResponseTime",
        Value: result.responseTime,
        Unit: "Milliseconds",
        Dimensions: [{ Name: "Component", Value: result.component }],
      },
    ],
  });
});
```

### PagerDuty Integration

```typescript
// Send alerts to PagerDuty
healthChecker.on("alert", async (alert) => {
  if (alert.severity === "critical") {
    await pagerDuty.createIncident({
      title: `Health Alert: ${alert.component}`,
      description: alert.message,
      severity: "critical",
      component: alert.component,
    });
  }
});
```

## Best Practices

### 1. Health Check Design

- **Keep checks lightweight**: Health checks should complete quickly (<1s)
- **Avoid cascading failures**: Don't call other services in health checks
- **Use appropriate timeouts**: Set realistic timeouts for each component
- **Implement retries**: Use retries for transient failures

### 2. Alert Management

- **Set appropriate thresholds**: Avoid alert fatigue with proper thresholds
- **Implement alert routing**: Route alerts based on severity
- **Auto-resolve alerts**: Resolve alerts when components recover
- **Document alert procedures**: Provide runbooks for each alert type

### 3. Monitoring Strategy

- **Monitor all critical components**: Ensure comprehensive coverage
- **Use appropriate intervals**: Balance monitoring frequency with overhead
- **Track trends**: Monitor health trends over time
- **Set up dashboards**: Create visual dashboards for quick assessment

### 4. Production Deployment

- **Enable rate limiting**: Protect health endpoints from abuse
- **Use authentication**: Secure sensitive health endpoints
- **Enable CORS**: Allow cross-origin requests if needed
- **Monitor health endpoint performance**: Ensure health checks don't impact performance

## Troubleshooting

### Health Check Timeouts

**Problem**: Health checks timing out frequently

**Solutions**:

- Increase timeout configuration
- Optimize health check logic
- Check network connectivity
- Review component performance

### False Alerts

**Problem**: Alerts generated for healthy components

**Solutions**:

- Adjust alert thresholds
- Increase retry count
- Review health check logic
- Check for transient issues

### Missing Health Data

**Problem**: Components showing unknown status

**Solutions**:

- Verify health check registration
- Check if monitoring is started
- Review component configuration
- Check for errors in health check logic

### High Response Times

**Problem**: Health checks taking too long

**Solutions**:

- Optimize health check implementation
- Reduce check frequency
- Use caching for expensive checks
- Review component dependencies

## Performance Considerations

### Resource Usage

- **Memory**: ~10MB per health checker instance
- **CPU**: <1% for typical monitoring
- **Network**: Minimal (local checks only)
- **Disk**: Negligible (no persistent storage)

### Scalability

- **Concurrent checks**: Supports unlimited concurrent checks
- **Component limit**: No hard limit on number of components
- **Alert limit**: No hard limit on number of alerts
- **Event listeners**: Supports multiple event listeners

## Security

### Authentication

```typescript
const healthRouter = createHealthRouter(healthChecker, {
  enableAuth: true,
  authToken: process.env.HEALTH_CHECK_TOKEN,
});
```

### Rate Limiting

```typescript
const healthRouter = createHealthRouter(healthChecker, {
  enableRateLimit: true,
  rateLimitWindow: 15, // 15 minutes
  rateLimitMax: 100, // 100 requests per window
});
```

### CORS Configuration

```typescript
const healthRouter = createHealthRouter(healthChecker, {
  enableCors: true,
});
```

## Related Documentation

- [Hybrid Routing Architecture](./ai-provider-architecture.md)
- [Monitoring & Alerting](./hybrid-routing-cloudwatch-quick-reference.md)
- [Performance Monitoring](./hybrid-routing-performance-monitoring-quick-reference.md)
- [Log Aggregation](./hybrid-log-aggregation-quick-reference.md)

## Support

For issues or questions:

- Check troubleshooting section above
- Review example implementations
- Consult related documentation
- Contact DevOps team

---

**Last Updated**: 2025-01-14  
**Version**: 1.0.0  
**Status**: ✅ Production-Ready
