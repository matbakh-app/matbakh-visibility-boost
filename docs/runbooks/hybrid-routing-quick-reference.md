# Hybrid Routing - Quick Reference Guide

**Version**: 1.0.0  
**Last Updated**: 2025-01-14

## Emergency Contacts

| Role               | Contact           | Escalation Time  |
| ------------------ | ----------------- | ---------------- |
| On-Call Engineer   | PagerDuty         | Immediate        |
| AI Operations Lead | Slack #ops-ai     | 15 minutes       |
| DevOps Lead        | Slack #ops-devops | 30 minutes       |
| CTO                | Phone             | 1 hour (P0 only) |

## Quick Commands

### Health Checks

```bash
# Basic health
curl https://api.matbakh.app/health

# Detailed health
curl https://api.matbakh.app/health/detailed

# Component health
curl https://api.matbakh.app/health/component/hybrid-router

# Active alerts
curl https://api.matbakh.app/health/alerts
```

### Emergency Actions

```bash
# Enable emergency mode
curl -X POST https://api.matbakh.app/admin/emergency/enable

# Force MCP fallback
curl -X POST https://api.matbakh.app/admin/routing/force-mcp

# Reset circuit breakers
curl -X POST https://api.matbakh.app/admin/circuit-breaker/reset

# Restart service
aws ecs update-service \
  --cluster hybrid-routing-cluster \
  --service hybrid-routing-service \
  --force-new-deployment
```

### Monitoring

```bash
# View logs (last 10 minutes)
aws logs tail /aws/ecs/hybrid-routing --follow --since 10m

# Check metrics
aws cloudwatch get-metric-statistics \
  --namespace "HybridRouting/Health" \
  --metric-name "SystemHealth" \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average

# List active alarms
aws cloudwatch describe-alarms --state-value ALARM
```

## Common Issues & Quick Fixes

| Issue               | Quick Fix             | Runbook                                                                                            |
| ------------------- | --------------------- | -------------------------------------------------------------------------------------------------- |
| System Down         | Restart service       | [Incident Response](./hybrid-routing-incident-response.md#1-complete-system-outage)                |
| High Latency        | Enable MCP fallback   | [Troubleshooting](./hybrid-routing-troubleshooting.md#issue-1-high-latency-on-direct-bedrock-path) |
| Bedrock Unavailable | Force MCP routing     | [Incident Response](./hybrid-routing-incident-response.md#2-bedrock-client-failure)                |
| Poor Routing        | Review routing config | [Troubleshooting](./hybrid-routing-troubleshooting.md#issue-2-poor-routing-efficiency)             |
| High Error Rate     | Check logs, restart   | [Troubleshooting](./hybrid-routing-troubleshooting.md#issue-3-high-error-rate)                     |

## Escalation Matrix

### P0 - Critical (Immediate Response)

- Complete system outage
- Data loss or corruption
- Security breach
- **Action**: Page on-call immediately

### P1 - High (15 minute response)

- Degraded performance affecting users
- Component failure with fallback active
- High error rate
- **Action**: Notify on-call engineer

### P2 - Medium (1 hour response)

- Single component degraded
- Performance below target
- Non-critical alerts
- **Action**: Create ticket, notify team

### P3 - Low (Next business day)

- Minor issues
- Documentation updates
- Optimization opportunities
- **Action**: Add to backlog

## Key Metrics Targets

| Metric             | Target  | Warning  | Critical  |
| ------------------ | ------- | -------- | --------- |
| System Health      | Healthy | Degraded | Unhealthy |
| Routing Efficiency | >80%    | <80%     | <70%      |
| Emergency Latency  | <5s     | >5s      | >10s      |
| Critical Latency   | <10s    | >10s     | >15s      |
| MCP Latency        | <30s    | >30s     | >60s      |
| Error Rate         | <1%     | >1%      | >5%       |
| Cache Hit Rate     | >80%    | <80%     | <70%      |

## Useful Links

- [Operations Runbook](./hybrid-routing-operations.md)
- [Incident Response](./hybrid-routing-incident-response.md)
- [Troubleshooting Guide](./hybrid-routing-troubleshooting.md)
- [Maintenance Procedures](./hybrid-routing-maintenance.md)
- [Monitoring Guide](./hybrid-routing-monitoring.md)
- [CloudWatch Dashboard](https://console.aws.amazon.com/cloudwatch/dashboards/Hybrid-Routing-Overview)
- [PagerDuty](https://matbakh.pagerduty.com)
- [Slack #ops-ai](https://matbakh.slack.com/archives/ops-ai)
