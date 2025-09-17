-- Add min_duration_months used by later updates
ALTER TABLE public.service_packages
  ADD COLUMN IF NOT EXISTS min_duration_months integer;
