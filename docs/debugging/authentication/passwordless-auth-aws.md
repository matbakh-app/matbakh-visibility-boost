# Passwordless Auth (AWS) - Magic Link Implementation

## Problem
Need to replace Supabase authentication with AWS-native passwordless authentication using magic links.

## Solution Overview
Implemented a complete passwordless authentication system using:
- AWS Lambda functions for auth logic
- RDS PostgreSQL for user and token storage
- Resend API for email delivery
- JWT tokens for session management

## Architecture

### Components
1. **AuthStartFn** - Generates magic links and sends emails
2. **AuthCallbackFn** - Verifies tokens and creates sessions
3. **Database Tables** - `app_users` and `auth_magic_tokens`
4. **API Gateway Routes** - `/auth/start` and `/auth/callback`

### Flow
1. User enters email → POST `/auth/start`
2. System generates token, stores hash in DB, sends email
3. User clicks link → GET `/auth/callback?t=TOKEN`
4. System verifies token, creates user, signs JWT
5. Redirect to app with session

## Database Schema

```sql
-- Users table
CREATE TABLE app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Magic link tokens
CREATE TABLE auth_magic_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  token_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  user_agent text,
  ip text,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

## Configuration

### Secrets Manager
The `matbakh-email-config` secret contains:
```json
{
  "RESEND_API_KEY": "re_xxx",
  "MAIL_FROM": "info@matbakh.app",
  "AUTH_CALLBACK_BASE": "https://guf7ho7bze.execute-api.eu-central-1.amazonaws.com/prod/auth/callback",
  "AUTH_APP_REDIRECT": "https://matbakh.app/app",
  "AUTH_JWT_SECRET": "64-byte-hex-string"
}
```

### Lambda Functions
- **Runtime**: Node.js 20.x
- **Layer**: pg-client-layer for database access
- **VPC**: Same as other Lambda functions
- **IAM**: SecretsManagerAccess + VPC permissions

## API Endpoints

### POST /auth/start
**Request:**
```json
{
  "email": "user@example.com",
  "name": "User Name"
}
```

**Response:**
```json
{
  "ok": true
}
```

### GET /auth/callback?t=TOKEN
**Response:**
- 302 redirect to app with JWT in URL fragment
- Sets session for user authentication

## Testing

### Test Magic Link Generation
```bash
curl -X POST https://guf7ho7bze.execute-api.eu-central-1.amazonaws.com/prod/auth/start \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com","name":"Test User"}'
```

### Check Lambda Logs
```bash
# AuthStartFn logs
aws logs tail "/aws/lambda/AuthStartFn" --since 10m --region eu-central-1

# AuthCallbackFn logs
aws logs tail "/aws/lambda/AuthCallbackFn" --since 10m --region eu-central-1
```

### Verify Email Delivery
```bash
# Get Resend API key
export RESEND_API_KEY=$(aws secretsmanager get-secret-value \
  --secret-id matbakh-email-config --region eu-central-1 \
  --query SecretString --output text | jq -r '.RESEND_API_KEY')

# Check email status
curl -H "Authorization: Bearer $RESEND_API_KEY" \
  https://api.resend.com/emails/EMAIL-ID
```

## Common Issues

### 1. Email Not Delivered
**Symptoms:** User doesn't receive magic link email
**Debug:**
```bash
# Check Lambda logs for Resend errors
aws logs filter-log-events \
  --log-group-name "/aws/lambda/AuthStartFn" \
  --filter-pattern "Resend error" \
  --since 1h --region eu-central-1
```

**Solutions:**
- Verify RESEND_API_KEY in secrets
- Check domain verification in Resend
- Review spam prevention measures

### 2. Token Verification Failed
**Symptoms:** Magic link shows "invalid" or "expired" error
**Debug:**
```bash
# Check callback logs
aws logs filter-log-events \
  --log-group-name "/aws/lambda/AuthCallbackFn" \
  --filter-pattern "invalid" \
  --since 1h --region eu-central-1
```

**Solutions:**
- Verify token hasn't expired (30 min TTL)
- Check token hasn't been consumed already
- Ensure proper token hash generation

### 3. Database Connection Issues
**Symptoms:** Lambda timeouts or connection errors
**Debug:**
```bash
# Check VPC configuration
aws ec2 describe-security-groups --group-ids sg-0ce17ccbf943dd57b
```

**Solutions:**
- Verify VPC security groups allow Lambda → RDS
- Check RDS instance is running
- Verify pg-client layer is attached

### 4. JWT Session Issues
**Symptoms:** User not properly authenticated after callback
**Debug:**
- Check JWT secret configuration
- Verify redirect URL handling in frontend
- Test JWT token validation

## Security Considerations

### Token Security
- Tokens are 32-byte random hex strings
- Only SHA256 hashes stored in database
- 30-minute expiration time
- Single-use tokens (consumed_at tracking)

### Email Security
- Proper SPF/DKIM/DMARC configuration
- Professional email templates
- Rate limiting on auth attempts
- IP and User-Agent logging

### JWT Security
- HS256 algorithm with 64-byte secret
- 7-day expiration
- HttpOnly cookies (when custom domain available)

## Deployment

### Quick Deployment
```bash
# Setup database tables
./setup-auth-db.sh

# Deploy Lambda functions and API routes
./deploy-auth-lambdas.sh
```

### Manual Steps
1. Update secrets manager with auth configuration
2. Create database tables via migration lambda
3. Deploy AuthStartFn and AuthCallbackFn
4. Configure API Gateway routes
5. Set Lambda permissions
6. Test functionality

## Future Improvements

### Custom Domain
- Setup `api.matbakh.app` for proper cookie domain
- Enable HttpOnly secure cookies
- Remove JWT from URL fragments

### Enhanced Security
- Rate limiting per email/IP
- CAPTCHA for suspicious activity
- Email verification for sensitive actions
- Session management improvements

### User Experience
- Remember device functionality
- Social login integration
- Password fallback option
- Better error handling

## Related Issues
- A3.2: Email delivery and spam prevention
- Supabase migration and replacement
- VPC Lambda integration challenges