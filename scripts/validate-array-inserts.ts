#!/usr/bin/env ts-node

/**
 * Array Insert Validation Script
 * 
 * Validates that array fields (*_s3_urls) are correctly handled:
 * - Stored as JSONB arrays
 * - Elements are added correctly (no overwrites)
 * - Migration preserves existing data
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://uheksobnyedarrpgxhju.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface ArrayFieldTest {
  table: string;
  field: string;
  testData: string[];
  description: string;
}

interface ValidationResult {
  test: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  message: string;
  details?: any;
}

class ArrayFieldValidator {
  private results: ValidationResult[] = [];

  /**
   * Main validation function
   */
  async validateArrayFields(): Promise<void> {
    console.log('🧪 Starting Array Field Validation...\n');

    // Define test cases
    const arrayTests: ArrayFieldTest[] = [
      {
        table: 'business_profiles',
        field: 'document_s3_urls',
        testData: [
          'https://matbakh-files-profile.s3.eu-central-1.amazonaws.com/documents/test1.pdf',
          'https://matbakh-files-profile.s3.eu-central-1.amazonaws.com/documents/test2.pdf'
        ],
        description: 'Business profile documents array'
      },
      {
        table: 'visibility_check_leads',
        field: 'screenshot_s3_urls',
        testData: [
          'https://matbakh-files-uploads.s3.eu-central-1.amazonaws.com/screenshots/test1.png',
          'https://matbakh-files-uploads.s3.eu-central-1.amazonaws.com/screenshots/test2.png'
        ],
        description: 'Visibility check screenshots array'
      },
      {
        table: 'business_partners',
        field: 'contract_s3_urls',
        testData: [
          'https://matbakh-files-profile.s3.eu-central-1.amazonaws.com/contracts/test1.pdf'
        ],
        description: 'Partner contracts array'
      },
      {
        table: 'business_partners',
        field: 'verification_document_s3_urls',
        testData: [
          'https://matbakh-files-profile.s3.eu-central-1.amazonaws.com/verification/test1.pdf'
        ],
        description: 'Partner verification documents array'
      }
    ];

    // Run validation tests
    for (const test of arrayTests) {
      await this.validateArrayField(test);
    }

    // Generate report
    await this.generateReport();
  }

  /**
   * Validate a specific array field
   */
  private async validateArrayField(test: ArrayFieldTest): Promise<void> {
    console.log(`🔍 Testing ${test.table}.${test.field}...`);

    try {
      // 1. Check if column exists and is JSONB
      await this.checkColumnStructure(test);

      // 2. Check existing data format
      await this.checkExistingData(test);

      // 3. Test array operations (if safe)
      if (process.env.RUN_WRITE_TESTS === 'true') {
        await this.testArrayOperations(test);
      } else {
        this.results.push({
          test: `${test.table}.${test.field} - Write Operations`,
          status: 'WARNING',
          message: 'Write tests skipped (set RUN_WRITE_TESTS=true to enable)'
        });
      }

    } catch (error) {
      this.results.push({
        test: `${test.table}.${test.field} - General`,
        status: 'FAIL',
        message: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error
      });
    }
  }

  /**
   * Check column structure
   */
  private async checkColumnStructure(test: ArrayFieldTest): Promise<void> {
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          column_name,
          data_type,
          column_default,
          is_nullable
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = '${test.table}' 
          AND column_name = '${test.field}'
      `
    });

    if (error) {
      throw new Error(`Column structure check failed: ${error.message}`);
    }

    if (!data || data.length === 0) {
      this.results.push({
        test: `${test.table}.${test.field} - Column Exists`,
        status: 'FAIL',
        message: 'Column does not exist'
      });
      return;
    }

    const column = data[0];
    
    // Check if it's JSONB
    if (column.data_type !== 'jsonb') {
      this.results.push({
        test: `${test.table}.${test.field} - Data Type`,
        status: 'FAIL',
        message: `Expected JSONB, got ${column.data_type}`,
        details: column
      });
    } else {
      this.results.push({
        test: `${test.table}.${test.field} - Data Type`,
        status: 'PASS',
        message: 'Column is correctly typed as JSONB'
      });
    }

    // Check default value
    if (column.column_default !== "'[]'::jsonb") {
      this.results.push({
        test: `${test.table}.${test.field} - Default Value`,
        status: 'WARNING',
        message: `Default value is '${column.column_default}', expected '[]'::jsonb`
      });
    } else {
      this.results.push({
        test: `${test.table}.${test.field} - Default Value`,
        status: 'PASS',
        message: 'Default value is correctly set to empty array'
      });
    }
  }

  /**
   * Check existing data format
   */
  private async checkExistingData(test: ArrayFieldTest): Promise<void> {
    const { data, error } = await supabase
      .from(test.table)
      .select(`id, ${test.field}`)
      .not(test.field, 'is', null)
      .limit(10);

    if (error) {
      throw new Error(`Existing data check failed: ${error.message}`);
    }

    if (!data || data.length === 0) {
      this.results.push({
        test: `${test.table}.${test.field} - Existing Data`,
        status: 'WARNING',
        message: 'No existing data found to validate'
      });
      return;
    }

    let validArrays = 0;
    let invalidArrays = 0;
    const issues: string[] = [];

    for (const record of data) {
      const fieldValue = record[test.field];
      
      if (Array.isArray(fieldValue)) {
        validArrays++;
        
        // Check if all elements are strings (URLs)
        const allStrings = fieldValue.every(item => typeof item === 'string');
        if (!allStrings) {
          issues.push(`Record ${record.id}: Array contains non-string elements`);
        }
      } else {
        invalidArrays++;
        issues.push(`Record ${record.id}: Field is not an array (${typeof fieldValue})`);
      }
    }

    if (invalidArrays === 0) {
      this.results.push({
        test: `${test.table}.${test.field} - Existing Data Format`,
        status: 'PASS',
        message: `All ${validArrays} records have valid array format`
      });
    } else {
      this.results.push({
        test: `${test.table}.${test.field} - Existing Data Format`,
        status: 'FAIL',
        message: `${invalidArrays} records have invalid format, ${validArrays} are valid`,
        details: issues
      });
    }
  }

  /**
   * Test array operations (append, not overwrite)
   */
  private async testArrayOperations(test: ArrayFieldTest): Promise<void> {
    console.log(`  🧪 Running write tests for ${test.field}...`);

    // Create a test record
    const testRecord = {
      [test.field]: test.testData.slice(0, 1) // Start with one element
    };

    // Add additional fields based on table
    if (test.table === 'business_profiles') {
      Object.assign(testRecord, {
        business_name: 'Array Test Business',
        email: `test-${Date.now()}@example.com`
      });
    } else if (test.table === 'visibility_check_leads') {
      Object.assign(testRecord, {
        business_name: 'Array Test Lead',
        email: `test-${Date.now()}@example.com`,
        confirm_token_hash: `test-${Date.now()}`
      });
    } else if (test.table === 'business_partners') {
      Object.assign(testRecord, {
        business_name: 'Array Test Partner',
        email: `test-${Date.now()}@example.com`
      });
    }

    try {
      // Insert test record
      const { data: insertData, error: insertError } = await supabase
        .from(test.table)
        .insert(testRecord)
        .select()
        .single();

      if (insertError) {
        throw new Error(`Insert failed: ${insertError.message}`);
      }

      const recordId = insertData.id;

      // Test 1: Append to array (should not overwrite)
      const appendValue = test.testData[1];
      const { error: appendError } = await supabase.rpc('exec_sql', {
        sql: `
          UPDATE ${test.table} 
          SET ${test.field} = ${test.field} || '["${appendValue}"]'::jsonb
          WHERE id = '${recordId}'
        `
      });

      if (appendError) {
        throw new Error(`Append operation failed: ${appendError.message}`);
      }

      // Verify append worked
      const { data: verifyData, error: verifyError } = await supabase
        .from(test.table)
        .select(test.field)
        .eq('id', recordId)
        .single();

      if (verifyError) {
        throw new Error(`Verification failed: ${verifyError.message}`);
      }

      const finalArray = verifyData[test.field];
      if (Array.isArray(finalArray) && finalArray.length === 2) {
        this.results.push({
          test: `${test.table}.${test.field} - Array Append`,
          status: 'PASS',
          message: 'Array append operation works correctly'
        });
      } else {
        this.results.push({
          test: `${test.table}.${test.field} - Array Append`,
          status: 'FAIL',
          message: `Array append failed. Expected 2 elements, got ${finalArray?.length || 'null'}`,
          details: finalArray
        });
      }

      // Cleanup test record
      await supabase
        .from(test.table)
        .delete()
        .eq('id', recordId);

    } catch (error) {
      this.results.push({
        test: `${test.table}.${test.field} - Array Operations`,
        status: 'FAIL',
        message: `Array operations test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error
      });
    }
  }

  /**
   * Generate validation report
   */
  private async generateReport(): Promise<void> {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.results.length,
        passed: this.results.filter(r => r.status === 'PASS').length,
        failed: this.results.filter(r => r.status === 'FAIL').length,
        warnings: this.results.filter(r => r.status === 'WARNING').length
      },
      results: this.results
    };

    // Write to file
    fs.writeFileSync('array-validation-report.json', JSON.stringify(report, null, 2));

    // Console output
    console.log('\n📊 Array Field Validation Report');
    console.log('================================');
    console.log(`✅ Passed: ${report.summary.passed}`);
    console.log(`❌ Failed: ${report.summary.failed}`);
    console.log(`⚠️  Warnings: ${report.summary.warnings}`);
    console.log(`📁 Total: ${report.summary.total}`);

    if (report.summary.failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results
        .filter(r => r.status === 'FAIL')
        .forEach(result => {
          console.log(`  - ${result.test}: ${result.message}`);
        });
    }

    if (report.summary.warnings > 0) {
      console.log('\n⚠️  Warnings:');
      this.results
        .filter(r => r.status === 'WARNING')
        .forEach(result => {
          console.log(`  - ${result.test}: ${result.message}`);
        });
    }

    console.log(`\n📄 Full report saved to: array-validation-report.json`);

    // Exit with error code if any tests failed
    if (report.summary.failed > 0) {
      process.exit(1);
    }
  }
}

// CLI usage
async function main() {
  const validator = new ArrayFieldValidator();
  
  try {
    await validator.validateArrayFields();
    console.log('\n✅ Array field validation completed successfully!');
  } catch (error) {
    console.error('\n❌ Array field validation failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { ArrayFieldValidator };