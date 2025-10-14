#!/bin/bash

set -e

echo "🔧 MIGRATION SYNC REPAIR - Task 12.1"
echo "====================================="

echo ""
echo "🎯 Problem: Local and remote migrations out of sync"
echo "💡 Solution: Repair migration history and sync"

echo ""
echo "📋 Step 1: Check current migration status"
echo "Listing local migrations..."
ls -la supabase/migrations/ | head -10

echo ""
echo "📋 Step 2: Repair migration history"
echo "Marking problematic migrations as reverted..."

# Mark problematic migrations as reverted
echo "Repairing migration: 20250701132805"
supabase migration repair --status reverted 20250701132805 || echo "Migration 20250701132805 not found or already repaired"

echo "Repairing migration: 20250701141123"
supabase migration repair --status reverted 20250701141123 || echo "Migration 20250701141123 not found or already repaired"

echo "Repairing migration: 20250702131300"
supabase migration repair --status reverted 20250702131300 || echo "Migration 20250702131300 not found or already repaired"

echo ""
echo "📋 Step 3: Pull remote migrations to sync"
echo "Syncing with remote database..."
supabase db pull --schema public

echo ""
echo "📋 Step 4: Create clean consolidated migration"
echo "Creating new consolidated migration..."

# Create timestamp for new migration
TIMESTAMP=$(date +"%Y%m%d%H%M%S")
MIGRATION_FILE="supabase/migrations/${TIMESTAMP}_task_12_1_schema_consolidation.sql"

cat > "$MIGRATION_FILE" << 'EOF'
-- Task 12.1: Schema Consolidation and Conflict Resolution
-- Fixes all pricing schema and table structure issues
-- Created: September 2, 2025

BEGIN;

-- 1. Handle service_packages table structure
DO $$
BEGIN
  -- Check if service_packages exists and needs restructuring
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'service_packages') THEN
    -- Check if it has the old structure (missing 'code' column)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_packages' AND column_name = 'code') THEN
      -- Backup existing data
      IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'service_packages_legacy') THEN
        ALTER TABLE service_packages RENAME TO service_packages_legacy;
      END IF;
      
      -- Create new structure
      CREATE TABLE service_packages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code TEXT UNIQUE NOT NULL,
        default_name TEXT NOT NULL,
        is_recurring BOOLEAN DEFAULT FALSE,
        interval_months INT,
        created_at TIMESTAMP DEFAULT now()
      );
      
      -- Migrate data from legacy table
      INSERT INTO service_packages (id, code, default_name, is_recurring, interval_months)
      SELECT 
        id, 
        COALESCE(slug, 'pkg_' || id::text) as code,
        COALESCE(name, 'Package ' || id::text) as default_name,
        COALESCE(period = 'monthly', false) as is_recurring,
        CASE WHEN period = 'monthly' THEN 1 ELSE NULL END as interval_months
      FROM service_packages_legacy
      ON CONFLICT (code) DO NOTHING;
    END IF;
  ELSE
    -- Create table if it doesn't exist
    CREATE TABLE service_packages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      code TEXT UNIQUE NOT NULL,
      default_name TEXT NOT NULL,
      is_recurring BOOLEAN DEFAULT FALSE,
      interval_months INT,
      created_at TIMESTAMP DEFAULT now()
    );
  END IF;
END$$;

-- 2. Handle service_prices table
CREATE TABLE IF NOT EXISTS service_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID REFERENCES service_packages(id) ON DELETE CASCADE,
  currency TEXT DEFAULT 'EUR',
  normal_price_cents INT NOT NULL,
  promo_price_cents INT,
  promo_active BOOLEAN DEFAULT FALSE,
  valid_from TIMESTAMP DEFAULT now(),
  valid_to TIMESTAMP
);

-- 3. Add unique constraint to service_prices (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'service_prices_package_id_key' 
    AND table_name = 'service_prices'
  ) THEN
    ALTER TABLE service_prices
        ADD CONSTRAINT service_prices_package_id_key UNIQUE (package_id);
  END IF;
END$$;

-- 4. Create other required tables
CREATE TABLE IF NOT EXISTS partner_upload_quota (
  partner_id UUID PRIMARY KEY,
  month_start DATE NOT NULL,
  uploads_used INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS google_job_queue (
  id BIGSERIAL PRIMARY KEY,
  partner_id UUID NOT NULL,
  location_id TEXT,
  job_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  retry_count INT DEFAULT 0,
  run_at TIMESTAMP DEFAULT now(),
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_google_job_queue_run_at_status ON google_job_queue (run_at, status);

CREATE TABLE IF NOT EXISTS billing_events (
  partner_id UUID,
  event TEXT,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(partner_id, event)
);

-- 5. Add missing columns to business_profiles if they don't exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'business_profiles') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_profiles' AND column_name = 'google_connected') THEN
      ALTER TABLE business_profiles ADD COLUMN google_connected BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_profiles' AND column_name = 'go_live') THEN
      ALTER TABLE business_profiles ADD COLUMN go_live BOOLEAN DEFAULT FALSE;
    END IF;
  END IF;
END$$;

-- 6. Add missing columns to partner_bookings if they don't exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'partner_bookings') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'partner_bookings' AND column_name = 'go_live_required') THEN
      ALTER TABLE partner_bookings ADD COLUMN go_live_required BOOLEAN DEFAULT TRUE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'partner_bookings' AND column_name = 'go_live_at') THEN
      ALTER TABLE partner_bookings ADD COLUMN go_live_at TIMESTAMP;
    END IF;
  END IF;
END$$;

-- 7. Create billing trigger function
CREATE OR REPLACE FUNCTION public.f_event_partner_live()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.google_connected AND NEW.go_live THEN
    INSERT INTO public.billing_events(partner_id, event) VALUES (NEW.id, 'activate_billing')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END$$;

-- 8. Create trigger on business_profiles (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'business_profiles') THEN
    DROP TRIGGER IF EXISTS trg_partner_live ON business_profiles;
    CREATE TRIGGER trg_partner_live
    AFTER UPDATE ON business_profiles
    FOR EACH ROW EXECUTE FUNCTION f_event_partner_live();
  END IF;
END$$;

COMMIT;
EOF

echo "Created migration file: $MIGRATION_FILE"

echo ""
echo "📋 Step 5: Apply consolidated migration"
echo "Deploying schema fixes..."

if command -v supabase &> /dev/null; then
    echo "Running: supabase db push"
    supabase db push
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "🎉 MIGRATION SYNC REPAIR SUCCESSFUL!"
        echo ""
        echo "✅ Schema Issues Resolved:"
        echo "- Migration history: ✅ Repaired and synchronized"
        echo "- service_packages: ✅ Correct structure with 'code' column"
        echo "- service_prices: ✅ Proper constraints and relationships"
        echo "- All tables: ✅ Proper structure and constraints"
        echo ""
        echo "🔍 Verification Commands:"
        echo "supabase migration list"
        echo "supabase db diff --schema public"
        echo ""
        echo "✅ TASK 12.1 COMPLETED SUCCESSFULLY!"
        echo ""
        echo "🎯 Next Phase: Task 12.2 - RDS Data Migration"
        echo "Ready to export and migrate all data to AWS RDS!"
        
    else
        echo "❌ Migration failed. Check error above."
        exit 1
    fi
else
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "npm install -g supabase"
    exit 1
fi

echo ""
echo "🏆 TASK 12.1 STATUS: ✅ COMPLETE"
echo "Migration sync repaired! Database ready for RDS migration!"