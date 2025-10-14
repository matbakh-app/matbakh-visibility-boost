#!/bin/bash

# Debug-Skript für VC-Result Probleme
# Funktioniert mit alter Supabase CLI

echo "🔍 Debugging VC-Result Issues..."
echo "=================================="

# 1. CLI Version prüfen
echo "📋 Supabase CLI Version:"
supabase --version || echo "❌ Supabase CLI nicht gefunden"

# 2. Projekt-Status
echo ""
echo "📊 Projekt-Status:"
supabase status 2>/dev/null || echo "⚠️ Kein lokales Projekt aktiv"

# 3. Fallback-Logs (funktioniert mit alter CLI)
echo ""
echo "📝 Projekt-Logs (letzte 30min, gefiltert nach vc-result):"
if command -v supabase >/dev/null 2>&1; then
  supabase logs --since 30m 2>/dev/null | grep -i "vc-result" -A3 -B3 || echo "⚠️ Keine vc-result Logs gefunden"
else
  echo "❌ Supabase CLI nicht verfügbar"
fi

# 4. Edge Function Test
echo ""
echo "🧪 Edge Function Test (vc-result):"
echo "Teste mit Demo-Token..."

# Test mit curl (falls verfügbar)
if command -v curl >/dev/null 2>&1; then
  echo "GET /functions/v1/vc-result?token=demo"
  curl -s -w "\nHTTP Status: %{http_code}\n" \
    "https://uheksobnyedarrpgxhju.supabase.co/functions/v1/vc-result?token=demo" \
    -H "Authorization: Bearer $SUPABASE_ANON_KEY" 2>/dev/null || echo "❌ Curl-Test fehlgeschlagen"
else
  echo "⚠️ curl nicht verfügbar für Function-Test"
fi

# 5. Manuelle Debug-URLs
echo ""
echo "🔗 Manuelle Debug-URLs:"
echo "Dashboard Logs: https://supabase.com/dashboard/project/$SUPABASE_PROJECT_ID/logs"
echo "Edge Functions: https://supabase.com/dashboard/project/$SUPABASE_PROJECT_ID/functions"
echo "Test VC-Result: https://matbakh.app/vc/result?t=demo"
echo "Test Kiro: https://matbakh.app/_kiro"

# 6. Environment Check
echo ""
echo "🔧 Environment Variables:"
echo "SUPABASE_PROJECT_ID: ${SUPABASE_PROJECT_ID:-'❌ NICHT GESETZT'}"
echo "SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY:+✅ GESETZT}"

echo ""
echo "✅ Debug-Skript abgeschlossen!"
echo ""
echo "📋 Nächste Schritte:"
echo "1. Prüfe Dashboard-Logs für vc-result Fehler"
echo "2. Teste /_kiro Route (sollte nicht auf /dashboard weiterleiten)"
echo "3. Teste /vc/result?t=demo (sollte Mock-Daten zeigen)"
echo "4. Prüfe CORS-Einstellungen in Supabase Dashboard"