# System Maintenance Guide

**Last Updated:** 2025-09-22  
**Version:** 3.0.0

This guide provides comprehensive maintenance procedures for the matbakh.app system, including auto-scaling infrastructure and **completed multi-region disaster recovery capabilities** (Task 11 ✅ COMPLETED).

## Auto-Scaling Maintenance

### Daily Maintenance Tasks

#### 1. Health Check (9:00 AM CET)
```bash
# Run daily health check
tsx scripts/daily-health-check.ts

# Check for any throttles in last 24h
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Throttles \
  --start-time $(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 86400 \
  --statistics Sum
```

#### 2. Cost Monitoring
```bash
# Check daily costs
aws ce get-cost-and-usage \
  --time-period Start=$(date -d '1 day ago' +%Y-%m-%d),End=$(date +%Y-%m-%d) \
  --granularity DAILY \
  --metrics BlendedCost \
  --group-by Type=DIMENSION,Key=SERVICE
```

#### 3. SLO Compliance Check
```bash
# Check SLO compliance for last 24h
tsx scripts/slo-compliance-check.ts --period=24h
```

## Multi-Region Infrastructure Maintenance

### Daily Multi-Region Tasks

#### 1. Cross-Region Health Check (9:30 AM CET)
```bash
# Check health across both regions
npm run health:check --region eu-central-1
npm run health:check --region eu-west-1

# Monitor replication lag
npm run health:replication-lag

# Generate daily health report
npm run health:report --format=daily
```

#### 2. Disaster Recovery Status Check
```bash
# Check DR system status
npm run dr:status

# Validate failover readiness
npm run dr:test --type=readiness-check

# Review RTO/RPO compliance
npm run dr:compliance-check
```

#### 3. Cross-Region Cost Monitoring
```bash
# Check costs for both regions
aws ce get-cost-and-usage \
  --time-period Start=$(date -d '1 day ago' +%Y-%m-%d),End=$(date +%Y-%m-%d) \
  --granularity DAILY \
  --metrics BlendedCost \
  --group-by Type=DIMENSION,Key=REGION
```

### Weekly Multi-Region Tasks

#### 1. DR Testing (Wednesday 2:00 PM CET)
```bash
# Execute weekly DR test
npm run dr:test --type=full-simulation

# Review failover procedures
npm run dr:test --type=procedure-validation

# Update DR documentation if needed
npm run dr:documentation-check
```

#### 2. Cross-Region Performance Review
```bash
# Compare performance across regions
npm run performance:cross-region-analysis

# Review replication lag trends
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name AuroraGlobalDBRPLag \
  --start-time $(date -u -d '7 days ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 3600 \
  --statistics Average,Maximum
```

### Monthly Multi-Region Tasks

#### 1. Comprehensive DR Drill (First Saturday of Month)
```bash
# Execute full disaster recovery drill
npm run dr:drill --type=comprehensive

# Measure and document RTO/RPO
npm run dr:measure-rto-rpo

# Generate DR drill report
npm run dr:drill-report
```

#### 2. Multi-Region Security Audit
```bash
# Audit cross-region security
npm run security:multi-region-audit

# Check KMS key rotation status
aws kms describe-key --key-id alias/matbakh-multi-region-key

# Validate secrets replication
npm run secrets:replication-check
```

### Weekly Maintenance Tasks

#### 1. Scaling Policy Review (Monday 10:00 AM CET)
```bash
# Review scaling activities
aws application-autoscaling describe-scaling-activities \
  --service-namespace lambda \
  --max-items 50

# Analyze scaling efficiency
tsx scripts/scaling-efficiency-analysis.ts --period=7d
```

#### 2. Performance Analysis
```bash
# Generate weekly performance report
tsx scripts/weekly-performance-report.ts

# Check for performance regressions
tsx scripts/performance-regression-check.ts --baseline=7d
```

#### 3. Capacity Planning Review
```bash
# Analyze traffic patterns
tsx scripts/traffic-pattern-analysis.ts --period=7d

# Generate capacity recommendations
tsx scripts/capacity-recommendations.ts
```

### Monthly Maintenance Tasks

#### 1. Comprehensive Review (First Monday)
```bash
# Full system health assessment
tsx scripts/monthly-health-assessment.ts

# Cost optimization analysis
tsx scripts/cost-optimization-analysis.ts --period=30d

# Scaling policy optimization
tsx scripts/scaling-policy-optimization.ts
```

#### 2. Backup and Archive
```bash
# Create monthly configuration backup
tsx scripts/create-monthly-backup.ts

# Archive old logs and metrics
tsx scripts/archive-old-data.ts --older-than=90d
```

#### 3. Security Review
```bash
# Review IAM policies and permissions
tsx scripts/security-review.ts --component=auto-scaling

# Check for security updates
tsx scripts/security-update-check.ts
```

### Quarterly Maintenance Tasks

#### 1. Architecture Review
- Review auto-scaling architecture decisions
- Evaluate new AWS features and services
- Assess performance against business requirements
- Update capacity planning models

#### 2. Disaster Recovery Testing
```bash
# Test rollback procedures
tsx scripts/auto-scaling-rollback.ts --env=staging --date=test --dry-run

# Validate backup and restore procedures
tsx scripts/test-backup-restore.ts --env=staging
```

#### 3. Cost Optimization
- Review and optimize scaling thresholds
- Analyze cost vs performance trade-offs
- Evaluate reserved capacity options
- Update budget allocations

## Scaling Maintenance Procedures

### Adjusting Scaling Thresholds

#### Lambda Provisioned Concurrency
```bash
# Update target utilization
aws application-autoscaling put-scaling-policy \
  --policy-name lambda-pc-scaling \
  --service-namespace lambda \
  --resource-id function:persona-api \
  --scalable-dimension lambda:function:ProvisionedConcurrency \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration TargetValue=75.0

# Update capacity limits
aws application-autoscaling register-scalable-target \
  --service-namespace lambda \
  --resource-id function:persona-api \
  --scalable-dimension lambda:function:ProvisionedConcurrency \
  --min-capacity 2 \
  --max-capacity 25
```

#### ElastiCache Replica Scaling
```bash
# Update ElastiCache scaling policy
aws application-autoscaling put-scaling-policy \
  --policy-name elasticache-replica-scaling \
  --service-namespace elasticache \
  --resource-id replication-group/matbakh-redis \
  --scalable-dimension elasticache:replication-group:Replicas \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration TargetValue=65.0
```

### Updating Budget Limits

```bash
# Update soft budget
aws budgets put-budget \
  --account-id 055062860590 \
  --budget '{
    "BudgetName": "matbakh-prod-soft-budget",
    "BudgetLimit": {
      "Amount": "70",
      "Unit": "USD"
    },
    "TimeUnit": "MONTHLY",
    "BudgetType": "COST"
  }'
```

### Modifying Alarm Thresholds

```bash
# Update Lambda duration alarm
aws cloudwatch put-metric-alarm \
  --alarm-name prod-lambda-high-p95-duration \
  --alarm-description "Lambda P95 duration exceeds 180ms in prod" \
  --metric-name Duration \
  --namespace AWS/Lambda \
  --statistic p95 \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 180 \
  --comparison-operator GreaterThanThreshold
```

## Troubleshooting Common Issues

### High Lambda Costs
1. **Check provisioned concurrency utilization**
   ```bash
   aws cloudwatch get-metric-statistics \
     --namespace AWS/Lambda \
     --metric-name ProvisionedConcurrencyUtilization \
     --start-time $(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%S) \
     --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
     --period 3600 \
     --statistics Average
   ```

2. **Review scaling activities**
   ```bash
   aws application-autoscaling describe-scaling-activities \
     --service-namespace lambda \
     --max-items 20
   ```

3. **Adjust target utilization if consistently low**

### RDS Connection Issues
1. **Check connection count**
   ```bash
   aws cloudwatch get-metric-statistics \
     --namespace AWS/RDS \
     --metric-name DatabaseConnections \
     --dimensions Name=DBInstanceIdentifier,Value=matbakh-db \
     --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
     --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
     --period 300 \
     --statistics Maximum
   ```

2. **Verify RDS Proxy configuration**
3. **Check Lambda connection pooling settings**

### ElastiCache Memory Pressure
1. **Check memory usage and evictions**
   ```bash
   aws cloudwatch get-metric-statistics \
     --namespace AWS/ElastiCache \
     --metric-name DatabaseMemoryUsagePercentage \
     --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
     --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
     --period 300 \
     --statistics Average
   ```

2. **Review TTL settings and cache policies**
3. **Consider scaling up node size or adding replicas**

## Maintenance Schedules

### Automated Maintenance
- **Daily Health Checks:** 9:00 AM CET
- **Weekly Reports:** Monday 10:00 AM CET
- **Monthly Backups:** First Sunday of each month
- **Quarterly Reviews:** First Monday of quarter

### Manual Maintenance Windows
- **Production:** Sunday 2:00-4:00 AM CET
- **Staging:** Saturday 10:00 PM - Sunday 2:00 AM CET
- **Development:** Anytime (no restrictions)

### Emergency Maintenance
- **Response Time:** < 15 minutes for P1 issues
- **Escalation:** Automatic after 30 minutes
- **Communication:** Slack alerts + email notifications

## Maintenance Tools and Scripts

### Available Scripts
- `scripts/daily-health-check.ts` - Daily system health verification
- `scripts/weekly-performance-report.ts` - Weekly performance analysis
- `scripts/monthly-health-assessment.ts` - Comprehensive monthly review
- `scripts/auto-scaling-rollback.ts` - Configuration rollback utility
- `scripts/staging-load-drill.ts` - Load testing and scaling verification
- `scripts/cost-optimization-analysis.ts` - Cost analysis and recommendations

### Monitoring Dashboards
- **Auto-Scaling Overview:** `matbakh-{env}-autoscaling-monitoring`
- **Cost Monitoring:** AWS Cost Explorer + Custom dashboards
- **SLO Compliance:** Composite alarms and metrics

### Backup Locations
- **Configuration Backups:** `backup/auto-scaling-{env}-{date}.json`
- **State Snapshots:** `backup/auto-scaling-current-{timestamp}.json`
- **Performance Baselines:** `backup/performance-baseline-{date}.json`

## Best Practices

### Configuration Changes
1. **Always create backup before changes**
2. **Test in staging environment first**
3. **Use dry-run mode for validation**
4. **Monitor for 24h after changes**
5. **Document all changes in change log**

### Performance Optimization
1. **Monitor scaling efficiency weekly**
2. **Adjust thresholds based on actual usage patterns**
3. **Review cost vs performance trade-offs monthly**
4. **Keep scaling policies simple and predictable**

### Cost Management
1. **Set up budget alerts at multiple thresholds**
2. **Review provisioned capacity utilization regularly**
3. **Use reserved capacity for predictable workloads**
4. **Monitor for cost anomalies and investigate promptly**

### Security
1. **Review IAM permissions quarterly**
2. **Keep scaling policies and configurations in version control**
3. **Audit access to scaling configuration tools**
4. **Use least privilege principle for automation**

---

**Document Owner:** DevOps Team  
**Next Review:** 2025-02-14  
**Emergency Contact:** DevOps On-Call Rotation