# Hybrid Routing CloudWatch Monitoring - Quick Reference

**Status**: ✅ PRODUCTION-READY  
**Last Updated**: 2025-01-14

## Quick Start

### Deploy Dashboard

```bash
# Development
cdk deploy HybridRoutingMonitoringStack-dev

# Production
cdk deploy HybridRoutingMonitoringStack-prod
```

### Start Metrics Publishing

```typescript
import { HybridRoutingMetricsPublisher } from "./hybrid-routing-metrics-publisher";

const publisher = new HybridRoutingMetricsPublisher(
  performanceMonitor,
  healthMonitor,
  { environment: "production", enablePublishing: true }
);

publisher.startPublishing();
```

## Key Metrics

### Latency Metrics

| Metric                    | Threshold | Description                |
| ------------------------- | --------- | -------------------------- |
| `DirectBedrockP95Latency` | 10,000ms  | Direct Bedrock P95 latency |
| `MCPP95Latency`           | 30,000ms  | MCP path P95 latency       |
| `DirectBedrockAvgLatency` | -         | Average latency            |
| `MCPAvgLatency`           | -         | Average latency            |

### Success Rate Metrics

| Metric                     | Threshold | Description                 |
| -------------------------- | --------- | --------------------------- |
| `DirectBedrockSuccessRate` | 95%       | Direct Bedrock success rate |
| `MCPSuccessRate`           | 95%       | MCP path success rate       |

### Routing Efficiency Metrics

| Metric                     | Threshold | Description                |
| -------------------------- | --------- | -------------------------- |
| `OverallRoutingEfficiency` | 80%       | Overall routing efficiency |
| `FallbackRate`             | 10%       | Fallback operation rate    |
| `OptimalRoutingRate`       | -         | Optimal routing decisions  |

### Health Metrics

| Metric                     | Description                |
| -------------------------- | -------------------------- |
| `DirectBedrockHealthScore` | Health score (0-100)       |
| `MCPHealthScore`           | Health score (0-100)       |
| `CircuitBreakerTrips`      | Circuit breaker trip count |

## Alarms

### Critical Alarms

- **Direct Bedrock P95 Latency** > 10s
- **MCP P95 Latency** > 30s
- **Success Rate** < 95%
- **Routing Efficiency** < 80%

### Warning Alarms

- **Fallback Rate** > 10%
- **Budget** > 50%

## Dashboard Access

### AWS Console

```
https://console.aws.amazon.com/cloudwatch/home?region=eu-central-1#dashboards:name=Matbakh-Hybrid-Routing-{environment}
```

### Quick Links

- **Development**: `Matbakh-Hybrid-Routing-development`
- **Staging**: `Matbakh-Hybrid-Routing-staging`
- **Production**: `Matbakh-Hybrid-Routing-production`

## Troubleshooting

### High Latency

```bash
# Check routing path health
aws cloudwatch get-metric-statistics \
  --namespace Matbakh/HybridRouting \
  --metric-name DirectBedrockHealthScore \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average
```

### Low Success Rate

```bash
# Check error rates
aws cloudwatch get-metric-statistics \
  --namespace Matbakh/HybridRouting \
  --metric-name DirectBedrockSuccessRate \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average
```

### High Fallback Rate

```bash
# Check fallback rate
aws cloudwatch get-metric-statistics \
  --namespace Matbakh/HybridRouting \
  --metric-name FallbackRate \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average
```

## Alert Response

### Critical Alert Response (< 15 min)

1. Check dashboard for affected metrics
2. Review CloudWatch Logs for errors
3. Check AWS Bedrock service status
4. Escalate if needed

### Warning Alert Response (< 1 hour)

1. Review metric trends
2. Check for patterns
3. Plan optimization if needed
4. Document findings

## Configuration

### Metrics Publisher Config

```typescript
{
  namespace: 'Matbakh/HybridRouting',
  region: 'eu-central-1',
  environment: 'production',
  publishIntervalMs: 60000,  // 1 minute
  batchSize: 20,
  enablePublishing: true
}
```

### Alarm Thresholds

```typescript
{
  p95LatencyWarningThreshold: 10000,    // 10s
  p95LatencyCriticalThreshold: 15000,   // 15s
  successRateWarningThreshold: 95,      // 95%
  successRateCriticalThreshold: 90,     // 90%
  routingEfficiencyWarningThreshold: 80, // 80%
  routingEfficiencyCriticalThreshold: 70 // 70%
}
```

## Common Commands

### View Dashboard

```bash
# Open dashboard in browser
open "https://console.aws.amazon.com/cloudwatch/home?region=eu-central-1#dashboards:name=Matbakh-Hybrid-Routing-production"
```

### List Alarms

```bash
# List all hybrid routing alarms
aws cloudwatch describe-alarms \
  --alarm-name-prefix "Hybrid-Routing"
```

### Get Metric Data

```bash
# Get latest metric value
aws cloudwatch get-metric-statistics \
  --namespace Matbakh/HybridRouting \
  --metric-name OverallRoutingEfficiency \
  --start-time $(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 60 \
  --statistics Average
```

## Support

### Documentation

- [Full Documentation](./hybrid-routing-cloudwatch-dashboards.md)
- [Completion Report](./bedrock-activation-task-6.2-cloudwatch-dashboards-completion-report.md)
- [Performance Monitoring](./hybrid-routing-performance-monitoring-quick-reference.md)

### Contact

- **Ops Team**: ops@matbakh.app
- **On-Call**: See PagerDuty rotation
- **Escalation**: CTO

---

**Quick Reference Version**: 1.0  
**Last Updated**: 2025-01-14
