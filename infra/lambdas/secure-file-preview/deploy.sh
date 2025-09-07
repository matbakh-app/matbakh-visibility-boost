#!/bin/bash

# Deploy Secure File Preview System Lambda
# This script builds and deploys the secure file preview system with WAF protection

set -e

FUNCTION_NAME="secure-file-preview"
REGION="eu-central-1"
RUNTIME="nodejs20.x"
HANDLER="index.handler"
TIMEOUT=300
MEMORY_SIZE=2048  # Higher memory for image processing

echo "🚀 Deploying Secure File Preview System..."

# Build TypeScript
echo "📦 Building TypeScript..."
npm install
npm run build

# Create deployment package
echo "📦 Creating deployment package..."
cd dist
zip -r ../deployment.zip . -x "*.test.*" "*.spec.*"
cd ..

# Add node_modules to deployment package (excluding dev dependencies)
echo "📦 Adding production node_modules..."
npm ci --production
zip -r deployment.zip node_modules -x \
  "node_modules/typescript/*" \
  "node_modules/@types/*" \
  "node_modules/jest/*" \
  "node_modules/ts-node/*"

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
    ROLE_ARN=$(aws iam get-role --role-name lambda-preview-execution-role --query 'Role.Arn' --output text 2>/dev/null || echo "")
    
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
            --role-name lambda-preview-execution-role \
            --assume-role-policy-document file://trust-policy.json \
            --region $REGION

        # Attach basic execution policy
        aws iam attach-role-policy \
            --role-name lambda-preview-execution-role \
            --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole \
            --region $REGION

        # Attach VPC execution policy (if needed)
        aws iam attach-role-policy \
            --role-name lambda-preview-execution-role \
            --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole \
            --region $REGION

        # Create custom policy for S3, DynamoDB, and CloudFront
        cat > custom-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:GetObjectMetadata",
        "s3:HeadObject"
      ],
      "Resource": [
        "arn:aws:s3:::matbakh-files-*/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:PutObjectAcl",
        "s3:DeleteObject",
        "s3:GetObject",
        "s3:HeadObject"
      ],
      "Resource": [
        "arn:aws:s3:::matbakh-preview-cache/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::matbakh-preview-cache"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ],
      "Resource": [
        "arn:aws:dynamodb:${REGION}:*:table/preview-cache-metadata",
        "arn:aws:dynamodb:${REGION}:*:table/preview-cache-metadata/index/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateInvalidation"
      ],
      "Resource": "*"
    }
  ]
}
EOF

        aws iam put-role-policy \
            --role-name lambda-preview-execution-role \
            --policy-name secure-file-preview-policy \
            --policy-document file://custom-policy.json \
            --region $REGION

        # Wait for role to be available
        echo "⏳ Waiting for IAM role to be available..."
        sleep 10

        ROLE_ARN=$(aws iam get-role --role-name lambda-preview-execution-role --query 'Role.Arn' --output text)
        
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
            "AWS_REGION":"'$REGION'",
            "CACHE_BUCKET":"matbakh-preview-cache",
            "CACHE_TABLE_NAME":"preview-cache-metadata",
            "CLOUDFRONT_DOMAIN":"'${CLOUDFRONT_DOMAIN:-''}'",
            "MAX_FILE_SIZE":"52428800",
            "RATE_LIMIT_WINDOW":"60000",
            "RATE_LIMIT_MAX_REQUESTS":"20"
        }'
fi

# Create S3 bucket for preview cache
echo "🪣 Creating S3 cache bucket..."
aws s3 mb s3://matbakh-preview-cache --region $REGION 2>/dev/null || echo "Bucket matbakh-preview-cache already exists"

# Configure S3 bucket for preview cache
aws s3api put-bucket-versioning \
    --bucket matbakh-preview-cache \
    --versioning-configuration Status=Enabled \
    --region $REGION

aws s3api put-bucket-encryption \
    --bucket matbakh-preview-cache \
    --server-side-encryption-configuration '{
        "Rules": [
            {
                "ApplyServerSideEncryptionByDefault": {
                    "SSEAlgorithm": "AES256"
                }
            }
        ]
    }' \
    --region $REGION

# Set lifecycle policy for cache cleanup
aws s3api put-bucket-lifecycle-configuration \
    --bucket matbakh-preview-cache \
    --lifecycle-configuration '{
        "Rules": [
            {
                "ID": "DeleteOldPreviews",
                "Status": "Enabled",
                "Filter": {"Prefix": ""},
                "Expiration": {"Days": 7},
                "NoncurrentVersionExpiration": {"NoncurrentDays": 1}
            }
        ]
    }' \
    --region $REGION

# Create DynamoDB table for cache metadata
echo "🗄️ Creating DynamoDB cache table..."
aws dynamodb create-table \
    --table-name preview-cache-metadata \
    --attribute-definitions \
        AttributeName=cacheKey,AttributeType=S \
        AttributeName=expiresAt,AttributeType=S \
    --key-schema \
        AttributeName=cacheKey,KeyType=HASH \
    --global-secondary-indexes \
        IndexName=ExpirationIndex,KeySchema=[{AttributeName=expiresAt,KeyType=HASH}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5} \
    --provisioned-throughput ReadCapacityUnits=10,WriteCapacityUnits=10 \
    --region $REGION \
    --no-cli-pager 2>/dev/null || echo "Table preview-cache-metadata already exists"

# Enable TTL on DynamoDB table
aws dynamodb update-time-to-live \
    --table-name preview-cache-metadata \
    --time-to-live-specification Enabled=true,AttributeName=TTL \
    --region $REGION \
    --no-cli-pager 2>/dev/null || echo "TTL already enabled"

# Create API Gateway (optional - can be done manually)
echo "🌐 API Gateway setup:"
echo "   Create a new REST API in API Gateway"
echo "   Add resources: /preview/generate, /preview/cache/stats, etc."
echo "   Configure Lambda proxy integration"
echo "   Enable CORS"
echo "   Deploy to stage"

# Create CloudFront distribution for cache (optional)
echo "☁️ CloudFront setup (optional):"
echo "   Create CloudFront distribution with S3 origin: matbakh-preview-cache"
echo "   Configure caching behaviors for preview content"
echo "   Set up custom domain if needed"

# Clean up
rm -f deployment.zip

echo "✅ Secure File Preview System deployed successfully!"
echo "📋 Function Name: $FUNCTION_NAME"
echo "🌍 Region: $REGION"
echo "🪣 Cache Bucket: matbakh-preview-cache"
echo "🗄️ Cache Table: preview-cache-metadata"
echo ""
echo "🔧 Next steps:"
echo "   1. Configure API Gateway endpoints"
echo "   2. Set up CloudFront distribution for caching"
echo "   3. Configure WAF rules if needed"
echo "   4. Test with sample files"
echo "   5. Monitor performance and adjust memory/timeout as needed"