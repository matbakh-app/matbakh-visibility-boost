#!/bin/bash
set -euo pipefail

# Complete RDS Schema Migration Script
# Handles database creation, schema migration, and validation

REGION=${AWS_REGION:-eu-central-1}
PROFILE=${AWS_PROFILE:-matbakh-dev}
RDS_ENDPOINT="matbakh-db.chq6q4cs0evx.eu-central-1.rds.amazonaws.com"
DB_NAME="matbakh"

echo "🚀 RDS SCHEMA MIGRATION"
echo "======================="
echo "Region: $REGION"
echo "Profile: $PROFILE"
echo "RDS Endpoint: $RDS_ENDPOINT"
echo "Database: $DB_NAME"
echo ""

# Check if password is provided
if [ -z "${RDS_PASSWORD:-}" ]; then
    echo "❌ RDS_PASSWORD environment variable not set"
    echo "💡 Set it with: export RDS_PASSWORD='your-password'"
    echo "💡 Or run: read -s RDS_PASSWORD && export RDS_PASSWORD"
    exit 1
fi

# Step 1: Test Connection
echo "🔍 Step 1: Testing RDS Connection"
echo "================================="
if PGPASSWORD="$RDS_PASSWORD" psql -h "$RDS_ENDPOINT" -U postgres -d postgres -c "SELECT version();" > /dev/null 2>&1; then
    echo "✅ Connection successful"
    PG_VERSION=$(PGPASSWORD="$RDS_PASSWORD" psql -h "$RDS_ENDPOINT" -U postgres -d postgres -tAc "SELECT version();" | head -1)
    echo "📋 PostgreSQL Version: $PG_VERSION"
else
    echo "❌ Connection failed"
    echo ""
    echo "🔧 Troubleshooting:"
    echo "   1. Check if RDS is publicly accessible or use bastion host"
    echo "   2. Verify security group allows your IP on port 5432"
    echo "   3. Confirm RDS_PASSWORD is correct"
    echo "   4. Run ./diagnose-rds-connectivity.sh for detailed analysis"
    exit 1
fi

# Step 2: Database Preparation
echo ""
echo "🗄️  Step 2: Database Preparation"
echo "================================"
echo "🔍 Checking if database '$DB_NAME' exists..."

DB_EXISTS=$(PGPASSWORD="$RDS_PASSWORD" psql -h "$RDS_ENDPOINT" -U postgres -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME';" 2>/dev/null || echo "")

if [ "$DB_EXISTS" = "1" ]; then
    echo "✅ Database '$DB_NAME' already exists"
    
    # Check if database has tables
    TABLE_COUNT=$(PGPASSWORD="$RDS_PASSWORD" psql -h "$RDS_ENDPOINT" -U postgres -d "$DB_NAME" -tAc "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null || echo "0")
    echo "📊 Existing tables: $TABLE_COUNT"
    
    if [ "$TABLE_COUNT" -gt "0" ]; then
        echo "⚠️  Database contains $TABLE_COUNT tables"
        read -p "Do you want to continue? This may overwrite existing data (yes/no): " confirm
        if [ "$confirm" != "yes" ]; then
            echo "❌ Migration cancelled"
            exit 1
        fi
    fi
else
    echo "🔧 Creating database '$DB_NAME'..."
    PGPASSWORD="$RDS_PASSWORD" psql -h "$RDS_ENDPOINT" -U postgres -d postgres -c "CREATE DATABASE $DB_NAME;"
    echo "✅ Database '$DB_NAME' created"
fi

# Step 3: Schema File Validation
echo ""
echo "📋 Step 3: Schema File Validation"
echo "================================="

SCHEMA_FILE="supabase/sql/matbakh_complete_schema.sql"
RBAC_FILE="supabase/sql/rbac_production_final.sql"

if [ ! -f "$SCHEMA_FILE" ]; then
    echo "❌ Schema file not found: $SCHEMA_FILE"
    echo "💡 Make sure you're running this from the project root directory"
    exit 1
fi

echo "✅ Found schema file: $SCHEMA_FILE"

# Analyze schema file
echo "📊 Analyzing schema file..."
TABLE_COUNT=$(grep -c "CREATE TABLE" "$SCHEMA_FILE" 2>/dev/null || echo "0")
FUNCTION_COUNT=$(grep -c "CREATE FUNCTION\|CREATE OR REPLACE FUNCTION" "$SCHEMA_FILE" 2>/dev/null || echo "0")
INDEX_COUNT=$(grep -c "CREATE INDEX\|CREATE UNIQUE INDEX" "$SCHEMA_FILE" 2>/dev/null || echo "0")
TRIGGER_COUNT=$(grep -c "CREATE TRIGGER" "$SCHEMA_FILE" 2>/dev/null || echo "0")

echo "   📋 Tables to create: $TABLE_COUNT"
echo "   🔧 Functions to create: $FUNCTION_COUNT"
echo "   📇 Indexes to create: $INDEX_COUNT"
echo "   ⚡ Triggers to create: $TRIGGER_COUNT"

# Check for RBAC file
if [ -f "$RBAC_FILE" ]; then
    echo "✅ Found RBAC file: $RBAC_FILE"
    RBAC_AVAILABLE=true
else
    echo "⚠️  RBAC file not found: $RBAC_FILE"
    echo "   Migration will continue without RBAC setup"
    RBAC_AVAILABLE=false
fi

# Step 4: Schema Migration
echo ""
echo "🚀 Step 4: Schema Migration"
echo "==========================="
echo "📤 Running schema migration..."

# Create log file
LOG_FILE="migration-$(date +%Y%m%d-%H%M%S).log"
echo "📝 Logging to: $LOG_FILE"

# Run schema migration
if PGPASSWORD="$RDS_PASSWORD" psql -h "$RDS_ENDPOINT" -U postgres -d "$DB_NAME" -f "$SCHEMA_FILE" > "$LOG_FILE" 2>&1; then
    echo "✅ Schema migration completed successfully"
    
    # Count created tables
    CREATED_TABLES=$(PGPASSWORD="$RDS_PASSWORD" psql -h "$RDS_ENDPOINT" -U postgres -d "$DB_NAME" -tAc "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null || echo "0")
    echo "📊 Tables created: $CREATED_TABLES"
    
    # Check for errors in log
    ERROR_COUNT=$(grep -i "error\|failed\|exception" "$LOG_FILE" | wc -l || echo "0")
    if [ "$ERROR_COUNT" -gt "0" ]; then
        echo "⚠️  Found $ERROR_COUNT potential errors in migration log"
        echo "📋 Recent errors:"
        grep -i "error\|failed\|exception" "$LOG_FILE" | tail -5
    fi
else
    echo "❌ Schema migration failed"
    echo "📋 Error details (last 10 lines):"
    tail -10 "$LOG_FILE"
    echo ""
    echo "💡 Check the full log: $LOG_FILE"
    exit 1
fi

# Step 5: RBAC Migration (if available)
if [ "$RBAC_AVAILABLE" = true ]; then
    echo ""
    echo "🔐 Step 5: RBAC Migration"
    echo "========================"
    echo "📤 Running RBAC migration..."
    
    RBAC_LOG_FILE="rbac-$(date +%Y%m%d-%H%M%S).log"
    
    if PGPASSWORD="$RDS_PASSWORD" psql -h "$RDS_ENDPOINT" -U postgres -d "$DB_NAME" -f "$RBAC_FILE" > "$RBAC_LOG_FILE" 2>&1; then
        echo "✅ RBAC migration completed successfully"
        
        # Check for RBAC errors
        RBAC_ERROR_COUNT=$(grep -i "error\|failed\|exception" "$RBAC_LOG_FILE" | wc -l || echo "0")
        if [ "$RBAC_ERROR_COUNT" -gt "0" ]; then
            echo "⚠️  Found $RBAC_ERROR_COUNT potential errors in RBAC log"
            echo "📋 Recent errors:"
            grep -i "error\|failed\|exception" "$RBAC_LOG_FILE" | tail -3
        fi
    else
        echo "❌ RBAC migration failed"
        echo "📋 Error details (last 5 lines):"
        tail -5 "$RBAC_LOG_FILE"
        echo "⚠️  Continuing without RBAC (can be applied later)"
    fi
fi

# Step 6: Migration Validation
echo ""
echo "✅ Step 6: Migration Validation"
echo "==============================="
echo "🔍 Validating core tables..."

# Define core tables to check
CORE_TABLES=(
    "profiles"
    "business_profiles" 
    "business_partners"
    "visibility_check_leads"
    "visibility_check_results"
    "service_packages"
    "partner_bookings"
    "gmb_categories"
)

MISSING_TABLES=()
for table in "${CORE_TABLES[@]}"; do
    table_exists=$(PGPASSWORD="$RDS_PASSWORD" psql -h "$RDS_ENDPOINT" -U postgres -d "$DB_NAME" -tAc "SELECT 1 FROM information_schema.tables WHERE table_name='$table';" 2>/dev/null || echo "")
    if [ "$table_exists" = "1" ]; then
        echo "   ✅ Table '$table' exists"
    else
        echo "   ❌ Table '$table' missing"
        MISSING_TABLES+=("$table")
    fi
done

# Test basic queries
echo ""
echo "🧪 Testing basic queries..."

# Test profiles table
if PGPASSWORD="$RDS_PASSWORD" psql -h "$RDS_ENDPOINT" -U postgres -d "$DB_NAME" -c "SELECT count(*) FROM profiles;" > /dev/null 2>&1; then
    PROFILE_COUNT=$(PGPASSWORD="$RDS_PASSWORD" psql -h "$RDS_ENDPOINT" -U postgres -d "$DB_NAME" -tAc "SELECT count(*) FROM profiles;" 2>/dev/null || echo "0")
    echo "   ✅ Profiles table query successful ($PROFILE_COUNT rows)"
else
    echo "   ❌ Profiles table query failed"
fi

# Test visibility_check_leads table
if PGPASSWORD="$RDS_PASSWORD" psql -h "$RDS_ENDPOINT" -U postgres -d "$DB_NAME" -c "SELECT count(*) FROM visibility_check_leads;" > /dev/null 2>&1; then
    VC_COUNT=$(PGPASSWORD="$RDS_PASSWORD" psql -h "$RDS_ENDPOINT" -U postgres -d "$DB_NAME" -tAc "SELECT count(*) FROM visibility_check_leads;" 2>/dev/null || echo "0")
    echo "   ✅ Visibility check leads table query successful ($VC_COUNT rows)"
else
    echo "   ❌ Visibility check leads table query failed"
fi

# Step 7: Generate Summary Report
echo ""
echo "📊 Step 7: Migration Summary"
echo "============================"

# Create summary report
REPORT_FILE="migration-report-$(date +%Y%m%d-%H%M%S).md"
cat > "$REPORT_FILE" << EOF
# RDS Migration Report

**Date:** $(date)
**Database:** $DB_NAME
**Endpoint:** $RDS_ENDPOINT

## Migration Results

- **Schema File:** $SCHEMA_FILE
- **Tables Expected:** $TABLE_COUNT
- **Tables Created:** $CREATED_TABLES
- **Migration Log:** $LOG_FILE

## Validation Results

### Core Tables Status
EOF

for table in "${CORE_TABLES[@]}"; do
    table_exists=$(PGPASSWORD="$RDS_PASSWORD" psql -h "$RDS_ENDPOINT" -U postgres -d "$DB_NAME" -tAc "SELECT 1 FROM information_schema.tables WHERE table_name='$table';" 2>/dev/null || echo "")
    if [ "$table_exists" = "1" ]; then
        echo "- ✅ $table" >> "$REPORT_FILE"
    else
        echo "- ❌ $table (MISSING)" >> "$REPORT_FILE"
    fi
done

cat >> "$REPORT_FILE" << EOF

### Connection String
\`\`\`
postgresql://postgres:PASSWORD@$RDS_ENDPOINT:5432/$DB_NAME
\`\`\`

### Next Steps
1. Update application configuration with new connection string
2. Test application connectivity
3. Migrate data from Supabase (if needed)
4. Update Lambda functions to use RDS
EOF

echo "📝 Migration report saved: $REPORT_FILE"

# Final Status
echo ""
if [ ${#MISSING_TABLES[@]} -eq 0 ]; then
    echo "🎉 MIGRATION COMPLETED SUCCESSFULLY"
    echo "=================================="
    echo ""
    echo "✅ All core tables created"
    echo "✅ Database is ready for use"
    echo "✅ Connection string: postgresql://postgres:PASSWORD@$RDS_ENDPOINT:5432/$DB_NAME"
else
    echo "⚠️  MIGRATION COMPLETED WITH WARNINGS"
    echo "===================================="
    echo ""
    echo "❌ Missing tables: ${MISSING_TABLES[*]}"
    echo "💡 Check migration logs for details"
fi

echo ""
echo "📋 Files Created:"
echo "   - Migration log: $LOG_FILE"
if [ "$RBAC_AVAILABLE" = true ]; then
    echo "   - RBAC log: $RBAC_LOG_FILE"
fi
echo "   - Summary report: $REPORT_FILE"
echo ""
echo "🚀 Next Steps:"
echo "   1. Update .env files with RDS connection details"
echo "   2. Test Lambda connectivity to RDS"
echo "   3. Migrate data from Supabase (if needed)"
echo "   4. Update application configuration"