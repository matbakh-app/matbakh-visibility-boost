# Security Monitoring Setup & Maintenance

## 🔧 System Configuration

### Database Functions Status
```sql
-- Verify all security functions are installed
SELECT 
  proname as function_name,
  pronargs as arg_count,
  prorettype::regtype as return_type
FROM pg_proc 
WHERE proname LIKE '%security%' OR proname LIKE '%audit%'
ORDER BY proname;
```

### Trigger Status Check
```sql
-- Verify audit triggers are active
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  tgenabled
FROM pg_trigger 
WHERE tgname LIKE 'audit_trigger%'
ORDER BY tgrelid::regclass;
```

### RLS Policy Status
```sql
-- Check Row Level Security status
SELECT 
  schemaname,
  tablename,
  rowsecurity,
  hasrls
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN (
    'security_events', 
    'security_audit_log', 
    'security_alerts',
    'business_partners',
    'profiles'
  );
```

## 📊 Monitoring Dashboards

### Real-Time Security Dashboard

```sql
-- Current security status overview
WITH security_summary AS (
  SELECT 
    COUNT(*) FILTER (WHERE created_at > now() - interval '24 hours') as events_24h,
    COUNT(*) FILTER (WHERE created_at > now() - interval '1 hour') as events_1h,
    COUNT(*) FILTER (WHERE severity = 'critical' AND created_at > now() - interval '24 hours') as critical_24h,
    COUNT(*) FILTER (WHERE severity = 'high' AND created_at > now() - interval '24 hours') as high_24h
  FROM security_events
),
alert_summary AS (
  SELECT 
    COUNT(*) FILTER (WHERE resolved = false) as unresolved_alerts,
    COUNT(*) FILTER (WHERE resolved = false AND severity = 'critical') as critical_alerts,
    COUNT(*) FILTER (WHERE resolved = false AND severity = 'high') as high_alerts
  FROM security_alerts
)
SELECT 
  ss.*,
  als.*,
  now() as report_time
FROM security_summary ss, alert_summary als;
```

### Weekly Security Report

```sql
-- Weekly security metrics
SELECT 
  DATE_TRUNC('day', created_at) as day,
  COUNT(*) as total_events,
  COUNT(*) FILTER (WHERE severity = 'critical') as critical_events,
  COUNT(*) FILTER (WHERE severity = 'high') as high_events,
  COUNT(*) FILTER (WHERE event_type LIKE '%login%') as login_events,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT ip_address) as unique_ips
FROM security_events 
WHERE created_at > now() - interval '7 days'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY day DESC;
```

## 🔔 Alert Configuration

### Slack/Email Notifications Setup

Erstelle eine Edge Function für Notifications:

```typescript
// supabase/functions/security-notifications/index.ts
export async function handleSecurityNotification(alert: SecurityAlert) {
  if (alert.severity === 'critical') {
    // Sofortige Notification
    await sendSlackAlert({
      channel: '#security-critical',
      message: `🚨 CRITICAL SECURITY ALERT: ${alert.title}`,
      details: alert.description,
      timestamp: alert.created_at
    });
    
    // Email an On-Call Team
    await sendEmail({
      to: 'security-oncall@matbakh.app',
      subject: `[CRITICAL] Security Alert: ${alert.title}`,
      body: generateAlertEmail(alert)
    });
  }
}
```

### Database Trigger für Notifications

```sql
-- Notification trigger für kritische Alerts
CREATE OR REPLACE FUNCTION notify_critical_alerts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.severity = 'critical' THEN
    -- Edge Function aufrufen für Notification
    PERFORM http_post(
      'https://uheksobnyedarrpgxhju.supabase.co/functions/v1/security-notifications',
      jsonb_build_object(
        'alert_id', NEW.id,
        'severity', NEW.severity,
        'title', NEW.title,
        'description', NEW.description
      ),
      'application/json'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_critical_alerts
  AFTER INSERT ON security_alerts
  FOR EACH ROW
  EXECUTE FUNCTION notify_critical_alerts();
```

## 🧹 Automated Maintenance

### Cron Job Setup (auf Server)

```bash
# /etc/cron.d/matbakh-security

# Tägliche Cleanup-Routine (03:00 UTC)
0 3 * * * postgres psql -d postgres -c "SELECT public.cleanup_old_security_data();"

# Wöchentlicher Security Report (Montag 08:00 UTC)
0 8 * * 1 postgres psql -d postgres -c "\copy (SELECT * FROM public.generate_weekly_security_report()) TO '/tmp/weekly_security_report.csv' CSV HEADER;"

# Monatliche Alert Summary (1. Tag des Monats, 09:00 UTC)
0 9 1 * * postgres psql -d postgres -c "SELECT public.generate_monthly_alert_summary();"
```

### Security Health Check Script

```sql
-- Health check function
CREATE OR REPLACE FUNCTION public.security_health_check()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb := '{}';
  trigger_count integer;
  rls_count integer;
  recent_events integer;
BEGIN
  -- Check audit triggers
  SELECT COUNT(*) INTO trigger_count
  FROM pg_trigger 
  WHERE tgname LIKE 'audit_trigger%' AND tgenabled = 'O';
  
  -- Check RLS policies
  SELECT COUNT(*) INTO rls_count
  FROM pg_policies 
  WHERE schemaname = 'public' 
    AND tablename IN ('security_events', 'security_audit_log', 'security_alerts');
  
  -- Check recent activity
  SELECT COUNT(*) INTO recent_events
  FROM security_events 
  WHERE created_at > now() - interval '24 hours';
  
  result := jsonb_build_object(
    'timestamp', now(),
    'status', CASE 
      WHEN trigger_count >= 5 AND rls_count >= 6 THEN 'healthy'
      ELSE 'warning'
    END,
    'active_triggers', trigger_count,
    'rls_policies', rls_count,
    'recent_events_24h', recent_events,
    'database_size', pg_database_size(current_database())
  );
  
  RETURN result;
END;
$$;
```

## 📈 Performance Monitoring

### Index Performance

```sql
-- Monitor index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch,
  ROUND(idx_tup_read::numeric / NULLIF(idx_scan, 0), 2) as avg_tuples_per_scan
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
  AND tablename IN ('security_events', 'security_audit_log', 'security_alerts')
ORDER BY idx_scan DESC;
```

### Query Performance

```sql
-- Slow security queries
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  rows,
  100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements 
WHERE query LIKE '%security_%' 
  OR query LIKE '%audit_%'
ORDER BY mean_time DESC
LIMIT 10;
```

### Storage Usage

```sql
-- Table sizes monitoring
SELECT 
  tablename,
  pg_size_pretty(pg_total_relation_size('public.'||tablename)) as size,
  pg_total_relation_size('public.'||tablename) as size_bytes
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN ('security_events', 'security_audit_log', 'security_alerts')
ORDER BY pg_total_relation_size('public.'||tablename) DESC;
```

## 🔄 Backup & Recovery

### Security Data Backup

```bash
#!/bin/bash
# backup-security-data.sh

DATE=$(date +%Y%m%d)
BACKUP_DIR="/backup/security"

# Backup security tables
pg_dump -h localhost -U postgres -d postgres \
  --table=security_events \
  --table=security_audit_log \
  --table=security_alerts \
  --data-only \
  --file="$BACKUP_DIR/security_data_$DATE.sql"

# Compress backup
gzip "$BACKUP_DIR/security_data_$DATE.sql"

# Cleanup old backups (keep 90 days)
find $BACKUP_DIR -name "security_data_*.sql.gz" -mtime +90 -delete
```

### Recovery Testing

```sql
-- Test restore procedure (on test database)
CREATE SCHEMA security_backup;

-- Restore to backup schema
\i /backup/security/security_data_20250124.sql

-- Verify data integrity
SELECT 
  'security_events' as table_name,
  COUNT(*) as record_count,
  MIN(created_at) as oldest,
  MAX(created_at) as newest
FROM security_backup.security_events
UNION ALL
SELECT 
  'security_audit_log',
  COUNT(*),
  MIN(created_at),
  MAX(created_at)
FROM security_backup.security_audit_log;
```

## 🔐 Security Hardening Checklist

### Database Security
- [ ] All security tables have RLS enabled
- [ ] Admin-only access to security data
- [ ] Sensitive data redaction working
- [ ] Audit triggers on critical tables
- [ ] Regular backups configured

### Application Security
- [ ] HTTPS enforced
- [ ] CSRF protection active
- [ ] Input sanitization implemented
- [ ] Rate limiting configured
- [ ] Session management secure

### Monitoring & Alerting
- [ ] Critical alerts configured
- [ ] Notification channels tested
- [ ] Dashboards accessible
- [ ] Automated cleanup running
- [ ] Performance monitoring active

---

**📅 Maintenance Schedule:**
- **Daily**: Health checks, critical alert review
- **Weekly**: Security metrics review, index optimization
- **Monthly**: Full audit, policy review, backup testing
- **Quarterly**: Security hardening review, pen testing

**Contact**: devops@matbakh.app