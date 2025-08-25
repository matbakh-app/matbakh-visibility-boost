-- Ensure columns exist for later UPDATEs.
ALTER TABLE public.service_packages
  ADD COLUMN IF NOT EXISTS base_price integer,
  ADD COLUMN IF NOT EXISTS original_price integer,
  ADD COLUMN IF NOT EXISTS features text[] DEFAULT '{}'::text[];
