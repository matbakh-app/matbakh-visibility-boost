#!/bin/bash

# Phase 8.2 Integration Tests
# CloudFront / CORS / Preflight / Upload Flow

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
CLOUDFRONT_URL="https://dtkzvn1fvvkgu.cloudfront.net"
ORIGIN="https://matbakh.app"
API_BASE="https://api.matbakh.app"
TEST_KEY="reports/test-report.pdf"

echo -e "${YELLOW}🧪 Phase 8.2 Integration Tests${NC}"
echo "======================================"

# Test 1: CloudFront CORS Preflight
echo -e "\n${YELLOW}1. Testing CloudFront CORS Preflight...${NC}"
echo "curl -i -X OPTIONS \"${CLOUDFRONT_URL}/${TEST_KEY}\" -H \"Origin:${ORIGIN}\" -H \"Access-Control-Request-Method:GET\""

PREFLIGHT_RESPONSE=$(curl -s -i -X OPTIONS "${CLOUDFRONT_URL}/${TEST_KEY}" \
  -H "Origin:${ORIGIN}" \
  -H "Access-Control-Request-Method:GET")

if echo "$PREFLIGHT_RESPONSE" | grep -q "access-control-allow-origin"; then
  echo -e "${GREEN}✅ CORS Preflight: PASS${NC}"
else
  echo -e "${RED}❌ CORS Preflight: FAIL${NC}"
  echo "Response: $PREFLIGHT_RESPONSE"
fi

# Test 2: CloudFront HEAD Request
echo -e "\n${YELLOW}2. Testing CloudFront HEAD Request...${NC}"
echo "curl -I \"${CLOUDFRONT_URL}/${TEST_KEY}\""

HEAD_RESPONSE=$(curl -s -I "${CLOUDFRONT_URL}/${TEST_KEY}")

if echo "$HEAD_RESPONSE" | grep -q "200 OK"; then
  echo -e "${GREEN}✅ CloudFront HEAD: PASS${NC}"
  
  # Check for required headers
  if echo "$HEAD_RESPONSE" | grep -q "cache-control"; then
    echo -e "${GREEN}✅ Cache-Control header: PRESENT${NC}"
  else
    echo -e "${RED}❌ Cache-Control header: MISSING${NC}"
  fi
  
  if echo "$HEAD_RESPONSE" | grep -q "etag"; then
    echo -e "${GREEN}✅ ETag header: PRESENT${NC}"
  else
    echo -e "${RED}❌ ETag header: MISSING${NC}"
  fi
  
  # Check for PII in headers (should not exist)
  if echo "$HEAD_RESPONSE" | grep -q "x-amz-meta-.*email\|x-amz-meta-.*user"; then
    echo -e "${RED}❌ PII in headers: FOUND (SECURITY ISSUE)${NC}"
  else
    echo -e "${GREEN}✅ No PII in headers: PASS${NC}"
  fi
else
  echo -e "${RED}❌ CloudFront HEAD: FAIL${NC}"
  echo "Response: $HEAD_RESPONSE"
fi

# Test 3: Direct S3 Access (should be blocked)
echo -e "\n${YELLOW}3. Testing Direct S3 Access (should be 403)...${NC}"
S3_BUCKET="matbakh-files-reports"
S3_URL="https://${S3_BUCKET}.s3.amazonaws.com/${TEST_KEY}"
echo "curl -I \"${S3_URL}\""

S3_RESPONSE=$(curl -s -I "$S3_URL")

if echo "$S3_RESPONSE" | grep -q "403 Forbidden"; then
  echo -e "${GREEN}✅ Direct S3 Access Blocked: PASS${NC}"
else
  echo -e "${RED}❌ Direct S3 Access Blocked: FAIL (SECURITY ISSUE)${NC}"
  echo "Response: $S3_RESPONSE"
fi

# Test 4: Database Query for Recent Uploads
echo -e "\n${YELLOW}4. Testing Database Upload Records...${NC}"
if command -v psql &> /dev/null && [ ! -z "$DATABASE_URL" ]; then
  echo "Checking recent uploads in user_uploads table..."
  
  RECENT_UPLOADS=$(psql "$DATABASE_URL" -t -c "
    SELECT COUNT(*) 
    FROM user_uploads 
    WHERE uploaded_at > NOW() - INTERVAL '1 hour'
  " 2>/dev/null || echo "0")
  
  echo "Recent uploads (last hour): $RECENT_UPLOADS"
  
  if [ "$RECENT_UPLOADS" -gt 0 ]; then
    echo -e "${GREEN}✅ Database Upload Records: FOUND${NC}"
    
    # Check for required fields
    psql "$DATABASE_URL" -c "
      SELECT 
        id, 
        user_id, 
        s3_bucket, 
        s3_key, 
        content_type, 
        file_size, 
        checksum,
        uploaded_at
      FROM user_uploads 
      ORDER BY uploaded_at DESC 
      LIMIT 3
    " 2>/dev/null || echo "Query failed"
  else
    echo -e "${YELLOW}⚠️  No recent uploads found${NC}"
  fi
else
  echo -e "${YELLOW}⚠️  Database connection not available${NC}"
fi

# Test 5: Presigned URL Expiry Check
echo -e "\n${YELLOW}5. Testing Presigned URL Expiry...${NC}"
if [ ! -z "$AUTH_TOKEN" ]; then
  echo "Generating presigned URL..."
  
  PRESIGN_RESPONSE=$(curl -s -X POST "${API_BASE}/get-presigned-url" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${AUTH_TOKEN}" \
    -d '{
      "bucket": "matbakh-files-profile",
      "filename": "test-file.jpg",
      "contentType": "image/jpeg",
      "fileSize": 1024
    }' 2>/dev/null || echo "{}")
  
  if echo "$PRESIGN_RESPONSE" | grep -q "uploadUrl"; then
    echo -e "${GREEN}✅ Presigned URL Generation: PASS${NC}"
    
    # Extract expiry time and check if <= 15 minutes
    EXPIRES_AT=$(echo "$PRESIGN_RESPONSE" | grep -o '"expiresAt":"[^"]*"' | cut -d'"' -f4)
    if [ ! -z "$EXPIRES_AT" ]; then
      echo "Expires at: $EXPIRES_AT"
      
      # Check expiry time (simplified check)
      CURRENT_TIME=$(date -u +%s)
      EXPIRY_TIME=$(date -d "$EXPIRES_AT" +%s 2>/dev/null || echo "0")
      DIFF=$((EXPIRY_TIME - CURRENT_TIME))
      
      if [ "$DIFF" -le 900 ] && [ "$DIFF" -gt 0 ]; then
        echo -e "${GREEN}✅ Expiry Time (≤15min): PASS (${DIFF}s)${NC}"
      else
        echo -e "${RED}❌ Expiry Time (≤15min): FAIL (${DIFF}s)${NC}"
      fi
    fi
  else
    echo -e "${RED}❌ Presigned URL Generation: FAIL${NC}"
    echo "Response: $PRESIGN_RESPONSE"
  fi
else
  echo -e "${YELLOW}⚠️  AUTH_TOKEN not set, skipping presigned URL test${NC}"
fi

# Test 6: Multipart Upload Check
echo -e "\n${YELLOW}6. Testing Multipart Upload Configuration...${NC}"
if [ ! -z "$AUTH_TOKEN" ]; then
  echo "Testing large file presigned URL (should trigger multipart)..."
  
  LARGE_FILE_RESPONSE=$(curl -s -X POST "${API_BASE}/get-presigned-url" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${AUTH_TOKEN}" \
    -d '{
      "bucket": "matbakh-files-uploads",
      "filename": "large-file.pdf",
      "contentType": "application/pdf",
      "fileSize": 10485760
    }' 2>/dev/null || echo "{}")
  
  if echo "$LARGE_FILE_RESPONSE" | grep -q "partUrls"; then
    echo -e "${GREEN}✅ Multipart Upload: ENABLED${NC}"
    
    PART_COUNT=$(echo "$LARGE_FILE_RESPONSE" | grep -o '"partUrls":\[[^]]*\]' | grep -o '"https://[^"]*"' | wc -l)
    echo "Part URLs generated: $PART_COUNT"
  else
    echo -e "${YELLOW}⚠️  Multipart Upload: Single part (file may be too small)${NC}"
  fi
else
  echo -e "${YELLOW}⚠️  AUTH_TOKEN not set, skipping multipart test${NC}"
fi

# Summary
echo -e "\n${YELLOW}📊 Integration Test Summary${NC}"
echo "======================================"
echo "✅ Tests completed"
echo "📋 Check individual test results above"
echo "🔧 Set AUTH_TOKEN and DATABASE_URL for full testing"
echo ""
echo "Next steps:"
echo "1. Run DSGVO tests: ./scripts/phase8.3-dsgvo-tests.sh"
echo "2. Run performance tests: ./scripts/phase8.4-performance-tests.sh"
echo "3. Check CloudWatch logs for PII leaks"

echo -e "\n${GREEN}🎯 Phase 8.2 Integration Tests Complete!${NC}"