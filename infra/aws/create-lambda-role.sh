#!/bin/bash
set -euo pipefail

# Create Lambda Execution Role with Secrets Manager Access
# Phase A2.3 - Infrastructure Completion

REGION=${AWS_REGION:-eu-central-1}
PROFILE=${AWS_PROFILE:-matbakh-dev}
ROLE_NAME="MatbakhLambdaExecutionRole"

echo "🔐 CREATING LAMBDA EXECUTION ROLE"
echo "================================="
echo "Region: $REGION"
echo "Profile: $PROFILE"
echo "Role Name: $ROLE_NAME"
echo ""

# Step 1: Create trust policy for Lambda
echo "📋 Step 1: Creating trust policy..."
TRUST_POLICY='{
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

# Step 2: Check if role exists
echo "🔍 Step 2: Checking if role exists..."
if aws iam get-role --role-name "$ROLE_NAME" --profile "$PROFILE" > /dev/null 2>&1; then
    echo "⚠️  Role '$ROLE_NAME' already exists"
    ROLE_ARN=$(aws iam get-role --role-name "$ROLE_NAME" --profile "$PROFILE" --query 'Role.Arn' --output text)
    echo "✅ Using existing role: $ROLE_ARN"
else
    echo "🔧 Creating new role..."
    ROLE_ARN=$(aws iam create-role \
        --role-name "$ROLE_NAME" \
        --assume-role-policy-document "$TRUST_POLICY" \
        --description "Lambda execution role for Matbakh with RDS and Secrets Manager access" \
        --profile "$PROFILE" \
        --query 'Role.Arn' --output text)
    
    echo "✅ Role created: $ROLE_ARN"
fi

# Step 3: Attach AWS managed policies
echo ""
echo "📎 Step 3: Attaching managed policies..."

# Basic Lambda execution policy
aws iam attach-role-policy \
    --role-name "$ROLE_NAME" \
    --policy-arn "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole" \
    --profile "$PROFILE"
echo "✅ Attached AWSLambdaBasicExecutionRole"

# VPC access policy (for RDS in VPC)
aws iam attach-role-policy \
    --role-name "$ROLE_NAME" \
    --policy-arn "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole" \
    --profile "$PROFILE"
echo "✅ Attached AWSLambdaVPCAccessExecutionRole"

# Step 4: Attach custom Secrets Manager policy
echo ""
echo "🔐 Step 4: Attaching Secrets Manager policy..."
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text --profile "$PROFILE")
SECRETS_POLICY_ARN="arn:aws:iam::${ACCOUNT_ID}:policy/MatbakhSecretsManagerAccess"

aws iam attach-role-policy \
    --role-name "$ROLE_NAME" \
    --policy-arn "$SECRETS_POLICY_ARN" \
    --profile "$PROFILE"
echo "✅ Attached MatbakhSecretsManagerAccess"

# Step 5: Create additional RDS and VPC policy
echo ""
echo "🌐 Step 5: Creating additional RDS/VPC policy..."
RDS_VPC_POLICY_NAME="MatbakhLambdaRDSVPCAccess"
RDS_VPC_POLICY='{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "rds:DescribeDBInstances",
                "rds:DescribeDBClusters",
                "ec2:CreateNetworkInterface",
                "ec2:DescribeNetworkInterfaces",
                "ec2:DeleteNetworkInterface",
                "ec2:AttachNetworkInterface",
                "ec2:DetachNetworkInterface",
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents"
            ],
            "Resource": "*"
        }
    ]
}'

# Check if RDS/VPC policy exists
if aws iam get-policy --policy-arn "arn:aws:iam::${ACCOUNT_ID}:policy/$RDS_VPC_POLICY_NAME" --profile "$PROFILE" > /dev/null 2>&1; then
    echo "⚠️  Policy '$RDS_VPC_POLICY_NAME' already exists"
else
    # Create RDS/VPC policy
    RDS_VPC_POLICY_ARN=$(aws iam create-policy \
        --policy-name "$RDS_VPC_POLICY_NAME" \
        --policy-document "$RDS_VPC_POLICY" \
        --description "Additional RDS and VPC permissions for Lambda" \
        --profile "$PROFILE" \
        --query 'Policy.Arn' --output text)
    
    echo "✅ Created policy: $RDS_VPC_POLICY_ARN"
fi

# Attach RDS/VPC policy
aws iam attach-role-policy \
    --role-name "$ROLE_NAME" \
    --policy-arn "arn:aws:iam::${ACCOUNT_ID}:policy/$RDS_VPC_POLICY_NAME" \
    --profile "$PROFILE"
echo "✅ Attached $RDS_VPC_POLICY_NAME"

# Step 6: Wait for role propagation
echo ""
echo "⏳ Step 6: Waiting for role propagation..."
sleep 10
echo "✅ Role propagation complete"

# Step 7: Get VPC configuration for Lambda
echo ""
echo "🌐 Step 7: Getting VPC configuration..."
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=tag:Name,Values=matbakh-vpc" --query 'Vpcs[0].VpcId' --output text --region "$REGION" --profile "$PROFILE")

# Get private subnets for Lambda
PRIVATE_SUBNETS=$(aws ec2 describe-subnets \
    --filters "Name=vpc-id,Values=$VPC_ID" "Name=tag:Name,Values=matbakh-private-*" \
    --query 'Subnets[].SubnetId' --output text --region "$REGION" --profile "$PROFILE")

# Get security group for Lambda (use default or create specific one)
LAMBDA_SG=$(aws ec2 describe-security-groups \
    --filters "Name=vpc-id,Values=$VPC_ID" "Name=group-name,Values=default" \
    --query 'SecurityGroups[0].GroupId' --output text --region "$REGION" --profile "$PROFILE")

echo "✅ VPC Configuration:"
echo "   VPC ID: $VPC_ID"
echo "   Private Subnets: $PRIVATE_SUBNETS"
echo "   Security Group: $LAMBDA_SG"

# Step 8: Save configuration
echo ""
echo "💾 Step 8: Saving configuration..."

cat >> .env.secrets << EOF

# Lambda Execution Role Configuration
LAMBDA_EXECUTION_ROLE_NAME=$ROLE_NAME
LAMBDA_EXECUTION_ROLE_ARN=$ROLE_ARN

# VPC Configuration for Lambda
LAMBDA_VPC_ID=$VPC_ID
LAMBDA_SUBNET_IDS=$PRIVATE_SUBNETS
LAMBDA_SECURITY_GROUP_ID=$LAMBDA_SG

# Additional Policies
RDS_VPC_POLICY_NAME=$RDS_VPC_POLICY_NAME
RDS_VPC_POLICY_ARN=arn:aws:iam::${ACCOUNT_ID}:policy/$RDS_VPC_POLICY_NAME
EOF

echo "✅ Configuration updated in .env.secrets"

# Step 9: Verify role permissions
echo ""
echo "🧪 Step 9: Verifying role permissions..."
ATTACHED_POLICIES=$(aws iam list-attached-role-policies --role-name "$ROLE_NAME" --profile "$PROFILE" --query 'AttachedPolicies[].PolicyName' --output text)
echo "📋 Attached policies: $ATTACHED_POLICIES"

echo ""
echo "🎉 LAMBDA EXECUTION ROLE SETUP COMPLETE"
echo "======================================="
echo ""
echo "✅ Role Name: $ROLE_NAME"
echo "✅ Role ARN: $ROLE_ARN"
echo "✅ Attached Policies:"
echo "   - AWSLambdaBasicExecutionRole"
echo "   - AWSLambdaVPCAccessExecutionRole"
echo "   - MatbakhSecretsManagerAccess"
echo "   - MatbakhLambdaRDSVPCAccess"
echo ""
echo "🌐 VPC Configuration:"
echo "   - VPC: $VPC_ID"
echo "   - Subnets: $PRIVATE_SUBNETS"
echo "   - Security Group: $LAMBDA_SG"
echo ""
echo "🔐 Permissions Granted:"
echo "   - Read RDS secrets from Secrets Manager"
echo "   - Create/manage VPC network interfaces"
echo "   - Write CloudWatch logs"
echo "   - Describe RDS instances"
echo ""
echo "🚀 Next Steps:"
echo "=============="
echo "1. A2.4: Deploy and test Lambda function"
echo "2. A2.5: Create deployment structure"
echo "3. Test database connectivity from Lambda"