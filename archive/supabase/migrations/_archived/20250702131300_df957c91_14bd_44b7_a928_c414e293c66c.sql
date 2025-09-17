-- Add more addon services for complete functionality
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
) VALUES 
(
  'Google Chatbot Setup',
  'google-chatbot-setup',
  'Automatisierte Antworten für Google Business Profile',
  299,
  499,
  ARRAY[
    'Intelligente Antwortautomatisierung',
    'Häufige Fragen Setup',
    'Anpassbare Antwortvorlagen',
    'Analytics und Reporting',
    '24/7 automatische Kundenbetreuung'
  ],
  'one-time',
  'automation',
  ARRAY['google-business-setup', 'profilpflege-basis'],
  true,
  2
),
(
  'Instagram Account Setup',
  'instagram-setup',
  'Professionelle Einrichtung Ihres Instagram Business Profils',
  29,
  49,
  ARRAY[
    'Business Profil Optimierung',
    'Story Highlights Setup',
    'Bio-Link Optimierung', 
    'Hashtag-Strategie',
    'Content-Planung Templates'
  ],
  'one-time',
  'setup',
  ARRAY['social-media-management'],
  true,
  3
),
(
  'Facebook Business Setup',
  'facebook-setup', 
  'Vollständige Einrichtung Ihrer Facebook Business Seite',
  29,
  49,
  ARRAY[
    'Business Seite erstellen',
    'Über uns Optimierung',
    'Call-to-Action Buttons',
    'Geschäftszeiten Setup',
    'Review-Monitoring Setup'
  ],
  'one-time',
  'setup',
  ARRAY['social-media-management'],
  true,
  4
),
(
  'Social Media Chatbot',
  'social-media-chatbot',
  'Automatisierte Antworten für Social Media Kanäle',
  199,
  299,
  ARRAY[
    'Instagram DM Automation',
    'Facebook Messenger Bot',
    'Keyword-basierte Antworten',
    'Lead-Generierung Setup',
    'Performance Analytics'
  ],
  'one-time',
  'automation',
  ARRAY['social-media-management'],
  true,
  5
) ON CONFLICT (slug) DO NOTHING;