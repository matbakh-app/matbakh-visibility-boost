#!/usr/bin/env tsx
/**
 * Switch Origin Script - Blue-Green CloudFront origin switching
 * Uses AWS SDK v3 for reliable CloudFront operations with proper ETag handling
 */

import { execSync } from 'child_process';

interface SwitchOptions {
    environment: 'development' | 'staging' | 'production';
    targetSlot: 'blue' | 'green';
    skipInvalidation?: boolean;
    dryRun?: boolean;
    useMock?: boolean;
}

interface EnvironmentConfig {
    distributionId: string;
    region: string;
    domain: string;
}

interface DistributionConfig {
    config: any;
    etag: string;
}

class OriginSwitcher {
    private environments: Record<string, EnvironmentConfig> = {
        development: {
            distributionId: 'E1234567890DEV',
            region: 'eu-central-1',
            domain: 'dev.matbakh.app'
        },
        staging: {
            distributionId: 'E1234567890STG',
            region: 'eu-central-1',
            domain: 'staging.matbakh.app'
        },
        production: {
            distributionId: 'E2W4JULEW8BXSD',
            region: 'eu-central-1',
            domain: 'matbakh.app'
        }
    };

    /**
     * Switch CloudFront origin to target slot
     */
    async switchOrigin(options: SwitchOptions): Promise<void> {
        console.log(`🔄 Switching ${options.environment} origin to ${options.targetSlot} slot...`);

        const config = this.environments[options.environment];
        if (!config) {
            throw new Error(`Unknown environment: ${options.environment}`);
        }

        // Get current distribution config
        const distributionConfig = await this.getCurrentDistributionConfig(config, options.useMock);
        console.log(`   📋 Current ETag: ${distributionConfig.etag}`);

        // Check current origin
        const currentOriginPath = this.getCurrentOriginPath(distributionConfig.config);
        const currentSlot = this.originPathToSlot(currentOriginPath);

        console.log(`   🎯 Current slot: ${currentSlot || 'unknown'}`);
        console.log(`   🎯 Target slot: ${options.targetSlot}`);

        if (currentSlot === options.targetSlot) {
            console.log('   ✅ Already pointing to target slot, no switch needed');
            return;
        }

        // Update origin path
        const updatedConfig = this.updateOriginPath(distributionConfig.config, options.targetSlot);

        if (options.dryRun) {
            console.log('   🔍 Dry run - would update origin path to:', `/${options.targetSlot}`);
            return;
        }

        // Apply the update
        await this.updateDistribution(config, updatedConfig, distributionConfig.etag, options.useMock);

        // Wait for deployment
        await this.waitForDeployment(config);

        // Invalidate cache
        if (!options.skipInvalidation) {
            await this.invalidateCache(config);
        }

        console.log('✅ Origin switch completed successfully');
    }

    /**
     * Get current CloudFront distribution configuration
     */
    private async getCurrentDistributionConfig(config: EnvironmentConfig, useMock = false): Promise<DistributionConfig> {
        console.log('📡 Fetching current distribution config...');

        if (useMock) {
            console.log('   ⚠️  Mock mode: returning fake distribution config');
            return {
                config: {
                    Origins: {
                        Items: [{
                            OriginPath: '/blue'
                        }]
                    }
                },
                etag: 'mock-etag-123'
            };
        }

        try {
            const cloudFrontClient = new CloudFrontClient({
                region: 'us-east-1' // CloudFront API is always in us-east-1
            });

            const response = await cloudFrontClient.send(
                new GetDistributionConfigCommand({
                    Id: config.distributionId
                })
            );

            if (!response.DistributionConfig || !response.ETag) {
                throw new Error('No distribution config or ETag received from CloudFront');
            }

            return {
                config: response.DistributionConfig,
                etag: response.ETag
            };
        } catch (error) {
            throw new Error(`Failed to get distribution config: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Get current origin path from distribution config
     */
    private getCurrentOriginPath(distributionConfig: any): string {
        try {
            const origins = distributionConfig.Origins?.Items || [];
            if (origins.length === 0) {
                throw new Error('No origins found in distribution config');
            }

            // Get the primary origin (first one)
            const primaryOrigin = origins[0];
            return primaryOrigin.OriginPath || '';
        } catch (error) {
            throw new Error(`Failed to get current origin path: ${error.message}`);
        }
    }

    /**
     * Convert origin path to slot name
     */
    private originPathToSlot(originPath: string): 'blue' | 'green' | null {
        if (originPath === '/blue') return 'blue';
        if (originPath === '/green') return 'green';
        return null;
    }

    /**
     * Update origin path in distribution config
     */
    private updateOriginPath(distributionConfig: any, targetSlot: 'blue' | 'green'): any {
        const updatedConfig = JSON.parse(JSON.stringify(distributionConfig));
        const newOriginPath = `/${targetSlot}`;

        // Update all origins (usually just one)
        if (updatedConfig.Origins?.Items) {
            updatedConfig.Origins.Items.forEach((origin: any) => {
                origin.OriginPath = newOriginPath;
            });
        }

        // Update caller reference to ensure uniqueness
        updatedConfig.CallerReference = `switch-to-${targetSlot}-${Date.now()}`;

        return updatedConfig;
    }

    /**
     * Update CloudFront distribution with new config
     */
    private async updateDistribution(
        config: EnvironmentConfig,
        updatedConfig: any,
        etag: string,
        useMock = false
    ): Promise<void> {
        console.log('🔄 Updating CloudFront distribution...');

        if (useMock) {
            console.log('   ⚠️  Mock mode: would update distribution');
            return;
        }

        try {
            const cloudFrontClient = new CloudFrontClient({
                region: 'us-east-1' // CloudFront API is always in us-east-1
            });

            const response = await cloudFrontClient.send(
                new UpdateDistributionCommand({
                    Id: config.distributionId,
                    DistributionConfig: updatedConfig,
                    IfMatch: etag
                })
            );

            console.log('   ✅ Distribution update initiated');
            console.log(`   📋 New ETag: ${response.ETag}`);

        } catch (error: any) {
            if (error.name === 'PreconditionFailed') {
                throw new Error('Distribution was modified by another process. Please retry.');
            }
            throw new Error(`Failed to update distribution: ${error.message || 'Unknown error'}`);
        }
    }

    /**
     * Wait for CloudFront deployment to complete
     */
    private async waitForDeployment(config: EnvironmentConfig, maxWaitMinutes = 15): Promise<void> {
        console.log('⏳ Waiting for CloudFront deployment...');

        const maxWaitMs = maxWaitMinutes * 60 * 1000;
        const startTime = Date.now();
        const pollInterval = 30000; // 30 seconds

        while (Date.now() - startTime < maxWaitMs) {
            try {
                const status = await this.getDeploymentStatus(config);

                if (status === 'Deployed') {
                    console.log('   ✅ CloudFront deployment completed');
                    return;
                }

                const elapsed = Math.round((Date.now() - startTime) / 1000);
                console.log(`   ⏳ Status: ${status} (${elapsed}s elapsed)`);

                await this.sleep(pollInterval);
            } catch (error) {
                console.warn(`   ⚠️  Error checking deployment status: ${error.message}`);
                await this.sleep(pollInterval);
            }
        }

        throw new Error(`CloudFront deployment did not complete within ${maxWaitMinutes} minutes`);
    }

    /**
     * Get CloudFront deployment status
     */
    private async getDeploymentStatus(config: EnvironmentConfig): Promise<string> {
        const getStatusCommand = `
      aws cloudfront get-distribution \\
        --id "${config.distributionId}" \\
        --region "${config.region}" \\
        --query "Distribution.Status" \\
        --output text
    `.replace(/\s+/g, ' ').trim();

        return execSync(getStatusCommand, { encoding: 'utf8' }).trim();
    }

    /**
     * Invalidate CloudFront cache for critical files
     */
    private async invalidateCache(config: EnvironmentConfig): Promise<void> {
        console.log('🗑️  Creating CloudFront invalidation...');

        const paths = [
            '/index.html',
            '/manifest.json',
            '/service-worker.js'
        ];

        const pathsString = paths.join(' ');

        try {
            const invalidateCommand = `
        aws cloudfront create-invalidation \\
          --distribution-id "${config.distributionId}" \\
          --region "${config.region}" \\
          --paths ${pathsString} \\
          --output json
      `.replace(/\s+/g, ' ').trim();

            const result = execSync(invalidateCommand, { encoding: 'utf8' });
            const invalidation = JSON.parse(result);

            console.log(`   ✅ Invalidation created: ${invalidation.Invalidation.Id}`);
            console.log(`   📄 Paths: ${paths.join(', ')}`);

        } catch (error) {
            console.warn(`   ⚠️  Invalidation failed: ${error.message}`);
            // Don't fail the entire operation for invalidation errors
        }
    }

    /**
     * Get current active slot
     */
    async getCurrentSlot(environment: string): Promise<'blue' | 'green' | null> {
        const config = this.environments[environment];
        if (!config) {
            throw new Error(`Unknown environment: ${environment}`);
        }

        try {
            const distributionConfig = await this.getCurrentDistributionConfig(config);
            const originPath = this.getCurrentOriginPath(distributionConfig.config);
            return this.originPathToSlot(originPath);
        } catch (error) {
            console.error(`Failed to get current slot: ${error.message}`);
            return null;
        }
    }

    /**
     * Verify switch was successful
     */
    async verifySwitch(environment: string, expectedSlot: 'blue' | 'green'): Promise<boolean> {
        console.log('🔍 Verifying origin switch...');

        try {
            // Wait a bit for propagation
            await this.sleep(10000);

            const currentSlot = await this.getCurrentSlot(environment);

            if (currentSlot === expectedSlot) {
                console.log(`   ✅ Verified: Origin is now pointing to ${expectedSlot}`);
                return true;
            } else {
                console.log(`   ❌ Verification failed: Expected ${expectedSlot}, got ${currentSlot}`);
                return false;
            }
        } catch (error) {
            console.error(`   ❌ Verification error: ${error.message}`);
            return false;
        }
    }

    /**
     * Get distribution info
     */
    async getDistributionInfo(environment: string): Promise<void> {
        const config = this.environments[environment];
        if (!config) {
            throw new Error(`Unknown environment: ${environment}`);
        }

        try {
            const distributionConfig = await this.getCurrentDistributionConfig(config);
            const originPath = this.getCurrentOriginPath(distributionConfig.config);
            const currentSlot = this.originPathToSlot(originPath);
            const status = await this.getDeploymentStatus(config);

            console.log(`📊 Distribution Info for ${environment}:`);
            console.log(`   Distribution ID: ${config.distributionId}`);
            console.log(`   Domain: ${config.domain}`);
            console.log(`   Current Origin Path: ${originPath}`);
            console.log(`   Current Slot: ${currentSlot || 'unknown'}`);
            console.log(`   Status: ${status}`);
            console.log(`   ETag: ${distributionConfig.etag}`);

        } catch (error) {
            console.error(`Failed to get distribution info: ${error.message}`);
        }
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// CLI Interface
async function main() {
    const args = process.argv.slice(2);

    if (args.includes('--help') || args.includes('-h')) {
        console.log(`
Switch Origin Script

Usage: npm run deploy:switch [options]

Options:
  --env <environment>       Target environment (development|staging|production)
  --slot <slot>            Target slot (blue|green)
  --skip-invalidation      Skip cache invalidation
  --dry-run               Show what would be changed without doing it
  --current-slot          Show current active slot
  --info                  Show distribution information
  --verify <slot>         Verify origin is pointing to specified slot
  --help, -h              Show this help message

Examples:
  npm run deploy:switch --env production --slot green
  npm run deploy:switch --env staging --slot blue --skip-invalidation
  npm run deploy:switch --env production --current-slot
  npm run deploy:switch --env production --info
  npm run deploy:switch --env production --verify green
  npm run deploy:switch --env production --slot green --dry-run
`);
        return;
    }

    const switcher = new OriginSwitcher();

    // Handle info command
    if (args.includes('--info')) {
        const envIndex = args.indexOf('--env');
        if (envIndex === -1 || !args[envIndex + 1]) {
            console.error('❌ --env is required with --info');
            process.exit(1);
        }

        const environment = args[envIndex + 1];
        await switcher.getDistributionInfo(environment);
        return;
    }

    // Handle current-slot command
    if (args.includes('--current-slot')) {
        const envIndex = args.indexOf('--env');
        if (envIndex === -1 || !args[envIndex + 1]) {
            console.error('❌ --env is required with --current-slot');
            process.exit(1);
        }

        const environment = args[envIndex + 1];
        const currentSlot = await switcher.getCurrentSlot(environment);

        if (currentSlot) {
            console.log(`🎯 Current active slot for ${environment}: ${currentSlot}`);
        } else {
            console.log(`❓ Could not determine current slot for ${environment}`);
        }
        return;
    }

    // Handle verify command
    const verifyIndex = args.indexOf('--verify');
    if (verifyIndex !== -1 && args[verifyIndex + 1]) {
        const envIndex = args.indexOf('--env');
        if (envIndex === -1 || !args[envIndex + 1]) {
            console.error('❌ --env is required with --verify');
            process.exit(1);
        }

        const environment = args[envIndex + 1];
        const expectedSlot = args[verifyIndex + 1] as 'blue' | 'green';

        const verified = await switcher.verifySwitch(environment, expectedSlot);
        process.exit(verified ? 0 : 1);
    }

    // Parse switch options
    const options: Partial<SwitchOptions> = {};

    const envIndex = args.indexOf('--env');
    if (envIndex !== -1 && args[envIndex + 1]) {
        options.environment = args[envIndex + 1] as any;
    }

    const slotIndex = args.indexOf('--slot');
    if (slotIndex !== -1 && args[slotIndex + 1]) {
        options.targetSlot = args[slotIndex + 1] as any;
    }

    if (args.includes('--skip-invalidation')) {
        options.skipInvalidation = true;
    }

    if (args.includes('--dry-run')) {
        options.dryRun = true;
    }

    // Validate required options
    if (!options.environment) {
        console.error('❌ --env is required');
        process.exit(1);
    }

    if (!options.targetSlot) {
        console.error('❌ --slot is required');
        process.exit(1);
    }

    if (!['blue', 'green'].includes(options.targetSlot)) {
        console.error('❌ --slot must be either "blue" or "green"');
        process.exit(1);
    }

    try {
        await switcher.switchOrigin(options as SwitchOptions);

        if (!options.dryRun) {
            // Verify the switch
            const verified = await switcher.verifySwitch(options.environment!, options.targetSlot!);

            if (verified) {
                console.log('\n🎉 Origin switch completed and verified!');
                console.log(`   Environment: ${options.environment}`);
                console.log(`   Active Slot: ${options.targetSlot}`);
            } else {
                console.log('\n⚠️  Origin switch completed but verification failed');
                process.exit(1);
            }
        } else {
            console.log('\n🔍 Dry run completed - no changes were made');
        }

    } catch (error) {
        console.error('❌ Origin switch failed:', error.message);
        process.exit(1);
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(error => {
        console.error('❌ Script failed:', error);
        process.exit(1);
    });
}

export { OriginSwitcher };
