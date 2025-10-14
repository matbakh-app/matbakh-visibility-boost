#!/usr/bin/env tsx

/**
 * Deployment Script for CloudWatch Evidently Optimization Infrastructure
 *
 * Deploys:
 * - Evidently project and features
 * - CDK infrastructure stack
 * - Lambda initializer function
 * - CloudWatch monitoring and dashboards
 */

import { execSync } from "child_process";
import { existsSync, readFileSync } from "fs";

interface DeploymentConfig {
  environment: "development" | "staging" | "production";
  region: string;
  projectName?: string;
  skipTests?: boolean;
  dryRun?: boolean;
}

class EvidentlyDeploymentManager {
  private config: DeploymentConfig;
  private startTime: number;

  constructor(config: DeploymentConfig) {
    this.config = config;
    this.startTime = Date.now();
  }

  async deploy(): Promise<void> {
    console.log("🚀 Starting CloudWatch Evidently Optimization Deployment");
    console.log(`Environment: ${this.config.environment}`);
    console.log(`Region: ${this.config.region}`);
    console.log(
      `Project: ${this.config.projectName || "matbakh-system-optimization"}`
    );
    console.log("─".repeat(60));

    try {
      // Step 1: Pre-deployment validation
      await this.validatePrerequisites();

      // Step 2: Run tests (unless skipped)
      if (!this.config.skipTests) {
        await this.runTests();
      }

      // Step 3: Build and validate CDK
      await this.buildCDK();

      // Step 4: Deploy infrastructure
      if (!this.config.dryRun) {
        await this.deployInfrastructure();
      }

      // Step 5: Initialize Evidently project
      if (!this.config.dryRun) {
        await this.initializeEvidently();
      }

      // Step 6: Verify deployment
      if (!this.config.dryRun) {
        await this.verifyDeployment();
      }

      // Step 7: Generate deployment report
      await this.generateReport();

      console.log("✅ Deployment completed successfully!");
      console.log(
        `Total time: ${((Date.now() - this.startTime) / 1000).toFixed(1)}s`
      );
    } catch (error) {
      console.error("❌ Deployment failed:", error);
      process.exit(1);
    }
  }

  private async validatePrerequisites(): Promise<void> {
    console.log("🔍 Validating prerequisites...");

    // Check AWS CLI
    try {
      execSync("aws --version", { stdio: "pipe" });
    } catch {
      throw new Error(
        "AWS CLI not found. Please install and configure AWS CLI."
      );
    }

    // Check AWS credentials
    try {
      execSync("aws sts get-caller-identity", { stdio: "pipe" });
    } catch {
      throw new Error(
        "AWS credentials not configured. Please run `aws configure`."
      );
    }

    // Check CDK
    try {
      execSync("cdk --version", { stdio: "pipe" });
    } catch {
      throw new Error(
        "AWS CDK not found. Please install with `npm install -g aws-cdk`."
      );
    }

    // Check Node.js version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split(".")[0]);
    if (majorVersion < 18) {
      throw new Error(
        `Node.js ${nodeVersion} is not supported. Please use Node.js 18 or later.`
      );
    }

    // Check required files
    const requiredFiles = [
      "infra/cdk/evidently-optimization-stack.ts",
      "src/lib/optimization/evidently-integration.ts",
      "package.json",
    ];

    for (const file of requiredFiles) {
      if (!existsSync(file)) {
        throw new Error(`Required file not found: ${file}`);
      }
    }

    console.log("✅ Prerequisites validated");
  }

  private async runTests(): Promise<void> {
    console.log("🧪 Running tests...");

    try {
      // Run Evidently integration tests
      execSync(
        "npm test -- src/lib/optimization/__tests__/evidently-integration.test.ts",
        {
          stdio: "inherit",
        }
      );

      // Run hook tests
      execSync(
        "npm test -- src/hooks/__tests__/useEvidentlyOptimization.test.tsx",
        {
          stdio: "inherit",
        }
      );

      console.log("✅ All tests passed");
    } catch (error) {
      throw new Error(
        "Tests failed. Please fix failing tests before deployment."
      );
    }
  }

  private async buildCDK(): Promise<void> {
    console.log("🏗️ Building CDK infrastructure...");

    try {
      // Change to infra directory
      process.chdir("infra");

      // Install dependencies
      execSync("npm install", { stdio: "inherit" });

      // Build TypeScript
      execSync("npm run build", { stdio: "inherit" });

      // Synthesize CDK
      execSync(
        `cdk synth EvidentlyOptimizationStack --context environment=${this.config.environment}`,
        {
          stdio: "inherit",
        }
      );

      console.log("✅ CDK build completed");
    } catch (error) {
      throw new Error(`CDK build failed: ${error}`);
    } finally {
      // Return to root directory
      process.chdir("..");
    }
  }

  private async deployInfrastructure(): Promise<void> {
    console.log("🚀 Deploying infrastructure...");

    try {
      process.chdir("infra");

      const stackName = `EvidentlyOptimizationStack-${this.config.environment}`;
      const deployCommand = [
        "cdk deploy",
        stackName,
        "--require-approval never",
        `--context environment=${this.config.environment}`,
        `--context region=${this.config.region}`,
      ];

      if (this.config.projectName) {
        deployCommand.push(`--context projectName=${this.config.projectName}`);
      }

      execSync(deployCommand.join(" "), { stdio: "inherit" });

      console.log("✅ Infrastructure deployed");
    } catch (error) {
      throw new Error(`Infrastructure deployment failed: ${error}`);
    } finally {
      process.chdir("..");
    }
  }

  private async initializeEvidently(): Promise<void> {
    console.log("🎯 Initializing Evidently project...");

    try {
      const projectName =
        this.config.projectName || "matbakh-system-optimization";

      // Get the initializer Lambda function name from CDK outputs
      const stackName = `EvidentlyOptimizationStack-${this.config.environment}`;
      const outputsCommand = `aws cloudformation describe-stacks --stack-name ${stackName} --region ${this.config.region} --query "Stacks[0].Outputs"`;

      const outputs = JSON.parse(
        execSync(outputsCommand, { encoding: "utf8" })
      );
      const initializerArn = outputs.find(
        (output: any) => output.OutputKey === "InitializerLambdaArn"
      )?.OutputValue;

      if (!initializerArn) {
        throw new Error("Initializer Lambda ARN not found in stack outputs");
      }

      // Invoke the initializer Lambda
      const invokeCommand = [
        "aws lambda invoke",
        "--function-name",
        initializerArn,
        "--region",
        this.config.region,
        "--payload",
        JSON.stringify({ source: "deployment-script" }),
        "/tmp/evidently-init-response.json",
      ];

      execSync(invokeCommand.join(" "), { stdio: "inherit" });

      // Check response
      const response = JSON.parse(
        readFileSync("/tmp/evidently-init-response.json", "utf8")
      );
      if (response.statusCode !== 200) {
        throw new Error(`Initialization failed: ${response.body}`);
      }

      console.log("✅ Evidently project initialized");
    } catch (error) {
      throw new Error(`Evidently initialization failed: ${error}`);
    }
  }

  private async verifyDeployment(): Promise<void> {
    console.log("🔍 Verifying deployment...");

    try {
      const projectName =
        this.config.projectName || "matbakh-system-optimization";

      // Check if Evidently project exists
      const projectCommand = [
        "aws evidently get-project",
        "--project",
        projectName,
        "--region",
        this.config.region,
      ];

      const projectResult = execSync(projectCommand.join(" "), {
        encoding: "utf8",
      });
      const project = JSON.parse(projectResult);

      if (project.project.status !== "AVAILABLE") {
        throw new Error(
          `Project status is ${project.project.status}, expected AVAILABLE`
        );
      }

      // Check features
      const featuresCommand = [
        "aws evidently list-features",
        "--project",
        projectName,
        "--region",
        this.config.region,
      ];

      const featuresResult = execSync(featuresCommand.join(" "), {
        encoding: "utf8",
      });
      const features = JSON.parse(featuresResult);

      const expectedFeatures = [
        "bundle-optimization",
        "caching-strategy",
        "lazy-loading",
        "database-optimization",
      ];

      const actualFeatures = features.features.map((f: any) => f.name);
      const missingFeatures = expectedFeatures.filter(
        (f) => !actualFeatures.includes(f)
      );

      if (missingFeatures.length > 0) {
        throw new Error(`Missing features: ${missingFeatures.join(", ")}`);
      }

      // Check experiments
      const experimentsCommand = [
        "aws evidently list-experiments",
        "--project",
        projectName,
        "--region",
        this.config.region,
      ];

      const experimentsResult = execSync(experimentsCommand.join(" "), {
        encoding: "utf8",
      });
      const experiments = JSON.parse(experimentsResult);

      console.log(`✅ Deployment verified:`);
      console.log(
        `  - Project: ${project.project.name} (${project.project.status})`
      );
      console.log(`  - Features: ${features.features.length}`);
      console.log(`  - Experiments: ${experiments.experiments.length}`);
    } catch (error) {
      throw new Error(`Deployment verification failed: ${error}`);
    }
  }

  private async generateReport(): Promise<void> {
    console.log("📊 Generating deployment report...");

    const report = {
      deployment: {
        timestamp: new Date().toISOString(),
        environment: this.config.environment,
        region: this.config.region,
        projectName: this.config.projectName || "matbakh-system-optimization",
        duration: Math.round((Date.now() - this.startTime) / 1000),
        success: true,
      },
      infrastructure: {
        stackName: `EvidentlyOptimizationStack-${this.config.environment}`,
        features: [
          "bundle-optimization",
          "caching-strategy",
          "lazy-loading",
          "database-optimization",
        ],
        experiments: ["bundle-size-optimization", "caching-performance-test"],
      },
      nextSteps: [
        "Monitor experiment results in AWS Evidently console",
        "Update feature flag configurations as needed",
        "Review CloudWatch dashboards for performance metrics",
        "Consider starting experiments when ready for A/B testing",
      ],
    };

    const reportPath = `docs/evidently-deployment-${
      this.config.environment
    }-${Date.now()}.json`;
    require("fs").writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log(`✅ Deployment report saved to: ${reportPath}`);
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);

  const config: DeploymentConfig = {
    environment:
      (args.find((arg) => arg.startsWith("--env="))?.split("=")[1] as any) ||
      "development",
    region:
      args.find((arg) => arg.startsWith("--region="))?.split("=")[1] ||
      "eu-central-1",
    projectName: args
      .find((arg) => arg.startsWith("--project="))
      ?.split("=")[1],
    skipTests: args.includes("--skip-tests"),
    dryRun: args.includes("--dry-run"),
  };

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
CloudWatch Evidently Optimization Deployment Script

Usage: tsx scripts/deploy-evidently-optimization.ts [options]

Options:
  --env=<environment>     Environment to deploy to (development|staging|production)
  --region=<region>       AWS region (default: eu-central-1)
  --project=<name>        Custom project name (default: matbakh-system-optimization)
  --skip-tests           Skip running tests before deployment
  --dry-run              Validate and build without deploying
  --help, -h             Show this help message

Examples:
  tsx scripts/deploy-evidently-optimization.ts --env=staging
  tsx scripts/deploy-evidently-optimization.ts --env=production --region=us-east-1
  tsx scripts/deploy-evidently-optimization.ts --dry-run --skip-tests
    `);
    process.exit(0);
  }

  const manager = new EvidentlyDeploymentManager(config);
  await manager.deploy();
}

if (require.main === module) {
  main().catch(console.error);
}

export { EvidentlyDeploymentManager };
