/**
 * AWS SDK v3 Mocks
 * 
 * Shared mocks for AWS SDK v3 clients used in microservices tests
 */

export const makeSend = (handlers: Record<string, any>) =>
    jest.fn().mockImplementation(async (cmd: any) => {
        const name = cmd?.constructor?.name ?? 'Unknown';
        if (handlers[name]) return handlers[name](cmd);
        return {};
    });

// App Mesh Client Mock
export class FakeAppMeshClient {
    send = makeSend({});
}

// Service Discovery Client Mock
export class FakeServiceDiscoveryClient {
    send = makeSend({});
}

// ECS Client Mock
export class FakeEcsClient {
    send = makeSend({});
}

// CloudWatch Client Mock
export class FakeCloudWatchClient {
    send = makeSend({});
}

// Application Auto Scaling Client Mock
export class FakeApplicationAutoScalingClient {
    send = makeSend({});
}

// ECR Client Mock
export class FakeECRClient {
    send = makeSend({});
}

// Secrets Manager Client Mock
export class FakeSecretsManagerClient {
    send = makeSend({});
}

// SSM Client Mock
export class FakeSSMClient {
    send = makeSend({});
}

// X-Ray Client Mock
export class FakeXRayClient {
    send = makeSend({});
}

// Helper to create mock responses
export const createMockResponse = <T>(data: T) => ({
    $metadata: {
        httpStatusCode: 200,
        requestId: 'mock-request-id',
    },
    ...data,
});

// Common mock data
export const mockServiceData = {
    mesh: {
        meshName: 'matbakh-mesh-test',
        meshArn: 'arn:aws:appmesh:eu-central-1:123456789012:mesh/matbakh-mesh-test',
        status: { status: 'ACTIVE' },
    },
    virtualService: {
        virtualServiceName: 'persona.local',
        meshName: 'matbakh-mesh-test',
        status: { status: 'ACTIVE' },
    },
    virtualRouter: {
        virtualRouterName: 'persona-router',
        meshName: 'matbakh-mesh-test',
        status: { status: 'ACTIVE' },
    },
    virtualNode: {
        virtualNodeName: 'persona-v1',
        meshName: 'matbakh-mesh-test',
        status: { status: 'ACTIVE' },
    },
    namespace: {
        Id: 'ns-123456789012345678',
        Name: 'svc.local',
        Type: 'DNS_PRIVATE',
    },
    service: {
        Id: 'srv-123456789012345678',
        Name: 'persona',
        NamespaceId: 'ns-123456789012345678',
    },
    instance: {
        Id: 'inst-123456789012345678',
        Attributes: {
            AWS_INSTANCE_IPV4: '10.0.1.100',
            AWS_INSTANCE_PORT: '8080',
        },
    },
    cluster: {
        clusterArn: 'arn:aws:ecs:eu-central-1:123456789012:cluster/microservices-test',
        clusterName: 'microservices-test',
        status: 'ACTIVE',
    },
    service_ecs: {
        serviceArn: 'arn:aws:ecs:eu-central-1:123456789012:service/microservices-test/persona',
        serviceName: 'persona',
        status: 'ACTIVE',
        runningCount: 2,
        desiredCount: 2,
    },
    taskDefinition: {
        taskDefinitionArn: 'arn:aws:ecs:eu-central-1:123456789012:task-definition/persona:1',
        family: 'persona',
        revision: 1,
        status: 'ACTIVE',
    },
};