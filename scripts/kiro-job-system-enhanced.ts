#!/usr/bin/env tsx
/**
 * Kiro Job System Enhanced
 *
 * Job registration and execution system for Bedrock with Email support
 */
import { spawn } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import { EmailAttachment, emailService } from "./services/email-service.js";

interface JobDefinition {
  name: string;
  handler: string;
  schedule?: string;
  description?: string;
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
  emailNotification?: {
    enabled: boolean;
    recipients: string[];
    onSuccess?: boolean;
    onFailure?: boolean;
    attachLogs?: boolean;
  };
}

interface JobRegistry {
  jobs: Record<string, JobDefinition>;
  version: string;
  lastUpdated: string;
}

interface JobResult {
  success: boolean;
  duration: number;
  output?: string;
  error?: string;
  logFile?: string;
}

class KiroJobSystemEnhanced {
  private registryPath: string;
  private registry: JobRegistry;
  private logsDir: string;

  constructor() {
    this.registryPath = path.join(
      process.cwd(),
      ".kiro",
      "jobs",
      "registry.json"
    );
    this.logsDir = path.join(process.cwd(), "logs", "jobs");
    this.registry = {
      jobs: {},
      version: "1.0.0",
      lastUpdated: new Date().toISOString(),
    };
  }

  async initialize(): Promise<void> {
    await fs.mkdir(path.dirname(this.registryPath), { recursive: true });
    await fs.mkdir(this.logsDir, { recursive: true });

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
      emailNotification?: {
        enabled: boolean;
        recipients: string[];
        onSuccess?: boolean;
        onFailure?: boolean;
        attachLogs?: boolean;
      };
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
      emailNotification: options.emailNotification,
    };

    this.registry.lastUpdated = new Date().toISOString();
    await this.saveRegistry();

    console.log(`✅ Job '${name}' registered successfully`);
    if (options.schedule) {
      console.log(`⏰ Scheduled: ${options.schedule}`);
    }
    if (options.emailNotification?.enabled) {
      console.log(
        `📧 Email notifications enabled for: ${options.emailNotification.recipients.join(
          ", "
        )}`
      );
    }
  }

  async runJob(name: string, args: string[] = []): Promise<JobResult> {
    console.log(`🚀 Running job: ${name}`);

    const job = this.registry.jobs[name];
    if (!job) {
      throw new Error(`Job not found: ${name}`);
    }

    if (!job.enabled) {
      throw new Error(`Job is disabled: ${name}`);
    }

    const startTime = Date.now();
    const logFile = path.join(this.logsDir, `${name}-${Date.now()}.log`);

    try {
      const result = await this.executeJob(job, args, logFile);

      // Update last run time
      job.lastRun = new Date().toISOString();
      if (job.schedule) {
        job.nextRun = this.calculateNextRun(job.schedule);
      }
      this.registry.lastUpdated = new Date().toISOString();
      await this.saveRegistry();

      const duration = Date.now() - startTime;
      console.log(`✅ Job '${name}' completed successfully in ${duration}ms`);

      const jobResult: JobResult = {
        success: true,
        duration,
        output: result.output,
        logFile,
      };

      // Send email notification if configured
      if (job.emailNotification?.enabled && job.emailNotification.onSuccess) {
        await this.sendJobNotification(job, jobResult);
      }

      return jobResult;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ Job '${name}' failed:`, error);

      const jobResult: JobResult = {
        success: false,
        duration,
        error: error instanceof Error ? error.message : String(error),
        logFile,
      };

      // Send email notification if configured
      if (job.emailNotification?.enabled && job.emailNotification.onFailure) {
        await this.sendJobNotification(job, jobResult);
      }

      throw error;
    }
  }

  private async sendJobNotification(
    job: JobDefinition,
    result: JobResult
  ): Promise<void> {
    if (!job.emailNotification?.enabled) return;

    const subject = result.success
      ? `✅ Job '${job.name}' completed successfully`
      : `❌ Job '${job.name}' failed`;

    const body = this.generateEmailBody(job, result);
    const attachments: EmailAttachment[] = [];

    // Attach log file if requested and exists
    if (job.emailNotification.attachLogs && result.logFile) {
      try {
        await fs.access(result.logFile);
        attachments.push({
          filename: `${job.name}-log.txt`,
          path: result.logFile,
          contentType: "text/plain",
        });
      } catch (error) {
        console.warn(`Log file not found for attachment: ${result.logFile}`);
      }
    }

    // Special handling for Captain's Log
    if (job.name === "daily-logbook") {
      await this.sendCaptainLogEmail(job, result, body);
      return;
    }

    // Send regular job notification
    for (const recipient of job.emailNotification.recipients) {
      try {
        await emailService.sendEmail({
          to: recipient,
          subject,
          body,
          attachments,
        });
        console.log(`📧 Job notification sent to ${recipient}`);
      } catch (error) {
        console.error(
          `Failed to send job notification to ${recipient}:`,
          error
        );
      }
    }
  }

  private async sendCaptainLogEmail(
    job: JobDefinition,
    result: JobResult,
    body: string
  ): Promise<void> {
    const date = new Date().toISOString().split("T")[0];

    // Look for generated markdown and JSON files
    const logbookDir = path.join(process.cwd(), "logs", "daily-logbook");
    const markdownFile = path.join(logbookDir, `${date}.md`);
    const jsonFile = path.join(logbookDir, `${date}.json`);

    const attachments: EmailAttachment[] = [];

    // Add markdown file if exists
    try {
      await fs.access(markdownFile);
      attachments.push({
        filename: `captain-log-${date}.md`,
        path: markdownFile,
        contentType: "text/markdown",
      });
    } catch (error) {
      console.warn(`Markdown file not found: ${markdownFile}`);
    }

    // Add JSON file if exists
    try {
      await fs.access(jsonFile);
      attachments.push({
        filename: `captain-log-${date}.json`,
        path: jsonFile,
        contentType: "application/json",
      });
    } catch (error) {
      console.warn(`JSON file not found: ${jsonFile}`);
    }

    // Send Captain's Log email
    try {
      await emailService.sendEmail({
        to: "mail@matbakh.app",
        subject: `Captain's Log – ${date}`,
        body: body,
        attachments: attachments,
      });
      console.log(`📧 Captain's Log email sent successfully`);
    } catch (error) {
      console.error(`Failed to send Captain's Log email:`, error);
    }
  }

  private generateEmailBody(job: JobDefinition, result: JobResult): string {
    const status = result.success ? "✅ SUCCESS" : "❌ FAILURE";
    const duration = `${result.duration}ms`;

    let body = `
Job Execution Report
===================

Job Name: ${job.name}
Status: ${status}
Duration: ${duration}
Timestamp: ${new Date().toISOString()}

Description: ${job.description}
Handler: ${job.handler}
`;

    if (result.success && result.output) {
      body += `\nOutput:\n${result.output}`;
    }

    if (!result.success && result.error) {
      body += `\nError:\n${result.error}`;
    }

    if (result.logFile) {
      body += `\nLog File: ${result.logFile}`;
    }

    body += `\n\n---\nGenerated by Kiro Job System Enhanced`;

    return body.trim();
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
      const emailStatus = job.emailNotification?.enabled
        ? `📧 Email: ${job.emailNotification.recipients.join(", ")}`
        : "📧 Email: Disabled";

      console.log(`\n📝 ${job.name}`);
      console.log(`   Status: ${status}`);
      console.log(`   Handler: ${job.handler}`);
      console.log(`   Description: ${job.description}`);
      console.log(`   Schedule: ${job.schedule || "Manual"}`);
      console.log(`   Last Run: ${lastRun}`);
      console.log(`   Next Run: ${nextRun}`);
      console.log(`   ${emailStatus}`);
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

  private async executeJob(
    job: JobDefinition,
    args: string[],
    logFile: string
  ): Promise<{ output: string }> {
    return new Promise((resolve, reject) => {
      let output = "";

      const child = spawn("tsx", [job.handler, ...args], {
        stdio: ["inherit", "pipe", "pipe"],
        cwd: process.cwd(),
      });

      // Capture output
      child.stdout?.on("data", (data) => {
        const text = data.toString();
        output += text;
        process.stdout.write(text); // Also show in console
      });

      child.stderr?.on("data", (data) => {
        const text = data.toString();
        output += text;
        process.stderr.write(text); // Also show in console
      });

      child.on("close", async (code) => {
        // Write log file
        try {
          await fs.writeFile(logFile, output);
        } catch (error) {
          console.warn(`Failed to write log file: ${error}`);
        }

        if (code === 0) {
          resolve({ output });
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
Kiro Job System Enhanced
Usage: tsx kiro-job-system-enhanced.ts <command> [options]

Commands:
  register <name> --handler <path>  Register a new job
  run <name> [args...]              Run a job
  list                              List all jobs
  enable <name>                     Enable a job
  disable <name>                    Disable a job
  remove <name>                     Remove a job

Examples:
  tsx kiro-job-system-enhanced.ts register daily-logbook --handler "./scripts/jobs/daily-logbook.ts"
  tsx kiro-job-system-enhanced.ts run daily-logbook --date yesterday --dry-run --verbose
  tsx kiro-job-system-enhanced.ts list
    `);
    process.exit(0);
  }

  const jobSystem = new KiroJobSystemEnhanced();
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

        // Special configuration for daily-logbook
        const emailNotification =
          name === "daily-logbook"
            ? {
                enabled: true,
                recipients: ["mail@matbakh.app"],
                onSuccess: true,
                onFailure: true,
                attachLogs: true,
              }
            : undefined;

        await jobSystem.registerJob(name, handler, {
          schedule: "daily", // Default schedule
          description: `Registered job: ${name}`,
          emailNotification,
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

export { JobDefinition, JobRegistry, JobResult, KiroJobSystemEnhanced };
