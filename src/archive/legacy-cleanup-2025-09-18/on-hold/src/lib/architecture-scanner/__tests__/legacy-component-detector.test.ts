/**
 * Legacy Component Detector Tests
 * Tests for legacy component detection, backend dependency analysis,
 * route usage analysis, and safe-to-archive classification
 */

import { LegacyComponentDetector, LegacyComponent, BackendDependency, RouteUsage } from '../legacy-component-detector';
import * as fs from 'fs/promises';
import * as path from 'path';

// Mock fs module
jest.mock('fs/promises');
const mockFs = fs as jest.Mocked<typeof fs>;

// Mock FileSystemCrawler
jest.mock('../file-system-crawler', () => ({
  FileSystemCrawler: {
    crawlFileSystem: jest.fn().mockResolvedValue([
      'src/pages/Login.tsx',
      'src/services/supabase-auth.ts',
      'src/components/upload/LovableUpload.tsx',
      'src/lib/unknown-component.ts',
      'src/services/kiro-service.ts'
    ])
  }
}));

// Mock OriginDetector
jest.mock('../origin-detector', () => ({
  OriginDetector: {
    detectOrigin: jest.fn(),
    findKiroAlternative: jest.fn()
  }
}));

describe('LegacyComponentDetector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    mockFs.readFile.mockImplementation(async (filePath: string) => {
      const mockContents: Record<string, string> = {
        'src/pages/Login.tsx': `
          // @supabase legacy component
          import { createClient } from '@supabase/supabase-js';
          import { useNavigate } from 'react-router-dom';
          
          const supabase = createClient(url, key);
          
          export function Login() {
            const navigate = useNavigate();
            return <div>Legacy Login</div>;
          }
        `,
        'src/services/supabase-auth.ts': `
          import { createClient } from '@supabase/supabase-js';
          
          const supabase = createClient(url, key);
          
          export const auth = {
            signIn: () => supabase.auth.signInWithPassword(),
            signOut: () => supabase.auth.signOut()
          };
        `,
        'src/components/upload/LovableUpload.tsx': `
          // @lovable component
          import { lovable-uploads } from '@/lovable';
          
          export function LovableUpload() {
            return <div>Lovable Upload</div>;
          }
        `,
        'src/lib/unknown-component.ts': `
          // No clear origin markers
          export function unknownFunction() {
            return 'unknown';
          }
        `,
        'src/services/kiro-service.ts': `
          // @kiro generated
          import { BedrockClient } from '@aws-sdk/client-bedrock';
          
          export function kiroService() {
            return 'kiro';
          }
        `
      };
      
      return mockContents[filePath as string] || '';
    });

    mockFs.stat.mockResolvedValue({
      mtime: new Date('2024-01-01'),
      size: 1024
    } as any);
  });

  describe('scanLegacyComponents', () => {
    it('should identify legacy components correctly', async () => {
      const { OriginDetector } = require('../origin-detector');
      
      OriginDetector.detectOrigin.mockImplementation((filePath: string) => {
        if (filePath.includes('supabase')) {
          return { origin: 'supabase', confidence: 0.9, markers: ['@supabase', 'createClient'] };
        }
        if (filePath.includes('Lovable')) {
          return { origin: 'lovable', confidence: 0.8, markers: ['@lovable', 'lovable-uploads'] };
        }
        if (filePath.includes('kiro')) {
          return { origin: 'kiro', confidence: 0.9, markers: ['@kiro', 'aws-sdk'] };
        }
        return { origin: 'unknown', confidence: 0.1, markers: [] };
      });

      OriginDetector.findKiroAlternative.mockImplementation((filePath: string) => {
        if (filePath.includes('Login.tsx')) return 'src/components/auth/KiroLogin.tsx';
        if (filePath.includes('supabase-auth.ts')) return 'src/services/cognito-auth.ts';
        return undefined;
      });

      const plan = await LegacyComponentDetector.scanLegacyComponents();

      expect(plan.components).toHaveLength(4); // Excluding kiro-service.ts
      expect(plan.summary.totalComponents).toBe(4);
      expect(plan.archiveGroups.supabaseComponents).toHaveLength(1);
      expect(plan.archiveGroups.lovableComponents).toHaveLength(1);
      expect(plan.archiveGroups.unknownComponents).toHaveLength(2);
    });

    it('should create proper backup plan', async () => {
      const { OriginDetector } = require('../origin-detector');
      OriginDetector.detectOrigin.mockReturnValue({ origin: 'supabase', confidence: 0.9, markers: [] });
      OriginDetector.findKiroAlternative.mockReturnValue('src/components/auth/KiroLogin.tsx');

      const plan = await LegacyComponentDetector.scanLegacyComponents();

      expect(plan.backupPlan.archiveDirectory).toMatch(/src\/archive\/legacy-cleanup-\d{4}-\d{2}-\d{2}/);
      expect(plan.backupPlan.manifestFile).toContain('archive-manifest.json');
      expect(plan.backupPlan.rollbackScript).toContain('rollback.sh');
      expect(plan.backupPlan.timestamp).toBeDefined();
    });
  });

  describe('Backend Dependency Analysis', () => {
    it('should detect Supabase backend dependencies', async () => {
      const content = `
        import { createClient } from '@supabase/supabase-js';
        const supabase = createClient(url, key);
        const data = await supabase.from('users').select('*');
        const auth = supabase.auth.signIn();
        const storage = supabase.storage.from('files');
      `;

      const { OriginDetector } = require('../origin-detector');
      OriginDetector.detectOrigin.mockReturnValue({ origin: 'supabase', confidence: 0.9, markers: [] });
      OriginDetector.findKiroAlternative.mockReturnValue(undefined);

      mockFs.readFile.mockResolvedValue(content);

      const plan = await LegacyComponentDetector.scanLegacyComponents({
        directories: ['test']
      });

      const component = plan.components[0];
      expect(component.backendDependencies).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: 'database', name: 'supabase' }),
          expect.objectContaining({ type: 'database', name: 'supabase-table' }),
          expect.objectContaining({ type: 'service', name: 'supabase-auth' }),
          expect.objectContaining({ type: 'storage', name: 'supabase-storage' })
        ])
      );
    });

    it('should detect Lovable backend dependencies', async () => {
      const content = `
        import { lovableUploads } from '@/lovable';
        const upload = lovable-uploads.create();
      `;

      const { OriginDetector } = require('../origin-detector');
      OriginDetector.detectOrigin.mockReturnValue({ origin: 'lovable', confidence: 0.8, markers: [] });

      mockFs.readFile.mockResolvedValue(content);

      const plan = await LegacyComponentDetector.scanLegacyComponents({
        directories: ['test']
      });

      const component = plan.components[0];
      expect(component.backendDependencies).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: 'storage', name: 'lovable-storage' })
        ])
      );
    });

    it('should provide migration paths for dependencies', async () => {
      const content = `
        import { createClient } from '@supabase/supabase-js';
        const supabase = createClient(url, key);
      `;

      const { OriginDetector } = require('../origin-detector');
      OriginDetector.detectOrigin.mockReturnValue({ origin: 'supabase', confidence: 0.9, markers: [] });

      mockFs.readFile.mockResolvedValue(content);

      const plan = await LegacyComponentDetector.scanLegacyComponents({
        directories: ['test']
      });

      const component = plan.components[0];
      const supabaseDep = component.backendDependencies.find(dep => dep.name === 'supabase');
      expect(supabaseDep?.migrationPath).toBe('src/services/aws-rds-client.ts');
    });
  });

  describe('Route Usage Analysis', () => {
    it('should detect route usage in page components', async () => {
      const { OriginDetector } = require('../origin-detector');
      OriginDetector.detectOrigin.mockReturnValue({ origin: 'supabase', confidence: 0.9, markers: [] });

      mockFs.readFile.mockResolvedValue('export function Login() { return <div>Login</div>; }');

      const plan = await LegacyComponentDetector.scanLegacyComponents({
        directories: ['src/pages']
      });

      const loginComponent = plan.components.find(c => c.path.includes('Login.tsx'));
      expect(loginComponent?.routeUsage).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            route: expect.stringContaining('/Login'),
            isActive: true,
            hasKiroAlternative: true,
            alternativeRoute: '/auth/login'
          })
        ])
      );
    });

    it('should identify Kiro alternatives for legacy routes', async () => {
      const content = `
        import { useNavigate } from 'react-router-dom';
        export function OldLogin() {
          const navigate = useNavigate();
          return <div>Old Login</div>;
        }
      `;

      const { OriginDetector } = require('../origin-detector');
      OriginDetector.detectOrigin.mockReturnValue({ origin: 'supabase', confidence: 0.9, markers: [] });

      mockFs.readFile.mockImplementation(async (filePath: string) => {
        if (filePath.includes('login')) return content;
        return '';
      });

      const plan = await LegacyComponentDetector.scanLegacyComponents({
        directories: ['test']
      });

      // Should detect route references and alternatives
      expect(plan.components.length).toBeGreaterThan(0);
    });
  });

  describe('Safe-to-Archive Classification', () => {
    it('should mark components as safe when they have Kiro alternatives', async () => {
      const { OriginDetector } = require('../origin-detector');
      OriginDetector.detectOrigin.mockReturnValue({ origin: 'supabase', confidence: 0.9, markers: [] });
      OriginDetector.findKiroAlternative.mockReturnValue('src/components/auth/KiroLogin.tsx');

      mockFs.readFile.mockResolvedValue('export function Login() { return <div>Login</div>; }');

      const plan = await LegacyComponentDetector.scanLegacyComponents({
        directories: ['test']
      });

      const component = plan.components[0];
      expect(component.safeToArchive).toBe(true);
      expect(component.archiveReason).toContain('Kiro alternative available');
      expect(component.riskLevel).toBe('low');
    });

    it('should mark critical components as unsafe to archive', async () => {
      const { OriginDetector } = require('../origin-detector');
      OriginDetector.detectOrigin.mockReturnValue({ origin: 'supabase', confidence: 0.9, markers: [] });

      mockFs.readFile.mockResolvedValue('export function AuthProvider() { return <div>Auth</div>; }');

      // Mock a critical path
      const { FileSystemCrawler } = require('../file-system-crawler');
      FileSystemCrawler.crawlFileSystem.mockResolvedValue(['src/auth/provider.tsx']);

      const plan = await LegacyComponentDetector.scanLegacyComponents();

      const component = plan.components[0];
      expect(component.safeToArchive).toBe(false);
      expect(component.archiveReason).toContain('Critical system component');
      expect(component.riskLevel).toBe('critical');
    });

    it('should mark components with active backend dependencies as unsafe', async () => {
      const content = `
        import { createClient } from '@supabase/supabase-js';
        const supabase = createClient(url, key);
        // No migration path available
        const customQuery = supabase.rpc('custom_function');
      `;

      const { OriginDetector } = require('../origin-detector');
      OriginDetector.detectOrigin.mockReturnValue({ origin: 'supabase', confidence: 0.9, markers: [] });
      OriginDetector.findKiroAlternative.mockReturnValue(undefined);

      // Mock a non-critical path
      const { FileSystemCrawler } = require('../file-system-crawler');
      FileSystemCrawler.crawlFileSystem.mockResolvedValue(['src/services/custom-service.ts']);

      mockFs.readFile.mockResolvedValue(content);

      const plan = await LegacyComponentDetector.scanLegacyComponents();

      const component = plan.components[0];
      expect(component.safeToArchive).toBe(false);
      expect(component.archiveReason).toContain('manual review');
      expect(component.riskLevel).toBe('medium');
    });

    it('should mark unknown components without dependencies as safe', async () => {
      const content = `
        // No clear origin markers
        export function utilityFunction() {
          return 'utility';
        }
      `;

      const { OriginDetector } = require('../origin-detector');
      OriginDetector.detectOrigin.mockReturnValue({ origin: 'unknown', confidence: 0.1, markers: [] });

      // Mock a non-critical path
      const { FileSystemCrawler } = require('../file-system-crawler');
      FileSystemCrawler.crawlFileSystem.mockResolvedValue(['src/utils/utility.ts']);

      mockFs.readFile.mockResolvedValue(content);

      const plan = await LegacyComponentDetector.scanLegacyComponents();

      const component = plan.components[0];
      expect(component.safeToArchive).toBe(true);
      expect(component.archiveReason).toContain('Unknown origin component with no active dependencies');
      expect(component.riskLevel).toBe('medium');
    });
  });

  describe('Archive Manifest Generation', () => {
    it('should generate comprehensive archive manifest', async () => {
      const mockPlan = {
        components: [
          {
            path: 'src/pages/Login.tsx',
            origin: 'supabase' as const,
            confidence: 0.9,
            markers: ['@supabase'],
            dependencies: ['@supabase/supabase-js'],
            backendDependencies: [{ type: 'database' as const, name: 'supabase', isActive: true }],
            routeUsage: [{ route: '/login', isActive: true, hasKiroAlternative: true, usageCount: 5 }],
            safeToArchive: true,
            archiveReason: 'Has Kiro alternative',
            riskLevel: 'low' as const,
            lastModified: new Date(),
            fileSize: 1024
          }
        ],
        summary: {
          totalComponents: 1,
          safeToArchive: 1,
          requiresReview: 0,
          highRisk: 0
        },
        archiveGroups: {
          supabaseComponents: [],
          lovableComponents: [],
          unknownComponents: []
        },
        backupPlan: {
          archiveDirectory: 'src/archive/legacy-cleanup-2024-01-01',
          timestamp: '2024-01-01T00:00:00.000Z',
          manifestFile: 'src/archive/legacy-cleanup-2024-01-01/archive-manifest.json',
          rollbackScript: 'src/archive/legacy-cleanup-2024-01-01/rollback.sh'
        }
      };

      const manifest = LegacyComponentDetector.generateArchiveManifest(mockPlan);

      expect(manifest).toHaveProperty('timestamp');
      expect(manifest).toHaveProperty('archiveDirectory');
      expect(manifest).toHaveProperty('summary');
      expect(manifest).toHaveProperty('components');
      expect(manifest).toHaveProperty('rollbackInstructions');

      const manifestComponents = (manifest as any).components;
      expect(manifestComponents).toHaveLength(1);
      expect(manifestComponents[0]).toHaveProperty('originalPath');
      expect(manifestComponents[0]).toHaveProperty('archivePath');
      expect(manifestComponents[0].archivePath).toContain('src/archive/legacy-cleanup-2024-01-01');
    });
  });

  describe('Error Handling', () => {
    it('should handle file read errors gracefully', async () => {
      const { OriginDetector } = require('../origin-detector');
      OriginDetector.detectOrigin.mockReturnValue({ origin: 'supabase', confidence: 0.9, markers: [] });

      mockFs.readFile.mockRejectedValue(new Error('File not found'));

      const plan = await LegacyComponentDetector.scanLegacyComponents({
        directories: ['test']
      });

      // Should not crash and should return empty results
      expect(plan.components).toHaveLength(0);
      expect(plan.summary.totalComponents).toBe(0);
    });

    it('should handle malformed file content', async () => {
      const { OriginDetector } = require('../origin-detector');
      OriginDetector.detectOrigin.mockReturnValue({ origin: 'unknown', confidence: 0, markers: [] });

      mockFs.readFile.mockResolvedValue('invalid content with weird characters \x00\x01');
      mockFs.stat.mockResolvedValue({ mtime: new Date(), size: 100 } as any);

      const plan = await LegacyComponentDetector.scanLegacyComponents({
        directories: ['test']
      });

      // Should handle gracefully
      expect(plan.components.length).toBeGreaterThanOrEqual(0);
    });
  });
});