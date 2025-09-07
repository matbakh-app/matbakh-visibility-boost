#!/bin/bash

# Competitive Benchmarking Lambda Deployment Script
# Deploys the competitive benchmarking service with all required infrastructure

set -e

echo "🚀 Deploying Competitive Benchmarking Lambda"
echo "============================================="

# Configuration
FUNCTION_NAME="competitive-benchmarking"
REGION="${AWS_REGION:-eu-central-1}"
RUNTIME="nodejs20.x"
TIMEOUT=300
MEMORY_SIZE=1024
ARCHITECTURE="x86_64"

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

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed"
        exit 1
    fi
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    
    # Check jq
    if ! command -v jq &> /dev/null; then
        print_error "jq is not installed"
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS credentials not configured"
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    if [ ! -f "package.json" ]; then
        print_error "package.json not found. Run from the lambda directory."
        exit 1
    fi
    
    npm ci --production
    print_success "Dependencies installed"
}

# Build TypeScript
build_typescript() {
    print_status "Building TypeScript..."
    
    # Install dev dependencies for build
    npm install --only=dev
    
    # Build
    npm run build
    
    if [ ! -d "dist" ]; then
        print_error "Build failed - dist directory not found"
        exit 1
    fi
    
    print_success "TypeScript build completed"
}

# Run tests
run_tests() {
    print_status "Running tests..."
    
    npm test
    
    print_success "Tests passed"
}

# Create deployment package
create_deployment_package() {
    print_status "Creating deployment package..."
    
    # Clean previous package
    rm -f competitive-benchmarking.zip
    
    # Create package with built code and production dependencies
    zip -r competitive-benchmarking.zip dist/ node_modules/ package.json
    
    # Check package size
    PACKAGE_SIZE=$(stat -f%z competitive-benchmarking.zip 2>/dev/null || stat -c%s competitive-benchmarking.zip)
    PACKAGE_SIZE_MB=$((PACKAGE_SIZE / 1024 / 1024))
    
    print_status "Package size: ${PACKAGE_SIZE_MB}MB"
    
    if [ $PACKAGE_SIZE_MB -gt 50 ]; then
        print_warning "Package size is large (${PACKAGE_SIZE_MB}MB). Consider optimizing dependencies."
    fi
    
    print_success "Deployment package created"
}

# Create or update IAM role
create_iam_role() {
    print_status "Creating IAM role..."
    
    ROLE_NAME="${FUNCTION_NAME}-execution-role"
    
    # Trust policy for Lambda
    TRUST_POLICY='{
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
    }'
    
    # Check if role exists
    if aws iam get-role --role-name "$ROLE_NAME" &> /dev/null; then
        print_status "IAM role already exists: $ROLE_NAME"
    else
        # Create role
        aws iam create-role \
            --role-name "$ROLE_NAME" \
            --assume-role-policy-document "$TRUST_POLICY" \
            --description "Execution role for competitive benchmarking Lambda"
        
        print_success "IAM role created: $ROLE_NAME"
    fi
    
    # Attach basic Lambda execution policy
    aws iam attach-role-policy \
        --role-name "$ROLE_NAME" \
        --policy-arn "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
    
    # Create and attach custom policy
    POLICY_DOCUMENT='{
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "secretsmanager:GetSecretValue"
                ],
                "Resource": "*"
            },
            {
                "Effect": "Allow",
                "Action": [
                    "dynamodb:GetItem",
                    "dynamodb:PutItem",
                    "dynamodb:Query",
                    "dynamodb:Scan"
                ],
                "Resource": "*"
            },
            {
                "Effect": "Allow",
                "Action": [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                ],
                "Resource": "*"
            }
        ]
    }'
    
    POLICY_NAME="${FUNCTION_NAME}-policy"
    
    # Check if policy exists
    if aws iam get-policy --policy-arn "arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):policy/$POLICY_NAME" &> /dev/null; then
        print_status "IAM policy already exists: $POLICY_NAME"
    else
        # Create policy
        aws iam create-policy \
            --policy-name "$POLICY_NAME" \
            --policy-document "$POLICY_DOCUMENT" \
            --description "Policy for competitive benchmarking Lambda"
        
        print_success "IAM policy created: $POLICY_NAME"
    fi
    
    # Attach custom policy
    aws iam attach-role-policy \
        --role-name "$ROLE_NAME" \
        --policy-arn "arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):policy/$POLICY_NAME"
    
    # Wait for role to be ready
    print_status "Waiting for IAM role to be ready..."
    sleep 10
    
    print_success "IAM role configured"
}

# Create DynamoDB tables
create_dynamodb_tables() {
    print_status "Creating DynamoDB tables..."
    
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    
    # Results table
    RESULTS_TABLE="${FUNCTION_NAME}-results"
    if aws dynamodb describe-table --table-name "$RESULTS_TABLE" &> /dev/null; then
        print_status "Results table already exists: $RESULTS_TABLE"
    else
        aws dynamodb create-table \
            --table-name "$RESULTS_TABLE" \
            --attribute-definitions \
                AttributeName=requestId,AttributeType=S \
                AttributeName=businessId,AttributeType=S \
            --key-schema \
                AttributeName=requestId,KeyType=HASH \
            --global-secondary-indexes \
                IndexName=BusinessIdIndex,KeySchema=[{AttributeName=businessId,KeyType=HASH}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5} \
            --provisioned-throughput \
                ReadCapacityUnits=5,WriteCapacityUnits=5
        
        print_success "Results table created: $RESULTS_TABLE"
    fi
    
    # Cache table
    CACHE_TABLE="${FUNCTION_NAME}-cache"
    if aws dynamodb describe-table --table-name "$CACHE_TABLE" &> /dev/null; then
        print_status "Cache table already exists: $CACHE_TABLE"
    else
        aws dynamodb create-table \
            --table-name "$CACHE_TABLE" \
            --attribute-definitions \
                AttributeName=cacheKey,AttributeType=S \
            --key-schema \
                AttributeName=cacheKey,KeyType=HASH \
            --provisioned-throughput \
                ReadCapacityUnits=5,WriteCapacityUnits=5 \
            --time-to-live-specification \
                AttributeName=ttl,Enabled=true
        
        print_success "Cache table created: $CACHE_TABLE"
    fi
    
    # Wait for tables to be active
    print_status "Waiting for tables to be active..."
    aws dynamodb wait table-exists --table-name "$RESULTS_TABLE"
    aws dynamodb wait table-exists --table-name "$CACHE_TABLE"
    
    print_success "DynamoDB tables ready"
}

# Create Secrets Manager secret
create_secrets() {
    print_status "Creating Secrets Manager secret..."
    
    SECRET_NAME="${FUNCTION_NAME}-secrets"
    
    # Check if secret exists
    if aws secretsmanager describe-secret --secret-id "$SECRET_NAME" &> /dev/null; then
        print_status "Secret already exists: $SECRET_NAME"
    else
        # Create secret with placeholder values
        SECRET_VALUE='{
            "GOOGLE_MAPS_API_KEY": "your-google-maps-api-key-here"
        }'
        
        aws secretsmanager create-secret \
            --name "$SECRET_NAME" \
            --description "API keys and secrets for competitive benchmarking" \
            --secret-string "$SECRET_VALUE"
        
        print_success "Secret created: $SECRET_NAME"
        print_warning "Please update the secret with actual API keys using AWS Console or CLI"
    fi
}

# Deploy Lambda function
deploy_lambda() {
    print_status "Deploying Lambda function..."
    
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/${FUNCTION_NAME}-execution-role"
    SECRET_ARN="arn:aws:secretsmanager:${REGION}:${ACCOUNT_ID}:secret:${FUNCTION_NAME}-secrets"
    RESULTS_TABLE="${FUNCTION_NAME}-results"
    CACHE_TABLE="${FUNCTION_NAME}-cache"
    
    # Check if function exists
    if aws lambda get-function --function-name "$FUNCTION_NAME" &> /dev/null; then
        print_status "Updating existing Lambda function..."
        
        # Update function code
        aws lambda update-function-code \
            --function-name "$FUNCTION_NAME" \
            --zip-file fileb://competitive-benchmarking.zip
        
        # Update function configuration
        aws lambda update-function-configuration \
            --function-name "$FUNCTION_NAME" \
            --runtime "$RUNTIME" \
            --handler "dist/index.handler" \
            --timeout "$TIMEOUT" \
            --memory-size "$MEMORY_SIZE" \
            --environment Variables="{
                SECRETS_ARN=$SECRET_ARN,
                RESULTS_TABLE=$RESULTS_TABLE,
                CACHE_TABLE=$CACHE_TABLE,
                AWS_REGION=$REGION
            }"
        
        print_success "Lambda function updated"
    else
        print_status "Creating new Lambda function..."
        
        # Create function
        aws lambda create-function \
            --function-name "$FUNCTION_NAME" \
            --runtime "$RUNTIME" \
            --role "$ROLE_ARN" \
            --handler "dist/index.handler" \
            --zip-file fileb://competitive-benchmarking.zip \
            --timeout "$TIMEOUT" \
            --memory-size "$MEMORY_SIZE" \
            --architectures "$ARCHITECTURE" \
            --environment Variables="{
                SECRETS_ARN=$SECRET_ARN,
                RESULTS_TABLE=$RESULTS_TABLE,
                CACHE_TABLE=$CACHE_TABLE,
                AWS_REGION=$REGION
            }" \
            --description "Competitive benchmarking service for restaurant visibility analysis"
        
        print_success "Lambda function created"
    fi
    
    # Wait for function to be ready
    print_status "Waiting for function to be ready..."
    aws lambda wait function-updated --function-name "$FUNCTION_NAME"
    
    print_success "Lambda function deployed successfully"
}

# Create API Gateway (optional)
create_api_gateway() {
    print_status "Creating API Gateway..."
    
    API_NAME="${FUNCTION_NAME}-api"
    
    # Check if API exists
    API_ID=$(aws apigateway get-rest-apis --query "items[?name=='$API_NAME'].id" --output text)
    
    if [ -n "$API_ID" ] && [ "$API_ID" != "None" ]; then
        print_status "API Gateway already exists: $API_NAME (ID: $API_ID)"
    else
        # Create REST API
        API_ID=$(aws apigateway create-rest-api \
            --name "$API_NAME" \
            --description "API for competitive benchmarking service" \
            --query 'id' --output text)
        
        print_success "API Gateway created: $API_NAME (ID: $API_ID)"
    fi
    
    # Get root resource ID
    ROOT_RESOURCE_ID=$(aws apigateway get-resources \
        --rest-api-id "$API_ID" \
        --query 'items[?path==`/`].id' --output text)
    
    # Create resource
    RESOURCE_ID=$(aws apigateway create-resource \
        --rest-api-id "$API_ID" \
        --parent-id "$ROOT_RESOURCE_ID" \
        --path-part "competitive-benchmarking" \
        --query 'id' --output text 2>/dev/null || \
        aws apigateway get-resources \
            --rest-api-id "$API_ID" \
            --query 'items[?pathPart==`competitive-benchmarking`].id' --output text)
    
    # Create methods (GET and POST)
    for METHOD in GET POST; do
        # Check if method exists
        if aws apigateway get-method \
            --rest-api-id "$API_ID" \
            --resource-id "$RESOURCE_ID" \
            --http-method "$METHOD" &> /dev/null; then
            print_status "$METHOD method already exists"
        else
            # Create method
            aws apigateway put-method \
                --rest-api-id "$API_ID" \
                --resource-id "$RESOURCE_ID" \
                --http-method "$METHOD" \
                --authorization-type "NONE"
            
            # Create integration
            ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
            LAMBDA_URI="arn:aws:apigateway:${REGION}:lambda:path/2015-03-31/functions/arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:${FUNCTION_NAME}/invocations"
            
            aws apigateway put-integration \
                --rest-api-id "$API_ID" \
                --resource-id "$RESOURCE_ID" \
                --http-method "$METHOD" \
                --type "AWS_PROXY" \
                --integration-http-method "POST" \
                --uri "$LAMBDA_URI"
            
            print_success "$METHOD method created"
        fi
    done
    
    # Add Lambda permission for API Gateway
    aws lambda add-permission \
        --function-name "$FUNCTION_NAME" \
        --statement-id "api-gateway-invoke-${API_ID}" \
        --action "lambda:InvokeFunction" \
        --principal "apigateway.amazonaws.com" \
        --source-arn "arn:aws:execute-api:${REGION}:$(aws sts get-caller-identity --query Account --output text):${API_ID}/*" \
        2>/dev/null || print_status "Lambda permission already exists"
    
    # Deploy API
    DEPLOYMENT_ID=$(aws apigateway create-deployment \
        --rest-api-id "$API_ID" \
        --stage-name "prod" \
        --stage-description "Production stage" \
        --description "Deployment $(date)" \
        --query 'id' --output text)
    
    # Get API endpoint
    API_ENDPOINT="https://${API_ID}.execute-api.${REGION}.amazonaws.com/prod/competitive-benchmarking"
    
    print_success "API Gateway deployed"
    print_success "API Endpoint: $API_ENDPOINT"
}

# Test deployment
test_deployment() {
    print_status "Testing deployment..."
    
    # Test Lambda function directly
    TEST_EVENT='{
        "httpMethod": "GET",
        "path": "/health",
        "headers": {},
        "queryStringParameters": null,
        "body": null,
        "requestContext": {
            "requestId": "test-request",
            "identity": {
                "sourceIp": "127.0.0.1",
                "userAgent": "test-agent"
            }
        }
    }'
    
    RESPONSE=$(aws lambda invoke \
        --function-name "$FUNCTION_NAME" \
        --payload "$TEST_EVENT" \
        --output json \
        response.json)
    
    if [ $? -eq 0 ]; then
        STATUS_CODE=$(echo "$RESPONSE" | jq -r '.StatusCode')
        if [ "$STATUS_CODE" = "200" ]; then
            print_success "Lambda function test passed"
        else
            print_error "Lambda function test failed with status code: $STATUS_CODE"
            cat response.json
        fi
    else
        print_error "Lambda function invocation failed"
    fi
    
    # Clean up test response
    rm -f response.json
}

# Cleanup deployment artifacts
cleanup() {
    print_status "Cleaning up deployment artifacts..."
    
    rm -f competitive-benchmarking.zip
    rm -rf node_modules/
    rm -rf dist/
    
    print_success "Cleanup completed"
}

# Main deployment process
main() {
    echo "Starting deployment process..."
    echo "Function: $FUNCTION_NAME"
    echo "Region: $REGION"
    echo "Runtime: $RUNTIME"
    echo ""
    
    check_prerequisites
    install_dependencies
    build_typescript
    run_tests
    create_deployment_package
    create_iam_role
    create_dynamodb_tables
    create_secrets
    deploy_lambda
    create_api_gateway
    test_deployment
    
    print_success "🎉 Deployment completed successfully!"
    echo ""
    echo "📋 Deployment Summary:"
    echo "  Function Name: $FUNCTION_NAME"
    echo "  Region: $REGION"
    echo "  Runtime: $RUNTIME"
    echo "  Memory: ${MEMORY_SIZE}MB"
    echo "  Timeout: ${TIMEOUT}s"
    echo ""
    echo "🔧 Next Steps:"
    echo "  1. Update the Secrets Manager secret with your Google Maps API key"
    echo "  2. Test the API endpoint with sample requests"
    echo "  3. Monitor CloudWatch logs for any issues"
    echo "  4. Set up CloudWatch alarms for monitoring"
    echo ""
    echo "📚 Resources Created:"
    echo "  - Lambda Function: $FUNCTION_NAME"
    echo "  - IAM Role: ${FUNCTION_NAME}-execution-role"
    echo "  - DynamoDB Tables: ${FUNCTION_NAME}-results, ${FUNCTION_NAME}-cache"
    echo "  - Secrets Manager: ${FUNCTION_NAME}-secrets"
    echo "  - API Gateway: ${FUNCTION_NAME}-api"
    
    if [ -n "$API_ENDPOINT" ]; then
        echo ""
        echo "🌐 API Endpoint: $API_ENDPOINT"
    fi
}

# Handle script arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "test")
        check_prerequisites
        install_dependencies
        build_typescript
        run_tests
        ;;
    "build")
        check_prerequisites
        install_dependencies
        build_typescript
        create_deployment_package
        ;;
    "cleanup")
        cleanup
        ;;
    "help"|"--help"|"-h")
        echo "Usage: $0 [COMMAND]"
        echo ""
        echo "Commands:"
        echo "  deploy    Full deployment (default)"
        echo "  test      Run tests only"
        echo "  build     Build and package only"
        echo "  cleanup   Clean up artifacts"
        echo "  help      Show this help"
        ;;
    *)
        print_error "Unknown command: $1"
        echo "Use '$0 help' for usage information"
        exit 1
        ;;
esac