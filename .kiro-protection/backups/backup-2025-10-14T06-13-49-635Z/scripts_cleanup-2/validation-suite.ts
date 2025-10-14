#!/usr/bin/env tsx

/**
 * Validation Suite - Cleanup 2
 *
 * Comprehensive validation system integrating Jest test suite execution,
 * coverage validation, build verification, and performance regression detection
 *
 * Requirements: 6.1, 6.2, 6.3, 8.1
 */

import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

export interface ValidationResult {
  success: boolean;
  testResults: TestResults;
  buildResults: BuildResults;
  coverageResults: CoverageResults;
  performanceResults: PerformanceResults;
  timestamp: Date;
  duration: number;
  errors: string[];
  warnings: string[];
}

export interface TestResults {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  testSuites: TestSuiteResult[];
  coverage: number;
  duration: number;
}

export interface TestSuiteResult {
  name: string;
  status: "passed" | "failed" | "skipped";
  tests: number;
  duration: number;
  errors?: string[];
}

export interface BuildResults {
  success: boolean;
  duration: number;
  bundleSize: number;
  bundleSizeChange: number;
  warnings: string[];
  errors: string[];
  assets: AssetInfo[];
}

export interface AssetInfo {
  name: string;
  size: number;
  sizeChange: number;
  type: "js" | "css" | "html" | "other";
}

export interface CoverageResults {
  overall: number;
  statements: number;
  branches: number;
  functions: number;
  lines: number;
  threshold: number;
  passed: boolean;
  uncoveredFiles: string[];
}

export interface PerformanceResults {
  buildTime: number;
  testTime: number;
  bundleSize: number;
  regressionDetected: boolean;
  baseline: PerformanceBaseline;
  current: PerformanceBaseline;
  changes: PerformanceChanges;
}

export interface PerformanceBaseline {
  buildTime: number;
  testTime: number;
  bundleSize: number;
  timestamp: Date;
}

export interface PerformanceChanges {
  buildTimeChange: number;
  testTimeChange: number;
  bundleSizeChange: number;
  regressionThreshold: number;
}

export interface ValidationConfig {
  coverageThreshold: number;
  performanceRegressionThreshold: number;
  maxBuildTime: number;
  maxTestTime: number;
  enablePerformanceRegression: boolean;
  testSuites: string[];
  buildCommand: string;
  testCommand: string;
  coverageCommand: string;
}

export class ValidationSuite {
  private config: ValidationConfig;
  private baselineFile: string;

  constructor(config?: Partial<ValidationConfig>) {
    this.config = {
      coverageThreshold: 85,
      performanceRegressionThreshold: 10, // 10% regression threshold
      maxBuildTime: 120000, // 2 minutes
      maxTestTime: 300000, // 5 minutes
      enablePerformanceRegression: true,
      testSuites: ["core", "integration", "e2e"],
      buildCommand: "npm run build",
      testCommand: "node scripts/jest/ci-test-runner.cjs",
      coverageCommand: "node scripts/jest/ci-test-runner.cjs --coverage",
      ...config,
    };

    this.baselineFile = path.join(
      process.cwd(),
      "reports",
      "performance-baseline.json"
    );
  }

  /**
   * Run comprehensive validation suite
   */
  async runValidation(): Promise<ValidationResult> {
    console.log("🔍 Starting comprehensive validation suite...");
    const startTime = new Date();
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Ensure reports directory exists
      fs.mkdirSync(path.dirname(this.baselineFile), { recursive: true });

      // Load performance baseline
      const baseline = await this.loadPerformanceBaseline();

      // Run build validation
      console.log("🏗️  Running build validation...");
      const buildResults = await this.validateBuild();
      if (!buildResults.success) {
        errors.push("Build validation failed");
      }

      // Run test validation
      console.log("🧪 Running test validation...");
      const testResults = await this.validateTests();
      if (testResults.failedTests > 0) {
        errors.push(`${testResults.failedTests} tests failed`);
      }

      // Run coverage validation
      console.log("📊 Running coverage validation...");
      const coverageResults = await this.validateCoverage();
      if (!coverageResults.passed) {
        errors.push(
          `Coverage ${coverageResults.overall}% below threshold ${this.config.coverageThreshold}%`
        );
      }

      // Run performance validation
      console.log("⚡ Running performance validation...");
      const performanceResults = await this.validatePerformance(
        baseline,
        buildResults,
        testResults
      );
      if (performanceResults.regressionDetected) {
        warnings.push("Performance regression detected");
      }

      // Update baseline if validation passed
      if (errors.length === 0) {
        await this.updatePerformanceBaseline(performanceResults.current);
      }

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      const result: ValidationResult = {
        success: errors.length === 0,
        testResults,
        buildResults,
        coverageResults,
        performanceResults,
        timestamp: startTime,
        duration,
        errors,
        warnings,
      };

      // Generate validation report
      await this.generateValidationReport(result);

      return result;
    } catch (error) {
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      errors.push(
        `Validation suite failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );

      return {
        success: false,
        testResults: this.getEmptyTestResults(),
        buildResults: this.getEmptyBuildResults(),
        coverageResults: this.getEmptyCoverageResults(),
        performanceResults: this.getEmptyPerformanceResults(),
        timestamp: startTime,
        duration,
        errors,
        warnings,
      };
    }
  }

  /**
   * Validate build process
   */
  private async validateBuild(): Promise<BuildResults> {
    const startTime = Date.now();
    const warnings: string[] = [];
    const errors: string[] = [];

    try {
      // Get baseline bundle size
      const baselineBundleSize = await this.getBaselineBundleSize();

      // Run build
      const buildOutput = execSync(this.config.buildCommand, {
        encoding: "utf-8",
        timeout: this.config.maxBuildTime,
      });

      // Parse build output for warnings
      if (buildOutput.includes("warning")) {
        const warningLines = buildOutput
          .split("\n")
          .filter((line) => line.toLowerCase().includes("warning"));
        warnings.push(...warningLines);
      }

      // Get current bundle size
      const currentBundleSize = await this.getCurrentBundleSize();
      const bundleSizeChange = currentBundleSize - baselineBundleSize;

      // Get asset information
      const assets = await this.getAssetInfo();

      const duration = Date.now() - startTime;

      return {
        success: true,
        duration,
        bundleSize: currentBundleSize,
        bundleSizeChange,
        warnings,
        errors,
        assets,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      errors.push(errorMessage);

      return {
        success: false,
        duration,
        bundleSize: 0,
        bundleSizeChange: 0,
        warnings,
        errors,
        assets: [],
      };
    }
  }

  /**
   * Validate test execution
   */
  private async validateTests(): Promise<TestResults> {
    const startTime = Date.now();

    try {
      const testOutput = execSync(this.config.testCommand, {
        encoding: "utf-8",
        timeout: this.config.maxTestTime,
      });

      // Parse Jest output
      const testResults = this.parseJestOutput(testOutput);
      const duration = Date.now() - startTime;

      return {
        ...testResults,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      // Jest exits with non-zero code when tests fail, but still provides output
      const output =
        error instanceof Error && "stdout" in error
          ? (error as any).stdout
          : "";

      if (output) {
        const testResults = this.parseJestOutput(output);
        return {
          ...testResults,
          duration,
        };
      }

      return {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        skippedTests: 0,
        testSuites: [],
        coverage: 0,
        duration,
      };
    }
  }

  /**
   * Validate test coverage
   */
  private async validateCoverage(): Promise<CoverageResults> {
    try {
      const coverageOutput = execSync(this.config.coverageCommand, {
        encoding: "utf-8",
        timeout: this.config.maxTestTime,
      });

      return this.parseCoverageOutput(coverageOutput);
    } catch (error) {
      return this.getEmptyCoverageResults();
    }
  }

  /**
   * Validate performance and detect regressions
   */
  private async validatePerformance(
    baseline: PerformanceBaseline,
    buildResults: BuildResults,
    testResults: TestResults
  ): Promise<PerformanceResults> {
    const current: PerformanceBaseline = {
      buildTime: buildResults.duration,
      testTime: testResults.duration,
      bundleSize: buildResults.bundleSize,
      timestamp: new Date(),
    };

    const changes: PerformanceChanges = {
      buildTimeChange: this.calculatePercentageChange(
        baseline.buildTime,
        current.buildTime
      ),
      testTimeChange: this.calculatePercentageChange(
        baseline.testTime,
        current.testTime
      ),
      bundleSizeChange: this.calculatePercentageChange(
        baseline.bundleSize,
        current.bundleSize
      ),
      regressionThreshold: this.config.performanceRegressionThreshold,
    };

    const regressionDetected =
      this.config.enablePerformanceRegression &&
      (changes.buildTimeChange > this.config.performanceRegressionThreshold ||
        changes.testTimeChange > this.config.performanceRegressionThreshold ||
        changes.bundleSizeChange > this.config.performanceRegressionThreshold);

    return {
      buildTime: current.buildTime,
      testTime: current.testTime,
      bundleSize: current.bundleSize,
      regressionDetected,
      baseline,
      current,
      changes,
    };
  }

  /**
   * Parse Jest test output
   */
  private parseJestOutput(output: string): Omit<TestResults, "duration"> {
    const lines = output.split("\n");

    // Look for test summary line
    const summaryLine = lines.find(
      (line) =>
        line.includes("Tests:") &&
        (line.includes("passed") || line.includes("failed"))
    );

    if (!summaryLine) {
      return {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        skippedTests: 0,
        testSuites: [],
        coverage: 0,
      };
    }

    // Parse test counts
    const passedMatch = summaryLine.match(/(\d+) passed/);
    const failedMatch = summaryLine.match(/(\d+) failed/);
    const skippedMatch = summaryLine.match(/(\d+) skipped/);

    const passedTests = passedMatch ? parseInt(passedMatch[1]) : 0;
    const failedTests = failedMatch ? parseInt(failedMatch[1]) : 0;
    const skippedTests = skippedMatch ? parseInt(skippedMatch[1]) : 0;
    const totalTests = passedTests + failedTests + skippedTests;

    // Parse test suites
    const testSuites = this.parseTestSuites(output);

    // Parse coverage if available
    const coverage = this.parseCoverageFromTestOutput(output);

    return {
      totalTests,
      passedTests,
      failedTests,
      skippedTests,
      testSuites,
      coverage,
    };
  }

  /**
   * Parse test suites from Jest output
   */
  private parseTestSuites(output: string): TestSuiteResult[] {
    const suites: TestSuiteResult[] = [];
    const lines = output.split("\n");

    for (const line of lines) {
      if (line.includes("PASS") || line.includes("FAIL")) {
        const parts = line.trim().split(/\s+/);
        const status = parts[0] === "PASS" ? "passed" : "failed";
        const name = parts[1] || "unknown";

        suites.push({
          name,
          status,
          tests: 1, // Simplified - would need more parsing for accurate count
          duration: 0, // Would need to parse timing info
        });
      }
    }

    return suites;
  }

  /**
   * Parse coverage from test output
   */
  private parseCoverageFromTestOutput(output: string): number {
    const coverageMatch = output.match(
      /All files[^|]*\|[^|]*\|[^|]*\|[^|]*\|[^|]*(\d+\.?\d*)/
    );
    return coverageMatch ? parseFloat(coverageMatch[1]) : 0;
  }

  /**
   * Parse coverage output
   */
  private parseCoverageOutput(output: string): CoverageResults {
    const lines = output.split("\n");

    // Find coverage summary table
    const summaryLine = lines.find(
      (line) => line.includes("All files") && line.includes("|")
    );

    if (!summaryLine) {
      return this.getEmptyCoverageResults();
    }

    // Parse coverage percentages
    const parts = summaryLine.split("|").map((p) => p.trim());
    const statements = parseFloat(parts[1]) || 0;
    const branches = parseFloat(parts[2]) || 0;
    const functions = parseFloat(parts[3]) || 0;
    const lines = parseFloat(parts[4]) || 0;
    const overall = (statements + branches + functions + lines) / 4;

    const passed = overall >= this.config.coverageThreshold;

    // Find uncovered files
    const uncoveredFiles = lines
      .filter((line) => line.includes("|") && !line.includes("100"))
      .map((line) => line.split("|")[0].trim())
      .filter((file) => file && !file.includes("All files"));

    return {
      overall,
      statements,
      branches,
      functions,
      lines,
      threshold: this.config.coverageThreshold,
      passed,
      uncoveredFiles,
    };
  }

  /**
   * Load performance baseline
   */
  private async loadPerformanceBaseline(): Promise<PerformanceBaseline> {
    try {
      if (fs.existsSync(this.baselineFile)) {
        const data = fs.readFileSync(this.baselineFile, "utf-8");
        const baseline = JSON.parse(data);
        return {
          ...baseline,
          timestamp: new Date(baseline.timestamp),
        };
      }
    } catch (error) {
      console.warn("⚠️ Failed to load performance baseline:", error);
    }

    // Return default baseline
    return {
      buildTime: 60000, // 1 minute default
      testTime: 120000, // 2 minutes default
      bundleSize: 1000000, // 1MB default
      timestamp: new Date(),
    };
  }

  /**
   * Update performance baseline
   */
  private async updatePerformanceBaseline(
    baseline: PerformanceBaseline
  ): Promise<void> {
    try {
      fs.writeFileSync(this.baselineFile, JSON.stringify(baseline, null, 2));
      console.log("📊 Performance baseline updated");
    } catch (error) {
      console.warn("⚠️ Failed to update performance baseline:", error);
    }
  }

  /**
   * Get baseline bundle size
   */
  private async getBaselineBundleSize(): Promise<number> {
    const baseline = await this.loadPerformanceBaseline();
    return baseline.bundleSize;
  }

  /**
   * Get current bundle size
   */
  private async getCurrentBundleSize(): Promise<number> {
    try {
      const distPath = path.join(process.cwd(), "dist");
      if (!fs.existsSync(distPath)) {
        return 0;
      }

      let totalSize = 0;
      const files = fs.readdirSync(distPath, { recursive: true });

      for (const file of files) {
        const filePath = path.join(distPath, file as string);
        if (fs.statSync(filePath).isFile()) {
          totalSize += fs.statSync(filePath).size;
        }
      }

      return totalSize;
    } catch (error) {
      console.warn("⚠️ Failed to calculate bundle size:", error);
      return 0;
    }
  }

  /**
   * Get asset information
   */
  private async getAssetInfo(): Promise<AssetInfo[]> {
    try {
      const distPath = path.join(process.cwd(), "dist");
      if (!fs.existsSync(distPath)) {
        return [];
      }

      const assets: AssetInfo[] = [];
      const files = fs.readdirSync(distPath, { recursive: true });

      for (const file of files) {
        const filePath = path.join(distPath, file as string);
        if (fs.statSync(filePath).isFile()) {
          const size = fs.statSync(filePath).size;
          const ext = path.extname(file as string).toLowerCase();

          let type: AssetInfo["type"] = "other";
          if (ext === ".js") type = "js";
          else if (ext === ".css") type = "css";
          else if (ext === ".html") type = "html";

          assets.push({
            name: file as string,
            size,
            sizeChange: 0, // Would need baseline comparison
            type,
          });
        }
      }

      return assets;
    } catch (error) {
      console.warn("⚠️ Failed to get asset info:", error);
      return [];
    }
  }

  /**
   * Calculate percentage change
   */
  private calculatePercentageChange(baseline: number, current: number): number {
    if (baseline === 0) return 0;
    return ((current - baseline) / baseline) * 100;
  }

  /**
   * Generate validation report
   */
  private async generateValidationReport(
    result: ValidationResult
  ): Promise<void> {
    const reportPath = path.join(
      process.cwd(),
      "reports",
      "validation-report.md"
    );

    const report = `# Validation Suite Report

**Generated:** ${result.timestamp.toISOString()}
**Duration:** ${Math.round(result.duration / 1000)}s
**Status:** ${result.success ? "✅ PASSED" : "❌ FAILED"}

## 📊 Summary

- **Build:** ${result.buildResults.success ? "✅ PASSED" : "❌ FAILED"}
- **Tests:** ${
      result.testResults.failedTests === 0 ? "✅ PASSED" : "❌ FAILED"
    } (${result.testResults.passedTests}/${result.testResults.totalTests})
- **Coverage:** ${
      result.coverageResults.passed ? "✅ PASSED" : "❌ FAILED"
    } (${result.coverageResults.overall.toFixed(1)}%)
- **Performance:** ${
      result.performanceResults.regressionDetected ? "⚠️ REGRESSION" : "✅ GOOD"
    }

## 🏗️ Build Results

- **Duration:** ${Math.round(result.buildResults.duration / 1000)}s
- **Bundle Size:** ${Math.round(result.buildResults.bundleSize / 1024)}KB
- **Size Change:** ${
      result.buildResults.bundleSizeChange > 0 ? "+" : ""
    }${Math.round(result.buildResults.bundleSizeChange / 1024)}KB
- **Warnings:** ${result.buildResults.warnings.length}
- **Errors:** ${result.buildResults.errors.length}

## 🧪 Test Results

- **Total Tests:** ${result.testResults.totalTests}
- **Passed:** ${result.testResults.passedTests}
- **Failed:** ${result.testResults.failedTests}
- **Skipped:** ${result.testResults.skippedTests}
- **Duration:** ${Math.round(result.testResults.duration / 1000)}s

## 📈 Coverage Results

- **Overall:** ${result.coverageResults.overall.toFixed(1)}%
- **Statements:** ${result.coverageResults.statements.toFixed(1)}%
- **Branches:** ${result.coverageResults.branches.toFixed(1)}%
- **Functions:** ${result.coverageResults.functions.toFixed(1)}%
- **Lines:** ${result.coverageResults.lines.toFixed(1)}%
- **Threshold:** ${result.coverageResults.threshold}%

## ⚡ Performance Results

- **Build Time:** ${Math.round(
      result.performanceResults.buildTime / 1000
    )}s (${result.performanceResults.changes.buildTimeChange.toFixed(
      1
    )}% change)
- **Test Time:** ${Math.round(
      result.performanceResults.testTime / 1000
    )}s (${result.performanceResults.changes.testTimeChange.toFixed(1)}% change)
- **Bundle Size:** ${Math.round(
      result.performanceResults.bundleSize / 1024
    )}KB (${result.performanceResults.changes.bundleSizeChange.toFixed(
      1
    )}% change)

${
  result.errors.length > 0
    ? `## ❌ Errors\n\n${result.errors.map((e) => `- ${e}`).join("\n")}`
    : ""
}

${
  result.warnings.length > 0
    ? `## ⚠️ Warnings\n\n${result.warnings.map((w) => `- ${w}`).join("\n")}`
    : ""
}

---
*Report generated by Validation Suite*
`;

    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, report);
    console.log(`📋 Validation report generated: ${reportPath}`);
  }

  // Helper methods for empty results
  private getEmptyTestResults(): TestResults {
    return {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0,
      testSuites: [],
      coverage: 0,
      duration: 0,
    };
  }

  private getEmptyBuildResults(): BuildResults {
    return {
      success: false,
      duration: 0,
      bundleSize: 0,
      bundleSizeChange: 0,
      warnings: [],
      errors: [],
      assets: [],
    };
  }

  private getEmptyCoverageResults(): CoverageResults {
    return {
      overall: 0,
      statements: 0,
      branches: 0,
      functions: 0,
      lines: 0,
      threshold: this.config.coverageThreshold,
      passed: false,
      uncoveredFiles: [],
    };
  }

  private getEmptyPerformanceResults(): PerformanceResults {
    return {
      buildTime: 0,
      testTime: 0,
      bundleSize: 0,
      regressionDetected: false,
      baseline: {
        buildTime: 0,
        testTime: 0,
        bundleSize: 0,
        timestamp: new Date(),
      },
      current: {
        buildTime: 0,
        testTime: 0,
        bundleSize: 0,
        timestamp: new Date(),
      },
      changes: {
        buildTimeChange: 0,
        testTimeChange: 0,
        bundleSizeChange: 0,
        regressionThreshold: this.config.performanceRegressionThreshold,
      },
    };
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  async function main() {
    const coverageThreshold = process.argv.includes("--coverage-threshold")
      ? parseInt(process.argv[process.argv.indexOf("--coverage-threshold") + 1])
      : 85;

    const enablePerformanceRegression = !process.argv.includes(
      "--no-performance-check"
    );

    const config: Partial<ValidationConfig> = {
      coverageThreshold,
      enablePerformanceRegression,
    };

    const suite = new ValidationSuite(config);

    try {
      console.log("🚀 Starting validation suite...");
      const result = await suite.runValidation();

      console.log("\n🎉 VALIDATION COMPLETED");
      console.log("======================");
      console.log(`Status: ${result.success ? "✅ PASSED" : "❌ FAILED"}`);
      console.log(`Duration: ${Math.round(result.duration / 1000)}s`);
      console.log(
        `Tests: ${result.testResults.passedTests}/${result.testResults.totalTests} passed`
      );
      console.log(`Coverage: ${result.coverageResults.overall.toFixed(1)}%`);
      console.log(`Build: ${result.buildResults.success ? "✅" : "❌"}`);
      console.log(
        `Performance: ${
          result.performanceResults.regressionDetected
            ? "⚠️ REGRESSION"
            : "✅ GOOD"
        }`
      );

      if (result.errors.length > 0) {
        console.log("\n❌ Errors:");
        result.errors.forEach((error) => console.log(`  - ${error}`));
      }

      if (result.warnings.length > 0) {
        console.log("\n⚠️ Warnings:");
        result.warnings.forEach((warning) => console.log(`  - ${warning}`));
      }

      process.exit(result.success ? 0 : 1);
    } catch (error) {
      console.error("❌ Validation suite failed:", error);
      process.exit(1);
    }
  }

  main();
}
