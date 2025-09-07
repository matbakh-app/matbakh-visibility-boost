# Database Migration Troubleshooting Guide

**Last Updated**: September 2, 2025  
**Context**: Task 12.1 - Schema Consolidation Issues

## 🚨 Current Active Issues

### Issue 1: service_packages Table Structure Mismatch

**Error**: `column "code" of relation "service_packages" does not exist`

**Root Cause**: 
- Migration expects new table structure with `code` column
- Existing table has old structure without `code` column
- `CREATE TABLE IF NOT EXISTS` doesn't update existing table structure

**Solution Applied**:
```sql
-- Drop and recreate with correct structure
DROP TABLE IF EXISTS service_packages CASCADE;
CREATE TABLE service_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  default_name TEXT NOT NULL,
  is_recurring BOOLEAN DEFAULT FALSE,
  interval_months INT,
  created_at TIMESTAMP DEFAULT now()
);
```

### Issue 2: Duplicate Constraint Creation

**Error**: `relation "service_prices_package_id_key" already exists`

**Root Cause**: 
- Migration tries to add constraint that already exists
- No existence check before constraint creation

**Solution Applied**:
```sql
-- Idempotent constraint creation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'service_prices_package_id_key' 
    AND table_name = 'service_prices'
  ) THEN
    ALTER TABLE service_prices
        ADD CONSTRAINT service_prices_package_id_key UNIQUE (package_id);
  END IF;
END$$;
```

### Issue 3: Table Rename Conflicts

**Error**: `relation "service_packages_legacy" already exists`

**Root Cause**: 
- Migration tries to rename table to backup name that already exists
- Previous migration attempts left backup table in place

**Solution Applied**:
```sql
-- Double existence check
DO $$
BEGIN
  IF to_regclass('public.service_packages') IS NOT NULL 
     AND to_regclass('public.service_packages_legacy') IS NULL THEN
    ALTER TABLE service_packages RENAME TO service_packages_legacy;
  END IF;
END$$;
```

## 🛠 Common Migration Patterns

### 1. Idempotent Table Creation
```sql
-- Always use IF NOT EXISTS
CREATE TABLE IF NOT EXISTS table_name (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- columns...
);

-- For structure changes, check and alter
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'your_table' AND column_name = 'new_column'
  ) THEN
    ALTER TABLE your_table ADD COLUMN new_column TEXT;
  END IF;
END$$;
```

### 2. Safe Constraint Addition
```sql
-- Check before adding constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'your_constraint_name'
  ) THEN
    ALTER TABLE your_table ADD CONSTRAINT your_constraint_name UNIQUE (column);
  END IF;
END$$;
```

### 3. Safe Index Creation
```sql
-- Indexes can use IF NOT EXISTS directly
CREATE INDEX IF NOT EXISTS idx_table_column ON table_name(column);
```

### 4. Safe Function Creation
```sql
-- Always use OR REPLACE for functions
CREATE OR REPLACE FUNCTION function_name()
RETURNS return_type
LANGUAGE plpgsql
AS $$
BEGIN
  -- function body
END;
$$;
```

## 🔍 Diagnostic Queries

### Check Table Structure
```sql
-- Compare table structures
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('service_packages', 'service_packages_legacy')
ORDER BY table_name, ordinal_position;
```

### Check Constraints
```sql
-- List all constraints
SELECT 
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_name;
```

### Check Indexes
```sql
-- List all indexes
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

### Check Migration Status
```sql
-- Check applied migrations
SELECT * FROM supabase_migrations.schema_migrations 
ORDER BY version DESC 
LIMIT 10;
```

## 🚑 Emergency Procedures

### 1. Migration Rollback
```bash
# Reset to last known good state
supabase db reset --db-url $SUPABASE_DB_URL

# Or rollback specific migration
supabase migration repair --status reverted --version 20250701132805
```

### 2. Manual Schema Fix
```sql
-- If automated migration fails, manual fix:
BEGIN;

-- 1. Backup existing data
CREATE TABLE service_packages_backup AS 
SELECT * FROM service_packages;

-- 2. Drop problematic table
DROP TABLE service_packages CASCADE;

-- 3. Recreate with correct structure
CREATE TABLE service_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  default_name TEXT NOT NULL,
  is_recurring BOOLEAN DEFAULT FALSE,
  interval_months INT,
  created_at TIMESTAMP DEFAULT now()
);

-- 4. Migrate data back (adjust as needed)
INSERT INTO service_packages (id, code, default_name, is_recurring, interval_months)
SELECT 
  id, 
  COALESCE(slug, 'pkg_' || id::text) as code,
  COALESCE(name, 'Package') as default_name,
  false as is_recurring,
  NULL as interval_months
FROM service_packages_backup;

COMMIT;
```

### 3. Schema Validation
```bash
# Validate schema after fixes
supabase db diff --schema public

# Check for orphaned objects
supabase db lint
```

## 📋 Prevention Checklist

### Before Creating Migrations
- [ ] Test migration on local database copy
- [ ] Use idempotent patterns (IF NOT EXISTS, OR REPLACE)
- [ ] Check for existing objects before creation
- [ ] Plan rollback strategy
- [ ] Document breaking changes

### Migration Best Practices
- [ ] One logical change per migration file
- [ ] Use descriptive migration names
- [ ] Include comments explaining complex changes
- [ ] Test with existing data
- [ ] Verify RLS policies after schema changes

### After Migration Deployment
- [ ] Verify all tables exist and have correct structure
- [ ] Check that all constraints are properly applied
- [ ] Test application functionality
- [ ] Monitor for performance issues
- [ ] Update documentation

## 🔧 Tools and Commands

### Supabase CLI
```bash
# Check migration status
supabase migration list

# Create new migration
supabase migration new migration_name

# Apply migrations
supabase db push

# Reset database (development only)
supabase db reset
```

### PostgreSQL Direct
```bash
# Connect to database
psql $DATABASE_URL

# Describe table structure
\d table_name

# List all tables
\dt

# List all indexes
\di
```

## 📞 Escalation Path

1. **Level 1**: Check this troubleshooting guide
2. **Level 2**: Review [Migration Log](migration-log.md) for similar issues
3. **Level 3**: Check Supabase documentation and community
4. **Level 4**: Contact database team lead
5. **Level 5**: Create support ticket with Supabase

## 📚 Additional Resources

- [Supabase Migration Guide](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [SQL Migration Best Practices](https://www.prisma.io/dataguide/types/relational/migration-strategies)
- [Database Schema Evolution](https://martinfowler.com/articles/evodb.html)