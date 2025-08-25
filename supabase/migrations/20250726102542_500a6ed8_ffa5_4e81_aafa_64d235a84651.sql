-- Update existing categories to be primary and set correct attributes
UPDATE public.gmb_categories 
SET 
  is_primary = true,
  parent_category_id = NULL,
  sort_order = CASE category_id
    WHEN 'ice_cream_shop' THEN 7
    WHEN 'wine_bar' THEN 10  
    WHEN 'meal_delivery' THEN 13
    WHEN 'butcher_shop' THEN 16
    WHEN 'seafood_restaurant' THEN 17
    WHEN 'vegetarian_restaurant' THEN 18
    WHEN 'sandwich_shop' THEN 19
    ELSE sort_order
  END,
  updated_at = now()
WHERE category_id IN ('ice_cream_shop', 'wine_bar', 'meal_delivery', 'butcher_shop', 'seafood_restaurant', 'vegetarian_restaurant', 'sandwich_shop');