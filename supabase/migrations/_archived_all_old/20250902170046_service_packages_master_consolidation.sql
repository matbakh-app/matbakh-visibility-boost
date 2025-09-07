-- =========================================================
-- SERVICE PACKAGES MASTER CONSOLIDATION - Task 12.1 FINAL
-- Konsolidierte, konfliktfreie service_packages Struktur
-- Compatible with AWS RDS migration target
-- NO DOCKER REQUIRED VERSION
-- =========================================================

BEGIN;

-- 1. Sichere bestehende Daten falls vorhanden
DO $$
BEGIN
  -- Backup existing service_packages if it exists and legacy doesn't
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'service_packages') 
     AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'service_packages_legacy') THEN
    ALTER TABLE service_packages RENAME TO service_packages_legacy;
    RAISE NOTICE 'Existing service_packages table backed up as service_packages_legacy';
  END IF;
END$$;

-- 2. Erstelle konsolidierte service_packages Struktur (AWS RDS kompatibel)
DROP TABLE IF EXISTS service_packages CASCADE;
CREATE TABLE service_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text,
  slug text,
  default_name text NOT NULL,
  description text,
  base_price numeric(10,2),
  original_price numeric(10,2),
  features text[],
  is_active boolean DEFAULT true,
  is_recurring boolean DEFAULT false,
  is_recommended boolean DEFAULT false,
  interval_months integer,
  min_duration_months integer,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 3. Erstelle service_prices Tabelle
CREATE TABLE IF NOT EXISTS service_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id uuid NOT NULL REFERENCES service_packages(id) ON DELETE CASCADE,
  currency text DEFAULT 'EUR',
  normal_price_cents integer NOT NULL,
  promo_price_cents integer,
  promo_active boolean DEFAULT false,
  valid_from timestamp with time zone DEFAULT now(),
  valid_to timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- 4. Eindeutige Constraints (idempotent)
DO $$
BEGIN
  -- Unique constraint für service_prices
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'service_prices_package_id_key' 
    AND table_name = 'service_prices'
  ) THEN
    ALTER TABLE service_prices ADD CONSTRAINT service_prices_package_id_key UNIQUE (package_id);
  END IF;
END$$;

-- 5. Performance Indexes (keine Duplikate)
CREATE INDEX IF NOT EXISTS idx_service_packages_active ON service_packages(is_active);
CREATE INDEX IF NOT EXISTS idx_service_packages_slug ON service_packages(slug);
CREATE INDEX IF NOT EXISTS idx_service_packages_code ON service_packages(code);
CREATE INDEX IF NOT EXISTS idx_service_packages_recurring ON service_packages(is_recurring);
CREATE INDEX IF NOT EXISTS idx_service_prices_package_id ON service_prices(package_id);
CREATE INDEX IF NOT EXISTS idx_service_prices_currency ON service_prices(currency);

-- 6. Standard Service Packages einfügen
INSERT INTO service_packages (code, default_name, name, slug, description, base_price, original_price, features, is_active, is_recurring, interval_months, min_duration_months) 
VALUES
  ('GBS001', 'Google Business Setup', 'Google Business Setup', 'google-business-setup', 'Vollständige Einrichtung Ihres Google Business Profils', 149.00, 299.00, ARRAY['Vollständige Einrichtung', 'Optimierung für lokale Suchergebnisse', 'Professionelle Kategorisierung'], true, false, NULL, NULL),
  ('PFB001', 'Profilpflege Basis', 'Profilpflege Basis', 'profilpflege-basis', 'Monatliche Pflege Ihres Google Business Profils', 39.00, 59.00, ARRAY['Wöchentliche Updates', 'Monatlicher Bericht', 'Bewertungs-Monitoring'], true, true, 1, 6)
ON CONFLICT (code) DO NOTHING;

-- 7. Entsprechende Preise einfügen
INSERT INTO service_prices (package_id, normal_price_cents, promo_price_cents, promo_active)
SELECT 
  sp.id,
  COALESCE(sp.original_price * 100, 29900)::integer as normal_price_cents,
  COALESCE(sp.base_price * 100, 14900)::integer as promo_price_cents,
  true as promo_active
FROM service_packages sp
WHERE NOT EXISTS (SELECT 1 FROM service_prices WHERE package_id = sp.id);

-- 8. Updated-at Trigger für service_packages
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_service_packages_updated_at ON service_packages;
CREATE TRIGGER update_service_packages_updated_at
  BEFORE UPDATE ON service_packages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;

-- Verification
SELECT 'service_packages' as table_name, count(*) as row_count FROM service_packages
UNION ALL
SELECT 'service_prices' as table_name, count(*) as row_count FROM service_prices;
