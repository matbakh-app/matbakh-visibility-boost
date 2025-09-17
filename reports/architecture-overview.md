# System Architecture Overview

**Generated:** 2025-09-14  
**Total Components:** 437  
**Analysis Timestamp:** 2025-09-14T14:02:02.614Z

## 📊 Executive Summary


The system contains **437 components** with the following key characteristics:

- **15 Kiro components** (3%) - Modern, well-architected
- **72 Legacy components** (16%) - Requiring migration or cleanup
- **271 cleanup candidates** identified for potential archiving
- **3.89% test coverage** - Significant improvement opportunity

### Key Findings

- **Legacy Footprint:** 16% of components are legacy (Supabase/Lovable)
- **Cleanup Potential:** 62% of components are candidates for cleanup
- **Test Coverage Gap:** Only 3.89% of components have test coverage
- **Risk Distribution:** Detailed risk analysis available in component reports


## 🏗️ Component Distribution


| Origin | Count | Percentage | Status |
|--------|-------|------------|--------|
| 🟢 Kiro | 15 | 3% | Modern, keep |
| 🟡 Supabase | 71 | 16% | Legacy, migrate |
| 🔴 Lovable | 1 | 0% | Legacy, migrate |
| ⚫ Unknown | 350 | 80% | Needs classification |

### Origin Analysis

- **Kiro Components:** Modern components following current architecture patterns
- **Supabase Components:** Legacy components from previous architecture, candidates for migration
- **Lovable Components:** Legacy components from early development phase
- **Unknown Components:** Components requiring manual classification and review


## ⚠️ Risk Assessment


### Priority Distribution

- **🔴 High Priority:** 1 components (Priority ≥ 10)
- **🟡 Medium Priority:** 199 components (Priority 5-9)
- **🟢 Low Priority:** 71 components (Priority < 5)

### Top Risk Components

1. **pdfReport.ts** (Priority: 11)
   - Effort: low
   - Reason: Unused component, legacy supabase component

2. **AngeboteDE.tsx** (Priority: 5)
   - Effort: low
   - Reason: Legacy component cleanup

3. **AngebotePage.tsx** (Priority: 5)
   - Effort: low
   - Reason: Legacy component cleanup

4. **AuthDebug.tsx** (Priority: 5)
   - Effort: low
   - Reason: Legacy component cleanup

5. **B2CLanding.tsx** (Priority: 5)
   - Effort: low
   - Reason: Legacy component cleanup

6. **BusinessLanding.tsx** (Priority: 5)
   - Effort: low
   - Reason: Legacy component cleanup

7. **BusinessLogin.tsx** (Priority: 5)
   - Effort: low
   - Reason: Legacy component cleanup

8. **CheckoutSuccess.tsx** (Priority: 5)
   - Effort: low
   - Reason: Legacy component cleanup

9. **EmailRegistration.tsx** (Priority: 5)
   - Effort: low
   - Reason: Legacy component cleanup

10. **FacebookDataDeletion.tsx** (Priority: 5)
   - Effort: low
   - Reason: Legacy component cleanup


## 🧹 Cleanup Recommendations


### Cleanup Roadmap

**Total Estimated Effort:** 135.5 hours

#### Phase 1: Quick Wins (0 items)
Low-effort, high-impact cleanup tasks that can be completed immediately.



#### Phase 2: Medium Effort (0 items)
Components requiring moderate refactoring or migration effort.



#### Phase 3: Complex Tasks (271 items)
High-risk or complex components requiring careful planning and execution.

- pdfReport.ts (low effort)
- AngeboteDE.tsx (low effort)
- AngebotePage.tsx (low effort)
- AuthDebug.tsx (low effort)
- B2CLanding.tsx (low effort)



## 🕸️ Dependency Analysis

### Graph Statistics

- **Total Nodes:** 518
- **Total Edges:** 2357
- **Circular Dependencies:** 2
- **Orphaned Nodes:** 28
- **Critical Paths:** 0

### Circular Dependencies

1. UploadManagementDashboard → UploadPreviewModal
2. UploadManagementDashboard → useUploadManagement

### Orphaned Components

- TimeSelector
- ImageWithFallback
- aspect-ratio
- cacheManager
- performanceMonitor
- info
- webWorkerManager
- DevelopmentTestingCard
- StepCard
- useAuth



## 🧩 Component Analysis

### Risk Distribution

- 🟢 **Low:** 13 components
- 🟡 **Medium:** 350 components
- 🟠 **High:** 61 components
- 🔴 **Critical:** 0 components

### Type Distribution

- **Unknown:** 2 components
- **Page:** 63 components
- **UI:** 233 components
- **Engine:** 30 components
- **Hook:** 60 components
- **Utility:** 18 components
- **Service:** 13 components
- **Context:** 5 components

### Archive Candidates

424 components identified as archive candidates:

- **src/api/client.ts** (medium risk, unused)
- **src/pages/AdminPanel.tsx** (high risk, unused)
- **src/pages/AngeboteDE.tsx** (high risk, unused)
- **src/pages/AngebotePage.tsx** (high risk, unused)
- **src/pages/AuthDebug.tsx** (high risk, unused)
- **src/pages/B2CLanding.tsx** (high risk, unused)
- **src/pages/BusinessLanding.tsx** (high risk, unused)
- **src/pages/BusinessLogin.tsx** (high risk, unused)
- **src/pages/CheckoutSuccess.tsx** (high risk, unused)
- **src/pages/CognitoTest.tsx** (high risk, unused)


## 📈 Test Coverage Analysis


### Current Coverage

- **Overall Coverage:** 3.89%
- **Tested Components:** undefined
- **Untested Components:** undefined

### Coverage by Origin

Detailed coverage by origin not available

### Recommendations

1. **Prioritize testing for high-risk components** - Focus on Supabase legacy components
2. **Implement testing for critical paths** - Ensure core functionality is covered
3. **Add integration tests** - Test component interactions and dependencies
4. **Automate test coverage reporting** - Track progress over time


## 🎯 Next Steps


### Immediate Actions (Next 2 weeks)

1. **Review cleanup candidates** - Validate the top 10 priority items for safe removal
2. **Address circular dependencies** - Break dependency cycles to improve maintainability
3. **Implement missing tests** - Focus on high-risk, untested components
4. **Document Kiro alternatives** - Ensure migration paths are clear for legacy components

### Medium-term Goals (Next 2 months)

1. **Execute Phase 1 cleanup** - Remove or archive low-risk, unused components
2. **Migrate high-priority Supabase components** - Replace with Kiro alternatives
3. **Improve test coverage** - Target 50% coverage for critical components
4. **Establish monitoring** - Set up automated architecture health checks

### Long-term Vision (Next 6 months)

1. **Complete legacy migration** - Achieve <10% legacy component ratio
2. **Establish architecture governance** - Prevent future technical debt accumulation
3. **Implement automated cleanup** - Set up continuous architecture optimization
4. **Document best practices** - Create guidelines for future development


---

*This documentation was automatically generated by the Architecture Scanner System.*
*For detailed component information, see the accompanying JSON reports.*
