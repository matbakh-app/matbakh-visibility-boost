-- Add pgcrypto extension if not exists
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Update RLS policies for category_search_logs
DROP POLICY IF EXISTS "Anon can insert logs (user_id null)" ON public.category_search_logs;
DROP POLICY IF EXISTS "Auth can insert own logs" ON public.category_search_logs;
DROP POLICY IF EXISTS "Admins can view all search logs" ON public.category_search_logs;

-- Create admin check function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  );
$$;

GRANT EXECUTE ON function public.is_admin() TO anon, authenticated;

-- Anonymous inserts: only with user_id NULL
CREATE POLICY "Anon can insert logs (user_id null)"
ON public.category_search_logs
FOR INSERT TO anon
WITH CHECK (user_id IS NULL);

-- Auth inserts: either user_id = auth.uid() OR NULL
CREATE POLICY "Auth can insert own logs"
ON public.category_search_logs
FOR INSERT TO authenticated
WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- Admin select using security definer function
CREATE POLICY "Admins can view all search logs"
ON public.category_search_logs
FOR SELECT
USING (public.is_admin());

-- Auth can insert own partner events in lead_events
DROP POLICY IF EXISTS "Auth can insert own partner events" ON public.lead_events;
CREATE POLICY "Auth can insert own partner events"
ON public.lead_events
FOR INSERT TO authenticated
WITH CHECK (
  partner_id IS NULL OR 
  partner_id IN (SELECT id FROM public.business_partners WHERE user_id = auth.uid())
);

-- Add missing indexes
CREATE INDEX IF NOT EXISTS idx_cat_search_logs_created ON public.category_search_logs(search_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_lead_events_created ON public.lead_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cat_search_logs_result_ids ON public.category_search_logs USING gin (result_category_ids);