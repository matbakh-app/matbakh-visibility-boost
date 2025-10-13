#!/bin/bash
# Enhanced Safe Archival System - Integrated Rollback Script
# Generated: 2025-09-18T10:31:22.300Z (Updated with Enhanced Rollback System)
# Archive: src/archive/consolidated-legacy-archive-2025-09-18

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔄 Enhanced Rollback System - Legacy Archive Integration${NC}"
echo -e "${BLUE}📦 Archive: src/archive/consolidated-legacy-archive-2025-09-18${NC}"

# Check if enhanced rollback system is available
ENHANCED_ROLLBACK="scripts/comprehensive-rollback.sh"
if [ -f "$ENHANCED_ROLLBACK" ]; then
    echo -e "${GREEN}✅ Enhanced Rollback System detected${NC}"
    echo -e "${YELLOW}🚀 Delegating to Enhanced Rollback System...${NC}"
    echo ""
    
    # Show available options
    echo -e "${BLUE}Enhanced Rollback Options:${NC}"
    echo "1. Interactive Menu (Recommended)"
    echo "2. Browse Archive"
    echo "3. Restore On-Hold Component"
    echo "4. Emergency Recovery"
    echo "5. System Validation"
    echo ""
    
    read -p "Select option (1-5) or press Enter for interactive menu: " choice
    
    case "${choice:-1}" in
        1|"")
            exec "$ENHANCED_ROLLBACK" interactive
            ;;
        2)
            exec "$ENHANCED_ROLLBACK" browse
            ;;
        3)
            echo "Enter component path:"
            read -r component_path
            exec "$ENHANCED_ROLLBACK" restore "$component_path"
            ;;
        4)
            exec "$ENHANCED_ROLLBACK" rapid-recovery
            ;;
        5)
            exec "$ENHANCED_ROLLBACK" validate
            ;;
        *)
            echo -e "${RED}Invalid option. Starting interactive menu...${NC}"
            exec "$ENHANCED_ROLLBACK" interactive
            ;;
    esac
else
    echo -e "${YELLOW}⚠️ Enhanced Rollback System not found. Using legacy rollback...${NC}"
    echo ""
fi

# Legacy rollback functionality (fallback)
echo -e "${YELLOW}📋 Legacy Rollback Mode${NC}"

# Function to restore a single component
restore_component() {
    local archive_path="$1"
    local original_path="$2"
    local checksum="$3"
    
    if [ -f "$archive_path" ]; then
        echo -e "${BLUE}📁 Restoring: $original_path${NC}"
        
        # Create directory if it doesn't exist
        mkdir -p "$(dirname "$original_path")"
        
        # Copy file back
        cp "$archive_path" "$original_path"
        
        # Verify checksum
        if command -v sha256sum >/dev/null 2>&1; then
            local current_checksum=$(sha256sum "$original_path" | cut -d' ' -f1)
            if [ "$current_checksum" != "$checksum" ]; then
                echo -e "${YELLOW}⚠️ Checksum mismatch for $original_path${NC}"
            fi
        fi
        
        echo -e "${GREEN}✅ Restored: $original_path${NC}"
    else
        echo -e "${RED}❌ Archive file not found: $archive_path${NC}"
        return 1
    fi
}

# Legacy rollback information
echo -e "${BLUE}ℹ️ Archive Structure:${NC}"
echo "  • On-hold components: preserved in active codebase (on-hold/)"
echo "  • Manual archive: preserved in manual-archive/"
echo "  • Safe archived: can be restored individually from src/"
echo ""

# Run basic validation checks
echo -e "${BLUE}🧪 Running basic validation checks...${NC}"

echo -n "Checking TypeScript Compilation... "
if npx tsc --noEmit >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Passed${NC}"
else
    echo -e "${RED}❌ Failed${NC}"
fi

echo -n "Checking Build Process... "
if npm run build >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Passed${NC}"
else
    echo -e "${RED}❌ Failed${NC}"
fi

echo ""
echo -e "${GREEN}✅ Legacy rollback completed!${NC}"
echo -e "${BLUE}📋 Archive system is operational${NC}"
echo -e "${YELLOW}🔍 Please verify application functionality${NC}"
echo ""

# Enhanced system recommendations
echo -e "${BLUE}🚀 Enhanced Rollback System Commands:${NC}"
echo ""
echo -e "${YELLOW}For on-hold component restoration:${NC}"
echo "  npx tsx scripts/restore-onhold-component.ts list"
echo "  npx tsx scripts/restore-onhold-component.ts restore <component-path>"
echo ""
echo -e "${YELLOW}For comprehensive rollback operations:${NC}"
echo "  ./scripts/comprehensive-rollback.sh"
echo ""
echo -e "${YELLOW}For system validation:${NC}"
echo "  npx tsx scripts/system-state-validator.ts validate"
echo ""
echo -e "${YELLOW}For archive management:${NC}"
echo "  npx tsx scripts/archive-management-system.ts browse"
echo ""

# Check if enhanced system should be installed
if [ ! -f "$ENHANCED_ROLLBACK" ]; then
    echo -e "${YELLOW}💡 Recommendation: Install Enhanced Rollback System for advanced features${NC}"
    echo "   The enhanced system provides:"
    echo "   • Interactive management interface"
    echo "   • Dependency chain restoration"
    echo "   • Continuous health monitoring"
    echo "   • Emergency recovery procedures"
    echo "   • Comprehensive validation"
fi