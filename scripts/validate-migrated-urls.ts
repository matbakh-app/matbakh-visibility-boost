#!/usr/bin/env ts-node

/**
 * Data Validation Script for Migrated File URLs
 * 
 * This script validates that migrated file URLs are working correctly:
 * - Checks URL format validity
 * - Verifies S3 object existence (where possible)
 * - Tests CloudFront URL accessibility
 * - Provides fallback handling for missing files
 */

import { createClient } from '@supabase/supabase-js';
import { S3Client, HeadObjectCommand } from '@aws-sdk/client-s3';
// Using Node.js built-in fetch (Node >= 18)
import * as fs from 'fs';
import * as path from 'path';

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://uheksobnyedarrpgxhju.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const AWS_REGION = process.env.AWS_REGION || 'eu-central-1';
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || '';
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || '';
const CLOUDFRONT_DOMAIN = process.env.CLOUDFRONT_DOMAIN || 'd1234567890.cloudfront.net';

interface ValidationResult {
  table: string;
  field: string;
  totalRecords: number;
  validUrls: number;
  invalidUrls: number;
  missingFiles: number;
  accessibleUrls: number;
  errors: string[];
  issues: Array<{
    id: string;
    url: string;
    issue: string;
    severity: 'warning' | 'error';
  }>;
}

class UrlValidator {
  private supabase;
  private s3Client;
  private results: ValidationResult[] = [];

  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    this.s3Client = new S3Client({
      region: AWS_REGION,
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  /**
   * Parse S3 URL to extract bucket and key
   */
  private parseS3Url(url: string): { bucket: string; key: string } | null {
    try {
      if (url.startsWith('s3://')) {
        const urlWithoutProtocol = url.substring(5);
        const firstSlashIndex = urlWithoutProtocol.indexOf('/');
        
        if (firstSlashIndex === -1) return null;
        
        const bucket = urlWithoutProtocol.substring(0, firstSlashIndex);
        const key = urlWithoutProtocol.substring(firstSlashIndex + 1);
        
        return { bucket, key };
      }
      
      // Handle CloudFront URLs
      if (url.includes(CLOUDFRONT_DOMAIN)) {
        const urlObj = new URL(url);
        const key = urlObj.pathname.substring(1); // Remove leading slash
        return { bucket: 'matbakh-files-reports', key };
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if S3 object exists
   */
  private async checkS3Object(bucket: string, key: string): Promise<boolean> {
    try {
      await this.s3Client.send(new HeadObjectCommand({
        Bucket: bucket,
        Key: key,
      }));
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if URL is accessible via HTTP
   */
  private async checkUrlAccessibility(url: string): Promise<boolean> {
    try {
      // Only check CloudFront URLs (public URLs)
      if (!url.includes(CLOUDFRONT_DOMAIN)) {
        return true; // Skip S3 URLs as they require presigned access
      }

      // Use AbortController for timeout
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      try {
        const response = await fetch(url, { 
          method: 'HEAD',
          signal: controller.signal,
        });
        
        return response.ok;
      } finally {
        clearTimeout(timeout);
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Validate URLs in a specific table and field
   */
  private async validateTableField(
    tableName: string, 
    fieldName: string
  ): Promise<ValidationResult> {
    const result: ValidationResult = {
      table: tableName,
      field: fieldName,
      totalRecords: 0,
      validUrls: 0,
      invalidUrls: 0,
      missingFiles: 0,
      accessibleUrls: 0,
      errors: [],
      issues: [],
    };

    try {
      console.log(`\n🔍 Validating ${tableName}.${fieldName}...`);

      // Fetch records with file URLs
      const { data: records, error } = await this.supabase
        .from(tableName)
        .select(`id, ${fieldName}`)
        .not(fieldName, 'is', null);

      if (error) {
        result.errors.push(`Failed to fetch records: ${error.message}`);
        return result;
      }

      if (!records || records.length === 0) {
        console.log(`  ℹ️  No records found with ${fieldName} values`);
        return result;
      }

      result.totalRecords = records.length;
      console.log(`  📊 Validating ${records.length} URLs...`);

      // Process each record
      for (const record of records) {
        const url = record[fieldName];
        
        if (!url || typeof url !== 'string') {
          result.invalidUrls++;
          result.issues.push({
            id: record.id,
            url: url || 'null',
            issue: 'Empty or invalid URL',
            severity: 'error',
          });
          continue;
        }

        // Check URL format
        const parsed = this.parseS3Url(url);
        if (!parsed) {
          result.invalidUrls++;
          result.issues.push({
            id: record.id,
            url,
            issue: 'Invalid URL format (not S3 or CloudFront)',
            severity: 'error',
          });
          continue;
        }

        result.validUrls++;

        // Check if file exists in S3
        const fileExists = await this.checkS3Object(parsed.bucket, parsed.key);
        if (!fileExists) {
          result.missingFiles++;
          result.issues.push({
            id: record.id,
            url,
            issue: `File not found in S3: ${parsed.bucket}/${parsed.key}`,
            severity: 'warning',
          });
        }

        // Check URL accessibility (for public URLs)
        const isAccessible = await this.checkUrlAccessibility(url);
        if (isAccessible) {
          result.accessibleUrls++;
        } else if (url.includes(CLOUDFRONT_DOMAIN)) {
          result.issues.push({
            id: record.id,
            url,
            issue: 'CloudFront URL not accessible',
            severity: 'warning',
          });
        }

        // Progress indicator
        if (result.validUrls % 10 === 0) {
          process.stdout.write('.');
        }
      }

      console.log(`\n  ✅ Completed: ${result.validUrls} valid, ${result.invalidUrls} invalid, ${result.missingFiles} missing files`);

    } catch (error) {
      result.errors.push(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
    }

    return result;
  }

  /**
   * Generate fallback URLs for missing files
   */
  private generateFallbackUrl(originalUrl: string, tableName: string, fieldName: string): string | null {
    // Generate appropriate fallback based on field type
    if (fieldName.includes('avatar')) {
      return '/placeholder-avatar.png';
    }
    
    if (fieldName.includes('logo')) {
      return '/placeholder-logo.png';
    }
    
    if (fieldName.includes('report')) {
      return null; // Reports should be regenerated, not use fallback
    }
    
    return '/placeholder-file.png';
  }

  /**
   * Fix issues found during validation
   */
  private async fixIssues(dryRun = true): Promise<void> {
    console.log(`\n🔧 FIXING ISSUES ${dryRun ? '(DRY RUN)' : '(LIVE)'}`);
    console.log('================');

    let fixedCount = 0;

    for (const result of this.results) {
      for (const issue of result.issues) {
        if (issue.severity === 'error' || issue.issue.includes('not found')) {
          const fallbackUrl = this.generateFallbackUrl(issue.url, result.table, result.field);
          
          if (fallbackUrl) {
            console.log(`  🔧 ${result.table}.${result.field} [${issue.id}]: ${issue.url} → ${fallbackUrl}`);
            
            if (!dryRun) {
              try {
                const { error } = await this.supabase
                  .from(result.table)
                  .update({ [result.field]: fallbackUrl })
                  .eq('id', issue.id);

                if (error) {
                  console.error(`    ❌ Failed to update: ${error.message}`);
                } else {
                  fixedCount++;
                }
              } catch (error) {
                console.error(`    ❌ Update error:`, error);
              }
            } else {
              fixedCount++;
            }
          } else {
            console.log(`  ⚠️  ${result.table}.${result.field} [${issue.id}]: No fallback available for ${issue.url}`);
          }
        }
      }
    }

    console.log(`\n  ✅ ${fixedCount} issues ${dryRun ? 'would be' : 'were'} fixed`);
  }

  /**
   * Run the complete validation
   */
  async validate(fixIssues = false, dryRun = true): Promise<void> {
    console.log(`🔍 Starting URL validation`);
    console.log(`📅 ${new Date().toISOString()}\n`);

    // Define tables and fields to validate (using new S3 fields)
    const validations = [
      { table: 'profiles', field: 'avatar_s3_url' },
      { table: 'business_profiles', field: 'avatar_s3_url' },
      { table: 'business_profiles', field: 'logo_s3_url' },
      { table: 'business_profiles', field: 'document_s3_urls' },
      { table: 'business_partners', field: 'avatar_s3_url' },
      { table: 'business_partners', field: 'logo_s3_url' },
      { table: 'visibility_check_leads', field: 'report_s3_url' },
      { table: 'user_uploads', field: 's3_url' },
      { table: 'business_profiles', field: 'screenshot_s3_urls' },
      { table: 'business_partners', field: 'contract_s3_urls' },
      { table: 'business_partners', field: 'verification_document_s3_urls' },
    ];

    // Run validations
    for (const validation of validations) {
      try {
        const result = await this.validateTableField(validation.table, validation.field);
        this.results.push(result);
      } catch (error) {
        console.error(`❌ Failed to validate ${validation.table}.${validation.field}:`, error);
      }
    }

    // Generate report
    this.generateReport();

    // Fix issues if requested
    if (fixIssues) {
      await this.fixIssues(dryRun);
    }
  }

  /**
   * Generate validation report
   */
  private generateReport(): void {
    console.log('\n📊 VALIDATION REPORT');
    console.log('===================');

    let totalRecords = 0;
    let totalValid = 0;
    let totalInvalid = 0;
    let totalMissing = 0;
    let totalAccessible = 0;
    let allErrors: string[] = [];
    let criticalIssues = 0;
    let warnings = 0;

    this.results.forEach(result => {
      totalRecords += result.totalRecords;
      totalValid += result.validUrls;
      totalInvalid += result.invalidUrls;
      totalMissing += result.missingFiles;
      totalAccessible += result.accessibleUrls;
      allErrors.push(...result.errors);

      const critical = result.issues.filter(i => i.severity === 'error').length;
      const warn = result.issues.filter(i => i.severity === 'warning').length;
      criticalIssues += critical;
      warnings += warn;

      console.log(`\n${result.table}.${result.field}:`);
      console.log(`  📊 Total: ${result.totalRecords}`);
      console.log(`  ✅ Valid URLs: ${result.validUrls}`);
      console.log(`  ❌ Invalid URLs: ${result.invalidUrls}`);
      console.log(`  📁 Missing Files: ${result.missingFiles}`);
      console.log(`  🌐 Accessible: ${result.accessibleUrls}`);
      console.log(`  🚨 Critical Issues: ${critical}`);
      console.log(`  ⚠️  Warnings: ${warn}`);
    });

    console.log('\n📈 SUMMARY:');
    console.log(`  📊 Total Records: ${totalRecords}`);
    console.log(`  ✅ Valid URLs: ${totalValid}`);
    console.log(`  ❌ Invalid URLs: ${totalInvalid}`);
    console.log(`  📁 Missing Files: ${totalMissing}`);
    console.log(`  🌐 Accessible URLs: ${totalAccessible}`);
    console.log(`  🚨 Critical Issues: ${criticalIssues}`);
    console.log(`  ⚠️  Warnings: ${warnings}`);

    // Calculate health score
    const healthScore = totalRecords > 0 ? Math.round((totalValid - criticalIssues) / totalRecords * 100) : 100;
    console.log(`  🏥 Health Score: ${healthScore}%`);

    if (allErrors.length > 0) {
      console.log('\n❌ ERRORS:');
      allErrors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }

    // Save detailed report
    const reportPath = path.join(__dirname, `../validation-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: {
        totalRecords,
        totalValid,
        totalInvalid,
        totalMissing,
        totalAccessible,
        criticalIssues,
        warnings,
        healthScore,
      },
      results: this.results,
      errors: allErrors,
    }, null, 2));

    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const fixIssues = args.includes('--fix');
  const dryRun = !args.includes('--live');

  if (args.includes('--help')) {
    console.log(`
URL Validation Script

Usage:
  npm run validate-urls [options]

Options:
  --fix         Attempt to fix issues by setting fallback URLs
  --live        Apply fixes (default is dry-run)
  --help        Show this help message

Environment Variables:
  SUPABASE_URL                 Supabase project URL
  SUPABASE_SERVICE_ROLE_KEY    Supabase service role key
  AWS_REGION                   AWS region (default: eu-central-1)
  AWS_ACCESS_KEY_ID            AWS access key ID
  AWS_SECRET_ACCESS_KEY        AWS secret access key
  CLOUDFRONT_DOMAIN            CloudFront domain for reports

Examples:
  npm run validate-urls                    # Validate URLs only
  npm run validate-urls --fix             # Validate and fix issues (dry-run)
  npm run validate-urls --fix --live      # Validate and apply fixes
`);
    process.exit(0);
  }

  // Validate environment variables
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
    process.exit(1);
  }

  if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
    console.error('❌ AWS credentials (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY) are required');
    process.exit(1);
  }

  try {
    const validator = new UrlValidator();
    await validator.validate(fixIssues, dryRun);

    console.log('\n🎉 Validation completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Validation failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { UrlValidator };