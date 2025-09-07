# S3 File Storage Migration Guide

This guide covers the complete migration from Supabase Storage to AWS S3 for file storage in the matbakh.app platform.

## Overview

The migration involves:
1. **Infrastructure**: S3 buckets, Lambda functions, and CloudFront distribution
2. **Code Migration**: Updating components to use S3 upload functionality
3. **Data Migration**: Converting existing file URLs from Supabase to S3
4. **Validation**: Ensuring all migrated URLs work correctly

## Prerequisites

Before running the migration, ensure you have:

### Environment Variables
```bash
# Supabase (for data migration)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AWS Credentials
AWS_REGION=eu-central-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# CloudFront (for public file access)
CLOUDFRONT_DOMAIN=your-cloudfront-domain.cloudfront.net
```

### AWS Infrastructure
Ensure the following AWS resources are deployed:
- S3 buckets: `matbakh-files-uploads`, `matbakh-files-profile`, `matbakh-files-reports`
- Lambda function: `matbakh-get-presigned-url`
- CloudFront distribution for the reports bucket
- Proper IAM roles and policies

## Migration Steps

### 1. Infrastructure Verification

First, verify that all AWS infrastructure is properly deployed:

```bash
# Check S3 buckets
aws s3 ls | grep matbakh-files

# Check Lambda function
aws lambda get-function --function-name matbakh-get-presigned-url

# Check CloudFront distribution
aws cloudfront list-distributions --query 'DistributionList.Items[?Comment==`matbakh-files-reports`]'
```

### 2. Code Migration (Already Complete)

The following components have been updated to use S3:
- ✅ `src/components/ui/image-upload.tsx` - S3 image upload component
- ✅ `src/components/ui/file-input.tsx` - S3 file upload component
- ✅ `src/components/Profile/MyProfile.tsx` - Avatar upload via S3
- ✅ `src/components/Profile/CompanyProfile.tsx` - Logo upload via S3
- ✅ `src/components/dashboard/PhotoUploader.tsx` - Photo upload via S3
- ✅ `supabase/functions/generate-pdf-report/index.ts` - PDF storage via S3

### 3. Data Migration

Migrate existing file URLs from Supabase Storage to S3:

```bash
# Dry run (recommended first)
npm run migrate-file-urls -- --dry-run

# Review the migration plan, then run actual migration
npm run migrate-file-urls

# Validate migrated URLs
npm run validate-urls

# Fix any issues found (dry run first)
npm run validate-urls -- --fix
npm run validate-urls -- --fix --live
```

### 4. Database Schema Updates

Apply the database migration to remove Supabase storage configuration:

```bash
# Apply the migration
supabase db push

# Or manually run the migration
psql -h your-db-host -U postgres -d postgres -f supabase/migrations/20250831000001_remove_storage_bucket.sql
```

## File URL Mapping

The migration maps file URLs as follows:

| Original (Supabase) | New (S3) | Access Method |
|---------------------|----------|---------------|
| `https://project.supabase.<REDACTED_AWS_SECRET_ACCESS_KEY>.jpg` | `s3://matbakh-files-profile/avatars/file.jpg` | Presigned URLs |
| `https://project.supabase.co/storage/v1/object/public/logos/file.jpg` | `s3://matbakh-files-profile/logos/file.jpg` | Presigned URLs |
| `https://project.supabase.co/storage/v1/object/public/visibility-reports/file.pdf` | `https://cloudfront-domain.net/vc-reports/file.pdf` | CloudFront (public) |

## S3 Bucket Structure

```
matbakh-files-uploads/
├── user-uploads/{user_id}/
├── ai-generated/{type}/
└── temp/{session_id}/

matbakh-files-profile/
├── avatars/{user_id}/
├── logos/{partner_id}/
└── gmb-photos/{partner_id}/

matbakh-files-reports/
├── vc-reports/{lead_id}/
├── pdf-exports/{report_id}/
└── tmp/{temp_id}/
```

## Upload Flow

### Frontend Upload Process
1. User selects file in UI component
2. Component validates file (size, type, etc.)
3. Component calls Lambda function to get presigned URL
4. File is uploaded directly to S3 using presigned URL
5. Upload success triggers database update with S3 URL

### Lambda Function (`matbakh-get-presigned-url`)
```typescript
// Request
{
  "bucket": "matbakh-files-profile",
  "filename": "avatar.jpg",
  "contentType": "image/jpeg",
  "folder": "avatars"
}

// Response
{
  "uploadUrl": "https://s3.amazonaws.com/...presigned-url...",
  "fileUrl": "s3://matbakh-files-profile/avatars/avatar.jpg",
  "publicUrl": "https://cloudfront-domain.net/avatars/avatar.jpg" // for reports only
}
```

## Security Considerations

### Access Control
- **Private files** (uploads, profile): Access via presigned URLs only
- **Public files** (reports): Access via CloudFront with time-limited URLs
- **Authentication**: Lambda function validates user permissions before generating presigned URLs

### File Validation
- File type validation (MIME type whitelist)
- File size limits (configurable per bucket)
- Virus scanning (future enhancement)

### GDPR Compliance
- User data deletion includes S3 file cleanup
- Audit logging for all file access
- Data retention policies enforced via S3 lifecycle rules

## Monitoring and Troubleshooting

### CloudWatch Metrics
Monitor the following metrics:
- Lambda function invocations and errors
- S3 upload success/failure rates
- CloudFront cache hit rates

### Common Issues

#### Upload Failures
```bash
# Check Lambda function logs
aws logs tail /aws/lambda/matbakh-get-presigned-url --follow

# Check S3 bucket policies
aws s3api get-bucket-policy --bucket matbakh-files-uploads
```

#### Missing Files After Migration
```bash
# Run validation script
npm run validate-urls

# Check specific file in S3
aws s3 ls s3://matbakh-files-profile/avatars/ --recursive
```

#### CloudFront Access Issues
```bash
# Check CloudFront distribution status
aws cloudfront get-distribution --id YOUR_DISTRIBUTION_ID

# Invalidate CloudFront cache if needed
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

## Rollback Plan

If issues arise, you can rollback by:

1. **Revert code changes**: Deploy previous version without S3 components
2. **Restore Supabase storage**: Re-run the storage bucket creation migration
3. **Restore file URLs**: Use backup data to restore original Supabase URLs

```sql
-- Emergency rollback (example)
UPDATE visibility_check_leads 
SET report_url = backup_report_url 
WHERE report_url LIKE '%cloudfront%';
```

## Performance Optimization

### Upload Performance
- Use multipart upload for files > 5MB
- Implement client-side compression for images
- Add upload progress indicators

### Access Performance
- CloudFront caching for public files
- Presigned URL caching (short-term)
- Image optimization via Lambda@Edge (future)

## Testing

### Manual Testing Checklist
- [ ] Avatar upload in user profile
- [ ] Logo upload in company profile
- [ ] Photo upload in dashboard
- [ ] PDF report generation and access
- [ ] File validation (size, type limits)
- [ ] Error handling (network issues, invalid files)

### Automated Testing
```bash
# Run upload component tests
npm test -- --testPathPattern=upload

# Run integration tests
npm run test:integration
```

## Support and Maintenance

### Regular Maintenance Tasks
- Monitor S3 storage costs and usage
- Review and update lifecycle policies
- Check for orphaned files
- Update presigned URL expiration times as needed

### Emergency Contacts
- AWS Support: [Your AWS Support Plan]
- Infrastructure Team: [Contact Information]
- Development Team: [Contact Information]

## Migration Completion Checklist

- [ ] All S3 buckets created and configured
- [ ] Lambda function deployed and tested
- [ ] CloudFront distribution configured
- [ ] Code migration completed
- [ ] Data migration executed successfully
- [ ] URL validation passed
- [ ] Supabase storage configuration removed
- [ ] Documentation updated
- [ ] Team trained on new upload process
- [ ] Monitoring and alerts configured

## Additional Resources

- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/)
- [CloudFront Documentation](https://docs.aws.amazon.com/cloudfront/)
- [Supabase Storage Migration Guide](https://supabase.com/docs/guides/storage)