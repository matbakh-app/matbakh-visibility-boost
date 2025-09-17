/**
 * Legacy Test Setup - Redirects to Centralized Setup
 * 
 * This file is maintained for backward compatibility but now redirects
 * to the centralized setup configuration.
 */

// Import and re-export everything from centralized setup
export * from './shared/setup';//
 Export to make this a module and prevent Jest "no tests" error
export {};