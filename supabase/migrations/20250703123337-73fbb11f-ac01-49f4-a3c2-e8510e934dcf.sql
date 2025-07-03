-- Fix RLS policies for service_packages and service_prices to allow public read access
-- while maintaining secure admin-only write access

-- ============================================================================
-- SERVICE_PACKAGES: Public Read + Admin Write Policies
-- ============================================================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admin only access to service_packages" ON service_packages;

-- Allow public read access to service packages
CREATE POLICY "Public can view service packages"
  ON service_packages
  FOR SELECT
  USING (true);

-- Admin-only policies for write operations
CREATE POLICY "Admins can insert service packages"
  ON service_packages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update service packages"
  ON service_packages
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete service packages"
  ON service_packages
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- SERVICE_PRICES: Public Read + Admin Write Policies  
-- ============================================================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admin only access to service_prices" ON service_prices;

-- Allow public read access to service prices
CREATE POLICY "Public can view service prices"
  ON service_prices
  FOR SELECT
  USING (true);

-- Admin-only policies for write operations
CREATE POLICY "Admins can insert service prices"
  ON service_prices
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update service prices"
  ON service_prices
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete service prices"
  ON service_prices
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- Optional: Add is_active fields for better visibility control
-- ============================================================================

-- Add is_active to service_packages if not exists
ALTER TABLE service_packages 
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Future enhancement: Update public read policy to only show active packages
-- Uncomment this if you want to filter by active status:
-- DROP POLICY "Public can view service packages" ON service_packages;
-- CREATE POLICY "Public can view active service packages"
--   ON service_packages
--   FOR SELECT
--   USING (is_active = true);