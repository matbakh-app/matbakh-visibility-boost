-- Task 6.4.1: Create Score History Database Schema
-- Visibility Score Evolution Tracking System
-- Created: 2025-01-09

-- Enable RLS
ALTER DATABASE postgres SET row_security = on;

-- Create score_history table for time-series tracking
CREATE TABLE IF NOT EXISTS score_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL,
    score_type VARCHAR(50) NOT NULL,
    score_value DECIMAL(5,2) NOT NULL CHECK (score_value >= 0 AND score_value <= 100),
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    source VARCHAR(100) NOT NULL DEFAULT 'visibility_check',
    meta JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Foreign key constraint
    CONSTRAINT fk_score_history_business 
        FOREIGN KEY (business_id) 
        REFERENCES business_partners(id) 
        ON DELETE CASCADE,
    
    -- Unique constraint to prevent duplicate entries
    CONSTRAINT unique_score_entry 
        UNIQUE (business_id, score_type, calculated_at)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_score_history_business_time 
    ON score_history (business_id, score_type, calculated_at DESC);

CREATE INDEX IF NOT EXISTS idx_score_history_calculated_at 
    ON score_history (calculated_at DESC);

CREATE INDEX IF NOT EXISTS idx_score_history_score_type 
    ON score_history (score_type, calculated_at DESC);

-- Create visibility_events table for tracking significant changes
CREATE TABLE IF NOT EXISTS visibility_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    event_description TEXT NOT NULL,
    score_before DECIMAL(5,2),
    score_after DECIMAL(5,2),
    change_percentage DECIMAL(5,2),
    triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    source VARCHAR(100) NOT NULL DEFAULT 'auto_detection',
    meta JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Foreign key constraint
    CONSTRAINT fk_visibility_events_business 
        FOREIGN KEY (business_id) 
        REFERENCES business_partners(id) 
        ON DELETE CASCADE
);

-- Create index for visibility events
CREATE INDEX IF NOT EXISTS idx_visibility_events_business_time 
    ON visibility_events (business_id, triggered_at DESC);

-- Create score_benchmarks table for industry comparisons
CREATE TABLE IF NOT EXISTS score_benchmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    industry_category VARCHAR(100) NOT NULL,
    region_code VARCHAR(10) NOT NULL,
    score_type VARCHAR(50) NOT NULL,
    benchmark_value DECIMAL(5,2) NOT NULL CHECK (benchmark_value >= 0 AND benchmark_value <= 100),
    sample_size INTEGER NOT NULL DEFAULT 0,
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    valid_until TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Unique constraint for benchmark entries
    CONSTRAINT unique_benchmark_entry 
        UNIQUE (industry_category, region_code, score_type, calculated_at)
);

-- Create index for benchmarks
CREATE INDEX IF NOT EXISTS idx_score_benchmarks_lookup 
    ON score_benchmarks (industry_category, region_code, score_type, calculated_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE score_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE visibility_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE score_benchmarks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for score_history
CREATE POLICY "Users can view their own score history" ON score_history
    FOR SELECT USING (
        business_id IN (
            SELECT id FROM business_partners 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "System can insert score history" ON score_history
    FOR INSERT WITH CHECK (
        -- Allow system inserts (service role)
        auth.role() = 'service_role' OR
        -- Allow authenticated users to insert for their businesses
        business_id IN (
            SELECT id FROM business_partners 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "System can update score history" ON score_history
    FOR UPDATE USING (
        auth.role() = 'service_role' OR
        business_id IN (
            SELECT id FROM business_partners 
            WHERE user_id = auth.uid()
        )
    );

-- RLS Policies for visibility_events
CREATE POLICY "Users can view their own visibility events" ON visibility_events
    FOR SELECT USING (
        business_id IN (
            SELECT id FROM business_partners 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "System can insert visibility events" ON visibility_events
    FOR INSERT WITH CHECK (
        auth.role() = 'service_role' OR
        business_id IN (
            SELECT id FROM business_partners 
            WHERE user_id = auth.uid()
        )
    );

-- RLS Policies for score_benchmarks (read-only for users)
CREATE POLICY "Users can view benchmarks" ON score_benchmarks
    FOR SELECT USING (true); -- Public read access

CREATE POLICY "Only system can manage benchmarks" ON score_benchmarks
    FOR ALL USING (auth.role() = 'service_role');

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_score_history_updated_at 
    BEFORE UPDATE ON score_history 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_score_benchmarks_updated_at 
    BEFORE UPDATE ON score_benchmarks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create helper functions for score analysis
CREATE OR REPLACE FUNCTION get_score_trend(
    p_business_id UUID,
    p_score_type VARCHAR(50),
    p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
    calculated_at TIMESTAMPTZ,
    score_value DECIMAL(5,2),
    trend_direction VARCHAR(10)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sh.calculated_at,
        sh.score_value,
        CASE 
            WHEN LAG(sh.score_value) OVER (ORDER BY sh.calculated_at) IS NULL THEN 'neutral'
            WHEN sh.score_value > LAG(sh.score_value) OVER (ORDER BY sh.calculated_at) THEN 'up'
            WHEN sh.score_value < LAG(sh.score_value) OVER (ORDER BY sh.calculated_at) THEN 'down'
            ELSE 'neutral'
        END::VARCHAR(10) as trend_direction
    FROM score_history sh
    WHERE sh.business_id = p_business_id
        AND sh.score_type = p_score_type
        AND sh.calculated_at >= NOW() - (p_days || ' days')::INTERVAL
    ORDER BY sh.calculated_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to detect score anomalies
CREATE OR REPLACE FUNCTION detect_score_anomalies(
    p_business_id UUID,
    p_score_type VARCHAR(50),
    p_threshold_percentage DECIMAL DEFAULT 20.0
)
RETURNS TABLE (
    event_date TIMESTAMPTZ,
    score_before DECIMAL(5,2),
    score_after DECIMAL(5,2),
    change_percentage DECIMAL(5,2),
    anomaly_type VARCHAR(20)
) AS $$
BEGIN
    RETURN QUERY
    WITH score_changes AS (
        SELECT 
            sh.calculated_at,
            sh.score_value,
            LAG(sh.score_value) OVER (ORDER BY sh.calculated_at) as prev_score,
            CASE 
                WHEN LAG(sh.score_value) OVER (ORDER BY sh.calculated_at) IS NOT NULL THEN
                    ((sh.score_value - LAG(sh.score_value) OVER (ORDER BY sh.calculated_at)) / 
                     LAG(sh.score_value) OVER (ORDER BY sh.calculated_at)) * 100
                ELSE 0
            END as change_pct
        FROM score_history sh
        WHERE sh.business_id = p_business_id
            AND sh.score_type = p_score_type
        ORDER BY sh.calculated_at
    )
    SELECT 
        sc.calculated_at as event_date,
        sc.prev_score as score_before,
        sc.score_value as score_after,
        sc.change_pct as change_percentage,
        CASE 
            WHEN sc.change_pct > p_threshold_percentage THEN 'spike'
            WHEN sc.change_pct < -p_threshold_percentage THEN 'drop'
            ELSE 'normal'
        END::VARCHAR(20) as anomaly_type
    FROM score_changes sc
    WHERE sc.prev_score IS NOT NULL
        AND ABS(sc.change_pct) > p_threshold_percentage
    ORDER BY sc.calculated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert sample score types for reference
INSERT INTO score_benchmarks (industry_category, region_code, score_type, benchmark_value, sample_size) VALUES
    ('restaurant', 'DE', 'overall_visibility', 65.0, 1000),
    ('restaurant', 'DE', 'google_presence', 70.0, 1000),
    ('restaurant', 'DE', 'social_media', 55.0, 1000),
    ('restaurant', 'DE', 'review_score', 75.0, 1000),
    ('restaurant', 'DE', 'local_seo', 60.0, 1000),
    ('cafe', 'DE', 'overall_visibility', 62.0, 500),
    ('cafe', 'DE', 'google_presence', 68.0, 500),
    ('cafe', 'DE', 'social_media', 58.0, 500),
    ('bar', 'DE', 'overall_visibility', 58.0, 300),
    ('bar', 'DE', 'social_media', 65.0, 300)
ON CONFLICT (industry_category, region_code, score_type, calculated_at) DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE score_history IS 'Time-series storage for visibility scores and metrics';
COMMENT ON TABLE visibility_events IS 'Log of significant score changes and events';
COMMENT ON TABLE score_benchmarks IS 'Industry and regional benchmark data for comparison';

COMMENT ON COLUMN score_history.score_type IS 'Type of score: overall_visibility, google_presence, social_media, review_score, local_seo';
COMMENT ON COLUMN score_history.meta IS 'Additional metadata like platform details, calculation method, etc.';
COMMENT ON COLUMN visibility_events.event_type IS 'Type of event: score_drop, score_spike, stagnation, improvement';
COMMENT ON COLUMN score_benchmarks.region_code IS 'ISO country/region code (DE, AT, CH, etc.)';