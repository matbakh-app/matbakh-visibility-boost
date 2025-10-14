# 🚨 CRITICAL: Supabase/Vercel Cleanup & AWS Migration Tasks

**Status**: 🔴 URGENT - PRODUCTION BLOCKING  
**Priority**: P0 - Must complete before any new features  
**Reason**: Incomplete migration causing auth/service failures  

## 🎯 MISSION CRITICAL TASKS

### **PHASE 1: SERVICE LAYER MIGRATION** ❌ BLOCKING PRODUCTION

- [ ] **Task 1.1: ProfileService AWS Migration**
  - File: `src/services/ProfileService.ts`
  - Remove: `import { supabase } from '@/integrations/supabase/client'`
  - Replace: AWS RDS connection
  - Create: `src/services/aws-rds-client.ts`
  - Test: Profile CRUD operations work with AWS RDS
  - _Acceptance Criteria: Zero Supabase references, all profile operations functional_

- [ ] **Task 1.2: Score History Service AWS Migration**  
  - File: `src/services/score-history.ts`
  - Remove: 22 Supabase query references
  - Replace: AWS RDS queries for score_history table
  - Update: All query methods (insertScore, queryScoreHistory, updateScore, deleteScore)
  - Test: Score history operations work with AWS RDS
  - _Acceptance Criteria: All score operations use AWS RDS, no Supabase calls_

- [ ] **Task 1.3: Benchmark Comparison Service AWS Migration**
  - File: `src/services/benchmark-comparison.ts`  
  - Remove: Supabase constructor and queries
  - Replace: AWS RDS client for score_benchmarks table
  - Update: getBenchmark, getMultiRegionBenchmarks, updateBenchmark methods
  - Test: Benchmark comparisons work with AWS RDS
  - _Acceptance Criteria: All benchmark operations use AWS RDS_

### **PHASE 2: ENVIRONMENT CLEANUP** ❌ SECURITY RISK

- [ ] **Task 2.1: Remove Supabase Environment Variables**
  - File: `.env`
  - Remove: `VITE_SUPABASE_ANON_KEY`, `VITE_SUPABASE_FUNCTIONS_URL`, `VITE_SUPABASE_PROJECT_ID`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_PASSWORD`
  - Validate: No SUPABASE_* variables remain
  - _Acceptance Criteria: `grep -r "SUPABASE" .env` returns zero results_

- [ ] **Task 2.2: Complete AWS Environment Variables**
  - File: `.env`
  - Add: `VITE_COGNITO_USER_POOL_CLIENT_ID=<actual-client-id>`
  - Add: `VITE_AWS_RDS_ENDPOINT=matbakh-db.chq6q4cs0evx.eu-central-1.rds.amazonaws.com`
  - Validate: All AWS services have required environment variables
  - _Acceptance Criteria: All AWS services can connect using environment variables_

### **PHASE 3: TEST LAYER MIGRATION** ❌ BLOCKING CI/CD

- [ ] **Task 3.1: Benchmark Comparison Test Migration**
  - File: `src/services/__tests__/benchmark-comparison.test.ts`
  - Remove: `mockSupabase` client
  - Replace: `mockRdsClient` with AWS RDS query mocks
  - Update: All test assertions to match AWS RDS responses
  - Test: All benchmark tests pass with AWS mocks
  - _Acceptance Criteria: Tests pass, no Supabase mocks remain_

- [ ] **Task 3.2: Score History Test Migration**
  - File: `src/services/__tests__/score-history.test.ts`
  - Remove: Supabase query mocks
  - Replace: AWS RDS query mocks
  - Update: Test data structures to match AWS RDS responses
  - Test: All score history tests pass
  - _Acceptance Criteria: Tests pass with AWS RDS mocks only_

### **PHASE 4: DEPENDENCY CLEANUP** ❌ SECURITY & PERFORMANCE

- [ ] **Task 4.1: Remove Supabase Dependencies**
  - File: `package.json`
  - Remove: `@supabase/supabase-js` and related packages
  - Run: `npm uninstall @supabase/supabase-js`
  - Validate: No @supabase/* packages in package.json
  - _Acceptance Criteria: `grep -r "@supabase" package.json` returns zero results_

- [ ] **Task 4.2: Ensure AWS Dependencies**
  - File: `package.json`
  - Verify: `aws-amplify`, `@aws-sdk/client-rds-data`, `@aws-sdk/client-cognito-identity-provider`
  - Install missing: `npm install <missing-aws-packages>`
  - Test: All AWS services can be imported
  - _Acceptance Criteria: All required AWS packages present and functional_

### **PHASE 5: INFRASTRUCTURE CLEANUP** ❌ CLEANUP

- [ ] **Task 5.1: Archive Supabase Directory**
  - Directory: `supabase/`
  - Action: Move to `archive/supabase/` or delete (data already migrated)
  - Remove: `supabase/config.toml` references from build scripts
  - _Acceptance Criteria: No active supabase/ directory references_

- [ ] **Task 5.2: Find and Remove Vercel References**
  - Command: `grep -r "vercel" src/`
  - Replace: All Vercel references with AWS equivalents
  - Update: Any Vercel-specific configurations
  - _Acceptance Criteria: `grep -r "vercel" src/` returns zero results_

## 🔍 VALIDATION COMMANDS

### Pre-Migration Validation
```bash
# Count current Supabase references (should decrease to 0)
grep -r "supabase" src/ --include="*.ts" --include="*.tsx" | wc -l
grep -r "SUPABASE" .env | wc -l
grep -r "@supabase" package.json | wc -l
```

### Post-Migration Validation  
```bash
# These MUST return 0:
grep -r "supabase" src/ --include="*.ts" --include="*.tsx" | wc -l  # = 0
grep -r "SUPABASE" .env | wc -l  # = 0
grep -r "vercel" src/ --include="*.ts" --include="*.tsx" | wc -l  # = 0

# These MUST return > 0:
grep -r "aws-amplify" src/ | wc -l  # > 0
grep -r "COGNITO" .env | wc -l  # > 0
grep -r "RDS" .env | wc -l  # > 0
```

## ✅ SUCCESS CRITERIA

### Phase Completion Requirements
1. **Service Layer**: All services use AWS RDS, zero Supabase calls
2. **Environment**: No SUPABASE_* variables, all AWS variables present
3. **Tests**: All tests pass with AWS mocks only
4. **Dependencies**: No @supabase/* packages, all AWS packages present
5. **Infrastructure**: No active Supabase/Vercel references

### Final Acceptance Criteria
- [ ] Authentication works with AWS Cognito only
- [ ] All database operations use AWS RDS only  
- [ ] All tests pass with AWS mocks only
- [ ] Build succeeds without Supabase dependencies
- [ ] No console errors related to Supabase/Vercel
- [ ] Performance is maintained or improved

## 🚨 CRITICAL NOTES

### Why This Is Urgent
1. **Production Risk**: Supabase calls will fail in production
2. **Security Risk**: Exposed Supabase credentials in environment
3. **Performance Risk**: Unused dependencies increase bundle size
4. **Maintenance Risk**: Conflicting auth systems cause unpredictable behavior

### Migration Strategy
1. **No New Features**: Until migration complete
2. **One Phase at a Time**: Complete each phase before next
3. **Test After Each Task**: Ensure functionality maintained
4. **Rollback Plan**: Keep git commits for each task

---

**⚠️ BLOCKING**: These tasks MUST be completed before any new feature development. The current mixed Supabase/AWS state is unstable and will cause production failures.

**Next Action**: Start with Task 1.1 (ProfileService Migration) immediately.