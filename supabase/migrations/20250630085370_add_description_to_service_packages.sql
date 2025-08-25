-- Add missing 'description' column for service_packages
ALTER TABLE public.service_packages
  ADD COLUMN IF NOT EXISTS description text;
