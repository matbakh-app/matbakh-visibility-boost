#!/bin/bash

# Goal-Specific Recommendations Lambda Deployment Script
# This script builds and deploys the Goal-Specific Recommendation System Lambda function

set -e

FUNCTION_NAME="goal-specific-recommendations"
REGION="eu-central-1"
RUNTIME="nodejs20.x"
HANDLER="dist/index.handler"
TIMEOUT=300
MEMORY_SIZE=1024

echo "🚀 Starting deployment of Goal-Specific Recommendations Lambda..."

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found. Please run this script from the lambda function directory."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Run tests
echo "🧪 Running tests..."
npm test

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build

# Check if build was successful
if [ ! -f "dist/index.js" ]; then
    echo "❌ Build failed. dist/index.js not found."
    exit 1
fi

# Create deployment package
echo "📦 Creating deployment package..."
zip -r ${FUNCTION_NAME}.zip dist/ node_modules/ package.json

# Check if function exists
FUNCTION_EXISTS=$(aws lambda get-function --function-name $FUNCTION_NAME --region $REGION 2>/dev/null || echo "false")

if [ "$FUNCTION_EXISTS" = "false" ]; then
    echo "🆕 Creating new Lambda function..."
    
    # Create IAM role for Lambda if it doesn't exist
    ROLE_NAME="${FUNCTION_NAME}-role"
    ROLE_ARN=$(aws iam get-role --role-name $ROLE_NAME --query 'Role.Arn' --output text 2>/dev/null || echo "")
    
    if [ -z "$ROLE_ARN" ]; then
        echo "🔐 Creating IAM role..."
        
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
            --role-name $ROLE_NAME \
            --assume-role-policy-document file://trust-policy.json \
            --region $REGION

        # Attach basic execution policy
        aws iam attach-role-policy \
            --role-name $ROLE_NAME \
            --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole \
            --region $REGION

        # Create and attach DynamoDB policy
        cat > dynamodb-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ],
      "Resource": [
        "arn:aws:dynamodb:${REGION}:*:table/recommendation-progress",
        "arn:aws:dynamodb:${REGION}:*:table/recommendation-progress/index/*"
      ]
    }
  ]
}
EOF

        aws iam put-role-policy \
            --role-name $ROLE_NAME \
            --policy-name DynamoDBAccess \
            --policy-document file://dynamodb-policy.json \
            --region $REGION

        # Get role ARN
        ROLE_ARN=$(aws iam get-role --role-name $ROLE_NAME --query 'Role.Arn' --output text --region $REGION)
        
        # Wait for role to be available
        echo "⏳ Waiting for IAM role to be available..."
        sleep 10
        
        # Clean up policy files
        rm trust-policy.json dynamodb-policy.json
    fi

    # Create Lambda function
    aws lambda create-function \
        --function-name $FUNCTION_NAME \
        --runtime $RUNTIME \
        --role $ROLE_ARN \
        --handler $HANDLER \
        --zip-file fileb://${FUNCTION_NAME}.zip \
        --timeout $TIMEOUT \
        --memory-size $MEMORY_SIZE \
        --environment Variables='{
            "AWS_REGION":"'$REGION'",
            "RECOMMENDATION_PROGRESS_TABLE":"recommendation-progress"
        }' \
        --region $REGION

    echo "✅ Lambda function created successfully!"
else
    echo "🔄 Updating existing Lambda function..."
    
    # Update function code
    aws lambda update-function-code \
        --function-name $FUNCTION_NAME \
        --zip-file fileb://${FUNCTION_NAME}.zip \
        --region $REGION

    # Update function configuration
    aws lambda update-function-configuration \
        --function-name $FUNCTION_NAME \
        --runtime $RUNTIME \
        --handler $HANDLER \
        --timeout $TIMEOUT \
        --memory-size $MEMORY_SIZE \
        --environment Variables='{
            "AWS_REGION":"'$REGION'",
            "RECOMMENDATION_PROGRESS_TABLE":"recommendation-progress"
        }' \
        --region $REGION

    echo "✅ Lambda function updated successfully!"
fi

# Create DynamoDB table if it doesn't exist
echo "🗄️ Checking DynamoDB table..."
TABLE_EXISTS=$(aws dynamodb describe-table --table-name recommendation-progress --region $REGION 2>/dev/null || echo "false")

if [ "$TABLE_EXISTS" = "false" ]; then
    echo "🆕 Creating DynamoDB table..."
    
    aws dynamodb create-table \
        --table-name recommendation-progress \
        --attribute-definitions \
            AttributeName=recommendationId,AttributeType=S \
            AttributeName=businessId,AttributeType=S \
        --key-schema \
            AttributeName=recommendationId,KeyType=HASH \
            AttributeName=businessId,KeyType=RANGE \
        --global-secondary-indexes \
            IndexName=BusinessIdIndex,KeySchema=[{AttributeName=businessId,KeyType=HASH}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5} \
        --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
        --region $REGION

    echo "⏳ Waiting for table to be active..."
    aws dynamodb wait table-exists --table-name recommendation-progress --region $REGION
    echo "✅ DynamoDB table created successfully!"
else
    echo "✅ DynamoDB table already exists!"
fi

# Test the function
echo "🧪 Testing Lambda function..."
TEST_PAYLOAD='{
  "httpMethod": "POST",
  "path": "/recommendations",
  "headers": {"Content-Type": "application/json"},
  "queryStringParameters": null,
  "body": "{\"businessId\":\"test-business-123\",\"businessProfile\":{\"name\":\"Test Restaurant\",\"category\":\"Italian Restaurant\",\"location\":{\"address\":\"123 Test Street\",\"coordinates\":{\"lat\":52.52,\"lng\":13.405}},\"size\":\"small\"},\"objectives\":[\"increase_visibility\"],\"primaryObjective\":\"increase_visibility\",\"constraints\":{\"budget\":{\"amount\":2000,\"currency\":\"EUR\",\"timeframe\":\"3 months\"},\"resources\":[\"social_media_manager\"],\"limitations\":[]},\"currentChallenges\":[\"low_visibility\"]}",
  "requestContext": {
    "requestId": "test-123",
    "identity": {"sourceIp": "127.0.0.1", "userAgent": "test"}
  }
}'

INVOKE_RESULT=$(aws lambda invoke \
    --function-name $FUNCTION_NAME \
    --payload "$TEST_PAYLOAD" \
    --region $REGION \
    response.json)

# Check if invocation was successful
if [ $? -eq 0 ]; then
    RESPONSE_CODE=$(cat response.json | jq -r '.statusCode // empty')
    if [ "$RESPONSE_CODE" = "200" ]; then
        echo "✅ Lambda function test successful!"
        echo "📊 Response preview:"
        cat response.json | jq -r '.body' | jq '.summary'
    else
        echo "⚠️ Lambda function returned status code: $RESPONSE_CODE"
        cat response.json | jq -r '.body' | jq '.'
    fi
else
    echo "❌ Lambda function test failed!"
    cat response.json
fi

# Clean up
rm ${FUNCTION_NAME}.zip
rm -f response.json

# Get function info
echo "📋 Function Information:"
aws lambda get-function --function-name $FUNCTION_NAME --region $REGION --query 'Configuration.[FunctionName,Runtime,Handler,LastModified,State]' --output table

echo "🎉 Deployment completed successfully!"
echo ""
echo "📝 Next steps:"
echo "1. Configure API Gateway to route requests to this Lambda function"
echo "2. Set up appropriate IAM permissions for calling applications"
echo "3. Monitor CloudWatch logs for any issues"
echo "4. Test the endpoints with real data"
echo ""
echo "🔗 Useful commands:"
echo "  View logs: aws logs tail /aws/lambda/$FUNCTION_NAME --follow --region $REGION"
echo "  Update function: ./deploy.sh"
echo "  Delete function: aws lambda delete-function --function-name $FUNCTION_NAME --region $REGION"