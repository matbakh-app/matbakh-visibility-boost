#!/usr/bin/env ts-node

/**
 * AWS Environment Setup Script
 * Task 1: AWS Environment Setup
 *
 * This script sets up the foundational AWS infrastructure for the Supabase migration
 * including organization structure, multi-environment setup, VPC, and IAM framework.
 */

import { BudgetsClient, CreateBudgetCommand } from "@aws-sdk/client-budgets";
import {
  AuthorizeSecurityGroupIngressCommand,
  CreateSecurityGroupCommand,
  CreateSubnetCommand,
  CreateVpcCommand,
  EC2Client,
} from "@aws-sdk/client-ec2";
import {
  AttachRolePolicyCommand,
  CreatePolicyCommand,
  CreateRoleCommand,
  IAMClient,
} from "@aws-sdk/client-iam";
import {
  ListAccountsCommand,
  OrganizationsClient,
} from "@aws-sdk/client-organizations";

interface EnvironmentConfig {
  name: string;
  accountId?: string;
  region: string;
  drRegion?: string;
  budgetLimit: number;
}

interface VPCConfig {
  cidr: string;
  publicSubnets: string[];
  privateSubnets: string[];
  availabilityZones: string[];
}

class AWSEnvironmentSetup {
  private organizationsClient: OrganizationsClient;
  private ec2Client: EC2Client;
  private iamClient: IAMClient;
  private budgetsClient: BudgetsClient;

  constructor() {
    this.organizationsClient = new OrganizationsClient({ region: "us-east-1" });
    this.ec2Client = new EC2Client({ region: "eu-central-1" });
    this.iamClient = new IAMClient({ region: "eu-central-1" });
    this.budgetsClient = new BudgetsClient({ region: "us-east-1" });
  }

  /**
   * Task 1.1: Set up AWS Organization and billing structure
   */
  async setupOrganizationAndBilling(): Promise<void> {
    console.log("🏢 Setting up AWS Organization and billing structure...");

    try {
      // List existing accounts
      const listAccountsResponse = await this.organizationsClient.send(
        new ListAccountsCommand({})
      );

      console.log(
        `Found ${listAccountsResponse.Accounts?.length || 0} existing accounts`
      );

      // Create budget alerts for €5,000 monthly limit
      await this.createBudgetAlerts();

      console.log("✅ Organization and billing setup completed");
    } catch (error) {
      console.error("❌ Failed to setup organization:", error);
      throw error;
    }
  }

  /**
   * Task 1.2: Configure multi-environment structure
   */
  async setupMultiEnvironmentStructure(): Promise<void> {
    console.log("🌍 Setting up multi-environment structure...");

    const environments: EnvironmentConfig[] = [
      {
        name: "development",
        region: "eu-central-1",
        budgetLimit: 500,
      },
      {
        name: "staging",
        region: "eu-central-1",
        budgetLimit: 1000,
      },
      {
        name: "production",
        region: "eu-central-1",
        drRegion: "eu-west-1",
        budgetLimit: 3500,
      },
    ];

    for (const env of environments) {
      await this.setupEnvironment(env);
    }

    console.log("✅ Multi-environment structure setup completed");
  }

  /**
   * Task 1.3: Set up VPC and networking infrastructure
   */
  async setupVPCAndNetworking(): Promise<void> {
    console.log("🌐 Setting up VPC and networking infrastructure...");

    const vpcConfigs: Record<string, VPCConfig> = {
      "eu-central-1": {
        cidr: "10.0.0.0/16",
        publicSubnets: ["10.0.1.0/24", "10.0.2.0/24"],
        privateSubnets: ["10.0.10.0/24", "10.0.20.0/24"],
        availabilityZones: ["eu-central-1a", "eu-central-1b"],
      },
      "eu-west-1": {
        cidr: "10.1.0.0/16",
        publicSubnets: ["10.1.1.0/24", "10.1.2.0/24"],
        privateSubnets: ["10.1.10.0/24", "10.1.20.0/24"],
        availabilityZones: ["eu-west-1a", "eu-west-1b"],
      },
    };

    for (const [region, config] of Object.entries(vpcConfigs)) {
      await this.createVPCInfrastructure(region, config);
    }

    console.log("✅ VPC and networking setup completed");
  }

  /**
   * Task 1.4: Implement IAM security framework
   */
  async setupIAMSecurityFramework(): Promise<void> {
    console.log("🔐 Setting up IAM security framework...");

    // Service-linked roles for each AWS service
    const serviceRoles = [
      "MatbakhRDSRole",
      "MatbakhLambdaRole",
      "MatbakhS3Role",
      "MatbakhCognitoRole",
      "MatbakhCloudFrontRole",
    ];

    for (const roleName of serviceRoles) {
      await this.createServiceRole(roleName);
    }

    // Cross-service permissions
    await this.setupCrossServicePermissions();

    console.log("✅ IAM security framework setup completed");
  }

  private async createBudgetAlerts(): Promise<void> {
    const budgetCommand = new CreateBudgetCommand({
      AccountId: process.env.AWS_ACCOUNT_ID || "ACCOUNT_ID",
      Budget: {
        BudgetName: "MatbakhMonthlyBudget",
        BudgetLimit: {
          Amount: "5000",
          Unit: "EUR",
        },
        TimeUnit: "MONTHLY",
        BudgetType: "COST",
        CostFilters: {
          TagKey: ["Project"],
          TagValue: ["Matbakh"],
        },
      },
      NotificationsWithSubscribers: [
        {
          Notification: {
            NotificationType: "ACTUAL",
            ComparisonOperator: "GREATER_THAN",
            Threshold: 80,
            ThresholdType: "PERCENTAGE",
          },
          Subscribers: [
            {
              SubscriptionType: "EMAIL",
              Address: "alerts@matbakh.app",
            },
          ],
        },
      ],
    });

    await this.budgetsClient.send(budgetCommand);
    console.log("💰 Budget alerts configured for €5,000 monthly limit");
  }

  private async setupEnvironment(env: EnvironmentConfig): Promise<void> {
    console.log(`🔧 Setting up ${env.name} environment...`);

    // Create environment-specific budget
    await this.createEnvironmentBudget(env);

    // Set up cross-account IAM roles
    await this.createCrossAccountRole(env.name);

    console.log(`✅ ${env.name} environment setup completed`);
  }

  private async createVPCInfrastructure(
    region: string,
    config: VPCConfig
  ): Promise<void> {
    const ec2Client = new EC2Client({ region });

    // Create VPC
    const vpcResponse = await ec2Client.send(
      new CreateVpcCommand({
        CidrBlock: config.cidr,
        TagSpecifications: [
          {
            ResourceType: "vpc",
            Tags: [
              { Key: "Name", Value: `matbakh-vpc-${region}` },
              { Key: "Project", Value: "Matbakh" },
              { Key: "Environment", Value: "production" },
            ],
          },
        ],
      })
    );

    const vpcId = vpcResponse.Vpc?.VpcId;
    console.log(`🌐 Created VPC ${vpcId} in ${region}`);

    // Create subnets
    for (let i = 0; i < config.publicSubnets.length; i++) {
      await ec2Client.send(
        new CreateSubnetCommand({
          VpcId: vpcId,
          CidrBlock: config.publicSubnets[i],
          AvailabilityZone: config.availabilityZones[i],
          TagSpecifications: [
            {
              ResourceType: "subnet",
              Tags: [
                {
                  Key: "Name",
                  Value: `matbakh-public-subnet-${i + 1}-${region}`,
                },
                { Key: "Type", Value: "Public" },
                { Key: "Project", Value: "Matbakh" },
              ],
            },
          ],
        })
      );
    }

    for (let i = 0; i < config.privateSubnets.length; i++) {
      await ec2Client.send(
        new CreateSubnetCommand({
          VpcId: vpcId,
          CidrBlock: config.privateSubnets[i],
          AvailabilityZone: config.availabilityZones[i],
          TagSpecifications: [
            {
              ResourceType: "subnet",
              Tags: [
                {
                  Key: "Name",
                  Value: `matbakh-private-subnet-${i + 1}-${region}`,
                },
                { Key: "Type", Value: "Private" },
                { Key: "Project", Value: "Matbakh" },
              ],
            },
          ],
        })
      );
    }

    // Create security groups
    await this.createSecurityGroups(ec2Client, vpcId!);

    console.log(`✅ VPC infrastructure created in ${region}`);
  }

  private async createSecurityGroups(
    ec2Client: EC2Client,
    vpcId: string
  ): Promise<void> {
    // Database security group (PostgreSQL)
    const dbSgResponse = await ec2Client.send(
      new CreateSecurityGroupCommand({
        GroupName: "matbakh-database-sg",
        Description: "Security group for RDS PostgreSQL instances",
        VpcId: vpcId,
        TagSpecifications: [
          {
            ResourceType: "security-group",
            Tags: [
              { Key: "Name", Value: "matbakh-database-sg" },
              { Key: "Project", Value: "Matbakh" },
            ],
          },
        ],
      })
    );

    // Allow PostgreSQL access from Lambda security group only
    await ec2Client.send(
      new AuthorizeSecurityGroupIngressCommand({
        GroupId: dbSgResponse.GroupId,
        IpPermissions: [
          {
            IpProtocol: "tcp",
            FromPort: 5432,
            ToPort: 5432,
            UserIdGroupPairs: [
              {
                GroupId: "sg-lambda", // Will be created separately
                Description: "Lambda functions access to database",
              },
            ],
          },
        ],
      })
    );

    console.log("🔒 Security groups created with least privilege access");
  }

  private async createServiceRole(roleName: string): Promise<void> {
    const trustPolicy = {
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: {
            Service: this.getServicePrincipal(roleName),
          },
          Action: "sts:AssumeRole",
        },
      ],
    };

    await this.iamClient.send(
      new CreateRoleCommand({
        RoleName: roleName,
        AssumeRolePolicyDocument: JSON.stringify(trustPolicy),
        Description: `Service role for ${roleName}`,
        Tags: [
          { Key: "Project", Value: "Matbakh" },
          { Key: "Purpose", Value: "ServiceRole" },
        ],
      })
    );

    console.log(`🔑 Created service role: ${roleName}`);
  }

  private getServicePrincipal(roleName: string): string {
    const servicePrincipals: Record<string, string> = {
      MatbakhRDSRole: "rds.amazonaws.com",
      MatbakhLambdaRole: "lambda.amazonaws.com",
      MatbakhS3Role: "s3.amazonaws.com",
      MatbakhCognitoRole: "cognito-idp.amazonaws.com",
      MatbakhCloudFrontRole: "cloudfront.amazonaws.com",
    };

    return servicePrincipals[roleName] || "lambda.amazonaws.com";
  }

  private async setupCrossServicePermissions(): Promise<void> {
    // Create policy for Lambda to access RDS
    const lambdaRdsPolicy = {
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Action: ["rds-db:connect"],
          Resource: "arn:aws:rds-db:eu-central-1:*:dbuser:*/lambda-user",
        },
      ],
    };

    const policyResponse = await this.iamClient.send(
      new CreatePolicyCommand({
        PolicyName: "MatbakhLambdaRDSAccess",
        PolicyDocument: JSON.stringify(lambdaRdsPolicy),
        Description: "Allow Lambda functions to connect to RDS",
      })
    );

    // Attach policy to Lambda role
    await this.iamClient.send(
      new AttachRolePolicyCommand({
        RoleName: "MatbakhLambdaRole",
        PolicyArn: policyResponse.Policy?.Arn,
      })
    );

    console.log("🔗 Cross-service permissions configured");
  }

  private async createEnvironmentBudget(env: EnvironmentConfig): Promise<void> {
    const budgetCommand = new CreateBudgetCommand({
      AccountId: process.env.AWS_ACCOUNT_ID || "ACCOUNT_ID",
      Budget: {
        BudgetName: `Matbakh${
          env.name.charAt(0).toUpperCase() + env.name.slice(1)
        }Budget`,
        BudgetLimit: {
          Amount: env.budgetLimit.toString(),
          Unit: "EUR",
        },
        TimeUnit: "MONTHLY",
        BudgetType: "COST",
        CostFilters: {
          TagKey: ["Environment"],
          TagValue: [env.name],
        },
      },
    });

    await this.budgetsClient.send(budgetCommand);
    console.log(`💰 Budget configured for ${env.name}: €${env.budgetLimit}`);
  }

  private async createCrossAccountRole(environment: string): Promise<void> {
    const crossAccountPolicy = {
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: {
            AWS: `arn:aws:iam::${process.env.MASTER_ACCOUNT_ID}:root`,
          },
          Action: "sts:AssumeRole",
          Condition: {
            StringEquals: {
              "sts:ExternalId": `matbakh-${environment}-access`,
            },
          },
        },
      ],
    };

    await this.iamClient.send(
      new CreateRoleCommand({
        RoleName: `MatbakhCrossAccount${
          environment.charAt(0).toUpperCase() + environment.slice(1)
        }Role`,
        AssumeRolePolicyDocument: JSON.stringify(crossAccountPolicy),
        Description: `Cross-account access role for ${environment} environment`,
      })
    );

    console.log(`🔄 Cross-account role created for ${environment}`);
  }

  /**
   * Execute all AWS environment setup tasks
   */
  async execute(): Promise<void> {
    console.log("🚀 Starting AWS Environment Setup...\n");

    try {
      await this.setupOrganizationAndBilling();
      await this.setupMultiEnvironmentStructure();
      await this.setupVPCAndNetworking();
      await this.setupIAMSecurityFramework();

      console.log("\n🎉 AWS Environment Setup completed successfully!");
      console.log("📋 Next steps:");
      console.log("  1. Run database infrastructure setup (Task 2)");
      console.log("  2. Verify all security groups and IAM roles");
      console.log("  3. Test cross-account access");
      console.log("  4. Validate budget alerts are working");
    } catch (error) {
      console.error("\n❌ AWS Environment Setup failed:", error);
      throw error;
    }
  }
}

// Execute if run directly
if (require.main === module) {
  const setup = new AWSEnvironmentSetup();
  setup.execute().catch(console.error);
}

export { AWSEnvironmentSetup };
