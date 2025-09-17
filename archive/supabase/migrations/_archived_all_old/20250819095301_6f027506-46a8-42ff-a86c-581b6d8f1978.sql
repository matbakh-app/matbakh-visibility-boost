-- Fehlende Token-/Status-Felder ergänzen
ALTER TABLE public.visibility_check_leads
  ADD COLUMN IF NOT EXISTS confirm_token_hash text,
  ADD COLUMN IF NOT EXISTS confirm_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS email_confirmed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS analysis_status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS analysis_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS analysis_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS report_url text,
  ADD COLUMN IF NOT EXISTS locale text DEFAULT 'de',
  ADD COLUMN IF NOT EXISTS marketing_consent boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS marketing_consent_at timestamptz,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Status-Constraint
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname='public' AND t.relname='visibility_check_leads' AND c.conname='vc_leads_status_chk'
  ) THEN
    ALTER TABLE public.visibility_check_leads
      ADD CONSTRAINT vc_leads_status_chk
      CHECK (analysis_status IN ('pending','running','completed','failed'));
  END IF;
END $$;

-- Updated_at Trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_vc_leads_updated_at ON public.visibility_check_leads;
CREATE TRIGGER trg_vc_leads_updated_at
BEFORE UPDATE ON public.visibility_check_leads
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Indexe für Token/Status
CREATE UNIQUE INDEX IF NOT EXISTS idx_vc_leads_token_hash_unique
  ON public.visibility_check_leads (confirm_token_hash);

CREATE INDEX IF NOT EXISTS idx_vc_leads_status
  ON public.visibility_check_leads (analysis_status);

CREATE INDEX IF NOT EXISTS idx_vc_leads_expires_at
  ON public.visibility_check_leads (confirm_expires_at);