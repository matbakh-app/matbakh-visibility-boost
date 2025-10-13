# Hybrid Routing - Incident Response Runbook

**Version**: 1.0.0  
**Last Updated**: 2025-01-14  
**Owner**: DevOps & AI Operations Team

## Critical Incidents

### 1. Complete System Outage

**Severity**: P0 - Critical  
**Response Time**: Immediate  
**Impact**: All AI operations unavailable

#### Symptoms

- Health endpoint returns 503
- All routing paths failing
- Multiple critical alerts

#### Immediate Actions

1. **Verify Outage** (2 minutes)

   ```bash
   # Check health endpoint
   curl -v https://api.matbakh.app/health

   # Check CloudWatch metrics
   aws cloudwatch get-metric-statistics \
     --namespace "HybridRouting/Health" \
     --metric-name "SystemHealth" \
     --start-time $(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%S) \
     --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
     --period 60 \
     --statistics Average
   ```

2. **Activate Incident Response** (1 minute)

   - Create PagerDuty incident
   - Notify #ops-critical Slack channel
   - Assemble incident response team

3. **Check Infrastructure** (3 minutes)

   ```bash
   # Check ECS services
   aws ecs describe-services \
     --cluster hybrid-routing-cluster \
     --services hybrid-routing-service

   # Check ALB health
   aws elbv2 describe-target-health \
     --target-group-arn <target-group-arn>
   ```

4. **Attempt Quick Recovery** (5 minutes)

   ```bash
   # Restart services
   aws ecs update-service \
     --cluster hybrid-routing-cluster \
     --service hybrid-routing-service \
     --force-new-deployment

   # Clear circuit breakers
   curl -X POST https://api.matbakh.app/admin/circuit-breaker/reset
   ```

5. **Implement Fallback** (if recovery fails)
   - Enable emergency mode
   - Route all traffic to backup system
   - Communicate status to stakeholders

#### Root Cause Analysis

- Review CloudWatch Logs for errors
- Check AWS Health Dashboard
- Analyze metrics leading up to outage
- Document timeline and actions taken

#### Prevention

- Implement additional monitoring
- Review and update runbooks
- Conduct post-mortem meeting
- Update incident response procedures

### 2. Bedrock Client Failure

**Severity**: P0 - Critical  
**Response Time**: Immediate  
**Impact**: Direct Bedrock operations unavailable

#### Symptoms

- Direct Bedrock health = Critical
- All direct operations failing
- Automatic fallback to MCP active

#### Immediate Actions

1. **Verify Bedrock Status** (2 minutes)

   ```bash
   # Check Bedrock service health
   aws bedrock-runtime invoke-model \
     --model-id anthropic.claude-3-sonnet-20240229-v1:0 \
     --body '{"anthropic_version":"bedrock-2023-05-31","max_tokens":10,"messages":[{"role":"user","content":"test"}]}' \
     --region eu-central-1 \
     output.json

   # Check AWS Health Dashboard
   aws health describe-events \
     --filter services=BEDROCK \
     --region us-east-1
   ```

2. **Enable Aggressive MCP Fallback** (1 minute)

   ```bash
   curl -X POST https://api.matbakh.app/admin/routing/force-mcp \
     -H "Content-Type: application/json" \
     -d '{"reason": "Bedrock unavailable", "duration": 3600}'
   ```

3. **Notify Stakeholders** (2 minutes)

   - Post in #ops-critical
   - Create PagerDuty incident
   - Update status page

4. **Monitor Fallback Performance** (ongoing)
   ```bash
   # Watch MCP routing metrics
   watch -n 30 'curl -s https://api.matbakh.app/health/component/mcp-router | jq'
   ```

#### Recovery Steps

1. **Wait for AWS Resolution** or **Investigate Configuration**

   ```bash
   # Check IAM permissions
   aws iam simulate-principal-policy \
     --policy-source-arn <role-arn> \
     --action-names bedrock:InvokeModel \
     --resource-arns "*"

   # Check VPC endpoints
   aws ec2 describe-vpc-endpoints \
     --filters Name=service-name,Values=com.amazonaws.eu-central-1.bedrock-runtime
   ```

2. **Test Bedrock Connectivity**

   ```bash
   # Simple test call
   curl -X POST https://api.matbakh.app/admin/bedrock/test
   ```

3. **Gradually Re-enable Direct Bedrock**

   ```bash
   # Enable for 10% of traffic
   curl -X POST https://api.matbakh.app/admin/routing/bedrock-percentage \
     -H "Content-Type: application/json" \
     -d '{"percentage": 10}'

   # Monitor for 10 minutes, then increase to 50%
   # Monitor for 10 minutes, then increase to 100%
   ```

### 3. MCP Router Failure

**Severity**: P1 - High  
**Response Time**: 15 minutes  
**Impact**: Standard operations degraded, fallback to direct Bedrock

#### Symptoms

- MCP router health = Critical
- Standard operations routing to direct Bedrock
- Increased direct Bedrock usage

#### Immediate Actions

1. **Verify MCP Status** (3 minutes)

   ```bash
   # Check MCP router health
   curl https://api.matbakh.app/health/component/mcp-router

   # Check MCP service logs
   aws logs tail /aws/ecs/mcp-router --follow --since 10m
   ```

2. **Check Message Queue** (2 minutes)

   ```bash
   # Check SQS queue depth
   aws sqs get-queue-attributes \
     --queue-url <mcp-queue-url> \
     --attribute-names ApproximateNumberOfMessages
   ```

3. **Restart MCP Router** (5 minutes)

   ```bash
   aws ecs update-service \
     --cluster mcp-cluster \
     --service mcp-router-service \
     --force-new-deployment
   ```

4. **Monitor Recovery** (ongoing)
   ```bash
   watch -n 30 'curl -s https://api.matbakh.app/health/component/mcp-router | jq'
   ```

### 4. High Error Rate

**Severity**: P1 - High  
**Response Time**: 15 minutes  
**Impact**: Degraded user experience

#### Symptoms

- Error rate >5%
- Multiple failed operations
- Increased alert volume

#### Immediate Actions

1. **Identify Error Pattern** (5 minutes)

   ```bash
   # Check error logs
   aws logs filter-log-events \
     --log-group-name "/aws/ecs/hybrid-routing" \
     --filter-pattern "ERROR" \
     --start-time $(date -u -d '15 minutes ago' +%s)000

   # Group errors by type
   aws logs filter-log-events \
     --log-group-name "/aws/ecs/hybrid-routing" \
     --filter-pattern "ERROR" \
     --start-time $(date -u -d '15 minutes ago' +%s)000 \
     | jq '.events[].message' \
     | sort | uniq -c | sort -rn
   ```

2. **Check for Common Causes** (5 minutes)

   - Timeout errors → Check latency metrics
   - Authentication errors → Check IAM roles
   - Throttling errors → Check API quotas
   - Validation errors → Check input data

3. **Implement Mitigation** (5 minutes)

   ```bash
   # Increase timeout if timeout errors
   curl -X POST https://api.matbakh.app/admin/config/update \
     -H "Content-Type: application/json" \
     -d '{"timeout": 15000}'

   # Enable circuit breaker if cascading failures
   curl -X POST https://api.matbakh.app/admin/circuit-breaker/enable
   ```

### 5. Routing Efficiency Degradation

**Severity**: P2 - Medium  
**Response Time**: 1 hour  
**Impact**: Suboptimal routing decisions

#### Symptoms

- Routing efficiency <70%
- Increased fallback usage
- Suboptimal path selection

#### Investigation Steps

1. **Review Routing Decisions** (10 minutes)

   ```bash
   # Get routing decision log
   aws logs filter-log-events \
     --log-group-name "/aws/ecs/hybrid-routing" \
     --filter-pattern "routing-decision" \
     --start-time $(date -u -d '1 hour ago' +%s)000 \
     | jq '.events[].message | fromjson | {operation, route, reason}'
   ```

2. **Analyze Health Metrics** (10 minutes)

   - Check if health checks are accurate
   - Verify component health status
   - Review fallback trigger conditions

3. **Optimize Routing Configuration** (20 minutes)

   ```bash
   # Update routing thresholds
   curl -X POST https://api.matbakh.app/admin/routing/config \
     -H "Content-Type: application/json" \
     -d '{
       "directBedrockLatencyThreshold": 8000,
       "mcpLatencyThreshold": 25000,
       "fallbackAggressiveness": 0.7
     }'
   ```

4. **Monitor Improvement** (20 minutes)
   ```bash
   # Watch routing efficiency
   watch -n 60 'curl -s https://api.matbakh.app/health/metrics | jq .data.routingEfficiency'
   ```
