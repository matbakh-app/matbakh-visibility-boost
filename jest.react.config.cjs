/**
 * Jest Configuration for React Tests
 * -----------------------------------
 * Specialized configuration for React component and hook testing
 * with enhanced @testing-library/react integration
 */

const baseConfig = require('./jest.config.cjs');

module.exports = {
    ...baseConfig,

    // Display name for this configuration
    displayName: 'React Tests',

    // Test match patterns - focus on React tests
    testMatch: [
        '<rootDir>/src/**/*.test.{ts,tsx}',
        '<rootDir>/src/**/*.spec.{ts,tsx}',
    ],

    // Setup files for React testing
    setupFilesAfterEnv: [
        '<rootDir>/src/setupTests.cjs',
        '<rootDir>/src/test-utils/react-test-setup.ts',
    ],

    // Test environment - jsdom for React
    testEnvironment: 'jsdom',

    // Test environment options
    testEnvironmentOptions: {
        jsdom: {
            url: 'http://localhost:3000',
            pretendToBeVisual: true,
            resources: 'usable',
        },
    },

    // Module name mapping for React testing
    moduleNameMapper: {
        ...baseConfig.moduleNameMapper,
        '^@/(.*)$': '<rootDir>/src/$1',
        '^@/test-utils$': '<rootDir>/src/test-utils/react-test-utils.tsx',
        '^@/test-utils/(.*)$': '<rootDir>/src/test-utils/$1',
    },

    // Transform configuration for React
    transform: {
        ...baseConfig.transform,
        '^.+\\.(ts|tsx)$': ['ts-jest', {
            tsconfig: {
                jsx: 'react-jsx',
                esModuleInterop: true,
                allowSyntheticDefaultImports: true,
            },
        }],
    },

    // Coverage configuration for React components
    collectCoverageFrom: [
        'src/components/**/*.{ts,tsx}',
        'src/hooks/**/*.{ts,tsx}',
        'src/contexts/**/*.{ts,tsx}',
        'src/pages/**/*.{ts,tsx}',
        '!src/**/*.d.ts',
        '!src/**/*.stories.{ts,tsx}',
        '!src/**/__mocks__/**',
        '!src/**/index.{ts,tsx}',
    ],

    // Coverage thresholds for React code
    coverageThreshold: {
        global: {
            branches: 70,
            functions: 70,
            lines: 70,
            statements: 70,
        },
    },

    // Module file extensions
    moduleFileExtensions: [
        'ts',
        'tsx',
        'js',
        'jsx',
        'json',
    ],

    // React-specific timeout settings
    testTimeout: 15000, // Longer timeout for React rendering

    // Verbose output for React tests
    verbose: true,

    // Module directories
    moduleDirectories: [
        'node_modules',
        '<rootDir>/src',
        '<rootDir>/src/test-utils',
    ],
};