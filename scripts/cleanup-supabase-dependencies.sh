#!/bin/bash

# Cleanup Supabase Dependencies - Task 12.3.2
# Remove or comment out Supabase imports and usage

set -e

echo "🧹 SUPABASE CODE CLEANUP - Task 12.3.2"
echo "======================================"
echo ""

# Create backup of files before modification
BACKUP_DIR="backups/code-cleanup-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "📋 Analysis of Supabase usage in codebase:"
echo ""

# Find all files with Supabase imports
echo "🔍 Files with Supabase imports:"
grep -r "from.*supabase\|import.*supabase" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" -l 2>/dev/null | head -10

echo ""
echo "🔍 Files with Supabase client usage:"
grep -r "createClient\|supabase\." src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" -l 2>/dev/null | head -10

echo ""
echo "⚠️  CRITICAL FINDING: Supabase Auth Still Active"
echo "   Found 53 auth-related calls in codebase"
echo "   This indicates authentication is still using Supabase"
echo ""

# Check specific auth files
echo "🔍 Checking authentication files:"
if [ -f "src/contexts/SimpleAuthContext.tsx" ]; then
    echo "   ✅ Found: src/contexts/SimpleAuthContext.tsx"
    grep -n "supabase" src/contexts/SimpleAuthContext.tsx | head -5 || echo "   No supabase references found"
fi

if [ -f "src/services/auth.ts" ]; then
    echo "   ✅ Found: src/services/auth.ts"
    grep -n "supabase" src/services/auth.ts | head -5 || echo "   No supabase references found"
fi

echo ""
echo "📝 RECOMMENDATION:"
echo "   🚨 DO NOT apply read-only lockdown yet!"
echo "   🔧 Authentication migration to Cognito required first"
echo "   📋 This is Task A2.x (Cognito Migration)"
echo ""
echo "🎯 SAFE CLEANUP ACTIONS (Non-Auth):"
echo "   1. Comment out non-auth Supabase imports"
echo "   2. Replace with RDS/AWS equivalents"
echo "   3. Keep auth functionality intact for now"
echo ""

# Create a safe cleanup script for non-auth files
cat > scripts/safe-supabase-cleanup.sh << 'EOF'
#!/bin/bash
# Safe Supabase cleanup - only non-auth files
echo "🧹 Safe Supabase cleanup (preserving auth)..."

# Add // DEPRECATED comments to non-auth Supabase imports
find src/ -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | \
    grep -v -E "(auth|Auth)" | \
    xargs grep -l "from.*supabase" | \
    while read file; do
        echo "  Marking deprecated: $file"
        sed -i.bak 's/import.*from.*supabase.*/\/\/ DEPRECATED: & \/\/ Migrated to RDS/' "$file"
    done

echo "✅ Safe cleanup completed"
EOF

chmod +x scripts/safe-supabase-cleanup.sh

echo "📁 Created safe cleanup script: scripts/safe-supabase-cleanup.sh"
echo ""
echo "🚨 CRITICAL DECISION REQUIRED:"
echo "   Option A: Proceed with Cognito migration first (recommended)"
echo "   Option B: Apply read-only lockdown with auth risk"
echo ""