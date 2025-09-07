#!/bin/bash

# DSGVO Consent Enforcement Layer Deployment Script
# This script deploys the consent enforcement Lambda function and API Gateway

set -e

echo "🚀 Starting DSGVO Consent Enforcement Layer deployment..."

# Configuration
FUNCTION_NAME="matbakh-dsgvo-consent-enforcement"
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
        --region $REGION \
        --environment Variables='{
            "CONSENT_STRICT_MODE":"false",
            "CONSENT_EXPIRATION_DAYS":"365",
            "CONSENT_GRACE_PERIOD_DAYS":"30",
            "CACHE_EXPIRATION_SECONDS":"300"
        }'
fi

# Set up VPC configuration if needed (for database access)
echo "🔧 Configuring VPC access..."
VPC_CONFIG=$(cat <<EOF
{
    "SubnetIds": [
        "subnet-0123456789abcdef0",
        "subnet-0123456789abcdef1"
    ],
    "SecurityGroupIds": [
        "sg-0123456789abcdef0"
    ]
}
EOF
)

# Note: Update subnet and security group IDs based on your VPC setup
# aws lambda update-function-configuration \
#     --function-name $FUNCTION_NAME \
#     --vpc-config "$VPC_CONFIG" \
#     --region $REGION

# Create API Gateway if it doesn't exist
API_NAME="matbakh-dsgvo-consent-api"
echo "🌐 Setting up API Gateway..."

# Check if API exists
API_ID=$(aws apigateway get-rest-apis --region $REGION --query "items[?name=='$API_NAME'].id" --output text)

if [ -z "$API_ID" ] || [ "$API_ID" == "None" ]; then
    echo "🆕 Creating new API Gateway..."
    API_ID=$(aws apigateway create-rest-api \
        --name $API_NAME \
        --description "DSGVO Consent Enforcement API" \
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

# Create consent resource
CONSENT_RESOURCE_ID=$(aws apigateway get-resources \
    --rest-api-id $API_ID \
    --region $REGION \
    --query 'items[?pathPart==`consent`].id' --output text)

if [ -z "$CONSENT_RESOURCE_ID" ] || [ "$CONSENT_RESOURCE_ID" == "None" ]; then
    echo "🆕 Creating /consent resource..."
    CONSENT_RESOURCE_ID=$(aws apigateway create-resource \
        --rest-api-id $API_ID \
        --parent-id $ROOT_RESOURCE_ID \
        --path-part consent \
        --region $REGION \
        --query 'id' --output text)
fi

# Create sub-resources and methods
for ENDPOINT in "verify" "store" "status"; do
    echo "🔧 Setting up /$ENDPOINT endpoint..."
    
    # Create resource
    RESOURCE_ID=$(aws apigateway get-resources \
        --rest-api-id $API_ID \
        --region $REGION \
        --query "items[?pathPart==\`$ENDPOINT\`].id" --output text)
    
    if [ -z "$RESOURCE_ID" ] || [ "$RESOURCE_ID" == "None" ]; then
        RESOURCE_ID=$(aws apigateway create-resource \
            --rest-api-id $API_ID \
            --parent-id $CONSENT_RESOURCE_ID \
            --path-part $ENDPOINT \
            --region $REGION \
            --query 'id' --output text)
    fi
    
    # Determine HTTP methods for each endpoint
    case $ENDPOINT in
        "verify"|"store")
            METHODS=("POST" "OPTIONS")
            ;;
        "status")
            METHODS=("GET" "OPTIONS")
            ;;
    esac
    
    for METHOD in "${METHODS[@]}"; do
        # Create method
        aws apigateway put-method \
            --rest-api-id $API_ID \
            --resource-id $RESOURCE_ID \
            --http-method $METHOD \
            --authorization-type NONE \
            --region $REGION >/dev/null 2>&1 || true
        
        if [ "$METHOD" != "OPTIONS" ]; then
            # Create integration
            aws apigateway put-integration \
                --rest-api-id $API_ID \
                --resource-id $RESOURCE_ID \
                --http-method $METHOD \
                --type AWS_PROXY \
                --integration-http-method POST \
                --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/arn:aws:lambda:$REGION:$ACCOUNT_ID:function:$FUNCTION_NAME/invocations" \
                --region $REGION >/dev/null 2>&1 || true
        else
            # Handle CORS preflight
            aws apigateway put-integration \
                --rest-api-id $API_ID \
                --resource-id $RESOURCE_ID \
                --http-method OPTIONS \
                --type MOCK \
                --region $REGION >/dev/null 2>&1 || true
        fi
        
        # Create method response
        aws apigateway put-method-response \
            --rest-api-id $API_ID \
            --resource-id $RESOURCE_ID \
            --http-method $METHOD \
            --status-code 200 \
            --response-parameters '{"method.response.header.Access-Control-Allow-Origin":false,"method.response.header.Access-Control-Allow-Headers":false,"method.response.header.Access-Control-Allow-Methods":false}' \
            --region $REGION >/dev/null 2>&1 || true
        
        # Create integration response
        aws apigateway put-integration-response \
            --rest-api-id $API_ID \
            --resource-id $RESOURCE_ID \
            --http-method $METHOD \
            --status-code 200 \
            --response-parameters '{"method.response.header.Access-Control-Allow-Origin":"'"'"'*'"'"'","method.response.header.Access-Control-Allow-Headers":"'"'"'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"'"'","method.response.header.Access-Control-Allow-Methods":"'"'"'GET,POST,OPTIONS'"'"'"}' \
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

echo "✅ DSGVO Consent Enforcement Layer deployed successfully!"
echo ""
echo "📋 Deployment Summary:"
echo "  Lambda Function: $FUNCTION_NAME"
echo "  API Gateway ID: $API_ID"
echo "  API Endpoint: $API_ENDPOINT"
echo ""
echo "🔗 Available Endpoints:"
echo "  POST $API_ENDPOINT/consent/verify   - Verify consent for operations"
echo "  POST $API_ENDPOINT/consent/store    - Store new consent"
echo "  GET  $API_ENDPOINT/consent/status   - Get consent status"
echo ""
echo "📝 Example Usage:"
echo "  # Verify consent"
echo "  curl -X POST $API_ENDPOINT/consent/verify \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"consentTypes\":[\"upload\"],\"operation\":\"upload\"}'"
echo ""
echo "  # Store consent"
echo "  curl -X POST $API_ENDPOINT/consent/store \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"consentType\":\"upload\",\"consentGiven\":true}'"

# Cleanup
rm -f deployment.zip

echo "🎉 Deployment completed!"