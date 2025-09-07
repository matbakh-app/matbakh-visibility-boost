# System Health Checks & Monitoring

## Automated Health Checks

### 1. API Endpoints Health Check
```bash
#!/bin/bash
# scripts/health-check.sh

API_BASE="https://guf7ho7bze.execute-api.eu-central-1.amazonaws.com/prod"

echo "🔍 Checking API Health..."

# Test VC Start endpoint
echo "Testing /vc/start..."
curl -s -o /dev/null -w "%{http_code}" -X POST \
  "$API_BASE/vc/start" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","businessName":"Test Business"}'

# Test VC Confirm endpoint (with dummy token)
echo "Testing /vc/confirm..."
curl -s -o /dev/null -w "%{http_code}" \
  "$API_BASE/vc/confirm?t=dummy-token"

echo "✅ API Health Check Complete"
```

### 2. Database Health Check
```javascript
// Check RDS connection and basic queries
const healthCheckDB = async () => {
  try {
    // Test connection
    const result = await pool.query('SELECT NOW() as current_time');
    console.log('✅ Database connection OK:', result.rows[0]);
    
    // Test critical tables
    const tables = ['profiles', 'visibility_check_leads', 'business_partners'];
    for (const table of tables) {
      const count = await pool.query(`SELECT COUNT(*) FROM ${table}`);
      console.log(`✅ Table ${table}: ${count.rows[0].count} records`);
    }
    
    return { status: 'healthy', timestamp: new Date() };
  } catch (error) {
    console.error('❌ Database health check failed:', error);
    return { status: 'unhealthy', error: error.message };
  }
};
```

### 3. Email Service Health Check
```javascript
// Check Resend API status
const healthCheckEmail = async () => {
  try {
    const response = await fetch('https://api.resend.com/domains', {
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
      }
    });
    
    if (response.ok) {
      const domains = await response.json();
      console.log('✅ Email service OK, domains:', domains.data.length);
      return { status: 'healthy', domains: domains.data.length };
    } else {
      throw new Error(`API returned ${response.status}`);
    }
  } catch (error) {
    console.error('❌ Email service health check failed:', error);
    return { status: 'unhealthy', error: error.message };
  }
};
```

## Monitoring Dashboards

### CloudWatch Metrics to Monitor
```bash
# Lambda function metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Duration \
  --dimensions Name=FunctionName,Value=matbakh-vc-start \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-02T00:00:00Z \
  --period 3600 \
  --statistics Average

# API Gateway metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApiGateway \
  --metric-name 4XXError \
  --dimensions Name=ApiName,Value=matbakh-api \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-02T00:00:00Z \
  --period 3600 \
  --statistics Sum

# RDS metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name DatabaseConnections \
  --dimensions Name=DBInstanceIdentifier,Value=matbakh-production \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-02T00:00:00Z \
  --period 3600 \
  --statistics Average
```

### Key Performance Indicators (KPIs)

#### System Health KPIs
- API Response Time < 2 seconds
- Database Connection Pool < 80% usage
- Lambda Error Rate < 1%
- Email Delivery Rate > 95%

#### Business KPIs
- Visibility Check Completion Rate
- Email Confirmation Rate
- User Registration Success Rate

### Alerting Rules

#### Critical Alerts (Immediate Action)
```bash
# Lambda function errors > 5 in 5 minutes
aws cloudwatch put-metric-alarm \
  --alarm-name "Lambda-High-Error-Rate" \
  --alarm-description "Lambda function error rate too high" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1

# API Gateway 5XX errors
aws cloudwatch put-metric-alarm \
  --alarm-name "API-Gateway-5XX-Errors" \
  --alarm-description "API Gateway server errors" \
  --metric-name 5XXError \
  --namespace AWS/ApiGateway \
  --statistic Sum \
  --period 300 \
  --threshold 1 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1
```

#### Warning Alerts (Monitor Closely)
- Database connection count > 50
- Lambda duration > 10 seconds
- Email bounce rate > 5%

## Log Analysis

### Important Log Patterns to Monitor
```bash
# Lambda function errors
aws logs filter-log-events \
  --log-group-name "/aws/lambda/matbakh-vc-start" \
  --filter-pattern "ERROR"

# API Gateway access logs
aws logs filter-log-events \
  --log-group-name "API-Gateway-Execution-Logs" \
  --filter-pattern "[timestamp, requestId, ip, user, timestamp, method, resource, protocol, status=4*, size, referer, agent]"

# Database connection errors
aws logs filter-log-events \
  --log-group-name "/aws/lambda/matbakh-vc-start" \
  --filter-pattern "connection"
```

### Automated Log Analysis
```javascript
// Analyze logs for common error patterns
const analyzeErrors = async (logGroup, hours = 24) => {
  const endTime = new Date();
  const startTime = new Date(endTime.getTime() - (hours * 60 * 60 * 1000));
  
  const params = {
    logGroupName: logGroup,
    startTime: startTime.getTime(),
    endTime: endTime.getTime(),
    filterPattern: 'ERROR'
  };
  
  const events = await cloudWatchLogs.filterLogEvents(params).promise();
  
  // Categorize errors
  const errorCategories = {
    database: 0,
    email: 0,
    authentication: 0,
    network: 0,
    other: 0
  };
  
  events.events.forEach(event => {
    const message = event.message.toLowerCase();
    if (message.includes('database') || message.includes('connection')) {
      errorCategories.database++;
    } else if (message.includes('email') || message.includes('resend')) {
      errorCategories.email++;
    } else if (message.includes('auth') || message.includes('cognito')) {
      errorCategories.authentication++;
    } else if (message.includes('timeout') || message.includes('network')) {
      errorCategories.network++;
    } else {
      errorCategories.other++;
    }
  });
  
  return errorCategories;
};
```

## Performance Optimization

### Database Query Optimization
```sql
-- Monitor slow queries
SELECT query, mean_time, calls, total_time
FROM pg_stat_statements
WHERE mean_time > 1000
ORDER BY mean_time DESC
LIMIT 10;

-- Check connection pool usage
SELECT count(*) as active_connections,
       max_conn,
       max_conn - count(*) as available_connections
FROM pg_stat_activity, 
     (SELECT setting::int as max_conn FROM pg_settings WHERE name = 'max_connections') mc
GROUP BY max_conn;
```

### Lambda Performance Tuning
```javascript
// Monitor cold starts
const startTime = Date.now();

exports.handler = async (event) => {
  const initTime = Date.now() - startTime;
  console.log(`Cold start time: ${initTime}ms`);
  
  // Your function logic here
  
  const executionTime = Date.now() - startTime;
  console.log(`Total execution time: ${executionTime}ms`);
};
```

## Maintenance Tasks

### Daily Tasks
- [ ] Check error rates in CloudWatch
- [ ] Review failed email deliveries
- [ ] Monitor database connection pool
- [ ] Check API response times

### Weekly Tasks
- [ ] Analyze error trends
- [ ] Review and optimize slow queries
- [ ] Check disk usage and performance
- [ ] Update monitoring thresholds if needed

### Monthly Tasks
- [ ] Review and update alerting rules
- [ ] Analyze cost optimization opportunities
- [ ] Update health check scripts
- [ ] Review security logs and access patterns