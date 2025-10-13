#!/usr/bin/env tsx

/**
 * Multi-Region Deployment Script
 * 
 * This script deploys the multi-region infrastructure using AWS CDK.
 * It handles the deployment of all components in the correct order.
 * 
 * Usage:
 *   npx tsx scripts/deploy-multi-region.ts [--dry-run] [--region primary|secondary|both]
 */

import { execSync } from 'child_process';
import { Command } from 'commander';
import { writeFileSync } from 'fs';

interface DeploymentOptions {
    dryRun?: boolean;
    region?: 'primary' | 'secondary' | 'both';
    skipTests?: boolean;
    force?: boolean;
}

interface DeploymentConfig {
    primaryRegion: string;
    secondaryRegion: string;
    domainName: string;
    hostedZoneId: string;
    databaseName: string;
    masterUsername: string;
    environment: 'dev' | 'staging' | 'prod';
}

const program = new Command();

program
    .name('deploy-multi-region')
    .description('Deploy multi-region infrastructure')
    .option('--dry-run', 'Show what would be deployed without making changes')
    .option('--region <region>', 'Deploy to specific region(s)', 'both')
    .option('--skip-tests', 'Skip pre-deployment tests')
    .option('--force', 'Force deployment even if tests fail')
    .parse();

const options = program.opts<DeploymentOptions>();

// Load configuration from environment
const config: DeploymentConfig = {
    primaryRegion: process.env.PRIMARY_REGION || 'eu-central-1',
    secondaryRegion: process.env.SECONDARY_REGION || 'eu-west-1',
    domainName: process.env.DOMAIN_NAME || 'matbakh.app',
    hostedZoneId: process.env.HOSTED_ZONE_ID || '',
    databaseName: process.env.DATABASE_NAME || 'matbakh',
    masterUsername: process.env.DB_MASTER_USERNAME || 'postgres',
    environment: (process.env.ENVIRONMENT as any) || 'dev',
};

async function main() {
    console.log('🚀 Multi-Region Infrastructure Deployment');
    console.log('==========================================');
    console.log(`Environment: ${config.environment}`);
    console.log(`Primary Region: ${config.primaryRegion}`);
    console.log(`Secondary Region: ${config.secondaryRegion}`);
    console.log(`Domain: ${config.domainName}`);
    console.log(`Deploy Region: ${options.region}`);
    console.log(`Dry Run: ${options.dryRun ? 'Yes' : 'No'}`);
    console.log('');

    try {
        // Validate prerequisites
        await validatePrerequisites();

        // Run pre-deployment tests
        if (!options.skipTests) {
            await runPreDeploymentTests();
        }

        // Deploy infrastructure
        await deployInfrastructure();

        // Run post-deployment validation
        await runPostDeploymentValidation();

        console.log('');
        console.log('✅ Multi-region deployment completed successfully!');
        console.log('');
        console.log('📋 Next Steps:');
        console.log('1. Run DR test: npx tsx scripts/dr-test.ts');
        console.log('2. Configure monitoring alerts');
        console.log('3. Update DNS records if needed');
        console.log('4. Schedule regular DR drills');

    } catch (error) {
        console.error('');
        console.error('💥 Deployment failed:');
        console.error(error instanceof Error ? error.message : error);
        process.exit(1);
    }
}

async function validatePrerequisites() {
    console.log('🔍 Validating prerequisites...');

    // Check required environment variables
    const required = [
        'PRIMARY_REGION',
        'SECONDARY_REGION',
        'DOMAIN_NAME',
        'HOSTED_ZONE_ID',
    ];

    const missing = required.filter(key => !process.env[key]);
    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    // Check AWS CLI
    try {
        execSync('aws --version', { stdio: 'pipe' });
    } catch (error) {
        throw new Error('AWS CLI not found. Please install and configure AWS CLI.');
    }

    // Check CDK CLI
    try {
        execSync('cdk --version', { stdio: 'pipe' });
    } catch (error) {
        throw new Error('AWS CDK CLI not found. Please install: npm install -g aws-cdk');
    }

    // Check AWS credentials
    try {
        execSync('aws sts get-caller-identity', { stdio: 'pipe' });
    } catch (error) {
        throw new Error('AWS credentials not configured. Please run: aws configure');
    }

    // Validate regions
    if (config.primaryRegion === config.secondaryRegion) {
        throw new Error('Primary and secondary regions cannot be the same');
    }

    // Check if CDK is bootstrapped in both regions
    await validateCdkBootstrap();

    console.log('✅ Prerequisites validated');
}

async function validateCdkBootstrap() {
    const regions = options.region === 'both'
        ? [config.primaryRegion, config.secondaryRegion]
        : options.region === 'primary'
            ? [config.primaryRegion]
            : [config.secondaryRegion];

    for (const region of regions) {
        try {
            execSync(`aws cloudformation describe-stacks --region ${region} --stack-name CDKToolkit`, {
                stdio: 'pipe'
            });
        } catch (error) {
            console.log(`⚠️  CDK not bootstrapped in ${region}, bootstrapping now...`);
            execSync(`cdk bootstrap aws://$(aws sts get-caller-identity --query Account --output text)/${region}`, {
                stdio: 'inherit'
            });
        }
    }
}

async function runPreDeploymentTests() {
    console.log('🧪 Running pre-deployment tests...');

    try {
        // Run TypeScript compilation check
        execSync('npx tsc --noEmit', { stdio: 'pipe' });
        console.log('✅ TypeScript compilation check passed');

        // Run unit tests for multi-region components
        execSync('npm test -- --testPathPattern="multi-region"', { stdio: 'pipe' });
        console.log('✅ Multi-region unit tests passed');

        // Validate CDK synthesis
        execSync('cd infra/cdk && cdk synth --quiet', { stdio: 'pipe' });
        console.log('✅ CDK synthesis validation passed');

    } catch (error) {
        if (options.force) {
            console.warn('⚠️  Pre-deployment tests failed, but continuing due to --force flag');
        } else {
            throw new Error('Pre-deployment tests failed. Use --force to override.');
        }
    }
}

async function deployInfrastructure() {
    console.log('🏗️  Deploying infrastructure...');

    if (options.dryRun) {
        console.log('🔍 DRY RUN: Would deploy the following stacks:');

        const stacks = getDeploymentStacks();
        stacks.forEach((stack, index) => {
            console.log(`${index + 1}. ${stack.name} (${stack.region})`);
        });

        return;
    }

    const stacks = getDeploymentStacks();

    for (const stack of stacks) {
        console.log(`📦 Deploying ${stack.name} to ${stack.region}...`);

        try {
            const cdkCommand = `cd infra/cdk && cdk deploy ${stack.name} --region ${stack.region} --require-approval never`;
            execSync(cdkCommand, { stdio: 'inherit' });
            console.log(`✅ ${stack.name} deployed successfully`);
        } catch (error) {
            throw new Error(`Failed to deploy ${stack.name}: ${error}`);
        }
    }
}

function getDeploymentStacks(): Array<{ name: string; region: string; dependencies?: string[] }> {
    const stacks = [];

    if (options.region === 'both' || options.region === 'primary') {
        // Primary region stacks
        stacks.push(
            { name: 'MultiRegionStack-Primary', region: config.primaryRegion },
            { name: 'RDSGlobalStack-Primary', region: config.primaryRegion },
            { name: 'S3CRRStack-Primary', region: config.primaryRegion },
            { name: 'SecretsMultiRegionStack-Primary', region: config.primaryRegion }
        );
    }

    if (options.region === 'both' || options.region === 'secondary') {
        // Secondary region stacks
        stacks.push(
            { name: 'MultiRegionStack-Secondary', region: config.secondaryRegion },
            { name: 'RDSGlobalStack-Secondary', region: config.secondaryRegion },
            { name: 'S3CRRStack-Secondary', region: config.secondaryRegion },
            { name: 'SecretsMultiRegionStack-Secondary', region: config.secondaryRegion }
        );
    }

    // Global stacks (deployed to primary region but affect both)
    if (options.region === 'both') {
        stacks.push(
            { name: 'Route53FailoverStack', region: config.primaryRegion },
            { name: 'CloudFrontMultiOriginStack', region: config.primaryRegion }
        );
    }

    return stacks;
}

async function runPostDeploymentValidation() {
    console.log('✅ Running post-deployment validation...');

    if (options.dryRun) {
        console.log('🔍 DRY RUN: Would run post-deployment validation');
        return;
    }

    try {
        // Wait for resources to be ready
        console.log('⏳ Waiting for resources to be ready...');
        await new Promise(resolve => setTimeout(resolve, 30000)); // 30 seconds

        // Test basic connectivity
        await testBasicConnectivity();

        // Run DR test
        console.log('🧪 Running disaster recovery test...');
        execSync('npx tsx scripts/dr-test.ts --output-file deployment-dr-test.json', {
            stdio: 'inherit'
        });

        console.log('✅ Post-deployment validation completed');

    } catch (error) {
        console.warn('⚠️  Post-deployment validation failed:', error);
        console.warn('   Infrastructure may still be initializing. Please run manual tests.');
    }
}

async function testBasicConnectivity() {
    console.log('🌐 Testing basic connectivity...');

    const endpoints = [
        `https://api-${config.primaryRegion}.${config.domainName}/health`,
        `https://api-${config.secondaryRegion}.${config.domainName}/health`,
        `https://${config.domainName}`,
    ];

    for (const endpoint of endpoints) {
        try {
            const response = await fetch(endpoint, {
                timeout: 10000,
                headers: { 'User-Agent': 'Multi-Region-Deployment-Test' }
            });

            if (response.ok) {
                console.log(`✅ ${endpoint} - OK`);
            } else {
                console.warn(`⚠️  ${endpoint} - ${response.status}`);
            }
        } catch (error) {
            console.warn(`⚠️  ${endpoint} - Connection failed`);
        }
    }
}

// Generate deployment report
function generateDeploymentReport() {
    const report = {
        timestamp: new Date().toISOString(),
        environment: config.environment,
        regions: {
            primary: config.primaryRegion,
            secondary: config.secondaryRegion,
        },
        domain: config.domainName,
        deploymentOptions: options,
        stacks: getDeploymentStacks(),
        nextSteps: [
            'Run DR test: npx tsx scripts/dr-test.ts',
            'Configure monitoring alerts',
            'Update DNS records if needed',
            'Schedule regular DR drills',
            'Update runbooks with new endpoints',
        ],
    };

    const reportFile = `deployment-report-${config.environment}-${Date.now()}.json`;
    writeFileSync(reportFile, JSON.stringify(report, null, 2));

    console.log(`📄 Deployment report saved to: ${reportFile}`);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('');
    console.log('⚠️  Deployment interrupted by user');
    console.log('Some resources may have been partially deployed');
    console.log('Run: cdk destroy to clean up if needed');
    process.exit(1);
});

if (require.main === module) {
    main()
        .then(() => {
            generateDeploymentReport();
        })
        .catch((error) => {
            console.error('Unhandled error:', error);
            process.exit(1);
        });
}