# Hybrid Routing - Troubleshooting Guide

**Version**: 1.0.0  
**Last Updated**: 2025-01-14  
**Owner**: DevOps & AI Operations Team

## Common Issues

### Issue 1: High Latency on Direct Bedrock Path

**Symptoms**:

- Direct Bedrock operations >10s
- Increased timeout errors
- Degraded routing efficiency

**Diagnosis**:

```bash
# Check Bedrock API latency
aws cloudwatch get-metric-statistics \
  --namespace "HybridRouting/Performance" \
  --metric-name "DirectBedrockLatency" \
  --dimensions Name=OperationType,Value=emergency \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average,Maximum

# Check for throttling
aws cloudwatch get-metric-statistics \
  --namespace "AWS/Bedrock" \
  --metric-name "ThrottledRequests" \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum
```

**Resolution**:

1. **Check AWS Service Health**

   - Visit AWS Health Dashboard
   - Check Bedrock service status in eu-central-1

2. **Review Request Patterns**

   - Check for unusual spike in requests
   - Verify request sizes are within limits

3. **Implement Temporary Mitigation**

   ```bash
   # Increase timeout temporarily
   curl -X POST https://api.matbakh.app/admin/config/update \
     -H "Content-Type: application/json" \
     -d '{"directBedrockTimeout": 15000}'

   # Enable aggressive fallback to MCP
   curl -X POST https://api.matbakh.app/admin/routing/fallback \
     -H "Content-Type: application/json" \
     -d '{"aggressiveFallback": true}'
   ```

4. **Long-term Fix**
   - Request quota increase from AWS
   - Implement request queuing
   - Optimize request payloads

### Issue 2: Poor Routing Efficiency

**Symptoms**:

- Routing efficiency <70%
- Frequent fallback usage
- Suboptimal path selection

**Diagnosis**:

```bash
# Check routing decision patterns
aws logs filter-log-events \
  --log-group-name "/aws/ecs/hybrid-routing" \
  --filter-pattern "routing-decision" \
  --start-time $(date -u -d '1 hour ago' +%s)000 \
  | jq '.events[].message | fromjson | {operation, route, reason, latency}'

# Analyze fallback frequency
aws cloudwatch get-metric-statistics \
  --namespace "HybridRouting/Routing" \
  --metric-name "FallbackRate" \
  --start-time $(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 3600 \
  --statistics Average,Maximum
```

**Resolution**:

1. **Review Health Check Accuracy**

   - Verify health checks reflect actual component status
   - Adjust health check thresholds if needed
   - Check for false positives/negatives

2. **Optimize Routing Configuration**

   ```bash
   # Update routing decision thresholds
   curl -X POST https://api.matbakh.app/admin/routing/optimize \
     -H "Content-Type: application/json" \
     -d '{
       "targetEfficiency": 0.85,
       "optimizationMode": "balanced"
     }'
   ```

3. **Review Operation Classification**
   - Ensure operations are correctly classified
   - Update operation type mappings if needed
   - Verify priority assignments

### Issue 3: High Error Rate

**Symptoms**:

- Error rate >5%
- Multiple failed operations
- Increased alert volume

**Diagnosis**:

```bash
# Identify error types
aws logs filter-log-events \
  --log-group-name "/aws/ecs/hybrid-routing" \
  --filter-pattern "ERROR" \
  --start-time $(date -u -d '30 minutes ago' +%s)000 \
  | jq -r '.events[].message' \
  | grep -oP '(?<=error: )[^,]+' \
  | sort | uniq -c | sort -rn

# Check error rate by component
aws cloudwatch get-metric-statistics \
  --namespace "HybridRouting/Errors" \
  --metric-name "ErrorRate" \
  --dimensions Name=Component,Value=hybrid-router \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average,Maximum
```

**Resolution**:

1. **Timeout Errors**

   ```bash
   # Increase timeouts
   curl -X POST https://api.matbakh.app/admin/config/update \
     -H "Content-Type: application/json" \
     -d '{
       "directBedrockTimeout": 15000,
       "mcpTimeout": 45000
     }'
   ```

2. **Authentication Errors**

   ```bash
   # Verify IAM roles
   aws iam get-role --role-name HybridRoutingRole

   # Check assume role policy
   aws sts assume-role \
     --role-arn <role-arn> \
     --role-session-name test-session
   ```

3. **Throttling Errors**

   ```bash
   # Check API quotas
   aws service-quotas get-service-quota \
     --service-code bedrock \
     --quota-code L-<quota-code>

   # Request quota increase if needed
   aws service-quotas request-service-quota-increase \
     --service-code bedrock \
     --quota-code L-<quota-code> \
     --desired-value <new-value>
   ```

4. **Validation Errors**
   - Review input validation logic
   - Check for malformed requests
   - Update validation rules if needed

### Issue 4: Cache Performance Issues

**Symptoms**:

- Cache hit rate <70%
- Increased latency
- Higher costs

**Diagnosis**:

```bash
# Check cache metrics
aws cloudwatch get-metric-statistics \
  --namespace "HybridRouting/Cache" \
  --metric-name "HitRate" \
  --start-time $(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 3600 \
  --statistics Average

# Check cache size
curl https://api.matbakh.app/admin/cache/stats
```

**Resolution**:

1. **Optimize Cache Configuration**

   ```bash
   # Increase cache TTL
   curl -X POST https://api.matbakh.app/admin/cache/config \
     -H "Content-Type: application/json" \
     -d '{
       "ttl": 7200,
       "maxSize": "500MB",
       "evictionPolicy": "lru"
     }'
   ```

2. **Warm Up Cache**

   ```bash
   # Trigger cache warmup
   curl -X POST https://api.matbakh.app/admin/cache/warmup
   ```

3. **Review Cache Keys**
   - Ensure cache keys are consistent
   - Check for cache key collisions
   - Optimize cache key generation

### Issue 5: Circuit Breaker Tripped

**Symptoms**:

- Circuit breaker open
- Operations blocked
- Fallback routing active

**Diagnosis**:

```bash
# Check circuit breaker status
curl https://api.matbakh.app/health/component/circuit-breaker

# Review failure history
aws logs filter-log-events \
  --log-group-name "/aws/ecs/hybrid-routing" \
  --filter-pattern "circuit-breaker" \
  --start-time $(date -u -d '30 minutes ago' +%s)000
```

**Resolution**:

1. **Identify Root Cause**

   - Check component health that triggered circuit breaker
   - Review error logs for failure patterns
   - Verify external dependencies

2. **Fix Underlying Issue**

   - Resolve component health issues
   - Fix configuration problems
   - Restart failed services

3. **Reset Circuit Breaker** (only after fix confirmed)

   ```bash
   # Reset circuit breaker
   curl -X POST https://api.matbakh.app/admin/circuit-breaker/reset \
     -H "Content-Type: application/json" \
     -d '{"component": "bedrock-client"}'
   ```

4. **Monitor Recovery**
   ```bash
   # Watch circuit breaker status
   watch -n 30 'curl -s https://api.matbakh.app/health/component/circuit-breaker | jq'
   ```

### 6. Alert Storm

**Severity**: P2 - Medium  
**Response Time**: 30 minutes  
**Impact**: Alert fatigue, potential missed critical alerts

#### Symptoms

- > 10 alerts in 5 minutes
- Repeated alerts for same issue
- Alert notification overload

#### Immediate Actions

1. **Identify Alert Source** (5 minutes)

   ```bash
   # List active alerts
   curl https://api.matbakh.app/health/alerts | jq '.data.alerts | group_by(.component)'
   ```

2. **Suppress Non-Critical Alerts** (5 minutes)

   ```bash
   # Temporarily increase alert thresholds
   curl -X POST https://api.matbakh.app/admin/alerts/suppress \
     -H "Content-Type: application/json" \
     -d '{
       "severity": ["low", "medium"],
       "duration": 1800
     }'
   ```

3. **Address Root Cause** (15 minutes)

   - Fix underlying issue causing alerts
   - Follow relevant troubleshooting procedure
   - Verify fix resolves alert condition

4. **Resolve Alerts** (5 minutes)
   ```bash
   # Bulk resolve alerts
   curl -X POST https://api.matbakh.app/admin/alerts/bulk-resolve \
     -H "Content-Type: application/json" \
     -d '{"component": "cache-layer"}'
   ```

#### Prevention

- Review and adjust alert thresholds
- Implement alert aggregation
- Add alert rate limiting
- Improve alert correlation
