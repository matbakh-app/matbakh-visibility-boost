#!/bin/bash

# Deploy Bedrock Agent Lambda Function
# This script builds, packages, and deploys the Bedrock AI agent Lambda function

set -e

# Configuration
FUNCTION_NAME="bedrock-agent"
REGION=${AWS_REGION:-us-east-1}
ROLE_NAME="BedrockAgentExecutionRole"
TIMEOUT=30
MEMORY_SIZE=512
RUNTIME="nodejs18.x"

# Get account ID and role ARN
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ROLE_ARN="arn:aws:iam::$ACCOUNT_ID:role/$ROLE_NAME"

echo "🚀 Deploying Bedrock Agent Lambda Function..."
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
zip -r bedrock-agent.zip dist/ node_modules/ -x "node_modules/.cache/*" "node_modules/@types/*" "*.test.*"

# Check if function exists
FUNCTION_EXISTS=$(aws lambda get-function --function-name "$FUNCTION_NAME" --region "$REGION" 2>/dev/null || echo "false")

if [ "$FUNCTION_EXISTS" = "false" ]; then
  echo "🆕 Creating new Lambda function..."
  aws lambda create-function \
    --function-name "$FUNCTION_NAME" \
    --runtime "$RUNTIME" \
    --role "$ROLE_ARN" \
    --handler "dist/index.handler" \
    --zip-file fileb://bedrock-agent.zip \
    --timeout "$TIMEOUT" \
    --memory-size "$MEMORY_SIZE" \
    --region "$REGION" \
    --environment Variables='{
      "NODE_ENV":"production",
      "AWS_REGION":"'$REGION'",
      "VC_BEDROCK_LIVE":"false",
      "VC_BEDROCK_ROLLOUT_PERCENT":"0",
      "ALLOWED_ORIGINS":"https://matbakh.app,http://localhost:5173"
    }' \
    --tags Project=matbakh-bedrock,Environment=production \
    --description "Bedrock AI agent for matbakh.app with Claude 3.5 Sonnet"
else
  echo "🔄 Updating existing Lambda function..."
  aws lambda update-function-code \
    --function-name "$FUNCTION_NAME" \
    --zip-file fileb://bedrock-agent.zip \
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
      "VC_BEDROCK_LIVE":"false",
      "VC_BEDROCK_ROLLOUT_PERCENT":"0",
      "ALLOWED_ORIGINS":"https://matbakh.app,http://localhost:5173"
    }'
fi

# Wait for function to be ready
echo "⏳ Waiting for function to be ready..."
aws lambda wait function-updated --function-name "$FUNCTION_NAME" --region "$REGION"

# Create DynamoDB table for logging if it doesn't exist
echo "🗄️ Creating DynamoDB table for AI operation logs..."
aws dynamodb create-table \
  --table-name bedrock_agent_logs \
  --attribute-definitions \
    AttributeName=request_id,AttributeType=S \
    AttributeName=timestamp,AttributeType=S \
  --key-schema \
    AttributeName=request_id,KeyType=HASH \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
  --global-secondary-indexes \
    IndexName=timestamp-index,KeySchema=[{AttributeName=timestamp,KeyType=HASH}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5} \
  --tags Key=Project,Value=matbakh-bedrock Key=Environment,Value=production \
  --region "$REGION" \
  || echo "DynamoDB table bedrock_agent_logs already exists"

# Test the function
echo "🧪 Testing Lambda function..."
TEST_PAYLOAD='{
  "httpMethod": "GET",
  "path": "/health",
  "headers": {},
  "body": null
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
rm -f bedrock-agent.zip response.json

# Get function info
FUNCTION_ARN=$(aws lambda get-function --function-name "$FUNCTION_NAME" --region "$REGION" --query 'Configuration.FunctionArn' --output text)

echo "✅ Bedrock Agent Lambda deployed successfully!"
echo "Function ARN: $FUNCTION_ARN"
echo ""
echo "Next steps:"
echo "1. Configure API Gateway to route requests to this Lambda"
echo "2. Set up VPC configuration if needed for RDS access"
echo "3. Enable feature flags: VC_BEDROCK_LIVE=true"
echo "4. Test with real Bedrock requests"
echo ""
echo "Health check URL (via API Gateway): https://your-api-gateway-url/ai/health"
echo "AI endpoint URL (via API Gateway): https://your-api-gateway-url/ai/invoke"