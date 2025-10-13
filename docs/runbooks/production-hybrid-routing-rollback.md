# Production Hybrid Routing Rollback Procedures

## Overview

This document provides comprehensive rollback procedures for Bedrock Support Mode with Hybrid Routing in production. It covers immediate, partial, and full rollback scenarios with step-by-step instructions.

## Rollback Scenarios

### Scenario Classification

**Immediate Rollback** (< 5 minutes):

- Critical system failure affecting >50% of requests
- Security incident requiring immediate isolation
- P95 latency > 3.0s for 5+ minutes
- Error rate > 10% for 2+ minutes

**Partial Rollback** (< 10 minutes):

- Single component failure
- Provider-specific issues
- Performance degradation in specific routing path
- Cost budget exceeded (>95%)

**Full Rollback** (< 30 minutes):

- Multiple component failures
- Systematic issues requiring complete revert
- Data integrity concerns
- Compliance violations

## Immediate Rollback Procedures

### Emergency Feature Flag Disable

**Trigger Conditions**:

- System-wide failure
- Critical security incident
- Immediate intervention required

**Procedure**:

```bash
#!/bin/bash
# Emergency Rollback Script
# Usage: ./emergency-rollback.sh

echo "🚨 EMERGENCY ROLLBACK INITIATED"
echo "Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"

# Step 1: Disable all hybrid routing features (< 30 seconds)
echo "Step 1: Disabling hybrid routing features..."
curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"emergency": true, "reason": "immediate_rollback"}' \
  https://api.matbakh.app/admin/emergency/disable-hybrid-routing

# Step 2: Verify feature flags disabled (< 30 seconds)
echo "Step 2: Verifying feature flag status..."
RESPONSE=$(curl -s -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://api.matbakh.app/admin/feature-flags/bedrock)

if echo "$RESPONSE" | grep -q '"ENABLE_BEDROCK_SUPPORT_MODE":false'; then
  echo "✅ Bedrock Support Mode disabled"
else
  echo "❌ Failed to disable Bedrock Support Mode"
  exit 1
fi

# Step 3: Force MCP-only routing (< 30 seconds)
echo "Step 3: Forcing MCP-only routing..."
curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"routing_mode": "mcp_only", "emergency": true}' \
  https://api.matbakh.app/admin/config/routing-override

# Step 4: Verify system health (< 60 seconds)
echo "Step 4: Verifying system health..."
for i in {1..12}; do
  HEALTH=$(curl -s https://api.matbakh.app/health | jq -r .status)
  if [ "$HEALTH" = "healthy" ]; then
    echo "✅ System health restored"
    break
  fi
  echo "⏳ Waiting for system recovery... ($i/12)"
  sleep 5
done

# Step 5: Notify stakeholders
echo "Step 5: Notifying stakeholders..."
curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "emergency_rollback",
    "message": "Emergency rollback executed for hybrid routing",
    "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'",
    "status": "completed"
  }' \
  https://api.matbakh.app/admin/notifications/emergency

echo "🔄 EMERGENCY ROLLBACK COMPLETED"
echo "Duration: $SECONDS seconds"
```

**Validation Steps**:

1. Verify all hybrid routing feature flags are disabled
2. Confirm system returns to MCP-only operation
3. Check error rates return to baseline (<1%)
4. Validate P95 latency within SLO targets
5. Monitor for 15 minutes to ensure stability

## Partial Rollback Procedures

### Component-Specific Rollback

#### Direct Bedrock Client Isolation

**When to Use**:

- Direct Bedrock connection issues
- AWS Bedrock service problems
- High latency from direct route

**Procedure**:

```bash
#!/bin/bash
# Direct Bedrock Isolation Script

echo "🔧 ISOLATING DIRECT BEDROCK CLIENT"

# Step 1: Disable direct Bedrock fallback
curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"flag": "ENABLE_DIRECT_BEDROCK_FALLBACK", "enabled": false}' \
  https://api.matbakh.app/admin/feature-flags/bedrock/update

# Step 2: Force all traffic to MCP route
curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"route_override": "mcp_only", "duration_minutes": 60}' \
  https://api.matbakh.app/admin/config/routing-override

# Step 3: Verify routing changes
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://api.matbakh.app/admin/metrics/routing-distribution

echo "✅ Direct Bedrock client isolated"
```

#### Intelligent Router Bypass

**When to Use**:

- Routing decision failures
- Suboptimal routing performance
- Router logic errors

**Procedure**:

```bash
#!/bin/bash
# Intelligent Router Bypass Script

echo "🔧 BYPASSING INTELLIGENT ROUTER"

# Step 1: Disable intelligent routing
curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"flag": "ENABLE_INTELLIGENT_ROUTING", "enabled": false}' \
  https://api.matbakh.app/admin/feature-flags/bedrock/update

# Step 2: Enable simple routing rules
curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"routing_mode": "simple", "default_route": "mcp"}' \
  https://api.matbakh.app/admin/config/routing-mode

echo "✅ Intelligent router bypassed"
```

### Performance-Based Rollback

#### High Latency Mitigation

**Trigger**: P95 latency > 2.0s for 10+ minutes

```bash
#!/bin/bash
# High Latency Mitigation Script

echo "⚡ MITIGATING HIGH LATENCY"

# Step 1: Enable aggressive caching
curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"cache_ttl_multiplier": 2.0, "cache_aggressive_mode": true}' \
  https://api.matbakh.app/admin/config/cache-optimization

# Step 2: Reduce routing complexity
curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"routing_complexity": "low", "fallback_threshold_ms": 1000}' \
  https://api.matbakh.app/admin/config/routing-optimization

# Step 3: Monitor improvement
for i in {1..6}; do
  LATENCY=$(curl -s -H "Authorization: Bearer $ADMIN_TOKEN" \
    https://api.matbakh.app/admin/metrics/p95-latency | jq -r .value)
  echo "Current P95 latency: ${LATENCY}ms"
  if (( $(echo "$LATENCY < 1500" | bc -l) )); then
    echo "✅ Latency improved"
    break
  fi
  sleep 30
done
```

#### Cost Budget Exceeded

**Trigger**: Cost budget > 95%

```bash
#!/bin/bash
# Cost Control Emergency Script

echo "💰 ACTIVATING EMERGENCY COST CONTROLS"

# Step 1: Enable aggressive cost controls
curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"cost_control_mode": "aggressive", "budget_limit_percent": 95}' \
  https://api.matbakh.app/admin/config/cost-controls

# Step 2: Increase cache usage to reduce API calls
curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"cache_preference": "aggressive", "cache_ttl_hours": 24}' \
  https://api.matbakh.app/admin/config/cache-preference

# Step 3: Throttle non-critical operations
curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"throttle_background_tasks": true, "priority_operations_only": true}' \
  https://api.matbakh.app/admin/config/operation-throttling

echo "✅ Emergency cost controls activated"
```

## Full Rollback Procedures

### Complete System Revert

**When to Use**:

- Multiple system failures
- Systematic issues
- Data integrity concerns
- Compliance violations

**Procedure**:

```bash
#!/bin/bash
# Full System Rollback Script
# This script reverts the entire hybrid routing system

echo "🔄 FULL SYSTEM ROLLBACK INITIATED"
START_TIME=$(date +%s)

# Step 1: Immediate feature flag disable
echo "Step 1: Disabling all hybrid routing features..."
curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://api.matbakh.app/admin/emergency/disable-all-bedrock-features

# Step 2: Revert routing configuration
echo "Step 2: Reverting routing configuration..."
curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"config": "pre_hybrid_routing", "restore_backup": true}' \
  https://api.matbakh.app/admin/config/restore-backup

# Step 3: Restart affected services
echo "Step 3: Restarting affected services..."
curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"services": ["ai-orchestrator", "mcp-router"], "restart_mode": "rolling"}' \
  https://api.matbakh.app/admin/services/restart

# Step 4: Validate service health
echo "Step 4: Validating service health..."
for service in "ai-orchestrator" "mcp-router"; do
  for i in {1..10}; do
    STATUS=$(curl -s -H "Authorization: Bearer $ADMIN_TOKEN" \
      https://api.matbakh.app/admin/services/$service/health | jq -r .status)
    if [ "$STATUS" = "healthy" ]; then
      echo "✅ $service is healthy"
      break
    fi
    echo "⏳ Waiting for $service to be healthy... ($i/10)"
    sleep 10
  done
done

# Step 5: Run system validation
echo "Step 5: Running system validation..."
curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://api.matbakh.app/admin/validation/full-system-check

# Step 6: Monitor for stability
echo "Step 6: Monitoring system stability..."
for i in {1..12}; do
  ERROR_RATE=$(curl -s -H "Authorization: Bearer $ADMIN_TOKEN" \
    https://api.matbakh.app/admin/metrics/error-rate | jq -r .value)
  LATENCY=$(curl -s -H "Authorization: Bearer $ADMIN_TOKEN" \
    https://api.matbakh.app/admin/metrics/p95-latency | jq -r .value)

  echo "Error rate: ${ERROR_RATE}%, P95 latency: ${LATENCY}ms"

  if (( $(echo "$ERROR_RATE < 1.0" | bc -l) )) && (( $(echo "$LATENCY < 1500" | bc -l) )); then
    echo "✅ System stability confirmed"
    break
  fi
  sleep 30
done

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo "🔄 FULL SYSTEM ROLLBACK COMPLETED"
echo "Duration: ${DURATION} seconds"

# Step 7: Generate rollback report
curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "type": "full_rollback",
    "duration_seconds": '$DURATION',
    "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'",
    "status": "completed"
  }' \
  https://api.matbakh.app/admin/reports/rollback
```

## Post-Rollback Procedures

### Immediate Actions (0-30 minutes)

1. **Verify System Stability**:

   ```bash
   # Check key metrics
   curl -H "Authorization: Bearer $ADMIN_TOKEN" \
     https://api.matbakh.app/admin/metrics/system-health

   # Verify error rates
   curl -H "Authorization: Bearer $ADMIN_TOKEN" \
     https://api.matbakh.app/admin/metrics/error-summary
   ```

2. **Stakeholder Notification**:

   - Notify operations team of rollback completion
   - Update status page if customer-facing
   - Inform development team of issues

3. **Initial Impact Assessment**:
   - Document rollback trigger and timeline
   - Assess customer impact (if any)
   - Identify immediate risks or concerns

### Short-term Actions (30 minutes - 4 hours)

1. **Detailed Investigation**:

   - Analyze logs leading up to rollback
   - Identify root cause of issues
   - Document findings and evidence

2. **System Monitoring**:

   - Monitor system performance for 4 hours
   - Validate all metrics within normal ranges
   - Ensure no residual issues

3. **Communication Updates**:
   - Provide detailed update to stakeholders
   - Update incident tracking system
   - Prepare preliminary incident report

### Long-term Actions (4+ hours)

1. **Root Cause Analysis**:

   - Conduct thorough investigation
   - Identify contributing factors
   - Document lessons learned

2. **Recovery Planning**:

   - Develop fix for identified issues
   - Plan re-deployment strategy
   - Update rollback procedures if needed

3. **Process Improvement**:
   - Review rollback effectiveness
   - Update monitoring and alerting
   - Enhance testing procedures

## Rollback Validation

### Health Check Validation

```bash
#!/bin/bash
# Post-Rollback Validation Script

echo "🔍 VALIDATING ROLLBACK SUCCESS"

# Check 1: Feature flags disabled
echo "Checking feature flags..."
FLAGS=$(curl -s -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://api.matbakh.app/admin/feature-flags/bedrock)

if echo "$FLAGS" | grep -q '"ENABLE_BEDROCK_SUPPORT_MODE":false'; then
  echo "✅ Bedrock support mode disabled"
else
  echo "❌ Bedrock support mode still enabled"
  exit 1
fi

# Check 2: System health
echo "Checking system health..."
HEALTH=$(curl -s https://api.matbakh.app/health | jq -r .status)
if [ "$HEALTH" = "healthy" ]; then
  echo "✅ System health OK"
else
  echo "❌ System health issues detected"
  exit 1
fi

# Check 3: Error rates
echo "Checking error rates..."
ERROR_RATE=$(curl -s -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://api.matbakh.app/admin/metrics/error-rate | jq -r .value)

if (( $(echo "$ERROR_RATE < 2.0" | bc -l) )); then
  echo "✅ Error rate acceptable: ${ERROR_RATE}%"
else
  echo "❌ Error rate too high: ${ERROR_RATE}%"
  exit 1
fi

# Check 4: Latency
echo "Checking latency..."
LATENCY=$(curl -s -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://api.matbakh.app/admin/metrics/p95-latency | jq -r .value)

if (( $(echo "$LATENCY < 2000" | bc -l) )); then
  echo "✅ Latency acceptable: ${LATENCY}ms"
else
  echo "❌ Latency too high: ${LATENCY}ms"
  exit 1
fi

echo "✅ ROLLBACK VALIDATION SUCCESSFUL"
```

## Emergency Contacts

### Immediate Response Team

**On-Call Engineer**:

- Primary: DevOps Team Lead
- Secondary: AI Architecture Team Lead
- Escalation: CTO

**Contact Methods**:

- Phone: [Emergency hotline]
- Slack: #emergency-response
- Email: emergency@matbakh.app

### Rollback Authorization

**Authorized Personnel** (can execute immediate rollback):

- DevOps Team Lead
- AI Architecture Team Lead
- CTO
- VP Engineering

**Authorization Not Required** (emergency situations):

- System-wide outage
- Security incident
- Data integrity threat

## Documentation and Reporting

### Rollback Report Template

```markdown
# Rollback Incident Report

## Summary

- **Date/Time**: [UTC timestamp]
- **Duration**: [rollback execution time]
- **Type**: [immediate/partial/full]
- **Trigger**: [what caused the rollback]

## Timeline

- **Issue Detected**: [timestamp]
- **Rollback Initiated**: [timestamp]
- **Rollback Completed**: [timestamp]
- **System Stable**: [timestamp]

## Impact Assessment

- **Customer Impact**: [description]
- **Service Availability**: [percentage uptime]
- **Performance Impact**: [metrics]

## Root Cause

- **Primary Cause**: [description]
- **Contributing Factors**: [list]
- **Evidence**: [logs, metrics, etc.]

## Actions Taken

- [list of rollback steps executed]
- [validation steps performed]
- [communication actions]

## Lessons Learned

- [what went well]
- [what could be improved]
- [process changes needed]

## Next Steps

- [immediate actions]
- [short-term fixes]
- [long-term improvements]
```

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-14  
**Next Review**: After each rollback execution  
**Owner**: DevOps Team
