import * as cdk from 'aws-cdk-lib';
import * as applicationautoscaling from 'aws-cdk-lib/aws-applicationautoscaling';
import * as budgets from 'aws-cdk-lib/aws-budgets';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';

export interface AutoScalingStackProps extends cdk.StackProps {
    environment: 'dev' | 'staging' | 'prod';
    budgetLimits: {
        softBudget: number;
        burstBudget: number;
    };
    sloTargets: {
        p95ResponseTime: number;
        errorRate: number;
        availability: number;
    };
}

export class AutoScalingStack extends cdk.Stack {
    private readonly environment: string;
    private readonly budgetLimits: { softBudget: number; burstBudget: number };
    private readonly sloTargets: { p95ResponseTime: number; errorRate: number; availability: number };
    private readonly alarmTopic: sns.Topic;

    constructor(scope: Construct, id: string, props: AutoScalingStackProps) {
        super(scope, id, props);

        this.environment = props.environment;
        this.budgetLimits = props.budgetLimits;
        this.sloTargets = props.sloTargets;

        // Create SNS topic for alerts
        this.alarmTopic = new sns.Topic(this, 'AutoScalingAlarms', {
            topicName: `matbakh-${this.environment}-autoscaling-alarms`,
            displayName: `Matbakh ${this.environment} Auto-Scaling Alerts`
        });

        // Set up budgets
        this.createBudgets();

        // Create auto-scaling dashboard
        this.createAutoScalingDashboard();
    }

    /**
     * Configure Lambda auto-scaling with Provisioned Concurrency
     */
    public configureLambdaAutoScaling(functionArn: string, functionName: string): void {
        const isApiFunction = this.isApiFunction(functionName);
        const isCriticalPath = this.isCriticalPath(functionName);

        // Environment-specific scaling limits
        const scalingLimits = this.getLambdaScalingLimits();

        // Set Reserved Concurrency (cost protection)
        const reservedConcurrency = scalingLimits.reservedConcurrency;

        // Only configure Provisioned Concurrency for critical API functions
        if (isApiFunction && isCriticalPath) {
            this.configureProvisionedConcurrency(functionArn, functionName, scalingLimits);
        }

        // Create CloudWatch alarms for the function
        this.createLambdaAlarms(functionName, functionArn);
    }

    private configureProvisionedConcurrency(
        functionArn: string,
        functionName: string,
        limits: any
    ): void {
        // Create scalable target for provisioned concurrency
        const scalableTarget = new applicationautoscaling.ScalableTarget(
            this,
            `${functionName}-ProvisionedConcurrencyTarget`,
            {
                serviceNamespace: applicationautoscaling.ServiceNamespace.LAMBDA,
                scalableDimension: 'lambda:function:ProvisionedConcurrency',
                resourceId: `function:${functionName}`,
                minCapacity: limits.provisionedConcurrency.min,
                maxCapacity: limits.provisionedConcurrency.max,
            }
        );

        // Target tracking scaling policy
        scalableTarget.scaleToTrackMetric(`${functionName}-PCUtilizationScaling`, {
            targetValue: 70, // 70% utilization target
            predefinedMetric: applicationautoscaling.PredefinedMetric.LAMBDA_PROVISIONED_CONCURRENCY_UTILIZATION,
            scaleInCooldown: cdk.Duration.minutes(5),
            scaleOutCooldown: cdk.Duration.minutes(2),
        });

        // Schedule-based scaling for predictable traffic patterns
        if (this.environment === 'prod') {
            // Scale up during business hours (8 AM - 8 PM CET)
            scalableTarget.scaleOnSchedule(`${functionName}-BusinessHoursScaleUp`, {
                schedule: applicationautoscaling.Schedule.cron({
                    hour: '6', // 8 AM CET = 6 AM UTC
                    minute: '0'
                }),
                minCapacity: Math.max(limits.provisionedConcurrency.min, 5),
                maxCapacity: limits.provisionedConcurrency.max,
            });

            // Scale down during off-hours
            scalableTarget.scaleOnSchedule(`${functionName}-OffHoursScaleDown`, {
                schedule: applicationautoscaling.Schedule.cron({
                    hour: '20', // 10 PM CET = 8 PM UTC
                    minute: '0'
                }),
                minCapacity: limits.provisionedConcurrency.min,
                maxCapacity: limits.provisionedConcurrency.max,
            });
        }
    }

    /**
     * Configure RDS auto-scaling (storage and read replicas)
     */
    public configureRDSAutoScaling(dbInstanceIdentifier: string): void {
        const scalingLimits = this.getRDSScalingLimits();

        // Storage auto-scaling (always enabled)
        // Note: This is typically configured at DB creation time
        // Here we create alarms for manual intervention triggers

        // CPU utilization alarm
        const cpuAlarm = new cloudwatch.Alarm(this, `${dbInstanceIdentifier}-CPUAlarm`, {
            alarmName: `${this.environment}-${dbInstanceIdentifier}-HighCPU`,
            metric: new cloudwatch.Metric({
                namespace: 'AWS/RDS',
                metricName: 'CPUUtilization',
                dimensionsMap: {
                    DBInstanceIdentifier: dbInstanceIdentifier
                },
                statistic: 'Average',
                period: cdk.Duration.minutes(5)
            }),
            threshold: scalingLimits.cpuThreshold,
            evaluationPeriods: 2,
            treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        });

        cpuAlarm.addAlarmAction(new cdk.aws_cloudwatch_actions.SnsAction(this.alarmTopic));

        // Database connections alarm
        const connectionsAlarm = new cloudwatch.Alarm(this, `${dbInstanceIdentifier}-ConnectionsAlarm`, {
            alarmName: `${this.environment}-${dbInstanceIdentifier}-HighConnections`,
            metric: new cloudwatch.Metric({
                namespace: 'AWS/RDS',
                metricName: 'DatabaseConnections',
                dimensionsMap: {
                    DBInstanceIdentifier: dbInstanceIdentifier
                },
                statistic: 'Average',
                period: cdk.Duration.minutes(5)
            }),
            threshold: scalingLimits.connectionThreshold,
            evaluationPeriods: 2,
        });

        connectionsAlarm.addAlarmAction(new cdk.aws_cloudwatch_actions.SnsAction(this.alarmTopic));

        // Freeable memory alarm
        const memoryAlarm = new cloudwatch.Alarm(this, `${dbInstanceIdentifier}-MemoryAlarm`, {
            alarmName: `${this.environment}-${dbInstanceIdentifier}-LowMemory`,
            metric: new cloudwatch.Metric({
                namespace: 'AWS/RDS',
                metricName: 'FreeableMemory',
                dimensionsMap: {
                    DBInstanceIdentifier: dbInstanceIdentifier
                },
                statistic: 'Average',
                period: cdk.Duration.minutes(5)
            }),
            threshold: scalingLimits.memoryThreshold,
            evaluationPeriods: 2,
            comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
        });

        memoryAlarm.addAlarmAction(new cdk.aws_cloudwatch_actions.SnsAction(this.alarmTopic));
    }

    /**
     * Configure ElastiCache auto-scaling
     */
    public configureElastiCacheAutoScaling(replicationGroupId: string): void {
        const scalingLimits = this.getElastiCacheScalingLimits();

        // Create scalable target for replica count
        const scalableTarget = new applicationautoscaling.ScalableTarget(
            this,
            `${replicationGroupId}-ReplicaScalingTarget`,
            {
                serviceNamespace: applicationautoscaling.ServiceNamespace.ELASTICACHE,
                scalableDimension: 'elasticache:replication-group:Replicas',
                resourceId: `replication-group/${replicationGroupId}`,
                minCapacity: scalingLimits.minReplicas,
                maxCapacity: scalingLimits.maxReplicas,
            }
        );

        // CPU-based scaling
        scalableTarget.scaleToTrackMetric(`${replicationGroupId}-CPUScaling`, {
            targetValue: 60, // 60% CPU utilization
            predefinedMetric: applicationautoscaling.PredefinedMetric.ELASTICACHE_PRIMARY_ENGINE_CPU_UTILIZATION,
            scaleInCooldown: cdk.Duration.minutes(10),
            scaleOutCooldown: cdk.Duration.minutes(5),
        });

        // Memory usage alarm
        const memoryAlarm = new cloudwatch.Alarm(this, `${replicationGroupId}-MemoryAlarm`, {
            alarmName: `${this.environment}-${replicationGroupId}-HighMemoryUsage`,
            metric: new cloudwatch.Metric({
                namespace: 'AWS/ElastiCache',
                metricName: 'DatabaseMemoryUsagePercentage',
                dimensionsMap: {
                    ReplicationGroupId: replicationGroupId
                },
                statistic: 'Average',
                period: cdk.Duration.minutes(5)
            }),
            threshold: 75, // 75% memory usage
            evaluationPeriods: 2,
        });

        memoryAlarm.addAlarmAction(new cdk.aws_cloudwatch_actions.SnsAction(this.alarmTopic));

        // Evictions alarm (indicates memory pressure)
        const evictionsAlarm = new cloudwatch.Alarm(this, `${replicationGroupId}-EvictionsAlarm`, {
            alarmName: `${this.environment}-${replicationGroupId}-Evictions`,
            metric: new cloudwatch.Metric({
                namespace: 'AWS/ElastiCache',
                metricName: 'Evictions',
                dimensionsMap: {
                    ReplicationGroupId: replicationGroupId
                },
                statistic: 'Sum',
                period: cdk.Duration.minutes(5)
            }),
            threshold: 0,
            evaluationPeriods: 1,
            comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        });

        evictionsAlarm.addAlarmAction(new cdk.aws_cloudwatch_actions.SnsAction(this.alarmTopic));
    }

    /**
     * Configure CloudFront monitoring and optimization
     */
    public configureCloudFrontMonitoring(distributionId: string): void {
        // Cache hit rate alarm
        const cacheHitRateAlarm = new cloudwatch.Alarm(this, `${distributionId}-CacheHitRateAlarm`, {
            alarmName: `${this.environment}-${distributionId}-LowCacheHitRate`,
            metric: new cloudwatch.Metric({
                namespace: 'AWS/CloudFront',
                metricName: 'CacheHitRate',
                dimensionsMap: {
                    DistributionId: distributionId
                },
                statistic: 'Average',
                period: cdk.Duration.minutes(15)
            }),
            threshold: 85, // 85% cache hit rate minimum
            evaluationPeriods: 2,
            comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
        });

        cacheHitRateAlarm.addAlarmAction(new cdk.aws_cloudwatch_actions.SnsAction(this.alarmTopic));

        // 5xx error rate alarm
        const errorRateAlarm = new cloudwatch.Alarm(this, `${distributionId}-5xxErrorRateAlarm`, {
            alarmName: `${this.environment}-${distributionId}-High5xxErrorRate`,
            metric: new cloudwatch.Metric({
                namespace: 'AWS/CloudFront',
                metricName: '5xxErrorRate',
                dimensionsMap: {
                    DistributionId: distributionId
                },
                statistic: 'Average',
                period: cdk.Duration.minutes(5)
            }),
            threshold: 0.5, // 0.5% error rate
            evaluationPeriods: 2,
        });

        errorRateAlarm.addAlarmAction(new cdk.aws_cloudwatch_actions.SnsAction(this.alarmTopic));

        // Origin latency alarm
        const originLatencyAlarm = new cloudwatch.Alarm(this, `${distributionId}-OriginLatencyAlarm`, {
            alarmName: `${this.environment}-${distributionId}-HighOriginLatency`,
            metric: new cloudwatch.Metric({
                namespace: 'AWS/CloudFront',
                metricName: 'OriginLatency',
                dimensionsMap: {
                    DistributionId: distributionId
                },
                statistic: 'Average',
                period: cdk.Duration.minutes(5)
            }),
            threshold: 300, // 300ms origin latency
            evaluationPeriods: 2,
        });

        originLatencyAlarm.addAlarmAction(new cdk.aws_cloudwatch_actions.SnsAction(this.alarmTopic));
    }

    private createLambdaAlarms(functionName: string, functionArn: string): void {
        // Throttles alarm (should be 0)
        const throttlesAlarm = new cloudwatch.Alarm(this, `${functionName}-ThrottlesAlarm`, {
            alarmName: `${this.environment}-${functionName}-Throttles`,
            metric: new cloudwatch.Metric({
                namespace: 'AWS/Lambda',
                metricName: 'Throttles',
                dimensionsMap: {
                    FunctionName: functionName
                },
                statistic: 'Sum',
                period: cdk.Duration.minutes(5)
            }),
            threshold: 0,
            evaluationPeriods: 1,
            comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        });

        throttlesAlarm.addAlarmAction(new cdk.aws_cloudwatch_actions.SnsAction(this.alarmTopic));

        // Duration P95 alarm
        const durationAlarm = new cloudwatch.Alarm(this, `${functionName}-DurationAlarm`, {
            alarmName: `${this.environment}-${functionName}-HighDuration`,
            metric: new cloudwatch.Metric({
                namespace: 'AWS/Lambda',
                metricName: 'Duration',
                dimensionsMap: {
                    FunctionName: functionName
                },
                statistic: 'p95',
                period: cdk.Duration.minutes(5)
            }),
            threshold: this.sloTargets.p95ResponseTime,
            evaluationPeriods: 2,
        });

        durationAlarm.addAlarmAction(new cdk.aws_cloudwatch_actions.SnsAction(this.alarmTopic));

        // Error rate alarm
        const errorRateAlarm = new cloudwatch.Alarm(this, `${functionName}-ErrorRateAlarm`, {
            alarmName: `${this.environment}-${functionName}-HighErrorRate`,
            metric: new cloudwatch.MathExpression({
                expression: '(errors / invocations) * 100',
                usingMetrics: {
                    errors: new cloudwatch.Metric({
                        namespace: 'AWS/Lambda',
                        metricName: 'Errors',
                        dimensionsMap: { FunctionName: functionName },
                        statistic: 'Sum',
                        period: cdk.Duration.minutes(5)
                    }),
                    invocations: new cloudwatch.Metric({
                        namespace: 'AWS/Lambda',
                        metricName: 'Invocations',
                        dimensionsMap: { FunctionName: functionName },
                        statistic: 'Sum',
                        period: cdk.Duration.minutes(5)
                    })
                },
                period: cdk.Duration.minutes(5)
            }),
            threshold: this.sloTargets.errorRate,
            evaluationPeriods: 2,
        });

        errorRateAlarm.addAlarmAction(new cdk.aws_cloudwatch_actions.SnsAction(this.alarmTopic));
    }

    private createBudgets(): void {
        // Soft budget with 50%, 80%, 100% alerts
        new budgets.CfnBudget(this, 'SoftBudget', {
            budget: {
                budgetName: `matbakh-${this.environment}-soft-budget`,
                budgetLimit: {
                    amount: this.budgetLimits.softBudget,
                    unit: 'USD'
                },
                timeUnit: 'MONTHLY',
                budgetType: 'COST',
                costFilters: {
                    TagKey: ['Environment'],
                    TagValue: [this.environment]
                }
            },
            notificationsWithSubscribers: [
                {
                    notification: {
                        notificationType: 'ACTUAL',
                        comparisonOperator: 'GREATER_THAN',
                        threshold: 50,
                        thresholdType: 'PERCENTAGE'
                    },
                    subscribers: [
                        {
                            subscriptionType: 'SNS',
                            address: this.alarmTopic.topicArn
                        }
                    ]
                },
                {
                    notification: {
                        notificationType: 'ACTUAL',
                        comparisonOperator: 'GREATER_THAN',
                        threshold: 80,
                        thresholdType: 'PERCENTAGE'
                    },
                    subscribers: [
                        {
                            subscriptionType: 'SNS',
                            address: this.alarmTopic.topicArn
                        }
                    ]
                },
                {
                    notification: {
                        notificationType: 'ACTUAL',
                        comparisonOperator: 'GREATER_THAN',
                        threshold: 100,
                        thresholdType: 'PERCENTAGE'
                    },
                    subscribers: [
                        {
                            subscriptionType: 'SNS',
                            address: this.alarmTopic.topicArn
                        }
                    ]
                }
            ]
        });

        // Burst budget (hard limit)
        new budgets.CfnBudget(this, 'BurstBudget', {
            budget: {
                budgetName: `matbakh-${this.environment}-burst-budget`,
                budgetLimit: {
                    amount: this.budgetLimits.burstBudget,
                    unit: 'USD'
                },
                timeUnit: 'MONTHLY',
                budgetType: 'COST',
                costFilters: {
                    TagKey: ['Environment'],
                    TagValue: [this.environment]
                }
            },
            notificationsWithSubscribers: [
                {
                    notification: {
                        notificationType: 'FORECASTED',
                        comparisonOperator: 'GREATER_THAN',
                        threshold: 90,
                        thresholdType: 'PERCENTAGE'
                    },
                    subscribers: [
                        {
                            subscriptionType: 'SNS',
                            address: this.alarmTopic.topicArn
                        }
                    ]
                }
            ]
        });
    }

    private createAutoScalingDashboard(): void {
        const dashboard = new cloudwatch.Dashboard(this, 'AutoScalingDashboard', {
            dashboardName: `matbakh-${this.environment}-autoscaling`,
            defaultInterval: cdk.Duration.hours(1)
        });

        // Lambda metrics row
        dashboard.addWidgets(
            new cloudwatch.GraphWidget({
                title: 'Lambda Concurrency & Duration',
                left: [
                    new cloudwatch.Metric({
                        namespace: 'AWS/Lambda',
                        metricName: 'ConcurrentExecutions',
                        statistic: 'Maximum'
                    })
                ],
                right: [
                    new cloudwatch.Metric({
                        namespace: 'AWS/Lambda',
                        metricName: 'Duration',
                        statistic: 'p95'
                    })
                ]
            }),
            new cloudwatch.GraphWidget({
                title: 'Lambda Errors & Throttles',
                left: [
                    new cloudwatch.Metric({
                        namespace: 'AWS/Lambda',
                        metricName: 'Errors',
                        statistic: 'Sum'
                    })
                ],
                right: [
                    new cloudwatch.Metric({
                        namespace: 'AWS/Lambda',
                        metricName: 'Throttles',
                        statistic: 'Sum'
                    })
                ]
            })
        );

        // RDS metrics row
        dashboard.addWidgets(
            new cloudwatch.GraphWidget({
                title: 'RDS CPU & Memory',
                left: [
                    new cloudwatch.Metric({
                        namespace: 'AWS/RDS',
                        metricName: 'CPUUtilization',
                        statistic: 'Average'
                    })
                ],
                right: [
                    new cloudwatch.Metric({
                        namespace: 'AWS/RDS',
                        metricName: 'FreeableMemory',
                        statistic: 'Average'
                    })
                ]
            }),
            new cloudwatch.GraphWidget({
                title: 'RDS Connections',
                left: [
                    new cloudwatch.Metric({
                        namespace: 'AWS/RDS',
                        metricName: 'DatabaseConnections',
                        statistic: 'Average'
                    })
                ]
            })
        );

        // ElastiCache metrics row
        dashboard.addWidgets(
            new cloudwatch.GraphWidget({
                title: 'ElastiCache CPU & Memory',
                left: [
                    new cloudwatch.Metric({
                        namespace: 'AWS/ElastiCache',
                        metricName: 'EngineCPUUtilization',
                        statistic: 'Average'
                    })
                ],
                right: [
                    new cloudwatch.Metric({
                        namespace: 'AWS/ElastiCache',
                        metricName: 'DatabaseMemoryUsagePercentage',
                        statistic: 'Average'
                    })
                ]
            }),
            new cloudwatch.GraphWidget({
                title: 'ElastiCache Operations',
                left: [
                    new cloudwatch.Metric({
                        namespace: 'AWS/ElastiCache',
                        metricName: 'CacheHits',
                        statistic: 'Sum'
                    }),
                    new cloudwatch.Metric({
                        namespace: 'AWS/ElastiCache',
                        metricName: 'CacheMisses',
                        statistic: 'Sum'
                    })
                ]
            })
        );

        // CloudFront metrics row
        dashboard.addWidgets(
            new cloudwatch.GraphWidget({
                title: 'CloudFront Cache Performance',
                left: [
                    new cloudwatch.Metric({
                        namespace: 'AWS/CloudFront',
                        metricName: 'CacheHitRate',
                        statistic: 'Average'
                    })
                ],
                right: [
                    new cloudwatch.Metric({
                        namespace: 'AWS/CloudFront',
                        metricName: 'OriginLatency',
                        statistic: 'Average'
                    })
                ]
            }),
            new cloudwatch.GraphWidget({
                title: 'CloudFront Errors',
                left: [
                    new cloudwatch.Metric({
                        namespace: 'AWS/CloudFront',
                        metricName: '4xxErrorRate',
                        statistic: 'Average'
                    }),
                    new cloudwatch.Metric({
                        namespace: 'AWS/CloudFront',
                        metricName: '5xxErrorRate',
                        statistic: 'Average'
                    })
                ]
            })
        );
    }

    private getLambdaScalingLimits() {
        const limits = {
            dev: {
                reservedConcurrency: 10,
                provisionedConcurrency: { min: 0, max: 2 }
            },
            staging: {
                reservedConcurrency: 50,
                provisionedConcurrency: { min: 1, max: 5 }
            },
            prod: {
                reservedConcurrency: 200,
                provisionedConcurrency: { min: 2, max: 20 }
            }
        };
        return limits[this.environment as keyof typeof limits];
    }

    private getRDSScalingLimits() {
        const limits = {
            dev: {
                cpuThreshold: 80,
                connectionThreshold: 50,
                memoryThreshold: 1000000000 // 1GB in bytes
            },
            staging: {
                cpuThreshold: 70,
                connectionThreshold: 80,
                memoryThreshold: 2000000000 // 2GB in bytes
            },
            prod: {
                cpuThreshold: 60,
                connectionThreshold: 100,
                memoryThreshold: 4000000000 // 4GB in bytes
            }
        };
        return limits[this.environment as keyof typeof limits];
    }

    private getElastiCacheScalingLimits() {
        const limits = {
            dev: {
                minReplicas: 0,
                maxReplicas: 1
            },
            staging: {
                minReplicas: 0,
                maxReplicas: 2
            },
            prod: {
                minReplicas: 1,
                maxReplicas: 3
            }
        };
        return limits[this.environment as keyof typeof limits];
    }

    private isApiFunction(functionName: string): boolean {
        const apiPatterns = [
            'api', 'http', 'rest', 'graphql', 'endpoint',
            'persona', 'vc-', 'upload', 'auth'
        ];
        return apiPatterns.some(pattern =>
            functionName.toLowerCase().includes(pattern)
        );
    }

    private isCriticalPath(functionName: string): boolean {
        const criticalPatterns = [
            'persona', 'vc-start', 'vc-result', 'auth', 'upload'
        ];
        return criticalPatterns.some(pattern =>
            functionName.toLowerCase().includes(pattern)
        );
    }
}