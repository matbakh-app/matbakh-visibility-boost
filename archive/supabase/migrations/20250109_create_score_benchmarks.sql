-- Create score_benchmarks table for industry benchmark comparison
-- Task 6.4.5: Industry Benchmark Comparison

-- Create the score_benchmarks table
CREATE TABLE IF NOT EXISTS public.score_benchmarks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    industry_id TEXT NOT NULL,
    region_id TEXT NOT NULL,
    score_type TEXT NOT NULL CHECK (score_type IN ('visibility', 'google_rating', 'review_count', 'social_engagement', 'website_traffic')),
    benchmark_value DECIMAL(10,2) NOT NULL,
    percentile_25 DECIMAL(10,2) NOT NULL,
    percentile_50 DECIMAL(10,2) NOT NULL,
    percentile_75 DECIMAL(10,2) NOT NULL,
    percentile_90 DECIMAL(10,2) NOT NULL,
    sample_size INTEGER NOT NULL DEFAULT 0,
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    data_source TEXT NOT NULL DEFAULT 'internal',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create unique constraint for industry_id, region_id, score_type combination
CREATE UNIQUE INDEX IF NOT EXISTS idx_score_benchmarks_unique 
ON public.score_benchmarks (industry_id, region_id, score_type);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_score_benchmarks_industry 
ON public.score_benchmarks (industry_id);

CREATE INDEX IF NOT EXISTS idx_score_benchmarks_region 
ON public.score_benchmarks (region_id);

CREATE INDEX IF NOT EXISTS idx_score_benchmarks_score_type 
ON public.score_benchmarks (score_type);

CREATE INDEX IF NOT EXISTS idx_score_benchmarks_last_updated 
ON public.score_benchmarks (last_updated DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_score_benchmarks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS trigger_score_benchmarks_updated_at ON public.score_benchmarks;
CREATE TRIGGER trigger_score_benchmarks_updated_at
    BEFORE UPDATE ON public.score_benchmarks
    FOR EACH ROW
    EXECUTE FUNCTION update_score_benchmarks_updated_at();

-- Enable Row Level Security
ALTER TABLE public.score_benchmarks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Allow read access to authenticated users
CREATE POLICY "Allow read access to authenticated users" ON public.score_benchmarks
    FOR SELECT TO authenticated USING (true);

-- Allow insert/update/delete for admin users only
CREATE POLICY "Allow admin full access" ON public.score_benchmarks
    FOR ALL TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

-- Insert sample benchmark data for German restaurant industry
INSERT INTO public.score_benchmarks (
    industry_id, 
    region_id, 
    score_type, 
    benchmark_value, 
    percentile_25, 
    percentile_50, 
    percentile_75, 
    percentile_90, 
    sample_size, 
    data_source,
    metadata
) VALUES 
-- National Restaurant Benchmarks
('restaurant', 'national', 'visibility', 72.5, 45.0, 65.0, 85.0, 95.0, 2500, 'industry_survey', '{"business_size": "all", "franchise_type": "all"}'),
('restaurant', 'national', 'google_rating', 4.2, 3.8, 4.1, 4.5, 4.8, 2500, 'google_api', '{"min_reviews": 10}'),
('restaurant', 'national', 'review_count', 125, 25, 75, 200, 400, 2500, 'google_api', '{"platform": "google"}'),
('restaurant', 'national', 'social_engagement', 8.5, 2.0, 5.5, 12.0, 25.0, 1800, 'social_media_analysis', '{"platforms": ["instagram", "facebook"]}'),

-- Bavaria Restaurant Benchmarks
('restaurant', 'bavaria', 'visibility', 75.2, 48.0, 68.0, 88.0, 96.0, 450, 'regional_survey', '{"business_size": "all", "franchise_type": "all"}'),
('restaurant', 'bavaria', 'google_rating', 4.3, 3.9, 4.2, 4.6, 4.9, 450, 'google_api', '{"min_reviews": 10}'),
('restaurant', 'bavaria', 'review_count', 135, 30, 85, 220, 420, 450, 'google_api', '{"platform": "google"}'),

-- Munich Restaurant Benchmarks
('restaurant', 'munich', 'visibility', 78.8, 52.0, 72.0, 92.0, 98.0, 180, 'city_analysis', '{"business_size": "all", "franchise_type": "all"}'),
('restaurant', 'munich', 'google_rating', 4.4, 4.0, 4.3, 4.7, 4.9, 180, 'google_api', '{"min_reviews": 15}'),
('restaurant', 'munich', 'review_count', 165, 45, 110, 280, 500, 180, 'google_api', '{"platform": "google"}'),

-- Berlin Restaurant Benchmarks
('restaurant', 'berlin', 'visibility', 76.5, 50.0, 70.0, 90.0, 97.0, 320, 'city_analysis', '{"business_size": "all", "franchise_type": "all"}'),
('restaurant', 'berlin', 'google_rating', 4.1, 3.7, 4.0, 4.4, 4.7, 320, 'google_api', '{"min_reviews": 12}'),
('restaurant', 'berlin', 'review_count', 145, 35, 95, 240, 450, 320, 'google_api', '{"platform": "google"}'),

-- Hotel Industry Benchmarks (National)
('hotel', 'national', 'visibility', 68.3, 40.0, 60.0, 82.0, 94.0, 800, 'industry_survey', '{"business_size": "all", "franchise_type": "all"}'),
('hotel', 'national', 'google_rating', 4.0, 3.5, 3.9, 4.3, 4.6, 800, 'google_api', '{"min_reviews": 20}'),
('hotel', 'national', 'review_count', 85, 15, 45, 130, 280, 800, 'google_api', '{"platform": "google"}'),

-- Retail Industry Benchmarks (National)
('retail', 'national', 'visibility', 65.8, 38.0, 58.0, 80.0, 92.0, 1200, 'industry_survey', '{"business_size": "all", "franchise_type": "all"}'),
('retail', 'national', 'google_rating', 4.1, 3.6, 4.0, 4.4, 4.7, 1200, 'google_api', '{"min_reviews": 8}'),
('retail', 'national', 'review_count', 95, 18, 55, 150, 320, 1200, 'google_api', '{"platform": "google"}');

-- Add comment for documentation
COMMENT ON TABLE public.score_benchmarks IS 'Industry and regional benchmark data for business performance comparison';
COMMENT ON COLUMN public.score_benchmarks.industry_id IS 'Industry identifier (restaurant, hotel, retail, etc.)';
COMMENT ON COLUMN public.score_benchmarks.region_id IS 'Region identifier (national, bavaria, munich, berlin, etc.)';
COMMENT ON COLUMN public.score_benchmarks.score_type IS 'Type of score being benchmarked';
COMMENT ON COLUMN public.score_benchmarks.benchmark_value IS 'Average/median benchmark value for the industry/region';
COMMENT ON COLUMN public.score_benchmarks.percentile_25 IS '25th percentile value';
COMMENT ON COLUMN public.score_benchmarks.percentile_50 IS '50th percentile (median) value';
COMMENT ON COLUMN public.score_benchmarks.percentile_75 IS '75th percentile value';
COMMENT ON COLUMN public.score_benchmarks.percentile_90 IS '90th percentile value';
COMMENT ON COLUMN public.score_benchmarks.sample_size IS 'Number of businesses in the benchmark sample';
COMMENT ON COLUMN public.score_benchmarks.metadata IS 'Additional metadata about the benchmark (business size, franchise type, etc.)';