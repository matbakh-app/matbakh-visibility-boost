# Code Generation Guide

## Overview

The Kiro Code Generation system provides comprehensive tools for generating components, API clients, tests, and documentation following Kiro-Purity & Governance principles.

## Features

- **Kiro-compliant Component Generator**: Creates UI components with shadcn/ui patterns
- **API Client Generator**: Generates TypeScript clients from OpenAPI specs
- **Test Generator**: Creates comprehensive test suites with 80%+ coverage
- **Documentation Generator**: Generates JSDoc/TypeDoc documentation

## Configuration

All generators use the central configuration file `kirogen.config.ts`:

```typescript
export const kiroGenConfig: KiroGenConfig = {
  paths: {
    components: 'src/components',
    api: 'src/api',
    hooks: 'src/hooks',
    tests: 'src/__tests__',
    docs: 'docs'
  },
  testing: {
    coverageTargets: {
      statements: 90,
      branches: 80,
      functions: 90,
      lines: 90
    },
    a11ySmokeToggle: true,
    performanceBudget: {
      renderTime: 16, // 60fps
      bundleSize: 50 // KB per component
    }
  },
  governance: {
    kiroSystemPurityValidator: true,
    dryRunDefault: false,
    rollbackIntegration: true,
    idempotentRuns: true,
    conflictCheck: true
  }
};
```

## Component Generator

### Usage

```bash
npm run gen:component -- --name ButtonPrime --domain common --variants primary,secondary --with-tests --with-docs
```

### Options

- `--name`: Component name (PascalCase, required)
- `--domain`: Component domain (kebab-case, required)
- `--variants`: Comma-separated variants
- `--with-tests`: Generate test file (default: true)
- `--with-docs`: Generate documentation (default: true)
- `--with-stories`: Generate Storybook stories
- `--page`: Generate as page component with routing
- `--dry-run`: Preview without writing files

### Generated Structure

```
src/components/<domain>/<ComponentName>/
├── index.ts                    # Barrel export
├── ComponentName.tsx           # Main component
├── ComponentName.types.ts      # TypeScript types
├── ComponentName.test.tsx      # Tests (if --with-tests)
├── ComponentName.stories.tsx   # Stories (if --with-stories)
└── README.md                   # Documentation (if --with-docs)
```

### Features

- **Kiro-Purity Compliance**: No dead files, proper @/* aliases, barrel exports
- **TypeScript Strict**: Full type safety with discriminated unions
- **Accessibility**: ARIA attributes, keyboard navigation, screen reader support
- **i18n Ready**: Translation placeholders and useTranslation integration
- **Testing**: Comprehensive test suite with accessibility and performance tests
- **Variants**: CVA-based variant system with Tailwind CSS

## API Client Generator

### Usage

```bash
npm run gen:api -- --schema ./openapi.yaml --out src/api --hooks --retry=3 --auth=cognito
```

### Options

- `--schema`: Path to OpenAPI schema file or URL (required)
- `--out`: Output directory (required)
- `--hooks`: Generate React Query hooks (default: true)
- `--retry`: Number of retry attempts (default: 3)
- `--auth`: Authentication type: cognito|jwt|none (default: cognito)
- `--dry-run`: Preview without writing files

### Generated Structure

```
src/api/
├── client.ts           # Main API client
├── types.gen.ts        # Generated types from schema
├── query-keys.ts       # React Query keys
├── hooks/
│   └── index.ts        # React Query hooks
└── __tests__/
    └── client.test.ts  # Client tests
```

### Features

- **Full TypeScript Support**: Generated types from OpenAPI schema
- **React Query Integration**: Hooks with proper caching and error handling
- **Authentication**: Built-in Cognito/JWT support
- **Error Handling**: Comprehensive error mapping and retry logic
- **Testing**: MSW-based test suite with mocking

## Test Generator

### Usage

```bash
npm run gen:tests -- --component src/components/common/ButtonPrime/ButtonPrime.tsx
```

### Options

- `--component`: Path to component file (required)
- `--coverage`: Target coverage percentage (default: 80)
- `--a11y`: Include accessibility tests (default: true)
- `--performance`: Include performance tests (default: true)
- `--dry-run`: Preview without writing files

### Generated Tests

- **Smoke Tests**: Basic rendering and props
- **Props Matrix**: Tests for all prop variants
- **Event Handling**: User interaction tests
- **Accessibility**: WCAG 2.1 AA compliance tests
- **Performance**: Render time and memory leak tests
- **Edge Cases**: Error handling and boundary conditions

### Features

- **AST Analysis**: Uses ts-morph for intelligent component analysis
- **80%+ Coverage**: Targets high coverage with meaningful tests
- **Accessibility First**: Built-in a11y testing with jest-axe
- **Performance Budget**: Enforces render time limits

## Documentation Generator

### Usage

```bash
npm run gen:docs -- --scope components,api --out docs
```

### Options

- `--scope`: Comma-separated scopes: components,api,guides (required)
- `--out`: Output directory (required)
- `--dry-run`: Preview without writing files

### Generated Documentation

- **Component Docs**: Props, examples, accessibility, performance
- **API Docs**: Endpoint reference, authentication, error handling
- **Development Guides**: Setup, testing, deployment procedures
- **Cross-references**: Links to QA reports, performance data

### Features

- **JSDoc Integration**: Extracts documentation from code comments
- **Markdown Output**: Clean, readable documentation format
- **Cross-linking**: Automatic links between related documentation
- **Live Updates**: Regenerates when code changes

## Best Practices

### Component Generation

1. **Use Descriptive Names**: Choose clear, descriptive component names
2. **Domain Organization**: Group related components in logical domains
3. **Variant Planning**: Define variants upfront for consistent styling
4. **Documentation First**: Always generate documentation for public components

### API Client Generation

1. **Schema Validation**: Ensure OpenAPI schema is valid and complete
2. **Authentication Setup**: Configure authentication before generation
3. **Error Handling**: Review generated error handling and customize as needed
4. **Hook Integration**: Use generated hooks for consistent data fetching

### Test Generation

1. **Component Analysis**: Ensure components have proper TypeScript interfaces
2. **Coverage Goals**: Aim for 80%+ coverage but focus on meaningful tests
3. **Accessibility Testing**: Always include a11y tests for UI components
4. **Performance Testing**: Add performance tests for complex components

### Documentation Generation

1. **JSDoc Comments**: Add comprehensive JSDoc comments to all public APIs
2. **Examples**: Include usage examples in component documentation
3. **Cross-references**: Link related components and APIs
4. **Regular Updates**: Regenerate documentation after significant changes

## Governance & Quality

### Kiro-Purity Validation

All generators integrate with the Kiro System Purity Validator:

- **No Dead Files**: Ensures all generated files are properly integrated
- **Proper Imports**: Uses @/* aliases and follows import conventions
- **Barrel Exports**: Automatically updates barrel export files
- **Type Safety**: Enforces TypeScript strict mode compliance

### Rollback Integration

Generators integrate with the enhanced rollback system:

```bash
# Rollback recent generation
npx tsx scripts/enhanced-rollback-system.ts

# Dry run rollback
npx tsx scripts/enhanced-rollback-system.ts --dry-run
```

### Validation Pipeline

After generation, run the validation pipeline:

```bash
npm run gen:validate
```

This runs:
- ESLint checking
- TypeScript type checking
- Test execution
- Kiro System Purity validation

## Troubleshooting

### Common Issues

1. **Component Already Exists**: Use `--force` to overwrite or choose a different name
2. **Invalid OpenAPI Schema**: Validate schema with online tools before generation
3. **Test Generation Fails**: Ensure component has proper TypeScript interfaces
4. **Documentation Missing**: Add JSDoc comments to component and props

### Debug Mode

Enable debug logging by setting the log level:

```bash
DEBUG=kiro:gen npm run gen:component -- --name MyComponent --domain ui
```

### Performance Issues

If generation is slow:

1. **Enable Caching**: Hash-based skip is enabled by default
2. **Parallel Generation**: Use `--parallel` flag for multiple components
3. **Selective Scope**: Use specific scopes for documentation generation

## Integration with CI/CD

### GitHub Actions

```yaml
name: Code Generation Validation

on: [push, pull_request]

jobs:
  validate-generation:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run gen:validate
      - name: Upload generation logs
        uses: actions/upload-artifact@v3
        with:
          name: generation-logs
          path: .gen-logs/
```

### Pre-commit Hooks

```bash
# Install pre-commit hook
npm run setup-git-hooks

# Manual validation
npm run gen:validate
```

## Examples

### Generate a Complete Feature

```bash
# 1. Generate component
npm run gen:component -- --name UserProfile --domain feature --with-tests --with-docs --with-stories

# 2. Generate API client
npm run gen:api -- --schema user-api.yaml --out src/api/user --hooks

# 3. Generate additional tests
npm run gen:tests -- --component src/components/feature/UserProfile/UserProfile.tsx --coverage=90

# 4. Generate documentation
npm run gen:docs -- --scope components,api --out docs

# 5. Validate everything
npm run gen:validate
```

### Batch Component Generation

```bash
# Generate multiple components
for component in Button Card Modal Dialog; do
  npm run gen:component -- --name $component --domain ui --with-tests --with-docs
done
```

### API-First Development

```bash
# 1. Generate API client from schema
npm run gen:api -- --schema https://api.example.com/openapi.json --out src/api/example

# 2. Generate components that use the API
npm run gen:component -- --name ExampleList --domain feature --with-tests

# 3. Generate comprehensive documentation
npm run gen:docs -- --scope api,components --out docs
```

---

*This guide is automatically updated when generators change.*