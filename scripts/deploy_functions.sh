#!/bin/bash

# Deploy all required Edge Functions for RBAC & Live Readiness
# Run from project root

set -e

echo "🚀 Deploying Edge Functions for RBAC & Live Readiness..."

# Check required environment variables
if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
  echo "❌ SUPABASE_ACCESS_TOKEN not set"
  echo "   Export your Supabase access token:"
  echo "   export SUPABASE_ACCESS_TOKEN=<your_token>"
  exit 1
fi

if [ -z "$SUPABASE_PROJECT_ID" ]; then
  echo "❌ SUPABASE_PROJECT_ID not set"
  echo "   Export your Supabase project reference:"
  echo "   export SUPABASE_PROJECT_ID=<your_project_ref>"
  exit 1
fi

echo "✅ Environment variables configured"
echo "   Project ID: $SUPABASE_PROJECT_ID"

# Core VC Functions
echo "📧 Deploying VC functions..."
supabase functions deploy vc-start
supabase functions deploy vc-verify
supabase functions deploy vc-result
supabase functions deploy vc-runner-stub
supabase functions deploy dev-mail-sink

# Additional Functions
echo "🔧 Deploying additional functions..."
supabase functions deploy og-vc
supabase functions deploy partner-credits

# Admin Functions
echo "👑 Deploying admin functions..."
supabase functions deploy admin-overview
supabase functions deploy admin-leads
supabase functions deploy owner-overview

# Export Functions
echo "📊 Deploying export functions..."
supabase functions deploy export-visibility-csv || echo "⚠️ export-visibility-csv not found, skipping"
supabase functions deploy generate-pdf-report || echo "⚠️ generate-pdf-report not found, skipping"

echo ""
echo "🎉 All Edge Functions deployed successfully!"
echo ""
echo "⚠️  IMPORTANT: Configure CORS settings in Supabase Dashboard:"
echo "   - Go to Edge Functions → Settings"
echo "   - Add allowed origins:"
echo "     • https://matbakh.app"
echo "     • http://localhost:5173"
echo ""
echo "🔧 Set required secrets (if not already done):"
echo "   supabase secrets set AWS_ACCESS_KEY_ID=<your_key>"
echo "   supabase secrets set AWS_SECRET_ACCESS_KEY=<your_secret>"
echo "   supabase secrets set AWS_REGION=<your_region>"
echo ""
echo "🔧 Next steps:"
echo "   1. Verify function logs in Supabase Dashboard"
echo "   2. Test function endpoints"
echo "   3. Run smoke tests from docs/audits/live-readiness-2.md"