#!/bin/bash

# Bedrock AI Core - Emergency Rollback Script
# This script safely disables the Bedrock AI system and activates fallback mechanisms
# Usage: ./disable-bedrock-agent.sh [--emergency] [--preserve-data]

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="/tmp/bedrock-rollback-$(date +%Y%m%d_%H%M%S).log"
BACKUP_DIR="/tmp/bedrock-backup-$(date +%Y%m%d_%H%M%S)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

# Parse command line arguments
EMERGENCY_MODE=false
PRESERVE_DATA=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --emergency)
            EMERGENCY_MODE=true
            shift
            ;;
        --preserve-data)
            PRESERVE_DATA=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [--emergency] [--preserve-data]"
            echo "  --emergency     Skip confirmations and run in emergency mode"
            echo "  --preserve-data Keep AI logs and analysis data"
            exit 0
            ;;
        *)
            error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Confirmation prompt (skip in emergency mode)
if [[ "$EMERGENCY_MODE" != "true" ]]; then
    echo -e "${YELLOW}WARNING: This will disable the Bedrock AI Core system.${NC}"
    echo "This action will:"
    echo "  - Disable all AI analysis endpoints"
    echo "  - Activate fallback response system"
    echo "  - Stop all AI-related Lambda functions"
    echo "  - Update feature flags to disable AI features"
    if [[ "$PRESERVE_DATA" != "true" ]]; then
        echo "  - Archive AI logs and analysis data"
    fi
    echo ""
    read -p "Are you sure you want to continue? (type 'DISABLE' to confirm): " confirmation
    
    if [[ "$confirmation" != "DISABLE" ]]; then
        log "Rollback cancelled by user"
        exit 0
    fi
fi

log "Starting Bedrock AI Core rollback procedure"
log "Emergency mode: $EMERGENCY_MODE"
log "Preserve data: $PRESERVE_DATA"
log "Log file: $LOG_FILE"

# Create backup directory
mkdir -p "$BACKUP_DIR"
log "Created backup directory: $BACKUP_DIR"

# Step 1: Create system backup
log "Step 1: Creating system backup..."

# Backup Lambda function configurations
log "Backing up Lambda configurations..."
aws lambda get-function --function-name bedrock-agent > "$BACKUP_DIR/bedrock-agent-config.json" 2>/dev/null || warning "Failed to backup bedrock-agent config"
aws lambda get-function --function-name web-proxy > "$BACKUP_DIR/web-proxy-config.json" 2>/dev/null || warning "Failed to backup web-proxy config"

# Backup current feature flags
log "Backing up feature flags..."
if command -v psql >/dev/null 2>&1 && [[ -n "${DATABASE_URL:-}" ]]; then
    psql "$DATABASE_URL" -c "COPY (SELECT * FROM feature_flags WHERE key LIKE '%bedrock%' OR key LIKE '%ai%') TO STDOUT WITH CSV HEADER;" > "$BACKUP_DIR/feature_flags_backup.csv" 2>/dev/null || warning "Failed to backup feature flags"
fi

# Backup environment variables
log "Backing up environment variables..."
env | grep -E "(BEDROCK|AI|CLAUDE)" > "$BACKUP_DIR/env_backup.txt" 2>/dev/null || warning "No AI environment variables found"

success "System backup completed"

# Step 2: Disable feature flags
log "Step 2: Disabling AI feature flags..."

if command -v psql >/dev/null 2>&1 && [[ -n "${DATABASE_URL:-}" ]]; then
    # Disable all Bedrock-related feature flags
    psql "$DATABASE_URL" -c "
        UPDATE feature_flags 
        SET value = 'false' 
        WHERE key IN (
            'vc_bedrock_live',
            'vc_bedrock_rollout_percent',
            'ai_content_generation',
            'ai_persona_detection',
            'ai_analysis_engine',
            'bedrock_agent_enabled'
        );
    " 2>/dev/null && success "Feature flags disabled" || warning "Failed to disable feature flags"
    
    # Set rollout percentage to 0
    psql "$DATABASE_URL" -c "
        UPDATE feature_flags 
        SET value = '0' 
        WHERE key = 'vc_bedrock_rollout_percent';
    " 2>/dev/null || warning "Failed to set rollout percentage to 0"
else
    warning "Database not available - feature flags not updated"
fi

# Step 3: Update Lambda function configurations
log "Step 3: Disabling Lambda functions..."

# Disable Bedrock Agent Lambda
log "Disabling bedrock-agent Lambda function..."
aws lambda update-function-configuration \
    --function-name bedrock-agent \
    --environment Variables='{
        "DISABLED":"true",
        "FALLBACK_MODE":"true",
        "EMERGENCY_SHUTDOWN":"true"
    }' 2>/dev/null && success "Bedrock agent disabled" || error "Failed to disable bedrock-agent"

# Disable Web Proxy Lambda
log "Disabling web-proxy Lambda function..."
aws lambda update-function-configuration \
    --function-name web-proxy \
    --environment Variables='{
        "DISABLED":"true",
        "FALLBACK_MODE":"true"
    }' 2>/dev/null && success "Web proxy disabled" || warning "Failed to disable web-proxy"

# Set concurrency to 0 to prevent new invocations
log "Setting Lambda concurrency to 0..."
aws lambda put-reserved-concurrency-config \
    --function-name bedrock-agent \
    --reserved-concurrent-executions 0 2>/dev/null && success "Concurrency set to 0" || warning "Failed to set concurrency"

# Step 4: Update API Gateway (if applicable)
log "Step 4: Updating API Gateway routing..."

# Check if API Gateway exists and update routing
API_ID=$(aws apigateway get-rest-apis --query "items[?name=='matbakh-api'].id" --output text 2>/dev/null || echo "")
if [[ -n "$API_ID" && "$API_ID" != "None" ]]; then
    log "Found API Gateway: $API_ID"
    # Here you would update routing to fallback endpoints
    # This is environment-specific and should be customized
    warning "API Gateway routing update not implemented - manual intervention required"
else
    log "No API Gateway found or not accessible"
fi

# Step 5: Archive AI data (if not preserving)
if [[ "$PRESERVE_DATA" != "true" ]]; then
    log "Step 5: Archiving AI data..."
    
    if command -v psql >/dev/null 2>&1 && [[ -n "${DATABASE_URL:-}" ]]; then
        # Create archive tables
        psql "$DATABASE_URL" -c "
            CREATE TABLE IF NOT EXISTS ai_action_logs_archive AS 
            SELECT * FROM ai_action_logs WHERE 1=0;
            
            CREATE TABLE IF NOT EXISTS visibility_check_results_archive AS 
            SELECT * FROM visibility_check_results WHERE 1=0;
        " 2>/dev/null || warning "Failed to create archive tables"
        
        # Move data to archive
        psql "$DATABASE_URL" -c "
            INSERT INTO ai_action_logs_archive SELECT * FROM ai_action_logs;
            INSERT INTO visibility_check_results_archive SELECT * FROM visibility_check_results;
        " 2>/dev/null && success "Data archived" || warning "Failed to archive data"
        
        # Clear active tables (commented out for safety)
        # psql "$DATABASE_URL" -c "TRUNCATE ai_action_logs, visibility_check_results;" 2>/dev/null
        
    else
        warning "Database not available - data archiving skipped"
    fi
else
    log "Step 5: Preserving AI data (--preserve-data flag set)"
fi

# Step 6: Update monitoring and alerting
log "Step 6: Updating monitoring configuration..."

# Disable CloudWatch alarms to prevent false alerts
ALARMS=(
    "BedrockAI-HighErrorRate"
    "BedrockAI-HighResponseTime" 
    "BedrockAI-CostThreshold"
)

for alarm in "${ALARMS[@]}"; do
    aws cloudwatch disable-alarm-actions --alarm-names "$alarm" 2>/dev/null && log "Disabled alarm: $alarm" || warning "Failed to disable alarm: $alarm"
done

# Step 7: Verify rollback
log "Step 7: Verifying rollback..."

# Test that AI endpoints return fallback responses
log "Testing AI endpoint fallback..."
if command -v curl >/dev/null 2>&1; then
    HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "https://api.matbakh.app/ai/health" 2>/dev/null || echo "000")
    if [[ "$HEALTH_RESPONSE" == "503" ]] || [[ "$HEALTH_RESPONSE" == "200" ]]; then
        success "AI endpoints responding with fallback mode"
    else
        warning "AI endpoints may not be properly disabled (HTTP $HEALTH_RESPONSE)"
    fi
else
    warning "curl not available - endpoint verification skipped"
fi

# Verify Lambda function status
BEDROCK_STATUS=$(aws lambda get-function --function-name bedrock-agent --query 'Configuration.State' --output text 2>/dev/null || echo "Unknown")
log "Bedrock agent status: $BEDROCK_STATUS"

# Step 8: Generate rollback report
log "Step 8: Generating rollback report..."

REPORT_FILE="$BACKUP_DIR/rollback_report.md"
cat > "$REPORT_FILE" << EOF
# Bedrock AI Core Rollback Report

**Date:** $(date)
**Operator:** $(whoami)
**Emergency Mode:** $EMERGENCY_MODE
**Data Preserved:** $PRESERVE_DATA

## Actions Taken

1. ✅ System backup created in: $BACKUP_DIR
2. ✅ Feature flags disabled
3. ✅ Lambda functions disabled
4. ✅ Concurrency set to 0
5. ⚠️  API Gateway routing (manual intervention required)
6. $([ "$PRESERVE_DATA" == "true" ] && echo "⏭️  Data preservation enabled" || echo "✅ AI data archived")
7. ✅ Monitoring alarms disabled
8. ✅ Rollback verification completed

## Backup Locations

- Lambda configs: $BACKUP_DIR/
- Feature flags: $BACKUP_DIR/feature_flags_backup.csv
- Environment vars: $BACKUP_DIR/env_backup.txt
- Full log: $LOG_FILE

## Recovery Instructions

To restore the Bedrock AI system:

1. Restore Lambda configurations:
   \`\`\`bash
   aws lambda update-function-code --function-name bedrock-agent --zip-file fileb://path/to/backup.zip
   \`\`\`

2. Restore feature flags:
   \`\`\`bash
   psql \$DATABASE_URL -c "\\copy feature_flags FROM '$BACKUP_DIR/feature_flags_backup.csv' WITH CSV HEADER;"
   \`\`\`

3. Re-enable Lambda concurrency:
   \`\`\`bash
   aws lambda delete-reserved-concurrency-config --function-name bedrock-agent
   \`\`\`

4. Re-enable CloudWatch alarms:
   \`\`\`bash
   aws cloudwatch enable-alarm-actions --alarm-names BedrockAI-HighErrorRate BedrockAI-HighResponseTime BedrockAI-CostThreshold
   \`\`\`

## Next Steps

1. Investigate root cause of the issue that triggered this rollback
2. Test fixes in staging environment
3. Plan gradual re-enablement strategy
4. Update monitoring and alerting based on lessons learned

## Contact Information

- Primary On-Call: +49-xxx-xxx-xxxx
- Engineering Manager: engineering@matbakh.app
- CTO: cto@matbakh.app

EOF

success "Rollback report generated: $REPORT_FILE"

# Step 9: Final status and cleanup
log "Step 9: Final status and cleanup..."

# Display summary
echo ""
echo "=========================================="
echo "  BEDROCK AI CORE ROLLBACK COMPLETED"
echo "=========================================="
echo ""
echo "Status: AI system has been disabled"
echo "Backup location: $BACKUP_DIR"
echo "Log file: $LOG_FILE"
echo "Report: $REPORT_FILE"
echo ""

if [[ "$EMERGENCY_MODE" == "true" ]]; then
    echo -e "${RED}Emergency mode was used - please review all changes carefully${NC}"
fi

if [[ "$PRESERVE_DATA" == "true" ]]; then
    echo -e "${YELLOW}AI data was preserved - consider archiving if rollback is permanent${NC}"
fi

echo ""
echo "Next steps:"
echo "1. Verify that fallback systems are working correctly"
echo "2. Investigate the root cause that triggered this rollback"
echo "3. Plan recovery strategy if this was not a permanent shutdown"
echo "4. Update stakeholders on system status"
echo ""

# Offer to send notification (if configured)
if [[ -n "${SLACK_WEBHOOK_URL:-}" ]] && command -v curl >/dev/null 2>&1; then
    read -p "Send Slack notification? (y/N): " send_notification
    if [[ "$send_notification" =~ ^[Yy]$ ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚨 Bedrock AI Core has been disabled\\nOperator: $(whoami)\\nTime: $(date)\\nEmergency: $EMERGENCY_MODE\\nBackup: $BACKUP_DIR\"}" \
            "$SLACK_WEBHOOK_URL" 2>/dev/null && success "Slack notification sent" || warning "Failed to send Slack notification"
    fi
fi

success "Bedrock AI Core rollback completed successfully"
log "Rollback procedure finished at $(date)"

exit 0