# Email Delivery: Spam Prevention Guide

**Date**: 2025-08-31  
**Issue**: Emails landing in spam folders  
**Status**: 🔄 ONGOING - Technical fixes complete, reputation building in progress

## Problem Overview

New domains and email senders typically land in spam folders until they build reputation with email providers. This is expected behavior that improves over time with proper configuration and sending practices.

## Technical Fixes Applied ✅

### 1. Email Authentication Setup
```bash
# DNS Records to Add (Recommended)
# SPF Record
matbakh.app. TXT "v=spf1 include:_spf.resend.com ~all"

# DKIM Records (Get from Resend dashboard)
resend._domainkey.matbakh.app. CNAME resend1.resend.com
resend2._domainkey.matbakh.app. CNAME resend2.resend.com

# DMARC Policy (Start with monitoring)
_dmarc.matbakh.app. TXT "v=DMARC1; p=none; rua=mailto:dmarc@matbakh.app"
```

### 2. Spam-Optimized Email Format
**From Address**: `matbakh <info@matbakh.app>` ✅  
**Subject**: Clear, non-promotional ✅  
**Content**: Both text and HTML versions ✅  
**Links**: Single confirmation link only ✅  
**Tracking**: No tracking pixels ✅

### 3. Email Content Template
```javascript
// Text version
const emailText = `Hallo ${name || 'Freund/in'},

bitte bestätige deine E-Mail, um deinen kostenlosen Sichtbarkeits-Check zu starten:
${confirmationLink}

Falls der Button nicht funktioniert, kopiere den Link in deinen Browser.

Liebe Grüße
Dein matbakh Team`;

// HTML version (minimal styling)
const emailHtml = `<p>Hallo ${name || 'Freund/in'},</p>
<p>bitte bestätige deine E-Mail, um deinen kostenlosen Sichtbarkeits-Check zu starten.</p>
<p><a href="${confirmationLink}" style="display:inline-block;padding:12px 18px;border-radius:8px;background:#0ea5e9;color:#fff;text-decoration:none;">Jetzt bestätigen</a></p>
<p>Falls der Button nicht funktioniert, nutze diesen Link:<br><a href="${confirmationLink}">${confirmationLink}</a></p>
<p>Liebe Grüße<br>Dein matbakh Team</p>`;
```

## Reputation Building Strategy 🔄

### Phase 1: Foundation (Week 1-2)
- ✅ Set up DNS authentication (SPF, DKIM, DMARC)
- ✅ Start with low volume (< 10 emails/day)
- ✅ Monitor delivery rates in Resend dashboard
- 🔄 Ask recipients to mark emails as "not spam"

### Phase 2: Gradual Increase (Week 3-4)
- 📅 Increase volume gradually (20-50 emails/day)
- 📅 Monitor spam complaints and bounces
- 📅 Maintain consistent sending patterns
- 📅 Focus on engaged recipients

### Phase 3: Scale Up (Month 2+)
- 📅 Scale to production volumes
- 📅 Implement feedback loops
- 📅 Consider dedicated IP if volume justifies
- 📅 Advanced reputation monitoring

## Monitoring Commands

### Check Email Status
```bash
# Get Resend API key
export RESEND_API_KEY=$(aws secretsmanager get-secret-value \
  --secret-id matbakh-email-config --region eu-central-1 \
  --query SecretString --output text | jq -r '.RESEND_API_KEY')

# Check specific email delivery
EMAIL_ID="your-email-id"
curl -s -H "Authorization: Bearer $RESEND_API_KEY" \
  https://api.resend.com/emails/$EMAIL_ID | jq '.last_event'
```

### Monitor Delivery Rates
```bash
# Check recent emails
curl -s -H "Authorization: Bearer $RESEND_API_KEY" \
  https://api.resend.com/emails | jq '.data[] | {id, to, last_event, created_at}'
```

### DNS Verification
```bash
# Check SPF record
dig TXT matbakh.app | grep spf

# Check DKIM
dig TXT resend._domainkey.matbakh.app

# Check DMARC
dig TXT _dmarc.matbakh.app
```

## Email Provider Specific Tips

### Gmail
- **Reputation**: Most strict, takes longest to build trust
- **Volume**: Start very low (< 5/day initially)
- **Engagement**: High engagement rates help significantly
- **Authentication**: SPF, DKIM, DMARC all required

### Outlook/Hotmail
- **Sender Score**: Uses reputation scoring system
- **Content**: Avoid promotional language
- **Links**: Limit to essential links only
- **Feedback**: Monitor SNDS (Smart Network Data Services)

### Yahoo
- **DomainKeys**: Supports DKIM authentication
- **Complaints**: Very sensitive to spam complaints
- **Volume**: Gradual ramp-up essential
- **Engagement**: Track open/click rates

### GMX (German Provider)
- **Local Reputation**: German email providers have different patterns
- **Content**: German language content may be treated differently
- **Volume**: Conservative approach recommended
- **Authentication**: Standard SPF/DKIM/DMARC

## Content Best Practices

### ✅ Do This
- Use recipient's name when available
- Clear, specific subject lines
- Single call-to-action
- Professional email signature
- Unsubscribe link (for marketing emails)
- Both text and HTML versions

### ❌ Avoid This
- ALL CAPS text
- Excessive exclamation marks!!!
- Promotional language (FREE, URGENT, etc.)
- Multiple links
- Image-heavy content
- URL shorteners
- Misleading subject lines

## Troubleshooting Common Issues

### Issue: High Bounce Rate
**Causes**: Invalid email addresses, full mailboxes
**Solutions**: 
- Validate email addresses before sending
- Remove bounced addresses from lists
- Use double opt-in confirmation

### Issue: Low Open Rates
**Causes**: Spam folder placement, poor subject lines
**Solutions**:
- A/B test subject lines
- Send at optimal times
- Improve sender reputation

### Issue: Spam Complaints
**Causes**: Unexpected emails, unclear unsubscribe
**Solutions**:
- Clear opt-in process
- Easy unsubscribe mechanism
- Relevant content only

## Advanced Techniques

### 1. Email Warm-up Services
Consider using email warm-up services that gradually increase sending volume with engaged recipients.

### 2. Dedicated IP Address
For high-volume senders (1000+ emails/day), consider dedicated IP from Resend.

### 3. Subdomain Strategy
Use subdomains for different email types:
- `noreply.matbakh.app` for transactional emails
- `marketing.matbakh.app` for promotional emails

### 4. Feedback Loops
Set up feedback loops with major ISPs to monitor complaints.

## Success Metrics to Track

### Delivery Metrics
- **Delivery Rate**: > 95% (emails accepted by recipient server)
- **Inbox Placement**: > 80% (emails in inbox vs spam)
- **Bounce Rate**: < 2% (invalid/unreachable addresses)
- **Spam Complaint Rate**: < 0.1% (recipients marking as spam)

### Engagement Metrics
- **Open Rate**: > 20% for transactional emails
- **Click Rate**: > 5% for emails with links
- **Unsubscribe Rate**: < 0.5%

### Reputation Metrics
- **Sender Score**: > 80 (if using dedicated IP)
- **Domain Reputation**: Monitor via Google Postmaster Tools
- **IP Reputation**: Check via MXToolbox or similar

## Timeline Expectations

### Week 1-2: Foundation
- Expect 50-80% spam placement
- Focus on technical setup
- Low volume testing

### Week 3-4: Improvement
- Expect 30-50% spam placement
- Gradual volume increase
- Monitor engagement

### Month 2-3: Stabilization
- Expect 10-20% spam placement
- Normal sending volumes
- Reputation established

### Month 3+: Optimization
- Expect < 10% spam placement
- Focus on engagement optimization
- Advanced reputation management

## Related Files

- `vc-start-production.js` - Email sending implementation
- `docs/debugging/email-delivery/a3-2-hotfix-spam-issue.md` - Specific issue resolution
- AWS Secrets Manager: `matbakh-email-config` - Email configuration
- Resend Dashboard: Monitor delivery metrics