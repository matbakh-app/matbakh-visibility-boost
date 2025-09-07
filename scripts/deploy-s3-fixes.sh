#!/bin/bash

# Deploy S3 Critical Fixes
# Deploys the critical fixes identified in review

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 Deploying S3 Critical Fixes${NC}"
echo ""

# 1. Install dependencies
echo -e "${YELLOW}1. Installing dependencies...${NC}"
npm ci

# 2. Deploy infrastructure with fixes
echo -e "${YELLOW}2. Deploying S3 infrastructure with fixes...${NC}"
cd infra/aws
cdk deploy matbakh-s3-buckets --require-approval never --outputs-file s3-outputs.json
cd ../..

# 3. Update S3 CORS with exact origins
echo -e "${YELLOW}3. Updating S3 CORS configuration...${NC}"
./scripts/update-s3-cors.sh

# 4. Get Function URL
echo -e "${YELLOW}4. Getting Lambda Function URL...${NC}"
FUNCTION_URL=$(aws lambda list-function-url-configs --function-name matbakh-get-presigned-url --region eu-central-1 --query 'FunctionUrlConfigs[0].FunctionUrl' --output text 2>/dev/null || echo "")

if [ -n "$FUNCTION_URL" ] && [ "$FUNCTION_URL" != "None" ]; then
    echo -e "${GREEN}✅ Function URL: $FUNCTION_URL${NC}"
    echo "VITE_PRESIGNED_URL_ENDPOINT=$FUNCTION_URL" >> .env.local
else
    echo -e "${YELLOW}⚠️  Function URL not found - check deployment${NC}"
fi

# 5. Run smoke tests
echo -e "${YELLOW}5. Running smoke tests...${NC}"
./scripts/s3-smoke-test-complete.sh

echo ""
echo -e "${GREEN}🎉 S3 fixes deployed successfully!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Enable S3 Request Metrics: ./scripts/enable-s3-request-metrics.sh"
echo "2. Confirm SNS email subscription for alerts"
echo "3. Test file uploads in the application"