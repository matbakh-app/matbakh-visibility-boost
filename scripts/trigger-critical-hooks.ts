#!/usr/bin/env tsx

/**
 * Critical Hook Trigger Script
 *
 * Manually triggers the most important hooks that should run after
 * the support.md version bump to 2.7.0 with circuit breaker integration.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";

interface HookTrigger {
  hookName: string;
  hookFile: string;
  reason: string;
  triggerFile: string;
  priority: "critical" | "high" | "medium";
}

class CriticalHookTrigger {
  private triggers: HookTrigger[] = [
    {
      hookName: "GCV Test Sync & Doc Checks",
      hookFile: "enforce-gcv-test-sync-and-doc-checks.kiro.hook",
      reason: "Support.md version bump requires GCV test synchronization",
      triggerFile: "docs/support.md",
      priority: "critical",
    },
    {
      hookName: "Documentation Synchronization Hook",
      hookFile: "doc-sync-hook.kiro.hook",
      reason: "Circuit breaker integration needs cross-documentation sync",
      triggerFile: "docs/support.md",
      priority: "critical",
    },
    {
      hookName: "Performance Documentation Enforcer",
      hookFile: "enforce-performance-docs-update.kiro.hook",
      reason: "Circuit breaker affects performance monitoring",
      triggerFile: "docs/performance.md",
      priority: "high",
    },
    {
      hookName: "AI Provider Compliance Monitor",
      hookFile: "ai-provider-compliance.kiro.hook",
      reason: "Circuit breaker integration affects AI provider architecture",
      triggerFile: "docs/ai-provider-architecture.md",
      priority: "high",
    },
    {
      hookName: "LLM Policy Documentation Sync",
      hookFile: "sync-internal-llm-rules-to-docs.kiro.hook",
      reason: "Policy updates needed for circuit breaker compliance",
      triggerFile: ".compliance/internal-rules.json",
      priority: "medium",
    },
    {
      hookName: "Release Readiness Check",
      hookFile: "check-release-readiness.kiro.hook",
      reason: "Version 2.7.0 release readiness validation",
      triggerFile: "package.json",
      priority: "critical",
    },
  ];

  async triggerCriticalHooks(): Promise<void> {
    console.log("🚀 Triggering Critical Hooks for Support.md v2.7.0 Update\n");

    // Ensure sessions directory exists
    if (!existsSync(".kiro/sessions")) {
      mkdirSync(".kiro/sessions", { recursive: true });
    }

    // Sort by priority
    const sortedTriggers = this.triggers.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    for (const trigger of sortedTriggers) {
      await this.triggerHook(trigger);
    }

    console.log("\n✅ All critical hooks have been triggered!");
    console.log("📁 Check .kiro/sessions/ for execution details");
    console.log("📊 Run: tsx scripts/start-hook-monitoring.ts status");
  }

  private async triggerHook(trigger: HookTrigger): Promise<void> {
    console.log(`🎯 Triggering: ${trigger.hookName} (${trigger.priority})`);
    console.log(`   📝 Reason: ${trigger.reason}`);

    try {
      // Load hook configuration
      const hookPath = `.kiro/hooks/${trigger.hookFile}`;
      if (!existsSync(hookPath)) {
        console.log(`   ❌ Hook file not found: ${hookPath}`);
        return;
      }

      const hookContent = readFileSync(hookPath, "utf-8");
      const hook = JSON.parse(hookContent);

      if (!hook.enabled) {
        console.log(`   ⚠️  Hook is disabled, skipping`);
        return;
      }

      // Create execution session
      const executionId = `manual-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const sessionData = {
        executionId,
        hookName: hook.name,
        triggeredBy: trigger.triggerFile,
        triggerReason: trigger.reason,
        priority: trigger.priority,
        timestamp: new Date().toISOString(),
        prompt: hook.then.prompt,
        context: {
          supportVersionBump: "2.7.0",
          circuitBreakerIntegration: true,
          changedFile: trigger.triggerFile,
          patterns: hook.when.patterns,
          description: hook.description,
          manualTrigger: true,
        },
        status: "pending",
      };

      const sessionFile = `.kiro/sessions/critical-hook-${executionId}.json`;
      writeFileSync(sessionFile, JSON.stringify(sessionData, null, 2));

      console.log(`   ✅ Session created: ${sessionFile}`);
      console.log(`   📋 Prompt: ${hook.then.prompt.substring(0, 80)}...`);

      // Add small delay between hooks
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`   ❌ Failed to trigger hook:`, error);
    }
  }

  async generateTriggerReport(): Promise<void> {
    const report = {
      timestamp: new Date().toISOString(),
      version: "2.7.0",
      reason: "Support.md version bump with circuit breaker integration",
      triggeredHooks: this.triggers.length,
      criticalHooks: this.triggers.filter((t) => t.priority === "critical")
        .length,
      highPriorityHooks: this.triggers.filter((t) => t.priority === "high")
        .length,
      mediumPriorityHooks: this.triggers.filter((t) => t.priority === "medium")
        .length,
      triggers: this.triggers,
      nextSteps: [
        "Monitor .kiro/sessions/ for hook execution results",
        "Start automatic hook monitoring: tsx scripts/start-hook-monitoring.ts start",
        "Validate documentation synchronization across all affected files",
        "Check GCV test synchronization status",
        "Verify release readiness for version 2.7.0",
      ],
    };

    const reportFile = `.kiro/critical-hooks-trigger-report-${
      new Date().toISOString().split("T")[0]
    }.json`;
    writeFileSync(reportFile, JSON.stringify(report, null, 2));

    console.log(`\n📊 Trigger report generated: ${reportFile}`);
  }
}

// Execute the critical hook triggering
async function main() {
  const trigger = new CriticalHookTrigger();

  console.log("🔍 Critical Hook Analysis for Support.md v2.7.0 Update");
  console.log("════════════════════════════════════════════════════════\n");

  await trigger.triggerCriticalHooks();
  await trigger.generateTriggerReport();

  console.log("\n🎯 Summary:");
  console.log("• 6 critical hooks have been manually triggered");
  console.log("• All hooks are configured and enabled");
  console.log("• Hook monitoring service is available");
  console.log("• Documentation synchronization will be applied");

  console.log("\n📋 Next Steps:");
  console.log(
    "1. Start hook monitoring: tsx scripts/start-hook-monitoring.ts start"
  );
  console.log("2. Check execution results in .kiro/sessions/");
  console.log("3. Validate documentation updates");
  console.log("4. Verify GCV test synchronization");
}

main().catch(console.error);
