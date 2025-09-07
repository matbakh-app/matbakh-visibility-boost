-- S3 File Storage Migration - Database Schema
-- This file contains the database schema updates needed for S3 file storage

-- Create user_uploads table for tracking all file uploads
CREATE TABLE IF NOT EXISTS user_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  partner_id UUID,
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  s3_url TEXT NOT NULL,
  s3_bucket TEXT NOT NULL,
  s3_key TEXT NOT NULL,
  content_type TEXT NOT NULL,
  file_size BIGINT,
  upload_type TEXT NOT NULL CHECK (upload_type IN ('avatar', 'document', 'image', 'report', 'profile')),
  is_public BOOLEAN DEFAULT false,
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  
  -- Foreign key constraints
  CONSTRAINT fk_user_uploads_user_id FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_uploads_partner_id FOREIGN KEY (partner_id) REFERENCES business_partners(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_uploads_user_id ON user_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_user_uploads_partner_id ON user_uploads(partner_id);
CREATE INDEX IF NOT EXISTS idx_user_uploads_type ON user_uploads(upload_type);
CREATE INDEX IF NOT EXISTS idx_user_uploads_expires ON user_uploads(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_uploads_bucket ON user_uploads(s3_bucket);
CREATE INDEX IF NOT EXISTS idx_user_uploads_uploaded_at ON user_uploads(uploaded_at);

-- Add S3 URL columns to existing tables
ALTER TABLE business_profiles 
ADD COLUMN IF NOT EXISTS avatar_s3_url TEXT,
ADD COLUMN IF NOT EXISTS logo_s3_url TEXT;

ALTER TABLE visibility_check_leads
ADD COLUMN IF NOT EXISTS report_s3_url TEXT,
ADD COLUMN IF NOT EXISTS report_expires_at TIMESTAMPTZ;

-- Create a view for active uploads (non-expired)
CREATE OR REPLACE VIEW active_user_uploads AS
SELECT *
FROM user_uploads
WHERE expires_at IS NULL OR expires_at > NOW();

-- Create a function to clean up expired uploads
CREATE OR REPLACE FUNCTION cleanup_expired_uploads()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM user_uploads 
  WHERE expires_at IS NOT NULL AND expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get user upload quota usage
CREATE OR REPLACE FUNCTION get_user_upload_quota(p_user_id UUID, p_month_start DATE DEFAULT DATE_TRUNC('month', CURRENT_DATE))
RETURNS TABLE(
  user_id UUID,
  month_start DATE,
  uploads_count BIGINT,
  total_size_mb NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p_user_id,
    p_month_start,
    COUNT(*)::BIGINT as uploads_count,
    ROUND(COALESCE(SUM(file_size), 0) / (1024.0 * 1024.0), 2) as total_size_mb
  FROM user_uploads
  WHERE user_uploads.user_id = p_user_id
    AND DATE_TRUNC('month', uploaded_at) = p_month_start;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE user_uploads IS 'Tracks all file uploads to S3 buckets with metadata and permissions';
COMMENT ON COLUMN user_uploads.s3_url IS 'Full S3 URL in format s3://bucket/key';
COMMENT ON COLUMN user_uploads.s3_key IS 'S3 object key (path within bucket)';
COMMENT ON COLUMN user_uploads.upload_type IS 'Type of upload: avatar, document, image, report, profile';
COMMENT ON COLUMN user_uploads.metadata IS 'Additional metadata as JSON (tags, processing info, etc.)';
COMMENT ON COLUMN user_uploads.expires_at IS 'When the file should be deleted (NULL = permanent)';

-- Grant permissions (adjust based on your RLS setup)
-- These would typically be handled by your existing RLS policies
-- GRANT SELECT, INSERT, UPDATE ON user_uploads TO authenticated;
-- GRANT USAGE ON SEQUENCE user_uploads_id_seq TO authenticated;