-- Fix remaining Function Search Path Security Issues - Part 2

-- 5. migrate_leads_to_user
CREATE OR REPLACE FUNCTION public.migrate_leads_to_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Migriere Leads mit normalisierter E-Mail-Adresse (neueste zuerst, max 10)
  UPDATE visibility_check_leads 
  SET user_id = NEW.id, 
      migrated_to_profile = TRUE
  WHERE LOWER(TRIM(email)) = LOWER(TRIM(NEW.email))
    AND user_id IS NULL 
    AND migrated_to_profile = FALSE
    AND id IN (
      SELECT id FROM visibility_check_leads 
      WHERE LOWER(TRIM(email)) = LOWER(TRIM(NEW.email))
        AND user_id IS NULL 
        AND migrated_to_profile = FALSE
      ORDER BY created_at DESC 
      LIMIT 10
    );
    
  RETURN NEW;
END;
$function$;

-- 6. get_visibility_score
CREATE OR REPLACE FUNCTION public.get_visibility_score(partner_id_param uuid)
 RETURNS TABLE(id uuid, partner_id uuid, business_name text, rating numeric, review_count integer, last_updated timestamp without time zone, rating_score numeric, review_score numeric, photo_score numeric, hours_score numeric, freshness_score numeric, visibility_score numeric)
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
    bp.rating,
    bp.review_count,
    bp.last_updated,
    -- Rating Score (0-40 points)
    COALESCE(bp.rating, 0) * 8 AS rating_score,
    -- Review Score (0-20 points)
    LEAST(bp.review_count, 50) / 2.5 AS review_score,
    -- Photo Score (0-20 points)
    CASE 
      WHEN array_length(bp.photos, 1) >= 5 THEN 20
      WHEN array_length(bp.photos, 1) IS NULL THEN 0
      ELSE array_length(bp.photos, 1) * 4
    END AS photo_score,
    -- Hours Score (0-10 points)
    CASE 
      WHEN bp.opening_hours IS NOT NULL THEN 10
      ELSE 0
    END AS hours_score,
    -- Freshness Score (0-10 points, decreases over time)
    GREATEST(0, 10 - FLOOR(EXTRACT(EPOCH FROM (now() - bp.last_updated)) / 86400)) AS freshness_score,
    -- Total Visibility Score (0-100)
    ROUND(
      LEAST(
        COALESCE(bp.rating, 0) * 8 +
        LEAST(bp.review_count, 50) / 2.5 +
        CASE 
          WHEN array_length(bp.photos, 1) >= 5 THEN 20
          WHEN array_length(bp.photos, 1) IS NULL THEN 0
          ELSE array_length(bp.photos, 1) * 4
        END +
        CASE 
          WHEN bp.opening_hours IS NOT NULL THEN 10
          ELSE 0
        END +
        GREATEST(0, 10 - FLOOR(EXTRACT(EPOCH FROM (now() - bp.last_updated)) / 86400)),
        100
      ), 1
    ) AS visibility_score
  FROM business_profiles bp
  WHERE bp.partner_id = partner_id_param;
END;
$function$;