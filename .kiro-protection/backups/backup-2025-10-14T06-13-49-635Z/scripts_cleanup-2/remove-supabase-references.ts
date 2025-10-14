#!/usr/bin/env tsx

/**
 * Remove Supabase References - Cleanup 2
 *
 * Systematically removes remaining Supabase imports, configurations, and references
 * Part of Phase 1 cleanup execution
 *
 * Requirements: 1.1, 5.1
 */

import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

interface RemovalResult {
  filesProcessed: number;
  referencesRemoved: number;
  filesModified: string[];
  filesRemoved: string[];
  errors: string[];
}

class SupabaseReferenceRemover {
  private supabasePatterns = [
    // Import patterns
    /import.*from\s+['"]@supabase\/.*['"]/g,
    /import.*from\s+['"].*supabase.*['"]/g,
    /import\s+\{[^}]*\}\s+from\s+['"]@supabase\/.*['"]/g,

    // Usage patterns
    /createClient\s*\(/g,
    /supabaseUrl/g,
    /supabaseKey/g,
    /supabaseAnonKey/g,
    /\.from\s*\(\s*['"][^'"]*['"]\s*\)/g, // Supabase table queries
    /\.select\s*\(\s*['"][^'"]*['"]\s*\)/g,
    /\.insert\s*\(/g,
    /\.update\s*\(/g,
    /\.delete\s*\(/g,
    /\.auth\./g,
    /\.storage\./g,

    // Configuration patterns
    /SUPABASE_/g,
    /NEXT_PUBLIC_SUPABASE_/g,
    /VITE_SUPABASE_/g,

    // Comment patterns
    /\/\*.*supabase.*\*\//gi,
    /\/\/.*supabase.*/gi,
  ];

  private configFiles = [
    ".env",
    ".env.local",
    ".env.development",
    ".env.production",
    ".env.example",
    "supabase.config.js",
    "supabase.config.ts",
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

  async removeSupabaseReferences(): Promise<RemovalResult> {
    console.log("🧹 Starting Supabase reference removal...");

    const result: RemovalResult = {
      filesProcessed: 0,
      referencesRemoved: 0,
      filesModified: [],
      filesRemoved: [],
      errors: [],
    };

    try {
      // Find all relevant files
      const files = await this.findRelevantFiles();
      console.log(`📁 Found ${files.length} files to process`);

      // Process each file
      for (const file of files) {
        try {
          const processed = await this.processFile(file);
          result.filesProcessed++;

          if (processed.modified) {
            result.filesModified.push(file);
            result.referencesRemoved += processed.referencesRemoved;
          }
        } catch (error) {
          const errorMsg = `Failed to process ${file}: ${
            error instanceof Error ? error.message : String(error)
          }`;
          result.errors.push(errorMsg);
          console.error(`❌ ${errorMsg}`);
        }
      }

      // Remove Supabase configuration files
      await this.removeConfigFiles(result);

      // Remove Supabase dependencies from package.json
      await this.removePackageDependencies(result);

      // Clean up Supabase-specific directories
      await this.cleanupDirectories(result);

      console.log("✅ Supabase reference removal completed");
      console.log(`📊 Files processed: ${result.filesProcessed}`);
      console.log(`📊 References removed: ${result.referencesRemoved}`);
      console.log(`📊 Files modified: ${result.filesModified.length}`);
      console.log(`📊 Files removed: ${result.filesRemoved.length}`);

      if (result.errors.length > 0) {
        console.log(`⚠️ Errors encountered: ${result.errors.length}`);
      }

      return result;
    } catch (error) {
      const errorMsg = `Supabase removal failed: ${
        error instanceof Error ? error.message : String(error)
      }`;
      result.errors.push(errorMsg);
      throw new Error(errorMsg);
    }
  }

  private async findRelevantFiles(): Promise<string[]> {
    const files: string[] = [];

    const searchExtensions = [".ts", ".tsx", ".js", ".jsx", ".vue", ".svelte"];

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
          if (
            searchExtensions.includes(ext) ||
            this.configFiles.includes(entry.name)
          ) {
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

  private async processFile(
    filePath: string
  ): Promise<{ modified: boolean; referencesRemoved: number }> {
    const content = fs.readFileSync(filePath, "utf-8");
    let modifiedContent = content;
    let referencesRemoved = 0;

    // Apply each pattern
    for (const pattern of this.supabasePatterns) {
      const matches = modifiedContent.match(pattern);
      if (matches) {
        referencesRemoved += matches.length;
        modifiedContent = modifiedContent.replace(pattern, "");
      }
    }

    // Clean up empty lines and imports
    modifiedContent = this.cleanupEmptyLines(modifiedContent);

    const modified = content !== modifiedContent;

    if (modified) {
      fs.writeFileSync(filePath, modifiedContent);
      console.log(
        `✏️  Modified: ${filePath} (${referencesRemoved} references removed)`
      );
    }

    return { modified, referencesRemoved };
  }

  private cleanupEmptyLines(content: string): string {
    return (
      content
        // Remove empty import lines
        .replace(/^\s*import\s*;\s*$/gm, "")
        // Remove multiple consecutive empty lines
        .replace(/\n\s*\n\s*\n/g, "\n\n")
        // Remove trailing whitespace
        .replace(/[ \t]+$/gm, "")
        // Ensure file ends with single newline
        .replace(/\n*$/, "\n")
    );
  }

  private async removeConfigFiles(result: RemovalResult): Promise<void> {
    console.log("🗑️  Removing Supabase configuration files...");

    for (const configFile of this.configFiles) {
      const filePath = path.join(process.cwd(), configFile);

      if (fs.existsSync(filePath)) {
        try {
          // Check if file contains only Supabase config
          const content = fs.readFileSync(filePath, "utf-8");
          const hasNonSupabaseContent = this.hasNonSupabaseContent(content);

          if (!hasNonSupabaseContent) {
            // Remove entire file
            fs.unlinkSync(filePath);
            result.filesRemoved.push(filePath);
            console.log(`🗑️  Removed: ${configFile}`);
          } else {
            // Remove only Supabase lines
            const cleanedContent = this.removeSupabaseLines(content);
            if (cleanedContent !== content) {
              fs.writeFileSync(filePath, cleanedContent);
              result.filesModified.push(filePath);
              console.log(`✏️  Cleaned: ${configFile}`);
            }
          }
        } catch (error) {
          result.errors.push(
            `Failed to process config file ${configFile}: ${error}`
          );
        }
      }
    }
  }

  private hasNonSupabaseContent(content: string): boolean {
    const lines = content.split("\n");
    const nonEmptyLines = lines.filter(
      (line) => line.trim() && !line.trim().startsWith("#")
    );
    const supabaseLines = nonEmptyLines.filter(
      (line) => line.includes("SUPABASE") || line.includes("supabase")
    );

    return nonEmptyLines.length > supabaseLines.length;
  }

  private removeSupabaseLines(content: string): string {
    return content
      .split("\n")
      .filter(
        (line) => !line.includes("SUPABASE") && !line.includes("supabase")
      )
      .join("\n");
  }

  private async removePackageDependencies(
    result: RemovalResult
  ): Promise<void> {
    console.log("📦 Removing Supabase dependencies from package.json...");

    const packageJsonPath = path.join(process.cwd(), "package.json");

    if (!fs.existsSync(packageJsonPath)) {
      return;
    }

    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
      let modified = false;

      // Remove from dependencies
      if (packageJson.dependencies) {
        for (const dep of Object.keys(packageJson.dependencies)) {
          if (dep.includes("supabase")) {
            delete packageJson.dependencies[dep];
            modified = true;
            console.log(`📦 Removed dependency: ${dep}`);
          }
        }
      }

      // Remove from devDependencies
      if (packageJson.devDependencies) {
        for (const dep of Object.keys(packageJson.devDependencies)) {
          if (dep.includes("supabase")) {
            delete packageJson.devDependencies[dep];
            modified = true;
            console.log(`📦 Removed devDependency: ${dep}`);
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

  private async cleanupDirectories(result: RemovalResult): Promise<void> {
    console.log("📁 Cleaning up Supabase directories...");

    const supabaseDirectories = [
      "supabase",
      "src/lib/supabase",
      "src/utils/supabase",
      "lib/supabase",
      "utils/supabase",
    ];

    for (const dir of supabaseDirectories) {
      const dirPath = path.join(process.cwd(), dir);

      if (fs.existsSync(dirPath)) {
        try {
          fs.rmSync(dirPath, { recursive: true, force: true });
          result.filesRemoved.push(dirPath);
          console.log(`📁 Removed directory: ${dir}`);
        } catch (error) {
          result.errors.push(`Failed to remove directory ${dir}: ${error}`);
        }
      }
    }
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  async function main() {
    const remover = new SupabaseReferenceRemover();

    try {
      const result = await remover.removeSupabaseReferences();

      console.log("\n🎉 SUPABASE CLEANUP COMPLETED");
      console.log("=============================");
      console.log(`Files processed: ${result.filesProcessed}`);
      console.log(`References removed: ${result.referencesRemoved}`);
      console.log(`Files modified: ${result.filesModified.length}`);
      console.log(`Files removed: ${result.filesRemoved.length}`);

      if (result.errors.length > 0) {
        console.log(`\n⚠️ Errors (${result.errors.length}):`);
        result.errors.forEach((error) => console.log(`  - ${error}`));
        process.exit(1);
      }

      process.exit(0);
    } catch (error) {
      console.error("❌ Supabase cleanup failed:", error);
      process.exit(1);
    }
  }

  main();
}

export { SupabaseReferenceRemover };
