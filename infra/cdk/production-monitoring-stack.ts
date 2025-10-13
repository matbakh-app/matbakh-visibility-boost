import * as cdk from "aws-cdk-lib";
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as sns from "aws-cdk-lib/aws-sns";
import * as snsSubscriptions from "aws-cdk-lib/aws-sns-subscriptions";
import { Construct } from "constructs";

/**
 * Production Monitoring Stack for Bedrock Activation Hybrid Routing
 *
 * This stack creates comprehensive monitoring and alerting infrastructure
 * for the production deployment of the hybrid routing system.
 */
export class ProductionMonitoringStack extends cdk.Stack {
  public readonly dashboards: cloudwatch.Dashboard[];
  public readonly alarms: cloudwatch.Alarm[];
  public readonly snsTopics: sns.Topic[];

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create SNS topics for different alert levels
    const criticalAlerts = this.createSNSTopic(
      "CriticalAlerts",
      "Critical production alerts requiring immediate response"
    );
    const warningAlerts = this.createSNSTopic(
      "WarningAlerts",
      "Warning alerts requiring attention within 15 minutes"
    );
    const infoAlerts = this.createSNSTopic(
      "InfoAlerts",
      "Informational alerts for monitoring and optimization"
    );

    this.snsTopics = [criticalAlerts, warningAlerts, infoAlerts];

    // Create CloudWatch dashboards
    this.dashboards = [
      this.createHybridRoutingDashboard(),
      this.createPerformanceDashboard(),
      this.createSecurityDashboard(),
      this.createCostDashboard(),
    ];

    // Create CloudWatch alarms
    this.alarms = [
      ...this.createPerformanceAlarms(criticalAlerts, warningAlerts),
      ...this.createSecurityAlarms(criticalAlerts),
      ...this.createCostAlarms(warningAlerts, infoAlerts),
      ...this.createAvailabilityAlarms(criticalAlerts),
    ];

    // Create Lambda function for custom metrics processing
    this.createMetricsProcessor();

    // Output important ARNs
    new cdk.CfnOutput(this, "CriticalAlertsTopicArn", {
      value: criticalAlerts.topicArn,
      description: "SNS Topic ARN for critical alerts",
    });

    new cdk.CfnOutput(this, "HybridRoutingDashboardUrl", {
      value: `https://console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${this.dashboards[0].dashboardName}`,
      description: "URL to the Hybrid Routing Dashboard",
    });
  }

  private createSNSTopic(name: string, description: string): sns.Topic {
    const topic = new sns.Topic(this, name, {
      displayName: `Bedrock Hybrid Routing - ${name}`,
      topicName: `bedrock-hybrid-routing-${name.toLowerCase()}`,
    });

    // Add email subscription (replace with actual email)
    topic.addSubscription(
      new snsSubscriptions.EmailSubscription("ops-team@matbakh.app")
    );

    // Add SMS subscription for critical alerts
    if (name === "CriticalAlerts") {
      // topic.addSubscription(new snsSubscriptions.SmsSubscription('+1234567890'));
    }

    return topic;
  }

  private createHybridRoutingDashboard(): cloudwatch.Dashboard {
    const dashboard = new cloudwatch.Dashboard(this, "HybridRoutingDashboard", {
      dashboardName: "BedrockHybridRouting-Production",
      defaultInterval: cdk.Duration.minutes(5),
    });

    // System Overview Widget
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: "Hybrid Routing Overview",
        width: 24,
        height: 6,
        left: [
          new cloudwatch.Metric({
            namespace: "BedrockHybridRouting",
            metricName: "RoutingDecisions",
            dimensionsMap: { Environment: "production" },
            statistic: "Sum",
          }),
          new cloudwatch.Metric({
            namespace: "BedrockHybridRouting",
            metricName: "DirectBedrockRequests",
            dimensionsMap: { Environment: "production" },
            statistic: "Sum",
          }),
          new cloudwatch.Metric({
            namespace: "BedrockHybridRouting",
            metricName: "MCPRequests",
            dimensionsMap: { Environment: "production" },
            statistic: "Sum",
          }),
        ],
      })
    );

    // Performance Metrics Widget
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: "Performance Metrics",
        width: 12,
        height: 6,
        left: [
          new cloudwatch.Metric({
            namespace: "BedrockHybridRouting",
            metricName: "EmergencyOperationLatency",
            dimensionsMap: { Environment: "production" },
            statistic: "Average",
          }),
          new cloudwatch.Metric({
            namespace: "BedrockHybridRouting",
            metricName: "CriticalOperationLatency",
            dimensionsMap: { Environment: "production" },
            statistic: "Average",
          }),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: "Error Rates",
        width: 12,
        height: 6,
        left: [
          new cloudwatch.Metric({
            namespace: "BedrockHybridRouting",
            metricName: "ErrorRate",
            dimensionsMap: {
              Environment: "production",
              Route: "DirectBedrock",
            },
            statistic: "Average",
          }),
          new cloudwatch.Metric({
            namespace: "BedrockHybridRouting",
            metricName: "ErrorRate",
            dimensionsMap: { Environment: "production", Route: "MCP" },
            statistic: "Average",
          }),
        ],
      })
    );

    // Routing Efficiency Widget
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: "Routing Efficiency",
        width: 24,
        height: 6,
        left: [
          new cloudwatch.Metric({
            namespace: "BedrockHybridRouting",
            metricName: "RoutingEfficiency",
            dimensionsMap: { Environment: "production" },
            statistic: "Average",
          }),
          new cloudwatch.Metric({
            namespace: "BedrockHybridRouting",
            metricName: "FallbackRate",
            dimensionsMap: { Environment: "production" },
            statistic: "Average",
          }),
        ],
      })
    );

    return dashboard;
  }

  private createPerformanceDashboard(): cloudwatch.Dashboard {
    const dashboard = new cloudwatch.Dashboard(this, "PerformanceDashboard", {
      dashboardName: "BedrockHybridRouting-Performance",
      defaultInterval: cdk.Duration.minutes(1),
    });

    // P95 Latency Tracking
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: "P95 Latency by Operation Type",
        width: 24,
        height: 8,
        left: [
          new cloudwatch.Metric({
            namespace: "BedrockHybridRouting",
            metricName: "OperationLatency",
            dimensionsMap: {
              Environment: "production",
              OperationType: "Emergency",
            },
            statistic: "p95",
          }),
          new cloudwatch.Metric({
            namespace: "BedrockHybridRouting",
            metricName: "OperationLatency",
            dimensionsMap: {
              Environment: "production",
              OperationType: "Critical",
            },
            statistic: "p95",
          }),
          new cloudwatch.Metric({
            namespace: "BedrockHybridRouting",
            metricName: "OperationLatency",
            dimensionsMap: {
              Environment: "production",
              OperationType: "Standard",
            },
            statistic: "p95",
          }),
        ],
      })
    );

    return dashboard;
  }

  private createSecurityDashboard(): cloudwatch.Dashboard {
    const dashboard = new cloudwatch.Dashboard(this, "SecurityDashboard", {
      dashboardName: "BedrockHybridRouting-Security",
      defaultInterval: cdk.Duration.minutes(5),
    });

    // Security Metrics
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: "Security Compliance Metrics",
        width: 24,
        height: 6,
        left: [
          new cloudwatch.Metric({
            namespace: "BedrockHybridRouting",
            metricName: "PIIDetectionRate",
            dimensionsMap: { Environment: "production" },
            statistic: "Average",
          }),
          new cloudwatch.Metric({
            namespace: "BedrockHybridRouting",
            metricName: "GDPRComplianceRate",
            dimensionsMap: { Environment: "production" },
            statistic: "Average",
          }),
          new cloudwatch.Metric({
            namespace: "BedrockHybridRouting",
            metricName: "SecurityScore",
            dimensionsMap: { Environment: "production" },
            statistic: "Average",
          }),
        ],
      })
    );

    return dashboard;
  }

  private createCostDashboard(): cloudwatch.Dashboard {
    const dashboard = new cloudwatch.Dashboard(this, "CostDashboard", {
      dashboardName: "BedrockHybridRouting-Cost",
      defaultInterval: cdk.Duration.hours(1),
    });

    // Cost Tracking
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: "Cost Metrics",
        width: 24,
        height: 6,
        left: [
          new cloudwatch.Metric({
            namespace: "BedrockHybridRouting",
            metricName: "CostPerRequest",
            dimensionsMap: {
              Environment: "production",
              Route: "DirectBedrock",
            },
            statistic: "Average",
          }),
          new cloudwatch.Metric({
            namespace: "BedrockHybridRouting",
            metricName: "CostPerRequest",
            dimensionsMap: { Environment: "production", Route: "MCP" },
            statistic: "Average",
          }),
          new cloudwatch.Metric({
            namespace: "BedrockHybridRouting",
            metricName: "TotalCost",
            dimensionsMap: { Environment: "production" },
            statistic: "Sum",
          }),
        ],
      })
    );

    return dashboard;
  }

  private createPerformanceAlarms(
    criticalTopic: sns.Topic,
    warningTopic: sns.Topic
  ): cloudwatch.Alarm[] {
    const alarms: cloudwatch.Alarm[] = [];

    // Emergency Operation Latency - CRITICAL
    alarms.push(
      new cloudwatch.Alarm(this, "EmergencyOperationLatencyAlarm", {
        alarmName: "BedrockHybridRouting-EmergencyLatency-Critical",
        alarmDescription:
          "Emergency operations exceeding 5 second latency threshold",
        metric: new cloudwatch.Metric({
          namespace: "BedrockHybridRouting",
          metricName: "EmergencyOperationLatency",
          dimensionsMap: { Environment: "production" },
          statistic: "Average",
        }),
        threshold: 5000, // 5 seconds in milliseconds
        evaluationPeriods: 2,
        datapointsToAlarm: 2,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      })
    );

    // Critical Operation Latency - WARNING
    alarms.push(
      new cloudwatch.Alarm(this, "CriticalOperationLatencyAlarm", {
        alarmName: "BedrockHybridRouting-CriticalLatency-Warning",
        alarmDescription:
          "Critical operations exceeding 10 second latency threshold",
        metric: new cloudwatch.Metric({
          namespace: "BedrockHybridRouting",
          metricName: "CriticalOperationLatency",
          dimensionsMap: { Environment: "production" },
          statistic: "Average",
        }),
        threshold: 10000, // 10 seconds in milliseconds
        evaluationPeriods: 3,
        datapointsToAlarm: 2,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      })
    );

    // Error Rate - CRITICAL
    alarms.push(
      new cloudwatch.Alarm(this, "ErrorRateAlarm", {
        alarmName: "BedrockHybridRouting-ErrorRate-Critical",
        alarmDescription: "Error rate exceeding 5% threshold",
        metric: new cloudwatch.Metric({
          namespace: "BedrockHybridRouting",
          metricName: "ErrorRate",
          dimensionsMap: { Environment: "production" },
          statistic: "Average",
        }),
        threshold: 5, // 5%
        evaluationPeriods: 2,
        datapointsToAlarm: 2,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      })
    );

    // Add SNS actions to alarms
    alarms[0].addAlarmAction(new cloudwatch.SnsAction(criticalTopic)); // Emergency latency
    alarms[1].addAlarmAction(new cloudwatch.SnsAction(warningTopic)); // Critical latency
    alarms[2].addAlarmAction(new cloudwatch.SnsAction(criticalTopic)); // Error rate

    return alarms;
  }

  private createSecurityAlarms(criticalTopic: sns.Topic): cloudwatch.Alarm[] {
    const alarms: cloudwatch.Alarm[] = [];

    // GDPR Compliance Rate - CRITICAL
    alarms.push(
      new cloudwatch.Alarm(this, "GDPRComplianceAlarm", {
        alarmName: "BedrockHybridRouting-GDPRCompliance-Critical",
        alarmDescription: "GDPR compliance rate below 100%",
        metric: new cloudwatch.Metric({
          namespace: "BedrockHybridRouting",
          metricName: "GDPRComplianceRate",
          dimensionsMap: { Environment: "production" },
          statistic: "Average",
        }),
        threshold: 100,
        evaluationPeriods: 1,
        datapointsToAlarm: 1,
        comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
      })
    );

    // Security Score - CRITICAL
    alarms.push(
      new cloudwatch.Alarm(this, "SecurityScoreAlarm", {
        alarmName: "BedrockHybridRouting-SecurityScore-Critical",
        alarmDescription: "Security score below 90/100 threshold",
        metric: new cloudwatch.Metric({
          namespace: "BedrockHybridRouting",
          metricName: "SecurityScore",
          dimensionsMap: { Environment: "production" },
          statistic: "Average",
        }),
        threshold: 90,
        evaluationPeriods: 2,
        datapointsToAlarm: 2,
        comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
      })
    );

    // Add SNS actions
    alarms.forEach((alarm) =>
      alarm.addAlarmAction(new cloudwatch.SnsAction(criticalTopic))
    );

    return alarms;
  }

  private createCostAlarms(
    warningTopic: sns.Topic,
    infoTopic: sns.Topic
  ): cloudwatch.Alarm[] {
    const alarms: cloudwatch.Alarm[] = [];

    // Cost Budget - WARNING
    alarms.push(
      new cloudwatch.Alarm(this, "CostBudgetAlarm", {
        alarmName: "BedrockHybridRouting-CostBudget-Warning",
        alarmDescription: "Cost budget exceeding 80% threshold",
        metric: new cloudwatch.Metric({
          namespace: "BedrockHybridRouting",
          metricName: "BudgetUtilization",
          dimensionsMap: { Environment: "production" },
          statistic: "Maximum",
        }),
        threshold: 80, // 80%
        evaluationPeriods: 1,
        datapointsToAlarm: 1,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      })
    );

    alarms[0].addAlarmAction(new cloudwatch.SnsAction(warningTopic));

    return alarms;
  }

  private createAvailabilityAlarms(
    criticalTopic: sns.Topic
  ): cloudwatch.Alarm[] {
    const alarms: cloudwatch.Alarm[] = [];

    // System Availability - CRITICAL
    alarms.push(
      new cloudwatch.Alarm(this, "SystemAvailabilityAlarm", {
        alarmName: "BedrockHybridRouting-Availability-Critical",
        alarmDescription: "System availability below 99% threshold",
        metric: new cloudwatch.Metric({
          namespace: "BedrockHybridRouting",
          metricName: "SystemAvailability",
          dimensionsMap: { Environment: "production" },
          statistic: "Average",
        }),
        threshold: 99, // 99%
        evaluationPeriods: 2,
        datapointsToAlarm: 2,
        comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
      })
    );

    alarms[0].addAlarmAction(new cloudwatch.SnsAction(criticalTopic));

    return alarms;
  }

  private createMetricsProcessor(): lambda.Function {
    const metricsProcessor = new lambda.Function(this, "MetricsProcessor", {
      functionName: "bedrock-hybrid-routing-metrics-processor",
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "index.handler",
      code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const cloudwatch = new AWS.CloudWatch();

        exports.handler = async (event) => {
          console.log('Processing metrics:', JSON.stringify(event, null, 2));
          
          // Process custom metrics and send to CloudWatch
          const metrics = event.metrics || [];
          
          for (const metric of metrics) {
            const params = {
              Namespace: 'BedrockHybridRouting',
              MetricData: [{
                MetricName: metric.name,
                Value: metric.value,
                Unit: metric.unit || 'Count',
                Dimensions: metric.dimensions || [],
                Timestamp: new Date()
              }]
            };
            
            await cloudwatch.putMetricData(params).promise();
          }
          
          return { statusCode: 200, body: 'Metrics processed successfully' };
        };
      `),
      timeout: cdk.Duration.minutes(5),
      memorySize: 256,
    });

    // Grant CloudWatch permissions
    metricsProcessor.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "cloudwatch:PutMetricData",
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
        ],
        resources: ["*"],
      })
    );

    return metricsProcessor;
  }
}
