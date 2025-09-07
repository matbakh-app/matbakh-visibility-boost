# Implementation Plan - S3 File Storage Migration

## Task Overview

Diese Implementierungsaufgaben führen die vollständige Migration von Supabase Storage zu AWS S3 durch. Jede Aufgabe baut auf der vorherigen auf und kann von einem Coding-Agent ausgeführt werden.

## Implementation Tasks

- [x] 1. S3 Infrastructure Setup
  - Deploy S3 buckets using CDK stack
  - Verify bucket accessibility and security settings
  - Configure CloudFront distribution for reports bucket
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Lambda Function Development
  - [x] 2.1 Create presigned URL Lambda function
    - Implement `matbakh-get-presigned-url` Lambda handler
    - Add input validation for bucket, filename, contentType
    - Integrate with existing pg-client-layer for database access
    - Add user permission validation against RDS
    - _Requirements: 2.1, 2.2, 2.4_

  - [x] 2.2 Implement security and error handling
    - Add file type validation (MIME type whitelist)
    - Implement file size limits (10MB default)
    - Add rate limiting per user
    - Create comprehensive error responses with proper HTTP codes
    - _Requirements: 2.5, 5.1, 5.2_

  - [x] 2.3 Deploy and test Lambda function
    - Deploy Lambda with VPC configuration
    - Add IAM policies for S3 bucket access
    - Create unit tests for all validation scenarios
    - Test presigned URL generation and expiration
    - _Requirements: 2.3, 7.1_

- [x] 3. Database Schema Migration
  - [x] 3.1 Create user_uploads table
    - Write SQL migration script for new user_uploads table
    - Add indexes for performance (user_id, partner_id, upload_type)
    - Create foreign key constraints to existing tables
    - _Requirements: 4.2, 4.5_

  - [x] 3.2 Update existing tables with S3 columns
    - Add s3_url columns to business_profiles table
    - Add s3_url columns to visibility_check_leads table
    - Create migration script for existing data transformation
    - _Requirements: 4.1, 4.3_

  - [x] 3.3 Execute database migrations
    - Run migration scripts against RDS instance
    - Verify data integrity after migration
    - Create rollback scripts for safety
    - _Requirements: 4.4_

- [x] 4. Frontend S3 Upload Library
  - [x] 4.1 Create core S3 upload library
    - Implement `src/lib/s3-upload.ts` with TypeScript interfaces
    - Add file validation functions (size, MIME type)
    - Implement presigned URL request logic
    - Add progress tracking for uploads
    - _Requirements: 3.6, 3.7_

  - [x] 4.2 Add error handling and retry logic
    - Implement exponential backoff for failed uploads
    - Add comprehensive error messages for users
    - Create upload cancellation functionality
    - Add network connectivity checks
    - _Requirements: 3.7_

  - [x] 4.3 Create upload utility functions
    - Add image compression before upload
    - Implement multipart upload for large files (>5MB)
    - Add file preview generation
    - Create upload progress UI components
    - _Requirements: 6.2, 6.3_

- [x] 5. Custom React Hooks
  - [x] 5.1 Implement useS3Upload hook
    - Create hook with upload state management
    - Add progress tracking and error handling
    - Implement upload queue for multiple files
    - Add success/error callbacks
    - _Requirements: 3.5_

  - [x] 5.2 Implement useAvatar hook
    - Create avatar-specific upload logic
    - Add image resizing and optimization
    - Implement avatar deletion functionality
    - Add fallback avatar handling
    - _Requirements: 3.5_

  - [x] 5.3 Create additional utility hooks
    - Implement useFilePreview for image/PDF preview
    - Create useUploadHistory for tracking user uploads
    - Add useS3FileAccess for secure file URL generation
    - _Requirements: 3.7_

- [x] 6. React UI Components
  - [x] 6.1 Create ImageUpload component
    - Build drag-and-drop image upload interface
    - Add image preview and cropping functionality
    - Implement upload progress indicator
    - Add validation error display
    - _Requirements: 3.4, 3.7_

  - [x] 6.2 Create FileInput component
    - Build general file upload component
    - Add support for multiple file selection
    - Implement file type filtering
    - Add upload queue management UI
    - _Requirements: 3.4_

  - [x] 6.3 Create upload management components
    - Build UploadProgress component with cancel option
    - Create FilePreview component for different file types
    - Implement UploadHistory component for user files
    - Add bulk upload management interface
    - _Requirements: 3.7, 3.8_

- [x] 7. Integration and Migration
  - [x] 7.1 Remove Supabase Storage dependencies
    - Identify and remove all `supabase.storage.*` calls
    - Update import statements to use new S3 library
    - Remove Supabase storage configuration
    - _Requirements: 3.1_

  - [x] 7.2 Update existing components to use S3
    - Migrate avatar upload functionality in user profiles
    - Update business profile logo uploads
    - Convert document upload features to S3
    - Update admin panel file management
    - _Requirements: 3.2, 3.3_

  - [x] 7.3 Implement file URL migration
    - Create script to migrate existing file references
    - Update database records with new S3 URLs
    - Implement fallback for missing files
    - Add data validation for migrated URLs
    - _Requirements: 4.3, 4.4_

- [x] 8. Testing and Validation
  - [x] 8.1 Write comprehensive unit tests
    - Test Lambda function with various input scenarios
    - Test S3 upload library functions
    - Test React hooks with different states
    - Test UI components with user interactions
    - _Requirements: 7.1, 7.2_

  - [x] 8.2 Create integration tests
    - Test complete upload workflow from frontend to S3
    - Test file access through CloudFront
    - Test error scenarios and recovery
    - Test concurrent upload handling
    - _Requirements: 7.2_

  - [x] 8.3 Perform end-to-end testing
    - Test user avatar upload and display
    - Test business profile file management
    - Test report generation and access
    - Test file deletion and cleanup
    - _Requirements: 7.3_

- [x] 9. Security and Compliance Validation
  - [x] 9.1 Validate DSGVO compliance
    - Test file deletion for user data removal
    - Verify presigned URL expiration
    - Test access control for private files
    - Validate audit logging functionality
    - _Requirements: 5.4_

  - [x] 9.2 Security testing
    - Test file upload size limits
    - Verify MIME type validation
    - Test unauthorized access attempts
    - Validate CORS configuration
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 9.3 Performance testing
    - Test large file upload performance
    - Validate CloudFront caching behavior
    - Test concurrent upload limits
    - Measure upload success rates
    - _Requirements: 6.1, 6.2_

- [x] 10. Production Deployment
  - [x] 10.1 Deploy infrastructure to production
    - Deploy S3 buckets using CDK stack
    - Deploy Lambda function with proper IAM roles
    - Configure CloudFront distribution
    - Verify all AWS resources are accessible
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [x] 10.2 Deploy frontend changes
    - Build and deploy updated React application
    - Verify S3 upload functionality in production
    - Test file access through production URLs
    - Monitor error rates and performance
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 10.3 Execute production data migration
    - Run database migration scripts
    - Migrate existing file references to S3 URLs
    - Validate data integrity after migration
    - Monitor system performance post-migration
    - _Requirements: 4.1, 4.2, 4.3_

- [x] 11. Monitoring and Documentation
  - [x] 11.1 Set up monitoring and alerts
    - Configure CloudWatch metrics for S3 operations
    - Set up alerts for upload failures
    - Monitor Lambda function performance
    - Track CloudFront cache hit rates
    - _Requirements: 6.4_

  - [x] 11.2 Create operational documentation
    - Document S3 bucket structure and policies
    - Create troubleshooting guide for upload issues
    - Document backup and recovery procedures
    - Create user guide for new upload features
    - _Requirements: 8.7_

  - [x] 11.3 Final validation and cleanup
    - Verify all Supabase Storage dependencies removed
    - Confirm no data loss during migration
    - Validate all upload workflows function correctly
    - Remove temporary migration scripts and files
    - _Requirements: 8.8_

## Success Criteria

✅ All uploads (User, CM, Admin, AI) land securely in S3  
✅ No dependency on Supabase Storage remains  
✅ Presigned upload works DSGVO-compliant  
✅ Avatar uploads and images work via S3  
✅ Media files can be delivered via CDN (CloudFront)  
✅ Complete test coverage for all upload scenarios  
✅ Documentation for deployment and maintenance available  
✅ Migration focus: Only S3-Storage, other Supabase dependencies remain for separate phases