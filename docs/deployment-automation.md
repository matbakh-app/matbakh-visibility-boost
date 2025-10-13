# Matbakh Deployment Automation

## Overview

The Matbakh deployment automation system implements a **Build-once, Promote-many** strategy with **Blue-Green deployment** for S3+CloudFront. It integrates with the existing QA (Task 5) and Performance Testing (Task 6) systems to provide comprehensive health gates before traffic switching.

## Architecture

### Blue-Green S3+CloudFront Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    CloudFront Distribution                   │
│                    (E2W4JULEW8BXSD)                         │
├─────────────────────────────────────────────────────────────┤
│  Origin Path: /blue  OR  /green                            │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                S3 Bucket Structure                          │
│        matbakhvcstack-webbucket12880f5b-svct6cxfbip5       │
├─────────────────────────────────────────────────────────────┤
│  /blue/                    │  /green/                       │
│  ├── index.html            │  ├── index.html                │
│  ├── assets/               │  ├── assets/                   │
│  │   ├── index.js          │  │   ├── index.js              │
│  │   └── index.css         │  │   └── index.css             │
│  └── manifest.json         │  └── manifest.json             │
└─────────────────────────────────────────────────────────────┘
```

### Deployment Flow

1. **Build Once**: Create immutable artifact with SHA256 manifest
2. **Sync to Inactive Slot**: Upload to blue or green slot
3. **Health Gates**: Run QA, Performance, Accessibility, and Smoke tests
4. **Switch Traffic**: Update CloudFront origin path
5. **Verify**: Post-switch validation
6. **Rollback**: Automatic rollback on failure

## Components

### Core Scripts

- **`scripts/deploy-one-click.ts`** - Main deployment orchestrator
- **`scripts/deploy/package-artifact.ts`** - Build-once artifact creation
- **`scripts/deploy/sync-to-slot.ts`** - S3 Blue-Green slot synchronization
- **`scripts/deploy/switch-origin.ts`** - CloudFront origin switching
- **`scripts/deploy/smoke-suite.ts`** - Health gates integration
- **`scripts/deploy/matbakh-rollback.ts`** - Blue-Green rollback system

### Health Gates Integration

- **QA Gates** (Task 5): Security scanning, code quality, accessibility
- **Performance Gates** (Task 6): Load testing, response time validation
- **Accessibility Gates**: axe-core WCAG compliance testing
- **Smoke Tests**: Synthetic uptime monitoring

## Usage

### One-Click Deployment

```bash
# Deploy to staging (auto-detects inactive slot)
npm run deploy:staging

# Deploy to production with specific slot
npm run deploy:prod --slot green

# Deploy existing artifact
npm run deploy:prod --artifact artifacts/web-dist-abc123.zip

# Dry run validation
npm run deploy:prod --dry-run

# Skip health gates (not recommended for production)
npm run deploy:staging --skip-health-gates
```

### Individual Operations

```bash
# Create deployment artifact
npm run deploy:package

# Sync to specific slot
npm run deploy:sync --env production --slot green --artifact artifacts/web-dist-abc123.zip

# Switch CloudFront origin
npm run deploy:switch --env production --slot green

# Run smoke tests
npm run deploy:smoke --base https://matbakh.app/green

# Rollback deployment
npm run deploy:rollback --env production --reason "Critical bug detected"
```

### Status and Information

```bash
# Check current active slot
npm run deploy:switch --env production --current-slot

# Show distribution information
npm run deploy:switch --env production --info

# List artifacts
npm run deploy:package --list

# Check deployment health
npm run check:health --env production
```

## Environment Configuration

### Development
- **Bucket**: `matbakh-dev-web-bucket`
- **Distribution**: `E1234567890DEV`
- **Domain**: `dev.matbakh.app`
- **Health Gates**: Basic smoke tests only

### Staging
- **Bucket**: `matbakh-staging-web-bucket`
- **Distribution**: `E1234567890STG`
- **Domain**: `staging.matbakh.app`
- **Health Gates**: QA + Performance + Smoke tests

### Production
- **Bucket**: `matbakhvcstack-webbucket12880f5b-svct6cxfbip5`
- **Distribution**: `E2W4JULEW8BXSD`
- **Domain**: `matbakh.app`
- **Health Gates**: Full suite (QA + Performance + Accessibility + Smoke)

## Health Gates

### QA Gates (Task 5 Integration)
- **Security Scanning**: Vulnerability detection
- **Code Quality**: Quality gates validation
- **Accessibility**: Basic WCAG compliance
- **Threshold**: 85% overall score

### Performance Gates (Task 6 Integration)
- **Load Testing**: 1-minute smoke test with 5 concurrent users
- **Thresholds**:
  - Production: P95 < 200ms, P99 < 500ms, Error rate < 1%
  - Staging: P95 < 300ms, P99 < 600ms, Error rate < 2%
  - Development: P95 < 500ms, P99 < 1000ms, Error rate < 5%

### Accessibility Gates
- **axe-core Testing**: WCAG 2.1 AA compliance
- **Critical Routes**: `/`, `/vc/quick`, `/dashboard`
- **Threshold**: Zero critical violations

### Smoke Tests
- **Synthetic Uptime**: HTTP 200 checks on critical routes
- **Routes**: `/`, `/vc/quick`, `/dashboard`, `/health`
- **Timeout**: 10 seconds per route

## Security

### AWS OIDC Integration
```yaml
# GitHub Actions OIDC configuration
permissions:
  id-token: write
  contents: read

- name: Configure AWS credentials
  uses: aws-actions/configure-aws-credentials@v4
  with:
    role-to-assume: arn:aws:iam::055062860590:role/GitHubActionsDeployRole
    aws-region: eu-central-1
```

### IAM Permissions (Least Privilege)
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:PutObjectAcl",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::matbakhvcstack-webbucket12880f5b-svct6cxfbip5",
        "arn:aws:s3:::matbakhvcstack-webbucket12880f5b-svct6cxfbip5/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudfront:GetDistribution",
        "cloudfront:GetDistributionConfig",
        "cloudfront:UpdateDistribution",
        "cloudfront:CreateInvalidation"
      ],
      "Resource": "arn:aws:cloudfront::055062860590:distribution/E2W4JULEW8BXSD"
    }
  ]
}
```

### Artifact Security
- **SHA256 Manifest**: Immutable artifact verification
- **No Secrets in Bundle**: Only `VITE_*` environment variables
- **Artifact Signing**: Deployment manifest with git SHA

## Cache Strategy

### Static Assets (Long Cache)
```bash
aws s3 sync dist/ s3://bucket/slot/ \
  --cache-control "public,max-age=31536000,immutable" \
  --exclude "index.html" \
  --exclude "manifest.json" \
  --exclude "service-worker.js"
```

### Dynamic Files (No Cache)
```bash
aws s3 cp dist/index.html s3://bucket/slot/index.html \
  --cache-control "no-cache,no-store,must-revalidate"
```

### CloudFront Invalidation
```bash
aws cloudfront create-invalidation \
  --distribution-id E2W4JULEW8BXSD \
  --paths "/index.html" "/manifest.json" "/service-worker.js"
```

## Rollback

### Automatic Rollback Triggers
- Health gate failures during deployment
- Error rate exceeding threshold (1% for production)
- Manual trigger via monitoring alerts

### Rollback Process
1. **Validate Rollback**: Check target slot has content
2. **Switch Origin**: Update CloudFront to previous slot
3. **Invalidate Cache**: Clear CDN cache for critical files
4. **Verify Health**: Run smoke tests on rolled-back version
5. **Update Status**: Mark deployment as rolled back

### Rollback Commands
```bash
# Automatic rollback (switches to opposite slot)
npm run deploy:rollback --env production --reason "Critical bug"

# Rollback to specific slot
npm run deploy:rollback --env production --target-slot blue --reason "Rollback to stable"

# Force rollback (skip validation)
npm run deploy:rollback --env production --reason "Emergency" --force

# Dry run rollback
npm run deploy:rollback --env production --reason "Test" --dry-run
```

## Monitoring and Observability

### CloudWatch Alarms
- **5xx Error Rate**: > 1% for 5 minutes
- **Total Error Rate**: > threshold for environment
- **Latency P95**: > 20% increase from baseline
- **Cache Hit Rate**: < 85%

### Deployment Metrics
- **Deployment Duration**: Target < 10 minutes
- **Health Gate Success Rate**: Target > 95%
- **Rollback Frequency**: Target < 5% of deployments
- **MTTR (Mean Time to Recovery)**: Target < 5 minutes

### Alerting
- **Slack Integration**: Deployment status notifications
- **GitHub PR Comments**: Deployment results
- **Email Alerts**: Critical deployment failures

## GitHub Actions Integration

### Automatic Deployments
- **Development**: Auto-deploy on `develop` branch push
- **Staging**: Auto-deploy on `main` branch push
- **Production**: Manual approval required

### Manual Deployments
```yaml
# Workflow dispatch with options
workflow_dispatch:
  inputs:
    environment: [development, staging, production]
    slot: [blue, green] # optional
    artifact: string # optional
    skip_health_gates: boolean
    dry_run: boolean
```

### Artifact Management
- **Build Artifacts**: Stored as GitHub Actions artifacts
- **Retention**: 7 days for build artifacts
- **Promotion**: Same artifact promoted through environments

## Best Practices

### Development Workflow
1. **Feature Development**: Work on feature branches
2. **Build Once**: Create artifact on merge to develop
3. **Auto-Deploy Dev**: Automatic deployment to development
4. **Manual Staging**: Promote same artifact to staging
5. **Production Approval**: Manual approval for production deployment

### Deployment Safety
1. **Always Use Health Gates**: Never skip in production
2. **Monitor Post-Deployment**: Watch metrics for 15 minutes
3. **Have Rollback Plan**: Know how to rollback quickly
4. **Test Rollback**: Regularly test rollback procedures
5. **Document Changes**: Include deployment notes in PRs

### Performance Optimization
1. **Artifact Size**: Keep artifacts < 10MB
2. **Cache Headers**: Use appropriate cache strategies
3. **CDN Optimization**: Leverage CloudFront edge locations
4. **Compression**: Enable gzip/brotli compression
5. **Asset Optimization**: Minimize and optimize assets

## Troubleshooting

### Common Issues

#### Deployment Stuck in "switching" Status
```bash
# Check CloudFront distribution status
npm run deploy:switch --env production --info

# Manually verify switch
npm run deploy:switch --env production --verify green
```

#### Health Gates Failing
```bash
# Run individual smoke tests
npm run deploy:smoke --base https://matbakh.app/green

# Check specific gate results
npm run qa:full --target-url https://matbakh.app/green
```

#### Rollback Not Working
```bash
# Check current deployment status
npm run deploy:rollback --env production --status

# Force rollback if needed
npm run deploy:rollback --env production --reason "Emergency" --force
```

#### Artifact Issues
```bash
# Verify artifact integrity
npm run deploy:package --verify artifacts/web-dist-abc123.zip

# List available artifacts
npm run deploy:package --list

# Clean old artifacts
npm run deploy:package --clean
```

### Debug Commands
```bash
# Enable verbose AWS CLI output
export AWS_CLI_FILE_ENCODING=UTF-8
export AWS_DEFAULT_OUTPUT=json

# Check AWS credentials
aws sts get-caller-identity

# Test S3 access
aws s3 ls s3://matbakhvcstack-webbucket12880f5b-svct6cxfbip5/

# Test CloudFront access
aws cloudfront get-distribution --id E2W4JULEW8BXSD
```

## Success Metrics

### Deployment Performance
- **Deployment Time**: < 10 minutes end-to-end
- **Health Gate Success**: > 95% pass rate
- **Rollback Time**: < 3 minutes for slot switch
- **Zero Downtime**: 100% uptime during deployments

### Quality Gates
- **QA Score**: > 85% for all deployments
- **Performance**: P95 < 200ms, P99 < 500ms in production
- **Accessibility**: Zero critical violations
- **Security**: Zero high-severity issues

### Operational Excellence
- **Automation**: 100% automated deployment pipeline
- **Observability**: Complete deployment visibility
- **Recovery**: < 5 minute MTTR for rollbacks
- **Compliance**: Full audit trail for all deployments