/**
 * Dark Deployment Manager
 * 
 * Implements:
 * - Deploy now, run later strategy with feature flags
 * - Shadow mode for parallel request processing
 * - Canary deployment with automatic rollback
 * - Activation ladder (shadow -> canary -> active)
 */

import { randomUUID } from 'crypto';
import { MonitoringAnalytics } from './monitoring-analytics';
import { MultiProviderIntegration } from './multi-provider-integration';
import { AiRequest, AiResponse, Provider } from './types';\nimport { AIFeatureFlagsService } from './ai-feature-flags';

export interface DeploymentMode {
    mode: 'dark' | 'shadow' | 'canary' | 'active';
    trafficPercentage: number;
    rollbackThreshold: {
        errorRate: number;
        latencyP95: number;
        costIncrease: number;
    };
}

export interface ShadowResult {
    primary: AiResponse;
    shadow?: AiResponse;
    comparison?: {
        latencyDiff: number;
        costDiff: number;
        contentSimilarity: number;
        errors: string[];
    };
}

export interface CanaryMetrics {
    trafficPercentage: number;
    errorRate: number;
    latencyP95: number;
    costPerRequest: number;
    userSatisfaction: number;
    rollbackTriggered: boolean;
}

/**
 * Dark Deployment Manager
 */
export class DarkDeploymentManager {
    private featureFlags: AIFeatureFlagsService;
    private multiProvider: MultiProviderIntegration;
    private monitoring: MonitoringAnalytics;
    private shadowRequests: Map<string, AIRequest> = new Map();
    private canaryMetrics: CanaryMetrics[] = [];

    constructor(
        multiProvider: MultiProviderIntegration,
        monitoring: MonitoringAnalytics,
        region: string = 'eu-central-1'
    ) {
        this.featureFlags = new AIFeatureFlagsService(region);
        this.multiProvider = multiProvider;
        this.monitoring = monitoring;
    }

    /**
     * Process request based on current deployment mode
     */
    async processRequest(request: AiRequest): Promise<AiResponse | ShadowResult> {
        const mode = await this.getCurrentDeploymentMode();

        switch (mode.mode) {
            case 'dark':
                return await this.processDarkMode(request);

            case 'shadow':
                return await this.processShadowMode(request);

            case 'canary':
                return await this.processCanaryMode(request, mode.trafficPercentage);

            case 'active':
                return await this.processActiveMode(request);

            default:
                throw new Error(`Unknown deployment mode: ${mode.mode}`);
        }
    }

    /**
     * Dark mode: Infrastructure deployed but all providers disabled
     */
    private async processDarkMode(request: AiRequest): Promise<AiResponse> {
        // In dark mode, return mock response or fallback to existing system
        console.log('AI Orchestrator in dark mode - returning fallback response');

        return {
            text: 'AI Orchestrator is currently in dark deployment mode. Please try again later.',
            provider: 'bedrock' as Provider,
            modelId: 'fallback',
            requestId: randomUUID(),
            latencyMs: 0,
            costEuro: 0,
            success: true
        };
    }

    /**
     * Shadow mode: Run parallel requests but only return primary
     */
    private async processShadowMode(request: AiRequest): Promise<ShadowResult> {
        const requestId = randomUUID();
        console.log(`Processing shadow mode request ${requestId}`);

        // Primary request (existing system)
        const primaryPromise = this.processPrimaryRequest(request);

        // Shadow request (new AI orchestrator) - run in parallel
        const shadowPromise = this.processShadowRequest(request);

        try {
            const [primary, shadow] = await Promise.allSettled([primaryPromise, shadowPromise]);

            const primaryResult = primary.status === 'fulfilled' ? primary.value : null;
            const shadowResult = shadow.status === 'fulfilled' ? shadow.value : null;

            // Compare results if both succeeded
            let comparison;
            if (primaryResult && shadowResult) {
                comparison = await this.compareResponses(primaryResult, shadowResult);
            }

            // Log shadow metrics for analysis
            await this.logShadowMetrics(requestId, primaryResult, shadowResult, comparison);

            return {
                primary: primaryResult || this.createErrorResponse('Primary request failed'),
                shadow: shadowResult || undefined,
                comparison
            };

        } catch (error) {
            console.error('Shadow mode processing failed:', error);

            // Always return primary result in shadow mode
            const fallbackPrimary = await this.processPrimaryRequest(request);
            return {
                primary: fallbackPrimary
            };
        }
    }

    /**
     * Canary mode: Route percentage of traffic to new system
     */
    private async processCanaryMode(request: AiRequest, trafficPercentage: number): Promise<AiResponse> {
        const useCanary = Math.random() * 100 < trafficPercentage;
        const requestId = randomUUID();

        if (useCanary) {
            console.log(`Processing canary request ${requestId} (${trafficPercentage}% traffic)`);

            try {
                const response = await this.multiProvider.routeRequest(request);

                // Track canary metrics
                await this.trackCanaryMetrics(response, trafficPercentage);

                // Check if rollback is needed
                await this.checkCanaryRollback();

                return response;

            } catch (error) {
                console.error('Canary request failed, falling back to primary:', error);

                // Track failure
                await this.trackCanaryFailure(trafficPercentage);

                // Fallback to primary
                return await this.processPrimaryRequest(request);
            }
        } else {
            // Route to primary system
            return await this.processPrimaryRequest(request);
        }
    }

    /**
     * Active mode: All traffic through new system
     */
    private async processActiveMode(request: AiRequest): Promise<AiResponse> {
        console.log('Processing active mode request');

        try {
            const response = await this.multiProvider.routeRequest(request);
            return response;
        } catch (error) {
            console.error('Active mode request failed:', error);

            // In active mode, we still try to fallback to primary if possible
            const fallbackEnabled = await this.featureFlags.getFlag('ai.fallback.enabled', true);

            if (fallbackEnabled) {
                console.log('Falling back to primary system');
                return await this.processPrimaryRequest(request);
            } else {
                throw error;
            }
        }
    }

    /**
     * Get current deployment mode from feature flags
     */
    private async getCurrentDeploymentMode(): Promise<DeploymentMode> {
        const flags = await this.featureFlags.getFlags([
            'ai.egress.enabled',
            'ai.provider.bedrock.enabled',
            'ai.provider.google.enabled',
            'ai.provider.meta.enabled',
            'ai.bandit.mode'
        ]);

        const banditMode = flags['ai.bandit.mode'] || 'off';
        const anyProviderEnabled = flags['ai.provider.bedrock.enabled'] ||
            flags['ai.provider.google.enabled'] ||
            flags['ai.provider.meta.enabled'];

        // Determine mode based on flags
        let mode: DeploymentMode['mode'];
        let trafficPercentage = 0;

        if (!flags['ai.egress.enabled'] || !anyProviderEnabled) {
            mode = 'dark';
        } else if (banditMode === 'shadow') {
            mode = 'shadow';
        } else if (banditMode === 'canary') {
            mode = 'canary';
            trafficPercentage = 5; // Start with 5% traffic
        } else if (banditMode === 'active') {
            mode = 'active';
            trafficPercentage = 100;
        } else {
            mode = 'dark';
        }

        return {
            mode,
            trafficPercentage,
            rollbackThreshold: {
                errorRate: 0.05, // 5% error rate
                latencyP95: 5000, // 5 seconds
                costIncrease: 2.0 // 2x cost increase
            }
        };
    }

    /**
     * Process primary request (existing system)
     */
    private async processPrimaryRequest(request: AiRequest): Promise<AiResponse> {
        // This would integrate with the existing system
        // For now, return a mock response
        return {
            text: `Primary system response for: ${request.prompt.substring(0, 50)}...`,
            provider: 'bedrock' as Provider,
            modelId: 'primary-system',
            requestId: randomUUID(),
            latencyMs: 800,
            costEuro: 0.01,
            success: true
        };
    }

    /**
     * Process shadow request (new AI orchestrator)
     */
    private async processShadowRequest(request: AiRequest): Promise<AiResponse> {
        // Check if shadow mode is enabled
        const shadowEnabled = await this.featureFlags.getFlag('ai.bandit.mode') === 'shadow';
        if (!shadowEnabled) {
            throw new Error('Shadow mode not enabled');
        }

        // Process through AI orchestrator
        return await this.multiProvider.routeRequest(request);
    }

    /**
     * Compare primary and shadow responses
     */
    private async compareResponses(primary: AiResponse, shadow: AiResponse): Promise<{
        latencyDiff: number;
        costDiff: number;
        contentSimilarity: number;
        errors: string[];
    }> {
        const errors: string[] = [];

        // Compare latency
        const latencyDiff = (shadow.latencyMs || 0) - (primary.latencyMs || 0);

        // Compare cost
        const costDiff = (shadow.costEuro || 0) - (primary.costEuro || 0);

        // Compare content similarity (simple word overlap)
        const contentSimilarity = this.calculateContentSimilarity(primary.text || '', shadow.text || '');

        // Check for significant differences
        if (Math.abs(latencyDiff) > 2000) {
            errors.push(`Significant latency difference: ${latencyDiff}ms`);
        }

        if (costDiff > 0.05) {
            errors.push(`Significant cost increase: $${costDiff.toFixed(4)}`);
        }

        if (contentSimilarity < 0.7) {
            errors.push(`Low content similarity: ${(contentSimilarity * 100).toFixed(1)}%`);
        }

        return {
            latencyDiff,
            costDiff,
            contentSimilarity,
            errors
        };
    }

    /**
     * Calculate content similarity using simple word overlap
     */
    private calculateContentSimilarity(content1: string, content2: string): number {
        const words1 = new Set(content1.toLowerCase().split(/\s+/));
        const words2 = new Set(content2.toLowerCase().split(/\s+/));

        const intersection = new Set([...words1].filter(word => words2.has(word)));
        const union = new Set([...words1, ...words2]);

        return union.size > 0 ? intersection.size / union.size : 0;
    }

    /**
     * Log shadow metrics for analysis
     */
    private async logShadowMetrics(
        requestId: string,
        primary: AiResponse | null,
        shadow: AiResponse | null,
        comparison?: any
    ): Promise<void> {
        const logData = {
            requestId,
            timestamp: new Date().toISOString(),
            mode: 'shadow',
            primary: primary ? {
                latencyMs: primary.latencyMs,
                costEuro: primary.costEuro,
                success: primary.success
            } : null,
            shadow: shadow ? {
                latencyMs: shadow.latencyMs,
                costEuro: shadow.costEuro,
                success: shadow.success,
                provider: shadow.provider
            } : null,
            comparison
        };

        console.log('Shadow metrics:', JSON.stringify(logData));

        // Send to monitoring system
        if (this.monitoring) {
            // This would integrate with the monitoring system
            // For now, just log
        }
    }

    /**
     * Track canary metrics
     */
    private async trackCanaryMetrics(response: AiResponse, trafficPercentage: number): Promise<void> {
        const metrics: CanaryMetrics = {
            trafficPercentage,
            errorRate: response.success ? 0 : 1,
            latencyP95: response.latencyMs || 0,
            costPerRequest: response.costEuro || 0,
            userSatisfaction: 1, // Would come from user feedback
            rollbackTriggered: false
        };

        this.canaryMetrics.push(metrics);

        // Keep only recent metrics (last 100)
        if (this.canaryMetrics.length > 100) {
            this.canaryMetrics = this.canaryMetrics.slice(-100);
        }
    }

    /**
     * Track canary failure
     */
    private async trackCanaryFailure(trafficPercentage: number): Promise<void> {
        const metrics: CanaryMetrics = {
            trafficPercentage,
            errorRate: 1, // 100% error rate for this request
            latencyP95: 0,
            costPerRequest: 0,
            userSatisfaction: 0,
            rollbackTriggered: false
        };

        this.canaryMetrics.push(metrics);
    }

    /**
     * Check if canary should be rolled back
     */
    private async checkCanaryRollback(): Promise<void> {
        if (this.canaryMetrics.length < 10) return; // Need minimum sample size

        const recentMetrics = this.canaryMetrics.slice(-20); // Last 20 requests
        const avgErrorRate = recentMetrics.reduce((sum, m) => sum + m.errorRate, 0) / recentMetrics.length;
        const avgLatency = recentMetrics.reduce((sum, m) => sum + m.latencyP95, 0) / recentMetrics.length;
        const avgCost = recentMetrics.reduce((sum, m) => sum + m.costPerRequest, 0) / recentMetrics.length;

        const mode = await this.getCurrentDeploymentMode();
        const threshold = mode.rollbackThreshold;

        // Check rollback conditions
        const shouldRollback =
            avgErrorRate > threshold.errorRate ||
            avgLatency > threshold.latencyP95 ||
            avgCost > threshold.costIncrease;

        if (shouldRollback) {
            console.warn('Canary rollback triggered due to performance degradation');
            await this.triggerCanaryRollback(avgErrorRate, avgLatency, avgCost);
        }
    }

    /**
     * Trigger canary rollback
     */
    private async triggerCanaryRollback(errorRate: number, latency: number, cost: number): Promise<void> {
        console.log('Executing canary rollback...');

        try {
            // Set bandit mode back to shadow or off
            await this.featureFlags.setFlag('ai.bandit.mode', 'shadow');

            // Mark rollback in metrics
            this.canaryMetrics.forEach(metric => {
                metric.rollbackTriggered = true;
            });

            // Send alert
            console.error(`Canary rollback executed - Error Rate: ${errorRate}, Latency: ${latency}ms, Cost: $${cost}`);

        } catch (error) {
            console.error('Failed to execute canary rollback:', error);
        }
    }

    /**
     * Create error response
     */
    private createErrorResponse(message: string): AiResponse {
        return {
            text: '',
            provider: 'bedrock' as Provider,
            modelId: 'error',
            requestId: randomUUID(),
            latencyMs: 0,
            costEuro: 0,
            success: false,
            error: message
        };
    }



    /**
     * Get deployment status
     */
    async getDeploymentStatus(): Promise<{
        mode: DeploymentMode;
        flags: Record<string, any>;
        metrics: {
            shadowRequests: number;
            canaryMetrics: CanaryMetrics[];
            rollbacksTriggered: number;
        };
    }> {
        const mode = await this.getCurrentDeploymentMode();
        const flags = await this.featureFlags.getFlags([
            'ai.egress.enabled',
            'ai.provider.bedrock.enabled',
            'ai.provider.google.enabled',
            'ai.provider.meta.enabled',
            'ai.guardrails.mode',
            'ai.bandit.mode'
        ]);

        const rollbacksTriggered = this.canaryMetrics.filter(m => m.rollbackTriggered).length;

        return {
            mode,
            flags,
            metrics: {
                shadowRequests: this.shadowRequests.size,
                canaryMetrics: this.canaryMetrics.slice(-10), // Last 10 metrics
                rollbacksTriggered
            }
        };
    }

    /**
     * Activate next deployment phase
     */
    async activateNextPhase(): Promise<{
        previousMode: string;
        newMode: string;
        success: boolean;
        message: string;
    }> {
        const currentMode = await this.getCurrentDeploymentMode();

        try {
            switch (currentMode.mode) {
                case 'dark':
                    // Activate shadow mode
                    await this.featureFlags.setFlag('ai.egress.enabled', true);
                    await this.featureFlags.setFlag('ai.provider.bedrock.enabled', true);
                    await this.featureFlags.setFlag('ai.bandit.mode', 'shadow');
                    return {
                        previousMode: 'dark',
                        newMode: 'shadow',
                        success: true,
                        message: 'Activated shadow mode - parallel processing enabled'
                    };

                case 'shadow':
                    // Activate canary mode
                    await this.featureFlags.setFlag('ai.bandit.mode', 'canary');
                    return {
                        previousMode: 'shadow',
                        newMode: 'canary',
                        success: true,
                        message: 'Activated canary mode - 5% traffic routing enabled'
                    };

                case 'canary':
                    // Activate full mode
                    await this.featureFlags.setFlag('ai.bandit.mode', 'active');
                    return {
                        previousMode: 'canary',
                        newMode: 'active',
                        success: true,
                        message: 'Activated full mode - 100% traffic routing enabled'
                    };

                case 'active':
                    return {
                        previousMode: 'active',
                        newMode: 'active',
                        success: true,
                        message: 'Already in active mode'
                    };

                default:
                    throw new Error(`Unknown mode: ${currentMode.mode}`);
            }
        } catch (error) {
            return {
                previousMode: currentMode.mode,
                newMode: currentMode.mode,
                success: false,
                message: `Failed to activate next phase: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }

    /**
     * Emergency rollback to dark mode
     */
    async emergencyRollback(reason: string): Promise<void> {
        console.error(`Emergency rollback triggered: ${reason}`);

        try {
            // Disable all providers
            await this.featureFlags.setFlag('ai.provider.bedrock.enabled', false);
            await this.featureFlags.setFlag('ai.provider.google.enabled', false);
            await this.featureFlags.setFlag('ai.provider.meta.enabled', false);

            // Set bandit mode to off
            await this.featureFlags.setFlag('ai.bandit.mode', 'off');

            // Disable egress
            await this.featureFlags.setFlag('ai.egress.enabled', false);

            console.log('Emergency rollback completed - system in dark mode');

        } catch (error) {
            console.error('Emergency rollback failed:', error);
            throw error;
        }
    }

    /**
     * Clear cache and reset state
     */
    clearState(): void {
        this.featureFlags.clearCache();
        this.shadowRequests.clear();
        this.canaryMetrics.length = 0;
    }
}