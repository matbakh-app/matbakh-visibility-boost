-- ==========================================
-- CANONICAL CATEGORIES MIGRATION: UUID-Based Category System
-- ==========================================

-- STEP 1: Main-Categories (canonical) anlegen
CREATE TABLE IF NOT EXISTS public.main_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name_de TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_de TEXT,
  description_en TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- STEP 2: gmb_categories (Fremdschlüssel auf main_categories)
ALTER TABLE public.gmb_categories 
ADD COLUMN IF NOT EXISTS main_category_id UUID REFERENCES public.main_categories(id) ON DELETE SET NULL;

-- STEP 3: Hauptkategorien seed/idempotent einspielen
INSERT INTO public.main_categories (slug, name_de, name_en, sort_order)
VALUES
  ('food-drink', 'Essen & Trinken', 'Food & Drink', 1),
  ('entertainment-culture', 'Kunst, Unterhaltung & Freizeit', 'Arts, Entertainment & Recreation', 2),
  ('retail-shopping', 'Einzelhandel & Verbraucherdienstleistungen', 'Retail & Consumer Services', 3),
  ('health-wellness', 'Gesundheit & Medizinische Dienstleistungen', 'Health & Medical Services', 4),
  ('automotive', 'Automobil & Transport', 'Automotive & Transportation', 5),
  ('beauty-personal-care', 'Mode & Lifestyle', 'Beauty & Personal Care', 6),
  ('sports-fitness', 'Sport', 'Sports & Fitness', 7),
  ('home-garden', 'Immobilien & Bauwesen', 'Home & Garden', 8),
  ('professional-services', 'Professionelle Dienstleistungen', 'Professional Services', 9),
  ('education-training', 'Bildung & Ausbildung', 'Education & Training', 10),
  ('technology-electronics', 'Sonstige', 'Technology & Electronics', 11),
  ('travel-tourism', 'Gastgewerbe und Tourismus', 'Travel & Tourism', 12),
  ('finance-insurance', 'Finanzdienstleistungen', 'Finance & Insurance', 13),
  ('real-estate', 'Immobilien & Bauwesen', 'Real Estate', 14),
  ('pets-animals', 'Sonstige', 'Pets & Animals', 15),
  ('events-venues', 'Kunst, Unterhaltung & Freizeit', 'Events & Venues', 16),
  ('government-public', 'Behörden & Öffentliche Dienste', 'Government & Public Services', 17),
  ('religious-spiritual', 'Religiöse Stätten', 'Religious & Spiritual', 18),
  ('other-services', 'Sonstige', 'Other Services', 19)
ON CONFLICT (slug) DO UPDATE SET
  name_de = EXCLUDED.name_de, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order, updated_at = now();

-- STEP 4: Subkategorien zuordnen (main_category_id setzen)
UPDATE public.gmb_categories 
SET main_category_id = mc.id
FROM public.main_categories mc
WHERE gmb_categories.haupt_kategorie = mc.name_de
AND gmb_categories.main_category_id IS NULL;

-- STEP 5: CrossTags migrieren
ALTER TABLE public.category_cross_tags 
ADD COLUMN IF NOT EXISTS target_main_category_id UUID REFERENCES public.main_categories(id) ON DELETE CASCADE;

UPDATE public.category_cross_tags 
SET target_main_category_id = mc.id
FROM public.main_categories mc
WHERE category_cross_tags.target_main_category = mc.name_de
AND category_cross_tags.target_main_category_id IS NULL;

-- STEP 6: Indizes
CREATE INDEX IF NOT EXISTS idx_gmb_categories_main_category_id ON public.gmb_categories(main_category_id);
CREATE INDEX IF NOT EXISTS idx_main_categories_slug ON public.main_categories(slug);
CREATE INDEX IF NOT EXISTS idx_main_categories_active ON public.main_categories(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_category_cross_tags_target_id ON public.category_cross_tags(target_main_category_id);

-- STEP 7: updated_at Trigger
CREATE OR REPLACE FUNCTION public.update_main_categories_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_main_categories_updated_at ON public.main_categories;
CREATE TRIGGER update_main_categories_updated_at
  BEFORE UPDATE ON public.main_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_main_categories_updated_at();

-- STEP 8: Row Level Security
ALTER TABLE public.main_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read main categories" 
ON public.main_categories FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage main categories" 
ON public.main_categories FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE id = auth.uid() AND role = 'admin'
));

CREATE POLICY "System can manage main categories" 
ON public.main_categories FOR ALL 
USING (auth.role() = 'service_role');