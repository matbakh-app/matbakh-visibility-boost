# Multi-Region Infrastructure - Quick Reference

**Version**: 1.0  
**Date**: 2025-09-22  
**Status**: Production Ready  

## 🚨 Emergency Procedures

### Immediate Failover
```bash
# Emergency failover to secondary region
npm run dr:failover -- --emergency

# Check failover status
npm run dr:status

# Validate secondary region health
npm run health:check --region eu-west-1
```

### Emergency Contacts
- **Primary**: System Architecture Team
- **Secondary**: DevOps Team  
- **Escalation**: CTO

## 🔧 Common Commands

### Health Monitoring
```bash
# Check overall system health
npm run health:check

# Check specific region
npm run health:check --region eu-central-1
npm run health:check --region eu-west-1

# Check replication lag
npm run health:replication-lag

# Generate health report
npm run health:report
```

### Disaster Recovery
```bash
# Manual failover
npm run dr:failover --reason "Planned maintenance"

# Failback to primary
npm run dr:failback

# DR test (non-disruptive)
npm run dr:test

# Check DR status
npm run dr:status
```

### Testing
```bash
# Run all multi-region tests
npm run test:mr

# Run specific test suites
npm run test:mr:health-checker
npm run test:mr:failover-manager
npm run test:mr:orchestrator

# Run with coverage
npm run test:mr:coverage
```

## 📊 Key Metrics

### SLA Targets
- **RTO**: ≤ 15 minutes
- **RPO**: ≤ 1 minute  
- **Availability**: ≥ 99.9%
- **Replication Lag**: < 5 minutes (warning)

### Health Check Endpoints
- **Primary**: `https://api.matbakh.app/health`
- **Secondary**: `https://api-eu-west-1.matbakh.app/health`

### Monitoring Dashboards
- **CloudWatch**: Multi-Region Overview
- **Custom**: DR Dashboard
- **Cost**: Regional Cost Breakdown

## 🌍 Regional Configuration

### Primary Region (eu-central-1)
- **Aurora Cluster**: `matbakh-primary-cluster`
- **S3 Bucket**: `matbakh-primary-bucket`
- **ElastiCache**: `matbakh-primary-cache`
- **Lambda Functions**: All production functions

### Secondary Region (eu-west-1)
- **Aurora Cluster**: `matbakh-secondary-cluster`
- **S3 Bucket**: `matbakh-secondary-bucket`
- **ElastiCache**: `matbakh-secondary-cache`
- **Lambda Functions**: Standby functions

## 🔄 Failover Process

### Automatic Failover Triggers
1. Health check failures (3 consecutive)
2. High error rate (>5% for 5 minutes)
3. Database unavailability
4. Network connectivity issues

### Manual Failover Steps
1. **Validate**: Check secondary region health
2. **Execute**: Run failover script
3. **Verify**: Confirm service availability
4. **Monitor**: Watch for issues
5. **Document**: Log incident details

### Failback Process
1. **Assess**: Verify primary region recovery
2. **Sync**: Ensure data consistency
3. **Switch**: Execute failback
4. **Validate**: Confirm normal operation
5. **Monitor**: Watch for stability

## 🛡️ Security Checklist

### Pre-Failover Security
- [ ] Verify KMS keys are accessible in target region
- [ ] Confirm secrets are replicated and accessible
- [ ] Check IAM roles and policies
- [ ] Validate network security groups

### Post-Failover Security
- [ ] Verify encryption is working
- [ ] Check access logs for anomalies
- [ ] Confirm audit logging is active
- [ ] Validate compliance requirements

## 💰 Cost Monitoring

### Budget Alerts
- **50%**: Warning notification
- **80%**: Escalation to team lead
- **100%**: Emergency cost review

### Cost Optimization
- [ ] Review reserved instance utilization
- [ ] Check S3 storage classes
- [ ] Optimize Lambda provisioned concurrency
- [ ] Monitor inter-region transfer costs

## 📋 Troubleshooting

### High Replication Lag
1. Check Aurora Global Database status
2. Monitor network connectivity
3. Review database load
4. Consider scaling read replicas

### Failover Issues
1. Check health check configuration
2. Verify DNS propagation
3. Review Route 53 settings
4. Validate application configuration

### Performance Issues
1. Check CloudFront cache hit rates
2. Monitor Lambda cold starts
3. Review database query performance
4. Validate auto-scaling policies

## 📞 Escalation Matrix

### Level 1: Automated Response
- Health check failures
- Automatic failover triggers
- Standard monitoring alerts

### Level 2: Team Response
- Manual failover required
- Performance degradation
- Cost budget exceeded

### Level 3: Management Escalation
- Extended outage (>30 minutes)
- Data consistency issues
- Security incidents

## 🔍 Log Locations

### CloudWatch Log Groups
- `/aws/lambda/health-checker`
- `/aws/lambda/failover-manager`
- `/aws/lambda/multi-region-orchestrator`
- `/aws/rds/cluster/matbakh-primary-cluster/error`

### Audit Logs
- CloudTrail: Multi-region API calls
- VPC Flow Logs: Network traffic
- Application Logs: Custom application events

## 📈 Performance Baselines

### Response Times
- **API Endpoints**: <200ms P95
- **Database Queries**: <50ms average
- **Cache Hits**: >90% hit rate
- **CDN Performance**: <100ms TTFB

### Availability Targets
- **API Availability**: 99.9%
- **Database Availability**: 99.95%
- **Cache Availability**: 99.5%
- **Overall System**: 99.9%

## 🔄 Maintenance Windows

### Scheduled Maintenance
- **Primary**: Sundays 02:00-04:00 UTC
- **Secondary**: Saturdays 02:00-04:00 UTC
- **Cross-Region**: Coordinated during low traffic

### Emergency Maintenance
- Immediate response for security issues
- Coordinated failover for critical updates
- Post-maintenance validation required

---

**Quick Reference Version**: 1.0  
**Last Updated**: 2025-09-22  
**Emergency Contact**: System Architecture Team  
**Documentation**: [Full Multi-Region Documentation](./multi-region-infrastructure-documentation.md)  