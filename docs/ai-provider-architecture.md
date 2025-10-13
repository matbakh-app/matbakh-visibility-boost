# AI Provider Architecture - Comprehensive Guide

**Last Updated**: 2025-10-06T08:15:00Z  
**Version**: 2.7.0  
**Status**: Production Ready with Circuit Breaker Integration

## Overview

The matbakh.app AI Provider Architecture implements a sophisticated multi-provider system with intelligent routing, performance optimization, and comprehensive circuit breaker integration for both routing paths. The system supports AWS Bedrock, Google AI, and Meta LLaMA with automatic traffic allocation, fault tolerance, and comprehensive monitoring.

## Architecture Components

### 1. AI Orchestrator Core

- **Unified AI API**: Single interface for all AI operations
- **Intelligent Provider Routing**: Context-aware provider selection
- **Performance Monitoring**: Real-time P95 latency tracking
- **Circuit Breaker Protection**: Comprehensive fault tolerance for both routing paths
- **Hybrid Routing Protection**: Circuit breaker integration for direct Bedrock and MCP paths
- **Security Posture Monitoring**: ✨ NEW - Real-time security status tracking for hybrid AI architecture

### 2. Intelligent Router ✨ NEW

- **Hybrid Routing**: Intelligent decisions between direct Bedrock and MCP integration
- **Operation-Based Routing**: Emergency (< 5s), Critical (< 10s), Standard (< 30s)
- **Health-Aware Decisions**: Route selection based on real-time health status
- **Fallback Strategies**: Automatic failover with circuit breaker protection
- **Efficiency Optimization**: Cost and performance optimization recommendations

### 3. MCP Router (Model Context Protocol) ✨ ENHANCED

Enterprise-grade hybrid communication system with advanced message queuing and retry logic:

#### Core Features

- **WebSocket Communication**: Persistent connection with automatic reconnection
- **Priority-Based Message Queuing**: 5-level priority system (emergency → critical → high → medium → low)
- **Advanced Retry Logic**: Exponential backoff with configurable retry limits (default: 3 attempts)
- **Connection Recovery**: Automatic message retry after reconnection with queue persistence
- **Resource Management**: Comprehensive timeout tracking and cleanup prevention of memory leaks

#### Message Queuing System ✨ NEW

- **Queue Architecture**: Separate priority queue and pending operations tracking
- **Overflow Protection**: Configurable queue size limits with graceful degradation
- **Priority Processing**: Critical operations processed first during high load
- **Queue Metrics**: Real-time monitoring of queue size, pending operations, and overflow events
- **Memory Efficiency**: Automatic cleanup of completed operations and timeouts

#### Enhanced Reliability

- **Connection State Management**: Error state preservation during connection issues
- **Health Monitoring Integration**: Real-time connection status with service-specific circuit bration
- **Performance Tracking**: Latency, success rates, and error rate calculation
- **Audit Trail**: Comprehensive logging with correlation IDs for all operations
- **Kiro Bridge Protocol**: Structured bidirectional communication for diagnostics and execution data
  )`)""mcp`isOpen(ion (tificatenservice idith lerance wd fault toEnhanceaker**: ircuit Breecific Cervice-Sp- **S

#### Production Readiness

- **Scalability**: Handles high-load scenarios with intelligent queue management
- **Monitoring**: Real-time metrics for queue operations and connection health
- **Error Handling**: Graceful degradation with proper error responses
- **Resource Cleanup**: Prevents memory leaks through comprehensive timeout management

### 3. Support Operations Cache ✨ NEW

Specialized caching layer for Bedrock Support Manager operations with intelligent TTL management and operation-specific optimization:

#### Core Features

- **6 Operation Types**: Infrastructure Audit, Meta-Monitoring, Implementation Gaps, Compliance Validation, Security Audit, Cost Analysis
- **Context-Based Caching**: SHA-256 hashed cache keys with context isolation
- **Automatic TTL Management**: Operation-specific TTLs (1min - 30min)
- **LRU Eviction**: Prevents unbounded memory growth (1000 entry limit)
- **Data Compression**: Automatic compression for responses >1KB
- **Health Monitoring**: Real-time cache performance tracking

#### Cache Configuration by Environment

**Development**:

- Infrastructure Audit: 60s, Meta-Monitoring: 30s, Implementation Gaps: 120s
- Compliance: 300s, Security: 180s, Cost: 60s
- Max Size: 100 entries

**Staging**:

- Infrastructure Audit: 180s, Meta-Monitoring: 45s, Implementation Gaps: 300s
- Compliance: 900s, Security: 450s, Cost: 180s
- Max Size: 500 entries

**Production**:

- Infrastructure Audit: 300s, Meta-Monitoring: 60s, Implementation Gaps: 600s
- Compliance: 1800s, Security: 900s, Cost: 300s
- Max Size: 1000 entries

#### Usage Example

```typescript
import { createSupportOperationsCache } from "./support-operations-cache";

// Create cache with production config
const cache = createSupportOperationsCache(SUPPORT_CACHE_CONFIGS.production);

// Cache infrastructure audit
await cache.setInfrastructureAudit(auditResult, { env: "production" });

// Fast retrieval
const cached = await cache.getInfrastructureAudit({ env: "production" });

// Monitor performance
const stats = cache.getStats();
// { hits: 150, misses: 50, hitRate: 0.75, cacheSize: 45 }
```

#### Performance Characteristics

- **Get Operation**: <1ms average latency (in-memory Map)
- **Set Operation**: <2ms average latency (with compression)
- **Hit Rate Target**: 70%+ for frequent operations
- **Memory Efficiency**: Automatic compression + LRU eviction

### 4. Security Posture Monitor

Comprehensive security monitoring for hybrid AI architecture with real-time threat detection and compliance tracking:

#### Core Features

- **Overall Security Status**: Aggregated security health across all routing paths
- **Route-Specific Monitoring**: Individual security status for MCP and direct Bedrock paths
- **Active Threat Tracking**: Real-time monitoring of active and mitigated security threats
- **Compliance Metrics**: GDPR compliance, data residency, and audit trail completeness
- **Security Recommendations**: Automated security improvement suggestions

#### Security Status Interface

```typescript
interface SecurityPostureStatus {
  overallStatus: "secure" | "warning" | "critical";
  lastAssessment: Date;
  routeStatus: {
    mcp: RouteSecurityStatus;
    directBedrock: RouteSecurityStatus;
  };
  activeThreats: SecurityThreat[];
  mitigatedThreats: SecurityThreat[];
  complianceMetrics: ComplianceMetrics;
  recommendations: string[];
}
```

#### Route Security Monitoring

```typescript
interface RouteSecurityStatus {
  isSecure: boolean;
  threatLevel: "low" | "medium" | "high" | "critical";
  lastSecurityCheck: Date;
  vulnerabilities: string[];
  securityScore: number; // 0-100
}
```

#### Threat Detection

```typescript
interface SecurityThreat {
  id: string;
  type:
    | "pii_exposure"
    | "unauthorized_access"
    | "data_breach"
    | "compliance_violation";
  severity: "low" | "medium" | "high" | "critical";
  detectedAt: Date;
  mitigatedAt?: Date;
  description: string;
  affectedRoute: "mcp" | "directBedrock" | "both";
}
```

#### Compliance Tracking

```typescript
interface ComplianceMetrics {
  gdprCompliant: boolean;
  dataResidencyCompliant: boolean;
  auditTrailComplete: boolean;
  lastComplianceCheck: Date;
  violations: string[];
}
```

#### Usage Example

```typescript
import { SecurityPostureMonitor } from "@/lib/ai-orchestrator/security-posture-monitor";

const securityMonitor = new SecurityPostureMonitor();

// Get current security posture
const status = await securityMonitor.assessSecurityPosture();
console.log(`Overall Status: ${status.overallStatus}`);
console.log(`MCP Route Security: ${status.routeStatus.mcp.isSecure}`);
console.log(
  `Direct Bedrock Security: ${status.routeStatus.directBedrock.isSecure}`
);
console.log(`Active Threats: ${status.activeThreats.length}`);
console.log(`GDPR Compliant: ${status.complianceMetrics.gdprCompliant}`);

// Get security recommendations
status.recommendations.forEach((rec) => console.log(`Recommendation: ${rec}`));
```

### 4. Circuit Breaker Integration

Comprehensive circuit breaker protection for both routing paths ensures system reliability and fault tolerance:

#### Core Features

- **Dual Path Protection**: Circuit breakers for both direct Bedrock and MCP routing paths
- **Support-Specific Configuration**: Enhanced sensitivity for support operations (3 failure threshold)
- **Intelligent Fallback**: Automatic switching between paths based on circuit breaker states
- **Emergency Procedures**: Comprehensive procedures when both paths are unavailable

#### Configuration

```typescript
// Support-specific circuit breaker configuration
const circuitBreaker = new CircuitBreaker({
  failureThreshold: 3, // More sensitive for support operations
  recoveryTimeout: 30000, // 30 seconds recovery
  halfOpenMaxCalls: 2, // Conservative half-open testing
  healthCheckInterval: 15000, // 15 second health checks
});
```

#### Circuit Breaker States

- **Closed**: Normal operation, requests pass through
- **Open**: Failures detected, requests blocked for recovery period
- **Half-Open**: Testing recovery, limited requests allowed

#### Health Monitoring

- **Real-time Status**: Continuous monitoring of both routing paths
- **Health Assessment**: Overall system health (healthy/degraded/critical)
- **Metrics Collection**: Detailed failure rates, success rates, and recovery times

#### Integration Points

- **Bedrock Support Manager**: Circuit breaker protection for all support operations
- **Infrastructure Auditor**: Protected audit execution with fallback mechanisms
- **Fallback Support**: Intelligent routing with circuit breaker awareness
- **Emergency Procedures**: Automatic triggering when both paths fail

### 4. Direct Bedrock Client

- **Emergency Operations**: < 5s latency for critical support
- **Infrastructure Support**: < 10s latency for system operations
- **Compliance Integration**: PII detection and GDPR validation
- **Health Monitoring**: Continuous status tracking
- **Circuit Breaker Protection**: Integrated fault tolerance

### 5. Provider Adapters

- **Bedrock Adapter**: AWS Bedrock Claude 3.5 Sonnet integration
- **Google Adapter**: Google AI Gemini integration
- **Meta Adapter**: Meta LLaMA integration
- **Tool Call Adapter**: Unified tool calling interface

### 6. Optimization Systems

- **Automatic Traffic Allocation**: Performance-based provider distribution
- **Cache Hit Rate Optimization**: Intelligent caching for frequent queries
- **Active Guardrails**: PII detection and toxicity prevention
- **Performance Rollback**: Automatic degradation recovery
- **Security Posture Optimization**: Automated security improvement recommendations

## Intelligent Router Integration

### Routing Decision Matrix

The Intelligent Router uses a configurable decision matrix to determine the optimal route for each operation:

```typescript
const routingRules: RoutingRule[] = [
  {
    operationType: "emergency",
    priority: "critical",
    latencyRequirement: 5000, // < 5s
    primaryRoute: "direct",
    fallbackRoute: null, // No fallback for emergency
    healthCheckRequired: true,
  },
  {
    operationType: "infrastructure",
    priority: "critical",
    latencyRequirement: 10000, // < 10s
    primaryRoute: "direct",
    fallbackRoute: "mcp",
    healthCheckRequired: true,
  },
  {
    operationType: "standard",
    priority: "medium",
    latencyRequirement: 30000, // < 30s
    primaryRoute: "mcp",
    fallbackRoute: "direct",
    healthCheckRequired: false,
  },
];
```

### Hybrid Routing Usage

```typescript
import { IntelligentRouter } from "@/lib/ai-orchestrator/intelligent-router";

const router = new IntelligentRouter(directBedrockClient, mcpRouter);

// Execute support operation with intelligent routing
const response = await router.executeSupportOperation({
  operation: "infrastructure",
  priority: "critical",
  prompt: "Analyze system performance degradation",
  maxTokens: 2048,
  temperature: 0.3,
});

// Get routing efficiency metrics
const efficiency = router.getRoutingEfficiency();
console.log(`Direct route usage: ${efficiency.directRouteUsage}`);
console.log(`MCP route usage: ${efficiency.mcpRouteUsage}`);
console.log(`Average latency: ${efficiency.averageLatency}ms`);
```

### Audit Trail Integration

All hybrid routing operations are automatically logged with comprehensive audit events:

```typescript
// Audit events for hybrid routing operations
const auditEvents = [
  "hybrid_routing_decision", // Routing decisions between direct Bedrock and MCP
  "direct_bedrock_operation", // Direct Bedrock API operations
  "mcp_routing_operation", // MCP router operations
  "intelligent_routing_fallback", // Fallback routing decisions
  "route_health_check", // Route health monitoring
  "routing_optimization", // Route optimization events
  "hybrid_compliance_validation", // Compliance validation for hybrid operations
  "emergency_pii_redaction", // Emergency PII redaction events
  "gdpr_compliance_validation", // GDPR compliance validation
  "pii_redaction", // PII redaction operations
];
```

### Route Health Monitoring

```typescript
// Check individual route health
const directHealth = await router.checkRouteHealth("direct");
const mcpHealth = await router.checkRouteHealth("mcp");

console.log(
  `Direct route: ${directHealth.isHealthy} (${directHealth.latencyMs}ms)`
);
console.log(`MCP route: ${mcpHealth.isHealthy} (${mcpHealth.latencyMs}ms)`);

// Get optimization recommendations
const recommendations = await router.optimizeRouting();
recommendations.forEach((rec) => console.log(`Recommendation: ${rec}`));
```

### Routing Efficiency Metrics

- **Total Requests**: Overall operation count
- **Route Usage Distribution**: Direct vs MCP utilization
- **Fallback Usage**: Frequency of fallback activation
- **Average Latency**: Performance across all routes
- **Success Rate**: Overall operation success percentage
- **Cost Efficiency**: Optimized cost per operation

## Direct Bedrock Client Integration

### Operation Types

#### Emergency Operations (< 5s SLA)

```typescript
const response = await directBedrockClient.executeEmergencyOperation(
  "System critical error: database connection lost",
  { correlationId: "emergency-001" }
);
```

#### Infrastructure Operations (< 10s SLA)

```typescript
const response = await directBedrockClient.executeCriticalOperation(
  "Analyze infrastructure failure patterns",
  { tenant: "production" },
  [infrastructureAnalysisTool]
);
```

#### Standard Operations

```typescript
const response = await directBedrockClient.executeSupportOperation({
  operation: "implementation",
  priority: "medium",
  prompt: "Review code implementation for optimization",
  maxTokens: 4096,
  temperature: 0.4,
});
```

### Health Monitoring

```typescript
const healthStatus = directBedrockClient.getHealthStatus();
console.log(`Bedrock Health: ${healthStatus.isHealthy}`);
console.log(`Latency: ${healthStatus.latencyMs}ms`);
console.log(`Circuit Breaker: ${healthStatus.circuitBreakerState}`);
```

### Compliance Features

- **PII Detection**: Automatic scanning for sensitive information
- **GDPR Compliance**: Consent validation for user data processing
- **Audit Trail**: Complete operation logging for compliance
- **Security Validation**: Input sanitization and validation

## Bedrock Support Manager

The Bedrock Support Manager provides centralized orchestration for AWS Bedrock integration with hybrid routing capabilities and comprehensive GDPR compliance validation.

### Core Features

- **Hybrid Architecture**: Combines direct Bedrock access with MCP integration
- **Intelligent Routing**: Automatic routing decisions based on operation type and priority
- **Infrastructure Auditing**: Comprehensive system health and gap detection
- **Implementation Support**: Automated remediation and backlog analysis
- **Meta Monitoring**: Real-time analysis of Kiro execution patterns
- **Health Monitoring**: Continuous monitoring of both routing paths
- **GDPR Hybrid Compliance Validator**: ✨ NEW - Comprehensive GDPR compliance validation and enforcement
- **Compliance Reporting**: ✨ NEW - Automated compliance report generation for support operations

### Recent Updates

**Latest Modification**: Enhanced error handling and circuit breaker integration

- Improved fault tolerance with comprehensive error recovery
- Enhanced circuit breaker patterns for both routing paths
- Optimized performance monitoring and health checks
- Strengthened integration with existing AI orchestrator components

### Usage Example

```typescript
import { BedrockSupportManager } from "@/lib/ai-orchestrator/bedrock-support-manager";

const supportManager = new BedrockSupportManager();

// Activate support mode with hybrid routing
await supportManager.activate({
  enableIntelligentRouting: true,
  enableDirectBedrockFallback: true,
  auditInterval: 30000, // 30 seconds
});

// Execute infrastructure audit
const auditResult = await supportManager.executeInfrastructureAudit();
console.log(`Infrastructure Health: ${auditResult.overallHealth}`);

// Generate compliance report
const complianceReport =
  await supportManager.createComplianceReportForSupportMode();
console.log(
  `Compliance Status: ${complianceReport.supportModeCompliance.overallCompliant}`
);

// Get implementation support
const supportResult = await supportManager.executeImplementationSupport({
  operation: "gap-analysis",
  priority: "high",
  context: "system-optimization",
});
```

### Integration Points

- **AI Feature Flags**: Seamless integration with existing feature flag system
- **Circuit Breaker**: Enhanced fault tolerance with service-specific protection
- **Audit Trail**: Complete operation logging with correlation IDs
- **Health Monitoring**: Real-time status tracking with automatic recovery

## Provider Selection Logic

### Context-Based Routing

```typescript
const routingRules = {
  emergency: "direct-bedrock", // < 5s requirement
  infrastructure: "direct-bedrock", // < 10s requirement
  system: "bedrock", // System orchestration
  user: "google", // User-facing operations
  audience: "meta", // Audience analysis
  content: "google", // Content generation
};
```

### Fallback Chains

- **Emergency**: Direct Bedrock → Circuit Breaker Open
- **Infrastructure**: Direct Bedrock → Bedrock → Google
- **System**: Bedrock → Google → Meta
- **User**: Google → Meta → Bedrock
- **Audience**: Meta → Google → Bedrock

## Performance Optimization

### Automatic Traffic Allocation

- **Performance Scoring**: Win Rate (40%) + Latency (30%) + Cost (20%) + Confidence (10%)
- **Smooth Transitions**: 30% movement toward optimal allocation
- **Minimum Guarantees**: 5% allocation per provider for learning
- **Update Frequency**: Every 15 minutes with performance monitoring

### Cache Hit Rate Optimization

- **Target Hit Rate**: ≥80% for frequent queries
- **Automatic Warmup**: Proactive cache population
- **Intelligent Refresh**: Performance-based cache invalidation
- **Query Pattern Analysis**: Frequency-based optimization

### P95 Latency Monitoring

- **Target SLAs**:
  - Emergency: < 5s
  - Critical: < 10s
  - Standard: < 30s
- **Real-time Tracking**: Continuous latency measurement
- **Automatic Rollback**: Performance degradation recovery
- **Alert Thresholds**: Configurable performance gates

## Security and Compliance

### Active Guardrails

- **PII Detection**: Real-time sensitive data scanning
- **Toxicity Prevention**: Content safety validation
- **Input Sanitization**: Malicious input detection
- **Output Filtering**: Response content validation

### GDPR Compliance

- **Consent Validation**: User consent verification
- **Data Minimization**: Minimal data processing
- **Right to Erasure**: Data deletion capabilities
- **Audit Logging**: Complete compliance trail
- **Hybrid Compliance Validator**: ✨ NEW - Advanced GDPR validation with multi-layer compliance checking
  - **Data Processing Validation**: Comprehensive validation of data processing operations
  - **Consent Management**: Advanced consent tracking and validation
  - **Privacy Impact Assessment**: Automated privacy risk evaluation
  - **Compliance Reporting**: Real-time compliance status and audit trail

### Circuit Breaker Protection

- **Failure Thresholds**: Configurable failure limits
- **Recovery Timeouts**: Automatic recovery mechanisms
- **Half-Open Testing**: Gradual service restoration
- **Health Monitoring**: Continuous service validation
- **Service-Specific Checks**: Enhanced circuit breaker with service identification

```typescript
// Enhanced circuit breaker with service-specific identification
if (this.circuitBreaker.isOpen("mcp" as any)) {
  throw new Error("MCP router circuit breaker is open");
}
```

## Monitoring and Observability

### Real-time Metrics

- **Provider Performance**: Latency, success rate, cost per provider
- **Operation Metrics**: Emergency, critical, standard operation tracking
- **Health Status**: Circuit breaker states, failure rates
- **Compliance Metrics**: PII detection, GDPR validation rates
- **Security Posture**: ✨ NEW - Overall security status, threat levels, route-specific security scores

### Dashboards

- **AI Provider Dashboard**: Multi-provider performance overview
- **Direct Bedrock Dashboard**: Emergency operation monitoring
- **Performance Dashboard**: P95 latency and optimization metrics
- **Compliance Dashboard**: Security and privacy monitoring
- **Security Posture Dashboard**: ✨ NEW - Real-time security status, threat tracking, compliance metrics

### Alerting

- **Emergency Alerts**: < 5s SLA violations
- **Critical Alerts**: < 10s SLA violations
- **Performance Alerts**: P95 threshold breaches
- **Compliance Alerts**: Security policy violations

## Configuration Management

### Environment-Specific Settings

```typescript
// Development
const devConfig = {
  emergencyTimeout: 8000, // Relaxed for development
  enableComplianceChecks: false,
  enableHealthMonitoring: true,
};

// Production
const prodConfig = {
  emergencyTimeout: 5000, // Strict SLA enforcement
  enableComplianceChecks: true,
  enableHealthMonitoring: true,
};
```

### Feature Flags

The AI Feature Flags system provides centralized control over AI service features with multiple access methods:

```typescript
import { AiFeatureFlags } from "@/lib/ai-orchestrator/ai-feature-flags";

const flags = new AiFeatureFlags();

// Check individual flags (multiple methods available)
const isEnabled = flags.getFlag("bedrock_support_mode", false);
const routingEnabled = flags.isEnabled("intelligent_routing_enabled", true); // New alias method
const supportMode = flags.getFlag("bedrock_support_mode", false);

// Bedrock-specific feature checks
const bedrockSupport = await flags.isBedrockSupportModeEnabled();
```

**Available Feature Flags:**

- `ENABLE_DIRECT_BEDROCK_FALLBACK`: Direct Bedrock access control
- `ENABLE_EMERGENCY_OPERATIONS`: Emergency operation enablement
- `ENABLE_COMPLIANCE_CHECKS`: Compliance validation control
- `ENABLE_HEALTH_MONITORING`: Health monitoring activation
- `intelligent_routing_enabled`: Intelligent provider routing control
- `bedrock_support_mode`: Bedrock support mode activation

## Integration Examples

### Emergency Support Integration

```typescript
import {
  DirectBedrockClient,
  DirectBedrockConfig,
  SupportOperationRequest,
} from "@/lib/ai-orchestrator/direct-bedrock-client";

const supportClient = new DirectBedrockClient({
  region: "eu-central-1",
  emergencyTimeout: 5000,
  enableComplianceChecks: true,
});

// Handle critical system failure
const handleSystemFailure = async (errorContext: string) => {
  const response = await supportClient.executeEmergencyOperation(
    `Critical system failure analysis: ${errorContext}`,
    {
      correlationId: generateCorrelationId(),
      priority: "critical",
    }
  );

  if (response.success) {
    await executeRecoveryPlan(response.text);
  } else {
    await escalateToHumanSupport(response.error);
  }
};
```

### Infrastructure Monitoring Integration

```typescript
// Monitor infrastructure health
const monitorInfrastructure = async () => {
  const healthCheck = await supportClient.performHealthCheck();

  if (!healthCheck.isHealthy) {
    await supportClient.executeCriticalOperation(
      `Infrastructure health degraded: ${healthCheck.error}`,
      {
        metadata: {
          consecutiveFailures: healthCheck.consecutiveFailures,
          lastLatency: healthCheck.latencyMs,
        },
      }
    );
  }
};
```

## Best Practices

### Emergency Operations

1. **Keep prompts concise** for faster processing
2. **Use low temperature** (0.1) for consistent responses
3. **Limit token output** (1024) for speed optimization
4. **Include correlation IDs** for tracking
5. **Monitor latency closely** against 5s SLA

### Infrastructure Operations

1. **Provide system context** in prompts
2. **Use appropriate tools** for analysis
3. **Monitor circuit breaker** status
4. **Implement proper fallbacks** for failures
5. **Log all operations** for audit trail

### Compliance and Security

1. **Validate all inputs** for PII and malicious content
2. **Check user consent** before processing personal data
3. **Monitor compliance metrics** continuously
4. **Implement proper error handling** for security failures
5. **Maintain audit logs** for all operations

## Troubleshooting

### Common Issues

#### High Latency

- Check circuit breaker status
- Verify timeout configurations
- Monitor provider health
- Review operation complexity

#### Compliance Failures

- Validate input sanitization
- Check consent mechanisms
- Review PII detection rules
- Verify GDPR compliance

#### Circuit Breaker Open

- Check failure thresholds
- Monitor error rates
- Verify recovery timeouts
- Review health check results

### Debug Commands

```bash
# Check Direct Bedrock health
npm run debug:bedrock-health

# Monitor emergency operations
npm run monitor:emergency-ops

# Validate compliance checks
npm run test:compliance-validation

# Check circuit breaker status
npm run status:circuit-breakers

# Test intelligent router imports
npm test -- --testPathPattern="intelligent-router-import"

# Validate Kiro Bridge examples with direct import optimization (OPTIMIZED)
npm test -- --testPathPattern="kiro-bridge-example" --verbose

# Test KiroBridge component directly without circular dependencies
npm test -- --testNamePattern="KiroBridge"

# Debug Jest module import issues with simplified structure (OPTIMIZED)
npm test -- --testPathPattern="kiro-bridge-example" --verbose --no-cache

# Debug transpilation issues with dynamic imports (NEW)
npm test -- --testPathPattern="kiro-bridge-simple-import" --verbose

# Validate AI orchestrator module integrity
npm test src/lib/ai-orchestrator/__tests__/intelligent-router-import.test.ts

# Comprehensive module debugging for import issues with enhanced export inspection
npm test -- --testPathPattern="kiro-bridge" --verbose --detectOpenHandles

# Debug specific Jest require patterns for module resolution
npm test -- --testPathPattern="kiro-bridge-example" --verbose --runInBand
```

## Testing Infrastructure

The AI Provider Architecture includes comprehensive testing at multiple levels with enhanced debugging capabilities:

### Unit Tests

- **Provider-specific adapter tests**: Individual provider validation
- **Routing algorithm validation**: Intelligent routing logic tests
- **Fallback mechanism testing**: Circuit breaker and failover tests
- **Debug logging patterns**: Enhanced import validation and type checking

#### Debug Logging for Test Development ✨ NEW

Enhanced test debugging with import validation patterns:

```typescript
// Debug logging for module imports
console.log("🔍 KiroBridge imported:", KiroBridge);
console.log("🔍 KiroBridge type:", typeof KiroBridge);
```

**Benefits**:

- **Import Validation**: Verify module imports are successful
- **Type Checking**: Confirm constructors are properly loaded
- **Debugging Support**: Aid in troubleshooting module resolution issues
- **Test Environment Validation**: Ensure test environment integrity
- **Performance monitoring tests**: P95 latency and optimization validation
- **Intelligent Router Tests**: ✅ Basic and comprehensive test coverage for routing logic

### Integration Tests

- **Multi-provider workflow testing**: End-to-end provider integration
- **Performance benchmarking**: Load testing and optimization validation
- **Error handling scenarios**: Failure mode and recovery testing
- **Simple Router Tests**: ✅ Foundation tests for intelligent routing components

### Test Coverage Status

- **IntelligentRouter**: ✅ Complete test coverage with structure validation (2025-01-14)
  - `intelligent-router-structure.test.ts` - Method availability and class structure validation
  - `intelligent-router-import.test.ts` - Module import verification
  - `intelligent-router.test.ts` - Comprehensive routing logic tests
  - `intelligent-router-simple.test.ts` - Basic test foundation
- **KiroBridge**: ✅ Enhanced test coverage with import optimization (2025-01-14)
  - `kiro-bridge-example.test.ts` - ✨ OPTIMIZED: Direct KiroBridge import without circular dependencies
  - `kiro-bridge-simple-import.test.ts` - ✨ NEW: Dynamic import testing to isolate transpilation issues
  - **Import Simplification**: Removed complex example function imports for cleaner test structure
  - **Transpilation Debugging**: Dynamic import patterns for Jest compatibility
  - **Dependency Optimization**: Direct component testing approach eliminates circular dependencies
  - **Test Reliability**: Improved maintainability with simplified import patterns
  - `kiro-bridge-simple.test.ts` - Basic functionality and import validation
  - `kiro-bridge.test.ts` - Comprehensive integration tests
  - Example integration with usage patterns and structural validation
- **Provider Routing**: ✅ Comprehensive integration tests
- **Performance Tests**: ✅ P95 latency validation
- **Fallback Tests**: ✅ Multi-provider fallback scenarios
- **Direct Bedrock**: ✅ Emergency and critical operation tests
- **Compliance Tests**: ✅ PII detection and GDPR validation

### Test Execution

```bash
# Run intelligent router tests (including structure and import validation)
npm test -- --testPathPattern="intelligent-router"

# Run Kiro Bridge tests with debug logging (enhanced debugging)
npm test -- --testPathPattern="kiro-bridge-example" --verbose

# Run specific structure validation test
npm test -- --testPathPattern="intelligent-router-structure"

# Run specific import validation test
npm test -- --testPathPattern="intelligent-router-import"

# Run KiroBridge example tests (OPTIMIZED with direct import pattern)
npm test -- --testPathPattern="kiro-bridge-example" --verbose

# Debug KiroBridge module imports with simplified structure
npm test -- --testPathPattern="kiro-bridge-example" --verbose --no-cache

# Run KiroBridge simple tests
npm test -- --testPathPattern="kiro-bridge-simple"

# Run KiroBridge simple import tests (transpilation debugging)
npm test -- --testPathPattern="kiro-bridge-simple-import"

# Run comprehensive AI orchestrator tests
npm test -- --testPathPattern="ai-orchestrator"

# Run performance validation tests
npm test -- --testPathPattern="performance"

# Validate all AI provider architecture tests
npm test src/lib/ai-orchestrator/__tests__/
```

## Future Enhancements

### Planned Features

- **Multi-region failover** for Direct Bedrock
- **Advanced PII detection** with ML models
- **Custom compliance rules** per tenant
- **Predictive health monitoring** with anomaly detection
- **Auto-scaling** based on operation load

### Performance Improvements

- **Streaming responses** for long operations
- **Parallel processing** for batch operations
- **Advanced caching** for repeated patterns
- **Predictive pre-warming** for anticipated loads

---

**Last Updated**: 2025-01-14T15:30:00Z  
**Next Review**: 2025-02-14  
**Maintainer**: AI Architecture Team  
**Status**: Production Ready with Direct Bedrock Integration

## Type System Integration

### Direct Bedrock Client Types

The Direct Bedrock Client provides a comprehensive type system with all types exported as interfaces:

```typescript
// All types available as direct imports
import {
  DirectBedrockConfig,
  DirectBedrockHealthCheck,
  OperationPriority,
  OperationType,
  SupportOperationRequest,
  SupportOperationResponse,
} from "@/lib/ai-orchestrator/direct-bedrock-client";
```

### Type Export Pattern

Following TypeScript best practices, all types are exported at their definition points rather than in separate export blocks. This provides:

- **Single Source of Truth**: Types defined and exported in one location
- **Better IDE Support**: Improved autocomplete and navigation
- **Cleaner Imports**: Direct interface imports without type-only syntax
- **Maintainability**: Reduced duplication and easier refactoring

### Usage Examples

```typescript
// Configuration with proper typing
const config: DirectBedrockConfig = {
  region: "us-east-1",
  maxRetries: 3,
  timeout: 30000,
};

// Support operation with type safety
const request: SupportOperationRequest = {
  operation: "health_check",
  priority: "high",
  context: { source: "monitoring" },
};
```

## Direct Bedrock Client PII Detection

### Overview

The Direct Bedrock Client includes comprehensive PII detection and redaction capabilities to ensure GDPR compliance and data protection for all AI operations.

### Features

#### Automatic PII Detection

- **Email Addresses**: Comprehensive email pattern detection with high confidence
- **Phone Numbers**: International and domestic phone number detection
- **Credit Card Numbers**: Credit card pattern detection with validation
- **Social Security Numbers**: SSN and other ID number detection
- **Custom Patterns**: Configurable detection patterns for specific use cases

#### Advanced Redaction

- **Structure Preservation**: Maintains text structure during redaction
- **Redaction Mapping**: Generates maps for potential PII restoration
- **Emergency Redaction**: Special handling for critical operations
- **Configurable Placeholders**: Customizable redaction tokens

#### GDPR Compliance

- **EU Region Enforcement**: Automatic validation for GDPR-sensitive data processing
- **Consent Validation**: Integration with consent management systems
- **Audit Logging**: Comprehensive audit trail for all PII operations
- **Data Minimization**: Only necessary PII data processed and stored

### Integration Points

#### Safety System Integration

```typescript
// PII Detection Service Integration
const piiResult = await client.detectPii(inputText);
if (piiResult.hasPii) {
  const redacted = await client.redactPii(inputText);
  // Process with redacted content
}
```

#### GDPR Compliance Validation

```typescript
// GDPR Compliance Check
const operation = await client.executeSupportOperation({
  operation: "emergency",
  priority: "critical",
  prompt: inputWithPII, // Automatically detected and redacted
});
```

#### Audit Trail Integration

All PII detection and redaction operations are automatically logged with:

- Detection confidence scores
- Redaction actions taken
- GDPR compliance status
- Audit trail correlation IDs

### Performance Characteristics

- **Detection Speed**: <1s for typical content, <500ms for emergency operations
- **Memory Efficiency**: Optimized pattern matching with minimal memory footprint
- **Scalability**: Handles large content volumes efficiently
- **Caching**: Intelligent caching of detection results for repeated content

### Configuration

#### Feature Flags

- `pii_detection_enabled`: Enable/disable PII detection (default: true)
- `gdpr_compliance_enabled`: Enable/disable GDPR compliance validation (default: true)
- `emergency_redaction_enabled`: Enable/disable emergency redaction (default: true)

#### Detection Settings

```typescript
client.updatePIIDetectionConfig({
  enablePII: true,
  enableToxicity: true,
  strictMode: true,
  redactionMode: "MASK",
  confidenceThreshold: 0.7,
});
```

### Monitoring and Alerting

#### Metrics Tracked

- PII detection accuracy and confidence scores
- Redaction operation performance
- GDPR compliance validation results
- Emergency redaction frequency

#### Alert Conditions

- High PII detection rates (potential data leak)
- GDPR compliance failures
- Emergency redaction threshold exceeded
- Performance degradation in PII detection

## Alerting and Incident Management

### CloudWatch Alarm Manager

Manages CloudWatch alarms for hybrid routing efficiency monitoring.

**Features**:

- Alarm creation and management for all key metrics
- Threshold-based alerting with configurable parameters
- SNS integration for notifications
- Alarm state tracking and management

**Supported Alarms**:

- High Failure Rate (< 95% success rate)
- High Latency (> 1000ms average)
- Cost Threshold (> €100 total cost)
- Low Operation Count (< 10 operations/hour)

**Usage**:

```typescript
const alarmManager = new CloudWatchAlarmManager("eu-central-1", "production");

// Create high failure rate alarm
await alarmManager.createHighFailureRateAlarm(snsTopicArn, 95);

// Create high latency alarm
await alarmManager.createHighLatencyAlarm(snsTopicArn, 1000);

// Delete alarm
await alarmManager.deleteAlarm("production-hybrid-routing-high-failure-rate");
```

### SNS Notification Manager

Manages SNS topics and subscriptions for hybrid routing alerts.

**Features**:

- Topic management (create, delete, configure)
- Multi-protocol subscriptions (email, SMS, webhook, Lambda, SQS)
- Alert publishing with formatted messages
- Specialized alerts for each alarm type

**Usage**:

```typescript
const snsManager = new SNSNotificationManager("eu-central-1", "production");

// Create topics
const arns = await snsManager.createAllTopics();

// Add subscriptions
await snsManager.addEmailSubscription(
  arns["hybrid-routing-critical-alerts"],
  "ops@example.com"
);

// Publish alert
await snsManager.publishHighFailureRateAlert(topicArn, 85, 95);
```

### PagerDuty Integration ✨ NEW

Manages PagerDuty service integration for enterprise-grade incident management.

**Features**:

- Incident lifecycle management (trigger, acknowledge, resolve)
- Alert message integration with automatic incident creation
- Severity mapping (CRITICAL → critical, WARNING → warning, INFO → info)
- Auto-resolution when alerts clear
- Incident tracking and management
- Dashboard links and custom details enrichment

**Usage**:

```typescript
const pagerduty = new PagerDutyIntegration(
  {
    integrationKey: process.env.PAGERDUTY_INTEGRATION_KEY!,
    serviceName: "Hybrid Routing Alerts",
    escalationPolicyId: "policy-123",
  },
  "production"
);

// Trigger incident
const response = await pagerduty.triggerHighFailureRateIncident(85, 95);

// Acknowledge incident
await pagerduty.acknowledgeIncident(response.dedup_key!);

// Resolve incident
await pagerduty.resolveIncident(response.dedup_key!);

// Create incident from alert message
await pagerduty.createIncidentFromAlert(alertMessage);

// Auto-resolve when alert clears
await pagerduty.autoResolveIncident(alertMessage);
```

**Incident Payload Structure**:

```json
{
  "routing_key": "integration-key",
  "event_action": "trigger",
  "dedup_key": "production-hybrid-routing-high-failure-rate-SupportModeSuccessRate",
  "payload": {
    "summary": "🚨 [PRODUCTION] High Failure Rate Alert",
    "source": "production-hybrid-routing",
    "severity": "critical",
    "timestamp": "2025-01-14T14:30:00.000Z",
    "component": "hybrid-routing",
    "group": "ai-orchestrator",
    "class": "performance",
    "custom_details": {
      "alarmName": "production-hybrid-routing-high-failure-rate",
      "metricName": "SupportModeSuccessRate",
      "threshold": 95,
      "currentValue": 85,
      "environment": "production",
      "description": "Success rate has fallen below 95%",
      "recommendations": [
        "Check hybrid routing health status",
        "Review recent deployment changes",
        "Verify MCP and direct Bedrock connectivity",
        "Check circuit breaker status",
        "Review error logs for patterns"
      ]
    }
  },
  "links": [
    {
      "href": "https://console.aws.amazon.com/cloudwatch/...",
      "text": "CloudWatch Dashboard"
    },
    {
      "href": "https://app.matbakh.app/admin/bedrock-activation",
      "text": "Hybrid Routing Dashboard"
    }
  ],
  "client": "matbakh-bedrock-support-manager",
  "client_url": "https://app.matbakh.app/admin/bedrock-activation"
}
```

**Specialized Incident Triggers**:

```typescript
// High failure rate (critical severity)
await pagerduty.triggerHighFailureRateIncident(85, 95);

// High latency (warning severity)
await pagerduty.triggerHighLatencyIncident(1500, 1000);

// Cost threshold (warning severity)
await pagerduty.triggerCostThresholdIncident(150, 100);
```

**Incident Tracking**:

```typescript
// Get all active incidents
const activeIncidents = pagerduty.getActiveIncidents();
console.log(`Active incidents: ${activeIncidents.size}`);

// Get specific incident
const incident = pagerduty.getIncident("incident-123");
if (incident) {
  console.log(`Severity: ${incident.severity}`);
  console.log(`Summary: ${incident.summary}`);
}
```

**Configuration Management**:

```typescript
// Get current configuration
const config = pagerduty.getServiceConfig();

// Update configuration
pagerduty.updateServiceConfig({
  integrationKey: "new-key-12345",
});
```

### Complete Alerting Flow

```typescript
// 1. CloudWatch Alarm Manager creates alarms
const alarmManager = new CloudWatchAlarmManager("eu-central-1", "production");
const snsManager = new SNSNotificationManager("eu-central-1", "production");
const pagerduty = new PagerDutyIntegration(config, "production");

// 2. Create SNS topics
const arns = await snsManager.createAllTopics();

// 3. Add email subscriptions
await snsManager.addEmailSubscription(
  arns["hybrid-routing-critical-alerts"],
  "ops@example.com"
);

// 4. Create CloudWatch alarms with SNS actions
await alarmManager.createHighFailureRateAlarm(
  arns["hybrid-routing-critical-alerts"],
  95
);

// 5. When alarm triggers, publish to SNS
const alertMessage = await snsManager.publishHighFailureRateAlert(
  arns["hybrid-routing-critical-alerts"],
  85,
  95
);

// 6. Create PagerDuty incident from alert
await pagerduty.createIncidentFromAlert(alertMessage);

// 7. When alert clears, auto-resolve incident
await pagerduty.autoResolveIncident(alertMessage);
```
