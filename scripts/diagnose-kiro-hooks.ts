#!/usr/bin/env tsx

/**
 * Kiro Hook System Diagnostic and Repair Tool
 *
 * This script diagnoses why Kiro hooks are not executing automatically
 * and provides solutions to fix the hook system.
 */

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

interface HookDiagnostic {
  hookFile: string;
  hookName: string;
  enabled: boolean;
  patterns: string[];
  issues: string[];
  recommendations: string[];
}

class KiroHookDiagnostic {
  private hooksDir = ".kiro/hooks";
  private diagnostics: HookDiagnostic[] = [];

  async diagnoseHooks(): Promise<void> {
    console.log("🔍 Diagnosing Kiro Hook System...\n");

    // Check if hooks directory exists
    if (!existsSync(this.hooksDir)) {
      console.error("❌ Hooks directory not found:", this.hooksDir);
      return;
    }

    // Get all hook files
    const hookFiles = readdirSync(this.hooksDir).filter((f) =>
      f.endsWith(".kiro.hook")
    );
    console.log(`📁 Found ${hookFiles.length} hook files\n`);

    // Diagnose each hook
    for (const hookFile of hookFiles) {
      await this.diagnoseHook(hookFile);
    }

    // Generate report
    this.generateDiagnosticReport();
    this.generateRepairScript();
  }

  private async diagnoseHook(hookFile: string): Promise<void> {
    const hookPath = join(this.hooksDir, hookFile);

    try {
      const hookContent = readFileSync(hookPath, "utf-8");
      const hook: KiroHook = JSON.parse(hookContent);

      const diagnostic: HookDiagnostic = {
        hookFile,
        hookName: hook.name,
        enabled: hook.enabled,
        patterns: hook.when.patterns || [],
        issues: [],
        recommendations: [],
      };

      // Check for common issues
      this.checkHookIssues(hook, diagnostic);

      this.diagnostics.push(diagnostic);

      // Log hook status
      const status = hook.enabled ? "✅" : "❌";
      console.log(`${status} ${hook.name}`);
      if (diagnostic.issues.length > 0) {
        diagnostic.issues.forEach((issue) => console.log(`   ⚠️  ${issue}`));
      }
    } catch (error) {
      console.error(`❌ Failed to parse hook ${hookFile}:`, error);
    }
  }

  private checkHookIssues(hook: KiroHook, diagnostic: HookDiagnostic): void {
    // Check if hook is disabled
    if (!hook.enabled) {
      diagnostic.issues.push("Hook is disabled");
      diagnostic.recommendations.push('Enable hook by setting "enabled": true');
    }

    // Check for empty patterns
    if (!hook.when.patterns || hook.when.patterns.length === 0) {
      diagnostic.issues.push("No file patterns defined");
      diagnostic.recommendations.push("Add file patterns to trigger hook");
    }

    // Check for overly broad patterns
    if (hook.when.patterns.some((p) => p === "**/*" || p === "*")) {
      diagnostic.issues.push(
        "Overly broad file patterns may cause performance issues"
      );
      diagnostic.recommendations.push("Use more specific file patterns");
    }

    // Check for missing prompt
    if (!hook.then.prompt || hook.then.prompt.trim().length === 0) {
      diagnostic.issues.push("Empty or missing prompt");
      diagnostic.recommendations.push("Add detailed prompt for hook execution");
    }

    // Check for file pattern validity
    hook.when.patterns.forEach((pattern) => {
      if (pattern.includes("\\")) {
        diagnostic.issues.push(
          `Invalid pattern: ${pattern} (use forward slashes)`
        );
        diagnostic.recommendations.push("Use forward slashes in file patterns");
      }
    });
  }

  private generateDiagnosticReport(): void {
    const report = {
      timestamp: new Date().toISOString(),
      totalHooks: this.diagnostics.length,
      enabledHooks: this.diagnostics.filter((d) => d.enabled).length,
      hooksWithIssues: this.diagnostics.filter((d) => d.issues.length > 0)
        .length,
      diagnostics: this.diagnostics,
      systemRecommendations: this.getSystemRecommendations(),
    };

    writeFileSync(
      ".kiro/hook-diagnostic-report.json",
      JSON.stringify(report, null, 2)
    );
    console.log(
      "\n📊 Diagnostic Report Generated: .kiro/hook-diagnostic-report.json"
    );
  }

  private getSystemRecommendations(): string[] {
    const recommendations = [
      "Ensure Kiro Hook Engine is running and monitoring file changes",
      "Check if file watcher service is active for the .kiro/hooks directory",
      "Verify that hook execution permissions are properly configured",
      "Consider implementing manual hook trigger mechanism for testing",
      "Add logging to hook execution for better debugging",
    ];

    // Add specific recommendations based on diagnostics
    const disabledHooks = this.diagnostics.filter((d) => !d.enabled);
    if (disabledHooks.length > 0) {
      recommendations.push(`Enable ${disabledHooks.length} disabled hooks`);
    }

    const hooksWithIssues = this.diagnostics.filter((d) => d.issues.length > 0);
    if (hooksWithIssues.length > 0) {
      recommendations.push(`Fix issues in ${hooksWithIssues.length} hooks`);
    }

    return recommendations;
  }

  private generateRepairScript(): void {
    const repairScript = `#!/usr/bin/env tsx

/**
 * Auto-generated Kiro Hook Repair Script
 * Generated: ${new Date().toISOString()}
 */

import { writeFileSync, readFileSync } from 'fs';

console.log('🔧 Repairing Kiro Hook System...');

// Enable all disabled hooks
${this.diagnostics
  .filter((d) => !d.enabled)
  .map(
    (d) => `
// Enable ${d.hookName}
const ${d.hookFile.replace(/[.-]/g, "_")}_content = readFileSync('.kiro/hooks/${
      d.hookFile
    }', 'utf-8');
const ${d.hookFile.replace(
      /[.-]/g,
      "_"
    )}_hook = JSON.parse(${d.hookFile.replace(/[.-]/g, "_")}_content);
${d.hookFile.replace(/[.-]/g, "_")}_hook.enabled = true;
writeFileSync('.kiro/hooks/${d.hookFile}', JSON.stringify(${d.hookFile.replace(
      /[.-]/g,
      "_"
    )}_hook, null, 2));
console.log('✅ Enabled ${d.hookName}');`
  )
  .join("")}

console.log('\\n🎉 Hook repair completed!');
console.log('\\n📋 Next steps:');
console.log('1. Restart Kiro to reload hook configuration');
console.log('2. Test hooks by editing files matching their patterns');
console.log('3. Check .kiro/sessions/ for hook execution logs');
`;

    writeFileSync("scripts/repair-kiro-hooks.ts", repairScript);
    console.log("🔧 Repair Script Generated: scripts/repair-kiro-hooks.ts");
  }
}

// Execute diagnostic
const diagnostic = new KiroHookDiagnostic();
diagnostic.diagnoseHooks().catch(console.error);
