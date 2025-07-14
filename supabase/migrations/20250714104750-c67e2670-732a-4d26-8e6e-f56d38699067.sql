-- Phase 3: Add Foreign Key Constraint for data integrity
-- Add foreign key constraint between service_prices and service_packages
ALTER TABLE service_prices 
ADD CONSTRAINT fk_service_prices_package_id 
FOREIGN KEY (package_id) 
REFERENCES service_packages(id) 
ON DELETE CASCADE;