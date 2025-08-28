---
title: Owner Dashboard — VC Overview
version: 2025-08-26
spec_ids: [VC-DASH-OWN-01]
personas: [zeitknapp, überfordert, skeptiker, profi]
permissions: [owner, admin, super_admin]
data_contracts:
  - kpi: docs/specs/_contracts/kpi_vc_total.json
  - chart: docs/specs/_contracts/chart_vis_trend.json
  - rule: docs/specs/_contracts/rule_quick_wins.json
---

# Ziel
30-Sekunden-Überblick: Gesamtscore, Trend, Top-3-Actions (ROI sortiert, einfache Sprache).

## Widgets
- KPI: `VC Total Score` (+ Trendpfeil, Benchmarks)
- Chart: `Sichtbarkeit über Zeit` (7/30/90 Tage)
- Table: `Top-3 Quick Wins` (Titel, Warum, ROI-Hinweis, „Jetzt umsetzen")
- Callout: „Was dir Geld bringt" (Umsatz-Schätzung, unverbindlich)

## Interaktionen
- Persona-Umschaltung (4 Modi)
- Export PDF/CSV
- One-Click-Action (öffnet vorbereiteten Post/Update)

## Zustände
- empty: „Noch keine Daten. Starte VC."
- loading: Skeletons
- error: Microcopy aus `vc_microcopy`