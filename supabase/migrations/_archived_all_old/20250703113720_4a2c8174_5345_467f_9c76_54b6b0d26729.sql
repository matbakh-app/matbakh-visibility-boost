-- ============================================================================
-- Comprehensive RLS Security Fix Migration
-- ============================================================================

-- 1. ENABLE RLS on tables with existing policies but disabled RLS
-- ============================================================================

ALTER TABLE addon_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_packages_legacy ENABLE ROW LEVEL SECURITY;

-- 2. ENABLE RLS on public tables used via Edge Functions
-- ============================================================================

ALTER TABLE service_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_upload_quota ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_job_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_events ENABLE ROW LEVEL SECURITY;

-- 3. Create default restrictive policies for newly secured tables
-- ============================================================================

-- service_packages: Admin only access
DROP POLICY IF EXISTS "Admin only access to service_packages" ON service_packages;
CREATE POLICY "Admin only access to service_packages"
  ON service_packages
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ));

-- service_prices: Admin only access
DROP POLICY IF EXISTS "Admin only access to service_prices" ON service_prices;
CREATE POLICY "Admin only access to service_prices"
  ON service_prices
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ));

-- partner_upload_quota: Partners can view/update own quota, admins can view all
DROP POLICY IF EXISTS "Partners can manage own upload quota" ON partner_upload_quota;
CREATE POLICY "Partners can manage own upload quota"
  ON partner_upload_quota
  FOR ALL
  USING (
    partner_id IN (
      SELECT bp.id FROM business_partners bp 
      WHERE bp.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- google_job_queue: System and admin access only
DROP POLICY IF EXISTS "System and admin access to job queue" ON google_job_queue;
CREATE POLICY "System and admin access to job queue"
  ON google_job_queue
  FOR ALL
  USING (
    -- Allow system operations (for edge functions)
    auth.role() = 'service_role' OR
    -- Allow admin access
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- billing_events: System and admin access only
DROP POLICY IF EXISTS "System and admin access to billing events" ON billing_events;
CREATE POLICY "System and admin access to billing events"
  ON billing_events
  FOR ALL
  USING (
    -- Allow system operations (for triggers and edge functions)
    auth.role() = 'service_role' OR
    -- Allow admin access
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 4. Create security definer function for admin role check (prevents infinite recursion)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;