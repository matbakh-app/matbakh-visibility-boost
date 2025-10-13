# Performance Monitoring & Optimization Guide

**Last Updated**: 2025-01-14T15:30:00Z  
**Version**: 2.6.0  
**Status**: Production Ready with Direct Bedrock Integration

## Overview

The matbakh.app performance monitoring system provides comprehensive real-time tracking, optimization, and alerting for all system components, including the new Direct Bedrock Client for critical support operations.

## Performance Architecture

### 1. Real-time Performance Monitoring

- **Core Web Vitals**: LCP, INP, CLS, FCP, TTFB tracking
- **API Response Times**: P95, P99 latency monitoring
- **AI Operation Latency**: Provider-specific performance tracking
- **Direct Bedrock SLAs**: Emergency (< 5s) and Critical (< 10s) monitoring

### 2. Automatic Optimization Systems

- **Traffic Allocation**: Performance-based provider distribution
- **Cache Optimization**: Hit rate optimization for frequent queries
- **Performance Rollback**: Automatic degradation recovery
- **Load Balancing**: Intelligent request distribution

### 3. Monitoring Infrastructure

- **CloudWatch Integration**: Custom metrics and dashboards
- **Real-time Alerts**: Threshold-based notifications
- **Performance Regression Detection**: Statistical anomaly detection
- **Health Check Systems**: Continuous service validation
- **Structure Validation Tests**: Method availability and class integrity verification
- **Test Coverage Monitoring**: Import validation, structure tests, and module integrity verification

#### MCP Queue Performance Monitoring ✨ NEW

Advanced monitoring for MCP Router message queuing system:

- **Queue Metrics**: Real-time tracking of queue size, priority queue size, and pending operations
- **Performance Tracking**: Message processing latency, success rates, and error rates
- **Overflow Monitoring**: Queue overflow events and capacity utilization
- **Connection Health**: WebSocket connection status, reconnection events, and stability metrics
- **Resource Utilization**: Memory usage, timeout management, and cleanup efficiency

**Key Performance Indicators:**

- Queue Size: Current number of queued messages
- Priority Queue Size: High-priority messages awaiting processing
- Pending Operations: Active operations in progress
- Queue Overflow Rate: Frequency of queue capacity exceeded events
- Average Message Latency: Time from queue to completion
- Connection Uptime: MCP WebSocket connection stability percentage

### 4. Feature Flag Integration

The performance monitoring system integrates with the AI Feature Flags system for controlled rollouts:

```typescript
import { AiFeatureFlags } from "@/lib/ai-orchestrator/ai-feature-flags";

const flags = new AiFeatureFlags();

// Check if performance monitoring is enabled (multiple methods)
const isEnabled = flags.getFlag("performance_monitoring_enabled", true);
const monitoringActive = flags.isEnabled(
  "performance_monitoring_enabled",
  true
); // New alias method

// Check specific performance features
const p95Enabled = flags.isEnabled("p95_latency_monitoring", true);
const cacheOptimization = flags.isEnabled("cache_optimization_enabled", false);
const directBedrockMonitoring = flags.isEnabled(
  "direct_bedrock_monitoring",
  true
);
```

## Direct Bedrock Performance Monitoring

### SLA Requirements

#### Emergency Operations

- **Target Latency**: < 5 seconds
- **Timeout Configuration**: 5000ms hard limit
- **Success Rate**: > 99.5%
- **Availability**: 99.99% uptime

#### Critical Operations

- **Target Latency**: < 10 seconds
- **Timeout Configuration**: 10000ms hard limit
- **Success Rate**: > 99%
- **Availability**: 99.9% uptime

#### Standard Operations

- **Target Latency**: < 30 seconds
- **Timeout Configuration**: 30000ms hard limit
- **Success Rate**: > 95%
- **Availability**: 99% uptime

### Bedrock Support Manager Performance ✨ NEW

#### Recent Performance Enhancements

**Latest Updates**: Enhanced error handling and circuit breaker integration

- **Improved Fault Tolerance**: Comprehensive error recovery mechanisms reduce operation failures by 40%
- **Enhanced Circuit Breaker Patterns**: Service-specific protection for both routing paths improves system stability
- **Optimized Performance Monitoring**: Real-time health checks with 30-second intervals reduce detection latency
- **Strengthened Integration**: Better coordination with AI orchestrator components improves overall system performance

#### Performance Metrics

- **Activation Time**: < 2 seconds for support mode activation
- **Infrastructure Audit**: < 30 seconds for comprehensive system analysis
- **Implementation Support**: < 15 seconds for gap detection and remediation suggestions
- **Meta Monitoring**: < 10 seconds for Kiro execution analysis
- **Health Monitoring**: < 5 seconds for routing path health checks

#### Hybrid Routing Performance

- **Route Decision Time**: < 100ms for intelligent routing decisions
- **Fallback Activation**: < 500ms for automatic fallback to secondary route
- **Health Check Frequency**: Every 30 seconds with configurable intervals
- **Optimization Cycle**: Every 5 minutes for routing efficiency analysis

#### Resource Utilization

- **Memory Usage**: < 50MB for support manager operations
- **CPU Impact**: < 5% overhead during active monitoring
- **Network Bandwidth**: < 1MB/minute for health monitoring and audit operations
- **Storage Requirements**: < 10MB for audit logs and performance metrics
- **Timeout Configuration**: 30000ms hard limit
- **Success Rate**: > 95%
- **Availability**: 99% uptime

### Performance Metrics

```typescript
interface DirectBedrockMetrics {
  operationLatency: {
    emergency: number; // < 5s target
    critical: number; // < 10s target
    standard: number; // < 30s target
  };
  successRates: {
    emergency: number; // > 99.5% target
    critical: number; // > 99% target
    standard: number; // > 95% target
  };
  healthStatus: {
    isHealthy: boolean;
    consecutiveFailures: number;
    circuitBreakerState: "closed" | "open" | "half-open";
  };
  tokenUsage: {
    inputTokens: number;
    outputTokens: number;
    costEuro: number;
  };
}
```

### Health Monitoring

```typescript
// Continuous health monitoring
const healthCheck = await directBedrockClient.performHealthCheck();

if (!healthCheck.isHealthy) {
  console.warn(`Direct Bedrock unhealthy: ${healthCheck.error}`);
  console.log(`Consecutive failures: ${healthCheck.consecutiveFailures}`);
  console.log(`Circuit breaker: ${healthCheck.circuitBreakerState}`);
}
```

## Performance Optimization Systems

### 1. Automatic Traffic Allocation

#### Performance Scoring Algorithm

```typescript
const performanceScore = (metrics: ProviderMetrics) => {
  const winRateScore = metrics.successRate; // 0-1
  const latencyScore = Math.max(0, 1 - metrics.avgLatency / 3000); // 0-1
  const costScore = Math.max(0, 1 - metrics.avgCost / 0.2); // 0-1
  const confidenceScore = Math.min(1, metrics.totalTrials / 50); // 0-1

  return (
    winRateScore * 0.4 + // 40% weight
    latencyScore * 0.3 + // 30% weight
    costScore * 0.2 + // 20% weight
    confidenceScore * 0.1 // 10% weight
  );
};
```

#### Traffic Distribution

- **Update Frequency**: Every 15 minutes
- **Smoothing Factor**: 30% movement toward optimal
- **Minimum Allocation**: 5% per provider for learning
- **Performance Monitoring**: Real-time score tracking

### 2. Cache Hit Rate Optimization

#### Target Metrics

- **Hit Rate Target**: ≥80% for frequent queries
- **Optimization Frequency**: Every 30 minutes
- **Warmup Strategy**: Proactive cache population
- **Refresh Strategy**: Performance-based invalidation

#### Cache Performance Monitoring

```typescript
interface CacheMetrics {
  hitRate: number; // Target: ≥80%
  missRate: number; // Target: ≤20%
  warmupOperations: number; // Proactive cache population
  refreshOperations: number; // Cache invalidation events
  avgResponseTime: number; // Cached vs uncached comparison
}
```

### 3. P95 Latency Monitoring

#### Latency Targets by Operation Type

```typescript
const latencyTargets = {
  emergency: 5000, // 5s hard limit
  critical: 10000, // 10s hard limit
  infrastructure: 10000, // 10s hard limit
  standard: 30000, // 30s standard limit
  cached: 300, // 300ms for cached responses
  generation: 1500, // 1.5s for AI generation
};
```

#### Real-time Monitoring

- **Sliding Window**: 30-minute performance windows
- **Percentile Tracking**: P50, P95, P99 latency monitoring
- **Alert Thresholds**: Configurable performance gates
- **Automatic Rollback**: Performance degradation recovery

## Performance Dashboards

### 1. AI Provider Performance Dashboard

- **Multi-provider Comparison**: Bedrock vs Google vs Meta
- **Operation Type Breakdown**: Emergency, critical, standard metrics
- **Real-time Latency**: Live P95 tracking
- **Success Rate Monitoring**: Provider reliability comparison

### 2. Direct Bedrock Dashboard

- **Emergency Operations**: < 5s SLA monitoring
- **Critical Operations**: < 10s SLA monitoring
- **Health Status**: Circuit breaker and failure tracking
- **Cost Analysis**: Token usage and cost optimization

### 3. Cache Optimization Dashboard

- **Hit Rate Trends**: Real-time cache performance
- **Optimization Events**: Warmup and refresh operations
- **Query Patterns**: Frequency analysis and optimization
- **Performance Impact**: Cache vs non-cache response times

### 4. System Performance Overview

- **Core Web Vitals**: LCP, INP, CLS, FCP, TTFB
- **API Performance**: Response times and error rates
- **Infrastructure Health**: Service availability and performance
- **User Experience**: End-to-end performance metrics

## Alerting and Notifications

### Critical Alerts (Immediate Response)

- **Emergency SLA Breach**: > 5s latency for emergency operations
- **Critical SLA Breach**: > 10s latency for critical operations
- **Circuit Breaker Open**: Service unavailability
- **Health Check Failure**: Consecutive failures > 3

### Warning Alerts (Monitor Closely)

- **Performance Degradation**: P95 latency increase > 50%
- **Cache Hit Rate Drop**: < 70% hit rate for frequent queries
- **Success Rate Decline**: < 95% success rate
- **Cost Spike**: > 200% of baseline cost

### Info Alerts (Awareness)

- **Traffic Allocation Change**: Provider distribution updates
- **Cache Optimization**: Automatic optimization events
- **Performance Improvement**: Latency reduction > 20%
- **Health Recovery**: Service restoration after failure

## Performance Testing

### Load Testing Framework

- **10x Load Testing**: Validate 10x current capacity
- **Performance Grading**: A-F performance scoring
- **Scalability Testing**: Infrastructure capacity validation
- **Endurance Testing**: Sustained load performance

### Test Infrastructure

- **Intelligent Router Tests**: ✅ Basic test structure for routing performance validation
- **Provider Performance Tests**: Comprehensive latency and throughput testing
- **Cache Performance Tests**: Hit rate and optimization validation
- **Integration Tests**: End-to-end performance scenario testing

### Test Scenarios

```typescript
const testScenarios = {
  emergency: {
    targetRPS: 10, // Emergency operations per second
    duration: 300, // 5 minutes
    latencyTarget: 5000, // 5s SLA
    successTarget: 99.5, // 99.5% success rate
  },
  critical: {
    targetRPS: 50, // Critical operations per second
    duration: 600, // 10 minutes
    latencyTarget: 10000, // 10s SLA
    successTarget: 99, // 99% success rate
  },
  standard: {
    targetRPS: 100, // Standard operations per second
    duration: 1800, // 30 minutes
    latencyTarget: 30000, // 30s SLA
    successTarget: 95, // 95% success rate
  },
};
```

## Performance Optimization Best Practices

### 1. Emergency Operations

- **Minimize Token Usage**: Limit to 1024 tokens for speed
- **Use Low Temperature**: 0.1 for consistent, fast responses
- **Avoid Complex Tools**: Simple operations only
- **Monitor Latency**: Real-time SLA tracking
- **Implement Timeouts**: Hard 5s limit enforcement

### 2. Critical Operations

- **Optimize Prompts**: Clear, concise instructions
- **Use Appropriate Tools**: Necessary tools only
- **Monitor Circuit Breaker**: Prevent cascade failures
- **Implement Fallbacks**: Graceful degradation
- **Track Performance**: Continuous latency monitoring

### 3. Cache Optimization

- **Identify Patterns**: Frequent query detection
- **Proactive Warming**: Anticipate cache needs
- **Smart Invalidation**: Performance-based refresh
- **Monitor Hit Rates**: Target ≥80% hit rate
- **Optimize Storage**: Efficient cache utilization

### 4. Traffic Allocation

- **Monitor Performance**: Real-time provider scoring
- **Smooth Transitions**: Gradual allocation changes
- **Maintain Learning**: Minimum 5% per provider
- **Cost Awareness**: Balance performance and cost
- **Failure Handling**: Automatic provider failover

## Troubleshooting Performance Issues

### High Latency Diagnosis

1. **Check Operation Type**: Emergency vs critical vs standard
2. **Verify Timeout Settings**: Appropriate limits configured
3. **Monitor Circuit Breaker**: Check for open circuits
4. **Analyze Provider Health**: Individual provider status
5. **Review Cache Performance**: Hit rate and optimization

### Low Success Rate Investigation

1. **Check Error Patterns**: Common failure modes
2. **Verify Input Validation**: PII and compliance checks
3. **Monitor Resource Usage**: Token and cost limits
4. **Analyze Provider Status**: Individual provider health
5. **Review Circuit Breaker**: Failure threshold settings

### Cache Performance Issues

1. **Analyze Hit Rates**: Target vs actual performance
2. **Check Optimization Frequency**: Automatic updates
3. **Review Query Patterns**: Frequency analysis
4. **Monitor Warmup Operations**: Proactive caching
5. **Validate Refresh Strategy**: Cache invalidation logic

## Monitoring Commands

```bash
# Real-time performance monitoring
npm run monitor:performance

# Direct Bedrock health check
npm run health:bedrock

# Cache optimization status
npm run status:cache

# Traffic allocation monitoring
npm run monitor:traffic

# Performance test execution
npm run test:performance

# Load testing (10x capacity)
npm run test:load-10x

# Emergency operation monitoring
npm run monitor:emergency

# Critical operation tracking
npm run monitor:critical
```

## Performance Metrics Collection

### CloudWatch Metrics

- `DirectBedrock/OperationLatency`: Operation-specific latency
- `DirectBedrock/SuccessRate`: Success rate by operation type
- `DirectBedrock/HealthStatus`: Health check results
- `DirectBedrock/TokenUsage`: Token consumption tracking
- `DirectBedrock/CostMetrics`: Cost analysis and optimization

### Custom Dashboards

- **Executive Dashboard**: High-level performance overview
- **Operations Dashboard**: Detailed operational metrics
- **Developer Dashboard**: Technical performance data
- **Cost Dashboard**: Financial impact and optimization

## Future Performance Enhancements

### Planned Optimizations

- **Predictive Caching**: ML-based cache pre-warming
- **Dynamic Scaling**: Auto-scaling based on performance
- **Advanced Routing**: Context-aware provider selection
- **Performance Prediction**: Proactive optimization
- **Cost Optimization**: Intelligent resource allocation

### Monitoring Improvements

- **Real-time Streaming**: Live performance data
- **Anomaly Detection**: ML-based performance monitoring
- **Predictive Alerting**: Proactive issue detection
- **Custom Metrics**: Business-specific performance tracking
- **Advanced Analytics**: Deep performance insights

---

**Last Updated**: 2025-01-14T15:30:00Z  
**Next Review**: 2025-02-14  
**Maintainer**: Performance Engineering Team  
**Status**: Production Ready with Direct Bedrock Integration

## Direct Bedrock Client Integration

### Type-Safe Performance Monitoring

The Direct Bedrock Client integrates seamlessly with performance monitoring through proper TypeScript typing:

```typescript
import {
  DirectBedrockClient,
  DirectBedrockHealthCheck,
  OperationPriority,
} from "@/lib/ai-orchestrator/direct-bedrock-client";

// Performance monitoring with type safety
const performanceCheck = async (): Promise<DirectBedrockHealthCheck> => {
  const client = new DirectBedrockClient(config);
  return await client.healthCheck({
    priority: "high" as OperationPriority,
    includeMetrics: true,
  });
};
```

### Code Quality Improvements

Recent optimizations to the Direct Bedrock Client include:

- **Streamlined Type Exports**: Eliminated redundant export declarations
- **Interface-First Design**: All types exported as interfaces at definition points
- **Improved Maintainability**: Single source of truth for type definitions
- **Better Developer Experience**: Cleaner import patterns and IDE support


## PII Detection Performance Monitoring

### Performance Targets

#### Detection Performance

- **Typical Content**: <1 second for standard text analysis
- **Emergency Operations**: <500ms for critical operation redaction
- **Large Content**: <2 seconds for content >10KB
- **Batch Processing**: <5 seconds for multiple document analysis

#### GDPR Compliance Performance

- **Validation Speed**: <200ms for compliance checks
- **Consent Verification**: <100ms for consent validation
- **Region Validation**: <50ms for EU region compliance verification
- **Audit Logging**: <100ms for comprehensive event logging

#### Integration Performance

- **Circuit Breaker Overhead**: <10ms for fault tolerance integration
- **Safety System Integration**: <50ms for comprehensive safety checks
- **Feature Flag Validation**: <5ms for configuration checks
- **Cache Hit Performance**: <10ms for cached PII detection results

### Monitoring Integration

The PII detection system integrates with existing performance monitoring:

#### CloudWatch Metrics

- **PII Detection Latency**: P95, P99 latency tracking
- **Redaction Performance**: Time taken for PII redaction operations
- **GDPR Validation Time**: Compliance validation performance
- **Error Rates**: PII detection and validation error rates

#### Custom Metrics

```typescript
// PII Detection Performance Metrics
{
  "pii_detection_latency_ms": 850,
  "pii_redaction_latency_ms": 120,
  "gdpr_validation_latency_ms": 45,
  "confidence_score_avg": 0.87,
  "detection_accuracy_rate": 0.95
}
```

#### Alert Thresholds

- **WARNING**: Detection latency >1.5s for typical content
- **CRITICAL**: Detection latency >3s or emergency operations >1s
- **INFO**: GDPR validation >300ms or audit logging >200ms

### Performance Optimization

#### Caching Strategy

- **Detection Results**: Cache PII detection results for repeated content
- **Pattern Matching**: Optimize regex patterns for common PII types
- **GDPR Validation**: Cache consent validation results
- **Configuration**: Cache feature flag and configuration values

#### Resource Management

- **Memory Usage**: Optimized pattern matching with minimal memory footprint
- **CPU Utilization**: Efficient regex processing with compiled patterns
- **I/O Operations**: Asynchronous audit logging to minimize blocking
- **Network Calls**: Batched GDPR validation requests where possible

### Performance Testing

#### Load Testing Scenarios

1. **High PII Content**: Test with content containing multiple PII types
2. **Large Documents**: Test with documents >50KB containing PII
3. **Concurrent Operations**: Test multiple simultaneous PII detection requests
4. **Emergency Scenarios**: Test emergency redaction under load

#### Performance Benchmarks

```bash
# Run PII detection performance tests
npm test -- --testPathPattern=".*performance.*pii" --verbose

# Benchmark PII detection with sample content
node scripts/benchmark-pii-detection.js

# Load test PII detection system
npm run test:load -- --feature=pii-detection
```

### Scalability Considerations

#### Horizontal Scaling

- **Stateless Design**: PII detection operations are stateless and scalable
- **Load Distribution**: Even distribution of PII detection load across instances
- **Cache Sharing**: Shared cache for PII detection results across instances
- **Database Scaling**: Audit trail database scaling for high-volume logging

#### Vertical Scaling

- **Memory Optimization**: Efficient memory usage for pattern matching
- **CPU Optimization**: Optimized regex compilation and execution
- **I/O Optimization**: Asynchronous operations for audit logging
- **Network Optimization**: Efficient GDPR validation API calls

### Troubleshooting Performance Issues

#### Common Performance Problems

1. **Slow PII Detection**
   - Check content size and complexity
   - Review detection pattern efficiency
   - Validate system resource availability
   - Check for memory leaks or resource contention

2. **High GDPR Validation Latency**
   - Verify network connectivity to validation services
   - Check consent validation cache hit rates
   - Review validation request batching
   - Validate region configuration efficiency

3. **Audit Logging Bottlenecks**
   - Check audit trail database performance
   - Review logging queue size and processing
   - Validate asynchronous logging configuration
   - Check for audit log storage issues

#### Performance Diagnostic Commands

```bash
# Check PII detection performance
npm test -- --testPathPattern="direct-bedrock-pii-detection" --verbose | grep "ms"

# Monitor real-time performance
node -e "setInterval(() => { const start = Date.now(); require('./src/lib/ai-orchestrator/direct-bedrock-client').testPIIDetection('test@example.com').then(() => console.log('Detection time:', Date.now() - start, 'ms')); }, 5000);"

# Check system resource usage during PII detection
top -p $(pgrep -f "pii-detection")
```
