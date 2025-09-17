module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  moduleNameMapper: {
    '^@aws-sdk/client-bedrock-runtime$': '<rootDir>/src/__tests__/__mocks__/aws-sdk-client-bedrock-runtime.ts',
    '^@aws-sdk/client-secrets-manager$': '<rootDir>/src/__tests__/__mocks__/aws-sdk-client-secrets-manager.ts',
    '^@aws-sdk/client-dynamodb$': '<rootDir>/src/__tests__/__mocks__/aws-sdk-client-dynamodb.ts',
    '^@aws-sdk/lib-dynamodb$': '<rootDir>/src/__tests__/__mocks__/aws-sdk-lib-dynamodb.ts'
  },
  transformIgnorePatterns: ['/node_modules/'],
  testTimeout: 30000,
  verbose: true
};