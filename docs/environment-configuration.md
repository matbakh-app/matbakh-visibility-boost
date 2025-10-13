# Environment Configuration

## Performance Monitoring Environment Variables

### Required Configuration

```bash
# Metrics API Endpoint (from CDK deployment)
VITE_METRICS_ENDPOINT=https://api.matbakh.app/metrics

# Enable metrics collection
VITE_ENABLE_METRICS=true

# Sampling rate (0.0 to 1.0) - 25% recommended for production
VITE_METRICS_SAMPLE_RATE=0.25

# Application version for tracking
VITE_APP_VERSION=1.2.3

# AWS Configuration
AWS_REGION=eu-central-1
VITE_AWS_REGION=eu-central-1

# CloudWatch Namespace
METRICS_NS=Matbakh/Web
```

### Environment-Specific Defaults

#### Development
```bash
VITE_ENABLE_METRICS=false
VITE_METRICS_SAMPLE_RATE=1.0
VITE_APP_VERSION=dev
```

#### Staging
```bash
VITE_ENABLE_METRICS=true
VITE_METRICS_SAMPLE_RATE=0.5
VITE_APP_VERSION=staging-1.2.3
```

#### Production
```bash
VITE_ENABLE_METRICS=true
VITE_METRICS_SAMPLE_RATE=0.25
VITE_APP_VERSION=1.2.3
```

### CDK Context Variables

For infrastructure deployment:

```bash
# Deploy with custom configuration
cdk deploy -c metricsNs="Matbakh/Web" \
           -c corsOrigin="https://matbakh.app" \
           -c logLevel="info"
```

### Validation

Verify your configuration:

```bash
# Check environment variables
echo $VITE_METRICS_ENDPOINT
echo $VITE_ENABLE_METRICS
echo $VITE_METRICS_SAMPLE_RATE

# Test metrics endpoint
curl -X POST $VITE_METRICS_ENDPOINT \
  -H "Content-Type: application/json" \
  -d '{"metricName":"test","value":1}'
```

### Security Notes

- Never commit real API endpoints to version control
- Use different namespaces for different environments
- Rotate API keys regularly
- Monitor usage and costs in CloudWatch