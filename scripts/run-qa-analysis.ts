#!/usr/bin/env npx tsx

/**
 * QA Analysis Runner Script
 * Command-line interface for running quality assurance checks
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { qaOrchestrator, QAConfig } from '../src/lib/quality-assurance';

interface CLIOptions {
  files: string[];
  urls: string[];
  quick: boolean;
  codeReviewOnly: boolean;
  securityOnly: boolean;
  accessibilityOnly: boolean;
  qualityGatesOnly: boolean;
  output: string;
  format: 'json' | 'markdown' | 'both';
  config?: string;
}

function parseArgs(): CLIOptions {
  const args = process.argv.slice(2);
  const options: CLIOptions = {
    files: [],
    urls: [],
    quick: false,
    codeReviewOnly: false,
    securityOnly: false,
    accessibilityOnly: false,
    qualityGatesOnly: false,
    output: 'qa-reports',
    format: 'both',
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--quick':
        options.quick = true;
        break;
      case '--code-review-only':
        options.codeReviewOnly = true;
        break;
      case '--security-only':
        options.securityOnly = true;
        break;
      case '--accessibility-only':
        options.accessibilityOnly = true;
        break;
      case '--quality-gates-only':
        options.qualityGatesOnly = true;
        break;
      case '--output':
        options.output = args[++i];
        break;
      case '--format':
        options.format = args[++i] as 'json' | 'markdown' | 'both';
        break;
      case '--config':
        options.config = args[++i];
        break;
      case '--files':
        // Collect files until next flag or end
        i++;
        while (i < args.length && !args[i].startsWith('--')) {
          options.files.push(args[i]);
          i++;
        }
        i--; // Back up one since the loop will increment
        break;
      case '--urls':
        // Collect URLs until next flag or end
        i++;
        while (i < args.length && !args[i].startsWith('--')) {
          options.urls.push(args[i]);
          i++;
        }
        i--; // Back up one since the loop will increment
        break;
      default:
        // If it doesn't start with --, assume it's a file
        if (!arg.startsWith('--')) {
          options.files.push(arg);
        }
        break;
    }
  }

  return options;
}

function loadConfig(configPath?: string): QAConfig | undefined {
  if (!configPath) return undefined;

  try {
    const config = require(join(process.cwd(), configPath));
    return config;
  } catch (error) {
    console.warn(`Failed to load config from ${configPath}:`, error);
    return undefined;
  }
}

function getDefaultFiles(): string[] {
  // Default to scanning TypeScript/JavaScript files in src
  return [
    'src/**/*.ts',
    'src/**/*.tsx',
    'src/**/*.js',
    'src/**/*.jsx',
  ];
}

function getDefaultUrls(): string[] {
  const baseUrl = process.env.BASE_URL || 'http://localhost:5173';
  return [
    baseUrl,
    `${baseUrl}/vc/quick`,
    `${baseUrl}/dashboard`,
    `${baseUrl}/admin`,
  ];
}

function expandGlobs(patterns: string[]): string[] {
  const glob = require('fast-glob');
  const expandedFiles: string[] = [];
  
  for (const pattern of patterns) {
    try {
      const matches = glob.sync(pattern, { 
        ignore: ['**/node_modules/**', '**/dist/**', '**/coverage/**', '**/archive/**'] 
      });
      expandedFiles.push(...matches);
    } catch (error) {
      console.warn(`Failed to expand glob pattern ${pattern}:`, error);
      // If glob expansion fails, treat as literal file path
      expandedFiles.push(pattern);
    }
  }
  
  return [...new Set(expandedFiles)]; // Remove duplicates
}

async function main() {
  console.log('🔍 Starting Quality Assurance Analysis...\n');

  const options = parseArgs();
  const config = loadConfig(options.config);

  // Determine files and URLs to analyze
  let files = options.files.length > 0 ? options.files : getDefaultFiles();
  let urls = options.urls.length > 0 ? options.urls : [];

  // Expand glob patterns
  files = expandGlobs(files);

  // For accessibility-only mode, use default URLs if none provided
  if (options.accessibilityOnly && urls.length === 0) {
    urls = getDefaultUrls();
  }

  console.log(`📁 Files to analyze: ${files.length}`);
  console.log(`🌐 URLs to test: ${urls.length}`);
  console.log(`📊 Output directory: ${options.output}\n`);

  // Ensure output directory exists
  if (!existsSync(options.output)) {
    mkdirSync(options.output, { recursive: true });
  }

  try {
    let result;

    // Run appropriate analysis based on options
    if (options.quick) {
      console.log('⚡ Running quick scan (code review + security)...');
      result = await qaOrchestrator.runQuickScan(files);
    } else if (options.codeReviewOnly) {
      console.log('🤖 Running AI code review only...');
      const codeReviewResults = await qaOrchestrator.runCodeReviewOnly(files);
      result = {
        timestamp: new Date().toISOString(),
        overallStatus: 'passed' as const,
        overallScore: 100,
        results: { codeReview: codeReviewResults },
        summary: { totalIssues: 0, criticalIssues: 0, recommendations: [] },
        reports: { markdown: '', json: '' },
      };
    } else if (options.securityOnly) {
      console.log('🔒 Running security scan only...');
      const securityResult = await qaOrchestrator.runSecurityOnlyScan(files);
      result = {
        timestamp: new Date().toISOString(),
        overallStatus: securityResult.passed ? 'passed' as const : 'failed' as const,
        overallScore: securityResult.passed ? 100 : 50,
        results: { security: securityResult },
        summary: { 
          totalIssues: securityResult.totalVulnerabilities, 
          criticalIssues: securityResult.summary.critical + securityResult.summary.high,
          recommendations: securityResult.recommendations 
        },
        reports: { markdown: '', json: '' },
      };
    } else if (options.accessibilityOnly) {
      console.log('♿ Running accessibility tests only...');
      const accessibilityResults = await qaOrchestrator.runAccessibilityOnlyScan(urls);
      const overallPassed = accessibilityResults.every(test => test.passed);
      result = {
        timestamp: new Date().toISOString(),
        overallStatus: overallPassed ? 'passed' as const : 'failed' as const,
        overallScore: Math.round(accessibilityResults.reduce((sum, test) => sum + test.score, 0) / accessibilityResults.length),
        results: { accessibility: accessibilityResults },
        summary: { 
          totalIssues: accessibilityResults.reduce((sum, test) => sum + test.violations.length, 0),
          criticalIssues: accessibilityResults.reduce((sum, test) => sum + test.summary.critical + test.summary.serious, 0),
          recommendations: accessibilityResults.flatMap(test => test.recommendations)
        },
        reports: { markdown: '', json: '' },
      };
    } else if (options.qualityGatesOnly) {
      console.log('📊 Running quality gates only...');
      const qualityResult = await qaOrchestrator.runQualityGatesOnly();
      result = {
        timestamp: new Date().toISOString(),
        overallStatus: qualityResult.overallStatus,
        overallScore: qualityResult.qualityScore,
        results: { qualityGates: qualityResult },
        summary: { 
          totalIssues: qualityResult.metrics.filter(m => m.status === 'failed').length,
          criticalIssues: qualityResult.metrics.filter(m => m.status === 'failed').length,
          recommendations: qualityResult.recommendations
        },
        reports: { markdown: '', json: '' },
      };
    } else {
      console.log('🔍 Running full QA analysis...');
      result = await qaOrchestrator.runFullQAAnalysis(files, urls, config);
    }

    // Generate timestamp for file names
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const timeStr = new Date().toISOString().replace(/[:.]/g, '-').split('T')[1].split('.')[0];

    // Save results
    if (options.format === 'json' || options.format === 'both') {
      const jsonPath = join(options.output, `qa-report-${timestamp}-${timeStr}.json`);
      writeFileSync(jsonPath, JSON.stringify(result, null, 2));
      console.log(`📄 JSON report saved: ${jsonPath}`);
    }

    if (options.format === 'markdown' || options.format === 'both') {
      const markdownPath = join(options.output, `qa-report-${timestamp}-${timeStr}.md`);
      writeFileSync(markdownPath, result.reports.markdown);
      console.log(`📝 Markdown report saved: ${markdownPath}`);
    }

    // Also save as "latest" for easy access
    if (options.format === 'json' || options.format === 'both') {
      const latestJsonPath = join(options.output, 'qa-report-latest.json');
      writeFileSync(latestJsonPath, JSON.stringify(result, null, 2));
    }

    if (options.format === 'markdown' || options.format === 'both') {
      const latestMarkdownPath = join(options.output, 'qa-report-latest.md');
      writeFileSync(latestMarkdownPath, result.reports.markdown);
    }

    // Print summary
    console.log('\n📊 QA Analysis Summary:');
    console.log(`   Status: ${result.overallStatus.toUpperCase()}`);
    console.log(`   Score: ${result.overallScore}/100`);
    console.log(`   Total Issues: ${result.summary.totalIssues}`);
    console.log(`   Critical Issues: ${result.summary.criticalIssues}`);

    if (result.summary.recommendations.length > 0) {
      console.log('\n💡 Top Recommendations:');
      result.summary.recommendations.slice(0, 3).forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec}`);
      });
    }

    // Exit with appropriate code
    if (result.overallStatus === 'failed') {
      console.log('\n❌ QA analysis failed');
      process.exit(1);
    } else if (result.overallStatus === 'warning') {
      console.log('\n⚠️ QA analysis passed with warnings');
      process.exit(0);
    } else {
      console.log('\n✅ QA analysis passed');
      process.exit(0);
    }

  } catch (error) {
    console.error('\n❌ QA analysis failed:', error);
    process.exit(1);
  }
}

// Show help if requested
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Quality Assurance Analysis Tool

Usage:
  npm run qa:full                    # Run full QA analysis
  npm run qa:quick                   # Run quick scan (code review + security)
  npm run qa:code-review             # Run AI code review only
  npm run qa:security                # Run security scan only
  npm run qa:accessibility           # Run accessibility tests only
  npm run qa:quality-gates           # Run quality gates only

Options:
  --files <files...>                 # Specify files to analyze (supports globs)
  --urls <urls...>                   # Specify URLs to test for accessibility
  --output <dir>                     # Output directory (default: qa-reports)
  --format <json|markdown|both>      # Output format (default: both)
  --config <path>                    # Path to QA config file
  --help, -h                         # Show this help

Examples:
  npm run qa:full -- --files "src/**/*.ts" --urls "http://localhost:3000"
  npm run qa:security -- --output ./security-reports
  npm run qa:accessibility -- --urls "http://localhost:3000" "http://localhost:3000/dashboard"
`);
  process.exit(0);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});