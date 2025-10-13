/**
 * Alert Testing Framework Tests
 *
 * Comprehensive test suite for the Alert Testing Framework
 */

import {
  AlertSeverity,
  AlertTestingFramework,
  TestScenario,
  TestScenarioType,
  TestSuiteConfig,
} from "../alerting/alert-testing-framework";
import { CloudWatchAlarmManager } from "../alerting/cloudwatch-alarm-manager";
import { PagerDutyIntegration } from "../alerting/pagerduty-integration";
import { SNSNotificationManager } from "../alerting/sns-notification-manager";

// Mock AWS SDK clients
jest.mock("@aws-sdk/client-cloudwatch");
jest.mock("@aws-sdk/client-sns");

// Mock managers
jest.mock("../alerting/cloudwatch-alarm-manager");
jest.mock("../alerting/sns-notification-manager");
jest.mock("../alerting/pagerduty-integration");

describe("AlertTestingFramework", () => {
  let framework: AlertTestingFramework;
  let testConfig: TestSuiteConfig;
  let mockCreateAlarm: jest.Mock;
  let mockDeleteAlarm: jest.Mock;
  let mockPublishAlert: jest.Mock;
  let mockCreateIncident: jest.Mock;
  let mockResolveIncident: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    testConfig = {
      environment: "test",
      region: "eu-central-1",
      scenarios: [],
      cloudWatchConfig: {
        enabled: true,
        namespace: "MatbakhApp/HybridRouting/SupportMode",
      },
      snsConfig: {
        enabled: true,
        topicArn: "arn:aws:sns:eu-central-1:123456789012:test-topic",
      },
      pagerDutyConfig: {
        enabled: true,
        integrationKey: "test-integration-key",
      },
    };

    // Setup mocks fresh each time
    mockCreateAlarm = jest.fn().mockResolvedValue(undefined);
    mockDeleteAlarm = jest.fn().mockResolvedValue(undefined);
    mockPublishAlert = jest.fn().mockResolvedValue(undefined);
    mockCreateIncident = jest.fn().mockResolvedValue("test-incident-key");
    mockResolveIncident = jest.fn().mockResolvedValue(undefined);

    (CloudWatchAlarmManager as jest.Mock).mockImplementation(() => ({
      createAlarm: mockCreateAlarm,
      deleteAlarm: mockDeleteAlarm,
    }));

    (SNSNotificationManager as jest.Mock).mockImplementation(() => ({
      publishAlert: mockPublishAlert,
    }));

    (PagerDutyIntegration as jest.Mock).mockImplementation(() => ({
      createIncident: mockCreateIncident,
      resolveIncident: mockResolveIncident,
    }));

    // ✅ Framework **nach** allen Mock-Implementierungen erzeugen
    framework = new AlertTestingFramework(testConfig);
  });

  afterEach(() => {
    jest.resetModules();
  });

  describe("Framework Initialization", () => {
    it("should initialize with all managers enabled", () => {
      expect(framework).toBeDefined();
      expect(CloudWatchAlarmManager).toHaveBeenCalledWith(
        "eu-central-1",
        "test"
      );
      expect(SNSNotificationManager).toHaveBeenCalledWith(
        "eu-central-1",
        "test"
      );
      expect(PagerDutyIntegration).toHaveBeenCalledWith({
        integrationKey: "test-integration-key",
        serviceName: "test-hybrid-routing-alerts",
      });
    });

    it("should initialize with only CloudWatch enabled", () => {
      const config: TestSuiteConfig = {
        ...testConfig,
        snsConfig: { enabled: false },
        pagerDutyConfig: { enabled: false },
      };

      const testFramework = new AlertTestingFramework(config);
      expect(testFramework).toBeDefined();
    });

    it("should initialize with no managers enabled", () => {
      const config: TestSuiteConfig = {
        ...testConfig,
        cloudWatchConfig: { enabled: false },
        snsConfig: { enabled: false },
        pagerDutyConfig: { enabled: false },
      };

      const testFramework = new AlertTestingFramework(config);
      expect(testFramework).toBeDefined();
    });
  });

  describe("Test Suite Execution", () => {
    it("should run empty test suite successfully", async () => {
      const scenarios: TestScenario[] = [];
      const report = await framework.runTestSuite(scenarios);

      expect(report).toBeDefined();
      expect(report.totalTests).toBe(0);
      expect(report.passedTests).toBe(0);
      expect(report.failedTests).toBe(0);
      expect(report.summary.successRate).toBe(0);
    });

    it("should run single scenario successfully", async () => {
      const scenarios: TestScenario[] = [
        {
          type: TestScenarioType.HIGH_FAILURE_RATE,
          name: "Test High Failure Rate",
          description: "Test high failure rate scenario",
          severity: AlertSeverity.CRITICAL,
          expectedOutcome: "Alarm should trigger",
        },
      ];

      const report = await framework.runTestSuite(scenarios);

      expect(report.totalTests).toBe(1);
      expect(report.passedTests).toBe(1);
      expect(report.failedTests).toBe(0);
      expect(report.summary.successRate).toBe(100);
      expect(mockCreateAlarm).toHaveBeenCalled();
      expect(mockDeleteAlarm).toHaveBeenCalled();
    });

    it("should run multiple scenarios successfully", async () => {
      const scenarios: TestScenario[] = [
        {
          type: TestScenarioType.HIGH_FAILURE_RATE,
          name: "Test High Failure Rate",
          description: "Test high failure rate scenario",
          severity: AlertSeverity.CRITICAL,
          expectedOutcome: "Alarm should trigger",
        },
        {
          type: TestScenarioType.HIGH_LATENCY,
          name: "Test High Latency",
          description: "Test high latency scenario",
          severity: AlertSeverity.WARNING,
          expectedOutcome: "Alarm should trigger",
        },
      ];

      const report = await framework.runTestSuite(scenarios);

      expect(report.totalTests).toBe(2);
      expect(report.passedTests).toBe(2);
      expect(report.failedTests).toBe(0);
      expect(report.summary.successRate).toBe(100);
    });

    it("should handle scenario failures gracefully", async () => {
      // Override the default mock for this test
      mockCreateAlarm.mockRejectedValueOnce(new Error("CloudWatch error"));

      const scenarios: TestScenario[] = [
        {
          type: TestScenarioType.HIGH_FAILURE_RATE,
          name: "Test High Failure Rate",
          description: "Test high failure rate scenario",
          severity: AlertSeverity.CRITICAL,
          expectedOutcome: "Alarm should trigger",
        },
      ];

      const report = await framework.runTestSuite(scenarios);

      expect(report.totalTests).toBe(1);
      expect(report.passedTests).toBe(0);
      expect(report.failedTests).toBe(1);
      expect(report.summary.successRate).toBe(0);
      expect(report.results[0].errors).toContain("CloudWatch error");
    });
  });

  describe("High Failure Rate Scenario", () => {
    it("should test high failure rate successfully", async () => {
      const scenarios: TestScenario[] = [
        {
          type: TestScenarioType.HIGH_FAILURE_RATE,
          name: "Test High Failure Rate",
          description: "Test high failure rate scenario",
          severity: AlertSeverity.CRITICAL,
          expectedOutcome: "Alarm should trigger",
        },
      ];

      const report = await framework.runTestSuite(scenarios);

      expect(report.results[0].success).toBe(true);
      expect(report.results[0].details.alarmTriggered).toBe(true);
      expect(mockCreateAlarm).toHaveBeenCalledWith(
        expect.objectContaining({
          metricName: "SuccessRate",
          comparisonOperator: "LessThanThreshold",
        })
      );
    });

    it("should fail if CloudWatch manager not initialized", async () => {
      const config: TestSuiteConfig = {
        ...testConfig,
        cloudWatchConfig: { enabled: false },
      };

      const testFramework = new AlertTestingFramework(config);

      const scenarios: TestScenario[] = [
        {
          type: TestScenarioType.HIGH_FAILURE_RATE,
          name: "Test High Failure Rate",
          description: "Test high failure rate scenario",
          severity: AlertSeverity.CRITICAL,
          expectedOutcome: "Alarm should trigger",
        },
      ];

      const report = await testFramework.runTestSuite(scenarios);

      expect(report.results[0].success).toBe(false);
      expect(report.results[0].errors).toContain(
        "CloudWatch manager not initialized"
      );
    });
  });

  describe("High Latency Scenario", () => {
    it("should test high latency successfully", async () => {
      const scenarios: TestScenario[] = [
        {
          type: TestScenarioType.HIGH_LATENCY,
          name: "Test High Latency",
          description: "Test high latency scenario",
          severity: AlertSeverity.WARNING,
          expectedOutcome: "Alarm should trigger",
        },
      ];

      const report = await framework.runTestSuite(scenarios);

      expect(report.results[0].success).toBe(true);
      expect(report.results[0].details.alarmTriggered).toBe(true);
      expect(mockCreateAlarm).toHaveBeenCalledWith(
        expect.objectContaining({
          metricName: "AverageLatency",
          comparisonOperator: "GreaterThanThreshold",
        })
      );
    });
  });

  describe("Cost Threshold Scenario", () => {
    it("should test cost threshold successfully", async () => {
      const scenarios: TestScenario[] = [
        {
          type: TestScenarioType.COST_THRESHOLD,
          name: "Test Cost Threshold",
          description: "Test cost threshold scenario",
          severity: AlertSeverity.WARNING,
          expectedOutcome: "Alarm should trigger",
        },
      ];

      const report = await framework.runTestSuite(scenarios);

      expect(report.results[0].success).toBe(true);
      expect(report.results[0].details.alarmTriggered).toBe(true);
      expect(mockCreateAlarm).toHaveBeenCalledWith(
        expect.objectContaining({
          metricName: "TotalCost",
          comparisonOperator: "GreaterThanThreshold",
        })
      );
    });
  });

  describe("Low Operation Count Scenario", () => {
    it("should test low operation count successfully", async () => {
      const scenarios: TestScenario[] = [
        {
          type: TestScenarioType.LOW_OPERATION_COUNT,
          name: "Test Low Operation Count",
          description: "Test low operation count scenario",
          severity: AlertSeverity.INFO,
          expectedOutcome: "Alarm should trigger",
        },
      ];

      const report = await framework.runTestSuite(scenarios);

      expect(report.results[0].success).toBe(true);
      expect(report.results[0].details.alarmTriggered).toBe(true);
      expect(mockCreateAlarm).toHaveBeenCalledWith(
        expect.objectContaining({
          metricName: "OperationCount",
          comparisonOperator: "LessThanThreshold",
        })
      );
    });
  });

  describe("Incident Lifecycle Scenario", () => {
    it("should test incident lifecycle successfully", async () => {
      const mockCreateIncident = jest
        .fn()
        .mockResolvedValue("test-incident-key");
      const mockResolveIncident = jest.fn().mockResolvedValue(undefined);

      const scenarios: TestScenario[] = [
        {
          type: TestScenarioType.INCIDENT_LIFECYCLE,
          name: "Test Incident Lifecycle",
          description: "Test incident lifecycle scenario",
          severity: AlertSeverity.CRITICAL,
          expectedOutcome: "Incident should be created and resolved",
        },
      ];

      const report = await framework.runTestSuite(scenarios);

      expect(report.results[0].success).toBe(true);
      expect(report.results[0].details.incidentCreated).toBe(true);
      expect(report.results[0].details.incidentResolved).toBe(true);
      // Verify PagerDuty integration was instantiated
      expect(PagerDutyIntegration).toHaveBeenCalled();
    });

    it("should fail if PagerDuty not initialized", async () => {
      const config: TestSuiteConfig = {
        ...testConfig,
        pagerDutyConfig: { enabled: false },
      };

      const testFramework = new AlertTestingFramework(config);

      const scenarios: TestScenario[] = [
        {
          type: TestScenarioType.INCIDENT_LIFECYCLE,
          name: "Test Incident Lifecycle",
          description: "Test incident lifecycle scenario",
          severity: AlertSeverity.CRITICAL,
          expectedOutcome: "Incident should be created and resolved",
        },
      ];

      const report = await testFramework.runTestSuite(scenarios);

      expect(report.results[0].success).toBe(false);
      expect(report.results[0].errors).toContain(
        "PagerDuty integration not initialized"
      );
    });
  });

  describe("Escalation Policy Scenario", () => {
    it("should test escalation policy successfully", async () => {
      const mockCreateIncident = jest
        .fn()
        .mockResolvedValue("test-incident-key");
      const mockResolveIncident = jest.fn().mockResolvedValue(undefined);

      const scenarios: TestScenario[] = [
        {
          type: TestScenarioType.ESCALATION_POLICY,
          name: "Test Escalation Policy",
          description: "Test escalation policy scenario",
          severity: AlertSeverity.CRITICAL,
          expectedOutcome: "Escalation should be triggered",
        },
      ];

      const report = await framework.runTestSuite(scenarios);

      expect(report.results[0].success).toBe(true);
      expect(report.results[0].details.incidentCreated).toBe(true);
      expect(report.results[0].details.escalationTriggered).toBe(true);
    });
  });

  describe("Multi-Channel Scenario", () => {
    it("should test multi-channel notification successfully", async () => {
      const mockPublishAlert = jest.fn().mockResolvedValue(undefined);
      const mockCreateIncident = jest
        .fn()
        .mockResolvedValue("test-incident-key");
      const mockResolveIncident = jest.fn().mockResolvedValue(undefined);

      (SNSNotificationManager as jest.Mock).mockImplementation(() => ({
        publishAlert: mockPublishAlert,
      }));

      const scenarios: TestScenario[] = [
        {
          type: TestScenarioType.MULTI_CHANNEL,
          name: "Test Multi-Channel",
          description: "Test multi-channel notification scenario",
          severity: AlertSeverity.WARNING,
          expectedOutcome: "Notifications should be sent via multiple channels",
        },
      ];

      const report = await framework.runTestSuite(scenarios);

      expect(report.results[0].success).toBe(true);
      expect(report.results[0].details.notificationSent).toBe(true);
      expect(report.results[0].details.incidentCreated).toBe(true);
      // Verify both managers were instantiated
      expect(SNSNotificationManager).toHaveBeenCalled();
      expect(PagerDutyIntegration).toHaveBeenCalled();
    });

    it("should fail if SNS or PagerDuty not initialized", async () => {
      const config: TestSuiteConfig = {
        ...testConfig,
        snsConfig: { enabled: false },
      };

      const testFramework = new AlertTestingFramework(config);

      const scenarios: TestScenario[] = [
        {
          type: TestScenarioType.MULTI_CHANNEL,
          name: "Test Multi-Channel",
          description: "Test multi-channel notification scenario",
          severity: AlertSeverity.WARNING,
          expectedOutcome: "Notifications should be sent via multiple channels",
        },
      ];

      const report = await testFramework.runTestSuite(scenarios);

      expect(report.results[0].success).toBe(false);
      expect(report.results[0].errors).toContain(
        "SNS or PagerDuty not initialized"
      );
    });
  });

  describe("Test Report Generation", () => {
    it("should generate comprehensive test report", async () => {
      const scenarios: TestScenario[] = [
        {
          type: TestScenarioType.HIGH_FAILURE_RATE,
          name: "Test 1",
          description: "Test 1",
          severity: AlertSeverity.CRITICAL,
          expectedOutcome: "Success",
        },
        {
          type: TestScenarioType.HIGH_LATENCY,
          name: "Test 2",
          description: "Test 2",
          severity: AlertSeverity.WARNING,
          expectedOutcome: "Success",
        },
      ];

      const report = await framework.runTestSuite(scenarios);

      expect(report.suiteId).toMatch(/^test-suite-\d+$/);
      expect(report.environment).toBe("test");
      expect(report.totalTests).toBe(2);
      expect(report.passedTests).toBe(2);
      expect(report.failedTests).toBe(0);
      expect(report.summary.successRate).toBe(100);
      expect(report.summary.averageDuration).toBeGreaterThan(0);
      expect(report.summary.criticalFailures).toBe(0);
      expect(report.summary.warnings).toBe(0);
    });

    it("should calculate correct success rate with failures", async () => {
      // Setup mock that succeeds once then fails
      const localMockCreateAlarm = jest
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error("Test error"));

      (CloudWatchAlarmManager as jest.Mock).mockImplementation(() => ({
        createAlarm: localMockCreateAlarm,
        deleteAlarm: jest.fn().mockResolvedValue(undefined),
      }));

      // Recreate framework with new mock
      const localFramework = new AlertTestingFramework(testConfig);

      const scenarios: TestScenario[] = [
        {
          type: TestScenarioType.HIGH_FAILURE_RATE,
          name: "Test 1",
          description: "Test 1",
          severity: AlertSeverity.CRITICAL,
          expectedOutcome: "Success",
        },
        {
          type: TestScenarioType.HIGH_LATENCY,
          name: "Test 2",
          description: "Test 2",
          severity: AlertSeverity.WARNING,
          expectedOutcome: "Failure",
        },
      ];

      const report = await localFramework.runTestSuite(scenarios);

      expect(report.totalTests).toBe(2);
      expect(report.passedTests).toBe(1);
      expect(report.failedTests).toBe(1);
      expect(report.summary.successRate).toBe(50);
      expect(report.summary.criticalFailures).toBe(1);
    });
  });

  describe("Result Management", () => {
    it("should get test results", async () => {
      const scenarios: TestScenario[] = [
        {
          type: TestScenarioType.HIGH_FAILURE_RATE,
          name: "Test 1",
          description: "Test 1",
          severity: AlertSeverity.CRITICAL,
          expectedOutcome: "Success",
        },
      ];

      await framework.runTestSuite(scenarios);
      const results = framework.getResults();

      expect(results).toHaveLength(1);
      expect(results[0].scenarioName).toBe("Test 1");
    });

    it("should clear test results", async () => {
      const scenarios: TestScenario[] = [
        {
          type: TestScenarioType.HIGH_FAILURE_RATE,
          name: "Test 1",
          description: "Test 1",
          severity: AlertSeverity.CRITICAL,
          expectedOutcome: "Success",
        },
      ];

      await framework.runTestSuite(scenarios);
      framework.clearResults();
      const results = framework.getResults();

      expect(results).toHaveLength(0);
    });
  });
});
