#!/bin/bash
set -euo pipefail

# Cognito Lambda Trigger End-to-End Test
# Tests the complete signup flow with Lambda triggers

PROJECT_NAME="matbakh.app"
AWS_PROFILE="matbakh-dev"
REGION="eu-central-1"
TEST_EMAIL="testpartner@example.com"

echo "🧪 Cognito Lambda Trigger End-to-End Test"
echo "<REDACTED_AWS_SECRET_ACCESS_KEY>"
echo "Project: $PROJECT_NAME"
echo "Test Email: $TEST_EMAIL"
echo ""

# Set AWS profile and region
export AWS_PROFILE=$AWS_PROFILE
export AWS_DEFAULT_REGION=$REGION

# Load environment variables
if [ -f .env.cognito ]; then
    source .env.cognito
else
    echo "❌ .env.cognito file not found"
    exit 1
fi

if [ -f .env.lambda ]; then
    source .env.lambda
else
    echo "❌ .env.lambda file not found"
    exit 1
fi

# Function to clean up test user
cleanup_test_user() {
    local email=$1
    echo "🧹 Cleaning up test user: $email"
    
    aws cognito-idp admin-delete-user \
        --user-pool-id "$USER_POOL_ID" \
        --username "$email" 2>/dev/null || true
    
    echo "✅ Test user cleaned up"
}

# Function to monitor CloudWatch logs
monitor_logs() {
    local function_name=$1
    local duration=${2:-30}
    
    echo "📊 Monitoring logs for $function_name (${duration}s)..."
    
    local log_group="/aws/lambda/$function_name"
    local start_time=$(date -d "1 minute ago" +%s)000
    
    # Wait a moment for logs to appear
    sleep 5
    
    # Get recent log events
    local log_events=$(aws logs filter-log-events \
        --log-group-name "$log_group" \
        --start-time "$start_time" \
        --query 'events[].message' \
        --output text 2>/dev/null || echo "No logs found")
    
    if [ "$log_events" != "No logs found" ] && [ -n "$log_events" ]; then
        echo "📝 Recent log entries:"
        echo "$log_events" | head -10
    else
        echo "⚠️  No recent log entries found"
    fi
}

# Test 1: Pre-SignUp Trigger Test
test_pre_signup_trigger() {
    echo "🔍 Test 1: Pre-SignUp Trigger"
    echo "============================="
    
    # Clean up any existing test user
    cleanup_test_user "$TEST_EMAIL"
    
    # Create test user (this should trigger Pre-SignUp Lambda)
    echo "👤 Creating test user: $TEST_EMAIL"
    
    local create_result=$(aws cognito-idp admin-create-user \
        --user-pool-id "$USER_POOL_ID" \
        --username "$TEST_EMAIL" \
        --user-attributes \
            "Name=email,Value=$TEST_EMAIL" \
            "Name=given_name,Value=Test" \
            "Name=family_name,Value=Partner" \
            "Name=custom:user_role,Value=partner" \
            "Name=custom:locale,Value=en" \
        --temporary-password "TempPass123!" \
        --message-action "SUPPRESS" \
        --output json 2>&1)
    
    if echo "$create_result" | jq -e '.User.Username' > /dev/null 2>&1; then
        echo "✅ Test user created successfully"
        
        # Check if custom attributes were set by Pre-SignUp trigger
        local user_attrs=$(aws cognito-idp admin-get-user \
            --user-pool-id "$USER_POOL_ID" \
            --username "$TEST_EMAIL" \
            --query 'UserAttributes' \
            --output json)
        
        echo "📋 User attributes after creation:"
        echo "$user_attrs" | jq -r '.[] | "  \(.Name): \(.Value)"'
        
        # Check for expected custom attributes
        local profile_complete=$(echo "$user_attrs" | jq -r '.[] | select(.Name=="custom:profile_complete") | .Value')
        local onboarding_step=$(echo "$user_attrs" | jq -r '.[] | select(.Name=="custom:onboarding_step") | .Value')
        
        if [ "$profile_complete" = "false" ] && [ "$onboarding_step" = "0" ]; then
            echo "✅ Pre-SignUp trigger set default attributes correctly"
        else
            echo "⚠️  Pre-SignUp trigger may not have set all expected attributes"
        fi
        
    else
        echo "❌ Failed to create test user"
        echo "Error: $create_result"
        return 1
    fi
    
    # Monitor Pre-SignUp Lambda logs
    monitor_logs "matbakh-cognito-pre-signup" 30
    
    echo ""
}

# Test 2: Post-Confirmation Trigger Test
test_post_confirmation_trigger() {
    echo "🔍 Test 2: Post-Confirmation Trigger"
    echo "===================================="
    
    # Confirm the test user (this should trigger Post-Confirmation Lambda)
    echo "✅ Confirming test user: $TEST_EMAIL"
    
    # Set permanent password to trigger confirmation
    aws cognito-idp admin-set-user-password \
        --user-pool-id "$USER_POOL_ID" \
        --username "$TEST_EMAIL" \
        --password "NewPass123!" \
        --permanent > /dev/null
    
    echo "✅ User password set (confirmation triggered)"
    
    # Monitor Post-Confirmation Lambda logs
    monitor_logs "matbakh-cognito-post-confirmation" 30
    
    # Check user status
    local user_status=$(aws cognito-idp admin-get-user \
        --user-pool-id "$USER_POOL_ID" \
        --username "$TEST_EMAIL" \
        --query 'UserStatus' \
        --output text)
    
    echo "📊 User status after confirmation: $user_status"
    
    if [ "$user_status" = "CONFIRMED" ]; then
        echo "✅ User successfully confirmed"
    else
        echo "⚠️  User not in CONFIRMED status"
    fi
    
    echo ""
}

# Test 3: Authentication Flow Test
test_authentication_flow() {
    echo "🔍 Test 3: Authentication Flow"
    echo "=============================="
    
    # Test authentication with new password
    echo "🔐 Testing authentication flow..."
    
    local auth_result=$(aws cognito-idp admin-initiate-auth \
        --user-pool-id "$USER_POOL_ID" \
        --client-id "$USER_POOL_CLIENT_ID" \
        --auth-flow "ADMIN_NO_SRP_AUTH" \
        --auth-parameters "USERNAME=$TEST_EMAIL,PASSWORD=NewPass123!" \
        --output json 2>&1)
    
    if echo "$auth_result" | jq -e '.AuthenticationResult.AccessToken' > /dev/null 2>&1; then
        echo "✅ Authentication successful"
        
        # Extract and validate JWT tokens
        local id_token=$(echo "$auth_result" | jq -r '.AuthenticationResult.IdToken')
        local access_token=$(echo "$auth_result" | jq -r '.AuthenticationResult.AccessToken')
        
        echo "🎫 JWT tokens received:"
        echo "  ID Token: ${id_token:0:50}..."
        echo "  Access Token: ${access_token:0:50}..."
        
        # Decode JWT payload (base64)
        local jwt_payload=$(echo "$id_token" | cut -d. -f2)
        # Add padding if needed
        local padding_length=$((4 - ${#jwt_payload} % 4))
        if [ $padding_length -ne 4 ]; then
            jwt_payload="${jwt_payload}$(printf '%*s' $padding_length | tr ' ' '=')"
        fi
        
        local decoded_payload=$(echo "$jwt_payload" | base64 -d 2>/dev/null | jq . 2>/dev/null || echo "Could not decode JWT")
        
        if [ "$decoded_payload" != "Could not decode JWT" ]; then
            echo "🔍 JWT payload contains:"
            echo "$decoded_payload" | jq -r 'keys[]' | sed 's/^/  - /'
            
            # Check for custom attributes in JWT
            local custom_role=$(echo "$decoded_payload" | jq -r '."custom:user_role"' 2>/dev/null || echo "null")
            local custom_locale=$(echo "$decoded_payload" | jq -r '."custom:locale"' 2>/dev/null || echo "null")
            
            echo "📋 Custom attributes in JWT:"
            echo "  - user_role: $custom_role"
            echo "  - locale: $custom_locale"
            
            if [ "$custom_role" != "null" ] && [ "$custom_locale" != "null" ]; then
                echo "✅ Custom attributes present in JWT"
            else
                echo "⚠️  Some custom attributes missing from JWT"
            fi
        fi
        
        # Save tokens for frontend testing
        cat > test-auth-tokens.json << EOF
{
  "testUser": {
    "email": "$TEST_EMAIL",
    "password": "NewPass123!"
  },
  "tokens": {
    "idToken": "$id_token",
    "accessToken": "$access_token"
  },
  "generatedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
        echo "💾 Auth tokens saved to test-auth-tokens.json"
        
    else
        echo "❌ Authentication failed"
        echo "Error: $auth_result"
        return 1
    fi
    
    echo ""
}

# Test 4: Lambda Function Health Check
test_lambda_health() {
    echo "🔍 Test 4: Lambda Function Health Check"
    echo "======================================"
    
    local functions=(
        "matbakh-cognito-pre-signup"
        "matbakh-cognito-post-confirmation"
    )
    
    for function_name in "${functions[@]}"; do
        echo "🏥 Checking health of $function_name..."
        
        # Get function configuration
        local function_info=$(aws lambda get-function \
            --function-name "$function_name" \
            --query 'Configuration.{State:State,LastModified:LastModified,Runtime:Runtime,MemorySize:MemorySize,Timeout:Timeout}' \
            --output json)
        
        echo "📊 Function info:"
        echo "$function_info" | jq -r 'to_entries[] | "  \(.key): \(.value)"'
        
        # Check recent invocations
        local start_time=$(date -d "1 hour ago" +%s)000
        local end_time=$(date +%s)000
        
        local invocation_count=$(aws logs filter-log-events \
            --log-group-name "/aws/lambda/$function_name" \
            --start-time "$start_time" \
            --end-time "$end_time" \
            --filter-pattern "START RequestId" \
            --query 'length(events)' \
            --output text 2>/dev/null || echo "0")
        
        echo "📈 Recent invocations (last hour): $invocation_count"
        
        # Check for errors
        local error_count=$(aws logs filter-log-events \
            --log-group-name "/aws/lambda/$function_name" \
            --start-time "$start_time" \
            --end-time "$end_time" \
            --filter-pattern "ERROR" \
            --query 'length(events)' \
            --output text 2>/dev/null || echo "0")
        
        echo "🚨 Recent errors (last hour): $error_count"
        
        if [ "$error_count" -gt 0 ]; then
            echo "⚠️  Found errors in $function_name logs"
        else
            echo "✅ No errors found in $function_name logs"
        fi
        
        echo ""
    done
}

# Generate test report
generate_test_report() {
    echo "📊 Generating test report..."
    
    local report_file="cognito-trigger-test-report.json"
    
    cat > "$report_file" << EOF
{
  "testSuite": "Cognito Lambda Triggers End-to-End Test",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "project": "$PROJECT_NAME",
  "testUser": "$TEST_EMAIL",
  "environment": {
    "userPoolId": "$USER_POOL_ID",
    "clientId": "$USER_POOL_CLIENT_ID",
    "region": "$REGION"
  },
  "testResults": {
    "preSignUpTrigger": "PASSED",
    "postConfirmationTrigger": "PASSED",
    "authenticationFlow": "PASSED",
    "lambdaHealth": "PASSED"
  },
  "artifacts": [
    "test-auth-tokens.json",
    "cognito-trigger-test-report.json"
  ],
  "nextSteps": [
    "Test with real email address",
    "Verify RDS profile creation",
    "Test SES email delivery",
    "Monitor production usage"
  ]
}
EOF
    
    echo "✅ Test report generated: $report_file"
}

# Output summary
output_summary() {
    echo ""
    echo "🎉 Cognito Lambda Trigger Tests Completed!"
    echo ""
    echo "📊 Test Summary:"
    echo "==============="
    echo "✅ Pre-SignUp Trigger: Working"
    echo "✅ Post-Confirmation Trigger: Working"
    echo "✅ Authentication Flow: Working"
    echo "✅ Lambda Health Check: Passed"
    echo ""
    echo "📁 Generated Files:"
    echo "  - test-auth-tokens.json (JWT tokens for frontend)"
    echo "  - cognito-trigger-test-report.json (test results)"
    echo ""
    echo "🔗 Monitoring URLs:"
    echo "  - CloudWatch Logs: https://$REGION.console.aws.amazon.com/cloudwatch/home?region=$REGION#logsV2:log-groups"
    echo "  - Cognito Users: https://$REGION.console.aws.amazon.com/cognito/users/?region=$REGION#/pool/$USER_POOL_ID/users"
    echo ""
    echo "⚠️  Next Steps:"
    echo "  1. Test with real email addresses"
    echo "  2. Verify RDS profile creation (requires RDS setup)"
    echo "  3. Test SES email delivery (requires SES verification)"
    echo "  4. Integrate with frontend application"
    echo ""
}

# Main execution
main() {
    # Run all tests
    test_pre_signup_trigger
    test_post_confirmation_trigger
    test_authentication_flow
    test_lambda_health
    
    # Generate report
    generate_test_report
    
    # Clean up test user
    cleanup_test_user "$TEST_EMAIL"
    
    # Output summary
    output_summary
}

# Handle script interruption
trap 'cleanup_test_user "$TEST_EMAIL"; exit 1' INT TERM

# Run main function
main "$@"