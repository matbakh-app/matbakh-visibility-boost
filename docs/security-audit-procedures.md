# Security Audit Procedures - Matbakh

## 🔍 Routine Security Audits

### Tägliche Checks (5min)

```sql
-- 1. Kritische Alerts prüfen
SELECT alert_type, severity, title, created_at 
FROM security_alerts 
WHERE resolved = false AND severity IN ('high', 'critical')
ORDER BY created_at DESC;

-- 2. Ungewöhnliche Login-Aktivitäten
SELECT event_type, COUNT(*), MAX(created_at) as latest
FROM security_events 
WHERE created_at > now() - interval '24 hours'
  AND event_type LIKE '%login%'
GROUP BY event_type
ORDER BY COUNT(*) DESC;

-- 3. Admin-Aktivitäten der letzten 24h
SELECT user_id, event_type, created_at, details
FROM security_events 
WHERE created_at > now() - interval '24 hours'
  AND (event_type LIKE '%admin%' OR severity = 'critical')
ORDER BY created_at DESC;
```

### Wöchentliche Audits (15min)

```sql
-- 1. Top Security Events der Woche
SELECT event_type, COUNT(*) as frequency, severity
FROM security_events 
WHERE created_at > now() - interval '7 days'
GROUP BY event_type, severity
ORDER BY COUNT(*) DESC
LIMIT 20;

-- 2. Unusual User Behavior
SELECT user_id, COUNT(*) as event_count, 
       ARRAY_AGG(DISTINCT event_type) as event_types
FROM security_events 
WHERE created_at > now() - interval '7 days'
GROUP BY user_id
HAVING COUNT(*) > 50  -- Schwellwert anpassbar
ORDER BY COUNT(*) DESC;

-- 3. Audit Log Summary
SELECT table_name, operation, COUNT(*) as changes
FROM security_audit_log 
WHERE created_at > now() - interval '7 days'
GROUP BY table_name, operation
ORDER BY COUNT(*) DESC;
```

### Monatliche Deep Audits (30min)

```sql
-- 1. Security Trend Analysis
SELECT 
  DATE_TRUNC('day', created_at) as day,
  severity,
  COUNT(*) as events
FROM security_events 
WHERE created_at > now() - interval '30 days'
GROUP BY DATE_TRUNC('day', created_at), severity
ORDER BY day DESC;

-- 2. Failed Login Patterns
SELECT 
  ip_address,
  COUNT(*) as failed_attempts,
  COUNT(DISTINCT user_id) as affected_users,
  MIN(created_at) as first_attempt,
  MAX(created_at) as last_attempt
FROM security_events 
WHERE event_type = 'login_failed'
  AND created_at > now() - interval '30 days'
GROUP BY ip_address
HAVING COUNT(*) > 10
ORDER BY COUNT(*) DESC;
```

## 🚨 Incident Investigation Playbook

### Step 1: Alert Triage

```sql
-- Alle ungelösten kritischen Alerts
SELECT 
  id,
  alert_type,
  title,
  description,
  user_id,
  metadata,
  created_at
FROM security_alerts 
WHERE resolved = false 
  AND severity = 'critical'
ORDER BY created_at ASC;
```

### Step 2: Timeline Reconstruction

```sql
-- Events um einen spezifischen User/Zeitraum
SELECT 
  created_at,
  event_type,
  severity,
  ip_address,
  user_agent,
  details
FROM security_events 
WHERE user_id = 'USER_ID_HERE'  -- Anpassen
  AND created_at BETWEEN 'START_TIME' AND 'END_TIME'  -- Anpassen
ORDER BY created_at ASC;
```

### Step 3: Audit Trail Analysis

```sql
-- Alle Änderungen eines Users
SELECT 
  created_at,
  table_name,
  operation,
  changed_fields,
  old_data,
  new_data
FROM security_audit_log 
WHERE user_id = 'USER_ID_HERE'  -- Anpassen
  AND created_at > now() - interval '7 days'
ORDER BY created_at DESC;
```

### Step 4: Correlation Analysis

```sql
-- Events von derselben IP
SELECT 
  event_type,
  user_id,
  created_at,
  details
FROM security_events 
WHERE ip_address = 'IP_ADDRESS_HERE'  -- Anpassen
  AND created_at > now() - interval '24 hours'
ORDER BY created_at ASC;
```

## 🔧 Alert Resolution

### Critical Alert Workflow

1. **Sofortige Maßnahmen**
   ```sql
   -- User temporär deaktivieren (falls nötig)
   UPDATE profiles SET role = 'suspended' WHERE id = 'USER_ID';
   ```

2. **Untersuchung dokumentieren**
   ```sql
   -- Alert mit Notizen auflösen
   SELECT public.resolve_security_alert(
     'ALERT_ID_HERE',
     auth.uid()
   );
   ```

3. **Zusätzliches Logging**
   ```sql
   SELECT public.log_security_event(
     'incident_resolved',
     'USER_ID_HERE',
     NULL,
     NULL,
     jsonb_build_object(
       'incident_id', 'INC-2025-001',
       'resolution', 'False positive - automated trigger',
       'investigator', 'admin@matbakh.app'
     ),
     'info'
   );
   ```

## 📋 Maintenance Procedures

### Datenbereinigung

```sql
-- Manuelle Bereinigung alter Daten
SELECT public.cleanup_old_security_data();

-- Status nach Bereinigung prüfen
SELECT 
  'security_events' as table_name,
  COUNT(*) as remaining_records,
  MIN(created_at) as oldest_record
FROM security_events
UNION ALL
SELECT 
  'security_audit_log',
  COUNT(*),
  MIN(created_at)
FROM security_audit_log
UNION ALL
SELECT 
  'security_alerts',
  COUNT(*),
  MIN(created_at)
FROM security_alerts WHERE resolved = true;
```

### Performance Monitoring

```sql
-- Index-Nutzung prüfen
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE schemaname = 'public' 
  AND tablename IN ('security_events', 'security_audit_log', 'security_alerts')
ORDER BY idx_scan DESC;
```

## 🔐 Access Control Review

### Admin Audit (Monatlich)

```sql
-- Alle Admins auflisten
SELECT id, name, created_at, updated_at
FROM profiles 
WHERE role = 'admin';

-- Admin-Aktivitäten der letzten 30 Tage
SELECT 
  p.name,
  se.event_type,
  COUNT(*) as actions
FROM security_events se
JOIN profiles p ON se.user_id = p.id
WHERE p.role = 'admin'
  AND se.created_at > now() - interval '30 days'
GROUP BY p.name, se.event_type
ORDER BY COUNT(*) DESC;
```

---

**⚠️ Wichtige Hinweise:**

1. **Vertraulichkeit**: Alle Audit-Daten sind streng vertraulich
2. **Rechtliches**: Logs können rechtlich relevant sein - nicht ohne Absprache löschen
3. **Eskalation**: Critical Alerts immer sofort an Tech Lead weiterleiten
4. **Dokumentation**: Alle Incident-Untersuchungen dokumentieren

**Kontakt bei Fragen**: security@matbakh.app