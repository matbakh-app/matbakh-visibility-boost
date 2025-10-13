#!/usr/bin/env tsx

/**
 * Remove External Services References - Cleanup 2
 *
 * Removes Twilio, Resend, Lovable, and other external service references
 * Part of Phase 2 cleanup execution
 *
 * Requirements: 1.1, 5.2
 */

import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

interface ExternalService {
  name: string;
  patterns: RegExp[];
  packageNames: string[];
  configKeys: string[];
  directories: string[];
}

interface RemovalResult {
  servicesProcessed: string[];
  filesProcessed: number;
  referencesRemoved: number;
  filesModified: string[];
  filesRemoved: string[];
  packagesRemoved: string[];
  errors: string[];
}

class ExternalServiceRemover {
  private services: ExternalService[] = [
    {
      name: "Twilio",
      patterns: [
        /import.*from\s+['"]twilio['"]/g,
        /import.*from\s+['"]@twilio\/.*['"]/g,
        /twilio\./g,
        /Twilio/g,
        /TWILIO_/g,
        /twilioClient/g,
        /twilioSid/g,
        /twilioToken/g,
        /twilioAuthToken/g,
        /twilioAccountSid/g,
        /\.messages\.create/g,
        /\.calls\.create/g,
      ],
      packageNames: ["twilio", "@twilio/conversations"],
      configKeys: [
        "TWILIO_ACCOUNT_SID",
        "TWILIO_AUTH_TOKEN",
        "TWILIO_PHONE_NUMBER",
      ],
      directories: ["src/lib/twilio", "lib/twilio", "utils/twilio"],
    },
    {
      name: "Resend",
      patterns: [
        /import.*from\s+['"]resend['"]/g,
        /import.*from\s+['"]@resend\/.*['"]/g,
        /resend\./g,
        /Resend/g,
        /RESEND_/g,
        /resendClient/g,
        /resendApiKey/g,
        /\.emails\.send/g,
      ],
      packageNames: ["resend", "@resend/react"],
      configKeys: ["RESEND_API_KEY", "RESEND_FROM_EMAIL"],
      directories: ["src/lib/resend", "lib/resend", "utils/resend"],
    },
    {
      name: "Lovable",
      patterns: [
        /import.*from\s+['"]@lovable\/.*['"]/g,
        /import.*from\s+['"]lovable['"]/g,
        /lovable\./g,
        /Lovable/g,
        /LOVABLE_/g,
        /lovableClient/g,
        /lovableApiKey/g,
        /\.lovable\./g,
      ],
      packageNames: ["@lovable/sdk", "lovable"],
      configKeys: ["LOVABLE_API_KEY", "LOVABLE_PROJECT_ID"],
      directories: ["src/lib/lovable", "lib/lovable", "utils/lovable"],
    },
    {
      name: "Vercel",
      patterns: [
        /import.*from\s+['"]@vercel\/.*['"]/g,
        /import.*from\s+['"]vercel['"]/g,
        /VERCEL_/g,
        /vercelClient/g,
        /vercelToken/g,
        /\.vercel\./g,
      ],
      packageNames: ["@vercel/analytics", "@vercel/speed-insights", "vercel"],
      configKeys: ["VERCEL_TOKEN", "VERCEL_PROJECT_ID", "VERCEL_ORG_ID"],
      directories: ["src/lib/vercel", "lib/vercel", "utils/vercel"],
    },
    {
      name: "Stripe (Legacy)",
      patterns: [
        /import.*from\s+['"]stripe['"]/g,
        /stripe\./g,
        /Stripe/g,
        /STRIPE_/g,
        /stripeClient/g,
        /stripeSecretKey/g,
        /stripePublishableKey/g,
        /\.stripe\./g,
      ],
      packageNames: ["stripe", "@stripe/stripe-js"],
      configKeys: [
        "STRIPE_SECRET_KEY",
        "STRIPE_PUBLISHABLE_KEY",
        "STRIPE_WEBHOOK_SECRET",
      ],
      directories: ["src/lib/stripe", "lib/stripe", "utils/stripe"],
    },
  ];

  private excludePatterns = [
    /node_modules/,
    /\.git/,
    /dist/,
    /build/,
    /coverage/,
    /\.next/,
    /reports/,
    /scripts\/cleanup-2/,
  ];

  async removeExternalServices(): Promise<RemovalResult> {
    console.log("🧹 Starting external services removal...");

    const result: RemovalResult = {
      servicesProcessed: [],
      filesProcessed: 0,
      referencesRemoved: 0,
      filesModified: [],
      filesRemoved: [],
      packagesRemoved: [],
      errors: [],
    };

    try {
      // Find all relevant files
      const files = await this.findRelevantFiles();
      console.log(`📁 Found ${files.length} files to process`);

      // Process each service
      for (const service of this.services) {
        console.log(`\n🔧 Processing ${service.name}...`);

        try {
          await this.processService(service, files, result);
          result.servicesProcessed.push(service.name);
          console.log(`✅ ${service.name} processing completed`);
        } catch (error) {
          const errorMsg = `Failed to process ${service.name}: ${
            error instanceof Error ? error.message : String(error)
          }`;
          result.errors.push(errorMsg);
          console.error(`❌ ${errorMsg}`);
        }
      }

      // Remove package dependencies
      await this.removePackageDependencies(result);

      // Clean up configuration files
      await this.cleanupConfigFiles(result);

      console.log("\n✅ External services removal completed");
      console.log(`📊 Services processed: ${result.servicesProcessed.length}`);
      console.log(`📊 Files processed: ${result.filesProcessed}`);
      console.log(`📊 References removed: ${result.referencesRemoved}`);
      console.log(`📊 Files modified: ${result.filesModified.length}`);
      console.log(`📊 Files removed: ${result.filesRemoved.length}`);
      console.log(`📊 Packages removed: ${result.packagesRemoved.length}`);

      if (result.errors.length > 0) {
        console.log(`⚠️ Errors encountered: ${result.errors.length}`);
      }

      return result;
    } catch (error) {
      const errorMsg = `External services removal failed: ${
        error instanceof Error ? error.message : String(error)
      }`;
      result.errors.push(errorMsg);
      throw new Error(errorMsg);
    }
  }

  private async findRelevantFiles(): Promise<string[]> {
    const files: string[] = [];

    const searchExtensions = [
      ".ts",
      ".tsx",
      ".js",
      ".jsx",
      ".vue",
      ".svelte",
      ".json",
    ];

    const findFiles = (dir: string): void => {
      if (this.shouldExcludeDirectory(dir)) {
        return;
      }

      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          findFiles(fullPath);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name);
          if (searchExtensions.includes(ext) || entry.name.startsWith(".env")) {
            files.push(fullPath);
          }
        }
      }
    };

    findFiles(process.cwd());
    return files;
  }

  private shouldExcludeDirectory(dir: string): boolean {
    return this.excludePatterns.some((pattern) => pattern.test(dir));
  }

  private async processService(
    service: ExternalService,
    files: string[],
    result: RemovalResult
  ): Promise<void> {
    let serviceReferencesRemoved = 0;

    // Process files for this service
    for (const file of files) {
      try {
        const processed = await this.processFileForService(file, service);

        if (processed.modified) {
          if (!result.filesModified.includes(file)) {
            result.filesModified.push(file);
          }
          serviceReferencesRemoved += processed.referencesRemoved;
        }
      } catch (error) {
        const errorMsg = `Failed to process ${file} for ${service.name}: ${
          error instanceof Error ? error.message : String(error)
        }`;
        result.errors.push(errorMsg);
      }
    }

    // Remove service-specific directories
    await this.removeServiceDirectories(service, result);

    result.referencesRemoved += serviceReferencesRemoved;
    console.log(
      `   📊 ${service.name}: ${serviceReferencesRemoved} references removed`
    );
  }

  private async processFileForService(
    filePath: string,
    service: ExternalService
  ): Promise<{ modified: boolean; referencesRemoved: number }> {
    const content = fs.readFileSync(filePath, "utf-8");
    let modifiedContent = content;
    let referencesRemoved = 0;

    // Apply each pattern for this service
    for (const pattern of service.patterns) {
      const matches = modifiedContent.match(pattern);
      if (matches) {
        referencesRemoved += matches.length;
        modifiedContent = modifiedContent.replace(pattern, "");
      }
    }

    // Special handling for config files
    if (filePath.includes(".env") || filePath.includes("config")) {
      for (const configKey of service.configKeys) {
        const configPattern = new RegExp(`^${configKey}=.*$`, "gm");
        const configMatches = modifiedContent.match(configPattern);
        if (configMatches) {
          referencesRemoved += configMatches.length;
          modifiedContent = modifiedContent.replace(configPattern, "");
        }
      }
    }

    // Clean up empty lines and imports
    modifiedContent = this.cleanupContent(modifiedContent);

    const modified = content !== modifiedContent;

    if (modified) {
      fs.writeFileSync(filePath, modifiedContent);
      console.log(
        `   ✏️  Modified: ${path.relative(
          process.cwd(),
          filePath
        )} (${referencesRemoved} ${service.name} references)`
      );
    }

    return { modified, referencesRemoved };
  }

  private cleanupContent(content: string): string {
    return (
      content
        // Remove empty import lines
        .replace(/^\s*import\s*;\s*$/gm, "")
        // Remove empty lines after imports
        .replace(/^import.*\n\s*\n/gm, (match) =>
          match.replace(/\n\s*\n/, "\n")
        )
        // Remove multiple consecutive empty lines
        .replace(/\n\s*\n\s*\n/g, "\n\n")
        // Remove trailing whitespace
        .replace(/[ \t]+$/gm, "")
        // Remove empty config lines
        .replace(/^\s*=\s*$/gm, "")
        // Ensure file ends with single newline
        .replace(/\n*$/, "\n")
    );
  }

  private async removeServiceDirectories(
    service: ExternalService,
    result: RemovalResult
  ): Promise<void> {
    for (const dir of service.directories) {
      const dirPath = path.join(process.cwd(), dir);

      if (fs.existsSync(dirPath)) {
        try {
          fs.rmSync(dirPath, { recursive: true, force: true });
          result.filesRemoved.push(dirPath);
          console.log(`   📁 Removed directory: ${dir}`);
        } catch (error) {
          result.errors.push(
            `Failed to remove ${service.name} directory ${dir}: ${error}`
          );
        }
      }
    }
  }

  private async removePackageDependencies(
    result: RemovalResult
  ): Promise<void> {
    console.log(
      "\n📦 Removing external service dependencies from package.json..."
    );

    const packageJsonPath = path.join(process.cwd(), "package.json");

    if (!fs.existsSync(packageJsonPath)) {
      return;
    }

    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
      let modified = false;

      // Collect all package names to remove
      const packagesToRemove = new Set<string>();
      for (const service of this.services) {
        for (const packageName of service.packageNames) {
          packagesToRemove.add(packageName);
        }
      }

      // Remove from dependencies
      if (packageJson.dependencies) {
        for (const packageName of packagesToRemove) {
          if (packageJson.dependencies[packageName]) {
            delete packageJson.dependencies[packageName];
            result.packagesRemoved.push(packageName);
            modified = true;
            console.log(`📦 Removed dependency: ${packageName}`);
          }
        }
      }

      // Remove from devDependencies
      if (packageJson.devDependencies) {
        for (const packageName of packagesToRemove) {
          if (packageJson.devDependencies[packageName]) {
            delete packageJson.devDependencies[packageName];
            if (!result.packagesRemoved.includes(packageName)) {
              result.packagesRemoved.push(packageName);
            }
            modified = true;
            console.log(`📦 Removed devDependency: ${packageName}`);
          }
        }
      }

      if (modified) {
        fs.writeFileSync(
          packageJsonPath,
          JSON.stringify(packageJson, null, 2) + "\n"
        );
        result.filesModified.push(packageJsonPath);

        // Run npm install to update lock file
        try {
          execSync("npm install", { stdio: "pipe" });
          console.log("📦 Updated package-lock.json");
        } catch (error) {
          result.errors.push("Failed to update package-lock.json");
        }
      }
    } catch (error) {
      result.errors.push(`Failed to update package.json: ${error}`);
    }
  }

  private async cleanupConfigFiles(result: RemovalResult): Promise<void> {
    console.log("\n🔧 Cleaning up configuration files...");

    const configFiles = [
      ".env",
      ".env.local",
      ".env.development",
      ".env.production",
      ".env.example",
      "next.config.js",
      "next.config.ts",
      "vite.config.ts",
      "vite.config.js",
    ];

    for (const configFile of configFiles) {
      const filePath = path.join(process.cwd(), configFile);

      if (fs.existsSync(filePath)) {
        try {
          const content = fs.readFileSync(filePath, "utf-8");
          let modifiedContent = content;
          let modified = false;

          // Remove all service-related config keys
          for (const service of this.services) {
            for (const configKey of service.configKeys) {
              const configPattern = new RegExp(`^${configKey}=.*$`, "gm");
              if (configPattern.test(modifiedContent)) {
                modifiedContent = modifiedContent.replace(configPattern, "");
                modified = true;
              }
            }
          }

          // Clean up empty lines
          modifiedContent = this.cleanupContent(modifiedContent);

          if (modified) {
            fs.writeFileSync(filePath, modifiedContent);
            if (!result.filesModified.includes(filePath)) {
              result.filesModified.push(filePath);
            }
            console.log(`🔧 Cleaned config file: ${configFile}`);
          }
        } catch (error) {
          result.errors.push(
            `Failed to clean config file ${configFile}: ${error}`
          );
        }
      }
    }
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  async function main() {
    const remover = new ExternalServiceRemover();

    try {
      const result = await remover.removeExternalServices();

      console.log("\n🎉 EXTERNAL SERVICES CLEANUP COMPLETED");
      console.log("=====================================");
      console.log(`Services processed: ${result.servicesProcessed.join(", ")}`);
      console.log(`Files processed: ${result.filesProcessed}`);
      console.log(`References removed: ${result.referencesRemoved}`);
      console.log(`Files modified: ${result.filesModified.length}`);
      console.log(`Files removed: ${result.filesRemoved.length}`);
      console.log(`Packages removed: ${result.packagesRemoved.length}`);

      if (result.errors.length > 0) {
        console.log(`\n⚠️ Errors (${result.errors.length}):`);
        result.errors.forEach((error) => console.log(`  - ${error}`));
        process.exit(1);
      }

      process.exit(0);
    } catch (error) {
      console.error("❌ External services cleanup failed:", error);
      process.exit(1);
    }
  }

  main();
}

export { ExternalServiceRemover };
