#!/usr/bin/env ts-node

/**
 * File URL Migration Script - Migrate existing file references to S3 URLs
 * 
 * This script migrates existing file references from Supabase storage URLs to S3 URLs.
 * It handles:
 * - Avatar URLs in user profiles
 * - Logo URLs in business profiles  
 * - Report URLs in visibility check leads
 * - Any other file references that need migration
 */

import { createClient } from '@supabase/supabase-js';
import { S3Client, HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://uheksobnyedarrpgxhju.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const AWS_REGION = process.env.AWS_REGION || 'eu-central-1';
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || '';
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || '';
const CLOUDFRONT_DOMAIN = process.env.CLOUDFRONT_DOMAIN;
const REPORTS_STRATEGY = process.env.REPORTS_STRATEGY || 'regenerate'; // 'copy' or 'regenerate'

if (!CLOUDFRONT_DOMAIN) {
  throw new Error('CLOUDFRONT_DOMAIN environment variable is required');
}

// S3 bucket mapping
const BUCKET_MAPPING = {
  'avatars': 'matbakh-files-profile',
  'logos': 'matbakh-files-profile', 
  'reports': 'matbakh-files-reports',
  'uploads': 'matbakh-files-uploads',
} as const;

interface MigrationResult {
  table: string;
  field: string;
  totalRecords: number;
  migratedRecords: number;
  skippedRecords: number;
  errorRecords: number;
  errors: string[];
  bytesCopied: number;
  contentTypes: Record<string, number>;
  copyFailures: number;
}

interface FileReference {
  id: string;
  oldUrl: string;
  newUrl?: string;
  bucket?: string;
  key?: string;
}

class FileUrlMigrator {
  private supabase;
  private s3Client;
  private results: MigrationResult[] = [];
  private dryRun: boolean;

  constructor(dryRun = false) {
    this.dryRun = dryRun;
    
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
   * Parse Supabase storage URL to extract bucket and file path
   */
  private parseSupabaseUrl(url: string): { bucket: string; filePath: string } | null {
    try {
      // Handle different Supabase storage URL formats:
      // https://uheksobnyedarrpgxhju.supabase.co/storage/v1/object/public/bucket/path
      // https://uheksobnyedarrpgxhju.supabase.co/storage/v1/object/sign/bucket/path?token=...
      
      const urlObj = new URL(url);
      
      if (urlObj.hostname.includes('supabase.co') && urlObj.pathname.includes('/storage/v1/object/')) {
        const pathParts = urlObj.pathname.split('/');
        const objectIndex = pathParts.indexOf('object');
        
        if (objectIndex >= 0 && pathParts.length > objectIndex + 3) {
          const bucket = pathParts[objectIndex + 2]; // Skip 'public' or 'sign'
          const filePath = pathParts.slice(objectIndex + 3).join('/');
          return { bucket, filePath };
        }
      }
      
      return null;
    } catch (error) {
      console.warn(`Failed to parse URL: ${url}`, error);
      return null;
    }
  }

  /**
   * Generate S3 URL based on file type and path
   */
  private generateS3Url(bucket: string, filePath: string): string {
    // For reports bucket, use CloudFront URL
    if (bucket === 'matbakh-files-reports') {
      return `https://${CLOUDFRONT_DOMAIN}/${filePath}`;
    }
    
    // For other buckets, use direct S3 URL (will be served via presigned URLs)
    return `s3://${bucket}/${filePath}`;
  }

  /**
   * Check if file exists in S3 (for validation)
   */
  private async fileExistsInS3(bucket: string, key: string): Promise<boolean> {
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
   * Copy file from Supabase Storage to S3
   */
  private async copyFromSupabaseToS3(
    supaBucket: string,
    supaPath: string,
    s3Bucket: string,
    s3Key: string,
  ): Promise<{ contentType?: string; size?: number }> {
    // 1) Generate signed URL for download (works for private buckets too)
    const { data: signed, error } = await this.supabase.storage
      .from(supaBucket)
      .createSignedUrl(supaPath, 60); // 60 seconds

    if (error || !signed?.signedUrl) {
      throw new Error(`Signed URL error for ${supaBucket}/${supaPath}: ${error?.message}`);
    }

    // 2) Download content with abort controller
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

    try {
      const response = await fetch(signed.signedUrl, { 
        signal: controller.signal 
      });

      if (!response.ok || !response.body) {
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
      }

      // 3) Upload to S3 with streaming
      const contentType = response.headers.get('content-type') || undefined;
      const contentLength = response.headers.get('content-length');

      await this.s3Client.send(new PutObjectCommand({
        Bucket: s3Bucket,
        Key: s3Key,
        Body: response.body as any,
        ContentType: contentType,
        Metadata: {
          'migrated-from': 'supabase',
          'original-bucket': supaBucket,
          'original-path': supaPath,
          'migrated-at': new Date().toISOString(),
        },
      }));

      return { 
        contentType, 
        size: contentLength ? Number(contentLength) : undefined 
      };

    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Process a single record for migration
   */
  private async processRecord(
    record: any, 
    tableName: string, 
    fieldName: string, 
    result: MigrationResult
  ): Promise<void> {
    const oldValue = record[fieldName];
    
    // Handle array fields (jsonb arrays)
    if (Array.isArray(oldValue)) {
      await this.processArrayField(record, tableName, fieldName, oldValue, result);
      return;
    }

    // Handle single URL fields
    if (!oldValue || typeof oldValue !== 'string') {
      result.skippedRecords++;
      return;
    }

    // Skip if already migrated
    if (oldValue.includes('s3://') || oldValue.includes(CLOUDFRONT_DOMAIN!) || oldValue.includes('amazonaws.com')) {
      result.skippedRecords++;
      return;
    }

    // Parse Supabase URL
    const parsed = this.parseSupabaseUrl(oldValue);
    if (!parsed) {
      result.errors.push(`Failed to parse URL for record ${record.id}: ${oldValue}`);
      result.errorRecords++;
      return;
    }

    // Skip reports if strategy is regenerate
    if (REPORTS_STRATEGY === 'regenerate' && fieldName.includes('report')) {
      console.log(`  ⏭️  Skipping report ${record.id} (regenerate strategy)`);
      result.skippedRecords++;
      return;
    }

    try {
      // Map to S3 bucket
      const s3Bucket = BUCKET_MAPPING[parsed.bucket as keyof typeof BUCKET_MAPPING] || 'matbakh-files-uploads';
      
      // Copy content from Supabase to S3
      let copyResult: { contentType?: string; size?: number } | null = null;
      if (!this.dryRun) {
        try {
          copyResult = await this.copyFromSupabaseToS3(
            parsed.bucket,
            parsed.filePath,
            s3Bucket,
            parsed.filePath
          );
          
          result.bytesCopied += copyResult.size || 0;
          if (copyResult.contentType) {
            result.contentTypes[copyResult.contentType] = (result.contentTypes[copyResult.contentType] || 0) + 1;
          }
        } catch (copyError) {
          result.copyFailures++;
          result.errors.push(`Failed to copy file for record ${record.id}: ${copyError instanceof Error ? copyError.message : String(copyError)}`);
          result.errorRecords++;
          return;
        }
      }

      // Generate new S3 URL
      const newUrl = this.generateS3Url(s3Bucket, parsed.filePath);
      console.log(`  🔄 ${record.id}: ${oldValue} → ${newUrl}`);

      // Update record if not dry run
      if (!this.dryRun) {
        const { error: updateError } = await this.supabase
          .from(tableName)
          .update({ [fieldName]: newUrl })
          .eq('id', record.id);

        if (updateError) {
          result.errors.push(`Failed to update record ${record.id}: ${updateError.message}`);
          result.errorRecords++;
          return;
        }
      }

      result.migratedRecords++;

    } catch (error) {
      result.errors.push(`Error processing record ${record.id}: ${error instanceof Error ? error.message : String(error)}`);
      result.errorRecords++;
    }
  }

  /**
   * Process array field (jsonb arrays like document_s3_urls)
   */
  private async processArrayField(
    record: any,
    tableName: string,
    fieldName: string,
    urlArray: string[],
    result: MigrationResult
  ): Promise<void> {
    const newArray: string[] = [];
    let hasChanges = false;

    for (const url of urlArray) {
      if (!url || typeof url !== 'string') {
        newArray.push(url);
        continue;
      }

      // Skip if already migrated
      if (url.includes('s3://') || url.includes(CLOUDFRONT_DOMAIN!) || url.includes('amazonaws.com')) {
        newArray.push(url);
        continue;
      }

      // Parse Supabase URL
      const parsed = this.parseSupabaseUrl(url);
      if (!parsed) {
        newArray.push(url); // Keep original if can't parse
        continue;
      }

      try {
        // Map to S3 bucket
        const s3Bucket = BUCKET_MAPPING[parsed.bucket as keyof typeof BUCKET_MAPPING] || 'matbakh-files-uploads';
        
        // Copy content if not dry run
        if (!this.dryRun) {
          try {
            const copyResult = await this.copyFromSupabaseToS3(
              parsed.bucket,
              parsed.filePath,
              s3Bucket,
              parsed.filePath
            );
            
            result.bytesCopied += copyResult.size || 0;
            if (copyResult.contentType) {
              result.contentTypes[copyResult.contentType] = (result.contentTypes[copyResult.contentType] || 0) + 1;
            }
          } catch (copyError) {
            result.copyFailures++;
            result.errors.push(`Failed to copy array file for record ${record.id}: ${copyError instanceof Error ? copyError.message : String(copyError)}`);
            newArray.push(url); // Keep original on copy failure
            continue;
          }
        }

        // Generate new S3 URL
        const newUrl = this.generateS3Url(s3Bucket, parsed.filePath);
        newArray.push(newUrl);
        hasChanges = true;

      } catch (error) {
        newArray.push(url); // Keep original on error
        result.errors.push(`Error processing array URL in record ${record.id}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // Update record if there were changes and not dry run
    if (hasChanges && !this.dryRun) {
      const { error: updateError } = await this.supabase
        .from(tableName)
        .update({ [fieldName]: newArray })
        .eq('id', record.id);

      if (updateError) {
        result.errors.push(`Failed to update array field for record ${record.id}: ${updateError.message}`);
        result.errorRecords++;
        return;
      }
    }

    if (hasChanges) {
      result.migratedRecords++;
      console.log(`  🔄 ${record.id}: Updated ${urlArray.length} URLs in array field`);
    } else {
      result.skippedRecords++;
    }
  }

  /**
   * Migrate file URLs in a specific table and field
   */
  private async migrateTableField(
    tableName: string, 
    fieldName: string, 
    filterOptions: { like?: string; eq?: string } = {}
  ): Promise<MigrationResult> {
    const result: MigrationResult = {
      table: tableName,
      field: fieldName,
      totalRecords: 0,
      migratedRecords: 0,
      skippedRecords: 0,
      errorRecords: 0,
      errors: [],
      bytesCopied: 0,
      contentTypes: {},
      copyFailures: 0,
    };

    try {
      console.log(`\n🔄 Migrating ${tableName}.${fieldName}...`);

      // Fetch records with file URLs
      let query = this.supabase
        .from(tableName)
        .select(`id, ${fieldName}`)
        .not(fieldName, 'is', null);

      // Apply filters safely
      if (filterOptions.like) {
        query = query.like(fieldName, filterOptions.like);
      }
      if (filterOptions.eq) {
        query = query.eq(fieldName, filterOptions.eq);
      }

      const { data: records, error } = await query;

      if (error) {
        result.errors.push(`Failed to fetch records: ${error.message}`);
        return result;
      }

      if (!records || records.length === 0) {
        console.log(`  ℹ️  No records found with ${fieldName} values`);
        return result;
      }

      result.totalRecords = records.length;
      console.log(`  📊 Found ${records.length} records to process`);

      // Process each record with concurrency limit
      const limit = 5; // Process 5 files concurrently
      const chunks = [];
      for (let i = 0; i < records.length; i += limit) {
        chunks.push(records.slice(i, i + limit));
      }

      for (const chunk of chunks) {
        await Promise.all(chunk.map(async (record) => {
          await this.processRecord(record, tableName, fieldName, result);
        }));
      }

      console.log(`  ✅ Completed: ${result.migratedRecords} migrated, ${result.skippedRecords} skipped, ${result.errorRecords} errors`);

    } catch (error) {
      result.errors.push(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
    }

    return result;
  }

  /**
   * Run the complete migration
   */
  async migrate(): Promise<void> {
    console.log(`🚀 Starting file URL migration ${this.dryRun ? '(DRY RUN)' : '(LIVE)'}`);
    console.log(`📅 ${new Date().toISOString()}\n`);

    // Define tables and fields to migrate (using new S3 fields)
    const migrations = [
      // User profile avatars
      { table: 'profiles', field: 'avatar_s3_url', filter: {} },
      
      // Business profile logos and images
      { table: 'business_profiles', field: 'avatar_s3_url', filter: {} },
      { table: 'business_profiles', field: 'logo_s3_url', filter: {} },
      { table: 'business_profiles', field: 'document_s3_urls', filter: {} }, // jsonb array
      
      // Business partners
      { table: 'business_partners', field: 'avatar_s3_url', filter: {} },
      { table: 'business_partners', field: 'logo_s3_url', filter: {} },
      
      // Visibility check reports
      { table: 'visibility_check_leads', field: 'report_s3_url', filter: {} },
      
      // User uploads with Supabase URLs
      { table: 'user_uploads', field: 's3_url', filter: { like: '%supabase%' } },
      
      // Additional array fields
      { table: 'business_profiles', field: 'screenshot_s3_urls', filter: {} }, // jsonb array
      { table: 'business_partners', field: 'contract_s3_urls', filter: {} }, // jsonb array
      { table: 'business_partners', field: 'verification_document_s3_urls', filter: {} }, // jsonb array
    ];

    // Run migrations
    for (const migration of migrations) {
      try {
        const result = await this.migrateTableField(
          migration.table, 
          migration.field, 
          migration.filter
        );
        this.results.push(result);
      } catch (error) {
        console.error(`❌ Failed to migrate ${migration.table}.${migration.field}:`, error);
        this.results.push({
          table: migration.table,
          field: migration.field,
          totalRecords: 0,
          migratedRecords: 0,
          skippedRecords: 0,
          errorRecords: 1,
          errors: [error instanceof Error ? error.message : String(error)],
          bytesCopied: 0,
          contentTypes: {},
          copyFailures: 0,
        });
      }
    }

    // Generate report
    this.generateReport();
  }

  /**
   * Format bytes to human readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Generate migration report
   */
  private generateReport(): void {
    console.log('\n📊 MIGRATION REPORT');
    console.log('==================');

    let totalRecords = 0;
    let totalMigrated = 0;
    let totalSkipped = 0;
    let totalErrors = 0;
    let totalBytesCopied = 0;
    let totalCopyFailures = 0;
    let allErrors: string[] = [];
    let allContentTypes: Record<string, number> = {};

    this.results.forEach(result => {
      totalRecords += result.totalRecords;
      totalMigrated += result.migratedRecords;
      totalSkipped += result.skippedRecords;
      totalErrors += result.errorRecords;
      totalBytesCopied += result.bytesCopied;
      totalCopyFailures += result.copyFailures;
      allErrors.push(...result.errors);

      // Merge content types
      Object.entries(result.contentTypes).forEach(([type, count]) => {
        allContentTypes[type] = (allContentTypes[type] || 0) + count;
      });

      console.log(`\n${result.table}.${result.field}:`);
      console.log(`  📊 Total: ${result.totalRecords}`);
      console.log(`  ✅ Migrated: ${result.migratedRecords}`);
      console.log(`  ⏭️  Skipped: ${result.skippedRecords}`);
      console.log(`  ❌ Errors: ${result.errorRecords}`);
      console.log(`  📁 Bytes Copied: ${this.formatBytes(result.bytesCopied)}`);
      console.log(`  🚫 Copy Failures: ${result.copyFailures}`);
    });

    console.log('\n📈 SUMMARY:');
    console.log(`  📊 Total Records: ${totalRecords}`);
    console.log(`  ✅ Successfully Migrated: ${totalMigrated}`);
    console.log(`  ⏭️  Skipped (already migrated): ${totalSkipped}`);
    console.log(`  ❌ Errors: ${totalErrors}`);
    console.log(`  📁 Total Bytes Copied: ${this.formatBytes(totalBytesCopied)}`);
    console.log(`  🚫 Copy Failures: ${totalCopyFailures}`);
    console.log(`  📄 Content Types: ${Object.entries(allContentTypes).map(([type, count]) => `${type}(${count})`).join(', ')}`);

    if (allErrors.length > 0) {
      console.log('\n❌ ERRORS:');
      allErrors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }

    // Save report to file
    const reportPath = path.join(__dirname, `../migration-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      dryRun: this.dryRun,
      summary: {
        totalRecords,
        totalMigrated,
        totalSkipped,
        totalErrors,
      },
      results: this.results,
      errors: allErrors,
    }, null, 2));

    console.log(`\n📄 Report saved to: ${reportPath}`);
  }

  /**
   * Validate migrated URLs
   */
  async validate(): Promise<void> {
    console.log('\n🔍 VALIDATION');
    console.log('==============');

    // Sample validation - check a few migrated records
    const validationQueries = [
      { table: 'visibility_check_leads', field: 'report_url' },
      { table: 'business_profiles', field: 'avatar_url' },
    ];

    for (const query of validationQueries) {
      try {
        const { data: records } = await this.supabase
          .from(query.table)
          .select(`id, ${query.field}`)
          .not(query.field, 'is', null)
          .limit(5);

        if (records && records.length > 0) {
          console.log(`\n✅ ${query.table}.${query.field} - Sample records:`);
          records.forEach(record => {
            const url = record[query.field];
            const isValidS3 = url.includes('s3://') || url.includes(CLOUDFRONT_DOMAIN) || url.includes('amazonaws.com');
            console.log(`  ${record.id}: ${url} ${isValidS3 ? '✅' : '❌'}`);
          });
        }
      } catch (error) {
        console.error(`❌ Validation failed for ${query.table}.${query.field}:`, error);
      }
    }
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const validate = args.includes('--validate');

  if (args.includes('--help')) {
    console.log(`
File URL Migration Script

Usage:
  npm run migrate-file-urls [options]

Options:
  --dry-run     Run migration without making changes
  --validate    Validate migrated URLs after migration
  --help        Show this help message

Environment Variables:
  SUPABASE_URL                 Supabase project URL
  SUPABASE_SERVICE_ROLE_KEY    Supabase service role key
  AWS_REGION                   AWS region (default: eu-central-1)
  AWS_ACCESS_KEY_ID            AWS access key ID
  AWS_SECRET_ACCESS_KEY        AWS secret access key
  CLOUDFRONT_DOMAIN            CloudFront domain for reports (required)
  REPORTS_STRATEGY             'copy' or 'regenerate' (default: regenerate)

Examples:
  npm run migrate-file-urls --dry-run     # Test migration without changes
  npm run migrate-file-urls               # Run actual migration
  npm run migrate-file-urls --validate    # Run migration and validate results
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
    const migrator = new FileUrlMigrator(dryRun);
    await migrator.migrate();

    if (validate && !dryRun) {
      await migrator.validate();
    }

    console.log('\n🎉 Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { FileUrlMigrator };