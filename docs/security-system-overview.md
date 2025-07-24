# Matbakh Security System - Tech Wiki

## Übersicht

Das Matbakh Sicherheitssystem implementiert ein umfassendes Audit- und Monitoring-System für die Plattform. Es besteht aus drei Hauptkomponenten:

### 🗄️ Datenbank-Tabellen

#### `security_events`
- **Zweck**: Protokollierung aller sicherheitsrelevanten Ereignisse
- **Retention**: 2 Jahre (automatische Löschung)
- **RLS**: Nur Admins können lesen, System kann schreiben

#### `security_audit_log`
- **Zweck**: Detaillierte Änderungsprotokollierung kritischer Tabellen
- **Retention**: 3 Jahre (automatische Löschung)
- **Trigger auf**: `business_partners`, `profiles`, `service_packages_legacy`, `addon_services`, `fb_conversions_config`

#### `security_alerts`
- **Zweck**: Automatische Warnungen bei verdächtigen Aktivitäten
- **Eskalation**: High/Critical Alerts für sofortige Aktion
- **Auflösung**: Manuelle Bestätigung durch Admin erforderlich

### 🔍 Monitoring & Alerting

#### Automatische Überwachung
- **Excessive Failed Logins**: 5+ fehlgeschlagene Logins in 15min → High Alert
- **Admin Activity**: 3+ Admin-Änderungen in 1h → Critical Alert
- **Critical Events**: Sofortige Benachrichtigung bei kritischen Ereignissen

#### Sensitive Data Protection
- Automatische Redaction von Passwörtern, Tokens, API-Keys
- Sichere Protokollierung ohne Datenlecks

### 🛠️ Wartungsfunktionen

#### Automatische Datenbereinigung
```sql
-- Ausführung: Monatlich via Cron
SELECT public.cleanup_old_security_data();
```

#### Alert-Verarbeitung
```sql
-- Abrufen aller kritischen/hohen Alerts
SELECT * FROM public.process_pending_alerts();
```

## 🔐 Sicherheitsrichtlinien

### Datenschutz (DSGVO-Konform)
- **Security Events**: 2 Jahre Retention
- **Audit Logs**: 3 Jahre Retention (rechtliche Anforderungen)
- **Resolved Alerts**: 1 Jahr Retention

### Zugriffskontrolle
- **Admin-Only**: Alle Sicherheitstabellen
- **Service Role**: System-Funktionen (Trigger, Logging)
- **Encrypted Storage**: Sensitive Daten werden verschlüsselt

## 📊 Performance & Indizes

Optimierte Indizes für schnelle Abfragen:
- `security_events`: user_id, event_type, created_at, severity
- `security_audit_log`: user_id, table_name, operation, created_at
- `security_alerts`: severity, resolved, created_at, user_id

## 🚨 Incident Response

Bei Sicherheitsvorfällen:
1. Sofortiger Zugriff auf `security_alerts` Tabelle
2. Korrelation mit `security_events` für Timeline
3. Detailanalyse via `security_audit_log`
4. Manuelle Auflösung mit `resolve_security_alert()`

## 🔄 Integration

### Edge Functions
- Alle Edge Functions nutzen `log_security_event()` für Audit Trail
- Automatische IP/User-Agent Erfassung
- Fehlertolerante Implementierung

### Client-Side
- `src/utils/security.ts` - Client-seitige Sicherheitsutils
- Rate Limiting, CSRF Protection, Input Sanitization
- Sichere localStorage Handhabung

## 📈 Metriken & KPIs

- **Security Event Volume**: Durchschnittliche Events/Tag
- **Alert Response Time**: Zeit bis zur Auflösung
- **False Positive Rate**: Ungerechtfertigte Alerts
- **Coverage**: Anteil überwachter kritischer Operationen

---

**Letzte Aktualisierung**: Januar 2025  
**Version**: 1.0  
**Verantwortlich**: DevOps Team