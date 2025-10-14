#!/usr/bin/env tsx
/**
 * Enhanced Rollback System - Blue-Green slot rollback with CloudFront switching
 * Integrates with existing enhanced-rollback-system.ts for comprehensive rollback
 */

import { deploymentOrchestrator } from '../../src/lib/deployment/deployment-orchestrator';
import { SmokeTestSuite } from './smoke-suite';
import { OriginSwitcher } from './switch-origin';

interface RollbackOptions {
    environment: 'development' | 'staging' | 'production';
    deploymentId?: string;
    targetSlot?: 'blue' | 'green';
    reason: string;
    skipHealthCheck?: boolean;
    force?: boolean;
    dryRun?: boolean;
}

interface RollbackResult {
    success: boolean;
    deploymentId: string;
    previousSlot: string;
    newSlot: string;
    duration: number;
    healthCheckPassed?: boolean;
    reason: string;
}

class RollbackSystem {
    private environments = {
        development: {
            bucketName: 'matbakhvcstack-webbucket12880f5b-svct6cxfbip5',
            distributionId: 'E2W4JULEW8BXSD',
            domain: 'matbakh.app'
        },
        staging: {
            bucketName: 'matbakhvcstack-webbucket12880f5b-svct6cxfbip5',
            distributionId: 'E2W4JULEW8BXSD',
            domain: 'matbakh.app'
        },
        production: {
            bucketName: 'matbakhvcstack-webbucket12880f5b-svct6cxfbip5',
            distributionId: 'E2W4JULEW8BXSD',
            domain: 'matbakh.app'
        }
    };

    /**
     * Execute rollback with Blue-Green slot switching
     */
    async executeRollback(options: RollbackOptions): Promise<RollbackResult> {
        const startTime = Date.now();
        console.log('🔄 Starting deployment rollback...\\n');

        try {
            // Step 1: Validate rollback eligibility
            const rollbackInfo = await this.validateRollback(options);

            // Step 2: Get confirmation for production rollbacks
            if (!options.force && options.environment === 'production') {
                await this.getProductionRollbackConfirmation(options, rollbackInfo);
            }

            if (options.dryRun) {
                console.log('🔍 Dry run completed - rollback would be executed');
                return {
                    success: true,
                    deploymentId: rollbackInfo.deploymentId,
                    previousSlot: rollbackInfo.currentSlot,
                    newSlot: rollbackInfo.targetSlot,
                    duration: Date.now() - startTime,
                    reason: options.reason
                };
            }

            // Step 3: Execute Blue-Green slot switch
            await this.executeSlotSwitch(options, rollbackInfo);

            // Step 4: Verify rollback success
            const healthCheckPassed = options.skipHealthCheck ? undefined :
                await this.verifyRollbackHealth(options, rollbackInfo);

            // Step 5: Update deployment status
            if (rollbackInfo.deploymentId) {
                await deploymentOrchestrator.rollbackDeployment(
                    rollbackInfo.deploymentId,
                    options.reason
                );
            }

            const duration = Date.now() - startTime;

            console.log('\\n✅ Rollback completed successfully!');

            return {
                success: true,
                deploymentId: rollbackInfo.deploymentId,
                previousSlot: rollbackInfo.currentSlot,
                newSlot: rollbackInfo.targetSlot,
                duration,
                healthCheckPassed,
                reason: options.reason
            };

        } catch (error) {
            console.error('❌ Rollback failed:', error instanceof Error ? error.message : 'Unknown error');

            return {
                success: false,
                deploymentId: options.deploymentId || 'unknown',
                previousSlot: 'unknown',
                newSlot: 'unknown',
                duration: Date.now() - startTime,
                reason: `Rollback failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }

    /**
     * Validate rollback eligibility and determine target slot
     */
    private async validateRollback(options: RollbackOptions): Promise<{
        deploymentId: string;
        currentSlot: 'blue' | 'green';
        targetSlot: 'blue' | 'green';
        canRollback: boolean;
        reason?: string;
    }> {
        console.log('🔍 Validating rollback eligibility...');

        // Get current active slot
        const switcher = new OriginSwitcher();
        const currentSlot = await switcher.getCurrentSlot(options.environment);

        if (!currentSlot) {
            throw new Error('Cannot determine current active slot');
        }

        console.log(`   Current active slot: ${currentSlot}`);

        // Determine target slot
        let targetSlot: 'blue' | 'green';
        if (options.targetSlot) {
            targetSlot = options.targetSlot;
            console.log(`   Target slot (specified): ${targetSlot}`);
        } else {
            // Switch to opposite slot
            targetSlot = currentSlot === 'blue' ? 'green' : 'blue';
            console.log(`   Target slot (auto): ${targetSlot}`);
        }

        if (currentSlot === targetSlot) {
            if (!options.force) {
                throw new Error(`Already on target slot ${targetSlot}. Use --force to proceed anyway.`);
            }
            console.log('   ⚠️  Already on target slot, but forcing rollback');
        }

        // Find deployment ID if not provided
        let deploymentId = options.deploymentId;
        if (!deploymentId) {
            deploymentId = await this.findLatestDeployment(options.environment);
            if (deploymentId) {
                console.log(`   Found latest deployment: ${deploymentId}`);
            } else {
                console.log('   No deployment ID found - proceeding with slot switch only');
                deploymentId = `manual-rollback-${Date.now()}`;
            }
        }

        // Verify target slot has content
        await this.verifySlotHasContent(options.environment, targetSlot);

        console.log('   ✅ Rollback validation passed');

        return {
            deploymentId,
            currentSlot,
            targetSlot,
            canRollback: true
        };
    }

    /**
     * Find latest deployment for environment
     */
    private async findLatestDeployment(environment: string): Promise<string | null> {
        const deployments = deploymentOrchestrator.listDeployments();

        const envDeployments = deployments
            .filter(d => d.environment === environment)
            .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());

        return envDeployments.length > 0 ? envDeployments[0].id : null;
    }

    /**
     * Verify target slot has content
     */
    private async verifySlotHasContent(environment: string, slot: 'blue' | 'green'): Promise<void> {
        const config = this.environments[environment];
        const { execSync } = await import('child_process');

        try {
            const lsCommand = `aws s3 ls s3://${config.bucketName}/${slot}/index.html`;
            execSync(lsCommand, { stdio: 'pipe' });
            console.log(`   ✅ Target slot ${slot} has content`);
        } catch (error) {
            throw new Error(`Target slot ${slot} appears to be empty or inaccessible`);
        }
    }

    /**
     * Get production rollback confirmation
     */
    private async getProductionRollbackConfirmation(
        options: RollbackOptions,
        rollbackInfo: any
    ): Promise<void> {
        console.log('\\n🚨 PRODUCTION ROLLBACK CONFIRMATION REQUIRED');
        console.log(`   Environment: ${options.environment}`);
        console.log(`   Current Slot: ${rollbackInfo.currentSlot}`);
        console.log(`   Target Slot: ${rollbackInfo.targetSlot}`);
        console.log(`   Reason: ${options.reason}`);
        console.log(`   This will affect live users!`);
        console.log('\\n   In a real implementation, this would require manual approval.');
        console.log('   For demo purposes, auto-approving...\\n');

        await this.sleep(3000);
    }

    /**
     * Execute Blue-Green slot switch
     */
    private async executeSlotSwitch(
        options: RollbackOptions,
        rollbackInfo: any
    ): Promise<void> {
        console.log(`🔄 Switching from ${rollbackInfo.currentSlot} to ${rollbackInfo.targetSlot}...`);

        const switcher = new OriginSwitcher();

        await switcher.switchOrigin({
            environment: options.environment,
            targetSlot: rollbackInfo.targetSlot,
            skipInvalidation: false, // Always invalidate on rollback
            dryRun: false
        });

        console.log('   ✅ Slot switch completed');
    }

    /**
     * Verify rollback health
     */
    private async verifyRollbackHealth(
        options: RollbackOptions,
        rollbackInfo: any
    ): Promise<boolean> {
        console.log('🔍 Verifying rollback health...');

        const config = this.environments[options.environment];
        const suite = new SmokeTestSuite();

        try {
            const result = await suite.runSmokeTests({
                baseUrl: `https://${config.domain}`,
                timeout: 10000,
                skipPerformance: true, // Skip performance tests for rollback verification
                skipAccessibility: true, // Skip accessibility tests for rollback verification
                skipSecurity: true, // Skip security tests for rollback verification
                environment: options.environment
            });

            if (result.passed) {
                console.log('   ✅ Rollback health verification passed');
                return true;
            } else {
                console.log('   ⚠️  Rollback health verification failed, but rollback completed');
                console.log(`   Details: ${result.summary}`);
                return false;
            }
        } catch (error) {
            console.log('   ⚠️  Health verification error, but rollback completed');
            console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return false;
        }
    }

    /**
     * Get current deployment status
     */
    async getCurrentDeploymentStatus(environment: string): Promise<{
        currentSlot: 'blue' | 'green' | null;
        latestDeployment?: any;
        canRollback: boolean;
    }> {
        const switcher = new OriginSwitcher();
        const currentSlot = await switcher.getCurrentSlot(environment);

        const deployments = deploymentOrchestrator.listDeployments();
        const latestDeployment = deployments
            .filter(d => d.environment === environment)
            .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())[0];

        const canRollback = currentSlot !== null &&
            (latestDeployment?.status === 'success' || latestDeployment?.status === 'failed');

        return {
            currentSlot,
            latestDeployment,
            canRollback
        };
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// CLI Interface
async function main() {
    const args = process.argv.slice(2);

    if (args.includes('--help') || args.includes('-h')) {
        console.log(`\\nEnhanced Rollback System\\n\\nUsage: npm run deploy:rollback [options]\\n\\nOptions:\\n  --env <environment>       Target environment (development|staging|production)\\n  --deployment-id <id>      Specific deployment ID to rollback (optional)\\n  --target-slot <slot>      Target slot (blue|green) - auto-detects if not specified\\n  --reason <reason>         Reason for rollback (required)\\n  --skip-health-check       Skip post-rollback health verification\\n  --force                   Force rollback even if validation fails\\n  --dry-run                Show what would be rolled back without doing it\\n  --status                 Show current deployment status\\n  --help, -h               Show this help message\\n\\nExamples:\\n  npm run deploy:rollback --env production --reason "Critical bug detected"\\n  npm run deploy:rollback --env staging --target-slot blue --reason "Failed tests"\\n  npm run deploy:rollback --env production --reason "Performance issues" --force\\n  npm run deploy:rollback --env production --status\\n  npm run deploy:rollback --env production --reason "Test rollback" --dry-run\\n`);
        return;
    }

    const rollbackSystem = new RollbackSystem();

    // Handle status command
    if (args.includes('--status')) {
        const envIndex = args.indexOf('--env');
        if (envIndex === -1 || !args[envIndex + 1]) {
            console.error('❌ --env is required with --status');
            process.exit(1);
        }

        const environment = args[envIndex + 1];
        const status = await rollbackSystem.getCurrentDeploymentStatus(environment);

        console.log(`📊 Deployment Status for ${environment}:`);
        console.log(`   Current Slot: ${status.currentSlot || 'unknown'}`);
        console.log(`   Can Rollback: ${status.canRollback ? 'Yes' : 'No'}`);

        if (status.latestDeployment) {
            console.log(`   Latest Deployment: ${status.latestDeployment.id}`);
            console.log(`   Status: ${status.latestDeployment.status}`);
            console.log(`   Git SHA: ${status.latestDeployment.gitSha}`);
            console.log(`   Started: ${status.latestDeployment.startTime.toISOString()}`);
        } else {
            console.log('   Latest Deployment: None found');
        }

        return;
    }

    const options: RollbackOptions = {
        environment: 'staging' as any,
        reason: '',
        skipHealthCheck: false,
        force: false,
        dryRun: false
    };

    // Parse command line arguments
    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--env':
                options.environment = args[++i] as any;
                break;
            case '--deployment-id':
                options.deploymentId = args[++i];
                break;
            case '--target-slot':
                options.targetSlot = args[++i] as any;
                break;
            case '--reason':
                options.reason = args[++i];
                break;
            case '--skip-health-check':
                options.skipHealthCheck = true;
                break;
            case '--force':
                options.force = true;
                break;
            case '--dry-run':
                options.dryRun = true;
                break;
        }
    }

    // Validate required options
    if (!options.reason) {
        console.error('❌ Rollback reason is required. Use --reason "your reason here"');
        process.exit(1);
    }

    if (!['development', 'staging', 'production'].includes(options.environment)) {
        console.error('❌ Invalid environment. Must be: development, staging, or production');
        process.exit(1);
    }

    if (options.targetSlot && !['blue', 'green'].includes(options.targetSlot)) {
        console.error('❌ Invalid target slot. Must be: blue or green');
        process.exit(1);
    }

    try {
        const result = await rollbackSystem.executeRollback(options);

        if (result.success) {
            console.log('\\n🎉 Rollback completed successfully!');
            console.log(`   Environment: ${options.environment}`);
            console.log(`   Switched from: ${result.previousSlot} → ${result.newSlot}`);
            console.log(`   Duration: ${Math.round(result.duration / 1000)}s`);

            if (result.healthCheckPassed !== undefined) {
                console.log(`   Health Check: ${result.healthCheckPassed ? '✅ Passed' : '⚠️ Failed'}`);
            }
        } else {
            console.log('\\n❌ Rollback failed');
            process.exit(1);
        }

    } catch (error) {
        console.error('❌ Rollback script failed:', error instanceof Error ? error.message : 'Unknown error');
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

export { RollbackSystem };
