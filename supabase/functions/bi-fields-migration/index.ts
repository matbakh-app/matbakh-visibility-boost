BEGIN;

-- Phase 1.3: BI Fields Migration
-- Add Business Intelligence fields to existing tables

-- Step 1: Add BI fields to visibility_check_results
ALTER TABLE public.visibility_check_results 
  ADD COLUMN IF NOT EXISTS competitive_analysis JSONB DEFAULT '{}' NOT NULL,
  ADD COLUMN IF NOT EXISTS market_insights JSONB DEFAULT '{}' NOT NULL,
  ADD COLUMN IF NOT EXISTS seasonal_data JSONB DEFAULT '{}' NOT NULL,
  ADD COLUMN IF NOT EXISTS monetization_score NUMERIC DEFAULT 0 NOT NULL
    CHECK (monetization_score >= 0 AND monetization_score <= 100);

-- Step 2: Add BI fields to unclaimed_business_profiles  
ALTER TABLE public.unclaimed_business_profiles
  ADD COLUMN IF NOT EXISTS competition_level TEXT DEFAULT 'medium' NOT NULL 
    CHECK (competition_level IN ('low', 'medium', 'high')),
  ADD COLUMN IF NOT EXISTS monetization_tier TEXT DEFAULT 'standard' NOT NULL
    CHECK (monetization_tier IN ('basic', 'standard', 'premium', 'enterprise')),
  ADD COLUMN IF NOT EXISTS market_analysis JSONB DEFAULT '{}' NOT NULL;

-- Step 3: Create performance indexes (without CONCURRENTLY for transaction safety)
CREATE INDEX IF NOT EXISTS idx_visibility_results_competitive_analysis 
  ON public.visibility_check_results USING GIN (competitive_analysis);

CREATE INDEX IF NOT EXISTS idx_visibility_results_market_insights 
  ON public.visibility_check_results USING GIN (market_insights);

CREATE INDEX IF NOT EXISTS idx_visibility_results_seasonal_data 
  ON public.visibility_check_results USING GIN (seasonal_data);

CREATE INDEX IF NOT EXISTS idx_visibility_results_monetization_score 
  ON public.visibility_check_results (monetization_score);

CREATE INDEX IF NOT EXISTS idx_unclaimed_competition_level 
  ON public.unclaimed_business_profiles (competition_level);

CREATE INDEX IF NOT EXISTS idx_unclaimed_monetization_tier 
  ON public.unclaimed_business_profiles (monetization_tier);

CREATE INDEX IF NOT EXISTS idx_unclaimed_market_analysis 
  ON public.unclaimed_business_profiles USING GIN (market_analysis);

-- Step 4: Add comprehensive documentation
COMMENT ON COLUMN public.visibility_check_results.competitive_analysis IS 'Competitive analysis data including competitor scores, gaps, and market positioning insights';
COMMENT ON COLUMN public.visibility_check_results.market_insights IS 'Market insights including trends, opportunities, and industry-specific recommendations';
COMMENT ON COLUMN public.visibility_check_results.seasonal_data IS 'Seasonal analysis data including performance patterns and seasonal opportunities';
COMMENT ON COLUMN public.visibility_check_results.monetization_score IS 'Overall monetization potential score (0-100) based on business profile analysis';

COMMENT ON COLUMN public.unclaimed_business_profiles.competition_level IS 'Competition level in the local market: low, medium, or high';
COMMENT ON COLUMN public.unclaimed_business_profiles.monetization_tier IS 'Monetization tier classification: basic, standard, premium, or enterprise';
COMMENT ON COLUMN public.unclaimed_business_profiles.market_analysis IS 'Market analysis data including local competition and opportunity assessment';

COMMIT;