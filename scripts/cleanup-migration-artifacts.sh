#!/bin/bash

# Migration Cleanup Script
# This script removes temporary files and artifacts from the S3 migration

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CLEANUP_LOG="/tmp/migration-cleanup-$(date +%Y%m%d-%H%M%S).log"
DRY_RUN=${1:-false}

# Logging functions
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$CLEANUP_LOG"
}

success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a "$CLEANUP_LOG"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}" | tee -a "$CLEANUP_LOG"
}

info() {
    echo -e "${BLUE}ℹ️  $1${NC}" | tee -a "$CLEANUP_LOG"
}

# Header
echo -e "${BLUE}🧹 S3 Migration Cleanup - $(date)${NC}"
echo "Cleanup log: $CLEANUP_LOG"

if [ "$DRY_RUN" = "true" ]; then
    echo -e "${YELLOW}DRY RUN MODE - No files will be deleted${NC}"
fi

echo ""

# Function to safely remove files/directories
safe_remove() {
    local item="$1"
    local description="$2"
    
    if [ -e "$item" ]; then
        if [ "$DRY_RUN" = "true" ]; then
            info "Would remove: $item ($description)"
        else
            rm -rf "$item"
            success "Removed: $item ($description)"
        fi
    else
        info "Not found: $item ($description)"
    fi
}

# Function to clean up files by pattern
cleanup_pattern() {
    local pattern="$1"
    local description="$2"
    local found_files
    
    found_files=$(find . -name "$pattern" -type f 2>/dev/null || true)
    
    if [ -n "$found_files" ]; then
        echo "$found_files" | while read -r file; do
            if [ "$DRY_RUN" = "true" ]; then
                info "Would remove: $file ($description)"
            else
                rm -f "$file"
                success "Removed: $file ($description)"
            fi
        done
    else
        info "No files found matching pattern: $pattern ($description)"
    fi
}

log "Starting migration cleanup..."

# 1. Remove backup files
log "1. Cleaning up backup files..."
cleanup_pattern "*.bak" "backup files"
cleanup_pattern "*.backup" "backup files"
cleanup_pattern "*.orig" "original files"

# 2. Remove temporary migration files
log "2. Cleaning up temporary migration files..."
cleanup_pattern "*migration*tmp*" "temporary migration files"
cleanup_pattern "*supabase-backup*" "Supabase backup files"
cleanup_pattern "*storage-migration*" "storage migration files"

# 3. Remove old configuration files
log "3. Cleaning up old configuration files..."
safe_remove ".env.supabase.backup" "Supabase environment backup"
safe_remove "supabase-storage-config.json" "old Supabase storage config"
safe_remove "storage-migration-config.json" "migration configuration"

# 4. Remove temporary test files
log "4. Cleaning up temporary test files..."
cleanup_pattern "*test-upload*" "test upload files"
cleanup_pattern "*migration-test*" "migration test files"
cleanup_pattern "test-*.tmp" "temporary test files"

# 5. Remove old Lambda deployment artifacts
log "5. Cleaning up Lambda deployment artifacts..."
safe_remove "lambda-handler.zip" "old Lambda zip"
safe_remove "lambda-handler-*.zip" "old Lambda zip variants"
safe_remove "function.zip" "generic function zip"

# 6. Remove migration logs (older than 30 days)
log "6. Cleaning up old migration logs..."
find /tmp -name "*migration*log*" -type f -mtime +30 -exec rm -f {} \; 2>/dev/null || true
find /var/log -name "*migration*log*" -type f -mtime +30 -exec rm -f {} \; 2>/dev/null || true

# 7. Remove old CDK outputs
log "7. Cleaning up old CDK outputs..."
safe_remove "cdk.out.backup" "CDK output backup"
safe_remove "outputs.json.backup" "outputs backup"

# 8. Remove temporary directories
log "8. Cleaning up temporary directories..."
safe_remove "/tmp/s3-migration-*" "temporary migration directories"
safe_remove "./migration-temp" "migration temp directory"
safe_remove "./supabase-backup" "Supabase backup directory"

# 9. Clean up node_modules in migration directories
log "9. Cleaning up node_modules in migration directories..."
find . -path "*/migration*/node_modules" -type d -exec rm -rf {} + 2>/dev/null || true

# 10. Remove old environment variable files
log "10. Cleaning up old environment files..."
safe_remove ".env.migration" "migration environment file"
safe_remove ".env.storage.old" "old storage environment file"

# 11. Remove old documentation drafts
log "11. Cleaning up documentation drafts..."
cleanup_pattern "*-draft.md" "documentation drafts"
cleanup_pattern "*-old.md" "old documentation"

# 12. Remove old scripts
log "12. Cleaning up old scripts..."
safe_remove "scripts/migrate-storage.sh.old" "old migration script"
safe_remove "scripts/supabase-to-s3.sh" "old conversion script"

# 13. Clean up git artifacts
log "13. Cleaning up git artifacts..."
cleanup_pattern "*.patch" "git patch files"
cleanup_pattern "*.diff" "git diff files"

# 14. Remove old package-lock files
log "14. Cleaning up old package files..."
safe_remove "package-lock.json.backup" "package-lock backup"
safe_remove "yarn.lock.backup" "yarn lock backup"

# 15. Clean up IDE files
log "15. Cleaning up IDE files..."
safe_remove ".vscode/settings.json.backup" "VS Code settings backup"
safe_remove ".idea/migration" "IntelliJ migration files"

# 16. Remove old certificates and keys (if any)
log "16. Cleaning up old certificates..."
cleanup_pattern "*.pem.old" "old certificate files"
cleanup_pattern "*.key.backup" "old key files"

# 17. Clean up old monitoring files
log "17. Cleaning up old monitoring files..."
safe_remove "monitoring-old.json" "old monitoring config"
safe_remove "alerts-backup.json" "alerts backup"

# 18. Remove migration validation artifacts
log "18. Cleaning up validation artifacts..."
cleanup_pattern "*validation*tmp*" "validation temporary files"
safe_remove "/tmp/migration-validation-*" "validation logs"

# 19. Clean up old infrastructure files
log "19. Cleaning up old infrastructure files..."
safe_remove "infra/supabase-storage.ts" "old Supabase storage infrastructure"
safe_remove "infra/old-*" "old infrastructure files"

# 20. Final cleanup - empty directories
log "20. Removing empty directories..."
if [ "$DRY_RUN" != "true" ]; then
    find . -type d -empty -delete 2>/dev/null || true
    success "Removed empty directories"
else
    info "Would remove empty directories"
fi

# Summary
echo ""
echo -e "${BLUE}📊 Cleanup Summary${NC}"
echo "=================="

if [ "$DRY_RUN" = "true" ]; then
    echo -e "${YELLOW}DRY RUN COMPLETED${NC}"
    echo "No files were actually deleted. Run without 'true' parameter to perform actual cleanup:"
    echo "  ./scripts/cleanup-migration-artifacts.sh"
else
    echo -e "${GREEN}CLEANUP COMPLETED${NC}"
    echo "Migration artifacts have been cleaned up."
fi

echo ""
echo "Cleanup log: $CLEANUP_LOG"

# Create cleanup report
if [ "$DRY_RUN" != "true" ]; then
    cat > /tmp/migration-cleanup-report.json << EOF
{
    "cleanup_date": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "cleanup_type": "s3-migration-artifacts",
    "items_cleaned": [
        "backup_files",
        "temporary_migration_files",
        "old_configuration_files",
        "temporary_test_files",
        "lambda_deployment_artifacts",
        "old_migration_logs",
        "cdk_outputs",
        "temporary_directories",
        "node_modules",
        "environment_files",
        "documentation_drafts",
        "old_scripts",
        "git_artifacts",
        "package_files",
        "ide_files",
        "certificates",
        "monitoring_files",
        "validation_artifacts",
        "infrastructure_files",
        "empty_directories"
    ],
    "cleanup_log": "$CLEANUP_LOG",
    "performed_by": "$(whoami)"
}
EOF
    
    success "Cleanup report created: /tmp/migration-cleanup-report.json"
fi

echo ""
log "Migration cleanup completed successfully"