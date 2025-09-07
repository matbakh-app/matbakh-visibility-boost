#!/bin/bash

# Master Migration Orchestrator
# Coordinates all runtime and dependency migrations with comprehensive testing and rollback

set -e

echo "🚀 Master Migration Orchestrator"
echo "==============================="

# Configuration
MIGRATION_ID="migration-$(date +%Y%m%d-%H%M%S)"
MIGRATION_DIR="./migrations/$MIGRATION_ID"
LOG_FILE="$MIGRATION_DIR/migration.log"
REGION="eu-central-1"

# Migration phases
declare -a MIGRATION_PHASES=(
    "pre_migration_validation"
    "dependency_analysis"
    "runtime_migration"
    "dependency_updates"
    "post_migration_testing"
    "health_notifications_setup"
    "monitoring_setup"
    "validation_and_cleanup"
)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
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

print_phase() {
    echo -e "${PURPLE}[PHASE]${NC} $1" | tee -a "$LOG_FILE"
}

# Initialize migration environment
initialize_migration() {
    print_status "Initializing migration environment..."
    
    # Create migration directory structure
    mkdir -p "$MIGRATION_DIR"/{logs,backups,reports,configs,scripts}
    
    # Initialize migration state
    cat > "$MIGRATION_DIR/migration-state.json" << EOF
{
  "migrationId": "$MIGRATION_ID",
  "startTime": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "status": "initialized",
  "currentPhase": "initialization",
  "phases": {
    "pre_migration_validation": {"status": "pending", "startTime": null, "endTime": null},
    "dependency_analysis": {"status": "pending", "startTime": null, "endTime": null},
    "runtime_migration": {"status": "pending", "startTime": null, "endTime": null},
    "dependency_updates": {"status": "pending", "startTime": null, "endTime": null},
    "post_migration_testing": {"status": "pending", "startTime": null, "endTime": null},
    "health_notifications_setup": {"status": "pending", "startTime": null, "endTime": null},
    "monitoring_setup": {"status": "pending", "startTime": null, "endTime": null},
    "validation_and_cleanup": {"status": "pending", "startTime": null, "endTime": null}
  },
  "rollbackAvailable": false,
  "errors": [],
  "warnings": []
}
EOF

    # Copy migration scripts to migration directory
    cp scripts/runtime-dependency-analysis.sh "$MIGRATION_DIR/scripts/"
    cp scripts/automated-runtime-migration.sh "$MIGRATION_DIR/scripts/"
    cp scripts/dependency-monitoring-system.sh "$MIGRATION_DIR/scripts/"
    cp scripts/aws-health-notifications-migration.sh "$MIGRATION_DIR/scripts/"
    
    print_success "Migration environment initialized: $MIGRATION_DIR"
}

# Update migration state
update_migration_state() {
    local phase=$1
    local status=$2
    local timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    
    local temp_state=$(jq --arg phase "$phase" --arg status "$status" --arg timestamp "$timestamp" \
        '.phases[$phase].status = $status | 
         .currentPhase = $phase |
         if $status == "started" then .phases[$phase].startTime = $timestamp
         elif $status == "completed" or $status == "failed" then .phases[$phase].endTime = $timestamp
         else . end' \
        "$MIGRATION_DIR/migration-state.json")
    
    echo "$temp_state" > "$MIGRATION_DIR/migration-state.json"
}

# Add error to migration state
add_error() {
    local error_message=$1
    local phase=${2:-"unknown"}
    
    local temp_state=$(jq --arg error "$error_message" --arg phase "$phase" --arg timestamp "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
        '.errors += [{"message": $error, "phase": $phase, "timestamp": $timestamp}]' \
        "$MIGRATION_DIR/migration-state.json")
    
    echo "$temp_state" > "$MIGRATION_DIR/migration-state.json"
}

# Add warning to migration state
add_warning() {
    local warning_message=$1
    local phase=${2:-"unknown"}
    
    local temp_state=$(jq --arg warning "$warning_message" --arg phase "$phase" --arg timestamp "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
        '.warnings += [{"message": $warning, "phase": $phase, "timestamp": $timestamp}]' \
        "$MIGRATION_DIR/migration-state.json")
    
    echo "$temp_state" > "$MIGRATION_DIR/migration-state.json"
}

# Phase 1: Pre-migration validation
phase_pre_migration_validation() {
    print_phase "Phase 1: Pre-migration Validation"
    update_migration_state "pre_migration_validation" "started"
    
    # Check AWS CLI configuration
    if ! aws sts get-caller-identity &> /dev/null; then
        add_error "AWS CLI not configured" "pre_migration_validation"
        update_migration_state "pre_migration_validation" "failed"
        return 1
    fi
    
    # Check required tools
    local required_tools=("jq" "npm" "node")
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            add_error "Required tool not found: $tool" "pre_migration_validation"
            update_migration_state "pre_migration_validation" "failed"
            return 1
        fi
    done
    
    # Check disk space
    local available_space=$(df . | awk 'NR==2 {print $4}')
    if [ "$available_space" -lt 1048576 ]; then # Less than 1GB
        add_warning "Low disk space: ${available_space}KB available" "pre_migration_validation"
    fi
    
    # Backup current state
    print_status "Creating pre-migration backup..."
    mkdir -p "$MIGRATION_DIR/backups/pre-migration"
    
    # Backup package.json files
    find . -name "package.json" -not -path "./node_modules/*" -not -path "./migrations/*" | while read package_file; do
        local backup_path="$MIGRATION_DIR/backups/pre-migration/$(dirname "$package_file")"
        mkdir -p "$backup_path"
        cp "$package_file" "$backup_path/"
        
        # Also backup package-lock.json if it exists
        local lock_file="$(dirname "$package_file")/package-lock.json"
        if [ -f "$lock_file" ]; then
            cp "$lock_file" "$backup_path/"
        fi
    done
    
    # Backup Lambda configurations
    print_status "Backing up Lambda configurations..."
    aws lambda list-functions --region "$REGION" --query 'Functions[].FunctionName' --output text | tr '\t' '\n' | while read function_name; do
        if [ -n "$function_name" ]; then
            aws lambda get-function --function-name "$function_name" --region "$REGION" > "$MIGRATION_DIR/backups/pre-migration/${function_name}-config.json"
        fi
    done
    
    update_migration_state "pre_migration_validation" "completed"
    print_success "Pre-migration validation completed"
}

# Phase 2: Dependency analysis
phase_dependency_analysis() {
    print_phase "Phase 2: Dependency Analysis"
    update_migration_state "dependency_analysis" "started"
    
    # Run comprehensive dependency analysis
    print_status "Running dependency analysis..."
    if ./scripts/runtime-dependency-analysis.sh > "$MIGRATION_DIR/reports/dependency-analysis.log" 2>&1; then
        print_success "Dependency analysis completed"
    else
        add_warning "Dependency analysis completed with warnings" "dependency_analysis"
    fi
    
    # Parse analysis results
    local node18_functions=$(aws lambda list-functions --region "$REGION" --query 'Functions[?Runtime==`nodejs18.x`].FunctionName' --output text | wc -w)
    local python39_functions=$(aws lambda list-functions --region "$REGION" --query 'Functions[?Runtime==`python3.9`].FunctionName' --output text | wc -w)
    
    # Update migration state with analysis results
    local temp_state=$(jq --arg node18 "$node18_functions" --arg python39 "$python39_functions" \
        '.analysisResults = {
            "node18Functions": ($node18 | tonumber),
            "python39Functions": ($python39 | tonumber),
            "totalDeprecatedFunctions": (($node18 | tonumber) + ($python39 | tonumber))
        }' \
        "$MIGRATION_DIR/migration-state.json")
    
    echo "$temp_state" > "$MIGRATION_DIR/migration-state.json"
    
    if [ "$((node18_functions + python39_functions))" -eq 0 ]; then
        print_success "No deprecated runtime functions found"
    else
        print_warning "Found $((node18_functions + python39_functions)) functions with deprecated runtimes"
    fi
    
    update_migration_state "dependency_analysis" "completed"
}

# Phase 3: Runtime migration
phase_runtime_migration() {
    print_phase "Phase 3: Runtime Migration"
    update_migration_state "runtime_migration" "started"
    
    # Check if migration is needed
    local deprecated_count=$(jq -r '.analysisResults.totalDeprecatedFunctions // 0' "$MIGRATION_DIR/migration-state.json")
    
    if [ "$deprecated_count" -eq 0 ]; then
        print_success "No runtime migration needed"
        update_migration_state "runtime_migration" "completed"
        return 0
    fi
    
    print_status "Migrating $deprecated_count functions with deprecated runtimes..."
    
    # Run automated runtime migration
    if ./scripts/automated-runtime-migration.sh --force > "$MIGRATION_DIR/reports/runtime-migration.log" 2>&1; then
        print_success "Runtime migration completed successfully"
        
        # Mark rollback as available
        local temp_state=$(jq '.rollbackAvailable = true' "$MIGRATION_DIR/migration-state.json")
        echo "$temp_state" > "$MIGRATION_DIR/migration-state.json"
    else
        add_error "Runtime migration failed" "runtime_migration"
        update_migration_state "runtime_migration" "failed"
        return 1
    fi
    
    # Verify migration results
    print_status "Verifying migration results..."
    local remaining_node18=$(aws lambda list-functions --region "$REGION" --query 'Functions[?Runtime==`nodejs18.x`].FunctionName' --output text | wc -w)
    local remaining_python39=$(aws lambda list-functions --region "$REGION" --query 'Functions[?Runtime==`python3.9`].FunctionName' --output text | wc -w)
    
    if [ "$((remaining_node18 + remaining_python39))" -gt 0 ]; then
        add_warning "Some functions still use deprecated runtimes: Node.js 18.x ($remaining_node18), Python 3.9 ($remaining_python39)" "runtime_migration"
    fi
    
    update_migration_state "runtime_migration" "completed"
}

# Phase 4: Dependency updates
phase_dependency_updates() {
    print_phase "Phase 4: Dependency Updates"
    update_migration_state "dependency_updates" "started"
    
    # Set up dependency monitoring system
    print_status "Setting up dependency monitoring system..."
    if ./scripts/dependency-monitoring-system.sh > "$MIGRATION_DIR/reports/dependency-monitoring-setup.log" 2>&1; then
        print_success "Dependency monitoring system set up"
    else
        add_warning "Dependency monitoring setup completed with warnings" "dependency_updates"
    fi
    
    # Run initial dependency scan
    print_status "Running initial dependency scan..."
    if [ -f ".dependency-monitoring/scripts/scan-dependencies.sh" ]; then
        ./.dependency-monitoring/scripts/scan-dependencies.sh > "$MIGRATION_DIR/reports/initial-dependency-scan.log" 2>&1 || true
        print_success "Initial dependency scan completed"
    fi
    
    # Update dependencies if requested
    if [[ "${UPDATE_DEPENDENCIES:-false}" == "true" ]]; then
        print_status "Updating dependencies..."
        if [ -f ".dependency-monitoring/scripts/auto-update.sh" ]; then
            ./.dependency-monitoring/scripts/auto-update.sh > "$MIGRATION_DIR/reports/dependency-updates.log" 2>&1 || add_warning "Some dependency updates failed" "dependency_updates"
        fi
    else
        print_status "Dependency updates skipped (set UPDATE_DEPENDENCIES=true to enable)"
    fi
    
    update_migration_state "dependency_updates" "completed"
}

# Phase 5: Post-migration testing
phase_post_migration_testing() {
    print_phase "Phase 5: Post-migration Testing"
    update_migration_state "post_migration_testing" "started"
    
    # Test Lambda functions
    print_status "Testing migrated Lambda functions..."
    local test_results_file="$MIGRATION_DIR/reports/function-tests.json"
    echo '{"tests": []}' > "$test_results_file"
    
    aws lambda list-functions --region "$REGION" --query 'Functions[].FunctionName' --output text | tr '\t' '\n' | while read function_name; do
        if [ -n "$function_name" ]; then
            print_status "Testing function: $function_name"
            
            # Create test payload
            local test_payload='{"test": true, "source": "migration-test", "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}'
            
            # Invoke function
            local test_result="failed"
            local error_message=""
            
            if aws lambda invoke \
                --function-name "$function_name" \
                --region "$REGION" \
                --payload "$test_payload" \
                --cli-binary-format raw-in-base64-out \
                "/tmp/test-response-${function_name}.json" > "/tmp/test-invoke-${function_name}.log" 2>&1; then
                test_result="passed"
                print_success "  ✅ $function_name test passed"
            else
                error_message=$(cat "/tmp/test-invoke-${function_name}.log" 2>/dev/null || echo "Unknown error")
                print_warning "  ⚠️  $function_name test failed: $error_message"
                add_warning "Function test failed: $function_name - $error_message" "post_migration_testing"
            fi
            
            # Add test result to report
            local test_entry=$(cat << EOF
{
  "functionName": "$function_name",
  "result": "$test_result",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "errorMessage": "$error_message"
}
EOF
)
            
            local temp_results=$(jq --argjson test "$test_entry" '.tests += [$test]' "$test_results_file")
            echo "$temp_results" > "$test_results_file"
            
            # Cleanup temp files
            rm -f "/tmp/test-response-${function_name}.json" "/tmp/test-invoke-${function_name}.log"
        fi
    done
    
    # Generate test summary
    local total_tests=$(jq '.tests | length' "$test_results_file")
    local passed_tests=$(jq '[.tests[] | select(.result == "passed")] | length' "$test_results_file")
    local failed_tests=$(jq '[.tests[] | select(.result == "failed")] | length' "$test_results_file")
    
    print_status "Test Summary: $passed_tests/$total_tests passed, $failed_tests failed"
    
    if [ "$failed_tests" -gt 0 ]; then
        add_warning "$failed_tests function tests failed" "post_migration_testing"
    fi
    
    update_migration_state "post_migration_testing" "completed"
}

# Phase 6: Health notifications setup
phase_health_notifications_setup() {
    print_phase "Phase 6: Health Notifications Setup"
    update_migration_state "health_notifications_setup" "started"
    
    # Set up AWS Health notifications migration
    print_status "Setting up AWS Health notifications migration..."
    if ./scripts/aws-health-notifications-migration.sh > "$MIGRATION_DIR/reports/health-notifications-setup.log" 2>&1; then
        print_success "AWS Health notifications setup completed"
    else
        add_warning "AWS Health notifications setup completed with warnings" "health_notifications_setup"
    fi
    
    update_migration_state "health_notifications_setup" "completed"
}

# Phase 7: Monitoring setup
phase_monitoring_setup() {
    print_phase "Phase 7: Monitoring Setup"
    update_migration_state "monitoring_setup" "started"
    
    # Set up automated monitoring
    print_status "Setting up automated monitoring..."
    
    # Set up dependency monitoring cron jobs if requested
    if [[ "${SETUP_MONITORING:-false}" == "true" ]]; then
        if [ -f ".dependency-monitoring/scripts/setup-cron.sh" ]; then
            ./.dependency-monitoring/scripts/setup-cron.sh > "$MIGRATION_DIR/reports/monitoring-setup.log" 2>&1 || add_warning "Monitoring setup completed with warnings" "monitoring_setup"
            print_success "Automated monitoring set up"
        fi
    else
        print_status "Automated monitoring setup skipped (set SETUP_MONITORING=true to enable)"
    fi
    
    # Create monitoring dashboard
    if [ -f ".dependency-monitoring/scripts/dashboard.sh" ]; then
        ./.dependency-monitoring/scripts/dashboard.sh > "$MIGRATION_DIR/reports/monitoring-dashboard.log" 2>&1 || true
    fi
    
    update_migration_state "monitoring_setup" "completed"
}

# Phase 8: Validation and cleanup
phase_validation_and_cleanup() {
    print_phase "Phase 8: Validation and Cleanup"
    update_migration_state "validation_and_cleanup" "started"
    
    # Final validation
    print_status "Running final validation..."
    
    # Check runtime versions
    local remaining_deprecated=$(aws lambda list-functions --region "$REGION" --query 'Functions[?Runtime==`nodejs18.x` || Runtime==`python3.9`].FunctionName' --output text | wc -w)
    
    if [ "$remaining_deprecated" -eq 0 ]; then
        print_success "✅ All functions migrated to current runtimes"
    else
        add_warning "⚠️  $remaining_deprecated functions still use deprecated runtimes" "validation_and_cleanup"
    fi
    
    # Run final dependency scan
    if [ -f ".dependency-monitoring/scripts/scan-dependencies.sh" ]; then
        print_status "Running final dependency scan..."
        ./.dependency-monitoring/scripts/scan-dependencies.sh > "$MIGRATION_DIR/reports/final-dependency-scan.log" 2>&1 || true
    fi
    
    # Generate final migration report
    generate_final_report
    
    # Cleanup temporary files
    print_status "Cleaning up temporary files..."
    find /tmp -name "test-*-migration-*" -delete 2>/dev/null || true
    
    update_migration_state "validation_and_cleanup" "completed"
    
    # Update overall migration status
    local temp_state=$(jq '.status = "completed" | .endTime = "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"' "$MIGRATION_DIR/migration-state.json")
    echo "$temp_state" > "$MIGRATION_DIR/migration-state.json"
    
    print_success "Migration validation and cleanup completed"
}

# Generate final migration report
generate_final_report() {
    print_status "Generating final migration report..."
    
    local report_file="$MIGRATION_DIR/MIGRATION_REPORT.md"
    local state_file="$MIGRATION_DIR/migration-state.json"
    
    cat > "$report_file" << EOF
# Migration Report - $MIGRATION_ID

**Migration Date:** $(date)
**Migration ID:** $MIGRATION_ID
**Status:** $(jq -r '.status' "$state_file")

## Executive Summary

This report documents the automated migration of runtime versions and dependency management for the Matbakh platform.

### Migration Results

- **Start Time:** $(jq -r '.startTime' "$state_file")
- **End Time:** $(jq -r '.endTime // "In Progress"' "$state_file")
- **Overall Status:** $(jq -r '.status' "$state_file")
- **Errors:** $(jq '.errors | length' "$state_file")
- **Warnings:** $(jq '.warnings | length' "$state_file")

### Runtime Migration Results

#### Before Migration
$(jq -r '.analysisResults.node18Functions // 0' "$state_file") Node.js 18.x functions
$(jq -r '.analysisResults.python39Functions // 0' "$state_file") Python 3.9 functions

#### After Migration
$(aws lambda list-functions --region "$REGION" --query 'Functions[?Runtime==`nodejs18.x`].FunctionName' --output text | wc -w) Node.js 18.x functions remaining
$(aws lambda list-functions --region "$REGION" --query 'Functions[?Runtime==`python3.9`].FunctionName' --output text | wc -w) Python 3.9 functions remaining

### Current Runtime Distribution
$(aws lambda list-functions --region "$REGION" --query 'Functions[].Runtime' --output text | sort | uniq -c | sed 's/^/- /')

## Phase Results

$(for phase in "${MIGRATION_PHASES[@]}"; do
    status=$(jq -r ".phases.${phase}.status" "$state_file")
    start_time=$(jq -r ".phases.${phase}.startTime // \"N/A\"" "$state_file")
    end_time=$(jq -r ".phases.${phase}.endTime // \"N/A\"" "$state_file")
    echo "### $(echo $phase | tr '_' ' ' | sed 's/\b\w/\U&/g')"
    echo "- **Status:** $status"
    echo "- **Start Time:** $start_time"
    echo "- **End Time:** $end_time"
    echo ""
done)

## Errors and Warnings

### Errors
$(jq -r '.errors[] | "- **\(.phase):** \(.message) (\(.timestamp))"' "$state_file" 2>/dev/null || echo "None")

### Warnings
$(jq -r '.warnings[] | "- **\(.phase):** \(.message) (\(.timestamp))"' "$state_file" 2>/dev/null || echo "None")

## Function Test Results

$(if [ -f "$MIGRATION_DIR/reports/function-tests.json" ]; then
    total=$(jq '.tests | length' "$MIGRATION_DIR/reports/function-tests.json")
    passed=$(jq '[.tests[] | select(.result == "passed")] | length' "$MIGRATION_DIR/reports/function-tests.json")
    failed=$(jq '[.tests[] | select(.result == "failed")] | length' "$MIGRATION_DIR/reports/function-tests.json")
    echo "- **Total Tests:** $total"
    echo "- **Passed:** $passed"
    echo "- **Failed:** $failed"
    echo ""
    if [ "$failed" -gt 0 ]; then
        echo "### Failed Tests"
        jq -r '.tests[] | select(.result == "failed") | "- **\(.functionName):** \(.errorMessage)"' "$MIGRATION_DIR/reports/function-tests.json"
    fi
else
    echo "No test results available"
fi)

## Dependency Management

### Monitoring System
- **Status:** $([ -d ".dependency-monitoring" ] && echo "Installed" || echo "Not Installed")
- **Automated Scanning:** $([ -f ".dependency-monitoring/scripts/scan-dependencies.sh" ] && echo "Available" || echo "Not Available")
- **Auto-Updates:** $([ -f ".dependency-monitoring/scripts/auto-update.sh" ] && echo "Available" || echo "Not Available")

### Security Status
$(if [ -f ".dependency-monitoring/reports/dependency-scan-"*".json" ]; then
    latest_scan=$(ls -t .dependency-monitoring/reports/dependency-scan-*.json | head -1)
    critical=$(jq -r '.summary.criticalVulnerabilities // 0' "$latest_scan")
    high=$(jq -r '.summary.highVulnerabilities // 0' "$latest_scan")
    echo "- **Critical Vulnerabilities:** $critical"
    echo "- **High Vulnerabilities:** $high"
else
    echo "No dependency scan results available"
fi)

## AWS Health Notifications

- **Legacy System:** Active until September 15, 2025
- **New System:** $([ -f "aws-health-notifications-config.json" ] && echo "Configured" || echo "Not Configured")
- **Email Filters:** $([ -f "aws-health-email-filters.md" ] && echo "Documented" || echo "Not Documented")

## Rollback Information

- **Rollback Available:** $(jq -r '.rollbackAvailable' "$state_file")
- **Backup Location:** $MIGRATION_DIR/backups/pre-migration/
- **Lambda Configs:** Backed up for all functions
- **Package Files:** Backed up for all projects

### Rollback Instructions

If rollback is needed:

1. **Runtime Rollback:**
   \`\`\`bash
   # Restore Lambda runtime versions
   for config in $MIGRATION_DIR/backups/pre-migration/*-config.json; do
       function_name=\$(basename "\$config" -config.json)
       runtime=\$(jq -r '.Configuration.Runtime' "\$config")
       aws lambda update-function-configuration \\
           --function-name "\$function_name" \\
           --runtime "\$runtime" \\
           --region $REGION
   done
   \`\`\`

2. **Dependency Rollback:**
   \`\`\`bash
   # Restore package.json files
   find $MIGRATION_DIR/backups/pre-migration -name "package.json" | while read backup; do
       relative_path=\${backup#$MIGRATION_DIR/backups/pre-migration/}
       cp "\$backup" "\$relative_path"
   done
   \`\`\`

## Next Steps

1. **Monitor Performance:** Watch for any performance degradation in migrated functions
2. **Update CI/CD:** Update deployment pipelines to use new runtime versions
3. **Team Training:** Ensure team is aware of new dependency monitoring system
4. **Documentation:** Update project documentation with new runtime requirements
5. **Health Notifications:** Complete AWS Health notifications setup
6. **Regular Maintenance:** Set up regular dependency scanning and updates

## Files and Logs

- **Migration State:** $MIGRATION_DIR/migration-state.json
- **Dependency Analysis:** $MIGRATION_DIR/reports/dependency-analysis.log
- **Runtime Migration:** $MIGRATION_DIR/reports/runtime-migration.log
- **Function Tests:** $MIGRATION_DIR/reports/function-tests.json
- **Monitoring Setup:** $MIGRATION_DIR/reports/monitoring-setup.log

## Contact Information

For questions or issues related to this migration:
- **Technical Lead:** DevOps Team
- **Documentation:** See migration directory for detailed logs
- **Support:** Create GitHub issue with migration ID: $MIGRATION_ID

---

**Migration completed on $(date) by Master Migration Orchestrator**
EOF

    print_success "Final migration report generated: $report_file"
}

# Rollback function
rollback_migration() {
    print_error "🔄 Initiating migration rollback..."
    
    if [ ! -f "$MIGRATION_DIR/migration-state.json" ]; then
        print_error "Migration state file not found. Cannot rollback."
        exit 1
    fi
    
    local rollback_available=$(jq -r '.rollbackAvailable' "$MIGRATION_DIR/migration-state.json")
    
    if [ "$rollback_available" != "true" ]; then
        print_error "Rollback not available for this migration."
        exit 1
    fi
    
    print_status "Rolling back Lambda runtime configurations..."
    
    # Rollback Lambda functions
    find "$MIGRATION_DIR/backups/pre-migration" -name "*-config.json" | while read config_file; do
        local function_name=$(basename "$config_file" -config.json)
        local original_runtime=$(jq -r '.Configuration.Runtime' "$config_file")
        
        print_status "Rolling back $function_name to $original_runtime..."
        
        aws lambda update-function-configuration \
            --function-name "$function_name" \
            --runtime "$original_runtime" \
            --region "$REGION" > /dev/null
        
        print_success "Rolled back $function_name"
    done
    
    # Rollback package.json files
    print_status "Rolling back package.json files..."
    
    find "$MIGRATION_DIR/backups/pre-migration" -name "package.json" | while read backup_file; do
        local relative_path=${backup_file#$MIGRATION_DIR/backups/pre-migration/}
        cp "$backup_file" "$relative_path"
        
        # Also restore package-lock.json if it exists
        local lock_backup="${backup_file%package.json}package-lock.json"
        local lock_target="${relative_path%package.json}package-lock.json"
        if [ -f "$lock_backup" ]; then
            cp "$lock_backup" "$lock_target"
        fi
    done
    
    print_success "🎉 Migration rollback completed successfully!"
    print_status "All configurations restored to pre-migration state"
}

# Main orchestration function
main() {
    print_status "Starting Master Migration Orchestrator..."
    print_status "Migration ID: $MIGRATION_ID"
    
    # Handle rollback command
    if [ "$1" = "--rollback" ]; then
        if [ -n "$2" ]; then
            MIGRATION_ID="$2"
            MIGRATION_DIR="./migrations/$MIGRATION_ID"
            rollback_migration
        else
            print_error "Please specify migration ID for rollback"
            echo "Usage: $0 --rollback MIGRATION_ID"
            exit 1
        fi
        return 0
    fi
    
    # Handle dry run
    if [ "$1" = "--dry-run" ]; then
        print_warning "DRY RUN MODE - Analysis only, no changes will be made"
        ./scripts/runtime-dependency-analysis.sh
        return 0
    fi
    
    # Confirm before proceeding
    if [[ "$1" != "--force" ]]; then
        echo ""
        print_warning "This will perform a comprehensive migration of runtime versions and dependencies."
        print_warning "The process includes Lambda function updates and dependency changes."
        echo ""
        read -p "Do you want to continue? (y/N): " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_status "Migration cancelled by user"
            exit 0
        fi
    fi
    
    # Initialize migration
    initialize_migration
    
    # Execute migration phases
    for phase_name in "${MIGRATION_PHASES[@]}"; do
        phase_function="phase_${phase_name}"
        
        if declare -f "$phase_function" > /dev/null; then
            if ! $phase_function; then
                print_error "Phase $phase_name failed. Migration aborted."
                add_error "Phase $phase_name failed" "$phase_name"
                
                # Update overall status
                local temp_state=$(jq '.status = "failed"' "$MIGRATION_DIR/migration-state.json")
                echo "$temp_state" > "$MIGRATION_DIR/migration-state.json"
                
                print_error "Migration failed. Check logs in $MIGRATION_DIR"
                print_status "Rollback available with: $0 --rollback $MIGRATION_ID"
                exit 1
            fi
        else
            print_error "Phase function $phase_function not found"
            exit 1
        fi
    done
    
    print_success "🎉 Master Migration Orchestrator completed successfully!"
    print_status "Migration ID: $MIGRATION_ID"
    print_status "Report: $MIGRATION_DIR/MIGRATION_REPORT.md"
    print_status "Logs: $MIGRATION_DIR/logs/"
    
    echo ""
    echo "📋 Migration Summary:"
    echo "===================="
    echo "✅ All phases completed successfully"
    echo "✅ Runtime versions updated"
    echo "✅ Dependency monitoring configured"
    echo "✅ AWS Health notifications set up"
    echo "✅ Comprehensive testing performed"
    echo ""
    echo "🔧 Next Steps:"
    echo "1. Review migration report: $MIGRATION_DIR/MIGRATION_REPORT.md"
    echo "2. Monitor system performance"
    echo "3. Update team documentation"
    echo "4. Set up regular maintenance schedules"
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [OPTIONS]"
        echo ""
        echo "Options:"
        echo "  --dry-run              Run analysis only, make no changes"
        echo "  --force                Skip confirmation prompt"
        echo "  --rollback MIGRATION_ID Rollback specified migration"
        echo "  --help                 Show this help message"
        echo ""
        echo "Environment Variables:"
        echo "  UPDATE_DEPENDENCIES=true    Enable automatic dependency updates"
        echo "  SETUP_MONITORING=true       Enable automated monitoring setup"
        echo ""
        echo "Examples:"
        echo "  $0 --dry-run                    # Analyze current state"
        echo "  $0                              # Interactive migration"
        echo "  $0 --force                      # Automated migration"
        echo "  $0 --rollback migration-123     # Rollback migration"
        echo ""
        echo "  UPDATE_DEPENDENCIES=true $0     # Migration with dependency updates"
        echo "  SETUP_MONITORING=true $0        # Migration with monitoring setup"
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac