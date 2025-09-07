#!/bin/bash

# Deploy CloudWatch Monitoring for Bedrock AI
# This script sets up comprehensive monitoring, alarms, and dashboards

set -e

# Configuration
REGION=${AWS_REGION:-eu-central-1}
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
SNS_TOPIC_NAME="bedrock-ai-alerts"

echo "📊 Deploying CloudWatch Monitoring for Bedrock AI..."
echo "Account ID: $ACCOUNT_ID"
echo "Region: $REGION"

# Create SNS topic for alerts
echo "📧 Creating SNS topic for alerts..."
SNS_TOPIC_ARN=$(aws sns create-topic \
  --name "$SNS_TOPIC_NAME" \
  --region "$REGION" \
  --query 'TopicArn' \
  --output text)

echo "✅ SNS topic created: $SNS_TOPIC_ARN"

# Create CloudWatch log groups with retention
echo "📝 Creating CloudWatch log groups..."
for function_name in "bedrock-agent" "web-proxy"; do
  aws logs create-log-group \
    --log-group-name "/aws/lambda/$function_name" \
    --region "$REGION" \
    || echo "Log group /aws/lambda/$function_name already exists"
  
  # Set retention policy
  aws logs put-retention-policy \
    --log-group-name "/aws/lambda/$function_name" \
    --retention-in-days 30 \
    --region "$REGION"
  
  echo "✅ Log group configured: /aws/lambda/$function_name (30 days retention)"
done

# Create custom metrics namespace
echo "📈 Setting up custom metrics..."
aws cloudwatch put-metric-data \
  --namespace "MatbakhAI" \
  --metric-data MetricName=ServiceInitialized,Value=1,Unit=Count \
  --region "$REGION"

# Create CloudWatch alarms
echo "🚨 Creating CloudWatch alarms..."

# 1. High error rate alarm
aws cloudwatch put-metric-alarm \
  --alarm-name "BedrockAgent-HighErrorRate" \
  --alarm-description "Bedrock Agent error rate is too high" \
  --metric-name "Errors" \
  --namespace "AWS/Lambda" \
  --statistic "Sum" \
  --period 300 \
  --threshold 10 \
  --comparison-operator "GreaterThanThreshold" \
  --dimensions Name=FunctionName,Value=bedrock-agent \
  --evaluation-periods 2 \
  --alarm-actions "$SNS_TOPIC_ARN" \
  --treat-missing-data "notBreaching" \
  --region "$REGION"

# 2. High duration alarm
aws cloudwatch put-metric-alarm \
  --alarm-name "BedrockAgent-HighDuration" \
  --alarm-description "Bedrock Agent duration is too high" \
  --metric-name "Duration" \
  --namespace "AWS/Lambda" \
  --statistic "Average" \
  --period 300 \
  --threshold 25000 \
  --comparison-operator "GreaterThanThreshold" \
  --dimensions Name=FunctionName,Value=bedrock-agent \
  --evaluation-periods 3 \
  --alarm-actions "$SNS_TOPIC_ARN" \
  --treat-missing-data "notBreaching" \
  --region "$REGION"

# 3. Throttling alarm
aws cloudwatch put-metric-alarm \
  --alarm-name "BedrockAgent-Throttles" \
  --alarm-description "Bedrock Agent is being throttled" \
  --metric-name "Throttles" \
  --namespace "AWS/Lambda" \
  --statistic "Sum" \
  --period 300 \
  --threshold 1 \
  --comparison-operator "GreaterThanOrEqualToThreshold" \
  --dimensions Name=FunctionName,Value=bedrock-agent \
  --evaluation-periods 1 \
  --alarm-actions "$SNS_TOPIC_ARN" \
  --treat-missing-data "notBreaching" \
  --region "$REGION"

# 4. Cost alarm (estimated)
aws cloudwatch put-metric-alarm \
  --alarm-name "BedrockAgent-HighCost" \
  --alarm-description "Bedrock AI costs are high" \
  --metric-name "EstimatedCost" \
  --namespace "MatbakhAI" \
  --statistic "Sum" \
  --period 3600 \
  --threshold 50 \
  --comparison-operator "GreaterThanThreshold" \
  --evaluation-periods 1 \
  --alarm-actions "$SNS_TOPIC_ARN" \
  --treat-missing-data "notBreaching" \
  --region "$REGION"

# 5. Circuit breaker alarm
aws cloudwatch put-metric-alarm \
  --alarm-name "BedrockAgent-CircuitBreakerOpen" \
  --alarm-description "Circuit breaker is open" \
  --metric-name "CircuitBreakerOpen" \
  --namespace "MatbakhAI" \
  --statistic "Maximum" \
  --period 300 \
  --threshold 1 \
  --comparison-operator "GreaterThanOrEqualToThreshold" \
  --evaluation-periods 1 \
  --alarm-actions "$SNS_TOPIC_ARN" \
  --treat-missing-data "notBreaching" \
  --region "$REGION"

echo "✅ CloudWatch alarms created"

# Create CloudWatch dashboard
echo "📊 Creating CloudWatch dashboard..."
cat > /tmp/dashboard-body.json << EOF
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
          [ "AWS/Lambda", "Invocations", "FunctionName", "bedrock-agent" ],
          [ ".", "Errors", ".", "." ],
          [ ".", "Duration", ".", "." ]
        ],
        "view": "timeSeries",
        "stacked": false,
        "region": "$REGION",
        "title": "Bedrock Agent - Invocations, Errors, Duration",
        "period": 300
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
          [ "MatbakhAI", "TokenUsage", "RequestType", "vc_analysis" ],
          [ "...", "content_generation" ],
          [ "...", "persona_detection" ],
          [ "...", "text_rewrite" ]
        ],
        "view": "timeSeries",
        "stacked": true,
        "region": "$REGION",
        "title": "AI Token Usage by Request Type",
        "period": 300
      }
    },
    {
      "type": "metric",
      "x": 0,
      "y": 6,
      "width": 12,
      "height": 6,
      "properties": {
        "metrics": [
          [ "MatbakhAI", "EstimatedCost", "Service", "bedrock" ],
          [ "MatbakhAI", "PIIDetected", ".", "." ],
          [ "MatbakhAI", "CircuitBreakerOpen", ".", "." ]
        ],
        "view": "timeSeries",
        "stacked": false,
        "region": "$REGION",
        "title": "AI Service Metrics - Cost, PII, Circuit Breaker",
        "period": 300
      }
    },
    {
      "type": "log",
      "x": 12,
      "y": 6,
      "width": 12,
      "height": 6,
      "properties": {
        "query": "SOURCE '/aws/lambda/bedrock-agent'\n| fields @timestamp, @message\n| filter @message like /ERROR/\n| sort @timestamp desc\n| limit 20",
        "region": "$REGION",
        "title": "Recent Errors",
        "view": "table"
      }
    }
  ]
}
EOF

aws cloudwatch put-dashboard \
  --dashboard-name "BedrockAI-Monitoring" \
  --dashboard-body file:///tmp/dashboard-body.json \
  --region "$REGION"

echo "✅ CloudWatch dashboard created: BedrockAI-Monitoring"

# Create budget for cost monitoring
echo "💰 Creating AWS Budget for cost monitoring..."
cat > /tmp/budget.json << EOF
{
  "BudgetName": "BedrockAI-Monthly-Budget",
  "BudgetLimit": {
    "Amount": "100.00",
    "Unit": "USD"
  },
  "TimeUnit": "MONTHLY",
  "BudgetType": "COST",
  "CostFilters": {
    "TagKey": ["Project"],
    "TagValue": ["matbakh-bedrock"]
  }
}
EOF

cat > /tmp/notifications.json << EOF
[
  {
    "Notification": {
      "NotificationType": "ACTUAL",
      "ComparisonOperator": "GREATER_THAN",
      "Threshold": 80
    },
    "Subscribers": [
      {
        "SubscriptionType": "SNS",
        "Address": "$SNS_TOPIC_ARN"
      }
    ]
  },
  {
    "Notification": {
      "NotificationType": "FORECASTED",
      "ComparisonOperator": "GREATER_THAN",
      "Threshold": 100
    },
    "Subscribers": [
      {
        "SubscriptionType": "SNS",
        "Address": "$SNS_TOPIC_ARN"
      }
    ]
  }
]
EOF

aws budgets create-budget \
  --account-id "$ACCOUNT_ID" \
  --budget file:///tmp/budget.json \
  --notifications-with-subscribers file:///tmp/notifications.json \
  --region us-east-1 \
  || echo "Budget may already exist"

echo "✅ AWS Budget created for cost monitoring"

# Create X-Ray tracing configuration
echo "🔍 Enabling X-Ray tracing..."
for function_name in "bedrock-agent" "web-proxy"; do
  aws lambda put-function-configuration \
    --function-name "$function_name" \
    --tracing-config Mode=Active \
    --region "$REGION" \
    || echo "Failed to enable X-Ray for $function_name"
done

echo "✅ X-Ray tracing enabled"

# Clean up temporary files
rm -f /tmp/dashboard-body.json /tmp/budget.json /tmp/notifications.json

echo ""
echo "✅ CloudWatch Monitoring deployment completed successfully!"
echo ""
echo "Resources created:"
echo "- SNS Topic: $SNS_TOPIC_ARN"
echo "- CloudWatch Alarms: 5 alarms for error rate, duration, throttling, cost, and circuit breaker"
echo "- CloudWatch Dashboard: BedrockAI-Monitoring"
echo "- AWS Budget: BedrockAI-Monthly-Budget (\$100/month)"
echo "- X-Ray Tracing: Enabled for Lambda functions"
echo "- Log Retention: 30 days for all Lambda logs"
echo ""
echo "Next steps:"
echo "1. Subscribe to SNS topic for alert notifications"
echo "2. Customize alarm thresholds based on usage patterns"
echo "3. Review dashboard and add custom metrics as needed"
echo "4. Test alerts by triggering error conditions"
echo ""
echo "Dashboard URL: https://$REGION.console.aws.amazon.com/cloudwatch/home?region=$REGION#dashboards:name=BedrockAI-Monitoring"