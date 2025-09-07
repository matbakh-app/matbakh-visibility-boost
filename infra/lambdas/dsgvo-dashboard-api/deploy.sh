#!/bin/bash

# DSGVO Dashboard API Deployment Script
# This script deploys the API endpoints for the DSGVO compliance dashboard

set -e

echo "🚀 Starting DSGVO Dashboard API deployment..."

# Configuration
FUNCTION_NAME="matbakh-dsgvo-dashboard-api"
REGION="eu-central-1"
RUNTIME="nodejs20.x"
HANDLER="index.handler"
TIMEOUT=30
MEMORY_SIZE=512

# Build the function
echo "📦 Building TypeScript code..."
npm install
npm run build

# Create deployment package
echo "📦 Creating deployment package..."
cd dist
zip -r ../deployment.zip . -x "*.test.*" "*.spec.*"
cd ..

# Add node_modules to deployment package
echo "📦 Adding node_modules..."
zip -r deployment.zip node_modules -x "node_modules/typescript/*" "node_modules/@types/*" "node_modules/jest/*"

# Get AWS account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# IAM Role ARN
ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/lambda-execution-role"

# Check if Lambda function exists
if aws lambda get-function --function-name $FUNCTION_NAME --region $REGION >/dev/null 2>&1; then
    echo "🔄 Updating existing Lambda function..."
    aws lambda update-function-code \
        --function-name $FUNCTION_NAME \
        --zip-file fileb://deployment.zip \
        --region $REGION

    aws lambda update-function-configuration \
        --function-name $FUNCTION_NAME \
        --runtime $RUNTIME \
        --handler $HANDLER \
        --timeout $TIMEOUT \
        --memory-size $MEMORY_SIZE \
        --region $REGION
else
    echo "🆕 Creating new Lambda function..."
    aws lambda create-function \
        --function-name $FUNCTION_NAME \
        --runtime $RUNTIME \
        --role $ROLE_ARN \
        --handler $HANDLER \
        --zip-file fileb://deployment.zip \
        --timeout $TIMEOUT \
        --memory-size $MEMORY_SIZE \
        --region $REGION
fi

# Create API Gateway
API_NAME="matbakh-dsgvo-dashboard-api"
echo "🌐 Setting up API Gateway..."

# Check if API exists
API_ID=$(aws apigateway get-rest-apis --region $REGION --query "items[?name=='$API_NAME'].id" --output text)

if [ -z "$API_ID" ] || [ "$API_ID" == "None" ]; then
    echo "🆕 Creating new API Gateway..."
    API_ID=$(aws apigateway create-rest-api \
        --name $API_NAME \
        --description "DSGVO Dashboard API" \
        --region $REGION \
        --query 'id' --output text)
    echo "Created API Gateway with ID: $API_ID"
else
    echo "📋 Using existing API Gateway: $API_ID"
fi

# Get root resource ID
ROOT_RESOURCE_ID=$(aws apigateway get-resources \
    --rest-api-id $API_ID \
    --region $REGION \
    --query 'items[?path==`/`].id' --output text)

# Create dsgvo resource
DSGVO_RESOURCE_ID=$(aws apigateway get-resources \
    --rest-api-id $API_ID \
    --region $REGION \
    --query 'items[?pathPart==`dsgvo`].id' --output text)

if [ -z "$DSGVO_RESOURCE_ID" ] || [ "$DSGVO_RESOURCE_ID" == "None" ]; then
    echo "🆕 Creating /dsgvo resource..."
    DSGVO_RESOURCE_ID=$(aws apigateway create-resource \
        --rest-api-id $API_ID \
        --parent-id $ROOT_RESOURCE_ID \
        --path-part dsgvo \
        --region $REGION \
        --query 'id' --output text)
fi

# Create endpoints
ENDPOINTS=("consent-metrics" "quarantine-stats" "violations" "compliance-report")

for ENDPOINT in "${ENDPOINTS[@]}"; do
    echo "🔧 Setting up /$ENDPOINT endpoint..."
    
    # Create resource
    RESOURCE_ID=$(aws apigateway get-resources \
        --rest-api-id $API_ID \
        --region $REGION \
        --query "items[?pathPart==\`$ENDPOINT\`].id" --output text)
    
    if [ -z "$RESOURCE_ID" ] || [ "$RESOURCE_ID" == "None" ]; then
        RESOURCE_ID=$(aws apigateway create-resource \
            --rest-api-id $API_ID \
            --parent-id $DSGVO_RESOURCE_ID \
            --path-part $ENDPOINT \
            --region $REGION \
            --query 'id' --output text)
    fi
    
    # Create GET method
    aws apigateway put-method \
        --rest-api-id $API_ID \
        --resource-id $RESOURCE_ID \
        --http-method GET \
        --authorization-type NONE \
        --region $REGION >/dev/null 2>&1 || true
    
    # Create OPTIONS method for CORS
    aws apigateway put-method \
        --rest-api-id $API_ID \
        --resource-id $RESOURCE_ID \
        --http-method OPTIONS \
        --authorization-type NONE \
        --region $REGION >/dev/null 2>&1 || true
    
    # Create integration for GET
    aws apigateway put-integration \
        --rest-api-id $API_ID \
        --resource-id $RESOURCE_ID \
        --http-method GET \
        --type AWS_PROXY \
        --integration-http-method POST \
        --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/arn:aws:lambda:$REGION:$ACCOUNT_ID:function:$FUNCTION_NAME/invocations" \
        --region $REGION >/dev/null 2>&1 || true
    
    # Create integration for OPTIONS (CORS)
    aws apigateway put-integration \
        --rest-api-id $API_ID \
        --resource-id $RESOURCE_ID \
        --http-method OPTIONS \
        --type MOCK \
        --region $REGION >/dev/null 2>&1 || true
    
    # Create method responses
    for METHOD in "GET" "OPTIONS"; do
        aws apigateway put-method-response \
            --rest-api-id $API_ID \
            --resource-id $RESOURCE_ID \
            --http-method $METHOD \
            --status-code 200 \
            --response-parameters '{"method.response.header.Access-Control-Allow-Origin":false,"method.response.header.Access-Control-Allow-Headers":false,"method.response.header.Access-Control-Allow-Methods":false}' \
            --region $REGION >/dev/null 2>&1 || true
        
        aws apigateway put-integration-response \
            --rest-api-id $API_ID \
            --resource-id $RESOURCE_ID \
            --http-method $METHOD \
            --status-code 200 \
            --response-parameters '{"method.response.header.Access-Control-Allow-Origin":"'"'"'*'"'"'","method.response.header.Access-Control-Allow-Headers":"'"'"'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"'"'","method.response.header.Access-Control-Allow-Methods":"'"'"'GET,OPTIONS'"'"'"}' \
            --region $REGION >/dev/null 2>&1 || true
    done
done

# Grant API Gateway permission to invoke Lambda
echo "🔐 Setting up Lambda permissions..."
aws lambda add-permission \
    --function-name $FUNCTION_NAME \
    --statement-id apigateway-invoke \
    --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn "arn:aws:execute-api:$REGION:$ACCOUNT_ID:$API_ID/*/*" \
    --region $REGION >/dev/null 2>&1 || true

# Deploy API
echo "🚀 Deploying API..."
aws apigateway create-deployment \
    --rest-api-id $API_ID \
    --stage-name prod \
    --region $REGION >/dev/null

# Get API endpoint
API_ENDPOINT="https://$API_ID.execute-api.$REGION.amazonaws.com/prod"

echo "✅ DSGVO Dashboard API deployed successfully!"
echo ""
echo "📋 Deployment Summary:"
echo "  Lambda Function: $FUNCTION_NAME"
echo "  API Gateway ID: $API_ID"
echo "  API Endpoint: $API_ENDPOINT"
echo ""
echo "🔗 Available Endpoints:"
echo "  GET $API_ENDPOINT/dsgvo/consent-metrics     - Get consent metrics"
echo "  GET $API_ENDPOINT/dsgvo/quarantine-stats    - Get quarantine statistics"
echo "  GET $API_ENDPOINT/dsgvo/violations          - Get compliance violations"
echo "  GET $API_ENDPOINT/dsgvo/compliance-report   - Generate compliance report"
echo ""
echo "📝 Example Usage:"
echo "  # Get consent metrics"
echo "  curl -H 'Authorization: Bearer <token>' $API_ENDPOINT/dsgvo/consent-metrics"
echo ""
echo "  # Get violations for last 30 days"
echo "  curl -H 'Authorization: Bearer <token>' '$API_ENDPOINT/dsgvo/violations?startDate=2024-01-01&endDate=2024-01-31'"

# Cleanup
rm -f deployment.zip

echo "🎉 Deployment completed!"