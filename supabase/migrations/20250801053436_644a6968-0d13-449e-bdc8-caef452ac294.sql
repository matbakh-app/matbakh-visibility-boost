-- VOLLSTÄNDIGES OPTIMIERTES PROMO-CODE SCHEMA
-- Phase A: Promo-Code System Database Schema (Optimiert)

-- Promo-Codes Tabelle
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed', 'free_access')),
  discount_value INTEGER,
  max_uses INTEGER DEFAULT 1,
  current_uses INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired')),
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Facebook Review spezifisch
  is_review_code BOOLEAN DEFAULT FALSE,
  granted_features JSONB DEFAULT '[]'::jsonb,
  granted_role TEXT DEFAULT 'user',
  
  -- Constraints
  CONSTRAINT check_discount_value CHECK (
    (discount_type = 'percentage' AND discount_value BETWEEN 1 AND 100) OR
    (discount_type = 'fixed' AND discount_value > 0) OR
    (discount_type = 'free_access' AND discount_value IS NULL)
  ),
  CONSTRAINT check_uses CHECK (current_uses <= max_uses),
  CONSTRAINT check_valid_dates CHECK (valid_until IS NULL OR valid_until > valid_from)
);

-- Promo-Code Usage Tracking
CREATE TABLE IF NOT EXISTS public.promo_code_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  promo_code_id UUID REFERENCES public.promo_codes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(promo_code_id, user_id)
);

-- User Profiles erweitern (korrigierte Tabelle)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS granted_features JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS feature_access_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free';

-- Optimierte Indexes
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON public.promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON public.promo_codes(status, valid_until, current_uses, max_uses);
CREATE INDEX IF NOT EXISTS idx_promo_usage_date ON public.promo_code_usage(used_at);
CREATE INDEX IF NOT EXISTS idx_profiles_features ON public.profiles USING GIN (granted_features);
CREATE INDEX IF NOT EXISTS idx_profiles_access_until ON public.profiles(feature_access_until) WHERE feature_access_until IS NOT NULL;

-- RLS Policies
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_code_usage ENABLE ROW LEVEL SECURITY;

-- Admin Management
CREATE POLICY "Admins can manage promo codes" ON public.promo_codes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- System Access für aktive Codes
CREATE POLICY "System can read active promo codes" ON public.promo_codes
  FOR SELECT USING (status = 'active');

-- User Usage Policies
CREATE POLICY "Users can see own usage" ON public.promo_code_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create usage" ON public.promo_code_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Updated-at Trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_promo_codes_updated_at 
  BEFORE UPDATE ON public.promo_codes 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Facebook Review Codes
INSERT INTO public.promo_codes (
  code, 
  description, 
  discount_type, 
  max_uses, 
  valid_until,
  is_review_code,
  granted_features,
  granted_role,
  status
) VALUES 
(
  'FACEBOOK_REVIEW_2025',
  'Facebook App Review - Vollzugriff für 12 Monate',
  'free_access',
  50,
  NOW() + INTERVAL '12 months',
  TRUE,
  '["business_analytics", "premium_features", "export_reports", "ai_recommendations"]'::jsonb,
  'business_partner',
  'active'
),
(
  'META_TESTING_ACCESS',
  'Meta Testing - Business Professional Features',
  'free_access',
  25,
  NOW() + INTERVAL '12 months',
  TRUE,
  '["advanced_dashboard", "multi_location", "team_management"]'::jsonb,
  'business_partner',
  'active'
)
ON CONFLICT (code) DO NOTHING;