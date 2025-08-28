# Dashboard Figma Mapping

**Zweck:** Explizite Zuordnung zwischen Figma-Frames und Repository-Spezifikationen  
**Status:** Draft - Figma-Links müssen noch aktualisiert werden  
**Version:** 0.1

## Mapping-Tabelle

| figma_frame | view_id | spec_ids | duplicate_of | status | notes |
|-------------|---------|----------|--------------|--------|-------|
| figma:FILE_KEY/FRAME_ID_OVERVIEW | vc_overview | vc.kpi.total_visibility, vc.chart.subscores_timeseries, vc.rule.quickwin_post_frequency | - | draft | Hauptdashboard mit Executive Summary |
| figma:FILE_KEY/FRAME_ID_BENCHMARKS | vc_benchmarks | vc.chart.benchmark_percentiles, vc.chart.competitor_comparison | - | draft | Wettbewerbsvergleiche und Branchenbenchmarks |
| figma:FILE_KEY/FRAME_ID_RECOMMENDATIONS | vc_recommendations | vc.rule.content_storytelling, vc.rule.seasonal_opportunities, vc.rule.image_storytelling | - | draft | Handlungsempfehlungen mit ROI-Prognosen |
| figma:FILE_KEY/FRAME_ID_PLATFORMS | vc_platform_details | vc.kpi.gmb_completeness, vc.kpi.social_engagement, vc.chart.subscores_timeseries | - | draft | Platform-spezifische Breakdowns |
| figma:FILE_KEY/FRAME_ID_TRENDS | vc_trends_insights | vc.chart.google_trends, vc.chart.onpal_events, vc.rule.seasonal_opportunities | - | draft | Trends und saisonale Insights |

## Persona-Mapping

| persona | primary_views | secondary_views | hidden_views |
|---------|---------------|-----------------|--------------|
| zeitknapp | vc_overview | vc_recommendations | vc_benchmarks, vc_trends_insights |
| überfordert | vc_overview, vc_recommendations | vc_platform_details | vc_benchmarks, vc_trends_insights |
| skeptiker | vc_benchmarks, vc_platform_details | vc_overview, vc_trends_insights | - |
| profi | vc_trends_insights, vc_benchmarks | vc_platform_details, vc_recommendations | - |

## Duplicate-Analyse

### Potentielle Redundanzen
- **vc.chart.subscores_timeseries** erscheint in mehreren Views → Shared Component
- **vc.rule.seasonal_opportunities** überschneidet mit Google Trends Chart → Koordination nötig
- **Benchmark-Daten** werden in verschiedenen Kontexten verwendet → Einheitliche Datenquelle

### Konsolidierungs-Empfehlungen
1. **Shared Components:** Subscores Timeline als wiederverwendbare Komponente
2. **Data Consistency:** Einheitliche Benchmark-Berechnung über alle Views
3. **Rule Coordination:** Seasonal Rules und Trends Charts aufeinander abstimmen

## Figma-Updates erforderlich

### Fehlende Frame-IDs
- [ ] Aktualisierung aller FILE_KEY/FRAME_ID Referenzen
- [ ] Verlinkung zu konkreten Figma-Frames
- [ ] Versionierung der Figma-Dateien

### Design-System-Alignment
- [ ] Konsistente Icon-Verwendung über alle Frames
- [ ] Einheitliche Farbkodierung (Ampel-System)
- [ ] Standardisierte Tooltip-Designs
- [ ] Responsive Breakpoints definiert

## Review-Status

| view_id | figma_review | spec_review | implementation_ready |
|---------|--------------|-------------|---------------------|
| vc_overview | pending | pending | no |
| vc_benchmarks | pending | pending | no |
| vc_recommendations | pending | pending | no |
| vc_platform_details | pending | pending | no |
| vc_trends_insights | pending | pending | no |

**Nächste Schritte:**
1. Figma-Frame-IDs aktualisieren
2. Design-System-Konsistenz prüfen
3. Spec-Templates für identifizierte Komponenten erstellen