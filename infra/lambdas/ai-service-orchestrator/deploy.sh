#!/bin/bash

# Deploy AI Service Orchestrator Lambda
# This script builds and deploys the advanced AI service orchestration system

set -e

FUNCTION_NAME="ai-service-orchestrator"
REGION="eu-central-1"
RUNTIME="nodejs20.x"
HANDLER="index.handler"
TIMEOUT=300
MEMORY_SIZE=1024

echo "🚀 Deploying AI Service Orchestrator..."

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
    ROLE_ARN=$(aws iam get-role --role-name lambda-ai-orchestrator-role --query 'Role.Arn' --output text 2>/dev/null || echo "")
    
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
            --role-name lambda-ai-orchestrator-role \
            --assume-role-policy-document file://trust-policy.json \
            --region $REGION

        # Attach basic execution policy
        aws iam attach-role-policy \
            --role-name lambda-ai-orchestrator-role \
            --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole \
            --region $REGION

        # Create custom policy for Bedrock, DynamoDB, CloudWatch, and Secrets Manager
        cat > custom-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": [
        "arn:aws:bedrock:${REGION}::foundation-model/anthropic.claude-3-5-sonnet-20241022-v2:0",
        "arn:aws:bedrock:${REGION}::foundation-model/anthropic.claude-3-haiku-20240307-v1:0"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:UpdateItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ],
      "Resource": [
        "arn:aws:dynamodb:${REGION}:*:table/provider-health-checks",
        "arn:aws:dynamodb:${REGION}:*:table/provider-health-checks/index/*",
        "arn:aws:dynamodb:${REGION}:*:table/circuit-breaker-states",
        "arn:aws:dynamodb:${REGION}:*:table/circuit-breaker-states/index/*",
        "arn:aws:dynamodb:${REGION}:*:table/failover-events",
        "arn:aws:dynamodb:${REGION}:*:table/failover-events/index/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudwatch:PutMetricData"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": [
        "arn:aws:secretsmanager:${REGION}:*:secret:google-api-key-*",
        "arn:aws:secretsmanager:${REGION}:*:secret:openai-api-key-*"
      ]
    }
  ]
}
EOF

        aws iam put-role-policy \
            --role-name lambda-ai-orchestrator-role \
            --policy-name ai-service-orchestrator-policy \
            --policy-document file://custom-policy.json \
            --region $REGION

        # Wait for role to be available
        echo "⏳ Waiting for IAM role to be available..."
        sleep 10

        ROLE_ARN=$(aws iam get-role --role-name lambda-ai-orchestrator-role --query 'Role.Arn' --output text)
        
        # Clean up temporary files
        rm -f trust-policy.json custom-policy.json
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
            "AWS_REGION":"'$REGION'",
            "GOOGLE_API_KEY":"'${GOOGLE_API_KEY:-''}'",
            "OPENAI_API_KEY":"'${OPENAI_API_KEY:-''}'",
            "HEALTH_CHECK_INTERVAL":"60000",
            "CIRCUIT_BREAKER_FAILURE_THRESHOLD":"5",
            "CIRCUIT_BREAKER_RECOVERY_TIMEOUT":"60000"
        }'
fi

# Create DynamoDB tables for health monitoring
echo "🗄️ Creating DynamoDB tables..."

# Provider Health Checks table
aws dynamodb create-table \
    --table-name provider-health-checks \
    --attribute-definitions \
        AttributeName=PK,AttributeType=S \
        AttributeName=SK,AttributeType=S \
    --key-schema \
        AttributeName=PK,KeyType=HASH \
        AttributeName=SK,KeyType=RANGE \
    --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
    --region $REGION \
    --no-cli-pager 2>/dev/null || echo "Table provider-health-checks already exists"

# Circuit Breaker States table
aws dynamodb create-table \
    --table-name circuit-breaker-states \
    --attribute-definitions \
        AttributeName=PK,AttributeType=S \
        AttributeName=SK,AttributeType=S \
    --key-schema \
        AttributeName=PK,KeyType=HASH \
        AttributeName=SK,KeyType=RANGE \
    --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
    --region $REGION \
    --no-cli-pager 2>/dev/null || echo "Table circuit-breaker-states already exists"

# Failover Events table
aws dynamodb create-table \
    --table-name failover-events \
    --attribute-definitions \
        AttributeName=PK,AttributeType=S \
        AttributeName=SK,AttributeType=S \
    --key-schema \
        AttributeName=PK,KeyType=HASH \
        AttributeName=SK,KeyType=RANGE \
    --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
    --region $REGION \
    --no-cli-pager 2>/dev/null || echo "Table failover-events already exists"

# Enable TTL on tables
aws dynamodb update-time-to-live \
    --table-name provider-health-checks \
    --time-to-live-specification Enabled=true,AttributeName=TTL \
    --region $REGION \
    --no-cli-pager 2>/dev/null || echo "TTL already enabled on provider-health-checks"

aws dynamodb update-time-to-live \
    --table-name failover-events \
    --time-to-live-specification Enabled=true,AttributeName=TTL \
    --region $REGION \
    --no-cli-pager 2>/dev/null || echo "TTL already enabled on failover-events"

# Create API Gateway integration (manual step)
echo "🌐 API Gateway setup required:"
echo "   1. Create or update API Gateway REST API"
echo "   2. Add resource: /ai"
echo "   3. Add sub-resources: /process, /providers, /health, /stats, /circuit-breaker/{providerId}"
echo "   4. Configure Lambda proxy integration for all methods"
echo "   5. Enable CORS on all resources"
echo "   6. Deploy to appropriate stage"

# Clean up
rm -f deployment.zip

echo "✅ AI Service Orchestrator deployed successfully!"
echo "📋 Function Name: $FUNCTION_NAME"
echo "🌍 Region: $REGION"
echo "🗄️ DynamoDB Tables: provider-health-checks, circuit-breaker-states, failover-events"
echo ""
echo "🔧 Next steps:"
echo "   1. Configure API Gateway endpoints"
echo "   2. Set up Google API key in Secrets Manager (if using Gemini)"
echo "   3. Set up OpenAI API key in Secrets Manager (if using OpenAI)"
echo "   4. Test AI orchestration endpoints"
echo "   5. Monitor CloudWatch metrics and logs"
echo ""
echo "🧪 Test endpoints:"
echo "   POST /ai/process - Process AI requests"
echo "   GET /ai/providers - List available providers"
echo "   GET /ai/health - Check provider health"
echo "   GET /ai/stats - Get selection statistics"
echo "   POST /ai/circuit-breaker/{providerId} - Manage circuit breakers"