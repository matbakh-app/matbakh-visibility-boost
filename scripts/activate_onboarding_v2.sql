-- ============================================
-- ACTIVATE ONBOARDING V2 + VC TOKEN FIX
-- ============================================

BEGIN;

-- 1) Feature Flags (idempotent)
INSERT INTO public.feature_flags (flag_name, enabled, value, description) VALUES
  ('onboarding_v2_live', true, 'null', 'Enable Onboarding V2 system'),
  ('onboarding_v1_legacy', false, 'null', 'Disable legacy onboarding form'),
  ('onboarding_guard_live', true, 'null', 'Enable onboarding redirect guard')
ON CONFLICT (flag_name) DO UPDATE SET
  enabled = EXCLUDED.enabled,
  value = EXCLUDED.value,
  updated_at = now();

-- 2) Profile columns for onboarding tracking (idempotent)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS onboarding_complete boolean NOT NULL DEFAULT false;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS onboarding_started_at timestamptz;

-- 3) Apply Onboarding v2 Schema (idempotent)
-- Restaurant Profiles (Stammdaten)
CREATE TABLE IF NOT EXISTS public.restaurant_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  slug text UNIQUE,
  street text, 
  city text, 
  zip text, 
  country text DEFAULT 'DE',
  phone text, 
  email text,
  opening_hours jsonb, -- {mon:[["09:00","18:00"],...]}
  created_at timestamptz DEFAULT now(), 
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS restaurant_profiles_owner_idx ON public.restaurant_profiles(owner_id);
CREATE INDEX IF NOT EXISTS restaurant_profiles_slug_idx ON public.restaurant_profiles(slug);

-- Brand Assets
CREATE TABLE IF NOT EXISTS public.brand_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_id uuid REFERENCES public.restaurant_profiles(id) ON DELETE SET NULL,
  logo_url text,
  colors text[], -- ["#AA3D2E","#F4E6D0"]
  tone text, -- "freundlich-direkt"
  created_at timestamptz DEFAULT now(), 
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS brand_assets_owner_idx ON public.brand_assets(owner_id);

-- Social Channel Types
DO $$ BEGIN
  CREATE TYPE public.social_channel AS ENUM ('gmb','instagram','facebook','tiktok','website');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Connected Channels
CREATE TABLE IF NOT EXISTS public.connected_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_id uuid REFERENCES public.restaurant_profiles(id) ON DELETE SET NULL,
  channel public.social_channel NOT NULL,
  external_id text, 
  meta jsonb, 
  connected_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS connected_channels_unique 
  ON public.connected_channels(owner_id, channel);

-- Menu Sources
CREATE TABLE IF NOT EXISTS public.menu_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_id uuid REFERENCES public.restaurant_profiles(id) ON DELETE SET NULL,
  kind text CHECK (kind IN ('pdf','url','image','manual')),
  url text, 
  meta jsonb, 
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS menu_sources_owner_idx ON public.menu_sources(owner_id);

-- Onboarding Progress
CREATE TABLE IF NOT EXISTS public.onboarding_progress (
  owner_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_step text DEFAULT 'welcome',
  steps jsonb DEFAULT '{}'::jsonb, -- {"welcome":true,"brand":{...}}
  completed boolean DEFAULT false,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- 4) Enable RLS on all tables
ALTER TABLE public.restaurant_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connected_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_progress ENABLE ROW LEVEL SECURITY;

-- 5) RLS Policies - Own rows only (idempotent)
DROP POLICY IF EXISTS "own rows" ON public.restaurant_profiles;
CREATE POLICY "own rows" ON public.restaurant_profiles
  FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "own rows" ON public.brand_assets;
CREATE POLICY "own rows" ON public.brand_assets
  FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "own rows" ON public.connected_channels;
CREATE POLICY "own rows" ON public.connected_channels
  FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "own rows" ON public.menu_sources;
CREATE POLICY "own rows" ON public.menu_sources
  FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "own row" ON public.onboarding_progress;
CREATE POLICY "own row" ON public.onboarding_progress
  FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- Admin policies for monitoring
DROP POLICY IF EXISTS "admin read all" ON public.restaurant_profiles;
CREATE POLICY "admin read all" ON public.restaurant_profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin'))
  );

DROP POLICY IF EXISTS "admin read all" ON public.onboarding_progress;
CREATE POLICY "admin read all" ON public.onboarding_progress
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin'))
  );

-- 6) Helper functions (idempotent)
CREATE OR REPLACE FUNCTION public.get_onboarding_progress(user_id uuid DEFAULT auth.uid())
RETURNS jsonb AS $$
DECLARE
  progress_data jsonb;
BEGIN
  SELECT to_jsonb(op.*) INTO progress_data
  FROM public.onboarding_progress op
  WHERE op.owner_id = user_id;
  
  RETURN coalesce(progress_data, '{"completed": false, "current_step": "welcome"}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.init_onboarding_progress(user_id uuid DEFAULT auth.uid())
RETURNS jsonb AS $$
DECLARE
  progress_data jsonb;
BEGIN
  INSERT INTO public.onboarding_progress (owner_id, current_step, steps, completed)
  VALUES (user_id, 'welcome', '{}'::jsonb, false)
  ON CONFLICT (owner_id) DO NOTHING;
  
  RETURN public.get_onboarding_progress(user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7) Update triggers for updated_at (idempotent)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_restaurant_profiles_updated_at ON public.restaurant_profiles;
CREATE TRIGGER update_restaurant_profiles_updated_at
  BEFORE UPDATE ON public.restaurant_profiles
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_brand_assets_updated_at ON public.brand_assets;
CREATE TRIGGER update_brand_assets_updated_at
  BEFORE UPDATE ON public.brand_assets
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- 8) VC Result Token Table (if not exists)
CREATE TABLE IF NOT EXISTS public.vc_result_tokens (
  token text PRIMARY KEY,
  lead_id uuid NOT NULL,
  result_data jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '30 days'),
  used_at timestamptz,
  use_count integer DEFAULT 0
);

CREATE INDEX IF NOT EXISTS vc_result_tokens_lead_idx ON public.vc_result_tokens(lead_id);
CREATE INDEX IF NOT EXISTS vc_result_tokens_expires_idx ON public.vc_result_tokens(expires_at);

-- RLS for VC tokens (public read with valid token)
ALTER TABLE public.vc_result_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read valid tokens" ON public.vc_result_tokens;
CREATE POLICY "public read valid tokens" ON public.vc_result_tokens
  FOR SELECT USING (expires_at > now());

-- 9) Backfill existing users to have onboarding_complete = false (for testing)
-- Uncomment this line if you want to test the onboarding flow with existing users:
-- UPDATE public.profiles SET onboarding_complete = false WHERE onboarding_complete IS NULL OR onboarding_complete = true;

COMMIT;

-- Success message
SELECT 'Onboarding v2 activated successfully!' as status;