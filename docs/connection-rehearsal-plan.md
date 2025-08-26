# Connection Rehearsal Plan - matbakh.app

## Google OAuth Test

### Test Google OAuth Flow
```bash
# Test Google OAuth redirect
curl -X GET "https://api.matbakh.app/auth/v1/authorize?provider=google" \
  -H "Accept: application/json" \
  -v

# Expected: 302 Redirect to Google OAuth consent screen
# Check Location header for correct OAuth URL
```

### Test Google Business Profile API
```bash
# Test GBP API access (requires valid OAuth token)
curl -X GET "https://mybusinessbusinessinformation.googleapis.com/v1/accounts" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json"

# Expected: List of Google Business accounts
```

## Facebook Login Test

### Test Facebook OAuth Flow
```bash
# Test Facebook OAuth redirect
curl -X GET "https://api.matbakh.app/auth/v1/authorize?provider=facebook" \
  -H "Accept: application/json" \
  -v

# Expected: 302 Redirect to Facebook OAuth consent screen
```

### Test Facebook Graph API
```bash
# Test Facebook Graph API access
curl -X GET "https://graph.facebook.com/v18.0/me?fields=id,name,email" \
  -H "Authorization: Bearer YOUR_FB_ACCESS_TOKEN"

# Expected: User profile data
```

## Visibility Check API Tests

### Test VC Start Endpoint
```bash
# Test VC start with minimal data
curl -X POST "https://guf7ho7bze.execute-api.eu-central-1.amazonaws.com/prod/vc/start" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "restaurantName": "Test Restaurant",
    "address": "Berlin, Germany",
    "locale": "de",
    "marketing_consent": false
  }'

# Expected: {"ok": true, "token": "...", "message": "DOI email sent"}
```

### Test VC Confirm Endpoint
```bash
# Test VC confirm with token from start response
curl -X POST "https://guf7ho7bze.execute-api.eu-central-1.amazonaws.com/prod/vc/confirm" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "YOUR_TOKEN_FROM_START",
    "email": "test@example.com"
  }'

# Expected: {"ok": true, "redirect": "/vc/result?t=..."}
```

## Supabase Connection Tests

### Test Supabase Auth
```bash
# Test Supabase connection
curl -X GET "https://uheksobnyedarrpgxhju.supabase.co/rest/v1/" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY"

# Expected: API documentation or 200 OK
```

### Test Supabase Edge Function
```bash
# Test vc-start-analysis edge function
curl -X POST "https://uheksobnyedarrpgxhju.supabase.co/functions/v1/vc-start-analysis" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "restaurantName": "Test Restaurant",
    "address": "Berlin",
    "locale": "de",
    "marketing_consent": false
  }'

# Expected: {"ok": true, "details": "..."}
```

## SES Email Tests

### Test SES Email Sending
```bash
# Test SES email sending (requires AWS CLI configured)
aws ses send-email \
  --source "noreply@matbakh.app" \
  --destination "ToAddresses=test@example.com" \
  --message "Subject={Data=Test Email from matbakh.app},Body={Text={Data=This is a test email from the matbakh.app system.}}" \
  --region eu-central-1

# Expected: MessageId returned
```

### Test DOI Email Template
```bash
# Test DOI email template rendering
curl -X POST "https://uheksobnyedarrpgxhju.supabase.co/functions/v1/send-doi-email" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "business_name": "Test Restaurant",
    "confirm_url": "https://matbakh.app/vc/confirm?t=test-token",
    "locale": "de"
  }'

# Expected: {"ok": true, "message_id": "..."}
```

## Google Analytics Tests

### Test GA4 Data API
```bash
# Test GA4 API access (requires service account token)
curl -X POST "https://analyticsdata.googleapis.com/v1beta/properties/495696125:runReport" \
  -H "Authorization: Bearer YOUR_GA4_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "dateRanges": [{"startDate": "7daysAgo", "endDate": "today"}],
    "metrics": [{"name": "activeUsers"}]
  }'

# Expected: Analytics data response
```

## Health Check Tests

### Test Main API Health
```bash
# Test main API health endpoint
curl -X GET "https://guf7ho7bze.execute-api.eu-central-1.amazonaws.com/prod/health" \
  -H "Accept: application/json"

# Expected: {"status": "healthy", "timestamp": "..."}
```

### Test CloudFront Distribution
```bash
# Test CloudFront distribution
curl -X GET "https://d23vpl9r70m1vk.cloudfront.net/" \
  -H "Accept: text/html" \
  -v

# Expected: 200 OK with HTML content
```

### Test Main Domain
```bash
# Test main domain
curl -X GET "https://matbakh.app/" \
  -H "Accept: text/html" \
  -v

# Expected: 200 OK with main landing page
```

## Local Development Tests

### Test Local Supabase
```bash
# If running Supabase locally
curl -X GET "http://localhost:54321/rest/v1/" \
  -H "apikey: YOUR_LOCAL_ANON_KEY"

# Expected: Local Supabase API response
```

### Test Local Edge Functions
```bash
# Test local edge function
curl -X POST "http://localhost:54321/functions/v1/vc-start-analysis" \
  -H "Authorization: Bearer YOUR_LOCAL_SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "restaurantName": "Local Test",
    "address": "Berlin",
    "locale": "de"
  }'

# Expected: Local function response
```

## Environment Variables Check

### Required Environment Variables
```bash
# Check if all required environment variables are set
echo "SUPABASE_URL: $SUPABASE_URL"
echo "SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY:0:10}..."
echo "SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY:0:10}..."
echo "AWS_REGION: $AWS_REGION"
echo "GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID:0:10}..."
echo "FACEBOOK_APP_ID: $FACEBOOK_APP_ID"

# All should return values, not empty
```

## Troubleshooting Commands

### Check DNS Resolution
```bash
# Check DNS for main domain
nslookup matbakh.app
dig matbakh.app

# Check CloudFront distribution
nslookup d23vpl9r70m1vk.cloudfront.net
```

### Check SSL Certificates
```bash
# Check SSL certificate
openssl s_client -connect matbakh.app:443 -servername matbakh.app

# Check certificate expiry
echo | openssl s_client -connect matbakh.app:443 2>/dev/null | openssl x509 -noout -dates
```

### Check API Gateway
```bash
# Check API Gateway health with verbose output
curl -X GET "https://guf7ho7bze.execute-api.eu-central-1.amazonaws.com/prod/health" \
  -H "Accept: application/json" \
  -w "HTTP Status: %{http_code}\nTotal Time: %{time_total}s\n" \
  -v
```