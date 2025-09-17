# Prompt Quality Assurance System

A comprehensive system for auditing, scoring, optimizing, and testing AI prompt templates with automated quality assurance workflows.

## 🎯 Overview

The Prompt Quality Assurance System provides enterprise-grade quality management for AI prompt templates, including:

- **Comprehensive Audit Trails** - Complete prompt-to-output mapping with performance metrics
- **Quality Scoring Engine** - Multi-dimensional quality analysis using AI and heuristic methods
- **Optimization Recommendations** - Data-driven suggestions for improving prompt performance
- **Automated Testing Framework** - Validation frameworks and regression testing capabilities

## 🏗️ Architecture

### Core Components

1. **AuditTrailManager** - Manages comprehensive audit records for all prompt executions
2. **QualityScoringEngine** - Analyzes quality using AI-based, heuristic, and structural methods
3. **OptimizationRecommendationEngine** - Generates actionable recommendations based on performance data
4. **AutomatedTestingFramework** - Provides testing capabilities and validation frameworks

### Data Flow

```
Prompt Execution → Audit Trail → Quality Analysis → Recommendations → Testing & Validation
```

## 🚀 Features

### Audit Trail Management
- Complete prompt-to-output mapping with metadata
- Performance metrics tracking (response time, token usage, costs)
- User feedback integration and quality metric updates
- CloudWatch metrics integration for monitoring

### Quality Scoring
- **AI-Based Scoring**: Uses Claude 3.5 Sonnet for intelligent quality analysis
- **Heuristic Scoring**: Rule-based analysis for consistency and reliability
- **Structural Scoring**: Validates output structure and format compliance
- **Combined Scoring**: Weighted combination of multiple scoring methods

### Optimization Recommendations
- Quality improvement suggestions based on performance data
- Performance optimization for response time and token efficiency
- Cost reduction recommendations with impact projections
- User experience improvements based on feedback analysis

### Automated Testing
- Test case creation and management
- Validation frameworks with custom rules
- Regression testing for template changes
- Performance benchmarking and comparison

## 📊 Quality Metrics

The system tracks comprehensive quality metrics:

- **Relevance Score** (0-1): How well the output addresses the prompt
- **Coherence Score** (0-1): Logical structure and flow of the response
- **Completeness Score** (0-1): Whether the response fully answers the request
- **Accuracy Score** (0-1): Factual correctness and reliability
- **User Satisfaction Score** (0-1): Based on user feedback ratings
- **Overall Score** (0-1): Weighted combination of all metrics
- **Confidence** (0-1): System confidence in the quality assessment

## 🛠️ Installation & Deployment

### Prerequisites

- AWS CLI configured with appropriate permissions
- Node.js 20.x or later
- TypeScript compiler

### Quick Deployment

```bash
# Clone and navigate to the directory
cd infra/lambdas/prompt-quality-assurance

# Run the deployment script
./deploy.sh
```

The deployment script will:
1. Install dependencies and run tests
2. Create DynamoDB table for data storage
3. Set up IAM roles and permissions
4. Deploy Lambda function with API Gateway
5. Configure CloudWatch monitoring

### Manual Setup

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build the project
npm run build

# Deploy using AWS CLI (see deploy.sh for details)
```

## 📡 API Endpoints

### Audit Operations
- `POST /audit/create` - Create new audit record
- `GET /audit/trail` - Retrieve audit trail with filtering
- `GET /audit/record/{id}` - Get specific audit record
- `GET /audit/stats/{templateId}` - Get template statistics
- `PUT /audit/feedback/{id}` - Add user feedback to audit record

### Quality Analysis
- `POST /quality/analyze` - Analyze prompt-output quality
- `POST /quality/batch` - Batch analyze multiple executions
- `POST /quality/feedback` - Incorporate user feedback into metrics
- `GET /quality/benchmarks/{templateId}` - Get quality benchmarks

### Recommendations
- `POST /recommendations/generate` - Generate optimization recommendations
- `POST /recommendations/effectiveness` - Track recommendation effectiveness

### Testing
- `POST /testing/create-case` - Create new test case
- `POST /testing/run-suite` - Run comprehensive test suite
- `POST /testing/create-framework` - Create validation framework
- `POST /testing/validate` - Validate output against framework
- `POST /testing/regression` - Run regression tests
- `GET /testing/benchmarks/{templateId}` - Generate performance benchmarks

### Health Check
- `GET /health` - System health status

## 💡 Usage Examples

### Creating an Audit Record

```typescript
const auditRequest = {
  execution: {
    id: 'exec-123',
    templateId: 'template-456',
    templateVersion: '1.0',
    prompt: 'Analyze the visibility of this restaurant',
    output: 'The restaurant has good online presence...',
    timestamp: '2025-01-09T10:00:00Z',
    executionTime: 2000,
    tokenUsage: { input: 100, output: 200, total: 300 },
    metadata: { persona: 'Solo-Sarah', useCase: 'visibility-check' }
  },
  qualityMetrics: {
    relevanceScore: 0.8,
    coherenceScore: 0.85,
    completenessScore: 0.75,
    accuracyScore: 0.9,
    overallScore: 0.825,
    confidence: 0.8
  }
};

// POST /audit/create
const auditRecord = await createAuditRecord(auditRequest);
```

### Analyzing Quality

```typescript
const qualityRequest = {
  prompt: 'Analyze the visibility of this restaurant',
  output: 'The restaurant has good online presence with active social media.',
  contextData: { businessType: 'restaurant', location: 'Berlin' }
};

// POST /quality/analyze
const qualityMetrics = await analyzeQuality(qualityRequest);
```

### Generating Recommendations

```typescript
const recommendationRequest = {
  templateId: 'template-456',
  timeRange: '30d',
  includeUserFeedback: true
};

// POST /recommendations/generate
const recommendations = await generateRecommendations(recommendationRequest);
```

### Running Test Suite

```typescript
const testRequest = {
  templateId: 'template-456',
  testType: 'functional'
};

// POST /testing/run-suite
const testResults = await runTestSuite(testRequest);
```

## 🔧 Configuration

### Environment Variables

- `DYNAMO_TABLE_NAME` - DynamoDB table name for data storage
- `AWS_REGION` - AWS region for services
- `CLOUDWATCH_NAMESPACE` - CloudWatch namespace for metrics

### Quality Thresholds

Default quality thresholds can be configured:
- Minimum acceptable quality: 0.6
- Good quality threshold: 0.7
- Excellent quality threshold: 0.9

### Testing Configuration

- Maximum concurrent tests: 5
- Default test timeout: 30 seconds
- Retry attempts for failed tests: 3

## 📈 Monitoring & Metrics

### CloudWatch Metrics

The system publishes metrics to CloudWatch:
- `PromptQualityScore` - Overall quality scores by template
- `PromptResponseTime` - Response times for prompt executions
- `TokenEfficiency` - Token usage efficiency metrics
- `UserSatisfactionRate` - User feedback satisfaction rates

### Logging

Comprehensive logging includes:
- Audit trail creation and updates
- Quality analysis results
- Recommendation generation
- Test execution results
- Error tracking and debugging information

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Test Coverage

The system maintains >95% test coverage across all components:
- Unit tests for all core functionality
- Integration tests for API endpoints
- Mock tests for AWS service interactions
- Error handling and edge case testing

## 🔒 Security

### IAM Permissions

The Lambda function requires permissions for:
- DynamoDB read/write operations
- Bedrock model invocation
- CloudWatch metrics publishing
- CloudWatch Logs creation

### Data Protection

- All sensitive data is encrypted at rest in DynamoDB
- API endpoints support CORS for secure web integration
- Input validation and sanitization for all requests
- Audit trails for all system operations

## 🚨 Error Handling

The system provides comprehensive error handling:
- Graceful degradation when AI services are unavailable
- Fallback to heuristic scoring when AI analysis fails
- Detailed error messages with actionable guidance
- Automatic retry mechanisms for transient failures

## 📚 API Documentation

### Request/Response Format

All API responses follow a consistent format:

```typescript
{
  success: boolean;
  data?: any;
  error?: string;
  metadata: {
    executionTime: number;
    timestamp: string;
    version: string;
  };
}
```

### Error Codes

- `400` - Bad Request (validation errors)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error (system errors)

## 🔄 Continuous Improvement

The system supports continuous improvement through:
- Performance tracking and optimization
- User feedback integration
- A/B testing capabilities for prompt variations
- Automated recommendation implementation tracking

## 📞 Support

For issues or questions:
1. Check CloudWatch logs for detailed error information
2. Review the API documentation for correct usage
3. Ensure all required permissions are configured
4. Verify DynamoDB table and indexes are properly set up

## 🎯 Roadmap

Future enhancements planned:
- Multi-language support for quality analysis
- Advanced ML models for quality prediction
- Real-time streaming analysis capabilities
- Integration with external quality assurance tools
- Custom quality metric definitions
- Advanced visualization dashboards

---

**Version**: 1.0.0  
**Last Updated**: January 9, 2025  
**Compatibility**: AWS Lambda, Node.js 20.x, TypeScript 5.x