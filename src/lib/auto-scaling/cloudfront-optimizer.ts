/**
 * CloudFront Optimization Manager
 * Handles CloudFront CDN optimization and monitoring
 */

import {
    CloudFrontClient,
    CreateInvalidationCommand,
    GetDistributionConfigCommand,
    UpdateDistributionCommand
} from '@aws-sdk/client-cloudfront';
import {
    CloudWatchClient,
    GetMetricStatisticsCommand,
    PutMetricAlarmCommand
} from '@aws-sdk/client-cloudwatch';

export interface CloudFrontOptimizationConfig {
    distributionId: string;
    environment: 'dev' | 'staging' | 'prod';
    cacheOptimization: {
        staticAssetsTTL: number;
        htmlTTL: number;
        enableBrotli: boolean;
        enableHttp3: boolean;
    };
    monitoring: {
        cacheHitRateThreshold: number;
        errorRateThreshold: number;
        originLatencyThreshold: number;
    };
    originShield: {
        enabled: boolean;
        region?: string;
    };
}

export interface CloudFrontMetrics {
    cacheHitRate: number;
    errorRate4xx: number;
    errorRate5xx: number;
    originLatency: number;
    bytesDownloaded: number;
    requests: number;
}

export class CloudFrontOptimizer {
    private cloudFrontClient: CloudFrontClient;
    private cloudWatchClient: CloudWatchClient;
    private config: CloudFrontOptimizationConfig;

    constructor(config: CloudFrontOptimizationConfig) {
        this.config = config;

        const clientConfig = {
            region: 'us-east-1' // CloudFront is global but API is in us-east-1
        };

        this.cloudFrontClient = new CloudFrontClient(clientConfig);
        this.cloudWatchClient = new CloudWatchClient({
            region: process.env.AWS_REGION || 'eu-central-1'
        });
    }

    /**
     * Optimize CloudFront distribution configuration
     */
    async optimizeDistribution(): Promise<void> {
        console.log(`🌐 Optimizing CloudFront distribution ${this.config.distributionId}...`);

        try {
            // Get current distribution configuration
            const { Distribution, ETag } = await this.cloudFrontClient.send(
                new GetDistributionConfigCommand({
                    Id: this.config.distributionId
                })
            );

            if (!Distribution || !ETag) {
                throw new Error('Failed to get distribution configuration');
            }

            // Update distribution with optimized settings
            const optimizedConfig = this.createOptimizedConfig(Distribution);

            await this.cloudFrontClient.send(
                new UpdateDistributionCommand({
                    Id: this.config.distributionId,
                    DistributionConfig: optimizedConfig,
                    IfMatch: ETag
                })
            );

            console.log('✅ CloudFront distribution optimized');
        } catch (error) {
            console.error('❌ Failed to optimize CloudFront distribution:', error);
            throw error;
        }
    }

    /**
     * Set up CloudFront monitoring and alarms
     */
    async setupMonitoring(): Promise<void> {
        console.log('📊 Setting up CloudFront monitoring...');

        try {
            await Promise.all([
                this.createCacheHitRateAlarm(),
                this.create4xxErrorRateAlarm(),
                this.create5xxErrorRateAlarm(),
                this.createOriginLatencyAlarm(),
                this.createBytesDownloadedAlarm()
            ]);

            console.log('✅ CloudFront monitoring configured');
        } catch (error) {
            console.error('❌ Failed to setup CloudFront monitoring:', error);
            throw error;
        }
    }

    /**
     * Get CloudFront performance metrics
     */
    async getMetrics(startTime: Date, endTime: Date): Promise<CloudFrontMetrics> {
        console.log('📈 Fetching CloudFront metrics...');

        try {
            const [
                cacheHitRate,
                errorRate4xx,
                errorRate5xx,
                originLatency,
                bytesDownloaded,
                requests
            ] = await Promise.all([
                this.getMetricValue('CacheHitRate', startTime, endTime),
                this.getMetricValue('4xxErrorRate', startTime, endTime),
                this.getMetricValue('5xxErrorRate', startTime, endTime),
                this.getMetricValue('OriginLatency', startTime, endTime),
                this.getMetricValue('BytesDownloaded', startTime, endTime),
                this.getMetricValue('Requests', startTime, endTime)
            ]);

            return {
                cacheHitRate: cacheHitRate || 0,
                errorRate4xx: errorRate4xx || 0,
                errorRate5xx: errorRate5xx || 0,
                originLatency: originLatency || 0,
                bytesDownloaded: bytesDownloaded || 0,
                requests: requests || 0
            };
        } catch (error) {
            console.error('❌ Failed to get CloudFront metrics:', error);
            throw error;
        }
    }

    /**
     * Create cache invalidation
     */
    async createInvalidation(paths: string[]): Promise<string> {
        console.log(`🔄 Creating invalidation for ${paths.length} paths...`);

        try {
            const response = await this.cloudFrontClient.send(
                new CreateInvalidationCommand({
                    DistributionId: this.config.distributionId,
                    InvalidationBatch: {
                        Paths: {
                            Quantity: paths.length,
                            Items: paths
                        },
                        CallerReference: `invalidation-${Date.now()}`
                    }
                })
            );

            const invalidationId = response.Invalidation?.Id;
            console.log(`✅ Invalidation created: ${invalidationId}`);

            return invalidationId || '';
        } catch (error) {
            console.error('❌ Failed to create invalidation:', error);
            throw error;
        }
    }

    /**
     * Generate optimization recommendations
     */
    async generateRecommendations(): Promise<string[]> {
        const recommendations: string[] = [];

        try {
            const endTime = new Date();
            const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000); // Last 24 hours

            const metrics = await this.getMetrics(startTime, endTime);

            // Cache hit rate recommendations
            if (metrics.cacheHitRate < this.config.monitoring.cacheHitRateThreshold) {
                recommendations.push(
                    `Low cache hit rate (${metrics.cacheHitRate.toFixed(1)}%). Consider optimizing cache policies and TTL settings.`
                );
            }

            // Error rate recommendations
            if (metrics.errorRate4xx > 1) {
                recommendations.push(
                    `High 4xx error rate (${metrics.errorRate4xx.toFixed(1)}%). Check for broken links and missing resources.`
                );
            }

            if (metrics.errorRate5xx > this.config.monitoring.errorRateThreshold) {
                recommendations.push(
                    `High 5xx error rate (${metrics.errorRate5xx.toFixed(1)}%). Check origin server health and capacity.`
                );
            }

            // Origin latency recommendations
            if (metrics.originLatency > this.config.monitoring.originLatencyThreshold) {
                recommendations.push(
                    `High origin latency (${metrics.originLatency.toFixed(0)}ms). Consider enabling Origin Shield or optimizing origin performance.`
                );
            }

            // General recommendations based on environment
            if (this.config.environment === 'prod') {
                if (!this.config.originShield.enabled) {
                    recommendations.push('Enable Origin Shield for production to reduce origin load and improve performance.');
                }

                if (!this.config.cacheOptimization.enableBrotli) {
                    recommendations.push('Enable Brotli compression for better performance and reduced bandwidth usage.');
                }

                if (!this.config.cacheOptimization.enableHttp3) {
                    recommendations.push('Enable HTTP/3 for improved connection performance.');
                }
            }

            return recommendations;
        } catch (error) {
            console.error('❌ Failed to generate recommendations:', error);
            return ['Failed to analyze metrics for recommendations'];
        }
    }

    // Private methods

    private createOptimizedConfig(currentConfig: any): any {
        const optimizedConfig = { ...currentConfig };

        // Update cache behaviors for optimization
        if (optimizedConfig.CacheBehaviors?.Items) {
            optimizedConfig.CacheBehaviors.Items = optimizedConfig.CacheBehaviors.Items.map((behavior: any) => {
                // Static assets optimization
                if (this.isStaticAssetPath(behavior.PathPattern)) {
                    return {
                        ...behavior,
                        CachePolicyId: this.getStaticAssetsCachePolicyId(),
                        Compress: true,
                        ViewerProtocolPolicy: 'redirect-to-https'
                    };
                }

                // HTML/dynamic content optimization
                return {
                    ...behavior,
                    CachePolicyId: this.getDynamicContentCachePolicyId(),
                    Compress: true,
                    ViewerProtocolPolicy: 'redirect-to-https'
                };
            });
        }

        // Enable HTTP/3 if requested
        if (this.config.cacheOptimization.enableHttp3) {
            optimizedConfig.HttpVersion = 'http3';
        }

        // Configure Origin Shield
        if (this.config.originShield.enabled && optimizedConfig.Origins?.Items) {
            optimizedConfig.Origins.Items = optimizedConfig.Origins.Items.map((origin: any) => ({
                ...origin,
                OriginShield: {
                    Enabled: true,
                    OriginShieldRegion: this.config.originShield.region || 'eu-central-1'
                }
            }));
        }

        return optimizedConfig;
    }

    private isStaticAssetPath(pathPattern: string): boolean {
        const staticPatterns = [
            '*.js', '*.css', '*.png', '*.jpg', '*.jpeg', '*.gif', '*.svg',
            '*.ico', '*.woff', '*.woff2', '*.ttf', '*.eot', '*.pdf'
        ];

        return staticPatterns.some(pattern =>
            pathPattern.includes(pattern.replace('*', ''))
        );
    }

    private getStaticAssetsCachePolicyId(): string {
        // AWS Managed Cache Policy for static assets (1 year TTL)
        return '658327ea-f89d-4fab-a63d-7e88639e58f6';
    }

    private getDynamicContentCachePolicyId(): string {
        // AWS Managed Cache Policy for dynamic content (short TTL)
        return '4135ea2d-6df8-44a3-9df3-4b5a84be39ad';
    }

    private async createCacheHitRateAlarm(): Promise<void> {
        const alarmName = `${this.config.environment}-${this.config.distributionId}-LowCacheHitRate`;

        await this.cloudWatchClient.send(new PutMetricAlarmCommand({
            AlarmName: alarmName,
            AlarmDescription: `Low cache hit rate for CloudFront distribution ${this.config.distributionId}`,
            MetricName: 'CacheHitRate',
            Namespace: 'AWS/CloudFront',
            Statistic: 'Average',
            Dimensions: [{ Name: 'DistributionId', Value: this.config.distributionId }],
            Period: 900, // 15 minutes
            EvaluationPeriods: 2,
            Threshold: this.config.monitoring.cacheHitRateThreshold,
            ComparisonOperator: 'LessThanThreshold',
            TreatMissingData: 'notBreaching'
        }));
    }

    private async create4xxErrorRateAlarm(): Promise<void> {
        const alarmName = `${this.config.environment}-${this.config.distributionId}-High4xxErrorRate`;

        await this.cloudWatchClient.send(new PutMetricAlarmCommand({
            AlarmName: alarmName,
            AlarmDescription: `High 4xx error rate for CloudFront distribution ${this.config.distributionId}`,
            MetricName: '4xxErrorRate',
            Namespace: 'AWS/CloudFront',
            Statistic: 'Average',
            Dimensions: [{ Name: 'DistributionId', Value: this.config.distributionId }],
            Period: 300, // 5 minutes
            EvaluationPeriods: 2,
            Threshold: 5, // 5% error rate
            ComparisonOperator: 'GreaterThanThreshold'
        }));
    }

    private async create5xxErrorRateAlarm(): Promise<void> {
        const alarmName = `${this.config.environment}-${this.config.distributionId}-High5xxErrorRate`;

        await this.cloudWatchClient.send(new PutMetricAlarmCommand({
            AlarmName: alarmName,
            AlarmDescription: `High 5xx error rate for CloudFront distribution ${this.config.distributionId}`,
            MetricName: '5xxErrorRate',
            Namespace: 'AWS/CloudFront',
            Statistic: 'Average',
            Dimensions: [{ Name: 'DistributionId', Value: this.config.distributionId }],
            Period: 300, // 5 minutes
            EvaluationPeriods: 2,
            Threshold: this.config.monitoring.errorRateThreshold,
            ComparisonOperator: 'GreaterThanThreshold'
        }));
    }

    private async createOriginLatencyAlarm(): Promise<void> {
        const alarmName = `${this.config.environment}-${this.config.distributionId}-HighOriginLatency`;

        await this.cloudWatchClient.send(new PutMetricAlarmCommand({
            AlarmName: alarmName,
            AlarmDescription: `High origin latency for CloudFront distribution ${this.config.distributionId}`,
            MetricName: 'OriginLatency',
            Namespace: 'AWS/CloudFront',
            Statistic: 'Average',
            Dimensions: [{ Name: 'DistributionId', Value: this.config.distributionId }],
            Period: 300, // 5 minutes
            EvaluationPeriods: 2,
            Threshold: this.config.monitoring.originLatencyThreshold,
            ComparisonOperator: 'GreaterThanThreshold'
        }));
    }

    private async createBytesDownloadedAlarm(): Promise<void> {
        const alarmName = `${this.config.environment}-${this.config.distributionId}-HighBandwidthUsage`;

        // Set threshold based on environment (GB per hour)
        const thresholds = {
            dev: 1000000000,    // 1GB
            staging: 5000000000, // 5GB
            prod: 20000000000   // 20GB
        };

        await this.cloudWatchClient.send(new PutMetricAlarmCommand({
            AlarmName: alarmName,
            AlarmDescription: `High bandwidth usage for CloudFront distribution ${this.config.distributionId}`,
            MetricName: 'BytesDownloaded',
            Namespace: 'AWS/CloudFront',
            Statistic: 'Sum',
            Dimensions: [{ Name: 'DistributionId', Value: this.config.distributionId }],
            Period: 3600, // 1 hour
            EvaluationPeriods: 1,
            Threshold: thresholds[this.config.environment],
            ComparisonOperator: 'GreaterThanThreshold'
        }));
    }

    private async getMetricValue(
        metricName: string,
        startTime: Date,
        endTime: Date
    ): Promise<number | null> {
        try {
            const response = await this.cloudWatchClient.send(
                new GetMetricStatisticsCommand({
                    Namespace: 'AWS/CloudFront',
                    MetricName: metricName,
                    Dimensions: [{ Name: 'DistributionId', Value: this.config.distributionId }],
                    StartTime: startTime,
                    EndTime: endTime,
                    Period: 3600, // 1 hour
                    Statistics: ['Average']
                })
            );

            const datapoints = response.Datapoints || [];
            if (datapoints.length === 0) return null;

            // Return the most recent datapoint
            const sortedDatapoints = datapoints.sort((a, b) =>
                (b.Timestamp?.getTime() || 0) - (a.Timestamp?.getTime() || 0)
            );

            return sortedDatapoints[0].Average || null;
        } catch (error) {
            console.warn(`Failed to get metric ${metricName}:`, error);
            return null;
        }
    }
}