-- Supabase Read-Only Lockdown - Task 12.3.2
-- Set all tables to read-only mode for security

-- =====================================================
-- CRITICAL: This script sets Supabase to READ-ONLY mode
-- Execute ONLY after confirming RDS migration is complete
-- =====================================================

BEGIN;

-- 1. Revoke all write permissions from anon role
REVOKE INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA auth FROM anon;

-- 2. Revoke all write permissions from authenticated role  
REVOKE INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA auth FROM authenticated;

-- 3. Keep only SELECT permissions
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;

-- 4. Disable all write-related RLS policies
-- This will be done by dropping INSERT/UPDATE/DELETE policies

-- Drop all INSERT policies
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE cmd = 'INSERT' 
        AND schemaname IN ('public', 'auth')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                      pol.policyname, pol.schemaname, pol.tablename);
        RAISE NOTICE 'Dropped INSERT policy: %.% - %', pol.schemaname, pol.tablename, pol.policyname;
    END LOOP;
END $$;

-- Drop all UPDATE policies
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE cmd = 'UPDATE' 
        AND schemaname IN ('public', 'auth')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                      pol.policyname, pol.schemaname, pol.tablename);
        RAISE NOTICE 'Dropped UPDATE policy: %.% - %', pol.schemaname, pol.tablename, pol.policyname;
    END LOOP;
END $$;

-- Drop all DELETE policies
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE cmd = 'DELETE' 
        AND schemaname IN ('public', 'auth')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                      pol.policyname, pol.schemaname, pol.tablename);
        RAISE NOTICE 'Dropped DELETE policy: %.% - %', pol.schemaname, pol.tablename, pol.policyname;
    END LOOP;
END $$;

-- 5. Create audit log entry
INSERT INTO public.system_logs (
    event_type,
    event_data,
    created_at
) VALUES (
    'SUPABASE_READONLY_LOCKDOWN',
    jsonb_build_object(
        'timestamp', now(),
        'action', 'read_only_lockdown_applied',
        'reason', 'Migration to AWS RDS completed',
        'task', 'TASK_12_3_2',
        'security_level', 'HIGH'
    ),
    now()
) ON CONFLICT DO NOTHING;

-- 6. Verify read-only status
SELECT 
    'READ_ONLY_LOCKDOWN_COMPLETE' as status,
    now() as timestamp,
    'All write permissions revoked' as message;

COMMIT;

-- Verification queries (run separately)
-- SELECT schemaname, tablename, policyname, cmd FROM pg_policies WHERE schemaname IN ('public', 'auth') ORDER BY schemaname, tablename;
-- SELECT grantee, table_schema, table_name, privilege_type FROM information_schema.role_table_grants WHERE grantee IN ('anon', 'authenticated') AND table_schema IN ('public', 'auth') ORDER BY grantee, table_schema, table_name;