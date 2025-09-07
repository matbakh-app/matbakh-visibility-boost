# Current Database Schema State

**Last Updated**: September 2, 2025  
**Schema Version**: Task 12.1 - Post Migration Consolidation  
**Status**: 🔄 In Progress - Schema Conflicts Being Resolved

## 🎯 Current Situation

We are in the middle of **Task 12.1: Database Migration Consolidation** where we're resolving schema conflicts that have accumulated over multiple migration phases.

### 🚨 Active Issues Being Resolved

1. **service_packages Table Conflict**
   - Old table exists with different structure (missing `code` column)
   - New migration expects modern structure
   - **Solution**: Consolidated migration with proper table recreation

2. **Constraint Conflicts**
   - Duplicate unique constraints being created
   - **Solution**: Idempotent constraint creation with existence checks

3. **Column Mismatches**
   - Some tables reference columns that don't exist in current schema
   - **Solution**: Schema analysis and column alignment

## 📊 Core Tables Overview

### ✅ Stable Tables (Production Ready)

| Table | Purpose | Status | RLS |
|-------|---------|--------|-----|
| `profiles` | User management with RBAC | ✅ Stable | ✅ |
| `private_profiles` | GDPR-compliant private data | ✅ Stable | ✅ |
| `user_uploads` | S3 file management | ✅ Stable | ✅ |
| `user_consent_tracking` | DSGVO compliance | ✅ Stable | ✅ |
| `visibility_check_leads` | VC lead management | ✅ Stable | ✅ |
| `vc_results` | VC analysis results | ✅ Stable | ✅ |
| `feature_flags` | System configuration | ✅ Stable | ❌ |

### 🔄 Tables Under Migration (Task 12.1)

| Table | Issue | Resolution |
|-------|-------|------------|
| `service_packages` | Structure mismatch | Recreating with correct schema |
| `service_prices` | Constraint conflicts | Idempotent constraint creation |
| `business_profiles` | Missing columns | Adding missing columns safely |
| `partner_bookings` | Schema drift | Column alignment |

### 📋 Planned Tables (Post Task 12.1)

| Table | Purpose | Priority |
|-------|---------|----------|
| `google_job_queue` | GMB automation | High |
| `billing_events` | Partner billing | High |
| `partner_upload_quota` | Upload limits | Medium |

## 🔧 Current Migration Strategy

### Phase 1: Schema Consolidation (In Progress)
```sql
-- Master migration approach
-- 1. Archive problematic migrations
-- 2. Create consolidated migration
-- 3. Handle data migration safely
-- 4. Apply idempotent fixes
```

### Phase 2: Data Integrity Verification
- Verify all foreign key relationships
- Check constraint compliance
- Validate RLS policies
- Test data access patterns

### Phase 3: Performance Optimization
- Review and optimize indexes
- Analyze query performance
- Update statistics

## 🏗 Schema Architecture

### Authentication & Authorization
```
auth.users (Supabase)
    ↓
profiles (public, RBAC)
    ↓
private_profiles (GDPR separated)
```

### Business Logic Flow
```
vc_leads → business_candidates → vc_results
    ↓
business_partners → partner_credit_transactions
    ↓
content_queue → social_media_posts
```

### File Management
```
user_uploads (metadata)
    ↓
S3 Buckets (actual files)
    ↓
Lambda Functions (processing)
```

## 🔒 Security Status

### Row Level Security (RLS)
- ✅ **Enabled** on all user-facing tables
- ✅ **Policies** properly configured for role-based access
- ✅ **Admin access** controlled via role hierarchy

### Data Protection
- ✅ **GDPR compliance** with separated private data
- ✅ **Consent tracking** implemented
- ✅ **Audit logging** for sensitive operations

## 📈 Performance Considerations

### Indexes
- ✅ Primary keys and foreign keys indexed
- ✅ Query-specific indexes for VC workflows
- ✅ Composite indexes for complex queries

### Query Patterns
- Most queries are user-scoped (RLS filtered)
- VC analysis queries are read-heavy
- Partner credit operations are transactional

## 🚀 Next Steps (Post Task 12.1)

1. **Complete Schema Consolidation**
   - Resolve remaining migration conflicts
   - Verify data integrity
   - Update documentation

2. **RDS Migration Preparation (Task 12.2)**
   - Export current schema
   - Prepare RDS infrastructure
   - Plan data migration strategy

3. **Performance Optimization**
   - Review slow queries
   - Optimize indexes
   - Update query patterns

## 📝 Migration Commands

### Current Deployment
```bash
# Apply consolidated migration
./scripts/master-migration-fix.sh

# Verify schema state
supabase db diff --schema public
```

### Rollback Plan
```bash
# If issues occur, rollback to last stable state
supabase db reset --db-url $SUPABASE_DB_URL
```

## 🔍 Verification Queries

### Check Table Structure
```sql
-- Verify service_packages structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'service_packages' 
ORDER BY ordinal_position;

-- Check RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true;
```

### Check Data Integrity
```sql
-- Verify user profiles
SELECT COUNT(*) as total_users,
       COUNT(CASE WHEN role = 'super_admin' THEN 1 END) as super_admins
FROM profiles;

-- Check VC system health
SELECT status, COUNT(*) 
FROM visibility_check_leads 
GROUP BY status;
```

## 📞 Support

For schema-related issues during Task 12.1:
- Check [Migration Troubleshooting](troubleshooting.md)
- Review [Migration Log](migration-log.md)
- Contact: Database team via Slack #database-migrations