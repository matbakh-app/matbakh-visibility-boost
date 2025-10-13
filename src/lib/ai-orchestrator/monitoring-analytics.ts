/**
 * PR-5: Monitoring & Analytics
 * 
 * Implements:
 * - Real-time performance monitoring with CloudWatch
 * - Advanced analytics and insights generation
 * - A/B testing framework with statistical significance
 * - Automated alerting and incident response
 */

import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';
import { CloudWatchEvidentlyClient, CreateExperimentCommand, EvaluateFeatureCommand } from '@aws-sdk/client-cloudwatch-evidently';
import { PublishCommand, SNSClient } from '@aws-sdk/client-sns';
import { randomUUID } from 'crypto';
import { AIRequest, AIResponse, Provider } from './types';

export interface MetricPoint {
    timestamp: Date;
    value: number;
    dimensions?: Record<string, string>;
}

export interface PerformanceAlert {
    id: string;
    type: 'latency' | 'error_rate' | 'cost' | 'availability';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    threshold: number;
    currentValue: number;
    provider?: Provider;
    timestamp: Date;
}

export interface ExperimentResult {
    experimentId: string;
    variant: string;
    metrics: Record<string, number>;
    sampleSize: number;
    confidence: number;
    significance: number;
    winner?: string;
}

export interface AnalyticsInsight {
    type: 'performance' | 'cost' | 'usage' | 'quality';
    title: string;
    description: string;
    impact: 'low' | 'medium' | 'high';
    recommendation: string;
    data: any;
    confidence: number;
}

/**
 * Statistical Analysis Utilities
 */
class StatisticalAnalyzer {
    /**
     * Calculate statistical significance using Welch's t-test
     */
    calculateSignificance(
        controlMean: number,
        controlStdDev: number,
        controlSize: number,
        treatmentMean: number,
        treatmentStdDev: number,
        treatmentSize: number
    ): { pValue: number; significant: boolean; confidenceLevel: number } {
        // Welch's t-test for unequal variances
        const pooledStdError = Math.sqrt(
            (controlStdDev ** 2) / controlSize + (treatmentStdDev ** 2) / treatmentSize
        );

        const tStatistic = (treatmentMean - controlMean) / pooledStdError;

        // Degrees of freedom (Welch-Satterthwaite equation)
        const df = Math.pow(
            (controlStdDev ** 2) / controlSize + (treatmentStdDev ** 2) / treatmentSize,
            2
        ) / (
                Math.pow((controlStdDev ** 2) / controlSize, 2) / (controlSize - 1) +
                Math.pow((treatmentStdDev ** 2) / treatmentSize, 2) / (treatmentSize - 1)
            );

        // Approximate p-value calculation (simplified)
        const pValue = this.tDistributionPValue(Math.abs(tStatistic), df);
        const significant = pValue < 0.05;
        const confidenceLevel = (1 - pValue) * 100;

        return { pValue, significant, confidenceLevel };
    }

    /**
     * Simplified t-distribution p-value calculation
     */
    private tDistributionPValue(t: number, df: number): number {
        // Simplified approximation - in production, use a proper statistical library
        if (df > 30) {
            // Use normal approximation for large df
            return 2 * (1 - this.normalCDF(t));
        }

        // Rough approximation for small df
        const factor = Math.sqrt(df / (df + t * t));
        return 2 * (1 - factor);
    }

    /**
     * Normal cumulative distribution function
     */
    private normalCDF(x: number): number {
        return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
    }

    /**
     * Error function approximation
     */
    private erf(x: number): number {
        // Abramowitz and Stegun approximation
        const a1 = 0.254829592;
        const a2 = -0.284496736;
        const a3 = 1.421413741;
        const a4 = -1.453152027;
        const a5 = 1.061405429;
        const p = 0.3275911;

        const sign = x >= 0 ? 1 : -1;
        x = Math.abs(x);

        const t = 1.0 / (1.0 + p * x);
        const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

        return sign * y;
    }

    /**
     * Calculate effect size (Cohen's d)
     */
    calculateEffectSize(
        controlMean: number,
        controlStdDev: number,
        treatmentMean: number,
        treatmentStdDev: number
    ): number {
        const pooledStdDev = Math.sqrt((controlStdDev ** 2 + treatmentStdDev ** 2) / 2);
        return (treatmentMean - controlMean) / pooledStdDev;
    }

    /**
     * Detect anomalies using z-score
     */
    detectAnomalies(values: number[], threshold: number = 3): number[] {
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const stdDev = Math.sqrt(
            values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
        );

        return values.filter(value => Math.abs((value - mean) / stdDev) > threshold);
    }
}

/**
 * A/B Testing Framework
 */
class ABTestingFramework {
    private experiments: Map<string, ExperimentResult> = new Map();
    private evidentlyClient: CloudWatchEvidentlyClient;
    private statisticalAnalyzer: StatisticalAnalyzer;

    constructor(region: string = 'eu-central-1') {
        this.evidentlyClient = new CloudWatchEvidentlyClient({ region });
        this.statisticalAnalyzer = new StatisticalAnalyzer();
    }

    /**
     * Create new A/B test experiment
     */
    async createExperiment(
        name: string,
        description: string,
        variants: string[],
        trafficSplit: Record<string, number>,
        metrics: string[]
    ): Promise<string> {
        const experimentId = randomUUID();

        try {
            // Create experiment in CloudWatch Evidently
            await this.evidentlyClient.send(new CreateExperimentCommand({
                name,
                description,
                project: 'ai-orchestrator',
                treatments: variants.map(variant => ({
                    name: variant,
                    description: `Treatment variant: ${variant}`,
                    feature: 'ai-model-routing'
                })),
                metricGoals: metrics.map(metric => ({
                    metricDefinition: {
                        name: metric,
                        unitLabel: metric === 'latency' ? 'Milliseconds' : 'Count',
                        valueKey: metric
                    },
                    desiredChange: metric === 'latency' ? 'DECREASE' : 'INCREASE'
                })),
                randomizationSalt: experimentId
            }));

            // Initialize experiment tracking
            this.experiments.set(experimentId, {
                experimentId,
                variant: 'control',
                metrics: {},
                sampleSize: 0,
                confidence: 0,
                significance: 0
            });

            return experimentId;
        } catch (error) {
            console.error('Failed to create experiment:', error);
            throw error;
        }
    }

    /**
     * Get variant for user/request
     */
    async getVariant(experimentId: string, userId: string): Promise<string> {
        try {
            const response = await this.evidentlyClient.send(new EvaluateFeatureCommand({
                project: 'ai-orchestrator',
                feature: 'ai-model-routing',
                entityId: userId
            }));

            return response.variation || 'control';
        } catch (error) {
            console.warn('Failed to get variant, using control:', error);
            return 'control';
        }
    }

    /**
     * Record experiment result
     */
    recordResult(
        experimentId: string,
        variant: string,
        metrics: Record<string, number>
    ): void {
        const experiment = this.experiments.get(experimentId);
        if (!experiment) return;

        // Update experiment metrics
        for (const [metric, value] of Object.entries(metrics)) {
            if (!experiment.metrics[metric]) {
                experiment.metrics[metric] = 0;
            }
            experiment.metrics[metric] += value;
        }

        experiment.sampleSize++;
        this.experiments.set(experimentId, experiment);
    }

    /**
     * Analyze experiment results
     */
    analyzeExperiment(experimentId: string): ExperimentResult | null {
        const experiment = this.experiments.get(experimentId);
        if (!experiment || experiment.sampleSize < 100) return null;

        // For simplicity, assume we're comparing two variants
        // In production, this would handle multiple variants
        const controlMetrics = { latency: 1500, successRate: 0.95 }; // Mock control data
        const treatmentMetrics = experiment.metrics;

        if (treatmentMetrics.latency && treatmentMetrics.successRate) {
            const latencySignificance = this.statisticalAnalyzer.calculateSignificance(
                controlMetrics.latency, 200, 100, // control: mean, stddev, size
                treatmentMetrics.latency, 180, experiment.sampleSize // treatment
            );

            const successSignificance = this.statisticalAnalyzer.calculateSignificance(
                controlMetrics.successRate, 0.05, 100,
                treatmentMetrics.successRate, 0.04, experiment.sampleSize
            );

            experiment.confidence = Math.min(latencySignificance.confidenceLevel, successSignificance.confidenceLevel);
            experiment.significance = Math.max(latencySignificance.pValue, successSignificance.pValue);

            // Determine winner
            if (latencySignificance.significant && successSignificance.significant) {
                experiment.winner = treatmentMetrics.latency < controlMetrics.latency ? 'treatment' : 'control';
            }
        }

        return experiment;
    }

    /**
     * Get all active experiments
     */
    getActiveExperiments(): ExperimentResult[] {
        return Array.from(this.experiments.values());
    }
}

/**
 * Monitoring & Analytics Service
 */
export class MonitoringAnalytics {
    private cloudWatch: CloudWatchClient;
    private sns: SNSClient;
    private abTesting: ABTestingFramework;
    private statisticalAnalyzer: StatisticalAnalyzer;
    private metrics: Map<string, MetricPoint[]> = new Map();
    private alerts: PerformanceAlert[] = [];

    constructor(
        private readonly alertTopicArn: string,
        private readonly region: string = 'eu-central-1'
    ) {
        this.cloudWatch = new CloudWatchClient({ region });
        this.sns = new SNSClient({ region });
        this.abTesting = new ABTestingFramework(region);
        this.statisticalAnalyzer = new StatisticalAnalyzer();
    }

    /**
     * Record performance metrics
     */
    async recordMetrics(
        request: AIRequest,
        response: AIResponse,
        provider: Provider
    ): Promise<void> {
        const timestamp = new Date();
        const dimensions = {
            Provider: provider,
            Model: request.model || 'default',
            Domain: request.domain || 'general'
        };

        const metricData = [
            {
                MetricName: 'Latency',
                Value: response.processingTime || 0,
                Unit: 'Milliseconds',
                Dimensions: Object.entries(dimensions).map(([Name, Value]) => ({ Name, Value })),
                Timestamp: timestamp
            },
            {
                MetricName: 'TokensUsed',
                Value: (response.inputTokens || 0) + (response.outputTokens || 0),
                Unit: 'Count',
                Dimensions: Object.entries(dimensions).map(([Name, Value]) => ({ Name, Value })),
                Timestamp: timestamp
            },
            {
                MetricName: 'Cost',
                Value: response.cost || 0,
                Unit: 'None',
                Dimensions: Object.entries(dimensions).map(([Name, Value]) => ({ Name, Value })),
                Timestamp: timestamp
            },
            {
                MetricName: 'Success',
                Value: response.error ? 0 : 1,
                Unit: 'Count',
                Dimensions: Object.entries(dimensions).map(([Name, Value]) => ({ Name, Value })),
                Timestamp: timestamp
            }
        ];

        // Store metrics locally for analysis
        for (const metric of metricData) {
            const key = `${metric.MetricName}_${provider}`;
            if (!this.metrics.has(key)) {
                this.metrics.set(key, []);
            }
            this.metrics.get(key)!.push({
                timestamp,
                value: metric.Value,
                dimensions
            });
        }

        // Send to CloudWatch
        try {
            await this.cloudWatch.send(new PutMetricDataCommand({
                Namespace: 'AI/Orchestrator',
                MetricData: metricData
            }));
        } catch (error) {
            console.error('Failed to send metrics to CloudWatch:', error);
        }

        // Check for alerts
        await this.checkAlerts(metricData, provider);
    }

    /**
     * Check for performance alerts
     */
    private async checkAlerts(
        metricData: any[],
        provider: Provider
    ): Promise<void> {
        const alertThresholds = {
            latency: { medium: 2000, high: 5000, critical: 10000 },
            error_rate: { medium: 0.05, high: 0.1, critical: 0.2 },
            cost: { medium: 1.0, high: 5.0, critical: 10.0 }
        };

        for (const metric of metricData) {
            let alertType: PerformanceAlert['type'] | null = null;
            let threshold = 0;

            if (metric.MetricName === 'Latency' && metric.Value > alertThresholds.latency.medium) {
                alertType = 'latency';
                threshold = alertThresholds.latency.medium;
            } else if (metric.MetricName === 'Success' && metric.Value === 0) {
                alertType = 'error_rate';
                threshold = alertThresholds.error_rate.medium;
            } else if (metric.MetricName === 'Cost' && metric.Value > alertThresholds.cost.medium) {
                alertType = 'cost';
                threshold = alertThresholds.cost.medium;
            }

            if (alertType) {
                const severity = this.determineSeverity(metric.Value, alertType, alertThresholds);
                await this.sendAlert({
                    id: randomUUID(),
                    type: alertType,
                    severity,
                    message: `${alertType} threshold exceeded for ${provider}`,
                    threshold,
                    currentValue: metric.Value,
                    provider,
                    timestamp: new Date()
                });
            }
        }
    }

    /**
     * Determine alert severity
     */
    private determineSeverity(
        value: number,
        type: PerformanceAlert['type'],
        thresholds: any
    ): PerformanceAlert['severity'] {
        const typeThresholds = thresholds[type];

        if (value >= typeThresholds.critical) return 'critical';
        if (value >= typeThresholds.high) return 'high';
        if (value >= typeThresholds.medium) return 'medium';
        return 'low';
    }

    /**
     * Send performance alert
     */
    private async sendAlert(alert: PerformanceAlert): Promise<void> {
        this.alerts.push(alert);

        // Send SNS notification for high/critical alerts
        if (alert.severity === 'high' || alert.severity === 'critical') {
            try {
                await this.sns.send(new PublishCommand({
                    TopicArn: this.alertTopicArn,
                    Subject: `AI Orchestrator Alert: ${alert.type} (${alert.severity})`,
                    Message: JSON.stringify(alert, null, 2)
                }));
            } catch (error) {
                console.error('Failed to send alert notification:', error);
            }
        }

        console.warn(`Performance Alert [${alert.severity.toUpperCase()}]:`, alert.message);
    }

    /**
     * Generate analytics insights
     */
    async generateInsights(): Promise<AnalyticsInsight[]> {
        const insights: AnalyticsInsight[] = [];

        // Analyze latency trends
        const latencyInsight = await this.analyzeLatencyTrends();
        if (latencyInsight) insights.push(latencyInsight);

        // Analyze cost efficiency
        const costInsight = await this.analyzeCostEfficiency();
        if (costInsight) insights.push(costInsight);

        // Analyze provider performance
        const providerInsight = await this.analyzeProviderPerformance();
        if (providerInsight) insights.push(providerInsight);

        // Analyze usage patterns
        const usageInsight = await this.analyzeUsagePatterns();
        if (usageInsight) insights.push(usageInsight);

        return insights;
    }

    /**
     * Analyze latency trends
     */
    private async analyzeLatencyTrends(): Promise<AnalyticsInsight | null> {
        const latencyMetrics = Array.from(this.metrics.entries())
            .filter(([key]) => key.startsWith('Latency_'))
            .flatMap(([, points]) => points.map(p => p.value));

        if (latencyMetrics.length < 10) return null;

        const recentMetrics = latencyMetrics.slice(-50);
        const olderMetrics = latencyMetrics.slice(-100, -50);

        if (olderMetrics.length === 0) return null;

        const recentAvg = recentMetrics.reduce((sum, val) => sum + val, 0) / recentMetrics.length;
        const olderAvg = olderMetrics.reduce((sum, val) => sum + val, 0) / olderMetrics.length;
        const trend = ((recentAvg - olderAvg) / olderAvg) * 100;

        if (Math.abs(trend) < 5) return null; // No significant trend

        return {
            type: 'performance',
            title: trend > 0 ? 'Latency Increasing' : 'Latency Improving',
            description: `Average latency has ${trend > 0 ? 'increased' : 'decreased'} by ${Math.abs(trend).toFixed(1)}% recently`,
            impact: Math.abs(trend) > 20 ? 'high' : Math.abs(trend) > 10 ? 'medium' : 'low',
            recommendation: trend > 0
                ? 'Consider optimizing prompts or switching to faster models'
                : 'Current optimizations are working well',
            data: { trend, recentAvg, olderAvg },
            confidence: Math.min(0.9, recentMetrics.length / 50)
        };
    }

    /**
     * Analyze cost efficiency
     */
    private async analyzeCostEfficiency(): Promise<AnalyticsInsight | null> {
        const costMetrics = Array.from(this.metrics.entries())
            .filter(([key]) => key.startsWith('Cost_'))
            .flatMap(([, points]) => points.map(p => p.value));

        const tokenMetrics = Array.from(this.metrics.entries())
            .filter(([key]) => key.startsWith('TokensUsed_'))
            .flatMap(([, points]) => points.map(p => p.value));

        if (costMetrics.length < 10 || tokenMetrics.length < 10) return null;

        const avgCostPerToken = costMetrics.reduce((sum, val) => sum + val, 0) /
            tokenMetrics.reduce((sum, val) => sum + val, 0);

        const providerCosts = {
            bedrock: 0.003,
            google: 0.00125,
            meta: 0.0008
        };

        const bestCost = Math.min(...Object.values(providerCosts));
        const efficiency = bestCost / avgCostPerToken;

        return {
            type: 'cost',
            title: efficiency > 0.8 ? 'Cost Efficient' : 'Cost Optimization Opportunity',
            description: `Current cost per token is ${efficiency > 1 ? 'better than' : 'higher than'} optimal by ${Math.abs((1 - efficiency) * 100).toFixed(1)}%`,
            impact: efficiency < 0.6 ? 'high' : efficiency < 0.8 ? 'medium' : 'low',
            recommendation: efficiency < 0.8
                ? 'Consider using more cost-effective providers or optimizing token usage'
                : 'Cost efficiency is good',
            data: { avgCostPerToken, efficiency, bestCost },
            confidence: 0.8
        };
    }

    /**
     * Analyze provider performance
     */
    private async analyzeProviderPerformance(): Promise<AnalyticsInsight | null> {
        const providerMetrics: Record<string, { latency: number[]; success: number[]; cost: number[] }> = {};

        // Group metrics by provider
        for (const [key, points] of this.metrics.entries()) {
            const [metricType, provider] = key.split('_');
            if (!providerMetrics[provider]) {
                providerMetrics[provider] = { latency: [], success: [], cost: [] };
            }

            if (metricType === 'Latency') {
                providerMetrics[provider].latency = points.map(p => p.value);
            } else if (metricType === 'Success') {
                providerMetrics[provider].success = points.map(p => p.value);
            } else if (metricType === 'Cost') {
                providerMetrics[provider].cost = points.map(p => p.value);
            }
        }

        const providers = Object.keys(providerMetrics);
        if (providers.length < 2) return null;

        // Calculate performance scores
        const scores = providers.map(provider => {
            const metrics = providerMetrics[provider];
            const avgLatency = metrics.latency.reduce((sum, val) => sum + val, 0) / metrics.latency.length || 0;
            const successRate = metrics.success.reduce((sum, val) => sum + val, 0) / metrics.success.length || 0;
            const avgCost = metrics.cost.reduce((sum, val) => sum + val, 0) / metrics.cost.length || 0;

            // Composite score (lower latency and cost, higher success rate is better)
            const score = (successRate * 100) - (avgLatency / 100) - (avgCost * 1000);

            return { provider, score, avgLatency, successRate, avgCost };
        });

        scores.sort((a, b) => b.score - a.score);
        const best = scores[0];
        const worst = scores[scores.length - 1];

        return {
            type: 'performance',
            title: 'Provider Performance Comparison',
            description: `${best.provider} is performing best with a score of ${best.score.toFixed(1)}, while ${worst.provider} has the lowest score of ${worst.score.toFixed(1)}`,
            impact: (best.score - worst.score) > 50 ? 'high' : 'medium',
            recommendation: `Consider routing more traffic to ${best.provider} for better performance`,
            data: { rankings: scores },
            confidence: 0.85
        };
    }

    /**
     * Analyze usage patterns
     */
    private async analyzeUsagePatterns(): Promise<AnalyticsInsight | null> {
        const allMetrics = Array.from(this.metrics.values()).flat();
        if (allMetrics.length < 50) return null;

        // Analyze hourly patterns
        const hourlyUsage: Record<number, number> = {};
        for (const point of allMetrics) {
            const hour = point.timestamp.getHours();
            hourlyUsage[hour] = (hourlyUsage[hour] || 0) + 1;
        }

        const hours = Object.keys(hourlyUsage).map(Number);
        const usageCounts = Object.values(hourlyUsage);
        const avgUsage = usageCounts.reduce((sum, val) => sum + val, 0) / usageCounts.length;

        // Find peak hours
        const peakHours = hours.filter(hour => hourlyUsage[hour] > avgUsage * 1.5);
        const lowHours = hours.filter(hour => hourlyUsage[hour] < avgUsage * 0.5);

        if (peakHours.length === 0 && lowHours.length === 0) return null;

        return {
            type: 'usage',
            title: 'Usage Pattern Analysis',
            description: `Peak usage hours: ${peakHours.join(', ')}. Low usage hours: ${lowHours.join(', ')}`,
            impact: 'medium',
            recommendation: 'Consider implementing dynamic scaling or cost optimization during low usage periods',
            data: { hourlyUsage, peakHours, lowHours, avgUsage },
            confidence: 0.75
        };
    }

    /**
     * Get recent alerts
     */
    getRecentAlerts(hours: number = 24): PerformanceAlert[] {
        const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
        return this.alerts.filter(alert => alert.timestamp > cutoff);
    }

    /**
     * Get A/B testing framework
     */
    getABTesting(): ABTestingFramework {
        return this.abTesting;
    }

    /**
     * Get performance summary
     */
    getPerformanceSummary(): {
        totalRequests: number;
        avgLatency: number;
        successRate: number;
        totalCost: number;
        alertCount: number;
    } {
        const allMetrics = Array.from(this.metrics.values()).flat();
        const latencyMetrics = this.metrics.get('Latency_bedrock') || [];
        const successMetrics = Array.from(this.metrics.entries())
            .filter(([key]) => key.startsWith('Success_'))
            .flatMap(([, points]) => points.map(p => p.value));
        const costMetrics = Array.from(this.metrics.entries())
            .filter(([key]) => key.startsWith('Cost_'))
            .flatMap(([, points]) => points.map(p => p.value));

        return {
            totalRequests: allMetrics.length,
            avgLatency: latencyMetrics.reduce((sum, p) => sum + p.value, 0) / latencyMetrics.length || 0,
            successRate: successMetrics.reduce((sum, val) => sum + val, 0) / successMetrics.length || 0,
            totalCost: costMetrics.reduce((sum, val) => sum + val, 0),
            alertCount: this.getRecentAlerts().length
        };
    }

    /**
     * Clear old metrics and alerts
     */
    cleanup(olderThanHours: number = 168): void { // Default 7 days
        const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);

        // Clean up metrics
        for (const [key, points] of this.metrics.entries()) {
            const filteredPoints = points.filter(point => point.timestamp > cutoff);
            this.metrics.set(key, filteredPoints);
        }

        // Clean up alerts
        this.alerts = this.alerts.filter(alert => alert.timestamp > cutoff);
    }
}