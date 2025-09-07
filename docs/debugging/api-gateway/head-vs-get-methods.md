# API Gateway: HEAD vs GET Methods Issue

**Date**: 2025-08-31  
**Issue**: API Gateway returning 403 MissingAuthenticationTokenException  
**Status**: ✅ RESOLVED

## Problem Description

When testing API Gateway endpoints with `curl -I` (HEAD request), receiving 403 errors instead of expected 302 redirects.

### Symptoms
```bash
curl -I "https://guf7ho7bze.execute-api.eu-central-1.amazonaws.com/prod/vc/confirm?t=TOKEN"
# Result: HTTP/2 403 MissingAuthenticationTokenException
```

## Root Cause

API Gateway `/vc/confirm` endpoint was configured with only GET method, but `curl -I` sends HEAD requests.

### API Gateway Configuration
```bash
# Check configured methods
aws apigateway get-resources --rest-api-id guf7ho7bze --region eu-central-1

# Result showed only GET and OPTIONS methods:
{
  "path": "/vc/confirm",
  "resourceMethods": {
    "GET": {},
    "OPTIONS": {}
  }
}
```

## Solution

### Option 1: Use GET requests for testing (Immediate fix)
```bash
# Correct testing commands
TOKEN="your-token-here"

# Get response with headers and body
curl -i "https://guf7ho7bze.execute-api.eu-central-1.amazonaws.com/prod/vc/confirm?t=$TOKEN"

# Get only headers (but using GET, not HEAD)
curl -s -o /dev/null -D - "https://guf7ho7bze.execute-api.eu-central-1.amazonaws.com/prod/vc/confirm?t=$TOKEN"

# Follow redirects to see final destination
curl -I -L "https://guf7ho7bze.execute-api.eu-central-1.amazonaws.com/prod/vc/confirm?t=$TOKEN"
```

### Option 2: Add HEAD method support (Optional hardening)
```bash
# 1) Add HEAD method
aws apigateway put-method \
  --rest-api-id guf7ho7bze \
  --resource-id hcbk98 \
  --http-method HEAD \
  --authorization-type NONE \
  --region eu-central-1

# 2) Add Lambda integration for HEAD
aws apigateway put-integration \
  --rest-api-id guf7ho7bze \
  --resource-id hcbk98 \
  --http-method HEAD \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri "arn:aws:apigateway:eu-central-1:lambda:path/2015-03-31/functions/arn:aws:lambda:eu-central-1:055062860590:function:MatbakhVcStack-VcConfirmFnBC142FAD-E7kmx3KDgRRX/invocations" \
  --region eu-central-1

# 3) Add Lambda permission for HEAD
aws lambda add-permission \
  --function-name "MatbakhVcStack-VcConfirmFnBC142FAD-E7kmx3KDgRRX" \
  --statement-id "AllowApiGwInvokeConfirmHEAD" \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:eu-central-1:055062860590:guf7ho7bze/prod/HEAD/vc/confirm" \
  --region eu-central-1

# 4) Deploy changes
aws apigateway create-deployment \
  --rest-api-id guf7ho7bze \
  --stage-name prod \
  --description "Enable HEAD for /vc/confirm" \
  --region eu-central-1
```

## Testing Results

### Before Fix
```bash
curl -I "https://guf7ho7bze.execute-api.eu-central-1.amazonaws.com/prod/vc/confirm?t=TOKEN"
# HTTP/2 403 MissingAuthenticationTokenException
```

### After Fix (Using GET)
```bash
curl -i "https://guf7ho7bze.execute-api.eu-central-1.amazonaws.com/prod/vc/confirm?t=TOKEN"
# HTTP/2 302
# location: https://matbakh.app/vc/result?t=TOKEN
```

## Key Learnings

1. **curl -I sends HEAD requests**, not GET requests
2. **API Gateway method matching is strict** - HEAD ≠ GET
3. **MissingAuthenticationTokenException** often means "no matching route/method"
4. **Always test with the actual HTTP method** your application will use

## Prevention

- Use `curl -i` (GET with headers) instead of `curl -I` (HEAD) for testing
- Consider adding HEAD method support for robustness against link checkers
- Document expected HTTP methods for each endpoint

## Related Files

- API Gateway: `guf7ho7bze` (PublicApi)
- Resource: `/vc/confirm` (resource-id: hcbk98)
- Lambda: `MatbakhVcStack-VcConfirmFnBC142FAD-E7kmx3KDgRRX`