/**
 * Tests for SNS Notification Manager
 */

import { SNSClient } from "@aws-sdk/client-sns";
import {
  AlertMessage,
  AlertSeverity,
  SNSNotificationManager,
} from "../alerting/sns-notification-manager";

// Mock AWS SDK
jest.mock("@aws-sdk/client-sns");

describe("SNSNotificationManager", () => {
  let manager: SNSNotificationManager;
  let mockSend: jest.Mock;

  beforeEach(() => {
    mockSend = jest.fn().mockResolvedValue({});
    (SNSClient as jest.Mock).mockImplementation(() => ({
      send: mockSend,
    }));

    manager = new SNSNotificationManager("eu-central-1", "production");
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("createTopic", () => {
    it("should create SNS topic with correct configuration", async () => {
      mockSend.mockResolvedValueOnce({
        TopicArn: "arn:aws:sns:eu-central-1:123456789012:production-test-topic",
      });

      const config = {
        name: "test-topic",
        displayName: "Test Topic",
        subscriptions: [],
      };

      const topicArn = await manager.createTopic(config);

      expect(topicArn).toBe(
        "arn:aws:sns:eu-central-1:123456789012:production-test-topic"
      );
      expect(mockSend).toHaveBeenCalledTimes(1);

      const command = mockSend.mock.calls[0][0];
      expect(command.input.Name).toBe("production-test-topic");
      expect(command.input.Attributes?.DisplayName).toBe("Test Topic");
      expect(command.input.Tags).toContainEqual({
        Key: "Environment",
        Value: "production",
      });
    });

    it("should create topic with subscriptions", async () => {
      mockSend
        .mockResolvedValueOnce({
          TopicArn:
            "arn:aws:sns:eu-central-1:123456789012:production-test-topic",
        })
        .mockResolvedValueOnce({
          SubscriptionArn:
            "arn:aws:sns:eu-central-1:123456789012:subscription-1",
        });

      const config = {
        name: "test-topic",
        subscriptions: [
          {
            protocol: "email" as const,
            endpoint: "test@example.com",
          },
        ],
      };

      await manager.createTopic(config);

      expect(mockSend).toHaveBeenCalledTimes(2);
      const subscribeCommand = mockSend.mock.calls[1][0];
      expect(subscribeCommand.input.Protocol).toBe("email");
      expect(subscribeCommand.input.Endpoint).toBe("test@example.com");
    });
  });

  describe("createAllTopics", () => {
    it("should create all standard topics", async () => {
      mockSend
        .mockResolvedValueOnce({
          TopicArn:
            "arn:aws:sns:eu-central-1:123456789012:production-hybrid-routing-critical-alerts",
        })
        .mockResolvedValueOnce({
          TopicArn:
            "arn:aws:sns:eu-central-1:123456789012:production-hybrid-routing-warning-alerts",
        })
        .mockResolvedValueOnce({
          TopicArn:
            "arn:aws:sns:eu-central-1:123456789012:production-hybrid-routing-info-alerts",
        });

      const arns = await manager.createAllTopics();

      expect(Object.keys(arns)).toHaveLength(3);
      expect(arns["hybrid-routing-critical-alerts"]).toBeDefined();
      expect(arns["hybrid-routing-warning-alerts"]).toBeDefined();
      expect(arns["hybrid-routing-info-alerts"]).toBeDefined();
      expect(mockSend).toHaveBeenCalledTimes(3);
    });
  });

  describe("subscribe", () => {
    it("should subscribe to topic with email", async () => {
      mockSend.mockResolvedValueOnce({
        SubscriptionArn: "arn:aws:sns:eu-central-1:123456789012:subscription-1",
      });

      const subscriptionArn = await manager.subscribe("topic-arn", {
        protocol: "email",
        endpoint: "test@example.com",
      });

      expect(subscriptionArn).toBe(
        "arn:aws:sns:eu-central-1:123456789012:subscription-1"
      );
      const command = mockSend.mock.calls[0][0];
      expect(command.input.Protocol).toBe("email");
      expect(command.input.Endpoint).toBe("test@example.com");
    });

    it("should subscribe with filter policy", async () => {
      mockSend.mockResolvedValueOnce({
        SubscriptionArn: "arn:aws:sns:eu-central-1:123456789012:subscription-1",
      });

      const filterPolicy = { severity: ["critical"] };

      await manager.subscribe("topic-arn", {
        protocol: "email",
        endpoint: "test@example.com",
        filterPolicy,
      });

      const command = mockSend.mock.calls[0][0];
      expect(command.input.Attributes?.FilterPolicy).toBe(
        JSON.stringify(filterPolicy)
      );
    });
  });

  describe("unsubscribe", () => {
    it("should unsubscribe from topic", async () => {
      await manager.unsubscribe("subscription-arn");

      expect(mockSend).toHaveBeenCalledTimes(1);
      const command = mockSend.mock.calls[0][0];
      expect(command.input.SubscriptionArn).toBe("subscription-arn");
    });
  });

  describe("deleteTopic", () => {
    it("should delete topic", async () => {
      await manager.deleteTopic("topic-arn");

      expect(mockSend).toHaveBeenCalledTimes(1);
      const command = mockSend.mock.calls[0][0];
      expect(command.input.TopicArn).toBe("topic-arn");
    });
  });

  describe("publishAlert", () => {
    it("should publish alert message", async () => {
      mockSend.mockResolvedValueOnce({
        MessageId: "message-123",
      });

      const message: AlertMessage = {
        severity: AlertSeverity.CRITICAL,
        alarmName: "test-alarm",
        metricName: "TestMetric",
        threshold: 95,
        currentValue: 85,
        timestamp: new Date("2025-01-14T12:00:00Z"),
        environment: "production",
        description: "Test alert",
        recommendations: ["Check system", "Review logs"],
      };

      const messageId = await manager.publishAlert("topic-arn", message);

      expect(messageId).toBe("message-123");
      expect(mockSend).toHaveBeenCalledTimes(1);

      const command = mockSend.mock.calls[0][0];
      expect(command.input.TopicArn).toBe("topic-arn");
      expect(command.input.Subject).toContain("test-alarm");
      expect(command.input.Message).toContain("Test alert");
      expect(command.input.MessageAttributes?.severity.StringValue).toBe(
        "critical"
      );
    });

    it("should format message with recommendations", async () => {
      mockSend.mockResolvedValueOnce({ MessageId: "message-123" });

      const message: AlertMessage = {
        severity: AlertSeverity.WARNING,
        alarmName: "test-alarm",
        metricName: "TestMetric",
        threshold: 100,
        currentValue: 150,
        timestamp: new Date(),
        environment: "production",
        description: "Test description",
        recommendations: ["Action 1", "Action 2"],
      };

      await manager.publishAlert("topic-arn", message);

      const command = mockSend.mock.calls[0][0];
      const messageBody = command.input.Message;

      expect(messageBody).toContain("RECOMMENDATIONS:");
      expect(messageBody).toContain("1. Action 1");
      expect(messageBody).toContain("2. Action 2");
    });
  });

  describe("Convenience Methods", () => {
    it("should add email subscription", async () => {
      mockSend.mockResolvedValueOnce({
        SubscriptionArn: "subscription-arn",
      });

      const subscriptionArn = await manager.addEmailSubscription(
        "topic-arn",
        "test@example.com"
      );

      expect(subscriptionArn).toBe("subscription-arn");
      const command = mockSend.mock.calls[0][0];
      expect(command.input.Protocol).toBe("email");
      expect(command.input.Endpoint).toBe("test@example.com");
    });

    it("should add SMS subscription", async () => {
      mockSend.mockResolvedValueOnce({
        SubscriptionArn: "subscription-arn",
      });

      const subscriptionArn = await manager.addSMSSubscription(
        "topic-arn",
        "+1234567890"
      );

      expect(subscriptionArn).toBe("subscription-arn");
      const command = mockSend.mock.calls[0][0];
      expect(command.input.Protocol).toBe("sms");
      expect(command.input.Endpoint).toBe("+1234567890");
    });

    it("should add webhook subscription", async () => {
      mockSend.mockResolvedValueOnce({
        SubscriptionArn: "subscription-arn",
      });

      const filterPolicy = { severity: ["critical"] };
      const subscriptionArn = await manager.addWebhookSubscription(
        "topic-arn",
        "https://example.com/webhook",
        filterPolicy
      );

      expect(subscriptionArn).toBe("subscription-arn");
      const command = mockSend.mock.calls[0][0];
      expect(command.input.Protocol).toBe("https");
      expect(command.input.Endpoint).toBe("https://example.com/webhook");
    });
  });

  describe("Alert Publishing Methods", () => {
    beforeEach(() => {
      mockSend.mockResolvedValue({ MessageId: "message-123" });
    });

    it("should publish high failure rate alert", async () => {
      const messageId = await manager.publishHighFailureRateAlert(
        "topic-arn",
        85,
        95
      );

      expect(messageId).toBe("message-123");
      const command = mockSend.mock.calls[0][0];
      expect(command.input.Message).toContain(
        "Success rate has fallen below 95%"
      );
      expect(command.input.Message).toContain("Current success rate: 85%");
      expect(command.input.MessageAttributes?.severity.StringValue).toBe(
        "critical"
      );
    });

    it("should publish high latency alert", async () => {
      const messageId = await manager.publishHighLatencyAlert(
        "topic-arn",
        2500,
        2000
      );

      expect(messageId).toBe("message-123");
      const command = mockSend.mock.calls[0][0];
      expect(command.input.Message).toContain(
        "Average latency has exceeded 2000ms"
      );
      expect(command.input.Message).toContain("Current latency: 2500ms");
      expect(command.input.MessageAttributes?.severity.StringValue).toBe(
        "warning"
      );
    });

    it("should publish cost threshold alert", async () => {
      const messageId = await manager.publishCostThresholdAlert(
        "topic-arn",
        0.9,
        0.8
      );

      expect(messageId).toBe("message-123");
      const command = mockSend.mock.calls[0][0];
      expect(command.input.Message).toContain("Total cost has exceeded €0.8");
      expect(command.input.Message).toContain("Current cost: €0.9");
      expect(command.input.MessageAttributes?.severity.StringValue).toBe(
        "warning"
      );
    });

    it("should publish low operation count alert", async () => {
      const messageId = await manager.publishLowOperationCountAlert(
        "topic-arn",
        5,
        10
      );

      expect(messageId).toBe("message-123");
      const command = mockSend.mock.calls[0][0];
      expect(command.input.Message).toContain(
        "Operation count has fallen below 10 per hour"
      );
      expect(command.input.Message).toContain("Current count: 5");
      expect(command.input.MessageAttributes?.severity.StringValue).toBe(
        "info"
      );
    });
  });

  describe("Topic Management", () => {
    it("should get topic ARN by name", async () => {
      mockSend.mockResolvedValueOnce({
        TopicArn: "arn:aws:sns:eu-central-1:123456789012:production-test-topic",
      });

      await manager.createTopic({
        name: "test-topic",
        subscriptions: [],
      });

      const arn = manager.getTopicArn("test-topic");
      expect(arn).toBe(
        "arn:aws:sns:eu-central-1:123456789012:production-test-topic"
      );
    });

    it("should return undefined for non-existent topic", () => {
      const arn = manager.getTopicArn("non-existent");
      expect(arn).toBeUndefined();
    });

    it("should list subscriptions for topic", async () => {
      const mockSubscriptions = [
        {
          SubscriptionArn: "sub-1",
          Protocol: "email",
          Endpoint: "test1@example.com",
        },
        { SubscriptionArn: "sub-2", Protocol: "sms", Endpoint: "+1234567890" },
      ];

      mockSend.mockResolvedValueOnce({
        Subscriptions: mockSubscriptions,
      });

      const subscriptions = await manager.listSubscriptions("topic-arn");

      expect(subscriptions).toEqual(mockSubscriptions);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it("should set topic attribute", async () => {
      await manager.setTopicAttribute("topic-arn", "DisplayName", "New Name");

      expect(mockSend).toHaveBeenCalledTimes(1);
      const command = mockSend.mock.calls[0][0];
      expect(command.input.TopicArn).toBe("topic-arn");
      expect(command.input.AttributeName).toBe("DisplayName");
      expect(command.input.AttributeValue).toBe("New Name");
    });

    it("should get topic attributes", async () => {
      const mockAttributes = {
        DisplayName: "Test Topic",
        SubscriptionsConfirmed: "2",
      };

      mockSend.mockResolvedValueOnce({
        Attributes: mockAttributes,
      });

      const attributes = await manager.getTopicAttributes("topic-arn");

      expect(attributes).toEqual(mockAttributes);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });
  });

  describe("Error Handling", () => {
    it("should handle AWS SDK errors gracefully", async () => {
      mockSend.mockRejectedValueOnce(new Error("AWS Error"));

      await expect(
        manager.createTopic({ name: "test", subscriptions: [] })
      ).rejects.toThrow("AWS Error");
    });

    it("should handle missing topic ARN in response", async () => {
      mockSend.mockResolvedValueOnce({});

      await expect(
        manager.createTopic({ name: "test", subscriptions: [] })
      ).rejects.toThrow();
    });
  });
});
