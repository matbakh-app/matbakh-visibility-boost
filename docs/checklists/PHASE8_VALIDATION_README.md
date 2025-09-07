# Phase 8 Validation Pack

This folder contains ready-to-run assets for Phase 8.2/8.3/8.4 validation.

## Files
- `phase8.2_integration_checks.sh` — CloudFront/CORS/S3 direct-access checks (+ optional presigned expiry)
- `phase8.3_gdpr_audit.sql` — SQL to verify uploads, columns, arrays, RLS policies, and (placeholder) PII log scan
- `artillery_s3_single_upload.yml` (+ `artillery-processors.js`) — Artillery scenario: presign → single-part PUT upload
- `matbakh_phase8_collection.json` — Postman collection for presign/commit/access endpoints

## Quick start

### 1) Integration checks (bash)
```bash
chmod +x ./phase8.2_integration_checks.sh
CLOUDFRONT_DOMAIN=dtkzvn1fvvkgu.cloudfront.net \REPORT_KEY=reports/sample.pdf \S3_BUCKET=matbakh-files-reports \S3_KEY=reports/sample.pdf \ORIGIN=https://matbakh.app \./phase8.2_integration_checks.sh
```

### 2) GDPR audit (psql)
```bash
psql "$DATABASE_URL" -f ./phase8.3_gdpr_audit.sql
```

### 3) Performance (Artillery)
```bash
npm i -g artillery@latest
API_BASE=https://api.matbakh.app AUTH_BEARER="eyJ..." artillery run artillery_s3_single_upload.yml
```

### 4) Postman
Import `matbakh_phase8_collection.json`, set variables:
- `api_base` (e.g., https://api.matbakh.app)
- `auth_bearer`
- `user_id`
