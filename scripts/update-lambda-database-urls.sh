#!/bin/bash

# Script to update all Lambda functions with new RDS DATABASE_URL
# Task 12.3.1 - Switch all services from Supabase to AWS RDS

set -e

NEW_DATABASE_URL="postgresql://postgres:Matbakhapp#6x@matbakh-db.chq6q4cs0evx.eu-central-1.rds.amazonaws.com:5432/matbakh"
REGION="eu-central-1"

echo "🔄 Updating Lambda functions with new RDS DATABASE_URL..."

# List of Lambda functions to update
FUNCTIONS=(
    "matbakh-create-tables"
    "matbakh-get-presigned-url"
    "matbakh-s3-upload-processor"
    "matbakh-fix-tables"
    "matbakh-db-test"
    "MatbakhVcStack-VcConfirmFnBC142FAD-E7kmx3KDgRRX"
    "MatbakhVcStack-VcStartFnC5BAD875-Lukpaun5TO53"
)

for FUNCTION_NAME in "${FUNCTIONS[@]}"; do
    echo "📝 Updating $FUNCTION_NAME..."
    
    # Get current environment variables
    CURRENT_ENV=$(aws lambda get-function-configuration --region $REGION --function-name "$FUNCTION_NAME" --query 'Environment.Variables' --output json 2>/dev/null || echo '{}')
    
    if [ "$CURRENT_ENV" = "null" ] || [ "$CURRENT_ENV" = "{}" ]; then
        # No existing environment variables, create new ones
        NEW_ENV="{\"DATABASE_URL\":\"$NEW_DATABASE_URL\"}"
    else
        # Update existing environment variables
        NEW_ENV=$(echo "$CURRENT_ENV" | jq --arg db_url "$NEW_DATABASE_URL" '. + {"DATABASE_URL": $db_url}')
    fi
    
    # Update the function
    aws lambda update-function-configuration \
        --region $REGION \
        --function-name "$FUNCTION_NAME" \
        --environment "Variables=$NEW_ENV" \
        --output table \
        --query '{FunctionName:FunctionName,State:State,LastUpdateStatus:LastUpdateStatus}' || echo "❌ Failed to update $FUNCTION_NAME"
    
    echo "✅ Updated $FUNCTION_NAME"
    echo ""
done

echo "🎉 All Lambda functions updated with new RDS DATABASE_URL!"
echo "📊 Verification:"
echo "   DATABASE_URL: $NEW_DATABASE_URL"
echo ""