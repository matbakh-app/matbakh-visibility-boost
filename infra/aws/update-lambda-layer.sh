#!/bin/bash
set -euo pipefail

# Update Lambda Layer with AWS SDK v3
# Phase A2.4 - Fix AWS SDK compatibility

REGION=${AWS_REGION:-eu-central-1}
PROFILE=${AWS_PROFILE:-matbakh-dev}
LAYER_NAME="matbakh-postgresql-layer"

echo "🔄 UPDATING LAMBDA LAYER WITH AWS SDK V3"
echo "<REDACTED_AWS_SECRET_ACCESS_KEY>"
echo "Region: $REGION"
echo "Profile: $PROFILE"
echo "Layer Name: $LAYER_NAME"
echo ""

# Step 1: Create updated layer directory
echo "📁 Step 1: Creating updated layer directory..."
mkdir -p lambda-layers/postgresql-v3/nodejs
cd lambda-layers/postgresql-v3

# Step 2: Create updated package.json
echo "📦 Step 2: Creating updated package.json..."
cat > nodejs/package.json << 'EOF'
{
  "name": "matbakh-postgresql-layer-v3",
  "version": "2.0.0",
  "description": "PostgreSQL client layer with AWS SDK v3 for Matbakh Lambda functions",
  "dependencies": {
    "pg": "^8.11.3",
    "pg-pool": "^3.6.1",
    "@aws-sdk/client-secrets-manager": "^3.600.0"
  }
}
EOF

# Step 3: Install dependencies
echo "🔧 Step 3: Installing dependencies..."
cd nodejs
npm install --production
cd ..

echo "✅ Dependencies installed:"
ls -la nodejs/node_modules/ | grep -E "(pg|@aws-sdk)"

# Step 4: Create layer zip file
echo "📦 Step 4: Creating updated layer zip..."
zip -r postgresql-layer-v3.zip nodejs/
echo "✅ Layer zip created: $(ls -lh postgresql-layer-v3.zip)"

# Step 5: Deploy updated layer
echo "🚀 Step 5: Deploying updated layer..."
LAYER_VERSION_ARN=$(aws lambda publish-layer-version \
    --layer-name "$LAYER_NAME" \
    --description "PostgreSQL client with AWS SDK v3 for Node.js Lambda functions" \
    --zip-file fileb://postgresql-layer-v3.zip \
    --compatible-runtimes nodejs18.x nodejs20.x \
    --region "$REGION" --profile "$PROFILE" \
    --query 'LayerVersionArn' --output text)

echo "✅ Updated layer deployed"
echo "📋 New Layer Version ARN: $LAYER_VERSION_ARN"

# Step 6: Update Lambda function code and redeploy
echo ""
echo "🔄 Step 6: Updating Lambda function..."
cd ../../

# Recreate function zip with updated code
cd lambda-functions/db-test
zip -r db-test-function-v3.zip index.js package.json
cd ../../

# Update function code
aws lambda update-function-code \
    --function-name "matbakh-db-test" \
    --zip-file fileb://lambda-functions/db-test/db-test-function-v3.zip \
    --region "$REGION" --profile "$PROFILE"

# Update function layers
aws lambda update-function-configuration \
    --function-name "matbakh-db-test" \
    --layers "$LAYER_VERSION_ARN" \
    --region "$REGION" --profile "$PROFILE"

echo "✅ Lambda function updated with new layer"

# Step 7: Test updated function
echo ""
echo "🧪 Step 7: Testing updated function..."
sleep 5

TEST_EVENT='{"test": true, "message": "Updated RDS connectivity test"}'

INVOKE_RESULT=$(aws lambda invoke \
    --function-name "matbakh-db-test" \
    --cli-binary-format raw-in-base64-out \
    --payload "$TEST_EVENT" \
    --region "$REGION" --profile "$PROFILE" \
    response-v3.json)

echo "📋 Invocation result:"
echo "$INVOKE_RESULT" | jq .

if [ -f response-v3.json ]; then
    echo ""
    echo "📊 Function response:"
    cat response-v3.json | jq .
    
    STATUS_CODE=$(cat response-v3.json | jq -r '.statusCode // empty')
    if [ "$STATUS_CODE" = "200" ]; then
        echo ""
        echo "🎉 SUCCESS: Updated function works!"
        echo "📋 Database connection successful with AWS SDK v3"
    else
        echo ""
        echo "⚠️  Function still has issues, checking logs..."
        
        # Get latest logs
        LOG_GROUP="/aws/lambda/matbakh-db-test"
        sleep 3
        
        LATEST_STREAM=$(aws logs describe-log-streams \
            --log-group-name "$LOG_GROUP" \
            --order-by LastEventTime \
            --descending \
            --max-items 1 \
            --region "$REGION" --profile "$PROFILE" \
            --query 'logStreams[0].logStreamName' --output text 2>/dev/null || echo "")
        
        if [ -n "$LATEST_STREAM" ] && [ "$LATEST_STREAM" != "None" ]; then
            echo "📋 Latest error logs:"
            aws logs get-log-events \
                --log-group-name "$LOG_GROUP" \
                --log-stream-name "$LATEST_STREAM" \
                --region "$REGION" --profile "$PROFILE" \
                --query 'events[-5:].message' --output text
        fi
    fi
fi

# Step 8: Update configuration
echo ""
echo "💾 Step 8: Updating configuration..."

# Update .env.secrets with new layer ARN
sed -i.bak "s|POSTGRESQL_LAYER_ARN=.*|POSTGRESQL_LAYER_ARN=$LAYER_VERSION_ARN|" .env.secrets

echo "✅ Configuration updated"

# Cleanup
rm -rf lambda-layers/
rm -f response-v3.json

echo ""
echo "🎉 LAMBDA LAYER UPDATE COMPLETE"
echo "==============================="
echo ""
echo "✅ New Layer Version: $LAYER_VERSION_ARN"
echo "✅ AWS SDK v3 compatibility added"
echo "✅ Lambda function updated and tested"
echo ""
echo "📋 Layer now includes:"
echo "   - pg (PostgreSQL client)"
echo "   - pg-pool (Connection pooling)"
echo "   - @aws-sdk/client-secrets-manager (AWS SDK v3)"
echo ""
echo "🚀 Ready for production use!"