#!/bin/bash

# Multi-Agent Workflow Lambda Deployment Script
# Deploys the agentic AI workflow orchestration system

set -e

FUNCTION_NAME="multi-agent-workflow"
REGION="eu-central-1"
RUNTIME="nodejs20.x"
HANDLER="index.handler"
TIMEOUT=900  # 15 minutes for complex workflows
MEMORY_SIZE=1024

echo "🚀 Deploying Multi-Agent Workflow Lambda..."

# Build the function
echo "📦 Building TypeScript..."
npm run build

# Create deployment package
echo "📦 Creating deployment package..."
zip -r ${FUNCTION_NAME}.zip dist/ node_modules/ package.json

# Check if function exists
if aws lambda get-function --function-name ${FUNCTION_NAME} --region ${REGION} >/dev/null 2>&1; then
    echo "🔄 Updating existing function..."
    aws lambda update-function-code \
        --function-name ${FUNCTION_NAME} \
        --zip-file fileb://${FUNCTION_NAME}.zip \
        --region ${REGION}
    
    aws lambda update-function-configuration \
        --function-name ${FUNCTION_NAME} \
        --runtime ${RUNTIME} \
        --handler ${HANDLER} \
        --timeout ${TIMEOUT} \
        --memory-size ${MEMORY_SIZE} \
        --region ${REGION} \
        --environment Variables='{
            "NODE_ENV":"production",
            "AWS_REGION":"'${REGION}'",
            "LOG_LEVEL":"info"
        }'
else
    echo "🆕 Creating new function..."
    
    # Create IAM role if it doesn't exist
    ROLE_NAME="${FUNCTION_NAME}-role"
    ROLE_ARN=$(aws iam get-role --role-name ${ROLE_NAME} --query 'Role.Arn' --output text 2>/dev/null || echo "")
    
    if [ -z "$ROLE_ARN" ]; then
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

        # Create execution policy
        cat > execution-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents"
            ],
            "Resource": "arn:aws:logs:*:*:*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "bedrock:InvokeModel",
                "bedrock:InvokeModelWithResponseStream"
            ],
            "Resource": [
                "arn:aws:bedrock:*::foundation-model/anthropic.claude-3-5-sonnet-20241022-v2:0",
                "arn:aws:bedrock:*::foundation-model/anthropic.claude-3-haiku-20240307-v1:0"
            ]
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
                "arn:aws:dynamodb:${REGION}:*:table/workflow-executions",
                "arn:aws:dynamodb:${REGION}:*:table/agent-memory",
                "arn:aws:dynamodb:${REGION}:*:table/workflow-templates"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "lambda:InvokeFunction"
            ],
            "Resource": [
                "arn:aws:lambda:${REGION}:*:function:ai-*",
                "arn:aws:lambda:${REGION}:*:function:bedrock-*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "states:StartExecution",
                "states:DescribeExecution",
                "states:StopExecution"
            ],
            "Resource": [
                "arn:aws:states:${REGION}:*:stateMachine:workflow-*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "secretsmanager:GetSecretValue"
            ],
            "Resource": [
                "arn:aws:secretsmanager:${REGION}:*:secret:ai-service-keys-*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "cloudwatch:PutMetricData"
            ],
            "Resource": "*"
        }
    ]
}
EOF

        # Create role
        aws iam create-role \
            --role-name ${ROLE_NAME} \
            --assume-role-policy-document file://trust-policy.json \
            --region ${REGION}

        # Attach execution policy
        aws iam put-role-policy \
            --role-name ${ROLE_NAME} \
            --policy-name ${FUNCTION_NAME}-execution-policy \
            --policy-document file://execution-policy.json \
            --region ${REGION}

        # Get role ARN
        ROLE_ARN=$(aws iam get-role --role-name ${ROLE_NAME} --query 'Role.Arn' --output text)
        
        # Wait for role to be available
        echo "⏳ Waiting for IAM role to be available..."
        sleep 10
        
        # Clean up policy files
        rm trust-policy.json execution-policy.json
    fi

    # Create function
    aws lambda create-function \
        --function-name ${FUNCTION_NAME} \
        --runtime ${RUNTIME} \
        --role ${ROLE_ARN} \
        --handler ${HANDLER} \
        --zip-file fileb://${FUNCTION_NAME}.zip \
        --timeout ${TIMEOUT} \
        --memory-size ${MEMORY_SIZE} \
        --region ${REGION} \
        --environment Variables='{
            "NODE_ENV":"production",
            "AWS_REGION":"'${REGION}'",
            "LOG_LEVEL":"info"
        }' \
        --description "Multi-Agent Workflow Orchestration System for Agentic AI"
fi

# Create API Gateway integration (optional)
echo "🌐 Setting up API Gateway integration..."

# Check if API Gateway exists
API_NAME="${FUNCTION_NAME}-api"
API_ID=$(aws apigateway get-rest-apis --query "items[?name=='${API_NAME}'].id" --output text --region ${REGION})

if [ -z "$API_ID" ] || [ "$API_ID" = "None" ]; then
    echo "🆕 Creating API Gateway..."
    
    # Create API
    API_ID=$(aws apigateway create-rest-api \
        --name ${API_NAME} \
        --description "Multi-Agent Workflow API" \
        --region ${REGION} \
        --query 'id' --output text)
    
    # Get root resource ID
    ROOT_RESOURCE_ID=$(aws apigateway get-resources \
        --rest-api-id ${API_ID} \
        --region ${REGION} \
        --query 'items[?path==`/`].id' --output text)
    
    # Create workflow resource
    WORKFLOW_RESOURCE_ID=$(aws apigateway create-resource \
        --rest-api-id ${API_ID} \
        --parent-id ${ROOT_RESOURCE_ID} \
        --path-part workflow \
        --region ${REGION} \
        --query 'id' --output text)
    
    # Create proxy resource
    PROXY_RESOURCE_ID=$(aws apigateway create-resource \
        --rest-api-id ${API_ID} \
        --parent-id ${WORKFLOW_RESOURCE_ID} \
        --path-part '{proxy+}' \
        --region ${REGION} \
        --query 'id' --output text)
    
    # Create ANY method
    aws apigateway put-method \
        --rest-api-id ${API_ID} \
        --resource-id ${PROXY_RESOURCE_ID} \
        --http-method ANY \
        --authorization-type NONE \
        --region ${REGION}
    
    # Get Lambda function ARN
    FUNCTION_ARN=$(aws lambda get-function \
        --function-name ${FUNCTION_NAME} \
        --region ${REGION} \
        --query 'Configuration.FunctionArn' --output text)
    
    # Set up Lambda integration
    aws apigateway put-integration \
        --rest-api-id ${API_ID} \
        --resource-id ${PROXY_RESOURCE_ID} \
        --http-method ANY \
        --type AWS_PROXY \
        --integration-http-method POST \
        --uri "arn:aws:apigateway:${REGION}:lambda:path/2015-03-31/functions/${FUNCTION_ARN}/invocations" \
        --region ${REGION}
    
    # Add Lambda permission for API Gateway
    aws lambda add-permission \
        --function-name ${FUNCTION_NAME} \
        --statement-id api-gateway-invoke \
        --action lambda:InvokeFunction \
        --principal apigateway.amazonaws.com \
        --source-arn "arn:aws:execute-api:${REGION}:*:${API_ID}/*/*" \
        --region ${REGION}
    
    # Deploy API
    aws apigateway create-deployment \
        --rest-api-id ${API_ID} \
        --stage-name prod \
        --region ${REGION}
    
    echo "✅ API Gateway created with ID: ${API_ID}"
    echo "🌐 API URL: https://${API_ID}.execute-api.${REGION}.amazonaws.com/prod/workflow"
else
    echo "✅ API Gateway already exists with ID: ${API_ID}"
fi

# Create DynamoDB tables if they don't exist
echo "🗄️ Setting up DynamoDB tables..."

# Workflow executions table
aws dynamodb create-table \
    --table-name workflow-executions \
    --attribute-definitions \
        AttributeName=id,AttributeType=S \
        AttributeName=tenantId,AttributeType=S \
        AttributeName=status,AttributeType=S \
    --key-schema \
        AttributeName=id,KeyType=HASH \
    --global-secondary-indexes \
        IndexName=tenant-status-index,KeySchema=[{AttributeName=tenantId,KeyType=HASH},{AttributeName=status,KeyType=RANGE}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5} \
    --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
    --region ${REGION} 2>/dev/null || echo "Table workflow-executions already exists"

# Agent memory table
aws dynamodb create-table \
    --table-name agent-memory \
    --attribute-definitions \
        AttributeName=contextId,AttributeType=S \
        AttributeName=tenantId,AttributeType=S \
        AttributeName=agentId,AttributeType=S \
    --key-schema \
        AttributeName=contextId,KeyType=HASH \
    --global-secondary-indexes \
        IndexName=tenant-agent-index,KeySchema=[{AttributeName=tenantId,KeyType=HASH},{AttributeName=agentId,KeyType=RANGE}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5} \
    --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
    --region ${REGION} 2>/dev/null || echo "Table agent-memory already exists"

# Workflow templates table
aws dynamodb create-table \
    --table-name workflow-templates \
    --attribute-definitions \
        AttributeName=id,AttributeType=S \
        AttributeName=category,AttributeType=S \
    --key-schema \
        AttributeName=id,KeyType=HASH \
    --global-secondary-indexes \
        IndexName=category-index,KeySchema=[{AttributeName=category,KeyType=HASH}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5} \
    --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
    --region ${REGION} 2>/dev/null || echo "Table workflow-templates already exists"

# Clean up
rm -f ${FUNCTION_NAME}.zip

echo "✅ Multi-Agent Workflow Lambda deployed successfully!"
echo ""
echo "📋 Deployment Summary:"
echo "  Function Name: ${FUNCTION_NAME}"
echo "  Region: ${REGION}"
echo "  Runtime: ${RUNTIME}"
echo "  Memory: ${MEMORY_SIZE}MB"
echo "  Timeout: ${TIMEOUT}s"
echo "  API Gateway: https://${API_ID}.execute-api.${REGION}.amazonaws.com/prod/workflow"
echo ""
echo "🧪 Test the deployment:"
echo "  curl -X GET https://${API_ID}.execute-api.${REGION}.amazonaws.com/prod/workflow/templates"
echo ""
echo "📚 Available endpoints:"
echo "  POST /workflow/execute - Execute a workflow"
echo "  GET  /workflow/status - Get execution status"
echo "  POST /workflow/control - Control workflow execution"
echo "  GET  /workflow/list - List active executions"
echo "  GET  /workflow/templates - Get available templates"