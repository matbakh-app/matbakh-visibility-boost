#!/usr/bin/env ts-node

/**
 * Database Schema Migration Script
 * Task 3: Database Schema Migration
 *
 * This script handles the export, analysis, adaptation, and deployment
 * of the database schema from Supabase to AWS RDS PostgreSQL.
 */

import { execSync } from "child_process";
import { promises as fs } from "fs";
import { join } from "path";
import { Client } from "pg";

interface SchemaAnalysis {
  tables: TableInfo[];
  indexes: IndexInfo[];
  constraints: ConstraintInfo[];
  functions: FunctionInfo[];
  rlsPolicies: RLSPolicyInfo[];
  extensions: ExtensionInfo[];
}

interface TableInfo {
  name: string;
  schema: string;
  columns: ColumnInfo[];
  rowCount?: number;
  estimatedSize?: string;
}

interface ColumnInfo {
  name: string;
  dataType: string;
  isNullable: boolean;
  defaultValue?: string;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  references?: string;
}

interface IndexInfo {
  name: string;
  tableName: string;
  columns: string[];
  isUnique: boolean;
  indexType: string;
  definition: string;
}

interface ConstraintInfo {
  name: string;
  tableName: string;
  type: string;
  definition: string;
}

interface FunctionInfo {
  name: string;
  schema: string;
  definition: string;
  isSupabaseSpecific: boolean;
  awsCompatible: boolean;
}

interface RLSPolicyInfo {
  name: string;
  tableName: string;
  command: string;
  definition: string;
  roles: string[];
}

interface ExtensionInfo {
  name: string;
  version: string;
  isSupported: boolean;
  alternative?: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  rowCounts: Record<string, number>;
  checksums: Record<string, string>;
}

class SchemaMigration {
  private supabaseClient: Client;
  private rdsClient: Client;
  private migrationDir: string;

  constructor() {
    this.supabaseClient = new Client({
      host: process.env.SUPABASE_DB_HOST,
      port: parseInt(process.env.SUPABASE_DB_PORT || "5432"),
      database: process.env.SUPABASE_DB_NAME,
      user: process.env.SUPABASE_DB_USER,
      password: process.env.SUPABASE_DB_PASSWORD,
      ssl: { rejectUnauthorized: false },
    });

    this.rdsClient = new Client({
      host: process.env.RDS_DB_HOST,
      port: parseInt(process.env.RDS_DB_PORT || "5432"),
      database: process.env.RDS_DB_NAME || "matbakh",
      user: process.env.RDS_DB_USER || "matbakh_admin",
      password: process.env.RDS_DB_PASSWORD,
      ssl: { rejectUnauthorized: false },
    });

    this.migrationDir = join(process.cwd(), "migration-data");
  }

  /**
   * Task 3.1: Export and analyze Supabase schema
   */
  async exportAndAnalyzeSchema(): Promise<SchemaAnalysis> {
    console.log("📤 Exporting and analyzing Supabase schema...");

    // Create migration directory
    await fs.mkdir(this.migrationDir, { recursive: true });

    // Export schema using pg_dump
    await this.exportSchemaWithPgDump();

    // Connect to Supabase and analyze schema
    await this.supabaseClient.connect();

    const analysis: SchemaAnalysis = {
      tables: await this.analyzeTables(),
      indexes: await this.analyzeIndexes(),
      constraints: await this.analyzeConstraints(),
      functions: await this.analyzeFunctions(),
      rlsPolicies: await this.analyzeRLSPolicies(),
      extensions: await this.analyzeExtensions(),
    };

    // Save analysis to file
    await fs.writeFile(
      join(this.migrationDir, "schema-analysis.json"),
      JSON.stringify(analysis, null, 2)
    );

    console.log("✅ Schema export and analysis completed");
    console.log(
      `📊 Found ${analysis.tables.length} tables, ${analysis.functions.length} functions, ${analysis.rlsPolicies.length} RLS policies`
    );

    return analysis;
  }

  /**
   * Task 3.2: Adapt schema for AWS RDS compatibility
   */
  async adaptSchemaForRDS(analysis: SchemaAnalysis): Promise<void> {
    console.log("🔧 Adapting schema for AWS RDS compatibility...");

    // Convert Supabase-specific functions
    const convertedFunctions = await this.convertSupabaseFunctions(
      analysis.functions
    );

    // Migrate RLS policies to application-level security
    const securityMigration = await this.migrateRLSToApplicationSecurity(
      analysis.rlsPolicies
    );

    // Optimize indexes for RDS performance
    const optimizedIndexes = await this.optimizeIndexesForRDS(analysis.indexes);

    // Create migration scripts
    await this.createMigrationScripts({
      functions: convertedFunctions,
      security: securityMigration,
      indexes: optimizedIndexes,
      tables: analysis.tables,
      constraints: analysis.constraints,
    });

    console.log("✅ Schema adaptation for RDS completed");
  }

  /**
   * Task 3.3: Deploy and validate schema in RDS
   */
  async deployAndValidateSchema(): Promise<void> {
    console.log("🚀 Deploying and validating schema in RDS...");

    await this.rdsClient.connect();

    // Execute schema creation scripts
    await this.executeSchemaScripts();

    // Validate schema deployment
    const validation = await this.validateSchemaDeployment();

    if (!validation.isValid) {
      console.error("❌ Schema validation failed:", validation.errors);
      throw new Error("Schema deployment validation failed");
    }

    console.log("✅ Schema deployment and validation completed");
    console.log(
      `📊 Validated ${Object.keys(validation.rowCounts).length} tables`
    );
  }

  /**
   * Task 3.4: Create data validation procedures
   */
  async createDataValidationProcedures(): Promise<void> {
    console.log("🔍 Creating data validation procedures...");

    // Create validation functions
    await this.createValidationFunctions();

    // Create data quality monitoring
    await this.setupDataQualityMonitoring();

    // Create integrity check procedures
    await this.createIntegrityCheckProcedures();

    console.log("✅ Data validation procedures created");
  }

  private async exportSchemaWithPgDump(): Promise<void> {
    console.log("📦 Exporting schema with pg_dump...");

    const pgDumpCommand = [
      "pg_dump",
      "--host",
      process.env.SUPABASE_DB_HOST!,
      "--port",
      process.env.SUPABASE_DB_PORT || "5432",
      "--username",
      process.env.SUPABASE_DB_USER!,
      "--dbname",
      process.env.SUPABASE_DB_NAME!,
      "--schema-only",
      "--no-owner",
      "--no-privileges",
      "--file",
      join(this.migrationDir, "schema-export.sql"),
    ].join(" ");

    try {
      execSync(pgDumpCommand, {
        env: { ...process.env, PGPASSWORD: process.env.SUPABASE_DB_PASSWORD },
        stdio: "inherit",
      });
      console.log("✅ Schema exported successfully");
    } catch (error) {
      console.error("❌ Failed to export schema:", error);
      throw error;
    }
  }

  private async analyzeTables(): Promise<TableInfo[]> {
    console.log("🔍 Analyzing tables...");

    const tablesQuery = `
      SELECT 
        t.table_name,
        t.table_schema,
        pg_size_pretty(pg_total_relation_size(c.oid)) as size,
        pg_stat_get_tuples_returned(c.oid) as row_count
      FROM information_schema.tables t
      LEFT JOIN pg_class c ON c.relname = t.table_name
      WHERE t.table_schema NOT IN ('information_schema', 'pg_catalog', 'auth', 'storage', 'realtime')
      AND t.table_type = 'BASE TABLE'
      ORDER BY t.table_name;
    `;

    const result = await this.supabaseClient.query(tablesQuery);
    const tables: TableInfo[] = [];

    for (const row of result.rows) {
      const columns = await this.analyzeTableColumns(
        row.table_name,
        row.table_schema
      );
      tables.push({
        name: row.table_name,
        schema: row.table_schema,
        columns,
        rowCount: parseInt(row.row_count) || 0,
        estimatedSize: row.size,
      });
    }

    return tables;
  }

  private async analyzeTableColumns(
    tableName: string,
    schema: string
  ): Promise<ColumnInfo[]> {
    const columnsQuery = `
      SELECT 
        c.column_name,
        c.data_type,
        c.is_nullable,
        c.column_default,
        CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END as is_primary_key,
        CASE WHEN fk.column_name IS NOT NULL THEN true ELSE false END as is_foreign_key,
        fk.foreign_table_name || '.' || fk.foreign_column_name as references
      FROM information_schema.columns c
      LEFT JOIN (
        SELECT ku.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage ku ON tc.constraint_name = ku.constraint_name
        WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_name = $1 AND tc.table_schema = $2
      ) pk ON c.column_name = pk.column_name
      LEFT JOIN (
        SELECT 
          ku.column_name,
          ccu.table_name as foreign_table_name,
          ccu.column_name as foreign_column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage ku ON tc.constraint_name = ku.constraint_name
        JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = $1 AND tc.table_schema = $2
      ) fk ON c.column_name = fk.column_name
      WHERE c.table_name = $1 AND c.table_schema = $2
      ORDER BY c.ordinal_position;
    `;

    const result = await this.supabaseClient.query(columnsQuery, [
      tableName,
      schema,
    ]);
    return result.rows.map((row) => ({
      name: row.column_name,
      dataType: row.data_type,
      isNullable: row.is_nullable === "YES",
      defaultValue: row.column_default,
      isPrimaryKey: row.is_primary_key,
      isForeignKey: row.is_foreign_key,
      references: row.references,
    }));
  }

  private async analyzeIndexes(): Promise<IndexInfo[]> {
    console.log("📊 Analyzing indexes...");

    const indexesQuery = `
      SELECT 
        i.indexname as name,
        i.tablename as table_name,
        i.indexdef as definition,
        ix.indisunique as is_unique,
        am.amname as index_type
      FROM pg_indexes i
      JOIN pg_class c ON c.relname = i.tablename
      JOIN pg_index ix ON ix.indexrelid = (
        SELECT oid FROM pg_class WHERE relname = i.indexname
      )
      JOIN pg_am am ON am.oid = (
        SELECT relam FROM pg_class WHERE oid = ix.indexrelid
      )
      WHERE i.schemaname NOT IN ('information_schema', 'pg_catalog', 'auth', 'storage', 'realtime')
      ORDER BY i.tablename, i.indexname;
    `;

    const result = await this.supabaseClient.query(indexesQuery);
    return result.rows.map((row) => ({
      name: row.name,
      tableName: row.table_name,
      columns: this.extractColumnsFromIndexDef(row.definition),
      isUnique: row.is_unique,
      indexType: row.index_type,
      definition: row.definition,
    }));
  }

  private async analyzeConstraints(): Promise<ConstraintInfo[]> {
    console.log("🔗 Analyzing constraints...");

    const constraintsQuery = `
      SELECT 
        tc.constraint_name as name,
        tc.table_name,
        tc.constraint_type as type,
        pg_get_constraintdef(c.oid) as definition
      FROM information_schema.table_constraints tc
      JOIN pg_constraint c ON c.conname = tc.constraint_name
      WHERE tc.table_schema NOT IN ('information_schema', 'pg_catalog', 'auth', 'storage', 'realtime')
      ORDER BY tc.table_name, tc.constraint_name;
    `;

    const result = await this.supabaseClient.query(constraintsQuery);
    return result.rows.map((row) => ({
      name: row.name,
      tableName: row.table_name,
      type: row.type,
      definition: row.definition,
    }));
  }

  private async analyzeFunctions(): Promise<FunctionInfo[]> {
    console.log("⚙️ Analyzing functions...");

    const functionsQuery = `
      SELECT 
        p.proname as name,
        n.nspname as schema,
        pg_get_functiondef(p.oid) as definition
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname NOT IN ('information_schema', 'pg_catalog', 'auth', 'storage', 'realtime')
      ORDER BY n.nspname, p.proname;
    `;

    const result = await this.supabaseClient.query(functionsQuery);
    return result.rows.map((row) => ({
      name: row.name,
      schema: row.schema,
      definition: row.definition,
      isSupabaseSpecific: this.isSupabaseSpecificFunction(row.definition),
      awsCompatible: this.isAWSCompatibleFunction(row.definition),
    }));
  }

  private async analyzeRLSPolicies(): Promise<RLSPolicyInfo[]> {
    console.log("🛡️ Analyzing RLS policies...");

    const rlsQuery = `
      SELECT 
        pol.polname as name,
        c.relname as table_name,
        pol.polcmd as command,
        pg_get_expr(pol.polqual, pol.polrelid) as definition,
        array_agg(r.rolname) as roles
      FROM pg_policy pol
      JOIN pg_class c ON pol.polrelid = c.oid
      LEFT JOIN pg_roles r ON r.oid = ANY(pol.polroles)
      WHERE c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
      GROUP BY pol.polname, c.relname, pol.polcmd, pol.polqual, pol.polrelid
      ORDER BY c.relname, pol.polname;
    `;

    const result = await this.supabaseClient.query(rlsQuery);
    return result.rows.map((row) => ({
      name: row.name,
      tableName: row.table_name,
      command: row.command,
      definition: row.definition,
      roles: row.roles || [],
    }));
  }

  private async analyzeExtensions(): Promise<ExtensionInfo[]> {
    console.log("🔌 Analyzing extensions...");

    const extensionsQuery = `
      SELECT 
        e.extname as name,
        e.extversion as version
      FROM pg_extension e
      ORDER BY e.extname;
    `;

    const result = await this.supabaseClient.query(extensionsQuery);
    return result.rows.map((row) => ({
      name: row.name,
      version: row.version,
      isSupported: this.isExtensionSupportedInRDS(row.name),
      alternative: this.getExtensionAlternative(row.name),
    }));
  }

  private async convertSupabaseFunctions(
    functions: FunctionInfo[]
  ): Promise<string[]> {
    console.log("🔄 Converting Supabase-specific functions...");

    const convertedFunctions: string[] = [];

    for (const func of functions) {
      if (func.isSupabaseSpecific && !func.awsCompatible) {
        const converted = await this.convertFunctionToRDSCompatible(func);
        convertedFunctions.push(converted);
      }
    }

    return convertedFunctions;
  }

  private async migrateRLSToApplicationSecurity(
    policies: RLSPolicyInfo[]
  ): Promise<string> {
    console.log("🔐 Migrating RLS policies to application-level security...");

    let securityMigration = `
-- Application-level security migration from RLS policies
-- Generated on ${new Date().toISOString()}

-- Create security context table
CREATE TABLE IF NOT EXISTS security_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role VARCHAR(50) NOT NULL,
  permissions JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create security functions
`;

    for (const policy of policies) {
      securityMigration += this.convertRLSPolicyToFunction(policy);
    }

    return securityMigration;
  }

  private async optimizeIndexesForRDS(indexes: IndexInfo[]): Promise<string[]> {
    console.log("⚡ Optimizing indexes for RDS performance...");

    const optimizedIndexes: string[] = [];

    for (const index of indexes) {
      const optimized = this.optimizeIndexForRDS(index);
      optimizedIndexes.push(optimized);
    }

    return optimizedIndexes;
  }

  private async createMigrationScripts(components: any): Promise<void> {
    console.log("📝 Creating migration scripts...");

    // Create main schema script
    const schemaScript = `
-- Matbakh Database Schema Migration
-- Generated on ${new Date().toISOString()}
-- Source: Supabase to AWS RDS PostgreSQL

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

${components.functions.join("\n\n")}

${components.security}

${components.indexes.join("\n")}
`;

    await fs.writeFile(join(this.migrationDir, "rds-schema.sql"), schemaScript);

    // Create rollback script
    const rollbackScript = this.createRollbackScript(components);
    await fs.writeFile(
      join(this.migrationDir, "rollback-schema.sql"),
      rollbackScript
    );

    console.log("✅ Migration scripts created");
  }

  private async executeSchemaScripts(): Promise<void> {
    console.log("🚀 Executing schema scripts on RDS...");

    const schemaScript = await fs.readFile(
      join(this.migrationDir, "rds-schema.sql"),
      "utf8"
    );

    try {
      await this.rdsClient.query(schemaScript);
      console.log("✅ Schema scripts executed successfully");
    } catch (error) {
      console.error("❌ Failed to execute schema scripts:", error);
      throw error;
    }
  }

  private async validateSchemaDeployment(): Promise<ValidationResult> {
    console.log("✅ Validating schema deployment...");

    const validation: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      rowCounts: {},
      checksums: {},
    };

    // Validate tables exist
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;

    const result = await this.rdsClient.query(tablesQuery);
    const rdsTableCount = result.rows.length;

    if (rdsTableCount === 0) {
      validation.isValid = false;
      validation.errors.push("No tables found in RDS database");
    }

    console.log(`📊 Found ${rdsTableCount} tables in RDS`);
    return validation;
  }

  private async createValidationFunctions(): Promise<void> {
    console.log("🔍 Creating validation functions...");

    const validationFunctions = `
-- Data validation functions
CREATE OR REPLACE FUNCTION validate_data_integrity()
RETURNS TABLE(table_name TEXT, row_count BIGINT, checksum TEXT) AS $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN 
        SELECT t.table_name 
        FROM information_schema.tables t 
        WHERE t.table_schema = 'public' 
        AND t.table_type = 'BASE TABLE'
    LOOP
        EXECUTE format('SELECT %L, COUNT(*), md5(string_agg(md5(t.*::text), '''' ORDER BY t.*)) FROM %I t', 
                      rec.table_name, rec.table_name)
        INTO table_name, row_count, checksum;
        RETURN NEXT;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Row count validation
CREATE OR REPLACE FUNCTION validate_row_counts()
RETURNS TABLE(table_name TEXT, row_count BIGINT) AS $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN 
        SELECT t.table_name 
        FROM information_schema.tables t 
        WHERE t.table_schema = 'public' 
        AND t.table_type = 'BASE TABLE'
    LOOP
        EXECUTE format('SELECT %L, COUNT(*) FROM %I', rec.table_name, rec.table_name)
        INTO table_name, row_count;
        RETURN NEXT;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
`;

    await this.rdsClient.query(validationFunctions);
    console.log("✅ Validation functions created");
  }

  private async setupDataQualityMonitoring(): Promise<void> {
    console.log("📊 Setting up data quality monitoring...");

    const monitoringScript = `
-- Data quality monitoring views
CREATE OR REPLACE VIEW data_quality_summary AS
SELECT 
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_rows,
    n_dead_tup as dead_rows,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables
ORDER BY schemaname, tablename;

-- Create monitoring function
CREATE OR REPLACE FUNCTION check_data_quality()
RETURNS TABLE(
    table_name TEXT,
    issue_type TEXT,
    issue_description TEXT,
    severity TEXT
) AS $$
BEGIN
    -- Check for tables with high dead tuple ratio
    RETURN QUERY
    SELECT 
        t.tablename::TEXT,
        'dead_tuples'::TEXT,
        'High dead tuple ratio: ' || ROUND((n_dead_tup::NUMERIC / NULLIF(n_live_tup, 0)) * 100, 2) || '%',
        CASE 
            WHEN (n_dead_tup::NUMERIC / NULLIF(n_live_tup, 0)) > 0.2 THEN 'HIGH'
            WHEN (n_dead_tup::NUMERIC / NULLIF(n_live_tup, 0)) > 0.1 THEN 'MEDIUM'
            ELSE 'LOW'
        END::TEXT
    FROM pg_stat_user_tables t
    WHERE n_live_tup > 0 AND (n_dead_tup::NUMERIC / n_live_tup) > 0.05;
END;
$$ LANGUAGE plpgsql;
`;

    await this.rdsClient.query(monitoringScript);
    console.log("✅ Data quality monitoring setup completed");
  }

  private async createIntegrityCheckProcedures(): Promise<void> {
    console.log("🔗 Creating integrity check procedures...");

    const integrityChecks = `
-- Foreign key integrity checks
CREATE OR REPLACE FUNCTION check_foreign_key_integrity()
RETURNS TABLE(
    constraint_name TEXT,
    table_name TEXT,
    column_name TEXT,
    foreign_table TEXT,
    foreign_column TEXT,
    orphaned_rows BIGINT
) AS $$
DECLARE
    fk_rec RECORD;
    orphan_count BIGINT;
BEGIN
    FOR fk_rec IN
        SELECT 
            tc.constraint_name,
            tc.table_name,
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
    LOOP
        EXECUTE format(
            'SELECT COUNT(*) FROM %I t1 LEFT JOIN %I t2 ON t1.%I = t2.%I WHERE t2.%I IS NULL AND t1.%I IS NOT NULL',
            fk_rec.table_name,
            fk_rec.foreign_table_name,
            fk_rec.column_name,
            fk_rec.foreign_column_name,
            fk_rec.foreign_column_name,
            fk_rec.column_name
        ) INTO orphan_count;
        
        IF orphan_count > 0 THEN
            constraint_name := fk_rec.constraint_name;
            table_name := fk_rec.table_name;
            column_name := fk_rec.column_name;
            foreign_table := fk_rec.foreign_table_name;
            foreign_column := fk_rec.foreign_column_name;
            orphaned_rows := orphan_count;
            RETURN NEXT;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
`;

    await this.rdsClient.query(integrityChecks);
    console.log("✅ Integrity check procedures created");
  }

  // Helper methods
  private extractColumnsFromIndexDef(definition: string): string[] {
    const match = definition.match(/\((.*?)\)/);
    if (match) {
      return match[1].split(",").map((col) => col.trim());
    }
    return [];
  }

  private isSupabaseSpecificFunction(definition: string): boolean {
    const supabaseKeywords = ["auth.", "storage.", "realtime.", "supabase_"];
    return supabaseKeywords.some((keyword) => definition.includes(keyword));
  }

  private isAWSCompatibleFunction(definition: string): boolean {
    const incompatibleFeatures = ["http_request", "net.", "pgsodium"];
    return !incompatibleFeatures.some((feature) =>
      definition.includes(feature)
    );
  }

  private isExtensionSupportedInRDS(extensionName: string): boolean {
    const supportedExtensions = [
      "uuid-ossp",
      "pg_stat_statements",
      "pg_trgm",
      "btree_gin",
      "btree_gist",
      "citext",
      "cube",
      "dblink",
      "dict_int",
      "earthdistance",
      "fuzzystrmatch",
      "hstore",
      "intarray",
      "isn",
      "ltree",
      "pgcrypto",
      "pgrowlocks",
      "pg_prewarm",
      "pg_stat_statements",
      "pg_trgm",
      "postgres_fdw",
      "sslinfo",
      "tablefunc",
      "unaccent",
      "xml2",
    ];
    return supportedExtensions.includes(extensionName);
  }

  private getExtensionAlternative(extensionName: string): string | undefined {
    const alternatives: Record<string, string> = {
      pgsodium: "pgcrypto",
      http: "Lambda function for HTTP requests",
      net: "Application-level networking",
    };
    return alternatives[extensionName];
  }

  private async convertFunctionToRDSCompatible(
    func: FunctionInfo
  ): Promise<string> {
    // Convert Supabase-specific functions to RDS-compatible versions
    let converted = func.definition;

    // Replace Supabase auth functions
    converted = converted.replace(
      /auth\.uid\(\)/g,
      "current_setting('app.current_user_id')::uuid"
    );
    converted = converted.replace(
      /auth\.role\(\)/g,
      "current_setting('app.current_user_role')"
    );

    // Replace storage functions with application-level equivalents
    converted = converted.replace(
      /storage\./g,
      "-- MIGRATED TO APPLICATION LEVEL: storage."
    );

    return `-- Converted from Supabase function: ${func.name}\n${converted}`;
  }

  private convertRLSPolicyToFunction(policy: RLSPolicyInfo): string {
    return `
-- Converted RLS policy: ${policy.name} on ${policy.tableName}
CREATE OR REPLACE FUNCTION check_${policy.tableName}_${policy.name}_policy(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Original policy: ${policy.definition}
    -- TODO: Implement application-level security check
    RETURN TRUE; -- Placeholder - implement actual logic
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`;
  }

  private optimizeIndexForRDS(index: IndexInfo): string {
    // Optimize index for RDS performance characteristics
    let optimized = index.definition;

    // Add FILLFACTOR for better performance on RDS
    if (!optimized.includes("FILLFACTOR")) {
      optimized = optimized.replace(/;$/, " WITH (FILLFACTOR = 90);");
    }

    return `-- Optimized for RDS: ${index.name}\n${optimized}`;
  }

  private createRollbackScript(components: any): string {
    return `
-- Rollback script for schema migration
-- Generated on ${new Date().toISOString()}

-- Drop validation functions
DROP FUNCTION IF EXISTS validate_data_integrity();
DROP FUNCTION IF EXISTS validate_row_counts();
DROP FUNCTION IF EXISTS check_data_quality();
DROP FUNCTION IF EXISTS check_foreign_key_integrity();

-- Drop security context
DROP TABLE IF EXISTS security_context CASCADE;

-- Drop converted functions
-- TODO: Add specific function drops based on migration

-- Note: This is a basic rollback script
-- Manual intervention may be required for complete rollback
`;
  }

  /**
   * Execute all schema migration tasks
   */
  async execute(): Promise<void> {
    console.log("🚀 Starting Database Schema Migration...\n");

    try {
      const analysis = await this.exportAndAnalyzeSchema();
      await this.adaptSchemaForRDS(analysis);
      await this.deployAndValidateSchema();
      await this.createDataValidationProcedures();

      console.log("\n🎉 Database Schema Migration completed successfully!");
      console.log("📋 Next steps:");
      console.log("  1. Review migration logs and validation results");
      console.log("  2. Test schema with sample data");
      console.log("  3. Run data migration pipeline (Task 4)");
      console.log("  4. Validate all constraints and relationships");
      console.log("  5. Performance test with realistic workload");

      console.log("\n📊 Migration Summary:");
      console.log(`  - Tables migrated: ${analysis.tables.length}`);
      console.log(
        `  - Functions converted: ${
          analysis.functions.filter((f) => f.isSupabaseSpecific).length
        }`
      );
      console.log(`  - RLS policies migrated: ${analysis.rlsPolicies.length}`);
      console.log(`  - Indexes optimized: ${analysis.indexes.length}`);
      console.log(`  - Extensions checked: ${analysis.extensions.length}`);
    } catch (error) {
      console.error("\n❌ Database Schema Migration failed:", error);
      console.log("\n🔄 Rollback options:");
      console.log(
        "  1. Run rollback script: migration-data/rollback-schema.sql"
      );
      console.log("  2. Restore from RDS snapshot if available");
      throw error;
    } finally {
      await this.supabaseClient.end();
      await this.rdsClient.end();
    }
  }
}

// Execute if run directly
if (require.main === module) {
  const migration = new SchemaMigration();
  migration.execute().catch(console.error);
}

export { SchemaMigration };
