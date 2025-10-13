# AI Quota Management Runbook

**Version:** 1.0  
**Last Updated:** 2025-01-14  
**Owner:** AI Operations Team

## 📊 Overview

This runbook covers monitoring, managing, and responding to AI provider quota limits across AWS Bedrock, Google Vertex AI, and Meta AI services.

## 🎯 Quota Monitoring Strategy

### Current Quota Limits

#### AWS Bedrock

```yaml
claude-3-5-sonnet:
  requests_per_minute: 1000
  tokens_per_minute: 100000
  requests_per_day: 50000

claude-3-haiku:
  requests_per_minute: 2000
  tokens_per_minute: 200000
  requests_per_day: 100000
```

#### Google Vertex AI

```yaml
gemini-pro:
  requests_per_minute: 300
  tokens_per_minute: 32000
  requests_per_day: 15000

gemini-pro-vision:
  requests_per_minute: 100
  tokens_per_minute: 16000
  requests_per_day: 5000
```

#### Meta AI

```yaml
llama-2-70b:
  requests_per_minute: 200
  tokens_per_minute: 20000
  requests_per_day: 10000
```

### Monitoring Commands

#### Real-time Quota Check

```bash
# Check current usage across all providers
tsx quality-gates-cli.ts status --quota-check

# Provider-specific quota status
aws bedrock get-model-invocation-logging-configuration
gcloud ai models list --filter="displayName:gemini-pro"
```

#### Usage Analytics

```bash
# Generate quota usage report
tsx quality-gates-cli.ts report --type quota-usage --period 24h

# Check quota utilization trends
aws cloudwatch get-metric-statistics \
  --namespace "AI/Quotas" \
  --metric-name "QuotaUtilization" \
  --start-time $(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 3600 \
  --statistics Average,Maximum
```

## 🚨 Quota Alert Thresholds

### Warning Levels

- **70% Utilization**: Increase monitoring frequency
- **80% Utilization**: Prepare quota increase request
- **90% Utilization**: Activate traffic distribution
- **95% Utilization**: Emergency procedures

### Alert Configuration

```yaml
quota_alerts:
  warning_threshold: 70
  critical_threshold: 90
  emergency_threshold: 95

  notification_channels:
    - slack://ops-alerts
    - email://ai-team@matbakh.app
    - pagerduty://ai-quota-alerts
```

## 🛠️ Quota Management Procedures

### 1. **Proactive Quota Monitoring**

#### Daily Quota Check

```bash
#!/bin/bash
# Daily quota monitoring script

echo "🔍 Daily AI Quota Check - $(date)"
echo "=================================="

# Check AWS Bedrock quotas
echo "📊 AWS Bedrock Usage:"
aws service-quotas get-service-quota \
  --service-code bedrock \
  --quota-code L-12345678 \
  --query 'Quota.Value'

# Check Google Vertex AI quotas
echo "📊 Google Vertex AI Usage:"
gcloud compute project-info describe \
  --format="value(quotas[].usage,quotas[].limit)" \
  --filter="quotas.metric:vertex-ai"

# Generate usage summary
tsx quality-gates-cli.ts report --type quota-summary
```

#### Weekly Quota Planning

```bash
# Analyze usage trends
tsx quality-gates-cli.ts report --type quota-trends --period 7d

# Forecast quota needs
python scripts/quota-forecasting.py --days 30

# Generate quota increase recommendations
tsx quality-gates-cli.ts config validate --quota-planning
```

### 2. **Quota Increase Requests**

#### AWS Bedrock Quota Increase

```bash
# Request quota increase
aws service-quotas request-service-quota-increase \
  --service-code bedrock \
  --quota-code L-12345678 \
  --desired-value 2000 \
  --case-description "Increased AI workload for production system"

# Check request status
aws service-quotas get-requested-service-quota-change \
  --request-id <request-id>
```

#### Google Vertex AI Quota Increase

```bash
# Request quota increase via gcloud
gcloud compute project-info describe \
  --format="table(quotas.metric,quotas.limit,quotas.usage)"

# Submit quota increase request
gcloud alpha compute quotas update \
  --service=vertex-ai \
  --consumer=projects/PROJECT_ID \
  --metric=requests_per_minute \
  --value=600
```

#### Documentation Template

```markdown
## Quota Increase Request

**Provider:** AWS Bedrock / Google Vertex AI / Meta AI
**Service:** [Service Name]
**Current Limit:** [Current Value]
**Requested Limit:** [New Value]
**Justification:**

- Current usage: X% of limit
- Expected growth: Y% over next 30 days
- Business impact: [Description]
  **Timeline:** [When increase is needed]
```

### 3. **Emergency Quota Management**

#### Immediate Actions (Quota > 95%)

```bash
# 1. Activate traffic distribution
tsx quality-gates-cli.ts config set --traffic-distribution emergency

# 2. Enable aggressive caching
tsx quality-gates-cli.ts config set --cache-mode aggressive

# 3. Implement rate limiting
tsx quality-gates-cli.ts config set --rate-limit emergency

# 4. Notify stakeholders
slack-notify "#ops-alerts" "🚨 QUOTA EMERGENCY: Provider quotas at 95%"
```

#### Traffic Distribution Strategy

```yaml
emergency_distribution:
  primary_provider: 40% # Reduce load on quota-limited provider
  secondary_provider: 35% # Increase load on available providers
  tertiary_provider: 25% # Utilize backup providers

  cache_strategy:
    hit_rate_target: 95% # Increase cache hit rate
    ttl_extension: 2x # Extend cache TTL temporarily

  rate_limiting:
    requests_per_minute: 80% # Reduce to 80% of normal rate
    burst_allowance: 50% # Reduce burst capacity
```

## 📈 Quota Optimization Strategies

### 1. **Intelligent Request Routing**

#### Load Balancing Algorithm

```typescript
interface QuotaAwareRouting {
  providers: {
    bedrock: { utilization: number; capacity: number };
    google: { utilization: number; capacity: number };
    meta: { utilization: number; capacity: number };
  };

  routingStrategy: 'round-robin' | 'least-utilized' | 'quota-aware';

  getOptimalProvider(): string {
    // Route to provider with lowest quota utilization
    const providers = Object.entries(this.providers);
    return providers.reduce((best, [name, stats]) => {
      const utilization = stats.utilization / stats.capacity;
      const bestUtilization = this.providers[best].utilization / this.providers[best].capacity;
      return utilization < bestUtilization ? name : best;
    }, providers[0][0]);
  }
}
```

#### Implementation

```bash
# Enable quota-aware routing
tsx quality-gates-cli.ts config set --routing-strategy quota-aware

# Monitor routing effectiveness
tsx quality-gates-cli.ts monitor --routing-metrics --duration 60
```

### 2. **Caching Optimization**

#### Aggressive Caching Strategy

```bash
# Enable high-performance caching
tsx quality-gates-cli.ts config set --cache-strategy aggressive

# Cache configuration
cat > cache-config.json << EOF
{
  "cache_ttl": 3600,
  "cache_hit_target": 90,
  "cache_warming": true,
  "cache_compression": true,
  "cache_layers": ["memory", "redis", "s3"]
}
EOF

# Apply cache configuration
tsx quality-gates-cli.ts config apply --cache-config cache-config.json
```

#### Cache Performance Monitoring

```bash
# Monitor cache performance
tsx quality-gates-cli.ts monitor --cache-metrics --duration 30

# Cache hit rate analysis
aws cloudwatch get-metric-statistics \
  --namespace "AI/Cache" \
  --metric-name "HitRate" \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average
```

### 3. **Request Optimization**

#### Batch Processing

```bash
# Enable request batching
tsx quality-gates-cli.ts config set --batch-processing enabled

# Batch configuration
cat > batch-config.json << EOF
{
  "batch_size": 10,
  "batch_timeout": 100,
  "batch_compression": true,
  "parallel_batches": 5
}
EOF
```

#### Token Optimization

```bash
# Analyze token usage patterns
tsx quality-gates-cli.ts report --type token-analysis --period 24h

# Optimize prompt templates
python scripts/prompt-optimization.py --reduce-tokens --target-reduction 20%
```

## 🔄 Quota Recovery Procedures

### After Quota Increase Approval

#### 1. **Gradual Capacity Restoration**

```bash
# Step 1: Verify new quota limits
tsx quality-gates-cli.ts status --quota-check --verify-limits

# Step 2: Gradually increase traffic
tsx quality-gates-cli.ts config set --traffic-percentage 25%
sleep 300  # Wait 5 minutes
tsx quality-gates-cli.ts config set --traffic-percentage 50%
sleep 300
tsx quality-gates-cli.ts config set --traffic-percentage 75%
sleep 300
tsx quality-gates-cli.ts config set --traffic-percentage 100%
```

#### 2. **Performance Validation**

```bash
# Monitor performance during restoration
tsx quality-gates-cli.ts monitor --performance-metrics --duration 30

# Validate no quota violations
tsx quality-gates-cli.ts validate --quota-compliance
```

#### 3. **Configuration Cleanup**

```bash
# Remove emergency configurations
tsx quality-gates-cli.ts config unset --emergency-mode
tsx quality-gates-cli.ts config set --cache-mode normal
tsx quality-gates-cli.ts config set --rate-limit normal
```

## 📊 Quota Reporting & Analytics

### Daily Quota Report

```bash
#!/bin/bash
# Generate daily quota report

REPORT_DATE=$(date +%Y-%m-%d)
REPORT_FILE="quota-report-${REPORT_DATE}.md"

cat > $REPORT_FILE << EOF
# AI Quota Usage Report - $REPORT_DATE

## Summary
$(tsx quality-gates-cli.ts report --type quota-summary --format markdown)

## Provider Breakdown
$(tsx quality-gates-cli.ts report --type provider-usage --format markdown)

## Trends
$(tsx quality-gates-cli.ts report --type quota-trends --period 7d --format markdown)

## Recommendations
$(tsx quality-gates-cli.ts report --type quota-recommendations --format markdown)
EOF

echo "📊 Daily quota report generated: $REPORT_FILE"
```

### Weekly Quota Analysis

```bash
# Generate comprehensive weekly analysis
tsx quality-gates-cli.ts report \
  --type comprehensive \
  --period 7d \
  --include quota,performance,costs \
  --output weekly-quota-analysis.pdf
```

### Monthly Quota Planning

```bash
# Generate monthly quota planning report
python scripts/quota-forecasting.py \
  --period 30d \
  --forecast 90d \
  --output monthly-quota-plan.json

# Create quota increase timeline
tsx quality-gates-cli.ts config plan-quota-increases \
  --input monthly-quota-plan.json \
  --output quota-increase-timeline.md
```

## 🚨 Emergency Contacts & Escalation

### Quota Emergency Contacts

- **Primary**: AI Operations Team (Slack: #ops-alerts)
- **Secondary**: Infrastructure Team (PagerDuty: ai-quota-emergency)
- **Escalation**: Engineering Manager (Phone: emergency contact)

### Provider Support Contacts

- **AWS Bedrock**: AWS Support Case (Enterprise Support)
- **Google Vertex AI**: Google Cloud Support (Premium Support)
- **Meta AI**: Meta Developer Support Portal

### Escalation Timeline

- **0-15 minutes**: Implement emergency procedures
- **15-30 minutes**: Contact provider support
- **30-60 minutes**: Escalate to engineering management
- **60+ minutes**: Consider service degradation announcement

## 📝 Quota Management Checklist

### Daily Tasks

- [ ] Check quota utilization across all providers
- [ ] Review quota alerts and warnings
- [ ] Validate traffic distribution effectiveness
- [ ] Monitor cache hit rates

### Weekly Tasks

- [ ] Analyze quota usage trends
- [ ] Review and update quota forecasts
- [ ] Test quota emergency procedures
- [ ] Update quota documentation

### Monthly Tasks

- [ ] Submit quota increase requests if needed
- [ ] Review quota optimization strategies
- [ ] Conduct quota emergency drill
- [ ] Update quota management procedures

## 🔗 Related Resources

- [AI Provider Architecture](../ai-provider-architecture.md)
- [Performance Monitoring Guide](../performance-monitoring-guide.md)
- [Cost Optimization Strategies](../cost-optimization-strategies.md)
- [Emergency Response Procedures](./ai-system-incident-response.md)

---

_Remember: Proactive quota management prevents service disruptions. Monitor early, plan ahead, and always have backup strategies ready._

_Last updated: 2025-01-14 by AI Operations Team_
