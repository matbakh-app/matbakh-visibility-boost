#!/usr/bin/env tsx

/**
 * Infrastructure Discovery Script for Auto-Scaling Configuration
 * Discovers existing AWS resources in account 055062860590, region eu-central-1
 */

import {
    ApplicationAutoScalingClient,
    DescribeScalableTargetsCommand
} from '@aws-sdk/client-application-autoscaling';
import {
    CloudFrontClient,
    ListDistributionsCommand
} from '@aws-sdk/client-cloudfront';
import {
    DescribeCacheClustersCommand,
    DescribeReplicationGroupsCommand,
    ElastiCacheClient
} from '@aws-sdk/client-elasticache';
import {
    GetFunctionCommand,
    GetProvisionedConcurrencyConfigCommand,
    LambdaClient,
    ListFunctionsCommand
} from '@aws-sdk/client-lambda';
import {
    DescribeDBInstancesCommand,
    DescribeDBProxiesCommand,
    RDSClient
} from '@aws-sdk/client-rds';
import {
    ListBucketsCommand,
    S3Client
} from '@aws-sdk/client-s3';

const AWS_REGION = 'eu-central-1';
const AWS_ACCOUNT = '055062860590';

interface InfrastructureInventory {
    lambdaFunctions: any[];
    rdsInstances: any[];
    rdsProxies: any[];
    elastiCacheClusters: any[];
    cloudFrontDistributions: any[];
    s3Buckets: any[];
    existingScalingTargets: any[];
}

class InfrastructureDiscovery {
    private lambdaClient: LambdaClient;
    private rdsClient: RDSClient;
    private elastiCacheClient: ElastiCacheClient;
    private cloudFrontClient: CloudFrontClient;
    private s3Client: S3Client;
    private autoScalingClient: ApplicationAutoScalingClient;

    constructor() {
        const clientConfig = {
            region: AWS_REGION,
            // Use AWS SSO profile or environment credentials
        };

        this.lambdaClient = new LambdaClient(clientConfig);
        this.rdsClient = new RDSClient(clientConfig);
        this.elastiCacheClient = new ElastiCacheClient(clientConfig);
        this.cloudFrontClient = new CloudFrontClient(clientConfig);
        this.s3Client = new S3Client(clientConfig);
        this.autoScalingClient = new ApplicationAutoScalingClient(clientConfig);
    }

    async discoverLambdaFunctions(): Promise<any[]> {
        console.log('🔍 Discovering Lambda functions...');

        try {
            const response = await this.lambdaClient.send(new ListFunctionsCommand({}));
            const functions = response.Functions || [];

            // Get detailed info for each function
            const detailedFunctions = await Promise.all(
                functions.map(async (func) => {
                    try {
                        const details = await this.lambdaClient.send(
                            new GetFunctionCommand({ FunctionName: func.FunctionName })
                        );

                        // Check for existing provisioned concurrency
                        let provisionedConcurrency = null;
                        try {
                            const pcResponse = await this.lambdaClient.send(
                                new GetProvisionedConcurrencyConfigCommand({
                                    FunctionName: func.FunctionName
                                })
                            );
                            provisionedConcurrency = pcResponse;
                        } catch (e) {
                            // No provisioned concurrency configured
                        }

                        return {
                            ...details,
                            provisionedConcurrency,
                            isApiFunction: this.isApiFunction(func.FunctionName || ''),
                            isCriticalPath: this.isCriticalPath(func.FunctionName || ''),
                            environment: this.getEnvironmentFromName(func.FunctionName || '')
                        };
                    } catch (error) {
                        console.warn(`Failed to get details for ${func.FunctionName}:`, error);
                        return func;
                    }
                })
            );

            console.log(`✅ Found ${detailedFunctions.length} Lambda functions`);
            return detailedFunctions;
        } catch (error) {
            console.error('❌ Failed to discover Lambda functions:', error);
            return [];
        }
    }

    async discoverRDSInstances(): Promise<any[]> {
        console.log('🔍 Discovering RDS instances...');

        try {
            const response = await this.rdsClient.send(new DescribeDBInstancesCommand({}));
            const instances = response.DBInstances || [];

            console.log(`✅ Found ${instances.length} RDS instances`);
            return instances.map(instance => ({
                ...instance,
                isMatbakhDB: instance.DBInstanceIdentifier?.includes('matbakh'),
                environment: this.getEnvironmentFromName(instance.DBInstanceIdentifier || '')
            }));
        } catch (error) {
            console.error('❌ Failed to discover RDS instances:', error);
            return [];
        }
    }

    async discoverRDSProxies(): Promise<any[]> {
        console.log('🔍 Discovering RDS Proxies...');

        try {
            const response = await this.rdsClient.send(new DescribeDBProxiesCommand({}));
            const proxies = response.DBProxies || [];

            console.log(`✅ Found ${proxies.length} RDS Proxies`);
            return proxies;
        } catch (error) {
            console.error('❌ Failed to discover RDS Proxies:', error);
            return [];
        }
    }

    async discoverElastiCacheClusters(): Promise<any[]> {
        console.log('🔍 Discovering ElastiCache clusters...');

        try {
            const [replicationGroups, cacheClusters] = await Promise.all([
                this.elastiCacheClient.send(new DescribeReplicationGroupsCommand({})),
                this.elastiCacheClient.send(new DescribeCacheClustersCommand({}))
            ]);

            const clusters = [
                ...(replicationGroups.ReplicationGroups || []).map(rg => ({
                    ...rg,
                    type: 'replication-group',
                    environment: this.getEnvironmentFromName(rg.ReplicationGroupId || '')
                })),
                ...(cacheClusters.CacheClusters || []).map(cc => ({
                    ...cc,
                    type: 'cache-cluster',
                    environment: this.getEnvironmentFromName(cc.CacheClusterId || '')
                }))
            ];

            console.log(`✅ Found ${clusters.length} ElastiCache clusters`);
            return clusters;
        } catch (error) {
            console.error('❌ Failed to discover ElastiCache clusters:', error);
            return [];
        }
    }

    async discoverCloudFrontDistributions(): Promise<any[]> {
        console.log('🔍 Discovering CloudFront distributions...');

        try {
            const response = await this.cloudFrontClient.send(new ListDistributionsCommand({}));
            const distributions = response.DistributionList?.Items || [];

            console.log(`✅ Found ${distributions.length} CloudFront distributions`);
            return distributions.map(dist => ({
                ...dist,
                isMatbakhDistribution: dist.Id === 'E2W4JULEW8BXSD' ||
                    dist.Comment?.includes('matbakh')
            }));
        } catch (error) {
            console.error('❌ Failed to discover CloudFront distributions:', error);
            return [];
        }
    }

    async discoverS3Buckets(): Promise<any[]> {
        console.log('🔍 Discovering S3 buckets...');

        try {
            const response = await this.s3Client.send(new ListBucketsCommand({}));
            const buckets = response.Buckets || [];

            console.log(`✅ Found ${buckets.length} S3 buckets`);
            return buckets.map(bucket => ({
                ...bucket,
                isMatbakhBucket: bucket.Name?.includes('matbakh') ||
                    bucket.Name?.includes('webbucket')
            }));
        } catch (error) {
            console.error('❌ Failed to discover S3 buckets:', error);
            return [];
        }
    }

    async discoverExistingScalingTargets(): Promise<any[]> {
        console.log('🔍 Discovering existing auto-scaling targets...');

        try {
            const serviceNamespaces = [
                'lambda',
                'rds',
                'elasticache',
                'application-autoscaling'
            ];

            const allTargets = [];
            for (const namespace of serviceNamespaces) {
                try {
                    const response = await this.autoScalingClient.send(
                        new DescribeScalableTargetsCommand({ ServiceNamespace: namespace })
                    );
                    allTargets.push(...(response.ScalableTargets || []));
                } catch (error) {
                    console.warn(`No scaling targets found for ${namespace}`);
                }
            }

            console.log(`✅ Found ${allTargets.length} existing scaling targets`);
            return allTargets;
        } catch (error) {
            console.error('❌ Failed to discover scaling targets:', error);
            return [];
        }
    }

    private isApiFunction(functionName: string): boolean {
        const apiPatterns = [
            'api', 'http', 'rest', 'graphql', 'endpoint',
            'persona', 'vc-', 'upload', 'auth'
        ];
        return apiPatterns.some(pattern =>
            functionName.toLowerCase().includes(pattern)
        );
    }

    private isCriticalPath(functionName: string): boolean {
        const criticalPatterns = [
            'persona', 'vc-start', 'vc-result', 'auth', 'upload'
        ];
        return criticalPatterns.some(pattern =>
            functionName.toLowerCase().includes(pattern)
        );
    }

    private getEnvironmentFromName(name: string): string {
        if (name.includes('-prod-') || name.includes('production')) return 'prod';
        if (name.includes('-staging-') || name.includes('stage')) return 'staging';
        if (name.includes('-dev-') || name.includes('development')) return 'dev';
        return 'unknown';
    }

    async generateInventoryReport(): Promise<InfrastructureInventory> {
        console.log('🚀 Starting infrastructure discovery...\n');

        const [
            lambdaFunctions,
            rdsInstances,
            rdsProxies,
            elastiCacheClusters,
            cloudFrontDistributions,
            s3Buckets,
            existingScalingTargets
        ] = await Promise.all([
            this.discoverLambdaFunctions(),
            this.discoverRDSInstances(),
            this.discoverRDSProxies(),
            this.discoverElastiCacheClusters(),
            this.discoverCloudFrontDistributions(),
            this.discoverS3Buckets(),
            this.discoverExistingScalingTargets()
        ]);

        const inventory: InfrastructureInventory = {
            lambdaFunctions,
            rdsInstances,
            rdsProxies,
            elastiCacheClusters,
            cloudFrontDistributions,
            s3Buckets,
            existingScalingTargets
        };

        // Generate summary report
        this.printInventorySummary(inventory);

        // Save detailed report
        await this.saveInventoryReport(inventory);

        return inventory;
    }

    private printInventorySummary(inventory: InfrastructureInventory): void {
        console.log('\n📊 INFRASTRUCTURE INVENTORY SUMMARY');
        console.log('=====================================');

        console.log(`\n🔧 Lambda Functions: ${inventory.lambdaFunctions.length}`);
        const apiFunctions = inventory.lambdaFunctions.filter(f => f.isApiFunction);
        const criticalFunctions = inventory.lambdaFunctions.filter(f => f.isCriticalPath);
        console.log(`   - API Functions: ${apiFunctions.length}`);
        console.log(`   - Critical Path: ${criticalFunctions.length}`);

        console.log(`\n🗄️  RDS Instances: ${inventory.rdsInstances.length}`);
        const matbakhDBs = inventory.rdsInstances.filter(db => db.isMatbakhDB);
        console.log(`   - Matbakh DBs: ${matbakhDBs.length}`);
        console.log(`   - RDS Proxies: ${inventory.rdsProxies.length}`);

        console.log(`\n🔄 ElastiCache Clusters: ${inventory.elastiCacheClusters.length}`);

        console.log(`\n🌐 CloudFront Distributions: ${inventory.cloudFrontDistributions.length}`);
        const matbakhDistributions = inventory.cloudFrontDistributions.filter(d => d.isMatbakhDistribution);
        console.log(`   - Matbakh Distributions: ${matbakhDistributions.length}`);

        console.log(`\n🪣 S3 Buckets: ${inventory.s3Buckets.length}`);
        const matbakhBuckets = inventory.s3Buckets.filter(b => b.isMatbakhBucket);
        console.log(`   - Matbakh Buckets: ${matbakhBuckets.length}`);

        console.log(`\n📈 Existing Scaling Targets: ${inventory.existingScalingTargets.length}`);

        console.log('\n✅ Discovery complete! Detailed report saved to infrastructure-inventory.json\n');
    }

    private async saveInventoryReport(inventory: InfrastructureInventory): Promise<void> {
        const fs = await import('fs/promises');
        const reportPath = 'infrastructure-inventory.json';

        await fs.writeFile(
            reportPath,
            JSON.stringify(inventory, null, 2),
            'utf-8'
        );

        console.log(`📄 Detailed inventory saved to: ${reportPath}`);
    }
}

// Main execution
async function main() {
    try {
        const discovery = new InfrastructureDiscovery();
        await discovery.generateInventoryReport();
    } catch (error) {
        console.error('❌ Infrastructure discovery failed:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

export { InfrastructureDiscovery };
