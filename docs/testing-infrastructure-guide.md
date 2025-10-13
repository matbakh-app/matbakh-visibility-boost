# Testing Infrastructure Guide

## Overview

This document describes the comprehensive testing infrastructure implemented as part of Task 4 - "Enhance Testing Infrastructure" from the System Optimization Enhancement specification.

## Recent Updates

### Jest Setup Migration (2025-01-14)

- ✅ Migrated from TypeScript/ESM to CommonJS setup
- ✅ Improved test stability and CI/CD compatibility
- ✅ 40% faster test startup time
- ✅ 29% reduction in memory usage
- 📖 See: [Jest Setup CommonJS Migration](./jest-setup-commonjs-migration-2025-01-14.md)
- 📖 Quick Reference: [Jest Setup Quick Reference](./jest-setup-quick-reference.md)

## Testing Strategy

### 1. Multi-Layer Testing Approach

Our testing strategy follows a pyramid approach with multiple layers:

```
    /\     E2E Tests (Playwright)
   /  \
  /____\   Integration Tests (Jest + Testing Library)
 /      \
/________\  Unit Tests (Jest)
```

### 2. Test Types

#### Unit Tests

- **Framework**: Jest with React Testing Library
- **Location**: `src/**/__tests__/*.test.ts`
- **Purpose**: Test individual components and functions in isolation
- **Coverage Target**: >95%

#### Integration Tests

- **Framework**: Jest with jsdom
- **Location**: `src/**/__tests__/*.integration.test.ts`
- **Purpose**: Test component interactions and API integrations
- **Coverage Target**: >90%

#### E2E Tests

- **Framework**: Playwright
- **Location**: `test/e2e/*.spec.ts`
- **Purpose**: Test complete user journeys across browsers
- **Coverage**: Critical user paths

#### Visual Regression Tests

- **Framework**: Playwright with screenshot comparison
- **Location**: `test/visual/*.spec.ts`
- **Purpose**: Detect unintended visual changes
- **Baseline**: Stored in `test-results/visual-baselines/`

#### Cross-Browser Tests

- **Framework**: Playwright with multiple browser engines
- **Location**: `test/cross-browser/*.spec.ts`
- **Purpose**: Ensure compatibility across browsers and devices
- **Browsers**: Chrome, Firefox, Safari, Edge

#### Performance Tests

- **Framework**: Lighthouse CI
- **Configuration**: `lighthouserc.js`
- **Purpose**: Monitor Core Web Vitals and performance metrics
- **Thresholds**: Defined in `test/config/test-config.ts`

## Configuration Files

### Playwright Configurations

#### Main E2E Configuration (`playwright.config.ts`)

```typescript
// Comprehensive E2E testing across multiple browsers and devices
// Includes desktop, mobile, and tablet testing
// Supports parallel execution with retry logic
```

#### Visual Testing Configuration (`playwright.visual.config.ts`)

```typescript
// Specialized for visual regression testing
// Consistent viewport and rendering settings
// Disabled animations for stable screenshots
```

#### Cross-Browser Configuration (`playwright.cross-browser.config.ts`)

```typescript
// Extensive browser matrix testing
// Multiple screen resolutions and device types
// Network condition simulation
```

### Lighthouse Configuration (`lighthouserc.js`)

```typescript
// Performance testing with Core Web Vitals
// Accessibility and SEO auditing
// Custom performance thresholds
```

## Test Scripts

### Available Commands

```bash
# Unit and Integration Tests
npm test                       # Run Jest tests
npm run test:watch             # Run Jest in watch mode
npm run test:coverage          # Generate coverage report
npm run test:ci                # Run tests in CI mode

# Specific Jest Test Commands
npm test -- src/hooks/__tests__/useDatabaseOptimization.test.ts  # Run specific file
npm test -- -t "should calculate performance status correctly"    # Run specific test
npm test -- --runInBand       # Run tests serially

# E2E Tests
npm run test:e2e               # Run all E2E tests
npm run test:e2e:headed        # Run E2E tests with browser UI

# Visual Tests
npm run test:visual            # Run visual regression tests

# Cross-Browser Tests
npm run test:cross-browser     # Run cross-browser compatibility tests

# Performance Tests
npm run test:performance       # Run Lighthouse performance tests

# All Tests
npm run test:all               # Run complete test suite
```

## Test Utilities

### Helper Functions (`test/utils/test-helpers.ts`)

- `waitForAppReady()` - Wait for app to be fully loaded
- `fillVCForm()` - Fill visibility check form with test data
- `checkAccessibility()` - Basic accessibility validation
- `measurePerformance()` - Collect performance metrics
- `takeConsistentScreenshot()` - Screenshot with consistent settings
- `mockApiResponse()` - Mock API calls for testing

### Test Configuration (`test/config/test-config.ts`)

- Environment-specific configurations
- Performance thresholds
- Browser support matrix
- Test data generators

## CI/CD Integration

### GitHub Actions Workflow (`.github/workflows/comprehensive-testing.yml`)

The workflow includes:

1. **Unit Tests** - Run on Node.js 18 and 20
2. **E2E Tests** - Run on Chrome, Firefox, and Safari
3. **Visual Tests** - Generate and compare screenshots
4. **Cross-Browser Tests** - Test compatibility matrix
5. **Performance Tests** - Lighthouse auditing
6. **Security Tests** - Dependency and vulnerability scanning

### Artifacts

Test results are automatically uploaded as artifacts:

- Test reports (HTML, JSON, JUnit)
- Screenshots and videos
- Performance reports
- Coverage reports

## Performance Thresholds

### Core Web Vitals

- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1

### Other Metrics

- **TTFB (Time to First Byte)**: < 600ms
- **FCP (First Contentful Paint)**: < 1.8s
- **Speed Index**: < 3.4s
- **Time to Interactive**: < 3.8s

### Bundle Size Limits

- **JavaScript Bundle**: < 500KB
- **CSS Bundle**: < 100KB
- **Total Bundle**: < 2MB

## Accessibility Standards

- **WCAG Level**: 2.1 AA compliance
- **Color Contrast**: 4.5:1 for normal text, 3:1 for large text
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader Support**: Proper ARIA labels and semantics

## Browser Support

### Desktop Browsers

- **Chrome**: Version 90+
- **Firefox**: Version 88+
- **Safari**: Version 14+
- **Edge**: Version 90+

### Mobile Browsers

- **iOS Safari**: iOS 14+
- **Chrome Mobile**: Android 8+
- **Samsung Internet**: Latest 2 versions

## Test Data Management

### Test Users

```typescript
const testUsers = {
  valid: {
    email: "test@example.com",
    password: "TestPassword123!",
    name: "Test User",
  },
  invalid: {
    email: "invalid-email",
    password: "123",
    name: "",
  },
};
```

### Test Business Data

```typescript
const testBusiness = {
  name: "Test Restaurant Berlin",
  email: "restaurant@example.com",
  phone: "+49 30 12345678",
  address: "Musterstraße 1, 10115 Berlin",
};
```

## Debugging Tests

### Local Development

#### Jest Tests

```bash
# Run all Jest tests
npm test

# Run specific test file
npm test -- src/hooks/__tests__/useDatabaseOptimization.test.ts

# Run specific test by name
npm test -- -t "should calculate performance status correctly"

# Run tests serially (useful for debugging)
npm test -- --runInBand

# Run tests in watch mode
npm run test:watch
```

#### Playwright Tests

```bash
# Run tests with browser UI
npm run test:e2e:headed

# Run specific test file
npx playwright test test/e2e/app-navigation.spec.ts

# Debug mode with step-by-step execution
npx playwright test --debug
```

### CI Debugging

- Test artifacts are uploaded to GitHub Actions
- Screenshots and videos available for failed tests
- Detailed logs in workflow output

## Best Practices

### Writing Tests

1. **Descriptive Names**: Use clear, descriptive test names
2. **Arrange-Act-Assert**: Follow AAA pattern
3. **Independent Tests**: Each test should be independent
4. **Stable Selectors**: Use data-testid attributes
5. **Wait Strategies**: Use proper wait conditions

### Visual Testing

1. **Consistent Environment**: Use same OS and browser version
2. **Hide Dynamic Content**: Hide timestamps and animations
3. **Stable Baselines**: Update baselines carefully
4. **Meaningful Comparisons**: Test meaningful visual changes

### Performance Testing

1. **Consistent Conditions**: Use same network and CPU throttling
2. **Multiple Runs**: Average results across multiple runs
3. **Realistic Data**: Use production-like data volumes
4. **Monitor Trends**: Track performance over time

## Maintenance

### Regular Tasks

- Update browser versions in CI
- Review and update performance thresholds
- Maintain visual test baselines
- Update test data and scenarios

### Monitoring

- Track test execution times
- Monitor flaky test rates
- Review coverage reports
- Analyze performance trends

## Troubleshooting

### Common Issues

#### Flaky Tests

- Use proper wait conditions
- Avoid hard-coded timeouts
- Mock external dependencies
- Use stable test data

#### Performance Variations

- Run tests multiple times
- Use consistent test environment
- Monitor external factors
- Set appropriate thresholds

#### Visual Test Failures

- Check for font rendering differences
- Verify animation states
- Update baselines when needed
- Use consistent viewport sizes

## Integration with Development Workflow

### Pre-commit Hooks

```bash
# Run unit tests before commit
npm run test

# Run linting and type checking
npm run lint
```

### Pull Request Checks

- All tests must pass
- Coverage thresholds must be met
- Performance budgets must be maintained
- Visual changes must be approved

### Release Process

- Full test suite execution
- Performance regression check
- Cross-browser validation
- Accessibility audit

## Metrics and Reporting

### Test Metrics

- Test execution time
- Test success rate
- Coverage percentage
- Flaky test identification

### Performance Metrics

- Core Web Vitals trends
- Bundle size changes
- Load time variations
- Accessibility scores

### Quality Metrics

- Bug detection rate
- Regression prevention
- Test maintenance effort
- Developer productivity impact

This comprehensive testing infrastructure ensures high-quality releases while maintaining development velocity and user experience standards.
