-- Extended GMB Categories Seed - Top-Level Categories
-- Erweitert das Basis-Seed um weitere Hauptkategorien für Winzer-Beispiel

BEGIN;

-- Hospitality & Tourism
INSERT INTO public.gmb_categories (
  public_id, haupt_kategorie, main_category,
  category_id, name_de, name_en,
  is_popular, sort_order, parent_category_id,
  is_primary, parent_id, category_path,
  synonyms, country_availability,
  description_de, description_en,
  keywords, created_at, updated_at
) VALUES 
-- Hospitality Hauptkategorie
(200, 'Gastgewerbe und Tourismus', 'Hospitality & Tourism',
 'hospitality_main', 'Gastgewerbe', 'Hospitality',
 true, 20, null, true, null, 'Hospitality & Tourism',
 array['gastgewerbe','tourismus','hospitality'], array['DE','AT','CH'],
 'Das Gastgewerbe umfasst Restaurants, Hotels, Pensionen und touristische Dienstleistungen. Fokus auf Gästebewirtung und Übernachtung.',
 'Hospitality includes restaurants, hotels, guesthouses and tourism services. Focus on guest services and accommodation.',
 array['hospitality','gastgewerbe','tourismus','hotel','restaurant'], NOW(), NOW()),

-- Restaurant Unterkategorie
(201, 'Gastgewerbe und Tourismus', 'Hospitality & Tourism',
 'hospitality_restaurant', 'Restaurant', 'Restaurant',
 true, 21, 'hospitality_main', true, 200, 'Hospitality & Tourism > Restaurant',
 array['restaurant','gastronomie','speiselokal'], array['DE','AT','CH'],
 'Restaurants und Gaststätten für Speisen und Getränke. Umfasst alle Arten von Gastronomiebetrieben.',
 'Restaurants and dining establishments for food and beverages. Includes all types of dining venues.',
 array['restaurant','gastronomie','essen','trinken','speisen'], NOW(), NOW()),

-- Lodging Unterkategorie  
(202, 'Gastgewerbe und Tourismus', 'Hospitality & Tourism',
 'hospitality_lodging', 'Übernachtung', 'Lodging',
 true, 22, 'hospitality_main', true, 200, 'Hospitality & Tourism > Lodging',
 array['hotel','pension','übernachtung','unterkunft'], array['DE','AT','CH'],
 'Hotels, Pensionen, Ferienwohnungen und andere Übernachtungsmöglichkeiten.',
 'Hotels, guesthouses, vacation rentals and other accommodation options.',
 array['hotel','pension','übernachtung','unterkunft','zimmer'], NOW(), NOW()),

-- Consumer Goods & Retail
(300, 'Einzelhandel und Konsumgüter', 'Consumer Goods & Retail',
 'retail_main', 'Einzelhandel', 'Retail',
 true, 30, null, true, null, 'Consumer Goods & Retail',
 array['einzelhandel','verkauf','handel'], array['DE','AT','CH'],
 'Einzelhandel und Verkauf von Konsumgütern, Lebensmitteln und Produkten an Endverbraucher.',
 'Retail and sale of consumer goods, food and products to end consumers.',
 array['retail','einzelhandel','verkauf','shop','laden'], NOW(), NOW()),

-- Food & Beverage Retail
(301, 'Einzelhandel und Konsumgüter', 'Consumer Goods & Retail',
 'retail_food_beverage', 'Lebensmittel & Getränke', 'Food & Beverage',
 true, 31, 'retail_main', true, 300, 'Consumer Goods & Retail > Food & Beverage',
 array['lebensmittel','getränke','verkauf','direktvermarkter'], array['DE','AT','CH'],
 'Verkauf von Lebensmitteln und Getränken, einschließlich Direktvermarkter und Hofläden.',
 'Sale of food and beverages, including direct marketers and farm shops.',
 array['lebensmittel','getränke','wein','verkauf','hofladen','direktvermarkter'], NOW(), NOW()),

-- Wine Production (Unterkategorie von Agriculture)
(101, 'Land- und Forstwirtschaft, natürliche Ressourcen', 'Agriculture & Natural Resources',
 'agri_wine_production', 'Weinbau', 'Wine Production',
 true, 11, 'agri_cultural', false, 100, 'Agriculture & Natural Resources > Wine Production',
 array['weinbau','winzer','weingut','rebanbau'], array['DE','AT','CH'],
 'Weinbau und Weinproduktion, einschließlich Traubenzucht, Kelterung und Weinvermarktung.',
 'Wine production and viticulture, including grape growing, winemaking and wine marketing.',
 array['weinbau','winzer','wein','reben','trauben','weingut','kelter','vinothek'], NOW(), NOW())

ON CONFLICT (category_id) DO UPDATE SET
  haupt_kategorie = EXCLUDED.haupt_kategorie,
  main_category = EXCLUDED.main_category,
  name_de = EXCLUDED.name_de,
  name_en = EXCLUDED.name_en,
  is_popular = EXCLUDED.is_popular,
  sort_order = EXCLUDED.sort_order,
  parent_category_id = EXCLUDED.parent_category_id,
  is_primary = EXCLUDED.is_primary,
  parent_id = EXCLUDED.parent_id,
  category_path = EXCLUDED.category_path,
  synonyms = EXCLUDED.synonyms,
  country_availability = EXCLUDED.country_availability,
  description_de = EXCLUDED.description_de,
  description_en = EXCLUDED.description_en,
  keywords = EXCLUDED.keywords;

-- Cross-Tags für Winzer-Beispiel
INSERT INTO public.category_cross_tags (category_id, target_main_category_id, confidence_score, notes)
VALUES 
-- Winzer verkauft auch Wein (Retail)
('agri_wine_production', 'retail_food_beverage', 0.8, 'Winzer verkaufen oft direkt an Endkunden'),
-- Winzer hat oft Restaurant/Straußwirtschaft
('agri_wine_production', 'hospitality_restaurant', 0.7, 'Viele Weingüter haben Straußwirtschaften oder Restaurants'),
-- Winzer bietet oft Übernachtung
('agri_wine_production', 'hospitality_lodging', 0.6, 'Weingüter bieten oft Gästezimmer oder Ferienwohnungen an')

ON CONFLICT (category_id, target_main_category_id) DO UPDATE SET
  confidence_score = EXCLUDED.confidence_score,
  notes = EXCLUDED.notes;

COMMIT;