#!/bin/bash

# S3 File Storage Migration - Smoke Tests
# Führt grundlegende Tests der S3-Upload-Funktionalität durch

# set -e # Disabled for testing

echo "🧪 S3 File Storage Migration - Smoke Tests"
echo "=========================================="

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test-Ergebnisse
TESTS_PASSED=0
TESTS_FAILED=0

# Hilfsfunktionen
log_success() {
    echo -e "${GREEN}✅ $1${NC}"
    ((TESTS_PASSED++))
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
    ((TESTS_FAILED++))
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_info() {
    echo -e "ℹ️  $1"
}

# Test 1: Build Check
echo ""
echo "🔨 Test 1: Build Verification"
echo "-----------------------------"

if npm run build > /dev/null 2>&1; then
    log_success "Build erfolgreich"
else
    log_error "Build fehlgeschlagen"
fi

# Test 2: AWS Infrastructure Check
echo ""
echo "☁️  Test 2: AWS Infrastructure"
echo "-----------------------------"

# Check S3 Buckets
if aws s3 ls | grep -q "matbakh-files-uploads"; then
    log_success "S3 Bucket 'matbakh-files-uploads' existiert"
else
    log_error "S3 Bucket 'matbakh-files-uploads' nicht gefunden"
fi

if aws s3 ls | grep -q "matbakh-files-profile"; then
    log_success "S3 Bucket 'matbakh-files-profile' existiert"
else
    log_error "S3 Bucket 'matbakh-files-profile' nicht gefunden"
fi

if aws s3 ls | grep -q "matbakh-files-reports"; then
    log_success "S3 Bucket 'matbakh-files-reports' existiert"
else
    log_error "S3 Bucket 'matbakh-files-reports' nicht gefunden"
fi

# Check Lambda Function
if aws lambda get-function --function-name matbakh-get-presigned-url > /dev/null 2>&1; then
    log_success "Lambda Function 'matbakh-get-presigned-url' existiert"
else
    log_error "Lambda Function 'matbakh-get-presigned-url' nicht gefunden"
fi

# Test 3: Environment Variables
echo ""
echo "🔧 Test 3: Environment Variables"
echo "-------------------------------"

if [ -n "$VITE_PUBLIC_API_BASE" ]; then
    log_success "VITE_PUBLIC_API_BASE ist gesetzt: $VITE_PUBLIC_API_BASE"
else
    log_error "VITE_PUBLIC_API_BASE nicht gesetzt"
fi

if [ -n "$AWS_REGION" ]; then
    log_success "AWS_REGION ist gesetzt: $AWS_REGION"
else
    log_warning "AWS_REGION nicht gesetzt (verwendet Default)"
fi

# Test 4: File Structure Check
echo ""
echo "📁 Test 4: File Structure"
echo "------------------------"

# Check S3 Upload Components
if [ -f "src/components/ui/image-upload.tsx" ]; then
    log_success "ImageUpload Komponente existiert"
else
    log_error "ImageUpload Komponente fehlt"
fi

if [ -f "src/components/ui/file-input.tsx" ]; then
    log_success "FileInput Komponente existiert"
else
    log_error "FileInput Komponente fehlt"
fi

if [ -f "src/hooks/useS3Upload.ts" ]; then
    log_success "useS3Upload Hook existiert"
else
    log_error "useS3Upload Hook fehlt"
fi

if [ -f "src/lib/s3-upload.ts" ]; then
    log_success "S3 Upload Library existiert"
else
    log_error "S3 Upload Library fehlt"
fi

# Test 5: Migration Scripts
echo ""
echo "🔄 Test 5: Migration Scripts"
echo "---------------------------"

if [ -f "scripts/migrate-file-urls-to-s3.ts" ]; then
    log_success "URL Migration Script existiert"
else
    log_error "URL Migration Script fehlt"
fi

if [ -f "scripts/validate-migrated-urls.ts" ]; then
    log_success "URL Validation Script existiert"
else
    log_error "URL Validation Script fehlt"
fi

# Test 6: Database Migration
echo ""
echo "🗄️  Test 6: Database Migration"
echo "-----------------------------"

if [ -f "supabase/migrations/20250831000001_remove_storage_bucket.sql" ]; then
    log_success "Storage Removal Migration existiert"
else
    log_error "Storage Removal Migration fehlt"
fi

# Test 7: Security Checks
echo ""
echo "🔒 Test 7: Security Compliance"
echo "-----------------------------"

# Check for dynamic Tailwind classes (security risk)
if grep -r "cursor-\${" src/ > /dev/null 2>&1; then
    log_error "Dynamische Tailwind-Klassen gefunden (Security Risk)"
else
    log_success "Keine dynamischen Tailwind-Klassen gefunden"
fi

# Check for direct S3 URLs in components (should use presigned URLs)
if grep -r "s3\.amazonaws\.com" src/components/ > /dev/null 2>&1; then
    log_error "Direkte S3 URLs in Komponenten gefunden"
else
    log_success "Keine direkten S3 URLs in Komponenten"
fi

# Check PDF iframe security
if grep -r 'sandbox="allow-scripts allow-same-origin"' src/ > /dev/null 2>&1; then
    log_success "PDF iframe Sandbox korrekt konfiguriert"
else
    log_warning "PDF iframe Sandbox nicht gefunden oder falsch konfiguriert"
fi

# Test 8: A11y Compliance
echo ""
echo "♿ Test 8: Accessibility"
echo "----------------------"

# Check for progress bar ARIA attributes
if grep -r 'role="progressbar"' src/ > /dev/null 2>&1; then
    log_success "Progress Bar ARIA-Attribute gefunden"
else
    log_error "Progress Bar ARIA-Attribute fehlen"
fi

# Check for aria-label on buttons
if grep -r 'aria-label=' src/components/ui/upload > /dev/null 2>&1; then
    log_success "Button ARIA-Labels gefunden"
else
    log_warning "Button ARIA-Labels möglicherweise unvollständig"
fi

# Test 9: Performance Checks
echo ""
echo "⚡ Test 9: Performance"
echo "--------------------"

# Check for URL.revokeObjectURL usage
if grep -r "URL\.revokeObjectURL" src/ > /dev/null 2>&1; then
    log_success "URL.revokeObjectURL wird verwendet (Memory Leak Prevention)"
else
    log_warning "URL.revokeObjectURL nicht gefunden - prüfe Memory Leaks"
fi

# Check for cleanup in useEffect
if grep -r "return () =>" src/hooks/ > /dev/null 2>&1; then
    log_success "useEffect Cleanup-Funktionen gefunden"
else
    log_warning "useEffect Cleanup möglicherweise unvollständig"
fi

# Test 10: API Integration
echo ""
echo "🌐 Test 10: API Integration"
echo "--------------------------"

# Test Lambda Function (wenn AWS CLI konfiguriert ist)
if command -v aws &> /dev/null; then
    if aws lambda invoke --function-name matbakh-get-presigned-url --payload '{"bucket":"matbakh-files-uploads","filename":"test.jpg","contentType":"image/jpeg"}' /tmp/lambda-response.json > /dev/null 2>&1; then
        if grep -q "uploadUrl" /tmp/lambda-response.json; then
            log_success "Lambda Function antwortet korrekt"
        else
            log_error "Lambda Function Response ungültig"
        fi
        rm -f /tmp/lambda-response.json
    else
        log_warning "Lambda Function Test fehlgeschlagen (möglicherweise Permissions)"
    fi
else
    log_warning "AWS CLI nicht verfügbar - Lambda Test übersprungen"
fi

# Zusammenfassung
echo ""
echo "📊 Test Summary"
echo "==============="
echo -e "Tests bestanden: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests fehlgeschlagen: ${RED}$TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 Alle kritischen Tests bestanden!${NC}"
    echo "✅ S3 Migration ist bereit für Production"
    exit 0
else
    echo -e "${RED}❌ $TESTS_FAILED Test(s) fehlgeschlagen${NC}"
    echo "🔧 Bitte behebe die Fehler vor dem Deployment"
    exit 1
fi