#!/bin/bash

# AUTOMATISIERTES TEST-SCRIPT FÜR MATBAKH.APP
# Dieses Script führt alle Tests automatisch aus und erstellt einen Bericht

echo "🚀 Matbakh.app Automatisierte Test Suite"
echo "<REDACTED_AWS_SECRET_ACCESS_KEY>"
echo ""

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funktionen
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Test Ergebnisse sammeln
RESULTS_FILE="/tmp/matbakh_test_results.json"
echo '{"tests": [], "summary": {}}' > $RESULTS_FILE

# 1. Umgebung prüfen
log_info "Prüfe Testumgebung..."

# Prüfe ob Supabase lokal läuft
if ! curl -s http://localhost:54321/health > /dev/null; then
    log_error "Supabase läuft nicht lokal. Starte mit: supabase start"
    exit 1
fi

log_success "Supabase läuft"

# Prüfe Node.js/npm
if ! command -v npm &> /dev/null; then
    log_error "npm nicht gefunden"
    exit 1
fi

log_success "npm verfügbar"

# 2. Abhängigkeiten prüfen
log_info "Prüfe Test-Abhängigkeiten..."

if ! npm list vitest > /dev/null 2>&1; then
    log_warning "Vitest nicht installiert, installiere..."
    npm install --save-dev vitest
fi

log_success "Test-Abhängigkeiten OK"

# 3. Edge Functions Status prüfen
log_info "Prüfe Edge Functions..."

FUNCTIONS_STATUS=$(curl -s http://localhost:54321/functions/v1/enhanced-visibility-check || echo "ERROR")
if [[ $FUNCTIONS_STATUS == *"ERROR"* ]]; then
    log_warning "Enhanced-visibility-check Function nicht erreichbar"
    log_info "Starte Function..."
    supabase functions serve enhanced-visibility-check &
    SERVE_PID=$!
    sleep 5
else
    log_success "Edge Functions erreichbar"
fi

# 4. Basis-Tests ausführen
log_info "Führe Basis-Tests aus..."

# Unit Tests
npm run test test/enhanced-visibility-check.test.ts 2>&1 | tee /tmp/unit_test_output.log
UNIT_TEST_EXIT_CODE=${PIPESTATUS[0]}

if [ $UNIT_TEST_EXIT_CODE -eq 0 ]; then
    log_success "Unit Tests bestanden"
    echo '{"test": "unit_tests", "status": "passed", "details": "All unit tests passed"}' | jq '.' >> $RESULTS_FILE
else
    log_error "Unit Tests fehlgeschlagen"
    echo '{"test": "unit_tests", "status": "failed", "details": "Unit tests failed"}' | jq '.' >> $RESULTS_FILE
fi

# 5. Integration Tests
log_info "Führe Integration Tests aus..."

npm run test test/automated-visibility-test-suite.ts 2>&1 | tee /tmp/integration_test_output.log
INTEGRATION_TEST_EXIT_CODE=${PIPESTATUS[0]}

if [ $INTEGRATION_TEST_EXIT_CODE -eq 0 ]; then
    log_success "Integration Tests bestanden"
    echo '{"test": "integration_tests", "status": "passed", "details": "All integration tests passed"}' | jq '.' >> $RESULTS_FILE
else
    log_error "Integration Tests fehlgeschlagen"
    echo '{"test": "integration_tests", "status": "failed", "details": "Integration tests failed"}' | jq '.' >> $RESULTS_FILE
fi

# 5.1. Dual-Pipeline Tests
log_info "Führe Dual-Pipeline Tests aus..."

npm run test test/integration/full-visibility-pipeline.test.ts 2>&1 | tee /tmp/dual_pipeline_test_output.log
DUAL_PIPELINE_EXIT_CODE=${PIPESTATUS[0]}

if [ $DUAL_PIPELINE_EXIT_CODE -eq 0 ]; then
    log_success "Dual-Pipeline Tests bestanden"
    echo '{"test": "dual_pipeline_tests", "status": "passed", "details": "Feature flag and fallback tests passed"}' | jq '.' >> $RESULTS_FILE
else
    log_error "Dual-Pipeline Tests fehlgeschlagen"
    echo '{"test": "dual_pipeline_tests", "status": "failed", "details": "Feature flag and fallback tests failed"}' | jq '.' >> $RESULTS_FILE
fi

# 5.2. Provider Tracking Tests
log_info "Führe Provider Tracking Tests aus..."

npx vitest run test/integration/provider-tracking.test.ts 2>&1 | tee /tmp/provider_tracking_test_output.log
PROVIDER_TRACKING_EXIT_CODE=${PIPESTATUS[0]}

if [ $PROVIDER_TRACKING_EXIT_CODE -eq 0 ]; then
    log_success "Provider Tracking Tests bestanden"
    echo '{"test": "provider_tracking_tests", "status": "passed", "details": "End-to-end provider tracking verified"}' | jq '.' >> $RESULTS_FILE
else
    log_error "Provider Tracking Tests fehlgeschlagen" 
    echo '{"test": "provider_tracking_tests", "status": "failed", "details": "Provider tracking tests failed"}' | jq '.' >> $RESULTS_FILE
fi

# 5.3. Google Services Integration Tests
log_info "Führe Google Services Integration Tests aus..."

npx vitest run test/integration/google-services.test.ts 2>&1 | tee /tmp/google_services_test_output.log
GOOGLE_SERVICES_EXIT_CODE=${PIPESTATUS[0]}

if [ $GOOGLE_SERVICES_EXIT_CODE -eq 0 ]; then
    log_success "Google Services Tests bestanden"
    echo '{"test": "google_services_tests", "status": "passed", "details": "Google API integration verified"}' | jq '.' >> $RESULTS_FILE
else
    log_error "Google Services Tests fehlgeschlagen"
    echo '{"test": "google_services_tests", "status": "failed", "details": "Google services integration tests failed"}' | jq '.' >> $RESULTS_FILE
fi

# 5.4. Google OAuth Flow Tests
log_info "Führe Google OAuth Flow Tests aus..."

npx vitest run test/integration/google-oauth-flow.test.ts 2>&1 | tee /tmp/google_oauth_test_output.log
GOOGLE_OAUTH_EXIT_CODE=${PIPESTATUS[0]}

if [ $GOOGLE_OAUTH_EXIT_CODE -eq 0 ]; then
    log_success "Google OAuth Flow Tests bestanden"
    echo '{"test": "google_oauth_flow_tests", "status": "passed", "details": "OAuth integration and token management verified"}' | jq '.' >> $RESULTS_FILE
else
    log_error "Google OAuth Flow Tests fehlgeschlagen"
    echo '{"test": "google_oauth_flow_tests", "status": "failed", "details": "OAuth flow tests failed"}' | jq '.' >> $RESULTS_FILE
fi

# 5.5. Google Metrics UI Tests
log_info "Führe Google Metrics UI Tests aus..."

npx vitest run test/unit/visibility-metrics-ui.test.tsx 2>&1 | tee /tmp/ui_metrics_test_output.log
UI_METRICS_EXIT_CODE=${PIPESTATUS[0]}

if [ $UI_METRICS_EXIT_CODE -eq 0 ]; then
    log_success "Google Metrics UI Tests bestanden"
    echo '{"test": "ui_metrics_tests", "status": "passed", "details": "UI component rendering with Google metrics verified"}' | jq '.' >> $RESULTS_FILE
else
    log_error "Google Metrics UI Tests fehlgeschlagen"
    echo '{"test": "ui_metrics_tests", "status": "failed", "details": "UI metrics tests failed"}' | jq '.' >> $RESULTS_FILE
fi

# 5.6. E2E Google Metrics Integration Tests
log_info "Führe E2E Google Metrics Integration Tests aus..."

npx playwright test test/e2e/google-metrics-integration.spec.ts 2>&1 | tee /tmp/e2e_metrics_test_output.log
E2E_METRICS_EXIT_CODE=${PIPESTATUS[0]}

if [ $E2E_METRICS_EXIT_CODE -eq 0 ]; then
    log_success "E2E Google Metrics Tests bestanden"
    echo '{"test": "e2e_metrics_tests", "status": "passed", "details": "End-to-end Google metrics integration verified"}' | jq '.' >> $RESULTS_FILE
else
    log_error "E2E Google Metrics Tests fehlgeschlagen"
    echo '{"test": "e2e_metrics_tests", "status": "failed", "details": "E2E metrics tests failed"}' | jq '.' >> $RESULTS_FILE
fi

# 5.7. Redeem-Code Integration Tests
log_info "Führe Redeem-Code Integration Tests aus..."

npx vitest run test/integration/redeem-code.test.ts 2>&1 | tee /tmp/redeem_code_test_output.log
REDEEM_CODE_EXIT_CODE=${PIPESTATUS[0]}

if [ $REDEEM_CODE_EXIT_CODE -eq 0 ]; then
    log_success "Redeem-Code Tests bestanden"
    echo '{"test": "redeem_code_tests", "status": "passed", "details": "Redeem code generation and redemption verified"}' | jq '.' >> $RESULTS_FILE
else
    log_error "Redeem-Code Tests fehlgeschlagen"
    echo '{"test": "redeem_code_tests", "status": "failed", "details": "Redeem code tests failed"}' | jq '.' >> $RESULTS_FILE
fi

# 5.8. Redeem-Code Security Tests
log_info "Führe Redeem-Code Security Tests aus..."

npx vitest run test/security/redeem-code-security.test.ts 2>&1 | tee /tmp/redeem_security_test_output.log
REDEEM_SECURITY_EXIT_CODE=${PIPESTATUS[0]}

if [ $REDEEM_SECURITY_EXIT_CODE -eq 0 ]; then
    log_success "Redeem-Code Security Tests bestanden"
    echo '{"test": "redeem_security_tests", "status": "passed", "details": "Security policies and RLS verified"}' | jq '.' >> $RESULTS_FILE
else
    log_error "Redeem-Code Security Tests fehlgeschlagen"
    echo '{"test": "redeem_security_tests", "status": "failed", "details": "Security tests failed"}' | jq '.' >> $RESULTS_FILE
fi

# 5.9. Redeem-Code E2E Tests
log_info "Führe Redeem-Code E2E Tests aus..."

npx vitest run test/integration/redeem-code-e2e.test.ts 2>&1 | tee /tmp/redeem_e2e_test_output.log
REDEEM_E2E_EXIT_CODE=${PIPESTATUS[0]}

if [ $REDEEM_E2E_EXIT_CODE -eq 0 ]; then
    log_success "Redeem-Code E2E Tests bestanden"
    echo '{"test": "redeem_e2e_tests", "status": "passed", "details": "End-to-end redeem code flow verified"}' | jq '.' >> $RESULTS_FILE
else
    log_error "Redeem-Code E2E Tests fehlgeschlagen"
    echo '{"test": "redeem_e2e_tests", "status": "failed", "details": "E2E redeem code tests failed"}' | jq '.' >> $RESULTS_FILE
fi

# 5.10. Redeem-Code UI Tests
log_info "Führe Redeem-Code UI Tests aus..."

npx vitest run test/components/redeem-ui.test.tsx 2>&1 | tee /tmp/redeem_ui_test_output.log
REDEEM_UI_EXIT_CODE=${PIPESTATUS[0]}

if [ $REDEEM_UI_EXIT_CODE -eq 0 ]; then
    log_success "Redeem-Code UI Tests bestanden"
    echo '{"test": "redeem_ui_tests", "status": "passed", "details": "UI components rendering and interaction verified"}' | jq '.' >> $RESULTS_FILE
else
    log_error "Redeem-Code UI Tests fehlgeschlagen"
    echo '{"test": "redeem_ui_tests", "status": "failed", "details": "UI tests failed"}' | jq '.' >> $RESULTS_FILE
fi

# 6. End-to-End API Tests
log_info "Führe E2E API Tests aus..."

# Test 1: Enhanced Visibility Check
TEST_PAYLOAD='{"businessName": "Auto Test Restaurant", "location": "Berlin, Deutschland", "mainCategory": "Essen & Trinken", "email": "autotest@restaurant.de", "website": "https://autotest.de"}'

API_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -d "$TEST_PAYLOAD" \
  http://localhost:54321/functions/v1/enhanced-visibility-check)

if [[ $API_RESPONSE == *"leadId"* ]]; then
    log_success "Enhanced Visibility Check API funktioniert"
    LEAD_ID=$(echo $API_RESPONSE | jq -r '.leadId')
    
    # Warte auf Completion
    log_info "Warte auf Verarbeitung (Lead ID: $LEAD_ID)..."
    for i in {1..30}; do
        LEAD_STATUS=$(curl -s "http://localhost:54321/rest/v1/visibility_check_leads?id=eq.$LEAD_ID&select=status" \
                      -H "apikey: $SUPABASE_ANON_KEY" | jq -r '.[0].status // "pending"')
        
        if [ "$LEAD_STATUS" = "completed" ]; then
            log_success "Lead Verarbeitung abgeschlossen nach ${i}s"
            break
        elif [ $i -eq 30 ]; then
            log_warning "Lead Verarbeitung dauert länger als 30s (Status: $LEAD_STATUS)"
        fi
        
        sleep 1
    done
    
    echo '{"test": "api_visibility_check", "status": "passed", "details": "API responded correctly", "leadId": "'$LEAD_ID'"}' | jq '.' >> $RESULTS_FILE
else
    log_error "Enhanced Visibility Check API fehlgeschlagen"
    echo '{"test": "api_visibility_check", "status": "failed", "details": "API did not respond correctly"}' | jq '.' >> $RESULTS_FILE
fi

# 7. Database Consistency Check
log_info "Prüfe Datenbank-Konsistenz..."

DB_LEADS=$(curl -s "http://localhost:54321/rest/v1/visibility_check_leads?select=count" \
           -H "apikey: $SUPABASE_ANON_KEY" | jq -r '.[0].count // 0')

DB_RESULTS=$(curl -s "http://localhost:54321/rest/v1/visibility_check_results?select=count" \
             -H "apikey: $SUPABASE_ANON_KEY" | jq -r '.[0].count // 0')

log_info "Database Status: $DB_LEADS Leads, $DB_RESULTS Results"

if [ $DB_LEADS -gt 0 ] && [ $DB_RESULTS -gt 0 ]; then
    log_success "Datenbank-Konsistenz OK"
    echo '{"test": "database_consistency", "status": "passed", "details": "Database has data"}' | jq '.' >> $RESULTS_FILE
else
    log_warning "Datenbank hat wenig/keine Daten"
    echo '{"test": "database_consistency", "status": "warning", "details": "Database might be empty"}' | jq '.' >> $RESULTS_FILE
fi

# 8. Cleanup
if [ ! -z "$SERVE_PID" ]; then
    kill $SERVE_PID 2>/dev/null
    log_info "Function Server gestoppt"
fi

# 9. Test Report generieren
log_info "Generiere Test Report..."

PASSED_TESTS=$(cat $RESULTS_FILE | jq '[.tests[] | select(.status == "passed")] | length')
FAILED_TESTS=$(cat $RESULTS_FILE | jq '[.tests[] | select(.status == "failed")] | length')
TOTAL_TESTS=$(cat $RESULTS_FILE | jq '.tests | length')

echo ""
echo "🏁 TEST ZUSAMMENFASSUNG"
echo "======================"
echo "Gesamt Tests: $TOTAL_TESTS"
echo "Bestanden: $PASSED_TESTS"
echo "Fehlgeschlagen: $FAILED_TESTS"
echo ""

# Update Summary
cat $RESULTS_FILE | jq --arg passed "$PASSED_TESTS" --arg failed "$FAILED_TESTS" --arg total "$TOTAL_TESTS" \
  '.summary = {"total": ($total | tonumber), "passed": ($passed | tonumber), "failed": ($failed | tonumber), "timestamp": "'$(date -Iseconds)'"}' \
  > /tmp/final_results.json && mv /tmp/final_results.json $RESULTS_FILE

if [ $FAILED_TESTS -eq 0 ]; then
    log_success "Alle Tests bestanden! 🎉"
    echo ""
    echo "✅ Das System ist bereit für den nächsten Entwicklungsschritt"
    echo ""
    echo "NÄCHSTE SCHRITTE:"
    echo "1. Bedrock-KI Integration finalisieren"
    echo "2. Google Services APIs anbinden"
    echo "3. Production Deployment vorbereiten"
    
    exit 0
else
    log_error "Einige Tests sind fehlgeschlagen"
    echo ""
    echo "🔍 TROUBLESHOOTING:"
    echo "- Prüfe Logs in /tmp/*_test_output.log"
    echo "- Stelle sicher dass alle Services laufen"
    echo "- Prüfe Edge Function Deployment"
    
    exit 1
fi