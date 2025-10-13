import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export interface S3CrossRegionReplicationProps {
    primaryRegion: string;
    secondaryRegion: string;
    bucketName: string;
    kmsKey: kms.IKey;
}

export class S3CrossRegionReplicationStack extends cdk.Stack {
    public readonly primaryBucket: s3.Bucket;
    public readonly secondaryBucket: s3.Bucket;
    public readonly replicationRole: iam.Role;

    constructor(scope: Construct, id: string, props: S3CrossRegionReplicationProps & cdk.StackProps) {
        super(scope, id, props);

        // Secondary bucket (destination for replication)
        this.secondaryBucket = new s3.Bucket(this, 'SecondaryBucket', {
            bucketName: `${props.bucketName}-${props.secondaryRegion}`,
            versioned: true,
            encryption: s3.BucketEncryption.KMS,
            encryptionKey: props.kmsKey,
            publicReadAccess: false,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            lifecycleRules: [
                {
                    id: 'DeleteIncompleteMultipartUploads',
                    abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
                },
                {
                    id: 'TransitionToIA',
                    transitions: [
                        {
                            storageClass: s3.StorageClass.INFREQUENT_ACCESS,
                            transitionAfter: cdk.Duration.days(30),
                        },
                        {
                            storageClass: s3.StorageClass.GLACIER,
                            transitionAfter: cdk.Duration.days(90),
                        },
                    ],
                },
            ],
            cors: [
                {
                    allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT, s3.HttpMethods.POST],
                    allowedOrigins: ['https://matbakh.app', 'https://*.matbakh.app'],
                    allowedHeaders: ['*'],
                    maxAge: 3600,
                },
            ],
        });

        // IAM role for replication
        this.replicationRole = new iam.Role(this, 'ReplicationRole', {
            assumedBy: new iam.ServicePrincipal('s3.amazonaws.com'),
            description: 'Role for S3 cross-region replication',
            inlinePolicies: {
                ReplicationPolicy: new iam.PolicyDocument({
                    statements: [
                        new iam.PolicyStatement({
                            effect: iam.Effect.ALLOW,
                            actions: [
                                's3:GetObjectVersionForReplication',
                                's3:GetObjectVersionAcl',
                                's3:GetObjectVersionTagging',
                            ],
                            resources: [`arn:aws:s3:::${props.bucketName}/*`],
                        }),
                        new iam.PolicyStatement({
                            effect: iam.Effect.ALLOW,
                            actions: [
                                's3:ListBucket',
                                's3:GetBucketVersioning',
                            ],
                            resources: [`arn:aws:s3:::${props.bucketName}`],
                        }),
                        new iam.PolicyStatement({
                            effect: iam.Effect.ALLOW,
                            actions: [
                                's3:ReplicateObject',
                                's3:ReplicateDelete',
                                's3:ReplicateTags',
                            ],
                            resources: [this.secondaryBucket.arnForObjects('*')],
                        }),
                        new iam.PolicyStatement({
                            effect: iam.Effect.ALLOW,
                            actions: [
                                'kms:Decrypt',
                                'kms:GenerateDataKey',
                            ],
                            resources: [props.kmsKey.keyArn],
                        }),
                    ],
                }),
            },
        });

        // Primary bucket with replication configuration
        this.primaryBucket = new s3.Bucket(this, 'PrimaryBucket', {
            bucketName: props.bucketName,
            versioned: true,
            encryption: s3.BucketEncryption.KMS,
            encryptionKey: props.kmsKey,
            publicReadAccess: false,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            replicationConfiguration: {
                role: this.replicationRole.roleArn,
                rules: [
                    {
                        id: 'ReplicateAll',
                        status: s3.ReplicationStatus.ENABLED,
                        prefix: '',
                        destination: {
                            bucket: this.secondaryBucket.bucketArn,
                            storageClass: s3.StorageClass.STANDARD,
                            encryptionConfiguration: {
                                replicaKmsKeyId: props.kmsKey.keyArn,
                            },
                        },
                        deleteMarkerReplication: {
                            status: s3.DeleteMarkerReplicationStatus.ENABLED,
                        },
                    },
                    {
                        id: 'ReplicateBlueGreen',
                        status: s3.ReplicationStatus.ENABLED,
                        filter: {
                            prefix: 'blue/',
                        },
                        destination: {
                            bucket: this.secondaryBucket.bucketArn,
                            storageClass: s3.StorageClass.STANDARD,
                            encryptionConfiguration: {
                                replicaKmsKeyId: props.kmsKey.keyArn,
                            },
                        },
                        priority: 1,
                    },
                    {
                        id: 'ReplicateGreenBlue',
                        status: s3.ReplicationStatus.ENABLED,
                        filter: {
                            prefix: 'green/',
                        },
                        destination: {
                            bucket: this.secondaryBucket.bucketArn,
                            storageClass: s3.StorageClass.STANDARD,
                            encryptionConfiguration: {
                                replicaKmsKeyId: props.kmsKey.keyArn,
                            },
                        },
                        priority: 2,
                    },
                ],
            },
            lifecycleRules: [
                {
                    id: 'DeleteIncompleteMultipartUploads',
                    abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
                },
                {
                    id: 'TransitionToIA',
                    transitions: [
                        {
                            storageClass: s3.StorageClass.INFREQUENT_ACCESS,
                            transitionAfter: cdk.Duration.days(30),
                        },
                        {
                            storageClass: s3.StorageClass.GLACIER,
                            transitionAfter: cdk.Duration.days(90),
                        },
                    ],
                },
            ],
            cors: [
                {
                    allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT, s3.HttpMethods.POST],
                    allowedOrigins: ['https://matbakh.app', 'https://*.matbakh.app'],
                    allowedHeaders: ['*'],
                    maxAge: 3600,
                },
            ],
        });

        // CloudWatch metrics for replication monitoring
        new cdk.aws_cloudwatch.Alarm(this, 'ReplicationFailureAlarm', {
            metric: new cdk.aws_cloudwatch.Metric({
                namespace: 'AWS/S3',
                metricName: 'ReplicationLatency',
                dimensionsMap: {
                    SourceBucket: this.primaryBucket.bucketName,
                    DestinationBucket: this.secondaryBucket.bucketName,
                },
                statistic: 'Maximum',
            }),
            threshold: 900, // 15 minutes
            evaluationPeriods: 2,
            alarmDescription: 'S3 replication latency is high',
        });

        // Budget alert for cross-region transfer costs
        new cdk.aws_budgets.CfnBudget(this, 'CrossRegionTransferBudget', {
            budget: {
                budgetName: 'S3-CrossRegion-Transfer-Budget',
                budgetLimit: {
                    amount: 50, // €50 per month
                    unit: 'EUR',
                },
                timeUnit: 'MONTHLY',
                budgetType: 'COST',
                costFilters: {
                    Service: ['Amazon Simple Storage Service'],
                    UsageType: ['*DataTransfer*'],
                },
            },
            notificationsWithSubscribers: [
                {
                    notification: {
                        notificationType: 'ACTUAL',
                        comparisonOperator: 'GREATER_THAN',
                        threshold: 80, // Alert at 80% of budget
                    },
                    subscribers: [
                        {
                            subscriptionType: 'EMAIL',
                            address: 'admin@matbakh.app',
                        },
                    ],
                },
            ],
        });

        // Outputs
        new cdk.CfnOutput(this, 'PrimaryBucketName', {
            value: this.primaryBucket.bucketName,
            description: 'Primary S3 bucket name',
        });

        new cdk.CfnOutput(this, 'SecondaryBucketName', {
            value: this.secondaryBucket.bucketName,
            description: 'Secondary S3 bucket name',
        });

        new cdk.CfnOutput(this, 'ReplicationRoleArn', {
            value: this.replicationRole.roleArn,
            description: 'S3 replication role ARN',
        });
    }
}