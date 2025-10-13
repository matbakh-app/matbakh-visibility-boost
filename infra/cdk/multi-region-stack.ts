import * as cdk from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';
import { RdsGlobalStack } from './rds-global';
import { Route53FailoverStack } from './route53-failover';
import { S3CrossRegionReplicationStack } from './s3-crr';
import { SecretsMultiRegionStack } from './secrets-mr';

export interface MultiRegionStackProps extends cdk.StackProps {
    primaryRegion: string;
    secondaryRegion: string;
    domainName: string;
    hostedZoneId: string;
    databaseName: string;
    masterUsername: string;
}

export class MultiRegionStack extends cdk.Stack {
    public readonly route53Stack: Route53FailoverStack;
    public readonly rdsGlobalStack: RdsGlobalStack;
    public readonly s3CrrStack: S3CrossRegionReplicationStack;
    public readonly secretsStack: SecretsMultiRegionStack;
    public readonly distribution: cloudfront.Distribution;
    public readonly kmsKey: kms.Key;

    constructor(scope: Construct, id: string, props: MultiRegionStackProps) {
        super(scope, id, props);

        // Multi-region KMS key
        this.kmsKey = new kms.Key(this, 'MultiRegionKey', {
            description: 'Multi-region key for matbakh.app infrastructure',
            multiRegion: true,
            policy: new cdk.aws_iam.PolicyDocument({
                statements: [
                    new cdk.aws_iam.PolicyStatement({
                        sid: 'Enable IAM User Permissions',
                        effect: cdk.aws_iam.Effect.ALLOW,
                        principals: [new cdk.aws_iam.AccountRootPrincipal()],
                        actions: ['kms:*'],
                        resources: ['*'],
                    }),
                    new cdk.aws_iam.PolicyStatement({
                        sid: 'Allow AWS Services',
                        effect: cdk.aws_iam.Effect.ALLOW,
                        principals: [
                            new cdk.aws_iam.ServicePrincipal('s3.amazonaws.com'),
                            new cdk.aws_iam.ServicePrincipal('rds.amazonaws.com'),
                            new cdk.aws_iam.ServicePrincipal('secretsmanager.amazonaws.com'),
                            new cdk.aws_iam.ServicePrincipal('lambda.amazonaws.com'),
                        ],
                        actions: [
                            'kms:Decrypt',
                            'kms:GenerateDataKey',
                            'kms:CreateGrant',
                            'kms:DescribeKey',
                        ],
                        resources: ['*'],
                    }),
                ],
            }),
        });

        // VPC for primary region (assuming it exists)
        const primaryVpc = ec2.Vpc.fromLookup(this, 'PrimaryVpc', {
            isDefault: false,
            region: props.primaryRegion,
        });

        // S3 Cross-Region Replication
        this.s3CrrStack = new S3CrossRegionReplicationStack(this, 'S3CRR', {
            ...props,
            primaryRegion: props.primaryRegion,
            secondaryRegion: props.secondaryRegion,
            bucketName: `matbakh-web-${props.primaryRegion}`,
            kmsKey: this.kmsKey,
        });

        // CloudFront distribution with multi-origin failover
        this.distribution = new cloudfront.Distribution(this, 'MultiRegionDistribution', {
            comment: 'Multi-region distribution for matbakh.app',
            defaultBehavior: {
                origin: new origins.OriginGroup({
                    primaryOrigin: new origins.S3Origin(this.s3CrrStack.primaryBucket, {
                        originPath: '/blue', // Default to blue slot
                    }),
                    fallbackOrigin: new origins.S3Origin(this.s3CrrStack.secondaryBucket, {
                        originPath: '/blue',
                    }),
                    fallbackStatusCodes: [403, 404, 500, 502, 503, 504],
                }),
                viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
                originRequestPolicy: cloudfront.OriginRequestPolicy.CORS_S3_ORIGIN,
                compress: true,
            },
            additionalBehaviors: {
                '/api/*': {
                    origin: new origins.HttpOrigin(`api.${props.domainName}`, {
                        protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
                    }),
                    viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                    cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
                    originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
                    allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
                },
                '/green/*': {
                    origin: new origins.OriginGroup({
                        primaryOrigin: new origins.S3Origin(this.s3CrrStack.primaryBucket, {
                            originPath: '/green',
                        }),
                        fallbackOrigin: new origins.S3Origin(this.s3CrrStack.secondaryBucket, {
                            originPath: '/green',
                        }),
                        fallbackStatusCodes: [403, 404, 500, 502, 503, 504],
                    }),
                    viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                    cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
                },
            },
            priceClass: cloudfront.PriceClass.PRICE_CLASS_100, // EU and US only
            enableIpv6: true,
            httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
            minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
            errorResponses: [
                {
                    httpStatus: 404,
                    responseHttpStatus: 200,
                    responsePagePath: '/index.html',
                    ttl: cdk.Duration.minutes(5),
                },
                {
                    httpStatus: 403,
                    responseHttpStatus: 200,
                    responsePagePath: '/index.html',
                    ttl: cdk.Duration.minutes(5),
                },
            ],
        });

        // RDS Global Database
        this.rdsGlobalStack = new RdsGlobalStack(this, 'RDSGlobal', {
            ...props,
            primaryRegion: props.primaryRegion,
            secondaryRegion: props.secondaryRegion,
            vpc: primaryVpc,
            databaseName: props.databaseName,
            masterUsername: props.masterUsername,
            backupRetentionDays: 7,
        });

        // Route 53 Failover
        this.route53Stack = new Route53FailoverStack(this, 'Route53Failover', {
            ...props,
            domainName: props.domainName,
            primaryRegion: props.primaryRegion,
            secondaryRegion: props.secondaryRegion,
            primaryEndpoint: `api-${props.primaryRegion}.${props.domainName}`,
            secondaryEndpoint: `api-${props.secondaryRegion}.${props.domainName}`,
            hostedZoneId: props.hostedZoneId,
        });

        // Secrets Multi-Region
        this.secretsStack = new SecretsMultiRegionStack(this, 'SecretsMultiRegion', {
            ...props,
            primaryRegion: props.primaryRegion,
            secondaryRegion: props.secondaryRegion,
            kmsKey: this.kmsKey,
            secretsToReplicate: [
                {
                    name: 'matbakh/database/master',
                    description: 'Database master credentials',
                    generateStringKey: 'password',
                    secretStringTemplate: JSON.stringify({ username: props.masterUsername }),
                },
                {
                    name: 'matbakh/api/keys',
                    description: 'API keys and tokens',
                },
                {
                    name: 'matbakh/external/integrations',
                    description: 'External service integration credentials',
                },
            ],
            parametersToSync: [
                {
                    name: '/matbakh/config/primary-region',
                    value: props.primaryRegion,
                    description: 'Primary AWS region',
                },
                {
                    name: '/matbakh/config/secondary-region',
                    value: props.secondaryRegion,
                    description: 'Secondary AWS region',
                },
                {
                    name: '/matbakh/config/domain-name',
                    value: props.domainName,
                    description: 'Application domain name',
                },
                {
                    name: '/matbakh/config/rto-target',
                    value: '15',
                    description: 'Recovery Time Objective in minutes',
                },
                {
                    name: '/matbakh/config/rpo-target',
                    value: '1',
                    description: 'Recovery Point Objective in minutes',
                },
            ],
        });

        // Budget alerts for multi-region costs
        new cdk.aws_budgets.CfnBudget(this, 'MultiRegionBudget', {
            budget: {
                budgetName: 'Multi-Region-Infrastructure-Budget',
                budgetLimit: {
                    amount: 100, // €100 per month soft cap
                    unit: 'EUR',
                },
                timeUnit: 'MONTHLY',
                budgetType: 'COST',
                costFilters: {
                    Region: [props.primaryRegion, props.secondaryRegion],
                },
            },
            notificationsWithSubscribers: [
                {
                    notification: {
                        notificationType: 'ACTUAL',
                        comparisonOperator: 'GREATER_THAN',
                        threshold: 50, // Alert at 50%
                    },
                    subscribers: [
                        {
                            subscriptionType: 'EMAIL',
                            address: 'admin@matbakh.app',
                        },
                    ],
                },
                {
                    notification: {
                        notificationType: 'ACTUAL',
                        comparisonOperator: 'GREATER_THAN',
                        threshold: 80, // Alert at 80%
                    },
                    subscribers: [
                        {
                            subscriptionType: 'EMAIL',
                            address: 'admin@matbakh.app',
                        },
                    ],
                },
                {
                    notification: {
                        notificationType: 'FORECASTED',
                        comparisonOperator: 'GREATER_THAN',
                        threshold: 200, // Burst limit alert
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
        new cdk.CfnOutput(this, 'DistributionDomainName', {
            value: this.distribution.distributionDomainName,
            description: 'CloudFront distribution domain name',
        });

        new cdk.CfnOutput(this, 'DistributionId', {
            value: this.distribution.distributionId,
            description: 'CloudFront distribution ID',
        });

        new cdk.CfnOutput(this, 'KmsKeyArn', {
            value: this.kmsKey.keyArn,
            description: 'Multi-region KMS key ARN',
        });

        new cdk.CfnOutput(this, 'PrimaryBucketName', {
            value: this.s3CrrStack.primaryBucket.bucketName,
            description: 'Primary S3 bucket name',
        });

        new cdk.CfnOutput(this, 'SecondaryBucketName', {
            value: this.s3CrrStack.secondaryBucket.bucketName,
            description: 'Secondary S3 bucket name',
        });
    }
}