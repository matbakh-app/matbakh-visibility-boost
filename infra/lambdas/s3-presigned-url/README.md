# S3 Presigned URL Lambda Function

This Lambda function generates secure presigned URLs for S3 file uploads with comprehensive security validation and error handling.

## Features

- **Security Validation**: MIME type whitelist, file size limits, filename sanitization
- **Rate Limiting**: Per-user rate limiting to prevent abuse
- **User Permissions**: Database-backed user permission validation
- **Bucket-Specific Rules**: Different validation rules per S3 bucket
- **Comprehensive Error Handling**: Structured error responses with proper HTTP codes
- **CORS Support**: Proper CORS headers for web application integration
- **Audit Logging**: Upload activity logging to database

## Architecture

```
Frontend → API Gateway → Lambda Function → S3 Presigned URL
                      ↓
                   PostgreSQL (User validation & logging)
```

## Supported Buckets

| Bucket | Purpose | Max Size | Allowed Types | Access |
|--------|---------|----------|---------------|--------|
| `matbakh-files-uploads` | User uploads, AI content | 10MB | Images, Documents, Office | Private |
| `matbakh-files-profile` | Avatars, logos | 5MB | Images only | Semi-public |
| `matbakh-files-reports` | VC reports, PDFs | 20MB | Documents, Images | Public via CloudFront |

## Security Features

### File Type Validation
- Comprehensive MIME type whitelist
- Blocked dangerous extensions (.exe, .bat, .scr, etc.)
- Suspicious filename pattern detection

### Rate Limiting
- 10 requests per minute per user
- Automatic reset after time window
- Graceful error responses

### User Authentication
- JWT token validation
- Database user permission checks
- Partner-specific access control

### File Size Limits
- Bucket-specific size limits
- Pre-upload validation
- Prevents resource abuse

## API Interface

### Request Format
```json
{
  "bucket": "matbakh-files-uploads",
  "filename": "document.pdf",
  "contentType": "application/pdf",
  "folder": "user-uploads",
  "userId": "user-123",
  "partnerId": "partner-456",
  "fileSize": 1048576
}
```

### Response Format
```json
{
  "uploadUrl": "https://s3.amazonaws.com/presigned-url",
  "fileUrl": "s3://bucket/key",
  "publicUrl": "https://cloudfront.domain/key",
  "expiresAt": "2024-01-01T00:15:00.000Z"
}
```

### Error Response Format
```json
{
  "error": "AppError",
  "code": "INVALID_FILE",
  "message": "File type not allowed",
  "details": {
    "providedType": "application/x-executable",
    "allowedTypes": ["image/jpeg", "application/pdf"]
  },
  "timestamp": "2024-01-01T00:00:00.000Z",
  "requestId": "abc-123"
}
```

## Development

### Prerequisites
- Node.js 20.x
- TypeScript 5.x
- AWS CLI configured
- PostgreSQL database access

### Setup
```bash
npm install
npm run build
npm run test
```

### Testing
```bash
# Run unit tests
npm test

# Run simple validation tests
node test-simple.js

# Run integration tests (requires deployed function)
./test-integration.sh
```

### Deployment
```bash
# Deploy with automated script
npm run deploy

# Or manually
./deploy.sh
```

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `CLOUDFRONT_DOMAIN` | CloudFront distribution domain | `d1234567890.cloudfront.net` |
| `UPLOADS_BUCKET` | Uploads bucket name | `matbakh-files-uploads` |
| `PROFILE_BUCKET` | Profile bucket name | `matbakh-files-profile` |
| `REPORTS_BUCKET` | Reports bucket name | `matbakh-files-reports` |

## Database Schema

The function requires the following database tables:

### `profiles` table
- User authentication and role information
- Required for permission validation

### `business_partners` table  
- Partner relationship data
- Required for partner-specific access control

### `user_uploads` table
- Upload activity logging
- Tracks all file uploads with metadata

See `schema.sql` for complete database schema.

## IAM Permissions

The Lambda execution role requires:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:PutObjectAcl",
        "s3:GetObject"
      ],
      "Resource": [
        "arn:aws:s3:::matbakh-files-*/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "arn:aws:secretsmanager:*:*:secret:matbakh-db-postgres-*"
    }
  ]
}
```

## Monitoring

### CloudWatch Metrics
- Function duration and errors
- Custom metrics for upload success/failure
- Rate limiting events

### CloudWatch Logs
- Structured logging with request IDs
- Security validation events
- Database operation logs

### Alarms
- High error rate alerts
- Function timeout alerts
- Rate limiting threshold alerts

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request parameters |
| `INVALID_FILE` | 400 | File type or size validation failed |
| `AUTH_ERROR` | 401 | Authentication required |
| `PERMISSION_DENIED` | 403 | User lacks required permissions |
| `RATE_LIMITED` | 429 | Rate limit exceeded |
| `QUOTA_EXCEEDED` | 429 | Upload quota exceeded |
| `DATABASE_ERROR` | 500 | Database operation failed |
| `S3_ERROR` | 500 | S3 operation failed |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

## Security Considerations

1. **Input Validation**: All inputs are validated and sanitized
2. **Rate Limiting**: Prevents abuse and DoS attacks
3. **File Type Restrictions**: Only safe file types allowed
4. **Size Limits**: Prevents resource exhaustion
5. **User Authentication**: All requests require valid authentication
6. **Audit Logging**: All upload attempts are logged
7. **Error Sanitization**: Sensitive information removed from error responses

## Troubleshooting

### Common Issues

1. **"Permission Denied" errors**
   - Check IAM role permissions
   - Verify S3 bucket policies
   - Ensure user exists in database

2. **"Rate Limited" errors**
   - Normal behavior for excessive requests
   - Wait for rate limit window to reset
   - Check if legitimate traffic patterns

3. **"Invalid File" errors**
   - Check MIME type against whitelist
   - Verify file size within limits
   - Ensure filename doesn't contain dangerous patterns

4. **Database connection errors**
   - Verify VPC configuration
   - Check security group rules
   - Ensure database credentials in Secrets Manager

### Debugging

1. Check CloudWatch logs for detailed error information
2. Use integration test script to validate functionality
3. Monitor CloudWatch metrics for performance issues
4. Verify database connectivity with health check queries

## Contributing

1. Follow TypeScript strict mode requirements
2. Add comprehensive error handling
3. Include unit tests for new features
4. Update documentation for API changes
5. Test security implications of changes