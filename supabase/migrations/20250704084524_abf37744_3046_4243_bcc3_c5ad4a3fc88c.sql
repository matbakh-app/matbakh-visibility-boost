-- 0) snapshot_date nachrüsten (falls noch nicht vorhanden)
ALTER TABLE public.gmb_profiles
  ADD COLUMN IF NOT EXISTS snapshot_date date NOT NULL DEFAULT current_date;

-- 1) System-Insert/Update für gmb_profiles
CREATE POLICY "System manage gmb_profiles"
  ON public.gmb_profiles
  FOR ALL
  USING (auth.role() = 'service_role');

-- 2) UNIQUE constraint ga4_daily (partner_id, date)
ALTER TABLE public.ga4_daily
  ADD CONSTRAINT ga4_daily_partner_date_unique
  UNIQUE (partner_id, date);

-- 3) Besserer UNIQUE-Constraint für gmb_profiles (Partner + snapshot_date)
ALTER TABLE public.gmb_profiles
  DROP CONSTRAINT IF EXISTS gmb_profiles_partner_id_key;

ALTER TABLE public.gmb_profiles
  DROP CONSTRAINT IF EXISTS gmb_profiles_partner_date_unique;

ALTER TABLE public.gmb_profiles
  ADD CONSTRAINT gmb_profiles_partner_date_unique
  UNIQUE (partner_id, snapshot_date);

-- 4) Default-JSON für top_queries
ALTER TABLE public.ga4_daily
  ALTER COLUMN top_queries SET DEFAULT '[]'::jsonb;

-- 5) Timeline-Index für AI-Recommendations optimiert
DROP INDEX IF EXISTS idx_ai_recommendations_status;
CREATE INDEX idx_ai_recommendations_partner_status
  ON public.ai_recommendations(partner_id, status, created_at DESC);