/**
 * SNS Notification Manager for Hybrid Routing Alerts
 *
 * Manages SNS topics, subscriptions, and message formatting for
 * hybrid routing efficiency alerts.
 *
 * @module SNSNotificationManager
 */

import {
  CreateTopicCommand,
  DeleteTopicCommand,
  GetTopicAttributesCommand,
  ListSubscriptionsByTopicCommand,
  PublishCommand,
  SNSClient,
  SetTopicAttributesCommand,
  SubscribeCommand,
  UnsubscribeCommand,
} from "@aws-sdk/client-sns";

/**
 * Subscription configuration
 */
export interface SubscriptionConfig {
  protocol: "email" | "sms" | "https" | "lambda" | "sqs";
  endpoint: string;
  filterPolicy?: Record<string, any>;
}

/**
 * Topic configuration
 */
export interface TopicConfig {
  name: string;
  displayName?: string;
  subscriptions: SubscriptionConfig[];
}

/**
 * Alert severity levels
 */
export enum AlertSeverity {
  CRITICAL = "critical",
  WARNING = "warning",
  INFO = "info",
}

/**
 * Alert message structure
 */
export interface AlertMessage {
  severity: AlertSeverity;
  alarmName: string;
  metricName: string;
  threshold: number;
  currentValue: number;
  timestamp: Date;
  environment: string;
  description: string;
  recommendations?: string[];
}

/**
 * SNS Notification Manager
 *
 * Manages SNS topics and subscriptions for hybrid routing alerts.
 */
export class SNSNotificationManager {
  private client: SNSClient;
  private environment: string;
  private topicArns: Map<string, string>;

  constructor(
    region: string = "eu-central-1",
    environment: string = "production"
  ) {
    this.client = new SNSClient({ region });
    this.environment = environment;
    this.topicArns = new Map();
  }

  /**
   * Create SNS topic for alerts
   */
  async createTopic(config: TopicConfig): Promise<string> {
    const topicName = `${this.environment}-${config.name}`;

    const command = new CreateTopicCommand({
      Name: topicName,
      Attributes: {
        DisplayName: config.displayName || config.name,
        FifoTopic: "false",
      },
      Tags: [
        { Key: "Environment", Value: this.environment },
        { Key: "Purpose", Value: "HybridRoutingAlerts" },
        { Key: "ManagedBy", Value: "SNSNotificationManager" },
      ],
    });

    const response = await this.client.send(command);
    const topicArn = response.TopicArn!;

    this.topicArns.set(config.name, topicArn);

    // Create subscriptions
    for (const subscription of config.subscriptions) {
      await this.subscribe(topicArn, subscription);
    }

    return topicArn;
  }

  /**
   * Create all standard topics for hybrid routing alerts
   */
  async createAllTopics(): Promise<Record<string, string>> {
    const topics: TopicConfig[] = [
      {
        name: "hybrid-routing-critical-alerts",
        displayName: "Hybrid Routing Critical Alerts",
        subscriptions: [],
      },
      {
        name: "hybrid-routing-warning-alerts",
        displayName: "Hybrid Routing Warning Alerts",
        subscriptions: [],
      },
      {
        name: "hybrid-routing-info-alerts",
        displayName: "Hybrid Routing Info Alerts",
        subscriptions: [],
      },
    ];

    const arns: Record<string, string> = {};

    for (const topic of topics) {
      const arn = await this.createTopic(topic);
      arns[topic.name] = arn;
    }

    return arns;
  }

  /**
   * Subscribe to a topic
   */
  async subscribe(
    topicArn: string,
    config: SubscriptionConfig
  ): Promise<string> {
    const command = new SubscribeCommand({
      TopicArn: topicArn,
      Protocol: config.protocol,
      Endpoint: config.endpoint,
      Attributes: config.filterPolicy
        ? { FilterPolicy: JSON.stringify(config.filterPolicy) }
        : undefined,
      ReturnSubscriptionArn: true,
    });

    const response = await this.client.send(command);
    return response.SubscriptionArn!;
  }

  /**
   * Unsubscribe from a topic
   */
  async unsubscribe(subscriptionArn: string): Promise<void> {
    const command = new UnsubscribeCommand({
      SubscriptionArn: subscriptionArn,
    });

    await this.client.send(command);
  }

  /**
   * Delete a topic
   */
  async deleteTopic(topicArn: string): Promise<void> {
    const command = new DeleteTopicCommand({
      TopicArn: topicArn,
    });

    await this.client.send(command);

    // Remove from cache
    for (const [name, arn] of this.topicArns.entries()) {
      if (arn === topicArn) {
        this.topicArns.delete(name);
        break;
      }
    }
  }

  /**
   * Delete all topics for this environment
   */
  async deleteAllTopics(): Promise<void> {
    const topicNames = [
      "hybrid-routing-critical-alerts",
      "hybrid-routing-warning-alerts",
      "hybrid-routing-info-alerts",
    ];

    for (const name of topicNames) {
      const arn = this.topicArns.get(name);
      if (arn) {
        await this.deleteTopic(arn);
      }
    }
  }

  /**
   * Publish alert message
   */
  async publishAlert(topicArn: string, message: AlertMessage): Promise<string> {
    const formattedMessage = this.formatAlertMessage(message);
    const subject = this.formatAlertSubject(message);

    const command = new PublishCommand({
      TopicArn: topicArn,
      Message: formattedMessage,
      Subject: subject,
      MessageAttributes: {
        severity: {
          DataType: "String",
          StringValue: message.severity,
        },
        environment: {
          DataType: "String",
          StringValue: message.environment,
        },
        alarmName: {
          DataType: "String",
          StringValue: message.alarmName,
        },
      },
    });

    const response = await this.client.send(command);
    return response.MessageId!;
  }

  /**
   * Format alert message for human readability
   */
  private formatAlertMessage(message: AlertMessage): string {
    const lines: string[] = [
      "=".repeat(60),
      `HYBRID ROUTING ALERT - ${message.severity.toUpperCase()}`,
      "=".repeat(60),
      "",
      `Environment: ${message.environment}`,
      `Alarm: ${message.alarmName}`,
      `Metric: ${message.metricName}`,
      `Timestamp: ${message.timestamp.toISOString()}`,
      "",
      "DETAILS:",
      "-".repeat(60),
      `Threshold: ${message.threshold}`,
      `Current Value: ${message.currentValue}`,
      "",
      "DESCRIPTION:",
      "-".repeat(60),
      message.description,
    ];

    if (message.recommendations && message.recommendations.length > 0) {
      lines.push("", "RECOMMENDATIONS:", "-".repeat(60));
      message.recommendations.forEach((rec, index) => {
        lines.push(`${index + 1}. ${rec}`);
      });
    }

    lines.push("", "=".repeat(60));

    return lines.join("\n");
  }

  /**
   * Format alert subject line
   */
  private formatAlertSubject(message: AlertMessage): string {
    const severityEmoji = {
      [AlertSeverity.CRITICAL]: "🚨",
      [AlertSeverity.WARNING]: "⚠️",
      [AlertSeverity.INFO]: "ℹ️",
    };

    return `${
      severityEmoji[message.severity]
    } [${message.environment.toUpperCase()}] ${message.alarmName}`;
  }

  /**
   * Get topic ARN by name
   */
  getTopicArn(name: string): string | undefined {
    return this.topicArns.get(name);
  }

  /**
   * List all subscriptions for a topic
   */
  async listSubscriptions(topicArn: string): Promise<any[]> {
    const command = new ListSubscriptionsByTopicCommand({
      TopicArn: topicArn,
    });

    const response = await this.client.send(command);
    return response.Subscriptions || [];
  }

  /**
   * Set topic attributes
   */
  async setTopicAttribute(
    topicArn: string,
    attributeName: string,
    attributeValue: string
  ): Promise<void> {
    const command = new SetTopicAttributesCommand({
      TopicArn: topicArn,
      AttributeName: attributeName,
      AttributeValue: attributeValue,
    });

    await this.client.send(command);
  }

  /**
   * Get topic attributes
   */
  async getTopicAttributes(topicArn: string): Promise<Record<string, string>> {
    const command = new GetTopicAttributesCommand({
      TopicArn: topicArn,
    });

    const response = await this.client.send(command);
    return response.Attributes || {};
  }

  /**
   * Add email subscription
   */
  async addEmailSubscription(topicArn: string, email: string): Promise<string> {
    return this.subscribe(topicArn, {
      protocol: "email",
      endpoint: email,
    });
  }

  /**
   * Add SMS subscription
   */
  async addSMSSubscription(
    topicArn: string,
    phoneNumber: string
  ): Promise<string> {
    return this.subscribe(topicArn, {
      protocol: "sms",
      endpoint: phoneNumber,
    });
  }

  /**
   * Add webhook subscription
   */
  async addWebhookSubscription(
    topicArn: string,
    webhookUrl: string,
    filterPolicy?: Record<string, any>
  ): Promise<string> {
    return this.subscribe(topicArn, {
      protocol: "https",
      endpoint: webhookUrl,
      filterPolicy,
    });
  }

  /**
   * Publish high failure rate alert
   */
  async publishHighFailureRateAlert(
    topicArn: string,
    currentSuccessRate: number,
    threshold: number
  ): Promise<string> {
    const message: AlertMessage = {
      severity: AlertSeverity.CRITICAL,
      alarmName: `${this.environment}-hybrid-routing-high-failure-rate`,
      metricName: "SupportModeSuccessRate",
      threshold,
      currentValue: currentSuccessRate,
      timestamp: new Date(),
      environment: this.environment,
      description: `Success rate has fallen below ${threshold}%. Current success rate: ${currentSuccessRate}%`,
      recommendations: [
        "Check hybrid routing health status",
        "Review recent deployment changes",
        "Verify MCP and direct Bedrock connectivity",
        "Check circuit breaker status",
        "Review error logs for patterns",
      ],
    };

    return this.publishAlert(topicArn, message);
  }

  /**
   * Publish high latency alert
   */
  async publishHighLatencyAlert(
    topicArn: string,
    currentLatency: number,
    threshold: number
  ): Promise<string> {
    const message: AlertMessage = {
      severity: AlertSeverity.WARNING,
      alarmName: `${this.environment}-hybrid-routing-high-latency`,
      metricName: "SupportModeAverageLatency",
      threshold,
      currentValue: currentLatency,
      timestamp: new Date(),
      environment: this.environment,
      description: `Average latency has exceeded ${threshold}ms. Current latency: ${currentLatency}ms`,
      recommendations: [
        "Check routing efficiency metrics",
        "Review direct Bedrock performance",
        "Verify MCP connection health",
        "Check for network issues",
        "Review recent traffic patterns",
      ],
    };

    return this.publishAlert(topicArn, message);
  }

  /**
   * Publish cost threshold alert
   */
  async publishCostThresholdAlert(
    topicArn: string,
    currentCost: number,
    threshold: number
  ): Promise<string> {
    const message: AlertMessage = {
      severity: AlertSeverity.WARNING,
      alarmName: `${this.environment}-hybrid-routing-cost-threshold`,
      metricName: "SupportModeTotalCost",
      threshold,
      currentValue: currentCost,
      timestamp: new Date(),
      environment: this.environment,
      description: `Total cost has exceeded €${threshold}. Current cost: €${currentCost}`,
      recommendations: [
        "Review cost optimization settings",
        "Check cache hit rate",
        "Verify token limits are enforced",
        "Review routing efficiency",
        "Consider adjusting budget thresholds",
      ],
    };

    return this.publishAlert(topicArn, message);
  }

  /**
   * Publish low operation count alert
   */
  async publishLowOperationCountAlert(
    topicArn: string,
    currentCount: number,
    threshold: number
  ): Promise<string> {
    const message: AlertMessage = {
      severity: AlertSeverity.INFO,
      alarmName: `${this.environment}-hybrid-routing-low-operation-count`,
      metricName: "SupportModeOperationCount",
      threshold,
      currentValue: currentCount,
      timestamp: new Date(),
      environment: this.environment,
      description: `Operation count has fallen below ${threshold} per hour. Current count: ${currentCount}`,
      recommendations: [
        "Verify support mode is enabled",
        "Check feature flag configuration",
        "Review system health status",
        "Verify metrics are being published",
        "Check for system-wide issues",
      ],
    };

    return this.publishAlert(topicArn, message);
  }
}
