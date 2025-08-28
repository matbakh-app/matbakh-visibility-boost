# VC Traceability Matrix

**Purpose:** Ensure every requirement maps to design components, contracts, and analytics events.

| req_id | requirement_title | design_component | contract | events (key fields) |
|-------:|-------------------|------------------|----------|---------------------|
| VC-EP1 | Multiple Entry Points | VCInlinePanel, VCStandalonePage | _contracts/entry_points.json | vc_start(tracking_id, ref, utm_*) |
| VC-ID2 | Business Identification | VCIdentifyForm | _contracts/identification_flow.json | vc_identify(latency_ms, candidate_count, confidence) |
| VC-TR3 | Evidence-Based Results | VCTeaserResult | _contracts/teaser_result.json | vc_teaser_show(result.confidence, revenue_estimate) |
| VC-SH4 | Social Share Integration | VCSharePreview | _contracts/og_share_preview.json | vc_share_impression(ref, utm_*) |

## Dashboard & Admin Traceability

- VC-DASH-OWN-01 → Owner VC Overview (spec) → kpi_vc_total.json, chart_vis_trend.json, rule_quick_wins.json
- VC-DASH-OWN-02 → Owner Actions (spec)
- VC-DASH-PARTNER-01 → Partner Performance (spec)
- VC-DASH-OPS-01 → Ops Backoffice (spec)
- RBAC-* → docs/security/rbac.md
- ADMIN-OVERVIEW → docs/admin/specs/admin-overview.md
- ADMIN-LEADS → docs/admin/specs/admin-leads.md
- ADMIN-VC-RUNS → docs/admin/specs/admin-vc-runs.md
- ADMIN-PARTNERS → docs/admin/specs/admin-partners.md
- ADMIN-CONTENT-QUEUE → docs/admin/specs/admin-content-queue.md
- SUPER-ADMIN → docs/admin/specs/super-admin.md
- ADMIN-ROUTES → docs/admin/routes.md
- E2E-ACCEPT → docs/checklists/vc_e2e_acceptance.md
- E2E-SCRIPT → scripts/vc_e2e.sh
- VC-STUB-RUNNER → supabase/functions/vc-runner-stub/index.ts
- DEV-MAIL-SINK → supabase/functions/dev-mail-sink/index.ts
- DEV-SEEDS → supabase/sql/dev_seed.sql
| VC-LI5 | LinkedIn LeadGen | (LeadGen bridge) | _contracts/linkedin_leadgen_mapper.json | vc_external_start(source, mapped_fields) |
| VC-EM6 | Partner Embed | VCEmbedFrame, VCEventsBridge | _contracts/entry_points.json | vc_embed_ready/submit/doi_sent |
| VC-PA7 | Persona Adaptation | VCTeaserResult (adaptive) | _contracts/teaser_result.json | vc_persona_detected(persona_type) |
| VC-TR8 | Trust & Transparency | VCTeaserResult (evidence) | _contracts/teaser_result.json | vc_evidence_shown(source, confidence) |
| VC-PE9 | Performance & Reliability | All components | All contracts | vc_performance(latency_ms, cache_hit) |
| VC-SE10 | Security & Privacy | VCConsent, VCEmbedFrame | _contracts/identification_flow.json | vc_consent_given(analytics, marketing) |
| VC-ML11 | Multi-Language Support | All UI components | All contracts | vc_language_selected(locale) |
| VC-AN12 | Analytics & Attribution | VCEventsBridge | _contracts/entry_points.json | All vc_* events with attribution |
| VC-MC1 | Microcopy & Content | (Texts across components) | ./microcopy.de.md | vc_teaser_show, vc_identify_error, vc_doi_sent |

## Coverage Analysis

### Requirements Coverage: 13/13 (100%)
- All requirements mapped to design components
- All requirements have corresponding contracts
- All requirements generate trackable events

### Design Components Coverage: 8/8 (100%)
- VCInlinePanel → VC-EP1
- VCStandalonePage → VC-EP1  
- VCEmbedFrame → VC-EM6, VC-SE10
- VCTeaserResult → VC-TR3, VC-PA7, VC-TR8
- VCIdentifyForm → VC-ID2
- VCConsent → VC-SE10
- VCSharePreview → VC-SH4
- VCEventsBridge → VC-EM6, VC-AN12

### Contract Coverage: 5/5 (100%)
- entry_points.json → VC-EP1, VC-EM6, VC-AN12
- identification_flow.json → VC-ID2, VC-SE10
- teaser_result.json → VC-TR3, VC-PA7, VC-TR8
- og_share_preview.json → VC-SH4
- linkedin_leadgen_mapper.json → VC-LI5

### Event Coverage: 13/13 (100%)
All requirements generate measurable analytics events for tracking and optimization.

## Validation Rules

1. **Every requirement MUST map to at least one design component**
2. **Every requirement MUST reference at least one contract**  
3. **Every requirement MUST generate at least one trackable event**
4. **Every design component MUST serve at least one requirement**
5. **Every contract MUST be referenced by at least one requirement**

## Change Impact Analysis

When modifying:
- **Requirements**: Check design components and contracts for breaking changes
- **Design Components**: Verify all mapped requirements still satisfied
- **Contracts**: Validate all referencing requirements and components
- **Events**: Ensure analytics tracking remains complete

This matrix ensures complete traceability from business requirements through technical implementation to measurable outcomes.---

## 
Implementation Status Update - Sprint 01

**Datum:** 25. Januar 2025  
**Sprint:** Implementation Sprint 01  

### ✅ Implemented

#### VC-MC-DE-1: Microcopy Binding
- **Status:** ✅ Implemented
- **Files:** 
  - `scripts/mc_extract_vc_de.ts` - Microcopy extraction script
  - `public/locales/de/vc_microcopy.json` - Generated i18n namespace (42 keys)
  - `src/lib/i18n.ts` - Added vc_microcopy namespace
  - `src/pages/vc/VCQuick.tsx` - UI bound to microcopy keys
- **Spec Reference:** `docs/specs/vc/microcopy.de.md`
- **Contract:** All UI strings now use `t('key', { ns: 'vc_microcopy' })`

#### OG-SHARE-1: Social Preview Function
- **Status:** ✅ Implemented  
- **Files:**
  - `supabase/functions/og-vc/index.ts` - OG meta tags generation
- **Contract:** `docs/specs/_contracts/og_share_preview.json`
- **Route:** `/og-vc?token=...` returns HTML with OG tags
- **Features:** 1200x630 image reference, Twitter/LinkedIn cards, auto-redirect

#### EMBED-1: postMessage Events
- **Status:** ✅ Implemented
- **Files:**
  - `src/pages/vc/VCQuick.tsx` - postMessage integration
  - `docs/specs/vc/design.vc-spec.md` - Partner integration guide
- **Events:** `vc:ready`, `vc:height`, `vc:submit`, `vc:success`, `vc:error`
- **Contract:** Full iframe embedding support with responsive height

### 🔄 Error Mapping Implementation

| Error State | Event | Microcopy Key | Implementation |
|-------------|-------|---------------|----------------|
| Validation Error | `vc_identify_error` | `identify.error.validation` | ✅ Mapped |
| No Candidates | `vc_identify_error` | `identify.error.noCandidates` | ✅ Mapped |
| Ambiguous Results | `vc_identify_error` | `identify.error.ambiguous` | ✅ Mapped |
| Rate Limited | `vc_identify_error` | `identify.error.rateLimit` | ✅ Mapped |
| Server Error | `vc_identify_error` | `identify.error.server` | ✅ Mapped |

### 📊 Analytics Integration

All events include `spec_id` attribution and `evidence.confidence` when available:
- Form submission tracking with microcopy error mapping
- postMessage events for iframe analytics
- Error code standardization for QA

### 🎯 Next Phase Ready

- **Share Route:** Need to add `/share/vc/:token` route mapping
- **PNG Generation:** Static OG images for social sharing
- **Production Testing:** LinkedIn/Facebook post inspector validation-
--

## Partner Integration Requirements

| Requirement ID | Description | Implementation | Contract | Events/Logs |
|----------------|-------------|----------------|----------|-------------|
| REQ-PARTNER-EMBED-01 | Partner Embed (iframe, postMessage, allowlist) | VCQuick, VCResult | entry_points.json, tech-contracts.md | EVT: vc:ready,height,submit,success,error |
| REQ-PARTNER-ATTR-02 | Attribution-Felder (partner_id, campaign_id, utm_*) | Identify API | entry_points.json | LOG: start, doi, result |
| REQ-PARTNER-DATA-03 | Datenrückgabe (Webhook optional, HMAC) | Result API | tech-contracts.md | EVT: vc.completed |
| REQ-PARTNER-POSTMSG-04 | postMessage-Spezifikation | VCQuick | tech-contracts.md | EVT: vc:ready,height,submit,success,error |

## Partner Credits Requirements

| Requirement ID | Description | Implementation | Contract | Events/Logs |
|----------------|-------------|----------------|----------|-------------|
| CRED-01 | Partner Credits Specification | docs/specs/commercial/partner-credits.md | - | - |
| CRED-02 | Database Schema (Ledger System) | supabase/sql/commerce_partner_credits.sql | - | LOG: grant,consume,adjust,expire |
| CRED-03 | Admin API Functions | supabase/functions/partner-credits | - | API: GET,POST,PATCH /partner-credits |
| CRED-04 | Admin UI Specification | docs/admin/specs/admin-partner-credits.md | - | EVT: credits_granted,adjusted |
## In
visible UI & Tone Requirements

| req_id | requirement_title | design_component | contract | events (key fields) |
|-------:|-------------------|------------------|----------|---------------------|
| REQ-UI-INV-01 | UI Mode Toggle | InvisibleCommandBar, AnswerCard | identification_flow.style | ui_mode_changed(from,to,source) |
| REQ-UI-INV-02 | Follow-up Chips | FollowUpChips, ExpandPanel | identification_flow.style | inv_followup_click(chip_id,context) |
| REQ-UI-INV-03 | Mobile 0-scroll | owner-vc-overview (invisible) | identification_flow.style | inv_primary_cta_click(cta_id,action_id) |
| REQ-UI-INV-04 | Mode Nudge | Mode Nudge Component | identification_flow.style | ui_mode_changed(source:"nudge") |
| REQ-TONE-01 | Tone Preferences | Bedrock Prompts | identification_flow.style | tone_preference_set(gender_pref,formality) |
| REQ-TONE-02 | Glossary Mapping | Microcopy System | microcopy.de.tone.female_pref | glossary_term_shown(term,simplified) |
| REQ-AN-UI-01 | Analytics Events | All Invisible Components | identification_flow.style | inv_answer_view,inv_query_shown |

### Coverage Analysis Update
- Requirements Coverage: 20/20 (100%) - Added 7 new UI/Tone requirements
- All new requirements mapped to design components and analytics events
- Tone preferences integrated into existing identification flow contract