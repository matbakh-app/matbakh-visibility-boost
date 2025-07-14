-- Clean slate: Remove existing data and rebuild with new structure
TRUNCATE TABLE service_prices CASCADE;
TRUNCATE TABLE service_packages CASCADE;
TRUNCATE TABLE addon_services CASCADE;

-- Insert new service packages with structured UUIDs for easy identification
INSERT INTO service_packages (id, code, default_name, is_active, is_recurring, interval_months) VALUES
('00000000-0000-0000-0000-000000000001', 'profile_dashboard_basic', 'Profile Dashboard Basic', true, true, 1),
('00000000-0000-0000-0000-000000000002', 'google_profile_setup', 'Google Profile Setup', true, false, null),
('00000000-0000-0000-0000-000000000003', 'profile_management_classic', 'Profile Management Classic', true, true, 1),
('00000000-0000-0000-0000-000000000004', 'profile_management_premium', 'Profile Management Premium', true, true, 1),
('00000000-0000-0000-0000-000000000005', 'meta_business_suite_setup', 'Meta Business Suite Setup', true, false, null),
('00000000-0000-0000-0000-000000000006', 'starter_kit', 'Starter Kit', true, false, 6);

-- Insert current pricing (in cents) for all packages
INSERT INTO service_prices (package_id, normal_price_cents, promo_active, currency, valid_from, valid_to) VALUES
('00000000-0000-0000-0000-000000000001', 499, false, 'EUR', now(), null),    -- €4.99/month
('00000000-0000-0000-0000-000000000002', 19900, false, 'EUR', now(), null),  -- €199 one-time
('00000000-0000-0000-0000-000000000003', 3900, false, 'EUR', now(), null),   -- €39/month
('00000000-0000-0000-0000-000000000004', 5900, false, 'EUR', now(), null),   -- €59/month
('00000000-0000-0000-0000-000000000005', 9900, false, 'EUR', now(), null),   -- €99 one-time
('00000000-0000-0000-0000-000000000006', 29900, false, 'EUR', now(), null);  -- €299 one-time (6 months)

-- Insert addon services with proper sorting
INSERT INTO addon_services (
  name, slug, description, price, original_price, period, category, 
  compatible_packages, requires_base_package, is_active, sort_order,
  features, name_translations, description_translations, features_translations
) VALUES
(
  'Instagram Page Setup',
  'instagram_page_setup', 
  'Launch your Instagram Business page the right way, with strategy and style.',
  9900, -- €99
  null,
  'one_time',
  'social_setup',
  ARRAY['profile_management_classic', 'profile_management_premium', 'starter_kit'],
  false,
  true,
  1,
  ARRAY[
    'Profile optimization for discovery',
    'Branded story & post templates', 
    'Winning hashtag & engagement strategy'
  ],
  '{"de": "Instagram-Seite einrichten", "en": "Instagram Page Setup"}',
  '{"de": "Starten Sie Ihre Instagram Business-Seite richtig – mit Strategie und Stil.", "en": "Launch your Instagram Business page the right way, with strategy and style."}',
  '{"de": ["Profil-Optimierung für bessere Auffindbarkeit", "Gebrandete Story- und Post-Vorlagen", "Gewinnende Hashtag- und Engagement-Strategie"], "en": ["Profile optimization for discovery", "Branded story & post templates", "Winning hashtag & engagement strategy"]}'
),
(
  'Facebook Page Setup',
  'facebook_page_setup',
  'Complete, professional Facebook page launch – ready to convert browsers into regulars.',
  9900, -- €99
  null,
  'one_time',
  'social_setup',
  ARRAY['profile_management_classic', 'profile_management_premium', 'starter_kit'],
  false,
  true,
  2,
  ARRAY[
    'Business page creation & branding',
    'Meta Business integration for analytics & ads',
    'Ad campaign setup and best practices'
  ],
  '{"de": "Facebook-Seite einrichten", "en": "Facebook Page Setup"}',
  '{"de": "Vollständiger, professioneller Facebook-Seiten-Launch – bereit, Browser in Stammkunden zu verwandeln.", "en": "Complete, professional Facebook page launch – ready to convert browsers into regulars."}',
  '{"de": ["Unternehmensseite erstellen & branden", "Meta Business Integration für Analytics & Ads", "Werbekampagnen-Setup und Best Practices"], "en": ["Business page creation & branding", "Meta Business integration for analytics & ads", "Ad campaign setup and best practices"]}'
),
(
  'Google Chatbot Setup – Coming Soon',
  'google_chatbot',
  'Automated guest responses for your Google Business profile – never miss a booking.',
  19900, -- €199
  null,
  'one_time',
  'automation',
  ARRAY['google_profile_setup', 'profile_management_classic', 'profile_management_premium', 'starter_kit'],
  false,
  false, -- Coming soon - inactive
  3,
  ARRAY[
    'Bot configuration & FAQ integration',
    'Instant replies to Google reviews/messages',
    '24/7 guest support for reservations & info'
  ],
  '{"de": "Google Chatbot Setup – Demnächst", "en": "Google Chatbot Setup – Coming Soon"}',
  '{"de": "Automatisierte Gäste-Antworten für Ihr Google Business-Profil – verpassen Sie nie eine Buchung.", "en": "Automated guest responses for your Google Business profile – never miss a booking."}',
  '{"de": ["Bot-Konfiguration & FAQ-Integration", "Sofortige Antworten auf Google-Bewertungen/Nachrichten", "24/7 Gäste-Support für Reservierungen & Infos"], "en": ["Bot configuration & FAQ integration", "Instant replies to Google reviews/messages", "24/7 guest support for reservations & info"]}'
),
(
  'Social Media Chatbot – Coming Soon',
  'social_chatbot',
  'Automated guest engagement across all your socials. Respond, engage, and capture leads automatically.',
  19900, -- €199
  null,
  'one_time',
  'automation',
  ARRAY['profile_management_classic', 'profile_management_premium', 'starter_kit'],
  false,
  false, -- Coming soon - inactive
  4,
  ARRAY[
    'Omnichannel chatbot setup (FB, IG, more)',
    'Auto-response for comments & DMs',
    'Lead capture and data integration'
  ],
  '{"de": "Social Media Chatbot – Demnächst", "en": "Social Media Chatbot – Coming Soon"}',
  '{"de": "Automatisiertes Gäste-Engagement über alle Ihre sozialen Kanäle. Antworten, interagieren und Leads automatisch erfassen.", "en": "Automated guest engagement across all your socials. Respond, engage, and capture leads automatically."}',
  '{"de": ["Omnichannel-Chatbot-Setup (FB, IG, weitere)", "Auto-Antworten für Kommentare & DMs", "Lead-Erfassung und Datenintegration"], "en": ["Omnichannel chatbot setup (FB, IG, more)", "Auto-response for comments & DMs", "Lead capture and data integration"]}'
);