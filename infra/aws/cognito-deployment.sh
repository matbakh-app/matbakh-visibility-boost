#!/bin/bash
set -euo pipefail

# Cognito User Pool Deployment Script
# Phase A1: Cognito Migration Implementation

PROJECT_NAME="matbakh.app"
AWS_PROFILE="matbakh-dev"
REGION="eu-central-1"
USER_POOL_NAME="MatbakhAppUserPool"
DOMAIN_PREFIX="matbakh-auth"

echo "🚀 Starting Cognito User Pool deployment for ${PROJECT_NAME}..."

# Set AWS profile and region
export AWS_PROFILE=$AWS_PROFILE
export AWS_DEFAULT_REGION=$REGION

# Function to check if AWS CLI is configured
check_aws_config() {
    if ! aws sts get-caller-identity > /dev/null 2>&1; then
        echo "❌ AWS CLI not configured or invalid credentials"
        echo "Please run: aws configure --profile $AWS_PROFILE"
        exit 1
    fi
    
    echo "✅ AWS CLI configured for profile: $AWS_PROFILE"
    aws sts get-caller-identity --query 'Account' --output text
}

# Function to create User Pool
create_user_pool() {
    echo "📝 Creating Cognito User Pool: $USER_POOL_NAME"
    
    USER_POOL_ID=$(aws cognito-idp create-user-pool \
        --pool-name "$USER_POOL_NAME" \
        --cli-input-json file://infra/aws/cognito-user-pool.json \
        --query 'UserPool.Id' \
        --output text)
    
    if [ -z "$USER_POOL_ID" ]; then
        echo "❌ Failed to create User Pool"
        exit 1
    fi
    
    echo "✅ User Pool created: $USER_POOL_ID"
    echo "USER_POOL_ID=$USER_POOL_ID" >> .env.cognito
}

# Function to create User Pool Client
create_user_pool_client() {
    echo "📱 Creating User Pool Client..."
    
    USER_POOL_CLIENT_ID=$(aws cognito-idp create-user-pool-client \
        --user-pool-id "$USER_POOL_ID" \
        --client-name "matbakh-web-client" \
        --generate-secret \
        --explicit-auth-flows "ADMIN_NO_SRP_AUTH" "USER_PASSWORD_AUTH" "ALLOW_USER_SRP_AUTH" "ALLOW_REFRESH_TOKEN_AUTH" \
        --supported-identity-providers "COGNITO" \
        --callback-urls "https://matbakh.app/auth/callback" "http://localhost:3000/auth/callback" \
        --logout-urls "https://matbakh.app/auth/logout" "http://localhost:3000/auth/logout" \
        --allowed-o-auth-flows "code" "implicit" \
        --allowed-o-auth-scopes "openid" "email" "profile" \
        --allowed-o-auth-flows-user-pool-client \
        --read-attributes "email" "given_name" "family_name" "phone_number" "custom:user_role" "custom:locale" "custom:profile_complete" "custom:onboarding_step" "custom:business_id" \
        --write-attributes "given_name" "family_name" "phone_number" "custom:user_role" "custom:locale" "custom:profile_complete" "custom:onboarding_step" "custom:business_id" \
        --query 'UserPoolClient.ClientId' \
        --output text)
    
    if [ -z "$USER_POOL_CLIENT_ID" ]; then
        echo "❌ Failed to create User Pool Client"
        exit 1
    fi
    
    echo "✅ User Pool Client created: $USER_POOL_CLIENT_ID"
    echo "USER_POOL_CLIENT_ID=$USER_POOL_CLIENT_ID" >> .env.cognito
    
    # Get client secret
    USER_POOL_CLIENT_SECRET=$(aws cognito-idp describe-user-pool-client \
        --user-pool-id "$USER_POOL_ID" \
        --client-id "$USER_POOL_CLIENT_ID" \
        --query 'UserPoolClient.ClientSecret' \
        --output text)
    
    echo "USER_POOL_CLIENT_SECRET=$USER_POOL_CLIENT_SECRET" >> .env.cognito
}

# Function to create User Pool Domain
create_user_pool_domain() {
    echo "🌐 Creating User Pool Domain: $DOMAIN_PREFIX"
    
    aws cognito-idp create-user-pool-domain \
        --user-pool-id "$USER_POOL_ID" \
        --domain "$DOMAIN_PREFIX" > /dev/null
    
    DOMAIN_URL="https://${DOMAIN_PREFIX}.auth.${REGION}.amazoncognito.com"
    echo "✅ User Pool Domain created: $DOMAIN_URL"
    echo "DOMAIN_URL=$DOMAIN_URL" >> .env.cognito
}

# Function to deploy Lambda triggers
deploy_lambda_triggers() {
    echo "⚡ Deploying Lambda triggers..."
    
    # Create deployment package for pre-signup trigger
    cd infra/lambdas/cognito
    npm install --production
    zip -r ../../../pre-signup-trigger.zip . -x "*.ts" "tsconfig.json" "package-lock.json"
    cd ../../..
    
    # Create pre-signup Lambda function
    PRE_SIGNUP_FUNCTION_ARN=$(aws lambda create-function \
        --function-name "matbakh-cognito-pre-signup" \
        --runtime "nodejs18.x" \
        --role "arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):role/MatbakhLambdaExecutionRole" \
        --handler "pre-signup.handler" \
        --zip-file "fileb://pre-signup-trigger.zip" \
        --timeout 30 \
        --memory-size 256 \
        --environment "Variables={NODE_ENV=production}" \
        --query 'FunctionArn' \
        --output text)
    
    echo "✅ Pre-SignUp Lambda created: $PRE_SIGNUP_FUNCTION_ARN"
    
    # Create post-confirmation Lambda function
    POST_CONFIRMATION_FUNCTION_ARN=$(aws lambda create-function \
        --function-name "matbakh-cognito-post-confirmation" \
        --runtime "nodejs18.x" \
        --role "arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):role/MatbakhLambdaExecutionRole" \
        --handler "post-confirmation.handler" \
        --zip-file "fileb://pre-signup-trigger.zip" \
        --timeout 60 \
        --memory-size 512 \
        --environment "Variables={NODE_ENV=production}" \
        --query 'FunctionArn' \
        --output text)
    
    echo "✅ Post-Confirmation Lambda created: $POST_CONFIRMATION_FUNCTION_ARN"
    
    # Attach triggers to User Pool
    aws cognito-idp update-user-pool \
        --user-pool-id "$USER_POOL_ID" \
        --lambda-config "PreSignUp=$PRE_SIGNUP_FUNCTION_ARN,PostConfirmation=$POST_CONFIRMATION_FUNCTION_ARN"
    
    echo "✅ Lambda triggers attached to User Pool"
    
    # Clean up
    rm -f pre-signup-trigger.zip
}

# Function to create test user
create_test_user() {
    echo "👤 Creating test user..."
    
    TEST_EMAIL="test@matbakh.app"
    TEMP_PASSWORD="TempPass123!"
    
    aws cognito-idp admin-create-user \
        --user-pool-id "$USER_POOL_ID" \
        --username "$TEST_EMAIL" \
        --user-attributes "Name=email,Value=$TEST_EMAIL" "Name=given_name,Value=Test" "Name=family_name,Value=User" "Name=custom:user_role,Value=owner" "Name=custom:locale,Value=de" \
        --temporary-password "$TEMP_PASSWORD" \
        --message-action "SUPPRESS" > /dev/null
    
    echo "✅ Test user created: $TEST_EMAIL"
    echo "TEST_USER_EMAIL=$TEST_EMAIL" >> .env.cognito
    echo "TEST_USER_TEMP_PASSWORD=$TEMP_PASSWORD" >> .env.cognito
}

# Function to generate test JWT
generate_test_jwt() {
    echo "🔑 Generating test JWT..."
    
    # This would require the user to set a permanent password first
    # For now, we'll document the JWT structure
    cat > test-jwt-structure.json << EOF
{
  "sub": "user-uuid-here",
  "aud": "$USER_POOL_CLIENT_ID",
  "cognito:groups": [],
  "email_verified": true,
  "iss": "https://cognito-idp.$REGION.amazonaws.com/$USER_POOL_ID",
  "cognito:username": "test@matbakh.app",
  "custom:user_role": "owner",
  "custom:locale": "de",
  "custom:profile_complete": "false",
  "custom:onboarding_step": "0",
  "custom:business_id": "",
  "given_name": "Test",
  "family_name": "User",
  "aud": "$USER_POOL_CLIENT_ID",
  "event_id": "event-uuid-here",
  "token_use": "id",
  "auth_time": 1693234567,
  "exp": 1693238167,
  "iat": 1693234567,
  "email": "test@matbakh.app"
}
EOF
    
    echo "✅ JWT structure documented in test-jwt-structure.json"
}

# Function to create user import template
create_import_template() {
    echo "📋 Creating user import template..."
    
    cat > user-import-template.csv << 'EOF'
cognito:username,cognito:mfa_enabled,email_verified,email,given_name,family_name,custom:user_role,custom:locale,custom:profile_complete,custom:onboarding_step,custom:business_id,custom:supabase_id
test1@example.com,FALSE,TRUE,test1@example.com,John,Doe,owner,de,false,0,,uuid-from-supabase-1
test2@example.com,FALSE,TRUE,test2@example.com,Jane,Smith,partner,en,true,5,business-uuid-123,uuid-from-supabase-2
admin@example.com,FALSE,TRUE,admin@example.com,Admin,User,admin,de,true,8,,uuid-from-supabase-3
EOF
    
    echo "✅ User import template created: user-import-template.csv"
}

# Function to output summary
output_summary() {
    echo ""
    echo "🎉 Cognito User Pool deployment completed successfully!"
    echo ""
    echo "📊 Deployment Summary:"
    echo "====================="
    echo "User Pool ID: $USER_POOL_ID"
    echo "User Pool Client ID: $USER_POOL_CLIENT_ID"
    echo "Domain URL: $DOMAIN_URL"
    echo "Region: $REGION"
    echo ""
    echo "📁 Generated Files:"
    echo "- .env.cognito (environment variables)"
    echo "- test-jwt-structure.json (JWT token structure)"
    echo "- user-import-template.csv (bulk import template)"
    echo ""
    echo "🔗 Useful URLs:"
    echo "- Cognito Console: https://$REGION.console.aws.amazon.com/cognito/users/?region=$REGION#/pool/$USER_POOL_ID"
    echo "- Hosted UI: $DOMAIN_URL/login?client_id=$USER_POOL_CLIENT_ID&response_type=code&scope=openid+email+profile&redirect_uri=https://matbakh.app/auth/callback"
    echo ""
    echo "⚠️  Next Steps:"
    echo "1. Update frontend configuration with new Cognito settings"
    echo "2. Test user registration and login flows"
    echo "3. Import existing users from Supabase"
    echo "4. Configure Google Identity Provider for social login"
    echo ""
}

# Main execution
main() {
    echo "🔧 Phase A1: Cognito Migration - User Pool Setup"
    echo "================================================"
    
    check_aws_config
    
    # Check if User Pool already exists
    if aws cognito-idp list-user-pools --max-items 50 --query "UserPools[?Name=='$USER_POOL_NAME'].Id" --output text | grep -q .; then
        echo "⚠️  User Pool '$USER_POOL_NAME' already exists"
        USER_POOL_ID=$(aws cognito-idp list-user-pools --max-items 50 --query "UserPools[?Name=='$USER_POOL_NAME'].Id" --output text)
        echo "Using existing User Pool: $USER_POOL_ID"
    else
        create_user_pool
    fi
    
    create_user_pool_client
    create_user_pool_domain
    # deploy_lambda_triggers  # Commented out for now - requires IAM role setup
    create_test_user
    generate_test_jwt
    create_import_template
    
    output_summary
}

# Run main function
main "$@"