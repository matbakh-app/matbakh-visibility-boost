/**
 * Component Classification System Tests
 */

import { ComponentClassificationSystem } from '../lib/architecture-scanner/component-map';
import { defaultRiskMatrix } from '../lib/architecture-scanner/risk-matrix';
import { ComponentInfo } from '../lib/architecture-scanner/types';

describe('ComponentClassificationSystem', () => {
  let classifier: ComponentClassificationSystem;

  beforeEach(() => {
    classifier = new ComponentClassificationSystem();
  });

  describe('Component Type Detection', () => {
    test('should detect page components', () => {
      const component = {
        path: 'src/pages/Login.tsx',
        content: 'export default function Login() {}',
        size: 1000,
        lastModified: new Date()
      };

      // Access private method for testing
      const type = (classifier as any).detectComponentType(component.path);
      expect(type).toBe('Page');
    });

    test('should detect UI components', () => {
      const component = {
        path: 'src/components/Button.tsx',
        content: 'export const Button = () => {}',
        size: 500,
        lastModified: new Date()
      };

      const type = (classifier as any).detectComponentType(component.path);
      expect(type).toBe('UI');
    });

    test('should detect hooks', () => {
      const component = {
        path: 'src/hooks/useAuth.ts',
        content: 'export function useAuth() {}',
        size: 800,
        lastModified: new Date()
      };

      const type = (classifier as any).detectComponentType(component.path);
      expect(type).toBe('Hook');
    });

    test('should detect services', () => {
      const component = {
        path: 'src/services/api.ts',
        content: 'export class ApiService {}',
        size: 1200,
        lastModified: new Date()
      };

      const type = (classifier as any).detectComponentType(component.path);
      expect(type).toBe('Service');
    });

    test('should handle unknown types', () => {
      const component = {
        path: 'src/random/file.ts',
        content: 'export const something = {}',
        size: 300,
        lastModified: new Date()
      };

      const type = (classifier as any).detectComponentType(component.path);
      expect(type).toBe('Unknown');
    });
  });

  describe('Kiro Alternative Detection', () => {
    test('should detect direct mapping alternatives', () => {
      // The constructor initializes default alternatives, so UploadPage should be found
      const hasAlternative = (classifier as any).hasKiroAlternative('UploadPage');
      expect(hasAlternative).toBe(true);
    });

    test('should detect pattern-based alternatives', () => {
      const hasAlternative = (classifier as any).hasKiroAlternative('KiroLoginForm');
      expect(hasAlternative).toBe(true);
    });

    test('should return false for components without alternatives', () => {
      const hasAlternative = (classifier as any).hasKiroAlternative('RandomComponent');
      expect(hasAlternative).toBe(false);
    });
  });

  describe('String Similarity', () => {
    test('should calculate similarity correctly', () => {
      const similarity = (classifier as any).calculateSimilarity('LoginPage', 'LoginForm');
      expect(similarity).toBeGreaterThan(0.5);
      expect(similarity).toBeLessThan(1);
    });

    test('should return 1 for identical strings', () => {
      const similarity = (classifier as any).calculateSimilarity('test', 'test');
      expect(similarity).toBe(1);
    });

    test('should return low similarity for different strings', () => {
      const similarity = (classifier as any).calculateSimilarity('abc', 'xyz');
      expect(similarity).toBeLessThan(0.5);
    });
  });

  describe('Usage Determination', () => {
    test('should identify active components', () => {
      const usageData = new Map([
        ['src/components/Button.tsx', { importedBy: ['src/pages/Home.tsx'], imports: [] }]
      ]);

      const usage = (classifier as any).determineUsage('src/components/Button.tsx', usageData);
      expect(usage).toBe('active');
    });

    test('should identify unused components', () => {
      const usageData = new Map([
        ['src/components/Unused.tsx', { importedBy: [], imports: [] }]
      ]);

      const usage = (classifier as any).determineUsage('src/components/Unused.tsx', usageData);
      expect(usage).toBe('unused');
    });

    test('should identify indirect components', () => {
      const usageData = new Map([
        ['src/utils/helper.ts', { importedBy: [], imports: ['lodash'] }]
      ]);

      const usage = (classifier as any).determineUsage('src/utils/helper.ts', usageData);
      expect(usage).toBe('indirect');
    });
  });

  describe('Archive Candidate Detection', () => {
    test('should identify unused components as archive candidates', () => {
      const component = {
        usage: 'unused',
        origin: 'Kiro',
        kiroAlternative: false,
        riskLevel: 'medium',
        testCoverage: true
      };

      const isCandidate = (classifier as any).isArchiveCandidate(component);
      expect(isCandidate).toBe(true);
    });

    test('should identify Supabase components with Kiro alternatives', () => {
      const component = {
        usage: 'active',
        origin: 'Supabase',
        kiroAlternative: true,
        riskLevel: 'medium',
        testCoverage: true
      };

      const isCandidate = (classifier as any).isArchiveCandidate(component);
      expect(isCandidate).toBe(true);
    });

    test('should not archive critical active components', () => {
      const component = {
        usage: 'active',
        origin: 'Supabase',
        kiroAlternative: false,
        riskLevel: 'critical',
        testCoverage: true
      };

      const isCandidate = (classifier as any).isArchiveCandidate(component);
      expect(isCandidate).toBe(false);
    });
  });
});

describe('Risk Matrix', () => {
  describe('Risk Score Calculation', () => {
    test('should calculate high risk for Supabase components without tests', () => {
      const component = {
        origin: 'Supabase',
        testCoverage: false,
        kiroAlternative: false,
        depsOut: ['dep1', 'dep2'],
        type: 'Page'
      };

      const score = defaultRiskMatrix.calculateRiskScore(component);
      expect(score).toBeGreaterThan(10);
    });

    test('should calculate low risk for Kiro components with tests', () => {
      const component = {
        origin: 'Kiro',
        testCoverage: true,
        kiroAlternative: true,
        depsOut: [],
        type: 'UI'
      };

      const score = defaultRiskMatrix.calculateRiskScore(component);
      expect(score).toBeLessThan(5);
    });

    test('should penalize high dependency count', () => {
      const componentLowDeps = {
        origin: 'Unknown',
        testCoverage: true,
        kiroAlternative: true,
        depsOut: ['dep1'],
        type: 'Utility'
      };

      const componentHighDeps = {
        ...componentLowDeps,
        depsOut: Array(25).fill('dep').map((d, i) => `${d}${i}`)
      };

      const lowScore = defaultRiskMatrix.calculateRiskScore(componentLowDeps);
      const highScore = defaultRiskMatrix.calculateRiskScore(componentHighDeps);
      
      expect(highScore).toBeGreaterThan(lowScore);
    });
  });

  describe('Risk Level Determination', () => {
    test('should return correct risk levels', () => {
      expect(defaultRiskMatrix.getRiskLevel(2)).toBe('low');     // 0-4 = low
      expect(defaultRiskMatrix.getRiskLevel(7)).toBe('medium');  // 5-9 = medium  
      expect(defaultRiskMatrix.getRiskLevel(12)).toBe('high');   // 10-14 = high
      expect(defaultRiskMatrix.getRiskLevel(20)).toBe('critical'); // 15+ = critical
    });
  });

  describe('Risk Breakdown', () => {
    test('should provide detailed risk breakdown', () => {
      const component = {
        origin: 'Supabase',
        testCoverage: false,
        kiroAlternative: false,
        depsOut: ['dep1', 'dep2'],
        type: 'Page'
      };

      const breakdown = defaultRiskMatrix.getRiskBreakdown(component);
      
      expect(breakdown).toBeInstanceOf(Array);
      expect(breakdown.length).toBeGreaterThan(0);
      expect(breakdown[0]).toHaveProperty('criterion');
      expect(breakdown[0]).toHaveProperty('score');
      expect(breakdown[0]).toHaveProperty('weight');
      expect(breakdown[0]).toHaveProperty('contribution');
    });
  });

  describe('Top Risk Contributors', () => {
    test('should identify top risk contributors', () => {
      const component = {
        origin: 'Supabase',
        testCoverage: false,
        kiroAlternative: false,
        depsOut: Array(15).fill('dep').map((d, i) => `${d}${i}`),
        type: 'Page'
      };

      const contributors = defaultRiskMatrix.getTopRiskContributors(component, 3);
      
      expect(contributors).toBeInstanceOf(Array);
      expect(contributors.length).toBeLessThanOrEqual(3);
      
      if (contributors.length > 0) {
        expect(contributors[0]).toHaveProperty('criterion');
        expect(contributors[0]).toHaveProperty('contribution');
        expect(contributors[0]).toHaveProperty('percentage');
        expect(contributors[0].percentage).toBeGreaterThan(0);
      }
    });
  });
});