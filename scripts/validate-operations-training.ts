#!/usr/bin/env npx tsx

/**
 * Operations Team Training Validation Script
 *
 * This script validates that all necessary training materials and resources
 * are available for the operations team to manage the hybrid architecture.
 */

import { existsSync, readFileSync } from "fs";
import { join } from "path";

interface TrainingResource {
  path: string;
  description: string;
  required: boolean;
  category: "documentation" | "runbook" | "script" | "dashboard";
}

interface ValidationResult {
  resource: TrainingResource;
  exists: boolean;
  accessible: boolean;
  content_valid: boolean;
  issues: string[];
}

class OperationsTrainingValidator {
  private readonly requiredResources: TrainingResource[] = [
    // Core Training Materials
    {
      path: "docs/training/production-hybrid-routing-training.md",
      description: "Main training guide for hybrid routing operations",
      required: true,
      category: "documentation",
    },

    // Operational Runbooks
    {
      path: "docs/runbooks/hybrid-routing-operations.md",
      description: "Daily operations procedures",
      required: true,
      category: "runbook",
    },
    {
      path: "docs/runbooks/hybrid-routing-troubleshooting.md",
      description: "Troubleshooting procedures and common issues",
      required: true,
      category: "runbook",
    },
    {
      path: "docs/runbooks/hybrid-routing-incident-response.md",
      description: "Incident response procedures",
      required: true,
      category: "runbook",
    },
    {
      path: "docs/runbooks/production-hybrid-routing-rollback.md",
      description: "Rollback procedures for production",
      required: true,
      category: "runbook",
    },
    {
      path: "docs/runbooks/hybrid-routing-monitoring.md",
      description: "Monitoring and alerting procedures",
      required: true,
      category: "runbook",
    },

    // Architecture Documentation
    {
      path: "docs/ai-provider-architecture.md",
      description: "System architecture documentation",
      required: true,
      category: "documentation",
    },
    {
      path: "docs/bedrock-environment-configuration.md",
      description: "Environment configuration guide",
      required: true,
      category: "documentation",
    },

    // Operational Scripts
    {
      path: "scripts/deploy-production-hybrid-routing.ts",
      description: "Production deployment script",
      required: true,
      category: "script",
    },
    {
      path: "scripts/validate-monitoring-readiness.ts",
      description: "Monitoring validation script",
      required: true,
      category: "script",
    },

    // Quick Reference Guides
    {
      path: "docs/runbooks/hybrid-routing-quick-reference.md",
      description: "Quick reference for common operations",
      required: true,
      category: "documentation",
    },
    {
      path: "docs/health-check-endpoints-quick-reference.md",
      description: "Health check endpoints reference",
      required: true,
      category: "documentation",
    },
  ];

  private readonly trainingModules = [
    "System Architecture Overview",
    "Monitoring and Dashboards",
    "Troubleshooting Procedures",
    "Emergency Procedures",
    "Maintenance and Operations",
  ];

  async validateTrainingResources(): Promise<ValidationResult[]> {
    console.log("🔍 Validating Operations Team Training Resources...\n");

    const results: ValidationResult[] = [];

    for (const resource of this.requiredResources) {
      const result = await this.validateResource(resource);
      results.push(result);

      const status =
        result.exists && result.accessible && result.content_valid
          ? "✅"
          : "❌";
      console.log(
        `${status} ${resource.category.toUpperCase()}: ${resource.description}`
      );

      if (result.issues.length > 0) {
        result.issues.forEach((issue) => console.log(`   ⚠️  ${issue}`));
      }
    }

    return results;
  }

  private async validateResource(
    resource: TrainingResource
  ): Promise<ValidationResult> {
    const result: ValidationResult = {
      resource,
      exists: false,
      accessible: false,
      content_valid: false,
      issues: [],
    };

    // Check if file exists
    const fullPath = join(process.cwd(), resource.path);
    result.exists = existsSync(fullPath);

    if (!result.exists) {
      result.issues.push(`File does not exist: ${resource.path}`);
      return result;
    }

    try {
      // Check if file is readable
      const content = readFileSync(fullPath, "utf-8");
      result.accessible = true;

      // Validate content based on resource type
      result.content_valid = this.validateContent(resource, content);

      if (!result.content_valid) {
        result.issues.push(
          "Content validation failed - missing required sections"
        );
      }
    } catch (error) {
      result.issues.push(`File access error: ${error.message}`);
    }

    return result;
  }

  private validateContent(
    resource: TrainingResource,
    content: string
  ): boolean {
    // Basic content validation based on resource type
    switch (resource.category) {
      case "documentation":
        return this.validateDocumentation(resource, content);
      case "runbook":
        return this.validateRunbook(resource, content);
      case "script":
        return this.validateScript(resource, content);
      default:
        return content.length > 100; // Basic length check
    }
  }

  private validateDocumentation(
    resource: TrainingResource,
    content: string
  ): boolean {
    const requiredSections = ["#", "##", "###"]; // Must have headers

    if (resource.path.includes("training")) {
      // Training guide specific validation
      return this.trainingModules.every((module) =>
        content.toLowerCase().includes(module.toLowerCase())
      );
    }

    return requiredSections.some((header) => content.includes(header));
  }

  private validateRunbook(
    resource: TrainingResource,
    content: string
  ): boolean {
    const requiredElements = ["procedure", "step", "command", "curl", "bash"];

    return requiredElements.some((element) =>
      content.toLowerCase().includes(element)
    );
  }

  private validateScript(resource: TrainingResource, content: string): boolean {
    // TypeScript/JavaScript script validation
    return (
      content.includes("export") ||
      content.includes("function") ||
      content.includes("const")
    );
  }

  async generateTrainingReport(): Promise<void> {
    console.log("\n📊 Generating Training Validation Report...\n");

    const results = await this.validateTrainingResources();
    const totalResources = results.length;
    const validResources = results.filter(
      (r) => r.exists && r.accessible && r.content_valid
    ).length;
    const missingResources = results.filter((r) => !r.exists).length;
    const invalidResources = results.filter(
      (r) => r.exists && (!r.accessible || !r.content_valid)
    ).length;

    console.log("📈 TRAINING VALIDATION SUMMARY");
    console.log("================================");
    console.log(`Total Resources: ${totalResources}`);
    console.log(`✅ Valid Resources: ${validResources}`);
    console.log(`❌ Missing Resources: ${missingResources}`);
    console.log(`⚠️  Invalid Resources: ${invalidResources}`);
    console.log(
      `📊 Success Rate: ${Math.round(
        (validResources / totalResources) * 100
      )}%\n`
    );

    // Category breakdown
    const categories = [
      "documentation",
      "runbook",
      "script",
      "dashboard",
    ] as const;
    categories.forEach((category) => {
      const categoryResults = results.filter(
        (r) => r.resource.category === category
      );
      const categoryValid = categoryResults.filter(
        (r) => r.exists && r.accessible && r.content_valid
      ).length;
      console.log(
        `${category.toUpperCase()}: ${categoryValid}/${
          categoryResults.length
        } valid`
      );
    });

    console.log("\n🎯 TRAINING READINESS ASSESSMENT");
    console.log("=================================");

    if (validResources === totalResources) {
      console.log("✅ READY: All training resources are available and valid");
      console.log("✅ Operations team can be trained on hybrid architecture");
    } else if (validResources >= totalResources * 0.9) {
      console.log("⚠️  MOSTLY READY: Minor issues need to be addressed");
      console.log("⚠️  Training can proceed with noted limitations");
    } else {
      console.log(
        "❌ NOT READY: Significant training resources are missing or invalid"
      );
      console.log("❌ Training should be delayed until issues are resolved");
    }

    // List critical missing resources
    const criticalMissing = results.filter(
      (r) => r.resource.required && !r.exists
    );
    if (criticalMissing.length > 0) {
      console.log("\n🚨 CRITICAL MISSING RESOURCES:");
      criticalMissing.forEach((result) => {
        console.log(
          `   - ${result.resource.description} (${result.resource.path})`
        );
      });
    }

    // List issues that need attention
    const issuesFound = results.filter((r) => r.issues.length > 0);
    if (issuesFound.length > 0) {
      console.log("\n⚠️  ISSUES REQUIRING ATTENTION:");
      issuesFound.forEach((result) => {
        console.log(`   📄 ${result.resource.description}:`);
        result.issues.forEach((issue) => console.log(`      - ${issue}`));
      });
    }
  }

  async validateTrainingCompleteness(): Promise<boolean> {
    const results = await this.validateTrainingResources();
    const requiredResources = results.filter((r) => r.resource.required);
    const validRequired = requiredResources.filter(
      (r) => r.exists && r.accessible && r.content_valid
    );

    return validRequired.length === requiredResources.length;
  }
}

// Main execution
async function main() {
  console.log("🎓 Operations Team Training Validation");
  console.log("=====================================\n");

  const validator = new OperationsTrainingValidator();

  try {
    await validator.generateTrainingReport();

    const isComplete = await validator.validateTrainingCompleteness();

    console.log("\n🏁 FINAL ASSESSMENT");
    console.log("==================");

    if (isComplete) {
      console.log("✅ Training validation PASSED");
      console.log("✅ Operations team training can proceed");
      process.exit(0);
    } else {
      console.log("❌ Training validation FAILED");
      console.log("❌ Address missing resources before training");
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Validation failed:", error.message);
    process.exit(1);
  }
}

// Run main function if this is the entry point
main();

export { OperationsTrainingValidator };
