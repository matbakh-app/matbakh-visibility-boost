-- Insert new Social Media Management package (schema-aligned)
WITH go AS (
  SELECT 1
  WHERE NOT EXISTS (
    SELECT 1 FROM public.service_packages WHERE slug = 'social-media-management'
  )
)
INSERT INTO public.service_packages (
  code,
  default_name,
  name,
  slug,
  description,
  base_price,
  original_price,
  features,
  is_recurring,
  interval_months,
  min_duration_months,
  is_active
)
SELECT
  'SMM001',                                         -- code (unique)
  'Social Media Management',                        -- default_name
  'Social Media Management',                        -- name (sichtbarer Titel)
  'social-media-management',                        -- slug
  'Professionelle Betreuung Ihrer Social Media Kanäle mit direkter Google Business Verknüpfung',
  24,                                               -- base_price (pro Kanal)
  39,                                               -- original_price
  ARRAY[
    'Individueller Stil angepasst an Ihre CI',
    'SEO/AIO Verknüpfung mit Google Account',
    'Mitarbeiter-Zugang mit Freigabe-System',
    'Content-Planung und -Erstellung',
    'Engagement-Monitoring',
    'Preis pro Kanal (Instagram/Facebook)',
    'Voraussetzung: Google Business Account',
    'Optional: Kanal Setup für 29€'
  ]::text[],
  true,                                             -- is_recurring (monatlich)
  1,                                                -- interval_months
  6,                                                -- min_duration_months
  true                                              -- is_active
FROM go;


-- Optional: Periodik für bestehende Pakete
UPDATE public.service_packages
SET is_recurring = false, interval_months = 0
WHERE slug = 'google-business-setup';

UPDATE public.service_packages
SET is_recurring = true, interval_months = 1
WHERE slug = 'profilpflege-basis';

-- Premium-Bundle nach Bedarf: einmalig oder monatlich
-- UPDATE public.service_packages
-- SET is_recurring = false, interval_months = 0
-- WHERE slug = 'premium-business-paket';
-- Align service_packages updates & inserts to current schema
-- Required columns in your schema: code (unique, not null), default_name (not null)
-- Recurrence is modeled via is_recurring + interval_months (no 'period' column here)

-- 1) Google Business Setup (one-time)
INSERT INTO public.service_packages AS sp (
  code, default_name, name, slug,
  description, base_price, original_price, features,
  is_recurring, interval_months, min_duration_months, is_active
)
VALUES (
  'GBS001',
  'Google Business Setup',
  'Google Business Setup',
  'google-business-setup',
  'Vollständige Einrichtung und Optimierung Ihres Google Business Profils.',
  149,
  299,
  ARRAY[
    'Vollständige Einrichtung Ihres Google Business Profils',
    'Optimierung für lokale Suchergebnisse',
    'Professionelle Kategorisierung',
    'Geschäftszeiten und Kontaktdaten Setup',
    'Foto-Upload und -Optimierung',
    'Erste Bewertungsanfrage-Strategie',
    'Google Analytics Verknüpfung',
    'Einmalige Werbestrategie-Beratung'
  ]::text[],
  false, 0, NULL, true
)
ON CONFLICT (code) DO UPDATE
SET default_name = EXCLUDED.default_name,
    name         = EXCLUDED.name,
    slug         = EXCLUDED.slug,
    description  = EXCLUDED.description,
    base_price   = EXCLUDED.base_price,
    original_price = EXCLUDED.original_price,
    features     = EXCLUDED.features,
    is_recurring = EXCLUDED.is_recurring,
    interval_months = EXCLUDED.interval_months,
    min_duration_months = EXCLUDED.min_duration_months,
    is_active    = EXCLUDED.is_active;

-- 2) Profilpflege Basis (monthly, 6 months min, recommended)
INSERT INTO public.service_packages AS sp (
  code, default_name, name, slug,
  description, base_price, original_price, features,
  is_recurring, interval_months, min_duration_months,
  is_recommended, is_active
)
VALUES (
  'PFB001',
  'Profilpflege Basis',
  'Profilpflege Basis',
  'profilpflege-basis',
  'Monatliche Pflege und Aktualisierung Ihres Google Business Profils.',
  39,
  59,
  ARRAY[
    'Wöchentliche Menü-Updates (4x im Monat)',
    'Öffnungszeiten-Kontrolle (1x monatlich)',
    'Saisonale Anpassungen (1x monatlich)',
    'Kontaktdaten-Pflege (1x monatlich)',
    'Monatlicher Performance-Bericht',
    'Bewertungs-Monitoring',
    'Google Posts Erstellung',
    'Aktuelle Angebote und Events'
  ]::text[],
  true, 1, 6,
  true, true
)
ON CONFLICT (code) DO UPDATE
SET default_name = EXCLUDED.default_name,
    name         = EXCLUDED.name,
    slug         = EXCLUDED.slug,
    description  = EXCLUDED.description,
    base_price   = EXCLUDED.base_price,
    original_price = EXCLUDED.original_price,
    features     = EXCLUDED.features,
    is_recurring = EXCLUDED.is_recurring,
    interval_months = EXCLUDED.interval_months,
    min_duration_months = EXCLUDED.min_duration_months,
    is_recommended = EXCLUDED.is_recommended,
    is_active    = EXCLUDED.is_active;

-- 3) Premium Business Paket (bundle, one-time)
INSERT INTO public.service_packages AS sp (
  code, default_name, name, slug,
  description, base_price, original_price, features,
  is_recurring, interval_months, min_duration_months, is_active
)
VALUES (
  'PBP001',
  'Premium Business Paket',
  'Premium Business Paket',
  'premium-business-paket',
  'Setup + 6 Monate Profilpflege + Social Media Kanal Setup (1 Kanal) und erweitertes Reporting.',
  566,
  947,
  ARRAY[
    'Google Business Setup komplett',
    '6 Monate Profilpflege inklusive',
    'Social Media Kanal Setup (1 Kanal)',
    'Erweiterte Analytics und Reporting',
    'Prioritäts-Support',
    'Monatliche Strategie-Calls',
    'Wettbewerbs-Analyse',
    'Sie sparen 381€ gegenüber Einzelbuchung'
  ]::text[],
  false, 0, NULL, true
)
ON CONFLICT (code) DO UPDATE
SET default_name = EXCLUDED.default_name,
    name         = EXCLUDED.name,
    slug         = EXCLUDED.slug,
    description  = EXCLUDED.description,
    base_price   = EXCLUDED.base_price,
    original_price = EXCLUDED.original_price,
    features     = EXCLUDED.features,
    is_recurring = EXCLUDED.is_recurring,
    interval_months = EXCLUDED.interval_months,
    min_duration_months = EXCLUDED.min_duration_months,
    is_active    = EXCLUDED.is_active;

-- 4) NEW: Social Media Management (monthly)
INSERT INTO public.service_packages AS sp (
  code, default_name, name, slug,
  description, base_price, original_price, features,
  is_recurring, interval_months, min_duration_months, is_active
)
VALUES (
  'SMM001',
  'Social Media Management',
  'Social Media Management',
  'social-media-management',
  'Professionelle Betreuung Ihrer Social Media Kanäle mit direkter Google Business Verknüpfung.',
  24,
  39,
  ARRAY[
    'Individueller Stil angepasst an Ihre CI',
    'SEO/AIO Verknüpfung mit Google Account',
    'Mitarbeiter-Zugang mit Freigabe-System',
    'Content-Planung und -Erstellung',
    'Engagement-Monitoring',
    'Preis pro Kanal (Instagram/Facebook)',
    'Voraussetzung: Google Business Account',
    'Optional: Kanal Setup für 29€'
  ]::text[],
  true, 1, 6, true
)
ON CONFLICT (code) DO UPDATE
SET default_name = EXCLUDED.default_name,
    name         = EXCLUDED.name,
    slug         = EXCLUDED.slug,
    description  = EXCLUDED.description,
    base_price   = EXCLUDED.base_price,
    original_price = EXCLUDED.original_price,
    features     = EXCLUDED.features,
    is_recurring = EXCLUDED.is_recurring,
    interval_months = EXCLUDED.interval_months,
    min_duration_months = EXCLUDED.min_duration_months,
    is_active    = EXCLUDED.is_active;

-- 5) Addon-Service für Social Media Setup (hier gibt es 'period' & 'sort_order' in deiner Tabelle)
INSERT INTO public.addon_services (
  name, slug, description, price, original_price, features,
  period, category, compatible_packages, is_active, sort_order
)
SELECT
  'Social Media Kanal Setup',
  'social-media-setup',
  'Professionelle Einrichtung Ihres Instagram oder Facebook Kanals',
  29,
  49,
  ARRAY[
    'Profil-Optimierung',
    'CI-konforme Gestaltung',
    'Erste Content-Strategie',
    'Google Business Verknüpfung',
    'Analytics Setup'
  ]::text[],
  'one-time',
  'setup',
  ARRAY['social-media-management']::text[],
  true,
  1
WHERE NOT EXISTS (
  SELECT 1 FROM public.addon_services WHERE slug = 'social-media-setup'
);

ok, werde icch tun, kannst du etwas hiermit anfangen:
| pos | name                | type                        | is_nullable | column_default    |
| --- | ------------------- | --------------------------- | ----------- | ----------------- |
| 1   | id                  | uuid                        | NO          | gen_random_uuid() |
| 2   | code                | text                        | NO          | null              |
| 3   | default_name        | text                        | NO          | null              |
| 4   | is_recurring        | boolean                     | YES         | false             |
| 5   | interval_months     | integer                     | YES         | null              |
| 6   | created_at          | timestamp without time zone | YES         | now()             |
| 7   | is_active           | boolean                     | YES         | true              |
| 8   | slug                | text                        | YES         | null              |
| 9   | base_price          | integer                     | YES         | null              |
| 10  | original_price      | integer                     | YES         | null              |
| 11  | features            | ARRAY                       | YES         | '{}'::text[]      |
| 12  | is_recommended      | boolean                     | NO          | false             |
| 13  | min_duration_months | integer                     | YES         | null              |
| 14  | name                | text                        | YES         | null              |
| 15  | description         | text                        | YES         | null              |


-- ============================================
-- service_packages: Inserts (nur wenn fehlend)
-- ============================================

-- Google Business Setup (einmalig)
INSERT INTO public.service_packages (
  code, default_name, name, slug, description,
  is_active, is_recurring, interval_months, min_duration_months,
  base_price, original_price, features, is_recommended
)
SELECT
  'GBS001', 'Google Business Setup', 'Google Business Setup', 'google-business-setup',
  'Einmalige vollständige Einrichtung Ihres Google Business Profils.',
  true, false, NULL, NULL,
  149, 299,
  ARRAY[
    'Vollständige Einrichtung Ihres Google Business Profils',
    'Optimierung für lokale Suchergebnisse',
    'Professionelle Kategorisierung',
    'Geschäftszeiten und Kontaktdaten Setup',
    'Foto-Upload und -Optimierung',
    'Erste Bewertungsanfrage-Strategie',
    'Google Analytics Verknüpfung',
    'Einmalige Werbestrategie-Beratung'
  ]::text[],
  false
WHERE NOT EXISTS (SELECT 1 FROM public.service_packages WHERE slug = 'google-business-setup');

-- Profilpflege (Basis) – monatlich, 6 Monate Mindestlaufzeit
INSERT INTO public.service_packages (
  code, default_name, name, slug, description,
  is_active, is_recurring, interval_months, min_duration_months,
  base_price, original_price, features, is_recommended
)
SELECT
  'PFB001', 'Profilpflege (Basis)', 'Profilpflege (Basis)', 'profilpflege-basis',
  'Monatliche Pflege Ihres Profils mit Kernaufgaben & Reporting.',
  true, true, 1, 6,
  39, 59,
  ARRAY[
    'Wöchentliche Menü-Updates (4x im Monat)',
    'Öffnungszeiten-Kontrolle (1x monatlich)',
    'Saisonale Anpassungen (1x monatlich)',
    'Kontaktdaten-Pflege (1x monatlich)',
    'Monatlicher Performance-Bericht',
    'Bewertungs-Monitoring',
    'Google Posts Erstellung',
    'Aktuelle Angebote und Events'
  ]::text[],
  true
WHERE NOT EXISTS (SELECT 1 FROM public.service_packages WHERE slug = 'profilpflege-basis');

-- Premium Business Paket (Bundle, einmalig – enthält 6 Monate Pflege etc.)
INSERT INTO public.service_packages (
  code, default_name, name, slug, description,
  is_active, is_recurring, interval_months, min_duration_months,
  base_price, original_price, features, is_recommended
)
SELECT
  'PBP001', 'Premium Business Paket', 'Premium Business Paket', 'premium-business-paket',
  'Setup + 6 Monate Profilpflege inkl., Social-Setup (1 Kanal) & erweitertes Reporting.',
  true, false, NULL, NULL,
  566, 947,
  ARRAY[
    'Google Business Setup komplett',
    '6 Monate Profilpflege inklusive',
    'Social Media Kanal Setup (1 Kanal)',
    'Erweiterte Analytics und Reporting',
    'Prioritäts-Support',
    'Monatliche Strategie-Calls',
    'Wettbewerbs-Analyse',
    'Sie sparen 381€ gegenüber Einzelbuchung'
  ]::text[],
  false
WHERE NOT EXISTS (SELECT 1 FROM public.service_packages WHERE slug = 'premium-business-paket');

-- Social Media Management – monatlich, 6 Monate Mindestlaufzeit
INSERT INTO public.service_packages (
  code, default_name, name, slug, description,
  is_active, is_recurring, interval_months, min_duration_months,
  base_price, original_price, features, is_recommended
)
SELECT
  'SMM001', 'Social Media Management', 'Social Media Management', 'social-media-management',
  'Professionelle Betreuung Ihrer Social Media Kanäle mit direkter Google Business Verknüpfung.',
  true, true, 1, 6,
  24, 39,
  ARRAY[
    'Individueller Stil angepasst an Ihre CI',
    'SEO/AIO Verknüpfung mit Google Account',
    'Mitarbeiter-Zugang mit Freigabe-System',
    'Content-Planung und -Erstellung',
    'Engagement-Monitoring',
    'Preis pro Kanal (Instagram/Facebook)',
    'Voraussetzung: Google Business Account',
    'Optional: Kanal Setup für 29€'
  ]::text[],
  false
WHERE NOT EXISTS (SELECT 1 FROM public.service_packages WHERE slug = 'social-media-management');

-- ============================================
-- service_packages: Updates (falls bereits da)
-- ============================================

-- Google Business Setup
UPDATE public.service_packages
SET
  base_price = 149,
  original_price = 299,
  name = 'Google Business Setup',
  description = 'Einmalige vollständige Einrichtung Ihres Google Business Profils.',
  is_active = true,
  is_recurring = false,
  interval_months = NULL,
  min_duration_months = NULL,
  features = ARRAY[
    'Vollständige Einrichtung Ihres Google Business Profils',
    'Optimierung für lokale Suchergebnisse',
    'Professionelle Kategorisierung',
    'Geschäftszeiten und Kontaktdaten Setup',
    'Foto-Upload und -Optimierung',
    'Erste Bewertungsanfrage-Strategie',
    'Google Analytics Verknüpfung',
    'Einmalige Werbestrategie-Beratung'
  ]::text[]
WHERE slug = 'google-business-setup';

-- Profilpflege (Basis)
UPDATE public.service_packages
SET
  base_price = 39,
  original_price = 59,
  name = 'Profilpflege (Basis)',
  description = 'Monatliche Pflege Ihres Profils mit Kernaufgaben & Reporting.',
  is_active = true,
  is_recurring = true,
  interval_months = 1,
  min_duration_months = 6,
  is_recommended = true,
  features = ARRAY[
    'Wöchentliche Menü-Updates (4x im Monat)',
    'Öffnungszeiten-Kontrolle (1x monatlich)',
    'Saisonale Anpassungen (1x monatlich)',
    'Kontaktdaten-Pflege (1x monatlich)',
    'Monatlicher Performance-Bericht',
    'Bewertungs-Monitoring',
    'Google Posts Erstellung',
    'Aktuelle Angebote und Events'
  ]::text[]
WHERE slug = 'profilpflege-basis';

-- Premium Business Paket
UPDATE public.service_packages
SET
  base_price = 566,
  original_price = 947,
  name = 'Premium Business Paket',
  description = 'Setup + 6 Monate Pflege, Social-Setup (1 Kanal), Prioritäts-Support & Reporting.',
  is_active = true,
  is_recurring = false,
  interval_months = NULL,
  min_duration_months = NULL,
  features = ARRAY[
    'Google Business Setup komplett',
    '6 Monate Profilpflege inklusive',
    'Social Media Kanal Setup (1 Kanal)',
    'Erweiterte Analytics und Reporting',
    'Prioritäts-Support',
    'Monatliche Strategie-Calls',
    'Wettbewerbs-Analyse',
    'Sie sparen 381€ gegenüber Einzelbuchung'
  ]::text[]
WHERE slug = 'premium-business-paket';

-- Social Media Management
UPDATE public.service_packages
SET
  base_price = 24,
  original_price = 39,
  name = 'Social Media Management',
  description = 'Professionelle Betreuung Ihrer Social Media Kanäle mit direkter Google Business Verknüpfung.',
  is_active = true,
  is_recurring = true,
  interval_months = 1,
  min_duration_months = 6,
  is_recommended = false,
  features = ARRAY[
    'Individueller Stil angepasst an Ihre CI',
    'SEO/AIO Verknüpfung mit Google Account',
    'Mitarbeiter-Zugang mit Freigabe-System',
    'Content-Planung und -Erstellung',
    'Engagement-Monitoring',
    'Preis pro Kanal (Instagram/Facebook)',
    'Voraussetzung: Google Business Account',
    'Optional: Kanal Setup für 29€'
  ]::text[]
WHERE slug = 'social-media-management';

-- ============================================
-- addon_services: Social Media Kanal Setup (idempotent)
-- (Deine Tabelle besitzt 'period' & 'sort_order', daher hier ok.)
-- ============================================
INSERT INTO public.addon_services (
  name, slug, description, price, original_price,
  features, period, category, compatible_packages, is_active, sort_order
)
SELECT
  'Social Media Kanal Setup',
  'social-media-setup',
  'Professionelle Einrichtung Ihres Instagram oder Facebook Kanals',
  29, 49,
  ARRAY[
    'Profil-Optimierung',
    'CI-konforme Gestaltung',
    'Erste Content-Strategie',
    'Google Business Verknüpfung',
    'Analytics Setup'
  ]::text[],
  'one-time',
  'setup',
  ARRAY['social-media-management']::text[],
  true,
  1
WHERE NOT EXISTS (SELECT 1 FROM public.addon_services WHERE slug = 'social-media-setup');

<!------------------------------------------------------------------------------------
   Add Rules to this file or a short description and have Kiro refine them for you:   
-------------------------------------------------------------------------------------> 