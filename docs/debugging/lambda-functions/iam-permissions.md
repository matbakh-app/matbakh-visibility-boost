# Lambda Functions: IAM Permissions Issues

**Date**: 2025-08-31  
**Issue**: Lambda functions unable to access Secrets Manager  
**Status**: ✅ RESOLVED

## Problem Description

Lambda functions were failing to access the new `matbakh-email-config` secret, causing email functionality to fail.

### Symptoms
- VcStartFn: Email sending failed with "Resend API key not configured"
- VcConfirmFn: Using hardcoded URLs instead of secrets
- CloudWatch logs showing secrets access errors

## Root Cause Analysis

### 1. VcStartFn IAM Role
**Role**: `MatbakhVcStack-VcStartFnServiceRoleD81E4A8A-vJkePnobNf07`

**Issue**: SecretsManagerAccess policy only included database secret
```json
{
  "Resource": [
    "arn:aws:secretsmanager:eu-central-1:055062860590:secret:matbakh-db-postgres*"
  ]
}
```

### 2. VcConfirmFn IAM Role  
**Role**: `MatbakhVcStack-VcConfirmFnServiceRole31653353-QPJjXPkK9AYz`

**Issue**: Same problem - missing email-config secret access

## Solution Applied

### 1. Updated VcStartFn Permissions
```bash
aws iam put-role-policy \
  --role-name "MatbakhVcStack-VcStartFnServiceRoleD81E4A8A-vJkePnobNf07" \
  --policy-name "SecretsManagerAccess" \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "SecretsAccess",
            "Effect": "Allow",
            "Action": ["secretsmanager:GetSecretValue"],
            "Resource": [
                "arn:aws:secretsmanager:eu-central-1:055062860590:secret:matbakh-db-postgres*",
                "arn:aws:secretsmanager:eu-central-1:055062860590:secret:matbakh-email-config*"
            ]
        }
    ]
}'
```

### 2. Updated VcConfirmFn Permissions
```bash
aws iam put-role-policy \
  --role-name "MatbakhVcStack-VcConfirmFnServiceRole31653353-QPJjXPkK9AYz" \
  --policy-name "SecretsManagerAccess" \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "SecretsAccess", 
            "Effect": "Allow",
            "Action": ["secretsmanager:GetSecretValue"],
            "Resource": [
                "arn:aws:secretsmanager:eu-central-1:055062860590:secret:matbakh-db-postgres*",
                "arn:aws:secretsmanager:eu-central-1:055062860590:secret:matbakh-email-config*"
            ]
        }
    ]
}'
```

## Verification Commands

### Check Current IAM Policies
```bash
# List policies for a role
aws iam list-role-policies --role-name "ROLE-NAME" --region eu-central-1

# Get specific policy content
aws iam get-role-policy \
  --role-name "ROLE-NAME" \
  --policy-name "SecretsManagerAccess" \
  --region eu-central-1
```

### Test Secret Access
```bash
# Test secret access directly
aws secretsmanager get-secret-value \
  --secret-id "matbakh-email-config" \
  --region eu-central-1 \
  --query SecretString --output text | jq
```

### Monitor Lambda Logs
```bash
# Watch for permission errors
aws logs tail "/aws/lambda/FUNCTION-NAME" --follow --region eu-central-1
```

## Testing Results

### Before Fix
```
ERROR: Error sending confirmation email: Error: Resend API key not configured
```

### After Fix
```
INFO: Resend email sent successfully: 9b4ce438-d5b2-458f-843a-08b74cf8d8cb
INFO: Confirmation email sent successfully
```

## Common IAM Permission Patterns

### Secrets Manager Access
```json
{
  "Effect": "Allow",
  "Action": ["secretsmanager:GetSecretValue"],
  "Resource": [
    "arn:aws:secretsmanager:REGION:ACCOUNT:secret:SECRET-NAME*"
  ]
}
```

### CloudWatch Logs (Usually auto-included)
```json
{
  "Effect": "Allow", 
  "Action": [
    "logs:CreateLogGroup",
    "logs:CreateLogStream", 
    "logs:PutLogEvents"
  ],
  "Resource": "*"
}
```

### VPC Network Interface (For VPC Lambdas)
```json
{
  "Effect": "Allow",
  "Action": [
    "ec2:CreateNetworkInterface",
    "ec2:DescribeNetworkInterfaces", 
    "ec2:DeleteNetworkInterface",
    "ec2:AttachNetworkInterface",
    "ec2:DetachNetworkInterface"
  ],
  "Resource": "*"
}
```

## Prevention Checklist

- [ ] **New secrets**: Always update Lambda IAM roles when adding new secrets
- [ ] **Wildcard resources**: Use `secret-name*` to handle version suffixes
- [ ] **Test permissions**: Verify access before deploying Lambda code changes
- [ ] **Monitor logs**: Watch for permission denied errors in CloudWatch
- [ ] **Principle of least privilege**: Only grant necessary permissions

## Related Issues

- **Database connectivity**: Requires VPC permissions + security groups
- **API Gateway integration**: Requires Lambda invoke permissions
- **Cross-account access**: Requires resource-based policies

## Files Modified

- IAM Role: `MatbakhVcStack-VcStartFnServiceRoleD81E4A8A-vJkePnobNf07`
- IAM Role: `MatbakhVcStack-VcConfirmFnServiceRole31653353-QPJjXPkK9AYz`
- Policy: `SecretsManagerAccess` (updated for both roles)
- Secret: `matbakh-email-config` (access granted)