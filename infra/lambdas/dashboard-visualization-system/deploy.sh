#!/bin/bash
# Deploy Dashboard & Visualization System Lambda
# This script builds and deploys the comprehensive dashboard and visualization system
set -e

FUNCTION_NAME="dashboard-visualization-system"
REGION="eu-central-1"
RUNTIME="nodejs20.x"
HANDLER="index.handler"
TIMEOUT=300
MEMORY_SIZE=2048

echo "🚀 Deploying Dashboard & Visualization System..."

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
    ROLE_ARN=$(aws iam get-role --role-name lambda-dashboard-execution-role --query 'Role.Arn' --output text 2>/dev/null || echo "")
    
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
            --role-name lambda-dashboard-execution-role \
            --assume-role-policy-document file://trust-policy.json \
            --region $REGION

        # Attach basic execution policy
        aws iam attach-role-policy \
            --role-name lambda-dashboard-execution-role \
            --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

        # Create and attach custom policy for dashboard services
        cat > dashboard-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
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
        "arn:aws:dynamodb:${REGION}:*:table/dashboards",
        "arn:aws:dynamodb:${REGION}:*:table/dashboards/index/*",
        "arn:aws:dynamodb:${REGION}:*:table/dashboard-templates",
        "arn:aws:dynamodb:${REGION}:*:table/dashboard-templates/index/*",
        "arn:aws:dynamodb:${REGION}:*:table/dashboard-analytics",
        "arn:aws:dynamodb:${REGION}:*:table/dashboard-analytics/index/*",
        "arn:aws:dynamodb:${REGION}:*:table/dashboard-shares",
        "arn:aws:dynamodb:${REGION}:*:table/dashboard-shares/index/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "timestream:Query",
        "timestream:DescribeTable",
        "timestream:ListTables"
      ],
      "Resource": [
        "arn:aws:timestream:${REGION}:*:database/analytics-database",
        "arn:aws:timestream:${REGION}:*:database/analytics-database/table/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": [
        "arn:aws:s3:::dashboard-exports/*",
        "arn:aws:s3:::dashboard-cache/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": [
        "arn:aws:secretsmanager:${REGION}:*:secret:dashboard-*",
        "arn:aws:secretsmanager:${REGION}:*:secret:matbakh-*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "rds:DescribeDBInstances"
      ],
      "Resource": "*"
    }
  ]
}
EOF

        aws iam put-role-policy \
            --role-name lambda-dashboard-execution-role \
            --policy-name DashboardSystemPolicy \
            --policy-document file://dashboard-policy.json

        # Wait for role to be available
        echo "⏳ Waiting for IAM role to be available..."
        sleep 10

        ROLE_ARN=$(aws iam get-role --role-name lambda-dashboard-execution-role --query 'Role.Arn' --output text)
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
            "NODE_ENV":"production",
            "REDIS_HOST":"'${REDIS_HOST:-localhost}'",
            "REDIS_PORT":"'${REDIS_PORT:-6379}'"
        }'
fi

# Create API Gateway integration if it doesn't exist
echo "🔗 Setting up API Gateway integration..."

# Get API Gateway ID
API_ID=$(aws apigatewayv2 get-apis --region $REGION --query "Items[?Name=='dashboard-api'].ApiId" --output text)

if [ "$API_ID" = "None" ] || [ -z "$API_ID" ]; then
    echo "🆕 Creating API Gateway..."
    
    API_ID=$(aws apigatewayv2 create-api \
        --name dashboard-api \
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
    --route-key "ANY /dashboards/{proxy+}" \
    --target "integrations/$INTEGRATION_ID" \
    --region $REGION >/dev/null

aws apigatewayv2 create-route \
    --api-id $API_ID \
    --route-key "ANY /visualizations/{proxy+}" \
    --target "integrations/$INTEGRATION_ID" \
    --region $REGION >/dev/null

aws apigatewayv2 create-route \
    --api-id $API_ID \
    --route-key "ANY /data/{proxy+}" \
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

# Dashboards table
aws dynamodb create-table \
    --table-name dashboards \
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
    --region $REGION >/dev/null 2>&1 || echo "Dashboards table already exists"

# Dashboard templates table
aws dynamodb create-table \
    --table-name dashboard-templates \
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
    --region $REGION >/dev/null 2>&1 || echo "Dashboard templates table already exists"

# Dashboard analytics table
aws dynamodb create-table \
    --table-name dashboard-analytics \
    --attribute-definitions \
        AttributeName=PK,AttributeType=S \
        AttributeName=SK,AttributeType=S \
    --key-schema \
        AttributeName=PK,KeyType=HASH \
        AttributeName=SK,KeyType=RANGE \
    --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
    --region $REGION >/dev/null 2>&1 || echo "Dashboard analytics table already exists"

# Dashboard shares table
aws dynamodb create-table \
    --table-name dashboard-shares \
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
    --region $REGION >/dev/null 2>&1 || echo "Dashboard shares table already exists"

# Get API endpoint
API_ENDPOINT=$(aws apigatewayv2 get-api --api-id $API_ID --region $REGION --query 'ApiEndpoint' --output text)

# Cleanup
rm -f deployment.zip trust-policy.json dashboard-policy.json

echo "✅ Dashboard & Visualization System deployed successfully!"
echo "🔗 API Endpoint: ${API_ENDPOINT}/prod"
echo "📊 Function Name: $FUNCTION_NAME"
echo "🌍 Region: $REGION"
echo ""
echo "📋 Available endpoints:"
echo "  GET    ${API_ENDPOINT}/prod/dashboards"
echo "  POST   ${API_ENDPOINT}/prod/dashboards"
echo "  GET    ${API_ENDPOINT}/prod/dashboards/{id}"
echo "  PUT    ${API_ENDPOINT}/prod/dashboards/{id}"
echo "  DELETE ${API_ENDPOINT}/prod/dashboards/{id}"
echo "  POST   ${API_ENDPOINT}/prod/dashboards/{id}/clone"
echo "  POST   ${API_ENDPOINT}/prod/dashboards/{id}/share"
echo "  GET    ${API_ENDPOINT}/prod/dashboards/{id}/analytics"
echo "  GET    ${API_ENDPOINT}/prod/dashboards/templates"
echo "  POST   ${API_ENDPOINT}/prod/dashboards/templates/{id}/create"
echo "  POST   ${API_ENDPOINT}/prod/visualizations/render"
echo "  POST   ${API_ENDPOINT}/prod/visualizations/export"
echo "  POST   ${API_ENDPOINT}/prod/data/query"
echo "  GET    ${API_ENDPOINT}/prod/data/sources"
echo "  GET    ${API_ENDPOINT}/prod/health"
echo ""
echo "🧪 Test the deployment:"
echo "curl -X GET ${API_ENDPOINT}/prod/health"