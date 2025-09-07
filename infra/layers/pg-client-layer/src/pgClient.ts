import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { Pool, PoolClient } from 'pg';

// Cached connection pool for Lambda cold start optimization
let cachedPool: Pool | null = null;

// Database credentials interface
interface DatabaseCredentials {
  host: string;
  username: string;
  password: string;
  dbname: string;
  port: string;
  engine: string;
  dbInstanceIdentifier: string;
}

/**
 * Get PostgreSQL connection pool with automatic secret retrieval
 * Uses connection pooling and caching for optimal Lambda performance
 */
export async function getPgClient(): Promise<Pool> {
  if (cachedPool) {
    console.log('Using cached PostgreSQL connection pool');
    return cachedPool;
  }

  console.log('Creating new PostgreSQL connection pool');

  try {
    // Retrieve database credentials from AWS Secrets Manager
    const client = new SecretsManagerClient({ region: 'eu-central-1' });
    const command = new GetSecretValueCommand({ SecretId: 'matbakh-db-postgres' });
    const secret = await client.send(command);
    
    if (!secret.SecretString) {
      throw new Error('Secret string is empty');
    }

    const creds: DatabaseCredentials = JSON.parse(secret.SecretString);

    // Validate required credentials
    if (!creds.host || !creds.username || !creds.password || !creds.dbname) {
      throw new Error('Missing required database credentials');
    }

    // Create connection pool with optimized settings for Lambda
    cachedPool = new Pool({
      host: creds.host,
      user: creds.username,
      password: creds.password,
      database: creds.dbname,
      port: Number(creds.port) || 5432,
      ssl: { rejectUnauthorized: false },
      // Lambda-optimized pool settings
      max: 5, // Maximum connections in pool
      min: 1, // Minimum connections to maintain
      idleTimeoutMillis: 30000, // Close idle connections after 30s
      connectionTimeoutMillis: 10000, // Connection timeout 10s
    });

    // Test the connection
    const testClient = await cachedPool.connect();
    await testClient.query('SELECT NOW()');
    testClient.release();

    console.log('PostgreSQL connection pool created successfully');
    return cachedPool;

  } catch (error) {
    console.error('Failed to create PostgreSQL connection pool:', error);
    throw error;
  }
}

/**
 * Execute a query with automatic connection management
 * @param query SQL query string
 * @param params Query parameters
 * @returns Query result
 */
export async function executeQuery(query: string, params: any[] = []): Promise<any> {
  const pool = await getPgClient();
  const client = await pool.connect();
  
  try {
    console.log('Executing query:', query.substring(0, 100) + '...');
    const result = await client.query(query, params);
    return result;
  } catch (error) {
    console.error('Query execution failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Execute a transaction with automatic rollback on error
 * @param queries Array of {query, params} objects
 * @returns Array of query results
 */
export async function executeTransaction(queries: Array<{query: string, params?: any[]}>): Promise<any[]> {
  const pool = await getPgClient();
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    console.log('Transaction started');
    
    const results = [];
    for (const {query, params = []} of queries) {
      console.log('Executing transaction query:', query.substring(0, 100) + '...');
      const result = await client.query(query, params);
      results.push(result);
    }
    
    await client.query('COMMIT');
    console.log('Transaction committed successfully');
    return results;
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Transaction rolled back due to error:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Close the connection pool (useful for Lambda cleanup)
 */
export async function closePgClient(): Promise<void> {
  if (cachedPool) {
    console.log('Closing PostgreSQL connection pool');
    await cachedPool.end();
    cachedPool = null;
  }
}

/**
 * Health check function to test database connectivity
 */
export async function healthCheck(): Promise<{success: boolean, message: string, timestamp: string}> {
  try {
    const result = await executeQuery('SELECT NOW() as current_time, version() as version');
    return {
      success: true,
      message: 'Database connection successful',
      timestamp: result.rows[0].current_time
    };
  } catch (error) {
    return {
      success: false,
      message: `Database connection failed: ${error}`,
      timestamp: new Date().toISOString()
    };
  }
}