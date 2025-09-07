#!/bin/bash

# Deploy Bedrock IAM Roles and Policies
# This script creates the minimal required permissions for Bedrock AI operations

set -e

# Configuration
REGION=${AWS_REGION:-us-east-1}
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ROLE_NAME="BedrockAgentExecutionRole"
POLICY_NAME="BedrockAgentPolicy"
VPC_POLICY_NAME="BedrockVPCAccessPolicy"
RDS_POLICY_NAME="BedrockRDSProxyPolicy"
S3_POLICY_NAME="BedrockS3ProxyPolicy"

echo "🚀 Deploying Bedrock IAM infrastructure..."
echo "Account ID: $ACCOUNT_ID"
echo "Region: $REGION"

# Create the Lambda execution role
echo "📝 Creating Lambda execution role: $ROLE_NAME"
aws iam create-role \
  --role-name "$ROLE_NAME" \
  --assume-role-policy-document '{
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
  }' \
  --description "Execution role for Bedrock AI agent Lambda functions" \
  --max-session-duration 3600 \
  --tags Key=Project,Value=matbakh-bedrock Key=Environment,Value=production \
  || echo "Role $ROLE_NAME already exists"

# Create Bedrock Agent Policy (includes all permissions)
echo "📋 Creating Bedrock agent policy: $POLICY_NAME"
aws iam create-policy \
  --policy-name "$POLICY_NAME" \
  --policy-document file://infra/aws/bedrock-iam-policies.json \
  --description "Minimal permissions for Bedrock Claude 3.5 Sonnet access with VPC, RDS, and S3 proxy access" \
  --tags Key=Project,Value=matbakh-bedrock Key=Environment,Value=production \
  || echo "Policy $POLICY_NAME already exists"

# Attach AWS managed policy for basic Lambda execution
echo "🔗 Attaching AWS managed Lambda execution policy"
aws iam attach-role-policy \
  --role-name "$ROLE_NAME" \
  --policy-arn "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"

# Attach custom Bedrock policy
echo "🔗 Attaching Bedrock agent policy"
aws iam attach-role-policy \
  --role-name "$ROLE_NAME" \
  --policy-arn "arn:aws:iam::$ACCOUNT_ID:policy/$POLICY_NAME"

# All permissions are now included in the main Bedrock policy

# Wait for role propagation
echo "⏳ Waiting for IAM role propagation..."
sleep 10

# Get role ARN
ROLE_ARN=$(aws iam get-role --role-name "$ROLE_NAME" --query 'Role.Arn' --output text)
echo "✅ Role created successfully: $ROLE_ARN"

# Create Secrets Manager secrets for prompt templates
echo "🔐 Creating Secrets Manager secrets..."
aws secretsmanager create-secret \
  --name "bedrock/prompt-templates" \
  --description "Prompt templates for Bedrock AI operations" \
  --secret-string '{
    "vc_analysis_template": "Du arbeitest im Kontext der Matbakh.app, einer nutzerzentrierten Plattform für Gastronomie. Du bist ein KI-Assistent für Sichtbarkeitsanalysen. Du darfst: Webanfragen zu öffentlichen Datenquellen durchführen, Nutzerfreundliche Hinweise ergänzen, Ausgabeformate flexibel gestalten. Du darfst NICHT: Sensible Daten speichern, Nicht-freigegebene APIs aufrufen, Datenbanken ohne Freigabe verändern.",
    "content_generation_template": "Du arbeitest im Kontext der Matbakh.app für Content-Erstellung. Du darfst: Restaurant-spezifische Inhalte erstellen, Social Media Posts generieren, Hashtags und CTAs vorschlagen. Du darfst NICHT: Persönliche Daten verwenden, Externe APIs direkt aufrufen, Inhalte ohne Nutzerfreigabe veröffentlichen.",
    "persona_detection_template": "Du arbeitest im Kontext der Matbakh.app für Persona-Erkennung. Erkenne basierend auf Nutzerantworten: Der Skeptiker (braucht Beweise), Der Überforderte (braucht Einfachheit), Der Profi (braucht Details), Der Zeitknappe (braucht Effizienz)."
  }' \
  --tags '[{"Key":"Project","Value":"matbakh-bedrock"},{"Key":"Environment","Value":"production"}]' \
  || echo "Secret bedrock/prompt-templates already exists"

# Create API keys secret (placeholder)
aws secretsmanager create-secret \
  --name "bedrock/api-keys" \
  --description "API keys for external services used by Bedrock agents" \
  --secret-string '{
    "google_trends_api_key": "placeholder",
    "instagram_basic_display_api": "placeholder"
  }' \
  --tags '[{"Key":"Project","Value":"matbakh-bedrock"},{"Key":"Environment","Value":"production"}]' \
  || echo "Secret bedrock/api-keys already exists"

echo "✅ Bedrock IAM infrastructure deployed successfully!"
echo "Role ARN: $ROLE_ARN"
echo ""
echo "Next steps:"
echo "1. Update Lambda functions to use role: $ROLE_ARN"
echo "2. Configure VPC settings for Lambda functions"
echo "3. Test Bedrock access with minimal permissions"
echo "4. Update prompt templates in Secrets Manager as needed"