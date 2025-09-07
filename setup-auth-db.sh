#!/bin/bash
set -e

echo "🚀 Setting up Auth Database Tables..."

# Create and deploy temporary migration lambda
echo "📦 Creating migration lambda..."
zip -j /tmp/auth-db-migrate.zip setup-db-lambda.js

aws lambda create-function \
  --function-name AuthDbMigrateFn \
  --runtime nodejs20.x \
  --role arn:aws:iam::055062860590:role/MatbakhVcStack-VcStartFnServiceRoleD81E4A8A-vJkePnobNf07 \
  --handler setup-db-lambda.handler \
  --zip-file fileb:///tmp/auth-db-migrate.zip \
  --layers arn:aws:lambda:eu-central-1:055062860590:layer:pg-client-layer:1 \
  --vpc-config SubnetIds='["subnet-086715492e55e5380","subnet-0d0cfb07da9341ce3","subnet-027c02162f7e5b530"]',SecurityGroupIds='["sg-0ce17ccbf943dd57b"]' \
  --region eu-central-1

echo "⏳ Waiting for function to be ready..."
sleep 5

echo "🔧 Running database migration..."
aws lambda invoke \
  --function-name AuthDbMigrateFn \
  /tmp/migrate-result.json \
  --region eu-central-1

echo "📋 Migration result:"
cat /tmp/migrate-result.json
echo ""

echo "🧹 Cleaning up migration lambda..."
aws lambda delete-function \
  --function-name AuthDbMigrateFn \
  --region eu-central-1

echo "✅ Database setup complete!"
rm -f /tmp/auth-db-migrate.zip /tmp/migrate-result.json