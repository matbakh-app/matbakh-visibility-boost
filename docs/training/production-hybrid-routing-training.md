# Production Hybrid Routing Training Guide

## Overview

This training guide provides comprehensive education for operations team members on managing Bedrock Support Mode with Hybrid Routing in production. It covers system architecture, operational procedures, troubleshooting, and emergency response.

## Learning Objectives

By the end of this training, operations team members will be able to:

1. **Understand** the hybrid routing architecture and components
2. **Monitor** system health and performance metrics effectively
3. **Troubleshoot** common issues and performance problems
4. **Execute** rollback procedures safely and efficiently
5. **Respond** to emergencies following established protocols
6. **Maintain** system configuration and optimization

## Module 1: System Architecture

### 1.1 Hybrid Routing Overview

**What is Hybrid Routing?**
Hybrid Routing combines two AI communication paths:

- **Direct Bedrock**: Direct AWS Bedrock API calls for critical operations
- **MCP Router**: Model Context Protocol for standard operations

**Why Hybrid Routing?**

- **Performance**: Critical operations get <10s response times
- **Reliability**: Fallback mechanisms ensure high availability
- **Cost Optimization**: Intelligent routing reduces operational costs
- **Scalability**: Load distribution across multiple providers

### 1.2 Core Components

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

**Component Responsibilities**:

1. **Intelligent Router**:

   - Makes routing decisions based on operation type and priority
   - Monitors health of both routing paths
   - Implements fallback mechanisms

2. **Direct Bedrock Client**:

   - Handles emergency operations (<5s)
   - Processes critical support operations (<10s)
   - Maintains direct AWS Bedrock connection

3. **MCP Router**:

   - Processes standard operations
   - Communicates with Kiro through structured protocols
   - Handles background and low-priority tasks

4. **Hybrid Health Monitor**:
   - Monitors health of all components
   - Provides routing efficiency analysis
   - Generates optimization recommendations

### 1.3 Routing Decision Matrix

| Operation Type | Priority | Latency Req | Primary Route | Fallback |
| -------------- | -------- | ----------- | ------------- | -------- |
| Emergency      | Critical | < 5s        | Direct        | None     |
| Infrastructure | Critical | < 10s       | Direct        | MCP      |
| Meta Monitor   | High     | < 15s       | Direct        | MCP      |
| Implementation | High     | < 15s       | Direct        | MCP      |
| Kiro Comm      | Medium   | < 30s       | MCP           | Direct   |
| Standard       | Medium   | < 30s       | MCP           | Direct   |
| Background     | Low      | < 60s       | MCP           | Direct   |

**Key Concepts**:

- **Primary Route**: First choice for operation type
- **Fallback**: Used when primary route is unhealthy
- **Latency Requirements**: Maximum acceptable response time
- **Priority**: Determines routing preference and resource allocation

## Module 2: Monitoring and Metrics

### 2.1 Key Performance Indicators (KPIs)

**Performance Metrics**:

- **P95 Latency**: 95th percentile response time
  - Target: ≤1.5s for generation, ≤300ms for cached
- **Error Rate**: Percentage of failed requests
  - Target: ≤1.0%
- **Throughput**: Requests processed per second
- **Cache Hit Rate**: Percentage of requests served from cache
  - Target: ≥80%

**Routing Metrics**:

- **Routing Accuracy**: Percentage of optimal routing decisions
- **Fallback Rate**: Percentage of requests using fallback route
- **Load Distribution**: Traffic distribution across routes
- **Route Health**: Health status of each routing path

**Cost Metrics**:

- **Token Usage**: Tokens consumed per provider
- **Cost per Operation**: Average cost per request
- **Budget Utilization**: Percentage of budget consumed
  - Alert at 80%, critical at 95%

### 2.2 Dashboard Navigation

**Main Dashboard Sections**:

1. **System Overview**:

   - Overall system health status
   - Key metrics summary
   - Active alerts and warnings

2. **Performance Metrics**:

   - Real-time latency graphs
   - Error rate trends
   - Throughput monitoring

3. **Routing Analysis**:

   - Route distribution charts
   - Fallback frequency
   - Routing efficiency scores

4. **Cost Monitoring**:
   - Budget utilization
   - Cost trends
   - Provider cost breakdown

**Dashboard URLs**:

- Main: `https://monitoring.matbakh.app/hybrid-routing`
- Performance: `https://monitoring.matbakh.app/performance`
- Cost: `https://monitoring.matbakh.app/cost-tracking`

### 2.3 Alert Management

**Alert Severity Levels**:

**Critical** (Immediate Response Required):

- P95 Latency > 2.0s for 5+ minutes
- Error Rate > 5% for 2+ minutes
- Direct Bedrock connection failure
- Cost budget > 95%

**Warning** (Response within 30 minutes):

- P95 Latency > 1.5s for 10+ minutes
- Error Rate > 2% for 5+ minutes
- Cache Hit Rate < 70% for 15+ minutes
- Routing fallback rate > 20%

**Info** (Response within 2 hours):

- Cache Hit Rate < 80% for 30+ minutes
- Cost budget > 80%
- Routing efficiency < 90%

**Alert Response Procedures**:

1. **Acknowledge** alert in monitoring system
2. **Assess** impact and severity
3. **Investigate** root cause
4. **Take action** according to runbook procedures
5. **Document** resolution and lessons learned

## Module 3: Daily Operations

### 3.1 Daily Operational Checklist

**Morning Checklist (9:00 AM)**:

- [ ] Review overnight alerts and incidents
- [ ] Check system health dashboard
- [ ] Validate SLO compliance (P95, error rate, cost)
- [ ] Review routing efficiency metrics
- [ ] Check cache performance and hit rates
- [ ] Verify feature flag status

**Evening Checklist (6:00 PM)**:

- [ ] Review daily performance summary
- [ ] Check cost utilization and projections
- [ ] Validate security and compliance status
- [ ] Review any configuration changes
- [ ] Prepare overnight monitoring summary
- [ ] Update on-call handover notes

### 3.2 Weekly Operations

**Monday Review**:

- Weekly performance trend analysis
- Cost optimization review and recommendations
- Security posture assessment
- Routing efficiency optimization review

**Friday Planning**:

- Review week's incidents and resolutions
- Plan upcoming maintenance windows
- Update operational documentation
- Prepare weekly stakeholder report

### 3.3 Feature Flag Management

**Current Production Flags**:

```bash
ENABLE_BEDROCK_SUPPORT_MODE=true
ENABLE_INTELLIGENT_ROUTING=true
ENABLE_DIRECT_BEDROCK_FALLBACK=true
ENABLE_HYBRID_HEALTH_MONITORING=true
ENABLE_PERFORMANCE_OPTIMIZATION=true
```

**Flag Management Commands**:

**Check Flag Status**:

```bash
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://api.matbakh.app/admin/feature-flags/bedrock
```

**Emergency Disable All**:

```bash
curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://api.matbakh.app/admin/feature-flags/bedrock/disable-all
```

**Update Specific Flag**:

```bash
curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"flag": "ENABLE_DIRECT_BEDROCK_FALLBACK", "enabled": false}' \
  https://api.matbakh.app/admin/feature-flags/bedrock/update
```

## Module 4: Troubleshooting

### 4.1 Common Issues and Solutions

#### Issue 1: High P95 Latency

**Symptoms**:

- P95 latency consistently > 1.5s
- User complaints about slow responses
- Timeout errors increasing

**Diagnostic Steps**:

1. Check routing distribution:

   ```bash
   curl -H "Authorization: Bearer $ADMIN_TOKEN" \
     https://api.matbakh.app/admin/metrics/routing-distribution
   ```

2. Check provider latencies:

   ```bash
   curl -H "Authorization: Bearer $ADMIN_TOKEN" \
     https://api.matbakh.app/admin/metrics/provider-latencies
   ```

3. Review cache performance:
   ```bash
   curl -H "Authorization: Bearer $ADMIN_TOKEN" \
     https://api.matbakh.app/admin/metrics/cache-performance
   ```

**Resolution Steps**:

1. Verify Direct Bedrock health and responsiveness
2. Check MCP router performance metrics
3. Review routing decisions for optimization opportunities
4. Consider temporary routing rule adjustments
5. Enable aggressive caching if appropriate

#### Issue 2: High Error Rate

**Symptoms**:

- Error rate > 2% for extended period
- 5xx errors from specific providers
- Failed routing decisions

**Diagnostic Steps**:

1. Check error breakdown by provider:

   ```bash
   curl -H "Authorization: Bearer $ADMIN_TOKEN" \
     https://api.matbakh.app/admin/metrics/error-breakdown
   ```

2. Check circuit breaker status:
   ```bash
   curl -H "Authorization: Bearer $ADMIN_TOKEN" \
     https://api.matbakh.app/admin/health/circuit-breakers
   ```

**Resolution Steps**:

1. Identify failing provider or component
2. Check circuit breaker status and reset if needed
3. Verify provider credentials and quotas
4. Consider temporary provider disable if needed
5. Escalate to provider support if necessary

#### Issue 3: Low Cache Hit Rate

**Symptoms**:

- Cache hit rate < 80%
- Increased costs due to cache misses
- Slower response times for frequent queries

**Diagnostic Steps**:

1. Check cache performance metrics
2. Analyze query patterns
3. Review cache configuration settings

**Resolution Steps**:

1. Review cache TTL settings
2. Analyze query patterns for optimization
3. Consider cache warming for popular queries
4. Adjust cache size limits if needed

### 4.2 Escalation Procedures

**Level 1 - Operations Team**:

- Standard troubleshooting procedures
- Configuration adjustments
- Feature flag management
- Basic performance optimization

**Level 2 - Engineering Team**:

- Complex routing issues
- Provider integration problems
- Performance optimization requiring code changes
- Security or compliance issues

**Level 3 - Architecture Team**:

- System design issues
- Major performance problems
- Architectural changes required
- Cross-system integration issues

**Escalation Triggers**:

- Issue not resolved within 2 hours
- Multiple system components affected
- Customer impact exceeding SLA
- Security or compliance concerns

## Module 5: Emergency Response

### 5.1 Emergency Scenarios

**Scenario 1: Complete System Failure**

- **Trigger**: >50% of requests failing
- **Response**: Immediate rollback (< 5 minutes)
- **Procedure**: Execute emergency rollback script

**Scenario 2: Security Incident**

- **Trigger**: Security alert or compliance violation
- **Response**: Immediate isolation and investigation
- **Procedure**: Isolate affected components, notify security team

**Scenario 3: Cost Budget Exceeded**

- **Trigger**: Cost budget > 95%
- **Response**: Activate emergency cost controls
- **Procedure**: Enable aggressive caching, throttle non-critical operations

### 5.2 Emergency Response Procedures

**Immediate Response (0-5 minutes)**:

1. **Assess** situation severity
2. **Execute** appropriate emergency procedure
3. **Notify** on-call team and stakeholders
4. **Document** actions taken

**Short-term Response (5-30 minutes)**:

1. **Investigate** root cause
2. **Implement** additional mitigation measures
3. **Monitor** system recovery
4. **Communicate** status updates

**Long-term Response (30+ minutes)**:

1. **Conduct** detailed investigation
2. **Plan** permanent resolution
3. **Update** procedures and documentation
4. **Conduct** post-incident review

### 5.3 Communication Protocols

**Internal Communication**:

- **Slack**: #emergency-response channel
- **Email**: emergency@matbakh.app
- **Phone**: Emergency hotline for critical issues

**External Communication**:

- **Status Page**: Update for customer-facing issues
- **Customer Support**: Brief support team on impact
- **Stakeholders**: Regular updates during incidents

## Module 6: Maintenance and Optimization

### 6.1 Planned Maintenance

**Pre-Maintenance Checklist**:

- [ ] Schedule during low-traffic period
- [ ] Notify stakeholders 24 hours in advance
- [ ] Prepare rollback procedures
- [ ] Verify backup systems operational

**Maintenance Execution**:

- [ ] Enable maintenance mode if needed
- [ ] Execute changes with step-by-step validation
- [ ] Monitor system health continuously
- [ ] Document all changes and results

**Post-Maintenance**:

- [ ] Validate all systems operational
- [ ] Run smoke tests for critical functionality
- [ ] Monitor for 2 hours post-maintenance
- [ ] Update documentation and runbooks

### 6.2 Performance Optimization

**Weekly Optimization Tasks**:

1. Review routing efficiency metrics
2. Analyze cache performance and hit rates
3. Identify cost optimization opportunities
4. Plan routing rule adjustments

**Monthly Optimization Tasks**:

1. Comprehensive performance analysis
2. Provider performance comparison
3. Capacity planning and scaling review
4. SLO threshold optimization

### 6.3 Configuration Management

**Routing Rule Updates**:

```bash
# Get current configuration
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://api.matbakh.app/admin/config/routing-rules

# Update configuration
curl -X PUT -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d @new-routing-rules.json \
  https://api.matbakh.app/admin/config/routing-rules

# Validate changes
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

## Module 7: Security and Compliance

### 7.1 Security Monitoring

**Daily Security Tasks**:

- [ ] Review security alerts and incidents
- [ ] Validate GDPR compliance status
- [ ] Check audit trail integrity
- [ ] Review access logs for anomalies

**Security Incident Response**:

1. **Immediate** (0-15 minutes): Isolate affected components
2. **Short-term** (15-30 minutes): Assess impact and scope
3. **Medium-term** (30-60 minutes): Implement containment
4. **Long-term** (1+ hours): Investigation and evidence collection

### 7.2 Compliance Validation

**GDPR Compliance Checks**:

```bash
# Check compliance status
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://api.matbakh.app/admin/compliance/gdpr-status

# Validate data residency
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://api.matbakh.app/admin/compliance/data-residency
```

**Audit Trail Verification**:

```bash
# Verify audit trail integrity
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://api.matbakh.app/admin/audit/trail-integrity

# Export audit logs
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://api.matbakh.app/admin/audit/export?format=json&period=daily
```

## Training Exercises

### Exercise 1: System Health Check

**Objective**: Perform a complete system health assessment

**Tasks**:

1. Access the main monitoring dashboard
2. Check all key metrics (P95, error rate, cache hit rate)
3. Review routing distribution and efficiency
4. Validate feature flag status
5. Check cost utilization
6. Document any issues found

**Expected Duration**: 15 minutes

### Exercise 2: Alert Response

**Scenario**: P95 latency alert triggered (>1.5s for 10 minutes)

**Tasks**:

1. Acknowledge the alert
2. Investigate the root cause using diagnostic commands
3. Implement appropriate mitigation measures
4. Monitor system recovery
5. Document the incident and resolution

**Expected Duration**: 30 minutes

### Exercise 3: Emergency Rollback

**Scenario**: Critical system failure requiring immediate rollback

**Tasks**:

1. Execute emergency rollback procedure
2. Verify system recovery
3. Notify stakeholders
4. Document the rollback execution
5. Plan investigation and recovery

**Expected Duration**: 10 minutes

### Exercise 4: Configuration Update

**Scenario**: Update routing rules to optimize performance

**Tasks**:

1. Review current routing configuration
2. Identify optimization opportunities
3. Prepare updated configuration
4. Execute configuration update with validation
5. Monitor impact and performance improvement

**Expected Duration**: 45 minutes

## Certification Requirements

### Knowledge Assessment

**Written Exam** (80% passing score):

- System architecture and components (25%)
- Monitoring and metrics (25%)
- Troubleshooting procedures (25%)
- Emergency response (25%)

**Practical Assessment**:

- System health check exercise
- Alert response simulation
- Emergency rollback execution
- Configuration update procedure

### Certification Levels

**Level 1 - Operations Specialist**:

- Can perform daily operations
- Can respond to standard alerts
- Can execute basic troubleshooting

**Level 2 - Senior Operations Engineer**:

- Can handle complex troubleshooting
- Can execute emergency procedures
- Can perform system optimization

**Level 3 - Operations Team Lead**:

- Can make architectural decisions
- Can lead incident response
- Can train other team members

### Recertification

**Annual Requirements**:

- Complete refresher training
- Pass updated knowledge assessment
- Demonstrate proficiency in new features
- Participate in emergency response drills

## Resources and References

### Documentation Links

- [System Architecture Guide](./docs/ai-provider-architecture.md)
- [Operations Runbook](./docs/runbooks/production-hybrid-routing-operations.md)
- [Rollback Procedures](./docs/runbooks/production-hybrid-routing-rollback.md)
- [Troubleshooting Guide](./docs/runbooks/hybrid-routing-troubleshooting.md)

### Contact Information

**Training Coordinator**: training@matbakh.app
**Operations Team Lead**: ops-lead@matbakh.app
**Emergency Hotline**: [REDACTED]
**Slack Channel**: #ops-training

### Additional Resources

- **Video Tutorials**: Available in internal training portal
- **Practice Environment**: staging.matbakh.app
- **Knowledge Base**: kb.matbakh.app/hybrid-routing
- **Community Forum**: forum.matbakh.app/operations

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-14  
**Next Review**: Quarterly  
**Owner**: Operations Training Team
