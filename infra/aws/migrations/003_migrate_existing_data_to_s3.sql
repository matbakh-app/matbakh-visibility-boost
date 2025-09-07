-- Migration: Transform existing data for S3 migration
-- Requirements: 4.1, 4.3
-- Date: 2025-01-31
-- Note: This script prepares existing data for S3 migration but does not perform actual file transfers

BEGIN;

-- Create a temporary table to track migration progress
CREATE TABLE IF NOT EXISTS s3_migration_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  old_url TEXT,
  new_s3_url TEXT,
  migration_status TEXT DEFAULT 'pending' CHECK (migration_status IN ('pending', 'migrated', 'failed', 'skipped')),
  error_message TEXT,
  migrated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Function to generate S3 URL based on file type and ID
CREATE OR REPLACE FUNCTION generate_s3_url(
  bucket_name TEXT,
  folder_path TEXT,
  file_id UUID,
  file_extension TEXT DEFAULT 'jpg'
) RETURNS TEXT AS $$
BEGIN
  RETURN 'https://' || bucket_name || '.s3.eu-central-1.amazonaws.com/' || folder_path || '/' || file_id || '.' || file_extension;
END;
$$ LANGUAGE plpgsql;

-- Migrate business_profiles avatar URLs (if they exist)
-- This creates placeholder S3 URLs that will be populated during actual file migration
DO $$
DECLARE
  profile_record RECORD;
  new_s3_url TEXT;
BEGIN
  -- Only process records that have existing avatar data but no S3 URL yet
  FOR profile_record IN 
    SELECT id, user_id 
    FROM business_profiles 
    WHERE avatar_s3_url IS NULL 
    AND (
      -- Check for any existing avatar-related columns that might exist
      -- This is a placeholder - adjust based on actual existing schema
      id IS NOT NULL
    )
  LOOP
    -- Generate S3 URL for avatar
    new_s3_url := generate_s3_url(
      'matbakh-files-profile',
      'avatars/' || profile_record.user_id,
      profile_record.id,
      'jpg'
    );
    
    -- Log the migration intent
    INSERT INTO s3_migration_log (table_name, record_id, new_s3_url, migration_status)
    VALUES ('business_profiles', profile_record.id, new_s3_url, 'pending');
    
    -- Note: We don't update the actual S3 URL yet - this will be done after file migration
  END LOOP;
END $$;

-- Migrate visibility_check_leads report URLs (if they exist)
DO $$
DECLARE
  lead_record RECORD;
  new_s3_url TEXT;
  expires_date TIMESTAMPTZ;
BEGIN
  -- Only process records that have existing report data but no S3 URL yet
  FOR lead_record IN 
    SELECT id, created_at
    FROM visibility_check_leads 
    WHERE report_s3_url IS NULL 
    AND result_status = 'completed'
  LOOP
    -- Generate S3 URL for report
    new_s3_url := generate_s3_url(
      'matbakh-files-reports',
      'vc-reports/' || lead_record.id,
      lead_record.id,
      'pdf'
    );
    
    -- Set expiration date (30 days from creation)
    expires_date := lead_record.created_at + INTERVAL '30 days';
    
    -- Log the migration intent
    INSERT INTO s3_migration_log (table_name, record_id, new_s3_url, migration_status)
    VALUES ('visibility_check_leads', lead_record.id, new_s3_url, 'pending');
    
    -- Note: We don't update the actual S3 URL yet - this will be done after file migration
  END LOOP;
END $$;

-- Create a view to track migration progress
CREATE OR REPLACE VIEW s3_migration_progress AS
SELECT 
  table_name,
  migration_status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (PARTITION BY table_name), 2) as percentage
FROM s3_migration_log
GROUP BY table_name, migration_status
ORDER BY table_name, migration_status;

-- Create indexes for migration log
CREATE INDEX IF NOT EXISTS idx_s3_migration_log_table_record ON s3_migration_log (table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_s3_migration_log_status ON s3_migration_log (migration_status);

COMMIT;

-- Display migration summary
SELECT 
  'Migration preparation completed. Use s3_migration_progress view to track progress.' as message,
  COUNT(*) as total_records_to_migrate
FROM s3_migration_log;