/**
 * Quality Assurance Module
 * Exports all QA automation components
 */

// Main orchestrator
export { QAOrchestrator, qaOrchestrator } from './qa-orchestrator';
export type { QAConfig, QAResult } from './qa-orchestrator';

// AI Code Review
export { AICodeReviewer, aiCodeReviewer } from './ai-code-reviewer';
export type {
  CodeReviewRequest,
  CodeReviewResult,
  CodeReviewSuggestion
} from './ai-code-reviewer';

// Security Scanner
export { SecurityScanner, securityScanner } from './security-scanner';
export type {
  SecurityPolicy, SecurityScanResult, SecurityVulnerability
} from './security-scanner';

// Accessibility Tester
export { AccessibilityTester, accessibilityTester } from './accessibility-tester';
export type {
  AccessibilityConfig, AccessibilityTestResult, AccessibilityViolation
} from './accessibility-tester';

// Code Quality Gates
export { CodeQualityGates, codeQualityGates } from './code-quality-gates';
export type {
  QualityGateConfig, QualityGateResult, QualityMetric
} from './code-quality-gates';

// Import qaOrchestrator for convenience exports
import { qaOrchestrator } from './qa-orchestrator';

// Convenience exports for common use cases
export const runFullQA = qaOrchestrator.runFullQAAnalysis.bind(qaOrchestrator);
export const runQuickScan = qaOrchestrator.runQuickScan.bind(qaOrchestrator);
export const runSecurityScan = qaOrchestrator.runSecurityOnlyScan.bind(qaOrchestrator);
export const runAccessibilityTest = qaOrchestrator.runAccessibilityOnlyScan.bind(qaOrchestrator);
export const runCodeReview = qaOrchestrator.runCodeReviewOnly.bind(qaOrchestrator);
export const runQualityGates = qaOrchestrator.runQualityGatesOnly.bind(qaOrchestrator);