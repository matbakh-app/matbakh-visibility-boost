# Auto-Scaling Operations Runbook

**Version:** 1.0.0  
**Last Updated:** 2025-01-14  
**Reviewed By:** System Architecture Team

## 📋 Overview

This runbook provides step-by-step procedures for managing auto-scaling infrastructure, including emergency procedures, routine maintenance, and troubleshooting.

## 🚨 Emergency Procedures

### 1. Lambda Throttling Emergency

**Symptoms:**
- High number of Lambda throttles
- API response times > SLO targets
- User-facing errors

**Immediate Actions:**
```bash
# 1. Check current throttles
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Throttles \
  --start-time $(date -u -d '10 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum

# 2. Increase reserved concurrency (emergency)
aws lambda put-function-concurrency \
  --function-name persona-api \
  --reserved-concurrent-executions 100

# 3. Monitor for improvement
watch -n 30 'aws cloudwatch get-metric-statistics --namespace AWS/Lambda --metric-name Throttles --start-time $(date -u -d "5 minutes ago" +%Y-%m-%dT%H:%M:%S) --end-time $(date -u +%Y-%m-%dT%H:%M:%S) --period 300 --statistics Sum'
```

**Follow-up Actions:**
1. Investigate root cause of traffic spike
2. Review auto-scaling policies
3. Update reserved concurrency limits if needed
4. Document incident in post-mortem

### 2. RDS Connection Pool Exhaustion

**Symptoms:**
- Database connection errors
- High RDS connection count
- Lambda timeouts on database operations

**Immediate Actions:**
```bash
# 1. Check current connections
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name DatabaseConnections \
  --dimensions Name=DBInstanceIdentifier,Value=matbakh-db \
  --start-time $(date -u -d '10 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Maximum

# 2. Enable RDS Proxy if not already enabled
aws rds create-db-proxy \
  --db-proxy-name matbakh-db-proxy \
  --engine-family POSTGRESQL \
  --target-group-config DBInstanceIdentifiers=matbakh-db \
  --vpc-subnet-ids subnet-xxx subnet-yyy \
  --require-tls

# 3. Restart Lambda functions to reset connections
aws lambda update-function-code \
  --function-name persona-api \
  --zip-file fileb://dummy.zip
```

### 3. Cost Runaway Emergency

**Symptoms:**
- AWS costs exceeding budget alerts
- Unexpected scaling beyond limits
- High provisioned concurrency usage

**Immediate Actions:**
```bash
# 1. Check current costs
aws ce get-cost-and-usage \
  --time-period Start=$(date -d '1 day ago' +%Y-%m-%d),End=$(date +%Y-%m-%d) \
  --granularity DAILY \
  --metrics BlendedCost

# 2. Reduce provisioned concurrency immediately
aws application-autoscaling put-scaling-policy \
  --policy-name emergency-scale-down \
  --service-namespace lambda \
  --resource-id function:persona-api \
  --scalable-dimension lambda:function:ProvisionedConcurrency \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration TargetValue=90.0

# 3. Set hard limits on all functions
for func in persona-api vc-start vc-result auth-handler; do
  aws lambda put-function-concurrency \
    --function-name $func \
    --reserved-concurrent-executions 10
done
```

## 🔧 Routine Operations

### 1. Daily Health Check

**Schedule:** Every day at 9:00 AM CET

```bash
#!/bin/bash
# Daily auto-scaling health check

echo "🏥 Daily Auto-Scaling Health Check - $(date)"
echo "================================================"

# Check Lambda metrics
echo "📊 Lambda Metrics (Last 24h):"
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Duration \
  --start-time $(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 3600 \
  --statistics Average,Maximum \
  --query 'Datapoints[*].[Timestamp,Average,Maximum]' \
  --output table

# Check for throttles
THROTTLES=$(aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Throttles \
  --start-time $(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 86400 \
  --statistics Sum \
  --query 'Datapoints[0].Sum' \
  --output text)

if [ "$THROTTLES" != "None" ] && [ "$THROTTLES" -gt 0 ]; then
  echo "⚠️  WARNING: $THROTTLES throttles detected in last 24h"
else
  echo "✅ No throttles detected"
fi

# Check RDS performance
echo "🗄️  RDS Metrics:"
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name CPUUtilization \
  --dimensions Name=DBInstanceIdentifier,Value=matbakh-db \
  --start-time $(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 3600 \
  --statistics Average,Maximum \
  --query 'Datapoints[*].[Timestamp,Average,Maximum]' \
  --output table

# Check ElastiCache
echo "🔄 ElastiCache Metrics:"
aws cloudwatch get-metric-statistics \
  --namespace AWS/ElastiCache \
  --metric-name EngineCPUUtilization \
  --start-time $(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 3600 \
  --statistics Average,Maximum \
  --query 'Datapoints[*].[Timestamp,Average,Maximum]' \
  --output table

echo "✅ Health check complete"
```

### 2. Weekly Scaling Policy Review

**Schedule:** Every Monday at 10:00 AM CET

```bash
#!/bin/bash
# Weekly scaling policy review

echo "📋 Weekly Auto-Scaling Policy Review - $(date)"
echo "=============================================="

# List all scaling targets
echo "🎯 Current Scaling Targets:"
aws application-autoscaling describe-scalable-targets \
  --service-namespace lambda \
  --query 'ScalableTargets[*].[ResourceId,MinCapacity,MaxCapacity]' \
  --output table

# Check scaling activities
echo "📈 Recent Scaling Activities:"
aws application-autoscaling describe-scaling-activities \
  --service-namespace lambda \
  --max-items 10 \
  --query 'ScalingActivities[*].[ActivityId,Description,StatusCode,StartTime]' \
  --output table

# Cost analysis
echo "💰 Cost Analysis (Last 7 days):"
aws ce get-cost-and-usage \
  --time-period Start=$(date -d '7 days ago' +%Y-%m-%d),End=$(date +%Y-%m-%d) \
  --granularity DAILY \
  --metrics BlendedCost \
  --group-by Type=DIMENSION,Key=SERVICE \
  --query 'ResultsByTime[*].Groups[?Keys[0]==`AWS Lambda`].[Keys[0],Metrics.BlendedCost.Amount]' \
  --output table
```

### 3. Monthly Capacity Planning

**Schedule:** First Monday of each month

```bash
#!/bin/bash
# Monthly capacity planning review

echo "📊 Monthly Capacity Planning Review - $(date)"
echo "============================================"

# Analyze traffic patterns
echo "📈 Traffic Pattern Analysis (Last 30 days):"
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --start-time $(date -u -d '30 days ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 86400 \
  --statistics Sum \
  --query 'Datapoints[*].[Timestamp,Sum]' \
  --output table

# Scaling efficiency analysis
echo "⚡ Scaling Efficiency:"
aws application-autoscaling describe-scaling-activities \
  --service-namespace lambda \
  --max-items 50 \
  --query 'ScalingActivities[?StatusCode==`Successful`] | length(@)'

# Recommendations
echo "💡 Recommendations:"
echo "- Review traffic patterns for seasonal adjustments"
echo "- Consider adjusting min/max capacity based on trends"
echo "- Evaluate cost vs performance trade-offs"
```

## 🔄 Rollback Procedures

### 1. Auto-Scaling Policy Rollback

```bash
#!/bin/bash
# Rollback auto-scaling policies to previous version

BACKUP_DATE=${1:-$(date -d '1 day ago' +%Y%m%d)}
ENVIRONMENT=${2:-staging}

echo "🔄 Rolling back auto-scaling policies to $BACKUP_DATE for $ENVIRONMENT"

# Restore Lambda scaling policies
aws application-autoscaling put-scaling-policy \
  --policy-name "${ENVIRONMENT}-lambda-scaling-policy" \
  --service-namespace lambda \
  --resource-id "function:persona-api" \
  --scalable-dimension "lambda:function:ProvisionedConcurrency" \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration file://backup/lambda-policy-${BACKUP_DATE}.json

# Restore ElastiCache scaling policies
aws application-autoscaling put-scaling-policy \
  --policy-name "${ENVIRONMENT}-elasticache-scaling-policy" \
  --service-namespace elasticache \
  --resource-id "replication-group/matbakh-redis" \
  --scalable-dimension "elasticache:replication-group:Replicas" \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration file://backup/elasticache-policy-${BACKUP_DATE}.json

echo "✅ Rollback complete"
```

### 2. Emergency Scale-Down

```bash
#!/bin/bash
# Emergency scale-down procedure

echo "🚨 Emergency Scale-Down Procedure"
echo "================================"

# Scale down all Lambda functions to minimum
FUNCTIONS=("persona-api" "vc-start" "vc-result" "auth-handler" "upload-service")

for func in "${FUNCTIONS[@]}"; do
  echo "Scaling down $func..."
  
  # Remove provisioned concurrency
  aws lambda delete-provisioned-concurrency-config \
    --function-name $func \
    --qualifier '$LATEST' 2>/dev/null || true
  
  # Set minimal reserved concurrency
  aws lambda put-function-concurrency \
    --function-name $func \
    --reserved-concurrent-executions 5
done

# Scale down ElastiCache to minimum replicas
aws application-autoscaling register-scalable-target \
  --service-namespace elasticache \
  --resource-id replication-group/matbakh-redis \
  --scalable-dimension elasticache:replication-group:Replicas \
  --min-capacity 0 \
  --max-capacity 1

echo "✅ Emergency scale-down complete"
echo "⚠️  Monitor application performance and scale back up as needed"
```

## 🔍 Troubleshooting Guide

### Common Issues and Solutions

#### Issue: Auto-scaling not triggering

**Symptoms:**
- High resource utilization but no scaling activity
- Scaling policies exist but are inactive

**Diagnosis:**
```bash
# Check scaling policy status
aws application-autoscaling describe-scaling-policies \
  --service-namespace lambda \
  --query 'ScalingPolicies[*].[PolicyName,PolicyType,TargetTrackingScalingPolicyConfiguration.TargetValue]'

# Check CloudWatch alarms
aws cloudwatch describe-alarms \
  --alarm-names $(aws application-autoscaling describe-scaling-policies --service-namespace lambda --query 'ScalingPolicies[*].Alarms[*].AlarmName' --output text)
```

**Solutions:**
1. Verify CloudWatch metrics are being published
2. Check alarm thresholds and evaluation periods
3. Ensure IAM permissions for auto-scaling service
4. Review cooldown periods

#### Issue: Scaling too aggressive or too slow

**Symptoms:**
- Frequent scaling activities
- Resource utilization spikes despite auto-scaling

**Diagnosis:**
```bash
# Analyze scaling activities
aws application-autoscaling describe-scaling-activities \
  --service-namespace lambda \
  --max-items 20 \
  --query 'ScalingActivities[*].[StartTime,Description,StatusCode,Cause]'
```

**Solutions:**
1. Adjust target tracking values
2. Modify cooldown periods
3. Consider step scaling for burst scenarios
4. Review metric collection frequency

## 📞 Escalation Procedures

### Level 1: Automated Response
- CloudWatch alarms trigger automatic scaling
- SNS notifications sent to operations team
- Basic remediation scripts executed

### Level 2: Operations Team
- Manual intervention required
- Use runbook procedures
- Escalate if issue persists > 30 minutes

### Level 3: Engineering Team
- Complex troubleshooting required
- Code changes may be needed
- Architecture review required

### Level 4: Emergency Response
- Service-wide impact
- Customer-facing issues
- Executive notification required

## 📚 References

- [AWS Auto Scaling Documentation](https://docs.aws.amazon.com/autoscaling/)
- [Lambda Scaling Documentation](https://docs.aws.amazon.com/lambda/latest/dg/invocation-scaling.html)
- [CloudWatch Metrics Reference](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/aws-services-cloudwatch-metrics.html)
- [Matbakh Architecture Documentation](../architecture-decisions.md)

## 📝 Change Log

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-01-14 | 1.0.0 | Initial version | System Architecture Team |

---

**Next Review Date:** 2025-02-14  
**Document Owner:** DevOps Team  
**Approval:** CTO