#!/bin/bash

# Upload Data Protection Verification System Deployment Script
# This script deploys the GDPR-compliant file upload validation system

set -e

echo "🚀 Starting Upload Data Protection Verification System deployment..."

# Configuration
FUNCTION_NAME="matbakh-upload-data-protection"
REGION="eu-central-1"
RUNTIME="nodejs20.x"
HANDLER="index.handler"
TIMEOUT=300
MEMORY_SIZE=2048

# Build the function
echo "📦 Building TypeScript code..."
npm install
npm run build

# Create deployment package
echo "📦 Creating deployment package..."
cd dist
zip -r ../deployment.zip . -x "*.test.*" "*.spec.*"
cd ..

# Add node_modules to deployment package (excluding dev dependencies)
echo "📦 Adding production node_modules..."
zip -r deployment.zip node_modules -x \
  "node_modules/typescript/*" \
  "node_modules/@types/*" \
  "node_modules/jest/*" \
  "node_modules/ts-jest/*" \
  "node_modules/@jest/*"

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
            "MAX_FILE_SIZE":"10485760",
            "ALLOWED_FILE_TYPES":"jpg,jpeg,png,pdf,txt,doc,docx",
            "ALLOWED_MIME_TYPES":"image/jpeg,image/png,application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "ENABLE_PII_DETECTION":"true",
            "ENABLE_MALWARE_SCANNING":"true",
            "ENABLE_CONTENT_ANALYSIS":"true",
            "REQUIRE_ENCRYPTION":"false",
            "AUTO_QUARANTINE":"true",
            "STRICT_MODE":"false",
            "QUARANTINE_BUCKET":"matbakh-quarantine-files",
            "DELETE_QUARANTINED_FILES":"false"
        }'
fi

# Create quarantine S3 bucket
QUARANTINE_BUCKET="matbakh-quarantine-files"
echo "🪣 Setting up quarantine S3 bucket..."

if ! aws s3api head-bucket --bucket $QUARANTINE_BUCKET --region $REGION 2>/dev/null; then
    echo "🆕 Creating quarantine S3 bucket..."
    aws s3api create-bucket \
        --bucket $QUARANTINE_BUCKET \
        --region $REGION \
        --create-bucket-configuration LocationConstraint=$REGION

    # Enable versioning for audit trail
    aws s3api put-bucket-versioning \
        --bucket $QUARANTINE_BUCKET \
        --versioning-configuration Status=Enabled

    # Set up bucket policy for restricted access
    cat > quarantine-bucket-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "DenyDirectAccess",
            "Effect": "Deny",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::$QUARANTINE_BUCKET/*",
            "Condition": {
                "StringNotEquals": {
                    "aws:PrincipalServiceName": [
                        "lambda.amazonaws.com"
                    ]
                }
            }
        },
        {
            "Sid": "AllowLambdaAccess",
            "Effect": "Allow",
            "Principal": {
                "AWS": "$ROLE_ARN"
            },
            "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject"
            ],
            "Resource": "arn:aws:s3:::$QUARANTINE_BUCKET/*"
        }
    ]
}
EOF

    aws s3api put-bucket-policy \
        --bucket $QUARANTINE_BUCKET \
        --policy file://quarantine-bucket-policy.json

    rm quarantine-bucket-policy.json

    # Set lifecycle policy for automatic cleanup
    cat > quarantine-lifecycle-policy.json << EOF
{
    "Rules": [
        {
            "ID": "QuarantineCleanup",
            "Status": "Enabled",
            "Filter": {
                "Prefix": "quarantine/"
            },
            "Transitions": [
                {
                    "Days": 30,
                    "StorageClass": "STANDARD_IA"
                },
                {
                    "Days": 90,
                    "StorageClass": "GLACIER"
                }
            ],
            "Expiration": {
                "Days": 2555
            }
        }
    ]
}
EOF

    aws s3api put-bucket-lifecycle-configuration \
        --bucket $QUARANTINE_BUCKET \
        --lifecycle-configuration file://quarantine-lifecycle-policy.json

    rm quarantine-lifecycle-policy.json
else
    echo "📋 Using existing quarantine S3 bucket: $QUARANTINE_BUCKET"
fi

# Set up S3 event trigger for upload buckets
UPLOAD_BUCKETS=("matbakh-files-uploads" "matbakh-files-profile")

for UPLOAD_BUCKET in "${UPLOAD_BUCKETS[@]}"; do
    echo "🔗 Setting up S3 event trigger for $UPLOAD_BUCKET..."
    
    # Check if bucket exists
    if aws s3api head-bucket --bucket $UPLOAD_BUCKET --region $REGION 2>/dev/null; then
        # Add Lambda permission for S3 to invoke the function
        aws lambda add-permission \
            --function-name $FUNCTION_NAME \
            --statement-id "s3-trigger-$UPLOAD_BUCKET" \
            --action lambda:InvokeFunction \
            --principal s3.amazonaws.com \
            --source-arn "arn:aws:s3:::$UPLOAD_BUCKET" \
            --region $REGION >/dev/null 2>&1 || true

        # Create S3 event notification configuration
        cat > s3-notification-config.json << EOF
{
    "LambdaConfigurations": [
        {
            "Id": "upload-data-protection-trigger",
            "LambdaFunctionArn": "arn:aws:lambda:$REGION:$ACCOUNT_ID:function:$FUNCTION_NAME",
            "Events": [
                "s3:ObjectCreated:*"
            ],
            "Filter": {
                "Key": {
                    "FilterRules": [
                        {
                            "Name": "prefix",
                            "Value": "user-uploads/"
                        }
                    ]
                }
            }
        }
    ]
}
EOF

        # Apply notification configuration
        aws s3api put-bucket-notification-configuration \
            --bucket $UPLOAD_BUCKET \
            --notification-configuration file://s3-notification-config.json

        rm s3-notification-config.json
        echo "✅ S3 trigger configured for $UPLOAD_BUCKET"
    else
        echo "⚠️  Upload bucket $UPLOAD_BUCKET does not exist - skipping trigger setup"
    fi
done

# Create health check API Gateway (optional)
API_NAME="matbakh-upload-protection-api"
echo "🌐 Setting up health check API Gateway..."

# Check if API exists
API_ID=$(aws apigateway get-rest-apis --region $REGION --query "items[?name=='$API_NAME'].id" --output text)

if [ -z "$API_ID" ] || [ "$API_ID" == "None" ]; then
    echo "🆕 Creating new API Gateway..."
    API_ID=$(aws apigateway create-rest-api \
        --name $API_NAME \
        --description "Upload Data Protection Health Check API" \
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

# Create health resource
HEALTH_RESOURCE_ID=$(aws apigateway get-resources \
    --rest-api-id $API_ID \
    --region $REGION \
    --query 'items[?pathPart==`health`].id' --output text)

if [ -z "$HEALTH_RESOURCE_ID" ] || [ "$HEALTH_RESOURCE_ID" == "None" ]; then
    echo "🆕 Creating /health resource..."
    HEALTH_RESOURCE_ID=$(aws apigateway create-resource \
        --rest-api-id $API_ID \
        --parent-id $ROOT_RESOURCE_ID \
        --path-part health \
        --region $REGION \
        --query 'id' --output text)
fi

# Create GET method for health check
aws apigateway put-method \
    --rest-api-id $API_ID \
    --resource-id $HEALTH_RESOURCE_ID \
    --http-method GET \
    --authorization-type NONE \
    --region $REGION >/dev/null 2>&1 || true

# Create integration
aws lambda add-permission \
    --function-name $FUNCTION_NAME \
    --statement-id apigateway-health-check \
    --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn "arn:aws:execute-api:$REGION:$ACCOUNT_ID:$API_ID/*/GET/health" \
    --region $REGION >/dev/null 2>&1 || true

aws apigateway put-integration \
    --rest-api-id $API_ID \
    --resource-id $HEALTH_RESOURCE_ID \
    --http-method GET \
    --type AWS_PROXY \
    --integration-http-method POST \
    --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/arn:aws:lambda:$REGION:$ACCOUNT_ID:function:$FUNCTION_NAME:healthCheck/invocations" \
    --region $REGION >/dev/null 2>&1 || true

# Deploy API
echo "🚀 Deploying health check API..."
aws apigateway create-deployment \
    --rest-api-id $API_ID \
    --stage-name prod \
    --region $REGION >/dev/null

# Get API endpoint
API_ENDPOINT="https://$API_ID.execute-api.$REGION.amazonaws.com/prod"

echo "✅ Upload Data Protection Verification System deployed successfully!"
echo ""
echo "📋 Deployment Summary:"
echo "  Lambda Function: $FUNCTION_NAME"
echo "  Quarantine Bucket: $QUARANTINE_BUCKET"
echo "  Health Check API: $API_ENDPOINT/health"
echo ""
echo "🔗 S3 Event Triggers:"
for UPLOAD_BUCKET in "${UPLOAD_BUCKETS[@]}"; do
    echo "  - $UPLOAD_BUCKET (user-uploads/ prefix)"
done
echo ""
echo "⚙️  Configuration:"
echo "  Max File Size: 10MB"
echo "  PII Detection: Enabled"
echo "  Malware Scanning: Enabled"
echo "  Content Analysis: Enabled"
echo "  Auto Quarantine: Enabled"
echo "  Strict Mode: Disabled"
echo ""
echo "📝 Usage:"
echo "  Files uploaded to monitored S3 buckets will be automatically scanned"
echo "  Non-compliant files will be quarantined in: $QUARANTINE_BUCKET"
echo "  Health check: curl $API_ENDPOINT/health"
echo ""
echo "🔍 Monitoring:"
echo "  Check CloudWatch logs: /aws/lambda/$FUNCTION_NAME"
echo "  Monitor quarantine bucket for flagged files"
echo "  Review quarantine database records for compliance reporting"

# Cleanup
rm -f deployment.zip

echo "🎉 Deployment completed!"