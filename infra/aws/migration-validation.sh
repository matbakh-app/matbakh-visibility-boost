#!/bin/bash
set -euo pipefail

# Migration Validation Script
# Comprehensive validation of user migration results

PROJECT_NAME="matbakh.app"
AWS_PROFILE="matbakh-dev"
REGION="eu-central-1"

echo "🔍 Migration Validation - Phase B"
echo "================================="
echo "Project: $PROJECT_NAME"
echo "Region: $REGION"
echo ""

# Set AWS profile and region
export AWS_PROFILE=$AWS_PROFILE
export AWS_DEFAULT_REGION=$REGION

# Load environment variables
if [ -f .env.infrastructure ]; then
    source .env.infrastructure
else
    echo "❌ .env.infrastructure file not found"
    exit 1
fi

if [ -f .env.cognito ]; then
    source .env.cognito
else
    echo "❌ .env.cognito file not found"
    exit 1
fi

# Function to validate migration files exist
validate_migration_files() {
    echo "📁 Step 1: Validating Migration Files"
    echo "====================================="
    
    local required_files=(
        "user-migration-report.json"
        "cognito-migration-results.json"
        "rds-migration-results.json"
        "users-mapped.json"
    )
    
    local missing_files=()
    
    for file in "${required_files[@]}"; do
        if [ -f "$file" ]; then
            echo "✅ Found: $file"
        else
            echo "❌ Missing: $file"
            missing_files+=("$file")
        fi
    done
    
    if [ ${#missing_files[@]} -gt 0 ]; then
        echo "❌ Missing required migration files. Run migration first."
        exit 1
    fi
    
    echo "✅ All required migration files found"
    echo ""
}

# Function to validate Cognito users
validate_cognito_users() {
    echo "👤 Step 2: Validating Cognito Users"
    echo "==================================="
    
    local successful_users=$(jq -r '[.[] | select(.status == "success")] | .[] | .email' cognito-migration-results.json)
    local total_successful=$(jq '[.[] | select(.status == "success")] | length' cognito-migration-results.json)
    
    echo "📊 Validating $total_successful successfully migrated Cognito users"
    
    local validated_count=0
    local error_count=0
    
    # Create validation results file
    echo "[]" > cognito-validation-results.json
    
    while IFS= read -r email; do
        if [ -n "$email" ]; then
            # Get user details from Cognito
            local user_details=$(aws cognito-idp admin-get-user \
                --user-pool-id "$USER_POOL_ID" \
                --username "$email" \
                --output json 2>&1)
            
            if echo "$user_details" | jq -e '.Username' > /dev/null 2>&1; then
                local user_status=$(echo "$user_details" | jq -r '.UserStatus')
                local enabled=$(echo "$user_details" | jq -r '.Enabled')
                local attributes=$(echo "$user_details" | jq -r '.UserAttributes')
                
                # Extract key attributes
                local cognito_email=$(echo "$attributes" | jq -r '.[] | select(.Name == "email") | .Value')
                local given_name=$(echo "$attributes" | jq -r '.[] | select(.Name == "given_name") | .Value // "null"')
                local family_name=$(echo "$attributes" | jq -r '.[] | select(.Name == "family_name") | .Value // "null"')
                local user_role=$(echo "$attributes" | jq -r '.[] | select(.Name == "custom:user_role") | .Value // "null"')
                local locale=$(echo "$attributes" | jq -r '.[] | select(.Name == "custom:locale") | .Value // "null"')
                local supabase_id=$(echo "$attributes" | jq -r '.[] | select(.Name == "custom:supabase_id") | .Value // "null"')
                
                # Validate attributes
                local validation_status="valid"
                local validation_issues=()
                
                if [ "$cognito_email" != "$email" ]; then
                    validation_issues+=("email_mismatch")
                    validation_status="invalid"
                fi
                
                if [ "$user_role" = "null" ]; then
                    validation_issues+=("missing_user_role")
                    validation_status="warning"
                fi
                
                if [ "$locale" = "null" ]; then
                    validation_issues+=("missing_locale")
                    validation_status="warning"
                fi
                
                # Create validation result
                local result="{
                    \"email\": \"$email\",
                    \"cognitoStatus\": \"$user_status\",
                    \"enabled\": $enabled,
                    \"attributes\": {
                        \"given_name\": \"$given_name\",
                        \"family_name\": \"$family_name\",
                        \"user_role\": \"$user_role\",
                        \"locale\": \"$locale\",
                        \"supabase_id\": \"$supabase_id\"
                    },
                    \"validationStatus\": \"$validation_status\",
                    \"issues\": $(printf '%s\n' "${validation_issues[@]}" | jq -R . | jq -s .),
                    \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
                }"
                
                jq ". += [$result]" cognito-validation-results.json > temp.json && mv temp.json cognito-validation-results.json
                
                if [ "$validation_status" = "valid" ]; then
                    ((validated_count++))
                else
                    ((error_count++))
                fi
                
            else
                echo "❌ User not found in Cognito: $email"
                ((error_count++))
                
                local result="{
                    \"email\": \"$email\",
                    \"cognitoStatus\": \"not_found\",
                    \"validationStatus\": \"invalid\",
                    \"issues\": [\"user_not_found\"],
                    \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
                }"
                
                jq ". += [$result]" cognito-validation-results.json > temp.json && mv temp.json cognito-validation-results.json
            fi
        fi
    done <<< "$successful_users"
    
    echo "📊 Cognito Validation Results:"
    echo "   Valid Users: $validated_count"
    echo "   Issues Found: $error_count"
    echo "   Success Rate: $(( (validated_count * 100) / total_successful ))%"
    
    if [ $error_count -eq 0 ]; then
        echo "✅ Cognito validation: PASSED"
    else
        echo "⚠️  Cognito validation: ISSUES_FOUND"
    fi
    
    echo ""
}

# Function to validate RDS profiles
validate_rds_profiles() {
    echo "🗄️ Step 3: Validating RDS Profiles"
    echo "=================================="
    
    local successful_rds=$(jq -r '[.[] | select(.status == "success")] | .[] | .email' rds-migration-results.json)
    local total_rds=$(jq '[.[] | select(.status == "success")] | length' rds-migration-results.json)
    
    echo "📊 Validating $total_rds successfully created RDS profiles"
    
    local validated_profiles=0
    local profile_errors=0
    
    # Create RDS validation results file
    echo "[]" > rds-validation-results.json
    
    while IFS= read -r email; do
        if [ -n "$email" ]; then
            # Check main profile
            local profile_result=$(aws rds-data execute-statement \
                --resource-arn "$RDS_CLUSTER_ARN" \
                --secret-arn "$APP_SECRET_ARN" \
                --database "matbakh_main" \
                --sql "SELECT id, email, role, display_name, cognito_user_id, created_at FROM public.profiles WHERE email = :email" \
                --parameters "name=email,value={stringValue=$email}" \
                --output json 2>&1)
            
            if echo "$profile_result" | jq -e '.records[0]' > /dev/null 2>&1; then
                local profile_id=$(echo "$profile_result" | jq -r '.records[0][0].stringValue')
                local profile_email=$(echo "$profile_result" | jq -r '.records[0][1].stringValue')
                local role=$(echo "$profile_result" | jq -r '.records[0][2].stringValue')
                local display_name=$(echo "$profile_result" | jq -r '.records[0][3].stringValue')
                local cognito_user_id=$(echo "$profile_result" | jq -r '.records[0][4].stringValue')
                local created_at=$(echo "$profile_result" | jq -r '.records[0][5].stringValue')
                
                # Check private profile
                local private_result=$(aws rds-data execute-statement \
                    --resource-arn "$RDS_CLUSTER_ARN" \
                    --secret-arn "$APP_SECRET_ARN" \
                    --database "matbakh_main" \
                    --sql "SELECT COUNT(*) FROM public.private_profiles WHERE user_id = :userId" \
                    --parameters "name=userId,value={stringValue=$profile_id}" \
                    --query 'records[0][0].longValue' \
                    --output text 2>/dev/null || echo "0")
                
                local has_private_profile=$([ "$private_result" = "1" ] && echo "true" || echo "false")
                
                # Validate profile data
                local validation_status="valid"
                local validation_issues=()
                
                if [ "$profile_email" != "$email" ]; then
                    validation_issues+=("email_mismatch")
                    validation_status="invalid"
                fi
                
                if [ -z "$cognito_user_id" ] || [ "$cognito_user_id" = "null" ]; then
                    validation_issues+=("missing_cognito_user_id")
                    validation_status="invalid"
                fi
                
                if [ -z "$role" ] || [ "$role" = "null" ]; then
                    validation_issues+=("missing_role")
                    validation_status="warning"
                fi
                
                # Create validation result
                local result="{
                    \"email\": \"$email\",
                    \"profileId\": \"$profile_id\",
                    \"role\": \"$role\",
                    \"displayName\": \"$display_name\",
                    \"cognitoUserId\": \"$cognito_user_id\",
                    \"hasPrivateProfile\": $has_private_profile,
                    \"createdAt\": \"$created_at\",
                    \"validationStatus\": \"$validation_status\",
                    \"issues\": $(printf '%s\n' "${validation_issues[@]}" | jq -R . | jq -s .),
                    \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
                }"
                
                jq ". += [$result]" rds-validation-results.json > temp.json && mv temp.json rds-validation-results.json
                
                if [ "$validation_status" = "valid" ]; then
                    ((validated_profiles++))
                else
                    ((profile_errors++))
                fi
                
            else
                echo "❌ Profile not found in RDS: $email"
                ((profile_errors++))
                
                local result="{
                    \"email\": \"$email\",
                    \"validationStatus\": \"invalid\",
                    \"issues\": [\"profile_not_found\"],
                    \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
                }"
                
                jq ". += [$result]" rds-validation-results.json > temp.json && mv temp.json rds-validation-results.json
            fi
        fi
    done <<< "$successful_rds"
    
    echo "📊 RDS Validation Results:"
    echo "   Valid Profiles: $validated_profiles"
    echo "   Issues Found: $profile_errors"
    echo "   Success Rate: $(( (validated_profiles * 100) / total_rds ))%"
    
    if [ $profile_errors -eq 0 ]; then
        echo "✅ RDS validation: PASSED"
    else
        echo "⚠️  RDS validation: ISSUES_FOUND"
    fi
    
    echo ""
}

# Function to validate data consistency
validate_data_consistency() {
    echo "🔄 Step 4: Validating Data Consistency"
    echo "======================================"
    
    echo "📊 Checking Cognito ↔ RDS consistency..."
    
    # Get successful migrations from both systems
    local cognito_emails=$(jq -r '[.[] | select(.status == "success")] | .[] | .email' cognito-migration-results.json | sort)
    local rds_emails=$(jq -r '[.[] | select(.status == "success")] | .[] | .email' rds-migration-results.json | sort)
    
    # Compare email lists
    local cognito_count=$(echo "$cognito_emails" | wc -l)
    local rds_count=$(echo "$rds_emails" | wc -l)
    
    echo "   Cognito successful: $cognito_count"
    echo "   RDS successful: $rds_count"
    
    # Find differences
    local missing_in_rds=$(comm -23 <(echo "$cognito_emails") <(echo "$rds_emails"))
    local missing_in_cognito=$(comm -13 <(echo "$cognito_emails") <(echo "$rds_emails"))
    
    local missing_rds_count=$(echo "$missing_in_rds" | grep -c . || echo "0")
    local missing_cognito_count=$(echo "$missing_in_cognito" | grep -c . || echo "0")
    
    echo "   Missing in RDS: $missing_rds_count"
    echo "   Missing in Cognito: $missing_cognito_count"
    
    # Create consistency report
    local consistency_report="{
        \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
        \"cognitoCount\": $cognito_count,
        \"rdsCount\": $rds_count,
        \"missingInRds\": $missing_rds_count,
        \"missingInCognito\": $missing_cognito_count,
        \"consistencyRate\": $(( ((cognito_count - missing_rds_count) * 100) / cognito_count )),
        \"missingInRdsList\": $(echo "$missing_in_rds" | jq -R . | jq -s .),
        \"missingInCognitoList\": $(echo "$missing_in_cognito" | jq -R . | jq -s .)
    }"
    
    echo "$consistency_report" > data-consistency-report.json
    
    if [ $missing_rds_count -eq 0 ] && [ $missing_cognito_count -eq 0 ]; then
        echo "✅ Data consistency: PERFECT"
    elif [ $missing_rds_count -le 2 ] && [ $missing_cognito_count -le 2 ]; then
        echo "⚠️  Data consistency: MINOR_ISSUES"
    else
        echo "❌ Data consistency: MAJOR_ISSUES"
    fi
    
    echo ""
}

# Function to test authentication flow
test_authentication_flow() {
    echo "🔐 Step 5: Testing Authentication Flow"
    echo "====================================="
    
    # Get a sample of migrated users for authentication testing
    local sample_users=$(jq -r '[.[] | select(.status == "success")] | .[0:3] | .[] | .email' cognito-migration-results.json)
    local test_count=0
    local auth_success=0
    local auth_failures=0
    
    echo "🧪 Testing authentication for sample users..."
    
    # Create auth test results file
    echo "[]" > auth-test-results.json
    
    while IFS= read -r email; do
        if [ -n "$email" ]; then
            ((test_count++))
            
            # Generate test password
            local test_password="TestPass$(date +%s)!"
            
            # Set temporary password for testing
            local password_result=$(aws cognito-idp admin-set-user-password \
                --user-pool-id "$USER_POOL_ID" \
                --username "$email" \
                --password "$test_password" \
                --permanent \
                --output json 2>&1)
            
            if echo "$password_result" | jq -e '.' > /dev/null 2>&1; then
                # Test authentication
                local auth_result=$(aws cognito-idp admin-initiate-auth \
                    --user-pool-id "$USER_POOL_ID" \
                    --client-id "$USER_POOL_CLIENT_ID" \
                    --auth-flow "ADMIN_NO_SRP_AUTH" \
                    --auth-parameters "USERNAME=$email,PASSWORD=$test_password" \
                    --output json 2>&1)
                
                if echo "$auth_result" | jq -e '.AuthenticationResult.AccessToken' > /dev/null 2>&1; then
                    ((auth_success++))
                    echo "✅ Authentication successful: $email"
                    
                    # Extract JWT claims for validation
                    local id_token=$(echo "$auth_result" | jq -r '.AuthenticationResult.IdToken')
                    local jwt_payload=$(echo "$id_token" | cut -d. -f2)
                    
                    # Add padding if needed
                    local padding_length=$((4 - ${#jwt_payload} % 4))
                    if [ $padding_length -ne 4 ]; then
                        jwt_payload="${jwt_payload}$(printf '%*s' $padding_length | tr ' ' '=')"
                    fi
                    
                    local decoded_payload=$(echo "$jwt_payload" | base64 -d 2>/dev/null | jq . 2>/dev/null || echo "{}")
                    
                    local result="{
                        \"email\": \"$email\",
                        \"authStatus\": \"success\",
                        \"hasIdToken\": true,
                        \"hasAccessToken\": true,
                        \"jwtClaims\": $decoded_payload,
                        \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
                    }"
                    
                else
                    ((auth_failures++))
                    echo "❌ Authentication failed: $email"
                    
                    local result="{
                        \"email\": \"$email\",
                        \"authStatus\": \"failed\",
                        \"error\": \"$(echo "$auth_result" | jq -r .message 2>/dev/null || echo "Unknown error")\",
                        \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
                    }"
                fi
            else
                ((auth_failures++))
                echo "❌ Password setup failed: $email"
                
                local result="{
                    \"email\": \"$email\",
                    \"authStatus\": \"password_setup_failed\",
                    \"error\": \"$(echo "$password_result" | jq -r .message 2>/dev/null || echo "Unknown error")\",
                    \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
                }"
            fi
            
            jq ". += [$result]" auth-test-results.json > temp.json && mv temp.json auth-test-results.json
        fi
    done <<< "$sample_users"
    
    echo "📊 Authentication Test Results:"
    echo "   Tests Run: $test_count"
    echo "   Successful: $auth_success"
    echo "   Failed: $auth_failures"
    
    if [ $auth_failures -eq 0 ]; then
        echo "✅ Authentication testing: PASSED"
    else
        echo "⚠️  Authentication testing: ISSUES_FOUND"
    fi
    
    echo ""
}

# Generate comprehensive validation report
generate_validation_report() {
    echo "📋 Step 6: Generating Validation Report"
    echo "======================================="
    
    local validation_timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    
    # Collect validation statistics
    local cognito_valid=$(jq '[.[] | select(.validationStatus == "valid")] | length' cognito-validation-results.json 2>/dev/null || echo "0")
    local cognito_total=$(jq length cognito-validation-results.json 2>/dev/null || echo "0")
    local rds_valid=$(jq '[.[] | select(.validationStatus == "valid")] | length' rds-validation-results.json 2>/dev/null || echo "0")
    local rds_total=$(jq length rds-validation-results.json 2>/dev/null || echo "0")
    local auth_success=$(jq '[.[] | select(.authStatus == "success")] | length' auth-test-results.json 2>/dev/null || echo "0")
    local auth_total=$(jq length auth-test-results.json 2>/dev/null || echo "0")
    
    # Calculate success rates
    local cognito_success_rate=0
    local rds_success_rate=0
    local auth_success_rate=0
    
    if [ $cognito_total -gt 0 ]; then
        cognito_success_rate=$(( (cognito_valid * 100) / cognito_total ))
    fi
    
    if [ $rds_total -gt 0 ]; then
        rds_success_rate=$(( (rds_valid * 100) / rds_total ))
    fi
    
    if [ $auth_total -gt 0 ]; then
        auth_success_rate=$(( (auth_success * 100) / auth_total ))
    fi
    
    # Generate comprehensive validation report
    cat > migration-validation-report.json << EOF
{
  "validationReport": {
    "timestamp": "$validation_timestamp",
    "project": "$PROJECT_NAME",
    "phase": "B - User Data Migration Validation",
    "validationResults": {
      "cognito": {
        "totalValidated": $cognito_total,
        "validUsers": $cognito_valid,
        "invalidUsers": $((cognito_total - cognito_valid)),
        "successRate": "${cognito_success_rate}%"
      },
      "rds": {
        "totalValidated": $rds_total,
        "validProfiles": $rds_valid,
        "invalidProfiles": $((rds_total - rds_valid)),
        "successRate": "${rds_success_rate}%"
      },
      "authentication": {
        "totalTested": $auth_total,
        "successfulAuth": $auth_success,
        "failedAuth": $((auth_total - auth_success)),
        "successRate": "${auth_success_rate}%"
      }
    },
    "overallStatus": "$([ $cognito_success_rate -ge 95 ] && [ $rds_success_rate -ge 95 ] && [ $auth_success_rate -ge 90 ] && echo "PASSED" || echo "NEEDS_REVIEW")",
    "artifacts": [
      "cognito-validation-results.json",
      "rds-validation-results.json", 
      "auth-test-results.json",
      "data-consistency-report.json",
      "migration-validation-report.json"
    ],
    "recommendations": [
      "Review any validation issues found",
      "Test additional authentication scenarios",
      "Monitor system performance post-migration",
      "Set up ongoing data integrity checks"
    ]
  }
}
EOF
    
    echo "✅ Validation report generated: migration-validation-report.json"
    echo ""
}

# Output summary
output_summary() {
    echo ""
    echo "🎉 Migration Validation Completed!"
    echo ""
    echo "📊 Validation Summary:"
    echo "====================="
    
    # Load validation results
    local cognito_valid=$(jq '[.[] | select(.validationStatus == "valid")] | length' cognito-validation-results.json 2>/dev/null || echo "0")
    local cognito_total=$(jq length cognito-validation-results.json 2>/dev/null || echo "0")
    local rds_valid=$(jq '[.[] | select(.validationStatus == "valid")] | length' rds-validation-results.json 2>/dev/null || echo "0")
    local rds_total=$(jq length rds-validation-results.json 2>/dev/null || echo "0")
    local auth_success=$(jq '[.[] | select(.authStatus == "success")] | length' auth-test-results.json 2>/dev/null || echo "0")
    local auth_total=$(jq length auth-test-results.json 2>/dev/null || echo "0")
    
    echo "Cognito Validation: $cognito_valid/$cognito_total valid"
    echo "RDS Validation: $rds_valid/$rds_total valid"
    echo "Authentication Test: $auth_success/$auth_total successful"
    echo ""
    
    echo "📁 Generated Files:"
    echo "  - migration-validation-report.json (comprehensive report)"
    echo "  - cognito-validation-results.json (Cognito validation details)"
    echo "  - rds-validation-results.json (RDS validation details)"
    echo "  - auth-test-results.json (authentication test results)"
    echo "  - data-consistency-report.json (consistency analysis)"
    echo ""
    
    # Determine overall status
    local cognito_success_rate=$(( (cognito_valid * 100) / cognito_total ))
    local rds_success_rate=$(( (rds_valid * 100) / rds_total ))
    local auth_success_rate=$(( (auth_success * 100) / auth_total ))
    
    if [ $cognito_success_rate -ge 95 ] && [ $rds_success_rate -ge 95 ] && [ $auth_success_rate -ge 90 ]; then
        echo "✅ Overall Validation Status: PASSED"
        echo "   Migration is ready for production use"
    elif [ $cognito_success_rate -ge 80 ] && [ $rds_success_rate -ge 80 ]; then
        echo "⚠️  Overall Validation Status: NEEDS_REVIEW"
        echo "   Minor issues detected - review recommended"
    else
        echo "❌ Overall Validation Status: FAILED"
        echo "   Significant issues detected - investigation required"
    fi
    
    echo ""
}

# Main execution
main() {
    echo "🔍 Starting Migration Validation..."
    echo ""
    
    validate_migration_files
    validate_cognito_users
    validate_rds_profiles
    validate_data_consistency
    test_authentication_flow
    generate_validation_report
    output_summary
    
    echo "🎉 Migration validation completed!"
}

# Run main function
main "$@"