-- Enhanced Visibility System Phase 2 - Production-Ready Migration (Corrected)
-- This migration enhances the visibility check system with improved data structure,
-- analytics capabilities, and comprehensive tracking.

-- Create ENUM types for better data consistency
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lead_status') THEN
    CREATE TYPE lead_status AS ENUM ('pending', 'analyzing', 'completed', 'failed', 'expired');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'analysis_provider') THEN
    CREATE TYPE analysis_provider AS ENUM ('bedrock', 'mockAnalysis', 'manual');
  END IF;
END $$;

-- Extend visibility_check_leads with new tracking fields
ALTER TABLE visibility_check_leads 
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'de',
ADD COLUMN IF NOT EXISTS location_data JSONB DEFAULT '{"city": "", "country": "", "region": "", "lat": null, "lng": null}'::jsonb,
ADD COLUMN IF NOT EXISTS competitor_urls TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{"facebook": "", "instagram": "", "tiktok": ""}'::jsonb,
ADD COLUMN IF NOT EXISTS lead_priority TEXT DEFAULT 'medium' CHECK (lead_priority IN ('low', 'medium', 'high', 'urgent')),
ADD COLUMN IF NOT EXISTS utm_source TEXT,
ADD COLUMN IF NOT EXISTS utm_medium TEXT,
ADD COLUMN IF NOT EXISTS utm_campaign TEXT;

-- Extend visibility_check_results with structured analytics
ALTER TABLE visibility_check_results 
ADD COLUMN IF NOT EXISTS visibility_score NUMERIC(5,2) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS recommendations JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS competitive_analysis JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS market_insights JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS seasonal_data JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS provider analysis_provider DEFAULT 'mockAnalysis';

-- Create visibility_check_history table for tracking changes
CREATE TABLE IF NOT EXISTS visibility_check_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES visibility_check_leads(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  visibility_score NUMERIC(5,2),
  google_score NUMERIC(5,2),
  facebook_score NUMERIC(5,2),
  instagram_score NUMERIC(5,2),
  recommendations JSONB DEFAULT '[]'::jsonb,
  potentials JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(lead_id, snapshot_date)
);

-- Add updated_at trigger for history table
CREATE OR REPLACE FUNCTION update_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_visibility_history_updated_at ON visibility_check_history;
CREATE TRIGGER update_visibility_history_updated_at
  BEFORE UPDATE ON visibility_check_history
  FOR EACH ROW
  EXECUTE FUNCTION update_history_updated_at();

-- Extend competitive_analysis table with BI fields
ALTER TABLE competitive_analysis 
ADD COLUMN IF NOT EXISTS analysis_depth TEXT DEFAULT 'basic' CHECK (analysis_depth IN ('basic', 'detailed', 'comprehensive')),
ADD COLUMN IF NOT EXISTS market_position_score NUMERIC(5,2) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS competitive_gaps JSONB DEFAULT '[]'::jsonb;

-- Create performance indexes for new fields
CREATE INDEX IF NOT EXISTS idx_visibility_leads_language ON visibility_check_leads(language);
CREATE INDEX IF NOT EXISTS idx_visibility_leads_priority ON visibility_check_leads(lead_priority);
CREATE INDEX IF NOT EXISTS idx_visibility_leads_utm_source ON visibility_check_leads(utm_source);
CREATE INDEX IF NOT EXISTS idx_visibility_leads_created_date ON visibility_check_leads(DATE(created_at));
CREATE INDEX IF NOT EXISTS idx_visibility_results_provider ON visibility_check_results(provider);
CREATE INDEX IF NOT EXISTS idx_visibility_results_score ON visibility_check_results(visibility_score);
CREATE INDEX IF NOT EXISTS idx_visibility_history_snapshot ON visibility_check_history(snapshot_date);

-- Create GIN indexes for JSONB fields
CREATE INDEX IF NOT EXISTS idx_visibility_leads_location_data ON visibility_check_leads USING GIN(location_data);
CREATE INDEX IF NOT EXISTS idx_visibility_leads_social_links ON visibility_check_leads USING GIN(social_links);
CREATE INDEX IF NOT EXISTS idx_visibility_results_recommendations ON visibility_check_results USING GIN(recommendations);
CREATE INDEX IF NOT EXISTS idx_visibility_results_competitive ON visibility_check_results USING GIN(competitive_analysis);
CREATE INDEX IF NOT EXISTS idx_visibility_results_market ON visibility_check_results USING GIN(market_insights);
CREATE INDEX IF NOT EXISTS idx_visibility_history_recommendations ON visibility_check_history USING GIN(recommendations);

-- Migrate existing data from results JSONB to dedicated columns (consistent key names)
UPDATE visibility_check_results 
SET 
  visibility_score = COALESCE((results->>'overallScore')::numeric, 0.0),
  recommendations = COALESCE(results->'quickWins', '[]'::jsonb),
  competitive_analysis = COALESCE(results->'benchmarks', '{}'::jsonb),
  market_insights = COALESCE(results->'categoryInsights', '{}'::jsonb),
  seasonal_data = COALESCE(results->'seasonalData', '{}'::jsonb)
WHERE results IS NOT NULL 
  AND visibility_score IS NULL;

-- Create simplified trigger to populate history when analysis completes
CREATE OR REPLACE FUNCTION populate_visibility_history()
RETURNS TRIGGER AS $$
DECLARE
  platform_data JSONB;
BEGIN
  -- Only insert when status changes to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    
    -- Extract platform scores from competitive_analysis or set defaults
    platform_data := COALESCE(NEW.competitive_analysis, '{}'::jsonb);
    
    INSERT INTO visibility_check_history (
      lead_id,
      snapshot_date,
      visibility_score,
      google_score,
      facebook_score,
      instagram_score,
      recommendations,
      potentials
    ) VALUES (
      NEW.lead_id,
      CURRENT_DATE,
      NEW.visibility_score,
      COALESCE((platform_data->'google'->>'score')::numeric, 0.0),
      COALESCE((platform_data->'facebook'->>'score')::numeric, 0.0),
      COALESCE((platform_data->'instagram'->>'score')::numeric, 0.0),
      NEW.recommendations,
      NEW.swot_opportunities
    )
    ON CONFLICT (lead_id, snapshot_date) 
    DO UPDATE SET
      visibility_score = EXCLUDED.visibility_score,
      google_score = EXCLUDED.google_score,
      facebook_score = EXCLUDED.facebook_score,
      instagram_score = EXCLUDED.instagram_score,
      recommendations = EXCLUDED.recommendations,
      potentials = EXCLUDED.potentials,
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_populate_visibility_history ON visibility_check_results;
CREATE TRIGGER trigger_populate_visibility_history
  AFTER UPDATE ON visibility_check_results
  FOR EACH ROW
  EXECUTE FUNCTION populate_visibility_history();

-- Create materialized view for analytics with temporal dimension
DROP MATERIALIZED VIEW IF EXISTS visibility_analytics_summary;
CREATE MATERIALIZED VIEW visibility_analytics_summary AS
SELECT 
  l.main_category,
  l.language,
  DATE_TRUNC('month', l.created_at) as month,
  COUNT(*) as total_leads,
  COUNT(CASE WHEN l.status = 'completed' THEN 1 END) as completed_analyses,
  AVG(CASE WHEN r.visibility_score > 0 THEN r.visibility_score END) as avg_visibility_score,
  COUNT(CASE WHEN l.gdpr_consent = true THEN 1 END) as gdpr_consents,
  COUNT(CASE WHEN l.marketing_consent = true THEN 1 END) as marketing_consents,
  MAX(l.created_at) as latest_lead_date,
  COUNT(CASE WHEN l.lead_priority = 'high' THEN 1 END) as high_priority_leads,
  COUNT(CASE WHEN l.lead_priority = 'urgent' THEN 1 END) as urgent_leads
FROM visibility_check_leads l
LEFT JOIN visibility_check_results r ON l.id = r.lead_id
GROUP BY l.main_category, l.language, DATE_TRUNC('month', l.created_at);

-- Create unique index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_visibility_analytics_summary_unique 
ON visibility_analytics_summary(main_category, language, month);

-- Create refresh function for materialized view
CREATE OR REPLACE FUNCTION refresh_visibility_analytics()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY visibility_analytics_summary;
  
  -- Log the refresh operation if google_job_queue exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'google_job_queue') THEN
    INSERT INTO google_job_queue (job_type, payload, status)
    VALUES (
      'analytics_refresh',
      jsonb_build_object('refresh_time', now(), 'view_name', 'visibility_analytics_summary'),
      'completed'
    );
  END IF;
END;
$$;

-- Create secure function to access analytics (alternative to direct view access)
CREATE OR REPLACE FUNCTION get_visibility_analytics_summary(
  p_user_role TEXT DEFAULT NULL,
  p_category_filter TEXT DEFAULT NULL,
  p_language_filter TEXT DEFAULT 'de'
)
RETURNS TABLE(
  main_category TEXT,
  language TEXT,
  month TIMESTAMPTZ,
  total_leads BIGINT,
  completed_analyses BIGINT,
  avg_visibility_score NUMERIC,
  gdpr_consents BIGINT,
  marketing_consents BIGINT,
  latest_lead_date TIMESTAMPTZ,
  high_priority_leads BIGINT,
  urgent_leads BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only admins can access full analytics
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  RETURN QUERY
  SELECT 
    vas.main_category,
    vas.language,
    vas.month,
    vas.total_leads,
    vas.completed_analyses,
    vas.avg_visibility_score,
    vas.gdpr_consents,
    vas.marketing_consents,
    vas.latest_lead_date,
    vas.high_priority_leads,
    vas.urgent_leads
  FROM visibility_analytics_summary vas
  WHERE (p_category_filter IS NULL OR vas.main_category = p_category_filter)
    AND (p_language_filter IS NULL OR vas.language = p_language_filter)
  ORDER BY vas.month DESC, vas.main_category;
END;
$$;

-- Create comprehensive RLS policies

-- RLS for visibility_check_history
ALTER TABLE visibility_check_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own visibility history" ON visibility_check_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM visibility_check_leads l 
      WHERE l.id = visibility_check_history.lead_id 
        AND (l.user_id = auth.uid() OR l.email = (auth.jwt() ->> 'email'))
    )
  );

CREATE POLICY "System can manage visibility history" ON visibility_check_history
  FOR ALL USING (auth.role() = 'service_role');

-- Enhanced RLS for visibility_check_results (BI protection)
DROP POLICY IF EXISTS "Users can view basic results data" ON visibility_check_results;
CREATE POLICY "Users can view basic results data" ON visibility_check_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM visibility_check_leads l 
      WHERE l.id = visibility_check_results.lead_id 
        AND (l.user_id = auth.uid() OR l.email = (auth.jwt() ->> 'email'))
    )
  );

DROP POLICY IF EXISTS "System can manage results data" ON visibility_check_results;
CREATE POLICY "System can manage results data" ON visibility_check_results
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Admins can access BI fields" ON visibility_check_results;
CREATE POLICY "Admins can access BI fields" ON visibility_check_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Prevent accidental deletion of results (idempotent)
DROP POLICY IF EXISTS "Prevent unauthorized deletion of results" ON visibility_check_results;
CREATE POLICY "Prevent unauthorized deletion of results" ON visibility_check_results
  FOR DELETE USING (false);

-- Add table comments for documentation
COMMENT ON TABLE visibility_check_history IS 'Historical snapshots of visibility analysis results for trend tracking';
COMMENT ON COLUMN visibility_check_history.snapshot_date IS 'Date when this snapshot was taken (unique per lead)';
COMMENT ON COLUMN visibility_check_history.google_score IS 'Google platform visibility score';
COMMENT ON COLUMN visibility_check_history.facebook_score IS 'Facebook platform visibility score';
COMMENT ON COLUMN visibility_check_history.instagram_score IS 'Instagram platform visibility score';
COMMENT ON COLUMN visibility_check_history.potentials IS 'Identified opportunities from SWOT analysis';

COMMENT ON MATERIALIZED VIEW visibility_analytics_summary IS 'Aggregated analytics for business intelligence and reporting with temporal dimension';

COMMENT ON FUNCTION refresh_visibility_analytics() IS 'Refreshes the analytics materialized view and logs the operation';
COMMENT ON FUNCTION get_visibility_analytics_summary(TEXT, TEXT, TEXT) IS 'Secure function to access analytics data (admin-only)';