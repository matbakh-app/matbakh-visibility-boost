#!/bin/bash

# Deploy Feature Flag Infrastructure for Bedrock AI Core
# This script sets up all necessary AWS resources for the feature flag system

set -e

echo "🚀 Deploying Bedrock AI Feature Flag Infrastructure..."

# Configuration
REGION=${AWS_REGION:-eu-central-1}
STACK_NAME="bedrock-feature-flags"
LAMBDA_FUNCTION_NAME="bedrock-ai-agent"

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
        log_error "AWS CLI is not installed"
        exit 1
    fi
    
    if ! command -v jq &> /dev/null; then
        log_error "jq is not installed"
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS credentials not configured"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Create DynamoDB tables for feature flags
create_dynamodb_tables() {
    log_info "Creating DynamoDB tables..."
    
    # Feature Flags table
    aws dynamodb create-table \
        --region $REGION \
        --table-name bedrock-feature-flags \
        --attribute-definitions \
            AttributeName=flag_name,AttributeType=S \
        --key-schema \
            AttributeName=flag_name,KeyType=HASH \
        --billing-mode PAY_PER_REQUEST \
        --tags Key=Project,Value=BedrockAI Key=Component,Value=FeatureFlags \
        2>/dev/null || log_warning "Feature flags table may already exist"
    
    # Cost Metrics table
    aws dynamodb create-table \
        --region $REGION \
        --table-name bedrock-cost-metrics \
        --attribute-definitions \
            AttributeName=date,AttributeType=S \
            AttributeName=request_type,AttributeType=S \
        --key-schema \
            AttributeName=date,KeyType=HASH \
            AttributeName=request_type,KeyType=RANGE \
        --billing-mode PAY_PER_REQUEST \
        --tags Key=Project,Value=BedrockAI Key=Component,Value=CostControl \
        2>/dev/null || log_warning "Cost metrics table may already exist"
    
    # Cost Thresholds table
    aws dynamodb create-table \
        --region $REGION \
        --table-name bedrock-cost-thresholds \
        --attribute-definitions \
            AttributeName=threshold_name,AttributeType=S \
        --key-schema \
            AttributeName=threshold_name,KeyType=HASH \
        --billing-mode PAY_PER_REQUEST \
        --tags Key=Project,Value=BedrockAI Key=Component,Value=CostControl \
        2>/dev/null || log_warning "Cost thresholds table may already exist"
    
    # Cost Alerts table
    aws dynamodb create-table \
        --region $REGION \
        --table-name bedrock-cost-alerts \
        --attribute-definitions \
            AttributeName=alert_id,AttributeType=S \
            AttributeName=timestamp,AttributeType=S \
        --key-schema \
            AttributeName=alert_id,KeyType=HASH \
        --global-secondary-indexes \
            IndexName=timestamp-index,KeySchema=[{AttributeName=timestamp,KeyType=HASH}],Projection={ProjectionType=ALL} \
        --billing-mode PAY_PER_REQUEST \
        --tags Key=Project,Value=BedrockAI Key=Component,Value=CostControl \
        2>/dev/null || log_warning "Cost alerts table may already exist"
    
    # A/B Test Experiments table
    aws dynamodb create-table \
        --region $REGION \
        --table-name bedrock-ab-experiments \
        --attribute-definitions \
            AttributeName=experiment_id,AttributeType=S \
        --key-schema \
            AttributeName=experiment_id,KeyType=HASH \
        --billing-mode PAY_PER_REQUEST \
        --tags Key=Project,Value=BedrockAI Key=Component,Value=ABTesting \
        2>/dev/null || log_warning "A/B experiments table may already exist"
    
    # A/B Test Assignments table
    aws dynamodb create-table \
        --region $REGION \
        --table-name bedrock-ab-assignments \
        --attribute-definitions \
            AttributeName=experiment_id,AttributeType=S \
            AttributeName=user_id,AttributeType=S \
        --key-schema \
            AttributeName=experiment_id,KeyType=HASH \
            AttributeName=user_id,KeyType=RANGE \
        --billing-mode PAY_PER_REQUEST \
        --tags Key=Project,Value=BedrockAI Key=Component,Value=ABTesting \
        2>/dev/null || log_warning "A/B assignments table may already exist"
    
    # A/B Test Events table
    aws dynamodb create-table \
        --region $REGION \
        --table-name bedrock-ab-events \
        --attribute-definitions \
            AttributeName=event_id,AttributeType=S \
            AttributeName=experiment_id,AttributeType=S \
            AttributeName=timestamp,AttributeType=S \
        --key-schema \
            AttributeName=event_id,KeyType=HASH \
        --global-secondary-indexes \
            IndexName=experiment-timestamp-index,KeySchema=[{AttributeName=experiment_id,KeyType=HASH},{AttributeName=timestamp,KeyType=RANGE}],Projection={ProjectionType=ALL} \
        --billing-mode PAY_PER_REQUEST \
        --tags Key=Project,Value=BedrockAI Key=Component,Value=ABTesting \
        2>/dev/null || log_warning "A/B events table may already exist"
    
    # A/B Test Results table
    aws dynamodb create-table \
        --region $REGION \
        --table-name bedrock-ab-results \
        --attribute-definitions \
            AttributeName=experiment_id,AttributeType=S \
            AttributeName=variant,AttributeType=S \
        --key-schema \
            AttributeName=experiment_id,KeyType=HASH \
            AttributeName=variant,KeyType=RANGE \
        --billing-mode PAY_PER_REQUEST \
        --tags Key=Project,Value=BedrockAI Key=Component,Value=ABTesting \
        2>/dev/null || log_warning "A/B results table may already exist"
    
    log_success "DynamoDB tables creation initiated"
}

# Wait for tables to be active
wait_for_tables() {
    log_info "Waiting for DynamoDB tables to become active..."
    
    tables=(
        "bedrock-feature-flags"
        "bedrock-cost-metrics"
        "bedrock-cost-thresholds"
        "bedrock-cost-alerts"
        "bedrock-ab-experiments"
        "bedrock-ab-assignments"
        "bedrock-ab-events"
        "bedrock-ab-results"
    )
    
    for table in "${tables[@]}"; do
        log_info "Waiting for table: $table"
        aws dynamodb wait table-exists --region $REGION --table-name $table
        log_success "Table $table is active"
    done
}

# Seed initial feature flags
seed_feature_flags() {
    log_info "Seeding initial feature flags..."
    
    # Bedrock Live flag
    aws dynamodb put-item \
        --region $REGION \
        --table-name bedrock-feature-flags \
        --item '{
            "flag_name": {"S": "vc_bedrock_live"},
            "enabled": {"BOOL": true},
            "value": {"S": "true"},
            "description": {"S": "Enable Bedrock AI analysis for visibility checks"},
            "rollout_percentage": {"N": "10"},
            "updated_by": {"S": "deployment-script"},
            "updated_at": {"S": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'"}
        }' \
        --condition-expression "attribute_not_exists(flag_name)" \
        2>/dev/null || log_warning "vc_bedrock_live flag may already exist"
    
    # Bedrock Rollout Percentage flag
    aws dynamodb put-item \
        --region $REGION \
        --table-name bedrock-feature-flags \
        --item '{
            "flag_name": {"S": "vc_bedrock_rollout_percent"},
            "enabled": {"BOOL": true},
            "value": {"S": "10"},
            "description": {"S": "Percentage of traffic for Bedrock canary testing"},
            "rollout_percentage": {"N": "10"},
            "updated_by": {"S": "deployment-script"},
            "updated_at": {"S": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'"}
        }' \
        --condition-expression "attribute_not_exists(flag_name)" \
        2>/dev/null || log_warning "vc_bedrock_rollout_percent flag may already exist"
    
    # AI Model Selection A/B Test flag
    aws dynamodb put-item \
        --region $REGION \
        --table-name bedrock-feature-flags \
        --item '{
            "flag_name": {"S": "ai_model_selection"},
            "enabled": {"BOOL": false},
            "value": {"S": "claude"},
            "description": {"S": "A/B test for different AI models (Claude vs Gemini)"},
            "rollout_percentage": {"N": "0"},
            "updated_by": {"S": "deployment-script"},
            "updated_at": {"S": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'"}
        }' \
        --condition-expression "attribute_not_exists(flag_name)" \
        2>/dev/null || log_warning "ai_model_selection flag may already exist"
    
    log_success "Initial feature flags seeded"
}

# Seed cost thresholds
seed_cost_thresholds() {
    log_info "Seeding cost control thresholds..."
    
    # Daily Bedrock limit
    aws dynamodb put-item \
        --region $REGION \
        --table-name bedrock-cost-thresholds \
        --item '{
            "threshold_name": {"S": "daily_bedrock_limit"},
            "limit_usd": {"N": "100"},
            "period": {"S": "daily"},
            "action": {"S": "throttle"},
            "affected_features": {"SS": ["vc_bedrock_live"]},
            "alert_channels": {"SS": ["email", "slack"]},
            "enabled": {"BOOL": true}
        }' \
        --condition-expression "attribute_not_exists(threshold_name)" \
        2>/dev/null || log_warning "daily_bedrock_limit threshold may already exist"
    
    # Emergency shutdown limit
    aws dynamodb put-item \
        --region $REGION \
        --table-name bedrock-cost-thresholds \
        --item '{
            "threshold_name": {"S": "daily_emergency_limit"},
            "limit_usd": {"N": "500"},
            "period": {"S": "daily"},
            "action": {"S": "emergency_shutdown"},
            "affected_features": {"SS": ["vc_bedrock_live", "vc_bedrock_rollout_percent"]},
            "alert_channels": {"SS": ["email", "slack", "pagerduty"]},
            "enabled": {"BOOL": true}
        }' \
        --condition-expression "attribute_not_exists(threshold_name)" \
        2>/dev/null || log_warning "daily_emergency_limit threshold may already exist"
    
    log_success "Cost control thresholds seeded"
}

# Update Lambda function environment variables
update_lambda_environment() {
    log_info "Updating Lambda function environment variables..."
    
    # Get current environment variables
    current_env=$(aws lambda get-function-configuration \
        --region $REGION \
        --function-name $LAMBDA_FUNCTION_NAME \
        --query 'Environment.Variables' \
        --output json 2>/dev/null || echo '{}')
    
    # Add feature flag table names
    updated_env=$(echo $current_env | jq '. + {
        "FEATURE_FLAGS_TABLE": "bedrock-feature-flags",
        "COST_METRICS_TABLE": "bedrock-cost-metrics",
        "COST_THRESHOLDS_TABLE": "bedrock-cost-thresholds",
        "COST_ALERTS_TABLE": "bedrock-cost-alerts",
        "AB_EXPERIMENTS_TABLE": "bedrock-ab-experiments",
        "AB_ASSIGNMENTS_TABLE": "bedrock-ab-assignments",
        "AB_EVENTS_TABLE": "bedrock-ab-events",
        "AB_RESULTS_TABLE": "bedrock-ab-results"
    }')
    
    # Update Lambda function
    aws lambda update-function-configuration \
        --region $REGION \
        --function-name $LAMBDA_FUNCTION_NAME \
        --environment "Variables=$updated_env" \
        > /dev/null
    
    log_success "Lambda environment variables updated"
}

# Update Lambda function IAM permissions
update_lambda_permissions() {
    log_info "Updating Lambda function IAM permissions..."
    
    # Get Lambda function role ARN
    role_arn=$(aws lambda get-function-configuration \
        --region $REGION \
        --function-name $LAMBDA_FUNCTION_NAME \
        --query 'Role' \
        --output text)
    
    role_name=$(echo $role_arn | cut -d'/' -f2)
    
    # Create policy document for DynamoDB access
    cat > /tmp/feature-flags-policy.json << EOF
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
                "arn:aws:dynamodb:$REGION:*:table/bedrock-feature-flags",
                "arn:aws:dynamodb:$REGION:*:table/bedrock-cost-metrics",
                "arn:aws:dynamodb:$REGION:*:table/bedrock-cost-thresholds",
                "arn:aws:dynamodb:$REGION:*:table/bedrock-cost-alerts",
                "arn:aws:dynamodb:$REGION:*:table/bedrock-ab-experiments",
                "arn:aws:dynamodb:$REGION:*:table/bedrock-ab-assignments",
                "arn:aws:dynamodb:$REGION:*:table/bedrock-ab-events",
                "arn:aws:dynamodb:$REGION:*:table/bedrock-ab-results",
                "arn:aws:dynamodb:$REGION:*:table/bedrock-*/index/*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "cloudwatch:PutMetricData"
            ],
            "Resource": "*",
            "Condition": {
                "StringEquals": {
                    "cloudwatch:namespace": "BedrockAI/Costs"
                }
            }
        }
    ]
}
EOF
    
    # Create or update the policy
    policy_arn="arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):policy/BedrockFeatureFlagsPolicy"
    
    aws iam create-policy \
        --policy-name BedrockFeatureFlagsPolicy \
        --policy-document file:///tmp/feature-flags-policy.json \
        --description "Policy for Bedrock AI feature flags and cost control" \
        2>/dev/null || \
    aws iam create-policy-version \
        --policy-arn $policy_arn \
        --policy-document file:///tmp/feature-flags-policy.json \
        --set-as-default \
        2>/dev/null || log_warning "Policy may already exist with same version"
    
    # Attach policy to role
    aws iam attach-role-policy \
        --role-name $role_name \
        --policy-arn $policy_arn \
        2>/dev/null || log_warning "Policy may already be attached"
    
    # Clean up
    rm -f /tmp/feature-flags-policy.json
    
    log_success "Lambda IAM permissions updated"
}

# Create CloudWatch alarms for cost monitoring
create_cloudwatch_alarms() {
    log_info "Creating CloudWatch alarms for cost monitoring..."
    
    # Daily cost alarm
    aws cloudwatch put-metric-alarm \
        --region $REGION \
        --alarm-name "BedrockAI-DailyCostHigh" \
        --alarm-description "Alert when daily Bedrock costs exceed threshold" \
        --metric-name "RequestCost" \
        --namespace "BedrockAI/Costs" \
        --statistic "Sum" \
        --period 86400 \
        --evaluation-periods 1 \
        --threshold 50 \
        --comparison-operator "GreaterThanThreshold" \
        --treat-missing-data "notBreaching" \
        2>/dev/null || log_warning "Daily cost alarm may already exist"
    
    # Error rate alarm
    aws cloudwatch put-metric-alarm \
        --region $REGION \
        --alarm-name "BedrockAI-HighErrorRate" \
        --alarm-description "Alert when Bedrock error rate is high" \
        --metric-name "ErrorRate" \
        --namespace "BedrockAI/Operations" \
        --statistic "Average" \
        --period 300 \
        --evaluation-periods 2 \
        --threshold 10 \
        --comparison-operator "GreaterThanThreshold" \
        --treat-missing-data "notBreaching" \
        2>/dev/null || log_warning "Error rate alarm may already exist"
    
    log_success "CloudWatch alarms created"
}

# Run health check
run_health_check() {
    log_info "Running health check..."
    
    # Test Lambda function
    if aws lambda invoke \
        --region $REGION \
        --function-name $LAMBDA_FUNCTION_NAME \
        --payload '{"httpMethod":"GET","path":"/health"}' \
        /tmp/health-response.json > /dev/null 2>&1; then
        
        status_code=$(jq -r '.statusCode' /tmp/health-response.json 2>/dev/null || echo "unknown")
        if [ "$status_code" = "200" ]; then
            log_success "Health check passed"
        else
            log_warning "Health check returned status: $status_code"
        fi
    else
        log_warning "Could not invoke Lambda function for health check"
    fi
    
    # Clean up
    rm -f /tmp/health-response.json
}

# Main deployment function
main() {
    echo "🚀 Starting Bedrock AI Feature Flag Infrastructure Deployment"
    echo "Region: $REGION"
    echo "Lambda Function: $LAMBDA_FUNCTION_NAME"
    echo ""
    
    check_prerequisites
    create_dynamodb_tables
    wait_for_tables
    seed_feature_flags
    seed_cost_thresholds
    update_lambda_environment
    update_lambda_permissions
    create_cloudwatch_alarms
    run_health_check
    
    echo ""
    log_success "🎉 Feature Flag Infrastructure Deployment Complete!"
    echo ""
    echo "📊 Summary:"
    echo "  • 8 DynamoDB tables created"
    echo "  • Feature flags seeded with initial values"
    echo "  • Cost control thresholds configured"
    echo "  • Lambda permissions updated"
    echo "  • CloudWatch alarms created"
    echo ""
    echo "🔧 Next Steps:"
    echo "  1. Test feature flag endpoints: GET /feature-flags/status"
    echo "  2. Monitor costs in CloudWatch: BedrockAI/Costs namespace"
    echo "  3. Set up A/B tests using the framework"
    echo "  4. Configure gradual rollout strategies"
    echo ""
    echo "📚 Documentation:"
    echo "  • Feature Flag Manager: src/feature-flag-manager.ts"
    echo "  • Cost Control: src/cost-control-feature-flags.ts"
    echo "  • A/B Testing: src/ab-testing-framework.ts"
    echo "  • Gradual Rollout: src/gradual-rollout-system.ts"
}

# Run main function
main "$@"