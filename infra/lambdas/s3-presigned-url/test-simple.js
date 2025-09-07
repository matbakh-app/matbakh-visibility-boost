/**
 * Simple test runner for Lambda function validation
 * This runs basic validation tests without full Jest setup
 */

const { validateMimeType, validateFilename, validateFileSize, sanitizeFilename } = require('./dist/security');
const { AppError, ValidationErrors } = require('./dist/errors');

console.log('🧪 Running simple validation tests...\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

// Test MIME type validation
test('validateMimeType - accepts valid image types', () => {
  assert(validateMimeType('image/jpeg'), 'Should accept image/jpeg');
  assert(validateMimeType('image/png'), 'Should accept image/png');
  assert(validateMimeType('application/pdf'), 'Should accept application/pdf');
});

test('validateMimeType - rejects invalid types', () => {
  assert(!validateMimeType('application/x-executable'), 'Should reject executable');
  assert(!validateMimeType('text/javascript'), 'Should reject javascript');
  assert(!validateMimeType('video/mp4'), 'Should reject video');
});

// Test filename validation
test('validateFilename - accepts valid filenames', () => {
  const result = validateFilename('document.pdf');
  assert(result.valid, 'Should accept valid filename');
});

test('validateFilename - rejects dangerous filenames', () => {
  const result = validateFilename('malware.exe');
  assert(!result.valid, 'Should reject .exe files');
});

test('validateFilename - rejects path traversal', () => {
  const result = validateFilename('../../../etc/passwd');
  assert(!result.valid, 'Should reject path traversal');
});

// Test file size validation
test('validateFileSize - accepts valid sizes', () => {
  assert(validateFileSize(1024), 'Should accept 1KB');
  assert(validateFileSize(1024 * 1024), 'Should accept 1MB');
});

test('validateFileSize - rejects invalid sizes', () => {
  assert(!validateFileSize(0), 'Should reject 0 bytes');
  assert(!validateFileSize(-1), 'Should reject negative size');
  assert(!validateFileSize(20 * 1024 * 1024), 'Should reject 20MB');
});

// Test filename sanitization
test('sanitizeFilename - sanitizes dangerous characters', () => {
  const result = sanitizeFilename('file<>name.txt');
  assert(result === 'file_name.txt', 'Should sanitize dangerous characters');
});

test('sanitizeFilename - removes multiple underscores', () => {
  const result = sanitizeFilename('file___name.txt');
  assert(result === 'file_name.txt', 'Should remove multiple underscores');
});

// Test error creation
test('ValidationErrors - creates proper error objects', () => {
  const error = ValidationErrors.missingRequiredFields(['field1', 'field2']);
  assert(error instanceof AppError, 'Should create AppError instance');
  assert(error.message.includes('field1'), 'Should include missing field names');
});

test('ValidationErrors - creates invalid MIME type error', () => {
  const error = ValidationErrors.invalidMimeType('text/javascript', ['image/jpeg']);
  assert(error.code === 'INVALID_FILE', 'Should have correct error code');
  assert(error.details.providedType === 'text/javascript', 'Should include provided type');
});

// Test build output exists
test('Build output - TypeScript compilation', () => {
  const fs = require('fs');
  assert(fs.existsSync('./dist/index.js'), 'Should have compiled index.js');
  assert(fs.existsSync('./dist/security.js'), 'Should have compiled security.js');
  assert(fs.existsSync('./dist/errors.js'), 'Should have compiled errors.js');
});

// Test environment setup
test('Environment - required modules load', () => {
  const security = require('./dist/security');
  const errors = require('./dist/errors');
  
  assert(typeof security.validateMimeType === 'function', 'Security module should export functions');
  assert(typeof errors.AppError === 'function', 'Errors module should export AppError class');
});

console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  console.log('❌ Some tests failed. Please fix the issues before deployment.');
  process.exit(1);
} else {
  console.log('✅ All tests passed! Lambda function is ready for deployment.');
  process.exit(0);
}