---
dashboard_id: vc.overview
spec_id: vc.chart.example_id
source_of_truth: figma:FILE/FRAME
canonical: true
version: 2025-01-25
---

# Chart: <Title>

## Purpose

Was lernt der Nutzer aus dieser Visualisierung? Welche Entscheidungen unterstützt sie?

## Spec

- **Visualisierung:** Bar/Line/Donut/Scatter
- **Achsen:** X-Achse (Einheit), Y-Achse (Einheit)
- **Aggregation:** z.B. weekly average, monthly sum
- **Thresholds/Annotations:** z.B. Zielbereiche, Benchmarks
- **Interaktionen:** Tooltip, Drill-down, Filter

## Data Contract

```typescript
type Point = {
  x: string | number;
  y: number;
  pctl?: number; // percentile for benchmarks
}

type Series = {
  id: string;
  label: string;
  points: Point[];
  color?: string;
}

type ChartData = {
  series: Series[];
  annotations?: {
    type: 'threshold' | 'benchmark';
    value: number;
    label: string;
  }[];
}
```

## Inputs

- **Quellen:** Referenz auf adapter.* Module oder vc_runs.* Felder
- **Zeitraum:** Standard-Zeitfenster und verfügbare Optionen
- **Filter:** Verfügbare Dimensionen (Kategorie, Region, etc.)

## Persona Fit

- **Zeitknapp:** Vereinfachte Ansicht, nur Haupttrend
- **Überfordert:** Klare Legende, Ampel-Kodierung
- **Skeptiker:** Detaillierte Tooltips mit Quellenangaben
- **Profi:** Vollständige Daten-Drill-down, Export-Funktionen

## Microcopy

### Deutsch
- **Titel:** Verständlicher Chart-Name
- **Achsen-Labels:** Einfache Bezeichnungen
- **Tooltips:** Erklärende Texte bei Hover
- **Legende:** Klare Kategorien-Beschreibungen

### English
- **Title:** Clear chart name
- **Axis Labels:** Simple descriptions
- **Tooltips:** Explanatory hover texts
- **Legend:** Clear category descriptions

## Edge Cases

- **Keine Daten:** Placeholder mit Erklärung
- **Unvollständige Zeitreihe:** Gestrichelte Linien, Hinweise
- **Extreme Werte:** Skalierung anpassen, Outlier-Behandlung
- **Loading State:** Skeleton-Animation während Datenladung

## Accessibility

- **Farbblindheit:** Zusätzliche Pattern/Symbole neben Farben
- **Screen Reader:** Alt-Texte für Chart-Elemente
- **Keyboard Navigation:** Tab-Reihenfolge für interaktive Elemente
- **High Contrast:** Alternative Farbschemata