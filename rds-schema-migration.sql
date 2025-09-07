-- =========================================================
-- MATBAKH.APP RDS MIGRATION SCHEMA
-- Angepasst für AWS RDS PostgreSQL (ohne Supabase Auth)
-- =========================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =========================================================
-- 1. CORE USER & AUTHENTICATION SYSTEM (RDS-kompatibel)
-- =========================================================

-- User profiles (standalone, ohne auth.users Referenz)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
  display_name text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Private user data
CREATE TABLE IF NOT EXISTS public.private_profile (
  id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  first_name text,
  last_name text,
  address jsonb,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- =========================================================
-- 2. BUSINESS MANAGEMENT
-- =========================================================

-- Business Partners (Haupttabelle für Restaurants)
CREATE TABLE IF NOT EXISTS public.business_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id),
  company_name text NOT NULL,
  contact_email text,
  contact_phone text,
  website text,
  address text,
  tax_id text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive', 'suspended')),
  services_selected text[] DEFAULT '{}',
  onboarding_completed boolean DEFAULT false,
  document_uploaded boolean DEFAULT false,
  profile_verified boolean DEFAULT false,
  billing_address jsonb,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  google_account_id text,
  category_ids text[],
  description text,
  special_features jsonb,
  location point,
  categories jsonb DEFAULT '[]',
  business_model text[],
  revenue_streams text[],
  target_audience text[],
  seating_capacity integer,
  opening_hours text[],
  go_live boolean DEFAULT false,
  google_connected boolean DEFAULT false
);

-- Business Profiles (erweiterte Geschäftsdaten)
CREATE TABLE IF NOT EXISTS public.business_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  registration_type text,
  company_name text NOT NULL,
  address text,
  phone text,
  website text,
  email text,
  description text,
  categories text[] DEFAULT '{}',
  business_hours jsonb DEFAULT '{}',
  services text[] DEFAULT '{}',
  target_audience text[] DEFAULT '{}',
  google_places_id text,
  gmb_verification_status text,
  google_reviews_count integer DEFAULT 0,
  google_rating numeric,
  google_photos jsonb DEFAULT '[]',
  gmb_social_links jsonb DEFAULT '{}',
  gmb_attributes jsonb DEFAULT '{}',
  gmb_posts jsonb DEFAULT '[]',
  facebook_page_id text,
  instagram_handle text,
  instagram_business_id text,
  facebook_followers integer DEFAULT 0,
  instagram_followers integer DEFAULT 0,
  facebook_posts_count integer DEFAULT 0,
  whatsapp_number text,
  messenger_integration boolean DEFAULT false,
  facebook_page_category text,
  facebook_about text,
  vc_completed boolean DEFAULT false,
  vc_score integer,
  vc_last_run timestamptz,
  vc_results jsonb DEFAULT '{}',
  onboarding_completed boolean DEFAULT false,
  profile_verified boolean DEFAULT false,
  data_sources text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  tax_number text,
  vat_id text,
  legal_entity text,
  commercial_register text,
  bank_account text,
  owner_name text,
  business_license text,
  payment_methods text[],
  paypal_email text,
  stripe_account text,
  subscription text DEFAULT 'free',
  street text,
  house_number text,
  address_line2 text,
  postal_code text,
  city text,
  country text DEFAULT 'Deutschland',
  card_number text,
  card_expiry text,
  card_cvc text,
  google_connected boolean NOT NULL DEFAULT false
);

-- =========================================================
-- 3. VISIBILITY CHECK SYSTEM
-- =========================================================

-- Visibility Check Leads (Haupttabelle für VC-Anfragen)
CREATE TABLE IF NOT EXISTS public.visibility_check_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name text NOT NULL,
  website text,
  email text,
  location_text text,
  check_type text NOT NULL DEFAULT 'basic',
  result_status text NOT NULL DEFAULT 'pending',
  overall_score integer,
  google_score integer,
  facebook_score integer,
  instagram_score integer,
  found_business boolean DEFAULT false,
  analysis_data jsonb DEFAULT '{}',
  full_report_url text,
  user_id uuid REFERENCES public.profiles(id),
  migrated_to_profile boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  business_model text[],
  revenue_streams text[],
  target_audience text[],
  seating_capacity integer,
  opening_hours jsonb,
  special_features jsonb,
  tiktok_handle text,
  linkedin_handle text,
  analysis_status text DEFAULT 'pending',
  benchmarks jsonb,
  location text,
  postal_code text,
  main_category text,
  sub_category text,
  matbakh_category text,
  facebook_handle text,
  instagram_handle text,
  gdpr_consent boolean DEFAULT false,
  marketing_consent boolean DEFAULT false,
  ip_address text,
  user_agent text,
  analyzed_at timestamptz,
  verification_token text,
  double_optin_sent_at timestamptz,
  double_optin_confirmed boolean DEFAULT false,
  double_optin_confirmed_at timestamptz,
  report_sent_at timestamptz,
  status text DEFAULT 'pending',
  analysis_error_message text,
  report_url text,
  report_generated_at timestamptz,
  confirm_token_hash text,
  confirm_expires_at timestamptz,
  email_confirmed boolean DEFAULT false,
  analysis_started_at timestamptz,
  analysis_completed_at timestamptz,
  locale text DEFAULT 'de',
  marketing_consent_at timestamptz,
  phone_number text,
  language text,
  location_data jsonb,
  social_links jsonb,
  competitor_urls text[]
);

-- Visibility Check Results
CREATE TABLE IF NOT EXISTS public.visibility_check_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_profile_id uuid NOT NULL REFERENCES public.business_profiles(id),
  check_type text DEFAULT 'onboarding',
  overall_score integer,
  category_scores jsonb DEFAULT '{}',
  recommendations jsonb DEFAULT '[]',
  competitive_analysis jsonb DEFAULT '{}',
  missing_elements text[] DEFAULT '{}',
  strengths text[] DEFAULT '{}',
  dashboard_widgets jsonb DEFAULT '{}',
  pdf_export_data jsonb DEFAULT '{}',
  analysis_duration_ms integer,
  data_sources_used text[] DEFAULT '{}',
  api_calls_made jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- =========================================================
-- 4. SERVICE PACKAGES & BOOKINGS
-- =========================================================

-- Service Packages
CREATE TABLE IF NOT EXISTS public.service_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  default_name text NOT NULL,
  is_recurring boolean DEFAULT false,
  interval_months integer,
  created_at timestamp without time zone DEFAULT now(),
  is_active boolean DEFAULT true,
  slug text,
  base_price integer,
  original_price integer,
  features text[] DEFAULT '{}',
  is_recommended boolean NOT NULL DEFAULT false,
  min_duration_months integer,
  name text,
  description text
);

-- Partner Bookings
CREATE TABLE IF NOT EXISTS public.partner_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid REFERENCES public.business_partners(id),
  service_type text NOT NULL,
  service_slug text NOT NULL,
  service_name text NOT NULL,
  price numeric NOT NULL,
  payment_status text DEFAULT 'unpaid',
  booking_date timestamptz DEFAULT now(),
  activated_at timestamptz,
  expires_at timestamptz,
  invoice_url text,
  payment_intent_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  stripe_customer_id text,
  stripe_subscription_id text,
  status text DEFAULT 'inactive',
  go_live_required boolean DEFAULT true,
  go_live_at timestamp without time zone
);

-- =========================================================
-- 5. GMB CATEGORIES
-- =========================================================

-- Google My Business Categories
CREATE TABLE IF NOT EXISTS public.gmb_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id text NOT NULL,
  name_de text NOT NULL,
  name_en text NOT NULL,
  is_popular boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  parent_category_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  is_primary boolean DEFAULT false,
  parent_id text,
  category_path text,
  synonyms text[],
  country_availability text[] DEFAULT '{DE,AT,CH}',
  description_de text,
  keywords text[],
  description_en text,
  public_id numeric,
  haupt_kategorie text,
  main_category text,
  main_category_id uuid
);

-- =========================================================
-- 6. FEATURE FLAGS
-- =========================================================

-- Feature Flags für A/B Testing und Feature Rollouts
CREATE TABLE IF NOT EXISTS public.feature_flags (
  key text PRIMARY KEY,
  value boolean NOT NULL DEFAULT false,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =========================================================
-- 7. INDEXES FÜR PERFORMANCE
-- =========================================================

-- Profiles
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Business Partners
CREATE INDEX IF NOT EXISTS idx_business_partners_user_id ON public.business_partners(user_id);
CREATE INDEX IF NOT EXISTS idx_business_partners_status ON public.business_partners(status);
CREATE INDEX IF NOT EXISTS idx_business_partners_company_name ON public.business_partners(company_name);

-- Visibility Check Leads
CREATE INDEX IF NOT EXISTS idx_vc_leads_email ON public.visibility_check_leads(email);
CREATE INDEX IF NOT EXISTS idx_vc_leads_status ON public.visibility_check_leads(result_status);
CREATE INDEX IF NOT EXISTS idx_vc_leads_created_at ON public.visibility_check_leads(created_at);

-- Service Packages
CREATE INDEX IF NOT EXISTS idx_service_packages_active ON public.service_packages(is_active);
CREATE INDEX IF NOT EXISTS idx_service_packages_slug ON public.service_packages(slug);

-- =========================================================
-- 8. INITIAL DATA
-- =========================================================

-- Feature Flags Defaults
INSERT INTO public.feature_flags (key, value, description) VALUES
('onboarding_guard_live', false, 'Onboarding Guard aktiviert'),
('vc_doi_live', true, 'Double Opt-In für Visibility Check'),
('vc_ident_live', true, 'Identifikation für Visibility Check'),
('vc_bedrock_live', false, 'AWS Bedrock für VC-Analyse'),
('ui_invisible_default', true, 'UI Elemente standardmäßig unsichtbar')
ON CONFLICT (key) DO NOTHING;

-- Basic Service Packages
INSERT INTO public.service_packages (code, default_name, name, slug, description, base_price, original_price, features, is_active, is_recurring, interval_months, min_duration_months) VALUES
('GBS001', 'Google Business Setup', 'Google Business Setup', 'google-business-setup', 'Vollständige Einrichtung Ihres Google Business Profils', 149, 299, ARRAY['Vollständige Einrichtung', 'Optimierung für lokale Suchergebnisse', 'Professionelle Kategorisierung'], true, false, NULL, NULL),
('PFB001', 'Profilpflege Basis', 'Profilpflege Basis', 'profilpflege-basis', 'Monatliche Pflege Ihres Google Business Profils', 39, 59, ARRAY['Wöchentliche Updates', 'Monatlicher Bericht', 'Bewertungs-Monitoring'], true, true, 1, 6)
ON CONFLICT (code) DO NOTHING;

-- =========================================================
-- 9. ROW LEVEL SECURITY (RLS)
-- =========================================================

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;

-- Policies für profiles
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (id = current_setting('app.current_user_id')::uuid);
CREATE POLICY "profiles_select_admin" ON public.profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = current_setting('app.current_user_id')::uuid AND p.role IN ('admin', 'super_admin'))
);

-- Policies für business_partners
CREATE POLICY "business_partners_select_own" ON public.business_partners FOR SELECT USING (user_id = current_setting('app.current_user_id')::uuid);
CREATE POLICY "business_partners_select_admin" ON public.business_partners FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = current_setting('app.current_user_id')::uuid AND p.role IN ('admin', 'super_admin'))
);

-- =========================================================
-- MIGRATION COMPLETE
-- =========================================================

-- Zeige Zusammenfassung
SELECT 
  schemaname, 
  tablename,
  (SELECT count(*) FROM information_schema.columns WHERE table_name = tablename AND table_schema = schemaname) as column_count
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;