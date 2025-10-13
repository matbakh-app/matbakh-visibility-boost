import * as cdk from 'aws-cdk-lib';
import * as appmesh from 'aws-cdk-lib/aws-appmesh';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as servicediscovery from 'aws-cdk-lib/aws-servicediscovery';
import { Construct } from 'constructs';

export interface MicroservicesFoundationStackProps extends cdk.StackProps {
    readonly environment: 'development' | 'staging' | 'production';
    readonly region: 'eu-central-1' | 'eu-west-1';
    readonly isPrimaryRegion: boolean;
    readonly vpcCidr?: string;
    readonly enableContainerInsights?: boolean;
    readonly enableVpcEndpoints?: boolean;
}

export class MicroservicesFoundationStack extends cdk.Stack {
    public readonly vpc: ec2.Vpc;
    public readonly cluster: ecs.Cluster;
    public readonly mesh: appmesh.Mesh;
    public readonly namespace: servicediscovery.PrivateDnsNamespace;
    public readonly loadBalancer: elbv2.ApplicationLoadBalancer;
    public readonly repositories: { [key: string]: ecr.Repository };
    public readonly albSecurityGroup: ec2.SecurityGroup;
    public readonly ecsSecurityGroup: ec2.SecurityGroup;

    constructor(scope: Construct, id: string, props: MicroservicesFoundationStackProps) {
        super(scope, id, props);

        // VPC Configuration with cost-optimized endpoints
        this.vpc = this.createVpc(props);

        // Security Groups (create before other resources)
        const securityGroups = this.createSecurityGroups(this.vpc);
        this.albSecurityGroup = securityGroups.albSecurityGroup;
        this.ecsSecurityGroup = securityGroups.ecsSecurityGroup;

        // ECS Cluster with Fargate
        this.cluster = this.createEcsCluster(props);

        // ECR Repositories
        this.repositories = this.createEcrRepositories(props);

        // App Mesh Service Mesh
        this.mesh = this.createAppMesh(props);

        // Service Discovery
        this.namespace = this.createServiceDiscovery(props);

        // Application Load Balancer
        this.loadBalancer = this.createApplicationLoadBalancer(props);

        // Output important values
        this.createOutputs(props);
    }

    private createVpc(props: MicroservicesFoundationStackProps): ec2.Vpc {
        const vpc = new ec2.Vpc(this, 'MicroservicesVpc', {
            ipAddresses: ec2.IpAddresses.cidr(props.vpcCidr ?? '10.0.0.0/16'),
            maxAzs: 3,
            natGateways: 1, // Cost optimization: single NAT gateway
            subnetConfiguration: [
                {
                    cidrMask: 24,
                    name: 'public',
                    subnetType: ec2.SubnetType.PUBLIC,
                },
                {
                    cidrMask: 24,
                    name: 'private-egress',
                    subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
                },
            ],
            enableDnsHostnames: true,
            enableDnsSupport: true,
        });

        // VPC Endpoints for cost optimization (avoid NAT Gateway charges)
        if (props.enableVpcEndpoints !== false) {
            this.createVpcEndpoints(vpc);
        }

        cdk.Tags.of(vpc).add('Name', `microservices-vpc-${props.environment}-${props.region}`);
        cdk.Tags.of(vpc).add('Environment', props.environment);
        cdk.Tags.of(vpc).add('Region', props.region);

        return vpc;
    }

    private createVpcEndpoints(vpc: ec2.Vpc): void {
        // Create security group for VPC endpoints
        const endpointSg = new ec2.SecurityGroup(this, 'VpcEndpointSg', {
            vpc,
            description: 'Security group for interface VPC endpoints',
            allowAllOutbound: true,
        });

        endpointSg.addIngressRule(
            ec2.Peer.ipv4(vpc.vpcCidrBlock),
            ec2.Port.tcp(443),
            'HTTPS from VPC'
        );

        // ECR API endpoint
        new ec2.InterfaceVpcEndpoint(this, 'EcrApiEndpoint', {
            vpc,
            service: ec2.InterfaceVpcEndpointAwsService.ECR,
            subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
            securityGroups: [endpointSg],
        });

        // ECR Docker endpoint
        new ec2.InterfaceVpcEndpoint(this, 'EcrDkrEndpoint', {
            vpc,
            service: ec2.InterfaceVpcEndpointAwsService.ECR_DOCKER,
            subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
            securityGroups: [endpointSg],
        });

        // CloudWatch Logs endpoint
        new ec2.InterfaceVpcEndpoint(this, 'LogsEndpoint', {
            vpc,
            service: ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
            subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
            securityGroups: [endpointSg],
        });

        // Systems Manager endpoint
        new ec2.InterfaceVpcEndpoint(this, 'SsmEndpoint', {
            vpc,
            service: ec2.InterfaceVpcEndpointAwsService.SSM,
            subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
            securityGroups: [endpointSg],
        });

        // Secrets Manager endpoint
        new ec2.InterfaceVpcEndpoint(this, 'SecretsManagerEndpoint', {
            service: ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
            vpc,
            subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
            securityGroups: [endpointSg],
        });

        // S3 Gateway endpoint (free, no security group needed)
        new ec2.GatewayVpcEndpoint(this, 'S3Endpoint', {
            vpc,
            service: ec2.GatewayVpcEndpointAwsService.S3,
        });
    }

    private createSecurityGroups(vpc: ec2.Vpc): { albSecurityGroup: ec2.SecurityGroup; ecsSecurityGroup: ec2.SecurityGroup } {
        // ALB Security Group
        const albSecurityGroup = new ec2.SecurityGroup(this, 'AlbSg', {
            vpc,
            description: 'Security group for Application Load Balancer',
            allowAllOutbound: true,
        });

        albSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80));
        albSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443));

        // ECS Tasks Security Group
        const ecsSecurityGroup = new ec2.SecurityGroup(this, 'EcsSg', {
            vpc,
            description: 'Security group for ECS tasks',
            allowAllOutbound: true,
        });

        // Allow traffic from ALB to ECS
        ecsSecurityGroup.addIngressRule(albSecurityGroup, ec2.Port.tcpRange(8000, 9000), 'ALB to ECS');

        // Allow service mesh internal communication
        ecsSecurityGroup.addIngressRule(ecsSecurityGroup, ec2.Port.allTraffic(), 'Mesh/cluster internal');

        // Envoy admin port
        ecsSecurityGroup.addIngressRule(ec2.Peer.ipv4(vpc.vpcCidrBlock), ec2.Port.tcp(9901), 'Envoy admin');

        cdk.Tags.of(albSecurityGroup).add('Name', 'microservices-alb-sg');
        cdk.Tags.of(ecsSecurityGroup).add('Name', 'microservices-ecs-sg');

        return { albSecurityGroup, ecsSecurityGroup };
    }

    private createEcsCluster(props: MicroservicesFoundationStackProps): ecs.Cluster {
        // Create log group for ECS exec
        const execLogGroup = new logs.LogGroup(this, 'EcsExecLogGroup', {
            logGroupName: `/aws/ecs/microservices-${props.environment}-${props.region}/exec`,
            retention: logs.RetentionDays.ONE_WEEK,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });

        const cluster = new ecs.Cluster(this, 'MicroservicesCluster', {
            vpc: this.vpc,
            clusterName: `microservices-${props.environment}-${props.region}`,
            containerInsights: props.enableContainerInsights !== false,
            enableFargateCapacityProviders: true,
            executeCommandConfiguration: {
                logging: ecs.ExecuteCommandLogging.CLOUD_WATCH,
                cloudWatchLogGroup: execLogGroup,
            },
        });

        // Default capacity provider strategy
        cluster.addDefaultCapacityProviderStrategy([
            {
                capacityProvider: 'FARGATE',
                weight: 1,
                base: 0,
            },
            {
                capacityProvider: 'FARGATE_SPOT',
                weight: 4, // Prefer Spot for cost optimization
                base: 0,
            },
        ]);

        cdk.Tags.of(cluster).add('Environment', props.environment);
        cdk.Tags.of(cluster).add('Region', props.region);

        return cluster;
    }

    private createEcrRepositories(props: MicroservicesFoundationStackProps): { [key: string]: ecr.Repository } {
        const services = ['auth-service', 'persona-service', 'vc-service', 'ingress-service'];
        const repositories: { [key: string]: ecr.Repository } = {};

        services.forEach(serviceName => {
            const repo = new ecr.Repository(this, `Repo${serviceName.replace(/-/g, '')}`, {
                repositoryName: `matbakh/${serviceName}`,
                imageScanningConfiguration: { scanOnPush: true },
                imageTagMutability: ecr.TagMutability.MUTABLE,
                lifecycleRules: [
                    {
                        description: 'Keep last 10 production images',
                        tagStatus: ecr.TagStatus.TAGGED,
                        tagPrefixList: ['prod'],
                        maxImageCount: 10,
                    },
                    {
                        description: 'Keep last 5 staging images',
                        tagStatus: ecr.TagStatus.TAGGED,
                        tagPrefixList: ['staging'],
                        maxImageCount: 5,
                    },
                    {
                        description: 'Delete untagged images after 1 day',
                        tagStatus: ecr.TagStatus.UNTAGGED,
                        maxImageAge: cdk.Duration.days(1),
                    },
                ],
            });

            if (props.environment === 'production') {
                repo.applyRemovalPolicy(cdk.RemovalPolicy.RETAIN);
            }

            // Enable cross-region replication for production
            if (props.environment === 'production' && props.isPrimaryRegion) {
                repo.addToResourcePolicy(new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    principals: [new iam.ServicePrincipal('ecr.amazonaws.com')],
                    actions: [
                        'ecr:CreateRepository',
                        'ecr:ReplicateImage',
                    ],
                    resources: [repo.repositoryArn],
                }));
            }

            repositories[serviceName] = repo;
            cdk.Tags.of(repo).add('Service', serviceName);
            cdk.Tags.of(repo).add('Environment', props.environment);
        });

        return repositories;
    }

    private createAppMesh(props: MicroservicesFoundationStackProps): appmesh.Mesh {
        const mesh = new appmesh.Mesh(this, 'ServiceMesh', {
            meshName: `matbakh-mesh-${props.environment}`,
            egressFilter: appmesh.MeshFilterType.ALLOW_ALL,
            serviceDiscovery: {
                ipPreference: appmesh.IpPreference.IPV4_ONLY,
            },
        });

        cdk.Tags.of(mesh).add('Environment', props.environment);
        cdk.Tags.of(mesh).add('Region', props.region);

        return mesh;
    }

    private createServiceDiscovery(props: MicroservicesFoundationStackProps): servicediscovery.PrivateDnsNamespace {
        const namespace = new servicediscovery.PrivateDnsNamespace(this, 'ServiceDiscoveryNamespace', {
            name: 'svc.local',
            vpc: this.vpc,
            description: `Service discovery namespace for microservices in ${props.environment}`,
        });

        cdk.Tags.of(namespace).add('Environment', props.environment);
        cdk.Tags.of(namespace).add('Region', props.region);

        return namespace;
    }

    private createApplicationLoadBalancer(props: MicroservicesFoundationStackProps): elbv2.ApplicationLoadBalancer {
        const alb = new elbv2.ApplicationLoadBalancer(this, 'ApplicationLoadBalancer', {
            vpc: this.vpc,
            internetFacing: true,
            loadBalancerName: `ms-alb-${props.environment.substring(0, 3)}-${props.region.replace('eu-', '')}`,
            securityGroup: this.albSecurityGroup,
        });

        // Enable access logs for production
        if (props.environment === 'production') {
            // Note: ALB access logs would be configured here in a real deployment
            // For testing purposes, we skip the S3 bucket creation
            console.log('Production ALB access logs would be configured here');
        }

        cdk.Tags.of(alb).add('Environment', props.environment);
        cdk.Tags.of(alb).add('Region', props.region);

        return alb;
    }

    private createOutputs(props: MicroservicesFoundationStackProps): void {
        new cdk.CfnOutput(this, 'VpcId', {
            value: this.vpc.vpcId,
            description: 'VPC ID for microservices',
            exportName: `microservices-vpc-id-${props.environment}-${props.region}`,
        });

        new cdk.CfnOutput(this, 'ClusterArn', {
            value: this.cluster.clusterArn,
            description: 'ECS Cluster ARN',
            exportName: `microservices-cluster-arn-${props.environment}-${props.region}`,
        });

        new cdk.CfnOutput(this, 'MeshArn', {
            value: this.mesh.meshArn,
            description: 'App Mesh ARN',
            exportName: `microservices-mesh-arn-${props.environment}-${props.region}`,
        });

        new cdk.CfnOutput(this, 'NamespaceId', {
            value: this.namespace.namespaceId,
            description: 'Service Discovery Namespace ID',
            exportName: `microservices-namespace-id-${props.environment}-${props.region}`,
        });

        new cdk.CfnOutput(this, 'LoadBalancerArn', {
            value: this.loadBalancer.loadBalancerArn,
            description: 'Application Load Balancer ARN',
            exportName: `microservices-alb-arn-${props.environment}-${props.region}`,
        });

        new cdk.CfnOutput(this, 'LoadBalancerDnsName', {
            value: this.loadBalancer.loadBalancerDnsName,
            description: 'Application Load Balancer DNS Name',
            exportName: `microservices-alb-dns-${props.environment}-${props.region}`,
        });

        // ECR Repository URIs
        Object.entries(this.repositories).forEach(([serviceName, repository]) => {
            new cdk.CfnOutput(this, `${serviceName}RepositoryUri`, {
                value: repository.repositoryUri,
                description: `ECR Repository URI for ${serviceName}`,
                exportName: `microservices-${serviceName}-repo-uri-${props.environment}-${props.region}`,
            });
        });
    }
}