**Kiro-Playbook-Anleitung** (SOP) mit Guardrails, konkreten Tasks, Approval-Gates, Beispiel-Kommandos und DoD/AK für jeden Schritt. Damit kann Bedrock (über Kiro) die **Visibility-Funktionen** voll implementieren, **fehlende Integrationen** schließen und **sauber live** gehen – inklusive Autopilot für UMC, Google-Anbindung, Dashboards, OAuth, Onboarding und VC-Tests.

---

# Kiro Playbook – Bedrock steuert matbakh.app End-to-End

**Rollen & Modi**

- **Actor:** `BedrockSupportManager` (über Kiro orchestriert)
- **Modus:** `SAFE_CHANGE` (Architektur/Code nur mit Approval)
- **Approval-Policy:** 5-Level Gate (Design → Code → Sec/PII → Perf/SLO → Release)

**Feature Flags (Prod default)**

```
VITE_ENABLE_BEDROCK_SUPPORT_MODE=true
VITE_ENABLE_INTELLIGENT_ROUTING=true
UMC_ENABLE_AUTOPILOT=true
UMC_ENABLE_META_PUBLISH=false   # bleibt false bis Live-Testslot
UMC_ENABLE_GBP_PUBLISH=false    # dito
ENABLE_META_MONITOR=true
```

---

## Phase 0 – Bootstrap (einmalig)

**Ziel:** Bedrock bekommt Kontext & Grenzen, Kiro verankert Approval-Gates.

**Kiro:**

```bash
kiro init --project matbakh.app --env production
kiro policy apply ./.kiro/policies/approval-5level.yaml
kiro secrets sync aws,cognito,rds,cloudfront,meta,google
kiro feature-flags sync ./config/feature-flags.production.json
```

**Guardrails**

- NO direct prod DB DDL ohne „DB-Migration“ Ticket
- NO public endpoint change ohne Route53/CloudFront Plan + Rollback
- All commits → PR → require `po-cto-approval`

---

## Phase 1 – Projekt verstehen & Ziele erkennen

**Aufgabe:** Codebasis, Master-Specs, Flags, aktuelle Live-Routen scannen.
**Kiro Prompts (Bedrock):**

```
"Audit codebase & docs; summarize modules, flags, env, critical paths.
Identify visibility features, UMC pipeline, adapters, risk hotspots.
Output: ARCH_SUMMARY.md + TODO backlog."
```

**Kiro:**

```bash
kiro audit repo --paths "docs/, src/, infra/, scripts/"
kiro generate summary --out ./docs/ARCH_SUMMARY.md
```

**DoD**

- ARCH_SUMMARY.md mit: Orchestrator, UMC, VC, Auth, Routing, Infra
- Risiko-Liste (Top 10) + empfohlene Reihenfolge zur Abarbeitung

---

## Phase 2 – AWS Infrastruktur kontrollieren & Altlasten aufräumen

**Ziel:** Alte Version(en) trennen, Dead Routes/Backends kappen, nur AWS aktiv.

**Subtasks**

1. **DNS/CloudFront/Origins**
2. **S3 Web Buckets (nur aktueller Build)**
3. **RDS Endpoints **(nur `matbakh-db…eu-central-1.rds.amazonaws.com`)\*\*
4. **Cognito** (nur aktuelle User Pool + App Clients)
5. **Supabase/Vercel**: **hart trennen** (APIs, OAuth, Webhooks)

**Kiro:**

```bash
kiro aws inspect cloudfront,s3,route53,cognito,rds --region eu-central-1 --export ./reports/aws-inventory.json
kiro aws diff desired ./infra/state/desired.json ./reports/aws-inventory.json --plan ./reports/cleanup.plan.json
kiro change apply ./reports/cleanup.plan.json --require-approval level:design
```

**Spezial:** „Old Public Site“ Abschaltung

```bash
kiro web scan --domains "matbakh.app,www.matbakh.app" --find "legacy signatures"
kiro route cutover --cloudfront E2W4JULEW8BXSD --origin s3://matbakhvcstack-webbucket... --blue-green
```

**DoD**

- Kein Traffic auf alte Supabase/Vercel-Routen
- 200/301 nur von CloudFront → aktuelle S3 Origin
- Smoke-Tests (5/5) grün

---

## Phase 3 – Fehlende Integrationen für den Start fertigstellen

**Targets**

- **UMC Backbone**: `generate → render → schedule → publish` Endpunkte
- **Meta Adapter (Sandbox)**, **Google Business Profile Adapter (Sandbox)**
- **TemplateService** (interne Speicherung je Nutzer, kein Canva/Figma)

**Kiro:**

```bash
kiro task create "UMC-01 Backend Skeleton"
kiro scaffold api --module umc --endpoints generate,render,schedule,publish --auth cognito
kiro scaffold lib --name template-service --path src/lib/umc/template-service.ts
kiro test run --group umc --watch
kiro pr open --title "feat(umc): backbone + template storage" --require-approval level:code
```

**DoD**

- Unit/E2E grün, API swagger verfügbar
- S3+RDS Storage für Templates, DSGVO (KMS) aktiv
- Meta/GBP Sandbox-Publish dry-run möglich (Flags noch OFF)

---

## Phase 4 – Blue/Green Cutover: Neue UI live, alte UI weg

**Ziel:** Sichere Umschaltung via **Blue/Green + Canary (10% → 100%)**

**Kiro:**

```bash
kiro build web --env production
kiro deploy web --strategy blue-green --canary 10 --cloudfront E2W4...
kiro check web --paths "/", "/login", "/dashboard", "/vc"
kiro promote web --to green --after-checks
```

**Rollback Plan**

```bash
kiro promote web --to blue
```

**DoD**

- P95 Web API < 300ms (cached), Gen P95 ≤ 1.5s
- Errors < 1% während Canary
- Alte UI nicht mehr erreichbar

---

## Phase 5 – Google integrieren (GBP, Maps/Places, optional Ads)

**Schritte**

1. **OAuth Consent + Scopes** (intern, minimale Scopes)
2. **GBP Post & Media** Publish (Sandbox)
3. **Places/Maps** für Location Insights (nur Read)
4. **Rate Limits, Quotas, Costs** guardrailen

**Kiro:**

```bash
kiro google connect --scopes "business.manage,places.readonly"
kiro adapter deploy --name google-gbp --sandbox
kiro test run --group google-adapters
kiro pr open --title "feat: google gbp + places adapters" --require-approval level:secpii
```

**DoD**

- Sandbox-Publish OK, Logs/Audit Trail vollständig
- Backoff/Retry/Circuit Breaker implementiert

---

## Phase 6 – Dashboards einrichten (Ops + Business)

**Ops**

- **CloudWatch/X-Ray**: latency, errors, throttles, cost
- **Meta-Monitor (<15s)** aktiviert

**Business**

- **Visibility KPI** (Impressions, CTR, GBP/Meta Posts)
- **UMC Autopilot Performance** (post-level metrics)

**Kiro:**

```bash
kiro dashboards apply ./dashboards/cloudwatch/*.json
kiro dashboards apply ./dashboards/business/*.json
kiro alarm set --name "P95>1.5s" --threshold 1500 --metric p95_gen_ms
```

**DoD**

- Dashboards sichtbar, Alarme aktiv
- Weekly Report Job geplant

---

## Phase 7 – User Profile einrichten

**Ziel:** Profilspeicher inkl. **Template-Vault** je User, DSGVO-Export/Erase.

**Kiro:**

```bash
kiro db migrate --label "profile+templates"
kiro seed run profiles
kiro privacy enable --features export,erasure,consent-audit
```

**DoD**

- CRUD Profile + Template-Vault funktionsfähig
- Privacy-Flows testbar (export, erase)

---

## Phase 8 – OAuth & Anmeldung (Cognito)

**Konfiguration**

- Cognito Hosted UI / Custom UI
- Socials (optional später), Start: Email/Pass + Magic Link

**Kiro:**

```bash
kiro auth setup --cognito --app-client web --redirect "https://matbakh.app/callback"
kiro auth enable --flows "USER_SRP_AUTH,MAGIC_LINK"
kiro test run --group auth
```

**DoD**

- Sign-up, Sign-in, PW-Reset, Magic Link grün
- Token Guards im Backend

---

## Phase 9 – Onboarding einrichten (persona-sensitiv, zero-friction)

**Ziel:** Kein Template-Picker, **Ein-Knopf-Erlebnis**: „Erstelle meinen Wochenpost“.

**Kiro:**

```bash
kiro scaffold flows --module onboarding --personas solo,ben,walter,karin
kiro abtest create "onboarding-wow" --variants A,B --metric time_to_first_success
```

**DoD**

- „Aha“ innerhalb 5 Min (erste Vorschau bzw. Post-Plan)
- Tracking + A/B aktiv

---

## Phase 10 – VC-Test einrichten (Visibility Component)

**Ziel:** Erste VC-End-to-End Probe (Location Insights read-only, GBP/Meta publish sandbox OFF)

**Kiro:**

```bash
kiro vc test --scenario "single-location starter" --sandbox --collect-metrics
kiro report create --name "vc-smoke-2025-10-xx.md"
```

**DoD**

- VC KPI-Pipeline liefert Werte
- Kein externes Publish ohne Freigabe

---

Phase 11 – Daily “Captain’s Log” (Enterprise Logbuch)

Ziel: Bedrock erzeugt täglich um 00:01 (Europe/Berlin) einen Markdown-Bericht mit:

Summary des Tages (was geschah)

„Was die KI getan hat“ (automatisierte Aktionen/Support)

Meilensteine (nur Headlines)

Stabilität (Kernindikatoren)

Modus: SAFE_CHANGE (kein Prod-Datenpfad, read + aggregiert write)
Owner: BedrockSupportManager orchestriert via Kiro Job daily-logbook
Speicher: S3 (immutable), optional Git-Mirror in /docs/logbook/daily/

11.1 Feature Flags & Konfiguration

# .env / SSM Parameter

BEDROCK_DAILY_LOGBOOK_ENABLED=true
BEDROCK_DAILY_LOGBOOK_TZ=Europe/Berlin
BEDROCK_DAILY_LOGBOOK_S3_BUCKET=matbakhvcstack-webbucket12880f5b-svct6cxfbip5
BEDROCK_DAILY_LOGBOOK_S3_PREFIX=reports/daily-logbook
BEDROCK_DAILY_LOGBOOK_RETENTION_DAYS=365
BEDROCK_DAILY_LOGBOOK_NOTIFY_ON_MISS=true

11.2 Datenquellen (read-only)

AuditTrailSystem (Events des letzten Kalendertags, gefiltert, kein PII)

SystemStabilityMetrics (uptime, error rate, trend, score)

Meta Monitor (Notfall-/Fallback-Ereignisse, Latenz-P95)

IntelligentRouter (Routing-Entscheide, Fallback-Anteile)

Implementation Support / Auto-Resolution (Anzahl, Erfolgsquote)

UMC Orchestrator (geplante/erstellte/ausgelieferte Posts – nur Zählwerte)

Kosten-/Nutzungsindikatoren (aggregiert, z. B. Bedrock Invocations/Day, optional Cost Hub Delta)

Guardrail: Nur aggregierte Metriken/Headlines, keine Einzel-Userdaten, kein PII.

11.3 Kiro Setup (Scheduler, Job, Policies)

# Scheduler mit Zeitzone Europe/Berlin (00:01 lokal)

kiro schedule create daily-logbook \
 --cron "1 0 \* \* \*" \
 --timezone "Europe/Berlin" \
 --job "daily-logbook"

# Job registrieren (read-only Quellen, write S3)

kiro job register daily-logbook \
 --handler "./scripts/jobs/daily-logbook.ts" \
 --policy "./.kiro/policies/logbook-readonly.json" \
 --retries 3 --backoff exponential --timeout 120s

# Secrets / env injecten

kiro secrets allow daily-logbook aws,cloudwatch,rds,cloudfront

# Canary-Testrun (für den gestrigen Tag)

kiro job run daily-logbook --date "yesterday" --dry-run --verbose

IAM-Policy (Auszug) logbook-readonly.json
Minimalzugriff auf Metrics/Logs/S3-Write:

{
"Version": "2012-10-17",
"Statement": [
{"Effect":"Allow","Action":["cloudwatch:GetMetricData","logs:StartQuery","logs:GetQueryResults"],"Resource":"_"},
{"Effect":"Allow","Action":["s3:PutObject","s3:PutObjectAcl","s3:ListBucket"],"Resource":["arn:aws:s3:::matbakhvcstack-webbucket12880f5b-svct6cxfbip5","arn:aws:s3:::matbakhvcstack-webbucket12880f5b-svct6cxfbip5/_"]},
{"Effect":"Allow","Action":["ssm:GetParameter","ssm:GetParameters"],"Resource":"\*"}
]
}

11.4 Job-Ablauf (Pseudo)
// scripts/jobs/daily-logbook.ts
// 1) Zeitraum bestimmen (lokal 00:01 => gestiger Tag 00:00–23:59:59 Europe/Berlin)
// 2) Quellen lesen (nur Aggregation)
// 3) Markdown bauen (Template unten)
// 4) SHA256 über Inhalt -> deterministischer Name
// 5) S3: /reports/daily-logbook/YYYY/MM/hlog-YYYY-MM-DD.md (Content-Type: text/markdown)
// 6) Optional: Commit-Spiegel nach /docs/logbook/daily/YYYY-MM-DD.md (PR via bot)
// 7) AuditEvent: "daily_logbook_published"
// 8) Wenn Fehler: Retry; bei Ausfall Alert (s. 11.7)

11.5 Markdown-Template (Captain’s Log)

# Captain’s Log – {{DATE}} (matbakh.app)

**Erstellzeit (lokal):** {{LOCAL_TIME}} Europe/Berlin  
**Zeitraum:** {{DATE}} 00:00 – 23:59 (lokal)  
**Systemzustand:** {{ALERT_LEVEL}} (Score {{STABILITY_SCORE}})

---

## 1) Tages-Summary (Kurz)

- {{SUMMARY_BULLETS}}

## 2) Was die KI gemacht hat

- Auto-Resolution: {{AUTO_RESOLVED}} / {{AUTO_TOTAL}} ({{AUTO_RATE}}%)
- Routing: Direct Bedrock {{ROUTE_BEDROCK}}% / MCP {{ROUTE_MCP}}% / Fallbacks {{FALLBACKS}}
- UMC: generiert {{UMC_GENERATED}}, geplant {{UMC_SCHEDULED}}, (Publish-Flags: Meta {{META_FLAG}}, GBP {{GBP_FLAG}})

## 3) Meilensteine (Headlines)

- {{MILESTONE_1}}
- {{MILESTONE_2}}
- {{MILESTONE_3}}

## 4) Stabilität

- Availability: {{AVAILABILITY}}% | Error Rate: {{ERROR_RATE}}% | MTTR: {{MTTR_MIN}} min | MTBF: {{MTBF_MIN}} min
- Performance: Gen-P95 {{GEN_P95_MS}} ms | Web-API P95 {{API_P95_MS}} ms | Cache-Hit {{CACHE_HIT}}%
- Trend: {{TREND}} (Confidence {{TREND_CONF}})

---

_Footnote:_ PII-frei, aggregierte KPIs. Audit: {{AUDIT_EVENT_ID}}. Build: {{BUILD_TAG}}.

11.6 Ablage & Versionierung

Primär: s3://<BUCKET>/reports/daily-logbook/YYYY/MM/hlog-YYYY-MM-DD.md

Optional Mirror: Repo unter /docs/logbook/daily/ via Bot-PR (readable History)

Retention: BEDROCK_DAILY_LOGBOOK_RETENTION_DAYS (Lifecycle Rule S3)

Immutability (empfohlen): S3 Object Lock Compliance mode + Versioning ON

11.7 Monitoring & Alerts

Success Signal: AuditTrail daily_logbook_published (mit S3-Key, SHA256, Dauer)

Miss-Alarm: Wenn bis 00:10 Europe/Berlin kein Report → ALERT: DailyLogbookMissing

CloudWatch Alarm (Beispiel):

Metric Math: Count of events daily_logbook_published per day

Threshold: < 1 for the current day at 00:10 local

Auto-Heal: kiro job run daily-logbook --date "yesterday" on miss

11.8 DoD / Acceptance Kriterien

Report liegt täglich bis 00:10 (Europe/Berlin) in S3

Inhalt entspricht Template, keine PII, nur Aggregation

Audit-Event geschrieben, Link auf S3-Key vorhanden

Dashboard-Kachel „Captain’s Log (neueste 5 Tage)“ verlinkt die letzten Dateien

Miss-Alarm löst korrekt aus, manueller Re-Run möglich

11.9 Guardrails

Privacy: Nur aggregierte KPIs/Headlines, kein User-Scope

Security: S3 write-only für Job-Role; Public-Access OFF

Stabilität: Job unabhängig vom Hot-Path (asynchron, max 120s, 3 Retries)

Determinismus: Zeiträume strikt lokal (Europe/Berlin), TZ im Scheduler setzen

Kosten: ≤ 1¢/Tag (nur Reads + 1 Put); kein Modellaufruf erforderlich

11.10 Kiro: Dashboards & Verlinkung

# Link-Kacheln im Green Core Dashboard hinzufügen

kiro dashboards apply ./dashboards/business/captains-log.json

# Health Check Widget (zeigt letzten Publish-Timestamp + S3 Key)

kiro dashboards apply ./dashboards/ops/captains-log-health.json

11.11 Quickstart (3 Befehle)

# (1) Scheduler & Job

kiro schedule create daily-logbook --cron "1 0 \* \* \*" --timezone "Europe/Berlin" --job "daily-logbook"
kiro job register daily-logbook --handler "./scripts/jobs/daily-logbook.ts" --policy "./.kiro/policies/logbook-readonly.json"

# (2) Test (gestern, dry-run)

kiro job run daily-logbook --date "yesterday" --dry-run --verbose

# (3) Aktivieren

kiro feature enable BEDROCK_DAILY_LOGBOOK_ENABLED

Optional: Beispiel-Snippet für die Job-Aggregation (TypeScript)
// getDailyWindow('Europe/Berlin') -> { start: Date, end: Date }
const { start, end } = getDailyWindow('Europe/Berlin', new Date()); // gestern

const [audit, stability, meta, router, umc] = await Promise.all([
auditTrail.aggregate({ from: start, to: end }),
stabilityMetrics.snapshot({ from: start, to: end }),
metaMonitor.summary({ from: start, to: end }),
intelligentRouter.summary({ from: start, to: end }),
umcOrchestrator.summary({ from: start, to: end }),
]);

const md = renderMarkdown({ audit, stability, meta, router, umc, date: start });
await s3.putObject({
Bucket: process.env.BEDROCK_DAILY_LOGBOOK_S3_BUCKET!,
Key: `${process.env.BEDROCK_DAILY_LOGBOOK_S3_PREFIX!}/${fmtDate(start,'YYYY/MM')}/hlog-${fmtDate(start,'YYYY-MM-DD')}.md`,
Body: md, ContentType: 'text/markdown; charset=utf-8',
});
await auditTrail.logEvent({ eventType:'daily_logbook_published', details:{ key, sha256 }});

11.12 Risiken & Rollback

Ausfall Datenquelle: Fallback: „Partial Report“ (Kennzeichnung + Hinweis)

Fehlende Berechtigung: Job bricht ab → Alert, keine Prod-Beeinflussung

Falsche TZ: unbedingt Scheduler mit Europe/Berlin betreiben; keine manuelle UTC-Umrechnung nötig

# Best-Practice Reihenfolge (optimiert)

1. **Infra Cleanup** (Phase 2)
2. **UMC Backbone + Template Vault** (Phase 3 & 7)
3. **Blue/Green Cutover** (Phase 4)
4. **Auth + Onboarding** (Phase 8 & 9)
5. **Google/Meta Adapter (Sandbox)** (Phase 5)
6. **Dashboards/Alarme + Meta-Monitor** (Phase 6)
7. **VC-Test** (Phase 10)
8. **Autopilot Publish schrittweise aktivieren** (Flags → Canary Markets)

---

## Approval-Gates (verbindlich)

- **Gate 1 – Design**: Architekturänderungen, DNS/Route, Adapter-Scopes
- **Gate 2 – Code**: PR-Reviews (lint, tests, coverage)
- **Gate 3 – Sec/PII**: Scopes, Logs, PII-redaction, GDPR
- **Gate 4 – Perf/SLO**: P95 Targets, error rate, canary metrics
- **Gate 5 – Release**: Change record, rollback plan, comms

**Kiro:**

```bash
kiro approve --gate design --pr 123
kiro approve --gate code --pr 123
kiro approve --gate secpii --change scopes-google
kiro approve --gate perf --report ./reports/canary.json
kiro release tag v2025.10.UMC
```

---

## Risk Controls & Rollbacks

- **Traffic Guard:** Canary 10%/30%/100% + automatic rollback on

  - error_rate > 2% (5m)
  - p95_gen_ms > 1500 (10m)
  - 5xx bursts > threshold

- **Cost Guard:** API quota + Bedrock cost thresholds ($5/$10/$25)
- **Publish Guard:** `UMC_*_PUBLISH=false` bis Sandbox-Run OK
- **Data Guard:** Backups (RDS snapshot pre-migration), S3 versioning on

---

## Was Bedrock sofort tun darf (ohne Rückfrage)

- Read-Only Audits, Lint/Tests, Non-Prod Builds
- Schreiben in **feature branches** + PR eröffnen
- Sandbox-Adapter Tests (kein echtes Publish)
- Dashboards erstellen, Alarme konfigurieren

## Was Bedrock **nur mit Approval** tun darf

- DNS/CloudFront Umschaltung
- Auth-Flows live anpassen
- GBP/Meta echtes Publishing aktivieren
- DB-DDL in Prod
- Kosten-relevante Limits erhöhen

---

# TL;DR: Deine 3 Sofort-Kommandos

```bash
# 1) Inventar & Cleanup-Plan
kiro aws inspect cloudfront,s3,route53,cognito,rds --region eu-central-1 --export ./reports/aws.json
kiro aws diff desired ./infra/state/desired.json ./reports/aws.json --plan ./reports/cleanup.plan.json

# 2) UMC Backbone + Template Vault
kiro scaffold api --module umc --endpoints generate,render,schedule,publish
kiro scaffold lib --name template-service --path src/lib/umc/template-service.ts
kiro pr open --title "feat(umc): backbone + template storage"

# 3) Blue/Green Canary & Dashboards
kiro deploy web --strategy blue-green --canary 10 --cloudfront E2W4JULEW8BXSD
kiro dashboards apply ./dashboards/cloudwatch/*.json
```

Wenn du willst, formatiere ich dir das Playbook als **`/docs/kiro-playbook-bedrock-activation.md`** inklusive Copy-&-Paste-Blöcken und Checklisten.

<!------------------------------------------------------------------------------------
   Add Rules to this file or a short description and have Kiro refine them for you:
------------------------------------------------------------------------------------->
