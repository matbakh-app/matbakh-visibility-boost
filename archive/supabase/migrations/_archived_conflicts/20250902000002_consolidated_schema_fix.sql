-- Consolidated Schema Fix - Task 12.1
-- Fixes all pricing schema and table structure issues

BEGIN;

-- 1. Clean up service_packages structure
DO $$
BEGIN
  -- Backup existing data if service_packages_legacy doesn't exist
  IF to_regclass('public.service_packages_legacy') IS NULL AND to_regclass('public.service_packages') IS NOT NULL THEN
    ALTER TABLE service_packages RENAME TO service_packages_legacy;
  END IF;
END$$;

-- 2. Create new service_packages with correct structure
DROP TABLE IF EXISTS service_packages CASCADE;
CREATE TABLE service_packages (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code               TEXT UNIQUE NOT NULL,
  default_name       TEXT NOT NULL,
  is_recurring       BOOLEAN DEFAULT FALSE,
  interval_months    INT,           -- NULL = one-time
  created_at         TIMESTAMP DEFAULT now()
);

-- 3. Create service_prices table
CREATE TABLE IF NOT EXISTS service_prices (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id         UUID REFERENCES service_packages(id) ON DELETE CASCADE,
  currency           TEXT DEFAULT 'EUR',
  normal_price_cents INT NOT NULL,
  promo_price_cents  INT,
  promo_active       BOOLEAN DEFAULT FALSE,
  valid_from         TIMESTAMP DEFAULT now(),
  valid_to           TIMESTAMP
);

-- 4. Add unique constraint to service_prices (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'service_prices_package_id_key' 
    AND table_name = 'service_prices'
  ) THEN
    ALTER TABLE service_prices
        ADD CONSTRAINT service_prices_package_id_key UNIQUE (package_id);
  END IF;
END$$;

-- 5. Migrate data from legacy table if it exists
INSERT INTO service_packages(id, code, default_name, is_recurring, interval_months)
SELECT id, 
       COALESCE(slug, 'package_' || id::text) as code, 
       COALESCE(name, 'Package ' || id::text) as default_name, 
       (period = 'monthly') as is_recurring,
       CASE WHEN period = 'monthly' THEN 1 ELSE NULL END as interval_months
FROM   service_packages_legacy
WHERE EXISTS (SELECT 1 FROM service_packages_legacy)
ON CONFLICT (code) DO NOTHING;

-- 6. Create sample prices for migrated packages
INSERT INTO service_prices(package_id, normal_price_cents, promo_price_cents, promo_active)
SELECT sp.id, 
       COALESCE(spl.original_price * 100, 29900) as normal_price_cents,
       COALESCE(spl.base_price * 100, 14900) as promo_price_cents,
       TRUE as promo_active
FROM service_packages sp
JOIN service_packages_legacy spl ON sp.code = COALESCE(spl.slug, 'package_' || spl.id::text)
WHERE EXISTS (SELECT 1 FROM service_packages_legacy)
ON CONFLICT (package_id) DO NOTHING;

-- 7. Create other required tables
CREATE TABLE IF NOT EXISTS partner_upload_quota (
  partner_id   UUID PRIMARY KEY,
  month_start  DATE NOT NULL,
  uploads_used INT  DEFAULT 0
);

CREATE TABLE IF NOT EXISTS google_job_queue (
  id             BIGSERIAL PRIMARY KEY,
  partner_id     UUID NOT NULL,
  location_id    TEXT,                 -- GMB location         
  job_type       TEXT NOT NULL,        -- 'create' | 'update' | ...
  payload        JSONB NOT NULL,
  retry_count    INT  DEFAULT 0,
  run_at         TIMESTAMP DEFAULT now(),
  status         TEXT DEFAULT 'pending', -- pending|in_progress|error|done
  error_message  TEXT,
  created_at     TIMESTAMP DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_google_job_queue_run_at_status ON google_job_queue (run_at, status);

CREATE TABLE IF NOT EXISTS billing_events (
  partner_id UUID,
  event      TEXT,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(partner_id, event)
);

-- 8. Add missing columns to business_profiles if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_profiles' AND column_name = 'google_connected') THEN
    ALTER TABLE business_profiles ADD COLUMN google_connected BOOLEAN DEFAULT FALSE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_profiles' AND column_name = 'go_live') THEN
    ALTER TABLE business_profiles ADD COLUMN go_live BOOLEAN DEFAULT FALSE;
  END IF;
END$$;

-- 9. Add missing columns to partner_bookings if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'partner_bookings' AND column_name = 'go_live_required') THEN
    ALTER TABLE partner_bookings ADD COLUMN go_live_required BOOLEAN DEFAULT TRUE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'partner_bookings' AND column_name = 'go_live_at') THEN
    ALTER TABLE partner_bookings ADD COLUMN go_live_at TIMESTAMP;
  END IF;
END$$;

-- 10. Create billing trigger function
CREATE OR REPLACE FUNCTION public.f_event_partner_live()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.google_connected AND NEW.go_live THEN
    INSERT INTO public.billing_events(partner_id, event) VALUES (NEW.id, 'activate_billing')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END$$;

-- 11. Create trigger on business_profiles
DROP TRIGGER IF EXISTS trg_partner_live ON business_profiles;
CREATE TRIGGER trg_partner_live
AFTER UPDATE ON business_profiles
FOR EACH ROW EXECUTE FUNCTION f_event_partner_live();

COMMIT;
