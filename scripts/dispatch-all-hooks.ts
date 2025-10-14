#!/usr/bin/env tsx
/**
 * Kiro Multi-Hook Dispatcher
 * Executes all matching hooks sequentially (not just the first)
 *
 * Usage:
 *   npx tsx scripts/dispatch-all-hooks.ts <changed-file>
 *   npx tsx scripts/dispatch-all-hooks.ts taskCompleted
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const hooksDir = path.resolve(".kiro/hooks");
const logsDir = path.resolve(".kiro/logs");

// Ensure log directory exists
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

console.log("🚀 Running Multi-Hook Dispatcher...");

/**
 * Get all hooks that match the current event
 */
function getMatchingHooks(fileChanged: string): string[] {
  if (!fs.existsSync(hooksDir)) {
    console.warn(`⚠️  Hooks directory not found: ${hooksDir}`);
    return [];
  }

  const hooks = fs.readdirSync(hooksDir).filter((f) => f.endsWith(".hook"));

  return hooks.filter((hookFile) => {
    try {
      const hookConfig = fs.readFileSync(
        path.join(hooksDir, hookFile),
        "utf-8"
      );

      // Match hooks based on event type
      const isFileEvent =
        fileChanged !== "taskCompleted" && fileChanged !== "manual-trigger";
      const isTaskEvent = fileChanged === "taskCompleted";

      if (isFileEvent) {
        return (
          hookConfig.includes("fileEdited") || hookConfig.includes("fileSaved")
        );
      }

      if (isTaskEvent) {
        return hookConfig.includes("taskCompleted");
      }

      // Manual trigger matches all hooks
      return true;
    } catch (err) {
      console.error(`❌ Error reading hook config: ${hookFile}`, err);
      return false;
    }
  });
}

/**
 * Execute all matching hooks sequentially
 */
async function runAllHooks(fileChanged: string): Promise<void> {
  const hooks = getMatchingHooks(fileChanged);

  if (hooks.length === 0) {
    console.log("⚪ No matching hooks found.");
    return;
  }

  console.log(`🧩 Found ${hooks.length} matching hooks for: ${fileChanged}`);
  console.log(`📋 Hooks to execute: ${hooks.join(", ")}\n`);

  let successCount = 0;
  let failureCount = 0;

  for (const hook of hooks) {
    const hookPath = path.join(hooksDir, hook);
    const startTime = Date.now();

    try {
      console.log(`▶️  Executing Hook: ${hook}`);
      execSync(`npx tsx ${hookPath}`, { stdio: "inherit" });

      const duration = Date.now() - startTime;
      console.log(`✅ Hook completed: ${hook} (${duration}ms)\n`);

      successCount++;

      // Log success
      fs.appendFileSync(
        path.join(logsDir, "hook-execution.log"),
        `${new Date().toISOString()} | ${hook} | SUCCESS | ${duration}ms | ${fileChanged}\n`
      );
    } catch (err) {
      const duration = Date.now() - startTime;
      console.error(`❌ Hook failed: ${hook} (${duration}ms)`, err);

      failureCount++;

      // Log failure
      fs.appendFileSync(
        path.join(logsDir, "hook-execution.log"),
        `${new Date().toISOString()} | ${hook} | ERROR | ${duration}ms | ${fileChanged} | ${err}\n`
      );
    }
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log(`📊 Hook Execution Summary:`);
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Failed: ${failureCount}`);
  console.log(`   📁 Total: ${hooks.length}`);
  console.log("=".repeat(60) + "\n");
}

// Main execution
const changedFile = process.argv[2] || "manual-trigger";

console.log(`📂 Event: ${changedFile}`);
console.log(`📁 Hooks Directory: ${hooksDir}`);
console.log(`📝 Logs Directory: ${logsDir}\n`);

runAllHooks(changedFile)
  .then(() => {
    console.log("✅ All hooks executed sequentially.\n");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Fatal error in hook dispatcher:", err);
    process.exit(1);
  });
