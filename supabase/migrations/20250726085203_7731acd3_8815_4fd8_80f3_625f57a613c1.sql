-- Fix RLS on visibility_check_leads table
ALTER TABLE public.visibility_check_leads ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Allow anonymous and authenticated users to insert leads" ON public.visibility_check_leads;
DROP POLICY IF EXISTS "Users can view and update their own leads" ON public.visibility_check_leads;
DROP POLICY IF EXISTS "Service role can manage all leads" ON public.visibility_check_leads;

-- Create correct policies for visibility_check_leads
CREATE POLICY "Allow anonymous and authenticated users to insert leads"
ON public.visibility_check_leads
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can view and update their own leads"
ON public.visibility_check_leads
FOR ALL
USING (
    auth.uid() = user_id 
    OR email = (auth.jwt() ->> 'email'::text)
    OR auth.role() = 'service_role'::text
);

CREATE POLICY "Service role can manage all leads"
ON public.visibility_check_leads
FOR ALL
USING (auth.role() = 'service_role'::text);