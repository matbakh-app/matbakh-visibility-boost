#!/usr/bin/env tsx

/**
 * GDPR Compliance Validation Script
 *
 * Runs comprehensive GDPR compliance validation and generates reports.
 * Can be used for automated compliance monitoring and CI/CD integration.
 */

import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { GDPRComplianceValidator } from "../src/lib/compliance/gdpr-compliance-validator";

interface ValidationOptions {
  outputDir?: string;
  generateMarkdown?: boolean;
  generateJson?: boolean;
  verbose?: boolean;
  exitOnNonCompliant?: boolean;
}

class GDPRComplianceRunner {
  private validator: GDPRComplianceValidator;
  private options: ValidationOptions;

  constructor(options: ValidationOptions = {}) {
    this.validator = new GDPRComplianceValidator();
    this.options = {
      outputDir: "compliance-reports",
      generateMarkdown: true,
      generateJson: true,
      verbose: false,
      exitOnNonCompliant: false,
      ...options,
    };
  }

  async run(): Promise<void> {
    try {
      console.log("🔍 Starting GDPR Compliance Validation...\n");

      // Validate compliance
      const report = await this.validator.validateCompliance();

      // Display summary
      this.displaySummary(report);

      // Generate reports if requested
      if (this.options.generateMarkdown || this.options.generateJson) {
        await this.generateReports(report);
      }

      // Display detailed results if verbose
      if (this.options.verbose) {
        this.displayDetailedResults(report);
      }

      // Exit with appropriate code
      if (
        this.options.exitOnNonCompliant &&
        report.overallStatus !== "compliant"
      ) {
        console.log("\n❌ Exiting with error code due to non-compliant status");
        process.exit(1);
      }

      console.log("\n✅ GDPR Compliance validation completed successfully");
    } catch (error) {
      console.error("❌ GDPR Compliance validation failed:", error);
      process.exit(1);
    }
  }

  private displaySummary(report: any): void {
    const statusIcon =
      report.overallStatus === "compliant"
        ? "✅"
        : report.overallStatus === "non_compliant"
        ? "❌"
        : "⚠️";

    console.log("📊 GDPR Compliance Summary");
    console.log("═".repeat(50));
    console.log(
      `Overall Status: ${statusIcon} ${report.overallStatus.toUpperCase()}`
    );
    console.log(`Compliance Score: ${report.complianceScore}%`);
    console.log(`Total Checks: ${report.totalChecks}`);
    console.log(`Compliant: ${report.compliantChecks}`);
    console.log(`Non-Compliant: ${report.nonCompliantChecks}`);
    console.log(`Partial: ${report.partialChecks}`);
    console.log(`Not Applicable: ${report.notApplicableChecks}`);
    console.log(`Generated: ${report.timestamp.toISOString()}`);
    console.log();

    // Category breakdown
    console.log("📋 Compliance by Category");
    console.log("─".repeat(50));
    Object.entries(report.summary).forEach(
      ([category, summary]: [string, any]) => {
        const categoryName = category
          .replace("_", " ")
          .replace(/\b\w/g, (l: string) => l.toUpperCase());
        const statusIcon =
          summary.score === 100 ? "✅" : summary.score >= 80 ? "⚠️" : "❌";
        console.log(
          `${statusIcon} ${categoryName}: ${summary.score}% (${summary.compliant}/${summary.total})`
        );

        if (summary.criticalIssues.length > 0) {
          console.log(
            `   🚨 Critical Issues: ${summary.criticalIssues.join(", ")}`
          );
        }
      }
    );
    console.log();
  }

  private displayDetailedResults(report: any): void {
    console.log("🔍 Detailed Compliance Checks");
    console.log("═".repeat(80));

    const categories = [
      "data_processing",
      "data_storage",
      "user_rights",
      "consent",
      "security",
      "ai_operations",
    ];

    categories.forEach((category) => {
      const categoryChecks = report.checks.filter(
        (check: any) => check.category === category
      );
      const categoryName = category
        .replace("_", " ")
        .replace(/\b\w/g, (l: string) => l.toUpperCase());

      console.log(`\n📂 ${categoryName}`);
      console.log("─".repeat(40));

      categoryChecks.forEach((check: any) => {
        const statusIcon =
          check.status === "compliant"
            ? "✅"
            : check.status === "non_compliant"
            ? "❌"
            : check.status === "partial"
            ? "⚠️"
            : "➖";

        console.log(`${statusIcon} ${check.title}`);
        console.log(`   ID: ${check.id}`);
        console.log(`   Requirement: ${check.requirement}`);
        console.log(`   Status: ${check.status}`);
        console.log(`   Implementation: ${check.implementation}`);

        if (check.evidence.length > 0) {
          console.log(`   Evidence: ${check.evidence.join(", ")}`);
        }

        if (check.recommendations && check.recommendations.length > 0) {
          console.log(
            `   Recommendations: ${check.recommendations.join(", ")}`
          );
        }

        console.log();
      });
    });
  }

  private async generateReports(report: any): Promise<void> {
    const timestamp = new Date().toISOString().split("T")[0];
    const outputDir = this.options.outputDir!;

    // Ensure output directory exists
    mkdirSync(outputDir, { recursive: true });

    if (this.options.generateMarkdown) {
      console.log("📝 Generating Markdown report...");
      const markdown = await this.validator.generateComplianceReport();
      const markdownPath = join(
        outputDir,
        `gdpr-compliance-report-${timestamp}.md`
      );
      writeFileSync(markdownPath, markdown, "utf8");
      console.log(`   ✅ Markdown report saved: ${markdownPath}`);
    }

    if (this.options.generateJson) {
      console.log("📄 Generating JSON report...");
      const data = await this.validator.exportComplianceData();
      const jsonPath = join(
        outputDir,
        `gdpr-compliance-data-${timestamp}.json`
      );
      writeFileSync(jsonPath, JSON.stringify(data, null, 2), "utf8");
      console.log(`   ✅ JSON report saved: ${jsonPath}`);
    }

    console.log();
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const options: ValidationOptions = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case "--output-dir":
        options.outputDir = args[++i];
        break;
      case "--no-markdown":
        options.generateMarkdown = false;
        break;
      case "--no-json":
        options.generateJson = false;
        break;
      case "--verbose":
      case "-v":
        options.verbose = true;
        break;
      case "--exit-on-non-compliant":
        options.exitOnNonCompliant = true;
        break;
      case "--help":
      case "-h":
        displayHelp();
        process.exit(0);
        break;
      default:
        console.error(`Unknown argument: ${arg}`);
        displayHelp();
        process.exit(1);
    }
  }

  const runner = new GDPRComplianceRunner(options);
  await runner.run();
}

function displayHelp(): void {
  console.log(`
GDPR Compliance Validation Script

Usage: tsx scripts/run-gdpr-compliance-validation.ts [options]

Options:
  --output-dir <dir>          Output directory for reports (default: compliance-reports)
  --no-markdown              Skip markdown report generation
  --no-json                  Skip JSON report generation
  --verbose, -v              Display detailed compliance check results
  --exit-on-non-compliant    Exit with error code if not compliant
  --help, -h                 Display this help message

Examples:
  # Basic validation with default reports
  tsx scripts/run-gdpr-compliance-validation.ts
  
  # Verbose validation with custom output directory
  tsx scripts/run-gdpr-compliance-validation.ts --verbose --output-dir ./reports
  
  # CI/CD validation that fails on non-compliance
  tsx scripts/run-gdpr-compliance-validation.ts --exit-on-non-compliant
  
  # Generate only JSON report
  tsx scripts/run-gdpr-compliance-validation.ts --no-markdown
`);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}

export { GDPRComplianceRunner };
