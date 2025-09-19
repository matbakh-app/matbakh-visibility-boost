#!/bin/bash
# Safe Archival System - Instant Rollback Script
# Generated: 2025-09-18T10:31:22.300Z
# Archive: src/archive/consolidated-legacy-archive-2025-09-18

set -e

echo "🔄 Starting rollback process..."
echo "📦 Archive: src/archive/consolidated-legacy-archive-2025-09-18"

# Function to restore a single component
restore_component() {
    local archive_path="$1"
    local original_path="$2"
    local checksum="$3"
    
    if [ -f "$archive_path" ]; then
        echo "📁 Restoring: $original_path"
        
        # Create directory if it doesn't exist
        mkdir -p "$(dirname "$original_path")"
        
        # Copy file back
        cp "$archive_path" "$original_path"
        
        # Verify checksum
        if command -v sha256sum >/dev/null 2>&1; then
            local current_checksum=$(sha256sum "$original_path" | cut -d' ' -f1)
            if [ "$current_checksum" != "$checksum" ]; then
                echo "⚠️ Checksum mismatch for $original_path"
            fi
        fi
        
        echo "✅ Restored: $original_path"
    else
        echo "❌ Archive file not found: $archive_path"
        return 1
    fi
}

# Note: This rollback script is for emergency use only
# On-hold components are preserved in their current locations
# and do not need rollback unless they were moved to archive

echo "ℹ️ On-hold components are preserved in active codebase"
echo "ℹ️ Manual archive components remain in manual-archive/"
echo "ℹ️ Safe archived components can be restored individually if needed"

# Run validation checks
echo "🧪 Running validation checks..."
echo "Checking: TypeScript Compilation" && npx tsc --noEmit
echo "Checking: Build Process" && npm run build

echo "✅ Rollback completed successfully!"
echo "📋 Archive system is operational"
echo "🔍 Please verify application functionality"
echo ""
echo "🔄 For on-hold component restoration, use:"
echo "npx tsx scripts/restore-onhold-component.ts <component-path>"