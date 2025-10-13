#!/usr/bin/env npx tsx

/**
 * QA Summary Generator Script
 * Combines multiple QA reports into a comprehensive summary
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

interface QASummary {
  timestamp: string;
  overallStatus: 'passed' | 'failed' | 'warning';
  overallScore: number;
  totalIssues: number;
  criticalIssues: number;
  components: {
    codeReview?: {
      status: string;
      score: number;
      issues: number;
      files: number;
    };
    security?: {
      status: string;
      vulnerabilities: number;
      critical: number;
      high: number;
    };
    accessibility?: {
      status: string;
      score: number;
      violations: number;
      pages: number;
    };
    qualityGates?: {
      status: string;
      score: number;
      coverage: number;
      bugs: number;
    };
  };
  recommendations: string[];
  trends?: {
    scoreChange: number;
    issueChange: number;
    previousScore?: number;
    previousIssues?: number;
  };
}

function findQAReports(artifactsPath: string): string[] {
  const reports: string[] = [];
  
  if (!existsSync(artifactsPath)) {
    console.warn(`Artifacts path not found: ${artifactsPath}`);
    return reports;
  }

  try {
    const items = readdirSync(artifactsPath, { withFileTypes: true });
    
    for (const item of items) {
      if (item.isDirectory()) {
        const dirPath = join(artifactsPath, item.name);
        const files = readdirSync(dirPath);
        
        for (const file of files) {
          if (file.endsWith('.json') && file.includes('qa-report')) {
            reports.push(join(dirPath, file));
          }
        }
      }
    }
  } catch (error) {
    console.error('Error reading artifacts directory:', error);
  }

  return reports;
}

function loadQAReport(filePath: string): any {
  try {
    const content = readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Failed to load QA report from ${filePath}:`, error);
    return null;
  }
}

function combineQAReports(reports: any[]): QASummary {
  const timestamp = new Date().toISOString();
  let overallStatus: 'passed' | 'failed' | 'warning' = 'passed';
  let totalScore = 0;
  let scoreCount = 0;
  let totalIssues = 0;
  let criticalIssues = 0;
  const allRecommendations: string[] = [];
  
  const summary: QASummary = {
    timestamp,
    overallStatus: 'passed',
    overallScore: 0,
    totalIssues: 0,
    criticalIssues: 0,
    components: {},
    recommendations: [],
  };

  for (const report of reports) {
    if (!report) continue;

    // Aggregate scores
    if (report.overallScore) {
      totalScore += report.overallScore;
      scoreCount++;
    }

    // Aggregate issues
    if (report.summary) {
      totalIssues += report.summary.totalIssues || 0;
      criticalIssues += report.summary.criticalIssues || 0;
      
      if (report.summary.recommendations) {
        allRecommendations.push(...report.summary.recommendations);
      }
    }

    // Determine overall status
    if (report.overallStatus === 'failed') {
      overallStatus = 'failed';
    } else if (report.overallStatus === 'warning' && overallStatus !== 'failed') {
      overallStatus = 'warning';
    }

    // Extract component-specific data
    if (report.results) {
      // Code Review
      if (report.results.codeReview) {
        const codeReviews = Array.isArray(report.results.codeReview) 
          ? report.results.codeReview 
          : [report.results.codeReview];
        
        const avgScore = codeReviews.reduce((sum: number, review: any) => sum + (review.overallScore || 0), 0) / codeReviews.length;
        const totalSuggestions = codeReviews.reduce((sum: number, review: any) => sum + (review.suggestions?.length || 0), 0);
        
        summary.components.codeReview = {
          status: totalSuggestions === 0 ? 'passed' : 'warning',
          score: Math.round(avgScore),
          issues: totalSuggestions,
          files: codeReviews.length,
        };
      }

      // Security
      if (report.results.security) {
        const security = report.results.security;
        summary.components.security = {
          status: security.passed ? 'passed' : 'failed',
          vulnerabilities: security.totalVulnerabilities || 0,
          critical: security.summary?.critical || 0,
          high: security.summary?.high || 0,
        };
      }

      // Accessibility
      if (report.results.accessibility) {
        const accessibility = Array.isArray(report.results.accessibility) 
          ? report.results.accessibility 
          : [report.results.accessibility];
        
        const avgScore = accessibility.reduce((sum: number, test: any) => sum + (test.score || 0), 0) / accessibility.length;
        const totalViolations = accessibility.reduce((sum: number, test: any) => sum + (test.violations?.length || 0), 0);
        const allPassed = accessibility.every((test: any) => test.passed);
        
        summary.components.accessibility = {
          status: allPassed ? 'passed' : 'failed',
          score: Math.round(avgScore),
          violations: totalViolations,
          pages: accessibility.length,
        };
      }

      // Quality Gates
      if (report.results.qualityGates) {
        const qualityGates = report.results.qualityGates;
        summary.components.qualityGates = {
          status: qualityGates.overallStatus || 'unknown',
          score: qualityGates.qualityScore || 0,
          coverage: qualityGates.coverage?.lines || 0,
          bugs: qualityGates.bugs || 0,
        };
      }
    }
  }

  // Calculate final values
  summary.overallStatus = overallStatus;
  summary.overallScore = scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0;
  summary.totalIssues = totalIssues;
  summary.criticalIssues = criticalIssues;
  summary.recommendations = [...new Set(allRecommendations)].slice(0, 10); // Top 10 unique recommendations

  return summary;
}

function loadPreviousSummary(outputDir: string): QASummary | null {
  const previousPath = join(outputDir, 'summary-previous.json');
  
  if (!existsSync(previousPath)) {
    return null;
  }

  try {
    const content = readFileSync(previousPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.warn('Failed to load previous summary:', error);
    return null;
  }
}

function calculateTrends(current: QASummary, previous: QASummary | null): QASummary {
  if (!previous) {
    return current;
  }

  current.trends = {
    scoreChange: current.overallScore - previous.overallScore,
    issueChange: current.totalIssues - previous.totalIssues,
    previousScore: previous.overallScore,
    previousIssues: previous.totalIssues,
  };

  return current;
}

function generateMarkdownSummary(summary: QASummary): string {
  const statusEmoji = {
    passed: '✅',
    warning: '⚠️',
    failed: '❌',
  };

  const trendEmoji = (change: number) => {
    if (change > 0) return '📈';
    if (change < 0) return '📉';
    return '➡️';
  };

  let markdown = `# Quality Assurance Summary Report

**Generated:** ${new Date(summary.timestamp).toLocaleString()}
**Overall Status:** ${statusEmoji[summary.overallStatus]} ${summary.overallStatus.toUpperCase()}
**Overall Score:** ${summary.overallScore}/100

## 📊 Summary Metrics

- **Total Issues:** ${summary.totalIssues}
- **Critical Issues:** ${summary.criticalIssues}
- **Quality Score:** ${summary.overallScore}/100

`;

  // Add trends if available
  if (summary.trends) {
    markdown += `## 📈 Trends

- **Score Change:** ${trendEmoji(summary.trends.scoreChange)} ${summary.trends.scoreChange > 0 ? '+' : ''}${summary.trends.scoreChange} (was ${summary.trends.previousScore})
- **Issue Change:** ${trendEmoji(-summary.trends.issueChange)} ${summary.trends.issueChange > 0 ? '+' : ''}${summary.trends.issueChange} (was ${summary.trends.previousIssues})

`;
  }

  // Component details
  markdown += `## 🔍 Component Results

`;

  if (summary.components.codeReview) {
    const cr = summary.components.codeReview;
    markdown += `### 🤖 AI Code Review
- **Status:** ${statusEmoji[cr.status as keyof typeof statusEmoji]} ${cr.status.toUpperCase()}
- **Score:** ${cr.score}/100
- **Issues Found:** ${cr.issues}
- **Files Analyzed:** ${cr.files}

`;
  }

  if (summary.components.security) {
    const sec = summary.components.security;
    markdown += `### 🔒 Security Scan
- **Status:** ${statusEmoji[sec.status as keyof typeof statusEmoji]} ${sec.status.toUpperCase()}
- **Vulnerabilities:** ${sec.vulnerabilities}
- **Critical:** ${sec.critical}
- **High:** ${sec.high}

`;
  }

  if (summary.components.accessibility) {
    const acc = summary.components.accessibility;
    markdown += `### ♿ Accessibility Tests
- **Status:** ${statusEmoji[acc.status as keyof typeof statusEmoji]} ${acc.status.toUpperCase()}
- **Score:** ${acc.score}/100
- **Violations:** ${acc.violations}
- **Pages Tested:** ${acc.pages}

`;
  }

  if (summary.components.qualityGates) {
    const qg = summary.components.qualityGates;
    markdown += `### 📊 Quality Gates
- **Status:** ${statusEmoji[qg.status as keyof typeof statusEmoji]} ${qg.status.toUpperCase()}
- **Score:** ${qg.score}/100
- **Coverage:** ${qg.coverage}%
- **Bugs:** ${qg.bugs}

`;
  }

  // Recommendations
  if (summary.recommendations.length > 0) {
    markdown += `## 💡 Key Recommendations

`;
    summary.recommendations.forEach((rec, index) => {
      markdown += `${index + 1}. ${rec}\n`;
    });
    markdown += '\n';
  }

  // Action items based on status
  if (summary.overallStatus === 'failed') {
    markdown += `## 🚨 Action Required

The QA analysis has failed. Please address the critical issues before proceeding:

- Fix all critical security vulnerabilities
- Resolve accessibility violations
- Address failed quality gate metrics
- Review and implement AI code review suggestions

`;
  } else if (summary.overallStatus === 'warning') {
    markdown += `## ⚠️ Attention Needed

The QA analysis passed with warnings. Consider addressing these issues:

- Review moderate-severity security issues
- Improve accessibility scores
- Address code quality warnings
- Implement suggested improvements

`;
  } else {
    markdown += `## ✅ All Clear

Great job! All QA checks have passed. Keep up the good work!

`;
  }

  return markdown;
}

async function main() {
  console.log('📊 Generating QA Summary Report...\n');

  const artifactsPath = process.env.ARTIFACTS_PATH || 'qa-artifacts';
  const outputDir = 'qa-reports';

  // Ensure output directory exists
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  // Find and load QA reports
  const reportPaths = findQAReports(artifactsPath);
  console.log(`📁 Found ${reportPaths.length} QA reports`);

  if (reportPaths.length === 0) {
    console.warn('⚠️ No QA reports found. Looking for local reports...');
    
    // Try to find local reports
    const localReports = readdirSync(outputDir)
      .filter(file => file.startsWith('qa-report-') && file.endsWith('.json'))
      .map(file => join(outputDir, file));
    
    if (localReports.length > 0) {
      reportPaths.push(...localReports);
      console.log(`📁 Found ${localReports.length} local QA reports`);
    }
  }

  if (reportPaths.length === 0) {
    console.error('❌ No QA reports found to summarize');
    process.exit(1);
  }

  // Load reports
  const reports = reportPaths.map(loadQAReport).filter(Boolean);
  console.log(`📊 Loaded ${reports.length} valid reports`);

  // Load previous summary for trend analysis
  const previousSummary = loadPreviousSummary(outputDir);
  if (previousSummary) {
    console.log('📈 Previous summary found - will calculate trends');
  }

  // Generate summary
  let summary = combineQAReports(reports);
  summary = calculateTrends(summary, previousSummary);

  // Generate timestamp for file names
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const timeStr = new Date().toISOString().replace(/[:.]/g, '-').split('T')[1].split('.')[0];

  // Save summary
  const summaryJsonPath = join(outputDir, `summary-${timestamp}-${timeStr}.json`);
  const summaryMarkdownPath = join(outputDir, `summary-${timestamp}-${timeStr}.md`);
  const latestJsonPath = join(outputDir, 'summary-latest.json');
  const latestMarkdownPath = join(outputDir, 'summary-latest.md');

  writeFileSync(summaryJsonPath, JSON.stringify(summary, null, 2));
  writeFileSync(latestJsonPath, JSON.stringify(summary, null, 2));

  const markdownContent = generateMarkdownSummary(summary);
  writeFileSync(summaryMarkdownPath, markdownContent);
  writeFileSync(latestMarkdownPath, markdownContent);

  // Save current as previous for next run
  const previousJsonPath = join(outputDir, 'summary-previous.json');
  writeFileSync(previousJsonPath, JSON.stringify(summary, null, 2));

  console.log(`\n📄 Summary saved:`);
  console.log(`   JSON: ${summaryJsonPath}`);
  console.log(`   Markdown: ${summaryMarkdownPath}`);
  console.log(`   Latest: ${latestJsonPath}, ${latestMarkdownPath}`);

  // Print summary
  console.log('\n📊 QA Summary:');
  console.log(`   Status: ${summary.overallStatus.toUpperCase()}`);
  console.log(`   Score: ${summary.overallScore}/100`);
  console.log(`   Total Issues: ${summary.totalIssues}`);
  console.log(`   Critical Issues: ${summary.criticalIssues}`);

  if (summary.trends) {
    console.log(`   Score Change: ${summary.trends.scoreChange > 0 ? '+' : ''}${summary.trends.scoreChange}`);
    console.log(`   Issue Change: ${summary.trends.issueChange > 0 ? '+' : ''}${summary.trends.issueChange}`);
  }

  // Exit with appropriate code
  if (summary.overallStatus === 'failed') {
    console.log('\n❌ QA summary indicates failures');
    process.exit(1);
  } else if (summary.overallStatus === 'warning') {
    console.log('\n⚠️ QA summary indicates warnings');
    process.exit(0);
  } else {
    console.log('\n✅ QA summary indicates success');
    process.exit(0);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});