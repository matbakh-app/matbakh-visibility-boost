
-- Add google_account_id column to business_partners table
ALTER TABLE business_partners 
ADD COLUMN google_account_id TEXT;

-- Add index for efficient lookups
CREATE INDEX idx_business_partners_google_account_id 
ON business_partners(google_account_id);

-- Add comment for documentation
COMMENT ON COLUMN business_partners.google_account_id 
IS 'Cached Google My Business accountId (format: accounts/{accountId}) for API calls';
