# VC Requirements Spec (Engineering)

**Status:** DRAFT • **Owner:** CTO • **Session:** 2025-VC-SPEC • **Last updated:** <AUTO/Kiro>

## 0. Zweck & Scope

Der Visibility Check (VC) ist unser Lead-Magnet und Fundament für eine skalierbare BI-Plattform. Dieser Spec definiert technische Anforderungen für:

- VC Quick (DOI-Flow, heute live)
- Basis für spätere "Enhanced VC" Datenaufnahme (Trends, OnPal, Kulturdimensionen)
- Datenmodellierung zwecks Wiederverwendung (Insights, Reports, API)

**Nicht-Ziele (hier explizit out of scope):**
- Implementierungsdetails von externen Integrationen (vollständig) – eigene Specs
- Bezahl-Pläne/Paywalls
- Vollständiger Dashboard-Scope (separater Spec)

---

## 1. Systemkontext

- **Frontend:** React/Vite, i18n (DE/EN), Route `/vc/quick`, `/vc/result`
- **API (heute):** AWS API Gateway → Lambda `POST /vc/start` → SES DOI, Confirm-Lambda 302 → `/vc/result?t=TOKEN`
- **Provider-Flag:** `VITE_VC_API_PROVIDER=aws` (Supabase-Pfad deaktiv)
- **Caching/CDN:** CloudFront SPA-Policy: `index.html` kurz (0–5min), hash-Assets lang (~1y), QueryStrings **nicht** cachen, 403/404 → `/index.html`
- **Healthcheck:** Header-Parität bei `?t=...` vs `?e=invalid`

---

## 2. Datenquellen (jetzt & später)

**Core (jetzt/nahe Zukunft):**
- Google Ecosystem (GBP/GMB: Details, Reviews, Posts, Photos, Categories)
- Social: Facebook/Instagram (Aktivität/Engagement)
- Bewertungsportale: Tripadvisor, Yelp, TheFork (Coverage, Rating, Response Rate)
- Website/SEO: Lighthouse Snapshots, strukturierte Daten

**Erweiterungen (dieser Spec legitimiert das Datenmodell dafür):**
- **Google Trends** (lokalisierte Keywords, Saisonalität)
- **OnPal** (Events/Anlässe, lokale Relevanz)
- **Kulturdimensionen (Hofstede)** zur Tonalität/Story-Guidance
- **Öffentliche Branchenwerte** (Statistikämter, Verbände) für Benchmarks

> Jede Kennzahl muss eine **Evidence-Spur** besitzen (Quelle, URL/ID, Timestamp, Erhebungsmethode).

---

## 3. Genauigkeitsprinzip („100% Realität")

VC-Ergebnisse müssen mit den realen Umständen des Betriebs übereinstimmen (Standort, Angebot, Story, Wettbewerber).

- **Quellen-Konsistenz:** Cross-Check über ≥2 unabhängige Quellen, ggf. **Confidence Score** speichern.
- **Wettbewerber-Set:** Nicht nur direkte Wettbewerber, sondern auch **branchenübliche Referenzwerte** (Kategorie/Region).
- **Evidence Ledger:** Für jede abgeleitete Metrik speichern: `{source, source_ref, observed_at, method, confidence}`.
- **No Hallucination Rule:** Keine Aussage ohne belegte Quelle.

---

## 4. Scoring & Benchmarks

### 4.1 Gewichtung (v1 Basis)
- **Google 40%**, **Social 30%**, **Website 20%**, **Other 10%**
- Unterdimensionen: Vollständigkeit, Aktivität, Konsistenz, Sentiment, Sichtbarkeit (SERP/Maps)

### 4.2 Benchmarks
- **Lokal:** Radius + gleiche Hauptkategorie
- **Branche (übliche Werte):** externe, öffentlich zugängliche Statistiken
- **Top-10%**: quantile-basiert aus Vergleichsmenge

---

## 5. Nutzwertanalyse & ROI-Formel

Empfehlungs-Ranking basiert auf:

```
ROI_score = (Impact * Eintrittswahrscheinlichkeit * Umsatzpotenzial) / (Aufwand * Zeit * Kosten)
```

- Normierung 0–1 pro Faktor; Umsatzpotenzial in € (unverbindliche Prognose).
- Alle Faktoren + Begründung + Evidence werden gespeichert.

---

## 6. Action-Taxonomie (Output → Umsetzung)

**Kategorien (v1):**
1) **Content-Storytelling** (Text-Posts, GBP Updates, Captions)
2) **Bilder-Storytelling & Aktionen** (Fotoideen, Before/After, Angebotskarten)
3) **Prozess/Listing-Aktionen** (Öffnungszeiten, Kategorien, Menüs, Reservierungslinks)
4) **Video (v2)** über Integrationen (YouTube, später Google Note-LLM)

**One-Click-Flow (Design-Ziel):**
- KI generiert Vorschlag → Nutzer ergänzt minimal (2–3 Felder optional) → **Freigabe** → Multi-Channel-Posting (GBP, FB, IG).
- Jede Action speichert: Kanal, Draft-Content, Assets-Refs, geplantes Datum, Genehmiger, Status, Performance-Hook.

---

## 7. Datenmodell (vereinheitlicht, JSONB-fähig)

Tabellen/Kollektionen (vereinfachtes Schema):

- **leads** `{id, email, name?, consent_privacy, consent_marketing?, created_at, source}`
- **vc_tokens** `{token_hash, lead_id, status, ttl_expires_at, used_at}`
- **vc_runs** `{id, lead_id, started_at, completed_at, status, provider='aws', context:{location, story_hint?, category?}}`
- **vc_metrics** `{run_id, key, value, unit?, evidence:{source, ref, observed_at, method, confidence}}`
- **vc_scores** `{run_id, dimension, score, weight, rationale}`
- **vc_benchmarks** `{run_id, type:'local'|'industry'|'top10', metric_key, value, population_meta}`
- **vc_recommendations** `{run_id, category, title, body, roi:{impact,prob,potential_eur,effort,time,cost,score}, channels:[...], evidence:[...]}`
- **vc_competitors** `{run_id, place_id/ref, name, distance_m, category, metrics:{...}}`
- **vc_audit** `{run_id, rule_key, pass:boolean, details}`
- **events_analytics** `{actor, name, props, ts}`

> Alle Entities müssen **Mandanten-fähig**, **DSGVO-konform** und revisionssicher gespeichert werden.

---

## 8. APIs (v1, bestehend + minimaler Ausbau)

- `POST /vc/start` → `{email, name?}` → `{ok:true}`; DOI E-Mail via SES.
- Confirm-Lambda → **302** auf `/vc/result?t=TOKEN`.
- (Optional v1.1) `POST /vc/resend` → neuen DOI Link triggern (Rate-Limit 3/24h).
- (Optional v1.1) `GET /vc/run/:id` → Status (nur anonymisierte Metadaten bis Login).

**HTTP Codes:** 200, 202, 400, 401, 404, 409 (rate), 422 (validation), 500.
**CORS:** nur `https://matbakh.app`, `https://www.matbakh.app`.

---

## 9. Sprache & UX-Leitplanken (Engineering-relevant)

- **Begriffe in einfacher Sprache** (Glossar-Mapping, z. B. „ROI" → „Wie viel Euro könnte es bringen").
- i18n Keys zentral im `vc_*` Namespace.
- Fehler-States: `success|invalid|expired` inkl. „Neuen Link anfordern".

---

## 10. Sicherheit & Compliance

- Tokens: gehasht, TTL, single-use.
- PII minimal; Marketing-Consent getrennt.
- Logging: strukturiert; keine PII in Logs.
- Rate Limits (IP + Email), Bot-Abwehr (leichtgewichtig, z. B. honeypot).

---

## 11. Telemetrie (MVP)

- `vc_quick_view|submit|success|error|consent_marketing_toggle|simple_toggle`
- Später: `vc_reco_rendered|approved|posted`, `vc_run_completed`, `evidence_mismatch_detected`

---

## 12. Akzeptanzkriterien (für diese Doku-Session)

- Diese Datei existiert unter `docs/specs/vc/requirements.vc-spec.md`.
- Alle Kapitel 0–11 enthalten.
- ROI-Formel dokumentiert.
- Evidence-Ledger & Genauigkeitsprinzip dokumentiert.
- Action-Taxonomie dokumentiert.
- **Stop nach Write** (weitere Implementierung erst in neuer Session).
---


## 13. Datenquellen & Adapter (Q&D + Full)

**Ziel:** Alle relevanten, öffentlich zugänglichen und partnerbasierten Quellen definieren; Adapter-Schnittstellen klar halten.

### 13.1 Primär (Identifikation & Kernmetriken)

- **Google Places / Business Profile (GBPA/Places Details)**
  - Zweck: Eindeutige Zuordnung (place_id), Stammdaten, Öffnungszeiten, Fotos, Reviews (Aggregat), Website-Link
  - Adapter: `adapter.google.places.getDetails(place_id)` → `BusinessCore`

- **Facebook/Instagram Graph (Public)**
  - Zweck: Präsenznachweis, letzte Aktivität, Followers (falls öffentlich), Basis-Engagement (öffentlich sichtbar)
  - Adapter: `adapter.meta.graph.inspect(url)` → `SocialPresence`

- **Website / Lighthouse**
  - Zweck: Erreichbarkeit, Performance, SEO-Basics, Schema.org-Sniffs
  - Adapter: `adapter.web.lighthouse.audit(url)` → `WebAudit`

### 13.2 Kontext & Benchmarks

- **Google Trends (regional)**
  - Zweck: Saisonale Nachfrage/Interesse (Food/Gastro Queries) nach Region/Kategorie
  - Adapter: `adapter.google.trends.query({keyword, region, timespan})` → `MarketTrendIndex`

- **OnPal (Local Events)**
  - Zweck: Lokale Events/Peaks für Content-/Angebotsplanung
  - Adapter: `adapter.onpal.events.list({city, radius, dateRange})` → `LocalEvents`

- **Bewertungsportale (Tripadvisor/Yelp/TheFork – öffentlich)**
  - Zweck: Coverage/Präsenz-Check + grobe Sentiment-Signale (öffentlich sichtbare Zusammenfassungen)
  - Adapter: `adapter.review.public.inspect(url)` → `ReviewPresence`

### 13.3 Kultur-/Sprachdimensionen

- **Hofstede Cultural Dimensions (by Country)**
  - Zweck: Tonalität/Microcopy-Empfehlungen (Direktheit, Uncertainty Avoidance etc.)
  - Adapter: `adapter.culture.hofstede.lookup(country)` → `CultureProfile`

---

## 14. Scoring, Benchmarks & ROI (Erweitert)

### 14.1 Gewichtung (Default v1)
- Google Visibility **40%**, Social **30%**, Website/SEO **20%**, Other (Listings/Portale/Trends) **10%**
- Pro Subscore: Dimensionen (Vollständigkeit, Aktualität, Aktivität, Reputation, Konsistenz)

### 14.2 Benchmarking
- **Lokal:** Radius + Kategorie (Top-10% / Median / IQR)
- **Branche:** Kategoriespezifische Referenzwerte (öffentlich/Beobachtung)
- **Zeit:** Trendlinien (z. B. 12 Wochen)

### 14.3 Nutzwertanalyse & ROI-Priorisierung

Empfehlungs-Score:
```
recommendation_score = (impact * probability * revenue_potential) / (effort * time * cost)
```

- **Output:** sortiert absteigend, mit *unverbindlicher* Euro-Prognose (Range), Klartext-Begründung.

---

## 15. Evidence & Confidence (Ergänzung)

Jede externe Aussage speichert:
```json
{
  "source": "google.places" | "meta.graph" | "trends" | "onpal" | "review.public" | "web.lighthouse",
  "ref": "<url-or-id>",
  "observed_at": "ISO8601",
  "method": "api|scrape|public",
  "raw_pointer": "<opaque-ref>",
  "confidence": "low|med|high"
}
```

Q&D-Fallback: Bei manueller Zuordnung min. 1 Gegencheck → confidence: "low|med".

---

## 16. Storage Map (JSONB Keys, v1)

**vc_business_drafts** Siehe Definition (bereits vorhanden). Ergänzung: persistiere culture.country (aus Adresse abgeleitet) und culture.profile (Hofstede-Lookup).

**vc_runs**
```json
{
  "context": {
    "place_id": "...",
    "business_name": "...",
    "address_text": "...",
    "website_url": "https://...",
    "socials": {
      "facebook_url": "...",
      "instagram_url": "...",
      "tiktok_url": "..."
    },
    "category_hint": "Pizzeria",
    "story_hint": "Familienrezepte seit 1988",
    "culture": {
      "country": "DE",
      "profile": {
        "ua": 65,
        "idv": 67,
        "pdi": 35,
        "mas": 66,
        "ltow": 83,
        "ind": 40
      }
    }
  },
  "inputs": {
    "raw": "Quell-Snapshots (gekürzt), je Adapter"
  },
  "scores": {
    "total": "0-100",
    "google": "...",
    "social": "...",
    "web": "...",
    "other": "..."
  },
  "benchmarks": {
    "local": "...",
    "industry": "...",
    "top10": "..."
  },
  "recommendations": "Liste mit ROI-Feldern + Evidence-Links"
}
```

---

## 17. API Contracts (konkretisiert)

### 17.1 POST /vc/identify

**Body:**
```json
{
  "email": "owner@example.com",
  "business_name": "Ristorante Napoli",
  "location_hint": "München Schwabing",
  "website_url": "https://napoli.example",
  "socials": {
    "instagram_url": "https://instagram.com/napoli"
  },
  "category_hint": "Pizzeria",
  "story_hint": "Familienrezepte seit 1988"
}
```

**Response (mit Kandidaten):**
```json
{
  "candidates": [
    {
      "place_id": "xxx",
      "name": "Ristorante Napoli",
      "address": "Hohenzollernstr. 11, München",
      "website": "https://..."
    }
  ]
}
```

**Response (Draft):**
```json
{
  "draft_id": "draft_abc",
  "confidence": "low"
}
```

### 17.2 POST /vc/identify/confirm

**Body:**
```json
{
  "email": "owner@example.com",
  "place_id": "xxx"
}
```

oder

```json
{
  "email": "owner@example.com",
  "draft_id": "draft_abc"
}
```

**Response:**
```json
{
  "ok": true,
  "confidence": "high",
  "token_hint": "t=..."
}
```

---

## 18. Security, Privacy, Legal (Q&D)

- Nur öffentlich zugängliche Daten abfragen; keine Credentials nötig.
- PII-Minimierung: Email separat verschlüsselt, Business-Daten öffentlich.
- Rate Limits: Identify 5/15min/IP, Start 3/5min/IP.
- DOI Pflicht vor Ergebnisfreigabe.

---

## 19. Definition of Done (Spec Gate)

- Q&D-Felder implementiert (UI + Validierung).
- `/vc/identify` und `/vc/identify/confirm` dokumentiert + gemockt (dev-mode).
- Storage-Keys vorhanden; Evidence/Confidence wird persistiert.
- ROI-Formel und Sortierung dokumentiert und im Output sichtbar (dev-mode).
- Kulturprofil wird (wenn Land ermittelbar) ins context geschrieben.---


## 20. Dashboard Contracts & No-Dupes

### Governance-Integration

- **Referenz:** Vollständige Dashboard-Governance unter `docs/dashboard/governance.md`
- **Templates:** Verpflichtende Nutzung der Spec-Templates unter `docs/specs/_template/`
- **Inventory:** Zentrale Verwaltung aller Dashboard-Komponenten in `docs/audits/dashboard-inventory.md`

### Spec-Anforderungen

- **Eindeutigkeit:** Jede Metrik/Chart/Rule muss eindeutige `spec_id` haben und im Inventory gelistet sein
- **Kanonische Quelle:** Pro Dashboard-Komponente existiert genau EIN Markdown-Dokument als Source of Truth
- **Figma-Alignment:** Visuelle Gestaltung in Figma, technische Definition im Repo

### Implementation-Gates

- **Keine Implementierung ohne Spec:** Jede Dashboard-Komponente benötigt entsprechende Spec-Datei vor Development
- **Deprecation-Pflicht:** Bei neuen Specs müssen redundante alte Dateien in `docs/dashboard/deprecations.md` eingetragen und entfernt werden
- **Review-Prozess:** Alle Dashboard-Änderungen durchlaufen Spec-Review vor Code-Implementation

### Metadaten-Standards

Jede Dashboard-Spec enthält verpflichtend:
```yaml
---
dashboard_id: vc.overview              # stabil, snake.dots
spec_id: vc.kpi.total_visibility      # eindeutig
source_of_truth: figma:FILE_KEY/FRAME_ID
canonical: true                        # nur einmal pro spec_id
version: 2025-01-25
---
```

### Qualitätssicherung

- **CI-Integration:** Automatische Prüfung auf doppelte `spec_id`s
- **Inventory-Sync:** Dashboard-Inventory wird bei jeder Spec-Änderung aktualisiert
- **Template-Compliance:** Alle Specs folgen den definierten Templates für KPI/Chart/Rule#
# Multi-Entry Strategy

### Requirement 11: Multiple Entry Points

**User Story:** As a restaurant owner, I want to access the visibility check through multiple channels (landing page, dedicated page, social shares, partner embeds, QR codes), so that I can easily start the analysis regardless of how I discovered the service.

#### Acceptance Criteria

1. WHEN a user visits the landing page THEN the system SHALL display an inline teaser panel in the hero section
2. WHEN a user visits `/vc` directly THEN the system SHALL display a standalone visibility check page
3. WHEN a user clicks a social share link THEN the system SHALL display appropriate Open Graph previews and track the referral source
4. WHEN a partner embeds the VC widget THEN the system SHALL provide a secure iframe with postMessage communication
5. WHEN a user scans a QR code THEN the system SHALL track the offline campaign source and display the appropriate entry flow

## Enhanced Identification

### Requirement 12: Business Identification with Evidence

**User Story:** As a restaurant owner, I want to provide minimal information about my business and get intelligent suggestions with clear evidence, so that the system can accurately identify my business and show me trustworthy results.

#### Acceptance Criteria

1. WHEN a user enters business name and location THEN the system SHALL provide autocomplete suggestions with confidence scores
2. WHEN multiple business candidates are found THEN the system SHALL display a disambiguation interface
3. WHEN a user confirms their business selection THEN the system SHALL return a teaser result with ranking and opportunities
4. WHEN metrics are displayed THEN the system SHALL provide evidence including source, timestamp, and confidence level
5. WHEN business identification is complete THEN the system SHALL generate a tracking ID for the session

## External Integrations

### Requirement 13: Partner Integration Contracts

**User Story:** As a marketing partner or platform integrator, I want to integrate the VC system through standardized APIs and webhooks, so that I can offer visibility checks to my clients seamlessly.

#### Acceptance Criteria

1. WHEN LinkedIn Lead Gen forms are submitted THEN the system SHALL receive webhook data and map it to VC start requests
2. WHEN partners embed the VC widget THEN the system SHALL validate partner signatures and enforce allowlists
3. WHEN share links are accessed THEN the system SHALL render appropriate Open Graph metadata
4. WHEN external starts occur THEN the system SHALL track attribution data including UTM parameters and referral sources
5. WHEN API rate limits are approached THEN the system SHALL implement graceful degradation and caching strategies

## Security & Privacy

### Requirement 14: Trust and Transparency

**User Story:** As a restaurant owner, I want to understand how my data is collected and used, with clear evidence for all metrics, so that I can trust the analysis and recommendations.

#### Acceptance Criteria

1. WHEN any metric is displayed THEN the system SHALL show the data source, collection timestamp, and confidence score
2. WHEN DOI is required THEN the system SHALL clearly explain the email confirmation process
3. WHEN data is collected THEN the system SHALL provide clear privacy information in simple language
4. WHEN users request data export or deletion THEN the system SHALL provide documented processes
5. WHEN evidence is fetched THEN the system SHALL maintain audit logs for compliance

## Rate Limits & Cost Controls

### Requirement 15: Performance and Reliability

**User Story:** As a restaurant owner, I want the visibility check to complete quickly and reliably, so that I don't abandon the process due to slow loading or errors.

#### Acceptance Criteria

1. WHEN the initial page loads THEN it SHALL complete within 3 seconds
2. WHEN analysis is triggered THEN it SHALL complete within 30 seconds
3. WHEN API calls fail THEN the system SHALL provide graceful error handling with clear recovery options
4. WHEN rate limits are hit THEN the system SHALL implement retry logic with exponential backoff
5. WHEN the system is under load THEN it SHALL maintain 99.9% uptime for VC endpoints

## External Starts

### LinkedIn LeadGen Integration
- **Webhook Endpoint**: `POST /integrations/linkedin/leadgen`
- **Mapping Contract**: [LinkedIn LeadGen Mapper](../_contracts/linkedin_leadgen_mapper.json)
- **Q&D Pflichtfelder**: business_name, address_or_city (mind. Ort/PLZ)
- **Optional Felder**: website, instagram, facebook, email (für DOI Schritt)
- **Idempotenz**: Via `lead_id` für Duplikatsvermeidung

## Contract References

This specification references the following contracts:
- [Entry Points Contract](../_contracts/entry_points.json) - Defines all VC entry points and tracking
- [Identification Flow Contract](../_contracts/identification_flow.json) - Business identification API
- [Teaser Result Contract](../_contracts/teaser_result.json) - Evidence-based result schema
- [OG Share Preview Contract](../_contracts/og_share_preview.json) - Social media sharing metadata
- [LinkedIn LeadGen Mapper](../_contracts/linkedin_leadgen_mapper.json) - LinkedIn integration mapping## U
I & Tonalität (neu)

**REQ-UI-INV-01** (MUST): Das System bietet zwei Darstellungsmodi: `standard_ui` (Listen/Tabellen) und `invisible_ui` (Antwortkarten + Folgefragen). Der Modus ist user-wählbar (wie Dark Mode), persistent, pro Gerät überschreibbar.

**REQ-UI-INV-02** (MUST): Im `invisible_ui` zeigt VC pro Schritt exakt 1–2 präzise Antworten/Karten + 3–5 Follow-up Chips. Listen/Tabellen sind jederzeit per „Mehr Details" erweiterbar.

**REQ-UI-INV-03** (MUST): Die Top-3-Actions sind im `invisible_ui` **scrollfrei** sichtbar (≤1 Bildschirm auf Mobile), mit CTA „Jetzt umsetzen".

**REQ-UI-INV-04** (SHOULD): Persona „zeitknapp" triggert eine non-intrusive Empfehlung, `invisible_ui` zu aktivieren (Opt-in).

**REQ-TONE-01** (MUST): Bedrock-Prompts akzeptieren `tone_preferences` (formality, empathy, directness, brevity) + optional `audience_profile.gender_pref="female"`. Der Output bleibt inklusiv, **ohne Stereotype**; Fokus auf Klarheit, Wertschätzung, Zeitgewinne.

**REQ-TONE-02** (MUST): Microcopy variiert Begriffe in **einfacher Sprache**; Glossar-Mapping (z. B. „ROI" → „geschätzter Euro-Nutzen") bleibt konsistent in beiden Modi.

**REQ-AN-UI-01** (MUST): Analytics Events für Moduswechsel & Invisible-Interaktionen (siehe Design).