# AI Agent Memory Architecture

A comprehensive persistent memory layer for AI agents with multi-tenant support, intelligent caching, and context preservation across sessions.

## Overview

The AI Agent Memory Architecture provides a robust foundation for maintaining context and memory across multiple user sessions and AI agent interactions. It combines DynamoDB for persistent storage with Redis for high-performance caching, enabling intelligent memory management with relevance scoring and automatic optimization.

## Features

### Core Capabilities
- **Persistent Memory Layer**: DynamoDB-based storage with automatic TTL and cleanup
- **High-Performance Caching**: Redis-based caching with intelligent TTL management
- **Multi-Tenant Isolation**: Secure tenant-based data separation with configurable quotas
- **Context Preservation**: Maintains conversation history, user preferences, and business context
- **Relevance Scoring**: Automatic scoring and optimization based on content and usage patterns
- **Memory Optimization**: Automatic cleanup of old and low-relevance contexts

### Memory Context Types
- **Conversation**: Chat history and dialogue context
- **User Profile**: User preferences and behavioral patterns
- **Business Analysis**: Business context and insights
- **Task Execution**: Task history and execution results
- **Learning Insights**: AI-generated insights and recommendations

### Advanced Features
- **Intelligent Caching**: Context-aware TTL and cache warming
- **Memory Sharing**: Configurable cross-tenant and cross-user sharing policies
- **Quota Management**: Per-tenant memory quotas with automatic enforcement
- **Relevance Optimization**: Automatic scoring and cleanup based on usage patterns
- **Multi-Session Context**: Seamless context preservation across user sessions

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Gateway   │    │  Lambda Handler │    │ Memory Manager  │
│                 │────│                 │────│                 │
│ REST Endpoints  │    │ Event Routing   │    │ Core Logic      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                       ┌─────────────────┐             │
                       │ Redis Cache     │◄────────────┤
                       │                 │             │
                       │ High-Speed      │             │
                       │ Context Cache   │             │
                       └─────────────────┘             │
                                                        │
                       ┌─────────────────┐             │
                       │ DynamoDB        │◄────────────┘
                       │                 │
                       │ Persistent      │
                       │ Memory Storage  │
                       └─────────────────┘
```

## API Reference

### Core Operations

#### Store Memory Context
```bash
POST /memory
{
  "action": "store",
  "tenantId": "tenant-123",
  "userId": "user-456",
  "sessionId": "session-789",
  "agentId": "agent-001",
  "context": {
    "contextType": "conversation",
    "content": {
      "conversationHistory": [...],
      "userPreferences": {...},
      "businessContext": {...}
    },
    "metadata": {
      "tags": ["important", "customer-service"],
      "source": "chat-agent"
    }
  }
}
```

#### Retrieve Memory Contexts
```bash
POST /memory
{
  "action": "retrieve",
  "tenantId": "tenant-123",
  "query": {
    "userId": "user-456",
    "sessionId": "session-789",
    "contextTypes": ["conversation", "user_profile"],
    "relevanceThreshold": 0.5,
    "timeRange": {
      "start": "2024-01-01T00:00:00Z",
      "end": "2024-12-31T23:59:59Z"
    },
    "limit": 10
  }
}
```

#### Update Memory Context
```bash
POST /memory
{
  "action": "update",
  "tenantId": "tenant-123",
  "context": {
    "id": "context-uuid",
    "relevanceScore": 0.9,
    "metadata": {
      "tags": ["updated", "high-priority"]
    }
  }
}
```

#### Delete Memory Context
```bash
POST /memory
{
  "action": "delete",
  "tenantId": "tenant-123",
  "context": {
    "id": "context-uuid"
  }
}
```

#### Memory Optimization
```bash
POST /memory
{
  "action": "cleanup",
  "tenantId": "tenant-123",
  "config": {
    "maxMemorySize": 100,
    "relevanceThreshold": 0.3,
    "retentionPeriod": 30,
    "compressionEnabled": false,
    "cleanupInterval": 24
  }
}
```

#### Get Memory Statistics
```bash
POST /memory
{
  "action": "optimize",
  "tenantId": "tenant-123"
}
```

### Specialized Operations

#### Add Conversation Entry
```bash
POST /memory/conversation
{
  "contextId": "context-uuid",
  "tenantId": "tenant-123",
  "entry": {
    "timestamp": "2024-01-09T10:00:00Z",
    "role": "user",
    "content": "Hello, I need help with my restaurant's visibility",
    "metadata": {
      "channel": "web-chat",
      "sentiment": "neutral"
    }
  }
}
```

#### Add Task Entry
```bash
POST /memory/task
{
  "contextId": "context-uuid",
  "tenantId": "tenant-123",
  "task": {
    "taskType": "visibility_analysis",
    "status": "completed",
    "description": "Analyzed restaurant's online presence",
    "result": {
      "score": 85,
      "recommendations": [...]
    },
    "timestamp": "2024-01-09T10:05:00Z"
  }
}
```

#### Add Insight Entry
```bash
POST /memory/insight
{
  "contextId": "context-uuid",
  "tenantId": "tenant-123",
  "insight": {
    "type": "recommendation",
    "content": "Consider updating Google My Business photos",
    "confidence": 0.9,
    "source": "visibility-agent",
    "timestamp": "2024-01-09T10:10:00Z"
  }
}
```

### Health Check
```bash
GET /memory/health
```

## Data Models

### Memory Context
```typescript
interface MemoryContext {
  id: string;
  tenantId: string;
  userId: string;
  sessionId: string;
  agentId: string;
  contextType: ContextType;
  content: MemoryContent;
  metadata: MemoryMetadata;
  relevanceScore: number;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
}
```

### Memory Content
```typescript
interface MemoryContent {
  conversationHistory: ConversationEntry[];
  userPreferences: UserPreferences;
  businessContext: BusinessContext;
  taskHistory: TaskEntry[];
  insights: InsightEntry[];
  customData: Record<string, any>;
}
```

### Tenant Configuration
```typescript
interface TenantConfig {
  tenantId: string;
  memoryQuota: number; // in MB
  retentionPolicy: RetentionPolicy;
  sharingPolicy: SharingPolicy;
  encryptionEnabled: boolean;
}
```

## Deployment

### Prerequisites
- AWS CLI configured with appropriate permissions
- Node.js 20.x or later
- npm or yarn package manager

### Quick Deployment
```bash
# Clone and navigate to the project
cd infra/lambdas/ai-agent-memory

# Install dependencies
npm install

# Deploy to AWS
./deploy.sh
```

### Manual Deployment Steps

1. **Build the Lambda function**:
   ```bash
   npm run build
   ```

2. **Create deployment package**:
   ```bash
   zip -r deployment.zip dist/ node_modules/ package.json
   ```

3. **Deploy Lambda function**:
   ```bash
   aws lambda create-function \
     --function-name ai-agent-memory \
     --runtime nodejs20.x \
     --role arn:aws:iam::ACCOUNT:role/lambda-execution-role \
     --handler dist/index.handler \
     --zip-file fileb://deployment.zip
   ```

4. **Create DynamoDB table**:
   ```bash
   aws dynamodb create-table \
     --table-name ai-agent-memory \
     --attribute-definitions \
       AttributeName=pk,AttributeType=S \
       AttributeName=sk,AttributeType=S \
     --key-schema \
       AttributeName=pk,KeyType=HASH \
       AttributeName=sk,KeyType=RANGE \
     --provisioned-throughput ReadCapacityUnits=10,WriteCapacityUnits=10
   ```

5. **Create Redis cluster**:
   ```bash
   aws elasticache create-cache-cluster \
     --cache-cluster-id ai-memory-cache \
     --cache-node-type cache.t3.micro \
     --engine redis \
     --num-cache-nodes 1
   ```

## Configuration

### Environment Variables
- `MEMORY_TABLE_NAME`: DynamoDB table name (default: ai-agent-memory)
- `REDIS_URL`: Redis connection string (default: redis://localhost:6379)
- `AWS_REGION`: AWS region (default: eu-central-1)

### Tenant Configuration
```typescript
const tenantConfig: TenantConfig = {
  tenantId: 'restaurant-chain-001',
  memoryQuota: 500, // 500MB
  retentionPolicy: {
    conversation: 30,     // 30 days
    user_profile: 365,    // 1 year
    business_analysis: 90, // 3 months
    task_execution: 30,   // 30 days
    learning_insights: 180 // 6 months
  },
  sharingPolicy: {
    allowCrossTenant: false,
    allowCrossUser: true,
    sharedContextTypes: ['business_analysis'],
    isolatedContextTypes: ['user_profile']
  },
  encryptionEnabled: true
};

memoryManager.setTenantConfig('restaurant-chain-001', tenantConfig);
```

## Usage Examples

### Basic Memory Operations
```typescript
import { MemoryManager } from './memory-manager';
import { DynamoDBMemoryStorage } from './memory-storage-provider';
import { RedisMemoryCache } from './memory-cache-provider';

// Initialize components
const storage = new DynamoDBMemoryStorage();
const cache = new RedisMemoryCache();
const memoryManager = new MemoryManager(storage, cache);

// Store a conversation context
const context = await memoryManager.storeContext(
  'tenant-123',
  'user-456',
  'session-789',
  'chat-agent',
  'conversation',
  {
    conversationHistory: [
      {
        timestamp: new Date(),
        role: 'user',
        content: 'I need help improving my restaurant visibility'
      }
    ]
  }
);

// Retrieve contexts for a user
const contexts = await memoryManager.retrieveContexts({
  tenantId: 'tenant-123',
  userId: 'user-456',
  contextTypes: ['conversation'],
  limit: 10
});

// Add a new conversation entry
await memoryManager.addConversationEntry(
  context.id,
  'tenant-123',
  {
    timestamp: new Date(),
    role: 'assistant',
    content: 'I can help you analyze your online presence. Let me start by checking your Google My Business profile.'
  }
);
```

### Advanced Memory Management
```typescript
// Optimize memory for a tenant
const optimizationResult = await memoryManager.optimizeMemory('tenant-123', {
  maxMemorySize: 100,
  relevanceThreshold: 0.3,
  retentionPeriod: 30,
  compressionEnabled: false,
  cleanupInterval: 24
});

console.log(`Deleted ${optimizationResult.deletedContexts} contexts`);
console.log(`Freed ${optimizationResult.memoryFreed}MB of memory`);

// Get memory statistics
const stats = await memoryManager.getMemoryStats('tenant-123');
console.log(`Total memory used: ${stats.totalMemoryUsed}MB`);
console.log(`Average relevance score: ${stats.averageRelevanceScore}`);
```

## Testing

### Run Tests
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Test Coverage
The test suite provides comprehensive coverage including:
- Unit tests for all core components
- Integration tests for storage and cache providers
- End-to-end tests for Lambda handlers
- Performance tests for memory operations
- Security tests for tenant isolation

## Performance Considerations

### Caching Strategy
- **Hot Data**: Frequently accessed contexts cached with 1-hour TTL
- **Warm Data**: Recently accessed contexts cached with 6-hour TTL
- **Cold Data**: Rarely accessed contexts stored only in DynamoDB

### Memory Optimization
- **Relevance Scoring**: Automatic scoring based on content type, age, and usage
- **Cleanup Policies**: Configurable retention periods and relevance thresholds
- **Compression**: Optional compression for large contexts (future enhancement)

### Scalability
- **DynamoDB**: Auto-scaling enabled for read/write capacity
- **Redis**: Cluster mode for high availability and performance
- **Lambda**: Concurrent execution with appropriate memory allocation

## Security

### Data Protection
- **Encryption at Rest**: DynamoDB and Redis encryption enabled
- **Encryption in Transit**: TLS 1.2+ for all communications
- **Access Control**: IAM-based permissions with least privilege principle

### Multi-Tenant Isolation
- **Data Separation**: Tenant-based partitioning in DynamoDB
- **Access Validation**: Tenant ID validation on all operations
- **Quota Enforcement**: Per-tenant memory quotas and rate limiting

### Compliance
- **GDPR**: Automatic data deletion and retention policies
- **Audit Trail**: Comprehensive logging of all memory operations
- **Data Residency**: Regional deployment options for compliance

## Monitoring and Observability

### Metrics
- Memory usage per tenant
- Cache hit/miss ratios
- Operation latencies
- Error rates and types
- Relevance score distributions

### Logging
- Structured logging with correlation IDs
- Performance metrics and timing
- Error details and stack traces
- Audit trail for compliance

### Alerting
- Memory quota violations
- High error rates
- Performance degradation
- Cache cluster issues

## Troubleshooting

### Common Issues

#### High Memory Usage
```bash
# Check memory statistics
curl -X POST https://api.example.com/memory \
  -H 'x-tenant-id: tenant-123' \
  -d '{"action":"optimize"}'

# Run cleanup
curl -X POST https://api.example.com/memory \
  -H 'x-tenant-id: tenant-123' \
  -d '{"action":"cleanup","config":{"relevanceThreshold":0.5}}'
```

#### Cache Connection Issues
```bash
# Check health status
curl https://api.example.com/memory/health

# Verify Redis cluster status
aws elasticache describe-cache-clusters --cache-cluster-id ai-memory-cache
```

#### Performance Issues
- Monitor DynamoDB read/write capacity utilization
- Check Redis memory usage and eviction policies
- Review Lambda function memory allocation and timeout settings

## Contributing

### Development Setup
```bash
# Install dependencies
npm install

# Run tests
npm test

# Build project
npm run build

# Run linting
npm run lint
```

### Code Standards
- TypeScript strict mode enabled
- Comprehensive error handling
- 90%+ test coverage requirement
- ESLint and Prettier for code formatting

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the project repository
- Check the troubleshooting guide above
- Review the API documentation and examples