#!/bin/bash

# Deploy Testing Suite for Bedrock AI Core
# Comprehensive testing infrastructure deployment
# Requirements: 8.3, 10.5, 11.4, 11.5

set -e

echo "🧪 Deploying Bedrock AI Core Testing Suite"
echo "=========================================="

# Configuration
FUNCTION_NAME="bedrock-agent-testing"
REGION=${AWS_REGION:-"eu-central-1"}
TIMEOUT=900  # 15 minutes for comprehensive tests
MEMORY=3008  # Maximum memory for performance tests

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
print_status "Checking prerequisites..."

if ! command -v aws &> /dev/null; then
    print_error "AWS CLI not found. Please install AWS CLI."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    print_error "npm not found. Please install Node.js and npm."
    exit 1
fi

if ! aws sts get-caller-identity &> /dev/null; then
    print_error "AWS credentials not configured. Please run 'aws configure'."
    exit 1
fi

print_success "Prerequisites check passed"

# Install dependencies
print_status "Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    print_error "Failed to install dependencies"
    exit 1
fi
print_success "Dependencies installed"

# Run TypeScript compilation
print_status "Compiling TypeScript..."
npm run build
if [ $? -ne 0 ]; then
    print_error "TypeScript compilation failed"
    exit 1
fi
print_success "TypeScript compilation completed"

# Run critical tests before deployment
print_status "Running critical tests..."
npm run test:critical
if [ $? -ne 0 ]; then
    print_warning "Some critical tests failed, but continuing with deployment"
else
    print_success "Critical tests passed"
fi

# Create test reports directory
mkdir -p test-reports
mkdir -p coverage

# Package the function
print_status "Packaging Lambda function..."
zip -r bedrock-agent-testing.zip dist/ node_modules/ package.json
if [ $? -ne 0 ]; then
    print_error "Failed to package Lambda function"
    exit 1
fi
print_success "Lambda function packaged"

# Check if function exists
print_status "Checking if Lambda function exists..."
if aws lambda get-function --function-name $FUNCTION_NAME --region $REGION &> /dev/null; then
    print_status "Function exists, updating..."
    
    # Update function code
    aws lambda update-function-code \
        --function-name $FUNCTION_NAME \
        --zip-file fileb://bedrock-agent-testing.zip \
        --region $REGION
    
    if [ $? -ne 0 ]; then
        print_error "Failed to update Lambda function code"
        exit 1
    fi
    
    # Update function configuration
    aws lambda update-function-configuration \
        --function-name $FUNCTION_NAME \
        --timeout $TIMEOUT \
        --memory-size $MEMORY \
        --region $REGION \
        --environment Variables='{
            "NODE_ENV":"test",
            "AWS_REGION":"'$REGION'",
            "BEDROCK_LOGS_TABLE":"bedrock-agent-test-logs",
            "AUDIT_TRAIL_TABLE":"bedrock-agent-test-audit",
            "BEDROCK_LOG_GROUP":"/aws/lambda/bedrock-agent-testing",
            "TEST_MODE":"true",
            "ANONYMIZATION_SALT":"test-salt-'$(date +%s)'",
            "ARCHIVE_ENCRYPTION_KEY":"test-encryption-key"
        }'
    
    if [ $? -ne 0 ]; then
        print_error "Failed to update Lambda function configuration"
        exit 1
    fi
    
    print_success "Lambda function updated"
else
    print_status "Function does not exist, creating..."
    
    # Get execution role ARN
    ROLE_ARN=$(aws iam get-role --role-name bedrock-agent-execution-role --query 'Role.Arn' --output text 2>/dev/null)
    
    if [ -z "$ROLE_ARN" ]; then
        print_status "Creating execution role..."
        
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
            --role-name bedrock-agent-execution-role \
            --assume-role-policy-document file://trust-policy.json \
            --region $REGION
        
        # Attach basic execution policy
        aws iam attach-role-policy \
            --role-name bedrock-agent-execution-role \
            --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
        
        # Attach Bedrock access policy
        aws iam attach-role-policy \
            --role-name bedrock-agent-execution-role \
            --policy-arn arn:aws:iam::aws:policy/AmazonBedrockFullAccess
        
        # Get the role ARN
        ROLE_ARN=$(aws iam get-role --role-name bedrock-agent-execution-role --query 'Role.Arn' --output text)
        
        # Wait for role to be available
        print_status "Waiting for IAM role to be available..."
        sleep 10
        
        rm trust-policy.json
    fi
    
    # Create function
    aws lambda create-function \
        --function-name $FUNCTION_NAME \
        --runtime nodejs20.x \
        --role $ROLE_ARN \
        --handler dist/index.handler \
        --zip-file fileb://bedrock-agent-testing.zip \
        --timeout $TIMEOUT \
        --memory-size $MEMORY \
        --region $REGION \
        --environment Variables='{
            "NODE_ENV":"test",
            "AWS_REGION":"'$REGION'",
            "BEDROCK_LOGS_TABLE":"bedrock-agent-test-logs",
            "AUDIT_TRAIL_TABLE":"bedrock-agent-test-audit",
            "BEDROCK_LOG_GROUP":"/aws/lambda/bedrock-agent-testing",
            "TEST_MODE":"true",
            "ANONYMIZATION_SALT":"test-salt-'$(date +%s)'",
            "ARCHIVE_ENCRYPTION_KEY":"test-encryption-key"
        }'
    
    if [ $? -ne 0 ]; then
        print_error "Failed to create Lambda function"
        exit 1
    fi
    
    print_success "Lambda function created"
fi

# Clean up
rm -f bedrock-agent-testing.zip

# Create CloudWatch Log Group for testing
print_status "Setting up CloudWatch Log Group..."
aws logs create-log-group \
    --log-group-name "/aws/lambda/bedrock-agent-testing" \
    --region $REGION 2>/dev/null || true

aws logs put-retention-policy \
    --log-group-name "/aws/lambda/bedrock-agent-testing" \
    --retention-in-days 7 \
    --region $REGION 2>/dev/null || true

print_success "CloudWatch Log Group configured"

# Create DynamoDB tables for testing
print_status "Setting up test DynamoDB tables..."

# Test logs table
aws dynamodb create-table \
    --table-name bedrock-agent-test-logs \
    --attribute-definitions \
        AttributeName=id,AttributeType=S \
        AttributeName=timestamp,AttributeType=S \
    --key-schema \
        AttributeName=id,KeyType=HASH \
        AttributeName=timestamp,KeyType=RANGE \
    --billing-mode PAY_PER_REQUEST \
    --region $REGION 2>/dev/null || true

# Test audit table
aws dynamodb create-table \
    --table-name bedrock-agent-test-audit \
    --attribute-definitions \
        AttributeName=id,AttributeType=S \
        AttributeName=timestamp,AttributeType=S \
    --key-schema \
        AttributeName=id,KeyType=HASH \
        AttributeName=timestamp,KeyType=RANGE \
    --billing-mode PAY_PER_REQUEST \
    --region $REGION 2>/dev/null || true

print_success "Test DynamoDB tables configured"

# Run comprehensive test suite
print_status "Running comprehensive test suite..."
npm run test:all
TEST_EXIT_CODE=$?

if [ $TEST_EXIT_CODE -eq 0 ]; then
    print_success "All tests passed! 🎉"
else
    print_warning "Some tests failed. Check test reports for details."
fi

# Generate test report
print_status "Generating deployment test report..."
cat > deployment-test-report.md << EOF
# Bedrock AI Core Testing Suite Deployment Report

**Deployment Date:** $(date)
**Function Name:** $FUNCTION_NAME
**Region:** $REGION
**Test Exit Code:** $TEST_EXIT_CODE

## Deployment Summary

- ✅ Dependencies installed
- ✅ TypeScript compiled
- ✅ Lambda function deployed
- ✅ CloudWatch logs configured
- ✅ DynamoDB test tables created
- $([ $TEST_EXIT_CODE -eq 0 ] && echo "✅" || echo "⚠️") Comprehensive tests executed

## Test Suites Deployed

1. **Comprehensive AI Operations** - End-to-end AI workflow testing
2. **Persona Detection Accuracy** - Accuracy and consistency testing
3. **Prompt Template Security** - Security validation and injection prevention
4. **AI Service Load Testing** - Performance and scalability testing

## Available Test Commands

\`\`\`bash
# Run all tests
npm run test:all

# Run specific test suites
npm run test:ai-operations
npm run test:persona-accuracy
npm run test:template-security
npm run test:load

# Run critical tests only
npm run test:critical

# Run with coverage
npm run test:coverage

# CI/CD compatible run
npm run test:ci
\`\`\`

## Next Steps

1. Review test reports in \`test-reports/\` directory
2. Monitor CloudWatch logs for test execution
3. Set up automated testing in CI/CD pipeline
4. Configure alerts for test failures

## Resources Created

- Lambda Function: $FUNCTION_NAME
- CloudWatch Log Group: /aws/lambda/bedrock-agent-testing
- DynamoDB Tables: bedrock-agent-test-logs, bedrock-agent-test-audit
- IAM Role: bedrock-agent-execution-role (if created)

EOF

print_success "Deployment test report generated: deployment-test-report.md"

# Final status
echo ""
echo "=========================================="
if [ $TEST_EXIT_CODE -eq 0 ]; then
    print_success "🎉 Bedrock AI Core Testing Suite deployed successfully!"
    print_success "All tests are passing and the system is ready for production."
else
    print_warning "⚠️  Testing Suite deployed with some test failures."
    print_warning "Review test reports and fix failing tests before production deployment."
fi

print_status "Function ARN: $(aws lambda get-function --function-name $FUNCTION_NAME --region $REGION --query 'Configuration.FunctionArn' --output text)"
print_status "Log Group: /aws/lambda/bedrock-agent-testing"
print_status "Test Reports: ./test-reports/"

echo "=========================================="

exit $TEST_EXIT_CODE