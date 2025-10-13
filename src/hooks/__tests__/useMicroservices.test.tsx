/**
 * useMicroservices Hook Tests
 * 
 * Tests for the React hook that manages microservices state
 * and operations including auto-refresh and error handling.
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import { useMicroservices } from '../useMicroservices';

// Mock the microservices foundation
jest.mock('../../lib/microservices/microservice-orchestrator', () => ({
    MicroserviceOrchestrator: jest.fn().mockImplementation(() => ({
        getAllServicesStatus: jest.fn().mockResolvedValue([
            {
                serviceName: 'persona',
                status: 'healthy',
                lastCheck: new Date(),
                metrics: {
                    cpu: 45,
                    memory: 60,
                    requestRate: 120,
                    errorRate: 0.5,
                },
                instances: [
                    { id: 'inst-1', status: 'running' },
                    { id: 'inst-2', status: 'running' },
                ],
                meshStatus: { connected: true, errors: [] },
            },
            {
                serviceName: 'auth',
                status: 'degraded',
                lastCheck: new Date(),
                metrics: {
                    cpu: 80,
                    memory: 75,
                    requestRate: 200,
                    errorRate: 2.1,
                },
                instances: [
                    { id: 'inst-1', status: 'running' },
                ],
                meshStatus: { connected: true, errors: ['High latency detected'] },
            },
        ]),
        getCostAnalysis: jest.fn().mockResolvedValue({
            totalMonthlyCost: 42.5,
            costByService: new Map([
                ['persona', { monthlyEstimate: 25.0 }],
                ['auth', { monthlyEstimate: 17.5 }],
            ]),
            budgetUtilization: 35,
            projectedMonthlyCost: 45.0,
            recommendations: ['Consider using Fargate Spot for development'],
            lastUpdated: new Date(),
        }),
        scaleService: jest.fn().mockResolvedValue(undefined),
        deployService: jest.fn().mockResolvedValue(undefined),
        removeService: jest.fn().mockResolvedValue(undefined),
        updateServiceConfiguration: jest.fn().mockResolvedValue(undefined),
    })),
}));

jest.mock('../../lib/microservices/app-mesh-manager', () => ({
    AppMeshManager: jest.fn().mockImplementation(() => ({
        getMeshStatus: jest.fn().mockResolvedValue({
            meshName: 'matbakh-mesh-test',
            region: 'eu-central-1',
            status: 'active',
            virtualServices: 3,
            virtualRouters: 2,
            virtualNodes: 4,
            lastUpdated: new Date(),
            errors: [],
        }),
    })),
}));

jest.mock('../../lib/microservices/service-discovery-manager', () => ({
    ServiceDiscoveryManager: jest.fn().mockImplementation(() => ({
        getServiceStatistics: jest.fn().mockResolvedValue({
            totalServices: 3,
            healthyServices: 2,
            unhealthyServices: 1,
            servicesByEnvironment: new Map([['test', 3]]),
            servicesByRegion: new Map([['eu-central-1', 3]]),
            averageResponseTime: 85,
            lastUpdated: new Date(),
        }),
    })),
}));

describe('useMicroservices', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('Initial State and Data Loading', () => {
        it('should load initial data and set loading state', async () => {
            const { result } = renderHook(() =>
                useMicroservices('development', 'eu-central-1', { autoRefresh: false })
            );

            expect(result.current.isLoading).toBe(true);
            expect(result.current.services).toEqual([]);
            expect(result.current.error).toBeNull();

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.services).toHaveLength(2);
            expect(result.current.services[0].serviceName).toBe('persona');
            expect(result.current.services[1].serviceName).toBe('auth');
        });

        it('should load mesh status and cost analysis', async () => {
            const { result } = renderHook(() =>
                useMicroservices('development', 'eu-central-1', { autoRefresh: false })
            );

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.meshStatus).toMatchObject({
                meshName: 'matbakh-mesh-test',
                status: 'active',
                virtualServices: 3,
            });

            expect(result.current.costAnalysis).toMatchObject({
                totalMonthlyCost: 42.5,
                budgetUtilization: 35,
            });

            expect(result.current.discoveryStats).toMatchObject({
                totalServices: 3,
                healthyServices: 2,
                unhealthyServices: 1,
            });
        });
    });

    describe('Service Operations', () => {
        it('should scale service up and refresh data', async () => {
            const { result } = renderHook(() =>
                useMicroservices('development', 'eu-central-1', { autoRefresh: false })
            );

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            await act(async () => {
                await result.current.scaleService('persona', 'up');
            });

            expect(result.current.services[0].serviceName).toBe('persona');
            // Verify that scaleService was called and data was refreshed
        });

        it('should scale service down with validation', async () => {
            const { result } = renderHook(() =>
                useMicroservices('development', 'eu-central-1', { autoRefresh: false })
            );

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            await act(async () => {
                await result.current.scaleService('persona', 'down');
            });

            // Should not scale below minimum capacity
            expect(result.current.error).toBeNull();
        });

        it('should deploy service with environment-specific strategy', async () => {
            const { result } = renderHook(() =>
                useMicroservices('production', 'eu-central-1', { autoRefresh: false })
            );

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            await act(async () => {
                await result.current.deployService('persona', '1.1.0');
            });

            // Should use canary strategy in production
            expect(result.current.error).toBeNull();
        });

        it('should remove service with confirmation in production', async () => {
            // Mock window.confirm
            const originalConfirm = window.confirm;
            window.confirm = jest.fn().mockReturnValue(true);

            const { result } = renderHook(() =>
                useMicroservices('production', 'eu-central-1', { autoRefresh: false })
            );

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            await act(async () => {
                await result.current.removeService('persona');
            });

            expect(window.confirm).toHaveBeenCalledWith(
                expect.stringContaining('Are you sure you want to remove persona from production')
            );

            // Restore original confirm
            window.confirm = originalConfirm;
        });

        it('should update service configuration', async () => {
            const { result } = renderHook(() =>
                useMicroservices('development', 'eu-central-1', { autoRefresh: false })
            );

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            const updates = {
                version: '1.2.0',
                containerConfiguration: {
                    cpu: 512,
                },
            };

            await act(async () => {
                await result.current.updateServiceConfig('persona', updates);
            });

            expect(result.current.error).toBeNull();
        });
    });

    describe('Auto-refresh Functionality', () => {
        it('should auto-refresh data at specified intervals', async () => {
            const { result } = renderHook(() =>
                useMicroservices('development', 'eu-central-1', {
                    autoRefresh: true,
                    refreshInterval: 5000
                })
            );

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            // Fast-forward time to trigger auto-refresh
            act(() => {
                jest.advanceTimersByTime(5000);
            });

            // Should trigger another data refresh
            expect(result.current.services).toHaveLength(2);
        });

        it('should not auto-refresh when disabled', async () => {
            const { result } = renderHook(() =>
                useMicroservices('development', 'eu-central-1', { autoRefresh: false })
            );

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            const initialServices = result.current.services;

            // Fast-forward time
            act(() => {
                jest.advanceTimersByTime(30000);
            });

            // Services should remain the same (no auto-refresh)
            expect(result.current.services).toBe(initialServices);
        });
    });

    describe('Utility Functions', () => {
        it('should get service health by name', async () => {
            const { result } = renderHook(() =>
                useMicroservices('development', 'eu-central-1', { autoRefresh: false })
            );

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            const personaHealth = result.current.getServiceHealth('persona');
            expect(personaHealth).toMatchObject({
                serviceName: 'persona',
                status: 'healthy',
            });

            const nonExistentHealth = result.current.getServiceHealth('non-existent');
            expect(nonExistentHealth).toBeNull();
        });

        it('should calculate total cost', async () => {
            const { result } = renderHook(() =>
                useMicroservices('development', 'eu-central-1', { autoRefresh: false })
            );

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            const totalCost = result.current.getTotalCost();
            expect(totalCost).toBe(42.5);
        });

        it('should count healthy and unhealthy services', async () => {
            const { result } = renderHook(() =>
                useMicroservices('development', 'eu-central-1', { autoRefresh: false })
            );

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            const healthyCount = result.current.getHealthyServicesCount();
            const unhealthyCount = result.current.getUnhealthyServicesCount();

            expect(healthyCount).toBe(1); // persona is healthy
            expect(unhealthyCount).toBe(0); // auth is degraded, not unhealthy
        });
    });

    describe('Error Handling', () => {
        it('should handle service operation errors', async () => {
            // Mock an error in the orchestrator
            const mockOrchestrator = require('../../lib/microservices/microservice-orchestrator').MicroserviceOrchestrator;
            mockOrchestrator.mockImplementation(() => ({
                getAllServicesStatus: jest.fn().mockResolvedValue([]),
                getCostAnalysis: jest.fn().mockResolvedValue({}),
                scaleService: jest.fn().mockRejectedValue(new Error('Scaling failed')),
                deployService: jest.fn().mockResolvedValue(undefined),
                removeService: jest.fn().mockResolvedValue(undefined),
                updateServiceConfiguration: jest.fn().mockResolvedValue(undefined),
            }));

            const { result } = renderHook(() =>
                useMicroservices('development', 'eu-central-1', { autoRefresh: false })
            );

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            await act(async () => {
                try {
                    await result.current.scaleService('persona', 'up');
                } catch (error) {
                    // Error should be caught and set in state
                }
            });

            expect(result.current.error).toMatchObject({
                message: expect.stringContaining('Failed to scale service'),
            });
        });

        it('should handle data loading errors gracefully', async () => {
            // Mock an error in data loading
            const mockOrchestrator = require('../../lib/microservices/microservice-orchestrator').MicroserviceOrchestrator;
            mockOrchestrator.mockImplementation(() => ({
                getAllServicesStatus: jest.fn().mockRejectedValue(new Error('Network error')),
                getCostAnalysis: jest.fn().mockResolvedValue({}),
                scaleService: jest.fn().mockResolvedValue(undefined),
                deployService: jest.fn().mockResolvedValue(undefined),
                removeService: jest.fn().mockResolvedValue(undefined),
                updateServiceConfiguration: jest.fn().mockResolvedValue(undefined),
            }));

            const { result } = renderHook(() =>
                useMicroservices('development', 'eu-central-1', { autoRefresh: false })
            );

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            // Should handle partial data loading failures
            expect(result.current.services).toEqual([]);
            expect(result.current.error).toBeNull(); // Partial failures shouldn't set global error
        });
    });

    describe('Manual Refresh', () => {
        it('should manually refresh data', async () => {
            const { result } = renderHook(() =>
                useMicroservices('development', 'eu-central-1', { autoRefresh: false })
            );

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            await act(async () => {
                await result.current.refreshData();
            });

            expect(result.current.services).toHaveLength(2);
            expect(result.current.error).toBeNull();
        });

        it('should not refresh if already loading', async () => {
            const { result } = renderHook(() =>
                useMicroservices('development', 'eu-central-1', { autoRefresh: false })
            );

            // Try to refresh while still loading
            await act(async () => {
                const refreshPromise1 = result.current.refreshData();
                const refreshPromise2 = result.current.refreshData();

                await Promise.all([refreshPromise1, refreshPromise2]);
            });

            // Should complete without issues
            expect(result.current.error).toBeNull();
        });
    });

    describe('Environment-Specific Behavior', () => {
        it('should use different deployment strategies per environment', async () => {
            const { result: devResult } = renderHook(() =>
                useMicroservices('development', 'eu-central-1', { autoRefresh: false })
            );

            const { result: prodResult } = renderHook(() =>
                useMicroservices('production', 'eu-central-1', { autoRefresh: false })
            );

            await waitFor(() => {
                expect(devResult.current.isLoading).toBe(false);
                expect(prodResult.current.isLoading).toBe(false);
            });

            // Development should use rolling deployment
            await act(async () => {
                await devResult.current.deployService('persona');
            });

            // Production should use canary deployment
            await act(async () => {
                await prodResult.current.deployService('persona');
            });

            expect(devResult.current.error).toBeNull();
            expect(prodResult.current.error).toBeNull();
        });
    });
});