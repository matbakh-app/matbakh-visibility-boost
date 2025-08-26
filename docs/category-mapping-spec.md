# Category Mapping Specification - matbakh.app

## Übersicht

Dieses Dokument spezifiziert die Normalisierung und das Mapping von Geschäftskategorien für eine konsistente, mehrsprachige und gamification-kompatible Kategorisierung.

## Problemstellung

### Aktuelle Herausforderungen
1. **Fragmentierte Kategorien**: gmb_categories, business_categories, service_offerings ohne einheitliches Mapping
2. **Locale-Inkonsistenzen**: Fehlende DE/EN-Übersetzungen, unterschiedliche Slugs
3. **Dubletten**: Gleiche Kategorien mit verschiedenen Slugs oder Namen
4. **Gamification-Integration**: Kategorien müssen für Progress-Gewichtung klassifiziert werden
5. **Google-Kompatibilität**: Mapping zu Google Primary/Secondary Categories fehlt

## Lösungsansatz: Unified Category Mapping

### Mapping-View/Tabelle: biz_category_map

```sql
-- Konzeptuelle Struktur (noch nicht implementiert)
CREATE TABLE biz_category_map (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Source & Identity
    source VARCHAR(20) NOT NULL, -- 'gmb', 'internal', 'custom'
    original_slug VARCHAR(100) NOT NULL,
    normalized_slug VARCHAR(100) NOT NULL,
    
    -- Localization
    locale VARCHAR(5) NOT NULL, -- 'de', 'en'
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Hierarchy & Relationships
    parent_slug VARCHAR(100), -- References normalized_slug
    synonym_of VARCHAR(100), -- References normalized_slug for synonyms
    
    -- Classification
    category_type VARCHAR(20) NOT NULL, -- 'primary', 'secondary', 'service'
    industry_vertical VARCHAR(50), -- 'food-beverage', 'retail', 'services'
    
    -- Gamification & Progress
    is_core_field BOOLEAN DEFAULT false, -- Higher weight in progress calculation
    progress_weight INTEGER DEFAULT 1, -- 1-5 scale for gamification
    
    -- Google Integration
    google_category_id VARCHAR(100), -- Maps to Google's category ID
    google_primary BOOLEAN DEFAULT false,
    
    -- Status & Metadata
    enabled BOOLEAN DEFAULT true,
    is_popular BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(source, original_slug, locale),
    UNIQUE(normalized_slug, locale)
);

-- Indizes für Performance
CREATE INDEX idx_biz_category_map_normalized ON biz_category_map(normalized_slug, locale);
CREATE INDEX idx_biz_category_map_source ON biz_category_map(source, enabled);
CREATE INDEX idx_biz_category_map_core ON biz_category_map(is_core_field, progress_weight);
CREATE INDEX idx_biz_category_map_google ON biz_category_map(google_category_id) WHERE google_category_id IS NOT NULL;
```

## Mapping-Regeln

### 1. Primärkategorie-Regeln
- **1 Primärkategorie je Standort**: Eindeutige Hauptkategorisierung
- **Core-Field-Status**: Primärkategorien haben `is_core_field = true`
- **Progress-Weight**: Primärkategorien haben `progress_weight = 5`
- **Google-Mapping**: Primärkategorien mappen zu Google Primary Categories

### 2. Sekundärkategorie-Regeln
- **Limitierung**: Max. 3-5 Sekundärkategorien je Standort
- **Progress-Weight**: Sekundärkategorien haben `progress_weight = 2-3`
- **Hierarchie**: Müssen zur Primärkategorie passen (industry_vertical)

### 3. Service-Kategorien
- **Flexibilität**: Unbegrenzte Anzahl möglich
- **Progress-Weight**: Service-Kategorien haben `progress_weight = 1`
- **Granularität**: Spezifische Angebote und Dienstleistungen

### 4. Synonym-Ringe (DE/EN)
```sql
-- Beispiel: Restaurant-Synonyme
normalized_slug: 'restaurant'
├── 'restaurant' (de) → display_name: 'Restaurant'
├── 'restaurant' (en) → display_name: 'Restaurant'  
├── 'gaststaette' (de) → synonym_of: 'restaurant'
├── 'eatery' (en) → synonym_of: 'restaurant'
└── 'dining-establishment' (en) → synonym_of: 'restaurant'
```

### 5. Fallback-Mechanismus
1. **Exact Match**: normalized_slug + locale
2. **Synonym Resolution**: synonym_of → normalized_slug
3. **Language Fallback**: DE → EN oder EN → DE
4. **Default Category**: 'restaurant' als Universal-Fallback

## Gamification-Integration

### Progress-Gewichtung
```sql
-- Core-Felder (höhere Gewichtung für Onboarding-Progress)
UPDATE biz_category_map 
SET is_core_field = true, progress_weight = 5
WHERE category_type = 'primary';

-- Sekundäre Felder (mittlere Gewichtung)
UPDATE biz_category_map 
SET is_core_field = false, progress_weight = 3
WHERE category_type = 'secondary';

-- Service-Felder (niedrige Gewichtung)
UPDATE biz_category_map 
SET is_core_field = false, progress_weight = 1
WHERE category_type = 'service';
```

### Tier-Konsistenz
- **30% Tier**: Primärkategorie + Grunddaten erforderlich
- **50% Tier**: + 2-3 Sekundärkategorien
- **80% Tier**: + Service-Details und Angebote
- **Progress-Formel**: `(answered_weighted / required_weighted) * 100`

## Migration-Strategie (P1)

### Phase 1: Mapping-Tabelle erstellen
```sql
-- 1. Tabelle erstellen (siehe oben)
-- 2. Bestehende gmb_categories migrieren
INSERT INTO biz_category_map (
    source, original_slug, normalized_slug, locale, 
    display_name, category_type, google_category_id, 
    enabled, is_popular, sort_order
)
SELECT 
    'gmb' as source,
    slug as original_slug,
    LOWER(REGEXP_REPLACE(slug, '[^a-z0-9]+', '-', 'g')) as normalized_slug,
    locale,
    COALESCE(name_de, name_en) as display_name,
    CASE WHEN parent_category_id IS NULL THEN 'primary' ELSE 'secondary' END as category_type,
    category_id as google_category_id,
    true as enabled,
    is_popular,
    sort_order
FROM gmb_categories
WHERE slug IS NOT NULL;
```

### Phase 2: Synonym-Erkennung
```sql
-- Automatische Synonym-Erkennung basierend auf ähnlichen Namen
WITH similar_categories AS (
    SELECT 
        a.normalized_slug as slug_a,
        b.normalized_slug as slug_b,
        a.display_name as name_a,
        b.display_name as name_b,
        SIMILARITY(a.display_name, b.display_name) as similarity
    FROM biz_category_map a
    JOIN biz_category_map b ON a.id != b.id 
        AND a.locale = b.locale
        AND a.category_type = b.category_type
    WHERE SIMILARITY(a.display_name, b.display_name) > 0.7
)
SELECT * FROM similar_categories 
ORDER BY similarity DESC;
```

### Phase 3: Google-Mapping-Validierung
```sql
-- Validierung der Google Category IDs
SELECT 
    normalized_slug,
    google_category_id,
    COUNT(*) as usage_count,
    STRING_AGG(DISTINCT display_name, ' | ') as names
FROM biz_category_map 
WHERE google_category_id IS NOT NULL
GROUP BY normalized_slug, google_category_id
HAVING COUNT(*) > 1
ORDER BY usage_count DESC;
```

## API-Integration

### Category-Lookup-Service
```sql
-- View für API-Zugriff
CREATE VIEW v_category_lookup AS
SELECT 
    normalized_slug,
    locale,
    display_name,
    description,
    category_type,
    industry_vertical,
    is_core_field,
    progress_weight,
    google_category_id,
    parent_slug,
    enabled
FROM biz_category_map
WHERE enabled = true
ORDER BY sort_order, display_name;

-- Funktion für Kategorie-Resolution
CREATE OR REPLACE FUNCTION resolve_category(
    input_slug VARCHAR(100),
    input_locale VARCHAR(5) DEFAULT 'de'
) RETURNS TABLE (
    normalized_slug VARCHAR(100),
    display_name VARCHAR(255),
    category_type VARCHAR(20),
    progress_weight INTEGER
) AS $$
BEGIN
    -- 1. Exact match
    RETURN QUERY
    SELECT bcm.normalized_slug, bcm.display_name, bcm.category_type, bcm.progress_weight
    FROM biz_category_map bcm
    WHERE bcm.normalized_slug = input_slug 
        AND bcm.locale = input_locale 
        AND bcm.enabled = true;
    
    IF FOUND THEN RETURN; END IF;
    
    -- 2. Synonym resolution
    RETURN QUERY
    SELECT bcm.normalized_slug, bcm.display_name, bcm.category_type, bcm.progress_weight
    FROM biz_category_map bcm
    JOIN biz_category_map syn ON syn.synonym_of = bcm.normalized_slug
    WHERE syn.normalized_slug = input_slug 
        AND bcm.locale = input_locale 
        AND bcm.enabled = true;
    
    IF FOUND THEN RETURN; END IF;
    
    -- 3. Language fallback
    RETURN QUERY
    SELECT bcm.normalized_slug, bcm.display_name, bcm.category_type, bcm.progress_weight
    FROM biz_category_map bcm
    WHERE bcm.normalized_slug = input_slug 
        AND bcm.locale != input_locale 
        AND bcm.enabled = true
    LIMIT 1;
    
    IF FOUND THEN RETURN; END IF;
    
    -- 4. Default fallback
    RETURN QUERY
    SELECT 'restaurant'::VARCHAR(100), 'Restaurant'::VARCHAR(255), 'primary'::VARCHAR(20), 5::INTEGER;
END;
$$ LANGUAGE plpgsql;
```

## Datenqualitäts-Monitoring

### Konsistenz-Checks
```sql
-- 1. Synonym-Zyklen erkennen
WITH RECURSIVE synonym_chain AS (
    SELECT normalized_slug, synonym_of, 1 as depth, ARRAY[normalized_slug] as path
    FROM biz_category_map 
    WHERE synonym_of IS NOT NULL
    
    UNION ALL
    
    SELECT sc.normalized_slug, bcm.synonym_of, sc.depth + 1, sc.path || bcm.normalized_slug
    FROM synonym_chain sc
    JOIN biz_category_map bcm ON sc.synonym_of = bcm.normalized_slug
    WHERE bcm.synonym_of IS NOT NULL 
        AND sc.depth < 10 
        AND NOT bcm.normalized_slug = ANY(sc.path)
)
SELECT * FROM synonym_chain WHERE depth > 5;

-- 2. Fehlende Übersetzungen
SELECT 
    normalized_slug,
    COUNT(DISTINCT locale) as locale_count,
    STRING_AGG(locale, ', ') as available_locales
FROM biz_category_map 
WHERE enabled = true
GROUP BY normalized_slug
HAVING COUNT(DISTINCT locale) < 2;

-- 3. Inkonsistente Progress-Weights
SELECT 
    category_type,
    MIN(progress_weight) as min_weight,
    MAX(progress_weight) as max_weight,
    AVG(progress_weight) as avg_weight
FROM biz_category_map 
GROUP BY category_type;
```

## RLS-Policies (Supabase)

```sql
-- Öffentlicher Lesezugriff für aktive Kategorien
CREATE POLICY "Public read access for enabled categories" ON biz_category_map
    FOR SELECT USING (enabled = true);

-- Admin-Zugriff für Kategorie-Management
CREATE POLICY "Admin full access" ON biz_category_map
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'admin' OR
        auth.jwt() ->> 'role' = 'category_manager'
    );

-- RLS aktivieren
ALTER TABLE biz_category_map ENABLE ROW LEVEL SECURITY;
```

## Testing & Validierung

### Kategorie-Resolution-Tests
```sql
-- Test 1: Exact Match
SELECT * FROM resolve_category('restaurant', 'de');

-- Test 2: Synonym Resolution  
SELECT * FROM resolve_category('gaststaette', 'de');

-- Test 3: Language Fallback
SELECT * FROM resolve_category('restaurant', 'fr');

-- Test 4: Default Fallback
SELECT * FROM resolve_category('nonexistent-category', 'de');
```

### Performance-Tests
```sql
-- Lookup-Performance für häufige Abfragen
EXPLAIN ANALYZE
SELECT * FROM v_category_lookup 
WHERE category_type = 'primary' 
    AND locale = 'de' 
    AND enabled = true
ORDER BY sort_order;
```

## Implementierungs-Roadmap

### P0 (Sofort)
1. Schema-Analyse der bestehenden Kategorien-Tabellen
2. Mapping-Tabellen-Design finalisieren
3. Migration-Skripte für gmb_categories erstellen

### P1 (4 Wochen)
1. biz_category_map Tabelle implementieren
2. Daten-Migration durchführen
3. Synonym-Erkennung und -Bereinigung
4. API-Integration und Testing

### P2 (8 Wochen)
1. Gamification-Integration mit Progress-Weights
2. Google-Category-Mapping-Validierung
3. Automatisierte Datenqualitäts-Checks
4. Performance-Optimierung und Monitoring

## Erfolgskriterien

1. **Konsistenz**: 100% der Kategorien haben DE/EN-Übersetzungen
2. **Performance**: Category-Lookups < 50ms
3. **Gamification**: Progress-Berechnung funktioniert korrekt mit gewichteten Kategorien
4. **Google-Kompatibilität**: 95% der Kategorien haben gültiges Google-Mapping
5. **Datenqualität**: < 1% Dubletten oder inkonsistente Einträge