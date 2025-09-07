# Bedrock AI Core - Operator Guide

## System Overview

The Bedrock AI Core is the central AI orchestration system for matbakh.app, providing intelligent analysis, content generation, and persona-adaptive responses. This guide covers operational procedures, monitoring, troubleshooting, and maintenance tasks.

## Architecture Components

### Core Services
- **Bedrock Agent Lambda**: Main AI processing engine
- **Web Proxy Lambda**: Controlled external API access
- **Template Management**: Centralized prompt template system
- **Cost Control System**: Token usage and budget management
- **Logging & Audit**: Comprehensive operation tracking

### Supporting Infrastructure
- **AWS Bedrock**: Claude 3.5 Sonnet model access
- **DynamoDB**: Real-time logging and caching
- **PostgreSQL**: Long-term audit storage
- **CloudWatch**: Monitoring and alerting
- **S3**: Template and artifact storage

## Daily Operations

### Morning Health Check Routine

1. **System Status Verification**
```bash
# Check overall system health
curl -H "Authorization: Bearer $ADMIN_API_KEY" \
  https://api.matbakh.app/ai/health

# Verify all services are operational
aws lambda invoke --function-name bedrock-agent-health-check response.json
cat response.json | jq '.status'
```

2. **Cost Monitoring**
```bash
# Check daily token usage
aws logs filter-log-events \
  --log-group-name /aws/lambda/bedrock-agent \
  --start-time $(date -d "yesterday" +%s)000 \
  --filter-pattern "{ $.token_usage > 0 }" \
  | jq '.events[].message' | jq -s 'map(fromjson) | map(.token_usage) | add'

# Verify cost thresholds
curl -H "Authorization: Bearer $ADMIN_API_KEY" \
  https://api.matbakh.app/ai/metrics/usage
```

3. **Performance Metrics Review**
```bash
# Check average response times
aws cloudwatch get-metric-statistics \
  --namespace "MatbakhAI" \
  --metric-name "ResponseTime" \
  --start-time $(date -d "24 hours ago" -u +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 3600 \
  --statistics Average
```

### Weekly Maintenance Tasks

1. **Template Performance Review**
```bash
# Analyze template success rates
psql $DATABASE_URL -c "
SELECT 
  template_id,
  COUNT(*) as usage_count,
  AVG(response_time_ms) as avg_response_time,
  COUNT(*) FILTER (WHERE status = 'success') * 100.0 / COUNT(*) as success_rate
FROM ai_action_logs 
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY template_id
ORDER BY usage_count DESC;
"
```

2. **Persona Detection Accuracy**
```bash
# Check persona detection confidence scores
psql $DATABASE_URL -c "
SELECT 
  persona_type,
  AVG(confidence_score) as avg_confidence,
  COUNT(*) as detections
FROM ai_action_logs 
WHERE request_type = 'persona_detection'
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY persona_type;
"
```

3. **Cost Optimization Review**
```bash
# Identify high-cost operations
psql $DATABASE_URL -c "
SELECT 
  request_type,
  template_id,
  AVG(token_usage) as avg_tokens,
  SUM(token_usage) as total_tokens,
  COUNT(*) as request_count
FROM ai_action_logs 
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY request_type, template_id
ORDER BY total_tokens DESC
LIMIT 10;
"
```

## Monitoring & Alerting

### Key Metrics to Monitor

1. **System Health Metrics**
   - Response time (target: <30 seconds)
   - Success rate (target: >95%)
   - Error rate (alert: >5%)
   - Service availability (target: 99.9%)

2. **Cost Metrics**
   - Daily token usage
   - Cost per request
   - Monthly budget utilization
   - Cost threshold alerts

3. **Performance Metrics**
   - Queue depth
   - Cache hit rate
   - Persona detection accuracy
   - Template performance

### CloudWatch Alarms Setup

```bash
# High error rate alarm
aws cloudwatch put-metric-alarm \
  --alarm-name "BedrockAI-HighErrorRate" \
  --alarm-description "AI service error rate above 5%" \
  --metric-name "ErrorRate" \
  --namespace "MatbakhAI" \
  --statistic "Average" \
  --period 300 \
  --threshold 5.0 \
  --comparison-operator "GreaterThanThreshold" \
  --evaluation-periods 2

# High response time alarm
aws cloudwatch put-metric-alarm \
  --alarm-name "BedrockAI-HighResponseTime" \
  --alarm-description "AI service response time above 30 seconds" \
  --metric-name "ResponseTime" \
  --namespace "MatbakhAI" \
  --statistic "Average" \
  --period 300 \
  --threshold 30000 \
  --comparison-operator "GreaterThanThreshold" \
  --evaluation-periods 2

# Cost threshold alarm
aws cloudwatch put-metric-alarm \
  --alarm-name "BedrockAI-CostThreshold" \
  --alarm-description "AI service approaching cost limit" \
  --metric-name "DailyCost" \
  --namespace "MatbakhAI" \
  --statistic "Sum" \
  --period 86400 \
  --threshold 100.0 \
  --comparison-operator "GreaterThanThreshold" \
  --evaluation-periods 1
```

### Log Analysis Queries

1. **Error Pattern Analysis**
```bash
# Find common error patterns
aws logs filter-log-events \
  --log-group-name /aws/lambda/bedrock-agent \
  --filter-pattern "ERROR" \
  --start-time $(date -d "24 hours ago" +%s)000 \
  | jq '.events[].message' | sort | uniq -c | sort -nr
```

2. **Performance Bottleneck Identification**
```bash
# Find slow operations
aws logs filter-log-events \
  --log-group-name /aws/lambda/bedrock-agent \
  --filter-pattern "{ $.response_time_ms > 25000 }" \
  --start-time $(date -d "24 hours ago" +%s)000
```

3. **Persona Detection Issues**
```bash
# Find low confidence persona detections
aws logs filter-log-events \
  --log-group-name /aws/lambda/bedrock-agent \
  --filter-pattern "{ $.persona_confidence < 0.7 }" \
  --start-time $(date -d "24 hours ago" +%s)000
```

## Troubleshooting Procedures

### Common Issues and Solutions

#### 1. High Response Times

**Symptoms:**
- API responses taking >30 seconds
- User complaints about slow analysis
- CloudWatch alarms triggering

**Diagnosis:**
```bash
# Check current queue depth
aws sqs get-queue-attributes \
  --queue-url $AI_QUEUE_URL \
  --attribute-names ApproximateNumberOfMessages

# Check Bedrock service status
aws bedrock-runtime invoke-model \
  --model-id anthropic.claude-3-5-sonnet-20240620-v1:0 \
  --body '{"anthropic_version":"bedrock-2023-05-31","max_tokens":10,"messages":[{"role":"user","content":"test"}]}' \
  --cli-binary-format raw-in-base64-out \
  test-response.json
```

**Solutions:**
1. Scale up Lambda concurrency
2. Enable response caching
3. Implement request queuing
4. Check for Bedrock service issues

#### 2. Cost Overruns

**Symptoms:**
- Unexpected high bills
- Cost threshold alerts
- Service throttling activated

**Diagnosis:**
```bash
# Analyze cost by request type
psql $DATABASE_URL -c "
SELECT 
  request_type,
  DATE(created_at) as date,
  SUM(token_usage * 0.00002) as estimated_cost
FROM ai_action_logs 
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY request_type, DATE(created_at)
ORDER BY estimated_cost DESC;
"
```

**Solutions:**
1. Implement stricter rate limiting
2. Optimize prompt templates
3. Enable aggressive caching
4. Review and adjust cost thresholds

#### 3. Persona Detection Accuracy Issues

**Symptoms:**
- Low confidence scores
- User complaints about inappropriate responses
- Inconsistent persona assignments

**Diagnosis:**
```bash
# Check persona distribution
psql $DATABASE_URL -c "
SELECT 
  persona_type,
  AVG(confidence_score) as avg_confidence,
  STDDEV(confidence_score) as confidence_stddev,
  COUNT(*) as count
FROM ai_action_logs 
WHERE request_type = 'persona_detection'
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY persona_type;
"
```

**Solutions:**
1. Retrain persona detection model
2. Collect more behavioral data
3. Adjust confidence thresholds
4. Implement manual override system

#### 4. Template Performance Issues

**Symptoms:**
- High failure rates for specific templates
- Inconsistent AI responses
- Template validation errors

**Diagnosis:**
```bash
# Analyze template performance
psql $DATABASE_URL -c "
SELECT 
  template_id,
  template_version,
  COUNT(*) as usage_count,
  COUNT(*) FILTER (WHERE status = 'error') as error_count,
  AVG(response_time_ms) as avg_response_time
FROM ai_action_logs 
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY template_id, template_version
HAVING COUNT(*) FILTER (WHERE status = 'error') > 0
ORDER BY error_count DESC;
"
```

**Solutions:**
1. Review and update problematic templates
2. Implement A/B testing for template changes
3. Add more validation rules
4. Rollback to previous template versions

## Emergency Procedures

### Service Degradation Response

1. **Immediate Actions**
```bash
# Enable emergency mode (cached responses only)
aws lambda update-function-configuration \
  --function-name bedrock-agent \
  --environment Variables='{EMERGENCY_MODE=true}'

# Scale down to reduce costs
aws lambda put-provisioned-concurrency-config \
  --function-name bedrock-agent \
  --provisioned-concurrency-config ProvisionedConcurrencyConfig=1
```

2. **Communication**
- Update status page
- Notify stakeholders
- Prepare user communication

3. **Investigation**
- Collect logs and metrics
- Identify root cause
- Implement temporary fixes

### Complete Service Outage

1. **Activate Fallback Systems**
```bash
# Route traffic to fallback service
aws route53 change-resource-record-sets \
  --hosted-zone-id $HOSTED_ZONE_ID \
  --change-batch file://fallback-routing.json

# Enable static response mode
aws lambda update-function-configuration \
  --function-name bedrock-agent \
  --environment Variables='{FALLBACK_MODE=true}'
```

2. **Data Protection**
```bash
# Create emergency backup
pg_dump $DATABASE_URL > emergency_backup_$(date +%Y%m%d_%H%M%S).sql

# Verify data integrity
psql $DATABASE_URL -c "SELECT COUNT(*) FROM ai_action_logs WHERE created_at > NOW() - INTERVAL '1 hour';"
```

## Maintenance Procedures

### Template Updates

1. **Staging Deployment**
```bash
# Deploy to staging environment
./infra/lambdas/bedrock-agent/deploy-templates.sh staging

# Run validation tests
npm test -- --testPathPattern=template-validation
```

2. **Production Deployment**
```bash
# Create backup of current templates
aws s3 sync s3://matbakh-ai-templates s3://matbakh-ai-templates-backup/$(date +%Y%m%d)

# Deploy new templates
./infra/lambdas/bedrock-agent/deploy-templates.sh production

# Monitor for issues
watch -n 30 'curl -s https://api.matbakh.app/ai/health | jq .status'
```

### System Updates

1. **Lambda Function Updates**
```bash
# Build and test locally
cd infra/lambdas/bedrock-agent
npm run build
npm test

# Deploy with gradual rollout
aws lambda update-function-code \
  --function-name bedrock-agent \
  --zip-file fileb://dist/bedrock-agent.zip

# Monitor deployment
aws lambda get-function \
  --function-name bedrock-agent \
  --query 'Configuration.LastUpdateStatus'
```

2. **Database Migrations**
```bash
# Create migration backup
pg_dump $DATABASE_URL > migration_backup_$(date +%Y%m%d_%H%M%S).sql

# Run migration
psql $DATABASE_URL -f migrations/add_new_columns.sql

# Verify migration
psql $DATABASE_URL -c "\d ai_action_logs"
```

## Performance Optimization

### Caching Strategy

1. **Response Caching**
```bash
# Configure Redis cache
aws elasticache create-cache-cluster \
  --cache-cluster-id matbakh-ai-cache \
  --engine redis \
  --cache-node-type cache.t3.micro \
  --num-cache-nodes 1
```

2. **Template Caching**
```bash
# Warm up template cache
curl -X POST https://api.matbakh.app/ai/templates/warm-cache \
  -H "Authorization: Bearer $ADMIN_API_KEY"
```

### Query Optimization

1. **Database Indexing**
```sql
-- Add performance indexes
CREATE INDEX CONCURRENTLY idx_ai_logs_created_at 
ON ai_action_logs(created_at);

CREATE INDEX CONCURRENTLY idx_ai_logs_request_type 
ON ai_action_logs(request_type, created_at);

CREATE INDEX CONCURRENTLY idx_ai_logs_template_id 
ON ai_action_logs(template_id, status);
```

2. **Query Analysis**
```bash
# Analyze slow queries
psql $DATABASE_URL -c "
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  rows
FROM pg_stat_statements 
WHERE query LIKE '%ai_action_logs%'
ORDER BY total_time DESC 
LIMIT 10;
"
```

## Security Operations

### Access Control Review

1. **IAM Policy Audit**
```bash
# Review Lambda execution role
aws iam get-role-policy \
  --role-name bedrock-agent-execution-role \
  --policy-name BedrockAgentPolicy

# Check for overprivileged permissions
aws iam simulate-principal-policy \
  --policy-source-arn arn:aws:iam::ACCOUNT:role/bedrock-agent-execution-role \
  --action-names bedrock:InvokeModel \
  --resource-arns "*"
```

2. **API Key Rotation**
```bash
# Generate new API keys
aws secretsmanager create-secret \
  --name "bedrock-ai-api-keys-$(date +%Y%m%d)" \
  --secret-string '{"admin":"new-admin-key","user":"new-user-key"}'

# Update applications with new keys
kubectl set env deployment/matbakh-frontend BEDROCK_API_KEY=new-user-key
```

### Audit Log Review

1. **Suspicious Activity Detection**
```bash
# Check for unusual access patterns
psql $DATABASE_URL -c "
SELECT 
  user_id,
  COUNT(*) as request_count,
  COUNT(DISTINCT request_type) as unique_request_types,
  MIN(created_at) as first_request,
  MAX(created_at) as last_request
FROM ai_action_logs 
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY user_id
HAVING COUNT(*) > 100
ORDER BY request_count DESC;
"
```

2. **PII Exposure Check**
```bash
# Scan logs for potential PII
aws logs filter-log-events \
  --log-group-name /aws/lambda/bedrock-agent \
  --filter-pattern "[email, phone, address]" \
  --start-time $(date -d "24 hours ago" +%s)000
```

## Disaster Recovery

### Backup Procedures

1. **Database Backup**
```bash
# Daily automated backup
pg_dump $DATABASE_URL | gzip > backups/ai_logs_$(date +%Y%m%d).sql.gz

# Upload to S3
aws s3 cp backups/ai_logs_$(date +%Y%m%d).sql.gz \
  s3://matbakh-backups/ai-core/
```

2. **Configuration Backup**
```bash
# Export Lambda configuration
aws lambda get-function \
  --function-name bedrock-agent \
  > backups/lambda_config_$(date +%Y%m%d).json

# Export template configurations
aws s3 sync s3://matbakh-ai-templates \
  backups/templates_$(date +%Y%m%d)/
```

### Recovery Procedures

1. **Database Recovery**
```bash
# Restore from backup
gunzip -c backups/ai_logs_20240115.sql.gz | psql $DATABASE_URL

# Verify data integrity
psql $DATABASE_URL -c "SELECT COUNT(*) FROM ai_action_logs;"
```

2. **Service Recovery**
```bash
# Restore Lambda function
aws lambda update-function-code \
  --function-name bedrock-agent \
  --zip-file fileb://backups/bedrock-agent-backup.zip

# Restore templates
aws s3 sync backups/templates_20240115/ \
  s3://matbakh-ai-templates/
```

## Contact Information

### Escalation Contacts
- **Primary On-Call**: +49-xxx-xxx-xxxx
- **Secondary On-Call**: +49-xxx-xxx-xxxx
- **Engineering Manager**: engineering@matbakh.app
- **CTO**: cto@matbakh.app

### External Support
- **AWS Support**: Premium Support Case
- **Anthropic Support**: enterprise-support@anthropic.com
- **Database Support**: postgres-support@company.com

### Documentation Updates
This guide should be updated whenever:
- New features are deployed
- Operational procedures change
- New monitoring tools are added
- Incident response procedures are modified

Last Updated: January 15, 2024
Version: 1.0.0