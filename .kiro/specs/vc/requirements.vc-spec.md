# VC Spec — Requirements (canonical)

**SPEC_ID:** VC-ONBOARDING  
**STATUS:** Draft  
**OWNER:** Kiro  
**SOURCE_OF_TRUTH:** This file + vision.vc-spec.md  
**LAST_UPDATED:** 2025-01-27

## 1. Intent
Provide an email-only "VC Quick" entry flow to trigger DOI and land on the result page.

## 2. In-Scope (Must)
- Route `/vc/quick`: email (required), name (optional), UX states idle/loading/success/error.
- Call **AWS** `POST {VITE_PUBLIC_API_BASE}/vc/start` (no Supabase).
- Result page `/vc/result` handles states:
  - `success` → confirmed token
  - `expired` → CTA "Neuen Link anfordern" → `/vc/quick`
  - `invalid` → CTA "Neuen Link anfordern" → `/vc/quick`
- i18n DE/EN (namespace `vc_quick` + `vc_result`).
- Analytics events for view/submit/success/error.
- CDN/SPA behaviour: identical `ETag/Cache-Control` for `?t=` and `?e=` (healthcheck script).

## 3. Out-of-Scope (Now)
- Mailversand/SES/Confirm-Lambda Änderungen
- Google OAuth/Login/Register
- Navigation-Governance / Sitemap

## 4. Environment & Provider
- `VITE_VC_API_PROVIDER=aws` (hard)
- `VITE_PUBLIC_API_BASE=https://guf7ho7bze.execute-api.eu-central-1.amazonaws.com/prod`

## 5. API Contract (client → AWS)

### POST /vc/start
**Request:**
```json
{
  "email": "string",
  "name": "string?"
}
```

**Responses:**
- `200`: `{ "ok": true }`
- `400`: `{ "error": "invalid_email" }`
- `429`: `{ "error": "rate_limited" }`
- `5xx/network`: generic error

## 6. UX Copy (DE/EN keys)
- `vc_quick.title`, `intro`, `email`, `name`, `submit`, `sending`, `successTitle`, `successText`, `errorGeneric`
- `vc_result.invalid.title/hint`, `expired.title/hint`, `cta.requestNew`

## 7. Tracking (suggested)
- `vc_quick_view`, `vc_quick_submit`, `vc_quick_success`, `vc_quick_error`, `vc_quick_cta_click`

## 8. Observability
- `scripts/vc_healthcheck.sh`: compare ETag/Cache-Control for `/vc/result?t=abc` vs `?e=invalid` (PASS required).

## 9. Acceptance Criteria (DoD)
- `/vc/quick` works; success state instructs to confirm email.
- `/vc/result` shows clear UI for success/expired/invalid incl. CTA to `/vc/quick`.
- No requests to `*.supabase.co` in VC flow.
- Healthcheck PASS.
- VC-only lint passes (no `any` in VC files).

## 10. Session Rules (Kiro)
- At session start: summarize changes to this file; confirm any ambiguities as TODOs here.
- Never widen scope without adding to sections 2/3.
- Prefer small PRs; VC-only CI gate must be green.

---