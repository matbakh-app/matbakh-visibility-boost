-- Add new AI-powered fields to visibility_check_results table
ALTER TABLE visibility_check_results 
ADD COLUMN IF NOT EXISTS swot_analysis JSONB,
ADD COLUMN IF NOT EXISTS benchmark_insights TEXT;

-- Add comment to document the new fields
COMMENT ON COLUMN visibility_check_results.swot_analysis IS 'AI-generated SWOT analysis with strengths, weaknesses, opportunities, threats';
COMMENT ON COLUMN visibility_check_results.benchmark_insights IS 'AI-generated insights about competitive positioning';