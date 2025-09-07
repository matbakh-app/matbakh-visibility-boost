-- Migration: Create user_uploads table for S3 file storage
-- Requirements: 4.2, 4.5
-- Date: 2025-01-31

BEGIN;

-- Create user_uploads table
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
  file_size BIGINT NOT NULL,
  upload_type TEXT NOT NULL CHECK (upload_type IN ('avatar', 'document', 'image', 'report', 'ai-generated')),
  is_public BOOLEAN DEFAULT false,
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_uploads_user_id ON user_uploads (user_id);
CREATE INDEX IF NOT EXISTS idx_user_uploads_partner_id ON user_uploads (partner_id);
CREATE INDEX IF NOT EXISTS idx_user_uploads_type ON user_uploads (upload_type);
CREATE INDEX IF NOT EXISTS idx_user_uploads_expires ON user_uploads (expires_at);
CREATE INDEX IF NOT EXISTS idx_user_uploads_bucket ON user_uploads (s3_bucket);
CREATE INDEX IF NOT EXISTS idx_user_uploads_uploaded_at ON user_uploads (uploaded_at);

-- Add foreign key constraints to existing tables
-- Note: These will be added if the referenced tables exist
DO $$
BEGIN
    -- Add foreign key to auth.users if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        ALTER TABLE user_uploads 
        ADD CONSTRAINT fk_user_uploads_user_id 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Add foreign key to business_partners if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'business_partners') THEN
        ALTER TABLE user_uploads 
        ADD CONSTRAINT fk_user_uploads_partner_id 
        FOREIGN KEY (partner_id) REFERENCES business_partners(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add comments for documentation
COMMENT ON TABLE user_uploads IS 'Stores metadata for files uploaded to S3 buckets';
COMMENT ON COLUMN user_uploads.user_id IS 'Reference to the user who uploaded the file';
COMMENT ON COLUMN user_uploads.partner_id IS 'Optional reference to business partner';
COMMENT ON COLUMN user_uploads.filename IS 'Generated filename used in S3';
COMMENT ON COLUMN user_uploads.original_filename IS 'Original filename from user upload';
COMMENT ON COLUMN user_uploads.s3_url IS 'Full S3 URL to the file';
COMMENT ON COLUMN user_uploads.s3_bucket IS 'S3 bucket name where file is stored';
COMMENT ON COLUMN user_uploads.s3_key IS 'S3 object key (path within bucket)';
COMMENT ON COLUMN user_uploads.content_type IS 'MIME type of the uploaded file';
COMMENT ON COLUMN user_uploads.file_size IS 'File size in bytes';
COMMENT ON COLUMN user_uploads.upload_type IS 'Type of upload: avatar, document, image, report, ai-generated';
COMMENT ON COLUMN user_uploads.is_public IS 'Whether file can be accessed publicly';
COMMENT ON COLUMN user_uploads.expires_at IS 'Optional expiration date for temporary files';
COMMENT ON COLUMN user_uploads.metadata IS 'Additional metadata as JSON';

COMMIT;