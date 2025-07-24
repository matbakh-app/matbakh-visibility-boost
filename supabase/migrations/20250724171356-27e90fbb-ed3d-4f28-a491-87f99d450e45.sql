-- First, create the security_audit_log table that was referenced but missing
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  table_name text NOT NULL,
  operation text NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data jsonb,
  new_data jsonb,
  changed_fields text[],
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access only
CREATE POLICY "Admins can view all audit logs" ON public.security_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- System can insert audit logs
CREATE POLICY "System can insert audit logs" ON public.security_audit_log
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_security_audit_log_user_id ON public.security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_table_name ON public.security_audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_created_at ON public.security_audit_log(created_at);

-- Create security_alerts table
CREATE TABLE IF NOT EXISTS public.security_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type text NOT NULL,
  severity text NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title text NOT NULL,
  description text NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  metadata jsonb DEFAULT '{}',
  resolved boolean DEFAULT false,
  resolved_by uuid REFERENCES auth.users(id),
  resolved_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for security_alerts
ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;

-- Admins can manage all alerts
CREATE POLICY "Admins can manage security alerts" ON public.security_alerts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- System can insert alerts
CREATE POLICY "System can insert security alerts" ON public.security_alerts
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_security_alerts_severity ON public.security_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_security_alerts_resolved ON public.security_alerts(resolved);
CREATE INDEX IF NOT EXISTS idx_security_alerts_created_at ON public.security_alerts(created_at);

-- Create the enhanced log_security_event function
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
BEGIN
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
    p_user_id,
    p_ip_address,
    p_user_agent,
    sanitized_details,
    p_severity
  );

  -- Check for critical events and create alerts
  PERFORM public.check_security_alerts(p_event_type, p_user_id, p_severity);
END;
$$;

-- Function to check for security patterns and create alerts
CREATE OR REPLACE FUNCTION public.check_security_alerts(
  p_event_type text,
  p_user_id uuid,
  p_severity text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;