-- Add missing columns used by later inserts/updates
ALTER TABLE public.service_packages
  ADD COLUMN IF NOT EXISTS period text,
  ADD COLUMN IF NOT EXISTS sort_order int;
