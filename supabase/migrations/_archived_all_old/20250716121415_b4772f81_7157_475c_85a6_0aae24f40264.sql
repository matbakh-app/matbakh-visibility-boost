
-- ===================================================================
-- MATBAKH.APP - GMB CATEGORIES MIGRATION
-- Datenarchitektur-Migration: Konsolidierung auf gmb_categories
-- ===================================================================

-- 1. ERWEITERE gmb_categories TABELLE FÜR CSV-IMPORT-KOMPATIBILITÄT
-- ===================================================================
ALTER TABLE public.gmb_categories 
ADD COLUMN IF NOT EXISTS is_primary boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS parent_id text,
ADD COLUMN IF NOT EXISTS category_path text,
ADD COLUMN IF NOT EXISTS synonyms text[],
ADD COLUMN IF NOT EXISTS country_availability text[] DEFAULT '{"DE", "AT", "CH"}',
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS keywords text[];

-- Bestehende Spalten für bessere Struktur anpassen
ALTER TABLE public.gmb_categories 
ALTER COLUMN category_id SET NOT NULL,
ALTER COLUMN name_en SET NOT NULL,
ALTER COLUMN name_de SET NOT NULL;

-- Index für bessere Performance
CREATE INDEX IF NOT EXISTS idx_gmb_categories_parent_id ON public.gmb_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_gmb_categories_category_path ON public.gmb_categories(category_path);
CREATE INDEX IF NOT EXISTS idx_gmb_categories_is_primary ON public.gmb_categories(is_primary);

-- 2. FÜGE HAUPTKATEGORIEN IN gmb_categories EIN
-- ===================================================================
INSERT INTO public.gmb_categories (
    category_id, 
    name_en, 
    name_de, 
    is_popular, 
    is_primary,
    sort_order,
    parent_category_id,
    category_path,
    country_availability,
    description
) VALUES 
    ('retail_consumer_services', 'Retail & Consumer Services', 'Retail & Consumer Services', true, true, 1, NULL, 'retail_consumer_services', '{"DE", "AT", "CH"}', 'Einzelhandel und Verbraucherservices'),
    ('health_medical_services', 'Health & Medical Services', 'Health & Medical Services', true, true, 2, NULL, 'health_medical_services', '{"DE", "AT", "CH"}', 'Gesundheits- und Medizinische Dienstleistungen'),
    ('education_training', 'Education & Training', 'Education & Training', true, true, 3, NULL, 'education_training', '{"DE", "AT", "CH"}', 'Bildung und Ausbildung'),
    ('food_dining', 'Food & Dining', 'Food & Dining', true, true, 4, NULL, 'food_dining', '{"DE", "AT", "CH"}', 'Essen und Gastronomie'),
    ('professional_services', 'Professional Services', 'Professional Services', true, true, 5, NULL, 'professional_services', '{"DE", "AT", "CH"}', 'Professionelle Dienstleistungen'),
    ('government_public_services', 'Government & Public Services', 'Government & Public Services', false, true, 6, NULL, 'government_public_services', '{"DE", "AT", "CH"}', 'Regierung und öffentliche Dienstleistungen'),
    ('automotive_transportation', 'Automotive & Transportation', 'Automotive & Transportation', true, true, 7, NULL, 'automotive_transportation', '{"DE", "AT", "CH"}', 'Automobil und Transport'),
    ('manufacturing_industrial', 'Manufacturing & Industrial', 'Manufacturing & Industrial', false, true, 8, NULL, 'manufacturing_industrial', '{"DE", "AT", "CH"}', 'Herstellung und Industrie'),
    ('arts_entertainment_recreation', 'Arts, Entertainment & Recreation', 'Arts, Entertainment & Recreation', true, true, 9, NULL, 'arts_entertainment_recreation', '{"DE", "AT", "CH"}', 'Kunst, Unterhaltung und Erholung'),
    ('hospitality_tourism', 'Hospitality & Tourism', 'Hospitality & Tourism', true, true, 10, NULL, 'hospitality_tourism', '{"DE", "AT", "CH"}', 'Gastgewerbe und Tourismus'),
    ('financial_services', 'Financial Services', 'Financial Services', true, true, 11, NULL, 'financial_services', '{"DE", "AT", "CH"}', 'Finanzdienstleistungen'),
    ('agriculture_natural_resources', 'Agriculture & Natural Resources', 'Agriculture & Natural Resources', false, true, 12, NULL, 'agriculture_natural_resources', '{"DE", "AT", "CH"}', 'Landwirtschaft und natürliche Ressourcen'),
    ('aviation', 'Aviation', 'Aviation', false, true, 13, NULL, 'aviation', '{"DE", "AT", "CH"}', 'Luftfahrt'),
    ('religious_places', 'Religious places', 'Religious places', false, true, 14, NULL, 'religious_places', '{"DE", "AT", "CH"}', 'Religiöse Stätten'),
    ('fashion_lifestyle', 'Fashion & lifestyle', 'Fashion & lifestyle', true, true, 15, NULL, 'fashion_lifestyle', '{"DE", "AT", "CH"}', 'Mode und Lifestyle'),
    ('real_estate_construction', 'Real estate & construction', 'Real estate & construction', true, true, 16, NULL, 'real_estate_construction', '{"DE", "AT", "CH"}', 'Immobilien und Bauwesen'),
    ('sports', 'Sports', 'Sports', true, true, 17, NULL, 'sports', '{"DE", "AT", "CH"}', 'Sport'),
    ('others', 'Others', 'Others', false, true, 18, NULL, 'others', '{"DE", "AT", "CH"}', 'Sonstige')
ON CONFLICT (category_id) DO UPDATE SET
    name_en = EXCLUDED.name_en,
    name_de = EXCLUDED.name_de,
    is_primary = EXCLUDED.is_primary,
    sort_order = EXCLUDED.sort_order,
    category_path = EXCLUDED.category_path,
    country_availability = EXCLUDED.country_availability,
    description = EXCLUDED.description;

-- 3. MIGRATION VON FOREIGN KEYS (falls business_categories existiert)
-- ===================================================================

-- Prüfe und migriere category_specifics falls vorhanden
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'business_categories') THEN
        -- Migriere category_specifics Foreign Key
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'category_specifics' AND column_name = 'category_id') THEN
            -- Entferne alte Foreign Key Constraint
            ALTER TABLE public.category_specifics DROP CONSTRAINT IF EXISTS category_specifics_category_id_fkey;
            
            -- Füge neue Foreign Key zu gmb_categories hinzu
            ALTER TABLE public.category_specifics 
            ADD CONSTRAINT category_specifics_category_id_fkey 
            FOREIGN KEY (category_id) REFERENCES public.gmb_categories(id);
        END IF;
    END IF;
END $$;

-- Migriere business_partners category_ids (falls nötig)
-- Falls business_partners.category_ids auf business_categories referenziert, migriere zu gmb_categories
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_partners' AND column_name = 'category_ids') THEN
        -- Hier könnten wir die category_ids von business_partners zu gmb_categories migrieren
        -- Vorerst als Kommentar, da die genaue Mapping-Logik von der bisherigen Datenstruktur abhängt
        RAISE NOTICE 'business_partners.category_ids Migration bereit - manuelle Prüfung erforderlich';
    END IF;
END $$;

-- 4. LÖSCHE business_categories TABELLE (falls vorhanden)
-- ===================================================================
DROP TABLE IF EXISTS public.business_categories CASCADE;

-- 5. VALIDIERUNG & TEST-SETUP
-- ===================================================================

-- Prüfe die neue Struktur
SELECT 
    'gmb_categories' as table_name,
    COUNT(*) as total_rows,
    COUNT(CASE WHEN is_primary = true THEN 1 END) as primary_categories,
    COUNT(CASE WHEN is_popular = true THEN 1 END) as popular_categories
FROM public.gmb_categories;

-- Prüfe Spaltenstruktur für CSV-Import
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'gmb_categories' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Test-Query für CSV-Import-Kompatibilität
SELECT 
    category_id,
    name_en,
    name_de,
    is_primary,
    parent_id,
    category_path,
    synonyms,
    country_availability,
    description,
    keywords
FROM public.gmb_categories 
WHERE is_primary = true
ORDER BY sort_order;

-- Erstelle Backup-View der aktuellen Struktur (für Rollback)
CREATE OR REPLACE VIEW public.gmb_categories_backup AS
SELECT 
    category_id,
    name_en,
    name_de,
    is_popular,
    is_primary,
    sort_order,
    parent_category_id,
    category_path,
    country_availability,
    description,
    keywords,
    synonyms,
    created_at,
    updated_at
FROM public.gmb_categories;

-- Kommentar für CSV-Import-Vorbereitung
COMMENT ON TABLE public.gmb_categories IS 'Zentrale GMB-Kategorien-Tabelle. Struktur optimiert für CSV-Bulk-Import aus organized_list.csv. Spalten: category_id, name_en, name_de, is_primary, parent_id, category_path, synonyms, country_availability';
