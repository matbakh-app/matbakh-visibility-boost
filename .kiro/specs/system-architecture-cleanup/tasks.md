# System Architecture Cleanup & Reintegration - Implementation Tasks

## Phase 1: Architecture Discovery & Analysis

- [x] 1. Create Architecture Scanner Engine
  - Implement file system crawler for /api/, /routes/, /dashboard/, /pages/, /auth/, /src/lib/, /src/services/
  - Build origin detection logic (Lovable/Supabase/Kiro markers in comments, imports, patterns)
  - Create usage analyzer to track active imports/exports
  - Integrate with existing test coverage analysis
  - _Requirements: 1.1, 1.2_

- [x] 2. Build Component Classification System
  - Create ComponentMap data structure with origin, usage, test status
  - Implement dependency graph builder
  - Build risk assessment engine (critical/high/medium/low)
  - Create Kiro-alternative detector
  - _Requirements: 1.1, 1.3_

- [x] 3. Generate Architecture Documentation
  - Create comprehensive architecture map JSON/Excel export
  - Build prioritized cleanup roadmap
  - Generate visual dependency graphs
  - Create component origin statistics dashboard
  - _Requirements: 1.4_

## Phase 2: Selective Test Validation

- [ ] 4. Implement Test Selection Engine
  - Parse existing source-test-coverage-map.json
  - Build interface mismatch detector
  - Create Kiro-component filter logic
  - Implement safe test suite generator
  - _Requirements: 2.1, 2.2_

- [ ] 5. Create Targeted Test Executor
  - Build pre-validated test runner
  - Implement real-time result analysis
  - Create failure classification system (expected vs unexpected)
  - Generate safe-test-report.md with detailed results
  - _Requirements: 2.3, 2.4_

- [ ] 6. Fix Critical Interface Mismatches
  - Rewrite persona-api.test.ts to match actual implementation
  - Update VC service test assertions for correct return types
  - Validate AWS RDS client test complexity
  - Ensure all selected tests have proper mocks
  - _Requirements: 2.4_

## Phase 3: Safe Legacy Component Archival (SAFE RECOVERY MODE)

- [ ] 7. Build Legacy Component Detector
  - Implement Supabase/Lovable marker scanner
  - Create backend dependency checker
  - Build route usage analyzer
  - Implement safe-to-archive classifier (NO DELETION)
  - _Requirements: 3.1, 3.2_

- [ ] 8. Create Safe Archival System
  - Implement comprehensive backup creator for src/archive/legacy-cleanup-YYYY-MM-DD/
  - Build dependency resolver to prevent breaking changes
  - Create route redirector to Kiro dashboards (keep originals as fallback)
  - Implement instant rollback mechanism for emergency recovery
  - Create archive metadata with full restoration instructions
  - _Requirements: 3.3, 3.4_

- [ ] 8.1. **SAFE RECOVERY MODE: Archive-Only Strategy**
  - **NO DELETION**: Move all legacy components to src/archive/legacy-cleanup-YYYY-MM-DD/
  - **Preserve Structure**: Maintain exact directory structure in archive
  - **Create Symlinks**: Optional symlinks from original locations to archive (for gradual transition)
  - **Metadata Generation**: Create archive-manifest.json with full component mapping
  - **Instant Rollback**: Single command to restore any archived component
  - **Validation Gates**: Test system after each archive batch, rollback if issues detected
  - _Requirements: 3.3, 3.4 + Enhanced Safety_

- [ ] 9. Execute Safe Legacy Component Archival
  - **ARCHIVE ONLY** identified components from pages/, components/, layouts/, lib/
  - Move components to src/archive/legacy-cleanup-YYYY-MM-DD/ with full metadata
  - Create redirect proxies to new Kiro dashboards (/upload, /vc, /onboarding, /reports, /dashboard)
  - Validate system functionality after each archival batch
  - Generate restoration scripts for each archived component
  - _Requirements: 3.1, 3.2, 3.3 + Zero-Risk Archival_

## Phase 4: Protection & Governance

- [ ] 10. Implement Branch Protection System
  - Configure Git branch protection for main, kiro-dev, aws-deploy only
  - Setup automated branch cleanup for legacy branches
  - Create pre-commit hooks to detect legacy code patterns
  - Implement architecture compliance checker
  - _Requirements: 4.1, 4.4_

- [ ] 11. Generate System Documentation
  - Create comprehensive README.md updates
  - Build src/deprecated/ documentation with removal reasons
  - Generate deployment-notes/ with architecture changes
  - Create ARCHIVED-FEATURES.md with complete feature history
  - _Requirements: 4.2, 4.3_

- [ ] 12. Validate Kiro System Purity
  - Verify all APIs are Kiro-generated
  - Validate test frameworks are Kiro-configured
  - Ensure Auth/Dashboard/Upload/VC components are Kiro-based
  - Generate system purity certification report
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

## Quality Assurance & Validation

- [ ] 13. Comprehensive System Testing
  - Execute full test suite on cleaned system
  - Validate all critical user journeys (VC, Auth, Upload, Dashboard)
  - Perform performance testing to ensure no degradation
  - Test rollback procedures for each phase
  - _Requirements: All phases validation_

- [ ] 14. Documentation & Handover
  - Create complete cleanup execution report
  - Document all architectural changes and decisions
  - Generate before/after system comparison
  - Create maintenance guide for preventing regression
  - _Requirements: 4.2, 4.3, 5.4_

## Emergency Procedures & Safe Recovery

- [ ] 15. Enhanced Rollback System Implementation (SAFE RECOVERY MODE)
  - Create automated rollback scripts for each phase
  - Implement emergency stop mechanisms
  - Build system state validation checkpoints
  - Create rapid recovery procedures
  - **Archive-Based Recovery**: Instant restoration from src/archive/legacy-cleanup-YYYY-MM-DD/
  - **Component-Level Rollback**: Restore individual components without full system rollback
  - **Dependency Chain Restoration**: Automatically restore dependent components
  - **Health Check Integration**: Continuous monitoring during archival process
  - _Requirements: All phases safety + Enhanced Archive Recovery_

- [ ] 15.1. **Archive Management System**
  - Create archive browser UI for easy component restoration
  - Implement archive search and filter capabilities
  - Build dependency visualization for archived components
  - Generate archive statistics and cleanup impact reports
  - Create automated archive cleanup (after 90 days confirmation)
  - _Requirements: Long-term archive management_

## Success Validation

- [ ] 16. Final System Certification (SAFE RECOVERY MODE)
  - Validate 100% Kiro-based architecture (active components only)
  - Confirm 0% legacy code presence in active codebase
  - Verify all tests pass with validated components only
  - Generate final system purity certificate
  - **Archive Validation**: Confirm all legacy components safely archived with restoration capability
  - **Rollback Testing**: Validate that any component can be restored within 5 minutes
  - _Requirements: 5.1, 5.2, 5.3, 5.4 + Archive Safety_

## Safe Recovery Mode Benefits

✅ **Zero Risk**: No components are permanently deleted
✅ **Instant Rollback**: Any component can be restored in minutes
✅ **Gradual Transition**: Components can be archived incrementally
✅ **Full Traceability**: Complete audit trail of all changes
✅ **Production Safe**: No risk of breaking production systems
✅ **Compliance Ready**: Full change documentation for audits

---

## 📁 Systematische Projektstruktur (gültig ab sofort)

Diese Struktur ist verbindlich für alle Tasks, AI-Agenten (z. B. Kiro), Contributors und Script-Engines. Jede Komponente muss in genau einem freigegebenen Ordner liegen. Alle abweichenden Pfade werden archiviert oder blockiert.

| Komponententyp            | Pfad (verbindlich)                                  | Beschreibung |
|---------------------------|-----------------------------------------------------|--------------|
| 🧠 Services               | `src/services/`                                     | Geschäftslogik, Business-Regeln |
| 🧩 Engines                | `src/lib/`                                          | Analyse-, Scan-, Bewertungs-Engines |
| 🧱 UI-Komponenten         | `src/components/`                                   | Alle React-Komponenten |
| 🧭 Routen (Pages)         | `src/pages/`                                        | App-Routen (z. B. Onboarding, Reports) |
| 🧪 Tests (eine Datei je Komponente) | `src/__tests__/`                       | Alle Tests – exakt eine Datei pro Modul |
| 🧪 Test-Setup             | `src/__tests__/shared/`, `src/setup/`               | zentrales Setup, globale Hooks |
| 🧪 Mocks                  | `src/__mocks__/`                                    | z. B. `uuid`, API-Antworten, DateTime etc. |
| 🔄 Kontext & State Mgmt   | `src/contexts/`, `src/hooks/`                       | React Contexts, Custom Hooks |
| 🛠️ Hilfsfunktionen        | `src/utils/`, `src/shared/`                         | Utilities, Validierer, Helpers |
| 📦 Archive (nur durch Safe Recovery) | `src/archive/legacy-cleanup-YYYY-MM-DD/` | Alte oder unsichere Dateien |
| 🧪 Polyfills              | `src/shared/polyfills/`                             | Fixes für `import.meta.env`, `TextEncoder`, etc. |
| 🧪 Scripts (max. 1 pro Engine) | `scripts/`                                    | Test- und CLI-Tools, z. B. `scripts/test-vc.ts` |

---

### ⛔ Verbotene Dateimuster (werden automatisch archiviert)

- `test-*.ts` im Root oder in `src/`
- `*-copy.ts`, `*-debug.ts`, `*-runner.ts` außerhalb von `scripts/`
- Duplikate identischer Funktionen in verschiedenen Pfaden
- React-Komponenten außerhalb von `src/components/`
- Analyse- oder Bewertungslogik außerhalb von `src/lib/`
- Mehrere Tests für dieselbe Komponente (≠ Single Source of Test)

---

### 🔒 Locking & Kontrolle

Die folgenden Dateien sind **gelockt** und dürfen nur verändert, nicht ersetzt oder dupliziert werden:

```md
🔒 `src/lib/architecture-scanner/index.ts`
🔒 `src/__tests__/architecture-scanner.test.ts`
🔒 `scripts/test-vc.ts`
🔒 `src/services/vc-generator.ts`
```

---

**Execution Order:** Sequential execution of phases 1-4, with validation gates between each phase.
**Estimated Duration:** 4 hours total (30min + 45min + 2h + 45min) + 30min for archive setup
**Risk Level:** **LOW** (with comprehensive archive-based recovery)
**Success Criteria:** Pure Kiro system with 0% legacy contamination + 100% recovery capability
**Archive Strategy:** src/archive/legacy-cleanup-YYYY-MM-DD/ with full metadata and restoration scripts