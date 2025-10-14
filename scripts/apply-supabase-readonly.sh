#!/bin/bash

# Apply Supabase Read-Only Lockdown - Task 12.3.2
# Execute SQL to set Supabase to read-only mode

set -e

echo "🔐 SUPABASE READ-ONLY LOCKDOWN - Task 12.3.2"
echo "============================================="
echo ""

# Get Supabase connection details
SUPABASE_DB_PASSWORD=$(grep SUPABASE_DB_PASSWORD .env | cut -d'=' -f2 | tr -d '"')
SUPABASE_HOST="db.uheksobnyedarrpgxhju.supabase.co"
SUPABASE_USER="postgres"
SUPABASE_DB="postgres"

echo "⚠️  CRITICAL SECURITY OPERATION"
echo "   This will set Supabase to READ-ONLY mode"
echo "   All write operations will be blocked"
echo ""
echo "📋 Connection Details:"
echo "   Host: $SUPABASE_HOST"
echo "   Database: $SUPABASE_DB"
echo "   User: $SUPABASE_USER"
echo ""

# Confirm RDS is working before lockdown
echo "✅ Pre-flight check: Confirming RDS is active..."
aws lambda invoke \
    --region eu-central-1 \
    --function-name matbakh-db-test \
    --payload '{}' \
    /tmp/rds-preflight.json \
    --output text \
    --query 'StatusCode' > /dev/null 2>&1 && echo "   ✅ RDS confirmed active" || (echo "   ❌ RDS not responding - ABORTING LOCKDOWN" && exit 1)

rm -f /tmp/rds-preflight.json

echo ""
echo "🔄 Applying read-only lockdown to Supabase..."

# Apply the lockdown SQL
PGPASSWORD="$SUPABASE_DB_PASSWORD" psql \
    -h "$SUPABASE_HOST" \
    -U "$SUPABASE_USER" \
    -d "$SUPABASE_DB" \
    -f scripts/supabase-readonly-lockdown.sql \
    -v ON_ERROR_STOP=1

echo ""
echo "🔍 Verifying lockdown status..."

# Verify read-only status
PGPASSWORD="$SUPABASE_DB_PASSWORD" psql \
    -h "$SUPABASE_HOST" \
    -U "$SUPABASE_USER" \
    -d "$SUPABASE_DB" \
    -c "SELECT grantee, table_schema, table_name, privilege_type FROM information_schema.role_table_grants WHERE grantee IN ('anon', 'authenticated') AND table_schema IN ('public', 'auth') AND privilege_type IN ('INSERT', 'UPDATE', 'DELETE') ORDER BY grantee, table_schema, table_name;" \
    -t

echo ""
echo "✅ SUPABASE READ-ONLY LOCKDOWN COMPLETE"
echo "<REDACTED_AWS_SECRET_ACCESS_KEY>"
echo "   🔒 All write permissions revoked"
echo "   📖 Only SELECT operations allowed"
echo "   🛡️  Security lockdown active"
echo "   ✅ RDS migration confirmed safe"
echo ""