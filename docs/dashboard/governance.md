# Dashboard Governance (VC)

## Ziel

Eine einzige, kanonische Quelle für alle VC-Dashboards (KPIs, Charts, Texte, Empfehlungen).

Figma-Frames sind die visuelle Quelle, diese Dokumentation ist die technische und produktseitige Source of Truth.

## No-Dupes Regeln

- Für jedes KPI/Chart/Widget gibt es **genau EIN** kanonisches Markdown-Dokument unter `docs/dashboard/specs/`.
- Wenn neue Views erstellt werden, **müssen** alte redundante Dateien entfernt werden (Deprecation-Prozess unten).
- Figma-Frame ist die visuelle Referenz; dieses Repo ist **Source of Truth** für Namen, Formeln, Felder.

## Deprecation-Prozess

1) In `docs/dashboard/deprecations.md` Datei/Abschnitt eintragen (zu entfernende Pfade + Grund).
2) Alte Datei löschen (gleicher Commit), Querverweise anpassen.
3) `canonical: true` darf pro ID nur einmal existieren.

## Metadaten (Frontmatter)

Jede Chart/KPI-Spec erhält:

```yaml
---
dashboard_id: vc.overview              # stabil, snake.dots
spec_id: vc.kpi.total_visibility
source_of_truth: figma:FILE_KEY/FRAME_ID
canonical: true
version: 2025-01-25
---
```

## Templates (verbindlich)

- **KPI**: `docs/dashboard/specs/kpi/<spec_id>.md`
- **Chart**: `docs/dashboard/specs/chart/<spec_id>.md`
- **Recommendation Rule**: `docs/dashboard/specs/rule/<spec_id>.md`

Templates siehe `docs/specs/_template/`

## Personas & Oberflächen

- Zeitknapp, Überfordert, Skeptiker, Profi → Mapping in `docs/dashboard/persona-map.md`.

## Review & CI

- `docs/audits/dashboard-inventory.md` ist das zentrale Inventar (wird kontinuierlich gepflegt).
- In PRs: Prüfen, dass keine zweite Datei mit gleicher `spec_id`/`dashboard_id` existiert.
- Jede neue Dashboard-Komponente benötigt entsprechende Spec-Datei vor Implementierung.

## Governance-Prinzipien

### Single Source of Truth
- **Figma**: Visuelle Gestaltung, Layout, Interaktionen
- **Repo**: Formeln, Datenquellen, Microcopy, Business Logic

### Konsistenz-Regeln
- Alle KPIs verwenden einheitliche Terminologie (Gastronomen-Sprache)
- Jede Metrik hat dokumentierte Datenquelle und Confidence-Level
- ROI-Prognosen sind immer als "unverbindlich" gekennzeichnet

### Änderungs-Workflow
1. Figma-Update → entsprechende Spec-Datei aktualisieren
2. Neue Dashboard-Komponente → Template verwenden, alte deprecaten
3. Microcopy-Änderungen → in Spec dokumentieren, nicht nur in Code##
# VC No-Dupes Regeln (verbindlich)
- Spezifikationen liegen ausschließlich unter `docs/specs/vc/*`.
- Contracts liegen ausschließlich unter `docs/specs/_contracts/*`.
- Figma/Repo Mapping erfolgt in `docs/audits/dashboard-figma-mapping.md`.
- Neue Dateien MÜSSEN `links:` oder `spec_id:` im Frontmatter tragen.
- Keine Duplikate in `.kiro/specs/*` - diese sind nur für temporäre Arbeitsdateien.
- Traceability Matrix MUSS bei jeder Spec-Änderung aktualisiert werden.---


## Allowed Embed Origins

**Quelle für Server-Allowlist.**

- `https://*.partner-example.com`
- `https://*.verband-example.org`
- `https://*.agency-example.de`

> **Pflegeprozess:** Pull Request + Security Review, dann Deploy.