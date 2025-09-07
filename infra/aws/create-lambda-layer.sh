#!/bin/bash
set -euo pipefail

# Create Lambda Layer for PostgreSQL (Node.js)
# Phase A2.2 - Infrastructure Completion

REGION=${AWS_REGION:-eu-central-1}
PROFILE=${AWS_PROFILE:-matbakh-dev}
LAYER_NAME="matbakh-postgresql-layer"

echo "🪝 CREATING LAMBDA LAYER FOR POSTGRESQL"
echo "======================================="
echo "Region: $REGION"
echo "Profile: $PROFILE"
echo "Layer Name: $LAYER_NAME"
echo ""

# Step 1: Create layer directory structure
echo "📁 Step 1: Creating layer directory structure..."
mkdir -p lambda-layers/postgresql/nodejs
cd lambda-layers/postgresql

# Step 2: Create package.json for PostgreSQL dependencies
echo "📦 Step 2: Creating package.json..."
cat > nodejs/package.json << 'EOF'
{
  "name": "matbakh-postgresql-layer",
  "version": "1.0.0",
  "description": "PostgreSQL client layer for Matbakh Lambda functions",
  "dependencies": {
    "pg": "^8.11.3",
    "pg-pool": "^3.6.1"
  }
}
EOF

# Step 3: Install dependencies
echo "🔧 Step 3: Installing PostgreSQL dependencies..."
cd nodejs
npm install --production
cd ..

echo "✅ Dependencies installed:"
ls -la nodejs/node_modules/ | grep pg

# Step 4: Create layer zip file
echo "📦 Step 4: Creating layer zip file..."
zip -r postgresql-layer.zip nodejs/
echo "✅ Layer zip created: $(ls -lh postgresql-layer.zip)"

# Step 5: Deploy layer to AWS
echo "🚀 Step 5: Deploying layer to AWS..."
LAYER_VERSION_ARN=$(aws lambda publish-layer-version \
    --layer-name "$LAYER_NAME" \
    --description "PostgreSQL client libraries for Node.js Lambda functions" \
    --zip-file fileb://postgresql-layer.zip \
    --compatible-runtimes nodejs18.x nodejs20.x \
    --region "$REGION" --profile "$PROFILE" \
    --query 'LayerVersionArn' --output text)

echo "✅ Layer deployed successfully"
echo "📋 Layer Version ARN: $LAYER_VERSION_ARN"

# Step 6: Create test Lambda function code
echo ""
echo "🧪 Step 6: Creating test Lambda function..."
cd ../../
mkdir -p lambda-functions/db-test
cd lambda-functions/db-test

cat > index.js << 'EOF'
const AWS = require('aws-sdk');
const { Pool } = require('pg');

const secretsManager = new AWS.SecretsManager({ region: process.env.AWS_REGION });

let pool;

async function getDbConfig() {
    try {
        const secret = await secretsManager.getSecretValue({
            SecretId: process.env.DB_SECRET_NAME
        }).promise();
        
        return JSON.parse(secret.SecretString);
    } catch (error) {
        console.error('Error retrieving database secret:', error);
        throw error;
    }
}

async function initializePool() {
    if (!pool) {
        const dbConfig = await getDbConfig();
        
        pool = new Pool({
            host: dbConfig.host,
            port: dbConfig.port,
            database: dbConfig.dbname,
            user: dbConfig.username,
            password: dbConfig.password,
            ssl: {
                rejectUnauthorized: false
            },
            max: 1, // Lambda connection limit
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        });
        
        console.log('Database pool initialized');
    }
    
    return pool;
}

exports.handler = async (event) => {
    console.log('Event:', JSON.stringify(event, null, 2));
    
    try {
        const dbPool = await initializePool();
        
        // Test basic connection
        const client = await dbPool.connect();
        
        try {
            // Test query
            const result = await client.query('SELECT version(), now() as current_time');
            
            // Test table count
            const tableCount = await client.query(`
                SELECT count(*) as table_count 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
            `);
            
            // Test feature flags
            const featureFlags = await client.query(`
                SELECT key, value, description 
                FROM feature_flags 
                LIMIT 5
            `);
            
            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    success: true,
                    message: 'Database connection successful',
                    data: {
                        version: result.rows[0],
                        tableCount: tableCount.rows[0].table_count,
                        featureFlags: featureFlags.rows,
                        timestamp: new Date().toISOString()
                    }
                })
            };
            
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('Database error:', error);
        
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            })
        };
    }
};
EOF

# Create package.json for Lambda function
cat > package.json << 'EOF'
{
  "name": "matbakh-db-test",
  "version": "1.0.0",
  "description": "Test Lambda function for RDS connectivity",
  "main": "index.js",
  "dependencies": {}
}
EOF

# Step 7: Create deployment zip
echo "📦 Step 7: Creating Lambda deployment package..."
zip -r db-test-function.zip index.js package.json
echo "✅ Lambda function package created"

# Step 8: Save layer configuration
cd ../../
echo ""
echo "💾 Step 8: Saving layer configuration..."

cat >> .env.secrets << EOF

# Lambda Layer Configuration
POSTGRESQL_LAYER_NAME=$LAYER_NAME
POSTGRESQL_LAYER_ARN=$LAYER_VERSION_ARN

# Test Function
DB_TEST_FUNCTION_ZIP=lambda-functions/db-test/db-test-function.zip
EOF

echo "✅ Configuration updated in .env.secrets"

# Cleanup
echo ""
echo "🧹 Cleanup: Removing temporary files..."
rm -rf lambda-layers/

echo ""
echo "🎉 LAMBDA LAYER SETUP COMPLETE"
echo "=============================="
echo ""
echo "✅ Layer Name: $LAYER_NAME"
echo "✅ Layer ARN: $LAYER_VERSION_ARN"
echo "✅ Compatible Runtimes: nodejs18.x, nodejs20.x"
echo "✅ Test Function: lambda-functions/db-test/"
echo ""
echo "📋 Layer Contents:"
echo "   - pg (PostgreSQL client)"
echo "   - pg-pool (Connection pooling)"
echo ""
echo "🔗 Usage in Lambda Functions:"
echo "============================="
echo "1. Add layer ARN to Lambda function"
echo "2. Use: const { Pool } = require('pg');"
echo "3. Environment variables needed:"
echo "   - DB_SECRET_NAME: matbakh-db-postgres"
echo "   - AWS_REGION: eu-central-1"
echo ""
echo "🚀 Next Steps:"
echo "=============="
echo "1. A2.3: Create Lambda execution role"
echo "2. A2.4: Deploy and test Lambda function"
echo "3. A2.5: Create deployment structure"