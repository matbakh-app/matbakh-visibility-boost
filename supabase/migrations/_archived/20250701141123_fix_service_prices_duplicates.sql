
-- Quick-Fix: Duplikate bereinigen und UNIQUE Constraint hinzufügen

-- 1. Duplikate prüfen
SELECT package_id, COUNT(*) 
FROM   service_prices
GROUP  BY package_id
HAVING COUNT(*) > 1;

-- 2. Duplikate entfernen (falls vorhanden) - behält jeweils den ersten Eintrag
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY package_id ORDER BY id) AS rn
  FROM   service_prices
)
DELETE FROM service_prices p
USING  ranked r
WHERE  p.id = r.id
AND    r.rn > 1;

-- 3. UNIQUE-Constraint hinzufügen (nur falls nicht bereits vorhanden)
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

-- 4. Fehlende Preise einfügen (falls die Migration unvollständig war)
INSERT INTO service_prices(package_id, normal_price_cents, promo_price_cents, promo_active)
SELECT sp.id,
       COALESCE(spl.original_price * 100, 29900),
       COALESCE(spl.base_price * 100, 14900),
       TRUE
FROM   service_packages sp
JOIN   service_packages_legacy spl ON sp.code = spl.slug
ON     CONFLICT (package_id) DO NOTHING;
