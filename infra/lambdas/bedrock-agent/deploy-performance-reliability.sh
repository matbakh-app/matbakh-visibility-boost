#!/bin/bash

# Deploy Performance & Reliability Infrastructure
# Creates DynamoDB tables, CloudWatch alarms, and SNS topics for the performance system

set -e

echo "🚀 Deploying Bedrock AI Performance & Reliability Infrastructure..."

# Configuration
AWS_REGION=${AWS_REGION:-"eu-central-1"}
ENVIRONMENT=${ENVIRONMENT:-"production"}
PROJECT_NAME="matbakh-bedrock-ai"

# Table names
QUEUE_TABLE_NAME="${PROJECT_NAME}-request-queue-${ENVIRONMENT}"
CACHE_TABLE_NAME="${PROJECT_NAME}-response-cache-${ENVIRONMENT}"
METRICS_TABLE_NAME="${PROJECT_NAME}-performance-metrics-${ENVIRONMENT}"

# SNS Topic for alerts
ALERT_TOPIC_NAME="${PROJECT_NAME}-performance-alerts-${ENVIRONMENT}"

echo "📋 Configuration:"
echo "  Region: $AWS_REGION"
echo "  Environment: $ENVIRONMENT"
echo "  Queue Table: $QUEUE_TABLE_NAME"
echo "  Cache Table: $CACHE_TABLE_NAME"
echo "  Metrics Table: $METRICS_TABLE_NAME"
echo "  Alert Topic: $ALERT_TOPIC_NAME"

# Create SNS Topic for alerts
echo "📢 Creating SNS topic for performance alerts..."
ALERT_TOPIC_ARN=$(aws sns create-topic \
  --name "$ALERT_TOPIC_NAME" \
  --region "$AWS_REGION" \
  --output text --query 'TopicArn')

echo "✅ SNS Topic created: $ALERT_TOPIC_ARN"

# Create DynamoDB table for request queue
echo "📊 Creating DynamoDB table for request queue..."
aws dynamodb create-table \
  --table-name "$QUEUE_TABLE_NAME" \
  --attribute-definitions \
    AttributeName=requestId,AttributeType=S \
    AttributeName=status,AttributeType=S \
    AttributeName=priorityScore,AttributeType=N \
    AttributeName=operation,AttributeType=S \
    AttributeName=timestamp,AttributeType=N \
  --key-schema \
    AttributeName=requestId,KeyType=HASH \
  --global-secondary-indexes \
    IndexName=status-priorityScore-index,KeySchema=[{AttributeName=status,KeyType=HASH},{AttributeName=priorityScore,KeyType=RANGE}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5} \
    IndexName=operation-timestamp-index,KeySchema=[{AttributeName=operation,KeyType=HASH},{AttributeName=timestamp,KeyType=RANGE}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5} \
  --provisioned-throughput ReadCapacityUnits=10,WriteCapacityUnits=10 \
  --region "$AWS_REGION" \
  --tags Key=Environment,Value="$ENVIRONMENT" Key=Project,Value="$PROJECT_NAME" Key=Component,Value=RequestQueue \
  || echo "⚠️  Queue table might already exist"

# Enable TTL on queue table
echo "⏰ Enabling TTL on queue table..."
aws dynamodb update-time-to-live \
  --table-name "$QUEUE_TABLE_NAME" \
  --time-to-live-specification Enabled=true,AttributeName=ttl \
  --region "$AWS_REGION" \
  || echo "⚠️  TTL might already be enabled"

# Create DynamoDB table for response cache
echo "💾 Creating DynamoDB table for response cache..."
aws dynamodb create-table \
  --table-name "$CACHE_TABLE_NAME" \
  --attribute-definitions \
    AttributeName=cacheKey,AttributeType=S \
    AttributeName=operation,AttributeType=S \
    AttributeName=timestamp,AttributeType=N \
  --key-schema \
    AttributeName=cacheKey,KeyType=HASH \
  --global-secondary-indexes \
    IndexName=operation-timestamp-index,KeySchema=[{AttributeName=operation,KeyType=HASH},{AttributeName=timestamp,KeyType=RANGE}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5} \
  --provisioned-throughput ReadCapacityUnits=20,WriteCapacityUnits=10 \
  --region "$AWS_REGION" \
  --tags Key=Environment,Value="$ENVIRONMENT" Key=Project,Value="$PROJECT_NAME" Key=Component,Value=ResponseCache \
  || echo "⚠️  Cache table might already exist"

# Enable TTL on cache table
echo "⏰ Enabling TTL on cache table..."
aws dynamodb update-time-to-live \
  --table-name "$CACHE_TABLE_NAME" \
  --time-to-live-specification Enabled=true,AttributeName=ttl \
  --region "$AWS_REGION" \
  || echo "⚠️  TTL might already be enabled"

# Create DynamoDB table for performance metrics (optional, for detailed tracking)
echo "📈 Creating DynamoDB table for performance metrics..."
aws dynamodb create-table \
  --table-name "$METRICS_TABLE_NAME" \
  --attribute-definitions \
    AttributeName=metricId,AttributeType=S \
    AttributeName=timestamp,AttributeType=N \
    AttributeName=operation,AttributeType=S \
  --key-schema \
    AttributeName=metricId,KeyType=HASH \
    AttributeName=timestamp,KeyType=RANGE \
  --global-secondary-indexes \
    IndexName=operation-timestamp-index,KeySchema=[{AttributeName=operation,KeyType=HASH},{AttributeName=timestamp,KeyType=RANGE}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5} \
  --provisioned-throughput ReadCapacityUnits=10,WriteCapacityUnits=20 \
  --region "$AWS_REGION" \
  --tags Key=Environment,Value="$ENVIRONMENT" Key=Project,Value="$PROJECT_NAME" Key=Component,Value=PerformanceMetrics \
  || echo "⚠️  Metrics table might already exist"

# Enable TTL on metrics table (30 days retention)
echo "⏰ Enabling TTL on metrics table..."
aws dynamodb update-time-to-live \
  --table-name "$METRICS_TABLE_NAME" \
  --time-to-live-specification Enabled=true,AttributeName=ttl \
  --region "$AWS_REGION" \
  || echo "⚠️  TTL might already be enabled"

# Wait for tables to be active
echo "⏳ Waiting for tables to become active..."
aws dynamodb wait table-exists --table-name "$QUEUE_TABLE_NAME" --region "$AWS_REGION"
aws dynamodb wait table-exists --table-name "$CACHE_TABLE_NAME" --region "$AWS_REGION"
aws dynamodb wait table-exists --table-name "$METRICS_TABLE_NAME" --region "$AWS_REGION"

echo "✅ All tables are active"

# Create CloudWatch alarms for performance monitoring
echo "🔔 Creating CloudWatch alarms..."

# Response time alarm (critical)
aws cloudwatch put-metric-alarm \
  --alarm-name "${PROJECT_NAME}-response-time-critical-${ENVIRONMENT}" \
  --alarm-description "Critical response time threshold exceeded" \
  --metric-name ResponseTime \
  --namespace Bedrock/AI/Performance \
  --statistic Average \
  --period 300 \
  --threshold 30000 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --alarm-actions "$ALERT_TOPIC_ARN" \
  --region "$AWS_REGION" \
  --tags Key=Environment,Value="$ENVIRONMENT" Key=Project,Value="$PROJECT_NAME"

# Error rate alarm
aws cloudwatch put-metric-alarm \
  --alarm-name "${PROJECT_NAME}-error-rate-high-${ENVIRONMENT}" \
  --alarm-description "High error rate detected" \
  --metric-name ErrorCount \
  --namespace Bedrock/AI/Performance \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --alarm-actions "$ALERT_TOPIC_ARN" \
  --region "$AWS_REGION" \
  --tags Key=Environment,Value="$ENVIRONMENT" Key=Project,Value="$PROJECT_NAME"

# Queue depth alarm
aws cloudwatch put-metric-alarm \
  --alarm-name "${PROJECT_NAME}-queue-depth-high-${ENVIRONMENT}" \
  --alarm-description "Request queue depth is high" \
  --metric-name QueueDepth \
  --namespace Bedrock/AI/Performance \
  --statistic Average \
  --period 300 \
  --threshold 100 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --alarm-actions "$ALERT_TOPIC_ARN" \
  --region "$AWS_REGION" \
  --tags Key=Environment,Value="$ENVIRONMENT" Key=Project,Value="$PROJECT_NAME"

# Cache hit rate alarm (low cache hit rate)
aws cloudwatch put-metric-alarm \
  --alarm-name "${PROJECT_NAME}-cache-hit-rate-low-${ENVIRONMENT}" \
  --alarm-description "Cache hit rate is below optimal threshold" \
  --metric-name CacheHitRate \
  --namespace Bedrock/AI/Performance \
  --statistic Average \
  --period 900 \
  --threshold 0.3 \
  --comparison-operator LessThanThreshold \
  --evaluation-periods 3 \
  --alarm-actions "$ALERT_TOPIC_ARN" \
  --region "$AWS_REGION" \
  --tags Key=Environment,Value="$ENVIRONMENT" Key=Project,Value="$PROJECT_NAME"

echo "✅ CloudWatch alarms created"

# Create CloudWatch dashboard
echo "📊 Creating CloudWatch dashboard..."
DASHBOARD_BODY=$(cat <<EOF
{
  "widgets": [
    {
      "type": "metric",
      "x": 0,
      "y": 0,
      "width": 12,
      "height": 6,
      "properties": {
        "metrics": [
          [ "Bedrock/AI/Performance", "ResponseTime", "Operation", "vc-analysis" ],
          [ ".", ".", ".", "content-generation" ],
          [ ".", ".", ".", "business-framework" ],
          [ ".", ".", ".", "persona-detection" ]
        ],
        "period": 300,
        "stat": "Average",
        "region": "$AWS_REGION",
        "title": "Average Response Time by Operation",
        "yAxis": {
          "left": {
            "min": 0,
            "max": 35000
          }
        }
      }
    },
    {
      "type": "metric",
      "x": 12,
      "y": 0,
      "width": 12,
      "height": 6,
      "properties": {
        "metrics": [
          [ "Bedrock/AI/Performance", "RequestCount", "Success", "true" ],
          [ ".", ".", ".", "false" ]
        ],
        "period": 300,
        "stat": "Sum",
        "region": "$AWS_REGION",
        "title": "Request Success/Failure Rate"
      }
    },
    {
      "type": "metric",
      "x": 0,
      "y": 6,
      "width": 8,
      "height": 6,
      "properties": {
        "metrics": [
          [ "Bedrock/AI/Performance", "CacheHitRate" ]
        ],
        "period": 300,
        "stat": "Average",
        "region": "$AWS_REGION",
        "title": "Cache Hit Rate",
        "yAxis": {
          "left": {
            "min": 0,
            "max": 1
          }
        }
      }
    },
    {
      "type": "metric",
      "x": 8,
      "y": 6,
      "width": 8,
      "height": 6,
      "properties": {
        "metrics": [
          [ "Bedrock/AI/Performance", "TokenUsage", "Operation", "vc-analysis" ],
          [ ".", ".", ".", "content-generation" ],
          [ ".", ".", ".", "business-framework" ]
        ],
        "period": 300,
        "stat": "Sum",
        "region": "$AWS_REGION",
        "title": "Token Usage by Operation"
      }
    },
    {
      "type": "metric",
      "x": 16,
      "y": 6,
      "width": 8,
      "height": 6,
      "properties": {
        "metrics": [
          [ "AWS/DynamoDB", "ConsumedReadCapacityUnits", "TableName", "$QUEUE_TABLE_NAME" ],
          [ ".", "ConsumedWriteCapacityUnits", ".", "." ],
          [ ".", "ConsumedReadCapacityUnits", ".", "$CACHE_TABLE_NAME" ],
          [ ".", "ConsumedWriteCapacityUnits", ".", "." ]
        ],
        "period": 300,
        "stat": "Sum",
        "region": "$AWS_REGION",
        "title": "DynamoDB Capacity Usage"
      }
    }
  ]
}
EOF
)

aws cloudwatch put-dashboard \
  --dashboard-name "${PROJECT_NAME}-performance-${ENVIRONMENT}" \
  --dashboard-body "$DASHBOARD_BODY" \
  --region "$AWS_REGION"

echo "✅ CloudWatch dashboard created"

# Create IAM policy for Lambda functions
echo "🔐 Creating IAM policy for performance system..."
POLICY_DOCUMENT=$(cat <<EOF
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
        "dynamodb:Scan"
      ],
      "Resource": [
        "arn:aws:dynamodb:$AWS_REGION:*:table/$QUEUE_TABLE_NAME",
        "arn:aws:dynamodb:$AWS_REGION:*:table/$QUEUE_TABLE_NAME/index/*",
        "arn:aws:dynamodb:$AWS_REGION:*:table/$CACHE_TABLE_NAME",
        "arn:aws:dynamodb:$AWS_REGION:*:table/$CACHE_TABLE_NAME/index/*",
        "arn:aws:dynamodb:$AWS_REGION:*:table/$METRICS_TABLE_NAME",
        "arn:aws:dynamodb:$AWS_REGION:*:table/$METRICS_TABLE_NAME/index/*"
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
        "sns:Publish"
      ],
      "Resource": "$ALERT_TOPIC_ARN"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:$AWS_REGION:*:*"
    }
  ]
}
EOF
)

POLICY_ARN=$(aws iam create-policy \
  --policy-name "${PROJECT_NAME}-performance-policy-${ENVIRONMENT}" \
  --policy-document "$POLICY_DOCUMENT" \
  --description "Policy for Bedrock AI Performance & Reliability system" \
  --output text --query 'Policy.Arn' \
  || aws iam get-policy \
    --policy-arn "arn:aws:iam::$(aws sts get-caller-identity --output text --query Account):policy/${PROJECT_NAME}-performance-policy-${ENVIRONMENT}" \
    --output text --query 'Policy.Arn')

echo "✅ IAM policy created: $POLICY_ARN"

# Output environment variables for Lambda functions
echo ""
echo "🔧 Environment variables for Lambda functions:"
echo "export BEDROCK_QUEUE_TABLE=$QUEUE_TABLE_NAME"
echo "export BEDROCK_CACHE_TABLE=$CACHE_TABLE_NAME"
echo "export BEDROCK_METRICS_TABLE=$METRICS_TABLE_NAME"
echo "export BEDROCK_ALERT_TOPIC_ARN=$ALERT_TOPIC_ARN"
echo "export BEDROCK_PERFORMANCE_POLICY_ARN=$POLICY_ARN"
echo ""

# Create environment file
ENV_FILE="performance-reliability.env"
cat > "$ENV_FILE" <<EOF
# Bedrock AI Performance & Reliability Environment Variables
BEDROCK_QUEUE_TABLE=$QUEUE_TABLE_NAME
BEDROCK_CACHE_TABLE=$CACHE_TABLE_NAME
BEDROCK_METRICS_TABLE=$METRICS_TABLE_NAME
BEDROCK_ALERT_TOPIC_ARN=$ALERT_TOPIC_ARN
BEDROCK_PERFORMANCE_POLICY_ARN=$POLICY_ARN

# Performance Configuration
ENABLE_PERFORMANCE_MONITORING=true
ENABLE_REQUEST_QUEUING=true
ENABLE_RESPONSE_CACHING=true
ENABLE_GRACEFUL_DEGRADATION=true
MAX_RESPONSE_TIME_MS=30000
QUEUE_THRESHOLD=50
CACHE_DEFAULT_TTL_HOURS=24
MAX_QUEUE_SIZE=500
MAX_CONCURRENT_REQUESTS=10
DEFAULT_TIMEOUT_MS=45000
MAX_RETRIES=3
MAX_FAILURE_RATE=0.1
FAILURE_WINDOW_MS=300000
CIRCUIT_BREAKER_THRESHOLD=5
ENABLE_CACHE_COMPRESSION=true
MAX_CACHE_SIZE=10000
EOF

echo "📄 Environment variables saved to: $ENV_FILE"

# Test the infrastructure
echo "🧪 Testing infrastructure..."

# Test SNS topic
aws sns publish \
  --topic-arn "$ALERT_TOPIC_ARN" \
  --message "Test message from performance infrastructure deployment" \
  --subject "Infrastructure Test" \
  --region "$AWS_REGION" > /dev/null

echo "✅ SNS topic test successful"

# Test DynamoDB tables
aws dynamodb describe-table --table-name "$QUEUE_TABLE_NAME" --region "$AWS_REGION" > /dev/null
aws dynamodb describe-table --table-name "$CACHE_TABLE_NAME" --region "$AWS_REGION" > /dev/null
aws dynamodb describe-table --table-name "$METRICS_TABLE_NAME" --region "$AWS_REGION" > /dev/null

echo "✅ DynamoDB tables test successful"

echo ""
echo "🎉 Performance & Reliability Infrastructure Deployment Complete!"
echo ""
echo "📋 Summary:"
echo "  ✅ SNS Alert Topic: $ALERT_TOPIC_ARN"
echo "  ✅ Request Queue Table: $QUEUE_TABLE_NAME"
echo "  ✅ Response Cache Table: $CACHE_TABLE_NAME"
echo "  ✅ Performance Metrics Table: $METRICS_TABLE_NAME"
echo "  ✅ CloudWatch Alarms: 4 alarms created"
echo "  ✅ CloudWatch Dashboard: ${PROJECT_NAME}-performance-${ENVIRONMENT}"
echo "  ✅ IAM Policy: $POLICY_ARN"
echo "  ✅ Environment File: $ENV_FILE"
echo ""
echo "🔗 Next Steps:"
echo "  1. Source the environment file: source $ENV_FILE"
echo "  2. Update Lambda function environment variables"
echo "  3. Deploy Lambda functions with the new policy"
echo "  4. Subscribe to SNS alerts (email/Slack)"
echo "  5. Monitor CloudWatch dashboard"
echo ""
echo "📊 CloudWatch Dashboard URL:"
echo "  https://$AWS_REGION.console.aws.amazon.com/cloudwatch/home?region=$AWS_REGION#dashboards:name=${PROJECT_NAME}-performance-${ENVIRONMENT}"