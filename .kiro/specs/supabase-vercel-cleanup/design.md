# Design Document - Supabase/Vercel Cleanup & AWS Migration

## Overview

This design document outlines the technical approach for completing the migration from Supabase/Vercel to AWS infrastructure. The design ensures zero-downtime migration while maintaining all existing functionality through AWS services.

## Architecture

### Current State (Mixed Architecture - PROBLEMATIC)
```
Frontend (React/Vite)
├── AuthContext.tsx ✅ AWS Cognito (MIGRATED)
├── ProfileService.ts ❌ Supabase Client (NEEDS MIGRATION)
├── score-history.ts ❌ Supabase Queries (NEEDS MIGRATION)
├── benchmark-comparison.ts ❌ Supabase Client (NEEDS MIGRATION)
└── Environment Variables ❌ Mixed Supabase/AWS (NEEDS CLEANUP)

Backend Infrastructure
├── Database ✅ AWS RDS (MIGRATED)
├── Authentication ✅ AWS Cognito (MIGRATED)
├── File Storage ✅ AWS S3 (MIGRATED)
└── API Gateway ✅ AWS Lambda (MIGRATED)
```

### Target State (Pure AWS Architecture)
```
Frontend (React/Vite)
├── AuthContext.tsx ✅ AWS Cognito
├── aws-rds-client.ts ✅ AWS RDS Connection
├── ProfileService.ts ✅ AWS RDS Client
├── score-history.ts ✅ AWS RDS Queries
├── benchmark-comparison.ts ✅ AWS RDS Client
└── Environment Variables ✅ AWS Only

Backend Infrastructure
├── Database ✅ AWS RDS
├── Authentication ✅ AWS Cognito
├── File Storage ✅ AWS S3
└── API Gateway ✅ AWS Lambda
```

## Components and Interfaces

### 1. AWS RDS Client Service

**File**: `src/services/aws-rds-client.ts`

```typescript
interface RDSClient {
  query<T>(sql: string, params?: any[]): Promise<T[]>;
  queryOne<T>(sql: string, params?: any[]): Promise<T | null>;
  transaction<T>(callback: (client: RDSClient) => Promise<T>): Promise<T>;
}

class AWSRDSClient implements RDSClient {
  private endpoint: string;
  private credentials: AWSCredentials;
  
  constructor(config: RDSConfig);
  async query<T>(sql: string, params?: any[]): Promise<T[]>;
  async queryOne<T>(sql: string, params?: any[]): Promise<T | null>;
  async transaction<T>(callback: (client: RDSClient) => Promise<T>): Promise<T>;
}
```

### 2. Migrated ProfileService

**File**: `src/services/ProfileService.ts`

```typescript
// BEFORE (Supabase)
import { supabase } from '@/integrations/supabase/client';

class ProfileService {
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId);
    return data;
  }
}

// AFTER (AWS RDS)
import { rdsClient } from '@/services/aws-rds-client';

class ProfileService {
  async getProfile(userId: string) {
    const profiles = await rdsClient.query(
      'SELECT * FROM profiles WHERE id = $1',
      [userId]
    );
    return profiles[0] || null;
  }
}
```

### 3. Migrated Score History Service

**File**: `src/services/score-history.ts`

```typescript
// BEFORE (Supabase)
static async insertScore(data: ScoreHistoryInsert): Promise<ScoreHistoryRecord> {
  const { data: result, error } = await supabase
    .from('score_history')
    .insert(data)
    .select()
    .single();
  return result;
}

// AFTER (AWS RDS)
static async insertScore(data: ScoreHistoryInsert): Promise<ScoreHistoryRecord> {
  const result = await rdsClient.queryOne(
    `INSERT INTO score_history (business_id, score_type, score_value, calculated_at, source, meta)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [data.business_id, data.score_type, data.score_value, data.calculated_at, data.source, data.meta]
  );
  return result;
}
```

### 4. Migrated Benchmark Comparison Service

**File**: `src/services/benchmark-comparison.ts`

```typescript
// BEFORE (Supabase)
export class BenchmarkComparisonService {
  private supabase: any;
  
  constructor(supabaseClient: any) {
    this.supabase = supabaseClient;
  }
  
  async getBenchmark(request: IndustryBenchmarkRequest): Promise<ScoreBenchmark | null> {
    const { data, error } = await this.supabase
      .from('score_benchmarks')
      .select('*')
      .eq('industry_id', request.industryId);
    return data;
  }
}

// AFTER (AWS RDS)
export class BenchmarkComparisonService {
  private rdsClient: RDSClient;
  
  constructor(rdsClient: RDSClient) {
    this.rdsClient = rdsClient;
  }
  
  async getBenchmark(request: IndustryBenchmarkRequest): Promise<ScoreBenchmark | null> {
    const benchmark = await this.rdsClient.queryOne(
      'SELECT * FROM score_benchmarks WHERE industry_id = $1',
      [request.industryId]
    );
    return benchmark;
  }
}
```

## Data Models

### RDS Connection Configuration

```typescript
interface RDSConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
  region: string;
}

interface AWSCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
}
```

### Environment Variables Schema

```typescript
// REMOVE (Supabase)
VITE_SUPABASE_ANON_KEY
VITE_SUPABASE_FUNCTIONS_URL
VITE_SUPABASE_PROJECT_ID
VITE_SUPABASE_PUBLISHABLE_KEY
VITE_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_DB_PASSWORD

// KEEP/ADD (AWS)
VITE_COGNITO_USER_POOL_ID=eu-central-1_farFjTHKf
VITE_COGNITO_USER_POOL_CLIENT_ID=<actual-client-id>
VITE_COGNITO_DOMAIN=matbakh-auth.auth.eu-central-1.amazoncognito.com
VITE_AWS_REGION=eu-central-1
VITE_AWS_RDS_ENDPOINT=matbakh-db.chq6q4cs0evx.eu-central-1.rds.amazonaws.com
DATABASE_URL=postgresql://postgres:Matbakhapp#6x@matbakh-db.chq6q4cs0evx.eu-central-1.rds.amazonaws.com:5432/matbakh
```

## Error Handling

### Migration Error Scenarios

1. **RDS Connection Failures**
   - Implement connection retry logic with exponential backoff
   - Provide clear error messages for connection issues
   - Log connection attempts for debugging

2. **Query Translation Errors**
   - Validate SQL syntax for PostgreSQL compatibility
   - Handle data type differences between Supabase and RDS
   - Implement query result validation

3. **Authentication Failures**
   - Ensure AWS Cognito tokens are properly validated
   - Handle token refresh scenarios
   - Provide fallback authentication flows

### Error Recovery Strategies

```typescript
class MigrationErrorHandler {
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxRetries) throw error;
        await this.delay(Math.pow(2, attempt) * 1000);
      }
    }
  }
  
  static async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

## Testing Strategy

### Unit Testing Approach

1. **Mock AWS Services**
   ```typescript
   // Mock RDS Client
   const mockRdsClient = {
     query: jest.fn(),
     queryOne: jest.fn(),
     transaction: jest.fn()
   };
   
   // Mock AWS Cognito
   const mockCognito = {
     getCurrentUser: jest.fn(),
     signIn: jest.fn(),
     signOut: jest.fn()
   };
   ```

2. **Test Data Consistency**
   - Ensure test data matches AWS RDS schema
   - Validate query results match expected formats
   - Test error scenarios and edge cases

3. **Integration Testing**
   - Test complete user flows with AWS services
   - Validate authentication and authorization
   - Test database operations end-to-end

### Migration Validation Tests

```typescript
describe('Migration Validation', () => {
  test('should have zero Supabase references', () => {
    // Scan codebase for Supabase imports
    expect(supabaseReferences).toHaveLength(0);
  });
  
  test('should have all AWS dependencies', () => {
    // Verify AWS packages are installed
    expect(awsDependencies).toContain('aws-amplify');
    expect(awsDependencies).toContain('@aws-sdk/client-rds-data');
  });
  
  test('should connect to AWS services only', async () => {
    // Test AWS connections
    await expect(rdsClient.query('SELECT 1')).resolves.toBeDefined();
    await expect(cognitoClient.getCurrentUser()).resolves.toBeDefined();
  });
});
```

## Performance Considerations

### Database Query Optimization

1. **Connection Pooling**
   - Implement connection pooling for RDS connections
   - Reuse connections across requests
   - Monitor connection usage and performance

2. **Query Optimization**
   - Use prepared statements for repeated queries
   - Implement proper indexing on frequently queried columns
   - Monitor query performance and optimize slow queries

3. **Caching Strategy**
   - Implement Redis caching for frequently accessed data
   - Cache authentication tokens and user sessions
   - Use cache invalidation for data consistency

### Migration Performance Metrics

- **Response Time**: Maintain <2s for all API calls
- **Throughput**: Support 100+ concurrent users
- **Error Rate**: Keep <1% error rate during migration
- **Availability**: Maintain 99.9% uptime during migration

## Security Considerations

### Data Protection

1. **Credential Management**
   - Store AWS credentials in AWS Secrets Manager
   - Use IAM roles for service-to-service authentication
   - Rotate credentials regularly

2. **Data Encryption**
   - Encrypt data in transit using TLS 1.3
   - Encrypt data at rest using AWS KMS
   - Implement field-level encryption for sensitive data

3. **Access Control**
   - Use AWS Cognito for user authentication
   - Implement role-based access control (RBAC)
   - Audit all data access and modifications

### Migration Security Checklist

- [ ] Remove all Supabase credentials from environment
- [ ] Validate AWS IAM permissions are minimal and necessary
- [ ] Ensure all API endpoints use AWS authentication
- [ ] Verify data encryption is maintained during migration
- [ ] Test security controls with penetration testing

## Deployment Strategy

### Migration Phases

1. **Phase 1: Service Layer Migration**
   - Migrate ProfileService to AWS RDS
   - Migrate Score History Service to AWS RDS
   - Migrate Benchmark Comparison Service to AWS RDS

2. **Phase 2: Environment Cleanup**
   - Remove Supabase environment variables
   - Add missing AWS environment variables
   - Validate environment configuration

3. **Phase 3: Test Migration**
   - Update test mocks to use AWS services
   - Validate all tests pass with AWS mocks
   - Update CI/CD pipeline for AWS testing

4. **Phase 4: Dependency Cleanup**
   - Remove Supabase packages from package.json
   - Ensure all AWS packages are present
   - Update build scripts and configurations

5. **Phase 5: Infrastructure Cleanup**
   - Archive or remove Supabase directory
   - Remove Vercel references
   - Update documentation and deployment guides

### Rollback Strategy

1. **Git-based Rollback**
   - Maintain git commits for each migration phase
   - Tag stable versions for quick rollback
   - Document rollback procedures for each phase

2. **Database Rollback**
   - Maintain database backups before migration
   - Test rollback procedures in staging environment
   - Document data recovery processes

3. **Service Rollback**
   - Implement feature flags for service switching
   - Maintain parallel service implementations during migration
   - Test rollback scenarios under load