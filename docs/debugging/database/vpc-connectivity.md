# Database: VPC Connectivity Issues

**Date**: Various (2025-08-28 to 2025-08-31)  
**Issue**: Lambda functions unable to connect to RDS PostgreSQL  
**Status**: ✅ RESOLVED

## Problem Description

Lambda functions in VPC unable to connect to RDS PostgreSQL database, causing timeouts and connection failures.

### Symptoms
- Lambda timeout errors (15 seconds)
- "Connection refused" or "Connection timeout" errors
- Database queries failing silently
- Cold start connection issues

## Root Cause Analysis

### 1. VPC Configuration
Lambda functions need to be in the same VPC as RDS and have proper subnet/security group configuration.

**Current VPC Setup**:
- VPC ID: `vpc-0c72fab3273a1be4f`
- Subnets: 
  - `subnet-086715492e55e5380`
  - `subnet-027c02162f7e5b530` 
  - `subnet-0d0cfb07da9341ce3`
- Security Group: `sg-0ce17ccbf943dd57b`

### 2. Security Group Rules
Lambda security group must allow outbound traffic to RDS port (5432).

### 3. RDS Configuration
RDS must accept connections from Lambda security group.

## Solution Applied

### 1. Lambda VPC Configuration
```bash
# Verify Lambda VPC configuration
aws lambda get-function --function-name "FUNCTION-NAME" --region eu-central-1 \
  --query 'Configuration.VpcConfig'
```

### 2. Security Group Rules
```bash
# Check security group rules
aws ec2 describe-security-groups \
  --group-ids sg-0ce17ccbf943dd57b \
  --region eu-central-1
```

### 3. Connection Pool Implementation
**File**: `infra/layers/pg-client-layer/src/pgClient.ts`

```typescript
import { Pool } from 'pg';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

let pool: Pool | null = null;

export async function executeQuery(query: string, params: any[] = []) {
    if (!pool) {
        console.log('Creating new PostgreSQL connection pool');
        
        // Get database credentials from Secrets Manager
        const secretsClient = new SecretsManagerClient({ 
            region: process.env.AWS_REGION || 'eu-central-1' 
        });
        
        const getSecretCommand = new GetSecretValueCommand({
            SecretId: 'matbakh-db-postgres'
        });
        
        const secretResponse = await secretsClient.send(getSecretCommand);
        const dbCredentials = JSON.parse(secretResponse.SecretString!);
        
        pool = new Pool({
            host: dbCredentials.host,
            port: dbCredentials.port,
            database: dbCredentials.dbname,
            user: dbCredentials.username,
            password: dbCredentials.password,
            ssl: {
                rejectUnauthorized: false
            },
            max: 5,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 10000,
        });
        
        console.log('PostgreSQL connection pool created successfully');
    } else {
        console.log('Using cached PostgreSQL connection pool');
    }
    
    console.log('Executing query:', query.substring(0, 100) + '...');
    const result = await pool.query(query, params);
    return result;
}
```

## Testing Commands

### 1. Test Database Connection
```bash
# Test Lambda function with database query
aws lambda invoke \
  --function-name "MatbakhVcStack-VcStartFnC5BAD875-Lukpaun5TO53" \
  --payload '{"email":"test@example.com","name":"Test"}' \
  --cli-binary-format raw-in-base64-out \
  response.json --region eu-central-1
```

### 2. Check Connection Logs
```bash
# Monitor Lambda logs for connection issues
aws logs tail "/aws/lambda/FUNCTION-NAME" --follow --region eu-central-1
```

### 3. Verify VPC Configuration
```bash
# Check Lambda VPC settings
aws lambda get-function --function-name "FUNCTION-NAME" \
  --query 'Configuration.VpcConfig' --region eu-central-1
```

## Connection Pool Best Practices

### 1. Singleton Pattern
- Create pool once per Lambda container
- Reuse across invocations
- Handle connection failures gracefully

### 2. Configuration
```typescript
const poolConfig = {
    max: 5,                    // Maximum connections
    idleTimeoutMillis: 30000,  // Close idle connections
    connectionTimeoutMillis: 10000, // Connection timeout
    ssl: { rejectUnauthorized: false } // RDS SSL
};
```

### 3. Error Handling
```typescript
try {
    const result = await pool.query(query, params);
    return result;
} catch (error) {
    console.error('Database query failed:', error);
    // Consider connection pool reset on certain errors
    throw error;
}
```

## Common Issues & Solutions

### Issue: Lambda Timeout
**Cause**: Long-running database queries or connection issues
**Solution**: 
- Increase Lambda timeout (current: 15s)
- Optimize database queries
- Add connection timeout

### Issue: Too Many Connections
**Cause**: Lambda scaling creates many database connections
**Solution**:
- Use connection pooling
- Set appropriate `max` pool size
- Consider RDS Proxy for high-scale applications

### Issue: Cold Start Delays
**Cause**: New Lambda containers need to establish connections
**Solution**:
- Connection pooling reduces impact
- Consider provisioned concurrency for critical functions
- Optimize connection establishment

## Monitoring

### CloudWatch Metrics
- Lambda duration
- Lambda errors
- Lambda concurrent executions
- RDS connections

### Log Patterns to Watch
```
Creating new PostgreSQL connection pool
Using cached PostgreSQL connection pool
PostgreSQL connection pool created successfully
Database query failed: connection timeout
```

## Related Files

- `infra/layers/pg-client-layer/src/pgClient.ts` - Connection pool implementation
- `infra/layers/pg-client-layer/package.json` - Dependencies
- `vc-start-production.js` - Uses executeQuery function
- `vc-confirm-production.js` - Uses executeQuery function

## Success Metrics

- ✅ Connection establishment: < 2 seconds
- ✅ Query execution: < 1 second for simple queries
- ✅ Connection reuse: 90%+ of invocations use cached pool
- ✅ Error rate: < 1% connection failures