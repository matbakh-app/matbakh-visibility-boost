import { Pool } from 'pg';
/**
 * Get PostgreSQL connection pool with automatic secret retrieval
 * Uses connection pooling and caching for optimal Lambda performance
 */
export declare function getPgClient(): Promise<Pool>;
/**
 * Execute a query with automatic connection management
 * @param query SQL query string
 * @param params Query parameters
 * @returns Query result
 */
export declare function executeQuery(query: string, params?: any[]): Promise<any>;
/**
 * Execute a transaction with automatic rollback on error
 * @param queries Array of {query, params} objects
 * @returns Array of query results
 */
export declare function executeTransaction(queries: Array<{
    query: string;
    params?: any[];
}>): Promise<any[]>;
/**
 * Close the connection pool (useful for Lambda cleanup)
 */
export declare function closePgClient(): Promise<void>;
/**
 * Health check function to test database connectivity
 */
export declare function healthCheck(): Promise<{
    success: boolean;
    message: string;
    timestamp: string;
}>;
//# sourceMappingURL=pgClient.d.ts.map