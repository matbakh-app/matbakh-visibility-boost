#!/bin/bash

# Deploy VC Orchestrator - Production Ready
# This script deploys the complete VC analysis orchestration system

set -e

echo "🚀 Deploying VC Orchestrator - Production Ready"

# Configuration
FUNCTION_NAME="matbakh-vc-orchestrator"
REGION=${AWS_REGION:-us-east-1}
STAGE=${STAGE:-production}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI not found. Please install AWS CLI."
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        log_error "npm not found. Please install Node.js and npm."
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS credentials not configured. Please run 'aws configure'."
        exit 1
    fi
    
    log_info "Prerequisites check passed ✓"
}

# Install dependencies
install_dependencies() {
    log_info "Installing dependencies..."
    npm install
    log_info "Dependencies installed ✓"
}

# Build TypeScript
build_typescript() {
    log_info "Building TypeScript..."
    npm run build
    log_info "TypeScript build completed ✓"
}

# Run tests
run_tests() {
    log_info "Running tests..."
    npm test -- --run
    log_info "Tests passed ✓"
}

# Create DynamoDB tables
create_dynamodb_tables() {
    log_info "Creating DynamoDB tables..."
    
    # VC Jobs table
    JOBS_TABLE_NAME="vc-analysis-jobs-${STAGE}"
    if ! aws dynamodb describe-table --table-name "$JOBS_TABLE_NAME" --region "$REGION" &> /dev/null; then
        log_info "Creating jobs table: $JOBS_TABLE_NAME"
        aws dynamodb create-table \
            --table-name "$JOBS_TABLE_NAME" \
            --attribute-definitions \
                AttributeName=job_id,AttributeType=S \
            --key-schema \
                AttributeName=job_id,KeyType=HASH \
            --billing-mode PAY_PER_REQUEST \
            --region "$REGION" \
            --tags Key=Environment,Value="$STAGE" Key=Service,Value=vc-orchestrator
        
        # Wait for table to be active
        aws dynamodb wait table-exists --table-name "$JOBS_TABLE_NAME" --region "$REGION"
        log_info "Jobs table created ✓"
    else
        log_info "Jobs table already exists ✓"
    fi
    
    # VC Cache table
    CACHE_TABLE_NAME="vc-analysis-cache-${STAGE}"
    if ! aws dynamodb describe-table --table-name "$CACHE_TABLE_NAME" --region "$REGION" &> /dev/null; then
        log_info "Creating cache table: $CACHE_TABLE_NAME"
        aws dynamodb create-table \
            --table-name "$CACHE_TABLE_NAME" \
            --attribute-definitions \
                AttributeName=cache_key,AttributeType=S \
            --key-schema \
                AttributeName=cache_key,KeyType=HASH \
            --billing-mode PAY_PER_REQUEST \
            --region "$REGION" \
            --time-to-live-specification \
                AttributeName=expires_at,Enabled=true \
            --tags Key=Environment,Value="$STAGE" Key=Service,Value=vc-orchestrator
        
        # Wait for table to be active
        aws dynamodb wait table-exists --table-name "$CACHE_TABLE_NAME" --region "$REGION"
        log_info "Cache table created ✓"
    else
        log_info "Cache table already exists ✓"
    fi
}

# Create S3 bucket for results
create_s3_bucket() {
    log_info "Creating S3 bucket for results..."
    
    BUCKET_NAME="matbakh-vc-results-${STAGE}"
    
    if ! aws s3api head-bucket --bucket "$BUCKET_NAME" --region "$REGION" 2>/dev/null; then
        log_info "Creating S3 bucket: $BUCKET_NAME"
        
        if [ "$REGION" = "us-east-1" ]; then
            aws s3api create-bucket --bucket "$BUCKET_NAME" --region "$REGION"
        else
            aws s3api create-bucket \
                --bucket "$BUCKET_NAME" \
                --region "$REGION" \
                --create-bucket-configuration LocationConstraint="$REGION"
        fi
        
        # Enable versioning
        aws s3api put-bucket-versioning \
            --bucket "$BUCKET_NAME" \
            --versioning-configuration Status=Enabled
        
        # Set lifecycle policy
        cat > /tmp/lifecycle-policy.json << EOF
{
    "Rules": [
        {
            "ID": "vc-results-lifecycle",
            "Status": "Enabled",
            "Filter": {"Prefix": "results/"},
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
                "Days": 365
            }
        }
    ]
}
EOF
        
        aws s3api put-bucket-lifecycle-configuration \
            --bucket "$BUCKET_NAME" \
            --lifecycle-configuration file:///tmp/lifecycle-policy.json
        
        # Set bucket tags
        aws s3api put-bucket-tagging \
            --bucket "$BUCKET_NAME" \
            --tagging 'TagSet=[{Key=Environment,Value='$STAGE'},{Key=Service,Value=vc-orchestrator}]'
        
        log_info "S3 bucket created ✓"
    else
        log_info "S3 bucket already exists ✓"
    fi
}

# Create IAM role
create_iam_role() {
    log_info "Creating IAM role..."
    
    ROLE_NAME="vc-orchestrator-role-${STAGE}"
    
    if ! aws iam get-role --role-name "$ROLE_NAME" &> /dev/null; then
        log_info "Creating IAM role: $ROLE_NAME"
        
        # Trust policy
        cat > /tmp/trust-policy.json << EOF
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
        
        aws iam create-role \
            --role-name "$ROLE_NAME" \
            --assume-role-policy-document file:///tmp/trust-policy.json \
            --tags Key=Environment,Value="$STAGE" Key=Service,Value=vc-orchestrator
        
        # Attach basic Lambda execution policy
        aws iam attach-role-policy \
            --role-name "$ROLE_NAME" \
            --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
        
        # Create custom policy
        cat > /tmp/vc-orchestrator-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "dynamodb:GetItem",
                "dynamodb:PutItem",
                "dynamodb:UpdateItem",
                "dynamodb:Query"
            ],
            "Resource": [
                "arn:aws:dynamodb:${REGION}:*:table/vc-analysis-jobs-${STAGE}",
                "arn:aws:dynamodb:${REGION}:*:table/vc-analysis-cache-${STAGE}"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject"
            ],
            "Resource": "arn:aws:s3:::matbakh-vc-results-${STAGE}/*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "bedrock:InvokeModel"
            ],
            "Resource": "arn:aws:bedrock:${REGION}::foundation-model/anthropic.claude-3-5-sonnet-20240620-v1:0"
        },
        {
            "Effect": "Allow",
            "Action": [
                "secretsmanager:GetSecretValue"
            ],
            "Resource": "arn:aws:secretsmanager:${REGION}:*:secret:matbakh/bedrock/*"
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
}
EOF
        
        aws iam put-role-policy \
            --role-name "$ROLE_NAME" \
            --policy-name "vc-orchestrator-policy" \
            --policy-document file:///tmp/vc-orchestrator-policy.json
        
        log_info "IAM role created ✓"
    else
        log_info "IAM role already exists ✓"
    fi
}

# Package Lambda function
package_lambda() {
    log_info "Packaging Lambda function..."
    
    # Create deployment package
    rm -rf dist/
    mkdir -p dist/
    
    # Copy built files
    cp -r build/* dist/
    cp package.json dist/
    
    # Install production dependencies
    cd dist/
    npm install --production --no-optional
    cd ..
    
    # Create ZIP file
    cd dist/
    zip -r ../vc-orchestrator.zip . -x "*.test.*" "**/__tests__/*"
    cd ..
    
    log_info "Lambda function packaged ✓"
}

# Deploy Lambda function
deploy_lambda() {
    log_info "Deploying Lambda function..."
    
    ROLE_ARN=$(aws iam get-role --role-name "vc-orchestrator-role-${STAGE}" --query 'Role.Arn' --output text)
    
    # Environment variables
    ENV_VARS="Variables={"
    ENV_VARS+="VC_JOBS_TABLE=vc-analysis-jobs-${STAGE},"
    ENV_VARS+="VC_CACHE_TABLE=vc-analysis-cache-${STAGE},"
    ENV_VARS+="VC_RESULTS_BUCKET=matbakh-vc-results-${STAGE},"
    ENV_VARS+="TEMPLATE_VERSION=1.0.0,"
    ENV_VARS+="AWS_REGION=${REGION},"
    ENV_VARS+="STAGE=${STAGE}"
    ENV_VARS+="}"
    
    if aws lambda get-function --function-name "$FUNCTION_NAME" &> /dev/null; then
        log_info "Updating existing Lambda function..."
        
        # Update function code
        aws lambda update-function-code \
            --function-name "$FUNCTION_NAME" \
            --zip-file fileb://vc-orchestrator.zip
        
        # Update function configuration
        aws lambda update-function-configuration \
            --function-name "$FUNCTION_NAME" \
            --runtime nodejs18.x \
            --handler vc-api-handler.handler \
            --timeout 300 \
            --memory-size 1024 \
            --environment "$ENV_VARS"
        
    else
        log_info "Creating new Lambda function..."
        
        aws lambda create-function \
            --function-name "$FUNCTION_NAME" \
            --runtime nodejs18.x \
            --role "$ROLE_ARN" \
            --handler vc-api-handler.handler \
            --zip-file fileb://vc-orchestrator.zip \
            --timeout 300 \
            --memory-size 1024 \
            --environment "$ENV_VARS" \
            --tags Environment="$STAGE",Service=vc-orchestrator
    fi
    
    # Wait for function to be active
    aws lambda wait function-active --function-name "$FUNCTION_NAME"
    
    log_info "Lambda function deployed ✓"
}

# Create API Gateway
create_api_gateway() {
    log_info "Creating API Gateway..."
    
    API_NAME="vc-orchestrator-api-${STAGE}"
    
    # Check if API exists
    API_ID=$(aws apigateway get-rest-apis --query "items[?name=='$API_NAME'].id" --output text)
    
    if [ -z "$API_ID" ] || [ "$API_ID" = "None" ]; then
        log_info "Creating new API Gateway..."
        
        API_ID=$(aws apigateway create-rest-api \
            --name "$API_NAME" \
            --description "VC Orchestrator API" \
            --endpoint-configuration types=REGIONAL \
            --query 'id' --output text)
        
        # Get root resource ID
        ROOT_RESOURCE_ID=$(aws apigateway get-resources \
            --rest-api-id "$API_ID" \
            --query 'items[?path==`/`].id' --output text)
        
        # Create /vc resource
        VC_RESOURCE_ID=$(aws apigateway create-resource \
            --rest-api-id "$API_ID" \
            --parent-id "$ROOT_RESOURCE_ID" \
            --path-part "vc" \
            --query 'id' --output text)
        
        # Create /vc/start resource
        START_RESOURCE_ID=$(aws apigateway create-resource \
            --rest-api-id "$API_ID" \
            --parent-id "$VC_RESOURCE_ID" \
            --path-part "start" \
            --query 'id' --output text)
        
        # Create /vc/result resource
        RESULT_RESOURCE_ID=$(aws apigateway create-resource \
            --rest-api-id "$API_ID" \
            --parent-id "$VC_RESOURCE_ID" \
            --path-part "result" \
            --query 'id' --output text)
        
        # Create /vc/stream resource
        STREAM_RESOURCE_ID=$(aws apigateway create-resource \
            --rest-api-id "$API_ID" \
            --parent-id "$VC_RESOURCE_ID" \
            --path-part "stream" \
            --query 'id' --output text)
        
        # Create methods and integrations
        create_api_methods "$API_ID" "$START_RESOURCE_ID" "$RESULT_RESOURCE_ID" "$STREAM_RESOURCE_ID"
        
        # Deploy API
        aws apigateway create-deployment \
            --rest-api-id "$API_ID" \
            --stage-name "$STAGE"
        
        log_info "API Gateway created ✓"
    else
        log_info "API Gateway already exists ✓"
    fi
    
    # Output API endpoint
    API_ENDPOINT="https://${API_ID}.execute-api.${REGION}.amazonaws.com/${STAGE}"
    log_info "API Endpoint: $API_ENDPOINT"
}

create_api_methods() {
    local API_ID=$1
    local START_RESOURCE_ID=$2
    local RESULT_RESOURCE_ID=$3
    local STREAM_RESOURCE_ID=$4
    
    LAMBDA_ARN="arn:aws:lambda:${REGION}:$(aws sts get-caller-identity --query Account --output text):function:${FUNCTION_NAME}"
    
    # POST /vc/start
    aws apigateway put-method \
        --rest-api-id "$API_ID" \
        --resource-id "$START_RESOURCE_ID" \
        --http-method POST \
        --authorization-type NONE
    
    aws apigateway put-integration \
        --rest-api-id "$API_ID" \
        --resource-id "$START_RESOURCE_ID" \
        --http-method POST \
        --type AWS_PROXY \
        --integration-http-method POST \
        --uri "arn:aws:apigateway:${REGION}:lambda:path/2015-03-31/functions/${LAMBDA_ARN}/invocations"
    
    # GET /vc/result
    aws apigateway put-method \
        --rest-api-id "$API_ID" \
        --resource-id "$RESULT_RESOURCE_ID" \
        --http-method GET \
        --authorization-type NONE
    
    aws apigateway put-integration \
        --rest-api-id "$API_ID" \
        --resource-id "$RESULT_RESOURCE_ID" \
        --http-method GET \
        --type AWS_PROXY \
        --integration-http-method POST \
        --uri "arn:aws:apigateway:${REGION}:lambda:path/2015-03-31/functions/${LAMBDA_ARN}/invocations"
    
    # GET /vc/stream
    aws apigateway put-method \
        --rest-api-id "$API_ID" \
        --resource-id "$STREAM_RESOURCE_ID" \
        --http-method GET \
        --authorization-type NONE
    
    aws apigateway put-integration \
        --rest-api-id "$API_ID" \
        --resource-id "$STREAM_RESOURCE_ID" \
        --http-method GET \
        --type AWS_PROXY \
        --integration-http-method POST \
        --uri "arn:aws:apigateway:${REGION}:lambda:path/2015-03-31/functions/${LAMBDA_ARN}/invocations"
    
    # Add Lambda permissions
    aws lambda add-permission \
        --function-name "$FUNCTION_NAME" \
        --statement-id "api-gateway-invoke-${STAGE}" \
        --action lambda:InvokeFunction \
        --principal apigateway.amazonaws.com \
        --source-arn "arn:aws:execute-api:${REGION}:$(aws sts get-caller-identity --query Account --output text):${API_ID}/*" \
        2>/dev/null || true
}

# Run smoke tests
run_smoke_tests() {
    log_info "Running smoke tests..."
    
    API_ID=$(aws apigateway get-rest-apis --query "items[?name=='vc-orchestrator-api-${STAGE}'].id" --output text)
    API_ENDPOINT="https://${API_ID}.execute-api.${REGION}.amazonaws.com/${STAGE}"
    
    # Test POST /vc/start
    log_info "Testing POST /vc/start..."
    RESPONSE=$(curl -s -X POST "${API_ENDPOINT}/vc/start" \
        -H "Content-Type: application/json" \
        -d '{
            "business": {
                "name": "Test Restaurant",
                "category": "Restaurant",
                "location": {"city": "München", "country": "Deutschland"}
            },
            "persona_hint": "Solo-Sarah"
        }')
    
    JOB_ID=$(echo "$RESPONSE" | jq -r '.job_id // empty')
    if [ -n "$JOB_ID" ]; then
        log_info "✓ POST /vc/start successful, job_id: $JOB_ID"
        
        # Test GET /vc/result
        log_info "Testing GET /vc/result..."
        sleep 2
        RESULT_RESPONSE=$(curl -s "${API_ENDPOINT}/vc/result?job_id=${JOB_ID}")
        STATUS=$(echo "$RESULT_RESPONSE" | jq -r '.status // empty')
        
        if [ -n "$STATUS" ]; then
            log_info "✓ GET /vc/result successful, status: $STATUS"
        else
            log_warn "GET /vc/result returned unexpected response"
        fi
    else
        log_warn "POST /vc/start returned unexpected response"
    fi
    
    log_info "Smoke tests completed ✓"
}

# Cleanup temporary files
cleanup() {
    log_info "Cleaning up temporary files..."
    rm -f /tmp/trust-policy.json
    rm -f /tmp/vc-orchestrator-policy.json
    rm -f /tmp/lifecycle-policy.json
    rm -f vc-orchestrator.zip
    rm -rf dist/
    log_info "Cleanup completed ✓"
}

# Main deployment flow
main() {
    log_info "Starting VC Orchestrator deployment..."
    
    check_prerequisites
    install_dependencies
    build_typescript
    run_tests
    create_dynamodb_tables
    create_s3_bucket
    create_iam_role
    package_lambda
    deploy_lambda
    create_api_gateway
    run_smoke_tests
    cleanup
    
    log_info "🎉 VC Orchestrator deployment completed successfully!"
    log_info "API Endpoint: https://$(aws apigateway get-rest-apis --query "items[?name=='vc-orchestrator-api-${STAGE}'].id" --output text).execute-api.${REGION}.amazonaws.com/${STAGE}"
}

# Handle script interruption
trap cleanup EXIT

# Run main function
main "$@"