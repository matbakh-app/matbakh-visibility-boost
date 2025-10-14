#!/usr/bin/env tsx

/**
 * Fix Kiro Hook Infinite Loop Issue
 *
 * This script identifies and fixes hooks that create infinite loops
 * by monitoring their own output files.
 */

import { readFileSync, readdirSync, writeFileSync } from "fs";
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

interface LoopAnalysis {
  hookFile: string;
  hookName: string;
  hasLoop: boolean;
  loopCause: string[];
  recommendations: string[];
}

class HookLoopFixer {
  private hooksDir = ".kiro/hooks";
  private analyses: LoopAnalysis[] = [];

  async fixInfiniteLoops(): Promise<void> {
    console.log("🔍 Analyzing Kiro Hooks for Infinite Loops...\n");

    const hookFiles = readdirSync(this.hooksDir).filter((f) =>
      f.endsWith(".kiro.hook")
    );

    for (const hookFile of hookFiles) {
      await this.analyzeHook(hookFile);
    }

    this.generateReport();
    await this.fixProblematicHooks();
  }

  private async analyzeHook(hookFile: string): Promise<void> {
    const hookPath = join(this.hooksDir, hookFile);

    try {
      const hookContent = readFileSync(hookPath, "utf-8");
      const hook: KiroHook = JSON.parse(hookContent);

      const analysis: LoopAnalysis = {
        hookFile,
        hookName: hook.name,
        hasLoop: false,
        loopCause: [],
        recommendations: [],
      };

      // Check for infinite loop patterns
      this.checkForLoops(hook, analysis);

      this.analyses.push(analysis);

      const status = analysis.hasLoop ? "🔄 LOOP DETECTED" : "✅ OK";
      console.log(`${status} ${hook.name}`);

      if (analysis.hasLoop) {
        analysis.loopCause.forEach((cause) => console.log(`   ⚠️  ${cause}`));
      }
    } catch (error) {
      console.error(`❌ Failed to analyze ${hookFile}:`, error);
    }
  }

  private checkForLoops(hook: KiroHook, analysis: LoopAnalysis): void {
    const patterns = hook.when.patterns || [];
    const prompt = hook.then.prompt || "";

    // Check for common loop patterns

    // 1. Hook monitors docs/**/*.md but creates documentation
    if (
      patterns.some((p) => p.includes("docs/**/*.md")) &&
      (prompt.includes("documentation") || prompt.includes("docs/"))
    ) {
      analysis.hasLoop = true;
      analysis.loopCause.push(
        "Monitors docs/**/*.md but creates documentation files"
      );
      analysis.recommendations.push(
        "Exclude hook-generated files from monitoring patterns"
      );
    }

    // 2. Hook monitors .audit/**/*.md but creates audit files
    if (
      patterns.some((p) => p.includes(".audit/**/*.md")) &&
      (prompt.includes("audit") || prompt.includes(".audit/"))
    ) {
      analysis.hasLoop = true;
      analysis.loopCause.push(
        "Monitors .audit/**/*.md but creates audit files"
      );
      analysis.recommendations.push(
        "Exclude audit log files from monitoring patterns"
      );
    }

    // 3. Hook monitors release-guidance.md but updates it
    if (
      patterns.some((p) => p.includes("release-guidance.md")) &&
      prompt.includes("release")
    ) {
      analysis.hasLoop = true;
      analysis.loopCause.push("Monitors release-guidance.md but may update it");
      analysis.recommendations.push(
        "Use more specific patterns or exclude self-updates"
      );
    }

    // 4. Hook monitors session files but creates sessions
    if (
      patterns.some((p) => p.includes(".kiro/sessions/")) &&
      prompt.includes("session")
    ) {
      analysis.hasLoop = true;
      analysis.loopCause.push("Monitors session files but creates sessions");
      analysis.recommendations.push("Exclude session files from monitoring");
    }

    // 5. Overly broad patterns that catch everything
    if (patterns.some((p) => p === "**/*" || p === "docs/**/*")) {
      analysis.hasLoop = true;
      analysis.loopCause.push("Overly broad patterns catch hook output files");
      analysis.recommendations.push("Use more specific file patterns");
    }
  }

  private generateReport(): void {
    const loopingHooks = this.analyses.filter((a) => a.hasLoop);

    console.log(`\n📊 Loop Analysis Summary:`);
    console.log(`   Total Hooks: ${this.analyses.length}`);
    console.log(`   Hooks with Loops: ${loopingHooks.length}`);

    if (loopingHooks.length > 0) {
      console.log(`\n🔄 Problematic Hooks:`);
      loopingHooks.forEach((hook) => {
        console.log(`   - ${hook.hookName}`);
        hook.loopCause.forEach((cause) => console.log(`     ⚠️  ${cause}`));
      });
    }

    const report = {
      timestamp: new Date().toISOString(),
      totalHooks: this.analyses.length,
      loopingHooks: loopingHooks.length,
      analyses: this.analyses,
    };

    writeFileSync(
      ".kiro/hook-loop-analysis.json",
      JSON.stringify(report, null, 2)
    );
    console.log(`\n📄 Report saved: .kiro/hook-loop-analysis.json`);
  }

  private async fixProblematicHooks(): Promise<void> {
    const loopingHooks = this.analyses.filter((a) => a.hasLoop);

    if (loopingHooks.length === 0) {
      console.log("\n✅ No infinite loops detected!");
      return;
    }

    console.log(`\n🔧 Fixing ${loopingHooks.length} problematic hooks...\n`);

    for (const analysis of loopingHooks) {
      await this.fixHook(analysis);
    }

    console.log("\n🎉 Hook fixes completed!");
  }

  private async fixHook(analysis: LoopAnalysis): Promise<void> {
    const hookPath = join(this.hooksDir, analysis.hookFile);
    const backupPath = `${hookPath}.backup`;

    try {
      // Create backup
      const originalContent = readFileSync(hookPath, "utf-8");
      writeFileSync(backupPath, originalContent);

      const hook: KiroHook = JSON.parse(originalContent);

      // Apply fixes based on hook name
      if (analysis.hookName === "Release Readiness Check") {
        this.fixReleaseReadinessHook(hook);
      } else if (analysis.hookName.includes("Documentation")) {
        this.fixDocumentationHook(hook);
      } else {
        this.applyGenericFixes(hook);
      }

      // Save fixed hook
      writeFileSync(hookPath, JSON.stringify(hook, null, 2));

      console.log(`✅ Fixed: ${analysis.hookName}`);
      console.log(`   📄 Backup: ${backupPath}`);
    } catch (error) {
      console.error(`❌ Failed to fix ${analysis.hookName}:`, error);
    }
  }

  private fixReleaseReadinessHook(hook: KiroHook): void {
    // Fix the release readiness hook to avoid monitoring its own outputs
    hook.when.patterns = [
      "test/green-core-validation/green-core-validation-report.json",
      "package.json",
      "src/**/*.ts",
      "src/**/*.tsx",
    ];

    // Update prompt to be more specific and avoid creating monitored files
    hook.then.prompt = `Execute release readiness validation:

1) Check Green Core success rate from test/green-core-validation/green-core-validation-report.json (must be >95%)
2) Verify recent commits don't break core functionality
3) Scan for TODO placeholders in source code (src/**/*.ts, src/**/*.tsx)

IMPORTANT: Do NOT create or modify files in docs/ or .audit/ directories to avoid infinite loops.
Report status with ✅/❌ for each check. Log results to console only.`;

    console.log(`   🔧 Applied specific fix for Release Readiness Check`);
  }

  private fixDocumentationHook(hook: KiroHook): void {
    // Remove overly broad patterns that catch hook outputs
    hook.when.patterns = hook.when.patterns.filter(
      (pattern) =>
        !pattern.includes("docs/**/*.md") && !pattern.includes(".audit/**/*.md")
    );

    // Add more specific patterns
    hook.when.patterns.push(
      "src/lib/ai-orchestrator/**/*.ts",
      "src/components/**/*.tsx",
      "infra/**/*.ts"
    );

    console.log(`   🔧 Applied documentation hook fix`);
  }

  private applyGenericFixes(hook: KiroHook): void {
    // Remove overly broad patterns
    hook.when.patterns = hook.when.patterns.filter(
      (pattern) =>
        pattern !== "**/*" &&
        pattern !== "docs/**/*" &&
        !pattern.includes(".kiro/sessions/")
    );

    console.log(`   🔧 Applied generic fixes`);
  }
}

// Execute the fixer
const fixer = new HookLoopFixer();
fixer.fixInfiniteLoops().catch(console.error);
