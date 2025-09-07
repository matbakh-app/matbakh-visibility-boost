#!/bin/bash

# Deploy Upload Management API Lambda
# This script builds and deploys the upload management API for the dashboard

set -e

FUNCTION_NAME="upload-management-api"
REGION="eu-central-1"
RUNTIME="nodejs20.x"
HANDLER="index.handler"
TIMEOUT=30
MEMORY_SIZE=512

echo "🚀 Deploying Upload Management API..."

# Build TypeScript
echo "📦 Building TypeScript..."
npm install
npm run build

# Create deployment package
echo "📦 Creating deployment package..."
cd dist
zip -r ../deployment.zip . -x "*.test.*" "*.spec.*"
cd ..

# Add node_modules to deployment package
echo "📦 Adding production node_modules..."
npm ci --production
zip -r deployment.zip node_modules -x \
  "node_modules/typescript/*" \
  "node_modules/@types/*" \
  "node_modules/jest/*"

# Check if function exists
if aws lambda get-function --function-name $FUNCTION_NAME --region $REGION >/dev/null 2>&1; then
    echo "🔄 Updating existing function..."
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
    echo "🆕 Creating new function..."
    
    # Get execution role ARN
    ROLE_ARN=$(aws iam get-role --role-name lambda-upload-api-role --query 'Role.Arn' --output text 2>/dev/null || echo "")
    
    if [ -z "$ROLE_ARN" ]; then
        echo "❌ Lambda execution role not found. Creating role..."
        
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

        # Create role
        aws iam create-role \
            --role-name lambda-upload-api-role \
            --assume-role-policy-document file://trust-policy.json \
            --region $REGION

        # Attach basic execution policy
        aws iam attach-role-policy \
            --role-name lambda-upload-api-role \
            --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole \
            --region $REGION

        # Create custom policy for S3 and database access
        cat > custom-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:HeadObject"
      ],
      "Resource": [
        "arn:aws:s3:::matbakh-files-*/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": [
        "arn:aws:secretsmanager:${REGION}:*:secret:matbakh-db-postgres-*"
      ]
    }
  ]
}
EOF

        aws iam put-role-policy \
            --role-name lambda-upload-api-role \
            --policy-name upload-management-api-policy \
            --policy-document file://custom-policy.json \
            --region $REGION

        # Wait for role to be available
        echo "⏳ Waiting for IAM role to be available..."
        sleep 10

        ROLE_ARN=$(aws iam get-role --role-name lambda-upload-api-role --query 'Role.Arn' --output text)
        
        # Clean up temporary files
        rm -f trust-policy.json custom-policy.json
    fi

    # Create function
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
            "NODE_ENV":"production",
            "AWS_REGION":"'$REGION'"
        }'
fi

# Create API Gateway integration (manual step)
echo "🌐 API Gateway setup required:"
echo "   1. Create or update API Gateway REST API"
echo "   2. Add resource: /api/uploads"
echo "   3. Add methods: GET, POST, DELETE with Lambda proxy integration"
echo "   4. Add resource: /api/uploads/analytics"
echo "   5. Add methods: GET, POST with Lambda proxy integration"
echo "   6. Enable CORS on all resources"
echo "   7. Deploy to appropriate stage"

# Clean up
rm -f deployment.zip

echo "✅ Upload Management API deployed successfully!"
echo "📋 Function Name: $FUNCTION_NAME"
echo "🌍 Region: $REGION"
echo ""
echo "🔧 Next steps:"
echo "   1. Configure API Gateway endpoints"
echo "   2. Test API endpoints with authentication"
echo "   3. Update frontend API base URL if needed"
echo "   4. Test upload management dashboard"