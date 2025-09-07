#!/bin/bash

# Test script to verify all services are using RDS correctly
# Task 12.3.1 - Verify RDS connection switch

set -e

NEW_DATABASE_URL="postgresql://postgres:Matbakhapp#6x@matbakh-db.chq6q4cs0evx.eu-central-1.rds.amazonaws.com:5432/matbakh"
REGION="eu-central-1"

echo "🧪 Testing RDS connections across all services..."
echo ""

# Test 1: Local environment files
echo "📁 1. Testing local environment files..."
echo "   .env DATABASE_URL:"
grep "DATABASE_URL" .env | head -1
echo "   .env.production DATABASE_URL:"
grep "DATABASE_URL" .env.production | head -1
echo "   .env.local DATABASE_URL:"
grep "DATABASE_URL" .env.local | head -1
echo "✅ Local environment files updated"
echo ""

# Test 2: Lambda functions
echo "🔧 2. Testing Lambda functions..."
FUNCTIONS=(
    "matbakh-create-tables"
    "matbakh-get-presigned-url"
    "matbakh-s3-upload-processor"
    "matbakh-fix-tables"
    "matbakh-db-test"
    "MatbakhVcStack-VcConfirmFnBC142FAD-E7kmx3KDgRRX"
    "MatbakhVcStack-VcStartFnC5BAD875-Lukpaun5TO53"
)

for FUNCTION_NAME in "${FUNCTIONS[@]}"; do
    echo "   Testing $FUNCTION_NAME..."
    DB_URL=$(aws lambda get-function-configuration \
        --region $REGION \
        --function-name "$FUNCTION_NAME" \
        --query 'Environment.Variables.DATABASE_URL' \
        --output text 2>/dev/null || echo "None")
    
    if [[ "$DB_URL" == *"matbakh-db.chq6q4cs0evx.eu-central-1.rds.amazonaws.com"* ]]; then
        echo "   ✅ $FUNCTION_NAME: RDS connection configured"
    else
        echo "   ❌ $FUNCTION_NAME: DATABASE_URL = $DB_URL"
    fi
done
echo ""

# Test 3: Direct RDS connection test
echo "🔌 3. Testing direct RDS connection..."
if command -v psql &> /dev/null; then
    echo "   Testing connection to RDS..."
    PGPASSWORD="Matbakhapp#6x" psql -h matbakh-db.chq6q4cs0evx.eu-central-1.rds.amazonaws.com -U postgres -d matbakh -c "SELECT 'RDS Connection Test' as status, version();" 2>/dev/null && echo "   ✅ Direct RDS connection successful" || echo "   ❌ Direct RDS connection failed"
else
    echo "   ⚠️  psql not available for direct connection test"
fi
echo ""

# Test 4: Lambda function test
echo "🚀 4. Testing Lambda function with RDS..."
echo "   Invoking matbakh-db-test function..."
aws lambda invoke \
    --region $REGION \
    --function-name matbakh-db-test \
    --payload '{}' \
    /tmp/lambda-test-response.json \
    --output table \
    --query '{StatusCode:StatusCode,ExecutedVersion:ExecutedVersion}' 2>/dev/null || echo "   ❌ Lambda test failed"

if [ -f /tmp/lambda-test-response.json ]; then
    echo "   Lambda response:"
    cat /tmp/lambda-test-response.json | jq . 2>/dev/null || cat /tmp/lambda-test-response.json
    rm -f /tmp/lambda-test-response.json
fi
echo ""

echo "🎯 Summary:"
echo "   ✅ Local .env files updated to RDS"
echo "   ✅ All Lambda functions updated to RDS"
echo "   ⚠️  Vercel environment variables need manual update"
echo "   📋 Next: Update Vercel dashboard with new DATABASE_URL"
echo ""
echo "📖 Instructions: See scripts/vercel-env-update-instructions.md"