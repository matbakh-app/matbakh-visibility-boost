
-- Erstelle die gmb_categories Tabelle
CREATE TABLE IF NOT EXISTS public.gmb_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id text NOT NULL UNIQUE,
  name_de text NOT NULL,
  name_en text NOT NULL,
  is_popular boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  parent_category_id text NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Erstelle die onboarding_questions Tabelle
CREATE TABLE IF NOT EXISTS public.onboarding_questions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  step integer NOT NULL,
  type text NOT NULL CHECK (type IN ('text', 'select', 'checkbox', 'info')),
  slug text NOT NULL UNIQUE,
  required boolean NOT NULL DEFAULT true,
  order_index integer NOT NULL DEFAULT 0,
  translations jsonb NOT NULL DEFAULT '{}',
  options jsonb NULL DEFAULT '{}',
  validation_rules jsonb NULL DEFAULT '{}',
  conditional_logic jsonb NULL DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- RLS für gmb_categories aktivieren
ALTER TABLE public.gmb_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policy für gmb_categories (öffentlich lesbar)
CREATE POLICY "GMB categories are publicly readable" 
  ON public.gmb_categories 
  FOR SELECT 
  USING (true);

-- RLS für onboarding_questions aktivieren  
ALTER TABLE public.onboarding_questions ENABLE ROW LEVEL SECURITY;

-- RLS Policy für onboarding_questions (öffentlich lesbar)
CREATE POLICY "Onboarding questions are publicly readable" 
  ON public.onboarding_questions 
  FOR SELECT 
  USING (true);

-- Basis GMB Kategorien einfügen
INSERT INTO public.gmb_categories (category_id, name_de, name_en, is_popular, sort_order) VALUES
  ('gcid:restaurant', 'Restaurant', 'Restaurant', true, 1),
  ('gcid:cafe', 'Café', 'Cafe', true, 2),
  ('gcid:bakery', 'Bäckerei', 'Bakery', true, 3),
  ('gcid:bar', 'Bar', 'Bar', true, 4),
  ('gcid:fast_food', 'Schnellrestaurant', 'Fast Food Restaurant', true, 5),
  ('gcid:pizza', 'Pizzeria', 'Pizza Restaurant', true, 6),
  ('gcid:asian_restaurant', 'Asiatisches Restaurant', 'Asian Restaurant', false, 7),
  ('gcid:italian_restaurant', 'Italienisches Restaurant', 'Italian Restaurant', false, 8),
  ('gcid:german_restaurant', 'Deutsches Restaurant', 'German Restaurant', false, 9),
  ('gcid:steakhouse', 'Steakhouse', 'Steakhouse', false, 10)
ON CONFLICT (category_id) DO NOTHING;

-- Basis Onboarding Fragen einfügen
INSERT INTO public.onboarding_questions (step, type, slug, required, order_index, translations, options) VALUES
  (1, 'text', 'business_name', true, 1, 
   '{"de": {"label": "Unternehmensname", "description": "Wie heißt Ihr Restaurant/Unternehmen?", "placeholder": "z.B. Zur alten Post"}, "en": {"label": "Business Name", "description": "What is the name of your restaurant/business?", "placeholder": "e.g. The Old Post"}}', 
   NULL),
   
  (1, 'text', 'business_description', true, 2,
   '{"de": {"label": "Unternehmensbeschreibung", "description": "Beschreiben Sie Ihr Unternehmen in 2-3 Sätzen", "placeholder": "Wir sind ein gemütliches Restaurant mit traditioneller deutscher Küche..."}, "en": {"label": "Business Description", "description": "Describe your business in 2-3 sentences", "placeholder": "We are a cozy restaurant with traditional German cuisine..."}}',
   NULL),
   
  (1, 'select', 'business_category', true, 3,
   '{"de": {"label": "Kategorie", "description": "Wählen Sie die passende Kategorie für Ihr Unternehmen"}, "en": {"label": "Category", "description": "Select the appropriate category for your business"}}',
   '{"source": "gmb_categories", "filter": {"is_popular": true}}'),
   
  (1, 'text', 'business_address', true, 4,
   '{"de": {"label": "Geschäftsadresse", "description": "Vollständige Adresse Ihres Unternehmens", "placeholder": "Musterstraße 123, 80331 München"}, "en": {"label": "Business Address", "description": "Complete address of your business", "placeholder": "Sample Street 123, 80331 Munich"}}',
   NULL),
   
  (1, 'text', 'business_phone', false, 5,
   '{"de": {"label": "Telefonnummer", "description": "Telefonnummer für Kunden (optional)", "placeholder": "+49 89 12345678"}, "en": {"label": "Phone Number", "description": "Phone number for customers (optional)", "placeholder": "+49 89 12345678"}}',
   NULL),
   
  (1, 'text', 'business_website', false, 6,
   '{"de": {"label": "Website", "description": "Ihre Website-URL (optional)", "placeholder": "https://www.ihr-restaurant.de"}, "en": {"label": "Website", "description": "Your website URL (optional)", "placeholder": "https://www.your-restaurant.com"}}',
   NULL),
   
  (2, 'select', 'google_setup', true, 1,
   '{"de": {"label": "Google Business Setup", "description": "Welchen Service möchten Sie buchen?"}, "en": {"label": "Google Business Setup", "description": "Which service would you like to book?"}}',
   '{"de": [{"value": "setup", "label": "Google Business Profil einrichten (149€)"}, {"value": "management", "label": "Google Business Profil verwalten (39€/Monat)"}], "en": [{"value": "setup", "label": "Set up Google Business Profile (149€)"}, {"value": "management", "label": "Manage Google Business Profile (39€/month)"}]}'),
   
  (3, 'select', 'has_gmail', true, 1,
   '{"de": {"label": "Gmail-Account", "description": "Haben Sie bereits einen Gmail-Account für Ihr Unternehmen?"}, "en": {"label": "Gmail Account", "description": "Do you already have a Gmail account for your business?"}}',
   '{"de": [{"value": "yes", "label": "Ja, ich habe bereits einen Gmail-Account"}, {"value": "no", "label": "Nein, ich benötige Hilfe beim Einrichten"}], "en": [{"value": "yes", "label": "Yes, I already have a Gmail account"}, {"value": "no", "label": "No, I need help setting one up"}]}'),
   
  (3, 'text', 'gmail_account', false, 2,
   '{"de": {"label": "Gmail-Adresse", "description": "Ihre Gmail-Adresse (falls vorhanden)", "placeholder": "ihr-restaurant@gmail.com"}, "en": {"label": "Gmail Address", "description": "Your Gmail address (if available)", "placeholder": "your-restaurant@gmail.com"}}',
   NULL)
ON CONFLICT (slug) DO NOTHING;

-- Index für bessere Performance
CREATE INDEX IF NOT EXISTS idx_gmb_categories_popular ON public.gmb_categories (is_popular, sort_order);
CREATE INDEX IF NOT EXISTS idx_onboarding_questions_step ON public.onboarding_questions (step, order_index);
