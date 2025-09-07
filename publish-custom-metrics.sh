#!/bin/bash

# Custom metrics publisher for matbakh business KPIs
# Run this script periodically (e.g., via cron) to publish business metrics

REGION="${AWS_REGION:-eu-central-1}"
PROFILE="${AWS_PROFILE:-matbakh-dev}"
NAMESPACE="matbakh/business"

# Example: Database health check
DB_HEALTH=$(curl -s https://your-api-gateway-url/health | jq -r '.success' 2>/dev/null || echo "false")

if [ "$DB_HEALTH" = "true" ]; then
  aws cloudwatch put-metric-data \
    --namespace "$NAMESPACE" \
    --metric-data MetricName=DatabaseHealth,Value=1,Unit=Count \
    --region "$REGION" \
    --profile "$PROFILE"
else
  aws cloudwatch put-metric-data \
    --namespace "$NAMESPACE" \
    --metric-data MetricName=DatabaseHealth,Value=0,Unit=Count \
    --region "$REGION" \
    --profile "$PROFILE"
fi

echo "Custom metrics published at $(date)"
