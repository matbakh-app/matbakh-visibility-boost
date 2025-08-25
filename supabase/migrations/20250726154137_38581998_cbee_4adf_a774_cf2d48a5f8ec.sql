-- Fix Security Definer View and remaining Function Search Path issues

-- 1. Drop problematic admin_booking_details view (empty definition)
DROP VIEW IF EXISTS public.admin_booking_details;

-- 2. Fix remaining functions with search_path issues

-- log_service_changes
CREATE OR REPLACE FUNCTION public.log_service_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
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
$function$;

-- validate_additional_kpis
CREATE OR REPLACE FUNCTION public.validate_additional_kpis(kpis jsonb)
 RETURNS boolean
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
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
$function$;