-- Data Integrity Verification Script for S3 Migration
-- Requirements: 4.4 (Verify data integrity after migration)
-- Date: 2025-01-31

-- Set up verification session
\set QUIET on
\pset format wrapped
\pset columns 100

\echo '========================================='
\echo 'S3 File Storage Migration - Data Integrity Verification'
\echo 'Timestamp:' `date`
\echo '========================================='

-- Check 1: Verify user_uploads table structure
\echo ''
\echo '1. Verifying user_uploads table structure...'
SELECT 
    'user_uploads table' as check_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_uploads' AND table_schema = 'public')
        THEN 'PASS - Table exists'
        ELSE 'FAIL - Table missing'
    END as result;

-- Check column count and types
SELECT 
    'user_uploads columns' as check_name,
    COUNT(*) as column_count,
    CASE 
        WHEN COUNT(*) >= 15 THEN 'PASS - Expected columns present'
        ELSE 'FAIL - Missing columns'
    END as result
FROM information_schema.columns 
WHERE table_name = 'user_uploads' AND table_schema = 'public';

-- Check 2: Verify required indexes exist
\echo ''
\echo '2. Verifying indexes...'
SELECT 
    'user_uploads indexes' as check_name,
    COUNT(*) as index_count,
    CASE 
        WHEN COUNT(*) >= 6 THEN 'PASS - Expected indexes present'
        ELSE 'FAIL - Missing indexes'
    END as result
FROM pg_indexes 
WHERE tablename = 'user_uploads' 
AND indexname LIKE 'idx_user_uploads_%';

-- List all user_uploads indexes
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'user_uploads'
ORDER BY indexname;

-- Check 3: Verify S3 columns in existing tables
\echo ''
\echo '3. Verifying S3 columns in existing tables...'

-- business_profiles
SELECT 
    'business_profiles S3 columns' as check_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_profiles' AND column_name = 'avatar_s3_url')
         AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_profiles' AND column_name = 'logo_s3_url')
         AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_profiles' AND column_name = 'document_s3_urls')
        THEN 'PASS - All S3 columns present'
        ELSE 'FAIL - Missing S3 columns'
    END as result;

-- visibility_check_leads
SELECT 
    'visibility_check_leads S3 columns' as check_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'visibility_check_leads' AND column_name = 'report_s3_url')
         AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'visibility_check_leads' AND column_name = 'report_expires_at')
         AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'visibility_check_leads' AND column_name = 'screenshot_s3_urls')
        THEN 'PASS - All S3 columns present'
        ELSE 'FAIL - Missing S3 columns'
    END as result;

-- business_partners
SELECT 
    'business_partners S3 columns' as check_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_partners' AND column_name = 'contract_s3_urls')
         AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_partners' AND column_name = 'verification_document_s3_urls')
        THEN 'PASS - All S3 columns present'
        ELSE 'FAIL - Missing S3 columns'
    END as result;

-- Check 4: Verify foreign key constraints
\echo ''
\echo '4. Verifying foreign key constraints...'
SELECT 
    'user_uploads foreign keys' as check_name,
    COUNT(*) as constraint_count,
    CASE 
        WHEN COUNT(*) >= 1 THEN 'PASS - Foreign key constraints present'
        ELSE 'WARN - No foreign key constraints (may be expected if referenced tables do not exist)'
    END as result
FROM information_schema.table_constraints 
WHERE table_name = 'user_uploads' 
AND constraint_type = 'FOREIGN KEY';

-- List foreign key constraints
SELECT 
    constraint_name,
    table_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'user_uploads' 
AND constraint_type = 'FOREIGN KEY';

-- Check 5: Verify migration tracking tables
\echo ''
\echo '5. Verifying migration tracking...'
SELECT 
    's3_migration_log table' as check_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 's3_migration_log' AND table_schema = 'public')
        THEN 'PASS - Migration log table exists'
        ELSE 'FAIL - Migration log table missing'
    END as result;

SELECT 
    's3_migration_progress view' as check_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 's3_migration_progress' AND table_schema = 'public')
        THEN 'PASS - Migration progress view exists'
        ELSE 'FAIL - Migration progress view missing'
    END as result;

-- Check 6: Verify helper functions
\echo ''
\echo '6. Verifying helper functions...'
SELECT 
    'generate_s3_url function' as check_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'generate_s3_url' AND routine_schema = 'public')
        THEN 'PASS - Helper function exists'
        ELSE 'FAIL - Helper function missing'
    END as result;

-- Check 7: Data consistency checks
\echo ''
\echo '7. Data consistency checks...'

-- Check for any existing data in user_uploads
SELECT 
    'user_uploads data' as check_name,
    COUNT(*) as record_count,
    CASE 
        WHEN COUNT(*) = 0 THEN 'PASS - Table empty (expected for new migration)'
        ELSE 'INFO - ' || COUNT(*) || ' records present'
    END as result
FROM user_uploads;

-- Check migration log entries
SELECT 
    'migration log entries' as check_name,
    COUNT(*) as record_count,
    CASE 
        WHEN COUNT(*) > 0 THEN 'PASS - Migration tracking data present'
        ELSE 'INFO - No migration tracking data (may be expected)'
    END as result
FROM s3_migration_log;

-- Check 8: Column data types verification
\echo ''
\echo '8. Verifying column data types...'
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    CASE 
        WHEN column_name = 'id' AND data_type = 'uuid' THEN 'PASS'
        WHEN column_name = 'user_id' AND data_type = 'uuid' AND is_nullable = 'NO' THEN 'PASS'
        WHEN column_name = 'partner_id' AND data_type = 'uuid' AND is_nullable = 'YES' THEN 'PASS'
        WHEN column_name = 'filename' AND data_type = 'text' AND is_nullable = 'NO' THEN 'PASS'
        WHEN column_name = 'original_filename' AND data_type = 'text' AND is_nullable = 'NO' THEN 'PASS'
        WHEN column_name = 's3_url' AND data_type = 'text' AND is_nullable = 'NO' THEN 'PASS'
        WHEN column_name = 's3_bucket' AND data_type = 'text' AND is_nullable = 'NO' THEN 'PASS'
        WHEN column_name = 's3_key' AND data_type = 'text' AND is_nullable = 'NO' THEN 'PASS'
        WHEN column_name = 'content_type' AND data_type = 'text' AND is_nullable = 'NO' THEN 'PASS'
        WHEN column_name = 'file_size' AND data_type = 'bigint' AND is_nullable = 'NO' THEN 'PASS'
        WHEN column_name = 'upload_type' AND data_type = 'text' AND is_nullable = 'NO' THEN 'PASS'
        WHEN column_name = 'is_public' AND data_type = 'boolean' THEN 'PASS'
        WHEN column_name IN ('uploaded_at', 'expires_at', 'created_at', 'updated_at') AND data_type = 'timestamp with time zone' THEN 'PASS'
        WHEN column_name = 'metadata' AND data_type = 'jsonb' THEN 'PASS'
        ELSE 'CHECK'
    END as validation_result
FROM information_schema.columns 
WHERE table_name = 'user_uploads' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check 9: Constraint verification
\echo ''
\echo '9. Verifying table constraints...'
SELECT 
    constraint_name,
    constraint_type,
    CASE 
        WHEN constraint_type = 'PRIMARY KEY' THEN 'PASS - Primary key present'
        WHEN constraint_type = 'CHECK' THEN 'PASS - Check constraint present'
        WHEN constraint_type = 'FOREIGN KEY' THEN 'PASS - Foreign key present'
        ELSE 'INFO - ' || constraint_type
    END as validation_result
FROM information_schema.table_constraints 
WHERE table_name = 'user_uploads' AND table_schema = 'public'
ORDER BY constraint_type, constraint_name;

-- Summary
\echo ''
\echo '========================================='
\echo 'Verification Summary'
\echo '========================================='

-- Count total checks
WITH verification_summary AS (
    SELECT 'Schema Structure' as category, 
           CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_uploads') THEN 1 ELSE 0 END as passed
    UNION ALL
    SELECT 'Indexes', 
           CASE WHEN (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'user_uploads') >= 6 THEN 1 ELSE 0 END
    UNION ALL
    SELECT 'S3 Columns', 
           CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_profiles' AND column_name = 'avatar_s3_url') THEN 1 ELSE 0 END
    UNION ALL
    SELECT 'Migration Tracking', 
           CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 's3_migration_log') THEN 1 ELSE 0 END
)
SELECT 
    category,
    CASE WHEN passed = 1 THEN 'PASS' ELSE 'FAIL' END as status
FROM verification_summary;

\echo ''
\echo 'Verification completed at:' `date`
\echo '========================================='