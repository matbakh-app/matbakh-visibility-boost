#!/bin/bash
# Comprehensive Rollback Script - Enhanced Safe Recovery Mode
# Integrates Enhanced Rollback System and Archive Management System
# Provides emergency recovery, component restoration, and system validation

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ARCHIVE_DIR="src/archive/consolidated-legacy-archive-2025-09-18"
BACKUP_DIR="src/archive/rollback-checkpoints"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="rollback-$(date +%Y%m%d-%H%M%S).log"

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

# Emergency stop function
emergency_stop() {
    local reason="$1"
    log_error "🚨 EMERGENCY STOP ACTIVATED: $reason"
    
    # Create emergency checkpoint
    npx tsx "$SCRIPT_DIR/enhanced-rollback-system.ts" checkpoint "emergency-stop" || true
    
    # Stop all running processes
    log "Stopping all development processes..."
    pkill -f "npm run dev" || true
    pkill -f "vite" || true
    
    # Create emergency backup
    local emergency_backup="$BACKUP_DIR/emergency-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$emergency_backup"
    
    # Backup critical files
    cp package.json "$emergency_backup/" 2>/dev/null || true
    cp tsconfig.json "$emergency_backup/" 2>/dev/null || true
    cp vite.config.ts "$emergency_backup/" 2>/dev/null || true
    
    log_success "Emergency stop completed. System state preserved."
    log "Emergency backup created: $emergency_backup"
    log "Log file: $LOG_FILE"
    
    exit 1
}

# Validation function
run_validation() {
    log "🧪 Running system validation..."
    
    local validation_failed=false
    
    # TypeScript compilation
    log "Checking TypeScript compilation..."
    if ! npx tsc --noEmit 2>/dev/null; then
        log_error "TypeScript compilation failed"
        validation_failed=true
    else
        log_success "TypeScript compilation passed"
    fi
    
    # Build process
    log "Checking build process..."
    if ! npm run build >/dev/null 2>&1; then
        log_error "Build process failed"
        validation_failed=true
    else
        log_success "Build process passed"
    fi
    
    # Test suite (non-blocking)
    log "Running test suite..."
    if ! npm test -- --passWithNoTests >/dev/null 2>&1; then
        log_warning "Some tests failed (non-blocking)"
    else
        log_success "Test suite passed"
    fi
    
    if [ "$validation_failed" = true ]; then
        return 1
    fi
    
    return 0
}

# Component restoration function
restore_component() {
    local component_path="$1"
    local options="$2"
    
    log "🔄 Restoring component: $component_path"
    
    if npx tsx "$SCRIPT_DIR/enhanced-rollback-system.ts" restore "$component_path" $options; then
        log_success "Component restored: $component_path"
        return 0
    else
        log_error "Failed to restore component: $component_path"
        return 1
    fi
}

# Dependency chain restoration
restore_dependency_chain() {
    local component_path="$1"
    local options="$2"
    
    log "🔗 Restoring dependency chain for: $component_path"
    
    if npx tsx "$SCRIPT_DIR/enhanced-rollback-system.ts" restore-chain "$component_path" $options; then
        log_success "Dependency chain restored for: $component_path"
        return 0
    else
        log_error "Failed to restore dependency chain for: $component_path"
        return 1
    fi
}

# Rapid recovery function
rapid_recovery() {
    local checkpoint_id="$1"
    
    log "⚡ Initiating rapid recovery..."
    
    if [ -n "$checkpoint_id" ]; then
        log "Using checkpoint: $checkpoint_id"
    else
        log "Using latest available checkpoint"
    fi
    
    if npx tsx "$SCRIPT_DIR/enhanced-rollback-system.ts" rapid-recovery $checkpoint_id; then
        log_success "Rapid recovery completed"
        
        # Run validation after recovery
        if run_validation; then
            log_success "System validation passed after recovery"
            return 0
        else
            log_error "System validation failed after recovery"
            return 1
        fi
    else
        log_error "Rapid recovery failed"
        return 1
    fi
}

# Archive management functions
browse_archive() {
    log "📦 Opening archive browser..."
    npx tsx "$SCRIPT_DIR/archive-management-system.ts" browse
}

search_archive() {
    local search_args="$@"
    log "🔍 Searching archive with filters: $search_args"
    npx tsx "$SCRIPT_DIR/archive-management-system.ts" search $search_args
}

cleanup_archive() {
    local cleanup_options="$@"
    log "🧹 Running archive cleanup..."
    npx tsx "$SCRIPT_DIR/archive-management-system.ts" cleanup $cleanup_options
}

# Health monitoring
start_health_monitor() {
    local interval="${1:-30000}"
    log "💓 Starting health monitor (${interval}ms intervals)..."
    npx tsx "$SCRIPT_DIR/enhanced-rollback-system.ts" health-monitor "$interval" &
    local monitor_pid=$!
    echo "$monitor_pid" > "$BACKUP_DIR/health-monitor.pid"
    log_success "Health monitor started (PID: $monitor_pid)"
}

stop_health_monitor() {
    if [ -f "$BACKUP_DIR/health-monitor.pid" ]; then
        local monitor_pid=$(cat "$BACKUP_DIR/health-monitor.pid")
        if kill "$monitor_pid" 2>/dev/null; then
            log_success "Health monitor stopped (PID: $monitor_pid)"
        else
            log_warning "Health monitor process not found"
        fi
        rm -f "$BACKUP_DIR/health-monitor.pid"
    else
        log_warning "Health monitor PID file not found"
    fi
}

# Interactive menu
show_interactive_menu() {
    while true; do
        echo
        echo -e "${BLUE}=== Enhanced Rollback System - Interactive Menu ===${NC}"
        echo "1. Browse Archive"
        echo "2. Search Archive Components"
        echo "3. Restore Single Component"
        echo "4. Restore Dependency Chain"
        echo "5. Create System Checkpoint"
        echo "6. Rapid Recovery"
        echo "7. Run System Validation"
        echo "8. Start Health Monitor"
        echo "9. Stop Health Monitor"
        echo "10. Archive Cleanup"
        echo "11. Emergency Stop"
        echo "0. Exit"
        echo
        read -p "Select option (0-11): " choice
        
        case $choice in
            1)
                browse_archive
                ;;
            2)
                echo "Enter search filters (e.g., --origin=supabase --risk=high):"
                read -r search_filters
                search_archive $search_filters
                ;;
            3)
                echo "Enter component path:"
                read -r component_path
                echo "Enter options (e.g., --dry-run --validate-deps):"
                read -r options
                restore_component "$component_path" "$options"
                ;;
            4)
                echo "Enter component path:"
                read -r component_path
                echo "Enter options (e.g., --dry-run --max-depth=3):"
                read -r options
                restore_dependency_chain "$component_path" "$options"
                ;;
            5)
                echo "Enter phase name (optional):"
                read -r phase_name
                npx tsx "$SCRIPT_DIR/enhanced-rollback-system.ts" checkpoint "${phase_name:-manual}"
                ;;
            6)
                echo "Enter checkpoint ID (optional, leave empty for latest):"
                read -r checkpoint_id
                rapid_recovery "$checkpoint_id"
                ;;
            7)
                run_validation
                ;;
            8)
                echo "Enter monitoring interval in ms (default: 30000):"
                read -r interval
                start_health_monitor "${interval:-30000}"
                ;;
            9)
                stop_health_monitor
                ;;
            10)
                echo "Enter cleanup options (e.g., --dry-run --force):"
                read -r cleanup_options
                cleanup_archive $cleanup_options
                ;;
            11)
                echo "Enter emergency stop reason:"
                read -r reason
                emergency_stop "${reason:-Manual emergency stop}"
                ;;
            0)
                log "Exiting interactive menu"
                break
                ;;
            *)
                log_error "Invalid option: $choice"
                ;;
        esac
        
        echo
        read -p "Press Enter to continue..."
    done
}

# Main function
main() {
    log "🚀 Enhanced Rollback System - Comprehensive Recovery"
    log "Archive Directory: $ARCHIVE_DIR"
    log "Backup Directory: $BACKUP_DIR"
    log "Log File: $LOG_FILE"
    
    # Ensure directories exist
    mkdir -p "$BACKUP_DIR"
    
    # Check if archive exists
    if [ ! -d "$ARCHIVE_DIR" ]; then
        log_error "Archive directory not found: $ARCHIVE_DIR"
        exit 1
    fi
    
    # Check if required scripts exist
    if [ ! -f "$SCRIPT_DIR/enhanced-rollback-system.ts" ]; then
        log_error "Enhanced rollback system script not found"
        exit 1
    fi
    
    if [ ! -f "$SCRIPT_DIR/archive-management-system.ts" ]; then
        log_error "Archive management system script not found"
        exit 1
    fi
    
    # Parse command line arguments
    case "${1:-interactive}" in
        "restore")
            restore_component "$2" "${@:3}"
            ;;
        "restore-chain")
            restore_dependency_chain "$2" "${@:3}"
            ;;
        "rapid-recovery")
            rapid_recovery "$2"
            ;;
        "emergency-stop")
            emergency_stop "${2:-Manual emergency stop}"
            ;;
        "validate")
            run_validation
            ;;
        "browse")
            browse_archive
            ;;
        "search")
            search_archive "${@:2}"
            ;;
        "cleanup")
            cleanup_archive "${@:2}"
            ;;
        "health-start")
            start_health_monitor "$2"
            ;;
        "health-stop")
            stop_health_monitor
            ;;
        "interactive"|"")
            show_interactive_menu
            ;;
        "help"|"--help"|"-h")
            echo "Enhanced Rollback System - Usage:"
            echo
            echo "  $0 [command] [options]"
            echo
            echo "Commands:"
            echo "  restore <path> [options]        Restore single component"
            echo "  restore-chain <path> [options]  Restore component with dependencies"
            echo "  rapid-recovery [checkpoint-id]  Rapid system recovery"
            echo "  emergency-stop [reason]         Activate emergency stop"
            echo "  validate                        Run system validation"
            echo "  browse                          Browse archive"
            echo "  search [filters]                Search archive components"
            echo "  cleanup [options]               Archive cleanup"
            echo "  health-start [interval]         Start health monitor"
            echo "  health-stop                     Stop health monitor"
            echo "  interactive                     Interactive menu (default)"
            echo "  help                            Show this help"
            echo
            echo "Examples:"
            echo "  $0 restore src/components/auth/LoginForm.tsx --dry-run"
            echo "  $0 restore-chain src/pages/Dashboard.tsx --validate-deps"
            echo "  $0 rapid-recovery checkpoint-phase-3-1234567890"
            echo "  $0 emergency-stop \"Critical system failure\""
            echo "  $0 search --origin=supabase --risk=high"
            echo "  $0 cleanup --dry-run"
            ;;
        *)
            log_error "Unknown command: $1"
            log "Use '$0 help' for usage information"
            exit 1
            ;;
    esac
}

# Trap signals for emergency stop
trap 'emergency_stop "Script interrupted"' INT TERM

# Run main function
main "$@"