# Hybrid Routing - Complete Production Operations Runbook

**Version**: 1.0.0  
**Created**: 2025-01-14  
**Status**: Production-Ready  
**Owner**: Production Operations Team  
**Scope**: Complete production operational procedures for hybrid routing deployment

## Table of Contents

1. [Production Deployment Operations](#production-deployment-operations)
2. [Go-Live Procedures](#go-live-procedures)
3. [Production Monitoring](#production-monitoring)
4. [Operational Handover](#operational-handover)
5. [Production Support](#production-support)
6. [Change Management](#change-management)
7. [Disaster Recovery](#disaster-recovery)
8. [Performance Management](#performance-management)

## Production Deployment Operations

### Pre-Deployment Operations

#### Infrastructure Readiness Validation

**Timeline**: T-24 hours before deployment  
**Duration**: 2 hours  
**Owner**: Infrastructure Team

```bash
# Validate production infrastructure
./scripts/validate-production-infrastructure.sh

# Check AWS Bedrock quotas and limits
aws service-quotas get-service-quota \
  --service-code bedrock \
  --quota-code L-12345678

# Verify KMS key access
aws kms describe-key --key-id alias/bedrock-support-production

# Validate VPC and security groups
aws ec2 describe-security-groups \
  --filters Name=group-name,Values=hybrid-routing-production

# Check CloudWatch dashboard configuration
aws cloudwatch list-dashboards | grep -i hybrid-routing
```

#### Application Readiness Validation

**Timeline**: T-12 hours before deployment  
**Duration**: 1 hour  
**Owner**: Development Team

```bash
# Run pre-deployment tests
npm run test:pre-deployment

# Validate configuration files
npm run validate:config:production

# Check feature flag configuration
curl https://api-staging.matbakh.app/admin/feature-flags/bedrock-support

# Verify database migrations
npm run db:migrate:check

# Validate secrets and environment variables
./scripts/validate-production-secrets.sh
```

### Deployment Execution

#### Phase 1: Infrastructure Deployment (T-0 to T+30 minutes)

**Owner**: DevOps Team

```bash
# Deploy infrastructure components
cd infra/cdk
npm run deploy:production

# Verify ECS cluster deployment
aws ecs describe-clusters --clusters hybrid-routing-production

# Check ALB configuration
aws elbv2 describe-load-balancers \
  --names hybrid-routing-production-alb

# Validate service discovery
aws servicediscovery list-services \
  --filters Name=NAMESPACE_ID,Values=ns-hybrid-routing-prod
```

#### Phase 2: Application Deployment (T+30 to T+60 minutes)

**Owner**: Release Team

```bash
# Deploy application services
./scripts/deploy-production-hybrid-routing.ts

# Monitor deployment progress
watch -n 30 'aws ecs describe-services \
  --cluster hybrid-routing-production \
  --services hybrid-routing-service | \
  jq ".services[0].deployments"'

# Verify health checks
curl https://api.matbakh.app/health/detailed

# Check service registration
aws servicediscovery get-service \
  --id srv-hybrid-routing-prod
```

#### Phase 3: Configuration Activation (T+60 to T+90 minutes)

**Owner**: Operations Team

```bash
# Enable feature flags gradually
curl -X POST https://api.matbakh.app/admin/feature-flags/bedrock-support/enable \
  -H "Content-Type: application/json" \
  -d '{"percentage": 0, "reason": "Initial deployment"}'

# Activate monitoring
curl -X POST https://api.matbakh.app/admin/monitoring/activate

# Enable health checks
curl -X POST https://api.matbakh.app/admin/health-checks/enable

# Verify all systems ready
./scripts/verify-production-readiness.sh
```

### Post-Deployment Validation

#### Smoke Testing (T+90 to T+120 minutes)

**Owner**: QA Team

```bash
# Run production smoke tests
npm run test:smoke:production

# Test each component individually
for component in bedrock-support intelligent-router direct-bedrock mcp-router; do
  echo "Testing $component..."
  curl -X POST https://api.matbakh.app/test/component/$component
done

# Validate end-to-end workflows
npm run test:e2e:production:critical

# Check performance baselines
./scripts/validate-performance-baselines.sh
```

## Go-Live Procedures

### Traffic Ramp-Up Strategy

#### Phase 1: Canary Deployment (0-5% traffic)

**Duration**: 30 minutes  
**Owner**: Release Manager

```bash
# Enable 5% traffic to hybrid routing
curl -X POST https://api.matbakh.app/admin/traffic/hybrid-routing \
  -H "Content-Type: application/json" \
  -d '{"percentage": 5, "reason": "Canary deployment"}'

# Monitor canary metrics
watch -n 60 'curl -s https://api.matbakh.app/admin/metrics/canary | jq'

# Check error rates and latency
aws cloudwatch get-metric-statistics \
  --namespace "HybridRouting/Canary" \
  --metric-name "ErrorRate" \
  --start-time $(date -u -d '30 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average
```

**Go/No-Go Criteria**:

- Error rate <1%
- P95 latency within SLA
- No critical alerts
- All health checks passing

#### Phase 2: Limited Rollout (5-25% traffic)

**Duration**: 45 minutes  
**Owner**: Release Manager

```bash
# Increase traffic to 25%
curl -X POST https://api.matbakh.app/admin/traffic/hybrid-routing \
  -H "Content-Type: application/json" \
  -d '{"percentage": 25, "reason": "Limited rollout"}'

# Monitor system performance
./scripts/monitor-rollout-performance.sh

# Check routing efficiency
curl https://api.matbakh.app/admin/metrics/routing-efficiency
```

#### Phase 3: Majority Rollout (25-75% traffic)

**Duration**: 60 minutes  
**Owner**: Release Manager

```bash
# Increase traffic to 75%
curl -X POST https://api.matbakh.app/admin/traffic/hybrid-routing \
  -H "Content-Type: application/json" \
  -d '{"percentage": 75, "reason": "Majority rollout"}'

# Monitor all key metrics
./scripts/monitor-full-rollout.sh

# Validate business metrics
curl https://api.matbakh.app/admin/metrics/business-impact
```

#### Phase 4: Full Deployment (75-100% traffic)

**Duration**: 30 minutes  
**Owner**: Release Manager

```bash
# Complete rollout to 100%
curl -X POST https://api.matbakh.app/admin/traffic/hybrid-routing \
  -H "Content-Type: application/json" \
  -d '{"percentage": 100, "reason": "Full deployment"}'

# Final validation
npm run test:production:full-validation

# Enable all production features
curl -X POST https://api.matbakh.app/admin/features/production/enable-all
```

### Rollback Procedures

#### Automatic Rollback Triggers

```bash
# Configure automatic rollback conditions
curl -X POST https://api.matbakh.app/admin/rollback/configure \
  -H "Content-Type: application/json" \
  -d '{
    "error_rate_threshold": 5,
    "latency_threshold_p95": 15000,
    "health_check_failures": 3,
    "business_metric_degradation": 20
  }'
```

#### Manual Rollback Execution

```bash
# Level 1: Feature flag rollback (< 2 minutes)
curl -X POST https://api.matbakh.app/admin/rollback/feature-flags

# Level 2: Traffic rollback (< 5 minutes)
curl -X POST https://api.matbakh.app/admin/rollback/traffic

# Level 3: Full system rollback (< 10 minutes)
./scripts/execute-full-rollback.sh
```

## Production Monitoring

### Real-Time Monitoring Setup

#### CloudWatch Dashboards

```bash
# Create production monitoring dashboards
aws cloudwatch put-dashboard \
  --dashboard-name "HybridRouting-Production-Overview" \
  --dashboard-body file://dashboards/production-overview.json

aws cloudwatch put-dashboard \
  --dashboard-name "HybridRouting-Production-Performance" \
  --dashboard-body file://dashboards/production-performance.json

aws cloudwatch put-dashboard \
  --dashboard-name "HybridRouting-Production-Security" \
  --dashboard-body file://dashboards/production-security.json
```

#### Alerting Configuration

```bash
# Configure production alerts
./scripts/configure-production-alerts.sh

# Test alert delivery
curl -X POST https://api.matbakh.app/admin/alerts/test \
  -H "Content-Type: application/json" \
  -d '{"type": "test", "severity": "info"}'

# Verify PagerDuty integration
curl -X POST https://api.matbakh.app/admin/alerts/test-pagerduty
```

### Key Performance Indicators

#### System Health KPIs

| Metric              | Target | Warning | Critical | Action                   |
| ------------------- | ------ | ------- | -------- | ------------------------ |
| System Availability | 99.9%  | <99.9%  | <99.5%   | Immediate investigation  |
| Response Time P95   | <1s    | >1s     | >2s      | Performance optimization |
| Error Rate          | <0.1%  | >0.1%   | >1%      | Error investigation      |
| Routing Efficiency  | >85%   | <85%    | <75%     | Routing optimization     |

#### Business Impact KPIs

| Metric            | Target        | Warning | Critical | Action               |
| ----------------- | ------------- | ------- | -------- | -------------------- |
| User Satisfaction | >95%          | <95%    | <90%     | UX investigation     |
| Feature Adoption  | >80%          | <80%    | <70%     | Feature optimization |
| Cost Efficiency   | Within budget | +10%    | +20%     | Cost optimization    |
| Security Score    | >95%          | <95%    | <90%     | Security review      |

### Monitoring Procedures

#### Hourly Monitoring (24/7)

**Owner**: On-call engineer

```bash
# Check system health
curl https://api.matbakh.app/health/production

# Review active alerts
aws cloudwatch describe-alarms --state-value ALARM

# Check key metrics
./scripts/check-hourly-metrics.sh

# Update status page if needed
curl -X POST https://status.matbakh.app/api/update
```

#### Daily Monitoring (Business hours)

**Owner**: Operations team

```bash
# Generate daily health report
./scripts/generate-daily-report.sh

# Review performance trends
./scripts/analyze-daily-trends.sh

# Check capacity utilization
./scripts/check-capacity-utilization.sh

# Update operational dashboard
./scripts/update-ops-dashboard.sh
```

## Operational Handover

### Handover Checklist

#### From Development to Operations

- [ ] All deployment scripts tested and documented
- [ ] Monitoring and alerting configured
- [ ] Runbooks updated and validated
- [ ] Emergency procedures tested
- [ ] Contact information updated
- [ ] Access permissions configured
- [ ] Documentation complete and accessible

#### From Release to Operations

- [ ] Deployment completed successfully
- [ ] All smoke tests passed
- [ ] Performance baselines established
- [ ] Monitoring systems active
- [ ] Alert thresholds configured
- [ ] Rollback procedures tested
- [ ] Operations team trained

### Knowledge Transfer

#### Technical Handover Session

**Duration**: 2 hours  
**Attendees**: Development team, Operations team, Release team

**Agenda**:

1. System architecture overview (30 minutes)
2. Deployment procedures walkthrough (30 minutes)
3. Monitoring and alerting demo (30 minutes)
4. Troubleshooting scenarios (30 minutes)

#### Operations Training

**Duration**: 4 hours  
**Attendees**: Operations team

**Modules**:

1. Daily operations procedures (1 hour)
2. Incident response procedures (1 hour)
3. Performance monitoring and optimization (1 hour)
4. Emergency procedures and rollback (1 hour)

### Documentation Handover

#### Required Documentation

- [ ] System architecture diagrams
- [ ] API documentation
- [ ] Configuration management guide
- [ ] Monitoring and alerting guide
- [ ] Troubleshooting procedures
- [ ] Emergency contact information
- [ ] Escalation procedures

## Production Support

### Support Tiers

#### Tier 1: Operations Team (24/7)

**Responsibilities**:

- Monitor system health
- Respond to alerts
- Execute standard procedures
- Escalate complex issues

**Response Times**:

- P0: Immediate (0-5 minutes)
- P1: 15 minutes
- P2: 1 hour
- P3: Next business day

#### Tier 2: Engineering Team (Business hours + on-call)

**Responsibilities**:

- Investigate complex issues
- Implement fixes and optimizations
- Update configurations
- Provide technical guidance

**Response Times**:

- P0: 15 minutes
- P1: 1 hour
- P2: 4 hours
- P3: Next business day

#### Tier 3: Architecture Team (On-call for P0)

**Responsibilities**:

- Architectural decisions
- Major system changes
- Disaster recovery
- Strategic planning

**Response Times**:

- P0: 30 minutes
- P1: 4 hours
- P2: Next business day
- P3: Planned work

### Support Procedures

#### Incident Response

```bash
# Incident detection
./scripts/detect-incident.sh

# Initial response
./scripts/incident-initial-response.sh

# Investigation
./scripts/incident-investigation.sh

# Resolution
./scripts/incident-resolution.sh

# Post-incident
./scripts/incident-post-mortem.sh
```

#### Change Management

```bash
# Change request
./scripts/create-change-request.sh

# Change approval
./scripts/approve-change.sh

# Change implementation
./scripts/implement-change.sh

# Change validation
./scripts/validate-change.sh
```

## Change Management

### Change Categories

#### Standard Changes

**Definition**: Pre-approved, low-risk changes with documented procedures  
**Approval**: Automatic  
**Examples**: Configuration updates, routine maintenance, security patches

```bash
# Execute standard change
./scripts/execute-standard-change.sh \
  --type configuration \
  --change-id CHG-12345 \
  --auto-approve
```

#### Normal Changes

**Definition**: Changes requiring approval and risk assessment  
**Approval**: Change Advisory Board  
**Examples**: Feature deployments, infrastructure changes, major updates

```bash
# Submit normal change request
./scripts/submit-change-request.sh \
  --type normal \
  --description "Deploy hybrid routing v2.0" \
  --risk-level medium \
  --approvers "cab@matbakh.app"
```

#### Emergency Changes

**Definition**: Urgent changes to resolve critical issues  
**Approval**: Emergency Change Advisory Board  
**Examples**: Security fixes, critical bug fixes, system recovery

```bash
# Execute emergency change
./scripts/execute-emergency-change.sh \
  --type emergency \
  --description "Fix critical security vulnerability" \
  --approver "cto@matbakh.app" \
  --justification "CVE-2024-12345"
```

### Change Process

#### Change Planning

1. **Change Request Creation**

   - Define scope and objectives
   - Assess risks and impact
   - Plan implementation steps
   - Identify rollback procedures

2. **Risk Assessment**

   - Technical risk evaluation
   - Business impact analysis
   - Security implications
   - Compliance considerations

3. **Approval Process**
   - Submit to appropriate board
   - Provide risk assessment
   - Get stakeholder sign-off
   - Schedule implementation

#### Change Implementation

1. **Pre-Implementation**

   ```bash
   # Validate prerequisites
   ./scripts/validate-change-prerequisites.sh

   # Create backup/snapshot
   ./scripts/create-change-backup.sh

   # Notify stakeholders
   ./scripts/notify-change-start.sh
   ```

2. **Implementation**

   ```bash
   # Execute change
   ./scripts/execute-change.sh

   # Monitor progress
   ./scripts/monitor-change-progress.sh

   # Validate results
   ./scripts/validate-change-results.sh
   ```

3. **Post-Implementation**

   ```bash
   # Verify success
   ./scripts/verify-change-success.sh

   # Update documentation
   ./scripts/update-change-documentation.sh

   # Close change request
   ./scripts/close-change-request.sh
   ```

## Disaster Recovery

### Disaster Recovery Planning

#### Recovery Objectives

- **RTO (Recovery Time Objective)**: 4 hours
- **RPO (Recovery Point Objective)**: 1 hour
- **Service Level**: 99.9% availability during recovery

#### Disaster Scenarios

1. **Complete Data Center Failure**

   - Activate secondary region
   - Restore from backups
   - Redirect traffic

2. **Application Failure**

   - Rollback to previous version
   - Restore from application backup
   - Investigate root cause

3. **Database Corruption**
   - Restore from database backup
   - Replay transaction logs
   - Validate data integrity

### Disaster Recovery Procedures

#### Multi-Region Failover

```bash
# Activate disaster recovery
./scripts/activate-disaster-recovery.sh

# Failover to secondary region
./scripts/failover-to-secondary.sh

# Validate secondary region
./scripts/validate-secondary-region.sh

# Update DNS routing
./scripts/update-dns-failover.sh
```

#### Data Recovery

```bash
# Restore from backup
./scripts/restore-from-backup.sh \
  --backup-id backup-20250114-120000 \
  --target-environment production

# Validate data integrity
./scripts/validate-data-integrity.sh

# Resume operations
./scripts/resume-operations.sh
```

### Recovery Testing

#### Monthly DR Tests

**Schedule**: First Sunday of each month  
**Duration**: 4 hours  
**Owner**: DR Team

```bash
# Execute DR test
./scripts/execute-dr-test.sh \
  --scenario complete-failure \
  --environment dr-test

# Validate recovery procedures
./scripts/validate-dr-procedures.sh

# Generate DR test report
./scripts/generate-dr-report.sh
```

## Performance Management

### Performance Monitoring

#### Real-Time Performance Tracking

```bash
# Monitor real-time performance
./scripts/monitor-realtime-performance.sh

# Check performance against SLA
./scripts/check-performance-sla.sh

# Generate performance alerts
./scripts/generate-performance-alerts.sh
```

#### Performance Optimization

```bash
# Analyze performance bottlenecks
./scripts/analyze-performance-bottlenecks.sh

# Optimize system configuration
./scripts/optimize-system-config.sh

# Validate performance improvements
./scripts/validate-performance-improvements.sh
```

### Capacity Management

#### Capacity Planning

```bash
# Analyze capacity trends
./scripts/analyze-capacity-trends.sh

# Forecast capacity needs
./scripts/forecast-capacity-needs.sh

# Plan capacity scaling
./scripts/plan-capacity-scaling.sh
```

#### Auto-Scaling Configuration

```bash
# Configure auto-scaling policies
./scripts/configure-auto-scaling.sh

# Monitor scaling events
./scripts/monitor-scaling-events.sh

# Optimize scaling parameters
./scripts/optimize-scaling-parameters.sh
```

---

## Appendix

### Production Command Reference

```bash
# Deployment
./scripts/deploy-production-hybrid-routing.ts
./scripts/validate-production-readiness.sh
./scripts/execute-rollback.sh

# Monitoring
curl https://api.matbakh.app/health/production
./scripts/check-production-metrics.sh
./scripts/generate-production-report.sh

# Operations
./scripts/execute-maintenance.sh
./scripts/handle-incident.sh
./scripts/execute-change.sh

# Disaster Recovery
./scripts/activate-disaster-recovery.sh
./scripts/execute-dr-test.sh
./scripts/restore-from-backup.sh
```

### Contact Information

| Role                | Primary                 | Secondary   | Emergency |
| ------------------- | ----------------------- | ----------- | --------- |
| Operations Manager  | ops-mgr@matbakh.app     | +1-555-0101 | PagerDuty |
| Release Manager     | release-mgr@matbakh.app | +1-555-0102 | PagerDuty |
| Engineering Manager | eng-mgr@matbakh.app     | +1-555-0103 | Phone     |
| CTO                 | cto@matbakh.app         | +1-555-0104 | Phone     |

### Links and Resources

- [Production Dashboard](https://console.aws.amazon.com/cloudwatch/dashboards/HybridRouting-Production)
- [PagerDuty](https://matbakh.pagerduty.com)
- [Status Page](https://status.matbakh.app)
- [Change Management](https://matbakh.servicenow.com)
- [Documentation](https://docs.matbakh.app)

---

**Document Control**

- **Version**: 1.0.0
- **Created**: 2025-01-14
- **Last Updated**: 2025-01-14
- **Next Review**: 2025-02-14
- **Owner**: Production Operations Team
- **Approved By**: [Operations Manager], [Release Manager], [Engineering Manager]
