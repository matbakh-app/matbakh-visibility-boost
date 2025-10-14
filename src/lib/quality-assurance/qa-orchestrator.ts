/**
 * Quality Assurance Orchestrator
 * Coordinates all QA automation systems and provides unified interface
 */

import { AICodeReviewer, CodeReviewRequest, CodeReviewResult } from './ai-code-reviewer';
import { SecurityScanner, SecurityScanResult, SecurityPolicy } from './security-scanner';
import { AccessibilityTester, AccessibilityTestResult, AccessibilityConfig } from './accessibility-tester';
import { CodeQualityGates, QualityGateResult, QualityGateConfig } from './code-quality-gates';

export interface QAConfig {
  aiCodeReview?: {
    enabled: boolean;
    modelId?: string;
  };
  security?: {
    enabled: boolean;
    policy?: SecurityPolicy;
  };
  accessibility?: {
    enabled: boolean;
    config?: AccessibilityConfig;
  };
  qualityGates?: {
    enabled: boolean;
    config?: QualityGateConfig;
  };
}

export interface QAResult {
  timestamp: string;
  overallStatus: 'passed' | 'failed' | 'warning';
  overallScore: number;
  results: {
    codeReview?: CodeReviewResult[];
    security?: SecurityScanResult;
    accessibility?: AccessibilityTestResult[];
    qualityGates?: QualityGateResult;
  };
  summary: {
    totalIssues: number;
    criticalIssues: number;
    recommendations: string[];
  };
  reports: {
    markdown: string;
    json: string;
  };
}

export class QAOrchestrator {
  private aiCodeReviewer: AICodeReviewer;
  private securityScanner: SecurityScanner;
  private accessibilityTester: AccessibilityTester;
  private codeQualityGates: CodeQualityGates;

  constructor() {
    this.aiCodeReviewer = new AICodeReviewer();
    this.securityScanner = new SecurityScanner();
    this.accessibilityTester = new AccessibilityTester();
    this.codeQualityGates = new CodeQualityGates();
  }

  async runFullQAAnalysis(
    files: string[],
    urls?: string[],
    config?: QAConfig
  ): Promise<QAResult> {
    const defaultConfig: QAConfig = {
      aiCodeReview: { enabled: true },
      security: { enabled: true },
      accessibility: { enabled: true },
      qualityGates: { enabled: true },
    };

    const activeConfig = { ...defaultConfig, ...config };
    const results: QAResult['results'] = {};

    console.log('🔍 Starting comprehensive QA analysis...');

    try {
      // Run all QA checks in parallel where possible
      const qaPromises: Promise<any>[] = [];

      // AI Code Review
      if (activeConfig.aiCodeReview?.enabled && files.length > 0) {
        console.log('🤖 Running AI code review...');
        qaPromises.push(this.runCodeReview(files));
      }

      // Security Scanning
      if (activeConfig.security?.enabled) {
        console.log('🔒 Running security scan...');
        qaPromises.push(this.runSecurityScan(files, activeConfig.security.policy));
      }

      // Accessibility Testing
      if (activeConfig.accessibility?.enabled && urls && urls.length > 0) {
        console.log('♿ Running accessibility tests...');
        qaPromises.push(this.runAccessibilityTests(urls, activeConfig.accessibility.config));
      }

      // Quality Gates
      if (activeConfig.qualityGates?.enabled) {
        console.log('📊 Running quality gates...');
        qaPromises.push(this.runQualityGates(activeConfig.qualityGates.config));
      }

      // Wait for all checks to complete
      const qaResults = await Promise.allSettled(qaPromises);

      // Process results
      let resultIndex = 0;
      
      if (activeConfig.aiCodeReview?.enabled && files.length > 0) {
        const codeReviewResult = qaResults[resultIndex++];
        if (codeReviewResult.status === 'fulfilled') {
          results.codeReview = codeReviewResult.value;
        }
      }

      if (activeConfig.security?.enabled) {
        const securityResult = qaResults[resultIndex++];
        if (securityResult.status === 'fulfilled') {
          results.security = securityResult.value;
        }
      }

      if (activeConfig.accessibility?.enabled && urls && urls.length > 0) {
        const accessibilityResult = qaResults[resultIndex++];
        if (accessibilityResult.status === 'fulfilled') {
          results.accessibility = accessibilityResult.value;
        }
      }

      if (activeConfig.qualityGates?.enabled) {
        const qualityGatesResult = qaResults[resultIndex++];
        if (qualityGatesResult.status === 'fulfilled') {
          results.qualityGates = qualityGatesResult.value;
        }
      }

      // Calculate overall metrics
      const summary = this.calculateSummary(results);
      const overallStatus = this.calculateOverallStatus(results);
      const overallScore = this.calculateOverallScore(results);

      // Generate reports
      const reports = await this.generateReports(results, summary);

      console.log(`✅ QA analysis complete - Status: ${overallStatus}, Score: ${overallScore}/100`);

      return {
        timestamp: new Date().toISOString(),
        overallStatus,
        overallScore,
        results,
        summary,
        reports,
      };

    } catch (error) {
      console.error('❌ QA analysis failed:', error);
      return this.createFailureResult(error);
    }
  }

  private async runCodeReview(files: string[]): Promise<CodeReviewResult[]> {
    const codeReviewRequests: CodeReviewRequest[] = files.map(filePath => ({
      filePath,
      content: this.readFileContent(filePath),
      language: this.detectLanguage(filePath),
    }));

    return await this.aiCodeReviewer.reviewMultipleFiles(codeReviewRequests);
  }

  private async runSecurityScan(files: string[], policy?: SecurityPolicy): Promise<SecurityScanResult> {
    // Run both dependency and code scanning
    const [dependencyResult, codeResult] = await Promise.allSettled([
      this.securityScanner.scanDependencies(policy),
      this.securityScanner.scanCode(files),
    ]);

    // Combine results
    if (dependencyResult.status === 'fulfilled' && codeResult.status === 'fulfilled') {
      return this.combineSecurityResults(dependencyResult.value, codeResult.value);
    } else if (dependencyResult.status === 'fulfilled') {
      return dependencyResult.value;
    } else if (codeResult.status === 'fulfilled') {
      return codeResult.value;
    } else {
      throw new Error('Both security scans failed');
    }
  }

  private async runAccessibilityTests(urls: string[], config?: AccessibilityConfig): Promise<AccessibilityTestResult[]> {
    return await this.accessibilityTester.testMultiplePages(urls, config);
  }

  private async runQualityGates(config?: QualityGateConfig): Promise<QualityGateResult> {
    return await this.codeQualityGates.runQualityGate(config);
  }

  private calculateSummary(results: QAResult['results']) {
    let totalIssues = 0;
    let criticalIssues = 0;
    const recommendations: string[] = [];

    // Code review issues
    if (results.codeReview) {
      results.codeReview.forEach(review => {
        totalIssues += review.suggestions.length;
        criticalIssues += review.summary.criticalIssues;
      });
    }

    // Security issues
    if (results.security) {
      totalIssues += results.security.totalVulnerabilities;
      criticalIssues += results.security.summary.critical + results.security.summary.high;
      recommendations.push(...results.security.recommendations);
    }

    // Accessibility issues
    if (results.accessibility) {
      results.accessibility.forEach(test => {
        totalIssues += test.violations.length;
        criticalIssues += test.summary.critical + test.summary.serious;
        recommendations.push(...test.recommendations);
      });
    }

    // Quality gate issues
    if (results.qualityGates) {
      const failedMetrics = results.qualityGates.metrics.filter(m => m.status === 'failed');
      totalIssues += failedMetrics.length;
      criticalIssues += failedMetrics.length;
      recommendations.push(...results.qualityGates.recommendations);
    }

    // Deduplicate recommendations
    const uniqueRecommendations = [...new Set(recommendations)];

    return {
      totalIssues,
      criticalIssues,
      recommendations: uniqueRecommendations,
    };
  }

  private calculateOverallStatus(results: QAResult['results']): 'passed' | 'failed' | 'warning' {
    const statuses: Array<'passed' | 'failed' | 'warning'> = [];

    if (results.security) {
      statuses.push(results.security.passed ? 'passed' : 'failed');
    }

    if (results.accessibility) {
      const accessibilityPassed = results.accessibility.every(test => test.passed);
      statuses.push(accessibilityPassed ? 'passed' : 'failed');
    }

    if (results.qualityGates) {
      statuses.push(results.qualityGates.overallStatus);
    }

    if (results.codeReview) {
      const hasCriticalIssues = results.codeReview.some(review => review.summary.criticalIssues > 0);
      statuses.push(hasCriticalIssues ? 'warning' : 'passed');
    }

    // Determine overall status
    if (statuses.includes('failed')) return 'failed';
    if (statuses.includes('warning')) return 'warning';
    return 'passed';
  }

  private calculateOverallScore(results: QAResult['results']): number {
    const scores: number[] = [];

    if (results.codeReview) {
      const avgCodeReviewScore = results.codeReview.reduce((sum, review) => sum + review.overallScore, 0) / results.codeReview.length;
      scores.push(avgCodeReviewScore);
    }

    if (results.accessibility) {
      const avgAccessibilityScore = results.accessibility.reduce((sum, test) => sum + test.score, 0) / results.accessibility.length;
      scores.push(avgAccessibilityScore);
    }

    if (results.qualityGates) {
      scores.push(results.qualityGates.qualityScore);
    }

    if (results.security) {
      // Convert security pass/fail to score
      const securityScore = results.security.passed ? 100 : Math.max(0, 100 - (results.security.summary.critical * 20 + results.security.summary.high * 10));
      scores.push(securityScore);
    }

    return scores.length > 0 ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0;
  }

  private async generateReports(results: QAResult['results'], summary: any) {
    const markdownReport = await this.generateMarkdownReport(results, summary);
    const jsonReport = JSON.stringify(results, null, 2);

    return {
      markdown: markdownReport,
      json: jsonReport,
    };
  }

  private async generateMarkdownReport(results: QAResult['results'], summary: any): Promise<string> {
    let report = `# Quality Assurance Report

**Generated:** ${new Date().toISOString()}
**Total Issues:** ${summary.totalIssues}
**Critical Issues:** ${summary.criticalIssues}

## Summary
`;

    // Code Review Section
    if (results.codeReview) {
      report += `\n## 🤖 AI Code Review\n`;
      results.codeReview.forEach(review => {
        report += `\n### ${review.filePath}\n`;
        report += `- **Score:** ${review.overallScore}/100\n`;
        report += `- **Issues:** ${review.suggestions.length}\n`;
        report += `- **Critical:** ${review.summary.criticalIssues}\n`;
        report += `- **Security:** ${review.summary.securityIssues}\n`;
        report += `- **Performance:** ${review.summary.performanceIssues}\n\n`;
      });
    }

    // Security Section
    if (results.security) {
      const secReport = 
        typeof (this.securityScanner as any).generateSecurityReport === 'function'
          ? (this.securityScanner as any).generateSecurityReport(results.security)
          : '## 🔒 Security\n' + JSON.stringify(results.security, null, 2);
      report += secReport;
    }

    // Accessibility Section
    if (results.accessibility) {
      report += `\n## ♿ Accessibility Tests\n`;
      for (const test of results.accessibility) {
        const accessReport = 
          typeof (this.accessibilityTester as any).generateAccessibilityReport === 'function'
            ? await (this.accessibilityTester as any).generateAccessibilityReport(test)
            : '### Accessibility Test\n' + JSON.stringify(test, null, 2);
        report += accessReport;
      }
    }

    // Quality Gates Section
    if (results.qualityGates) {
      const qualityReport = 
        typeof (this.codeQualityGates as any).generateQualityReport === 'function'
          ? await (this.codeQualityGates as any).generateQualityReport(results.qualityGates)
          : '## 📊 Quality Gates\n' + JSON.stringify(results.qualityGates, null, 2);
      report += qualityReport;
    }

    // Recommendations Section
    if (summary.recommendations.length > 0) {
      report += `\n## 📋 Recommendations\n`;
      summary.recommendations.forEach((rec: string) => {
        report += `- ${rec}\n`;
      });
    }

    return report;
  }

  private combineSecurityResults(dependencyResult: SecurityScanResult, codeResult: SecurityScanResult): SecurityScanResult {
    return {
      timestamp: new Date().toISOString(),
      totalVulnerabilities: dependencyResult.totalVulnerabilities + codeResult.totalVulnerabilities,
      vulnerabilities: [...dependencyResult.vulnerabilities, ...codeResult.vulnerabilities],
      summary: {
        critical: dependencyResult.summary.critical + codeResult.summary.critical,
        high: dependencyResult.summary.high + codeResult.summary.high,
        medium: dependencyResult.summary.medium + codeResult.summary.medium,
        low: dependencyResult.summary.low + codeResult.summary.low,
      },
      recommendations: [...dependencyResult.recommendations, ...codeResult.recommendations],
      passed: dependencyResult.passed && codeResult.passed,
    };
  }

  private readFileContent(filePath: string): string {
    try {
      const fs = require('fs');
      return fs.readFileSync(filePath, 'utf-8');
    } catch (error) {
      console.warn(`Failed to read file ${filePath}:`, error);
      return '';
    }
  }

  private detectLanguage(filePath: string): string {
    const extension = filePath.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'ts': return 'typescript';
      case 'tsx': return 'typescript';
      case 'js': return 'javascript';
      case 'jsx': return 'javascript';
      case 'py': return 'python';
      case 'java': return 'java';
      case 'css': return 'css';
      case 'scss': return 'scss';
      case 'html': return 'html';
      default: return 'text';
    }
  }

  private createFailureResult(error: any): QAResult {
    return {
      timestamp: new Date().toISOString(),
      overallStatus: 'failed',
      overallScore: 0,
      results: {},
      summary: {
        totalIssues: 1,
        criticalIssues: 1,
        recommendations: [`QA analysis failed: ${error.message}`],
      },
      reports: {
        markdown: `# QA Analysis Failed\n\nError: ${error.message}`,
        json: JSON.stringify({ error: error.message }),
      },
    };
  }

  // Utility methods for specific QA operations
  async runQuickScan(files: string[]): Promise<QAResult> {
    return this.runFullQAAnalysis(files, undefined, {
      aiCodeReview: { enabled: true },
      security: { enabled: true },
      accessibility: { enabled: false },
      qualityGates: { enabled: false },
    });
  }

  async runSecurityOnlyScan(files: string[]): Promise<SecurityScanResult> {
    return this.securityScanner.scanDependencies();
  }

  async runAccessibilityOnlyScan(urls: string[]): Promise<AccessibilityTestResult[]> {
    return this.accessibilityTester.testMultiplePages(urls);
  }

  async runCodeReviewOnly(files: string[]): Promise<CodeReviewResult[]> {
    return this.runCodeReview(files);
  }

  async runQualityGatesOnly(config?: QualityGateConfig): Promise<QualityGateResult> {
    return this.runQualityGates(config);
  }
}

export const qaOrchestrator = new QAOrchestrator();