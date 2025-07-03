-- Entferne User "Pasta di Monaco" und alle zugehörigen Daten
-- Zuerst die abhängigen Tabellen, dann die Haupttabellen

-- Partner Bookings entfernen
DELETE FROM partner_bookings 
WHERE partner_id = '232605e0-2c37-4777-8360-6599504ad144';

-- Partner Onboarding Steps entfernen  
DELETE FROM partner_onboarding_steps 
WHERE partner_id = '232605e0-2c37-4777-8360-6599504ad144';

-- Business Profiles entfernen
DELETE FROM business_profiles 
WHERE partner_id = '232605e0-2c37-4777-8360-6599504ad144';

-- Google OAuth Tokens entfernen
DELETE FROM google_oauth_tokens 
WHERE user_id = '0379d98a-d71a-48a3-a8ca-992c4f15bcfd';

-- Business Partners entfernen
DELETE FROM business_partners 
WHERE id = '232605e0-2c37-4777-8360-6599504ad144';

-- Billing Events entfernen
DELETE FROM billing_events 
WHERE partner_id = '232605e0-2c37-4777-8360-6599504ad144';

-- OAuth Event Logs entfernen
DELETE FROM oauth_event_logs 
WHERE user_id = '0379d98a-d71a-48a3-a8ca-992c4f15bcfd' 
OR partner_id = '232605e0-2c37-4777-8360-6599504ad144';

-- Google Job Queue entfernen
DELETE FROM google_job_queue 
WHERE partner_id = '232605e0-2c37-4777-8360-6599504ad144';

-- Profile entfernen (zuletzt)
DELETE FROM profiles 
WHERE id = '0379d98a-d71a-48a3-a8ca-992c4f15bcfd';