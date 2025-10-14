#!/usr/bin/env tsx

/**
 * Disaster Recovery Failover Script
 * 
 * This script executes a complete failover to the secondary region.
 * It should be used when the primary region is unavailable or degraded.
 * 
 * Usage:
 *   npx tsx scripts/dr-failover.ts [--reason "reason"] [--dry-run] [--force]
 */

import { Command } from 'commander';
import { FailoverManager, FailoverPolicy } from '../src/lib/multi-region/failover-manager';
import { HealthChecker } from '../src/lib/multi-region/health-checker';
import { MultiRegionConfig } from '../src/lib/multi-region/multi-region-orchestrator';

interface FailoverOptions {
    reason?: string;
    dryRun?: boolean;
    force?: boolean;
    skipHealthCheck?: boolean;
}

const program = new Command();

program
    .name('dr-failover')
    .description('Execute disaster recovery failover to secondary region')
    .option('-r, --reason <reason>', 'Reason for failover', 'Manual failover via script')
    .option('--dry-run', 'Simulate failover without making changes')
    .option('--force', 'Force failover even if health checks fail')
    .option('--skip-health-check', 'Skip pre-failover health validation')
    .parse();

const options = program.opts<FailoverOptions>();

// Configuration - should be loaded from environment or config file
const config: MultiRegionConfig = {
    primaryRegion: process.env.PRIMARY_REGION || 'eu-central-1',
    secondaryRegion: process.env.SECONDARY_REGION || 'eu-west-1',
    domainName: process.env.DOMAIN_NAME || 'matbakh.app',
    hostedZoneId: process.env.HOSTED_ZONE_ID || '',
    distributionId: process.env.CLOUDFRONT_DISTRIBUTION_ID || '',
    globalClusterIdentifier: process.env.GLOBAL_CLUSTER_ID || '',
    primaryClusterIdentifier: process.env.PRIMARY_CLUSTER_ID || '',
    secondaryClusterIdentifier: process.env.SECONDARY_CLUSTER_ID || '',
    primaryHealthCheckId: process.env.PRIMARY_HEALTH_CHECK_ID || '',
    secondaryHealthCheckId: process.env.SECONDARY_HEALTH_CHECK_ID || '',
};

const policy: FailoverPolicy = {
    automaticFailover: false, // Manual execution
    healthCheckFailureThreshold: 2,
    healthCheckInterval: 30,
    rtoTarget: 15, // 15 minutes
    rpoTarget: 1,  // 1 minute
    notificationEndpoints: [
        process.env.WEBHOOK_URL || '',
        process.env.ADMIN_EMAIL || 'admin@matbakh.app',
    ].filter(Boolean),
};

async function main() {
    console.log('🚨 Disaster Recovery Failover Script');
    console.log('=====================================');
    console.log(`Primary Region: ${config.primaryRegion}`);
    console.log(`Secondary Region: ${config.secondaryRegion}`);
    console.log(`Reason: ${options.reason}`);
    console.log(`Dry Run: ${options.dryRun ? 'Yes' : 'No'}`);
    console.log('');

    if (options.dryRun) {
        console.log('🔍 DRY RUN MODE - No changes will be made');
        console.log('');
    }

    try {
        // Validate configuration
        validateConfiguration();

        // Initialize components
        const healthChecker = new HealthChecker(config);
        const failoverManager = new FailoverManager(config, policy);

        // Pre-failover health check
        if (!options.skipHealthCheck) {
            console.log('🏥 Checking system health...');
            const healthStatus = await healthChecker.checkAllServices();

            console.log(`Overall Status: ${healthStatus.overall}`);
            console.log(`Primary Region: ${healthStatus.regions.primary.status}`);
            console.log(`Secondary Region: ${healthStatus.regions.secondary.status}`);
            console.log('');

            // Check if secondary region is healthy
            if (healthStatus.regions.secondary.status === 'unhealthy' && !options.force) {
                console.error('❌ Secondary region is unhealthy. Failover would not improve availability.');
                console.error('Use --force to proceed anyway, or fix secondary region issues first.');
                process.exit(1);
            }

            // Warn if primary region is actually healthy
            if (healthStatus.regions.primary.status === 'healthy' && !options.force) {
                console.warn('⚠️  Primary region appears healthy. Are you sure you want to failover?');
                console.warn('Use --force to proceed anyway.');

                // In a real implementation, you might want to prompt for confirmation
                if (!process.env.CI) {
                    const readline = require('readline');
                    const rl = readline.createInterface({
                        input: process.stdin,
                        output: process.stdout,
                    });

                    const answer = await new Promise<string>((resolve) => {
                        rl.question('Continue with failover? (yes/no): ', resolve);
                    });

                    rl.close();

                    if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
                        console.log('Failover cancelled.');
                        process.exit(0);
                    }
                }
            }
        }

        if (options.dryRun) {
            console.log('🔍 DRY RUN: Would execute failover with the following steps:');
            console.log('1. Validate secondary region health');
            console.log('2. Promote secondary database cluster');
            console.log('3. Update DNS failover records');
            console.log('4. Update CloudFront origin configuration');
            console.log('5. Update configuration parameters');
            console.log('6. Validate failover success');
            console.log('');
            console.log('✅ Dry run completed successfully');
            return;
        }

        // Execute failover
        console.log('🚀 Executing failover...');
        const startTime = new Date();

        const result = await failoverManager.executeManualFailover(options.reason!);

        const duration = (new Date().getTime() - startTime.getTime()) / 1000;

        if (result.success) {
            console.log('');
            console.log('✅ Failover completed successfully!');
            console.log(`Duration: ${duration.toFixed(1)} seconds`);
            console.log(`RTO Achieved: ${result.rtoAchieved.toFixed(1)} minutes`);
            console.log(`RPO Achieved: ${result.rpoAchieved.toFixed(1)} minutes`);
            console.log('');

            // Display completed steps
            console.log('Completed Steps:');
            result.steps.forEach((step, index) => {
                const status = step.status === 'completed' ? '✅' :
                    step.status === 'failed' ? '❌' : '⏳';
                const duration = step.duration ? ` (${step.duration}ms)` : '';
                console.log(`${index + 1}. ${status} ${step.step}${duration}`);
            });

            // Display rollback plan
            if (result.rollbackPlan) {
                console.log('');
                console.log('📋 Rollback Plan Available:');
                console.log(`Estimated Duration: ${result.rollbackPlan.estimatedDuration} minutes`);
                console.log(`Risk Level: ${result.rollbackPlan.riskLevel}`);
                console.log('Use scripts/dr-failback.ts to return to primary region');
            }

            // Check SLA compliance
            if (result.rtoAchieved > policy.rtoTarget) {
                console.warn(`⚠️  RTO target exceeded: ${result.rtoAchieved.toFixed(1)}min > ${policy.rtoTarget}min`);
            }

            if (result.rpoAchieved > policy.rpoTarget) {
                console.warn(`⚠️  RPO target exceeded: ${result.rpoAchieved.toFixed(1)}min > ${policy.rpoTarget}min`);
            }

        } else {
            console.log('');
            console.error('❌ Failover failed!');
            console.error(`Duration: ${duration.toFixed(1)} seconds`);
            console.log('');

            // Display failed steps
            console.log('Step Results:');
            result.steps.forEach((step, index) => {
                const status = step.status === 'completed' ? '✅' :
                    step.status === 'failed' ? '❌' :
                        step.status === 'in_progress' ? '⏳' : '⏸️';
                const duration = step.duration ? ` (${step.duration}ms)` : '';
                const error = step.error ? ` - ${step.error}` : '';
                console.log(`${index + 1}. ${status} ${step.step}${duration}${error}`);
            });

            console.log('');
            console.error('Please review the errors above and take corrective action.');
            console.error('The system may be in an inconsistent state.');

            process.exit(1);
        }

    } catch (error) {
        console.error('');
        console.error('💥 Failover script failed with error:');
        console.error(error instanceof Error ? error.message : error);
        console.error('');
        console.error('Please review the error and take corrective action.');
        process.exit(1);
    }
}

function validateConfiguration() {
    const required = [
        'primaryRegion',
        'secondaryRegion',
        'domainName',
        'hostedZoneId',
        'distributionId',
        'globalClusterIdentifier',
        'primaryClusterIdentifier',
        'secondaryClusterIdentifier',
        'primaryHealthCheckId',
        'secondaryHealthCheckId',
    ];

    const missing = required.filter(key => !config[key as keyof MultiRegionConfig]);

    if (missing.length > 0) {
        console.error('❌ Missing required configuration:');
        missing.forEach(key => {
            console.error(`  - ${key}`);
        });
        console.error('');
        console.error('Please set the required environment variables or update the configuration.');
        process.exit(1);
    }

    if (config.primaryRegion === config.secondaryRegion) {
        console.error('❌ Primary and secondary regions cannot be the same');
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('');
    console.log('⚠️  Failover interrupted by user');
    console.log('System may be in an inconsistent state - please verify manually');
    process.exit(1);
});

process.on('SIGTERM', () => {
    console.log('');
    console.log('⚠️  Failover terminated');
    console.log('System may be in an inconsistent state - please verify manually');
    process.exit(1);
});

if (require.main === module) {
    main().catch((error) => {
        console.error('Unhandled error:', error);
        process.exit(1);
    });
}