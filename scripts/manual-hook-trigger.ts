#!/usr/bin/env tsx

/**
 * Manual Kiro Hook Trigger System
 *
 * This script manually triggers Kiro hooks when the automatic system isn't working.
 * It simulates the file watcher and executes hooks based on changed files.
 */

import { execSync } from "child_process";
import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "fs";
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
  triggered: boolean;
  matchedFiles: string[];
  executionTime: Date;
  prompt: string;
}

class ManualHookTrigger {
  private hooksDir = ".kiro/hooks";
  private hooks: Map<string, KiroHook> = new Map();
  private executions: HookExecution[] = [];

  async initialize(): Promise<void> {
    console.log("🚀 Manual Kiro Hook Trigger System\n");

    // Load all hooks
    await this.loadHooks();

    // Get recently changed files
    const changedFiles = await this.getRecentlyChangedFiles();

    // Trigger matching hooks
    await this.triggerMatchingHooks(changedFiles);

    // Generate execution report
    this.generateExecutionReport();
  }

  private async loadHooks(): Promise<void> {
    if (!existsSync(this.hooksDir)) {
      console.error("❌ Hooks directory not found:", this.hooksDir);
      return;
    }

    const hookFiles = readdirSync(this.hooksDir).filter((f) =>
      f.endsWith(".kiro.hook")
    );
    console.log(`📁 Loading ${hookFiles.length} hooks...\n`);

    for (const hookFile of hookFiles) {
      try {
        const hookPath = join(this.hooksDir, hookFile);
        const hookContent = readFileSync(hookPath, "utf-8");
        const hook: KiroHook = JSON.parse(hookContent);

        if (hook.enabled) {
          this.hooks.set(hookFile, hook);
          console.log(`✅ Loaded: ${hook.name}`);
        } else {
          console.log(`⏸️  Skipped (disabled): ${hook.name}`);
        }
      } catch (error) {
        console.error(`❌ Failed to load ${hookFile}:`, error);
      }
    }

    console.log(`\n🎯 ${this.hooks.size} active hooks loaded\n`);
  }

  private async getRecentlyChangedFiles(): Promise<string[]> {
    try {
      // Get files changed in the last hour
      const gitCommand = "git diff --name-only HEAD~1 HEAD";
      const gitOutput = execSync(gitCommand, { encoding: "utf-8" });
      const gitFiles = gitOutput
        .trim()
        .split("\n")
        .filter((f) => f.length > 0);

      // Also check for recently modified files (last 10 minutes)
      const recentFiles = this.findRecentlyModifiedFiles();

      // Combine and deduplicate
      const allFiles = [...new Set([...gitFiles, ...recentFiles])];

      console.log(`📝 Found ${allFiles.length} recently changed files:`);
      allFiles.forEach((file) => console.log(`   - ${file}`));
      console.log("");

      return allFiles;
    } catch (error) {
      console.log(
        "⚠️  Could not get git changes, checking recent file modifications..."
      );
      return this.findRecentlyModifiedFiles();
    }
  }

  private findRecentlyModifiedFiles(): string[] {
    const recentFiles: string[] = [];
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;

    const checkDirectory = (dir: string) => {
      try {
        const items = readdirSync(dir);
        for (const item of items) {
          const fullPath = join(dir, item);
          const stat = statSync(fullPath);

          if (
            stat.isDirectory() &&
            !item.startsWith(".") &&
            item !== "node_modules"
          ) {
            checkDirectory(fullPath);
          } else if (stat.isFile() && stat.mtime.getTime() > tenMinutesAgo) {
            recentFiles.push(fullPath);
          }
        }
      } catch (error) {
        // Ignore permission errors
      }
    };

    checkDirectory(".");
    return recentFiles;
  }

  private async triggerMatchingHooks(changedFiles: string[]): Promise<void> {
    console.log("🔍 Checking hook triggers...\n");

    for (const [hookFile, hook] of this.hooks) {
      const matchedFiles = this.getMatchingFiles(
        hook.when.patterns,
        changedFiles
      );

      if (matchedFiles.length > 0) {
        console.log(`🎯 Triggering: ${hook.name}`);
        console.log(`   Matched files: ${matchedFiles.join(", ")}`);

        const execution: HookExecution = {
          hookName: hook.name,
          triggered: true,
          matchedFiles,
          executionTime: new Date(),
          prompt: hook.then.prompt,
        };

        this.executions.push(execution);

        // Execute the hook (simulate)
        await this.executeHook(hook, matchedFiles);
        console.log(`✅ Executed: ${hook.name}\n`);
      } else {
        console.log(`⏭️  Skipped: ${hook.name} (no matching files)`);
      }
    }
  }

  private getMatchingFiles(patterns: string[], files: string[]): string[] {
    const matchedFiles: string[] = [];

    for (const file of files) {
      for (const pattern of patterns) {
        if (this.matchesPattern(file, pattern)) {
          matchedFiles.push(file);
          break;
        }
      }
    }

    return matchedFiles;
  }

  private matchesPattern(file: string, pattern: string): boolean {
    // Simple glob pattern matching
    const regexPattern = pattern
      .replace(/\*\*/g, ".*")
      .replace(/\*/g, "[^/]*")
      .replace(/\?/g, ".");

    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(file);
  }

  private async executeHook(
    hook: KiroHook,
    matchedFiles: string[]
  ): Promise<void> {
    // Create a session file for the hook execution
    const sessionId = `manual-hook-${Date.now()}`;
    const sessionFile = `.kiro/sessions/${sessionId}.md`;

    const sessionContent = `# Manual Hook Execution: ${hook.name}

**Execution Time**: ${new Date().toISOString()}
**Triggered By**: Manual Hook Trigger System
**Matched Files**: ${matchedFiles.join(", ")}

## Hook Configuration
- **Name**: ${hook.name}
- **Description**: ${hook.description}
- **Version**: ${hook.version}

## Execution Prompt
${hook.then.prompt}

## Matched Files Analysis
${matchedFiles.map((file) => `- \`${file}\` - Recently modified`).join("\n")}

## Recommended Actions
Based on the hook configuration, the following actions should be taken:

1. **Review Changed Files**: Analyze the impact of changes in matched files
2. **Update Documentation**: Ensure relevant documentation is synchronized
3. **Run Tests**: Validate that changes don't break existing functionality
4. **Generate Reports**: Create completion reports for significant changes

## Manual Execution Notes
This hook was triggered manually because the automatic Kiro Hook Engine is not running.
Consider investigating why the automatic system is not working.

---
*Generated by Manual Hook Trigger System*
`;

    writeFileSync(sessionFile, sessionContent);
    console.log(`   📄 Session created: ${sessionFile}`);
  }

  private generateExecutionReport(): void {
    const report = {
      timestamp: new Date().toISOString(),
      totalHooks: this.hooks.size,
      triggeredHooks: this.executions.filter((e) => e.triggered).length,
      executions: this.executions,
      recommendations: [
        "Investigate why Kiro Hook Engine is not running automatically",
        "Consider setting up file watcher service for automatic hook execution",
        "Review generated session files for manual action items",
        "Test hook system after fixing automatic execution",
      ],
    };

    const reportFile = ".kiro/manual-hook-execution-report.json";
    writeFileSync(reportFile, JSON.stringify(report, null, 2));

    console.log(`\n📊 Execution Summary:`);
    console.log(`   Total Hooks: ${this.hooks.size}`);
    console.log(
      `   Triggered: ${this.executions.filter((e) => e.triggered).length}`
    );
    console.log(`   Report: ${reportFile}`);

    if (this.executions.length > 0) {
      console.log(`\n📋 Action Items:`);
      console.log(`   1. Review session files in .kiro/sessions/`);
      console.log(`   2. Execute recommended documentation updates`);
      console.log(`   3. Fix automatic hook system for future changes`);
    }
  }
}

// Execute manual hook trigger
const trigger = new ManualHookTrigger();
trigger.initialize().catch(console.error);
