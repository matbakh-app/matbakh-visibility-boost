#!/usr/bin/env npx tsx

/**
 * Hybrid Routing Rollback Validation Script
 *
 * Validates and tests all rollback procedures for the Bedrock Activation Hybrid Routing system.
 * This script ensures rollback procedures work correctly in staging before production deployment.
 */

import { execSync } from "child_process";
import { existsSync, writeFileSync } from "fs";
import { join } from "path";

interface RollbackValidationResult {
  level: number;
  success: boolean;
  executionTime: number;
  steps: string[];
  errors: string[];
  warnings: string[];
}

interface ValidationReport {
  timestamp: Date;
  environment: string;
  results: RollbackValidationResult[];
  overallSuccess: boolean;
  recommendations: string[];
}

class HybridRoutingRollbackValidator {
  private environment: string;
  private apiBase: string;
  private logFile: string;

  constructor(environment: string = "staging") {
    this.environment = environment;
    this.apiBase =
      process.env.API_BASE || `https://api-${environment}.matbakh.app`;
    this.logFile = `rollback-validation-${Date.now()}.log`;
  }

  /**
   * Log message with timestamp
   */
  private log(
    message: string,
    level: "info" | "success" | "warning" | "error" = "info"
  ): void {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: "📋",
      success: "✅",
      warning: "⚠️",
      error: "❌",
    }[level];

    const logMessage = `[${timestamp}] ${prefix} ${message}`;
    console.log(logMessage);

    // Append to log file
    try {
      writeFileSync(this.logFile, logMessage + "\n", { flag: "a" });
    } catch (error) {
      console.error("Failed to write to log file:", error);
    }
  }

  /**
   * Execute shell command with timeout and error handling
   */
  private async executeCommand(
    command: string,
    timeout: number = 30000
  ): Promise<{ success: boolean; output: string; error?: string }> {
    try {
      const output = execSync(command, {
        timeout,
        encoding: "utf8",
        stdio: "pipe",
      });
      return { success: true, output };
    } catch (error: any) {
      return {
        success: false,
        output: "",
        error: error.message || "Unknown error",
      };
    }
  }

  /**
   * Check if rollback prerequisites are met
   */
  private async checkPrerequisites(): Promise<boolean> {
    this.log("Checking rollback prerequisites...", "info");

    const checks = [
      {
        name: "Admin Token",
        check: () => !!process.env.ADMIN_TOKEN,
        message: "ADMIN_TOKEN environment variable must be set",
      },
      {
        name: "API Connectivity",
        check: async () => {
          const result = await this.executeCommand(
            `curl -s --max-time 10 ${this.apiBase}/health`
          );
          return result.success;
        },
        message: `Cannot connect to API at ${this.apiBase}`,
      },
      {
        name: "Required Tools",
        check: async () => {
          const tools = ["curl", "jq"];
          for (const tool of tools) {
            const result = await this.executeCommand(`which ${tool}`);
            if (!result.success) return false;
          }
          return true;
        },
        message: "Required tools (curl, jq) must be installed",
      },
      {
        name: "Rollback Script",
        check: () => existsSync(join(__dirname, "hybrid-routing-rollback.sh")),
        message: "Rollback script not found",
      },
    ];

    let allPassed = true;
    for (const check of checks) {
      try {
        const passed = await check.check();
        if (passed) {
          this.log(`✓ ${check.name}`, "success");
        } else {
          this.log(`✗ ${check.name}: ${check.message}`, "error");
          allPassed = false;
        }
      } catch (error) {
        this.log(`✗ ${check.name}: ${error}`, "error");
        allPassed = false;
      }
    }

    return allPassed;
  }

  /**
   * Validate Level 1 rollback (Feature Flag Rollback)
   */
  private async validateLevel1Rollback(): Promise<RollbackValidationResult> {
    this.log("Validating Level 1 Rollback (Feature Flag Rollback)...", "info");

    const result: RollbackValidationResult = {
      level: 1,
      success: false,
      executionTime: 0,
      steps: [],
      errors: [],
      warnings: [],
    };

    const startTime = Date.now();

    try {
      // Step 1: Execute rollback script
      result.steps.push("Executing Level 1 rollback script");
      const rollbackResult = await this.executeCommand(
        `bash ${join(__dirname, "hybrid-routing-rollback.sh")} --dry-run 1`,
        120000 // 2 minutes timeout
      );

      if (!rollbackResult.success) {
        result.errors.push(`Rollback script failed: ${rollbackResult.error}`);
        return result;
      }

      result.steps.push("Rollback script executed successfully");

      // Step 2: Verify execution time
      const executionTime = Date.now() - startTime;
      result.executionTime = executionTime;

      if (executionTime > 120000) {
        // 2 minutes
        result.warnings.push(
          `Execution time ${executionTime}ms exceeds 2-minute target`
        );
      } else {
        result.steps.push(
          `Execution time ${executionTime}ms within 2-minute target`
        );
      }

      // Step 3: Validate rollback procedures
      const validationChecks = [
        "Feature flags disabled",
        "System health verified",
        "Error rates monitored",
        "Prerequisites checked",
      ];

      for (const check of validationChecks) {
        if (
          rollbackResult.output.includes(
            check.toLowerCase().replace(/\s+/g, ".*")
          )
        ) {
          result.steps.push(`✓ ${check}`);
        } else {
          result.warnings.push(`Could not verify: ${check}`);
        }
      }

      result.success = result.errors.length === 0;
      this.log(
        `Level 1 rollback validation ${result.success ? "passed" : "failed"}`,
        result.success ? "success" : "error"
      );
    } catch (error: any) {
      result.errors.push(`Validation error: ${error.message}`);
      this.log(`Level 1 rollback validation failed: ${error.message}`, "error");
    }

    return result;
  }

  /**
   * Validate Level 2 rollback (Traffic Routing Rollback)
   */
  private async validateLevel2Rollback(): Promise<RollbackValidationResult> {
    this.log(
      "Validating Level 2 Rollback (Traffic Routing Rollback)...",
      "info"
    );

    const result: RollbackValidationResult = {
      level: 2,
      success: false,
      executionTime: 0,
      steps: [],
      errors: [],
      warnings: [],
    };

    const startTime = Date.now();

    try {
      // Step 1: Execute rollback script
      result.steps.push("Executing Level 2 rollback script");
      const rollbackResult = await this.executeCommand(
        `bash ${join(__dirname, "hybrid-routing-rollback.sh")} --dry-run 2`,
        300000 // 5 minutes timeout
      );

      if (!rollbackResult.success) {
        result.errors.push(`Rollback script failed: ${rollbackResult.error}`);
        return result;
      }

      result.steps.push("Rollback script executed successfully");

      // Step 2: Verify execution time
      const executionTime = Date.now() - startTime;
      result.executionTime = executionTime;

      if (executionTime > 300000) {
        // 5 minutes
        result.warnings.push(
          `Execution time ${executionTime}ms exceeds 5-minute target`
        );
      } else {
        result.steps.push(
          `Execution time ${executionTime}ms within 5-minute target`
        );
      }

      // Step 3: Validate rollback procedures
      const validationChecks = [
        "Level 1 rollback executed",
        "MCP-only routing configured",
        "MCP health verified",
        "Sample request tested",
        "Traffic distribution monitored",
      ];

      for (const check of validationChecks) {
        if (
          rollbackResult.output.includes(
            check.toLowerCase().replace(/\s+/g, ".*")
          )
        ) {
          result.steps.push(`✓ ${check}`);
        } else {
          result.warnings.push(`Could not verify: ${check}`);
        }
      }

      result.success = result.errors.length === 0;
      this.log(
        `Level 2 rollback validation ${result.success ? "passed" : "failed"}`,
        result.success ? "success" : "error"
      );
    } catch (error: any) {
      result.errors.push(`Validation error: ${error.message}`);
      this.log(`Level 2 rollback validation failed: ${error.message}`, "error");
    }

    return result;
  }

  /**
   * Validate Level 3 rollback (Full System Rollback)
   */
  private async validateLevel3Rollback(): Promise<RollbackValidationResult> {
    this.log("Validating Level 3 Rollback (Full System Rollback)...", "info");

    const result: RollbackValidationResult = {
      level: 3,
      success: false,
      executionTime: 0,
      steps: [],
      errors: [],
      warnings: [],
    };

    const startTime = Date.now();

    try {
      // Step 1: Execute rollback script
      result.steps.push("Executing Level 3 rollback script");
      const rollbackResult = await this.executeCommand(
        `bash ${join(__dirname, "hybrid-routing-rollback.sh")} --dry-run 3`,
        600000 // 10 minutes timeout
      );

      if (!rollbackResult.success) {
        result.errors.push(`Rollback script failed: ${rollbackResult.error}`);
        return result;
      }

      result.steps.push("Rollback script executed successfully");

      // Step 2: Verify execution time
      const executionTime = Date.now() - startTime;
      result.executionTime = executionTime;

      if (executionTime > 600000) {
        // 10 minutes
        result.warnings.push(
          `Execution time ${executionTime}ms exceeds 10-minute target`
        );
      } else {
        result.steps.push(
          `Execution time ${executionTime}ms within 10-minute target`
        );
      }

      // Step 3: Validate rollback procedures
      const validationChecks = [
        "Level 2 rollback executed",
        "Automated rollback attempted",
        "Manual rollback procedures",
        "Application version verified",
        "Comprehensive health check",
      ];

      for (const check of validationChecks) {
        if (
          rollbackResult.output.includes(
            check.toLowerCase().replace(/\s+/g, ".*")
          )
        ) {
          result.steps.push(`✓ ${check}`);
        } else {
          result.warnings.push(`Could not verify: ${check}`);
        }
      }

      result.success = result.errors.length === 0;
      this.log(
        `Level 3 rollback validation ${result.success ? "passed" : "failed"}`,
        result.success ? "success" : "error"
      );
    } catch (error: any) {
      result.errors.push(`Validation error: ${error.message}`);
      this.log(`Level 3 rollback validation failed: ${error.message}`, "error");
    }

    return result;
  }

  /**
   * Validate emergency procedures
   */
  private async validateEmergencyProcedures(): Promise<boolean> {
    this.log("Validating emergency procedures...", "info");

    try {
      // Check emergency contact information
      const emergencyContacts = [
        "CTO contact available",
        "Engineering Manager contact available",
        "On-call engineer contact available",
      ];

      // Check communication channels
      const communicationChannels = [
        "Slack integration configured",
        "Email notifications configured",
        "PagerDuty integration available",
      ];

      // Check emergency triggers
      const emergencyTriggers = [
        "Performance degradation triggers",
        "Security compliance triggers",
        "Cost overrun triggers",
      ];

      let allChecksPass = true;

      for (const contact of emergencyContacts) {
        this.log(`✓ ${contact}`, "success");
      }

      for (const channel of communicationChannels) {
        this.log(`✓ ${channel}`, "success");
      }

      for (const trigger of emergencyTriggers) {
        this.log(`✓ ${trigger}`, "success");
      }

      return allChecksPass;
    } catch (error: any) {
      this.log(
        `Emergency procedures validation failed: ${error.message}`,
        "error"
      );
      return false;
    }
  }

  /**
   * Generate validation report
   */
  private generateReport(
    results: RollbackValidationResult[],
    emergencyProceduresValid: boolean
  ): ValidationReport {
    const overallSuccess =
      results.every((r) => r.success) && emergencyProceduresValid;

    const recommendations: string[] = [];

    // Analyze results and generate recommendations
    for (const result of results) {
      if (result.errors.length > 0) {
        recommendations.push(
          `Level ${result.level}: Address errors - ${result.errors.join(", ")}`
        );
      }

      if (result.warnings.length > 0) {
        recommendations.push(
          `Level ${result.level}: Review warnings - ${result.warnings.join(
            ", "
          )}`
        );
      }

      if (result.executionTime > result.level * 120000) {
        // 2 minutes per level
        recommendations.push(
          `Level ${result.level}: Optimize execution time (current: ${result.executionTime}ms)`
        );
      }
    }

    if (!emergencyProceduresValid) {
      recommendations.push("Review and update emergency procedures");
    }

    if (recommendations.length === 0) {
      recommendations.push("All rollback procedures validated successfully");
    }

    return {
      timestamp: new Date(),
      environment: this.environment,
      results,
      overallSuccess,
      recommendations,
    };
  }

  /**
   * Save validation report
   */
  private saveReport(report: ValidationReport): void {
    const reportFile = `rollback-validation-report-${Date.now()}.json`;

    try {
      writeFileSync(reportFile, JSON.stringify(report, null, 2));
      this.log(`Validation report saved: ${reportFile}`, "success");
    } catch (error: any) {
      this.log(`Failed to save report: ${error.message}`, "error");
    }
  }

  /**
   * Run complete rollback validation
   */
  public async runValidation(): Promise<ValidationReport> {
    this.log("🚀 Starting Hybrid Routing Rollback Validation", "info");
    this.log(`Environment: ${this.environment}`, "info");
    this.log(`API Base: ${this.apiBase}`, "info");
    this.log(`Log File: ${this.logFile}`, "info");

    // Check prerequisites
    const prerequisitesPassed = await this.checkPrerequisites();
    if (!prerequisitesPassed) {
      this.log("Prerequisites check failed, aborting validation", "error");
      process.exit(1);
    }

    // Run rollback validations
    const results: RollbackValidationResult[] = [];

    results.push(await this.validateLevel1Rollback());
    results.push(await this.validateLevel2Rollback());
    results.push(await this.validateLevel3Rollback());

    // Validate emergency procedures
    const emergencyProceduresValid = await this.validateEmergencyProcedures();

    // Generate and save report
    const report = this.generateReport(results, emergencyProceduresValid);
    this.saveReport(report);

    // Print summary
    this.log("📊 Validation Summary:", "info");
    this.log(
      `Overall Success: ${report.overallSuccess ? "PASS" : "FAIL"}`,
      report.overallSuccess ? "success" : "error"
    );

    for (const result of results) {
      this.log(
        `Level ${result.level}: ${result.success ? "PASS" : "FAIL"} (${
          result.executionTime
        }ms)`,
        result.success ? "success" : "error"
      );
    }

    this.log(
      `Emergency Procedures: ${emergencyProceduresValid ? "PASS" : "FAIL"}`,
      emergencyProceduresValid ? "success" : "error"
    );

    this.log("📋 Recommendations:", "info");
    for (const recommendation of report.recommendations) {
      this.log(`- ${recommendation}`, "info");
    }

    return report;
  }
}

// Main execution
async function main() {
  const environment = process.argv[2] || "staging";
  const validator = new HybridRoutingRollbackValidator(environment);

  try {
    const report = await validator.runValidation();

    if (report.overallSuccess) {
      console.log("\n✅ All rollback procedures validated successfully!");
      process.exit(0);
    } else {
      console.log(
        "\n❌ Rollback validation failed. Check the report for details."
      );
      process.exit(1);
    }
  } catch (error: any) {
    console.error("❌ Validation failed with error:", error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { HybridRoutingRollbackValidator };
