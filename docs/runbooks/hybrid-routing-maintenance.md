# Hybrid Routing - Maintenance Runbook

**Version**: 1.0.0  
**Last Updated**: 2025-01-14  
**Owner**: DevOps & AI Operations Team

## Scheduled Maintenance

### Weekly Maintenance Window

**Schedule**: Every Sunday 02:00-04:00 UTC  
**Duration**: 2 hours  
**Impact**: Minimal (fallback routing active)

#### Pre-Maintenance Checklist

- [ ] Notify stakeholders 48 hours in advance
- [ ] Verify backup systems operational
- [ ] Create maintenance window in PagerDuty
- [ ] Enable maintenance mode banner
- [ ] Take system snapshot/backup

#### Maintenance Tasks

1. **System Health Verification** (15 minutes)

   ```bash
   # Run comprehensive health check
   curl https://api.matbakh.app/health/detailed > health-pre-maintenance.json

   # Verify all components healthy
   jq '.components | to_entries[] | select(.value.status != "healthy")' health-pre-maintenance.json
   ```

2. **Log Rotation and Cleanup** (20 minutes)

   ```bash
   # Archive old logs
   aws logs create-export-task \
     --log-group-name "/aws/ecs/hybrid-routing" \
     --from $(date -d '7 days ago' +%s)000 \
     --to $(date -d '1 day ago' +%s)000 \
     --destination hybrid-routing-logs-archive \
     --destination-prefix logs/$(date +%Y/%m/%d)

   # Clean up old CloudWatch log streams
   aws logs delete-log-stream \
     --log-group-name "/aws/ecs/hybrid-routing" \
     --log-stream-name <old-stream-name>
   ```

3. **Metrics Review and Optimization** (30 minutes)

   - Review CloudWatch dashboard
   - Identify unused metrics
   - Optimize metric collection frequency
   - Update alert thresholds based on trends

4. **Security Updates** (30 minutes)

   ```bash
   # Update dependencies
   npm audit fix

   # Rebuild and deploy
   npm run build
   aws ecs update-service \
     --cluster hybrid-routing-cluster \
     --service hybrid-routing-service \
     --force-new-deployment
   ```

5. **Performance Optimization** (20 minutes)

   - Review slow queries
   - Optimize cache hit rates
   - Update routing decision thresholds
   - Clear stale cache entries

6. **Documentation Update** (15 minutes)
   - Update runbooks with new findings
   - Document any configuration changes
   - Update architecture diagrams if needed

#### Post-Maintenance Verification

```bash
# Run health check
curl https://api.matbakh.app/health/detailed > health-post-maintenance.json

# Compare with pre-maintenance
diff health-pre-maintenance.json health-post-maintenance.json

# Run smoke tests
npm run test:smoke

# Monitor for 30 minutes
watch -n 60 'curl -s https://api.matbakh.app/health | jq .status'
```

#### Rollback Procedure

If issues detected post-maintenance:

```bash
# Rollback to previous deployment
aws ecs update-service \
  --cluster hybrid-routing-cluster \
  --service hybrid-routing-service \
  --task-definition hybrid-routing:<previous-revision>

# Restore configuration
aws ssm put-parameter \
  --name "/hybrid-routing/config" \
  --value file://config-backup.json \
  --overwrite

# Verify rollback
curl https://api.matbakh.app/health/detailed
```
