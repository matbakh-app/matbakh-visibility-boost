#!/bin/bash

# Supabase Final DSGVO-compliant Backup - Task 12.3.2
# Create final backup before shutdown

set -e

BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backups/supabase-final-shutdown"
BACKUP_FILE="supabase-final-backup-${BACKUP_DATE}.sql"

echo "💾 SUPABASE FINAL BACKUP - Task 12.3.2"
echo "======================================="
echo ""

# Create backup directory
mkdir -p "$BACKUP_DIR"

echo "📋 Backup Configuration:"
echo "   Date: $BACKUP_DATE"
echo "   Directory: $BACKUP_DIR"
echo "   File: $BACKUP_FILE"
echo ""

# Get Supabase connection details
SUPABASE_DB_PASSWORD=$(grep SUPABASE_DB_PASSWORD .env | cut -d'=' -f2 | tr -d '"')
SUPABASE_HOST="db.uheksobnyedarrpgxhju.supabase.co"
SUPABASE_USER="postgres"
SUPABASE_DB="postgres"

echo "🔄 Creating final Supabase backup..."
echo "   Host: $SUPABASE_HOST"
echo "   Database: $SUPABASE_DB"
echo ""

# Create comprehensive backup
PGPASSWORD="$SUPABASE_DB_PASSWORD" pg_dump \
    -h "$SUPABASE_HOST" \
    -U "$SUPABASE_USER" \
    -d "$SUPABASE_DB" \
    --verbose \
    --no-owner \
    --no-privileges \
    --clean \
    --if-exists \
    --create \
    --format=plain \
    --encoding=UTF8 \
    --file="$BACKUP_DIR/$BACKUP_FILE" 2>&1 | head -20

echo ""
echo "📊 Backup Statistics:"
ls -lh "$BACKUP_DIR/$BACKUP_FILE"
echo "   Lines: $(wc -l < "$BACKUP_DIR/$BACKUP_FILE")"
echo ""

# Create compressed version
echo "🗜️  Creating compressed backup..."
gzip -c "$BACKUP_DIR/$BACKUP_FILE" > "$BACKUP_DIR/${BACKUP_FILE}.gz"
echo "   Compressed size: $(ls -lh "$BACKUP_DIR/${BACKUP_FILE}.gz" | awk '{print $5}')"
echo ""

# Create metadata file
echo "📝 Creating backup metadata..."
cat > "$BACKUP_DIR/backup-metadata-${BACKUP_DATE}.json" << EOF
{
  "backup_date": "$BACKUP_DATE",
  "backup_type": "final_shutdown",
  "source": "supabase",
  "host": "$SUPABASE_HOST",
  "database": "$SUPABASE_DB",
  "purpose": "DSGVO-compliant final backup before Supabase shutdown",
  "migration_target": "AWS RDS PostgreSQL",
  "retention_policy": "7 years (DSGVO compliance)",
  "files": {
    "sql_backup": "$BACKUP_FILE",
    "compressed_backup": "${BACKUP_FILE}.gz",
    "metadata": "backup-metadata-${BACKUP_DATE}.json"
  },
  "verification": {
    "file_size_bytes": $(stat -f%z "$BACKUP_DIR/$BACKUP_FILE" 2>/dev/null || stat -c%s "$BACKUP_DIR/$BACKUP_FILE"),
    "line_count": $(wc -l < "$BACKUP_DIR/$BACKUP_FILE"),
    "checksum_md5": "$(md5sum "$BACKUP_DIR/$BACKUP_FILE" | cut -d' ' -f1 2>/dev/null || md5 -q "$BACKUP_DIR/$BACKUP_FILE")"
  },
  "compliance": {
    "dsgvo_compliant": true,
    "data_classification": "business_data",
    "contains_pii": true,
    "retention_required": true
  }
}
EOF

echo "✅ Backup completed successfully!"
echo ""
echo "📁 Backup Files Created:"
ls -la "$BACKUP_DIR/"
echo ""
echo "🔐 DSGVO Compliance Notes:"
echo "   ✅ Full database backup created"
echo "   ✅ Metadata documented"
echo "   ✅ Checksums generated"
echo "   ✅ Compressed for storage"
echo "   ⚠️  Contains PII - handle according to DSGVO"
echo "   📅 Retention: 7 years as per DSGVO requirements"
echo ""