#!/usr/bin/env tsx

/**
 * Auto-Scaling Configuration Rollback Script
 * Provides safe rollback capabilities for auto-scaling changes
 * 
 * Version: 1.0.0
 * Reviewed: 2025-01-14
 */

import {
    ApplicationAutoScalingClient,
    DescribeScalableTargetsCommand,
    DescribeScalingPoliciesCommand,
    PutScalingPolicyCommand,
    RegisterScalableTargetCommand
} from '@aws-sdk/client-application-autoscaling';
import {
    CloudWatchClient,
    PutMetricAlarmCommand
} from '@aws-sdk/client-cloudwatch';
import {
    LambdaClient
} from '@aws-sdk/client-lambda';
import * as fs from 'fs/promises';

interface RollbackConfig {
    environment: 'dev' | 'staging' | 'prod';
    backupDate: string;
    dryRun: boolean;
    services: string[];
}

interface BackupData {
    timestamp: string;
    environment: string;
    scalableTargets: any[];
    scalingPolicies: any[];
    lambdaConcurrency: any[];
    provisionedConcurrency: any[];
    cloudWatchAlarms: any[];
}

class AutoScalingRollback {
    private autoScalingClient: ApplicationAutoScalingClient;
    private lambdaClient: LambdaClient;
    private cloudWatchClient: CloudWatchClient;
    private config: RollbackConfig;

    constructor(config: RollbackConfig) {
        this.config = config;

        const clientConfig = {
            region: process.env.AWS_REGION || 'eu-central-1'
        };

        this.autoScalingClient = new ApplicationAutoScalingClient(clientConfig);
        this.lambdaClient = new LambdaClient(clientConfig);
        this.cloudWatchClient = new CloudWatchClient(clientConfig);
    }

    async performRollback(): Promise<void> {
        console.log('🔄 Starting Auto-Scaling Configuration Rollback');
        console.log(`Environment: ${this.config.environment}`);
        console.log(`Backup Date: ${this.config.backupDate}`);
        console.log(`Dry Run: ${this.config.dryRun}`);
        console.log(`Services: ${this.config.services.join(', ')}`);
        console.log('');

        try {
            // Step 1: Create current state backup
            console.log('💾 Step 1: Creating current state backup...');
            await this.createCurrentStateBackup();

            // Step 2: Load target backup
            console.log('📂 Step 2: Loading target backup...');
            const backupData = await this.loadBackup(this.config.backupDate);

            // Step 3: Validate backup
            console.log('✅ Step 3: Validating backup data...');
            this.validateBackup(backupData);

            // Step 4: Perform rollback
            console.log('🔄 Step 4: Performing rollback...');
            await this.executeRollback(backupData);

            // Step 5: Verify rollback
            console.log('🔍 Step 5: Verifying rollback...');
            await this.verifyRollback(backupData);

            console.log('✅ Rollback completed successfully!');

        } catch (error) {
            console.error('❌ Rollback failed:', error);

            // Attempt to restore from current state backup
            console.log('🚨 Attempting to restore from current state backup...');
            await this.restoreFromCurrentStateBackup();

            throw error;
        }
    }

    private async createCurrentStateBackup(): Promise<void> {
        const timestamp = new Date().toISOString();
        const backupData: BackupData = {
            timestamp,
            environment: this.config.environment,
            scalableTargets: [],
            scalingPolicies: [],
            lambdaConcurrency: [],
            provisionedConcurrency: [],
            cloudWatchAlarms: []
        };

        // Backup scalable targets
        if (this.config.services.includes('lambda')) {
            const lambdaTargets = await this.autoScalingClient.send(
                new DescribeScalableTargetsCommand({ ServiceNamespace: 'lambda' })
            );
            backupData.scalableTargets.push(...(lambdaTargets.ScalableTargets || []));

            const lambdaPolicies = await this.autoScalingClient.send(
                new DescribeScalingPoliciesCommand({ ServiceNamespace: 'lambda' })
            );
            backupData.scalingPolicies.push(...(lambdaPolicies.ScalingPolicies || []));
        }

        if (this.config.services.includes('elasticache')) {
            const elastiCacheTargets = await this.autoScalingClient.send(
                new DescribeScalableTargetsCommand({ ServiceNamespace: 'elasticache' })
            );
            backupData.scalableTargets.push(...(elastiCacheTargets.ScalableTargets || []));

            const elastiCachePolicies = await this.autoScalingClient.send(
                new DescribeScalingPoliciesCommand({ ServiceNamespace: 'elasticache' })
            );
            backupData.scalingPolicies.push(...(elastiCachePolicies.ScalingPolicies || []));
        }

        // Save current state backup
        const backupPath = `backup/auto-scaling-current-${timestamp.replace(/[:.]/g, '-')}.json`;
        await this.ensureBackupDirectory();
        await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2));

        console.log(`✅ Current state backed up to: ${backupPath}`);
    }

    private async loadBackup(backupDate: string): Promise<BackupData> {
        const backupPath = `backup/auto-scaling-${this.config.environment}-${backupDate}.json`;

        try {
            const backupContent = await fs.readFile(backupPath, 'utf-8');
            return JSON.parse(backupContent);
        } catch (error) {
            throw new Error(`Failed to load backup from ${backupPath}: ${error}`);
        }
    }

    private validateBackup(backupData: BackupData): void {
        if (backupData.environment !== this.config.environment) {
            throw new Error(`Backup environment (${backupData.environment}) doesn't match target (${this.config.environment})`);
        }

        if (!backupData.timestamp) {
            throw new Error('Backup data is missing timestamp');
        }

        console.log(`✅ Backup validation passed (${backupData.timestamp})`);
    }

    private async executeRollback(backupData: BackupData): Promise<void> {
        if (this.config.dryRun) {
            console.log('🔍 DRY RUN: Would perform the following rollback actions:');
            this.printRollbackPlan(backupData);
            return;
        }

        // Rollback Lambda configurations
        if (this.config.services.includes('lambda')) {
            await this.rollbackLambdaConfigurations(backupData);
        }

        // Rollback ElastiCache configurations
        if (this.config.services.includes('elasticache')) {
            await this.rollbackElastiCacheConfigurations(backupData);
        }

        // Rollback CloudWatch alarms
        await this.rollbackCloudWatchAlarms(backupData);
    }

    private async rollbackLambdaConfigurations(backupData: BackupData): Promise<void> {
        console.log('🔄 Rolling back Lambda configurations...');

        const lambdaTargets = backupData.scalableTargets.filter(t =>
            t.ServiceNamespace === 'lambda'
        );

        const lambdaPolicies = backupData.scalingPolicies.filter(p =>
            p.ServiceNamespace === 'lambda'
        );

        // Restore scalable targets
        for (const target of lambdaTargets) {
            console.log(`  Restoring scalable target: ${target.ResourceId}`);

            await this.autoScalingClient.send(
                new RegisterScalableTargetCommand({
                    ServiceNamespace: target.ServiceNamespace,
                    ResourceId: target.ResourceId,
                    ScalableDimension: target.ScalableDimension,
                    MinCapacity: target.MinCapacity,
                    MaxCapacity: target.MaxCapacity,
                    RoleARN: target.RoleARN
                })
            );
        }

        // Restore scaling policies
        for (const policy of lambdaPolicies) {
            console.log(`  Restoring scaling policy: ${policy.PolicyName}`);

            await this.autoScalingClient.send(
                new PutScalingPolicyCommand({
                    PolicyName: policy.PolicyName,
                    ServiceNamespace: policy.ServiceNamespace,
                    ResourceId: policy.ResourceId,
                    ScalableDimension: policy.ScalableDimension,
                    PolicyType: policy.PolicyType,
                    TargetTrackingScalingPolicyConfiguration: policy.TargetTrackingScalingPolicyConfiguration,
                    StepScalingPolicyConfiguration: policy.StepScalingPolicyConfiguration
                })
            );
        }

        console.log('✅ Lambda configurations rolled back');
    }

    private async rollbackElastiCacheConfigurations(backupData: BackupData): Promise<void> {
        console.log('🔄 Rolling back ElastiCache configurations...');

        const elastiCacheTargets = backupData.scalableTargets.filter(t =>
            t.ServiceNamespace === 'elasticache'
        );

        const elastiCachePolicies = backupData.scalingPolicies.filter(p =>
            p.ServiceNamespace === 'elasticache'
        );

        // Restore scalable targets
        for (const target of elastiCacheTargets) {
            console.log(`  Restoring ElastiCache target: ${target.ResourceId}`);

            await this.autoScalingClient.send(
                new RegisterScalableTargetCommand({
                    ServiceNamespace: target.ServiceNamespace,
                    ResourceId: target.ResourceId,
                    ScalableDimension: target.ScalableDimension,
                    MinCapacity: target.MinCapacity,
                    MaxCapacity: target.MaxCapacity,
                    RoleARN: target.RoleARN
                })
            );
        }

        // Restore scaling policies
        for (const policy of elastiCachePolicies) {
            console.log(`  Restoring ElastiCache policy: ${policy.PolicyName}`);

            await this.autoScalingClient.send(
                new PutScalingPolicyCommand({
                    PolicyName: policy.PolicyName,
                    ServiceNamespace: policy.ServiceNamespace,
                    ResourceId: policy.ResourceId,
                    ScalableDimension: policy.ScalableDimension,
                    PolicyType: policy.PolicyType,
                    TargetTrackingScalingPolicyConfiguration: policy.TargetTrackingScalingPolicyConfiguration
                })
            );
        }

        console.log('✅ ElastiCache configurations rolled back');
    }

    private async rollbackCloudWatchAlarms(backupData: BackupData): Promise<void> {
        console.log('🔄 Rolling back CloudWatch alarms...');

        for (const alarm of backupData.cloudWatchAlarms) {
            console.log(`  Restoring alarm: ${alarm.AlarmName}`);

            await this.cloudWatchClient.send(
                new PutMetricAlarmCommand({
                    AlarmName: alarm.AlarmName,
                    AlarmDescription: alarm.AlarmDescription,
                    MetricName: alarm.MetricName,
                    Namespace: alarm.Namespace,
                    Statistic: alarm.Statistic,
                    Dimensions: alarm.Dimensions,
                    Period: alarm.Period,
                    EvaluationPeriods: alarm.EvaluationPeriods,
                    Threshold: alarm.Threshold,
                    ComparisonOperator: alarm.ComparisonOperator,
                    TreatMissingData: alarm.TreatMissingData,
                    AlarmActions: alarm.AlarmActions
                })
            );
        }

        console.log('✅ CloudWatch alarms rolled back');
    }

    private async verifyRollback(backupData: BackupData): Promise<void> {
        console.log('🔍 Verifying rollback...');

        // Verify Lambda targets
        const currentLambdaTargets = await this.autoScalingClient.send(
            new DescribeScalableTargetsCommand({ ServiceNamespace: 'lambda' })
        );

        const expectedLambdaTargets = backupData.scalableTargets.filter(t =>
            t.ServiceNamespace === 'lambda'
        );

        if (currentLambdaTargets.ScalableTargets?.length !== expectedLambdaTargets.length) {
            throw new Error('Lambda scalable targets count mismatch after rollback');
        }

        // Verify ElastiCache targets
        const currentElastiCacheTargets = await this.autoScalingClient.send(
            new DescribeScalableTargetsCommand({ ServiceNamespace: 'elasticache' })
        );

        const expectedElastiCacheTargets = backupData.scalableTargets.filter(t =>
            t.ServiceNamespace === 'elasticache'
        );

        if (currentElastiCacheTargets.ScalableTargets?.length !== expectedElastiCacheTargets.length) {
            throw new Error('ElastiCache scalable targets count mismatch after rollback');
        }

        console.log('✅ Rollback verification passed');
    }

    private printRollbackPlan(backupData: BackupData): void {
        console.log('\n📋 Rollback Plan:');
        console.log('─'.repeat(50));

        console.log(`\n🎯 Scalable Targets to restore: ${backupData.scalableTargets.length}`);
        backupData.scalableTargets.forEach(target => {
            console.log(`  - ${target.ServiceNamespace}/${target.ResourceId} (${target.MinCapacity}-${target.MaxCapacity})`);
        });

        console.log(`\n📊 Scaling Policies to restore: ${backupData.scalingPolicies.length}`);
        backupData.scalingPolicies.forEach(policy => {
            console.log(`  - ${policy.PolicyName} (${policy.PolicyType})`);
        });

        console.log(`\n🚨 CloudWatch Alarms to restore: ${backupData.cloudWatchAlarms.length}`);
        backupData.cloudWatchAlarms.forEach(alarm => {
            console.log(`  - ${alarm.AlarmName}`);
        });
    }

    private async restoreFromCurrentStateBackup(): Promise<void> {
        console.log('🚨 Attempting emergency restore from current state backup...');

        try {
            // Find the most recent current state backup
            const backupFiles = await fs.readdir('backup');
            const currentStateBackups = backupFiles
                .filter(f => f.startsWith('auto-scaling-current-'))
                .sort()
                .reverse();

            if (currentStateBackups.length === 0) {
                throw new Error('No current state backup found');
            }

            const latestBackup = currentStateBackups[0];
            console.log(`Using backup: ${latestBackup}`);

            const backupData = await this.loadBackup(latestBackup.replace('.json', '').replace('auto-scaling-current-', ''));
            await this.executeRollback(backupData);

            console.log('✅ Emergency restore completed');
        } catch (error) {
            console.error('❌ Emergency restore failed:', error);
        }
    }

    private async ensureBackupDirectory(): Promise<void> {
        try {
            await fs.access('backup');
        } catch {
            await fs.mkdir('backup', { recursive: true });
        }
    }
}

// CLI Interface
async function main() {
    const args = process.argv.slice(2);

    if (args.includes('--help') || args.includes('-h')) {
        printHelp();
        return;
    }

    const config: RollbackConfig = {
        environment: (args.find(arg => arg.startsWith('--env='))?.split('=')[1] as 'dev' | 'staging' | 'prod') || 'staging',
        backupDate: args.find(arg => arg.startsWith('--date='))?.split('=')[1] || '',
        dryRun: args.includes('--dry-run'),
        services: args.find(arg => arg.startsWith('--services='))?.split('=')[1]?.split(',') || ['lambda', 'elasticache']
    };

    if (!config.backupDate) {
        console.error('❌ Backup date is required. Use --date=YYYY-MM-DD');
        process.exit(1);
    }

    if (!['dev', 'staging', 'prod'].includes(config.environment)) {
        console.error('❌ Environment must be dev, staging, or prod');
        process.exit(1);
    }

    try {
        const rollback = new AutoScalingRollback(config);
        await rollback.performRollback();
    } catch (error) {
        console.error('❌ Rollback failed:', error);
        process.exit(1);
    }
}

function printHelp() {
    console.log(`
Auto-Scaling Configuration Rollback Script

Usage: tsx scripts/auto-scaling-rollback.ts [options]

Options:
  --env=<environment>     Target environment (dev|staging|prod) [default: staging]
  --date=<YYYY-MM-DD>     Backup date to rollback to (required)
  --services=<list>       Comma-separated list of services (lambda,elasticache) [default: lambda,elasticache]
  --dry-run               Show what would be done without making changes
  -h, --help              Show this help message

Examples:
  tsx scripts/auto-scaling-rollback.ts --env=staging --date=2025-01-13
  tsx scripts/auto-scaling-rollback.ts --env=prod --date=2025-01-13 --dry-run
  tsx scripts/auto-scaling-rollback.ts --env=staging --date=2025-01-13 --services=lambda
`);
}

if (require.main === module) {
    main();
}

export { AutoScalingRollback };
