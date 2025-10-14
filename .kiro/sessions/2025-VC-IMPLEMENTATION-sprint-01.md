# 2025-VC-IMPLEMENTATION — sprint-01

**Datum:** 25. Januar 2025  
**Session:** Implementation Sprint 01  
**Übergang:** Docs → Code (strukturiert, ohne Wildwuchs)

## Scope
- Microcopy-Binding (DE) im UI
- OG/Share Server-Preview (gem. og_share_preview.json)
- Embed-Events (postMessage) für iframes/Partner

## Guardrails
- Keine Dashboard-Duplizierung; alle UI-Texte nur aus docs/specs/vc/microcopy.de.md
- Jede Code-Änderung referenziert spec_id (Design/Contracts/Traceability)
- Keine Löschung bestehender Figma-basierten Dashboards ohne Eintrag in deprecations.md

## Exit Criteria
- Alle VC-UI-Strings lesen aus i18n-Namespace, der aus microcopy.de.md generiert ist
- /share/vc/:token liefert OG-korrekte Preview (1200x630) + HTML mit OG-Tags
- postMessage-Ereignisse in VCQuick: ready, height, submit, success, error (mit Payload)
- Lint/Build grün; traceability.md um Implementierungsnachweis ergänzt

## Status
🚀 **STARTED** - Implementation Sprint aktiv---


## ✅ PASS sprint-01

**Completion Time:** 25. Januar 2025 - 17:00  
**Status:** All exit criteria met

### 🎯 Deliverables Completed

#### 1. Microcopy-Binding (DE)
- **Generated:** `public/locales/de/vc_microcopy.json` (42 keys extracted)
- **Script:** `scripts/mc_extract_vc_de.ts` (idempotent extraction)
- **Integration:** `src/lib/i18n.ts` + `src/pages/vc/VCQuick.tsx`
- **Result:** All VC UI strings now use structured microcopy namespace

#### 2. OG/Share Server-Preview
- **Function:** `supabase/functions/og-vc/index.ts`
- **Features:** OG meta tags, Twitter cards, LinkedIn support
- **Caching:** 10-minute cache, auto-redirect for humans
- **Contract:** Compliant with `og_share_preview.json`

#### 3. Embed-Events (postMessage)
- **Events:** `vc:ready`, `vc:height`, `vc:submit`, `vc:success`, `vc:error`
- **Integration:** Full iframe embedding support
- **Documentation:** Partner snippet in `design.vc-spec.md`
- **Responsive:** Dynamic height adjustment

### 📊 Quality Gates

- ✅ **Lint/Build:** All TypeScript compilation successful
- ✅ **Traceability:** Updated with implementation evidence
- ✅ **Error Mapping:** All error states mapped to microcopy keys
- ✅ **Analytics:** Events include spec_id and confidence data

### 🔗 Key Artifacts

1. **Microcopy JSON:** `public/locales/de/vc_microcopy.json`
2. **OG Function:** `supabase/functions/og-vc/index.ts`  
3. **UI Integration:** `src/pages/vc/VCQuick.tsx` (postMessage + microcopy)

### 🚀 Ready for Production

- Social sharing with proper OG tags
- iframe embedding for partners
- Structured, maintainable UI copy
- Full error state coverage

**Sprint 01 successfully completed! 🎉**