#!/bin/bash

set -e

echo "🚀 Deploying Track Consent Lambda..."

# Build TypeScript
echo "📦 Building TypeScript..."
npm run build

# Create deployment package
echo "📦 Creating deployment package..."
zip -r track-consent-lambda.zip dist/ node_modules/ package.json

# Deploy to AWS Lambda
echo "🚀 Deploying to AWS Lambda..."
aws lambda update-function-code \
  --function-name matbakh-track-consent \
  --zip-file fileb://track-consent-lambda.zip \
  --region eu-central-1

# Clean up
rm track-consent-lambda.zip

echo "✅ Track Consent Lambda deployed successfully!"