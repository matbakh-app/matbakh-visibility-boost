#!/bin/bash

# Prompt Quality Assurance System Deployment Script
# This script deploys the comprehensive prompt quality assurance system

set -e

echo "🚀 Starting Prompt Quality Assurance System Deployment..."

# Configuration
FUNCTION_NAME="prompt-quality-assurance"
REGION="eu-central-1"
RUNTIME="nodejs20.x"
HANDLER="index.handler"
TIMEOUT=300
MEMORY_SIZE=1024

# DynamoDB Table Configuration
TABLE_NAME="prompt-quality-assurance"
CLOUDWATCH_NAMESPACE="PromptQualityAssurance"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if AWS CLI is installed and configured
check_aws_cli() {
    print_status "Checking AWS CLI configuration..."
    
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed. Please install it first."
        exit 1
    fi
    
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS CLI is not configured. Please run 'aws configure' first."
        exit 1
    fi
    
    print_success "AWS CLI is configured"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    if [ ! -f "package.json" ]; then
        print_error "package.json not found. Make sure you're in the correct directory."
        exit 1
    fi
    
    npm install
    print_success "Dependencies installed"
}

# Run tests
run_tests() {
    print_status "Running tests..."
    
    npm test
    
    if [ $? -eq 0 ]; then
        print_success "All tests passed"
    else
        print_error "Tests failed. Please fix the issues before deploying."
        exit 1
    fi
}

# Build the project
build_project() {
    print_status "Building TypeScript project..."
    
    npm run build
    
    if [ $? -eq 0 ]; then
        print_success "Build completed successfully"
    else
        print_error "Build failed"
        exit 1
    fi
}

# Create DynamoDB table if it doesn't exist
create_dynamodb_table() {
    print_status "Checking if DynamoDB table exists..."
    
    if aws dynamodb describe-table --table-name "$TABLE_NAME" --region "$REGION" &> /dev/null; then
        print_success "DynamoDB table '$TABLE_NAME' already exists"
    else
        print_status "Creating DynamoDB table '$TABLE_NAME'..."
        
        aws dynamodb create-table \
            --table-name "$TABLE_NAME" \
            --attribute-definitions \
                AttributeName=id,AttributeType=S \
                AttributeName=templateId,AttributeType=S \
                AttributeName=timestamp,AttributeType=S \
                AttributeName=entityType,AttributeType=S \
            --key-schema \
                AttributeName=id,KeyType=HASH \
            --global-secondary-indexes \
                IndexName=TemplateIdIndex,KeySchema=[{AttributeName=templateId,KeyType=HASH},{AttributeName=timestamp,KeyType=RANGE}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5} \
                IndexName=EntityTypeIndex,KeySchema=[{AttributeName=entityType,KeyType=HASH},{AttributeName=timestamp,KeyType=RANGE}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5} \
            --provisioned-throughput \
                ReadCapacityUnits=10,WriteCapacityUnits=10 \
            --region "$REGION"
        
        print_status "Waiting for table to become active..."
        aws dynamodb wait table-exists --table-name "$TABLE_NAME" --region "$REGION"
        print_success "DynamoDB table created successfully"
    fi
}

# Create IAM role for Lambda function
create_iam_role() {
    local role_name="${FUNCTION_NAME}-role"
    
    print_status "Checking if IAM role exists..."
    
    if aws iam get-role --role-name "$role_name" &> /dev/null; then
        print_success "IAM role '$role_name' already exists"
        echo "$role_name"
        return
    fi
    
    print_status "Creating IAM role '$role_name'..."
    
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
        --role-name "$role_name" \
        --assume-role-policy-document file://trust-policy.json \
        --region "$REGION"
    
    # Create and attach policy
    cat > lambda-policy.json << EOF
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
                "dynamodb:Query",
                "dynamodb:Scan",
                "dynamodb:UpdateItem",
                "dynamodb:DeleteItem"
            ],
            "Resource": [
                "arn:aws:dynamodb:${REGION}:*:table/${TABLE_NAME}",
                "arn:aws:dynamodb:${REGION}:*:table/${TABLE_NAME}/index/*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "bedrock:InvokeModel"
            ],
            "Resource": "arn:aws:bedrock:${REGION}::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0"
        },
        {
            "Effect": "Allow",
            "Action": [
                "cloudwatch:PutMetricData"
            ],
            "Resource": "*"
        }
    ]
}
EOF
    
    aws iam put-role-policy \
        --role-name "$role_name" \
        --policy-name "${role_name}-policy" \
        --policy-document file://lambda-policy.json
    
    # Clean up temporary files
    rm trust-policy.json lambda-policy.json
    
    print_success "IAM role created successfully"
    echo "$role_name"
}

# Package Lambda function
package_lambda() {
    print_status "Packaging Lambda function..."
    
    # Create deployment package
    rm -f function.zip
    
    # Include built JavaScript files and node_modules
    zip -r function.zip dist/ node_modules/ package.json
    
    print_success "Lambda function packaged"
}

# Deploy Lambda function
deploy_lambda() {
    local role_name=$1
    local account_id=$(aws sts get-caller-identity --query Account --output text)
    local role_arn="arn:aws:iam::${account_id}:role/${role_name}"
    
    print_status "Deploying Lambda function..."
    
    # Check if function exists
    if aws lambda get-function --function-name "$FUNCTION_NAME" --region "$REGION" &> /dev/null; then
        print_status "Updating existing Lambda function..."
        
        aws lambda update-function-code \
            --function-name "$FUNCTION_NAME" \
            --zip-file fileb://function.zip \
            --region "$REGION"
        
        aws lambda update-function-configuration \
            --function-name "$FUNCTION_NAME" \
            --runtime "$RUNTIME" \
            --handler "$HANDLER" \
            --timeout "$TIMEOUT" \
            --memory-size "$MEMORY_SIZE" \
            --environment Variables="{DYNAMO_TABLE_NAME=${TABLE_NAME},AWS_REGION=${REGION},CLOUDWATCH_NAMESPACE=${CLOUDWATCH_NAMESPACE}}" \
            --region "$REGION"
    else
        print_status "Creating new Lambda function..."
        
        aws lambda create-function \
            --function-name "$FUNCTION_NAME" \
            --runtime "$RUNTIME" \
            --role "$role_arn" \
            --handler "$HANDLER" \
            --zip-file fileb://function.zip \
            --timeout "$TIMEOUT" \
            --memory-size "$MEMORY_SIZE" \
            --environment Variables="{DYNAMO_TABLE_NAME=${TABLE_NAME},AWS_REGION=${REGION},CLOUDWATCH_NAMESPACE=${CLOUDWATCH_NAMESPACE}}" \
            --region "$REGION"
    fi
    
    print_success "Lambda function deployed successfully"
}

# Create API Gateway (optional)
create_api_gateway() {
    print_status "Creating API Gateway..."
    
    local api_name="${FUNCTION_NAME}-api"
    
    # Check if API already exists
    local api_id=$(aws apigateway get-rest-apis --region "$REGION" --query "items[?name=='${api_name}'].id" --output text)
    
    if [ -n "$api_id" ] && [ "$api_id" != "None" ]; then
        print_success "API Gateway '$api_name' already exists with ID: $api_id"
    else
        print_status "Creating new API Gateway..."
        
        api_id=$(aws apigateway create-rest-api \
            --name "$api_name" \
            --description "API for Prompt Quality Assurance System" \
            --region "$REGION" \
            --query 'id' \
            --output text)
        
        print_success "API Gateway created with ID: $api_id"
    fi
    
    # Get the root resource ID
    local root_id=$(aws apigateway get-resources \
        --rest-api-id "$api_id" \
        --region "$REGION" \
        --query 'items[?path==`/`].id' \
        --output text)
    
    # Create a proxy resource
    local resource_id=$(aws apigateway create-resource \
        --rest-api-id "$api_id" \
        --parent-id "$root_id" \
        --path-part '{proxy+}' \
        --region "$REGION" \
        --query 'id' \
        --output text 2>/dev/null || echo "")
    
    if [ -z "$resource_id" ]; then
        # Resource might already exist, get its ID
        resource_id=$(aws apigateway get-resources \
            --rest-api-id "$api_id" \
            --region "$REGION" \
            --query 'items[?pathPart==`{proxy+}`].id' \
            --output text)
    fi
    
    # Create ANY method
    aws apigateway put-method \
        --rest-api-id "$api_id" \
        --resource-id "$resource_id" \
        --http-method ANY \
        --authorization-type NONE \
        --region "$REGION" &>/dev/null || true
    
    # Set up Lambda integration
    local account_id=$(aws sts get-caller-identity --query Account --output text)
    local lambda_arn="arn:aws:lambda:${REGION}:${account_id}:function:${FUNCTION_NAME}"
    
    aws apigateway put-integration \
        --rest-api-id "$api_id" \
        --resource-id "$resource_id" \
        --http-method ANY \
        --type AWS_PROXY \
        --integration-http-method POST \
        --uri "arn:aws:apigateway:${REGION}:lambda:path/2015-03-31/functions/${lambda_arn}/invocations" \
        --region "$REGION" &>/dev/null || true
    
    # Add Lambda permission for API Gateway
    aws lambda add-permission \
        --function-name "$FUNCTION_NAME" \
        --statement-id "api-gateway-invoke" \
        --action lambda:InvokeFunction \
        --principal apigateway.amazonaws.com \
        --source-arn "arn:aws:execute-api:${REGION}:${account_id}:${api_id}/*/*" \
        --region "$REGION" &>/dev/null || true
    
    # Deploy the API
    aws apigateway create-deployment \
        --rest-api-id "$api_id" \
        --stage-name prod \
        --region "$REGION" &>/dev/null || true
    
    local api_url="https://${api_id}.execute-api.${REGION}.amazonaws.com/prod"
    print_success "API Gateway deployed. URL: $api_url"
}

# Test the deployment
test_deployment() {
    print_status "Testing deployment..."
    
    # Test Lambda function directly
    local test_payload='{"httpMethod":"GET","path":"/health","body":null,"queryStringParameters":null}'
    
    local response=$(aws lambda invoke \
        --function-name "$FUNCTION_NAME" \
        --payload "$test_payload" \
        --region "$REGION" \
        response.json)
    
    if [ $? -eq 0 ]; then
        local status_code=$(cat response.json | grep -o '"statusCode":[0-9]*' | cut -d':' -f2)
        if [ "$status_code" = "200" ]; then
            print_success "Lambda function test passed"
        else
            print_warning "Lambda function returned status code: $status_code"
        fi
    else
        print_error "Lambda function test failed"
    fi
    
    rm -f response.json
}

# Cleanup temporary files
cleanup() {
    print_status "Cleaning up temporary files..."
    rm -f function.zip
    print_success "Cleanup completed"
}

# Main deployment process
main() {
    print_status "Starting deployment process..."
    
    check_aws_cli
    install_dependencies
    run_tests
    build_project
    create_dynamodb_table
    
    local role_name=$(create_iam_role)
    
    # Wait a bit for IAM role to propagate
    print_status "Waiting for IAM role to propagate..."
    sleep 10
    
    package_lambda
    deploy_lambda "$role_name"
    create_api_gateway
    test_deployment
    cleanup
    
    print_success "🎉 Prompt Quality Assurance System deployed successfully!"
    
    echo ""
    echo "📋 Deployment Summary:"
    echo "  • Lambda Function: $FUNCTION_NAME"
    echo "  • DynamoDB Table: $TABLE_NAME"
    echo "  • IAM Role: $role_name"
    echo "  • Region: $REGION"
    echo ""
    echo "🔧 Next Steps:"
    echo "  1. Test the API endpoints using the provided URL"
    echo "  2. Monitor CloudWatch logs for any issues"
    echo "  3. Set up CloudWatch alarms for monitoring"
    echo "  4. Configure additional security settings as needed"
    echo ""
    echo "📚 API Endpoints:"
    echo "  • POST /audit/create - Create audit record"
    echo "  • GET /audit/trail - Get audit trail"
    echo "  • POST /quality/analyze - Analyze quality"
    echo "  • POST /recommendations/generate - Generate recommendations"
    echo "  • POST /testing/run-suite - Run test suite"
    echo "  • GET /health - Health check"
}

# Run main function
main "$@"