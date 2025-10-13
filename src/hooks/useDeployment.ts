/**
 * useDeployment Hook - React hook for deployment management
 */

import {
    deploymentMonitor,
    deploymentOrchestrator,
    environmentManager,
    type DeploymentAlert,
    type DeploymentConfig,
    type DeploymentStatus,
    type Environment,
    type MonitoringMetrics,
    type PromotionPlan
} from '@/lib/deployment';
import { useCallback, useEffect, useState } from 'react';

export interface UseDeploymentReturn {
    // State
    deployments: DeploymentStatus[];
    activeDeployment: DeploymentStatus | null;
    metrics: MonitoringMetrics[];
    alerts: DeploymentAlert[];
    environments: Environment[];
    promotionPlans: PromotionPlan[];
    isLoading: boolean;
    error: string | null;

    // Actions
    startDeployment: (config: DeploymentConfig) => Promise<DeploymentStatus>;
    rollbackDeployment: (deploymentId: string, reason?: string) => Promise<void>;
    getDeploymentStatus: (deploymentId: string) => DeploymentStatus | undefined;
    acknowledgeAlert: (alertId: string) => boolean;
    resolveAlert: (alertId: string) => boolean;
    createPromotionPlan: (fromEnv: string, toEnv: string, version: string) => PromotionPlan;
    approvePromotion: (planId: string, approver: string, comment?: string) => boolean;
    rejectPromotion: (planId: string, approver: string, comment: string) => void;
    executePromotion: (planId: string) => Promise<void>;
    refreshData: () => void;
}

export const useDeployment = (): UseDeploymentReturn => {
    const [deployments, setDeployments] = useState<DeploymentStatus[]>([]);
    const [activeDeployment, setActiveDeployment] = useState<DeploymentStatus | null>(null);
    const [metrics, setMetrics] = useState<MonitoringMetrics[]>([]);
    const [alerts, setAlerts] = useState<DeploymentAlert[]>([]);
    const [environments, setEnvironments] = useState<Environment[]>([]);
    const [promotionPlans, setPromotionPlans] = useState<PromotionPlan[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Load initial data
     */
    const loadData = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Load deployments
            const allDeployments = deploymentOrchestrator.listDeployments();
            setDeployments(allDeployments);

            // Find active deployment
            const active = allDeployments.find(d =>
                d.status === 'deploying' || d.status === 'testing' || d.status === 'rolling_back'
            );
            setActiveDeployment(active || null);

            // Load alerts
            const allAlerts = deploymentMonitor.getActiveAlerts();
            setAlerts(allAlerts);

            // Load environments
            const allEnvironments = environmentManager.listEnvironments();
            setEnvironments(allEnvironments);

            // Load promotion plans
            const allPromotionPlans = environmentManager.listPromotionPlans();
            setPromotionPlans(allPromotionPlans);

            // Load metrics for active deployment
            if (active) {
                const deploymentMetrics = deploymentMonitor.getDeploymentMetrics(active.id);
                setMetrics(deploymentMetrics);
            }

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load deployment data');
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Start a new deployment
     */
    const startDeployment = useCallback(async (config: DeploymentConfig): Promise<DeploymentStatus> => {
        try {
            setIsLoading(true);
            setError(null);

            // Mock build artifacts - in real implementation, these would come from CI/CD
            const buildArtifacts = [
                'app-bundle.js',
                'styles.css',
                'assets/*'
            ];

            const deployment = await deploymentOrchestrator.deployToEnvironment(config, buildArtifacts);

            // Start monitoring
            deploymentMonitor.startMonitoring(deployment.id, config.environment, {
                type: 'webhook',
                endpoint: '/api/deployment-alerts',
                threshold: {
                    errorRate: config.rollbackThreshold,
                    responseTime: 1000,
                    deploymentDuration: config.deploymentTimeout * 60 * 1000
                },
                enabled: true
            });

            // Refresh data
            await loadData();

            return deployment;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Deployment failed';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [loadData]);

    /**
     * Rollback a deployment
     */
    const rollbackDeployment = useCallback(async (deploymentId: string, reason = 'Manual rollback'): Promise<void> => {
        try {
            setIsLoading(true);
            setError(null);

            await deploymentOrchestrator.rollbackDeployment(deploymentId, reason);

            // Stop monitoring
            deploymentMonitor.stopMonitoring(deploymentId);

            // Refresh data
            await loadData();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Rollback failed';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [loadData]);

    /**
     * Get deployment status
     */
    const getDeploymentStatus = useCallback((deploymentId: string): DeploymentStatus | undefined => {
        return deploymentOrchestrator.getDeploymentStatus(deploymentId);
    }, []);

    /**
     * Acknowledge an alert
     */
    const acknowledgeAlert = useCallback((alertId: string): boolean => {
        const result = deploymentMonitor.acknowledgeAlert(alertId);
        if (result) {
            // Refresh alerts
            const updatedAlerts = deploymentMonitor.getActiveAlerts();
            setAlerts(updatedAlerts);
        }
        return result;
    }, []);

    /**
     * Resolve an alert
     */
    const resolveAlert = useCallback((alertId: string): boolean => {
        const result = deploymentMonitor.resolveAlert(alertId);
        if (result) {
            // Refresh alerts
            const updatedAlerts = deploymentMonitor.getActiveAlerts();
            setAlerts(updatedAlerts);
        }
        return result;
    }, []);

    /**
     * Create promotion plan
     */
    const createPromotionPlan = useCallback((
        fromEnv: string,
        toEnv: string,
        version: string
    ): PromotionPlan => {
        const plan = environmentManager.createPromotionPlan(
            fromEnv,
            toEnv,
            version,
            ['tech-lead', 'devops-lead'] // Required approvers
        );

        // Refresh promotion plans
        const updatedPlans = environmentManager.listPromotionPlans();
        setPromotionPlans(updatedPlans);

        return plan;
    }, []);

    /**
     * Approve promotion
     */
    const approvePromotion = useCallback((
        planId: string,
        approver: string,
        comment?: string
    ): boolean => {
        const result = environmentManager.approvePromotion(planId, approver, comment);

        // Refresh promotion plans
        const updatedPlans = environmentManager.listPromotionPlans();
        setPromotionPlans(updatedPlans);

        return result;
    }, []);

    /**
     * Reject promotion
     */
    const rejectPromotion = useCallback((
        planId: string,
        approver: string,
        comment: string
    ): void => {
        environmentManager.rejectPromotion(planId, approver, comment);

        // Refresh promotion plans
        const updatedPlans = environmentManager.listPromotionPlans();
        setPromotionPlans(updatedPlans);
    }, []);

    /**
     * Execute promotion
     */
    const executePromotion = useCallback(async (planId: string): Promise<void> => {
        try {
            setIsLoading(true);
            setError(null);

            await environmentManager.executePromotion(planId);

            // Refresh data
            await loadData();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Promotion execution failed';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [loadData]);

    /**
     * Refresh all data
     */
    const refreshData = useCallback(() => {
        loadData();
    }, [loadData]);

    // Load data on mount
    useEffect(() => {
        loadData();
    }, [loadData]);

    // Set up polling for active deployments
    useEffect(() => {
        if (!activeDeployment) return;

        const interval = setInterval(() => {
            const updated = deploymentOrchestrator.getDeploymentStatus(activeDeployment.id);
            if (updated) {
                setActiveDeployment(updated);

                // If deployment is complete, refresh all data
                if (updated.status === 'success' || updated.status === 'failed' || updated.status === 'rolled_back') {
                    loadData();
                }
            }
        }, 5000); // Poll every 5 seconds

        return () => clearInterval(interval);
    }, [activeDeployment, loadData]);

    // Set up polling for alerts
    useEffect(() => {
        const interval = setInterval(() => {
            const updatedAlerts = deploymentMonitor.getActiveAlerts();
            setAlerts(updatedAlerts);
        }, 30000); // Poll every 30 seconds

        return () => clearInterval(interval);
    }, []);

    return {
        // State
        deployments,
        activeDeployment,
        metrics,
        alerts,
        environments,
        promotionPlans,
        isLoading,
        error,

        // Actions
        startDeployment,
        rollbackDeployment,
        getDeploymentStatus,
        acknowledgeAlert,
        resolveAlert,
        createPromotionPlan,
        approvePromotion,
        rejectPromotion,
        executePromotion,
        refreshData
    };
};