-- Clean up all existing policies for visibility_check_leads table
DROP POLICY IF EXISTS "Admins can manage all visibility leads" ON public.visibility_check_leads;
DROP POLICY IF EXISTS "Allow anonymous and authenticated users to insert leads" ON public.visibility_check_leads;
DROP POLICY IF EXISTS "Service role can manage all leads" ON public.visibility_check_leads;
DROP POLICY IF EXISTS "System can insert visibility leads" ON public.visibility_check_leads;
DROP POLICY IF EXISTS "Users can update their own leads" ON public.visibility_check_leads;
DROP POLICY IF EXISTS "Users can view and update their own leads" ON public.visibility_check_leads;
DROP POLICY IF EXISTS "Users can view their migrated leads" ON public.visibility_check_leads;
DROP POLICY IF EXISTS "Users can view their own leads" ON public.visibility_check_leads;

-- Create new, clean policies for visibility_check_leads
-- 1. Allow anonymous users to insert leads (no authentication required)
CREATE POLICY "Anyone can insert visibility leads"
ON public.visibility_check_leads
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 2. Allow users to view leads by email match (for anonymous follow-up)
CREATE POLICY "Users can view leads by email"
ON public.visibility_check_leads
FOR SELECT
TO anon, authenticated
USING (
  email = (auth.jwt() ->> 'email'::text) OR 
  user_id = auth.uid() OR 
  auth.role() = 'service_role'::text
);

-- 3. Allow users to update their own leads
CREATE POLICY "Users can update their leads"
ON public.visibility_check_leads
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid() OR 
  email = (auth.jwt() ->> 'email'::text)
)
WITH CHECK (
  user_id = auth.uid() OR 
  email = (auth.jwt() ->> 'email'::text)
);

-- 4. Service role has full access
CREATE POLICY "Service role full access"
ON public.visibility_check_leads
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 5. Admins have full access
CREATE POLICY "Admins full access"
ON public.visibility_check_leads
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);