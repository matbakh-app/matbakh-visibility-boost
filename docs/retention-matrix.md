# Retention Matrix - matbakh.app Data Platform

## Datensatz → Zweck → Aufbewahrung → Rechtsgrundlage → Löschpfad

| Datensatz | Zweck | Aufbewahrung | Rechtsgrundlage | Löschpfad | PII/Non-PII | Owner |
|-----------|-------|--------------|-----------------|-----------|-------------|-------|
| **VcTokens (unbestätigt)** | DOI-Prozess, E-Mail-Verifizierung | 7 Tage TTL | Art. 6 Abs. 1 lit. a (Consent) | DynamoDB TTL automatisch | PII (email_lower, ip_start) | Legal/Compliance |
| **VcTokens (bestätigt)** | Report-Versand, Consent-Nachweis | 90 Tage nach letzter Aktivität | Art. 6 Abs. 1 lit. a (Consent) | Batch-Job täglich | PII (email_lower, ip_confirm) | Legal/Compliance |
| **ConsentJournal** | DSGVO-Compliance, Audit-Trail | 3 Jahre ab Consent-Datum | Art. 6 Abs. 1 lit. c (Legal Obligation) | Batch-Job monatlich | PII (email) | Legal/Compliance |
| **user_profiles** | App-Funktionalität, Personalisierung | 36 Monate nach letztem Login | Art. 6 Abs. 1 lit. b (Contract) | Cascade Delete Supabase | PII (email, name) | Product Team |
| **onboarding_progress** | Fortschritts-Tracking, UX-Optimierung | 24 Monate nach Completion | Art. 6 Abs. 1 lit. b (Contract) | Cascade Delete Supabase | Non-PII (steps, status) | Product Team |
| **communication_prefs** | Personalisierte Kommunikation | Solange Account aktiv | Art. 6 Abs. 1 lit. a (Consent) | Cascade Delete Supabase | Non-PII (tone, address) | Product Team |
| **identity_links** | Identity Resolution, OAuth-Verknüpfung | 24 Monate nach letzter Nutzung | Art. 6 Abs. 1 lit. b (Contract) | Cascade Delete Supabase | Non-PII (external_ids) | Product Team |
| **SES Bounce/Complaint Events** | E-Mail-Reputation, Zustellbarkeit | 18 Monate ab Event-Datum | Art. 6 Abs. 1 lit. f (Legitimate Interest) | S3 Lifecycle Policy | PII (email) | DevOps Team |
| **GA4 Raw Data** | Nutzungsanalyse, Produktoptimierung | 14 Monate (GA4 Standard) | Art. 6 Abs. 1 lit. a (Consent) | GA4 Auto-Delete | Non-PII (pseudonymisiert) | Analytics Team |
| **GA4 Exported Data (S3)** | Langzeit-Analytics, ML-Features | 24 Monate ab Export-Datum | Art. 6 Abs. 1 lit. a (Consent) | S3 Lifecycle + Partition Drop | Non-PII (client_id hash) | Analytics Team |
| **GBP Profile Data** | Visibility Check, Profil-Optimierung | 24 Monate nach letztem VC | Art. 6 Abs. 1 lit. b (Contract) | API-basierte Löschung | Non-PII (place_id, ratings) | Product Team |
| **Facebook/IG OAuth Data** | Social Login, Social Media Integration | 24 Monate nach letztem Login | Art. 6 Abs. 1 lit. a (Consent) | API-basierte Löschung | PII (email, name) | Product Team |
| **Facebook/IG Page Data** | Social Media Analyse, VC-Integration | 24 Monate nach letzter Analyse | Art. 6 Abs. 1 lit. a (Consent) | API-basierte Löschung | Non-PII (page_id, metrics) | Product Team |
| **S3 Raw Data** | Backup, Disaster Recovery | 90 Tage ab Ingestion | Art. 6 Abs. 1 lit. f (Legitimate Interest) | S3 Lifecycle Policy | Mixed (je nach Quelle) | DevOps Team |
| **S3 Curated Data** | Analytics, Reporting, BI | 24 Monate ab Curation | Art. 6 Abs. 1 lit. a (Consent) | S3 Lifecycle + Partition Drop | Non-PII (pseudonymisiert) | Analytics Team |
| **S3 ML Features** | Machine Learning, Personalisierung | 24 Monate ab Feature-Erstellung | Art. 6 Abs. 1 lit. a (Consent) | S3 Lifecycle + Partition Drop | Non-PII (aggregiert) | Data Science Team |
| **CloudWatch Logs** | System-Monitoring, Debugging | 90 Tage ab Log-Erstellung | Art. 6 Abs. 1 lit. f (Legitimate Interest) | CloudWatch Retention Policy | Non-PII (system logs) | DevOps Team |
| **CloudTrail Logs** | Audit-Trail, Sicherheit | 1 Jahr ab Event-Datum | Art. 6 Abs. 1 lit. c (Legal Obligation) | S3 Lifecycle Policy | Non-PII (API calls) | Security Team |
| **Athena Query Results** | Ad-hoc Analytics, Reporting | 30 Tage ab Query-Ausführung | Art. 6 Abs. 1 lit. f (Legitimate Interest) | S3 Lifecycle Policy | Non-PII (query results) | Analytics Team |
| **Glue Data Catalog** | Metadaten, Schema-Management | Solange Datenquelle existiert | Art. 6 Abs. 1 lit. f (Legitimate Interest) | Automatisch bei Quelle-Löschung | Non-PII (metadata) | Data Engineering |

## Löschpfad-Details

### Automatische Löschung (TTL/Lifecycle)
- **DynamoDB TTL**: VcTokens unbestätigt (7 Tage)
- **S3 Lifecycle**: Raw Data (90 Tage), Query Results (30 Tage)
- **CloudWatch**: Log Groups (90 Tage)
- **GA4**: Automatische Löschung nach 14 Monaten

### Batch-Jobs (Scheduled)
- **Täglich 01:00 UTC**: VcTokens bestätigt (90 Tage inaktiv)
- **Wöchentlich Sonntag 02:00 UTC**: Inaktive user_profiles (36 Monate)
- **Monatlich 1. Tag 03:00 UTC**: ConsentJournal (3 Jahre alt)
- **Monatlich 1. Tag 04:00 UTC**: S3 Curated/ML Data (24 Monate alt)

### Cascade Delete (User-initiated)
```sql
-- Beispiel: Vollständige Nutzer-Löschung
1. DELETE FROM user_profiles WHERE user_id = ?
2. DELETE FROM onboarding_progress WHERE user_id = ?
3. DELETE FROM communication_prefs WHERE user_id = ?
4. DELETE FROM identity_links WHERE user_id = ?
5. DynamoDB: Scan & Delete by email_lower
6. S3: Delete partitioned data by user_id hash
7. External APIs: Revoke tokens, delete data
```

### API-basierte Löschung
- **Google APIs**: OAuth token revocation, GBP data deletion request
- **Facebook APIs**: App-scoped user deletion, page access revocation
- **GA4**: User deletion API (wenn verfügbar)

## DSGVO-Rechte Mapping

### Art. 15 (Auskunftsrecht)
- **Datenquellen**: Alle Tabellen mit user_id/email_lower
- **Export-Format**: JSON mit Metadaten (Zweck, Rechtsgrundlage, Retention)
- **Lieferzeit**: 30 Tage

### Art. 16 (Berichtigung)
- **Editierbare Felder**: user_profiles, communication_prefs
- **Nicht editierbar**: Audit-Logs, ConsentJournal (Integrität)

### Art. 17 (Löschung/"Recht auf Vergessenwerden")
- **Vollständige Löschung**: Cascade Delete + API-Revocation
- **Ausnahmen**: ConsentJournal (Legal Obligation), Audit-Logs (3 Jahre)

### Art. 18 (Einschränkung der Verarbeitung)
- **Mechanismus**: is_processing_restricted Flag
- **Auswirkung**: Keine neuen Verarbeitungen, nur Speicherung

### Art. 20 (Datenübertragbarkeit)
- **Format**: JSON/CSV Export
- **Umfang**: Alle vom Nutzer bereitgestellten Daten
- **Ausschluss**: Abgeleitete Daten, Analytics

### Art. 21 (Widerspruch)
- **Marketing**: Opt-out über communication_prefs
- **Profiling**: Deaktivierung ML-Features
- **Legitimate Interest**: Case-by-case Bewertung

## Monitoring & Compliance

### Retention-Monitoring
```sql
-- Beispiel: Überfällige Löschungen identifizieren
SELECT table_name, COUNT(*) as overdue_records
FROM (
  SELECT 'user_profiles' as table_name, user_id 
  FROM user_profiles 
  WHERE last_login < CURRENT_DATE - INTERVAL '36 months'
  
  UNION ALL
  
  SELECT 'consent_journal', user_id
  FROM consent_journal 
  WHERE created_at < CURRENT_DATE - INTERVAL '3 years'
) overdue
GROUP BY table_name;
```

### Compliance-Dashboard
- **Retention-Status**: Grün/Gelb/Rot pro Datensatz
- **Lösch-Pipeline**: Erfolg/Fehler der Batch-Jobs
- **DSGVO-Anfragen**: Bearbeitungszeit, Status
- **Data Minimization**: Unused Fields Detection

### Audit-Trail
```json
{
  "event_type": "data_deletion",
  "user_id": "01HN123...",
  "email_hash": "sha256...",
  "deletion_reason": "user_request_art17",
  "deleted_records": {
    "user_profiles": 1,
    "onboarding_progress": 15,
    "s3_partitions": 3
  },
  "timestamp": "2025-01-27T16:00:00Z",
  "operator": "system_batch_job"
}
```