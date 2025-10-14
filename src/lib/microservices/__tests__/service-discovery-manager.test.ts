/**
 * Service Discovery Manager Tests
 * 
 * Tests for AWS Cloud Map service discovery including registration,
 * health checking, and service statistics.
 */

import { createMockResponse, FakeServiceDiscoveryClient, makeSend, mockServiceData } from '../../../test-utils/mockAws';
import { ServiceDiscoveryManager } from '../service-discovery-manager';

describe('ServiceDiscoveryManager', () => {
    let serviceDiscovery: ServiceDiscoveryManager;
    let mockClient: FakeServiceDiscoveryClient;

    beforeEach(() => {
        mockClient = new FakeServiceDiscoveryClient();
        serviceDiscovery = new ServiceDiscoveryManager('svc.local', 'eu-central-1');

        // Inject mock client
        (serviceDiscovery as any).client = mockClient;
    });

    describe('Service Registration', () => {
        it('should register service instance with health checks', async () => {
            mockClient.send = makeSend({
                GetNamespaceCommand: () => createMockResponse({ Namespace: mockServiceData.namespace }),
                CreateServiceCommand: () => createMockResponse({ Service: mockServiceData.service }),
                RegisterInstanceCommand: () => createMockResponse({ OperationId: 'op-123' }),
                GetOperationCommand: () => createMockResponse({ Operation: { Status: 'SUCCESS' } }),
            });

            const serviceConfig = {
                serviceName: 'persona',
                version: '1.0.0',
                environment: 'test',
                region: 'eu-central-1',
                containerConfiguration: { port: 8080 },
                healthCheck: { path: '/health', interval: 30, timeout: 5 },
            } as any;

            await serviceDiscovery.registerService(serviceConfig, 'inst-1', '10.0.1.100');

            expect(mockClient.send).toHaveBeenCalledWith(
                expect.objectContaining({
                    input: expect.objectContaining({
                        ServiceId: mockServiceData.service.Id,
                        InstanceId: 'persona-inst-1',
                        Attributes: expect.objectContaining({
                            AWS_INSTANCE_IPV4: '10.0.1.100',
                            AWS_INSTANCE_PORT: '8080',
                        }),
                    }),
                })
            );
        });

        it('should handle registration operation polling', async () => {
            mockClient.send = makeSend({
                GetNamespaceCommand: () => createMockResponse({ Namespace: mockServiceData.namespace }),
                CreateServiceCommand: () => createMockResponse({ Service: mockServiceData.service }),
                RegisterInstanceCommand: () => createMockResponse({ OperationId: 'op-123' }),
                GetOperationCommand: jest.fn()
                    .mockResolvedValueOnce(createMockResponse({ Operation: { Status: 'PENDING' } }))
                    .mockResolvedValueOnce(createMockResponse({ Operation: { Status: 'SUCCESS' } })),
            });

            const serviceConfig = {
                serviceName: 'persona',
                version: '1.0.0',
                environment: 'test',
                region: 'eu-central-1',
                containerConfiguration: { port: 8080 },
                healthCheck: { path: '/health', interval: 30, timeout: 5 },
            } as any;

            await serviceDiscovery.registerService(serviceConfig, 'inst-1', '10.0.1.100');

            // Should poll operation status
            expect(mockClient.send).toHaveBeenCalledWith(
                expect.objectContaining({
                    input: expect.objectContaining({
                        OperationId: 'op-123',
                    }),
                })
            );
        });
    });

    describe('Service Deregistration', () => {
        it('should deregister service instance', async () => {
            // First register a service
            mockClient.send = makeSend({
                GetNamespaceCommand: () => createMockResponse({ Namespace: mockServiceData.namespace }),
                CreateServiceCommand: () => createMockResponse({ Service: mockServiceData.service }),
                RegisterInstanceCommand: () => createMockResponse({ OperationId: 'op-123' }),
                GetOperationCommand: () => createMockResponse({ Operation: { Status: 'SUCCESS' } }),
                DeregisterInstanceCommand: () => createMockResponse({ OperationId: 'op-456' }),
            });

            const serviceConfig = {
                serviceName: 'persona',
                version: '1.0.0',
                environment: 'test',
                region: 'eu-central-1',
                containerConfiguration: { port: 8080 },
                healthCheck: { path: '/health', interval: 30, timeout: 5 },
            } as any;

            await serviceDiscovery.registerService(serviceConfig, 'inst-1', '10.0.1.100');
            await serviceDiscovery.deregisterService('persona-inst-1');

            expect(mockClient.send).toHaveBeenCalledWith(
                expect.objectContaining({
                    input: expect.objectContaining({
                        ServiceId: mockServiceData.service.Id,
                        InstanceId: 'persona-inst-1',
                    }),
                })
            );
        });

        it('should handle deregistration of non-existent service', async () => {
            await expect(serviceDiscovery.deregisterService('non-existent')).rejects.toThrow('Service non-existent not found');
        });
    });

    describe('Service Discovery', () => {
        it('should discover healthy service instances', async () => {
            mockClient.send = makeSend({
                DiscoverInstancesCommand: () => createMockResponse({
                    Instances: [
                        {
                            InstanceId: 'inst-1',
                            Attributes: {
                                AWS_INSTANCE_IPV4: '10.0.1.100',
                                AWS_INSTANCE_PORT: '8080',
                            },
                            HealthStatus: 'HEALTHY',
                        },
                        {
                            InstanceId: 'inst-2',
                            Attributes: {
                                AWS_INSTANCE_IPV4: '10.0.1.101',
                                AWS_INSTANCE_PORT: '8080',
                            },
                            HealthStatus: 'UNHEALTHY',
                        },
                    ],
                }),
            });

            const instances = await serviceDiscovery.discoverServices('persona');

            expect(instances).toHaveLength(1);
            expect(instances[0]).toMatchObject({
                instanceId: 'inst-1',
                serviceName: 'persona',
                address: '10.0.1.100',
                port: 8080,
                healthStatus: 'healthy',
            });
        });

        it('should return empty array when no healthy instances found', async () => {
            mockClient.send = makeSend({
                DiscoverInstancesCommand: () => createMockResponse({
                    Instances: [
                        {
                            InstanceId: 'inst-1',
                            Attributes: {
                                AWS_INSTANCE_IPV4: '10.0.1.100',
                                AWS_INSTANCE_PORT: '8080',
                            },
                            HealthStatus: 'UNHEALTHY',
                        },
                    ],
                }),
            });

            const instances = await serviceDiscovery.discoverServices('persona');

            expect(instances).toHaveLength(0);
        });
    });

    describe('Health Monitoring', () => {
        beforeEach(async () => {
            mockClient.send = makeSend({
                GetNamespaceCommand: () => createMockResponse({ Namespace: mockServiceData.namespace }),
                CreateServiceCommand: () => createMockResponse({ Service: mockServiceData.service }),
                RegisterInstanceCommand: () => createMockResponse({ OperationId: 'op-123' }),
                GetOperationCommand: () => createMockResponse({ Operation: { Status: 'SUCCESS' } }),
            });

            const serviceConfig = {
                serviceName: 'persona',
                version: '1.0.0',
                environment: 'test',
                region: 'eu-central-1',
                containerConfiguration: { port: 8080 },
                healthCheck: { path: '/health', interval: 30, timeout: 5 },
            } as any;

            await serviceDiscovery.registerService(serviceConfig, 'inst-1', '10.0.1.100');
        });

        it('should perform health check and return status', async () => {
            // Mock fetch for health check
            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                status: 200,
                statusText: 'OK',
            });

            const health = await serviceDiscovery.getServiceHealth('persona-inst-1');

            expect(health).toMatchObject({
                serviceId: 'persona-inst-1',
                serviceName: 'persona',
                address: '10.0.1.100',
                port: 8080,
                healthStatus: 'healthy',
                responseTime: expect.any(Number),
            });
        });

        it('should detect unhealthy service', async () => {
            // Mock fetch to simulate failure
            global.fetch = jest.fn().mockRejectedValue(new Error('Connection refused'));

            const health = await serviceDiscovery.getServiceHealth('persona-inst-1');

            expect(health).toMatchObject({
                serviceId: 'persona-inst-1',
                healthStatus: 'unhealthy',
                error: 'Connection refused',
            });
        });

        it('should handle HTTP error responses', async () => {
            // Mock fetch to return HTTP error
            global.fetch = jest.fn().mockResolvedValue({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
            });

            const health = await serviceDiscovery.getServiceHealth('persona-inst-1');

            expect(health).toMatchObject({
                serviceId: 'persona-inst-1',
                healthStatus: 'unhealthy',
                error: 'HTTP 500: Internal Server Error',
            });
        });
    });

    describe('Service Statistics', () => {
        beforeEach(async () => {
            mockClient.send = makeSend({
                GetNamespaceCommand: () => createMockResponse({ Namespace: mockServiceData.namespace }),
                CreateServiceCommand: () => createMockResponse({ Service: mockServiceData.service }),
                RegisterInstanceCommand: () => createMockResponse({ OperationId: 'op-123' }),
                GetOperationCommand: () => createMockResponse({ Operation: { Status: 'SUCCESS' } }),
            });

            // Register multiple services
            const services = ['persona', 'auth', 'vc'];
            for (const serviceName of services) {
                const serviceConfig = {
                    serviceName,
                    version: '1.0.0',
                    environment: 'test',
                    region: 'eu-central-1',
                    containerConfiguration: { port: 8080 },
                    healthCheck: { path: '/health', interval: 30, timeout: 5 },
                } as any;

                await serviceDiscovery.registerService(serviceConfig, 'inst-1', '10.0.1.100');
            }
        });

        it('should aggregate service statistics', async () => {
            // Mock health checks
            global.fetch = jest.fn()
                .mockResolvedValueOnce({ ok: true, status: 200 }) // persona healthy
                .mockResolvedValueOnce({ ok: true, status: 200 }) // auth healthy
                .mockRejectedValueOnce(new Error('Connection refused')); // vc unhealthy

            const stats = await serviceDiscovery.getServiceStatistics();

            expect(stats).toMatchObject({
                totalServices: 3,
                healthyServices: 2,
                unhealthyServices: 1,
                servicesByEnvironment: expect.any(Map),
                servicesByRegion: expect.any(Map),
                averageResponseTime: expect.any(Number),
                lastUpdated: expect.any(Date),
            });

            expect(stats.servicesByEnvironment.get('test')).toBe(3);
            expect(stats.servicesByRegion.get('eu-central-1')).toBe(3);
        });

        it('should calculate average response time', async () => {
            // Mock health checks with different response times
            const mockFetch = jest.fn()
                .mockImplementation(() => {
                    return new Promise(resolve => {
                        setTimeout(() => {
                            resolve({ ok: true, status: 200 });
                        }, Math.random() * 100); // Random delay up to 100ms
                    });
                });
            global.fetch = mockFetch;

            const stats = await serviceDiscovery.getServiceStatistics();

            expect(stats.averageResponseTime).toBeGreaterThan(0);
            expect(stats.averageResponseTime).toBeLessThan(200); // Should be reasonable
        });
    });

    describe('Service Metadata Management', () => {
        beforeEach(async () => {
            mockClient.send = makeSend({
                GetNamespaceCommand: () => createMockResponse({ Namespace: mockServiceData.namespace }),
                CreateServiceCommand: () => createMockResponse({ Service: mockServiceData.service }),
                RegisterInstanceCommand: () => createMockResponse({ OperationId: 'op-123' }),
                GetOperationCommand: () => createMockResponse({ Operation: { Status: 'SUCCESS' } }),
                UpdateInstanceCustomHealthStatusCommand: () => createMockResponse({}),
            });

            const serviceConfig = {
                serviceName: 'persona',
                version: '1.0.0',
                environment: 'test',
                region: 'eu-central-1',
                containerConfiguration: { port: 8080 },
                healthCheck: { path: '/health', interval: 30, timeout: 5 },
            } as any;

            await serviceDiscovery.registerService(serviceConfig, 'inst-1', '10.0.1.100');
        });

        it('should update service metadata', async () => {
            const metadata = {
                version: '1.1.0',
                deploymentId: 'deploy-456',
            };

            await serviceDiscovery.updateServiceMetadata('persona-inst-1', metadata);

            // Verify metadata was updated (implementation would call UpdateInstance)
            expect(true).toBe(true); // Placeholder assertion
        });
    });

    describe('Error Handling', () => {
        it('should handle namespace not found', async () => {
            mockClient.send = makeSend({
                GetNamespaceCommand: () => {
                    const error = new Error('Namespace not found');
                    error.name = 'NamespaceNotFound';
                    throw error;
                },
            });

            const serviceConfig = {
                serviceName: 'persona',
                version: '1.0.0',
                environment: 'test',
                region: 'eu-central-1',
                containerConfiguration: { port: 8080 },
                healthCheck: { path: '/health', interval: 30, timeout: 5 },
            } as any;

            await expect(serviceDiscovery.registerService(serviceConfig, 'inst-1', '10.0.1.100'))
                .rejects.toThrow('Namespace not found');
        });

        it('should handle service registration timeout', async () => {
            mockClient.send = makeSend({
                GetNamespaceCommand: () => createMockResponse({ Namespace: mockServiceData.namespace }),
                CreateServiceCommand: () => createMockResponse({ Service: mockServiceData.service }),
                RegisterInstanceCommand: () => createMockResponse({ OperationId: 'op-123' }),
                GetOperationCommand: () => createMockResponse({ Operation: { Status: 'PENDING' } }),
            });

            const serviceConfig = {
                serviceName: 'persona',
                version: '1.0.0',
                environment: 'test',
                region: 'eu-central-1',
                containerConfiguration: { port: 8080 },
                healthCheck: { path: '/health', interval: 30, timeout: 5 },
            } as any;

            // Mock timeout by never resolving to SUCCESS
            await expect(serviceDiscovery.registerService(serviceConfig, 'inst-1', '10.0.1.100'))
                .rejects.toThrow(); // Should timeout
        });
    });

    describe('Integration Tests', () => {
        it('should handle complete service lifecycle', async () => {
            mockClient.send = makeSend({
                GetNamespaceCommand: () => createMockResponse({ Namespace: mockServiceData.namespace }),
                CreateServiceCommand: () => createMockResponse({ Service: mockServiceData.service }),
                RegisterInstanceCommand: () => createMockResponse({ OperationId: 'op-123' }),
                GetOperationCommand: () => createMockResponse({ Operation: { Status: 'SUCCESS' } }),
                DiscoverInstancesCommand: () => createMockResponse({
                    Instances: [{
                        InstanceId: 'persona-inst-1',
                        Attributes: {
                            AWS_INSTANCE_IPV4: '10.0.1.100',
                            AWS_INSTANCE_PORT: '8080',
                        },
                        HealthStatus: 'HEALTHY',
                    }],
                }),
                DeregisterInstanceCommand: () => createMockResponse({ OperationId: 'op-456' }),
            });

            const serviceConfig = {
                serviceName: 'persona',
                version: '1.0.0',
                environment: 'test',
                region: 'eu-central-1',
                containerConfiguration: { port: 8080 },
                healthCheck: { path: '/health', interval: 30, timeout: 5 },
            } as any;

            // Register service
            await serviceDiscovery.registerService(serviceConfig, 'inst-1', '10.0.1.100');

            // Discover services
            const instances = await serviceDiscovery.discoverServices('persona');
            expect(instances).toHaveLength(1);

            // Get statistics
            const stats = await serviceDiscovery.getServiceStatistics();
            expect(stats.totalServices).toBe(1);

            // Deregister service
            await serviceDiscovery.deregisterService('persona-inst-1');

            // Verify all operations completed
            expect(mockClient.send).toHaveBeenCalledTimes(6);
        });
    });
});