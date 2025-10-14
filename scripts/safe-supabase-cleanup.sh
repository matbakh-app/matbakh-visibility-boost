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
