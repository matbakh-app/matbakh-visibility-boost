# Advanced Performance Optimization System - Quick Reference

## 🚀 Schnellstart

### Grundlegende Einrichtung

```typescript
import { PerformanceOptimizationIntegration } from "./performance-optimization-integration";

const integration = new PerformanceOptimizationIntegration();
await integration.start();
```

### Manuelle Optimierung

```typescript
const result = await integration.optimizeNow();
console.log(
  `Verbesserung: ${(result.performanceImprovement * 100).toFixed(1)}%`
);
```

### Health Status prüfen

```typescript
const health = await integration.getHealthStatus();
console.log(`System gesund: ${health.isHealthy}`);
console.log(
  `Performance Score: ${(health.performanceScore * 100).toFixed(1)}%`
);
```

## ⚙️ Konfiguration

### Standard-Parameter

| Parameter                | Standard | Beschreibung                        |
| ------------------------ | -------- | ----------------------------------- |
| `enableAutoOptimization` | `true`   | Automatische Optimierung aktivieren |
| `optimizationInterval`   | `5`      | Intervall in Minuten                |
| `cpuWarning`             | `70`     | CPU-Warnschwelle (%)                |
| `cpuCritical`            | `85`     | CPU-kritische Schwelle (%)          |
| `memoryWarning`          | `75`     | Memory-Warnschwelle (%)             |
| `memoryCritical`         | `90`     | Memory-kritische Schwelle (%)       |
| `responseTimeWarning`    | `300`    | Response Time Warnung (ms)          |
| `responseTimeCritical`   | `500`    | Response Time kritisch (ms)         |
| `rollbackThreshold`      | `0.1`    | Rollback bei 10% Verschlechterung   |

### Konfiguration anpassen

```typescript
integration.updateConfig({
  optimizationInterval: 3, // 3 Minuten
  performanceThresholds: {
    cpuWarning: 60,
    responseTimeWarning: 250,
  },
});
```

## 📊 Performance-Metriken

### Zielwerte

- **Response Time**: ≤ 200ms
- **Durchsatz**: ≥ 1000 req/s
- **Fehlerrate**: ≤ 1%
- **CPU-Auslastung**: ≤ 70%
- **Memory-Auslastung**: ≤ 80%

### Kritische Schwellen

- **CPU**: > 85%
- **Memory**: > 90%
- **Response Time**: > 500ms
- **Fehlerrate**: > 5%

## 🎯 Optimierungsstrategien

### 1. Emergency Scale Up

- **Auslöser**: CPU > 90%, Memory > 95%, Fehlerrate > 5%
- **Aktion**: Sofortige 2x Skalierung
- **Risiko**: Mittel

### 2. Proactive Resource Optimization

- **Auslöser**: CPU > 70%, Memory > 80%
- **Aktion**: Ressourcen-Neubalancierung + Cache-Optimierung
- **Risiko**: Niedrig

### 3. Response Time Optimization

- **Auslöser**: Response Time > 300ms
- **Aktion**: Routing-Optimierung + aggressive Cache-Optimierung
- **Risiko**: Niedrig-Mittel

### 4. Throughput Enhancement

- **Auslöser**: Durchsatz < 800 req/s
- **Aktion**: Graduelle 1.5x Skalierung
- **Risiko**: Niedrig

### 5. Efficiency Optimization

- **Auslöser**: CPU < 30%, Memory < 40%
- **Aktion**: 0.8x Herunterskalierung
- **Risiko**: Niedrig

## 🔧 Häufige Kommandos

### Aktuelle Metriken abrufen

```typescript
const metrics = await integration.getCurrentMetrics();
console.log(`CPU: ${metrics.cpuUsage}%`);
console.log(`Memory: ${metrics.memoryUsage}%`);
console.log(`Response Time: ${metrics.responseTime}ms`);
```

### Empfehlungen erhalten

```typescript
const recommendations = await integration.getRecommendations();
recommendations.forEach((rec) => console.log(`💡 ${rec}`));
```

### Optimierungshistorie anzeigen

```typescript
const history = integration.getOptimizationHistory();
console.log(`Letzte ${history.length} Optimierungen:`);
history.slice(-5).forEach((opt) => {
  console.log(
    `${opt.success ? "✅" : "❌"} ${opt.optimizationsApplied} Aktionen`
  );
});
```

### Performance-Daten exportieren

```typescript
const data = integration.exportPerformanceData();
console.log("Export erstellt:", data.exportTimestamp);
```

## 🔄 Rollback-Aktionen

| Original             | Rollback           |
| -------------------- | ------------------ |
| `scale_up`           | `scale_down`       |
| `scale_down`         | `scale_up`         |
| `cache_optimize`     | `cache_reset`      |
| `route_optimize`     | `route_reset`      |
| `resource_rebalance` | `resource_restore` |

## 🚨 Troubleshooting

### Problem: Optimierung schlägt fehl

```typescript
// 1. Health Status prüfen
const health = await integration.getHealthStatus();
console.log("System Health:", health.systemHealth);

// 2. Aktuelle Metriken analysieren
const metrics = await integration.getCurrentMetrics();
console.log("Metriken:", metrics);

// 3. Konfiguration überprüfen
const config = integration.getConfig();
console.log("Konfiguration:", config);
```

### Problem: Häufige Rollbacks

```typescript
// Rollback-Schwelle erhöhen
integration.updateConfig({
  rollbackSettings: {
    rollbackThreshold: 0.15, // 15% statt 10%
    maxRollbackAttempts: 5,
  },
});
```

### Problem: Performance verschlechtert sich

```typescript
// 1. Manuelle Optimierung versuchen
const result = await integration.optimizeNow();

// 2. Bei Fehlschlag: System neu starten
await integration.stop();
await integration.start();

// 3. Konfiguration zurücksetzen
integration.updateConfig({
  performanceThresholds: {
    cpuWarning: 70,
    cpuCritical: 85,
    memoryWarning: 75,
    memoryCritical: 90,
  },
});
```

## 📈 Monitoring-Setup

### Kontinuierliches Health-Monitoring

```typescript
setInterval(async () => {
  const health = await integration.getHealthStatus();
  if (!health.isHealthy) {
    console.warn("🚨 Performance-Problem erkannt!");
    // Automatische Optimierung auslösen
    try {
      const result = await integration.optimizeNow();
      console.log("✅ Optimierung durchgeführt");
    } catch (error) {
      console.error("❌ Optimierung fehlgeschlagen:", error);
    }
  }
}, 60000); // Jede Minute
```

### Performance-Alerting

```typescript
const checkPerformance = async () => {
  const metrics = await integration.getCurrentMetrics();

  // CPU-Alert
  if (metrics.cpuUsage > 85) {
    console.warn(`🔥 CPU kritisch: ${metrics.cpuUsage}%`);
  }

  // Memory-Alert
  if (metrics.memoryUsage > 90) {
    console.warn(`💾 Memory kritisch: ${metrics.memoryUsage}%`);
  }

  // Response Time Alert
  if (metrics.responseTime > 500) {
    console.warn(`⏱️ Response Time kritisch: ${metrics.responseTime}ms`);
  }
};
```

## 🔗 Integration mit anderen Systemen

### Bedrock Support Manager

```typescript
// Automatische Integration - keine zusätzliche Konfiguration erforderlich
const integration = new PerformanceOptimizationIntegration(
  undefined, // SystemResourceMonitor
  undefined, // AutoResolutionOptimizer
  undefined, // PerformanceRollbackManager
  bedrockSupportManager, // Wird automatisch integriert
  intelligentRouter // Wird automatisch integriert
);
```

### Custom Resource Monitor

```typescript
const customResourceMonitor = new SystemResourceMonitor();
const integration = new PerformanceOptimizationIntegration(
  customResourceMonitor
);
```

## ✅ Checkliste für Produktionsumgebung

- [ ] Konfiguration an Produktionsanforderungen angepasst
- [ ] Monitoring und Alerting eingerichtet
- [ ] Rollback-Schwellenwerte getestet
- [ ] Performance-Baselines etabliert
- [ ] Zugriffskontrolle konfiguriert
- [ ] Backup-Strategien implementiert
- [ ] Dokumentation aktualisiert
- [ ] Team-Training durchgeführt

## 📞 Support

Bei Problemen:

1. Health Status und Metriken prüfen
2. Konfiguration validieren
3. Logs analysieren
4. Rollback-Historie überprüfen
5. System-Integration testen

---

**Status**: ✅ Production-Ready  
**Tests**: 38/38 bestanden  
**Dokumentation**: Vollständig verfügbar
