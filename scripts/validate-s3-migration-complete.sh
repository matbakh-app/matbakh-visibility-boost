#!/bin/bash

# S3 Migration Validation Script
# This script validates that the migration from Supabase Storage to S3 is complete

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
VALIDATION_LOG="/tmp/s3-migration-validation-$(date +%Y%m%d-%H%M%S).log"
ISSUES_FOUND=0

# Logging functions
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$VALIDATION_LOG"
}

success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a "$VALIDATION_LOG"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}" | tee -a "$VALIDATION_LOG"
}

error() {
    echo -e "${RED}❌ $1${NC}" | tee -a "$VALIDATION_LOG"
    ((ISSUES_FOUND++))
}

info() {
    echo -e "${BLUE}ℹ️  $1${NC}" | tee -a "$VALIDATION_LOG"
}

# Header
echo -e "${BLUE}🔍 S3 Migration Validation - $(date)${NC}"
echo "Validation log: $VALIDATION_LOG"
echo ""

# 1. Check for Supabase Storage dependencies in code
log "1. Checking for Supabase Storage dependencies in code..."

# Search for Supabase storage calls
SUPABASE_STORAGE_CALLS=$(find src -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | \
    xargs grep -l "supabase\.storage\|\.storage\." 2>/dev/null || true)

if [ -n "$SUPABASE_STORAGE_CALLS" ]; then
    error "Found Supabase Storage calls in the following files:"
    echo "$SUPABASE_STORAGE_CALLS" | while read -r file; do
        echo "  - $file"
        grep -n "supabase\.storage\|\.storage\." "$file" | head -3
    done
else
    success "No Supabase Storage calls found in source code"
fi

# Search for storage bucket references
STORAGE_BUCKET_REFS=$(find src -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | \
    xargs grep -l "bucket.*storage\|storage.*bucket" 2>/dev/null || true)

if [ -n "$STORAGE_BUCKET_REFS" ]; then
    warning "Found potential storage bucket references:"
    echo "$STORAGE_BUCKET_REFS" | while read -r file; do
        echo "  - $file"
    done
else
    success "No storage bucket references found"
fi

# 2. Check for S3 implementation
log "2. Checking S3 implementation..."

# Check if S3 upload library exists
if [ -f "src/lib/s3-upload.ts" ]; then
    success "S3 upload library found"
    
    # Check if it contains required functions
    REQUIRED_FUNCTIONS=("uploadToS3Enhanced" "validateFile" "compressImage" "generateFilePreview")
    for func in "${REQUIRED_FUNCTIONS[@]}"; do
        if grep -q "$func" src/lib/s3-upload.ts; then
            success "Function $func found in S3 library"
        else
            error "Function $func missing from S3 library"
        fi
    done
else
    error "S3 upload library not found at src/lib/s3-upload.ts"
fi

# Check if monitoring is implemented
if [ -f "src/lib/monitoring.ts" ]; then
    success "Monitoring library found"
else
    warning "Monitoring library not found at src/lib/monitoring.ts"
fi

# 3. Check React hooks
log "3. Checking React hooks implementation..."

REQUIRED_HOOKS=("useS3Upload" "useAvatar" "useS3FileAccess")
for hook in "${REQUIRED_HOOKS[@]}"; do
    if find src/hooks -name "*.ts" -o -name "*.tsx" | xargs grep -l "$hook" >/dev/null 2>&1; then
        success "Hook $hook found"
    else
        error "Hook $hook not found"
    fi
done

# 4. Check UI components
log "4. Checking UI components..."

REQUIRED_COMPONENTS=("ImageUpload" "FileInput")
for component in "${REQUIRED_COMPONENTS[@]}"; do
    if find src/components -name "*.tsx" | xargs grep -l "$component" >/dev/null 2>&1; then
        success "Component $component found"
    else
        error "Component $component not found"
    fi
done

# 5. Check Lambda functions
log "5. Checking Lambda functions..."

if [ -d "infra/lambdas/s3-presigned-url" ]; then
    success "S3 presigned URL Lambda found"
    
    if [ -f "infra/lambdas/s3-presigned-url/src/index.ts" ]; then
        success "Lambda source code found"
    else
        error "Lambda source code not found"
    fi
else
    error "S3 presigned URL Lambda directory not found"
fi

if [ -d "infra/lambdas/s3-upload-processor" ]; then
    success "S3 upload processor Lambda found"
else
    warning "S3 upload processor Lambda not found (optional)"
fi

# 6. Check infrastructure code
log "6. Checking infrastructure code..."

if [ -f "infra/aws/s3-buckets-stack.ts" ]; then
    success "S3 buckets stack found"
    
    # Check for required buckets
    REQUIRED_BUCKETS=("matbakh-files-uploads" "matbakh-files-profile" "matbakh-files-reports")
    for bucket in "${REQUIRED_BUCKETS[@]}"; do
        if grep -q "$bucket" infra/aws/s3-buckets-stack.ts; then
            success "Bucket $bucket defined in stack"
        else
            error "Bucket $bucket not found in stack"
        fi
    done
else
    error "S3 buckets stack not found"
fi

# 7. Check database migrations
log "7. Checking database migrations..."

if [ -d "infra/aws/migrations" ]; then
    success "Database migrations directory found"
    
    MIGRATION_FILES=("001_create_user_uploads_table.sql" "002_add_s3_columns_to_existing_tables.sql")
    for migration in "${MIGRATION_FILES[@]}"; do
        if [ -f "infra/aws/migrations/$migration" ]; then
            success "Migration $migration found"
        else
            error "Migration $migration not found"
        fi
    done
else
    error "Database migrations directory not found"
fi

# 8. Check for old Supabase configuration
log "8. Checking for old Supabase configuration..."

# Check for storage configuration in Supabase client
if [ -f "src/integrations/supabase/client.ts" ]; then
    if grep -q "storage" src/integrations/supabase/client.ts; then
        warning "Storage configuration found in Supabase client"
    else
        success "No storage configuration in Supabase client"
    fi
fi

# Check for storage-related environment variables
if [ -f ".env" ]; then
    if grep -q "STORAGE\|BUCKET" .env; then
        info "Storage-related environment variables found in .env:"
        grep "STORAGE\|BUCKET" .env
    fi
fi

# 9. Check package.json for dependencies
log "9. Checking package dependencies..."

if [ -f "package.json" ]; then
    # Check for AWS SDK
    if grep -q "@aws-sdk" package.json; then
        success "AWS SDK dependencies found"
    else
        warning "AWS SDK dependencies not found in package.json"
    fi
    
    # Check for removed Supabase storage dependencies
    if grep -q "supabase.*storage" package.json; then
        warning "Supabase storage dependencies still present"
    else
        success "No Supabase storage dependencies found"
    fi
fi

# 10. Check test files
log "10. Checking test files..."

TEST_FILES=$(find src -name "*.test.ts" -o -name "*.test.tsx" | grep -i s3 || true)
if [ -n "$TEST_FILES" ]; then
    success "S3-related test files found:"
    echo "$TEST_FILES" | while read -r file; do
        echo "  - $file"
    done
else
    warning "No S3-specific test files found"
fi

# 11. Check for temporary migration files
log "11. Checking for temporary migration files..."

TEMP_FILES=$(find . -name "*.bak" -o -name "*.tmp" -o -name "*migration*" -o -name "*supabase-backup*" 2>/dev/null || true)
if [ -n "$TEMP_FILES" ]; then
    warning "Temporary migration files found (consider cleanup):"
    echo "$TEMP_FILES" | while read -r file; do
        echo "  - $file"
    done
else
    success "No temporary migration files found"
fi

# 12. Validate AWS infrastructure (if AWS CLI is available)
log "12. Validating AWS infrastructure..."

if command -v aws &> /dev/null; then
    # Check S3 buckets
    BUCKETS=("matbakh-files-uploads" "matbakh-files-profile" "matbakh-files-reports")
    for bucket in "${BUCKETS[@]}"; do
        if aws s3 ls s3://$bucket/ >/dev/null 2>&1; then
            success "S3 bucket $bucket is accessible"
        else
            error "S3 bucket $bucket is not accessible"
        fi
    done
    
    # Check Lambda functions
    LAMBDA_FUNCTIONS=("matbakh-get-presigned-url")
    for func in "${LAMBDA_FUNCTIONS[@]}"; do
        if aws lambda get-function --function-name $func >/dev/null 2>&1; then
            success "Lambda function $func exists"
        else
            error "Lambda function $func not found"
        fi
    done
    
    # Check CloudFront distribution (if configured)
    if [ -n "${CLOUDFRONT_DISTRIBUTION_ID:-}" ]; then
        if aws cloudfront get-distribution --id $CLOUDFRONT_DISTRIBUTION_ID >/dev/null 2>&1; then
            success "CloudFront distribution is accessible"
        else
            error "CloudFront distribution not accessible"
        fi
    else
        info "CloudFront distribution ID not configured for validation"
    fi
else
    warning "AWS CLI not available - skipping infrastructure validation"
fi

# 13. Check documentation
log "13. Checking documentation..."

DOC_FILES=("docs/s3-operational-guide.md" "docs/s3-troubleshooting-guide.md" "docs/s3-user-guide.md")
for doc in "${DOC_FILES[@]}"; do
    if [ -f "$doc" ]; then
        success "Documentation file $doc found"
    else
        error "Documentation file $doc not found"
    fi
done

# 14. Validate upload workflows
log "14. Validating upload workflows..."

# Check if all upload types are covered
UPLOAD_TYPES=("avatar" "document" "image" "report" "logo")
for upload_type in "${UPLOAD_TYPES[@]}"; do
    if find src -name "*.ts" -o -name "*.tsx" | xargs grep -l "$upload_type.*upload\|upload.*$upload_type" >/dev/null 2>&1; then
        success "Upload workflow for $upload_type found"
    else
        warning "Upload workflow for $upload_type not found"
    fi
done

# 15. Check monitoring and alerting
log "15. Checking monitoring and alerting..."

if [ -f "infra/aws/monitoring-stack.ts" ]; then
    success "Monitoring stack found"
else
    warning "Monitoring stack not found"
fi

if [ -f "scripts/monitor-s3-operations.sh" ]; then
    success "Monitoring script found"
else
    warning "Monitoring script not found"
fi

# 16. Final validation summary
log "16. Final validation summary..."

echo ""
echo -e "${BLUE}📊 Validation Summary${NC}"
echo "===================="

if [ $ISSUES_FOUND -eq 0 ]; then
    echo -e "${GREEN}✅ All validations passed! Migration appears complete.${NC}"
    
    # Create completion certificate
    cat > /tmp/s3-migration-completion-certificate.json << EOF
{
    "migration_type": "supabase-storage-to-s3",
    "validation_date": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "validation_status": "PASSED",
    "issues_found": $ISSUES_FOUND,
    "components_validated": [
        "source_code_cleanup",
        "s3_implementation",
        "react_hooks",
        "ui_components", 
        "lambda_functions",
        "infrastructure_code",
        "database_migrations",
        "aws_resources",
        "documentation",
        "monitoring"
    ],
    "validator": "$(whoami)",
    "validation_log": "$VALIDATION_LOG"
}
EOF
    
    success "Migration completion certificate created: /tmp/s3-migration-completion-certificate.json"
    
elif [ $ISSUES_FOUND -le 5 ]; then
    echo -e "${YELLOW}⚠️  Migration mostly complete with $ISSUES_FOUND minor issues.${NC}"
    echo "Review the issues above and address them to complete the migration."
    
else
    echo -e "${RED}❌ Migration incomplete with $ISSUES_FOUND issues found.${NC}"
    echo "Please address the issues above before considering the migration complete."
fi

echo ""
echo "Detailed validation log: $VALIDATION_LOG"
echo ""

# 17. Cleanup recommendations
if [ $ISSUES_FOUND -eq 0 ]; then
    log "17. Cleanup recommendations..."
    
    echo -e "${BLUE}🧹 Cleanup Recommendations${NC}"
    echo "=========================="
    
    echo "The following files/directories can be safely removed after migration:"
    
    # List potential cleanup items
    CLEANUP_ITEMS=(
        "*.bak files (backup files)"
        "migration scripts in /tmp"
        "old Supabase storage configuration"
        "unused environment variables"
        "temporary test files"
    )
    
    for item in "${CLEANUP_ITEMS[@]}"; do
        echo "  - $item"
    done
    
    echo ""
    echo "Run the cleanup script to remove these items:"
    echo "  ./scripts/cleanup-migration-artifacts.sh"
fi

exit $ISSUES_FOUND