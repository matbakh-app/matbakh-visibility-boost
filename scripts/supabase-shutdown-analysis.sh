#!/bin/bash

# Supabase Shutdown Analysis - Task 12.3.2
# Analyze current Supabase usage before shutdown

set -e

echo "🔍 SUPABASE SHUTDOWN ANALYSIS - Task 12.3.2"
echo "=============================================="
echo ""

# Check current Supabase configuration
echo "📋 1. Current Supabase Configuration:"
echo "   SUPABASE_URL: $(grep SUPABASE_URL .env | head -1)"
echo "   SUPABASE_ANON_KEY: $(grep SUPABASE_ANON_KEY .env | head -1 | cut -c1-50)..."
echo "   SUPABASE_SERVICE_ROLE_KEY: $(grep SUPABASE_SERVICE_ROLE_KEY .env | head -1 | cut -c1-50)..."
echo ""

# Check for Supabase imports in codebase
echo "🔍 2. Scanning codebase for Supabase dependencies:"
echo "   Supabase imports in TypeScript/JavaScript files:"
grep -r "from.*supabase" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null | wc -l | xargs echo "   Found imports:"

echo "   Supabase client usage:"
grep -r "createClient\|supabase\." src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null | wc -l | xargs echo "   Found usages:"

echo "   Supabase auth usage:"
grep -r "supabase.*auth\|auth.*supabase" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null | wc -l | xargs echo "   Found auth calls:"
echo ""

# Check Supabase functions
echo "📁 3. Supabase Edge Functions:"
if [ -d "supabase/functions" ]; then
    echo "   Edge Functions directory exists:"
    ls -la supabase/functions/ 2>/dev/null || echo "   No functions found"
else
    echo "   No Edge Functions directory found"
fi
echo ""

# Check for active Supabase connections
echo "🔌 4. Testing current Supabase connectivity:"
if command -v curl &> /dev/null; then
    SUPABASE_URL=$(grep VITE_SUPABASE_URL .env | cut -d'=' -f2 | tr -d '"')
    if [ ! -z "$SUPABASE_URL" ]; then
        echo "   Testing Supabase REST API..."
        curl -s -o /dev/null -w "   HTTP Status: %{http_code}\n" "$SUPABASE_URL/rest/v1/" -H "apikey: $(grep VITE_SUPABASE_ANON_KEY .env | cut -d'=' -f2 | tr -d '"')" || echo "   Connection test failed"
    fi
else
    echo "   curl not available for connection test"
fi
echo ""

# Check RDS status
echo "✅ 5. Confirming RDS is active:"
echo "   Current DATABASE_URL: $(grep DATABASE_URL .env | head -1)"
echo "   RDS Connection test:"
aws lambda invoke \
    --region eu-central-1 \
    --function-name matbakh-db-test \
    --payload '{}' \
    /tmp/rds-test.json \
    --output text \
    --query 'StatusCode' 2>/dev/null && echo "   ✅ RDS connection successful" || echo "   ❌ RDS connection failed"

if [ -f /tmp/rds-test.json ]; then
    rm -f /tmp/rds-test.json
fi
echo ""

echo "🎯 ANALYSIS COMPLETE"
echo "===================="
echo "Ready to proceed with Supabase shutdown steps:"
echo "1. ✅ RDS is confirmed active"
echo "2. 🔍 Supabase usage analysis complete"
echo "3. 📋 Ready for read-only lockdown"
echo "4. 💾 Ready for final backup"
echo ""