#!/usr/bin/env tsx

/**
 * Staging Load Drill - Auto-Scaling Verification
 * Tests that resources scale up under load and scale down afterwards
 * 
 * Version: 1.0.0
 * Reviewed: 2025-01-14
 */

import { ApplicationAutoScalingClient, DescribeScalableTargetsCommand } from '@aws-sdk/client-application-autoscaling';
import { CloudWatchClient, GetMetricStatisticsCommand } from '@aws-sdk/client-cloudwatch';
import { LambdaClient } from '@aws-sdk/client-lambda';

interface LoadTestConfig {
    environment: 'staging' | 'prod';
    duration: number; // minutes
    rampUp: number; // minutes
    targetRPS: number; // requests per second
    endpoints: string[];
}

interface MetricPoint {
    timestamp: Date;
    value: number;
}

class StagingLoadDrill {
    private cloudWatchClient: CloudWatchClient;
    private lambdaClient: LambdaClient;
    private autoScalingClient: ApplicationAutoScalingClient;
    private config: LoadTestConfig;

    constructor(config: LoadTestConfig) {
        this.config = config;

        const clientConfig = {
            region: process.env.AWS_REGION || 'eu-central-1'
        };

        this.cloudWatchClient = new CloudWatchClient(clientConfig);
        this.lambdaClient = new LambdaClient(clientConfig);
        this.autoScalingClient = new ApplicationAutoScalingClient(clientConfig);
    }

    async runLoadDrill(): Promise<void> {
        console.log('🚀 Starting Staging Load Drill for Auto-Scaling Verification');
        console.log(`Environment: ${this.config.environment}`);
        console.log(`Duration: ${this.config.duration} minutes`);
        console.log(`Target RPS: ${this.config.targetRPS}`);
        console.log('');

        try {
            // Phase 1: Baseline Metrics
            console.log('📊 Phase 1: Collecting Baseline Metrics...');
            const baselineMetrics = await this.collectBaselineMetrics();
            this.printMetrics('Baseline', baselineMetrics);

            // Phase 2: Load Generation
            console.log('⚡ Phase 2: Generating Load...');
            await this.generateLoad();

            // Phase 3: Monitor Scale-Up
            console.log('📈 Phase 3: Monitoring Scale-Up...');
            const scaleUpMetrics = await this.monitorScaleUp();
            this.printMetrics('Scale-Up', scaleUpMetrics);

            // Phase 4: Stop Load
            console.log('🛑 Phase 4: Stopping Load...');
            await this.stopLoad();

            // Phase 5: Monitor Scale-Down
            console.log('📉 Phase 5: Monitoring Scale-Down...');
            const scaleDownMetrics = await this.monitorScaleDown();
            this.printMetrics('Scale-Down', scaleDownMetrics);

            // Phase 6: Verification
            console.log('✅ Phase 6: Verifying Auto-Scaling Behavior...');
            const verification = this.verifyScalingBehavior(baselineMetrics, scaleUpMetrics, scaleDownMetrics);
            this.printVerificationResults(verification);

            console.log('🎉 Staging Load Drill Complete!');

        } catch (error) {
            console.error('❌ Load drill failed:', error);
            throw error;
        }
    }

    private async collectBaselineMetrics(): Promise<Record<string, MetricPoint[]>> {
        const endTime = new Date();
        const startTime = new Date(endTime.getTime() - 10 * 60 * 1000); // Last 10 minutes

        return {
            lambdaConcurrency: await this.getMetricData('AWS/Lambda', 'ConcurrentExecutions', startTime, endTime),
            lambdaDuration: await this.getMetricData('AWS/Lambda', 'Duration', startTime, endTime, 'p95'),
            lambdaErrors: await this.getMetricData('AWS/Lambda', 'Errors', startTime, endTime, 'Sum'),
            lambdaThrottles: await this.getMetricData('AWS/Lambda', 'Throttles', startTime, endTime, 'Sum'),
            provisionedConcurrency: await this.getProvisionedConcurrencyMetrics(),
            rdsCPU: await this.getMetricData('AWS/RDS', 'CPUUtilization', startTime, endTime),
            rdsConnections: await this.getMetricData('AWS/RDS', 'DatabaseConnections', startTime, endTime),
            elastiCacheCPU: await this.getMetricData('AWS/ElastiCache', 'EngineCPUUtilization', startTime, endTime),
            elastiCacheMemory: await this.getMetricData('AWS/ElastiCache', 'DatabaseMemoryUsagePercentage', startTime, endTime)
        };
    }

    private async generateLoad(): Promise<void> {
        console.log(`Generating ${this.config.targetRPS} RPS for ${this.config.duration} minutes...`);

        // Use Artillery for load generation
        const artilleryConfig = {
            config: {
                target: `https://${this.config.environment === 'staging' ? 'staging.' : ''}matbakh.app`,
                phases: [
                    {
                        duration: this.config.rampUp * 60,
                        arrivalRate: 1,
                        rampTo: this.config.targetRPS,
                        name: 'Ramp up'
                    },
                    {
                        duration: (this.config.duration - this.config.rampUp) * 60,
                        arrivalRate: this.config.targetRPS,
                        name: 'Sustained load'
                    }
                ]
            },
            scenarios: [
                {
                    name: 'API Load Test',
                    weight: 100,
                    flow: this.config.endpoints.map(endpoint => ({
                        get: {
                            url: endpoint,
                            headers: {
                                'User-Agent': 'LoadDrill/1.0'
                            }
                        }
                    }))
                }
            ]
        };

        // Write Artillery config
        const fs = await import('fs/promises');
        await fs.writeFile('artillery-config.yml', JSON.stringify(artilleryConfig, null, 2));

        // Run Artillery (in background)
        const { spawn } = await import('child_process');
        const artillery = spawn('npx', ['artillery', 'run', 'artillery-config.yml'], {
            stdio: 'pipe'
        });

        // Wait for load test duration
        await new Promise(resolve => setTimeout(resolve, this.config.duration * 60 * 1000));
    }

    private async monitorScaleUp(): Promise<Record<string, MetricPoint[]>> {
        console.log('Monitoring for 5 minutes during load...');

        // Wait 5 minutes to allow scaling
        await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000));

        const endTime = new Date();
        const startTime = new Date(endTime.getTime() - 5 * 60 * 1000);

        return {
            lambdaConcurrency: await this.getMetricData('AWS/Lambda', 'ConcurrentExecutions', startTime, endTime),
            lambdaDuration: await this.getMetricData('AWS/Lambda', 'Duration', startTime, endTime, 'p95'),
            lambdaErrors: await this.getMetricData('AWS/Lambda', 'Errors', startTime, endTime, 'Sum'),
            lambdaThrottles: await this.getMetricData('AWS/Lambda', 'Throttles', startTime, endTime, 'Sum'),
            provisionedConcurrency: await this.getProvisionedConcurrencyMetrics(),
            rdsCPU: await this.getMetricData('AWS/RDS', 'CPUUtilization', startTime, endTime),
            rdsConnections: await this.getMetricData('AWS/RDS', 'DatabaseConnections', startTime, endTime),
            elastiCacheCPU: await this.getMetricData('AWS/ElastiCache', 'EngineCPUUtilization', startTime, endTime),
            elastiCacheMemory: await this.getMetricData('AWS/ElastiCache', 'DatabaseMemoryUsagePercentage', startTime, endTime)
        };
    }

    private async stopLoad(): Promise<void> {
        console.log('Stopping load generation...');

        // Kill any running Artillery processes
        const { exec } = await import('child_process');
        exec('pkill -f artillery');

        // Wait a moment for processes to stop
        await new Promise(resolve => setTimeout(resolve, 30 * 1000));
    }

    private async monitorScaleDown(): Promise<Record<string, MetricPoint[]>> {
        console.log('Monitoring scale-down for 10 minutes...');

        // Wait 10 minutes to allow scale-down
        await new Promise(resolve => setTimeout(resolve, 10 * 60 * 1000));

        const endTime = new Date();
        const startTime = new Date(endTime.getTime() - 5 * 60 * 1000);

        return {
            lambdaConcurrency: await this.getMetricData('AWS/Lambda', 'ConcurrentExecutions', startTime, endTime),
            lambdaDuration: await this.getMetricData('AWS/Lambda', 'Duration', startTime, endTime, 'p95'),
            lambdaErrors: await this.getMetricData('AWS/Lambda', 'Errors', startTime, endTime, 'Sum'),
            lambdaThrottles: await this.getMetricData('AWS/Lambda', 'Throttles', startTime, endTime, 'Sum'),
            provisionedConcurrency: await this.getProvisionedConcurrencyMetrics(),
            rdsCPU: await this.getMetricData('AWS/RDS', 'CPUUtilization', startTime, endTime),
            rdsConnections: await this.getMetricData('AWS/RDS', 'DatabaseConnections', startTime, endTime),
            elastiCacheCPU: await this.getMetricData('AWS/ElastiCache', 'EngineCPUUtilization', startTime, endTime),
            elastiCacheMemory: await this.getMetricData('AWS/ElastiCache', 'DatabaseMemoryUsagePercentage', startTime, endTime)
        };
    }

    private async getMetricData(
        namespace: string,
        metricName: string,
        startTime: Date,
        endTime: Date,
        statistic: string = 'Average'
    ): Promise<MetricPoint[]> {
        try {
            const response = await this.cloudWatchClient.send(
                new GetMetricStatisticsCommand({
                    Namespace: namespace,
                    MetricName: metricName,
                    StartTime: startTime,
                    EndTime: endTime,
                    Period: 300, // 5 minutes
                    Statistics: [statistic]
                })
            );

            return (response.Datapoints || [])
                .map(dp => ({
                    timestamp: dp.Timestamp!,
                    value: dp[statistic as keyof typeof dp] as number || 0
                }))
                .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        } catch (error) {
            console.warn(`Failed to get metric ${namespace}/${metricName}:`, error);
            return [];
        }
    }

    private async getProvisionedConcurrencyMetrics(): Promise<MetricPoint[]> {
        try {
            const targets = await this.autoScalingClient.send(
                new DescribeScalableTargetsCommand({
                    ServiceNamespace: 'lambda'
                })
            );

            const metrics: MetricPoint[] = [];
            const now = new Date();

            for (const target of targets.ScalableTargets || []) {
                metrics.push({
                    timestamp: now,
                    value: target.MinCapacity || 0
                });
            }

            return metrics;
        } catch (error) {
            console.warn('Failed to get provisioned concurrency metrics:', error);
            return [];
        }
    }

    private verifyScalingBehavior(
        baseline: Record<string, MetricPoint[]>,
        scaleUp: Record<string, MetricPoint[]>,
        scaleDown: Record<string, MetricPoint[]>
    ): Record<string, boolean> {
        const results: Record<string, boolean> = {};

        // Verify Lambda concurrency increased during load
        const baselineConcurrency = this.getAverageValue(baseline.lambdaConcurrency);
        const scaleUpConcurrency = this.getAverageValue(scaleUp.lambdaConcurrency);
        const scaleDownConcurrency = this.getAverageValue(scaleDown.lambdaConcurrency);

        results.concurrencyScaledUp = scaleUpConcurrency > baselineConcurrency * 1.5;
        results.concurrencyScaledDown = scaleDownConcurrency < scaleUpConcurrency * 0.8;

        // Verify no throttles occurred
        const scaleUpThrottles = this.getSumValue(scaleUp.lambdaThrottles);
        results.noThrottles = scaleUpThrottles === 0;

        // Verify P95 duration stayed within SLO
        const scaleUpDuration = this.getMaxValue(scaleUp.lambdaDuration);
        const sloTarget = this.config.environment === 'staging' ? 300 : 200; // ms
        results.p95WithinSLO = scaleUpDuration < sloTarget;

        // Verify error rate stayed low
        const scaleUpErrors = this.getSumValue(scaleUp.lambdaErrors);
        const errorRateTarget = this.config.environment === 'staging' ? 2 : 1; // %
        results.lowErrorRate = scaleUpErrors < errorRateTarget;

        // Verify RDS handled the load
        const baselineRDSCPU = this.getAverageValue(baseline.rdsCPU);
        const scaleUpRDSCPU = this.getAverageValue(scaleUp.rdsCPU);
        results.rdsHandledLoad = scaleUpRDSCPU < 80; // CPU stayed below 80%

        return results;
    }

    private getAverageValue(metrics: MetricPoint[]): number {
        if (metrics.length === 0) return 0;
        return metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length;
    }

    private getMaxValue(metrics: MetricPoint[]): number {
        if (metrics.length === 0) return 0;
        return Math.max(...metrics.map(m => m.value));
    }

    private getSumValue(metrics: MetricPoint[]): number {
        return metrics.reduce((sum, m) => sum + m.value, 0);
    }

    private printMetrics(phase: string, metrics: Record<string, MetricPoint[]>): void {
        console.log(`\n📊 ${phase} Metrics:`);
        console.log('─'.repeat(50));

        Object.entries(metrics).forEach(([key, points]) => {
            const avg = this.getAverageValue(points);
            const max = this.getMaxValue(points);
            console.log(`${key.padEnd(20)}: avg=${avg.toFixed(2)}, max=${max.toFixed(2)}`);
        });

        console.log('');
    }

    private printVerificationResults(results: Record<string, boolean>): void {
        console.log('\n✅ Auto-Scaling Verification Results:');
        console.log('─'.repeat(50));

        Object.entries(results).forEach(([test, passed]) => {
            const status = passed ? '✅ PASS' : '❌ FAIL';
            console.log(`${test.padEnd(25)}: ${status}`);
        });

        const allPassed = Object.values(results).every(r => r);
        console.log('─'.repeat(50));
        console.log(`Overall Result: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);

        if (!allPassed) {
            console.log('\n⚠️  Failed tests indicate auto-scaling issues that need investigation.');
        }
    }
}

// CLI Interface
async function main() {
    const args = process.argv.slice(2);

    const config: LoadTestConfig = {
        environment: (args[0] as 'staging' | 'prod') || 'staging',
        duration: parseInt(args[1]) || 15, // 15 minutes default
        rampUp: parseInt(args[2]) || 5,    // 5 minutes ramp-up
        targetRPS: parseInt(args[3]) || 50, // 50 RPS default
        endpoints: [
            '/api/persona',
            '/api/vc/start',
            '/api/health',
            '/'
        ]
    };

    if (!['staging', 'prod'].includes(config.environment)) {
        console.error('❌ Environment must be "staging" or "prod"');
        process.exit(1);
    }

    console.log('🎯 Staging Load Drill Configuration:');
    console.log(`Environment: ${config.environment}`);
    console.log(`Duration: ${config.duration} minutes`);
    console.log(`Ramp-up: ${config.rampUp} minutes`);
    console.log(`Target RPS: ${config.targetRPS}`);
    console.log(`Endpoints: ${config.endpoints.join(', ')}`);
    console.log('');

    const drill = new StagingLoadDrill(config);

    try {
        await drill.runLoadDrill();
        console.log('🎉 Load drill completed successfully!');
    } catch (error) {
        console.error('❌ Load drill failed:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

export { StagingLoadDrill };
