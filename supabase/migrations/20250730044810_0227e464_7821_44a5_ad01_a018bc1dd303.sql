-- Migration: Hauptkategorien-Datenpflege - Leere Kategorien beheben
-- Datum: 2025-01-29

-- 1. Cross-Tags für "Kunst, Unterhaltung & Freizeit"
INSERT INTO category_cross_tags (category_id, target_main_category_id, source, confidence_score)
SELECT 
  gc.id, 'eca79b94-6388-4659-bf20-012df3ad3c74'::uuid, 'data_migration', 0.9
FROM gmb_categories gc
WHERE gc.main_category_id = 'd4dcbbf2-b5c3-43c8-8063-b6ee41626721'::uuid
AND NOT EXISTS (
  SELECT 1 FROM category_cross_tags ct 
  WHERE ct.category_id = gc.id AND ct.target_main_category_id = 'eca79b94-6388-4659-bf20-012df3ad3c74'::uuid
);

-- 2. Cross-Tags für "Immobilien & Bauwesen" (home-garden)
INSERT INTO category_cross_tags (category_id, target_main_category_id, source, confidence_score)
SELECT 
  gc.id, '76cb29ad-6614-40a1-ae4f-b59a61fceeff'::uuid, 'data_migration', 0.8
FROM gmb_categories gc
WHERE gc.main_category_id = '82016046-5886-499e-9845-bac6ffdd9a5b'::uuid
AND NOT EXISTS (
  SELECT 1 FROM category_cross_tags ct 
  WHERE ct.category_id = gc.id AND ct.target_main_category_id = '76cb29ad-6614-40a1-ae4f-b59a61fceeff'::uuid
);

-- 3. Technology & Electronics Subcategorien aus "other-services" mappen
INSERT INTO category_cross_tags (category_id, target_main_category_id, source, confidence_score)
SELECT 
  gc.id, '523ea6e7-0f71-45df-83f0-53e7aa0eb460'::uuid, 'ai_categorization', 0.7
FROM gmb_categories gc
WHERE gc.main_category_id = '04661964-a411-4e9a-aa49-e162d5dc762a'::uuid
  AND (
    LOWER(gc.name_de) LIKE '%technologie%' OR LOWER(gc.name_de) LIKE '%elektronik%' OR LOWER(gc.name_de) LIKE '%computer%' OR LOWER(gc.name_de) LIKE '%software%' OR LOWER(gc.name_de) LIKE '%internet%' OR LOWER(gc.name_de) LIKE '%digital%' OR
    LOWER(gc.name_en) LIKE '%technology%' OR LOWER(gc.name_en) LIKE '%electronics%' OR LOWER(gc.name_en) LIKE '%computer%' OR LOWER(gc.name_en) LIKE '%software%' OR LOWER(gc.name_en) LIKE '%internet%' OR LOWER(gc.name_en) LIKE '%digital%'
  )
AND NOT EXISTS (
  SELECT 1 FROM category_cross_tags ct 
  WHERE ct.category_id = gc.id AND ct.target_main_category_id = '523ea6e7-0f71-45df-83f0-53e7aa0eb460'::uuid
);

-- 4. Pets & Animals Subcategorien aus "other-services" mappen
INSERT INTO category_cross_tags (category_id, target_main_category_id, source, confidence_score)
SELECT
  gc.id, '50a58860-b570-4b35-bf69-9945e0c23b0c'::uuid, 'ai_categorization', 0.8
FROM gmb_categories gc
WHERE gc.main_category_id = '04661964-a411-4e9a-aa49-e162d5dc762a'::uuid
  AND (
    LOWER(gc.name_de) LIKE '%tier%' OR LOWER(gc.name_de) LIKE '%haustier%' OR LOWER(gc.name_de) LIKE '%veterinär%' OR LOWER(gc.name_de) LIKE '%zoo%' OR LOWER(gc.name_de) LIKE '%tierklinik%' OR LOWER(gc.name_de) LIKE '%hundefriseur%' OR
    LOWER(gc.name_en) LIKE '%pet%' OR LOWER(gc.name_en) LIKE '%animal%' OR LOWER(gc.name_en) LIKE '%veterinary%' OR LOWER(gc.name_en) LIKE '%zoo%' OR LOWER(gc.name_en) LIKE '%dog%' OR LOWER(gc.name_en) LIKE '%cat%'
  )
AND NOT EXISTS (
  SELECT 1 FROM category_cross_tags ct 
  WHERE ct.category_id = gc.id AND ct.target_main_category_id = '50a58860-b570-4b35-bf69-9945e0c23b0c'::uuid
);

-- 5. Direkte Zuordnung einiger Kategorien zu "home-garden"
UPDATE gmb_categories 
SET main_category_id = '76cb29ad-6614-40a1-ae4f-b59a61fceeff'::uuid
WHERE main_category_id IS NULL AND (
  LOWER(name_de) LIKE '%garten%' OR LOWER(name_de) LIKE '%haus%' OR LOWER(name_de) LIKE '%bau%' OR LOWER(name_de) LIKE '%handwerk%' OR
  LOWER(name_en) LIKE '%garden%' OR LOWER(name_en) LIKE '%home%' OR LOWER(name_en) LIKE '%construction%'
);

-- 6. Logging der Migration
INSERT INTO google_job_queue (job_type, payload, status)
VALUES (
  'data_migration_main_categories',
  jsonb_build_object(
    'migration_type', 'fix_empty_main_categories',
    'affected_categories', ARRAY[
      'entertainment-culture',
      'home-garden', 
      'technology-electronics',
      'pets-animals'
    ],
    'timestamp', now(),
    'method', 'cross_tags_and_direct_mapping'
  ),
  'completed'
);