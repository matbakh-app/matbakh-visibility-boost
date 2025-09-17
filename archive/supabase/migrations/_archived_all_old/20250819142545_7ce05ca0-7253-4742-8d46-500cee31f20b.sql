-- Critical fixes for category_cross_tags relations, claim security, and function permissions

-- 1) Relations for category_cross_tags (required for PostgREST joins)

-- FK: category_cross_tags.category_id -> gmb_categories.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'cct_category_fk'
  ) THEN
    ALTER TABLE public.category_cross_tags
      ADD CONSTRAINT cct_category_fk
      FOREIGN KEY (category_id) REFERENCES public.gmb_categories(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- FK: category_cross_tags.target_main_category_id -> gmb_categories.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'cct_target_fk'
  ) THEN
    ALTER TABLE public.category_cross_tags
      ADD CONSTRAINT cct_target_fk
      FOREIGN KEY (target_main_category_id) REFERENCES public.gmb_categories(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- NOT NULL + Confidence-Check
ALTER TABLE public.category_cross_tags
  ALTER COLUMN target_main_category_id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'cct_confidence_between_0_1'
  ) THEN
    ALTER TABLE public.category_cross_tags
      ADD CONSTRAINT cct_confidence_between_0_1
      CHECK (confidence_score BETWEEN 0 AND 1);
  END IF;
END $$;

-- 2) Secure claim RLS for unclaimed_business_profiles

-- Remove the insecure old policy
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public'
      AND tablename='unclaimed_business_profiles'
      AND policyname='unclaimed_update_claim'
  ) THEN
    DROP POLICY "unclaimed_update_claim" ON public.unclaimed_business_profiles;
  END IF;
END $$;

-- 1) Claim policy (only if unclaimed & no owner)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public'
      AND tablename='unclaimed_business_profiles'
      AND policyname='unclaimed_claim'
  ) THEN
    CREATE POLICY unclaimed_claim
    ON public.unclaimed_business_profiles
    FOR UPDATE TO authenticated
    USING (claim_status = 'unclaimed' AND claimed_by_user_id IS NULL)
    WITH CHECK (claim_status = 'claimed' AND claimed_by_user_id = auth.uid());
  END IF;
END $$;

-- 2) Owner updates policy (only the claimer can modify)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public'
      AND tablename='unclaimed_business_profiles'
      AND policyname='unclaimed_update_owner'
  ) THEN
    CREATE POLICY unclaimed_update_owner
    ON public.unclaimed_business_profiles
    FOR UPDATE TO authenticated
    USING (claimed_by_user_id = auth.uid())
    WITH CHECK (claimed_by_user_id = auth.uid());
  END IF;
END $$;

-- Prevent duplicates by place_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname='unclaimed_place_unique'
  ) THEN
    ALTER TABLE public.unclaimed_business_profiles
      ADD CONSTRAINT unclaimed_place_unique UNIQUE(place_id);
  END IF;
EXCEPTION WHEN unique_violation THEN
  -- If duplicates exist, handle gracefully by skipping constraint
  RAISE NOTICE 'Skipping unique constraint due to existing duplicates';
END $$;

-- FK to leads (cleaner relational graph)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname='unclaimed_lead_fk'
  ) THEN
    ALTER TABLE public.unclaimed_business_profiles
      ADD CONSTRAINT unclaimed_lead_fk
      FOREIGN KEY (lead_id) REFERENCES public.visibility_check_leads(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- 3) Ensure function permissions after CREATE OR REPLACE
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.trigger_set_timestamp() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_updated_at() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_updated_at() TO anon, authenticated;