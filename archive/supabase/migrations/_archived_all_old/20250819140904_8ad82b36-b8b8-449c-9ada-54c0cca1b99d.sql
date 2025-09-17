-- Task 5 & 6: Complete RLS and schema alignment (Fixed syntax)

-- 1) Add optional fields used in hooks to visibility_check_leads
ALTER TABLE public.visibility_check_leads
  ADD COLUMN IF NOT EXISTS benchmarks text[],
  ADD COLUMN IF NOT EXISTS location_data jsonb,
  ADD COLUMN IF NOT EXISTS social_links jsonb,
  ADD COLUMN IF NOT EXISTS competitor_urls text[];

-- 2) google_oauth_tokens - Enable RLS and secure policies
ALTER TABLE public.google_oauth_tokens ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='google_oauth_tokens' AND policyname='own_tokens_select') THEN
    CREATE POLICY own_tokens_select ON public.google_oauth_tokens FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='google_oauth_tokens' AND policyname='own_tokens_insert') THEN
    CREATE POLICY own_tokens_insert ON public.google_oauth_tokens FOR INSERT
      WITH CHECK (auth.uid() = user_id);
    CREATE POLICY own_tokens_update ON public.google_oauth_tokens FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
    CREATE POLICY own_tokens_delete ON public.google_oauth_tokens FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- 3) fb_* tables - Partner-bound RLS (using DO blocks)
ALTER TABLE public.fb_conversions_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fb_conversion_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='fb_conversions_config' AND policyname='partner_config_read') THEN
    CREATE POLICY partner_config_read ON public.fb_conversions_config FOR SELECT
    USING (partner_id IN (SELECT id FROM public.business_partners WHERE user_id = auth.uid()));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='fb_conversions_config' AND policyname='partner_config_write') THEN
    CREATE POLICY partner_config_write ON public.fb_conversions_config FOR INSERT
    WITH CHECK (partner_id IN (SELECT id FROM public.business_partners WHERE user_id = auth.uid()));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='fb_conversions_config' AND policyname='partner_config_update') THEN
    CREATE POLICY partner_config_update ON public.fb_conversions_config FOR UPDATE
    USING (partner_id IN (SELECT id FROM public.business_partners WHERE user_id = auth.uid()))
    WITH CHECK (partner_id IN (SELECT id FROM public.business_partners WHERE user_id = auth.uid()));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='fb_conversion_logs' AND policyname='partner_logs_read') THEN
    CREATE POLICY partner_logs_read ON public.fb_conversion_logs FOR SELECT
    USING (partner_id IN (SELECT id FROM public.business_partners WHERE user_id = auth.uid()));
  END IF;
END $$;

-- 4) category_search_logs - User select policy
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='category_search_logs' AND policyname='Users can view their own search logs') THEN
    CREATE POLICY "Users can view their own search logs"
    ON public.category_search_logs FOR SELECT
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- 5) Ensure profiles.role exists for admin function
ALTER TABLE IF EXISTS public.profiles
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user';

-- Task 6: Triggers & Index fine-tuning

-- Re-use trigger function
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS trigger 
LANGUAGE plpgsql 
AS $$
BEGIN 
  NEW.updated_at := now(); 
  RETURN NEW; 
END $$;

-- updated_at on critical tables + triggers
ALTER TABLE public.fb_conversions_config ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
DROP TRIGGER IF EXISTS set_ts_fb_conf ON public.fb_conversions_config;
CREATE TRIGGER set_ts_fb_conf BEFORE UPDATE ON public.fb_conversions_config
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

ALTER TABLE public.google_oauth_tokens ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
DROP TRIGGER IF EXISTS set_ts_google_tokens ON public.google_oauth_tokens;
CREATE TRIGGER set_ts_google_tokens BEFORE UPDATE ON public.google_oauth_tokens
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

-- Index tuning for performance
CREATE INDEX IF NOT EXISTS idx_vcl_email_created ON public.visibility_check_leads(email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vcl_status_created ON public.visibility_check_leads(analysis_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_events_type ON public.lead_events(event_type);
CREATE INDEX IF NOT EXISTS idx_oauth_expires ON public.google_oauth_tokens(expires_at);

-- Ensure google_photos has proper JSON array default
ALTER TABLE public.business_profiles ALTER COLUMN google_photos SET DEFAULT '[]'::jsonb;