# Matbakh Metrics Ingest Infrastructure

## Overview

This directory contains the AWS infrastructure for the Matbakh Performance Monitoring metrics ingestion system. It provides a secure, scalable, and cost-effective way to collect performance metrics from the frontend and forward them to CloudWatch.

## Architecture

```
Frontend → API Gateway → Lambda → CloudWatch
```

### Components

1. **Lambda Function** (`lambdas/metrics-ingest/`)
   - Node.js 20 runtime
   - Accepts POST requests with metrics payload
   - Validates and sanitizes dimensions
   - Forwards to CloudWatch with strict allow-list
   - Anonymizes SessionId with lightweight hashing

2. **CDK Stack** (`cdk/`)
   - HTTP API Gateway with CORS support
   - Lambda function with CloudWatch permissions
   - Log groups with retention policies
   - Environment-specific configuration

## Security Features

### Dimension Allow-List
Only these dimensions are accepted:
- `Env`, `AppVersion`, `Page`
- `DeviceType`, `ConnectionType`, `Rating`
- `Bucket`, `UploadType`, `ErrorType`, `QuotaType`
- `SessionId` (anonymized), `Metric`, `Severity`, `Type`, `Success`

### Privacy Protection
- SessionId is hashed to 8-character hex string
- All dimensions limited to 128 characters
- Maximum 8 dimensions per metric
- No PII data accepted or stored

### Rate Limiting
- CloudWatch API limits naturally rate-limit requests
- Lambda timeout prevents runaway executions
- Batch processing (20 metrics per CloudWatch call)

## Deployment

### Prerequisites
```bash
npm install -g aws-cdk
aws configure  # Ensure AWS credentials are set
```

### Deploy Infrastructure
```bash
# Install dependencies
cd infra/cdk
npm install

cd ../lambdas/metrics-ingest
npm install

# Deploy stack
cd ../cdk
npm run deploy

# Or with environment variables
CORS_ORIGIN=https://matbakh.app \
METRICS_NAMESPACE=Matbakh/Production \
LOG_LEVEL=warn \
npm run deploy
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `CDK_ENVIRONMENT` | `dev` | Environment name (dev/staging/prod) |
| `CORS_ORIGIN` | `*` | Allowed CORS origin |
| `METRICS_NAMESPACE` | `Matbakh/Web` | CloudWatch namespace |
| `LOG_LEVEL` | `info` | Lambda log level |

### Lambda Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `METRICS_NS` | `Matbakh/Web` | CloudWatch namespace |
| `LOG_LEVEL` | `info` | Logging level |
| `CORS_ORIGIN` | `*` | CORS allowed origin |

## Usage

### API Endpoint
```
POST https://{api-id}.execute-api.{region}.amazonaws.com/metrics
```

### Request Format
```json
{
  "metrics": [
    {
      "metricName": "CoreWebVital_LCP",
      "value": 2500,
      "unit": "Milliseconds",
      "dimensions": {
        "Rating": "good",
        "DeviceType": "desktop",
        "Page": "home",
        "SessionId": "session_123"
      },
      "timestamp": "2025-01-14T10:30:00Z"
    }
  ]
}
```

### Single Metric Format
```json
{
  "metricName": "PerformanceAlert",
  "value": 1,
  "dimensions": {
    "Severity": "high",
    "Type": "threshold_exceeded"
  }
}
```

## Monitoring

### CloudWatch Metrics
- Namespace: `Matbakh/Web` (configurable)
- Metrics appear in CloudWatch console
- Standard resolution (60-second intervals)

### Lambda Logs
- Log group: `/aws/lambda/matbakh-metrics-ingest-{env}`
- Retention: 30 days
- Structured JSON logging

### Example Log Entry
```json
{
  "lvl": "info",
  "msg": "metrics_processed",
  "extra": {
    "count": 5,
    "namespace": "Matbakh/Web"
  }
}
```

## Cost Optimization

### Lambda Costs
- 256MB memory allocation
- 30-second timeout
- Pay-per-request pricing
- Estimated: ~$0.20 per 1M requests

### CloudWatch Costs
- Standard resolution metrics
- $0.30 per metric per month (first 10,000)
- Batch processing reduces API calls

### Optimization Tips
1. Use client-side sampling (`VITE_METRICS_SAMPLE_RATE`)
2. Batch metrics in client before sending
3. Monitor CloudWatch usage in billing console

## Development

### Local Testing
```bash
cd infra/lambdas/metrics-ingest
npm test

# Build TypeScript
npm run build
```

### CDK Commands
```bash
cd infra/cdk

# Synthesize CloudFormation
npm run synth

# Show differences
npm run diff

# Deploy
npm run deploy

# Destroy (careful!)
npm run destroy
```

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check `CORS_ORIGIN` environment variable
   - Verify API Gateway CORS configuration

2. **CloudWatch Permission Denied**
   - Ensure Lambda has `cloudwatch:PutMetricData` permission
   - Check namespace restrictions in IAM policy

3. **Dimension Rejected**
   - Verify dimension name is in allow-list
   - Check dimension value length (<128 chars)

### Debug Mode
Set `LOG_LEVEL=debug` to see detailed processing logs:

```bash
LOG_LEVEL=debug npm run deploy
```

## Security Considerations

### IAM Permissions
- Lambda has minimal CloudWatch permissions
- Namespace-restricted metric publishing
- No cross-account access

### Data Privacy
- No PII data accepted
- SessionId anonymization
- Dimension sanitization
- No data persistence in Lambda

### Network Security
- HTTPS-only API endpoint
- CORS protection
- No VPC requirements (public Lambda)

## Scaling

### Automatic Scaling
- Lambda scales automatically (up to 1000 concurrent)
- API Gateway handles traffic spikes
- CloudWatch has no practical limits

### Performance Tuning
- Batch size: 20 metrics per CloudWatch call
- Memory: 256MB (sufficient for JSON processing)
- Timeout: 30 seconds (generous for batch processing)

## Maintenance

### Updates
1. Update Lambda dependencies regularly
2. Monitor CloudWatch costs
3. Review dimension allow-list periodically
4. Update CDK and AWS SDK versions

### Monitoring
- Set up CloudWatch alarms for Lambda errors
- Monitor API Gateway 4xx/5xx errors
- Track CloudWatch metric volume

---

**Last Updated**: 2025-01-14  
**CDK Version**: 2.163.1  
**Node.js Version**: 20.x