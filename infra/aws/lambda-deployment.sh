#!/bin/bash
set -euo pipefail

# Lambda Functions Deployment for Cognito Triggers
# Deploys Pre-SignUp and Post-Confirmation Lambda functions

PROJECT_NAME="matbakh.app"
AWS_PROFILE="matbakh-dev"
REGION="eu-central-1"

echo "⚡ Deploying Cognito Lambda Triggers..."
echo "Project: $PROJECT_NAME"
echo "Region: $REGION"
echo ""

# Set AWS profile and region
export AWS_PROFILE=$AWS_PROFILE
export AWS_DEFAULT_REGION=$REGION

# Load environment variables
if [ -f .env.iam ]; then
    source .env.iam
    echo "✅ Loaded IAM environment variables"
else
    echo "❌ .env.iam file not found. Run IAM deployment first."
    exit 1
fi

if [ -f .env.cognito ]; then
    source .env.cognito
    echo "✅ Loaded Cognito environment variables"
else
    echo "❌ .env.cognito file not found. Run Cognito deployment first."
    exit 1
fi

# Function to check if Lambda function exists
function_exists() {
    local function_name=$1
    aws lambda get-function --function-name "$function_name" > /dev/null 2>&1
}

# Function to create deployment package
create_deployment_package() {
    local function_name=$1
    local source_dir=$2
    local package_name="${function_name}-deployment.zip"
    
    echo "📦 Creating deployment package for $function_name..."
    
    # Create temporary directory
    local temp_dir="/tmp/${function_name}-build"
    rm -rf "$temp_dir"
    mkdir -p "$temp_dir"
    
    # Copy source files
    cp -r "$source_dir"/* "$temp_dir/"
    
    # Install dependencies
    cd "$temp_dir"
    
    # Create package.json if it doesn't exist
    if [ ! -f package.json ]; then
        cat > package.json << EOF
{
  "name": "$function_name",
  "version": "1.0.0",
  "description": "Cognito Lambda trigger for $PROJECT_NAME",
  "main": "index.js",
  "dependencies": {
    "aws-sdk": "^2.1400.0",
    "pg": "^8.11.0"
  }
}
EOF
    fi
    
    # Install production dependencies
    npm install --production --silent
    
    # Compile TypeScript if needed
    if [ -f "*.ts" ]; then
        echo "🔨 Compiling TypeScript..."
        npx tsc --target es2020 --module commonjs --outDir . *.ts 2>/dev/null || {
            echo "⚠️  TypeScript compilation failed, using JS files directly"
        }
    fi
    
    # Create ZIP package
    zip -r "$package_name" . -x "*.ts" "tsconfig.json" "package-lock.json" > /dev/null
    
    # Move package to project root
    mv "$package_name" "$(pwd)/../../../$package_name"
    
    cd - > /dev/null
    
    echo "✅ Deployment package created: $package_name"
    echo "$package_name"
}

# Function to deploy Lambda function
deploy_lambda_function() {
    local function_name=$1
    local role_arn=$2
    local handler=$3
    local description=$4
    local package_file=$5
    local timeout=${6:-30}
    local memory=${7:-256}
    
    echo "🚀 Deploying Lambda function: $function_name"
    
    if function_exists "$function_name"; then
        echo "⚠️  Function $function_name already exists, updating..."
        
        # Update function code
        aws lambda update-function-code \
            --function-name "$function_name" \
            --zip-file "fileb://$package_file" > /dev/null
        
        # Update function configuration
        aws lambda update-function-configuration \
            --function-name "$function_name" \
            --role "$role_arn" \
            --handler "$handler" \
            --timeout "$timeout" \
            --memory-size "$memory" \
            --environment "Variables={NODE_ENV=production,REGION=$REGION}" > /dev/null
        
        echo "✅ Function updated: $function_name"
    else
        # Create new function
        aws lambda create-function \
            --function-name "$function_name" \
            --runtime "nodejs18.x" \
            --role "$role_arn" \
            --handler "$handler" \
            --zip-file "fileb://$package_file" \
            --description "$description" \
            --timeout "$timeout" \
            --memory-size "$memory" \
            --environment "Variables={NODE_ENV=production,REGION=$REGION}" > /dev/null
        
        echo "✅ Function created: $function_name"
    fi
    
    # Get function ARN
    local function_arn=$(aws lambda get-function \
        --function-name "$function_name" \
        --query 'Configuration.FunctionArn' \
        --output text)
    
    echo "   ARN: $function_arn"
    echo "${function_name}_ARN=$function_arn" >> .env.lambda
    
    return 0
}

# Function to add Cognito trigger permissions
add_cognito_permissions() {
    local function_name=$1
    local user_pool_id=$2
    
    echo "🔐 Adding Cognito trigger permissions for $function_name..."
    
    # Remove existing permission if it exists
    aws lambda remove-permission \
        --function-name "$function_name" \
        --statement-id "cognito-trigger-permission" 2>/dev/null || true
    
    # Add permission for Cognito to invoke Lambda
    aws lambda add-permission \
        --function-name "$function_name" \
        --statement-id "cognito-trigger-permission" \
        --action "lambda:InvokeFunction" \
        --principal "cognito-idp.amazonaws.com" \
        --source-arn "arn:aws:cognito-idp:$REGION:$ACCOUNT_ID:userpool/$user_pool_id" > /dev/null
    
    echo "✅ Cognito permissions added for $function_name"
}

# Function to attach Lambda triggers to Cognito User Pool
attach_lambda_triggers() {
    local user_pool_id=$1
    local pre_signup_arn=$2
    local post_confirmation_arn=$3
    
    echo "🔗 Attaching Lambda triggers to Cognito User Pool..."
    
    aws cognito-idp update-user-pool \
        --user-pool-id "$user_pool_id" \
        --lambda-config "PreSignUp=$pre_signup_arn,PostConfirmation=$post_confirmation_arn"
    
    echo "✅ Lambda triggers attached to User Pool: $user_pool_id"
}

# Function to test Lambda function
test_lambda_function() {
    local function_name=$1
    local test_event=$2
    
    echo "🧪 Testing Lambda function: $function_name"
    
    local result=$(aws lambda invoke \
        --function-name "$function_name" \
        --payload "$test_event" \
        --output json \
        /tmp/lambda-test-output.json)
    
    local status_code=$(echo "$result" | jq -r '.StatusCode')
    
    if [ "$status_code" = "200" ]; then
        echo "✅ Test successful for $function_name"
        local response=$(cat /tmp/lambda-test-output.json)
        echo "   Response: $(echo $response | jq -c . 2>/dev/null || echo $response)"
    else
        echo "❌ Test failed for $function_name (Status: $status_code)"
        cat /tmp/lambda-test-output.json
        return 1
    fi
}

# Deploy Pre-SignUp Lambda
deploy_pre_signup_lambda() {
    echo "📝 Deploying Pre-SignUp Lambda..."
    
    local function_name="matbakh-cognito-pre-signup"
    local source_dir="infra/lambdas/cognito"
    
    # Create deployment package
    local package_file=$(create_deployment_package "$function_name" "$source_dir")
    
    # Deploy function
    deploy_lambda_function \
        "$function_name" \
        "$PRE_SIGNUP_ROLE_ARN" \
        "pre-signup.handler" \
        "Cognito Pre-SignUp trigger for $PROJECT_NAME" \
        "$package_file" \
        30 \
        256
    
    # Add Cognito permissions
    add_cognito_permissions "$function_name" "$USER_POOL_ID"
    
    # Test function
    local test_event='{
        "version": "1",
        "region": "'$REGION'",
        "userPoolId": "'$USER_POOL_ID'",
        "triggerSource": "PreSignUp_SignUp",
        "request": {
            "userAttributes": {
                "email": "test@example.com",
                "given_name": "Test",
                "family_name": "User"
            },
            "validationData": {}
        },
        "response": {}
    }'
    
    test_lambda_function "$function_name" "$test_event"
    
    # Clean up
    rm -f "$package_file"
}

# Deploy Post-Confirmation Lambda
deploy_post_confirmation_lambda() {
    echo "📧 Deploying Post-Confirmation Lambda..."
    
    local function_name="matbakh-cognito-post-confirmation"
    local source_dir="infra/lambdas/cognito"
    
    # Create deployment package
    local package_file=$(create_deployment_package "$function_name" "$source_dir")
    
    # Deploy function
    deploy_lambda_function \
        "$function_name" \
        "$POST_CONFIRMATION_ROLE_ARN" \
        "post-confirmation.handler" \
        "Cognito Post-Confirmation trigger for $PROJECT_NAME" \
        "$package_file" \
        60 \
        512
    
    # Add Cognito permissions
    add_cognito_permissions "$function_name" "$USER_POOL_ID"
    
    # Test function (without actual database/email operations)
    local test_event='{
        "version": "1",
        "region": "'$REGION'",
        "userPoolId": "'$USER_POOL_ID'",
        "triggerSource": "PostConfirmation_ConfirmSignUp",
        "request": {
            "userAttributes": {
                "email": "test@example.com",
                "given_name": "Test",
                "family_name": "User",
                "custom:user_role": "owner",
                "custom:locale": "de"
            },
            "userName": "test-user-id"
        },
        "response": {}
    }'
    
    echo "⚠️  Skipping Post-Confirmation test (requires RDS + SES setup)"
    # test_lambda_function "$function_name" "$test_event"
    
    # Clean up
    rm -f "$package_file"
}

# Validate deployment
validate_deployment() {
    echo "🔍 Validating Lambda deployment..."
    
    local functions=(
        "matbakh-cognito-pre-signup"
        "matbakh-cognito-post-confirmation"
    )
    
    for function_name in "${functions[@]}"; do
        if function_exists "$function_name"; then
            local state=$(aws lambda get-function \
                --function-name "$function_name" \
                --query 'Configuration.State' \
                --output text)
            
            if [ "$state" = "Active" ]; then
                echo "✅ Function active: $function_name"
            else
                echo "⚠️  Function not active: $function_name (State: $state)"
            fi
        else
            echo "❌ Function not found: $function_name"
            return 1
        fi
    done
    
    # Check Cognito User Pool Lambda configuration
    local lambda_config=$(aws cognito-idp describe-user-pool \
        --user-pool-id "$USER_POOL_ID" \
        --query 'UserPool.LambdaConfig' \
        --output json)
    
    if [ "$lambda_config" != "null" ] && [ "$lambda_config" != "{}" ]; then
        echo "✅ Cognito Lambda triggers configured:"
        echo "   $(echo $lambda_config | jq -c .)"
    else
        echo "❌ Cognito Lambda triggers not configured"
        return 1
    fi
    
    return 0
}

# Output summary
output_summary() {
    echo ""
    echo "🎉 Lambda deployment completed successfully!"
    echo ""
    echo "📊 Deployed Functions:"
    echo "====================="
    
    if [ -f .env.lambda ]; then
        source .env.lambda
        echo "Pre-SignUp Function:"
        echo "  Name: matbakh-cognito-pre-signup"
        echo "  ARN: ${matbakh_cognito_pre_signup_ARN:-'Not found'}"
        echo ""
        echo "Post-Confirmation Function:"
        echo "  Name: matbakh-cognito-post-confirmation"
        echo "  ARN: ${matbakh_cognito_post_confirmation_ARN:-'Not found'}"
    fi
    
    echo ""
    echo "📁 Generated Files:"
    echo "  - .env.lambda (Lambda function ARNs)"
    echo ""
    echo "🔗 AWS Console URLs:"
    echo "  - Lambda: https://$REGION.console.aws.amazon.com/lambda/home?region=$REGION#/functions"
    echo "  - Cognito: https://$REGION.console.aws.amazon.com/cognito/users/?region=$REGION#/pool/$USER_POOL_ID/triggers"
    echo ""
    echo "⚠️  Next Steps:"
    echo "  1. Test complete signup flow with real user"
    echo "  2. Monitor CloudWatch logs for any issues"
    echo "  3. Configure SES for email sending (if not done)"
    echo "  4. Set up RDS connection for profile creation"
    echo ""
}

# Main execution
main() {
    echo "🔧 Lambda Functions Deployment"
    echo "=============================="
    
    # Initialize environment file
    echo "# Lambda Function ARNs for Cognito Triggers" > .env.lambda
    echo "# Generated on $(date)" >> .env.lambda
    echo "" >> .env.lambda
    
    deploy_pre_signup_lambda
    echo ""
    
    deploy_post_confirmation_lambda
    echo ""
    
    # Load Lambda ARNs
    source .env.lambda
    
    # Attach triggers to Cognito
    attach_lambda_triggers \
        "$USER_POOL_ID" \
        "$matbakh_cognito_pre_signup_ARN" \
        "$matbakh_cognito_post_confirmation_ARN"
    echo ""
    
    validate_deployment
    echo ""
    
    output_summary
}

# Run main function
main "$@"