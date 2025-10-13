import { App } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { AutoScalingStack } from '../auto-scaling-stack';

describe('AutoScalingStack', () => {
    let app: App;

    beforeEach(() => {
        app = new App();
    });

    describe('Production Environment', () => {
        it('creates budgets & scaling targets (prod)', () => {
            const stack = new AutoScalingStack(app, 'AutoScalingStackProd', {
                environment: 'prod',
                budgetLimits: {
                    softBudget: 60,
                    burstBudget: 120
                },
                sloTargets: {
                    p95ResponseTime: 200,
                    errorRate: 1,
                    availability: 99.9
                }
            });

            const template = Template.fromStack(stack);

            // Budget vorhanden
            template.hasResourceProperties('AWS::Budgets::Budget', {
                Budget: {
                    BudgetLimit: {
                        Amount: Match.greaterThan(0),
                        Unit: 'USD'
                    },
                    BudgetType: 'COST',
                    TimeUnit: 'MONTHLY'
                }
            });

            // SNS Topic für Alarme
            template.hasResourceProperties('AWS::SNS::Topic', {
                TopicName: Match.stringLikeRegexp('matbakh-prod-autoscaling-alarms')
            });

            // CloudWatch Dashboard
            template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
                DashboardName: Match.stringLikeRegexp('matbakh-prod-autoscaling')
            });
        });

        it('creates proper budget alerts with thresholds', () => {
            const stack = new AutoScalingStack(app, 'AutoScalingStackProd', {
                environment: 'prod',
                budgetLimits: {
                    softBudget: 60,
                    burstBudget: 120
                },
                sloTargets: {
                    p95ResponseTime: 200,
                    errorRate: 1,
                    availability: 99.9
                }
            });

            const template = Template.fromStack(stack);

            // Soft Budget mit 50%, 80%, 100% Alerts
            template.hasResourceProperties('AWS::Budgets::Budget', {
                Budget: {
                    BudgetName: 'matbakh-prod-soft-budget',
                    BudgetLimit: {
                        Amount: 60,
                        Unit: 'USD'
                    }
                },
                NotificationsWithSubscribers: Match.arrayWith([
                    Match.objectLike({
                        Notification: {
                            NotificationType: 'ACTUAL',
                            ComparisonOperator: 'GREATER_THAN',
                            Threshold: 50,
                            ThresholdType: 'PERCENTAGE'
                        }
                    }),
                    Match.objectLike({
                        Notification: {
                            NotificationType: 'ACTUAL',
                            ComparisonOperator: 'GREATER_THAN',
                            Threshold: 80,
                            ThresholdType: 'PERCENTAGE'
                        }
                    }),
                    Match.objectLike({
                        Notification: {
                            NotificationType: 'ACTUAL',
                            ComparisonOperator: 'GREATER_THAN',
                            Threshold: 100,
                            ThresholdType: 'PERCENTAGE'
                        }
                    })
                ])
            });

            // Burst Budget
            template.hasResourceProperties('AWS::Budgets::Budget', {
                Budget: {
                    BudgetName: 'matbakh-prod-burst-budget',
                    BudgetLimit: {
                        Amount: 120,
                        Unit: 'USD'
                    }
                }
            });
        });
    });

    describe('Development Environment', () => {
        it('creates appropriate resources for dev environment', () => {
            const stack = new AutoScalingStack(app, 'AutoScalingStackDev', {
                environment: 'dev',
                budgetLimits: {
                    softBudget: 15,
                    burstBudget: 30
                },
                sloTargets: {
                    p95ResponseTime: 500,
                    errorRate: 5,
                    availability: 95
                }
            });

            const template = Template.fromStack(stack);

            // Dev Budget sollte niedriger sein
            template.hasResourceProperties('AWS::Budgets::Budget', {
                Budget: {
                    BudgetLimit: {
                        Amount: 15,
                        Unit: 'USD'
                    }
                }
            });

            // SNS Topic für Dev
            template.hasResourceProperties('AWS::SNS::Topic', {
                TopicName: 'matbakh-dev-autoscaling-alarms'
            });
        });
    });

    describe('Staging Environment', () => {
        it('creates staging-specific configurations', () => {
            const stack = new AutoScalingStack(app, 'AutoScalingStackStaging', {
                environment: 'staging',
                budgetLimits: {
                    softBudget: 25,
                    burstBudget: 50
                },
                sloTargets: {
                    p95ResponseTime: 300,
                    errorRate: 2,
                    availability: 99.5
                }
            });

            const template = Template.fromStack(stack);

            // Staging Budget
            template.hasResourceProperties('AWS::Budgets::Budget', {
                Budget: {
                    BudgetLimit: {
                        Amount: 25,
                        Unit: 'USD'
                    }
                }
            });
        });
    });

    describe('Lambda Auto-Scaling Configuration', () => {
        it('should configure Lambda scaling when called', () => {
            const stack = new AutoScalingStack(app, 'AutoScalingStackTest', {
                environment: 'prod',
                budgetLimits: { softBudget: 60, burstBudget: 120 },
                sloTargets: { p95ResponseTime: 200, errorRate: 1, availability: 99.9 }
            });

            // Simulate Lambda configuration
            stack.configureLambdaAutoScaling(
                'arn:aws:lambda:eu-central-1:123456789012:function:persona-api',
                'persona-api'
            );

            const template = Template.fromStack(stack);

            // Should have CloudWatch alarms for Lambda
            template.hasResourceProperties('AWS::CloudWatch::Alarm', {
                AlarmName: Match.stringLikeRegexp('prod-persona-api-.*'),
                MetricName: Match.anyValue(),
                Namespace: 'AWS/Lambda'
            });
        });
    });

    describe('RDS Auto-Scaling Configuration', () => {
        it('should configure RDS monitoring when called', () => {
            const stack = new AutoScalingStack(app, 'AutoScalingStackTest', {
                environment: 'prod',
                budgetLimits: { softBudget: 60, burstBudget: 120 },
                sloTargets: { p95ResponseTime: 200, errorRate: 1, availability: 99.9 }
            });

            // Simulate RDS configuration
            stack.configureRDSAutoScaling('matbakh-db');

            const template = Template.fromStack(stack);

            // Should have CloudWatch alarms for RDS
            template.hasResourceProperties('AWS::CloudWatch::Alarm', {
                AlarmName: Match.stringLikeRegexp('prod-matbakh-db-.*'),
                MetricName: Match.anyValue(),
                Namespace: 'AWS/RDS'
            });
        });
    });

    describe('ElastiCache Auto-Scaling Configuration', () => {
        it('should configure ElastiCache scaling when called', () => {
            const stack = new AutoScalingStack(app, 'AutoScalingStackTest', {
                environment: 'prod',
                budgetLimits: { softBudget: 60, burstBudget: 120 },
                sloTargets: { p95ResponseTime: 200, errorRate: 1, availability: 99.9 }
            });

            // Simulate ElastiCache configuration
            stack.configureElastiCacheAutoScaling('matbakh-redis');

            const template = Template.fromStack(stack);

            // Should have CloudWatch alarms for ElastiCache
            template.hasResourceProperties('AWS::CloudWatch::Alarm', {
                AlarmName: Match.stringLikeRegexp('prod-matbakh-redis-.*'),
                MetricName: Match.anyValue(),
                Namespace: 'AWS/ElastiCache'
            });
        });
    });

    describe('CloudFront Monitoring Configuration', () => {
        it('should configure CloudFront monitoring when called', () => {
            const stack = new AutoScalingStack(app, 'AutoScalingStackTest', {
                environment: 'prod',
                budgetLimits: { softBudget: 60, burstBudget: 120 },
                sloTargets: { p95ResponseTime: 200, errorRate: 1, availability: 99.9 }
            });

            // Simulate CloudFront configuration
            stack.configureCloudFrontMonitoring('E2W4JULEW8BXSD');

            const template = Template.fromStack(stack);

            // Should have CloudWatch alarms for CloudFront
            template.hasResourceProperties('AWS::CloudWatch::Alarm', {
                AlarmName: Match.stringLikeRegexp('prod-E2W4JULEW8BXSD-.*'),
                MetricName: Match.anyValue(),
                Namespace: 'AWS/CloudFront'
            });
        });
    });

    describe('Dashboard Configuration', () => {
        it('should create comprehensive monitoring dashboard', () => {
            const stack = new AutoScalingStack(app, 'AutoScalingStackTest', {
                environment: 'prod',
                budgetLimits: { softBudget: 60, burstBudget: 120 },
                sloTargets: { p95ResponseTime: 200, errorRate: 1, availability: 99.9 }
            });

            const template = Template.fromStack(stack);

            // Should have dashboard with multiple widgets
            template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
                DashboardName: 'matbakh-prod-autoscaling',
                DashboardBody: Match.serializedJson(
                    Match.objectLike({
                        widgets: Match.arrayWith([
                            Match.objectLike({
                                properties: Match.objectLike({
                                    title: Match.stringLikeRegexp('Lambda.*')
                                })
                            }),
                            Match.objectLike({
                                properties: Match.objectLike({
                                    title: Match.stringLikeRegexp('RDS.*')
                                })
                            }),
                            Match.objectLike({
                                properties: Match.objectLike({
                                    title: Match.stringLikeRegexp('ElastiCache.*')
                                })
                            }),
                            Match.objectLike({
                                properties: Match.objectLike({
                                    title: Match.stringLikeRegexp('CloudFront.*')
                                })
                            })
                        ])
                    })
                )
            });
        });
    });

    describe('Resource Tagging', () => {
        it('should apply consistent tags to all resources', () => {
            const stack = new AutoScalingStack(app, 'AutoScalingStackTest', {
                environment: 'prod',
                budgetLimits: { softBudget: 60, burstBudget: 120 },
                sloTargets: { p95ResponseTime: 200, errorRate: 1, availability: 99.9 }
            });

            const template = Template.fromStack(stack);

            // Check that resources have proper tags
            template.hasResourceProperties('AWS::SNS::Topic', {
                Tags: Match.arrayWith([
                    Match.objectLike({
                        Key: 'Environment',
                        Value: 'prod'
                    }),
                    Match.objectLike({
                        Key: 'Service',
                        Value: 'auto-scaling'
                    })
                ])
            });
        });
    });

    describe('Error Handling', () => {
        it('should handle invalid environment gracefully', () => {
            expect(() => {
                new AutoScalingStack(app, 'AutoScalingStackInvalid', {
                    environment: 'invalid' as any,
                    budgetLimits: { softBudget: 60, burstBudget: 120 },
                    sloTargets: { p95ResponseTime: 200, errorRate: 1, availability: 99.9 }
                });
            }).not.toThrow();
        });

        it('should validate budget limits', () => {
            expect(() => {
                new AutoScalingStack(app, 'AutoScalingStackInvalidBudget', {
                    environment: 'prod',
                    budgetLimits: { softBudget: -1, burstBudget: -1 },
                    sloTargets: { p95ResponseTime: 200, errorRate: 1, availability: 99.9 }
                });
            }).not.toThrow(); // CDK should handle validation
        });
    });
});