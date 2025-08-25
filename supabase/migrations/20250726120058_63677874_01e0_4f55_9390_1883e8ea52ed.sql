-- Add new columns to business_partners table
ALTER TABLE business_partners
ADD COLUMN IF NOT EXISTS business_model TEXT[],
ADD COLUMN IF NOT EXISTS revenue_streams TEXT[],
ADD COLUMN IF NOT EXISTS target_audience TEXT[],
ADD COLUMN IF NOT EXISTS seating_capacity INTEGER,
ADD COLUMN IF NOT EXISTS opening_hours TEXT,
ADD COLUMN IF NOT EXISTS special_features TEXT[];

-- Create visibility_check_results table
CREATE TABLE IF NOT EXISTS visibility_check_results (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id uuid REFERENCES visibility_check_leads(id) ON DELETE CASCADE,
    partner_id uuid REFERENCES business_partners(id) ON DELETE SET NULL,
    visibility_score numeric,
    swot_strengths jsonb,
    swot_weaknesses jsonb,
    swot_opportunities jsonb,
    swot_threats jsonb,
    action_recommendations jsonb,
    provider text, -- z.B. 'bedrock', 'google-llm', ...
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create unclaimed_business_profiles table
CREATE TABLE IF NOT EXISTS unclaimed_business_profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Basisdaten (aus Visibility Check)
    business_name text,
    location text,
    contact_email text,
    contact_phone text,
    website text,
    category_ids text[],        -- GMB Category IDs (Array)
    matbakh_category text,      -- Matbakh eigene Kategorie (optional)
    -- Alle für spätere Zuordnung relevanten Merkmale
    address text,
    opening_hours text[],
    special_features jsonb,
    business_model text[],
    revenue_streams text[],
    target_audience text[],
    seating_capacity integer,
    -- Für Growth-Loop/Status/Claim
    lead_id uuid REFERENCES visibility_check_leads(id) ON DELETE CASCADE,
    claimed_by_user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
    claimed_at timestamp with time zone,
    claim_status text DEFAULT 'unclaimed',  -- 'unclaimed', 'claimed', 'archived'
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for visibility_check_results
ALTER TABLE visibility_check_results ENABLE ROW LEVEL SECURITY;

-- RLS policies for visibility_check_results
CREATE POLICY "Users can view their visibility results" 
ON visibility_check_results 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM visibility_check_leads l 
    WHERE l.id = visibility_check_results.lead_id 
    AND (l.user_id = auth.uid() OR l.email = (auth.jwt() ->> 'email'))
  )
  OR 
  EXISTS (
    SELECT 1 FROM business_partners bp 
    WHERE bp.id = visibility_check_results.partner_id 
    AND bp.user_id = auth.uid()
  )
);

CREATE POLICY "System can manage visibility results" 
ON visibility_check_results 
FOR ALL 
USING (auth.role() = 'service_role');

-- Enable RLS for unclaimed_business_profiles
ALTER TABLE unclaimed_business_profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for unclaimed_business_profiles
CREATE POLICY "Users can view unclaimed profiles" 
ON unclaimed_business_profiles 
FOR SELECT 
USING (true);

CREATE POLICY "System can manage unclaimed profiles" 
ON unclaimed_business_profiles 
FOR ALL 
USING (auth.role() = 'service_role');

CREATE POLICY "Users can claim profiles" 
ON unclaimed_business_profiles 
FOR UPDATE 
USING (claimed_by_user_id IS NULL OR claimed_by_user_id = auth.uid());

-- Add triggers for updated_at
CREATE TRIGGER update_visibility_check_results_updated_at
    BEFORE UPDATE ON visibility_check_results
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_unclaimed_business_profiles_updated_at
    BEFORE UPDATE ON unclaimed_business_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();