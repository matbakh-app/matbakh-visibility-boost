# AWS Infrastructure Cost Analysis - Realistic 2025 Pricing

**Date:** 2025-01-15  
**Region:** eu-central-1 (Primary), eu-west-1 (DR)  
**Currency:** EUR  
**Pricing Source:** AWS Calculator (Januar 2025)

## 🎯 Korrigierte Kostenschätzung

Die ursprüngliche Schätzung von €726/Monat war zu hoch angesetzt. Hier ist eine realistische Analyse basierend auf aktuellen AWS-Preisen:

## 📊 Detaillierte Kostenaufschlüsselung

### RDS PostgreSQL Instances

| Service                  | Specification           | Region        | Monthly Cost (EUR) |
| ------------------------ | ----------------------- | ------------- | ------------------ |
| **Primary DB**           | db.r6g.large (Multi-AZ) | eu-central-1  | €165               |
| **Read Replica**         | db.r6g.large            | eu-central-1b | €82                |
| **DR Replica**           | db.r6g.large            | eu-west-1     | €85                |
| **Storage**              | 300GB gp3 (total)       | Multi-region  | €35                |
| **Backups**              | 7-day retention         | Multi-region  | €12                |
| **Performance Insights** | 7-day retention         | Multi-region  | €8                 |
| **Enhanced Monitoring**  | 60-second intervals     | Multi-region  | €5                 |

**RDS Subtotal: €392/Monat**

### Networking & VPC

| Service               | Specification        | Monthly Cost (EUR) |
| --------------------- | -------------------- | ------------------ |
| **VPC**               | 2 regions            | €0                 |
| **NAT Gateways**      | 2 gateways           | €65                |
| **Internet Gateways** | 2 gateways           | €0                 |
| **Data Transfer**     | Estimated 50GB/month | €8                 |
| **VPC Endpoints**     | S3, KMS endpoints    | €15                |

**Networking Subtotal: €88/Monat**

### Security & Monitoring

| Service                | Specification           | Monthly Cost (EUR) |
| ---------------------- | ----------------------- | ------------------ |
| **KMS Keys**           | 3 customer-managed keys | €3                 |
| **CloudWatch Logs**    | 10GB/month retention    | €6                 |
| **CloudWatch Metrics** | Custom metrics          | €4                 |
| **SNS Notifications**  | 1000 emails/month       | €1                 |
| **CloudWatch Alarms**  | 10 alarms               | €1                 |

**Security & Monitoring Subtotal: €15/Monat**

### Additional Services (Phase 2+)

| Service         | Specification     | Monthly Cost (EUR) |
| --------------- | ----------------- | ------------------ |
| **Cognito**     | 10,000 MAU        | €12                |
| **S3 Storage**  | 100GB + requests  | €8                 |
| **CloudFront**  | 100GB transfer    | €15                |
| **Lambda**      | 1M requests/month | €3                 |
| **API Gateway** | 1M requests/month | €4                 |

**Additional Services Subtotal: €42/Monat**

## 💰 Gesamtkostenschätzung

### Phase 1 (Nur Infrastruktur)

```
RDS:                €392/Monat
Networking:         €88/Monat
Security/Monitor:   €15/Monat
─────────────────────────────
Phase 1 Total:      €495/Monat
```

### Vollständige Migration (Alle Phasen)

```
Phase 1:            €495/Monat
Additional Services: €42/Monat
─────────────────────────────
Gesamt Total:       €537/Monat
```

## 📈 Kostenvergleich mit Supabase

### Aktuelle Supabase Kosten (geschätzt)

```
Supabase Pro:       €25/Monat (Basis)
Database:           €200/Monat (für vergleichbare Performance)
Storage:            €50/Monat
Bandwidth:          €30/Monat
Add-ons:            €100/Monat
─────────────────────────────
Supabase Total:     €405/Monat
```

### Kostenvergleich

```
AWS (vollständig):  €537/Monat
Supabase:           €405/Monat
─────────────────────────────
Differenz:          +€132/Monat (+33%)
```

## 🔍 Warum AWS teurer ist

1. **Enterprise-Grade Setup**: Multi-AZ, DR, Enhanced Monitoring
2. **Redundanz**: 3 RDS Instanzen vs. 1 bei Supabase
3. **Compliance**: KMS Verschlüsselung, erweiterte Sicherheit
4. **Kontrolle**: Vollständige Infrastruktur-Kontrolle vs. Managed Service

## 💡 Kostenoptimierungsstrategien

### Sofortige Einsparungen (€150-200/Monat)

1. **Reserved Instances** (1-Jahr): -30% auf RDS = €118/Monat Ersparnis
2. **Kleinere Instanzen**: db.r6g.medium statt large = €80/Monat Ersparnis
3. **Single-AZ für Read Replica**: €40/Monat Ersparnis
4. **Reduzierte Backup-Retention**: 3 Tage statt 7 = €6/Monat Ersparnis

### Optimierte Konfiguration

```
RDS (optimiert):    €274/Monat (-€118)
Networking:         €88/Monat
Security/Monitor:   €15/Monat
Additional:         €42/Monat
─────────────────────────────
Optimiert Total:    €419/Monat
```

### Vergleich nach Optimierung

```
AWS (optimiert):    €419/Monat
Supabase:           €405/Monat
─────────────────────────────
Differenz:          +€14/Monat (+3%)
```

## 🎯 Empfehlung

### Für Kostenbewusste Migration

1. **Start mit kleineren Instanzen**: db.r6g.medium
2. **Reserved Instances kaufen**: Nach 3 Monaten Testlauf
3. **DR-Strategie überdenken**: Backup-basiert statt Live-Replica
4. **Monitoring reduzieren**: 5-Minuten statt 1-Minute Intervalle

### Für Enterprise-Grade Setup

- Aktuelle Konfiguration beibehalten
- Fokus auf Kontrolle und Compliance-Vorteile
- Langfristige Kostenoptimierung durch Automatisierung

## 📊 Korrigierte Ursprungsschätzung

**Ursprüngliche €726/Monat war basiert auf:**

- Überschätzte RDS-Preise (€540 statt €392)
- Zusätzliche Services die nicht benötigt werden
- Keine Berücksichtigung von Optimierungen

**Realistische Schätzung:**

- **Phase 1:** €495/Monat
- **Vollständig:** €537/Monat
- **Optimiert:** €419/Monat

## 🔄 Nächste Schritte

1. **Kosten-Monitoring einrichten**: Budget-Alerts bei €500/Monat
2. **Pilotphase**: 3 Monate mit aktueller Konfiguration
3. **Optimierung**: Nach Pilotphase Reserved Instances kaufen
4. **Kontinuierliche Überwachung**: Monatliche Kostenanalyse

---

**Fazit:** Die Migration zu AWS kostet realistisch €420-540/Monat, nicht €726. Mit Optimierungen ist sie kostenneutral zu Supabase bei deutlich besserer Kontrolle und Compliance.
