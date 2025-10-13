# Task 6: Performance Testing Suite - Verification TODO

**Status:** 📋 PLANNED  
**Priority:** P1 (Critical for Task 6 completion)  
**Execution:** Hybrid (Basic tests now, Full suite during Tasks 7-12)

## 🎯 Akzeptanzkriterien (Pass/Fail)

### A. Performance KPIs
- [ ] **API Latenz**: P95 < 200ms, P99 < 500ms
- [ ] **Fehlerrate**: < 1% (HTTP 5xx/4xx je Szenario)
- [ ] **Durchsatz-Stabilität**: kein negativer Trend > 10% über 10 Min (Endurance)
- [ ] **Regression Detector**: schlägt an bei ≥ 10% P95-Verschlechterung oder Fehlerrate ≥ 1%
- [ ] **Reports**: JSON + Markdown in qa-reports/ pro Lauf, zusammengefasster perf-summary*.md

## 🚀 Phase 1: Basic Validation (JETZT - vor Task 7)

### 1.1 Unit Tests ausführen
```bash
# Performance Testing Unit Tests
npm test -- --testPathPattern="performance-testing" --verbose
```
- [ ] Performance Orchestrator Tests
- [ ] Load Tester Mock Tests
- [ ] Regression Detector Tests
- [ ] Benchmark Comparator Tests

### 1.2 Basic Integration Test
```bash
# Quick smoke test der Performance Testing API
npm run test:performance:basic
```
- [ ] Performance Hook funktioniert
- [ ] Dashboard rendert ohne Fehler
- [ ] Mock Load Test läuft durch

### 1.3 Green Core Validation Update
```bash
# Erweiterte GCV Tests mit Performance Testing
npm run test:green-core
```
- [ ] Alle bestehenden Core Tests bestehen
- [ ] Performance Testing Integration funktioniert
- [ ] Keine Regressionen in anderen Systemen

## 🔧 Phase 2: Lokaler Smoke-Run (Tasks 7-9)

### 2.1 Services Setup
```bash
# Terminal A
npm run qa:server            # QA-API (port 3001)
# Terminal B  
npm run preview              # oder: npm run dev
```

### 2.2 Schneller Validierungs-Lauf (Load + Spike)
```bash
# Orchestrator (falls vorhanden)
npm run perf:quick           # alias: runQuickPerf (Load+Spike, 2–3 Min)

# Fall-Back: direkt mit Artillery
npx artillery run performance/scenarios/load.yml -o qa-reports/perf-load.json
npx artillery run performance/scenarios/spike.yml -o qa-reports/perf-spike.json
```

### 2.3 Reports prüfen
```bash
npm run perf:summary         # erstellt qa-reports/perf-summary-*.md
```
- [ ] Pass, wenn alle KPIs unter A eingehalten werden
- [ ] perf-summary meldet „passed"

## 📊 Phase 3: Vollsuite (Tasks 10-12)

### 3.1 Baseline erzeugen
```bash
npx artillery run performance/scenarios/baseline.yml -o qa-reports/perf-baseline.json
```

### 3.2 Hauptläufe
```bash
npx artillery run performance/scenarios/load.yml -o qa-reports/perf-load.json
npx artillery run performance/scenarios/stress.yml -o qa-reports/perf-stress.json
npx artillery run performance/scenarios/endurance.yml -o qa-reports/perf-endurance.json
npx artillery run performance/scenarios/volume.yml -o qa-reports/perf-volume.json
```

### 3.3 Regression-Check
```bash
# Falls ein Script existiert:
npm run perf:regress -- \
  --baseline qa-reports/perf-baseline.json \
  --current qa-reports/perf-load.json \
  --thresholds config/perf-thresholds.json

# Fall-Back: Direktaufruf
node src/lib/performance-testing/regression-detector.js \
  --baseline qa-reports/perf-baseline.json \
  --current qa-reports/perf-load.json \
  --thresholds config/perf-thresholds.json
```

### 3.4 Benchmark-Vergleich
```bash
node src/lib/performance-testing/benchmark-comparator.js \
  --input qa-reports/perf-load.json \
  --industry restaurant,saas \
  --out qa-reports/perf-benchmark.md
```

## 🎯 Phase 4: CI-Integration (Tasks 13-15)

### 4.1 Artillery Szenarien erstellen
- [ ] `performance/scenarios/load.yml`
- [ ] `performance/scenarios/stress.yml`
- [ ] `performance/scenarios/spike.yml`
- [ ] `performance/scenarios/endurance.yml`
- [ ] `performance/scenarios/baseline.yml`

### 4.2 GitHub Actions Workflow
- [ ] `.github/workflows/performance-suite.yml`
- [ ] Artifact Upload für Reports
- [ ] Performance Gates Integration
- [ ] Failure Notifications

### 4.3 NPM Scripts hinzufügen
```json
{
  "scripts": {
    "perf:quick": "node scripts/run-quick-performance-test.js",
    "perf:summary": "node scripts/generate-performance-summary.js",
    "perf:regress": "node src/lib/performance-testing/regression-detector.js",
    "test:performance:basic": "jest --testPathPattern='performance-testing' --testNamePattern='basic|smoke'"
  }
}
```

## 📁 Phase 5: Fehlende Dateien erstellen (Tasks 16-18)

### 5.1 Artillery Konfigurationen
- [ ] `performance/scenarios/load.yml`
- [ ] `performance/scenarios/stress.yml`
- [ ] `performance/scenarios/spike.yml`
- [ ] `performance/scenarios/endurance.yml`
- [ ] `performance/scenarios/baseline.yml`

### 5.2 CLI Scripts
- [ ] `scripts/run-quick-performance-test.js`
- [ ] `scripts/generate-performance-summary.js`
- [ ] CLI-fähige Versionen der Performance Testing Module

### 5.3 Konfigurationsdateien
- [ ] `config/perf-thresholds.json`
- [ ] `performance/config/artillery-defaults.yml`

## ✅ Phase 6: Finale Validierung (Tasks 19-21)

### 6.1 Owner Checkliste
- [ ] qa-reports/perf-*.json|md existieren & KPI-Werte im grünen Bereich
- [ ] Regression-Detector Status = passed
- [ ] Benchmark-Report zeigt keine roten Ausreißer ggü. „Restaurant/SaaS"
- [ ] CI-Job Performance Suite grün, Artefakte am PR sichtbar

### 6.2 Dokumentation
- [ ] Performance Testing User Guide
- [ ] Troubleshooting Guide für Performance Issues
- [ ] Best Practices für Performance Testing
- [ ] Integration Guide für CI/CD

## 🔄 Execution Strategy

### Immediate (vor Task 7)
- ✅ Phase 1: Basic Validation
- ✅ Green Core Validation Update

### During Tasks 7-9 (Development Environment)
- 📋 Phase 2: Lokaler Smoke-Run
- 📋 Artillery Szenarien erstellen

### During Tasks 10-12 (Scalability)
- 📋 Phase 3: Vollsuite
- 📋 Performance Baseline etablieren

### During Tasks 13-15 (AI Integration)
- 📋 Phase 4: CI-Integration
- 📋 Automated Performance Gates

### During Tasks 16-18 (Validation)
- 📋 Phase 5: Fehlende Dateien
- 📋 CLI Tools finalisieren

### During Tasks 19-21 (Monitoring)
- 📋 Phase 6: Finale Validierung
- 📋 Production Readiness Check

---

**Nächster Schritt:** Phase 1 Basic Validation ausführen, dann Task 7 starten