-- Add missing is_recommended boolean flag used by later updates
ALTER TABLE public.service_packages
  ADD COLUMN IF NOT EXISTS is_recommended boolean NOT NULL DEFAULT false;
