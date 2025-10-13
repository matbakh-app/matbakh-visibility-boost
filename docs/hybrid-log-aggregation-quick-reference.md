# Hybrid Log Aggregation - Quick Reference Guide

**Version:** 1.0.0  
**Last Updated:** 2025-01-14  
**Status:** ✅ Production-Ready

---

## 🚀 Quick Start

### Basic Setup

```typescript
import {
  HybridLogAggregator,
  LogSource,
  LogLevel,
} from "./logging/hybrid-log-aggregator";

const aggregator = new HybridLogAggregator({
  region: "eu-central-1",
  environment: "production",
  logGroupName: "/aws/lambda/hybrid-routing",
  retentionDays: 30,
  enableRealTimeStreaming: true,
  batchSize: 100,
  flushInterval: 5000,
  enableStructuredLogging: true,
  enableCorrelationTracking: true,
  logSources: [LogSource.HYBRID_ROUTER, LogSource.BEDROCK_CLIENT],
  logLevel: LogLevel.INFO,
});

await aggregator.initialize();
```

---

## 📝 Common Operations

### 1. Basic Logging

```typescript
// Info logging
await aggregator.info(LogSource.HYBRID_ROUTER, "Routing decision made", {
  provider: "bedrock",
});

// Error logging
await aggregator.error(LogSource.BEDROCK_CLIENT, "API call failed", error, {
  endpoint: "/api/chat",
});

// Critical logging (auto-flushes)
await aggregator.critical(
  LogSource.CIRCUIT_BREAKER,
  "Circuit breaker opened",
  error
);
```

### 2. Performance Logging

```typescript
await aggregator.logPerformance(
  LogSource.PERFORMANCE_MONITOR,
  "api-call",
  150, // duration in ms
  { endpoint: "/api/chat", statusCode: 200 }
);
```

### 3. Routing Logging

```typescript
await aggregator.logRouting(
  LogSource.HYBRID_ROUTER,
  "bedrock", // provider
  false, // fallback
  "primary-route", // reason
  { model: "claude-3" }
);
```

### 4. Correlation Tracking

```typescript
// Create context
const correlationId = aggregator.createCorrelationContext(
  "req-123",
  "user-456",
  "session-789"
);

// Use in logs
await aggregator.info(
  LogSource.HYBRID_ROUTER,
  "Processing request",
  { action: "route" },
  correlationId
);

// Clean up
aggregator.removeCorrelationContext(correlationId);
```

---

## 🎯 Log Sources

| Source                | Description               | Use Case                        |
| --------------------- | ------------------------- | ------------------------------- |
| `HYBRID_ROUTER`       | Hybrid routing decisions  | Route selection, fallback logic |
| `BEDROCK_CLIENT`      | Direct Bedrock operations | API calls, responses            |
| `SUPPORT_MANAGER`     | Support mode operations   | Support requests, responses     |
| `PERFORMANCE_MONITOR` | Performance metrics       | Latency, throughput             |
| `ALERT_SYSTEM`        | Alert notifications       | Alerts, warnings                |
| `CACHE_LAYER`         | Cache operations          | Cache hits, misses              |
| `CIRCUIT_BREAKER`     | Circuit breaker events    | State changes, failures         |
| `METRICS_PUBLISHER`   | Metrics publishing        | CloudWatch metrics              |

---

## 📊 Log Levels

| Level      | Priority | Use Case            | Auto-Flush |
| ---------- | -------- | ------------------- | ---------- |
| `DEBUG`    | 1        | Detailed debugging  | No         |
| `INFO`     | 2        | General information | No         |
| `WARN`     | 3        | Warning messages    | No         |
| `ERROR`    | 4        | Error conditions    | No         |
| `CRITICAL` | 5        | Critical failures   | Yes        |

---

## 🔧 Configuration Options

### Environment-Specific Configs

```typescript
// Development
const devConfig = {
  region: "eu-central-1",
  environment: "development",
  logGroupName: "/aws/lambda/hybrid-routing-dev",
  retentionDays: 7,
  logLevel: LogLevel.DEBUG,
  batchSize: 50,
  flushInterval: 2000,
};

// Staging
const stagingConfig = {
  region: "eu-central-1",
  environment: "staging",
  logGroupName: "/aws/lambda/hybrid-routing-staging",
  retentionDays: 14,
  logLevel: LogLevel.INFO,
  batchSize: 75,
  flushInterval: 3000,
};

// Production
const prodConfig = {
  region: "eu-central-1",
  environment: "production",
  logGroupName: "/aws/lambda/hybrid-routing",
  retentionDays: 30,
  logLevel: LogLevel.INFO,
  batchSize: 100,
  flushInterval: 5000,
};
```

---

## 📈 Monitoring & Statistics

### Get Statistics

```typescript
const stats = aggregator.getStats();

console.log(`Total Logs: ${stats.totalLogs}`);
console.log(`Error Rate: ${stats.errorRate}%`);
console.log(`Average Latency: ${stats.averageLatency}ms`);
console.log(`Buffer Utilization: ${stats.bufferUtilization}%`);
console.log(`Last Flush: ${stats.lastFlushTime}`);

// Logs by level
console.log(`DEBUG: ${stats.logsByLevel.DEBUG}`);
console.log(`INFO: ${stats.logsByLevel.INFO}`);
console.log(`WARN: ${stats.logsByLevel.WARN}`);
console.log(`ERROR: ${stats.logsByLevel.ERROR}`);
console.log(`CRITICAL: ${stats.logsByLevel.CRITICAL}`);

// Logs by source
console.log(`Hybrid Router: ${stats.logsBySource.HYBRID_ROUTER}`);
console.log(`Bedrock Client: ${stats.logsBySource.BEDROCK_CLIENT}`);
```

---

## 🎛️ Management Operations

### Manual Flush

```typescript
// Flush all buffered logs immediately
await aggregator.flush();
```

### Update Retention Policy

```typescript
// Change retention to 60 days
await aggregator.updateRetentionPolicy(60);
```

### Configure Log Sources

```typescript
// Disable specific log source
aggregator.configureLogSource(LogSource.DEBUG_LOGS, false);

// Enable log source
aggregator.configureLogSource(LogSource.PERFORMANCE_MONITOR, true);
```

### Graceful Shutdown

```typescript
// Flush remaining logs and cleanup
await aggregator.shutdown();
```

---

## 🔍 Advanced: Log Stream Manager

### Create Custom Stream

```typescript
import {
  LogStreamManager,
  StreamDestination,
} from "./logging/log-stream-manager";

const manager = new LogStreamManager();
manager.start();

manager.createStream({
  streamId: "production-errors",
  name: "Production Error Logs",
  enabled: true,
  destinations: [
    {
      type: StreamDestination.CLOUDWATCH,
      enabled: true,
      config: { logGroupName: "/aws/lambda/errors" },
      filters: ["error-filter"],
      batchSize: 100,
      flushInterval: 5000,
    },
  ],
  filters: [
    {
      id: "error-filter",
      name: "Errors Only",
      enabled: true,
      conditions: {
        levels: [LogLevel.ERROR, LogLevel.CRITICAL],
      },
    },
  ],
  realTimeEnabled: true,
  bufferSize: 1000,
  compressionEnabled: true,
});
```

### Add Filters

```typescript
manager.addFilter("production-errors", {
  id: "bedrock-errors",
  name: "Bedrock Errors",
  enabled: true,
  conditions: {
    sources: [LogSource.BEDROCK_CLIENT],
    levels: [LogLevel.ERROR],
  },
});
```

### Query Logs

```typescript
const logs = manager.queryLogs({
  id: "query-1",
  name: "Last Hour Errors",
  enabled: true,
  conditions: {
    levels: [LogLevel.ERROR, LogLevel.CRITICAL],
    timeRange: {
      start: new Date(Date.now() - 3600000),
      end: new Date(),
    },
  },
});
```

---

## 🚨 Troubleshooting

### Issue: Logs Not Appearing in CloudWatch

**Solution:**

1. Check AWS credentials and permissions
2. Verify log group exists: `aws logs describe-log-groups --log-group-name-prefix /aws/lambda/hybrid-routing`
3. Check initialization: `await aggregator.initialize()`
4. Verify log level filtering

### Issue: High Memory Usage

**Solution:**

1. Reduce batch size: `batchSize: 50`
2. Decrease flush interval: `flushInterval: 2000`
3. Disable unnecessary log sources
4. Check for memory leaks in correlation contexts

### Issue: Slow Performance

**Solution:**

1. Increase batch size: `batchSize: 200`
2. Disable structured logging if not needed
3. Use async logging (already default)
4. Check CloudWatch API rate limits

### Issue: Missing Correlation Data

**Solution:**

1. Ensure correlation context is created before logging
2. Pass correlation ID to all log calls
3. Clean up contexts after use
4. Check correlation context map size

---

## 📚 Best Practices

### 1. Correlation Tracking

```typescript
// ✅ Good: Create context at request start
const correlationId = aggregator.createCorrelationContext(requestId, userId);

try {
  // Use correlation ID in all logs
  await aggregator.info(source, "Processing", {}, correlationId);
} finally {
  // Always clean up
  aggregator.removeCorrelationContext(correlationId);
}
```

### 2. Error Logging

```typescript
// ✅ Good: Include error object and context
try {
  await riskyOperation();
} catch (error) {
  await aggregator.error(LogSource.HYBRID_ROUTER, "Operation failed", error, {
    operation: "riskyOperation",
    retries: 3,
  });
}
```

### 3. Performance Logging

```typescript
// ✅ Good: Track operation duration
const startTime = Date.now();
await operation();
const duration = Date.now() - startTime;

await aggregator.logPerformance(
  LogSource.PERFORMANCE_MONITOR,
  "operation",
  duration,
  { success: true }
);
```

### 4. Structured Metadata

```typescript
// ✅ Good: Use structured metadata
await aggregator.info(LogSource.HYBRID_ROUTER, "Routing decision", {
  provider: "bedrock",
  model: "claude-3",
  region: "eu-central-1",
  fallback: false,
  latency: 150,
});
```

---

## 🔗 Related Documentation

- [Bedrock Activation Task 6.2.4 Completion Report](./bedrock-activation-task-6.2.4-log-aggregation-completion-report.md)
- [Hybrid Routing Performance Monitoring](./hybrid-routing-performance-monitoring-quick-reference.md)
- [CloudWatch Dashboards](./hybrid-routing-cloudwatch-quick-reference.md)
- [Alert System](./alert-testing-framework-quick-reference.md)

---

## 📞 Support

For issues or questions:

- Check troubleshooting section above
- Review test files for usage examples
- Consult completion report for detailed documentation
- Contact DevOps team for CloudWatch access issues

---

**Last Updated:** 2025-01-14  
**Version:** 1.0.0  
**Status:** ✅ Production-Ready
