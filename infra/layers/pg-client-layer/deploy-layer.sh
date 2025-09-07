#!/bin/bash

# ==============================================
# Deploy PostgreSQL Lambda Layer
# ==============================================

set -e

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# AWS Profile und Region
AWS_PROFILE=${AWS_PROFILE:-matbakh-dev}
AWS_REGION=${AWS_REGION:-eu-central-1}
LAYER_NAME="pg-client-layer"

echo -e "${BLUE}🚀 PostgreSQL Lambda Layer Deployment${NC}"
echo "<REDACTED_AWS_SECRET_ACCESS_KEY>"
echo "Profile: $AWS_PROFILE"
echo "Region: $AWS_REGION"
echo "Layer Name: $LAYER_NAME"
echo ""

# ==============================================
# Build und Package
# ==============================================
echo -e "${YELLOW}1. Building TypeScript...${NC}"
npm run build

echo -e "${YELLOW}2. Installing production dependencies...${NC}"
npm install --production

echo -e "${YELLOW}3. Copying dependencies to layer structure...${NC}"
rm -rf nodejs/node_modules
cp -r node_modules nodejs/

echo -e "${YELLOW}4. Creating layer package...${NC}"
rm -f pg-client-layer.zip
zip -r pg-client-layer.zip nodejs/

# ==============================================
# Deploy Layer
# ==============================================
echo -e "${YELLOW}5. Deploying Lambda Layer...${NC}"

LAYER_ARN=$(aws lambda publish-layer-version \
  --layer-name "$LAYER_NAME" \
  --description "PostgreSQL client with RDS secrets integration" \
  --zip-file fileb://pg-client-layer.zip \
  --compatible-runtimes nodejs18.x nodejs20.x \
  --region "$AWS_REGION" \
  --profile "$AWS_PROFILE" \
  --query 'LayerVersionArn' \
  --output text)

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Layer deployed successfully!${NC}"
    echo -e "${GREEN}Layer ARN: $LAYER_ARN${NC}"
    
    # Save ARN to environment file
    echo "PG_CLIENT_LAYER_ARN=$LAYER_ARN" > ../../../.env.layer
    echo -e "${GREEN}✅ Layer ARN saved to .env.layer${NC}"
    
    # Display usage information
    echo ""
    echo -e "${BLUE}📋 Usage Information:${NC}"
    echo "=================================="
    echo "Layer ARN: $LAYER_ARN"
    echo ""
    echo "Add to Lambda function:"
    echo "aws lambda update-function-configuration \\"
    echo "  --function-name YOUR_FUNCTION_NAME \\"
    echo "  --layers $LAYER_ARN \\"
    echo "  --region $AWS_REGION \\"
    echo "  --profile $AWS_PROFILE"
    echo ""
    echo "Import in Lambda code:"
    echo "import { getPgClient, executeQuery, healthCheck } from '/opt/nodejs/pgClient';"
    
else
    echo -e "${RED}❌ Layer deployment failed${NC}"
    exit 1
fi

# ==============================================
# Cleanup
# ==============================================
echo -e "${YELLOW}6. Cleaning up...${NC}"
rm -f pg-client-layer.zip

echo ""
echo -e "${GREEN}🎉 PostgreSQL Lambda Layer deployment complete!${NC}"
echo -e "${GREEN}Ready for A2.4: Lambda function integration${NC}"