#!/bin/bash

# Deploy Web Proxy Lambda Function
# This script builds, packages, and deploys the web proxy Lambda function

set -e

# Configuration
FUNCTION_NAME="web-proxy"
REGION=${AWS_REGION:-us-east-1}
ROLE_NAME="BedrockAgentExecutionRole"
TIMEOUT=30
MEMORY_SIZE=256
RUNTIME="nodejs18.x"

# Get account ID and role ARN
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ROLE_ARN="arn:aws:iam::$ACCOUNT_ID:role/$ROLE_NAME"

echo "🚀 Deploying Web Proxy Lambda Function..."
echo "Function: $FUNCTION_NAME"
echo "Region: $REGION"
echo "Role: $ROLE_ARN"

# Clean and build
echo "🧹 Cleaning previous build..."
npm run clean

echo "📦 Installing dependencies..."
npm install --production=false

echo "🔨 Building TypeScript..."
npm run build

# Create deployment package
echo "📦 Creating deployment package..."
zip -r web-proxy.zip dist/ node_modules/ -x "node_modules/.cache/*" "node_modules/@types/*" "*.test.*"

# Check if function exists
FUNCTION_EXISTS=$(aws lambda get-function --function-name "$FUNCTION_NAME" --region "$REGION" 2>/dev/null || echo "false")

if [ "$FUNCTION_EXISTS" = "false" ]; then
  echo "🆕 Creating new Lambda function..."
  aws lambda create-function \
    --function-name "$FUNCTION_NAME" \
    --runtime "$RUNTIME" \
    --role "$ROLE_ARN" \
    --handler "dist/index.handler" \
    --zip-file fileb://web-proxy.zip \
    --timeout "$TIMEOUT" \
    --memory-size "$MEMORY_SIZE" \
    --region "$REGION" \
    --environment Variables='{
      "NODE_ENV":"production",
      "AWS_REGION":"'$REGION'",
      "ALLOWED_ORIGINS":"https://matbakh.app,http://localhost:5173"
    }' \
    --tags Project=matbakh-bedrock,Environment=production \
    --description "Web proxy for controlled external API access from Bedrock AI agents"
else
  echo "🔄 Updating existing Lambda function..."
  aws lambda update-function-code \
    --function-name "$FUNCTION_NAME" \
    --zip-file fileb://web-proxy.zip \
    --region "$REGION"
  
  aws lambda update-function-configuration \
    --function-name "$FUNCTION_NAME" \
    --runtime "$RUNTIME" \
    --role "$ROLE_ARN" \
    --handler "dist/index.handler" \
    --timeout "$TIMEOUT" \
    --memory-size "$MEMORY_SIZE" \
    --region "$REGION" \
    --environment Variables='{
      "NODE_ENV":"production",
      "AWS_REGION":"'$REGION'",
      "ALLOWED_ORIGINS":"https://matbakh.app,http://localhost:5173"
    }'
fi

# Wait for function to be ready
echo "⏳ Waiting for function to be ready..."
aws lambda wait function-updated --function-name "$FUNCTION_NAME" --region "$REGION"

# Test the function
echo "🧪 Testing Lambda function..."
TEST_PAYLOAD='{
  "httpMethod": "POST",
  "path": "/proxy",
  "headers": {},
  "body": "{\"url\": \"https://www.google.com\", \"method\": \"GET\"}"
}'

INVOKE_RESULT=$(aws lambda invoke \
  --function-name "$FUNCTION_NAME" \
  --payload "$TEST_PAYLOAD" \
  --region "$REGION" \
  response.json)

echo "Test result:"
cat response.json
echo ""

# Clean up
rm -f web-proxy.zip response.json

# Get function info
FUNCTION_ARN=$(aws lambda get-function --function-name "$FUNCTION_NAME" --region "$REGION" --query 'Configuration.FunctionArn' --output text)

echo "✅ Web Proxy Lambda deployed successfully!"
echo "Function ARN: $FUNCTION_ARN"
echo ""
echo "Next steps:"
echo "1. Configure API Gateway to route /proxy requests to this Lambda"
echo "2. Update Bedrock agent to use this proxy for web requests"
echo "3. Test with allowed domains: google.com, instagram.com, etc."
echo ""
echo "Proxy endpoint URL (via API Gateway): https://your-api-gateway-url/proxy"