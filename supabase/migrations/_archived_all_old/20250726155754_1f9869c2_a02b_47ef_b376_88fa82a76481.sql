-- Fix handle_new_user search_path issue

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, name, language, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'name', 'Neuer Nutzer'),
    COALESCE(NEW.raw_user_meta_data->>'language', 'de'),
    'user'
  );
  RETURN NEW;
END;
$function$;