/** @type {import('jest').Config} */
module.exports = {
    projects: [
        {
            displayName: 'cdk',
            testEnvironment: 'node',
            preset: 'ts-jest',
            testMatch: ['<rootDir>/infra/cdk/__tests__/basic-*.test.ts'],
            setupFilesAfterEnv: ['<rootDir>/infra/cdk/__tests__/setup.ts'],
            moduleNameMapper: {
                '^@/(.*)$': '<rootDir>/src/$1',
            },
            transform: {
                '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.spec.json' }],
            },
        },
        {
            displayName: 'unit',
            testEnvironment: 'node',
            preset: 'ts-jest',
            testMatch: ['<rootDir>/src/lib/microservices/__tests__/microservice-orchestrator-enhanced.test.ts'],
            setupFilesAfterEnv: ['<rootDir>/test/setup-unit.ts'],
            moduleNameMapper: {
                '^@/(.*)$': '<rootDir>/src/$1',
            },
            transform: {
                '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.spec.json' }],
            },
        },
        {
            displayName: 'ui',
            testEnvironment: 'jsdom',
            preset: 'ts-jest',
            testMatch: [
                '<rootDir>/src/components/microservices/__tests__/MicroservicesDashboard-basic.test.tsx',
                '<rootDir>/src/hooks/__tests__/useMicroservices-minimal.test.tsx'
            ],
            setupFilesAfterEnv: ['<rootDir>/test/setup-ui.ts'],
            moduleNameMapper: {
                '^@/(.*)$': '<rootDir>/src/$1',
                '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
            },
            transform: {
                '^.+\\.tsx?$': ['ts-jest', {
                    tsconfig: 'tsconfig.spec.json',
                    jsx: 'react-jsx'
                }],
            },
        },
    ],
};