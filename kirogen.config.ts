/**
 * Kiro Code Generation Configuration
 * 
 * Central configuration for all code generators following Kiro-Purity & Governance principles
 */

export interface KiroGenConfig {
    paths: {
        components: string;
        api: string;
        hooks: string;
        tests: string;
        docs: string;
        types: string;
        stories: string;
    };
    naming: {
        components: 'PascalCase';
        files: 'kebab-case' | 'PascalCase';
        suffixes: {
            test: '.test';
            types: '.types';
            stories: '.stories';
            docs: '.md';
        };
    };
    testing: {
        coverageTargets: {
            statements: number;
            branches: number;
            functions: number;
            lines: number;
        };
        a11ySmokeToggle: boolean;
        performanceBudget: {
            renderTime: number; // ms
            bundleSize: number; // KB
        };
    };
    api: {
        baseUrlEnvKey: string;
        retryPolicy: {
            attempts: number;
            backoff: 'linear' | 'exponential';
        };
        auth: 'cognito' | 'jwt' | 'none';
        errorMapping: boolean;
    };
    quality: {
        eslintConfig: string;
        prettierConfig: string;
        tsConfigStrict: boolean;
        jsDocRequired: boolean;
        ariaPlaceholders: boolean;
        i18nPlaceholders: boolean;
    };
    performance: {
        caching: boolean;
        hashBasedSkip: boolean;
        parallelGeneration: boolean;
    };
    observability: {
        logDir: string;
        exitCodes: boolean;
        artifacts: boolean;
    };
    governance: {
        kiroSystemPurityValidator: boolean;
        dryRunDefault: boolean;
        rollbackIntegration: boolean;
        idempotentRuns: boolean;
        conflictCheck: boolean;
    };
}

export const kiroGenConfig: KiroGenConfig = {
    paths: {
        components: 'src/components',
        api: 'src/api',
        hooks: 'src/hooks',
        tests: 'src/__tests__',
        docs: 'docs',
        types: 'src/types',
        stories: 'src/stories'
    },
    naming: {
        components: 'PascalCase',
        files: 'PascalCase',
        suffixes: {
            test: '.test',
            types: '.types',
            stories: '.stories',
            docs: '.md'
        }
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
    api: {
        baseUrlEnvKey: 'VITE_API_URL',
        retryPolicy: {
            attempts: 3,
            backoff: 'exponential'
        },
        auth: 'cognito',
        errorMapping: true
    },
    quality: {
        eslintConfig: 'eslint.config.js',
        prettierConfig: '.prettierrc',
        tsConfigStrict: true,
        jsDocRequired: true,
        ariaPlaceholders: true,
        i18nPlaceholders: true
    },
    performance: {
        caching: true,
        hashBasedSkip: true,
        parallelGeneration: true
    },
    observability: {
        logDir: './.gen-logs',
        exitCodes: true,
        artifacts: true
    },
    governance: {
        kiroSystemPurityValidator: true,
        dryRunDefault: false,
        rollbackIntegration: true,
        idempotentRuns: true,
        conflictCheck: true
    }
};

export default kiroGenConfig;