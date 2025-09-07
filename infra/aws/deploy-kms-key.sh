#!/bin/bash

# Deploy KMS Key for Bedrock AI Secrets
# This script creates a dedicated KMS key for encrypting Bedrock secrets

set -e

# Configuration
REGION=${AWS_REGION:-eu-central-1}
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
KEY_ALIAS="alias/matbakh-ai"

echo "🔐 Deploying KMS Key for Bedrock AI..."
echo "Account ID: $ACCOUNT_ID"
echo "Region: $REGION"
echo "Key Alias: $KEY_ALIAS"

# Create KMS key policy
cat > /tmp/kms-key-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "Enable IAM User Permissions",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::$ACCOUNT_ID:root"
      },
      "Action": "kms:*",
      "Resource": "*"
    },
    {
      "Sid": "Allow Bedrock Lambda Functions",
      "Effect": "Allow",
      "Principal": {
        "AWS": [
          "arn:aws:iam::$ACCOUNT_ID:role/BedrockAgentExecutionRole"
        ]
      },
      "Action": [
        "kms:Decrypt",
        "kms:DescribeKey"
      ],
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "kms:ViaService": [
            "secretsmanager.$REGION.amazonaws.com"
          ]
        }
      }
    },
    {
      "Sid": "Allow Secrets Manager Service",
      "Effect": "Allow",
      "Principal": {
        "Service": "secretsmanager.amazonaws.com"
      },
      "Action": [
        "kms:Decrypt",
        "kms:DescribeKey",
        "kms:Encrypt",
        "kms:GenerateDataKey*",
        "kms:ReEncrypt*"
      ],
      "Resource": "*"
    },
    {
      "Sid": "Deny Direct Key Usage",
      "Effect": "Deny",
      "Principal": "*",
      "Action": [
        "kms:Encrypt",
        "kms:Decrypt",
        "kms:ReEncrypt*",
        "kms:GenerateDataKey*"
      ],
      "Resource": "*",
      "Condition": {
        "StringNotEquals": {
          "kms:ViaService": [
            "secretsmanager.$REGION.amazonaws.com"
          ]
        },
        "Bool": {
          "aws:PrincipalIsAWSService": "false"
        }
      }
    }
  ]
}
EOF

# Create KMS key
echo "🔑 Creating KMS key..."
KEY_ID=$(aws kms create-key \
  --policy file:///tmp/kms-key-policy.json \
  --description "Encryption key for Bedrock AI secrets and configuration" \
  --key-usage ENCRYPT_DECRYPT \
  --key-spec SYMMETRIC_DEFAULT \
  --origin AWS_KMS \
  --tags TagKey=Project,TagValue=matbakh-bedrock TagKey=Environment,TagValue=production TagKey=Purpose,TagValue=secrets-encryption \
  --region "$REGION" \
  --query 'KeyMetadata.KeyId' \
  --output text)

echo "✅ KMS key created: $KEY_ID"

# Create alias
echo "🏷️ Creating key alias..."
aws kms create-alias \
  --alias-name "$KEY_ALIAS" \
  --target-key-id "$KEY_ID" \
  --region "$REGION"

echo "✅ Key alias created: $KEY_ALIAS"

# Enable key rotation
echo "🔄 Enabling automatic key rotation..."
aws kms enable-key-rotation \
  --key-id "$KEY_ID" \
  --region "$REGION"

echo "✅ Automatic key rotation enabled"

# Get key ARN
KEY_ARN=$(aws kms describe-key \
  --key-id "$KEY_ID" \
  --region "$REGION" \
  --query 'KeyMetadata.Arn' \
  --output text)

echo ""
echo "✅ KMS Key deployment completed successfully!"
echo "Key ID: $KEY_ID"
echo "Key ARN: $KEY_ARN"
echo "Key Alias: $KEY_ALIAS"
echo ""
echo "Next steps:"
echo "1. Update Secrets Manager secrets to use this KMS key"
echo "2. Update Lambda environment variables with key alias"
echo "3. Test secret decryption with new key"

# Clean up
rm -f /tmp/kms-key-policy.json

# Save key info for other scripts
cat > /tmp/bedrock-kms-info.json << EOF
{
  "keyId": "$KEY_ID",
  "keyArn": "$KEY_ARN",
  "keyAlias": "$KEY_ALIAS",
  "region": "$REGION"
}
EOF

echo "Key information saved to /tmp/bedrock-kms-info.json"