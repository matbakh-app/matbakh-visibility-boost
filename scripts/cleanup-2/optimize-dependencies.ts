#!/usr/bin/env tsx

/**
 * Optimize Dependencies - Cleanup 2
 *
 * Removes legacy packages and optimizes import statements for tree shaking
 * Part of Phase 4 cleanup execution
 *
 * Requirements: 1.2, 5.4
 */

import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

interface DependencyOptimizationResult {
  packagesAnalyzed: number;
  packagesRemoved: string[];
  unusedDependencies: string[];
  importsOptimized: number;
  filesModified: string[];
  bundleSizeReduction: number;
  errors: string[];
}

interface PackageAnalysis {
  name: string;
  version: string;
  used: boolean;
  usageCount: number;
  size: number;
  type: "dependency" | "devDependency";
  lastUsed?: string;
  alternatives?: string[];
}

class DependencyOptimizer {
  private legacyPackages = [
    // Legacy UI libraries
    "@material-ui/core",
    "@material-ui/icons",
    "antd",
    "semantic-ui-react",

    // Legacy state management
    "redux",
    "react-redux",
    "mobx",
    "mobx-react",

    // Legacy build tools
    "webpack",
    "webpack-cli",
    "webpack-dev-server",
    "babel-loader",
    "css-loader",
    "style-loader",

    // Legacy testing
    "enzyme",
    "enzyme-adapter-react-16",
    "sinon",
    "chai",

    // Legacy utilities
    "lodash",
    "moment",
    "jquery",
    "underscore",

    // Legacy HTTP clients
    "axios",
    "request",
    "superagent",

    // Legacy CSS frameworks
    "bootstrap",
    "bulma",
    "foundation-sites",

    // Legacy form libraries
    "formik",
    "redux-form",

    // Legacy routing (if using React Router v6)
    "reach-router",

    // Legacy TypeScript
    "@types/node",
    "@types/react",
    "@types/react-dom",
  ];

  private modernAlternatives: Record<string, string> = {
    lodash: "Native ES6+ methods or specific lodash functions",
    moment: "date-fns or dayjs",
    axios: "fetch API or ky",
    redux: "Zustand or React Context",
    formik: "React Hook Form",
    enzyme: "React Testing Library",
    "@material-ui/core": "@mui/material",
    webpack: "Vite",
    bootstrap: "Tailwind CSS",
  };

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

  async optimizeDependencies(): Promise<DependencyOptimizationResult> {
    console.log("🚀 Starting dependency optimization...");

    const result: DependencyOptimizationResult = {
      packagesAnalyzed: 0,
      packagesRemoved: [],
      unusedDependencies: [],
      importsOptimized: 0,
      filesModified: [],
      bundleSizeReduction: 0,
      errors: [],
    };

    try {
      // Get initial bundle size
      const initialBundleSize = await this.getBundleSize();

      // Analyze package.json
      const packageAnalysis = await this.analyzePackages();
      result.packagesAnalyzed = packageAnalysis.length;

      // Find unused dependencies
      const unusedDeps = await this.findUnusedDependencies(packageAnalysis);
      result.unusedDependencies = unusedDeps.map((dep) => dep.name);

      // Remove legacy and unused packages
      await this.removeLegacyPackages(result);
      await this.removeUnusedPackages(unusedDeps, result);

      // Optimize import statements
      await this.optimizeImports(result);

      // Update package.json with optimizations
      await this.updatePackageJson(result);

      // Get final bundle size
      const finalBundleSize = await this.getBundleSize();
      result.bundleSizeReduction = initialBundleSize - finalBundleSize;

      // Generate optimization report
      await this.generateOptimizationReport(result, packageAnalysis);

      console.log("✅ Dependency optimization completed");
      console.log(`📊 Packages analyzed: ${result.packagesAnalyzed}`);
      console.log(`📊 Packages removed: ${result.packagesRemoved.length}`);
      console.log(
        `📊 Unused dependencies: ${result.unusedDependencies.length}`
      );
      console.log(`📊 Imports optimized: ${result.importsOptimized}`);
      console.log(
        `📊 Bundle size reduction: ${Math.round(
          result.bundleSizeReduction / 1024
        )}KB`
      );

      if (result.errors.length > 0) {
        console.log(`⚠️ Errors encountered: ${result.errors.length}`);
      }

      return result;
    } catch (error) {
      const errorMsg = `Dependency optimization failed: ${
        error instanceof Error ? error.message : String(error)
      }`;
      result.errors.push(errorMsg);
      throw new Error(errorMsg);
    }
  }

  private async analyzePackages(): Promise<PackageAnalysis[]> {
    console.log("🔍 Analyzing package dependencies...");

    const packageJsonPath = path.join(process.cwd(), "package.json");

    if (!fs.existsSync(packageJsonPath)) {
      throw new Error("package.json not found");
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
    const analysis: PackageAnalysis[] = [];

    // Analyze dependencies
    if (packageJson.dependencies) {
      for (const [name, version] of Object.entries(packageJson.dependencies)) {
        const packageAnalysis = await this.analyzePackage(
          name,
          version as string,
          "dependency"
        );
        analysis.push(packageAnalysis);
      }
    }

    // Analyze devDependencies
    if (packageJson.devDependencies) {
      for (const [name, version] of Object.entries(
        packageJson.devDependencies
      )) {
        const packageAnalysis = await this.analyzePackage(
          name,
          version as string,
          "devDependency"
        );
        analysis.push(packageAnalysis);
      }
    }

    return analysis;
  }

  private async analyzePackage(
    name: string,
    version: string,
    type: "dependency" | "devDependency"
  ): Promise<PackageAnalysis> {
    const usageCount = await this.countPackageUsage(name);
    const size = await this.getPackageSize(name);

    return {
      name,
      version,
      used: usageCount > 0,
      usageCount,
      size,
      type,
      alternatives: this.modernAlternatives[name]
        ? [this.modernAlternatives[name]]
        : undefined,
    };
  }

  private async countPackageUsage(packageName: string): Promise<number> {
    try {
      // Search for imports of this package
      const result = execSync(
        `grep -r "from ['\"]${packageName}" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" | wc -l`,
        { encoding: "utf-8" }
      );
      return parseInt(result.trim()) || 0;
    } catch {
      return 0;
    }
  }

  private async getPackageSize(packageName: string): Promise<number> {
    try {
      const nodeModulesPath = path.join(
        process.cwd(),
        "node_modules",
        packageName
      );
      if (!fs.existsSync(nodeModulesPath)) {
        return 0;
      }

      // Get directory size (simplified)
      const result = execSync(`du -sk "${nodeModulesPath}" | cut -f1`, {
        encoding: "utf-8",
      });
      return parseInt(result.trim()) * 1024; // Convert KB to bytes
    } catch {
      return 0;
    }
  }

  private async findUnusedDependencies(
    analysis: PackageAnalysis[]
  ): Promise<PackageAnalysis[]> {
    console.log("🔍 Finding unused dependencies...");

    const unused = analysis.filter(
      (pkg) => !pkg.used && pkg.type === "dependency"
    );

    console.log(`📊 Found ${unused.length} unused dependencies`);
    unused.forEach((pkg) => {
      console.log(`   - ${pkg.name} (${Math.round(pkg.size / 1024)}KB)`);
    });

    return unused;
  }

  private async removeLegacyPackages(
    result: DependencyOptimizationResult
  ): Promise<void> {
    console.log("🗑️  Removing legacy packages...");

    const packageJsonPath = path.join(process.cwd(), "package.json");
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
    let modified = false;

    for (const legacyPackage of this.legacyPackages) {
      // Remove from dependencies
      if (packageJson.dependencies && packageJson.dependencies[legacyPackage]) {
        delete packageJson.dependencies[legacyPackage];
        result.packagesRemoved.push(legacyPackage);
        modified = true;
        console.log(`🗑️  Removed legacy dependency: ${legacyPackage}`);

        if (this.modernAlternatives[legacyPackage]) {
          console.log(
            `   💡 Consider using: ${this.modernAlternatives[legacyPackage]}`
          );
        }
      }

      // Remove from devDependencies
      if (
        packageJson.devDependencies &&
        packageJson.devDependencies[legacyPackage]
      ) {
        delete packageJson.devDependencies[legacyPackage];
        if (!result.packagesRemoved.includes(legacyPackage)) {
          result.packagesRemoved.push(legacyPackage);
        }
        modified = true;
        console.log(`🗑️  Removed legacy devDependency: ${legacyPackage}`);
      }
    }

    if (modified) {
      fs.writeFileSync(
        packageJsonPath,
        JSON.stringify(packageJson, null, 2) + "\n"
      );
    }
  }

  private async removeUnusedPackages(
    unusedDeps: PackageAnalysis[],
    result: DependencyOptimizationResult
  ): Promise<void> {
    if (unusedDeps.length === 0) {
      return;
    }

    console.log("🗑️  Removing unused packages...");

    const packageJsonPath = path.join(process.cwd(), "package.json");
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
    let modified = false;

    for (const unusedDep of unusedDeps) {
      if (
        packageJson.dependencies &&
        packageJson.dependencies[unusedDep.name]
      ) {
        delete packageJson.dependencies[unusedDep.name];
        if (!result.packagesRemoved.includes(unusedDep.name)) {
          result.packagesRemoved.push(unusedDep.name);
        }
        modified = true;
        console.log(
          `🗑️  Removed unused dependency: ${unusedDep.name} (${Math.round(
            unusedDep.size / 1024
          )}KB)`
        );
      }
    }

    if (modified) {
      fs.writeFileSync(
        packageJsonPath,
        JSON.stringify(packageJson, null, 2) + "\n"
      );
    }
  }

  private async optimizeImports(
    result: DependencyOptimizationResult
  ): Promise<void> {
    console.log("⚡ Optimizing import statements...");

    const files = await this.findSourceFiles();

    for (const file of files) {
      try {
        const optimized = await this.optimizeFileImports(file);
        if (optimized.modified) {
          result.filesModified.push(file);
          result.importsOptimized += optimized.optimizationsCount;
        }
      } catch (error) {
        result.errors.push(`Failed to optimize imports in ${file}: ${error}`);
      }
    }
  }

  private async findSourceFiles(): Promise<string[]> {
    const files: string[] = [];

    const searchExtensions = [".ts", ".tsx", ".js", ".jsx"];

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
          if (searchExtensions.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    };

    findFiles(path.join(process.cwd(), "src"));
    return files;
  }

  private shouldExcludeDirectory(dir: string): boolean {
    return this.excludePatterns.some((pattern) => pattern.test(dir));
  }

  private async optimizeFileImports(
    filePath: string
  ): Promise<{ modified: boolean; optimizationsCount: number }> {
    const content = fs.readFileSync(filePath, "utf-8");
    let modifiedContent = content;
    let optimizationsCount = 0;

    // Optimize lodash imports (example)
    const lodashImportPattern = /import\s+_\s+from\s+['"]lodash['"]/g;
    if (lodashImportPattern.test(modifiedContent)) {
      // This would need more sophisticated analysis to determine which lodash functions are used
      console.log(
        `   ⚡ Found lodash import in ${path.relative(
          process.cwd(),
          filePath
        )} - consider specific imports`
      );
    }

    // Optimize default imports to named imports where beneficial
    const defaultImportPattern = /import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g;
    modifiedContent = modifiedContent.replace(
      defaultImportPattern,
      (match, importName, packageName) => {
        // Check if this package benefits from named imports
        if (this.shouldUseNamedImports(packageName)) {
          optimizationsCount++;
          return `import { ${importName} } from '${packageName}'`;
        }
        return match;
      }
    );

    // Remove unused imports
    const unusedImportPattern = /import\s+[^;]+from\s+['"][^'"]+['"];\s*\n/g;
    const imports = modifiedContent.match(unusedImportPattern) || [];

    for (const importStatement of imports) {
      const importName = this.extractImportName(importStatement);
      if (importName && !this.isImportUsed(modifiedContent, importName)) {
        modifiedContent = modifiedContent.replace(importStatement, "");
        optimizationsCount++;
        console.log(
          `   🗑️  Removed unused import: ${importName} in ${path.relative(
            process.cwd(),
            filePath
          )}`
        );
      }
    }

    // Clean up empty lines
    modifiedContent = this.cleanupContent(modifiedContent);

    const modified = content !== modifiedContent;

    if (modified) {
      fs.writeFileSync(filePath, modifiedContent);
      console.log(
        `   ⚡ Optimized: ${path.relative(
          process.cwd(),
          filePath
        )} (${optimizationsCount} optimizations)`
      );
    }

    return { modified, optimizationsCount };
  }

  private shouldUseNamedImports(packageName: string): boolean {
    // Packages that benefit from named imports for tree shaking
    const namedImportPackages = [
      "lodash",
      "date-fns",
      "ramda",
      "rxjs",
      "@mui/material",
      "@mui/icons-material",
    ];

    return namedImportPackages.includes(packageName);
  }

  private extractImportName(importStatement: string): string | null {
    const match = importStatement.match(/import\s+(\w+)/);
    return match ? match[1] : null;
  }

  private isImportUsed(content: string, importName: string): boolean {
    // Simple check - in a real implementation, this would be more sophisticated
    const usagePattern = new RegExp(`\\b${importName}\\b`, "g");
    const matches = content.match(usagePattern) || [];
    return matches.length > 1; // More than just the import statement
  }

  private cleanupContent(content: string): string {
    return (
      content
        // Remove multiple consecutive empty lines
        .replace(/\n\s*\n\s*\n/g, "\n\n")
        // Remove trailing whitespace
        .replace(/[ \t]+$/gm, "")
        // Ensure file ends with single newline
        .replace(/\n*$/, "\n")
    );
  }

  private async updatePackageJson(
    result: DependencyOptimizationResult
  ): Promise<void> {
    console.log("📦 Updating package.json with optimizations...");

    const packageJsonPath = path.join(process.cwd(), "package.json");
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

    // Add sideEffects field for better tree shaking
    if (!packageJson.sideEffects) {
      packageJson.sideEffects = false;
      console.log("📦 Added sideEffects: false for better tree shaking");
    }

    // Update browserslist for better optimization
    if (!packageJson.browserslist) {
      packageJson.browserslist = [
        "> 1%",
        "last 2 versions",
        "not dead",
        "not ie 11",
      ];
      console.log("📦 Added modern browserslist configuration");
    }

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

  private async getBundleSize(): Promise<number> {
    try {
      // Build the project to get bundle size
      execSync("npm run build", { stdio: "pipe" });

      const distPath = path.join(process.cwd(), "dist");
      if (!fs.existsSync(distPath)) {
        return 0;
      }

      let totalSize = 0;
      const files = fs.readdirSync(distPath, { recursive: true });

      for (const file of files) {
        const filePath = path.join(distPath, file as string);
        if (fs.statSync(filePath).isFile()) {
          totalSize += fs.statSync(filePath).size;
        }
      }

      return totalSize;
    } catch {
      return 0;
    }
  }

  private async generateOptimizationReport(
    result: DependencyOptimizationResult,
    analysis: PackageAnalysis[]
  ): Promise<void> {
    const reportPath = path.join(
      process.cwd(),
      "reports",
      "dependency-optimization-report.md"
    );

    const report = `# Dependency Optimization Report

**Generated:** ${new Date().toISOString()}
**Bundle Size Reduction:** ${Math.round(result.bundleSizeReduction / 1024)}KB

## 📊 Summary

- **Packages Analyzed:** ${result.packagesAnalyzed}
- **Packages Removed:** ${result.packagesRemoved.length}
- **Unused Dependencies:** ${result.unusedDependencies.length}
- **Imports Optimized:** ${result.importsOptimized}
- **Files Modified:** ${result.filesModified.length}

## 🗑️ Removed Packages

${result.packagesRemoved.map((pkg) => `- ${pkg}`).join("\n")}

## 📦 Unused Dependencies

${result.unusedDependencies.map((dep) => `- ${dep}`).join("\n")}

## ⚡ Import Optimizations

${result.filesModified
  .map((file) => `- ${path.relative(process.cwd(), file)}`)
  .join("\n")}

## 💡 Recommendations

${analysis
  .filter((pkg) => pkg.alternatives)
  .map(
    (pkg) => `- **${pkg.name}**: Consider migrating to ${pkg.alternatives![0]}`
  )
  .join("\n")}

## 🎯 Next Steps

1. Review removed packages to ensure no functionality is broken
2. Consider migrating to modern alternatives for remaining legacy packages
3. Implement specific imports for large libraries like lodash
4. Monitor bundle size in CI/CD pipeline

${
  result.errors.length > 0
    ? `## ⚠️ Errors\n\n${result.errors.map((e) => `- ${e}`).join("\n")}`
    : ""
}

---
*Report generated by Dependency Optimizer*
`;

    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, report);
    console.log(
      `📋 Optimization report generated: ${path.relative(
        process.cwd(),
        reportPath
      )}`
    );
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  async function main() {
    const optimizer = new DependencyOptimizer();

    try {
      const result = await optimizer.optimizeDependencies();

      console.log("\n🎉 DEPENDENCY OPTIMIZATION COMPLETED");
      console.log("===================================");
      console.log(`Packages analyzed: ${result.packagesAnalyzed}`);
      console.log(`Packages removed: ${result.packagesRemoved.length}`);
      console.log(`Unused dependencies: ${result.unusedDependencies.length}`);
      console.log(`Imports optimized: ${result.importsOptimized}`);
      console.log(
        `Bundle size reduction: ${Math.round(
          result.bundleSizeReduction / 1024
        )}KB`
      );

      if (result.errors.length > 0) {
        console.log(`\n⚠️ Errors (${result.errors.length}):`);
        result.errors.forEach((error) => console.log(`  - ${error}`));
        process.exit(1);
      }

      process.exit(0);
    } catch (error) {
      console.error("❌ Dependency optimization failed:", error);
      process.exit(1);
    }
  }

  main();
}

export { DependencyOptimizer };
