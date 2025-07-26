-- Fix ALL remaining functions without search_path - Part 1

-- cleanup_old_security_data
CREATE OR REPLACE FUNCTION public.cleanup_old_security_data()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

-- process_pending_alerts
CREATE OR REPLACE FUNCTION public.process_pending_alerts()
 RETURNS TABLE(alert_id uuid, alert_type text, severity text, title text, description text, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;