import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export interface RdsGlobalProps {
    primaryRegion: string;
    secondaryRegion: string;
    vpc: ec2.IVpc;
    databaseName: string;
    masterUsername: string;
    backupRetentionDays?: number;
}

export class RdsGlobalStack extends cdk.Stack {
    public readonly globalCluster: rds.GlobalCluster;
    public readonly primaryCluster: rds.DatabaseCluster;
    public readonly secondaryCluster: rds.DatabaseCluster;
    public readonly masterSecret: secretsmanager.ISecret;
    public readonly kmsKey: kms.IKey;

    constructor(scope: Construct, id: string, props: RdsGlobalProps & cdk.StackProps) {
        super(scope, id, props);

        // KMS Multi-Region Key for encryption
        this.kmsKey = new kms.Key(this, 'GlobalDatabaseKey', {
            description: 'Multi-region key for Aurora Global Database',
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
                        sid: 'Allow RDS Service',
                        effect: cdk.aws_iam.Effect.ALLOW,
                        principals: [new cdk.aws_iam.ServicePrincipal('rds.amazonaws.com')],
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

        // Master credentials secret
        this.masterSecret = new secretsmanager.Secret(this, 'DatabaseMasterSecret', {
            description: 'Master credentials for Aurora Global Database',
            generateSecretString: {
                secretStringTemplate: JSON.stringify({ username: props.masterUsername }),
                generateStringKey: 'password',
                excludeCharacters: '"@/\\\'',
                includeSpace: false,
                passwordLength: 32,
            },
            replicaRegions: [
                {
                    region: props.secondaryRegion,
                    encryptionKey: this.kmsKey,
                },
            ],
        });

        // Subnet groups for both regions
        const primarySubnetGroup = new rds.SubnetGroup(this, 'PrimarySubnetGroup', {
            description: 'Subnet group for primary Aurora cluster',
            vpc: props.vpc,
            subnetGroupName: `${id}-primary-subnet-group`,
            vpcSubnets: {
                subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
            },
        });

        // Parameter group for PostgreSQL optimization
        const parameterGroup = new rds.ParameterGroup(this, 'GlobalParameterGroup', {
            engine: rds.DatabaseClusterEngine.auroraPostgres({
                version: rds.AuroraPostgresEngineVersion.VER_15_4,
            }),
            description: 'Parameter group for Aurora Global Database',
            parameters: {
                'shared_preload_libraries': 'pg_stat_statements,pg_hint_plan',
                'log_statement': 'all',
                'log_min_duration_statement': '1000',
                'track_activity_query_size': '2048',
                'max_connections': '1000',
                'work_mem': '4MB',
                'maintenance_work_mem': '64MB',
                'effective_cache_size': '1GB',
                'random_page_cost': '1.1',
            },
        });

        // Global cluster
        this.globalCluster = new rds.GlobalCluster(this, 'GlobalCluster', {
            engine: rds.DatabaseClusterEngine.auroraPostgres({
                version: rds.AuroraPostgresEngineVersion.VER_15_4,
            }),
            globalClusterIdentifier: `${id}-global-cluster`,
            deletionProtection: true,
            storageEncrypted: true,
        });

        // Primary cluster
        this.primaryCluster = new rds.DatabaseCluster(this, 'PrimaryCluster', {
            engine: rds.DatabaseClusterEngine.auroraPostgres({
                version: rds.AuroraPostgresEngineVersion.VER_15_4,
            }),
            credentials: rds.Credentials.fromSecret(this.masterSecret),
            defaultDatabaseName: props.databaseName,
            instanceProps: {
                instanceType: ec2.InstanceType.of(ec2.InstanceClass.R6G, ec2.InstanceSize.LARGE),
                vpcSubnets: {
                    subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
                },
                vpc: props.vpc,
            },
            instances: 2, // Multi-AZ for high availability
            subnetGroup: primarySubnetGroup,
            parameterGroup,
            storageEncrypted: true,
            storageEncryptionKey: this.kmsKey,
            backup: {
                retention: cdk.Duration.days(props.backupRetentionDays || 7),
                preferredWindow: '03:00-04:00',
            },
            preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
            cloudwatchLogsExports: ['postgresql'],
            cloudwatchLogsRetention: cdk.aws_logs.RetentionDays.ONE_MONTH,
            deletionProtection: true,
            globalClusterIdentifier: this.globalCluster.globalClusterIdentifier,
        });

        // Enable Performance Insights
        this.primaryCluster.node.children.forEach((child) => {
            if (child instanceof rds.DatabaseInstance) {
                (child.node.defaultChild as rds.CfnDBInstance).performanceInsightsEnabled = true;
                (child.node.defaultChild as rds.CfnDBInstance).performanceInsightsRetentionPeriod = 7;
                (child.node.defaultChild as rds.CfnDBInstance).performanceInsightsKmsKeyId = this.kmsKey.keyArn;
            }
        });

        // CloudWatch alarms for primary cluster
        new cdk.aws_cloudwatch.Alarm(this, 'PrimaryClusterCPUAlarm', {
            metric: this.primaryCluster.metricCPUUtilization(),
            threshold: 80,
            evaluationPeriods: 2,
            alarmDescription: 'Primary cluster CPU utilization high',
        });

        new cdk.aws_cloudwatch.Alarm(this, 'PrimaryClusterConnectionsAlarm', {
            metric: this.primaryCluster.metricDatabaseConnections(),
            threshold: 800, // 80% of max_connections
            evaluationPeriods: 2,
            alarmDescription: 'Primary cluster connection count high',
        });

        // Outputs
        new cdk.CfnOutput(this, 'GlobalClusterIdentifier', {
            value: this.globalCluster.globalClusterIdentifier!,
            description: 'Aurora Global Cluster identifier',
        });

        new cdk.CfnOutput(this, 'PrimaryClusterEndpoint', {
            value: this.primaryCluster.clusterEndpoint.socketAddress,
            description: 'Primary cluster writer endpoint',
        });

        new cdk.CfnOutput(this, 'PrimaryClusterReadEndpoint', {
            value: this.primaryCluster.clusterReadEndpoint.socketAddress,
            description: 'Primary cluster reader endpoint',
        });

        new cdk.CfnOutput(this, 'MasterSecretArn', {
            value: this.masterSecret.secretArn,
            description: 'Master credentials secret ARN',
        });

        new cdk.CfnOutput(this, 'KmsKeyArn', {
            value: this.kmsKey.keyArn,
            description: 'Multi-region KMS key ARN',
        });
    }

    /**
     * Create secondary cluster in another region
     */
    public createSecondaryCluster(
        scope: Construct,
        secondaryVpc: ec2.IVpc,
        secondaryRegion: string
    ): rds.DatabaseCluster {
        const secondarySubnetGroup = new rds.SubnetGroup(scope, 'SecondarySubnetGroup', {
            description: 'Subnet group for secondary Aurora cluster',
            vpc: secondaryVpc,
            subnetGroupName: `${this.stackName}-secondary-subnet-group`,
            vpcSubnets: {
                subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
            },
        });

        this.secondaryCluster = new rds.DatabaseCluster(scope, 'SecondaryCluster', {
            engine: rds.DatabaseClusterEngine.auroraPostgres({
                version: rds.AuroraPostgresEngineVersion.VER_15_4,
            }),
            instanceProps: {
                instanceType: ec2.InstanceType.of(ec2.InstanceClass.R6G, ec2.InstanceSize.LARGE),
                vpcSubnets: {
                    subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
                },
                vpc: secondaryVpc,
            },
            instances: 1, // Start with single instance, can scale up
            subnetGroup: secondarySubnetGroup,
            storageEncrypted: true,
            storageEncryptionKey: this.kmsKey,
            cloudwatchLogsExports: ['postgresql'],
            cloudwatchLogsRetention: cdk.aws_logs.RetentionDays.ONE_MONTH,
            globalClusterIdentifier: this.globalCluster.globalClusterIdentifier,
        });

        // CloudWatch alarms for secondary cluster
        new cdk.aws_cloudwatch.Alarm(scope, 'SecondaryClusterLagAlarm', {
            metric: this.secondaryCluster.metric('AuroraGlobalDBReplicationLag'),
            threshold: 60000, // 1 minute in milliseconds
            evaluationPeriods: 2,
            alarmDescription: 'Secondary cluster replication lag high',
        });

        return this.secondaryCluster;
    }
}