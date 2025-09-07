#!/bin/bash

# Automated SWOT Engine Deployment Script
# Deploys the AI-powered SWOT analysis engine to AWS Lambda

set -e

# Configuration
FUNCTION_NAME="automated-swot-engine"
REGION="${AWS_REGION:-eu-central-1}"
RUNTIME="nodejs20.x"
HANDLER="dist/index.handler"
TIMEOUT=300
MEMORY_SIZE=1024
ARCHITECTURE="x86_64"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI is not installed. Please install it first."
        exit 1
    fi
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed. Please install it first."
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed. Please install it first."
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS credentials not configured. Please run 'aws configure' first."
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Install dependencies
install_dependencies() {
    log_info "Installing dependencies..."
    
    if [ ! -f "package.json" ]; then
        log_error "package.json not found. Are you in the correct directory?"
        exit 1
    fi
    
    npm ci --production
    
    log_success "Dependencies installed"
}

# Build TypeScript
build_typescript() {
    log_info "Building TypeScript..."
    
    # Install dev dependencies for build
    npm install --only=dev
    
    # Clean previous build
    rm -rf dist/
    
    # Build
    npx tsc
    
    if [ ! -d "dist" ]; then
        log_error "TypeScript build failed - dist directory not created"
        exit 1
    fi
    
    log_success "TypeScript build completed"
}

# Run tests
run_tests() {
    log_info "Running tests..."
    
    # Install all dependencies for testing
    npm install
    
    # Run tests
    npm test
    
    if [ $? -ne 0 ]; then
        log_error "Tests failed. Deployment aborted."
        exit 1
    fi
    
    log_success "All tests passed"
}

# Create deployment package
create_deployment_package() {
    log_info "Creating deployment package..."
    
    # Create temporary directory
    TEMP_DIR=$(mktemp -d)
    
    # Copy built files
    cp -r dist/ "$TEMP_DIR/"
    
    # Copy production node_modules
    if [ -d "node_modules" ]; then
        cp -r node_modules/ "$TEMP_DIR/"
    fi
    
    # Create zip file
    cd "$TEMP_DIR"
    zip -r "../${FUNCTION_NAME}.zip" . -q
    cd - > /dev/null
    
    # Move zip to current directory
    mv "$TEMP_DIR/../${FUNCTION_NAME}.zip" "./"
    
    # Cleanup
    rm -rf "$TEMP_DIR"
    
    log_success "Deployment package created: ${FUNCTION_NAME}.zip"
}

# Get or create IAM role
setup_iam_role() {
    log_info "Setting up IAM role..."
    
    ROLE_NAME="${FUNCTION_NAME}-execution-role"
    
    # Check if role exists
    if aws iam get-role --role-name "$ROLE_NAME" &> /dev/null; then
        log_info "IAM role $ROLE_NAME already exists"
    else
        log_info "Creating IAM role $ROLE_NAME..."
        
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
            --role-name "$ROLE_NAME" \
            --assume-role-policy-document file://trust-policy.json \
            --region "$REGION"
        
        # Attach basic execution policy
        aws iam attach-role-policy \
            --role-name "$ROLE_NAME" \
            --policy-arn "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole" \
            --region "$REGION"
        
        # Create and attach custom policy for AI services
        cat > ai-services-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": [
        "arn:aws:bedrock:*::foundation-model/anthropic.claude-3-5-sonnet-20241022-v2:0",
        "arn:aws:bedrock:*::foundation-model/anthropic.claude-*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "comprehend:DetectSentiment",
        "comprehend:DetectKeyPhrases",
        "comprehend:DetectEntities",
        "comprehend:DetectLanguage"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "rekognition:DetectLabels",
        "rekognition:DetectFaces",
        "rekognition:DetectModerationLabels"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject"
      ],
      "Resource": "arn:aws:s3:::*/*"
    }
  ]
}
EOF
        
        aws iam put-role-policy \
            --role-name "$ROLE_NAME" \
            --policy-name "AIServicesPolicy" \
            --policy-document file://ai-services-policy.json \
            --region "$REGION"
        
        # Cleanup policy files
        rm -f trust-policy.json ai-services-policy.json
        
        log_success "IAM role created and configured"
        
        # Wait for role to be available
        log_info "Waiting for IAM role to be available..."
        sleep 10
    fi
    
    # Get role ARN
    ROLE_ARN=$(aws iam get-role --role-name "$ROLE_NAME" --query 'Role.Arn' --output text --region "$REGION")
    log_info "Using IAM role: $ROLE_ARN"
}

# Deploy Lambda function
deploy_lambda() {
    log_info "Deploying Lambda function..."
    
    # Check if function exists
    if aws lambda get-function --function-name "$FUNCTION_NAME" --region "$REGION" &> /dev/null; then
        log_info "Updating existing Lambda function..."
        
        # Update function code
        aws lambda update-function-code \
            --function-name "$FUNCTION_NAME" \
            --zip-file "fileb://${FUNCTION_NAME}.zip" \
            --region "$REGION" \
            --no-cli-pager
        
        # Update function configuration
        aws lambda update-function-configuration \
            --function-name "$FUNCTION_NAME" \
            --runtime "$RUNTIME" \
            --handler "$HANDLER" \
            --timeout "$TIMEOUT" \
            --memory-size "$MEMORY_SIZE" \
            --environment "Variables={AWS_REGION=$REGION,BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0}" \
            --region "$REGION" \
            --no-cli-pager
            
    else
        log_info "Creating new Lambda function..."
        
        aws lambda create-function \
            --function-name "$FUNCTION_NAME" \
            --runtime "$RUNTIME" \
            --role "$ROLE_ARN" \
            --handler "$HANDLER" \
            --zip-file "fileb://${FUNCTION_NAME}.zip" \
            --timeout "$TIMEOUT" \
            --memory-size "$MEMORY_SIZE" \
            --architecture "$ARCHITECTURE" \
            --environment "Variables={AWS_REGION=$REGION,BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0}" \
            --region "$REGION" \
            --no-cli-pager
    fi
    
    log_success "Lambda function deployed successfully"
}

# Setup API Gateway (optional)
setup_api_gateway() {
    log_info "Setting up API Gateway integration..."
    
    API_NAME="${FUNCTION_NAME}-api"
    
    # Check if API exists
    API_ID=$(aws apigateway get-rest-apis --query "items[?name=='$API_NAME'].id" --output text --region "$REGION")
    
    if [ -z "$API_ID" ] || [ "$API_ID" == "None" ]; then
        log_info "Creating new API Gateway..."
        
        # Create API
        API_ID=$(aws apigateway create-rest-api \
            --name "$API_NAME" \
            --description "API for Automated SWOT Analysis Engine" \
            --query 'id' \
            --output text \
            --region "$REGION")
        
        # Get root resource ID
        ROOT_RESOURCE_ID=$(aws apigateway get-resources \
            --rest-api-id "$API_ID" \
            --query 'items[?path==`/`].id' \
            --output text \
            --region "$REGION")
        
        # Create /swot resource
        SWOT_RESOURCE_ID=$(aws apigateway create-resource \
            --rest-api-id "$API_ID" \
            --parent-id "$ROOT_RESOURCE_ID" \
            --path-part "swot" \
            --query 'id' \
            --output text \
            --region "$REGION")
        
        # Create /swot/analyze resource
        ANALYZE_RESOURCE_ID=$(aws apigateway create-resource \
            --rest-api-id "$API_ID" \
            --parent-id "$SWOT_RESOURCE_ID" \
            --path-part "analyze" \
            --query 'id' \
            --output text \
            --region "$REGION")
        
        # Create /swot/health resource
        HEALTH_RESOURCE_ID=$(aws apigateway create-resource \
            --rest-api-id "$API_ID" \
            --parent-id "$SWOT_RESOURCE_ID" \
            --path-part "health" \
            --query 'id' \
            --output text \
            --region "$REGION")
        
        # Create POST method for /swot/analyze
        aws apigateway put-method \
            --rest-api-id "$API_ID" \
            --resource-id "$ANALYZE_RESOURCE_ID" \
            --http-method POST \
            --authorization-type NONE \
            --region "$REGION"
        
        # Create GET method for /swot/health
        aws apigateway put-method \
            --rest-api-id "$API_ID" \
            --resource-id "$HEALTH_RESOURCE_ID" \
            --http-method GET \
            --authorization-type NONE \
            --region "$REGION"
        
        # Get Lambda function ARN
        LAMBDA_ARN=$(aws lambda get-function \
            --function-name "$FUNCTION_NAME" \
            --query 'Configuration.FunctionArn' \
            --output text \
            --region "$REGION")
        
        # Create integration for POST /swot/analyze
        aws apigateway put-integration \
            --rest-api-id "$API_ID" \
            --resource-id "$ANALYZE_RESOURCE_ID" \
            --http-method POST \
            --type AWS_PROXY \
            --integration-http-method POST \
            --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/$LAMBDA_ARN/invocations" \
            --region "$REGION"
        
        # Create integration for GET /swot/health
        aws apigateway put-integration \
            --rest-api-id "$API_ID" \
            --resource-id "$HEALTH_RESOURCE_ID" \
            --http-method GET \
            --type AWS_PROXY \
            --integration-http-method POST \
            --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/$LAMBDA_ARN/invocations" \
            --region "$REGION"
        
        # Add Lambda permissions for API Gateway
        aws lambda add-permission \
            --function-name "$FUNCTION_NAME" \
            --statement-id "apigateway-invoke-$API_ID" \
            --action lambda:InvokeFunction \
            --principal apigateway.amazonaws.com \
            --source-arn "arn:aws:execute-api:$REGION:*:$API_ID/*/*" \
            --region "$REGION"
        
        # Deploy API
        aws apigateway create-deployment \
            --rest-api-id "$API_ID" \
            --stage-name "prod" \
            --region "$REGION"
        
        log_success "API Gateway created and deployed"
        log_info "API Endpoint: https://$API_ID.execute-api.$REGION.amazonaws.com/prod"
    else
        log_info "API Gateway already exists: $API_ID"
        log_info "API Endpoint: https://$API_ID.execute-api.$REGION.amazonaws.com/prod"
    fi
}

# Test deployment
test_deployment() {
    log_info "Testing deployment..."
    
    # Test Lambda function directly
    log_info "Testing Lambda function..."
    
    cat > test-payload.json << EOF
{
  "httpMethod": "GET",
  "path": "/swot/health"
}
EOF
    
    RESPONSE=$(aws lambda invoke \
        --function-name "$FUNCTION_NAME" \
        --payload file://test-payload.json \
        --region "$REGION" \
        response.json)
    
    if [ $? -eq 0 ]; then
        STATUS_CODE=$(cat response.json | jq -r '.statusCode')
        if [ "$STATUS_CODE" == "200" ]; then
            log_success "Lambda function test passed"
        else
            log_warning "Lambda function returned status code: $STATUS_CODE"
            cat response.json
        fi
    else
        log_error "Lambda function test failed"
        cat response.json
    fi
    
    # Cleanup test files
    rm -f test-payload.json response.json
}

# Cleanup
cleanup() {
    log_info "Cleaning up temporary files..."
    
    rm -f "${FUNCTION_NAME}.zip"
    
    log_success "Cleanup completed"
}

# Main deployment process
main() {
    log_info "Starting deployment of Automated SWOT Engine..."
    log_info "Function: $FUNCTION_NAME"
    log_info "Region: $REGION"
    log_info "Runtime: $RUNTIME"
    
    check_prerequisites
    install_dependencies
    build_typescript
    run_tests
    create_deployment_package
    setup_iam_role
    deploy_lambda
    
    # Optional API Gateway setup
    if [ "$1" == "--with-api" ]; then
        setup_api_gateway
    fi
    
    test_deployment
    cleanup
    
    log_success "Deployment completed successfully!"
    log_info "Function Name: $FUNCTION_NAME"
    log_info "Region: $REGION"
    
    if [ "$1" == "--with-api" ]; then
        API_ID=$(aws apigateway get-rest-apis --query "items[?name=='${FUNCTION_NAME}-api'].id" --output text --region "$REGION")
        log_info "API Endpoint: https://$API_ID.execute-api.$REGION.amazonaws.com/prod"
        log_info ""
        log_info "Test the API:"
        log_info "  Health Check: curl https://$API_ID.execute-api.$REGION.amazonaws.com/prod/swot/health"
        log_info "  SWOT Analysis: curl -X POST https://$API_ID.execute-api.$REGION.amazonaws.com/prod/swot/analyze -d @sample-request.json"
    fi
    
    log_info ""
    log_info "Next steps:"
    log_info "1. Test the function with sample data"
    log_info "2. Monitor CloudWatch logs for any issues"
    log_info "3. Set up monitoring and alerting"
    log_info "4. Configure auto-scaling if needed"
}

# Handle script arguments
case "$1" in
    --help|-h)
        echo "Automated SWOT Engine Deployment Script"
        echo ""
        echo "Usage: $0 [OPTIONS]"
        echo ""
        echo "Options:"
        echo "  --with-api    Deploy with API Gateway integration"
        echo "  --help, -h    Show this help message"
        echo ""
        echo "Environment Variables:"
        echo "  AWS_REGION    AWS region (default: eu-central-1)"
        echo ""
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac