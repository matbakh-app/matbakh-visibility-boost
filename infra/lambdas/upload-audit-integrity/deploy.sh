#!/bin/bash

# Deploy Upload Audit & Integrity System Lambda
# This script builds and deploys the upload audit and integrity verification system

set -e

FUNCTION_NAME="upload-audit-integrity"
REGION="eu-central-1"
RUNTIME="nodejs20.x"
HANDLER="index.handler"
TIMEOUT=300
MEMORY_SIZE=1024

echo "🚀 Deploying Upload Audit & Integrity System..."

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
echo "📦 Adding node_modules..."
zip -r deployment.zip node_modules -x "node_modules/typescript/*" "node_modules/@types/*" "node_modules/jest/*"

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
    ROLE_ARN=$(aws iam get-role --role-name lambda-execution-role --query 'Role.Arn' --output text 2>/dev/null || echo "")
    
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
            --role-name lambda-execution-role \
            --assume-role-policy-document file://trust-policy.json \
            --region $REGION

        # Attach basic execution policy
        aws iam attach-role-policy \
            --role-name lambda-execution-role \
            --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole \
            --region $REGION

        # Attach VPC execution policy (if needed)
        aws iam attach-role-policy \
            --role-name lambda-execution-role \
            --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole \
            --region $REGION

        # Create custom policy for S3, DynamoDB, SQS, and Secrets Manager
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
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:UpdateItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ],
      "Resource": [
        "arn:aws:dynamodb:${REGION}:*:table/upload-audit-trail",
        "arn:aws:dynamodb:${REGION}:*:table/upload-audit-trail/index/*",
        "arn:aws:dynamodb:${REGION}:*:table/upload-lifecycle-events",
        "arn:aws:dynamodb:${REGION}:*:table/upload-lifecycle-events/index/*",
        "arn:aws:dynamodb:${REGION}:*:table/upload-reupload-workflows",
        "arn:aws:dynamodb:${REGION}:*:table/upload-reupload-workflows/index/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "sqs:SendMessage",
        "sqs:GetQueueAttributes"
      ],
      "Resource": [
        "arn:aws:sqs:${REGION}:*:re-upload-queue"
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
            --role-name lambda-execution-role \
            --policy-name upload-audit-integrity-policy \
            --policy-document file://custom-policy.json \
            --region $REGION

        # Wait for role to be available
        echo "⏳ Waiting for IAM role to be available..."
        sleep 10

        ROLE_ARN=$(aws iam get-role --role-name lambda-execution-role --query 'Role.Arn' --output text)
        
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
            "AUDIT_TABLE_NAME":"upload-audit-trail",
            "LIFECYCLE_TABLE_NAME":"upload-lifecycle-events",
            "WORKFLOW_TABLE_NAME":"upload-reupload-workflows"
        }'
fi

# Create DynamoDB tables if they don't exist
echo "🗄️ Creating DynamoDB tables..."

# Upload Audit Trail table
aws dynamodb create-table \
    --table-name upload-audit-trail \
    --attribute-definitions \
        AttributeName=PK,AttributeType=S \
        AttributeName=SK,AttributeType=S \
        AttributeName=GSI1PK,AttributeType=S \
        AttributeName=GSI1SK,AttributeType=S \
        AttributeName=GSI2PK,AttributeType=S \
        AttributeName=GSI2SK,AttributeType=S \
    --key-schema \
        AttributeName=PK,KeyType=HASH \
        AttributeName=SK,KeyType=RANGE \
    --global-secondary-indexes \
        IndexName=GSI1,KeySchema=[{AttributeName=GSI1PK,KeyType=HASH},{AttributeName=GSI1SK,KeyType=RANGE}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5} \
        IndexName=GSI2,KeySchema=[{AttributeName=GSI2PK,KeyType=HASH},{AttributeName=GSI2SK,KeyType=RANGE}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5} \
    --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
    --region $REGION \
    --no-cli-pager 2>/dev/null || echo "Table upload-audit-trail already exists"

# Upload Lifecycle Events table
aws dynamodb create-table \
    --table-name upload-lifecycle-events \
    --attribute-definitions \
        AttributeName=PK,AttributeType=S \
        AttributeName=SK,AttributeType=S \
        AttributeName=GSI1PK,AttributeType=S \
        AttributeName=GSI1SK,AttributeType=S \
    --key-schema \
        AttributeName=PK,KeyType=HASH \
        AttributeName=SK,KeyType=RANGE \
    --global-secondary-indexes \
        IndexName=GSI1,KeySchema=[{AttributeName=GSI1PK,KeyType=HASH},{AttributeName=GSI1SK,KeyType=RANGE}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5} \
    --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
    --region $REGION \
    --no-cli-pager 2>/dev/null || echo "Table upload-lifecycle-events already exists"

# Re-upload Workflows table
aws dynamodb create-table \
    --table-name upload-reupload-workflows \
    --attribute-definitions \
        AttributeName=PK,AttributeType=S \
        AttributeName=SK,AttributeType=S \
        AttributeName=GSI1PK,AttributeType=S \
        AttributeName=GSI1SK,AttributeType=S \
    --key-schema \
        AttributeName=PK,KeyType=HASH \
        AttributeName=SK,KeyType=RANGE \
    --global-secondary-indexes \
        IndexName=GSI1,KeySchema=[{AttributeName=GSI1PK,KeyType=HASH},{AttributeName=GSI1SK,KeyType=RANGE}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5} \
    --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
    --region $REGION \
    --no-cli-pager 2>/dev/null || echo "Table upload-reupload-workflows already exists"

# Create SQS queue for re-upload workflows
echo "📬 Creating SQS queue..."
aws sqs create-queue \
    --queue-name re-upload-queue \
    --attributes VisibilityTimeoutSeconds=900,MessageRetentionPeriod=1209600 \
    --region $REGION \
    --no-cli-pager 2>/dev/null || echo "Queue re-upload-queue already exists"

# Add S3 event trigger (this would need to be configured per bucket)
echo "🔗 S3 event triggers need to be configured manually for each bucket"

# Clean up
rm -f deployment.zip

echo "✅ Upload Audit & Integrity System deployed successfully!"
echo "📋 Function Name: $FUNCTION_NAME"
echo "🌍 Region: $REGION"
echo "🔧 Next steps:"
echo "   1. Configure S3 event triggers for upload buckets"
echo "   2. Set up API Gateway endpoints if needed"
echo "   3. Configure monitoring and alerting"
echo "   4. Test with sample uploads"