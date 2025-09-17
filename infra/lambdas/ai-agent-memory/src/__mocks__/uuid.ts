/**
 * Centralized UUID Mock for AI Agent Memory Tests
 * 
 * This mock provides configurable UUID generation for tests with debugging support.
 * It ensures consistent UUID values across all test suites while allowing for
 * dynamic generation when needed.
 */

import { jest } from '@jest/globals';

// Mock implementation with valid v4 UUID
export const v4 = jest.fn(() => {
  // val optional global überschreibbar – aber immer gültiges v4-Fallback
  const val = (globalThis as any).TEST_UUID || '00000000-0000-4000-8000-000000000000';
  // console.log(`🔧 UUID mock called → ${val}`);
  return val;
});

// Default export for compatibility
export default { v4 };