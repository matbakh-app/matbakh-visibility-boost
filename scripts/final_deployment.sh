#!/bin/bash

# Final RBAC & Live Readiness Deployment Script
# Execute all steps in correct order

set -e

echo "🚀 Starting Final RBAC & Live Readiness Deployment"
echo "=================================================="

# Step 1: Database Schema
echo ""
echo "📊 Step 1: Deploying RBAC Database Schema..."
echo "⚠️  Please run the following SQL in Supabase SQL Editor:"
echo "   File: supabase/sql/rbac_final_schema.sql"
echo ""
read -p "Press Enter after running the SQL schema..."

# Step 2: Check Environment Variables
echo ""
echo "🔧 Step 2: Checking Environment Variables..."
if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
  echo "❌ SUPABASE_ACCESS_TOKEN not set"
  echo "   Please export your Supabase access token:"
  echo "   export SUPABASE_ACCESS_TOKEN=<your_token>"
  exit 1
fi

if [ -z "$SUPABASE_PROJECT_ID" ]; then
  echo "❌ SUPABASE_PROJECT_ID not set"
  echo "   Please export your Supabase project reference:"
  echo "   export SUPABASE_PROJECT_ID=<your_project_ref>"
  exit 1
fi

echo "✅ Environment variables configured"

# Step 3: Deploy Edge Functions
echo ""
echo "📦 Step 3: Deploying Edge Functions..."
./scripts/deploy_functions.sh

# Step 4: Build Frontend
echo ""
echo "🏗️  Step 4: Building Frontend..."
npm run build

# Step 5: Deploy to S3
echo ""
echo "☁️  Step 5: Deploying to S3..."
aws s3 sync dist/ s3://matbakhvcstack-webbucket12880f5b-svct6cxfbip5 --delete --cache-control "public, max-age=31536000" --exclude "index.html"
aws s3 cp dist/index.html s3://matbakhvcstack-webbucket12880f5b-svct6cxfbip5/index.html --cache-control "no-store, no-cache, must-revalidate" --content-type "text/html" --metadata-directive REPLACE

# Step 6: Invalidate CloudFront
echo ""
echo "🌐 Step 6: Invalidating CloudFront..."
aws cloudfront create-invalidation --distribution-id E2W4JULEW8BXSD --paths "/*"

echo ""
echo "🎉 DEPLOYMENT COMPLETE!"
echo "======================"
echo ""
echo "📋 Next Steps:"
echo "1. Verify database schema in Supabase Dashboard"
echo "2. Check Edge Function logs"
echo "3. Test RBAC functionality"
echo "4. Run smoke tests from docs/audits/live-readiness-2.md"
echo ""
echo "🔗 Test URLs:"
echo "   • /_kiro (Diagnostics)"
echo "   • /vc/quick (VC Entry)"
echo "   • /dashboard (Owner Dashboard)"
echo "   • /admin/leads (Admin Panel - requires admin role)"
echo ""
echo "✅ System is now live with full RBAC!"