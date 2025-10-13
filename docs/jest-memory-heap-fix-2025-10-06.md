# Jest Memory Heap Fix - 2025-10-06

**Date**: 2025-10-06  
**Status**: 🔧 IMMEDIATE ACTION REQUIRED  
**Issue**: Jest heap out of memory + TypeScript parsing errors

## 🚨 Problem

1. **Memory Leak**: `FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory`
2. **TypeScript Error**: `TS1127: Invalid character` in `performance-monitor.test.ts`
3. **Watch Mode Hanging**: Jest process exceeds 300000ms threshold

## 🎯 Root Causes

1. **Too Many Tests Running**: 136 test suites running simultaneously
2. **Watch Mode Active**: VSCode Jest Extension using watch mode despite config
3. **File Corruption**: Invalid characters in test file (likely encoding issue)

## 🔧 Immediate Solutions

### Solution 1: Fix VSCode Jest Extension Settings

**File**: `.vscode/settings.json`

Replace the Jest configuration:

```json
{
  "jest.jestCommandLine": "npm test --",
  "jest.monitorLongRun": 300000,
  "jest.enableInlineErrorMessages": true,
  "jest.autoRun": "off",
  "jest.runMode": "on-demand",
  "jest.showCoverageOnLoad": false,
  "jest.autoRevealOutput": "on-exec-error"
}
```

### Solution 2: Increase Node Memory Limit

**File**: `package.json`

Update test scripts:

```json
{
  "scripts": {
    "test": "NODE_OPTIONS='--max-old-space-size=4096' jest --runInBand --testLocationInResults --json --useStderr --outputFile /tmp/jest_results.json",
    "test:watch": "NODE_OPTIONS='--max-old-space-size=4096' jest --runInBand --watchAll=false",
    "test:ci": "NODE_OPTIONS='--max-old-space-size=4096' jest --runInBand --ci --coverage=false"
  }
}
```

### Solution 3: Fix Corrupted Test File

**File**: `src/lib/ai-orchestrator/__tests__/performance-monitor.test.ts`

The file has invalid characters at position 576-577. This is likely a Unicode encoding issue.

**Action**: Re-save the file with UTF-8 encoding:

```bash
# Backup the file first
cp src/lib/ai-orchestrator/__tests__/performance-monitor.test.ts src/lib/ai-orchestrator/__tests__/performance-monitor.test.ts.bak

# Fix encoding (macOS)
iconv -f UTF-8 -t UTF-8 -c src/lib/ai-orchestrator/__tests__/performance-monitor.test.ts.bak > src/lib/ai-orchestrator/__tests__/performance-monitor.test.ts
```

Or simply open the file in VSCode and re-save it with UTF-8 encoding.

### Solution 4: Disable Jest Extension Temporarily

If problems persist:

1. `Cmd + Shift + P` → "Extensions: Show Installed Extensions"
2. Find "Jest" extension by Orta
3. Click "Disable (Workspace)"
4. Reload VSCode: `Cmd + Shift + P` → "Developer: Reload Window"

## 🚀 Step-by-Step Fix Procedure

### Step 1: Stop All Jest Processes

```bash
# Kill all running Jest processes
pkill -f jest

# Verify no Jest processes running
ps aux | grep jest
```

### Step 2: Clear Jest Cache

```bash
# Clear Jest cache
npm test -- --clearCache

# Clear node_modules cache
rm -rf node_modules/.cache
```

### Step 3: Update VSCode Settings

Open `.vscode/settings.json` and apply Solution 1 above.

### Step 4: Reload VSCode

```bash
# Reload VSCode window
# Cmd + Shift + P → "Developer: Reload Window"
```

### Step 5: Run Tests Manually

```bash
# Run tests with increased memory
NODE_OPTIONS='--max-old-space-size=4096' npm test -- --runInBand

# Or run specific test file
NODE_OPTIONS='--max-old-space-size=4096' npm test -- src/lib/ai-orchestrator/__tests__/security-posture-monitor.test.ts
```

## 🔍 Verification

After applying fixes, verify:

- ✅ No "heap out of memory" errors
- ✅ No "Invalid character" TypeScript errors
- ✅ Jest completes within reasonable time (<5 minutes)
- ✅ No "long-running tests" warnings
- ✅ VSCode Jest extension shows results without hanging

## 📋 Alternative: Run Tests Without VSCode Extension

If VSCode Jest extension continues to cause issues:

```bash
# Run all tests in terminal
npm test

# Run specific test suite
npm test -- --testPathPattern="security-posture"

# Run with coverage
npm run test:coverage

# Run in CI mode (no watch, no interactive)
npm run test:ci
```

## 🎯 Long-Term Solutions

### 1. Split Test Suites

Consider splitting large test suites into smaller, focused test files:

- Maximum 20 tests per file
- Group related tests together
- Use `describe` blocks for organization

### 2. Optimize Test Performance

```javascript
// Use beforeAll instead of beforeEach when possible
beforeAll(() => {
  // Setup once for all tests
});

// Clean up after tests
afterAll(() => {
  // Cleanup
});
```

### 3. Configure Jest for Better Memory Management

**File**: `jest.config.cjs`

```javascript
module.exports = {
  // ... existing config
  maxWorkers: 1, // Sequential execution
  workerIdleMemoryLimit: "512MB", // Restart workers at memory limit
  testTimeout: 30000, // 30 second timeout per test
  bail: false, // Continue on failures
  detectOpenHandles: false, // Disable for performance
  forceExit: true, // Force exit after tests
};
```

## 📊 Expected Results

After all fixes:

- **Memory Usage**: < 2GB during test execution
- **Test Duration**: < 5 minutes for full suite
- **Success Rate**: 100% of tests pass
- **No Hangs**: Tests complete and exit cleanly

## 🔗 Related Documentation

- `docs/jest-watch-mode-fix-final-solution.md` - Complete watch mode fix
- `docs/vscode-jest-settings-fix.md` - VSCode Jest extension configuration
- `docs/jest-vscode-extension-fix-final.md` - Extension troubleshooting

---

**Status**: 🔧 READY FOR IMMEDIATE APPLICATION  
**Priority**: 🔴 CRITICAL - Blocks all test execution  
**Estimated Fix Time**: 5-10 minutes

## 🎬 Quick Start Commands

```bash
# 1. Kill Jest processes
pkill -f jest

# 2. Clear cache
npm test -- --clearCache

# 3. Update memory limit and run tests
NODE_OPTIONS='--max-old-space-size=4096' npm test -- --runInBand

# 4. If still failing, disable VSCode Jest extension and retry
```

**Next Steps**: Apply Solution 1 and Solution 2, then reload VSCode and run tests manually.
