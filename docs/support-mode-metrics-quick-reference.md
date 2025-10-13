# Support Mode Metrics - Quick Reference

**Version**: 1.0.0  
**Last Updated**: 2025-01-14  
**Status**: ✅ Production-Ready

## Quick Start

### Recording Metrics

```typescript
import {
  HybridRoutingMetricsPublisher,
  SupportModeOperationType,
} from "./hybrid-routing-metrics-publisher";

// Record an operation
publisher.recordSupportModeOperation({
  operationType: SupportModeOperationType.INFRASTRUCTURE_AUDIT,
  routePath: "direct",
  latencyMs: 150,
  success: true,
  costUsd: 0.05,
  timestamp: new Date(),
});
```

### Getting Summary

```typescript
const summary = publisher.getSupportModeMetricsSummary();

console.log(`Total: ${summary.totalOperations}`);
console.log(`Avg Latency: ${summary.averageLatencyMs}ms`);
console.log(`Success Rate: ${summary.successRate}%`);
console.log(`Total Cost: $${summary.totalCostUsd}`);
```

## Operation Types

| Type                     | Description                  | Typical Path |
| ------------------------ | ---------------------------- | ------------ |
| `INFRASTRUCTURE_AUDIT`   | System health checks         | Direct       |
| `META_MONITOR`           | Kiro execution analysis      | Direct       |
| `IMPLEMENTATION_SUPPORT` | Code remediation suggestions | Direct/MCP   |
| `KIRO_BRIDGE`            | Kiro communication           | MCP          |
| `EMERGENCY_OPERATION`    | Critical operations          | Direct       |

## Routing Paths

| Path       | Description                | Use Case           |
| ---------- | -------------------------- | ------------------ |
| `direct`   | Direct Bedrock access      | Time-critical ops  |
| `mcp`      | MCP Router integration     | Standard ops       |
| `fallback` | Fallback when primary down | Automatic failover |

## CloudWatch Metrics

### Metric Names

- `SupportModeOperationCount`: Operation count with dimensions
- `SupportModeOperationLatency`: Latency in milliseconds
- `SupportModeOperationSuccess`: Success status (0 or 1)
- `SupportModeOperationCost`: Cost in USD

### Dimensions

- `OperationType`: Type of support operation
- `RoutePath`: Routing path used
- `Environment`: dev, staging, production

## Common Patterns

### Infrastructure Audit

```typescript
const startTime = Date.now();
const result = await performAudit();

publisher.recordSupportModeOperation({
  operationType: SupportModeOperationType.INFRASTRUCTURE_AUDIT,
  routePath: "direct",
  latencyMs: Date.now() - startTime,
  success: result.success,
  costUsd: calculateCost(result.tokens),
  timestamp: new Date(),
});
```

### Meta Monitor

```typescript
const analysis = await analyzeExecution();

publisher.recordSupportModeOperation({
  operationType: SupportModeOperationType.META_MONITOR,
  routePath: "direct",
  latencyMs: analysis.duration,
  success: analysis.completed,
  costUsd: analysis.cost,
  timestamp: new Date(),
});
```

### Implementation Support

```typescript
const remediation = await suggestRemediation();

publisher.recordSupportModeOperation({
  operationType: SupportModeOperationType.IMPLEMENTATION_SUPPORT,
  routePath: remediation.usedMCP ? "mcp" : "direct",
  latencyMs: remediation.duration,
  success: remediation.success,
  costUsd: remediation.cost,
  timestamp: new Date(),
});
```

## Monitoring

### Dashboard Queries

**Total Operations by Type**:

```
SELECT COUNT(*) FROM SupportModeOperationCount
GROUP BY OperationType
```

**Average Latency by Path**:

```
SELECT AVG(value) FROM SupportModeOperationLatency
GROUP BY RoutePath
```

**Success Rate**:

```
SELECT AVG(value) * 100 FROM SupportModeOperationSuccess
```

**Total Cost**:

```
SELECT SUM(value) FROM SupportModeOperationCost
```

### Alerting Thresholds

| Metric       | Warning | Critical | Action                    |
| ------------ | ------- | -------- | ------------------------- |
| Latency      | > 300ms | > 500ms  | Investigate routing       |
| Success Rate | < 95%   | < 90%    | Check system health       |
| Cost/Hour    | > $5    | > $10    | Review operation patterns |
| Failures     | 3/5min  | 5/5min   | Emergency investigation   |

## Troubleshooting

### High Latency

1. Check routing path distribution
2. Verify direct Bedrock health
3. Review MCP connection status
4. Check for network issues

### Low Success Rate

1. Review error logs
2. Check circuit breaker status
3. Verify API credentials
4. Test fallback mechanisms

### High Costs

1. Review operation frequency
2. Check token usage patterns
3. Optimize prompt templates
4. Implement caching strategies

## Configuration

### Publisher Config

```typescript
const publisher = new HybridRoutingMetricsPublisher(
  performanceMonitor,
  healthMonitor,
  {
    namespace: "Matbakh/HybridRouting",
    region: "eu-central-1",
    environment: "production",
    publishIntervalMs: 60000, // 1 minute
    batchSize: 20,
    enablePublishing: true,
  }
);
```

### Environment Variables

```bash
# CloudWatch Configuration
CLOUDWATCH_NAMESPACE=Matbakh/HybridRouting
CLOUDWATCH_REGION=eu-central-1
METRICS_PUBLISH_INTERVAL=60000
METRICS_BATCH_SIZE=20
```

## Best Practices

### 1. Always Record Metrics

Record metrics for every support mode operation, even failures:

```typescript
try {
  const result = await operation();
  publisher.recordSupportModeOperation({
    /* success metrics */
  });
} catch (error) {
  publisher.recordSupportModeOperation({
    /* failure metrics */
    success: false,
  });
}
```

### 2. Use Appropriate Operation Types

Choose the correct operation type for accurate tracking:

- Infrastructure checks → `INFRASTRUCTURE_AUDIT`
- Kiro analysis → `META_MONITOR`
- Code fixes → `IMPLEMENTATION_SUPPORT`
- Communication → `KIRO_BRIDGE`
- Critical ops → `EMERGENCY_OPERATION`

### 3. Track Costs Accurately

Calculate costs based on actual token usage:

```typescript
const cost = (inputTokens * INPUT_COST + outputTokens * OUTPUT_COST) / 1000;
```

### 4. Monitor Regularly

Review metrics daily:

- Check success rates
- Monitor latency trends
- Track cost patterns
- Identify anomalies

## API Reference

### `recordSupportModeOperation(metrics: SupportModeMetrics)`

Records a support mode operation with full metrics.

**Parameters**:

- `operationType`: Type of operation (enum)
- `routePath`: Routing path used
- `latencyMs`: Operation duration in milliseconds
- `success`: Operation success status
- `costUsd`: Operation cost in USD
- `timestamp`: Operation timestamp

**Returns**: `void`

### `getSupportModeMetricsSummary()`

Returns aggregated metrics summary.

**Returns**:

```typescript
{
  totalOperations: number;
  operationsByType: Record<string, number>;
  operationsByPath: Record<string, number>;
  averageLatencyMs: number;
  successRate: number;
  totalCostUsd: number;
}
```

## Support

For issues or questions:

- Check logs: `[HybridRoutingMetricsPublisher]` prefix
- Review CloudWatch metrics
- Consult full documentation: `support-mode-metrics-implementation-completion-report.md`

---

**Quick Reference Version**: 1.0.0  
**Last Updated**: 2025-01-14  
**Status**: ✅ Production-Ready
