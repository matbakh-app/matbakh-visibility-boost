/**
 * Auto-Scaling Orchestrator
 * Manages auto-scaling configuration and monitoring for all AWS services
 */

import {
    defaultAwsDependencies,
    DeregisterScalableTargetCommand,
    DescribeAlarmsCommand,
    DescribeScalableTargetsCommand,
    PutFunctionConcurrencyCommand,
    PutMetricAlarmCommand,
    PutScalingPolicyCommand,
    RegisterScalableTargetCommand,
    type AwsDependencies
} from './aws-clients';

export interface AutoScalingConfig {
    environment: 'dev' | 'staging' | 'prod';
    sloTargets: {
        p95ResponseTime: number;
        errorRate: number;
        availability: number;
    };
    budgetLimits: {
        softBudget: number;
        burstBudget: number;
    };
}

export interface LambdaScalingConfig {
    functionName: string;
    functionArn: string;
    isApiFunction: boolean;
    isCriticalPath: boolean;
    provisionedConcurrency?: {
        min: number;
        max: number;
        targetUtilization: number;
    };
    reservedConcurrency?: number;
}

export interface RDSScalingConfig {
    dbInstanceIdentifier: string;
    enableStorageAutoScaling: boolean;
    maxAllocatedStorage?: number;
    alarmThresholds: {
        cpuUtilization: number;
        databaseConnections: number;
        freeableMemory: number;
    };
}

export interface ElastiCacheScalingConfig {
    replicationGroupId: string;
    minReplicas: number;
    maxReplicas: number;
    targetCpuUtilization: number;
    scaleInCooldown: number;
    scaleOutCooldown: number;
}

export class AutoScalingOrchestrator {
    private config: AutoScalingConfig;
    private region: string;
    private deps: AwsDependencies;

    constructor(
        config: AutoScalingConfig,
        deps: AwsDependencies = defaultAwsDependencies,
        region: string = process.env.AWS_REGION || 'eu-central-1'
    ) {
        this.config = config;
        this.deps = deps;
        this.region = region;
    }

    // Lazy-loaded clients via dependency injection
    private get lambdaClient() {
        return this.deps.makeLambdaClient(this.region);
    }

    private get autoScalingClient() {
        return this.deps.makeAppASClient(this.region);
    }

    private get cloudWatchClient() {
        return this.deps.makeCloudWatchClient(this.region);
    }

    /**
     * Configure Lambda auto-scaling with Provisioned Concurrency
     */
    async configureLambdaAutoScaling(config: LambdaScalingConfig): Promise<void> {
        console.log(`🔧 Configuring Lambda auto-scaling for ${config.functionName}...`);

        try {
            // Set Reserved Concurrency (cost protection)
            if (config.reservedConcurrency) {
                await this.setReservedConcurrency(config.functionName, config.reservedConcurrency);
            }

            // Configure Provisioned Concurrency for critical API functions
            if (config.provisionedConcurrency && config.isApiFunction && config.isCriticalPath) {
                await this.configureProvisionedConcurrency(config);
            }

            // Create CloudWatch alarms
            await this.createLambdaAlarms(config);

            console.log(`✅ Lambda auto-scaling configured for ${config.functionName}`);
        } catch (error) {
            console.error(`❌ Failed to configure Lambda auto-scaling for ${config.functionName}:`, error);
            throw error;
        }
    }

    /**
     * Configure RDS monitoring and alerting
     */
    async configureRDSMonitoring(config: RDSScalingConfig): Promise<void> {
        console.log(`🔧 Configuring RDS monitoring for ${config.dbInstanceIdentifier}...`);

        try {
            // Create CPU utilization alarm
            await this.createRDSCPUAlarm(config);

            // Create database connections alarm
            await this.createRDSConnectionsAlarm(config);

            // Create memory alarm
            await this.createRDSMemoryAlarm(config);

            console.log(`✅ RDS monitoring configured for ${config.dbInstanceIdentifier}`);
        } catch (error) {
            console.error(`❌ Failed to configure RDS monitoring for ${config.dbInstanceIdentifier}:`, error);
            throw error;
        }
    }

    /**
     * Configure ElastiCache auto-scaling
     */
    async configureElastiCacheAutoScaling(config: ElastiCacheScalingConfig): Promise<void> {
        console.log(`🔧 Configuring ElastiCache auto-scaling for ${config.replicationGroupId}...`);

        try {
            // Register scalable target
            await this.registerElastiCacheScalableTarget(config);

            // Create scaling policy
            await this.createElastiCacheScalingPolicy(config);

            // Create CloudWatch alarms
            await this.createElastiCacheAlarms(config);

            console.log(`✅ ElastiCache auto-scaling configured for ${config.replicationGroupId}`);
        } catch (error) {
            console.error(`❌ Failed to configure ElastiCache auto-scaling for ${config.replicationGroupId}:`, error);
            throw error;
        }
    }

    /**
     * Get current auto-scaling status
     */
    async getAutoScalingStatus(): Promise<{
        lambdaTargets: any[];
        elastiCacheTargets: any[];
        alarms: any[];
    }> {
        try {
            const [lambdaTargets, elastiCacheTargets, alarms] = await Promise.all([
                this.getScalableTargets('lambda'),
                this.getScalableTargets('elasticache'),
                this.getAlarms()
            ]);

            return {
                lambdaTargets,
                elastiCacheTargets,
                alarms
            };
        } catch (error) {
            console.error('❌ Failed to get auto-scaling status:', error);
            throw error;
        }
    }

    /**
     * Remove auto-scaling configuration
     */
    async removeAutoScaling(resourceId: string, serviceNamespace: string): Promise<void> {
        console.log(`🗑️ Removing auto-scaling for ${resourceId}...`);

        try {
            // Deregister scalable target
            await this.autoScalingClient.send(new DeregisterScalableTargetCommand({
                ServiceNamespace: serviceNamespace,
                ResourceId: resourceId,
                ScalableDimension: this.getScalableDimension(serviceNamespace)
            }));

            console.log(`✅ Auto-scaling removed for ${resourceId}`);
        } catch (error) {
            console.error(`❌ Failed to remove auto-scaling for ${resourceId}:`, error);
            throw error;
        }
    }

    // Private methods

    private async setReservedConcurrency(functionName: string, concurrency: number): Promise<void> {
        await this.lambdaClient.send(new PutFunctionConcurrencyCommand({
            FunctionName: functionName,
            ReservedConcurrentExecutions: concurrency
        }));

        console.log(`📊 Set reserved concurrency to ${concurrency} for ${functionName}`);
    }

    private async configureProvisionedConcurrency(config: LambdaScalingConfig): Promise<void> {
        if (!config.provisionedConcurrency) return;

        const { functionName, provisionedConcurrency } = config;

        // Register scalable target for provisioned concurrency
        await this.autoScalingClient.send(new RegisterScalableTargetCommand({
            ServiceNamespace: 'lambda',
            ResourceId: `function:${functionName}`,
            ScalableDimension: 'lambda:function:ProvisionedConcurrency',
            MinCapacity: provisionedConcurrency.min,
            MaxCapacity: provisionedConcurrency.max
        }));

        // Create target tracking scaling policy
        await this.autoScalingClient.send(new PutScalingPolicyCommand({
            PolicyName: `${functionName}-provisioned-concurrency-scaling`,
            ServiceNamespace: 'lambda',
            ResourceId: `function:${functionName}`,
            ScalableDimension: 'lambda:function:ProvisionedConcurrency',
            PolicyType: 'TargetTrackingScaling',
            TargetTrackingScalingPolicyConfiguration: {
                TargetValue: provisionedConcurrency.targetUtilization,
                PredefinedMetricSpecification: {
                    PredefinedMetricType: 'LambdaProvisionedConcurrencyUtilization'
                },
                ScaleInCooldown: 300, // 5 minutes
                ScaleOutCooldown: 120  // 2 minutes
            }
        }));

        console.log(`📈 Configured provisioned concurrency auto-scaling for ${functionName}`);
    }

    private async createLambdaAlarms(config: LambdaScalingConfig): Promise<void> {
        const { functionName } = config;
        const alarmPrefix = `${this.config.environment}-${functionName}`;

        // Throttles alarm
        await this.cloudWatchClient.send(new PutMetricAlarmCommand({
            AlarmName: `${alarmPrefix}-Throttles`,
            AlarmDescription: `Throttles detected for ${functionName}`,
            MetricName: 'Throttles',
            Namespace: 'AWS/Lambda',
            Statistic: 'Sum',
            Dimensions: [{ Name: 'FunctionName', Value: functionName }],
            Period: 300,
            EvaluationPeriods: 1,
            Threshold: 0,
            ComparisonOperator: 'GreaterThanThreshold',
            TreatMissingData: 'notBreaching'
        }));

        // Duration P95 alarm
        await this.cloudWatchClient.send(new PutMetricAlarmCommand({
            AlarmName: `${alarmPrefix}-HighDuration`,
            AlarmDescription: `High duration detected for ${functionName}`,
            MetricName: 'Duration',
            Namespace: 'AWS/Lambda',
            ExtendedStatistic: 'p95',
            Dimensions: [{ Name: 'FunctionName', Value: functionName }],
            Period: 300,
            EvaluationPeriods: 2,
            Threshold: this.config.sloTargets.p95ResponseTime,
            ComparisonOperator: 'GreaterThanThreshold'
        }));

        // Error rate alarm
        await this.cloudWatchClient.send(new PutMetricAlarmCommand({
            AlarmName: `${alarmPrefix}-HighErrorRate`,
            AlarmDescription: `High error rate detected for ${functionName}`,
            MetricName: 'Errors',
            Namespace: 'AWS/Lambda',
            Statistic: 'Sum',
            Dimensions: [{ Name: 'FunctionName', Value: functionName }],
            Period: 300,
            EvaluationPeriods: 2,
            Threshold: this.config.sloTargets.errorRate,
            ComparisonOperator: 'GreaterThanThreshold'
        }));
    }

    private async createRDSCPUAlarm(config: RDSScalingConfig): Promise<void> {
        const alarmName = `${this.config.environment}-${config.dbInstanceIdentifier}-HighCPU`;

        await this.cloudWatchClient.send(new PutMetricAlarmCommand({
            AlarmName: alarmName,
            AlarmDescription: `High CPU utilization for ${config.dbInstanceIdentifier}`,
            MetricName: 'CPUUtilization',
            Namespace: 'AWS/RDS',
            Statistic: 'Average',
            Dimensions: [{ Name: 'DBInstanceIdentifier', Value: config.dbInstanceIdentifier }],
            Period: 300,
            EvaluationPeriods: 2,
            Threshold: config.alarmThresholds.cpuUtilization,
            ComparisonOperator: 'GreaterThanThreshold'
        }));
    }

    private async createRDSConnectionsAlarm(config: RDSScalingConfig): Promise<void> {
        const alarmName = `${this.config.environment}-${config.dbInstanceIdentifier}-HighConnections`;

        await this.cloudWatchClient.send(new PutMetricAlarmCommand({
            AlarmName: alarmName,
            AlarmDescription: `High database connections for ${config.dbInstanceIdentifier}`,
            MetricName: 'DatabaseConnections',
            Namespace: 'AWS/RDS',
            Statistic: 'Average',
            Dimensions: [{ Name: 'DBInstanceIdentifier', Value: config.dbInstanceIdentifier }],
            Period: 300,
            EvaluationPeriods: 2,
            Threshold: config.alarmThresholds.databaseConnections,
            ComparisonOperator: 'GreaterThanThreshold'
        }));
    }

    private async createRDSMemoryAlarm(config: RDSScalingConfig): Promise<void> {
        const alarmName = `${this.config.environment}-${config.dbInstanceIdentifier}-LowMemory`;

        await this.cloudWatchClient.send(new PutMetricAlarmCommand({
            AlarmName: alarmName,
            AlarmDescription: `Low freeable memory for ${config.dbInstanceIdentifier}`,
            MetricName: 'FreeableMemory',
            Namespace: 'AWS/RDS',
            Statistic: 'Average',
            Dimensions: [{ Name: 'DBInstanceIdentifier', Value: config.dbInstanceIdentifier }],
            Period: 300,
            EvaluationPeriods: 2,
            Threshold: config.alarmThresholds.freeableMemory,
            ComparisonOperator: 'LessThanThreshold'
        }));
    }

    private async registerElastiCacheScalableTarget(config: ElastiCacheScalingConfig): Promise<void> {
        await this.autoScalingClient.send(new RegisterScalableTargetCommand({
            ServiceNamespace: 'elasticache',
            ResourceId: `replication-group/${config.replicationGroupId}`,
            ScalableDimension: 'elasticache:replication-group:Replicas',
            MinCapacity: config.minReplicas,
            MaxCapacity: config.maxReplicas
        }));
    }

    private async createElastiCacheScalingPolicy(config: ElastiCacheScalingConfig): Promise<void> {
        await this.autoScalingClient.send(new PutScalingPolicyCommand({
            PolicyName: `${config.replicationGroupId}-cpu-scaling`,
            ServiceNamespace: 'elasticache',
            ResourceId: `replication-group/${config.replicationGroupId}`,
            ScalableDimension: 'elasticache:replication-group:Replicas',
            PolicyType: 'TargetTrackingScaling',
            TargetTrackingScalingPolicyConfiguration: {
                TargetValue: config.targetCpuUtilization,
                PredefinedMetricSpecification: {
                    PredefinedMetricType: 'ElastiCachePrimaryEngineCPUUtilization'
                },
                ScaleInCooldown: config.scaleInCooldown,
                ScaleOutCooldown: config.scaleOutCooldown
            }
        }));
    }

    private async createElastiCacheAlarms(config: ElastiCacheScalingConfig): Promise<void> {
        const alarmPrefix = `${this.config.environment}-${config.replicationGroupId}`;

        // Memory usage alarm
        await this.cloudWatchClient.send(new PutMetricAlarmCommand({
            AlarmName: `${alarmPrefix}-HighMemoryUsage`,
            AlarmDescription: `High memory usage for ${config.replicationGroupId}`,
            MetricName: 'DatabaseMemoryUsagePercentage',
            Namespace: 'AWS/ElastiCache',
            Statistic: 'Average',
            Dimensions: [{ Name: 'ReplicationGroupId', Value: config.replicationGroupId }],
            Period: 300,
            EvaluationPeriods: 2,
            Threshold: 75,
            ComparisonOperator: 'GreaterThanThreshold'
        }));

        // Evictions alarm
        await this.cloudWatchClient.send(new PutMetricAlarmCommand({
            AlarmName: `${alarmPrefix}-Evictions`,
            AlarmDescription: `Evictions detected for ${config.replicationGroupId}`,
            MetricName: 'Evictions',
            Namespace: 'AWS/ElastiCache',
            Statistic: 'Sum',
            Dimensions: [{ Name: 'ReplicationGroupId', Value: config.replicationGroupId }],
            Period: 300,
            EvaluationPeriods: 1,
            Threshold: 0,
            ComparisonOperator: 'GreaterThanThreshold'
        }));
    }

    private async getScalableTargets(serviceNamespace: string): Promise<any[]> {
        try {
            const response = await this.autoScalingClient.send(
                new DescribeScalableTargetsCommand({ ServiceNamespace: serviceNamespace })
            );
            return response.ScalableTargets || [];
        } catch (error) {
            console.warn(`No scalable targets found for ${serviceNamespace}`);
            return [];
        }
    }

    private async getAlarms(): Promise<any[]> {
        try {
            const response = await this.cloudWatchClient.send(new DescribeAlarmsCommand({}));
            return response.MetricAlarms || [];
        } catch (error) {
            console.warn('Failed to get alarms');
            return [];
        }
    }

    private getScalableDimension(serviceNamespace: string): string {
        const dimensions: Record<string, string> = {
            'lambda': 'lambda:function:ProvisionedConcurrency',
            'elasticache': 'elasticache:replication-group:Replicas',
            'rds': 'rds:cluster:ReadReplicaCount'
        };
        return dimensions[serviceNamespace] || '';
    }
}