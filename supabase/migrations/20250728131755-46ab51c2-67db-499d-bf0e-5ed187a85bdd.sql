-- Phase 1.3: BI Fields Migration
-- Adding comprehensive business intelligence fields for advanced analytics and reporting

BEGIN;

-- Step 1: Add BI fields to visibility_check_results
ALTER TABLE public.visibility_check_results 
  ADD COLUMN IF NOT EXISTS competitive_analysis JSONB DEFAULT '{}'::jsonb NOT NULL,
  ADD COLUMN IF NOT EXISTS market_insights JSONB DEFAULT '{}'::jsonb NOT NULL,
  ADD COLUMN IF NOT EXISTS seasonal_data JSONB DEFAULT '{}'::jsonb NOT NULL,
  ADD COLUMN IF NOT EXISTS monetization_score NUMERIC DEFAULT 0 NOT NULL
    CHECK (monetization_score >= 0 AND monetization_score <= 100);

-- Step 2: Add BI fields to unclaimed_business_profiles
ALTER TABLE public.unclaimed_business_profiles 
  ADD COLUMN IF NOT EXISTS competition_level TEXT DEFAULT 'medium' NOT NULL
    CHECK (competition_level IN ('low', 'medium', 'high')),
  ADD COLUMN IF NOT EXISTS monetization_tier TEXT DEFAULT 'standard' NOT NULL
    CHECK (monetization_tier IN ('basic', 'standard', 'premium', 'enterprise')),
  ADD COLUMN IF NOT EXISTS market_analysis JSONB DEFAULT '{}'::jsonb NOT NULL;

-- Step 3: Create performance indexes (without CONCURRENTLY due to transaction)
CREATE INDEX IF NOT EXISTS idx_visibility_results_monetization_score 
  ON public.visibility_check_results(monetization_score DESC);

CREATE INDEX IF NOT EXISTS idx_visibility_results_competitive_analysis 
  ON public.visibility_check_results USING GIN(competitive_analysis);

CREATE INDEX IF NOT EXISTS idx_visibility_results_market_insights 
  ON public.visibility_check_results USING GIN(market_insights);

CREATE INDEX IF NOT EXISTS idx_visibility_results_seasonal_data 
  ON public.visibility_check_results USING GIN(seasonal_data);

CREATE INDEX IF NOT EXISTS idx_unclaimed_profiles_competition_level 
  ON public.unclaimed_business_profiles(competition_level);

CREATE INDEX IF NOT EXISTS idx_unclaimed_profiles_monetization_tier 
  ON public.unclaimed_business_profiles(monetization_tier);

CREATE INDEX IF NOT EXISTS idx_unclaimed_profiles_market_analysis 
  ON public.unclaimed_business_profiles USING GIN(market_analysis);

-- Step 4: Add comprehensive documentation
COMMENT ON COLUMN public.visibility_check_results.competitive_analysis IS 'JSONB object storing competitor analysis data, market positioning, and competitive gaps';
COMMENT ON COLUMN public.visibility_check_results.market_insights IS 'JSONB object containing market trends, opportunities, and industry-specific insights';
COMMENT ON COLUMN public.visibility_check_results.seasonal_data IS 'JSONB object with seasonal performance patterns and time-based recommendations';
COMMENT ON COLUMN public.visibility_check_results.monetization_score IS 'Numeric score (0-100) indicating revenue generation potential based on visibility and market factors';

COMMENT ON COLUMN public.unclaimed_business_profiles.competition_level IS 'Assessment of competitive landscape: low, medium, or high competition in the business area';
COMMENT ON COLUMN public.unclaimed_business_profiles.monetization_tier IS 'Business monetization category: basic, standard, premium, or enterprise tier';
COMMENT ON COLUMN public.unclaimed_business_profiles.market_analysis IS 'Market analysis data including local competition and opportunity assessment';

COMMIT;