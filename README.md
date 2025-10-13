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

## 📌 Canonical Specs & Master Documents

Dieses Projekt arbeitet mit **kanonischen Quellen**, um Redundanz zu vermeiden und eine eindeutige Wahrheit („Single Source of Truth") zu haben.  
Alle Teammitglieder (inkl. Kiro) sollen sich ausschließlich auf diese Dokumente beziehen.

### Master-Specs

- **Personas & Journeys** → [`docs/personas.md`](docs/personas.md)
- **Systemarchitektur & Entscheidungen** → [`docs/architecture-decisions.md`](docs/architecture-decisions.md)
- **Performance & Latency (inkl. Caching)** → `docs/performance.md`
- **AI-Provider Architektur & Orchestrator** → `docs/ai-provider-architektur.md`
- **Multi-Region & Failover** → `docs/multi-region.md`
- **Support & Self-Service** → `docs/support.md`

### Historische Reports (Archiv)

- Handover-Reports (z. B. `docs/archive/`)
- Alte Chatbergabe-Dokumente

**👉 Wichtig:** Bei Unklarheiten immer zuerst in den **Master-Specs** nachsehen.  
Falls dort etwas fehlt, Dokument erweitern statt neue Einzeldateien anzulegen.

## 🧪 Jest Test Infrastructure (Production Ready)

### ✅ Comprehensive Jest Setup with Full Migration from Vitest

- **Production-Ready Configuration** mit CommonJS/TypeScript Hybrid-Setup
- **Enhanced Performance** - 40% faster startup, 29% memory reduction
- **Complete Coverage Integration** mit automatischen Schwellenwerten (80%+)
- **CI/CD Optimized** mit GitHub Actions Integration
- **Developer-Friendly** mit Watch Mode und Debug Support

**📖 Dokumentation:**

- **[Jest Maintenance Guide](./docs/jest-test-infrastructure-maintenance-guide.md)** - Vollständige Setup-Dokumentation
- **[Jest Troubleshooting Guide](./docs/jest-troubleshooting-guide.md)** - Lösungen für häufige Probleme
- **[Testing Infrastructure Guide](./docs/testing-infrastructure-guide.md)** - Multi-Layer Testing Strategy

**🚀 Schnellstart:**

```bash
# Alle Tests ausführen
npm test

# Tests mit Coverage
npm run test:coverage

# Watch Mode (Entwicklung)
npm run test:watch

# Spezifische Tests
npx jest --testPathPattern="your-test-name"
```

**✅ Status:** Vollständig migriert von Vitest → Jest, alle 9 Tasks abgeschlossen

## 🤖 AI-Powered Features

### ✅ Bedrock AI Core - Lambda Pipeline Architecture (Task 8)

- **Enterprise-Grade Security** mit Zero Direct Access Pattern
- **Intelligent Cost Control** mit Multi-Level Thresholds ($5/$10/$25)
- **Controlled Web Access** für Google Maps, Instagram, Facebook, Yelp APIs
- **Comprehensive Audit Trail** mit DSGVO-konformer PII-Redaction
- **Circuit Breaker Patterns** für resiliente externe API-Integration
- **Production-Ready** mit 5 TypeScript-Modulen (~2,100 LOC)

**Dokumentation:** [Task 8 Completion Report](docs/task-8-completion-report.md)

### ✅ Bedrock Support Mode - Environment Configuration (Bedrock Activation)

- **Environment-Specific Configuration** für Development, Staging und Production mit dedizierten `.env.bedrock.*` Dateien
- **Intelligent Configuration Loader** mit automatischer Environment-Detection und Validation System
- **Production-Ready Feature Flags** mit Test-Environment-Detection und Safe Defaults (alle Flags false in Tests)
- **Comprehensive Configuration Management** mit 47 Environment-Variablen für granulare Kontrolle
- **Enterprise-Grade Security Settings** mit Circuit Breakers, GDPR Compliance und PII Detection für Production
- **55/55 Tests Passing** (35 Feature Flags + 20 Config Loader) mit vollständiger Environment-Isolation

**Key Configuration Features:**

```bash
# Environment-specific configuration files
.env.bedrock.development    # Debug mode, comprehensive monitoring, 5min audits
.env.bedrock.staging       # Production-like, canary testing, 10min audits
.env.bedrock.production    # Conservative, circuit breakers, 30min audits

# Programmatic configuration access
const config = getBedrockConfig();
const validation = validateBedrockConfig();
const auditInterval = featureFlags.getAuditInterval();
```

**Environment-Specific Defaults:**

- **Development**: Debug enabled, comprehensive monitoring, mock infrastructure audit, 5-minute audit intervals
- **Staging**: Production-like settings, canary testing (10%), detailed monitoring, 10-minute audit intervals
- **Production**: Conservative approach, circuit breakers, GDPR compliance, PII detection, 30-minute audit intervals

**Configuration Variables:**

- **Feature Flags**: `VITE_ENABLE_BEDROCK_SUPPORT_MODE`, `VITE_ENABLE_INTELLIGENT_ROUTING`, `VITE_ENABLE_DIRECT_BEDROCK_FALLBACK`
- **Safety Settings**: Rate limiting, cost controls, circuit breakers, audit trails
- **Notification Channels**: Console, Slack, PagerDuty, Webhook mit environment-spezifischen Defaults
- **Production Security**: GDPR compliance, PII detection, audit trail enforcement

**Dokumentation:** [Bedrock Environment Configuration](docs/bedrock-environment-configuration.md)

### ✅ Goal-Specific Recommendation System (Task 6.3)

- **AI-Generated Recommendations** für 5 Geschäftsziele (25 Empfehlungen total)
- **4 Persona-Types** (Solo-Sarah, Bewahrer-Ben, Wachstums-Walter, Ketten-Katrin)
- **Impact/Effort Scoring** (1-10 Skala) für Priorisierung
- **Multi-Platform Strategy** (Google, Instagram, Facebook, Website, Offline)
- **React Widget** mit Filtering, Sorting und Progress Tracking
- **AWS Lambda Backend** mit Effectiveness Measurement Engine

**Dokumentation:** [Task 6.3 Completion Report](docs/task-6-3-goal-specific-recommendations-completion-report.md)

### ✅ Competitive Benchmarking System (Task 6.1)

- **Strategic Frameworks Integration** mit 5 Business Frameworks (SWOT, Porter's Five Forces, Balanced Scorecard, Nutzwertanalyse, Hofstede)
- **Multi-Platform Data Collection** (Google, Instagram, Facebook, Yelp)
- **Competitor Discovery Engine** mit geografischer und kategorie-basierter Suche
- **Production-Ready Error Handling** mit defensiver Jest-Test-Kompatibilität
- **AWS Lambda Architecture** mit comprehensive testing und deployment scripts
- **Business Intelligence** mit ROI-Projektionen und kultureller Adaptation

**Dokumentation:** [Task 6.1 Completion Report](docs/task-6-1-competitive-benchmarking-completion-report.md) | [Jest Debug Report](docs/task-6-1-jest-test-debugging-completion-report.md)

### ✅ Cost Optimization Engine (Task 3.2)

- **Real-time Cost Tracking** mit präzisem Token-Counting für alle AI-Operationen
- **Predictive Cost Modeling** mit Pattern-Recognition (steady, growing, spiky, seasonal)
- **Automatic Cost Control** mit Multi-Level Thresholds ($5/$10/$25) und Emergency Shutdown
- **Intelligent Model Switching** für Cost-Efficiency (Sonnet → Haiku bei Throttling)
- **Enterprise-Grade Analytics** mit Industry Benchmarking und Optimization Recommendations
- **11 DynamoDB Tables** für comprehensive Cost Management und Audit Compliance

**Dokumentation:** [Task 3.2 Completion Report](docs/task-3-2-cost-optimization-engine-completion-report.md)

### ✅ Enhanced Security Framework (Task 4)

- **Template Security System** mit KMS Customer-Managed Keys und cryptographic signatures
- **Advanced Threat Detection Engine** mit ML-based analysis und behavioral profiling
- **Automated Security Incident Response** mit real-time blocking und quarantine systems
- **Multi-layered Security Analysis** (Static, Behavioral, ML) mit 95%+ threat detection accuracy
- **Comprehensive Audit Trails** für GDPR compliance und security monitoring
- **Production-Ready Security** mit enterprise-grade cryptographic integrity

**Dokumentation:** [Task 4 Completion Report](docs/task-4-enhanced-security-framework-completion-report.md)

### ✅ AI Operations Audit Trail System (System Optimization Enhancement)

- **Comprehensive Audit Logging** für alle AI-Operationen mit vollständiger Lifecycle-Verfolgung
- **GDPR Compliance** mit Data Anonymization, PII Protection und Lawful Basis Tracking
- **Security & Integrity** mit Cryptographic Hash Chaining und Tamper Detection
- **Compliance Reporting** mit automatisierten Reports, Violation Tracking und Recommendations
- **Enterprise-Grade Features** mit 29 Tests (100% passing), minimal performance impact (<5ms overhead)
- **Production-Ready Integration** mit seamless AI orchestrator integration und zero breaking changes

**Dokumentation:** [AI Operations Audit Trail System](docs/ai-operations-audit-trail-system.md) | [Completion Report](docs/ai-operations-audit-trail-completion-report.md)

### ✅ 10x Load Testing System (Task: Load-Testing mit 10x aktueller Last erfolgreich)

- **10x Load Capacity Validation** - Tests 100 RPS (10x current 10 RPS baseline) mit intelligenter Performance-Analyse
- **Performance Grading System** - A-F Bewertung basierend auf Scalability (40%), Stability (30%), Efficiency (30%)
- **Multiple Test Types** - Standard, Scalability (2x→5x→10x), Endurance (30+ Min), Breaking Point (20x)
- **Intelligent Recommendations** - Context-aware Optimierungsvorschläge für Infrastructure, Application, Database, Caching
- **Comprehensive Reporting** - Detailed Markdown/JSON Reports mit Baseline-Comparison und Executive Summary
- **Production-Ready CLI** - Vollständige Command-Line Interface mit Environment-spezifischen Konfigurationen

**Key Commands:**

```bash
# Standard 10x load test
npm run test:load-10x

# Progressive scaling test (2x → 5x → 10x)
npm run test:load-10x:scalability

# Sustained high load test (30+ minutes)
npm run test:load-10x:endurance

# Breaking point test (beyond 10x)
npm run test:load-10x:breaking-point

# Production readiness test
npm run test:load-10x:production
```

**Performance Grading Examples:**

- **Grade A (Excellent)**: 98 RPS, 200ms response, 0.5% error rate → Ready for production scaling
- **Grade B (Good)**: 88 RPS, 400ms response, 1.8% error rate → Minor optimizations recommended
- **Grade C (Acceptable)**: 75 RPS, 700ms response, 4.2% error rate → Optimization required
- **Grade D (Poor)**: 55 RPS, 1100ms response, 8.5% error rate → Significant improvements needed
- **Grade F (Failed)**: 25 RPS, 2500ms response, 15% error rate → Critical issues must be fixed

**Dokumentation:** [10x Load Testing Implementation](docs/10x-load-testing-implementation.md) | [Task Completion Report](docs/task-10x-load-testing-completion-report.md)

### ✅ Visibility Check Intelligence Enhancement (Task 6)

- **Competitive Benchmarking Module** mit Multi-Platform Analysis (Google, Instagram, Facebook, Yelp)
- **Strategic Frameworks Integration** mit 5 Business Frameworks (SWOT, Porter's Five Forces, Balanced Scorecard, Nutzwertanalyse, Hofstede)
- **Automated SWOT Analysis Engine** mit AI-powered generation from review texts and images
- **Goal-Specific Recommendation System** für 5 Geschäftsziele mit Impact/Effort Scoring
- **Visibility Score Evolution Tracking** mit Predictive Forecasting und Trend Analysis
- **Industry Benchmark Comparison** mit Multi-Region Support für Franchise Operations

**Dokumentation:** [Task 6.4.5 Completion Report](docs/task-6-4-5-industry-benchmark-comparison-completion-report.md)

### ✅ Safe Archival System with Hard Gates (Task 8)

- **Zero-Risk Archival** mit comprehensive backup und instant rollback für 391+ legacy components
- **Two-Tier Isolation Strategy**: Permanent Archive (hard isolated) vs. On-Hold Archive (restorable)
- **Production Hard Gates** preventing archived code leaks into build/test/production
- **System Consolidation** unifying 3 parallel archival systems into single source of truth
- **On-Hold Component Management** für 125 high-risk components mit detailed analysis und restoration capability
- **Enterprise-Grade Safety** mit TypeScript/Jest/ESLint/Vite exclusions und CI/CD verification

**Key Commands:**

```bash
# Verify archive isolation (CRITICAL before deployment)
bash scripts/verify-archive.sh

# Restore on-hold component
npx tsx scripts/restore-onhold-component.ts <component-path>

# Review on-hold components
npx tsx scripts/run-safe-archival.ts review-onhold <archive-dir>
```

### ✅ Multi-Region Infrastructure (Task 11) - COMPLETED

- **Enterprise-Grade Disaster Recovery** mit Sub-15-Minute RTO und Sub-1-Minute RPO
- **EU-GDPR-Compliant Architecture** mit eu-central-1 (primary) und eu-west-1 (secondary)
- **Automated Failover/Failback** mit comprehensive health monitoring und notification system
- **Aurora Global Database** mit real-time cross-region replication und lag tracking
- **Production-Ready Implementation** mit 59/59 Tests bestehend (100% Success Rate)
- **Cost-Optimized Multi-Region** mit budget controls und automated cost monitoring

**Key Components:**

```bash
# Multi-region health check
npm run health:check --region eu-central-1

# Execute disaster recovery failover
npx tsx scripts/dr-failover.ts --reason "Planned maintenance"

# Execute disaster recovery failback
npx tsx scripts/dr-failback.ts --reason "Primary region restored"

# Run DR test (non-disruptive)
npx tsx scripts/dr-test.ts --type full
```

**Dokumentation:** [Task 11 Final Completion Report](docs/task-11-multi-region-infrastructure-final-completion-report.md) | [Multi-Region Quick Reference](docs/multi-region-quick-reference.md)

### ✅ Multi-Region Failover Testing (System Optimization) - COMPLETED

- **Enterprise-Grade Test Suite** mit 74 Tests across multiple layers (Unit, Integration, E2E)
- **Comprehensive Failover Validation** mit RTO ≤15min und RPO ≤1min compliance testing
- **Production-Ready Test Infrastructure** mit automated validation und detailed reporting
- **Performance Metrics Collection** mit health check latency tracking (avg. 1527ms)
- **Cross-Region Integration Testing** für DNS, Database, Storage und Secrets validation
- **Automated DR Testing** mit comprehensive disaster recovery simulation

**Key Test Commands:**

```bash
# Run comprehensive multi-region failover tests
npm run test:mr:failover --verbose

# Run unit tests for multi-region components
npm run test:mr:unit

# Run integration tests for DR scripts
npm run test:mr:dr

# Run E2E multi-region failover tests
npm run test:mr:e2e

# Complete Task 11 verification
npm run verify:task11:full
```

**Test Coverage:**

- **Unit Tests:** 61/61 passed (100% success rate)
- **Integration Tests:** 13/13 passed (100% success rate)
- **E2E Tests:** Comprehensive lifecycle validation
- **Infrastructure Tests:** CDK stack validation available

**Dokumentation:** [Multi-Region Failover Testing Completion Report](docs/task-multi-region-failover-testing-completion-report.md)

### ✅ Performance Rollback Mechanisms (System Optimization) - COMPLETED

- **Enterprise-Grade Performance Recovery** mit automatischem Rollback bei SLO-Verletzungen und Performance-Degradation
- **Comprehensive Rollback Management** mit Emergency Rollback, Gradual Rollback und Configuration Snapshots
- **Real-time Performance Monitoring** mit P95 Latency Tracking, Error Rate Monitoring und Cost per Request Analysis
- **Production-Ready React Integration** mit usePerformanceRollback Hook und PerformanceRollbackDashboard Component
- **48/48 Tests Passing** (Manager: 15, Integration: 19, React Hook: 13) mit 100% Success Rate
- **Green Core Validation Integration** als 13. Komponente mit vollständiger CI/CD Integration

**Key Features:**

```typescript
// Performance Rollback Manager
const rollbackManager = new PerformanceRollbackManager({
  sloViolationThreshold: 3,
  cooldownPeriod: 300000, // 5 minutes
  emergencyThresholds: {
    errorRate: 0.1, // 10% error rate
    p95Latency: 5000, // 5 seconds
    costPerRequest: 0.5, // $0.50 per request
  },
});

// React Hook Integration
const {
  performanceData,
  isLoading,
  triggerRollback,
  cancelRollback,
  refreshData,
} = usePerformanceRollback({
  pollingInterval: 30000,
  autoRefresh: true,
});
```

**Rollback Capabilities:**

- **Emergency Rollback:** Automatic rollback on high error rates, P95 latency violations, cost spikes
- **SLO Violation Tracking:** Consecutive violation monitoring with configurable thresholds (default: 3)
- **Gradual Rollback:** Step-by-step rollback execution for controlled recovery
- **Configuration Management:** Snapshot-based configuration with rollback capabilities
- **Cooldown Periods:** Prevents rollback thrashing with configurable cooldown (default: 5 minutes)

**Integration Commands:**

```bash
# Test performance rollback system
npm run test:performance-rollback

# Run comprehensive rollback tests
npm run test:rollback:comprehensive

# Performance rollback dashboard (development)
npm run dev:rollback-dashboard

# Green Core Validation (includes rollback tests)
npm run test:green-core
```

**Monitoring & Alerts:**

- **Real-time Metrics:** Performance data loading with polling and manual refresh
- **Slack Integration:** Severity-based notifications (INFO, WARNING, CRITICAL, EMERGENCY)
- **Dashboard Visualization:** Real-time performance metrics and rollback history
- **Health Checks:** Comprehensive system health monitoring with automatic recovery

**Dokumentation:** [Performance Rollback Mechanisms Final Integration Report](docs/performance-rollback-mechanisms-final-integration-report.md) | [Performance Rollback Completion Report](docs/performance-rollback-mechanisms-completion-report.md)

````

**Dokumentation:** [Task 8 Completion Report](reports/task-8-safe-archival-system-completion.md) | [Hard Gates Documentation](docs/archive-hard-gates-documentation.md) | [Consolidation Analysis](docs/archival-systems-consolidation-analysis.md)

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
````

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

| Datei                                           | Zweck                             |
| ----------------------------------------------- | --------------------------------- |
| `src/components/navigation/NavigationConfig.ts` | Einzelne Quelle aller Haupt-Links |
| `public/locales/*/nav.json`                     | Beschriftungen für Navigation     |
| `src/App.tsx`                                   | Route → Component Mapping         |
| `public/sitemap.xml`                            | SEO-Relevante URL-Liste           |

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

## 🔐 Security & Compliance

**SECRETS MODE (permanent)**: Never commit secrets to repo. Use AWS Secrets Manager.

### 🛡️ Provider Agreement Compliance

- **No Training Policy:** [Complete Documentation](docs/provider-agreement-compliance.md)
- **GDPR/CCPA Ready:** All AI providers verified for data protection compliance
- **Audit Trail:** Full compliance monitoring and violation detection

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

## 🤖 AI-Powered Business Intelligence System

### Business Framework Analysis Engine (Task 5)

**Revolutionäre Multi-Framework-Analyse** für Restaurant-Business-Intelligence mit AWS Bedrock Claude 3.5 Sonnet.

#### 🎯 Unterstützte Analyse-Frameworks

- **SWOT-Analyse:** Stärken, Schwächen, Chancen, Bedrohungen mit restaurantspezifischen Insights
- **Porter's Five Forces:** Wettbewerbspositionierung mit 5-Kräfte-Modell
- **Balanced Scorecard:** 4-Perspektiven-Leistungsmessung für Hospitality-Industrie
- **Hofstede Kulturdimensionen:** 6 kulturelle Dimensionen für regionale Anpassung
- **Nutzwertanalyse:** ROI-Priorisierung mit unverbindlichen Umsatzprojektionen

#### 🎭 Persona-Adaptive Ausgabe

- **Zeitknappe:** 30-Sekunden-Summary mit Top-3-Actions
- **Überforderte:** Vereinfachte Schritt-für-Schritt-Anleitungen
- **Skeptiker:** Datenbasierte Beweise mit Confidence-Scores
- **Profi:** Vollständige Analyse mit Export-Optionen (PDF, CSV, API)

#### 🏗️ Technische Architektur

```typescript
// Beispiel: Multi-Framework-Analyse
const analysis = await businessFrameworkEngine.analyzeRestaurant({
  business_data: vcData,
  persona_type: 'skeptiker',
  frameworks: ['swot', 'porters_five_forces', 'balanced_scorecard'],
  cultural_context: 'Germany'
});

// Ergebnis: Persona-adaptive Ausgabe
{
  executive_summary: "Ihr Restaurant zeigt starke lokale Präsenz...",
  swot: { strengths: [...], opportunities: [...] },
  quick_wins: [
    { action: "Google My Business optimieren", time: "30 Min", roi: "15% mehr Anfragen" }
  ],
  confidence_score: 85,
  frameworks_used: 3
}
```

#### 📊 Production-Ready Features

- **✅ 3,295 LOC:** Business Framework Engine + Orchestrator + VC Integration
- **✅ 95%+ Test Coverage:** 47 Test Cases mit Unit/Integration/Edge Cases
- **✅ AWS Bedrock Integration:** Claude 3.5 Sonnet mit Security Guards
- **✅ Token-Optimierung:** < 6,000 Tokens pro Comprehensive Analysis
- **✅ Caching-System:** 7-Tage TTL mit automatischer Invalidierung
- **✅ Deployment-Ready:** `./infra/lambdas/bedrock-agent/deploy-vc-orchestrator.sh`

#### 🔒 Enterprise-Grade Security

- **PII-Schutz:** Automatische Anonymisierung in Prompts
- **Prompt-Security:** Unveränderliche Sicherheits-Guards
- **ROI-Disclaimer:** Alle Projektionen mit "unverbindlich" markiert
- **AWS Secrets Manager:** Sichere Template-Speicherung

### Bedrock AI Core Capabilities

**Next-Generation AI Infrastructure** mit umfassenden Enhancement-Möglichkeiten und **vollständiger Test-Validierung**.

#### ✅ Task 12: Comprehensive Testing Suite (COMPLETED)

- **7,898+ Lines of Test Code** - Complete AI operations validation
- **4 Comprehensive Test Suites** - Operations, Accuracy, Security, Load Testing
- **85%+ Persona Detection Accuracy** - Validated with automated reporting
- **Security Testing** - Prompt injection prevention and template validation
- **Performance Testing** - Load testing with 50+ concurrent requests
- **Automated Test Orchestration** - CI/CD ready with intelligent reporting

#### 🔒 Security & Governance

- **KMS Customer-Managed Keys:** Enhanced encryption für sensitive Daten
- **S3 Security Hardening:** Lifecycle policies mit 7-Jahre-Compliance
- **Prompt Template Audit:** Kryptographische Integritätsprüfung
- **Advanced Threat Detection:** ML-basierte Prompt-Injection-Erkennung
- **Provider Agreement Compliance:** [No Training Policy](docs/provider-agreement-compliance.md) für alle AI-Provider

#### 🔍 Observability & Analytics

- **CloudWatch Logs Insights:** Präzise Cost-Tracking-Integration
- **Real Token Counting:** @anthropic-ai/tokenizer für exakte Kostenberechnung
- **Structured Logging:** Pino mit Trace-Injection für Debugging
- **Super Admin Dashboard:** Persona-Analytics mit ROI-Distribution

#### 🔌 Extensibility & Hooks

- **Event Hook Architecture:** 6 Hook-Points für Custom-Integrationen
- **Slack/Webhook Notifications:** Built-in Alerting-System
- **Stale-While-Revalidate:** Advanced Caching mit Background-Refresh
- **Partial Streaming:** Server-Sent Events für zeitknappe Personas

#### 📈 Performance Enhancements

- **Function Calling:** Deterministische JSON-Struktur-Ausgabe
- **Template Provenance:** KMS-signierte Template-Verifikation
- **Multi-Provider-Ready:** Vorbereitet für Gemini, GPT-4, lokale Models
- **Real-Time Monitoring:** Live-Metriken für aktive Jobs und Cost-Rate

**Vollständige Dokumentation:** `docs/bedrock-ai-enhancement-backlog.md` | `docs/task-5-completion-report.md`

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
- Vision: docs/specs/vc/vision.vc-spec.md
- Design: docs/specs/vc/design.vc-spec.md
- Microcopy: docs/specs/vc/microcopy.de.md ← verbindliche Textquelle
- Contracts: docs/specs/\_contracts/\*
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
- API: `/partner-credits?partner_id=X` for balance queries## 🏗️ System Architecture Cleanup & Reintegration

### ✅ Architecture Cleanup Completed (Tasks 1-10)

The system has undergone comprehensive architecture cleanup and reintegration, transforming from a mixed legacy system to a pure Kiro-based architecture.

#### 🔍 Architecture Discovery & Analysis (Tasks 1-3)

- **✅ Architecture Scanner Engine:** Complete file system analysis with origin detection
- **✅ Component Classification System:** Risk assessment and dependency mapping
- **✅ Architecture Documentation:** Comprehensive system mapping and cleanup roadmap

#### 🧪 Selective Test Validation (Tasks 4-6)

- **✅ Test Selection Engine:** Safe test identification and execution
- **✅ Targeted Test Executor:** Pre-validated test runner with failure classification
- **✅ Interface Mismatch Fixes:** Critical test compatibility issues resolved

#### 🗂️ Safe Legacy Component Archival (Tasks 7-9)

- **✅ Legacy Component Detector:** Comprehensive legacy pattern identification
- **✅ Safe Archival System:** Zero-risk archival with instant rollback capability
- **✅ Legacy Component Archival:** 391 components safely archived with on-hold strategy

#### 🛡️ Protection & Governance (Task 10)

- **✅ Branch Protection System:** Git protection with legacy pattern detection
- **✅ Pre-commit Hooks:** Automated legacy code prevention
- **✅ Architecture Compliance:** Continuous compliance monitoring

### 🎯 Current System State

- **Architecture Purity:** 100% Kiro-based active codebase
- **Legacy Components:** 391 components safely archived in `src/archive/consolidated-legacy-archive-2025-09-18/`
- **On-Hold Components:** 125 high-risk components available for restoration
- **Build Performance:** Maintained with improved compilation times
- **Test Coverage:** Validated test suite with 95%+ reliability

### 📁 Archive Management

```bash
# Verify archive isolation (automated in CI/CD)
npm run archive:verify

# Restore specific on-hold component
npm run archive:restore src/components/auth/LoginForm.tsx

# Review on-hold components
npx tsx scripts/run-safe-archival.ts review-onhold

# Emergency rollback (if needed)
npm run archive:rollback
```

### 🔒 Production Safety Features

- **Hard Gates:** Archived components cannot reach production builds
- **CI/CD Integration:** Automated verification prevents archive leaks
- **Emergency Recovery:** One-command rollback capability
- **Compliance Ready:** Complete audit trail and documentation

## 🚀 VOLLGAS Production Implementation

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

---

## 📚 Weitere Informationen

### 🔐 Security & Compliance Documentation

- **[📂 Data Classification](./docs/data-classification.md)** - Comprehensive data classification framework with AI provider guidelines
- **[🤖 LLM Provider Policy](./docs/llm-provider-policy.md)** - Complete LLM provider compliance framework and "no training" guarantees
- **[🛡️ Provider Agreement Compliance](./docs/provider-agreement-compliance.md)** - Technical implementation of provider compliance system
- **[📋 LLM Usage Policy](./docs/llm-usage-policy.md)** - Developer guidelines and mandatory compliance practices
- **[🔒 Security & Privacy](./docs/security-and-privacy.md)** - Overall security framework and privacy compliance

### 🎯 AI & Machine Learning

- **[🤖 AI Orchestrator Documentation](./src/lib/ai-orchestrator/README.md)** - Technical implementation details for AI orchestration
- **[📊 Business Framework Analysis](./docs/task-6-1-competitive-benchmarking-completion-report.md)** - Strategic frameworks integration (SWOT, Porter's, BSC, etc.)
- **[🎯 Goal-Specific Recommendations](./docs/task-6-3-goal-specific-recommendations-completion-report.md)** - AI-powered business recommendations system

### 🏗️ System Architecture

- **[🏛️ Multi-Region Infrastructure](./docs/multi-region-quick-reference.md)** - Enterprise-grade disaster recovery and failover
- **[⚡ Performance Optimization](./docs/10x-load-testing-implementation.md)** - 10x load testing and performance grading
- **[🔄 Cache Optimization](./docs/cache-hit-rate-optimization-completion-report.md)** - Intelligent cache hit rate optimization
- **[📈 Auto-Scaling](./docs/task-10-auto-scaling-infrastructure-completion-report.md)** - Automated infrastructure scaling

### 🔍 Quality Assurance

- **[🧪 Testing Infrastructure](./docs/testing-infrastructure-guide.md)** - Comprehensive testing framework
- **[📋 Quality Assurance](./docs/quality-assurance-system-overview.md)** - Automated QA system and code quality gates
- **[🔒 Security Testing](./docs/task-4-enhanced-security-framework-completion-report.md)** - Advanced security framework and threat detection

### 📊 Monitoring & Analytics

- **[📈 Performance Monitoring](./docs/performance-monitoring-integration-guide.md)** - Real-time performance monitoring system
- **[📊 Business Metrics](./docs/business-metrics-integration-completion-report.md)** - Business intelligence and analytics
- **[🎯 SLO Monitoring](./docs/slo-live-dashboard-experiment-winrate-completion-report.md)** - Service Level Objective monitoring

### 🔧 Development & Operations

- **[🚀 Deployment Automation](./docs/deployment-automation.md)** - Blue-green deployment and automation
- **[🔄 Enhanced Rollback System](./docs/enhanced-rollback-system-documentation.md)** - Comprehensive rollback and recovery procedures
- **[📋 Development Environment](./docs/development-environment-guide.md)** - Development setup and optimization

---

## 📞 Support & Contact

### 🔐 Security & Compliance

- **Security Team:** security@matbakh.app
- **Data Protection Officer:** dpo@matbakh.app
- **AI Compliance Team:** ai-compliance@matbakh.app

### 🚨 Emergency Contacts

- **Security Incidents:** security-emergency@matbakh.app
- **Compliance Violations:** compliance-emergency@matbakh.app
- **System Outages:** ops-emergency@matbakh.app

### 📋 Documentation Updates

- **Documentation Team:** docs@matbakh.app
- **Technical Writing:** tech-docs@matbakh.app

---

**Last Updated:** 2025-01-14  
**Documentation Version:** v2.3.0  
**Compliance Status:** ✅ Enterprise-Ready
