import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';

export interface MultiRegionMonitoringProps {
    primaryRegion: string;
    secondaryRegion: string;
    domainName: string;
    distributionId: string;
    primaryClusterIdentifier: string;
    secondaryClusterIdentifier: string;
    primaryHealthCheckId: string;
    secondaryHealthCheckId: string;
    alertEmail: string;
}

export class MultiRegionMonitoringStack extends cdk.Stack {
    public readonly dashboard: cloudwatch.Dashboard;
    public readonly alertTopic: sns.Topic;

    constructor(scope: Construct, id: string, props: MultiRegionMonitoringProps & cdk.StackProps) {
        super(scope, id, props);

        // SNS topic for alerts
        this.alertTopic = new sns.Topic(this, 'MultiRegionAlerts', {
            displayName: 'Multi-Region Infrastructure Alerts',
            topicName: 'matbakh-multi-region-alerts',
        });

        // Email subscription
        this.alertTopic.addSubscription(
            new subscriptions.EmailSubscription(props.alertEmail)
        );

        // Create comprehensive dashboard
        this.dashboard = new cloudwatch.Dashboard(this, 'MultiRegionDashboard', {
            dashboardName: 'Matbakh-Multi-Region-Overview',
            defaultInterval: cdk.Duration.hours(1),
        });

        // Add widgets to dashboard
        this.addOverviewWidgets(props);
        this.addApiHealthWidgets(props);
        this.addDatabaseWidgets(props);
        this.addCdnWidgets(props);
        this.addReplicationWidgets(props);
        this.addSlaWidgets(props);

        // Create alarms
        this.createCriticalAlarms(props);
        this.createPerformanceAlarms(props);
        this.createReplicationAlarms(props);

        // Budget alerts
        this.createBudgetAlerts(props);
    }

    private addOverviewWidgets(props: MultiRegionMonitoringProps) {
        // System overview
        this.dashboard.addWidgets(
            new cloudwatch.TextWidget({
                markdown: `# Multi-Region System Overview
        
**Primary Region:** ${props.primaryRegion}  
**Secondary Region:** ${props.secondaryRegion}  
**Domain:** ${props.domainName}  

## Key Metrics
- **RTO Target:** 15 minutes
- **RPO Target:** 1 minute  
- **Availability Target:** 99.9%

## Quick Links
- [Route 53 Health Checks](https://console.aws.amazon.com/route53/healthchecks/home)
- [CloudFront Distribution](https://console.aws.amazon.com/cloudfront/home#distribution-settings:${props.distributionId})
- [RDS Global Database](https://console.aws.amazon.com/rds/home#databases:)
        `,
                width: 12,
                height: 6,
            })
        );

        // Current status indicators
        this.dashboard.addWidgets(
            new cloudwatch.SingleValueWidget({
                title: 'Primary Region Health',
                metrics: [
                    new cloudwatch.Metric({
                        namespace: 'AWS/Route53',
                        metricName: 'HealthCheckStatus',
                        dimensionsMap: {
                            HealthCheckId: props.primaryHealthCheckId,
                        },
                        statistic: 'Average',
                    }),
                ],
                width: 6,
                height: 3,
            }),
            new cloudwatch.SingleValueWidget({
                title: 'Secondary Region Health',
                metrics: [
                    new cloudwatch.Metric({
                        namespace: 'AWS/Route53',
                        metricName: 'HealthCheckStatus',
                        dimensionsMap: {
                            HealthCheckId: props.secondaryHealthCheckId,
                        },
                        statistic: 'Average',
                    }),
                ],
                width: 6,
                height: 3,
            })
        );
    }

    private addApiHealthWidgets(props: MultiRegionMonitoringProps) {
        // API health metrics
        this.dashboard.addWidgets(
            new cloudwatch.GraphWidget({
                title: 'API Health Check Status',
                left: [
                    new cloudwatch.Metric({
                        namespace: 'AWS/Route53',
                        metricName: 'HealthCheckStatus',
                        dimensionsMap: {
                            HealthCheckId: props.primaryHealthCheckId,
                        },
                        label: `Primary (${props.primaryRegion})`,
                    }),
                    new cloudwatch.Metric({
                        namespace: 'AWS/Route53',
                        metricName: 'HealthCheckStatus',
                        dimensionsMap: {
                            HealthCheckId: props.secondaryHealthCheckId,
                        },
                        label: `Secondary (${props.secondaryRegion})`,
                    }),
                ],
                width: 12,
                height: 6,
            })
        );

        // API response times
        this.dashboard.addWidgets(
            new cloudwatch.GraphWidget({
                title: 'API Response Times',
                left: [
                    new cloudwatch.Metric({
                        namespace: 'AWS/Route53',
                        metricName: 'ConnectionTime',
                        dimensionsMap: {
                            HealthCheckId: props.primaryHealthCheckId,
                        },
                        label: `Primary (${props.primaryRegion})`,
                        statistic: 'Average',
                    }),
                    new cloudwatch.Metric({
                        namespace: 'AWS/Route53',
                        metricName: 'ConnectionTime',
                        dimensionsMap: {
                            HealthCheckId: props.secondaryHealthCheckId,
                        },
                        label: `Secondary (${props.secondaryRegion})`,
                        statistic: 'Average',
                    }),
                ],
                width: 12,
                height: 6,
            })
        );
    }

    private addDatabaseWidgets(props: MultiRegionMonitoringProps) {
        // Database performance
        this.dashboard.addWidgets(
            new cloudwatch.GraphWidget({
                title: 'Database CPU Utilization',
                left: [
                    new cloudwatch.Metric({
                        namespace: 'AWS/RDS',
                        metricName: 'CPUUtilization',
                        dimensionsMap: {
                            DBClusterIdentifier: props.primaryClusterIdentifier,
                        },
                        label: `Primary (${props.primaryRegion})`,
                    }),
                    new cloudwatch.Metric({
                        namespace: 'AWS/RDS',
                        metricName: 'CPUUtilization',
                        dimensionsMap: {
                            DBClusterIdentifier: props.secondaryClusterIdentifier,
                        },
                        label: `Secondary (${props.secondaryRegion})`,
                    }),
                ],
                width: 6,
                height: 6,
            }),
            new cloudwatch.GraphWidget({
                title: 'Database Connections',
                left: [
                    new cloudwatch.Metric({
                        namespace: 'AWS/RDS',
                        metricName: 'DatabaseConnections',
                        dimensionsMap: {
                            DBClusterIdentifier: props.primaryClusterIdentifier,
                        },
                        label: `Primary (${props.primaryRegion})`,
                    }),
                    new cloudwatch.Metric({
                        namespace: 'AWS/RDS',
                        metricName: 'DatabaseConnections',
                        dimensionsMap: {
                            DBClusterIdentifier: props.secondaryClusterIdentifier,
                        },
                        label: `Secondary (${props.secondaryRegion})`,
                    }),
                ],
                width: 6,
                height: 6,
            })
        );

        // Replication lag
        this.dashboard.addWidgets(
            new cloudwatch.GraphWidget({
                title: 'Aurora Global Database Replication Lag',
                left: [
                    new cloudwatch.Metric({
                        namespace: 'AWS/RDS',
                        metricName: 'AuroraGlobalDBReplicationLag',
                        dimensionsMap: {
                            DBClusterIdentifier: props.secondaryClusterIdentifier,
                        },
                        label: 'Replication Lag (ms)',
                        statistic: 'Average',
                    }),
                ],
                right: [
                    new cloudwatch.Metric({
                        namespace: 'AWS/RDS',
                        metricName: 'AuroraGlobalDBDataTransferBytes',
                        dimensionsMap: {
                            DBClusterIdentifier: props.secondaryClusterIdentifier,
                        },
                        label: 'Data Transfer (bytes)',
                        statistic: 'Sum',
                    }),
                ],
                width: 12,
                height: 6,
            })
        );
    }

    private addCdnWidgets(props: MultiRegionMonitoringProps) {
        // CloudFront metrics
        this.dashboard.addWidgets(
            new cloudwatch.GraphWidget({
                title: 'CloudFront Requests and Cache Hit Rate',
                left: [
                    new cloudwatch.Metric({
                        namespace: 'AWS/CloudFront',
                        metricName: 'Requests',
                        dimensionsMap: {
                            DistributionId: props.distributionId,
                        },
                        label: 'Total Requests',
                        statistic: 'Sum',
                    }),
                ],
                right: [
                    new cloudwatch.Metric({
                        namespace: 'AWS/CloudFront',
                        metricName: 'CacheHitRate',
                        dimensionsMap: {
                            DistributionId: props.distributionId,
                        },
                        label: 'Cache Hit Rate (%)',
                        statistic: 'Average',
                    }),
                ],
                width: 6,
                height: 6,
            }),
            new cloudwatch.GraphWidget({
                title: 'CloudFront Error Rates',
                left: [
                    new cloudwatch.Metric({
                        namespace: 'AWS/CloudFront',
                        metricName: '4xxErrorRate',
                        dimensionsMap: {
                            DistributionId: props.distributionId,
                        },
                        label: '4xx Error Rate (%)',
                    }),
                    new cloudwatch.Metric({
                        namespace: 'AWS/CloudFront',
                        metricName: '5xxErrorRate',
                        dimensionsMap: {
                            DistributionId: props.distributionId,
                        },
                        label: '5xx Error Rate (%)',
                    }),
                ],
                width: 6,
                height: 6,
            })
        );

        // Origin latency
        this.dashboard.addWidgets(
            new cloudwatch.GraphWidget({
                title: 'CloudFront Origin Latency',
                left: [
                    new cloudwatch.Metric({
                        namespace: 'AWS/CloudFront',
                        metricName: 'OriginLatency',
                        dimensionsMap: {
                            DistributionId: props.distributionId,
                        },
                        label: 'Origin Latency (ms)',
                        statistic: 'Average',
                    }),
                ],
                width: 12,
                height: 6,
            })
        );
    }

    private addReplicationWidgets(props: MultiRegionMonitoringProps) {
        // S3 replication metrics (custom metrics would need to be published)
        this.dashboard.addWidgets(
            new cloudwatch.GraphWidget({
                title: 'Cross-Region Replication Status',
                left: [
                    new cloudwatch.Metric({
                        namespace: 'Matbakh/MultiRegion',
                        metricName: 'S3ReplicationLag',
                        label: 'S3 Replication Lag (minutes)',
                        statistic: 'Average',
                    }),
                    new cloudwatch.Metric({
                        namespace: 'Matbakh/MultiRegion',
                        metricName: 'SecretsReplicationStatus',
                        label: 'Secrets Replication Status',
                        statistic: 'Average',
                    }),
                ],
                width: 12,
                height: 6,
            })
        );
    }

    private addSlaWidgets(props: MultiRegionMonitoringProps) {
        // SLA compliance metrics
        this.dashboard.addWidgets(
            new cloudwatch.GraphWidget({
                title: 'SLA Compliance Metrics',
                left: [
                    new cloudwatch.Metric({
                        namespace: 'Matbakh/MultiRegion',
                        metricName: 'AvailabilityPercentage',
                        label: 'Availability %',
                        statistic: 'Average',
                    }),
                ],
                right: [
                    new cloudwatch.Metric({
                        namespace: 'Matbakh/MultiRegion',
                        metricName: 'FailoverRTO',
                        label: 'Last Failover RTO (minutes)',
                        statistic: 'Maximum',
                    }),
                    new cloudwatch.Metric({
                        namespace: 'Matbakh/MultiRegion',
                        metricName: 'FailoverRPO',
                        label: 'Last Failover RPO (minutes)',
                        statistic: 'Maximum',
                    }),
                ],
                width: 12,
                height: 6,
            })
        );

        // Failover history
        this.dashboard.addWidgets(
            new cloudwatch.GraphWidget({
                title: 'Failover Events',
                left: [
                    new cloudwatch.Metric({
                        namespace: 'Matbakh/MultiRegion',
                        metricName: 'FailoverAttempts',
                        label: 'Failover Attempts',
                        statistic: 'Sum',
                    }),
                    new cloudwatch.Metric({
                        namespace: 'Matbakh/MultiRegion',
                        metricName: 'FailbackAttempts',
                        label: 'Failback Attempts',
                        statistic: 'Sum',
                    }),
                ],
                width: 12,
                height: 6,
            })
        );
    }

    private createCriticalAlarms(props: MultiRegionMonitoringProps) {
        // Primary region health alarm
        new cloudwatch.Alarm(this, 'PrimaryRegionHealthAlarm', {
            alarmName: 'Multi-Region-Primary-Health-Critical',
            alarmDescription: 'Primary region health check is failing',
            metric: new cloudwatch.Metric({
                namespace: 'AWS/Route53',
                metricName: 'HealthCheckStatus',
                dimensionsMap: {
                    HealthCheckId: props.primaryHealthCheckId,
                },
                statistic: 'Average',
            }),
            threshold: 1,
            comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
            evaluationPeriods: 2,
            datapointsToAlarm: 2,
            treatMissingData: cloudwatch.TreatMissingData.BREACHING,
        }).addAlarmAction(new cdk.aws_cloudwatch_actions.SnsAction(this.alertTopic));

        // Secondary region health alarm
        new cloudwatch.Alarm(this, 'SecondaryRegionHealthAlarm', {
            alarmName: 'Multi-Region-Secondary-Health-Critical',
            alarmDescription: 'Secondary region health check is failing',
            metric: new cloudwatch.Metric({
                namespace: 'AWS/Route53',
                metricName: 'HealthCheckStatus',
                dimensionsMap: {
                    HealthCheckId: props.secondaryHealthCheckId,
                },
                statistic: 'Average',
            }),
            threshold: 1,
            comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
            evaluationPeriods: 2,
            datapointsToAlarm: 2,
            treatMissingData: cloudwatch.TreatMissingData.BREACHING,
        }).addAlarmAction(new cdk.aws_cloudwatch_actions.SnsAction(this.alertTopic));

        // Both regions down alarm (critical)
        const compositeAlarm = new cloudwatch.CompositeAlarm(this, 'BothRegionsDownAlarm', {
            alarmName: 'Multi-Region-Both-Regions-Down-CRITICAL',
            alarmDescription: 'CRITICAL: Both regions are unhealthy - total outage',
            compositeAlarmRule: cloudwatch.AlarmRule.allOf(
                cloudwatch.AlarmRule.fromAlarm(
                    cloudwatch.Alarm.fromAlarmArn(this, 'PrimaryAlarmRef',
                        `arn:aws:cloudwatch:${props.primaryRegion}:${this.account}:alarm:Multi-Region-Primary-Health-Critical`
                    ),
                    cloudwatch.AlarmState.ALARM
                ),
                cloudwatch.AlarmRule.fromAlarm(
                    cloudwatch.Alarm.fromAlarmArn(this, 'SecondaryAlarmRef',
                        `arn:aws:cloudwatch:${props.secondaryRegion}:${this.account}:alarm:Multi-Region-Secondary-Health-Critical`
                    ),
                    cloudwatch.AlarmState.ALARM
                )
            ),
        });

        compositeAlarm.addAlarmAction(new cdk.aws_cloudwatch_actions.SnsAction(this.alertTopic));
    }

    private createPerformanceAlarms(props: MultiRegionMonitoringProps) {
        // High response time alarm
        new cloudwatch.Alarm(this, 'HighResponseTimeAlarm', {
            alarmName: 'Multi-Region-High-Response-Time',
            alarmDescription: 'API response time is high',
            metric: new cloudwatch.Metric({
                namespace: 'AWS/Route53',
                metricName: 'ConnectionTime',
                dimensionsMap: {
                    HealthCheckId: props.primaryHealthCheckId,
                },
                statistic: 'Average',
            }),
            threshold: 5000, // 5 seconds
            comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            evaluationPeriods: 3,
            datapointsToAlarm: 2,
        }).addAlarmAction(new cdk.aws_cloudwatch_actions.SnsAction(this.alertTopic));

        // CloudFront error rate alarm
        new cloudwatch.Alarm(this, 'CloudFrontErrorRateAlarm', {
            alarmName: 'Multi-Region-CloudFront-Error-Rate',
            alarmDescription: 'CloudFront error rate is high',
            metric: new cloudwatch.Metric({
                namespace: 'AWS/CloudFront',
                metricName: '5xxErrorRate',
                dimensionsMap: {
                    DistributionId: props.distributionId,
                },
                statistic: 'Average',
            }),
            threshold: 5, // 5% error rate
            comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            evaluationPeriods: 2,
            datapointsToAlarm: 2,
        }).addAlarmAction(new cdk.aws_cloudwatch_actions.SnsAction(this.alertTopic));
    }

    private createReplicationAlarms(props: MultiRegionMonitoringProps) {
        // Database replication lag alarm
        new cloudwatch.Alarm(this, 'DatabaseReplicationLagAlarm', {
            alarmName: 'Multi-Region-DB-Replication-Lag',
            alarmDescription: 'Database replication lag is high',
            metric: new cloudwatch.Metric({
                namespace: 'AWS/RDS',
                metricName: 'AuroraGlobalDBReplicationLag',
                dimensionsMap: {
                    DBClusterIdentifier: props.secondaryClusterIdentifier,
                },
                statistic: 'Average',
            }),
            threshold: 60000, // 1 minute in milliseconds
            comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            evaluationPeriods: 2,
            datapointsToAlarm: 2,
        }).addAlarmAction(new cdk.aws_cloudwatch_actions.SnsAction(this.alertTopic));

        // RTO/RPO compliance alarms
        new cloudwatch.Alarm(this, 'RTOComplianceAlarm', {
            alarmName: 'Multi-Region-RTO-Compliance',
            alarmDescription: 'Last failover exceeded RTO target',
            metric: new cloudwatch.Metric({
                namespace: 'Matbakh/MultiRegion',
                metricName: 'FailoverRTO',
                statistic: 'Maximum',
            }),
            threshold: 15, // 15 minutes
            comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            evaluationPeriods: 1,
            treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        }).addAlarmAction(new cdk.aws_cloudwatch_actions.SnsAction(this.alertTopic));

        new cloudwatch.Alarm(this, 'RPOComplianceAlarm', {
            alarmName: 'Multi-Region-RPO-Compliance',
            alarmDescription: 'Last failover exceeded RPO target',
            metric: new cloudwatch.Metric({
                namespace: 'Matbakh/MultiRegion',
                metricName: 'FailoverRPO',
                statistic: 'Maximum',
            }),
            threshold: 1, // 1 minute
            comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            evaluationPeriods: 1,
            treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        }).addAlarmAction(new cdk.aws_cloudwatch_actions.SnsAction(this.alertTopic));
    }

    private createBudgetAlerts(props: MultiRegionMonitoringProps) {
        // Multi-region budget with escalating alerts
        new cdk.aws_budgets.CfnBudget(this, 'MultiRegionBudgetAlerts', {
            budget: {
                budgetName: 'Multi-Region-Infrastructure-Budget-Alerts',
                budgetLimit: {
                    amount: 100, // €100 per month
                    unit: 'EUR',
                },
                timeUnit: 'MONTHLY',
                budgetType: 'COST',
                costFilters: {
                    Region: [props.primaryRegion, props.secondaryRegion],
                    Service: [
                        'Amazon Route 53',
                        'Amazon CloudFront',
                        'Amazon Relational Database Service',
                        'Amazon Simple Storage Service',
                        'AWS Secrets Manager',
                        'AWS Key Management Service',
                    ],
                },
            },
            notificationsWithSubscribers: [
                {
                    notification: {
                        notificationType: 'ACTUAL',
                        comparisonOperator: 'GREATER_THAN',
                        threshold: 50, // Alert at 50%
                        thresholdType: 'PERCENTAGE',
                    },
                    subscribers: [
                        {
                            subscriptionType: 'EMAIL',
                            address: props.alertEmail,
                        },
                    ],
                },
                {
                    notification: {
                        notificationType: 'ACTUAL',
                        comparisonOperator: 'GREATER_THAN',
                        threshold: 80, // Alert at 80%
                        thresholdType: 'PERCENTAGE',
                    },
                    subscribers: [
                        {
                            subscriptionType: 'EMAIL',
                            address: props.alertEmail,
                        },
                    ],
                },
                {
                    notification: {
                        notificationType: 'FORECASTED',
                        comparisonOperator: 'GREATER_THAN',
                        threshold: 200, // Alert if forecasted to exceed €200
                        thresholdType: 'ABSOLUTE_VALUE',
                    },
                    subscribers: [
                        {
                            subscriptionType: 'EMAIL',
                            address: props.alertEmail,
                        },
                    ],
                },
            ],
        });
    }
}