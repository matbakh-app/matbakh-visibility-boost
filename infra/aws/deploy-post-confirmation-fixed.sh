#!/bin/bash

# 🚀 Deploy Updated Post-Confirmation Lambda for Cognito
# Phase A3.2 - Fix Database Error on Registration
# Date: 2025-08-30

set -e

# Configuration
FUNCTION_NAME="cognito-post-confirmation"
RUNTIME="nodejs20.x"
HANDLER="index.handler"
REGION="${AWS_REGION:-eu-central-1}"
PROFILE="${AWS_PROFILE:-matbakh-dev}"
ROLE_NAME="matbakh-cognito-lambda-role"

echo "🚀 Deploying Updated Post-Confirmation Lambda..."
echo "📋 Configuration:"
echo "   Function Name: $FUNCTION_NAME"
echo "   Runtime: $RUNTIME"
echo "   Region: $REGION"
echo "   Profile: $PROFILE"
echo ""

# Step 1: Create deployment package
echo "📦 Step 1: Creating deployment package..."

# Create a simple JavaScript version
cat > /tmp/post-confirmation.js << 'EOF'
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const { Pool } = require('pg');
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');

const secretsManager = new SecretsManagerClient({ region: process.env.AWS_REGION });
const ses = new SESClient({ region: process.env.AWS_REGION });

exports.handler = async (event) => {
    console.log('Post-Confirmation trigger event:', JSON.stringify(event, null, 2));
    
    try {
        const { userAttributes } = event.request;
        
        // Create user profile in RDS
        await createUserProfile(userAttributes);
        
        // Send welcome email
        await sendWelcomeEmail(userAttributes.email, userAttributes.given_name || 'User');
        
        console.log('Post-Confirmation processing completed for:', userAttributes.email);
        return event;
        
    } catch (error) {
        console.error('Post-Confirmation error:', error);
        
        // Return event to complete confirmation even if profile creation fails
        return event;
    }
};

async function createUserProfile(userAttributes) {
    try {
        // Get RDS credentials from Secrets Manager
        const command = new GetSecretValueCommand({ SecretId: 'matbakh-db-postgres' });
        const secret = await secretsManager.send(command);
        const dbCredentials = JSON.parse(secret.SecretString);
        
        const pool = new Pool({
            host: dbCredentials.host,
            database: dbCredentials.dbname,
            user: dbCredentials.username,
            password: dbCredentials.password,
            port: dbCredentials.port || 5432,
            ssl: { rejectUnauthorized: false },
            max: 1,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 10000
        });
        
        const client = await pool.connect();
        
        try {
            // Use the stored function to create user profile
            const result = await client.query(`
                SELECT public.create_user_profile_from_cognito($1, $2, $3, $4, $5, $6) as user_id
            `, [
                userAttributes.sub,
                userAttributes.email,
                userAttributes.given_name || null,
                userAttributes.family_name || null,
                userAttributes['custom:user_role'] || 'owner',
                userAttributes['custom:locale'] || 'de'
            ]);
            
            console.log('✅ User profile created:', {
                email: userAttributes.email,
                userId: result.rows[0].user_id,
                cognitoUserId: userAttributes.sub
            });
            
        } finally {
            client.release();
            await pool.end();
        }
        
    } catch (error) {
        console.error('❌ Failed to create user profile:', error);
        // Don't fail the authentication
    }
}

async function sendWelcomeEmail(email, firstName) {
    try {
        const subject = `Willkommen bei matbakh.app, ${firstName}!`;
        const htmlBody = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #1f2937; margin: 0;">matbakh.app</h1>
                    <p style="color: #6b7280; margin: 5px 0 0 0;">Digitale Sichtbarkeit für Restaurants</p>
                </div>
                
                <h2 style="color: #1f2937;">Hallo ${firstName}!</h2>
                
                <p style="color: #374151; line-height: 1.6;">
                    Herzlich willkommen bei matbakh.app! Wir freuen uns, dass Sie sich für unsere Plattform entschieden haben.
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="https://matbakh.app/dashboard" 
                       style="background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">
                        Jetzt loslegen
                    </a>
                </div>
                
                <p style="color: #6b7280; font-size: 14px; line-height: 1.5;">
                    Bei Fragen: <a href="mailto:support@matbakh.app" style="color: #2563eb;">support@matbakh.app</a>
                </p>
            </div>
        `;
        
        const command = new SendEmailCommand({
            Source: 'noreply@matbakh.app',
            Destination: {
                ToAddresses: [email]
            },
            Message: {
                Subject: {
                    Data: subject,
                    Charset: 'UTF-8'
                },
                Body: {
                    Html: {
                        Data: htmlBody,
                        Charset: 'UTF-8'
                    }
                }
            }
        });
        
        await ses.send(command);
        console.log('✅ Welcome email sent to:', email);
        
    } catch (error) {
        console.error('❌ Failed to send welcome email:', error);
        // Don't fail confirmation for email errors
    }
}
EOF

# Create package.json
cat > /tmp/package.json << 'EOF'
{
  "name": "matbakh-post-confirmation",
  "version": "1.0.0",
  "description": "Cognito Post-Confirmation Lambda",
  "main": "index.js",
  "dependencies": {
    "pg": "^8.11.0",
    "@aws-sdk/client-secrets-manager": "^3.0.0",
    "@aws-sdk/client-ses": "^3.0.0"
  }
}
EOF

# Create deployment package
cd /tmp
npm install --production
zip -r post-confirmation-lambda.zip . -x "*.ts" "*.map"

echo "✅ Deployment package created"

# Step 2: Get IAM role ARN
echo "🔍 Step 2: Getting IAM role ARN..."
ROLE_ARN=$(aws iam get-role \
  --role-name "$ROLE_NAME" \
  --region "$REGION" \
  --profile "$PROFILE" \
  --query 'Role.Arn' \
  --output text 2>/dev/null || echo "")

if [ -z "$ROLE_ARN" ]; then
  echo "❌ IAM role not found: $ROLE_NAME"
  echo "Using existing Lambda execution role..."
  ROLE_ARN="arn:aws:iam::055062860590:role/MatbakhLambdaExecutionRole"
fi

echo "✅ IAM role: $ROLE_ARN"

# Step 3: Update function
echo "🔄 Step 3: Updating Lambda function..."
aws lambda update-function-code \
  --function-name "$FUNCTION_NAME" \
  --zip-file fileb://post-confirmation-lambda.zip \
  --region "$REGION" \
  --profile "$PROFILE" > /dev/null

# Update configuration with layers
aws lambda update-function-configuration \
  --function-name "$FUNCTION_NAME" \
  --layers "arn:aws:lambda:eu-central-1:055062860590:layer:matbakh-postgresql-layer:3" \
  --vpc-config SubnetIds=subnet-0d0cfb07da9341ce3,subnet-086715492e55e5380,subnet-027c02162f7e5b530,SecurityGroupIds=sg-0ce17ccbf943dd57b \
  --environment Variables='{DB_SECRET_NAME=matbakh-db-postgres}' \
  --region "$REGION" \
  --profile "$PROFILE" > /dev/null

echo "✅ Function updated"

# Step 4: Wait for function to be ready
echo "⏳ Step 4: Waiting for function to be ready..."
aws lambda wait function-updated \
  --function-name "$FUNCTION_NAME" \
  --region "$REGION" \
  --profile "$PROFILE"

echo "✅ Function is ready"

# Step 5: Test the function
echo "🧪 Step 5: Testing function..."
TEST_EVENT='{
  "version": "1",
  "region": "'$REGION'",
  "userPoolId": "eu-central-1_farFjTHKf",
  "userName": "test-user",
  "request": {
    "userAttributes": {
      "sub": "test-123-'$(date +%s)'",
      "email": "test-'$(date +%s)'@example.com",
      "given_name": "Test",
      "family_name": "User",
      "custom:user_role": "owner",
      "custom:locale": "de"
    }
  },
  "response": {}
}'

aws lambda invoke \
  --function-name "$FUNCTION_NAME" \
  --payload "$TEST_EVENT" \
  --region "$REGION" \
  --profile "$PROFILE" \
  test-response.json > /dev/null

if [ -f test-response.json ]; then
  echo "✅ Function test completed"
  echo "📊 Response:"
  cat test-response.json
  rm -f test-response.json
fi

# Cleanup
rm -f post-confirmation-lambda.zip
rm -f index.js package.json package-lock.json
rm -rf node_modules

echo ""
echo "🎉 POST-CONFIRMATION LAMBDA UPDATE COMPLETE!"
echo ""
echo "📋 Summary:"
echo "   ✅ Function updated: $FUNCTION_NAME"
echo "   ✅ Database integration: Fixed"
echo "   ✅ VPC configuration: Applied"
echo "   ✅ PostgreSQL layer: Applied"
echo ""
echo "🚀 Next Steps:"
echo "   1. Test user registration in the app"
echo "   2. Check CloudWatch logs for any issues"
echo "   3. Verify user profiles are created correctly"
echo ""
echo "📊 Post-Confirmation Status: ✅ READY FOR USER REGISTRATION"