# Quality Assurance System Setup Guide

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and configure:

```bash
# Required for QA Dashboard (browser-based usage)
VITE_QA_API_URL=http://localhost:3001

# Required for AI Code Review
AWS_REGION=eu-central-1
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here

# Optional: Enhanced Security Scanning
SNYK_TOKEN=your_snyk_token_here

# Optional: Advanced Quality Gates
SONAR_TOKEN=your_sonar_token_here
```

### 3. Local Development Setup

For local development with the QA Dashboard:

```bash
# Terminal A (QA Server)
npm run qa:server

# Terminal B (App with UI)
VITE_QA_API_URL=http://localhost:3001 npm run dev
```

### 4. Run QA Analysis

#### CLI Usage (Direct)
```bash
# Full analysis
npm run qa:full

# Quick scan (code review + security)
npm run qa:quick

# Individual components
npm run qa:code-review
npm run qa:security
npm run qa:accessibility
npm run qa:quality-gates
```

#### Dashboard Usage (Browser)
1. Start the QA server: `npm run qa:server`
2. Start your application: `npm run dev`
3. Navigate to the QA Test Page: `http://localhost:5173/qa-test`

## Architecture

### Browser vs Node.js Separation

The QA system is designed with a clear separation between browser and Node.js environments:

**Browser Components:**
- `QADashboard` React component
- `useQualityAssurance` React hook
- API calls to QA server

**Node.js Components:**
- QA Server (`scripts/qa-server.ts`)
- QA Orchestrator and individual QA systems
- AWS Bedrock, file system, and CLI tool integrations

### API Endpoints

The QA server provides these endpoints:

- `POST /api/qa/analyze` - Full QA analysis
- `POST /api/qa/quick-scan` - Quick scan
- `POST /api/qa/code-review` - Code review only
- `POST /api/qa/security-scan` - Security scan only
- `POST /api/qa/accessibility-test` - Accessibility test only
- `POST /api/qa/quality-gates` - Quality gates only
- `GET /api/qa/reports` - List available reports
- `GET /health` - Health check

## Configuration

### Security Policy
Configure security scanning thresholds:

```typescript
const securityPolicy = {
  allowedSeverities: ['low', 'medium'],
  maxVulnerabilities: {
    critical: 0,
    high: 0,
    medium: 5,
    low: 10,
  },
  failOnNewVulnerabilities: true,
};
```

### Accessibility Config
Configure WCAG compliance testing:

```typescript
const accessibilityConfig = {
  wcagLevel: 'AA',
  tags: ['wcag2a', 'wcag2aa', 'wcag21aa'],
  allowedViolations: {
    critical: 0,
    serious: 0,
    moderate: 2,
    minor: 5,
  },
};
```

### Quality Gates Config
Configure code quality thresholds:

```typescript
const qualityGatesConfig = {
  thresholds: {
    coverage: 80,
    duplicatedLines: 3,
    maintainabilityRating: 'B',
    reliabilityRating: 'A',
    securityRating: 'A',
    codeSmells: 50,
    bugs: 0,
    vulnerabilities: 0,
  },
};
```

## Troubleshooting

### Common Issues

**1. "QA API URL not configured"**
- Ensure `VITE_QA_API_URL=http://localhost:3001` is set in your `.env` file
- Start the QA server with `npm run qa:server`

**2. "AWS Bedrock access denied"**
- Configure AWS credentials in `.env` file
- Ensure your AWS account has Bedrock access enabled
- Check that the specified AWS region supports Claude 3.5 Sonnet

**3. "Snyk authentication failed"**
- Install Snyk CLI: `npm install -g snyk`
- Get your token from https://snyk.io/account
- Set `SNYK_TOKEN` in your `.env` file

**4. "SonarQube integration failed"**
- Install SonarQube Scanner
- Configure `SONAR_TOKEN` in your `.env` file
- Ensure SonarQube server is accessible

### Debug Mode

Enable debug logging:
```bash
DEBUG=qa:* npm run qa:full
```

### Health Check

Verify QA server is running:
```bash
curl http://localhost:3001/health
```

## Integration with CI/CD

### GitHub Actions
The QA system includes a comprehensive GitHub Actions workflow (`.github/workflows/quality-assurance.yml`) that:

- Runs on PR and push events
- Executes all QA components in parallel
- Posts results as PR comments
- Sends Slack notifications
- Stores artifacts for 30 days

### Local Pre-commit Hook
Add to `.git/hooks/pre-commit`:

```bash
#!/bin/sh
npm run qa:quick
if [ $? -ne 0 ]; then
  echo "QA checks failed. Commit aborted."
  exit 1
fi
```

## Performance Optimization

### Parallel Execution
The QA system runs components in parallel for optimal performance:
- AI Code Review + Security Scan + Accessibility Test + Quality Gates

### Caching
- AI analysis results are cached for repeated file analysis
- Security scan results are cached for unchanged dependencies
- Quality gate metrics are cached between runs

### Resource Management
- Configurable concurrency limits
- Memory-efficient file processing
- Graceful degradation under resource constraints

## Security Considerations

### Data Privacy
- No sensitive code data is stored permanently
- All analysis data is transmitted securely
- Configurable data retention policies

### Access Control
- AWS IAM role-based access for Bedrock
- Secure credential management
- Rate limiting and cost controls

## Support

For issues or questions:
1. Check this setup guide
2. Review the troubleshooting section
3. Check the GitHub Actions logs for CI/CD issues
4. Verify environment configuration
5. Test individual QA components separately