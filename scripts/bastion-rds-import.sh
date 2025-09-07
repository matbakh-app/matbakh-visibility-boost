#!/bin/bash
set -euo pipefail

echo "🎯 TASK 12.2 - RDS IMPORT VIA BASTION HOST"
echo "=========================================="

# Configuration
BASTION_IP="18.156.84.182"
BASTION_USER="ec2-user"
RDS_ENDPOINT="matbakh-db.chq6q4cs0evx.eu-central-1.rds.amazonaws.com"
RDS_PORT="5432"
LOCAL_PORT="5433"
DB_USER="postgres"
DB_PASSWORD="Matbakhapp#6x"
BACKUP_FILE="backups/20250902_supabase_final.sql"

echo "📋 Configuration:"
echo "   Bastion IP: $BASTION_IP"
echo "   RDS Endpoint: $RDS_ENDPOINT"
echo "   Local Port: $LOCAL_PORT"
echo "   Backup File: $BACKUP_FILE"
echo ""

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "✅ Backup file found: $BACKUP_FILE"
BACKUP_SIZE=$(wc -l < "$BACKUP_FILE")
echo "   Lines: $BACKUP_SIZE"
echo ""

# Check if SSH key exists
SSH_KEY="$HOME/.ssh/matbakh-bastion-key.pem"
if [ ! -f "$SSH_KEY" ]; then
    echo "❌ SSH key not found: $SSH_KEY"
    echo "💡 Please ensure the SSH key is available at $SSH_KEY"
    exit 1
fi

echo "✅ SSH key found: $SSH_KEY"
echo ""

# Test SSH connection to bastion
echo "🔍 Testing SSH connection to bastion..."
if timeout 15 ssh -i "$SSH_KEY" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$BASTION_USER@$BASTION_IP" "echo 'SSH connection successful'" 2>/dev/null; then
    echo "✅ SSH connection to bastion successful"
else
    echo "❌ SSH connection to bastion failed"
    echo "💡 Please check:"
    echo "   - SSH key permissions: chmod 600 $SSH_KEY"
    echo "   - Bastion host is running"
    echo "   - Security group allows SSH (port 22)"
    exit 1
fi
echo ""

# Start SSH tunnel in background
echo "🔧 Starting SSH tunnel..."
SSH_TUNNEL_PID=""

# Function to cleanup tunnel on exit
cleanup() {
    if [ ! -z "$SSH_TUNNEL_PID" ]; then
        echo "🧹 Cleaning up SSH tunnel (PID: $SSH_TUNNEL_PID)..."
        kill $SSH_TUNNEL_PID 2>/dev/null || true
        wait $SSH_TUNNEL_PID 2>/dev/null || true
    fi
}
trap cleanup EXIT

# Start SSH tunnel
ssh -i "$SSH_KEY" -N -L "$LOCAL_PORT:$RDS_ENDPOINT:$RDS_PORT" "$BASTION_USER@$BASTION_IP" &
SSH_TUNNEL_PID=$!

echo "✅ SSH tunnel started (PID: $SSH_TUNNEL_PID)"
echo "   Local port $LOCAL_PORT -> $RDS_ENDPOINT:$RDS_PORT"
echo ""

# Wait for tunnel to be ready
echo "⏳ Waiting for SSH tunnel to be ready..."
sleep 5

# Test tunnel connection
echo "🔍 Testing tunnel connection..."
if timeout 10 nc -z localhost "$LOCAL_PORT" 2>/dev/null; then
    echo "✅ SSH tunnel is ready"
else
    echo "❌ SSH tunnel connection failed"
    exit 1
fi
echo ""

# Test PostgreSQL connection
echo "🔍 Testing PostgreSQL connection..."
if timeout 10 psql "postgresql://$DB_USER:$DB_PASSWORD@localhost:$LOCAL_PORT/postgres" -c "SELECT version();" > /dev/null 2>&1; then
    echo "✅ PostgreSQL connection successful"
else
    echo "❌ PostgreSQL connection failed"
    echo "💡 Please check RDS credentials and security groups"
    exit 1
fi
echo ""

# Show current database state
echo "📊 Current database state:"
TABLE_COUNT_BEFORE=$(psql "postgresql://$DB_USER:$DB_PASSWORD@localhost:$LOCAL_PORT/postgres" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ' || echo "0")
echo "   Tables before import: $TABLE_COUNT_BEFORE"
echo ""

# Execute import
echo "🚀 Starting RDS import..."
echo "   This may take several minutes..."
echo ""

START_TIME=$(date +%s)

# Import with progress
psql "postgresql://$DB_USER:$DB_PASSWORD@localhost:$LOCAL_PORT/postgres" -f "$BACKUP_FILE"
IMPORT_RESULT=$?

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

if [ $IMPORT_RESULT -eq 0 ]; then
    echo ""
    echo "✅ RDS import completed successfully!"
    echo "   Duration: ${DURATION} seconds"
    echo ""
    
    # Verify import
    echo "📊 Verifying import..."
    TABLE_COUNT_AFTER=$(psql "postgresql://$DB_USER:$DB_PASSWORD@localhost:$LOCAL_PORT/postgres" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | tr -d ' ')
    echo "   Tables after import: $TABLE_COUNT_AFTER"
    
    # Check key tables
    echo ""
    echo "🔍 Checking key tables..."
    KEY_TABLES=("profiles" "service_packages" "businesses" "visibility_check_leads")
    
    for table in "${KEY_TABLES[@]}"; do
        if psql "postgresql://$DB_USER:$DB_PASSWORD@localhost:$LOCAL_PORT/postgres" -t -c "SELECT 1 FROM information_schema.tables WHERE table_name = '$table';" | grep -q 1; then
            RECORD_COUNT=$(psql "postgresql://$DB_USER:$DB_PASSWORD@localhost:$LOCAL_PORT/postgres" -t -c "SELECT COUNT(*) FROM $table;" | tr -d ' ')
            echo "   ✅ $table: $RECORD_COUNT records"
        else
            echo "   ❌ $table: Table not found"
        fi
    done
    
    echo ""
    echo "🎉 MIGRATION COMPLETED SUCCESSFULLY!"
    echo "=================================="
    echo ""
    echo "✅ Supabase data successfully migrated to AWS RDS"
    echo "✅ All tables and data imported"
    echo "✅ Database ready for production use"
    echo ""
    echo "📋 Next steps:"
    echo "   1. Update application connection strings"
    echo "   2. Test application functionality"
    echo "   3. Monitor database performance"
    echo "   4. Schedule regular backups"
    
else
    echo ""
    echo "❌ RDS import failed!"
    echo "💡 Check the error messages above for details"
    exit 1
fi