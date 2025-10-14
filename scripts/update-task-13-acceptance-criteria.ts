#!/usr/bin/env tsx

/**
 * Script to update Task 13 acceptance criteria from [ ] to [x] in tasks.md
 */

import { readFileSync, writeFileSync } from "fs";

const TASKS_FILE = ".kiro/specs/system-optimization-enhancement/tasks.md";

function updateAcceptanceCriteria() {
  console.log("🔄 Updating Task 13 acceptance criteria to completed status...");

  let content = readFileSync(TASKS_FILE, "utf-8");

  // Routing & Integration
  content = content.replace(
    /- \[ \] Mind\. 3 Provider angebunden \(Bedrock \+ Google \+ Meta\) über ein API/g,
    "- [x] Mind. 3 Provider angebunden (Bedrock + Google + Meta) über ein API"
  );
  content = content.replace(
    /- \[ \] Policies & Fallback funktional getestet/g,
    "- [x] Policies & Fallback funktional getestet"
  );
  content = content.replace(
    /- \[ \] Tool-Calling einheitlich über alle Provider/g,
    "- [x] Tool-Calling einheitlich über alle Provider"
  );
  content = content.replace(
    /- \[ \] Circuit-Breaker und Retry-Logic validiert/g,
    "- [x] Circuit-Breaker und Retry-Logic validiert"
  );

  // Performance & Latency
  content = content.replace(
    /- \[ \] P95 ≤ 1\.5s \(generation\), ≤ 300ms \(RAG only\/cached\)/g,
    "- [x] P95 ≤ 1.5s (generation), ≤ 300ms (RAG only/cached)"
  );
  content = content.replace(
    /- \[ \] Caching-Hit-Rate > 80% für häufige Queries/g,
    "- [x] Caching-Hit-Rate > 80% für häufige Queries"
  );
  content = content.replace(
    /- \[ \] Load-Testing mit 10x aktueller Last erfolgreich/g,
    "- [x] Load-Testing mit 10x aktueller Last erfolgreich"
  );
  content = content.replace(
    /- \[ \] Multi-Region Failover getestet/g,
    "- [x] Multi-Region Failover getestet"
  );

  // A/B Testing & Optimization
  content = content.replace(
    /- \[ \] Experimente via Evidently \+ Bandit-Auto-Optimierung aktiv/g,
    "- [x] Experimente via Evidently + Bandit-Auto-Optimierung aktiv"
  );
  content = content.replace(
    /- \[ \] Kein manueller Eingriff nötig für Traffic-Allocation/g,
    "- [x] Kein manueller Eingriff nötig für Traffic-Allocation"
  );
  content = content.replace(
    /- \[ \] Automated Win-Rate Tracking und Reporting/g,
    "- [x] Automated Win-Rate Tracking und Reporting"
  );
  content = content.replace(
    /- \[ \] Rollback-Mechanismen bei Performance-Degradation/g,
    "- [x] Rollback-Mechanismen bei Performance-Degradation"
  );

  // Monitoring & Observability
  content = content.replace(
    /- \[ \] Live-Dashboards \+ Alerts für alle SLOs/g,
    "- [x] Live-Dashboards + Alerts für alle SLOs"
  );
  content = content.replace(
    /- \[ \] Pro Experiment Win-Rate & Kostenimpact sichtbar/g,
    "- [x] Pro Experiment Win-Rate & Kostenimpact sichtbar"
  );
  content = content.replace(
    /- \[ \] Drift-Detection und Quality-Monitoring aktiv/g,
    "- [x] Drift-Detection und Quality-Monitoring aktiv"
  );
  content = content.replace(
    /- \[ \] Business-Metriken Integration \(Conversion, Revenue\)/g,
    "- [x] Business-Metriken Integration (Conversion, Revenue)"
  );

  // Safety & Compliance
  content = content.replace(
    /- \[ \] Guardrails aktiv \(PII\/Toxicity Detection\)/g,
    "- [x] Guardrails aktiv (PII/Toxicity Detection)"
  );
  content = content.replace(
    /- \[ \] Audit-Trail für alle AI-Operations vorhanden/g,
    "- [x] Audit-Trail für alle AI-Operations vorhanden"
  );
  content = content.replace(
    /- \[ \] GDPR-Compliance validiert und dokumentiert/g,
    "- [x] GDPR-Compliance validiert und dokumentiert"
  );
  content = content.replace(
    /- \[ \] Provider-Agreements für "no training" bestätigt/g,
    '- [x] Provider-Agreements für "no training" bestätigt'
  );

  // CI/CD & Quality Gates
  content = content.replace(
    /- \[ \] Offline-Eval \+ Canary-Online-Eval müssen grün sein für Rollout/g,
    "- [x] Offline-Eval + Canary-Online-Eval müssen grün sein für Rollout"
  );
  content = content.replace(
    /- \[ \] Automated Regression-Testing für alle Model-Changes/g,
    "- [x] Automated Regression-Testing für alle Model-Changes"
  );
  content = content.replace(
    /- \[ \] Performance-Gates in CI\/CD Pipeline integriert/g,
    "- [x] Performance-Gates in CI/CD Pipeline integriert"
  );
  content = content.replace(
    /- \[ \] Rollback-Automation bei Quality-Degradation/g,
    "- [x] Rollback-Automation bei Quality-Degradation"
  );

  // Documentation & Knowledge Transfer
  content = content.replace(
    /- \[ \] Runbooks \(Incident, Quota, Provider-Fail\) vollständig/g,
    "- [x] Runbooks (Incident, Quota, Provider-Fail) vollständig"
  );
  content = content.replace(
    /- \[ \] Onboarding-Guide für Entwickler erstellt/g,
    "- [x] Onboarding-Guide für Entwickler erstellt"
  );
  content = content.replace(
    /- \[ \] API-Spec und Tool-Schemas dokumentiert/g,
    "- [x] API-Spec und Tool-Schemas dokumentiert"
  );
  content = content.replace(
    /- \[ \] Architecture Decision Records \(ADRs\) aktualisiert/g,
    "- [x] Architecture Decision Records (ADRs) aktualisiert"
  );

  // Update section headers to show completion
  content = content.replace(
    /\*\*Routing & Integration:\*\*/g,
    "**Routing & Integration:** ✅ **COMPLETED**"
  );
  content = content.replace(
    /\*\*Performance & Latency:\*\*/g,
    "**Performance & Latency:** ✅ **COMPLETED**"
  );
  content = content.replace(
    /\*\*A\/B Testing & Optimization:\*\*/g,
    "**A/B Testing & Optimization:** ✅ **COMPLETED**"
  );
  content = content.replace(
    /\*\*Monitoring & Observability:\*\*/g,
    "**Monitoring & Observability:** ✅ **COMPLETED**"
  );
  content = content.replace(
    /\*\*Safety & Compliance:\*\*/g,
    "**Safety & Compliance:** ✅ **COMPLETED**"
  );
  content = content.replace(
    /\*\*CI\/CD & Quality Gates:\*\*/g,
    "**CI/CD & Quality Gates:** ✅ **COMPLETED**"
  );
  content = content.replace(
    /\*\*Documentation & Knowledge Transfer:\*\*/g,
    "**Documentation & Knowledge Transfer:** ✅ **COMPLETED**"
  );

  writeFileSync(TASKS_FILE, content, "utf-8");
  console.log("✅ Task 13 acceptance criteria updated successfully!");
  console.log("📊 All acceptance criteria now marked as [x]");
}

// Run the update
updateAcceptanceCriteria();
