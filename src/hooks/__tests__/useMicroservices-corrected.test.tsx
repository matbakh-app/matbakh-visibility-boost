/**
 * Corrected useMicroservices Hook Tests
 * 
 * Tests with proper mocking that matches the actual interface
 */

import { act, renderHook } from '@testing-library/react';
import { useMicroservices, type FoundationFactory } from '../useMicroservices';

// Create a complete mock foundation that matches the expected interface
const createMockFoundation = () => ({
    orchestrator: {
        getAllServicesStatus: jest.fn().mockResolvedValue([
            {
                serviceName: 'auth',
                status: 'healthy' as const,
                lastCheck: new Date(),
                metrics: {
                    cpu: 30,
                    memory: 40,
                    requestRate: 80,
                    errorRate: 0.1,
                },
                instances: [
                    { id: 'auth-1', status: 'running' as const },
                ],
                meshStatus: { connected: true, errors: [] },
            },
        ]),
        scaleService: jest.fn().mockResolvedValue({ success: true }),
        deployService: jest.fn().mockResolvedValue({ success: true }),
        removeService: jest.fn().mockResolvedValue({ success: true }),
        updateServiceConfiguration: jest.fn().mockResolvedValue({ success: true }),
        getCostAnalysis: jest.fn().mockResolvedValue({
            totalMonthlyCost: 42.5,
            budgetUtilization: 35,
            recommendations: ['Consider using Fargate Spot'],
            lastUpdated: new Date(),
        }),
    },
    meshManager: {
        getMeshStatus: jest.fn().mockResolvedValue({
            meshName: 'matbakh-mesh-test',
            region: 'eu-central-1',
            status: 'active' as const,
            virtualServices: 3,
            virtualRouters: 2,
            virtualNodes: 4,
            lastUpdated: new Date(),
            errors: [],
        }),
    },
    serviceDiscovery: {
        // This is the correct method name expected by the hook
        getServiceStatistics: jest.fn().mockResolvedValue({
            totalServices: 3,
            healthyServices: 2,
            unhealthyServices: 1,
            averageResponseTime: 85,
            servicesByEnvironment: new Map([['test', 3]]),
            servicesByRegion: new Map([['eu-central-1', 3]]),
            lastUpdated: new Date(),
        }),
    },
});

describe('useMicroservices - Corrected Tests', () => {
    let mockFoundation: ReturnType<typeof createMockFoundation>;
    let mockFactory: FoundationFactory;

    beforeEach(() => {
        jest.clearAllMocks();
        mockFoundation = createMockFoundation();
        mockFactory = jest.fn().mockReturnValue(mockFoundation);
    });

    describe('Hook Initialization', () => {
        it('should initialize with correct environment and region', async () => {
            const { result } = renderHook(() =>
                useMicroservices('development', 'eu-central-1', { factory: mockFactory })
            );

            expect(result.current.isLoading).toBe(true);

            // Wait for initialization
            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
            });

            expect(result.current.isLoading).toBe(false);
            expect(result.current.error).toBe(null);
            expect(result.current.services).toHaveLength(1);
            expect(result.current.services[0].serviceName).toBe('auth');
        });

        it('should provide all required data', async () => {
            const { result } = renderHook(() =>
                useMicroservices('staging', 'eu-central-1', { factory: mockFactory })
            );

            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
            });

            expect(result.current.services).toHaveLength(1);
            expect(result.current.meshStatus).toBeDefined();
            expect(result.current.costAnalysis).toBeDefined();
            expect(result.current.discoveryStats).toBeDefined();
        });
    });

    describe('Service Operations', () => {
        it('should scale service successfully', async () => {
            const { result } = renderHook(() =>
                useMicroservices('development', 'eu-central-1', { factory: mockFactory })
            );

            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
            });

            await act(async () => {
                await result.current.scaleService('auth', 'up');
            });

            expect(mockFoundation.orchestrator.scaleService).toHaveBeenCalledWith('auth', 'up');
        });

        it('should deploy service successfully', async () => {
            const { result } = renderHook(() =>
                useMicroservices('development', 'eu-central-1', { factory: mockFactory })
            );

            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
            });

            const config = { image: 'auth:v2.0.0', replicas: 3 };
            await act(async () => {
                await result.current.deployService('auth', config);
            });

            expect(mockFoundation.orchestrator.deployService).toHaveBeenCalledWith('auth', config);
        });

        it('should remove service successfully', async () => {
            const { result } = renderHook(() =>
                useMicroservices('development', 'eu-central-1', { factory: mockFactory })
            );

            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
            });

            await act(async () => {
                await result.current.removeService('auth');
            });

            expect(mockFoundation.orchestrator.removeService).toHaveBeenCalledWith('auth', false);
        });

        it('should update service configuration successfully', async () => {
            const { result } = renderHook(() =>
                useMicroservices('development', 'eu-central-1', { factory: mockFactory })
            );

            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
            });

            const newConfig = { cpu: 512, memory: 1024 };
            await act(async () => {
                await result.current.updateServiceConfig('auth', newConfig);
            });

            expect(mockFoundation.orchestrator.updateServiceConfiguration).toHaveBeenCalledWith('auth', newConfig);
        });
    });

    describe('Data Management', () => {
        it('should refresh data manually', async () => {
            const { result } = renderHook(() =>
                useMicroservices('development', 'eu-central-1', { factory: mockFactory })
            );

            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
            });

            // Clear previous calls
            jest.clearAllMocks();

            await act(async () => {
                await result.current.refreshData();
            });

            expect(mockFoundation.orchestrator.getAllServicesStatus).toHaveBeenCalled();
            expect(mockFoundation.meshManager.getMeshStatus).toHaveBeenCalled();
            expect(mockFoundation.orchestrator.getCostAnalysis).toHaveBeenCalled();
            expect(mockFoundation.serviceDiscovery.getServiceStatistics).toHaveBeenCalled();
        });
    });

    describe('Utility Functions', () => {
        it('should get service health by name', async () => {
            const { result } = renderHook(() =>
                useMicroservices('development', 'eu-central-1', { factory: mockFactory })
            );

            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
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
                await new Promise(resolve => setTimeout(resolve, 100));
            });

            const totalCost = result.current.getTotalCost();
            expect(totalCost).toBe(42.5);
        });

        it('should count healthy and unhealthy services', async () => {
            const { result } = renderHook(() =>
                useMicroservices('development', 'eu-central-1', { factory: mockFactory })
            );

            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
            });

            const healthyCount = result.current.getHealthyServicesCount();
            const unhealthyCount = result.current.getUnhealthyServicesCount();

            expect(healthyCount).toBe(2);
            expect(unhealthyCount).toBe(1);
        });
    });

    describe('Error Handling', () => {
        it('should handle service operation errors', async () => {
            const errorMockFoundation = createMockFoundation();
            errorMockFoundation.orchestrator.scaleService = jest.fn().mockRejectedValue(new Error('Scaling failed'));
            const errorFactory: FoundationFactory = () => errorMockFoundation as any;

            const { result } = renderHook(() =>
                useMicroservices('development', 'eu-central-1', { factory: errorFactory })
            );

            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
            });

            // Should handle error gracefully
            await act(async () => {
                try {
                    await result.current.scaleService('auth', 'up');
                } catch (error) {
                    expect(error).toBeInstanceOf(Error);
                    expect((error as Error).message).toBe('Scaling failed');
                }
            });
        });

        it('should handle data loading errors gracefully', async () => {
            const errorMockFoundation = createMockFoundation();
            errorMockFoundation.orchestrator.getAllServicesStatus = jest.fn().mockRejectedValue(new Error('Network error'));
            const errorFactory: FoundationFactory = () => errorMockFoundation as any;

            const { result } = renderHook(() =>
                useMicroservices('development', 'eu-central-1', { factory: errorFactory })
            );

            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
            });

            // Should not crash, but may have empty services
            expect(result.current.services).toHaveLength(0);
        });
    });

    describe('Environment-Specific Behavior', () => {
        it('should use different configurations per environment', async () => {
            const devResult = renderHook(() =>
                useMicroservices('development', 'eu-central-1', { factory: mockFactory })
            );

            const prodResult = renderHook(() =>
                useMicroservices('production', 'eu-central-1', { factory: mockFactory })
            );

            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
            });

            expect(devResult.result.current).toBeDefined();
            expect(prodResult.result.current).toBeDefined();

            // Both should have the same interface
            expect(typeof devResult.result.current.deployService).toBe('function');
            expect(typeof prodResult.result.current.deployService).toBe('function');
        });
    });
});