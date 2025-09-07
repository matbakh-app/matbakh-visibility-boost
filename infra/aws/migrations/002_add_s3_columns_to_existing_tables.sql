-- Migration: Add S3 columns to existing tables
-- Requirements: 4.1, 4.3
-- Date: 2025-01-31

BEGIN;

-- Add S3 columns to business_profiles table
DO $$
BEGIN
    -- Add avatar_s3_url column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'business_profiles' 
        AND column_name = 'avatar_s3_url'
    ) THEN
        ALTER TABLE business_profiles ADD COLUMN avatar_s3_url TEXT;
        COMMENT ON COLUMN business_profiles.avatar_s3_url IS 'S3 URL for business profile avatar image';
    END IF;
    
    -- Add logo_s3_url column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'business_profiles' 
        AND column_name = 'logo_s3_url'
    ) THEN
        ALTER TABLE business_profiles ADD COLUMN logo_s3_url TEXT;
        COMMENT ON COLUMN business_profiles.logo_s3_url IS 'S3 URL for business profile logo image';
    END IF;
    
    -- Add document_s3_urls column for multiple documents
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'business_profiles' 
        AND column_name = 'document_s3_urls'
    ) THEN
        ALTER TABLE business_profiles ADD COLUMN document_s3_urls JSONB DEFAULT '[]'::jsonb;
        COMMENT ON COLUMN business_profiles.document_s3_urls IS 'Array of S3 URLs for business documents';
    END IF;
END $$;

-- Add S3 columns to visibility_check_leads table
DO $$
BEGIN
    -- Add report_s3_url column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'visibility_check_leads' 
        AND column_name = 'report_s3_url'
    ) THEN
        ALTER TABLE visibility_check_leads ADD COLUMN report_s3_url TEXT;
        COMMENT ON COLUMN visibility_check_leads.report_s3_url IS 'S3 URL for generated visibility check report';
    END IF;
    
    -- Add report_expires_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'visibility_check_leads' 
        AND column_name = 'report_expires_at'
    ) THEN
        ALTER TABLE visibility_check_leads ADD COLUMN report_expires_at TIMESTAMPTZ;
        COMMENT ON COLUMN visibility_check_leads.report_expires_at IS 'Expiration date for the report file in S3';
    END IF;
    
    -- Add screenshot_s3_urls column for multiple screenshots
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'visibility_check_leads' 
        AND column_name = 'screenshot_s3_urls'
    ) THEN
        ALTER TABLE visibility_check_leads ADD COLUMN screenshot_s3_urls JSONB DEFAULT '[]'::jsonb;
        COMMENT ON COLUMN visibility_check_leads.screenshot_s3_urls IS 'Array of S3 URLs for analysis screenshots';
    END IF;
END $$;

-- Add S3 columns to business_partners table (if needed for partner-specific uploads)
DO $$
BEGIN
    -- Add contract_s3_urls column for contract documents
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'business_partners' 
        AND column_name = 'contract_s3_urls'
    ) THEN
        ALTER TABLE business_partners ADD COLUMN contract_s3_urls JSONB DEFAULT '[]'::jsonb;
        COMMENT ON COLUMN business_partners.contract_s3_urls IS 'Array of S3 URLs for partner contract documents';
    END IF;
    
    -- Add verification_document_s3_urls column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'business_partners' 
        AND column_name = 'verification_document_s3_urls'
    ) THEN
        ALTER TABLE business_partners ADD COLUMN verification_document_s3_urls JSONB DEFAULT '[]'::jsonb;
        COMMENT ON COLUMN business_partners.verification_document_s3_urls IS 'Array of S3 URLs for verification documents';
    END IF;
END $$;

-- Create indexes for S3 URL columns for better query performance
CREATE INDEX IF NOT EXISTS idx_business_profiles_avatar_s3_url ON business_profiles (avatar_s3_url) WHERE avatar_s3_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_business_profiles_logo_s3_url ON business_profiles (logo_s3_url) WHERE logo_s3_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_visibility_check_leads_report_s3_url ON visibility_check_leads (report_s3_url) WHERE report_s3_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_visibility_check_leads_report_expires_at ON visibility_check_leads (report_expires_at) WHERE report_expires_at IS NOT NULL;

COMMIT;