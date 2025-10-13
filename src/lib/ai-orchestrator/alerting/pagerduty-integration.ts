/**
 * PagerDuty Integration for Hybrid Routing Alerts
 *
 * Manages PagerDuty service integration, incident creation, escalation,
 * and severity mapping for hybrid routing efficiency alerts.
 *
 * @module PagerDutyIntegration
 */

import { AlertMessage, AlertSeverity } from "./sns-notification-manager";

/**
 * PagerDuty severity levels
 */
export enum PagerDutySeverity {
  CRITICAL = "critical",
  ERROR = "error",
  WARNING = "warning",
  INFO = "info",
}

/**
 * PagerDuty event action types
 */
export enum PagerDutyAction {
  TRIGGER = "trigger",
  ACKNOWLEDGE = "acknowledge",
  RESOLVE = "resolve",
}

/**
 * PagerDuty service configuration
 */
export interface PagerDutyServiceConfig {
  integrationKey: string;
  serviceName: string;
  escalationPolicyId?: string;
}

/**
 * PagerDuty incident details
 */
export interface PagerDutyIncident {
  incidentKey: string;
  severity: PagerDutySeverity;
  summary: string;
  source: string;
  timestamp: Date;
  customDetails?: Record<string, any>;
  links?: Array<{ href: string; text: string }>;
  images?: Array<{ src: string; alt: string }>;
}

/**
 * PagerDuty event payload
 */
export interface PagerDutyEventPayload {
  routing_key: string;
  event_action: PagerDutyAction;
  dedup_key?: string;
  payload: {
    summary: string;
    source: string;
    severity: PagerDutySeverity;
    timestamp: string;
    component?: string;
    group?: string;
    class?: string;
    custom_details?: Record<string, any>;
  };
  links?: Array<{ href: string; text: string }>;
  images?: Array<{ src: string; alt: string }>;
  client?: string;
  client_url?: string;
}

/**
 * PagerDuty API response
 */
export interface PagerDutyResponse {
  status: string;
  message: string;
  dedup_key?: string;
}

/**
 * Escalation policy configuration
 */
export interface EscalationPolicy {
  id: string;
  name: string;
  escalationRules: EscalationRule[];
}

/**
 * Escalation rule
 */
export interface EscalationRule {
  escalationDelayMinutes: number;
  targets: EscalationTarget[];
}

/**
 * Escalation target
 */
export interface EscalationTarget {
  type: "user" | "schedule";
  id: string;
}

/**
 * PagerDuty Integration Manager
 *
 * Manages PagerDuty service integration for hybrid routing alerts.
 */
export class PagerDutyIntegration {
  private apiEndpoint: string;
  private serviceConfig: PagerDutyServiceConfig;
  private environment: string;
  private activeIncidents: Map<string, PagerDutyIncident>;

  constructor(
    serviceConfig: PagerDutyServiceConfig,
    environment: string = "production",
    apiEndpoint: string = "https://events.pagerduty.com/v2/enqueue"
  ) {
    this.serviceConfig = serviceConfig;
    this.environment = environment;
    this.apiEndpoint = apiEndpoint;
    this.activeIncidents = new Map();
  }

  /**
   * Trigger a PagerDuty incident
   */
  async triggerIncident(
    incident: PagerDutyIncident
  ): Promise<PagerDutyResponse> {
    const payload = this.buildEventPayload(PagerDutyAction.TRIGGER, incident);

    const response = await this.sendEvent(payload);

    // Track active incident
    if (response.dedup_key) {
      this.activeIncidents.set(response.dedup_key, incident);
    }

    return response;
  }

  /**
   * Acknowledge a PagerDuty incident
   */
  async acknowledgeIncident(dedupKey: string): Promise<PagerDutyResponse> {
    const incident = this.activeIncidents.get(dedupKey);
    if (!incident) {
      throw new Error(`Incident not found: ${dedupKey}`);
    }

    const payload = this.buildEventPayload(
      PagerDutyAction.ACKNOWLEDGE,
      incident,
      dedupKey
    );

    return this.sendEvent(payload);
  }

  /**
   * Resolve a PagerDuty incident
   */
  async resolveIncident(dedupKey: string): Promise<PagerDutyResponse> {
    const incident = this.activeIncidents.get(dedupKey);
    if (!incident) {
      throw new Error(`Incident not found: ${dedupKey}`);
    }

    const payload = this.buildEventPayload(
      PagerDutyAction.RESOLVE,
      incident,
      dedupKey
    );

    const response = await this.sendEvent(payload);

    // Remove from active incidents
    this.activeIncidents.delete(dedupKey);

    return response;
  }

  /**
   * Create incident from alert message
   */
  async createIncidentFromAlert(
    message: AlertMessage
  ): Promise<PagerDutyResponse> {
    const incident: PagerDutyIncident = {
      incidentKey: this.generateIncidentKey(message),
      severity: this.mapAlertSeverityToPagerDuty(message.severity),
      summary: this.formatIncidentSummary(message),
      source: `${this.environment}-hybrid-routing`,
      timestamp: message.timestamp,
      customDetails: {
        alarmName: message.alarmName,
        metricName: message.metricName,
        threshold: message.threshold,
        currentValue: message.currentValue,
        environment: message.environment,
        description: message.description,
        recommendations: message.recommendations,
      },
      links: [
        {
          href: this.getCloudWatchDashboardUrl(),
          text: "CloudWatch Dashboard",
        },
        {
          href: this.getHybridRoutingDashboardUrl(),
          text: "Hybrid Routing Dashboard",
        },
      ],
    };

    return this.triggerIncident(incident);
  }

  /**
   * Auto-resolve incident when alert clears
   */
  async autoResolveIncident(
    message: AlertMessage
  ): Promise<PagerDutyResponse | null> {
    const incidentKey = this.generateIncidentKey(message);

    // Find active incident with this key
    for (const [dedupKey, incident] of this.activeIncidents.entries()) {
      if (incident.incidentKey === incidentKey) {
        return this.resolveIncident(dedupKey);
      }
    }

    return null;
  }

  /**
   * Build PagerDuty event payload
   */
  private buildEventPayload(
    action: PagerDutyAction,
    incident: PagerDutyIncident,
    dedupKey?: string
  ): PagerDutyEventPayload {
    const payload: PagerDutyEventPayload = {
      routing_key: this.serviceConfig.integrationKey,
      event_action: action,
      payload: {
        summary: incident.summary,
        source: incident.source,
        severity: incident.severity,
        timestamp: incident.timestamp.toISOString(),
        component: "hybrid-routing",
        group: "ai-orchestrator",
        class: "performance",
        custom_details: incident.customDetails,
      },
      client: "matbakh-bedrock-support-manager",
      client_url: this.getHybridRoutingDashboardUrl(),
    };

    if (dedupKey) {
      payload.dedup_key = dedupKey;
    } else {
      payload.dedup_key = incident.incidentKey;
    }

    if (incident.links) {
      payload.links = incident.links;
    }

    if (incident.images) {
      payload.images = incident.images;
    }

    return payload;
  }

  /**
   * Send event to PagerDuty API
   */
  private async sendEvent(
    payload: PagerDutyEventPayload
  ): Promise<PagerDutyResponse> {
    try {
      const response = await fetch(this.apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/vnd.pagerduty+json;version=2",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `PagerDuty API error: ${response.status} - ${errorText}`
        );
      }

      const result = await response.json();
      return result as PagerDutyResponse;
    } catch (error) {
      throw new Error(
        `Failed to send PagerDuty event: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Map alert severity to PagerDuty severity
   */
  private mapAlertSeverityToPagerDuty(
    severity: AlertSeverity
  ): PagerDutySeverity {
    const mapping: Record<AlertSeverity, PagerDutySeverity> = {
      [AlertSeverity.CRITICAL]: PagerDutySeverity.CRITICAL,
      [AlertSeverity.WARNING]: PagerDutySeverity.WARNING,
      [AlertSeverity.INFO]: PagerDutySeverity.INFO,
    };

    return mapping[severity];
  }

  /**
   * Generate unique incident key
   */
  private generateIncidentKey(message: AlertMessage): string {
    return `${this.environment}-${message.alarmName}-${message.metricName}`;
  }

  /**
   * Format incident summary
   */
  private formatIncidentSummary(message: AlertMessage): string {
    const severityEmoji = {
      [AlertSeverity.CRITICAL]: "🚨",
      [AlertSeverity.WARNING]: "⚠️",
      [AlertSeverity.INFO]: "ℹ️",
    };

    return `${
      severityEmoji[message.severity]
    } [${this.environment.toUpperCase()}] ${message.alarmName}: ${
      message.description
    }`;
  }

  /**
   * Get CloudWatch dashboard URL
   */
  private getCloudWatchDashboardUrl(): string {
    return `https://console.aws.amazon.com/cloudwatch/home?region=eu-central-1#dashboards:name=HybridRoutingMonitoring`;
  }

  /**
   * Get hybrid routing dashboard URL
   */
  private getHybridRoutingDashboardUrl(): string {
    return `https://app.matbakh.app/admin/bedrock-activation`;
  }

  /**
   * Get active incidents
   */
  getActiveIncidents(): Map<string, PagerDutyIncident> {
    return new Map(this.activeIncidents);
  }

  /**
   * Get incident by dedup key
   */
  getIncident(dedupKey: string): PagerDutyIncident | undefined {
    return this.activeIncidents.get(dedupKey);
  }

  /**
   * Clear all active incidents (for testing)
   */
  clearActiveIncidents(): void {
    this.activeIncidents.clear();
  }

  /**
   * Get service configuration
   */
  getServiceConfig(): PagerDutyServiceConfig {
    return { ...this.serviceConfig };
  }

  /**
   * Update service configuration
   */
  updateServiceConfig(config: Partial<PagerDutyServiceConfig>): void {
    this.serviceConfig = { ...this.serviceConfig, ...config };
  }

  /**
   * Trigger high failure rate incident
   */
  async triggerHighFailureRateIncident(
    currentSuccessRate: number,
    threshold: number
  ): Promise<PagerDutyResponse> {
    const message: AlertMessage = {
      severity: AlertSeverity.CRITICAL,
      alarmName: `${this.environment}-hybrid-routing-high-failure-rate`,
      metricName: "SupportModeSuccessRate",
      threshold,
      currentValue: currentSuccessRate,
      timestamp: new Date(),
      environment: this.environment,
      description: `Success rate has fallen below ${threshold}%. Current: ${currentSuccessRate}%`,
      recommendations: [
        "Check hybrid routing health status",
        "Review recent deployment changes",
        "Verify MCP and direct Bedrock connectivity",
        "Check circuit breaker status",
        "Review error logs for patterns",
      ],
    };

    return this.createIncidentFromAlert(message);
  }

  /**
   * Trigger high latency incident
   */
  async triggerHighLatencyIncident(
    currentLatency: number,
    threshold: number
  ): Promise<PagerDutyResponse> {
    const message: AlertMessage = {
      severity: AlertSeverity.WARNING,
      alarmName: `${this.environment}-hybrid-routing-high-latency`,
      metricName: "SupportModeAverageLatency",
      threshold,
      currentValue: currentLatency,
      timestamp: new Date(),
      environment: this.environment,
      description: `Average latency has exceeded ${threshold}ms. Current: ${currentLatency}ms`,
      recommendations: [
        "Check routing efficiency metrics",
        "Review direct Bedrock performance",
        "Verify MCP connection health",
        "Check for network issues",
        "Review recent traffic patterns",
      ],
    };

    return this.createIncidentFromAlert(message);
  }

  /**
   * Trigger cost threshold incident
   */
  async triggerCostThresholdIncident(
    currentCost: number,
    threshold: number
  ): Promise<PagerDutyResponse> {
    const message: AlertMessage = {
      severity: AlertSeverity.WARNING,
      alarmName: `${this.environment}-hybrid-routing-cost-threshold`,
      metricName: "SupportModeTotalCost",
      threshold,
      currentValue: currentCost,
      timestamp: new Date(),
      environment: this.environment,
      description: `Total cost has exceeded €${threshold}. Current: €${currentCost}`,
      recommendations: [
        "Review cost optimization settings",
        "Check cache hit rate",
        "Verify token limits are enforced",
        "Review routing efficiency",
        "Consider adjusting budget thresholds",
      ],
    };

    return this.createIncidentFromAlert(message);
  }
}
