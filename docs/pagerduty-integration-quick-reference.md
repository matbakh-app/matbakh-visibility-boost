# PagerDuty Integration - Quick Reference Guide

**Version**: 1.0.0  
**Last Updated**: 2025-01-14  
**Status**: ✅ Production Ready

---

## 🎯 Overview

The PagerDuty Integration provides enterprise-grade incident management for Hybrid Routing alerts, enabling automatic incident creation, escalation, and resolution.

---

## 🚀 Quick Start

### Basic Setup

```typescript
import { PagerDutyIntegration } from "@/lib/ai-orchestrator/alerting/pagerduty-integration";

const pagerduty = new PagerDutyIntegration(
  {
    integrationKey: process.env.PAGERDUTY_INTEGRATION_KEY!,
    serviceName: "Hybrid Routing Alerts",
    escalationPolicyId: "policy-123",
  },
  "production"
);
```

### Trigger Incident

```typescript
const response = await pagerduty.triggerHighFailureRateIncident(85, 95);
console.log(`Incident created: ${response.dedup_key}`);
```

### Acknowledge Incident

```typescript
await pagerduty.acknowledgeIncident(response.dedup_key!);
```

### Resolve Incident

```typescript
await pagerduty.resolveIncident(response.dedup_key!);
```

---

## 📋 Common Use Cases

### 1. High Failure Rate Alert

```typescript
// Trigger critical incident
const response = await pagerduty.triggerHighFailureRateIncident(
  85, // Current success rate
  95 // Threshold
);

// Incident includes:
// - Critical severity
// - 5 actionable recommendations
// - Dashboard links
// - Full alert context
```

### 2. High Latency Alert

```typescript
// Trigger warning incident
const response = await pagerduty.triggerHighLatencyIncident(
  1500, // Current latency (ms)
  1000 // Threshold (ms)
);

// Incident includes:
// - Warning severity
// - Performance guidance
// - Routing efficiency tips
```

### 3. Cost Threshold Alert

```typescript
// Trigger warning incident
const response = await pagerduty.triggerCostThresholdIncident(
  150, // Current cost (€)
  100 // Threshold (€)
);

// Incident includes:
// - Warning severity
// - Cost optimization recommendations
// - Budget management tips
```

### 4. Alert Message Integration

```typescript
import {
  AlertMessage,
  AlertSeverity,
} from "@/lib/ai-orchestrator/alerting/sns-notification-manager";

const alertMessage: AlertMessage = {
  severity: AlertSeverity.CRITICAL,
  alarmName: "production-hybrid-routing-high-failure-rate",
  metricName: "SupportModeSuccessRate",
  threshold: 95,
  currentValue: 85,
  timestamp: new Date(),
  environment: "production",
  description: "Success rate has fallen below 95%",
  recommendations: ["Check system health", "Review logs"],
};

// Create incident from alert
const response = await pagerduty.createIncidentFromAlert(alertMessage);

// Auto-resolve when alert clears
await pagerduty.autoResolveIncident(alertMessage);
```

---

## 🔧 Configuration

### Service Configuration

```typescript
interface PagerDutyServiceConfig {
  integrationKey: string; // Required: PagerDuty integration key
  serviceName: string; // Required: Service name
  escalationPolicyId?: string; // Optional: Escalation policy ID
}
```

### Environment Variables

```bash
# .env.production
PAGERDUTY_INTEGRATION_KEY=your-integration-key-here
PAGERDUTY_SERVICE_NAME=Hybrid Routing Alerts
PAGERDUTY_ESCALATION_POLICY_ID=policy-123
```

### Update Configuration

```typescript
// Update integration key
pagerduty.updateServiceConfig({
  integrationKey: "new-key-12345",
});

// Get current configuration
const config = pagerduty.getServiceConfig();
console.log(`Service: ${config.serviceName}`);
```

---

## 📊 Incident Management

### Track Active Incidents

```typescript
// Get all active incidents
const activeIncidents = pagerduty.getActiveIncidents();
console.log(`Active incidents: ${activeIncidents.size}`);

// Iterate through incidents
for (const [dedupKey, incident] of activeIncidents.entries()) {
  console.log(`${dedupKey}: ${incident.summary}`);
}
```

### Get Specific Incident

```typescript
const incident = pagerduty.getIncident("incident-123");
if (incident) {
  console.log(`Severity: ${incident.severity}`);
  console.log(`Summary: ${incident.summary}`);
  console.log(`Source: ${incident.source}`);
}
```

### Clear Incidents (Testing)

```typescript
// Clear all active incidents (for testing only)
pagerduty.clearActiveIncidents();
```

---

## 🎨 Severity Mapping

| Alert Severity | PagerDuty Severity | Use Case                   |
| -------------- | ------------------ | -------------------------- |
| CRITICAL       | critical           | Immediate attention needed |
| WARNING        | warning            | Warning condition          |
| INFO           | info               | Informational message      |

---

## 📦 Incident Payload Structure

### Complete Payload Example

```json
{
  "routing_key": "test-integration-key-12345",
  "event_action": "trigger",
  "dedup_key": "production-hybrid-routing-high-failure-rate-SupportModeSuccessRate",
  "payload": {
    "summary": "🚨 [PRODUCTION] High Failure Rate Alert",
    "source": "production-hybrid-routing",
    "severity": "critical",
    "timestamp": "2025-01-14T14:30:00.000Z",
    "component": "hybrid-routing",
    "group": "ai-orchestrator",
    "class": "performance",
    "custom_details": {
      "alarmName": "production-hybrid-routing-high-failure-rate",
      "metricName": "SupportModeSuccessRate",
      "threshold": 95,
      "currentValue": 85,
      "environment": "production",
      "description": "Success rate has fallen below 95%",
      "recommendations": [
        "Check hybrid routing health status",
        "Review recent deployment changes",
        "Verify MCP and direct Bedrock connectivity"
      ]
    }
  },
  "links": [
    {
      "href": "https://console.aws.amazon.com/cloudwatch/...",
      "text": "CloudWatch Dashboard"
    },
    {
      "href": "https://app.matbakh.app/admin/bedrock-activation",
      "text": "Hybrid Routing Dashboard"
    }
  ],
  "client": "matbakh-bedrock-support-manager",
  "client_url": "https://app.matbakh.app/admin/bedrock-activation"
}
```

---

## 🔍 Troubleshooting

### Common Issues

#### 1. API Authentication Error

```typescript
// Error: PagerDuty API error: 401 - Unauthorized
// Solution: Verify integration key is correct
const config = pagerduty.getServiceConfig();
console.log(`Integration Key: ${config.integrationKey}`);
```

#### 2. Incident Not Found

```typescript
// Error: Incident not found: incident-123
// Solution: Check if incident exists
const incident = pagerduty.getIncident("incident-123");
if (!incident) {
  console.log("Incident does not exist");
}
```

#### 3. Network Error

```typescript
// Error: Failed to send PagerDuty event: Network error
// Solution: Check network connectivity and API endpoint
try {
  await pagerduty.triggerIncident(incident);
} catch (error) {
  console.error("Network error:", error);
  // Implement retry logic
}
```

---

## 📈 Monitoring

### Key Metrics

- **Incident Creation Rate**: Number of incidents created per hour
- **Incident Resolution Time**: Average time to resolve incidents
- **Acknowledgment Rate**: Percentage of incidents acknowledged
- **Auto-Resolution Rate**: Percentage of incidents auto-resolved

### Health Checks

```typescript
// Check active incidents
const activeCount = pagerduty.getActiveIncidents().size;
if (activeCount > 10) {
  console.warn(`High number of active incidents: ${activeCount}`);
}

// Verify configuration
const config = pagerduty.getServiceConfig();
if (!config.integrationKey) {
  console.error("Integration key not configured");
}
```

---

## 🧪 Testing

### Unit Tests

```typescript
import { PagerDutyIntegration } from "@/lib/ai-orchestrator/alerting/pagerduty-integration";

describe("PagerDutyIntegration", () => {
  it("should trigger incident", async () => {
    const pagerduty = new PagerDutyIntegration(
      {
        integrationKey: "test-key",
        serviceName: "Test Service",
      },
      "test"
    );

    const response = await pagerduty.triggerHighFailureRateIncident(85, 95);
    expect(response.status).toBe("success");
  });
});
```

### Integration Tests

```typescript
// Test end-to-end incident lifecycle
const response = await pagerduty.triggerHighFailureRateIncident(85, 95);
await pagerduty.acknowledgeIncident(response.dedup_key!);
await pagerduty.resolveIncident(response.dedup_key!);

expect(pagerduty.getActiveIncidents().size).toBe(0);
```

---

## 🔗 Integration Points

### With CloudWatch Alarm Manager

```typescript
import { CloudWatchAlarmManager } from "@/lib/ai-orchestrator/alerting/cloudwatch-alarm-manager";

const alarmManager = new CloudWatchAlarmManager("eu-central-1", "production");
const pagerduty = new PagerDutyIntegration(config, "production");

// CloudWatch alarm triggers → PagerDuty incident
await pagerduty.triggerHighFailureRateIncident(85, 95);
```

### With SNS Notification Manager

```typescript
import { SNSNotificationManager } from "@/lib/ai-orchestrator/alerting/sns-notification-manager";

const snsManager = new SNSNotificationManager("eu-central-1", "production");
const pagerduty = new PagerDutyIntegration(config, "production");

// SNS alert → PagerDuty incident
const alertMessage = await snsManager.publishHighFailureRateAlert(
  topicArn,
  85,
  95
);
await pagerduty.createIncidentFromAlert(alertMessage);
```

---

## 📚 Additional Resources

- [PagerDuty Events API v2 Documentation](https://developer.pagerduty.com/docs/ZG9jOjExMDI5NTgw-events-api-v2-overview)
- [PagerDuty Integration Guide](https://support.pagerduty.com/docs/services-and-integrations)
- [Bedrock Activation Documentation](./bedrock-activation-dashboard-implementation.md)
- [Hybrid Routing Monitoring](./hybrid-routing-cloudwatch-dashboards.md)

---

## 🎯 Best Practices

1. **Use Deduplication Keys**: Ensure unique incident keys to prevent duplicates
2. **Include Context**: Always provide custom details and recommendations
3. **Add Dashboard Links**: Include relevant dashboard URLs for quick access
4. **Auto-Resolve**: Implement auto-resolution when alerts clear
5. **Monitor Active Incidents**: Track and manage active incident count
6. **Test Thoroughly**: Test incident lifecycle in staging before production
7. **Configure Escalation**: Set up escalation policies for critical incidents
8. **Document Runbooks**: Create runbooks for common incident scenarios

---

**Status**: ✅ Production Ready  
**Version**: 1.0.0  
**Last Updated**: 2025-01-14
