# S3 Upload Troubleshooting Guide

## Quick Reference

### Common Error Codes
| Error Code | Description | Quick Fix |
|------------|-------------|-----------|
| `AUTHENTICATION_REQUIRED` | User not logged in | Check auth token |
| `FILE_SIZE_EXCEEDED` | File too large | Compress or split file |
| `INVALID_FILE_TYPE` | Unsupported format | Check allowed types |
| `NETWORK_ERROR` | Connection issues | Check internet connection |
| `PERMISSION_DENIED` | Access forbidden | Verify user permissions |
| `QUOTA_EXCEEDED` | Storage limit reached | Clean up old files |
| `UPLOAD_TIMEOUT` | Request timed out | Retry with smaller file |

### Emergency Commands
```bash
# Check S3 service status
aws s3 ls s3://matbakh-files-uploads/ --region eu-central-1

# Test Lambda function
aws lambda invoke --function-name matbakh-get-presigned-url \
  --payload '{"bucket":"matbakh-files-uploads","filename":"test.jpg","contentType":"image/jpeg"}' \
  /tmp/response.json && cat /tmp/response.json

# Check recent errors
aws logs filter-log-events --log-group-name /aws/lambda/matbakh-get-presigned-url \
  --start-time $(date -d '1 hour ago' +%s)000 --filter-pattern 'ERROR'
```

## Detailed Troubleshooting

### 1. Upload Failures

#### Symptom: "Upload failed due to network issues"
**Possible Causes:**
- Internet connectivity problems
- DNS resolution issues
- Firewall blocking requests
- Proxy configuration problems

**Diagnostic Steps:**
```bash
# Test basic connectivity
ping matbakh.app

# Test DNS resolution
nslookup matbakh-files-uploads.s3.eu-central-1.amazonaws.com

# Test HTTPS connectivity
curl -I https://matbakh-files-uploads.s3.eu-central-1.amazonaws.com/

# Check for proxy issues
curl -I https://matbakh-files-uploads.s3.eu-central-1.amazonaws.com/ --proxy ""
```

**Solutions:**
1. Check internet connection
2. Try different network (mobile hotspot)
3. Disable VPN/proxy temporarily
4. Contact network administrator

#### Symptom: "Authentication required - please log in"
**Possible Causes:**
- Expired session token
- Invalid authentication token
- Token not properly stored
- CORS issues preventing token access

**Diagnostic Steps:**
```javascript
// Check token in browser console
console.log('Auth token:', localStorage.getItem('auth_token'));
console.log('Session token:', sessionStorage.getItem('auth_token'));

// Check cookies
document.cookie.split(';').forEach(cookie => {
  if (cookie.includes('auth') || cookie.includes('token')) {
    console.log('Cookie:', cookie.trim());
  }
});
```

**Solutions:**
1. Log out and log back in
2. Clear browser cache and cookies
3. Check token expiration
4. Verify authentication service status

#### Symptom: "File size exceeds maximum limit"
**Possible Causes:**
- File larger than 10MB limit
- Incorrect size calculation
- Multipart upload not triggered

**Diagnostic Steps:**
```javascript
// Check file size in browser
const file = document.getElementById('fileInput').files[0];
console.log('File size:', file.size, 'bytes');
console.log('File size:', (file.size / 1024 / 1024).toFixed(2), 'MB');

// Check multipart threshold
const MULTIPART_THRESHOLD = 5 * 1024 * 1024; // 5MB
console.log('Should use multipart:', file.size > MULTIPART_THRESHOLD);
```

**Solutions:**
1. Compress images before upload
2. Split large files
3. Enable multipart upload for large files
4. Increase size limit if necessary

#### Symptom: "File type not allowed"
**Possible Causes:**
- Unsupported MIME type
- File extension mismatch
- Corrupted file headers

**Diagnostic Steps:**
```javascript
// Check file type
const file = document.getElementById('fileInput').files[0];
console.log('File type:', file.type);
console.log('File name:', file.name);
console.log('File extension:', file.name.split('.').pop());

// Check allowed types
const allowedTypes = [
  'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf', 'text/plain', 'text/csv'
];
console.log('Type allowed:', allowedTypes.includes(file.type));
```

**Solutions:**
1. Convert file to supported format
2. Check file is not corrupted
3. Rename file with correct extension
4. Update allowed types if needed

### 2. Slow Upload Performance

#### Symptom: Uploads taking longer than expected
**Possible Causes:**
- Large file size without optimization
- Network bandwidth limitations
- Lambda cold starts
- S3 regional latency

**Diagnostic Steps:**
```bash
# Check Lambda performance
aws cloudwatch get-metric-statistics --namespace AWS/Lambda \
  --metric-name Duration --dimensions Name=FunctionName,Value=matbakh-get-presigned-url \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) --period 300 --statistics Average

# Check S3 request metrics
aws cloudwatch get-metric-statistics --namespace AWS/S3 \
  --metric-name AllRequests --dimensions Name=BucketName,Value=matbakh-files-uploads \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) --period 300 --statistics Sum
```

**Solutions:**
1. Enable image compression
2. Use multipart upload for large files
3. Implement upload progress indicators
4. Consider Lambda provisioned concurrency

#### Symptom: High Lambda duration
**Possible Causes:**
- Cold start delays
- Database connection issues
- Inefficient code
- Resource constraints

**Diagnostic Steps:**
```bash
# Check Lambda logs for cold starts
aws logs filter-log-events --log-group-name /aws/lambda/matbakh-get-presigned-url \
  --filter-pattern 'INIT_START' --start-time $(date -d '1 hour ago' +%s)000

# Check memory usage
aws logs filter-log-events --log-group-name /aws/lambda/matbakh-get-presigned-url \
  --filter-pattern 'Max Memory Used' --start-time $(date -d '1 hour ago' +%s)000
```

**Solutions:**
1. Increase Lambda memory allocation
2. Implement connection pooling
3. Use provisioned concurrency
4. Optimize code for performance

### 3. Permission Issues

#### Symptom: "Access Denied" errors
**Possible Causes:**
- Incorrect IAM permissions
- Bucket policy restrictions
- Expired presigned URLs
- CORS configuration issues

**Diagnostic Steps:**
```bash
# Check IAM role permissions
aws iam get-role-policy --role-name lambda-execution-role --policy-name s3-access

# Check bucket policy
aws s3api get-bucket-policy --bucket matbakh-files-uploads

# Test presigned URL generation
aws lambda invoke --function-name matbakh-get-presigned-url \
  --payload '{"bucket":"matbakh-files-uploads","filename":"test.jpg","contentType":"image/jpeg"}' \
  /tmp/test-response.json

# Check CORS configuration
aws s3api get-bucket-cors --bucket matbakh-files-uploads
```

**Solutions:**
1. Update IAM policies
2. Review bucket policies
3. Check presigned URL expiration
4. Update CORS configuration

#### Symptom: CORS errors in browser
**Possible Causes:**
- Missing CORS configuration
- Incorrect allowed origins
- Preflight request failures
- Browser security restrictions

**Diagnostic Steps:**
```javascript
// Test CORS in browser console
fetch('https://matbakh-files-uploads.s3.eu-central-1.amazonaws.com/', {
  method: 'OPTIONS',
  headers: {
    'Origin': window.location.origin,
    'Access-Control-Request-Method': 'PUT',
    'Access-Control-Request-Headers': 'Content-Type'
  }
}).then(response => {
  console.log('CORS test:', response.status, response.headers);
}).catch(error => {
  console.error('CORS error:', error);
});
```

**Solutions:**
1. Update CORS configuration
2. Add current domain to allowed origins
3. Check preflight request handling
4. Test from allowed domains

### 4. CloudFront Issues

#### Symptom: Reports not loading from CDN
**Possible Causes:**
- CloudFront distribution issues
- Origin access identity problems
- Cache configuration errors
- Geographic restrictions

**Diagnostic Steps:**
```bash
# Check distribution status
aws cloudfront get-distribution --id E2W4JULEW8BXSD \
  --query 'Distribution.{Status:Status,DomainName:DomainName}'

# Check origin access identity
aws cloudfront list-cloud-front-origin-access-identities \
  --query 'CloudFrontOriginAccessIdentityList.Items[?Comment==`OAI for matbakh-files-reports bucket`]'

# Test direct S3 access vs CloudFront
curl -I https://matbakh-files-reports.s3.eu-central-1.amazonaws.com/test-file.pdf
curl -I https://d1234567890.cloudfront.net/test-file.pdf
```

**Solutions:**
1. Check distribution deployment status
2. Verify origin access identity configuration
3. Create cache invalidation
4. Review geographic restrictions

#### Symptom: Low cache hit rate
**Possible Causes:**
- Incorrect cache behaviors
- Short TTL values
- Query string parameters
- Vary headers

**Diagnostic Steps:**
```bash
# Check cache hit rate
aws cloudwatch get-metric-statistics --namespace AWS/CloudFront \
  --metric-name CacheHitRate --dimensions Name=DistributionId,Value=E2W4JULEW8BXSD \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) --period 300 --statistics Average

# Check cache behaviors
aws cloudfront get-distribution-config --id E2W4JULEW8BXSD \
  --query 'DistributionConfig.CacheBehaviors'
```

**Solutions:**
1. Optimize cache behaviors
2. Increase TTL values
3. Remove unnecessary query parameters
4. Review cache policies

### 5. Database Issues

#### Symptom: Upload metadata not saved
**Possible Causes:**
- Database connection failures
- RDS connectivity issues
- SQL errors
- Transaction rollbacks

**Diagnostic Steps:**
```bash
# Check RDS connectivity
aws rds describe-db-instances --db-instance-identifier matbakh-db \
  --query 'DBInstances[0].{Status:DBInstanceStatus,Endpoint:Endpoint.Address}'

# Check Lambda VPC configuration
aws lambda get-function-configuration --function-name matbakh-s3-upload-processor \
  --query 'VpcConfig'

# Check security groups
aws ec2 describe-security-groups --group-ids sg-xxxxxxxxx \
  --query 'SecurityGroups[0].IpPermissions'
```

**Solutions:**
1. Verify RDS instance status
2. Check VPC and security group configuration
3. Test database connectivity from Lambda
4. Review SQL queries and transactions

### 6. Monitoring and Alerting

#### Symptom: Missing metrics or alerts
**Possible Causes:**
- CloudWatch agent not configured
- Metrics not being published
- Alert thresholds incorrect
- SNS topic issues

**Diagnostic Steps:**
```bash
# Check custom metrics
aws cloudwatch list-metrics --namespace Matbakh/S3Upload

# Check alarm status
aws cloudwatch describe-alarms --alarm-name-prefix matbakh- \
  --query 'MetricAlarms[].{Name:AlarmName,State:StateValue}'

# Check SNS topic
aws sns list-subscriptions-by-topic --topic-arn arn:aws:sns:eu-central-1:ACCOUNT:matbakh-s3-alerts
```

**Solutions:**
1. Verify metrics publishing code
2. Check alarm configurations
3. Test SNS topic subscriptions
4. Review CloudWatch permissions

## Performance Optimization

### Upload Speed Optimization

#### Image Compression Settings
```javascript
const compressionSettings = {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 0.8,
  format: 'image/jpeg'
};

// Compress before upload
const compressedFile = await compressImage(originalFile, compressionSettings);
```

#### Multipart Upload Configuration
```javascript
const multipartConfig = {
  threshold: 5 * 1024 * 1024, // 5MB
  partSize: 5 * 1024 * 1024,   // 5MB parts
  maxConcurrent: 3              // 3 concurrent parts
};
```

#### Progress Tracking
```javascript
const uploadOptions = {
  file: selectedFile,
  bucket: 'matbakh-files-uploads',
  onProgress: (progress) => {
    console.log(`Upload progress: ${progress.toFixed(1)}%`);
    updateProgressBar(progress);
  },
  onSuccess: (result) => {
    console.log('Upload successful:', result.fileUrl);
  },
  onError: (error) => {
    console.error('Upload failed:', error.message);
    showErrorMessage(error.message);
  }
};
```

### Lambda Performance Tuning

#### Memory Optimization
```bash
# Test different memory settings
for memory in 256 512 1024; do
  aws lambda update-function-configuration \
    --function-name matbakh-get-presigned-url \
    --memory-size $memory
  
  # Run performance test
  aws lambda invoke --function-name matbakh-get-presigned-url \
    --payload '{"bucket":"matbakh-files-uploads","filename":"test.jpg","contentType":"image/jpeg"}' \
    /tmp/response-$memory.json
done
```

#### Connection Pooling
```javascript
// Reuse connections across invocations
const s3Client = new S3Client({
  region: 'eu-central-1',
  maxAttempts: 3,
  retryMode: 'adaptive'
});

const dbPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30000
});
```

## Preventive Measures

### Regular Health Checks
```bash
#!/bin/bash
# health-check.sh - Run daily health checks

echo "S3 Health Check - $(date)"

# Test bucket accessibility
for bucket in matbakh-files-uploads matbakh-files-profile matbakh-files-reports; do
  if aws s3 ls s3://$bucket/ >/dev/null 2>&1; then
    echo "✓ $bucket accessible"
  else
    echo "✗ $bucket not accessible"
  fi
done

# Test Lambda functions
for func in matbakh-get-presigned-url matbakh-s3-upload-processor; do
  if aws lambda get-function --function-name $func >/dev/null 2>&1; then
    echo "✓ $func exists"
  else
    echo "✗ $func not found"
  fi
done

# Test CloudFront distribution
if aws cloudfront get-distribution --id E2W4JULEW8BXSD >/dev/null 2>&1; then
  echo "✓ CloudFront distribution active"
else
  echo "✗ CloudFront distribution issue"
fi
```

### Automated Testing
```javascript
// upload-test.js - Automated upload testing
const testUpload = async () => {
  const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
  
  try {
    const result = await uploadToS3Enhanced({
      file: testFile,
      bucket: 'matbakh-files-uploads',
      folder: 'test/'
    });
    
    console.log('✓ Upload test passed:', result.fileUrl);
    return true;
  } catch (error) {
    console.error('✗ Upload test failed:', error.message);
    return false;
  }
};

// Run test every hour
setInterval(testUpload, 60 * 60 * 1000);
```

### Capacity Planning
```bash
# storage-growth-analysis.sh
#!/bin/bash

echo "Storage Growth Analysis - $(date)"

for bucket in matbakh-files-uploads matbakh-files-profile matbakh-files-reports; do
  echo "Analyzing $bucket..."
  
  # Get current size
  current_size=$(aws cloudwatch get-metric-statistics \
    --namespace AWS/S3 --metric-name BucketSizeBytes \
    --dimensions Name=BucketName,Value=$bucket Name=StorageType,Value=StandardStorage \
    --start-time $(date -u -d '1 day ago' +%Y-%m-%dT%H:%M:%S) \
    --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
    --period 86400 --statistics Average \
    --query 'Datapoints[0].Average' --output text)
  
  if [ "$current_size" != "None" ]; then
    size_gb=$(echo "scale=2; $current_size / 1024 / 1024 / 1024" | bc)
    echo "  Current size: ${size_gb} GB"
  else
    echo "  Current size: No data"
  fi
  
  # Get object count
  object_count=$(aws cloudwatch get-metric-statistics \
    --namespace AWS/S3 --metric-name NumberOfObjects \
    --dimensions Name=BucketName,Value=$bucket Name=StorageType,Value=AllStorageTypes \
    --start-time $(date -u -d '1 day ago' +%Y-%m-%dT%H:%M:%S) \
    --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
    --period 86400 --statistics Average \
    --query 'Datapoints[0].Average' --output text)
  
  if [ "$object_count" != "None" ]; then
    echo "  Object count: $object_count"
  else
    echo "  Object count: No data"
  fi
done
```

## Emergency Response

### Incident Response Checklist
1. **Assess Impact**
   - [ ] Identify affected services
   - [ ] Determine user impact
   - [ ] Check error rates

2. **Immediate Actions**
   - [ ] Check AWS service status
   - [ ] Review recent deployments
   - [ ] Check monitoring alerts

3. **Communication**
   - [ ] Notify stakeholders
   - [ ] Update status page
   - [ ] Prepare user communication

4. **Investigation**
   - [ ] Analyze logs and metrics
   - [ ] Identify root cause
   - [ ] Document findings

5. **Resolution**
   - [ ] Implement fix
   - [ ] Test functionality
   - [ ] Monitor recovery

6. **Post-Incident**
   - [ ] Conduct retrospective
   - [ ] Update documentation
   - [ ] Implement preventive measures

### Emergency Contacts
- **On-Call Engineer**: [Contact Information]
- **AWS Support**: https://console.aws.amazon.com/support/
- **Escalation Manager**: [Contact Information]

---

**Last Updated**: $(date +%Y-%m-%d)  
**Version**: 1.0  
**Owner**: DevOps Team