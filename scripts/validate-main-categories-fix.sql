-- Validation script for main categories migration
-- Run this after executing the fix_empty_main_categories migration

-- 1. Check subcategory counts for all 19 main categories
SELECT 
  mc.slug, 
  mc.name_de, 
  COUNT(DISTINCT gc.id) AS direkte_subcats, 
  COUNT(DISTINCT ct.category_id) AS cross_tags,
  (COUNT(DISTINCT gc.id) + COUNT(DISTINCT ct.category_id)) AS total_available
FROM main_categories mc
LEFT JOIN gmb_categories gc ON gc.main_category_id = mc.id
LEFT JOIN category_cross_tags ct ON ct.target_main_category_id = mc.id
GROUP BY mc.slug, mc.name_de
ORDER BY total_available ASC, mc.name_de;

-- 2. Specifically check the 4 previously empty categories
SELECT 
  mc.slug AS kategorie_slug,
  mc.name_de AS kategorie_name,
  COUNT(DISTINCT gc.id) AS direkte_zuordnungen,
  COUNT(DISTINCT ct.category_id) AS cross_tag_zuordnungen,
  (COUNT(DISTINCT gc.id) + COUNT(DISTINCT ct.category_id)) AS gesamt_verfügbar
FROM main_categories mc
LEFT JOIN gmb_categories gc ON gc.main_category_id = mc.id
LEFT JOIN category_cross_tags ct ON ct.target_main_category_id = mc.id
WHERE mc.slug IN ('entertainment-culture', 'home-garden', 'technology-electronics', 'pets-animals')
GROUP BY mc.slug, mc.name_de
ORDER BY gesamt_verfügbar DESC;

-- 3. Check migration logging
SELECT 
  created_at,
  job_type,
  payload->>'affected_categories' AS betroffene_kategorien,
  payload->>'total_cross_tags_created' AS erstellte_cross_tags,
  payload->>'direct_assignments' AS direkte_zuweisungen
FROM google_job_queue 
WHERE job_type = 'data_migration_main_categories'
ORDER BY created_at DESC
LIMIT 5;

-- 4. Verify no category has 0 subcategories anymore
SELECT 
  'Categories with zero subcategories:' AS status,
  COUNT(*) AS anzahl
FROM (
  SELECT 
    mc.slug,
    (COUNT(DISTINCT gc.id) + COUNT(DISTINCT ct.category_id)) AS total
  FROM main_categories mc
  LEFT JOIN gmb_categories gc ON gc.main_category_id = mc.id
  LEFT JOIN category_cross_tags ct ON ct.target_main_category_id = mc.id
  GROUP BY mc.slug
  HAVING (COUNT(DISTINCT gc.id) + COUNT(DISTINCT ct.category_id)) = 0
) empty_cats;