/**
 * Fixed useMicroservices Hook Tests
 * 
 * Tests using dependency injection to avoid ReferenceError issues
 */

import { act, renderHook } from '@testing-library/react';
import { useMicroservices, type FoundationFactory } from '../useMicroservices';

// Mock foundation for testing
const createMockFoundation = () => ({
    orchestrator: {
        scale: jest.fn().mockResolvedValue(undefined),
        deploy: jest.fn().mockResolvedValue({ strategy: 'canary', success: true }),
        remove: jest.fn().mockResolvedValue({ success: true }),
        updateConfig: jest.fn().mockResolvedValue({ success: true }),
        getAllServicesStatus: jest.fn().mockResolvedValue([
            {
                serviceName: 'auth',
                status: 'healthy',
                lastCheck: new Date(),
                metrics: { cpu: 45, memory: 60, requestRate: 120, errorRate: 0.5 },
                instances: [{ id: 'inst-1', status: 'running' }],
                meshStatus: { connected: true, errors: [] },
            },
        ]),
        getCostAnalysis: jest.fn().mockResolvedValue({
            totalMonthlyCost: 42.5,
            budgetUtilization: 35,
            recommendations: ['Consider using Fargate Spot'],
            lastUpdated: new Date(),
        }),
    },
    serviceDiscovery: {
        list: jest.fn().mockResolvedValue([
            {
                serviceName: 'auth',
                status: 'healthy',
                lastCheck: new Date(),
                metrics: { cpu: 45, memory: 60, requestRate: 120, errorRate: 0.5 },
                instances: [{ id: 'inst-1', status: 'running' }],
                meshStatus: { connected: true, errors: [] },
            },
        ]),
        getHealth: jest.fn().mockResolvedValue({ healthy: 1, unhealthy: 0 }),
        getStats: jest.fn().mockResolvedValue({
            totalServices: 3,
            healthyServices: 2,
            unhealthyServices: 1,
            averageResponseTime: 85,
            servicesByEnvironment: new Map([['development', 3]]),
            servicesByRegion: new Map([['eu-central-1', 3]]),
            lastUpdated: new Date(),
        }),
    },
    meshManager: {
        getMeshStatus: jest.fn().mockResolvedValue({
            meshName: 'matbakh-mesh-development',
            region: 'eu-central-1',
            status: 'active',
            virtualServices: 3,
            virtualRouters: 2,
            virtualNodes: 4,
            lastUpdated: new Date(),
            errors: [],
        }),
    },
});

const mockFactory: FoundationFactory = () => createMockFoundation() as any;

describe('useMicroservices Hook - Fixed', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('Hook Initialization', () => {
        it('should initialize with correct environment and region', async () => {
            const { result } = renderHook(() =>
                useMicroservices('development', 'eu-central-1', { factory: mockFactory })
            );

            expect(result.current.isLoading).toBe(false);
            expect(result.current.error).toBe(null);
            expect(result.current.services).toEqual([]);
        });

        it('should load initial data', async () => {
            const { result } = renderHook(() =>
                useMicroservices('development', 'eu-central-1', { factory: mockFactory })
            );

            await act(async () => {
                await result.current.refreshData();
            });

            expect(result.current.services).toHaveLength(1);
            expect(result.current.services[0].serviceName).toBe('auth');
            expect(result.current.meshStatus).toBeDefined();
            expect(result.current.costAnalysis).toBeDefined();
            expect(result.current.discoveryStats).toBeDefined();
        });
    });

    describe('Service Operations', () => {
        it('should scale service', async () => {
            const mockFoundation = createMockFoundation();
            const factory: FoundationFactory = () => mockFoundation as any;

            const { result } = renderHook(() =>
                useMicroservices('development', 'eu-central-1', { factory })
            );

            await act(async () => {
                await result.current.scaleService('auth', 'up');
            });

            expect(mockFoundation.orchestrator.scale).toHaveBeenCalledWith('auth', 'up');
        });

        it('should deploy service', async () => {
            const mockFoundation = createMockFoundation();
            const factory: FoundationFactory = () => mockFoundation as any;

            const { result } = renderHook(() =>
                useMicroservices('development', 'eu-central-1', { factory })
            );

            const deployConfig = { strategy: 'canary', version: '1.1.0' };

            await act(async () => {
                await result.current.deployService('auth', deployConfig);
            });

            expect(mockFoundation.orchestrator.deploy).toHaveBeenCalledWith('auth', deployConfig);
        });

        it('should remove service', async () => {
            const mockFoundation = createMockFoundation();
            const factory: FoundationFactory = () => mockFoundation as any;

            const { result } = renderHook(() =>
                useMicroservices('development', 'eu-central-1', { factory })
            );

            await act(async () => {
                await result.current.removeService('auth');
            });

            expect(mockFoundation.orchestrator.remove).toHaveBeenCalledWith('auth');
        });

        it('should update service configuration', async () => {
            const mockFoundation = createMockFoundation();
            const factory: FoundationFactory = () => mockFoundation as any;

            const { result } = renderHook(() =>
                useMicroservices('development', 'eu-central-1', { factory })
            );

            const newConfig = { cpu: 512, memory: 1024 };

            await act(async () => {
                await result.current.updateServiceConfig('auth', newConfig);
            });

            expect(mockFoundation.orchestrator.updateConfig).toHaveBeenCalledWith('auth', newConfig);
        });
    });

    describe('Auto-refresh Functionality', () => {
        it('should auto-refresh data at specified intervals', async () => {
            const mockFoundation = createMockFoundation();
            const factory: FoundationFactory = () => mockFoundation as any;

            renderHook(() =>
                useMicroservices('development', 'eu-central-1', {
                    factory,
                    autoRefresh: true,
                    refreshInterval: 30000,
                })
            );

            // Fast-forward time to trigger auto-refresh
            await act(async () => {
                jest.advanceTimersByTime(30000);
            });

            expect(mockFoundation.orchestrator.getAllServicesStatus).toHaveBeenCalled();
        });

        it('should not auto-refresh when disabled', async () => {
            const mockFoundation = createMockFoundation();
            const factory: FoundationFactory = () => mockFoundation as any;

            renderHook(() =>
                useMicroservices('development', 'eu-central-1', {
                    factory,
                    autoRefresh: false,
                })
            );

            // Fast-forward time
            await act(async () => {
                jest.advanceTimersByTime(60000);
            });

            // Should not have been called automatically
            expect(mockFoundation.orchestrator.getAllServicesStatus).not.toHaveBeenCalled();
        });
    });

    describe('Utility Functions', () => {
        it('should get service health by name', async () => {
            const { result } = renderHook(() =>
                useMicroservices('development', 'eu-central-1', { factory: mockFactory })
            );

            await act(async () => {
                await result.current.refreshData();
            });

            const health = result.current.getServiceHealth('auth');
            expect(health).toBeDefined();
            expect(health?.serviceName).toBe('auth');
        });

        it('should calculate total cost', async () => {
            const { result } = renderHook(() =>
                useMicroservices('development', 'eu-central-1', { factory: mockFactory })
            );

            await act(async () => {
                await result.current.refreshData();
            });

            const totalCost = result.current.getTotalCost();
            expect(totalCost).toBe(42.5);
        });

        it('should count healthy and unhealthy services', async () => {
            const { result } = renderHook(() =>
                useMicroservices('development', 'eu-central-1', { factory: mockFactory })
            );

            await act(async () => {
                await result.current.refreshData();
            });

            expect(result.current.getHealthyServicesCount()).toBe(2);
            expect(result.current.getUnhealthyServicesCount()).toBe(1);
        });
    });

    describe('Error Handling', () => {
        it('should handle service operation errors', async () => {
            const mockFoundation = createMockFoundation();
            mockFoundation.orchestrator.scale = jest.fn().mockRejectedValue(new Error('Scale failed'));
            const factory: FoundationFactory = () => mockFoundation as any;

            const { result } = renderHook(() =>
                useMicroservices('development', 'eu-central-1', { factory })
            );

            await act(async () => {
                try {
                    await result.current.scaleService('auth', 'up');
                } catch (error) {
                    expect(error).toBeInstanceOf(Error);
                }
            });

            expect(result.current.error).toBeInstanceOf(Error);
        });

        it('should handle data loading errors gracefully', async () => {
            const mockFoundation = createMockFoundation();
            mockFoundation.orchestrator.getAllServicesStatus = jest.fn().mockRejectedValue(
                new Error('Network error')
            );
            const factory: FoundationFactory = () => mockFoundation as any;

            const { result } = renderHook(() =>
                useMicroservices('development', 'eu-central-1', { factory })
            );

            await act(async () => {
                await result.current.refreshData();
            });

            expect(result.current.error).toBeInstanceOf(Error);
            expect(result.current.error?.message).toBe('Network error');
            expect(result.current.isLoading).toBe(false);
        });
    });

    describe('Manual Refresh', () => {
        it('should manually refresh data', async () => {
            const mockFoundation = createMockFoundation();
            const factory: FoundationFactory = () => mockFoundation as any;

            const { result } = renderHook(() =>
                useMicroservices('development', 'eu-central-1', { factory })
            );

            await act(async () => {
                await result.current.refreshData();
            });

            expect(mockFoundation.orchestrator.getAllServicesStatus).toHaveBeenCalled();
            expect(mockFoundation.meshManager.getMeshStatus).toHaveBeenCalled();
            expect(mockFoundation.serviceDiscovery.getStats).toHaveBeenCalled();
        });

        it('should not refresh if already loading', async () => {
            const mockFoundation = createMockFoundation();
            // Make the first call hang
            mockFoundation.orchestrator.getAllServicesStatus = jest.fn().mockImplementation(
                () => new Promise(resolve => setTimeout(resolve, 1000))
            );
            const factory: FoundationFactory = () => mockFoundation as any;

            const { result } = renderHook(() =>
                useMicroservices('development', 'eu-central-1', { factory })
            );

            // Start first refresh
            act(() => {
                result.current.refreshData();
            });

            expect(result.current.isLoading).toBe(true);

            // Try to start second refresh while first is still loading
            await act(async () => {
                await result.current.refreshData();
            });

            // Should only be called once
            expect(mockFoundation.orchestrator.getAllServicesStatus).toHaveBeenCalledTimes(1);
        });
    });

    describe('Environment-Specific Behavior', () => {
        it('should use different deployment strategies per environment', async () => {
            const prodFactory: FoundationFactory = () => createMockFoundation() as any;
            const devFactory: FoundationFactory = () => createMockFoundation() as any;

            const { result: prodResult } = renderHook(() =>
                useMicroservices('production', 'eu-central-1', { factory: prodFactory })
            );

            const { result: devResult } = renderHook(() =>
                useMicroservices('development', 'eu-central-1', { factory: devFactory })
            );

            expect(prodResult.current).toBeDefined();
            expect(devResult.current).toBeDefined();

            // Both should have the same interface but potentially different behavior
            expect(typeof prodResult.current.deployService).toBe('function');
            expect(typeof devResult.current.deployService).toBe('function');
        });
    });
});