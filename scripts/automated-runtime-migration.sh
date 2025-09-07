#!/bin/bash

# Automated Runtime Migration System
# Safely migrates Lambda functions to current runtime versions with rollback capability

set -e

echo "🚀 Automated Runtime Migration System"
echo "====================================="

# Configuration
REGION="eu-central-1"
BACKUP_DIR="./migration-backups/$(date +%Y%m%d-%H%M%S)"
LOG_FILE="migration-$(date +%Y%m%d-%H%M%S).log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS CLI not configured. Please run 'aws configure' first."
        exit 1
    fi
    
    if ! command -v jq &> /dev/null; then
        print_error "jq is required but not installed. Please install jq."
        exit 1
    fi
    
    # Create backup directory
    mkdir -p "$BACKUP_DIR"
    print_success "Created backup directory: $BACKUP_DIR"
}

# Backup function configuration
backup_function_config() {
    local function_name=$1
    print_status "Backing up configuration for $function_name..."
    
    aws lambda get-function \
        --function-name "$function_name" \
        --region "$REGION" > "$BACKUP_DIR/${function_name}-config.json"
    
    print_success "Backed up $function_name configuration"
}

# Test function after migration
test_function() {
    local function_name=$1
    print_status "Testing function $function_name..."
    
    # Create a simple test payload
    local test_payload='{"test": true, "source": "migration-test"}'
    
    # Invoke function with test payload
    local result=$(aws lambda invoke \
        --function-name "$function_name" \
        --region "$REGION" \
        --payload "$test_payload" \
        --cli-binary-format raw-in-base64-out \
        /tmp/test-response-${function_name}.json 2>&1 || echo "FAILED")
    
    if [[ "$result" == *"FAILED"* ]] || [[ "$result" == *"error"* ]]; then
        print_error "Function test failed for $function_name"
        return 1
    else
        print_success "Function test passed for $function_name"
        return 0
    fi
}

# Rollback function to previous runtime
rollback_function() {
    local function_name=$1
    print_warning "Rolling back $function_name to previous configuration..."
    
    if [ -f "$BACKUP_DIR/${function_name}-config.json" ]; then
        local old_runtime=$(jq -r '.Configuration.Runtime' "$BACKUP_DIR/${function_name}-config.json")
        
        aws lambda update-function-configuration \
            --function-name "$function_name" \
            --runtime "$old_runtime" \
            --region "$REGION" > /dev/null
        
        print_success "Rolled back $function_name to $old_runtime"
    else
        print_error "No backup found for $function_name, cannot rollback"
    fi
}

# Migrate Node.js functions
migrate_nodejs_functions() {
    print_status "Starting Node.js 18.x to 20.x migration..."
    
    local functions=$(aws lambda list-functions \
        --region "$REGION" \
        --query 'Functions[?Runtime==`nodejs18.x`].FunctionName' \
        --output text)
    
    if [ -z "$functions" ]; then
        print_success "No Node.js 18.x functions found to migrate"
        return 0
    fi
    
    local success_count=0
    local failure_count=0
    local failed_functions=()
    
    for function in $functions; do
        print_status "Migrating $function from Node.js 18.x to 20.x..."
        
        # Backup current configuration
        backup_function_config "$function"
        
        # Update runtime
        if aws lambda update-function-configuration \
            --function-name "$function" \
            --runtime "nodejs20.x" \
            --region "$REGION" > /dev/null 2>&1; then
            
            # Wait for update to complete
            print_status "Waiting for update to complete..."
            aws lambda wait function-updated --function-name "$function" --region "$REGION"
            
            # Test the function
            if test_function "$function"; then
                print_success "✅ Successfully migrated $function to Node.js 20.x"
                success_count=$((success_count + 1))
            else
                print_error "❌ Function test failed after migration, rolling back..."
                rollback_function "$function"
                failure_count=$((failure_count + 1))
                failed_functions+=("$function")
            fi
        else
            print_error "❌ Failed to update runtime for $function"
            failure_count=$((failure_count + 1))
            failed_functions+=("$function")
        fi
        
        # Small delay between migrations
        sleep 2
    done
    
    print_status "Node.js migration summary:"
    print_success "  Successful migrations: $success_count"
    if [ $failure_count -gt 0 ]; then
        print_error "  Failed migrations: $failure_count"
        print_error "  Failed functions: ${failed_functions[*]}"
    fi
}

# Migrate Python functions
migrate_python_functions() {
    print_status "Starting Python 3.9 to 3.11 migration..."
    
    local functions=$(aws lambda list-functions \
        --region "$REGION" \
        --query 'Functions[?Runtime==`python3.9`].FunctionName' \
        --output text)
    
    if [ -z "$functions" ]; then
        print_success "No Python 3.9 functions found to migrate"
        return 0
    fi
    
    local success_count=0
    local failure_count=0
    local failed_functions=()
    
    for function in $functions; do
        print_status "Migrating $function from Python 3.9 to 3.11..."
        
        # Backup current configuration
        backup_function_config "$function"
        
        # Update runtime
        if aws lambda update-function-configuration \
            --function-name "$function" \
            --runtime "python3.11" \
            --region "$REGION" > /dev/null 2>&1; then
            
            # Wait for update to complete
            print_status "Waiting for update to complete..."
            aws lambda wait function-updated --function-name "$function" --region "$REGION"
            
            # Test the function
            if test_function "$function"; then
                print_success "✅ Successfully migrated $function to Python 3.11"
                success_count=$((success_count + 1))
            else
                print_error "❌ Function test failed after migration, rolling back..."
                rollback_function "$function"
                failure_count=$((failure_count + 1))
                failed_functions+=("$function")
            fi
        else
            print_error "❌ Failed to update runtime for $function"
            failure_count=$((failure_count + 1))
            failed_functions+=("$function")
        fi
        
        # Small delay between migrations
        sleep 2
    done
    
    print_status "Python migration summary:"
    print_success "  Successful migrations: $success_count"
    if [ $failure_count -gt 0 ]; then
        print_error "  Failed migrations: $failure_count"
        print_error "  Failed functions: ${failed_functions[*]}"
    fi
}

# Update package.json files
update_package_json_files() {
    print_status "Updating package.json files for Node.js 20.x compatibility..."
    
    # Update main package.json
    if [ -f "package.json" ]; then
        print_status "Updating main package.json..."
        
        # Backup original
        cp package.json "$BACKUP_DIR/main-package.json.backup"
        
        # Update engines field
        if command -v jq &> /dev/null; then
            jq '.engines.node = ">=20.0.0"' package.json > package.json.tmp && mv package.json.tmp package.json
            print_success "Updated main package.json engines field"
        fi
    fi
    
    # Update Lambda package.json files
    find infra/lambdas -name "package.json" -type f | while read package_file; do
        lambda_dir=$(dirname "$package_file")
        lambda_name=$(basename "$lambda_dir")
        
        print_status "Updating $lambda_name package.json..."
        
        # Backup original
        cp "$package_file" "$BACKUP_DIR/${lambda_name}-package.json.backup"
        
        # Update engines field
        if command -v jq &> /dev/null; then
            jq '.engines.node = ">=20.0.0"' "$package_file" > "$package_file.tmp" && mv "$package_file.tmp" "$package_file"
            print_success "Updated $lambda_name package.json engines field"
        fi
    done
}

# Update dependencies
update_dependencies() {
    print_status "Updating NPM dependencies..."
    
    # Update main dependencies
    if [ -f "package.json" ]; then
        print_status "Updating main project dependencies..."
        npm update 2>&1 | tee -a "$LOG_FILE"
        
        # Fix security vulnerabilities
        npm audit fix --audit-level=moderate 2>&1 | tee -a "$LOG_FILE" || true
    fi
    
    # Update Lambda dependencies
    find infra/lambdas -name "package.json" -type f | while read package_file; do
        lambda_dir=$(dirname "$package_file")
        lambda_name=$(basename "$lambda_dir")
        
        print_status "Updating $lambda_name dependencies..."
        cd "$lambda_dir"
        
        npm update 2>&1 | tee -a "../../../$LOG_FILE"
        npm audit fix --audit-level=moderate 2>&1 | tee -a "../../../$LOG_FILE" || true
        
        cd - > /dev/null
    done
}

# Replace deprecated packages
replace_deprecated_packages() {
    print_status "Replacing deprecated packages..."
    
    # Define replacements
    declare -A replacements=(
        ["inflight"]="lru-cache"
        ["glob@7"]="glob@latest"
        ["crypto@1.0.1"]=""  # Remove, use built-in crypto
    )
    
    for package in "${!replacements[@]}"; do
        replacement="${replacements[$package]}"
        
        if [ -f "package.json" ] && grep -q "\"$package\"" package.json; then
            print_status "Replacing $package with $replacement in main package.json..."
            
            if [ -n "$replacement" ]; then
                npm uninstall "$package" 2>&1 | tee -a "$LOG_FILE" || true
                npm install "$replacement" 2>&1 | tee -a "$LOG_FILE" || true
            else
                npm uninstall "$package" 2>&1 | tee -a "$LOG_FILE" || true
            fi
        fi
    done
    
    # Check Lambda packages
    find infra/lambdas -name "package.json" -type f | while read package_file; do
        lambda_dir=$(dirname "$package_file")
        lambda_name=$(basename "$lambda_dir")
        
        for package in "${!replacements[@]}"; do
            replacement="${replacements[$package]}"
            
            if grep -q "\"$package\"" "$package_file"; then
                print_status "Replacing $package with $replacement in $lambda_name..."
                cd "$lambda_dir"
                
                if [ -n "$replacement" ]; then
                    npm uninstall "$package" 2>&1 | tee -a "../../../$LOG_FILE" || true
                    npm install "$replacement" 2>&1 | tee -a "../../../$LOG_FILE" || true
                else
                    npm uninstall "$package" 2>&1 | tee -a "../../../$LOG_FILE" || true
                fi
                
                cd - > /dev/null
            fi
        done
    done
}

# Generate migration report
generate_report() {
    print_status "Generating migration report..."
    
    local report_file="migration-report-$(date +%Y%m%d-%H%M%S).md"
    
    cat > "$report_file" << EOF
# Runtime Migration Report

**Date:** $(date)
**Migration ID:** $(date +%Y%m%d-%H%M%S)

## Summary

This report documents the automated migration of Lambda functions from deprecated runtime versions to current versions.

## Migration Results

### Node.js Migration (18.x → 20.x)
$(aws lambda list-functions --region "$REGION" --query 'Functions[?Runtime==`nodejs20.x`].[FunctionName,Runtime]' --output table)

### Python Migration (3.9 → 3.11)
$(aws lambda list-functions --region "$REGION" --query 'Functions[?Runtime==`python3.11`].[FunctionName,Runtime]' --output table)

## Remaining Deprecated Functions

### Node.js 18.x Functions
$(aws lambda list-functions --region "$REGION" --query 'Functions[?Runtime==`nodejs18.x`].FunctionName' --output text | tr '\t' '\n' | sed 's/^/- /' || echo "None")

### Python 3.9 Functions
$(aws lambda list-functions --region "$REGION" --query 'Functions[?Runtime==`python3.9`].FunctionName' --output text | tr '\t' '\n' | sed 's/^/- /' || echo "None")

## Backup Location

Configuration backups stored in: \`$BACKUP_DIR\`

## Next Steps

1. Monitor migrated functions for performance and stability
2. Update CI/CD pipelines to use new runtime versions
3. Schedule follow-up migration for any remaining deprecated functions
4. Update documentation to reflect new runtime requirements

## Rollback Instructions

If rollback is needed for any function:

\`\`\`bash
# Restore from backup
aws lambda update-function-configuration \\
    --function-name FUNCTION_NAME \\
    --runtime ORIGINAL_RUNTIME \\
    --region $REGION
\`\`\`

Backup configurations are available in: \`$BACKUP_DIR\`
EOF

    print_success "Migration report generated: $report_file"
}

# Main execution
main() {
    print_status "Starting automated runtime migration..."
    
    # Check if this is a dry run
    if [[ "$1" == "--dry-run" ]]; then
        print_warning "DRY RUN MODE - No changes will be made"
        # Run analysis only
        ./scripts/runtime-dependency-analysis.sh
        return 0
    fi
    
    # Confirm before proceeding
    if [[ "$1" != "--force" ]]; then
        echo ""
        print_warning "This will migrate Lambda functions to current runtime versions."
        print_warning "Backups will be created, but this operation affects production functions."
        echo ""
        read -p "Do you want to continue? (y/N): " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_status "Migration cancelled by user"
            exit 0
        fi
    fi
    
    # Execute migration steps
    check_prerequisites
    migrate_nodejs_functions
    migrate_python_functions
    update_package_json_files
    update_dependencies
    replace_deprecated_packages
    generate_report
    
    print_success "🎉 Automated runtime migration completed!"
    print_status "Check the migration report and logs for details"
    print_status "Backups stored in: $BACKUP_DIR"
    print_status "Log file: $LOG_FILE"
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [OPTIONS]"
        echo ""
        echo "Options:"
        echo "  --dry-run    Run analysis only, make no changes"
        echo "  --force      Skip confirmation prompt"
        echo "  --help       Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0 --dry-run    # Analyze current state"
        echo "  $0              # Interactive migration"
        echo "  $0 --force      # Automated migration"
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac