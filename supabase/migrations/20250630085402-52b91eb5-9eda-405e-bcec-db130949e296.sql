
-- Update existing service packages with correct prices and details
UPDATE service_packages 
SET 
  base_price = 149,
  original_price = 299,
  features = ARRAY[
    'Vollständige Einrichtung Ihres Google Business Profils',
    'Optimierung für lokale Suchergebnisse',
    'Professionelle Kategorisierung',
    'Geschäftszeiten und Kontaktdaten Setup',
    'Foto-Upload und -Optimierung',
    'Erste Bewertungsanfrage-Strategie',
    'Google Analytics Verknüpfung',
    'Einmalige Werbestrategie-Beratung'
  ]
WHERE slug = 'google-business-setup';

UPDATE service_packages 
SET 
  base_price = 39,
  original_price = 59,
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
  ],
  min_duration_months = 6
WHERE slug = 'profilpflege-basis';

UPDATE service_packages 
SET 
  base_price = 566,
  original_price = 947,
  name = 'Premium Business Paket',
  features = ARRAY[
    'Google Business Setup komplett',
    '6 Monate Profilpflege inklusive',
    'Social Media Kanal Setup (1 Kanal)',
    'Erweiterte Analytics und Reporting',
    'Prioritäts-Support',
    'Monatliche Strategie-Calls',
    'Wettbewerbs-Analyse',
    'Sie sparen 381€ gegenüber Einzelbuchung'
  ]
WHERE slug = 'premium-business-paket';

-- Insert new Social Media Management package
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
  3
);

-- Add addon services for social media channel setup
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
);
