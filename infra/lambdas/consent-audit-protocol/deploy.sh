#!/bin/bash

# Consent Audit Protocol System Deployment Script
# This script deploys the audit logging and compliance reporting system

set -e

echo "🚀 Starting Consent Audit Protocol System deployment..."

# Configuration
FUNCTION_NAME="matbakh-consent-audit-protocol"
REGION="eu-central-1"
RUNTIME="nodejs20.x"
HANDLER="index.handler"
TIMEOUT=60
MEMORY_SIZE=1024

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
            "ENABLE_CLOUDWATCH_LOGS":"true",
            "ENABLE_S3_ARCHIVE":"true",
            "ENABLE_DATABASE_STORAGE":"true",
            "AUDIT_RETENTION_DAYS":"2555",
            "AUDIT_ARCHIVE_AFTER_DAYS":"365",
            "AUDIT_ENCRYPTION_ENABLED":"true",
            "AUDIT_CHECKSUM_VALIDATION":"true",
            "AUDIT_REAL_TIME_ALERTS":"false"
        }'
fi

# Create S3 bucket for audit log archival
AUDIT_BUCKET="matbakh-audit-logs"
echo "🪣 Setting up S3 bucket for audit logs..."

if ! aws s3api head-bucket --bucket $AUDIT_BUCKET --region $REGION 2>/dev/null; then
    echo "🆕 Creating audit logs S3 bucket..."
    aws s3api create-bucket \
        --bucket $AUDIT_BUCKET \
        --region $REGION \
        --create-bucket-configuration LocationConstraint=$REGION

    # Enable versioning
    aws s3api put-bucket-versioning \
        --bucket $AUDIT_BUCKET \
        --versioning-configuration Status=Enabled

    # Set lifecycle policy for long-term archival
    cat > lifecycle-policy.json << EOF
{
    "Rules": [
        {
            "ID": "AuditLogArchival",
            "Status": "Enabled",
            "Filter": {
                "Prefix": "audit-logs/"
            },
            "Transitions": [
                {
                    "Days": 30,
                    "StorageClass": "STANDARD_IA"
                },
                {
                    "Days": 90,
                    "StorageClass": "GLACIER"
                },
                {
                    "Days": 2555,
                    "StorageClass": "DEEP_ARCHIVE"
                }
            ]
        }
    ]
}
EOF

    aws s3api put-bucket-lifecycle-configuration \
        --bucket $AUDIT_BUCKET \
        --lifecycle-configuration file://lifecycle-policy.json

    rm lifecycle-policy.json
else
    echo "📋 Using existing audit logs S3 bucket: $AUDIT_BUCKET"
fi

# Create CloudWatch Log Group
LOG_GROUP_NAME="/aws/lambda/matbakh-consent-audit"
echo "📊 Setting up CloudWatch Log Group..."

if ! aws logs describe-log-groups --log-group-name-prefix $LOG_GROUP_NAME --region $REGION --query 'logGroups[0]' --output text | grep -q $LOG_GROUP_NAME; then
    echo "🆕 Creating CloudWatch Log Group..."
    aws logs create-log-group \
        --log-group-name $LOG_GROUP_NAME \
        --region $REGION

    # Set retention policy (7 years for compliance)
    aws logs put-retention-policy \
        --log-group-name $LOG_GROUP_NAME \
        --retention-in-days 2555 \
        --region $REGION
else
    echo "📋 Using existing CloudWatch Log Group: $LOG_GROUP_NAME"
fi

# Create API Gateway
API_NAME="matbakh-consent-audit-api"
echo "🌐 Setting up API Gateway..."

# Check if API exists
API_ID=$(aws apigateway get-rest-apis --region $REGION --query "items[?name=='$API_NAME'].id" --output text)

if [ -z "$API_ID" ] || [ "$API_ID" == "None" ]; then
    echo "🆕 Creating new API Gateway..."
    API_ID=$(aws apigateway create-rest-api \
        --name $API_NAME \
        --description "Consent Audit Protocol API" \
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

# Create audit resource
AUDIT_RESOURCE_ID=$(aws apigateway get-resources \
    --rest-api-id $API_ID \
    --region $REGION \
    --query 'items[?pathPart==`audit`].id' --output text)

if [ -z "$AUDIT_RESOURCE_ID" ] || [ "$AUDIT_RESOURCE_ID" == "None" ]; then
    echo "🆕 Creating /audit resource..."
    AUDIT_RESOURCE_ID=$(aws apigateway create-resource \
        --rest-api-id $API_ID \
        --parent-id $ROOT_RESOURCE_ID \
        --path-part audit \
        --region $REGION \
        --query 'id' --output text)
fi

# Create sub-resources and methods
declare -A ENDPOINTS=(
    ["log"]="POST"
    ["query"]="GET"
    ["statistics"]="GET"
    ["compliance-report"]="GET"
)

for ENDPOINT in "${!ENDPOINTS[@]}"; do
    METHOD=${ENDPOINTS[$ENDPOINT]}
    echo "🔧 Setting up /$ENDPOINT endpoint..."
    
    # Create resource
    RESOURCE_ID=$(aws apigateway get-resources \
        --rest-api-id $API_ID \
        --region $REGION \
        --query "items[?pathPart==\`$ENDPOINT\`].id" --output text)
    
    if [ -z "$RESOURCE_ID" ] || [ "$RESOURCE_ID" == "None" ]; then
        RESOURCE_ID=$(aws apigateway create-resource \
            --rest-api-id $API_ID \
            --parent-id $AUDIT_RESOURCE_ID \
            --path-part $ENDPOINT \
            --region $REGION \
            --query 'id' --output text)
    fi
    
    # Create methods (including OPTIONS for CORS)
    for HTTP_METHOD in "$METHOD" "OPTIONS"; do
        # Create method
        aws apigateway put-method \
            --rest-api-id $API_ID \
            --resource-id $RESOURCE_ID \
            --http-method $HTTP_METHOD \
            --authorization-type NONE \
            --region $REGION >/dev/null 2>&1 || true
        
        if [ "$HTTP_METHOD" != "OPTIONS" ]; then
            # Create integration
            aws apigateway put-integration \
                --rest-api-id $API_ID \
                --resource-id $RESOURCE_ID \
                --http-method $HTTP_METHOD \
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
            --http-method $HTTP_METHOD \
            --status-code 200 \
            --response-parameters '{"method.response.header.Access-Control-Allow-Origin":false,"method.response.header.Access-Control-Allow-Headers":false,"method.response.header.Access-Control-Allow-Methods":false}' \
            --region $REGION >/dev/null 2>&1 || true
        
        # Create integration response
        aws apigateway put-integration-response \
            --rest-api-id $API_ID \
            --resource-id $RESOURCE_ID \
            --http-method $HTTP_METHOD \
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

echo "✅ Consent Audit Protocol System deployed successfully!"
echo ""
echo "📋 Deployment Summary:"
echo "  Lambda Function: $FUNCTION_NAME"
echo "  API Gateway ID: $API_ID"
echo "  API Endpoint: $API_ENDPOINT"
echo "  S3 Audit Bucket: $AUDIT_BUCKET"
echo "  CloudWatch Log Group: $LOG_GROUP_NAME"
echo ""
echo "🔗 Available Endpoints:"
echo "  POST $API_ENDPOINT/audit/log              - Log audit events"
echo "  GET  $API_ENDPOINT/audit/query            - Query audit logs"
echo "  GET  $API_ENDPOINT/audit/statistics       - Get audit statistics"
echo "  GET  $API_ENDPOINT/audit/compliance-report - Generate compliance report"
echo ""
echo "📝 Example Usage:"
echo "  # Log audit event"
echo "  curl -X POST $API_ENDPOINT/audit/log \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -H 'Authorization: Bearer <token>' \\"
echo "    -d '{\"eventType\":\"consent_granted\",\"severity\":\"info\",\"source\":\"web\"}'"
echo ""
echo "  # Query audit logs"
echo "  curl -X GET '$API_ENDPOINT/audit/query?eventType=consent_granted&limit=10' \\"
echo "    -H 'Authorization: Bearer <token>'"
echo ""
echo "  # Get compliance report"
echo "  curl -X GET '$API_ENDPOINT/audit/compliance-report?startDate=2024-01-01&endDate=2024-12-31' \\"
echo "    -H 'Authorization: Bearer <token>'"

# Cleanup
rm -f deployment.zip

echo "🎉 Deployment completed!"