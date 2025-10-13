#!/usr/bin/env tsx

/**
 * GCV Test Sync & Check Script
 *
 * This script performs Green Core Validation test synchronization and checks:
 * 1. Scans for new test files in test/ directory
 * 2. Verifies GCV registry exists and is up-to-date
 * 3. Checks for on-hold documents that need archival
 * 4. Generates comprehensive report
 */

import { execSync } from "child_process";
import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "fs";
import { join, relative } from "path";

interface GCVTestEntry {
  path: string;
  createdAt: string;
  tags: string[];
  status: "active" | "deprecated" | "archived";
  description?: string;
}

interface GCVRegistry {
  version: string;
  lastUpdated: string;
  tests: GCVTestEntry[];
}

interface OnHoldDocument {
  path: string;
  topic: string;
  status: "active" | "archived";
  archivedAt?: string;
}

class GCVTestSyncChecker {
  private projectRoot: string;
  private gcvRegistryPath: string;
  private testDirectory: string;
  private docsDirectory: string;
  private onHoldDirectory: string;

  constructor() {
    this.projectRoot = process.cwd();
    this.gcvRegistryPath = join(
      this.projectRoot,
      "test/green-core-validation/gcv-tests.json"
    );
    this.testDirectory = join(this.projectRoot, "test");
    this.docsDirectory = join(this.projectRoot, "docs");
    this.onHoldDirectory = join(this.projectRoot, "docs/on-hold");
  }

  async run(): Promise<void> {
    console.log("🔍 GCV Test Sync & Check - Starting Analysis\n");
    console.log("=".repeat(60));

    // Step 1: Check GCV Registry
    const registryStatus = this.checkGCVRegistry();

    // Step 2: Scan for test files
    const testFiles = this.scanTestFiles();

    // Step 3: Compare and identify missing tests
    const missingTests = this.identifyMissingTests(
      registryStatus.registry,
      testFiles
    );

    // Step 4: Check on-hold documents
    const onHoldStatus = this.checkOnHoldDocuments();

    // Step 5: Generate report
    this.generateReport(registryStatus, testFiles, missingTests, onHoldStatus);

    // Step 6: Update registry if needed
    if (missingTests.length > 0) {
      this.updateGCVRegistry(registryStatus.registry, missingTests);
    }
  }

  private checkGCVRegistry(): {
    exists: boolean;
    registry: GCVRegistry | null;
  } {
    console.log("\n📋 Step 1: Checking GCV Registry");
    console.log("-".repeat(60));

    if (!existsSync(this.gcvRegistryPath)) {
      console.log("❌ GCV Registry not found at:", this.gcvRegistryPath);
      console.log("   Creating new registry...");

      const newRegistry: GCVRegistry = {
        version: "1.0.0",
        lastUpdated: new Date().toISOString(),
        tests: [],
      };

      // Create directory if it doesn't exist
      const registryDir = join(this.projectRoot, "test/green-core-validation");
      if (!existsSync(registryDir)) {
        execSync(`mkdir -p "${registryDir}"`);
      }

      writeFileSync(this.gcvRegistryPath, JSON.stringify(newRegistry, null, 2));
      console.log("✅ Created new GCV registry");

      return { exists: false, registry: newRegistry };
    }

    try {
      const content = readFileSync(this.gcvRegistryPath, "utf-8");
      const registry: GCVRegistry = JSON.parse(content);
      console.log("✅ GCV Registry found");
      console.log(`   Version: ${registry.version}`);
      console.log(`   Last Updated: ${registry.lastUpdated}`);
      console.log(`   Registered Tests: ${registry.tests.length}`);

      return { exists: true, registry };
    } catch (error) {
      console.error("❌ Error reading GCV registry:", error);
      return { exists: false, registry: null };
    }
  }

  private scanTestFiles(): string[] {
    console.log("\n🔎 Step 2: Scanning Test Files");
    console.log("-".repeat(60));

    const testFiles: string[] = [];

    const scanDirectory = (dir: string): void => {
      if (!existsSync(dir)) return;

      const entries = readdirSync(dir);

      for (const entry of entries) {
        const fullPath = join(dir, entry);
        const stat = statSync(fullPath);

        if (stat.isDirectory()) {
          // Skip node_modules and other non-test directories
          if (!entry.startsWith(".") && entry !== "node_modules") {
            scanDirectory(fullPath);
          }
        } else if (
          entry.endsWith(".test.ts") ||
          entry.endsWith(".test.tsx") ||
          entry.endsWith(".spec.ts")
        ) {
          const relativePath = relative(this.projectRoot, fullPath);
          testFiles.push(relativePath);
        }
      }
    };

    scanDirectory(this.testDirectory);

    console.log(`✅ Found ${testFiles.length} test files`);

    return testFiles;
  }

  private identifyMissingTests(
    registry: GCVRegistry | null,
    testFiles: string[]
  ): string[] {
    console.log("\n🔍 Step 3: Identifying Missing Tests");
    console.log("-".repeat(60));

    if (!registry) {
      console.log("⚠️  No registry available - all tests are missing");
      return testFiles;
    }

    const registeredPaths = new Set(registry.tests.map((t) => t.path));
    const missingTests = testFiles.filter((path) => !registeredPaths.has(path));

    if (missingTests.length === 0) {
      console.log("✅ All test files are registered in GCV");
    } else {
      console.log(`⚠️  Found ${missingTests.length} unregistered test files:`);
      missingTests.forEach((path) => {
        console.log(`   - ${path}`);
      });
    }

    return missingTests;
  }

  private checkOnHoldDocuments(): {
    total: number;
    active: number;
    archived: number;
  } {
    console.log("\n📄 Step 4: Checking On-Hold Documents");
    console.log("-".repeat(60));

    if (!existsSync(this.onHoldDirectory)) {
      console.log("✅ No on-hold directory found - nothing to check");
      return { total: 0, active: 0, archived: 0 };
    }

    const onHoldDocs: string[] = [];

    const scanDirectory = (dir: string): void => {
      const entries = readdirSync(dir);

      for (const entry of entries) {
        const fullPath = join(dir, entry);
        const stat = statSync(fullPath);

        if (stat.isDirectory()) {
          scanDirectory(fullPath);
        } else if (entry.endsWith(".md")) {
          onHoldDocs.push(relative(this.projectRoot, fullPath));
        }
      }
    };

    scanDirectory(this.onHoldDirectory);

    console.log(`📊 Found ${onHoldDocs.length} on-hold documents`);

    // For now, consider all as active (would need metadata to determine archived status)
    return {
      total: onHoldDocs.length,
      active: onHoldDocs.length,
      archived: 0,
    };
  }

  private generateReport(
    registryStatus: { exists: boolean; registry: GCVRegistry | null },
    testFiles: string[],
    missingTests: string[],
    onHoldStatus: { total: number; active: number; archived: number }
  ): void {
    console.log("\n📊 Step 5: Generating Report");
    console.log("=".repeat(60));

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTestFiles: testFiles.length,
        registeredTests: registryStatus.registry?.tests.length || 0,
        missingTests: missingTests.length,
        onHoldDocuments: onHoldStatus,
      },
      status: missingTests.length === 0 ? "PASS" : "ACTION_REQUIRED",
      actions: [] as string[],
    };

    console.log("\n📈 Summary:");
    console.log(`   Total Test Files: ${report.summary.totalTestFiles}`);
    console.log(`   Registered in GCV: ${report.summary.registeredTests}`);
    console.log(`   Missing from GCV: ${report.summary.missingTests}`);
    console.log(
      `   On-Hold Documents: ${onHoldStatus.total} (${onHoldStatus.active} active)`
    );

    if (missingTests.length > 0) {
      report.actions.push("Update GCV registry with missing tests");
      console.log("\n⚠️  Actions Required:");
      console.log("   1. Update GCV registry with missing tests");
      console.log("   2. Review test coverage for new features");
    }

    if (onHoldStatus.active > 0) {
      report.actions.push("Review active on-hold documents");
      console.log("   3. Review active on-hold documents for archival");
    }

    console.log(
      `\n${report.status === "PASS" ? "✅" : "⚠️"} Status: ${report.status}`
    );

    // Save report
    const reportPath = join(this.projectRoot, ".kiro/gcv-sync-report.json");
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📝 Report saved to: ${reportPath}`);
  }

  private updateGCVRegistry(
    registry: GCVRegistry | null,
    missingTests: string[]
  ): void {
    console.log("\n🔄 Step 6: Updating GCV Registry");
    console.log("-".repeat(60));

    if (!registry) {
      console.log("❌ Cannot update - no registry available");
      return;
    }

    const newEntries: GCVTestEntry[] = missingTests.map((path) => ({
      path,
      createdAt: new Date().toISOString(),
      tags: this.inferTags(path),
      status: "active" as const,
      description: `Auto-registered test file`,
    }));

    registry.tests.push(...newEntries);
    registry.lastUpdated = new Date().toISOString();

    writeFileSync(this.gcvRegistryPath, JSON.stringify(registry, null, 2));

    console.log(
      `✅ Added ${newEntries.length} new test entries to GCV registry`
    );
    console.log(`   Total registered tests: ${registry.tests.length}`);
  }

  private inferTags(testPath: string): string[] {
    const tags: string[] = [];

    if (testPath.includes("__tests__")) tags.push("unit");
    if (testPath.includes("/e2e/")) tags.push("e2e");
    if (testPath.includes("/integration/")) tags.push("integration");
    if (testPath.includes("ai-orchestrator")) tags.push("ai");
    if (testPath.includes("bedrock")) tags.push("bedrock");
    if (testPath.includes("compliance")) tags.push("compliance");
    if (testPath.includes("performance")) tags.push("performance");
    if (testPath.includes("security")) tags.push("security");

    if (tags.length === 0) tags.push("general");

    return tags;
  }
}

// Main execution
const checker = new GCVTestSyncChecker();
checker.run().catch((error) => {
  console.error("\n❌ Error running GCV Test Sync Check:", error);
  process.exit(1);
});
