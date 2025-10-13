# Bedrock Support Mode - Operations Runbook

**Version**: 1.0.0  
**Created**: 2025-01-14  
**Status**: Production-Ready  
**Owner**: AI Operations Team  
**Scope**: Bedrock Support Mode operational procedures

## Table of Contents

1. [Overview](#overview)
2. [Support Mode Components](#support-mode-components)
3. [Activation Procedures](#activation-procedures)
4. [Daily Operations](#daily-operations)
5. [Support Operations](#support-operations)
6. [Monitoring & Health Checks](#monitoring--health-checks)
7. [Troubleshooting](#troubleshooting)
8. [Emergency Procedures](#emergency-procedures)
9. [Compliance Operations](#compliance-operations)

## Overview

Bedrock Support Mode enables AWS Bedrock as a secondary AI operator to assist with infrastructure validation, implementation support, and meta-monitoring. This runbook provides operational procedures for managing Bedrock Support Mode in production.

### Key Capabilities

- **Infrastructure Auditing**: Automated system health checks and gap detection
- **Meta-Monitoring**: Kiro execution analysis and performance optimization
- **Implementation Support**: Automated remediation and backlog assistance
- **Hybrid Routing**: Intelligent routing between direct Bedrock and MCP paths

### Operational Principles

1. **Safety First**: Support mode never interferes with primary operations
2. **Intelligent Routing**: Automatic path selection based on operation type and health
3. **Comprehensive Monitoring**: Real-time health and performance tracking
4. **Compliance Maintained**: Full GDPR and security compliance across all operations

## Support Mode Components

### BedrockSupportManager

**Purpose**: Central orchestrator for all support operations  
**Health Endpoint**: `/health/bedrock-support`  
**Logs**: `/aws/ecs/bedrock-support`

**Key Operations**:

- Support mode activation/deactivation
- Infrastructure audit coordination
- Meta-monitoring orchestration
- Implementation support management

### InfrastructureAuditor

**Purpose**: Automated infrastructure health checks and gap detection  
**Health Endpoint**: `/health/infrastructure-auditor`  
**Logs**: `/aws/ecs/infrastructure-auditor`

**Key Operations**:

- System health validation
- Implementation gap detection
- Audit report generation
- Remediation recommendations

### MetaMonitor

**Purpose**: Kiro execution analysis and performance optimization  
**Health Endpoint**: `/health/meta-monitor`  
**Logs**: `/aws/ecs/meta-monitor`

**Key Operations**:

- Execution pattern analysis
- Failure cluster detection
- Performance bottleneck identification
- Optimization recommendations

### ImplementationSupport

**Purpose**: Automated implementation assistance and remediation  
**Health Endpoint**: `/health/implementation-support`  
**Logs**: `/aws/ecs/implementation-support`

**Key Operations**:

- Gap remediation suggestions
- Auto-resolution attempts
- Backlog analysis and prioritization
- Implementation guidance

## Activation Procedures

### Pre-Activation Checklist

- [ ] Verify all components healthy
- [ ] Confirm feature flags configured
- [ ] Validate AWS Bedrock access
- [ ] Check compliance settings
- [ ] Verify monitoring systems

### Support Mode Activation

#### Step 1: Environment Validation

```bash
# Check system health
curl https://api.matbakh.app/health/detailed

# Verify Bedrock access
aws bedrock-runtime invoke-model \
  --model-id anthropic.claude-3-sonnet-20240229-v1:0 \
  --body '{"anthropic_version":"bedrock-2023-05-31","max_tokens":10,"messages":[{"role":"user","content":"test"}]}' \
  --region eu-central-1 \
  output.json

# Check feature flags
curl https://api.matbakh.app/admin/feature-flags/bedrock-support
```

#### Step 2: Gradual Activation

```bash
# Enable support mode (initially inactive)
curl -X POST https://api.matbakh.app/admin/bedrock-support/enable \
  -H "Content-Type: application/json" \
  -d '{"active": false, "reason": "Initial activation"}'

# Activate infrastructure auditor only
curl -X POST https://api.matbakh.app/admin/bedrock-support/activate-component \
  -H "Content-Type: application/json" \
  -d '{"component": "infrastructure-auditor"}'

# Monitor for 15 minutes
watch -n 30 'curl -s https://api.matbakh.app/health/component/infrastructure-auditor | jq'
```

#### Step 3: Full Activation

```bash
# Activate all components
curl -X POST https://api.matbakh.app/admin/bedrock-support/activate \
  -H "Content-Type: application/json" \
  -d '{"components": ["all"], "reason": "Full production activation"}'

# Verify activation
curl https://api.matbakh.app/admin/bedrock-support/status
```

### Post-Activation Validation

```bash
# Run comprehensive health check
curl https://api.matbakh.app/health/bedrock-support/detailed

# Test each component
for component in infrastructure-auditor meta-monitor implementation-support; do
  echo "Testing $component:"
  curl -X POST https://api.matbakh.app/test/bedrock-support/$component
done

# Monitor for 30 minutes
watch -n 60 'curl -s https://api.matbakh.app/health/bedrock-support | jq .status'
```

## Daily Operations

### Morning Support Mode Check (08:15 UTC)

**Duration**: 10 minutes  
**Frequency**: Daily  
**Owner**: AI Operations engineer

#### Step 1: Support Mode Health (3 minutes)

```bash
# Check support mode status
curl https://api.matbakh.app/admin/bedrock-support/status

# Verify all components healthy
curl https://api.matbakh.app/health/bedrock-support/detailed | \
  jq '.components | to_entries[] | select(.value.status != "healthy")'
```

#### Step 2: Overnight Activity Review (4 minutes)

```bash
# Check infrastructure audits performed
curl https://api.matbakh.app/admin/bedrock-support/audits/last-24h

# Review meta-monitoring insights
curl https://api.matbakh.app/admin/bedrock-support/meta-monitor/insights

# Check implementation support activities
curl https://api.matbakh.app/admin/bedrock-support/implementation/activities
```

#### Step 3: Performance Validation (3 minutes)

```bash
# Check support operation latencies
aws cloudwatch get-metric-statistics \
  --namespace "BedrockSupport/Performance" \
  --metric-name "OperationLatency" \
  --start-time $(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 3600 \
  --statistics Average

# Verify routing efficiency
curl https://api.matbakh.app/admin/bedrock-support/routing/efficiency
```

### Weekly Support Mode Review (Sunday 10:30 UTC)

**Duration**: 30 minutes  
**Frequency**: Weekly  
**Owner**: AI Operations team lead

#### Infrastructure Audit Analysis (10 minutes)

1. Review weekly audit findings
2. Analyze gap detection trends
3. Evaluate remediation success rates
4. Update audit configurations

#### Meta-Monitoring Insights (10 minutes)

1. Analyze Kiro execution patterns
2. Review performance optimization results
3. Identify recurring issues
4. Update monitoring thresholds

#### Implementation Support Review (10 minutes)

1. Review auto-resolution success rates
2. Analyze backlog prioritization effectiveness
3. Evaluate implementation guidance quality
4. Update support algorithms

## Support Operations

### Infrastructure Auditing

#### Manual Audit Trigger

```bash
# Trigger comprehensive infrastructure audit
curl -X POST https://api.matbakh.app/admin/bedrock-support/audit/trigger \
  -H "Content-Type: application/json" \
  -d '{
    "type": "comprehensive",
    "priority": "high",
    "reason": "Manual trigger for investigation"
  }'

# Monitor audit progress
curl https://api.matbakh.app/admin/bedrock-support/audit/status/{audit-id}
```

#### Audit Results Review

```bash
# Get latest audit results
curl https://api.matbakh.app/admin/bedrock-support/audit/latest

# Get specific audit details
curl https://api.matbakh.app/admin/bedrock-support/audit/{audit-id}/details

# Export audit report
curl https://api.matbakh.app/admin/bedrock-support/audit/{audit-id}/export
```

### Meta-Monitoring Operations

#### Kiro Execution Analysis

```bash
# Trigger Kiro execution analysis
curl -X POST https://api.matbakh.app/admin/bedrock-support/meta-monitor/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "timeframe": "last-24h",
    "focus": "performance",
    "priority": "high"
  }'

# Get analysis results
curl https://api.matbakh.app/admin/bedrock-support/meta-monitor/results/latest
```

#### Performance Optimization

```bash
# Get optimization recommendations
curl https://api.matbakh.app/admin/bedrock-support/meta-monitor/recommendations

# Apply optimization (with approval)
curl -X POST https://api.matbakh.app/admin/bedrock-support/meta-monitor/optimize \
  -H "Content-Type: application/json" \
  -d '{
    "recommendation_id": "opt-12345",
    "approved_by": "ops-engineer",
    "apply": true
  }'
```

### Implementation Support Operations

#### Gap Remediation

```bash
# Get current implementation gaps
curl https://api.matbakh.app/admin/bedrock-support/implementation/gaps

# Trigger remediation for specific gap
curl -X POST https://api.matbakh.app/admin/bedrock-support/implementation/remediate \
  -H "Content-Type: application/json" \
  -d '{
    "gap_id": "gap-12345",
    "auto_resolve": true,
    "priority": "high"
  }'
```

#### Backlog Management

```bash
# Get backlog analysis
curl https://api.matbakh.app/admin/bedrock-support/implementation/backlog

# Update backlog priorities
curl -X POST https://api.matbakh.app/admin/bedrock-support/implementation/backlog/prioritize \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"id": "item-1", "priority": "high"},
      {"id": "item-2", "priority": "medium"}
    ]
  }'
```

## Monitoring & Health Checks

### Health Check Procedures

#### Component Health Validation

```bash
# Check all support mode components
for component in bedrock-support infrastructure-auditor meta-monitor implementation-support; do
  echo "=== $component ==="
  curl -s https://api.matbakh.app/health/component/$component | jq
  echo
done
```

#### Performance Monitoring

```bash
# Check support operation metrics
curl https://api.matbakh.app/admin/bedrock-support/metrics/performance

# Get routing efficiency metrics
curl https://api.matbakh.app/admin/bedrock-support/metrics/routing

# Check resource utilization
curl https://api.matbakh.app/admin/bedrock-support/metrics/resources
```

### Alert Configuration

#### Critical Alerts (P0)

- Support mode completely unavailable
- All components failing health checks
- Security compliance violations
- Data corruption in audit trails

#### High Priority Alerts (P1)

- Single component failure
- Performance degradation >50%
- Routing efficiency <60%
- High error rate in support operations

#### Medium Priority Alerts (P2)

- Performance degradation 20-50%
- Routing efficiency 60-80%
- Non-critical component warnings
- Configuration drift detected

### Monitoring Dashboards

#### Support Mode Overview Dashboard

**URL**: https://console.aws.amazon.com/cloudwatch/dashboards/Bedrock-Support-Overview

**Widgets**:

- Support mode activation status
- Component health matrix
- Operation success rates
- Performance metrics
- Error rate trends

#### Support Operations Dashboard

**URL**: https://console.aws.amazon.com/cloudwatch/dashboards/Bedrock-Support-Operations

**Widgets**:

- Infrastructure audit results
- Meta-monitoring insights
- Implementation support activities
- Routing decision analytics
- Cost tracking

## Troubleshooting

### Common Issues

#### Issue 1: Support Mode Activation Failure

**Symptoms**:

- Activation API returns error
- Components remain inactive
- Health checks fail

**Investigation**:

```bash
# Check feature flags
curl https://api.matbakh.app/admin/feature-flags/bedrock-support

# Verify AWS Bedrock access
aws bedrock-runtime invoke-model \
  --model-id anthropic.claude-3-sonnet-20240229-v1:0 \
  --body '{"anthropic_version":"bedrock-2023-05-31","max_tokens":10,"messages":[{"role":"user","content":"test"}]}' \
  --region eu-central-1 \
  output.json

# Check IAM permissions
aws iam simulate-principal-policy \
  --policy-source-arn arn:aws:iam::account:role/bedrock-support-role \
  --action-names bedrock:InvokeModel \
  --resource-arns "*"
```

**Resolution**:

1. Verify feature flags are properly configured
2. Check AWS Bedrock service availability
3. Validate IAM permissions and roles
4. Restart support mode components if needed

#### Issue 2: Infrastructure Audit Failures

**Symptoms**:

- Audits timing out or failing
- Incomplete audit results
- High audit error rate

**Investigation**:

```bash
# Check audit logs
aws logs filter-log-events \
  --log-group-name "/aws/ecs/infrastructure-auditor" \
  --filter-pattern "ERROR" \
  --start-time $(date -u -d '1 hour ago' +%s)000

# Check audit configuration
curl https://api.matbakh.app/admin/bedrock-support/audit/config

# Verify system access permissions
curl https://api.matbakh.app/admin/bedrock-support/audit/permissions
```

**Resolution**:

1. Increase audit timeout values
2. Check system access permissions
3. Restart infrastructure auditor component
4. Update audit configuration if needed

#### Issue 3: Poor Meta-Monitoring Performance

**Symptoms**:

- Slow analysis completion
- Inaccurate performance insights
- High resource usage

**Investigation**:

```bash
# Check meta-monitor performance
curl https://api.matbakh.app/admin/bedrock-support/meta-monitor/performance

# Review analysis configuration
curl https://api.matbakh.app/admin/bedrock-support/meta-monitor/config

# Check resource utilization
aws cloudwatch get-metric-statistics \
  --namespace "BedrockSupport/Resources" \
  --metric-name "CPUUtilization" \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average
```

**Resolution**:

1. Optimize analysis algorithms
2. Adjust resource allocation
3. Update analysis configuration
4. Implement caching for frequent analyses

## Emergency Procedures

### Support Mode Emergency Shutdown

#### When to Use Emergency Shutdown

- Security breach detected in support operations
- Support mode causing system instability
- Compliance violations detected
- Critical errors affecting primary operations

#### Emergency Shutdown Procedure

```bash
# Immediate shutdown of all support operations
curl -X POST https://api.matbakh.app/admin/bedrock-support/emergency/shutdown \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Emergency shutdown - [reason]",
    "initiated_by": "[operator-name]",
    "immediate": true
  }'

# Verify shutdown
curl https://api.matbakh.app/admin/bedrock-support/status

# Disable feature flags
curl -X POST https://api.matbakh.app/admin/feature-flags/bedrock-support/disable

# Monitor system stability
watch -n 30 'curl -s https://api.matbakh.app/health | jq .status'
```

### Support Mode Recovery

#### Recovery Procedure

1. **Investigate Root Cause** (15-30 minutes)

   - Analyze logs and metrics
   - Identify failure points
   - Document findings

2. **Implement Fixes** (30-60 minutes)

   - Apply necessary fixes
   - Update configurations
   - Test components individually

3. **Gradual Reactivation** (30-45 minutes)

   ```bash
   # Enable feature flags
   curl -X POST https://api.matbakh.app/admin/feature-flags/bedrock-support/enable

   # Activate components one by one
   for component in infrastructure-auditor meta-monitor implementation-support; do
     echo "Activating $component..."
     curl -X POST https://api.matbakh.app/admin/bedrock-support/activate-component \
       -H "Content-Type: application/json" \
       -d "{\"component\": \"$component\"}"

     # Monitor for 10 minutes
     sleep 600

     # Check health
     curl https://api.matbakh.app/health/component/$component
   done
   ```

4. **Full Validation** (15-30 minutes)
   - Run comprehensive tests
   - Verify all operations
   - Monitor for stability

## Compliance Operations

### GDPR Compliance Monitoring

#### Daily Compliance Checks

```bash
# Check GDPR compliance status
curl https://api.matbakh.app/admin/bedrock-support/compliance/gdpr/status

# Verify EU data residency
curl https://api.matbakh.app/admin/bedrock-support/compliance/gdpr/residency

# Check PII detection and redaction
curl https://api.matbakh.app/admin/bedrock-support/compliance/pii/status
```

#### Compliance Reporting

```bash
# Generate compliance report
curl https://api.matbakh.app/admin/bedrock-support/compliance/report \
  -H "Content-Type: application/json" \
  -d '{
    "period": "weekly",
    "include_details": true,
    "format": "json"
  }'

# Export for audit
curl https://api.matbakh.app/admin/bedrock-support/compliance/export
```

### Audit Trail Management

#### Audit Trail Verification

```bash
# Verify audit trail completeness
curl https://api.matbakh.app/admin/bedrock-support/audit-trail/verify

# Check for any gaps
curl https://api.matbakh.app/admin/bedrock-support/audit-trail/gaps

# Validate integrity
curl https://api.matbakh.app/admin/bedrock-support/audit-trail/integrity
```

#### Audit Trail Maintenance

```bash
# Archive old audit records
curl -X POST https://api.matbakh.app/admin/bedrock-support/audit-trail/archive \
  -H "Content-Type: application/json" \
  -d '{
    "older_than": "90d",
    "destination": "s3://audit-archive/bedrock-support"
  }'

# Clean up processed records
curl -X POST https://api.matbakh.app/admin/bedrock-support/audit-trail/cleanup
```

---

## Appendix

### Command Reference

```bash
# Support Mode Management
curl https://api.matbakh.app/admin/bedrock-support/status
curl -X POST https://api.matbakh.app/admin/bedrock-support/activate
curl -X POST https://api.matbakh.app/admin/bedrock-support/deactivate

# Component Operations
curl https://api.matbakh.app/health/component/{component}
curl -X POST https://api.matbakh.app/admin/bedrock-support/audit/trigger
curl https://api.matbakh.app/admin/bedrock-support/meta-monitor/analyze

# Monitoring
curl https://api.matbakh.app/admin/bedrock-support/metrics/performance
curl https://api.matbakh.app/admin/bedrock-support/metrics/routing
aws logs tail /aws/ecs/bedrock-support --follow --since 10m
```

### Contact Information

| Role                   | Contact                     | Escalation |
| ---------------------- | --------------------------- | ---------- |
| AI Operations Engineer | Slack #ops-ai               | 15 minutes |
| Bedrock Support Lead   | bedrock-support@matbakh.app | 30 minutes |
| Engineering Manager    | eng-mgr@matbakh.app         | 1 hour     |

---

**Document Control**

- **Version**: 1.0.0
- **Created**: 2025-01-14
- **Last Updated**: 2025-01-14
- **Next Review**: 2025-02-14
- **Owner**: AI Operations Team
- **Approved By**: [AI Operations Lead], [Engineering Manager]
