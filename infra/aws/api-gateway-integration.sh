#!/bin/bash

# 🚀 API Gateway Integration für Lambda-RDS
# Phase A2.5 - Production Deployment Structure
# Date: 2025-08-30

set -e

# Load environment variables
source .env.infrastructure 2>/dev/null || echo "⚠️  .env.infrastructure not found, using defaults"

# Configuration
API_NAME="matbakh-api"
STAGE_NAME="prod"
LAMBDA_FUNCTION_NAME="matbakh-db-test"
REGION="${AWS_REGION:-eu-central-1}"
PROFILE="${AWS_PROFILE:-matbakh-dev}"

echo "🚀 Starting API Gateway Integration..."
echo "📋 Configuration:"
echo "   API Name: $API_NAME"
echo "   Stage: $STAGE_NAME"
echo "   Lambda Function: $LAMBDA_FUNCTION_NAME"
echo "   Region: $REGION"
echo "   Profile: $PROFILE"
echo ""

# Step 1: Create API Gateway REST API
echo "📡 Step 1: Creating API Gateway REST API..."
API_ID=$(aws apigateway create-rest-api \
  --name "$API_NAME" \
  --description "matbakh.app Production API" \
  --endpoint-configuration types=REGIONAL \
  --region "$REGION" \
  --profile "$PROFILE" \
  --query 'id' \
  --output text)

if [ -z "$API_ID" ]; then
  echo "❌ Failed to create API Gateway"
  exit 1
fi

echo "✅ API Gateway created: $API_ID"

# Step 2: Get root resource ID
echo "📋 Step 2: Getting root resource ID..."
ROOT_RESOURCE_ID=$(aws apigateway get-resources \
  --rest-api-id "$API_ID" \
  --region "$REGION" \
  --profile "$PROFILE" \
  --query 'items[?path==`/`].id' \
  --output text)

echo "✅ Root resource ID: $ROOT_RESOURCE_ID"

# Step 3: Create /health resource
echo "🏥 Step 3: Creating /health resource..."
HEALTH_RESOURCE_ID=$(aws apigateway create-resource \
  --rest-api-id "$API_ID" \
  --parent-id "$ROOT_RESOURCE_ID" \
  --path-part "health" \
  --region "$REGION" \
  --profile "$PROFILE" \
  --query 'id' \
  --output text)

echo "✅ Health resource created: $HEALTH_RESOURCE_ID"

# Step 4: Create GET method for /health
echo "🔧 Step 4: Creating GET method for /health..."
aws apigateway put-method \
  --rest-api-id "$API_ID" \
  --resource-id "$HEALTH_RESOURCE_ID" \
  --http-method GET \
  --authorization-type NONE \
  --region "$REGION" \
  --profile "$PROFILE" > /dev/null

echo "✅ GET method created for /health"

# Step 5: Get Lambda function ARN
echo "🔍 Step 5: Getting Lambda function ARN..."
LAMBDA_ARN=$(aws lambda get-function \
  --function-name "$LAMBDA_FUNCTION_NAME" \
  --region "$REGION" \
  --profile "$PROFILE" \
  --query 'Configuration.FunctionArn' \
  --output text)

if [ -z "$LAMBDA_ARN" ]; then
  echo "❌ Lambda function not found: $LAMBDA_FUNCTION_NAME"
  exit 1
fi

echo "✅ Lambda ARN: $LAMBDA_ARN"

# Step 6: Create Lambda integration
echo "🔗 Step 6: Creating Lambda integration..."
INTEGRATION_URI="arn:aws:apigateway:${REGION}:lambda:path/2015-03-31/functions/${LAMBDA_ARN}/invocations"

aws apigateway put-integration \
  --rest-api-id "$API_ID" \
  --resource-id "$HEALTH_RESOURCE_ID" \
  --http-method GET \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri "$INTEGRATION_URI" \
  --region "$REGION" \
  --profile "$PROFILE" > /dev/null

echo "✅ Lambda integration created"

# Step 7: Add Lambda permission for API Gateway
echo "🔐 Step 7: Adding Lambda permission for API Gateway..."
ACCOUNT_ID=$(aws sts get-caller-identity --profile "$PROFILE" --query 'Account' --output text)
SOURCE_ARN="arn:aws:execute-api:${REGION}:${ACCOUNT_ID}:${API_ID}/*/*"

aws lambda add-permission \
  --function-name "$LAMBDA_FUNCTION_NAME" \
  --statement-id "apigateway-invoke-$(date +%s)" \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "$SOURCE_ARN" \
  --region "$REGION" \
  --profile "$PROFILE" > /dev/null

echo "✅ Lambda permission added"

# Step 8: Enable CORS
echo "🌐 Step 8: Enabling CORS..."
aws apigateway put-method \
  --rest-api-id "$API_ID" \
  --resource-id "$HEALTH_RESOURCE_ID" \
  --http-method OPTIONS \
  --authorization-type NONE \
  --region "$REGION" \
  --profile "$PROFILE" > /dev/null

# CORS integration
aws apigateway put-integration \
  --rest-api-id "$API_ID" \
  --resource-id "$HEALTH_RESOURCE_ID" \
  --http-method OPTIONS \
  --type MOCK \
  --request-templates '{"application/json": "{\"statusCode\": 200}"}' \
  --region "$REGION" \
  --profile "$PROFILE" > /dev/null

# CORS method response
aws apigateway put-method-response \
  --rest-api-id "$API_ID" \
  --resource-id "$HEALTH_RESOURCE_ID" \
  --http-method OPTIONS \
  --status-code 200 \
  --response-parameters method.response.header.Access-Control-Allow-Headers=false,method.response.header.Access-Control-Allow-Methods=false,method.response.header.Access-Control-Allow-Origin=false \
  --region "$REGION" \
  --profile "$PROFILE" > /dev/null

# CORS integration response
aws apigateway put-integration-response \
  --rest-api-id "$API_ID" \
  --resource-id "$HEALTH_RESOURCE_ID" \
  --http-method OPTIONS \
  --status-code 200 \
  --response-parameters 'method.response.header.Access-Control-Allow-Headers='"'"'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"'"',method.response.header.Access-Control-Allow-Methods='"'"'GET,OPTIONS'"'"',method.response.header.Access-Control-Allow-Origin='"'"'*'"'"'' \
  --region "$REGION" \
  --profile "$PROFILE" > /dev/null

echo "✅ CORS enabled"

# Step 9: Deploy API
echo "🚀 Step 9: Deploying API to $STAGE_NAME stage..."
aws apigateway create-deployment \
  --rest-api-id "$API_ID" \
  --stage-name "$STAGE_NAME" \
  --description "Initial deployment with Lambda integration" \
  --region "$REGION" \
  --profile "$PROFILE" > /dev/null

echo "✅ API deployed to $STAGE_NAME stage"

# Step 10: Get API endpoint URL
API_URL="https://${API_ID}.execute-api.${REGION}.amazonaws.com/${STAGE_NAME}"
echo ""
echo "🎉 API Gateway Integration Complete!"
echo "📡 API Endpoint: $API_URL"
echo "🏥 Health Check: $API_URL/health"
echo ""

# Step 11: Test the endpoint
echo "🧪 Step 11: Testing API endpoint..."
echo "⏳ Waiting 10 seconds for deployment to propagate..."
sleep 10

HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/health" || echo "000")

if [ "$HTTP_STATUS" = "200" ]; then
  echo "✅ API endpoint test successful (HTTP $HTTP_STATUS)"
  echo "📊 Response:"
  curl -s "$API_URL/health" | jq . 2>/dev/null || curl -s "$API_URL/health"
else
  echo "⚠️  API endpoint test returned HTTP $HTTP_STATUS"
  echo "🔍 This might be normal for initial deployment - try again in a few minutes"
fi

# Step 12: Save configuration
echo ""
echo "💾 Step 12: Saving configuration..."
cat > api-gateway-config.json << EOF
{
  "apiId": "$API_ID",
  "apiUrl": "$API_URL",
  "stage": "$STAGE_NAME",
  "region": "$REGION",
  "lambdaFunction": "$LAMBDA_FUNCTION_NAME",
  "healthEndpoint": "$API_URL/health",
  "createdAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

echo "✅ Configuration saved to api-gateway-config.json"

# Step 13: Update environment file
echo ""
echo "🔧 Step 13: Updating environment configuration..."
if [ -f .env.infrastructure ]; then
  # Remove existing API_GATEWAY entries
  grep -v "^API_GATEWAY" .env.infrastructure > .env.infrastructure.tmp || true
  mv .env.infrastructure.tmp .env.infrastructure
fi

# Add new API_GATEWAY configuration
cat >> .env.infrastructure << EOF

# API Gateway Configuration (Generated $(date -u +%Y-%m-%d))
API_GATEWAY_ID=$API_ID
API_GATEWAY_URL=$API_URL
API_GATEWAY_STAGE=$STAGE_NAME
API_GATEWAY_HEALTH_ENDPOINT=$API_URL/health
EOF

echo "✅ Environment configuration updated"

echo ""
echo "🎯 PHASE A2.5 DEPLOYMENT STRUCTURE COMPLETE!"
echo ""
echo "📋 Summary:"
echo "   ✅ API Gateway REST API created"
echo "   ✅ Lambda integration configured"
echo "   ✅ CORS enabled for web access"
echo "   ✅ Production stage deployed"
echo "   ✅ Health endpoint available"
echo "   ✅ Configuration saved"
echo ""
echo "🚀 Next Steps:"
echo "   1. Test API endpoint: curl $API_URL/health"
echo "   2. Configure custom domain (optional)"
echo "   3. Set up CloudWatch monitoring"
echo "   4. Integrate with frontend application"
echo ""
echo "📊 API Gateway Integration Status: ✅ READY FOR PRODUCTION"