# 🚨 SUPABASE/VERCEL CLEANUP & AWS MIGRATION - Complete Task List

**Datum**: 11. Januar 2025  
**Priorität**: 🔴 KRITISCH  
**Status**: 🟠 IN PROGRESS  
**Ziel**: Komplette Entfernung aller Supabase/Vercel Referenzen + AWS Migration  

## 🎯 MISSION STATEMENT
**"Supabase ist tot. Vercel ist tot. Alles läuft über AWS."**

Nach der Backend-Migration (Task 12.3.2) müssen alle Frontend-Referenzen zu Supabase/Vercel entfernt und durch AWS-Services ersetzt werden.

---

## 📋 TASK BREAKDOWN

### **PHASE 1: AUTHENTICATION LAYER** ✅ COMPLETED

#### Task 1.1: AuthContext Migration ✅ DONE
- ✅ `src/contexts/AuthContext.tsx` → AWS Cognito basiert
- ✅ Supabase Session/User Types → AWS User Interface
- ✅ OAuth URLs → AWS Cognito Domain
- ✅ Backup erstellt: `src/contexts/AuthContext.tsx.backup`

#### Task 1.2: Auth Guards Cleanup ✅ DONE  
- ✅ `src/guards/onboardingGuard.ts` → Supabase-Referenzen entfernt
- ✅ Temporärer Fallback implementiert
- 🔄 TODO: AWS Cognito User Role Check implementieren

---

### **PHASE 2: SERVICE LAYER** ❌ PENDING

#### Task 2.1: ProfileService Migration ❌ CRITICAL
**File**: `src/services/ProfileService.ts`
**Current**: Supabase-Client basiert
**Target**: AWS RDS Connection
```typescript
// REMOVE:
import { supabase } from '@/integrations/supabase/client';

// REPLACE WITH:
import { rdsClient } from '@/services/aws-rds-client';
```

#### Task 2.2: Score History Service Migration ❌ CRITICAL
**File**: `src/services/score-history.ts`  
**Current**: 22 Supabase-Referenzen
**Target**: AWS RDS Queries
```typescript
// REMOVE ALL:
const { data, error } = await supabase.from('score_history').select('*');

// REPLACE WITH:
const data = await rdsClient.query('SELECT * FROM score_history WHERE ...');
```

#### Task 2.3: Benchmark Comparison Migration ❌ CRITICAL
**File**: `src/services/benchmark-comparison.ts`
**Current**: Supabase-Constructor + Queries
**Target**: AWS RDS Service
```typescript
// REMOVE:
constructor(supabaseClient: any)
await this.supabase.from('score_benchmarks').select('*');

// REPLACE WITH:
constructor(rdsClient: any)
await this.rdsClient.query('SELECT * FROM score_benchmarks WHERE ...');
```

---

### **PHASE 3: ENVIRONMENT VARIABLES** ❌ PENDING

#### Task 3.1: Remove Supabase Environment Variables ❌ CRITICAL
**File**: `.env`
```bash
# REMOVE THESE COMPLETELY:
- VITE_SUPABASE_ANON_KEY
- VITE_SUPABASE_FUNCTIONS_URL  
- VITE_SUPABASE_PROJECT_ID
- VITE_SUPABASE_PUBLISHABLE_KEY
- VITE_SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- SUPABASE_DB_PASSWORD
```

#### Task 3.2: Add Missing AWS Environment Variables ❌ PENDING
**File**: `.env`
```bash
# ADD/COMPLETE THESE:
+ VITE_COGNITO_USER_POOL_CLIENT_ID=<actual-client-id>
+ VITE_AWS_RDS_ENDPOINT=matbakh-db.chq6q4cs0evx.eu-central-1.rds.amazonaws.com
+ VITE_AWS_API_GATEWAY_URL=https://guf7ho7bze.execute-api.eu-central-1.amazonaws.com/prod
```

---

### **PHASE 4: TEST LAYER** ❌ PENDING

#### Task 4.1: Test Mocks Migration ❌ PENDING
**File**: `src/services/__tests__/benchmark-comparison.test.ts`
**Current**: Mock Supabase Client
**Target**: Mock AWS RDS Client
```typescript
// REMOVE:
const mockSupabase = { from: jest.fn(() => ({ ... })) };

// REPLACE WITH:
const mockRdsClient = { query: jest.fn(() => Promise.resolve([])) };
```

#### Task 4.2: Score History Tests Migration ❌ PENDING
**File**: `src/services/__tests__/score-history.test.ts`
**Current**: Supabase Query Mocks
**Target**: AWS RDS Query Mocks

---

### **PHASE 5: INFRASTRUCTURE CLEANUP** ❌ PENDING

#### Task 5.1: Remove Supabase Migrations ❌ PENDING
**Directory**: `supabase/migrations/`
**Action**: Archive or delete (already migrated to AWS RDS)

#### Task 5.2: Remove Supabase Configuration ❌ PENDING
**File**: `supabase/config.toml`
**Action**: Archive or delete

#### Task 5.3: Find and Remove Vercel References ❌ PENDING
**Command**: `grep -r "vercel" src/`
**Action**: Replace all Vercel references with AWS equivalents

---

### **PHASE 6: DEPENDENCY CLEANUP** ❌ PENDING

#### Task 6.1: Remove Supabase Dependencies ❌ PENDING
**File**: `package.json`
```bash
# REMOVE:
- @supabase/supabase-js
- Any other @supabase/* packages
```

#### Task 6.2: Add AWS Dependencies ❌ PENDING
**File**: `package.json`
```bash
# ENSURE THESE ARE PRESENT:
+ aws-amplify (for Cognito)
+ @aws-sdk/client-rds-data (for RDS)
+ @aws-sdk/client-cognito-identity-provider
```

---

### **PHASE 7: INTEGRATION LAYER** ❌ PENDING

#### Task 7.1: Create AWS RDS Client ❌ PENDING
**File**: `src/services/aws-rds-client.ts` (NEW)
**Purpose**: Centralized AWS RDS connection for all services

#### Task 7.2: Create AWS Cognito Helper ❌ PENDING
**File**: `src/services/aws-cognito-helper.ts` (NEW)  
**Purpose**: User role management, profile queries

#### Task 7.3: Update AppProviders ❌ PENDING
**File**: `src/contexts/AppProviders.tsx`
**Action**: Ensure only AWS-based providers are used

---

## 🔍 DETECTION COMMANDS

### Find All Supabase References
```bash
# Search for Supabase imports
grep -r "@/integrations/supabase" src/
grep -r "supabase" src/ --include="*.ts" --include="*.tsx"

# Search for Supabase in environment
grep -r "SUPABASE" .env*
grep -r "VITE_SUPABASE" .env*
```

### Find All Vercel References  
```bash
# Search for Vercel references
grep -r "vercel" src/
grep -r "VERCEL" .env*
grep -r "vercel" package.json
```

### Validate AWS Migration
```bash
# Ensure AWS references are present
grep -r "aws-amplify" src/
grep -r "COGNITO" .env
grep -r "AWS_" .env
```

---

## ✅ SUCCESS CRITERIA

### Phase Completion Criteria
- [ ] **Phase 1**: No Auth-related Supabase imports
- [ ] **Phase 2**: All services use AWS RDS  
- [ ] **Phase 3**: No SUPABASE_* environment variables
- [ ] **Phase 4**: All tests use AWS mocks
- [ ] **Phase 5**: No supabase/ directory references
- [ ] **Phase 6**: No @supabase/* in package.json
- [ ] **Phase 7**: All integrations AWS-based

### Final Validation
```bash
# These commands should return ZERO results:
grep -r "supabase" src/ --include="*.ts" --include="*.tsx" | wc -l  # = 0
grep -r "SUPABASE" .env | wc -l  # = 0
grep -r "vercel" src/ --include="*.ts" --include="*.tsx" | wc -l  # = 0

# These commands should return POSITIVE results:
grep -r "aws-amplify" src/ | wc -l  # > 0
grep -r "COGNITO" .env | wc -l  # > 0
grep -r "RDS" .env | wc -l  # > 0
```

---

## 🚨 RISK MITIGATION

### Before Starting Each Phase
1. **Create Backup**: `git commit -m "Backup before Phase X"`
2. **Document Current State**: Screenshot/log current functionality
3. **Test Current Functionality**: Ensure auth/services work before changes

### During Migration
1. **One Service at a Time**: Don't migrate multiple services simultaneously
2. **Test After Each Change**: Verify functionality after each file change
3. **Rollback Plan**: Keep backup branches for quick rollback

### After Each Phase
1. **Integration Test**: Full auth + service flow test
2. **Performance Check**: Ensure no performance degradation
3. **Error Monitoring**: Check for new errors in console/logs

---

## 📊 PROGRESS TRACKING

### Phase Status
- ✅ **Phase 1**: Authentication Layer (COMPLETED)
- ❌ **Phase 2**: Service Layer (PENDING - CRITICAL)
- ❌ **Phase 3**: Environment Variables (PENDING - CRITICAL)  
- ❌ **Phase 4**: Test Layer (PENDING)
- ❌ **Phase 5**: Infrastructure Cleanup (PENDING)
- ❌ **Phase 6**: Dependency Cleanup (PENDING)
- ❌ **Phase 7**: Integration Layer (PENDING)

### Overall Progress: 14% Complete (1/7 Phases)

---

## 🎯 IMMEDIATE NEXT STEPS

### Today (Priority 1)
1. **Task 2.1**: Migrate ProfileService to AWS RDS
2. **Task 2.2**: Migrate Score History Service to AWS RDS  
3. **Task 3.1**: Remove all SUPABASE_* environment variables

### This Week (Priority 2)
1. **Task 7.1**: Create AWS RDS Client
2. **Task 2.3**: Migrate Benchmark Comparison Service
3. **Task 4.1-4.2**: Update all test mocks

### Next Week (Priority 3)
1. **Phase 5-6**: Infrastructure and dependency cleanup
2. **Final validation**: Ensure zero Supabase/Vercel references
3. **Performance testing**: Validate AWS-only architecture

---

**⚠️ CRITICAL**: Phases 2 and 3 are **BLOCKING** for production stability. All Supabase service calls will fail in production until migrated to AWS RDS.

**Status**: 🔴 **URGENT MIGRATION REQUIRED**