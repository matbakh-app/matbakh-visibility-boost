-- Add missing columns for double opt-in and reporting workflow
ALTER TABLE visibility_check_leads 
ADD COLUMN IF NOT EXISTS verification_token TEXT,
ADD COLUMN IF NOT EXISTS double_optin_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS double_optin_confirmed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS double_optin_confirmed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS report_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- Create index for fast verification token lookups
CREATE INDEX IF NOT EXISTS idx_visibility_leads_verification_token 
ON visibility_check_leads (verification_token) 
WHERE verification_token IS NOT NULL;

-- Create index for status-based queries
CREATE INDEX IF NOT EXISTS idx_visibility_leads_status 
ON visibility_check_leads (status, created_at);

-- Add comments for documentation
COMMENT ON COLUMN visibility_check_leads.verification_token IS 'UUID token for double opt-in verification, set to NULL after confirmation';
COMMENT ON COLUMN visibility_check_leads.status IS 'Lead status: pending, confirmed, completed, failed, expired';
COMMENT ON COLUMN visibility_check_leads.double_optin_confirmed IS 'Whether user confirmed email via double opt-in link';
COMMENT ON COLUMN visibility_check_leads.double_optin_sent_at IS 'Timestamp when double opt-in email was sent';
COMMENT ON COLUMN visibility_check_leads.double_optin_confirmed_at IS 'Timestamp when user confirmed double opt-in';
COMMENT ON COLUMN visibility_check_leads.report_sent_at IS 'Timestamp when full report was sent via email';