---
title: Partner Tech Contracts
status: draft
version: 2025-01-25
spec_ids:
  - REQ-PARTNER-EMBED-01
  - REQ-PARTNER-ATTR-02
  - REQ-PARTNER-POSTMSG-04
---

# Felder & Attribution

Jeder VC-Start (embed/extern) MUSS folgende Felder akzeptieren und loggen:

- `partner_id` (string, required)
- `campaign_id` (string, optional)
- `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content` (optional)
- `embed` (boolean, default false)
- `origin` (auto, per request)

# Allowed Origins

- **Governance-Quelle:** `docs/dashboard/governance.md` Abschnitt **Allowed Embed Origins**
- Server validiert `Origin` Header gegen Allowlist. Unbekannte Origins → 403.

# Webhook (optional)

**Endpoint (partnerseitig):** POST `{partner_webhook_url}`

```json
{
  "event": "vc.completed",
  "timestamp": "ISO-8601",
  "partner_id": "string",
  "campaign_id": "string|null",
  "vc_token": "string",
  "business_id": "string",
  "score": {
    "total": "0-100",
    "google": "0-100", 
    "social": "0-100"
  },
  "confidence": "0-1",
  "evidence_count": 0
}
```

**Signatur:** HMAC-SHA256 Header `X-Signature` (shared secret pro Partner).

# postMessage Events (iframe)

**Vom VC-Frame an Parent:**

- `vc:ready` → `{ height }`
- `vc:height` → `{ height }` (on resize/content changes)
- `vc:submit` → `{ email, partner_id, campaign_id }`
- `vc:success` → `{ vc_token }`
- `vc:error` → `{ code, message }`

**Sicherheit:** Parent prüft `event.origin ∈ Allowlist`. Rate-Limit: max. 5 `vc:height` pro Sekunde.