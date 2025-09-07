#!/bin/bash

# Enable Bedrock AI Agent Script
# This script re-enables the Bedrock AI system after rollback

set -e

# Configuration
REGION=${AWS_REGION:-us-east-1}
BEDROCK_FUNCTION="bedrock-agent"
PROXY_FUNCTION="web-proxy"

echo "🚀 Re-enabling Bedrock AI Agent"
echo "Region: $REGION"
echo "Timestamp: $(date)"

# Function to enable Lambda function
enable_lambda_function() {
  local function_name=$1
  echo "🟢 Enabling Lambda function: $function_name"
  
  # Update environment variables to enable the function
  aws lambda update-function-configuration \
    --function-name "$function_name" \
    --environment Variables='{
      "NODE_ENV":"production",
      "AWS_REGION":"'$REGION'",
      "VC_BEDROCK_LIVE":"true",
      "VC_BEDROCK_ROLLOUT_PERCENT":"10",
      "ALLOWED_ORIGINS":"https://matbakh.app,http://localhost:5173"
    }' \
    --region "$REGION" \
    || echo "Failed to update $function_name configuration"
}

# Function to test Lambda function
test_lambda_function() {
  local function_name=$1
  echo "🧪 Testing Lambda function: $function_name"
  
  local test_payload='{"httpMethod": "GET", "path": "/health", "headers": {}, "body": null}'
  
  aws lambda invoke \
    --function-name "$function_name" \
    --payload "$test_payload" \
    --region "$REGION" \
    /tmp/test-response.json
  
  if [ $? -eq 0 ]; then
    echo "✅ $function_name test successful"
    cat /tmp/test-response.json
    echo ""
  else
    echo "❌ $function_name test failed"
    return 1
  fi
}

# Main enable execution
main() {
  echo "Starting Bedrock AI re-enablement procedure..."
  
  # Enable Lambda functions
  enable_lambda_function "$BEDROCK_FUNCTION"
  enable_lambda_function "$PROXY_FUNCTION"
  
  # Wait for functions to be ready
  echo "⏳ Waiting for functions to be ready..."
  sleep 10
  
  # Test functions
  test_lambda_function "$BEDROCK_FUNCTION"
  test_lambda_function "$PROXY_FUNCTION"
  
  # Remove emergency flags
  rm -f /tmp/bedrock-disabled-flags.json
  rm -f /tmp/bedrock-fallback-responses.json
  rm -f /tmp/bedrock-rollback-notification.txt
  
  echo ""
  echo "✅ Bedrock AI Agent re-enabled successfully!"
  echo ""
  echo "Next steps:"
  echo "1. Monitor system health closely"
  echo "2. Gradually increase rollout percentage"
  echo "3. Update feature flags as needed"
  echo "4. Test with real user requests"
}

# Confirmation and health check
echo "Checking system health before re-enabling..."

# Check if AWS credentials are working
aws sts get-caller-identity > /dev/null || {
  echo "❌ AWS credentials not configured properly"
  exit 1
}

# Check if functions exist
aws lambda get-function --function-name "$BEDROCK_FUNCTION" --region "$REGION" > /dev/null || {
  echo "❌ Bedrock function not found. Please deploy first."
  exit 1
}

aws lambda get-function --function-name "$PROXY_FUNCTION" --region "$REGION" > /dev/null || {
  echo "❌ Proxy function not found. Please deploy first."
  exit 1
}

echo "✅ Pre-flight checks passed"
echo ""
read -p "Proceed with re-enabling Bedrock AI? (yes/no): " confirmation

if [ "$confirmation" = "yes" ]; then
  main
else
  echo "Re-enablement cancelled."
  exit 1
fi