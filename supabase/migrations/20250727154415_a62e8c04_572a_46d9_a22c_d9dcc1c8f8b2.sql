-- Add Google metrics columns to business_profiles for real data storage
ALTER TABLE public.business_profiles
ADD COLUMN gmb_metrics JSONB DEFAULT '{}',
ADD COLUMN ga4_metrics JSONB DEFAULT '{}', 
ADD COLUMN ads_metrics JSONB DEFAULT '{}';

-- Add indexes for better query performance
CREATE INDEX idx_business_profiles_gmb_metrics ON public.business_profiles USING GIN(gmb_metrics);
CREATE INDEX idx_business_profiles_ga4_metrics ON public.business_profiles USING GIN(ga4_metrics);
CREATE INDEX idx_business_profiles_ads_metrics ON public.business_profiles USING GIN(ads_metrics);

-- Extend google_oauth_tokens for additional Google services
ALTER TABLE public.google_oauth_tokens
ADD COLUMN service_type TEXT DEFAULT 'general',
ADD COLUMN gmb_account_id TEXT,
ADD COLUMN ga4_property_id TEXT,
ADD COLUMN ads_customer_id TEXT;

-- Add index for service_type lookup
CREATE INDEX idx_google_oauth_tokens_service_type ON public.google_oauth_tokens(service_type);
CREATE INDEX idx_google_oauth_tokens_user_service ON public.google_oauth_tokens(user_id, service_type);