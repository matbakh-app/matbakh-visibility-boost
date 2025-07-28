-- Enhanced Visibility Check Performance & BI Optimization - Complete Migration
-- This migration addresses all optimization points for scalability and data integrity

-- 1. Create ENUM types for better status management
CREATE TYPE public.visibility_check_status AS ENUM ('pending','analyzing','completed','failed','expired');
CREATE TYPE public.claim_status AS ENUM ('unclaimed','claimed','archived','disputed');
CREATE TYPE public.business_partner_status AS ENUM ('pending','active','suspended','cancelled');

-- 2. Add new columns to visibility_check_leads first
ALTER TABLE public.visibility_check_leads 
ADD COLUMN IF NOT EXISTS status_new public.visibility_check_status DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS language text DEFAULT 'de',
ADD COLUMN IF NOT EXISTS location_data jsonb DEFAULT '{"city": "", "country": "DE", "coordinates": null}'::jsonb,
ADD COLUMN IF NOT EXISTS competitor_urls text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '{}'::jsonb;

-- 3. Migrate existing status data
UPDATE public.visibility_check_leads 
SET status_new = CASE 
  WHEN status = 'pending' THEN 'pending'::public.visibility_check_status
  WHEN status = 'analyzing' THEN 'analyzing'::public.visibility_check_status
  WHEN status = 'completed' THEN 'completed'::public.visibility_check_status
  WHEN status = 'failed' THEN 'failed'::public.visibility_check_status
  ELSE 'pending'::public.visibility_check_status
END;

-- 4. Set NOT NULL constraint and drop old column
ALTER TABLE public.visibility_check_leads 
ALTER COLUMN status_new SET NOT NULL,
DROP COLUMN IF EXISTS status,
RENAME COLUMN status_new TO status;

-- 5. Add new BI columns to visibility_check_results
ALTER TABLE public.visibility_check_results
ADD COLUMN IF NOT EXISTS strengths jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS weaknesses jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS potentials jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS missing_features jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS competitor_benchmark jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS competitive_analysis jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS market_insights jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS seasonal_data jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS monetization_score integer DEFAULT 0;

-- 6. Migrate existing results data to new structured fields
UPDATE public.visibility_check_results 
SET 
  strengths = COALESCE(results->'strengths', '[]'::jsonb),
  weaknesses = COALESCE(results->'weaknesses', '[]'::jsonb),
  potentials = COALESCE(results->'potentials', '[]'::jsonb),
  missing_features = COALESCE(results->'missing_features', '[]'::jsonb),
  competitor_benchmark = COALESCE(results->'competitor_benchmark', '[]'::jsonb)
WHERE results IS NOT NULL;

-- 7. Update unclaimed_business_profiles with new status and BI fields
ALTER TABLE public.unclaimed_business_profiles
ADD COLUMN IF NOT EXISTS claim_status_new public.claim_status DEFAULT 'unclaimed',
ADD COLUMN IF NOT EXISTS market_segment text,
ADD COLUMN IF NOT EXISTS competition_level text DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS monetization_tier integer DEFAULT 1;

-- Migrate existing claim status
UPDATE public.unclaimed_business_profiles 
SET claim_status_new = CASE 
  WHEN status = 'unclaimed' THEN 'unclaimed'::public.claim_status
  WHEN status = 'claimed' THEN 'claimed'::public.claim_status
  ELSE 'unclaimed'::public.claim_status
END;

-- Set NOT NULL and drop old column
ALTER TABLE public.unclaimed_business_profiles 
ALTER COLUMN claim_status_new SET NOT NULL,
DROP COLUMN IF EXISTS status,
RENAME COLUMN claim_status_new TO claim_status;

-- 8. Update business_partners status if exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_partners' AND column_name = 'status') THEN
    ALTER TABLE public.business_partners ADD COLUMN IF NOT EXISTS status_new public.business_partner_status DEFAULT 'pending';
    
    UPDATE public.business_partners 
    SET status_new = CASE 
      WHEN status = 'pending' THEN 'pending'::public.business_partner_status
      WHEN status = 'active' THEN 'active'::public.business_partner_status
      WHEN status = 'suspended' THEN 'suspended'::public.business_partner_status
      WHEN status = 'cancelled' THEN 'cancelled'::public.business_partner_status
      ELSE 'pending'::public.business_partner_status
    END;
    
    ALTER TABLE public.business_partners 
    ALTER COLUMN status_new SET NOT NULL,
    DROP COLUMN status,
    RENAME COLUMN status_new TO status;
  END IF;
END $$;

-- 9. Create visibility_check_history table with proper constraints
CREATE TABLE IF NOT EXISTS public.visibility_check_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.visibility_check_leads(id) ON DELETE CASCADE,
  partner_id uuid REFERENCES public.business_partners(id) ON DELETE SET NULL,
  snapshot_date date NOT NULL DEFAULT CURRENT_DATE,
  visibility_score numeric,
  strengths jsonb DEFAULT '[]'::jsonb,
  weaknesses jsonb DEFAULT '[]'::jsonb,
  potentials jsonb DEFAULT '[]'::jsonb,
  competitive_position jsonb DEFAULT '{}'::jsonb,
  market_trends jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE (lead_id, snapshot_date)
);

-- 10. Create performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_visibility_leads_status_created 
ON public.visibility_check_leads(status, created_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_visibility_leads_user_email 
ON public.visibility_check_leads(user_id, email);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_visibility_results_lead_partner 
ON public.visibility_check_results(lead_id, partner_id, created_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_unclaimed_profiles_claim_lead 
ON public.unclaimed_business_profiles(claim_status, lead_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_business_partners_user_status 
ON public.business_partners(user_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gmb_categories_popular_sort 
ON public.gmb_categories(is_popular, sort_order);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_visibility_history_snapshot_date 
ON public.visibility_check_history(snapshot_date);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_visibility_history_partner_date 
ON public.visibility_check_history(partner_id, snapshot_date);

-- 11. Add foreign key constraints with CASCADE strategies
ALTER TABLE public.visibility_check_results
DROP CONSTRAINT IF EXISTS fk_visibility_results_lead,
ADD CONSTRAINT fk_visibility_results_lead 
  FOREIGN KEY (lead_id) REFERENCES public.visibility_check_leads(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE public.visibility_check_results
DROP CONSTRAINT IF EXISTS fk_visibility_results_partner,
ADD CONSTRAINT fk_visibility_results_partner 
  FOREIGN KEY (partner_id) REFERENCES public.business_partners(id) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE public.unclaimed_business_profiles
DROP CONSTRAINT IF EXISTS fk_unclaimed_profiles_lead,
ADD CONSTRAINT fk_unclaimed_profiles_lead 
  FOREIGN KEY (lead_id) REFERENCES public.visibility_check_leads(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- 12. Create materialized view for analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS public.visibility_analytics_summary AS
SELECT 
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as total_checks,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_checks,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_checks,
  AVG(CASE WHEN results->>'visibility_score' ~ '^[0-9\.]+$' 
    THEN (results->>'visibility_score')::numeric ELSE NULL END) as avg_visibility_score,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT email) as unique_emails
FROM public.visibility_check_leads
WHERE created_at >= NOW() - INTERVAL '24 months'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

CREATE UNIQUE INDEX IF NOT EXISTS idx_visibility_analytics_month 
ON public.visibility_analytics_summary(month);

-- 13. Create trigger function for history snapshots (on results table)
CREATE OR REPLACE FUNCTION public.create_visibility_history_snapshot()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create snapshot when visibility results are updated
  IF TG_OP = 'UPDATE' AND OLD.results IS DISTINCT FROM NEW.results THEN
    INSERT INTO public.visibility_check_history (
      lead_id,
      partner_id,
      snapshot_date,
      visibility_score,
      strengths,
      weaknesses,
      potentials,
      competitive_position
    ) VALUES (
      NEW.lead_id,
      NEW.partner_id,
      CURRENT_DATE,
      (NEW.results->>'visibility_score')::numeric,
      NEW.strengths,
      NEW.weaknesses,
      NEW.potentials,
      NEW.competitive_analysis
    )
    ON CONFLICT (lead_id, snapshot_date) 
    DO UPDATE SET
      visibility_score = EXCLUDED.visibility_score,
      strengths = EXCLUDED.strengths,
      weaknesses = EXCLUDED.weaknesses,
      potentials = EXCLUDED.potentials,
      competitive_position = EXCLUDED.competitive_position;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. Create trigger on visibility_check_results
DROP TRIGGER IF EXISTS trigger_visibility_history_snapshot ON public.visibility_check_results;
CREATE TRIGGER trigger_visibility_history_snapshot
  AFTER UPDATE ON public.visibility_check_results
  FOR EACH ROW
  EXECUTE FUNCTION public.create_visibility_history_snapshot();

-- 15. Create function to refresh analytics
CREATE OR REPLACE FUNCTION public.refresh_visibility_analytics()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.visibility_analytics_summary;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 16. RLS Policies for new tables and fields

-- History table policies
ALTER TABLE public.visibility_check_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own visibility history"
ON public.visibility_check_history FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.visibility_check_leads l
    WHERE l.id = visibility_check_history.lead_id 
    AND (l.user_id = auth.uid() OR l.email = (auth.jwt() ->> 'email'))
  )
);

CREATE POLICY "System can manage visibility history"
ON public.visibility_check_history FOR ALL
USING (auth.role() = 'service_role');

CREATE POLICY "Partners can view their own history"
ON public.visibility_check_history FOR SELECT
USING (
  partner_id IN (
    SELECT bp.id FROM public.business_partners bp 
    WHERE bp.user_id = auth.uid()
  )
);

-- Materialized view access (admins and service role only)
REVOKE ALL ON public.visibility_analytics_summary FROM PUBLIC;
GRANT SELECT ON public.visibility_analytics_summary TO service_role;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.create_visibility_history_snapshot() TO service_role;
GRANT EXECUTE ON FUNCTION public.refresh_visibility_analytics() TO service_role;

-- 17. Create admin function to access analytics
CREATE OR REPLACE FUNCTION public.get_visibility_analytics()
RETURNS TABLE (
  month timestamptz,
  total_checks bigint,
  completed_checks bigint,
  failed_checks bigint,
  avg_visibility_score numeric,
  unique_users bigint,
  unique_emails bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM public.visibility_analytics_summary
  ORDER BY month DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to admins
GRANT EXECUTE ON FUNCTION public.get_visibility_analytics() TO service_role;

-- Create policy for admin access to analytics function
CREATE POLICY "Admins can access analytics"
ON public.visibility_analytics_summary FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- 18. Add helpful comments
COMMENT ON TABLE public.visibility_check_history IS 'Historical snapshots of visibility check results for trend analysis';
COMMENT ON MATERIALIZED VIEW public.visibility_analytics_summary IS 'Monthly aggregated analytics for visibility checks performance';
COMMENT ON FUNCTION public.refresh_visibility_analytics() IS 'Refreshes the visibility analytics materialized view - should be called regularly via cron';

-- Migration complete