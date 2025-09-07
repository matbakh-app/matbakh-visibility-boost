#!/usr/bin/env bash
set -euo pipefail

# Phase 8.2 – Integration Validation Script
# Usage:
#   CLOUDFRONT_DOMAIN=dtkzvn1fvvkgu.cloudfront.net \
#   REPORT_KEY=reports/sample.pdf \
#   S3_BUCKET=matbakh-files-reports \
#   S3_KEY=reports/sample.pdf \
#   ORIGIN=https://matbakh.app \
#   AUTH_BEARER="eyJ..." \
#   PRESIGNED_UPLOAD_URL="https://s3...." \
#   ./phase8.2_integration_checks.sh
#
# Notes:
# - For private buckets (uploads/profile) you’ll need a valid PRESIGNED_UPLOAD_URL to test expiry (optional step 4).

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[0;33m'; NC='\033[0m'

need() { if [ -z "${!1:-}" ]; then echo -e "${YELLOW}Missing env: $1${NC}"; exit 1; fi; }

need CLOUDFRONT_DOMAIN
need REPORT_KEY
need S3_BUCKET
need S3_KEY
need ORIGIN

echo -e "${YELLOW}==> 1) CORS preflight via CloudFront (OPTIONS)${NC}"
curl -sS -i -X OPTIONS "https://${CLOUDFRONT_DOMAIN}/${REPORT_KEY}"   -H "Origin: ${ORIGIN}"   -H "Access-Control-Request-Method: GET" > /tmp/cf_options.txt

if grep -qi "HTTP/.* 2" /tmp/cf_options.txt && grep -qi "access-control-allow-origin" /tmp/cf_options.txt; then
  echo -e "${GREEN}PASS:${NC} Preflight allowed and ACAO header present"
else
  echo -e "${RED}FAIL:${NC} Preflight/CORS headers missing"; cat /tmp/cf_options.txt; exit 2
fi

echo -e "${YELLOW}==> 2) HEAD via CloudFront${NC}"
curl -sS -I "https://${CLOUDFRONT_DOMAIN}/${REPORT_KEY}" > /tmp/cf_head.txt || true
if grep -qi "HTTP/.* 200" /tmp/cf_head.txt; then
  echo -e "${GREEN}PASS:${NC} CloudFront HEAD 200"; grep -iE "content-type|cache-control|etag|x-cache" /tmp/cf_head.txt || true
else
  echo -e "${RED}FAIL:${NC} CloudFront HEAD not 200"; cat /tmp/cf_head.txt; exit 3
fi

echo -e "${YELLOW}==> 3) S3 direct access should be blocked (403)${NC}"
curl -sS -I "https://${S3_BUCKET}.s3.amazonaws.com/${S3_KEY}" > /tmp/s3_head.txt || true
if grep -qi "HTTP/.* 403" /tmp/s3_head.txt; then
  echo -e "${GREEN}PASS:${NC} S3 direct access blocked (403)"
else
  echo -e "${RED}FAIL:${NC} S3 direct access NOT blocked"; cat /tmp/s3_head.txt; exit 4
fi

echo -e "${YELLOW}==> 4) (Optional) Presigned URL expiry check (expects 200 then 403 after expiry)${NC}"
if [ -n "${PRESIGNED_UPLOAD_URL:-}" ]; then
  echo "Testing pre-expiry:"
  curl -sS -I "${PRESIGNED_UPLOAD_URL}" | tee /tmp/presign_before.txt > /dev/null || true
  if grep -qi "HTTP/.* 200" /tmp/presign_before.txt; then
    echo -e "${GREEN}PASS:${NC} Presigned currently valid"
  else
    echo -e "${YELLOW}WARN:${NC} Presigned not 200 right now (might be PUT-only or already expired)"
  fi
  echo "→ Re-run this step after expiry to verify 403."
else
  echo -e "${YELLOW}SKIP:${NC} No PRESIGNED_UPLOAD_URL provided"
fi

echo -e "${GREEN}ALL CHECKS COMPLETED${NC}"
