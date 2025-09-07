# API Gateway: HEAD vs GET Method Issue (A3.2)

## Problem
`curl -I` requests to `/vc/confirm` endpoint returned 403 `MissingAuthenticationTokenException`

## Root Cause
- API Gateway only had GET method configured for `/vc/confirm`
- `curl -I` sends HEAD request, not GET
- HEAD request → no matching method → 403 error

## Solution
1. **Immediate Fix**: Use correct testing method
   ```bash
   # Wrong (HEAD request)
   curl -I "https://guf7ho7bze.execute-api.eu-central-1.amazonaws.com/prod/vc/confirm?t=TOKEN"
   
   # Correct (GET request)
   curl -i "https://guf7ho7bze.execute-api.eu-central-1.amazonaws.com/prod/vc/confirm?t=TOKEN"
   ```

2. **Optional Hardening**: Add HEAD method support
   ```bash
   aws apigateway put-method \
     --rest-api-id guf7ho7bze \
     --resource-id hcbk98 \
     --http-method HEAD \
     --authorization-type NONE \
     --region eu-central-1
   ```

## Key Learning
Always test API endpoints with the configured HTTP method. Check method configuration before assuming authentication issues.

## Related Files
- `vc-confirm-production.js` - Lambda function handling the endpoint
- API Gateway resource ID: `hcbk98` for `/vc/confirm`