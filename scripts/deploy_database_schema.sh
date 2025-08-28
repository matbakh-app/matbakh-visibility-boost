#!/bin/bash

# =========================================================
# MATBAKH.APP DATABASE SCHEMA DEPLOYMENT
# Deploys database schema in correct order
# =========================================================

set -e  # Exit on any error

echo "🚀 Starting matbakh.app database schema deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to execute SQL file
execute_sql() {
    local file=$1
    local description=$2
    
    echo -e "${YELLOW}📄 Executing: $description${NC}"
    echo "   File: $file"
    
    if [ ! -f "$file" ]; then
        echo -e "${RED}❌ File not found: $file${NC}"
        exit 1
    fi
    
    # Execute SQL file using Supabase CLI
    if supabase db reset --db-url "$DATABASE_URL" --file "$file"; then
        echo -e "${GREEN}✅ Success: $description${NC}"
    else
        echo -e "${RED}❌ Failed: $description${NC}"
        exit 1
    fi
    
    echo ""
}

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ DATABASE_URL environment variable is not set${NC}"
    echo "Please set DATABASE_URL to your Supabase database connection string"
    echo "Example: postgresql://postgres:[password]@[host]:5432/postgres"
    exit 1
fi

echo "🔗 Using database: ${DATABASE_URL%@*}@[HIDDEN]"
echo ""

# =========================================================
# DEPLOYMENT ORDER (CRITICAL!)
# =========================================================

echo "📋 Deployment Plan:"
echo "1. Complete Schema (tables, indexes, functions)"
echo "2. Feature Flags"
echo "3. RBAC & Security"
echo "4. Sample Data"
echo ""

# 1. Core schema with all tables
execute_sql "supabase/sql/matbakh_complete_schema.sql" "Complete matbakh.app schema"

# 2. Feature flags (if separate file exists)
if [ -f "supabase/sql/feature_flags.sql" ]; then
    execute_sql "supabase/sql/feature_flags.sql" "Feature flags configuration"
fi

# 3. Mail system (if needed)
if [ -f "supabase/sql/mail_system.sql" ]; then
    execute_sql "supabase/sql/mail_system.sql" "Mail system configuration"
fi

# 4. Development seed data (optional)
if [ -f "supabase/sql/dev_seed.sql" ] && [ "$ENVIRONMENT" = "development" ]; then
    execute_sql "supabase/sql/dev_seed.sql" "Development seed data"
fi

echo -e "${GREEN}🎉 Database schema deployment completed successfully!${NC}"
echo ""

# =========================================================
# VERIFICATION
# =========================================================

echo "🔍 Verifying deployment..."

# Check if key tables exist
echo "📊 Table verification:"
psql "$DATABASE_URL" -c "
SELECT 
    schemaname,
    tablename,
    case when has_table_privilege('public.' || tablename, 'SELECT') then '✅' else '❌' end as accessible
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename NOT LIKE 'pg_%'
ORDER BY tablename;
" || echo -e "${RED}❌ Table verification failed${NC}"

# Check super admin users
echo ""
echo "👑 Super admin verification:"
psql "$DATABASE_URL" -c "
SELECT 
    u.email,
    p.role,
    p.display_name,
    CASE WHEN bp.partner_code IS NOT NULL THEN bp.partner_code ELSE 'No partner' END as partner_code
FROM auth.users u
JOIN public.profiles p ON p.id = u.id
LEFT JOIN public.business_partners bp ON bp.user_id = u.id
WHERE p.role IN ('admin', 'super_admin')
ORDER BY u.email;
" || echo -e "${RED}❌ Super admin verification failed${NC}"

# Check feature flags
echo ""
echo "🚩 Feature flags verification:"
psql "$DATABASE_URL" -c "
SELECT key, value, enabled
FROM public.feature_flags
ORDER BY key;
" || echo -e "${RED}❌ Feature flags verification failed${NC}"

echo ""
echo -e "${GREEN}✅ All verifications completed!${NC}"
echo ""
echo "🎯 Next steps:"
echo "1. Test authentication: https://matbakh.app/login"
echo "2. Test admin access: https://matbakh.app/admin"
echo "3. Test VC flow: https://matbakh.app/vc/quick"
echo "4. Test dashboard: https://matbakh.app/dashboard"
echo ""
echo -e "${GREEN}🚀 matbakh.app is ready for production!${NC}"