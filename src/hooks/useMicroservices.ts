/**
 * Microservices Hook
 * 
 * React hook for managing microservices state and operations
 * including service health, deployment, scaling, and monitoring.
 */

import {
    createMicroserviceFoundation,
    type CostAnalysis,
    type DeploymentConfiguration,
    type MeshStatus,
    type ServiceDiscoveryStats,
    type ServiceHealthStatus,
} from '@/lib/microservices';
import { useCallback, useEffect, useState } from 'react';

// Types for dependency injection
export type MicroserviceFoundation = ReturnType<typeof createMicroserviceFoundation>;
export type FoundationFactory = (meshName: string, region: string) => MicroserviceFoundation;

interface UseMicroservicesOptions {
    autoRefresh?: boolean;
    refreshInterval?: number; // milliseconds
    factory?: FoundationFactory; // For dependency injection in tests
}

interface UseMicroservicesReturn {
    // State
    services: ServiceHealthStatus[];
    meshStatus: MeshStatus | null;
    costAnalysis: CostAnalysis | null;
    discoveryStats: ServiceDiscoveryStats | null;
    isLoading: boolean;
    error: Error | null;

    // Actions
    refreshData: () => Promise<void>;
    scaleService: (serviceName: string, direction: 'up' | 'down') => Promise<void>;
    deployService: (serviceName: string, version?: string) => Promise<void>;
    removeService: (serviceName: string) => Promise<void>;
    updateServiceConfig: (serviceName: string, updates: any) => Promise<void>;

    // Utilities
    getServiceHealth: (serviceName: string) => ServiceHealthStatus | null;
    getTotalCost: () => number;
    getHealthyServicesCount: () => number;
    getUnhealthyServicesCount: () => number;
}

export const useMicroservices = (
    environment: 'development' | 'staging' | 'production',
    region: 'eu-central-1' | 'eu-west-1',
    options: UseMicroservicesOptions = {}
): UseMicroservicesReturn => {
    const {
        autoRefresh = true,
        refreshInterval = 30000, // 30 seconds
    } = options;

    // State
    const [services, setServices] = useState<ServiceHealthStatus[]>([]);
    const [meshStatus, setMeshStatus] = useState<MeshStatus | null>(null);
    const [costAnalysis, setCostAnalysis] = useState<CostAnalysis | null>(null);
    const [discoveryStats, setDiscoveryStats] = useState<ServiceDiscoveryStats | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    // Initialize microservices foundation with dependency injection support
    const factory = options?.factory ?? createMicroserviceFoundation;
    const [foundation] = useState(() =>
        factory(`matbakh-mesh-${environment}`, region)
    );

    // Refresh all data
    const refreshData = useCallback(async () => {
        if (isLoading) return;

        setIsLoading(true);
        setError(null);

        try {
            // Fetch all data in parallel
            const [
                servicesData,
                meshData,
                costData,
                discoveryData,
            ] = await Promise.allSettled([
                foundation.orchestrator.getAllServicesStatus(),
                foundation.meshManager.getMeshStatus(),
                foundation.orchestrator.getCostAnalysis(),
                foundation.serviceDiscovery.getServiceStatistics(),
            ]);

            // Update services
            if (servicesData.status === 'fulfilled') {
                setServices(servicesData.value);
            } else {
                console.error('Failed to fetch services:', servicesData.reason);
            }

            // Update mesh status
            if (meshData.status === 'fulfilled') {
                setMeshStatus(meshData.value);
            } else {
                console.error('Failed to fetch mesh status:', meshData.reason);
            }

            // Update cost analysis
            if (costData.status === 'fulfilled') {
                setCostAnalysis(costData.value);
            } else {
                console.error('Failed to fetch cost analysis:', costData.reason);
            }

            // Update discovery stats
            if (discoveryData.status === 'fulfilled') {
                setDiscoveryStats(discoveryData.value);
            } else {
                console.error('Failed to fetch discovery stats:', discoveryData.reason);
            }

        } catch (err) {
            const error = err instanceof Error ? err : new Error('Unknown error occurred');
            setError(error);
            console.error('Failed to refresh microservices data:', error);
        } finally {
            setIsLoading(false);
        }
    }, [foundation, isLoading]);

    // Scale service
    const scaleService = useCallback(async (
        serviceName: string,
        direction: 'up' | 'down'
    ) => {
        try {
            setError(null);

            const service = services.find(s => s.serviceName === serviceName);
            if (!service) {
                throw new Error(`Service ${serviceName} not found`);
            }

            // Get current instance count (mock for now)
            const currentCount = service.instances.length || 1;
            const newCount = direction === 'up' ? currentCount + 1 : Math.max(1, currentCount - 1);

            await foundation.orchestrator.scaleService(
                serviceName,
                newCount,
                `manual-${direction}`
            );

            // Refresh data to show updated state
            await refreshData();
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to scale service');
            setError(error);
            throw error;
        }
    }, [foundation.orchestrator, services, refreshData]);

    // Deploy service
    const deployService = useCallback(async (
        serviceName: string,
        version: string = '1.0.0'
    ) => {
        try {
            setError(null);

            const deploymentConfig: DeploymentConfiguration = {
                serviceName,
                version,
                strategy: environment === 'production' ? 'canary' : 'rolling',
                canaryConfig: environment === 'production' ? {
                    initialWeight: 5,
                    promoteWeight: 100,
                    promoteInterval: '5m',
                    rollbackThreshold: {
                        errorRate: 5,
                        latencyP95: 200,
                        latencyP99: 500,
                    },
                    trafficSplit: {
                        canary: 5,
                        stable: 95,
                    },
                } : undefined,
                healthGates: [
                    {
                        type: 'smoke',
                        timeout: '2m',
                        retries: 3,
                        criteria: {
                            successRate: 95,
                            maxLatency: 1000,
                            maxErrorRate: 5,
                            requiredChecks: ['health'],
                        },
                    },
                ],
                rollbackConfig: {
                    enabled: true,
                    automaticRollback: environment === 'production',
                    rollbackTriggers: [
                        {
                            type: 'metric',
                            threshold: 10,
                            evaluationPeriods: 2,
                            metricName: 'ErrorRate',
                        },
                    ],
                    rollbackTimeout: '10m',
                },
            };

            await foundation.orchestrator.deployService(serviceName, deploymentConfig);

            // Refresh data to show updated state
            await refreshData();
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to deploy service');
            setError(error);
            throw error;
        }
    }, [foundation.orchestrator, environment, refreshData]);

    // Remove service
    const removeService = useCallback(async (serviceName: string) => {
        try {
            setError(null);

            // Confirm removal in production
            if (environment === 'production') {
                const confirmed = window.confirm(
                    `Are you sure you want to remove ${serviceName} from production? This action cannot be undone.`
                );
                if (!confirmed) return;
            }

            await foundation.orchestrator.removeService(serviceName, false);

            // Refresh data to show updated state
            await refreshData();
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to remove service');
            setError(error);
            throw error;
        }
    }, [foundation.orchestrator, environment, refreshData]);

    // Update service configuration
    const updateServiceConfig = useCallback(async (
        serviceName: string,
        updates: any
    ) => {
        try {
            setError(null);

            await foundation.orchestrator.updateServiceConfiguration(serviceName, updates);

            // Refresh data to show updated state
            await refreshData();
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to update service configuration');
            setError(error);
            throw error;
        }
    }, [foundation.orchestrator, refreshData]);

    // Utility functions
    const getServiceHealth = useCallback((serviceName: string): ServiceHealthStatus | null => {
        return services.find(s => s.serviceName === serviceName) || null;
    }, [services]);

    const getTotalCost = useCallback((): number => {
        return costAnalysis?.totalMonthlyCost || 0;
    }, [costAnalysis]);

    const getHealthyServicesCount = useCallback((): number => {
        return services.filter(s => s.status === 'healthy').length;
    }, [services]);

    const getUnhealthyServicesCount = useCallback((): number => {
        return services.filter(s => s.status === 'unhealthy').length;
    }, [services]);

    // Auto-refresh effect
    useEffect(() => {
        if (!autoRefresh) return;

        const interval = setInterval(() => {
            refreshData();
        }, refreshInterval);

        return () => clearInterval(interval);
    }, [autoRefresh, refreshInterval, refreshData]);

    // Initial data load
    useEffect(() => {
        refreshData();
    }, [refreshData]);

    return {
        // State
        services,
        meshStatus,
        costAnalysis,
        discoveryStats,
        isLoading,
        error,

        // Actions
        refreshData,
        scaleService,
        deployService,
        removeService,
        updateServiceConfig,

        // Utilities
        getServiceHealth,
        getTotalCost,
        getHealthyServicesCount,
        getUnhealthyServicesCount,
    };
};

// Additional hooks for specific use cases

export const useMicroserviceHealth = (serviceName: string) => {
    const { getServiceHealth, refreshData } = useMicroservices('development', 'eu-central-1');
    const [health, setHealth] = useState<ServiceHealthStatus | null>(null);

    useEffect(() => {
        const updateHealth = () => {
            const serviceHealth = getServiceHealth(serviceName);
            setHealth(serviceHealth);
        };

        updateHealth();

        // Update health when services change
        const interval = setInterval(updateHealth, 5000); // 5 seconds
        return () => clearInterval(interval);
    }, [serviceName, getServiceHealth]);

    return {
        health,
        isHealthy: health?.status === 'healthy',
        isDegraded: health?.status === 'degraded',
        isUnhealthy: health?.status === 'unhealthy',
        lastCheck: health?.lastCheck,
        metrics: health?.metrics,
        error: health?.error,
        refresh: refreshData,
    };
};

export const useMicroserviceCosts = () => {
    const { costAnalysis, refreshData } = useMicroservices('development', 'eu-central-1');

    return {
        totalCost: costAnalysis?.totalMonthlyCost || 0,
        budgetUtilization: costAnalysis?.budgetUtilization || 0,
        costByService: costAnalysis?.costByService || new Map(),
        recommendations: costAnalysis?.recommendations || [],
        isOverBudget: (costAnalysis?.budgetUtilization || 0) > 100,
        isNearBudget: (costAnalysis?.budgetUtilization || 0) > 80,
        lastUpdated: costAnalysis?.lastUpdated,
        refresh: refreshData,
    };
};

export const useMicroserviceScaling = (serviceName: string) => {
    const { scaleService, getServiceHealth } = useMicroservices('development', 'eu-central-1');
    const [isScaling, setIsScaling] = useState(false);

    const scaleUp = useCallback(async () => {
        setIsScaling(true);
        try {
            await scaleService(serviceName, 'up');
        } finally {
            setIsScaling(false);
        }
    }, [scaleService, serviceName]);

    const scaleDown = useCallback(async () => {
        setIsScaling(true);
        try {
            await scaleService(serviceName, 'down');
        } finally {
            setIsScaling(false);
        }
    }, [scaleService, serviceName]);

    const health = getServiceHealth(serviceName);
    const currentInstances = health?.instances.length || 0;

    return {
        scaleUp,
        scaleDown,
        isScaling,
        currentInstances,
        canScaleUp: currentInstances < 10, // Max capacity
        canScaleDown: currentInstances > 1, // Min capacity
    };
};