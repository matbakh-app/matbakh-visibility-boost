#!/bin/bash

# Comprehensive AWS validation after Supabase shutdown
set -e

echo "🧪 AWS FULL VALIDATION SUITE"
echo "============================"

# Test 1: Database connectivity
echo "1. Testing RDS connectivity..."
./scripts/test-rds-connections.sh

# Test 2: Lambda functions
echo "2. Testing all Lambda functions..."
aws lambda invoke --function-name matbakh-db-test --payload '{}' /tmp/test1.json
aws lambda invoke --function-name matbakh-get-presigned-url --payload '{"httpMethod":"GET"}' /tmp/test2.json

# Test 3: S3 operations
echo "3. Testing S3 operations..."
./scripts/s3-smoke-tests.sh

# Test 4: Frontend deployment
echo "4. Testing frontend..."
curl -I https://matbakh-visibility-boost-pu3gqibtf-rabibskiis-projects.vercel.app

# Test 5: API endpoints
echo "5. Testing API endpoints..."
curl -I https://guf7ho7bze.execute-api.eu-central-1.amazonaws.com/prod/health

echo "✅ AWS validation complete"
