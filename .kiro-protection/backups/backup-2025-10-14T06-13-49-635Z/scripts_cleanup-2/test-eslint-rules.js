#!/usr/bin/env node

/**
 * Test ESLint Legacy Rules
 * 
 * Tests the custom ESLint rules for legacy service detection
 * Requirements: 3.1
 */

import { ESLint } from 'eslint';
import * as fs from 'fs';
import * as path from 'path';

// Test cases with legacy patterns that should be caught
const testCases = [
    {
        name: "Supabase Import",
        code: `import { createClient } from '@supabase/supabase-js';`,
        shouldFail: true,
        service: "supabase"
    },
    {
        name: "Supabase Client Creation",
        code: `const supabase = createClient('https://project.supabase.co', 'key');`,
        shouldFail: true,
        service: "supabase"
    },
    {
        name: "Vercel Config",
        code: `const config = { vercel: { app: 'myapp.vercel.app' } };`,
        shouldFail: true,
        service: "vercel"
    },
    {
        name: "Twilio API Call",
        code: `client.messages.create({ to: '+1234567890', body: 'Hello' });`,
        shouldFail: true,
        service: "twilio"
    },
    {
        name: "Resend Email",
        code: `const resend = new Resend('api-key');`,
        shouldFail: true,
        service: "resend"
    },
    {
        name: "AWS Service (Should Pass)",
        code: `import { S3Client } from '@aws-sdk/client-s3';`,
        shouldFail: false,
        service: "aws"
    },
    {
        name: "React Component (Should Pass)",
        code: `import React from 'react';`,
        shouldFail: false,
        service: "react"
    }
];

async function testESLintRules() {
    console.log('🧪 Testing ESLint Legacy Rules...\n');

    const eslint = new ESLint({
        useEslintrc: false,
        overrideConfigFile: 'eslint.config.js',
        cwd: process.cwd()
    });

    let passedTests = 0;
    let failedTests = 0;

    for (const testCase of testCases) {
        try {
            // Create temporary test file
            const testFile = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.js`;
            const testPath = path.join(process.cwd(), testFile);

            fs.writeFileSync(testPath, testCase.code);

            // Run ESLint on test file
            const results = await eslint.lintFiles([testFile]);
            const hasErrors = results[0].errorCount > 0;
            const hasLegacyErrors = results[0].messages.some(msg =>
                msg.message.includes('legacy') ||
                msg.message.includes('deprecated') ||
                msg.ruleId === 'cleanup-2/no-legacy-services' ||
                msg.ruleId === 'no-restricted-imports'
            );

            // Clean up test file
            fs.unlinkSync(testPath);

            // Check if result matches expectation
            const testPassed = testCase.shouldFail ? hasLegacyErrors : !hasLegacyErrors;

            if (testPassed) {
                console.log(`✅ ${testCase.name}: ${testCase.shouldFail ? 'Correctly blocked' : 'Correctly allowed'}`);
                passedTests++;
            } else {
                console.log(`❌ ${testCase.name}: ${testCase.shouldFail ? 'Should have been blocked' : 'Should have been allowed'}`);
                if (hasErrors) {
                    console.log(`   Errors found: ${results[0].messages.map(m => m.message).join(', ')}`);
                }
                failedTests++;
            }

        } catch (error) {
            console.log(`❌ ${testCase.name}: Test failed with error: ${error.message}`);
            failedTests++;
        }
    }

    console.log(`\n📊 Test Results:`);
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log(`📈 Success Rate: ${Math.round((passedTests / (passedTests + failedTests)) * 100)}%`);

    if (failedTests === 0) {
        console.log('\n🎉 All ESLint legacy rules are working correctly!');
        return true;
    } else {
        console.log('\n⚠️  Some ESLint rules need adjustment.');
        return false;
    }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    testESLintRules()
        .then(success => process.exit(success ? 0 : 1))
        .catch(error => {
            console.error('❌ Test execution failed:', error);
            process.exit(1);
        });
}

export { testESLintRules };
