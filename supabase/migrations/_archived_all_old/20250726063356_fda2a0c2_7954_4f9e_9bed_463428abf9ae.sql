-- Add missing columns to visibility_check_leads table
ALTER TABLE public.visibility_check_leads 
ADD COLUMN IF NOT EXISTS business_model text[],
ADD COLUMN IF NOT EXISTS revenue_streams text[],
ADD COLUMN IF NOT EXISTS target_audience text[],
ADD COLUMN IF NOT EXISTS seating_capacity integer,
ADD COLUMN IF NOT EXISTS opening_hours jsonb,
ADD COLUMN IF NOT EXISTS special_features jsonb,
ADD COLUMN IF NOT EXISTS tiktok_handle text,
ADD COLUMN IF NOT EXISTS linkedin_handle text,
ADD COLUMN IF NOT EXISTS analysis_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS analysis_data jsonb,
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS migrated_to_profile boolean DEFAULT false;

-- Create visibility_check_actions table
CREATE TABLE IF NOT EXISTS public.visibility_check_actions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id uuid NOT NULL REFERENCES public.visibility_check_leads(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  action_data jsonb DEFAULT '{}',
  priority text DEFAULT 'medium',
  estimated_impact text,
  status text DEFAULT 'pending',
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create platform_recommendations table  
CREATE TABLE IF NOT EXISTS public.platform_recommendations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id uuid NOT NULL REFERENCES public.visibility_check_leads(id) ON DELETE CASCADE,
  platform text NOT NULL,
  recommendation_type text NOT NULL,
  title text NOT NULL,
  description text,
  priority text DEFAULT 'medium',
  implementation_difficulty text DEFAULT 'medium',
  estimated_impact text,
  status text DEFAULT 'pending',
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create swot_analysis table
CREATE TABLE IF NOT EXISTS public.swot_analysis (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id uuid NOT NULL REFERENCES public.visibility_check_leads(id) ON DELETE CASCADE,
  strengths text[],
  weaknesses text[],
  opportunities text[],
  threats text[],
  overall_score numeric,
  analysis_data jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create competitive_analysis table
CREATE TABLE IF NOT EXISTS public.competitive_analysis (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id uuid NOT NULL REFERENCES public.visibility_check_leads(id) ON DELETE CASCADE,
  competitor_name text NOT NULL,
  competitor_url text,
  platform text NOT NULL,
  competitor_score numeric,
  our_score numeric,
  gap_analysis jsonb DEFAULT '{}',
  recommendations text[],
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create industry_benchmarks table
CREATE TABLE IF NOT EXISTS public.industry_benchmarks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  industry text NOT NULL,
  location text,
  platform text NOT NULL,
  metric_name text NOT NULL,
  metric_value numeric NOT NULL,
  percentile_rank numeric,
  sample_size integer,
  data_source text,
  last_updated timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.visibility_check_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swot_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitive_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.industry_benchmarks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for visibility_check_actions
CREATE POLICY "Users can view actions for their leads" ON public.visibility_check_actions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.visibility_check_leads l 
      WHERE l.id = visibility_check_actions.lead_id 
      AND (l.user_id = auth.uid() OR l.email = (auth.jwt() ->> 'email'))
    )
  );

CREATE POLICY "System can manage actions" ON public.visibility_check_actions
  FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for platform_recommendations  
CREATE POLICY "Users can view recommendations for their leads" ON public.platform_recommendations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.visibility_check_leads l 
      WHERE l.id = platform_recommendations.lead_id 
      AND (l.user_id = auth.uid() OR l.email = (auth.jwt() ->> 'email'))
    )
  );

CREATE POLICY "System can manage recommendations" ON public.platform_recommendations
  FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for swot_analysis
CREATE POLICY "Users can view SWOT for their leads" ON public.swot_analysis
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.visibility_check_leads l 
      WHERE l.id = swot_analysis.lead_id 
      AND (l.user_id = auth.uid() OR l.email = (auth.jwt() ->> 'email'))
    )
  );

CREATE POLICY "System can manage SWOT analysis" ON public.swot_analysis
  FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for competitive_analysis
CREATE POLICY "Users can view competitive analysis for their leads" ON public.competitive_analysis
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.visibility_check_leads l 
      WHERE l.id = competitive_analysis.lead_id 
      AND (l.user_id = auth.uid() OR l.email = (auth.jwt() ->> 'email'))
    )
  );

CREATE POLICY "System can manage competitive analysis" ON public.competitive_analysis
  FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for industry_benchmarks
CREATE POLICY "Benchmarks are publicly readable" ON public.industry_benchmarks
  FOR SELECT USING (true);

CREATE POLICY "System can manage benchmarks" ON public.industry_benchmarks
  FOR ALL USING (auth.role() = 'service_role');

-- Create triggers for updated_at columns
CREATE TRIGGER update_visibility_check_actions_updated_at
  BEFORE UPDATE ON public.visibility_check_actions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_platform_recommendations_updated_at
  BEFORE UPDATE ON public.platform_recommendations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_swot_analysis_updated_at
  BEFORE UPDATE ON public.swot_analysis
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_competitive_analysis_updated_at
  BEFORE UPDATE ON public.competitive_analysis
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();