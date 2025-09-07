-- Add missing Google metrics columns to visibility_check_results
ALTER TABLE public.visibility_check_results
ADD COLUMN IF NOT EXISTS gmb_metrics JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS ga4_metrics JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS ads_metrics JSONB DEFAULT '{}'::jsonb;

-- Add performance indexes for Google metrics JSONB columns
CREATE INDEX IF NOT EXISTS idx_vcr_gmb_metrics ON public.visibility_check_results USING gin (gmb_metrics);
CREATE INDEX IF NOT EXISTS idx_vcr_ga4_metrics ON public.visibility_check_results USING gin (ga4_metrics);
CREATE INDEX IF NOT EXISTS idx_vcr_ads_metrics ON public.visibility_check_results USING gin (ads_metrics);

-- Update any existing rows to have empty JSON objects instead of NULL
UPDATE public.visibility_check_results 
SET 
  gmb_metrics = COALESCE(gmb_metrics, '{}'::jsonb),
  ga4_metrics = COALESCE(ga4_metrics, '{}'::jsonb),
  ads_metrics = COALESCE(ads_metrics, '{}'::jsonb)
WHERE gmb_metrics IS NULL OR ga4_metrics IS NULL OR ads_metrics IS NULL;