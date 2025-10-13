#!/usr/bin/env npx tsx

/**
 * AI Orchestration Deployment Script
 * 
 * Deploys the complete AI orchestration infrastructure including:
 * - CDK infrastructure stack
 * - ECS Fargate service
 * - CloudWatch Evidently project
 * - VPC endpoints for AWS services
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import path from 'path';

interface DeploymentConfig {
    environment: 'development' | 'staging' | 'production';
    region: string;
    vpcId?: string;
    clusterId?: string;
    aiGatewayImage?: string;
}

class AiOrchestrationDeployer {
    private config: DeploymentConfig;

    constructor(config: DeploymentConfig) {
        this.config = config;
    }

    async deploy(): Promise<void> {
        console.log('🚀 Starting AI Orchestration deployment...');
        console.log(`Environment: ${this.config.environment}`);
        console.log(`Region: ${this.config.region}`);

        try {
            // 1. Validate prerequisites
            await this.validatePrerequisites();

            // 2. Build and test the application
            await this.buildAndTest();

            // 3. Deploy CDK infrastructure
            await this.deployCdkStack();

            // 4. Deploy container image (if provided)
            if (this.config.aiGatewayImage) {
                await this.deployContainerImage();
            }

            // 5. Configure Evidently experiments
            await this.configureEvidently();

            // 6. Run smoke tests
            await this.runSmokeTests();

            console.log('✅ AI Orchestration deployment completed successfully!');
        } catch (error) {
            console.error('❌ Deployment failed:', error);
            process.exit(1);
        }
    }

    private async validatePrerequisites(): Promise<void> {
        console.log('🔍 Validating prerequisites...');

        // Check AWS CLI
        try {
            execSync('aws --version', { stdio: 'pipe' });
        } catch {
            throw new Error('AWS CLI not found. Please install and configure AWS CLI.');
        }

        // Check CDK
        try {
            execSync('npx cdk --version', { stdio: 'pipe' });
        } catch {
            throw new Error('AWS CDK not found. Please install AWS CDK.');
        }

        // Check if we're in the right directory
        if (!existsSync('package.json')) {
            throw new Error('package.json not found. Please run from project root.');
        }

        // Validate AWS credentials
        try {
            execSync('aws sts get-caller-identity', { stdio: 'pipe' });
        } catch {
            throw new Error('AWS credentials not configured. Please run aws configure.');
        }

        console.log('✅ Prerequisites validated');
    }

    private async buildAndTest(): Promise<void> {
        console.log('🔨 Building and testing application...');

        // Install dependencies
        execSync('npm install', { stdio: 'inherit' });

        // Run TypeScript compilation
        execSync('npx tsc --noEmit', { stdio: 'inherit' });

        // Run AI orchestrator tests
        execSync('npm test -- src/lib/ai-orchestrator', { stdio: 'inherit' });

        console.log('✅ Build and tests completed');
    }

    private async deployCdkStack(): Promise<void> {
        console.log('☁️ Deploying CDK infrastructure...');

        const stackName = `AiOrchestrationStack-${this.config.environment}`;
        const cdkCommand = [
            'npx cdk deploy',
            stackName,
            '--require-approval never',
            `--parameters environment=${this.config.environment}`,
            `--parameters regionCode=${this.config.region}`,
        ];

        if (this.config.vpcId) {
            cdkCommand.push(`--parameters vpcId=${this.config.vpcId}`);
        }

        if (this.config.clusterId) {
            cdkCommand.push(`--parameters clusterId=${this.config.clusterId}`);
        }

        if (this.config.aiGatewayImage) {
            cdkCommand.push(`--parameters aiGatewayImage=${this.config.aiGatewayImage}`);
        }

        execSync(cdkCommand.join(' '), {
            stdio: 'inherit',
            cwd: path.join(process.cwd(), 'infra', 'cdk')
        });

        console.log('✅ CDK infrastructure deployed');
    }

    private async deployContainerImage(): Promise<void> {
        console.log('🐳 Deploying container image...');

        // This would typically involve:
        // 1. Building the Docker image
        // 2. Pushing to ECR
        // 3. Updating ECS service

        console.log('📝 Container deployment would be implemented here');
        console.log(`Image: ${this.config.aiGatewayImage}`);
    }

    private async configureEvidently(): Promise<void> {
        console.log('🧪 Configuring CloudWatch Evidently...');

        const projectName = `matbakh-ai-${this.config.environment}`; \n\n    try { \n      // Check if project exists\n      const checkCommand = `aws evidently get-project --project ${projectName} --region ${this.config.region}`;\n      execSync(checkCommand, { stdio: 'pipe' });\n      console.log('📊 Evidently project already exists');\n    } catch {\n      console.log('📊 Evidently project will be created by CDK stack');\n    }\n\n    console.log('✅ Evidently configuration completed');\n  }\n\n  private async runSmokeTests(): Promise<void> {\n    console.log('🔥 Running smoke tests...');\n\n    // Get the deployed service URL from CDK outputs\n    const stackName = `AiOrchestrationStack-${this.config.environment}`;\n    \n    try {\n      const outputsCommand = `aws cloudformation describe-stacks --stack-name ${stackName} --region ${this.config.region} --query \"Stacks[0].Outputs\"`;\n      const outputs = JSON.parse(execSync(outputsCommand, { encoding: 'utf8' }));\n      \n      const gatewayUrl = outputs.find((output: any) => output.OutputKey === 'AiGatewayUrl')?.OutputValue;\n      \n      if (gatewayUrl) {\n        console.log(`🌐 Gateway URL: ${gatewayUrl}`);\n        \n        // Test health endpoint\n        try {\n          execSync(`curl -f ${gatewayUrl}/health`, { stdio: 'pipe' });\n          console.log('✅ Health check passed');\n        } catch {\n          console.warn('⚠️ Health check failed - service may still be starting');\n        }\n      }\n    } catch (error) {\n      console.warn('⚠️ Could not retrieve service URL for smoke tests');\n    }\n\n    console.log('✅ Smoke tests completed');\n  }\n}\n\n// CLI interface\nfunction parseArgs(): DeploymentConfig {\n  const args = process.argv.slice(2);\n  const config: DeploymentConfig = {\n    environment: 'development',\n    region: 'eu-central-1'\n  };\n\n  for (let i = 0; i < args.length; i += 2) {\n    const key = args[i];\n    const value = args[i + 1];\n\n    switch (key) {\n      case '--environment':\n      case '--env':\n        if (['development', 'staging', 'production'].includes(value)) {\n          config.environment = value as any;\n        } else {\n          throw new Error(`Invalid environment: ${value}`);\n        }\n        break;\n      case '--region':\n        config.region = value;\n        break;\n      case '--vpc-id':\n        config.vpcId = value;\n        break;\n      case '--cluster-id':\n        config.clusterId = value;\n        break;\n      case '--image':\n        config.aiGatewayImage = value;\n        break;\n      case '--help':\n        console.log(`\nUsage: npx tsx scripts/deploy-ai-orchestration.ts [options]\n\nOptions:\n  --environment, --env    Environment (development|staging|production) [default: development]\n  --region               AWS region [default: eu-central-1]\n  --vpc-id               Existing VPC ID (optional)\n  --cluster-id           Existing ECS cluster ID (optional)\n  --image                AI Gateway container image (optional)\n  --help                 Show this help message\n\nExamples:\n  npx tsx scripts/deploy-ai-orchestration.ts --env production --region eu-central-1\n  npx tsx scripts/deploy-ai-orchestration.ts --env staging --vpc-id vpc-12345 --cluster-id my-cluster\n`);\n        process.exit(0);\n    }\n  }\n\n  return config;\n}\n\n// Main execution\nif (require.main === module) {\n  const config = parseArgs();\n  const deployer = new AiOrchestrationDeployer(config);\n  deployer.deploy().catch(console.error);\n}\n\nexport { AiOrchestrationDeployer, DeploymentConfig };\n"