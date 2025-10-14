#!/usr/bin/env tsx
/**
 * Kiro Job System
 *
 * Job registration and execution system for Bedrock
 */
import { spawn } from "child_process";
import { promises as fs } from "fs";
import path from "path";

interface JobDefinition {
  name: string;
  handler: string;
  schedule?: string;
  description?: string;
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
}

interface JobRegistry {
  jobs: Record<string, JobDefinition>;
  version: string;
  lastUpdated: string;
}

class KiroJobSystem {
  private registryPath: string;
  private registry: JobRegistry;

  constructor() {
    this.registryPath = path.join(
      process.cwd(),
      ".kiro",
      "jobs",
      "registry.json"
    );
    this.registry = {
      jobs: {},
      version: "1.0.0",
      lastUpdated: new Date().toISOString(),
    };
  }

  async initialize(): Promise<void> {
    await fs.mkdir(path.dirname(this.registryPath), { recursive: true });
    try {
      const registryData = await fs.readFile(this.registryPath, "utf-8");
      this.registry = JSON.parse(registryData);
    } catch (error) {
      // Registry doesn't exist, create new one
      await this.saveRegistry();
    }
  }

  async registerJob(
    name: string,
    handler: string,
    options: {
      schedule?: string;
      description?: string;
      enabled?: boolean;
    } = {}
  ): Promise<void> {
    console.log(`📝 Registering job: ${name}`);

    // Verify handler exists
    const handlerPath = path.resolve(handler);
    try {
      await fs.access(handlerPath);
    } catch (error) {
      throw new Error(`Handler file not found: ${handlerPath}`);
    }

    this.registry.jobs[name] = {
      name,
      handler: handlerPath,
      schedule: options.schedule,
      description: options.description || `Job: ${name}`,
      enabled: options.enabled !== false,
      lastRun: undefined,
      nextRun: options.schedule
        ? this.calculateNextRun(options.schedule)
        : undefined,
    };

    this.registry.lastUpdated = new Date().toISOString();
    await this.saveRegistry();

    console.log(`✅ Job '${name}' registered successfully`);
    if (options.schedule) {
      console.log(`⏰ Scheduled: ${options.schedule}`);
    }
  }

  async runJob(name: string, args: string[] = []): Promise<void> {
    console.log(`🚀 Running job: ${name}`);

    const job = this.registry.jobs[name];
    if (!job) {
      throw new Error(`Job not found: ${name}`);
    }

    if (!job.enabled) {
      throw new Error(`Job is disabled: ${name}`);
    }

    const startTime = Date.now();
    try {
      await this.executeJob(job, args);

      // Update last run time
      job.lastRun = new Date().toISOString();
      if (job.schedule) {
        job.nextRun = this.calculateNextRun(job.schedule);
      }
      this.registry.lastUpdated = new Date().toISOString();
      await this.saveRegistry();

      const duration = Date.now() - startTime;
      console.log(`✅ Job '${name}' completed successfully in ${duration}ms`);
    } catch (error) {
      console.error(`❌ Job '${name}' failed:`, error);
      throw error;
    }
  }

  async listJobs(): Promise<void> {
    console.log("📋 Registered Jobs:");
    console.log("==================");

    const jobs = Object.values(this.registry.jobs);
    if (jobs.length === 0) {
      console.log("No jobs registered");
      return;
    }

    jobs.forEach((job) => {
      const status = job.enabled ? "✅ Enabled" : "❌ Disabled";
      const lastRun = job.lastRun
        ? new Date(job.lastRun).toLocaleString()
        : "Never";
      const nextRun = job.nextRun
        ? new Date(job.nextRun).toLocaleString()
        : "Not scheduled";

      console.log(`\n📝 ${job.name}`);
      console.log(`   Status: ${status}`);
      console.log(`   Handler: ${job.handler}`);
      console.log(`   Description: ${job.description}`);
      console.log(`   Schedule: ${job.schedule || "Manual"}`);
      console.log(`   Last Run: ${lastRun}`);
      console.log(`   Next Run: ${nextRun}`);
    });
  }

  async enableJob(name: string): Promise<void> {
    const job = this.registry.jobs[name];
    if (!job) {
      throw new Error(`Job not found: ${name}`);
    }

    job.enabled = true;
    this.registry.lastUpdated = new Date().toISOString();
    await this.saveRegistry();
    console.log(`✅ Job '${name}' enabled`);
  }

  async disableJob(name: string): Promise<void> {
    const job = this.registry.jobs[name];
    if (!job) {
      throw new Error(`Job not found: ${name}`);
    }

    job.enabled = false;
    this.registry.lastUpdated = new Date().toISOString();
    await this.saveRegistry();
    console.log(`❌ Job '${name}' disabled`);
  }

  async removeJob(name: string): Promise<void> {
    if (!this.registry.jobs[name]) {
      throw new Error(`Job not found: ${name}`);
    }

    delete this.registry.jobs[name];
    this.registry.lastUpdated = new Date().toISOString();
    await this.saveRegistry();
    console.log(`🗑️ Job '${name}' removed`);
  }

  private async executeJob(job: JobDefinition, args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = spawn("tsx", [job.handler, ...args], {
        stdio: "inherit",
        cwd: process.cwd(),
      });

      child.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Job exited with code ${code}`));
        }
      });

      child.on("error", (error) => {
        reject(error);
      });
    });
  }

  private calculateNextRun(schedule: string): string {
    // Simple schedule parsing - extend as needed
    const now = new Date();

    if (schedule === "daily") {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0); // 9 AM
      return tomorrow.toISOString();
    }

    if (schedule === "hourly") {
      const nextHour = new Date(now);
      nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
      return nextHour.toISOString();
    }

    // Default to daily
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    return tomorrow.toISOString();
  }

  private async saveRegistry(): Promise<void> {
    await fs.writeFile(
      this.registryPath,
      JSON.stringify(this.registry, null, 2)
    );
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    console.log(`
Kiro Job System
Usage: tsx kiro-job-system.ts <command> [options]

Commands:
  register <name> --handler <path>  Register a new job
  run <name> [args...]              Run a job
  list                              List all jobs
  enable <name>                     Enable a job
  disable <name>                    Disable a job
  remove <name>                     Remove a job

Examples:
  tsx kiro-job-system.ts register daily-logbook --handler "./scripts/jobs/daily-logbook.ts"
  tsx kiro-job-system.ts run daily-logbook --date yesterday --dry-run --verbose
  tsx kiro-job-system.ts list
    `);
    process.exit(0);
  }

  const jobSystem = new KiroJobSystem();
  await jobSystem.initialize();

  try {
    switch (command) {
      case "register": {
        const name = args[1];
        const handlerIndex = args.indexOf("--handler");
        const handler =
          handlerIndex !== -1 ? args[handlerIndex + 1] : undefined;

        if (!name || !handler) {
          throw new Error("Job name and handler are required");
        }

        await jobSystem.registerJob(name, handler, {
          schedule: "daily", // Default schedule
          description: `Registered job: ${name}`,
        });
        break;
      }
      case "run": {
        const name = args[1];
        const jobArgs = args.slice(2);

        if (!name) {
          throw new Error("Job name is required");
        }

        await jobSystem.runJob(name, jobArgs);
        break;
      }
      case "list":
        await jobSystem.listJobs();
        break;
      case "enable": {
        const name = args[1];
        if (!name) {
          throw new Error("Job name is required");
        }
        await jobSystem.enableJob(name);
        break;
      }
      case "disable": {
        const name = args[1];
        if (!name) {
          throw new Error("Job name is required");
        }
        await jobSystem.disableJob(name);
        break;
      }
      case "remove": {
        const name = args[1];
        if (!name) {
          throw new Error("Job name is required");
        }
        await jobSystem.removeJob(name);
        break;
      }
      default:
        throw new Error(`Unknown command: ${command}`);
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { JobDefinition, JobRegistry, KiroJobSystem };
