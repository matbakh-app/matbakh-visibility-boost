# Block A1: Cognito-Migration & Attribut-Flow

**SPEC_ID:** MIGRATION-A1-COGNITO  
**STATUS:** In Development  
**OWNER:** DevOps + Backend Team  
**PRIORITY:** P0 (Critical Path)  
**DEPENDENCIES:** AWS Account Setup, IAM Roles  

## 1. Executive Summary

### Mission
Migration der Supabase Auth zu AWS Cognito mit vollständiger Benutzer- und Attribut-Übertragung für matbakh.app. Cognito wird der zentrale Identity Provider für alle Services (VC, Dashboard, Google Auth, DSGVO-Flows).

### Success Criteria
- **Zero User Impact:** Nahtlose Migration ohne Re-Registration
- **Attribute Preservation:** Alle Benutzerdaten (roles, business_id, preferences) übertragen
- **Social Login:** Google OAuth funktional
- **DSGVO Compliance:** Audit-Trail für alle Authentifizierungs-Events
- **Performance:** < 200ms Login-Zeit

## 2. Current State Analysis

### Supabase Auth Structure
```sql
-- Current Supabase Auth Tables
auth.users (
  id uuid PRIMARY KEY,
  email text UNIQUE,
  encrypted_password text,
  email_confirmed_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  raw_app_meta_data jsonb,
  raw_user_meta_data jsonb
)

-- Application Profile Tables
public.profiles (
  id uuid REFERENCES auth.users(id),
  email text UNIQUE,
  role text DEFAULT 'owner', -- 'owner', 'partner', 'admin', 'super_admin'
  display_name text,
  avatar_url text,
  created_at timestamptz,
  updated_at timestamptz
)

public.private_profiles (
  user_id uuid REFERENCES profiles(id),
  first_name text,
  last_name text,
  phone text,
  address jsonb,
  preferences jsonb
)
```

### User Data Volume
```yaml
Current Users: ~2,500 active users
User Roles Distribution:
  - owner: 2,200 (88%)
  - partner: 250 (10%)
  - admin: 45 (1.8%)
  - super_admin: 5 (0.2%)

Social Logins:
  - Google OAuth: 1,800 users (72%)
  - Email/Password: 700 users (28%)

Business Associations:
  - Users with business_id: 2,100 (84%)
  - Multi-business users: 150 (6%)
```

## 3. Target Cognito Architecture

### User Pool Configuration
```json
{
  "UserPoolName": "matbakh-users-prod",
  "Policies": {
    "PasswordPolicy": {
      "MinimumLength": 8,
      "RequireUppercase": true,
      "RequireLowercase": true,
      "RequireNumbers": true,
      "RequireSymbols": false,
      "TemporaryPasswordValidityDays": 7
    }
  },
  "AutoVerifiedAttributes": ["email"],
  "AliasAttributes": ["email"],
  "UsernameAttributes": ["email"],
  "MfaConfiguration": "OPTIONAL",
  "EnabledMfas": ["SMS_MFA", "SOFTWARE_TOKEN_MFA"],
  "UserAttributeUpdateSettings": {
    "AttributesRequireVerificationBeforeUpdate": ["email"]
  },
  "AccountRecoverySetting": {
    "RecoveryMechanisms": [
      {"Name": "verified_email", "Priority": 1},
      {"Name": "verified_phone_number", "Priority": 2}
    ]
  },
  "EmailConfiguration": {
    "EmailSendingAccount": "DEVELOPER",
    "SourceArn": "arn:aws:ses:eu-central-1:ACCOUNT:identity/noreply@matbakh.app",
    "ReplyToEmailAddress": "support@matbakh.app"
  }
}
```

### Custom Attributes Schema
```json
{
  "Schema": [
    {
      "Name": "email",
      "AttributeDataType": "String",
      "Required": true,
      "Mutable": true
    },
    {
      "Name": "given_name",
      "AttributeDataType": "String",
      "Required": false,
      "Mutable": true
    },
    {
      "Name": "family_name", 
      "AttributeDataType": "String",
      "Required": false,
      "Mutable": true
    },
    {
      "Name": "phone_number",
      "AttributeDataType": "String",
      "Required": false,
      "Mutable": true
    },
    {
      "Name": "custom:role",
      "AttributeDataType": "String",
      "Required": false,
      "Mutable": true
    },
    {
      "Name": "custom:business_id",
      "AttributeDataType": "String",
      "Required": false,
      "Mutable": true
    },
    {
      "Name": "custom:display_name",
      "AttributeDataType": "String",
      "Required": false,
      "Mutable": true
    },
    {
      "Name": "custom:preferences",
      "AttributeDataType": "String",
      "Required": false,
      "Mutable": true
    },
    {
      "Name": "custom:supabase_id",
      "AttributeDataType": "String",
      "Required": false,
      "Mutable": false
    }
  ]
}
```

## 4. Migration Strategy

### Phase 1: Cognito Setup (Week 1)
```bash
# Create User Pool
aws cognito-idp create-user-pool \
  --pool-name matbakh-users-prod \
  --cli-input-json file://user-pool-config.json

# Create User Pool Client
aws cognito-idp create-user-pool-client \
  --user-pool-id eu-central-1_ABC123DEF \
  --client-name matbakh-web-client \
  --generate-secret \
  --explicit-auth-flows AdminNoSrpAuth UserPasswordAuth \
  --supported-identity-providers COGNITO Google \
  --callback-urls https://matbakh.app/auth/callback \
  --logout-urls https://matbakh.app/auth/logout \
  --allowed-o-auth-flows code \
  --allowed-o-auth-scopes openid email profile \
  --allowed-o-auth-flows-user-pool-client
```

### Phase 2: Google OAuth Integration
```json
{
  "IdentityProviderName": "Google",
  "IdentityProviderType": "Google",
  "ProviderDetails": {
    "client_id": "1012096096241-isdu4et7pm3777du2ucnhem9aohvbu1j.apps.googleusercontent.com",
    "client_secret": "{{from-secrets-manager}}",
    "authorize_scopes": "openid email profile"
  },
  "AttributeMapping": {
    "email": "email",
    "given_name": "given_name",
    "family_name": "family_name",
    "picture": "picture"
  }
}
```

### Phase 3: User Migration Lambda
```javascript
// cognito-user-migration-trigger.js
const AWS = require('aws-sdk');
const bcrypt = require('bcryptjs');
const { Client } = require('pg');

exports.handler = async (event) => {
    console.log('Migration trigger event:', JSON.stringify(event, null, 2));
    
    if (event.triggerSource === 'UserMigration_Authentication') {
        return await migrateUser(event);
    }
    
    return event;
};

async function migrateUser(event) {
    const email = event.request.userAttributes.email;
    const password = event.request.password;
    
    // Connect to Supabase to verify user
    const supabaseClient = new Client({
        host: 'db.uheksobnyedarrpgxhju.supabase.co',
        database: 'postgres',
        user: 'postgres',
        password: process.env.SUPABASE_PASSWORD,
        port: 5432,
        ssl: { rejectUnauthorized: false }
    });
    
    await supabaseClient.connect();
    
    try {
        // Get user from Supabase auth.users
        const authResult = await supabaseClient.query(
            'SELECT id, email, encrypted_password, email_confirmed_at FROM auth.users WHERE email = $1',
            [email]
        );
        
        if (authResult.rows.length === 0) {
            throw new Error('User not found in Supabase');
        }
        
        const supabaseUser = authResult.rows[0];
        
        // Verify password (Supabase uses bcrypt)
        const passwordValid = await bcrypt.compare(password, supabaseUser.encrypted_password);
        if (!passwordValid) {
            throw new Error('Invalid password');
        }
        
        // Get profile data
        const profileResult = await supabaseClient.query(`
            SELECT 
                p.role, p.display_name, p.avatar_url,
                pp.first_name, pp.last_name, pp.phone, pp.preferences,
                bp.id as business_id
            FROM public.profiles p
            LEFT JOIN public.private_profiles pp ON p.id = pp.user_id
            LEFT JOIN public.business_partners bp ON p.id = bp.user_id
            WHERE p.id = $1
        `, [supabaseUser.id]);
        
        const profile = profileResult.rows[0] || {};
        
        // Set user attributes for Cognito
        event.response.userAttributes = {
            email: email,
            email_verified: supabaseUser.email_confirmed_at ? 'true' : 'false',
            given_name: profile.first_name || '',
            family_name: profile.last_name || '',
            phone_number: profile.phone || '',
            'custom:role': profile.role || 'owner',
            'custom:business_id': profile.business_id || '',
            'custom:display_name': profile.display_name || '',
            'custom:preferences': JSON.stringify(profile.preferences || {}),
            'custom:supabase_id': supabaseUser.id
        };
        
        event.response.finalUserStatus = 'CONFIRMED';
        event.response.messageAction = 'SUPPRESS';
        
        console.log('User migrated successfully:', email);
        return event;
        
    } catch (error) {
        console.error('Migration error:', error);
        throw error;
    } finally {
        await supabaseClient.end();
    }
}
```

## 5. Lambda Triggers Implementation

### Post-Confirmation Trigger
```javascript
// cognito-post-confirmation-trigger.js
const AWS = require('aws-sdk');
const { Client } = require('pg');

exports.handler = async (event) => {
    console.log('Post-confirmation event:', JSON.stringify(event, null, 2));
    
    if (event.triggerSource === 'PostConfirmation_ConfirmSignUp' || 
        event.triggerSource === 'PostConfirmation_ConfirmForgotPassword') {
        
        await createUserProfile(event);
    }
    
    return event;
};

async function createUserProfile(event) {
    const { userAttributes, userName } = event.request;
    
    // Get RDS credentials from Secrets Manager
    const secretsManager = new AWS.SecretsManager();
    const secret = await secretsManager.getSecretValue({
        SecretId: 'matbakh/database/credentials'
    }).promise();
    
    const dbCredentials = JSON.parse(secret.SecretString);
    
    const client = new Client({
        host: dbCredentials.host,
        database: dbCredentials.dbname,
        user: dbCredentials.username,
        password: dbCredentials.password,
        ssl: { rejectUnauthorized: false }
    });
    
    await client.connect();
    
    try {
        // Create profile in RDS
        await client.query(`
            INSERT INTO public.profiles (
                id, email, role, display_name, avatar_url, 
                cognito_user_id, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
            ON CONFLICT (email) DO UPDATE SET
                cognito_user_id = EXCLUDED.cognito_user_id,
                updated_at = NOW()
        `, [
            userAttributes['custom:supabase_id'] || require('uuid').v4(),
            userAttributes.email,
            userAttributes['custom:role'] || 'owner',
            userAttributes['custom:display_name'] || userAttributes.given_name,
            userAttributes.picture || null,
            userName
        ]);
        
        // Create private profile if we have the data
        if (userAttributes.given_name || userAttributes.family_name) {
            await client.query(`
                INSERT INTO public.private_profiles (
                    user_id, first_name, last_name, phone, 
                    preferences, created_at, updated_at
                ) VALUES (
                    (SELECT id FROM profiles WHERE email = $1),
                    $2, $3, $4, $5, NOW(), NOW()
                )
                ON CONFLICT (user_id) DO UPDATE SET
                    first_name = EXCLUDED.first_name,
                    last_name = EXCLUDED.last_name,
                    phone = EXCLUDED.phone,
                    updated_at = NOW()
            `, [
                userAttributes.email,
                userAttributes.given_name || null,
                userAttributes.family_name || null,
                userAttributes.phone_number || null,
                userAttributes['custom:preferences'] ? 
                    JSON.parse(userAttributes['custom:preferences']) : {}
            ]);
        }
        
        console.log('User profile created/updated:', userAttributes.email);
        
    } catch (error) {
        console.error('Profile creation error:', error);
        throw error;
    } finally {
        await client.end();
    }
}
```

### Pre-Authentication Trigger
```javascript
// cognito-pre-authentication-trigger.js
const AWS = require('aws-sdk');

exports.handler = async (event) => {
    console.log('Pre-authentication event:', JSON.stringify(event, null, 2));
    
    // Security checks
    await performSecurityChecks(event);
    
    // Log authentication attempt
    await logAuthenticationAttempt(event);
    
    return event;
};

async function performSecurityChecks(event) {
    const { userAttributes, request } = event;
    const clientMetadata = request.clientMetadata || {};
    
    // Check for suspicious login patterns
    const cloudWatch = new AWS.CloudWatch();
    
    // Get recent failed login attempts
    const params = {
        MetricName: 'FailedLogins',
        Namespace: 'Matbakh/Auth',
        Dimensions: [
            {
                Name: 'Email',
                Value: userAttributes.email
            }
        ],
        StartTime: new Date(Date.now() - 15 * 60 * 1000), // Last 15 minutes
        EndTime: new Date(),
        Period: 300,
        Statistics: ['Sum']
    };
    
    try {
        const metrics = await cloudWatch.getMetricStatistics(params).promise();
        const failedAttempts = metrics.Datapoints.reduce((sum, point) => sum + point.Sum, 0);
        
        if (failedAttempts > 5) {
            console.warn('Too many failed login attempts:', userAttributes.email);
            // Could implement additional security measures here
        }
        
    } catch (error) {
        console.error('Security check error:', error);
        // Don't block login for monitoring errors
    }
}

async function logAuthenticationAttempt(event) {
    const cloudWatch = new AWS.CloudWatch();
    
    await cloudWatch.putMetricData({
        Namespace: 'Matbakh/Auth',
        MetricData: [
            {
                MetricName: 'LoginAttempts',
                Value: 1,
                Unit: 'Count',
                Dimensions: [
                    {
                        Name: 'Email',
                        Value: event.request.userAttributes.email
                    },
                    {
                        Name: 'TriggerSource',
                        Value: event.triggerSource
                    }
                ]
            }
        ]
    }).promise();
}
```

## 6. Frontend Integration

### Amplify Configuration
```typescript
// aws-config.ts
import { Amplify } from 'aws-amplify';

const awsConfig = {
  Auth: {
    region: 'eu-central-1',
    userPoolId: 'eu-central-1_ABC123DEF',
    userPoolWebClientId: 'abc123def456ghi789jkl',
    identityPoolId: 'eu-central-1:12345678-1234-1234-1234-123456789012',
    oauth: {
      domain: 'matbakh-auth.auth.eu-central-1.amazoncognito.com',
      scope: ['openid', 'email', 'profile'],
      redirectSignIn: 'https://matbakh.app/auth/callback',
      redirectSignOut: 'https://matbakh.app/auth/logout',
      responseType: 'code'
    }
  },
  API: {
    endpoints: [
      {
        name: 'matbakh-api',
        endpoint: 'https://api.matbakh.app/v1',
        region: 'eu-central-1'
      }
    ]
  }
};

Amplify.configure(awsConfig);
export default awsConfig;
```

### Auth Context Migration
```typescript
// contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Auth, Hub } from 'aws-amplify';
import { CognitoUser } from '@aws-amplify/auth';

interface AuthContextType {
  user: CognitoUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<CognitoUser>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string, attributes?: any) => Promise<any>;
  confirmSignUp: (email: string, code: string) => Promise<any>;
  forgotPassword: (email: string) => Promise<any>;
  forgotPasswordSubmit: (email: string, code: string, newPassword: string) => Promise<any>;
  federatedSignIn: (provider: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<CognitoUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
    
    // Listen for auth events
    const hubListener = (data: any) => {
      const { payload } = data;
      
      switch (payload.event) {
        case 'signIn':
          setUser(payload.data);
          break;
        case 'signOut':
          setUser(null);
          break;
        case 'signUp':
          console.log('User signed up');
          break;
        case 'signIn_failure':
          console.error('Sign in failure', payload.data);
          break;
      }
    };
    
    Hub.listen('auth', hubListener);
    
    return () => Hub.remove('auth', hubListener);
  }, []);

  const checkAuthState = async () => {
    try {
      const currentUser = await Auth.currentAuthenticatedUser();
      setUser(currentUser);
    } catch (error) {
      console.log('No authenticated user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string): Promise<CognitoUser> => {
    try {
      const user = await Auth.signIn(email, password);
      setUser(user);
      return user;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      await Auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, attributes?: any) => {
    try {
      const result = await Auth.signUp({
        username: email,
        password,
        attributes: {
          email,
          ...attributes
        }
      });
      return result;
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  const confirmSignUp = async (email: string, code: string) => {
    try {
      const result = await Auth.confirmSignUp(email, code);
      return result;
    } catch (error) {
      console.error('Confirm sign up error:', error);
      throw error;
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      const result = await Auth.forgotPassword(email);
      return result;
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  };

  const forgotPasswordSubmit = async (email: string, code: string, newPassword: string) => {
    try {
      const result = await Auth.forgotPasswordSubmit(email, code, newPassword);
      return result;
    } catch (error) {
      console.error('Forgot password submit error:', error);
      throw error;
    }
  };

  const federatedSignIn = async (provider: string) => {
    try {
      await Auth.federatedSignIn({ provider: provider as any });
    } catch (error) {
      console.error('Federated sign in error:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signOut,
    signUp,
    confirmSignUp,
    forgotPassword,
    forgotPasswordSubmit,
    federatedSignIn
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

## 7. Testing & Validation

### Migration Test Script
```bash
#!/bin/bash
# test-cognito-migration.sh

echo "🧪 Testing Cognito Migration..."

# Test 1: User Pool exists
USER_POOL_ID=$(aws cognito-idp list-user-pools --max-items 10 --query 'UserPools[?Name==`matbakh-users-prod`].Id' --output text)
if [ -z "$USER_POOL_ID" ]; then
    echo "❌ User Pool not found"
    exit 1
else
    echo "✅ User Pool found: $USER_POOL_ID"
fi

# Test 2: Google Identity Provider configured
GOOGLE_IDP=$(aws cognito-idp list-identity-providers --user-pool-id $USER_POOL_ID --query 'Providers[?ProviderName==`Google`]' --output text)
if [ -z "$GOOGLE_IDP" ]; then
    echo "❌ Google Identity Provider not configured"
    exit 1
else
    echo "✅ Google Identity Provider configured"
fi

# Test 3: Lambda triggers attached
TRIGGERS=$(aws cognito-idp describe-user-pool --user-pool-id $USER_POOL_ID --query 'UserPool.LambdaConfig' --output json)
if [ "$TRIGGERS" == "null" ]; then
    echo "❌ Lambda triggers not configured"
    exit 1
else
    echo "✅ Lambda triggers configured"
fi

# Test 4: Test user migration (if test user exists)
TEST_EMAIL="test@matbakh.app"
echo "🔍 Testing user migration for $TEST_EMAIL..."

# This would be done manually or with a test script
echo "✅ All Cognito migration tests passed!"
```

## 8. Monitoring & Observability

### CloudWatch Metrics
```yaml
CustomMetrics:
  - MetricName: UserMigrations
    Namespace: Matbakh/Auth
    Dimensions:
      - Name: Status
        Value: Success|Failed
        
  - MetricName: LoginAttempts
    Namespace: Matbakh/Auth
    Dimensions:
      - Name: Provider
        Value: Cognito|Google
        
  - MetricName: AuthenticationLatency
    Namespace: Matbakh/Auth
    Unit: Milliseconds

Alarms:
  - AlarmName: HighAuthenticationFailures
    MetricName: LoginAttempts
    Threshold: 50
    ComparisonOperator: GreaterThanThreshold
    EvaluationPeriods: 2
    
  - AlarmName: UserMigrationFailures
    MetricName: UserMigrations
    Threshold: 5
    ComparisonOperator: GreaterThanThreshold
    EvaluationPeriods: 1
```

## 9. DSGVO Compliance

### Audit Trail Implementation
```javascript
// audit-trail-logger.js
const AWS = require('aws-sdk');

class AuditLogger {
    constructor() {
        this.cloudWatch = new AWS.CloudWatchLogs();
        this.logGroupName = '/aws/lambda/matbakh-auth-audit';
    }
    
    async logAuthEvent(event, user, action, result) {
        const auditEntry = {
            timestamp: new Date().toISOString(),
            userId: user.username,
            email: user.attributes?.email,
            action: action,
            result: result,
            ipAddress: event.request?.clientMetadata?.ipAddress,
            userAgent: event.request?.clientMetadata?.userAgent,
            triggerSource: event.triggerSource,
            requestId: event.request?.requestId
        };
        
        await this.cloudWatch.putLogEvents({
            logGroupName: this.logGroupName,
            logStreamName: `auth-audit-${new Date().toISOString().split('T')[0]}`,
            logEvents: [{
                timestamp: Date.now(),
                message: JSON.stringify(auditEntry)
            }]
        }).promise();
    }
}

module.exports = AuditLogger;
```

## 10. Rollback Strategy

### Emergency Rollback Procedure
```bash
#!/bin/bash
# cognito-rollback.sh

echo "🚨 Emergency Cognito Rollback Initiated..."

# 1. Disable Cognito User Pool
aws cognito-idp update-user-pool \
  --user-pool-id $USER_POOL_ID \
  --policies '{"PasswordPolicy":{"MinimumLength":8,"RequireUppercase":false,"RequireLowercase":false,"RequireNumbers":false,"RequireSymbols":false}}'

# 2. Update frontend to use Supabase
kubectl set env deployment/matbakh-frontend \
  VITE_AUTH_PROVIDER=supabase \
  VITE_SUPABASE_URL=https://uheksobnyedarrpgxhju.supabase.co

# 3. Re-enable Supabase Auth
# (Supabase should still be running in read-only mode)

echo "✅ Rollback completed. Verify system health."
```

---

**NEXT STEPS:**
1. **AWS Account Setup** - User Pool creation
2. **Lambda Development** - Migration triggers
3. **Frontend Integration** - Amplify setup
4. **Testing** - Migration validation
5. **Go-Live** - Phased rollout

**ESTIMATED TIMELINE:** 2 Wochen
**RISK LEVEL:** Medium (comprehensive testing required)
**SUCCESS CRITERIA:** Zero user re-registration, < 200ms auth latency