-- Enhanced Status ENUM Migration with Explicit Defaults
-- Migration: Add status ENUM types and migrate existing columns

-- 1. Create ENUM types (idempotent)
DO $$
BEGIN
  -- visibility_check_status for leads
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'visibility_check_status') THEN
    CREATE TYPE public.visibility_check_status AS ENUM ('pending','analyzing','completed','failed','expired');
  END IF;
  
  -- claim_status for unclaimed profiles
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'claim_status') THEN
    CREATE TYPE public.claim_status AS ENUM ('unclaimed','claimed','archived','disputed');
  END IF;
  
  -- business_partner_status for partners
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'business_partner_status') THEN
    CREATE TYPE public.business_partner_status AS ENUM ('pending','active','suspended','cancelled');
  END IF;
  
  -- action_type for visibility check actions
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'visibility_action_type') THEN
    CREATE TYPE public.visibility_action_type AS ENUM (
      'analysis_started', 'analysis_completed', 'analysis_failed',
      'gdpr_consent', 'marketing_consent', 'email_verified',
      'profile_claimed', 'report_generated', 'report_sent'
    );
  END IF;
END$$;

-- 2. Add new ENUM columns with defaults
ALTER TABLE public.visibility_check_leads 
ADD COLUMN IF NOT EXISTS status_new visibility_check_status DEFAULT 'pending';

ALTER TABLE public.unclaimed_business_profiles 
ADD COLUMN IF NOT EXISTS claim_status_new claim_status DEFAULT 'unclaimed';

ALTER TABLE public.business_partners 
ADD COLUMN IF NOT EXISTS status_new business_partner_status DEFAULT 'pending';

-- 3. Migrate data to new ENUM columns
UPDATE public.visibility_check_leads 
SET status_new = 
  CASE 
    WHEN status = 'pending' THEN 'pending'::visibility_check_status
    WHEN status = 'analyzing' THEN 'analyzing'::visibility_check_status
    WHEN status = 'completed' THEN 'completed'::visibility_check_status
    WHEN status = 'failed' THEN 'failed'::visibility_check_status
    ELSE 'pending'::visibility_check_status
  END
WHERE status IS NOT NULL;

UPDATE public.unclaimed_business_profiles 
SET claim_status_new = 
  CASE 
    WHEN claim_status = 'unclaimed' THEN 'unclaimed'::claim_status
    WHEN claim_status = 'claimed' THEN 'claimed'::claim_status
    ELSE 'unclaimed'::claim_status
  END
WHERE claim_status IS NOT NULL;

UPDATE public.business_partners 
SET status_new = 
  CASE 
    WHEN status = 'pending' THEN 'pending'::business_partner_status
    WHEN status = 'active' THEN 'active'::business_partner_status
    WHEN status = 'suspended' THEN 'suspended'::business_partner_status
    WHEN status = 'cancelled' THEN 'cancelled'::business_partner_status
    ELSE 'pending'::business_partner_status
  END
WHERE status IS NOT NULL;

-- 4. Drop old columns and rename new ones with explicit defaults
-- visibility_check_leads
ALTER TABLE public.visibility_check_leads DROP COLUMN IF EXISTS status;
ALTER TABLE public.visibility_check_leads RENAME COLUMN status_new TO status;
ALTER TABLE public.visibility_check_leads ALTER COLUMN status SET NOT NULL;
ALTER TABLE public.visibility_check_leads ALTER COLUMN status SET DEFAULT 'pending';

-- unclaimed_business_profiles  
ALTER TABLE public.unclaimed_business_profiles DROP COLUMN IF EXISTS claim_status;
ALTER TABLE public.unclaimed_business_profiles RENAME COLUMN claim_status_new TO claim_status;
ALTER TABLE public.unclaimed_business_profiles ALTER COLUMN claim_status SET NOT NULL;
ALTER TABLE public.unclaimed_business_profiles ALTER COLUMN claim_status SET DEFAULT 'unclaimed';

-- business_partners
ALTER TABLE public.business_partners DROP COLUMN IF EXISTS status;
ALTER TABLE public.business_partners RENAME COLUMN status_new TO status;
ALTER TABLE public.business_partners ALTER COLUMN status SET NOT NULL;
ALTER TABLE public.business_partners ALTER COLUMN status SET DEFAULT 'pending';

-- 5. Create visibility_check_actions table (if not exists)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS public.visibility_check_actions (
  id          UUID                    PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id     UUID                    NOT NULL REFERENCES public.visibility_check_leads(id) ON DELETE CASCADE,
  action_type visibility_action_type  NOT NULL,
  details     JSONB                   DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ            NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ            NOT NULL DEFAULT now()
);

-- 6. Documentation
COMMENT ON TABLE public.visibility_check_actions IS 'Tracks user actions and events throughout the visibility check process';
COMMENT ON COLUMN public.visibility_check_actions.action_type IS 'Action type: analysis_started, analysis_completed, gdpr_consent, etc.';
COMMENT ON COLUMN public.visibility_check_actions.details IS 'Additional metadata for the action';

-- 7. Enable RLS and create policies
ALTER TABLE public.visibility_check_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visibility_check_actions FORCE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can insert visibility actions for their leads" ON public.visibility_check_actions;
DROP POLICY IF EXISTS "Users can view visibility actions for their leads" ON public.visibility_check_actions;
DROP POLICY IF EXISTS "Users can update their own visibility actions" ON public.visibility_check_actions;
DROP POLICY IF EXISTS "Admins can manage visibility actions" ON public.visibility_check_actions;
DROP POLICY IF EXISTS "System can manage visibility actions" ON public.visibility_check_actions;

-- Create RLS policies
CREATE POLICY "Users can insert visibility actions for their leads"
  ON public.visibility_check_actions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.visibility_check_leads l
      WHERE l.id = visibility_check_actions.lead_id
        AND (l.user_id = auth.uid() OR l.email = (auth.jwt() ->> 'email'))
    )
  );

CREATE POLICY "Users can view visibility actions for their leads"
  ON public.visibility_check_actions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.visibility_check_leads l
      WHERE l.id = visibility_check_actions.lead_id
        AND (l.user_id = auth.uid() OR l.email = (auth.jwt() ->> 'email'))
    )
  );

CREATE POLICY "Users can update their own visibility actions"
  ON public.visibility_check_actions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.visibility_check_leads l
      WHERE l.id = visibility_check_actions.lead_id
        AND (l.user_id = auth.uid() OR l.email = (auth.jwt() ->> 'email'))
    )
  );

CREATE POLICY "Admins can manage visibility actions"
  ON public.visibility_check_actions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "System can manage visibility actions"
  ON public.visibility_check_actions FOR ALL
  USING (auth.role() = 'service_role');

-- 8. Create trigger for updated_at
DROP TRIGGER IF EXISTS update_visibility_actions_updated_at ON public.visibility_check_actions;
CREATE TRIGGER update_visibility_actions_updated_at
  BEFORE UPDATE ON public.visibility_check_actions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 9. Create performance indexes
CREATE INDEX IF NOT EXISTS idx_visibility_actions_lead_id_created
  ON public.visibility_check_actions (lead_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_visibility_actions_action_type_created
  ON public.visibility_check_actions (action_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_visibility_actions_lead_action_created
  ON public.visibility_check_actions (lead_id, action_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_visibility_actions_lead_updated
  ON public.visibility_check_actions (lead_id, updated_at DESC);

-- 10. Create indexes for ENUM columns
CREATE INDEX IF NOT EXISTS idx_visibility_leads_status 
  ON public.visibility_check_leads (status);
CREATE INDEX IF NOT EXISTS idx_unclaimed_profiles_claim_status 
  ON public.unclaimed_business_profiles (claim_status);
CREATE INDEX IF NOT EXISTS idx_business_partners_status 
  ON public.business_partners (status);