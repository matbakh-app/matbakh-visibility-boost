-- Add missing 'name' column used by later updates
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

  -- Add column if table exists
  ALTER TABLE public.service_packages
    ADD COLUMN IF NOT EXISTS name text;

  -- Optional: backfill from existing slug (if present)
  UPDATE public.service_packages
  SET name = initcap(replace(slug, '-', ' '))
  WHERE name IS NULL AND coalesce(slug, '') <> '';
END $$;
