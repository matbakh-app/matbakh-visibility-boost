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
