#!/bin/bash

# Manual Test für Phase 2.2.2: Ergebnis-Mapping & Persistierung
# Enhanced Visibility Check Edge Function

echo "🚀 Starting Phase 2.2.2 End-to-End Test"

# 1. Start Supabase Development Environment
echo "📦 Starting Supabase..."
supabase start

# 2. Serve Enhanced Visibility Check Function
echo "🔧 Serving enhanced-visibility-check function..."
supabase functions serve enhanced-visibility-check &
SERVE_PID=$!

# Wait for function to be ready
sleep 5

# 3. Test Payload für Phase 2.2.2
echo "📤 Invoking enhanced-visibility-check with test payload..."
supabase functions invoke enhanced-visibility-check \
  --payload '{
    "businessName": "Bella Vista Trattoria",
    "location": "Berlin, Deutschland",
    "mainCategory": "Essen & Trinken",
    "subCategory": "Italienisches Restaurant", 
    "matbakhTags": ["pasta", "pizza", "wine", "italian"],
    "website": "https://bella-vista-berlin.de",
    "facebookName": "",
    "instagramName": "",
    "benchmarks": ["Osteria Italiana", "Pizzeria Romano"],
    "email": "test@bellavista.de",
    "leadId": "test-lead-phase-222",
    "googleName": "Bella Vista Trattoria Berlin"
  }'

# 4. Wait for processing
echo "⏳ Waiting for processing to complete..."
sleep 10

# 5. Verify Database State
echo "🔍 Checking database state..."
supabase db psql <<EOF
SELECT 
  vcl.id,
  vcl.status,
  vcl.business_name,
  vcr.overall_score,
  vcr.lead_potential,
  vcr.benchmark_insights,
  jsonb_pretty(vcr.swot_analysis) as swot_analysis_formatted
FROM visibility_check_leads vcl
LEFT JOIN visibility_check_results vcr ON vcl.id = vcr.lead_id
WHERE vcl.id = 'test-lead-phase-222';
EOF

# 6. Detailed Check for AI Fields
echo "📊 Checking AI-specific fields..."
supabase db psql <<EOF
SELECT 
  vcr.category_insights,
  vcr.quick_wins,
  jsonb_array_length(vcr.platform_analyses) as platform_count,
  vcr.instagram_candidates
FROM visibility_check_results vcr
WHERE vcr.lead_id = 'test-lead-phase-222';
EOF

# 7. Cleanup
kill $SERVE_PID
echo "✅ Phase 2.2.2 End-to-End Test completed"

# Expected Results:
# ✅ vcl.status = 'completed'
# ✅ vcr.overall_score = number (e.g., 85)
# ✅ vcr.swot_analysis = object with strengths, weaknesses, opportunities, threats
# ✅ vcr.benchmark_insights = string (e.g., "Ihr Restaurant liegt 15% über dem Branchendurchschnitt")
# ✅ vcr.category_insights = array of strings
# ✅ vcr.quick_wins = array of strings
# ✅ vcr.lead_potential = 'high'|'medium'|'low'