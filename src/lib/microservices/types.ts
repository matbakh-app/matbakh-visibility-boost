/**
 * Microservices Foundation Types
 * 
 * Type definitions for the microservices architecture including
 * service configuration, mesh setup, and observability.
 */

export interface MicroserviceConfiguration {
    serviceName: string;
    version: string;
    environment: 'development' | 'staging' | 'production';
    region: 'eu-central-1' | 'eu-west-1';
    containerConfiguration: ContainerConfiguration;
    envoyConfiguration: EnvoyConfiguration;
    healthCheck: HealthCheckConfiguration;
    scaling: ScalingConfiguration;
    observability: ObservabilityConfiguration;
    security: SecurityConfiguration;
}

export interface ContainerConfiguration {
    image: string;
    cpu: number; // mCPU
    memory: number; // MB
    port: number;
    environment: EnvironmentVariable[];
    secrets: SecretConfiguration[];
    logging: LoggingConfiguration;
    healthCheck: ContainerHealthCheck;
}

export interface EnvoyConfiguration {
    cpu: 256; // mCPU for Envoy sidecar
    memory: 256; // MB for Envoy sidecar
    logLevel: 'trace' | 'debug' | 'info' | 'warn' | 'error';
    adminPort: 9901;
    statsPort: 9902;
    enableTracing: boolean;
    enableMetrics: boolean;
}

export interface HealthCheckConfiguration {
    path: string;
    port: number;
    protocol: 'HTTP' | 'HTTPS';
    interval: number; // seconds
    timeout: number; // seconds
    retries: number;
    startPeriod: number; // seconds
    matcher: string; // HTTP status codes
}

export interface ContainerHealthCheck {
    command: string[];
    interval: number; // seconds
    timeout: number; // seconds
    retries: number;
    startPeriod: number; // seconds
}

export interface ScalingConfiguration {
    minCapacity: number;
    maxCapacity: number;
    targetCpuUtilization: number; // percentage
    targetMemoryUtilization: number; // percentage
    scaleOutCooldown: number; // seconds
    scaleInCooldown: number; // seconds
    enableSpot: boolean;
    spotAllocation: number; // percentage
}

export interface ObservabilityConfiguration {
    logging: LoggingConfiguration;
    tracing: TracingConfiguration;
    metrics: MetricsConfiguration;
    dashboards: DashboardConfiguration[];
}

export interface LoggingConfiguration {
    driver: 'awslogs';
    options: {
        'awslogs-group': string;
        'awslogs-region': string;
        'awslogs-stream-prefix': string;
        'awslogs-create-group': 'true';
    };
    logFormat: 'json';
    structuredLogging: {
        correlationId: boolean;
        traceId: boolean;
        spanId: boolean;
        serviceName: boolean;
        timestamp: boolean;
        level: boolean;
    };
}

export interface TracingConfiguration {
    collector: 'adot'; // AWS Distro for OpenTelemetry
    endpoint: string;
    samplingRate: number; // 0.1 for 10% sampling
    propagation: 'w3c-traceparent';
    exporters: ('xray' | 'otlp')[];
    enableSqlTracing: boolean;
    enableHttpTracing: boolean;
}

export interface MetricsConfiguration {
    namespace: string; // matbakh/microservices
    dimensions: {
        ServiceName: string;
        Environment: string;
        Region: string;
        Version: string;
    };
    metrics: {
        red: REDMetrics;
        use: USEMetrics;
        custom: CustomMetric[];
    };
    alarms: AlarmConfiguration[];
}

export interface REDMetrics {
    requests: {
        name: string;
        unit: 'Count';
        statistic: 'Sum';
    };
    errors: {
        name: string;
        unit: 'Count';
        statistic: 'Sum';
    };
    duration: {
        name: string;
        unit: 'Milliseconds';
        statistics: ('Average' | 'p95' | 'p99')[];
    };
}

export interface USEMetrics {
    utilization: {
        cpu: string;
        memory: string;
    };
    saturation: {
        cpu: string;
        memory: string;
    };
    errors: {
        name: string;
        unit: 'Count';
    };
}

export interface CustomMetric {
    name: string;
    unit: string;
    statistic: string;
    description: string;
}

export interface AlarmConfiguration {
    name: string;
    description: string;
    metricName: string;
    threshold: number;
    comparisonOperator: 'GreaterThanThreshold' | 'LessThanThreshold';
    evaluationPeriods: number;
    period: number; // seconds
    treatMissingData: 'breaching' | 'notBreaching' | 'ignore' | 'missing';
    actions: AlarmAction[];
}

export interface AlarmAction {
    type: 'sns' | 'autoscaling' | 'lambda';
    target: string;
}

export interface DashboardConfiguration {
    name: string;
    widgets: DashboardWidget[];
}

export interface DashboardWidget {
    type: 'metric' | 'log' | 'number';
    title: string;
    metrics: string[];
    period: number;
    stat: string;
    region: string;
}

export interface SecurityConfiguration {
    iamRole: IAMRoleConfiguration;
    secrets: SecretConfiguration[];
    networkSecurity: NetworkSecurityConfiguration;
    containerSecurity: ContainerSecurityConfiguration;
}

export interface IAMRoleConfiguration {
    taskExecutionRole: {
        policies: string[];
        inlinePolicies: { [key: string]: any };
    };
    taskRole: {
        policies: string[];
        inlinePolicies: { [key: string]: any };
    };
    permissionsBoundary?: string;
}

export interface SecretConfiguration {
    name: string;
    valueFrom: string; // ARN or parameter name
    type: 'secretsmanager' | 'ssm';
}

export interface EnvironmentVariable {
    name: string;
    value: string;
}

export interface NetworkSecurityConfiguration {
    securityGroups: string[];
    subnets: string[];
    assignPublicIp: boolean;
}

export interface ContainerSecurityConfiguration {
    readOnlyRootFilesystem: boolean;
    runAsNonRoot: boolean;
    runAsUser?: number;
    capabilities: {
        add: string[];
        drop: string[];
    };
}

// App Mesh Configuration Types
export interface AppMeshConfiguration {
    meshName: string;
    virtualServices: VirtualServiceConfiguration[];
    virtualRouters: VirtualRouterConfiguration[];
    virtualNodes: VirtualNodeConfiguration[];
}

export interface VirtualServiceConfiguration {
    virtualServiceName: string;
    spec: {
        provider: {
            virtualRouter: {
                virtualRouterName: string;
            };
        };
    };
}

export interface VirtualRouterConfiguration {
    virtualRouterName: string;
    spec: {
        listeners: RouterListener[];
    };
}

export interface RouterListener {
    portMapping: {
        port: number;
        protocol: 'http' | 'http2' | 'grpc';
    };
}

export interface VirtualNodeConfiguration {
    virtualNodeName: string;
    spec: {
        listeners: NodeListener[];
        serviceDiscovery: ServiceDiscoveryConfiguration;
        backends?: BackendConfiguration[];
        logging?: {
            accessLog: {
                file: {
                    path: string;
                };
            };
        };
    };
}

export interface NodeListener {
    portMapping: {
        port: number;
        protocol: 'http' | 'http2' | 'grpc';
    };
    healthCheck: {
        protocol: 'http' | 'http2' | 'grpc';
        path: string;
        healthyThreshold: number;
        unhealthyThreshold: number;
        timeoutMillis: number;
        intervalMillis: number;
    };
    connectionPool?: {
        http?: {
            maxConnections: number;
            maxPendingRequests: number;
        };
    };
}

export interface ServiceDiscoveryConfiguration {
    cloudMap: {
        namespaceName: string; // svc.local
        serviceName: string;
        attributes?: { [key: string]: string };
    };
}

export interface BackendConfiguration {
    virtualService: {
        virtualServiceName: string;
        clientPolicy?: {
            tls?: {
                enforce: boolean;
                ports?: number[];
            };
        };
    };
}

// Service Discovery Types
export interface ServiceRegistration {
    serviceName: string;
    serviceId: string;
    address: string;
    port: number;
    tags: string[];
    meta: {
        version: string;
        environment: string;
        region: string;
        meshEnabled: boolean;
    };
    check: {
        http: string;
        interval: string;
        timeout: string;
        deregisterCriticalServiceAfter: string;
    };
}

// Deployment Types
export interface DeploymentConfiguration {
    serviceName: string;
    version: string;
    strategy: 'blue-green' | 'canary' | 'rolling';
    canaryConfig?: CanaryConfiguration;
    healthGates: HealthGate[];
    rollbackConfig: RollbackConfiguration;
}

export interface CanaryConfiguration {
    initialWeight: number; // 1-5%
    promoteWeight: number; // 100%
    promoteInterval: string; // 5m
    rollbackThreshold: {
        errorRate: number; // 5%
        latencyP95: number; // 200ms
        latencyP99: number; // 500ms
    };
    trafficSplit: {
        canary: number;
        stable: number;
    };
}

export interface HealthGate {
    type: 'smoke' | 'integration' | 'performance' | 'security';
    timeout: string;
    retries: number;
    criteria: HealthCriteria;
}

export interface HealthCriteria {
    successRate: number; // percentage
    maxLatency: number; // milliseconds
    maxErrorRate: number; // percentage
    requiredChecks: string[];
}

export interface RollbackConfiguration {
    enabled: boolean;
    automaticRollback: boolean;
    rollbackTriggers: RollbackTrigger[];
    rollbackTimeout: string;
}

export interface RollbackTrigger {
    type: 'metric' | 'alarm' | 'manual';
    threshold: number;
    evaluationPeriods: number;
    metricName?: string;
    alarmName?: string;
}

// Circuit Breaker and Resilience Types
export interface CircuitBreakerConfiguration {
    outlierDetection: {
        consecutiveGatewayErrors: number; // 5
        consecutive5xxErrors: number; // 5
        interval: string; // 30s
        baseEjectionTime: string; // 30s
        maxEjectionTime: string; // 300s
        maxEjectionPercent: number; // 50
    };
    connectionPool: {
        tcp: {
            maxConnections: number; // 1024
            connectTimeout: string; // 10s
        };
        http: {
            http1MaxPendingRequests: number; // 1024
            maxRequestsPerConnection: number; // 2
            maxRetries: number; // 3
        };
    };
}

export interface RetryConfiguration {
    retryPolicy: {
        retryOn: string[]; // ['5xx', 'connect-failure', 'gateway-error']
        numRetries: number; // 3
        perTryTimeout: string; // 2s
        retryBackOff: {
            baseInterval: string; // 25ms
            maxInterval: string; // 250ms
        };
    };
}

// Cost Management Types
export interface CostConfiguration {
    budgetLimits: {
        monthly: number; // EUR
        daily: number; // EUR
    };
    costOptimization: {
        enableSpot: boolean;
        spotAllocation: number; // percentage
        rightSizing: boolean;
        scheduledScaling: ScheduledScalingRule[];
    };
    monitoring: {
        costAlerts: CostAlert[];
        budgetActions: BudgetAction[];
    };
}

export interface ScheduledScalingRule {
    name: string;
    schedule: string; // cron expression
    minCapacity: number;
    maxCapacity: number;
    desiredCapacity: number;
}

export interface CostAlert {
    threshold: number; // percentage of budget
    recipients: string[];
    actions: string[];
}

export interface BudgetAction {
    threshold: number; // percentage of budget
    type: 'stop' | 'scale-down' | 'notify';
    target?: string;
}

// Testing Types
export interface TestConfiguration {
    unit: UnitTestConfiguration;
    contract: ContractTestConfiguration;
    integration: IntegrationTestConfiguration;
    resilience: ResilienceTestConfiguration;
    performance: PerformanceTestConfiguration;
    security: SecurityTestConfiguration;
}

export interface UnitTestConfiguration {
    framework: 'jest' | 'mocha';
    coverage: {
        threshold: number; // percentage
        includeUntested: boolean;
    };
    testTypes: string[];
}

export interface ContractTestConfiguration {
    framework: 'pact' | 'protobuf';
    validation: string;
    pipeline: string;
    brokerUrl?: string;
}

export interface IntegrationTestConfiguration {
    environment: 'localstack' | 'docker-compose' | 'testcontainers';
    services: string[];
    scenarios: string[];
    dataSetup: string;
}

export interface ResilienceTestConfiguration {
    framework: 'chaos-engineering' | 'gremlin';
    faultInjection: string;
    scenarios: string[];
    safetyLimits: {
        maxDuration: string;
        maxImpact: number; // percentage
    };
}

export interface PerformanceTestConfiguration {
    framework: 'k6' | 'artillery' | 'jmeter';
    target: string;
    slo: {
        p95Latency: string;
        p99Latency: string;
        errorRate: string;
        throughput: string;
    };
    loadProfiles: LoadProfile[];
}

export interface LoadProfile {
    name: string;
    duration: string;
    users: number;
    rampUp: string;
    rampDown: string;
}

export interface SecurityTestConfiguration {
    containerScanning: {
        tool: 'trivy' | 'clair' | 'snyk';
        pipeline: 'build-time' | 'runtime';
        failOn: 'high-severity' | 'medium-severity' | 'low-severity';
    };
    iamAnalysis: {
        tool: 'iam-access-analyzer' | 'cloudsplaining';
        validation: string;
    };
    mtlsVerification: {
        tool: string;
        validation: string;
    };
    secretsManagement: {
        validation: string;
        rotation: string;
    };
}