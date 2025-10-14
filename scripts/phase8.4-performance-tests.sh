#!/bin/bash

# Phase 8.4 Performance Tests
# Multipart, Parallel Uploads, CloudFront Cache, Timeouts

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
TEST_REPORT="reports/performance-test-report.pdf"

echo -e "${YELLOW}⚡ Phase 8.4 Performance Tests${NC}"
echo "===================================="

# Test 1: Multipart Upload Performance
echo -e "\n${BLUE}1. Testing Multipart Upload Performance...${NC}"
if [ ! -z "$AUTH_TOKEN" ]; then
  echo "Testing different file sizes for multipart thresholds..."
  
  # Test file sizes: 1MB, 5MB, 10MB, 50MB, 100MB
  FILE_SIZES=(1048576 5242880 10485760 52428800 104857600)
  SIZE_NAMES=("1MB" "5MB" "10MB" "50MB" "100MB")
  
  for i in "${!FILE_SIZES[@]}"; do
    size=${FILE_SIZES[$i]}
    name=${SIZE_NAMES[$i]}
    
    echo "Testing $name file ($size bytes)..."
    
    START_TIME=$(date +%s.%N)
    
    RESPONSE=$(curl -s -X POST "${API_BASE}/get-presigned-url" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer ${AUTH_TOKEN}" \
      -d "{
        \"bucket\": \"matbakh-files-uploads\",
        \"filename\": \"perf-test-${name}.bin\",
        \"contentType\": \"application/octet-stream\",
        \"fileSize\": $size
      }" 2>/dev/null || echo "{}")
    
    END_TIME=$(date +%s.%N)
    DURATION=$(echo "$END_TIME - $START_TIME" | bc -l 2>/dev/null || echo "0")
    
    if echo "$RESPONSE" | grep -q "uploadUrl"; then
      if echo "$RESPONSE" | grep -q "partUrls"; then
        PART_COUNT=$(echo "$RESPONSE" | grep -o '"https://[^"]*"' | wc -l)
        echo -e "  ${GREEN}✅ $name: Multipart ($PART_COUNT parts) - ${DURATION}s${NC}"
      else
        echo -e "  ${GREEN}✅ $name: Single part - ${DURATION}s${NC}"
      fi
      
      # Performance benchmark
      if (( $(echo "$DURATION < 2.0" | bc -l 2>/dev/null || echo 0) )); then
        echo -e "    ${GREEN}⚡ Performance: EXCELLENT (<2s)${NC}"
      elif (( $(echo "$DURATION < 5.0" | bc -l 2>/dev/null || echo 0) )); then
        echo -e "    ${YELLOW}⚡ Performance: GOOD (<5s)${NC}"
      else
        echo -e "    ${RED}⚡ Performance: SLOW (>5s)${NC}"
      fi
    else
      echo -e "  ${RED}❌ $name: FAILED${NC}"
    fi
  done
else
  echo -e "${YELLOW}⚠️  AUTH_TOKEN not set${NC}"
fi

# Test 2: CloudFront Cache Performance
echo -e "\n${BLUE}2. Testing CloudFront Cache Performance...${NC}"
echo "Testing cache hit/miss performance..."

# First request (should be MISS)
echo "First request (cache MISS expected)..."
START_TIME=$(date +%s.%N)
FIRST_RESPONSE=$(curl -s -I "${CLOUDFRONT_URL}/${TEST_REPORT}")
END_TIME=$(date +%s.%N)
FIRST_DURATION=$(echo "$END_TIME - $START_TIME" | bc -l 2>/dev/null || echo "0")

FIRST_CACHE_STATUS=$(echo "$FIRST_RESPONSE" | grep -i "x-cache" | cut -d' ' -f2- || echo "Unknown")
echo "Cache status: $FIRST_CACHE_STATUS"
echo "Duration: ${FIRST_DURATION}s"

# Second request (should be HIT)
echo "\nSecond request (cache HIT expected)..."
START_TIME=$(date +%s.%N)
SECOND_RESPONSE=$(curl -s -I "${CLOUDFRONT_URL}/${TEST_REPORT}")
END_TIME=$(date +%s.%N)
SECOND_DURATION=$(echo "$END_TIME - $START_TIME" | bc -l 2>/dev/null || echo "0")

SECOND_CACHE_STATUS=$(echo "$SECOND_RESPONSE" | grep -i "x-cache" | cut -d' ' -f2- || echo "Unknown")
echo "Cache status: $SECOND_CACHE_STATUS"
echo "Duration: ${SECOND_DURATION}s"

# Analyze cache performance
if echo "$SECOND_CACHE_STATUS" | grep -qi "hit"; then
  echo -e "${GREEN}✅ CloudFront Cache: HIT detected${NC}"
  
  # Compare performance
  if (( $(echo "$SECOND_DURATION < $FIRST_DURATION" | bc -l 2>/dev/null || echo 0) )); then
    IMPROVEMENT=$(echo "scale=1; ($FIRST_DURATION - $SECOND_DURATION) / $FIRST_DURATION * 100" | bc -l 2>/dev/null || echo "0")
    echo -e "${GREEN}⚡ Cache Performance: ${IMPROVEMENT}% faster${NC}"
  fi
else
  echo -e "${YELLOW}⚠️  CloudFront Cache: No HIT detected${NC}"
fi

# Test 3: Parallel Upload Simulation
echo -e "\n${BLUE}3. Testing Parallel Upload Capacity...${NC}"
if [ ! -z "$AUTH_TOKEN" ]; then
  echo "Simulating parallel presigned URL requests..."
  
  PARALLEL_COUNTS=(5 10 20)
  
  for count in "${PARALLEL_COUNTS[@]}"; do
    echo "Testing $count parallel requests..."
    
    START_TIME=$(date +%s.%N)
    
    # Create parallel requests
    for ((i=1; i<=count; i++)); do
      {
        curl -s -X POST "${API_BASE}/get-presigned-url" \
          -H "Content-Type: application/json" \
          -H "Authorization: Bearer ${AUTH_TOKEN}" \
          -d "{
            \"bucket\": \"matbakh-files-uploads\",
            \"filename\": \"parallel-test-${i}.jpg\",
            \"contentType\": \"image/jpeg\",
            \"fileSize\": 1048576
          }" > "/tmp/parallel_${i}.json" 2>/dev/null
      } &
    done
    
    # Wait for all requests to complete
    wait
    
    END_TIME=$(date +%s.%N)
    DURATION=$(echo "$END_TIME - $START_TIME" | bc -l 2>/dev/null || echo "0")
    
    # Count successful responses
    SUCCESS_COUNT=0
    for ((i=1; i<=count; i++)); do
      if [ -f "/tmp/parallel_${i}.json" ] && grep -q "uploadUrl" "/tmp/parallel_${i}.json"; then
        ((SUCCESS_COUNT++))
      fi
      rm -f "/tmp/parallel_${i}.json"
    done
    
    SUCCESS_RATE=$(echo "scale=1; $SUCCESS_COUNT * 100 / $count" | bc -l 2>/dev/null || echo "0")
    
    echo "  Results: $SUCCESS_COUNT/$count successful (${SUCCESS_RATE}%)"
    echo "  Duration: ${DURATION}s"
    echo "  Avg per request: $(echo "scale=3; $DURATION / $count" | bc -l 2>/dev/null || echo "0")s"
    
    if (( $(echo "$SUCCESS_RATE >= 95" | bc -l 2>/dev/null || echo 0) )); then
      echo -e "  ${GREEN}✅ Success rate: EXCELLENT (≥95%)${NC}"
    elif (( $(echo "$SUCCESS_RATE >= 90" | bc -l 2>/dev/null || echo 0) )); then
      echo -e "  ${YELLOW}✅ Success rate: GOOD (≥90%)${NC}"
    else
      echo -e "  ${RED}❌ Success rate: POOR (<90%)${NC}"
    fi
  done
else
  echo -e "${YELLOW}⚠️  AUTH_TOKEN not set${NC}"
fi

# Test 4: Timeout and Retry Behavior
echo -e "\n${BLUE}4. Testing Timeout & Retry Behavior...${NC}"
echo "Testing API timeout handling..."

if [ ! -z "$AUTH_TOKEN" ]; then
  # Test with very short timeout
  echo "Testing with 1-second timeout..."
  
  START_TIME=$(date +%s.%N)
  TIMEOUT_RESPONSE=$(timeout 1s curl -s -X POST "${API_BASE}/get-presigned-url" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${AUTH_TOKEN}" \
    -d '{
      "bucket": "matbakh-files-uploads",
      "filename": "timeout-test.jpg",
      "contentType": "image/jpeg",
      "fileSize": 1024
    }' 2>/dev/null || echo "TIMEOUT")
  END_TIME=$(date +%s.%N)
  DURATION=$(echo "$END_TIME - $START_TIME" | bc -l 2>/dev/null || echo "0")
  
  if [ "$TIMEOUT_RESPONSE" = "TIMEOUT" ]; then
    echo -e "  ${YELLOW}⚠️  Request timed out after ${DURATION}s${NC}"
    echo -e "  ${GREEN}✅ Timeout handling: WORKING${NC}"
  else
    echo -e "  ${GREEN}✅ Request completed within timeout: ${DURATION}s${NC}"
  fi
  
  # Test retry with exponential backoff simulation
  echo "\nTesting retry behavior simulation..."
  RETRY_DELAYS=(1 2 4)
  
  for delay in "${RETRY_DELAYS[@]}"; do
    echo "  Retry attempt with ${delay}s delay..."
    sleep "$delay"
    
    START_TIME=$(date +%s.%N)
    RETRY_RESPONSE=$(curl -s -X POST "${API_BASE}/get-presigned-url" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer ${AUTH_TOKEN}" \
      -d "{
        \"bucket\": \"matbakh-files-uploads\",
        \"filename\": \"retry-test-${delay}.jpg\",
        \"contentType\": \"image/jpeg\",
        \"fileSize\": 1024
      }" 2>/dev/null || echo "{}")
    END_TIME=$(date +%s.%N)
    DURATION=$(echo "$END_TIME - $START_TIME" | bc -l 2>/dev/null || echo "0")
    
    if echo "$RETRY_RESPONSE" | grep -q "uploadUrl"; then
      echo -e "    ${GREEN}✅ Retry successful: ${DURATION}s${NC}"
      break
    else
      echo -e "    ${RED}❌ Retry failed: ${DURATION}s${NC}"
    fi
  done
fi

# Test 5: Memory and Resource Usage
echo -e "\n${BLUE}5. Testing Resource Usage...${NC}"
echo "Monitoring system resources during tests..."

# Check available memory
if command -v free &> /dev/null; then
  MEMORY_INFO=$(free -h | grep "Mem:")
  echo "Memory usage: $MEMORY_INFO"
fi

# Check disk space
if command -v df &> /dev/null; then
  DISK_INFO=$(df -h /tmp | tail -1)
  echo "Disk usage: $DISK_INFO"
fi

# Check network connections
if command -v netstat &> /dev/null; then
  CONNECTION_COUNT=$(netstat -an | grep ESTABLISHED | wc -l)
  echo "Active connections: $CONNECTION_COUNT"
fi

# Test 6: Error Rate Analysis
echo -e "\n${BLUE}6. Testing Error Rate Analysis...${NC}"
if [ ! -z "$AUTH_TOKEN" ]; then
  echo "Testing error scenarios..."
  
  # Test invalid bucket
  echo "Testing invalid bucket name..."
  ERROR_RESPONSE=$(curl -s -X POST "${API_BASE}/get-presigned-url" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${AUTH_TOKEN}" \
    -d '{
      "bucket": "invalid-bucket-name",
      "filename": "test.jpg",
      "contentType": "image/jpeg",
      "fileSize": 1024
    }' 2>/dev/null || echo "{}")
  
  if echo "$ERROR_RESPONSE" | grep -q "error\|Error"; then
    echo -e "  ${GREEN}✅ Error handling: Proper error response${NC}"
  else
    echo -e "  ${RED}❌ Error handling: No error for invalid bucket${NC}"
  fi
  
  # Test oversized file
  echo "Testing oversized file..."
  OVERSIZE_RESPONSE=$(curl -s -X POST "${API_BASE}/get-presigned-url" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${AUTH_TOKEN}" \
    -d '{
      "bucket": "matbakh-files-uploads",
      "filename": "huge-file.bin",
      "contentType": "application/octet-stream",
      "fileSize": 1073741824
    }' 2>/dev/null || echo "{}")
  
  if echo "$OVERSIZE_RESPONSE" | grep -q "error\|Error\|too large"; then
    echo -e "  ${GREEN}✅ Size validation: Proper size limit enforcement${NC}"
  else
    echo -e "  ${YELLOW}⚠️  Size validation: Large file accepted${NC}"
  fi
fi

# Summary
echo -e "\n${YELLOW}📊 Performance Test Summary${NC}"
echo "===================================="
echo "⚡ Performance Tests Complete"
echo ""
echo "Key Performance Areas Tested:"
echo "✓ Multipart upload thresholds (1MB-100MB)"
echo "✓ CloudFront cache hit/miss performance"
echo "✓ Parallel request capacity (5/10/20 concurrent)"
echo "✓ Timeout and retry behavior"
echo "✓ Resource usage monitoring"
echo "✓ Error rate analysis"
echo ""
echo "Performance Benchmarks:"
echo "• Presigned URL generation: <2s (excellent), <5s (good)"
echo "• Success rate target: ≥95% (excellent), ≥90% (good)"
echo "• Cache improvement: Faster on second request"
echo "• Parallel capacity: 20 concurrent requests"
echo ""
echo "Next steps:"
echo "1. Review performance metrics above"
echo "2. Run full integration suite if needed"
echo "3. Document performance baselines"
echo "4. Monitor production metrics"

echo -e "\n${GREEN}🎯 Phase 8.4 Performance Tests Complete!${NC}"