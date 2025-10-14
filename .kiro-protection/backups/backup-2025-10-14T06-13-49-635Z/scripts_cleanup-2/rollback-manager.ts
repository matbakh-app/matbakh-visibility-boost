#!/usr/bin/env tsx

/**
 * Rollback Manager - Cleanup 2
 *
 * Git tagging strategy with phase-based rollback points
 * S3 artifact backup capability and automated rollback triggers
 *
 * Requirements: 6.5, 9.1
 */

import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

export interface RollbackPoint {
  id: string;
  phase: string;
  timestamp: string;
  gitTag: string;
  gitCommit: string;
  description: string;
  artifacts: ArtifactBackup[];
  metadata: {
    branch: string;
    author: string;
    filesChanged: number;
    testsPassing: boolean;
  };
}

export interface ArtifactBackup {
  type: "file" | "directory" | "s3_object";
  source: string;
  backup: string;
  size: number;
  checksum: string;
}

export interface RollbackTrigger {
  type: "build_failure" | "test_failure" | "coverage_drop" | "manual";
  threshold?: number;
  enabled: boolean;
}

export class RollbackManager {
  private rollbackPoints: RollbackPoint[] = [];
  private triggers: RollbackTrigger[] = [
    { type: "build_failure", enabled: true },
    { type: "test_failure", enabled: true },
    { type: "coverage_drop", threshold: 85, enabled: true },
    { type: "manual", enabled: true },
  ];

  private s3Config = {
    bucket: process.env.CLEANUP_BACKUP_BUCKET || "matbakh-cleanup-backups",
    prefix: "cleanup-r2-backups/",
    region: "eu-central-1",
  };

  constructor() {
    this.loadRollbackPoints();
  }

  /**
   * Create a phase-based rollback point with Git tagging
   */
  async createRollbackPoint(
    phase: string,
    description: string
  ): Promise<RollbackPoint> {
    console.log(`🏷️  Creating rollback point for phase: ${phase}`);

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const tagName = `cleanup-r2-${phase}-${timestamp}`;

    // Ensure we're in a clean state
    await this.ensureCleanWorkingDirectory();

    // Get current Git info
    const gitCommit = this.execGitCommand("rev-parse HEAD").trim();
    const branch = this.execGitCommand("rev-parse --abbrev-ref HEAD").trim();
    const author = this.execGitCommand("config user.name").trim();

    // Count changed files since last rollback point
    const filesChanged = this.getChangedFilesCount();

    // Check if tests are passing
    const testsPassing = await this.checkTestsStatus();

    // Create Git tag
    this.execGitCommand(
      `tag -a ${tagName} -m "Cleanup R2 Phase ${phase}: ${description}"`
    );
    console.log(`✅ Created Git tag: ${tagName}`);

    // Create artifact backups
    const artifacts = await this.createArtifactBackups(phase, timestamp);

    const rollbackPoint: RollbackPoint = {
      id: `${phase}-${timestamp}`,
      phase,
      timestamp: new Date().toISOString(),
      gitTag: tagName,
      gitCommit,
      description,
      artifacts,
      metadata: {
        branch,
        author,
        filesChanged,
        testsPassing,
      },
    };

    this.rollbackPoints.push(rollbackPoint);
    await this.saveRollbackPoints();

    console.log(`🎯 Rollback point created: ${rollbackPoint.id}`);
    return rollbackPoint;
  }

  /**
   * Create S3 artifact backups for critical files
   */
  private async createArtifactBackups(
    phase: string,
    timestamp: string
  ): Promise<ArtifactBackup[]> {
    const artifacts: ArtifactBackup[] = [];

    const criticalPaths = [
      "package.json",
      "package-lock.json",
      "tsconfig.json",
      "vite.config.ts",
      "src/",
      "scripts/",
      ".env.example",
      "reports/",
    ];

    for (const sourcePath of criticalPaths) {
      if (fs.existsSync(sourcePath)) {
        try {
          const artifact = await this.backupPath(sourcePath, phase, timestamp);
          artifacts.push(artifact);
        } catch (error) {
          console.warn(`⚠️  Failed to backup ${sourcePath}: ${error}`);
        }
      }
    }

    return artifacts;
  }

  private async backupPath(
    sourcePath: string,
    phase: string,
    timestamp: string
  ): Promise<ArtifactBackup> {
    const stats = fs.statSync(sourcePath);
    const isDirectory = stats.isDirectory();

    const backupName = `${phase}-${timestamp}-${path.basename(sourcePath)}${
      isDirectory ? ".tar.gz" : ""
    }`;
    const backupPath = path.join("backups", backupName);

    // Ensure backup directory exists
    fs.mkdirSync("backups", { recursive: true });

    if (isDirectory) {
      // Create tar.gz for directories
      this.execCommand(`tar -czf ${backupPath} ${sourcePath}`);
    } else {
      // Copy files directly
      fs.copyFileSync(sourcePath, backupPath);
    }

    const backupStats = fs.statSync(backupPath);
    const checksum = await this.calculateChecksum(backupPath);

    // Optional: Upload to S3 if configured
    if (process.env.CLEANUP_BACKUP_S3_ENABLED === "true") {
      await this.uploadToS3(backupPath, backupName);
    }

    return {
      type: isDirectory ? "directory" : "file",
      source: sourcePath,
      backup: backupPath,
      size: backupStats.size,
      checksum,
    };
  }

  /**
   * Automated rollback based on triggers
   */
  async checkAndTriggerRollback(): Promise<boolean> {
    console.log("🔍 Checking rollback triggers...");

    for (const trigger of this.triggers) {
      if (!trigger.enabled) continue;

      const shouldRollback = await this.evaluateTrigger(trigger);
      if (shouldRollback) {
        console.log(`🚨 Rollback triggered by: ${trigger.type}`);
        await this.executeRollback();
        return true;
      }
    }

    return false;
  }

  private async evaluateTrigger(trigger: RollbackTrigger): Promise<boolean> {
    switch (trigger.type) {
      case "build_failure":
        return !(await this.checkBuildStatus());

      case "test_failure":
        return !(await this.checkTestsStatus());

      case "coverage_drop":
        const coverage = await this.getCoveragePercentage();
        return coverage < (trigger.threshold || 85);

      case "manual":
        return false; // Manual triggers are handled separately

      default:
        return false;
    }
  }

  /**
   * Execute rollback to the latest rollback point
   */
  async executeRollback(rollbackPointId?: string): Promise<void> {
    const targetPoint = rollbackPointId
      ? this.rollbackPoints.find((p) => p.id === rollbackPointId)
      : this.getLatestRollbackPoint();

    if (!targetPoint) {
      throw new Error("No rollback point available");
    }

    console.log(
      `🔄 Rolling back to: ${targetPoint.id} (${targetPoint.gitTag})`
    );

    // Stash current changes
    try {
      this.execGitCommand('stash push -m "Pre-rollback stash"');
    } catch (error) {
      console.log("ℹ️  No changes to stash");
    }

    // Checkout the rollback tag
    this.execGitCommand(`checkout ${targetPoint.gitTag}`);

    // Restore artifacts if needed
    await this.restoreArtifacts(targetPoint);

    // Verify rollback success
    const isValid = await this.verifyRollbackState(targetPoint);
    if (!isValid) {
      throw new Error("Rollback verification failed");
    }

    console.log(`✅ Rollback completed successfully to ${targetPoint.gitTag}`);

    // Log rollback event
    await this.logRollbackEvent(targetPoint, "success");
  }

  private async restoreArtifacts(rollbackPoint: RollbackPoint): Promise<void> {
    console.log("📦 Restoring artifacts...");

    for (const artifact of rollbackPoint.artifacts) {
      try {
        if (fs.existsSync(artifact.backup)) {
          if (artifact.type === "directory") {
            // Extract tar.gz
            this.execCommand(`tar -xzf ${artifact.backup}`);
          } else {
            // Copy file back
            fs.copyFileSync(artifact.backup, artifact.source);
          }
          console.log(`✅ Restored: ${artifact.source}`);
        } else {
          console.warn(`⚠️  Backup not found: ${artifact.backup}`);
        }
      } catch (error) {
        console.error(`❌ Failed to restore ${artifact.source}: ${error}`);
      }
    }
  }

  private async verifyRollbackState(
    rollbackPoint: RollbackPoint
  ): Promise<boolean> {
    try {
      // Verify Git state
      const currentCommit = this.execGitCommand("rev-parse HEAD").trim();
      if (currentCommit !== rollbackPoint.gitCommit) {
        console.error("❌ Git commit mismatch after rollback");
        return false;
      }

      // Verify critical files exist
      const criticalFiles = ["package.json", "src/App.tsx", "vite.config.ts"];
      for (const file of criticalFiles) {
        if (!fs.existsSync(file)) {
          console.error(`❌ Critical file missing: ${file}`);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error(`❌ Rollback verification failed: ${error}`);
      return false;
    }
  }

  /**
   * List all available rollback points
   */
  listRollbackPoints(): RollbackPoint[] {
    return [...this.rollbackPoints].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  /**
   * Get the latest rollback point
   */
  getLatestRollbackPoint(): RollbackPoint | undefined {
    const sorted = this.listRollbackPoints();
    return sorted[0];
  }

  /**
   * Clean up old rollback points (keep last 10)
   */
  async cleanupOldRollbackPoints(): Promise<void> {
    const sorted = this.listRollbackPoints();
    const toDelete = sorted.slice(10); // Keep last 10

    for (const point of toDelete) {
      try {
        // Delete Git tag
        this.execGitCommand(`tag -d ${point.gitTag}`);

        // Delete artifact backups
        for (const artifact of point.artifacts) {
          if (fs.existsSync(artifact.backup)) {
            fs.unlinkSync(artifact.backup);
          }
        }

        console.log(`🗑️  Cleaned up rollback point: ${point.id}`);
      } catch (error) {
        console.warn(`⚠️  Failed to cleanup ${point.id}: ${error}`);
      }
    }

    // Update rollback points list
    this.rollbackPoints = sorted.slice(0, 10);
    await this.saveRollbackPoints();
  }

  // Utility methods
  private ensureCleanWorkingDirectory(): void {
    const status = this.execGitCommand("status --porcelain").trim();
    if (status) {
      throw new Error(
        "Working directory is not clean. Please commit or stash changes."
      );
    }
  }

  private execGitCommand(command: string): string {
    return execSync(`git ${command}`, { encoding: "utf-8" });
  }

  private execCommand(command: string): string {
    return execSync(command, { encoding: "utf-8" });
  }

  private getChangedFilesCount(): number {
    try {
      const lastTag = this.getLatestRollbackPoint()?.gitTag;
      if (!lastTag) return 0;

      const diff = this.execGitCommand(`diff --name-only ${lastTag} HEAD`);
      return diff.trim() ? diff.trim().split("\n").length : 0;
    } catch {
      return 0;
    }
  }

  private async checkBuildStatus(): Promise<boolean> {
    try {
      execSync("npm run build", { stdio: "pipe" });
      return true;
    } catch {
      return false;
    }
  }

  private async checkTestsStatus(): Promise<boolean> {
    try {
      execSync("npm test -- --run --passWithNoTests", { stdio: "pipe" });
      return true;
    } catch {
      return false;
    }
  }

  private async getCoveragePercentage(): Promise<number> {
    try {
      const result = execSync(
        "npm test -- --coverage --run --passWithNoTests",
        { encoding: "utf-8" }
      );
      const match = result.match(
        /All files[^|]*\|[^|]*\|[^|]*\|[^|]*\|[^|]*(\d+\.?\d*)/
      );
      return match ? parseFloat(match[1]) : 0;
    } catch {
      return 0;
    }
  }

  private async calculateChecksum(filePath: string): Promise<string> {
    const crypto = await import("crypto");
    const content = fs.readFileSync(filePath);
    return crypto.createHash("sha256").update(content).digest("hex");
  }

  private async uploadToS3(localPath: string, s3Key: string): Promise<void> {
    // Placeholder for S3 upload - would use AWS SDK in real implementation
    console.log(
      `📤 Would upload ${localPath} to s3://${this.s3Config.bucket}/${this.s3Config.prefix}${s3Key}`
    );
  }

  private async logRollbackEvent(
    rollbackPoint: RollbackPoint,
    status: "success" | "failure"
  ): Promise<void> {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event: "rollback_executed",
      rollbackPoint: rollbackPoint.id,
      gitTag: rollbackPoint.gitTag,
      status,
      phase: rollbackPoint.phase,
    };

    const logPath = "reports/rollback-events.log";
    fs.appendFileSync(logPath, JSON.stringify(logEntry) + "\n");
  }

  private loadRollbackPoints(): void {
    const rollbackFile = "reports/rollback-points.json";
    if (fs.existsSync(rollbackFile)) {
      try {
        const data = fs.readFileSync(rollbackFile, "utf-8");
        this.rollbackPoints = JSON.parse(data);
      } catch (error) {
        console.warn("⚠️  Failed to load rollback points:", error);
        this.rollbackPoints = [];
      }
    }
  }

  private async saveRollbackPoints(): Promise<void> {
    const rollbackFile = "reports/rollback-points.json";
    fs.mkdirSync(path.dirname(rollbackFile), { recursive: true });
    fs.writeFileSync(
      rollbackFile,
      JSON.stringify(this.rollbackPoints, null, 2)
    );
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  async function main() {
    const manager = new RollbackManager();
    const command = process.argv[2];

    try {
      switch (command) {
        case "create":
          const phase = process.argv[3] || "manual";
          const description = process.argv[4] || "Manual rollback point";
          await manager.createRollbackPoint(phase, description);
          break;

        case "rollback":
          const pointId = process.argv[3];
          await manager.executeRollback(pointId);
          break;

        case "list":
          const points = manager.listRollbackPoints();
          console.log("\n📋 ROLLBACK POINTS");
          console.log("==================");
          points.forEach((point) => {
            console.log(`${point.id}: ${point.gitTag} (${point.description})`);
            console.log(
              `  Phase: ${point.phase}, Files: ${
                point.metadata.filesChanged
              }, Tests: ${point.metadata.testsPassing ? "✅" : "❌"}`
            );
          });
          break;

        case "check":
          const triggered = await manager.checkAndTriggerRollback();
          console.log(
            triggered ? "🚨 Rollback triggered" : "✅ No rollback needed"
          );
          break;

        case "cleanup":
          await manager.cleanupOldRollbackPoints();
          break;

        default:
          console.log(
            "Usage: rollback-manager.ts <create|rollback|list|check|cleanup> [args...]"
          );
          console.log(
            "  create <phase> <description> - Create new rollback point"
          );
          console.log("  rollback [pointId]           - Execute rollback");
          console.log("  list                         - List rollback points");
          console.log(
            "  check                        - Check rollback triggers"
          );
          console.log(
            "  cleanup                      - Clean up old rollback points"
          );
      }
    } catch (error) {
      console.error("❌ Command failed:", error);
      process.exit(1);
    }
  }

  main();
}
