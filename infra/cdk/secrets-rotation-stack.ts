/**
 * Secrets Rotation Stack - Automated Provider API Key Management
 * 
 * Implements secure secrets management with automatic rotation:
 * - Google Service Account JSON with token refresh
 * - Meta API Key with rotation plan
 * - EventBridge-triggered rotation
 * - Scoped secrets per environment/region/provider
 */

import * as cdk from 'aws-cdk-lib';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface SecretsRotationStackProps extends cdk.StackProps {
    environment: 'development' | 'staging' | 'production';
    region: string;
}

export class SecretsRotationStack extends cdk.Stack {
    readonly googleServiceAccountSecret: secretsmanager.Secret;
    readonly metaApiKeySecret: secretsmanager.Secret;
    readonly rotationLambda: lambda.Function;

    constructor(scope: Construct, id: string, props: SecretsRotationStackProps) {
        super(scope, id, props);

        // 1. Google Service Account Secret
        this.googleServiceAccountSecret = new secretsmanager.Secret(this, 'GoogleServiceAccountSecret', {
            secretName: `ai/google/service-account/${props.environment}/${props.region}`,
            description: `Google Service Account JSON for AI API access - ${props.environment}`,
            generateSecretString: {
                secretStringTemplate: JSON.stringify({
                    type: 'service_account',
                    project_id: 'matbakh-ai-project',
                    client_email: `ai-orchestrator-${props.environment}@matbakh-ai-project.iam.gserviceaccount.com`,
                    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
                    token_uri: 'https://oauth2.googleapis.com/token',
                    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs'
                }),
                generateStringKey: 'private_key',
                excludeCharacters: '"\\/',
                includeSpace: false,
                passwordLength: 2048
            }
        });

        // 2. Meta API Key Secret
        this.metaApiKeySecret = new secretsmanager.Secret(this, 'MetaApiKeySecret', {
            secretName: `ai/meta/api-key/${props.environment}/${props.region}`,
            description: `Meta AI API key for model access - ${props.environment}`,
            generateSecretString: {
                passwordLength: 64,
                excludeCharacters: '"\\/@',
                includeSpace: false
            }
        });

        // 3. Rotation Lambda Function
        this.rotationLambda = new lambda.Function(this, 'SecretsRotationLambda', {
            functionName: `ai-secrets-rotation-${props.environment}`,
            runtime: lambda.Runtime.NODEJS_20_X,
            handler: 'index.handler',
            code: lambda.Code.fromAsset('lambda/secrets-rotation'),
            timeout: cdk.Duration.minutes(5),
            environment: {
                ENVIRONMENT: props.environment,
                REGION: props.region,
                GOOGLE_SA_SECRET_ARN: this.googleServiceAccountSecret.secretArn,
                META_API_SECRET_ARN: this.metaApiKeySecret.secretArn,
                SNS_TOPIC_ARN: `arn:aws:sns:${props.region}:${this.account}:ai-ops-notifications`
            },
            deadLetterQueue: new sqs.Queue(this, 'RotationDLQ', {
                queueName: `ai-secrets-rotation-dlq-${props.environment}`,
                retentionPeriod: cdk.Duration.days(14)
            })
        });

        // 4. IAM Permissions für Rotation Lambda
        const rotationPolicy = new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'secretsmanager:GetSecretValue',
                'secretsmanager:UpdateSecret',
                'secretsmanager:PutSecretValue',
                'secretsmanager:DescribeSecret'
            ],
            resources: [
                this.googleServiceAccountSecret.secretArn,
                this.metaApiKeySecret.secretArn
            ]
        });

        this.rotationLambda.addToRolePolicy(rotationPolicy);

        // SNS Permissions für Notifications
        this.rotationLambda.addToRolePolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ['sns:Publish'],
            resources: [`arn:aws:sns:${props.region}:${this.account}:ai-ops-notifications`]
        }));

        // 5. EventBridge Rules für automatische Rotation

        // Monatliche Rotation für Google Service Account
        new events.Rule(this, 'GoogleSARotationRule', {
            ruleName: `google-sa-rotation-${props.environment}`,
            description: 'Monthly rotation of Google Service Account keys',
            schedule: events.Schedule.rate(cdk.Duration.days(30)),
            targets: [
                new targets.LambdaFunction(this.rotationLambda, {
                    event: events.RuleTargetInput.fromObject({
                        action: 'rotate_google_sa',
                        secretArn: this.googleServiceAccountSecret.secretArn,
                        environment: props.environment
                    })
                })
            ]
        });

        // Wöchentliche Rotation für Meta API Key (häufiger wegen höherem Risiko)
        new events.Rule(this, 'MetaApiRotationRule', {
            ruleName: `meta-api-rotation-${props.environment}`,
            description: 'Weekly rotation of Meta API keys',
            schedule: events.Schedule.rate(cdk.Duration.days(7)),
            targets: [
                new targets.LambdaFunction(this.rotationLambda, {
                    event: events.RuleTargetInput.fromObject({
                        action: 'rotate_meta_api',
                        secretArn: this.metaApiKeySecret.secretArn,
                        environment: props.environment
                    })
                })
            ]
        });

        // 6. CloudWatch Alarms für Rotation-Failures
        const rotationFailureAlarm = new cloudwatch.Alarm(this, 'RotationFailureAlarm', {
            alarmName: `ai-secrets-rotation-failure-${props.environment}`,
            alarmDescription: 'Alert when secrets rotation fails',
            metric: this.rotationLambda.metricErrors({
                period: cdk.Duration.minutes(5)
            }),
            threshold: 1,
            evaluationPeriods: 1,
            treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
        });

        // 7. Outputs
        new cdk.CfnOutput(this, 'GoogleServiceAccountSecretArn', {
            value: this.googleServiceAccountSecret.secretArn,
            exportName: `google-sa-secret-arn-${props.environment}`,
            description: 'Google Service Account Secret ARN'
        });

        new cdk.CfnOutput(this, 'MetaApiKeySecretArn', {
            value: this.metaApiKeySecret.secretArn,
            exportName: `meta-api-secret-arn-${props.environment}`,
            description: 'Meta API Key Secret ARN'
        });

        new cdk.CfnOutput(this, 'RotationLambdaArn', {
            value: this.rotationLambda.functionArn,
            exportName: `secrets-rotation-lambda-arn-${props.environment}`,
            description: 'Secrets Rotation Lambda ARN'
        });

        // Tags für alle Ressourcen
        cdk.Tags.of(this).add('Environment', props.environment);
        cdk.Tags.of(this).add('Service', 'ai-orchestration');
        cdk.Tags.of(this).add('Component', 'secrets-management');
    }
}
```