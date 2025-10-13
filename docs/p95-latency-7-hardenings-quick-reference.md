# P95 Latency Engine - 7 Härtungen Quick Reference

**Version**: 1.0  
**Datum**: 2025-09-28  
**Zielgruppe**: Entwickler, DevOps, SRE

## 🚀 Übersicht

Schnellreferenz für die 7 punktgenauen Härtungen der P95 Latency Engine. Alle Komponenten sind production-ready und vollständig integriert.

## 📊 1. Streaming Percentile Engine

**Datei**: `src/lib/ai-orchestrator/streaming-percentile-engine.ts`

### Verwendung

```typescript
import { streamingPercentileEngine } from "@/lib/ai-orchestrator/streaming-percentile-engine";

// Metrik hinzufügen
streamingPercentileEngine.addMetric({
  timestamp: Date.now(),
  value: latencyMs,
  operation: "generation", // 'generation' | 'rag' | 'cached'
  provider: "bedrock", // 'bedrock' | 'google' | 'meta'
  role: "orchestrator", // 'orchestrator' | 'user-worker' | 'audience-specialist'
});

// P95 abrufen
const p95 = streamingPercentileEngine.getP95(
  "generation",
  "bedrock",
  "orchestrator"
);
const p99 = streamingPercentileEngine.getP99("generation");
```

### Konfiguration

- **Sliding Window**: 30 Minuten (konfigurierbar)
- **Max Centroids**: 1000 (t-digest Kompression)
- **Cleanup Interval**: 5 Minuten

### Targets

- Generation P95: ≤ 1500ms
- RAG P95: ≤ 300ms
- Cached P95: ≤ 300ms

## 🔥 2. SLO Burn Rate Monitor

**Datei**: `src/lib/ai-orchestrator/slo-burn-rate-monitor.ts`

### Verwendung

```typescript
import { sloBurnRateMonitor } from "@/lib/ai-orchestrator/slo-burn-rate-monitor";

// SLI aufzeichnen
sloBurnRateMonitor.recordSLI("generation", "bedrock", "user-worker", latencyMs);

// Burn Rate prüfen
const burnRate5m = sloBurnRateMonitor.getBurnRate("generation", 5 * 60 * 1000);
const burnRate1h = sloBurnRateMonitor.getBurnRate("generation", 60 * 60 * 1000);

// SLO Status
const sloStatus = sloBurnRateMonitor.getSLOStatus();
const isViolated = sloBurnRateMonitor.isSLOViolated("generation", "bedrock");
```

### Alert Thresholds

- **Critical**: Burn Rate > 14.4x (Budget exhausted in 2h)
- **Warning**: Burn Rate > 6.0x (Budget exhausted in 5h)
- **Dual Windows**: 5min + 1h (Anti-Flapping)

### SLO Targets

- Good Ratio: ≥ 95%
- Good Definition: latency ≤ target

## 💾 3. Cache Eligibility Tracker

**Datei**: `src/lib/ai-orchestrator/cache-eligibility-tracker.ts`

### Verwendung

```typescript
import { cacheEligibilityTracker } from "@/lib/ai-orchestrator/cache-eligibility-tracker";

// Request aufzeichnen
const request = cacheEligibilityTracker.recordRequest(
  "req-123",
  "What is the weather?",
  { domain: "general" },
  null, // tools
  "generation"
);

// Cache Result aufzeichnen
cacheEligibilityTracker.recordCacheResult("req-123", "hit", "bedrock", 250);

// Stratifizierte Analyse
const stratification = cacheEligibilityTracker.getCacheStratification(10);
console.log(`Top-K Hit Rate: ${stratification.topK.hitRate}%`);
console.log(`Long-Tail Hit Rate: ${stratification.longTail.hitRate}%`);
```

### Eligibility Rules

- ❌ Prompt < 10 Zeichen
- ❌ Time-sensitive Content (today, now, current)
- ❌ User-specific Context (userId, sessionId)
- ❌ Side-effect Tools (create, update, delete)
- ✅ Deterministic Prompts ohne obige Eigenschaften

### Target

- Eligible Hit Rate: ≥ 80%

## 🤖 4. Adaptive Router Autopilot

**Datei**: `src/lib/ai-orchestrator/adaptive-router-autopilot.ts`

### Verwendung

```typescript
import { adaptiveRouterAutopilot } from "@/lib/ai-orchestrator/adaptive-router-autopilot";

// Provider Weight prüfen
const weight = adaptiveRouterAutopilot.getProviderWeight("bedrock");

// Context Optimization prüfen
const optimization = adaptiveRouterAutopilot.getContextOptimization(
  "generation",
  "bedrock"
);

// Stale-While-Revalidate prüfen
const useStale = adaptiveRouterAutopilot.shouldUseStaleWhileRevalidate(
  "generation",
  "bedrock"
);

// Autopilot Status
const status = adaptiveRouterAutopilot.getAutopilotStatus();
```

### Automatic Actions bei P95-Drift

1. **Weight Adjustment**: 30% (critical) / 70% (warning)
2. **Fallback Models**: claude-3-haiku, gemini-pro
3. **Context Optimization**: Max length, temperature reduction
4. **Stale-While-Revalidate**: Serve cached während revalidation

### Trigger

- P95 > Target für 3-5 Minuten

## 🛡️ 5. Bedrock Guardrails

**Integration**: `src/lib/ai-orchestrator/ai-router-gateway.ts`

### Task Types & Routing

```typescript
// System Tasks → Bedrock direkt
if (taskType === "system") {
  return ["bedrock", "google", "meta"];
}

// User Tasks → Google primär
if (taskType === "user") {
  return ["google", "meta", "bedrock"];
}

// Audience Tasks → Meta primär
if (taskType === "audience") {
  return ["meta", "google", "bedrock"];
}
```

### Delegation Logic

```typescript
// Bedrock delegiert User/Audience Tasks
if (taskType !== "system" && provider === "bedrock") {
  return await delegateToWorker(request, ["google", "meta"]);
}
```

### Telemetry Roles

- **System Tasks**: `role=orchestrator`
- **User Tasks**: `role=user-worker`
- **Audience Tasks**: `role=audience-specialist`

## 📈 6. Telemetry Collector

**Datei**: `src/lib/ai-orchestrator/telemetry-collector.ts`

### Verwendung

```typescript
import { telemetryCollector } from "@/lib/ai-orchestrator/telemetry-collector";

// Latency aufzeichnen
telemetryCollector.recordLatency("bedrock", 1200, {
  operation: "generation",
  role: "orchestrator",
  requestId: "req-123",
  modelId: "claude-3-sonnet",
  toolsUsed: true,
  cacheEligible: false,
  tokenCounts: { prompt: 100, output: 50, total: 150 },
  region: "us-east-1",
});

// CloudWatch Export
const metrics = telemetryCollector.exportForCloudWatch();
```

### Low-Cardinality Dimensions

- **provider**: bedrock, google, meta, unknown
- **intent**: generation, rag_cached
- **role**: orchestrator, user-worker, audience-specialist
- **region**: us-east-1, us-west-2, eu-west-1, ap-southeast-1
- **tools_used**: boolean
- **cache_eligible**: boolean
- **model_family**: claude-3, gemini-pro, llama-2, unknown

### Cardinality Limits

- Jede Dimension: ≤ 10 unique values
- Automatic sanitization zu 'unknown'

## ⚡ 7. Load & Failover Tester

**Datei**: `src/lib/ai-orchestrator/load-failover-testing.ts`

### Verwendung

```typescript
import { loadFailoverTester } from "@/lib/ai-orchestrator/load-failover-testing";

// Load Test ausführen
const result = await loadFailoverTester.runLoadTest("burst");
console.log(`P95: ${result.p95Latency}ms, Error Rate: ${result.errorRate}%`);

// Failover Test
const failoverResult = await loadFailoverTester.runFailoverTest(
  "manual",
  "eu-west-1"
);
console.log(`Failover Duration: ${failoverResult.failoverDuration}ms`);

// Verfügbare Szenarien
const scenarios = loadFailoverTester.getAvailableScenarios();
```

### Test Scenarios

- **baseline**: 10 RPS, 5 min
- **burst**: 50 RPS mit 3x bursts (150 RPS peaks), 10 min
- **sustained**: 100 RPS, 30 min
- **cacheEviction**: 30 RPS mit 80% cache eviction, 15 min
- **multiRegion**: 75 RPS über mehrere Regionen, 10 min

### Failover Types

- **manual**: Manueller Failover-Trigger
- **health_check**: Health Check Failure Simulation
- **p95_breach**: P95 Breach Simulation

## 🔧 CLI Commands

### Test Script ausführen

```bash
# Alle 7 Härtungen testen
npx tsx scripts/test-p95-latency-targets.ts

# Spezifische Tests
TEST_SCENARIO=streaming-percentile npx tsx scripts/test-p95-latency-targets.ts
TEST_SCENARIO=slo-burn-rate npx tsx scripts/test-p95-latency-targets.ts
```

### GitHub Workflow

```bash
# Lokale Validation
gh workflow run p95-latency-validation.yml

# Mit spezifischem Szenario
gh workflow run p95-latency-validation.yml -f test_scenario=cache-hit-rate
```

## 📊 Dashboard Integration

### React Component

```typescript
import { P95LatencyDashboard } from "@/components/ai/P95LatencyDashboard";

// In App verwenden
<P95LatencyDashboard />;
```

### Dashboard Tabs

- **Overview**: Gesamtstatus und Trends
- **P95 Metrics**: Detaillierte P95-Metriken pro Provider
- **SLO Status**: SLO Compliance und Burn Rates
- **Cache Analysis**: Stratifizierte Cache Hit Rates
- **Autopilot**: Aktive Optimierungen und Actions

## 🚨 Monitoring & Alerts

### CloudWatch Metriken

```bash
# P95 Latency
aws cloudwatch get-metric-statistics \
  --namespace "AI/Orchestrator" \
  --metric-name "ai.latency" \
  --dimensions Name=provider,Value=bedrock Name=intent,Value=generation \
  --statistic Maximum \
  --start-time 2025-09-28T00:00:00Z \
  --end-time 2025-09-28T23:59:59Z \
  --period 300
```

### Alert Conditions

```yaml
# Critical Alerts
- P95 > 3000ms (2x target)
- Burn Rate > 14.4x
- Error Rate > 5%

# Warning Alerts
- P95 > 2250ms (1.5x target)
- Burn Rate > 6.0x
- Cache Hit Rate < 60%
```

## 🔍 Troubleshooting

### High P95 Latency

```bash
# 1. Check provider-specific P95
curl -s "https://api.matbakh.app/metrics/p95?provider=bedrock&operation=generation"

# 2. Check autopilot actions
curl -s "https://api.matbakh.app/autopilot/status" | jq '.recentActions'

# 3. Check cache hit rates
curl -s "https://api.matbakh.app/metrics/cache" | jq '.stratification'
```

### SLO Violations

```bash
# 1. Check burn rates
curl -s "https://api.matbakh.app/metrics/slo" | jq '.[] | select(.isViolated == true)'

# 2. Check error budget
curl -s "https://api.matbakh.app/metrics/slo" | jq '.[] | .errorBudgetRemaining'

# 3. Check maintenance windows
curl -s "https://api.matbakh.app/maintenance/status"
```

### Cache Performance Issues

```bash
# 1. Check eligibility stats
curl -s "https://api.matbakh.app/metrics/cache/eligibility"

# 2. Check stratified hit rates
curl -s "https://api.matbakh.app/metrics/cache/stratification"

# 3. Check recent cache operations
curl -s "https://api.matbakh.app/metrics/cache/operations?limit=100"
```

## 📋 DoD Checklist

### Vor Production Deployment

- [ ] Alle 7 Härtungen getestet und validiert
- [ ] P95 Targets in allen Szenarien erfüllt
- [ ] SLO Burn Rate Alerts konfiguriert
- [ ] Cache Hit Rate ≥ 80% erreicht
- [ ] Autopilot Actions funktional
- [ ] Bedrock Guardrails aktiv
- [ ] Telemetry CloudWatch Integration
- [ ] Load Tests erfolgreich
- [ ] Dashboard deployment
- [ ] Runbooks dokumentiert

### Nach Production Deployment

- [ ] Real-traffic Validation
- [ ] Alert Tuning basierend auf Production-Daten
- [ ] Performance Baseline etabliert
- [ ] Team Training abgeschlossen
- [ ] Incident Response Procedures getestet

## 🔗 Referenzen

- **Implementation Guide**: `docs/p95-latency-targets-implementation.md`
- **Completion Report**: `docs/p95-latency-7-hardenings-completion-report.md`
- **AI Provider Architecture**: `docs/ai-provider-architecture-comprehensive-guide.md`
- **GitHub Workflow**: `.github/workflows/p95-latency-validation.yml`
- **Test Script**: `scripts/test-p95-latency-targets.ts`

---

**Status**: ✅ Production-Ready  
**Maintenance**: Automated mit Manual Override  
**Support**: ai-orchestration-team@matbakh.app
