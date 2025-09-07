-- Final security fixes - drop materialized view and fix remaining functions

-- 1. Drop the materialized view that causes Security Definer issue
DROP MATERIALIZED VIEW IF EXISTS public.restaurant_match_scores;

-- 2. Fix remaining functions (these weren't properly updated)

-- update_facebook_oauth_tokens_updated_at  
CREATE OR REPLACE FUNCTION public.update_facebook_oauth_tokens_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- check_security_alerts
CREATE OR REPLACE FUNCTION public.check_security_alerts(p_event_type text, p_user_id uuid, p_severity text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  failed_login_count integer;
  admin_changes_count integer;
BEGIN
  -- Check for excessive failed login attempts (last 15 minutes)
  IF p_event_type = 'login_failed' THEN
    SELECT COUNT(*) INTO failed_login_count
    FROM public.security_events
    WHERE event_type = 'login_failed'
      AND user_id = p_user_id
      AND created_at > now() - interval '15 minutes';

    IF failed_login_count >= 5 THEN
      INSERT INTO public.security_alerts (
        alert_type,
        severity,
        title,
        description,
        user_id,
        metadata
      ) VALUES (
        'excessive_failed_logins',
        'high',
        'Excessive Failed Login Attempts',
        format('User has %s failed login attempts in the last 15 minutes', failed_login_count),
        p_user_id,
        jsonb_build_object('failed_attempts', failed_login_count, 'time_window', '15 minutes')
      );
    END IF;
  END IF;

  -- Check for admin privilege changes (last 1 hour)
  IF p_event_type IN ('role_changed', 'admin_access_granted') THEN
    SELECT COUNT(*) INTO admin_changes_count
    FROM public.security_events
    WHERE event_type IN ('role_changed', 'admin_access_granted')
      AND created_at > now() - interval '1 hour';

    IF admin_changes_count >= 3 THEN
      INSERT INTO public.security_alerts (
        alert_type,
        severity,
        title,
        description,
        user_id,
        metadata
      ) VALUES (
        'suspicious_admin_activity',
        'critical',
        'Suspicious Admin Activity Detected',
        format('%s admin privilege changes detected in the last hour', admin_changes_count),
        p_user_id,
        jsonb_build_object('admin_changes', admin_changes_count, 'time_window', '1 hour')
      );
    END IF;
  END IF;

  -- Alert on any critical severity events
  IF p_severity = 'critical' THEN
    INSERT INTO public.security_alerts (
      alert_type,
      severity,
      title,
      description,
      user_id,
      metadata
    ) VALUES (
      'critical_security_event',
      'critical',
      'Critical Security Event',
      format('Critical security event of type: %s', p_event_type),
      p_user_id,
      jsonb_build_object('event_type', p_event_type)
    );
  END IF;
END;
$function$;