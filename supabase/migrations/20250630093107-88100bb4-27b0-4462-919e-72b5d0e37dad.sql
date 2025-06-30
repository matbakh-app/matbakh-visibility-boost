
-- Delete any duplicate packages that might have been created
DELETE FROM service_packages WHERE slug IN ('google-business-setup', 'profilpflege-basis', 'premium-business-paket', 'social-media-management') AND created_at > '2024-12-30';

-- Update or Insert Google Business Setup package
INSERT INTO service_packages (
  name, 
  slug, 
  description, 
  base_price, 
  original_price, 
  features, 
  period, 
  min_duration_months,
  is_active,
  is_recommended,
  sort_order
) VALUES (
  'Google Business Setup',
  'google-business-setup',
  'Professionelle Einrichtung und Optimierung Ihres Google Business Profils für maximale lokale Sichtbarkeit',
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
  ],
  'one-time',
  0,
  true,
  false,
  1
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  base_price = EXCLUDED.base_price,
  original_price = EXCLUDED.original_price,
  features = EXCLUDED.features,
  period = EXCLUDED.period,
  min_duration_months = EXCLUDED.min_duration_months,
  is_recommended = EXCLUDED.is_recommended,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

-- Update or Insert Profilpflege Basis package
INSERT INTO service_packages (
  name, 
  slug, 
  description, 
  base_price, 
  original_price, 
  features, 
  period, 
  min_duration_months,
  is_active,
  is_recommended,
  sort_order
) VALUES (
  'Profilpflege Basis',
  'profilpflege-basis',
  'Kontinuierliche Pflege und Optimierung Ihres Google Business Profils für nachhaltigen Erfolg',
  39,
  69,
  ARRAY[
    'Wöchentliche Menü-Updates (4x im Monat)',
    'Öffnungszeiten-Kontrolle (1x monatlich)',
    'Saisonale Anpassungen (1x monatlich)', 
    'Kontaktdaten-Pflege (1x monatlich)',
    'Monatlicher Performance-Bericht',
    'Bewertungs-Monitoring',
    'Google Posts Erstellung',
    'Aktuelle Angebote und Events'
  ],
  'monthly',
  6,
  true,
  true,
  2
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  base_price = EXCLUDED.base_price,
  original_price = EXCLUDED.original_price,
  features = EXCLUDED.features,
  period = EXCLUDED.period,
  min_duration_months = EXCLUDED.min_duration_months,
  is_recommended = EXCLUDED.is_recommended,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

-- Update or Insert Social Media Management package
INSERT INTO service_packages (
  name, 
  slug, 
  description, 
  base_price, 
  original_price, 
  features, 
  period, 
  min_duration_months,
  is_active,
  is_recommended,
  sort_order
) VALUES (
  'Social Media Management',
  'social-media-management',
  'Professionelle Betreuung Ihrer Social Media Kanäle mit direkter Google Business Verknüpfung',
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
  ],
  'monthly',
  6,
  true,
  false,
  3
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  base_price = EXCLUDED.base_price,
  original_price = EXCLUDED.original_price,
  features = EXCLUDED.features,
  period = EXCLUDED.period,
  min_duration_months = EXCLUDED.min_duration_months,
  is_recommended = EXCLUDED.is_recommended,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

-- Update or Insert Premium Business Paket
INSERT INTO service_packages (
  name, 
  slug, 
  description, 
  base_price, 
  original_price, 
  features, 
  period, 
  min_duration_months,
  is_active,
  is_recommended,
  sort_order
) VALUES (
  'Premium Business Paket',
  'premium-business-paket',
  'Rundum-sorglos-Paket mit Google Setup, Profilpflege und Social Media Management für 6 Monate',
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
  ],
  'package',
  6,
  true,
  false,
  4
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  base_price = EXCLUDED.base_price,
  original_price = EXCLUDED.original_price,
  features = EXCLUDED.features,
  period = EXCLUDED.period,
  min_duration_months = EXCLUDED.min_duration_months,
  is_recommended = EXCLUDED.is_recommended,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

-- Ensure Social Media Kanal Setup addon exists and is correctly configured
INSERT INTO addon_services (
  name,
  slug,
  description,
  price,
  original_price,
  features,
  period,
  category,
  compatible_packages,
  is_active,
  sort_order
) VALUES (
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
  ],
  'one-time',
  'setup',
  ARRAY['social-media-management'],
  true,
  1
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  original_price = EXCLUDED.original_price,
  features = EXCLUDED.features,
  period = EXCLUDED.period,
  category = EXCLUDED.category,
  compatible_packages = EXCLUDED.compatible_packages,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();
