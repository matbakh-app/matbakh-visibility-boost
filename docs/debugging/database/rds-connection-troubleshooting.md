# RDS Connection Troubleshooting

## Problem
Lambda functions cannot connect to RDS PostgreSQL database.

## Common Symptoms
- Connection timeout errors
- "Connection refused" errors
- SSL/TLS handshake failures
- Authentication failures

## Debugging Steps

### 1. Check Security Groups
```bash
# Check RDS security group
aws ec2 describe-security-groups --group-ids sg-RDS-ID

# Check Lambda security group
aws ec2 describe-security-groups --group-ids sg-LAMBDA-ID

# Verify port 5432 is open between Lambda and RDS security groups
```

### 2. Test Database Connection
```bash
# From Lambda environment (using pg-client layer)
const { Pool } = require('pg');
const pool = new Pool({
  host: process.env.DB_HOST,
  port: 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false }
});

try {
  const result = await pool.query('SELECT NOW()');
  console.log('Connection successful:', result.rows[0]);
} catch (error) {
  console.error('Connection failed:', error);
}
```

### 3. Check RDS Status
```bash
# Check RDS instance status
aws rds describe-db-instances --db-instance-identifier matbakh-production

# Check RDS logs
aws rds describe-db-log-files --db-instance-identifier matbakh-production
```

### 4. Verify Network Configuration
```bash
# Check VPC configuration
aws ec2 describe-vpcs --vpc-ids vpc-ID

# Check subnets
aws ec2 describe-subnets --filters "Name=vpc-id,Values=vpc-ID"

# Check route tables
aws ec2 describe-route-tables --filters "Name=vpc-id,Values=vpc-ID"
```

## Common Solutions

### SSL Configuration
```javascript
// Correct SSL configuration for RDS
const pool = new Pool({
  host: process.env.DB_HOST,
  port: 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false,
    ca: fs.readFileSync('/opt/rds-ca-2019-root.pem').toString()
  }
});
```

### Connection Pooling
```javascript
// Use connection pooling for better performance
const pool = new Pool({
  // ... connection config
  max: 5, // Maximum connections in pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

## Prevention
- Always test database connections in development
- Use proper SSL certificates
- Configure security groups correctly
- Monitor connection pool usage

## Related Issues
- A2.2: RDS deployment and configuration
- A2.3: Lambda database integration