/**
 * Service Discovery Manager
 * 
 * Manages service registration, discovery, and health checking
 * using AWS Cloud Map and App Mesh integration.
 */

import {
    MicroserviceConfiguration,
    ServiceRegistration
} from './types';

export class ServiceDiscoveryManager {
    private registeredServices: Map<string, ServiceRegistration> = new Map();
    private healthCheckers: Map<string, NodeJS.Timeout> = new Map();
    private namespace: string;
    private region: string;

    constructor(namespace: string = 'svc.local', region: string = 'eu-central-1') {
        this.namespace = namespace;
        this.region = region;
    }

    /**
     * Register a service in the service discovery system
     */
    async registerService(
        serviceConfig: MicroserviceConfiguration,
        instanceId: string,
        address: string
    ): Promise<void> {
        try {
            const registration: ServiceRegistration = {
                serviceName: serviceConfig.serviceName,
                serviceId: `${serviceConfig.serviceName}-${instanceId}`,
                address,
                port: serviceConfig.containerConfiguration.port,
                tags: [
                    `version:${serviceConfig.version}`,
                    `environment:${serviceConfig.environment}`,
                    `region:${serviceConfig.region}`,
                    'mesh:enabled',
                ],
                meta: {
                    version: serviceConfig.version,
                    environment: serviceConfig.environment,
                    region: serviceConfig.region,
                    meshEnabled: true,
                },
                check: {
                    http: `http://${address}:${serviceConfig.containerConfiguration.port}${serviceConfig.healthCheck.path}`,
                    interval: `${serviceConfig.healthCheck.interval}s`,
                    timeout: `${serviceConfig.healthCheck.timeout}s`,
                    deregisterCriticalServiceAfter: '30s',
                },
            };

            // Register with Cloud Map
            await this.registerWithCloudMap(registration);

            // Store registration
            this.registeredServices.set(registration.serviceId, registration);

            // Start health checking
            this.startHealthCheck(registration);

            console.log(`Service ${registration.serviceName} registered with ID ${registration.serviceId}`);
        } catch (error) {
            console.error(`Failed to register service ${serviceConfig.serviceName}:`, error);
            throw error;
        }
    }

    /**
     * Deregister a service from the service discovery system
     */
    async deregisterService(serviceId: string): Promise<void> {
        try {
            const registration = this.registeredServices.get(serviceId);
            if (!registration) {
                throw new Error(`Service ${serviceId} not found`);
            }

            // Stop health checking
            this.stopHealthCheck(serviceId);

            // Deregister from Cloud Map
            await this.deregisterFromCloudMap(registration);

            // Remove from local registry
            this.registeredServices.delete(serviceId);

            console.log(`Service ${serviceId} deregistered successfully`);
        } catch (error) {
            console.error(`Failed to deregister service ${serviceId}:`, error);
            throw error;
        }
    }

    /**
     * Discover services by name
     */
    async discoverServices(serviceName: string): Promise<ServiceInstance[]> {
        try {
            // Query Cloud Map for service instances
            const instances = await this.queryCloudMap(serviceName);

            // Filter healthy instances
            const healthyInstances = instances.filter(instance =>
                instance.healthStatus === 'healthy'
            );

            console.log(`Discovered ${healthyInstances.length} healthy instances for ${serviceName}`);
            return healthyInstances;
        } catch (error) {
            console.error(`Failed to discover services for ${serviceName}:`, error);
            throw error;
        }
    }

    /**
     * Get service health status
     */
    async getServiceHealth(serviceId: string): Promise<ServiceHealthInfo> {
        try {
            const registration = this.registeredServices.get(serviceId);
            if (!registration) {
                throw new Error(`Service ${serviceId} not found`);
            }

            // Perform health check
            const healthStatus = await this.performHealthCheck(registration);

            return {
                serviceId,
                serviceName: registration.serviceName,
                address: registration.address,
                port: registration.port,
                healthStatus: healthStatus.status,
                lastCheck: healthStatus.lastCheck,
                responseTime: healthStatus.responseTime,
                error: healthStatus.error,
                metadata: registration.meta,
            };
        } catch (error) {
            console.error(`Failed to get health for service ${serviceId}:`, error);
            return {
                serviceId,
                serviceName: 'unknown',
                address: 'unknown',
                port: 0,
                healthStatus: 'unhealthy',
                lastCheck: new Date(),
                error: error.message,
                metadata: {},
            };
        }
    }

    /**
     * List all registered services
     */
    async listServices(): Promise<ServiceRegistration[]> {
        return Array.from(this.registeredServices.values());
    }

    /**
     * Update service metadata
     */
    async updateServiceMetadata(
        serviceId: string,
        metadata: { [key: string]: string }
    ): Promise<void> {
        try {
            const registration = this.registeredServices.get(serviceId);
            if (!registration) {
                throw new Error(`Service ${serviceId} not found`);
            }

            // Update metadata
            registration.meta = { ...registration.meta, ...metadata };

            // Update in Cloud Map
            await this.updateCloudMapService(registration);

            console.log(`Updated metadata for service ${serviceId}`);
        } catch (error) {
            console.error(`Failed to update metadata for service ${serviceId}:`, error);
            throw error;
        }
    }

    /**
     * Get service statistics
     */
    async getServiceStatistics(): Promise<ServiceDiscoveryStats> {
        const services = Array.from(this.registeredServices.values());
        const stats: ServiceDiscoveryStats = {
            totalServices: services.length,
            healthyServices: 0,
            unhealthyServices: 0,
            servicesByEnvironment: new Map(),
            servicesByRegion: new Map(),
            averageResponseTime: 0,
            lastUpdated: new Date(),
        };

        let totalResponseTime = 0;
        let responseTimeCount = 0;

        for (const service of services) {
            try {
                const health = await this.getServiceHealth(service.serviceId);

                if (health.healthStatus === 'healthy') {
                    stats.healthyServices++;
                } else {
                    stats.unhealthyServices++;
                }

                if (health.responseTime) {
                    totalResponseTime += health.responseTime;
                    responseTimeCount++;
                }

                // Count by environment
                const env = service.meta.environment;
                stats.servicesByEnvironment.set(env, (stats.servicesByEnvironment.get(env) || 0) + 1);

                // Count by region
                const region = service.meta.region;
                stats.servicesByRegion.set(region, (stats.servicesByRegion.get(region) || 0) + 1);
            } catch (error) {
                stats.unhealthyServices++;
            }
        }

        if (responseTimeCount > 0) {
            stats.averageResponseTime = totalResponseTime / responseTimeCount;
        }

        return stats;
    }

    // Private helper methods

    private async registerWithCloudMap(registration: ServiceRegistration): Promise<void> {
        // This would integrate with AWS Cloud Map API
        console.log(`Registering ${registration.serviceName} with Cloud Map`);

        // Example AWS SDK call:
        // const servicediscovery = new AWS.ServiceDiscovery();
        // await servicediscovery.registerInstance({
        //   ServiceId: 'srv-xxxxxxxxx',
        //   InstanceId: registration.serviceId,
        //   Attributes: {
        //     AWS_INSTANCE_IPV4: registration.address,
        //     AWS_INSTANCE_PORT: registration.port.toString(),
        //     ...registration.meta
        //   }
        // }).promise();
    }

    private async deregisterFromCloudMap(registration: ServiceRegistration): Promise<void> {
        console.log(`Deregistering ${registration.serviceName} from Cloud Map`);

        // Example AWS SDK call:
        // const servicediscovery = new AWS.ServiceDiscovery();
        // await servicediscovery.deregisterInstance({
        //   ServiceId: 'srv-xxxxxxxxx',
        //   InstanceId: registration.serviceId
        // }).promise();
    }

    private async queryCloudMap(serviceName: string): Promise<ServiceInstance[]> {
        console.log(`Querying Cloud Map for ${serviceName}`);

        // This would integrate with AWS Cloud Map API
        // Example AWS SDK call:
        // const servicediscovery = new AWS.ServiceDiscovery();
        // const result = await servicediscovery.discoverInstances({
        //   NamespaceName: this.namespace,
        //   ServiceName: serviceName,
        //   HealthStatus: 'HEALTHY'
        // }).promise();

        // Mock response for now
        return [
            {
                instanceId: `${serviceName}-1`,
                serviceName,
                address: '10.0.1.100',
                port: 8080,
                healthStatus: 'healthy',
                metadata: {
                    version: '1.0.0',
                    environment: 'production',
                    region: this.region,
                },
            },
        ];
    }

    private async updateCloudMapService(registration: ServiceRegistration): Promise<void> {
        console.log(`Updating Cloud Map service ${registration.serviceName}`);

        // This would integrate with AWS Cloud Map API to update service attributes
    }

    private startHealthCheck(registration: ServiceRegistration): void {
        const intervalMs = parseInt(registration.check.interval.replace('s', '')) * 1000;

        const healthChecker = setInterval(async () => {
            try {
                const health = await this.performHealthCheck(registration);

                if (health.status === 'unhealthy') {
                    console.warn(`Health check failed for ${registration.serviceId}: ${health.error}`);

                    // Update service status in Cloud Map
                    await this.updateServiceHealthStatus(registration.serviceId, 'unhealthy');
                } else {
                    // Update service status in Cloud Map
                    await this.updateServiceHealthStatus(registration.serviceId, 'healthy');
                }
            } catch (error) {
                console.error(`Health check error for ${registration.serviceId}:`, error);
            }
        }, intervalMs);

        this.healthCheckers.set(registration.serviceId, healthChecker);
    }

    private stopHealthCheck(serviceId: string): void {
        const healthChecker = this.healthCheckers.get(serviceId);
        if (healthChecker) {
            clearInterval(healthChecker);
            this.healthCheckers.delete(serviceId);
        }
    }

    private async performHealthCheck(registration: ServiceRegistration): Promise<HealthCheckResult> {
        const startTime = Date.now();

        try {
            // Perform HTTP health check
            const response = await fetch(registration.check.http, {
                method: 'GET',
                timeout: parseInt(registration.check.timeout.replace('s', '')) * 1000,
            });

            const responseTime = Date.now() - startTime;

            if (response.ok) {
                return {
                    status: 'healthy',
                    lastCheck: new Date(),
                    responseTime,
                };
            } else {
                return {
                    status: 'unhealthy',
                    lastCheck: new Date(),
                    responseTime,
                    error: `HTTP ${response.status}: ${response.statusText}`,
                };
            }
        } catch (error) {
            const responseTime = Date.now() - startTime;

            return {
                status: 'unhealthy',
                lastCheck: new Date(),
                responseTime,
                error: error.message,
            };
        }
    }

    private async updateServiceHealthStatus(serviceId: string, status: 'healthy' | 'unhealthy'): Promise<void> {
        // This would integrate with AWS Cloud Map API to update health status
        console.log(`Updating health status for ${serviceId}: ${status}`);
    }
}

// Supporting interfaces
export interface ServiceInstance {
    instanceId: string;
    serviceName: string;
    address: string;
    port: number;
    healthStatus: 'healthy' | 'unhealthy' | 'unknown';
    metadata: { [key: string]: string };
}

export interface ServiceHealthInfo {
    serviceId: string;
    serviceName: string;
    address: string;
    port: number;
    healthStatus: 'healthy' | 'unhealthy' | 'unknown';
    lastCheck: Date;
    responseTime?: number;
    error?: string;
    metadata: { [key: string]: string };
}

export interface HealthCheckResult {
    status: 'healthy' | 'unhealthy';
    lastCheck: Date;
    responseTime: number;
    error?: string;
}

export interface ServiceDiscoveryStats {
    totalServices: number;
    healthyServices: number;
    unhealthyServices: number;
    servicesByEnvironment: Map<string, number>;
    servicesByRegion: Map<string, number>;
    averageResponseTime: number;
    lastUpdated: Date;
}