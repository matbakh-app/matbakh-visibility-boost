#!/bin/bash

# AI Agent Memory Architecture - Deployment Script
# Deploys Lambda functions and infrastructure for persistent memory layer

set -e

# Configuration
FUNCTION_NAME="ai-agent-memory"
REGION="${AWS_REGION:-eu-central-1}"
MEMORY_SIZE=1024
TIMEOUT=300
RUNTIME="nodejs20.x"

# DynamoDB Configuration
TABLE_NAME="ai-agent-memory"
REDIS_CLUSTER_NAME="ai-memory-cache"

echo "🚀 Deploying AI Agent Memory Architecture..."

# Build the Lambda function
echo "📦 Building Lambda function..."
npm install
npm run build

# Create deployment package
echo "📦 Creating deployment package..."
zip -r deployment.zip dist/ node_modules/ package.json

# Check if Lambda function exists
if aws lambda get-function --function-name $FUNCTION_NAME --region $REGION >/dev/null 2>&1; then
    echo "🔄 Updating existing Lambda function..."
    aws lambda update-function-code \
        --function-name $FUNCTION_NAME \
        --zip-file fileb://deployment.zip \
        --region $REGION

    aws lambda update-function-configuration \
        --function-name $FUNCTION_NAME \
        --runtime $RUNTIME \
        --memory-size $MEMORY_SIZE \
        --timeout $TIMEOUT \
        --environment Variables="{
            MEMORY_TABLE_NAME=$TABLE_NAME,
            REDIS_CLUSTER_ENDPOINT=$REDIS_CLUSTER_NAME.cache.amazonaws.com:6379,
            AWS_REGION=$REGION
        }" \
        --region $REGION
else
    echo "🆕 Creating new Lambda function..."
    
    # Create IAM role for Lambda if it doesn't exist
    ROLE_NAME="ai-agent-memory-lambda-role"
    if ! aws iam get-role --role-name $ROLE_NAME >/dev/null 2>&1; then
        echo "🔐 Creating IAM role..."
        
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

        aws iam create-role \
            --role-name $ROLE_NAME \
            --assume-role-policy-document file://trust-policy.json

        # Attach basic Lambda execution policy
        aws iam attach-role-policy \
            --role-name $ROLE_NAME \
            --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

        # Create and attach DynamoDB policy
        cat > dynamodb-policy.json << EOF
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
                "dynamodb:BatchWriteItem",
                "dynamodb:BatchGetItem"
            ],
            "Resource": [
                "arn:aws:dynamodb:$REGION:*:table/$TABLE_NAME",
                "arn:aws:dynamodb:$REGION:*:table/$TABLE_NAME/index/*"
            ]
        }
    ]
}
EOF

        aws iam put-role-policy \
            --role-name $ROLE_NAME \
            --policy-name DynamoDBAccess \
            --policy-document file://dynamodb-policy.json

        # Create and attach ElastiCache policy
        cat > elasticache-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "elasticache:DescribeCacheClusters",
                "elasticache:DescribeReplicationGroups"
            ],
            "Resource": "*"
        }
    ]
}
EOF

        aws iam put-role-policy \
            --role-name $ROLE_NAME \
            --policy-name ElastiCacheAccess \
            --policy-document file://elasticache-policy.json

        # Wait for role to be available
        echo "⏳ Waiting for IAM role to be available..."
        sleep 10

        rm trust-policy.json dynamodb-policy.json elasticache-policy.json
    fi

    ROLE_ARN=$(aws iam get-role --role-name $ROLE_NAME --query 'Role.Arn' --output text)

    aws lambda create-function \
        --function-name $FUNCTION_NAME \
        --runtime $RUNTIME \
        --role $ROLE_ARN \
        --handler dist/index.handler \
        --zip-file fileb://deployment.zip \
        --memory-size $MEMORY_SIZE \
        --timeout $TIMEOUT \
        --environment Variables="{
            MEMORY_TABLE_NAME=$TABLE_NAME,
            REDIS_CLUSTER_ENDPOINT=$REDIS_CLUSTER_NAME.cache.amazonaws.com:6379,
            AWS_REGION=$REGION
        }" \
        --region $REGION
fi

# Create DynamoDB table if it doesn't exist
echo "🗄️ Setting up DynamoDB table..."
if ! aws dynamodb describe-table --table-name $TABLE_NAME --region $REGION >/dev/null 2>&1; then
    echo "🆕 Creating DynamoDB table..."
    aws dynamodb create-table \
        --table-name $TABLE_NAME \
        --attribute-definitions \
            AttributeName=pk,AttributeType=S \
            AttributeName=sk,AttributeType=S \
            AttributeName=gsi1pk,AttributeType=S \
            AttributeName=gsi1sk,AttributeType=S \
        --key-schema \
            AttributeName=pk,KeyType=HASH \
            AttributeName=sk,KeyType=RANGE \
        --global-secondary-indexes \
            IndexName=user-session-index,KeySchema=[{AttributeName=gsi1pk,KeyType=HASH},{AttributeName=gsi1sk,KeyType=RANGE}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5} \
        --provisioned-throughput ReadCapacityUnits=10,WriteCapacityUnits=10 \
        --region $REGION

    echo "⏳ Waiting for table to be active..."
    aws dynamodb wait table-exists --table-name $TABLE_NAME --region $REGION

    # Enable TTL on the table
    aws dynamodb update-time-to-live \
        --table-name $TABLE_NAME \
        --time-to-live-specification Enabled=true,AttributeName=ttl \
        --region $REGION
else
    echo "✅ DynamoDB table already exists"
fi

# Create ElastiCache Redis cluster if it doesn't exist
echo "🔄 Setting up Redis cache cluster..."
if ! aws elasticache describe-cache-clusters --cache-cluster-id $REDIS_CLUSTER_NAME --region $REGION >/dev/null 2>&1; then
    echo "🆕 Creating Redis cache cluster..."
    
    # Create subnet group if it doesn't exist
    SUBNET_GROUP_NAME="ai-memory-subnet-group"
    if ! aws elasticache describe-cache-subnet-groups --cache-subnet-group-name $SUBNET_GROUP_NAME --region $REGION >/dev/null 2>&1; then
        # Get default VPC subnets
        SUBNET_IDS=$(aws ec2 describe-subnets \
            --filters "Name=default-for-az,Values=true" \
            --query 'Subnets[].SubnetId' \
            --output text \
            --region $REGION)

        if [ -n "$SUBNET_IDS" ]; then
            aws elasticache create-cache-subnet-group \
                --cache-subnet-group-name $SUBNET_GROUP_NAME \
                --cache-subnet-group-description "Subnet group for AI Agent Memory cache" \
                --subnet-ids $SUBNET_IDS \
                --region $REGION
        else
            echo "⚠️ No default subnets found. Please create ElastiCache cluster manually."
        fi
    fi

    # Create cache cluster
    aws elasticache create-cache-cluster \
        --cache-cluster-id $REDIS_CLUSTER_NAME \
        --cache-node-type cache.t3.micro \
        --engine redis \
        --num-cache-nodes 1 \
        --cache-subnet-group-name $SUBNET_GROUP_NAME \
        --region $REGION

    echo "⏳ Waiting for cache cluster to be available..."
    aws elasticache wait cache-cluster-available --cache-cluster-id $REDIS_CLUSTER_NAME --region $REGION
else
    echo "✅ Redis cache cluster already exists"
fi

# Create API Gateway endpoints
echo "🌐 Setting up API Gateway..."
API_NAME="ai-agent-memory-api"

# Check if API exists
API_ID=$(aws apigateway get-rest-apis --query "items[?name=='$API_NAME'].id" --output text --region $REGION)

if [ "$API_ID" = "" ] || [ "$API_ID" = "None" ]; then
    echo "🆕 Creating API Gateway..."
    API_ID=$(aws apigateway create-rest-api \
        --name $API_NAME \
        --description "AI Agent Memory Architecture API" \
        --query 'id' \
        --output text \
        --region $REGION)
fi

# Get root resource ID
ROOT_RESOURCE_ID=$(aws apigateway get-resources \
    --rest-api-id $API_ID \
    --query 'items[?path==`/`].id' \
    --output text \
    --region $REGION)

# Create memory resource if it doesn't exist
MEMORY_RESOURCE_ID=$(aws apigateway get-resources \
    --rest-api-id $API_ID \
    --query 'items[?pathPart==`memory`].id' \
    --output text \
    --region $REGION)

if [ "$MEMORY_RESOURCE_ID" = "" ] || [ "$MEMORY_RESOURCE_ID" = "None" ]; then
    MEMORY_RESOURCE_ID=$(aws apigateway create-resource \
        --rest-api-id $API_ID \
        --parent-id $ROOT_RESOURCE_ID \
        --path-part memory \
        --query 'id' \
        --output text \
        --region $REGION)
fi

# Create POST method for memory operations
if ! aws apigateway get-method \
    --rest-api-id $API_ID \
    --resource-id $MEMORY_RESOURCE_ID \
    --http-method POST \
    --region $REGION >/dev/null 2>&1; then
    
    aws apigateway put-method \
        --rest-api-id $API_ID \
        --resource-id $MEMORY_RESOURCE_ID \
        --http-method POST \
        --authorization-type NONE \
        --region $REGION

    # Get Lambda function ARN
    LAMBDA_ARN=$(aws lambda get-function \
        --function-name $FUNCTION_NAME \
        --query 'Configuration.FunctionArn' \
        --output text \
        --region $REGION)

    # Set up Lambda integration
    aws apigateway put-integration \
        --rest-api-id $API_ID \
        --resource-id $MEMORY_RESOURCE_ID \
        --http-method POST \
        --type AWS_PROXY \
        --integration-http-method POST \
        --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/$LAMBDA_ARN/invocations" \
        --region $REGION

    # Add Lambda permission for API Gateway
    aws lambda add-permission \
        --function-name $FUNCTION_NAME \
        --statement-id api-gateway-invoke \
        --action lambda:InvokeFunction \
        --principal apigateway.amazonaws.com \
        --source-arn "arn:aws:execute-api:$REGION:*:$API_ID/*/*" \
        --region $REGION
fi

# Deploy API
echo "🚀 Deploying API..."
aws apigateway create-deployment \
    --rest-api-id $API_ID \
    --stage-name prod \
    --region $REGION

# Clean up
rm -f deployment.zip

echo "✅ Deployment completed successfully!"
echo ""
echo "📋 Deployment Summary:"
echo "  Lambda Function: $FUNCTION_NAME"
echo "  DynamoDB Table: $TABLE_NAME"
echo "  Redis Cluster: $REDIS_CLUSTER_NAME"
echo "  API Gateway: https://$API_ID.execute-api.$REGION.amazonaws.com/prod"
echo ""
echo "🔗 API Endpoints:"
echo "  POST /memory - Main memory operations"
echo "  GET  /memory/health - Health check"
echo ""
echo "📖 Usage Examples:"
echo "  Store Context:"
echo "    curl -X POST https://$API_ID.execute-api.$REGION.amazonaws.com/prod/memory \\"
echo "      -H 'Content-Type: application/json' \\"
echo "      -H 'x-tenant-id: your-tenant-id' \\"
echo "      -d '{\"action\":\"store\",\"userId\":\"user123\",\"sessionId\":\"session123\",\"agentId\":\"agent123\",\"context\":{\"contextType\":\"conversation\",\"content\":{}}}'"
echo ""
echo "  Retrieve Contexts:"
echo "    curl -X POST https://$API_ID.execute-api.$REGION.amazonaws.com/prod/memory \\"
echo "      -H 'Content-Type: application/json' \\"
echo "      -H 'x-tenant-id: your-tenant-id' \\"
echo "      -d '{\"action\":\"retrieve\",\"query\":{\"tenantId\":\"your-tenant-id\",\"limit\":10}}'"
echo ""
echo "🎉 AI Agent Memory Architecture is ready to use!"