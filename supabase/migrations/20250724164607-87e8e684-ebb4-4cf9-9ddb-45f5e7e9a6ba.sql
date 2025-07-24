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

-- Phase 3 Enhancements: Retention, Sensitive Data Protection, Alert Notifications

-- 1. Data Retention: Automatic cleanup function
CREATE OR REPLACE FUNCTION public.cleanup_old_security_data()
RETURNS VOID AS $$
BEGIN
  -- Remove security audit logs older than 1 year (adjust as needed)
  DELETE FROM public.security_audit_log 
  WHERE created_at < NOW() - INTERVAL '1 year';
  
  -- Remove login attempts older than 6 months
  DELETE FROM public.login_attempts 
  WHERE created_at < NOW() - INTERVAL '6 months';
  
  -- Remove password reset events older than 3 months
  DELETE FROM public.password_reset_events 
  WHERE created_at < NOW() - INTERVAL '3 months';
  
  -- Remove old alerts (resolved ones older than 30 days)
  DELETE FROM public.alerts 
  WHERE status = 'resolved' AND sent_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Enhanced log_security_event function with sensitive data protection
CREATE OR REPLACE FUNCTION public.log_security_event(
  event_type_param TEXT,
  details_param JSONB DEFAULT '{}',
  risk_level_param TEXT DEFAULT 'info'
) RETURNS UUID AS $$
DECLARE
  event_id UUID;
  cleaned_details JSONB;
BEGIN
  -- Clean sensitive data from details
  cleaned_details := details_param;
  
  -- Remove password fields
  IF cleaned_details ? 'password' THEN
    cleaned_details := cleaned_details - 'password' || jsonb_build_object('password', '[REDACTED]');
  END IF;
  
  -- Remove access tokens
  IF cleaned_details ? 'access_token' THEN
    cleaned_details := cleaned_details - 'access_token' || jsonb_build_object('access_token', '[REDACTED]');
  END IF;
  
  -- Remove any field containing 'secret' or 'token'
  SELECT jsonb_object_agg(
    key,
    CASE 
      WHEN key ILIKE '%secret%' OR key ILIKE '%token%' OR key ILIKE '%key%' THEN 
        '"[REDACTED]"'::jsonb
      ELSE value
    END
  ) INTO cleaned_details
  FROM jsonb_each(cleaned_details);
  
  INSERT INTO public.security_audit_log (
    user_id,
    event_type,
    details,
    risk_level,
    ip_address
  ) VALUES (
    auth.uid(),
    event_type_param,
    cleaned_details,
    risk_level_param,
    COALESCE((current_setting('request.headers', true)::jsonb->>'x-forwarded-for')::inet, '0.0.0.0'::inet)
  ) RETURNING id INTO event_id;
  
  -- Trigger immediate alert for critical events
  IF risk_level_param = 'critical' THEN
    INSERT INTO public.alerts (type, message, category, status)
    VALUES (
      'critical_security_event',
      format('Critical security event: %s', event_type_param),
      event_id,
      'pending'
    );
  END IF;
  
  RETURN event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Alert notification function (can be extended with external integrations)
CREATE OR REPLACE FUNCTION public.process_pending_alerts()
RETURNS INTEGER AS $$
DECLARE
  alert_record RECORD;
  processed_count INTEGER := 0;
BEGIN
  -- Process all pending alerts
  FOR alert_record IN 
    SELECT * FROM public.alerts 
    WHERE status = 'pending' 
    ORDER BY sent_at ASC
    LIMIT 100
  LOOP
    -- Log the alert processing (placeholder for actual notification)
    INSERT INTO public.security_audit_log (
      event_type,
      details,
      risk_level
    ) VALUES (
      'alert_processed',
      jsonb_build_object(
        'alert_id', alert_record.id,
        'alert_type', alert_record.type,
        'message', alert_record.message
      ),
      'info'
    );
    
    -- Mark alert as processed
    UPDATE public.alerts 
    SET status = 'sent', 
        sent_at = NOW() 
    WHERE id = alert_record.id;
    
    processed_count := processed_count + 1;
  END LOOP;
  
  RETURN processed_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;