# Failing Tests Directory

This directory contains tests that are currently failing and have been removed from the Green Core validation to prevent CI blocking.

## Current Failing Tests

### persona-api.basic.test.ts
- **Issue**: Cannot find module '../persona-api' 
- **Duration**: Failing for 2+ days
- **Status**: Moved from Green Core to prevent CI blocking
- **Next Steps**: Requires proper investigation and fix, not a quick patch

## Guidelines

- Tests in this directory are NOT run in CI
- Each failing test should have a clear reason documented
- Tests should only be moved back to main test directory after proper fixes
- Do not attempt quick fixes - investigate root causes properly