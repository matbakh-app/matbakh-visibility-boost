-- Enable RLS for tables without security policies

-- 1. Enable RLS for alerts table
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- 2. Enable RLS for category_specifics table  
ALTER TABLE public.category_specifics ENABLE ROW LEVEL SECURITY;

-- 3. Enable RLS for onboarding_steps table
ALTER TABLE public.onboarding_steps ENABLE ROW LEVEL SECURITY;

-- Create security policies for alerts table
CREATE POLICY "Admins can view and manage alerts"
ON public.alerts
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Create security policies for category_specifics table
CREATE POLICY "Public can read category specifics"
ON public.category_specifics
FOR SELECT
TO public
USING (true);

-- Create security policies for onboarding_steps table (using partner_id)
CREATE POLICY "Partners can manage own onboarding steps"
ON public.onboarding_steps
FOR ALL
TO authenticated
USING (
  partner_id IN (
    SELECT id FROM business_partners 
    WHERE user_id = auth.uid()
  )
);