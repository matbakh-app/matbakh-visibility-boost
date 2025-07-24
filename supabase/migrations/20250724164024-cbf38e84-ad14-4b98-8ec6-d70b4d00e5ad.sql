-- Phase 3: Enhanced Security - Audit Triggers & Monitoring Alerts

-- Create audit trigger function for all tables
CREATE OR REPLACE FUNCTION public.audit_table_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Log INSERT operations
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_security_event(
      'table_insert',
      jsonb_build_object(
        'table_name', TG_TABLE_NAME,
        'row_data', to_jsonb(NEW),
        'user_id', auth.uid()
      ),
      'info'
    );
    RETURN NEW;
  END IF;
  
  -- Log UPDATE operations
  IF TG_OP = 'UPDATE' THEN
    PERFORM public.log_security_event(
      'table_update',
      jsonb_build_object(
        'table_name', TG_TABLE_NAME,
        'old_data', to_jsonb(OLD),
        'new_data', to_jsonb(NEW),
        'user_id', auth.uid(),
        'changes', to_jsonb(NEW) - to_jsonb(OLD)
      ),
      'info'
    );
    RETURN NEW;
  END IF;
  
  -- Log DELETE operations
  IF TG_OP = 'DELETE' THEN
    PERFORM public.log_security_event(
      'table_delete',
      jsonb_build_object(
        'table_name', TG_TABLE_NAME,
        'deleted_data', to_jsonb(OLD),
        'user_id', auth.uid()
      ),
      'warn'
    );
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add audit triggers to critical tables
DROP TRIGGER IF EXISTS audit_business_partners ON public.business_partners;
CREATE TRIGGER audit_business_partners
  AFTER INSERT OR UPDATE OR DELETE ON public.business_partners
  FOR EACH ROW EXECUTE FUNCTION public.audit_table_changes();

DROP TRIGGER IF EXISTS audit_profiles ON public.profiles;
CREATE TRIGGER audit_profiles
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.audit_table_changes();

DROP TRIGGER IF EXISTS audit_service_packages ON public.service_packages_legacy;
CREATE TRIGGER audit_service_packages
  AFTER INSERT OR UPDATE OR DELETE ON public.service_packages_legacy
  FOR EACH ROW EXECUTE FUNCTION public.audit_table_changes();

DROP TRIGGER IF EXISTS audit_addon_services ON public.addon_services;
CREATE TRIGGER audit_addon_services
  AFTER INSERT OR UPDATE OR DELETE ON public.addon_services
  FOR EACH ROW EXECUTE FUNCTION public.audit_table_changes();

DROP TRIGGER IF EXISTS audit_fb_conversions_config ON public.fb_conversions_config;
CREATE TRIGGER audit_fb_conversions_config
  AFTER INSERT OR UPDATE OR DELETE ON public.fb_conversions_config
  FOR EACH ROW EXECUTE FUNCTION public.audit_table_changes();

-- Create security alerts monitoring function
CREATE OR REPLACE FUNCTION public.check_security_alerts()
RETURNS VOID AS $$
DECLARE
  critical_events_count INTEGER;
  failed_logins_count INTEGER;
  admin_changes_count INTEGER;
BEGIN
  -- Check for critical security events in last hour
  SELECT COUNT(*) INTO critical_events_count
  FROM public.security_audit_log
  WHERE created_at > NOW() - INTERVAL '1 hour'
    AND risk_level = 'critical';
    
  -- Check for excessive failed login attempts
  SELECT COUNT(*) INTO failed_logins_count
  FROM public.login_attempts
  WHERE created_at > NOW() - INTERVAL '1 hour'
    AND success = false;
    
  -- Check for admin privilege changes
  SELECT COUNT(*) INTO admin_changes_count
  FROM public.security_audit_log
  WHERE created_at > NOW() - INTERVAL '1 hour'
    AND event_type = 'table_update'
    AND details->>'table_name' = 'profiles'
    AND details->'changes'->>'role' IS NOT NULL;

  -- Create alerts if thresholds exceeded
  IF critical_events_count > 5 THEN
    INSERT INTO public.alerts (type, message, category, status)
    VALUES (
      'security_breach',
      format('Critical security events detected: %s events in last hour', critical_events_count),
      gen_random_uuid(),
      'pending'
    );
  END IF;
  
  IF failed_logins_count > 10 THEN
    INSERT INTO public.alerts (type, message, category, status)
    VALUES (
      'brute_force_attempt',
      format('Excessive failed login attempts: %s attempts in last hour', failed_logins_count),
      gen_random_uuid(),
      'pending'
    );
  END IF;
  
  IF admin_changes_count > 0 THEN
    INSERT INTO public.alerts (type, message, category, status)
    VALUES (
      'privilege_escalation',
      format('Admin privilege changes detected: %s changes in last hour', admin_changes_count),
      gen_random_uuid(),
      'pending'
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create index for efficient alert checking
CREATE INDEX IF NOT EXISTS idx_security_audit_log_recent_critical 
ON public.security_audit_log (created_at DESC, risk_level) 
WHERE risk_level = 'critical';

CREATE INDEX IF NOT EXISTS idx_login_attempts_recent_failed 
ON public.login_attempts (created_at DESC, success) 
WHERE success = false;