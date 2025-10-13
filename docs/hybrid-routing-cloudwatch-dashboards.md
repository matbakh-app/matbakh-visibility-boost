# Hybrid Routing CloudWatch Dashboards

**Status**: ✅ PRODUCTION-READY  
**Last Updated**: 2025-01-14  
**Task**: Task 6.2 - Extend CloudWatch dashboards for hybrid routing

## Overview

This document describes the CloudWatch dashboard extensions for monitoring the Bedrock Support Manager hybrid routing architecture. The dashboards provide comprehensive visibility into routing performance, health status, and operational metrics across both direct Bedrock and MCP routing paths.

## Architecture

### Components

1. **HybridRoutingMonitoringStack** - CDK stack for CloudWatch dashboards and alarms
2. **HybridRoutingMetricsPublisher** - Service for publishing metrics to CloudWatch
3. **HybridRoutingPerformanceMonitor** - Performance monitoring and metrics collection
4. **HybridHealthMonitor** - Health status monitoring for routing paths

### Metrics Namespace

All hybrid routing metrics are published under the namespace:

```
Matbakh/HybridRouting
```

## Dashboard Sections

### 1. Overview Section

**Purpose**: High-level system status and quick links

**Widgets**:

- System overview text widget with architecture description
- Direct Bedrock path health status
- MCP path health status
- Overall routing efficiency

**Key Metrics**:

- `DirectBedrockHealthStatus` - Binary health indicator (0/1)
- `MCPHealthStatus` - Binary health indicator (0/1)
- `RoutingEfficiency` - Overall routing efficiency percentage

### 2. Routing Path Metrics

**Purpose**: Track request distribution and success rates across routing paths

**Widgets**:

- Request distribution by routing path (line graph)
- Success rate by routing path (line graph)

**Key Metrics**:

- `DirectBedrockRequests` - Count of direct Bedrock requests
- `MCPRequests` - Count of MCP path requests
- `FallbackRequests` - Count of fallback requests
- `DirectBedrockSuccessRate` - Success rate percentage
- `MCPSuccessRate` - Success rate percentage

### 3. Performance Metrics

**Purpose**: Monitor latency and performance across routing paths

**Widgets**:

- P95 latency by routing path
- Average latency comparison
- P99 latency by path

**Key Metrics**:

- `DirectBedrockP95Latency` - P95 latency in milliseconds
- `MCPP95Latency` - P95 latency in milliseconds
- `DirectBedrockAvgLatency` - Average latency in milliseconds
- `MCPAvgLatency` - Average latency in milliseconds
- `DirectBedrockP99Latency` - P99 latency in milliseconds
- `MCPP99Latency` - P99 latency in milliseconds

### 4. Routing Efficiency Metrics

**Purpose**: Track routing decision quality and optimization

**Widgets**:

- Routing efficiency metrics over time
- Routing decision breakdown

**Key Metrics**:

- `OverallRoutingEfficiency` - Overall efficiency percentage
- `OptimalRoutingRate` - Percentage of optimal routing decisions
- `FallbackRate` - Percentage of fallback operations
- `EmergencyOperations` - Count of emergency operations
- `CriticalSupportOperations` - Count of critical support operations
- `StandardOperations` - Count of standard operations

### 5. Support Operations Metrics

**Purpose**: Monitor support mode operations and success rates

**Widgets**:

- Support mode operations count
- Support operation success rates

**Key Metrics**:

- `InfrastructureAudits` - Count of infrastructure audits
- `MetaMonitoringOperations` - Count of meta monitoring operations
- `ImplementationSupport` - Count of implementation support operations
- `InfrastructureAuditSuccessRate` - Success rate percentage
- `MetaMonitoringSuccessRate` - Success rate percentage
- `ImplementationSupportSuccessRate` - Success rate percentage

### 6. Health Monitoring Metrics

**Purpose**: Track health status and circuit breaker events

**Widgets**:

- Health check status over time
- Circuit breaker events

**Key Metrics**:

- `DirectBedrockHealthScore` - Health score (0-100)
- `MCPHealthScore` - Health score (0-100)
- `CircuitBreakerTrips` - Count of circuit breaker trips
- `CircuitBreakerRecoveries` - Count of circuit breaker recoveries

## Alarms

### Latency Alarms

#### Direct Bedrock P95 Latency

- **Threshold**: 10,000ms (10 seconds)
- **Evaluation**: 2 out of 2 datapoints
- **Action**: SNS notification

#### MCP P95 Latency

- **Threshold**: 30,000ms (30 seconds)
- **Evaluation**: 2 out of 2 datapoints
- **Action**: SNS notification

### Success Rate Alarms

#### Direct Bedrock Success Rate

- **Threshold**: 95%
- **Evaluation**: 2 out of 3 datapoints
- **Action**: SNS notification

#### MCP Success Rate

- **Threshold**: 95%
- **Evaluation**: 2 out of 3 datapoints
- **Action**: SNS notification

### Routing Efficiency Alarms

#### Overall Routing Efficiency

- **Threshold**: 80%
- **Evaluation**: 2 out of 3 datapoints
- **Action**: SNS notification

#### High Fallback Rate

- **Threshold**: 10%
- **Evaluation**: 2 out of 3 datapoints
- **Action**: SNS notification

### Cost Alarms

#### Hybrid Routing Budget

- **Production**: €200/month
- **Development/Staging**: €50/month
- **Alerts**: 50%, 80%, 100% (forecasted)

## Deployment

### CDK Stack Deployment

```bash
# Deploy to development
cdk deploy HybridRoutingMonitoringStack-dev \
  --context environment=development \
  --context alertEmail=ops@matbakh.app

# Deploy to staging
cdk deploy HybridRoutingMonitoringStack-staging \
  --context environment=staging \
  --context alertEmail=ops@matbakh.app

# Deploy to production
cdk deploy HybridRoutingMonitoringStack-prod \
  --context environment=production \
  --context alertEmail=ops@matbakh.app
```

### Metrics Publisher Integration

```typescript
import { HybridRoutingMetricsPublisher } from "./hybrid-routing-metrics-publisher";
import { HybridRoutingPerformanceMonitor } from "./hybrid-routing-performance-monitor";
import { HybridHealthMonitor } from "./hybrid-health-monitor";

// Initialize components
const performanceMonitor = new HybridRoutingPerformanceMonitor(
  router,
  healthMonitor,
  featureFlags
);

const metricsPublisher = new HybridRoutingMetricsPublisher(
  performanceMonitor,
  healthMonitor,
  {
    namespace: "Matbakh/HybridRouting",
    region: "eu-central-1",
    environment: "production",
    publishIntervalMs: 60000, // 1 minute
    enablePublishing: true,
  }
);

// Start monitoring and publishing
performanceMonitor.startMonitoring();
metricsPublisher.startPublishing();
```

## Monitoring Best Practices

### 1. Regular Review

- Review dashboards daily during initial rollout
- Weekly reviews during stable operation
- Monthly trend analysis for optimization

### 2. Alert Response

- **Critical Alarms**: Respond within 15 minutes
- **Warning Alarms**: Respond within 1 hour
- **Info Alarms**: Review during next business day

### 3. Metric Retention

- **Real-time metrics**: 1 hour retention
- **Aggregated metrics**: 15 days retention
- **Long-term trends**: 90 days retention

### 4. Dashboard Customization

- Add custom widgets for specific use cases
- Create environment-specific views
- Set up team-specific dashboards

## Troubleshooting

### High Latency

1. Check routing path health status
2. Review circuit breaker events
3. Analyze request distribution
4. Check AWS Bedrock service status

### Low Success Rate

1. Review error logs in CloudWatch Logs
2. Check circuit breaker status
3. Analyze fallback rate
4. Review health check results

### High Fallback Rate

1. Check primary path health
2. Review routing decision logic
3. Analyze performance metrics
4. Check for infrastructure issues

### Cost Overruns

1. Review request distribution
2. Analyze routing efficiency
3. Check for unnecessary operations
4. Optimize routing decisions

## Integration with Existing Monitoring

### Multi-Region Monitoring

The hybrid routing dashboards complement the existing multi-region monitoring:

- **Multi-Region Dashboard**: Infrastructure and failover metrics
- **Hybrid Routing Dashboard**: AI routing and performance metrics

### Performance Monitoring

Integration with existing performance monitoring:

- **P95 Latency Dashboard**: Overall system latency
- **Hybrid Routing Dashboard**: Routing-specific latency

### Cost Monitoring

Integration with existing cost monitoring:

- **Budget Alerts**: Overall infrastructure costs
- **Hybrid Routing Budget**: AI routing-specific costs

## Future Enhancements

### Planned Features

1. **Anomaly Detection**: ML-based anomaly detection for routing metrics
2. **Predictive Alerting**: Forecast-based alerting for proactive response
3. **Custom Metrics**: Additional metrics for specific use cases
4. **Dashboard Templates**: Pre-configured dashboard templates

### Optimization Opportunities

1. **Metric Aggregation**: Reduce metric granularity for cost optimization
2. **Smart Sampling**: Intelligent sampling for high-volume metrics
3. **Composite Alarms**: Multi-metric alarm conditions
4. **Auto-Remediation**: Automated response to common issues

## References

- [AWS CloudWatch Documentation](https://docs.aws.amazon.com/cloudwatch/)
- [CDK CloudWatch Construct Library](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_cloudwatch-readme.html)
- [Hybrid Routing Performance Monitor](./hybrid-routing-performance-monitoring-quick-reference.md)
- [Bedrock Support Manager Documentation](./bedrock-support-manager-implementation-completion-report.md)

## Status

- ✅ **CDK Stack**: Production-ready
- ✅ **Metrics Publisher**: Production-ready
- ✅ **Dashboard Widgets**: Complete
- ✅ **Alarms**: Configured
- ✅ **Documentation**: Complete
- ✅ **Tests**: Implemented

**Next Steps**: Deploy to staging environment for validation
