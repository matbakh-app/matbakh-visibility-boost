-- Enable Row Level Security for visibility_check_leads
ALTER TABLE public.visibility_check_leads ENABLE ROW LEVEL SECURITY;

-- Allow anonymous and authenticated users to insert leads
CREATE POLICY "Allow anonymous and authenticated users to insert leads"
ON public.visibility_check_leads
FOR INSERT
WITH CHECK (true);

-- Allow users to view their own leads (by email or user_id)
CREATE POLICY "Users can view their own leads"
ON public.visibility_check_leads
FOR SELECT
USING (
  email = (auth.jwt() ->> 'email') OR 
  user_id = auth.uid() OR 
  auth.role() = 'service_role'
);

-- Allow users to update their own leads
CREATE POLICY "Users can update their own leads"
ON public.visibility_check_leads
FOR UPDATE
USING (
  email = (auth.jwt() ->> 'email') OR 
  user_id = auth.uid() OR 
  auth.role() = 'service_role'
);

-- Allow service role to manage all leads
CREATE POLICY "Service role can manage all leads"
ON public.visibility_check_leads
FOR ALL
USING (auth.role() = 'service_role');