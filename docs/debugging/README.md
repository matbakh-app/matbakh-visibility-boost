# Debugging & Problem Resolution Documentation

This directory contains detailed documentation of debugging processes, problem resolutions, and troubleshooting guides for the matbakh.app project.

## Structure

- `email-delivery/` - Email delivery issues and spam prevention
- `api-gateway/` - API Gateway configuration and routing issues
- `lambda-functions/` - Lambda function debugging and fixes
- `database/` - Database connection and query issues
- `authentication/` - Auth and permission problems
- `infrastructure/` - AWS infrastructure debugging

## Quick Reference

### Common Issues
1. **Email in Spam** → See `email-delivery/a3-2-hotfix-spam-issue.md`
2. **Email Integration** → See `email-delivery/resend-integration.md`
3. **API Gateway 403** → See `api-gateway/a3-2-head-vs-get-issue.md`
4. **Lambda Secrets Access** → See `lambda-functions/a3-2-secrets-manager-access.md`
5. **Lambda Permissions** → See `lambda-functions/iam-permissions.md`
6. **Database Connection** → See `database/vpc-connectivity.md`
7. **RDS Troubleshooting** → See `database/rds-connection-troubleshooting.md`
8. **VPC Lambda Issues** → See `infrastructure/vpc-lambda-integration.md`
9. **Cognito Auth Issues** → See `authentication/cognito-troubleshooting.md`
10. **Passwordless Auth (AWS)** → See `authentication/passwordless-auth-aws.md`

### Essential Debugging Commands
```bash
# Check Lambda logs
aws logs tail "/aws/lambda/FUNCTION-NAME" --follow --region eu-central-1

# Test API Gateway endpoints (use GET, not HEAD)
curl -i "https://guf7ho7bze.execute-api.eu-central-1.amazonaws.com/prod/vc/confirm?t=TOKEN"

# Check Resend email status
export RESEND_API_KEY=$(aws secretsmanager get-secret-value \
  --secret-id matbakh-email-config --region eu-central-1 \
  --query SecretString --output text | jq -r '.RESEND_API_KEY')
curl -H "Authorization: Bearer $RESEND_API_KEY" https://api.resend.com/emails/EMAIL-ID

# Check IAM permissions for secrets
aws iam get-role-policy --role-name "LAMBDA-ROLE-NAME" --policy-name "SecretsManagerAccess"

# Test RDS connection
aws rds describe-db-instances --db-instance-identifier matbakh-production

# Check Cognito user pool
aws cognito-idp describe-user-pool --user-pool-id us-east-1_POOL-ID

# Check VPC configuration
aws ec2 describe-vpcs --vpc-ids vpc-ID
aws ec2 describe-security-groups --group-ids sg-ID

# Test passwordless auth
curl -X POST https://guf7ho7bze.execute-api.eu-central-1.amazonaws.com/prod/auth/start \
  -H 'Content-Type: application/json' -d '{"email":"test@example.com","name":"Test"}'
```

## Contributing

When documenting new issues:
1. Create a new file in the appropriate subdirectory
2. Include problem description, root cause, and solution
3. Add relevant commands and code snippets
4. Update this README with quick reference links