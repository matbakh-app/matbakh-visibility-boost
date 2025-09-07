-- Rollback script for S3 File Storage Migration
-- Requirements: 4.4 (Create rollback scripts for safety)
-- Date: 2025-01-31
-- WARNING: This will remove all S3-related schema changes. Use with caution!

BEGIN;

-- Log rollback start
DO $$
BEGIN
    RAISE NOTICE 'Starting S3 migration rollback at %', now();
END $$;

-- Drop S3-related columns from business_profiles
DO $$
BEGIN
    -- Remove avatar_s3_url column
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'business_profiles' 
        AND column_name = 'avatar_s3_url'
    ) THEN
        ALTER TABLE business_profiles DROP COLUMN avatar_s3_url;
        RAISE NOTICE 'Dropped avatar_s3_url column from business_profiles';
    END IF;
    
    -- Remove logo_s3_url column
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'business_profiles' 
        AND column_name = 'logo_s3_url'
    ) THEN
        ALTER TABLE business_profiles DROP COLUMN logo_s3_url;
        RAISE NOTICE 'Dropped logo_s3_url column from business_profiles';
    END IF;
    
    -- Remove document_s3_urls column
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'business_profiles' 
        AND column_name = 'document_s3_urls'
    ) THEN
        ALTER TABLE business_profiles DROP COLUMN document_s3_urls;
        RAISE NOTICE 'Dropped document_s3_urls column from business_profiles';
    END IF;
END $$;

-- Drop S3-related columns from visibility_check_leads
DO $$
BEGIN
    -- Remove report_s3_url column
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'visibility_check_leads' 
        AND column_name = 'report_s3_url'
    ) THEN
        ALTER TABLE visibility_check_leads DROP COLUMN report_s3_url;
        RAISE NOTICE 'Dropped report_s3_url column from visibility_check_leads';
    END IF;
    
    -- Remove report_expires_at column
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'visibility_check_leads' 
        AND column_name = 'report_expires_at'
    ) THEN
        ALTER TABLE visibility_check_leads DROP COLUMN report_expires_at;
        RAISE NOTICE 'Dropped report_expires_at column from visibility_check_leads';
    END IF;
    
    -- Remove screenshot_s3_urls column
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'visibility_check_leads' 
        AND column_name = 'screenshot_s3_urls'
    ) THEN
        ALTER TABLE visibility_check_leads DROP COLUMN screenshot_s3_urls;
        RAISE NOTICE 'Dropped screenshot_s3_urls column from visibility_check_leads';
    END IF;
END $$;

-- Drop S3-related columns from business_partners
DO $$
BEGIN
    -- Remove contract_s3_urls column
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'business_partners' 
        AND column_name = 'contract_s3_urls'
    ) THEN
        ALTER TABLE business_partners DROP COLUMN contract_s3_urls;
        RAISE NOTICE 'Dropped contract_s3_urls column from business_partners';
    END IF;
    
    -- Remove verification_document_s3_urls column
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'business_partners' 
        AND column_name = 'verification_document_s3_urls'
    ) THEN
        ALTER TABLE business_partners DROP COLUMN verification_document_s3_urls;
        RAISE NOTICE 'Dropped verification_document_s3_urls column from business_partners';
    END IF;
END $$;

-- Drop indexes created for S3 columns
DROP INDEX IF EXISTS idx_business_profiles_avatar_s3_url;
DROP INDEX IF EXISTS idx_business_profiles_logo_s3_url;
DROP INDEX IF EXISTS idx_visibility_check_leads_report_s3_url;
DROP INDEX IF EXISTS idx_visibility_check_leads_report_expires_at;

-- Drop migration tracking tables and functions
DROP VIEW IF EXISTS s3_migration_progress;
DROP TABLE IF EXISTS s3_migration_log;
DROP FUNCTION IF EXISTS generate_s3_url(TEXT, TEXT, UUID, TEXT);

-- Drop user_uploads table and all related objects
DO $$
BEGIN
    -- Drop foreign key constraints first
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_user_uploads_user_id'
    ) THEN
        ALTER TABLE user_uploads DROP CONSTRAINT fk_user_uploads_user_id;
        RAISE NOTICE 'Dropped foreign key constraint fk_user_uploads_user_id';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_user_uploads_partner_id'
    ) THEN
        ALTER TABLE user_uploads DROP CONSTRAINT fk_user_uploads_partner_id;
        RAISE NOTICE 'Dropped foreign key constraint fk_user_uploads_partner_id';
    END IF;
    
    -- Drop indexes
    DROP INDEX IF EXISTS idx_user_uploads_user_id;
    DROP INDEX IF EXISTS idx_user_uploads_partner_id;
    DROP INDEX IF EXISTS idx_user_uploads_type;
    DROP INDEX IF EXISTS idx_user_uploads_expires;
    DROP INDEX IF EXISTS idx_user_uploads_bucket;
    DROP INDEX IF EXISTS idx_user_uploads_uploaded_at;
    
    -- Drop the table
    DROP TABLE IF EXISTS user_uploads;
    RAISE NOTICE 'Dropped user_uploads table and all related indexes';
END $$;

-- Log rollback completion
DO $$
BEGIN
    RAISE NOTICE 'S3 migration rollback completed at %', now();
    RAISE NOTICE 'All S3-related schema changes have been reverted';
    RAISE NOTICE 'WARNING: Any data in S3-related columns has been permanently lost';
END $$;

COMMIT;

-- Final verification
SELECT 
    'Rollback verification: user_uploads table should not exist' as check_description,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_uploads' AND table_schema = 'public')
        THEN 'FAILED - Table still exists'
        ELSE 'PASSED - Table successfully removed'
    END as result;

SELECT 
    'Rollback verification: S3 columns should not exist in business_profiles' as check_description,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_profiles' AND column_name IN ('avatar_s3_url', 'logo_s3_url', 'document_s3_urls'))
        THEN 'FAILED - S3 columns still exist'
        ELSE 'PASSED - S3 columns successfully removed'
    END as result;