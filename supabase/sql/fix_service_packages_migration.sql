-- ============================================
-- FIX: service_packages Migration Error
-- Safe DO-Block that checks table existence
-- ============================================

DO $$ 
BEGIN
  -- Check if service_packages table exists
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema='public' AND table_name='service_packages'
  ) THEN
    
    -- Add slug column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='service_packages' AND column_name='slug'
    ) THEN
      EXECUTE 'ALTER TABLE public.service_packages ADD COLUMN slug text';
      RAISE NOTICE 'Added slug column to service_packages';
    END IF;

    -- Add other missing columns if they don't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='service_packages' AND column_name='base_price'
    ) THEN
      EXECUTE 'ALTER TABLE public.service_packages ADD COLUMN base_price integer';
      RAISE NOTICE 'Added base_price column to service_packages';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='service_packages' AND column_name='original_price'
    ) THEN
      EXECUTE 'ALTER TABLE public.service_packages ADD COLUMN original_price integer';
      RAISE NOTICE 'Added original_price column to service_packages';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='service_packages' AND column_name='features'
    ) THEN
      EXECUTE 'ALTER TABLE public.service_packages ADD COLUMN features text[] DEFAULT ''{}'';
      RAISE NOTICE 'Added features column to service_packages';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='service_packages' AND column_name='is_recommended'
    ) THEN
      EXECUTE 'ALTER TABLE public.service_packages ADD COLUMN is_recommended boolean DEFAULT false';
      RAISE NOTICE 'Added is_recommended column to service_packages';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='service_packages' AND column_name='name'
    ) THEN
      EXECUTE 'ALTER TABLE public.service_packages ADD COLUMN name text';
      RAISE NOTICE 'Added name column to service_packages';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='service_packages' AND column_name='description'
    ) THEN
      EXECUTE 'ALTER TABLE public.service_packages ADD COLUMN description text';
      RAISE NOTICE 'Added description column to service_packages';
    END IF;

    -- Backfill slug from available source columns
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema='public' AND table_name='service_packages' 
      AND column_name IN ('name','title','package_name','service_name','label')
    ) THEN
      EXECUTE $f$
        UPDATE public.service_packages
        SET slug = regexp_replace(
          lower(coalesce(name,title,package_name,service_name,label)),
          '[^a-z0-9]+','-','g'
        )
        WHERE (slug IS NULL OR slug = '')
          AND coalesce(name,title,package_name,service_name,label) IS NOT NULL
      $f$;
      RAISE NOTICE 'Backfilled slug column from existing data';
    END IF;

    -- Backfill name from slug if name is empty
    EXECUTE $f$
      UPDATE public.service_packages
      SET name = initcap(replace(slug, '-', ' '))
      WHERE name IS NULL AND coalesce(slug, '') <> ''
    $f$;

  ELSE
    RAISE NOTICE 'Table public.service_packages does not exist; skipping all service_packages migrations.';
  END IF;
END $$;