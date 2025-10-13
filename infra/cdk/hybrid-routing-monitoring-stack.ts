import * as cdk from "aws-cdk-lib";
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import * as sns from "aws-cdk-lib/aws-sns";
import * as subscriptions from "aws-cdk-lib/aws-sns-subscriptions";
import { Construct } from "constructs";

export interface HybridRoutingMonitoringProps {
  region: string;
  alertEmail: string;
  environment: "development" | "staging" | "production";
}

/**
 * CloudWatch Dashboard Stack for Hybrid Routing Monitoring
 *
 * Extends monitoring capabilities for Bedrock Support Manager hybrid routing architecture.
 * Tracks metrics for both direct Bedrock and MCP routing paths.
 */
export class HybridRoutingMonitoringStack extends cdk.Stack {
  public readonly dashboard: cloudwatch.Dashboard;
  public readonly alertTopic: sns.Topic;

  constructor(
    scope: Construct,
    id: string,
    props: HybridRoutingMonitoringProps & cdk.StackProps
  ) {
    super(scope, id, props);

    // SNS topic for hybrid routing alerts
    this.alertTopic = new sns.Topic(this, "HybridRoutingAlerts", {
      displayName: "Hybrid Routing Performance Alerts",
      topicName: `matbakh-hybrid-routing-alerts-${props.environment}`,
    });

    // Email subscription
    this.alertTopic.addSubscription(
      new subscriptions.EmailSubscription(props.alertEmail)
    );

    // Create comprehensive hybrid routing dashboard
    this.dashboard = new cloudwatch.Dashboard(this, "HybridRoutingDashboard", {
      dashboardName: `Matbakh-Hybrid-Routing-${props.environment}`,
      defaultInterval: cdk.Duration.hours(1),
    });

    // Add dashboard widgets
    this.addOverviewWidgets(props);
    this.addRoutingPathMetrics(props);
    this.addPerformanceMetrics(props);
    this.addRoutingEfficiencyMetrics(props);
    this.addSupportOperationsMetrics(props);
    this.addHealthMonitoringMetrics(props);

    // Create alarms
    this.createLatencyAlarms(props);
    this.createSuccessRateAlarms(props);
    this.createRoutingEfficiencyAlarms(props);
    this.createCostAlarms(props);
  }

  private addOverviewWidgets(props: HybridRoutingMonitoringProps) {
    // System overview
    this.dashboard.addWidgets(
      new cloudwatch.TextWidget({
        markdown: `# Hybrid Routing System Overview
        
**Environment:** ${props.environment}  
**Region:** ${props.region}  

## Architecture
- **Direct Bedrock Path**: Emergency & critical support operations (<10s latency)
- **MCP Path**: Standard operations with intelligent routing
- **Fallback**: Automatic failover between paths

## Key Metrics
- **P95 Latency Target**: Direct <10s, MCP <30s
- **Success Rate Target**: >95%
- **Routing Efficiency Target**: >80%
- **Cost Optimization**: Intelligent path selection

## Quick Links
- [Bedrock Console](https://console.aws.amazon.com/bedrock/home)
- [CloudWatch Logs](https://console.aws.amazon.com/cloudwatch/home#logsV2:log-groups)
- [Lambda Functions](https://console.aws.amazon.com/lambda/home#/functions)
        `,
        width: 12,
        height: 8,
      })
    );

    // Current status indicators
    this.dashboard.addWidgets(
      new cloudwatch.SingleValueWidget({
        title: "Direct Bedrock Path Health",
        metrics: [
          new cloudwatch.Metric({
            namespace: "Matbakh/HybridRouting",
            metricName: "DirectBedrockHealthStatus",
            statistic: "Average",
          }),
        ],
        width: 4,
        height: 3,
      }),
      new cloudwatch.SingleValueWidget({
        title: "MCP Path Health",
        metrics: [
          new cloudwatch.Metric({
            namespace: "Matbakh/HybridRouting",
            metricName: "MCPHealthStatus",
            statistic: "Average",
          }),
        ],
        width: 4,
        height: 3,
      }),
      new cloudwatch.SingleValueWidget({
        title: "Overall Routing Efficiency",
        metrics: [
          new cloudwatch.Metric({
            namespace: "Matbakh/HybridRouting",
            metricName: "RoutingEfficiency",
            statistic: "Average",
          }),
        ],
        width: 4,
        height: 3,
      })
    );
  }

  private addRoutingPathMetrics(props: HybridRoutingMonitoringProps) {
    // Request distribution across paths
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: "Request Distribution by Routing Path",
        left: [
          new cloudwatch.Metric({
            namespace: "Matbakh/HybridRouting",
            metricName: "DirectBedrockRequests",
            label: "Direct Bedrock",
            statistic: "Sum",
          }),
          new cloudwatch.Metric({
            namespace: "Matbakh/HybridRouting",
            metricName: "MCPRequests",
            label: "MCP Path",
            statistic: "Sum",
          }),
          new cloudwatch.Metric({
            namespace: "Matbakh/HybridRouting",
            metricName: "FallbackRequests",
            label: "Fallback",
            statistic: "Sum",
          }),
        ],
        width: 12,
        height: 6,
      })
    );

    // Success rates by path
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: "Success Rate by Routing Path",
        left: [
          new cloudwatch.Metric({
            namespace: "Matbakh/HybridRouting",
            metricName: "DirectBedrockSuccessRate",
            label: "Direct Bedrock (%)",
            statistic: "Average",
          }),
          new cloudwatch.Metric({
            namespace: "Matbakh/HybridRouting",
            metricName: "MCPSuccessRate",
            label: "MCP Path (%)",
            statistic: "Average",
          }),
        ],
        width: 12,
        height: 6,
      })
    );
  }

  private addPerformanceMetrics(props: HybridRoutingMonitoringProps) {
    // P95 latency by path
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: "P95 Latency by Routing Path",
        left: [
          new cloudwatch.Metric({
            namespace: "Matbakh/HybridRouting",
            metricName: "DirectBedrockP95Latency",
            label: "Direct Bedrock (ms)",
            statistic: "Average",
          }),
          new cloudwatch.Metric({
            namespace: "Matbakh/HybridRouting",
            metricName: "MCPP95Latency",
            label: "MCP Path (ms)",
            statistic: "Average",
          }),
        ],
        width: 12,
        height: 6,
      })
    );

    // Average latency comparison
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: "Average Latency Comparison",
        left: [
          new cloudwatch.Metric({
            namespace: "Matbakh/HybridRouting",
            metricName: "DirectBedrockAvgLatency",
            label: "Direct Bedrock (ms)",
            statistic: "Average",
          }),
          new cloudwatch.Metric({
            namespace: "Matbakh/HybridRouting",
            metricName: "MCPAvgLatency",
            label: "MCP Path (ms)",
            statistic: "Average",
          }),
        ],
        width: 6,
        height: 6,
      }),
      new cloudwatch.GraphWidget({
        title: "P99 Latency by Path",
        left: [
          new cloudwatch.Metric({
            namespace: "Matbakh/HybridRouting",
            metricName: "DirectBedrockP99Latency",
            label: "Direct Bedrock (ms)",
            statistic: "Average",
          }),
          new cloudwatch.Metric({
            namespace: "Matbakh/HybridRouting",
            metricName: "MCPP99Latency",
            label: "MCP Path (ms)",
            statistic: "Average",
          }),
        ],
        width: 6,
        height: 6,
      })
    );
  }

  private addRoutingEfficiencyMetrics(props: HybridRoutingMonitoringProps) {
    // Routing efficiency over time
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: "Routing Efficiency Metrics",
        left: [
          new cloudwatch.Metric({
            namespace: "Matbakh/HybridRouting",
            metricName: "OverallRoutingEfficiency",
            label: "Overall Efficiency (%)",
            statistic: "Average",
          }),
          new cloudwatch.Metric({
            namespace: "Matbakh/HybridRouting",
            metricName: "OptimalRoutingRate",
            label: "Optimal Routing Rate (%)",
            statistic: "Average",
          }),
        ],
        right: [
          new cloudwatch.Metric({
            namespace: "Matbakh/HybridRouting",
            metricName: "FallbackRate",
            label: "Fallback Rate (%)",
            statistic: "Average",
          }),
        ],
        width: 12,
        height: 6,
      })
    );

    // Routing decision breakdown
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: "Routing Decision Breakdown",
        left: [
          new cloudwatch.Metric({
            namespace: "Matbakh/HybridRouting",
            metricName: "EmergencyOperations",
            label: "Emergency (Direct)",
            statistic: "Sum",
          }),
          new cloudwatch.Metric({
            namespace: "Matbakh/HybridRouting",
            metricName: "CriticalSupportOperations",
            label: "Critical Support (Direct)",
            statistic: "Sum",
          }),
          new cloudwatch.Metric({
            namespace: "Matbakh/HybridRouting",
            metricName: "StandardOperations",
            label: "Standard (MCP)",
            statistic: "Sum",
          }),
        ],
        width: 12,
        height: 6,
      })
    );
  }

  private addSupportOperationsMetrics(props: HybridRoutingMonitoringProps) {
    // Support mode operations
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: "Support Mode Operations",
        left: [
          new cloudwatch.Metric({
            namespace: "Matbakh/HybridRouting",
            metricName: "InfrastructureAudits",
            label: "Infrastructure Audits",
            statistic: "Sum",
          }),
          new cloudwatch.Metric({
            namespace: "Matbakh/HybridRouting",
            metricName: "MetaMonitoringOperations",
            label: "Meta Monitoring",
            statistic: "Sum",
          }),
          new cloudwatch.Metric({
            namespace: "Matbakh/HybridRouting",
            metricName: "ImplementationSupport",
            label: "Implementation Support",
            statistic: "Sum",
          }),
        ],
        width: 12,
        height: 6,
      })
    );

    // Support operation success rates
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: "Support Operation Success Rates",
        left: [
          new cloudwatch.Metric({
            namespace: "Matbakh/HybridRouting",
            metricName: "InfrastructureAuditSuccessRate",
            label: "Infrastructure Audit (%)",
            statistic: "Average",
          }),
          new cloudwatch.Metric({
            namespace: "Matbakh/HybridRouting",
            metricName: "MetaMonitoringSuccessRate",
            label: "Meta Monitoring (%)",
            statistic: "Average",
          }),
          new cloudwatch.Metric({
            namespace: "Matbakh/HybridRouting",
            metricName: "ImplementationSupportSuccessRate",
            label: "Implementation Support (%)",
            statistic: "Average",
          }),
        ],
        width: 12,
        height: 6,
      })
    );
  }

  private addHealthMonitoringMetrics(props: HybridRoutingMonitoringProps) {
    // Health check status
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: "Health Check Status",
        left: [
          new cloudwatch.Metric({
            namespace: "Matbakh/HybridRouting",
            metricName: "DirectBedrockHealthScore",
            label: "Direct Bedrock Health",
            statistic: "Average",
          }),
          new cloudwatch.Metric({
            namespace: "Matbakh/HybridRouting",
            metricName: "MCPHealthScore",
            label: "MCP Health",
            statistic: "Average",
          }),
        ],
        width: 12,
        height: 6,
      })
    );

    // Circuit breaker status
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: "Circuit Breaker Events",
        left: [
          new cloudwatch.Metric({
            namespace: "Matbakh/HybridRouting",
            metricName: "CircuitBreakerTrips",
            label: "Circuit Breaker Trips",
            statistic: "Sum",
          }),
          new cloudwatch.Metric({
            namespace: "Matbakh/HybridRouting",
            metricName: "CircuitBreakerRecoveries",
            label: "Circuit Breaker Recoveries",
            statistic: "Sum",
          }),
        ],
        width: 12,
        height: 6,
      })
    );
  }

  private createLatencyAlarms(props: HybridRoutingMonitoringProps) {
    // Direct Bedrock P95 latency alarm
    new cloudwatch.Alarm(this, "DirectBedrockP95LatencyAlarm", {
      alarmName: `Hybrid-Routing-DirectBedrock-P95-Latency-${props.environment}`,
      alarmDescription: "Direct Bedrock P95 latency exceeds threshold",
      metric: new cloudwatch.Metric({
        namespace: "Matbakh/HybridRouting",
        metricName: "DirectBedrockP95Latency",
        statistic: "Average",
      }),
      threshold: 10000, // 10 seconds
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    }).addAlarmAction(
      new cdk.aws_cloudwatch_actions.SnsAction(this.alertTopic)
    );

    // MCP P95 latency alarm
    new cloudwatch.Alarm(this, "MCPP95LatencyAlarm", {
      alarmName: `Hybrid-Routing-MCP-P95-Latency-${props.environment}`,
      alarmDescription: "MCP P95 latency exceeds threshold",
      metric: new cloudwatch.Metric({
        namespace: "Matbakh/HybridRouting",
        metricName: "MCPP95Latency",
        statistic: "Average",
      }),
      threshold: 30000, // 30 seconds
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    }).addAlarmAction(
      new cdk.aws_cloudwatch_actions.SnsAction(this.alertTopic)
    );
  }

  private createSuccessRateAlarms(props: HybridRoutingMonitoringProps) {
    // Direct Bedrock success rate alarm
    new cloudwatch.Alarm(this, "DirectBedrockSuccessRateAlarm", {
      alarmName: `Hybrid-Routing-DirectBedrock-Success-Rate-${props.environment}`,
      alarmDescription: "Direct Bedrock success rate below threshold",
      metric: new cloudwatch.Metric({
        namespace: "Matbakh/HybridRouting",
        metricName: "DirectBedrockSuccessRate",
        statistic: "Average",
      }),
      threshold: 95, // 95%
      comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
      evaluationPeriods: 3,
      datapointsToAlarm: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    }).addAlarmAction(
      new cdk.aws_cloudwatch_actions.SnsAction(this.alertTopic)
    );

    // MCP success rate alarm
    new cloudwatch.Alarm(this, "MCPSuccessRateAlarm", {
      alarmName: `Hybrid-Routing-MCP-Success-Rate-${props.environment}`,
      alarmDescription: "MCP success rate below threshold",
      metric: new cloudwatch.Metric({
        namespace: "Matbakh/HybridRouting",
        metricName: "MCPSuccessRate",
        statistic: "Average",
      }),
      threshold: 95, // 95%
      comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
      evaluationPeriods: 3,
      datapointsToAlarm: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    }).addAlarmAction(
      new cdk.aws_cloudwatch_actions.SnsAction(this.alertTopic)
    );
  }

  private createRoutingEfficiencyAlarms(props: HybridRoutingMonitoringProps) {
    // Overall routing efficiency alarm
    new cloudwatch.Alarm(this, "RoutingEfficiencyAlarm", {
      alarmName: `Hybrid-Routing-Efficiency-${props.environment}`,
      alarmDescription: "Overall routing efficiency below threshold",
      metric: new cloudwatch.Metric({
        namespace: "Matbakh/HybridRouting",
        metricName: "OverallRoutingEfficiency",
        statistic: "Average",
      }),
      threshold: 80, // 80%
      comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
      evaluationPeriods: 3,
      datapointsToAlarm: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    }).addAlarmAction(
      new cdk.aws_cloudwatch_actions.SnsAction(this.alertTopic)
    );

    // High fallback rate alarm
    new cloudwatch.Alarm(this, "HighFallbackRateAlarm", {
      alarmName: `Hybrid-Routing-High-Fallback-Rate-${props.environment}`,
      alarmDescription: "Fallback rate is too high",
      metric: new cloudwatch.Metric({
        namespace: "Matbakh/HybridRouting",
        metricName: "FallbackRate",
        statistic: "Average",
      }),
      threshold: 10, // 10%
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      evaluationPeriods: 3,
      datapointsToAlarm: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    }).addAlarmAction(
      new cdk.aws_cloudwatch_actions.SnsAction(this.alertTopic)
    );
  }

  private createCostAlarms(props: HybridRoutingMonitoringProps) {
    // Hybrid routing cost budget
    new cdk.aws_budgets.CfnBudget(this, "HybridRoutingBudgetAlerts", {
      budget: {
        budgetName: `Hybrid-Routing-Budget-${props.environment}`,
        budgetLimit: {
          amount: props.environment === "production" ? 200 : 50,
          unit: "EUR",
        },
        timeUnit: "MONTHLY",
        budgetType: "COST",
        costFilters: {
          Service: ["AWS Bedrock", "AWS Lambda", "Amazon CloudWatch"],
        },
      },
      notificationsWithSubscribers: [
        {
          notification: {
            notificationType: "ACTUAL",
            comparisonOperator: "GREATER_THAN",
            threshold: 50,
            thresholdType: "PERCENTAGE",
          },
          subscribers: [
            {
              subscriptionType: "EMAIL",
              address: props.alertEmail,
            },
          ],
        },
        {
          notification: {
            notificationType: "ACTUAL",
            comparisonOperator: "GREATER_THAN",
            threshold: 80,
            thresholdType: "PERCENTAGE",
          },
          subscribers: [
            {
              subscriptionType: "EMAIL",
              address: props.alertEmail,
            },
          ],
        },
        {
          notification: {
            notificationType: "FORECASTED",
            comparisonOperator: "GREATER_THAN",
            threshold: 100,
            thresholdType: "PERCENTAGE",
          },
          subscribers: [
            {
              subscriptionType: "EMAIL",
              address: props.alertEmail,
            },
          ],
        },
      ],
    });
  }
}
