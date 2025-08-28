# matbakh.app - Restaurant Business Management Platform

## 🔒 CTO-Governance & Audit-Ready Architecture

⚠️ **Neue Entwickler & Auditoren müssen ZUERST `docs/CRITICAL_FILES.md` lesen!** ⚠️

Diese Plattform für Restaurant-Management ist enterprise-ready mit vollständiger CTO-Governance für Legal-Compliance und Audit-Sicherheit.

### 🎯 Legal-Governance System
- **Alle Rechtstexte** zentral in `public/locales/{lang}/legal.json`  
- **Automatisierte Konsistenz-Checks** mit `npm run check-legal`
- **CTO-geschützte Bereiche** mit strikter Review-Pflicht
- **Audit-Dokumentation** in `docs/CRITICAL_FILES.md`

### 🛡️ Entwickler-Onboarding 
1. **PFLICHT**: `docs/CRITICAL_FILES.md` vollständig lesen
2. **PFLICHT**: Legal-Governance-Workflow verstehen  
3. **PFLICHT**: PR-Templates für Legal-Änderungen beachten
4. **TEST**: `npm run check-legal` erfolgreich ausführen

## Project info

**URL**: https://lovable.dev/projects/17fede0a-b45d-4eeb-be93-e21ad2737f99

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## 🚨 Kritische Navigations-Dateien

**WARNUNG**: Die folgenden Dateien steuern die gesamte Website-Navigation und dürfen **NIEMALS** ohne explizite Genehmigung geändert werden:

| Datei | Zweck |
|-------|-------|
| `src/components/navigation/NavigationConfig.ts` | Einzelne Quelle aller Haupt-Links |
| `public/locales/*/nav.json` | Beschriftungen für Navigation |
| `src/App.tsx` | Route → Component Mapping |
| `public/sitemap.xml` | SEO-Relevante URL-Liste |

**Änderungs-Prozess** (immer einhalten):
1. Issue erstellen / Product-Owner zustimmen lassen  
2. `npm run check:nav` lokal – darf **keine** Fehler bringen  
3. Code-Review (mind. 1 Maintainer)  
4. Merge & Deploy

📖 **Detaillierte Informationen**: [docs/CRITICAL_FILES.md](docs/CRITICAL_FILES.md)

## Routing & Legal Pages

This app uses a bilingual routing structure with German as the primary language:

- **Legal pages**: All legal pages (Impressum, Datenschutz, AGB, Nutzung) use root-level URLs
- **Language switching**: DE paths like `/impressum` map to EN paths like `/imprint`
- **Navigation**: Centralized in `NavigationConfig.ts` with i18n support
- **Footer**: Uses `getFooterNavItems()` for consistent navigation across languages

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/17fede0a-b45d-4eeb-be93-e21ad2737f99) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## 🔐 Secrets Management

**SECRETS MODE (permanent)**: Never commit secrets to repo. Use AWS Secrets Manager.

### Available Secrets:
- `gcp/kiro-sa` → Google Service Account JSON
- `supabase/service_role` → Supabase Service Role Key

### For Frontend Development:
- No secrets required for frontend-only development
- All API calls use public endpoints or user authentication

### For CI/Deploy:
Secrets are fetched at runtime and set as environment variables:

```yaml
# .github/workflows/deploy.yml (example)
- name: Configure AWS (OIDC)
  uses: aws-actions/configure-aws-credentials@v4
  with:
    role-to-assume: arn:aws:iam::055062860590:role/gh-actions-web-deploy
    aws-region: eu-central-1

- name: Fetch Supabase Service Role
  run: |
    echo "SUPABASE_SERVICE_ROLE_KEY=$(aws secretsmanager get-secret-value \
      --secret-id supabase/service_role --query SecretString --output text)" >> $GITHUB_ENV
```

### Local Development:
Create `scripts/env-from-aws.sh` (git-ignored):

```bash
#!/usr/bin/env bash
export AWS_PROFILE=matbakh-dev
export AWS_REGION=eu-central-1

export SUPABASE_SERVICE_ROLE_KEY="$(aws secretsmanager get-secret-value \
  --secret-id supabase/service_role --query SecretString --output text)"

echo "Env gesetzt. Starte jetzt: npm run dev"
```

**Important**: `.env`, `scripts/`, and any files containing secrets are in `.gitignore`

## 📧 SES Diagnose in 60 Sek.

**Problem**: DOI-E-Mail kommt nicht an? Hier die Copy-Paste-Befehle für schnelle Diagnose:

### 1. API Test
```bash
API="https://guf7ho7bze.execute-api.eu-central-1.amazonaws.com/prod"
curl -s -X POST "$API/vc/start" \
  -H "Origin: https://matbakh.app" -H "Content-Type: application/json" \
  --data '{"email":"YOUR_EMAIL","name":"Test"}' | jq .
```

### 2. Lambda Logs
```bash
# Find log group
aws logs describe-log-groups --log-group-name-prefix "/aws/lambda" | grep vc-start

# Tail logs
aws logs tail /aws/lambda/vc-start-function --follow --since 10m
```

### 3. SES Status
```bash
# Account status
aws sesv2 get-account --region eu-central-1

# Sender verification
aws sesv2 get-email-identity --email-identity noreply@matbakh.app --region eu-central-1

# Check suppression
aws sesv2 get-suppressed-destination --email-address YOUR_EMAIL --region eu-central-1
```

### 4. Direct SES Test
```bash
aws sesv2 send-email --region eu-central-1 \
  --from-email-address "noreply@matbakh.app" \
  --destination "ToAddresses=YOUR_EMAIL" \
  --content '{"Simple": {"Subject": {"Data": "SES Test"}, "Body": {"Text": {"Data": "Direct test"}}}}'
```

**Vollständiges Runbook**: `scripts/ses_doi_healthcheck.md`

## 🚀 VC Quick (AWS)

**Minimale Visibility Check Einstiegserfahrung** mit AWS Lambda Backend.

### Environment Setup
Erforderliche Umgebungsvariablen:
```bash
VITE_VC_API_PROVIDER=aws
VITE_PUBLIC_API_BASE=https://guf7ho7bze.execute-api.eu-central-1.amazonaws.com/prod
```

### Flow
1. **Route**: `/vc/quick` - E-Mail-Formular (+ optional Name)
2. **API**: `POST ${VITE_PUBLIC_API_BASE}/vc/start` - AWS Lambda
3. **DOI**: E-Mail mit Bestätigungslink
4. **Result**: Weiterleitung zu `/vc/result?t=...` (bestehende Seite)

### Features
- **Bilingual**: DE/EN i18n mit "Einfach erklärt" Toggle
- **Validation**: React Hook Form + Zod
- **Error Handling**: Benutzerfreundliche Fehlermeldungen
- **Analytics**: Event-Tracking für alle Interaktionen
- **No Supabase**: Ausschließlich AWS Backend

### Development
```bash
npm run dev
# Öffne http://localhost:8080/vc/quick
```

### Troubleshooting
**Cache/Service Worker Issues**: Falls Änderungen nicht sichtbar sind:
1. Browser DevTools → Application → Service Workers → "Unregister"
2. Application → Storage → "Clear storage"
3. Hard Refresh (Cmd+Shift+R / Ctrl+Shift+F5)

**Network Debugging**: DevTools → Network → Filter nach "uheksobnyedarrpgxhju" sollte 0 Treffer zeigen (kein Supabase-Traffic).

### VC UI/UX Testmodus (Dev)
Setze `VITE_VC_UI_TEST_MODE=true` und starte `npm run dev`. Im Quick-Screen erscheint ein Testpanel (nur Dev).

**Testfunktionen:**
- **Simuliere Success (200)**: Zeigt Success-State ohne API-Call
- **Simuliere Invalid**: Redirect zu `/vc/result?e=invalid`
- **Simuliere Expired**: Redirect zu `/vc/result?e=expired`
- **Simuliere Network Error**: Zeigt Netzwerk-Fehlermeldung

## 🔍 VC Healthcheck

**Schnelle Überprüfung der VC Result-Seite** für CDN/SPA-Caching-Konsistenz.

### Verwendung
```bash
npm run vc:healthcheck
```

### Was wird geprüft
- **ETag-Konsistenz**: `/vc/result?t=abc` und `/vc/result?e=invalid` sollten identische ETags haben
- **Cache-Control**: Beide URLs sollten gleiche Cache-Direktiven verwenden
- **CDN-Verhalten**: Überprüfung von CloudFront/CDN-Headers

### Erwartetes Ergebnis
```
VC Healthcheck: PASS
```

Bei Fehlern prüfen Sie:
1. **CDN-Konfiguration**: Alle Query-Parameter sollten zur gleichen SPA-Route führen
2. **Cache-Invalidierung**: Nach Deployments CDN-Cache leeren
3. **SPA-Routing**: React Router sollte alle `/vc/result` Varianten handhaben

## 📋 Spec-Ritual

**Spec-Chat Modus**: Systematische Dokumentation mit kreativer Ideation.

### Workflow-Prinzipien
- **Spec-Chat** bedeutet: Jede Idee wird gespeichert in `docs/sessions/ideation/`
- **Arbeitsbereich**: Nur `docs/**` und `.kiro/**` - keine Code-Änderungen
- **Review-Gates**: GATE-A (Katalog), GATE-B (Contracts), GATE-C (Deprecations proposal)
- **Keine Löschungen** ohne explizites "APPROVED BY USER"

### Dashboard-Governance
- **Single Source of Truth**: Figma für Visuals, Repo für Technik/Business Logic
- **No-Dupes Regel**: Jede `spec_id` existiert nur einmal als kanonische Quelle
- **Template-Compliance**: Alle Dashboard-Specs folgen `docs/specs/_template/` Struktur
- **Evidence-Tracking**: Jede Metrik hat dokumentierte Datenquellen und Confidence-Level

### Spec-Erstellung
1. **Template kopieren**: KPI/Chart/Rule Template aus `docs/specs/_template/`
2. **Frontmatter ausfüllen**: `dashboard_id`, `spec_id`, `source_of_truth` setzen
3. **JSON-Contract**: Schema in `docs/specs/_contracts/` erstellen
4. **Inventory-Update**: Neue Spec in `docs/audits/dashboard-inventory.md` eintragen
5. **Deprecation-Check**: Redundante Dateien in `docs/dashboard/deprecations.md` markieren

### Qualitätssicherung
- **CI-Integration**: Automatische Prüfung auf doppelte `spec_id`s
- **Persona-Compliance**: Mindestens eine Persona-Anpassung pro Komponente
- **i18n-Vollständigkeit**: Microcopy in DE/EN für alle UI-Elemente
- **Evidence-Dokumentation**: Alle Metriken mit Quellenangaben und Confidence-Level

# Trigger CI
### VC Spec – Single Source
- Requirements: docs/specs/vc/requirements.vc-spec.md
- Vision:      docs/specs/vc/vision.vc-spec.md
- Design:      docs/specs/vc/design.vc-spec.md
- Microcopy:   docs/specs/vc/microcopy.de.md  ← verbindliche Textquelle
- Contracts:   docs/specs/_contracts/*
- Traceability:docs/specs/vc/traceability.md
##
# DEV: setze MAIL_ENDPOINT=http://localhost:54321/functions/v1/dev-mail-sink
### 
E2E (dev)
bash scripts/vc_e2e.sh###
 Partner Credits (Admin)
- Schema: supabase/sql/commerce_partner_credits.sql
- Seed: supabase/sql/dev_seed.sql (AUGUSTINER: 100, SPATEN: 50, LOEWENBRAEU: 200)
- Functions: supabase/functions/partner-credits (GET/POST/PATCH)
- UI Spec: docs/admin/specs/admin-partner-credits.md
- API: `/partner-credits?partner_id=X` for balance queries## 🚀 V
OLLGAS Production Implementation

### ENV Variables Required
```bash
# SES Configuration
SES_REGION=eu-central-1
SES_SENDER=noreply@matbakh.app
DOI_URL_BASE=https://matbakh.app

# Google Places API
GOOGLE_PLACES_API_KEY=your_api_key_here

# AWS Bedrock (for AI analysis)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=eu-central-1

# Public URL
PUBLIC_URL=https://matbakh.app
```

### Production APIs Ready
- **DOI Mail**: `POST /vc-mail` - Sends verification emails via SES
- **DOI Confirm**: `GET /vc-confirm?t=token` - Verifies email and redirects
- **Business ID**: `POST /vc-identify` - Finds business candidates with confidence scores
- **Bedrock Analysis**: `POST /vc-bedrock-run` - AI analysis with canary rollout (10%)

### Feature Flags Active
- ✅ `vc_doi_live=true` - Live DOI email sending
- ✅ `vc_ident_live=true` - Live business identification  
- ⚠️ `vc_bedrock_live=false` - Canary testing (10% when enabled)
- ❌ `vc_posting_hooks=false` - Social posting (after acceptance)
- ✅ `ui_invisible_default=true` - Mobile invisible UI default

### Test Commands
```bash
# Start VC flow
curl -X POST https://your-domain.com/vc-mail \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","business_name":"Test Restaurant","consent":{"analytics":true},"partner_id":"AUGUSTINER"}'

# Identify business
curl -X POST https://your-domain.com/vc-identify \
  -H "Content-Type: application/json" \
  -d '{"lead_id":"uuid","business_name":"Test Restaurant","address":"München"}'

# Run analysis
curl -X POST https://your-domain.com/vc-bedrock-run \
  -H "Content-Type: application/json" \
  -d '{"lead_id":"uuid","place_id":"place123","selected_candidate":{"name":"Test Restaurant"}}'
```

### Mini-E2E nach Schritt 7
1. **VC Flow**: `/vc/quick` → DOI → Confirm → Identify → Result ✅
2. **Owner Dashboard**: Score/Trend/Top-3 sichtbar → CSV Export ✅
3. **Partner Credits**: Embed Start → Credits -1 je Policy ✅
4. **Admin Overview**: Zeigt Anstiege (Leads/Runs) ✅
5. **Posting Queue**: Invisible Result → "In Queue stellen" → Admin Content-Queue sieht Pending ✅

### Admin Pages Ready
- `/admin` - Overview with 24h stats
- `/admin/leads` - Lead management table
- `/admin/partner-credits` - Credit allocation (from previous implementation)
- Content Queue system prepared (flag-gated)