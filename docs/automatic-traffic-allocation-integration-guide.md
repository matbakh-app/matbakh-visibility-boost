# Automatic Traffic Allocation - Integration Guide

**Version:** v2.3.0  
**Date:** 2025-01-14  
**Status:** ✅ **PRODUCTION-READY**

## 🎯 Overview

The Automatic Traffic Allocation system provides fully autonomous traffic distribution between AI providers (Bedrock, Google, Meta) based on real-time performance data. No manual intervention is required - the system continuously optimizes traffic allocation every 15 minutes.

## 🏗️ Architecture

### Core Components

```typescript
// Main orchestration system
ActiveOptimizationSystem
├── TrafficAllocationEngine     // Core allocation logic
├── PerformanceScorer          // Composite performance scoring
├── AllocationSmoother         // Gradual transition management
└── EventLogger               // Comprehensive event tracking

// Integration points
├── BanditOptimizer           // Thompson Sampling integration
├── EvidentlyExperimentManager // A/B testing fallback
└── FeatureFlags             // Runtime configuration
```

### Performance Scoring Algorithm

```typescript
const performanceScore =
  winRateScore * 0.4 + // 40% - Success rate
  latencyScore * 0.3 + // 30% - Response time (normalized)
  costScore * 0.2 + // 20% - Cost efficiency (normalized)
  confidenceScore * 0.1; // 10% - Statistical confidence
```

## 🚀 Quick Start

### Basic Usage

```typescript
import { initializeOptimizationSystem } from "@/lib/ai-orchestrator/active-optimization-system";

// Initialize with automatic traffic allocation
const system = await initializeOptimizationSystem({
  autoTrafficAllocationEnabled: true,
  trafficAllocationInterval: 15, // minutes
});

// Get provider with automatic allocation
const result = await system.getOptimalProvider({
  userId: "user-123",
  domain: "legal",
});

console.log(result);
// {
//   provider: "bedrock",
//   source: "traffic_allocation",
//   confidence: 0.86,
//   allocationProbability: 0.45
// }
```

### Configuration Options

```typescript
interface OptimizationSystemConfig {
  autoTrafficAllocationEnabled: boolean; // Enable/disable automatic allocation
  trafficAllocationInterval: number; // Update frequency in minutes (default: 15)
  performanceThresholds: {
    minWinRate: number; // Minimum acceptable win rate (default: 0.7)
    maxLatency: number; // Maximum acceptable latency in ms (default: 2000)
    maxCost: number; // Maximum acceptable cost in euro (default: 0.1)
  };
}
```

## 📊 Monitoring & Observability

### Real-time Metrics

```typescript
// Get current traffic allocation
const allocation = system.getCurrentTrafficAllocation();
console.log(allocation);
// { bedrock: 0.45, google: 0.35, meta: 0.20 }

// Get system metrics
const metrics = system.getMetrics();
console.log(metrics.currentTrafficAllocation);
console.log(metrics.lastTrafficAllocation);

// Get allocation history
const events = system.getEventHistory();
const allocationEvents = events.filter(
  (e) => e.type === "traffic_allocation_updated"
);
```

### Event Logging

All allocation changes are automatically logged with detailed reasoning:

```typescript
{
  timestamp: "2025-01-14T10:30:00Z",
  type: "traffic_allocation_updated",
  details: {
    previousAllocation: { bedrock: 0.33, google: 0.33, meta: 0.34 },
    newAllocation: { bedrock: 0.45, google: 0.35, meta: 0.20 },
    armScores: { bedrock: 0.86, google: 0.72, meta: 0.58 },
    reason: "automatic_performance_optimization"
  },
  impact: "medium"
}
```

## 🎛️ Advanced Configuration

### Custom Performance Scoring

```typescript
// The system uses these default weights for performance scoring:
const defaultWeights = {
  winRate: 0.4, // 40% - Success rate importance
  latency: 0.3, // 30% - Response time importance
  cost: 0.2, // 20% - Cost efficiency importance
  confidence: 0.1, // 10% - Statistical confidence importance
};

// Normalization ranges:
const normalization = {
  maxLatency: 3000, // 3 seconds = 0 score
  maxCost: 0.2, // €0.2 = 0 score
  minTrials: 50, // 50 trials = full confidence
};
```

### Smoothing Configuration

```typescript
// Default smoothing prevents dramatic allocation changes
const smoothingFactor = 0.3; // 30% movement toward target per update

// Example: Current 40%, Target 70%
// Next allocation: 40% + (70% - 40%) * 0.3 = 49%
// Gradual transition over multiple updates
```

### Minimum Allocation Guarantee

```typescript
const minAllocation = 0.05; // 5% minimum per provider

// Ensures continuous learning and prevents complete provider exclusion
// Even poorly performing providers maintain minimum traffic for potential recovery
```

## 🔧 Integration Patterns

### With Experiments

```typescript
// Priority order: Experiments > Traffic Allocation > Bandit > Default
const result = await system.getOptimalProvider({
  experimentName: "model-comparison-test", // Takes priority if active
  userId: "user-123",
});

// If experiment is active: source = "experiment"
// If no experiment: source = "traffic_allocation"
```

### With Feature Flags

```typescript
// Runtime configuration via feature flags
system.updateConfig({
  autoTrafficAllocationEnabled: false, // Disable allocation
});

// Falls back to bandit optimization when disabled
```

### Manual Triggers

```typescript
// Force immediate allocation update
await system.forceTrafficAllocationUpdate();

// Useful for:
// - Testing allocation changes
// - Responding to performance incidents
// - Manual optimization triggers
```

## 🚨 Troubleshooting

### Common Issues

#### 1. No Allocation Updates

**Symptoms:** `lastTrafficAllocation` timestamp not updating

**Causes:**

- `autoTrafficAllocationEnabled: false`
- System not started
- Insufficient performance data

**Solutions:**

```typescript
// Check system status
const health = await system.getHealthStatus();
console.log(health.components.optimization);

// Force update
await system.forceTrafficAllocationUpdate();

// Check configuration
const config = system.getConfig();
console.log(config.autoTrafficAllocationEnabled);
```

#### 2. Unexpected Allocation Distribution

**Symptoms:** Provider allocation doesn't match expected performance

**Causes:**

- Insufficient trial data
- Smoothing factor preventing rapid changes
- Minimum allocation constraints

**Solutions:**

```typescript
// Check performance scores
const events = system.getEventHistory();
const lastAllocation = events.find(
  (e) => e.type === "traffic_allocation_updated"
);
console.log(lastAllocation.details.armScores);

// Check trial counts
const banditStats = system.getBanditStats();
console.log(banditStats);
```

#### 3. Performance Alerts

**Symptoms:** High latency or cost alerts

**Causes:**

- Provider performance degradation
- Increased traffic to slower provider

**Solutions:**

```typescript
// Monitor performance alerts
const events = system.getEventHistory();
const alerts = events.filter((e) => e.type === "performance_alert");
console.log(alerts);

// Adjust performance thresholds if needed
system.updateConfig({
  performanceThresholds: {
    maxLatency: 3000, // Increase if needed
    maxCost: 0.15, // Adjust based on budget
  },
});
```

## 📈 Performance Optimization

### Best Practices

1. **Monitor Allocation Frequency**

   ```typescript
   // Default 15 minutes is optimal for most use cases
   // Shorter intervals: More responsive but potentially unstable
   // Longer intervals: More stable but less responsive
   ```

2. **Adjust Smoothing Factor**

   ```typescript
   // Higher smoothing (0.5): Faster adaptation, more volatility
   // Lower smoothing (0.1): Slower adaptation, more stability
   // Default (0.3): Balanced approach
   ```

3. **Performance Threshold Tuning**
   ```typescript
   // Set realistic thresholds based on your use case
   performanceThresholds: {
     minWinRate: 0.7,    // 70% success rate minimum
     maxLatency: 2000,   // 2 second maximum response time
     maxCost: 0.1        // €0.10 maximum cost per request
   }
   ```

### Scaling Considerations

- **High Traffic:** System handles allocation updates efficiently
- **Multiple Contexts:** Allocation works across different user contexts
- **Provider Limits:** Respects minimum allocation to prevent provider starvation
- **Cost Control:** Automatically optimizes for cost-effectiveness

## 🔒 Security & Compliance

### Data Privacy

- No PII stored in allocation metrics
- Performance data aggregated and anonymized
- Event logs contain only system metrics

### Access Control

- Allocation updates require system-level permissions
- Manual triggers protected by admin access controls
- Configuration changes logged for audit trails

## 📚 API Reference

### Core Methods

```typescript
// Get optimal provider with traffic allocation
getOptimalProvider(context: ExperimentContext): Promise<ProviderResult>

// Force allocation update
forceTrafficAllocationUpdate(): Promise<void>

// Get current allocation state
getCurrentTrafficAllocation(): Record<Arm, number>

// Update system configuration
updateConfig(updates: Partial<OptimizationSystemConfig>): void

// Get system health status
getHealthStatus(): Promise<HealthStatus>
```

### Event Types

```typescript
type OptimizationEvent = {
  timestamp: Date;
  type:
    | "traffic_allocation_updated"
    | "performance_alert"
    | "auto_optimization";
  details: Record<string, any>;
  impact: "low" | "medium" | "high";
};
```

## 🎯 Success Metrics

### Key Performance Indicators

- **Allocation Accuracy:** Traffic distributed based on performance
- **Response Time:** Allocation updates complete within 15 minutes
- **System Stability:** No dramatic allocation swings
- **Cost Efficiency:** Optimized provider costs through performance-based routing
- **Learning Continuity:** All providers maintain minimum 5% allocation

### Monitoring Checklist

- [ ] Allocation updates every 15 minutes
- [ ] Performance scores calculated correctly
- [ ] Minimum allocation maintained (≥5% per provider)
- [ ] Event logging functional
- [ ] No performance alerts
- [ ] System health status "healthy"

## 🔄 Migration Guide

### From Manual Allocation

```typescript
// Before: Manual provider selection
const provider = selectProviderManually(context);

// After: Automatic allocation
const result = await system.getOptimalProvider(context);
const provider = result.provider;
```

### From Static Routing

```typescript
// Before: Static routing rules
const provider = routeByDomain(context.domain);

// After: Performance-based routing
const result = await system.getOptimalProvider(context);
// Automatically selects best performing provider
```

## 📞 Support

For issues or questions:

1. Check system health: `system.getHealthStatus()`
2. Review event logs: `system.getEventHistory()`
3. Verify configuration: `system.getConfig()`
4. Force update if needed: `system.forceTrafficAllocationUpdate()`

The Automatic Traffic Allocation system is designed to be self-managing and requires minimal intervention once configured properly.
