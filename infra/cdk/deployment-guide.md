# Metrics Ingest Stack - Deployment Guide

## 🚀 Deployment

### 1. CDK Stack deployen

```bash
cd infra/cdk
npm install
npm run build
cdk deploy
```

### 2. Frontend-Konfiguration

Nach erfolgreichem `cdk deploy` erhältst du die Ausgabe `MetricsEndpoint`. Setze dann die Environment Variables:

```bash
# .env oder .env.local
VITE_METRICS_ENDPOINT=<API_URL_FROM_OUTPUT>
VITE_ENABLE_METRICS=true
VITE_METRICS_SAMPLE_RATE=0.25
VITE_APP_VERSION=1.0.0
```

**Beispiel:**
```bash
VITE_METRICS_ENDPOINT=https://abc123def.execute-api.eu-central-1.amazonaws.com/metrics
VITE_ENABLE_METRICS=true
VITE_METRICS_SAMPLE_RATE=0.25
VITE_APP_VERSION=1.0.0
```

### 3. Konfiguration per CDK Context

```bash
# Deployment mit Custom-Konfiguration
cdk deploy -c metricsNs="MyApp/Performance" -c corsOrigin="https://myapp.com" -c logLevel="debug"
```

## 🔧 Konfigurationsoptionen

### CDK Context Parameter

| Parameter | Default | Beschreibung |
|-----------|---------|--------------|
| `metricsNs` | `Matbakh/Web` | CloudWatch Namespace |
| `corsOrigin` | `*` | CORS Origin (Sicherheit) |
| `logLevel` | `info` | Log Level (debug/info/warn/error) |

### Frontend Environment Variables

| Variable | Default | Beschreibung |
|----------|---------|--------------|
| `VITE_METRICS_ENDPOINT` | - | API Endpoint (von CDK Output) |
| `VITE_ENABLE_METRICS` | `false` | Metrics aktivieren |
| `VITE_METRICS_SAMPLE_RATE` | `1.0` | Sampling Rate (0.0-1.0) |
| `VITE_APP_VERSION` | `0.0.0` | App Version für Dimensionen |

## 🔒 Sicherheit, Kosten & Reliability

### ✅ Sicherheitsfeatures

#### **Minimale IAM-Berechtigung**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "cloudwatch:PutMetricData",
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "cloudwatch:namespace": ["Matbakh/Web"]
        }
      }
    }
  ]
}
```

#### **CORS-Konfiguration**
- Via CDK parametrisierbar (`corsOrigin` Context)
- Produktionsumgebung: Spezifische Domain setzen
- Entwicklung: `*` für lokale Tests

#### **PII-Shield**
- **SessionId wird gehasht**: `sha16()` für Anonymisierung
- **Dimensions Allow-List**: Nur erlaubte Felder werden übertragen
- **Werte-Begrenzung**: Max 128 Zeichen pro Dimension

```typescript
const ALLOWED = new Set([
  "Env","AppVersion","Page","DeviceType","ConnectionType","Rating",
  "Bucket","UploadType","ErrorType","QuotaType","SessionId","Metric",
  "Severity","Type","Success"
]);
```

### 💰 Kostenoptimierung

#### **CloudWatch Kosten minimiert**
- **60s Auflösung**: Standard Resolution (günstiger als High Resolution)
- **≤8 Dimensionen**: CloudWatch Limit eingehalten
- **Batch 20**: Maximale Batch-Größe für PutMetricData
- **Sampling**: Konfigurierbare Sample Rate (Standard: 25%)

#### **Lambda Kosten**
- **256MB Memory**: Optimiert für JSON-Processing
- **10s Timeout**: Kurz für schnelle Responses
- **Node.js 20**: Neueste Runtime für Performance

### 🔄 Reliability & Autoscaling

#### **Automatische Skalierung**
- **HTTP API Gateway**: Automatisches Scaling ohne Limits
- **Lambda**: Concurrent Executions nach Bedarf
- **CloudWatch**: Managed Service, keine Ausfälle

#### **Rate Limiting**
- **API Gateway**: Eingebaute Rate Limits
- **Lambda**: Concurrent Execution Limits
- **Client-seitig**: Exponential Backoff im `monitoring-transport.ts`

#### **Fehlerbehandlung**
- **3 Retry-Versuche**: Mit jittered exponential backoff
- **Queue bei Fehlschlag**: LocalStorage-basierte Warteschlange
- **Fire-and-forget**: `navigator.sendBeacon` für Page Unload

## 📊 Monitoring & Observability

### CloudWatch Metriken

Das System publiziert folgende Metriken:

| Metrik | Namespace | Beschreibung |
|--------|-----------|--------------|
| `CoreWebVital_LCP` | `Matbakh/Web` | Largest Contentful Paint |
| `CoreWebVital_INP` | `Matbakh/Web` | Interaction to Next Paint |
| `CoreWebVital_CLS` | `Matbakh/Web` | Cumulative Layout Shift |
| `CoreWebVital_FCP` | `Matbakh/Web` | First Contentful Paint |
| `CoreWebVital_TTFB` | `Matbakh/Web` | Time to First Byte |
| `PerformanceAlert` | `Matbakh/Web` | Performance Alerts |
| `PerformanceRegression` | `Matbakh/Web` | Regression Detection |

### Dimensionen

Alle Metriken enthalten standardisierte Dimensionen:

```typescript
{
  Env: "production",           // Environment
  AppVersion: "1.0.0",        // App Version
  Page: "dashboard",          // Current Page (max 64 chars)
  DeviceType: "desktop",      // mobile/tablet/desktop
  ConnectionType: "4g",       // Network Connection
  Rating: "good",             // Performance Rating
  SessionId: "a1b2c3d4"      // Hashed Session (8 chars)
}
```

## 🧪 Testing

### Lokale Tests

```bash
# 1. CDK Synth (ohne Deployment)
cd infra/cdk
cdk synth

# 2. Lambda lokal testen
cd infra/lambdas/metrics-ingest
npm test

# 3. Frontend mit Test-Endpoint
VITE_METRICS_ENDPOINT=http://localhost:3000/metrics npm run dev
```

### Produktions-Validierung

```bash
# Health Check
curl -X POST https://your-api.execute-api.eu-central-1.amazonaws.com/metrics \
  -H "Content-Type: application/json" \
  -d '{"metricName":"test","value":1}'

# Erwartete Antwort: 204 No Content
```

## 🔧 Troubleshooting

### Häufige Probleme

1. **CORS-Fehler**
   - Lösung: `corsOrigin` Context korrekt setzen
   - Check: Browser DevTools Network Tab

2. **Metrics erscheinen nicht in CloudWatch**
   - Lösung: IAM-Berechtigung prüfen
   - Check: Lambda Logs in CloudWatch

3. **Hohe Kosten**
   - Lösung: `VITE_METRICS_SAMPLE_RATE` reduzieren
   - Check: CloudWatch Billing Dashboard

4. **Performance-Impact**
   - Lösung: Sampling aktivieren (0.1 = 10%)
   - Check: Browser Performance Tab

### Debug-Modus

```bash
# CDK mit Debug-Logs
cdk deploy -c logLevel="debug"

# Frontend mit Debug-Logs
VITE_ENABLE_METRICS=true VITE_METRICS_SAMPLE_RATE=1.0 npm run dev
```

## 📚 Weiterführende Dokumentation

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [CloudWatch Metrics](https://docs.aws.amazon.com/cloudwatch/latest/monitoring/working_with_metrics.html)
- [Web Vitals](https://web.dev/vitals/)
- [Performance Monitoring Integration Guide](../../docs/performance-monitoring-integration-guide.md)

---

**Status**: ✅ Production Ready  
**Letzte Aktualisierung**: 2025-01-14  
**Version**: 1.0.0