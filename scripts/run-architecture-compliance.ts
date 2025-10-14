#!/usr/bin/env npx tsx

/**
 * Architecture Compliance Checker Script
 * Runs comprehensive architecture compliance checks and generates reports
 */

import { ArchitectureComplianceChecker } from '../src/lib/architecture-scanner/architecture-compliance-checker';
import { promises as fs } from 'fs';
import path from 'path';

interface CliOptions {
  projectRoot?: string;
  outputFile?: string;
  format?: 'json' | 'markdown' | 'console';
  failOnError?: boolean;
  verbose?: boolean;
}

async function parseArgs(): Promise<CliOptions> {
  const args = process.argv.slice(2);
  const options: CliOptions = {
    projectRoot: process.cwd(),
    format: 'console',
    failOnError: true,
    verbose: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--project-root':
        options.projectRoot = args[++i];
        break;
      case '--output':
        options.outputFile = args[++i];
        break;
      case '--format':
        options.format = args[++i] as 'json' | 'markdown' | 'console';
        break;
      case '--no-fail':
        options.failOnError = false;
        break;
      case '--verbose':
        options.verbose = true;
        break;
      case '--help':
        printHelp();
        process.exit(0);
        break;
      default:
        if (arg.startsWith('--')) {
          console.error(`Unknown option: ${arg}`);
          process.exit(1);
        }
    }
  }

  return options;
}

function printHelp(): void {
  console.log(`
Architecture Compliance Checker

Usage: npx tsx scripts/run-architecture-compliance.ts [options]

Options:
  --project-root <path>    Project root directory (default: current directory)
  --output <file>          Output file path
  --format <type>          Output format: json, markdown, console (default: console)
  --no-fail               Don't exit with error code on violations
  --verbose               Verbose output
  --help                  Show this help message

Examples:
  npx tsx scripts/run-architecture-compliance.ts
  npx tsx scripts/run-architecture-compliance.ts --format json --output compliance-report.json
  npx tsx scripts/run-architecture-compliance.ts --project-root /path/to/project --verbose
  `);
}

async function formatReport(report: any, format: string): Promise<string> {
  switch (format) {
    case 'json':
      return JSON.stringify(report, null, 2);
    
    case 'markdown':
      return formatMarkdownReport(report);
    
    case 'console':
    default:
      return formatConsoleReport(report);
  }
}

function formatMarkdownReport(report: any): string {
  let markdown = `# Architecture Compliance Report\n\n`;
  markdown += `**Generated:** ${report.timestamp}\n`;
  markdown += `**Files Checked:** ${report.totalFiles}\n`;
  markdown += `**Total Violations:** ${report.totalViolations}\n\n`;

  // Summary
  markdown += `## Summary\n\n${report.summary}\n\n`;

  // Violations by Severity
  markdown += `## Violations by Severity\n\n`;
  markdown += `- ❌ **Errors:** ${report.violationsBySeverity.error}\n`;
  markdown += `- ⚠️ **Warnings:** ${report.violationsBySeverity.warning}\n`;
  markdown += `- ℹ️ **Info:** ${report.violationsBySeverity.info}\n\n`;

  // Violations by Category
  markdown += `## Violations by Category\n\n`;
  markdown += `- 🏗️ **Architecture:** ${report.violationsByCategory.architecture}\n`;
  markdown += `- 🔒 **Security:** ${report.violationsByCategory.security}\n`;
  markdown += `- ⚡ **Performance:** ${report.violationsByCategory.performance}\n`;
  markdown += `- 🔧 **Maintainability:** ${report.violationsByCategory.maintainability}\n\n`;

  // Detailed Violations
  if (report.violations.length > 0) {
    markdown += `## Detailed Violations\n\n`;
    
    const violationsByFile = report.violations.reduce((acc: any, violation: any) => {
      const file = violation.file || 'Unknown';
      if (!acc[file]) acc[file] = [];
      acc[file].push(violation);
      return acc;
    }, {});

    for (const [file, violations] of Object.entries(violationsByFile)) {
      markdown += `### ${file}\n\n`;
      
      for (const violation of violations as any[]) {
        const icon = violation.severity === 'error' ? '❌' : 
                    violation.severity === 'warning' ? '⚠️' : 'ℹ️';
        
        markdown += `${icon} **${violation.ruleId}** `;
        if (violation.line) markdown += `(Line ${violation.line}) `;
        markdown += `\n${violation.message}\n`;
        
        if (violation.suggestion) {
          markdown += `💡 *Suggestion: ${violation.suggestion}*\n`;
        }
        markdown += `\n`;
      }
    }
  }

  return markdown;
}

function formatConsoleReport(report: any): string {
  const colors = {
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    green: '\x1b[32m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
  };

  let output = `\n${colors.bold}🔍 Architecture Compliance Report${colors.reset}\n`;
  output += `${colors.cyan}Generated: ${report.timestamp}${colors.reset}\n`;
  output += `${colors.cyan}Files Checked: ${report.totalFiles}${colors.reset}\n`;
  output += `${colors.cyan}Total Violations: ${report.totalViolations}${colors.reset}\n\n`;

  // Summary
  output += `${colors.bold}📊 Summary${colors.reset}\n`;
  output += `${report.summary}\n\n`;

  // Violations by Severity
  output += `${colors.bold}📈 Violations by Severity${colors.reset}\n`;
  output += `${colors.red}❌ Errors: ${report.violationsBySeverity.error}${colors.reset}\n`;
  output += `${colors.yellow}⚠️  Warnings: ${report.violationsBySeverity.warning}${colors.reset}\n`;
  output += `${colors.blue}ℹ️  Info: ${report.violationsBySeverity.info}${colors.reset}\n\n`;

  // Violations by Category
  output += `${colors.bold}🏷️  Violations by Category${colors.reset}\n`;
  output += `🏗️  Architecture: ${report.violationsByCategory.architecture}\n`;
  output += `🔒 Security: ${report.violationsByCategory.security}\n`;
  output += `⚡ Performance: ${report.violationsByCategory.performance}\n`;
  output += `🔧 Maintainability: ${report.violationsByCategory.maintainability}\n\n`;

  // Detailed Violations (first 10)
  if (report.violations.length > 0) {
    output += `${colors.bold}🔍 Detailed Violations${colors.reset}\n`;
    
    const displayViolations = report.violations.slice(0, 10);
    
    for (const violation of displayViolations) {
      const icon = violation.severity === 'error' ? `${colors.red}❌` : 
                  violation.severity === 'warning' ? `${colors.yellow}⚠️` : `${colors.blue}ℹ️`;
      
      output += `${icon} ${colors.bold}${violation.ruleId}${colors.reset}`;
      if (violation.file) output += ` in ${colors.cyan}${violation.file}${colors.reset}`;
      if (violation.line) output += ` (Line ${violation.line})`;
      output += `\n   ${violation.message}\n`;
      
      if (violation.suggestion) {
        output += `   ${colors.green}💡 ${violation.suggestion}${colors.reset}\n`;
      }
      output += `\n`;
    }

    if (report.violations.length > 10) {
      output += `${colors.yellow}... and ${report.violations.length - 10} more violations${colors.reset}\n`;
      output += `${colors.yellow}Use --format json or --format markdown for complete report${colors.reset}\n\n`;
    }
  }

  return output;
}

async function main(): Promise<void> {
  try {
    const options = await parseArgs();
    
    if (options.verbose) {
      console.log('🔍 Starting Architecture Compliance Check...');
      console.log(`Project Root: ${options.projectRoot}`);
      console.log(`Output Format: ${options.format}`);
    }

    const checker = new ArchitectureComplianceChecker();
    const report = await checker.checkCompliance(options.projectRoot);

    const formattedReport = await formatReport(report, options.format || 'console');

    if (options.outputFile) {
      await fs.writeFile(options.outputFile, formattedReport, 'utf-8');
      console.log(`📄 Report saved to: ${options.outputFile}`);
    } else {
      console.log(formattedReport);
    }

    // Generate timestamped report in reports directory
    const reportsDir = path.join(options.projectRoot || process.cwd(), 'reports');
    await fs.mkdir(reportsDir, { recursive: true });
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const reportFile = path.join(reportsDir, `architecture-compliance-${timestamp}.json`);
    await fs.writeFile(reportFile, JSON.stringify(report, null, 2), 'utf-8');
    
    if (options.verbose) {
      console.log(`📄 Detailed report saved to: ${reportFile}`);
    }

    // Exit with error code if violations found and failOnError is true
    if (options.failOnError && report.violationsBySeverity.error > 0) {
      console.error(`\n❌ Architecture compliance check failed with ${report.violationsBySeverity.error} error(s)`);
      process.exit(1);
    }

    if (options.verbose) {
      console.log('✅ Architecture compliance check completed successfully');
    }

  } catch (error) {
    console.error('❌ Architecture compliance check failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
}