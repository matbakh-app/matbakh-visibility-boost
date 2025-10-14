#!/bin/bash

# Master Test Runner for Phase 8
# Runs all integration, DSGVO, and performance tests

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
TEST_DIR="$(dirname "$0")"
LOG_DIR="./test-results"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo -e "${MAGENTA}🚀 Phase 8 Complete Test Suite${NC}"
echo "======================================"
echo "Timestamp: $(date)"
echo "Log directory: $LOG_DIR"
echo ""

# Create log directory
mkdir -p "$LOG_DIR"

# Check prerequisites
echo -e "${BLUE}🔍 Checking Prerequisites...${NC}"
PREREQ_FAILED=false

# Check environment variables
if [ -z "$AUTH_TOKEN" ]; then
  echo -e "${YELLOW}⚠️  AUTH_TOKEN not set - some tests will be skipped${NC}"
fi

if [ -z "$DATABASE_URL" ]; then
  echo -e "${YELLOW}⚠️  DATABASE_URL not set - database tests will be skipped${NC}"
fi

# Check required commands
REQUIRED_COMMANDS=("curl" "date" "bc")
for cmd in "${REQUIRED_COMMANDS[@]}"; do
  if ! command -v "$cmd" &> /dev/null; then
    echo -e "${RED}❌ Required command not found: $cmd${NC}"
    PREREQ_FAILED=true
  fi
done

# Check optional commands
OPTIONAL_COMMANDS=("aws" "psql" "jq")
for cmd in "${OPTIONAL_COMMANDS[@]}"; do
  if ! command -v "$cmd" &> /dev/null; then
    echo -e "${YELLOW}⚠️  Optional command not found: $cmd (some tests will be limited)${NC}"
  fi
done

if [ "$PREREQ_FAILED" = true ]; then
  echo -e "${RED}❌ Prerequisites not met. Please install missing commands.${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Prerequisites check complete${NC}"
echo ""

# Function to run test and capture results
run_test() {
  local test_name="$1"
  local test_script="$2"
  local log_file="$LOG_DIR/${test_name}_${TIMESTAMP}.log"
  
  echo -e "${BLUE}🧪 Running $test_name...${NC}"
  echo "Log file: $log_file"
  
  if [ -f "$test_script" ]; then
    chmod +x "$test_script"
    
    # Run test and capture output
    if "$test_script" > "$log_file" 2>&1; then
      echo -e "${GREEN}✅ $test_name: PASSED${NC}"
      return 0
    else
      echo -e "${RED}❌ $test_name: FAILED${NC}"
      echo "Check log file for details: $log_file"
      return 1
    fi
  else
    echo -e "${RED}❌ Test script not found: $test_script${NC}"
    return 1
  fi
}

# Test execution
TEST_RESULTS=()
TOTAL_TESTS=0
PASSED_TESTS=0

# Phase 8.1: Unit Tests
echo -e "\n${MAGENTA}📋 Phase 8.1: Unit Tests${NC}"
echo "Running Jest test suite..."
if npm test > "$LOG_DIR/unit_tests_${TIMESTAMP}.log" 2>&1; then
  echo -e "${GREEN}✅ Unit Tests: PASSED${NC}"
  TEST_RESULTS+=("Unit Tests: PASSED")
  ((PASSED_TESTS++))
else
  echo -e "${RED}❌ Unit Tests: FAILED${NC}"
  TEST_RESULTS+=("Unit Tests: FAILED")
fi
((TOTAL_TESTS++))

# Phase 8.2: Integration Tests
echo -e "\n${MAGENTA}📋 Phase 8.2: Integration Tests${NC}"
if run_test "Integration Tests" "$TEST_DIR/phase8.2-integration-tests.sh"; then
  TEST_RESULTS+=("Integration Tests: PASSED")
  ((PASSED_TESTS++))
else
  TEST_RESULTS+=("Integration Tests: FAILED")
fi
((TOTAL_TESTS++))

# Phase 8.3: DSGVO Tests
echo -e "\n${MAGENTA}📋 Phase 8.3: DSGVO Validation${NC}"
if run_test "DSGVO Tests" "$TEST_DIR/phase8.3-dsgvo-tests.sh"; then
  TEST_RESULTS+=("DSGVO Tests: PASSED")
  ((PASSED_TESTS++))
else
  TEST_RESULTS+=("DSGVO Tests: FAILED")
fi
((TOTAL_TESTS++))

# Phase 8.4: Performance Tests
echo -e "\n${MAGENTA}📋 Phase 8.4: Performance Tests${NC}"
if run_test "Performance Tests" "$TEST_DIR/phase8.4-performance-tests.sh"; then
  TEST_RESULTS+=("Performance Tests: PASSED")
  ((PASSED_TESTS++))
else
  TEST_RESULTS+=("Performance Tests: FAILED")
fi
((TOTAL_TESTS++))

# Generate summary report
REPORT_FILE="$LOG_DIR/phase8_summary_${TIMESTAMP}.md"
cat > "$REPORT_FILE" << EOF
# Phase 8 Test Results Summary

**Date:** $(date)  
**Total Tests:** $TOTAL_TESTS  
**Passed:** $PASSED_TESTS  
**Failed:** $((TOTAL_TESTS - PASSED_TESTS))  
**Success Rate:** $(echo "scale=1; $PASSED_TESTS * 100 / $TOTAL_TESTS" | bc)%

## Test Results

EOF

for result in "${TEST_RESULTS[@]}"; do
  if [[ $result == *"PASSED"* ]]; then
    echo "- ✅ $result" >> "$REPORT_FILE"
  else
    echo "- ❌ $result" >> "$REPORT_FILE"
  fi
done

cat >> "$REPORT_FILE" << EOF

## Log Files

All detailed logs are available in: \`$LOG_DIR/\`

## Next Steps

EOF

if [ $PASSED_TESTS -eq $TOTAL_TESTS ]; then
  cat >> "$REPORT_FILE" << EOF
✅ **All tests passed!** Ready for Phase 9.

### Phase 9 Readiness Checklist
- [ ] Review all test logs
- [ ] Validate performance benchmarks
- [ ] Confirm DSGVO compliance
- [ ] Deploy to staging environment
- [ ] Run smoke tests in production
EOF
else
  cat >> "$REPORT_FILE" << EOF
⚠️ **Some tests failed.** Review failed tests before proceeding.

### Required Actions
- [ ] Review failed test logs
- [ ] Fix identified issues
- [ ] Re-run failed tests
- [ ] Update documentation if needed
EOF
fi

# Display final summary
echo -e "\n${MAGENTA}📊 Phase 8 Test Summary${NC}"
echo "======================================"
echo "Total Tests: $TOTAL_TESTS"
echo "Passed: $PASSED_TESTS"
echo "Failed: $((TOTAL_TESTS - PASSED_TESTS))"
echo "Success Rate: $(echo "scale=1; $PASSED_TESTS * 100 / $TOTAL_TESTS" | bc)%"
echo ""
echo "Summary report: $REPORT_FILE"
echo "Log directory: $LOG_DIR"
echo ""

if [ $PASSED_TESTS -eq $TOTAL_TESTS ]; then
  echo -e "${GREEN}🎉 All Phase 8 tests passed! Ready for Phase 9.${NC}"
  exit 0
else
  echo -e "${RED}⚠️  Some tests failed. Review logs and fix issues.${NC}"
  exit 1
fi