-- Add competitor_benchmark column to visibility_check_results table
ALTER TABLE public.visibility_check_results 
ADD COLUMN competitor_benchmark JSONB DEFAULT '{}'::jsonb;