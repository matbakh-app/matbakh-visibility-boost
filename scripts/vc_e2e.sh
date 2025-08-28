#!/usr/bin/env bash
set -euo pipefail

BASE="${VITE_PUBLIC_API_BASE:-https://guf7ho7bze.execute-api.eu-central-1.amazonaws.com/prod}"
echo "E2E start (dev)…"

# 1) Start VC (simulate partner embed)
curl -sS -X POST "$BASE/vc/start" \
  -H "content-type: application/json" \
  -d '{"email":"owner@example.com","partner_id":"PARTNER_ABC","embed":true}' | tee /tmp/vc_start.json

TOKEN=$(sed -n 's/.*"token":"\([^"]*\)".*/\1/p' /tmp/vc_start.json)
[ -z "$TOKEN" ] && echo "No token from start" && exit 1
echo "token=$TOKEN"

# 2) (Dev) Trigger stub run
curl -sS -X POST "$BASE/vc/run-stub" -H "content-type: application/json" -d "{\"token\":\"$TOKEN\"}" >/dev/null || true

# 3) Fetch result
curl -sS "$BASE/vc/result?t=$TOKEN" -I | awk 'BEGIN{IGNORECASE=1} /^HTTP|^etag:|^content-type:|^x-cache:|^x-amz-cf-/{print}'
echo "E2E done."