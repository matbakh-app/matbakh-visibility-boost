#!/usr/bin/env tsx

/**
 * Direct Bedrock Client Penetration Testing Script
 *
 * Runs comprehensive penetration testing against the Direct Bedrock Client
 * to identify security vulnerabilities and generate security reports.
 */

import * as fs from "fs";
import * as path from "path";
import { DirectBedrockClient } from "../src/lib/ai-orchestrator/direct-bedrock-client";
import { DirectBedrockPenetrationTester } from "../src/lib/ai-orchestrator/security/direct-bedrock-penetration-tester";

interface PenetrationTestOptions {
  testDepth: "basic" | "standard" | "comprehensive";
  outputFormat: "json" | "markdown" | "both";
  outputDir: string;
  enableAllCategories: boolean;
  maxTestsPerCategory: number;
  timeoutMs: number;
  verbose: boolean;
}

class PenetrationTestRunner {
  private options: PenetrationTestOptions;

  constructor(options: Partial<PenetrationTestOptions> = {}) {
    this.options = {
      testDepth: "standard",
      outputFormat: "both",
      outputDir: "./penetration-test-results",
      enableAllCategories: true,
      maxTestsPerCategory: 5,
      timeoutMs: 30000,
      verbose: false,
      ...options,
    };
  }

  async runPenetrationTest(): Promise<void> {
    console.log("🔒 Starting Direct Bedrock Client Penetration Test");
    console.log(`📊 Test Depth: ${this.options.testDepth}`);
    console.log(`⏱️  Timeout: ${this.options.timeoutMs}ms`);
    console.log(`📁 Output Directory: ${this.options.outputDir}`);
    console.log("");

    try {
      // Initialize Direct Bedrock Client
      const client = new DirectBedrockClient({
        region: process.env.AWS_REGION || "eu-central-1",
        enableCircuitBreaker: true,
        enableHealthMonitoring: true,
        enableComplianceChecks: true,
      });

      // Initialize Penetration Tester
      const tester = new DirectBedrockPenetrationTester(client, {
        testDepth: this.options.testDepth,
        maxTestsPerCategory: this.options.maxTestsPerCategory,
        timeoutMs: this.options.timeoutMs,
        enablePromptInjectionTests: this.options.enableAllCategories,
        enableJailbreakTests: this.options.enableAllCategories,
        enableDataExfiltrationTests: this.options.enableAllCategories,
        enablePrivilegeEscalationTests: this.options.enableAllCategories,
        enableDenialOfServiceTests: this.options.enableAllCategories,
        enablePIIExtractionTests: this.options.enableAllCategories,
        enableSSRFTests: this.options.enableAllCategories,
        enableAuthenticationBypassTests: this.options.enableAllCategories,
        enableCircuitBreakerTests: this.options.enableAllCategories,
        enableKMSEncryptionTests: this.options.enableAllCategories,
        enableComplianceBypassTests: this.options.enableAllCategories,
      });

      // Run penetration test
      console.log("🚀 Executing penetration test suite...");
      const startTime = Date.now();

      const result = await tester.runPenetrationTest();

      const executionTime = Date.now() - startTime;
      console.log(`✅ Penetration test completed in ${executionTime}ms`);
      console.log("");

      // Display results summary
      this.displayResultsSummary(result);

      // Create output directory
      if (!fs.existsSync(this.options.outputDir)) {
        fs.mkdirSync(this.options.outputDir, { recursive: true });
      }

      // Generate reports
      await this.generateReports(result);

      // Display final status
      this.displayFinalStatus(result);
    } catch (error) {
      console.error("❌ Penetration test failed:");
      console.error(error);
      process.exit(1);
    }
  }

  private displayResultsSummary(result: any): void {
    console.log("📊 PENETRATION TEST RESULTS SUMMARY");
    console.log("=".repeat(50));
    console.log(`Test ID: ${result.testId}`);
    console.log(`Timestamp: ${result.timestamp.toISOString()}`);
    console.log(`Total Tests: ${result.totalTests}`);
    console.log(`Tests Passed: ${result.testsPassed}`);
    console.log(`Tests Failed: ${result.testsFailed}`);
    console.log(`Vulnerabilities Detected: ${result.vulnerabilitiesDetected}`);
    console.log(`Overall Security Score: ${result.overallSecurityScore}/100`);
    console.log(`Execution Time: ${result.executionTime}ms`);
    console.log("");

    // Display vulnerability breakdown
    if (result.vulnerabilitiesDetected > 0) {
      console.log("🚨 VULNERABILITY BREAKDOWN");
      console.log("-".repeat(30));
      console.log(`Critical: ${result.criticalVulnerabilities.length}`);
      console.log(`High: ${result.highVulnerabilities.length}`);
      console.log(`Medium: ${result.mediumVulnerabilities.length}`);
      console.log(`Low: ${result.lowVulnerabilities.length}`);
      console.log("");
    }

    // Display test category results
    console.log("📋 TEST CATEGORY RESULTS");
    console.log("-".repeat(30));
    result.testCategories.forEach((category: any) => {
      const status = category.vulnerabilitiesFound === 0 ? "✅" : "❌";
      console.log(
        `${status} ${category.category}: ${category.testsPassed}/${
          category.testsRun
        } passed (Score: ${Math.round(category.securityScore)}%)`
      );
      if (category.vulnerabilitiesFound > 0) {
        console.log(
          `   └─ ${category.vulnerabilitiesFound} vulnerabilities found`
        );
      }
    });
    console.log("");
  }

  private async generateReports(result: any): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

    if (
      this.options.outputFormat === "json" ||
      this.options.outputFormat === "both"
    ) {
      await this.generateJSONReport(result, timestamp);
    }

    if (
      this.options.outputFormat === "markdown" ||
      this.options.outputFormat === "both"
    ) {
      await this.generateMarkdownReport(result, timestamp);
    }
  }

  private async generateJSONReport(
    result: any,
    timestamp: string
  ): Promise<void> {
    const filename = `penetration-test-${timestamp}.json`;
    const filepath = path.join(this.options.outputDir, filename);

    const report = {
      ...result,
      metadata: {
        generatedAt: new Date().toISOString(),
        testDepth: this.options.testDepth,
        maxTestsPerCategory: this.options.maxTestsPerCategory,
        timeoutMs: this.options.timeoutMs,
      },
    };

    fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
    console.log(`📄 JSON report saved: ${filepath}`);
  }

  private async generateMarkdownReport(
    result: any,
    timestamp: string
  ): Promise<void> {
    const filename = `penetration-test-${timestamp}.md`;
    const filepath = path.join(this.options.outputDir, filename);

    const markdown = this.generateMarkdownContent(result);
    fs.writeFileSync(filepath, markdown);
    console.log(`📄 Markdown report saved: ${filepath}`);
  }

  private generateMarkdownContent(result: any): string {
    const securityLevel = this.getSecurityLevel(result.overallSecurityScore);
    const securityEmoji = this.getSecurityEmoji(result.overallSecurityScore);

    return `# Direct Bedrock Client Penetration Test Report

${securityEmoji} **Security Level: ${securityLevel}**

## Executive Summary

- **Test ID:** ${result.testId}
- **Timestamp:** ${result.timestamp.toISOString()}
- **Overall Security Score:** ${result.overallSecurityScore}/100
- **Total Tests:** ${result.totalTests}
- **Tests Passed:** ${result.testsPassed}
- **Tests Failed:** ${result.testsFailed}
- **Vulnerabilities Detected:** ${result.vulnerabilitiesDetected}
- **Execution Time:** ${result.executionTime}ms

## Vulnerability Summary

${
  result.vulnerabilitiesDetected === 0
    ? "✅ **No vulnerabilities detected** - The Direct Bedrock Client demonstrates strong security posture."
    : `⚠️ **${result.vulnerabilitiesDetected} vulnerabilities detected** - Immediate attention required.`
}

### Vulnerability Breakdown

| Severity | Count |
|----------|-------|
| Critical | ${result.criticalVulnerabilities.length} |
| High     | ${result.highVulnerabilities.length} |
| Medium   | ${result.mediumVulnerabilities.length} |
| Low      | ${result.lowVulnerabilities.length} |

## Test Category Results

| Category | Tests Run | Tests Passed | Vulnerabilities | Security Score |
|----------|-----------|--------------|-----------------|----------------|
${result.testCategories
  .map(
    (cat: any) =>
      `| ${cat.category.replace(/_/g, " ")} | ${cat.testsRun} | ${
        cat.testsPassed
      } | ${cat.vulnerabilitiesFound} | ${Math.round(cat.securityScore)}% |`
  )
  .join("\n")}

## Detailed Findings

${
  result.vulnerabilitiesDetected === 0
    ? "No security vulnerabilities were identified during the penetration testing process."
    : this.generateVulnerabilityDetails(result)
}

## Recommendations

${result.recommendations
  .map((rec: string, index: number) => `${index + 1}. ${rec}`)
  .join("\n")}

## Test Configuration

- **Test Depth:** ${this.options.testDepth}
- **Max Tests Per Category:** ${this.options.maxTestsPerCategory}
- **Timeout:** ${this.options.timeoutMs}ms
- **Categories Tested:** ${result.testCategories.length}

## Conclusion

${this.generateConclusion(result)}

---

*Report generated on ${new Date().toISOString()}*
*Direct Bedrock Client Penetration Testing Suite v1.0*
`;
  }

  private generateVulnerabilityDetails(result: any): string {
    const allVulns = [
      ...result.criticalVulnerabilities,
      ...result.highVulnerabilities,
      ...result.mediumVulnerabilities,
      ...result.lowVulnerabilities,
    ];

    if (allVulns.length === 0) {
      return "No detailed vulnerability information available.";
    }

    return allVulns
      .map(
        (vuln: any, index: number) => `
### ${index + 1}. ${vuln.description}

- **Severity:** ${vuln.severity.toUpperCase()}
- **Category:** ${vuln.category}
- **Test Vector:** \`${vuln.testVector}\`
- **Response:** \`${vuln.response}\`
- **Recommendation:** ${vuln.recommendation}
- **Exploitability:** ${vuln.exploitability}
- **Impact:** ${vuln.impact}
${vuln.cveReference ? `- **CVE Reference:** ${vuln.cveReference}` : ""}
`
      )
      .join("\n");
  }

  private getSecurityLevel(score: number): string {
    if (score >= 90) return "Excellent";
    if (score >= 80) return "Good";
    if (score >= 70) return "Fair";
    if (score >= 60) return "Poor";
    return "Critical";
  }

  private getSecurityEmoji(score: number): string {
    if (score >= 90) return "🟢";
    if (score >= 80) return "🟡";
    if (score >= 70) return "🟠";
    return "🔴";
  }

  private generateConclusion(result: any): string {
    if (result.overallSecurityScore >= 90) {
      return "The Direct Bedrock Client demonstrates excellent security posture with minimal to no vulnerabilities detected. Continue regular security assessments to maintain this high standard.";
    } else if (result.overallSecurityScore >= 70) {
      return "The Direct Bedrock Client shows good security practices but has areas for improvement. Address the identified vulnerabilities to enhance overall security posture.";
    } else {
      return "The Direct Bedrock Client has significant security vulnerabilities that require immediate attention. Implement the recommended security controls before production deployment.";
    }
  }

  private displayFinalStatus(result: any): void {
    console.log("🎯 FINAL STATUS");
    console.log("=".repeat(20));

    if (result.overallSecurityScore >= 90) {
      console.log("🟢 EXCELLENT SECURITY - Ready for production");
    } else if (result.overallSecurityScore >= 80) {
      console.log("🟡 GOOD SECURITY - Minor improvements recommended");
    } else if (result.overallSecurityScore >= 70) {
      console.log(
        "🟠 FAIR SECURITY - Address vulnerabilities before production"
      );
    } else {
      console.log(
        "🔴 POOR SECURITY - Critical vulnerabilities require immediate attention"
      );
    }

    console.log("");
    console.log("📁 Reports saved to:", this.options.outputDir);

    if (result.vulnerabilitiesDetected > 0) {
      console.log(
        "⚠️  Review the detailed reports for vulnerability remediation steps"
      );
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const options: Partial<PenetrationTestOptions> = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case "--depth":
        options.testDepth = args[++i] as "basic" | "standard" | "comprehensive";
        break;
      case "--format":
        options.outputFormat = args[++i] as "json" | "markdown" | "both";
        break;
      case "--output":
        options.outputDir = args[++i];
        break;
      case "--max-tests":
        options.maxTestsPerCategory = parseInt(args[++i]);
        break;
      case "--timeout":
        options.timeoutMs = parseInt(args[++i]);
        break;
      case "--verbose":
        options.verbose = true;
        break;
      case "--help":
        displayHelp();
        process.exit(0);
        break;
      default:
        if (arg.startsWith("--")) {
          console.error(`Unknown option: ${arg}`);
          process.exit(1);
        }
    }
  }

  const runner = new PenetrationTestRunner(options);
  await runner.runPenetrationTest();
}

function displayHelp() {
  console.log(`
Direct Bedrock Client Penetration Testing Tool

Usage: tsx scripts/run-direct-bedrock-penetration-test.ts [options]

Options:
  --depth <level>        Test depth: basic, standard, comprehensive (default: standard)
  --format <format>      Output format: json, markdown, both (default: both)
  --output <dir>         Output directory (default: ./penetration-test-results)
  --max-tests <num>      Maximum tests per category (default: 5)
  --timeout <ms>         Test timeout in milliseconds (default: 30000)
  --verbose              Enable verbose output
  --help                 Show this help message

Examples:
  tsx scripts/run-direct-bedrock-penetration-test.ts
  tsx scripts/run-direct-bedrock-penetration-test.ts --depth comprehensive --format json
  tsx scripts/run-direct-bedrock-penetration-test.ts --max-tests 10 --timeout 60000
`);
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error("❌ Penetration test failed:", error);
    process.exit(1);
  });
}

export { PenetrationTestRunner };
