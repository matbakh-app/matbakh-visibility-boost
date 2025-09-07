#!/bin/bash

# Rollback S3 File Storage Migration Database Changes
# Requirements: 4.4 (Create rollback scripts for safety)
# Date: 2025-01-31
# WARNING: This will permanently remove all S3-related schema changes and data!

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="$SCRIPT_DIR/rollback_$(date +%Y%m%d_%H%M%S).log"

# Database connection parameters
DB_HOST="${DB_HOST:-matbakh-db.chq6q4cs0evx.eu-central-1.rds.amazonaws.com}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-postgres}"
DB_USER="${DB_USER:-postgres}"

# Function to log messages
log() {
    echo -e "$1" | tee -a "$LOG_FILE"
}

# Function to prompt for confirmation
confirm_rollback() {
    log "${RED}WARNING: This will permanently remove all S3-related database changes!${NC}"
    log "${RED}This includes:${NC}"
    log "  - user_uploads table and all its data"
    log "  - S3 URL columns from business_profiles, visibility_check_leads, business_partners"
    log "  - All S3-related indexes and constraints"
    log "  - Migration tracking tables and data"
    log ""
    log "${YELLOW}This action cannot be undone!${NC}"
    log ""
    
    read -p "Are you absolutely sure you want to proceed? Type 'ROLLBACK' to confirm: " confirmation
    
    if [ "$confirmation" != "ROLLBACK" ]; then
        log "${GREEN}Rollback cancelled by user.${NC}"
        exit 0
    fi
    
    log "${YELLOW}Proceeding with rollback...${NC}"
}

# Function to verify database connection
verify_connection() {
    log "${YELLOW}Verifying database connection...${NC}"
    
    if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT version();" >> "$LOG_FILE" 2>&1; then
        log "${GREEN}✓ Database connection successful${NC}"
        return 0
    else
        log "${RED}✗ Database connection failed${NC}"
        log "${RED}Please check your database credentials and network connectivity${NC}"
        return 1
    fi
}

# Function to create backup before rollback
create_backup_before_rollback() {
    log "${YELLOW}Creating backup of S3-related data before rollback...${NC}"
    
    local backup_file="$SCRIPT_DIR/backup_before_rollback_$(date +%Y%m%d_%H%M%S).sql"
    
    # Create a comprehensive backup of all S3-related data
    cat > "$backup_file" << 'EOF'
-- Backup of S3-related data before rollback
-- Generated automatically before rollback execution

-- Backup user_uploads table
\echo 'Backing up user_uploads table...'
CREATE TABLE user_uploads_backup AS SELECT * FROM user_uploads;

-- Backup S3 columns from business_profiles
\echo 'Backing up S3 columns from business_profiles...'
SELECT 
    id,
    avatar_s3_url,
    logo_s3_url,
    document_s3_urls
FROM business_profiles 
WHERE avatar_s3_url IS NOT NULL 
   OR logo_s3_url IS NOT NULL 
   OR document_s3_urls != '[]'::jsonb;

-- Backup S3 columns from visibility_check_leads
\echo 'Backing up S3 columns from visibility_check_leads...'
SELECT 
    id,
    report_s3_url,
    report_expires_at,
    screenshot_s3_urls
FROM visibility_check_leads 
WHERE report_s3_url IS NOT NULL 
   OR report_expires_at IS NOT NULL 
   OR screenshot_s3_urls != '[]'::jsonb;

-- Backup S3 columns from business_partners
\echo 'Backing up S3 columns from business_partners...'
SELECT 
    id,
    contract_s3_urls,
    verification_document_s3_urls
FROM business_partners 
WHERE contract_s3_urls != '[]'::jsonb 
   OR verification_document_s3_urls != '[]'::jsonb;

-- Backup migration log
\echo 'Backing up migration log...'
CREATE TABLE s3_migration_log_backup AS SELECT * FROM s3_migration_log;
EOF

    if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$backup_file" >> "$LOG_FILE" 2>&1; then
        log "${GREEN}✓ Backup created: $backup_file${NC}"
        echo "$backup_file"
        return 0
    else
        log "${RED}✗ Backup creation failed${NC}"
        return 1
    fi
}

# Function to execute rollback
execute_rollback() {
    local rollback_file="$SCRIPT_DIR/rollback_s3_migration.sql"
    
    log "${YELLOW}Executing rollback script...${NC}"
    
    if [ ! -f "$rollback_file" ]; then
        log "${RED}Error: Rollback script not found: $rollback_file${NC}"
        return 1
    fi
    
    if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$rollback_file" >> "$LOG_FILE" 2>&1; then
        log "${GREEN}✓ Rollback executed successfully${NC}"
        return 0
    else
        log "${RED}✗ Rollback execution failed${NC}"
        log "${RED}Check log file for details: $LOG_FILE${NC}"
        return 1
    fi
}

# Main execution function
main() {
    log "${RED}S3 File Storage Migration Rollback${NC}"
    log "Timestamp: $(date)"
    log "Log file: $LOG_FILE"
    
    # Check required environment variables
    if [ -z "$DB_PASSWORD" ]; then
        log "${RED}Error: DB_PASSWORD environment variable is required${NC}"
        log "Please set DB_PASSWORD before running this script"
        exit 1
    fi
    
    # Confirm rollback
    confirm_rollback
    
    # Verify database connection
    if ! verify_connection; then
        exit 1
    fi
    
    # Create backup before rollback
    local backup_file
    if backup_file=$(create_backup_before_rollback); then
        log "Backup file: $backup_file"
    else
        log "${RED}Backup creation failed. Aborting rollback for safety.${NC}"
        exit 1
    fi
    
    # Execute rollback
    if execute_rollback; then
        log "${GREEN}✓ Rollback completed successfully!${NC}"
        log ""
        log "${GREEN}Rollback Summary:${NC}"
        log "- Removed user_uploads table and all related objects"
        log "- Removed S3 columns from business_profiles, visibility_check_leads, business_partners"
        log "- Removed all S3-related indexes and constraints"
        log "- Removed migration tracking tables and functions"
        log ""
        log "Backup file: $backup_file"
        log ""
        log "${YELLOW}Note: Any files that were uploaded to S3 are still there.${NC}"
        log "${YELLOW}You may need to clean up S3 buckets manually if desired.${NC}"
    else
        log "${RED}Rollback failed. Database may be in an inconsistent state.${NC}"
        log "Backup file: $backup_file"
        log "Please review the log file and consider manual intervention."
        exit 1
    fi
}

# Execute main function
main "$@"