import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

export interface SecretsMultiRegionProps {
    primaryRegion: string;
    secondaryRegion: string;
    kmsKey: kms.IKey;
    secretsToReplicate: {
        name: string;
        description: string;
        generateStringKey?: string;
        secretStringTemplate?: string;
    }[];
    parametersToSync: {
        name: string;
        value: string;
        description: string;
        type?: ssm.ParameterType;
    }[];
}

export class SecretsMultiRegionStack extends cdk.Stack {
    public readonly replicatedSecrets: secretsmanager.Secret[] = [];
    public readonly syncedParameters: ssm.StringParameter[] = [];
    public readonly crossRegionRole: iam.Role;

    constructor(scope: Construct, id: string, props: SecretsMultiRegionProps & cdk.StackProps) {
        super(scope, id, props);

        // Cross-region access role
        this.crossRegionRole = new iam.Role(this, 'CrossRegionSecretsRole', {
            assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
            description: 'Role for cross-region secrets and parameter access',
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
            ],
            inlinePolicies: {
                CrossRegionSecretsPolicy: new iam.PolicyDocument({
                    statements: [
                        new iam.PolicyStatement({
                            effect: iam.Effect.ALLOW,
                            actions: [
                                'secretsmanager:GetSecretValue',
                                'secretsmanager:DescribeSecret',
                                'secretsmanager:ListSecrets',
                            ],
                            resources: ['*'],
                            conditions: {
                                StringEquals: {
                                    'aws:RequestedRegion': [props.primaryRegion, props.secondaryRegion],
                                },
                            },
                        }),
                        new iam.PolicyStatement({
                            effect: iam.Effect.ALLOW,
                            actions: [
                                'ssm:GetParameter',
                                'ssm:GetParameters',
                                'ssm:GetParametersByPath',
                            ],
                            resources: ['*'],
                            conditions: {
                                StringEquals: {
                                    'aws:RequestedRegion': [props.primaryRegion, props.secondaryRegion],
                                },
                            },
                        }),
                        new iam.PolicyStatement({
                            effect: iam.Effect.ALLOW,
                            actions: [
                                'kms:Decrypt',
                                'kms:GenerateDataKey',
                                'kms:DescribeKey',
                            ],
                            resources: [props.kmsKey.keyArn],
                        }),
                    ],
                }),
            },
        });

        // Replicate secrets to secondary region
        props.secretsToReplicate.forEach((secretConfig, index) => {
            const secret = new secretsmanager.Secret(this, `Secret${index}`, {
                secretName: secretConfig.name,
                description: secretConfig.description,
                encryptionKey: props.kmsKey,
                generateSecretString: secretConfig.generateStringKey ? {
                    secretStringTemplate: secretConfig.secretStringTemplate || '{}',
                    generateStringKey: secretConfig.generateStringKey,
                    excludeCharacters: '"@/\\\'',
                    includeSpace: false,
                    passwordLength: 32,
                } : undefined,
                replicaRegions: [
                    {
                        region: props.secondaryRegion,
                        encryptionKey: props.kmsKey,
                    },
                ],
            });

            this.replicatedSecrets.push(secret);

            // CloudWatch alarm for secret access failures
            new cdk.aws_cloudwatch.Alarm(this, `SecretAccessAlarm${index}`, {
                metric: new cdk.aws_cloudwatch.Metric({
                    namespace: 'AWS/SecretsManager',
                    metricName: 'ProvisionedThroughputExceeded',
                    dimensionsMap: {
                        SecretName: secret.secretName,
                    },
                }),
                threshold: 1,
                evaluationPeriods: 1,
                alarmDescription: `Secret ${secretConfig.name} access throttled`,
            });
        });

        // Sync SSM parameters across regions
        props.parametersToSync.forEach((paramConfig, index) => {
            const parameter = new ssm.StringParameter(this, `Parameter${index}`, {
                parameterName: paramConfig.name,
                stringValue: paramConfig.value,
                description: paramConfig.description,
                type: paramConfig.type || ssm.ParameterType.STRING,
                tier: ssm.ParameterTier.STANDARD,
            });

            this.syncedParameters.push(parameter);

            // Create custom resource to sync parameter to secondary region
            const syncFunction = new cdk.aws_lambda.Function(this, `ParameterSyncFunction${index}`, {
                runtime: cdk.aws_lambda.Runtime.NODEJS_20_X,
                handler: 'index.handler',
                code: cdk.aws_lambda.Code.fromInline(`
          const AWS = require('aws-sdk');
          const response = require('cfn-response');
          
          exports.handler = async (event, context) => {
            const ssm = new AWS.SSM({ region: '${props.secondaryRegion}' });
            
            try {
              if (event.RequestType === 'Create' || event.RequestType === 'Update') {
                await ssm.putParameter({
                  Name: '${paramConfig.name}',
                  Value: '${paramConfig.value}',
                  Description: '${paramConfig.description}',
                  Type: '${paramConfig.type || 'String'}',
                  Overwrite: true,
                  Tier: 'Standard'
                }).promise();
              } else if (event.RequestType === 'Delete') {
                try {
                  await ssm.deleteParameter({
                    Name: '${paramConfig.name}'
                  }).promise();
                } catch (err) {
                  if (err.code !== 'ParameterNotFound') {
                    throw err;
                  }
                }
              }
              
              await response.send(event, context, response.SUCCESS);
            } catch (error) {
              console.error('Error:', error);
              await response.send(event, context, response.FAILED);
            }
          };
        `),
                role: this.crossRegionRole,
                timeout: cdk.Duration.minutes(5),
            });

            new cdk.CustomResource(this, `ParameterSyncResource${index}`, {
                serviceToken: syncFunction.functionArn,
                properties: {
                    ParameterName: paramConfig.name,
                    ParameterValue: paramConfig.value,
                    SecondaryRegion: props.secondaryRegion,
                },
            });
        });

        // Feature flags synchronization
        const featureFlagsParameter = new ssm.StringParameter(this, 'FeatureFlagsParameter', {
            parameterName: '/matbakh/feature-flags',
            stringValue: JSON.stringify({
                multi_region_enabled: true,
                failover_mode: 'automatic',
                health_check_interval: 30,
                rto_target_minutes: 15,
                rpo_target_minutes: 1,
            }),
            description: 'Multi-region feature flags configuration',
            type: ssm.ParameterType.STRING,
        });

        // Sync feature flags to secondary region
        const featureFlagsSyncFunction = new cdk.aws_lambda.Function(this, 'FeatureFlagsSyncFunction', {
            runtime: cdk.aws_lambda.Runtime.NODEJS_20_X,
            handler: 'index.handler',
            code: cdk.aws_lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const response = require('cfn-response');
        
        exports.handler = async (event, context) => {
          const primarySSM = new AWS.SSM({ region: '${props.primaryRegion}' });
          const secondarySSM = new AWS.SSM({ region: '${props.secondaryRegion}' });
          
          try {
            if (event.RequestType === 'Create' || event.RequestType === 'Update') {
              // Get parameter from primary region
              const primaryParam = await primarySSM.getParameter({
                Name: '/matbakh/feature-flags'
              }).promise();
              
              // Put parameter in secondary region
              await secondarySSM.putParameter({
                Name: '/matbakh/feature-flags',
                Value: primaryParam.Parameter.Value,
                Description: 'Multi-region feature flags configuration (synced)',
                Type: 'String',
                Overwrite: true
              }).promise();
            }
            
            await response.send(event, context, response.SUCCESS);
          } catch (error) {
            console.error('Error syncing feature flags:', error);
            await response.send(event, context, response.FAILED);
          }
        };
      `),
            role: this.crossRegionRole,
            timeout: cdk.Duration.minutes(5),
        });

        new cdk.CustomResource(this, 'FeatureFlagsSyncResource', {
            serviceToken: featureFlagsSyncFunction.functionArn,
        });

        // Outputs
        new cdk.CfnOutput(this, 'CrossRegionRoleArn', {
            value: this.crossRegionRole.roleArn,
            description: 'Cross-region secrets access role ARN',
        });

        new cdk.CfnOutput(this, 'ReplicatedSecretsCount', {
            value: this.replicatedSecrets.length.toString(),
            description: 'Number of secrets replicated to secondary region',
        });

        new cdk.CfnOutput(this, 'SyncedParametersCount', {
            value: this.syncedParameters.length.toString(),
            description: 'Number of parameters synced to secondary region',
        });
    }
}