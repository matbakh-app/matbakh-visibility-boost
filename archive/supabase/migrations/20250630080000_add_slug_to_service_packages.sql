-- Add/Backfill slug on service_packages, but only using columns that actually exist.
DO $$
DECLARE
  src_col text;
BEGIN
  -- First check if the table exists at all
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='service_packages'
  ) THEN
    RAISE NOTICE 'Table service_packages does not exist, skipping migration.';
    RETURN;
  END IF;

  -- ensure column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='service_packages' AND column_name='slug'
  ) THEN
    EXECUTE 'ALTER TABLE public.service_packages ADD COLUMN slug text';
  END IF;

  -- pick a source column in priority order
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='service_packages' AND column_name='name') THEN
    src_col := 'name';
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='service_packages' AND column_name='title') THEN
    src_col := 'title';
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='service_packages' AND column_name='package_name') THEN
    src_col := 'package_name';
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='service_packages' AND column_name='service_name') THEN
    src_col := 'service_name';
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='service_packages' AND column_name='label') THEN
    src_col := 'label';
  ELSE
    src_col := NULL;
  END IF;

  -- backfill if we found a source column
  IF src_col IS NOT NULL THEN
    EXECUTE format(
      'UPDATE public.service_packages
         SET slug = regexp_replace(lower(%I), ''[^a-z0-9]+'', ''-'', ''g'')
       WHERE (slug IS NULL OR slug = '''')
         AND %I IS NOT NULL',
      src_col, src_col
    );
  ELSE
    RAISE NOTICE 'No suitable source column (name/title/package_name/service_name/label) found; slug left NULL.';
  END IF;
END $$;
