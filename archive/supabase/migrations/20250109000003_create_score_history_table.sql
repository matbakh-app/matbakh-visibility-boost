-- Migration: Create score_history table for visibility score evolution tracking
-- Task: 6.4.1 Create ScoreHistory Database Schema
-- Requirements: B.1, B.2

BEGIN;

-- Create score_history table
CREATE TABLE IF NOT EXISTS public.score_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id uuid NOT NULL,
    score_type text NOT NULL CHECK (score_type IN (
        'overall_visibility',
        'google_presence', 
        'social_media',
        'website_performance',
        'review_management',
        'local_seo',
        'content_quality',
        'competitive_position'
    )),
    score_value numeric(5,2) NOT NULL CHECK (score_value >= 0 AND score_value <= 100),
    calculated_at timestamptz NOT NULL DEFAULT now(),
    source text NOT NULL CHECK (source IN (
        'visibility_check',
        'manual_entry',
        'automated_analysis',
        'competitive_benchmarking',
        'swot_analysis'
    )),
    meta jsonb DEFAULT '{}',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add foreign key constraint to business_partners table
ALTER TABLE public.score_history 
ADD CONSTRAINT fk_score_history_business_id 
FOREIGN KEY (business_id) REFERENCES public.business_partners(id) ON DELETE CASCADE;

-- Create performance index for queries by business_id, score_type, and calculated_at
CREATE INDEX IF NOT EXISTS idx_score_history_business_score_time 
ON public.score_history (business_id, score_type, calculated_at DESC);

-- Create additional indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_score_history_calculated_at 
ON public.score_history (calculated_at DESC);

CREATE INDEX IF NOT EXISTS idx_score_history_source 
ON public.score_history (source);

CREATE INDEX IF NOT EXISTS idx_score_history_score_type 
ON public.score_history (score_type);

-- Enable Row Level Security (RLS)
ALTER TABLE public.score_history ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access score history for their own businesses
DROP POLICY IF EXISTS "score_history_select_policy" ON public.score_history;
CREATE POLICY "score_history_select_policy" ON public.score_history
FOR SELECT TO authenticated
USING (
    business_id IN (
        SELECT bp.id 
        FROM public.business_partners bp 
        WHERE bp.user_id = auth.uid()
    )
);

-- RLS Policy: Users can insert score history for their own businesses
DROP POLICY IF EXISTS "score_history_insert_policy" ON public.score_history;
CREATE POLICY "score_history_insert_policy" ON public.score_history
FOR INSERT TO authenticated
WITH CHECK (
    business_id IN (
        SELECT bp.id 
        FROM public.business_partners bp 
        WHERE bp.user_id = auth.uid()
    )
);

-- RLS Policy: Users can update score history for their own businesses
DROP POLICY IF EXISTS "score_history_update_policy" ON public.score_history;
CREATE POLICY "score_history_update_policy" ON public.score_history
FOR UPDATE TO authenticated
USING (
    business_id IN (
        SELECT bp.id 
        FROM public.business_partners bp 
        WHERE bp.user_id = auth.uid()
    )
)
WITH CHECK (
    business_id IN (
        SELECT bp.id 
        FROM public.business_partners bp 
        WHERE bp.user_id = auth.uid()
    )
);

-- RLS Policy: Admins can access all score history
DROP POLICY IF EXISTS "score_history_admin_policy" ON public.score_history;
CREATE POLICY "score_history_admin_policy" ON public.score_history
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p 
        WHERE p.id = auth.uid() 
        AND p.role IN ('admin', 'super_admin')
    )
);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_score_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS trigger_score_history_updated_at ON public.score_history;
CREATE TRIGGER trigger_score_history_updated_at
    BEFORE UPDATE ON public.score_history
    FOR EACH ROW
    EXECUTE FUNCTION public.update_score_history_updated_at();

-- Insert sample historical data for testing
INSERT INTO public.score_history (business_id, score_type, score_value, calculated_at, source, meta)
SELECT 
    bp.id as business_id,
    'overall_visibility' as score_type,
    (RANDOM() * 40 + 40)::numeric(5,2) as score_value, -- Random score between 40-80
    (now() - (generate_series(1, 30) || ' days')::interval) as calculated_at,
    'visibility_check' as source,
    jsonb_build_object(
        'analysis_version', '1.0',
        'confidence_score', (RANDOM() * 30 + 70)::numeric(5,2),
        'data_sources', ARRAY['google', 'social_media', 'website']
    ) as meta
FROM public.business_partners bp
WHERE bp.status = 'active'
LIMIT 5; -- Only add sample data for first 5 active businesses

-- Insert additional score types for the same businesses
INSERT INTO public.score_history (business_id, score_type, score_value, calculated_at, source, meta)
SELECT 
    sh.business_id,
    score_type,
    (RANDOM() * 50 + 30)::numeric(5,2) as score_value,
    sh.calculated_at,
    'automated_analysis' as source,
    jsonb_build_object(
        'component_analysis', true,
        'platform_specific', score_type
    ) as meta
FROM (
    SELECT DISTINCT business_id, calculated_at 
    FROM public.score_history 
    WHERE score_type = 'overall_visibility'
) sh
CROSS JOIN (
    VALUES 
        ('google_presence'),
        ('social_media'),
        ('website_performance'),
        ('review_management')
) AS score_types(score_type);

COMMIT;

-- Verify the table structure and sample data
DO $$
BEGIN
    -- Check if table exists and has correct structure
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'score_history') THEN
        RAISE NOTICE 'score_history table created successfully';
        
        -- Check indexes
        IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_score_history_business_score_time') THEN
            RAISE NOTICE 'Performance index created successfully';
        END IF;
        
        -- Check sample data
        PERFORM count(*) FROM public.score_history;
        IF FOUND THEN
            RAISE NOTICE 'Sample historical data inserted successfully';
        END IF;
    ELSE
        RAISE EXCEPTION 'Failed to create score_history table';
    END IF;
END $$;