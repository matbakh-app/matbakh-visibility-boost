
# Matbakh 3.0 Monitoring & Rollback Guide

## 4.1 Metrics (Prometheus-style via Grafana/Loki)

### Key Metrics to Monitor:

- `google_job_queue_length{status="pending"}` - Number of pending Google API jobs
- `google_job_success_total` - Total successful Google API operations
- `google_job_error_total` - Total failed Google API operations  
- `stripe_activate_billing_latency_ms` - Billing activation response time

### Recommended Alerts:

```yaml
# High job queue backlog
- alert: GoogleJobQueueBacklog
  expr: google_job_queue_length{status="pending"} > 1000
  for: 5m
  annotations:
    summary: "Google job queue has high backlog"

# High error rate
- alert: GoogleJobHighErrorRate
  expr: rate(google_job_error_total[5m]) > 0.1
  for: 2m
  annotations:
    summary: "High error rate in Google job processing"
```

## 4.2 Rollback Instructions

### Emergency Rollback to Legacy Schema:

```sql
BEGIN;
DROP TABLE IF EXISTS service_prices, service_packages, partner_upload_quota, google_job_queue, billing_events CASCADE;
ALTER TABLE service_packages_legacy RENAME TO service_packages;  -- restore
COMMIT;
```

### Partial Rollback (Keep new tables, restore legacy):

```sql
BEGIN;
-- Keep new tables but restore legacy service_packages
ALTER TABLE service_packages RENAME TO service_packages_new;
ALTER TABLE service_packages_legacy RENAME TO service_packages;
COMMIT;
```

## Deployment Commands

### Deploy Edge Functions:
```bash
supabase functions deploy token-refresh
supabase functions deploy google-job-worker  
supabase functions deploy activate-billing
```

### Create Stripe Products:
```bash
stripe products create --from-file docs/stripe-products.yaml
```

## Health Checks

### Manual Edge Function Test:
```bash
curl -X POST https://your-project.supabase.co/functions/v1/token-refresh \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```
