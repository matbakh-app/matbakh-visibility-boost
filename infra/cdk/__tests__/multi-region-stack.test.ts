import { describe, expect, it } from '@jest/globals';
import { App, Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as kms from 'aws-cdk-lib/aws-kms';
import { MultiRegionMonitoringStack } from '../monitoring-dashboards';
import { RdsGlobalStack } from '../rds-global';
import { Route53FailoverStack } from '../route53-failover';
import { S3CrossRegionReplicationStack } from '../s3-crr';
import { SecretsMultiRegionStack } from '../secrets-mr';

describe('Multi-Region Infrastructure', () => {
    let app: App;
    let mockVpc: ec2.IVpc;
    let mockKmsKey: kms.IKey;

    beforeEach(() => {
        app = new App();

        // Create mock VPC
        const vpcStack = new Stack(app, 'VpcStack');
        mockVpc = new ec2.Vpc(vpcStack, 'TestVpc', {
            maxAzs: 2,
            natGateways: 1,
        });

        // Create mock KMS key
        mockKmsKey = new kms.Key(vpcStack, 'TestKey', {
            multiRegion: true,
        });
    });

    describe('Route53 Failover Stack', () => {
        it('should create Route 53 failover records with correct configuration', () => {
            const stack = new Route53FailoverStack(app, 'Route53Test', {
                domainName: 'test.matbakh.app',
                primaryRegion: 'eu-central-1',
                secondaryRegion: 'eu-west-1',
                primaryEndpoint: 'api-eu-central-1.test.matbakh.app',
                secondaryEndpoint: 'api-eu-west-1.test.matbakh.app',
                hostedZoneId: 'Z123456789',
                env: { region: 'eu-central-1' },
            });

            const template = Template.fromStack(stack);

            // Check health checks are created
            template.hasResourceProperties('AWS::Route53::HealthCheck', {
                HealthCheckConfig: {
                    Type: 'HTTPS',
                    ResourcePath: '/health',
                    Port: 443,
                    RequestInterval: 30,
                    FailureThreshold: 3,
                    MeasureLatency: true,
                },
            });

            // Check primary failover record
            template.hasResourceProperties('AWS::Route53::RecordSet', {
                Type: 'A',
                SetIdentifier: 'primary',
                Failover: 'PRIMARY',
                TTL: 30,
            });

            // Check secondary failover record
            template.hasResourceProperties('AWS::Route53::RecordSet', {
                Type: 'A',
                SetIdentifier: 'secondary',
                Failover: 'SECONDARY',
                TTL: 30,
            });

            // Check canary record for testing
            template.hasResourceProperties('AWS::Route53::RecordSet', {
                SetIdentifier: 'canary-secondary',
                Weight: 5,
            });

            // Check CloudWatch alarms are created
            template.hasResourceProperties('AWS::CloudWatch::Alarm', {
                ComparisonOperator: 'LessThanThreshold',
                Threshold: 1,
                EvaluationPeriods: 2,
            });
        });

        it('should create health checks with multi-region monitoring', () => {
            const stack = new Route53FailoverStack(app, 'Route53Test', {
                domainName: 'test.matbakh.app',
                primaryRegion: 'eu-central-1',
                secondaryRegion: 'eu-west-1',
                primaryEndpoint: 'api-eu-central-1.test.matbakh.app',
                secondaryEndpoint: 'api-eu-west-1.test.matbakh.app',
                hostedZoneId: 'Z123456789',
                env: { region: 'eu-central-1' },
            });

            const template = Template.fromStack(stack);

            // Verify health checks monitor from multiple regions
            template.hasResourceProperties('AWS::Route53::HealthCheck', {
                HealthCheckConfig: {
                    Regions: [
                        'eu-west-1',
                        'us-east-1',
                        'ap-southeast-1',
                    ],
                },
            });
        });
    });

    describe('RDS Global Database Stack', () => {
        it('should create Aurora Global Database with correct configuration', () => {
            const stack = new RdsGlobalStack(app, 'RdsGlobalTest', {
                primaryRegion: 'eu-central-1',
                secondaryRegion: 'eu-west-1',
                vpc: mockVpc,
                databaseName: 'testdb',
                masterUsername: 'testuser',
                backupRetentionDays: 7,
                env: { region: 'eu-central-1' },
            });

            const template = Template.fromStack(stack);

            // Check global cluster is created
            template.hasResourceProperties('AWS::RDS::GlobalCluster', {
                Engine: 'aurora-postgresql',
                StorageEncrypted: true,
                DeletionProtection: true,
            });

            // Check primary cluster configuration
            template.hasResourceProperties('AWS::RDS::DBCluster', {
                Engine: 'aurora-postgresql',
                StorageEncrypted: true,
                DeletionProtection: true,
                BackupRetentionPeriod: 7,
                PreferredMaintenanceWindow: 'sun:04:00-sun:05:00',
                EnableCloudwatchLogsExports: ['postgresql'],
            });

            // Check subnet group is created
            template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
                DBSubnetGroupDescription: 'Subnet group for primary Aurora cluster',
            });

            // Check parameter group with optimizations
            template.hasResourceProperties('AWS::RDS::DBClusterParameterGroup', {
                Family: 'aurora-postgresql15',
                Parameters: {
                    'shared_preload_libraries': 'pg_stat_statements,pg_hint_plan',
                    'log_statement': 'all',
                    'log_min_duration_statement': '1000',
                    'max_connections': '1000',
                },
            });

            // Check CloudWatch alarms
            template.hasResourceProperties('AWS::CloudWatch::Alarm', {
                MetricName: 'CPUUtilization',
                Namespace: 'AWS/RDS',
                Threshold: 80,
            });

            template.hasResourceProperties('AWS::CloudWatch::Alarm', {
                MetricName: 'DatabaseConnections',
                Namespace: 'AWS/RDS',
                Threshold: 800,
            });
        });

        it('should create KMS multi-region key with proper policies', () => {
            const stack = new RdsGlobalStack(app, 'RdsGlobalTest', {
                primaryRegion: 'eu-central-1',
                secondaryRegion: 'eu-west-1',
                vpc: mockVpc,
                databaseName: 'testdb',
                masterUsername: 'testuser',
                env: { region: 'eu-central-1' },
            });

            const template = Template.fromStack(stack);

            // Check KMS key is multi-region
            template.hasResourceProperties('AWS::KMS::Key', {
                MultiRegion: true,
                KeyPolicy: {
                    Statement: [
                        {
                            Sid: 'Enable IAM User Permissions',
                            Effect: 'Allow',
                            Principal: {
                                AWS: {
                                    'Fn::Join': [
                                        '',
                                        [
                                            'arn:',
                                            { Ref: 'AWS::Partition' },
                                            ':iam::',
                                            { Ref: 'AWS::AccountId' },
                                            ':root',
                                        ],
                                    ],
                                },
                            },
                            Action: 'kms:*',
                            Resource: '*',
                        },
                        {
                            Sid: 'Allow RDS Service',
                            Effect: 'Allow',
                            Principal: {
                                Service: 'rds.amazonaws.com',
                            },
                            Action: [
                                'kms:Decrypt',
                                'kms:GenerateDataKey',
                                'kms:CreateGrant',
                                'kms:DescribeKey',
                            ],
                            Resource: '*',
                        },
                    ],
                },
            });
        });
    });

    describe('S3 Cross-Region Replication Stack', () => {
        it('should create S3 buckets with cross-region replication', () => {
            const stack = new S3CrossRegionReplicationStack(app, 'S3CrrTest', {
                primaryRegion: 'eu-central-1',
                secondaryRegion: 'eu-west-1',
                bucketName: 'test-bucket',
                kmsKey: mockKmsKey,
                env: { region: 'eu-central-1' },
            });

            const template = Template.fromStack(stack);

            // Check primary bucket with replication
            template.hasResourceProperties('AWS::S3::Bucket', {
                VersioningConfiguration: {
                    Status: 'Enabled',
                },
                BucketEncryption: {
                    ServerSideEncryptionConfiguration: [
                        {
                            ServerSideEncryptionByDefault: {
                                SSEAlgorithm: 'aws:kms',
                            },
                        },
                    ],
                },
                PublicAccessBlockConfiguration: {
                    BlockPublicAcls: true,
                    BlockPublicPolicy: true,
                    IgnorePublicAcls: true,
                    RestrictPublicBuckets: true,
                },
                ReplicationConfiguration: {
                    Role: {
                        'Fn::GetAtt': [
                            expect.stringMatching(/ReplicationRole/),
                            'Arn',
                        ],
                    },
                    Rules: [
                        {
                            Id: 'ReplicateAll',
                            Status: 'Enabled',
                            Prefix: '',
                        },
                        {
                            Id: 'ReplicateBlueGreen',
                            Status: 'Enabled',
                            Filter: {
                                Prefix: 'blue/',
                            },
                            Priority: 1,
                        },
                        {
                            Id: 'ReplicateGreenBlue',
                            Status: 'Enabled',
                            Filter: {
                                Prefix: 'green/',
                            },
                            Priority: 2,
                        },
                    ],
                },
            });

            // Check secondary bucket
            template.hasResourceProperties('AWS::S3::Bucket', {
                BucketName: 'test-bucket-eu-west-1',
                VersioningConfiguration: {
                    Status: 'Enabled',
                },
            });

            // Check replication role
            template.hasResourceProperties('AWS::IAM::Role', {
                AssumeRolePolicyDocument: {
                    Statement: [
                        {
                            Effect: 'Allow',
                            Principal: {
                                Service: 's3.amazonaws.com',
                            },
                            Action: 'sts:AssumeRole',
                        },
                    ],
                },
            });

            // Check lifecycle rules
            template.hasResourceProperties('AWS::S3::Bucket', {
                LifecycleConfiguration: {
                    Rules: [
                        {
                            Id: 'DeleteIncompleteMultipartUploads',
                            Status: 'Enabled',
                            AbortIncompleteMultipartUpload: {
                                DaysAfterInitiation: 7,
                            },
                        },
                        {
                            Id: 'TransitionToIA',
                            Status: 'Enabled',
                            Transitions: [
                                {
                                    StorageClass: 'STANDARD_IA',
                                    TransitionInDays: 30,
                                },
                                {
                                    StorageClass: 'GLACIER',
                                    TransitionInDays: 90,
                                },
                            ],
                        },
                    ],
                },
            });

            // Check CORS configuration
            template.hasResourceProperties('AWS::S3::Bucket', {
                CorsConfiguration: {
                    CorsRules: [
                        {
                            AllowedMethods: ['GET', 'PUT', 'POST'],
                            AllowedOrigins: ['https://matbakh.app', 'https://*.matbakh.app'],
                            AllowedHeaders: ['*'],
                            MaxAge: 3600,
                        },
                    ],
                },
            });
        });

        it('should create replication monitoring alarms', () => {
            const stack = new S3CrossRegionReplicationStack(app, 'S3CrrTest', {
                primaryRegion: 'eu-central-1',
                secondaryRegion: 'eu-west-1',
                bucketName: 'test-bucket',
                kmsKey: mockKmsKey,
                env: { region: 'eu-central-1' },
            });

            const template = Template.fromStack(stack);

            // Check replication latency alarm
            template.hasResourceProperties('AWS::CloudWatch::Alarm', {
                MetricName: 'ReplicationLatency',
                Namespace: 'AWS/S3',
                Threshold: 900, // 15 minutes
                ComparisonOperator: 'GreaterThanThreshold',
            });

            // Check budget for cross-region transfer costs
            template.hasResourceProperties('AWS::Budgets::Budget', {
                Budget: {
                    BudgetName: 'S3-CrossRegion-Transfer-Budget',
                    BudgetLimit: {
                        Amount: 50,
                        Unit: 'EUR',
                    },
                    TimeUnit: 'MONTHLY',
                    BudgetType: 'COST',
                },
            });
        });
    });

    describe('Secrets Multi-Region Stack', () => {
        it('should create secrets with cross-region replication', () => {
            const stack = new SecretsMultiRegionStack(app, 'SecretsTest', {
                primaryRegion: 'eu-central-1',
                secondaryRegion: 'eu-west-1',
                kmsKey: mockKmsKey,
                secretsToReplicate: [
                    {
                        name: 'test/secret',
                        description: 'Test secret',
                        generateStringKey: 'password',
                        secretStringTemplate: JSON.stringify({ username: 'test' }),
                    },
                ],
                parametersToSync: [
                    {
                        name: '/test/parameter',
                        value: 'test-value',
                        description: 'Test parameter',
                    },
                ],
                env: { region: 'eu-central-1' },
            });

            const template = Template.fromStack(stack);

            // Check secret with replication
            template.hasResourceProperties('AWS::SecretsManager::Secret', {
                Name: 'test/secret',
                Description: 'Test secret',
                GenerateSecretString: {
                    SecretStringTemplate: '{"username":"test"}',
                    GenerateStringKey: 'password',
                    ExcludeCharacters: '"@/\\\'',
                    IncludeSpace: false,
                    PasswordLength: 32,
                },
                ReplicaRegions: [
                    {
                        Region: 'eu-west-1',
                    },
                ],
            });

            // Check SSM parameter
            template.hasResourceProperties('AWS::SSM::Parameter', {
                Name: '/test/parameter',
                Value: 'test-value',
                Description: 'Test parameter',
                Type: 'String',
                Tier: 'Standard',
            });

            // Check cross-region role
            template.hasResourceProperties('AWS::IAM::Role', {
                AssumeRolePolicyDocument: {
                    Statement: [
                        {
                            Effect: 'Allow',
                            Principal: {
                                Service: 'lambda.amazonaws.com',
                            },
                            Action: 'sts:AssumeRole',
                        },
                    ],
                },
            });

            // Check parameter sync Lambda function
            template.hasResourceProperties('AWS::Lambda::Function', {
                Runtime: 'nodejs20.x',
                Handler: 'index.handler',
                Timeout: 300,
            });
        });

        it('should create feature flags synchronization', () => {
            const stack = new SecretsMultiRegionStack(app, 'SecretsTest', {
                primaryRegion: 'eu-central-1',
                secondaryRegion: 'eu-west-1',
                kmsKey: mockKmsKey,
                secretsToReplicate: [],
                parametersToSync: [],
                env: { region: 'eu-central-1' },
            });

            const template = Template.fromStack(stack);

            // Check feature flags parameter
            template.hasResourceProperties('AWS::SSM::Parameter', {
                Name: '/matbakh/feature-flags',
                Type: 'String',
                Description: 'Multi-region feature flags configuration',
            });

            // Check feature flags sync function
            template.hasResourceProperties('AWS::Lambda::Function', {
                Runtime: 'nodejs20.x',
                Handler: 'index.handler',
            });
        });
    });

    describe('Monitoring Stack', () => {
        it('should create comprehensive monitoring dashboard', () => {
            const stack = new MultiRegionMonitoringStack(app, 'MonitoringTest', {
                primaryRegion: 'eu-central-1',
                secondaryRegion: 'eu-west-1',
                domainName: 'test.matbakh.app',
                distributionId: 'E123456789',
                primaryClusterIdentifier: 'primary-cluster',
                secondaryClusterIdentifier: 'secondary-cluster',
                primaryHealthCheckId: 'hc-primary',
                secondaryHealthCheckId: 'hc-secondary',
                alertEmail: 'test@example.com',
                env: { region: 'eu-central-1' },
            });

            const template = Template.fromStack(stack);

            // Check dashboard creation
            template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
                DashboardName: 'Matbakh-Multi-Region-Overview',
            });

            // Check SNS topic for alerts
            template.hasResourceProperties('AWS::SNS::Topic', {
                DisplayName: 'Multi-Region Infrastructure Alerts',
                TopicName: 'matbakh-multi-region-alerts',
            });

            // Check email subscription
            template.hasResourceProperties('AWS::SNS::Subscription', {
                Protocol: 'email',
                Endpoint: 'test@example.com',
            });

            // Check critical alarms
            template.hasResourceProperties('AWS::CloudWatch::Alarm', {
                AlarmName: 'Multi-Region-Primary-Health-Critical',
                MetricName: 'HealthCheckStatus',
                Namespace: 'AWS/Route53',
                Threshold: 1,
                ComparisonOperator: 'LessThanThreshold',
            });

            template.hasResourceProperties('AWS::CloudWatch::Alarm', {
                AlarmName: 'Multi-Region-Secondary-Health-Critical',
                MetricName: 'HealthCheckStatus',
                Namespace: 'AWS/Route53',
            });

            // Check composite alarm for both regions down
            template.hasResourceProperties('AWS::CloudWatch::CompositeAlarm', {
                AlarmName: 'Multi-Region-Both-Regions-Down-CRITICAL',
            });

            // Check performance alarms
            template.hasResourceProperties('AWS::CloudWatch::Alarm', {
                AlarmName: 'Multi-Region-High-Response-Time',
                MetricName: 'ConnectionTime',
                Threshold: 5000,
            });

            // Check replication alarms
            template.hasResourceProperties('AWS::CloudWatch::Alarm', {
                AlarmName: 'Multi-Region-DB-Replication-Lag',
                MetricName: 'AuroraGlobalDBReplicationLag',
                Threshold: 60000,
            });

            // Check RTO/RPO compliance alarms
            template.hasResourceProperties('AWS::CloudWatch::Alarm', {
                AlarmName: 'Multi-Region-RTO-Compliance',
                MetricName: 'FailoverRTO',
                Threshold: 15,
            });

            template.hasResourceProperties('AWS::CloudWatch::Alarm', {
                AlarmName: 'Multi-Region-RPO-Compliance',
                MetricName: 'FailoverRPO',
                Threshold: 1,
            });
        });

        it('should create budget alerts with escalating thresholds', () => {
            const stack = new MultiRegionMonitoringStack(app, 'MonitoringTest', {
                primaryRegion: 'eu-central-1',
                secondaryRegion: 'eu-west-1',
                domainName: 'test.matbakh.app',
                distributionId: 'E123456789',
                primaryClusterIdentifier: 'primary-cluster',
                secondaryClusterIdentifier: 'secondary-cluster',
                primaryHealthCheckId: 'hc-primary',
                secondaryHealthCheckId: 'hc-secondary',
                alertEmail: 'test@example.com',
                env: { region: 'eu-central-1' },
            });

            const template = Template.fromStack(stack);

            // Check budget with multiple notification thresholds
            template.hasResourceProperties('AWS::Budgets::Budget', {
                Budget: {
                    BudgetName: 'Multi-Region-Infrastructure-Budget-Alerts',
                    BudgetLimit: {
                        Amount: 100,
                        Unit: 'EUR',
                    },
                    TimeUnit: 'MONTHLY',
                    BudgetType: 'COST',
                },
                NotificationsWithSubscribers: [
                    {
                        Notification: {
                            NotificationType: 'ACTUAL',
                            ComparisonOperator: 'GREATER_THAN',
                            Threshold: 50,
                            ThresholdType: 'PERCENTAGE',
                        },
                    },
                    {
                        Notification: {
                            NotificationType: 'ACTUAL',
                            ComparisonOperator: 'GREATER_THAN',
                            Threshold: 80,
                            ThresholdType: 'PERCENTAGE',
                        },
                    },
                    {
                        Notification: {
                            NotificationType: 'FORECASTED',
                            ComparisonOperator: 'GREATER_THAN',
                            Threshold: 200,
                            ThresholdType: 'ABSOLUTE_VALUE',
                        },
                    },
                ],
            });
        });
    });

    describe('Stack Integration', () => {
        it('should validate cross-stack dependencies', () => {
            // This test ensures that stacks can be deployed together
            const route53Stack = new Route53FailoverStack(app, 'Route53Integration', {
                domainName: 'test.matbakh.app',
                primaryRegion: 'eu-central-1',
                secondaryRegion: 'eu-west-1',
                primaryEndpoint: 'api-eu-central-1.test.matbakh.app',
                secondaryEndpoint: 'api-eu-west-1.test.matbakh.app',
                hostedZoneId: 'Z123456789',
                env: { region: 'eu-central-1' },
            });

            const rdsStack = new RdsGlobalStack(app, 'RdsIntegration', {
                primaryRegion: 'eu-central-1',
                secondaryRegion: 'eu-west-1',
                vpc: mockVpc,
                databaseName: 'testdb',
                masterUsername: 'testuser',
                env: { region: 'eu-central-1' },
            });

            const s3Stack = new S3CrossRegionReplicationStack(app, 'S3Integration', {
                primaryRegion: 'eu-central-1',
                secondaryRegion: 'eu-west-1',
                bucketName: 'test-bucket',
                kmsKey: mockKmsKey,
                env: { region: 'eu-central-1' },
            });

            // Verify all stacks can be synthesized together
            const route53Template = Template.fromStack(route53Stack);
            const rdsTemplate = Template.fromStack(rdsStack);
            const s3Template = Template.fromStack(s3Stack);

            expect(route53Template).toBeDefined();
            expect(rdsTemplate).toBeDefined();
            expect(s3Template).toBeDefined();
        });
    });
});