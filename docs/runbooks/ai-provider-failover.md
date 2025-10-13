# AI Provider Failover Runbook

**Version:** 1.0  
**Last Updated:** 2025-01-14  
**Owner:** AI Operations Team

## 🎯 Overview

This runbook covers procedures for handling AI provider failures, implementing failover strategies, and maintaining service continuity across AWS Bedrock, Google Vertex AI, and Meta AI services.

## 🏗️ Failover Architecture

### Provider Hierarchy

```yaml
primary_providers:
  - bedrock: claude-3-5-sonnet-v2
  - google: gemini-pro
  - meta: llama-2-70b

failover_chains:
  bedrock_chain:
    primary: bedrock
    secondary: google
    tertiary: meta

  google_chain:
    primary: google
    secondary: bedrock
    tertiary: meta

  meta_chain:
    primary: meta
    secondary: bedrock
    tertiary: google
```

### Failover Triggers

- **Provider Unavailability**: HTTP 5xx errors > 5%
- **High Latency**: P95 > 3000ms for 5 minutes
- **Quota Exhaustion**: Rate limiting errors > 10%
- **Quality Degradation**: Accuracy drop > 10%
- **Manual Trigger**: Operator-initiated failover

## 🚨 Failover Detection & Response

### Automated Detection

```bash
# Health check script (runs every 30 seconds)
#!/bin/bash

PROVIDERS=("bedrock" "google" "meta")
HEALTH_THRESHOLD=3  # Consecutive failures before failover

for provider in "${PROVIDERS[@]}"; do
    echo "🔍 Checking $provider health..."

    # Run health check
    health_status=$(tsx quality-gates-cli.ts status --provider $provider --health-only)

    if [[ $health_status == *"UNHEALTHY"* ]]; then
        echo "⚠️ $provider is unhealthy, incrementing failure count"

        # Check failure count
        failure_count=$(redis-cli GET "failover:$provider:failures" || echo "0")
        failure_count=$((failure_count + 1))
        redis-cli SET "failover:$provider:failures" $failure_count EX 300

        if [[ $failure_count -ge $HEALTH_THRESHOLD ]]; then
            echo "🚨 Triggering failover for $provider"
            tsx quality-gates-cli.ts rollback \
                --provider $provider \
                --reason "Health check failure threshold exceeded"
        fi
    else
        echo "✅ $provider is healthy"
        redis-cli DEL "failover:$provider:failures"
    fi
done
```

### Manual Failover Triggers

```bash
# Emergency provider failover
tsx quality-gates-cli.ts rollback \
    --provider bedrock \
    --target-provider google \
    --reason "Manual failover - provider maintenance"

# Gradual traffic shift
tsx quality-gates-cli.ts config set \
    --traffic-distribution "bedrock:0,google:80,meta:20" \
    --transition-duration 300  # 5 minutes
```

## 🔄 Failover Procedures

### 1. **Immediate Failover (< 30 seconds)**

#### Automated Failover

```bash
# Triggered automatically by monitoring system
tsx quality-gates-cli.ts failover \
    --failed-provider bedrock \
    --auto-select-target \
    --emergency-mode

# Verify failover success
tsx quality-gates-cli.ts status --failover-status
```

#### Manual Emergency Failover

```bash
# Step 1: Identify failed provider
tsx quality-gates-cli.ts status --provider-health

# Step 2: Execute immediate failover
tsx quality-gates-cli.ts failover \
    --failed-provider bedrock \
    --target-provider google \
    --mode immediate

# Step 3: Verify service restoration
tsx quality-gates-cli.ts validate --post-failover
```

### 2. **Gradual Failover (2-5 minutes)**

#### Traffic Shifting Strategy

```bash
# Phase 1: Reduce failed provider to 50%
tsx quality-gates-cli.ts config set \
    --traffic-distribution "bedrock:50,google:30,meta:20"

# Wait and monitor
sleep 60
tsx quality-gates-cli.ts monitor --duration 2 --metrics error_rate,latency

# Phase 2: Reduce to 25%
tsx quality-gates-cli.ts config set \
    --traffic-distribution "bedrock:25,google:50,meta:25"

# Wait and monitor
sleep 60
tsx quality-gates-cli.ts monitor --duration 2 --metrics error_rate,latency

# Phase 3: Complete failover
tsx quality-gates-cli.ts config set \
    --traffic-distribution "bedrock:0,google:70,meta:30"
```

### 3. **Canary Failover (5-15 minutes)**

#### Controlled Migration

```bash
# Start with 5% traffic to new provider
tsx quality-gates-cli.ts canary \
    --source-provider bedrock \
    --target-provider google \
    --traffic-percentage 5 \
    --duration 300

# Monitor canary performance
tsx quality-gates-cli.ts monitor \
    --canary-mode \
    --duration 5 \
    --success-threshold 98%

# Gradually increase if successful
for percentage in 10 25 50 75 100; do
    echo "🔄 Increasing canary traffic to $percentage%"
    tsx quality-gates-cli.ts canary \
        --update-traffic $percentage

    sleep 120  # Wait 2 minutes between increases

    # Check performance
    if ! tsx quality-gates-cli.ts validate --canary-health; then
        echo "❌ Canary validation failed, rolling back"
        tsx quality-gates-cli.ts canary --rollback
        exit 1
    fi
done
```

## 🛠️ Provider-Specific Procedures

### AWS Bedrock Failover

#### Common Bedrock Issues

- **Throttling**: Rate limit exceeded
- **Model Unavailability**: Specific model temporarily unavailable
- **Region Issues**: AWS region-specific problems

#### Bedrock Failover Commands

```bash
# Check Bedrock service status
aws bedrock list-foundation-models --region us-east-1

# Test Bedrock connectivity
aws bedrock invoke-model \
    --model-id anthropic.claude-3-5-sonnet-20241022-v2:0 \
    --body '{"messages":[{"role":"user","content":"test"}],"max_tokens":10}' \
    --content-type application/json \
    --accept application/json \
    /tmp/bedrock-test.json

# Failover to Google if Bedrock fails
tsx quality-gates-cli.ts failover \
    --from bedrock \
    --to google \
    --reason "Bedrock service unavailable"
```

### Google Vertex AI Failover

#### Common Google Issues

- **API Quota Exceeded**: Daily/hourly limits reached
- **Authentication Issues**: Service account problems
- **Model Loading Errors**: Model initialization failures

#### Google Failover Commands

```bash
# Check Google Vertex AI status
gcloud ai models list --region=us-central1

# Test Google connectivity
curl -X POST \
    -H "Authorization: Bearer $(gcloud auth print-access-token)" \
    -H "Content-Type: application/json" \
    -d '{"contents":[{"parts":[{"text":"test"}]}]}' \
    "https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent"

# Failover to Bedrock if Google fails
tsx quality-gates-cli.ts failover \
    --from google \
    --to bedrock \
    --reason "Google Vertex AI quota exceeded"
```

### Meta AI Failover

#### Common Meta Issues

- **API Rate Limits**: Request rate exceeded
- **Model Capacity**: Insufficient model capacity
- **Authentication**: Access token issues

#### Meta Failover Commands

```bash
# Check Meta AI status (if available)
curl -X GET \
    -H "Authorization: Bearer $META_API_TOKEN" \
    "https://api.meta.ai/v1/models/status"

# Failover from Meta to Bedrock
tsx quality-gates-cli.ts failover \
    --from meta \
    --to bedrock \
    --reason "Meta AI capacity issues"
```

## 📊 Failover Monitoring & Validation

### Real-time Monitoring During Failover

```bash
# Monitor failover progress
tsx quality-gates-cli.ts monitor \
    --failover-mode \
    --duration 10 \
    --metrics "error_rate,latency,throughput,success_rate"

# Check provider health during failover
watch -n 10 'tsx quality-gates-cli.ts status --provider-health --compact'

# Monitor user impact
tsx quality-gates-cli.ts monitor \
    --user-impact \
    --duration 15 \
    --alert-threshold "error_rate>2%"
```

### Failover Success Validation

```bash
# Comprehensive post-failover validation
tsx quality-gates-cli.ts validate \
    --post-failover \
    --check-all-providers \
    --performance-baseline

# Quality validation after failover
tsx quality-gates-cli.ts offline \
    --model-id current-active-model \
    --quick-validation

# User experience validation
tsx quality-gates-cli.ts canary \
    --validation-mode \
    --sample-size 100 \
    --success-threshold 95%
```

## 🔄 Failback Procedures

### Automated Failback

```bash
# Monitor original provider recovery
tsx quality-gates-cli.ts monitor \
    --provider bedrock \
    --recovery-mode \
    --duration 30

# Automated failback when provider recovers
tsx quality-gates-cli.ts failback \
    --original-provider bedrock \
    --current-provider google \
    --auto-trigger \
    --health-threshold 99%
```

### Manual Failback

```bash
# Step 1: Verify original provider health
tsx quality-gates-cli.ts status --provider bedrock --comprehensive

# Step 2: Run validation tests
tsx quality-gates-cli.ts validate \
    --provider bedrock \
    --test-suite comprehensive

# Step 3: Gradual traffic restoration
for percentage in 10 25 50 75 100; do
    echo "🔄 Restoring $percentage% traffic to bedrock"
    tsx quality-gates-cli.ts config set \
        --traffic-distribution "bedrock:$percentage,google:$((100-percentage))"

    sleep 180  # Wait 3 minutes between increases

    # Validate performance
    if ! tsx quality-gates-cli.ts validate --performance-check; then
        echo "❌ Performance validation failed, stopping failback"
        break
    fi
done
```

## 🚨 Emergency Procedures

### Complete Provider Ecosystem Failure

#### Multi-Provider Outage Response

```bash
# Activate emergency mode
tsx quality-gates-cli.ts emergency \
    --mode "multi-provider-outage" \
    --enable-degraded-service

# Enable aggressive caching
tsx quality-gates-cli.ts config set \
    --cache-mode emergency \
    --cache-ttl 7200 \
    --serve-stale true

# Implement request queuing
tsx quality-gates-cli.ts config set \
    --request-queuing enabled \
    --queue-size 10000 \
    --queue-timeout 300

# Notify stakeholders
slack-notify "#ops-alerts" "🚨 CRITICAL: Multi-provider AI outage detected"
```

#### Degraded Service Mode

```yaml
degraded_service_config:
  cache_strategy: serve_stale_indefinitely
  request_handling: queue_and_retry
  user_notification: service_degradation_banner
  fallback_responses: static_templates

  performance_targets:
    response_time: 5000ms # Relaxed from 1500ms
    success_rate: 80% # Relaxed from 98%
    availability: 95% # Relaxed from 99.9%
```

### Provider-Specific Emergency Contacts

#### AWS Bedrock Emergency

```bash
# Create AWS support case
aws support create-case \
    --subject "Critical: Bedrock Service Unavailable" \
    --service-code "bedrock" \
    --severity-code "critical" \
    --category-code "service-unavailable" \
    --communication-body "Production AI service experiencing complete Bedrock outage"

# AWS Enterprise Support: 1-800-xxx-xxxx
```

#### Google Vertex AI Emergency

```bash
# Create Google Cloud support case
gcloud support cases create \
    --display-name="Critical: Vertex AI Service Unavailable" \
    --description="Production AI service experiencing Vertex AI outage" \
    --priority=P1

# Google Cloud Support: Enterprise support portal
```

## 📈 Failover Performance Metrics

### Key Performance Indicators

```yaml
failover_metrics:
  detection_time: < 30 seconds
  failover_execution: < 60 seconds
  service_restoration: < 120 seconds
  total_recovery_time: < 300 seconds

  success_rates:
    automated_failover: > 95%
    manual_failover: > 99%
    failback_success: > 98%

  impact_metrics:
    user_error_rate: < 5% during failover
    request_loss: < 1%
    performance_degradation: < 20%
```

### Monitoring Dashboard

```bash
# Create failover monitoring dashboard
tsx quality-gates-cli.ts dashboard create \
    --name "AI Provider Failover" \
    --metrics "provider_health,failover_events,recovery_time" \
    --alerts "failover_failure,extended_outage"

# Real-time failover status
tsx quality-gates-cli.ts status \
    --dashboard failover \
    --refresh 10
```

## 📝 Post-Failover Procedures

### Immediate Post-Failover (0-30 minutes)

1. **Verify Service Restoration**

   ```bash
   tsx quality-gates-cli.ts validate --post-failover --comprehensive
   ```

2. **Document Incident**

   ```bash
   # Create incident report
   tsx quality-gates-cli.ts report \
       --type incident \
       --event failover \
       --output "failover-incident-$(date +%Y%m%d-%H%M%S).md"
   ```

3. **Stakeholder Communication**
   ```bash
   # Update status page
   curl -X POST "https://status.matbakh.app/api/incidents" \
       -H "Authorization: Bearer $STATUS_API_KEY" \
       -d '{"status":"resolved","message":"AI service restored after provider failover"}'
   ```

### Short-term Follow-up (1-24 hours)

1. **Performance Analysis**

   ```bash
   tsx quality-gates-cli.ts report \
       --type performance-impact \
       --period failover-window \
       --compare baseline
   ```

2. **Root Cause Investigation**

   ```bash
   tsx quality-gates-cli.ts analyze \
       --event failover \
       --root-cause-analysis \
       --include-logs
   ```

3. **Failover Effectiveness Review**
   ```bash
   tsx quality-gates-cli.ts report \
       --type failover-effectiveness \
       --metrics "detection_time,execution_time,impact"
   ```

### Long-term Review (1-7 days)

1. **Process Improvement**

   - Review failover procedures
   - Update automation scripts
   - Enhance monitoring thresholds

2. **Documentation Updates**

   - Update runbooks based on learnings
   - Improve failover automation
   - Enhance monitoring coverage

3. **Training & Drills**
   - Conduct failover drill review
   - Update team training materials
   - Schedule next failover drill

## 🔗 Related Resources

- [AI System Incident Response](./ai-system-incident-response.md)
- [AI Quota Management](./ai-quota-management.md)
- [Performance Monitoring Guide](../performance-monitoring-guide.md)
- [Quality Gates Documentation](../quality-gates-documentation.md)

---

_Remember: Fast detection and automated response are key to minimizing failover impact. Test your procedures regularly and keep them updated._

_Last updated: 2025-01-14 by AI Operations Team_
