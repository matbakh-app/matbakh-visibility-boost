-- Fix the SQL function and all remaining plpgsql functions

-- Fix the Security Definer SQL function
CREATE OR REPLACE FUNCTION public.is_admin_user()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
$function$;

-- Fix remaining critical functions
CREATE OR REPLACE FUNCTION public.audit_trigger_function()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;