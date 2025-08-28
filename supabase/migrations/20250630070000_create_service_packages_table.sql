-- Create service_packages table if it doesn't exist
-- This ensures all subsequent migrations that reference this table will work

CREATE TABLE IF NOT EXISTS public.service_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text,
  default_name text,
  name text,
  slug text,
  description text,
  base_price integer,
  original_price integer,
  features text[] DEFAULT '{}'::text[],
  period text,
  sort_order integer,
  is_active boolean DEFAULT true,
  is_recurring boolean DEFAULT false,
  is_recommended boolean DEFAULT false,
  interval_months integer,
  min_duration_months integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.service_packages ENABLE ROW LEVEL SECURITY;

-- Create basic policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'service_packages' 
    AND policyname = 'Allow public read access for active packages'
  ) THEN
    CREATE POLICY "Allow public read access for active packages"
      ON public.service_packages
      FOR SELECT
      USING (is_active = true);
  END IF;
END $$;

-- Create indexes and constraints
CREATE UNIQUE INDEX IF NOT EXISTS service_packages_slug_unique ON public.service_packages(slug);
CREATE INDEX IF NOT EXISTS service_packages_active_idx ON public.service_packages(is_active);