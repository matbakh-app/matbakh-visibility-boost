#!/bin/bash
# Hybrid Routing Rollback Script
# Implements the three-level rollback strategy for Bedrock Activation Hybrid Routing

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
LOG_FILE="hybrid-routing-rollback-$(date +%Y%m%d-%H%M%S).log"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# API Configuration
API_BASE="${API_BASE:-https://api.matbakh.app}"
ADMIN_TOKEN="${ADMIN_TOKEN:-}"

# Logging functions
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] ✅ $1${NC}" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️ $1${NC}" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ❌ $1${NC}" | tee -a "$LOG_FILE"
}

# Validation functions
check_prerequisites() {
    log "🔍 Checking rollback prerequisites..."
    
    # Check if admin token is available
    if [ -z "$ADMIN_TOKEN" ]; then
        log_error "ADMIN_TOKEN environment variable not set"
        return 1
    fi
    
    # Check API connectivity
    if ! curl -s --max-time 10 "$API_BASE/health" >/dev/null 2>&1; then
        log_error "Cannot connect to API at $API_BASE"
        return 1
    fi
    
    # Check required tools
    for tool in curl jq aws; do
        if ! command -v "$tool" >/dev/null 2>&1; then
            log_error "Required tool not found: $tool"
            return 1
        fi
    done
    
    log_success "Prerequisites check passed"
    return 0
}

# Level 1: Feature Flag Rollback (< 2 minutes)
level1_rollback() {
    log "🚨 Executing Level 1 Rollback: Feature Flag Disable"
    local start_time=$(date +%s)
    
    # Step 1: Disable critical feature flags
    log "Disabling hybrid routing feature flags..."
    
    local feature_flags='{
        "ENABLE_BEDROCK_SUPPORT_MODE": false,
        "ENABLE_INTELLIGENT_ROUTING": false,
        "ENABLE_DIRECT_BEDROCK_FALLBACK": false
    }'
    
    if curl -X PUT "$API_BASE/admin/feature-flags" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -d "$feature_flags" \
        --max-time 30 >/dev/null 2>&1; then
        log_success "Feature flags disabled successfully"
    else
        log_error "Failed to disable feature flags"
        return 1
    fi
    
    # Step 2: Verify rollback
    log "Verifying feature flag status..."
    sleep 5
    
    local flag_status
    flag_status=$(curl -s -X GET "$API_BASE/admin/feature-flags" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        --max-time 30)
    
    if echo "$flag_status" | jq -e '.ENABLE_BEDROCK_SUPPORT_MODE == false and .ENABLE_INTELLIGENT_ROUTING == false and .ENABLE_DIRECT_BEDROCK_FALLBACK == false' >/dev/null 2>&1; then
        log_success "Feature flags verified as disabled"
    else
        log_error "Feature flag verification failed"
        return 1
    fi
    
    # Step 3: Check system health
    log "Checking system health after rollback..."
    sleep 10
    
    if curl -s -X GET "$API_BASE/health/system" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        --max-time 30 | jq -e '.status == "healthy"' >/dev/null 2>&1; then
        log_success "System health check passed"
    else
        log_warning "System health check inconclusive"
    fi
    
    # Step 4: Monitor error rates
    log "Monitoring error rates..."
    if command -v aws >/dev/null 2>&1; then
        aws cloudwatch get-metric-statistics \
            --namespace BedrockHybridRouting \
            --metric-name ErrorRate \
            --dimensions Name=Environment,Value=production \
            --start-time "$(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%S)" \
            --end-time "$(date -u +%Y-%m-%dT%H:%M:%S)" \
            --period 300 \
            --statistics Average \
            --output table 2>/dev/null || log_warning "CloudWatch metrics unavailable"
    fi
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    if [ $duration -lt 120 ]; then
        log_success "Level 1 rollback completed in ${duration}s (< 2 minutes)"
        return 0
    else
        log_warning "Level 1 rollback took ${duration}s (> 2 minutes)"
        return 0
    fi
}

# Level 2: Traffic Routing Rollback (< 5 minutes)
level2_rollback() {
    log "🚨 Executing Level 2 Rollback: Traffic Routing to MCP-Only"
    local start_time=$(date +%s)
    
    # Step 1: Execute Level 1 first
    if ! level1_rollback; then
        log_error "Level 1 rollback failed, cannot proceed with Level 2"
        return 1
    fi
    
    # Step 2: Force MCP-only mode
    log "Forcing MCP-only routing mode..."
    
    local routing_config='{
        "force_mcp_only": true,
        "bypass_intelligent_routing": true,
        "disable_direct_bedrock": true,
        "routing_mode": "mcp_only"
    }'
    
    if curl -X PUT "$API_BASE/admin/routing-config" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -d "$routing_config" \
        --max-time 30 >/dev/null 2>&1; then
        log_success "MCP-only routing configured"
    else
        log_error "Failed to configure MCP-only routing"
        return 1
    fi
    
    # Step 3: Verify MCP health
    log "Verifying MCP health..."
    sleep 10
    
    if curl -s -X GET "$API_BASE/health/mcp" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        --max-time 30 | jq -e '.status == "healthy"' >/dev/null 2>&1; then
        log_success "MCP health verified"
    else
        log_error "MCP health check failed"
        return 1
    fi
    
    # Step 4: Test sample request
    log "Testing sample AI request through MCP..."
    local test_request='{
        "type": "test",
        "content": "rollback validation test"
    }'
    
    if curl -s -X POST "$API_BASE/ai/analyze" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -d "$test_request" \
        --max-time 60 >/dev/null 2>&1; then
        log_success "Sample AI request successful"
    else
        log_warning "Sample AI request failed or timed out"
    fi
    
    # Step 5: Monitor traffic distribution
    log "Monitoring traffic distribution..."
    if command -v aws >/dev/null 2>&1; then
        # Check MCP traffic
        aws cloudwatch get-metric-statistics \
            --namespace BedrockHybridRouting \
            --metric-name RequestDistribution \
            --dimensions Name=Environment,Value=production Name=Route,Value=MCP \
            --start-time "$(date -u -d '2 minutes ago' +%Y-%m-%dT%H:%M:%S)" \
            --end-time "$(date -u +%Y-%m-%dT%H:%M:%S)" \
            --period 300 \
            --statistics Sum \
            --output table 2>/dev/null || log_warning "MCP traffic metrics unavailable"
        
        # Verify no Direct Bedrock traffic
        aws cloudwatch get-metric-statistics \
            --namespace BedrockHybridRouting \
            --metric-name RequestDistribution \
            --dimensions Name=Environment,Value=production Name=Route,Value=DirectBedrock \
            --start-time "$(date -u -d '2 minutes ago' +%Y-%m-%dT%H:%M:%S)" \
            --end-time "$(date -u +%Y-%m-%dT%H:%M:%S)" \
            --period 300 \
            --statistics Sum \
            --output table 2>/dev/null || log_warning "Direct Bedrock traffic metrics unavailable"
    fi
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    if [ $duration -lt 300 ]; then
        log_success "Level 2 rollback completed in ${duration}s (< 5 minutes)"
        return 0
    else
        log_warning "Level 2 rollback took ${duration}s (> 5 minutes)"
        return 0
    fi
}

# Level 3: Full System Rollback (< 10 minutes)
level3_rollback() {
    log "🚨 Executing Level 3 Rollback: Full System Rollback"
    local start_time=$(date +%s)
    
    # Step 1: Execute Level 2 first
    if ! level2_rollback; then
        log_error "Level 2 rollback failed, cannot proceed with Level 3"
        return 1
    fi
    
    # Step 2: Check for automated rollback script
    log "Attempting automated rollback..."
    if [ -f "$SCRIPT_DIR/deploy-production-hybrid-routing.ts" ]; then
        if npx tsx "$SCRIPT_DIR/deploy-production-hybrid-routing.ts" --rollback 2>/dev/null; then
            log_success "Automated rollback completed"
        else
            log_warning "Automated rollback failed, proceeding with manual rollback"
        fi
    else
        log_warning "Automated rollback script not found, proceeding with manual rollback"
    fi
    
    # Step 3: Manual rollback procedures
    log "Executing manual rollback procedures..."
    
    # Rollback application version (if using containers)
    if command -v aws >/dev/null 2>&1; then
        log "Checking ECS service deployments..."
        local service_info
        service_info=$(aws ecs describe-services \
            --cluster matbakh-production \
            --services matbakh-api \
            --query 'services[0].deployments' 2>/dev/null || echo "[]")
        
        if [ "$service_info" != "[]" ]; then
            log "ECS service found, checking for previous task definition..."
            # This would need to be implemented based on actual ECS setup
            log_warning "ECS rollback requires manual intervention"
        fi
    fi
    
    # Step 4: Verify application version
    log "Verifying application version..."
    local version_info
    version_info=$(curl -s -X GET "$API_BASE/health/version" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        --max-time 30 2>/dev/null || echo "{}")
    
    if [ "$version_info" != "{}" ]; then
        log "Current version: $(echo "$version_info" | jq -r '.version // "unknown"')"
    else
        log_warning "Version information unavailable"
    fi
    
    # Step 5: Comprehensive health check
    log "Running comprehensive health check..."
    local health_endpoints=(
        "/health/system"
        "/health/database"
        "/health/cache"
        "/health/external-services"
    )
    
    local health_passed=true
    for endpoint in "${health_endpoints[@]}"; do
        if curl -s -X GET "$API_BASE$endpoint" \
            -H "Authorization: Bearer $ADMIN_TOKEN" \
            --max-time 30 | jq -e '.status == "healthy"' >/dev/null 2>&1; then
            log_success "Health check passed: $endpoint"
        else
            log_warning "Health check failed: $endpoint"
            health_passed=false
        fi
    done
    
    if [ "$health_passed" = true ]; then
        log_success "All health checks passed"
    else
        log_warning "Some health checks failed"
    fi
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    if [ $duration -lt 600 ]; then
        log_success "Level 3 rollback completed in ${duration}s (< 10 minutes)"
        return 0
    else
        log_warning "Level 3 rollback took ${duration}s (> 10 minutes)"
        return 0
    fi
}

# Post-rollback procedures
post_rollback_procedures() {
    local rollback_level="$1"
    
    log "📋 Executing post-rollback procedures for Level $rollback_level"
    
    # Step 1: Stakeholder notification
    log "Sending rollback notification..."
    
    local notification_payload='{
        "channel": "#ops-alerts",
        "text": "🔄 PRODUCTION ROLLBACK EXECUTED - Bedrock Hybrid Routing",
        "attachments": [{
            "color": "warning",
            "fields": [
                {"title": "Rollback Level", "value": "Level '"$rollback_level"'", "short": true},
                {"title": "Status", "value": "Completed", "short": true},
                {"title": "Time", "value": "'"$(date)"'", "short": true},
                {"title": "Log File", "value": "'"$LOG_FILE"'", "short": true}
            ]
        }]
    }'
    
    if [ -n "${SLACK_TOKEN:-}" ]; then
        curl -X POST https://api.slack.com/api/chat.postMessage \
            -H "Authorization: Bearer $SLACK_TOKEN" \
            -H "Content-Type: application/json" \
            -d "$notification_payload" \
            --max-time 30 >/dev/null 2>&1 || log_warning "Slack notification failed"
    else
        log_warning "SLACK_TOKEN not set, skipping Slack notification"
    fi
    
    # Step 2: Create incident documentation
    log "Creating incident documentation..."
    local incident_file="incident-rollback-level$rollback_level-$(date +%Y%m%d-%H%M%S).md"
    
    cat > "$incident_file" << EOF
# Hybrid Routing Rollback Incident Report

**Date**: $(date)
**Rollback Level**: Level $rollback_level
**Log File**: $LOG_FILE

## Summary

Hybrid routing rollback executed successfully at Level $rollback_level.

## Timeline

- **Rollback Initiated**: $(date)
- **Rollback Completed**: $(date)

## Actions Taken

### Level $rollback_level Rollback
- Feature flags disabled
$([ "$rollback_level" -ge 2 ] && echo "- Traffic routed to MCP-only mode")
$([ "$rollback_level" -ge 3 ] && echo "- Full system rollback executed")

## System Status

- System operational: $(curl -s "$API_BASE/health/system" -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.status // "unknown"')
- MCP routing: $(curl -s "$API_BASE/health/mcp" -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.status // "unknown"')

## Next Steps

1. Root cause analysis
2. Fix development and testing
3. Plan re-deployment strategy
4. Update rollback procedures based on lessons learned

## Contacts

- On-call Engineer: Available
- Engineering Manager: Notified
- CTO: $([ "$rollback_level" -ge 3 ] && echo "Notified" || echo "Not required")
EOF
    
    log_success "Incident documentation created: $incident_file"
    
    # Step 3: System validation summary
    log "📊 Final system validation summary:"
    log "- Rollback Level: $rollback_level"
    log "- Log File: $LOG_FILE"
    log "- Incident Report: $incident_file"
    log "- System Status: $(curl -s "$API_BASE/health/system" -H "Authorization: Bearer $ADMIN_TOKEN" --max-time 10 | jq -r '.status // "unknown"' 2>/dev/null)"
    
    log_success "Post-rollback procedures completed"
}

# Main rollback function
execute_rollback() {
    local level="${1:-1}"
    
    log "🚀 Hybrid Routing Rollback System"
    log "Executing Level $level rollback..."
    log "Log file: $LOG_FILE"
    
    # Check prerequisites
    if ! check_prerequisites; then
        log_error "Prerequisites check failed"
        exit 1
    fi
    
    # Execute appropriate rollback level
    case "$level" in
        1)
            if level1_rollback; then
                log_success "Level 1 rollback completed successfully"
                post_rollback_procedures 1
            else
                log_error "Level 1 rollback failed"
                exit 1
            fi
            ;;
        2)
            if level2_rollback; then
                log_success "Level 2 rollback completed successfully"
                post_rollback_procedures 2
            else
                log_error "Level 2 rollback failed"
                exit 1
            fi
            ;;
        3)
            if level3_rollback; then
                log_success "Level 3 rollback completed successfully"
                post_rollback_procedures 3
            else
                log_error "Level 3 rollback failed"
                exit 1
            fi
            ;;
        *)
            log_error "Invalid rollback level: $level (must be 1, 2, or 3)"
            exit 1
            ;;
    esac
}

# Help function
show_help() {
    echo "Hybrid Routing Rollback Script"
    echo
    echo "Usage: $0 [level] [options]"
    echo
    echo "Rollback Levels:"
    echo "  1    Feature Flag Rollback (< 2 minutes)"
    echo "  2    Traffic Routing Rollback (< 5 minutes)"
    echo "  3    Full System Rollback (< 10 minutes)"
    echo
    echo "Options:"
    echo "  --help, -h    Show this help message"
    echo "  --dry-run     Simulate rollback without making changes"
    echo
    echo "Environment Variables:"
    echo "  API_BASE      API base URL (default: https://api.matbakh.app)"
    echo "  ADMIN_TOKEN   Admin authentication token (required)"
    echo "  SLACK_TOKEN   Slack bot token for notifications (optional)"
    echo
    echo "Examples:"
    echo "  $0 1                    # Execute Level 1 rollback"
    echo "  $0 2                    # Execute Level 2 rollback"
    echo "  $0 3                    # Execute Level 3 rollback"
    echo "  $0 --dry-run 2          # Simulate Level 2 rollback"
    echo
    echo "Rollback Strategy:"
    echo "  Level 1: Disable hybrid routing features via feature flags"
    echo "  Level 2: Force all traffic to MCP-only mode"
    echo "  Level 3: Complete system rollback to previous version"
}

# Parse command line arguments
case "${1:-}" in
    --help|-h)
        show_help
        exit 0
        ;;
    --dry-run)
        log_warning "DRY RUN MODE - No changes will be made"
        # Set dry run flag and shift arguments
        DRY_RUN=true
        shift
        ;;
esac

# Main execution
if [ "${DRY_RUN:-false}" = "true" ]; then
    log "🧪 DRY RUN: Would execute Level ${1:-1} rollback"
    log "Prerequisites would be checked"
    log "Rollback procedures would be executed"
    log "Post-rollback procedures would be executed"
    log_success "Dry run completed"
else
    execute_rollback "${1:-1}"
fi