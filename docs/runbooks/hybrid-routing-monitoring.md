# Hybrid Routing - Monitoring Runbook

**Version**: 1.0.0  
**Last Updated**: 2025-01-14  
**Owner**: DevOps & AI Operations Team

## Monitoring Overview

### Key Performance Indicators (KPIs)

| Metric                             | Target  | Warning  | Critical           | Action                   |
| ---------------------------------- | ------- | -------- | ------------------ | ------------------------ |
| System Health                      | Healthy | Degraded | Unhealthy/Critical | Investigate immediately  |
| Routing Efficiency                 | >80%    | <80%     | <70%               | Review routing decisions |
| Direct Bedrock Latency (Emergency) | <5s     | >5s      | >10s               | Check Bedrock API        |
| Direct Bedrock Latency (Critical)  | <10s    | >10s     | >15s               | Enable fallback          |
| MCP Latency                        | <30s    | >30s     | >60s               | Check MCP health         |
| Health Check Success Rate          | >99%    | <99%     | <95%               | Check component health   |
| Alert Response Time                | <5min   | >5min    | >15min             | Escalate to on-call      |
| Cache Hit Rate                     | >80%    | <80%     | <70%               | Optimize caching         |
| Error Rate                         | <1%     | >1%      | >5%                | Investigate errors       |

### CloudWatch Dashboards

#### 1. Hybrid Routing Overview Dashboard

**URL**: https://console.aws.amazon.com/cloudwatch/dashboards/Hybrid-Routing-Overview

**Widgets**:

- System health status
- Routing efficiency trend
- Latency by routing path
- Error rate by component
- Active alerts count

#### 2. Performance Dashboard

**URL**: https://console.aws.amazon.com/cloudwatch/dashboards/Hybrid-Routing-Performance

**Widgets**:

- P50/P95/P99 latency
- Request rate by operation type
- Cache hit rate
- Circuit breaker status
- Resource utilization

#### 3. Operations Dashboard

**URL**: https://console.aws.amazon.com/cloudwatch/dashboards/Hybrid-Routing-Operations

**Widgets**:

- Support operations count
- Infrastructure audit results
- Implementation support metrics
- Kiro bridge communications
- Meta monitor activity

### Alert Configuration

#### Critical Alerts (P0)

1. **System Down**

   - Condition: Health status = Critical for >2 minutes
   - Action: Page on-call engineer immediately
   - Runbook: [Complete System Outage](./hybrid-routing-incident-response.md#1-complete-system-outage)

2. **High Error Rate**

   - Condition: Error rate >5% for >5 minutes
   - Action: Page on-call engineer
   - Runbook: [High Error Rate](./hybrid-routing-troubleshooting.md#issue-3-high-error-rate)

3. **Direct Bedrock Unavailable**
   - Condition: Direct Bedrock health = Critical for >3 minutes
   - Action: Enable aggressive MCP fallback, notify team
   - Runbook: [Bedrock Client Failure](./hybrid-routing-incident-response.md#2-bedrock-client-failure)

#### High Priority Alerts (P1)

1. **Degraded Performance**

   - Condition: P95 latency >2x target for >10 minutes
   - Action: Notify on-call engineer
   - Runbook: [High Latency](./hybrid-routing-troubleshooting.md#issue-1-high-latency-on-direct-bedrock-path)

2. **Low Routing Efficiency**

   - Condition: Routing efficiency <70% for >15 minutes
   - Action: Review routing decisions
   - Runbook: [Poor Routing Efficiency](./hybrid-routing-troubleshooting.md#issue-2-poor-routing-efficiency)

3. **Component Degraded**
   - Condition: Any component health = Degraded for >10 minutes
   - Action: Investigate component
   - Runbook: [Component Health Issues](./hybrid-routing-troubleshooting.md#component-health-issues)

## Monitoring Procedures

### Daily Health Check Procedure

**Frequency**: Every morning at 9:00 AM UTC

**Steps**:

1. **Check System Overview**

   ```bash
   curl -X GET https://api.matbakh.app/health/hybrid-routing
   ```

2. **Review Overnight Alerts**

   ```bash
   aws logs filter-log-events \
     --log-group-name /aws/lambda/bedrock-hybrid-routing \
     --start-time $(date -d '24 hours ago' +%s)000 \
     --filter-pattern "ALERT"
   ```

3. **Validate Performance Metrics**

   ```bash
   curl -X GET https://api.matbakh.app/metrics/performance-summary
   ```

4. **Check Routing Efficiency**
   ```bash
   curl -X GET https://api.matbakh.app/metrics/routing-efficiency
   ```

### Weekly Performance Review

**Frequency**: Every Monday at 10:00 AM UTC

**Steps**:

1. **Generate Performance Report**

   ```bash
   npx tsx scripts/generate-weekly-performance-report.ts
   ```

2. **Review Trend Analysis**

   - Check P95 latency trends
   - Analyze routing efficiency patterns
   - Review error rate trends
   - Identify optimization opportunities

3. **Update Monitoring Thresholds**
   - Adjust alert thresholds based on trends
   - Update performance targets if needed
   - Review and update runbooks

### Alert Response Procedures

#### Step 1: Alert Acknowledgment (0-2 minutes)

1. **Acknowledge Alert**

   ```bash
   curl -X POST https://api.matbakh.app/alerts/{alert-id}/acknowledge
   ```

2. **Check System Status**
   ```bash
   curl -X GET https://api.matbakh.app/health/system-status
   ```

#### Step 2: Initial Assessment (2-5 minutes)

1. **Determine Severity**

   - P0: System down, security breach
   - P1: Performance degradation, component failure
   - P2: Minor issues, optimization opportunities

2. **Check Recent Changes**
   ```bash
   git log --oneline --since="1 hour ago"
   ```

#### Step 3: Investigation (5-15 minutes)

1. **Gather Diagnostic Information**

   ```bash
   curl -X GET https://api.matbakh.app/diagnostics/full-system
   ```

2. **Check Component Health**
   ```bash
   curl -X GET https://api.matbakh.app/health/components
   ```

#### Step 4: Resolution (Variable)

1. **Apply Immediate Fix** (if available)
2. **Execute Rollback** (if needed)
3. **Escalate** (if beyond scope)

### Monitoring Commands Reference

#### Health Check Commands

```bash
# System health overview
curl -X GET https://api.matbakh.app/health/hybrid-routing

# Component-specific health
curl -X GET https://api.matbakh.app/health/bedrock-support-manager
curl -X GET https://api.matbakh.app/health/intelligent-router
curl -X GET https://api.matbakh.app/health/direct-bedrock-client
curl -X GET https://api.matbakh.app/health/mcp-router

# Performance metrics
curl -X GET https://api.matbakh.app/metrics/performance
curl -X GET https://api.matbakh.app/metrics/routing-efficiency
curl -X GET https://api.matbakh.app/metrics/cache-hit-rate
```

#### Log Analysis Commands

```bash
# Recent errors
aws logs filter-log-events \
  --log-group-name /aws/lambda/bedrock-hybrid-routing \
  --start-time $(date -d '1 hour ago' +%s)000 \
  --filter-pattern "ERROR"

# Routing decisions
aws logs filter-log-events \
  --log-group-name /aws/lambda/bedrock-hybrid-routing \
  --start-time $(date -d '1 hour ago' +%s)000 \
  --filter-pattern "ROUTING_DECISION"

# Performance issues
aws logs filter-log-events \
  --log-group-name /aws/lambda/bedrock-hybrid-routing \
  --start-time $(date -d '1 hour ago' +%s)000 \
  --filter-pattern "PERFORMANCE_WARNING"
```

#### Metric Commands

```bash
# Get routing efficiency
aws cloudwatch get-metric-statistics \
  --namespace "Bedrock/HybridRouting" \
  --metric-name "RoutingEfficiency" \
  --start-time $(date -d '1 hour ago' --iso-8601) \
  --end-time $(date --iso-8601) \
  --period 300 \
  --statistics Average

# Get latency metrics
aws cloudwatch get-metric-statistics \
  --namespace "Bedrock/HybridRouting" \
  --metric-name "DirectBedrockLatency" \
  --start-time $(date -d '1 hour ago' --iso-8601) \
  --end-time $(date --iso-8601) \
  --period 300 \
  --statistics Average,Maximum
```
