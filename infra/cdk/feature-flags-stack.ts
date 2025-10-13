/**
 * Feature Flags Infrastructure Stack
 * 
 * Implements:
 * - SSM Parameter Store for primary flag storage
 * - DynamoDB table for fallback flag storage
 * - IAM roles for flag access
 * - CloudWatch monitoring for flag usage
 */

import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

export interface FeatureFlagsStackProps extends cdk.StackProps {
    environment: 'development' | 'staging' | 'production';
}

export class FeatureFlagsStack extends cdk.Stack {
    readonly flagsTable: dynamodb.Table;
    readonly flagsRole: iam.Role;
    readonly flagsLogGroup: logs.LogGroup;
    readonly flagInitializerLambda: lambda.Function;

    constructor(scope: Construct, id: string, props: FeatureFlagsStackProps) {
        super(scope, id, props);

        // 1. DynamoDB table for fallback flag storage
        this.createFlagsTable();

        // 2. SSM Parameters for primary flag storage
        this.createDefaultFlags(props.environment);

        // 3. IAM role for flag access
        this.createFlagsRole();

        // 4. CloudWatch logging
        this.createLogging();

        // 5. Flag initializer Lambda
        this.createFlagInitializer(props.environment);

        // 6. Outputs
        this.createOutputs();
    }

    private createFlagsTable(): void {
        this.flagsTable = new dynamodb.Table(this, 'FeatureFlagsTable', {
            tableName: `ai-orchestrator-feature-flags-${this.stackName}`,
            partitionKey: {
                name: 'flagName',
                type: dynamodb.AttributeType.STRING
            },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            timeToLiveAttribute: 'ttl',
            pointInTimeRecovery: true,
            removalPolicy: cdk.RemovalPolicy.DESTROY, // For non-prod environments
            tags: [
                {
                    key: 'Purpose',
                    value: 'AI-Orchestrator-Feature-Flags'
                },
                {
                    key: 'Environment',
                    value: this.stackName
                }
            ]
        });

        // Add GSI for querying by category if needed
        this.flagsTable.addGlobalSecondaryIndex({
            indexName: 'CategoryIndex',
            partitionKey: {
                name: 'category',
                type: dynamodb.AttributeType.STRING
            },
            sortKey: {
                name: 'flagName',
                type: dynamodb.AttributeType.STRING
            }
        });
    }

    private createDefaultFlags(environment: string): void {
        const flagPrefix = '/ai-orchestrator/flags/';

        // Define default flags based on environment
        const defaultFlags = this.getDefaultFlagsForEnvironment(environment);

        // Create SSM parameters for each flag
        Object.entries(defaultFlags).forEach(([flagName, defaultValue]) => {
            new ssm.StringParameter(this, `Flag-${flagName.replace(/\./g, '-')}`, {
                parameterName: `${flagPrefix}${flagName}`,
                stringValue: this.stringifyValue(defaultValue),
                description: `AI Orchestrator feature flag: ${flagName}`,
                tier: ssm.ParameterTier.STANDARD,
                allowedPattern: '.*' // Allow any value
            });
        });
    }

    private getDefaultFlagsForEnvironment(environment: string): Record<string, any> {
        const baseFlags = {
            'ai.egress.enabled': false,
            'ai.provider.bedrock.enabled': false,
            'ai.provider.google.enabled': false,
            'ai.provider.meta.enabled': false,
            'ai.guardrails.mode': 'off',
            'ai.bandit.mode': 'off',
            'ai.streaming.enabled': false,
            'ai.budget.enforce': false,
            'ai.ratelimit.enforce': false,
            'ai.sagemaker.pipeline.enabled': false,
            'ai.killswitch.bedrock.claude': false,
            'ai.killswitch.google.gemini': false,
            'ai.killswitch.meta.llama': false,
            'ai.killswitch.route.chat': false,
            'ai.killswitch.route.completion': false,
            'ai.killswitch.route.embedding': false,
            'ai.eu.residency.enforce': true,
            'ai.pii.redaction.enabled': true,
            'ai.audit.logging.enabled': true,
            'ai.cache.enabled': true,
            'ai.compression.enabled': false,
            'ai.monitoring.detailed': false
        };

        // Environment-specific overrides
        switch (environment) {
            case 'development':
                return {
                    ...baseFlags,
                    'ai.monitoring.detailed': true,
                    'ai.audit.logging.enabled': true
                };

            case 'staging':
                return {
                    ...baseFlags,
                    'ai.egress.enabled': true, // Enable for testing
                    'ai.provider.bedrock.enabled': true, // Enable Bedrock for staging
                    'ai.guardrails.mode': 'log-only',
                    'ai.monitoring.detailed': true
                };

            case 'production':
                return {
                    ...baseFlags,
                    'ai.budget.enforce': true,
                    'ai.ratelimit.enforce': true,
                    'ai.guardrails.mode': 'block'
                };

            default:
                return baseFlags;
        }
    }

    private createFlagsRole(): void {
        this.flagsRole = new iam.Role(this, 'FeatureFlagsRole', {
            roleName: `ai-orchestrator-flags-role-${this.stackName}`,
            assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
            description: 'Role for AI Orchestrator feature flag access',
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')
            ]
        });

        // SSM Parameter Store permissions
        this.flagsRole.addToPolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'ssm:GetParameter',
                'ssm:GetParameters',
                'ssm:PutParameter',
                'ssm:GetParametersByPath'
            ],
            resources: [
                `arn:aws:ssm:${this.region}:${this.account}:parameter/ai-orchestrator/flags/*`
            ]
        }));

        // DynamoDB permissions
        this.flagsTable.grantReadWriteData(this.flagsRole);

        // CloudWatch Logs permissions
        this.flagsRole.addToPolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents'
            ],
            resources: [
                `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/lambda/ai-orchestrator-flags-*`
            ]
        }));
    }

    private createLogging(): void {
        this.flagsLogGroup = new logs.LogGroup(this, 'FeatureFlagsLogGroup', {
            logGroupName: '/aws/ai-orchestrator/feature-flags',
            retention: logs.RetentionDays.THIRTY_DAYS,
            removalPolicy: cdk.RemovalPolicy.DESTROY
        });

        // Metric filter for flag access patterns
        new logs.MetricFilter(this, 'FlagAccessMetric', {
            logGroup: this.flagsLogGroup,
            metricNamespace: 'AI/FeatureFlags',
            metricName: 'FlagAccess',
            filterPattern: logs.FilterPattern.stringValue('$.action', '=', 'getFlag'),
            metricValue: '1',
            defaultValue: 0
        });

        // Metric filter for flag changes
        new logs.MetricFilter(this, 'FlagChangeMetric', {
            logGroup: this.flagsLogGroup,
            metricNamespace: 'AI/FeatureFlags',
            metricName: 'FlagChanges',
            filterPattern: logs.FilterPattern.stringValue('$.action', '=', 'setFlag'),
            metricValue: '1',
            defaultValue: 0
        });
    }

    private createFlagInitializer(environment: string): void {
        this.flagInitializerLambda = new lambda.Function(this, 'FlagInitializerLambda', {
            functionName: `ai-orchestrator-flag-initializer-${this.stackName}`,
            runtime: lambda.Runtime.NODEJS_20_X,
            handler: 'index.handler',
            code: lambda.Code.fromInline(`
        const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
        const { marshall } = require('@aws-sdk/util-dynamodb');
        
        const dynamodb = new DynamoDBClient({ region: process.env.AWS_REGION });
        
        exports.handler = async (event) => {
          console.log('Initializing feature flags for environment: ${environment}');
          
          const defaultFlags = ${JSON.stringify(this.getDefaultFlagsForEnvironment(environment), null, 2)};
          const tableName = process.env.FLAGS_TABLE_NAME;
          
          try {
            for (const [flagName, value] of Object.entries(defaultFlags)) {
              await dynamodb.send(new PutItemCommand({
                TableName: tableName,
                Item: marshall({
                  flagName,
                  value,
                  category: flagName.split('.')[1] || 'general',
                  updatedAt: new Date().toISOString(),
                  ttl: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days TTL
                  source: 'initializer'
                }),
                ConditionExpression: 'attribute_not_exists(flagName)' // Only create if doesn't exist
              }));
              
              console.log(\`Initialized flag: \${flagName} = \${value}\`);
            }
            
            return {
              statusCode: 200,
              body: JSON.stringify({
                message: 'Feature flags initialized successfully',
                flagsCount: Object.keys(defaultFlags).length
              })
            };
          } catch (error) {
            console.error('Failed to initialize flags:', error);
            return {
              statusCode: 500,
              body: JSON.stringify({
                error: error.message
              })
            };
          }
        };
      `),
            timeout: cdk.Duration.minutes(5),
            environment: {
                FLAGS_TABLE_NAME: this.flagsTable.tableName,
                ENVIRONMENT: environment
            },
            role: this.flagsRole
        });

        // Trigger initialization on stack deployment
        new events.Rule(this, 'FlagInitializationRule', {
            schedule: events.Schedule.expression('rate(1 day)'), // Daily check
            targets: [new targets.LambdaFunction(this.flagInitializerLambda)],
            description: 'Daily feature flag initialization check'
        });
    }

    private createOutputs(): void {
        new cdk.CfnOutput(this, 'FeatureFlagsTableName', {
            value: this.flagsTable.tableName,
            exportName: `ai-feature-flags-table-${this.stackName}`,
            description: 'Name of the feature flags DynamoDB table'
        });

        new cdk.CfnOutput(this, 'FeatureFlagsRoleArn', {
            value: this.flagsRole.roleArn,
            exportName: `ai-feature-flags-role-arn-${this.stackName}`,
            description: 'ARN of the feature flags IAM role'
        });

        new cdk.CfnOutput(this, 'FeatureFlagsLogGroupName', {
            value: this.flagsLogGroup.logGroupName,
            exportName: `ai-feature-flags-log-group-${this.stackName}`,
            description: 'Name of the feature flags CloudWatch Log Group'
        });

        new cdk.CfnOutput(this, 'FlagInitializerLambdaArn', {
            value: this.flagInitializerLambda.functionArn,
            exportName: `ai-flag-initializer-arn-${this.stackName}`,
            description: 'ARN of the flag initializer Lambda function'
        });
    }

    private stringifyValue(value: any): string {
        if (typeof value === 'string') return value;
        if (typeof value === 'boolean' || typeof value === 'number') return value.toString();
        return JSON.stringify(value);
    }
}