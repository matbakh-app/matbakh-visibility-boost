-- Insert missing gastronomy categories
INSERT INTO public.gmb_categories (
  category_id,
  name_de,
  name_en,
  description_de,
  description_en,
  keywords,
  is_primary,
  is_popular,
  parent_category_id,
  sort_order,
  country_availability,
  created_at,
  updated_at
) VALUES
  ('ice_cream_shop', 'Eisdiele', 'Ice Cream Shop', 'Eisdiele und Gelateria', 'Ice cream shop and gelateria', ARRAY['eis', 'gelato', 'dessert'], true, true, NULL, 7, ARRAY['DE', 'AT', 'CH'], now(), now()),
  ('wine_bar', 'Weinbar', 'Wine Bar', 'Weinbar und Vinothek', 'Wine bar and wine shop', ARRAY['wein', 'vinothek', 'weinprobe'], true, false, NULL, 10, ARRAY['DE', 'AT', 'CH'], now(), now()),
  ('meal_delivery', 'Essenslieferung', 'Meal Delivery', 'Essenslieferung', 'Meal delivery service', ARRAY['lieferung', 'delivery', 'bringdienst'], true, true, NULL, 13, ARRAY['DE', 'AT', 'CH'], now(), now()),
  ('butcher_shop', 'Metzgerei', 'Butcher Shop', 'Metzgerei und Fleischerei', 'Butcher shop and meat store', ARRAY['fleisch', 'metzger', 'wurst'], true, false, NULL, 16, ARRAY['DE', 'AT', 'CH'], now(), now()),
  ('seafood_restaurant', 'Fischrestaurant', 'Seafood Restaurant', 'Fischrestaurant und Meeresfrüchte', 'Seafood restaurant', ARRAY['fisch', 'meeresfrüchte', 'seafood'], true, false, NULL, 17, ARRAY['DE', 'AT', 'CH'], now(), now()),
  ('vegetarian_restaurant', 'Vegetarisches Restaurant', 'Vegetarian Restaurant', 'Vegetarisches und veganes Restaurant', 'Vegetarian and vegan restaurant', ARRAY['vegetarisch', 'vegan', 'gesund'], true, true, NULL, 18, ARRAY['DE', 'AT', 'CH'], now(), now()),
  ('sandwich_shop', 'Sandwich Shop', 'Sandwich Shop', 'Sandwich Shop und Snackbar', 'Sandwich shop and snack bar', ARRAY['sandwich', 'snacks', 'belegtes brot'], true, false, NULL, 19, ARRAY['DE', 'AT', 'CH'], now(), now())
ON CONFLICT (category_id) DO NOTHING;