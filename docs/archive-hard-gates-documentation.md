# 🔒 Archive Hard Gates Documentation

## Overview

The Archive Hard Gates system ensures that archived code **never leaks into production** by implementing multiple layers of isolation at the build system level. This is critical for maintaining system integrity and preventing archived components from accidentally being included in builds, tests, or deployments.

## 🎯 Two-Tier Isolation Strategy

### 🔒 **Permanent Archive** (HARD ISOLATION)
Components that will **never be used again**:
- `manual-archive/` - Previously manually archived components
- `backup-files/` - Manual backups (main.tsx.backup, etc.)
- `legacy-auth/` - Legacy authentication components
- `figma-demos/` - Figma demo components
- `old-flows/` - Old workflow components
- `old-profile-flow/` - Legacy profile components
- `src/` (in archive) - Safe archived components

**Status**: **COMPLETELY ISOLATED** from all build/test/production systems

### 🔄 **On-Hold Archive** (SOFT ISOLATION)
Components that **may be restored in the future**:
- `on-hold/src/` - High-risk components requiring review

**Status**: **AVAILABLE FOR RESTORATION** - can be reactivated when needed

## 🛠️ Implementation Details

### TypeScript Configuration

**File**: `tsconfig.app.json`

```json
{
  "exclude": [
    "src/archive/**/manual-archive/**",
    "src/archive/**/src/**",
    "src/archive/backup-files/**",
    "src/archive/legacy-auth/**",
    "src/archive/figma-demos/**",
    "src/archive/old-flows/**",
    "src/archive/old-profile-flow/**"
  ]
}
```

**Effect**: Permanent archive components are **excluded from TypeScript compilation**
- ✅ Prevents type checking of archived code
- ✅ Reduces compilation time
- ✅ Eliminates archived code from IDE intellisense
- 🔄 On-hold components remain available for restoration

### Jest Configuration

**File**: `jest.config.cjs`

```javascript
module.exports = {
  testPathIgnorePatterns: [
    '<rootDir>/src/archive/**/manual-archive/',
    '<rootDir>/src/archive/**/src/',
    '<rootDir>/src/archive/backup-files/',
    '<rootDir>/src/archive/legacy-auth/',
    '<rootDir>/src/archive/figma-demos/',
    '<rootDir>/src/archive/old-flows/',
    '<rootDir>/src/archive/old-profile-flow/',
  ],
  modulePathIgnorePatterns: [
    '<rootDir>/src/archive/**/manual-archive/',
    '<rootDir>/src/archive/**/src/',
    '<rootDir>/src/archive/backup-files/',
    '<rootDir>/src/archive/legacy-auth/',
    '<rootDir>/src/archive/figma-demos/',
    '<rootDir>/src/archive/old-flows/',
    '<rootDir>/src/archive/old-profile-flow/',
  ],
  collectCoverageFrom: [
    'src/**/*.(ts|tsx)',
    '!src/archive/**/manual-archive/**',
    '!src/archive/**/src/**',
    '!src/archive/backup-files/**',
    '!src/archive/legacy-auth/**',
    '!src/archive/figma-demos/**',
    '!src/archive/old-flows/**',
    '!src/archive/old-profile-flow/**',
  ]
};
```

**Effect**: Permanent archive components are **excluded from testing**
- ✅ No tests run on archived code
- ✅ No coverage collection from archived code
- ✅ Faster test execution
- 🔄 On-hold components can be tested when restored

### ESLint Configuration

**File**: `eslint.config.js`

```javascript
export default tseslint.config(
  { 
    ignores: [
      "src/archive/**/manual-archive/**",
      "src/archive/**/src/**",
      "src/archive/backup-files/**",
      "src/archive/legacy-auth/**",
      "src/archive/figma-demos/**",
      "src/archive/old-flows/**",
      "src/archive/old-profile-flow/**"
    ] 
  },
  {
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/archive/*/manual-archive/*", 
                "@/archive/*/src/*",
                "src/archive/*/manual-archive/*", 
                "src/archive/*/src/*",
                "@/archive/backup-files/*",
                "@/archive/legacy-auth/*",
                "@/archive/figma-demos/*",
                "@/archive/old-flows/*",
                "@/archive/old-profile-flow/*"
              ],
              message: "❌ Permanent archivierte Komponenten nicht importieren! Für on-hold Komponenten: Erst aus on-hold/ zurück nach src/ verschieben."
            }
          ]
        }
      ]
    }
  }
);
```

**Effect**: Permanent archive imports are **blocked with clear error messages**
- ✅ Prevents accidental imports from permanent archive
- ✅ Clear error messages guide developers
- ✅ No linting of archived code
- ⚠️ On-hold imports show warnings (not errors) to allow restoration

### Vite Build Configuration

**File**: `vite.config.ts`

```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      external: [
        /^src\/archive\/.*\/manual-archive\//,
        /^src\/archive\/.*\/src\//,
        /^src\/archive\/backup-files\//,
        /^src\/archive\/legacy-auth\//,
        /^src\/archive\/figma-demos\//,
        /^src\/archive\/old-flows\//,
        /^src\/archive\/old-profile-flow\//
      ]
    }
  }
});
```

**Effect**: Permanent archive components are **hard excluded from production builds**
- ✅ Archived code never reaches production
- ✅ Smaller bundle sizes
- ✅ Faster build times
- 🔄 On-hold components can be included when restored

## 🧪 Archive Isolation Verification

### Verification Script

**File**: `scripts/verify-archive.sh`

```bash
#!/usr/bin/env bash
# Archive Isolation Verifier
# CRITICAL: This script MUST pass before any deployment

bash scripts/verify-archive.sh
```

### Verification Checks

The verification script performs comprehensive checks:

#### 1. **Import Analysis**
- ✅ Scans all active code for permanent archive imports
- ⚠️ Warns about on-hold imports (allows restoration)
- ❌ Fails if permanent archive imports found

#### 2. **Configuration Validation**
- ✅ Verifies TypeScript excludes permanent archive
- ✅ Verifies Jest ignores permanent archive
- ✅ Verifies ESLint prevents permanent archive imports
- ✅ Verifies Vite excludes permanent archive from build

#### 3. **Build Output Analysis**
- ✅ Scans production build for archive references
- ❌ Fails if permanent archive code found in build
- ⚠️ Warns if on-hold references found (may be intentional)

#### 4. **Manifest Validation**
- ✅ Verifies consolidated archive manifest exists
- ✅ Validates manifest format and structure
- ✅ Checks archive integrity

#### 5. **Parallel System Detection**
- ⚠️ Warns if multiple archival systems detected
- ℹ️ Suggests consolidation if needed

### CI/CD Integration

Add to your CI/CD pipeline:

```yaml
# .github/workflows/deploy.yml
- name: Verify Archive Isolation
  run: bash scripts/verify-archive.sh
```

**CRITICAL**: This check **MUST pass** before any deployment to production.

## 🔄 On-Hold Component Restoration

### Restoration Process

On-hold components can be safely restored to active codebase:

```bash
# Restore component from on-hold
npx tsx scripts/restore-onhold-component.ts src/components/auth/LoginForm.tsx

# Dry run first
npx tsx scripts/restore-onhold-component.ts src/components/auth/LoginForm.tsx --dry-run
```

### Restoration Safety

The restoration script ensures:
- ✅ **Safety Validation**: Checks for conflicts before restoration
- ✅ **Git History**: Preserves git history when possible
- ✅ **Dependency Check**: Validates imports and dependencies
- ✅ **Manifest Update**: Updates archive manifest
- ✅ **Test Validation**: Runs tests after restoration

### Restoration Workflow

1. **Locate Component**: Find component in on-hold archive
2. **Validate Safety**: Check for conflicts and dependencies
3. **Restore File**: Move from on-hold back to src/
4. **Update Manifest**: Remove from on-hold list
5. **Run Tests**: Validate restoration success
6. **Git Commit**: Commit restoration changes

## 🚨 Emergency Procedures

### Archive Leak Detection

If archived code is detected in production:

1. **Immediate Action**: Stop deployment
2. **Run Verification**: `bash scripts/verify-archive.sh`
3. **Identify Source**: Find how archived code leaked
4. **Fix Configuration**: Update build configuration
5. **Re-verify**: Ensure verification passes
6. **Redeploy**: Deploy clean build

### Rollback Procedures

If archival causes issues:

```bash
# Full system rollback
./src/archive/consolidated-legacy-archive-2025-01-14/rollback.sh

# Partial component restoration
npx tsx scripts/restore-onhold-component.ts <component-path>
```

### Configuration Recovery

If build configurations are corrupted:

1. **Restore from Git**: `git checkout HEAD -- tsconfig.app.json jest.config.cjs eslint.config.js vite.config.ts`
2. **Re-apply Hard Gates**: Follow implementation details above
3. **Verify**: `bash scripts/verify-archive.sh`

## 📊 Monitoring & Metrics

### Archive Health Metrics

- **Archive Size**: Total size of archived components
- **On-Hold Count**: Number of components awaiting review
- **Restoration Rate**: Components restored per month
- **Leak Detection**: Archive references in production builds

### Performance Impact

Hard Gates provide:
- ✅ **Faster Builds**: Excluded archived code reduces build time
- ✅ **Faster Tests**: Excluded archived code reduces test time
- ✅ **Smaller Bundles**: No archived code in production
- ✅ **Better IDE Performance**: No archived code in intellisense

## 🔧 Maintenance

### Regular Tasks

#### Weekly
- Run `bash scripts/verify-archive.sh` in CI/CD
- Monitor for archive leaks in production builds

#### Monthly
- Review on-hold components for restoration opportunities
- Clean up old archive directories (after 90+ days)
- Update archive documentation

#### Quarterly
- Audit archive isolation effectiveness
- Review and update Hard Gates configuration
- Performance impact analysis

### Configuration Updates

When updating build tools:
1. **Update Hard Gates**: Apply exclusions to new configurations
2. **Test Verification**: Ensure `verify-archive.sh` still works
3. **Update Documentation**: Document any configuration changes

## 🎯 Best Practices

### Development Workflow

1. **Before Archival**: Run full test suite
2. **During Archival**: Use batch processing with validation
3. **After Archival**: Run verification script
4. **Before Deployment**: Always run `verify-archive.sh`

### Code Review Guidelines

- ✅ **Check Imports**: Ensure no archive imports in new code
- ✅ **Verify Configuration**: Confirm Hard Gates are maintained
- ✅ **Test Coverage**: Ensure tests don't reference archived code

### Emergency Response

- 🚨 **Archive Leak**: Immediate deployment stop
- 🔄 **Restoration Needed**: Use restoration script
- 📋 **Configuration Issue**: Follow recovery procedures

## 📚 Related Documentation

- [Safe Archival System Documentation](./safe-archival-system-documentation.md)
- [Archival Systems Consolidation Analysis](./archival-systems-consolidation-analysis.md)
- [On-Hold Component Restoration Guide](../scripts/restore-onhold-component.ts)
- [Archive Verification Script](../scripts/verify-archive.sh)

---

**Remember**: Hard Gates are your **last line of defense** against archived code reaching production. Always verify before deployment!