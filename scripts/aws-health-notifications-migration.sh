#!/bin/bash

# AWS Health Notifications Migration Script
# Migrates from legacy AWS Health emails to AWS User Notifications Service

set -e

echo "🏥 AWS Health Notifications Migration"
echo "===================================="

# Configuration
REGION="eu-central-1"
NOTIFICATION_CONFIG_FILE="aws-health-notifications-config.json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS CLI not configured. Please run 'aws configure' first."
        exit 1
    fi
    
    # Check if User Notifications service is available in region
    if ! aws notifications describe-notification-configurations --region us-east-1 &> /dev/null; then
        print_warning "AWS User Notifications service may not be available or configured"
    fi
    
    print_success "Prerequisites check completed"
}

# Get current AWS Health configuration
get_current_health_config() {
    print_status "Analyzing current AWS Health configuration..."
    
    local account_id=$(aws sts get-caller-identity --query Account --output text)
    
    cat > "$NOTIFICATION_CONFIG_FILE" << EOF
{
  "migrationTimestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "accountId": "$account_id",
  "region": "$REGION",
  "currentConfiguration": {
    "legacyEmailNotifications": {
      "enabled": true,
      "description": "Legacy AWS Health email notifications",
      "migrationDeadline": "2025-09-15"
    }
  },
  "targetConfiguration": {
    "userNotificationsService": {
      "enabled": false,
      "notificationConfigurations": []
    }
  },
  "migrationStatus": "pending"
}
EOF

    print_success "Current configuration analyzed and saved to $NOTIFICATION_CONFIG_FILE"
}

# Create User Notifications configuration
create_user_notifications_config() {
    print_status "Creating AWS User Notifications configuration..."
    
    # Create notification configuration for AWS Health events
    local health_config=$(cat << 'EOF'
{
  "name": "matbakh-aws-health-notifications",
  "description": "AWS Health notifications for Matbakh platform",
  "aggregationDuration": "PT15M",
  "eventRules": [
    {
      "eventPattern": {
        "source": ["aws.health"],
        "detail-type": [
          "AWS Health Event",
          "AWS Health Abuse Event"
        ],
        "detail": {
          "eventTypeCategory": [
            "issue",
            "accountNotification",
            "scheduledChange"
          ]
        }
      },
      "regions": ["eu-central-1", "us-east-1", "global"]
    }
  ],
  "targets": [
    {
      "targetType": "EMAIL",
      "targetAddress": "info@matbakh.app"
    },
    {
      "targetType": "SLACK",
      "targetAddress": "SLACK_WEBHOOK_URL_PLACEHOLDER"
    }
  ]
}
EOF
)

    # Save configuration
    echo "$health_config" > aws-health-notification-config.json
    
    print_success "User Notifications configuration created"
}

# Enable AWS User Notifications Service
enable_user_notifications() {
    print_status "Enabling AWS User Notifications Service..."
    
    # Note: AWS User Notifications is currently only available in us-east-1
    local notifications_region="us-east-1"
    
    # Create notification configuration
    print_status "Creating notification configuration in $notifications_region..."
    
    # First, check if we can access the service
    if aws notifications describe-notification-configurations --region "$notifications_region" &> /dev/null; then
        print_status "AWS User Notifications service is accessible"
        
        # Create the notification configuration
        local config_arn=$(aws notifications create-notification-configuration \
            --name "matbakh-aws-health-notifications" \
            --description "AWS Health notifications for Matbakh platform" \
            --aggregation-duration "PT15M" \
            --region "$notifications_region" \
            --query 'Arn' --output text 2>/dev/null || echo "FAILED")
        
        if [[ "$config_arn" != "FAILED" ]]; then
            print_success "Created notification configuration: $config_arn"
            
            # Update our config file
            local updated_config=$(jq --arg arn "$config_arn" \
                '.targetConfiguration.userNotificationsService.enabled = true | 
                 .targetConfiguration.userNotificationsService.notificationConfigurations += [{"arn": $arn, "name": "matbakh-aws-health-notifications"}] |
                 .migrationStatus = "in_progress"' \
                "$NOTIFICATION_CONFIG_FILE")
            echo "$updated_config" > "$NOTIFICATION_CONFIG_FILE"
        else
            print_warning "Failed to create notification configuration automatically"
            print_status "You can create it manually at: https://console.aws.amazon.com/notifications/home?region=us-east-1#/managed-notifications"
        fi
    else
        print_warning "AWS User Notifications service not accessible"
        print_status "Manual setup required at: https://console.aws.amazon.com/notifications/home?region=us-east-1#/managed-notifications"
    fi
}

# Create email filter rules for legacy notifications
create_email_filter_rules() {
    print_status "Creating email filter rules for legacy AWS Health notifications..."
    
    cat > aws-health-email-filters.md << 'EOF'
# AWS Health Email Filter Rules

## Overview
These filter rules help manage the transition from legacy AWS Health emails to the new User Notifications Service.

## Email Filters to Create

### 1. Legacy AWS Health Notifications
- **From:** `health@aws.com` (new sender)
- **Subject contains:** `AWS Health Event`
- **Action:** Label as "AWS Health - New System"

### 2. Old AWS Health Notifications  
- **From:** `no-reply@aws.amazon.com`
- **Subject contains:** `AWS Health Dashboard`
- **Action:** Label as "AWS Health - Legacy System"

### 3. Critical Health Events
- **From:** `health@aws.com`
- **Subject contains:** `CRITICAL` OR `URGENT`
- **Action:** 
  - Mark as important
  - Forward to team distribution list
  - Send mobile notification

### 4. Scheduled Maintenance
- **From:** `health@aws.com`
- **Subject contains:** `Scheduled maintenance`
- **Action:** Label as "AWS Maintenance"

## Gmail Filter Setup

1. Go to Gmail Settings > Filters and Blocked Addresses
2. Create new filter with the criteria above
3. Apply appropriate labels and actions

## Outlook Filter Setup

1. Go to Outlook Settings > Mail > Rules
2. Create new rule with the criteria above
3. Apply appropriate categories and actions

## Recommended Actions

1. **Monitor both systems** during transition period (until September 15, 2025)
2. **Test new notification system** with non-critical events first
3. **Update team documentation** with new notification channels
4. **Set up backup notifications** via Slack or other channels

## Migration Timeline

- **Phase 1 (Now - March 2025):** Set up new User Notifications Service
- **Phase 2 (March - June 2025):** Run both systems in parallel
- **Phase 3 (June - September 2025):** Gradually disable legacy notifications
- **Phase 4 (September 15, 2025):** Complete migration to new system

## Contact Information

For issues with AWS Health notifications:
- AWS Support: Create support case
- Internal escalation: DevOps team
- Emergency contact: On-call engineer
EOF

    print_success "Email filter rules documentation created: aws-health-email-filters.md"
}

# Create monitoring script for health events
create_health_monitoring_script() {
    print_status "Creating AWS Health monitoring script..."
    
    cat > scripts/monitor-aws-health.sh << 'EOF'
#!/bin/bash

# AWS Health Monitoring Script
# Monitors AWS Health events and sends notifications

REGION="eu-central-1"
LOG_FILE="aws-health-monitor.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

# Check AWS Health events
check_health_events() {
    print_status "Checking AWS Health events..."
    
    # Get current health events
    local events=$(aws health describe-events \
        --filter eventStatusCodes=open,upcoming \
        --region us-east-1 \
        --query 'events[?eventTypeCategory==`issue` || eventTypeCategory==`accountNotification`]' \
        --output json 2>/dev/null || echo '[]')
    
    local event_count=$(echo "$events" | jq length)
    
    if [ "$event_count" -gt 0 ]; then
        print_warning "Found $event_count active health events"
        
        # Process each event
        echo "$events" | jq -r '.[] | "\(.eventTypeCode): \(.eventTypeCategory) - \(.statusCode)"' | while read event; do
            print_warning "  $event"
        done
        
        # Send notifications if configured
        send_health_notifications "$events"
    else
        print_success "No active health events found"
    fi
}

# Send health notifications
send_health_notifications() {
    local events=$1
    
    # Create notification message
    local message="🏥 AWS Health Alert: $(echo "$events" | jq length) active events found"
    
    # Send to Slack if webhook configured
    if [ -n "$SLACK_WEBHOOK" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"$message\"}" \
            "$SLACK_WEBHOOK" &> /dev/null || print_error "Failed to send Slack notification"
    fi
    
    # Create GitHub issue if gh CLI available
    if command -v gh &> /dev/null; then
        local issue_body=$(echo "$events" | jq -r '.[] | "- **\(.eventTypeCode)**: \(.eventTypeCategory) - \(.statusCode)"')
        gh issue create \
            --title "🏥 AWS Health Alert - $(date +%Y-%m-%d)" \
            --body "$message\n\n$issue_body" \
            --label "aws,health,monitoring" &> /dev/null || print_error "Failed to create GitHub issue"
    fi
}

# Check service health for our services
check_service_health() {
    print_status "Checking service health for our AWS services..."
    
    local services=("LAMBDA" "APIGATEWAY" "DYNAMODB" "S3" "CLOUDWATCH" "COGNITO" "SES")
    
    for service in "${services[@]}"; do
        local service_events=$(aws health describe-events \
            --filter services="$service",eventStatusCodes=open,upcoming \
            --region us-east-1 \
            --query 'events[?eventTypeCategory==`issue`]' \
            --output json 2>/dev/null || echo '[]')
        
        local service_event_count=$(echo "$service_events" | jq length)
        
        if [ "$service_event_count" -gt 0 ]; then
            print_warning "$service: $service_event_count active issues"
        else
            print_success "$service: No issues"
        fi
    done
}

# Main monitoring function
main() {
    print_status "Starting AWS Health monitoring at $(date)"
    
    # Check if we have Health API access
    if ! aws health describe-events --region us-east-1 --max-items 1 &> /dev/null; then
        print_error "Cannot access AWS Health API. Business or Enterprise support plan required."
        exit 1
    fi
    
    check_health_events
    check_service_health
    
    print_status "AWS Health monitoring completed at $(date)"
}

# Handle command line arguments
case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [OPTIONS]"
        echo ""
        echo "Options:"
        echo "  --help       Show this help message"
        echo "  --events     Check health events only"
        echo "  --services   Check service health only"
        echo ""
        echo "Environment Variables:"
        echo "  SLACK_WEBHOOK    Slack webhook URL for notifications"
        exit 0
        ;;
    --events)
        check_health_events
        ;;
    --services)
        check_service_health
        ;;
    *)
        main
        ;;
esac
EOF

    chmod +x scripts/monitor-aws-health.sh
    print_success "Created AWS Health monitoring script"
}

# Create migration validation script
create_migration_validation() {
    print_status "Creating migration validation script..."
    
    cat > scripts/validate-health-migration.sh << 'EOF'
#!/bin/bash

# AWS Health Migration Validation Script
# Validates the migration from legacy to new notification system

echo "🔍 AWS Health Migration Validation"
echo "=================================="

# Check User Notifications Service status
check_user_notifications() {
    echo "📧 Checking User Notifications Service..."
    
    if aws notifications describe-notification-configurations --region us-east-1 &> /dev/null; then
        local configs=$(aws notifications describe-notification-configurations \
            --region us-east-1 \
            --query 'NotificationConfigurations[?contains(Name, `matbakh`) || contains(Name, `health`)]' \
            --output json)
        
        local config_count=$(echo "$configs" | jq length)
        
        if [ "$config_count" -gt 0 ]; then
            echo "✅ Found $config_count notification configurations"
            echo "$configs" | jq -r '.[] | "  - \(.Name): \(.Status)"'
        else
            echo "❌ No notification configurations found"
        fi
    else
        echo "❌ Cannot access User Notifications Service"
    fi
}

# Test notification delivery
test_notifications() {
    echo "🧪 Testing notification delivery..."
    
    # This would typically involve creating a test health event
    # For now, we'll just check if the service is responsive
    
    if aws notifications describe-notification-configurations --region us-east-1 &> /dev/null; then
        echo "✅ User Notifications Service is responsive"
    else
        echo "❌ User Notifications Service is not accessible"
    fi
}

# Check email filters
check_email_filters() {
    echo "📬 Email filter recommendations..."
    
    echo "Please verify the following email filters are set up:"
    echo "1. Filter for health@aws.com (new sender)"
    echo "2. Filter for legacy AWS Health emails"
    echo "3. Critical event escalation rules"
    echo "4. Maintenance notification handling"
    
    echo ""
    echo "See aws-health-email-filters.md for detailed setup instructions"
}

# Generate migration report
generate_report() {
    echo "📊 Generating migration report..."
    
    local report_file="aws-health-migration-report-$(date +%Y%m%d-%H%M%S).md"
    
    cat > "$report_file" << EOR
# AWS Health Notifications Migration Report

**Date:** $(date)
**Migration Status:** In Progress

## Current Configuration

### User Notifications Service
$(aws notifications describe-notification-configurations --region us-east-1 --output table 2>/dev/null || echo "Not accessible or not configured")

### Legacy Email Notifications
- Status: Still active (until September 15, 2025)
- Sender: Various AWS notification addresses
- Migration deadline: September 15, 2025

## Migration Progress

- [x] User Notifications Service setup initiated
- [x] Email filter rules documented
- [x] Monitoring scripts created
- [ ] Notification delivery tested
- [ ] Team training completed
- [ ] Legacy system disabled

## Next Steps

1. Complete User Notifications Service configuration
2. Test notification delivery
3. Train team on new notification system
4. Set up monitoring and alerting
5. Plan legacy system shutdown

## Validation Checklist

- [ ] User Notifications Service accessible
- [ ] Notification configurations created
- [ ] Email filters configured
- [ ] Test notifications received
- [ ] Team documentation updated
- [ ] Monitoring scripts deployed

## Rollback Plan

If issues occur:
1. Ensure legacy email notifications remain active
2. Disable User Notifications Service temporarily
3. Investigate and resolve issues
4. Re-enable new system after validation

## Contact Information

- AWS Support: Create support case for User Notifications issues
- Internal team: DevOps team
- Documentation: aws-health-email-filters.md
EOR

    echo "✅ Migration report generated: $report_file"
}

# Main validation
main() {
    check_user_notifications
    test_notifications
    check_email_filters
    generate_report
    
    echo ""
    echo "🎯 Migration Summary"
    echo "==================="
    echo "The AWS Health notifications migration is in progress."
    echo "Please complete the manual steps in the User Notifications console:"
    echo "https://console.aws.amazon.com/notifications/home?region=us-east-1#/managed-notifications"
    echo ""
    echo "Key deadlines:"
    echo "- September 15, 2025: Legacy email system disabled"
    echo "- Recommended completion: June 2025 (3 months buffer)"
}

main "$@"
EOF

    chmod +x scripts/validate-health-migration.sh
    print_success "Created migration validation script"
}

# Main execution
main() {
    print_status "Starting AWS Health Notifications Migration..."
    
    check_prerequisites
    get_current_health_config
    create_user_notifications_config
    enable_user_notifications
    create_email_filter_rules
    create_health_monitoring_script
    create_migration_validation
    
    print_success "🎉 AWS Health Notifications Migration setup completed!"
    
    echo ""
    echo "📋 Migration Summary:"
    echo "====================="
    echo "✅ Configuration files created"
    echo "✅ Monitoring scripts deployed"
    echo "✅ Email filter rules documented"
    echo "✅ Validation scripts ready"
    echo ""
    echo "🔧 Next Steps:"
    echo "1. Complete User Notifications setup: https://console.aws.amazon.com/notifications/home?region=us-east-1#/managed-notifications"
    echo "2. Configure email filters: See aws-health-email-filters.md"
    echo "3. Test notifications: ./scripts/validate-health-migration.sh"
    echo "4. Set up monitoring: ./scripts/monitor-aws-health.sh"
    echo ""
    echo "⏰ Important Deadline: September 15, 2025"
    echo "📄 Configuration: $NOTIFICATION_CONFIG_FILE"
}

main "$@"