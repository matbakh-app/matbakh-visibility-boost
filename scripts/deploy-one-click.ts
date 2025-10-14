#!/usr/bin/env tsx
/**
 * One-Click Deployment Script - Build-once, Promote-many
 * Automated deployment with Blue-Green S3+CloudFront and health gates
 */

import type { DeploymentConfig } from '../src/lib/deployment/deployment-orchestrator';
import { deploymentOrchestrator } from '../src/lib/deployment/deployment-orchestrator';
import { ArtifactPackager } from './deploy/package-artifact';

interface DeploymentOptions {
    environment: 'development' | 'staging' | 'production';
    strategy?: 'blue-green';
    targetSlot?: 'blue' | 'green';
    artifactPath?: string; // If not provided, will create new artifact
    gitSha?: string;
    skipBuild?: boolean;
    skipHealthGates?: boolean;
    dryRun?: boolean;
    autoApprove?: boolean;
    useMock?: boolean; // Explicit mock flag - no hidden fallbacks
}

class OneClickDeployer {
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

    async deploy(options: DeploymentOptions): Promise<void> {
        try {
            console.log('🚀 Starting one-click deployment...\n');

            if (options.dryRun) {
                console.log('🔍 DRY RUN MODE - No actual deployment will occur\n');
            }

            if (options.useMock) {
                console.warn('⚠️  Using MOCK mode by explicit --mock flag.\n');
            }

            // Step 1: Verify AWS credentials (unless mocking)
            if (!options.useMock) {
                await this.verifyAWSCredentials();
            }

            // Step 2: Validate environment
            await this.validateEnvironment(options.environment, options.useMock);

            // Step 2: Create or validate artifact
            const artifactInfo = await this.handleArtifact(options);

            // Step 3: Get approval for production deployments
            if (!options.autoApprove && options.environment === 'production') {
                await this.getProductionApproval(options, artifactInfo);
            }

            if (options.dryRun) {
                console.log('✅ Dry run completed successfully. All checks passed.');
                return;
            }

            // Step 4: Execute deployment
            await this.executeDeployment(options, artifactInfo);

        } catch (error) {
            console.error('❌ Deployment failed:', error instanceof Error ? error.message : 'Unknown error');
            process.exit(1);
        }
    }

    /**
     * Verify AWS credentials using STS GetCallerIdentity
     */
    private async verifyAWSCredentials(): Promise<void> {
        console.log('🔐 Verifying AWS credentials...');

        try {
            const sts = new STSClient({
                region: process.env.AWS_REGION || 'eu-central-1'
            });

            const identity = await sts.send(new GetCallerIdentityCommand({}));

            console.log(`   ✅ AWS Account: ${identity.Account}`);
            console.log(`   ✅ User/Role: ${identity.Arn}`);
            console.log(`   ✅ User ID: ${identity.UserId}`);

        } catch (error) {
            throw new Error(`AWS credential verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private async validateEnvironment(environment: string, useMock = false): Promise<void> {
        console.log(`🔍 Validating ${environment} environment...`);

        const config = this.environments[environment];
        if (!config) {
            throw new Error(`Unknown environment: ${environment}`);
        }

        // Check AWS credentials (skip if mocking)
        if (!useMock) {
            try {
                const { execSync } = await import('child_process');
                const awsProfile = process.env.AWS_PROFILE || 'matbakh-dev';
                const awsRegion = process.env.AWS_REGION || 'eu-central-1';
                execSync(`aws sts get-caller-identity --profile ${awsProfile} --region ${awsRegion}`, { stdio: 'pipe' });
                console.log('   ✅ AWS CLI credentials validated');
            } catch (error) {
                throw new Error('AWS credentials not configured or invalid');
            }
        } else {
            console.log('   ⚠️  Skipping AWS credential check (mock mode)');
        }

        // Check S3 bucket access (skip if mocking)
        if (!useMock) {
            try {
                const { execSync } = await import('child_process');
                const awsProfile = process.env.AWS_PROFILE || 'matbakh-dev';
                const awsRegion = process.env.AWS_REGION || 'eu-central-1';
                execSync(`aws s3 ls s3://${config.bucketName}/ --profile ${awsProfile} --region ${awsRegion}`, { stdio: 'pipe' });
                console.log('   ✅ S3 bucket access validated');
            } catch (error) {
                throw new Error(`Cannot access S3 bucket: ${config.bucketName}`);
            }

            // Check CloudFront distribution
            try {
                const { execSync } = await import('child_process');
                const awsProfile = process.env.AWS_PROFILE || 'matbakh-dev';
                const awsRegion = process.env.AWS_REGION || 'eu-central-1';
                execSync(`aws cloudfront get-distribution --id ${config.distributionId} --profile ${awsProfile} --region ${awsRegion}`, { stdio: 'pipe' });
                console.log('   ✅ CloudFront distribution access validated');
            } catch (error) {
                throw new Error(`Cannot access CloudFront distribution: ${config.distributionId}`);
            }
        } else {
            console.log('   ⚠️  Skipping S3/CloudFront validation (mock mode)');
        }

        console.log(`✅ Environment '${environment}' is ready for deployment\n`);
    }

    private async handleArtifact(options: DeploymentOptions): Promise<{
        artifactPath: string;
        gitSha: string;
        manifest: any;
    }> {
        if (options.artifactPath) {
            // Use existing artifact
            console.log(`📦 Using existing artifact: ${options.artifactPath}`);

            const packager = new ArtifactPackager();
            const manifest = await (packager as any).extractManifestFromArtifact(options.artifactPath);

            return {
                artifactPath: options.artifactPath,
                gitSha: manifest.gitSha,
                manifest
            };
        } else {
            // Create new artifact
            console.log('📦 Creating new deployment artifact...');

            const packager = new ArtifactPackager();
            const result = await packager.packageArtifact({
                environment: options.environment
            });

            console.log(`   ✅ Artifact created: ${result.artifactPath}`);
            console.log(`   📋 Git SHA: ${result.manifest.gitSha}`);
            console.log(`   📁 Files: ${result.manifest.files.length}`);

            return {
                artifactPath: result.artifactPath,
                gitSha: result.manifest.gitSha,
                manifest: result.manifest
            };
        }
    }

    private async getProductionApproval(
        options: DeploymentOptions,
        artifactInfo: any
    ): Promise<void> {
        console.log('\n⚠️  PRODUCTION DEPLOYMENT CONFIRMATION REQUIRED');
        console.log(`   Environment: ${options.environment}`);
        console.log(`   Strategy: ${options.strategy || 'blue-green'}`);
        console.log(`   Git SHA: ${artifactInfo.gitSha}`);
        console.log(`   Artifact: ${artifactInfo.artifactPath}`);
        console.log(`   This will affect live users!`);
        console.log('\n   In a real implementation, this would require manual approval.');
        console.log('   For demo purposes, auto-approving...\n');

        await this.sleep(3000);
    }

    private async executeDeployment(
        options: DeploymentOptions,
        artifactInfo: any
    ): Promise<void> {
        const config = this.createDeploymentConfig(options, artifactInfo);

        console.log(`🚀 Starting ${config.strategy} deployment to ${config.environment}...`);
        console.log(`   Target slot: ${config.targetSlot || 'auto-detect'}`);
        console.log(`   Health gates: ${config.qaGatesEnabled ? 'enabled' : 'disabled'}`);

        // Execute deployment using orchestrator
        const deployment = await deploymentOrchestrator.deployArtifact(config);

        // Monitor deployment progress
        await this.monitorDeployment(deployment.id);

        console.log('\n🎉 Deployment completed successfully!');
        this.printDeploymentSummary(deployment);
    }

    private createDeploymentConfig(
        options: DeploymentOptions,
        artifactInfo: any
    ): DeploymentConfig {
        const envConfig = this.environments[options.environment];

        return {
            environment: options.environment,
            strategy: 'blue-green',
            targetSlot: options.targetSlot,
            artifactPath: artifactInfo.artifactPath,
            gitSha: artifactInfo.gitSha,
            bucketName: envConfig.bucketName,
            distributionId: envConfig.distributionId,
            domain: envConfig.domain,
            rollbackThreshold: options.environment === 'production' ? 1 : 5, // Lower threshold for production
            deploymentTimeout: options.environment === 'production' ? 45 : 30, // Longer timeout for production
            qaGatesEnabled: !options.skipHealthGates,
            performanceGatesEnabled: !options.skipHealthGates,
            accessibilityGatesEnabled: !options.skipHealthGates && options.environment !== 'development',
            smokeTestsEnabled: !options.skipHealthGates
        };
    }

    private async monitorDeployment(deploymentId: string): Promise<void> {
        console.log(`📊 Monitoring deployment ${deploymentId}...`);

        let deployment = deploymentOrchestrator.getDeploymentStatus(deploymentId);

        while (deployment && ['pending', 'syncing', 'testing', 'switching'].includes(deployment.status)) {
            console.log(`   Status: ${deployment.status}`);

            // Show gate results
            if (deployment.gateResults.length > 0) {
                const lastGate = deployment.gateResults[deployment.gateResults.length - 1];
                const status = lastGate.status === 'pass' ? '✅' : lastGate.status === 'fail' ? '❌' : '⏳';
                console.log(`   ${status} ${lastGate.gate} gate: ${lastGate.status}`);
            }

            // Show health checks
            if (deployment.healthChecks.length > 0) {
                const lastCheck = deployment.healthChecks[deployment.healthChecks.length - 1];
                const status = lastCheck.status === 'pass' ? '✅' : lastCheck.status === 'fail' ? '❌' : '⏳';
                console.log(`   ${status} Health check: ${lastCheck.name} - ${lastCheck.status}`);
            }

            await this.sleep(5000);
            deployment = deploymentOrchestrator.getDeploymentStatus(deploymentId);
        }

        if (deployment) {
            if (deployment.status === 'success') {
                console.log('✅ Deployment completed successfully!');
            } else if (deployment.status === 'failed') {
                console.log('❌ Deployment failed');
                if (deployment.rollbackReason) {
                    console.log(`   Rollback reason: ${deployment.rollbackReason}`);
                }
                throw new Error('Deployment failed');
            } else if (deployment.status === 'rolled_back') {
                console.log('🔄 Deployment was rolled back');
                if (deployment.rollbackReason) {
                    console.log(`   Rollback reason: ${deployment.rollbackReason}`);
                }
                throw new Error('Deployment was rolled back');
            }
        }
    }

    private printDeploymentSummary(deployment: any): void {
        const duration = deployment.endTime
            ? Math.round((deployment.endTime.getTime() - deployment.startTime.getTime()) / 1000 / 60)
            : 0;

        console.log('\n📋 Deployment Summary:');
        console.log(`   ID: ${deployment.id}`);
        console.log(`   Environment: ${deployment.environment}`);
        console.log(`   Strategy: ${deployment.strategy}`);
        console.log(`   Git SHA: ${deployment.gitSha}`);
        console.log(`   Duration: ${duration} minutes`);
        console.log(`   Active Slot: ${deployment.activeSlot}`);
        console.log(`   Previous Slot: ${deployment.previousSlot || 'none'}`);

        // Gate results summary
        if (deployment.gateResults.length > 0) {
            console.log(`   Health Gates:`);
            deployment.gateResults.forEach((gate: any) => {
                const status = gate.status === 'pass' ? '✅' : gate.status === 'fail' ? '❌' : '⏳';
                console.log(`     ${status} ${gate.gate}: ${gate.status}`);
            });
        }

        // Final metrics
        if (deployment.metrics) {
            console.log(`   Final Metrics:`);
            console.log(`     Error Rate: ${deployment.metrics.errorRate.toFixed(2)}%`);
            console.log(`     P95 Response Time: ${deployment.metrics.p95ResponseTime.toFixed(0)}ms`);
            console.log(`     P99 Response Time: ${deployment.metrics.p99ResponseTime.toFixed(0)}ms`);
            console.log(`     Cache Hit Rate: ${deployment.metrics.cacheHitRate.toFixed(1)}%`);
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
One-Click Deployment Script

Usage: npm run deploy [options]

Options:
  --env <environment>       Target environment (development|staging|production)
  --slot <slot>            Target slot (blue|green) - auto-detects inactive if not specified
  --artifact <path>        Path to existing deployment artifact (creates new if not specified)
  --git-sha <sha>          Git SHA for deployment tracking
  --skip-build             Skip build step (requires --artifact)
  --skip-health-gates      Skip all health gate checks
  --dry-run               Validate deployment without executing
  --auto-approve          Skip approval prompts
  --mock                  Use mock mode (explicit flag, no hidden fallbacks)
  --help, -h              Show this help message

Examples:
  npm run deploy --env staging
  npm run deploy --env production --auto-approve
  npm run deploy --env production --artifact artifacts/web-dist-abc123.zip
  npm run deploy --env staging --slot green --skip-health-gates
  npm run deploy --env production --dry-run
`);
        return;
    }

    const options: DeploymentOptions = {
        environment: 'staging',
        strategy: 'blue-green',
        skipBuild: false,
        skipHealthGates: false,
        dryRun: false,
        autoApprove: false
    };

    // Parse command line arguments
    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--env':
                options.environment = args[++i] as any;
                break;
            case '--slot':
                options.targetSlot = args[++i] as any;
                break;
            case '--artifact':
                options.artifactPath = args[++i];
                break;
            case '--git-sha':
                options.gitSha = args[++i];
                break;
            case '--skip-build':
                options.skipBuild = true;
                break;
            case '--skip-health-gates':
                options.skipHealthGates = true;
                break;
            case '--dry-run':
                options.dryRun = true;
                break;
            case '--auto-approve':
                options.autoApprove = true;
                break;
            case '--mock':
                options.useMock = true;
                break;
        }
    }

    // Validate environment
    if (!['development', 'staging', 'production'].includes(options.environment)) {
        console.error('❌ Invalid environment. Must be: development, staging, or production');
        process.exit(1);
    }

    // Validate slot if provided
    if (options.targetSlot && !['blue', 'green'].includes(options.targetSlot)) {
        console.error('❌ Invalid slot. Must be: blue or green');
        process.exit(1);
    }

    const deployer = new OneClickDeployer();
    await deployer.deploy(options);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(error => {
        console.error('❌ Deployment script failed:', error);
        process.exit(1);
    });
}

export { OneClickDeployer };
