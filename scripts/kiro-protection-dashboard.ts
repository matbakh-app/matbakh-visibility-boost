#!/usr/bin/env tsx

/**
 * Kiro Protection Dashboard - Real-time System Protection Monitoring
 *
 * Provides a live dashboard for monitoring system protection status,
 * file integrity, backup health, and security alerts.
 */

import { execSync } from "child_process";
import { existsSync, statSync } from "fs";

interface ProtectionStatus {
  timestamp: string;
  systemHealth: "HEALTHY" | "WARNING" | "CRITICAL";
  protectedFiles: {
    total: number;
    healthy: number;
    missing: number;
    corrupted: number;
  };
  backups: {
    total: number;
    latest: string;
    oldestRetained: string;
    totalSize: string;
  };
  gitStatus: {
    uncommittedChanges: number;
    lastCommit: string;
    branch: string;
  };
  alerts: Array<{
    level: "INFO" | "WARNING" | "CRITICAL";
    message: string;
    timestamp: string;
  }>;
}

class KiroProtectionDashboard {
  private protectedPaths = [
    ".kiro/specs",
    ".kiro/policies",
    ".kiro/steering",
    ".kiro/deployment",
    ".kiro/features",
    ".kiro/hooks",
    "package.json",
    "tsconfig.json",
    "vite.config.ts",
    "eslint.config.js",
  ];

  /**
   * Get comprehensive protection status
   */
  async getProtectionStatus(): Promise<ProtectionStatus> {
    const timestamp = new Date().toISOString();
    const alerts: ProtectionStatus["alerts"] = [];

    // Check protected files
    const protectedFiles = this.checkProtectedFiles(alerts);

    // Check backups
    const backups = this.checkBackups(alerts);

    // Check git status
    const gitStatus = this.checkGitStatus(alerts);

    // Determine overall system health
    const systemHealth = this.determineSystemHealth(
      protectedFiles,
      backups,
      alerts
    );

    return {
      timestamp,
      systemHealth,
      protectedFiles,
      backups,
      gitStatus,
      alerts,
    };
  }

  private checkProtectedFiles(alerts: ProtectionStatus["alerts"]) {
    let healthy = 0;
    let missing = 0;
    let corrupted = 0;

    for (const path of this.protectedPaths) {
      if (!existsSync(path)) {
        missing++;
        alerts.push({
          level: "CRITICAL",
          message: `Protected file missing: ${path}`,
          timestamp: new Date().toISOString(),
        });
      } else {
        // Basic integrity check
        try {
          const stats = statSync(path);
          if (stats.size === 0 && path.endsWith(".json")) {
            corrupted++;
            alerts.push({
              level: "WARNING",
              message: `Protected file appears corrupted (0 bytes): ${path}`,
              timestamp: new Date().toISOString(),
            });
          } else {
            healthy++;
          }
        } catch (error) {
          corrupted++;
          alerts.push({
            level: "WARNING",
            message: `Cannot access protected file: ${path}`,
            timestamp: new Date().toISOString(),
          });
        }
      }
    }

    return {
      total: this.protectedPaths.length,
      healthy,
      missing,
      corrupted,
    };
  }

  private checkBackups(alerts: ProtectionStatus["alerts"]) {
    const backupDir = ".kiro-protection/backups";
    let total = 0;
    let latest = "None";
    let oldestRetained = "None";
    let totalSize = "0 MB";

    if (existsSync(backupDir)) {
      try {
        const backups = execSync(`ls -1 ${backupDir} | grep backup- | sort`, {
          encoding: "utf8",
        })
          .trim()
          .split("\n")
          .filter(Boolean);
        total = backups.length;

        if (total > 0) {
          latest = backups[backups.length - 1].replace("backup-", "");
          oldestRetained = backups[0].replace("backup-", "");

          // Calculate total backup size
          const sizeOutput = execSync(`du -sh ${backupDir}`, {
            encoding: "utf8",
          }).trim();
          totalSize = sizeOutput.split("\t")[0];
        }

        // Check backup age
        if (total === 0) {
          alerts.push({
            level: "WARNING",
            message: "No backups found - system protection may be incomplete",
            timestamp: new Date().toISOString(),
          });
        } else {
          const latestBackupTime = new Date(
            latest.replace(/-/g, ":").replace(/T/, " ").replace(/Z$/, "")
          );
          const hoursSinceBackup =
            (Date.now() - latestBackupTime.getTime()) / (1000 * 60 * 60);

          if (hoursSinceBackup > 24) {
            alerts.push({
              level: "WARNING",
              message: `Latest backup is ${Math.round(
                hoursSinceBackup
              )} hours old`,
              timestamp: new Date().toISOString(),
            });
          }
        }
      } catch (error) {
        alerts.push({
          level: "WARNING",
          message: "Cannot access backup directory",
          timestamp: new Date().toISOString(),
        });
      }
    } else {
      alerts.push({
        level: "CRITICAL",
        message: "Backup directory does not exist",
        timestamp: new Date().toISOString(),
      });
    }

    return {
      total,
      latest,
      oldestRetained,
      totalSize,
    };
  }

  private checkGitStatus(alerts: ProtectionStatus["alerts"]) {
    let uncommittedChanges = 0;
    let lastCommit = "Unknown";
    let branch = "Unknown";

    try {
      // Check for uncommitted changes in .kiro
      const gitStatus = execSync("git status --porcelain .kiro/", {
        encoding: "utf8",
      }).trim();
      uncommittedChanges = gitStatus ? gitStatus.split("\n").length : 0;

      // Get last commit
      lastCommit = execSync('git log -1 --format="%h - %s (%cr)"', {
        encoding: "utf8",
      }).trim();

      // Get current branch
      branch = execSync("git branch --show-current", {
        encoding: "utf8",
      }).trim();

      if (uncommittedChanges > 0) {
        alerts.push({
          level: "INFO",
          message: `${uncommittedChanges} uncommitted changes in .kiro directory`,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      alerts.push({
        level: "WARNING",
        message: "Cannot access git information",
        timestamp: new Date().toISOString(),
      });
    }

    return {
      uncommittedChanges,
      lastCommit,
      branch,
    };
  }

  private determineSystemHealth(
    protectedFiles: ProtectionStatus["protectedFiles"],
    backups: ProtectionStatus["backups"],
    alerts: ProtectionStatus["alerts"]
  ): "HEALTHY" | "WARNING" | "CRITICAL" {
    const criticalAlerts = alerts.filter((a) => a.level === "CRITICAL").length;
    const warningAlerts = alerts.filter((a) => a.level === "WARNING").length;

    if (criticalAlerts > 0 || protectedFiles.missing > 0) {
      return "CRITICAL";
    }

    if (
      warningAlerts > 0 ||
      protectedFiles.corrupted > 0 ||
      backups.total === 0
    ) {
      return "WARNING";
    }

    return "HEALTHY";
  }

  /**
   * Display dashboard in terminal
   */
  async displayDashboard(): Promise<void> {
    const status = await this.getProtectionStatus();

    console.clear();
    console.log("🔒 KIRO SYSTEM PROTECTION DASHBOARD");
    console.log("═".repeat(60));
    console.log(
      `📊 Status: ${this.getHealthIcon(status.systemHealth)} ${
        status.systemHealth
      }`
    );
    console.log(`🕐 Updated: ${new Date(status.timestamp).toLocaleString()}`);
    console.log("");

    // Protected Files Status
    console.log("📁 PROTECTED FILES");
    console.log("─".repeat(30));
    console.log(`Total: ${status.protectedFiles.total}`);
    console.log(`✅ Healthy: ${status.protectedFiles.healthy}`);
    console.log(`❌ Missing: ${status.protectedFiles.missing}`);
    console.log(`⚠️  Corrupted: ${status.protectedFiles.corrupted}`);
    console.log("");

    // Backup Status
    console.log("💾 BACKUP STATUS");
    console.log("─".repeat(30));
    console.log(`Total Backups: ${status.backups.total}`);
    console.log(`Latest: ${status.backups.latest}`);
    console.log(`Oldest Retained: ${status.backups.oldestRetained}`);
    console.log(`Total Size: ${status.backups.totalSize}`);
    console.log("");

    // Git Status
    console.log("📝 GIT STATUS");
    console.log("─".repeat(30));
    console.log(`Branch: ${status.gitStatus.branch}`);
    console.log(`Uncommitted Changes: ${status.gitStatus.uncommittedChanges}`);
    console.log(`Last Commit: ${status.gitStatus.lastCommit}`);
    console.log("");

    // Alerts
    if (status.alerts.length > 0) {
      console.log("🚨 ALERTS");
      console.log("─".repeat(30));
      status.alerts.forEach((alert) => {
        const icon =
          alert.level === "CRITICAL"
            ? "🔴"
            : alert.level === "WARNING"
            ? "🟡"
            : "🔵";
        console.log(`${icon} ${alert.level}: ${alert.message}`);
      });
      console.log("");
    }

    // Quick Actions
    console.log("⚡ QUICK ACTIONS");
    console.log("─".repeat(30));
    console.log(
      "npx tsx scripts/kiro-system-protection.ts --validate    # Validate system"
    );
    console.log(
      "npx tsx scripts/kiro-system-protection.ts --backup     # Create backup"
    );
    console.log(
      "npx tsx scripts/kiro-system-protection.ts --restore    # Restore from backup"
    );
    console.log(
      "npx tsx scripts/kiro-system-protection.ts --commit     # Commit changes"
    );
    console.log("");
  }

  private getHealthIcon(health: string): string {
    switch (health) {
      case "HEALTHY":
        return "✅";
      case "WARNING":
        return "⚠️";
      case "CRITICAL":
        return "🔴";
      default:
        return "❓";
    }
  }

  /**
   * Start live monitoring
   */
  async startLiveMonitoring(intervalSeconds: number = 30): Promise<void> {
    console.log(
      `🔒 Starting live protection monitoring (refresh every ${intervalSeconds}s)`
    );
    console.log("Press Ctrl+C to stop");

    const monitor = async () => {
      await this.displayDashboard();
      setTimeout(monitor, intervalSeconds * 1000);
    };

    await monitor();
  }

  /**
   * Generate JSON status report
   */
  async generateJsonReport(): Promise<void> {
    const status = await this.getProtectionStatus();
    const reportPath = "docs/kiro-protection-status.json";

    const fs = await import("fs");
    fs.writeFileSync(reportPath, JSON.stringify(status, null, 2));
    console.log(`📊 Protection status report generated: ${reportPath}`);
  }
}

// CLI Interface
async function main() {
  const dashboard = new KiroProtectionDashboard();
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case "--live":
      const interval = parseInt(args[1]) || 30;
      await dashboard.startLiveMonitoring(interval);
      break;

    case "--status":
      await dashboard.displayDashboard();
      break;

    case "--json":
      await dashboard.generateJsonReport();
      break;

    default:
      console.log(`
🔒 Kiro Protection Dashboard

Usage:
  npx tsx scripts/kiro-protection-dashboard.ts [command]

Commands:
  --status          Show current protection status
  --live [seconds]  Start live monitoring (default: 30s refresh)
  --json            Generate JSON status report

Examples:
  npx tsx scripts/kiro-protection-dashboard.ts --status
  npx tsx scripts/kiro-protection-dashboard.ts --live 10
  npx tsx scripts/kiro-protection-dashboard.ts --json
`);
      break;
  }
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { KiroProtectionDashboard };
