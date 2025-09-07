# Lambda Functions: Secrets Manager Access Issue (A3.2)

## Problem
VcConfirmFn was using hardcoded URLs instead of dynamic configuration from Secrets Manager

## Root Cause
- VcConfirmFn IAM role only had access to `matbakh-db-postgres` secret
- No access to `matbakh-email-config` secret
- Function fell back to hardcoded URLs

## Solution
1. **Update IAM Policy**:
   ```bash
   aws iam put-role-policy \
     --role-name "MatbakhVcStack-VcConfirmFnServiceRole31653353-QPJjXPkK9AYz" \
     --policy-name "SecretsManagerAccess" \
     --policy-document '{
       "Version": "2012-10-17",
       "Statement": [{
         "Effect": "Allow",
         "Action": ["secretsmanager:GetSecretValue"],
         "Resource": [
           "arn:aws:secretsmanager:eu-central-1:055062860590:secret:matbakh-db-postgres*",
           "arn:aws:secretsmanager:eu-central-1:055062860590:secret:matbakh-email-config*"
         ]
       }]
     }'
   ```

2. **Update Lambda Code**:
   ```javascript
   // Before: Hardcoded
   'Location': 'https://matbakh.app/vc/result?e=invalid'
   
   // After: Dynamic from Secrets
   const resultUrl = await getResultPageUrl();
   'Location': `${resultUrl}?e=invalid`
   ```

## Key Learning
When adding new secrets, ensure all Lambda functions that need access have updated IAM policies.

## Testing
```bash
# Verify secret access
aws iam get-role-policy \
  --role-name "LAMBDA-ROLE-NAME" \
  --policy-name "SecretsManagerAccess"
```

## Related Files
- `vc-confirm-production.js` - Updated to use Secrets Manager
- Secret: `matbakh-email-config` - Contains RESULT_PAGE_URL configuration