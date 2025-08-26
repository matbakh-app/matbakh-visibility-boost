-- Add missing 'name' column used by later updates
ALTER TABLE public.service_packages
  ADD COLUMN IF NOT EXISTS name text;

-- Optional: backfill from existing slug (if present)
UPDATE public.service_packages
SET name = initcap(replace(slug, '-', ' '))
WHERE name IS NULL AND coalesce(slug, '') <> '';
