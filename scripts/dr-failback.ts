#!/usr/bin/env tsx

/**
 * Disaster Recovery Failback Script
 * 
 * This script executes a complete failback to the primary region.
 * It should be used after the primary region has recovered and is ready to resume operations.
 * 
 * Usage:
 *   npx tsx scripts/dr-failback.ts [--reason "reason"] [--dry-run] [--force]
 */

import { Command } from 'commander';
import { FailoverManager, FailoverPolicy } from '../src/lib/multi-region/failover-manager';
import { HealthChecker } from '../src/lib/multi-region/health-checker';
import { MultiRegionConfig } from '../src/lib/multi-region/multi-region-orchestrator';

interface FailbackOptions {
    reason?: string;
    dryRun?: boolean;
    force?: boolean;
    skipHealthCheck?: boolean;
}

const program = new Command();

program
    .name('dr-failback')
    .description('Execute disaster recovery failback to primary region')
    .option('-r, --reason <reason>', 'Reason for failback', 'Manual failback via script')
    .option('--dry-run', 'Simulate failback without making changes')
    .option('--force', 'Force failback even if health checks fail')
    .option('--skip-health-check', 'Skip pre-failback health validation')
    .parse();

const options = program.opts<FailbackOptions>();

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
    console.log('🔄 Disaster Recovery Failback Script');
    console.log('====================================');
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

        // Check current system status
        console.log('📊 Checking current system status...');
        const systemStatus = await failoverManager.getSystemStatus();

        console.log(`Current Active Region: ${systemStatus.currentRegion}`);
        console.log(`Failover In Progress: ${systemStatus.isFailoverInProgress ? 'Yes' : 'No'}`);
        console.log('');

        if (systemStatus.currentRegion === 'primary') {
            console.log('ℹ️  System is already running on primary region');
            if (!options.force) {
                console.log('No failback needed. Use --force to proceed anyway.');
                process.exit(0);
            }
        }

        if (systemStatus.isFailoverInProgress) {
            console.error('❌ Another failover operation is in progress');
            console.error('Please wait for it to complete before attempting failback');
            process.exit(1);
        }

        // Pre-failback health check
        if (!options.skipHealthCheck) {
            console.log('🏥 Checking system health...');
            const healthStatus = await healthChecker.checkAllServices();

            console.log(`Overall Status: ${healthStatus.overall}`);
            console.log(`Primary Region: ${healthStatus.regions.primary.status}`);
            console.log(`Secondary Region: ${healthStatus.regions.secondary.status}`);
            console.log('');

            // Check if primary region is healthy
            if (healthStatus.regions.primary.status !== 'healthy' && !options.force) {
                console.error('❌ Primary region is not healthy. Failback would not be safe.');
                console.error('Use --force to proceed anyway, or fix primary region issues first.');

                // Show specific issues
                const primaryServices = Object.values(healthStatus.regions.primary.services);
                const unhealthyServices = primaryServices.filter(s => s.status !== 'healthy');

                if (unhealthyServices.length > 0) {
                    console.error('');
                    console.error('Unhealthy services in primary region:');
                    unhealthyServices.forEach(service => {
                        console.error(`  - ${service.service}: ${service.status} ${service.error ? `(${service.error})` : ''}`);
                    });
                }

                process.exit(1);
            }

            // Warn about data synchronization
            console.log('⚠️  Important: Failback will synchronize data from secondary to primary region');
            console.log('   Any data written to secondary region during failover will be preserved');
            console.log('');
        }

        if (options.dryRun) {
            console.log('🔍 DRY RUN: Would execute failback with the following steps:');
            console.log('1. Validate primary region health');
            console.log('2. Re-establish database replication');
            console.log('3. Synchronize data to primary region');
            console.log('4. Switch DNS back to primary region');
            console.log('5. Update CloudFront to primary origin');
            console.log('6. Reset configuration to primary');
            console.log('');
            console.log('✅ Dry run completed successfully');
            return;
        }

        // Confirmation prompt for production
        if (!options.force && !process.env.CI) {
            const readline = require('readline');
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout,
            });

            console.log('🚨 This will switch production traffic back to the primary region');
            const answer = await new Promise<string>((resolve) => {
                rl.question('Are you sure you want to proceed? (yes/no): ', resolve);
            });

            rl.close();

            if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
                console.log('Failback cancelled.');
                process.exit(0);
            }
        }

        // Execute failback
        console.log('🚀 Executing failback...');
        const startTime = new Date();

        const result = await failoverManager.executeFailback(options.reason!);

        const duration = (new Date().getTime() - startTime.getTime()) / 1000;

        if (result.success) {
            console.log('');
            console.log('✅ Failback completed successfully!');
            console.log(`Duration: ${duration.toFixed(1)} seconds`);
            console.log(`RTO Achieved: ${result.rtoAchieved.toFixed(1)} minutes`);
            console.log('');

            // Display completed steps
            console.log('Completed Steps:');
            result.steps.forEach((step, index) => {
                const status = step.status === 'completed' ? '✅' :
                    step.status === 'failed' ? '❌' : '⏳';
                const duration = step.duration ? ` (${step.duration}ms)` : '';
                console.log(`${index + 1}. ${status} ${step.step}${duration}`);
            });

            // Post-failback recommendations
            console.log('');
            console.log('📋 Post-Failback Recommendations:');
            console.log('1. Monitor system health for the next 30 minutes');
            console.log('2. Verify all critical user journeys are working');
            console.log('3. Check database replication is functioning normally');
            console.log('4. Review and update incident documentation');
            console.log('5. Schedule a post-incident review meeting');

            // Check SLA compliance
            if (result.rtoAchieved > policy.rtoTarget) {
                console.warn(`⚠️  RTO target exceeded: ${result.rtoAchieved.toFixed(1)}min > ${policy.rtoTarget}min`);
            }

        } else {
            console.log('');
            console.error('❌ Failback failed!');
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
            console.error('Consider rolling back to secondary region if primary is unstable.');

            process.exit(1);
        }

    } catch (error) {
        console.error('');
        console.error('💥 Failback script failed with error:');
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
    console.log('⚠️  Failback interrupted by user');
    console.log('System may be in an inconsistent state - please verify manually');
    process.exit(1);
});

process.on('SIGTERM', () => {
    console.log('');
    console.log('⚠️  Failback terminated');
    console.log('System may be in an inconsistent state - please verify manually');
    process.exit(1);
});

if (require.main === module) {
    main().catch((error) => {
        console.error('Unhandled error:', error);
        process.exit(1);
    });
}