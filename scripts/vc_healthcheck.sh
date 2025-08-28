#!/usr/bin/env bash
set -euo pipefail

check() {
  curl -sI --globoff "$1" | awk 'BEGIN{IGNORECASE=1} /^HTTP|^etag:|^cache-control:|^content-type:|^x-cache:|^x-amz-cf-/{print}'
}

A="$(check 'https://matbakh.app/vc/result?t=abc')"
B="$(check 'https://matbakh.app/vc/result?e=invalid')"

echo "--- A (success) ---"
echo "$A"
echo "--- B (invalid) ---"
echo "$B"

ETAG_A="$(echo "$A" | awk 'BEGIN{IGNORECASE=1} /etag:/{print $2}')"
ETAG_B="$(echo "$B" | awk 'BEGIN{IGNORECASE=1} /etag:/{print $2}')"

CC_A="$(echo "$A" | awk 'BEGIN{IGNORECASE=1} /cache-control:/{print tolower($0)}')"
CC_B="$(echo "$B" | awk 'BEGIN{IGNORECASE=1} /cache-control:/{print tolower($0)}')"

[ "$ETAG_A" = "$ETAG_B" ] && [ "$CC_A" = "$CC_B" ] \
  && echo "VC Healthcheck: PASS" || { echo "VC Healthcheck: FAIL"; exit 1; }