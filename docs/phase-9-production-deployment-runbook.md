# Phase 9 - Production Deployment Runbook

**Status**: ✅ **VALIDATED & READY FOR EXECUTION**  
**Date**: 2025-01-31  
**Phase**: Production Cutover & Deployment  
**Duration**: 2-4 hours  

## 🎯 **Deployment Overview**

Complete production cutover from Supabase to AWS S3 file storage and full Cognito authentication. This runbook provides step-by-step execution with rollback capabilities at every stage.

## 📋 **Pre-Deployment Checklist**

### **✅ Security Validation Complete**
- [x] Private S3 bucket protection verified (403 on direct access)
- [x] Access control separation confirmed
- [x] Legacy Supabase auth properly disabled
- [x] Frontend accessibility validated
- [x] Critical security controls tested and working

### **Environment Requirements**
- [ ] `DATABASE_URL` set and accessible
- [ ] `AWS_REGION=eu-central-1` configured
- [ ] AWS CLI configured with deployment permissions
- [ ] Node.js and npm available
- [ ] PostgreSQL client (psql) available

### **Optional Environment Variables**
- [ ] `EMAIL_ALERT` - for monitoring notifications
- [ ] `S3_BUCKET_WEBAPP` - for S3 frontend deployment
- [ ] `CLOUDFRONT_DISTRIBUTION_ID` - for cache invalidation
- [ ] `DEPLOYMENT_URL` - for post-deployment validation
- [ ] `AUTH_TOKEN` - for comprehensive API testing

### **Team Readiness**
- [ ] Deployment team on standby
- [ ] Escalation contacts available
- [ ] Communication channels open
- [ ] Change freeze activated

## 🚀 **Deployment Execution**

### **Master Deployment Command**
```bash
# Complete automated deployment
npm run deploy:production

# Or manual execution
./scripts/phase9-master-deploy.sh
```

### **Individual Phase Commands**
```bash
# Phase 9.0 - Pre-flight & Backup
npm run deploy:preflight

# Phase 9.1 - Infrastructure Deployment  
npm run deploy:infra

# Phase 9.2 - Feature Flags Cutover
npm run deploy:flags

# Phase 9.3 - Frontend Deployment
npm run deploy:frontend

# Phase 9.4 - Production Smoke Tests
npm run deploy:smoke-tests

# Phase 9.5 - Monitoring Setup
npm run deploy:monitoring
```

## 📊 **Deployment Phases**

### **Phase 9.0 - Pre-flight Backup (15 minutes)**
**Purpose**: Create backups and activate change freeze

**Actions**:
- ✅ Activate change freeze notice
- ✅ Create RDS snapshot
- ✅ Export current feature flags
- ✅ Archive frontend build
- ✅ Backup environment configuration

**Go/No-Go Criteria**:
- RDS snapshot created successfully
- Feature flags exported
- All prerequisites validated

### **Phase 9.1 - Infrastructure Deploy (30 minutes)**
**Purpose**: Deploy AWS infrastructure components

**Actions**:
- ✅ Deploy S3 buckets via CDK
- ✅ Deploy Lambda functions (presigned-url, upload-processor)
- ✅ Validate CloudFront distribution
- ✅ Test security controls (403 on direct S3 access)
- ✅ Verify CORS configuration

**Go/No-Go Criteria**:
- All S3 buckets accessible
- Lambda functions deployed and responding
- CloudFront distribution active
- Security controls verified

### **Phase 9.2 - Feature Flags Cutover (10 minutes)**
**Purpose**: Flip feature flags for S3 and Cognito

**Actions**:
- ✅ Enable `useS3Uploads=true`
- ✅ Enable `showCloudFrontReportUrls=true`
- ✅ Enable `ENABLE_COGNITO=true`
- ✅ Disable `DUAL_AUTH_MODE=false` (CRITICAL)

**Go/No-Go Criteria**:
- All feature flags set correctly
- Database connection stable
- Backup created before changes

**⚠️ CRITICAL**: After this phase, Supabase auth fallback is disabled!

### **Phase 9.3 - Frontend Deploy (20 minutes)**
**Purpose**: Deploy frontend with new configuration

**Environment Variables**:
```bash
VITE_PUBLIC_API_BASE="https://api.matbakh.app"
VITE_CLOUDFRONT_URL="https://dtkzvn1fvvkgu.cloudfront.net"
VITE_USE_S3_UPLOADS="true"
ENABLE_COGNITO="true"
DUAL_AUTH_MODE="false"
```

**Actions**:
- ✅ Build production bundle with new config
- ✅ Deploy to production (S3/Vercel/manual)
- ✅ Invalidate CDN cache
- ✅ Verify deployment accessibility

**Go/No-Go Criteria**:
- Build completes successfully
- Deployment accessible
- New configuration detected in app

### **Phase 9.4 - Smoke Tests (30 minutes)**
**Purpose**: Validate production cutover

**Test Categories**:
- ✅ Authentication (Cognito only, Supabase disabled)
- ✅ S3 uploads (presigned URLs, multipart, validation)
- ✅ File access & security (CORS, 403 on direct S3)
- ✅ Database integration (feature flags, user_uploads)
- ✅ Frontend application (loads, new config)
- ✅ Performance (API response time, CloudFront cache)

**Go/No-Go Criteria**:
- Success rate ≥95%
- All critical tests pass
- No authentication failures
- File uploads working

### **Phase 9.5 - Monitoring Setup (20 minutes)**
**Purpose**: Configure production monitoring

**Actions**:
- ✅ Create SNS topic for alerts
- ✅ Configure CloudWatch alarms (Lambda, API Gateway, CloudFront)
- ✅ Set up production dashboard
- ✅ Deploy synthetic canary (optional)

**Monitoring Thresholds**:
- Lambda errors > 0 (immediate alert)
- API Gateway 5XX > 1% (immediate alert)
- CloudFront cache hit rate < 70% (warning)
- Lambda duration > 25s (warning)

## 🚨 **Emergency Rollback**

### **Rollback Command**
```bash
# Emergency rollback
npm run deploy:rollback

# Or manual execution
./scripts/phase9-rollback.sh
```

### **Rollback Actions**
1. **Database**: Restore feature flags from backup
2. **Feature Flags**: Re-enable `DUAL_AUTH_MODE=true`
3. **S3 Uploads**: Disable `useS3Uploads=false`
4. **Frontend**: Redeploy with rollback configuration

### **Rollback Criteria**
- Critical smoke test failures
- Authentication system failure
- High error rates (>5%)
- User-impacting issues

## 📈 **Success Criteria**

### **Technical Metrics**
- ✅ All smoke tests pass (≥95% success rate)
- ✅ API response time <5 seconds
- ✅ CloudFront cache hit rate >70%
- ✅ Zero critical errors in first hour
- ✅ Authentication success rate >99%

### **Business Metrics**
- ✅ User workflows functioning normally
- ✅ File uploads working across all user types
- ✅ Reports accessible via CloudFront
- ✅ No user complaints or support tickets

### **Operational Metrics**
- ✅ Monitoring alerts configured
- ✅ Dashboard showing healthy metrics
- ✅ Log aggregation working
- ✅ Incident response procedures ready

## 🔧 **Post-Deployment Actions**

### **Immediate (0-4 hours)**
- [ ] Monitor system performance continuously
- [ ] Verify user authentication flows
- [ ] Test file upload workflows
- [ ] Check monitoring dashboards
- [ ] Respond to any alerts immediately

### **Short-term (24-48 hours)**
- [ ] Analyze performance metrics
- [ ] Gather user feedback
- [ ] Fine-tune monitoring thresholds
- [ ] Document any issues and resolutions
- [ ] Plan Supabase decommissioning

### **Medium-term (1-2 weeks)**
- [ ] Performance optimization based on metrics
- [ ] User experience improvements
- [ ] Cost analysis and optimization
- [ ] Security audit and validation

## 📞 **Emergency Contacts**

### **Escalation Chain**
1. **Primary**: Deployment team lead
2. **Secondary**: Technical architect
3. **Escalation**: CTO/Engineering manager

### **Communication Channels**
- **Slack**: #production-deployment
- **Email**: production-alerts@matbakh.app
- **Phone**: Emergency contact list

## 📚 **Reference Documentation**

### **Technical Documentation**
- [S3 Infrastructure Guide](./s3-infrastructure-completion-report.md)
- [Hooks API Documentation](./hooks-api-documentation.md)
- [Phase 8 Test Results](./phase-8-completion-report.md)

### **Operational Procedures**
- [Monitoring Setup](./monitoring-setup-guide.md)
- [Incident Response](./incident-response-procedures.md)
- [Rollback Procedures](./rollback-procedures.md)

## 🎯 **Deployment Commands Summary**

```bash
# Complete deployment (recommended)
npm run deploy:production

# Individual phases
npm run deploy:preflight      # Phase 9.0
npm run deploy:infra         # Phase 9.1  
npm run deploy:flags         # Phase 9.2
npm run deploy:frontend      # Phase 9.3
npm run deploy:smoke-tests   # Phase 9.4
npm run deploy:monitoring    # Phase 9.5

# Emergency procedures
npm run deploy:rollback      # Emergency rollback

# Resume deployment from specific phase
./scripts/phase9-master-deploy.sh --resume-from "Phase 9.3"
```

## ✅ **Final Checklist**

Before starting deployment:
- [ ] All team members notified
- [ ] Change freeze activated
- [ ] Environment variables set
- [ ] AWS credentials configured
- [ ] Database accessible
- [ ] Rollback procedures understood
- [ ] Emergency contacts available
- [ ] Go/No-Go decision confirmed

---

**🚀 Ready for Phase 9 Production Deployment!**

**Estimated Duration**: 2-4 hours  
**Risk Level**: Medium (comprehensive rollback available)  
**Business Impact**: Minimal (fallback systems in place during rollback window)