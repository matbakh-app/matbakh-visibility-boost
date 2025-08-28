# Dashboard Inventory (VC)

## Übersicht

**Quelle:** Figma (Links), Repo (md), Stand: 25. Januar 2025

### Figma Frames (Kanon)

- **VC Overview**: figma:FILE_KEY/FRAME_ID (Hauptdashboard mit Gesamtscore)
- **Benchmarks**: figma:FILE_KEY/FRAME_ID (Wettbewerbsvergleiche und Branchenbenchmarks)
- **Recommendations**: figma:FILE_KEY/FRAME_ID (Handlungsempfehlungen mit ROI-Prognosen)
- **Platform Details**: figma:FILE_KEY/FRAME_ID (Google, Social, Website Breakdowns)
- **Trends & Insights**: figma:FILE_KEY/FRAME_ID (Google Trends, OnPal Events, Saisonalität)

### Repo-Dateien (bestehend)

**Dashboard-relevante Dokumentation:**
- `docs/Dashboard Entwicklung 243cc947bd7880589b66e819132c7a5e.md` — Zweck: Vollständiges Dashboard-Konzept mit Visibility Hub
- `docs/dashboard-connections-report.md` — Zweck: Dashboard-Verbindungsstatus mit Widget-Integration
- `docs/dashboard-integration-status-bericht.md` — Zweck: Ausführlicher Dashboard-Integrationsbericht
- `docs/data-management-concept.md` — Zweck: KPI-Tracking und Partner-Performance-Metriken
- `docs/STEP 1 User Journey & Personas 240cc947bd7880dd9e23e2a72485fbb1.md` — Zweck: Persona-adaptives Dashboard-Design
- `docs/CURRENT-ROADMAP-STATUS.md` — Zweck: Dashboard-Status und KPI-Definitionen

**VC-spezifische Dateien:**
- `docs/specs/vc/requirements.vc-spec.md` — Zweck: Technische Anforderungen für VC-Dashboard
- `docs/specs/vc/vision.vc-spec.md` — Zweck: UX-Vision und Persona-Anpassungen
- `docs/vc-complete-vision-2025.md` — Zweck: Vollständige VC-Vision mit Dashboard-Integration
- `docs/visibility-check-data-architecture.md` — Zweck: Datenarchitektur für Dashboard-Metriken
- `docs/visibility-check-data-blueprint.md` — Zweck: Datenmodell für Dashboard-Komponenten

## Zuordnung (Mapping)

| spec_id                           | Art    | Figma Frame                        | Repo MD                                    | Status |
|-----------------------------------|--------|------------------------------------|---------------------------------------------|--------|
| vc.kpi.total_visibility           | KPI    | figma:KEY/FRAME                    | docs/dashboard/specs/kpi/total_visibility.md | TODO   |
| vc.chart.subscores_timeseries     | Chart  | figma:KEY/FRAME                    | docs/dashboard/specs/chart/subscores.md     | TODO   |
| vc.rule.quickwin_post_frequency   | Rule   | figma:KEY/FRAME                    | docs/dashboard/specs/rule/post_frequency.md | TODO   |
| vc.kpi.gmb_completeness           | KPI    | figma:KEY/FRAME                    | docs/dashboard/specs/kpi/gmb_completeness.md| TODO   |
| vc.chart.benchmark_percentiles    | Chart  | figma:KEY/FRAME                    | docs/dashboard/specs/chart/benchmarks.md    | TODO   |
| vc.kpi.social_engagement          | KPI    | figma:KEY/FRAME                    | docs/dashboard/specs/kpi/social_engagement.md| TODO   |
| vc.rule.content_storytelling      | Rule   | figma:KEY/FRAME                    | docs/dashboard/specs/rule/content_story.md  | TODO   |
| vc.chart.competitor_comparison    | Chart  | figma:KEY/FRAME                    | docs/dashboard/specs/chart/competitors.md   | TODO   |

## Gaps

**Fehlende Spezifikationen:**
- Subscore-Zeitreihen fehlen als detaillierte Spec
- Benchmark Percentiles benötigen Formel-Definition
- ROI-Erklärung für Empfehlungen fehlt in Microcopy
- Kulturdimensionen-Integration in Dashboard-Komponenten
- Google Trends Visualisierung nicht spezifiziert
- OnPal Events Integration in Recommendations
- Confidence-Level Anzeige für alle Metriken

**Fehlende Persona-Anpassungen:**
- "Der Zeitknappe": 30-Sekunden-Summary Dashboard
- "Der Überforderte": Vereinfachte Ampel-Darstellung
- "Der Skeptiker": Detaillierte Quellenangaben und Vergleiche
- "Der Profi": Vollständige Datenexports und API-Zugang

## Konflikte/Doppelungen

**Identifizierte Redundanzen:**
- `docs/Dashboard Entwicklung 243cc947bd7880589b66e819132c7a5e.md` und `docs/vc-complete-vision-2025.md` beschreiben ähnliche Dashboard-Konzepte
- `docs/dashboard-connections-report.md` und `docs/dashboard-integration-status-bericht.md` überlappen bei Integrationsstatus
- Mehrere Dateien definieren KPI-Gewichtungen (Google 40%, Social 30%, etc.)

**Zu konsolidieren:**
- Dashboard-Konzept → Eine kanonische Spec pro KPI/Chart
- KPI-Definitionen → Einheitliche Formeln und Datenquellen
- Persona-Anpassungen → Zentrale Persona-Map mit Dashboard-Varianten

## Nächste Schritte

**Priorität 1: Kern-Spezifikationen erstellen**
- `vc.kpi.total_visibility` - Gesamtscore mit Gewichtung
- `vc.chart.subscores_timeseries` - Platform-Breakdown über Zeit
- `vc.kpi.gmb_completeness` - Google My Business Vollständigkeit
- `vc.rule.quickwin_post_frequency` - Content-Empfehlungen

**Priorität 2: Erweiterte Features**
- Google Trends Integration in Charts
- OnPal Events in Recommendation Rules
- Kulturdimensionen in Microcopy-Varianten
- Confidence-Level Indikatoren

**Priorität 3: Persona-Anpassungen**
- Dashboard-Varianten pro Persona
- Komplexitäts-Level für verschiedene Nutzertypen
- Adaptive UI-Komponenten

## Deprecation-Kandidaten

**Nach Spec-Erstellung zu entfernen:**
- Redundante Dashboard-Konzept-Dateien
- Doppelte KPI-Definitionen
- Veraltete Integration-Reports

Alle Deprecations werden in `docs/dashboard/deprecations.md` dokumentiert.-
--

## Snapshot (Inventar gefroren)

**Zeitstempel:** 25. Januar 2025 - 15:30  
**Status:** Bestandsaufnahme fixiert  
**Quelle für Mapping:** Dieser Snapshot dient als Basis für alle weiteren Dashboard-Spezifikationen

### Gefrorener Zustand
- **Figma Frames:** 5 identifizierte Dashboard-Views
- **Repo-Dateien:** 11 dashboard-relevante Dokumentationen
- **Spec-IDs:** 8 definierte Dashboard-Komponenten
- **Konflikte:** 3 identifizierte Redundanzen

**Nächster Schritt:** Figma-Repo Mapping & Katalog-Erstellung