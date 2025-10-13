/** @type {import('jest').Config} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',

    // Enhanced Jest Configuration for Test Segmentation
    // Optimized for CI/CD and local development

    // Performance & Stability Configuration
    watchman: false,
    maxWorkers: process.env.CI ? '25%' : process.env.JEST_MAX_WORKERS || '50%',
    forceExit: true,
    detectOpenHandles: true,

    // Memory Management (CI-optimized)
    workerIdleMemoryLimit: process.env.CI ? '256MB' : '512MB',

    // Timeout Settings (environment-specific)
    testTimeout: process.env.CI ? 20000 : 10000,

    // Test Discovery Patterns
    testMatch: [
        '<rootDir>/src/**/__tests__/**/*.(ts|tsx|js)',
        '<rootDir>/src/**/*.(test|spec).(ts|tsx|js)',
    ],

    // Watch Mode Configuration
    watchPathIgnorePatterns: [
        '<rootDir>/node_modules/',
        '<rootDir>/dist/',
        '<rootDir>/build/',
        '<rootDir>/.next/',
        '<rootDir>/logs/',
        '<rootDir>/.kiro/',
    ],

    // Transform configuration
    transform: {
        '^.+\\.tsx?$': ['ts-jest', {
            tsconfig: {
                target: 'ES2022',
                module: 'commonjs',
                moduleResolution: 'node',
                lib: ['ES2022', 'DOM', 'DOM.Iterable'],
                jsx: 'react-jsx',
                esModuleInterop: true,
                allowSyntheticDefaultImports: true,
                skipLibCheck: true,
                resolveJsonModule: true,
                isolatedModules: true,
                types: ['jest', '@testing-library/jest-dom', 'node'],
            },
        }],
    },

    // Setup files
    setupFilesAfterEnv: ['<rootDir>/src/setupTests.cjs'],

    // Enhanced Test Path Ignore Patterns (Comprehensive Segmentation)
    testPathIgnorePatterns: [
        '/node_modules/',

        // Archived Components (Never test)
        '<rootDir>/src/archive/',
        '<rootDir>/archive/',

        // Separate Test Categories (Run independently)
        '<rootDir>/test/unit/',           // Deno tests
        '<rootDir>/test/smoke/',          // Playwright smoke tests
        '<rootDir>/test/e2e/',            // E2E Playwright tests
        '<rootDir>/test/visual/',         // Visual regression tests
        '<rootDir>/test/cross-browser/',  // Cross-browser tests
        '<rootDir>/test/accessibility/',  // Accessibility tests

        // Infrastructure Tests (Separate execution)
        '<rootDir>/infra/lambdas/',       // Lambda tests
        '<rootDir>/infra/cdk/',           // CDK tests

        // Generated/Build Artifacts
        '<rootDir>/dist/',
        '<rootDir>/build/',
        '<rootDir>/.next/',

        // Logs and Temporary Files
        '<rootDir>/logs/',
        '<rootDir>/tmp/',

        // Configuration and Scripts
        '<rootDir>/scripts/__tests__/',   // Script tests (run separately)
    ],

    // Coverage Configuration (Focused on Source Code)
    collectCoverageFrom: [
        'src/**/*.(ts|tsx)',
        '!src/**/*.d.ts',
        '!src/archive/**',
        '!src/__mocks__/**',
        '!src/setupTests.*',
        '!src/**/*.stories.*',
    ],

    // Coverage Thresholds (Realistic but Ambitious)
    coverageThreshold: {
        global: {
            branches: 70,
            functions: 75,
            lines: 80,
            statements: 80,
        },
        // Critical modules require higher coverage
        'src/lib/ai-orchestrator/': {
            branches: 80,
            functions: 85,
            lines: 90,
            statements: 90,
        },
        'src/lib/compliance/': {
            branches: 85,
            functions: 90,
            lines: 95,
            statements: 95,
        },
    },

    // Transform ignore patterns for ESM modules
    transformIgnorePatterns: [
        '/node_modules/(?!(@aws-sdk|@testing-library|lucide-react|cheerio|jose|@sparticuz/chromium)/)',
    ],

    // Module name mapping for ESM modules
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^aws-sdk-client-mock$': '<rootDir>/src/__mocks__/aws-sdk-client-mock.js',
    },

    // Clear mocks between tests
    clearMocks: true,

    // Verbose output (environment-specific)
    verbose: process.env.CI || process.env.JEST_VERBOSE === 'true',

    // Enhanced Reporters
    reporters: [
        'default',
        '<rootDir>/scripts/jest/fail-on-pending-reporter.cjs',
        // Add coverage reporter for CI
        ...(process.env.CI ? [['jest-junit', { outputDirectory: 'test-results', outputName: 'junit.xml' }]] : []),
    ],

    // Test Categories Configuration (for selective execution)
    projects: [
        // Green Core Tests (Critical Path)
        {
            displayName: 'green-core',
            testMatch: [
                '<rootDir>/src/lib/architecture-scanner/__tests__/kiro-system-purity-validator.test.ts',
                '<rootDir>/src/services/__tests__/persona-api.*.test.ts',
            ],
            testNamePattern: 'should validate a pure Kiro system|should complete full persona workflow|should handle API errors gracefully|should work in mock mode when enabled',
        },

        // Unit Tests (Fast, isolated)
        {
            displayName: 'unit',
            testMatch: [
                '<rootDir>/src/**/__tests__/**/*.test.(ts|tsx)',
                '<rootDir>/src/**/*.test.(ts|tsx)',
            ],
            testPathIgnorePatterns: [
                ...module.exports.testPathIgnorePatterns,
                '<rootDir>/src/**/*.integration.test.*',
                '<rootDir>/src/**/*.e2e.test.*',
            ],
        },

        // Integration Tests (Slower, with external dependencies)
        {
            displayName: 'integration',
            testMatch: [
                '<rootDir>/src/**/*.integration.test.(ts|tsx)',
            ],
            testTimeout: 30000,
        },
    ],

    // Global Test Setup
    globalSetup: '<rootDir>/test/config/global-setup.js',
    globalTeardown: '<rootDir>/test/config/global-teardown.js',

    // Test Environment Options
    testEnvironmentOptions: {
        url: 'http://localhost:3000',
    },

    // Error Handling
    errorOnDeprecated: true,

    // Snapshot Configuration
    snapshotSerializers: ['@emotion/jest/serializer'],

    // Module File Extensions
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

    // Resolver Configuration
    resolver: undefined,

    // Test Results Processor
    testResultsProcessor: undefined,

    // Notify Configuration (for local development)
    notify: !process.env.CI,
    notifyMode: 'failure-change',
};