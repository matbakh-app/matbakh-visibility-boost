-- Fix final functions with search_path issues

-- get_business_profile
CREATE OR REPLACE FUNCTION public.get_business_profile(partner_id_param uuid)
 RETURNS TABLE(id uuid, partner_id uuid, business_name text, address text, opening_hours jsonb, photos text[], reviews jsonb, rating numeric, review_count integer, last_updated timestamp without time zone, google_place_id text, phone text, website text, created_at timestamp without time zone, updated_at timestamp without time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    bp.id,
    bp.partner_id,
    bp.business_name,
    bp.address,
    bp.opening_hours,
    bp.photos,
    bp.reviews,
    bp.rating,
    bp.review_count,
    bp.last_updated,
    bp.google_place_id,
    bp.phone,
    bp.website,
    bp.created_at,
    bp.updated_at
  FROM business_profiles bp
  WHERE bp.partner_id = partner_id_param;
END;
$function$;

-- upsert_business_profile
CREATE OR REPLACE FUNCTION public.upsert_business_profile(p_partner_id uuid, p_business_name text, p_address text, p_phone text DEFAULT NULL::text, p_website text DEFAULT NULL::text, p_rating numeric DEFAULT NULL::numeric, p_review_count integer DEFAULT 0, p_photos text[] DEFAULT NULL::text[], p_opening_hours jsonb DEFAULT NULL::jsonb)
 RETURNS SETOF business_profiles
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  INSERT INTO business_profiles (
    partner_id,
    business_name,
    address,
    phone,
    website,
    rating,
    review_count,
    photos,
    opening_hours,
    last_updated,
    updated_at
  ) VALUES (
    p_partner_id,
    p_business_name,
    p_address,
    p_phone,
    p_website,
    p_rating,
    p_review_count,
    p_photos,
    p_opening_hours,
    now(),
    now()
  )
  ON CONFLICT (partner_id)
  DO UPDATE SET
    business_name = EXCLUDED.business_name,
    address = EXCLUDED.address,
    phone = EXCLUDED.phone,
    website = EXCLUDED.website,
    rating = EXCLUDED.rating,
    review_count = EXCLUDED.review_count,
    photos = EXCLUDED.photos,
    opening_hours = EXCLUDED.opening_hours,
    last_updated = now(),
    updated_at = now()
  RETURNING *;
END;
$function$;