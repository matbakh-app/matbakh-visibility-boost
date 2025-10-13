/**
 * Microservice Orchestrator Tests
 * 
 * Comprehensive tests for the microservice orchestrator including
 * service registration, deployment, scaling, and health monitoring.
 */

import { MicroserviceOrchestrator } from '../microservice-orchestrator';
import { createAuthServiceTemplate } from '../templates/auth-service-template';
import {
    AppMeshConfiguration,
    CostConfiguration,
    DeploymentConfiguration,
    MicroserviceConfiguration,
} from '../types';

// Mock AWS SDK
jest.mock('@aws-sdk/client-ecs');
jest.mock('@aws-sdk/client-application-auto-scaling');
jest.mock('@aws-sdk/client-cloudwatch');

describe('MicroserviceOrchestrator', () => {
    let orchestrator: MicroserviceOrchestrator;
    let mockMeshConfig: AppMeshConfiguration;
    let mockCostConfig: CostConfiguration;
    let mockServiceConfig: MicroserviceConfiguration;

    beforeEach(() => {
        mockMeshConfig = {
            meshName: 'test-mesh',
            virtualServices: [],
            virtualRouters: [],
            virtualNodes: [],
        };

        mockCostConfig = {
            budgetLimits: {
                monthly: 100,
                daily: 5,
            },
            costOptimization: {
                enableSpot: true,
                spotAllocation: 50,
                rightSizing: true,
                scheduledScaling: [],
            },
            monitoring: {
                costAlerts: [],
                budgetActions: [],
            },
        };

        orchestrator = new MicroserviceOrchestrator(mockMeshConfig, mockCostConfig);
        mockServiceConfig = createAuthServiceTemplate('development', 'eu-central-1', '1.0.0');
    });

    describe('Service Registration', () => {
        it('should register a new service successfully', async () => {
            await expect(orchestrator.registerService(mockServiceConfig)).resolves.not.toThrow();
        });

        it('should validate service configuration before registration', async () => {
            const invalidConfig = {
                ...mockServiceConfig,
                serviceName: '', // Invalid empty name
            };

            await expect(orchestrator.registerService(invalidConfig)).rejects.toThrow('Service name is required');
        });

        it('should validate CPU requirements', async () => {
            const invalidConfig = {
                ...mockServiceConfig,
                containerConfiguration: {
                    ...mockServiceConfig.containerConfiguration,
                    cpu: 128, // Below minimum
                },
            };

            await expect(orchestrator.registerService(invalidConfig)).rejects.toThrow('Minimum CPU allocation is 256 mCPU');
        });

        it('should validate memory requirements', async () => {
            const invalidConfig = {
                ...mockServiceConfig,
                containerConfiguration: {
                    ...mockServiceConfig.containerConfiguration,
                    memory: 256, // Below minimum
                },
            };

            await expect(orchestrator.registerService(invalidConfig)).rejects.toThrow('Minimum memory allocation is 512 MB');
        });

        it('should validate port ranges', async () => {
            const invalidConfig = {
                ...mockServiceConfig,
                containerConfiguration: {
                    ...mockServiceConfig.containerConfiguration,
                    port: 7000, // Outside allowed range
                },
            };

            await expect(orchestrator.registerService(invalidConfig)).rejects.toThrow('Container port must be between 8000-9000');
        });

        it('should validate scaling configuration', async () => {
            const invalidConfig = {
                ...mockServiceConfig,
                scaling: {
                    ...mockServiceConfig.scaling,
                    minCapacity: 0, // Invalid minimum
                },
            };

            await expect(orchestrator.registerService(invalidConfig)).rejects.toThrow('Minimum capacity must be at least 1');
        });
    });

    describe('Service Deployment', () => {
        beforeEach(async () => {
            await orchestrator.registerService(mockServiceConfig);
        });

        it('should deploy service with canary strategy', async () => {
            const deploymentConfig: DeploymentConfiguration = {
                serviceName: 'auth-service',
                version: '1.0.0',
                strategy: 'canary',
                canaryConfig: {
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
                },
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
                    automaticRollback: true,
                    rollbackTriggers: [],
                    rollbackTimeout: '10m',
                },
            };

            await expect(orchestrator.deployService('auth-service', deploymentConfig)).resolves.not.toThrow();
        });

        it('should deploy service with blue-green strategy', async () => {
            const deploymentConfig: DeploymentConfiguration = {
                serviceName: 'auth-service',
                version: '1.0.0',
                strategy: 'blue-green',
                healthGates: [],
                rollbackConfig: {
                    enabled: true,
                    automaticRollback: false,
                    rollbackTriggers: [],
                    rollbackTimeout: '5m',
                },
            };

            await expect(orchestrator.deployService('auth-service', deploymentConfig)).resolves.not.toThrow();
        });

        it('should deploy service with rolling strategy', async () => {
            const deploymentConfig: DeploymentConfiguration = {
                serviceName: 'auth-service',
                version: '1.0.0',
                strategy: 'rolling',
                healthGates: [],
                rollbackConfig: {
                    enabled: true,
                    automaticRollback: false,
                    rollbackTriggers: [],
                    rollbackTimeout: '5m',
                },
            };

            await expect(orchestrator.deployService('auth-service', deploymentConfig)).resolves.not.toThrow();
        });

        it('should fail deployment for unknown service', async () => {
            const deploymentConfig: DeploymentConfiguration = {
                serviceName: 'unknown-service',
                version: '1.0.0',
                strategy: 'rolling',
                healthGates: [],
                rollbackConfig: {
                    enabled: false,
                    automaticRollback: false,
                    rollbackTriggers: [],
                    rollbackTimeout: '5m',
                },
            };

            await expect(orchestrator.deployService('unknown-service', deploymentConfig)).rejects.toThrow('Service unknown-service not found');
        });

        it('should require canary config for canary deployment', async () => {
            const deploymentConfig: DeploymentConfiguration = {
                serviceName: 'auth-service',
                version: '1.0.0',
                strategy: 'canary',
                // Missing canaryConfig
                healthGates: [],
                rollbackConfig: {
                    enabled: false,
                    automaticRollback: false,
                    rollbackTriggers: [],
                    rollbackTimeout: '5m',
                },
            };

            await expect(orchestrator.deployService('auth-service', deploymentConfig)).rejects.toThrow('Canary configuration is required for canary deployment');
        });
    });

    describe('Service Scaling', () => {
        beforeEach(async () => {
            await orchestrator.registerService(mockServiceConfig);
        });

        it('should scale service within capacity limits', async () => {
            const desiredCount = 3;
            await expect(orchestrator.scaleService('auth-service', desiredCount, 'manual')).resolves.not.toThrow();
        });

        it('should reject scaling below minimum capacity', async () => {
            const desiredCount = 0; // Below minimum of 1
            await expect(orchestrator.scaleService('auth-service', desiredCount, 'manual')).rejects.toThrow('Desired count 0 is below minimum capacity 1');
        });

        it('should reject scaling above maximum capacity', async () => {
            const desiredCount = 20; // Above maximum of 3 for development
            await expect(orchestrator.scaleService('auth-service', desiredCount, 'manual')).rejects.toThrow('Desired count 20 exceeds maximum capacity 3');
        });

        it('should fail scaling for unknown service', async () => {
            await expect(orchestrator.scaleService('unknown-service', 2, 'manual')).rejects.toThrow('Service unknown-service not found');
        });
    });

    describe('Service Health Monitoring', () => {
        beforeEach(async () => {
            await orchestrator.registerService(mockServiceConfig);
        });

        it('should get service health status', async () => {
            const health = await orchestrator.getServiceHealth('auth-service');

            expect(health).toMatchObject({
                serviceName: 'auth-service',
                status: expect.any(String),
                lastCheck: expect.any(Date),
                metrics: expect.any(Object),
                instances: expect.any(Array),
                meshStatus: expect.any(Object),
            });
        });

        it('should return unhealthy status for unknown service', async () => {
            const health = await orchestrator.getServiceHealth('unknown-service');

            expect(health.status).toBe('unhealthy');
            expect(health.error).toBeDefined();
        });

        it('should get all services status', async () => {
            const statuses = await orchestrator.getAllServicesStatus();

            expect(statuses).toHaveLength(1);
            expect(statuses[0].serviceName).toBe('auth-service');
        });
    });

    describe('Service Configuration Updates', () => {
        beforeEach(async () => {
            await orchestrator.registerService(mockServiceConfig);
        });

        it('should update service configuration', async () => {
            const updates = {
                version: '1.1.0',
                containerConfiguration: {
                    ...mockServiceConfig.containerConfiguration,
                    cpu: 512, // Increase CPU
                },
            };

            await expect(orchestrator.updateServiceConfiguration('auth-service', updates)).resolves.not.toThrow();
        });

        it('should validate updated configuration', async () => {
            const updates = {
                containerConfiguration: {
                    ...mockServiceConfig.containerConfiguration,
                    cpu: 128, // Invalid CPU
                },
            };

            await expect(orchestrator.updateServiceConfiguration('auth-service', updates)).rejects.toThrow('Minimum CPU allocation is 256 mCPU');
        });

        it('should fail update for unknown service', async () => {
            const updates = { version: '1.1.0' };

            await expect(orchestrator.updateServiceConfiguration('unknown-service', updates)).rejects.toThrow('Service unknown-service not found');
        });
    });

    describe('Service Removal', () => {
        beforeEach(async () => {
            await orchestrator.registerService(mockServiceConfig);
        });

        it('should remove service successfully', async () => {
            await expect(orchestrator.removeService('auth-service')).resolves.not.toThrow();
        });

        it('should force remove service with dependencies', async () => {
            // Mock service with dependencies
            jest.spyOn(orchestrator as any, 'hasActiveDependencies').mockResolvedValue(true);

            await expect(orchestrator.removeService('auth-service', true)).resolves.not.toThrow();
        });

        it('should fail to remove service with dependencies without force', async () => {
            // Mock service with dependencies
            jest.spyOn(orchestrator as any, 'hasActiveDependencies').mockResolvedValue(true);

            await expect(orchestrator.removeService('auth-service', false)).rejects.toThrow('Service auth-service has active dependencies');
        });

        it('should fail removal for unknown service', async () => {
            await expect(orchestrator.removeService('unknown-service')).rejects.toThrow('Service unknown-service not found');
        });
    });

    describe('Cost Analysis', () => {
        beforeEach(async () => {
            await orchestrator.registerService(mockServiceConfig);
        });

        it('should get cost analysis', async () => {
            const analysis = await orchestrator.getCostAnalysis();

            expect(analysis).toMatchObject({
                totalMonthlyCost: expect.any(Number),
                costByService: expect.any(Map),
                budgetUtilization: expect.any(Number),
                projectedMonthlyCost: expect.any(Number),
                recommendations: expect.any(Array),
                lastUpdated: expect.any(Date),
            });
        });

        it('should calculate budget utilization', async () => {
            const analysis = await orchestrator.getCostAnalysis();

            expect(analysis.budgetUtilization).toBeGreaterThanOrEqual(0);
            expect(analysis.budgetUtilization).toBeLessThanOrEqual(100);
        });

        it('should provide cost recommendations', async () => {
            const analysis = await orchestrator.getCostAnalysis();

            expect(analysis.recommendations).toBeInstanceOf(Array);
        });
    });

    describe('Error Handling', () => {
        it('should handle mesh creation failures gracefully', async () => {
            // Mock mesh creation failure
            jest.spyOn(orchestrator as any, 'createMeshResources').mockRejectedValue(new Error('Mesh creation failed'));

            await expect(orchestrator.registerService(mockServiceConfig)).rejects.toThrow('Mesh creation failed');
        });

        it('should handle observability setup failures gracefully', async () => {
            // Mock observability setup failure
            jest.spyOn(orchestrator as any, 'setupObservability').mockRejectedValue(new Error('Observability setup failed'));

            await expect(orchestrator.registerService(mockServiceConfig)).rejects.toThrow('Observability setup failed');
        });

        it('should handle deployment failures with rollback', async () => {
            await orchestrator.registerService(mockServiceConfig);

            // Mock deployment failure
            jest.spyOn(orchestrator as any, 'executeCanaryDeployment').mockRejectedValue(new Error('Deployment failed'));

            const deploymentConfig: DeploymentConfiguration = {
                serviceName: 'auth-service',
                version: '1.0.0',
                strategy: 'canary',
                canaryConfig: {
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
                },
                healthGates: [],
                rollbackConfig: {
                    enabled: true,
                    automaticRollback: true,
                    rollbackTriggers: [],
                    rollbackTimeout: '10m',
                },
            };

            await expect(orchestrator.deployService('auth-service', deploymentConfig)).rejects.toThrow('Deployment failed');
        });
    });

    describe('Integration Tests', () => {
        it('should handle complete service lifecycle', async () => {
            // Register service
            await orchestrator.registerService(mockServiceConfig);

            // Deploy service
            const deploymentConfig: DeploymentConfiguration = {
                serviceName: 'auth-service',
                version: '1.0.0',
                strategy: 'rolling',
                healthGates: [],
                rollbackConfig: {
                    enabled: false,
                    automaticRollback: false,
                    rollbackTriggers: [],
                    rollbackTimeout: '5m',
                },
            };

            await orchestrator.deployService('auth-service', deploymentConfig);

            // Scale service
            await orchestrator.scaleService('auth-service', 2, 'load-increase');

            // Update configuration
            await orchestrator.updateServiceConfiguration('auth-service', {
                version: '1.1.0',
            });

            // Check health
            const health = await orchestrator.getServiceHealth('auth-service');
            expect(health.serviceName).toBe('auth-service');

            // Get cost analysis
            const costs = await orchestrator.getCostAnalysis();
            expect(costs.totalMonthlyCost).toBeGreaterThanOrEqual(0);

            // Remove service
            await orchestrator.removeService('auth-service');
        });

        it('should handle multiple services', async () => {
            const authConfig = createAuthServiceTemplate('development', 'eu-central-1', '1.0.0');
            const personaConfig = {
                ...authConfig,
                serviceName: 'persona-service',
                containerConfiguration: {
                    ...authConfig.containerConfiguration,
                    port: 8081,
                },
            };

            // Register multiple services
            await orchestrator.registerService(authConfig);
            await orchestrator.registerService(personaConfig);

            // Get all services status
            const statuses = await orchestrator.getAllServicesStatus();
            expect(statuses).toHaveLength(2);

            // Remove all services
            await orchestrator.removeService('auth-service');
            await orchestrator.removeService('persona-service');
        });
    });
});