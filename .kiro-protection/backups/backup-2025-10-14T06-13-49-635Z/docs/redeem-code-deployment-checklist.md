# Redeem Code Feature - Production Deployment Checklist

## 📋 Pre-Deployment Checklist

### 1. Database Migration ✅
- [ ] Migration `20250727162021` applied to staging
- [ ] Migration applied to production
- [ ] Verify tables exist:
  ```sql
  \d public.redeem_codes
  \d+ public.visibility_check_leads  -- Check hasSubscription column
  ```
- [ ] Verify RLS policies active:
  ```sql
  SELECT schemaname, tablename, policyname, cmd, permissive, roles, qual 
  FROM pg_policies WHERE tablename = 'redeem_codes';
  ```
- [ ] Test database functions:
  ```sql
  SELECT * FROM public.get_redeem_codes('<test-partner-id>');
  SELECT * FROM public.campaign_report('<test-partner-id>');
  ```

### 2. Edge Functions Deployment ✅
- [ ] `generate-redeem-code` deployed to staging
- [ ] `generate-redeem-code` deployed to production
- [ ] `redeem-code` deployed to staging  
- [ ] `redeem-code` deployed to production
- [ ] `cleanup-expired-codes` deployed for maintenance
- [ ] Health checks pass for all functions:
  ```bash
  curl -X POST https://project.supabase.co/functions/v1/generate-redeem-code \
    -H "Authorization: Bearer <service-key>" \
    -d '{"partnerId":"test","maxUses":1,"durationValue":1,"durationUnit":"days"}'
  ```

### 3. Frontend Integration ✅
- [ ] `RedeemCodeForm` component integrated into Partner Dashboard
- [ ] `RedeemCodeInput` component working on lead pages
- [ ] `CampaignReport` displaying statistics correctly
- [ ] `/redeem` route accessible and functional
- [ ] Tab navigation in Partner Dashboard working
- [ ] Error handling and loading states implemented
- [ ] Toast notifications working

### 4. Testing Suite ✅
- [ ] Unit tests passing: `test/integration/redeem-code.test.ts`
- [ ] Security tests passing: `test/security/redeem-code-security.test.ts`
- [ ] E2E tests passing: `test/integration/redeem-code-e2e.test.ts`
- [ ] UI tests passing: `test/components/redeem-ui.test.tsx`
- [ ] All tests integrated into `scripts/run-automated-tests.sh`
- [ ] CI/CD pipeline includes new tests

## 🚀 Deployment Steps

### Step 1: Staging Deployment
```bash
# 1. Deploy migration
supabase db push --dry-run  # Verify first
supabase db push

# 2. Deploy functions
supabase functions deploy generate-redeem-code
supabase functions deploy redeem-code  
supabase functions deploy cleanup-expired-codes

# 3. Verify deployment
./scripts/run-automated-tests.sh
```

### Step 2: Production Deployment
```bash
# 1. Backup current production
supabase db dump --output backup-$(date +%Y%m%d).sql

# 2. Deploy to production
supabase db push --project-ref PROD_PROJECT_REF
supabase functions deploy generate-redeem-code --project-ref PROD_PROJECT_REF
supabase functions deploy redeem-code --project-ref PROD_PROJECT_REF

# 3. Smoke test in production
curl -X POST https://PROD_URL/functions/v1/generate-redeem-code \
  -H "Authorization: Bearer PROD_SERVICE_KEY" \
  -d '{"partnerId":"real-partner-id","maxUses":1,"durationValue":1,"durationUnit":"days"}'
```

### Step 3: Frontend Deployment
```bash
# Build and deploy frontend
npm run build
# Deploy to Vercel/Netlify/your hosting provider
```

## 🔧 Post-Deployment Configuration

### 1. Automated Cleanup Setup
```sql
-- Schedule daily cleanup function
SELECT cron.schedule(
  'cleanup-expired-redeem-codes',
  '0 2 * * *', -- Every day at 2 AM
  $$
  SELECT net.http_post(
    url:='https://PROD_URL/functions/v1/cleanup-expired-codes',
    headers:='{"Authorization": "Bearer PROD_SERVICE_KEY"}'::jsonb
  );
  $$
);
```

### 2. Monitoring Setup
- [ ] Set up alerts for high cleanup volumes (>1000 codes/day)
- [ ] Monitor redeem code usage rates
- [ ] Track error rates in edge functions
- [ ] Set up Slack/email notifications for failures

### 3. Analytics Dashboard
- [ ] Integrate campaign statistics into admin dashboard
- [ ] Set up reporting for partner success metrics
- [ ] Monitor conversion rates from leads to subscriptions

## 🔍 Verification Tests

### Post-Deployment Validation
```bash
# 1. Test complete flow
# Generate code
RESPONSE=$(curl -X POST https://PROD_URL/functions/v1/generate-redeem-code \
  -H "Authorization: Bearer PROD_SERVICE_KEY" \
  -d '{"partnerId":"'$PARTNER_ID'","maxUses":1,"durationValue":1,"durationUnit":"days"}')

CODE=$(echo $RESPONSE | jq -r '.code')

# Redeem code  
curl -X POST https://PROD_URL/functions/v1/redeem-code \
  -H "Authorization: Bearer PROD_SERVICE_KEY" \
  -d '{"code":"'$CODE'","leadId":"'$LEAD_ID'"}'

# 2. Verify database state
psql $DATABASE_URL -c "SELECT * FROM redeem_codes WHERE code = '$CODE';"
psql $DATABASE_URL -c "SELECT hasSubscription FROM visibility_check_leads WHERE id = '$LEAD_ID';"
```

### Security Validation
- [ ] Verify RLS policies prevent cross-tenant access
- [ ] Test with invalid UUIDs and malicious inputs
- [ ] Confirm rate limiting works
- [ ] Validate data sanitization

## 📊 Monitoring & Alerts

### Key Metrics to Monitor
```sql
-- Daily redeem code usage
SELECT 
  DATE(created_at) as date,
  COUNT(*) as codes_generated,
  SUM(uses) as total_redemptions
FROM redeem_codes 
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Campaign performance
SELECT 
  campaign_tag,
  COUNT(*) as codes_generated,
  SUM(uses) as total_uses,
  ROUND(AVG(uses), 2) as avg_uses_per_code
FROM redeem_codes 
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY campaign_tag
ORDER BY total_uses DESC;
```

### Alert Thresholds
- [ ] Error rate > 5% in edge functions
- [ ] Cleanup volume > 1000 codes/day
- [ ] Zero redemptions for 24+ hours
- [ ] Failed migrations or deployments

## 📈 Success Metrics

### Technical KPIs
- [ ] Edge function response time < 500ms
- [ ] Database query performance < 100ms
- [ ] Zero RLS policy violations
- [ ] Test coverage > 90%

### Business KPIs  
- [ ] Code redemption rate > 60%
- [ ] Lead-to-subscription conversion via codes
- [ ] Partner adoption of redeem code feature
- [ ] Reduction in manual lead qualification

## 🔄 Rollback Plan

### In Case of Issues
```bash
# 1. Disable edge functions (if needed)
supabase functions delete generate-redeem-code
supabase functions delete redeem-code

# 2. Rollback migration (if critical)
psql $DATABASE_URL -c "DROP TABLE IF EXISTS redeem_codes CASCADE;"
psql $DATABASE_URL -c "ALTER TABLE visibility_check_leads DROP COLUMN IF EXISTS hasSubscription;"

# 3. Restore from backup
psql $DATABASE_URL < backup-YYYYMMDD.sql
```

### Emergency Contacts
- Technical Lead: [contact]
- Database Admin: [contact]  
- Product Owner: [contact]

---

## ✅ Sign-off

- [ ] **Database Migration** - Signed off by: ________________
- [ ] **Edge Functions** - Signed off by: ________________  
- [ ] **Frontend Integration** - Signed off by: ________________
- [ ] **Testing Suite** - Signed off by: ________________
- [ ] **Security Review** - Signed off by: ________________
- [ ] **Production Deployment** - Signed off by: ________________

**Final Approval for Production Release**: ________________

**Date**: ________________