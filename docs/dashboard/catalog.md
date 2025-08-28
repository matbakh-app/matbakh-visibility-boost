---
title: VC Dashboard Catalog
version: 0.1
status: draft
---

# VC Dashboard Catalog

## Views

### vc_overview
- **view_id:** vc_overview
- **title:** VC Übersicht (Executive Dashboard)
- **figma_ref:** figma:FILE_KEY/FRAME_ID_OVERVIEW
- **spec_ids:** [kpi:vc_total, chart:vis_trend, rule:quick_wins]
- **status:** draft
- **personas:** [zeitknapp, überfordert, skeptiker, profi]
- **description:** Hauptdashboard mit Gesamtscore, Trend und Top-3 Empfehlungen

### vc_benchmarks
- **view_id:** vc_benchmarks
- **title:** Wettbewerbsvergleich & Branchenbenchmarks
- **figma_ref:** figma:FILE_KEY/FRAME_ID_BENCHMARKS
- **spec_ids:** [chart:benchmark_percentiles, chart:competitor_comparison]
- **status:** draft
- **personas:** [skeptiker, profi]
- **description:** Detaillierte Vergleiche mit lokaler Konkurrenz und Branchendurchschnitt

### vc_recommendations
- **view_id:** vc_recommendations
- **title:** Handlungsempfehlungen mit ROI-Prognosen
- **figma_ref:** figma:FILE_KEY/FRAME_ID_RECOMMENDATIONS
- **spec_ids:** [rule:quickwin_post_frequency, rule:content_storytelling, rule:seasonal_opportunities]
- **status:** draft
- **personas:** [zeitknapp, überfordert, profi]
- **description:** Priorisierte Empfehlungen mit One-Click-Actions

### vc_platform_details
- **view_id:** vc_platform_details
- **title:** Platform-spezifische Breakdowns
- **figma_ref:** figma:FILE_KEY/FRAME_ID_PLATFORMS
- **spec_ids:** [kpi:gmb_completeness, kpi:social_engagement, chart:subscores_timeseries]
- **status:** draft
- **personas:** [skeptiker, profi]
- **description:** Detaillierte Analyse von Google, Social Media, Website

### vc_trends_insights
- **view_id:** vc_trends_insights
- **title:** Trends & Saisonale Insights
- **figma_ref:** figma:FILE_KEY/FRAME_ID_TRENDS
- **spec_ids:** [chart:google_trends, rule:seasonal_content, chart:onpal_events]
- **status:** draft
- **personas:** [profi]
- **description:** Google Trends, OnPal Events, Kulturdimensionen

---

## KPIs

### vc_total
- **kpi_id:** vc_total
- **spec_id:** vc.kpi.total_visibility
- **source:** visibility_check_data
- **persona:** [zeitknapp, skeptiker, überfordert, profi]
- **glossary:** visibility_score
- **data_contract:** specs/_contracts/kpi_vc_total.json
- **description:** Gewichteter Gesamtscore (Google 40%, Social 30%, Website 20%, Other 10%)

### gmb_completeness
- **kpi_id:** gmb_completeness
- **spec_id:** vc.kpi.gmb_completeness
- **source:** google_places_adapter
- **persona:** [skeptiker, profi]
- **glossary:** gmb_profile_completeness
- **data_contract:** specs/_contracts/kpi_gmb_completeness.json
- **description:** Google My Business Profil-Vollständigkeit in Prozent

### social_engagement
- **kpi_id:** social_engagement
- **spec_id:** vc.kpi.social_engagement
- **source:** meta_graph_adapter
- **persona:** [zeitknapp, überfordert, profi]
- **glossary:** social_media_engagement
- **data_contract:** specs/_contracts/kpi_social_engagement.json
- **description:** Durchschnittliche Engagement-Rate über alle Social-Media-Kanäle

---

## Charts

### vis_trend
- **chart_id:** vis_trend
- **spec_id:** vc.chart.subscores_timeseries
- **data_contract:** specs/_contracts/chart_vis_trend.json
- **description:** Zeitreihen-Darstellung der Platform-Subscores über 12 Wochen

### benchmark_percentiles
- **chart_id:** benchmark_percentiles
- **spec_id:** vc.chart.benchmark_percentiles
- **data_contract:** specs/_contracts/chart_benchmark_percentiles.json
- **description:** Percentile-Vergleich mit lokaler Konkurrenz und Branchendurchschnitt

### competitor_comparison
- **chart_id:** competitor_comparison
- **spec_id:** vc.chart.competitor_comparison
- **data_contract:** specs/_contracts/chart_competitor_comparison.json
- **description:** Direkter Vergleich mit identifizierten Wettbewerbern

### google_trends
- **chart_id:** google_trends
- **spec_id:** vc.chart.google_trends
- **data_contract:** specs/_contracts/chart_google_trends.json
- **description:** Saisonale Suchvolumen-Trends für gastronomierelevante Keywords

### onpal_events
- **chart_id:** onpal_events
- **spec_id:** vc.chart.onpal_events
- **data_contract:** specs/_contracts/chart_onpal_events.json
- **description:** Lokale Events-Timeline mit Content-Opportunities

---

## Rules (Empfehlungen)

### quick_wins
- **rule_id:** quick_wins
- **spec_id:** vc.rule.quickwin_post_frequency
- **roi_formula:** (impact * prob * revenue) / (effort * time * cost)
- **description:** Empfehlungen für häufigere Content-Posts basierend auf Posting-Frequenz-Analyse

### content_storytelling
- **rule_id:** content_storytelling
- **spec_id:** vc.rule.content_storytelling
- **roi_formula:** (impact * prob * revenue) / (effort * time * cost)
- **description:** KI-generierte Content-Vorschläge basierend auf SWOT-Stärken

### seasonal_opportunities
- **rule_id:** seasonal_opportunities
- **spec_id:** vc.rule.seasonal_opportunities
- **roi_formula:** (impact * prob * revenue) / (effort * time * cost)
- **description:** Zeitkritische Empfehlungen basierend auf Google Trends und OnPal Events

### image_storytelling
- **rule_id:** image_storytelling
- **spec_id:** vc.rule.image_storytelling
- **roi_formula:** (impact * prob * revenue) / (effort * time * cost)
- **description:** Foto-Gap-Analyse mit spezifischen Shooting-Empfehlungen

---

## Views – Visibility Check Entry Points

### vc_teaser_inline
- **view_id:** vc_teaser_inline
- **title:** Landing Hero Inline Panel
- **spec_ids:** [entry_points, teaser_result]
- **placement:** Landing Hero Inline Panel
- **personas:** [zeitknapp, überfordert]
- **description:** Inline teaser panel in landing page hero section with minimal friction entry

### vc_standalone
- **view_id:** vc_standalone
- **title:** Standalone VC Page
- **spec_ids:** [entry_points, teaser_result]
- **placement:** /vc
- **personas:** [skeptiker, profi, zeitknapp, überfordert]
- **description:** Dedicated visibility check page for direct access and campaigns

### vc_share_preview
- **view_id:** vc_share_preview
- **title:** Social Share Preview
- **spec_ids:** [entry_points, og_metadata]
- **placement:** Social media platforms
- **personas:** [zeitknapp, überfordert]
- **description:** Open Graph optimized preview for social media sharing

### vc_partner_embed
- **view_id:** vc_partner_embed
- **title:** Partner Iframe Widget
- **spec_ids:** [entry_points, partner_auth]
- **placement:** Partner platforms
- **personas:** [profi]
- **description:** Embeddable widget for partner platforms with secure authentication

---

## Ideation Notes

### Kreative Erweiterungen
- **Confidence-Heatmap:** Visuelle Darstellung der Datenqualität pro Metrik
- **ROI-Simulator:** Interaktive Berechnung von Empfehlungs-Kombinationen
- **Persona-Switcher:** Dynamische Dashboard-Anpassung per Toggle
- **One-Click-Preview:** Live-Vorschau von generierten Social-Media-Posts
- **Cultural-Tone-Indicator:** Hofstede-basierte Tonalitäts-Empfehlungen

### Technische Innovationen
- **Evidence-Ledger-UI:** Transparente Quellenangaben mit Drill-down
- **Adaptive-Complexity:** Dashboard passt sich automatisch an Nutzer-Expertise an
- **Multi-Location-Sync:** Ketten-Dashboard mit Standort-Vergleichen
- **API-Playground:** Profi-Nutzer können Custom-Queries erstellen
---


## Dashboard Specifications

All dashboard components must be documented with:
- Clear purpose and target persona
- Data contracts (KPIs, charts, rules)
- Permission requirements
- Error states and fallbacks

### Current Dashboard Specs
- VC-DASH-OWN-01 → docs/dashboard/specs/owner-vc-overview.md
- VC-DASH-OWN-02 → docs/dashboard/specs/owner-actions.md
- VC-DASH-PARTNER-01 → docs/dashboard/specs/partner-performance.md
- VC-DASH-OPS-01 → docs/dashboard/specs/ops-backoffice.md

## Admin Dashboards

| Dashboard Name | Spec IDs | Specification | Description |
|----------------|----------|---------------|-------------|
| Admin — Partner Credits | ADMIN-CR-01, ADMIN-CR-02 | docs/admin/specs/admin-partner-credits.md | Partner credit allocation and consumption tracking |