/**
 * Enhanced Risk Assessor Tests
 * Tests for the enhanced risk assessment system
 */

import { EnhancedRiskAssessor, RiskAssessment } from '../enhanced-risk-assessor';
import { ComponentOrigin } from '../types';
import { BackendDependency, RouteUsage } from '../legacy-component-detector';
import * as fs from 'fs/promises';

// Mock fs
jest.mock('fs/promises');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('EnhancedRiskAssessor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock file stats
    mockFs.stat.mockResolvedValue({
      mtime: new Date('2025-01-01T00:00:00.000Z')
    } as any);
  });

  describe('assessRisk', () => {
    it('should classify critical system components as critical risk', async () => {
      const result = await EnhancedRiskAssessor.assessRisk(
        'src/contexts/AuthContext.tsx',
        'unknown',
        [],
        []
      );

      expect(result.riskLevel).toBe('critical');
      expect(result.safeToArchive).toBe(false);
      expect(result.reason).toContain('Critical system component');
      expect(result.confidence).toBeGreaterThan(0.9);
    });

    it('should classify components with migration paths as lower risk', async () => {
      const backendDeps: BackendDependency[] = [{
        type: 'database',
        name: 'supabase',
        isActive: true,
        migrationPath: 'src/services/aws-rds-client.ts'
      }];

      const result = await EnhancedRiskAssessor.assessRisk(
        'src/components/legacy/OldComponent.tsx',
        'supabase',
        backendDeps,
        []
      );

      expect(result.riskLevel).toBe('low');
      expect(result.safeToArchive).toBe(true);
      expect(result.reason).toContain('migration path');
    });

    it('should classify components with Kiro alternatives as lower risk', async () => {
      const routeUsage: RouteUsage[] = [{
        route: '/login',
        isActive: true,
        hasKiroAlternative: true,
        alternativeRoute: '/auth/login',
        usageCount: 1
      }];

      const result = await EnhancedRiskAssessor.assessRisk(
        'src/pages/LoginPage.tsx',
        'unknown',
        [],
        routeUsage
      );

      expect(result.riskLevel).toBe('low');
      expect(result.safeToArchive).toBe(true);
      expect(result.riskFactors.some(f => f.description.includes('alternatives'))).toBe(true);
    });

    it('should classify debug/test components as safe', async () => {
      const result = await EnhancedRiskAssessor.assessRisk(
        'src/pages/dev/TestComponent.tsx',
        'unknown',
        [],
        []
      );

      expect(result.riskLevel).toBe('low');
      expect(result.safeToArchive).toBe(true);
      expect(result.riskFactors.some(f => f.weight < 0)).toBe(true); // Negative weight for safe patterns
    });

    it('should classify recently modified components as higher risk', async () => {
      // Mock recent modification
      mockFs.stat.mockResolvedValue({
        mtime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
      } as any);

      const result = await EnhancedRiskAssessor.assessRisk(
        'src/components/RecentComponent.tsx',
        'unknown',
        [],
        []
      );

      expect(result.riskFactors.some(f => f.type === 'recent_modification')).toBe(true);
    });

    it('should classify old components as safer to archive', async () => {
      // Mock old modification
      mockFs.stat.mockResolvedValue({
        mtime: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000) // 120 days ago
      } as any);

      const result = await EnhancedRiskAssessor.assessRisk(
        'src/components/OldComponent.tsx',
        'unknown',
        [],
        []
      );

      const modificationFactor = result.riskFactors.find(f => f.type === 'recent_modification');
      expect(modificationFactor?.weight).toBeLessThan(0); // Negative weight for old files
    });

    it('should classify high complexity components with higher risk', async () => {
      const complexContent = `
        import React from 'react';
        import { useState, useEffect } from 'react';
        import { useQuery } from '@tanstack/react-query';
        
        export function ComplexComponent() {
          const [state1, setState1] = useState();
          const [state2, setState2] = useState();
          
          const function1 = () => {};
          const function2 = () => {};
          const function3 = () => {};
          
          useEffect(() => {}, []);
          
          return <div>Complex component with many lines and functions</div>;
        }
        
        export const anotherFunction = () => {};
        export const yetAnotherFunction = () => {};
      `;

      const result = await EnhancedRiskAssessor.assessRisk(
        'src/components/ComplexComponent.tsx',
        'unknown',
        [],
        [],
        complexContent
      );

      const usageFactor = result.riskFactors.find(f => f.type === 'high_usage');
      expect(usageFactor).toBeDefined();
    });

    it('should never classify Kiro components as safe to archive', async () => {
      const result = await EnhancedRiskAssessor.assessRisk(
        'src/components/KiroComponent.tsx',
        'kiro',
        [],
        []
      );

      expect(result.safeToArchive).toBe(false);
      expect(result.reason).toContain('Kiro component');
      expect(result.confidence).toBe(1.0);
    });

    it('should provide mitigation suggestions based on risk factors', async () => {
      const backendDeps: BackendDependency[] = [{
        type: 'database',
        name: 'legacy-db',
        isActive: true
        // No migration path
      }];

      const routeUsage: RouteUsage[] = [{
        route: '/legacy/route',
        isActive: true,
        hasKiroAlternative: false,
        usageCount: 1
      }];

      const result = await EnhancedRiskAssessor.assessRisk(
        'src/components/LegacyComponent.tsx',
        'unknown',
        backendDeps,
        routeUsage
      );

      expect(result.mitigationSuggestions).toContain('Create migration paths for backend dependencies');
      expect(result.mitigationSuggestions).toContain('Implement route redirects to Kiro alternatives');
    });
  });

  describe('batchAssessRisk', () => {
    it('should assess multiple components in batch', async () => {
      const components = [
        {
          filePath: 'src/components/Component1.tsx',
          origin: 'unknown' as ComponentOrigin,
          backendDependencies: [],
          routeUsage: []
        },
        {
          filePath: 'src/contexts/AuthContext.tsx',
          origin: 'unknown' as ComponentOrigin,
          backendDependencies: [],
          routeUsage: []
        }
      ];

      const results = await EnhancedRiskAssessor.batchAssessRisk(components);

      expect(results.size).toBe(2);
      expect(results.has('src/components/Component1.tsx')).toBe(true);
      expect(results.has('src/contexts/AuthContext.tsx')).toBe(true);
      
      // AuthContext should be critical
      const authResult = results.get('src/contexts/AuthContext.tsx');
      expect(authResult?.riskLevel).toBe('critical');
    });
  });

  describe('generateRiskReport', () => {
    it('should generate comprehensive risk report', async () => {
      const assessments = new Map<string, RiskAssessment>();
      
      assessments.set('component1', {
        safeToArchive: true,
        reason: 'Safe component',
        riskLevel: 'low',
        riskFactors: [{
          type: 'critical_path',
          severity: 'low',
          description: 'Safe pattern',
          weight: -10
        }],
        mitigationSuggestions: ['Test thoroughly'],
        confidence: 0.8
      });

      assessments.set('component2', {
        safeToArchive: false,
        reason: 'High risk component',
        riskLevel: 'high',
        riskFactors: [{
          type: 'backend_dependency',
          severity: 'high',
          description: 'No migration path',
          weight: 50
        }],
        mitigationSuggestions: ['Create migration paths for backend dependencies'],
        confidence: 0.85
      });

      const report = EnhancedRiskAssessor.generateRiskReport(assessments);

      expect(report.summary.total).toBe(2);
      expect(report.summary.safeToArchive).toBe(1);
      expect(report.summary.requiresReview).toBe(1);
      expect(report.summary.high).toBe(1);
      expect(report.summary.low).toBe(1);
      
      expect(report.recommendations).toContain('Create migration paths for backend dependencies');
      expect(report.topRiskFactors).toHaveLength(2);
    });

    it('should count risk factors correctly', async () => {
      const assessments = new Map<string, RiskAssessment>();
      
      // Add multiple components with same risk factor
      for (let i = 0; i < 3; i++) {
        assessments.set(`component${i}`, {
          safeToArchive: false,
          reason: 'Backend dependency',
          riskLevel: 'medium',
          riskFactors: [{
            type: 'backend_dependency',
            severity: 'medium',
            description: 'Backend dependency without migration',
            weight: 30
          }],
          mitigationSuggestions: ['Create migration paths'],
          confidence: 0.75
        });
      }

      const report = EnhancedRiskAssessor.generateRiskReport(assessments);

      const backendDepFactor = report.topRiskFactors.find(f => 
        f.factor === 'backend_dependency:medium'
      );
      expect(backendDepFactor?.count).toBe(3);
    });
  });

  describe('risk factor assessment', () => {
    it('should detect development routes as low risk', async () => {
      const routeUsage: RouteUsage[] = [{
        route: '/dev/debug',
        isActive: true,
        hasKiroAlternative: false,
        usageCount: 1
      }];

      const result = await EnhancedRiskAssessor.assessRisk(
        'src/pages/DevPage.tsx',
        'unknown',
        [],
        routeUsage
      );

      const routeFactor = result.riskFactors.find(f => f.type === 'active_route');
      expect(routeFactor?.severity).toBe('low');
      expect(routeFactor?.description).toContain('development/debug routes');
    });

    it('should handle file stat errors gracefully', async () => {
      mockFs.stat.mockRejectedValue(new Error('File not found'));

      const result = await EnhancedRiskAssessor.assessRisk(
        'src/components/MissingComponent.tsx',
        'unknown',
        [],
        []
      );

      const modificationFactor = result.riskFactors.find(f => f.type === 'recent_modification');
      expect(modificationFactor?.description).toContain('Cannot determine modification date');
    });

    it('should provide confidence scores', async () => {
      const result = await EnhancedRiskAssessor.assessRisk(
        'src/components/SimpleComponent.tsx',
        'unknown',
        [],
        []
      );

      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('edge cases', () => {
    it('should handle components with no risk factors', async () => {
      const result = await EnhancedRiskAssessor.assessRisk(
        'src/components/SimpleComponent.tsx',
        'unknown',
        [],
        []
      );

      expect(result).toBeDefined();
      expect(result.riskLevel).toBe('low');
      expect(result.safeToArchive).toBe(true);
    });

    it('should handle components with mixed risk factors', async () => {
      const backendDeps: BackendDependency[] = [{
        type: 'database',
        name: 'supabase',
        isActive: true,
        migrationPath: 'src/services/aws-rds-client.ts'
      }];

      const routeUsage: RouteUsage[] = [{
        route: '/legacy/route',
        isActive: true,
        hasKiroAlternative: false,
        usageCount: 1
      }];

      const result = await EnhancedRiskAssessor.assessRisk(
        'src/pages/dev/MixedComponent.tsx', // Safe pattern
        'supabase',
        backendDeps,
        routeUsage
      );

      expect(result.riskFactors.length).toBeGreaterThan(1);
      expect(result.riskFactors.some(f => f.weight > 0)).toBe(true); // Some positive risk
      expect(result.riskFactors.some(f => f.weight < 0)).toBe(true); // Some negative risk (safe patterns)
    });
  });
});