
-- Remove all old/duplicate service packages that are causing confusion
DELETE FROM service_packages WHERE slug IN (
  'basic-setup',
  'professional', 
  'premium-business-package'
);

-- Remove old addon services that might be duplicates
DELETE FROM addon_services WHERE slug NOT IN ('social-media-setup');

-- Ensure we only have the correct 4 packages with proper data
-- First, let's clean up any potential duplicates of our target packages
DELETE FROM service_packages 
WHERE slug IN ('google-business-setup', 'profilpflege-basis', 'social-media-management', 'premium-business-paket')
AND (
  base_price NOT IN (149, 39, 24, 566) 
  OR original_price NOT IN (299, 69, 39, 947)
  OR created_at < '2025-01-01'
);

-- Verify our target packages exist with correct data, insert if missing
INSERT INTO service_packages (
  name, slug, description, base_price, original_price, features, period, 
  min_duration_months, is_active, is_recommended, sort_order
) VALUES 
(
  'Google Business Setup',
  'google-business-setup', 
  'Professionelle Einrichtung und Optimierung Ihres Google Business Profils für maximale lokale Sichtbarkeit',
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
  ],
  'one-time', 0, true, false, 1
),
(
  'Profilpflege Basis',
  'profilpflege-basis',
  'Kontinuierliche Pflege und Optimierung Ihres Google Business Profils für nachhaltigen Erfolg', 
  39, 69,
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
  'monthly', 6, true, true, 2
),
(
  'Social Media Management',
  'social-media-management',
  'Professionelle Betreuung Ihrer Social Media Kanäle mit direkter Google Business Verknüpfung',
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
  ],
  'monthly', 6, true, false, 3
),
(
  'Premium Business Paket',
  'premium-business-paket',
  'Rundum-sorglos-Paket mit Google Setup, Profilpflege und Social Media Management für 6 Monate',
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
  ],
  'package', 6, true, false, 4
)
ON CONFLICT (slug) DO NOTHING;

-- Ensure the addon service exists
INSERT INTO addon_services (
  name, slug, description, price, original_price, features, period, 
  category, compatible_packages, is_active, sort_order
) VALUES (
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
  ],
  'one-time', 'setup', ARRAY['social-media-management'], true, 1
) ON CONFLICT (slug) DO NOTHING;
