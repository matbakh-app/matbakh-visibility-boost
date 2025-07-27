-- Add new AI-powered fields to visibility_check_results table
ALTER TABLE visibility_check_results 
ADD COLUMN IF NOT EXISTS swot_analysis JSONB,
ADD COLUMN IF NOT EXISTS benchmark_insights TEXT;

-- Add comment to document the new fields
COMMENT ON COLUMN visibility_check_results.swot_analysis IS 'AI-generated SWOT analysis with strengths, weaknesses, opportunities, threats';
COMMENT ON COLUMN visibility_check_results.benchmark_insights IS 'AI-generated insights about competitive positioning';

-- Add performance indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_vcr_lead_created 
  ON visibility_check_results(lead_id, created_at DESC);

-- Specialized index for completed AI analyses only
CREATE INDEX IF NOT EXISTS idx_vcr_swot_only 
  ON visibility_check_results(lead_id, created_at DESC)
  WHERE swot_analysis IS NOT NULL;

-- Add constraint to ensure SWOT analysis has proper structure (following naming convention)
ALTER TABLE visibility_check_results 
ADD CONSTRAINT chk_vcr_swot_structure 
CHECK (
  swot_analysis IS NULL OR (
    swot_analysis ? 'strengths' AND 
    swot_analysis ? 'weaknesses' AND 
    swot_analysis ? 'opportunities' AND 
    swot_analysis ? 'threats' AND
    jsonb_typeof(swot_analysis->'strengths') = 'array' AND
    jsonb_typeof(swot_analysis->'weaknesses') = 'array' AND
    jsonb_typeof(swot_analysis->'opportunities') = 'array' AND
    jsonb_typeof(swot_analysis->'threats') = 'array'
  )
);