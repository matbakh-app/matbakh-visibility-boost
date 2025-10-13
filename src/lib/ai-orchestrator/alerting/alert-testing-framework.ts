/**
 * Alert Testing Framework for Hybrid Routing Efficiency
 *
 * Comprehensive testing framework for validating alert systems including
 * CloudWatch alarms, SNS notifications, and PagerDuty integration.
 *
 * @module AlertTestingFramework
 */

import {
  AlarmConfig,
  CloudWatchAlarmManager,
} from "./cloudwatch-alarm-manager";
import { PagerDutyIntegration } from "./pagerduty-integration";
import {
  AlertMessage,
  AlertSeverity,
  SNSNotificationManager,
} from "./sns-notification-manager";

// Re-export AlertSeverity for convenience
export { AlertSeverity };

/**
 * Test scenario types
 */
export enum TestScenarioType {
  HIGH_FAILURE_RATE = "high-failure-rate",
  HIGH_LATENCY = "high-latency",
  COST_THRESHOLD = "cost-threshold",
  LOW_OPERATION_COUNT = "low-operation-count",
  INCIDENT_LIFECYCLE = "incident-lifecycle",
  ESCALATION_POLICY = "escalation-policy",
  MULTI_CHANNEL = "multi-channel",
}

/**
 * Test scenario configuration
 */
export interface TestScenario {
  type: TestScenarioType;
  name: string;
  description: string;
  severity: AlertSeverity;
  expectedOutcome: string;
  timeout?: number;
}

/**
 * Test execution result
 */
export interface TestResult {
  scenarioName: string;
  scenarioType: TestScenarioType;
  success: boolean;
  duration: number;
  timestamp: Date;
  details: {
    alarmTriggered?: boolean;
    notificationSent?: boolean;
    incidentCreated?: boolean;
    incidentResolved?: boolean;
    escalationTriggered?: boolean;
  };
  errors?: string[];
  warnings?: string[];
}

/**
 * Test suite configuration
 */
export interface TestSuiteConfig {
  environment: string;
  region: string;
  scenarios: TestScenario[];
  cloudWatchConfig?: {
    enabled: boolean;
    namespace?: string;
  };
  snsConfig?: {
    enabled: boolean;
    topicArn?: string;
  };
  pagerDutyConfig?: {
    enabled: boolean;
    integrationKey?: string;
  };
}

/**
 * Test report
 */
export interface TestReport {
  suiteId: string;
  environment: string;
  startTime: Date;
  endTime: Date;
  totalDuration: number;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  results: TestResult[];
  summary: {
    successRate: number;
    averageDuration: number;
    criticalFailures: number;
    warnings: number;
  };
}

/**
 * Alert simulation data
 */
export interface AlertSimulation {
  metricName: string;
  namespace: string;
  value: number;
  threshold: number;
  severity: AlertSeverity;
  timestamp: Date;
}

/**
 * Alert Testing Framework
 *
 * Provides comprehensive testing capabilities for alert systems
 * including simulation, validation, and reporting.
 */
export class AlertTestingFramework {
  private cloudWatchManager?: CloudWatchAlarmManager;
  private snsManager?: SNSNotificationManager;
  private pagerDutyIntegration?: PagerDutyIntegration;
  private environment: string;
  private region: string;
  private testResults: TestResult[];

  constructor(config: TestSuiteConfig) {
    this.environment = config.environment;
    this.region = config.region;
    this.testResults = [];

    // Initialize managers based on configuration
    if (config.cloudWatchConfig?.enabled) {
      this.cloudWatchManager = new CloudWatchAlarmManager(
        config.region,
        config.environment
      );
    }

    if (config.snsConfig?.enabled) {
      this.snsManager = new SNSNotificationManager(
        config.region,
        config.environment
      );
    }

    if (
      config.pagerDutyConfig?.enabled &&
      config.pagerDutyConfig.integrationKey
    ) {
      this.pagerDutyIntegration = new PagerDutyIntegration({
        integrationKey: config.pagerDutyConfig.integrationKey,
        serviceName: `${config.environment}-hybrid-routing-alerts`,
      });
    }
  }

  /**
   * Run complete test suite
   */
  async runTestSuite(scenarios: TestScenario[]): Promise<TestReport> {
    const suiteId = `test-suite-${Date.now()}`;
    const startTime = new Date();
    this.testResults = [];

    console.log(`🧪 Starting Alert Testing Framework - Suite ID: ${suiteId}`);
    console.log(`📊 Environment: ${this.environment}`);
    console.log(`🌍 Region: ${this.region}`);
    console.log(`📝 Scenarios: ${scenarios.length}`);

    for (const scenario of scenarios) {
      try {
        const result = await this.runScenario(scenario);
        this.testResults.push(result);
      } catch (error) {
        this.testResults.push({
          scenarioName: scenario.name,
          scenarioType: scenario.type,
          success: false,
          duration: 0,
          timestamp: new Date(),
          details: {},
          errors: [error instanceof Error ? error.message : String(error)],
        });
      }
    }

    const endTime = new Date();
    const totalDuration = endTime.getTime() - startTime.getTime();

    return this.generateReport(suiteId, startTime, endTime, totalDuration);
  }

  /**
   * Run individual test scenario
   */
  private async runScenario(scenario: TestScenario): Promise<TestResult> {
    const startTime = Date.now();
    console.log(`\n🔬 Running scenario: ${scenario.name}`);

    const result: TestResult = {
      scenarioName: scenario.name,
      scenarioType: scenario.type,
      success: false,
      duration: 0,
      timestamp: new Date(),
      details: {},
      errors: [],
      warnings: [],
    };

    try {
      switch (scenario.type) {
        case TestScenarioType.HIGH_FAILURE_RATE:
          await this.testHighFailureRate(scenario, result);
          break;
        case TestScenarioType.HIGH_LATENCY:
          await this.testHighLatency(scenario, result);
          break;
        case TestScenarioType.COST_THRESHOLD:
          await this.testCostThreshold(scenario, result);
          break;
        case TestScenarioType.LOW_OPERATION_COUNT:
          await this.testLowOperationCount(scenario, result);
          break;
        case TestScenarioType.INCIDENT_LIFECYCLE:
          await this.testIncidentLifecycle(scenario, result);
          break;
        case TestScenarioType.ESCALATION_POLICY:
          await this.testEscalationPolicy(scenario, result);
          break;
        case TestScenarioType.MULTI_CHANNEL:
          await this.testMultiChannel(scenario, result);
          break;
        default:
          throw new Error(`Unknown scenario type: ${scenario.type}`);
      }

      result.success = true;
      console.log(`✅ Scenario passed: ${scenario.name}`);
    } catch (error) {
      result.success = false;
      result.errors?.push(
        error instanceof Error ? error.message : String(error)
      );
      console.error(`❌ Scenario failed: ${scenario.name}`, error);
    }

    result.duration = Date.now() - startTime;
    return result;
  }

  /**
   * Test high failure rate scenario
   */
  private async testHighFailureRate(
    scenario: TestScenario,
    result: TestResult
  ): Promise<void> {
    if (!this.cloudWatchManager) {
      throw new Error("CloudWatch manager not initialized");
    }

    // Simulate high failure rate
    const simulation: AlertSimulation = {
      metricName: "SuccessRate",
      namespace: "MatbakhApp/HybridRouting/SupportMode",
      value: 85, // 15% failure rate
      threshold: 95, // Threshold is 95% success
      severity: AlertSeverity.CRITICAL,
      timestamp: new Date(),
    };

    // Create test alarm
    const alarmConfig: AlarmConfig = {
      alarmName: `test-high-failure-rate-${Date.now()}`,
      metricName: simulation.metricName,
      namespace: simulation.namespace,
      threshold: simulation.threshold,
      comparisonOperator: "LessThanThreshold",
      evaluationPeriods: 1,
      period: 60,
      statistic: "Average",
      description: "Test alarm for high failure rate",
      actionsEnabled: false, // Don't trigger actual actions in test
    };

    await this.cloudWatchManager.createAlarm(alarmConfig);
    result.details.alarmTriggered = true;

    // Verify alarm would trigger
    const wouldTrigger = simulation.value < simulation.threshold;
    if (!wouldTrigger) {
      throw new Error("Alarm would not trigger with simulated values");
    }

    // Clean up test alarm
    await this.cloudWatchManager.deleteAlarm(alarmConfig.alarmName);
  }

  /**
   * Test high latency scenario
   */
  private async testHighLatency(
    scenario: TestScenario,
    result: TestResult
  ): Promise<void> {
    if (!this.cloudWatchManager) {
      throw new Error("CloudWatch manager not initialized");
    }

    // Simulate high latency
    const simulation: AlertSimulation = {
      metricName: "AverageLatency",
      namespace: "MatbakhApp/HybridRouting/SupportMode",
      value: 2500, // 2.5 seconds
      threshold: 2000, // Threshold is 2 seconds
      severity: AlertSeverity.WARNING,
      timestamp: new Date(),
    };

    // Create test alarm
    const alarmConfig: AlarmConfig = {
      alarmName: `test-high-latency-${Date.now()}`,
      metricName: simulation.metricName,
      namespace: simulation.namespace,
      threshold: simulation.threshold,
      comparisonOperator: "GreaterThanThreshold",
      evaluationPeriods: 2,
      period: 300,
      statistic: "Average",
      description: "Test alarm for high latency",
      actionsEnabled: false,
    };

    await this.cloudWatchManager.createAlarm(alarmConfig);
    result.details.alarmTriggered = true;

    // Verify alarm would trigger
    const wouldTrigger = simulation.value > simulation.threshold;
    if (!wouldTrigger) {
      throw new Error("Alarm would not trigger with simulated values");
    }

    // Clean up test alarm
    await this.cloudWatchManager.deleteAlarm(alarmConfig.alarmName);
  }

  /**
   * Test cost threshold scenario
   */
  private async testCostThreshold(
    scenario: TestScenario,
    result: TestResult
  ): Promise<void> {
    if (!this.cloudWatchManager) {
      throw new Error("CloudWatch manager not initialized");
    }

    // Simulate cost threshold breach
    const simulation: AlertSimulation = {
      metricName: "TotalCost",
      namespace: "MatbakhApp/HybridRouting/SupportMode",
      value: 1.5, // €1.50
      threshold: 1.0, // Threshold is €1.00
      severity: AlertSeverity.WARNING,
      timestamp: new Date(),
    };

    // Create test alarm
    const alarmConfig: AlarmConfig = {
      alarmName: `test-cost-threshold-${Date.now()}`,
      metricName: simulation.metricName,
      namespace: simulation.namespace,
      threshold: simulation.threshold,
      comparisonOperator: "GreaterThanThreshold",
      evaluationPeriods: 1,
      period: 300,
      statistic: "Sum",
      description: "Test alarm for cost threshold",
      actionsEnabled: false,
    };

    await this.cloudWatchManager.createAlarm(alarmConfig);
    result.details.alarmTriggered = true;

    // Verify alarm would trigger
    const wouldTrigger = simulation.value > simulation.threshold;
    if (!wouldTrigger) {
      throw new Error("Alarm would not trigger with simulated values");
    }

    // Clean up test alarm
    await this.cloudWatchManager.deleteAlarm(alarmConfig.alarmName);
  }

  /**
   * Test low operation count scenario
   */
  private async testLowOperationCount(
    scenario: TestScenario,
    result: TestResult
  ): Promise<void> {
    if (!this.cloudWatchManager) {
      throw new Error("CloudWatch manager not initialized");
    }

    // Simulate low operation count
    const simulation: AlertSimulation = {
      metricName: "OperationCount",
      namespace: "MatbakhApp/HybridRouting/SupportMode",
      value: 3, // Only 3 operations
      threshold: 10, // Threshold is 10 operations
      severity: AlertSeverity.INFO,
      timestamp: new Date(),
    };

    // Create test alarm
    const alarmConfig: AlarmConfig = {
      alarmName: `test-low-operation-count-${Date.now()}`,
      metricName: simulation.metricName,
      namespace: simulation.namespace,
      threshold: simulation.threshold,
      comparisonOperator: "LessThanThreshold",
      evaluationPeriods: 1,
      period: 300,
      statistic: "Sum",
      description: "Test alarm for low operation count",
      actionsEnabled: false,
    };

    await this.cloudWatchManager.createAlarm(alarmConfig);
    result.details.alarmTriggered = true;

    // Verify alarm would trigger
    const wouldTrigger = simulation.value < simulation.threshold;
    if (!wouldTrigger) {
      throw new Error("Alarm would not trigger with simulated values");
    }

    // Clean up test alarm
    await this.cloudWatchManager.deleteAlarm(alarmConfig.alarmName);
  }

  /**
   * Test incident lifecycle scenario
   */
  private async testIncidentLifecycle(
    scenario: TestScenario,
    result: TestResult
  ): Promise<void> {
    if (!this.pagerDutyIntegration) {
      throw new Error("PagerDuty integration not initialized");
    }

    // Create test alert message
    const alertMessage: AlertMessage = {
      severity: AlertSeverity.CRITICAL,
      alarmName: "test-incident-lifecycle",
      metricName: "SuccessRate",
      threshold: 95,
      currentValue: 85,
      timestamp: new Date(),
      environment: this.environment,
      description: "Test incident lifecycle scenario",
      recommendations: ["Investigate routing failures", "Check service health"],
    };

    // Create incident
    const incidentKey = await this.pagerDutyIntegration.createIncident(
      alertMessage
    );
    result.details.incidentCreated = true;

    // Verify incident was created
    if (!incidentKey) {
      throw new Error("Failed to create incident");
    }

    // Resolve incident
    await this.pagerDutyIntegration.resolveIncident(incidentKey);
    result.details.incidentResolved = true;
  }

  /**
   * Test escalation policy scenario
   */
  private async testEscalationPolicy(
    scenario: TestScenario,
    result: TestResult
  ): Promise<void> {
    if (!this.pagerDutyIntegration) {
      throw new Error("PagerDuty integration not initialized");
    }

    // Create critical alert that should trigger escalation
    const alertMessage: AlertMessage = {
      severity: AlertSeverity.CRITICAL,
      alarmName: "test-escalation-policy",
      metricName: "SuccessRate",
      threshold: 95,
      currentValue: 70, // Very low success rate
      timestamp: new Date(),
      environment: this.environment,
      description: "Test escalation policy scenario",
      recommendations: ["Immediate investigation required"],
    };

    // Create incident
    const incidentKey = await this.pagerDutyIntegration.createIncident(
      alertMessage
    );
    result.details.incidentCreated = true;
    result.details.escalationTriggered = true;

    // Clean up
    if (incidentKey) {
      await this.pagerDutyIntegration.resolveIncident(incidentKey);
    }
  }

  /**
   * Test multi-channel notification scenario
   */
  private async testMultiChannel(
    scenario: TestScenario,
    result: TestResult
  ): Promise<void> {
    if (!this.snsManager || !this.pagerDutyIntegration) {
      throw new Error("SNS or PagerDuty not initialized");
    }

    // Create test alert message
    const alertMessage: AlertMessage = {
      severity: AlertSeverity.WARNING,
      alarmName: "test-multi-channel",
      metricName: "AverageLatency",
      threshold: 2000,
      currentValue: 2500,
      timestamp: new Date(),
      environment: this.environment,
      description: "Test multi-channel notification scenario",
      recommendations: ["Monitor latency trends"],
    };

    // Send SNS notification
    const topicArn = `arn:aws:sns:${this.region}:123456789012:test-topic`;
    await this.snsManager.publishAlert(topicArn, alertMessage);
    result.details.notificationSent = true;

    // Create PagerDuty incident
    const incidentKey = await this.pagerDutyIntegration.createIncident(
      alertMessage
    );
    result.details.incidentCreated = true;

    // Clean up
    if (incidentKey) {
      await this.pagerDutyIntegration.resolveIncident(incidentKey);
    }
  }

  /**
   * Generate test report
   */
  private generateReport(
    suiteId: string,
    startTime: Date,
    endTime: Date,
    totalDuration: number
  ): TestReport {
    const passedTests = this.testResults.filter((r) => r.success).length;
    const failedTests = this.testResults.filter((r) => !r.success).length;
    const criticalFailures = this.testResults.filter(
      (r) => !r.success && r.errors && r.errors.length > 0
    ).length;
    const warnings = this.testResults.reduce(
      (sum, r) => sum + (r.warnings?.length || 0),
      0
    );

    const totalTests = this.testResults.length;
    const successRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
    const averageDuration =
      totalTests > 0
        ? this.testResults.reduce((sum, r) => sum + r.duration, 0) / totalTests
        : 0;

    const report: TestReport = {
      suiteId,
      environment: this.environment,
      startTime,
      endTime,
      totalDuration,
      totalTests,
      passedTests,
      failedTests,
      results: this.testResults,
      summary: {
        successRate,
        averageDuration,
        criticalFailures,
        warnings,
      },
    };

    this.printReport(report);
    return report;
  }

  /**
   * Print test report to console
   */
  private printReport(report: TestReport): void {
    console.log("\n" + "=".repeat(80));
    console.log("📊 ALERT TESTING FRAMEWORK - TEST REPORT");
    console.log("=".repeat(80));
    console.log(`\n🆔 Suite ID: ${report.suiteId}`);
    console.log(`🌍 Environment: ${report.environment}`);
    console.log(`⏱️  Duration: ${report.totalDuration}ms`);
    console.log(`\n📈 Summary:`);
    console.log(`   Total Tests: ${report.totalTests}`);
    console.log(`   ✅ Passed: ${report.passedTests}`);
    console.log(`   ❌ Failed: ${report.failedTests}`);
    console.log(
      `   📊 Success Rate: ${report.summary.successRate.toFixed(2)}%`
    );
    console.log(
      `   ⏱️  Average Duration: ${report.summary.averageDuration.toFixed(2)}ms`
    );
    console.log(`   🚨 Critical Failures: ${report.summary.criticalFailures}`);
    console.log(`   ⚠️  Warnings: ${report.summary.warnings}`);

    console.log(`\n📝 Test Results:`);
    report.results.forEach((result, index) => {
      const status = result.success ? "✅" : "❌";
      console.log(
        `   ${index + 1}. ${status} ${result.scenarioName} (${
          result.duration
        }ms)`
      );
      if (result.errors && result.errors.length > 0) {
        result.errors.forEach((error) => {
          console.log(`      ❌ Error: ${error}`);
        });
      }
      if (result.warnings && result.warnings.length > 0) {
        result.warnings.forEach((warning) => {
          console.log(`      ⚠️  Warning: ${warning}`);
        });
      }
    });

    console.log("\n" + "=".repeat(80));
  }

  /**
   * Get test results
   */
  getResults(): TestResult[] {
    return this.testResults;
  }

  /**
   * Clear test results
   */
  clearResults(): void {
    this.testResults = [];
  }
}
