#!/bin/bash

# Prompt Template Lifecycle Management System Deployment Script
# This script deploys the comprehensive template lifecycle management system

set -e

echo "🚀 Starting Prompt Template Lifecycle Management System deployment..."

# Configuration
FUNCTION_NAME="prompt-template-lifecycle"
REGION="${AWS_REGION:-eu-central-1}"
RUNTIME="nodejs20.x"
HANDLER="dist/index.handler"
TIMEOUT=300
MEMORY_SIZE=1024

# Environment variables
TEMPLATES_TABLE="${TEMPLATES_TABLE:-prompt-templates}"
VERSIONS_TABLE="${VERSIONS_TABLE:-template-versions}"
EXECUTIONS_TABLE="${EXECUTIONS_TABLE:-template-executions}"
AB_TESTS_TABLE="${AB_TESTS_TABLE:-ab-tests}"

echo "📋 Configuration:"
echo "  Function: $FUNCTION_NAME"
echo "  Region: $REGION"
echo "  Runtime: $RUNTIME"
echo "  Tables: $TEMPLATES_TABLE, $VERSIONS_TABLE, $EXECUTIONS_TABLE, $AB_TESTS_TABLE"

# Check if AWS CLI is configured
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "❌ AWS CLI not configured. Please run 'aws configure' first."
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

# Create deployment package
echo "📦 Creating deployment package..."
zip -r deployment.zip dist/ node_modules/ package.json

# Check if Lambda function exists
if aws lambda get-function --function-name "$FUNCTION_NAME" --region "$REGION" > /dev/null 2>&1; then
    echo "🔄 Updating existing Lambda function..."
    aws lambda update-function-code \
        --function-name "$FUNCTION_NAME" \
        --zip-file fileb://deployment.zip \
        --region "$REGION"
    
    aws lambda update-function-configuration \
        --function-name "$FUNCTION_NAME" \
        --runtime "$RUNTIME" \
        --handler "$HANDLER" \
        --timeout "$TIMEOUT" \
        --memory-size "$MEMORY_SIZE" \
        --environment Variables="{
            TEMPLATES_TABLE=$TEMPLATES_TABLE,
            VERSIONS_TABLE=$VERSIONS_TABLE,
            EXECUTIONS_TABLE=$EXECUTIONS_TABLE,
            AB_TESTS_TABLE=$AB_TESTS_TABLE,
            AWS_REGION=$REGION
        }" \
        --region "$REGION"
else
    echo "🆕 Creating new Lambda function..."
    
    # Create execution role if it doesn't exist
    ROLE_NAME="prompt-template-lifecycle-role"
    ROLE_ARN=$(aws iam get-role --role-name "$ROLE_NAME" --query 'Role.Arn' --output text 2>/dev/null || echo "")
    
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

        # Create execution policy
        cat > execution-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents"
            ],
            "Resource": "arn:aws:logs:*:*:*"
        },
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
                "arn:aws:dynamodb:$REGION:*:table/$TEMPLATES_TABLE",
                "arn:aws:dynamodb:$REGION:*:table/$TEMPLATES_TABLE/index/*",
                "arn:aws:dynamodb:$REGION:*:table/$VERSIONS_TABLE",
                "arn:aws:dynamodb:$REGION:*:table/$VERSIONS_TABLE/index/*",
                "arn:aws:dynamodb:$REGION:*:table/$EXECUTIONS_TABLE",
                "arn:aws:dynamodb:$REGION:*:table/$EXECUTIONS_TABLE/index/*",
                "arn:aws:dynamodb:$REGION:*:table/$AB_TESTS_TABLE",
                "arn:aws:dynamodb:$REGION:*:table/$AB_TESTS_TABLE/index/*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "kms:Decrypt",
                "kms:GenerateDataKey"
            ],
            "Resource": "*"
        }
    ]
}
EOF

        aws iam create-role \
            --role-name "$ROLE_NAME" \
            --assume-role-policy-document file://trust-policy.json \
            --region "$REGION"
        
        aws iam put-role-policy \
            --role-name "$ROLE_NAME" \
            --policy-name "prompt-template-lifecycle-policy" \
            --policy-document file://execution-policy.json \
            --region "$REGION"
        
        ROLE_ARN="arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):role/$ROLE_NAME"
        
        # Wait for role to be available
        echo "⏳ Waiting for IAM role to be available..."
        sleep 10
        
        # Cleanup policy files
        rm -f trust-policy.json execution-policy.json
    fi
    
    aws lambda create-function \
        --function-name "$FUNCTION_NAME" \
        --runtime "$RUNTIME" \
        --role "$ROLE_ARN" \
        --handler "$HANDLER" \
        --zip-file fileb://deployment.zip \
        --timeout "$TIMEOUT" \
        --memory-size "$MEMORY_SIZE" \
        --environment Variables="{
            TEMPLATES_TABLE=$TEMPLATES_TABLE,
            VERSIONS_TABLE=$VERSIONS_TABLE,
            EXECUTIONS_TABLE=$EXECUTIONS_TABLE,
            AB_TESTS_TABLE=$AB_TESTS_TABLE,
            AWS_REGION=$REGION
        }" \
        --region "$REGION"
fi

# Create DynamoDB tables if they don't exist
echo "🗄️ Setting up DynamoDB tables..."

# Templates table
if ! aws dynamodb describe-table --table-name "$TEMPLATES_TABLE" --region "$REGION" > /dev/null 2>&1; then
    echo "📊 Creating templates table..."
    aws dynamodb create-table \
        --table-name "$TEMPLATES_TABLE" \
        --attribute-definitions \
            AttributeName=id,AttributeType=S \
            AttributeName=category,AttributeType=S \
            AttributeName=provider,AttributeType=S \
        --key-schema \
            AttributeName=id,KeyType=HASH \
        --global-secondary-indexes \
            IndexName=category-provider-index,KeySchema=[{AttributeName=category,KeyType=HASH},{AttributeName=provider,KeyType=RANGE}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5} \
        --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
        --region "$REGION"
fi

# Versions table
if ! aws dynamodb describe-table --table-name "$VERSIONS_TABLE" --region "$REGION" > /dev/null 2>&1; then
    echo "📊 Creating versions table..."
    aws dynamodb create-table \
        --table-name "$VERSIONS_TABLE" \
        --attribute-definitions \
            AttributeName=id,AttributeType=S \
            AttributeName=templateId,AttributeType=S \
            AttributeName=version,AttributeType=S \
            AttributeName=status,AttributeType=S \
            AttributeName=environment,AttributeType=S \
        --key-schema \
            AttributeName=id,KeyType=HASH \
        --global-secondary-indexes \
            IndexName=templateId-version-index,KeySchema=[{AttributeName=templateId,KeyType=HASH},{AttributeName=version,KeyType=RANGE}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5} \
            IndexName=status-index,KeySchema=[{AttributeName=status,KeyType=HASH}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5} \
            IndexName=environment-status-index,KeySchema=[{AttributeName=environment,KeyType=HASH},{AttributeName=status,KeyType=RANGE}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5} \
        --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
        --region "$REGION"
fi

# Executions table
if ! aws dynamodb describe-table --table-name "$EXECUTIONS_TABLE" --region "$REGION" > /dev/null 2>&1; then
    echo "📊 Creating executions table..."
    aws dynamodb create-table \
        --table-name "$EXECUTIONS_TABLE" \
        --attribute-definitions \
            AttributeName=id,AttributeType=S \
            AttributeName=templateVersionId,AttributeType=S \
            AttributeName=timestamp,AttributeType=S \
            AttributeName=status,AttributeType=S \
        --key-schema \
            AttributeName=id,KeyType=HASH \
        --global-secondary-indexes \
            IndexName=templateVersionId-timestamp-index,KeySchema=[{AttributeName=templateVersionId,KeyType=HASH},{AttributeName=timestamp,KeyType=RANGE}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=10,WriteCapacityUnits=10} \
            IndexName=templateVersionId-status-index,KeySchema=[{AttributeName=templateVersionId,KeyType=HASH},{AttributeName=status,KeyType=RANGE}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5} \
        --provisioned-throughput ReadCapacityUnits=10,WriteCapacityUnits=10 \
        --region "$REGION"
fi

# A/B Tests table
if ! aws dynamodb describe-table --table-name "$AB_TESTS_TABLE" --region "$REGION" > /dev/null 2>&1; then
    echo "📊 Creating A/B tests table..."
    aws dynamodb create-table \
        --table-name "$AB_TESTS_TABLE" \
        --attribute-definitions \
            AttributeName=id,AttributeType=S \
            AttributeName=status,AttributeType=S \
        --key-schema \
            AttributeName=id,KeyType=HASH \
        --global-secondary-indexes \
            IndexName=status-index,KeySchema=[{AttributeName=status,KeyType=HASH}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5} \
        --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
        --region "$REGION"
fi

# Wait for tables to be active
echo "⏳ Waiting for tables to be active..."
aws dynamodb wait table-exists --table-name "$TEMPLATES_TABLE" --region "$REGION"
aws dynamodb wait table-exists --table-name "$VERSIONS_TABLE" --region "$REGION"
aws dynamodb wait table-exists --table-name "$EXECUTIONS_TABLE" --region "$REGION"
aws dynamodb wait table-exists --table-name "$AB_TESTS_TABLE" --region "$REGION"

# Create API Gateway (optional)
if [ "${CREATE_API_GATEWAY:-false}" = "true" ]; then
    echo "🌐 Setting up API Gateway..."
    
    API_NAME="prompt-template-lifecycle-api"
    
    # Check if API exists
    API_ID=$(aws apigateway get-rest-apis --query "items[?name=='$API_NAME'].id" --output text --region "$REGION")
    
    if [ -z "$API_ID" ] || [ "$API_ID" = "None" ]; then
        echo "🆕 Creating API Gateway..."
        API_ID=$(aws apigateway create-rest-api \
            --name "$API_NAME" \
            --description "Prompt Template Lifecycle Management API" \
            --region "$REGION" \
            --query 'id' --output text)
    fi
    
    echo "🔗 API Gateway ID: $API_ID"
    
    # Add Lambda permission for API Gateway
    aws lambda add-permission \
        --function-name "$FUNCTION_NAME" \
        --statement-id "api-gateway-invoke" \
        --action "lambda:InvokeFunction" \
        --principal "apigateway.amazonaws.com" \
        --source-arn "arn:aws:execute-api:$REGION:$(aws sts get-caller-identity --query Account --output text):$API_ID/*/*" \
        --region "$REGION" 2>/dev/null || true
fi

# Cleanup
rm -f deployment.zip

echo "✅ Deployment completed successfully!"
echo ""
echo "📋 Summary:"
echo "  Function Name: $FUNCTION_NAME"
echo "  Region: $REGION"
echo "  Tables: $TEMPLATES_TABLE, $VERSIONS_TABLE, $EXECUTIONS_TABLE, $AB_TESTS_TABLE"
if [ "${CREATE_API_GATEWAY:-false}" = "true" ]; then
    echo "  API Gateway: $API_ID"
fi
echo ""
echo "🔧 Next steps:"
echo "  1. Test the function with sample requests"
echo "  2. Set up monitoring and alerting"
echo "  3. Configure API Gateway endpoints if needed"
echo "  4. Set up CI/CD pipeline for automated deployments"
echo ""
echo "📚 Documentation: See README.md for usage examples and API reference"