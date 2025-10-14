#!/usr/bin/env tsx

/**
 * Quick Status Check für Cleanup 2 Engine
 */

import { execSync } from "child_process";
import { existsSync, readFileSync } from "fs";

interface StatusReport {
  timestamp: Date;
  phase2Status: "not_started" | "in_progress" | "completed" | "failed";
  bedrockSupervised: boolean;
  lastActivity?: Date;
  currentTask?: string;
  issues: string[];
  recommendations: string[];
}

function checkCleanup2Status(): StatusReport {
  const report: StatusReport = {
    timestamp: new Date(),
    phase2Status: "not_started",
    bedrockSupervised: false,
    issues: [],
    recommendations: [],
  };

  // Check if Phase 2 has been started
  const phase2Marker = "reports/cleanup-2-phase-2-status.json";
  if (existsSync(phase2Marker)) {
    try {
      const statusData = JSON.parse(readFileSync(phase2Marker, "utf-8"));
      report.phase2Status = statusData.status || "in_progress";
      report.lastActivity = new Date(statusData.lastActivity);
      report.currentTask = statusData.currentTask;
    } catch (error) {
      report.issues.push(`Failed to read phase 2 status: ${error}`);
    }
  }

  // Check for Bedrock supervision
  const bedrockConfig = ".env.bedrock.development";
  if (existsSync(bedrockConfig)) {
    report.bedrockSupervised = true;
  }

  // Check for incomplete tasks
  const tasksFile = ".kiro/specs/cleanup-2/tasks.md";
  if (existsSync(tasksFile)) {
    const tasksContent = readFileSync(tasksFile, "utf-8");
    const incompleteTasks = tasksContent.match(/- \[ \]/g);
    if (incompleteTasks && incompleteTasks.length > 0) {
      report.issues.push(`${incompleteTasks.length} incomplete tasks found`);
      report.recommendations.push(
        "Review .kiro/specs/cleanup-2/tasks.md for pending tasks"
      );
    }
  }

  // Quick build check (with timeout)
  try {
    execSync("timeout 30s npm run build", { stdio: "pipe" });
  } catch (error) {
    report.issues.push("Build validation failed or timed out");
    report.recommendations.push("Fix build issues before continuing cleanup");
  }

  return report;
}

function main() {
  console.log("🔍 Cleanup 2 Status Check\n");

  const status = checkCleanup2Status();

  console.log(`📅 Timestamp: ${status.timestamp.toISOString()}`);
  console.log(`📊 Phase 2 Status: ${status.phase2Status}`);
  console.log(
    `🤖 Bedrock Supervised: ${status.bedrockSupervised ? "✅" : "❌"}`
  );

  if (status.lastActivity) {
    console.log(`⏰ Last Activity: ${status.lastActivity.toISOString()}`);
  }

  if (status.currentTask) {
    console.log(`🎯 Current Task: ${status.currentTask}`);
  }

  if (status.issues.length > 0) {
    console.log("\n⚠️  Issues Found:");
    status.issues.forEach((issue) => console.log(`   • ${issue}`));
  }

  if (status.recommendations.length > 0) {
    console.log("\n💡 Recommendations:");
    status.recommendations.forEach((rec) => console.log(`   • ${rec}`));
  }

  if (status.issues.length === 0) {
    console.log(
      "\n✅ No issues detected. System ready for cleanup operations."
    );
  }

  console.log("\n🚀 Next Steps:");
  if (status.phase2Status === "not_started") {
    console.log(
      "   • Run: npx tsx scripts/cleanup-2/safe-cleanup-engine.ts --phase 2 --dry-run"
    );
  } else if (status.phase2Status === "in_progress") {
    console.log("   • Check current task progress");
    console.log(
      "   • Consider rollback if stuck: npx tsx scripts/cleanup-2/rollback-manager.ts"
    );
  } else if (status.phase2Status === "completed") {
    console.log("   • Proceed to Phase 3 or validation");
  }
}

main();
