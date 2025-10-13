/**
 * CloudWatch Alarm Manager for Hybrid Routing Efficiency
 *
 * Manages CloudWatch alarms for monitoring hybrid routing performance metrics.
 * Supports multiple alarm types with environment-specific thresholds.
 *
 * @module CloudWatchAlarmManager
 */

import {
  CloudWatchClient,
  ComparisonOperator,
  DeleteAlarmsCommand,
  DescribeAlarmsCommand,
  PutMetricAlarmCommand,
  StandardUnit,
  Statistic,
} from "@aws-sdk/client-cloudwatch";

/**
 * Alarm configuration interface
 */
export interface AlarmConfig {
  alarmName: string;
  metricName: string;
  namespace: string;
  threshold: number;
  comparisonOperator: ComparisonOperator;
  evaluationPeriods: number;
  period: number;
  statistic: Statistic;
  description?: string;
  actionsEnabled?: boolean;
  alarmActions?: string[];
  okActions?: string[];
  insufficientDataActions?: string[];
  dimensions?: Array<{ Name: string; Value: string }>;
  unit?: StandardUnit;
  treatMissingData?: "breaching" | "notBreaching" | "ignore" | "missing";
}

/**
 * Environment-specific alarm thresholds
 */
export interface EnvironmentThresholds {
  failureRateThreshold: number; // Success rate below this triggers alarm
  latencyThreshold: number; // Average latency above this triggers alarm (ms)
  costThreshold: number; // Cost above this triggers alarm (€)
  operationCountThreshold: number; // Operations below this triggers alarm
}

/**
 * Alarm type enumeration
 */
export enum AlarmType {
  HIGH_FAILURE_RATE = "high-failure-rate",
  HIGH_LATENCY = "high-latency",
  COST_THRESHOLD = "cost-threshold",
  LOW_OPERATION_COUNT = "low-operation-count",
}

/**
 * CloudWatch Alarm Manager
 *
 * Manages creation, update, and deletion of CloudWatch alarms
 * for hybrid routing efficiency monitoring.
 */
export class CloudWatchAlarmManager {
  private client: CloudWatchClient;
  private namespace: string;
  private environment: string;
  private thresholds: EnvironmentThresholds;

  constructor(
    region: string = "eu-central-1",
    environment: string = "production",
    customThresholds?: Partial<EnvironmentThresholds>
  ) {
    this.client = new CloudWatchClient({ region });
    this.namespace = "MatbakhApp/HybridRouting/SupportMode";
    this.environment = environment;
    this.thresholds = this.getEnvironmentThresholds(
      environment,
      customThresholds
    );
  }

  /**
   * Get environment-specific thresholds
   */
  private getEnvironmentThresholds(
    environment: string,
    customThresholds?: Partial<EnvironmentThresholds>
  ): EnvironmentThresholds {
    const defaults: Record<string, EnvironmentThresholds> = {
      development: {
        failureRateThreshold: 90, // 10% failure rate
        latencyThreshold: 3000, // 3 seconds
        costThreshold: 1.0, // €1
        operationCountThreshold: 5,
      },
      staging: {
        failureRateThreshold: 92, // 8% failure rate
        latencyThreshold: 2500, // 2.5 seconds
        costThreshold: 0.9, // €0.90
        operationCountThreshold: 8,
      },
      production: {
        failureRateThreshold: 95, // 5% failure rate
        latencyThreshold: 2000, // 2 seconds
        costThreshold: 0.8, // €0.80 (80% of budget)
        operationCountThreshold: 10,
      },
    };

    const baseThresholds = defaults[environment] || defaults.production;
    return { ...baseThresholds, ...customThresholds };
  }

  /**
   * Create high failure rate alarm
   *
   * Triggers when success rate falls below threshold for 5 minutes
   */
  async createHighFailureRateAlarm(
    snsTopicArn: string,
    dimensions?: Array<{ Name: string; Value: string }>
  ): Promise<void> {
    const config: AlarmConfig = {
      alarmName: `${this.environment}-hybrid-routing-high-failure-rate`,
      metricName: "SupportModeSuccessRate",
      namespace: this.namespace,
      threshold: this.thresholds.failureRateThreshold,
      comparisonOperator: ComparisonOperator.LessThanThreshold,
      evaluationPeriods: 1,
      period: 300, // 5 minutes
      statistic: Statistic.Average,
      description: `High failure rate detected in ${this.environment} - Success rate below ${this.thresholds.failureRateThreshold}%`,
      actionsEnabled: true,
      alarmActions: [snsTopicArn],
      dimensions,
      unit: StandardUnit.Percent,
      treatMissingData: "notBreaching",
    };

    await this.createAlarm(config);
  }

  /**
   * Create high latency alarm
   *
   * Triggers when average latency exceeds threshold for 5 minutes
   */
  async createHighLatencyAlarm(
    snsTopicArn: string,
    dimensions?: Array<{ Name: string; Value: string }>
  ): Promise<void> {
    const config: AlarmConfig = {
      alarmName: `${this.environment}-hybrid-routing-high-latency`,
      metricName: "SupportModeAverageLatency",
      namespace: this.namespace,
      threshold: this.thresholds.latencyThreshold,
      comparisonOperator: ComparisonOperator.GreaterThanThreshold,
      evaluationPeriods: 1,
      period: 300, // 5 minutes
      statistic: Statistic.Average,
      description: `High latency detected in ${this.environment} - Average latency above ${this.thresholds.latencyThreshold}ms`,
      actionsEnabled: true,
      alarmActions: [snsTopicArn],
      dimensions,
      unit: StandardUnit.Milliseconds,
      treatMissingData: "notBreaching",
    };

    await this.createAlarm(config);
  }

  /**
   * Create cost threshold alarm
   *
   * Triggers when total cost exceeds threshold in 1 hour
   */
  async createCostThresholdAlarm(
    snsTopicArn: string,
    dimensions?: Array<{ Name: string; Value: string }>
  ): Promise<void> {
    const config: AlarmConfig = {
      alarmName: `${this.environment}-hybrid-routing-cost-threshold`,
      metricName: "SupportModeTotalCost",
      namespace: this.namespace,
      threshold: this.thresholds.costThreshold,
      comparisonOperator: ComparisonOperator.GreaterThanThreshold,
      evaluationPeriods: 1,
      period: 3600, // 1 hour
      statistic: Statistic.Sum,
      description: `Cost threshold exceeded in ${this.environment} - Total cost above €${this.thresholds.costThreshold}`,
      actionsEnabled: true,
      alarmActions: [snsTopicArn],
      dimensions,
      unit: StandardUnit.None,
      treatMissingData: "notBreaching",
    };

    await this.createAlarm(config);
  }

  /**
   * Create low operation count alarm
   *
   * Triggers when operation count falls below threshold in 1 hour
   */
  async createLowOperationCountAlarm(
    snsTopicArn: string,
    dimensions?: Array<{ Name: string; Value: string }>
  ): Promise<void> {
    const config: AlarmConfig = {
      alarmName: `${this.environment}-hybrid-routing-low-operation-count`,
      metricName: "SupportModeOperationCount",
      namespace: this.namespace,
      threshold: this.thresholds.operationCountThreshold,
      comparisonOperator: ComparisonOperator.LessThanThreshold,
      evaluationPeriods: 1,
      period: 3600, // 1 hour
      statistic: Statistic.Sum,
      description: `Low operation count detected in ${this.environment} - Operations below ${this.thresholds.operationCountThreshold} per hour`,
      actionsEnabled: true,
      alarmActions: [snsTopicArn],
      dimensions,
      unit: StandardUnit.Count,
      treatMissingData: "breaching",
    };

    await this.createAlarm(config);
  }

  /**
   * Create all alarms for hybrid routing efficiency
   */
  async createAllAlarms(
    snsTopicArn: string,
    dimensions?: Array<{ Name: string; Value: string }>
  ): Promise<void> {
    await Promise.all([
      this.createHighFailureRateAlarm(snsTopicArn, dimensions),
      this.createHighLatencyAlarm(snsTopicArn, dimensions),
      this.createCostThresholdAlarm(snsTopicArn, dimensions),
      this.createLowOperationCountAlarm(snsTopicArn, dimensions),
    ]);
  }

  /**
   * Create a CloudWatch alarm
   */
  private async createAlarm(config: AlarmConfig): Promise<void> {
    const command = new PutMetricAlarmCommand({
      AlarmName: config.alarmName,
      MetricName: config.metricName,
      Namespace: config.namespace,
      Threshold: config.threshold,
      ComparisonOperator: config.comparisonOperator,
      EvaluationPeriods: config.evaluationPeriods,
      Period: config.period,
      Statistic: config.statistic,
      AlarmDescription: config.description,
      ActionsEnabled: config.actionsEnabled ?? true,
      AlarmActions: config.alarmActions,
      OKActions: config.okActions,
      InsufficientDataActions: config.insufficientDataActions,
      Dimensions: config.dimensions,
      Unit: config.unit,
      TreatMissingData: config.treatMissingData ?? "notBreaching",
    });

    await this.client.send(command);
  }

  /**
   * Delete an alarm by name
   */
  async deleteAlarm(alarmName: string): Promise<void> {
    const command = new DeleteAlarmsCommand({
      AlarmNames: [alarmName],
    });

    await this.client.send(command);
  }

  /**
   * Delete all alarms for this environment
   */
  async deleteAllAlarms(): Promise<void> {
    const alarmNames = [
      `${this.environment}-hybrid-routing-high-failure-rate`,
      `${this.environment}-hybrid-routing-high-latency`,
      `${this.environment}-hybrid-routing-cost-threshold`,
      `${this.environment}-hybrid-routing-low-operation-count`,
    ];

    const command = new DeleteAlarmsCommand({
      AlarmNames: alarmNames,
    });

    await this.client.send(command);
  }

  /**
   * Get alarm status
   */
  async getAlarmStatus(alarmName: string): Promise<any> {
    const command = new DescribeAlarmsCommand({
      AlarmNames: [alarmName],
    });

    const response = await this.client.send(command);
    return response.MetricAlarms?.[0];
  }

  /**
   * Get all alarm statuses for this environment
   */
  async getAllAlarmStatuses(): Promise<any[]> {
    const alarmNames = [
      `${this.environment}-hybrid-routing-high-failure-rate`,
      `${this.environment}-hybrid-routing-high-latency`,
      `${this.environment}-hybrid-routing-cost-threshold`,
      `${this.environment}-hybrid-routing-low-operation-count`,
    ];

    const command = new DescribeAlarmsCommand({
      AlarmNames: alarmNames,
    });

    const response = await this.client.send(command);
    return response.MetricAlarms || [];
  }

  /**
   * Update alarm thresholds
   */
  updateThresholds(newThresholds: Partial<EnvironmentThresholds>): void {
    this.thresholds = { ...this.thresholds, ...newThresholds };
  }

  /**
   * Get current thresholds
   */
  getThresholds(): EnvironmentThresholds {
    return { ...this.thresholds };
  }
}
