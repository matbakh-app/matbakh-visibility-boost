#!/bin/bash

# Execute S3 File Storage Migration Database Scripts
# Requirements: 4.4
# Date: 2025-01-31

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIGRATIONS_DIR="$SCRIPT_DIR"
LOG_FILE="$SCRIPT_DIR/migration_$(date +%Y%m%d_%H%M%S).log"

# Database connection parameters
DB_HOST="${DB_HOST:-matbakh-db.chq6q4cs0evx.eu-central-1.rds.amazonaws.com}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-postgres}"
DB_USER="${DB_USER:-postgres}"

# Function to log messages
log() {
    echo -e "$1" | tee -a "$LOG_FILE"
}

# Function to execute SQL file
execute_sql_file() {
    local sql_file="$1"
    local description="$2"
    
    log "${YELLOW}Executing: $description${NC}"
    log "File: $sql_file"
    
    if [ ! -f "$sql_file" ]; then
        log "${RED}Error: SQL file not found: $sql_file${NC}"
        return 1
    fi
    
    # Execute the SQL file
    if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$sql_file" >> "$LOG_FILE" 2>&1; then
        log "${GREEN}✓ Successfully executed: $description${NC}"
        return 0
    else
        log "${RED}✗ Failed to execute: $description${NC}"
        log "${RED}Check log file for details: $LOG_FILE${NC}"
        return 1
    fi
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

# Function to create backup
create_backup() {
    log "${YELLOW}Creating database backup before migration...${NC}"
    
    local backup_file="$SCRIPT_DIR/backup_before_s3_migration_$(date +%Y%m%d_%H%M%S).sql"
    
    # Backup relevant tables
    if PGPASSWORD="$DB_PASSWORD" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        --table=business_profiles \
        --table=visibility_check_leads \
        --table=business_partners \
        --data-only \
        --file="$backup_file" >> "$LOG_FILE" 2>&1; then
        log "${GREEN}✓ Backup created: $backup_file${NC}"
        echo "$backup_file"
        return 0
    else
        log "${RED}✗ Backup creation failed${NC}"
        return 1
    fi
}

# Function to verify migration results
verify_migration() {
    log "${YELLOW}Verifying migration results...${NC}"
    
    local verification_sql="$SCRIPT_DIR/verify_migration.sql"
    
    cat > "$verification_sql" << 'EOF'
-- Verification queries for S3 migration
\echo 'Checking user_uploads table...'
SELECT 
    COUNT(*) as total_columns,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'user_uploads' AND table_schema = 'public') as expected_columns
FROM information_schema.columns 
WHERE table_name = 'user_uploads' AND table_schema = 'public';

\echo 'Checking business_profiles S3 columns...'
SELECT 
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_profiles' AND column_name = 'avatar_s3_url') 
         THEN 'avatar_s3_url: EXISTS' 
         ELSE 'avatar_s3_url: MISSING' END as avatar_column,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_profiles' AND column_name = 'logo_s3_url') 
         THEN 'logo_s3_url: EXISTS' 
         ELSE 'logo_s3_url: MISSING' END as logo_column;

\echo 'Checking visibility_check_leads S3 columns...'
SELECT 
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'visibility_check_leads' AND column_name = 'report_s3_url') 
         THEN 'report_s3_url: EXISTS' 
         ELSE 'report_s3_url: MISSING' END as report_url_column,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'visibility_check_leads' AND column_name = 'report_expires_at') 
         THEN 'report_expires_at: EXISTS' 
         ELSE 'report_expires_at: MISSING' END as report_expires_column;

\echo 'Checking indexes...'
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('user_uploads', 'business_profiles', 'visibility_check_leads')
AND indexname LIKE '%s3%' OR indexname LIKE '%user_uploads%'
ORDER BY tablename, indexname;

\echo 'Checking migration log...'
SELECT 
    table_name,
    migration_status,
    COUNT(*) as count
FROM s3_migration_log 
GROUP BY table_name, migration_status
ORDER BY table_name, migration_status;
EOF

    if execute_sql_file "$verification_sql" "Migration verification"; then
        rm -f "$verification_sql"
        return 0
    else
        rm -f "$verification_sql"
        return 1
    fi
}

# Main execution function
main() {
    log "${GREEN}Starting S3 File Storage Migration Database Setup${NC}"
    log "Timestamp: $(date)"
    log "Log file: $LOG_FILE"
    
    # Check required environment variables
    if [ -z "$DB_PASSWORD" ]; then
        log "${RED}Error: DB_PASSWORD environment variable is required${NC}"
        log "Please set DB_PASSWORD before running this script"
        exit 1
    fi
    
    # Verify database connection
    if ! verify_connection; then
        exit 1
    fi
    
    # Create backup
    local backup_file
    if backup_file=$(create_backup); then
        log "Backup file: $backup_file"
    else
        log "${RED}Backup creation failed. Aborting migration.${NC}"
        exit 1
    fi
    
    # Execute migrations in order
    local migrations=(
        "$MIGRATIONS_DIR/001_create_user_uploads_table.sql:Create user_uploads table"
        "$MIGRATIONS_DIR/002_add_s3_columns_to_existing_tables.sql:Add S3 columns to existing tables"
        "$MIGRATIONS_DIR/003_migrate_existing_data_to_s3.sql:Prepare existing data for S3 migration"
    )
    
    local failed=false
    
    for migration in "${migrations[@]}"; do
        IFS=':' read -r sql_file description <<< "$migration"
        
        if ! execute_sql_file "$sql_file" "$description"; then
            failed=true
            break
        fi
    done
    
    if [ "$failed" = true ]; then
        log "${RED}Migration failed. Please check the log file and consider restoring from backup.${NC}"
        log "Backup file: $backup_file"
        exit 1
    fi
    
    # Verify migration results
    if ! verify_migration; then
        log "${YELLOW}Migration completed but verification had issues. Please review manually.${NC}"
    else
        log "${GREEN}✓ All migrations completed successfully!${NC}"
    fi
    
    log "${GREEN}Migration Summary:${NC}"
    log "- Created user_uploads table with indexes and constraints"
    log "- Added S3 columns to business_profiles and visibility_check_leads tables"
    log "- Prepared existing data for S3 migration"
    log "- Created migration tracking and progress monitoring"
    log ""
    log "Next steps:"
    log "1. Deploy S3 infrastructure and Lambda functions"
    log "2. Run file migration scripts to transfer existing files to S3"
    log "3. Update application code to use S3 URLs"
    log "4. Test file upload and access functionality"
}

# Execute main function
main "$@"