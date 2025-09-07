-- Now add audit triggers for critical tables and complete security implementation

-- Create the generic audit trigger function
CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  changed_fields text[] := '{}';
  field_name text;
  old_val text;
  new_val text;
BEGIN
  -- Determine changed fields for UPDATE operations
  IF TG_OP = 'UPDATE' THEN
    FOR field_name IN
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = TG_TABLE_NAME 
        AND table_schema = TG_TABLE_SCHEMA
    LOOP
      EXECUTE format('SELECT ($1).%I::text, ($2).%I::text', field_name, field_name)
      USING OLD, NEW
      INTO old_val, new_val;
      
      IF old_val IS DISTINCT FROM new_val THEN
        changed_fields := changed_fields || field_name;
      END IF;
    END LOOP;
  END IF;

  -- Insert audit record
  INSERT INTO public.security_audit_log (
    user_id,
    table_name,
    operation,
    old_data,
    new_data,
    changed_fields,
    ip_address,
    user_agent
  ) VALUES (
    auth.uid(),
    TG_TABLE_NAME,
    TG_OP,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END,
    changed_fields,
    inet(current_setting('request.header.x-forwarded-for', true)),
    current_setting('request.header.user-agent', true)
  );

  -- Return appropriate record
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Create audit triggers for critical tables
CREATE TRIGGER audit_trigger_business_partners 
  AFTER INSERT OR UPDATE OR DELETE ON public.business_partners
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

CREATE TRIGGER audit_trigger_profiles 
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

CREATE TRIGGER audit_trigger_service_packages_legacy 
  AFTER INSERT OR UPDATE OR DELETE ON public.service_packages_legacy
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

CREATE TRIGGER audit_trigger_addon_services 
  AFTER INSERT OR UPDATE OR DELETE ON public.addon_services
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

CREATE TRIGGER audit_trigger_fb_conversions_config 
  AFTER INSERT OR UPDATE OR DELETE ON public.fb_conversions_config
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Create cleanup functions for old data (DSGVO compliance)
CREATE OR REPLACE FUNCTION public.cleanup_old_security_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete security events older than 2 years
  DELETE FROM public.security_events 
  WHERE created_at < now() - interval '2 years';
  
  -- Delete audit logs older than 3 years
  DELETE FROM public.security_audit_log 
  WHERE created_at < now() - interval '3 years';
  
  -- Delete resolved security alerts older than 1 year
  DELETE FROM public.security_alerts 
  WHERE resolved = true 
    AND resolved_at < now() - interval '1 year';
    
  -- Log cleanup activity
  INSERT INTO public.security_events (
    event_type,
    severity,
    details
  ) VALUES (
    'data_cleanup',
    'info',
    jsonb_build_object(
      'cleanup_type', 'scheduled_security_data_cleanup',
      'timestamp', now()
    )
  );
END;
$$;

-- Create function to process pending alerts (for future notification system)
CREATE OR REPLACE FUNCTION public.process_pending_alerts()
RETURNS TABLE(
  alert_id uuid,
  alert_type text,
  severity text,
  title text,
  description text,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sa.id,
    sa.alert_type,
    sa.severity,
    sa.title,
    sa.description,
    sa.created_at
  FROM public.security_alerts sa
  WHERE sa.resolved = false
    AND sa.severity IN ('high', 'critical')
  ORDER BY 
    CASE sa.severity 
      WHEN 'critical' THEN 1 
      WHEN 'high' THEN 2 
      ELSE 3 
    END,
    sa.created_at DESC;
END;
$$;

-- Create indexes for efficient alert and audit querying
CREATE INDEX IF NOT EXISTS idx_security_events_event_type_created_at 
  ON public.security_events(event_type, created_at);

CREATE INDEX IF NOT EXISTS idx_security_audit_log_table_operation 
  ON public.security_audit_log(table_name, operation);

-- Update the existing log_security_event function to handle IP and User-Agent better
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_event_type text,
  p_user_id uuid DEFAULT NULL,
  p_ip_address inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_details jsonb DEFAULT '{}',
  p_severity text DEFAULT 'info'
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sanitized_details jsonb := '{}';
  key text;
  value jsonb;
  actual_ip_address inet;
  actual_user_agent text;
BEGIN
  -- Get IP and User Agent if not provided
  BEGIN
    actual_ip_address := COALESCE(
      p_ip_address,
      inet(current_setting('request.header.x-forwarded-for', true))
    );
  EXCEPTION WHEN OTHERS THEN
    actual_ip_address := NULL;
  END;
  
  BEGIN
    actual_user_agent := COALESCE(
      p_user_agent,
      current_setting('request.header.user-agent', true)
    );
  EXCEPTION WHEN OTHERS THEN
    actual_user_agent := NULL;
  END;

  -- Sanitize sensitive data from details
  FOR key, value IN SELECT * FROM jsonb_each(p_details) LOOP
    -- Skip sensitive fields
    IF key NOT IN ('password', 'token', 'access_token', 'refresh_token', 'secret', 'private_key', 'api_key') THEN
      sanitized_details := sanitized_details || jsonb_build_object(key, value);
    ELSE
      -- Log that sensitive data was redacted
      sanitized_details := sanitized_details || jsonb_build_object(key, '[REDACTED]');
    END IF;
  END LOOP;

  -- Insert the security event
  INSERT INTO public.security_events (
    event_type,
    user_id,
    ip_address,
    user_agent,
    details,
    severity
  ) VALUES (
    p_event_type,
    COALESCE(p_user_id, auth.uid()),
    actual_ip_address,
    actual_user_agent,
    sanitized_details,
    p_severity
  );

  -- Check for critical events and create alerts
  PERFORM public.check_security_alerts(p_event_type, COALESCE(p_user_id, auth.uid()), p_severity);
END;
$$;

-- Enable RLS on tables that might be missing it
ALTER TABLE public.business_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visibility_check_leads ENABLE ROW LEVEL SECURITY;

-- Create comprehensive indexes for performance
CREATE INDEX IF NOT EXISTS idx_security_events_user_severity 
  ON public.security_events(user_id, severity);
  
CREATE INDEX IF NOT EXISTS idx_security_alerts_user_severity 
  ON public.security_alerts(user_id, severity);

-- Add a function to resolve security alerts
CREATE OR REPLACE FUNCTION public.resolve_security_alert(
  p_alert_id uuid,
  p_resolved_by uuid DEFAULT NULL
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.security_alerts 
  SET 
    resolved = true,
    resolved_by = COALESCE(p_resolved_by, auth.uid()),
    resolved_at = now()
  WHERE id = p_alert_id
    AND resolved = false;
    
  -- Log the resolution
  INSERT INTO public.security_events (
    event_type,
    user_id,
    severity,
    details
  ) VALUES (
    'alert_resolved',
    COALESCE(p_resolved_by, auth.uid()),
    'info',
    jsonb_build_object('alert_id', p_alert_id)
  );
  
  RETURN FOUND;
END;
$$;