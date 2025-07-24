# Matbakh Security Documentation

## 📚 Dokumentationsübersicht

Diese Dokumentation beschreibt das Matbakh Sicherheitssystem und Audit-Framework.

### 📋 Verfügbare Dokumente

| Dokument | Zweck | Zielgruppe |
|----------|-------|------------|
| **[Security System Overview](./security-system-overview.md)** | Tech-Wiki mit Systemarchitektur | Entwickler, DevOps |
| **[Audit Procedures](./security-audit-procedures.md)** | Tägliche/wöchentliche Audit-Routinen | Security Team, Admins |
| **[Incident Response](./security-incident-response.md)** | Incident Response Playbook | On-Call Team, Security |
| **[Monitoring Setup](./security-monitoring-setup.md)** | Setup & Wartung des Monitoring | DevOps, SysAdmins |

## 🚀 Quick Start

### Für neue Team-Mitglieder

1. **System verstehen**: Beginne mit [Security System Overview](./security-system-overview.md)
2. **Zugriff einrichten**: Admin-Rechte für Supabase Dashboard beantragen
3. **Tools installieren**: PostgreSQL Client, Supabase CLI
4. **Erste Checks**: [Tägliche Audits](./security-audit-procedures.md#tägliche-checks-5min) durchführen

### Für Incident Response

1. **Sofortmaßnahmen**: [Incident Response Guide](./security-incident-response.md#phase-1-detection--analysis-0-15-min)
2. **Eskalation**: Critical Alerts → Tech Lead kontaktieren
3. **Dokumentation**: Alle Schritte im Incident dokumentieren

## 🔍 Wichtige SQL-Abfragen

### Kritische Alerts prüfen
```sql
SELECT * FROM security_alerts 
WHERE resolved = false AND severity = 'critical'
ORDER BY created_at DESC;
```

### Security Events der letzten 24h
```sql
SELECT event_type, COUNT(*), MAX(created_at) 
FROM security_events 
WHERE created_at > now() - interval '24 hours'
GROUP BY event_type
ORDER BY COUNT(*) DESC;
```

### System Health Check
```sql
SELECT public.security_health_check();
```

## ⚠️ Kritische Schwellwerte

| Metrik | Warning | Critical | Aktion |
|--------|---------|----------|--------|
| Failed Logins | 5 in 15min | - | Automatischer Alert |
| Admin Changes | - | 3 in 1h | Sofortige Eskalation |
| Unresolved Critical Alerts | 1 | 3+ | Tech Lead kontaktieren |
| Disk Usage (Security Tables) | 80% | 90% | Cleanup durchführen |

## 📞 Notfallkontakte

### Intern
- **Tech Lead**: tech-lead@matbakh.app
- **DevOps On-Call**: +49 XXX XXX XXXX
- **Security Team**: security@matbakh.app

### Extern  
- **Supabase Support**: support@supabase.com
- **Legal (Datenschutzvorfälle)**: legal@matbakh.app

## 🛠️ Tools & Zugriffe

### Erforderliche Tools
- **PostgreSQL Client** (psql, pgAdmin, etc.)
- **Supabase CLI** für Edge Functions
- **Slack** für Notifications
- **CSV/JSON Viewer** für Logs

### Zugriffe benötigt
- Supabase Dashboard (Admin-Rechte)
- Matbakh Admin Panel
- Security Slack Channels
- Backup Storage Access

## 🔄 Wartungsplan

### Täglich (5 min)
- [ ] Kritische Alerts prüfen
- [ ] Login-Anomalien checken
- [ ] System Health Status

### Wöchentlich (15 min)  
- [ ] Security Trends analysieren
- [ ] Performance Metriken prüfen
- [ ] Backup Status verifizieren

### Monatlich (30 min)
- [ ] Deep Audit durchführen
- [ ] Admin-Zugriffe reviewen
- [ ] Dokumentation aktualisieren

## 📊 Monitoring URLs

### Supabase Dashboard
- **Projekt**: [https://supabase.com/dashboard/project/uheksobnyedarrpgxhju](https://supabase.com/dashboard/project/uheksobnyedarrpgxhju)
- **Logs**: [https://supabase.com/dashboard/project/uheksobnyedarrpgxhju/logs/explorer](https://supabase.com/dashboard/project/uheksobnyedarrpgxhju/logs/explorer)
- **SQL Editor**: [https://supabase.com/dashboard/project/uheksobnyedarrpgxhju/sql/new](https://supabase.com/dashboard/project/uheksobnyedarrpgxhju/sql/new)

### Matbakh Admin
- **Security Dashboard**: `/admin/security` (in Entwicklung)
- **Audit Logs**: `/admin/audit` (in Entwicklung)

## 🎯 SLAs & Metriken

### Response Times
- **Critical Alerts**: < 15 Minuten
- **High Priority**: < 1 Stunde  
- **Medium Priority**: < 4 Stunden
- **Low Priority**: < 24 Stunden

### Verfügbarkeit
- **Security Monitoring**: 99.9% Uptime
- **Alert System**: 99.95% Uptime
- **Audit Logging**: 100% (kritisch)

## 🔐 Compliance & Datenschutz

### DSGVO-Konformität
- **Retention Periods**: Automatisch eingehalten
- **Data Minimization**: Sensitive Daten werden redacted
- **Access Controls**: Strict Admin-only access

### Audit Requirements
- **Vollständigkeit**: Alle kritischen Operationen geloggt
- **Integrität**: Tamper-proof Logging
- **Verfügbarkeit**: 3 Jahre Retention für Audit Logs

---

## 📝 Changelog

| Version | Datum | Änderungen |
|---------|-------|------------|
| 1.0 | 2025-01-24 | Initial Documentation |
| | | Security System v1 implementiert |
| | | Audit Triggers auf kritischen Tabellen |
| | | Automatisches Alert System |

---

**📧 Fragen oder Verbesserungsvorschläge?**  
Kontaktiere das Security Team: security@matbakh.app

**🔄 Letzte Aktualisierung**: Januar 2025  
**👥 Maintainer**: DevOps Team