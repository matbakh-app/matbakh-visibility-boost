#!/bin/bash

# Deploy AI Cost Optimizer Lambda
# This script builds and deploys the AI cost optimization engine

set -e

FUNCTION_NAME="ai-cost-optimizer"
REGION="eu-central-1"
RUNTIME="nodejs20.x"
HANDLER="index.handler"
TIMEOUT=300
MEMORY_SIZE=512

echo "🚀 Deploying AI Cost Optimizer..."

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
    ROLE_ARN=$(aws iam get-role --role-name lambda-cost-optimizer-role --query 'Role.Arn' --output text 2>/dev/null || echo "")
    
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
            --role-name lambda-cost-optimizer-role \
            --assume-role-policy-document file://trust-policy.json \
            --region $REGION

        # Attach basic execution policy
        aws iam attach-role-policy \
            --role-name lambda-cost-optimizer-role \
            --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole \
            --region $REGION

        # Create custom policy for DynamoDB, CloudWatch, SNS, and Lambda
        cat > custom-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:Scan",
        "dynamodb:BatchWriteItem"
      ],
      "Resource": [
        "arn:aws:dynamodb:${REGION}:*:table/ai-cost-tracking",
        "arn:aws:dynamodb:${REGION}:*:table/ai-cost-tracking/index/*",
        "arn:aws:dynamodb:${REGION}:*:table/ai-cost-aggregates",
        "arn:aws:dynamodb:${REGION}:*:table/ai-cost-aggregates/index/*",
        "arn:aws:dynamodb:${REGION}:*:table/ai-cost-thresholds",
        "arn:aws:dynamodb:${REGION}:*:table/ai-cost-thresholds/index/*",
        "arn:aws:dynamodb:${REGION}:*:table/ai-cost-alerts",
        "arn:aws:dynamodb:${REGION}:*:table/ai-cost-alerts/index/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudwatch:PutMetricData",
        "cloudwatch:GetMetricStatistics"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "sns:Publish"
      ],
      "Resource": [
        "arn:aws:sns:${REGION}:*:cost-alerts",
        "arn:aws:sns:${REGION}:*:emergency-alerts"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "lambda:UpdateFunctionConfiguration",
        "lambda:GetFunction"
      ],
      "Resource": [
        "arn:aws:lambda:${REGION}:*:function:ai-service-orchestrator",
        "arn:aws:lambda:${REGION}:*:function:bedrock-agent"
      ]
    }
  ]
}
EOF

        aws iam put-role-policy \
            --role-name lambda-cost-optimizer-role \
            --policy-name ai-cost-optimizer-policy \
            --policy-document file://custom-policy.json \
            --region $REGION

        # Wait for role to be available
        echo "⏳ Waiting for IAM role to be available..."
        sleep 10

        ROLE_ARN=$(aws iam get-role --role-name lambda-cost-optimizer-role --query 'Role.Arn' --output text)
        
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
            "COST_TRACKING_TABLE":"ai-cost-tracking",
            "COST_AGGREGATES_TABLE":"ai-cost-aggregates",
            "COST_THRESHOLDS_TABLE":"ai-cost-thresholds",
            "COST_ALERTS_TABLE":"ai-cost-alerts",
            "COST_ALERT_TOPIC_ARN":"'${COST_ALERT_TOPIC_ARN:-''}'",
            "EMERGENCY_ALERT_TOPIC_ARN":"'${EMERGENCY_ALERT_TOPIC_ARN:-''}'"
        }'
fi

# Create DynamoDB tables
echo "🗄️ Creating DynamoDB tables..."

# AI Cost Tracking table
aws dynamodb create-table \
    --table-name ai-cost-tracking \
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
    --provisioned-throughput ReadCapacityUnits=10,WriteCapacityUnits=10 \
    --region $REGION \
    --no-cli-pager 2>/dev/null || echo "Table ai-cost-tracking already exists"

# AI Cost Aggregates table
aws dynamodb create-table \
    --table-name ai-cost-aggregates \
    --attribute-definitions \
        AttributeName=PK,AttributeType=S \
        AttributeName=SK,AttributeType=S \
    --key-schema \
        AttributeName=PK,KeyType=HASH \
        AttributeName=SK,KeyType=RANGE \
    --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
    --region $REGION \
    --no-cli-pager 2>/dev/null || echo "Table ai-cost-aggregates already exists"

# AI Cost Thresholds table
aws dynamodb create-table \
    --table-name ai-cost-thresholds \
    --attribute-definitions \
        AttributeName=PK,AttributeType=S \
        AttributeName=SK,AttributeType=S \
    --key-schema \
        AttributeName=PK,KeyType=HASH \
        AttributeName=SK,KeyType=RANGE \
    --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
    --region $REGION \
    --no-cli-pager 2>/dev/null || echo "Table ai-cost-thresholds already exists"

# AI Cost Alerts table
aws dynamodb create-table \
    --table-name ai-cost-alerts \
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
    --region $REGION \
    --no-cli-pager 2>/dev/null || echo "Table ai-cost-alerts already exists"

# Enable TTL on tables
aws dynamodb update-time-to-live \
    --table-name ai-cost-tracking \
    --time-to-live-specification Enabled=true,AttributeName=TTL \
    --region $REGION \
    --no-cli-pager 2>/dev/null || echo "TTL already enabled on ai-cost-tracking"

aws dynamodb update-time-to-live \
    --table-name ai-cost-alerts \
    --time-to-live-specification Enabled=true,AttributeName=TTL \
    --region $REGION \
    --no-cli-pager 2>/dev/null || echo "TTL already enabled on ai-cost-alerts"

# Create SNS topics for alerts
echo "📢 Creating SNS topics..."
aws sns create-topic --name cost-alerts --region $REGION --no-cli-pager 2>/dev/null || echo "Topic cost-alerts already exists"
aws sns create-topic --name emergency-alerts --region $REGION --no-cli-pager 2>/dev/null || echo "Topic emergency-alerts already exists"

# Create CloudWatch Events rule for scheduled threshold checks
echo "⏰ Creating CloudWatch Events rule..."
aws events put-rule \
    --name ai-cost-threshold-check \
    --schedule-expression "rate(5 minutes)" \
    --description "Check AI cost thresholds every 5 minutes" \
    --region $REGION \
    --no-cli-pager 2>/dev/null || echo "Rule ai-cost-threshold-check already exists"

# Add Lambda permission for CloudWatch Events
aws lambda add-permission \
    --function-name $FUNCTION_NAME \
    --statement-id allow-cloudwatch-events \
    --action lambda:InvokeFunction \
    --principal events.amazonaws.com \
    --source-arn "arn:aws:events:${REGION}:$(aws sts get-caller-identity --query Account --output text):rule/ai-cost-threshold-check" \
    --region $REGION \
    --no-cli-pager 2>/dev/null || echo "Permission already exists"

# Add target to CloudWatch Events rule
aws events put-targets \
    --rule ai-cost-threshold-check \
    --targets "Id"="1","Arn"="arn:aws:lambda:${REGION}:$(aws sts get-caller-identity --query Account --output text):function:${FUNCTION_NAME}" \
    --region $REGION \
    --no-cli-pager 2>/dev/null || echo "Target already exists"

# Clean up
rm -f deployment.zip

echo "✅ AI Cost Optimizer deployed successfully!"
echo "📋 Function Name: $FUNCTION_NAME"
echo "🌍 Region: $REGION"
echo "🗄️ DynamoDB Tables: ai-cost-tracking, ai-cost-aggregates, ai-cost-thresholds, ai-cost-alerts"
echo "📢 SNS Topics: cost-alerts, emergency-alerts"
echo "⏰ CloudWatch Rule: ai-cost-threshold-check (runs every 5 minutes)"
echo ""
echo "🔧 Next steps:"
echo "   1. Configure API Gateway endpoints"
echo "   2. Set up SNS topic subscriptions for alerts"
echo "   3. Create initial cost thresholds"
echo "   4. Test cost tracking and alerting"
echo "   5. Monitor CloudWatch metrics"
echo ""
echo "🧪 Test endpoints:"
echo "   POST /cost/track - Record cost events"
echo "   GET /cost/analytics - Get cost analytics"
echo "   GET /cost/summary - Get cost summary"
echo "   POST /cost/predict - Generate cost predictions"
echo "   GET /cost/thresholds - List thresholds"
echo "   POST /cost/thresholds - Create threshold"
echo "   PUT /cost/thresholds/{id} - Update threshold"
echo "   DELETE /cost/thresholds/{id} - Delete threshold"
echo "   GET /cost/alerts - List alerts"
echo "   POST /cost/alerts/{id} - Acknowledge alert"
echo "   POST /cost/check-thresholds - Manual threshold check"