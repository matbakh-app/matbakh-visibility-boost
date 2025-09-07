#!/bin/bash
# Deploy Template Security System Lambda
# This script builds and deploys the comprehensive template security system with KMS integration
set -e

FUNCTION_NAME="template-security-system"
REGION="eu-central-1"
RUNTIME="nodejs20.x"
HANDLER="index.handler"
TIMEOUT=300
MEMORY_SIZE=1024

echo "🚀 Deploying Template Security System..."

# Build TypeScript
echo "📦 Building TypeScript..."
npm install
npm run build

# Create deployment package
echo "📦 Creating deployment package..."
cd dist
zip -r ../deployment.zip . -x "*.test.*" "*.spec.*"
cd ..

# Add node_modules to deployment package
echo "📦 Adding production node_modules..."
npm ci --production
zip -r deployment.zip node_modules -x \
  "node_modules/typescript/*" \
  "node_modules/@types/*" \
  "node_modules/jest/*"

# Check if function exists
if aws lambda get-function --function-name $FUNCTION_NAME --region $REGION >/dev/null 2>&1; then
    echo "🔄 Updating existing function..."
    aws lambda update-function-code \
        --function-name $FUNCTION_NAME \
        --zip-file fileb://deployment.zip \
        --region $REGION
    
    aws lambda update-function-configuration \
        --function-name $FUNCTION_NAME \
        --runtime $RUNTIME \
        --handler $HANDLER \
        --timeout $TIMEOUT \
        --memory-size $MEMORY_SIZE \
        --region $REGION
else
    echo "🆕 Creating new function..."
    
    # Get execution role ARN
    ROLE_ARN=$(aws iam get-role --role-name lambda-template-security-role --query 'Role.Arn' --output text 2>/dev/null || echo "")
    
    if [ -z "$ROLE_ARN" ]; then
        echo "❌ Lambda execution role not found. Creating role..."
        
        # Create trust policy
        cat > trust-policy.json << EOF
{
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
}
EOF

        # Create role
        aws iam create-role \
            --role-name lambda-template-security-role \
            --assume-role-policy-document file://trust-policy.json \
            --region $REGION

        # Attach basic execution policy
        aws iam attach-role-policy \
            --role-name lambda-template-security-role \
            --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

        # Create and attach custom policy for template security
        cat > template-security-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "kms:Sign",
        "kms:Verify",
        "kms:CreateKey",
        "kms:DescribeKey",
        "kms:GetPublicKey",
        "kms:ListKeys",
        "kms:CreateAlias",
        "kms:ListAliases"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ],
      "Resource": [
        "arn:aws:dynamodb:${REGION}:*:table/template-signatures",
        "arn:aws:dynamodb:${REGION}:*:table/template-signatures/index/*",
        "arn:aws:dynamodb:${REGION}:*:table/template-audit-trail",
        "arn:aws:dynamodb:${REGION}:*:table/template-audit-trail/index/*",
        "arn:aws:dynamodb:${REGION}:*:table/template-signing-keys",
        "arn:aws:dynamodb:${REGION}:*:table/template-signing-keys/index/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": [
        "arn:aws:secretsmanager:${REGION}:*:secret:template-*",
        "arn:aws:secretsmanager:${REGION}:*:secret:matbakh-*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "sts:GetCallerIdentity"
      ],
      "Resource": "*"
    }
  ]
}
EOF

        aws iam put-role-policy \
            --role-name lambda-template-security-role \
            --policy-name TemplateSecurityPolicy \
            --policy-document file://template-security-policy.json

        # Wait for role to be available
        echo "⏳ Waiting for IAM role to be available..."
        sleep 10

        ROLE_ARN=$(aws iam get-role --role-name lambda-template-security-role --query 'Role.Arn' --output text)
    fi

    # Create function
    aws lambda create-function \
        --function-name $FUNCTION_NAME \
        --runtime $RUNTIME \
        --role $ROLE_ARN \
        --handler $HANDLER \
        --zip-file fileb://deployment.zip \
        --timeout $TIMEOUT \
        --memory-size $MEMORY_SIZE \
        --region $REGION \
        --environment Variables='{
            "NODE_ENV":"production"
        }'
fi

# Create API Gateway integration if it doesn't exist
echo "🔗 Setting up API Gateway integration..."

# Get API Gateway ID
API_ID=$(aws apigatewayv2 get-apis --region $REGION --query "Items[?Name=='template-security-api'].ApiId" --output text)

if [ "$API_ID" = "None" ] || [ -z "$API_ID" ]; then
    echo "🆕 Creating API Gateway..."
    
    API_ID=$(aws apigatewayv2 create-api \
        --name template-security-api \
        --protocol-type HTTP \
        --cors-configuration AllowOrigins="*",AllowMethods="*",AllowHeaders="*" \
        --region $REGION \
        --query 'ApiId' \
        --output text)
    
    echo "✅ Created API Gateway: $API_ID"
fi

# Create integration
INTEGRATION_ID=$(aws apigatewayv2 create-integration \
    --api-id $API_ID \
    --integration-type AWS_PROXY \
    --integration-uri "arn:aws:lambda:${REGION}:$(aws sts get-caller-identity --query Account --output text):function:${FUNCTION_NAME}" \
    --payload-format-version "2.0" \
    --region $REGION \
    --query 'IntegrationId' \
    --output text)

# Create routes
aws apigatewayv2 create-route \
    --api-id $API_ID \
    --route-key "POST /templates/sign" \
    --target "integrations/$INTEGRATION_ID" \
    --region $REGION >/dev/null

aws apigatewayv2 create-route \
    --api-id $API_ID \
    --route-key "POST /templates/verify" \
    --target "integrations/$INTEGRATION_ID" \
    --region $REGION >/dev/null

aws apigatewayv2 create-route \
    --api-id $API_ID \
    --route-key "GET /templates/verify/{templateId}" \
    --target "integrations/$INTEGRATION_ID" \
    --region $REGION >/dev/null

aws apigatewayv2 create-route \
    --api-id $API_ID \
    --route-key "POST /templates/validate" \
    --target "integrations/$INTEGRATION_ID" \
    --region $REGION >/dev/null

aws apigatewayv2 create-route \
    --api-id $API_ID \
    --route-key "GET /templates/provenance/{templateId}" \
    --target "integrations/$INTEGRATION_ID" \
    --region $REGION >/dev/null

aws apigatewayv2 create-route \
    --api-id $API_ID \
    --route-key "POST /templates/keys" \
    --target "integrations/$INTEGRATION_ID" \
    --region $REGION >/dev/null

aws apigatewayv2 create-route \
    --api-id $API_ID \
    --route-key "GET /health" \
    --target "integrations/$INTEGRATION_ID" \
    --region $REGION >/dev/null

# Create deployment
DEPLOYMENT_ID=$(aws apigatewayv2 create-deployment \
    --api-id $API_ID \
    --region $REGION \
    --query 'DeploymentId' \
    --output text)

# Create or update stage
aws apigatewayv2 create-stage \
    --api-id $API_ID \
    --stage-name prod \
    --deployment-id $DEPLOYMENT_ID \
    --region $REGION >/dev/null 2>&1 || \
aws apigatewayv2 update-stage \
    --api-id $API_ID \
    --stage-name prod \
    --deployment-id $DEPLOYMENT_ID \
    --region $REGION >/dev/null

# Add Lambda permission for API Gateway
aws lambda add-permission \
    --function-name $FUNCTION_NAME \
    --statement-id api-gateway-invoke \
    --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn "arn:aws:execute-api:${REGION}:$(aws sts get-caller-identity --query Account --output text):${API_ID}/*/*" \
    --region $REGION >/dev/null 2>&1 || echo "Permission already exists"

# Create DynamoDB tables if they don't exist
echo "📊 Setting up DynamoDB tables..."

# Template signatures table
aws dynamodb create-table \
    --table-name template-signatures \
    --attribute-definitions \
        AttributeName=PK,AttributeType=S \
        AttributeName=SK,AttributeType=S \
        AttributeName=GSI1PK,AttributeType=S \
        AttributeName=GSI1SK,AttributeType=S \
    --key-schema \
        AttributeName=PK,KeyType=HASH \
        AttributeName=SK,KeyType=RANGE \
    --global-secondary-indexes \
        IndexName=GSI1,KeySchema=[{AttributeName=GSI1PK,KeyType=HASH},{AttributeName=GSI1SK,KeyType=RANGE}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5} \
    --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
    --region $REGION >/dev/null 2>&1 || echo "Template signatures table already exists"

# Template audit trail table
aws dynamodb create-table \
    --table-name template-audit-trail \
    --attribute-definitions \
        AttributeName=PK,AttributeType=S \
        AttributeName=SK,AttributeType=S \
        AttributeName=GSI1PK,AttributeType=S \
        AttributeName=GSI1SK,AttributeType=S \
        AttributeName=GSI2PK,AttributeType=S \
        AttributeName=GSI2SK,AttributeType=S \
    --key-schema \
        AttributeName=PK,KeyType=HASH \
        AttributeName=SK,KeyType=RANGE \
    --global-secondary-indexes \
        IndexName=GSI1,KeySchema=[{AttributeName=GSI1PK,KeyType=HASH},{AttributeName=GSI1SK,KeyType=RANGE}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5} \
        IndexName=GSI2,KeySchema=[{AttributeName=GSI2PK,KeyType=HASH},{AttributeName=GSI2SK,KeyType=RANGE}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5} \
    --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
    --region $REGION >/dev/null 2>&1 || echo "Template audit trail table already exists"

# Template signing keys table
aws dynamodb create-table \
    --table-name template-signing-keys \
    --attribute-definitions \
        AttributeName=PK,AttributeType=S \
        AttributeName=SK,AttributeType=S \
    --key-schema \
        AttributeName=PK,KeyType=HASH \
        AttributeName=SK,KeyType=RANGE \
    --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
    --region $REGION >/dev/null 2>&1 || echo "Template signing keys table already exists"

# Get API endpoint
API_ENDPOINT=$(aws apigatewayv2 get-api --api-id $API_ID --region $REGION --query 'ApiEndpoint' --output text)

# Cleanup
rm -f deployment.zip trust-policy.json template-security-policy.json

echo "✅ Template Security System deployed successfully!"
echo "🔗 API Endpoint: ${API_ENDPOINT}/prod"
echo "📊 Function Name: $FUNCTION_NAME"
echo "🌍 Region: $REGION"
echo ""
echo "📋 Available endpoints:"
echo "  POST   ${API_ENDPOINT}/prod/templates/sign"
echo "  POST   ${API_ENDPOINT}/prod/templates/verify"
echo "  GET    ${API_ENDPOINT}/prod/templates/verify/{templateId}"
echo "  POST   ${API_ENDPOINT}/prod/templates/validate"
echo "  GET    ${API_ENDPOINT}/prod/templates/provenance/{templateId}"
echo "  POST   ${API_ENDPOINT}/prod/templates/keys"
echo "  GET    ${API_ENDPOINT}/prod/health"
echo ""
echo "🧪 Test the deployment:"
echo "curl -X GET ${API_ENDPOINT}/prod/health"
echo ""
echo "🔐 Security Features:"
echo "  ✅ KMS-based cryptographic signing"
echo "  ✅ Template integrity verification"
echo "  ✅ Comprehensive validation pipeline"
echo "  ✅ Audit trail and provenance tracking"
echo "  ✅ Security vulnerability scanning"