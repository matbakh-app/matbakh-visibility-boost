-- Entferne User "Pasta di Monaco" und alle zugehörigen Daten (FIXED)
-- Sichere Löschung mit Existenz-Prüfung für alle Tabellen

DO $$
BEGIN
  -- Partner Bookings entfernen (falls Tabelle existiert)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'partner_bookings') THEN
    DELETE FROM partner_bookings 
    WHERE partner_id = '232605e0-2c37-4777-8360-6599504ad144';
    RAISE NOTICE 'Cleaned partner_bookings';
  END IF;

  -- Partner Onboarding Steps entfernen (falls Tabelle existiert)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'partner_onboarding_steps') THEN
    DELETE FROM partner_onboarding_steps 
    WHERE partner_id = '232605e0-2c37-4777-8360-6599504ad144';
    RAISE NOTICE 'Cleaned partner_onboarding_steps';
  END IF;

  -- Business Profiles entfernen - FIXED: Prüfe ob partner_id Spalte existiert
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'business_profiles') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_profiles' AND column_name = 'partner_id') THEN
      DELETE FROM business_profiles 
      WHERE partner_id = '232605e0-2c37-4777-8360-6599504ad144';
      RAISE NOTICE 'Cleaned business_profiles by partner_id';
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_profiles' AND column_name = 'id') THEN
      DELETE FROM business_profiles 
      WHERE id = '232605e0-2c37-4777-8360-6599504ad144';
      RAISE NOTICE 'Cleaned business_profiles by id';
    END IF;
  END IF;

  -- Google OAuth Tokens entfernen (falls Tabelle existiert)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'google_oauth_tokens') THEN
    DELETE FROM google_oauth_tokens 
    WHERE user_id = '0379d98a-d71a-48a3-a8ca-992c4f15bcfd';
    RAISE NOTICE 'Cleaned google_oauth_tokens';
  END IF;

  -- Business Partners entfernen (falls Tabelle existiert)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'business_partners') THEN
    DELETE FROM business_partners 
    WHERE id = '232605e0-2c37-4777-8360-6599504ad144';
    RAISE NOTICE 'Cleaned business_partners';
  END IF;

  -- Billing Events entfernen (falls Tabelle existiert)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'billing_events') THEN
    DELETE FROM billing_events 
    WHERE partner_id = '232605e0-2c37-4777-8360-6599504ad144';
    RAISE NOTICE 'Cleaned billing_events';
  END IF;

  -- OAuth Event Logs entfernen (falls Tabelle existiert)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'oauth_event_logs') THEN
    DELETE FROM oauth_event_logs 
    WHERE user_id = '0379d98a-d71a-48a3-a8ca-992c4f15bcfd' 
    OR partner_id = '232605e0-2c37-4777-8360-6599504ad144';
    RAISE NOTICE 'Cleaned oauth_event_logs';
  END IF;

  -- Google Job Queue entfernen (falls Tabelle existiert)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'google_job_queue') THEN
    DELETE FROM google_job_queue 
    WHERE partner_id = '232605e0-2c37-4777-8360-6599504ad144';
    RAISE NOTICE 'Cleaned google_job_queue';
  END IF;

  -- Profile entfernen (zuletzt, falls Tabelle existiert)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    DELETE FROM profiles 
    WHERE id = '0379d98a-d71a-48a3-a8ca-992c4f15bcfd';
    RAISE NOTICE 'Cleaned profiles';
  END IF;

  RAISE NOTICE 'Migration 20250703113506 completed successfully with safe cleanup';
END$$;