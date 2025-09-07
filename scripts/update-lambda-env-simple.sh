#!/bin/bash

# Simple approach to update Lambda environment variables
# Task 12.3.1 - Switch all services from Supabase to AWS RDS

set -e

NEW_DATABASE_URL="postgresql://postgres:Matbakhapp#6x@matbakh-db.chq6q4cs0evx.eu-central-1.rds.amazonaws.com:5432/matbakh"
REGION="eu-central-1"

echo "🔄 Updating Lambda functions with new RDS DATABASE_URL..."

# Function to update a single Lambda
update_lambda() {
    local FUNCTION_NAME=$1
    echo "📝 Updating $FUNCTION_NAME..."
    
    # Create a temporary JSON file for the environment variables
    TEMP_FILE=$(mktemp)
    
    # Get current environment variables and update DATABASE_URL
    aws lambda get-function-configuration \
        --region $REGION \
        --function-name "$FUNCTION_NAME" \
        --query 'Environment.Variables' \
        --output json > "$TEMP_FILE" 2>/dev/null || echo '{}' > "$TEMP_FILE"
    
    # Update the DATABASE_URL in the JSON
    jq --arg db_url "$NEW_DATABASE_URL" '. + {"DATABASE_URL": $db_url}' "$TEMP_FILE" > "${TEMP_FILE}.new"
    
    # Update the function using the JSON file
    aws lambda update-function-configuration \
        --region $REGION \
        --function-name "$FUNCTION_NAME" \
        --environment file://"${TEMP_FILE}.new" \
        --output table \
        --query '{FunctionName:FunctionName,State:State,LastUpdateStatus:LastUpdateStatus}' || echo "❌ Failed to update $FUNCTION_NAME"
    
    # Clean up
    rm -f "$TEMP_FILE" "${TEMP_FILE}.new"
    
    echo "✅ Updated $FUNCTION_NAME"
    echo ""
}

# Update all functions
update_lambda "matbakh-create-tables"
update_lambda "matbakh-get-presigned-url"
update_lambda "matbakh-s3-upload-processor"
update_lambda "matbakh-fix-tables"
update_lambda "matbakh-db-test"
update_lambda "MatbakhVcStack-VcConfirmFnBC142FAD-E7kmx3KDgRRX"
update_lambda "MatbakhVcStack-VcStartFnC5BAD875-Lukpaun5TO53"

echo "🎉 All Lambda functions updated with new RDS DATABASE_URL!"
echo "📊 Verification:"
echo "   DATABASE_URL: $NEW_DATABASE_URL"
echo ""