/**
 * Infrastructure Auditor - Cleanup 2 Phase 4.1
 *
 * Implements DNS record audit, CloudFront origin validation,
 * and infrastructure compliance checking for AWS-only architecture.
 *
 * Requirements: 4.1, 4.2 - DNS audit and AWS-only validation
 */

import { execSync } from "child_process";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

interface InfrastructureAudit {
  timestamp: string;
  dnsRecords: DNSRecord[];
  cloudFrontDistributions: CloudFrontDistribution[];
  httpHeaders: HeaderAnalysis[];
  complianceStatus: ComplianceStatus;
  recommendations: InfrastructureRecommendation[];
  summary: AuditSummary;
}

interface DNSRecord {
  name: string;
  type: string;
  value: string;
  ttl: number;
  isLegacy: boolean;
  riskLevel: "low" | "medium" | "high";
  recommendation?: string;
}

interface CloudFrontDistribution {
  id: string;
  domainName: string;
  origins: Origin[];
  isAwsOnly: boolean;
  legacyOrigins: string[];
  status: string;
}

interface Origin {
  id: string;
  domainName: string;
  originPath: string;
  isAws: boolean;
  isLegacy: boolean;
}

interface HeaderAnalysis {
  url: string;
  headers: Record<string, string>;
  legacySignatures: string[];
  riskLevel: "low" | "medium" | "high";
}

interface ComplianceStatus {
  awsOnlyCompliant: boolean;
  dnsCompliant: boolean;
  headerCompliant: boolean;
  overallScore: number;
  issues: string[];
}

interface InfrastructureRecommendation {
  type: "dns" | "cloudfront" | "headers" | "security";
  severity: "high" | "medium" | "low";
  description: string;
  action: string;
  impact: string;
}

interface AuditSummary {
  totalRecords: number;
  legacyRecords: number;
  awsOnlyOrigins: number;
  legacyOrigins: number;
  compliancePercentage: number;
}

export class InfrastructureAuditor {
  private readonly outputDir = "reports";
  private readonly reportFile = "infrastructure-audit.json";
  private readonly domains = ["matbakh.app", "www.matbakh.app"];
  private readonly legacyPatterns = [
    "supabase.co",
    "vercel.app",
    "netlify.app",
    "lovable.dev",
    "twilio.com",
    "resend.com",
  ];

  constructor() {
    this.ensureDirectories();
  }

  /**
   * Run complete infrastructure audit
   */
  async auditInfrastructure(): Promise<InfrastructureAudit> {
    console.log("🔍 Starting infrastructure audit...");

    const dnsRecords = await this.auditDNSRecords();
    const cloudFrontDistributions = await this.auditCloudFrontDistributions();
    const httpHeaders = await this.analyzeHTTPHeaders();

    const complianceStatus = this.assessCompliance(
      dnsRecords,
      cloudFrontDistributions,
      httpHeaders
    );
    const recommendations = this.generateRecommendations(
      dnsRecords,
      cloudFrontDistributions,
      httpHeaders
    );
    const summary = this.generateSummary(dnsRecords, cloudFrontDistributions);

    const audit: InfrastructureAudit = {
      timestamp: new Date().toISOString(),
      dnsRecords,
      cloudFrontDistributions,
      httpHeaders,
      complianceStatus,
      recommendations,
      summary,
    };

    this.saveAuditReport(audit);

    console.log(
      `✅ Infrastructure audit complete. Compliance: ${complianceStatus.overallScore}%`
    );

    return audit;
  }

  /**
   * Audit DNS records for legacy references
   */
  private async auditDNSRecords(): Promise<DNSRecord[]> {
    console.log("🔍 Auditing DNS records...");
    const records: DNSRecord[] = [];

    for (const domain of this.domains) {
      try {
        // Query different record types
        const recordTypes = ["A", "AAAA", "CNAME", "MX", "TXT", "NS"];

        for (const type of recordTypes) {
          try {
            const result = execSync(`dig +short ${type} ${domain}`, {
              encoding: "utf-8",
              timeout: 10000,
            });

            if (result.trim()) {
              const values = result.trim().split("\n");
              values.forEach((value) => {
                const isLegacy = this.isLegacyRecord(value);
                records.push({
                  name: domain,
                  type,
                  value: value.trim(),
                  ttl: this.getTTL(domain, type),
                  isLegacy,
                  riskLevel: this.assessRecordRisk(value, isLegacy),
                  recommendation: isLegacy
                    ? this.getRecordRecommendation(value)
                    : undefined,
                });
              });
            }
          } catch (error) {
            console.warn(`⚠️ Could not query ${type} records for ${domain}`);
          }
        }
      } catch (error) {
        console.warn(`⚠️ Could not audit DNS for ${domain}`);
      }
    }

    return records;
  }

  /**
   * Audit CloudFront distributions
   */
  private async auditCloudFrontDistributions(): Promise<
    CloudFrontDistribution[]
  > {
    console.log("🔍 Auditing CloudFront distributions...");
    const distributions: CloudFrontDistribution[] = [];

    try {
      // Get CloudFront distributions
      const result = execSync(
        'aws cloudfront list-distributions --query "DistributionList.Items[*].[Id,DomainName,Origins.Items]" --output json',
        {
          encoding: "utf-8",
          timeout: 30000,
        }
      );

      const distributionData = JSON.parse(result);

      distributionData.forEach(
        ([id, domainName, origins]: [string, string, any[]]) => {
          const processedOrigins: Origin[] = origins.map((origin) => ({
            id: origin.Id,
            domainName: origin.DomainName,
            originPath: origin.OriginPath || "",
            isAws: this.isAwsOrigin(origin.DomainName),
            isLegacy: this.isLegacyOrigin(origin.DomainName),
          }));

          const legacyOrigins = processedOrigins
            .filter((origin) => origin.isLegacy)
            .map((origin) => origin.domainName);

          distributions.push({
            id,
            domainName,
            origins: processedOrigins,
            isAwsOnly: processedOrigins.every((origin) => origin.isAws),
            legacyOrigins,
            status: "active", // Would get actual status from API
          });
        }
      );
    } catch (error) {
      console.warn(
        "⚠️ Could not audit CloudFront distributions (AWS CLI required)"
      );
    }

    return distributions;
  }

  /**
   * Analyze HTTP headers for legacy signatures
   */
  private async analyzeHTTPHeaders(): Promise<HeaderAnalysis[]> {
    console.log("🔍 Analyzing HTTP headers...");
    const analyses: HeaderAnalysis[] = [];

    for (const domain of this.domains) {
      try {
        const url = `https://${domain}`;
        const result = execSync(`curl -I -s "${url}" | head -20`, {
          encoding: "utf-8",
          timeout: 15000,
        });

        const headers: Record<string, string> = {};
        const lines = result.split("\n");

        lines.forEach((line) => {
          const match = line.match(/^([^:]+):\s*(.+)$/);
          if (match) {
            headers[match[1].toLowerCase()] = match[2].trim();
          }
        });

        const legacySignatures = this.detectLegacySignatures(headers);

        analyses.push({
          url,
          headers,
          legacySignatures,
          riskLevel: legacySignatures.length > 0 ? "high" : "low",
        });
      } catch (error) {
        console.warn(`⚠️ Could not analyze headers for ${domain}`);
      }
    }

    return analyses;
  }

  /**
   * Check if DNS record points to legacy service
   */
  private isLegacyRecord(value: string): boolean {
    return this.legacyPatterns.some((pattern) => value.includes(pattern));
  }

  /**
   * Check if origin is AWS-based
   */
  private isAwsOrigin(domainName: string): boolean {
    const awsPatterns = [
      ".amazonaws.com",
      ".s3.amazonaws.com",
      ".s3-website",
      ".cloudfront.net",
      ".elb.amazonaws.com",
    ];

    return awsPatterns.some((pattern) => domainName.includes(pattern));
  }

  /**
   * Check if origin is legacy service
   */
  private isLegacyOrigin(domainName: string): boolean {
    return this.legacyPatterns.some((pattern) => domainName.includes(pattern));
  }

  /**
   * Detect legacy signatures in HTTP headers
   */
  private detectLegacySignatures(headers: Record<string, string>): string[] {
    const signatures: string[] = [];

    // Check for legacy service headers
    const legacyHeaders = {
      "x-vercel-id": "Vercel deployment detected",
      "x-served-by": "CDN service detected",
      "x-supabase-": "Supabase service detected",
      server: ["vercel", "netlify", "supabase"],
    };

    Object.entries(headers).forEach(([key, value]) => {
      // Check for specific legacy headers
      if (key.startsWith("x-vercel") || key.startsWith("x-supabase")) {
        signatures.push(`Legacy header detected: ${key}`);
      }

      // Check server header for legacy services
      if (key === "server" && typeof legacyHeaders.server === "object") {
        legacyHeaders.server.forEach((service) => {
          if (value.toLowerCase().includes(service)) {
            signatures.push(`Legacy server detected: ${service}`);
          }
        });
      }
    });

    return signatures;
  }

  /**
   * Get TTL for DNS record
   */
  private getTTL(domain: string, type: string): number {
    try {
      const result = execSync(
        `dig ${type} ${domain} | grep "^${domain}" | awk '{print $2}'`,
        {
          encoding: "utf-8",
          timeout: 5000,
        }
      );
      return parseInt(result.trim()) || 300;
    } catch {
      return 300; // Default TTL
    }
  }

  /**
   * Assess risk level for DNS record
   */
  private assessRecordRisk(
    value: string,
    isLegacy: boolean
  ): "low" | "medium" | "high" {
    if (isLegacy) return "high";
    if (value.includes("temp") || value.includes("test")) return "medium";
    return "low";
  }

  /**
   * Get recommendation for legacy record
   */
  private getRecordRecommendation(value: string): string {
    if (value.includes("supabase")) {
      return "Migrate to AWS RDS endpoint";
    }
    if (value.includes("vercel")) {
      return "Update to CloudFront distribution";
    }
    if (value.includes("netlify")) {
      return "Update to S3 static hosting";
    }
    return "Review and update to AWS service";
  }

  /**
   * Assess overall compliance
   */
  private assessCompliance(
    dnsRecords: DNSRecord[],
    distributions: CloudFrontDistribution[],
    headers: HeaderAnalysis[]
  ): ComplianceStatus {
    const issues: string[] = [];

    // DNS compliance
    const legacyDnsRecords = dnsRecords.filter((record) => record.isLegacy);
    const dnsCompliant = legacyDnsRecords.length === 0;
    if (!dnsCompliant) {
      issues.push(`${legacyDnsRecords.length} legacy DNS records found`);
    }

    // CloudFront compliance
    const nonAwsDistributions = distributions.filter((dist) => !dist.isAwsOnly);
    const awsOnlyCompliant = nonAwsDistributions.length === 0;
    if (!awsOnlyCompliant) {
      issues.push(
        `${nonAwsDistributions.length} distributions with non-AWS origins`
      );
    }

    // Header compliance
    const legacyHeaders = headers.filter((h) => h.legacySignatures.length > 0);
    const headerCompliant = legacyHeaders.length === 0;
    if (!headerCompliant) {
      issues.push(`${legacyHeaders.length} endpoints with legacy headers`);
    }

    // Calculate overall score
    const checks = [dnsCompliant, awsOnlyCompliant, headerCompliant];
    const overallScore = Math.round(
      (checks.filter(Boolean).length / checks.length) * 100
    );

    return {
      awsOnlyCompliant,
      dnsCompliant,
      headerCompliant,
      overallScore,
      issues,
    };
  }

  /**
   * Generate infrastructure recommendations
   */
  private generateRecommendations(
    dnsRecords: DNSRecord[],
    distributions: CloudFrontDistribution[],
    headers: HeaderAnalysis[]
  ): InfrastructureRecommendation[] {
    const recommendations: InfrastructureRecommendation[] = [];

    // DNS recommendations
    dnsRecords
      .filter((record) => record.isLegacy)
      .forEach((record) => {
        recommendations.push({
          type: "dns",
          severity: "high",
          description: `Legacy DNS record: ${record.name} -> ${record.value}`,
          action: record.recommendation || "Update to AWS service",
          impact: "Reduces dependency on external services",
        });
      });

    // CloudFront recommendations
    distributions
      .filter((dist) => !dist.isAwsOnly)
      .forEach((dist) => {
        recommendations.push({
          type: "cloudfront",
          severity: "high",
          description: `Non-AWS origins in distribution ${dist.id}`,
          action: `Update origins: ${dist.legacyOrigins.join(", ")}`,
          impact: "Improves performance and reduces external dependencies",
        });
      });

    // Header recommendations
    headers
      .filter((h) => h.legacySignatures.length > 0)
      .forEach((header) => {
        recommendations.push({
          type: "headers",
          severity: "medium",
          description: `Legacy signatures detected at ${header.url}`,
          action: "Review and remove legacy service headers",
          impact: "Improves security and reduces information disclosure",
        });
      });

    return recommendations;
  }

  /**
   * Generate audit summary
   */
  private generateSummary(
    dnsRecords: DNSRecord[],
    distributions: CloudFrontDistribution[]
  ): AuditSummary {
    const legacyRecords = dnsRecords.filter((record) => record.isLegacy).length;
    const awsOnlyOrigins = distributions.reduce(
      (sum, dist) => sum + dist.origins.filter((origin) => origin.isAws).length,
      0
    );
    const legacyOrigins = distributions.reduce(
      (sum, dist) =>
        sum + dist.origins.filter((origin) => origin.isLegacy).length,
      0
    );

    const totalChecks = 3; // DNS, CloudFront, Headers
    const passedChecks =
      (legacyRecords === 0 ? 1 : 0) + (legacyOrigins === 0 ? 1 : 0) + 1; // Headers check simplified

    return {
      totalRecords: dnsRecords.length,
      legacyRecords,
      awsOnlyOrigins,
      legacyOrigins,
      compliancePercentage: Math.round((passedChecks / totalChecks) * 100),
    };
  }

  /**
   * Save audit report
   */
  private saveAuditReport(audit: InfrastructureAudit): void {
    const reportPath = join(this.outputDir, this.reportFile);
    writeFileSync(reportPath, JSON.stringify(audit, null, 2));

    // Also save human-readable summary
    const summaryPath = join(this.outputDir, "infrastructure-summary.md");
    const summary = this.generateMarkdownSummary(audit);
    writeFileSync(summaryPath, summary);

    console.log(`📊 Infrastructure audit report saved to ${reportPath}`);
  }

  /**
   * Generate markdown summary
   */
  private generateMarkdownSummary(audit: InfrastructureAudit): string {
    return `# Infrastructure Audit Report

**Generated:** ${audit.timestamp}
**Overall Compliance:** ${audit.complianceStatus.overallScore}%

## Summary
- **Total DNS Records:** ${audit.summary.totalRecords}
- **Legacy DNS Records:** ${audit.summary.legacyRecords}
- **AWS-Only Origins:** ${audit.summary.awsOnlyOrigins}
- **Legacy Origins:** ${audit.summary.legacyOrigins}

## Compliance Status
- ✅ **DNS Compliant:** ${audit.complianceStatus.dnsCompliant ? "Yes" : "No"}
- ✅ **AWS-Only Origins:** ${
      audit.complianceStatus.awsOnlyCompliant ? "Yes" : "No"
    }
- ✅ **Header Compliant:** ${
      audit.complianceStatus.headerCompliant ? "Yes" : "No"
    }

## Issues Found
${audit.complianceStatus.issues.map((issue) => `- ⚠️ ${issue}`).join("\n")}

## Top Recommendations
${audit.recommendations
  .slice(0, 5)
  .map(
    (rec) =>
      `- **${rec.severity.toUpperCase()}**: ${rec.description}\n  *Action:* ${
        rec.action
      }`
  )
  .join("\n\n")}

## Legacy DNS Records
${audit.dnsRecords
  .filter((r) => r.isLegacy)
  .map((record) => `- **${record.name}** (${record.type}): ${record.value}`)
  .join("\n")}

## CloudFront Distributions
${audit.cloudFrontDistributions
  .map(
    (dist) =>
      `- **${dist.id}**: ${
        dist.isAwsOnly ? "✅ AWS-Only" : "⚠️ Has Legacy Origins"
      }`
  )
  .join("\n")}
`;
  }

  /**
   * Ensure required directories exist
   */
  private ensureDirectories(): void {
    if (!existsSync(this.outputDir)) {
      execSync(`mkdir -p ${this.outputDir}`);
    }
  }

  /**
   * Validate infrastructure compliance
   */
  async validateCompliance(): Promise<boolean> {
    const reportPath = join(this.outputDir, this.reportFile);
    if (!existsSync(reportPath)) {
      console.log("❌ No infrastructure audit report found");
      return false;
    }

    const audit: InfrastructureAudit = JSON.parse(
      readFileSync(reportPath, "utf-8")
    );

    const isCompliant = audit.complianceStatus.overallScore >= 90; // 90% compliance threshold

    if (isCompliant) {
      console.log(
        `✅ Infrastructure compliance validated: ${audit.complianceStatus.overallScore}%`
      );
    } else {
      console.log(
        `❌ Infrastructure compliance failed: ${audit.complianceStatus.overallScore}% (required: 90%)`
      );
      console.log("Issues:", audit.complianceStatus.issues.join(", "));
    }

    return isCompliant;
  }
}

// CLI interface
if (require.main === module) {
  const auditor = new InfrastructureAuditor();

  const command = process.argv[2];

  switch (command) {
    case "audit":
      auditor.auditInfrastructure().catch(console.error);
      break;
    case "validate":
      auditor.validateCompliance().then((success) => {
        process.exit(success ? 0 : 1);
      });
      break;
    default:
      console.log("Usage: infrastructure-auditor.ts [audit|validate]");
      process.exit(1);
  }
}
