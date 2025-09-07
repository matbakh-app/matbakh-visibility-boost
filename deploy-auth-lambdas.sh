#!/bin/bash
set -e

echo "🚀 Deploying Auth Lambda Functions..."

# Variables
ROLE_ARN="arn:aws:iam::055062860590:role/MatbakhVcStack-VcStartFnServiceRoleD81E4A8A-vJkePnobNf07"
LAYER_ARN="arn:aws:lambda:eu-central-1:055062860590:layer:pg-client-layer:1"
REGION="eu-central-1"
API_ID="guf7ho7bze"

# Create deployment packages
echo "📦 Creating deployment packages..."
zip -j /tmp/auth-start.zip auth-start.js
zip -j /tmp/auth-callback.zip auth-callback.js

# Deploy AuthStartFn
echo "🔧 Deploying AuthStartFn..."
aws lambda create-function \
  --function-name AuthStartFn \
  --runtime nodejs20.x \
  --role $ROLE_ARN \
  --handler auth-start.handler \
  --zip-file fileb:///tmp/auth-start.zip \
  --layers $LAYER_ARN \
  --vpc-config SubnetIds='["subnet-086715492e55e5380","subnet-0d0cfb07da9341ce3","subnet-027c02162f7e5b530"]',SecurityGroupIds='["sg-0ce17ccbf943dd57b"]' \
  --region $REGION \
  --timeout 30 \
  2>/dev/null || \
aws lambda update-function-code \
  --function-name AuthStartFn \
  --zip-file fileb:///tmp/auth-start.zip \
  --region $REGION

# Deploy AuthCallbackFn
echo "🔧 Deploying AuthCallbackFn..."
aws lambda create-function \
  --function-name AuthCallbackFn \
  --runtime nodejs20.x \
  --role $ROLE_ARN \
  --handler auth-callback.handler \
  --zip-file fileb:///tmp/auth-callback.zip \
  --layers $LAYER_ARN \
  --vpc-config SubnetIds='["subnet-086715492e55e5380","subnet-0d0cfb07da9341ce3","subnet-027c02162f7e5b530"]',SecurityGroupIds='["sg-0ce17ccbf943dd57b"]' \
  --region $REGION \
  --timeout 30 \
  2>/dev/null || \
aws lambda update-function-code \
  --function-name AuthCallbackFn \
  --zip-file fileb:///tmp/auth-callback.zip \
  --region $REGION

echo "⏳ Waiting for functions to be ready..."
sleep 5

# Setup API Gateway routes
echo "🌐 Setting up API Gateway routes..."

# Get root resource ID
ROOT_ID=$(aws apigateway get-resources --rest-api-id $API_ID --region $REGION \
  --query 'items[?path==`/`].id' --output text)

# Create /auth resource if it doesn't exist
AUTH_ID=$(aws apigateway get-resources --rest-api-id $API_ID --region $REGION \
  --query 'items[?path==`/auth`].id' --output text 2>/dev/null || echo "")

if [ -z "$AUTH_ID" ]; then
  echo "Creating /auth resource..."
  AUTH_ID=$(aws apigateway create-resource \
    --rest-api-id $API_ID \
    --parent-id $ROOT_ID \
    --path-part auth \
    --region $REGION \
    --query id --output text)
fi

# Create /auth/start resource
START_ID=$(aws apigateway get-resources --rest-api-id $API_ID --region $REGION \
  --query 'items[?path==`/auth/start`].id' --output text 2>/dev/null || echo "")

if [ -z "$START_ID" ]; then
  echo "Creating /auth/start resource..."
  START_ID=$(aws apigateway create-resource \
    --rest-api-id $API_ID \
    --parent-id $AUTH_ID \
    --path-part start \
    --region $REGION \
    --query id --output text)
fi

# Setup POST method for /auth/start
echo "Setting up POST /auth/start..."
aws apigateway put-method \
  --rest-api-id $API_ID \
  --resource-id $START_ID \
  --http-method POST \
  --authorization-type NONE \
  --region $REGION >/dev/null 2>&1 || true

aws apigateway put-integration \
  --rest-api-id $API_ID \
  --resource-id $START_ID \
  --http-method POST \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/arn:aws:lambda:$REGION:055062860590:function:AuthStartFn/invocations \
  --region $REGION >/dev/null 2>&1 || true

# Setup OPTIONS method for CORS
aws apigateway put-method \
  --rest-api-id $API_ID \
  --resource-id $START_ID \
  --http-method OPTIONS \
  --authorization-type NONE \
  --region $REGION >/dev/null 2>&1 || true

aws apigateway put-integration \
  --rest-api-id $API_ID \
  --resource-id $START_ID \
  --http-method OPTIONS \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/arn:aws:lambda:$REGION:055062860590:function:AuthStartFn/invocations \
  --region $REGION >/dev/null 2>&1 || true

# Create /auth/callback resource
CALLBACK_ID=$(aws apigateway get-resources --rest-api-id $API_ID --region $REGION \
  --query 'items[?path==`/auth/callback`].id' --output text 2>/dev/null || echo "")

if [ -z "$CALLBACK_ID" ]; then
  echo "Creating /auth/callback resource..."
  CALLBACK_ID=$(aws apigateway create-resource \
    --rest-api-id $API_ID \
    --parent-id $AUTH_ID \
    --path-part callback \
    --region $REGION \
    --query id --output text)
fi

# Setup GET method for /auth/callback
echo "Setting up GET /auth/callback..."
aws apigateway put-method \
  --rest-api-id $API_ID \
  --resource-id $CALLBACK_ID \
  --http-method GET \
  --authorization-type NONE \
  --region $REGION >/dev/null 2>&1 || true

aws apigateway put-integration \
  --rest-api-id $API_ID \
  --resource-id $CALLBACK_ID \
  --http-method GET \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/arn:aws:lambda:$REGION:055062860590:function:AuthCallbackFn/invocations \
  --region $REGION >/dev/null 2>&1 || true

# Setup HEAD method for link checkers
aws apigateway put-method \
  --rest-api-id $API_ID \
  --resource-id $CALLBACK_ID \
  --http-method HEAD \
  --authorization-type NONE \
  --region $REGION >/dev/null 2>&1 || true

aws apigateway put-integration \
  --rest-api-id $API_ID \
  --resource-id $CALLBACK_ID \
  --http-method HEAD \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/arn:aws:lambda:$REGION:055062860590:function:AuthCallbackFn/invocations \
  --region $REGION >/dev/null 2>&1 || true

# Add Lambda permissions
echo "🔐 Setting up Lambda permissions..."
aws lambda add-permission \
  --function-name AuthStartFn \
  --statement-id api-auth-start \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:$REGION:055062860590:${API_ID}/*/POST/auth/start" \
  --region $REGION 2>/dev/null || true

aws lambda add-permission \
  --function-name AuthStartFn \
  --statement-id api-auth-start-options \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:$REGION:055062860590:${API_ID}/*/OPTIONS/auth/start" \
  --region $REGION 2>/dev/null || true

aws lambda add-permission \
  --function-name AuthCallbackFn \
  --statement-id api-auth-callback \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:$REGION:055062860590:${API_ID}/*/*/auth/callback" \
  --region $REGION 2>/dev/null || true

# Deploy API Gateway
echo "🚀 Deploying API Gateway..."
aws apigateway create-deployment \
  --rest-api-id $API_ID \
  --stage-name prod \
  --description "Add auth endpoints" \
  --region $REGION >/dev/null

echo "🧹 Cleaning up..."
rm -f /tmp/auth-start.zip /tmp/auth-callback.zip

echo "✅ Auth Lambda deployment complete!"
echo ""
echo "📋 Endpoints:"
echo "  POST https://guf7ho7bze.execute-api.eu-central-1.amazonaws.com/prod/auth/start"
echo "  GET  https://guf7ho7bze.execute-api.eu-central-1.amazonaws.com/prod/auth/callback"
echo ""
echo "🧪 Test with:"
echo "  curl -X POST https://guf7ho7bze.execute-api.eu-central-1.amazonaws.com/prod/auth/start \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"email\":\"test@example.com\",\"name\":\"Test User\"}'"