#!/bin/bash

# Deploy S3 Upload Processor Lambda Function
# This function processes S3 upload events and persists metadata to RDS

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
FUNCTION_NAME="matbakh-s3-upload-processor"
REGION="eu-central-1"
RUNTIME="nodejs20.x"
HANDLER="index.handler"
TIMEOUT=60
MEMORY_SIZE=256

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

log() {
    echo -e "$1"
}

log "${GREEN}Deploying S3 Upload Processor Lambda Function${NC}"

# Check if AWS CLI is configured
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    log "${RED}Error: AWS CLI not configured or no valid credentials${NC}"
    exit 1
fi

# Install dependencies
log "${YELLOW}Installing dependencies...${NC}"
cd "$SCRIPT_DIR"
npm install

# Build TypeScript
log "${YELLOW}Building TypeScript...${NC}"
npm run build

# Create deployment package
log "${YELLOW}Creating deployment package...${NC}"
cd dist
zip -r ../deployment.zip . > /dev/null
cd ..

# Add node_modules to package
zip -r deployment.zip node_modules > /dev/null

# Check if function exists
if aws lambda get-function --function-name "$FUNCTION_NAME" --region "$REGION" > /dev/null 2>&1; then
    log "${YELLOW}Updating existing function...${NC}"
    
    # Update function code
    aws lambda update-function-code \
        --function-name "$FUNCTION_NAME" \
        --zip-file fileb://deployment.zip \
        --region "$REGION" > /dev/null
    
    # Update function configuration
    aws lambda update-function-configuration \
        --function-name "$FUNCTION_NAME" \
        --runtime "$RUNTIME" \
        --handler "$HANDLER" \
        --timeout "$TIMEOUT" \
        --memory-size "$MEMORY_SIZE" \
        --region "$REGION" > /dev/null
        
    log "${GREEN}✓ Function updated successfully${NC}"
else
    log "${YELLOW}Creating new function...${NC}"
    
    # Get execution role ARN
    ROLE_ARN=$(aws iam get-role --role-name matbakh-lambda-execution-role --query 'Role.Arn' --output text 2>/dev/null || echo "")
    
    if [ -z "$ROLE_ARN" ]; then
        log "${RED}Error: Lambda execution role 'matbakh-lambda-execution-role' not found${NC}"
        log "Please create the role first or update the role name in this script"
        exit 1
    fi
    
    # Create function
    aws lambda create-function \
        --function-name "$FUNCTION_NAME" \
        --runtime "$RUNTIME" \
        --role "$ROLE_ARN" \
        --handler "$HANDLER" \
        --zip-file fileb://deployment.zip \
        --timeout "$TIMEOUT" \
        --memory-size "$MEMORY_SIZE" \
        --region "$REGION" \
        --layers "arn:aws:lambda:eu-central-1:$(aws sts get-caller-identity --query Account --output text):layer:pg-client-layer:1" \
        --vpc-config SubnetIds=subnet-0123456789abcdef0,subnet-0987654321fedcba0,SecurityGroupIds=sg-0123456789abcdef0 \
        --environment Variables='{
            "NODE_ENV": "production",
            "DB_SECRET_NAME": "matbakh-db-postgres"
        }' > /dev/null
        
    log "${GREEN}✓ Function created successfully${NC}"
fi

# Configure S3 event triggers
log "${YELLOW}Configuring S3 event triggers...${NC}"

# Get function ARN
FUNCTION_ARN=$(aws lambda get-function --function-name "$FUNCTION_NAME" --region "$REGION" --query 'Configuration.FunctionArn' --output text)

# Add S3 permissions for each bucket
BUCKETS=("matbakh-files-uploads" "matbakh-files-profile" "matbakh-files-reports")

for BUCKET in "${BUCKETS[@]}"; do
    # Add permission for S3 to invoke Lambda
    aws lambda add-permission \
        --function-name "$FUNCTION_NAME" \
        --principal s3.amazonaws.com \
        --action lambda:InvokeFunction \
        --source-arn "arn:aws:s3:::$BUCKET" \
        --statement-id "s3-trigger-$BUCKET" \
        --region "$REGION" > /dev/null 2>&1 || true
    
    # Configure S3 bucket notification
    NOTIFICATION_CONFIG=$(cat << EOF
{
    "LambdaConfigurations": [
        {
            "Id": "upload-processor-trigger",
            "LambdaFunctionArn": "$FUNCTION_ARN",
            "Events": ["s3:ObjectCreated:*"],
            "Filter": {
                "Key": {
                    "FilterRules": []
                }
            }
        }
    ]
}
EOF
)
    
    echo "$NOTIFICATION_CONFIG" > /tmp/notification-config.json
    
    # Apply notification configuration
    if aws s3api put-bucket-notification-configuration \
        --bucket "$BUCKET" \
        --notification-configuration file:///tmp/notification-config.json > /dev/null 2>&1; then
        log "${GREEN}✓ S3 trigger configured for $BUCKET${NC}"
    else
        log "${YELLOW}⚠ Failed to configure S3 trigger for $BUCKET (bucket may not exist)${NC}"
    fi
done

# Clean up
rm -f deployment.zip
rm -f /tmp/notification-config.json

# Test function
log "${YELLOW}Testing function...${NC}"
TEST_EVENT=$(cat << 'EOF'
{
  "Records": [
    {
      "eventVersion": "2.1",
      "eventSource": "aws:s3",
      "awsRegion": "eu-central-1",
      "eventTime": "2025-01-31T12:00:00.000Z",
      "eventName": "ObjectCreated:Put",
      "s3": {
        "s3SchemaVersion": "1.0",
        "configurationId": "upload-processor-trigger",
        "bucket": {
          "name": "matbakh-files-uploads",
          "arn": "arn:aws:s3:::matbakh-files-uploads"
        },
        "object": {
          "key": "test/test-file.jpg",
          "size": 1024
        }
      }
    }
  ]
}
EOF
)

if aws lambda invoke \
    --function-name "$FUNCTION_NAME" \
    --payload "$TEST_EVENT" \
    --region "$REGION" \
    /tmp/lambda-response.json > /dev/null 2>&1; then
    log "${GREEN}✓ Function test completed${NC}"
    
    # Check for errors in response
    if grep -q "errorMessage" /tmp/lambda-response.json 2>/dev/null; then
        log "${YELLOW}⚠ Function executed but returned an error:${NC}"
        cat /tmp/lambda-response.json
    fi
else
    log "${YELLOW}⚠ Function test failed (this is expected if test object doesn't exist)${NC}"
fi

rm -f /tmp/lambda-response.json

log "${GREEN}Deployment Summary:${NC}"
log "Function Name: $FUNCTION_NAME"
log "Function ARN: $FUNCTION_ARN"
log "Runtime: $RUNTIME"
log "Memory: ${MEMORY_SIZE}MB"
log "Timeout: ${TIMEOUT}s"
log ""
log "${GREEN}✓ S3 Upload Processor Lambda deployed successfully!${NC}"
log ""
log "Next steps:"
log "1. Verify S3 bucket notifications are configured correctly"
log "2. Test with actual file uploads"
log "3. Monitor CloudWatch logs for any issues"