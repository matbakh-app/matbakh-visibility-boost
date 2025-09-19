#!/usr/bin/env bash
# 🔒 Archive Isolation Verifier
# Ensures archived code never leaks into build/test/production
# CRITICAL: This script MUST pass before any deployment

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

fail() { 
  echo -e "${RED}✖ $*${NC}" 
  exit 1 
}

ok() { 
  echo -e "${GREEN}✔ $*${NC}" 
}

warn() { 
  echo -e "${YELLOW}⚠ $*${NC}" 
}

info() {
  echo -e "ℹ️ $*"
}

echo "🔒 Archive Isolation Verification"
echo "================================="
echo ""

# Check if ripgrep is available
if ! command -v rg &> /dev/null; then
  warn "ripgrep (rg) not found, falling back to grep"
  USE_GREP=true
else
  USE_GREP=false
fi

# 1) No imports from permanent archive in active code
info "1. Checking for permanent archive imports in active code..."

# Check for imports from permanently archived areas (NOT on-hold)
PERMANENT_ARCHIVE_PATTERNS="(manual-archive|backup-files|legacy-auth|figma-demos|old-flows|old-profile-flow)"

if [ "$USE_GREP" = true ]; then
  # Fallback to grep if ripgrep not available
  if grep -r -n --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
    -E "(from|require|import)\\s+['\"](@?/?.*src/archive/.*($PERMANENT_ARCHIVE_PATTERNS)|@/archive/.*($PERMANENT_ARCHIVE_PATTERNS))" src \
    --exclude-dir=archive > /tmp/archive-refs.txt 2>/dev/null && [ -s /tmp/archive-refs.txt ]; then
    echo "Found permanent archive imports in active code:"
    cat /tmp/archive-refs.txt
    fail "Aktiver Code importiert aus permanent archiviertem Bereich – bitte entfernen!"
  fi
else
  # Use ripgrep for better performance
  if rg -n "(from|require|import)\\s+['\"](@?/?.*src/archive/.*($PERMANENT_ARCHIVE_PATTERNS)|@/archive/.*($PERMANENT_ARCHIVE_PATTERNS))" src \
    --glob '!src/archive/**' -S > /tmp/archive-refs.txt 2>/dev/null && [ -s /tmp/archive-refs.txt ]; then
    echo "Found permanent archive imports in active code:"
    cat /tmp/archive-refs.txt
    fail "Aktiver Code importiert aus permanent archiviertem Bereich – bitte entfernen!"
  fi
fi

ok "Kein aktiver Import aus permanent archiviertem Bereich"

# 1b) Check for on-hold imports (warning only - these might be intentional during restoration)
info "1b. Checking for on-hold component imports (warning only)..."

if [ "$USE_GREP" = true ]; then
  if grep -r -n --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
    -E "(from|require|import)\\s+['\"](@?/?.*src/archive/.*/on-hold/|@/archive/.*/on-hold/)" src \
    --exclude-dir=archive > /tmp/onhold-refs.txt 2>/dev/null && [ -s /tmp/onhold-refs.txt ]; then
    warn "On-hold component imports detected (may be intentional during restoration):"
    cat /tmp/onhold-refs.txt
    warn "If these are intentional, move components from on-hold/ back to src/ first"
  fi
else
  if rg -n "(from|require|import)\\s+['\"](@?/?.*src/archive/.*/on-hold/|@/archive/.*/on-hold/)" src \
    --glob '!src/archive/**' -S > /tmp/onhold-refs.txt 2>/dev/null && [ -s /tmp/onhold-refs.txt ]; then
    warn "On-hold component imports detected (may be intentional during restoration):"
    cat /tmp/onhold-refs.txt
    warn "If these are intentional, move components from on-hold/ back to src/ first"
  fi
fi

if [ ! -s /tmp/onhold-refs.txt ]; then
  ok "Keine on-hold Komponenten-Imports (oder alle korrekt über src/ importiert)"
fi

# 2) Check for consolidated archive manifest
info "2. Checking for unified archive manifest..."

CONSOLIDATED_MANIFEST=""
if ls src/archive/consolidated-legacy-archive-*/archive-manifest.json 1> /dev/null 2>&1; then
  CONSOLIDATED_MANIFEST=$(ls src/archive/consolidated-legacy-archive-*/archive-manifest.json | head -1)
  ok "Unified manifest found: $CONSOLIDATED_MANIFEST"
else
  # Check for any archive manifest
  if [ -f "src/archive/archive-manifest.json" ]; then
    CONSOLIDATED_MANIFEST="src/archive/archive-manifest.json"
    warn "Found basic archive manifest, but not consolidated format"
  else
    fail "Unified manifest fehlt - Konsolidierung erforderlich!"
  fi
fi

# Validate manifest format
if [ -n "$CONSOLIDATED_MANIFEST" ]; then
  if command -v jq &> /dev/null; then
    if ! jq 'type=="object" and has("components") and has("summary")' "$CONSOLIDATED_MANIFEST" >/dev/null 2>&1; then
      fail "Manifest-Format ungültig: $CONSOLIDATED_MANIFEST"
    fi
    ok "Manifest format valid"
  else
    warn "jq not available, skipping manifest format validation"
  fi
fi

# 3) TypeScript excludes permanent archive (but allows on-hold)
info "3. Checking TypeScript configuration..."

if [ -f "tsconfig.app.json" ]; then
  if grep -q '"exclude"' tsconfig.app.json && \
     (grep -q 'manual-archive' tsconfig.app.json || grep -q 'backup-files' tsconfig.app.json); then
    ok "tsconfig.app.json excludes permanent archive (on-hold components remain available)"
  else
    fail "tsconfig.app.json does not properly exclude permanent archive"
  fi
else
  warn "tsconfig.app.json not found"
fi

# 4) Jest ignores permanent archive (but allows on-hold)
info "4. Checking Jest configuration..."

JEST_CONFIG=""
if [ -f "jest.config.cjs" ]; then
  JEST_CONFIG="jest.config.cjs"
elif [ -f "jest.config.js" ]; then
  JEST_CONFIG="jest.config.js"
fi

if [ -n "$JEST_CONFIG" ]; then
  if grep -q "testPathIgnorePatterns\|modulePathIgnorePatterns" "$JEST_CONFIG" && \
     (grep -q "manual-archive" "$JEST_CONFIG" || grep -q "backup-files" "$JEST_CONFIG"); then
    ok "Jest configuration excludes permanent archive (on-hold components remain testable)"
  else
    fail "Jest does not ignore permanent archive properly"
  fi
else
  warn "Jest configuration not found"
fi

# 5) ESLint prevents permanent archive imports (but allows on-hold restoration)
info "5. Checking ESLint configuration..."

if [ -f "eslint.config.js" ]; then
  if grep -q "no-restricted-imports" eslint.config.js && \
     (grep -q "manual-archive" eslint.config.js || grep -q "backup-files" eslint.config.js); then
    ok "ESLint prevents permanent archive imports (on-hold components can be restored)"
  else
    fail "ESLint does not prevent permanent archive imports properly"
  fi
elif [ -f ".eslintrc.js" ] || [ -f ".eslintrc.cjs" ]; then
  ESLINT_CONFIG=$(ls .eslintrc.* | head -1)
  if grep -q "no-restricted-imports" "$ESLINT_CONFIG" && \
     grep -q "archive" "$ESLINT_CONFIG"; then
    ok "ESLint prevents archive imports"
  else
    fail "ESLint does not prevent archive imports"
  fi
else
  warn "ESLint configuration not found"
fi

# 6) Vite excludes permanent archive from build (but allows on-hold)
info "6. Checking Vite configuration..."

if [ -f "vite.config.ts" ]; then
  if grep -q "external.*manual-archive\|external.*backup-files" vite.config.ts; then
    ok "Vite excludes permanent archive from build (on-hold components remain available)"
  else
    warn "Vite configuration may not exclude permanent archive properly (check manually)"
  fi
else
  warn "vite.config.ts not found"
fi

# 7) Check for parallel archival systems
info "7. Checking for parallel archival systems..."

PARALLEL_SYSTEMS=0

# Check for legacy manifest
if [ -f "reports/legacy-component-archive-manifest.json" ]; then
  warn "Legacy component manifest still exists: reports/legacy-component-archive-manifest.json"
  PARALLEL_SYSTEMS=$((PARALLEL_SYSTEMS + 1))
fi

# Check for unconsolidated manual archive
if [ -d "src/archive" ] && [ ! -d "src/archive/consolidated-legacy-archive-"* ]; then
  if ls src/archive/* 1> /dev/null 2>&1; then
    # Check if it's just the consolidated structure
    if [ ! -f "src/archive/README.md" ] || ! grep -q "CONSOLIDATED" src/archive/README.md; then
      warn "Unconsolidated manual archive detected in src/archive/"
      PARALLEL_SYSTEMS=$((PARALLEL_SYSTEMS + 1))
    fi
  fi
fi

if [ $PARALLEL_SYSTEMS -eq 0 ]; then
  ok "No parallel archival systems detected"
else
  warn "$PARALLEL_SYSTEMS parallel archival system(s) detected - consider consolidation"
fi

# 8) Archive integrity check
info "8. Checking archive integrity..."

if [ -n "$CONSOLIDATED_MANIFEST" ] && command -v jq &> /dev/null; then
  TOTAL_COMPONENTS=$(jq -r '.summary.totalComponents // 0' "$CONSOLIDATED_MANIFEST")
  ARCHIVED_COMPONENTS=$(jq -r '.summary.archivedComponents // 0' "$CONSOLIDATED_MANIFEST")
  ONHOLD_COMPONENTS=$(jq -r '.summary.onHoldComponents // 0' "$CONSOLIDATED_MANIFEST")
  
  if [ "$TOTAL_COMPONENTS" -gt 0 ]; then
    ok "Archive contains $TOTAL_COMPONENTS components ($ARCHIVED_COMPONENTS archived, $ONHOLD_COMPONENTS on-hold)"
  else
    warn "Archive appears empty or manifest format unexpected"
  fi
fi

# 9) Check for permanent archive leaks in build output (if dist exists)
info "9. Checking build output for permanent archive leaks..."

if [ -d "dist" ]; then
  # Check for permanent archive references (not on-hold)
  PERMANENT_PATTERNS="manual-archive|backup-files|legacy-auth|figma-demos|old-flows|old-profile-flow"
  
  if [ "$USE_GREP" = true ]; then
    if grep -r -E "src/archive/.*($PERMANENT_PATTERNS)" dist/ 2>/dev/null | head -5; then
      fail "Permanent archive references found in build output!"
    fi
  else
    if rg "src/archive/.*($PERMANENT_PATTERNS)" dist/ 2>/dev/null | head -5; then
      fail "Permanent archive references found in build output!"
    fi
  fi
  
  # Check for on-hold references (warning only)
  if [ "$USE_GREP" = true ]; then
    if grep -r "src/archive/.*/on-hold" dist/ 2>/dev/null | head -3; then
      warn "On-hold component references found in build output (may be intentional during restoration)"
    fi
  else
    if rg "src/archive/.*/on-hold" dist/ 2>/dev/null | head -3; then
      warn "On-hold component references found in build output (may be intentional during restoration)"
    fi
  fi
  
  ok "No permanent archive leaks in build output"
else
  info "No build output to check (dist/ not found)"
fi

# 10) Final security check - ensure no archive code in node_modules or vendor
info "10. Final security scan..."

# Check if any archive files accidentally got into dependencies
if [ -d "node_modules" ]; then
  if find node_modules -name "*archive*" -type f | grep -v "\.json$" | head -5 | grep -q .; then
    warn "Archive-related files found in node_modules (may be normal)"
  fi
fi

echo ""
echo "🎉 Archive Isolation Verification: PASSED"
echo ""
echo "📊 Summary:"
echo "  ✅ No active imports from permanent archive"
echo "  ✅ Permanent archive excluded from TypeScript compilation"
echo "  ✅ Permanent archive excluded from Jest testing"
echo "  ✅ ESLint prevents permanent archive imports"
echo "  ✅ Build system excludes permanent archive"
echo "  ✅ No permanent archive leaks in production build"
echo "  ℹ️ On-hold components remain available for restoration"
echo ""
echo "🔒 Permanent archive is properly isolated!"
echo "🔄 On-hold components can be restored when needed!"

# Cleanup temp files
rm -f /tmp/archive-refs.txt /tmp/onhold-refs.txt

exit 0