-- Ensure columns exist for later UPDATEs.
DO $$
BEGIN
  -- First check if the table exists at all
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='service_packages'
  ) THEN
    RAISE NOTICE 'Table service_packages does not exist, skipping migration.';
    RETURN;
  END IF;

  -- Add columns if table exists
  ALTER TABLE public.service_packages
    ADD COLUMN IF NOT EXISTS base_price integer,
    ADD COLUMN IF NOT EXISTS original_price integer,
    ADD COLUMN IF NOT EXISTS features text[] DEFAULT '{}'::text[];
END $$;
