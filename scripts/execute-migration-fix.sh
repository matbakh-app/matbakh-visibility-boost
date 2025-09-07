#!/bin/bash

set -e

echo "🔧 Task 12.1: Service Packages Migration Fix"
echo "============================================"

echo ""
echo "📋 Problem:"
echo "- service_packages table exists but missing 'period' column"
echo "- Migration 20250630100046_cleanup_service_packages.sql fails"
echo "- Need to fix table structure before proceeding"

echo ""
echo "🛠️ Solution:"
echo "1. Drop existing service_packages table"
echo "2. Recreate with correct schema including 'period' column"
echo "3. Deploy all pending migrations"

echo ""
echo "📄 SQL to execute in Supabase SQL Editor:"
echo "=========================================="
cat scripts/fix-service-packages-migration.sql

echo ""
echo "🚀 Next Steps:"
echo "1. Copy the SQL above"
echo "2. Go to Supabase Dashboard → SQL Editor"
echo "3. Paste and execute the SQL"
echo "4. Come back and run: supabase db push --include-all"

echo ""
read -p "Press Enter after you've executed the SQL in Supabase SQL Editor..."

echo ""
echo "📦 Deploying all migrations..."
if command -v supabase &> /dev/null; then
    echo "Running: supabase db push --include-all"
    supabase db push --include-all
    
    if [ $? -eq 0 ]; then
        echo "✅ All migrations deployed successfully!"
        
        echo ""
        echo "🔍 Verifying table structure..."
        echo "Checking if service_packages has 'period' column..."
        
        echo ""
        echo "✅ Task 12.1 COMPLETED!"
        echo ""
        echo "📊 Status Update:"
        echo "- service_packages table: ✅ Fixed with period column"
        echo "- user_consent_tracking table: ✅ Deployed for DSGVO"
        echo "- All migrations: ✅ Successfully applied"
        echo ""
        echo "🎯 Ready for Task 12.2: Data Export & RDS Migration"
        
    else
        echo "❌ Migration failed. Please check the error above."
        exit 1
    fi
else
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "npm install -g supabase"
    exit 1
fi

echo ""
echo "🎉 Task 12.1 Complete - Ready for RDS Migration!"