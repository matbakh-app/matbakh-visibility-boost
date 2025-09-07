# Bedrock AI Core - Troubleshooting Guide

## Overview

This guide provides systematic troubleshooting procedures for common issues with the Bedrock AI Core system. Each section includes symptoms, diagnosis steps, and resolution procedures.

## Quick Diagnostic Commands

### System Health Check
```bash
# Overall system status
curl -f https://api.matbakh.app/ai/health

# Lambda function status
aws lambda get-function --function-name bedrock-agent --query 'Configuration.State'

# Recent error count
aws logs filter-log-events \
  --log-group-name /aws/lambda/bedrock-agent \
  --start-time $(date -d "1 hour ago" +%s)000 \
  --filter-pattern "ERROR" | jq '.events | length'
```

### Performance Metrics
```bash
# Average response time (last hour)
aws cloudwatch get-metric-statistics \
  --namespace "MatbakhAI" \
  --metric-name "ResponseTime" \
  --start-time $(date -d "1 hour ago" -u +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 3600 \
  --statistics Average

# Error rate
aws cloudwatch get-metric-statistics \
  --namespace "MatbakhAI" \
  --metric-name "ErrorRate" \
  --start-time $(date -d "1 hour ago" -u +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 3600 \
  --statistics Average
```

## Common Issues

### 1. High Response Times

#### Symptoms
- API responses taking >30 seconds
- User complaints about slow analysis
- CloudWatch alarms for high response time

#### Diagnosis Steps

1. **Check Current Performance**
```bash
# Get recent response times
aws logs filter-log-events \
  --log-group-name /aws/lambda/bedrock-agent \
  --start-time $(date -d "30 minutes ago" +%s)000 \
  --filter-pattern "{ $.response_time_ms > 0 }" \
  | jq -r '.events[].message' \
  | jq -r '.response_time_ms' \
  | sort -n | tail -10
```

2. **Identify Bottlenecks**
```bash
# Check for Bedrock throttling
aws logs filter-log-events \
  --log-group-name /aws/lambda/bedrock-agent \
  --start-time $(date -d "1 hour ago" +%s)000 \
  --filter-pattern "ThrottlingException"

# Check database connection issues
aws logs filter-log-events \
  --log-group-name /aws/lambda/bedrock-agent \
  --start-time $(date -d "1 hour ago" +%s)000 \
  --filter-pattern "database connection"
```

3. **Check Lambda Configuration**
```bash
# Verify memory and timeout settings
aws lambda get-function-configuration \
  --function-name bedrock-agent \
  --query '{MemorySize:MemorySize,Timeout:Timeout,ReservedConcurrency:ReservedConcurrencyConfig.ReservedConcurrentExecutions}'
```

#### Resolution Steps

1. **Immediate Fixes**
```bash
# Increase Lambda memory for better performance
aws lambda update-function-configuration \
  --function-name bedrock-agent \
  --memory-size 1024

# Enable response caching
aws lambda update-function-configuration \
  --function-name bedrock-agent \
  --environment Variables='{
    "ENABLE_RESPONSE_CACHE":"true",
    "CACHE_TTL_SECONDS":"3600"
  }'
```

2. **Long-term Optimizations**
```bash
# Implement request queuing
aws lambda update-function-configuration \
  --function-name bedrock-agent \
  --environment Variables='{
    "ENABLE_REQUEST_QUEUE":"true",
    "MAX_QUEUE_SIZE":"100"
  }'

# Enable connection pooling
aws lambda update-function-configuration \
  --function-name bedrock-agent \
  --environment Variables='{
    "DB_CONNECTION_POOL_SIZE":"10",
    "DB_CONNECTION_TIMEOUT":"30000"
  }'
```

### 2. High Error Rates

#### Symptoms
- Error rate >5%
- Frequent 500 responses
- CloudWatch error rate alarms

#### Diagnosis Steps

1. **Analyze Error Patterns**
```bash
# Get error distribution
aws logs filter-log-events \
  --log-group-name /aws/lambda/bedrock-agent \
  --start-time $(date -d "1 hour ago" +%s)000 \
  --filter-pattern "ERROR" \
  | jq -r '.events[].message' \
  | jq -r '.error_type // .error // "unknown"' \
  | sort | uniq -c | sort -nr
```

2. **Check Specific Error Types**
```bash
# Bedrock service errors
aws logs filter-log-events \
  --log-group-name /aws/lambda/bedrock-agent \
  --start-time $(date -d "1 hour ago" +%s)000 \
  --filter-pattern "ValidationException OR ThrottlingException OR ServiceUnavailableException"

# Database errors
aws logs filter-log-events \
  --log-group-name /aws/lambda/bedrock-agent \
  --start-time $(date -d "1 hour ago" +%s)000 \
  --filter-pattern "ECONNREFUSED OR timeout OR connection"
```

#### Resolution Steps

1. **Bedrock Service Errors**
```bash
# Enable exponential backoff
aws lambda update-function-configuration \
  --function-name bedrock-agent \
  --environment Variables='{
    "ENABLE_EXPONENTIAL_BACKOFF":"true",
    "MAX_RETRY_ATTEMPTS":"5",
    "INITIAL_RETRY_DELAY":"1000"
  }'
```

2. **Database Connection Errors**
```bash
# Optimize database connections
aws lambda update-function-configuration \
  --function-name bedrock-agent \
  --environment Variables='{
    "DB_CONNECTION_POOL_SIZE":"5",
    "DB_CONNECTION_TIMEOUT":"30000",
    "DB_IDLE_TIMEOUT":"60000"
  }'
```

3. **Template Validation Errors**
```bash
# Enable template validation
aws lambda update-function-configuration \
  --function-name bedrock-agent \
  --environment Variables='{
    "ENABLE_TEMPLATE_VALIDATION":"true",
    "FALLBACK_TO_DEFAULT_TEMPLATE":"true"
  }'
```

### 3. Cost Overruns

#### Symptoms
- Unexpected high AWS bills
- Cost threshold alerts
- Service throttling activated

#### Diagnosis Steps

1. **Analyze Token Usage**
```bash
# Daily token usage by request type
psql $DATABASE_URL -c "
SELECT 
  request_type,
  DATE(created_at) as date,
  COUNT(*) as request_count,
  AVG(token_usage) as avg_tokens,
  SUM(token_usage) as total_tokens,
  SUM(token_usage * 0.00002) as estimated_cost
FROM ai_action_logs 
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY request_type, DATE(created_at)
ORDER BY estimated_cost DESC;
"
```

2. **Identify High-Cost Operations**
```bash
# Find expensive templates
psql $DATABASE_URL -c "
SELECT 
  template_id,
  COUNT(*) as usage_count,
  AVG(token_usage) as avg_tokens,
  MAX(token_usage) as max_tokens,
  SUM(token_usage * 0.00002) as total_cost
FROM ai_action_logs 
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY template_id
ORDER BY total_cost DESC
LIMIT 10;
"
```

#### Resolution Steps

1. **Immediate Cost Control**
```bash
# Enable emergency cost control
aws lambda update-function-configuration \
  --function-name bedrock-agent \
  --environment Variables='{
    "EMERGENCY_COST_CONTROL":"true",
    "MAX_REQUESTS_PER_HOUR":"50",
    "MAX_TOKENS_PER_REQUEST":"2000"
  }'
```

2. **Optimize Templates**
```bash
# Enable prompt optimization
aws lambda update-function-configuration \
  --function-name bedrock-agent \
  --environment Variables='{
    "ENABLE_PROMPT_OPTIMIZATION":"true",
    "REDUCE_PROMPT_COMPLEXITY":"true",
    "MAX_CONTEXT_LENGTH":"4000"
  }'
```

3. **Implement Aggressive Caching**
```bash
# Enable extended caching
aws lambda update-function-configuration \
  --function-name bedrock-agent \
  --environment Variables='{
    "ENABLE_AGGRESSIVE_CACHING":"true",
    "CACHE_TTL_SECONDS":"7200",
    "CACHE_SIMILAR_REQUESTS":"true"
  }'
```

### 4. Persona Detection Issues

#### Symptoms
- Low confidence scores (<0.7)
- Inconsistent persona assignments
- User complaints about inappropriate responses

#### Diagnosis Steps

1. **Check Detection Accuracy**
```bash
# Persona confidence distribution
psql $DATABASE_URL -c "
SELECT 
  persona_type,
  COUNT(*) as detections,
  AVG(confidence_score) as avg_confidence,
  MIN(confidence_score) as min_confidence,
  MAX(confidence_score) as max_confidence,
  STDDEV(confidence_score) as confidence_stddev
FROM ai_action_logs 
WHERE request_type = 'persona_detection'
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY persona_type
ORDER BY avg_confidence DESC;
"
```

2. **Analyze Low Confidence Cases**
```bash
# Find low confidence detections
psql $DATABASE_URL -c "
SELECT 
  lead_id,
  persona_type,
  confidence_score,
  input_data,
  created_at
FROM ai_action_logs 
WHERE request_type = 'persona_detection'
  AND confidence_score < 0.7
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY confidence_score ASC
LIMIT 10;
"
```

#### Resolution Steps

1. **Adjust Detection Thresholds**
```bash
# Lower confidence threshold temporarily
aws lambda update-function-configuration \
  --function-name bedrock-agent \
  --environment Variables='{
    "PERSONA_CONFIDENCE_THRESHOLD":"0.6",
    "ENABLE_FALLBACK_PERSONA":"true",
    "DEFAULT_FALLBACK_PERSONA":"Solo-Sarah"
  }'
```

2. **Improve Data Collection**
```bash
# Collect more behavioral data
aws lambda update-function-configuration \
  --function-name bedrock-agent \
  --environment Variables='{
    "COLLECT_EXTENDED_BEHAVIORAL_DATA":"true",
    "TRACK_SESSION_PATTERNS":"true",
    "ANALYZE_RESPONSE_TIMING":"true"
  }'
```

3. **Enable Manual Override System**
```bash
# Allow admin overrides
aws lambda update-function-configuration \
  --function-name bedrock-agent \
  --environment Variables='{
    "ENABLE_PERSONA_OVERRIDE":"true",
    "ADMIN_OVERRIDE_DURATION":"86400"
  }'
```

### 5. Template Performance Issues

#### Symptoms
- High failure rates for specific templates
- Inconsistent AI responses
- Template validation errors

#### Diagnosis Steps

1. **Template Performance Analysis**
```bash
# Template success rates
psql $DATABASE_URL -c "
SELECT 
  template_id,
  template_version,
  COUNT(*) as total_usage,
  COUNT(*) FILTER (WHERE status = 'success') as successful,
  COUNT(*) FILTER (WHERE status = 'error') as errors,
  COUNT(*) FILTER (WHERE status = 'success') * 100.0 / COUNT(*) as success_rate,
  AVG(response_time_ms) as avg_response_time
FROM ai_action_logs 
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY template_id, template_version
HAVING COUNT(*) > 5
ORDER BY success_rate ASC;
"
```

2. **Identify Problematic Templates**
```bash
# Templates with high error rates
psql $DATABASE_URL -c "
SELECT 
  template_id,
  COUNT(*) as error_count,
  array_agg(DISTINCT error_message) as error_types
FROM ai_action_logs 
WHERE status = 'error'
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY template_id
HAVING COUNT(*) > 3
ORDER BY error_count DESC;
"
```

#### Resolution Steps

1. **Disable Problematic Templates**
```bash
# Temporarily disable failing templates
aws lambda update-function-configuration \
  --function-name bedrock-agent \
  --environment Variables='{
    "DISABLED_TEMPLATES":"template-id-1,template-id-2",
    "FALLBACK_TO_DEFAULT":"true"
  }'
```

2. **Enable Template Validation**
```bash
# Strict template validation
aws lambda update-function-configuration \
  --function-name bedrock-agent \
  --environment Variables='{
    "ENABLE_STRICT_TEMPLATE_VALIDATION":"true",
    "VALIDATE_BEFORE_EXECUTION":"true",
    "LOG_VALIDATION_FAILURES":"true"
  }'
```

3. **Implement A/B Testing**
```bash
# Test template variations
aws lambda update-function-configuration \
  --function-name bedrock-agent \
  --environment Variables='{
    "ENABLE_TEMPLATE_AB_TESTING":"true",
    "AB_TEST_PERCENTAGE":"10"
  }'
```

## Database Issues

### Connection Problems

#### Symptoms
- Database connection timeouts
- "ECONNREFUSED" errors
- High database connection count

#### Diagnosis Steps
```bash
# Check active connections
psql $DATABASE_URL -c "
SELECT 
  state,
  COUNT(*) as connection_count
FROM pg_stat_activity 
WHERE datname = current_database()
GROUP BY state;
"

# Check for long-running queries
psql $DATABASE_URL -c "
SELECT 
  pid,
  now() - pg_stat_activity.query_start AS duration,
  query 
FROM pg_stat_activity 
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes'
  AND state = 'active';
"
```

#### Resolution Steps
```bash
# Optimize connection pooling
aws lambda update-function-configuration \
  --function-name bedrock-agent \
  --environment Variables='{
    "DB_CONNECTION_POOL_SIZE":"5",
    "DB_CONNECTION_TIMEOUT":"30000",
    "DB_IDLE_TIMEOUT":"60000",
    "DB_MAX_LIFETIME":"3600000"
  }'

# Kill long-running queries if necessary
psql $DATABASE_URL -c "
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE (now() - pg_stat_activity.query_start) > interval '10 minutes'
  AND state = 'active'
  AND query NOT LIKE '%pg_stat_activity%';
"
```

### Performance Issues

#### Symptoms
- Slow database queries
- High CPU usage on database
- Query timeouts

#### Diagnosis Steps
```bash
# Check slow queries
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

# Check missing indexes
psql $DATABASE_URL -c "
SELECT 
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats 
WHERE tablename = 'ai_action_logs'
  AND n_distinct > 100
ORDER BY n_distinct DESC;
"
```

#### Resolution Steps
```bash
# Add performance indexes
psql $DATABASE_URL -c "
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_logs_created_at 
ON ai_action_logs(created_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_logs_request_type_created 
ON ai_action_logs(request_type, created_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_logs_template_status 
ON ai_action_logs(template_id, status);
"

# Update table statistics
psql $DATABASE_URL -c "ANALYZE ai_action_logs;"
```

## AWS Service Issues

### Bedrock Service Problems

#### Symptoms
- "ServiceUnavailableException" errors
- "ThrottlingException" errors
- Model not responding

#### Diagnosis Steps
```bash
# Check Bedrock service status
aws bedrock-runtime invoke-model \
  --model-id anthropic.claude-3-5-sonnet-20240620-v1:0 \
  --body '{"anthropic_version":"bedrock-2023-05-31","max_tokens":10,"messages":[{"role":"user","content":"test"}]}' \
  --cli-binary-format raw-in-base64-out \
  /tmp/bedrock-test.json

# Check recent Bedrock errors
aws logs filter-log-events \
  --log-group-name /aws/lambda/bedrock-agent \
  --start-time $(date -d "1 hour ago" +%s)000 \
  --filter-pattern "bedrock"
```

#### Resolution Steps
```bash
# Enable retry logic
aws lambda update-function-configuration \
  --function-name bedrock-agent \
  --environment Variables='{
    "BEDROCK_MAX_RETRIES":"5",
    "BEDROCK_RETRY_DELAY":"2000",
    "BEDROCK_EXPONENTIAL_BACKOFF":"true"
  }'

# Switch to fallback responses temporarily
aws lambda update-function-configuration \
  --function-name bedrock-agent \
  --environment Variables='{
    "ENABLE_FALLBACK_RESPONSES":"true",
    "FALLBACK_RESPONSE_TTL":"3600"
  }'
```

### Lambda Function Issues

#### Symptoms
- Function timeouts
- Memory limit exceeded
- Cold start issues

#### Diagnosis Steps
```bash
# Check function metrics
aws cloudwatch get-metric-statistics \
  --namespace "AWS/Lambda" \
  --metric-name "Duration" \
  --dimensions Name=FunctionName,Value=bedrock-agent \
  --start-time $(date -d "1 hour ago" -u +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average,Maximum

# Check for memory issues
aws logs filter-log-events \
  --log-group-name /aws/lambda/bedrock-agent \
  --start-time $(date -d "1 hour ago" +%s)000 \
  --filter-pattern "Task timed out OR Memory Size"
```

#### Resolution Steps
```bash
# Increase memory and timeout
aws lambda update-function-configuration \
  --function-name bedrock-agent \
  --memory-size 1024 \
  --timeout 300

# Enable provisioned concurrency for cold starts
aws lambda put-provisioned-concurrency-config \
  --function-name bedrock-agent \
  --provisioned-concurrency-config ProvisionedConcurrencyConfig=5
```

## Monitoring and Alerting Issues

### Missing Metrics

#### Symptoms
- No data in CloudWatch dashboards
- Missing custom metrics
- Incomplete logs

#### Diagnosis Steps
```bash
# Check CloudWatch agent status
aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/bedrock"

# Verify custom metrics
aws cloudwatch list-metrics --namespace "MatbakhAI"

# Check log retention
aws logs describe-log-groups \
  --log-group-name-prefix "/aws/lambda/bedrock" \
  --query 'logGroups[].{Name:logGroupName,Retention:retentionInDays}'
```

#### Resolution Steps
```bash
# Recreate missing log groups
aws logs create-log-group \
  --log-group-name "/aws/lambda/bedrock-agent" \
  --retention-in-days 30

# Enable detailed monitoring
aws lambda update-function-configuration \
  --function-name bedrock-agent \
  --environment Variables='{
    "ENABLE_DETAILED_LOGGING":"true",
    "LOG_LEVEL":"INFO",
    "ENABLE_CUSTOM_METRICS":"true"
  }'
```

### Alert Fatigue

#### Symptoms
- Too many false positive alerts
- Important alerts being ignored
- Alert storms during incidents

#### Resolution Steps
```bash
# Adjust alert thresholds
aws cloudwatch put-metric-alarm \
  --alarm-name "BedrockAI-HighErrorRate" \
  --threshold 10.0 \
  --evaluation-periods 3 \
  --datapoints-to-alarm 2

# Implement alert suppression
aws cloudwatch put-composite-alarm \
  --alarm-name "BedrockAI-ServiceDegraded" \
  --alarm-rule "(ALARM('BedrockAI-HighErrorRate') OR ALARM('BedrockAI-HighResponseTime')) AND NOT ALARM('BedrockAI-Maintenance')"
```

## Recovery Procedures

### Service Recovery Checklist

1. **Immediate Actions**
   - [ ] Acknowledge the incident
   - [ ] Check system status
   - [ ] Enable fallback mode if necessary
   - [ ] Notify stakeholders

2. **Investigation**
   - [ ] Collect logs and metrics
   - [ ] Identify root cause
   - [ ] Assess impact scope
   - [ ] Document findings

3. **Resolution**
   - [ ] Apply immediate fixes
   - [ ] Test functionality
   - [ ] Gradually restore service
   - [ ] Monitor for issues

4. **Post-Incident**
   - [ ] Conduct post-mortem
   - [ ] Update documentation
   - [ ] Implement preventive measures
   - [ ] Update monitoring

### Data Recovery

#### Backup Restoration
```bash
# List available backups
aws s3 ls s3://matbakh-backups/ai-core/

# Download and restore latest backup
LATEST_BACKUP=$(aws s3 ls s3://matbakh-backups/ai-core/ | sort | tail -n 1 | awk '{print $4}')
aws s3 cp "s3://matbakh-backups/ai-core/$LATEST_BACKUP" /tmp/
gunzip -c "/tmp/$LATEST_BACKUP" | psql $DATABASE_URL
```

#### Point-in-Time Recovery
```bash
# Restore to specific timestamp
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier matbakh-prod \
  --target-db-instance-identifier matbakh-recovery \
  --restore-time 2024-01-15T10:30:00Z
```

## Prevention Strategies

### Proactive Monitoring
- Set up comprehensive alerting
- Implement health checks
- Monitor key performance indicators
- Regular system audits

### Capacity Planning
- Monitor resource utilization
- Plan for traffic spikes
- Implement auto-scaling
- Regular load testing

### Documentation Maintenance
- Keep troubleshooting guides updated
- Document all incidents
- Maintain runbooks
- Regular training sessions

## Contact Information

### Emergency Contacts
- **Primary On-Call**: +49-xxx-xxx-xxxx
- **Secondary On-Call**: +49-xxx-xxx-xxxx
- **Engineering Manager**: engineering@matbakh.app

### Support Resources
- **Internal Documentation**: https://docs.internal.matbakh.app
- **AWS Support**: Premium Support Case
- **Anthropic Support**: enterprise-support@anthropic.com

---

**Document Version**: 1.0.0  
**Last Updated**: January 15, 2024  
**Next Review**: April 15, 2024