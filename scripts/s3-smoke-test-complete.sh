#!/bin/bash

# Complete S3 Smoke Tests
# Tests presign, upload, CloudFront headers, CORS

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
REGION="eu-central-1"
TEST_LOG="/tmp/s3-smoke-test-$(date +%Y%m%d-%H%M%S).log"

log() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')] $1${NC}" | tee -a "$TEST_LOG"
}

success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a "$TEST_LOG"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}" | tee -a "$TEST_LOG"
}

error() {
    echo -e "${RED}❌ $1${NC}" | tee -a "$TEST_LOG"
}

# Header
echo -e "${BLUE}🧪 S3 Complete Smoke Tests - $(date)${NC}"
echo "Test log: $TEST_LOG"
echo ""

# 1. Get Function URL
log "1. Getting presigned URL Lambda function URL..."
FUNCTION_URL=$(aws lambda list-function-url-configs --function-name matbakh-get-presigned-url --region $REGION --query 'FunctionUrlConfigs[0].FunctionUrl' --output text 2>/dev/null || echo "")

if [ -n "$FUNCTION_URL" ] && [ "$FUNCTION_URL" != "None" ]; then
    success "Function URL found: $FUNCTION_URL"
else
    error "Function URL not found - checking if function exists..."
    if aws lambda get-function --function-name matbakh-get-presigned-url --region $REGION >/dev/null 2>&1; then
        warning "Function exists but no URL configured"
    else
        error "Function does not exist"
        exit 1
    fi
fi

# 2. Test presigned URL generation
log "2. Testing presigned URL generation..."
if [ -n "$FUNCTION_URL" ]; then
    PRESIGN_RESPONSE=$(curl -sS -X POST "$FUNCTION_URL" \
        -H 'Content-Type: application/json' \
        -H 'Origin: https://matbakh.app' \
        -d '{
            "bucket": "matbakh-files-uploads",
            "key": "smoke-test/test-$(date +%s).txt",
            "contentType": "text/plain",
            "multipart": false
        }' 2>/dev/null || echo "")
    
    if echo "$PRESIGN_RESPONSE" | jq -e '.uploadUrl' >/dev/null 2>&1; then
        success "Presigned URL generated successfully"
        UPLOAD_URL=$(echo "$PRESIGN_RESPONSE" | jq -r '.uploadUrl')
        FILE_URL=$(echo "$PRESIGN_RESPONSE" | jq -r '.fileUrl')
    else
        error "Failed to generate presigned URL"
        echo "Response: $PRESIGN_RESPONSE"
    fi
else
    warning "Skipping presigned URL test - no function URL"
fi

# 3. Test file upload
log "3. Testing file upload..."
if [ -n "$UPLOAD_URL" ]; then
    UPLOAD_RESPONSE=$(curl -sS -X PUT "$UPLOAD_URL" \
        -H 'Content-Type: text/plain' \
        --data-binary "S3 smoke test - $(date)" \
        -w "%{http_code}" \
        -o /dev/null 2>/dev/null || echo "000")
    
    if [ "$UPLOAD_RESPONSE" = "200" ]; then
        success "File upload successful (HTTP $UPLOAD_RESPONSE)"
    else
        error "File upload failed (HTTP $UPLOAD_RESPONSE)"
    fi
else
    warning "Skipping upload test - no upload URL"
fi

# 4. Test S3 CORS preflight
log "4. Testing S3 CORS preflight..."
CORS_RESPONSE=$(curl -i -sS -X OPTIONS \
    "https://matbakh-files-uploads.s3.eu-central-1.amazonaws.com/smoke-test/test.txt" \
    -H "Origin: https://matbakh.app" \
    -H "Access-Control-Request-Method: PUT" \
    -H "Access-Control-Request-Headers: content-type" \
    2>/dev/null || echo "")

if echo "$CORS_RESPONSE" | grep -q "Access-Control-Allow-Origin"; then
    success "S3 CORS preflight successful"
else
    error "S3 CORS preflight failed"
    echo "Response headers:"
    echo "$CORS_RESPONSE" | head -10
fi

# 5. Test CloudFront distribution
log "5. Testing CloudFront distribution..."
CLOUDFRONT_DOMAIN=$(aws cloudfront list-distributions --region us-east-1 \
    --query 'DistributionList.Items[?Comment==`CloudFront distribution for matbakh reports bucket`].DomainName' \
    --output text 2>/dev/null || echo "")

if [ -n "$CLOUDFRONT_DOMAIN" ] && [ "$CLOUDFRONT_DOMAIN" != "None" ]; then
    success "CloudFront domain found: $CLOUDFRONT_DOMAIN"
    
    # Test CloudFront headers
    CF_HEADERS=$(curl -I -sS "https://$CLOUDFRONT_DOMAIN/health.txt" 2>/dev/null || echo "")
    
    if echo "$CF_HEADERS" | grep -q "Strict-Transport-Security"; then
        success "CloudFront security headers present"
    else
        warning "CloudFront security headers missing"
    fi
    
    if echo "$CF_HEADERS" | grep -q "Access-Control-Allow-Origin"; then
        success "CloudFront CORS headers present"
    else
        warning "CloudFront CORS headers missing"
    fi
else
    warning "CloudFront distribution not found"
fi

# 6. Test SNS subscription status
log "6. Checking SNS alert subscription..."
SNS_TOPIC_ARN=$(aws sns list-topics --region $REGION \
    --query 'Topics[?contains(TopicArn,`matbakh-s3-alerts`)].TopicArn' \
    --output text 2>/dev/null || echo "")

if [ -n "$SNS_TOPIC_ARN" ] && [ "$SNS_TOPIC_ARN" != "None" ]; then
    success "SNS topic found: $SNS_TOPIC_ARN"
    
    SUBSCRIPTIONS=$(aws sns list-subscriptions-by-topic \
        --topic-arn "$SNS_TOPIC_ARN" \
        --region $REGION \
        --query 'Subscriptions[].{Endpoint:Endpoint,Status:SubscriptionArn}' \
        --output text 2>/dev/null || echo "")
    
    if [ -n "$SUBSCRIPTIONS" ]; then
        success "SNS subscriptions found"
        echo "$SUBSCRIPTIONS"
    else
        warning "No SNS subscriptions found"
    fi
else
    warning "SNS alert topic not found"
fi

# 7. Test Lambda function health
log "7. Testing Lambda function health..."
LAMBDA_FUNCTIONS=("matbakh-get-presigned-url" "matbakh-s3-upload-processor")

for func in "${LAMBDA_FUNCTIONS[@]}"; do
    if aws lambda get-function --function-name $func --region $REGION >/dev/null 2>&1; then
        success "Lambda function $func exists"
        
        # Check recent errors
        ERROR_COUNT=$(aws logs filter-log-events \
            --log-group-name "/aws/lambda/$func" \
            --start-time $(date -d '1 hour ago' +%s)000 \
            --filter-pattern 'ERROR' \
            --region $REGION \
            --query 'events | length(@)' \
            --output text 2>/dev/null || echo "0")
        
        if [ "$ERROR_COUNT" -eq 0 ]; then
            success "No recent errors for $func"
        else
            warning "$ERROR_COUNT recent errors for $func"
        fi
    else
        error "Lambda function $func not found"
    fi
done

# 8. Cleanup test file (if uploaded)
log "8. Cleaning up test files..."
if [ -n "$FILE_URL" ]; then
    TEST_KEY=$(echo "$FILE_URL" | sed 's|.*amazonaws.com/||')
    if aws s3 rm "s3://matbakh-files-uploads/$TEST_KEY" --region $REGION >/dev/null 2>&1; then
        success "Test file cleaned up"
    else
        warning "Failed to clean up test file"
    fi
fi

# Summary
echo ""
echo -e "${BLUE}📊 Smoke Test Summary${NC}"
echo "===================="
echo "Test log: $TEST_LOG"

# Count results
TOTAL_TESTS=8
SUCCESS_COUNT=$(grep -c "✅" "$TEST_LOG" || echo "0")
WARNING_COUNT=$(grep -c "⚠️" "$TEST_LOG" || echo "0") 
ERROR_COUNT=$(grep -c "❌" "$TEST_LOG" || echo "0")

echo "Successful: $SUCCESS_COUNT"
echo "Warnings: $WARNING_COUNT"
echo "Errors: $ERROR_COUNT"

if [ "$ERROR_COUNT" -eq 0 ]; then
    echo -e "${GREEN}🎉 All critical tests passed!${NC}"
    exit 0
elif [ "$ERROR_COUNT" -le 2 ]; then
    echo -e "${YELLOW}⚠️  Some issues found, but system is mostly functional${NC}"
    exit 1
else
    echo -e "${RED}❌ Multiple critical issues found${NC}"
    exit 2
fi