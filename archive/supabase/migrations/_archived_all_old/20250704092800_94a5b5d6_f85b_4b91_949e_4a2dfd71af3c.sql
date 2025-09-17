-- 20250704_000_basetables.sql
-- Smart Restaurant Dashboard – Basis-Tabellen + Grund-Policies
--------------------------------------------------------------------------------
-- 0) Hilfsfunktion updated_at (falls noch nicht vorhanden)
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

--------------------------------------------------------------------------------
-- 1) Google-My-Business Tages-Snapshot
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.gmb_profiles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id       UUID NOT NULL REFERENCES public.business_partners(id) ON DELETE CASCADE,
  snapshot_date    DATE NOT NULL DEFAULT current_date,
  google_location_id TEXT,
  business_name    TEXT,
  address          TEXT,
  phone            TEXT,
  website          TEXT,
  google_rating    NUMERIC(2,1),
  total_reviews    INTEGER DEFAULT 0,
  category         TEXT,
  photos_count     INTEGER DEFAULT 0,
  posts_count      INTEGER DEFAULT 0,
  verification_status TEXT DEFAULT 'unverified',
  last_synced      TIMESTAMPTZ DEFAULT now(),
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT gmb_profiles_partner_date_unique UNIQUE (partner_id, snapshot_date)
);

ALTER TABLE public.gmb_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Partners manage own gmb" ON public.gmb_profiles;
CREATE POLICY "Partners manage own gmb" ON public.gmb_profiles
  FOR ALL
  USING (partner_id IN (SELECT id FROM business_partners WHERE user_id = auth.uid()))
  WITH CHECK (partner_id IN (SELECT id FROM business_partners WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "System manage gmb_profiles" ON public.gmb_profiles;
CREATE POLICY "System manage gmb_profiles" ON public.gmb_profiles
  FOR ALL USING (auth.role() = 'service_role');

DROP TRIGGER IF EXISTS trg_gmb_profiles_updated_at ON public.gmb_profiles;
CREATE TRIGGER trg_gmb_profiles_updated_at
  BEFORE UPDATE ON public.gmb_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_gmb_profiles_partner_date
  ON public.gmb_profiles(partner_id, snapshot_date DESC);

--------------------------------------------------------------------------------
-- 2) Google-Analytics-4 Tages­werte
--------------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ga4_daily') THEN
    CREATE TABLE public.ga4_daily (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      partner_id    UUID NOT NULL REFERENCES public.business_partners(id) ON DELETE CASCADE,
      date          DATE NOT NULL,
      sessions      INTEGER DEFAULT 0,
      page_views    INTEGER DEFAULT 0,
      unique_users  INTEGER DEFAULT 0,
      bounce_rate   NUMERIC(5,2) DEFAULT 0.0,
      avg_session_duration NUMERIC(8,2) DEFAULT 0.0,
      conversions   INTEGER DEFAULT 0,
      conversion_rate NUMERIC(5,2) DEFAULT 0.0,
      top_pages     JSONB DEFAULT '[]'::jsonb,
      top_queries   JSONB DEFAULT '[]'::jsonb,
      traffic_sources JSONB DEFAULT '{}'::jsonb,
      device_breakdown JSONB DEFAULT '{}'::jsonb,
      created_at    TIMESTAMPTZ DEFAULT now(),
      updated_at    TIMESTAMPTZ DEFAULT now(),
      CONSTRAINT ga4_daily_partner_date_unique UNIQUE (partner_id, date)
    );
  END IF;
END$$;

ALTER TABLE public.ga4_daily ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Partners view own ga4" ON public.ga4_daily;
CREATE POLICY "Partners view own ga4" ON public.ga4_daily
  FOR SELECT
  USING (partner_id IN (SELECT id FROM business_partners WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "System insert/update ga4" ON public.ga4_daily;
CREATE POLICY "System insert/update ga4" ON public.ga4_daily
  FOR ALL USING (auth.role() = 'service_role');

CREATE TRIGGER trg_ga4_daily_updated_at
  BEFORE UPDATE ON public.ga4_daily
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_ga4_daily_partner_date
  ON public.ga4_daily(partner_id, date DESC);

--------------------------------------------------------------------------------
-- 3) AI-Empfehlungen
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_recommendations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id    UUID NOT NULL REFERENCES public.business_partners(id) ON DELETE CASCADE,
  recommendation_type TEXT NOT NULL CHECK (recommendation_type IN ('gmb_optimization','content_suggestion','performance_improvement','seo_tip')),
  title         TEXT NOT NULL,
  description   TEXT NOT NULL,
  priority      TEXT DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  status        TEXT DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','dismissed')),
  metadata      JSONB DEFAULT '{}'::jsonb,
  estimated_impact TEXT,
  implementation_difficulty TEXT DEFAULT 'medium' CHECK (implementation_difficulty IN ('easy','medium','hard')),
  expires_at    TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Partners manage own ai" ON public.ai_recommendations;
CREATE POLICY "Partners manage own ai" ON public.ai_recommendations
  FOR ALL
  USING (partner_id IN (SELECT id FROM business_partners WHERE user_id = auth.uid()))
  WITH CHECK (partner_id IN (SELECT id FROM business_partners WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "System manage ai" ON public.ai_recommendations;
CREATE POLICY "System manage ai" ON public.ai_recommendations
  FOR ALL USING (auth.role() = 'service_role');

CREATE TRIGGER trg_ai_recommendations_updated_at
  BEFORE UPDATE ON public.ai_recommendations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_ai_recommendations_partner_created
  ON public.ai_recommendations(partner_id, created_at DESC);