/**
 * Security Vulnerability Scanner
 * Integrates with Snyk and provides automated security scanning
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

export interface SecurityVulnerability {
  id: string;
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  package: string;
  version: string;
  vulnerableVersions: string;
  patchedVersions?: string;
  description: string;
  references: string[];
  cwe?: string[];
  cvss?: {
    score: number;
    vector: string;
  };
}

export interface SecurityScanResult {
  timestamp: string;
  totalVulnerabilities: number;
  vulnerabilities: SecurityVulnerability[];
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  recommendations: string[];
  passed: boolean;
}

export interface SecurityPolicy {
  allowedSeverities: Array<'low' | 'medium' | 'high' | 'critical'>;
  maxVulnerabilities: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  excludePackages?: string[];
  failOnNewVulnerabilities?: boolean;
}

export class SecurityScanner {
  private defaultPolicy: SecurityPolicy = {
    allowedSeverities: ['low', 'medium'],
    maxVulnerabilities: {
      critical: 0,
      high: 0,
      medium: 5,
      low: 10,
    },
    excludePackages: [],
    failOnNewVulnerabilities: true,
  };

  async scanDependencies(policy?: SecurityPolicy): Promise<SecurityScanResult> {
    const activePolicy = { ...this.defaultPolicy, ...policy };
    
    try {
      // Run npm audit first
      const npmAuditResult = await this.runNpmAudit();
      
      // Try Snyk if available
      let snykResult: SecurityScanResult | null = null;
      try {
        snykResult = await this.runSnykScan();
      } catch (error) {
        console.warn('Snyk scan failed, using npm audit only:', error);
      }

      // Combine results
      const combinedResult = this.combineResults(npmAuditResult, snykResult);
      
      // Apply policy
      combinedResult.passed = this.evaluatePolicy(combinedResult, activePolicy);
      combinedResult.recommendations = this.generateRecommendations(combinedResult, activePolicy);

      return combinedResult;
    } catch (error) {
      console.error('Security scan failed:', error);
      return this.createFailureResult(error);
    }
  }

  async scanCode(filePaths: string[]): Promise<SecurityScanResult> {
    const vulnerabilities: SecurityVulnerability[] = [];
    
    for (const filePath of filePaths) {
      try {
        const content = readFileSync(filePath, 'utf-8');
        const fileVulns = await this.scanFileContent(content, filePath);
        vulnerabilities.push(...fileVulns);
      } catch (error) {
        console.error(`Failed to scan ${filePath}:`, error);
      }
    }

    return {
      timestamp: new Date().toISOString(),
      totalVulnerabilities: vulnerabilities.length,
      vulnerabilities,
      summary: this.calculateSummary(vulnerabilities),
      recommendations: this.generateCodeRecommendations(vulnerabilities),
      passed: vulnerabilities.filter(v => ['critical', 'high'].includes(v.severity)).length === 0,
    };
  }

  private async runNpmAudit(): Promise<SecurityScanResult> {
    try {
      const auditOutput = execSync('npm audit --json', { 
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      const auditData = JSON.parse(auditOutput);
      return this.parseNpmAuditResult(auditData);
    } catch (error: any) {
      // npm audit returns non-zero exit code when vulnerabilities found
      if (error.stdout) {
        try {
          const auditData = JSON.parse(error.stdout);
          return this.parseNpmAuditResult(auditData);
        } catch (parseError) {
          console.error('Failed to parse npm audit output:', parseError);
        }
      }
      throw error;
    }
  }

  private async runSnykScan(): Promise<SecurityScanResult> {
    try {
      // Check if Snyk is available
      execSync('snyk --version', { stdio: 'ignore' });
      
      const snykOutput = execSync('snyk test --json', { 
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      const snykData = JSON.parse(snykOutput);
      return this.parseSnykResult(snykData);
    } catch (error: any) {
      if (error.stdout) {
        try {
          const snykData = JSON.parse(error.stdout);
          return this.parseSnykResult(snykData);
        } catch (parseError) {
          console.error('Failed to parse Snyk output:', parseError);
        }
      }
      throw error;
    }
  }

  private parseNpmAuditResult(auditData: any): SecurityScanResult {
    const vulnerabilities: SecurityVulnerability[] = [];
    
    if (auditData.vulnerabilities) {
      Object.entries(auditData.vulnerabilities).forEach(([packageName, vulnData]: [string, any]) => {
        vulnData.via?.forEach((via: any) => {
          if (typeof via === 'object' && via.title) {
            vulnerabilities.push({
              id: via.cwe || `npm-${packageName}-${Date.now()}`,
              title: via.title,
              severity: this.mapNpmSeverity(via.severity),
              package: packageName,
              version: vulnData.fixAvailable?.version || 'unknown',
              vulnerableVersions: via.range || 'unknown',
              patchedVersions: vulnData.fixAvailable?.version,
              description: via.title,
              references: via.url ? [via.url] : [],
              cwe: via.cwe ? [via.cwe] : undefined,
            });
          }
        });
      });
    }

    return {
      timestamp: new Date().toISOString(),
      totalVulnerabilities: vulnerabilities.length,
      vulnerabilities,
      summary: this.calculateSummary(vulnerabilities),
      recommendations: [],
      passed: false, // Will be evaluated by policy
    };
  }

  private parseSnykResult(snykData: any): SecurityScanResult {
    const vulnerabilities: SecurityVulnerability[] = [];
    
    if (snykData.vulnerabilities) {
      snykData.vulnerabilities.forEach((vuln: any) => {
        vulnerabilities.push({
          id: vuln.id,
          title: vuln.title,
          severity: vuln.severity,
          package: vuln.packageName,
          version: vuln.version,
          vulnerableVersions: vuln.semver?.vulnerable?.join(', ') || 'unknown',
          patchedVersions: vuln.semver?.unaffected?.join(', '),
          description: vuln.description,
          references: vuln.references || [],
          cwe: vuln.identifiers?.CWE,
          cvss: vuln.cvssScore ? {
            score: vuln.cvssScore,
            vector: vuln.CVSSv3,
          } : undefined,
        });
      });
    }

    return {
      timestamp: new Date().toISOString(),
      totalVulnerabilities: vulnerabilities.length,
      vulnerabilities,
      summary: this.calculateSummary(vulnerabilities),
      recommendations: [],
      passed: false, // Will be evaluated by policy
    };
  }

  private async scanFileContent(content: string, filePath: string): Promise<SecurityVulnerability[]> {
    const vulnerabilities: SecurityVulnerability[] = [];
    
    // Static analysis patterns for common security issues
    const securityPatterns = [
      {
        pattern: /eval\s*\(/g,
        severity: 'high' as const,
        title: 'Use of eval() function',
        description: 'eval() can execute arbitrary code and is a security risk',
      },
      {
        pattern: /innerHTML\s*=/g,
        severity: 'medium' as const,
        title: 'Potential XSS via innerHTML',
        description: 'Setting innerHTML with user data can lead to XSS attacks',
      },
      {
        pattern: /document\.write\s*\(/g,
        severity: 'medium' as const,
        title: 'Use of document.write',
        description: 'document.write can be exploited for XSS attacks',
      },
      {
        pattern: /dangerouslySetInnerHTML/g,
        severity: 'medium' as const,
        title: 'Dangerous HTML injection',
        description: 'dangerouslySetInnerHTML bypasses React\'s XSS protection',
      },
      {
        pattern: /localStorage\.setItem\([^,]+,\s*[^)]*password[^)]*\)/gi,
        severity: 'high' as const,
        title: 'Password stored in localStorage',
        description: 'Storing passwords in localStorage is insecure',
      },
    ];

    const lines = content.split('\n');
    
    securityPatterns.forEach(({ pattern, severity, title, description }) => {
      lines.forEach((line, lineIndex) => {
        const matches = line.matchAll(pattern);
        for (const match of matches) {
          vulnerabilities.push({
            id: `static-${filePath}-${lineIndex}-${match.index}`,
            title,
            severity,
            package: filePath,
            version: 'current',
            vulnerableVersions: 'current',
            description: `${description} (Line ${lineIndex + 1})`,
            references: [],
          });
        }
      });
    });

    return vulnerabilities;
  }

  private combineResults(npmResult: SecurityScanResult, snykResult: SecurityScanResult | null): SecurityScanResult {
    if (!snykResult) {
      return npmResult;
    }

    // Deduplicate vulnerabilities by package and title
    const allVulns = [...npmResult.vulnerabilities, ...snykResult.vulnerabilities];
    const uniqueVulns = allVulns.filter((vuln, index, arr) => 
      arr.findIndex(v => v.package === vuln.package && v.title === vuln.title) === index
    );

    return {
      timestamp: new Date().toISOString(),
      totalVulnerabilities: uniqueVulns.length,
      vulnerabilities: uniqueVulns,
      summary: this.calculateSummary(uniqueVulns),
      recommendations: [],
      passed: false,
    };
  }

  private calculateSummary(vulnerabilities: SecurityVulnerability[]) {
    return {
      critical: vulnerabilities.filter(v => v.severity === 'critical').length,
      high: vulnerabilities.filter(v => v.severity === 'high').length,
      medium: vulnerabilities.filter(v => v.severity === 'medium').length,
      low: vulnerabilities.filter(v => v.severity === 'low').length,
    };
  }

  private evaluatePolicy(result: SecurityScanResult, policy: SecurityPolicy): boolean {
    const { summary } = result;
    const { maxVulnerabilities } = policy;

    return (
      summary.critical <= maxVulnerabilities.critical &&
      summary.high <= maxVulnerabilities.high &&
      summary.medium <= maxVulnerabilities.medium &&
      summary.low <= maxVulnerabilities.low
    );
  }

  private generateRecommendations(result: SecurityScanResult, policy: SecurityPolicy): string[] {
    const recommendations: string[] = [];
    const { summary } = result;

    if (summary.critical > 0) {
      recommendations.push(`🚨 ${summary.critical} critical vulnerabilities found - immediate action required`);
    }
    
    if (summary.high > 0) {
      recommendations.push(`⚠️ ${summary.high} high-severity vulnerabilities found - update dependencies`);
    }

    if (summary.medium > policy.maxVulnerabilities.medium) {
      recommendations.push(`📋 ${summary.medium} medium-severity vulnerabilities exceed policy limit`);
    }

    if (result.vulnerabilities.length > 0) {
      recommendations.push('Run `npm audit fix` to automatically fix vulnerabilities');
      recommendations.push('Consider using `npm ci` instead of `npm install` in production');
      recommendations.push('Regularly update dependencies to latest secure versions');
    }

    return recommendations;
  }

  private generateCodeRecommendations(vulnerabilities: SecurityVulnerability[]): string[] {
    const recommendations: string[] = [];
    
    if (vulnerabilities.some(v => v.title.includes('eval'))) {
      recommendations.push('Replace eval() with safer alternatives like JSON.parse()');
    }
    
    if (vulnerabilities.some(v => v.title.includes('innerHTML'))) {
      recommendations.push('Use textContent or sanitize HTML with DOMPurify');
    }
    
    if (vulnerabilities.some(v => v.title.includes('password'))) {
      recommendations.push('Never store passwords in localStorage - use secure HTTP-only cookies');
    }

    return recommendations;
  }

  private mapNpmSeverity(npmSeverity: string): 'low' | 'medium' | 'high' | 'critical' {
    switch (npmSeverity?.toLowerCase()) {
      case 'critical': return 'critical';
      case 'high': return 'high';
      case 'moderate': return 'medium';
      case 'low': return 'low';
      default: return 'medium';
    }
  }

  private createFailureResult(error: any): SecurityScanResult {
    return {
      timestamp: new Date().toISOString(),
      totalVulnerabilities: 0,
      vulnerabilities: [],
      summary: { critical: 0, high: 0, medium: 0, low: 0 },
      recommendations: [`Security scan failed: ${error.message}`],
      passed: false,
    };
  }

  async generateSecurityReport(result: SecurityScanResult): Promise<string> {
    const report = `
# Security Scan Report

**Scan Date:** ${result.timestamp}
**Total Vulnerabilities:** ${result.totalVulnerabilities}
**Status:** ${result.passed ? '✅ PASSED' : '❌ FAILED'}

## Summary
- 🔴 Critical: ${result.summary.critical}
- 🟠 High: ${result.summary.high}
- 🟡 Medium: ${result.summary.medium}
- 🟢 Low: ${result.summary.low}

## Recommendations
${result.recommendations.map(rec => `- ${rec}`).join('\n')}

## Vulnerabilities
${result.vulnerabilities.map(vuln => `
### ${vuln.title}
- **Package:** ${vuln.package}
- **Severity:** ${vuln.severity.toUpperCase()}
- **Description:** ${vuln.description}
- **Vulnerable Versions:** ${vuln.vulnerableVersions}
${vuln.patchedVersions ? `- **Patched Versions:** ${vuln.patchedVersions}` : ''}
${vuln.references.length > 0 ? `- **References:** ${vuln.references.join(', ')}` : ''}
`).join('\n')}
`;

    return report;
  }
}

export const securityScanner = new SecurityScanner();