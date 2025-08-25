-- Insert 19 main gastronomy categories with proper structure
INSERT INTO public.gmb_categories (
  category_id,
  name_de,
  name_en,
  description,
  keywords,
  is_primary,
  is_popular,
  parent_category_id,
  sort_order,
  country_availability,
  created_at,
  updated_at
) VALUES
  ('restaurant', 'Restaurant', 'Restaurant', 'Allgemeine Gastronomie', ARRAY['gastronomie', 'essen', 'restaurant'], true, true, NULL, 1, ARRAY['DE', 'AT', 'CH'], now(), now()),
  ('cafe', 'Café', 'Cafe', 'Café und Kaffeehaus', ARRAY['kaffee', 'café', 'frühstück'], true, true, NULL, 2, ARRAY['DE', 'AT', 'CH'], now(), now()),
  ('bar', 'Bar', 'Bar', 'Bar und Lounge', ARRAY['cocktails', 'drinks', 'abends'], true, true, NULL, 3, ARRAY['DE', 'AT', 'CH'], now(), now()),
  ('bakery', 'Bäckerei', 'Bakery', 'Bäckerei und Konditorei', ARRAY['brot', 'kuchen', 'backwaren'], true, true, NULL, 4, ARRAY['DE', 'AT', 'CH'], now(), now()),
  ('fast_food', 'Schnellrestaurant', 'Fast Food Restaurant', 'Schnellrestaurant und Imbiss', ARRAY['schnell', 'imbiss', 'takeaway'], true, true, NULL, 5, ARRAY['DE', 'AT', 'CH'], now(), now()),
  ('pizza_place', 'Pizzeria', 'Pizza Place', 'Pizzeria', ARRAY['pizza', 'italienisch'], true, true, NULL, 6, ARRAY['DE', 'AT', 'CH'], now(), now()),
  ('ice_cream_shop', 'Eisdiele', 'Ice Cream Shop', 'Eisdiele und Gelateria', ARRAY['eis', 'gelato', 'dessert'], true, true, NULL, 7, ARRAY['DE', 'AT', 'CH'], now(), now()),
  ('food_truck', 'Food Truck', 'Food Truck', 'Mobiles Restaurant', ARRAY['mobil', 'street food'], true, false, NULL, 8, ARRAY['DE', 'AT', 'CH'], now(), now()),
  ('brewery', 'Brauerei', 'Brewery', 'Brauerei mit Gastronomie', ARRAY['bier', 'brauen', 'gasthaus'], true, false, NULL, 9, ARRAY['DE', 'AT', 'CH'], now(), now()),
  ('wine_bar', 'Weinbar', 'Wine Bar', 'Weinbar und Vinothek', ARRAY['wein', 'vinothek', 'weinprobe'], true, false, NULL, 10, ARRAY['DE', 'AT', 'CH'], now(), now()),
  ('night_club', 'Nachtclub', 'Night Club', 'Nachtclub und Diskothek', ARRAY['club', 'tanzen', 'nachtleben'], true, false, NULL, 11, ARRAY['DE', 'AT', 'CH'], now(), now()),
  ('meal_takeaway', 'Lieferservice', 'Meal Takeaway', 'Lieferservice und Abholdienst', ARRAY['lieferung', 'abholen', 'takeaway'], true, true, NULL, 12, ARRAY['DE', 'AT', 'CH'], now(), now()),
  ('meal_delivery', 'Essenslieferung', 'Meal Delivery', 'Essenslieferung', ARRAY['lieferung', 'delivery', 'bringdienst'], true, true, NULL, 13, ARRAY['DE', 'AT', 'CH'], now(), now()),
  ('catering_service', 'Catering', 'Catering Service', 'Catering und Eventgastronomie', ARRAY['catering', 'events', 'feiern'], true, false, NULL, 14, ARRAY['DE', 'AT', 'CH'], now(), now()),
  ('deli', 'Feinkost', 'Delicatessen', 'Feinkostgeschäft', ARRAY['feinkost', 'delikatessen', 'gourmet'], true, false, NULL, 15, ARRAY['DE', 'AT', 'CH'], now(), now()),
  ('butcher_shop', 'Metzgerei', 'Butcher Shop', 'Metzgerei und Fleischerei', ARRAY['fleisch', 'metzger', 'wurst'], true, false, NULL, 16, ARRAY['DE', 'AT', 'CH'], now(), now()),
  ('seafood_restaurant', 'Fischrestaurant', 'Seafood Restaurant', 'Fischrestaurant und Meeresfrüchte', ARRAY['fisch', 'meeresfrüchte', 'seafood'], true, false, NULL, 17, ARRAY['DE', 'AT', 'CH'], now(), now()),
  ('vegetarian_restaurant', 'Vegetarisches Restaurant', 'Vegetarian Restaurant', 'Vegetarisches und veganes Restaurant', ARRAY['vegetarisch', 'vegan', 'gesund'], true, true, NULL, 18, ARRAY['DE', 'AT', 'CH'], now(), now()),
  ('sandwich_shop', 'Sandwich Shop', 'Sandwich Shop', 'Sandwich Shop und Snackbar', ARRAY['sandwich', 'snacks', 'belegtes brot'], true, false, NULL, 19, ARRAY['DE', 'AT', 'CH'], now(), now())

ON CONFLICT (category_id) 
DO UPDATE SET
  name_de = EXCLUDED.name_de,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  keywords = EXCLUDED.keywords,
  is_primary = EXCLUDED.is_primary,
  is_popular = EXCLUDED.is_popular,
  sort_order = EXCLUDED.sort_order,
  country_availability = EXCLUDED.country_availability,
  updated_at = now();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_gmb_categories_primary ON public.gmb_categories (is_primary) WHERE is_primary = true;
CREATE INDEX IF NOT EXISTS idx_gmb_categories_sort ON public.gmb_categories (sort_order);
CREATE INDEX IF NOT EXISTS idx_gmb_categories_parent ON public.gmb_categories (parent_category_id);