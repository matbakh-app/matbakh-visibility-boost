
-- ============================================================================
-- PHASE 1: Critical Security Hardening - RLS Policies and Audit Logging
-- ============================================================================

-- 1. Create audit logging table for service modifications
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.service_audit_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  action text NOT NULL,
  table_name text NOT NULL,
  row_data jsonb,
  old_data jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on audit log (only admins can read)
ALTER TABLE public.service_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs"
  ON public.service_audit_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 2. Harden service_packages RLS policies
-- ============================================================================

-- Drop existing policies to recreate them with better security
DROP POLICY IF EXISTS "Public can view service packages" ON service_packages;
DROP POLICY IF EXISTS "Admins can insert service packages" ON service_packages;
DROP POLICY IF EXISTS "Admins can update service packages" ON service_packages;
DROP POLICY IF EXISTS "Admins can delete service packages" ON service_packages;

-- Allow public read access for service packages (needed for pricing display)
CREATE POLICY "Allow public read access for active packages"
  ON service_packages
  FOR SELECT
  USING (is_active = true);

-- Restrict all write operations to admins only
CREATE POLICY "Admins only can insert packages"
  ON service_packages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins only can update packages"
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

CREATE POLICY "Admins only can delete packages"
  ON service_packages
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 3. Harden service_prices RLS policies
-- ============================================================================

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Public can view service prices" ON service_prices;
DROP POLICY IF EXISTS "Admins can insert service prices" ON service_prices;
DROP POLICY IF EXISTS "Admins can update service prices" ON service_prices;
DROP POLICY IF EXISTS "Admins can delete service prices" ON service_prices;

-- Allow public read access for service prices
CREATE POLICY "Allow public read access for service prices"
  ON service_prices
  FOR SELECT
  USING (true);

-- Restrict all write operations to admins only
CREATE POLICY "Admins only can insert prices"
  ON service_prices
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins only can update prices"
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

CREATE POLICY "Admins only can delete prices"
  ON service_prices
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 4. Create audit logging functions and triggers
-- ============================================================================

-- Function to log service package changes
CREATE OR REPLACE FUNCTION public.log_service_changes() 
RETURNS trigger AS $$
BEGIN
  -- Log INSERT operations
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.service_audit_log (user_id, action, table_name, row_data)
    VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, row_to_json(NEW));
    RETURN NEW;
  END IF;
  
  -- Log UPDATE operations
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO public.service_audit_log (user_id, action, table_name, row_data, old_data)
    VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, row_to_json(NEW), row_to_json(OLD));
    RETURN NEW;
  END IF;
  
  -- Log DELETE operations
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.service_audit_log (user_id, action, table_name, old_data)
    VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, row_to_json(OLD));
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for service_packages
DROP TRIGGER IF EXISTS service_packages_audit ON service_packages;
CREATE TRIGGER service_packages_audit 
  AFTER INSERT OR UPDATE OR DELETE ON service_packages
  FOR EACH ROW EXECUTE FUNCTION public.log_service_changes();

-- Create triggers for service_prices
DROP TRIGGER IF EXISTS service_prices_audit ON service_prices;
CREATE TRIGGER service_prices_audit 
  AFTER INSERT OR UPDATE OR DELETE ON service_prices
  FOR EACH ROW EXECUTE FUNCTION public.log_service_changes();

-- 5. Add security constraints for partner_kpis validation
-- ============================================================================

-- Add check constraints for KPI value ranges
ALTER TABLE partner_kpis 
  ADD CONSTRAINT check_annual_revenue_range 
  CHECK (annual_revenue IS NULL OR (annual_revenue >= 0 AND annual_revenue <= 50000000));

ALTER TABLE partner_kpis 
  ADD CONSTRAINT check_seating_capacity_range 
  CHECK (seating_capacity IS NULL OR (seating_capacity >= 1 AND seating_capacity <= 1000));

ALTER TABLE partner_kpis 
  ADD CONSTRAINT check_food_cost_ratio_range 
  CHECK (food_cost_ratio IS NULL OR (food_cost_ratio >= 0 AND food_cost_ratio <= 100));

ALTER TABLE partner_kpis 
  ADD CONSTRAINT check_labor_cost_ratio_range 
  CHECK (labor_cost_ratio IS NULL OR (labor_cost_ratio >= 0 AND labor_cost_ratio <= 100));

ALTER TABLE partner_kpis 
  ADD CONSTRAINT check_employee_count_range 
  CHECK (employee_count IS NULL OR (employee_count >= 0 AND employee_count <= 1000));

-- 6. Create security event logging table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.security_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type text NOT NULL,
  user_id uuid,
  ip_address inet,
  user_agent text,
  details jsonb DEFAULT '{}',
  severity text DEFAULT 'info' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS - only admins can read security events
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view security events"
  ON public.security_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- System can insert security events
CREATE POLICY "System can insert security events"
  ON public.security_events
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- 7. Create function to validate KPI additional_kpis structure
-- ============================================================================

CREATE OR REPLACE FUNCTION public.validate_additional_kpis(kpis jsonb)
RETURNS boolean AS $$
DECLARE
  kpi_key text;
  kpi_value jsonb;
BEGIN
  -- If kpis is null or empty, it's valid
  IF kpis IS NULL OR kpis = '{}'::jsonb THEN
    RETURN true;
  END IF;
  
  -- Check each KPI entry
  FOR kpi_key, kpi_value IN SELECT * FROM jsonb_each(kpis) LOOP
    -- Value must be a string or number
    IF jsonb_typeof(kpi_value) NOT IN ('string', 'number') THEN
      RETURN false;
    END IF;
    
    -- Key must be a valid identifier (letters, numbers, underscores)
    IF NOT kpi_key ~ '^[a-zA-Z][a-zA-Z0-9_]*$' THEN
      RETURN false;
    END IF;
  END LOOP;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add constraint to validate additional_kpis structure
ALTER TABLE partner_kpis 
  ADD CONSTRAINT check_additional_kpis_structure 
  CHECK (validate_additional_kpis(additional_kpis));
