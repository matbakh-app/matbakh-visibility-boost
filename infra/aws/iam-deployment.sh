#!/bin/bash
set -euo pipefail

# IAM Roles and Policies Deployment for Cognito Lambda Triggers
# Task 1.4: IAM Roles + Lambda Deployment

PROJECT_NAME="matbakh.app"
AWS_PROFILE="matbakh-dev"
REGION="eu-central-1"
ROLE_PREFIX="MatbakhCognitoTriggerRole"

echo "🔐 Starting IAM setup for Cognito Lambda Triggers..."
echo "Project: $PROJECT_NAME"
echo "Region: $REGION"
echo ""

# Set AWS profile and region
export AWS_PROFILE=$AWS_PROFILE
export AWS_DEFAULT_REGION=$REGION

# Get AWS Account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "AWS Account ID: $ACCOUNT_ID"

# Function to check if role exists
role_exists() {
    local role_name=$1
    aws iam get-role --role-name "$role_name" > /dev/null 2>&1
}

# Function to check if policy exists
policy_exists() {
    local policy_name=$1
    aws iam get-policy --policy-arn "arn:aws:iam::${ACCOUNT_ID}:policy/${policy_name}" > /dev/null 2>&1
}

# Function to create IAM role
create_iam_role() {
    local role_name=$1
    local trust_policy=$2
    
    echo "📝 Creating IAM role: $role_name"
    
    if role_exists "$role_name"; then
        echo "⚠️  Role $role_name already exists, updating trust policy..."
        aws iam update-assume-role-policy \
            --role-name "$role_name" \
            --policy-document "$trust_policy"
    else
        aws iam create-role \
            --role-name "$role_name" \
            --assume-role-policy-document "$trust_policy" \
            --description "Execution role for Cognito Lambda triggers - $PROJECT_NAME" > /dev/null
        echo "✅ Role created: $role_name"
    fi
}

# Function to create IAM policy
create_iam_policy() {
    local policy_name=$1
    local policy_document=$2
    
    echo "📋 Creating IAM policy: $policy_name"
    
    if policy_exists "$policy_name"; then
        echo "⚠️  Policy $policy_name already exists, updating..."
        # Get current policy version
        local current_version=$(aws iam get-policy \
            --policy-arn "arn:aws:iam::${ACCOUNT_ID}:policy/${policy_name}" \
            --query 'Policy.DefaultVersionId' --output text)
        
        # Create new version
        aws iam create-policy-version \
            --policy-arn "arn:aws:iam::${ACCOUNT_ID}:policy/${policy_name}" \
            --policy-document "$policy_document" \
            --set-as-default > /dev/null
        
        echo "✅ Policy updated: $policy_name"
    else
        aws iam create-policy \
            --policy-name "$policy_name" \
            --policy-document "$policy_document" \
            --description "Cognito Lambda trigger permissions for $PROJECT_NAME" > /dev/null
        echo "✅ Policy created: $policy_name"
    fi
}

# Function to attach policy to role
attach_policy_to_role() {
    local role_name=$1
    local policy_arn=$2
    
    echo "🔗 Attaching policy to role: $role_name"
    
    aws iam attach-role-policy \
        --role-name "$role_name" \
        --policy-arn "$policy_arn" 2>/dev/null || true
    
    echo "✅ Policy attached: $(basename $policy_arn)"
}

# Create Pre-SignUp Lambda Role
create_pre_signup_role() {
    local role_name="${ROLE_PREFIX}-PreSignUp"
    
    # Trust policy for Lambda
    local trust_policy='{
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
    }'
    
    create_iam_role "$role_name" "$trust_policy"
    
    # Attach AWS managed policies
    attach_policy_to_role "$role_name" "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
    
    # Create and attach custom policy
    local policy_name="MatbakhCognitoPreSignUpPolicy"
    local policy_document='{
        "Version": "2012-10-17",
        "Statement": [
            {
                "Sid": "CognitoUserManagement",
                "Effect": "Allow",
                "Action": [
                    "cognito-idp:AdminUpdateUserAttributes",
                    "cognito-idp:AdminGetUser"
                ],
                "Resource": "arn:aws:cognito-idp:'$REGION':'$ACCOUNT_ID':userpool/*"
            },
            {
                "Sid": "CloudWatchLogsAccess",
                "Effect": "Allow",
                "Action": [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                ],
                "Resource": [
                    "arn:aws:logs:'$REGION':'$ACCOUNT_ID':log-group:/aws/lambda/matbakh-cognito-*",
                    "arn:aws:logs:'$REGION':'$ACCOUNT_ID':log-group:/aws/lambda/matbakh-cognito-audit"
                ]
            }
        ]
    }'
    
    create_iam_policy "$policy_name" "$policy_document"
    attach_policy_to_role "$role_name" "arn:aws:iam::${ACCOUNT_ID}:policy/${policy_name}"
    
    echo "PRE_SIGNUP_ROLE_ARN=arn:aws:iam::${ACCOUNT_ID}:role/${role_name}" >> .env.iam
}

# Create Post-Confirmation Lambda Role
create_post_confirmation_role() {
    local role_name="${ROLE_PREFIX}-PostConfirmation"
    
    # Trust policy for Lambda
    local trust_policy='{
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
    }'
    
    create_iam_role "$role_name" "$trust_policy"
    
    # Attach AWS managed policies
    attach_policy_to_role "$role_name" "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
    attach_policy_to_role "$role_name" "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
    
    # Create and attach custom policy
    local policy_name="MatbakhCognitoPostConfirmationPolicy"
    local policy_document='{
        "Version": "2012-10-17",
        "Statement": [
            {
                "Sid": "SecretsManagerAccess",
                "Effect": "Allow",
                "Action": [
                    "secretsmanager:GetSecretValue"
                ],
                "Resource": "arn:aws:secretsmanager:'$REGION':'$ACCOUNT_ID':secret:matbakh/*"
            },
            {
                "Sid": "SESEmailSending",
                "Effect": "Allow",
                "Action": [
                    "ses:SendEmail",
                    "ses:SendRawEmail"
                ],
                "Resource": [
                    "arn:aws:ses:'$REGION':'$ACCOUNT_ID':identity/matbakh.app",
                    "arn:aws:ses:'$REGION':'$ACCOUNT_ID':identity/noreply@matbakh.app"
                ]
            },
            {
                "Sid": "RDSDataAccess",
                "Effect": "Allow",
                "Action": [
                    "rds-data:ExecuteStatement",
                    "rds-data:BatchExecuteStatement",
                    "rds-data:BeginTransaction",
                    "rds-data:CommitTransaction",
                    "rds-data:RollbackTransaction"
                ],
                "Resource": "arn:aws:rds:'$REGION':'$ACCOUNT_ID':cluster:matbakh-prod"
            },
            {
                "Sid": "CloudWatchLogsAccess",
                "Effect": "Allow",
                "Action": [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                ],
                "Resource": [
                    "arn:aws:logs:'$REGION':'$ACCOUNT_ID':log-group:/aws/lambda/matbakh-cognito-*"
                ]
            }
        ]
    }'
    
    create_iam_policy "$policy_name" "$policy_document"
    attach_policy_to_role "$role_name" "arn:aws:iam::${ACCOUNT_ID}:policy/${policy_name}"
    
    echo "POST_CONFIRMATION_ROLE_ARN=arn:aws:iam::${ACCOUNT_ID}:role/${role_name}" >> .env.iam
}

# Create CloudWatch Log Groups
create_log_groups() {
    echo "📊 Creating CloudWatch Log Groups..."
    
    local log_groups=(
        "/aws/lambda/matbakh-cognito-pre-signup"
        "/aws/lambda/matbakh-cognito-post-confirmation"
        "/aws/lambda/matbakh-cognito-audit"
        "/aws/lambda/matbakh-cognito-errors"
    )
    
    for log_group in "${log_groups[@]}"; do
        if aws logs describe-log-groups --log-group-name-prefix "$log_group" --query 'logGroups[0].logGroupName' --output text | grep -q "$log_group"; then
            echo "⚠️  Log group already exists: $log_group"
        else
            aws logs create-log-group --log-group-name "$log_group"
            echo "✅ Log group created: $log_group"
        fi
        
        # Set retention policy (30 days)
        aws logs put-retention-policy \
            --log-group-name "$log_group" \
            --retention-in-days 30 2>/dev/null || true
    done
}

# Validate IAM setup
validate_iam_setup() {
    echo "🔍 Validating IAM setup..."
    
    local pre_signup_role="${ROLE_PREFIX}-PreSignUp"
    local post_confirmation_role="${ROLE_PREFIX}-PostConfirmation"
    
    # Check roles exist
    if role_exists "$pre_signup_role"; then
        echo "✅ Pre-SignUp role exists and accessible"
    else
        echo "❌ Pre-SignUp role not found"
        return 1
    fi
    
    if role_exists "$post_confirmation_role"; then
        echo "✅ Post-Confirmation role exists and accessible"
    else
        echo "❌ Post-Confirmation role not found"
        return 1
    fi
    
    # Check policies are attached
    local pre_signup_policies=$(aws iam list-attached-role-policies --role-name "$pre_signup_role" --query 'AttachedPolicies[].PolicyName' --output text)
    local post_confirmation_policies=$(aws iam list-attached-role-policies --role-name "$post_confirmation_role" --query 'AttachedPolicies[].PolicyName' --output text)
    
    echo "✅ Pre-SignUp policies: $pre_signup_policies"
    echo "✅ Post-Confirmation policies: $post_confirmation_policies"
    
    return 0
}

# Output summary
output_summary() {
    echo ""
    echo "🎉 IAM setup completed successfully!"
    echo ""
    echo "📊 Created Resources:"
    echo "====================="
    echo "Roles:"
    echo "  - ${ROLE_PREFIX}-PreSignUp"
    echo "  - ${ROLE_PREFIX}-PostConfirmation"
    echo ""
    echo "Policies:"
    echo "  - MatbakhCognitoPreSignUpPolicy"
    echo "  - MatbakhCognitoPostConfirmationPolicy"
    echo ""
    echo "Log Groups:"
    echo "  - /aws/lambda/matbakh-cognito-pre-signup"
    echo "  - /aws/lambda/matbakh-cognito-post-confirmation"
    echo "  - /aws/lambda/matbakh-cognito-audit"
    echo "  - /aws/lambda/matbakh-cognito-errors"
    echo ""
    echo "📁 Generated Files:"
    echo "  - .env.iam (IAM role ARNs)"
    echo ""
    echo "🔗 IAM Console URLs:"
    echo "  - Roles: https://$REGION.console.aws.amazon.com/iamv2/home?region=$REGION#/roles"
    echo "  - Policies: https://$REGION.console.aws.amazon.com/iamv2/home?region=$REGION#/policies"
    echo ""
    echo "⚠️  Next Steps:"
    echo "  1. Deploy Lambda functions with these roles"
    echo "  2. Attach Lambda triggers to Cognito User Pool"
    echo "  3. Test signup flow with validation"
    echo ""
}

# Main execution
main() {
    echo "🔧 Task 1.4: IAM Roles + Lambda Deployment"
    echo "==========================================="
    
    # Initialize environment file
    echo "# IAM Role ARNs for Cognito Lambda Triggers" > .env.iam
    echo "# Generated on $(date)" >> .env.iam
    echo "ACCOUNT_ID=$ACCOUNT_ID" >> .env.iam
    echo "REGION=$REGION" >> .env.iam
    echo "" >> .env.iam
    
    create_log_groups
    echo ""
    
    create_pre_signup_role
    echo ""
    
    create_post_confirmation_role
    echo ""
    
    validate_iam_setup
    echo ""
    
    output_summary
}

# Run main function
main "$@"