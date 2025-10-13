import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as evidently from 'aws-cdk-lib/aws-evidently'; // L1 Cfn* resources
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export interface AiOrchestrationStackProps extends cdk.StackProps {
    vpc: ec2.IVpc;
    cluster: ecs.ICluster;
    environment: 'development' | 'staging' | 'production';
    regionCode: string; // e.g. 'eu-central-1'
    aiGatewayImage?: string; // optional override
}

export class AiOrchestrationStack extends cdk.Stack {
    readonly gatewaySg: ec2.SecurityGroup;

    constructor(scope: Construct, id: string, props: AiOrchestrationStackProps) {
        super(scope, id, props);

        // --- 1) VPC Interface Endpoints (Bedrock/Logs/Secrets/STS)
        const vpceSg = new ec2.SecurityGroup(this, 'AiVpceSg', {
            vpc: props.vpc,
            description: 'SG for AI VPC endpoints',
            allowAllOutbound: true,
        });
        vpceSg.addIngressRule(ec2.Peer.ipv4(props.vpc.vpcCidrBlock), ec2.Port.tcp(443), 'VPC access to endpoints');

        const region = cdk.Stack.of(this).region || props.regionCode;

        const mkIfaceEndpoint = (id: string, serviceName: string) =>
            new ec2.InterfaceVpcEndpoint(this, id, {
                vpc: props.vpc,
                service: new ec2.InterfaceVpcEndpointService(`com.amazonaws.${region}.${serviceName}`, 443),
                privateDnsEnabled: true,
                securityGroups: [vpceSg],
            });

        // Bedrock runtime + (optionally) agents runtimes if you plan to use them soon
        mkIfaceEndpoint('BedrockRuntimeVpce', 'bedrock-runtime');
        // mkIfaceEndpoint('BedrockAgentsRuntimeVpce', 'bedrock-agent-runtime'); // enable when needed

        // Core supporting endpoints
        mkIfaceEndpoint('LogsVpce', 'logs');
        mkIfaceEndpoint('SecretsManagerVpce', 'secretsmanager');
        mkIfaceEndpoint('StsVpce', 'sts');

        // --- 2) ECS Fargate Service: ai-gateway (HTTP streaming, routing, adapters)
        this.gatewaySg = new ec2.SecurityGroup(this, 'AiGatewaySg', {
            vpc: props.vpc,
            description: 'AI Gateway',
            allowAllOutbound: true,
        });

        const logGroup = new logs.LogGroup(this, 'AiGatewayLogs', {
            logGroupName: `/matbakh/ai-gateway/${props.environment}`,
            retention: props.environment === 'production' ? logs.RetentionDays.THIRTY_DAYS : logs.RetentionDays.SEVEN_DAYS,
            removalPolicy: props.environment === 'production' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
        });

        const taskRole = new iam.Role(this, 'AiGatewayTaskRole', {
            assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
            description: 'Task role for AI Gateway to call Bedrock/Secrets/Logs/Evidently',
        });

        // Least-privilege policies (tighten as you harden)
        taskRole.addToPolicy(new iam.PolicyStatement({
            actions: [
                'bedrock:InvokeModel',
                'bedrock:InvokeModelWithResponseStream',
                // optional when using knowledge bases or agents later:
                'bedrock:Retrieve', 'bedrock:RetrieveAndGenerate'
            ],
            resources: ['*'],
        }));
        taskRole.addToPolicy(new iam.PolicyStatement({
            actions: ['evidently:PutProjectEvents', 'evidently:EvaluateFeature'],
            resources: ['*'],
        }));
        taskRole.addToPolicy(new iam.PolicyStatement({
            actions: ['secretsmanager:GetSecretValue'],
            resources: ['*'],
        }));

        const executionRole = new iam.Role(this, 'AiGatewayExecutionRole', {
            assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
        });
        executionRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'));

        const taskDef = new ecs.FargateTaskDefinition(this, 'AiGatewayTaskDef', {
            cpu: 1024,
            memoryLimitMiB: 2048,
            taskRole,
            executionRole,
        });

        const image = ecs.ContainerImage.fromRegistry(
            props.aiGatewayImage ?? 'public.ecr.aws/docker/library/node:20-alpine'
        );

        const container = taskDef.addContainer('GatewayContainer', {
            image,
            logging: ecs.LogDrivers.awsLogs({ logGroup, streamPrefix: 'ai' }),
            environment: {
                NODE_ENV: props.environment,
                EVIDENTLY_PROJECT: `matbakh-ai-${props.environment}`,
                MODEL_ROUTE_FEATURE: 'model_route',
            },
        });
        container.addPortMappings({ containerPort: 8080, hostPort: 8080, protocol: ecs.Protocol.TCP });

        const service = new ecsPatterns.ApplicationLoadBalancedFargateService(this, 'AiGatewayService', {
            cluster: props.cluster,
            cpu: 1024,
            desiredCount: 2,
            memoryLimitMiB: 2048,
            publicLoadBalancer: false, // internal
            listenerPort: 80,
            taskDefinition: taskDef,
            securityGroups: [this.gatewaySg],
        });

        // Autoscaling policies (latency-aware via custom CW metric optional)
        const scalable = service.service.autoScaleTaskCount({ minCapacity: 2, maxCapacity: 20 });
        scalable.scaleOnCpuUtilization('CpuScale', { targetUtilizationPercent: 60 });

        // --- 3) Evidently Project + Feature for Routing (A/B/A-B/n)
        const project = new evidently.CfnProject(this, 'AiEvidentlyProject', {
            name: `matbakh-ai-${props.environment}`,
        });

        const feature = new evidently.CfnFeature(this, 'ModelRouteFeature', {
            name: 'model_route',
            project: project.name!,
            variations: [
                { variationName: 'bedrock', booleanValue: false },
                { variationName: 'google', booleanValue: false },
                { variationName: 'meta', booleanValue: false },
            ],
            defaultVariation: 'bedrock',
        });
        feature.addDependency(project);

        new cdk.CfnOutput(this, 'AiGatewayUrl', {
            value: `http://${service.loadBalancer.loadBalancerDnsName}`,
            exportName: `ai-gateway-url-${props.environment}-${props.regionCode}`,
        });
    }
}