import { AutoScalingConfigManager } from '@/lib/auto-scaling/auto-scaling-config-manager';
import { AutoScalingOrchestrator } from '@/lib/auto-scaling/auto-scaling-orchestrator';
import { useCallback, useEffect, useState } from 'react';

export interface AutoScalingStatus {
    lambdaTargets: any[];
    elastiCacheTargets: any[];
    alarms: any[];
}

export interface AutoScalingMetrics {
    lambdaMetrics: Array<{
        functionName: string;
        avgDuration: number;
        errorRate: number;
        throttles: number;
        concurrentExecutions: number;
    }>;
    rdsMetrics: Array<{
        dbInstanceIdentifier: string;
        cpuUtilization: number;
        databaseConnections: number;
        freeableMemory: number;
    }>;
    elastiCacheMetrics: Array<{
        replicationGroupId: string;
        cpuUtilization: number;
        memoryUsage: number;
        evictions: number;
    }>;
}

export interface AutoScalingRecommendations {
    lambda: string[];
    rds: string[];
    elastiCache: string[];
    general: string[];
}

export interface CostEstimate {
    lambda: number;
    rds: number;
    elastiCache: number;
    cloudWatch: number;
    total: number;
    softBudget: number;
    burstBudget: number;
}

export const useAutoScaling = (environment: 'dev' | 'staging' | 'prod') => {
    const [status, setStatus] = useState<AutoScalingStatus | null>(null);
    const [metrics, setMetrics] = useState<AutoScalingMetrics | null>(null);
    const [recommendations, setRecommendations] = useState<AutoScalingRecommendations | null>(null);
    const [costEstimate, setCostEstimate] = useState<CostEstimate | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Initialize orchestrator
    const [orchestrator] = useState(() => {
        const config = AutoScalingConfigManager.getAutoScalingConfig(environment);
        return new AutoScalingOrchestrator(config);
    });

    /**
     * Fetch current auto-scaling status
     */
    const fetchStatus = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            const autoScalingStatus = await orchestrator.getAutoScalingStatus();
            setStatus(autoScalingStatus);

            // Simulate metrics (in real implementation, fetch from CloudWatch)
            const mockMetrics = generateMockMetrics(environment);
            setMetrics(mockMetrics);

            // Generate recommendations
            const recs = AutoScalingConfigManager.generateScalingRecommendations(
                environment,
                mockMetrics
            );
            setRecommendations(recs);

            // Calculate cost estimate
            const envConfig = AutoScalingConfigManager.getAllEnvironmentConfigs()[environment];
            const costs = AutoScalingConfigManager.estimateMonthlyCosts(
                environment,
                [], // Lambda functions would be passed here
                [], // RDS instances would be passed here
                []  // ElastiCache clusters would be passed here
            );

            setCostEstimate({
                ...costs,
                softBudget: envConfig.budgetLimits.softBudget,
                burstBudget: envConfig.budgetLimits.burstBudget
            });

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch auto-scaling status');
            console.error('Auto-scaling status fetch error:', err);
        } finally {
            setIsLoading(false);
        }
    }, [orchestrator, environment]);

    /**
     * Configure auto-scaling for a service
     */
    const configureAutoScaling = useCallback(async (
        service: 'lambda' | 'rds' | 'elasticache',
        config: any
    ) => {
        try {
            setIsLoading(true);
            setError(null);

            switch (service) {
                case 'lambda':
                    await orchestrator.configureLambdaAutoScaling(config);
                    break;
                case 'rds':
                    await orchestrator.configureRDSMonitoring(config);
                    break;
                case 'elasticache':
                    await orchestrator.configureElastiCacheAutoScaling(config);
                    break;
                default:
                    throw new Error(`Unknown service: ${service}`);
            }

            // Refresh status after configuration
            await fetchStatus();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to configure auto-scaling');
            console.error('Auto-scaling configuration error:', err);
        } finally {
            setIsLoading(false);
        }
    }, [orchestrator, fetchStatus]);

    /**
     * Remove auto-scaling configuration
     */
    const removeAutoScaling = useCallback(async (
        service: 'lambda' | 'rds' | 'elasticache',
        resourceId: string
    ) => {
        try {
            setIsLoading(true);
            setError(null);

            const serviceNamespace = service === 'lambda' ? 'lambda' :
                service === 'elasticache' ? 'elasticache' : 'rds';

            await orchestrator.removeAutoScaling(resourceId, serviceNamespace);

            // Refresh status after removal
            await fetchStatus();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to remove auto-scaling');
            console.error('Auto-scaling removal error:', err);
        } finally {
            setIsLoading(false);
        }
    }, [orchestrator, fetchStatus]);

    /**
     * Refresh status manually
     */
    const refreshStatus = useCallback(() => {
        fetchStatus();
    }, [fetchStatus]);

    /**
     * Validate configuration
     */
    const validateConfiguration = useCallback((
        lambdaFunctions: string[],
        estimatedCost: number
    ) => {
        return AutoScalingConfigManager.validateConfiguration(
            environment,
            lambdaFunctions,
            estimatedCost
        );
    }, [environment]);

    /**
     * Get environment configuration
     */
    const getEnvironmentConfig = useCallback(() => {
        return AutoScalingConfigManager.getAllEnvironmentConfigs()[environment];
    }, [environment]);

    // Initial load
    useEffect(() => {
        fetchStatus();
    }, [fetchStatus]);

    // Auto-refresh every 5 minutes
    useEffect(() => {
        const interval = setInterval(fetchStatus, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [fetchStatus]);

    return {
        status,
        metrics,
        recommendations,
        costEstimate,
        isLoading,
        error,
        refreshStatus,
        configureAutoScaling,
        removeAutoScaling,
        validateConfiguration,
        getEnvironmentConfig
    };
};

/**
 * Generate mock metrics for demonstration
 * In real implementation, this would fetch from CloudWatch
 */
function generateMockMetrics(environment: 'dev' | 'staging' | 'prod'): AutoScalingMetrics {
    const baseMultiplier = environment === 'prod' ? 1 : environment === 'staging' ? 0.7 : 0.3;

    return {
        lambdaMetrics: [
            {
                functionName: 'persona-api',
                avgDuration: 150 * baseMultiplier,
                errorRate: 0.5 * baseMultiplier,
                throttles: 0,
                concurrentExecutions: 10 * baseMultiplier
            },
            {
                functionName: 'vc-start',
                avgDuration: 200 * baseMultiplier,
                errorRate: 1.0 * baseMultiplier,
                throttles: 0,
                concurrentExecutions: 15 * baseMultiplier
            },
            {
                functionName: 'upload-handler',
                avgDuration: 300 * baseMultiplier,
                errorRate: 0.2 * baseMultiplier,
                throttles: 0,
                concurrentExecutions: 5 * baseMultiplier
            }
        ],
        rdsMetrics: [
            {
                dbInstanceIdentifier: 'matbakh-db',
                cpuUtilization: 45 * baseMultiplier,
                databaseConnections: 25 * baseMultiplier,
                freeableMemory: 8000000000 // 8GB
            }
        ],
        elastiCacheMetrics: [
            {
                replicationGroupId: 'matbakh-redis',
                cpuUtilization: 30 * baseMultiplier,
                memoryUsage: 60 * baseMultiplier,
                evictions: 0
            }
        ]
    };
}

/**
 * Hook for auto-scaling configuration management
 */
export const useAutoScalingConfig = () => {
    const generateLambdaConfig = useCallback((
        functionName: string,
        functionArn: string,
        environment: 'dev' | 'staging' | 'prod'
    ) => {
        return AutoScalingConfigManager.generateLambdaScalingConfig(
            functionName,
            functionArn,
            environment
        );
    }, []);

    const generateRDSConfig = useCallback((
        dbInstanceIdentifier: string,
        environment: 'dev' | 'staging' | 'prod'
    ) => {
        return AutoScalingConfigManager.generateRDSScalingConfig(
            dbInstanceIdentifier,
            environment
        );
    }, []);

    const generateElastiCacheConfig = useCallback((
        replicationGroupId: string,
        environment: 'dev' | 'staging' | 'prod'
    ) => {
        return AutoScalingConfigManager.generateElastiCacheScalingConfig(
            replicationGroupId,
            environment
        );
    }, []);

    const estimateCosts = useCallback((
        environment: 'dev' | 'staging' | 'prod',
        lambdaConfigs: any[],
        rdsConfigs: any[],
        elastiCacheConfigs: any[]
    ) => {
        return AutoScalingConfigManager.estimateMonthlyCosts(
            environment,
            lambdaConfigs,
            rdsConfigs,
            elastiCacheConfigs
        );
    }, []);

    return {
        generateLambdaConfig,
        generateRDSConfig,
        generateElastiCacheConfig,
        estimateCosts
    };
};