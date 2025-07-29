-- Fix remaining unmapped gmb_categories
-- Map specific known categories
UPDATE public.gmb_categories 
SET main_category_id = (SELECT id FROM public.main_categories WHERE slug = 'automotive')
WHERE haupt_kategorie = 'Luftfahrt' AND main_category_id IS NULL;

UPDATE public.gmb_categories 
SET main_category_id = (SELECT id FROM public.main_categories WHERE slug = 'other-services')
WHERE haupt_kategorie IN ('Land- und Forstwirtschaft, natürliche Ressourcen', 'Fertigung & Industrie') 
AND main_category_id IS NULL;

-- Map all remaining NULL or unmapped entries to "Sonstige" (other-services)
UPDATE public.gmb_categories 
SET main_category_id = (SELECT id FROM public.main_categories WHERE slug = 'other-services')
WHERE main_category_id IS NULL;