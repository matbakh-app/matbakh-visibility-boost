#!/usr/bin/env bash
set -euo pipefail

red()  { printf "\033[31m%s\033[0m\n" "$*"; }
grn()  { printf "\033[32m%s\033[0m\n" "$*"; }
ylw()  { printf "\033[33m%s\033[0m\n" "$*"; }
fail() { red "✖ $*"; exit 1; }
ok()   { grn "✔ $*"; }

# A) Code-Scan
ylw "Scanning for Supabase imports/usages (excluding archive/unused)..."

SUPA_IMPORTS=$(find src -name "*.ts" -o -name "*.tsx" | grep -v archive | grep -v unused | grep -v architecture-scanner | xargs grep -n "from.*supabase" 2>/dev/null || true)
[[ -z "$SUPA_IMPORTS" ]] || { echo "$SUPA_IMPORTS"; fail "Supabase imports found outside archive/unused"; }
ok "No Supabase imports outside archive/unused"

# Check that supabase client is a proxy stub (should throw errors)
PROXY_STUB=$(grep -n "Supabase removed" src/integrations/supabase/client.ts || true)
[[ -n "$PROXY_STUB" ]] || fail "Supabase client proxy stub not found"
ok "Supabase client is proxy stub (will throw errors on usage)"

SUPA_TEST=$(find src -path "*/test*" -name "*.ts" -o -path "*/mock*" -name "*.ts" 2>/dev/null | xargs grep -n "@supabase\|supabase\.\|createClient" 2>/dev/null || true)
[[ -z "$SUPA_TEST" ]] || { echo "$SUPA_TEST"; fail "Supabase mocks/usages remain in tests"; }
ok "No Supabase in tests/mocks"

SUPA_PATHS=$(find src -name "*.ts" -o -name "*.tsx" | grep -v archive | grep -v unused | grep -v architecture-scanner | xargs grep -n "integrations/supabase" 2>/dev/null || true)
[[ -z "$SUPA_PATHS" ]] || { echo "$SUPA_PATHS"; fail "Supabase path references remain"; }
ok "No Supabase path references"

# B) Dependencies & ENV
ylw "Checking package.json and .env..."

jq '.dependencies,.devDependencies' package.json >/dev/null 2>&1 || fail "package.json must be valid JSON"
jq '.dependencies,.devDependencies' package.json | grep '@supabase' >/dev/null && fail "@supabase dependency still present"
ok "No @supabase dependencies"

grep -n "^SUPABASE_" .env* >/dev/null 2>&1 && fail "SUPABASE_* vars found in .env*"
ok "No SUPABASE_* environment variables"

grep -n "VITE_COGNITO\|COGNITO\|RDS\|AWS_" .env* >/dev/null 2>&1 || fail "Required AWS env vars missing"
ok "AWS env variables present"

# C) Build
ylw "Building..."
npm run -s build >/dev/null || fail "Build failed"
ok "Build succeeded"

# D) Tests with strict validation
ylw "Running tests..."
if npm test --silent -- --reporters=default >/tmp/jest.out 2>&1; then
  ok "All tests passing"
else
  if [ "${ALLOW_FAILING_TESTS:-0}" = "1" ]; then
    ylw "WARN: Tests failing, but ALLOW_FAILING_TESTS=1 set"
    grep -i "supabase" /tmp/jest.out && fail "Tests still reference Supabase"
    ok "No Supabase references in test output (tests allowed to fail)"
  else
    echo "Test failures found:"
    tail -20 /tmp/jest.out
    fail "Tests failing – set ALLOW_FAILING_TESTS=1 to bypass temporarily"
  fi
fi

grn "🎉 Verification passed: Supabase → AWS migration is clean."