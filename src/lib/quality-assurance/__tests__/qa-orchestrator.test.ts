/**
 * QA Orchestrator Tests
 * Tests for the main QA orchestration system
 */

import { describe, it, expect, jest, beforeEach, beforeAll } from '@jest/globals';
import * as fs from 'fs';
import { QAOrchestrator } from '../qa-orchestrator';

// Mock file system to prevent ENOENT errors
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  existsSync: jest.fn().mockReturnValue(true),
  readFileSync: jest.fn().mockReturnValue('export const foo = 1; // dummy content returned by jest'),
}));

// AI Code Reviewer
jest.mock('../ai-code-reviewer', () => ({
  AICodeReviewer: jest.fn().mockImplementation(() => ({
    reviewMultipleFiles: jest.fn().mockResolvedValue([
      {
        filePath: 'test.ts',
        overallScore: 90,
        suggestions: [],
        summary: { totalIssues: 0, criticalIssues: 0, securityIssues: 0, performanceIssues: 0 },
        aiAnalysis: 'OK',
      },
    ]),
  })),
}));

// Security Scanner – enthält *scan* UND *generateSecurityReport*!
jest.mock('../security-scanner', () => ({
  SecurityScanner: jest.fn().mockImplementation(() => ({
    scanDependencies: jest.fn().mockResolvedValue({
      timestamp: '2025-01-14T10:00:00Z',
      totalVulnerabilities: 0,
      vulnerabilities: [],
      summary: { critical: 0, high: 0, medium: 0, low: 0 },
      recommendations: [],
      passed: true,
    }),
    scanCode: jest.fn().mockResolvedValue({
      timestamp: '2025-01-14T10:00:00Z',
      totalVulnerabilities: 0,
      vulnerabilities: [],
      summary: { critical: 0, high: 0, medium: 0, low: 0 },
      recommendations: [],
      passed: true,
    }),
    generateSecurityReport: jest.fn().mockReturnValue('# Security OK'),
  })),
}));

// Accessibility
jest.mock('../accessibility-tester', () => ({
  AccessibilityTester: jest.fn().mockImplementation(() => ({
    testMultiplePages: jest.fn().mockResolvedValue([
      {
        url: 'http://example.com',
        timestamp: '2025-01-14T10:00:00Z',
        violations: [],
        passes: 20,
        incomplete: 0,
        inapplicable: 0,
        wcagLevel: 'AA',
        score: 95,
        summary: { critical: 0, serious: 0, moderate: 0, minor: 0 },
        recommendations: [],
        passed: true,
      },
    ]),
    generateAccessibilityReport: jest.fn().mockReturnValue('# Accessibility OK'),
  })),
}));

// Quality Gates
jest.mock('../code-quality-gates', () => ({
  CodeQualityGates: jest.fn().mockImplementation(() => ({
    runQualityGate: jest.fn().mockResolvedValue({
      projectKey: 'test-project',
      timestamp: '2025-01-14T10:00:00Z',
      overallStatus: 'passed',
      qualityScore: 92,
      metrics: [],
      coverage: { lines: 85, statements: 86, branches: 80, functions: 88 },
      duplicatedLines: 1.2,
      maintainabilityRating: 'A',
      reliabilityRating: 'A',
      securityRating: 'A',
      codeSmells: 10,
      bugs: 0,
      vulnerabilities: 0,
      technicalDebt: '30min',
      recommendations: [],
    }),
    generateQualityReport: jest.fn().mockReturnValue('# Quality Gates OK'),
  })),
}));

describe('QAOrchestrator', () => {
  let qaOrchestrator: QAOrchestrator;

  beforeEach(() => {
    jest.clearAllMocks();
    qaOrchestrator = new QAOrchestrator();
  });

  describe('runFullQAAnalysis', () => {
    it('should run all QA checks when enabled', async () => {
      const result = await qaOrchestrator.runFullQAAnalysis(
        ['test.ts'],
        ['https://example.com']
      );

      // Verify result structure
      expect(result).toMatchObject({
        overallStatus: 'passed',
        results: {
          codeReview: expect.any(Array),
          security: expect.any(Object),
          accessibility: expect.any(Array),
          qualityGates: expect.any(Object),
        },
        summary: {
          totalIssues: 0,
          criticalIssues: 0,
          recommendations: expect.any(Array),
        },
        reports: {
          markdown: expect.any(String),
          json: expect.any(String),
        },
      });
    });

    it('should handle disabled QA checks', async () => {
      const config = {
        aiCodeReview: { enabled: false },
        security: { enabled: true },
        accessibility: { enabled: false },
        qualityGates: { enabled: false },
      };

      const result = await qaOrchestrator.runFullQAAnalysis(
        ['test.ts'],
        ['https://example.com'],
        config
      );

      expect(result.results.codeReview).toBeUndefined();
      expect(result.results.security).toBeDefined();
      expect(result.results.accessibility).toBeUndefined();
      expect(result.results.qualityGates).toBeUndefined();
    });

    it('should handle errors gracefully', async () => {
      // Create a new orchestrator with failing security scanner
      const failingOrchestrator = new QAOrchestrator();
      
      // Mock all components to ensure only security fails
      (failingOrchestrator as any).aiCodeReviewer = {
        reviewMultipleFiles: jest.fn().mockResolvedValue([]),
      };
      
      (failingOrchestrator as any).securityScanner = {
        scanDependencies: jest.fn().mockRejectedValue(new Error('Security scan failed')),
        scanCode: jest.fn().mockRejectedValue(new Error('Security scan failed')),
        generateSecurityReport: jest.fn().mockReturnValue('# Security FAIL'),
      };
      
      (failingOrchestrator as any).accessibilityTester = {
        testMultiplePages: jest.fn().mockResolvedValue([]),
        generateAccessibilityReport: jest.fn().mockReturnValue('# Accessibility OK'),
      };
      
      (failingOrchestrator as any).codeQualityGates = {
        runQualityGate: jest.fn().mockResolvedValue({
          overallStatus: 'passed',
          qualityScore: 90,
        }),
        generateQualityReport: jest.fn().mockReturnValue('# Quality OK'),
      };

      const result = await failingOrchestrator.runFullQAAnalysis(['test.ts']);

      expect(result.overallStatus).toBe('failed');
      expect(result.summary.recommendations.some(r => r.includes('QA analysis failed'))).toBe(true);
    });

    it('should calculate correct overall status', async () => {
      // Create a new orchestrator with critical vulnerability
      const criticalOrchestrator = new QAOrchestrator();
      
      // Mock the security scanner with critical vulnerability
      (criticalOrchestrator as any).securityScanner = {
        scanDependencies: jest.fn().mockResolvedValue({
          timestamp: '2025-01-14T10:00:00Z',
          totalVulnerabilities: 1,
          vulnerabilities: [],
          summary: { critical: 1, high: 0, medium: 0, low: 0 },
          recommendations: [],
          passed: false,
        }),
        scanCode: jest.fn().mockResolvedValue({
          timestamp: '2025-01-14T10:00:00Z',
          totalVulnerabilities: 0,
          vulnerabilities: [],
          summary: { critical: 0, high: 0, medium: 0, low: 0 },
          recommendations: [],
          passed: true,
        }),
        generateSecurityReport: jest.fn().mockReturnValue('# Security Issues'),
      };

      const result = await criticalOrchestrator.runFullQAAnalysis(['test.ts']);

      expect(result.overallStatus).toBe('failed');
      expect(result.summary.criticalIssues).toBeGreaterThan(0);
    });
  });

  describe('runQuickScan', () => {
    it('should run only AI code review and security scan', async () => {
      const result = await qaOrchestrator.runQuickScan(['test.ts']);

      expect(result.results.codeReview).toBeDefined();
      expect(result.results.security).toBeDefined();
      expect(result.results.accessibility).toBeUndefined();
      expect(result.results.qualityGates).toBeUndefined();
    });
  });

  describe('utility methods', () => {
    it('should detect file language correctly', () => {
      const orchestrator = qaOrchestrator as any;
      
      expect(orchestrator.detectLanguage('test.ts')).toBe('typescript');
      expect(orchestrator.detectLanguage('test.tsx')).toBe('typescript');
      expect(orchestrator.detectLanguage('test.js')).toBe('javascript');
      expect(orchestrator.detectLanguage('test.jsx')).toBe('javascript');
      expect(orchestrator.detectLanguage('test.py')).toBe('python');
      expect(orchestrator.detectLanguage('test.css')).toBe('css');
      expect(orchestrator.detectLanguage('test.unknown')).toBe('text');
    });

    it('should calculate overall score correctly', () => {
      const orchestrator = qaOrchestrator as any;
      
      const results = {
        codeReview: [{ overallScore: 80 }, { overallScore: 90 }],
        accessibility: [{ score: 85 }],
        qualityGates: { qualityScore: 75 },
        security: { passed: true },
      };

      const score = orchestrator.calculateOverallScore(results);
      
      // Should average: (85 + 85 + 75 + 100) / 4 = 86.25 -> 86
      expect(score).toBe(86);
    });
  });
});