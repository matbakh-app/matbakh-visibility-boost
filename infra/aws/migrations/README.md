# S3 File Storage Migration - Database Schema

This directory contains all database migration scripts for the S3 File Storage Migration (Phase A4).

## Overview

The migration adds support for S3 file storage by:
1. Creating a new `user_uploads` table to track all file uploads
2. Adding S3 URL columns to existing tables
3. Setting up migration tracking and data transformation utilities

## Files

### Migration Scripts
- `001_create_user_uploads_table.sql` - Creates the main user_uploads table with indexes and constraints
- `002_add_s3_columns_to_existing_tables.sql` - Adds S3 URL columns to existing tables
- `003_migrate_existing_data_to_s3.sql` - Prepares existing data for S3 migration

### Execution Scripts
- `execute_migrations.sh` - Main script to run all migrations safely
- `rollback_migrations.sh` - Script to rollback all changes if needed
- `rollback_s3_migration.sql` - SQL script for rollback operations

### Verification Scripts
- `verify_data_integrity.sql` - Comprehensive verification of migration results

## Prerequisites

1. **Database Access**: Ensure you have access to the RDS PostgreSQL instance
2. **Environment Variables**: Set the following environment variables:
   ```bash
   export DB_PASSWORD="your_database_password"
   export DB_HOST="matbakh-db.chq6q4cs0evx.eu-central-1.rds.amazonaws.com"  # Optional, has default
   export DB_PORT="5432"  # Optional, has default
   export DB_NAME="postgres"  # Optional, has default
   export DB_USER="postgres"  # Optional, has default
   ```

3. **PostgreSQL Client**: Ensure `psql` and `pg_dump` are installed and accessible

## Usage

### Running the Migration

1. **Set environment variables**:
   ```bash
   export DB_PASSWORD="your_password_here"
   ```

2. **Execute the migration**:
   ```bash
   ./execute_migrations.sh
   ```

3. **Verify the results**:
   ```bash
   psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f verify_data_integrity.sql
   ```

### Rolling Back (if needed)

⚠️ **WARNING**: Rollback will permanently delete all S3-related schema changes and data!

```bash
./rollback_migrations.sh
```

## What Gets Created

### New Tables

#### `user_uploads`
Tracks all file uploads to S3 with metadata:
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key to auth.users)
- `partner_id` (UUID, Foreign Key to business_partners, nullable)
- `filename` (TEXT) - Generated filename in S3
- `original_filename` (TEXT) - Original filename from user
- `s3_url` (TEXT) - Full S3 URL
- `s3_bucket` (TEXT) - S3 bucket name
- `s3_key` (TEXT) - S3 object key
- `content_type` (TEXT) - MIME type
- `file_size` (BIGINT) - File size in bytes
- `upload_type` (TEXT) - Type: 'avatar', 'document', 'image', 'report', 'ai-generated'
- `is_public` (BOOLEAN) - Public access flag
- `uploaded_at` (TIMESTAMPTZ) - Upload timestamp
- `expires_at` (TIMESTAMPTZ, nullable) - Expiration for temporary files
- `metadata` (JSONB) - Additional metadata
- `created_at`, `updated_at` (TIMESTAMPTZ) - Audit timestamps

#### `s3_migration_log`
Tracks migration progress for existing data:
- `id` (UUID, Primary Key)
- `table_name` (TEXT) - Source table
- `record_id` (UUID) - Source record ID
- `old_url` (TEXT) - Original URL (if any)
- `new_s3_url` (TEXT) - New S3 URL
- `migration_status` (TEXT) - 'pending', 'migrated', 'failed', 'skipped'
- `error_message` (TEXT) - Error details if failed
- `migrated_at` (TIMESTAMPTZ) - Migration timestamp
- `created_at` (TIMESTAMPTZ) - Log entry timestamp

### New Columns

#### `business_profiles`
- `avatar_s3_url` (TEXT) - S3 URL for avatar image
- `logo_s3_url` (TEXT) - S3 URL for logo image
- `document_s3_urls` (JSONB) - Array of document S3 URLs

#### `visibility_check_leads`
- `report_s3_url` (TEXT) - S3 URL for generated report
- `report_expires_at` (TIMESTAMPTZ) - Report expiration date
- `screenshot_s3_urls` (JSONB) - Array of screenshot S3 URLs

#### `business_partners`
- `contract_s3_urls` (JSONB) - Array of contract document S3 URLs
- `verification_document_s3_urls` (JSONB) - Array of verification document S3 URLs

### New Views

#### `s3_migration_progress`
Shows migration progress by table and status:
```sql
SELECT * FROM s3_migration_progress;
```

### New Functions

#### `generate_s3_url(bucket_name, folder_path, file_id, file_extension)`
Helper function to generate consistent S3 URLs:
```sql
SELECT generate_s3_url('matbakh-files-profile', 'avatars/user123', gen_random_uuid(), 'jpg');
```

## Indexes Created

### `user_uploads` table:
- `idx_user_uploads_user_id` - Query by user
- `idx_user_uploads_partner_id` - Query by partner
- `idx_user_uploads_type` - Query by upload type
- `idx_user_uploads_expires` - Query by expiration
- `idx_user_uploads_bucket` - Query by S3 bucket
- `idx_user_uploads_uploaded_at` - Query by upload date

### Existing tables:
- `idx_business_profiles_avatar_s3_url` - Non-null avatar URLs
- `idx_business_profiles_logo_s3_url` - Non-null logo URLs
- `idx_visibility_check_leads_report_s3_url` - Non-null report URLs
- `idx_visibility_check_leads_report_expires_at` - Non-null expiration dates

## Safety Features

1. **Automatic Backups**: The migration script creates backups before making changes
2. **Transaction Safety**: All changes are wrapped in transactions
3. **Rollback Scripts**: Complete rollback capability
4. **Verification**: Comprehensive verification of all changes
5. **Conditional Logic**: Scripts check for existing objects before creating them

## Monitoring Migration Progress

After running the migration, you can monitor progress using:

```sql
-- Overall progress
SELECT * FROM s3_migration_progress;

-- Detailed migration log
SELECT 
    table_name,
    migration_status,
    COUNT(*) as count,
    MIN(created_at) as first_entry,
    MAX(migrated_at) as last_migration
FROM s3_migration_log 
GROUP BY table_name, migration_status
ORDER BY table_name, migration_status;

-- Failed migrations
SELECT * FROM s3_migration_log WHERE migration_status = 'failed';
```

## Next Steps

After successful database migration:

1. **Deploy S3 Infrastructure**: Run S3 bucket creation scripts
2. **Deploy Lambda Functions**: Deploy the presigned URL Lambda function
3. **File Migration**: Run scripts to transfer existing files to S3
4. **Update Application Code**: Update frontend to use new S3 upload system
5. **Testing**: Comprehensive testing of upload and access functionality

## Troubleshooting

### Common Issues

1. **Connection Failed**: Check database credentials and network connectivity
2. **Permission Denied**: Ensure database user has CREATE, ALTER, and INSERT permissions
3. **Foreign Key Errors**: Referenced tables (auth.users, business_partners) may not exist

### Log Files

All operations create detailed log files:
- Migration: `migration_YYYYMMDD_HHMMSS.log`
- Rollback: `rollback_YYYYMMDD_HHMMSS.log`

### Manual Verification

You can manually verify the migration by checking:

```sql
-- Check table exists
\dt user_uploads

-- Check columns
\d user_uploads
\d business_profiles
\d visibility_check_leads

-- Check indexes
\di *user_uploads*
\di *s3*

-- Check constraints
SELECT * FROM information_schema.table_constraints 
WHERE table_name = 'user_uploads';
```

## Requirements Mapping

This migration addresses the following requirements:
- **4.1**: S3 URL columns in existing tables
- **4.2**: New user_uploads table with proper structure
- **4.3**: Data transformation for existing records
- **4.4**: Safe execution with verification and rollback capabilities
- **4.5**: Performance indexes for efficient queries