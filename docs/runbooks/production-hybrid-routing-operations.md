# Production Hybrid Routing Operations Runbook

## Overview

This runbook provides operational procedures for managing Bedrock Support Mode with Hybrid Routing in production. It covers monitoring, troubleshooting, maintenance, and emergency procedures.

## System Architecture

### Core Components

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Kiro Agent    │    │ Intelligent      │    │ Direct Bedrock  │
│                 │◄──►│ Router           │◄──►│ Client          │
│                 │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │ MCP Router       │
                       │                  │
                       └──────────────────┘
```

### Routing Decision Matrix

| Operation Type | Priority | Latency Req | Primary Route | Fallback |
| -------------- | -------- | ----------- | ------------- | -------- |
| Emergency      | Critical | < 5s        | Direct        | None     |
| Infrastructure | Critical | < 10s       | Direct        | MCP      |
| Meta Monitor   | High     | < 15s       | Direct        | MCP      |
| Implementation | High     | < 15s       | Direct        | MCP      |
| Kiro Comm      | Medium   | < 30s       | MCP           | Direct   |
| Standard       | Medium   | < 30s       | MCP           | Direct   |
| Background     | Low      | < 60s       | MCP           | Direct   |

## Monitoring and Alerting

### Key Metrics

**Performance Metrics**:

- P95 Latency (Target: ≤1.5s generation, ≤300ms cached)
- Error Rate (Target: ≤1.0%)
- Throughput (Requests per second)
- Cache Hit Rate (Target: ≥80%)

**Routing Metrics**:

- Routing Decision Accuracy
- Fallback Frequency
- Route Health Status
- Load Distribution

**Cost Metrics**:

- Token Usage per Provider
- Cost per Operation
- Budget Utilization (Alert at 80%)

### Alert Thresholds

**Critical Alerts** (Immediate Response):

- P95 Latency > 2.0s for 5 minutes
- Error Rate > 5% for 2 minutes
- Direct Bedrock connection failure
- Cost budget > 95%

**Warning Alerts** (Response within 30 minutes):

- P95 Latency > 1.5s for 10 minutes
- Error Rate > 2% for 5 minutes
- Cache Hit Rate < 70% for 15 minutes
- Routing fallback rate > 20%

**Info Alerts** (Response within 2 hours):

- Cache Hit Rate < 80% for 30 minutes
- Cost budget > 80%
- Routing efficiency < 90%

### Dashboard URLs

- **Main Dashboard**: [CloudWatch Hybrid Routing Dashboard]
- **Performance Dashboard**: [P95 Latency and Performance Metrics]
- **Cost Dashboard**: [Cost Tracking and Budget Monitoring]
- **Security Dashboard**: [Compliance and Security Metrics]

## Operational Procedures

### Daily Operations

**Morning Checklist** (9:00 AM):

- [ ] Review overnight alerts and incidents
- [ ] Check system health dashboard
- [ ] Validate SLO compliance (P95, error rate, cost)
- [ ] Review routing efficiency metrics
- [ ] Check cache performance and hit rates

**Evening Checklist** (6:00 PM):

- [ ] Review daily performance summary
- [ ] Check cost utilization and projections
- [ ] Validate security and compliance status
- [ ] Review any configuration changes
- [ ] Prepare overnight monitoring summary

### Weekly Operations

**Monday Review**:

- [ ] Weekly performance trend analysis
- [ ] Cost optimization review and recommendations
- [ ] Security posture assessment
- [ ] Routing efficiency optimization review

**Friday Planning**:

- [ ] Review week's incidents and resolutions
- [ ] Plan upcoming maintenance windows
- [ ] Update operational documentation
- [ ] Prepare weekly stakeholder report

### Feature Flag Management

**Current Production Flags**:

```bash
# Check current flag status
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://api.matbakh.app/admin/feature-flags/bedrock

# Expected Response:
{
  "ENABLE_BEDROCK_SUPPORT_MODE": true,
  "ENABLE_INTELLIGENT_ROUTING": true,
  "ENABLE_DIRECT_BEDROCK_FALLBACK": true,
  "ENABLE_HYBRID_HEALTH_MONITORING": true,
  "ENABLE_PERFORMANCE_OPTIMIZATION": true
}
```

**Flag Toggle Procedures**:

1. **Emergency Disable** (< 2 minutes):

   ```bash
   # Disable all hybrid routing
   curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
     https://api.matbakh.app/admin/feature-flags/bedrock/disable-all
   ```

2. **Selective Disable** (< 5 minutes):
   ```bash
   # Disable specific feature
   curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
     -d '{"flag": "ENABLE_DIRECT_BEDROCK_FALLBACK", "enabled": false}' \
     https://api.matbakh.app/admin/feature-flags/bedrock/update
   ```

## Troubleshooting Guide

### Common Issues

#### 1. High P95 Latency

**Symptoms**:

- P95 latency > 1.5s consistently
- User complaints about slow responses
- Timeout errors increasing

**Diagnosis**:

```bash
# Check routing distribution
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://api.matbakh.app/admin/metrics/routing-distribution

# Check provider latencies
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://api.matbakh.app/admin/metrics/provider-latencies
```

**Resolution**:

1. Check if Direct Bedrock is healthy and responsive
2. Verify MCP router performance
3. Review routing decisions for optimization
4. Consider temporary routing rule adjustments

#### 2. High Error Rate

**Symptoms**:

- Error rate > 2% for extended period
- 5xx errors from specific providers
- Failed routing decisions

**Diagnosis**:

```bash
# Check error breakdown by provider
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://api.matbakh.app/admin/metrics/error-breakdown

# Check circuit breaker status
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://api.matbakh.app/admin/health/circuit-breakers
```

**Resolution**:

1. Identify failing provider or component
2. Check circuit breaker status and reset if needed
3. Verify provider credentials and quotas
4. Consider temporary provider disable if needed

#### 3. Low Cache Hit Rate

**Symptoms**:

- Cache hit rate < 80%
- Increased costs due to cache misses
- Slower response times for frequent queries

**Diagnosis**:

```bash
# Check cache performance
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://api.matbakh.app/admin/metrics/cache-performance

# Check cache configuration
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://api.matbakh.app/admin/config/cache-settings
```

**Resolution**:

1. Review cache TTL settings
2. Analyze query patterns for optimization
3. Consider cache warming for popular queries
4. Adjust cache size limits if needed

#### 4. Routing Inefficiency

**Symptoms**:

- High fallback rate (>20%)
- Suboptimal routing decisions
- Uneven load distribution

**Diagnosis**:

```bash
# Check routing efficiency
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://api.matbakh.app/admin/metrics/routing-efficiency

# Get routing recommendations
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://api.matbakh.app/admin/recommendations/routing
```

**Resolution**:

1. Review routing rules and thresholds
2. Analyze provider health and performance
3. Adjust routing weights if needed
4. Consider routing rule optimization

### Emergency Procedures

#### Complete System Rollback

**When to Execute**:

- Critical system failure affecting >50% of requests
- Security incident requiring immediate isolation
- Data integrity concerns

**Procedure**:

```bash
# 1. Immediate feature flag disable (< 2 minutes)
curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://api.matbakh.app/admin/emergency/disable-hybrid-routing

# 2. Verify rollback success
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://api.matbakh.app/admin/health/system-status

# 3. Monitor system recovery
watch -n 30 'curl -s https://api.matbakh.app/health | jq .status'
```

**Post-Rollback Actions**:

1. Notify stakeholders of rollback execution
2. Begin incident investigation
3. Document timeline and impact
4. Plan recovery and re-deployment

#### Partial Component Isolation

**When to Execute**:

- Single component failure (e.g., Direct Bedrock issues)
- Provider-specific problems
- Gradual performance degradation

**Procedure**:

```bash
# Isolate Direct Bedrock route
curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"component": "direct-bedrock", "action": "isolate"}' \
  https://api.matbakh.app/admin/emergency/isolate-component

# Force MCP-only routing
curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"routing_mode": "mcp_only"}' \
  https://api.matbakh.app/admin/config/routing-override
```

## Maintenance Procedures

### Planned Maintenance

**Pre-Maintenance Checklist**:

- [ ] Schedule maintenance window (low-traffic period)
- [ ] Notify stakeholders 24 hours in advance
- [ ] Prepare rollback procedures
- [ ] Verify backup systems operational

**During Maintenance**:

- [ ] Enable maintenance mode if needed
- [ ] Execute changes with validation at each step
- [ ] Monitor system health continuously
- [ ] Document all changes and results

**Post-Maintenance**:

- [ ] Validate all systems operational
- [ ] Run smoke tests for critical functionality
- [ ] Monitor for 2 hours post-maintenance
- [ ] Update documentation and runbooks

### Configuration Updates

**Routing Rule Updates**:

```bash
# Get current routing configuration
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://api.matbakh.app/admin/config/routing-rules

# Update routing rules (with validation)
curl -X PUT -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d @new-routing-rules.json \
  https://api.matbakh.app/admin/config/routing-rules

# Validate configuration
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://api.matbakh.app/admin/config/validate-routing
```

**Performance Threshold Updates**:

```bash
# Update SLO thresholds
curl -X PUT -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"p95_latency_ms": 1500, "error_rate_percent": 1.0}' \
  https://api.matbakh.app/admin/config/slo-thresholds
```

## Security and Compliance

### Security Monitoring

**Daily Security Checks**:

- [ ] Review security alerts and incidents
- [ ] Validate GDPR compliance status
- [ ] Check audit trail integrity
- [ ] Review access logs for anomalies

**Security Incident Response**:

1. **Immediate**: Isolate affected components
2. **Within 15 minutes**: Assess impact and scope
3. **Within 30 minutes**: Implement containment measures
4. **Within 1 hour**: Begin investigation and evidence collection
5. **Within 4 hours**: Provide stakeholder update

### Compliance Validation

**GDPR Compliance Checks**:

```bash
# Check GDPR compliance status
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://api.matbakh.app/admin/compliance/gdpr-status

# Validate EU data residency
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://api.matbakh.app/admin/compliance/data-residency
```

**Audit Trail Verification**:

```bash
# Verify audit trail completeness
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://api.matbakh.app/admin/audit/trail-integrity

# Export audit logs for compliance
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://api.matbakh.app/admin/audit/export?format=json&period=daily
```

## Performance Optimization

### Continuous Optimization

**Weekly Optimization Review**:

1. Analyze routing efficiency metrics
2. Review cache performance and hit rates
3. Identify cost optimization opportunities
4. Plan routing rule adjustments

**Monthly Performance Tuning**:

1. Comprehensive performance analysis
2. Provider performance comparison
3. Capacity planning and scaling review
4. SLO threshold optimization

### Cost Optimization

**Cost Monitoring**:

```bash
# Get current cost breakdown
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://api.matbakh.app/admin/metrics/cost-breakdown

# Get cost optimization recommendations
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://api.matbakh.app/admin/recommendations/cost-optimization
```

**Budget Management**:

- Monitor daily spend against budget
- Set up automated alerts at 80% and 95% budget utilization
- Review monthly cost trends and projections
- Implement cost controls and throttling as needed

## Contact Information

### On-Call Rotation

**Primary On-Call**: DevOps Team Lead

- Phone: [REDACTED]
- Slack: @devops-lead
- Email: devops-lead@matbakh.app

**Secondary On-Call**: AI Architecture Team Lead

- Phone: [REDACTED]
- Slack: @ai-architect
- Email: ai-architect@matbakh.app

**Escalation**: CTO

- Phone: [REDACTED]
- Slack: @cto
- Email: cto@matbakh.app

### Emergency Contacts

**AWS Support**: [AWS Support Case URL]
**Security Team**: security@matbakh.app
**Compliance Officer**: compliance@matbakh.app

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-14  
**Next Review**: Monthly  
**Owner**: DevOps Team
