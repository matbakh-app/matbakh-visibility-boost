/**
 * Tests for CloudWatch Alarm Manager
 */

import { CloudWatchClient } from "@aws-sdk/client-cloudwatch";
import { CloudWatchAlarmManager } from "../alerting/cloudwatch-alarm-manager";

// Mock AWS SDK
jest.mock("@aws-sdk/client-cloudwatch");

describe("CloudWatchAlarmManager", () => {
  let manager: CloudWatchAlarmManager;
  let mockSend: jest.Mock;

  beforeEach(() => {
    mockSend = jest.fn().mockResolvedValue({});
    (CloudWatchClient as jest.Mock).mockImplementation(() => ({
      send: mockSend,
    }));

    manager = new CloudWatchAlarmManager("eu-central-1", "production");
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Constructor", () => {
    it("should initialize with default production thresholds", () => {
      const thresholds = manager.getThresholds();

      expect(thresholds.failureRateThreshold).toBe(95);
      expect(thresholds.latencyThreshold).toBe(2000);
      expect(thresholds.costThreshold).toBe(0.8);
      expect(thresholds.operationCountThreshold).toBe(10);
    });

    it("should initialize with custom thresholds", () => {
      const customManager = new CloudWatchAlarmManager(
        "eu-central-1",
        "production",
        {
          failureRateThreshold: 98,
          latencyThreshold: 1500,
        }
      );

      const thresholds = customManager.getThresholds();

      expect(thresholds.failureRateThreshold).toBe(98);
      expect(thresholds.latencyThreshold).toBe(1500);
      expect(thresholds.costThreshold).toBe(0.8); // Default
      expect(thresholds.operationCountThreshold).toBe(10); // Default
    });

    it("should use environment-specific thresholds for staging", () => {
      const stagingManager = new CloudWatchAlarmManager(
        "eu-central-1",
        "staging"
      );
      const thresholds = stagingManager.getThresholds();

      expect(thresholds.failureRateThreshold).toBe(92);
      expect(thresholds.latencyThreshold).toBe(2500);
    });

    it("should use environment-specific thresholds for development", () => {
      const devManager = new CloudWatchAlarmManager(
        "eu-central-1",
        "development"
      );
      const thresholds = devManager.getThresholds();

      expect(thresholds.failureRateThreshold).toBe(90);
      expect(thresholds.latencyThreshold).toBe(3000);
    });
  });

  describe("createHighFailureRateAlarm", () => {
    it("should create high failure rate alarm with correct configuration", async () => {
      const snsTopicArn = "arn:aws:sns:eu-central-1:123456789012:test-topic";

      await manager.createHighFailureRateAlarm(snsTopicArn);

      expect(mockSend).toHaveBeenCalledTimes(1);
      const command = mockSend.mock.calls[0][0];

      expect(command.input.AlarmName).toBe(
        "production-hybrid-routing-high-failure-rate"
      );
      expect(command.input.MetricName).toBe("SupportModeSuccessRate");
      expect(command.input.Threshold).toBe(95);
      expect(command.input.ComparisonOperator).toBe("LessThanThreshold");
      expect(command.input.Period).toBe(300);
      expect(command.input.AlarmActions).toEqual([snsTopicArn]);
    });

    it("should include dimensions when provided", async () => {
      const snsTopicArn = "arn:aws:sns:eu-central-1:123456789012:test-topic";
      const dimensions = [{ Name: "Environment", Value: "production" }];

      await manager.createHighFailureRateAlarm(snsTopicArn, dimensions);

      const command = mockSend.mock.calls[0][0];
      expect(command.input.Dimensions).toEqual(dimensions);
    });
  });

  describe("createHighLatencyAlarm", () => {
    it("should create high latency alarm with correct configuration", async () => {
      const snsTopicArn = "arn:aws:sns:eu-central-1:123456789012:test-topic";

      await manager.createHighLatencyAlarm(snsTopicArn);

      expect(mockSend).toHaveBeenCalledTimes(1);
      const command = mockSend.mock.calls[0][0];

      expect(command.input.AlarmName).toBe(
        "production-hybrid-routing-high-latency"
      );
      expect(command.input.MetricName).toBe("SupportModeAverageLatency");
      expect(command.input.Threshold).toBe(2000);
      expect(command.input.ComparisonOperator).toBe("GreaterThanThreshold");
      expect(command.input.Period).toBe(300);
    });
  });

  describe("createCostThresholdAlarm", () => {
    it("should create cost threshold alarm with correct configuration", async () => {
      const snsTopicArn = "arn:aws:sns:eu-central-1:123456789012:test-topic";

      await manager.createCostThresholdAlarm(snsTopicArn);

      expect(mockSend).toHaveBeenCalledTimes(1);
      const command = mockSend.mock.calls[0][0];

      expect(command.input.AlarmName).toBe(
        "production-hybrid-routing-cost-threshold"
      );
      expect(command.input.MetricName).toBe("SupportModeTotalCost");
      expect(command.input.Threshold).toBe(0.8);
      expect(command.input.ComparisonOperator).toBe("GreaterThanThreshold");
      expect(command.input.Period).toBe(3600);
      expect(command.input.Statistic).toBe("Sum");
    });
  });

  describe("createLowOperationCountAlarm", () => {
    it("should create low operation count alarm with correct configuration", async () => {
      const snsTopicArn = "arn:aws:sns:eu-central-1:123456789012:test-topic";

      await manager.createLowOperationCountAlarm(snsTopicArn);

      expect(mockSend).toHaveBeenCalledTimes(1);
      const command = mockSend.mock.calls[0][0];

      expect(command.input.AlarmName).toBe(
        "production-hybrid-routing-low-operation-count"
      );
      expect(command.input.MetricName).toBe("SupportModeOperationCount");
      expect(command.input.Threshold).toBe(10);
      expect(command.input.ComparisonOperator).toBe("LessThanThreshold");
      expect(command.input.Period).toBe(3600);
      expect(command.input.TreatMissingData).toBe("breaching");
    });
  });

  describe("createAllAlarms", () => {
    it("should create all four alarm types", async () => {
      const snsTopicArn = "arn:aws:sns:eu-central-1:123456789012:test-topic";

      await manager.createAllAlarms(snsTopicArn);

      expect(mockSend).toHaveBeenCalledTimes(4);

      const alarmNames = mockSend.mock.calls.map(
        (call) => call[0].input.AlarmName
      );
      expect(alarmNames).toContain(
        "production-hybrid-routing-high-failure-rate"
      );
      expect(alarmNames).toContain("production-hybrid-routing-high-latency");
      expect(alarmNames).toContain("production-hybrid-routing-cost-threshold");
      expect(alarmNames).toContain(
        "production-hybrid-routing-low-operation-count"
      );
    });

    it("should pass dimensions to all alarms", async () => {
      const snsTopicArn = "arn:aws:sns:eu-central-1:123456789012:test-topic";
      const dimensions = [{ Name: "Environment", Value: "production" }];

      await manager.createAllAlarms(snsTopicArn, dimensions);

      mockSend.mock.calls.forEach((call) => {
        expect(call[0].input.Dimensions).toEqual(dimensions);
      });
    });
  });

  describe("deleteAlarm", () => {
    it("should delete a single alarm", async () => {
      await manager.deleteAlarm("test-alarm");

      expect(mockSend).toHaveBeenCalledTimes(1);
      const command = mockSend.mock.calls[0][0];
      expect(command.input.AlarmNames).toEqual(["test-alarm"]);
    });
  });

  describe("deleteAllAlarms", () => {
    it("should delete all environment alarms", async () => {
      await manager.deleteAllAlarms();

      expect(mockSend).toHaveBeenCalledTimes(1);
      const command = mockSend.mock.calls[0][0];
      expect(command.input.AlarmNames).toHaveLength(4);
      expect(command.input.AlarmNames).toContain(
        "production-hybrid-routing-high-failure-rate"
      );
    });
  });

  describe("getAlarmStatus", () => {
    it("should retrieve alarm status", async () => {
      const mockAlarm = {
        AlarmName: "test-alarm",
        StateValue: "OK",
      };

      mockSend.mockResolvedValueOnce({
        MetricAlarms: [mockAlarm],
      });

      const status = await manager.getAlarmStatus("test-alarm");

      expect(status).toEqual(mockAlarm);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });
  });

  describe("getAllAlarmStatuses", () => {
    it("should retrieve all alarm statuses", async () => {
      const mockAlarms = [
        { AlarmName: "alarm1", StateValue: "OK" },
        { AlarmName: "alarm2", StateValue: "ALARM" },
      ];

      mockSend.mockResolvedValueOnce({
        MetricAlarms: mockAlarms,
      });

      const statuses = await manager.getAllAlarmStatuses();

      expect(statuses).toEqual(mockAlarms);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it("should return empty array when no alarms exist", async () => {
      mockSend.mockResolvedValueOnce({
        MetricAlarms: undefined,
      });

      const statuses = await manager.getAllAlarmStatuses();

      expect(statuses).toEqual([]);
    });
  });

  describe("updateThresholds", () => {
    it("should update thresholds", () => {
      manager.updateThresholds({
        failureRateThreshold: 98,
        latencyThreshold: 1500,
      });

      const thresholds = manager.getThresholds();
      expect(thresholds.failureRateThreshold).toBe(98);
      expect(thresholds.latencyThreshold).toBe(1500);
      expect(thresholds.costThreshold).toBe(0.8); // Unchanged
    });

    it("should partially update thresholds", () => {
      manager.updateThresholds({
        failureRateThreshold: 97,
      });

      const thresholds = manager.getThresholds();
      expect(thresholds.failureRateThreshold).toBe(97);
      expect(thresholds.latencyThreshold).toBe(2000); // Unchanged
    });
  });

  describe("Error Handling", () => {
    it("should handle AWS SDK errors gracefully", async () => {
      mockSend.mockRejectedValueOnce(new Error("AWS Error"));

      await expect(
        manager.createHighFailureRateAlarm("arn:aws:sns:test")
      ).rejects.toThrow("AWS Error");
    });

    it("should handle missing alarm in getAlarmStatus", async () => {
      mockSend.mockResolvedValueOnce({
        MetricAlarms: [],
      });

      const status = await manager.getAlarmStatus("non-existent-alarm");
      expect(status).toBeUndefined();
    });
  });
});
