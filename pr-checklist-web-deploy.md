# PR Checklist: Web Deploy VITE Vars (VC Quick AWS)

## 🎯 Objective
Configure web deploy workflow to use GitHub repository variables for VC API configuration, ensuring AWS endpoint is used in production.

## ✅ Changes Made

### 1. GitHub Workflow Updates
- ✅ Added `VITE_PUBLIC_API_BASE` and `VITE_VC_API_PROVIDER` to build environment
- ✅ Updated job to inject variables during build process
- ✅ Maintained existing AWS credentials and S3/CloudFront deployment

### 2. Frontend Configuration
- ✅ Updated `src/lib/vcApi.ts` to support provider configuration
- ✅ Added debug logging for API configuration
- ✅ Set AWS as default provider (`VITE_VC_API_PROVIDER=aws`)
- ✅ Updated `.env.example` with new variables

### 3. Repository Variables Required
Set these in GitHub repository settings (Settings > Secrets and variables > Actions > Variables):

```
VITE_PUBLIC_API_BASE=https://guf7ho7bze.execute-api.eu-central-1.amazonaws.com/prod
VITE_VC_API_PROVIDER=aws
```

## 🧪 Testing Checklist

### Pre-Merge Testing
- [ ] Local build works with new environment variables
- [ ] No TypeScript errors in vcApi.ts
- [ ] Console shows correct API configuration

### Post-Deploy Testing (Production)
- [ ] **Network**: POST https://guf7ho7bze.execute-api.eu-central-1.amazonaws.com/prod/vc/start returns 200
- [ ] **E-Mail**: DOI email arrives in inbox (check spam folder)
- [ ] **Success Flow**: Click email link → /vc/result?t=... renders success state
- [ ] **Error States**: 
  - [ ] /vc/result?e=expired renders expired state
  - [ ] /vc/result?e=invalid renders invalid state

### CORS Configuration Check
- [ ] API Gateway allows https://matbakh.app origin
- [ ] API Gateway allows https://www.matbakh.app origin
- [ ] No CORS errors in browser console

## 🚨 Rollback Plan
If deployment fails:
1. Revert to previous commit
2. Redeploy via GitHub Actions
3. Check CloudFront invalidation completed

## 📋 Post-Deploy Actions
1. Monitor CloudWatch logs for any errors
2. Test VC flow end-to-end
3. Update documentation if needed

## 🔗 Related Commits
- `052fde5` - ci: web deploy uses VITE vars (VC Quick AWS)

---

**Branch**: `ci/web-deploy-vite-vars`  
**Target**: `main`  
**Reviewer**: @matbakh-team