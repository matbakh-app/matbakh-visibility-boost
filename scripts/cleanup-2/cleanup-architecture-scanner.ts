#!/usr/bin/env tsx

/**
 * Cleanup Architecture Scanner - Cleanup 2
 *
 * Archives or removes architecture scanner artifacts and tools
 * Part of Phase 3 cleanup execution
 *
 * Requirements: 1.3, 5.3
 */

import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

interface ArchiveScannerResult {
  filesProcessed: number;
  filesArchived: string[];
  filesRemoved: string[];
  directoriesRemoved: string[];
  referencesRemoved: number;
  errors: string[];
}

class ArchitectureScannerCleaner {
  private scannerPatterns = [
    // Import patterns
    /import.*from\s+['"].*architecture-scanner.*['"]/g,
    /import.*from\s+['"].*scanner.*['"]/g,

    // Usage patterns
    /architectureScanner/g,
    /ArchitectureScanner/g,
    /scanDirectory/g,
    /scanResult/g,
    /ScanResult/g,
    /LegacyReferenceScanner/g,
    /ComponentScanner/g,
    /DependencyScanner/g,

    // Configuration patterns
    /SCANNER_/g,
    /ARCHITECTURE_SCAN/g,

    // Method patterns
    /\.scan\(/g,
    /\.analyze\(/g,
    /\.generateReport\(/g,
    /\.validateArchitecture\(/g,
  ];

  private scannerDirectories = [
    "src/lib/architecture-scanner",
    "lib/architecture-scanner",
    "utils/architecture-scanner",
    "scripts/architecture-scanner",
    "tools/scanner",
    "src/scanner",
  ];

  private scannerFiles = [
    "architecture-scanner.ts",
    "architecture-scanner.js",
    "scanner-config.json",
    "scanner-results.json",
    "architecture-analysis.json",
    "component-analysis.json",
    "dependency-analysis.json",
  ];

  private archiveDirectory = "archive/architecture-scanner";

  private excludePatterns = [
    /node_modules/,
    /\.git/,
    /dist/,
    /build/,
    /coverage/,
    /\.next/,
    /reports/,
    /scripts\/cleanup-2/,
    /archive/,
  ];

  async cleanupArchitectureScanner(): Promise<ArchiveScannerResult> {
    console.log("🧹 Starting architecture scanner cleanup...");

    const result: ArchiveScannerResult = {
      filesProcessed: 0,
      filesArchived: [],
      filesRemoved: [],
      directoriesRemoved: [],
      referencesRemoved: 0,
      errors: [],
    };

    try {
      // Create archive directory
      await this.createArchiveDirectory();

      // Find all relevant files
      const files = await this.findRelevantFiles();
      console.log(`📁 Found ${files.length} files to process`);

      // Process each file
      for (const file of files) {
        try {
          const processed = await this.processFile(file, result);
          result.filesProcessed++;

          if (processed.referencesRemoved > 0) {
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

      // Archive scanner directories
      await this.archiveScannerDirectories(result);

      // Remove scanner-specific files
      await this.removeScannerFiles(result);

      // Clean up package dependencies
      await this.cleanupPackageDependencies(result);

      // Generate archive documentation
      await this.generateArchiveDocumentation(result);

      console.log("✅ Architecture scanner cleanup completed");
      console.log(`📊 Files processed: ${result.filesProcessed}`);
      console.log(`📊 Files archived: ${result.filesArchived.length}`);
      console.log(`📊 Files removed: ${result.filesRemoved.length}`);
      console.log(
        `📊 Directories removed: ${result.directoriesRemoved.length}`
      );
      console.log(`📊 References removed: ${result.referencesRemoved}`);

      if (result.errors.length > 0) {
        console.log(`⚠️ Errors encountered: ${result.errors.length}`);
      }

      return result;
    } catch (error) {
      const errorMsg = `Architecture scanner cleanup failed: ${
        error instanceof Error ? error.message : String(error)
      }`;
      result.errors.push(errorMsg);
      throw new Error(errorMsg);
    }
  }

  private async createArchiveDirectory(): Promise<void> {
    const archivePath = path.join(process.cwd(), this.archiveDirectory);
    fs.mkdirSync(archivePath, { recursive: true });
    console.log(`📁 Created archive directory: ${this.archiveDirectory}`);
  }

  private async findRelevantFiles(): Promise<string[]> {
    const files: string[] = [];

    const searchExtensions = [".ts", ".tsx", ".js", ".jsx", ".json"];

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
            this.scannerFiles.includes(entry.name)
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
    filePath: string,
    result: ArchiveScannerResult
  ): Promise<{ referencesRemoved: number }> {
    const content = fs.readFileSync(filePath, "utf-8");
    let modifiedContent = content;
    let referencesRemoved = 0;

    // Check if this is a scanner-specific file
    const isScannerFile = this.isScannerSpecificFile(filePath, content);

    if (isScannerFile) {
      // Archive the entire file
      await this.archiveFile(filePath, result);
      return { referencesRemoved: 0 };
    }

    // Remove scanner references from regular files
    for (const pattern of this.scannerPatterns) {
      const matches = modifiedContent.match(pattern);
      if (matches) {
        referencesRemoved += matches.length;
        modifiedContent = modifiedContent.replace(pattern, "");
      }
    }

    // Clean up empty lines and imports
    modifiedContent = this.cleanupContent(modifiedContent);

    const modified = content !== modifiedContent;

    if (modified) {
      fs.writeFileSync(filePath, modifiedContent);
      console.log(
        `✏️  Modified: ${path.relative(
          process.cwd(),
          filePath
        )} (${referencesRemoved} scanner references removed)`
      );
    }

    return { referencesRemoved };
  }

  private isScannerSpecificFile(filePath: string, content: string): boolean {
    const fileName = path.basename(filePath);

    // Check if filename indicates scanner file
    if (
      this.scannerFiles.includes(fileName) ||
      fileName.includes("scanner") ||
      fileName.includes("architecture-analysis")
    ) {
      return true;
    }

    // Check if file is primarily scanner-related based on content
    const lines = content.split("\n");
    const scannerLines = lines.filter((line) =>
      this.scannerPatterns.some((pattern) => pattern.test(line))
    );

    // If more than 50% of non-empty lines are scanner-related, consider it a scanner file
    const nonEmptyLines = lines.filter((line) => line.trim());
    return scannerLines.length > nonEmptyLines.length * 0.5;
  }

  private async archiveFile(
    filePath: string,
    result: ArchiveScannerResult
  ): Promise<void> {
    const relativePath = path.relative(process.cwd(), filePath);
    const archivePath = path.join(
      process.cwd(),
      this.archiveDirectory,
      relativePath
    );

    // Create archive subdirectory if needed
    fs.mkdirSync(path.dirname(archivePath), { recursive: true });

    // Copy file to archive
    fs.copyFileSync(filePath, archivePath);
    result.filesArchived.push(relativePath);

    // Remove original file
    fs.unlinkSync(filePath);
    result.filesRemoved.push(relativePath);

    console.log(`📦 Archived: ${relativePath}`);
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
        // Remove empty function calls
        .replace(/^\s*\.\w+\(\s*\)\s*;?\s*$/gm, "")
        // Ensure file ends with single newline
        .replace(/\n*$/, "\n")
    );
  }

  private async archiveScannerDirectories(
    result: ArchiveScannerResult
  ): Promise<void> {
    console.log("📁 Archiving scanner directories...");

    for (const dir of this.scannerDirectories) {
      const dirPath = path.join(process.cwd(), dir);

      if (fs.existsSync(dirPath)) {
        try {
          const archivePath = path.join(
            process.cwd(),
            this.archiveDirectory,
            dir
          );

          // Create archive directory structure
          fs.mkdirSync(path.dirname(archivePath), { recursive: true });

          // Copy directory to archive
          await this.copyDirectory(dirPath, archivePath);
          result.filesArchived.push(dir);

          // Remove original directory
          fs.rmSync(dirPath, { recursive: true, force: true });
          result.directoriesRemoved.push(dir);

          console.log(`📦 Archived directory: ${dir}`);
        } catch (error) {
          result.errors.push(`Failed to archive directory ${dir}: ${error}`);
        }
      }
    }
  }

  private async copyDirectory(src: string, dest: string): Promise<void> {
    fs.mkdirSync(dest, { recursive: true });

    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        await this.copyDirectory(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  private async removeScannerFiles(
    result: ArchiveScannerResult
  ): Promise<void> {
    console.log("🗑️  Removing scanner-specific files...");

    const findScannerFiles = (dir: string): void => {
      if (this.shouldExcludeDirectory(dir)) {
        return;
      }

      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          findScannerFiles(fullPath);
        } else if (entry.isFile() && this.scannerFiles.includes(entry.name)) {
          try {
            // Archive before removing
            const relativePath = path.relative(process.cwd(), fullPath);
            const archivePath = path.join(
              process.cwd(),
              this.archiveDirectory,
              relativePath
            );

            fs.mkdirSync(path.dirname(archivePath), { recursive: true });
            fs.copyFileSync(fullPath, archivePath);
            result.filesArchived.push(relativePath);

            fs.unlinkSync(fullPath);
            result.filesRemoved.push(relativePath);

            console.log(`🗑️  Removed scanner file: ${entry.name}`);
          } catch (error) {
            result.errors.push(
              `Failed to remove scanner file ${entry.name}: ${error}`
            );
          }
        }
      }
    };

    findScannerFiles(process.cwd());
  }

  private async cleanupPackageDependencies(
    result: ArchiveScannerResult
  ): Promise<void> {
    console.log("📦 Cleaning up scanner-related dependencies...");

    const packageJsonPath = path.join(process.cwd(), "package.json");

    if (!fs.existsSync(packageJsonPath)) {
      return;
    }

    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
      let modified = false;

      const scannerPackages = [
        "architecture-scanner",
        "@types/architecture-scanner",
        "component-scanner",
        "dependency-scanner",
      ];

      // Remove from dependencies
      if (packageJson.dependencies) {
        for (const pkg of scannerPackages) {
          if (packageJson.dependencies[pkg]) {
            delete packageJson.dependencies[pkg];
            modified = true;
            console.log(`📦 Removed dependency: ${pkg}`);
          }
        }
      }

      // Remove from devDependencies
      if (packageJson.devDependencies) {
        for (const pkg of scannerPackages) {
          if (packageJson.devDependencies[pkg]) {
            delete packageJson.devDependencies[pkg];
            modified = true;
            console.log(`📦 Removed devDependency: ${pkg}`);
          }
        }
      }

      // Remove scanner-related scripts
      if (packageJson.scripts) {
        const scannerScripts = Object.keys(packageJson.scripts).filter(
          (script) => script.includes("scan") || script.includes("architecture")
        );

        for (const script of scannerScripts) {
          delete packageJson.scripts[script];
          modified = true;
          console.log(`📦 Removed script: ${script}`);
        }
      }

      if (modified) {
        fs.writeFileSync(
          packageJsonPath,
          JSON.stringify(packageJson, null, 2) + "\n"
        );

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

  private async generateArchiveDocumentation(
    result: ArchiveScannerResult
  ): Promise<void> {
    const docPath = path.join(
      process.cwd(),
      this.archiveDirectory,
      "README.md"
    );

    const documentation = `# Architecture Scanner Archive

**Archived on:** ${new Date().toISOString()}
**Reason:** Cleanup 2 - Legacy system removal

## Summary

This directory contains archived architecture scanner components that were removed during the Cleanup 2 process.

### Files Archived: ${result.filesArchived.length}
${result.filesArchived.map((file) => `- ${file}`).join("\n")}

### Directories Removed: ${result.directoriesRemoved.length}
${result.directoriesRemoved.map((dir) => `- ${dir}`).join("\n")}

### References Removed: ${result.referencesRemoved}

## Restoration

If you need to restore any of these components:

1. Copy the required files back to their original locations
2. Restore any package dependencies that were removed
3. Update imports and references as needed
4. Run tests to ensure functionality

## Notes

- All files in this archive were determined to be scanner-specific or primarily scanner-related
- Regular files had scanner references removed but were not archived
- Package dependencies related to architecture scanning were removed from package.json

---
*Generated by Architecture Scanner Cleaner*
`;

    fs.writeFileSync(docPath, documentation);
    console.log(
      `📋 Generated archive documentation: ${path.relative(
        process.cwd(),
        docPath
      )}`
    );
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  async function main() {
    const cleaner = new ArchitectureScannerCleaner();

    try {
      const result = await cleaner.cleanupArchitectureScanner();

      console.log("\n🎉 ARCHITECTURE SCANNER CLEANUP COMPLETED");
      console.log("=========================================");
      console.log(`Files processed: ${result.filesProcessed}`);
      console.log(`Files archived: ${result.filesArchived.length}`);
      console.log(`Files removed: ${result.filesRemoved.length}`);
      console.log(`Directories removed: ${result.directoriesRemoved.length}`);
      console.log(`References removed: ${result.referencesRemoved}`);

      if (result.errors.length > 0) {
        console.log(`\n⚠️ Errors (${result.errors.length}):`);
        result.errors.forEach((error) => console.log(`  - ${error}`));
        process.exit(1);
      }

      process.exit(0);
    } catch (error) {
      console.error("❌ Architecture scanner cleanup failed:", error);
      process.exit(1);
    }
  }

  main();
}

export { ArchitectureScannerCleaner };
