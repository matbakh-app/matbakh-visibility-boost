-- 1) System-Insert/Update für gmb_profiles
CREATE POLICY "System manage gmb_profiles"
  ON public.gmb_profiles
  FOR ALL
  USING (auth.role() = 'service_role');

-- 2) UNIQUE constraint ga4_daily (partner_id, date)
ALTER TABLE public.ga4_daily
  ADD CONSTRAINT ga4_daily_partner_date_unique
  UNIQUE (partner_id, date);

-- 3) Default-JSON für top_queries
ALTER TABLE public.ga4_daily
  ALTER COLUMN top_queries SET DEFAULT '[]'::jsonb;

-- 4) Timeline-Index für AI-Recommendations
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_partner_created
  ON public.ai_recommendations(partner_id, created_at DESC);