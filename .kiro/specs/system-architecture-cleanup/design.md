# System Architecture Cleanup & Reintegration - Design

## Overview

Das Design implementiert eine 4-stufige Cleanup-Strategie mit maximaler Wirkung und minimalem Risiko. Jede Phase baut auf der vorherigen auf und kann bei Problemen einzeln zurückgerollt werden.

## Architecture

### Phase 1: Discovery & Analysis Engine
```
┌─────────────────────────────────────────────────────────────┐
│                    Architecture Scanner                      │
├─────────────────────────────────────────────────────────────┤
│ • File System Crawler (/api/, /routes/, /dashboard/, etc.) │
│ • Origin Detector (Lovable/Supabase/Kiro markers)          │
│ • Usage Analyzer (import/export tracking)                  │
│ • Test Coverage Mapper (existing coverage analysis)        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Architecture Map Generator                  │
├─────────────────────────────────────────────────────────────┤
│ • Component Classification Matrix                           │
│ • Dependency Graph Builder                                  │
│ • Risk Assessment Engine                                    │
│ • Cleanup Priority Calculator                               │
└─────────────────────────────────────────────────────────────┘
```

### Phase 2: Selective Test Validation
```
┌─────────────────────────────────────────────────────────────┐
│                    Test Selection Engine                     │
├─────────────────────────────────────────────────────────────┤
│ • Coverage Map Parser (source-test-coverage-map.json)      │
│ • Interface Validator (detect mismatches)                  │
│ • Kiro-Component Filter                                     │
│ • Safe Test Suite Generator                                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Targeted Test Executor                    │
├─────────────────────────────────────────────────────────────┤
│ • Pre-validated Test Runner                                 │
│ • Real-time Result Analysis                                 │
│ • Failure Classification (expected vs unexpected)          │
│ • Safe Test Report Generator                                │
└─────────────────────────────────────────────────────────────┘
```

### Phase 3: Legacy Cleanup Engine
```
┌─────────────────────────────────────────────────────────────┐
│                    Legacy Component Detector                 │
├─────────────────────────────────────────────────────────────┤
│ • Supabase/Lovable Marker Scanner                          │
│ • Backend Dependency Checker                               │
│ • Route Usage Analyzer                                     │
│ • Safe-to-Delete Classifier                                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Controlled Deletion System                │
├─────────────────────────────────────────────────────────────┤
│ • Backup Creator (src/deprecated/)                         │
│ • Dependency Resolver                                       │
│ • Route Redirector (to Kiro dashboards)                   │
│ • Rollback Mechanism                                        │
└─────────────────────────────────────────────────────────────┘
```

### Phase 4: Protection & Governance
```
┌─────────────────────────────────────────────────────────────┐
│                    Branch Protection System                  │
├─────────────────────────────────────────────────────────────┤
│ • Active Branch Validator (main/kiro-dev/aws-deploy)       │
│ • Legacy Code Detector (pre-commit hooks)                  │
│ • Architecture Compliance Checker                          │
│ • Automated Documentation Generator                         │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Architecture Scanner Component
```typescript
interface ArchitectureScanner {
  scanFileSystem(): Promise<ComponentMap>;
  detectOrigin(filePath: string): ComponentOrigin;
  analyzeUsage(component: Component): UsageAnalysis;
  generateArchitectureMap(): ArchitectureMap;
}

interface ComponentMap {
  [path: string]: {
    origin: 'lovable' | 'supabase' | 'kiro' | 'unknown';
    isActive: boolean;
    isTested: boolean;
    hasKiroAlternative: boolean;
    dependencies: string[];
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
  };
}
```

### 2. Test Selection Engine
```typescript
interface TestSelectionEngine {
  loadCoverageMap(): Promise<CoverageMap>;
  validateInterfaces(): Promise<InterfaceValidation[]>;
  selectSafeTests(): Promise<TestSuite>;
  generateTestReport(): Promise<SafeTestReport>;
}

interface SafeTestSuite {
  validated: string[];
  excluded: string[];
  interfaceMismatches: string[];
  executionPlan: TestExecutionPlan;
}
```

### 3. Legacy Cleanup Engine
```typescript
interface LegacyCleanupEngine {
  identifyLegacyComponents(): Promise<LegacyComponent[]>;
  validateSafeToDelete(component: LegacyComponent): Promise<boolean>;
  createBackup(components: LegacyComponent[]): Promise<BackupResult>;
  executeCleanup(plan: CleanupPlan): Promise<CleanupResult>;
}

interface CleanupPlan {
  toDelete: LegacyComponent[];
  toArchive: LegacyComponent[];
  toRedirect: RouteRedirect[];
  rollbackPlan: RollbackPlan;
}
```

### 4. Protection System
```typescript
interface ProtectionSystem {
  configureBranchProtection(): Promise<void>;
  setupPreCommitHooks(): Promise<void>;
  generateDocumentation(): Promise<DocumentationResult>;
  validateSystemPurity(): Promise<PurityReport>;
}
```

## Data Models

### Architecture Map Schema
```json
{
  "scanTimestamp": "2025-01-14T10:00:00Z",
  "totalComponents": 156,
  "componentsByOrigin": {
    "kiro": 89,
    "lovable": 34,
    "supabase": 28,
    "unknown": 5
  },
  "components": {
    "src/pages/Login.tsx": {
      "origin": "supabase",
      "isActive": true,
      "isTested": false,
      "hasKiroAlternative": true,
      "kiroAlternative": "src/components/auth/KiroLogin.tsx",
      "dependencies": ["src/services/supabase-auth.ts"],
      "riskLevel": "medium",
      "recommendedAction": "replace_with_kiro"
    }
  },
  "cleanupPriority": [
    {
      "component": "src/pages/Login.tsx",
      "priority": 1,
      "reason": "Has Kiro alternative, medium risk"
    }
  ]
}
```

### Safe Test Report Schema
```json
{
  "executionTimestamp": "2025-01-14T10:30:00Z",
  "selectedTests": {
    "total": 23,
    "passed": 21,
    "failed": 2,
    "skipped": 0
  },
  "excludedTests": {
    "total": 64,
    "interfaceMismatches": 3,
    "legacyComponents": 45,
    "untested": 16
  },
  "results": {
    "src/services/__tests__/vc.test.ts": {
      "status": "passed",
      "reason": "Kiro-validated component"
    },
    "src/services/__tests__/persona-api.test.ts": {
      "status": "excluded",
      "reason": "Interface mismatch detected"
    }
  }
}
```

## Error Handling

### Rollback Mechanisms
1. **Phase 1 Rollback:** Restore original file system state
2. **Phase 2 Rollback:** Restore original test configuration
3. **Phase 3 Rollback:** Restore deleted components from backup
4. **Phase 4 Rollback:** Remove branch protection and hooks

### Risk Mitigation
- **Backup Strategy:** Complete system backup before each phase
- **Incremental Execution:** Each phase can be executed independently
- **Validation Gates:** Automatic validation before proceeding to next phase
- **Emergency Stop:** Immediate rollback capability at any point

## Testing Strategy

### Phase Testing
1. **Architecture Scanner Tests:** Validate component detection accuracy
2. **Test Selection Tests:** Ensure safe test identification
3. **Cleanup Engine Tests:** Verify safe deletion logic
4. **Protection System Tests:** Validate governance mechanisms

### Integration Testing
- **End-to-End Cleanup:** Full 4-phase execution in test environment
- **Rollback Testing:** Verify complete system restoration
- **Performance Testing:** Ensure cleanup completes within 4 hours
- **Data Integrity Testing:** Verify no production data loss

## Implementation Phases

### Phase 1: Discovery (30 minutes)
- Scan entire codebase for component origins
- Generate comprehensive architecture map
- Identify Kiro alternatives for legacy components
- Create prioritized cleanup roadmap

### Phase 2: Validation (45 minutes)
- Parse existing test coverage analysis
- Identify safe-to-run tests
- Execute validated test suite
- Generate safe test report

### Phase 3: Cleanup (2 hours)
- Create comprehensive backup
- Remove identified legacy components
- Redirect routes to Kiro dashboards
- Validate system functionality

### Phase 4: Protection (45 minutes)
- Configure branch protection rules
- Setup pre-commit hooks
- Generate final documentation
- Validate system purity

## Success Metrics

- **Discovery Accuracy:** >95% component classification accuracy
- **Test Safety:** 0% false positive test results
- **Cleanup Efficiency:** >90% legacy code removal
- **System Purity:** 100% Kiro-based architecture
- **Protection Effectiveness:** 0% legacy code regression