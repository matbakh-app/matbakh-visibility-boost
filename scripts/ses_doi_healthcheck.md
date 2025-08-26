# SES DOI Healthcheck Runbook
*Troubleshooting: Warum kommt die DOI-Mail nicht an?*

## 🚨 Quick Diagnosis (60 Sekunden)

### Step 1: Test API Endpoint
```bash
# Replace YOUR_EMAIL with actual test email
API="https://guf7ho7bze.execute-api.eu-central-1.amazonaws.com/prod"
curl -s -X POST "$API/vc/start" \
  -H "Origin: https://matbakh.app" \
  -H "Content-Type: application/json" \
  --data '{"email":"YOUR_EMAIL","name":"Test User"}' | jq .
```

**Expected Output:**
```json
{"ok": true, "token": "abc123..."}
```

**If/Then:**
- ✅ **Success**: API working, proceed to Step 2
- ❌ **Error 4xx/5xx**: Check Lambda logs (Step 2a)
- ❌ **CORS Error**: Check Origin header and API Gateway CORS config
- ❌ **Timeout**: Check Lambda timeout settings

### Step 2: Check Lambda Logs
```bash
# Find the correct log group name
aws logs describe-log-groups --log-group-name-prefix "/aws/lambda" | grep vc-start

# Tail logs in real-time (replace LOG_GROUP_NAME)
aws logs tail /aws/lambda/vc-start-function --follow

# Alternative: Get recent logs
aws logs tail /aws/lambda/vc-start-function --since 10m
```

**Expected Output:**
```
START RequestId: abc-123
[INFO] Processing vc/start request
[INFO] Email validation passed
[INFO] SES send initiated
[INFO] Email sent successfully
END RequestId: abc-123
```

**If/Then:**
- ✅ **"Email sent successfully"**: SES working, check Step 3
- ❌ **"WARNING - This is a placeholder function"**: Function doesn't send emails (see Common Issues)
- ❌ **"SES Error"**: Check SES configuration (Step 3a)
- ❌ **"Validation failed"**: Check email format
- ❌ **No logs**: Lambda not triggered, check API Gateway

### Step 3: SES Account Status
```bash
# Check SES account status
aws sesv2 get-account --region eu-central-1

# Check if sender email is verified
aws sesv2 get-email-identity --email-identity noreply@matbakh.app --region eu-central-1

# Check suppression list
aws sesv2 get-suppressed-destination --email-address YOUR_EMAIL --region eu-central-1
```

**Expected Output (get-account):**
```json
{
  "SendingEnabled": true,
  "ProductionAccessEnabled": true,
  "SendQuota": {
    "Max24HourSend": 200.0,
    "MaxSendRate": 1.0,
    "SentLast24Hours": 5.0
  }
}
```

**If/Then:**
- ✅ **SendingEnabled: true**: SES active, check identity
- ❌ **SendingEnabled: false**: SES account suspended
- ❌ **ProductionAccessEnabled: false**: Still in sandbox mode
- ❌ **SentLast24Hours >= Max24HourSend**: Quota exceeded

### Step 4: Direct SES Test
```bash
# Send test email directly via SES
aws sesv2 send-email --region eu-central-1 \
  --from-email-address "noreply@matbakh.app" \
  --destination "ToAddresses=YOUR_EMAIL" \
  --content '{
    "Simple": {
      "Subject": {"Data": "SES Test", "Charset": "UTF-8"},
      "Body": {"Text": {"Data": "Direct SES test email", "Charset": "UTF-8"}}
    }
  }'
```

**Expected Output:**
```json
{
  "MessageId": "0000014a-f4d4-4f36-b9d0-abc123456789-000000"
}
```

**If/Then:**
- ✅ **MessageId returned**: SES working, issue is in Lambda code
- ❌ **"Email address not verified"**: Verify sender identity
- ❌ **"MessageRejected"**: Check suppression list
- ❌ **"Throttling"**: Rate limit exceeded

## 🔍 Deep Diagnosis

### Step 5: Check Email Identity Status
```bash
# Detailed identity information
aws sesv2 get-email-identity --email-identity noreply@matbakh.app --region eu-central-1 | jq .
```

**Expected Output:**
```json
{
  "IdentityType": "EMAIL_ADDRESS",
  "FeedbackForwardingStatus": true,
  "VerificationStatus": "SUCCESS",
  "DkimAttributes": {
    "SigningEnabled": true,
    "Status": "SUCCESS"
  }
}
```

**If/Then:**
- ✅ **VerificationStatus: "SUCCESS"**: Identity verified
- ❌ **VerificationStatus: "PENDING"**: Check verification email
- ❌ **VerificationStatus: "FAILED"**: Re-verify identity
- ❌ **Identity not found**: Add and verify identity

### Step 6: Check Configuration Set
```bash
# List configuration sets
aws sesv2 list-configuration-sets --region eu-central-1

# Get configuration set details (if using one)
aws sesv2 get-configuration-set --configuration-set-name matbakh-config --region eu-central-1
```

**If/Then:**
- ✅ **Configuration set exists**: Check event destinations
- ❌ **Configuration set not found**: May not be using one (OK)
- ❌ **Suppression list enabled**: Check if recipient is suppressed

### Step 7: Check SNS Subscriptions (Bounce/Complaint Handling)
```bash
# List SNS topics
aws sns list-topics --region eu-central-1 | grep -i ses

# Check subscriptions for SES topic
aws sns list-subscriptions-by-topic --topic-arn arn:aws:sns:eu-central-1:ACCOUNT:ses-bounces --region eu-central-1
```

**If/Then:**
- ✅ **SNS topics exist**: Bounce handling configured
- ❌ **No SNS topics**: Basic setup (OK for testing)
- ❌ **Unconfirmed subscriptions**: Confirm SNS subscriptions

## 🚨 Common Issues & Solutions

### Issue: Function is Placeholder (CRITICAL)
**Symptoms:** API returns `{"ok": true, "test": true, "warning": "This is a placeholder - no email sent"}`
**Root Cause:** The vc-start-analysis function is currently a placeholder and does NOT send emails
**Solutions:**
1. **Immediate**: Check if there's a different endpoint that actually sends emails
2. **Short-term**: Implement email sending in vc-start-analysis function
3. **Alternative**: Call send-visibility-report function from vc-start-analysis

### Issue: Email in Spam/Junk Folder
**Symptoms:** API succeeds, SES sends, but email not in inbox
**Solutions:**
1. Check spam/junk folder
2. Add noreply@matbakh.app to contacts
3. Check DKIM/SPF records
4. Use different test email provider

### Issue: SES Sandbox Mode
**Symptoms:** "MessageRejected" for unverified recipients
**Solutions:**
1. Verify recipient email in SES console
2. Request production access
3. Use verified test emails only

### Issue: Rate Limiting
**Symptoms:** "Throttling" or "SendingQuotaExceeded"
**Solutions:**
1. Check sending quota: `aws sesv2 get-account`
2. Wait for quota reset (24h)
3. Request quota increase

### Issue: Suppressed Email
**Symptoms:** Email silently not delivered
**Solutions:**
1. Check suppression list: `aws sesv2 get-suppressed-destination`
2. Remove from suppression: `aws sesv2 delete-suppressed-destination`

## 📋 Checklist for DOI Email Issues

- [ ] API endpoint responds with 200 OK
- [ ] Lambda logs show "Email sent successfully"
- [ ] SES account has SendingEnabled: true
- [ ] Sender identity (noreply@matbakh.app) is verified
- [ ] Recipient email is not in suppression list
- [ ] Not in SES sandbox mode (or recipient is verified)
- [ ] Sending quota not exceeded
- [ ] Check spam/junk folder
- [ ] Direct SES test works
- [ ] CORS headers allow origin

## 🔧 Emergency Commands

### Reset Suppression List
```bash
# Remove email from suppression (if accidentally added)
aws sesv2 delete-suppressed-destination --email-address YOUR_EMAIL --region eu-central-1
```

### Get Sending Statistics
```bash
# Check recent sending stats
aws sesv2 get-account-sending-enabled --region eu-central-1
aws sesv2 get-send-quota --region eu-central-1
aws sesv2 get-send-statistics --region eu-central-1
```

### Verify New Identity
```bash
# Add new sender identity
aws sesv2 put-email-identity --email-identity new-sender@matbakh.app --region eu-central-1
```

---

## 📞 Escalation Path

1. **Level 1**: Run this runbook (5-10 min)
2. **Level 2**: Check AWS SES console for detailed metrics
3. **Level 3**: Contact AWS Support with MessageId and timestamp
4. **Level 4**: Consider alternative email provider (SendGrid, Mailgun)

---

*Last updated: 2025-01-27*
*Region: eu-central-1*
*API: https://guf7ho7bze.execute-api.eu-central-1.amazonaws.com/prod*
---


## 🔬 Live Diagnosis Results - 2025-08-26 06:51 UTC

### Test Execution
**Test Email**: rabieb@gmx.de  
**API Endpoint**: https://guf7ho7bze.execute-api.eu-central-1.amazonaws.com/prod/vc/start  
**Lambda Function**: MatbakhVcStack-VcStartFnC5BAD875-Lukpaun5TO53  

### API Response
```json
{
  "ok": true,
  "token": "9ee0f57a801d06034643e12a1ac2b1f6"
}
```

### Lambda Logs Analysis
**RequestId**: 592a30cb-3725-4d26-89d1-63b353734d9d  
**Duration**: 1762.66 ms  
**Memory Used**: 99 MB / 128 MB  

**Key Log Entries**:
```
INFO vc-start lead {
  email: 'rabieb@gmx.de',
  name: 'Test User',
  venue: '',
  tokenHash: '3183eead7d12f4fea90d152430011e97b78bbb8e9980473c781051cce7c72fb1'
}
INFO SES send ok 01070198e5258511-de9db2de-4bac-4d46-847c-a814924e7cd0-000000
```

### SES Verification Results
✅ **Email Sent Successfully**: MessageId `01070198e5258511-de9db2de-4bac-4d46-847c-a814924e7cd0-000000`  
✅ **Sender Identity Verified**: mail@matbakh.app (VerificationStatus: SUCCESS)  
✅ **DKIM Enabled**: SigningEnabled: true, Status: SUCCESS  
✅ **Not Suppressed**: rabieb@gmx.de not in suppression list  
✅ **Configuration Set**: matbakh-default  
✅ **Delivery Statistics**: 2 delivery attempts, 0 bounces, 0 complaints, 0 rejects  

### Critical Discovery: Dual Function Architecture
**IMPORTANT**: There are TWO different VC start functions:

1. **AWS Lambda** (PRODUCTION): `MatbakhVcStack-VcStartFnC5BAD875-Lukpaun5TO53`
   - ✅ **Status**: WORKING - Sends emails successfully
   - ✅ **Integration**: Connected to API Gateway /vc/start endpoint
   - ✅ **Email Provider**: AWS SES (mail@matbakh.app)

2. **Supabase Edge Function** (DEVELOPMENT): `vc-start-analysis`
   - ❌ **Status**: PLACEHOLDER - Does NOT send emails
   - ❌ **Integration**: Not connected to production API
   - ❌ **Purpose**: Development/testing only

### Root Cause Analysis
**Problem**: DOI emails not arriving  
**Root Cause**: ❌ **INCORRECT ASSUMPTION** - The production system DOES send emails  
**Actual Issue**: Email delivery may be working, but emails might be:
- Going to spam/junk folder
- Blocked by recipient's email provider (GMX)
- Delayed in delivery

### Recommendations
1. **Check Spam/Junk Folder**: Primary recommendation for users
2. **Email Provider Issues**: GMX may have strict filtering
3. **Alternative Test**: Try with Gmail/Outlook for comparison
4. **Delivery Delay**: SES delivery can take 1-15 minutes

### Next Steps
- **P0**: Verify email actually arrives in test inbox (check spam folder)
- **P1**: Test with different email providers (Gmail, Outlook)
- **P2**: Consider adding email delivery status tracking
- **P3**: Implement bounce/complaint handling via SNS

---

*Diagnosis completed: 2025-08-26 06:51 UTC*  
*Conclusion: Email sending infrastructure is WORKING correctly*