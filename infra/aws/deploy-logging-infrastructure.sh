#!/bin/bash

# Deploy Logging Infrastructure for Bedrock AI Core
# Creates DynamoDB tables, CloudWatch log groups, and S3 buckets for logging system

set -e

echo "🚀 Deploying Bedrock AI Core Logging Infrastructure..."

# Configuration
AWS_REGION=${AWS_REGION:-eu-central-1}
ENVIRONMENT=${ENVIRONMENT:-production}
PROJECT_NAME="matbakh-bedrock"

# DynamoDB Table Names
BEDROCK_LOGS_TABLE="${PROJECT_NAME}-agent-logs-${ENVIRONMENT}"
AUDIT_TRAIL_TABLE="${PROJECT_NAME}-audit-trail-${ENVIRONMENT}"

# CloudWatch Log Groups
BEDROCK_LOG_GROUP="/aws/lambda/bedrock-agent"
WEB_PROXY_LOG_GROUP="/aws/lambda/web-proxy"

# S3 Buckets for archiving
AI_LOGS_ARCHIVE_BUCKET="${PROJECT_NAME}-ai-logs-archive-${ENVIRONMENT}"
AUDIT_ARCHIVE_BUCKET="${PROJECT_NAME}-audit-archive-${ENVIRONMENT}"
SYSTEM_LOGS_ARCHIVE_BUCKET="${PROJECT_NAME}-system-logs-archive-${ENVIRONMENT}"

echo "📊 Creating DynamoDB Tables..."

# Create Bedrock Agent Logs Table
echo "Creating ${BEDROCK_LOGS_TABLE} table..."
aws dynamodb create-table \
  --region ${AWS_REGION} \
  --table-name ${BEDROCK_LOGS_TABLE} \
  --attribute-definitions \
    AttributeName=operation_id,AttributeType=S \
    AttributeName=timestamp,AttributeType=S \
    AttributeName=operation_type,AttributeType=S \
  --key-schema \
    AttributeName=operation_id,KeyType=HASH \
    AttributeName=timestamp,KeyType=RANGE \
  --global-secondary-indexes \
    IndexName=OperationTypeIndex,KeySchema=[{AttributeName=operation_type,KeyType=HASH},{AttributeName=timestamp,KeyType=RANGE}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5} \
  --provisioned-throughput \
    ReadCapacityUnits=10,WriteCapacityUnits=10 \
  --tags \
    Key=Environment,Value=${ENVIRONMENT} \
    Key=Project,Value=${PROJECT_NAME} \
    Key=Purpose,Value=AILogging \
  --stream-specification \
    StreamEnabled=true,StreamViewType=NEW_AND_OLD_IMAGES \
  || echo "Table ${BEDROCK_LOGS_TABLE} already exists"

# Enable TTL on bedrock logs table
echo "Enabling TTL on ${BEDROCK_LOGS_TABLE}..."
aws dynamodb update-time-to-live \
  --region ${AWS_REGION} \
  --table-name ${BEDROCK_LOGS_TABLE} \
  --time-to-live-specification \
    Enabled=true,AttributeName=ttl \
  || echo "TTL already enabled"

# Create Audit Trail Table
echo "Creating ${AUDIT_TRAIL_TABLE} table..."
aws dynamodb create-table \
  --region ${AWS_REGION} \
  --table-name ${AUDIT_TRAIL_TABLE} \
  --attribute-definitions \
    AttributeName=audit_id,AttributeType=S \
    AttributeName=timestamp,AttributeType=S \
    AttributeName=event_type,AttributeType=S \
    AttributeName=actor_id,AttributeType=S \
  --key-schema \
    AttributeName=audit_id,KeyType=HASH \
  --global-secondary-indexes \
    IndexName=EventTypeIndex,KeySchema=[{AttributeName=event_type,KeyType=HASH},{AttributeName=timestamp,KeyType=RANGE}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5} \
    IndexName=ActorIndex,KeySchema=[{AttributeName=actor_id,KeyType=HASH},{AttributeName=timestamp,KeyType=RANGE}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5} \
  --provisioned-throughput \
    ReadCapacityUnits=10,WriteCapacityUnits=10 \
  --tags \
    Key=Environment,Value=${ENVIRONMENT} \
    Key=Project,Value=${PROJECT_NAME} \
    Key=Purpose,Value=AuditTrail \
  --stream-specification \
    StreamEnabled=true,StreamViewType=NEW_AND_OLD_IMAGES \
  || echo "Table ${AUDIT_TRAIL_TABLE} already exists"

# Enable TTL on audit trail table (7 years for GDPR compliance)
echo "Enabling TTL on ${AUDIT_TRAIL_TABLE}..."
aws dynamodb update-time-to-live \
  --region ${AWS_REGION} \
  --table-name ${AUDIT_TRAIL_TABLE} \
  --time-to-live-specification \
    Enabled=true,AttributeName=ttl \
  || echo "TTL already enabled"

echo "📝 Creating CloudWatch Log Groups..."

# Create CloudWatch Log Groups
aws logs create-log-group \
  --region ${AWS_REGION} \
  --log-group-name ${BEDROCK_LOG_GROUP} \
  --tags \
    Environment=${ENVIRONMENT},Project=${PROJECT_NAME},Purpose=BedrockAgent \
  || echo "Log group ${BEDROCK_LOG_GROUP} already exists"

aws logs create-log-group \
  --region ${AWS_REGION} \
  --log-group-name ${WEB_PROXY_LOG_GROUP} \
  --tags \
    Environment=${ENVIRONMENT},Project=${PROJECT_NAME},Purpose=WebProxy \
  || echo "Log group ${WEB_PROXY_LOG_GROUP} already exists"

# Set retention policies
echo "Setting log retention policies..."
aws logs put-retention-policy \
  --region ${AWS_REGION} \
  --log-group-name ${BEDROCK_LOG_GROUP} \
  --retention-in-days 365

aws logs put-retention-policy \
  --region ${AWS_REGION} \
  --log-group-name ${WEB_PROXY_LOG_GROUP} \
  --retention-in-days 180

echo "🗄️ Creating S3 Archive Buckets..."

# Create S3 buckets for log archiving
for BUCKET in ${AI_LOGS_ARCHIVE_BUCKET} ${AUDIT_ARCHIVE_BUCKET} ${SYSTEM_LOGS_ARCHIVE_BUCKET}; do
  echo "Creating bucket: ${BUCKET}"
  
  aws s3 mb s3://${BUCKET} --region ${AWS_REGION} || echo "Bucket ${BUCKET} already exists"
  
  # Enable versioning
  aws s3api put-bucket-versioning \
    --bucket ${BUCKET} \
    --versioning-configuration Status=Enabled
  
  # Enable server-side encryption
  aws s3api put-bucket-encryption \
    --bucket ${BUCKET} \
    --server-side-encryption-configuration '{
      "Rules": [
        {
          "ApplyServerSideEncryptionByDefault": {
            "SSEAlgorithm": "AES256"
          },
          "BucketKeyEnabled": true
        }
      ]
    }'
  
  # Set lifecycle policy for cost optimization
  aws s3api put-bucket-lifecycle-configuration \
    --bucket ${BUCKET} \
    --lifecycle-configuration '{
      "Rules": [
        {
          "ID": "ArchiveOldLogs",
          "Status": "Enabled",
          "Filter": {"Prefix": ""},
          "Transitions": [
            {
              "Days": 30,
              "StorageClass": "STANDARD_IA"
            },
            {
              "Days": 90,
              "StorageClass": "GLACIER"
            },
            {
              "Days": 365,
              "StorageClass": "DEEP_ARCHIVE"
            }
          ]
        }
      ]
    }'
  
  # Block public access
  aws s3api put-public-access-block \
    --bucket ${BUCKET} \
    --public-access-block-configuration \
      BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
  
  # Add bucket tags
  aws s3api put-bucket-tagging \
    --bucket ${BUCKET} \
    --tagging 'TagSet=[
      {Key=Environment,Value='${ENVIRONMENT}'},
      {Key=Project,Value='${PROJECT_NAME}'},
      {Key=Purpose,Value=LogArchive}
    ]'
done

echo "🔐 Creating IAM Roles and Policies..."

# Create IAM policy for logging system
cat > /tmp/bedrock-logging-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:Query",
        "dynamodb:Scan",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem"
      ],
      "Resource": [
        "arn:aws:dynamodb:${AWS_REGION}:*:table/${BEDROCK_LOGS_TABLE}",
        "arn:aws:dynamodb:${AWS_REGION}:*:table/${BEDROCK_LOGS_TABLE}/index/*",
        "arn:aws:dynamodb:${AWS_REGION}:*:table/${AUDIT_TRAIL_TABLE}",
        "arn:aws:dynamodb:${AWS_REGION}:*:table/${AUDIT_TRAIL_TABLE}/index/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "logs:DescribeLogGroups",
        "logs:DescribeLogStreams"
      ],
      "Resource": [
        "arn:aws:logs:${AWS_REGION}:*:log-group:${BEDROCK_LOG_GROUP}*",
        "arn:aws:logs:${AWS_REGION}:*:log-group:${WEB_PROXY_LOG_GROUP}*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:ListBucket",
        "s3:DeleteObject"
      ],
      "Resource": [
        "arn:aws:s3:::${AI_LOGS_ARCHIVE_BUCKET}",
        "arn:aws:s3:::${AI_LOGS_ARCHIVE_BUCKET}/*",
        "arn:aws:s3:::${AUDIT_ARCHIVE_BUCKET}",
        "arn:aws:s3:::${AUDIT_ARCHIVE_BUCKET}/*",
        "arn:aws:s3:::${SYSTEM_LOGS_ARCHIVE_BUCKET}",
        "arn:aws:s3:::${SYSTEM_LOGS_ARCHIVE_BUCKET}/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "rds:DescribeDBInstances",
        "rds:DescribeDBClusters"
      ],
      "Resource": "*"
    }
  ]
}
EOF

# Create the policy
aws iam create-policy \
  --policy-name BedrockLoggingSystemPolicy \
  --policy-document file:///tmp/bedrock-logging-policy.json \
  --description "Policy for Bedrock AI Core logging system" \
  || echo "Policy already exists"

echo "📊 Creating CloudWatch Dashboard..."

# Create CloudWatch Dashboard for monitoring
cat > /tmp/bedrock-dashboard.json << EOF
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
          [ "AWS/DynamoDB", "ConsumedReadCapacityUnits", "TableName", "${BEDROCK_LOGS_TABLE}" ],
          [ ".", "ConsumedWriteCapacityUnits", ".", "." ],
          [ ".", "ConsumedReadCapacityUnits", "TableName", "${AUDIT_TRAIL_TABLE}" ],
          [ ".", "ConsumedWriteCapacityUnits", ".", "." ]
        ],
        "view": "timeSeries",
        "stacked": false,
        "region": "${AWS_REGION}",
        "title": "DynamoDB Capacity Usage",
        "period": 300
      }
    },
    {
      "type": "log",
      "x": 0,
      "y": 6,
      "width": 24,
      "height": 6,
      "properties": {
        "query": "SOURCE '${BEDROCK_LOG_GROUP}'\n| fields @timestamp, @message\n| filter @message like /ERROR/\n| sort @timestamp desc\n| limit 100",
        "region": "${AWS_REGION}",
        "title": "Recent Errors",
        "view": "table"
      }
    }
  ]
}
EOF

aws cloudwatch put-dashboard \
  --dashboard-name "BedrockAICore-Logging" \
  --dashboard-body file:///tmp/bedrock-dashboard.json

echo "🔔 Setting up CloudWatch Alarms..."

# Create alarms for monitoring
aws cloudwatch put-metric-alarm \
  --alarm-name "BedrockLogs-HighErrorRate" \
  --alarm-description "High error rate in Bedrock logging system" \
  --metric-name "Errors" \
  --namespace "AWS/Lambda" \
  --statistic "Sum" \
  --period 300 \
  --threshold 10 \
  --comparison-operator "GreaterThanThreshold" \
  --evaluation-periods 2 \
  --dimensions Name=FunctionName,Value=bedrock-agent

aws cloudwatch put-metric-alarm \
  --alarm-name "BedrockLogs-DynamoDBThrottling" \
  --alarm-description "DynamoDB throttling on logging tables" \
  --metric-name "ThrottledRequests" \
  --namespace "AWS/DynamoDB" \
  --statistic "Sum" \
  --period 300 \
  --threshold 1 \
  --comparison-operator "GreaterThanThreshold" \
  --evaluation-periods 1 \
  --dimensions Name=TableName,Value=${BEDROCK_LOGS_TABLE}

echo "🧹 Cleanup temporary files..."
rm -f /tmp/bedrock-logging-policy.json /tmp/bedrock-dashboard.json

echo "✅ Logging Infrastructure Deployment Complete!"
echo ""
echo "📋 Summary:"
echo "  DynamoDB Tables:"
echo "    - ${BEDROCK_LOGS_TABLE}"
echo "    - ${AUDIT_TRAIL_TABLE}"
echo ""
echo "  CloudWatch Log Groups:"
echo "    - ${BEDROCK_LOG_GROUP}"
echo "    - ${WEB_PROXY_LOG_GROUP}"
echo ""
echo "  S3 Archive Buckets:"
echo "    - ${AI_LOGS_ARCHIVE_BUCKET}"
echo "    - ${AUDIT_ARCHIVE_BUCKET}"
echo "    - ${SYSTEM_LOGS_ARCHIVE_BUCKET}"
echo ""
echo "  Environment Variables to set:"
echo "    BEDROCK_LOGS_TABLE=${BEDROCK_LOGS_TABLE}"
echo "    AUDIT_TRAIL_TABLE=${AUDIT_TRAIL_TABLE}"
echo "    BEDROCK_LOG_GROUP=${BEDROCK_LOG_GROUP}"
echo "    AI_LOGS_ARCHIVE_BUCKET=${AI_LOGS_ARCHIVE_BUCKET}"
echo "    AUDIT_ARCHIVE_BUCKET=${AUDIT_ARCHIVE_BUCKET}"
echo ""
echo "🎯 Next Steps:"
echo "  1. Update Lambda environment variables"
echo "  2. Deploy updated Lambda functions"
echo "  3. Test logging system with sample operations"
echo "  4. Configure log retention cleanup schedule"