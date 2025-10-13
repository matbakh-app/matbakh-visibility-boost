# Blue-Green Deployment Runbook

## Quick Reference

### Emergency Rollback (< 3 minutes)
```bash
# Production emergency rollback
npm run deploy:rollback --env production --reason "Emergency rollback" --force

# Check rollback status
npm run deploy:rollback --env production --status
```

### Check Current Status
```bash
# Current active slot
npm run deploy:switch --env production --current-slot

# Distribution info
npm run deploy:switch --env production --info

# Health check
npm run check:health --env production
```

## Standard Deployment Process

### 1. Pre-Deployment Checklist
- [ ] Code reviewed and approved
- [ ] Tests passing in CI/CD
- [ ] Staging deployment successful
- [ ] Monitoring dashboards ready
- [ ] Rollback plan confirmed

### 2. Production Deployment
```bash
# Standard production deployment
npm run deploy:prod

# Or with specific artifact
npm run deploy:prod --artifact artifacts/web-dist-abc123.zip

# Monitor deployment progress
# (deployment script shows real-time status)
```

### 3. Post-Deployment Verification
```bash
# Verify switch was successful
npm run deploy:switch --env production --verify green

# Run health checks
npm run check:health --env production

# Check application functionality
curl -I https://matbakh.app/
curl -I https://matbakh.app/vc/quick
curl -I https://matbakh.app/dashboard
```

### 4. Monitoring (First 15 minutes)
- Watch CloudWatch metrics for error rates
- Monitor response times and throughput
- Check user feedback channels
- Verify CDN cache hit rates

## Rollback Procedures

### Automatic Rollback Triggers
- Health gate failures during deployment
- Error rate > 1% for 5 minutes
- P95 response time > 500ms for 10 minutes
- Critical accessibility violations

### Manual Rollback Decision Tree

```
Is there a critical issue affecting users?
├─ YES → Execute immediate rollback
│   └─ npm run deploy:rollback --env production --reason "Critical issue" --force
│
└─ NO → Is the issue impacting performance/UX?
    ├─ YES → Assess impact and rollback if significant
    │   └─ npm run deploy:rollback --env production --reason "Performance impact"
    │
    └─ NO → Monitor and consider hotfix instead
```

### Rollback Verification Steps
1. **Confirm Rollback**: Check active slot switched back
2. **Health Check**: Verify all critical routes working
3. **Monitor Metrics**: Ensure error rates normalized
4. **User Communication**: Notify stakeholders if needed
5. **Post-Mortem**: Schedule incident review

## Slot Management

### Understanding Slots
- **Blue Slot**: `s3://bucket/blue/` → CloudFront origin `/blue`
- **Green Slot**: `s3://bucket/green/` → CloudFront origin `/green`
- **Active Slot**: Currently serving traffic
- **Inactive Slot**: Standby slot for next deployment

### Slot Operations
```bash
# Check which slot is active
npm run deploy:switch --env production --current-slot

# List files in specific slot
npm run deploy:sync --env production --slot blue --list-files

# Manually switch to specific slot (emergency use)
npm run deploy:switch --env production --slot blue

# Verify slot has content before switching
aws s3 ls s3://matbakhvcstack-webbucket12880f5b-svct6cxfbip5/blue/index.html
```

## Health Gates Deep Dive

### QA Gates (Task 5 Integration)
```bash
# Run QA analysis on specific slot
npm run qa:full --target-url https://matbakh.app/green

# Check security scan results
npm run qa:security --target-url https://matbakh.app/green
```

**Failure Handling**: If QA gates fail, deployment stops before traffic switch. Review results and fix issues before retrying.

### Performance Gates (Task 6 Integration)
```bash
# Run performance test on slot
npm run test:performance --url https://matbakh.app/green

# Check specific metrics
npm run test:performance --url https://matbakh.app/green --duration 60
```

**Thresholds**:
- P95 Response Time: < 200ms
- P99 Response Time: < 500ms
- Error Rate: < 1%

### Smoke Tests
```bash
# Run smoke tests on specific slot
npm run deploy:smoke --base https://matbakh.app/green

# Run with specific environment thresholds
npm run deploy:smoke --base https://matbakh.app/green --environment production
```

**Critical Routes Tested**:
- `/` - Homepage
- `/vc/quick` - Visibility Check entry
- `/dashboard` - User dashboard
- `/health` - Health endpoint

## Troubleshooting Guide

### Deployment Stuck Issues

#### Deployment Stuck in "syncing"
```bash
# Check S3 sync progress
aws s3 ls s3://matbakhvcstack-webbucket12880f5b-svct6cxfbip5/green/ --recursive

# Check AWS credentials
aws sts get-caller-identity

# Retry sync manually
npm run deploy:sync --env production --slot green --artifact artifacts/web-dist-abc123.zip
```

#### Deployment Stuck in "testing"
```bash
# Check which gate is failing
npm run deploy:smoke --base https://matbakh.app/green

# Run individual gates
npm run qa:full --target-url https://matbakh.app/green
npm run test:performance --url https://matbakh.app/green
```

#### Deployment Stuck in "switching"
```bash
# Check CloudFront distribution status
aws cloudfront get-distribution --id E2W4JULEW8BXSD --query "Distribution.Status"

# Check if update is in progress
aws cloudfront list-distributions --query "DistributionList.Items[?Id=='E2W4JULEW8BXSD'].Status"

# Wait for CloudFront deployment to complete (can take 15+ minutes)
```

### Health Gate Failures

#### QA Gate Failures
1. **Security Issues**: Review security scan results, fix vulnerabilities
2. **Code Quality**: Address code quality issues, improve test coverage
3. **Accessibility**: Fix accessibility violations, ensure WCAG compliance

#### Performance Gate Failures
1. **High Response Times**: Check for performance regressions, optimize slow queries
2. **High Error Rates**: Review error logs, fix application errors
3. **Low Throughput**: Check resource utilization, scale if needed

#### Smoke Test Failures
1. **Route Not Accessible**: Check application startup, verify health endpoints
2. **Timeout Issues**: Check network connectivity, increase timeout if needed
3. **Authentication Issues**: Verify auth configuration, check API keys

### CloudFront Issues

#### Cache Not Invalidating
```bash
# Create manual invalidation
aws cloudfront create-invalidation \
  --distribution-id E2W4JULEW8BXSD \
  --paths "/index.html" "/manifest.json" "/*"

# Check invalidation status
aws cloudfront list-invalidations --distribution-id E2W4JULEW8BXSD
```

#### Origin Not Switching
```bash
# Get current distribution config
aws cloudfront get-distribution-config --id E2W4JULEW8BXSD

# Check origin path in response
# Should show "/blue" or "/green" in Origins.Items[0].OriginPath

# Manual origin switch (emergency only)
npm run deploy:switch --env production --slot green --force
```

### S3 Issues

#### Sync Failures
```bash
# Check bucket permissions
aws s3api get-bucket-policy --bucket matbakhvcstack-webbucket12880f5b-svct6cxfbip5

# Test write access
aws s3 cp test.txt s3://matbakhvcstack-webbucket12880f5b-svct6cxfbip5/test.txt

# Check bucket versioning
aws s3api get-bucket-versioning --bucket matbakhvcstack-webbucket12880f5b-svct6cxfbip5
```

#### Missing Files
```bash
# List all files in slot
aws s3 ls s3://matbakhvcstack-webbucket12880f5b-svct6cxfbip5/green/ --recursive

# Check for essential files
aws s3 ls s3://matbakhvcstack-webbucket12880f5b-svct6cxfbip5/green/index.html
aws s3 ls s3://matbakhvcstack-webbucket12880f5b-svct6cxfbip5/green/assets/

# Re-sync if files are missing
npm run deploy:sync --env production --slot green --artifact artifacts/web-dist-abc123.zip
```

## Emergency Procedures

### Complete System Failure
1. **Immediate Rollback**: Execute emergency rollback
2. **Verify Rollback**: Confirm system is functional
3. **Incident Response**: Activate incident response team
4. **Communication**: Notify users and stakeholders
5. **Investigation**: Begin root cause analysis

### Partial Functionality Loss
1. **Assess Impact**: Determine affected features
2. **Quick Fix**: Apply hotfix if possible
3. **Rollback Decision**: Rollback if fix not feasible
4. **Monitor**: Watch for further issues
5. **Follow-up**: Plan proper fix for next deployment

### CloudFront Global Issues
1. **Check AWS Status**: Verify CloudFront service status
2. **Alternative CDN**: Consider temporary DNS switch if available
3. **Direct S3**: Emergency direct S3 access if needed
4. **Communication**: Inform users of service issues
5. **Recovery**: Follow AWS guidance for service restoration

## Monitoring and Alerting

### Key Metrics to Watch
- **Error Rate**: < 1% (alert if > 2%)
- **Response Time P95**: < 200ms (alert if > 300ms)
- **Response Time P99**: < 500ms (alert if > 750ms)
- **Availability**: > 99.9% (alert if < 99.5%)
- **Cache Hit Rate**: > 85% (alert if < 80%)

### Alert Channels
- **Slack**: `#deployments` channel for all deployment notifications
- **Email**: Critical alerts to on-call team
- **PagerDuty**: Production incidents and rollback triggers
- **GitHub**: PR comments with deployment status

### Dashboard URLs
- **CloudWatch**: Production metrics dashboard
- **Application**: Custom application metrics
- **CDN**: CloudFront performance metrics
- **Synthetic**: Uptime monitoring dashboard

## Post-Deployment Checklist

### Immediate (0-15 minutes)
- [ ] Verify deployment completed successfully
- [ ] Check all critical routes are accessible
- [ ] Monitor error rates and response times
- [ ] Verify CDN cache is working correctly

### Short-term (15 minutes - 2 hours)
- [ ] Monitor user feedback channels
- [ ] Check application logs for errors
- [ ] Verify all features are working as expected
- [ ] Monitor business metrics (if applicable)

### Long-term (2+ hours)
- [ ] Review deployment metrics and performance
- [ ] Update deployment documentation if needed
- [ ] Schedule post-deployment review if issues occurred
- [ ] Plan next deployment improvements

## Rollback Decision Matrix

| Issue Severity | User Impact | Response Time | Action |
|---------------|-------------|---------------|---------|
| Critical | High | Immediate | Emergency rollback |
| High | Medium | < 15 minutes | Assess and likely rollback |
| Medium | Low | < 30 minutes | Monitor and consider hotfix |
| Low | Minimal | < 1 hour | Monitor and plan fix |

## Contact Information

### On-Call Rotation
- **Primary**: DevOps Engineer
- **Secondary**: Senior Developer
- **Escalation**: Engineering Manager

### Emergency Contacts
- **Slack**: `#incidents` channel
- **Phone**: On-call rotation phone number
- **Email**: engineering-alerts@matbakh.app

### External Dependencies
- **AWS Support**: Enterprise support case
- **CDN Provider**: CloudFront support
- **Monitoring**: Third-party monitoring service

## Documentation Updates

This runbook should be updated after:
- Major deployment process changes
- New health gates or monitoring
- Infrastructure changes
- Incident learnings
- Tool updates or replacements

**Last Updated**: [Current Date]
**Next Review**: [Quarterly Review Date]