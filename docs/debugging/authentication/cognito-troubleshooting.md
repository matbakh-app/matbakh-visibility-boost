# Cognito Authentication Troubleshooting

## Problem
Issues with Cognito user authentication, triggers, and user migration.

## Common Issues

### 1. Pre-Authentication Trigger Failures
```bash
# Check CloudWatch logs for trigger function
aws logs tail "/aws/lambda/matbakh-cognito-pre-auth-trigger" --follow

# Common error: User not found in RDS
# Solution: Ensure user exists in profiles table before Cognito authentication
```

### 2. User Migration Issues
```bash
# Check migration status
aws cognito-idp list-users --user-pool-id us-east-1_POOL-ID

# Migrate specific user
aws cognito-idp admin-create-user \
  --user-pool-id us-east-1_POOL-ID \
  --username user@example.com \
  --user-attributes Name=email,Value=user@example.com \
  --message-action SUPPRESS
```

### 3. JWT Token Validation
```javascript
// Validate Cognito JWT token
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const client = jwksClient({
  jwksUri: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_POOL-ID/.well-known/jwks.json'
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    const signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
}

// Verify token
jwt.verify(token, getKey, {
  audience: 'CLIENT-ID',
  issuer: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_POOL-ID',
  algorithms: ['RS256']
}, (err, decoded) => {
  if (err) {
    console.error('Token validation failed:', err);
  } else {
    console.log('Token valid:', decoded);
  }
});
```

## Debugging Commands

### Check User Pool Configuration
```bash
# Get user pool details
aws cognito-idp describe-user-pool --user-pool-id us-east-1_POOL-ID

# Get user pool client details
aws cognito-idp describe-user-pool-client \
  --user-pool-id us-east-1_POOL-ID \
  --client-id CLIENT-ID
```

### Test Authentication Flow
```bash
# Initiate auth
aws cognito-idp initiate-auth \
  --auth-flow USER_PASSWORD_AUTH \
  --client-id CLIENT-ID \
  --auth-parameters USERNAME=user@example.com,PASSWORD=password
```

### Check Trigger Functions
```bash
# List trigger functions
aws cognito-idp describe-user-pool --user-pool-id us-east-1_POOL-ID \
  --query 'UserPool.LambdaConfig'

# Test trigger function directly
aws lambda invoke \
  --function-name matbakh-cognito-pre-auth-trigger \
  --payload '{"triggerSource":"PreAuthentication_Authentication","userPoolId":"us-east-1_POOL-ID","userName":"user@example.com"}' \
  response.json
```

## Common Solutions

### Fix Pre-Auth Trigger
```javascript
// Ensure user exists in RDS before authentication
exports.handler = async (event) => {
  const { userName } = event;
  
  try {
    // Check if user exists in profiles table
    const result = await pool.query(
      'SELECT id FROM profiles WHERE id = (SELECT id FROM auth.users WHERE email = $1)',
      [userName]
    );
    
    if (result.rows.length === 0) {
      throw new Error('User not found in profiles table');
    }
    
    return event;
  } catch (error) {
    console.error('Pre-auth trigger failed:', error);
    throw error;
  }
};
```

## Related Issues
- A1: Cognito migration from Supabase
- A2.1: User authentication setup