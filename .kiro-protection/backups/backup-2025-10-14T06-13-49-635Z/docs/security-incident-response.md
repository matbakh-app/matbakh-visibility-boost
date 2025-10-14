# Security Incident Response - Matbakh

## 🚨 Incident Classification

### Severity Levels

| Level | Description | Response Time | Examples |
|-------|-------------|---------------|----------|
| **Critical** | Immediate threat to system/data | < 15 minutes | Data breach, system compromise, mass unauthorized access |
| **High** | Significant security concern | < 1 hour | Repeated failed logins, privilege escalation attempts |
| **Medium** | Potential security issue | < 4 hours | Unusual user behavior, minor policy violations |
| **Low** | Informational/audit trail | < 24 hours | Normal failed logins, routine access events |

## 🔍 Detection & Alert Channels

### Automated Alerts
```sql
-- Check for active critical alerts
SELECT * FROM public.process_pending_alerts() 
WHERE severity = 'critical';
```

### Manual Discovery
- User reports
- Admin observations
- External notifications
- Third-party security tools

## 📋 Incident Response Procedures

### Phase 1: Detection & Analysis (0-15 min)

#### 1.1 Initial Assessment
```sql
-- Get incident overview
SELECT 
  id,
  alert_type,
  severity,
  title,
  description,
  created_at,
  metadata
FROM security_alerts 
WHERE id = 'ALERT_ID_HERE';
```

#### 1.2 Threat Classification
```sql
-- Related security events
SELECT 
  event_type,
  created_at,
  severity,
  user_id,
  ip_address,
  details
FROM security_events 
WHERE created_at > (
  SELECT created_at - interval '1 hour' 
  FROM security_alerts 
  WHERE id = 'ALERT_ID_HERE'
)
ORDER BY created_at DESC;
```

#### 1.3 Impact Assessment
```sql
-- Affected users/systems
SELECT DISTINCT
  user_id,
  COUNT(*) as event_count,
  ARRAY_AGG(DISTINCT event_type) as event_types
FROM security_events 
WHERE created_at > now() - interval '2 hours'
  AND severity IN ('high', 'critical')
GROUP BY user_id;
```

### Phase 2: Containment (15-30 min)

#### 2.1 Immediate Actions

**For Account Compromise:**
```sql
-- Suspend user account
UPDATE profiles 
SET role = 'suspended' 
WHERE id = 'COMPROMISED_USER_ID';

-- Log the action
SELECT public.log_security_event(
  'user_suspended',
  'COMPROMISED_USER_ID',
  NULL,
  NULL,
  jsonb_build_object(
    'reason', 'security_incident',
    'incident_id', 'INC-2025-XXX',
    'suspended_by', auth.uid()
  ),
  'critical'
);
```

**For System-Wide Threat:**
```sql
-- Log system-wide protective action
SELECT public.log_security_event(
  'system_lockdown',
  auth.uid(),
  NULL,
  NULL,
  jsonb_build_object(
    'lockdown_type', 'admin_api_disabled',
    'incident_id', 'INC-2025-XXX',
    'duration', '30 minutes'
  ),
  'critical'
);
```

#### 2.2 Evidence Preservation
```sql
-- Create evidence snapshot
CREATE TEMP TABLE incident_evidence AS
SELECT 
  'security_events' as source_table,
  row_to_json(se.*) as data
FROM security_events se
WHERE created_at > now() - interval '4 hours'
  AND (severity IN ('high', 'critical') OR user_id = 'AFFECTED_USER_ID')
UNION ALL
SELECT 
  'security_audit_log',
  row_to_json(sal.*)
FROM security_audit_log sal
WHERE created_at > now() - interval '4 hours'
  AND user_id = 'AFFECTED_USER_ID';

-- Export evidence (manual step)
\copy (SELECT * FROM incident_evidence) TO '/tmp/incident_evidence_2025_001.csv' CSV HEADER;
```

### Phase 3: Investigation (30 min - 2 hours)

#### 3.1 Timeline Reconstruction
```sql
-- Complete timeline for affected user
WITH timeline AS (
  SELECT 
    created_at,
    'security_event' as source,
    event_type as action,
    severity,
    ip_address,
    details
  FROM security_events 
  WHERE user_id = 'AFFECTED_USER_ID'
    AND created_at > now() - interval '24 hours'
  
  UNION ALL
  
  SELECT 
    created_at,
    'audit_log' as source,
    table_name || '_' || operation as action,
    'info' as severity,
    ip_address,
    jsonb_build_object('changed_fields', changed_fields)
  FROM security_audit_log 
  WHERE user_id = 'AFFECTED_USER_ID'
    AND created_at > now() - interval '24 hours'
)
SELECT * FROM timeline 
ORDER BY created_at ASC;
```

#### 3.2 Attack Vector Analysis
```sql
-- Analyze attack patterns
SELECT 
  ip_address,
  user_agent,
  COUNT(*) as attempts,
  ARRAY_AGG(DISTINCT event_type) as attack_types,
  MIN(created_at) as first_seen,
  MAX(created_at) as last_seen
FROM security_events 
WHERE created_at > now() - interval '24 hours'
  AND severity IN ('medium', 'high', 'critical')
GROUP BY ip_address, user_agent
ORDER BY COUNT(*) DESC;
```

#### 3.3 Lateral Movement Detection
```sql
-- Check for privilege escalation
SELECT 
  user_id,
  old_data->>'role' as old_role,
  new_data->>'role' as new_role,
  created_at
FROM security_audit_log 
WHERE table_name = 'profiles'
  AND 'role' = ANY(changed_fields)
  AND created_at > now() - interval '7 days'
ORDER BY created_at DESC;
```

### Phase 4: Eradication & Recovery (1-4 hours)

#### 4.1 Remove Threat
```sql
-- Clean malicious data/access
-- (Specific to incident type)

-- Log remediation actions
SELECT public.log_security_event(
  'threat_removed',
  auth.uid(),
  NULL,
  NULL,
  jsonb_build_object(
    'incident_id', 'INC-2025-XXX',
    'remediation_type', 'malicious_data_removed',
    'affected_records', 42
  ),
  'info'
);
```

#### 4.2 System Restoration
```sql
-- Restore normal operations
UPDATE profiles 
SET role = 'user' 
WHERE id = 'PREVIOUSLY_SUSPENDED_USER_ID'
  AND role = 'suspended';

-- Verify system integrity
SELECT 
  table_name,
  COUNT(*) as record_count
FROM (
  SELECT 'profiles' as table_name FROM profiles
  UNION ALL SELECT 'business_partners' FROM business_partners
  UNION ALL SELECT 'security_events' FROM security_events
) t
GROUP BY table_name;
```

### Phase 5: Post-Incident (4-24 hours)

#### 5.1 Incident Documentation
```sql
-- Create incident report record
INSERT INTO security_events (
  event_type,
  user_id,
  severity,
  details
) VALUES (
  'incident_report',
  auth.uid(),
  'info',
  jsonb_build_object(
    'incident_id', 'INC-2025-XXX',
    'type', 'account_compromise',
    'duration_minutes', 120,
    'affected_users', 1,
    'root_cause', 'weak_password',
    'lessons_learned', 'Implement stronger password policy'
  )
);
```

#### 5.2 Alert Resolution
```sql
-- Resolve all related alerts
SELECT public.resolve_security_alert(
  alert.id,
  auth.uid()
) 
FROM security_alerts alert
WHERE alert.metadata->>'incident_id' = 'INC-2025-XXX'
  AND alert.resolved = false;
```

## 📞 Escalation Contacts

### Internal Team
- **Tech Lead**: tech-lead@matbakh.app (Critical: +49 XXX XXX XXXX)
- **DevOps**: devops@matbakh.app
- **Legal**: legal@matbakh.app (for data breaches)

### External Contacts
- **Hosting Provider**: Vercel/Supabase Support
- **Security Partner**: TBD
- **Legal Counsel**: TBD

## 📋 Post-Incident Checklist

- [ ] Incident timeline documented
- [ ] Root cause identified
- [ ] All affected systems restored
- [ ] Users notified (if required)
- [ ] Regulatory notifications sent (if required)
- [ ] Security controls updated
- [ ] Team debriefing scheduled
- [ ] Incident report published internally
- [ ] Lessons learned implemented

## 🔄 Lessons Learned Process

### Incident Review Meeting (within 48h)
1. **What happened?** - Factual timeline
2. **Why did it happen?** - Root cause analysis
3. **How did we respond?** - Response effectiveness
4. **What can we improve?** - Process/technical improvements

### Action Items
```sql
-- Track improvement actions
INSERT INTO security_events (
  event_type,
  user_id,
  severity,
  details
) VALUES (
  'improvement_action',
  auth.uid(),
  'info',
  jsonb_build_object(
    'incident_id', 'INC-2025-XXX',
    'action', 'implement_2fa_enforcement',
    'owner', 'security_team',
    'due_date', '2025-02-15',
    'priority', 'high'
  )
);
```

---

**🔒 Remember:**
- **Speed** over perfection in initial response
- **Document** everything for forensics
- **Communicate** with stakeholders regularly
- **Learn** from every incident

**Emergency Hotline**: +49 XXX XXX XXXX (24/7)