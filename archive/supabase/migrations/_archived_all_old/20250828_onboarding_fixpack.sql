-- ============================================
-- ONBOARDING V2 FIXPACK - UX & Data Structure
-- ============================================

BEGIN;

-- 1.1 Restaurant Profiles: Adresse aufsplitten
ALTER TABLE public.restaurant_profiles 
ADD COLUMN IF NOT EXISTS street text,
ADD COLUMN IF NOT EXISTS house_number text,
ADD COLUMN IF NOT EXISTS postal_code text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS country text DEFAULT 'DE';

-- Remove old combined address field if it exists
-- ALTER TABLE public.restaurant_profiles DROP COLUMN IF EXISTS address;

-- 1.2 Private Profile: Namen getrennt speichern
CREATE TABLE IF NOT EXISTS public.private_profile (
  id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  first_name text,
  last_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add columns if table already exists
ALTER TABLE public.private_profile 
ADD COLUMN IF NOT EXISTS first_name text,
ADD COLUMN IF NOT EXISTS last_name text;

-- Enable RLS
ALTER TABLE public.private_profile ENABLE ROW LEVEL SECURITY;

-- RLS Policy for private_profile
DROP POLICY IF EXISTS "own private profile" ON public.private_profile;
CREATE POLICY "own private profile" ON public.private_profile
  FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "admin read private profiles" ON public.private_profile;
CREATE POLICY "admin read private profiles" ON public.private_profile
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin'))
  );

-- 1.3 Wettbewerber im VC-Lead erfassen
ALTER TABLE public.visibility_check_leads 
ADD COLUMN IF NOT EXISTS competitors text[]; -- bis 3 Einträge (name/url)

-- 1.4 VC Result Tokens erweitern (falls noch nicht vollständig)
ALTER TABLE public.vc_result_tokens 
ADD COLUMN IF NOT EXISTS email_sent_at timestamptz,
ADD COLUMN IF NOT EXISTS use_count integer DEFAULT 0;

-- 1.5 Display name function für Profile
CREATE OR REPLACE FUNCTION public.get_display_name(user_id uuid)
RETURNS text AS $$
DECLARE
  first_name text;
  last_name text;
  display_name text;
BEGIN
  SELECT pp.first_name, pp.last_name 
  INTO first_name, last_name
  FROM public.private_profile pp 
  WHERE pp.id = user_id;
  
  IF first_name IS NOT NULL OR last_name IS NOT NULL THEN
    display_name := trim(coalesce(first_name, '') || ' ' || coalesce(last_name, ''));
    IF display_name = '' THEN
      display_name := NULL;
    END IF;
  ELSE
    display_name := NULL;
  END IF;
  
  RETURN display_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1.6 Update trigger for display names
CREATE OR REPLACE FUNCTION public.update_display_name()
RETURNS trigger AS $$
BEGIN
  -- Update profiles.display_name when private_profile changes
  UPDATE public.profiles 
  SET display_name = public.get_display_name(NEW.id)
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_display_name_trigger ON public.private_profile;
CREATE TRIGGER update_display_name_trigger
  AFTER INSERT OR UPDATE ON public.private_profile
  FOR EACH ROW EXECUTE PROCEDURE public.update_display_name();

-- 1.7 Add display_name column to profiles if not exists
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS display_name text;

-- 1.8 Connected channels status tracking
ALTER TABLE public.connected_channels 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS error_message text,
ADD COLUMN IF NOT EXISTS last_sync_at timestamptz;

-- 1.9 Onboarding step tracking improvements
ALTER TABLE public.onboarding_progress 
ADD COLUMN IF NOT EXISTS total_steps integer DEFAULT 7,
ADD COLUMN IF NOT EXISTS current_step_index integer DEFAULT 0;

COMMIT;

-- Success message
SELECT 'Onboarding fixpack migration completed successfully!' as status;