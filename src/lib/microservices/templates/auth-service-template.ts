/**
 * Auth Service Template
 * 
 * Template configuration for the authentication microservice
 * including container, mesh, and observability settings.
 */

import { MicroserviceConfiguration } from '../types';

export const createAuthServiceTemplate = (
    environment: 'development' | 'staging' | 'production',
    region: 'eu-central-1' | 'eu-west-1',
    version: string = '1.0.0'
): MicroserviceConfiguration => {
    const baseConfig: MicroserviceConfiguration = {
        serviceName: 'auth-service',
        version,
        environment,
        region,
        containerConfiguration: {
            image: `matbakh/auth-service:${version}`,
            cpu: environment === 'production' ? 512 : 256, // mCPU
            memory: environment === 'production' ? 1024 : 512, // MB
            port: 8080,
            environment: [
                {
                    name: 'NODE_ENV',
                    value: environment,
                },
                {
                    name: 'PORT',
                    value: '8080',
                },
                {
                    name: 'AWS_REGION',
                    value: region,
                },
                {
                    name: 'SERVICE_NAME',
                    value: 'auth-service',
                },
                {
                    name: 'SERVICE_VERSION',
                    value: version,
                },
                {
                    name: 'MESH_ENABLED',
                    value: 'true',
                },
                {
                    name: 'TRACING_ENABLED',
                    value: 'true',
                },
                {
                    name: 'METRICS_ENABLED',
                    value: 'true',
                },
            ],
            secrets: [
                {
                    name: 'JWT_SECRET',
                    valueFrom: `arn:aws:secretsmanager:${region}:${process.env.AWS_ACCOUNT_ID}:secret:matbakh/auth/jwt-secret`,
                    type: 'secretsmanager',
                },
                {
                    name: 'DATABASE_URL',
                    valueFrom: `arn:aws:secretsmanager:${region}:${process.env.AWS_ACCOUNT_ID}:secret:matbakh/database/connection-string`,
                    type: 'secretsmanager',
                },
                {
                    name: 'REDIS_URL',
                    valueFrom: `arn:aws:secretsmanager:${region}:${process.env.AWS_ACCOUNT_ID}:secret:matbakh/redis/connection-string`,
                    type: 'secretsmanager',
                },
            ],
            logging: {
                driver: 'awslogs',
                options: {
                    'awslogs-group': `/aws/ecs/microservices/${environment}/auth-service`,
                    'awslogs-region': region,
                    'awslogs-stream-prefix': 'auth-service',
                    'awslogs-create-group': 'true',
                },
                logFormat: 'json',
                structuredLogging: {
                    correlationId: true,
                    traceId: true,
                    spanId: true,
                    serviceName: true,
                    timestamp: true,
                    level: true,
                },
            },
            healthCheck: {
                command: ['CMD-SHELL', 'curl -f http://localhost:8080/health || exit 1'],
                interval: 30,
                timeout: 5,
                retries: 3,
                startPeriod: 60,
            },
        },
        envoyConfiguration: {
            cpu: 256,
            memory: 256,
            logLevel: environment === 'production' ? 'warn' : 'info',
            adminPort: 9901,
            statsPort: 9902,
            enableTracing: true,
            enableMetrics: true,
        },
        healthCheck: {
            path: '/health',
            port: 8080,
            protocol: 'HTTP',
            interval: 30,
            timeout: 5,
            retries: 3,
            startPeriod: 60,
            matcher: '200',
        },
        scaling: {
            minCapacity: environment === 'production' ? 2 : 1,
            maxCapacity: environment === 'production' ? 10 : 3,
            targetCpuUtilization: 70,
            targetMemoryUtilization: 80,
            scaleOutCooldown: 300, // 5 minutes
            scaleInCooldown: 600, // 10 minutes
            enableSpot: environment !== 'production',
            spotAllocation: environment === 'development' ? 80 : 50, // percentage
        },
        observability: {
            logging: {
                driver: 'awslogs',
                options: {
                    'awslogs-group': `/aws/ecs/microservices/${environment}/auth-service`,
                    'awslogs-region': region,
                    'awslogs-stream-prefix': 'auth-service',
                    'awslogs-create-group': 'true',
                },
                logFormat: 'json',
                structuredLogging: {
                    correlationId: true,
                    traceId: true,
                    spanId: true,
                    serviceName: true,
                    timestamp: true,
                    level: true,
                },
            },
            tracing: {
                collector: 'adot',
                endpoint: 'http://localhost:4317',
                samplingRate: environment === 'production' ? 0.1 : 0.5, // 10% in prod, 50% in dev
                propagation: 'w3c-traceparent',
                exporters: ['xray'],
                enableSqlTracing: true,
                enableHttpTracing: true,
            },
            metrics: {
                namespace: 'matbakh/microservices',
                dimensions: {
                    ServiceName: 'auth-service',
                    Environment: environment,
                    Region: region,
                    Version: version,
                },
                metrics: {
                    red: {
                        requests: {
                            name: 'auth_requests_total',
                            unit: 'Count',
                            statistic: 'Sum',
                        },
                        errors: {
                            name: 'auth_errors_total',
                            unit: 'Count',
                            statistic: 'Sum',
                        },
                        duration: {
                            name: 'auth_request_duration',
                            unit: 'Milliseconds',
                            statistics: ['Average', 'p95', 'p99'],
                        },
                    },
                    use: {
                        utilization: {
                            cpu: 'auth_cpu_utilization',
                            memory: 'auth_memory_utilization',
                        },
                        saturation: {
                            cpu: 'auth_cpu_saturation',
                            memory: 'auth_memory_saturation',
                        },
                        errors: {
                            name: 'auth_system_errors',
                            unit: 'Count',
                        },
                    },
                    custom: [
                        {
                            name: 'auth_login_attempts',
                            unit: 'Count',
                            statistic: 'Sum',
                            description: 'Total login attempts',
                        },
                        {
                            name: 'auth_login_success_rate',
                            unit: 'Percent',
                            statistic: 'Average',
                            description: 'Login success rate',
                        },
                        {
                            name: 'auth_token_validations',
                            unit: 'Count',
                            statistic: 'Sum',
                            description: 'JWT token validations',
                        },
                    ],
                },
                alarms: [
                    {
                        name: 'auth-service-high-error-rate',
                        description: 'Auth service error rate is too high',
                        metricName: 'auth_errors_total',
                        threshold: 5, // 5% error rate
                        comparisonOperator: 'GreaterThanThreshold',
                        evaluationPeriods: 2,
                        period: 300, // 5 minutes
                        treatMissingData: 'notBreaching',
                        actions: [
                            {
                                type: 'sns',
                                target: `arn:aws:sns:${region}:${process.env.AWS_ACCOUNT_ID}:microservices-alerts`,
                            },
                        ],
                    },
                    {
                        name: 'auth-service-high-latency',
                        description: 'Auth service latency is too high',
                        metricName: 'auth_request_duration',
                        threshold: 1000, // 1 second
                        comparisonOperator: 'GreaterThanThreshold',
                        evaluationPeriods: 3,
                        period: 300,
                        treatMissingData: 'notBreaching',
                        actions: [
                            {
                                type: 'sns',
                                target: `arn:aws:sns:${region}:${process.env.AWS_ACCOUNT_ID}:microservices-alerts`,
                            },
                        ],
                    },
                ],
            },
            dashboards: [
                {
                    name: 'auth-service-overview',
                    widgets: [
                        {
                            type: 'metric',
                            title: 'Request Rate',
                            metrics: ['auth_requests_total'],
                            period: 300,
                            stat: 'Sum',
                            region,
                        },
                        {
                            type: 'metric',
                            title: 'Error Rate',
                            metrics: ['auth_errors_total'],
                            period: 300,
                            stat: 'Sum',
                            region,
                        },
                        {
                            type: 'metric',
                            title: 'Response Time',
                            metrics: ['auth_request_duration'],
                            period: 300,
                            stat: 'Average',
                            region,
                        },
                        {
                            type: 'metric',
                            title: 'CPU Utilization',
                            metrics: ['auth_cpu_utilization'],
                            period: 300,
                            stat: 'Average',
                            region,
                        },
                    ],
                },
            ],
        },
        security: {
            iamRole: {
                taskExecutionRole: {
                    policies: [
                        'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
                    ],
                    inlinePolicies: {
                        SecretsManagerAccess: {
                            Version: '2012-10-17',
                            Statement: [
                                {
                                    Effect: 'Allow',
                                    Action: [
                                        'secretsmanager:GetSecretValue',
                                    ],
                                    Resource: [
                                        `arn:aws:secretsmanager:${region}:${process.env.AWS_ACCOUNT_ID}:secret:matbakh/auth/*`,
                                        `arn:aws:secretsmanager:${region}:${process.env.AWS_ACCOUNT_ID}:secret:matbakh/database/*`,
                                        `arn:aws:secretsmanager:${region}:${process.env.AWS_ACCOUNT_ID}:secret:matbakh/redis/*`,
                                    ],
                                },
                            ],
                        },
                    },
                },
                taskRole: {
                    policies: [],
                    inlinePolicies: {
                        XRayAccess: {
                            Version: '2012-10-17',
                            Statement: [
                                {
                                    Effect: 'Allow',
                                    Action: [
                                        'xray:PutTraceSegments',
                                        'xray:PutTelemetryRecords',
                                    ],
                                    Resource: '*',
                                },
                            ],
                        },
                        CloudWatchMetrics: {
                            Version: '2012-10-17',
                            Statement: [
                                {
                                    Effect: 'Allow',
                                    Action: [
                                        'cloudwatch:PutMetricData',
                                    ],
                                    Resource: '*',
                                    Condition: {
                                        StringEquals: {
                                            'cloudwatch:namespace': 'matbakh/microservices',
                                        },
                                    },
                                },
                            ],
                        },
                    },
                },
                permissionsBoundary: `arn:aws:iam::${process.env.AWS_ACCOUNT_ID}:policy/microservices-permissions-boundary`,
            },
            secrets: [
                {
                    name: 'JWT_SECRET',
                    valueFrom: `arn:aws:secretsmanager:${region}:${process.env.AWS_ACCOUNT_ID}:secret:matbakh/auth/jwt-secret`,
                    type: 'secretsmanager',
                },
                {
                    name: 'DATABASE_URL',
                    valueFrom: `arn:aws:secretsmanager:${region}:${process.env.AWS_ACCOUNT_ID}:secret:matbakh/database/connection-string`,
                    type: 'secretsmanager',
                },
            ],
            networkSecurity: {
                securityGroups: [`microservices-ecs-sg-${environment}-${region}`],
                subnets: [`microservices-private-subnet-${environment}-${region}`],
                assignPublicIp: false,
            },
            containerSecurity: {
                readOnlyRootFilesystem: true,
                runAsNonRoot: true,
                runAsUser: 1000,
                capabilities: {
                    add: [],
                    drop: ['ALL'],
                },
            },
        },
    };

    return baseConfig;
};

export const createPersonaServiceTemplate = (
    environment: 'development' | 'staging' | 'production',
    region: 'eu-central-1' | 'eu-west-1',
    version: string = '1.0.0'
): MicroserviceConfiguration => {
    const authTemplate = createAuthServiceTemplate(environment, region, version);

    return {
        ...authTemplate,
        serviceName: 'persona-service',
        containerConfiguration: {
            ...authTemplate.containerConfiguration,
            image: `matbakh/persona-service:${version}`,
            port: 8081,
            environment: [
                ...authTemplate.containerConfiguration.environment.filter(env => env.name !== 'SERVICE_NAME'),
                {
                    name: 'SERVICE_NAME',
                    value: 'persona-service',
                },
                {
                    name: 'PORT',
                    value: '8081',
                },
            ],
            secrets: [
                ...authTemplate.containerConfiguration.secrets,
                {
                    name: 'BEDROCK_ACCESS_KEY',
                    valueFrom: `arn:aws:secretsmanager:${region}:${process.env.AWS_ACCOUNT_ID}:secret:matbakh/bedrock/access-key`,
                    type: 'secretsmanager',
                },
            ],
        },
        healthCheck: {
            ...authTemplate.healthCheck,
            port: 8081,
        },
        observability: {
            ...authTemplate.observability,
            metrics: {
                ...authTemplate.observability.metrics,
                dimensions: {
                    ...authTemplate.observability.metrics.dimensions,
                    ServiceName: 'persona-service',
                },
                metrics: {
                    ...authTemplate.observability.metrics.metrics,
                    custom: [
                        {
                            name: 'persona_detections',
                            unit: 'Count',
                            statistic: 'Sum',
                            description: 'Total persona detections',
                        },
                        {
                            name: 'persona_confidence_score',
                            unit: 'None',
                            statistic: 'Average',
                            description: 'Average persona confidence score',
                        },
                        {
                            name: 'bedrock_api_calls',
                            unit: 'Count',
                            statistic: 'Sum',
                            description: 'Bedrock API calls',
                        },
                    ],
                },
            },
        },
    };
};

export const createVCServiceTemplate = (
    environment: 'development' | 'staging' | 'production',
    region: 'eu-central-1' | 'eu-west-1',
    version: string = '1.0.0'
): MicroserviceConfiguration => {
    const authTemplate = createAuthServiceTemplate(environment, region, version);

    return {
        ...authTemplate,
        serviceName: 'vc-service',
        containerConfiguration: {
            ...authTemplate.containerConfiguration,
            image: `matbakh/vc-service:${version}`,
            port: 8082,
            cpu: environment === 'production' ? 1024 : 512, // Higher CPU for VC processing
            memory: environment === 'production' ? 2048 : 1024, // Higher memory for VC processing
            environment: [
                ...authTemplate.containerConfiguration.environment.filter(env => env.name !== 'SERVICE_NAME'),
                {
                    name: 'SERVICE_NAME',
                    value: 'vc-service',
                },
                {
                    name: 'PORT',
                    value: '8082',
                },
            ],
            secrets: [
                ...authTemplate.containerConfiguration.secrets,
                {
                    name: 'GOOGLE_MAPS_API_KEY',
                    valueFrom: `arn:aws:secretsmanager:${region}:${process.env.AWS_ACCOUNT_ID}:secret:matbakh/google/maps-api-key`,
                    type: 'secretsmanager',
                },
                {
                    name: 'SOCIAL_MEDIA_TOKENS',
                    valueFrom: `arn:aws:secretsmanager:${region}:${process.env.AWS_ACCOUNT_ID}:secret:matbakh/social/tokens`,
                    type: 'secretsmanager',
                },
            ],
        },
        healthCheck: {
            ...authTemplate.healthCheck,
            port: 8082,
        },
        scaling: {
            ...authTemplate.scaling,
            maxCapacity: environment === 'production' ? 20 : 5, // Higher scaling for VC workload
        },
        observability: {
            ...authTemplate.observability,
            metrics: {
                ...authTemplate.observability.metrics,
                dimensions: {
                    ...authTemplate.observability.metrics.dimensions,
                    ServiceName: 'vc-service',
                },
                metrics: {
                    ...authTemplate.observability.metrics.metrics,
                    custom: [
                        {
                            name: 'vc_analyses_completed',
                            unit: 'Count',
                            statistic: 'Sum',
                            description: 'Total VC analyses completed',
                        },
                        {
                            name: 'vc_analysis_duration',
                            unit: 'Milliseconds',
                            statistic: 'Average',
                            description: 'Average VC analysis duration',
                        },
                        {
                            name: 'external_api_calls',
                            unit: 'Count',
                            statistic: 'Sum',
                            description: 'External API calls (Google, Social)',
                        },
                    ],
                },
            },
        },
    };
};