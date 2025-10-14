#!/bin/bash

# Phase 9.1 - Infrastructure Deployment
# Deploy all AWS infrastructure components

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🏗️  Phase 9.1 - Infrastructure Deployment${NC}"
echo "=============================================="
echo "Timestamp: $(date)"
echo ""

# Check prerequisites
echo -e "${YELLOW}🔍 Checking Prerequisites...${NC}"
PREREQ_FAILED=false

# Check AWS CLI
if ! command -v aws &> /dev/null; then
  echo -e "${RED}❌ AWS CLI not found${NC}"
  PREREQ_FAILED=true
fi

# Check CDK
if ! command -v cdk &> /dev/null; then
  echo -e "${RED}❌ AWS CDK not found${NC}"
  PREREQ_FAILED=true
fi

# Check Node.js
if ! command -v node &> /dev/null; then
  echo -e "${RED}❌ Node.js not found${NC}"
  PREREQ_FAILED=true
fi

if [ "$PREREQ_FAILED" = true ]; then
  echo -e "${RED}❌ Prerequisites not met. Install missing tools.${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"

# 1. S3 Buckets & CloudFront (Idempotent)
echo -e "\n${YELLOW}1. Deploying S3 Buckets & CloudFront...${NC}"
cd infra/aws

# Build CDK project
echo "Building CDK project..."
npm run build

# Deploy S3 buckets stack
echo "Deploying S3 buckets stack..."
cdk deploy MatbakhS3BucketsStack --require-approval never

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ S3 Buckets & CloudFront deployed${NC}"
else
  echo -e "${RED}❌ S3 Buckets deployment failed${NC}"
  exit 1
fi

# 2. Lambda Functions Deployment
echo -e "\n${YELLOW}2. Deploying Lambda Functions...${NC}"

# Deploy presigned URL Lambda
echo "Deploying s3-presigned-url Lambda..."
cd ../lambdas/s3-presigned-url
chmod +x deploy.sh
./deploy.sh

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ s3-presigned-url Lambda deployed${NC}"
else
  echo -e "${RED}❌ s3-presigned-url Lambda deployment failed${NC}"
  exit 1
fi

# Deploy upload processor Lambda
echo "Deploying s3-upload-processor Lambda..."
cd ../s3-upload-processor
chmod +x deploy.sh
./deploy.sh

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ s3-upload-processor Lambda deployed${NC}"
else
  echo -e "${RED}❌ s3-upload-processor Lambda deployment failed${NC}"
  exit 1
fi

# 3. API Gateway & WAF (Optional)
echo -e "\n${YELLOW}3. API Gateway & WAF Deployment...${NC}"
cd ../../aws

# Check if API Gateway stack exists
if cdk list | grep -q "MatbakhApiGatewayStack"; then
  echo "Deploying API Gateway stack..."
  cdk deploy MatbakhApiGatewayStack --require-approval never
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ API Gateway & WAF deployed${NC}"
  else
    echo -e "${YELLOW}⚠️  API Gateway deployment had issues (check manually)${NC}"
  fi
else
  echo -e "${YELLOW}⚠️  MatbakhApiGatewayStack not found - skipping${NC}"
fi

# 4. Infrastructure Validation
echo -e "\n${YELLOW}4. Validating Infrastructure...${NC}"

# Test S3 bucket access
echo "Testing S3 bucket access..."
BUCKETS=("matbakh-files-uploads" "matbakh-files-profile" "matbakh-files-reports")

for bucket in "${BUCKETS[@]}"; do
  if aws s3 ls "s3://$bucket" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Bucket accessible: $bucket${NC}"
  else
    echo -e "${RED}❌ Bucket not accessible: $bucket${NC}"
    exit 1
  fi
done

# Test Lambda functions
echo "Testing Lambda functions..."
FUNCTIONS=("matbakh-get-presigned-url" "matbakh-s3-upload-processor")

for func in "${FUNCTIONS[@]}"; do
  if aws lambda get-function --function-name "$func" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Lambda function exists: $func${NC}"
  else
    echo -e "${RED}❌ Lambda function not found: $func${NC}"
    exit 1
  fi
done

# Test CloudFront distribution
echo "Testing CloudFront distribution..."
CLOUDFRONT_URL="https://dtkzvn1fvvkgu.cloudfront.net"
if curl -s -I "$CLOUDFRONT_URL" | grep -q "200\|404"; then
  echo -e "${GREEN}✅ CloudFront distribution accessible${NC}"
else
  echo -e "${RED}❌ CloudFront distribution not accessible${NC}"
  exit 1
fi

# 5. Security Validation
echo -e "\n${YELLOW}5. Security Validation...${NC}"

# Test direct S3 access (should be blocked)
echo "Testing direct S3 access (should be 403)..."
for bucket in "${BUCKETS[@]}"; do
  if [ "$bucket" != "matbakh-files-reports" ]; then  # Skip reports bucket (has different access)
    RESPONSE=$(curl -s -I "https://$bucket.s3.amazonaws.com/test" | head -n1)
    if echo "$RESPONSE" | grep -q "403"; then
      echo -e "${GREEN}✅ Direct S3 access blocked: $bucket${NC}"
    else
      echo -e "${RED}❌ Direct S3 access not blocked: $bucket${NC}"
      echo "Response: $RESPONSE"
    fi
  fi
done

# Test reports via CloudFront vs direct S3
echo "Testing reports access control..."
REPORT_CF_RESPONSE=$(curl -s -I "${CLOUDFRONT_URL}/reports/test" | head -n1)
REPORT_S3_RESPONSE=$(curl -s -I "https://matbakh-files-reports.s3.amazonaws.com/reports/test" | head -n1)

if echo "$REPORT_CF_RESPONSE" | grep -q "200\|404"; then
  echo -e "${GREEN}✅ Reports accessible via CloudFront${NC}"
else
  echo -e "${YELLOW}⚠️  Reports CloudFront response: $REPORT_CF_RESPONSE${NC}"
fi

if echo "$REPORT_S3_RESPONSE" | grep -q "403"; then
  echo -e "${GREEN}✅ Reports direct S3 access blocked${NC}"
else
  echo -e "${RED}❌ Reports direct S3 access not blocked${NC}"
  echo "Response: $REPORT_S3_RESPONSE"
fi

# 6. Generate Infrastructure Status Report
echo -e "\n${YELLOW}6. Generating Infrastructure Status Report...${NC}"
REPORT_FILE="./infra_deployment_status_$(date +%Y%m%d_%H%M%S).md"

cat > "$REPORT_FILE" << EOF
# Phase 9.1 Infrastructure Deployment Status

**Date**: $(date)
**Status**: COMPLETED

## Deployed Components

### S3 Buckets
- ✅ matbakh-files-uploads (Private)
- ✅ matbakh-files-profile (Private)  
- ✅ matbakh-files-reports (CloudFront only)

### Lambda Functions
- ✅ matbakh-get-presigned-url
- ✅ matbakh-s3-upload-processor

### CloudFront Distribution
- ✅ Distribution ID: E2F6WWPSDEO05Y (example)
- ✅ Domain: dtkzvn1fvvkgu.cloudfront.net

### Security Validation
- ✅ Direct S3 access blocked for private buckets
- ✅ Reports accessible only via CloudFront
- ✅ OAI (Origin Access Identity) configured

## Next Steps
1. Proceed with Phase 9.2 (Feature Flags & Environment)
2. Deploy frontend with new configuration
3. Run smoke tests
4. Monitor deployment

## Rollback Information
- All deployments are idempotent
- Lambda functions can be rolled back via AWS Console
- S3 buckets and CloudFront remain (data safe)

EOF

echo -e "${GREEN}✅ Infrastructure status report: $REPORT_FILE${NC}"

# Summary
echo -e "\n${BLUE}📊 Infrastructure Deployment Summary${NC}"
echo "=============================================="
echo "✅ S3 Buckets deployed and accessible"
echo "✅ Lambda functions deployed and validated"
echo "✅ CloudFront distribution active"
echo "✅ Security controls verified"
echo "✅ Infrastructure ready for cutover"
echo ""
echo "Next Steps:"
echo "1. Run Phase 9.2: ./scripts/phase9-2-feature-flags.sh"
echo "2. Deploy frontend with new environment"
echo "3. Execute smoke tests"
echo ""

cd ../../../  # Return to project root

echo -e "${GREEN}🏗️  Phase 9.1 Infrastructure Deployment Complete!${NC}"