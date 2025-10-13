/**
 * ESLint Security Configuration
 * 
 * Security-focused linting rules for the hybrid architecture
 */

module.exports = {
    extends: [
        'eslint:recommended',
        '@typescript-eslint/recommended',
        'plugin:security/recommended'
    ],
    plugins: [
        'security',
        'no-secrets'
    ],
    rules: {
        // Security-specific rules
        'security/detect-object-injection': 'error',
        'security/detect-non-literal-regexp': 'error',
        'security/detect-non-literal-fs-filename': 'error',
        'security/detect-eval-with-expression': 'error',
        'security/detect-pseudoRandomBytes': 'error',
        'security/detect-possible-timing-attacks': 'warn',
        'security/detect-unsafe-regex': 'error',
        'security/detect-buffer-noassert': 'error',
        'security/detect-child-process': 'warn',
        'security/detect-disable-mustache-escape': 'error',
        'security/detect-no-csrf-before-method-override': 'error',

        // Secrets detection
        'no-secrets/no-secrets': ['error', {
            'tolerance': 4.2,
            'ignoreContent': [
                'test',
                'mock',
                'example',
                'demo',
                'placeholder'
            ]
        }],

        // Additional security rules
        'no-eval': 'error',
        'no-implied-eval': 'error',
        'no-new-func': 'error',
        'no-script-url': 'error',
        'no-alert': 'error',
        'no-console': 'warn',

        // TypeScript security rules
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/no-unsafe-assignment': 'warn',
        '@typescript-eslint/no-unsafe-call': 'warn',
        '@typescript-eslint/no-unsafe-member-access': 'warn',
        '@typescript-eslint/no-unsafe-return': 'warn',

        // Prevent dangerous patterns
        'no-unused-vars': 'off', // Use TypeScript version
        '@typescript-eslint/no-unused-vars': ['error', {
            'argsIgnorePattern': '^_',
            'varsIgnorePattern': '^_'
        }],

        // Require explicit return types for security-critical functions
        '@typescript-eslint/explicit-function-return-type': ['warn', {
            'allowExpressions': true,
            'allowTypedFunctionExpressions': true
        }]
    },
    overrides: [
        {
            // Security-critical files require stricter rules
            files: [
                '**/security/**/*.ts',
                '**/auth/**/*.ts',
                '**/compliance/**/*.ts',
                '**/audit-trail/**/*.ts'
            ],
            rules: {
                '@typescript-eslint/no-explicit-any': 'error',
                '@typescript-eslint/explicit-function-return-type': 'error',
                '@typescript-eslint/no-unsafe-assignment': 'error',
                '@typescript-eslint/no-unsafe-call': 'error',
                '@typescript-eslint/no-unsafe-member-access': 'error',
                '@typescript-eslint/no-unsafe-return': 'error',
                'no-console': 'error'
            }
        },
        {
            // Test files can be more lenient
            files: [
                '**/__tests__/**/*.ts',
                '**/*.test.ts',
                '**/*.spec.ts'
            ],
            rules: {
                '@typescript-eslint/no-explicit-any': 'off',
                'no-console': 'off',
                'security/detect-object-injection': 'off'
            }
        }
    ],
    env: {
        node: true,
        es2022: true
    },
    parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './tsconfig.json'
    }
};