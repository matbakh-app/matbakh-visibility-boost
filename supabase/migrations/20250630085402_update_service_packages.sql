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
‚