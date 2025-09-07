const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const { Pool } = require('pg');

const secretsManager = new SecretsManagerClient({ region: process.env.AWS_REGION });

let pool;

async function getDbConfig() {
    try {
        const command = new GetSecretValueCommand({
            SecretId: process.env.DB_SECRET_NAME
        });
        
        const secret = await secretsManager.send(command);
        
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
