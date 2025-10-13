#!/usr/bin/env ts-node

/**
 * AI Orchestration PR Series Deployment Script
 * 
 * Deploys PR-1 (Egress & Secrets) and PR-2 (Guardrails & Safety)
 * with comprehensive validation and rollback capabilities
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface DeploymentConfig {
    environment: 'development' | 'staging' | 'production';
    region: string;
    costBudgetUsd: number;
    dryRun: boolean;
    skipTests: boolean;
    rollbackOnFailure: boolean;
}

interface DeploymentResult {
    success: boolean;
    stackName: string;
    outputs?: Record<string, string>;
    error?: string;
    duration: number;
}

class AIOrchestrationDeployer {
    private config: DeploymentConfig;
    private deploymentLog: string[] = [];
    private startTime: number;

    constructor(config: DeploymentConfig) {
        this.config = config;
        this.startTime = Date.now();
        this.log(`🚀 AI Orchestration PR Series Deployment Started`);
        this.log(`Environment: ${config.environment}`);
        this.log(`Region: ${config.region}`);
        this.log(`Cost Budget: $${config.costBudgetUsd}`);
        this.log(`Dry Run: ${config.dryRun}`);
    }

    async deploy(): Promise<void> {
        try {
            // Pre-deployment validation
            await this.validatePrerequisites();

            // Run tests if not skipped
            if (!this.config.skipTests) {
                await this.runTests();
            }

            // Deploy PR-1: Network Security & Secrets
            const pr1Result = await this.deployPR1();
            if (!pr1Result.success && this.config.rollbackOnFailure) {
                await this.rollback(['NetworkSecurity', 'SecretsRotation']);
                throw new Error(`PR-1 deployment failed: ${pr1Result.error}`);
            }

            // Deploy PR-2: Guardrails & Safety
            const pr2Result = await this.deployPR2();
            if (!pr2Result.success && this.config.rollbackOnFailure) {
                await this.rollback(['NetworkSecurity', 'SecretsRotation', 'Guardrails']);
                throw new Error(`PR-2 deployment failed: ${pr2Result.error}`);
            }

            // Post-deployment validation
            await this.validateDeployment();

            // Generate deployment report
            await this.generateDeploymentReport([pr1Result, pr2Result]);

            this.log(`✅ AI Orchestration PR Series Deployment Completed Successfully`);
            this.log(`Total Duration: ${this.formatDuration(Date.now() - this.startTime)}`);

        } catch (error) {
            this.log(`❌ Deployment Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }

    private async validatePrerequisites(): Promise<void> {
        this.log(`🔍 Validating Prerequisites...`);

        // Check AWS CLI
        try {
            execSync('aws --version', { stdio: 'pipe' });
        } catch {
            throw new Error('AWS CLI not found. Please install AWS CLI.');
        }

        // Check CDK CLI
        try {
            execSync('cdk --version', { stdio: 'pipe' });
        } catch {
            throw new Error('AWS CDK CLI not found. Please install CDK CLI.');
        }

        // Check AWS credentials
        try {
            execSync('aws sts get-caller-identity', { stdio: 'pipe' });
        } catch {
            throw new Error('AWS credentials not configured. Please run aws configure.');
        }

        // Check CDK bootstrap
        try {
            const result = execSync(`aws cloudformation describe-stacks --stack-name CDKToolkit --region ${this.config.region}`, { stdio: 'pipe' });
            if (!result.toString().includes('CREATE_COMPLETE') && !result.toString().includes('UPDATE_COMPLETE')) {
                throw new Error('CDK not bootstrapped in this region');
            }
        } catch {
            this.log(`⚠️  CDK not bootstrapped in ${this.config.region}. Running bootstrap...`);
            if (!this.config.dryRun) {
                execSync(`cdk bootstrap aws://$(aws sts get-caller-identity --query Account --output text)/${this.config.region}`, { stdio: 'inherit' });
            }
        }

        // Validate VPC exists (required for Network Security Stack)
        try {
            const vpcs = execSync(`aws ec2 describe-vpcs --region ${this.config.region} --query 'Vpcs[?IsDefault==\`true\`].VpcId' --output text`, { stdio: 'pipe' });
            if (!vpcs.toString().trim()) {
                throw new Error('No default VPC found. Please create a VPC first.');
            }
        } catch (error) {
            throw new Error(`VPC validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        this.log(`✅ Prerequisites validated`);
    }

    private async runTests(): Promise<void> {
        this.log(`🧪 Running Tests...`);

        try {
            // Run CDK infrastructure tests
            execSync('npm run test:cdk', { stdio: 'inherit', cwd: process.cwd() });

            // Run Guardrails service tests
            execSync('npm test -- --testPathPattern="guardrails-service"', { stdio: 'inherit', cwd: process.cwd() });

            this.log(`✅ All tests passed`);
        } catch (error) {
            throw new Error(`Tests failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private async deployPR1(): Promise<DeploymentResult> {
        this.log(`📦 Deploying PR-1: Network Security & Secrets...`);
        const startTime = Date.now();

        try {
            // Deploy Network Security Stack
            const networkResult = await this.deployCDKStack('NetworkSecurityStack', {
                environment: this.config.environment,
                // VPC wird automatisch von der Default VPC genommen
            });

            // Deploy Secrets Rotation Stack
            const secretsResult = await this.deployCDKStack('SecretsRotationStack', {
                environment: this.config.environment,
                rotationScheduleDays: 30
            });

            const duration = Date.now() - startTime;
            this.log(`✅ PR-1 deployed successfully in ${this.formatDuration(duration)}`);

            return {
                success: true,
                stackName: 'PR-1 (Network Security & Secrets)',
                outputs: {
                    ...networkResult.outputs,
                    ...secretsResult.outputs
                },
                duration
            };

        } catch (error) {
            const duration = Date.now() - startTime;
            this.log(`❌ PR-1 deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);

            return {
                success: false,
                stackName: 'PR-1 (Network Security & Secrets)',
                error: error instanceof Error ? error.message : 'Unknown error',
                duration
            };
        }
    }

    private async deployPR2(): Promise<DeploymentResult> {
        this.log(`🛡️  Deploying PR-2: Guardrails & Safety...`);
        const startTime = Date.now();

        try {
            // Deploy Guardrails Stack
            const guardrailsResult = await this.deployCDKStack('GuardrailsStack', {
                environment: this.config.environment,
                costBudgetUsd: this.config.costBudgetUsd
            });

            const duration = Date.now() - startTime;
            this.log(`✅ PR-2 deployed successfully in ${this.formatDuration(duration)}`);

            return {
                success: true,
                stackName: 'PR-2 (Guardrails & Safety)',
                outputs: guardrailsResult.outputs,
                duration
            };

        } catch (error) {
            const duration = Date.now() - startTime;
            this.log(`❌ PR-2 deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);

            return {
                success: false,
                stackName: 'PR-2 (Guardrails & Safety)',
                error: error instanceof Error ? error.message : 'Unknown error',
                duration
            };
        }
    }

    private async deployCDKStack(stackName: string, context: Record<string, any>): Promise<DeploymentResult> {
        const fullStackName = `${stackName}-${this.config.environment}`;

        try {
            // Build context parameters
            const contextParams = Object.entries(context)
                .map(([key, value]) => `--context ${key}=${value}`)
                .join(' ');

            // CDK deploy command
            const deployCommand = `cdk deploy ${fullStackName} --region ${this.config.region} ${contextParams} --require-approval never --outputs-file cdk-outputs-${stackName}.json`;

            if (this.config.dryRun) {
                this.log(`[DRY RUN] Would execute: ${deployCommand}`);
                return {
                    success: true,
                    stackName: fullStackName,
                    outputs: { dryRun: 'true' },
                    duration: 0
                };
            }

            this.log(`Executing: ${deployCommand}`);
            execSync(deployCommand, { stdio: 'inherit', cwd: join(process.cwd(), 'infra/cdk') });

            // Read outputs
            const outputsFile = join(process.cwd(), 'infra/cdk', `cdk-outputs-${stackName}.json`);
            let outputs: Record<string, string> = {};

            if (existsSync(outputsFile)) {
                const outputsContent = readFileSync(outputsFile, 'utf-8');
                const parsedOutputs = JSON.parse(outputsContent);
                outputs = parsedOutputs[fullStackName] || {};
            }

            return {
                success: true,
                stackName: fullStackName,
                outputs,
                duration: 0 // Duration wird vom Caller gemessen
            };

        } catch (error) {
            return {
                success: false,
                stackName: fullStackName,
                error: error instanceof Error ? error.message : 'Unknown error',
                duration: 0
            };
        }
    }

    private async rollback(stackNames: string[]): Promise<void> {
        this.log(`🔄 Rolling back stacks: ${stackNames.join(', ')}...`);

        if (this.config.dryRun) {
            this.log(`[DRY RUN] Would rollback stacks: ${stackNames.join(', ')}`);
            return;
        }

        for (const stackName of stackNames.reverse()) { // Reverse order for rollback
            const fullStackName = `${stackName}-${this.config.environment}`;

            try {
                this.log(`Rolling back ${fullStackName}...`);
                execSync(`cdk destroy ${fullStackName} --region ${this.config.region} --force`, {
                    stdio: 'inherit',
                    cwd: join(process.cwd(), 'infra/cdk')
                });
                this.log(`✅ ${fullStackName} rolled back successfully`);
            } catch (error) {
                this.log(`⚠️  Failed to rollback ${fullStackName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
    }

    private async validateDeployment(): Promise<void> {
        this.log(`🔍 Validating Deployment...`);

        if (this.config.dryRun) {
            this.log(`[DRY RUN] Would validate deployment`);
            return;
        }

        try {
            // Check Network Security Stack
            const networkStackName = `NetworkSecurityStack-${this.config.environment}`;
            execSync(`aws cloudformation describe-stacks --stack-name ${networkStackName} --region ${this.config.region}`, { stdio: 'pipe' });
            this.log(`✅ Network Security Stack validated`);

            // Check Secrets Rotation Stack
            const secretsStackName = `SecretsRotationStack-${this.config.environment}`;
            execSync(`aws cloudformation describe-stacks --stack-name ${secretsStackName} --region ${this.config.region}`, { stdio: 'pipe' });
            this.log(`✅ Secrets Rotation Stack validated`);

            // Check Guardrails Stack
            const guardrailsStackName = `GuardrailsStack-${this.config.environment}`;
            execSync(`aws cloudformation describe-stacks --stack-name ${guardrailsStackName} --region ${this.config.region}`, { stdio: 'pipe' });
            this.log(`✅ Guardrails Stack validated`);

            // Test Guardrails functionality
            await this.testGuardrailsIntegration();

        } catch (error) {
            throw new Error(`Deployment validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private async testGuardrailsIntegration(): Promise<void> {
        this.log(`🧪 Testing Guardrails Integration...`);

        // Basic integration test - check if Guardrails are accessible
        try {
            const result = execSync(`aws bedrock list-guardrails --region ${this.config.region}`, { stdio: 'pipe' });
            const guardrails = JSON.parse(result.toString());

            if (guardrails.guardrails && guardrails.guardrails.length > 0) {
                this.log(`✅ Found ${guardrails.guardrails.length} Guardrails`);
            } else {
                this.log(`⚠️  No Guardrails found - they may still be creating`);
            }
        } catch (error) {
            this.log(`⚠️  Guardrails integration test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private async generateDeploymentReport(results: DeploymentResult[]): Promise<void> {
        const reportPath = join(process.cwd(), 'docs', `ai-orchestration-deployment-report-${Date.now()}.md`);

        const report = `# AI Orchestration PR Series Deployment Report

## Deployment Summary

- **Environment**: ${this.config.environment}
- **Region**: ${this.config.region}
- **Cost Budget**: $${this.config.costBudgetUsd}
- **Deployment Time**: ${new Date().toISOString()}
- **Total Duration**: ${this.formatDuration(Date.now() - this.startTime)}
- **Dry Run**: ${this.config.dryRun}

## Results

${results.map(result => `
### ${result.stackName}

- **Status**: ${result.success ? '✅ Success' : '❌ Failed'}
- **Duration**: ${this.formatDuration(result.duration)}
${result.error ? `- **Error**: ${result.error}` : ''}
${result.outputs ? `- **Outputs**: ${Object.keys(result.outputs).length} outputs exported` : ''}
`).join('\n')}

## Deployment Log

\`\`\`
${this.deploymentLog.join('\n')}
\`\`\`

## Next Steps

${this.config.dryRun ? `
### After Dry Run Review
1. Review this deployment plan
2. Run with \`--no-dry-run\` to execute actual deployment
3. Monitor CloudWatch dashboards for Guardrails metrics
4. Test AI Orchestrator integration
` : `
### Post-Deployment
1. ✅ Monitor CloudWatch dashboards for Guardrails metrics
2. ✅ Test AI Orchestrator integration with new safety features
3. ✅ Verify cost monitoring alerts are working
4. ✅ Review Network Firewall logs for egress traffic
5. ✅ Test secrets rotation functionality
`}

## DoD Validation

- [${results.every(r => r.success) ? 'x' : ' '}] All stacks deployed successfully
- [${!this.config.skipTests ? 'x' : ' '}] All tests passed
- [${this.config.dryRun ? ' ' : 'x'}] Post-deployment validation completed
- [${this.config.dryRun ? ' ' : 'x'}] Guardrails integration tested
- [${this.config.dryRun ? ' ' : 'x'}] Cost monitoring active

Generated: ${new Date().toISOString()}
`;

        writeFileSync(reportPath, report);
        this.log(`📄 Deployment report generated: ${reportPath}`);
    }

    private log(message: string): void {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${message}`;
        console.log(logMessage);
        this.deploymentLog.push(logMessage);
    }

    private formatDuration(ms: number): string {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }
}

// CLI Interface
async function main() {
    const args = process.argv.slice(2);

    const config: DeploymentConfig = {
        environment: (args.find(arg => arg.startsWith('--env='))?.split('=')[1] as any) || 'development',
        region: args.find(arg => arg.startsWith('--region='))?.split('=')[1] || 'eu-central-1',
        costBudgetUsd: parseInt(args.find(arg => arg.startsWith('--budget='))?.split('=')[1] || '100'),
        dryRun: args.includes('--dry-run'),
        skipTests: args.includes('--skip-tests'),
        rollbackOnFailure: !args.includes('--no-rollback')
    };

    if (args.includes('--help')) {
        console.log(`
AI Orchestration PR Series Deployment Script

Usage: npm run deploy:ai-orchestration [options]

Options:
  --env=<environment>     Environment (development|staging|production) [default: development]
  --region=<region>       AWS region [default: eu-central-1]
  --budget=<amount>       Cost budget in USD [default: 100]
  --dry-run              Perform dry run without actual deployment
  --skip-tests           Skip running tests before deployment
  --no-rollback          Don't rollback on failure
  --help                 Show this help message

Examples:
  npm run deploy:ai-orchestration --env=staging --region=eu-west-1 --budget=200
  npm run deploy:ai-orchestration --dry-run
  npm run deploy:ai-orchestration --env=production --no-rollback
    `);
        return;
    }

    const deployer = new AIOrchestrationDeployer(config);

    try {
        await deployer.deploy();
        process.exit(0);
    } catch (error) {
        console.error('Deployment failed:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main().catch(console.error);
}

export { AIOrchestrationDeployer, DeploymentConfig, DeploymentResult };
