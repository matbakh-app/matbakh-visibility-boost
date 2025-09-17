-- Remove Supabase Storage Configuration for S3 Migration
-- This migration removes the visibility-reports storage bucket and related policies
-- as we're migrating to AWS S3 for file storage

-- Drop storage policies
DROP POLICY IF EXISTS "Users can view their own visibility reports" ON storage.objects;
DROP POLICY IF EXISTS "System can manage visibility reports" ON storage.objects;

-- Remove storage bucket (this will also remove any files in the bucket)
DELETE FROM storage.buckets WHERE id = 'visibility-reports';

-- Add comment to document the migration
COMMENT ON TABLE visibility_check_leads IS 'Migrated to S3 storage for report files. report_url now contains CloudFront URLs instead of Supabase storage URLs.';