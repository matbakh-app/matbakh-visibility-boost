#!/usr/bin/env tsx

/**
 * Kiro System Protection - Permanent Protection for System-Critical Files
 *
 * This script implements a comprehensive protection system for system-critical
 * files and directories, preventing accidental deletion and ensuring system
 * integrity.
 */

import { execSync } from "child_process";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";

interface ProtectedPath {
  path: string;
  type: "file" | "directory";
  critical: boolean;
  description: string;
  backupRequired: boolean;
}

class KiroSystemProtection {
  private protectedPaths: ProtectedPath[] = [
    // Critical .kiro directories
    {
      path: ".kiro/specs",
      type: "directory",
      critical: true,
      description: "Kiro specifications and tasks",
      backupRequired: true,
    },
    {
      path: ".kiro/policies",
      type: "directory",
      critical: true,
      description: "Kiro policies and governance",
      backupRequired: true,
    },
    {
      path: ".kiro/steering",
      type: "directory",
      critical: true,
      description: "Kiro steering documents",
      backupRequired: true,
    },
    {
      path: ".kiro/deployment",
      type: "directory",
      critical: true,
      description: "Deployment configurations",
      backupRequired: true,
    },
    {
      path: ".kiro/features",
      type: "directory",
      critical: true,
      description: "Feature flags and configurations",
      backupRequired: true,
    },
    {
      path: ".kiro/hooks",
      type: "directory",
      critical: true,
      description: "Kiro automation hooks",
      backupRequired: true,
    },

    // Critical configuration files
    {
      path: "package.json",
      type: "file",
      critical: true,
      description: "Project dependencies and scripts",
      backupRequired: true,
    },
    {
      path: "tsconfig.json",
      type: "file",
      critical: true,
      description: "TypeScript configuration",
      backupRequired: true,
    },
    {
      path: "vite.config.ts",
      type: "file",
      critical: true,
      description: "Vite build configuration",
      backupRequired: true,
    },
    {
      path: "eslint.config.js",
      type: "file",
      critical: true,
      description: "ESLint configuration",
      backupRequired: true,
    },

    // Critical source directories
    {
      path: "src/lib/ai-orchestrator",
      type: "directory",
      critical: true,
      description: "AI orchestration system",
      backupRequired: true,
    },
    {
      path: "scripts/cleanup-2",
      type: "directory",
      critical: true,
      description: "Cleanup orchestration scripts",
      backupRequired: true,
    },

    // Documentation
    {
      path: "README.md",
      type: "file",
      critical: false,
      description: "Project documentation",
      backupRequired: true,
    },
    {
      path: "docs",
      type: "directory",
      critical: false,
      description: "Documentation directory",
      backupRequired: true,
    },
  ];

  private backupDir = ".kiro-protection/backups";
  private protectionFile = ".kiro-protection/protection-status.json";

  constructor() {
    this.ensureBackupDirectory();
  }

  private ensureBackupDirectory(): void {
    if (!existsSync(".kiro-protection")) {
      mkdirSync(".kiro-protection", { recursive: true });
    }
    if (!existsSync(this.backupDir)) {
      mkdirSync(this.backupDir, { recursive: true });
    }
  }

  /**
   * Create comprehensive backups of all protected paths
   */
  async createBackups(): Promise<void> {
    console.log("🔒 Creating system protection backups...");

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupPath = join(this.backupDir, `backup-${timestamp}`);

    mkdirSync(backupPath, { recursive: true });

    for (const protectedPath of this.protectedPaths) {
      if (!protectedPath.backupRequired) continue;

      if (existsSync(protectedPath.path)) {
        try {
          if (protectedPath.type === "directory") {
            execSync(
              `cp -r "${protectedPath.path}" "${join(
                backupPath,
                protectedPath.path.replace("/", "_")
              )}"`,
              { stdio: "pipe" }
            );
          } else {
            execSync(
              `cp "${protectedPath.path}" "${join(
                backupPath,
                protectedPath.path.replace("/", "_")
              )}"`,
              { stdio: "pipe" }
            );
          }
          console.log(`  ✅ Backed up: ${protectedPath.path}`);
        } catch (error) {
          console.warn(
            `  ⚠️  Failed to backup ${protectedPath.path}: ${error}`
          );
        }
      }
    }

    // Update protection status
    this.updateProtectionStatus(timestamp);
    console.log(`🔒 Backup completed: ${backupPath}`);
  }

  /**
   * Validate system integrity
   */
  async validateSystemIntegrity(): Promise<{
    valid: boolean;
    missing: string[];
    issues: string[];
  }> {
    console.log("🔍 Validating system integrity...");

    const missing: string[] = [];
    const issues: string[] = [];

    for (const protectedPath of this.protectedPaths) {
      if (!existsSync(protectedPath.path)) {
        missing.push(protectedPath.path);
        if (protectedPath.critical) {
          issues.push(
            `CRITICAL: Missing ${protectedPath.path} - ${protectedPath.description}`
          );
        }
      }
    }

    // Check git status for .kiro files
    try {
      const gitStatus = execSync("git status --porcelain .kiro/", {
        encoding: "utf8",
        stdio: "pipe",
      });
      if (gitStatus.trim()) {
        issues.push("WARNING: .kiro directory has uncommitted changes");
      }
    } catch (error) {
      issues.push("WARNING: Could not check git status for .kiro directory");
    }

    const valid =
      missing.length === 0 &&
      issues.filter((i) => i.startsWith("CRITICAL")).length === 0;

    console.log(
      `🔍 Integrity check: ${valid ? "✅ VALID" : "❌ ISSUES FOUND"}`
    );
    if (missing.length > 0) {
      console.log("  Missing paths:", missing);
    }
    if (issues.length > 0) {
      console.log("  Issues:", issues);
    }

    return { valid, missing, issues };
  }

  /**
   * Restore from latest backup
   */
  async restoreFromBackup(backupTimestamp?: string): Promise<void> {
    console.log("🔄 Restoring from backup...");

    if (!backupTimestamp) {
      // Find latest backup
      try {
        const backups = execSync(
          `ls -1 ${this.backupDir} | grep backup- | sort -r | head -1`,
          { encoding: "utf8", stdio: "pipe" }
        ).trim();
        if (!backups) {
          throw new Error("No backups found");
        }
        backupTimestamp = backups.replace("backup-", "");
      } catch (error) {
        console.error("❌ No backups available for restoration");
        return;
      }
    }

    const backupPath = join(this.backupDir, `backup-${backupTimestamp}`);

    if (!existsSync(backupPath)) {
      console.error(`❌ Backup not found: ${backupPath}`);
      return;
    }

    // Restore each protected path
    for (const protectedPath of this.protectedPaths) {
      if (!protectedPath.backupRequired) continue;

      const backupFile = join(backupPath, protectedPath.path.replace("/", "_"));
      if (existsSync(backupFile)) {
        try {
          if (protectedPath.type === "directory") {
            execSync(
              `rm -rf "${protectedPath.path}" && cp -r "${backupFile}" "${protectedPath.path}"`,
              { stdio: "pipe" }
            );
          } else {
            execSync(`cp "${backupFile}" "${protectedPath.path}"`, {
              stdio: "pipe",
            });
          }
          console.log(`  ✅ Restored: ${protectedPath.path}`);
        } catch (error) {
          console.warn(
            `  ⚠️  Failed to restore ${protectedPath.path}: ${error}`
          );
        }
      }
    }

    console.log("🔄 Restoration completed");
  }

  /**
   * Commit all protected files to git
   */
  async commitProtectedFiles(): Promise<void> {
    console.log("💾 Committing protected files to git...");

    try {
      // Add all .kiro files
      execSync("git add .kiro/", { stdio: "pipe" });

      // Add other critical files
      for (const protectedPath of this.protectedPaths.filter(
        (p) => p.critical
      )) {
        if (existsSync(protectedPath.path)) {
          execSync(`git add "${protectedPath.path}"`, { stdio: "pipe" });
        }
      }

      // Commit with protection message
      const timestamp = new Date().toISOString();
      execSync(
        `git commit -m "🔒 System Protection: Secure critical files - ${timestamp}"`,
        { stdio: "pipe" }
      );

      console.log("💾 Protected files committed to git");
    } catch (error) {
      console.warn("⚠️  Git commit failed (files may already be committed)");
    }
  }

  /**
   * Set up git hooks for protection
   */
  async setupGitHooks(): Promise<void> {
    console.log("🪝 Setting up git protection hooks...");

    const preCommitHook = `#!/bin/sh
# Kiro System Protection - Pre-commit hook
echo "🔒 Kiro System Protection: Validating critical files..."

# Check for .kiro directory
if [ ! -d ".kiro" ]; then
  echo "❌ CRITICAL: .kiro directory missing!"
  echo "Run: npx tsx scripts/kiro-system-protection.ts --restore"
  exit 1
fi

# Check for critical specs
if [ ! -d ".kiro/specs" ]; then
  echo "❌ CRITICAL: .kiro/specs directory missing!"
  echo "Run: npx tsx scripts/kiro-system-protection.ts --restore"
  exit 1
fi

echo "✅ Critical files validated"
exit 0
`;

    try {
      if (!existsSync(".git/hooks")) {
        mkdirSync(".git/hooks", { recursive: true });
      }

      writeFileSync(".git/hooks/pre-commit", preCommitHook);
      execSync("chmod +x .git/hooks/pre-commit", { stdio: "pipe" });

      console.log("🪝 Git protection hooks installed");
    } catch (error) {
      console.warn("⚠️  Failed to install git hooks:", error);
    }
  }

  private updateProtectionStatus(backupTimestamp: string): void {
    const status = {
      lastBackup: backupTimestamp,
      lastValidation: new Date().toISOString(),
      protectedPaths: this.protectedPaths.length,
      criticalPaths: this.protectedPaths.filter((p) => p.critical).length,
    };

    writeFileSync(this.protectionFile, JSON.stringify(status, null, 2));
  }

  /**
   * Generate protection report
   */
  async generateReport(): Promise<void> {
    console.log("📊 Generating system protection report...");

    const integrity = await this.validateSystemIntegrity();
    const timestamp = new Date().toISOString();

    const report = `# Kiro System Protection Report

**Generated:** ${timestamp}
**Status:** ${integrity.valid ? "✅ PROTECTED" : "❌ ISSUES DETECTED"}

## Protected Paths Status

${this.protectedPaths
  .map((p) => {
    const exists = existsSync(p.path);
    const status = exists ? "✅" : "❌";
    const critical = p.critical ? "🔴 CRITICAL" : "🟡 STANDARD";
    return `- ${status} \`${p.path}\` (${critical}) - ${p.description}`;
  })
  .join("\n")}

## Issues Detected

${
  integrity.issues.length > 0
    ? integrity.issues.map((i) => `- ${i}`).join("\n")
    : "No issues detected"
}

## Missing Paths

${
  integrity.missing.length > 0
    ? integrity.missing.map((m) => `- ${m}`).join("\n")
    : "No missing paths"
}

## Recommendations

${
  integrity.valid
    ? "- System is fully protected\n- Regular backups are recommended"
    : "- Run restoration: `npx tsx scripts/kiro-system-protection.ts --restore`\n- Commit protected files: `npx tsx scripts/kiro-system-protection.ts --commit`"
}

---
*Generated by Kiro System Protection v1.0*
`;

    writeFileSync("docs/kiro-system-protection-report.md", report);
    console.log("📊 Report generated: docs/kiro-system-protection-report.md");
  }
}

// CLI Interface
async function main() {
  const protection = new KiroSystemProtection();
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case "--backup":
      await protection.createBackups();
      break;

    case "--validate":
      await protection.validateSystemIntegrity();
      break;

    case "--restore":
      await protection.restoreFromBackup(args[1]);
      break;

    case "--commit":
      await protection.commitProtectedFiles();
      break;

    case "--setup-hooks":
      await protection.setupGitHooks();
      break;

    case "--report":
      await protection.generateReport();
      break;

    case "--full-protection":
      console.log("🔒 Implementing full system protection...");
      await protection.createBackups();
      await protection.commitProtectedFiles();
      await protection.setupGitHooks();
      await protection.generateReport();
      console.log("🔒 Full system protection implemented!");
      break;

    default:
      console.log(`
🔒 Kiro System Protection

Usage:
  npx tsx scripts/kiro-system-protection.ts [command]

Commands:
  --backup          Create comprehensive backups
  --validate        Validate system integrity
  --restore [time]  Restore from backup (latest if no time specified)
  --commit          Commit protected files to git
  --setup-hooks     Install git protection hooks
  --report          Generate protection report
  --full-protection Implement complete protection system

Examples:
  npx tsx scripts/kiro-system-protection.ts --full-protection
  npx tsx scripts/kiro-system-protection.ts --validate
  npx tsx scripts/kiro-system-protection.ts --restore
`);
      break;
  }
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { KiroSystemProtection };
