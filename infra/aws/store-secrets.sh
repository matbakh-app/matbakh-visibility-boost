#!/bin/bash

# Store Secrets in AWS Secrets Manager
# This script stores all necessary secrets for the matbakh application

set -e

echo "🔐 Storing secrets in AWS Secrets Manager..."

# Load environment variables
source .env.secrets

# Create or update the database secret
echo "📝 Creating/updating database secret..."

# Database credentials secret
DB_SECRET_VALUE=$(cat <<EOF
{
  "username": "postgres",
  "password": "${RDS_PASSWORD:-your_secure_password_here}",
  "engine": "postgres",
  "host": "${RDS_HOST}",
  "port": ${RDS_PORT},
  "dbname": "${RDS_DATABASE}",
  "dbInstanceIdentifier": "matbakh-db"
}
EOF
)

# Check if secret exists
if aws secretsmanager describe-secret --secret-id "${RDS_SECRET_NAME}" --region "${RDS_SECRET_REGION}" --profile matbakh-dev >/dev/null 2>&1; then
    echo "✅ Secret exists, updating..."
    aws secretsmanager update-secret \
        --secret-id "${RDS_SECRET_NAME}" \
        --secret-string "${DB_SECRET_VALUE}" \
        --region "${RDS_SECRET_REGION}" \
        --profile matbakh-dev
else
    echo "🆕 Creating new secret..."
    aws secretsmanager create-secret \
        --name "${RDS_SECRET_NAME}" \
        --description "PostgreSQL database credentials for matbakh application" \
        --secret-string "${DB_SECRET_VALUE}" \
        --region "${RDS_SECRET_REGION}" \
        --profile matbakh-dev
fi

# Store additional application secrets
echo "📝 Creating/updating application secrets..."

APP_SECRET_VALUE=$(cat <<EOF
{
  "cognito_user_pool_id": "${COGNITO_USER_POOL_ID:-eu-central-1_farFjTHKf}",
  "cognito_user_pool_client_id": "${COGNITO_USER_POOL_CLIENT_ID:-your_client_id}",
  "jwt_secret": "${JWT_SECRET:-your_jwt_secret_here}",
  "api_gateway_url": "${API_GATEWAY_URL:-https://your-api.execute-api.eu-central-1.amazonaws.com}",
  "environment": "production"
}
EOF
)

APP_SECRET_NAME="matbakh-app-config"

if aws secretsmanager describe-secret --secret-id "${APP_SECRET_NAME}" --region "${RDS_SECRET_REGION}" --profile matbakh-dev >/dev/null 2>&1; then
    echo "✅ App secret exists, updating..."
    aws secretsmanager update-secret \
        --secret-id "${APP_SECRET_NAME}" \
        --secret-string "${APP_SECRET_VALUE}" \
        --region "${RDS_SECRET_REGION}" \
        --profile matbakh-dev
else
    echo "🆕 Creating new app secret..."
    aws secretsmanager create-secret \
        --name "${APP_SECRET_NAME}" \
        --description "Application configuration secrets for matbakh" \
        --secret-string "${APP_SECRET_VALUE}" \
        --region "${RDS_SECRET_REGION}" \
        --profile matbakh-dev
fi

echo "✅ All secrets stored successfully!"
echo ""
echo "📋 Secret Summary:"
echo "  Database Secret: ${RDS_SECRET_NAME}"
echo "  App Config Secret: ${APP_SECRET_NAME}"
echo "  Region: ${RDS_SECRET_REGION}"
echo ""
echo "🔍 To view secrets:"
echo "  aws secretsmanager get-secret-value --secret-id ${RDS_SECRET_NAME} --region ${RDS_SECRET_REGION} --profile matbakh-dev"
echo "  aws secretsmanager get-secret-value --secret-id ${APP_SECRET_NAME} --region ${RDS_SECRET_REGION} --profile matbakh-dev"