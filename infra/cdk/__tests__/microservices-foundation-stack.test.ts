/**
 * Microservices Foundation Stack Tests
 * 
 * Comprehensive tests for the CDK infrastructure stack including
 * VPC, ECS, ECR, App Mesh, and security configurations.
 */

import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { MicroservicesFoundationStack } from '../microservices-foundation-stack';

describe('MicroservicesFoundationStack', () => {
    let app: cdk.App;
    let template: Template;

    beforeEach(() => {
        app = new cdk.App();
    });

    describe('Development Environment', () => {
        beforeEach(() => {
            const stack = new MicroservicesFoundationStack(app, 'TestStack', {
                environment: 'development',
                region: 'eu-central-1',
                isPrimaryRegion: true,
                enableContainerInsights: true,
                enableVpcEndpoints: true,
            });
            template = Template.fromStack(stack);
        });

        it('should create VPC with correct configuration', () => {
            template.hasResourceProperties('AWS::EC2::VPC', {
                CidrBlock: '10.0.0.0/16',
                EnableDnsHostnames: true,
                EnableDnsSupport: true,
            });

            // Should have public and private subnets
            template.resourceCountIs('AWS::EC2::Subnet', 6); // 3 AZs * 2 subnet types

            // Should have single NAT Gateway for cost optimization
            template.resourceCountIs('AWS::EC2::NatGateway', 1);
        });

        it('should create VPC endpoints for cost optimization', () => {
            // ECR API endpoint
            template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
                ServiceName: Match.stringLikeRegexp('.*ecr\\.api.*'),
                VpcEndpointType: 'Interface',
            });

            // ECR Docker endpoint
            template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
                ServiceName: Match.stringLikeRegexp('.*ecr\\.dkr.*'),
                VpcEndpointType: 'Interface',
            });

            // CloudWatch Logs endpoint
            template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
                ServiceName: Match.stringLikeRegexp('.*logs.*'),
                VpcEndpointType: 'Interface',
            });

            // S3 Gateway endpoint (free)
            template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
                ServiceName: Match.stringLikeRegexp('.*s3.*'),
                VpcEndpointType: 'Gateway',
            });
        });

        it('should create security groups with proper rules', () => {
            // ALB Security Group
            template.hasResourceProperties('AWS::EC2::SecurityGroup', {
                GroupDescription: 'Security group for Application Load Balancer',
                SecurityGroupIngress: [
                    {
                        IpProtocol: 'tcp',
                        FromPort: 80,
                        ToPort: 80,
                        CidrIp: '0.0.0.0/0',
                    },
                    {
                        IpProtocol: 'tcp',
                        FromPort: 443,
                        ToPort: 443,
                        CidrIp: '0.0.0.0/0',
                    },
                ],
            });

            // ECS Security Group
            template.hasResourceProperties('AWS::EC2::SecurityGroup', {
                GroupDescription: 'Security group for ECS tasks',
                SecurityGroupIngress: Match.arrayWith([
                    Match.objectLike({
                        IpProtocol: 'tcp',
                        FromPort: 8000,
                        ToPort: 9000,
                    }),
                ]),
            });
        });

        it('should create ECS cluster with Fargate', () => {
            template.hasResourceProperties('AWS::ECS::Cluster', {
                ClusterName: 'microservices-development-eu-central-1',
                ClusterSettings: [
                    {
                        Name: 'containerInsights',
                        Value: 'enabled',
                    },
                ],
            });

            // Should have capacity providers
            template.hasResourceProperties('AWS::ECS::ClusterCapacityProviderAssociations', {
                CapacityProviders: ['FARGATE', 'FARGATE_SPOT'],
                DefaultCapacityProviderStrategy: [
                    {
                        CapacityProvider: 'FARGATE',
                        Weight: 1,
                        Base: 0,
                    },
                    {
                        CapacityProvider: 'FARGATE_SPOT',
                        Weight: 4,
                        Base: 0,
                    },
                ],
            });
        });

        it('should create ECR repositories with lifecycle policies', () => {
            const expectedServices = ['auth-service', 'persona-service', 'vc-service', 'ingress-service'];

            expectedServices.forEach(serviceName => {
                template.hasResourceProperties('AWS::ECR::Repository', {
                    RepositoryName: `matbakh/${serviceName}`,
                    ImageScanningConfiguration: {
                        ScanOnPush: true,
                    },
                    ImageTagMutability: 'MUTABLE',
                    LifecyclePolicy: {
                        LifecyclePolicyText: Match.stringLikeRegexp('.*prod.*staging.*'),
                    },
                });
            });
        });

        it('should create App Mesh', () => {
            template.hasResourceProperties('AWS::AppMesh::Mesh', {
                MeshName: 'matbakh-mesh-development',
                Spec: {
                    EgressFilter: {
                        Type: 'ALLOW_ALL',
                    },
                    ServiceDiscovery: {
                        IpPreference: 'IPv4_ONLY',
                    },
                },
            });
        });

        it('should create service discovery namespace', () => {
            template.hasResourceProperties('AWS::ServiceDiscovery::PrivateDnsNamespace', {
                Name: 'svc.local',
                Description: 'Service discovery namespace for microservices in development',
            });
        });

        it('should create Application Load Balancer', () => {
            template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
                Name: 'microservices-alb-development-eu-central-1',
                Scheme: 'internet-facing',
                Type: 'application',
            });
        });

        it('should create CloudWatch log group for ECS exec', () => {
            template.hasResourceProperties('AWS::Logs::LogGroup', {
                LogGroupName: '/aws/ecs/microservices-development-eu-central-1/exec',
                RetentionInDays: 7,
            });
        });

        it('should output important values', () => {
            template.hasOutput('VpcId', {
                Description: 'VPC ID for microservices',
                Export: {
                    Name: 'microservices-vpc-id-development-eu-central-1',
                },
            });

            template.hasOutput('ClusterArn', {
                Description: 'ECS Cluster ARN',
                Export: {
                    Name: 'microservices-cluster-arn-development-eu-central-1',
                },
            });

            template.hasOutput('MeshArn', {
                Description: 'App Mesh ARN',
                Export: {
                    Name: 'microservices-mesh-arn-development-eu-central-1',
                },
            });
        });

        it('should have proper tags', () => {
            // Check that resources are tagged appropriately
            template.hasResourceProperties('AWS::EC2::VPC', {
                Tags: Match.arrayWith([
                    {
                        Key: 'Name',
                        Value: 'microservices-vpc-development-eu-central-1',
                    },
                    {
                        Key: 'Environment',
                        Value: 'development',
                    },
                    {
                        Key: 'Region',
                        Value: 'eu-central-1',
                    },
                ]),
            });
        });
    });

    describe('Production Environment', () => {
        beforeEach(() => {
            const stack = new MicroservicesFoundationStack(app, 'ProdStack', {
                environment: 'production',
                region: 'eu-central-1',
                isPrimaryRegion: true,
                enableContainerInsights: true,
                enableVpcEndpoints: true,
            });
            template = Template.fromStack(stack);
        });

        it('should retain ECR repositories in production', () => {
            template.hasResourceProperties('AWS::ECR::Repository', {
                RepositoryName: Match.stringLikeRegexp('matbakh/.*'),
                DeletionPolicy: 'Retain',
            });
        });

        it('should enable ALB access logs in production', () => {
            template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
                LoadBalancerAttributes: Match.arrayWith([
                    Match.objectLike({
                        Key: 'access_logs.s3.enabled',
                        Value: 'true',
                    }),
                ]),
            });
        });

        it('should have production-specific configuration', () => {
            template.hasResourceProperties('AWS::ECS::Cluster', {
                ClusterName: 'microservices-production-eu-central-1',
            });

            template.hasResourceProperties('AWS::AppMesh::Mesh', {
                MeshName: 'matbakh-mesh-production',
            });
        });
    });

    describe('Secondary Region', () => {
        beforeEach(() => {
            const stack = new MicroservicesFoundationStack(app, 'SecondaryStack', {
                environment: 'production',
                region: 'eu-west-1',
                isPrimaryRegion: false,
                enableContainerInsights: true,
                enableVpcEndpoints: true,
            });
            template = Template.fromStack(stack);
        });

        it('should create resources in secondary region', () => {
            template.hasResourceProperties('AWS::ECS::Cluster', {
                ClusterName: 'microservices-production-eu-west-1',
            });

            template.hasOutput('VpcId', {
                Export: {
                    Name: 'microservices-vpc-id-production-eu-west-1',
                },
            });
        });

        it('should not enable cross-region replication for non-primary region', () => {
            // ECR repositories should not have replication policy in secondary region
            const ecrResources = template.findResources('AWS::ECR::Repository');
            Object.values(ecrResources).forEach(resource => {
                expect(resource.Properties?.ReplicationConfiguration).toBeUndefined();
            });
        });
    });

    describe('Cost Optimization Features', () => {
        beforeEach(() => {
            const stack = new MicroservicesFoundationStack(app, 'CostOptStack', {
                environment: 'development',
                region: 'eu-central-1',
                isPrimaryRegion: true,
                enableVpcEndpoints: true,
            });
            template = Template.fromStack(stack);
        });

        it('should use single NAT Gateway for cost optimization', () => {
            template.resourceCountIs('AWS::EC2::NatGateway', 1);
        });

        it('should prefer Fargate Spot for cost optimization', () => {
            template.hasResourceProperties('AWS::ECS::ClusterCapacityProviderAssociations', {
                DefaultCapacityProviderStrategy: [
                    {
                        CapacityProvider: 'FARGATE',
                        Weight: 1,
                    },
                    {
                        CapacityProvider: 'FARGATE_SPOT',
                        Weight: 4, // Higher weight for Spot
                    },
                ],
            });
        });

        it('should create VPC endpoints to avoid NAT Gateway charges', () => {
            // Should have multiple interface endpoints
            const vpcEndpoints = template.findResources('AWS::EC2::VPCEndpoint');
            const interfaceEndpoints = Object.values(vpcEndpoints).filter(
                endpoint => endpoint.Properties?.VpcEndpointType === 'Interface'
            );

            expect(interfaceEndpoints.length).toBeGreaterThan(3);
        });
    });

    describe('Security Configuration', () => {
        beforeEach(() => {
            const stack = new MicroservicesFoundationStack(app, 'SecurityStack', {
                environment: 'production',
                region: 'eu-central-1',
                isPrimaryRegion: true,
            });
            template = Template.fromStack(stack);
        });

        it('should create security groups with least privilege', () => {
            // ECS security group should only allow necessary ports
            template.hasResourceProperties('AWS::EC2::SecurityGroup', {
                GroupDescription: 'Security group for ECS tasks',
                SecurityGroupIngress: Match.arrayWith([
                    // Should allow ALB to ECS communication
                    Match.objectLike({
                        IpProtocol: 'tcp',
                        FromPort: 8000,
                        ToPort: 9000,
                    }),
                    // Should allow service mesh communication
                    Match.objectLike({
                        IpProtocol: '-1',
                    }),
                    // Should allow Envoy admin ports
                    Match.objectLike({
                        IpProtocol: 'tcp',
                        FromPort: 9901,
                        ToPort: 9901,
                    }),
                ]),
            });
        });

        it('should enable container image scanning', () => {
            template.hasResourceProperties('AWS::ECR::Repository', {
                ImageScanningConfiguration: {
                    ScanOnPush: true,
                },
            });
        });

        it('should configure proper lifecycle policies', () => {
            template.hasResourceProperties('AWS::ECR::Repository', {
                LifecyclePolicy: {
                    LifecyclePolicyText: Match.stringLikeRegexp('.*prod.*staging.*untagged.*'),
                },
            });
        });
    });

    describe('Multi-AZ Configuration', () => {
        beforeEach(() => {
            const stack = new MicroservicesFoundationStack(app, 'MultiAZStack', {
                environment: 'production',
                region: 'eu-central-1',
                isPrimaryRegion: true,
            });
            template = Template.fromStack(stack);
        });

        it('should create subnets across 3 AZs', () => {
            // Should have 6 subnets (3 public + 3 private)
            template.resourceCountIs('AWS::EC2::Subnet', 6);

            // Check that subnets are distributed across AZs
            const subnets = template.findResources('AWS::EC2::Subnet');
            const azs = new Set();

            Object.values(subnets).forEach(subnet => {
                if (subnet.Properties?.AvailabilityZone) {
                    azs.add(subnet.Properties.AvailabilityZone);
                }
            });

            expect(azs.size).toBe(3);
        });

        it('should configure ALB across multiple AZs', () => {
            template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
                Scheme: 'internet-facing',
                Subnets: Match.arrayWith([
                    Match.anyValue(),
                    Match.anyValue(),
                    Match.anyValue(),
                ]),
            });
        });
    });

    describe('Error Handling', () => {
        it('should handle missing environment parameter', () => {
            expect(() => {
                new MicroservicesFoundationStack(app, 'ErrorStack', {
                    environment: undefined as any,
                    region: 'eu-central-1',
                    isPrimaryRegion: true,
                });
            }).toThrow();
        });

        it('should handle invalid region parameter', () => {
            expect(() => {
                new MicroservicesFoundationStack(app, 'ErrorStack', {
                    environment: 'development',
                    region: 'invalid-region' as any,
                    isPrimaryRegion: true,
                });
            }).toThrow();
        });
    });

    describe('Resource Naming', () => {
        beforeEach(() => {
            const stack = new MicroservicesFoundationStack(app, 'NamingStack', {
                environment: 'staging',
                region: 'eu-west-1',
                isPrimaryRegion: false,
            });
            template = Template.fromStack(stack);
        });

        it('should use consistent naming convention', () => {
            template.hasResourceProperties('AWS::ECS::Cluster', {
                ClusterName: 'microservices-staging-eu-west-1',
            });

            template.hasResourceProperties('AWS::AppMesh::Mesh', {
                MeshName: 'matbakh-mesh-staging',
            });

            template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
                Name: 'microservices-alb-staging-eu-west-1',
            });
        });

        it('should export resources with consistent names', () => {
            template.hasOutput('VpcId', {
                Export: {
                    Name: 'microservices-vpc-id-staging-eu-west-1',
                },
            });

            template.hasOutput('ClusterArn', {
                Export: {
                    Name: 'microservices-cluster-arn-staging-eu-west-1',
                },
            });
        });
    });
});