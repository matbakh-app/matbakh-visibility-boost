#!/bin/bash
set -euo pipefail

# Deploy and Test Lambda Function for RDS Connectivity
# Phase A2.4 - Infrastructure Completion

REGION=${AWS_REGION:-eu-central-1}
PROFILE=${AWS_PROFILE:-matbakh-dev}
FUNCTION_NAME="matbakh-db-test"

echo "🚀 DEPLOYING TEST LAMBDA FUNCTION"
echo "================================="
echo "Region: $REGION"
echo "Profile: $PROFILE"
echo "Function Name: $FUNCTION_NAME"
echo ""

# Load configuration
source .env.secrets

# Step 1: Check if function exists
echo "🔍 Step 1: Checking if function exists..."
if aws lambda get-function --function-name "$FUNCTION_NAME" --region "$REGION" --profile "$PROFILE" > /dev/null 2>&1; then
    echo "⚠️  Function '$FUNCTION_NAME' already exists"
    UPDATE_MODE=true
else
    echo "🔧 Creating new function..."
    UPDATE_MODE=false
fi

# Step 2: Prepare subnet IDs array
echo ""
echo "🌐 Step 2: Preparing VPC configuration..."
IFS=' ' read -ra SUBNET_ARRAY <<< "$LAMBDA_SUBNET_IDS"
SUBNET_IDS_CSV=$(IFS=','; echo "${SUBNET_ARRAY[*]}")
echo "✅ Subnets: ${SUBNET_ARRAY[*]}"
echo "✅ Security Group: $LAMBDA_SECURITY_GROUP_ID"
echo "✅ Subnet CSV: $SUBNET_IDS_CSV"

# Step 3: Deploy or update function
echo ""
if [ "$UPDATE_MODE" = true ]; then
    echo "🔄 Step 3: Updating existing function..."
    
    # Update function code
    aws lambda update-function-code \
        --function-name "$FUNCTION_NAME" \
        --zip-file fileb://lambda-functions/db-test/db-test-function.zip \
        --region "$REGION" --profile "$PROFILE"
    
    # Update function configuration
    aws lambda update-function-configuration \
        --function-name "$FUNCTION_NAME" \
        --runtime nodejs20.x \
        --handler index.handler \
        --role "$LAMBDA_EXECUTION_ROLE_ARN" \
        --timeout 30 \
        --memory-size 256 \
        --environment Variables="{DB_SECRET_NAME=matbakh-db-postgres}" \
        --layers "$POSTGRESQL_LAYER_ARN" \
        --vpc-config SubnetIds="$SUBNET_IDS_CSV",SecurityGroupIds="$LAMBDA_SECURITY_GROUP_ID" \
        --region "$REGION" --profile "$PROFILE"
    
    echo "✅ Function updated"
else
    echo "🔧 Step 3: Creating new function..."
    
    aws lambda create-function \
        --function-name "$FUNCTION_NAME" \
        --runtime nodejs20.x \
        --role "$LAMBDA_EXECUTION_ROLE_ARN" \
        --handler index.handler \
        --zip-file fileb://lambda-functions/db-test/db-test-function.zip \
        --description "Test function for RDS connectivity via Secrets Manager" \
        --timeout 30 \
        --memory-size 256 \
        --environment Variables="{DB_SECRET_NAME=matbakh-db-postgres}" \
        --layers "$POSTGRESQL_LAYER_ARN" \
        --vpc-config SubnetIds="$SUBNET_IDS_CSV",SecurityGroupIds="$LAMBDA_SECURITY_GROUP_ID" \
        --region "$REGION" --profile "$PROFILE"
    
    echo "✅ Function created"
fi

# Step 4: Wait for function to be ready
echo ""
echo "⏳ Step 4: Waiting for function to be ready..."
aws lambda wait function-updated --function-name "$FUNCTION_NAME" --region "$REGION" --profile "$PROFILE"
echo "✅ Function is ready"

# Step 5: Test function invocation
echo ""
echo "🧪 Step 5: Testing function invocation..."
echo "📤 Invoking Lambda function..."

# Create test event
TEST_EVENT='{"test": true, "message": "RDS connectivity test"}'

# Invoke function
INVOKE_RESULT=$(aws lambda invoke \
    --function-name "$FUNCTION_NAME" \
    --cli-binary-format raw-in-base64-out \
    --payload "$TEST_EVENT" \
    --region "$REGION" --profile "$PROFILE" \
    response.json)

echo "📋 Invocation result:"
echo "$INVOKE_RESULT" | jq .

# Step 6: Check response
echo ""
echo "📄 Step 6: Checking response..."
if [ -f response.json ]; then
    echo "📊 Function response:"
    cat response.json | jq .
    
    # Check if successful
    STATUS_CODE=$(cat response.json | jq -r '.statusCode // empty')
    if [ "$STATUS_CODE" = "200" ]; then
        echo ""
        echo "✅ SUCCESS: Database connection test passed!"
        
        # Extract database info
        echo "📋 Database Information:"
        cat response.json | jq -r '.body' | jq -r '.data.version.version' | head -1
        echo "📊 Tables: $(cat response.json | jq -r '.body' | jq -r '.data.tableCount') tables found"
        echo "🚩 Feature Flags: $(cat response.json | jq -r '.body' | jq -r '.data.featureFlags | length') flags configured"
        
    else
        echo ""
        echo "❌ FAILED: Database connection test failed"
        echo "📋 Error details:"
        cat response.json | jq -r '.body' | jq -r '.error // "Unknown error"'
    fi
else
    echo "❌ No response file generated"
fi

# Step 7: Check CloudWatch logs
echo ""
echo "📝 Step 7: Checking CloudWatch logs..."
LOG_GROUP="/aws/lambda/$FUNCTION_NAME"

# Wait a moment for logs to appear
sleep 5

# Get latest log stream
LATEST_STREAM=$(aws logs describe-log-streams \
    --log-group-name "$LOG_GROUP" \
    --order-by LastEventTime \
    --descending \
    --max-items 1 \
    --region "$REGION" --profile "$PROFILE" \
    --query 'logStreams[0].logStreamName' --output text 2>/dev/null || echo "")

if [ -n "$LATEST_STREAM" ] && [ "$LATEST_STREAM" != "None" ]; then
    echo "📋 Latest logs from $LATEST_STREAM:"
    aws logs get-log-events \
        --log-group-name "$LOG_GROUP" \
        --log-stream-name "$LATEST_STREAM" \
        --region "$REGION" --profile "$PROFILE" \
        --query 'events[-10:].message' --output text
else
    echo "⚠️  No log streams found yet (may take a few minutes)"
fi

# Step 8: Create API Gateway integration (optional)
echo ""
echo "🌐 Step 8: Creating API Gateway integration..."
API_NAME="matbakh-db-test-api"

# Check if API exists
API_ID=$(aws apigateway get-rest-apis \
    --region "$REGION" --profile "$PROFILE" \
    --query "items[?name=='$API_NAME'].id" --output text 2>/dev/null || echo "")

if [ -n "$API_ID" ] && [ "$API_ID" != "None" ]; then
    echo "⚠️  API Gateway '$API_NAME' already exists: $API_ID"
else
    echo "🔧 Creating API Gateway..."
    API_ID=$(aws apigateway create-rest-api \
        --name "$API_NAME" \
        --description "Test API for RDS connectivity" \
        --region "$REGION" --profile "$PROFILE" \
        --query 'id' --output text)
    
    echo "✅ API Gateway created: $API_ID"
    
    # Get root resource
    ROOT_RESOURCE_ID=$(aws apigateway get-resources \
        --rest-api-id "$API_ID" \
        --region "$REGION" --profile "$PROFILE" \
        --query 'items[0].id' --output text)
    
    # Create test resource
    RESOURCE_ID=$(aws apigateway create-resource \
        --rest-api-id "$API_ID" \
        --parent-id "$ROOT_RESOURCE_ID" \
        --path-part "test" \
        --region "$REGION" --profile "$PROFILE" \
        --query 'id' --output text)
    
    # Create GET method
    aws apigateway put-method \
        --rest-api-id "$API_ID" \
        --resource-id "$RESOURCE_ID" \
        --http-method GET \
        --authorization-type NONE \
        --region "$REGION" --profile "$PROFILE"
    
    # Create Lambda integration
    LAMBDA_ARN="arn:aws:lambda:$REGION:$(aws sts get-caller-identity --query Account --output text):function:$FUNCTION_NAME"
    
    aws apigateway put-integration \
        --rest-api-id "$API_ID" \
        --resource-id "$RESOURCE_ID" \
        --http-method GET \
        --type AWS_PROXY \
        --integration-http-method POST \
        --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/$LAMBDA_ARN/invocations" \
        --region "$REGION" --profile "$PROFILE"
    
    # Add Lambda permission
    aws lambda add-permission \
        --function-name "$FUNCTION_NAME" \
        --statement-id "api-gateway-invoke" \
        --action lambda:InvokeFunction \
        --principal apigateway.amazonaws.com \
        --source-arn "arn:aws:execute-api:$REGION:$(aws sts get-caller-identity --query Account --output text):$API_ID/*/*" \
        --region "$REGION" --profile "$PROFILE"
    
    # Deploy API
    aws apigateway create-deployment \
        --rest-api-id "$API_ID" \
        --stage-name "test" \
        --region "$REGION" --profile "$PROFILE"
    
    echo "✅ API Gateway deployed"
    echo "🔗 Test URL: https://$API_ID.execute-api.$REGION.amazonaws.com/test/test"
fi

# Step 9: Save final configuration
echo ""
echo "💾 Step 9: Saving final configuration..."

cat >> .env.secrets << EOF

# Lambda Function Configuration
LAMBDA_FUNCTION_NAME=$FUNCTION_NAME
LAMBDA_FUNCTION_ARN=arn:aws:lambda:$REGION:$(aws sts get-caller-identity --query Account --output text):function:$FUNCTION_NAME

# API Gateway Configuration
API_GATEWAY_ID=$API_ID
API_GATEWAY_URL=https://$API_ID.execute-api.$REGION.amazonaws.com/test/test
EOF

# Cleanup
rm -f response.json

echo "✅ Configuration updated in .env.secrets"

echo ""
echo "🎉 LAMBDA FUNCTION DEPLOYMENT COMPLETE"
echo "====================================="
echo ""
echo "✅ Function Name: $FUNCTION_NAME"
echo "✅ Runtime: Node.js 20.x"
echo "✅ Memory: 256 MB"
echo "✅ Timeout: 30 seconds"
echo "✅ VPC: Configured with private subnets"
echo "✅ Layer: PostgreSQL client libraries"
echo ""
echo "🔗 Test URLs:"
echo "   Lambda Console: https://console.aws.amazon.com/lambda/home?region=$REGION#/functions/$FUNCTION_NAME"
echo "   API Gateway: https://$API_ID.execute-api.$REGION.amazonaws.com/test/test"
echo ""
echo "🧪 Test Commands:"
echo "   aws lambda invoke --function-name $FUNCTION_NAME --payload '{}' response.json"
echo "   curl https://$API_ID.execute-api.$REGION.amazonaws.com/test/test"
echo ""
echo "🚀 Next Steps:"
echo "=============="
echo "1. A2.5: Create deployment structure"
echo "2. Test API Gateway endpoint"
echo "3. Monitor CloudWatch logs"
echo "4. Prepare for production deployment"