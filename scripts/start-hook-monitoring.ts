#!/usr/bin/env tsx

/**
 * Kiro Hook Monitoring Service
 *
 * This service monitors file changes and automatically triggers relevant hooks
 * when files matching their patterns are modified.
 */

import { watch } from "chokidar";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "fs";
import { join } from "path";

interface KiroHook {
  enabled: boolean;
  name: string;
  description: string;
  version: string;
  when: {
    type: string;
    patterns: string[];
  };
  then: {
    type: string;
    prompt: string;
  };
}

interface HookExecution {
  hookName: string;
  triggeredBy: string;
  timestamp: string;
  status: "pending" | "success" | "error";
  executionId: string;
}

class KiroHookMonitor {
  private hooks: Map<string, KiroHook> = new Map();
  private executions: HookExecution[] = [];
  private isRunning = false;

  constructor() {
    this.loadHooks();
  }

  private loadHooks(): void {
    const hooksDir = ".kiro/hooks";
    if (!existsSync(hooksDir)) {
      console.error("❌ Hooks directory not found:", hooksDir);
      return;
    }

    const hookFiles = readdirSync(hooksDir).filter((f) =>
      f.endsWith(".kiro.hook")
    );
    console.log(`📁 Loading ${hookFiles.length} hooks...`);

    for (const hookFile of hookFiles) {
      try {
        const hookPath = join(hooksDir, hookFile);
        const hookContent = readFileSync(hookPath, "utf-8");
        const hook: KiroHook = JSON.parse(hookContent);

        if (hook.enabled) {
          this.hooks.set(hookFile, hook);
          console.log(`✅ Loaded: ${hook.name}`);
        } else {
          console.log(`⚠️  Skipped (disabled): ${hook.name}`);
        }
      } catch (error) {
        console.error(`❌ Failed to load hook ${hookFile}:`, error);
      }
    }

    console.log(`🎯 ${this.hooks.size} hooks loaded and ready\n`);
  }

  public startMonitoring(): void {
    if (this.isRunning) {
      console.log("⚠️  Hook monitoring is already running");
      return;
    }

    console.log("🚀 Starting Kiro Hook Monitoring Service...\n");
    this.isRunning = true;

    // Create file watcher for all patterns
    const allPatterns = new Set<string>();
    for (const hook of this.hooks.values()) {
      hook.when.patterns.forEach((pattern) => allPatterns.add(pattern));
    }

    const watcher = watch(Array.from(allPatterns), {
      ignored: [
        "**/node_modules/**",
        "**/.git/**",
        "**/dist/**",
        "**/build/**",
        "**/.next/**",
      ],
      persistent: true,
      ignoreInitial: true,
    });

    watcher.on("change", (filePath) => {
      this.handleFileChange(filePath);
    });

    watcher.on("add", (filePath) => {
      this.handleFileChange(filePath);
    });

    watcher.on("ready", () => {
      console.log("👀 File watcher is ready and monitoring changes...");
      console.log(`📊 Monitoring ${allPatterns.size} file patterns`);
      console.log("🔄 Hook execution will be logged to .kiro/sessions/\n");
    });

    watcher.on("error", (error) => {
      console.error("❌ File watcher error:", error);
    });

    // Keep the process running
    process.on("SIGINT", () => {
      console.log("\n🛑 Shutting down hook monitoring service...");
      watcher.close();
      this.saveExecutionLog();
      process.exit(0);
    });
  }

  private handleFileChange(filePath: string): void {
    console.log(`📝 File changed: ${filePath}`);

    // Find matching hooks
    const matchingHooks = this.findMatchingHooks(filePath);

    if (matchingHooks.length === 0) {
      console.log(`   ℹ️  No hooks match this file pattern`);
      return;
    }

    console.log(`   🎯 ${matchingHooks.length} hook(s) triggered:`);

    // Execute matching hooks
    for (const hook of matchingHooks) {
      this.executeHook(hook, filePath);
    }
  }

  private findMatchingHooks(filePath: string): KiroHook[] {
    const matchingHooks: KiroHook[] = [];

    for (const hook of this.hooks.values()) {
      for (const pattern of hook.when.patterns) {
        if (this.matchesPattern(filePath, pattern)) {
          matchingHooks.push(hook);
          break; // Don't add the same hook multiple times
        }
      }
    }

    return matchingHooks;
  }

  private matchesPattern(filePath: string, pattern: string): boolean {
    // Convert glob pattern to regex
    const regexPattern = pattern
      .replace(/\*\*/g, ".*")
      .replace(/\*/g, "[^/]*")
      .replace(/\?/g, ".");

    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(filePath);
  }

  private async executeHook(
    hook: KiroHook,
    triggeredBy: string
  ): Promise<void> {
    const executionId = `hook-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const execution: HookExecution = {
      hookName: hook.name,
      triggeredBy,
      timestamp: new Date().toISOString(),
      status: "pending",
      executionId,
    };

    this.executions.push(execution);
    console.log(`   🔄 Executing: ${hook.name} (${executionId})`);

    try {
      // Create session file for hook execution
      const sessionData = {
        executionId,
        hookName: hook.name,
        triggeredBy,
        timestamp: execution.timestamp,
        prompt: hook.then.prompt,
        context: {
          changedFile: triggeredBy,
          patterns: hook.when.patterns,
          description: hook.description,
        },
      };

      const sessionFile = `.kiro/sessions/hook-execution-${executionId}.json`;
      writeFileSync(sessionFile, JSON.stringify(sessionData, null, 2));

      // For now, we'll log the execution. In a full implementation,
      // this would trigger the actual Kiro agent execution
      console.log(`   ✅ Hook session created: ${sessionFile}`);
      console.log(`   📋 Prompt: ${hook.then.prompt.substring(0, 100)}...`);

      execution.status = "success";

      // TODO: Implement actual Kiro agent execution here
      // This would involve calling the Kiro API or agent system
    } catch (error) {
      console.error(`   ❌ Hook execution failed:`, error);
      execution.status = "error";
    }
  }

  private saveExecutionLog(): void {
    const logFile = `.kiro/hook-execution-log-${
      new Date().toISOString().split("T")[0]
    }.json`;
    const logData = {
      timestamp: new Date().toISOString(),
      totalExecutions: this.executions.length,
      successfulExecutions: this.executions.filter(
        (e) => e.status === "success"
      ).length,
      failedExecutions: this.executions.filter((e) => e.status === "error")
        .length,
      executions: this.executions,
    };

    writeFileSync(logFile, JSON.stringify(logData, null, 2));
    console.log(`📊 Execution log saved: ${logFile}`);
  }

  public getStatus(): void {
    console.log("\n📊 Hook Monitoring Status:");
    console.log(`   🎯 Active hooks: ${this.hooks.size}`);
    console.log(`   🔄 Total executions: ${this.executions.length}`);
    console.log(
      `   ✅ Successful: ${
        this.executions.filter((e) => e.status === "success").length
      }`
    );
    console.log(
      `   ❌ Failed: ${
        this.executions.filter((e) => e.status === "error").length
      }`
    );
    console.log(`   ⏱️  Running: ${this.isRunning ? "Yes" : "No"}\n`);
  }
}

// CLI interface
const command = process.argv[2];
const monitor = new KiroHookMonitor();

switch (command) {
  case "start":
    monitor.startMonitoring();
    break;
  case "status":
    monitor.getStatus();
    break;
  default:
    console.log("🎯 Kiro Hook Monitoring Service");
    console.log("");
    console.log("Usage:");
    console.log(
      "  tsx scripts/start-hook-monitoring.ts start   # Start monitoring"
    );
    console.log("  tsx scripts/start-hook-monitoring.ts status  # Show status");
    console.log("");
    console.log(
      "The service will monitor file changes and automatically trigger"
    );
    console.log(
      "relevant hooks when files matching their patterns are modified."
    );
    break;
}
