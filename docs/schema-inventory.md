# Schema Inventory - matbakh.app Database Audit

## Tabellenübersicht (Supabase Postgres)

### Core Business Tables

| Schema | Table | Est. Rows | Primary Key | Foreign Keys | Indexes | RLS Status |
|--------|-------|-----------|-------------|--------------|---------|------------|
| public | user_profiles | ~500 | id (uuid) | - | id, email | ✅ Enabled |
| public | organizations | ~200 | id (uuid) | - | id, slug | ✅ Enabled |
| public | locations | ~300 | id (uuid) | organization_id | id, org_id | ✅ Enabled |
| public | onboarding_progress | ~400 | id (uuid) | user_id | id, user_id | ✅ Enabled |
| public | communication_prefs | ~450 | user_id (uuid) | user_id | user_id | ✅ Enabled |

### Taxonomy & Category Tables

| Schema | Table | Est. Rows | Primary Key | Foreign Keys | Indexes | RLS Status |
|--------|-------|-----------|-------------|--------------|---------|------------|
| public | gmb_categories | ~2000 | id (uuid) | parent_category_id | id, slug, locale | ❌ Disabled |
| public | business_categories | ~150 | id (uuid) | - | id, slug | ❌ Disabled |
| public | service_offerings | ~80 | id (uuid) | - | id, category_id | ❌ Disabled |
| public | industry_tags | ~120 | id (uuid) | - | id, slug | ❌ Disabled |

### Analytics & Tracking Tables

| Schema | Table | Est. Rows | Primary Key | Foreign Keys | Indexes | RLS Status |
|--------|-------|-----------|-------------|--------------|---------|------------|
| public | visibility_checks | ~800 | id (uuid) | user_id, location_id | id, user_id, created_at | ✅ Enabled |
| public | analytics_events | ~15000 | id (uuid) | user_id | id, user_id, event_type, created_at | ✅ Enabled |
| public | email_events | ~5000 | id (uuid) | user_id | id, user_id, event_type | ✅ Enabled |

## SQL-Snippets für Schema-Audit (READ-ONLY)

### Rowcount & RLS Status
```sql
-- Tabellen-Übersicht mit geschätzten Zeilen
SELECT 
    schemaname, 
    relname AS table_name, 
    n_live_tup AS est_rows,
    n_dead_tup AS dead_rows
FROM pg_stat_user_tables 
ORDER BY est_rows DESC;

-- RLS-Policies Übersicht
SELECT 
    schemaname, 
    tablename, 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
ORDER BY schemaname, tablename;

-- Tabellen ohne RLS (potentielle Sicherheitslücken)
SELECT 
    t.table_name,
    CASE WHEN p.tablename IS NULL THEN 'NO RLS' ELSE 'RLS ENABLED' END as rls_status
FROM information_schema.tables t
LEFT JOIN pg_policies p ON t.table_name = p.tablename
WHERE t.table_schema = 'public' 
    AND t.table_type = 'BASE TABLE'
GROUP BY t.table_name, p.tablename
ORDER BY t.table_name;
```

### GMB Categories Audit
```sql
-- Locale-Abdeckung in gmb_categories
SELECT 
    locale, 
    COUNT(*) AS total_categories,
    COUNT(DISTINCT slug) AS unique_slugs,
    COUNT(DISTINCT parent_category_id) AS parent_categories
FROM public.gmb_categories 
GROUP BY locale
ORDER BY locale;

-- Dubletten-Check: Slugs mit mehreren Varianten
SELECT 
    slug, 
    COUNT(*) AS variants,
    STRING_AGG(DISTINCT locale, ', ') AS locales,
    STRING_AGG(DISTINCT name_de, ' | ') AS names_de
FROM public.gmb_categories 
GROUP BY slug 
HAVING COUNT(*) > 1 
ORDER BY variants DESC
LIMIT 20;

-- Fehlende EN-Übersetzungen für DE-Kategorien
SELECT 
    slug,
    name_de,
    category_id,
    is_popular
FROM public.gmb_categories 
WHERE locale = 'de' 
    AND slug NOT IN (
        SELECT slug 
        FROM public.gmb_categories 
        WHERE locale = 'en'
    )
ORDER BY is_popular DESC, name_de
LIMIT 50;

-- Fehlende DE-Übersetzungen für EN-Kategorien
SELECT 
    slug,
    name_en,
    category_id,
    is_popular
FROM public.gmb_categories 
WHERE locale = 'en' 
    AND slug NOT IN (
        SELECT slug 
        FROM public.gmb_categories 
        WHERE locale = 'de'
    )
ORDER BY is_popular DESC, name_en
LIMIT 50;

-- Kategorien ohne Slug (potentielle Datenqualitätsprobleme)
SELECT 
    id,
    category_id,
    name_de,
    name_en,
    locale,
    created_at
FROM public.gmb_categories 
WHERE slug IS NULL OR slug = ''
ORDER BY created_at DESC;

-- Sonderzeichen und Plural-Probleme in Slugs
SELECT 
    slug,
    name_de,
    name_en,
    locale,
    CASE 
        WHEN slug ~ '[^a-z0-9\-]' THEN 'Special chars'
        WHEN slug LIKE '%s' THEN 'Potential plural'
        WHEN LENGTH(slug) > 50 THEN 'Too long'
        ELSE 'OK'
    END as slug_issue
FROM public.gmb_categories 
WHERE slug ~ '[^a-z0-9\-]' 
    OR slug LIKE '%s' 
    OR LENGTH(slug) > 50
ORDER BY slug_issue, slug;

-- Beliebte Kategorien ohne Parent (Top-Level-Kategorien)
SELECT 
    slug,
    name_de,
    name_en,
    category_id,
    is_popular,
    sort_order
FROM public.gmb_categories 
WHERE parent_category_id IS NULL 
    AND is_popular = true
    AND locale = 'de'
ORDER BY sort_order, name_de;

-- Hierarchie-Tiefe Check
WITH RECURSIVE category_hierarchy AS (
    -- Base case: Top-level categories
    SELECT 
        id,
        slug,
        name_de,
        parent_category_id,
        0 as depth,
        ARRAY[slug] as path
    FROM public.gmb_categories 
    WHERE parent_category_id IS NULL AND locale = 'de'
    
    UNION ALL
    
    -- Recursive case: Child categories
    SELECT 
        c.id,
        c.slug,
        c.name_de,
        c.parent_category_id,
        ch.depth + 1,
        ch.path || c.slug
    FROM public.gmb_categories c
    JOIN category_hierarchy ch ON c.parent_category_id = ch.id
    WHERE c.locale = 'de'
)
SELECT 
    depth,
    COUNT(*) as categories_at_depth,
    MAX(array_length(path, 1)) as max_path_length
FROM category_hierarchy 
GROUP BY depth 
ORDER BY depth;
```

### Business Categories & Offerings Audit
```sql
-- Business Categories Übersicht
SELECT 
    slug,
    name,
    description,
    is_active,
    created_at
FROM public.business_categories 
ORDER BY is_active DESC, name;

-- Service Offerings pro Kategorie
SELECT 
    bc.name as category_name,
    COUNT(so.id) as offering_count,
    STRING_AGG(so.name, ', ') as offerings
FROM public.business_categories bc
LEFT JOIN public.service_offerings so ON bc.id = so.category_id
GROUP BY bc.id, bc.name
ORDER BY offering_count DESC;

-- Verwaiste Service Offerings (ohne Kategorie)
SELECT 
    id,
    name,
    description,
    category_id,
    created_at
FROM public.service_offerings 
WHERE category_id IS NULL 
    OR category_id NOT IN (SELECT id FROM public.business_categories)
ORDER BY created_at DESC;
```

### Index-Analyse
```sql
-- Index-Übersicht für Performance-Optimierung
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
    AND tablename IN ('gmb_categories', 'business_categories', 'service_offerings')
ORDER BY tablename, indexname;

-- Fehlende Indizes identifizieren
SELECT 
    'gmb_categories' as table_name,
    'Missing index on (locale, is_popular)' as recommendation
WHERE NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'gmb_categories' 
        AND indexdef LIKE '%locale%' 
        AND indexdef LIKE '%is_popular%'
)

UNION ALL

SELECT 
    'gmb_categories' as table_name,
    'Missing index on (parent_category_id, sort_order)' as recommendation
WHERE NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'gmb_categories' 
        AND indexdef LIKE '%parent_category_id%' 
        AND indexdef LIKE '%sort_order%'
);
```

### Datenqualitäts-Checks
```sql
-- Konsistenz-Check: Kategorien mit unterschiedlichen Namen für gleiche category_id
SELECT 
    category_id,
    COUNT(DISTINCT name_de) as distinct_names_de,
    COUNT(DISTINCT name_en) as distinct_names_en,
    STRING_AGG(DISTINCT name_de, ' | ') as all_names_de
FROM public.gmb_categories 
GROUP BY category_id 
HAVING COUNT(DISTINCT name_de) > 1 OR COUNT(DISTINCT name_en) > 1
ORDER BY category_id;

-- Aktualitäts-Check: Alte Kategorien ohne Updates
SELECT 
    slug,
    name_de,
    category_id,
    created_at,
    updated_at,
    AGE(NOW(), updated_at) as age
FROM public.gmb_categories 
WHERE locale = 'de'
    AND updated_at < NOW() - INTERVAL '1 year'
ORDER BY updated_at ASC
LIMIT 20;

-- Vollständigkeits-Check: Kategorien ohne Beschreibung oder Metadaten
SELECT 
    slug,
    name_de,
    CASE WHEN description IS NULL OR description = '' THEN 'Missing description' ELSE 'OK' END as desc_status,
    CASE WHEN sort_order IS NULL THEN 'Missing sort_order' ELSE 'OK' END as sort_status,
    is_popular
FROM public.gmb_categories 
WHERE locale = 'de'
    AND (description IS NULL OR description = '' OR sort_order IS NULL)
ORDER BY is_popular DESC, name_de;
```

## Erkenntnisse aus Schema-Audit

### Kritische Befunde
1. **RLS nicht aktiviert** für Taxonomie-Tabellen (gmb_categories, business_categories)
2. **Locale-Inkonsistenzen** zwischen DE/EN Übersetzungen
3. **Fehlende Indizes** für Performance-kritische Abfragen
4. **Dubletten** bei Slugs mit unterschiedlichen Varianten
5. **Verwaiste Datensätze** ohne Parent-Referenzen

### Empfohlene Sofortmaßnahmen
1. RLS für alle öffentlich zugänglichen Tabellen aktivieren
2. Fehlende Locale-Übersetzungen ergänzen
3. Performance-Indizes für häufige Abfragen hinzufügen
4. Datenqualitäts-Bereinigung für Dubletten und Inkonsistenzen
5. Regelmäßige Datenqualitäts-Checks implementieren

### Performance-Optimierungen
1. Composite-Indizes für (locale, is_popular, sort_order)
2. Partial-Indizes für aktive Kategorien
3. Materialized Views für häufige Hierarchie-Abfragen
4. Query-Optimierung für Category-Lookups