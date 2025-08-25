-- Remove all existing INSERT policies on visibility_check_leads to avoid conflicts
DROP POLICY IF EXISTS "Anyone can insert visibility leads" ON public.visibility_check_leads;
DROP POLICY IF EXISTS "allow_anonymous_insert_leads" ON public.visibility_check_leads;
DROP POLICY IF EXISTS "Users can create leads" ON public.visibility_check_leads;
DROP POLICY IF EXISTS "Allow anonymous lead creation" ON public.visibility_check_leads;
DROP POLICY IF EXISTS "Open insert for all" ON public.visibility_check_leads;
DROP POLICY IF EXISTS "Open insert for visibility leads" ON public.visibility_check_leads;

-- Create a single, simple INSERT policy for testing
CREATE POLICY "Open insert for visibility leads"
ON public.visibility_check_leads
FOR INSERT
TO anon, authenticated
WITH CHECK (true);