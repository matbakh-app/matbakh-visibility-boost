
-- MIGRATION DISABLED: Table was recreated with new schema
-- The service_packages table was dropped and recreated in fix-service-packages-migration.sql
-- This cleanup is no longer needed as we start with a clean table

-- Skip all DELETE operations as table is already clean

-- MIGRATION DISABLED: Complex INSERT operations removed
-- The service_packages table already has sample data from fix-service-packages-migration.sql
-- This INSERT would fail due to missing columns (slug, base_price, etc.)
-- Sample data is already provided in the table recreation script

-- Skip INSERT operations as table already has proper sample data
