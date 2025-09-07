#!/bin/bash

# 🔐 Simple Cognito User Pool Creation for matbakh.app
# Phase A3.2 - Cognito Auth Integration
# Date: 2025-08-30

set -e

# Configuration
REGION="${AWS_REGION:-eu-central-1}"
PROFILE="${AWS_PROFILE:-matbakh-dev}"
USER_POOL_NAME="MatbakhAppUserPool"
APP_CLIENT_NAME="MatbakhWebClient"

echo "🔐 Creating Cognito User Pool for matbakh.app..."
echo "📋 Configuration:"
echo "   Region: $REGION"
echo "   Profile: $PROFILE"
echo "   User Pool Name: $USER_POOL_NAME"
echo ""

# Step 1: Create User Pool
echo "📝 Step 1: Creating Cognito User Pool..."
USER_POOL_ID=$(aws cognito-idp create-user-pool \
  --pool-name "$USER_POOL_NAME" \
  --policies '{
    "PasswordPolicy": {
      "MinimumLength": 8,
      "RequireUppercase": true,
      "RequireLowercase": true,
      "RequireNumbers": true,
      "RequireSymbols": false,
      "TemporaryPasswordValidityDays": 7
    }
  }' \
  --auto-verified-attributes email \
  --username-attributes email \
  --mfa-configuration OFF \
  --account-recovery-setting '{
    "RecoveryMechanisms": [
      {"Name": "verified_email", "Priority": 1}
    ]
  }' \
  --schema '[
    {
      "Name": "email",
      "AttributeDataType": "String",
      "Required": true,
      "Mutable": true
    },
    {
      "Name": "given_name",
      "AttributeDataType": "String",
      "Required": false,
      "Mutable": true
    },
    {
      "Name": "family_name",
      "AttributeDataType": "String",
      "Required": false,
      "Mutable": true
    }
  ]' \
  --region "$REGION" \
  --profile "$PROFILE" \
  --query 'UserPool.Id' \
  --output text)

if [ -z "$USER_POOL_ID" ]; then
  echo "❌ Failed to create User Pool"
  exit 1
fi

echo "✅ User Pool created: $USER_POOL_ID"

# Step 2: Create App Client
echo "📱 Step 2: Creating App Client..."
APP_CLIENT_ID=$(aws cognito-idp create-user-pool-client \
  --user-pool-id "$USER_POOL_ID" \
  --client-name "$APP_CLIENT_NAME" \
  --no-generate-secret \
  --explicit-auth-flows ALLOW_USER_SRP_AUTH ALLOW_REFRESH_TOKEN_AUTH \
  --prevent-user-existence-errors ENABLED \
  --enable-token-revocation \
  --region "$REGION" \
  --profile "$PROFILE" \
  --query 'UserPoolClient.ClientId' \
  --output text)

if [ -z "$APP_CLIENT_ID" ]; then
  echo "❌ Failed to create App Client"
  exit 1
fi

echo "✅ App Client created: $APP_CLIENT_ID"

# Step 3: Get Account ID for ARN
ACCOUNT_ID=$(aws sts get-caller-identity --profile "$PROFILE" --query 'Account' --output text)
USER_POOL_ARN="arn:aws:cognito-idp:${REGION}:${ACCOUNT_ID}:userpool/${USER_POOL_ID}"

echo "✅ User Pool ARN: $USER_POOL_ARN"

# Step 4: Save configuration
echo ""
echo "💾 Step 4: Saving configuration..."
cat > cognito-config.json << EOF
{
  "userPoolId": "$USER_POOL_ID",
  "userPoolClientId": "$APP_CLIENT_ID",
  "userPoolArn": "$USER_POOL_ARN",
  "region": "$REGION",
  "accountId": "$ACCOUNT_ID",
  "createdAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

echo "✅ Configuration saved to cognito-config.json"

# Step 5: Update environment file
echo ""
echo "🔧 Step 5: Updating environment configuration..."

# Update .env.cognito
cat > .env.cognito << EOF
# Cognito Environment Variables
# Generated for matbakh.app migration project
# Created: $(date -u +%Y-%m-%d)

# Cognito User Pool Configuration
USER_POOL_ID=$USER_POOL_ID
USER_POOL_CLIENT_ID=$APP_CLIENT_ID
USER_POOL_ARN=$USER_POOL_ARN

# Region
REGION=$REGION
ACCOUNT_ID=$ACCOUNT_ID

# Frontend Environment Variables (for React)
VITE_AWS_REGION=$REGION
VITE_COGNITO_USER_POOL_ID=$USER_POOL_ID
VITE_COGNITO_USER_POOL_WEB_CLIENT_ID=$APP_CLIENT_ID
VITE_API_BASE_URL=https://3eqcftz6lc.execute-api.eu-central-1.amazonaws.com/prod
VITE_ENVIRONMENT=development
EOF

echo "✅ Environment configuration updated"

echo ""
echo "🎉 COGNITO USER POOL SETUP COMPLETE!"
echo ""
echo "📋 Summary:"
echo "   ✅ User Pool ID: $USER_POOL_ID"
echo "   ✅ App Client ID: $APP_CLIENT_ID"
echo "   ✅ Region: $REGION"
echo "   ✅ Configuration saved"
echo ""
echo "🚀 Next Steps:"
echo "   1. Use these values in React app configuration"
echo "   2. Set up Amplify with these credentials"
echo "   3. Test authentication flow"
echo ""
echo "📊 Cognito Setup Status: ✅ READY FOR FRONTEND INTEGRATION"