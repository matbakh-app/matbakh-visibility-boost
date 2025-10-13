#!/usr/bin/env tsx

/**
 * Legacy Reference Scanner - Cleanup 2
 *
 * Automated detection engine for legacy service references
 * Supports: Supabase, Vercel, Twilio, Resend, Lovable pattern detection
 *
 * Requirements: 1.1, 2.1, 2.2
 */

import * as fs from "fs";
import * as path from "path";

export interface LegacyReference {
  id: string;
  file: string;
  line: number;
  column: number;
  pattern: string;
  match: string;
  service: LegacyService;
  riskLevel: RiskLevel;
  confidence: number;
  context: string;
  category: ReferenceCategory;
}

export type LegacyService =
  | "supabase"
  | "vercel"
  | "twilio"
  | "resend"
  | "lovable"
  | "unknown";
export type RiskLevel = "low" | "medium" | "high" | "critical";
export type ReferenceCategory =
  | "import"
  | "config"
  | "api_call"
  | "url"
  | "env_var"
  | "comment"
  | "dependency";

export interface DetectionPattern {
  service: LegacyService;
  patterns: RegExp[];
  category: ReferenceCategory;
  riskLevel: RiskLevel;
  description: string;
}

export interface ScanResult {
  timestamp: string;
  totalReferences: number;
  serviceBreakdown: Record<LegacyService, number>;
  riskBreakdown: Record<RiskLevel, number>;
  categoryBreakdown: Record<ReferenceCategory, number>;
  references: LegacyReference[];
  summary: {
    highRiskCount: number;
    criticalCount: number;
    averageConfidence: number;
    topServices: Array<{ service: LegacyService; count: number }>;
  };
}

export class LegacyReferenceScanner {
  private patterns: DetectionPattern[] = [
    // Supabase patterns
    {
      service: "supabase",
      patterns: [
        /import.*from.*['"]@supabase\/[^'"]*['"]/gi,
        /createClient.*supabase/gi,
        /supabase\.createClient/gi,
        /\.supabase\.co/gi,
        /SUPABASE_[A-Z_]+/gi,
        /supabaseUrl|supabaseKey/gi,
      ],
      category: "import",
      riskLevel: "high",
      description: "Supabase client imports and configuration",
    },
    {
      service: "supabase",
      patterns: [
        /https?:\/\/[^\/]*\.supabase\.co/gi,
        /supabase-js/gi,
        /@supabase\//gi,
      ],
      category: "url",
      riskLevel: "critical",
      description: "Supabase URLs and package references",
    },

    // Vercel patterns
    {
      service: "vercel",
      patterns: [
        /import.*from.*['"]@vercel\/[^'"]*['"]/gi,
        /vercel\.json/gi,
        /\.vercel\./gi,
        /VERCEL_[A-Z_]+/gi,
        /vercel\.app/gi,
      ],
      category: "config",
      riskLevel: "medium",
      description: "Vercel configuration and deployment references",
    },

    // Twilio patterns
    {
      service: "twilio",
      patterns: [
        /import.*from.*['"]twilio['"]/gi,
        /require\(['"]twilio['"]\)/gi,
        /twilio\.com/gi,
        /TWILIO_[A-Z_]+/gi,
        /accountSid.*authToken/gi,
        /client\.messages\.create/gi,
      ],
      category: "api_call",
      riskLevel: "high",
      description: "Twilio SMS/Voice API usage",
    },

    // Resend patterns
    {
      service: "resend",
      patterns: [
        /import.*from.*['"]resend['"]/gi,
        /require\(['"]resend['"]\)/gi,
        /resend\.dev/gi,
        /RESEND_[A-Z_]+/gi,
        /new Resend\(/gi,
        /resend\.emails\.send/gi,
      ],
      category: "api_call",
      riskLevel: "high",
      description: "Resend email service usage",
    },

    // Lovable patterns
    {
      service: "lovable",
      patterns: [
        /lovable\.dev/gi,
        /lovable\.ai/gi,
        /LOVABLE_[A-Z_]+/gi,
        /lovable-[a-z-]+/gi,
        /import.*lovable/gi,
      ],
      category: "config",
      riskLevel: "medium",
      description: "Lovable platform references",
    },

    // Generic legacy patterns
    {
      service: "unknown",
      patterns: [
        /TODO.*remove.*legacy/gi,
        /FIXME.*cleanup/gi,
        /deprecated.*service/gi,
        /old.*api/gi,
      ],
      category: "comment",
      riskLevel: "low",
      description: "Legacy cleanup comments and TODOs",
    },
  ];

  public includeExtensions = [
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".json",
    ".md",
    ".yml",
    ".yaml",
    ".env",
    ".env.local",
    ".env.production",
    ".env.development",
    ".config.js",
    ".config.ts",
  ];

  private excludePatterns = [
    /node_modules/,
    /\.git/,
    /dist/,
    /build/,
    /coverage/,
    /\.next/,
    /\.vercel/,
    /\.cache/,
    /reports/,
    /\.log$/,
    /\.map$/,
  ];

  async scanDirectory(rootPath: string = "."): Promise<ScanResult> {
    console.log("🔍 Starting legacy reference scan...");

    const files = await this.getFilesToScan(rootPath);
    return this.scanFiles(files);
  }

  async scanFiles(files: string[]): Promise<ScanResult> {
    const references: LegacyReference[] = [];

    let processedFiles = 0;
    const totalFiles = files.length;

    for (const file of files) {
      try {
        const fileReferences = await this.scanFile(file);
        references.push(...fileReferences);

        processedFiles++;
        if (processedFiles % 50 === 0) {
          console.log(`📁 Processed ${processedFiles}/${totalFiles} files...`);
        }
      } catch (error) {
        console.warn(`⚠️  Failed to scan ${file}: ${error}`);
      }
    }

    const result = this.generateScanResult(references);
    console.log(`✅ Scan complete: ${result.totalReferences} references found`);

    return result;
  }

  private async getFilesToScan(rootPath: string): Promise<string[]> {
    const allFiles: string[] = [];

    const walkDir = async (dir: string): Promise<void> => {
      const entries = await fs.promises.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        // Skip excluded directories
        if (this.excludePatterns.some((pattern) => pattern.test(fullPath))) {
          continue;
        }

        if (entry.isDirectory()) {
          await walkDir(fullPath);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name);
          if (this.includeExtensions.includes(ext)) {
            allFiles.push(fullPath);
          }
        }
      }
    };

    await walkDir(rootPath);
    return allFiles;
  }

  private async scanFile(filePath: string): Promise<LegacyReference[]> {
    const content = await fs.promises.readFile(filePath, "utf-8");
    const lines = content.split("\n");
    const references: LegacyReference[] = [];

    for (const pattern of this.patterns) {
      for (const regex of pattern.patterns) {
        let match;
        const globalRegex = new RegExp(regex.source, regex.flags);

        while ((match = globalRegex.exec(content)) !== null) {
          const lineNumber = this.getLineNumber(content, match.index);
          const line = lines[lineNumber - 1] || "";

          const reference: LegacyReference = {
            id: this.generateId(filePath, lineNumber, match.index),
            file: path.relative(process.cwd(), filePath),
            line: lineNumber,
            column: this.getColumnNumber(content, match.index),
            pattern: regex.source,
            match: match[0],
            service: pattern.service,
            riskLevel: pattern.riskLevel,
            confidence: this.calculateConfidence(match[0], pattern, line),
            context: this.getContext(lines, lineNumber - 1),
            category: pattern.category,
          };

          references.push(reference);
        }
      }
    }

    return references;
  }

  private generateId(file: string, line: number, index: number): string {
    return `${path.basename(file)}-${line}-${index}`;
  }

  private getLineNumber(content: string, index: number): number {
    return content.substring(0, index).split("\n").length;
  }

  private getColumnNumber(content: string, index: number): number {
    const lines = content.substring(0, index).split("\n");
    return lines[lines.length - 1].length + 1;
  }

  private calculateConfidence(
    match: string,
    pattern: DetectionPattern,
    context: string
  ): number {
    let confidence = 0.7; // Base confidence

    // Increase confidence for exact service matches
    if (match.toLowerCase().includes(pattern.service)) {
      confidence += 0.2;
    }

    // Increase confidence for import statements
    if (pattern.category === "import" && context.includes("import")) {
      confidence += 0.1;
    }

    // Increase confidence for API calls
    if (
      pattern.category === "api_call" &&
      (context.includes("(") || context.includes("."))
    ) {
      confidence += 0.1;
    }

    // Decrease confidence for comments
    if (context.trim().startsWith("//") || context.trim().startsWith("*")) {
      confidence -= 0.3;
    }

    return Math.min(Math.max(confidence, 0.1), 1.0);
  }

  private getContext(lines: string[], lineIndex: number): string {
    const start = Math.max(0, lineIndex - 1);
    const end = Math.min(lines.length, lineIndex + 2);
    return lines.slice(start, end).join("\n");
  }

  private generateScanResult(references: LegacyReference[]): ScanResult {
    const serviceBreakdown: Record<LegacyService, number> = {
      supabase: 0,
      vercel: 0,
      twilio: 0,
      resend: 0,
      lovable: 0,
      unknown: 0,
    };

    const riskBreakdown: Record<RiskLevel, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    const categoryBreakdown: Record<ReferenceCategory, number> = {
      import: 0,
      config: 0,
      api_call: 0,
      url: 0,
      env_var: 0,
      comment: 0,
      dependency: 0,
    };

    let totalConfidence = 0;

    for (const ref of references) {
      serviceBreakdown[ref.service]++;
      riskBreakdown[ref.riskLevel]++;
      categoryBreakdown[ref.category]++;
      totalConfidence += ref.confidence;
    }

    const topServices = Object.entries(serviceBreakdown)
      .map(([service, count]) => ({ service: service as LegacyService, count }))
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      timestamp: new Date().toISOString(),
      totalReferences: references.length,
      serviceBreakdown,
      riskBreakdown,
      categoryBreakdown,
      references,
      summary: {
        highRiskCount: riskBreakdown.high,
        criticalCount: riskBreakdown.critical,
        averageConfidence:
          references.length > 0 ? totalConfidence / references.length : 0,
        topServices,
      },
    };
  }

  async exportForBedrock(
    result: ScanResult,
    outputPath: string = "reports/detection.json"
  ): Promise<void> {
    const bedrockReport = {
      metadata: {
        timestamp: result.timestamp,
        scanner: "LegacyReferenceScanner",
        version: "2.0.0",
        totalReferences: result.totalReferences,
      },
      summary: result.summary,
      breakdown: {
        services: result.serviceBreakdown,
        risks: result.riskBreakdown,
        categories: result.categoryBreakdown,
      },
      references: result.references.map((ref) => ({
        id: ref.id,
        location: `${ref.file}:${ref.line}:${ref.column}`,
        service: ref.service,
        risk: ref.riskLevel,
        confidence: Math.round(ref.confidence * 100),
        match: ref.match,
        category: ref.category,
      })),
      recommendations: this.generateRecommendations(result),
    };

    await fs.promises.writeFile(
      outputPath,
      JSON.stringify(bedrockReport, null, 2)
    );
    console.log(`📊 Bedrock report exported to: ${outputPath}`);
  }

  private generateRecommendations(result: ScanResult): string[] {
    const recommendations: string[] = [];

    if (result.summary.criticalCount > 0) {
      recommendations.push(
        `🚨 ${result.summary.criticalCount} critical references require immediate attention`
      );
    }

    if (result.summary.highRiskCount > 10) {
      recommendations.push(
        `⚠️  ${result.summary.highRiskCount} high-risk references found - prioritize cleanup`
      );
    }

    const topService = result.summary.topServices[0];
    if (topService && topService.count > 20) {
      recommendations.push(
        `🎯 Focus cleanup efforts on ${topService.service} (${topService.count} references)`
      );
    }

    if (result.summary.averageConfidence < 0.7) {
      recommendations.push(
        `🔍 Low average confidence (${Math.round(
          result.summary.averageConfidence * 100
        )}%) - manual review recommended`
      );
    }

    return recommendations;
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  async function main() {
    const scanner = new LegacyReferenceScanner();
    const stagedOnly = process.argv.includes("--staged-only");

    try {
      let result;

      if (stagedOnly) {
        // Scan only staged files for pre-commit hook
        const { execSync } = await import("child_process");
        const stagedFiles = execSync("git diff --cached --name-only", {
          encoding: "utf-8",
        })
          .trim()
          .split("\n")
          .filter(
            (file) =>
              file &&
              scanner.includeExtensions.some((ext) => file.endsWith(ext))
          );

        if (stagedFiles.length === 0) {
          console.log("✅ No staged files to scan");
          process.exit(0);
        }

        console.log(`🔍 Scanning ${stagedFiles.length} staged files...`);
        result = await scanner.scanFiles(stagedFiles);
      } else {
        // Full directory scan
        result = await scanner.scanDirectory(".");
      }

      // Export detailed report (only for full scans)
      if (!stagedOnly) {
        await scanner.exportForBedrock(result, "reports/detection.json");
      }

      // Print summary
      console.log("\n📋 SCAN SUMMARY");
      console.log("================");
      console.log(`Total References: ${result.totalReferences}`);
      console.log(`Critical: ${result.summary.criticalCount}`);
      console.log(`High Risk: ${result.summary.highRiskCount}`);
      console.log(
        `Average Confidence: ${Math.round(
          result.summary.averageConfidence * 100
        )}%`
      );

      if (result.summary.topServices.length > 0) {
        console.log("\n🏷️  TOP SERVICES:");
        result.summary.topServices.forEach((service) => {
          console.log(`  ${service.service}: ${service.count} references`);
        });
      }

      // For staged scans, fail if any legacy references found
      if (stagedOnly && result.totalReferences > 0) {
        console.log("\n❌ Legacy references found in staged files!");
        console.log("Please remove legacy service usage before committing.");
        process.exit(1);
      }

      process.exit(result.summary.criticalCount > 0 ? 1 : 0);
    } catch (error) {
      console.error("❌ Scan failed:", error);
      process.exit(1);
    }
  }

  main();
}
