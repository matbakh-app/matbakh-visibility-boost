# S3 File Storage - Operational Guide

## Overview

This document provides comprehensive operational guidance for the AWS S3 file storage system that replaced Supabase Storage. It covers bucket structure, policies, monitoring, troubleshooting, and maintenance procedures.

## Table of Contents

1. [S3 Bucket Structure](#s3-bucket-structure)
2. [Security Policies](#security-policies)
3. [Monitoring and Alerts](#monitoring-and-alerts)
4. [Troubleshooting Guide](#troubleshooting-guide)
5. [Backup and Recovery](#backup-and-recovery)
6. [Maintenance Procedures](#maintenance-procedures)
7. [Performance Optimization](#performance-optimization)
8. [Cost Management](#cost-management)

## S3 Bucket Structure

### Bucket Overview

| Bucket Name | Purpose | Access Level | Lifecycle | CDN |
|-------------|---------|--------------|-----------|-----|
| `matbakh-files-uploads` | User uploads, AI content | Private | Permanent | No |
| `matbakh-files-profile` | Avatars, logos, CM images | Semi-public | Permanent | No |
| `matbakh-files-reports` | VC reports, PDFs, snapshots | Public via link | 30 days | Yes |

### Folder Structure

#### matbakh-files-uploads
```
matbakh-files-uploads/
├── user-uploads/{user_id}/
│   ├── documents/
│   ├── images/
│   └── temp/
├── ai-generated/{type}/
│   ├── reports/
│   ├── content/
│   └── images/
└── temp/{session_id}/          # Auto-deleted after 7 days
```

#### matbakh-files-profile
```
matbakh-files-profile/
├── avatars/{user_id}/
│   ├── original/
│   ├── thumbnail/
│   └── compressed/
├── logos/{partner_id}/
│   ├── original/
│   ├── variants/
│   └── thumbnails/
├── cm-images/{category}/
└── temp/                       # Auto-deleted after 7 days
```

#### matbakh-files-reports
```
matbakh-files-reports/
├── vc-reports/{lead_id}/
│   ├── full-report.pdf
│   ├── summary.json
│   └── assets/
├── pdf-exports/{report_id}/
├── snapshots/{timestamp}/
└── tmp/{temp_id}/              # Auto-deleted after 7 days
```

### Bucket Configuration

#### Encryption
- **Type**: Server-side encryption with S3-managed keys (SSE-S3)
- **Algorithm**: AES-256
- **Status**: Enabled for all buckets

#### Versioning
- **uploads**: Disabled (can be enabled for advanced features)
- **profile**: Disabled
- **reports**: Disabled (files are temporary)

#### Public Access Block
- **uploads**: All public access blocked
- **profile**: All public access blocked
- **reports**: All public access blocked (access via CloudFront only)

## Security Policies

### IAM Policies

#### Lambda Execution Role Policy
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:PutObjectAcl",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": [
        "arn:aws:s3:::matbakh-files-uploads/*",
        "arn:aws:s3:::matbakh-files-profile/*",
        "arn:aws:s3:::matbakh-files-reports/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": ["s3:ListBucket"],
      "Resource": [
        "arn:aws:s3:::matbakh-files-uploads",
        "arn:aws:s3:::matbakh-files-profile",
        "arn:aws:s3:::matbakh-files-reports"
      ]
    }
  ]
}
```

#### Bucket Policies
All buckets enforce HTTPS-only access:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyInsecureTransport",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:*",
      "Resource": [
        "arn:aws:s3:::BUCKET_NAME",
        "arn:aws:s3:::BUCKET_NAME/*"
      ],
      "Condition": {
        "Bool": {
          "aws:SecureTransport": "false"
        }
      }
    }
  ]
}
```

### CORS Configuration
```json
[
  {
    "AllowedOrigins": ["https://matbakh.app", "http://localhost:5173"],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3000,
    "ExposeHeaders": ["ETag", "x-amz-meta-*"]
  }
]
```

### Access Control

#### File Access Patterns
1. **Private Files** (uploads): Access via presigned URLs only
2. **Profile Files**: Access via presigned URLs or CloudFront
3. **Public Reports**: Access via CloudFront distribution

#### Presigned URL Configuration
- **Upload URLs**: 15 minutes expiration
- **Download URLs**: 24 hours expiration
- **Signed with**: Lambda execution role credentials

## Monitoring and Alerts

### CloudWatch Metrics

#### S3 Metrics
- **BucketSizeBytes**: Storage usage per bucket
- **NumberOfObjects**: Object count per bucket
- **AllRequests**: Total requests per bucket
- **4xxErrors**: Client errors per bucket
- **5xxErrors**: Server errors per bucket

#### Lambda Metrics
- **Invocations**: Function invocation count
- **Errors**: Function error count
- **Duration**: Function execution time
- **Throttles**: Function throttling events

#### CloudFront Metrics
- **Requests**: Total requests to distribution
- **CacheHitRate**: Cache hit percentage
- **4xxErrorRate**: Client error rate
- **5xxErrorRate**: Server error rate

### Alerts Configuration

#### Critical Alerts (Immediate Response)
- **S3 5xx Errors**: > 5 errors in 5 minutes
- **Lambda Errors**: > 3 errors in 5 minutes
- **CloudFront 5xx Rate**: > 2% for 10 minutes

#### Warning Alerts (Monitor)
- **S3 4xx Errors**: > 10 errors in 5 minutes
- **Storage Size**: > 100GB for uploads bucket
- **Cache Hit Rate**: < 80% for 15 minutes
- **Lambda Duration**: > 10 seconds average

### Dashboard Access
- **URL**: https://eu-central-1.console.aws.amazon.com/cloudwatch/home?region=eu-central-1#dashboards:name=matbakh-s3-monitoring
- **Widgets**: S3 operations, errors, storage usage, CloudFront performance, Lambda metrics

## Troubleshooting Guide

### Common Issues

#### Upload Failures

**Symptom**: Users cannot upload files
**Possible Causes**:
1. Network connectivity issues
2. File size exceeds limits
3. Invalid file type
4. Authentication problems
5. S3 service issues

**Troubleshooting Steps**:
1. Check CloudWatch alarms for S3 errors
2. Verify Lambda function logs
3. Test presigned URL generation
4. Check user authentication status
5. Validate file against restrictions

**Resolution**:
```bash
# Check S3 bucket accessibility
aws s3 ls s3://matbakh-files-uploads/ --region eu-central-1

# Test Lambda function
aws lambda invoke --function-name matbakh-get-presigned-url \
  --payload '{"bucket":"matbakh-files-uploads","filename":"test.jpg","contentType":"image/jpeg"}' \
  response.json

# Check recent errors
aws logs filter-log-events --log-group-name /aws/lambda/matbakh-get-presigned-url \
  --start-time $(date -d '1 hour ago' +%s)000 \
  --filter-pattern 'ERROR'
```

#### Slow Upload Performance

**Symptom**: Uploads take longer than expected
**Possible Causes**:
1. Large file size without multipart upload
2. Network latency
3. Client-side compression issues
4. Lambda cold starts

**Troubleshooting Steps**:
1. Check file size and multipart threshold
2. Monitor Lambda duration metrics
3. Test from different locations
4. Check CloudFront cache performance

**Resolution**:
- Enable multipart upload for files > 5MB
- Optimize image compression settings
- Consider Lambda provisioned concurrency
- Review CloudFront caching policies

#### Access Denied Errors

**Symptom**: 403 Forbidden errors when accessing files
**Possible Causes**:
1. Expired presigned URLs
2. Incorrect IAM permissions
3. Bucket policy restrictions
4. CORS configuration issues

**Troubleshooting Steps**:
1. Verify presigned URL expiration
2. Check IAM role permissions
3. Review bucket policies
4. Test CORS configuration

**Resolution**:
```bash
# Check bucket policy
aws s3api get-bucket-policy --bucket matbakh-files-uploads

# Verify IAM permissions
aws iam get-role-policy --role-name lambda-execution-role --policy-name s3-access

# Test CORS
curl -H "Origin: https://matbakh.app" \
  -H "Access-Control-Request-Method: PUT" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -X OPTIONS https://matbakh-files-uploads.s3.eu-central-1.amazonaws.com/
```

#### CloudFront Issues

**Symptom**: Reports not loading or slow loading
**Possible Causes**:
1. CloudFront distribution issues
2. Origin access identity problems
3. Cache configuration issues
4. Geographic restrictions

**Troubleshooting Steps**:
1. Check distribution status
2. Verify origin access identity
3. Review cache behaviors
4. Test from different regions

**Resolution**:
```bash
# Check distribution status
aws cloudfront get-distribution --id E2W4JULEW8BXSD

# Create cache invalidation
aws cloudfront create-invalidation --distribution-id E2W4JULEW8BXSD --paths "/*"

# Check cache statistics
aws cloudwatch get-metric-statistics --namespace AWS/CloudFront \
  --metric-name CacheHitRate \
  --dimensions Name=DistributionId,Value=E2W4JULEW8BXSD \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 3600 --statistics Average
```

### Log Analysis

#### Lambda Logs
```bash
# View recent Lambda logs
aws logs describe-log-streams --log-group-name /aws/lambda/matbakh-get-presigned-url \
  --order-by LastEventTime --descending --max-items 5

# Search for specific errors
aws logs filter-log-events --log-group-name /aws/lambda/matbakh-get-presigned-url \
  --filter-pattern 'ERROR' --start-time $(date -d '1 hour ago' +%s)000
```

#### S3 Access Logs (if enabled)
```bash
# Download recent access logs
aws s3 sync s3://matbakh-access-logs/matbakh-files-uploads/ ./logs/ \
  --exclude "*" --include "$(date +%Y-%m-%d)*"

# Analyze error patterns
grep " 4[0-9][0-9] " ./logs/*.log | head -20
```

### Performance Monitoring

#### Key Metrics to Monitor
1. **Upload Success Rate**: Should be > 95%
2. **Average Upload Duration**: Should be < 30 seconds for files < 10MB
3. **Lambda Cold Start Rate**: Should be < 10%
4. **CloudFront Cache Hit Rate**: Should be > 80%

#### Performance Queries
```bash
# Get upload success rate
aws cloudwatch get-metric-statistics --namespace Matbakh/S3Upload \
  --metric-name UploadSuccess --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) --period 3600 --statistics Sum

# Get average upload duration
aws cloudwatch get-metric-statistics --namespace Matbakh/S3Upload \
  --metric-name UploadDuration --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) --period 3600 --statistics Average
```

## Backup and Recovery

### Backup Strategy

#### Cross-Region Replication (Optional)
For critical data, consider enabling cross-region replication:
```bash
# Enable versioning (required for replication)
aws s3api put-bucket-versioning --bucket matbakh-files-uploads \
  --versioning-configuration Status=Enabled

# Set up replication configuration
aws s3api put-bucket-replication --bucket matbakh-files-uploads \
  --replication-configuration file://replication-config.json
```

#### Point-in-Time Recovery
- **Versioning**: Can be enabled for critical buckets
- **MFA Delete**: Can be enabled for additional security
- **Lifecycle Policies**: Automatically manage old versions

### Recovery Procedures

#### Accidental Deletion Recovery
```bash
# List deleted objects (if versioning enabled)
aws s3api list-object-versions --bucket matbakh-files-uploads \
  --prefix "user-uploads/USER_ID/" --query 'DeleteMarkers[].{Key:Key,VersionId:VersionId}'

# Restore deleted object
aws s3api delete-object --bucket matbakh-files-uploads \
  --key "user-uploads/USER_ID/file.jpg" --version-id DELETE_MARKER_VERSION_ID
```

#### Corruption Recovery
```bash
# Verify object integrity
aws s3api head-object --bucket matbakh-files-uploads \
  --key "user-uploads/USER_ID/file.jpg" --checksum-mode ENABLED

# Re-upload from backup if available
aws s3 cp backup/file.jpg s3://matbakh-files-uploads/user-uploads/USER_ID/file.jpg
```

### Data Export

#### Full Bucket Export
```bash
# Export entire bucket
aws s3 sync s3://matbakh-files-uploads/ ./backup/uploads/ \
  --storage-class GLACIER --exclude "temp/*"

# Export with metadata
aws s3 cp s3://matbakh-files-uploads/ ./backup/uploads/ \
  --recursive --metadata-directive COPY
```

#### Selective Export
```bash
# Export user-specific data
aws s3 sync s3://matbakh-files-uploads/user-uploads/USER_ID/ \
  ./backup/user-data/USER_ID/

# Export by date range
aws s3 ls s3://matbakh-files-uploads/user-uploads/ --recursive \
  | awk '$1 >= "2024-01-01" && $1 <= "2024-12-31" {print $4}' \
  | xargs -I {} aws s3 cp s3://matbakh-files-uploads/{} ./backup/{}
```

## Maintenance Procedures

### Regular Maintenance Tasks

#### Daily Tasks
1. **Monitor Alerts**: Check CloudWatch alarms
2. **Review Logs**: Check for unusual error patterns
3. **Storage Usage**: Monitor bucket sizes
4. **Performance**: Check upload success rates

#### Weekly Tasks
1. **Cost Analysis**: Review S3 and CloudFront costs
2. **Security Review**: Check access patterns
3. **Cleanup**: Remove expired temporary files
4. **Performance Tuning**: Analyze slow uploads

#### Monthly Tasks
1. **Capacity Planning**: Project storage growth
2. **Security Audit**: Review IAM policies
3. **Disaster Recovery Test**: Test backup procedures
4. **Documentation Update**: Update operational procedures

### Automated Maintenance

#### Lifecycle Policies
```json
{
  "Rules": [
    {
      "ID": "temp-file-cleanup",
      "Status": "Enabled",
      "Filter": {"Prefix": "temp/"},
      "Expiration": {"Days": 7}
    },
    {
      "ID": "reports-cleanup",
      "Status": "Enabled",
      "Filter": {"Prefix": ""},
      "Expiration": {"Days": 30}
    },
    {
      "ID": "storage-optimization",
      "Status": "Enabled",
      "Transitions": [
        {
          "Days": 30,
          "StorageClass": "STANDARD_IA"
        },
        {
          "Days": 90,
          "StorageClass": "GLACIER"
        }
      ]
    }
  ]
}
```

#### Cleanup Scripts
```bash
#!/bin/bash
# cleanup-temp-files.sh - Remove expired temporary files

BUCKET="matbakh-files-uploads"
CUTOFF_DATE=$(date -d '7 days ago' +%Y-%m-%d)

# List and delete old temp files
aws s3api list-objects-v2 --bucket $BUCKET --prefix "temp/" \
  --query "Contents[?LastModified<='$CUTOFF_DATE'].Key" --output text \
  | xargs -I {} aws s3 rm s3://$BUCKET/{}

echo "Cleanup completed for files older than $CUTOFF_DATE"
```

### Update Procedures

#### Lambda Function Updates
```bash
# Update presigned URL function
cd infra/lambdas/s3-presigned-url
npm run build
aws lambda update-function-code --function-name matbakh-get-presigned-url \
  --zip-file fileb://dist/function.zip

# Update environment variables
aws lambda update-function-configuration --function-name matbakh-get-presigned-url \
  --environment Variables='{DB_SECRET_NAME=matbakh-db-postgres,NODE_ENV=production}'
```

#### Infrastructure Updates
```bash
# Update S3 stack
cd infra/aws
npm install
cdk deploy matbakh-s3-buckets --require-approval never

# Update monitoring stack
cdk deploy matbakh-s3-monitoring --require-approval never
```

## Performance Optimization

### Upload Performance

#### Multipart Upload Optimization
- **Threshold**: 5MB (configurable)
- **Part Size**: 5MB (optimal for most cases)
- **Concurrent Parts**: 3 (balance between speed and resource usage)

#### Image Compression
- **Max Width**: 1920px
- **Max Height**: 1080px
- **Quality**: 80% (balance between size and quality)
- **Format**: JPEG for photos, PNG for graphics

### CloudFront Optimization

#### Cache Behaviors
```json
{
  "/vc-reports/*": {
    "CachePolicyId": "optimized-caching",
    "TTL": 86400,
    "Compress": true
  },
  "/pdf-exports/*": {
    "CachePolicyId": "caching-disabled",
    "TTL": 0,
    "Compress": false
  }
}
```

#### Geographic Distribution
- **Price Class**: 100 (Europe and North America)
- **Edge Locations**: Optimized for German users
- **Origin Shield**: Consider enabling for high-traffic content

### Lambda Optimization

#### Memory and Timeout Settings
- **Presigned URL Function**: 256MB, 30s timeout
- **Upload Processor**: 512MB, 60s timeout
- **Provisioned Concurrency**: Consider for high-traffic periods

#### Cold Start Reduction
```javascript
// Keep connections warm
const s3Client = new S3Client({ region: 'eu-central-1' });
const dbConnection = createConnection();

// Reuse connections across invocations
exports.handler = async (event) => {
  // Handler logic
};
```

## Cost Management

### Cost Monitoring

#### S3 Storage Costs
- **Standard Storage**: $0.023 per GB/month
- **Infrequent Access**: $0.0125 per GB/month
- **Glacier**: $0.004 per GB/month

#### Request Costs
- **PUT/POST**: $0.005 per 1,000 requests
- **GET/HEAD**: $0.0004 per 1,000 requests
- **DELETE**: Free

#### Data Transfer Costs
- **CloudFront**: $0.085 per GB (first 10TB)
- **Direct S3**: $0.09 per GB

### Cost Optimization Strategies

#### Storage Class Optimization
```bash
# Analyze access patterns
aws s3api list-objects-v2 --bucket matbakh-files-uploads \
  --query 'Contents[?LastModified<=`2024-01-01`].[Key,Size,LastModified]' \
  --output table

# Transition to IA storage
aws s3api put-object --bucket matbakh-files-uploads --key old-file.jpg \
  --storage-class STANDARD_IA --metadata-directive COPY \
  --copy-source matbakh-files-uploads/old-file.jpg
```

#### Request Optimization
- **Batch Operations**: Use S3 batch operations for bulk changes
- **Intelligent Tiering**: Consider for unpredictable access patterns
- **Lifecycle Policies**: Automate storage class transitions

### Budget Alerts
```bash
# Set up budget alert
aws budgets create-budget --account-id ACCOUNT_ID \
  --budget '{
    "BudgetName": "S3-Storage-Budget",
    "BudgetLimit": {"Amount": "100", "Unit": "USD"},
    "TimeUnit": "MONTHLY",
    "BudgetType": "COST",
    "CostFilters": {
      "Service": ["Amazon Simple Storage Service"]
    }
  }'
```

## Security Best Practices

### Access Control
1. **Principle of Least Privilege**: Grant minimal required permissions
2. **Regular Audits**: Review IAM policies quarterly
3. **MFA Requirements**: Enable MFA for sensitive operations
4. **Access Logging**: Monitor all bucket access

### Data Protection
1. **Encryption at Rest**: SSE-S3 enabled for all buckets
2. **Encryption in Transit**: HTTPS enforced for all operations
3. **Backup Strategy**: Regular backups with versioning
4. **Data Classification**: Separate buckets by sensitivity level

### Compliance (DSGVO/GDPR)
1. **Data Retention**: Automated deletion after retention period
2. **Right to Erasure**: Procedures for complete data deletion
3. **Access Logging**: Audit trail for all data access
4. **Data Minimization**: Store only necessary data

## Emergency Procedures

### Service Outage Response
1. **Assess Impact**: Determine affected services
2. **Communicate**: Notify users and stakeholders
3. **Implement Workarounds**: Use backup systems if available
4. **Monitor Recovery**: Track service restoration
5. **Post-Incident Review**: Document lessons learned

### Security Incident Response
1. **Isolate**: Restrict access to affected resources
2. **Investigate**: Analyze logs and access patterns
3. **Contain**: Prevent further unauthorized access
4. **Recover**: Restore from clean backups if needed
5. **Report**: Document incident and notify authorities if required

### Data Breach Response
1. **Immediate Actions**: Stop the breach and secure systems
2. **Assessment**: Determine scope and impact
3. **Notification**: Inform authorities within 72 hours (GDPR)
4. **User Communication**: Notify affected users
5. **Remediation**: Implement fixes and monitoring

## Contact Information

### Support Escalation
- **Level 1**: Development Team
- **Level 2**: DevOps Team
- **Level 3**: AWS Support (Business Plan)

### Emergency Contacts
- **On-Call Engineer**: [Phone/Slack]
- **Security Team**: [Email/Phone]
- **Management**: [Email/Phone]

### External Resources
- **AWS Support**: https://console.aws.amazon.com/support/
- **AWS Status**: https://status.aws.amazon.com/
- **Documentation**: https://docs.aws.amazon.com/s3/

---

**Document Version**: 1.0  
**Last Updated**: $(date +%Y-%m-%d)  
**Next Review**: $(date -d '+3 months' +%Y-%m-%d)  
**Owner**: DevOps Team  
**Approved By**: CTO