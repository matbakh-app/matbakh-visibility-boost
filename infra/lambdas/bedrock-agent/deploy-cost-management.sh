#!/bin/bash

# Deploy Cost Management System
# Comprehensive deployment script for all cost management components

set -e

echo "🚀 Starting Cost Management System Deployment..."

# Configuration
REGION=${AWS_REGION:-eu-central-1}
FUNCTION_NAME="bedrock-cost-management"
ROLE_NAME="bedrock-cost-management-role"
POLICY_NAME="bedrock-cost-management-policy"
SNS_TOPIC_NAME="bedrock-cost-alerts"
SES_IDENTITY="noreply@matbakh.app"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI not found. Please install AWS CLI."
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        log_error "npm not found. Please install Node.js and npm."
        exit 1
    fi
    
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS credentials not configured. Please run 'aws configure'."
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Install dependencies
install_dependencies() {
    log_info "Installing dependencies..."
    
    if [ ! -f "package.json" ]; then
        log_error "package.json not found. Please run from the bedrock-agent directory."
        exit 1
    fi
    
    npm install
    log_success "Dependencies installed"
}

# Run tests
run_tests() {
    log_info "Running cost management tests..."
    
    npm test -- --testPathPattern=cost-management-system.test.ts --verbose
    
    if [ $? -eq 0 ]; then
        log_success "All tests passed"
    else
        log_error "Tests failed. Please fix issues before deployment."
        exit 1
    fi
}

# Build the project
build_project() {
    log_info "Building TypeScript project..."
    
    npm run build
    
    if [ $? -eq 0 ]; then
        log_success "Build completed successfully"
    else
        log_error "Build failed"
        exit 1
    fi
}

# Create DynamoDB tables
create_dynamodb_tables() {
    log_info "Creating DynamoDB tables..."
    
    # Token Usage Table
    aws dynamodb create-table \
        --region $REGION \
        --table-name bedrock_token_usage \
        --attribute-definitions \
            AttributeName=request_id,AttributeType=S \
            AttributeName=user_id,AttributeType=S \
            AttributeName=date,AttributeType=S \
        --key-schema \
            AttributeName=request_id,KeyType=HASH \
        --global-secondary-indexes \
            IndexName=user-date-index,KeySchema=[{AttributeName=user_id,KeyType=HASH},{AttributeName=date,KeyType=RANGE}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5} \
        --provisioned-throughput \
            ReadCapacityUnits=10,WriteCapacityUnits=10 \
        --tags Key=Project,Value=MatbakhAI Key=Component,Value=CostManagement \
        2>/dev/null || log_warning "Token usage table may already exist"
    
    # Token Analytics Table
    aws dynamodb create-table \
        --region $REGION \
        --table-name bedrock_token_analytics \
        --attribute-definitions \
            AttributeName=analytics_key,AttributeType=S \
        --key-schema \
            AttributeName=analytics_key,KeyType=HASH \
        --provisioned-throughput \
            ReadCapacityUnits=5,WriteCapacityUnits=5 \
        --tags Key=Project,Value=MatbakhAI Key=Component,Value=CostManagement \
        2>/dev/null || log_warning "Token analytics table may already exist"
    
    # Cost Thresholds Table
    aws dynamodb create-table \
        --region $REGION \
        --table-name bedrock_cost_thresholds \
        --attribute-definitions \
            AttributeName=threshold_id,AttributeType=S \
            AttributeName=user_id,AttributeType=S \
        --key-schema \
            AttributeName=threshold_id,KeyType=HASH \
        --global-secondary-indexes \
            IndexName=user-id-index,KeySchema=[{AttributeName=user_id,KeyType=HASH}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5} \
        --provisioned-throughput \
            ReadCapacityUnits=5,WriteCapacityUnits=5 \
        --tags Key=Project,Value=MatbakhAI Key=Component,Value=CostManagement \
        2>/dev/null || log_warning "Cost thresholds table may already exist"
    
    # Threshold Breaches Table
    aws dynamodb create-table \
        --region $REGION \
        --table-name bedrock_threshold_breaches \
        --attribute-definitions \
            AttributeName=breach_id,AttributeType=S \
            AttributeName=threshold_id,AttributeType=S \
        --key-schema \
            AttributeName=breach_id,KeyType=HASH \
        --global-secondary-indexes \
            IndexName=threshold-id-index,KeySchema=[{AttributeName=threshold_id,KeyType=HASH}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5} \
        --provisioned-throughput \
            ReadCapacityUnits=5,WriteCapacityUnits=5 \
        --tags Key=Project,Value=MatbakhAI Key=Component,Value=CostManagement \
        2>/dev/null || log_warning "Threshold breaches table may already exist"
    
    # Alerting Config Table
    aws dynamodb create-table \
        --region $REGION \
        --table-name bedrock_alerting_config \
        --attribute-definitions \
            AttributeName=user_id,AttributeType=S \
        --key-schema \
            AttributeName=user_id,KeyType=HASH \
        --provisioned-throughput \
            ReadCapacityUnits=5,WriteCapacityUnits=5 \
        --tags Key=Project,Value=MatbakhAI Key=Component,Value=CostManagement \
        2>/dev/null || log_warning "Alerting config table may already exist"
    
    # Usage Patterns Table
    aws dynamodb create-table \
        --region $REGION \
        --table-name bedrock_usage_patterns \
        --attribute-definitions \
            AttributeName=user_id,AttributeType=S \
        --key-schema \
            AttributeName=user_id,KeyType=HASH \
        --provisioned-throughput \
            ReadCapacityUnits=5,WriteCapacityUnits=5 \
        --time-to-live-specification \
            AttributeName=ttl,Enabled=true \
        --tags Key=Project,Value=MatbakhAI Key=Component,Value=CostManagement \
        2>/dev/null || log_warning "Usage patterns table may already exist"
    
    # Analytics Cache Table
    aws dynamodb create-table \
        --region $REGION \
        --table-name bedrock_analytics_cache \
        --attribute-definitions \
            AttributeName=cache_key,AttributeType=S \
        --key-schema \
            AttributeName=cache_key,KeyType=HASH \
        --provisioned-throughput \
            ReadCapacityUnits=5,WriteCapacityUnits=5 \
        --time-to-live-specification \
            AttributeName=ttl,Enabled=true \
        --tags Key=Project,Value=MatbakhAI Key=Component,Value=CostManagement \
        2>/dev/null || log_warning "Analytics cache table may already exist"
    
    # Benchmarks Table
    aws dynamodb create-table \
        --region $REGION \
        --table-name bedrock_benchmarks \
        --attribute-definitions \
            AttributeName=industry,AttributeType=S \
            AttributeName=user_tier,AttributeType=S \
        --key-schema \
            AttributeName=industry,KeyType=HASH \
            AttributeName=user_tier,KeyType=RANGE \
        --provisioned-throughput \
            ReadCapacityUnits=5,WriteCapacityUnits=5 \
        --tags Key=Project,Value=MatbakhAI Key=Component,Value=CostManagement \
        2>/dev/null || log_warning "Benchmarks table may already exist"
    
    # Auto Control Config Table
    aws dynamodb create-table \
        --region $REGION \
        --table-name bedrock_auto_control_config \
        --attribute-definitions \
            AttributeName=user_id,AttributeType=S \
        --key-schema \
            AttributeName=user_id,KeyType=HASH \
        --provisioned-throughput \
            ReadCapacityUnits=5,WriteCapacityUnits=5 \
        --tags Key=Project,Value=MatbakhAI Key=Component,Value=CostManagement \
        2>/dev/null || log_warning "Auto control config table may already exist"
    
    # Control Actions Table
    aws dynamodb create-table \
        --region $REGION \
        --table-name bedrock_control_actions \
        --attribute-definitions \
            AttributeName=action_id,AttributeType=S \
            AttributeName=user_id,AttributeType=S \
        --key-schema \
            AttributeName=action_id,KeyType=HASH \
        --global-secondary-indexes \
            IndexName=user-id-index,KeySchema=[{AttributeName=user_id,KeyType=HASH}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5} \
        --provisioned-throughput \
            ReadCapacityUnits=5,WriteCapacityUnits=5 \
        --tags Key=Project,Value=MatbakhAI Key=Component,Value=CostManagement \
        2>/dev/null || log_warning "Control actions table may already exist"
    
    # Cost Monitoring Table
    aws dynamodb create-table \
        --region $REGION \
        --table-name bedrock_cost_monitoring \
        --attribute-definitions \
            AttributeName=monitoring_key,AttributeType=S \
        --key-schema \
            AttributeName=monitoring_key,KeyType=HASH \
        --provisioned-throughput \
            ReadCapacityUnits=5,WriteCapacityUnits=5 \
        --tags Key=Project,Value=MatbakhAI Key=Component,Value=CostManagement \
        2>/dev/null || log_warning "Cost monitoring table may already exist"
    
    log_success "DynamoDB tables created/verified"
}

# Create SNS topic for alerts
create_sns_topic() {
    log_info "Creating SNS topic for cost alerts..."
    
    TOPIC_ARN=$(aws sns create-topic \
        --region $REGION \
        --name $SNS_TOPIC_NAME \
        --tags Key=Project,Value=MatbakhAI Key=Component,Value=CostManagement \
        --query 'TopicArn' \
        --output text 2>/dev/null || echo "")
    
    if [ -z "$TOPIC_ARN" ]; then
        TOPIC_ARN=$(aws sns list-topics \
            --region $REGION \
            --query "Topics[?contains(TopicArn, '$SNS_TOPIC_NAME')].TopicArn" \
            --output text)
    fi
    
    if [ -n "$TOPIC_ARN" ]; then
        log_success "SNS topic created/verified: $TOPIC_ARN"
        echo "COST_ALERT_SNS_TOPIC=$TOPIC_ARN" >> .env.cost-management
    else
        log_error "Failed to create SNS topic"
        exit 1
    fi
}

# Verify SES identity
verify_ses_identity() {
    log_info "Verifying SES identity..."
    
    aws ses verify-email-identity \
        --region $REGION \
        --email-address $SES_IDENTITY \
        2>/dev/null || log_warning "SES identity may already exist or verification failed"
    
    log_success "SES identity verification initiated"
}

# Create IAM role and policy
create_iam_resources() {
    log_info "Creating IAM role and policy..."
    
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
    
    # Create IAM role
    aws iam create-role \
        --role-name $ROLE_NAME \
        --assume-role-policy-document file://trust-policy.json \
        --tags Key=Project,Value=MatbakhAI Key=Component,Value=CostManagement \
        2>/dev/null || log_warning "IAM role may already exist"
    
    # Create policy document
    cat > cost-management-policy.json << EOF
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
                "dynamodb:GetItem",
                "dynamodb:PutItem",
                "dynamodb:UpdateItem",
                "dynamodb:DeleteItem",
                "dynamodb:Query",
                "dynamodb:Scan"
            ],
            "Resource": [
                "arn:aws:dynamodb:$REGION:*:table/bedrock_*",
                "arn:aws:dynamodb:$REGION:*:table/bedrock_*/index/*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "sns:Publish"
            ],
            "Resource": "arn:aws:sns:$REGION:*:$SNS_TOPIC_NAME"
        },
        {
            "Effect": "Allow",
            "Action": [
                "ses:SendEmail",
                "ses:SendRawEmail"
            ],
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "bedrock:InvokeModel"
            ],
            "Resource": "arn:aws:bedrock:$REGION::foundation-model/anthropic.claude-*"
        }
    ]
}
EOF
    
    # Create and attach policy
    aws iam create-policy \
        --policy-name $POLICY_NAME \
        --policy-document file://cost-management-policy.json \
        --tags Key=Project,Value=MatbakhAI Key=Component,Value=CostManagement \
        2>/dev/null || log_warning "IAM policy may already exist"
    
    # Get account ID
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    
    # Attach policy to role
    aws iam attach-role-policy \
        --role-name $ROLE_NAME \
        --policy-arn "arn:aws:iam::$ACCOUNT_ID:policy/$POLICY_NAME" \
        2>/dev/null || log_warning "Policy may already be attached"
    
    # Clean up temporary files
    rm -f trust-policy.json cost-management-policy.json
    
    log_success "IAM resources created/verified"
}

# Create Lambda function
create_lambda_function() {
    log_info "Creating Lambda function..."
    
    # Create deployment package
    zip -r cost-management-deployment.zip dist/ node_modules/ package.json
    
    # Get account ID and role ARN
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    ROLE_ARN="arn:aws:iam::$ACCOUNT_ID:role/$ROLE_NAME"
    
    # Create or update Lambda function
    if aws lambda get-function --function-name $FUNCTION_NAME --region $REGION &>/dev/null; then
        log_info "Updating existing Lambda function..."
        aws lambda update-function-code \
            --region $REGION \
            --function-name $FUNCTION_NAME \
            --zip-file fileb://cost-management-deployment.zip
        
        aws lambda update-function-configuration \
            --region $REGION \
            --function-name $FUNCTION_NAME \
            --runtime nodejs20.x \
            --handler dist/index.handler \
            --timeout 300 \
            --memory-size 512 \
            --environment Variables="{AWS_REGION=$REGION,COST_ALERT_SNS_TOPIC=arn:aws:sns:$REGION:$ACCOUNT_ID:$SNS_TOPIC_NAME}"
    else
        log_info "Creating new Lambda function..."
        aws lambda create-function \
            --region $REGION \
            --function-name $FUNCTION_NAME \
            --runtime nodejs20.x \
            --role $ROLE_ARN \
            --handler dist/index.handler \
            --zip-file fileb://cost-management-deployment.zip \
            --timeout 300 \
            --memory-size 512 \
            --environment Variables="{AWS_REGION=$REGION,COST_ALERT_SNS_TOPIC=arn:aws:sns:$REGION:$ACCOUNT_ID:$SNS_TOPIC_NAME}" \
            --tags Project=MatbakhAI,Component=CostManagement
    fi
    
    # Clean up deployment package
    rm -f cost-management-deployment.zip
    
    log_success "Lambda function created/updated"
}

# Create EventBridge rule for monitoring
create_eventbridge_rule() {
    log_info "Creating EventBridge rule for cost monitoring..."
    
    # Create rule for periodic monitoring (every 15 minutes)
    aws events put-rule \
        --region $REGION \
        --name bedrock-cost-monitoring \
        --schedule-expression "rate(15 minutes)" \
        --description "Periodic cost threshold monitoring for Bedrock AI" \
        --tags Key=Project,Value=MatbakhAI Key=Component,Value=CostManagement \
        2>/dev/null || log_warning "EventBridge rule may already exist"
    
    # Get account ID and Lambda ARN
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    LAMBDA_ARN="arn:aws:lambda:$REGION:$ACCOUNT_ID:function:$FUNCTION_NAME"
    
    # Add Lambda as target
    aws events put-targets \
        --region $REGION \
        --rule bedrock-cost-monitoring \
        --targets "Id"="1","Arn"="$LAMBDA_ARN","Input"='{"action":"monitor_thresholds"}' \
        2>/dev/null || log_warning "EventBridge target may already exist"
    
    # Add permission for EventBridge to invoke Lambda
    aws lambda add-permission \
        --region $REGION \
        --function-name $FUNCTION_NAME \
        --statement-id bedrock-cost-monitoring \
        --action lambda:InvokeFunction \
        --principal events.amazonaws.com \
        --source-arn "arn:aws:events:$REGION:$ACCOUNT_ID:rule/bedrock-cost-monitoring" \
        2>/dev/null || log_warning "Lambda permission may already exist"
    
    log_success "EventBridge rule created/configured"
}

# Populate benchmark data
populate_benchmark_data() {
    log_info "Populating benchmark data..."
    
    # Create benchmark data for different industries and tiers
    cat > benchmark-data.json << 'EOF'
[
    {
        "industry": "hospitality",
        "user_tier": "starter",
        "metrics": {
            "averageMonthlyCost": 25,
            "averageTokensPerRequest": 1200,
            "averageCostPerToken": 0.00002,
            "cacheHitRate": 0.3,
            "preferredModels": ["claude-3-haiku", "claude-3-5-sonnet"]
        },
        "percentiles": {
            "p25": 10,
            "p50": 25,
            "p75": 45,
            "p90": 70,
            "p95": 100
        }
    },
    {
        "industry": "hospitality",
        "user_tier": "professional",
        "metrics": {
            "averageMonthlyCost": 75,
            "averageTokensPerRequest": 1500,
            "averageCostPerToken": 0.00005,
            "cacheHitRate": 0.4,
            "preferredModels": ["claude-3-5-sonnet", "claude-3-haiku"]
        },
        "percentiles": {
            "p25": 30,
            "p50": 75,
            "p75": 120,
            "p90": 180,
            "p95": 250
        }
    },
    {
        "industry": "hospitality",
        "user_tier": "enterprise",
        "metrics": {
            "averageMonthlyCost": 200,
            "averageTokensPerRequest": 2000,
            "averageCostPerToken": 0.0001,
            "cacheHitRate": 0.5,
            "preferredModels": ["claude-3-5-sonnet", "claude-3-opus"]
        },
        "percentiles": {
            "p25": 80,
            "p50": 200,
            "p75": 350,
            "p90": 500,
            "p95": 750
        }
    }
]
EOF
    
    # Upload benchmark data to DynamoDB
    while IFS= read -r line; do
        if [[ $line == *"industry"* ]]; then
            aws dynamodb put-item \
                --region $REGION \
                --table-name bedrock_benchmarks \
                --item "$line" \
                2>/dev/null || log_warning "Failed to insert benchmark data"
        fi
    done < <(jq -c '.[]' benchmark-data.json | while read item; do
        industry=$(echo $item | jq -r '.industry')
        user_tier=$(echo $item | jq -r '.user_tier')
        metrics=$(echo $item | jq -c '.metrics')
        percentiles=$(echo $item | jq -c '.percentiles')
        
        echo "{\"industry\":{\"S\":\"$industry\"},\"user_tier\":{\"S\":\"$user_tier\"},\"metrics\":{\"S\":\"$metrics\"},\"percentiles\":{\"S\":\"$percentiles\"}}"
    done)
    
    rm -f benchmark-data.json
    log_success "Benchmark data populated"
}

# Create environment configuration
create_environment_config() {
    log_info "Creating environment configuration..."
    
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    
    cat > .env.cost-management << EOF
# Cost Management System Configuration
AWS_REGION=$REGION
COST_ALERT_SNS_TOPIC=arn:aws:sns:$REGION:$ACCOUNT_ID:$SNS_TOPIC_NAME
EMERGENCY_ALERT_SNS_TOPIC=arn:aws:sns:$REGION:$ACCOUNT_ID:$SNS_TOPIC_NAME
WEBHOOK_LAMBDA_ARN=arn:aws:lambda:$REGION:$ACCOUNT_ID:function:bedrock-webhook-handler

# DynamoDB Tables
TOKEN_USAGE_TABLE=bedrock_token_usage
TOKEN_ANALYTICS_TABLE=bedrock_token_analytics
COST_THRESHOLDS_TABLE=bedrock_cost_thresholds
THRESHOLD_BREACHES_TABLE=bedrock_threshold_breaches
ALERTING_CONFIG_TABLE=bedrock_alerting_config
USAGE_PATTERNS_TABLE=bedrock_usage_patterns
ANALYTICS_CACHE_TABLE=bedrock_analytics_cache
BENCHMARKS_TABLE=bedrock_benchmarks
AUTO_CONTROL_CONFIG_TABLE=bedrock_auto_control_config
CONTROL_ACTIONS_TABLE=bedrock_control_actions
COST_MONITORING_TABLE=bedrock_cost_monitoring

# Lambda Function
COST_MANAGEMENT_FUNCTION=$FUNCTION_NAME
EOF
    
    log_success "Environment configuration created: .env.cost-management"
}

# Verify deployment
verify_deployment() {
    log_info "Verifying deployment..."
    
    # Test Lambda function
    aws lambda invoke \
        --region $REGION \
        --function-name $FUNCTION_NAME \
        --payload '{"action":"health_check"}' \
        response.json
    
    if [ $? -eq 0 ]; then
        log_success "Lambda function is responding"
        cat response.json
        rm -f response.json
    else
        log_error "Lambda function test failed"
        exit 1
    fi
    
    # Check DynamoDB tables
    TABLES=(
        "bedrock_token_usage"
        "bedrock_token_analytics"
        "bedrock_cost_thresholds"
        "bedrock_threshold_breaches"
        "bedrock_alerting_config"
        "bedrock_usage_patterns"
        "bedrock_analytics_cache"
        "bedrock_benchmarks"
        "bedrock_auto_control_config"
        "bedrock_control_actions"
        "bedrock_cost_monitoring"
    )
    
    for table in "${TABLES[@]}"; do
        if aws dynamodb describe-table --region $REGION --table-name $table &>/dev/null; then
            log_success "Table $table is active"
        else
            log_error "Table $table is not accessible"
        fi
    done
    
    log_success "Deployment verification completed"
}

# Generate documentation
generate_documentation() {
    log_info "Generating deployment documentation..."
    
    cat > COST_MANAGEMENT_DEPLOYMENT.md << EOF
# Cost Management System Deployment

## Overview
The Cost Management System has been successfully deployed with the following components:

### AWS Resources Created
- **Lambda Function**: $FUNCTION_NAME
- **IAM Role**: $ROLE_NAME
- **IAM Policy**: $POLICY_NAME
- **SNS Topic**: $SNS_TOPIC_NAME
- **EventBridge Rule**: bedrock-cost-monitoring

### DynamoDB Tables
- bedrock_token_usage (Token usage tracking)
- bedrock_token_analytics (Aggregated analytics)
- bedrock_cost_thresholds (User-defined thresholds)
- bedrock_threshold_breaches (Breach records)
- bedrock_alerting_config (User alert preferences)
- bedrock_usage_patterns (Usage pattern analysis)
- bedrock_analytics_cache (Analytics caching)
- bedrock_benchmarks (Industry benchmarks)
- bedrock_auto_control_config (Auto control settings)
- bedrock_control_actions (Control action history)
- bedrock_cost_monitoring (Monitoring data)

### Features Deployed
1. **Token Usage Tracking**: Comprehensive tracking of all AI operations
2. **Cost Threshold Monitoring**: Real-time threshold monitoring with alerts
3. **Usage Analytics Engine**: Advanced analytics and optimization insights
4. **Automatic Cost Control**: Intelligent cost control with throttling and shutdown

### Configuration
Environment variables are stored in: .env.cost-management

### Monitoring
- EventBridge rule triggers monitoring every 15 minutes
- SNS alerts for threshold breaches
- CloudWatch logs for all operations

### Next Steps
1. Configure user-specific cost thresholds
2. Set up email subscriptions to SNS topic
3. Customize alerting preferences
4. Monitor usage patterns and optimize

### API Endpoints
The Lambda function supports the following actions:
- track_token_usage
- monitor_thresholds
- get_analytics
- execute_auto_controls
- health_check

### Troubleshooting
- Check CloudWatch logs: /aws/lambda/$FUNCTION_NAME
- Verify IAM permissions if operations fail
- Ensure DynamoDB tables are active
- Check SNS topic subscriptions for alerts

Deployment completed on: $(date)
Region: $REGION
EOF
    
    log_success "Documentation generated: COST_MANAGEMENT_DEPLOYMENT.md"
}

# Main deployment flow
main() {
    echo "🎯 Cost Management System Deployment"
    echo "======================================"
    
    check_prerequisites
    install_dependencies
    run_tests
    build_project
    create_dynamodb_tables
    create_sns_topic
    verify_ses_identity
    create_iam_resources
    create_lambda_function
    create_eventbridge_rule
    populate_benchmark_data
    create_environment_config
    verify_deployment
    generate_documentation
    
    echo ""
    echo "🎉 Cost Management System Deployment Complete!"
    echo ""
    echo "📋 Summary:"
    echo "  • Lambda Function: $FUNCTION_NAME"
    echo "  • Region: $REGION"
    echo "  • DynamoDB Tables: 11 tables created"
    echo "  • SNS Topic: $SNS_TOPIC_NAME"
    echo "  • Monitoring: Every 15 minutes"
    echo ""
    echo "📖 Documentation: COST_MANAGEMENT_DEPLOYMENT.md"
    echo "⚙️  Configuration: .env.cost-management"
    echo ""
    echo "🚀 The system is now ready for cost management operations!"
}

# Run main function
main "$@"