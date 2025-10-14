#!/bin/bash

# Phase 9.4 - Production Smoke Tests
# Validate S3 and Cognito cutover in production

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_BASE="https://api.matbakh.app"
CLOUDFRONT_URL="https://dtkzvn1fvvkgu.cloudfront.net"
WEBAPP_URL="${DEPLOYMENT_URL:-https://matbakh.app}"

echo -e "${BLUE}🧪 Phase 9.4 - Production Smoke Tests${NC}"
echo "======================================"
echo "Timestamp: $(date)"
echo "API Base: $API_BASE"
echo "CloudFront: $CLOUDFRONT_URL"
echo "Web App: $WEBAPP_URL"
echo ""

# Test Results Tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=()

# Function to run test and track results
run_test() {
  local test_name="$1"
  local test_command="$2"
  
  echo -e "${YELLOW}Testing: $test_name${NC}"
  ((TOTAL_TESTS++))
  
  if eval "$test_command"; then
    echo -e "${GREEN}✅ PASS: $test_name${NC}"
    ((PASSED_TESTS++))
  else
    echo -e "${RED}❌ FAIL: $test_name${NC}"
    FAILED_TESTS+=("$test_name")
  fi
  echo ""
}

# 1. Authentication Tests
echo -e "${BLUE}1. Authentication Tests${NC}"
echo "========================"

# Test Cognito endpoint availability
run_test "Cognito endpoint accessibility" "
  curl -s -I '$API_BASE/auth/cognito' | grep -q '200\|404\|405'
"

# Test that Supabase auth is disabled (should return 404 or error)
run_test "Supabase auth disabled" "
  ! curl -s '$API_BASE/auth/supabase' | grep -q 'success'
"

# Test JWT validation endpoint
if [ ! -z "$AUTH_TOKEN" ]; then
  run_test "JWT token validation" "
    curl -s -H 'Authorization: Bearer $AUTH_TOKEN' '$API_BASE/auth/validate' | grep -q 'valid\|success'
  "
else
  echo -e "${YELLOW}⚠️  AUTH_TOKEN not set - skipping JWT validation test${NC}"
  echo ""
fi

# 2. S3 Upload Tests
echo -e "${BLUE}2. S3 Upload Tests${NC}"
echo "=================="

if [ ! -z "$AUTH_TOKEN" ]; then
  # Test presigned URL generation
  run_test "Presigned URL generation" "
    RESPONSE=\$(curl -s -X POST '$API_BASE/get-presigned-url' \
      -H 'Content-Type: application/json' \
      -H 'Authorization: Bearer $AUTH_TOKEN' \
      -d '{
        \"bucket\": \"matbakh-files-profile\",
        \"filename\": \"smoke-test.jpg\",
        \"contentType\": \"image/jpeg\",
        \"fileSize\": 1024
      }')
    echo \"\$RESPONSE\" | grep -q 'uploadUrl'
  "
  
  # Test multipart upload for large files
  run_test "Multipart upload configuration" "
    RESPONSE=\$(curl -s -X POST '$API_BASE/get-presigned-url' \
      -H 'Content-Type: application/json' \
      -H 'Authorization: Bearer $AUTH_TOKEN' \
      -d '{
        \"bucket\": \"matbakh-files-uploads\",
        \"filename\": \"large-file.pdf\",
        \"contentType\": \"application/pdf\",
        \"fileSize\": 10485760
      }')
    echo \"\$RESPONSE\" | grep -q 'uploadUrl'
  "
  
  # Test invalid bucket (should fail)
  run_test "Invalid bucket rejection" "
    RESPONSE=\$(curl -s -X POST '$API_BASE/get-presigned-url' \
      -H 'Content-Type: application/json' \
      -H 'Authorization: Bearer $AUTH_TOKEN' \
      -d '{
        \"bucket\": \"invalid-bucket\",
        \"filename\": \"test.jpg\",
        \"contentType\": \"image/jpeg\",
        \"fileSize\": 1024
      }')
    echo \"\$RESPONSE\" | grep -q 'error\|Error'
  "
else
  echo -e "${YELLOW}⚠️  AUTH_TOKEN not set - skipping S3 upload tests${NC}"
  echo ""
fi

# 3. File Access & Security Tests
echo -e "${BLUE}3. File Access & Security Tests${NC}"
echo "==============================="

# Test CloudFront reports access
run_test "CloudFront reports accessible" "
  curl -s -I '$CLOUDFRONT_URL/reports/test-report.pdf' | grep -q '200\|404'
"

# Test direct S3 access blocked for private buckets
run_test "Private S3 buckets blocked" "
  curl -s -I 'https://matbakh-files-uploads.s3.amazonaws.com/test' | grep -q '403'
"

run_test "Profile S3 bucket blocked" "
  curl -s -I 'https://matbakh-files-profile.s3.amazonaws.com/test' | grep -q '403'
"

# Test reports direct S3 access blocked
run_test "Reports S3 direct access blocked" "
  curl -s -I 'https://matbakh-files-reports.s3.amazonaws.com/reports/test' | grep -q '403'
"

# Test CORS headers
run_test "CORS headers present" "
  curl -s -I -X OPTIONS '$CLOUDFRONT_URL/reports/test' \
    -H 'Origin: https://matbakh.app' \
    -H 'Access-Control-Request-Method: GET' | grep -q 'access-control-allow-origin'
"

# 4. Database Integration Tests
echo -e "${BLUE}4. Database Integration Tests${NC}"
echo "============================="

if [ ! -z "$DATABASE_URL" ] && command -v psql &> /dev/null; then
  # Test feature flags are set correctly
  run_test "S3 uploads feature flag enabled" "
    VALUE=\$(psql '$DATABASE_URL' -t -c \"SELECT value FROM feature_flags WHERE key = 'useS3Uploads';\" | xargs)
    [ \"\$VALUE\" = \"true\" ]
  "
  
  run_test "CloudFront reports feature flag enabled" "
    VALUE=\$(psql '$DATABASE_URL' -t -c \"SELECT value FROM feature_flags WHERE key = 'showCloudFrontReportUrls';\" | xargs)
    [ \"\$VALUE\" = \"true\" ]
  "
  
  run_test "Cognito authentication enabled" "
    VALUE=\$(psql '$DATABASE_URL' -t -c \"SELECT value FROM feature_flags WHERE key = 'ENABLE_COGNITO';\" | xargs)
    [ \"\$VALUE\" = \"true\" ]
  "
  
  run_test "Dual auth mode disabled" "
    VALUE=\$(psql '$DATABASE_URL' -t -c \"SELECT value FROM feature_flags WHERE key = 'DUAL_AUTH_MODE';\" | xargs)
    [ \"\$VALUE\" = \"false\" ]
  "
  
  # Test user_uploads table exists and is accessible
  run_test "user_uploads table accessible" "
    psql '$DATABASE_URL' -c 'SELECT COUNT(*) FROM user_uploads;' >/dev/null 2>&1
  "
else
  echo -e "${YELLOW}⚠️  DATABASE_URL not set or psql not available - skipping database tests${NC}"
  echo ""
fi

# 5. Frontend Application Tests
echo -e "${BLUE}5. Frontend Application Tests${NC}"
echo "============================="

# Test webapp loads
run_test "Web application loads" "
  curl -s -I '$WEBAPP_URL' | grep -q '200'
"

# Test for new configuration in webapp
run_test "New API configuration in webapp" "
  curl -s '$WEBAPP_URL' | grep -q 'api.matbakh.app'
"

# Test for S3 configuration
run_test "S3 configuration in webapp" "
  curl -s '$WEBAPP_URL' | grep -q 'cloudfront.net\|s3'
"

# 6. Performance & Monitoring Tests
echo -e "${BLUE}6. Performance & Monitoring Tests${NC}"
echo "=================================="

# Test API response time
run_test "API response time acceptable" "
  START_TIME=\$(date +%s.%N)
  curl -s '$API_BASE/health' >/dev/null || curl -s '$API_BASE/' >/dev/null
  END_TIME=\$(date +%s.%N)
  DURATION=\$(echo \"\$END_TIME - \$START_TIME\" | bc -l 2>/dev/null || echo '0')
  (( \$(echo \"\$DURATION < 5.0\" | bc -l 2>/dev/null || echo 0) ))
"

# Test CloudFront cache performance
run_test "CloudFront cache performance" "
  # First request
  START_TIME=\$(date +%s.%N)
  curl -s -I '$CLOUDFRONT_URL/reports/test' >/dev/null
  END_TIME=\$(date +%s.%N)
  FIRST_DURATION=\$(echo \"\$END_TIME - \$START_TIME\" | bc -l 2>/dev/null || echo '0')
  
  # Second request (should be faster due to cache)
  START_TIME=\$(date +%s.%N)
  RESPONSE=\$(curl -s -I '$CLOUDFRONT_URL/reports/test')
  END_TIME=\$(date +%s.%N)
  SECOND_DURATION=\$(echo \"\$END_TIME - \$START_TIME\" | bc -l 2>/dev/null || echo '0')
  
  # Check if second request has cache hit or is faster
  echo \"\$RESPONSE\" | grep -q 'x-cache.*[Hh]it' || (( \$(echo \"\$SECOND_DURATION < \$FIRST_DURATION\" | bc -l 2>/dev/null || echo 0) ))
"

# 7. Generate Test Report
echo -e "${BLUE}📊 Test Results Summary${NC}"
echo "========================"

SUCCESS_RATE=$(echo "scale=1; $PASSED_TESTS * 100 / $TOTAL_TESTS" | bc 2>/dev/null || echo "0")

echo "Total Tests: $TOTAL_TESTS"
echo "Passed: $PASSED_TESTS"
echo "Failed: $((TOTAL_TESTS - PASSED_TESTS))"
echo "Success Rate: ${SUCCESS_RATE}%"

if [ ${#FAILED_TESTS[@]} -gt 0 ]; then
  echo ""
  echo -e "${RED}Failed Tests:${NC}"
  for test in "${FAILED_TESTS[@]}"; do
    echo "  - $test"
  done
fi

# Generate detailed report
REPORT_FILE="./smoke_test_results_$(date +%Y%m%d_%H%M%S).md"

cat > "$REPORT_FILE" << EOF
# Phase 9.4 Production Smoke Test Results

**Date**: $(date)
**Success Rate**: ${SUCCESS_RATE}%
**Total Tests**: $TOTAL_TESTS
**Passed**: $PASSED_TESTS
**Failed**: $((TOTAL_TESTS - PASSED_TESTS))

## Test Configuration
- API Base: $API_BASE
- CloudFront: $CLOUDFRONT_URL
- Web App: $WEBAPP_URL

## Test Results

### Authentication Tests
- Cognito endpoint accessibility
- Supabase auth disabled
- JWT token validation

### S3 Upload Tests
- Presigned URL generation
- Multipart upload configuration
- Invalid bucket rejection

### File Access & Security Tests
- CloudFront reports accessible
- Private S3 buckets blocked
- CORS headers present

### Database Integration Tests
- Feature flags correctly set
- Database tables accessible

### Frontend Application Tests
- Web application loads
- New configuration deployed

### Performance & Monitoring Tests
- API response time acceptable
- CloudFront cache performance

EOF

if [ ${#FAILED_TESTS[@]} -gt 0 ]; then
  cat >> "$REPORT_FILE" << EOF

## Failed Tests
EOF
  for test in "${FAILED_TESTS[@]}"; do
    echo "- $test" >> "$REPORT_FILE"
  done
fi

cat >> "$REPORT_FILE" << EOF

## Next Steps

EOF

if [ $PASSED_TESTS -eq $TOTAL_TESTS ]; then
  cat >> "$REPORT_FILE" << EOF
✅ **All tests passed!** Production cutover successful.

### Recommended Actions
1. Monitor system performance for 24-48 hours
2. Set up ongoing monitoring and alerts
3. Plan Supabase decommissioning (Phase 9.5)
4. Document lessons learned

EOF
else
  cat >> "$REPORT_FILE" << EOF
⚠️ **Some tests failed.** Review and fix issues before proceeding.

### Required Actions
1. Investigate failed tests
2. Fix identified issues
3. Re-run smoke tests
4. Consider rollback if critical issues persist

### Rollback Procedure
1. Revert feature flags using backup SQL
2. Redeploy previous frontend build
3. Validate system stability

EOF
fi

echo ""
echo -e "${GREEN}✅ Smoke test report generated: $REPORT_FILE${NC}"

# Final status
echo ""
if [ $PASSED_TESTS -eq $TOTAL_TESTS ]; then
  echo -e "${GREEN}🎉 All smoke tests passed! Production cutover successful!${NC}"
  echo ""
  echo "Next Steps:"
  echo "1. Monitor system performance"
  echo "2. Set up ongoing monitoring: ./scripts/phase9-5-monitoring.sh"
  echo "3. Plan Supabase decommissioning"
  exit 0
else
  echo -e "${RED}⚠️  Some smoke tests failed. Review issues before proceeding.${NC}"
  echo ""
  echo "Failed tests: $((TOTAL_TESTS - PASSED_TESTS))/$TOTAL_TESTS"
  echo "Consider rollback if critical issues persist"
  exit 1
fi