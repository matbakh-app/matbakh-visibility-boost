-- Remove debug policy and set secure SELECT policy for visibility_check_leads
DROP POLICY IF EXISTS "DEBUG_select_all_leads_temporarily" ON public.visibility_check_leads;

-- Create secure SELECT policy
CREATE POLICY "Users can view their leads"
ON public.visibility_check_leads
FOR SELECT
TO anon, authenticated
USING (
  (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
  (auth.jwt() ->> 'email' = email)
);