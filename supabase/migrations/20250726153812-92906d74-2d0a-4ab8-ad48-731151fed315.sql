-- Fix Function Search Path Security Issues
-- Add SET search_path TO 'public' to all functions without it

-- 1. update_visibility_leads_updated_at
CREATE OR REPLACE FUNCTION public.update_visibility_leads_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

-- 2. update_visibility_actions_updated_at  
CREATE OR REPLACE FUNCTION public.update_visibility_actions_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

-- 3. update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

-- 4. refresh_restaurant_match_scores
CREATE OR REPLACE FUNCTION public.refresh_restaurant_match_scores()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.restaurant_match_scores;
END;
$function$;