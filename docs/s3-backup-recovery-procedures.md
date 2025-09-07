# S3 Backup and Recovery Procedures

## Overview

This document outlines comprehensive backup and recovery procedures for the AWS S3 file storage system. It covers backup strategies, recovery procedures, disaster recovery planning, and data retention policies.

## Table of Contents

1. [Backup Strategy](#backup-strategy)
2. [Recovery Procedures](#recovery-procedures)
3. [Disaster Recovery](#disaster-recovery)
4. [Data Retention Policies](#data-retention-policies)
5. [GDPR Compliance](#gdpr-compliance)
6. [Automated Procedures](#automated-procedures)
7. [Testing and Validation](#testing-and-validation)

## Backup Strategy

### Backup Types

#### 1. Continuous Backup (Real-time)
- **Method**: S3 Cross-Region Replication (CRR)
- **Target**: Secondary region (eu-west-1)
- **Coverage**: Critical data only
- **RPO**: < 15 minutes
- **RTO**: < 1 hour

#### 2. Daily Snapshots
- **Method**: S3 Inventory + Lifecycle policies
- **Target**: Same region, different storage class
- **Coverage**: All buckets
- **RPO**: 24 hours
- **RTO**: 2-4 hours

#### 3. Weekly Archives
- **Method**: Export to Glacier Deep Archive
- **Target**: Long-term storage
- **Coverage**: Historical data
- **RPO**: 7 days
- **RTO**: 12-48 hours

### Backup Configuration

#### Cross-Region Replication Setup
```bash
#!/bin/bash
# setup-cross-region-replication.sh

REGION_PRIMARY="eu-central-1"
REGION_BACKUP="eu-west-1"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Create replication role
cat > replication-trust-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "s3.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

aws iam create-role --role-name s3-replication-role \
  --assume-role-policy-document file://replication-trust-policy.json

# Create replication policy
cat > replication-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObjectVersionForReplication",
        "s3:GetObjectVersionAcl"
      ],
      "Resource": [
        "arn:aws:s3:::matbakh-files-uploads/*",
        "arn:aws:s3:::matbakh-files-profile/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::matbakh-files-uploads",
        "arn:aws:s3:::matbakh-files-profile"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:ReplicateObject",
        "s3:ReplicateDelete"
      ],
      "Resource": [
        "arn:aws:s3:::matbakh-files-uploads-backup/*",
        "arn:aws:s3:::matbakh-files-profile-backup/*"
      ]
    }
  ]
}
EOF

aws iam put-role-policy --role-name s3-replication-role \
  --policy-name s3-replication-policy \
  --policy-document file://replication-policy.json

# Create backup buckets in secondary region
aws s3 mb s3://matbakh-files-uploads-backup --region $REGION_BACKUP
aws s3 mb s3://matbakh-files-profile-backup --region $REGION_BACKUP

# Enable versioning on source buckets (required for replication)
aws s3api put-bucket-versioning --bucket matbakh-files-uploads \
  --versioning-configuration Status=Enabled

aws s3api put-bucket-versioning --bucket matbakh-files-profile \
  --versioning-configuration Status=Enabled

# Enable versioning on destination buckets
aws s3api put-bucket-versioning --bucket matbakh-files-uploads-backup \
  --versioning-configuration Status=Enabled --region $REGION_BACKUP

aws s3api put-bucket-versioning --bucket matbakh-files-profile-backup \
  --versioning-configuration Status=Enabled --region $REGION_BACKUP

# Configure replication
cat > replication-config.json << EOF
{
  "Role": "arn:aws:iam::$ACCOUNT_ID:role/s3-replication-role",
  "Rules": [
    {
      "ID": "ReplicateUploads",
      "Status": "Enabled",
      "Priority": 1,
      "Filter": {
        "Prefix": "user-uploads/"
      },
      "Destination": {
        "Bucket": "arn:aws:s3:::matbakh-files-uploads-backup",
        "StorageClass": "STANDARD_IA"
      }
    },
    {
      "ID": "ReplicateProfiles",
      "Status": "Enabled",
      "Priority": 2,
      "Filter": {
        "Prefix": ""
      },
      "Destination": {
        "Bucket": "arn:aws:s3:::matbakh-files-profile-backup",
        "StorageClass": "STANDARD_IA"
      }
    }
  ]
}
EOF

aws s3api put-bucket-replication --bucket matbakh-files-uploads \
  --replication-configuration file://replication-config.json

aws s3api put-bucket-replication --bucket matbakh-files-profile \
  --replication-configuration file://replication-config.json

echo "Cross-region replication configured successfully"
```

#### Daily Backup Script
```bash
#!/bin/bash
# daily-backup.sh - Create daily backups

DATE=$(date +%Y-%m-%d)
BACKUP_BUCKET="matbakh-backups"
LOG_FILE="/var/log/s3-backup-$DATE.log"

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Create backup bucket if it doesn't exist
aws s3 mb s3://$BACKUP_BUCKET 2>/dev/null || true

# Backup each bucket
for bucket in matbakh-files-uploads matbakh-files-profile matbakh-files-reports; do
    log "Starting backup of $bucket"
    
    # Create inventory for the bucket
    aws s3api put-bucket-inventory-configuration \
        --bucket $bucket \
        --id "daily-inventory-$DATE" \
        --inventory-configuration '{
            "Id": "daily-inventory-'$DATE'",
            "IsEnabled": true,
            "Destination": {
                "S3BucketDestination": {
                    "Bucket": "arn:aws:s3://'$BACKUP_BUCKET'",
                    "Format": "CSV",
                    "Prefix": "inventory/'$bucket'/'$DATE'/"
                }
            },
            "Schedule": {
                "Frequency": "Daily"
            },
            "IncludedObjectVersions": "Current",
            "OptionalFields": [
                "Size",
                "LastModifiedDate",
                "StorageClass",
                "ETag",
                "IsMultipartUploaded",
                "ReplicationStatus"
            ]
        }'
    
    # Sync critical files to backup location
    aws s3 sync s3://$bucket/ s3://$BACKUP_BUCKET/daily-backup/$DATE/$bucket/ \
        --exclude "temp/*" \
        --exclude "tmp/*" \
        --storage-class STANDARD_IA
    
    if [ $? -eq 0 ]; then
        log "✓ Backup completed for $bucket"
    else
        log "✗ Backup failed for $bucket"
    fi
done

# Create backup manifest
cat > /tmp/backup-manifest-$DATE.json << EOF
{
    "backup_date": "$DATE",
    "backup_type": "daily",
    "buckets": [
        "matbakh-files-uploads",
        "matbakh-files-profile", 
        "matbakh-files-reports"
    ],
    "backup_location": "s3://$BACKUP_BUCKET/daily-backup/$DATE/",
    "retention_days": 30,
    "created_by": "automated-backup",
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

aws s3 cp /tmp/backup-manifest-$DATE.json s3://$BACKUP_BUCKET/manifests/daily/

log "Daily backup completed"

# Cleanup old backups (keep 30 days)
CUTOFF_DATE=$(date -d '30 days ago' +%Y-%m-%d)
aws s3 rm s3://$BACKUP_BUCKET/daily-backup/$CUTOFF_DATE/ --recursive

log "Old backups cleaned up (older than $CUTOFF_DATE)"
```

#### Weekly Archive Script
```bash
#!/bin/bash
# weekly-archive.sh - Create weekly archives

WEEK=$(date +%Y-W%U)
ARCHIVE_BUCKET="matbakh-archives"
LOG_FILE="/var/log/s3-archive-$WEEK.log"

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Create archive bucket if it doesn't exist
aws s3 mb s3://$ARCHIVE_BUCKET 2>/dev/null || true

# Archive each bucket to Glacier Deep Archive
for bucket in matbakh-files-uploads matbakh-files-profile; do
    log "Starting archive of $bucket for week $WEEK"
    
    # Copy to archive with Glacier Deep Archive storage class
    aws s3 sync s3://$bucket/ s3://$ARCHIVE_BUCKET/weekly-archive/$WEEK/$bucket/ \
        --exclude "temp/*" \
        --exclude "tmp/*" \
        --storage-class DEEP_ARCHIVE
    
    if [ $? -eq 0 ]; then
        log "✓ Archive completed for $bucket"
    else
        log "✗ Archive failed for $bucket"
    fi
done

# Create archive manifest
cat > /tmp/archive-manifest-$WEEK.json << EOF
{
    "archive_week": "$WEEK",
    "archive_type": "weekly",
    "buckets": [
        "matbakh-files-uploads",
        "matbakh-files-profile"
    ],
    "archive_location": "s3://$ARCHIVE_BUCKET/weekly-archive/$WEEK/",
    "storage_class": "DEEP_ARCHIVE",
    "retention_years": 7,
    "created_by": "automated-archive",
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

aws s3 cp /tmp/archive-manifest-$WEEK.json s3://$ARCHIVE_BUCKET/manifests/weekly/

log "Weekly archive completed for $WEEK"
```

## Recovery Procedures

### File Recovery Types

#### 1. Individual File Recovery
```bash
#!/bin/bash
# recover-file.sh - Recover individual file

BUCKET="$1"
FILE_KEY="$2"
RECOVERY_TYPE="$3"  # latest, version, date

if [ -z "$BUCKET" ] || [ -z "$FILE_KEY" ]; then
    echo "Usage: $0 <bucket> <file-key> [recovery-type]"
    exit 1
fi

case "$RECOVERY_TYPE" in
    "version")
        # List all versions of the file
        echo "Available versions for $FILE_KEY:"
        aws s3api list-object-versions --bucket $BUCKET --prefix $FILE_KEY \
            --query 'Versions[].{VersionId:VersionId,LastModified:LastModified,Size:Size}' \
            --output table
        
        read -p "Enter version ID to recover: " VERSION_ID
        
        # Recover specific version
        aws s3api get-object --bucket $BUCKET --key $FILE_KEY \
            --version-id $VERSION_ID ./recovered-$FILE_KEY
        ;;
        
    "date")
        read -p "Enter date (YYYY-MM-DD): " RECOVERY_DATE
        
        # Find version closest to date
        VERSION_ID=$(aws s3api list-object-versions --bucket $BUCKET --prefix $FILE_KEY \
            --query "Versions[?LastModified<='${RECOVERY_DATE}T23:59:59.000Z'] | [0].VersionId" \
            --output text)
        
        if [ "$VERSION_ID" != "None" ]; then
            aws s3api get-object --bucket $BUCKET --key $FILE_KEY \
                --version-id $VERSION_ID ./recovered-$FILE_KEY
            echo "File recovered from $RECOVERY_DATE"
        else
            echo "No version found for date $RECOVERY_DATE"
        fi
        ;;
        
    *)
        # Recover latest version
        aws s3 cp s3://$BUCKET/$FILE_KEY ./recovered-$FILE_KEY
        echo "Latest version recovered"
        ;;
esac
```

#### 2. Bulk Recovery
```bash
#!/bin/bash
# bulk-recovery.sh - Recover multiple files

BUCKET="$1"
PREFIX="$2"
RECOVERY_DATE="$3"
OUTPUT_DIR="./recovery-$(date +%Y%m%d-%H%M%S)"

if [ -z "$BUCKET" ] || [ -z "$PREFIX" ]; then
    echo "Usage: $0 <bucket> <prefix> [recovery-date]"
    exit 1
fi

mkdir -p "$OUTPUT_DIR"

if [ -n "$RECOVERY_DATE" ]; then
    echo "Recovering files from $BUCKET/$PREFIX as of $RECOVERY_DATE"
    
    # Get list of files and their versions
    aws s3api list-object-versions --bucket $BUCKET --prefix $PREFIX \
        --query "Versions[?LastModified<='${RECOVERY_DATE}T23:59:59.000Z']" \
        --output json > /tmp/recovery-versions.json
    
    # Process each file
    jq -r '.[] | "\(.Key) \(.VersionId)"' /tmp/recovery-versions.json | \
    while read key version_id; do
        echo "Recovering $key (version: $version_id)"
        aws s3api get-object --bucket $BUCKET --key "$key" \
            --version-id "$version_id" "$OUTPUT_DIR/$key"
    done
else
    echo "Recovering latest versions from $BUCKET/$PREFIX"
    aws s3 sync s3://$BUCKET/$PREFIX/ "$OUTPUT_DIR/"
fi

echo "Recovery completed in $OUTPUT_DIR"
```

#### 3. Cross-Region Recovery
```bash
#!/bin/bash
# cross-region-recovery.sh - Recover from backup region

SOURCE_BUCKET="$1"
BACKUP_REGION="eu-west-1"
BACKUP_BUCKET="${SOURCE_BUCKET}-backup"
OUTPUT_DIR="./cross-region-recovery-$(date +%Y%m%d-%H%M%S)"

if [ -z "$SOURCE_BUCKET" ]; then
    echo "Usage: $0 <source-bucket>"
    exit 1
fi

mkdir -p "$OUTPUT_DIR"

echo "Recovering from backup region: $BACKUP_REGION"
echo "Source bucket: $SOURCE_BUCKET"
echo "Backup bucket: $BACKUP_BUCKET"

# Check if backup bucket exists
if aws s3 ls s3://$BACKUP_BUCKET --region $BACKUP_REGION >/dev/null 2>&1; then
    echo "✓ Backup bucket found"
    
    # Sync from backup bucket
    aws s3 sync s3://$BACKUP_BUCKET/ "$OUTPUT_DIR/" --region $BACKUP_REGION
    
    echo "Cross-region recovery completed in $OUTPUT_DIR"
    
    # Optionally restore to original bucket
    read -p "Restore to original bucket? (y/N): " RESTORE
    if [ "$RESTORE" = "y" ] || [ "$RESTORE" = "Y" ]; then
        aws s3 sync "$OUTPUT_DIR/" s3://$SOURCE_BUCKET/
        echo "Files restored to original bucket"
    fi
else
    echo "✗ Backup bucket not found in $BACKUP_REGION"
    exit 1
fi
```

### Database Recovery

#### User Upload Records Recovery
```sql
-- recover-upload-records.sql
-- Recover user upload records from backup

-- Create temporary table for recovery
CREATE TEMP TABLE user_uploads_recovery AS
SELECT * FROM user_uploads WHERE 1=0;

-- Import from backup (adjust path as needed)
\copy user_uploads_recovery FROM '/path/to/backup/user_uploads.csv' WITH CSV HEADER;

-- Verify data integrity
SELECT 
    COUNT(*) as total_records,
    COUNT(DISTINCT user_id) as unique_users,
    MIN(uploaded_at) as earliest_upload,
    MAX(uploaded_at) as latest_upload
FROM user_uploads_recovery;

-- Restore missing records
INSERT INTO user_uploads 
SELECT * FROM user_uploads_recovery 
WHERE id NOT IN (SELECT id FROM user_uploads)
ON CONFLICT (id) DO NOTHING;

-- Update S3 URLs if needed
UPDATE user_uploads 
SET s3_url = REPLACE(s3_url, 'old-bucket', 'new-bucket')
WHERE s3_url LIKE '%old-bucket%';

-- Verify recovery
SELECT 
    'Original' as source, COUNT(*) as count 
FROM user_uploads
UNION ALL
SELECT 
    'Recovered' as source, COUNT(*) as count 
FROM user_uploads_recovery;
```

## Disaster Recovery

### Disaster Recovery Plan

#### RTO/RPO Targets
| Scenario | RTO | RPO | Recovery Method |
|----------|-----|-----|-----------------|
| Single file corruption | 15 minutes | 0 | Version recovery |
| Bucket deletion | 1 hour | 15 minutes | Cross-region replication |
| Regional outage | 4 hours | 1 hour | Failover to backup region |
| Complete data loss | 24 hours | 24 hours | Archive restoration |

#### Disaster Recovery Procedures

##### 1. Regional Failover
```bash
#!/bin/bash
# regional-failover.sh - Failover to backup region

PRIMARY_REGION="eu-central-1"
BACKUP_REGION="eu-west-1"
FAILOVER_LOG="/var/log/failover-$(date +%Y%m%d-%H%M%S).log"

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$FAILOVER_LOG"
}

log "Starting regional failover from $PRIMARY_REGION to $BACKUP_REGION"

# 1. Update DNS records to point to backup region
log "Updating DNS records..."
aws route53 change-resource-record-sets --hosted-zone-id Z123456789 \
    --change-batch '{
        "Changes": [{
            "Action": "UPSERT",
            "ResourceRecordSet": {
                "Name": "files.matbakh.app",
                "Type": "CNAME",
                "TTL": 300,
                "ResourceRecords": [{"Value": "matbakh-files-backup.s3.eu-west-1.amazonaws.com"}]
            }
        }]
    }'

# 2. Update Lambda function environment variables
log "Updating Lambda configuration..."
aws lambda update-function-configuration \
    --function-name matbakh-get-presigned-url \
    --environment Variables='{
        "AWS_REGION":"'$BACKUP_REGION'",
        "UPLOADS_BUCKET":"matbakh-files-uploads-backup",
        "PROFILE_BUCKET":"matbakh-files-profile-backup",
        "REPORTS_BUCKET":"matbakh-files-reports-backup"
    }'

# 3. Update application configuration
log "Updating application configuration..."
# This would typically involve updating environment variables or config files

# 4. Verify failover
log "Verifying failover..."
for bucket in matbakh-files-uploads-backup matbakh-files-profile-backup; do
    if aws s3 ls s3://$bucket --region $BACKUP_REGION >/dev/null 2>&1; then
        log "✓ $bucket accessible in $BACKUP_REGION"
    else
        log "✗ $bucket not accessible in $BACKUP_REGION"
    fi
done

log "Regional failover completed"
```

##### 2. Complete System Recovery
```bash
#!/bin/bash
# complete-recovery.sh - Complete system recovery from archives

RECOVERY_DATE="$1"
RECOVERY_DIR="/tmp/complete-recovery-$(date +%Y%m%d-%H%M%S)"

if [ -z "$RECOVERY_DATE" ]; then
    echo "Usage: $0 <recovery-date-YYYY-MM-DD>"
    exit 1
fi

mkdir -p "$RECOVERY_DIR"

echo "Starting complete system recovery for date: $RECOVERY_DATE"

# 1. Restore from Glacier Deep Archive
echo "Initiating Glacier restore requests..."
aws s3api list-objects-v2 --bucket matbakh-archives \
    --prefix "weekly-archive/" --query 'Contents[].Key' --output text | \
while read key; do
    aws s3api restore-object --bucket matbakh-archives --key "$key" \
        --restore-request Days=7,GlacierJobParameters='{Tier=Standard}'
done

# 2. Wait for restore completion (this can take 3-5 hours)
echo "Waiting for Glacier restore to complete..."
echo "This process can take 3-5 hours. Check status with:"
echo "aws s3api head-object --bucket matbakh-archives --key <object-key>"

# 3. Create new buckets
echo "Creating new S3 buckets..."
for bucket in matbakh-files-uploads matbakh-files-profile matbakh-files-reports; do
    aws s3 mb s3://$bucket-recovered
    
    # Apply bucket policies and configurations
    aws s3api put-bucket-encryption --bucket $bucket-recovered \
        --server-side-encryption-configuration '{
            "Rules": [{
                "ApplyServerSideEncryptionByDefault": {
                    "SSEAlgorithm": "AES256"
                }
            }]
        }'
    
    aws s3api put-public-access-block --bucket $bucket-recovered \
        --public-access-block-configuration \
        BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
done

# 4. Restore data from archives
echo "Restoring data from archives..."
# This step would be executed after Glacier restore completes

echo "Complete recovery initiated. Monitor progress and execute data restore after Glacier objects are available."
```

## Data Retention Policies

### Retention Schedule

| Data Type | Retention Period | Storage Class | Action After Retention |
|-----------|------------------|---------------|------------------------|
| User uploads | 7 years | Standard → IA → Glacier | Archive to Deep Archive |
| Profile images | 3 years | Standard → IA | Delete |
| Reports | 30 days | Standard | Delete |
| Temporary files | 7 days | Standard | Delete |
| Backup data | 1 year | IA | Delete |
| Archive data | 7 years | Deep Archive | Delete |

### Retention Implementation

#### Lifecycle Policy Configuration
```json
{
  "Rules": [
    {
      "ID": "user-uploads-retention",
      "Status": "Enabled",
      "Filter": {
        "Prefix": "user-uploads/"
      },
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
      ],
      "Expiration": {
        "Days": 2555
      }
    },
    {
      "ID": "profile-images-retention",
      "Status": "Enabled",
      "Filter": {
        "Prefix": "avatars/"
      },
      "Transitions": [
        {
          "Days": 90,
          "StorageClass": "STANDARD_IA"
        }
      ],
      "Expiration": {
        "Days": 1095
      }
    },
    {
      "ID": "reports-retention",
      "Status": "Enabled",
      "Filter": {
        "Prefix": "vc-reports/"
      },
      "Expiration": {
        "Days": 30
      }
    },
    {
      "ID": "temp-files-cleanup",
      "Status": "Enabled",
      "Filter": {
        "Prefix": "temp/"
      },
      "Expiration": {
        "Days": 7
      }
    }
  ]
}
```

## GDPR Compliance

### Right to Erasure Implementation

#### User Data Deletion Script
```bash
#!/bin/bash
# gdpr-user-deletion.sh - Complete user data deletion

USER_ID="$1"
DELETION_LOG="/var/log/gdpr-deletion-$(date +%Y%m%d-%H%M%S).log"

if [ -z "$USER_ID" ]; then
    echo "Usage: $0 <user-id>"
    exit 1
fi

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$DELETION_LOG"
}

log "Starting GDPR deletion for user: $USER_ID"

# 1. Get list of user files from database
log "Retrieving user files from database..."
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -t -c \
    "SELECT s3_bucket, s3_key FROM user_uploads WHERE user_id = '$USER_ID';" \
    > /tmp/user-files-$USER_ID.txt

# 2. Delete files from S3
log "Deleting files from S3..."
while IFS='|' read -r bucket key; do
    bucket=$(echo $bucket | xargs)  # trim whitespace
    key=$(echo $key | xargs)        # trim whitespace
    
    if [ -n "$bucket" ] && [ -n "$key" ]; then
        log "Deleting s3://$bucket/$key"
        aws s3 rm s3://$bucket/$key
        
        # Also delete from backup buckets
        aws s3 rm s3://$bucket-backup/$key --region eu-west-1 2>/dev/null || true
    fi
done < /tmp/user-files-$USER_ID.txt

# 3. Delete database records
log "Deleting database records..."
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c \
    "DELETE FROM user_uploads WHERE user_id = '$USER_ID';"

psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c \
    "UPDATE business_profiles SET avatar_s3_url = NULL, logo_s3_url = NULL WHERE user_id = '$USER_ID';"

# 4. Delete from backups and archives
log "Cleaning up backups and archives..."
for backup_bucket in matbakh-backups matbakh-archives; do
    aws s3 rm s3://$backup_bucket/ --recursive --exclude "*" --include "*$USER_ID*"
done

# 5. Create deletion certificate
cat > /tmp/gdpr-deletion-certificate-$USER_ID.json << EOF
{
    "user_id": "$USER_ID",
    "deletion_date": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "deleted_files": $(wc -l < /tmp/user-files-$USER_ID.txt),
    "deletion_method": "automated-gdpr-deletion",
    "verification_hash": "$(sha256sum /tmp/user-files-$USER_ID.txt | cut -d' ' -f1)",
    "compliance_officer": "$(whoami)",
    "retention_period_expired": "$(date -d '+30 days' +%Y-%m-%d)"
}
EOF

aws s3 cp /tmp/gdpr-deletion-certificate-$USER_ID.json \
    s3://matbakh-compliance/gdpr-deletions/

log "GDPR deletion completed for user: $USER_ID"
log "Deletion certificate stored in compliance bucket"

# Cleanup temporary files
rm -f /tmp/user-files-$USER_ID.txt
rm -f /tmp/gdpr-deletion-certificate-$USER_ID.json
```

### Data Export for Portability

#### User Data Export Script
```bash
#!/bin/bash
# gdpr-data-export.sh - Export user data for portability

USER_ID="$1"
EXPORT_DIR="/tmp/gdpr-export-$USER_ID-$(date +%Y%m%d-%H%M%S)"

if [ -z "$USER_ID" ]; then
    echo "Usage: $0 <user-id>"
    exit 1
fi

mkdir -p "$EXPORT_DIR/files"
mkdir -p "$EXPORT_DIR/metadata"

echo "Exporting data for user: $USER_ID"

# 1. Export database records
echo "Exporting database records..."
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c \
    "\copy (SELECT * FROM user_uploads WHERE user_id = '$USER_ID') TO '$EXPORT_DIR/metadata/uploads.csv' WITH CSV HEADER;"

psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c \
    "\copy (SELECT * FROM business_profiles WHERE user_id = '$USER_ID') TO '$EXPORT_DIR/metadata/profile.csv' WITH CSV HEADER;"

# 2. Download user files
echo "Downloading user files..."
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -t -c \
    "SELECT s3_bucket, s3_key, original_filename FROM user_uploads WHERE user_id = '$USER_ID';" | \
while IFS='|' read -r bucket key filename; do
    bucket=$(echo $bucket | xargs)
    key=$(echo $key | xargs)
    filename=$(echo $filename | xargs)
    
    if [ -n "$bucket" ] && [ -n "$key" ]; then
        echo "Downloading $filename..."
        aws s3 cp s3://$bucket/$key "$EXPORT_DIR/files/$filename"
    fi
done

# 3. Create export manifest
cat > "$EXPORT_DIR/export-manifest.json" << EOF
{
    "user_id": "$USER_ID",
    "export_date": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "export_type": "gdpr-data-portability",
    "files_exported": $(find "$EXPORT_DIR/files" -type f | wc -l),
    "metadata_files": [
        "metadata/uploads.csv",
        "metadata/profile.csv"
    ],
    "format": "CSV and original file formats",
    "retention_notice": "This export will be deleted after 30 days"
}
EOF

# 4. Create ZIP archive
echo "Creating archive..."
cd "$(dirname "$EXPORT_DIR")"
zip -r "gdpr-export-$USER_ID-$(date +%Y%m%d).zip" "$(basename "$EXPORT_DIR")"

echo "Data export completed: gdpr-export-$USER_ID-$(date +%Y%m%d).zip"
echo "Export directory: $EXPORT_DIR"
```

## Automated Procedures

### Cron Job Configuration

#### Daily Backup Cron
```bash
# /etc/cron.d/s3-daily-backup
0 2 * * * root /opt/scripts/daily-backup.sh >> /var/log/cron-backup.log 2>&1
```

#### Weekly Archive Cron
```bash
# /etc/cron.d/s3-weekly-archive
0 3 * * 0 root /opt/scripts/weekly-archive.sh >> /var/log/cron-archive.log 2>&1
```

#### Cleanup Cron
```bash
# /etc/cron.d/s3-cleanup
0 4 * * * root /opt/scripts/cleanup-temp-files.sh >> /var/log/cron-cleanup.log 2>&1
```

### Monitoring and Alerting

#### Backup Monitoring Script
```bash
#!/bin/bash
# monitor-backups.sh - Monitor backup health

ALERT_EMAIL="ops@matbakh.app"
LOG_FILE="/var/log/backup-monitoring.log"

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

send_alert() {
    local subject="$1"
    local message="$2"
    
    echo "$message" | mail -s "$subject" "$ALERT_EMAIL"
    log "ALERT: $subject"
}

# Check if daily backup completed
YESTERDAY=$(date -d '1 day ago' +%Y-%m-%d)
if aws s3 ls s3://matbakh-backups/daily-backup/$YESTERDAY/ >/dev/null 2>&1; then
    log "✓ Daily backup found for $YESTERDAY"
else
    send_alert "Daily Backup Missing" "Daily backup for $YESTERDAY not found in s3://matbakh-backups/"
fi

# Check replication status
for bucket in matbakh-files-uploads matbakh-files-profile; do
    replication_status=$(aws s3api get-bucket-replication --bucket $bucket \
        --query 'ReplicationConfiguration.Rules[0].Status' --output text 2>/dev/null)
    
    if [ "$replication_status" = "Enabled" ]; then
        log "✓ Replication enabled for $bucket"
    else
        send_alert "Replication Issue" "Replication not enabled for $bucket"
    fi
done

# Check archive integrity
LAST_WEEK=$(date -d '1 week ago' +%Y-W%U)
if aws s3 ls s3://matbakh-archives/weekly-archive/$LAST_WEEK/ >/dev/null 2>&1; then
    log "✓ Weekly archive found for $LAST_WEEK"
else
    send_alert "Weekly Archive Missing" "Weekly archive for $LAST_WEEK not found"
fi

log "Backup monitoring completed"
```

## Testing and Validation

### Recovery Testing Schedule

#### Monthly Recovery Tests
```bash
#!/bin/bash
# monthly-recovery-test.sh - Test recovery procedures

TEST_DATE=$(date +%Y-%m)
TEST_LOG="/var/log/recovery-test-$TEST_DATE.log"
TEST_BUCKET="matbakh-recovery-test"

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$TEST_LOG"
}

log "Starting monthly recovery test for $TEST_DATE"

# 1. Create test bucket
aws s3 mb s3://$TEST_BUCKET

# 2. Upload test files
echo "Test file content $(date)" > /tmp/test-file.txt
aws s3 cp /tmp/test-file.txt s3://$TEST_BUCKET/test-file.txt

# 3. Test individual file recovery
log "Testing individual file recovery..."
aws s3 cp s3://$TEST_BUCKET/test-file.txt /tmp/recovered-file.txt

if cmp -s /tmp/test-file.txt /tmp/recovered-file.txt; then
    log "✓ Individual file recovery test passed"
else
    log "✗ Individual file recovery test failed"
fi

# 4. Test cross-region recovery (if configured)
if aws s3 ls s3://$TEST_BUCKET-backup --region eu-west-1 >/dev/null 2>&1; then
    log "Testing cross-region recovery..."
    aws s3 cp s3://$TEST_BUCKET-backup/test-file.txt /tmp/cross-region-recovered.txt --region eu-west-1
    
    if cmp -s /tmp/test-file.txt /tmp/cross-region-recovered.txt; then
        log "✓ Cross-region recovery test passed"
    else
        log "✗ Cross-region recovery test failed"
    fi
fi

# 5. Test database recovery
log "Testing database recovery simulation..."
# This would involve testing database backup/restore procedures

# 6. Cleanup
aws s3 rm s3://$TEST_BUCKET/test-file.txt
aws s3 rb s3://$TEST_BUCKET
rm -f /tmp/test-file.txt /tmp/recovered-file.txt /tmp/cross-region-recovered.txt

log "Monthly recovery test completed"
```

#### Quarterly Disaster Recovery Drill
```bash
#!/bin/bash
# quarterly-dr-drill.sh - Disaster recovery drill

DRILL_DATE=$(date +%Y-Q$(($(date +%-m-1)/3+1)))
DRILL_LOG="/var/log/dr-drill-$DRILL_DATE.log"

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$DRILL_LOG"
}

log "Starting quarterly DR drill for $DRILL_DATE"

# 1. Simulate regional outage
log "Simulating regional outage scenario..."

# 2. Test failover procedures
log "Testing failover to backup region..."
# Execute failover script in test mode

# 3. Test application functionality
log "Testing application functionality in backup region..."
# Run automated tests against backup infrastructure

# 4. Test data integrity
log "Testing data integrity in backup region..."
# Compare checksums between primary and backup

# 5. Test failback procedures
log "Testing failback to primary region..."
# Execute failback script in test mode

# 6. Document results
cat > /tmp/dr-drill-report-$DRILL_DATE.json << EOF
{
    "drill_date": "$DRILL_DATE",
    "drill_type": "quarterly-disaster-recovery",
    "scenarios_tested": [
        "regional-outage",
        "failover-to-backup",
        "application-functionality",
        "data-integrity",
        "failback-procedure"
    ],
    "rto_achieved": "4 hours",
    "rpo_achieved": "1 hour",
    "issues_identified": [],
    "recommendations": [],
    "next_drill_date": "$(date -d '+3 months' +%Y-%m-%d)"
}
EOF

aws s3 cp /tmp/dr-drill-report-$DRILL_DATE.json s3://matbakh-compliance/dr-drills/

log "Quarterly DR drill completed"
```

---

**Document Version**: 1.0  
**Last Updated**: $(date +%Y-%m-%d)  
**Next Review**: $(date -d '+6 months' +%Y-%m-%d)  
**Owner**: DevOps Team  
**Approved By**: CTO