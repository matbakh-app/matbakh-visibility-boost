---
dashboard_id: vc.overview
spec_id: vc.kpi.example_id
source_of_truth: figma:FILE/FRAME
canonical: true
version: 2025-01-25
---

# KPI: <Title>

## Purpose

Kurze, laienverständliche Erklärung in Gastronomen-Sprache. Was lernt der Nutzer aus dieser Kennzahl?

## Definition

- **Formel:** Klare mathematische Definition (evtl. Pseudocode)
- **Zeitkorn:** daily/weekly/monthly
- **Dimensionen/Filter:** z.B. Standort, Kategorie, Zeitraum
- **Datenquellen:** Referenz auf adapter.* Module

## Inputs (Schema)

```typescript
type Inputs = {
  scores?: { 
    total: number; 
    google: number; 
    social: number; 
    web: number; 
    other: number 
  }
  benchmarks?: { 
    local_percentile?: number; 
    industry_avg?: number 
  }
  observed_at: string
}
```

## Output (Schema)

```typescript
type Output = {
  value: number;
  unit?: string;
  trend?: 'up'|'down'|'flat';
  explanation: string;
}
```

## Evidence & Confidence

- Referenzen auf `vc_runs.inputs.raw.*` Datenquellen
- Confidence-Level: low/med/high basierend auf Datenqualität
- Quellenangaben für Nutzer-Transparenz

## Microcopy

### Deutsch
- **Titel:** Einfacher, verständlicher Name
- **Helptext:** Erklärung ohne Buzzwords
- **Einheit:** z.B. "von 100 Punkten", "Prozent"

### English
- **Title:** Simple, understandable name
- **Helptext:** Explanation without jargon
- **Unit:** e.g. "out of 100 points", "percent"

## Edge Cases

- **Keine Daten verfügbar:** Hinweistext X, Fallback-Berechnung Y
- **Unvollständige Daten:** Confidence-Indikator, Erklärung der Einschränkungen
- **Erste Messung:** Baseline-Erklärung, keine Trend-Anzeige

## Persona-Anpassungen

- **Zeitknapp:** Nur Wert + Trend-Pfeil
- **Überfordert:** Ampel-System (🟢🟠🔴) + einfache Erklärung
- **Skeptiker:** Detaillierte Quellenangaben + Vergleichswerte
- **Profi:** Rohdaten-Export + API-Zugang