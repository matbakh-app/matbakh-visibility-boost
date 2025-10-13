#!/bin/bash
# Enhanced Green Core Test Runner
# Must complete in <5 minutes and achieve 99.9% pass rate
# This script blocks merges on failure

set -e

# Configuration
TIMEOUT_COMPILATION=30
TIMEOUT_TEST_SUITE=120
MAX_WORKERS=${JEST_MAX_WORKERS:-"50%"}
VERBOSE=${1:-""}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Start timer
START_TIME=$(date +%s)

log_info "🟢 Starting Green Core Test Suite..."
log_info "Configuration: Timeout=${TIMEOUT_COMPILATION}s+${TIMEOUT_TEST_SUITE}s, Workers=${MAX_WORKERS}"

# Create logs directory
mkdir -p logs/green-core

# Function to check if we're in CI
is_ci() {
    [[ "${CI}" == "true" ]] || [[ -n "${GITHUB_ACTIONS}" ]] || [[ -n "${GITLAB_CI}" ]]
}

# Function to run with timeout and logging
run_with_timeout() {
    local timeout_duration=$1
    local description=$2
    shift 2
    local cmd="$@"
    
    log_info "Running: ${description}"
    
    if is_ci; then
        # In CI: Use timeout and capture output
        if timeout ${timeout_duration} bash -c "$cmd" > "logs/green-core/${description// /_}.log" 2>&1; then
            log_success "${description} completed successfully"
            return 0
        else
            local exit_code=$?
            log_error "${description} failed (exit code: ${exit_code})"
            if [[ -f "logs/green-core/${description// /_}.log" ]]; then
                echo "Last 20 lines of output:"
                tail -20 "logs/green-core/${description// /_}.log"
            fi
            return $exit_code
        fi
    else
        # Local development: Show output directly
        if timeout ${timeout_duration} bash -c "$cmd"; then
            log_success "${description} completed successfully"
            return 0
        else
            local exit_code=$?
            log_error "${description} failed (exit code: ${exit_code})"
            return $exit_code
        fi
    fi
}

# 1. TypeScript Compilation Check (30 seconds max)
log_info "Phase 1: TypeScript Compilation Validation"
run_with_timeout ${TIMEOUT_COMPILATION} "TypeScript Compilation" \
    "npx tsc --noEmit --skipLibCheck"

# 2. Kiro System Purity Validation (2 minutes max)
log_info "Phase 2: Kiro System Purity Validation"
KIRO_PURITY_CMD="jest --config jest.config.enhanced.cjs --verbose --maxWorkers=${MAX_WORKERS} \
    --testPathPattern='kiro-system-purity-validator\.test\.ts$' \
    --testNamePattern='should validate a pure Kiro system' \
    --passWithNoTests=false"

if [[ "$VERBOSE" == "--verbose" ]]; then
    KIRO_PURITY_CMD="$KIRO_PURITY_CMD --verbose"
fi

run_with_timeout ${TIMEOUT_TEST_SUITE} "Kiro System Purity" "$KIRO_PURITY_CMD"

# 3. Persona Service Core Validation (2 minutes max)
log_info "Phase 3: Persona Service Core Validation"
PERSONA_CMD="jest --config jest.config.enhanced.cjs --verbose --maxWorkers=${MAX_WORKERS} \
    --testPathPattern='persona-api.*\.test\.ts$' \
    --testNamePattern='should complete full persona workflow|should handle API errors gracefully|should work in mock mode when enabled' \
    --passWithNoTests=false"

if [[ "$VERBOSE" == "--verbose" ]]; then
    PERSONA_CMD="$PERSONA_CMD --verbose"
fi

run_with_timeout ${TIMEOUT_TEST_SUITE} "Persona Service Core" "$PERSONA_CMD"

# 4. Basic Build Validation (1 minute max)
log_info "Phase 4: Build Validation"
run_with_timeout 60 "Build Validation" "npm run build"

# Calculate total execution time
END_TIME=$(date +%s)
TOTAL_TIME=$((END_TIME - START_TIME))

# Success summary
log_success "🎉 Green Core Tests Completed Successfully!"
log_info "Total execution time: ${TOTAL_TIME} seconds"
log_info "System is ready for merge ✅"

# Performance check
if [[ $TOTAL_TIME -gt 300 ]]; then
    log_warning "Green Core tests took longer than 5 minutes (${TOTAL_TIME}s)"
    log_warning "Consider optimizing test performance"
fi

# Generate success report
cat > logs/green-core/success-report.txt << EOF
Green Core Test Suite - Success Report
=====================================
Date: $(date)
Total Time: ${TOTAL_TIME} seconds
Status: PASSED ✅

Test Results:
- TypeScript Compilation: ✅ PASSED
- Kiro System Purity: ✅ PASSED  
- Persona Service Core: ✅ PASSED
- Build Validation: ✅ PASSED

System Status: READY FOR MERGE
EOF

log_success "Success report saved to logs/green-core/success-report.txt"

exit 0