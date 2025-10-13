/**
 * CloudWatch Evidently Stack for System Optimization
 *
 * Implements:
 * - Evidently project for system optimization
 * - Feature flags for performance optimizations
 * - A/B testing experiments
 * - IAM roles and permissions
 * - CloudWatch monitoring integration
 */

import * as cdk from "aws-cdk-lib";
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";
import * as evidently from "aws-cdk-lib/aws-evidently";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as logs from "aws-cdk-lib/aws-logs";
import { Construct } from "constructs";

export interface EvidentlyOptimizationStackProps extends cdk.StackProps {
  environment: "development" | "staging" | "production";
  projectName?: string;
}

export class EvidentlyOptimizationStack extends cdk.Stack {
  readonly project: evidently.CfnProject;
  readonly evidentlyRole: iam.Role;
  readonly logGroup: logs.LogGroup;
  readonly initializerLambda: lambda.Function;

  constructor(
    scope: Construct,
    id: string,
    props: EvidentlyOptimizationStackProps
  ) {
    super(scope, id, props);

    const projectName = props.projectName || "matbakh-system-optimization";

    // 1. Create Evidently project
    this.createEvidentlyProject(projectName, props.environment);

    // 2. Create IAM role for Evidently access
    this.createEvidentlyRole();

    // 3. Create CloudWatch logging
    this.createLogging();

    // 4. Create optimization features
    this.createOptimizationFeatures(projectName);

    // 5. Create Lambda for initialization and management
    this.createInitializerLambda(projectName, props.environment);

    // 6. Create CloudWatch dashboards and alarms
    this.createMonitoring(projectName);

    // 7. Outputs
    this.createOutputs(projectName);
  }

  private createEvidentlyProject(
    projectName: string,
    environment: string
  ): void {
    this.project = new evidently.CfnProject(this, "OptimizationProject", {
      name: projectName,
      description: `System optimization A/B testing and feature flags for ${environment}`,
      tags: [
        {
          key: "Environment",
          value: environment,
        },
        {
          key: "Purpose",
          value: "SystemOptimization",
        },
        {
          key: "Team",
          value: "Engineering",
        },
      ],
    });
  }

  private createEvidentlyRole(): void {
    this.evidentlyRole = new iam.Role(this, "EvidentlyRole", {
      roleName: `evidently-optimization-role-${this.stackName}`,
      assumedBy: new iam.CompositePrincipal(
        new iam.ServicePrincipal("lambda.amazonaws.com"),
        new iam.ServicePrincipal("ecs-tasks.amazonaws.com")
      ),
      description: "Role for CloudWatch Evidently optimization access",
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSLambdaBasicExecutionRole"
        ),
      ],
    });

    // Evidently permissions
    this.evidentlyRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "evidently:EvaluateFeature",
          "evidently:BatchEvaluateFeature",
          "evidently:PutProjectEvents",
          "evidently:GetProject",
          "evidently:GetFeature",
          "evidently:GetExperiment",
          "evidently:ListFeatures",
          "evidently:ListExperiments",
          "evidently:CreateFeature",
          "evidently:UpdateFeature",
          "evidently:CreateExperiment",
          "evidently:StartExperiment",
          "evidently:StopExperiment",
          "evidently:UpdateExperiment",
        ],
        resources: [this.project.attrArn, `${this.project.attrArn}/*`],
      })
    );

    // CloudWatch Logs permissions
    this.evidentlyRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams",
        ],
        resources: [
          `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/evidently/*`,
          `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/lambda/evidently-*`,
        ],
      })
    );

    // CloudWatch Metrics permissions
    this.evidentlyRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "cloudwatch:PutMetricData",
          "cloudwatch:GetMetricStatistics",
          "cloudwatch:ListMetrics",
        ],
        resources: ["*"],
      })
    );
  }

  private createLogging(): void {
    this.logGroup = new logs.LogGroup(this, "EvidentlyLogGroup", {
      logGroupName: "/aws/evidently/system-optimization",
      retention: logs.RetentionDays.THIRTY_DAYS,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Metric filters for experiment tracking
    new logs.MetricFilter(this, "FeatureEvaluationMetric", {
      logGroup: this.logGroup,
      metricNamespace: "Evidently/SystemOptimization",
      metricName: "FeatureEvaluations",
      filterPattern: logs.FilterPattern.stringValue(
        "$.action",
        "=",
        "evaluateFeature"
      ),
      metricValue: "1",
      defaultValue: 0,
    });

    new logs.MetricFilter(this, "ExperimentMetric", {
      logGroup: this.logGroup,
      metricNamespace: "Evidently/SystemOptimization",
      metricName: "ExperimentEvents",
      filterPattern: logs.FilterPattern.stringValue(
        "$.type",
        "=",
        "experiment"
      ),
      metricValue: "1",
      defaultValue: 0,
    });

    new logs.MetricFilter(this, "PerformanceMetric", {
      logGroup: this.logGroup,
      metricNamespace: "Evidently/SystemOptimization",
      metricName: "PerformanceEvents",
      filterPattern: logs.FilterPattern.stringValue(
        "$.metricType",
        "=",
        "performance"
      ),
      metricValue: "$.value",
      defaultValue: 0,
    });
  }

  private createOptimizationFeatures(projectName: string): void {
    // Bundle Optimization Feature
    new evidently.CfnFeature(this, "BundleOptimizationFeature", {
      project: projectName,
      name: "bundle-optimization",
      description: "Enable advanced bundle optimization techniques",
      variations: [
        {
          variationName: "disabled",
          booleanValue: false,
        },
        {
          variationName: "basic",
          stringValue: "basic",
        },
        {
          variationName: "advanced",
          stringValue: "advanced",
        },
      ],
      defaultVariation: "disabled",
      evaluationStrategy: "ALL_RULES",
      tags: [
        {
          key: "Type",
          value: "Optimization",
        },
        {
          key: "Category",
          value: "Bundle",
        },
      ],
    });

    // Caching Strategy Feature
    new evidently.CfnFeature(this, "CachingStrategyFeature", {
      project: projectName,
      name: "caching-strategy",
      description: "Select caching strategy for performance optimization",
      variations: [
        {
          variationName: "none",
          stringValue: "none",
        },
        {
          variationName: "memory",
          stringValue: "memory",
        },
        {
          variationName: "redis",
          stringValue: "redis",
        },
        {
          variationName: "hybrid",
          stringValue: "hybrid",
        },
      ],
      defaultVariation: "memory",
      evaluationStrategy: "ALL_RULES",
      tags: [
        {
          key: "Type",
          value: "Optimization",
        },
        {
          key: "Category",
          value: "Caching",
        },
      ],
    });

    // Lazy Loading Feature
    new evidently.CfnFeature(this, "LazyLoadingFeature", {
      project: projectName,
      name: "lazy-loading",
      description: "Enable lazy loading for components and routes",
      variations: [
        {
          variationName: "disabled",
          booleanValue: false,
        },
        {
          variationName: "routes",
          stringValue: "routes",
        },
        {
          variationName: "components",
          stringValue: "components",
        },
        {
          variationName: "all",
          stringValue: "all",
        },
      ],
      defaultVariation: "routes",
      evaluationStrategy: "ALL_RULES",
      tags: [
        {
          key: "Type",
          value: "Optimization",
        },
        {
          key: "Category",
          value: "Loading",
        },
      ],
    });

    // Database Optimization Feature
    new evidently.CfnFeature(this, "DatabaseOptimizationFeature", {
      project: projectName,
      name: "database-optimization",
      description: "Enable database query optimization features",
      variations: [
        {
          variationName: "disabled",
          booleanValue: false,
        },
        {
          variationName: "indexing",
          stringValue: "indexing",
        },
        {
          variationName: "pooling",
          stringValue: "pooling",
        },
        {
          variationName: "full",
          stringValue: "full",
        },
      ],
      defaultVariation: "pooling",
      evaluationStrategy: "ALL_RULES",
      tags: [
        {
          key: "Type",
          value: "Optimization",
        },
        {
          key: "Category",
          value: "Database",
        },
      ],
    });
  }

  private createInitializerLambda(
    projectName: string,
    environment: string
  ): void {
    this.initializerLambda = new lambda.Function(
      this,
      "EvidentlyInitializerLambda",
      {
        functionName: `evidently-optimization-initializer-${this.stackName}`,
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: "index.handler",
        timeout: cdk.Duration.minutes(10),
        memorySize: 512,
        code: lambda.Code.fromInline(`
        const { CloudWatchEvidentlyClient, CreateExperimentCommand, StartExperimentCommand } = require('@aws-sdk/client-evidently');
        
        const evidently = new CloudWatchEvidentlyClient({ region: process.env.AWS_REGION });
        
        exports.handler = async (event) => {
          console.log('Initializing Evidently optimization experiments for environment: ${environment}');
          
          const projectName = '${projectName}';
          
          try {
            // Create bundle optimization experiment
            const bundleExperiment = {
              project: projectName,
              name: 'bundle-size-optimization',
              description: 'Test different bundle optimization strategies',
              treatments: [
                {
                  name: 'control',
                  description: 'No optimization',
                  feature: 'bundle-optimization',
                  variation: 'disabled'
                },
                {
                  name: 'treatment',
                  description: 'Advanced optimization',
                  feature: 'bundle-optimization',
                  variation: 'advanced'
                }
              ],
              metricGoals: [
                {
                  metricName: 'bundleSize',
                  desiredChange: 'DECREASE'
                },
                {
                  metricName: 'loadTime',
                  desiredChange: 'DECREASE'
                }
              ],
              randomizationSalt: 'bundle-optimization-salt',
              samplingRate: 200, // 20% of users
              tags: {
                Type: 'SystemOptimization',
                Duration: '14',
                CreatedBy: 'Initializer'
              }
            };
            
            try {
              await evidently.send(new CreateExperimentCommand(bundleExperiment));
              console.log('Created bundle optimization experiment');
            } catch (error) {
              if (error.name !== 'ResourceAlreadyExistsException') {
                console.error('Failed to create bundle experiment:', error);
              }
            }
            
            // Create caching performance experiment
            const cachingExperiment = {
              project: projectName,
              name: 'caching-performance-test',
              description: 'Compare caching strategies for performance impact',
              treatments: [
                {
                  name: 'memory-only',
                  description: 'Memory caching only',
                  feature: 'caching-strategy',
                  variation: 'memory'
                },
                {
                  name: 'redis-only',
                  description: 'Redis caching only',
                  feature: 'caching-strategy',
                  variation: 'redis'
                },
                {
                  name: 'hybrid',
                  description: 'Hybrid caching strategy',
                  feature: 'caching-strategy',
                  variation: 'hybrid'
                }
              ],
              metricGoals: [
                {
                  metricName: 'cacheHitRate',
                  desiredChange: 'INCREASE'
                },
                {
                  metricName: 'renderTime',
                  desiredChange: 'DECREASE'
                }
              ],
              randomizationSalt: 'caching-performance-salt',
              samplingRate: 300, // 30% of users
              tags: {
                Type: 'SystemOptimization',
                Duration: '21',
                CreatedBy: 'Initializer'
              }
            };
            
            try {
              await evidently.send(new CreateExperimentCommand(cachingExperiment));
              console.log('Created caching performance experiment');
            } catch (error) {
              if (error.name !== 'ResourceAlreadyExistsException') {
                console.error('Failed to create caching experiment:', error);
              }
            }
            
            return {
              statusCode: 200,
              body: JSON.stringify({
                message: 'Evidently optimization experiments initialized successfully',
                projectName,
                environment: '${environment}'
              })
            };
          } catch (error) {
            console.error('Failed to initialize experiments:', error);
            return {
              statusCode: 500,
              body: JSON.stringify({
                error: error.message
              })
            };
          }
        };
      `),
        environment: {
          PROJECT_NAME: projectName,
          ENVIRONMENT: environment,
          LOG_GROUP_NAME: this.logGroup.logGroupName,
        },
        role: this.evidentlyRole,
      }
    );

    // Trigger initialization on stack deployment
    new events.Rule(this, "InitializationRule", {
      schedule: events.Schedule.expression("rate(1 day)"), // Daily check
      targets: [new targets.LambdaFunction(this.initializerLambda)],
      description: "Daily Evidently optimization initialization check",
    });
  }

  private createMonitoring(projectName: string): void {
    // CloudWatch Dashboard for Evidently metrics
    const dashboard = new cloudwatch.Dashboard(this, "EvidentlyDashboard", {
      dashboardName: `evidently-optimization-${this.stackName}`,
      defaultInterval: cdk.Duration.hours(1),
    });

    // Feature evaluation metrics
    const featureEvaluationsWidget = new cloudwatch.GraphWidget({
      title: "Feature Evaluations",
      left: [
        new cloudwatch.Metric({
          namespace: "Evidently/SystemOptimization",
          metricName: "FeatureEvaluations",
          statistic: "Sum",
        }),
      ],
      width: 12,
      height: 6,
    });

    // Experiment metrics
    const experimentEventsWidget = new cloudwatch.GraphWidget({
      title: "Experiment Events",
      left: [
        new cloudwatch.Metric({
          namespace: "Evidently/SystemOptimization",
          metricName: "ExperimentEvents",
          statistic: "Sum",
        }),
      ],
      width: 12,
      height: 6,
    });

    // Performance metrics
    const performanceWidget = new cloudwatch.GraphWidget({
      title: "Performance Metrics",
      left: [
        new cloudwatch.Metric({
          namespace: "Evidently/SystemOptimization",
          metricName: "PerformanceEvents",
          statistic: "Average",
        }),
      ],
      width: 12,
      height: 6,
    });

    dashboard.addWidgets(
      featureEvaluationsWidget,
      experimentEventsWidget,
      performanceWidget
    );

    // Alarms for monitoring
    new cloudwatch.Alarm(this, "HighFeatureEvaluationAlarm", {
      alarmName: `evidently-high-evaluations-${this.stackName}`,
      alarmDescription: "High number of feature evaluations detected",
      metric: new cloudwatch.Metric({
        namespace: "Evidently/SystemOptimization",
        metricName: "FeatureEvaluations",
        statistic: "Sum",
      }),
      threshold: 10000,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });

    new cloudwatch.Alarm(this, "LowExperimentActivityAlarm", {
      alarmName: `evidently-low-activity-${this.stackName}`,
      alarmDescription: "Low experiment activity detected",
      metric: new cloudwatch.Metric({
        namespace: "Evidently/SystemOptimization",
        metricName: "ExperimentEvents",
        statistic: "Sum",
      }),
      threshold: 10,
      evaluationPeriods: 3,
      comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.BREACHING,
    });
  }

  private createOutputs(projectName: string): void {
    new cdk.CfnOutput(this, "EvidentlyProjectName", {
      value: projectName,
      exportName: `evidently-project-name-${this.stackName}`,
      description: "Name of the Evidently project for system optimization",
    });

    new cdk.CfnOutput(this, "EvidentlyProjectArn", {
      value: this.project.attrArn,
      exportName: `evidently-project-arn-${this.stackName}`,
      description: "ARN of the Evidently project",
    });

    new cdk.CfnOutput(this, "EvidentlyRoleArn", {
      value: this.evidentlyRole.roleArn,
      exportName: `evidently-role-arn-${this.stackName}`,
      description: "ARN of the Evidently IAM role",
    });

    new cdk.CfnOutput(this, "EvidentlyLogGroupName", {
      value: this.logGroup.logGroupName,
      exportName: `evidently-log-group-${this.stackName}`,
      description: "Name of the Evidently CloudWatch Log Group",
    });

    new cdk.CfnOutput(this, "InitializerLambdaArn", {
      value: this.initializerLambda.functionArn,
      exportName: `evidently-initializer-arn-${this.stackName}`,
      description: "ARN of the Evidently initializer Lambda function",
    });
  }
}
