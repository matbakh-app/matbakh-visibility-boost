---
id: vc.design.v1
owner: product+engineering
status: draft
links:
  - req: ./requirements.vc-spec.md
  - vis: ./vision.vc-spec.md
  - contracts:
      - ../_contracts/entry_points.json
      - ../_contracts/identification_flow.json
      - ../_contracts/teaser_result.json
---

# VC Design Spec

## 1. Komponentenlandkarte

- **VCInlinePanel** (Landing-Hero)
- **VCStandalonePage** (/vc)
- **VCEmbedFrame** (/embed/vc)
- **VCTeaserResult** (Cardset + ROI-Hinweis)
- **VCIdentifyForm** (Q&D Felder)
- **VCConsent** (DOI + Privacy in einfacher Sprache)
- **VCSharePreview** (server-rendered OG) - siehe [OG Share Preview Contract](../_contracts/og_share_preview.json)
- **VCEventsBridge** (Analytics/Attribution)

## 2. State Machine (High Level)

- **idle** → **identifying** → **disambiguate** → **teaser_ready** → **request_report** → **doi_sent** → **done**
- **error states:** network_error, rate_limited, no_match, expired_link, invalid_token

## 3. Flows (Sequenzen)

- **Q&D**: Identify (POST /vc/identify) → Confirm (POST /vc/identify/confirm) → Teaser → Report Request (POST /vc/start) → DOI
- **Embed**: iFrame init → postMessage(`vc_ready`) … (`vc_submit`, `vc_doi_sent`)
- **Share**: OG-Preview → Landing `/vc?ref=li|fb&c=*` → identischer Q&D
  - **Microcopy-Regeln**: DE primär, max. 120 Zeichen Description, keine Fachbegriffe
  - **Preview-Generierung**: Dynamische OG-Tags basierend auf [OG Contract](../_contracts/og_share_preview.json)

## 4. UI-Zustände & Microcopy (DE)

- **Hero Teaser**: „Wie sichtbar ist dein Restaurant? …" / CTA „Jetzt Sichtbarkeit prüfen"
- **Form Felder (Pflicht)**: Betriebsname*, Adresse/Ort*; **Optional**: Website, Instagram, Facebook
- **Teaser Result**: Ranking-Badge, Top-3 Chancen mit **+€X–€Y/Monat (unverbindlich)**, Button „Vollständigen Report per E-Mail"

## 5. Fehlerbilder

- `no_match`: „Wir konnten deinen Betrieb nicht eindeutig finden …" (Neu suchen + Manuelle Eingabe)
- `rate_limited`: „Kurz warten …" (Retry CTA)
- `expired_link`/`invalid_token`: „Link abgelaufen/ungültig – Neuen Link anfordern"
- `network_error`: „Verbindungsproblem – Nochmal versuchen"

## 6. Analytics & Events

- `vc_start`, `vc_identify`, `vc_disambiguate_ok`, `vc_teaser_show`, `vc_report_request`, `vc_doi_confirmed`
- **Common fields**: tracking_id, partner, ref, utm_*, provider, latency_ms, result.confidence

## 7. Accessibility

- Focus-Traps (InlinePanel/Modal), ARIA für Statuswechsel, Tastaturpfad durch Form + Teaser

## 8. Performance

- InlinePanel lazy load; contracts/json via static import; cache TTLs wie in Requirements

## 9. Security/Privacy

- DOI-Gate; PII minimal; token signing für /embed; evidences geloggt mit source+ts

## 10. Testplan

- **Unit**: state machine, contracts validators
- **E2E**: Q&D happy path, disambiguation, error states, embed postMessage
- **Accessibility**: snapshots (axe)

## 11. Rollout

- **Feature flag**: `vc_inline_panel_enabled`
- **A/B**: Hero-Inline vs. Standalone-Default
- **Metrics**: start→teaser, teaser→report, DOI confirmation rate
## 12. C
ontent & Microcopy

### Microcopy
Primäre Textquelle: `./microcopy.de.md` (spec_id: VC-MC-DE-1). 
Alle UI-Strings im Figma UND im Code müssen aus dieser Quelle stammen.---


## Embed Integration (Partner Snippet)

### iframe postMessage Events

The VC Quick component sends the following postMessage events for iframe embedding:

- `vc:ready` - Component is mounted and ready
- `vc:height` - Height changed (for responsive iframe sizing)
- `vc:submit` - Form submitted with payload
- `vc:success` - Analysis completed successfully
- `vc:error` - Error occurred during analysis

### Partner Implementation

```html
<!-- Partner website integration -->
<div id="vc-container">
  <iframe 
    id="vc_iframe" 
    src="https://matbakh.app/vc/quick"
    width="100%" 
    height="600"
    frameborder="0"
    style="border: none; border-radius: 8px;">
  </iframe>
</div>

<script>
window.addEventListener('message', (event) => {
  const message = event.data;
  if (!message || typeof message !== 'object') return;
  
  const iframe = document.getElementById('vc_iframe');
  
  switch (message.type) {
    case 'vc:ready':
      // Show iframe, hide loading spinner
      console.log('VC Widget ready');
      break;
      
    case 'vc:height':
      // Adjust iframe height dynamically
      if (iframe && message.value) {
        iframe.style.height = (message.value + 20) + 'px';
      }
      break;
      
    case 'vc:submit':
      // Track form submission
      console.log('VC Form submitted:', message.payload);
      // Optional: Send to your analytics
      break;
      
    case 'vc:success':
      // Handle successful analysis
      console.log('VC Analysis completed:', message.payload);
      // Optional: Navigate to results page or store token
      // window.location.href = `/share/vc/${message.payload.token}`;
      break;
      
    case 'vc:error':
      // Handle errors
      console.error('VC Error:', message.payload);
      // Optional: Show inline error message
      break;
  }
});
</script>
```

### Event Payloads

```typescript
// vc:ready
{ type: 'vc:ready' }

// vc:height
{ type: 'vc:height', value: number }

// vc:submit
{ 
  type: 'vc:submit', 
  payload: { 
    name?: string, 
    email: string 
  } 
}

// vc:success
{ 
  type: 'vc:success', 
  payload: { 
    token: string,
    score: number
  } 
}

// vc:error
{ 
  type: 'vc:error', 
  payload: { 
    code: string,
    detail: string
  } 
}
```## I
nvisible UI (Light Mode) — Design

### Komponenten
- `InvisibleCommandBar` (optional, oben fixiert): Kurzfrage („Was willst du erreichen?") mit Autocomplete auf Ziele (mehr Gäste, Bewertungen, Sichtbarkeit).
- `AnswerCard`: 1–2 Karten mit kerniger Antwort (Score/Erkenntnis/Empfehlung), 1 CTA (primär), 1 Nebenlink (Details).
- `FollowUpChips`: 3–5 kontextuelle Chips (z. B. „Zeig mir die Begründung", „Wie viel € könnte das bringen?").
- `ExpandPanel`: klappt Liste/Tabellen/Belege (Evidence) aus, ohne Moduswechsel.

### Interaktionsprinzipien
- 0-Scroll für Kern (Top-3 Actions + CTA).
- Progressive Disclosure: Details stets über `ExpandPanel`.
- Persona-Schalter wirkt auf Dichte/Länge von Texten, **nicht** auf Fakten.

### Moduswahl
- Quick Toggle in Header (`Standard | Invisible | System`) + persistente Einstellung (local + account).
- Setup-Nudge: Nach erstem VC-Result Tool-Tip „Probiere präzise Antworten ohne Scrollen".

### Analytics (Events)
- `ui_mode_changed` {from,to,source:"header|nudge"}
- `inv_query_shown` {intent:"mehr-gaeste|bessere-bewertungen|…"}
- `inv_answer_view` {card_id,spec_id,confidence}
- `inv_followup_click` {chip_id,context}
- `inv_primary_cta_click` {cta_id,action_id}