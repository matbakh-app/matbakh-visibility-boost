/**
 * Microservices Foundation
 * 
 * Main entry point for the microservices foundation including
 * orchestration, service discovery, App Mesh management, and templates.
 */

// Core orchestration
export { MicroserviceOrchestrator } from './microservice-orchestrator';
export type { CostAnalysis, ServiceHealthStatus } from './microservice-orchestrator';

// Service discovery
export { ServiceDiscoveryManager } from './service-discovery-manager';
export type {
    HealthCheckResult,
    ServiceDiscoveryStats, ServiceHealthInfo, ServiceInstance
} from './service-discovery-manager';

// App Mesh management
export { AppMeshManager } from './app-mesh-manager';
export type {
    MeshStatus,
    TrafficDistribution, TrafficRoute
} from './app-mesh-manager';

// Service templates
export {
    createAuthServiceTemplate,
    createPersonaServiceTemplate,
    createVCServiceTemplate
} from './templates/auth-service-template';

// Types
export type {
    AlarmAction, AlarmConfiguration, AppMeshConfiguration, BackendConfiguration, BudgetAction, CanaryConfiguration, CircuitBreakerConfiguration, ContainerConfiguration, ContainerHealthCheck, ContainerSecurityConfiguration, ContractTestConfiguration, CostAlert, CostConfiguration, CustomMetric, DashboardConfiguration,
    DashboardWidget, DeploymentConfiguration, EnvironmentVariable, EnvoyConfiguration,
    HealthCheckConfiguration, HealthCriteria, HealthGate, IAMRoleConfiguration, IntegrationTestConfiguration, LoadProfile, LoggingConfiguration, MetricsConfiguration, MicroserviceConfiguration, NetworkSecurityConfiguration, NodeListener, ObservabilityConfiguration, PerformanceTestConfiguration, REDMetrics, ResilienceTestConfiguration, RetryConfiguration, RollbackConfiguration,
    RollbackTrigger, RouterListener, ScalingConfiguration, ScheduledScalingRule, SecretConfiguration, SecurityConfiguration, SecurityTestConfiguration, ServiceDiscoveryConfiguration, ServiceRegistration, TestConfiguration, TracingConfiguration, USEMetrics, UnitTestConfiguration, VirtualNodeConfiguration, VirtualRouterConfiguration, VirtualServiceConfiguration
} from './types';

// Utility functions
export const createMicroserviceFoundation = (
    meshName: string,
    region: string = 'eu-central-1'
) => {
    const meshConfig: AppMeshConfiguration = {
        meshName,
        virtualServices: [],
        virtualRouters: [],
        virtualNodes: [],
    };

    const costConfig: CostConfiguration = {
        budgetLimits: {
            monthly: 100, // EUR
            daily: 5, // EUR
        },
        costOptimization: {
            enableSpot: true,
            spotAllocation: 50,
            rightSizing: true,
            scheduledScaling: [],
        },
        monitoring: {
            costAlerts: [
                {
                    threshold: 80,
                    recipients: ['ops@matbakh.app'],
                    actions: ['notify'],
                },
            ],
            budgetActions: [
                {
                    threshold: 100,
                    type: 'notify',
                },
            ],
        },
    };

    return {
        orchestrator: new MicroserviceOrchestrator(meshConfig, costConfig),
        serviceDiscovery: new ServiceDiscoveryManager('svc.local', region),
        meshManager: new AppMeshManager(meshName, region),
    };
};

// Constants
export const MICROSERVICES_CONSTANTS = {
    DEFAULT_NAMESPACE: 'svc.local',
    DEFAULT_MESH_NAME: 'matbakh-mesh',
    DEFAULT_REGION: 'eu-central-1',
    SECONDARY_REGION: 'eu-west-1',

    // Port ranges
    SERVICE_PORT_RANGE: {
        MIN: 8000,
        MAX: 9000,
    },

    // Envoy sidecar ports
    ENVOY_ADMIN_PORT: 9901,
    ENVOY_STATS_PORT: 9902,

    // Resource limits
    MIN_CPU: 256, // mCPU
    MIN_MEMORY: 512, // MB

    // Scaling defaults
    DEFAULT_MIN_CAPACITY: 1,
    DEFAULT_MAX_CAPACITY: 10,
    DEFAULT_TARGET_CPU: 70, // percentage
    DEFAULT_TARGET_MEMORY: 80, // percentage

    // Health check defaults
    DEFAULT_HEALTH_CHECK_INTERVAL: 30, // seconds
    DEFAULT_HEALTH_CHECK_TIMEOUT: 5, // seconds
    DEFAULT_HEALTH_CHECK_RETRIES: 3,
    DEFAULT_HEALTH_CHECK_START_PERIOD: 60, // seconds

    // Deployment defaults
    DEFAULT_CANARY_WEIGHT: 5, // percentage
    DEFAULT_PROMOTE_INTERVAL: '5m',
    DEFAULT_ROLLBACK_THRESHOLD_ERROR_RATE: 5, // percentage
    DEFAULT_ROLLBACK_THRESHOLD_LATENCY_P95: 200, // milliseconds

    // Cost optimization
    DEFAULT_SPOT_ALLOCATION: 50, // percentage
    DEFAULT_BUDGET_ALERT_THRESHOLD: 80, // percentage

    // Observability
    DEFAULT_TRACE_SAMPLING_RATE: 0.1, // 10%
    DEFAULT_LOG_RETENTION_DAYS: 7,

    // Circuit breaker defaults
    DEFAULT_CONSECUTIVE_ERRORS: 5,
    DEFAULT_EJECTION_TIME: '30s',
    DEFAULT_MAX_EJECTION_PERCENT: 50,

    // Retry defaults
    DEFAULT_MAX_RETRIES: 3,
    DEFAULT_RETRY_TIMEOUT: '2s',
    DEFAULT_RETRY_BASE_INTERVAL: '25ms',
    DEFAULT_RETRY_MAX_INTERVAL: '250ms',
} as const;

// Validation utilities
export const validateServiceConfiguration = (config: MicroserviceConfiguration): string[] => {
    const errors: string[] = [];

    if (!config.serviceName || config.serviceName.trim() === '') {
        errors.push('Service name is required');
    }

    if (!config.containerConfiguration.image) {
        errors.push('Container image is required');
    }

    if (config.containerConfiguration.cpu < MICROSERVICES_CONSTANTS.MIN_CPU) {
        errors.push(`Minimum CPU allocation is ${MICROSERVICES_CONSTANTS.MIN_CPU} mCPU`);
    }

    if (config.containerConfiguration.memory < MICROSERVICES_CONSTANTS.MIN_MEMORY) {
        errors.push(`Minimum memory allocation is ${MICROSERVICES_CONSTANTS.MIN_MEMORY} MB`);
    }

    const port = config.containerConfiguration.port;
    if (port < MICROSERVICES_CONSTANTS.SERVICE_PORT_RANGE.MIN ||
        port > MICROSERVICES_CONSTANTS.SERVICE_PORT_RANGE.MAX) {
        errors.push(`Container port must be between ${MICROSERVICES_CONSTANTS.SERVICE_PORT_RANGE.MIN}-${MICROSERVICES_CONSTANTS.SERVICE_PORT_RANGE.MAX}`);
    }

    if (config.scaling.minCapacity < 1) {
        errors.push('Minimum capacity must be at least 1');
    }

    if (config.scaling.maxCapacity < config.scaling.minCapacity) {
        errors.push('Maximum capacity must be greater than minimum capacity');
    }

    return errors;
};

// Helper functions for common operations
export const createBasicHealthCheck = (
    path: string = '/health',
    port: number = 8080
): HealthCheckConfiguration => ({
    path,
    port,
    protocol: 'HTTP',
    interval: MICROSERVICES_CONSTANTS.DEFAULT_HEALTH_CHECK_INTERVAL,
    timeout: MICROSERVICES_CONSTANTS.DEFAULT_HEALTH_CHECK_TIMEOUT,
    retries: MICROSERVICES_CONSTANTS.DEFAULT_HEALTH_CHECK_RETRIES,
    startPeriod: MICROSERVICES_CONSTANTS.DEFAULT_HEALTH_CHECK_START_PERIOD,
    matcher: '200',
});

export const createBasicScalingConfig = (
    environment: 'development' | 'staging' | 'production'
): ScalingConfiguration => ({
    minCapacity: environment === 'production' ? 2 : 1,
    maxCapacity: environment === 'production' ? 10 : 3,
    targetCpuUtilization: MICROSERVICES_CONSTANTS.DEFAULT_TARGET_CPU,
    targetMemoryUtilization: MICROSERVICES_CONSTANTS.DEFAULT_TARGET_MEMORY,
    scaleOutCooldown: 300, // 5 minutes
    scaleInCooldown: 600, // 10 minutes
    enableSpot: environment !== 'production',
    spotAllocation: MICROSERVICES_CONSTANTS.DEFAULT_SPOT_ALLOCATION,
});

export const createBasicCanaryConfig = (): CanaryConfiguration => ({
    initialWeight: MICROSERVICES_CONSTANTS.DEFAULT_CANARY_WEIGHT,
    promoteWeight: 100,
    promoteInterval: MICROSERVICES_CONSTANTS.DEFAULT_PROMOTE_INTERVAL,
    rollbackThreshold: {
        errorRate: MICROSERVICES_CONSTANTS.DEFAULT_ROLLBACK_THRESHOLD_ERROR_RATE,
        latencyP95: MICROSERVICES_CONSTANTS.DEFAULT_ROLLBACK_THRESHOLD_LATENCY_P95,
        latencyP99: 500,
    },
    trafficSplit: {
        canary: MICROSERVICES_CONSTANTS.DEFAULT_CANARY_WEIGHT,
        stable: 100 - MICROSERVICES_CONSTANTS.DEFAULT_CANARY_WEIGHT,
    },
});

export const createBasicCircuitBreakerConfig = (): CircuitBreakerConfiguration => ({
    outlierDetection: {
        consecutiveGatewayErrors: MICROSERVICES_CONSTANTS.DEFAULT_CONSECUTIVE_ERRORS,
        consecutive5xxErrors: MICROSERVICES_CONSTANTS.DEFAULT_CONSECUTIVE_ERRORS,
        interval: '30s',
        baseEjectionTime: MICROSERVICES_CONSTANTS.DEFAULT_EJECTION_TIME,
        maxEjectionTime: '300s',
        maxEjectionPercent: MICROSERVICES_CONSTANTS.DEFAULT_MAX_EJECTION_PERCENT,
    },
    connectionPool: {
        tcp: {
            maxConnections: 1024,
            connectTimeout: '10s',
        },
        http: {
            http1MaxPendingRequests: 1024,
            maxRequestsPerConnection: 2,
            maxRetries: MICROSERVICES_CONSTANTS.DEFAULT_MAX_RETRIES,
        },
    },
});

export const createBasicRetryConfig = (): RetryConfiguration => ({
    retryPolicy: {
        retryOn: ['5xx', 'connect-failure', 'gateway-error'],
        numRetries: MICROSERVICES_CONSTANTS.DEFAULT_MAX_RETRIES,
        perTryTimeout: MICROSERVICES_CONSTANTS.DEFAULT_RETRY_TIMEOUT,
        retryBackOff: {
            baseInterval: MICROSERVICES_CONSTANTS.DEFAULT_RETRY_BASE_INTERVAL,
            maxInterval: MICROSERVICES_CONSTANTS.DEFAULT_RETRY_MAX_INTERVAL,
        },
    },
});