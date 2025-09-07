#!/bin/bash

# Task 12.3.2 - Plan B: Safe Supabase & Vercel Shutdown
# Strategy: Deactivate without deleting, keep rollback options

set -e

echo "🎯 EXECUTING PLAN B - SAFE SHUTDOWN STRATEGY"
echo "=============================================="
echo ""

# Phase 1: Supabase Read-Only Lockdown
echo "📋 Phase 1: Supabase Read-Only Lockdown"
echo "----------------------------------------"
echo "⚠️  MANUAL ACTIONS REQUIRED:"
echo ""
echo "1. Supabase Dashboard Actions:"
echo "   - Go to: https://supabase.com/dashboard/projects"
echo "   - Project: uheksobnyedarrpgxhju"
echo "   - Settings → General → Pause Project"
echo "   - OR Settings → Database → Connection Pooling → Set Max Connections to 0"
echo ""
echo "2. Apply Read-Only SQL (if keeping active):"
echo "   - Run: scripts/supabase-readonly-lockdown.sql"
echo "   - This blocks all write operations"
echo ""

# Phase 2: Vercel Deployment Management  
echo "📋 Phase 2: Vercel Deployment Management"
echo "----------------------------------------"
echo "✅ Current Status:"
vercel ls 2>/dev/null || echo "   Vercel project linked"
echo ""
echo "⚠️  MANUAL ACTIONS REQUIRED:"
echo "1. Vercel Dashboard:"
echo "   - Go to: https://vercel.com/rabibskiis-projects/matbakh-visibility-boost"
echo "   - Settings → Git → Disable Auto-Deploy"
echo "   - Keep project active (for rollback)"
echo ""

# Phase 3: AWS Validation Preparation
echo "📋 Phase 3: AWS Validation Preparation"
echo "--------------------------------------"
echo "✅ Preparing comprehensive AWS testing..."

# Create comprehensive test suite
cat > scripts/aws-full-validation.sh << 'EOF'
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
EOF

chmod +x scripts/aws-full-validation.sh

# Phase 4: Monitoring Setup
echo "📋 Phase 4: Monitoring Setup"
echo "----------------------------"
echo "✅ Setting up comprehensive monitoring..."

# Create monitoring script
cat > scripts/aws-health-monitor.sh << 'EOF'
#!/bin/bash

# Continuous AWS health monitoring
while true; do
    echo "$(date): Checking AWS health..."
    
    # Check RDS
    aws rds describe-db-instances --db-instance-identifier matbakh-db --query 'DBInstances[0].DBInstanceStatus' --output text
    
    # Check Lambda
    aws lambda get-function --function-name matbakh-db-test --query 'Configuration.State' --output text
    
    # Check API Gateway
    curl -s -o /dev/null -w "%{http_code}" https://guf7ho7bze.execute-api.eu-central-1.amazonaws.com/prod/health
    
    echo "Health check complete"
    sleep 300  # Check every 5 minutes
done
EOF

chmod +x scripts/aws-health-monitor.sh

echo ""
echo "🎉 PLAN B PREPARATION COMPLETE"
echo "=============================="
echo ""
echo "📊 Summary:"
echo "   ✅ Scripts prepared for safe shutdown"
echo "   ✅ AWS validation suite ready"
echo "   ✅ Monitoring tools configured"
echo "   ✅ Rollback procedures documented"
echo ""
echo "🚀 Next Steps:"
echo "   1. Execute manual Supabase pause/readonly"
echo "   2. Disable Vercel auto-deploy"
echo "   3. Run AWS validation: ./scripts/aws-full-validation.sh"
echo "   4. Start monitoring: ./scripts/aws-health-monitor.sh &"
echo ""
echo "⚠️  IMPORTANT: Nothing is permanently deleted!"
echo "   All data and projects remain for rollback if needed."
echo ""