# Automated SWOT Analysis Engine

AI-powered SWOT analysis engine for restaurant businesses that analyzes review texts and images to generate comprehensive business insights, actionable recommendations, and interactive visualizations.

## Features

### 🔍 Comprehensive Analysis
- **Text Analysis**: Sentiment analysis, key phrase extraction, theme identification using AWS Comprehend
- **Image Analysis**: Content detection, quality assessment, emotion recognition using AWS Rekognition
- **AI-Powered SWOT**: Intelligent SWOT generation using AWS Bedrock (Claude 3.5 Sonnet)
- **Business Intelligence**: Strategic insights with confidence scoring and evidence backing

### 📊 Rich Visualizations
- Interactive SWOT matrix with hover details
- Impact vs confidence scatter plots
- Category distribution charts
- Action priority matrices
- Evidence network diagrams
- Sentiment theme heatmaps

### 🎯 Actionable Recommendations
- Priority-based action recommendations
- ROI estimates and timeframe projections
- Step-by-step implementation guides
- Success metrics and KPIs
- Resource requirements

### 🏢 Business Category Optimization
- Restaurant-specific analysis algorithms
- Industry benchmarking and competitive insights
- Location-based market analysis
- Cultural adaptation using Hofstede framework

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   API Gateway   │───▶│  Lambda Handler  │───▶│  Text Analysis  │
└─────────────────┘    └──────────────────┘    │     Engine      │
                                │               └─────────────────┘
                                │               ┌─────────────────┐
                                └──────────────▶│  Image Analysis │
                                │               │     Engine      │
                                │               └─────────────────┘
                                │               ┌─────────────────┐
                                └──────────────▶│ SWOT Generation │
                                │               │     Engine      │
                                │               └─────────────────┘
                                │               ┌─────────────────┐
                                └──────────────▶│ Visualization   │
                                                │     Engine      │
                                                └─────────────────┘
```

### AWS Services Used
- **AWS Lambda**: Serverless compute for analysis processing
- **AWS Bedrock**: AI model access (Claude 3.5 Sonnet)
- **AWS Comprehend**: Natural language processing
- **AWS Rekognition**: Image analysis and computer vision
- **AWS S3**: Image storage and retrieval
- **API Gateway**: RESTful API endpoints

## Installation

### Prerequisites
- Node.js 20.x or later
- AWS CLI configured with appropriate permissions
- TypeScript compiler
- Jest for testing

### Dependencies
```bash
npm install
```

### Build
```bash
npm run build
```

### Test
```bash
npm test
```

## Deployment

### Quick Deployment
```bash
./deploy.sh
```

### Deployment with API Gateway
```bash
./deploy.sh --with-api
```

### Manual Deployment Steps
1. **Build the project**:
   ```bash
   npm run build
   ```

2. **Run tests**:
   ```bash
   npm test
   ```

3. **Create deployment package**:
   ```bash
   zip -r automated-swot-engine.zip dist/ node_modules/
   ```

4. **Deploy to AWS Lambda**:
   ```bash
   aws lambda create-function \
     --function-name automated-swot-engine \
     --runtime nodejs20.x \
     --role arn:aws:iam::ACCOUNT:role/lambda-execution-role \
     --handler dist/index.handler \
     --zip-file fileb://automated-swot-engine.zip \
     --timeout 300 \
     --memory-size 1024
   ```

## Usage

### API Endpoints

#### Health Check
```bash
GET /swot/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0",
  "service": "automated-swot-engine",
  "capabilities": {
    "textAnalysis": true,
    "imageAnalysis": true,
    "swotGeneration": true,
    "visualizations": true
  }
}
```

#### SWOT Analysis
```bash
POST /swot/analyze
Content-Type: application/json
```

Request body: See `sample-request.json` for complete example.

Response:
```json
{
  "requestId": "swot_1642248600_abc123",
  "businessId": "restaurant-berlin-123",
  "analysisDate": "2024-01-15T10:30:00Z",
  "swotAnalysis": {
    "strengths": [...],
    "weaknesses": [...],
    "opportunities": [...],
    "threats": [...]
  },
  "insights": [...],
  "actionRecommendations": [...],
  "visualizations": [...],
  "dataQuality": {...},
  "processingTime": 2500,
  "metadata": {...}
}
```

### Request Format

#### Required Fields
- `businessId`: Unique identifier for the business
- `businessName`: Name of the business
- `businessCategory`: Business category (e.g., "restaurant")
- `location`: Business location with city and country
- `reviewTexts`: Array of customer reviews
- `images`: Array of business images

#### Optional Fields
- `platformData`: Social media and platform metrics
- `analysisOptions`: Analysis configuration options

### Sample Request
```bash
curl -X POST https://api-id.execute-api.region.amazonaws.com/prod/swot/analyze \
  -H "Content-Type: application/json" \
  -d @sample-request.json
```

## Configuration

### Environment Variables
- `AWS_REGION`: AWS region (default: eu-central-1)
- `BEDROCK_MODEL_ID`: Bedrock model ID (default: anthropic.claude-3-5-sonnet-20241022-v2:0)

### Analysis Options
- `includeImageAnalysis`: Enable image analysis (default: true)
- `includeSentimentAnalysis`: Enable sentiment analysis (default: true)
- `analysisDepth`: Analysis depth - basic, detailed, comprehensive (default: detailed)
- `language`: Analysis language - en, de (default: en)

## Limits and Constraints

### Input Limits
- Maximum 1000 reviews per analysis
- Maximum 100 images per analysis
- Maximum 5 minutes processing time
- Image size limit: 15MB per image

### Rate Limits
- 10 requests per minute per API key
- 100 requests per hour per IP address

### Cost Considerations
- AWS Bedrock: ~$0.003 per 1K input tokens, ~$0.015 per 1K output tokens
- AWS Comprehend: ~$0.0001 per unit for sentiment analysis
- AWS Rekognition: ~$0.001 per image for label detection

## Testing

### Unit Tests
```bash
npm test
```

### Integration Tests
```bash
npm run test:integration
```

### Load Testing
```bash
npm run test:load
```

### Test Coverage
```bash
npm run test:coverage
```

## Monitoring and Logging

### CloudWatch Metrics
- Function duration and memory usage
- Error rates and success rates
- Custom business metrics

### Structured Logging
All logs include:
- Request ID for tracing
- Processing timestamps
- Error details with stack traces
- Performance metrics

### Alerting
Set up CloudWatch alarms for:
- High error rates (>5%)
- Long processing times (>60s)
- Memory usage (>80%)
- Cost thresholds

## Security

### IAM Permissions
Required permissions:
- `bedrock:InvokeModel` for AI analysis
- `comprehend:DetectSentiment` for text analysis
- `rekognition:DetectLabels` for image analysis
- `s3:GetObject` for image downloads

### Data Privacy
- No customer data is stored permanently
- All processing is done in-memory
- GDPR-compliant data handling
- Automatic PII detection and redaction

### Input Validation
- Comprehensive request validation
- File type and size restrictions
- Rate limiting and abuse prevention
- SQL injection and XSS protection

## Troubleshooting

### Common Issues

#### High Processing Times
- Reduce number of reviews/images
- Use 'basic' analysis depth
- Check AWS service limits

#### Memory Errors
- Increase Lambda memory allocation
- Optimize image sizes
- Process in smaller batches

#### API Gateway Timeouts
- Increase API Gateway timeout (max 29s)
- Use asynchronous processing for large requests
- Implement request queuing

### Debug Mode
Enable debug logging:
```bash
export DEBUG=true
```

### Error Codes
- `validation_error`: Invalid request format
- `processing_timeout`: Analysis took too long
- `service_unavailable`: AWS service error
- `rate_limit_exceeded`: Too many requests

## Performance Optimization

### Best Practices
1. **Batch Processing**: Group similar requests
2. **Caching**: Cache analysis results for similar businesses
3. **Image Optimization**: Compress images before analysis
4. **Parallel Processing**: Process reviews and images concurrently

### Scaling Considerations
- Lambda concurrent execution limits
- AWS service quotas and limits
- Cost optimization strategies
- Regional deployment for latency

## Contributing

### Development Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up AWS credentials
4. Run tests: `npm test`
5. Start development: `npm run dev`

### Code Standards
- TypeScript strict mode
- ESLint configuration
- Jest for testing
- Comprehensive error handling
- Detailed logging

### Pull Request Process
1. Create feature branch
2. Add tests for new functionality
3. Update documentation
4. Ensure all tests pass
5. Submit pull request

## License

MIT License - see LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting guide
- Review CloudWatch logs
- Contact the development team

## Changelog

### v1.0.0 (2024-01-15)
- Initial release
- Complete SWOT analysis engine
- Text and image analysis
- Interactive visualizations
- Comprehensive testing suite
- Production deployment scripts