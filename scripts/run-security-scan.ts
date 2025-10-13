#!/usr/bin/env tsx

/**
 * Security Scanner CLI Tool
 *
 * Command-line interface for running automated security scans
 * of the hybrid architecture.
 */

import { SimpleSecurityScanner } from "../src/lib/ai-orchestrator/security/simple-security-scanner";
import type { HybridSecurityConfig } from "../src/lib/ai-orchestrator/security/types";

interface CLIOptions {
  scanType: "quick" | "standard" | "comprehensive";
  output?: string;
  format?: "json" | "xml" | "pdf";
  verbose?: boolean;
  penetrationTesting?: boolean;
  complianceOnly?: boolean;
  help?: boolean;
}

class SecurityScannerCLI {
  private parseArguments(): CLIOptions {
    const args = process.argv.slice(2);
    const options: CLIOptions = {
      scanType: "standard",
    };

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      switch (arg) {
        case "--help":
        case "-h":
          options.help = true;
          break;
        case "--scan-type":
        case "-t":
          const scanType = args[++i];
          if (["quick", "standard", "comprehensive"].includes(scanType)) {
            options.scanType = scanType as
              | "quick"
              | "standard"
              | "comprehensive";
          }
          break;
        case "--output":
        case "-o":
          options.output = args[++i];
          break;
        case "--format":
        case "-f":
          const format = args[++i];
          if (["json", "xml", "pdf"].includes(format)) {
            options.format = format as "json" | "xml" | "pdf";
          }
          break;
        case "--verbose":
        case "-v":
          options.verbose = true;
          break;
        case "--penetration-testing":
        case "-p":
          options.penetrationTesting = true;
          break;
        case "--compliance-only":
        case "-c":
          options.complianceOnly = true;
          break;
      }
    }

    return options;
  }

  private showHelp(): void {
    console.log(`
Security Scanner CLI Tool

Usage: npm run security:scan [options]

Options:
  -t, --scan-type <type>     Scan type: quick, standard, comprehensive (default: standard)
  -o, --output <path>        Output file path
  -f, --format <format>      Output format: json, xml, pdf (default: json)
  -v, --verbose             Verbose output
  -p, --penetration-testing Enable penetration testing
  -c, --compliance-only     Run compliance validation only
  -h, --help               Show this help message

Examples:
  npm run security:scan                                    # Standard scan
  npm run security:scan -t comprehensive -p               # Comprehensive scan with penetration testing
  npm run security:scan -c -o compliance-report.json     # Compliance-only scan with output file
  npm run security:scan -t quick -v                      # Quick scan with verbose output

Scan Types:
  quick         - Basic vulnerability scanning (5-10 minutes)
  standard      - Standard security scan with compliance (15-20 minutes)
  comprehensive - Full security scan with penetration testing (30-45 minutes)
`);
  }

  private createScanConfig(options: CLIOptions): HybridSecurityConfig {
    const baseConfig: HybridSecurityConfig = {
      scanDepth: "standard",
      enablePenetrationTesting: false,
      enableComplianceValidation: true,
      enableVulnerabilityScanning: true,
      enableAuditTrailValidation: true,
      scanTimeout: 1200000, // 20 minutes
      reportFormat: "detailed",
      excludePatterns: ["**/node_modules/**", "**/dist/**", "**/.git/**"],
      includePatterns: ["**/*.ts", "**/*.js", "**/*.tsx", "**/*.jsx"],
      securityThresholds: {
        critical: 0,
        high: 2,
        medium: 10,
        low: 50,
      },
    };

    // Adjust config based on scan type
    switch (options.scanType) {
      case "quick":
        baseConfig.scanDepth = "basic";
        baseConfig.enablePenetrationTesting = false;
        baseConfig.enableAuditTrailValidation = false;
        baseConfig.scanTimeout = 600000; // 10 minutes
        baseConfig.reportFormat = "summary";
        break;
      case "comprehensive":
        baseConfig.scanDepth = "comprehensive";
        baseConfig.enablePenetrationTesting = true;
        baseConfig.scanTimeout = 2700000; // 45 minutes
        baseConfig.reportFormat = "detailed";
        break;
    }

    // Override with CLI options
    if (options.penetrationTesting !== undefined) {
      baseConfig.enablePenetrationTesting = options.penetrationTesting;
    }

    if (options.complianceOnly) {
      baseConfig.enableVulnerabilityScanning = false;
      baseConfig.enablePenetrationTesting = false;
      baseConfig.enableAuditTrailValidation = false;
      baseConfig.scanTimeout = 300000; // 5 minutes
    }

    return baseConfig;
  }

  private formatScanResult(result: any, verbose: boolean): string {
    if (verbose) {
      return JSON.stringify(result, null, 2);
    }

    const summary = {
      scanId: result.scanId || "compliance-scan",
      timestamp: result.timestamp || new Date(),
      overallSecurityScore: result.overallSecurityScore || "N/A",
      vulnerabilityCount: this.countVulnerabilities(result),
      complianceStatus:
        result.overallCompliant !== undefined
          ? result.overallCompliant
          : result.scanResults?.compliance?.overallCompliant || false,
      recommendations: result.recommendations?.length || 0,
    };

    return JSON.stringify(summary, null, 2);
  }

  private countVulnerabilities(result: any): {
    critical: number;
    high: number;
    medium: number;
    low: number;
  } {
    const counts = { critical: 0, high: 0, medium: 0, low: 0 };

    const countFromPath = (pathResult: any) => {
      if (pathResult?.vulnerabilities) {
        pathResult.vulnerabilities.forEach((vuln: any) => {
          counts[vuln.severity as keyof typeof counts]++;
        });
      }
    };

    // Handle compliance-only results
    if (result.scanResults) {
      countFromPath(result.scanResults.mcpRouting);
      countFromPath(result.scanResults.directBedrock);
      countFromPath(result.scanResults.hybridRouting);
    }

    return counts;
  }

  private async saveResults(
    result: any,
    outputPath: string,
    format: string
  ): Promise<void> {
    const fs = await import("fs/promises");

    let data: string;
    switch (format) {
      case "json":
        data = JSON.stringify(result, null, 2);
        break;
      case "xml":
        data = this.convertToXML(result);
        break;
      case "pdf":
        // For PDF, we'd use a library like puppeteer or jsPDF
        // For now, save as JSON with .pdf extension
        data = JSON.stringify(result, null, 2);
        console.warn("PDF format not yet implemented, saving as JSON");
        break;
      default:
        data = JSON.stringify(result, null, 2);
    }

    await fs.writeFile(outputPath, data, "utf8");
    console.log(`Results saved to: ${outputPath}`);
  }

  private convertToXML(obj: any): string {
    // Simple XML conversion - would use proper XML library in production
    const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>\n';
    const xmlBody = this.objectToXML(obj, "SecurityScanResult");
    return xmlHeader + xmlBody;
  }

  private objectToXML(obj: any, rootName: string): string {
    if (typeof obj !== "object" || obj === null) {
      return `<${rootName}>${obj}</${rootName}>`;
    }

    let xml = `<${rootName}>`;
    for (const [key, value] of Object.entries(obj)) {
      if (Array.isArray(value)) {
        xml += `<${key}>`;
        value.forEach((item, index) => {
          xml += this.objectToXML(item, `item_${index}`);
        });
        xml += `</${key}>`;
      } else if (typeof value === "object" && value !== null) {
        xml += this.objectToXML(value, key);
      } else {
        xml += `<${key}>${value}</${key}>`;
      }
    }
    xml += `</${rootName}>`;
    return xml;
  }

  private displayProgress(message: string): void {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
  }

  async run(): Promise<void> {
    const options = this.parseArguments();

    if (options.help) {
      this.showHelp();
      return;
    }

    try {
      this.displayProgress(`Starting ${options.scanType} security scan...`);

      const config = this.createScanConfig(options);
      const scanner = new SimpleSecurityScanner(config);

      this.displayProgress("Initializing security scanner...");

      let result;
      if (options.complianceOnly) {
        this.displayProgress("Running compliance validation...");
        result = await scanner.performComplianceValidation();
      } else {
        this.displayProgress("Running comprehensive security scan...");
        result = await scanner.performScan();
      }

      this.displayProgress("Security scan completed successfully");

      // Display results
      console.log("\n=== SECURITY SCAN RESULTS ===\n");
      console.log(this.formatScanResult(result, options.verbose || false));

      // Save results if output path specified
      if (options.output) {
        const format = options.format || "json";
        await this.saveResults(result, options.output, format);
      }

      // Display summary
      if (
        !options.complianceOnly &&
        result.overallSecurityScore !== undefined
      ) {
        console.log(`\n=== SUMMARY ===`);
        console.log(
          `Overall Security Score: ${result.overallSecurityScore}/100`
        );

        const vulnCounts = this.countVulnerabilities(result);
        const totalVulns = Object.values(vulnCounts).reduce((a, b) => a + b, 0);

        if (totalVulns > 0) {
          console.log(`Vulnerabilities Found: ${totalVulns}`);
          console.log(`  Critical: ${vulnCounts.critical}`);
          console.log(`  High: ${vulnCounts.high}`);
          console.log(`  Medium: ${vulnCounts.medium}`);
          console.log(`  Low: ${vulnCounts.low}`);
        } else {
          console.log("No vulnerabilities found");
        }

        if (result.recommendations?.length > 0) {
          console.log(`\nRecommendations: ${result.recommendations.length}`);
          result.recommendations.forEach((rec: string, index: number) => {
            console.log(`  ${index + 1}. ${rec}`);
          });
        }
      }

      // Exit with appropriate code
      if (options.complianceOnly) {
        process.exit(result.overallCompliant ? 0 : 1);
      } else {
        const vulnCounts = this.countVulnerabilities(result);
        process.exit(vulnCounts.critical > 0 || vulnCounts.high > 0 ? 1 : 0);
      }
    } catch (error) {
      console.error("Security scan failed:", error);
      process.exit(1);
    }
  }
}

// Run CLI if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const cli = new SecurityScannerCLI();
  cli.run().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}

export { SecurityScannerCLI };
