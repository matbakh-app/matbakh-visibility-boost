# Development Environment Guide

## Overview

This guide covers the enhanced development environment setup for the matbakh.app system optimization project. The development environment has been optimized for faster development cycles, better debugging capabilities, and enhanced developer experience.

## Quick Start

### Development Server
```bash
# Standard development server
npm run dev

# Development with strict TypeScript checking
npm run dev:strict

# Development with debugging enabled
npm run dev:debug

# Full development environment (with mock services)
npm run dev:full

# Development with bundle analysis
npm run dev:analyze
```

### Type Checking
```bash
# One-time type check
npm run type-check

# Continuous type checking
npm run type-check:watch
```

## Enhanced Features

### 1. Hot Module Replacement (HMR)

The development server now includes enhanced HMR with:
- **Faster file watching** with optimized polling intervals
- **Pre-warming** of frequently used files
- **Selective reloading** to preserve component state
- **Error overlay** with detailed stack traces

#### Configuration
- HMR port: `5173`
- Polling interval: `50ms` (development), `100ms` (standard)
- Ignored paths: `node_modules`, `dist`, `coverage`, `src/archive`

### 2. Advanced TypeScript Configuration

#### Strict Mode (Gradual Adoption)
The TypeScript configuration has been enhanced with strict mode enabled:

```json
{
  "strict": true,
  "noImplicitAny": true,
  "strictNullChecks": true,
  "noImplicitReturns": true,
  "noFallthroughCasesInSwitch": true
}
```

#### Development-Specific Config
- `tsconfig.dev.json` - Enhanced development configuration
- Incremental compilation with `.tsbuildinfo`
- Enhanced error reporting
- Source map generation for debugging

### 3. Intelligent Code Completion

#### VS Code Integration
The development environment includes comprehensive VS Code configuration:

- **IntelliSense enhancements** with parameter hints and return types
- **Auto-imports** with smart module resolution
- **Code actions on save** (ESLint fixes, organize imports)
- **Tailwind CSS IntelliSense** with custom class regex
- **Path IntelliSense** with `@/` alias support

#### Code Snippets
Pre-configured snippets for common patterns:
- `rfc` - React Functional Component with TypeScript
- `hook` - Custom React Hook with TypeScript
- `api` - API Service Function with error handling
- `test` - Test Suite with Jest and React Testing Library
- `perf` - Performance Monitoring Hook

### 4. Integrated Debugging Tools

#### VS Code Debugging
Multiple debug configurations available:
- **Launch Chrome (Development)** - Debug in Chrome with source maps
- **Attach to Chrome** - Attach to existing Chrome instance
- **Debug Jest Tests** - Debug unit tests
- **Debug Current Jest Test** - Debug specific test file
- **Debug Playwright Tests** - Debug E2E tests
- **Debug TypeScript Node Script** - Debug Node.js scripts

#### Development Tools Component
A built-in development tools panel (`DevTools`) provides:
- **Console log viewer** with filtering by type
- **Performance testing** tools
- **Memory usage monitoring**
- **Real-time debugging** information

#### Source Maps
Enhanced source map configuration for better debugging:
- Full source maps in development
- Optimized source map paths
- Integration with browser dev tools

## Development Utilities

### Dev Utils Library (`src/lib/dev-utils.ts`)

Comprehensive development utilities including:

#### Logging
```typescript
import { devLog } from '@/lib/dev-utils';

devLog.info('Component rendered', { props });
devLog.warn('Performance warning', { duration });
devLog.error('Error occurred', error);
```

#### Performance Debugging
```typescript
import { performanceDebug } from '@/lib/dev-utils';

performanceDebug.mark('operation-start');
// ... operation
performanceDebug.mark('operation-end');
performanceDebug.measure('operation', 'operation-start', 'operation-end');
```

#### Memory Monitoring
```typescript
import { memoryDebug } from '@/lib/dev-utils';

memoryDebug.logUsage();
const tracker = memoryDebug.trackComponent('MyComponent');
```

#### Component Debugging
```typescript
import { debugComponent, debugHook } from '@/lib/dev-utils';

debugComponent('MyComponent', props);
debugHook('useMyHook', { state, loading });
```

## Environment Configuration

### Development Environment Variables (`.env.development`)
```bash
VITE_DEV_TOOLS_ENABLED=true
VITE_DEBUG_MODE=true
VITE_PERFORMANCE_MONITORING=true
VITE_SOURCE_MAPS=true
VITE_FAST_REFRESH=true
```

### Development-Specific Vite Config (`vite.dev.config.ts`)
Enhanced configuration for development with:
- Optimized dependency pre-bundling
- Enhanced HMR settings
- Development-specific chunk splitting
- Source map generation

## Performance Optimizations

### Dependency Pre-bundling
Common dependencies are pre-bundled for faster startup:
- React ecosystem (react, react-dom, react-router-dom)
- UI libraries (@radix-ui components)
- Utility libraries (clsx, tailwind-merge, date-fns)
- Form libraries (react-hook-form, zod)

### File Watching Optimizations
- Excluded unnecessary directories from watching
- Optimized polling intervals
- Intelligent file change detection

### Bundle Analysis
Development builds include bundle analysis:
```bash
npm run dev:analyze
```
This generates `dist/stats.html` with detailed bundle information.

## Debugging Workflows

### Component Debugging
1. Add `debugComponent('ComponentName', props)` to component
2. Use DevTools panel to monitor logs
3. Set breakpoints in VS Code
4. Use React DevTools for component inspection

### Performance Debugging
1. Use `performanceDebug.mark()` to mark performance points
2. Monitor with DevTools performance tab
3. Check memory usage with `memoryDebug.logUsage()`
4. Analyze bundle size with bundle analyzer

### API Debugging
1. Use `debugApi.request()` and `debugApi.response()` for API calls
2. Monitor network tab in browser dev tools
3. Use proxy configuration for local API testing

## Testing Integration

### Unit Testing with Debugging
```bash
# Debug specific test
npm run test -- --testNamePattern="MyComponent"

# Debug with VS Code
# Use "Debug Current Jest Test" configuration
```

### E2E Testing with Debugging
```bash
# Debug Playwright tests
npm run test:e2e -- --debug --headed
```

## Best Practices

### Development Workflow
1. **Start with type checking**: `npm run type-check:watch`
2. **Use strict mode gradually**: Enable strict TypeScript features incrementally
3. **Monitor performance**: Use DevTools panel for performance insights
4. **Debug systematically**: Use VS Code debugging configurations
5. **Analyze bundles regularly**: Run bundle analysis to optimize imports

### Code Quality
1. **Use provided snippets** for consistent code patterns
2. **Enable auto-formatting** on save
3. **Use ESLint fixes** automatically
4. **Monitor console logs** with DevTools panel

### Performance
1. **Pre-warm critical files** by adding them to Vite warmup config
2. **Use lazy loading** for non-critical components
3. **Monitor memory usage** with memory debugging tools
4. **Optimize imports** using auto-organize imports

## Troubleshooting

### Common Issues

#### HMR Not Working
- Check if files are in ignored paths
- Restart development server
- Clear Vite cache: `rm -rf node_modules/.vite`

#### TypeScript Errors
- Run `npm run type-check` to see all errors
- Check `tsconfig.dev.json` configuration
- Ensure all dependencies have type definitions

#### Slow Development Server
- Check bundle analyzer for large dependencies
- Optimize imports to reduce bundle size
- Use dependency pre-bundling configuration

#### Debugging Not Working
- Ensure source maps are enabled
- Check VS Code launch configuration
- Verify browser dev tools settings

### Performance Issues
- Monitor with DevTools performance tab
- Use `performanceDebug` utilities
- Check memory usage with `memoryDebug`
- Analyze bundle with `npm run dev:analyze`

## Advanced Configuration

### Custom Vite Plugins
Add custom plugins to `vite.dev.config.ts` for specific development needs.

### TypeScript Compiler Options
Modify `tsconfig.dev.json` for project-specific TypeScript settings.

### ESLint Rules
Customize `eslint.config.js` for project-specific linting rules.

### VS Code Settings
Modify `.vscode/settings.json` for team-specific editor configuration.

## Integration with Existing Systems

### Performance Monitoring
The development environment integrates with the existing performance monitoring system:
- Real-time metrics collection
- Performance regression detection
- Automated optimization suggestions

### Quality Assurance
Integration with QA systems:
- Automated code review
- Security scanning
- Accessibility testing

### Testing Infrastructure
Enhanced testing capabilities:
- Unit testing with Jest
- E2E testing with Playwright
- Visual regression testing
- Performance testing

This enhanced development environment provides a solid foundation for efficient development while maintaining code quality and performance standards.