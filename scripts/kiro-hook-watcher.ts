#!/usr/bin/env tsx

/**
 * Kiro Hook File Watcher
 * Automatically triggers hooks when files are changed
 */

import { execSync } from "child_process";
import { watch } from "fs";

console.log("👀 Starting Kiro Hook File Watcher...");

// Watch key directories
const watchDirs = [
  "src/lib/ai-orchestrator",
  "src/components",
  "docs",
  "infra",
  "__tests__",
];

for (const dir of watchDirs) {
  try {
    watch(dir, { recursive: true }, (_eventType, filename) => {
      if (
        filename &&
        (filename.endsWith(".ts") ||
          filename.endsWith(".tsx") ||
          filename.endsWith(".md"))
      ) {
        const fullPath = `${dir}/${filename}`;
        console.log(`📝 File changed: ${fullPath}`);

        // Dispatch all matching hooks
        try {
          execSync(`npx tsx scripts/dispatch-all-hooks.ts "${fullPath}"`, {
            stdio: "inherit",
          });
        } catch (error) {
          console.error("Failed to dispatch hooks:", error);
        }
      }
    });

    console.log(`✅ Watching: ${dir}`);
  } catch (error) {
    console.warn(`⚠️  Could not watch: ${dir}`);
  }
}

console.log("\n🎯 Hook watcher is running. Press Ctrl+C to stop.");
