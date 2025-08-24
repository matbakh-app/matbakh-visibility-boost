-- Sanity check and add missing columns/tables if needed (corrected)

-- 1) Check if business_profiles.google_connected exists, add if missing
ALTER TABLE public.business_profiles 
ADD COLUMN IF NOT EXISTS google_connected boolean NOT NULL DEFAULT false;

-- 2) Create category_cross_tags table if it doesn't exist (needed for subcategory joins)
CREATE TABLE IF NOT EXISTS public.category_cross_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL,
  target_main_category_id uuid,
  target_main_category text NOT NULL,
  confidence_score numeric NOT NULL DEFAULT 1.0,
  source text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS for category_cross_tags
ALTER TABLE public.category_cross_tags ENABLE ROW LEVEL SECURITY;

-- Policies for category_cross_tags
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='category_cross_tags' AND policyname='cross_tags_read_any') THEN
    CREATE POLICY cross_tags_read_any ON public.category_cross_tags FOR SELECT
      TO anon, authenticated USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='category_cross_tags' AND policyname='cross_tags_write_service') THEN
    CREATE POLICY cross_tags_write_service ON public.category_cross_tags FOR ALL
      USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

-- 3) Create unclaimed_business_profiles table if it doesn't exist (needed for claim flow)
CREATE TABLE IF NOT EXISTS public.unclaimed_business_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid,
  place_id text,
  name text NOT NULL,
  address text,
  city text,
  country text,
  lat double precision,
  lng double precision,
  claim_status text NOT NULL DEFAULT 'unclaimed',
  claimed_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  claimed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS for unclaimed_business_profiles
ALTER TABLE public.unclaimed_business_profiles ENABLE ROW LEVEL SECURITY;

-- Policies for unclaimed_business_profiles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='unclaimed_business_profiles' AND policyname='unclaimed_read_auth') THEN
    CREATE POLICY unclaimed_read_auth ON public.unclaimed_business_profiles FOR SELECT 
      TO authenticated USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='unclaimed_business_profiles' AND policyname='unclaimed_insert_auth') THEN
    CREATE POLICY unclaimed_insert_auth ON public.unclaimed_business_profiles FOR INSERT 
      TO authenticated WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='unclaimed_business_profiles' AND policyname='unclaimed_update_claim') THEN
    CREATE POLICY unclaimed_update_claim ON public.unclaimed_business_profiles FOR UPDATE 
      TO authenticated USING (true) WITH CHECK (claimed_by_user_id = auth.uid());
  END IF;
END $$;

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS set_ts_unclaimed_profiles ON public.unclaimed_business_profiles;
CREATE TRIGGER set_ts_unclaimed_profiles
  BEFORE UPDATE ON public.unclaimed_business_profiles
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_ts_category_cross_tags ON public.category_cross_tags;
CREATE TRIGGER set_ts_category_cross_tags
  BEFORE UPDATE ON public.category_cross_tags
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

-- Create useful indexes (only after confirming columns exist)
CREATE INDEX IF NOT EXISTS idx_cross_tag_target ON public.category_cross_tags(target_main_category_id);
CREATE INDEX IF NOT EXISTS idx_cross_tag_category ON public.category_cross_tags(category_id);
CREATE INDEX IF NOT EXISTS idx_unclaimed_status ON public.unclaimed_business_profiles(claim_status);

-- Only create place_id index if the column exists in the new table we just created
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'unclaimed_business_profiles' AND column_name = 'place_id') THEN
    CREATE INDEX IF NOT EXISTS idx_unclaimed_place ON public.unclaimed_business_profiles(place_id);
  END IF;
END $$;