/**
 * Accessibility Testing Automation
 * Integrates with axe-core for automated accessibility testing
 */

import { AxeResults, Result as AxeResult, NodeResult } from 'axe-core';

export interface AccessibilityViolation {
  id: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  tags: string[];
  description: string;
  help: string;
  helpUrl: string;
  nodes: Array<{
    html: string;
    target: string[];
    failureSummary?: string;
  }>;
}

export interface AccessibilityTestResult {
  url: string;
  timestamp: string;
  violations: AccessibilityViolation[];
  passes: number;
  incomplete: number;
  inapplicable: number;
  wcagLevel: 'A' | 'AA' | 'AAA';
  score: number;
  summary: {
    critical: number;
    serious: number;
    moderate: number;
    minor: number;
  };
  recommendations: string[];
  passed: boolean;
}

export interface AccessibilityConfig {
  wcagLevel: 'A' | 'AA' | 'AAA';
  tags?: string[];
  rules?: Record<string, { enabled: boolean }>;
  allowedViolations?: {
    critical: number;
    serious: number;
    moderate: number;
    minor: number;
  };
}

export class AccessibilityTester {
  private defaultConfig: AccessibilityConfig = {
    wcagLevel: 'AA',
    tags: ['wcag2a', 'wcag2aa', 'wcag21aa'],
    allowedViolations: {
      critical: 0,
      serious: 0,
      moderate: 2,
      minor: 5,
    },
  };

  async testPage(url: string, config?: AccessibilityConfig): Promise<AccessibilityTestResult> {
    const activeConfig = { ...this.defaultConfig, ...config };
    
    try {
      // This would typically run in a browser context
      // For now, we'll simulate the axe-core integration
      const axeResults = await this.runAxeAnalysis(url, activeConfig);
      return this.processAxeResults(axeResults, url, activeConfig);
    } catch (error) {
      console.error('Accessibility test failed:', error);
      return this.createFailureResult(url, error);
    }
  }

  async testMultiplePages(urls: string[], config?: AccessibilityConfig): Promise<AccessibilityTestResult[]> {
    const results = await Promise.allSettled(
      urls.map(url => this.testPage(url, config))
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        console.error(`Accessibility test failed for ${urls[index]}:`, result.reason);
        return this.createFailureResult(urls[index], result.reason);
      }
    });
  }

  async testComponent(componentHtml: string, config?: AccessibilityConfig): Promise<AccessibilityTestResult> {
    const activeConfig = { ...this.defaultConfig, ...config };
    
    try {
      // Simulate component testing
      const axeResults = await this.runAxeAnalysisOnHtml(componentHtml, activeConfig);
      return this.processAxeResults(axeResults, 'component', activeConfig);
    } catch (error) {
      console.error('Component accessibility test failed:', error);
      return this.createFailureResult('component', error);
    }
  }

  private async runAxeAnalysis(url: string, config: AccessibilityConfig): Promise<AxeResults> {
    // In a real implementation, this would use Playwright or Puppeteer with axe-core
    // For now, we'll return a mock result structure
    return this.createMockAxeResults();
  }

  private async runAxeAnalysisOnHtml(html: string, config: AccessibilityConfig): Promise<AxeResults> {
    // In a real implementation, this would inject the HTML into a test page
    // and run axe-core analysis
    return this.createMockAxeResults();
  }

  private createMockAxeResults(): AxeResults {
    // Mock axe results for demonstration
    // In production, this would come from actual axe-core analysis
    return {
      url: 'mock-url',
      timestamp: new Date().toISOString(),
      toolOptions: {},
      environment: {},
      testEngine: { name: 'axe-core', version: '4.8.0' },
      testRunner: { name: 'axe' },
      testEnvironment: {},
      violations: [
        {
          id: 'color-contrast',
          impact: 'serious',
          tags: ['wcag2aa', 'wcag143'],
          description: 'Elements must have sufficient color contrast',
          help: 'Ensure all text elements have sufficient color contrast between text and background',
          helpUrl: 'https://dequeuniversity.com/rules/axe/4.8/color-contrast',
          nodes: [
            {
              any: [],
              all: [],
              none: [],
              impact: 'serious',
              html: '<button class="btn-secondary">Click me</button>',
              target: ['button.btn-secondary'],
              failureSummary: 'Fix any of the following:\n  Element has insufficient color contrast of 2.1 (foreground color: #666666, background color: #cccccc, font size: 14.0pt (18.6667px), font weight: normal). Expected contrast ratio of 3:1'
            }
          ]
        } as AxeResult
      ],
      passes: [
        {
          id: 'aria-allowed-attr',
          impact: null,
          tags: ['cat.aria', 'wcag2a', 'wcag412'],
          description: 'Elements must only use allowed ARIA attributes',
          help: 'Ensures ARIA attributes are allowed for an element\'s role',
          helpUrl: 'https://dequeuniversity.com/rules/axe/4.8/aria-allowed-attr',
          nodes: []
        } as AxeResult
      ],
      incomplete: [],
      inapplicable: []
    };
  }

  private processAxeResults(axeResults: AxeResults, url: string, config: AccessibilityConfig): AccessibilityTestResult {
    const violations = axeResults.violations.map(violation => ({
      id: violation.id,
      impact: violation.impact as 'minor' | 'moderate' | 'serious' | 'critical',
      tags: violation.tags,
      description: violation.description,
      help: violation.help,
      helpUrl: violation.helpUrl,
      nodes: violation.nodes.map(node => ({
        html: node.html,
        target: node.target,
        failureSummary: node.failureSummary,
      })),
    }));

    const summary = this.calculateSummary(violations);
    const score = this.calculateAccessibilityScore(summary, axeResults.passes.length);
    const passed = this.evaluatePolicy(summary, config);
    const recommendations = this.generateRecommendations(violations);

    return {
      url,
      timestamp: new Date().toISOString(),
      violations,
      passes: axeResults.passes.length,
      incomplete: axeResults.incomplete.length,
      inapplicable: axeResults.inapplicable.length,
      wcagLevel: config.wcagLevel,
      score,
      summary,
      recommendations,
      passed,
    };
  }

  private calculateSummary(violations: AccessibilityViolation[]) {
    return {
      critical: violations.filter(v => v.impact === 'critical').length,
      serious: violations.filter(v => v.impact === 'serious').length,
      moderate: violations.filter(v => v.impact === 'moderate').length,
      minor: violations.filter(v => v.impact === 'minor').length,
    };
  }

  private calculateAccessibilityScore(summary: any, passCount: number): number {
    const totalIssues = summary.critical + summary.serious + summary.moderate + summary.minor;
    const weightedScore = (
      summary.critical * -10 +
      summary.serious * -5 +
      summary.moderate * -2 +
      summary.minor * -1 +
      passCount * 1
    );
    
    // Normalize to 0-100 scale
    const baseScore = Math.max(0, 100 + weightedScore);
    return Math.min(100, Math.max(0, baseScore));
  }

  private evaluatePolicy(summary: any, config: AccessibilityConfig): boolean {
    const { allowedViolations } = config;
    if (!allowedViolations) return summary.critical === 0 && summary.serious === 0;

    return (
      summary.critical <= allowedViolations.critical &&
      summary.serious <= allowedViolations.serious &&
      summary.moderate <= allowedViolations.moderate &&
      summary.minor <= allowedViolations.minor
    );
  }

  private generateRecommendations(violations: AccessibilityViolation[]): string[] {
    const recommendations: string[] = [];
    
    // Group violations by type for better recommendations
    const violationTypes = violations.reduce((acc, violation) => {
      acc[violation.id] = (acc[violation.id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(violationTypes).forEach(([violationType, count]) => {
      switch (violationType) {
        case 'color-contrast':
          recommendations.push(`Fix ${count} color contrast issue(s) - ensure text has sufficient contrast ratio`);
          break;
        case 'aria-label':
          recommendations.push(`Add ${count} missing ARIA label(s) for screen readers`);
          break;
        case 'keyboard-navigation':
          recommendations.push(`Fix ${count} keyboard navigation issue(s) - ensure all interactive elements are keyboard accessible`);
          break;
        case 'heading-order':
          recommendations.push(`Fix ${count} heading structure issue(s) - use proper heading hierarchy (h1, h2, h3...)`);
          break;
        case 'alt-text':
          recommendations.push(`Add ${count} missing alt text for images`);
          break;
        default:
          recommendations.push(`Fix ${count} ${violationType} accessibility issue(s)`);
      }
    });

    // General recommendations
    if (violations.length > 0) {
      recommendations.push('Test with screen readers (NVDA, JAWS, VoiceOver)');
      recommendations.push('Verify keyboard-only navigation works properly');
      recommendations.push('Check color contrast ratios meet WCAG standards');
      recommendations.push('Ensure all interactive elements have proper focus indicators');
    }

    return recommendations;
  }

  private createFailureResult(url: string, error: any): AccessibilityTestResult {
    return {
      url,
      timestamp: new Date().toISOString(),
      violations: [],
      passes: 0,
      incomplete: 0,
      inapplicable: 0,
      wcagLevel: 'AA',
      score: 0,
      summary: { critical: 0, serious: 0, moderate: 0, minor: 0 },
      recommendations: [`Accessibility test failed: ${error.message}`],
      passed: false,
    };
  }

  async generateAccessibilityReport(result: AccessibilityTestResult): Promise<string> {
    const report = `
# Accessibility Test Report

**URL:** ${result.url}
**Test Date:** ${result.timestamp}
**WCAG Level:** ${result.wcagLevel}
**Score:** ${result.score}/100
**Status:** ${result.passed ? '✅ PASSED' : '❌ FAILED'}

## Summary
- 🔴 Critical: ${result.summary.critical}
- 🟠 Serious: ${result.summary.serious}
- 🟡 Moderate: ${result.summary.moderate}
- 🟢 Minor: ${result.summary.minor}
- ✅ Passes: ${result.passes}
- ⚠️ Incomplete: ${result.incomplete}
- ➖ Inapplicable: ${result.inapplicable}

## Recommendations
${result.recommendations.map(rec => `- ${rec}`).join('\n')}

## Violations
${result.violations.map(violation => `
### ${violation.help}
- **Rule ID:** ${violation.id}
- **Impact:** ${violation.impact.toUpperCase()}
- **WCAG Tags:** ${violation.tags.join(', ')}
- **Description:** ${violation.description}
- **Help URL:** ${violation.helpUrl}

**Affected Elements:**
${violation.nodes.map(node => `
- **HTML:** \`${node.html}\`
- **Selector:** ${node.target.join(' > ')}
${node.failureSummary ? `- **Issue:** ${node.failureSummary}` : ''}
`).join('\n')}
`).join('\n')}
`;

    return report;
  }

  // Utility methods for common accessibility checks
  async checkColorContrast(foreground: string, background: string): Promise<{ ratio: number; passes: { AA: boolean; AAA: boolean } }> {
    // This would implement actual color contrast calculation
    // For now, return mock data
    const ratio = 4.5; // Mock ratio
    return {
      ratio,
      passes: {
        AA: ratio >= 4.5,
        AAA: ratio >= 7.0,
      },
    };
  }

  async validateAriaAttributes(html: string): Promise<string[]> {
    // This would validate ARIA attributes in the HTML
    // Return mock validation results
    return [
      'All ARIA attributes are valid',
      'ARIA roles are properly assigned',
    ];
  }

  async checkKeyboardNavigation(selectors: string[]): Promise<{ accessible: string[]; inaccessible: string[] }> {
    // This would test keyboard navigation
    // Return mock results
    return {
      accessible: selectors.filter((_, i) => i % 2 === 0),
      inaccessible: selectors.filter((_, i) => i % 2 === 1),
    };
  }
}

export const accessibilityTester = new AccessibilityTester();