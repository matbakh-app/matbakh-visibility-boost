/**
 * Unit Test Setup
 * 
 * Setup for Node.js unit tests
 */

// Suppress console noise in tests
jest.spyOn(console, 'error').mockImplementation(() => { });
jest.spyOn(console, 'warn').mockImplementation(() => { });
jest.spyOn(console, 'log').mockImplementation(() => { });

// Global test timeout
jest.setTimeout(10000);