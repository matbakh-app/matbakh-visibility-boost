#!/bin/bash
set -euo pipefail

# Simple RDS Connection Test
# Quick test to verify RDS connectivity before migration

RDS_ENDPOINT="matbakh-db.chq6q4cs0evx.eu-central-1.rds.amazonaws.com"
RDS_PORT="5432"
RDS_USER="postgres"
RDS_DB="postgres"

echo "🧪 RDS CONNECTION TEST"
echo "====================="
echo "Endpoint: $RDS_ENDPOINT"
echo "Port: $RDS_PORT"
echo "User: $RDS_USER"
echo "Database: $RDS_DB"
echo ""

# Check if password is provided
if [ -z "${RDS_PASSWORD:-}" ]; then
    echo "❌ RDS_PASSWORD environment variable not set"
    echo ""
    echo "💡 Set password with one of these methods:"
    echo "   export RDS_PASSWORD='your-password'"
    echo "   read -s RDS_PASSWORD && export RDS_PASSWORD"
    echo ""
    exit 1
fi

echo "🔍 Testing connection..."

# Test 1: Basic connectivity
echo "📡 Test 1: Basic Connection"
if PGPASSWORD="$RDS_PASSWORD" psql -h "$RDS_ENDPOINT" -U "$RDS_USER" -d "$RDS_DB" -c "SELECT 1;" > /dev/null 2>&1; then
    echo "   ✅ Connection successful"
else
    echo "   ❌ Connection failed"
    echo ""
    echo "🔧 Troubleshooting steps:"
    echo "   1. Check if RDS is publicly accessible or use bastion host"
    echo "   2. Verify security group allows your IP on port 5432"
    echo "   3. Confirm password is correct"
    echo "   4. Run ./diagnose-rds-connectivity.sh for detailed analysis"
    echo ""
    exit 1
fi

# Test 2: PostgreSQL version
echo ""
echo "📋 Test 2: PostgreSQL Version"
PG_VERSION=$(PGPASSWORD="$RDS_PASSWORD" psql -h "$RDS_ENDPOINT" -U "$RDS_USER" -d "$RDS_DB" -tAc "SELECT version();" 2>/dev/null | head -1)
echo "   ✅ Version: $PG_VERSION"

# Test 3: Database permissions
echo ""
echo "🔐 Test 3: Database Permissions"
if PGPASSWORD="$RDS_PASSWORD" psql -h "$RDS_ENDPOINT" -U "$RDS_USER" -d "$RDS_DB" -c "CREATE TABLE test_permissions (id int); DROP TABLE test_permissions;" > /dev/null 2>&1; then
    echo "   ✅ Create/Drop permissions: OK"
else
    echo "   ❌ Create/Drop permissions: FAILED"
    echo "   ⚠️  User may not have sufficient privileges"
fi

# Test 4: Check existing databases
echo ""
echo "🗄️  Test 4: Existing Databases"
DATABASES=$(PGPASSWORD="$RDS_PASSWORD" psql -h "$RDS_ENDPOINT" -U "$RDS_USER" -d "$RDS_DB" -tAc "SELECT datname FROM pg_database WHERE datistemplate = false;" 2>/dev/null | tr '\n' ' ')
echo "   📋 Databases: $DATABASES"

# Check if matbakh database exists
if echo "$DATABASES" | grep -q "matbakh"; then
    echo "   ✅ 'matbakh' database already exists"
    
    # Count tables in matbakh database
    TABLE_COUNT=$(PGPASSWORD="$RDS_PASSWORD" psql -h "$RDS_ENDPOINT" -U "$RDS_USER" -d "matbakh" -tAc "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null || echo "0")
    echo "   📊 Tables in matbakh: $TABLE_COUNT"
else
    echo "   ℹ️  'matbakh' database does not exist (will be created during migration)"
fi

# Test 5: Connection performance
echo ""
echo "⚡ Test 5: Connection Performance"
start_time=$(date +%s%N)
PGPASSWORD="$RDS_PASSWORD" psql -h "$RDS_ENDPOINT" -U "$RDS_USER" -d "$RDS_DB" -c "SELECT pg_sleep(0.1);" > /dev/null 2>&1
end_time=$(date +%s%N)
duration=$(( (end_time - start_time) / 1000000 ))
echo "   ⏱️  Query response time: ${duration}ms"

if [ $duration -lt 500 ]; then
    echo "   ✅ Performance: Excellent"
elif [ $duration -lt 1000 ]; then
    echo "   ✅ Performance: Good"
elif [ $duration -lt 2000 ]; then
    echo "   ⚠️  Performance: Acceptable"
else
    echo "   ❌ Performance: Slow (may indicate network issues)"
fi

echo ""
echo "🎉 CONNECTION TEST COMPLETE"
echo "=========================="
echo ""
echo "✅ RDS is accessible and ready for migration"
echo "✅ PostgreSQL version: $(echo $PG_VERSION | cut -d' ' -f2)"
echo "✅ Connection performance: ${duration}ms"
echo ""
echo "🚀 Ready to run migration:"
echo "   ./migrate-schema-to-rds.sh"
echo ""
echo "📋 Or run full diagnosis:"
echo "   ./diagnose-rds-connectivity.sh"