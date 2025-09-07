#!/bin/bash
set -euo pipefail

# Create RDS Secret in AWS Secrets Manager
# Phase A2.1 - Infrastructure Completion

REGION=${AWS_REGION:-eu-central-1}
PROFILE=${AWS_PROFILE:-matbakh-dev}
SECRET_NAME="matbakh-db-postgres"

echo "🔑 CREATING RDS SECRET IN SECRETS MANAGER"
echo "<REDACTED_AWS_SECRET_ACCESS_KEY>"
echo "Region: $REGION"
echo "Profile: $PROFILE"
echo "Secret Name: $SECRET_NAME"
echo ""

# Step 1: Check if secret already exists
echo "🔍 Step 1: Checking if secret exists..."
if aws secretsmanager describe-secret --secret-id "$SECRET_NAME" --region "$REGION" --profile "$PROFILE" > /dev/null 2>&1; then
    echo "⚠️  Secret '$SECRET_NAME' already exists"
    echo "🔧 Updating existing secret..."
    
    # Update existing secret
    aws secretsmanager update-secret \
        --secret-id "$SECRET_NAME" \
        --description "PostgreSQL connection for matbakh RDS instance - Updated $(date)" \
        --secret-string '{
            "username": "postgres",
            "password": "Matbakhapp#6x",
            "engine": "postgres",
            "host": "matbakh-db.chq6q4cs0evx.eu-central-1.rds.amazonaws.com",
            "port": 5432,
            "dbInstanceIdentifier": "matbakh-db",
            "dbname": "matbakh"
        }' \
        --region "$REGION" --profile "$PROFILE"
    
    echo "✅ Secret updated successfully"
else
    echo "🔧 Creating new secret..."
    
    # Create new secret
    aws secretsmanager create-secret \
        --name "$SECRET_NAME" \
        --description "PostgreSQL connection for matbakh RDS instance" \
        --secret-string '{
            "username": "postgres",
            "password": "Matbakhapp#6x",
            "engine": "postgres",
            "host": "matbakh-db.chq6q4cs0evx.eu-central-1.rds.amazonaws.com",
            "port": 5432,
            "dbInstanceIdentifier": "matbakh-db",
            "dbname": "matbakh"
        }' \
        --region "$REGION" --profile "$PROFILE"
    
    echo "✅ Secret created successfully"
fi

# Step 2: Verify secret creation
echo ""
echo "📋 Step 2: Verifying secret..."
SECRET_ARN=$(aws secretsmanager describe-secret \
    --secret-id "$SECRET_NAME" \
    --region "$REGION" --profile "$PROFILE" \
    --query 'ARN' --output text)

echo "✅ Secret ARN: $SECRET_ARN"

# Step 3: Test secret retrieval
echo ""
echo "🧪 Step 3: Testing secret retrieval..."
SECRET_VALUE=$(aws secretsmanager get-secret-value \
    --secret-id "$SECRET_NAME" \
    --region "$REGION" --profile "$PROFILE" \
    --query 'SecretString' --output text)

# Parse and display (without password)
echo "📊 Secret contents:"
echo "$SECRET_VALUE" | jq -r 'to_entries[] | select(.key != "password") | "\(.key): \(.value)"'
echo "password: [HIDDEN]"

# Step 4: Create IAM policy for Lambda access
echo ""
echo "🔐 Step 4: Creating IAM policy for Lambda access..."

POLICY_NAME="MatbakhSecretsManagerAccess"
POLICY_DOCUMENT='{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "secretsmanager:GetSecretValue",
                "secretsmanager:DescribeSecret"
            ],
            "Resource": "'$SECRET_ARN'"
        }
    ]
}'

# Check if policy exists
if aws iam get-policy --policy-arn "arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):policy/$POLICY_NAME" --profile "$PROFILE" > /dev/null 2>&1; then
    echo "⚠️  Policy '$POLICY_NAME' already exists"
    
    # Update policy
    aws iam create-policy-version \
        --policy-arn "arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):policy/$POLICY_NAME" \
        --policy-document "$POLICY_DOCUMENT" \
        --set-as-default \
        --profile "$PROFILE"
    
    echo "✅ Policy updated"
else
    # Create new policy
    POLICY_ARN=$(aws iam create-policy \
        --policy-name "$POLICY_NAME" \
        --policy-document "$POLICY_DOCUMENT" \
        --description "Allow Lambda functions to access matbakh RDS secrets" \
        --profile "$PROFILE" \
        --query 'Policy.Arn' --output text)
    
    echo "✅ Policy created: $POLICY_ARN"
fi

# Step 5: Save configuration for next steps
echo ""
echo "💾 Step 5: Saving configuration..."

cat > .env.secrets << EOF
# RDS Secrets Manager Configuration
# Generated: $(date)

# Secret Details
RDS_SECRET_NAME=$SECRET_NAME
RDS_SECRET_ARN=$SECRET_ARN
RDS_SECRET_REGION=$REGION

# IAM Policy
SECRETS_POLICY_NAME=$POLICY_NAME
SECRETS_POLICY_ARN=arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):policy/$POLICY_NAME

# Database Connection (for reference)
RDS_HOST=matbakh-db.chq6q4cs0evx.eu-central-1.rds.amazonaws.com
RDS_PORT=5432
RDS_DATABASE=matbakh
RDS_USERNAME=postgres
EOF

echo "✅ Configuration saved to .env.secrets"

echo ""
echo "🎉 RDS SECRET SETUP COMPLETE"
echo "============================"
echo ""
echo "✅ Secret Name: $SECRET_NAME"
echo "✅ Secret ARN: $SECRET_ARN"
echo "✅ IAM Policy: $POLICY_NAME"
echo "✅ Region: $REGION"
echo ""
echo "🔗 Usage in Lambda:"
echo "==================="
echo "const AWS = require('aws-sdk');"
echo "const secretsManager = new AWS.SecretsManager({ region: '$REGION' });"
echo ""
echo "const secret = await secretsManager.getSecretValue({"
echo "  SecretId: '$SECRET_NAME'"
echo "}).promise();"
echo ""
echo "const dbConfig = JSON.parse(secret.SecretString);"
echo ""
echo "🚀 Next Steps:"
echo "=============="
echo "1. A2.2: Create Lambda Layer for PostgreSQL"
echo "2. A2.3: Create Lambda execution role with secrets access"
echo "3. A2.4: Deploy test Lambda function"
echo "4. A2.5: Create deployment structure"