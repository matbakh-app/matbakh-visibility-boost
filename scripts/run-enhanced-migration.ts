#!/usr/bin/env ts-node

/**
 * Enhanced Migration Execution Script
 *
 * Executes the complete Supabase to AWS migration with the new
 * cost monitoring and pricing validation tasks integrated.
 */

import { promises as fs } from "fs";
import { join } from "path";
import { MigrationOrchestrator } from "./supabase-migration/migration-orchestrator";

interface MigrationReport {
  startTime: Date;
  endTime?: Date;
  duration?: number;
  status: string;
  completedTasks: number;
  totalTasks: number;
  errors: string[];
  warnings: string[];
  costAnalysis?: {
    sampleCostData: any;
    pricingValidation: any;
  };
}

class EnhancedMigrationRunner {
  private orchestrator: MigrationOrchestrator;
  private report: MigrationReport;

  constructor() {
    // Configure migration with enhanced settings
    this.orchestrator = new MigrationOrchestrator({
      dryRun: process.argv.includes("--dry-run"),
      continueOnError: process.argv.includes("--continue-on-error"),
      backupBeforeStart: !process.argv.includes("--no-backup"),
      enableRollback: !process.argv.includes("--no-rollback"),
      maxRetries: 3,
      retryDelay: 5000,
    });

    this.report = {
      startTime: new Date(),
      status: "not_started",
      completedTasks: 0,
      totalTasks: 0,
      errors: [],
      warnings: [],
    };
  }

  /**
   * Execute the enhanced migration with real-time progress reporting
   */
  async execute(): Promise<void> {
    console.log("🚀 Starting Enhanced Supabase to AWS Migration");
    console.log("================================================\n");

    try {
      // Start progress monitoring
      const progressMonitor = this.startProgressMonitoring();

      // Execute migration
      await this.orchestrator.executeMigration();

      // Stop progress monitoring
      clearInterval(progressMonitor);

      // Generate final report
      await this.generateEnhancedReport();

      console.log("\n🎉 Enhanced Migration completed successfully!");
      console.log("📋 Check migration-logs/ for detailed reports");
    } catch (error) {
      console.error("\n❌ Enhanced Migration failed:", error.message);

      // Generate failure report
      await this.generateFailureReport(error);

      throw error;
    }
  }

  /**
   * Start real-time progress monitoring
   */
  private startProgressMonitoring(): NodeJS.Timeout {
    return setInterval(() => {
      const status = this.orchestrator.getStatus();
      const tasks = this.orchestrator.getTasks();

      this.updateReport(status, tasks);
      this.displayProgress(status, tasks);
    }, 10000); // Update every 10 seconds
  }

  /**
   * Update internal report with current status
   */
  private updateReport(status: any, tasks: any[]): void {
    this.report.status = status.status;
    this.report.completedTasks = status.completedTasks;
    this.report.totalTasks = status.totalTasks;
    this.report.errors = status.errors;
    this.report.warnings = status.warnings;
  }

  /**
   * Display real-time progress
   */
  private displayProgress(status: any, tasks: any[]): void {
    const progressPercent = (
      (status.completedTasks / status.totalTasks) *
      100
    ).toFixed(1);
    const currentPhase = status.currentPhase;

    console.log(
      `\n📊 Migration Progress: ${progressPercent}% (${status.completedTasks}/${status.totalTasks} tasks)`
    );
    console.log(`📋 Current Phase: ${currentPhase}/8`);

    // Show current running tasks
    const runningTasks = tasks.filter((t) => t.status === "running");
    if (runningTasks.length > 0) {
      console.log("🔧 Currently running:");
      runningTasks.forEach((task) => {
        const duration = task.startTime
          ? (
              (new Date().getTime() - new Date(task.startTime).getTime()) /
              1000
            ).toFixed(0)
          : "0";
        console.log(`  - ${task.name} (${duration}s)`);
      });
    }

    // Show recently completed tasks
    const recentlyCompleted = tasks
      .filter((t) => t.status === "completed" && t.endTime)
      .sort(
        (a, b) =>
          new Date(b.endTime!).getTime() - new Date(a.endTime!).getTime()
      )
      .slice(0, 3);

    if (recentlyCompleted.length > 0) {
      console.log("✅ Recently completed:");
      recentlyCompleted.forEach((task) => {
        const duration =
          task.startTime && task.endTime
            ? (
                (new Date(task.endTime).getTime() -
                  new Date(task.startTime).getTime()) /
                1000
              ).toFixed(0)
            : "0";
        console.log(`  - ${task.name} (${duration}s)`);
      });
    }

    // Show errors and warnings
    if (status.errors.length > 0) {
      console.log("❌ Errors:");
      status.errors
        .slice(-3)
        .forEach((error: string) => console.log(`  - ${error}`));
    }

    if (status.warnings.length > 0) {
      console.log("⚠️ Warnings:");
      status.warnings
        .slice(-3)
        .forEach((warning: string) => console.log(`  - ${warning}`));
    }

    console.log("─".repeat(60));
  }

  /**
   * Generate enhanced final report
   */
  private async generateEnhancedReport(): Promise<void> {
    console.log("\n📊 Generating Enhanced Migration Report...");

    const status = this.orchestrator.getStatus();
    const tasks = this.orchestrator.getTasks();

    this.report.endTime = new Date();
    this.report.duration =
      this.report.endTime.getTime() - this.report.startTime.getTime();

    const enhancedReport = {
      migration: {
        startTime: this.report.startTime,
        endTime: this.report.endTime,
        duration: this.report.duration,
        durationFormatted: this.formatDuration(this.report.duration),
        status: this.report.status,
      },
      summary: {
        totalTasks: tasks.length,
        completedTasks: tasks.filter((t) => t.status === "completed").length,
        failedTasks: tasks.filter((t) => t.status === "failed").length,
        skippedTasks: tasks.filter((t) => t.status === "skipped").length,
        successRate:
          (
            (tasks.filter((t) => t.status === "completed").length /
              tasks.length) *
            100
          ).toFixed(1) + "%",
      },
      phases: this.generatePhaseReport(tasks),
      newFeatures: {
        costMonitoring: {
          implemented:
            tasks.find((t) => t.id === "task-4.1")?.status === "completed",
          description: "VC Cost Tagger integration for real-time cost tracking",
        },
        pricingValidation: {
          implemented:
            tasks.find((t) => t.id === "task-4.2")?.status === "completed",
          description: "Pricing simulator for tier optimization",
        },
        enhancedDataPipeline: {
          implemented:
            tasks.find((t) => t.id === "task-4")?.status === "completed",
          description: "Advanced data migration with validation and rollback",
        },
      },
      tasks: tasks.map((task) => ({
        id: task.id,
        name: task.name,
        phase: task.phase,
        status: task.status,
        priority: task.priority,
        estimatedHours: task.estimatedHours,
        actualDuration:
          task.startTime && task.endTime
            ? (new Date(task.endTime).getTime() -
                new Date(task.startTime).getTime()) /
              1000
            : null,
        error: task.error,
      })),
      performance: {
        averageTaskDuration: this.calculateAverageTaskDuration(tasks),
        longestTask: this.findLongestTask(tasks),
        shortestTask: this.findShortestTask(tasks),
      },
      recommendations: this.generateRecommendations(tasks, status),
    };

    // Save enhanced report
    const reportPath = join(
      process.cwd(),
      "migration-logs",
      "enhanced-migration-report.json"
    );
    await fs.writeFile(reportPath, JSON.stringify(enhancedReport, null, 2));

    // Generate human-readable summary
    await this.generateHumanReadableSummary(enhancedReport);

    console.log(`📋 Enhanced report saved: ${reportPath}`);
  }

  /**
   * Generate phase-wise report
   */
  private generatePhaseReport(tasks: any[]): any[] {
    const phases = [];

    for (let phase = 1; phase <= 8; phase++) {
      const phaseTasks = tasks.filter((t) => t.phase === phase);
      const completedTasks = phaseTasks.filter((t) => t.status === "completed");

      phases.push({
        phase,
        name: this.getPhaseName(phase),
        totalTasks: phaseTasks.length,
        completedTasks: completedTasks.length,
        status:
          completedTasks.length === phaseTasks.length
            ? "completed"
            : phaseTasks.some((t) => t.status === "running")
            ? "running"
            : completedTasks.length > 0
            ? "partial"
            : "pending",
        tasks: phaseTasks.map((t) => ({
          id: t.id,
          name: t.name,
          status: t.status,
        })),
      });
    }

    return phases;
  }

  /**
   * Get phase name by number
   */
  private getPhaseName(phase: number): string {
    const phaseNames = {
      1: "Infrastructure Foundation",
      2: "Schema and Data Migration",
      3: "Authentication Migration",
      4: "Storage Migration",
      5: "Real-time and Functions Migration",
      6: "Integration Testing and Validation",
      7: "Production Deployment",
      8: "Post-Migration Optimization",
    };

    return phaseNames[phase as keyof typeof phaseNames] || `Phase ${phase}`;
  }

  /**
   * Calculate average task duration
   */
  private calculateAverageTaskDuration(tasks: any[]): number {
    const completedTasks = tasks.filter(
      (t) => t.status === "completed" && t.startTime && t.endTime
    );
    if (completedTasks.length === 0) return 0;

    const totalDuration = completedTasks.reduce((sum, task) => {
      return (
        sum +
        (new Date(task.endTime).getTime() - new Date(task.startTime).getTime())
      );
    }, 0);

    return totalDuration / completedTasks.length / 1000; // Convert to seconds
  }

  /**
   * Find longest task
   */
  private findLongestTask(tasks: any[]): any {
    const completedTasks = tasks.filter(
      (t) => t.status === "completed" && t.startTime && t.endTime
    );
    if (completedTasks.length === 0) return null;

    return completedTasks.reduce((longest, task) => {
      const duration =
        new Date(task.endTime).getTime() - new Date(task.startTime).getTime();
      const longestDuration = longest
        ? new Date(longest.endTime).getTime() -
          new Date(longest.startTime).getTime()
        : 0;

      return duration > longestDuration ? task : longest;
    });
  }

  /**
   * Find shortest task
   */
  private findShortestTask(tasks: any[]): any {
    const completedTasks = tasks.filter(
      (t) => t.status === "completed" && t.startTime && t.endTime
    );
    if (completedTasks.length === 0) return null;

    return completedTasks.reduce((shortest, task) => {
      const duration =
        new Date(task.endTime).getTime() - new Date(task.startTime).getTime();
      const shortestDuration = shortest
        ? new Date(shortest.endTime).getTime() -
          new Date(shortest.startTime).getTime()
        : Infinity;

      return duration < shortestDuration ? task : shortest;
    });
  }

  /**
   * Generate recommendations based on migration results
   */
  private generateRecommendations(tasks: any[], status: any): string[] {
    const recommendations = [];

    const failedTasks = tasks.filter((t) => t.status === "failed");
    if (failedTasks.length > 0) {
      recommendations.push(
        `Review and retry ${failedTasks.length} failed tasks`
      );
    }

    const skippedTasks = tasks.filter((t) => t.status === "skipped");
    if (skippedTasks.length > 0) {
      recommendations.push(
        `Evaluate ${skippedTasks.length} skipped tasks for future implementation`
      );
    }

    if (status.warnings.length > 0) {
      recommendations.push(
        `Address ${status.warnings.length} warnings for optimal performance`
      );
    }

    // Check if new features were implemented
    const costMonitoringTask = tasks.find((t) => t.id === "task-4.1");
    if (costMonitoringTask?.status === "completed") {
      recommendations.push(
        "Set up regular cost monitoring alerts using the integrated VC Cost Tagger"
      );
    }

    const pricingTask = tasks.find((t) => t.id === "task-4.2");
    if (pricingTask?.status === "completed") {
      recommendations.push(
        "Review pricing simulation results and adjust tier pricing if needed"
      );
    }

    recommendations.push(
      "Monitor system performance for 48 hours post-migration"
    );
    recommendations.push("Schedule regular backup validation tests");

    return recommendations;
  }

  /**
   * Generate human-readable summary
   */
  private async generateHumanReadableSummary(report: any): Promise<void> {
    const summary = `
# Enhanced Migration Summary

## Overview
- **Start Time**: ${report.migration.startTime}
- **End Time**: ${report.migration.endTime}
- **Duration**: ${report.migration.durationFormatted}
- **Status**: ${report.migration.status.toUpperCase()}
- **Success Rate**: ${report.summary.successRate}

## Task Summary
- **Total Tasks**: ${report.summary.totalTasks}
- **Completed**: ${report.summary.completedTasks}
- **Failed**: ${report.summary.failedTasks}
- **Skipped**: ${report.summary.skippedTasks}

## New Features Implemented
${Object.entries(report.newFeatures)
  .map(
    ([key, feature]: [string, any]) =>
      `- **${key}**: ${feature.implemented ? "✅" : "❌"} ${
        feature.description
      }`
  )
  .join("\n")}

## Phase Status
${report.phases
  .map(
    (phase: any) =>
      `- **Phase ${phase.phase}** (${
        phase.name
      }): ${phase.status.toUpperCase()} (${phase.completedTasks}/${
        phase.totalTasks
      })`
  )
  .join("\n")}

## Performance Metrics
- **Average Task Duration**: ${(
      report.performance.averageTaskDuration / 60
    ).toFixed(1)} minutes
- **Longest Task**: ${report.performance.longestTask?.name || "N/A"}
- **Shortest Task**: ${report.performance.shortestTask?.name || "N/A"}

## Recommendations
${report.recommendations.map((rec: string) => `- ${rec}`).join("\n")}

---
Generated on ${new Date().toISOString()}
`;

    const summaryPath = join(
      process.cwd(),
      "migration-logs",
      "migration-summary.md"
    );
    await fs.writeFile(summaryPath, summary);

    console.log(`📄 Human-readable summary: ${summaryPath}`);
  }

  /**
   * Generate failure report
   */
  private async generateFailureReport(error: Error): Promise<void> {
    const status = this.orchestrator.getStatus();
    const tasks = this.orchestrator.getTasks();

    const failureReport = {
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        stack: error.stack,
      },
      migrationStatus: status,
      completedTasks: tasks
        .filter((t) => t.status === "completed")
        .map((t) => t.name),
      failedTasks: tasks
        .filter((t) => t.status === "failed")
        .map((t) => ({ name: t.name, error: t.error })),
      rollbackRequired: tasks.some(
        (t) => t.status === "completed" && t.rollbackRequired !== false
      ),
    };

    const failurePath = join(
      process.cwd(),
      "migration-logs",
      "migration-failure-report.json"
    );
    await fs.writeFile(failurePath, JSON.stringify(failureReport, null, 2));

    console.log(`💥 Failure report saved: ${failurePath}`);
  }

  /**
   * Format duration in human-readable format
   */
  private formatDuration(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }
}

// Execute if run directly
if (require.main === module) {
  const runner = new EnhancedMigrationRunner();

  runner
    .execute()
    .then(() => {
      console.log("\n🎉 Enhanced Migration Runner completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Enhanced Migration Runner failed:", error.message);
      process.exit(1);
    });
}

export { EnhancedMigrationRunner };
