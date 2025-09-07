#!/bin/bash

# Deploy S3 Presigned URL Lambda Function
# This script builds, packages, and deploys the Lambda function with proper IAM roles and VPC configuration

set -e

# Configuration
FUNCTION_NAME="matbakh-get-presigned-url"
REGION="eu-central-1"
RUNTIME="nodejs20.x"
HANDLER="index.handler"
TIMEOUT=30
MEMORY_SIZE=256
LAYER_ARN="arn:aws:lambda:eu-central-1:055062860590:layer:pg-client-layer:1"

# VPC Configuration (from existing infrastructure)
VPC_ID="vpc-0c72fab3273a1be4f"
SUBNET_IDS="subnet-0123456789abcdef0,subnet-0123456789abcdef1"  # Update with actual subnet IDs
SECURITY_GROUP_ID="sg-lambda-rds"  # Update with actual security group ID

# S3 Bucket names (from CDK deployment)
UPLOADS_BUCKET="matbakh-files-uploads"
PROFILE_BUCKET="matbakh-files-profile"
REPORTS_BUCKET="matbakh-files-reports"

# CloudFront domain (from CDK deployment)
CLOUDFRONT_DOMAIN="d1234567890.cloudfront.net"  # Update with actual domain

echo "🚀 Starting deployment of ${FUNCTION_NAME}..."

# Step 1: Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Step 2: Build TypeScript
echo "🔨 Building TypeScript..."
npm run build

# Step 3: Create deployment package
echo "📦 Creating deployment package..."
rm -f function.zip
cd dist
zip -r ../function.zip . -x "*.test.*" "*.spec.*"
cd ..

# Add node_modules to the zip
zip -r function.zip node_modules/ -x "node_modules/typescript/*" "node_modules/@types/*"

echo "✅ Deployment package created: $(du -h function.zip | cut -f1)"

# Step 4: Create IAM role if it doesn't exist
ROLE_NAME="${FUNCTION_NAME}-execution-role"
ROLE_ARN="arn:aws:iam::055062860590:role/${ROLE_NAME}"

echo "🔐 Checking IAM role..."
if ! aws iam get-role --role-name "${ROLE_NAME}" >/dev/null 2>&1; then
    echo "Creating IAM role: ${ROLE_NAME}"
    
    # Create trust policy
    cat > trust-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

    # Create the role
    aws iam create-role \
        --role-name "${ROLE_NAME}" \
        --assume-role-policy-document file://trust-policy.json \
        --description "Execution role for ${FUNCTION_NAME}"

    # Attach basic Lambda execution policy
    aws iam attach-role-policy \
        --role-name "${ROLE_NAME}" \
        --policy-arn "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"

    # Attach VPC execution policy
    aws iam attach-role-policy \
        --role-name "${ROLE_NAME}" \
        --policy-arn "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"

    # Create and attach custom policy for S3 and Secrets Manager
    cat > custom-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:PutObjectAcl",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": [
        "arn:aws:s3:::${UPLOADS_BUCKET}/*",
        "arn:aws:s3:::${PROFILE_BUCKET}/*",
        "arn:aws:s3:::${REPORTS_BUCKET}/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::${UPLOADS_BUCKET}",
        "arn:aws:s3:::${PROFILE_BUCKET}",
        "arn:aws:s3:::${REPORTS_BUCKET}"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "arn:aws:secretsmanager:${REGION}:*:secret:matbakh-db-postgres-*"
    }
  ]
}
EOF

    aws iam put-role-policy \
        --role-name "${ROLE_NAME}" \
        --policy-name "${FUNCTION_NAME}-custom-policy" \
        --policy-document file://custom-policy.json

    # Clean up temporary files
    rm -f trust-policy.json custom-policy.json

    echo "⏳ Waiting for IAM role to be ready..."
    sleep 10
else
    echo "✅ IAM role already exists: ${ROLE_NAME}"
fi

# Step 5: Create or update Lambda function
echo "🚀 Deploying Lambda function..."

if aws lambda get-function --function-name "${FUNCTION_NAME}" >/dev/null 2>&1; then
    echo "Updating existing function..."
    aws lambda update-function-code \
        --function-name "${FUNCTION_NAME}" \
        --zip-file fileb://function.zip

    aws lambda update-function-configuration \
        --function-name "${FUNCTION_NAME}" \
        --runtime "${RUNTIME}" \
        --handler "${HANDLER}" \
        --timeout "${TIMEOUT}" \
        --memory-size "${MEMORY_SIZE}" \
        --layers "${LAYER_ARN}" \
        --environment Variables="{
            NODE_ENV=production,
            DB_SECRET_NAME=matbakh-db-postgres,
            COGNITO_REGION=${COGNITO_REGION:-eu-central-1},
            COGNITO_USER_POOL_ID=${COGNITO_USER_POOL_ID:-},
            CLOUDFRONT_DOMAIN=${CLOUDFRONT_DOMAIN},
            UPLOADS_BUCKET=${UPLOADS_BUCKET},
            PROFILE_BUCKET=${PROFILE_BUCKET},
            REPORTS_BUCKET=${REPORTS_BUCKET}
        }"
else
    echo "Creating new function..."
    aws lambda create-function \
        --function-name "${FUNCTION_NAME}" \
        --runtime "${RUNTIME}" \
        --role "${ROLE_ARN}" \
        --handler "${HANDLER}" \
        --zip-file fileb://function.zip \
        --timeout "${TIMEOUT}" \
        --memory-size "${MEMORY_SIZE}" \
        --layers "${LAYER_ARN}" \
        --vpc-config SubnetIds="${SUBNET_IDS}",SecurityGroupIds="${SECURITY_GROUP_ID}" \
        --environment Variables="{
            NODE_ENV=production,
            DB_SECRET_NAME=matbakh-db-postgres,
            COGNITO_REGION=${COGNITO_REGION:-eu-central-1},
            COGNITO_USER_POOL_ID=${COGNITO_USER_POOL_ID:-},
            CLOUDFRONT_DOMAIN=${CLOUDFRONT_DOMAIN},
            UPLOADS_BUCKET=${UPLOADS_BUCKET},
            PROFILE_BUCKET=${PROFILE_BUCKET},
            REPORTS_BUCKET=${REPORTS_BUCKET}
        }" \
        --description "Generate presigned URLs for S3 file uploads with security validation"
fi

# Step 6: Wait for function to be ready
echo "⏳ Waiting for function to be ready..."
aws lambda wait function-updated --function-name "${FUNCTION_NAME}"

# Step 7: Test the function
echo "🧪 Testing Lambda function..."
cat > test-payload.json << EOF
{
  "httpMethod": "POST",
  "headers": {
    "Content-Type": "application/json",
    "Origin": "https://matbakh.app"
  },
  "body": "{\"bucket\":\"matbakh-files-uploads\",\"filename\":\"test.jpg\",\"contentType\":\"image/jpeg\",\"userId\":\"test-user-id\",\"fileSize\":1024}",
  "requestContext": {
    "authorizer": {
      "claims": {
        "sub": "test-user-id"
      }
    }
  }
}
EOF

echo "Invoking function with test payload..."
aws lambda invoke \
    --function-name "${FUNCTION_NAME}" \
    --payload file://test-payload.json \
    --cli-binary-format raw-in-base64-out \
    response.json

echo "📋 Function response:"
cat response.json | jq .

# Clean up
rm -f function.zip test-payload.json response.json

echo "✅ Deployment completed successfully!"
echo "📝 Function ARN: arn:aws:lambda:${REGION}:055062860590:function:${FUNCTION_NAME}"
echo "🔗 You can now integrate this function with API Gateway or invoke it directly."

# Step 8: Create API Gateway integration (optional)
read -p "Do you want to create an API Gateway integration? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🌐 Creating API Gateway integration..."
    
    # This would create an API Gateway REST API with proper CORS and authentication
    # For now, we'll just output the instructions
    echo "📋 To create API Gateway integration:"
    echo "1. Create a new REST API in API Gateway"
    echo "2. Create a POST method on the desired resource"
    echo "3. Set integration type to Lambda Function"
    echo "4. Use function ARN: arn:aws:lambda:${REGION}:055062860590:function:${FUNCTION_NAME}"
    echo "5. Enable CORS with origins: https://matbakh.app"
    echo "6. Deploy to a stage (e.g., 'prod')"
fi

echo "🎉 All done! Your S3 presigned URL Lambda function is ready to use."