-- Fix remaining functions without search_path - Part 2

-- log_security_event
CREATE OR REPLACE FUNCTION public.log_security_event(p_event_type text, p_user_id uuid DEFAULT NULL::uuid, p_ip_address inet DEFAULT NULL::inet, p_user_agent text DEFAULT NULL::text, p_details jsonb DEFAULT '{}'::jsonb, p_severity text DEFAULT 'info'::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;