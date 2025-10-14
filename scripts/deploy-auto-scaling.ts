#!/usr/bin/env tsx

/**
 * Auto-Scaling Deployment Script
 * Deploys auto-scaling infrastructure and configurations for all environments
 */

import { execSync } from 'child_process';
import * as fs from 'fs/promises';
import { AutoScalingConfigManager } from '../src/lib/auto-scaling/auto-scaling-config-manager';
import { AutoScalingOrchestrator } from '../src/lib/auto-scaling/auto-scaling-orchestrator';
import { InfrastructureDiscovery } from './infrastructure-discovery';

interface DeploymentOptions {
    environment?: 'dev' | 'staging' | 'prod' | 'all';
    dryRun?: boolean;
    skipDiscovery?: boolean;
    skipValidation?: boolean;
    force?: boolean;
}

class AutoScalingDeployment {
    private discovery: InfrastructureDiscovery;
    private options: DeploymentOptions;

    constructor(options: DeploymentOptions = {}) {
        this.discovery = new InfrastructureDiscovery();
        this.options = {
            environment: 'all',
            dryRun: false,
            skipDiscovery: false,
            skipValidation: false,
            force: false,
            ...options
        };
    }

    async deploy(): Promise<void> {
        console.log('🚀 Starting Auto-Scaling Deployment...\n');

        try {
            // Step 1: Infrastructure Discovery
            let inventory;
            if (!this.options.skipDiscovery) {
                console.log('📋 Step 1: Infrastructure Discovery');
                inventory = await this.discovery.generateInventoryReport();
            } else {
                console.log('⏭️  Skipping infrastructure discovery');
                inventory = await this.loadExistingInventory();
            }

            // Step 2: Validate Prerequisites
            if (!this.options.skipValidation) {
                console.log('\n🔍 Step 2: Validating Prerequisites');
                await this.validatePrerequisites(inventory);
            }

            // Step 3: Deploy CDK Infrastructure
            console.log('\n🏗️  Step 3: Deploying CDK Infrastructure');
            await this.deployCDKInfrastructure();

            // Step 4: Configure Auto-Scaling
            console.log('\n⚙️  Step 4: Configuring Auto-Scaling');
            await this.configureAutoScaling(inventory);

            // Step 5: Validate Deployment
            console.log('\n✅ Step 5: Validating Deployment');
            await this.validateDeployment();

            // Step 6: Generate Documentation
            console.log('\n📚 Step 6: Generating Documentation');
            await this.generateDocumentation(inventory);

            console.log('\n🎉 Auto-Scaling Deployment Complete!');
            console.log('📊 Check the CloudWatch dashboard for monitoring');
            console.log('💰 Budget alerts have been configured');
            console.log('🔔 SLO alarms are now active');

        } catch (error) {
            console.error('\n❌ Deployment failed:', error);

            if (!this.options.force) {
                console.log('\n🔄 Rolling back changes...');
                await this.rollback();
            }

            throw error;
        }
    }

    private async validatePrerequisites(inventory: any): Promise<void> {
        const checks = [
            this.checkAWSCredentials(),
            this.checkCDKBootstrap(),
            this.checkBudgetLimits(),
            this.checkResourceLimits(inventory)
        ];

        const results = await Promise.allSettled(checks);
        const failures = results.filter(r => r.status === 'rejected');

        if (failures.length > 0) {
            console.error('❌ Prerequisites validation failed:');
            failures.forEach((failure, index) => {
                console.error(`  ${index + 1}. ${(failure as PromiseRejectedResult).reason}`);
            });
            throw new Error('Prerequisites validation failed');
        }

        console.log('✅ All prerequisites validated');
    }

    private async checkAWSCredentials(): Promise<void> {
        try {
            execSync('aws sts get-caller-identity', { stdio: 'pipe' });
            console.log('✅ AWS credentials valid');
        } catch (error) {
            throw new Error('AWS credentials not configured or invalid');
        }
    }

    private async checkCDKBootstrap(): Promise<void> {
        try {
            const region = process.env.AWS_REGION || 'eu-central-1';
            execSync(`aws cloudformation describe-stacks --stack-name CDKToolkit --region ${region}`, {
                stdio: 'pipe'
            });
            console.log('✅ CDK bootstrap verified');
        } catch (error) {
            throw new Error('CDK not bootstrapped in this region. Run: cdk bootstrap');
        }
    }

    private async checkBudgetLimits(): Promise<void> {
        const environments = this.getTargetEnvironments();

        for (const env of environments) {
            const config = AutoScalingConfigManager.getAllEnvironmentConfigs()[env];
            if (config.budgetLimits.softBudget <= 0) {
                throw new Error(`Invalid budget configuration for ${env}`);
            }
        }

        console.log('✅ Budget limits validated');
    }

    private async checkResourceLimits(inventory: any): Promise<void> {
        // Check Lambda concurrency limits
        const totalFunctions = inventory.lambdaFunctions.length;
        if (totalFunctions > 100) {
            console.warn('⚠️  High number of Lambda functions detected');
        }

        // Check RDS instance limits
        const totalRDSInstances = inventory.rdsInstances.length;
        if (totalRDSInstances > 10) {
            console.warn('⚠️  High number of RDS instances detected');
        }

        console.log('✅ Resource limits checked');
    }

    private async deployCDKInfrastructure(): Promise<void> {
        const environments = this.getTargetEnvironments();

        for (const env of environments) {
            console.log(`📦 Deploying CDK stack for ${env}...`);

            if (this.options.dryRun) {
                console.log(`🔍 [DRY RUN] Would deploy auto-scaling-${env} stack`);
                continue;
            }

            try {
                const command = `cd infra/cdk && cdk deploy auto-scaling-${env} --require-approval never`;
                execSync(command, { stdio: 'inherit' });
                console.log(`✅ CDK stack deployed for ${env}`);
            } catch (error) {
                throw new Error(`Failed to deploy CDK stack for ${env}: ${error}`);
            }
        }
    }

    private async configureAutoScaling(inventory: any): Promise<void> {
        const environments = this.getTargetEnvironments();

        for (const env of environments) {
            console.log(`⚙️  Configuring auto-scaling for ${env}...`);

            if (this.options.dryRun) {
                console.log(`🔍 [DRY RUN] Would configure auto-scaling for ${env}`);
                continue;
            }

            const config = AutoScalingConfigManager.getAutoScalingConfig(env);
            const orchestrator = new AutoScalingOrchestrator(config);

            // Configure Lambda auto-scaling
            await this.configureLambdaAutoScaling(orchestrator, inventory, env);

            // Configure RDS monitoring
            await this.configureRDSMonitoring(orchestrator, inventory, env);

            // Configure ElastiCache auto-scaling
            await this.configureElastiCacheAutoScaling(orchestrator, inventory, env);

            console.log(`✅ Auto-scaling configured for ${env}`);
        }
    }

    private async configureLambdaAutoScaling(
        orchestrator: AutoScalingOrchestrator,
        inventory: any,
        environment: 'dev' | 'staging' | 'prod'
    ): Promise<void> {
        const lambdaFunctions = inventory.lambdaFunctions.filter((fn: any) =>
            fn.environment === environment || fn.environment === 'unknown'
        );

        for (const func of lambdaFunctions) {
            try {
                const config = AutoScalingConfigManager.generateLambdaScalingConfig(
                    func.FunctionName,
                    func.FunctionArn,
                    environment
                );

                await orchestrator.configureLambdaAutoScaling(config);
                console.log(`  ✅ Configured Lambda: ${func.FunctionName}`);
            } catch (error) {
                console.warn(`  ⚠️  Failed to configure Lambda ${func.FunctionName}:`, error);
            }
        }
    }

    private async configureRDSMonitoring(
        orchestrator: AutoScalingOrchestrator,
        inventory: any,
        environment: 'dev' | 'staging' | 'prod'
    ): Promise<void> {
        const rdsInstances = inventory.rdsInstances.filter((db: any) =>
            db.environment === environment || db.isMatbakhDB
        );

        for (const db of rdsInstances) {
            try {
                const config = AutoScalingConfigManager.generateRDSScalingConfig(
                    db.DBInstanceIdentifier,
                    environment
                );

                await orchestrator.configureRDSMonitoring(config);
                console.log(`  ✅ Configured RDS: ${db.DBInstanceIdentifier}`);
            } catch (error) {
                console.warn(`  ⚠️  Failed to configure RDS ${db.DBInstanceIdentifier}:`, error);
            }
        }
    }

    private async configureElastiCacheAutoScaling(
        orchestrator: AutoScalingOrchestrator,
        inventory: any,
        environment: 'dev' | 'staging' | 'prod'
    ): Promise<void> {
        const elastiCacheClusters = inventory.elastiCacheClusters.filter((cluster: any) =>
            cluster.environment === environment
        );

        for (const cluster of elastiCacheClusters) {
            try {
                const replicationGroupId = cluster.ReplicationGroupId || cluster.CacheClusterId;
                const config = AutoScalingConfigManager.generateElastiCacheScalingConfig(
                    replicationGroupId,
                    environment
                );

                await orchestrator.configureElastiCacheAutoScaling(config);
                console.log(`  ✅ Configured ElastiCache: ${replicationGroupId}`);
            } catch (error) {
                console.warn(`  ⚠️  Failed to configure ElastiCache ${cluster.ReplicationGroupId}:`, error);
            }
        }
    }

    private async validateDeployment(): Promise<void> {
        const environments = this.getTargetEnvironments();

        for (const env of environments) {
            console.log(`🔍 Validating deployment for ${env}...`);

            const config = AutoScalingConfigManager.getAutoScalingConfig(env);
            const orchestrator = new AutoScalingOrchestrator(config);

            try {
                const status = await orchestrator.getAutoScalingStatus();

                console.log(`  📊 Lambda targets: ${status.lambdaTargets.length}`);
                console.log(`  📊 ElastiCache targets: ${status.elastiCacheTargets.length}`);
                console.log(`  📊 CloudWatch alarms: ${status.alarms.length}`);

                if (status.lambdaTargets.length === 0 && status.elastiCacheTargets.length === 0) {
                    console.warn(`  ⚠️  No auto-scaling targets found for ${env}`);
                } else {
                    console.log(`  ✅ Deployment validated for ${env}`);
                }
            } catch (error) {
                console.warn(`  ⚠️  Validation failed for ${env}:`, error);
            }
        }
    }

    private async generateDocumentation(inventory: any): Promise<void> {
        const documentation = {
            deploymentDate: new Date().toISOString(),
            environments: this.getTargetEnvironments(),
            infrastructure: {
                lambdaFunctions: inventory.lambdaFunctions.length,
                rdsInstances: inventory.rdsInstances.length,
                elastiCacheClusters: inventory.elastiCacheClusters.length,
                cloudFrontDistributions: inventory.cloudFrontDistributions.length
            },
            configuration: AutoScalingConfigManager.getAllEnvironmentConfigs(),
            budgetLimits: this.getTargetEnvironments().map(env => ({
                environment: env,
                ...AutoScalingConfigManager.getAllEnvironmentConfigs()[env].budgetLimits
            })),
            sloTargets: this.getTargetEnvironments().map(env => ({
                environment: env,
                ...AutoScalingConfigManager.getAllEnvironmentConfigs()[env].sloTargets
            }))
        };

        await fs.writeFile(
            'auto-scaling-deployment-report.json',
            JSON.stringify(documentation, null, 2),
            'utf-8'
        );

        console.log('📄 Documentation generated: auto-scaling-deployment-report.json');
    }

    private async rollback(): Promise<void> {
        console.log('🔄 Rolling back auto-scaling deployment...');

        try {
            const environments = this.getTargetEnvironments();

            for (const env of environments) {
                console.log(`🔄 Rolling back ${env}...`);

                // Remove CDK stack
                try {
                    execSync(`cd infra/cdk && cdk destroy auto-scaling-${env} --force`, {
                        stdio: 'pipe'
                    });
                    console.log(`✅ CDK stack removed for ${env}`);
                } catch (error) {
                    console.warn(`⚠️  Failed to remove CDK stack for ${env}`);
                }
            }

            console.log('✅ Rollback completed');
        } catch (error) {
            console.error('❌ Rollback failed:', error);
        }
    }

    private getTargetEnvironments(): ('dev' | 'staging' | 'prod')[] {
        if (this.options.environment === 'all') {
            return ['dev', 'staging', 'prod'];
        }
        return [this.options.environment as 'dev' | 'staging' | 'prod'];
    }

    private async loadExistingInventory(): Promise<any> {
        try {
            const data = await fs.readFile('infrastructure-inventory.json', 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            throw new Error('No existing inventory found. Run without --skip-discovery');
        }
    }
}

// CLI Interface
async function main() {
    const args = process.argv.slice(2);
    const options: DeploymentOptions = {};

    // Parse command line arguments
    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--environment':
            case '-e':
                options.environment = args[++i] as 'dev' | 'staging' | 'prod' | 'all';
                break;
            case '--dry-run':
                options.dryRun = true;
                break;
            case '--skip-discovery':
                options.skipDiscovery = true;
                break;
            case '--skip-validation':
                options.skipValidation = true;
                break;
            case '--force':
                options.force = true;
                break;
            case '--help':
            case '-h':
                printHelp();
                process.exit(0);
                break;
            default:
                console.error(`Unknown option: ${args[i]}`);
                printHelp();
                process.exit(1);
        }
    }

    try {
        const deployment = new AutoScalingDeployment(options);
        await deployment.deploy();
    } catch (error) {
        console.error('❌ Deployment failed:', error);
        process.exit(1);
    }
}

function printHelp() {
    console.log(`
Auto-Scaling Deployment Script

Usage: tsx scripts/deploy-auto-scaling.ts [options]

Options:
  -e, --environment <env>    Target environment (dev|staging|prod|all) [default: all]
  --dry-run                  Show what would be deployed without making changes
  --skip-discovery           Skip infrastructure discovery (use existing inventory)
  --skip-validation          Skip prerequisite validation
  --force                    Continue deployment even if validation fails
  -h, --help                 Show this help message

Examples:
  tsx scripts/deploy-auto-scaling.ts                    # Deploy to all environments
  tsx scripts/deploy-auto-scaling.ts -e prod           # Deploy to production only
  tsx scripts/deploy-auto-scaling.ts --dry-run         # Preview deployment
  tsx scripts/deploy-auto-scaling.ts --skip-discovery  # Use existing inventory
`);
}

if (require.main === module) {
    main();
}

export { AutoScalingDeployment };
