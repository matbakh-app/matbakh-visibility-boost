#!/usr/bin/env npx tsx

/**
 * Demo Script for Cleanup 2 Phase 4
 *
 * Demonstrates the new infrastructure audit, credential management,
 * and bundle optimization tools in a safe demo mode.
 */

import { execSync } from "child_process";
import { existsSync } from "fs";
import { join } from "path";

async function main() {
  console.log("🚀 Cleanup 2 Phase 4 Demo");
  console.log("==========================\n");

  // Check if we're in the right directory
  if (!existsSync("package.json")) {
    console.error("❌ Please run this script from the project root directory");
    process.exit(1);
  }

  // Ensure reports directory exists
  if (!existsSync("reports")) {
    execSync("mkdir -p reports");
  }

  console.log("📋 Available Phase 4 Tools:");
  console.log("1. Bundle Optimizer - Analyze and optimize bundle size");
  console.log("2. Infrastructure Auditor - Audit DNS and CloudFront");
  console.log("3. Credential Manager - Audit credentials and secrets");
  console.log("4. Phase 4 Orchestrator - Run all tasks together\n");

  // Demo 1: Bundle Optimizer
  console.log("🔧 Demo 1: Bundle Optimizer");
  console.log("----------------------------");
  try {
    console.log("Running bundle analysis...");
    execSync("npx tsx scripts/cleanup-2/bundle-optimizer.ts optimize", {
      stdio: "inherit",
      timeout: 60000,
    });
    console.log("✅ Bundle optimization demo completed\n");
  } catch (error) {
    console.log(
      "⚠️ Bundle optimizer demo failed (this is expected without a build)\n"
    );
  }

  // Demo 2: Infrastructure Auditor
  console.log("🔧 Demo 2: Infrastructure Auditor");
  console.log("----------------------------------");
  try {
    console.log("Running infrastructure audit...");
    execSync("npx tsx scripts/cleanup-2/infrastructure-auditor.ts audit", {
      stdio: "inherit",
      timeout: 60000,
    });
    console.log("✅ Infrastructure audit demo completed\n");
  } catch (error) {
    console.log(
      "⚠️ Infrastructure audit demo failed (this is expected without AWS CLI)\n"
    );
  }

  // Demo 3: Credential Manager
  console.log("🔧 Demo 3: Credential Manager");
  console.log("------------------------------");
  try {
    console.log("Running credential audit...");
    execSync("npx tsx scripts/cleanup-2/credential-manager.ts audit", {
      stdio: "inherit",
      timeout: 60000,
    });
    console.log("✅ Credential audit demo completed\n");
  } catch (error) {
    console.log("⚠️ Credential audit demo failed (this is expected)\n");
  }

  // Demo 4: Phase 4 Orchestrator (dry run)
  console.log("🔧 Demo 4: Phase 4 Orchestrator (Dry Run)");
  console.log("------------------------------------------");
  try {
    console.log("Running Phase 4 orchestrator in dry-run mode...");
    execSync(
      "npx tsx scripts/cleanup-2/phase-4-orchestrator.ts execute --dry-run --skip-optional",
      {
        stdio: "inherit",
        timeout: 120000,
      }
    );
    console.log("✅ Phase 4 orchestrator demo completed\n");
  } catch (error) {
    console.log("⚠️ Phase 4 orchestrator demo failed\n");
  }

  // Show generated reports
  console.log("📊 Generated Reports:");
  console.log("---------------------");
  const reportFiles = [
    "bundle-report.json",
    "bundle-summary.md",
    "infrastructure-audit.json",
    "infrastructure-summary.md",
    "credential-audit.json",
    "secrets-rotation-proof.md",
    "phase-4-results.json",
    "phase-4-summary.md",
  ];

  reportFiles.forEach((file) => {
    const path = join("reports", file);
    if (existsSync(path)) {
      console.log(`✅ ${file}`);
    } else {
      console.log(`⚪ ${file} (not generated)`);
    }
  });

  console.log("\n🎉 Phase 4 Demo Complete!");
  console.log("\nNext Steps:");
  console.log("- Review generated reports in the reports/ directory");
  console.log("- Run individual tools with specific parameters");
  console.log(
    "- Execute Phase 4 orchestrator without --dry-run for actual cleanup"
  );
  console.log("- Proceed to Phase 5 once Phase 4 compliance is achieved");
}

if (require.main === module) {
  main().catch(console.error);
}
