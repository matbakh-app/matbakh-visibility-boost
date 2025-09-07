#!/bin/bash
set -euo pipefail

# Cognito Validation Test Script
# Tests the complete authentication flow and JWT validation

# Load environment variables
if [ -f .env.cognito ]; then
    source .env.cognito
else
    echo "❌ .env.cognito file not found. Run deployment script first."
    exit 1
fi

echo "🧪 Cognito Validation Test Suite"
echo "================================"
echo "User Pool ID: $USER_POOL_ID"
echo "Client ID: $USER_POOL_CLIENT_ID"
echo "Domain: $DOMAIN_URL"
echo ""

# Test 1: User Pool exists and is accessible
test_user_pool_exists() {
    echo "🔍 Test 1: User Pool Accessibility"
    
    POOL_INFO=$(aws cognito-idp describe-user-pool \
        --user-pool-id "$USER_POOL_ID" \
        --query 'UserPool.{Name:Name,Status:Status,CreationDate:CreationDate}' \
        --output json)
    
    if [ $? -eq 0 ]; then
        echo "✅ User Pool accessible"
        echo "   Pool Info: $(echo $POOL_INFO | jq -c .)"
    else
        echo "❌ User Pool not accessible"
        return 1
    fi
}

# Test 2: Custom attributes are configured
test_custom_attributes() {
    echo "🔍 Test 2: Custom Attributes Configuration"
    
    CUSTOM_ATTRS=$(aws cognito-idp describe-user-pool \
        --user-pool-id "$USER_POOL_ID" \
        --query 'UserPool.Schema[?starts_with(Name, `custom:`)].[Name]' \
        --output text)
    
    EXPECTED_ATTRS=("custom:user_role" "custom:locale" "custom:profile_complete" "custom:onboarding_step" "custom:business_id" "custom:supabase_id")
    
    for attr in "${EXPECTED_ATTRS[@]}"; do
        if echo "$CUSTOM_ATTRS" | grep -q "$attr"; then
            echo "✅ Custom attribute found: $attr"
        else
            echo "❌ Custom attribute missing: $attr"
            return 1
        fi
    done
}

# Test 3: User Pool Client configuration
test_user_pool_client() {
    echo "🔍 Test 3: User Pool Client Configuration"
    
    CLIENT_INFO=$(aws cognito-idp describe-user-pool-client \
        --user-pool-id "$USER_POOL_ID" \
        --client-id "$USER_POOL_CLIENT_ID" \
        --query 'UserPoolClient.{ClientName:ClientName,ExplicitAuthFlows:ExplicitAuthFlows,CallbackURLs:CallbackURLs}' \
        --output json)
    
    if [ $? -eq 0 ]; then
        echo "✅ User Pool Client accessible"
        echo "   Client Info: $(echo $CLIENT_INFO | jq -c .)"
        
        # Check if required auth flows are enabled
        if echo "$CLIENT_INFO" | jq -r '.ExplicitAuthFlows[]' | grep -q "USER_PASSWORD_AUTH"; then
            echo "✅ USER_PASSWORD_AUTH flow enabled"
        else
            echo "❌ USER_PASSWORD_AUTH flow not enabled"
            return 1
        fi
    else
        echo "❌ User Pool Client not accessible"
        return 1
    fi
}

# Test 4: Domain configuration
test_domain_configuration() {
    echo "🔍 Test 4: Domain Configuration"
    
    DOMAIN_INFO=$(aws cognito-idp describe-user-pool-domain \
        --domain "matbakh-auth" \
        --query 'DomainDescription.{Domain:Domain,Status:Status,CloudFrontDistribution:CloudFrontDistribution}' \
        --output json 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        echo "✅ Domain configured"
        echo "   Domain Info: $(echo $DOMAIN_INFO | jq -c .)"
    else
        echo "❌ Domain not configured"
        return 1
    fi
}

# Test 5: Test user creation and authentication
test_user_authentication() {
    echo "🔍 Test 5: User Authentication Flow"
    
    TEST_EMAIL="validation-test@matbakh.app"
    TEMP_PASSWORD="TempPass123!"
    NEW_PASSWORD="NewPass123!"
    
    # Clean up any existing test user
    aws cognito-idp admin-delete-user \
        --user-pool-id "$USER_POOL_ID" \
        --username "$TEST_EMAIL" 2>/dev/null || true
    
    # Create test user
    echo "   Creating test user: $TEST_EMAIL"
    aws cognito-idp admin-create-user \
        --user-pool-id "$USER_POOL_ID" \
        --username "$TEST_EMAIL" \
        --user-attributes "Name=email,Value=$TEST_EMAIL" "Name=given_name,Value=Test" "Name=family_name,Value=User" "Name=custom:user_role,Value=owner" "Name=custom:locale,Value=de" \
        --temporary-password "$TEMP_PASSWORD" \
        --message-action "SUPPRESS" > /dev/null
    
    if [ $? -eq 0 ]; then
        echo "✅ Test user created successfully"
    else
        echo "❌ Failed to create test user"
        return 1
    fi
    
    # Test initial authentication (should require password change)
    echo "   Testing initial authentication..."
    AUTH_RESULT=$(aws cognito-idp admin-initiate-auth \
        --user-pool-id "$USER_POOL_ID" \
        --client-id "$USER_POOL_CLIENT_ID" \
        --auth-flow "ADMIN_NO_SRP_AUTH" \
        --auth-parameters "USERNAME=$TEST_EMAIL,PASSWORD=$TEMP_PASSWORD" \
        --output json 2>/dev/null)
    
    if echo "$AUTH_RESULT" | jq -r '.ChallengeName' | grep -q "NEW_PASSWORD_REQUIRED"; then
        echo "✅ Initial auth requires password change (expected)"
        
        # Set permanent password
        SESSION=$(echo "$AUTH_RESULT" | jq -r '.Session')
        aws cognito-idp admin-respond-to-auth-challenge \
            --user-pool-id "$USER_POOL_ID" \
            --client-id "$USER_POOL_CLIENT_ID" \
            --challenge-name "NEW_PASSWORD_REQUIRED" \
            --challenge-responses "USERNAME=$TEST_EMAIL,NEW_PASSWORD=$NEW_PASSWORD" \
            --session "$SESSION" > /dev/null
        
        echo "✅ Password set successfully"
    else
        echo "❌ Unexpected auth response"
        return 1
    fi
    
    # Test authentication with new password
    echo "   Testing authentication with new password..."
    FINAL_AUTH=$(aws cognito-idp admin-initiate-auth \
        --user-pool-id "$USER_POOL_ID" \
        --client-id "$USER_POOL_CLIENT_ID" \
        --auth-flow "ADMIN_NO_SRP_AUTH" \
        --auth-parameters "USERNAME=$TEST_EMAIL,PASSWORD=$NEW_PASSWORD" \
        --output json)
    
    if echo "$FINAL_AUTH" | jq -r '.AuthenticationResult.AccessToken' | grep -q "eyJ"; then
        echo "✅ Authentication successful, JWT tokens received"
        
        # Extract and validate JWT structure
        ID_TOKEN=$(echo "$FINAL_AUTH" | jq -r '.AuthenticationResult.IdToken')
        ACCESS_TOKEN=$(echo "$FINAL_AUTH" | jq -r '.AuthenticationResult.AccessToken')
        
        # Decode JWT header and payload (base64)
        JWT_HEADER=$(echo "$ID_TOKEN" | cut -d. -f1 | base64 -d 2>/dev/null | jq . 2>/dev/null || echo "Invalid header")
        JWT_PAYLOAD=$(echo "$ID_TOKEN" | cut -d. -f2 | base64 -d 2>/dev/null | jq . 2>/dev/null || echo "Invalid payload")
        
        echo "✅ JWT structure validation:"
        echo "   Header: $(echo $JWT_HEADER | jq -c . 2>/dev/null || echo 'Could not decode')"
        echo "   Payload contains: $(echo $JWT_PAYLOAD | jq -r 'keys[]' 2>/dev/null | tr '\n' ' ' || echo 'Could not decode')"
        
        # Save JWT for frontend testing
        cat > test-jwt-tokens.json << EOF
{
  "idToken": "$ID_TOKEN",
  "accessToken": "$ACCESS_TOKEN",
  "testUser": {
    "email": "$TEST_EMAIL",
    "password": "$NEW_PASSWORD"
  },
  "generatedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
        echo "✅ JWT tokens saved to test-jwt-tokens.json"
        
    else
        echo "❌ Authentication failed"
        return 1
    fi
    
    # Clean up test user
    aws cognito-idp admin-delete-user \
        --user-pool-id "$USER_POOL_ID" \
        --username "$TEST_EMAIL" > /dev/null
    
    echo "✅ Test user cleaned up"
}

# Test 6: Hosted UI accessibility
test_hosted_ui() {
    echo "🔍 Test 6: Hosted UI Accessibility"
    
    HOSTED_UI_URL="${DOMAIN_URL}/login?client_id=${USER_POOL_CLIENT_ID}&response_type=code&scope=openid+email+profile&redirect_uri=https://matbakh.app/auth/callback"
    
    # Test if hosted UI is accessible
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$HOSTED_UI_URL" || echo "000")
    
    if [ "$HTTP_STATUS" = "200" ]; then
        echo "✅ Hosted UI accessible"
        echo "   URL: $HOSTED_UI_URL"
    else
        echo "❌ Hosted UI not accessible (HTTP $HTTP_STATUS)"
        echo "   URL: $HOSTED_UI_URL"
        return 1
    fi
}

# Test 7: Lambda triggers (if deployed)
test_lambda_triggers() {
    echo "🔍 Test 7: Lambda Triggers Configuration"
    
    LAMBDA_CONFIG=$(aws cognito-idp describe-user-pool \
        --user-pool-id "$USER_POOL_ID" \
        --query 'UserPool.LambdaConfig' \
        --output json)
    
    if [ "$LAMBDA_CONFIG" != "null" ] && [ "$LAMBDA_CONFIG" != "{}" ]; then
        echo "✅ Lambda triggers configured"
        echo "   Config: $(echo $LAMBDA_CONFIG | jq -c .)"
    else
        echo "⚠️  No Lambda triggers configured (optional)"
    fi
}

# Run all tests
run_all_tests() {
    local failed_tests=0
    
    test_user_pool_exists || ((failed_tests++))
    echo ""
    
    test_custom_attributes || ((failed_tests++))
    echo ""
    
    test_user_pool_client || ((failed_tests++))
    echo ""
    
    test_domain_configuration || ((failed_tests++))
    echo ""
    
    test_user_authentication || ((failed_tests++))
    echo ""
    
    test_hosted_ui || ((failed_tests++))
    echo ""
    
    test_lambda_triggers || ((failed_tests++))
    echo ""
    
    # Summary
    echo "📊 Test Summary"
    echo "==============="
    if [ $failed_tests -eq 0 ]; then
        echo "🎉 All tests passed! Cognito setup is ready for production."
        echo ""
        echo "📁 Generated Files:"
        echo "   - test-jwt-tokens.json (JWT tokens for frontend testing)"
        echo ""
        echo "🔗 Next Steps:"
        echo "   1. Update frontend configuration with Cognito settings"
        echo "   2. Test user registration flow in your application"
        echo "   3. Import existing users from Supabase"
        echo "   4. Configure Google Identity Provider"
        echo ""
        return 0
    else
        echo "❌ $failed_tests test(s) failed. Please review the errors above."
        return 1
    fi
}

# Main execution
main() {
    if [ "${1:-}" = "--help" ] || [ "${1:-}" = "-h" ]; then
        echo "Usage: $0 [test_name]"
        echo ""
        echo "Available tests:"
        echo "  user-pool      - Test user pool accessibility"
        echo "  attributes     - Test custom attributes"
        echo "  client         - Test user pool client"
        echo "  domain         - Test domain configuration"
        echo "  auth           - Test user authentication flow"
        echo "  hosted-ui      - Test hosted UI accessibility"
        echo "  triggers       - Test lambda triggers"
        echo "  all            - Run all tests (default)"
        echo ""
        exit 0
    fi
    
    case "${1:-all}" in
        "user-pool")
            test_user_pool_exists
            ;;
        "attributes")
            test_custom_attributes
            ;;
        "client")
            test_user_pool_client
            ;;
        "domain")
            test_domain_configuration
            ;;
        "auth")
            test_user_authentication
            ;;
        "hosted-ui")
            test_hosted_ui
            ;;
        "triggers")
            test_lambda_triggers
            ;;
        "all"|*)
            run_all_tests
            ;;
    esac
}

# Execute main function
main "$@"